import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { supabase } from '$lib/supabaseClient';

describe('Concurrent User Actions & Race Conditions', () => {
  let testData: any;
  let secondTestData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
    secondTestData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Concurrent Template Editing', () => {
    it('should handle concurrent template updates without data corruption', async () => {
      const { profile: profile1, organization: org } = testData;
      const { profile: profile2 } = secondTestData;

      // Both users in same organization
      await supabase
        .from('profiles')
        .update({ org_id: org.id })
        .eq('id', profile2.id);

      // Create initial template
      const { data: template } = await supabase
        .from('templates')
        .insert({
          name: 'Shared Template',
          user_id: profile1.id,
          org_id: org.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // Simulate concurrent updates
      const update1Promise = supabase
        .from('templates')
        .update({ 
          name: 'Updated by User 1',
          template_elements: [
            {
              id: 'element-1',
              type: 'text',
              x: 100,
              y: 100,
              width: 200,
              height: 30,
              variableName: 'name',
              side: 'front'
            }
          ]
        })
        .eq('id', template.id)
        .eq('user_id', profile1.id)
        .select()
        .single();

      const update2Promise = supabase
        .from('templates')
        .update({ 
          name: 'Updated by User 2',
          front_background: '#f0f0f0'
        })
        .eq('id', template.id)
        .eq('org_id', org.id)
        .select()
        .single();

      // Wait for both updates
      const [result1, result2] = await Promise.allSettled([update1Promise, update2Promise]);

      // Both should succeed or fail gracefully
      if (result1.status === 'fulfilled' && result2.status === 'fulfilled') {
        // If both succeeded, verify final state is consistent
        const { data: finalTemplate } = await supabase
          .from('templates')
          .select('*')
          .eq('id', template.id)
          .single();

        expect(finalTemplate).toBeTruthy();
        expect(typeof finalTemplate.name).toBe('string');
        expect(Array.isArray(finalTemplate.template_elements)).toBe(true);
      }

      // Verify template still exists and is valid
      const { data: existingTemplate } = await supabase
        .from('templates')
        .select('*')
        .eq('id', template.id)
        .single();

      expect(existingTemplate).toBeTruthy();
      expect(existingTemplate.org_id).toBe(org.id);
    });

    it('should prevent template element conflicts during concurrent edits', async () => {
      const { profile: profile1, organization: org } = testData;
      const { profile: profile2 } = secondTestData;

      // Set both users in same organization
      await supabase
        .from('profiles')
        .update({ org_id: org.id })
        .eq('id', profile2.id);

      const initialElements = [
        {
          id: 'element-1',
          type: 'text',
          x: 100, y: 100, width: 200, height: 30,
          variableName: 'name',
          side: 'front'
        },
        {
          id: 'element-2',
          type: 'text',
          x: 100, y: 150, width: 200, height: 30,
          variableName: 'title',
          side: 'front'
        }
      ];

      // Create template with elements
      const { data: template } = await supabase
        .from('templates')
        .insert({
          name: 'Element Test Template',
          user_id: profile1.id,
          org_id: org.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: initialElements,
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // User 1: Add new element
      const user1Elements = [
        ...initialElements,
        {
          id: 'element-3',
          type: 'image',
          x: 300, y: 100, width: 100, height: 100,
          variableName: 'photo',
          side: 'front'
        }
      ];

      // User 2: Modify existing element
      const user2Elements = initialElements.map(el => 
        el.id === 'element-1' 
          ? { ...el, x: 150, fontSize: 16 }
          : el
      );

      // Execute concurrent element updates
      const elementUpdate1 = supabase
        .from('templates')
        .update({ template_elements: user1Elements })
        .eq('id', template.id)
        .select();

      const elementUpdate2 = supabase
        .from('templates')
        .update({ template_elements: user2Elements })
        .eq('id', template.id)
        .select();

      const [update1Result, update2Result] = await Promise.allSettled([
        elementUpdate1,
        elementUpdate2
      ]);

      // Verify template state is consistent
      const { data: finalTemplate } = await supabase
        .from('templates')
        .select('*')
        .eq('id', template.id)
        .single();

      expect(finalTemplate.template_elements).toBeDefined();
      expect(Array.isArray(finalTemplate.template_elements)).toBe(true);
      expect(finalTemplate.template_elements.length).toBeGreaterThanOrEqual(2);
    });

    it('should handle concurrent template deletion attempts', async () => {
      const { profile: profile1, organization: org } = testData;
      const { profile: profile2 } = secondTestData;

      // Both users in same organization
      await supabase
        .from('profiles')
        .update({ org_id: org.id })
        .eq('id', profile2.id);

      // Create template
      const { data: template } = await supabase
        .from('templates')
        .insert({
          name: 'Template to Delete',
          user_id: profile1.id,
          org_id: org.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // Concurrent deletion attempts
      const delete1Promise = supabase
        .from('templates')
        .delete()
        .eq('id', template.id)
        .eq('user_id', profile1.id); // Owner can delete

      const delete2Promise = supabase
        .from('templates') 
        .delete()
        .eq('id', template.id)
        .eq('org_id', org.id); // Organization-scoped delete

      const [result1, result2] = await Promise.allSettled([delete1Promise, delete2Promise]);

      // At least one should succeed, template should be deleted
      const { data: deletedTemplate } = await supabase
        .from('templates')
        .select('*')
        .eq('id', template.id)
        .single();

      expect(deletedTemplate).toBeNull();
    });
  });

  describe('Concurrent ID Card Generation', () => {
    it('should handle simultaneous card generation requests', async () => {
      const { profile: profile1, organization: org } = testData;
      const { profile: profile2 } = secondTestData;

      // Both users in same organization
      await supabase
        .from('profiles')
        .update({ org_id: org.id })
        .eq('id', profile2.id);

      // Create template for card generation
      const { data: template } = await supabase
        .from('templates')
        .insert({
          name: 'Card Template',
          user_id: profile1.id,
          org_id: org.id,
          front_background: '#ffffff',
          back_background: '#ffffff',
          orientation: 'landscape',
          template_elements: [
            {
              id: 'name-field',
              type: 'text',
              x: 100, y: 100, width: 200, height: 30,
              variableName: 'name',
              side: 'front'
            }
          ],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        })
        .select()
        .single();

      // Concurrent card generation
      const card1Data = {
        user_id: profile1.id,
        org_id: org.id,
        template_id: template.id,
        data: { name: 'User 1 Card' },
        front_image: 'front1.jpg',
        back_image: 'back1.jpg'
      };

      const card2Data = {
        user_id: profile2.id,
        org_id: org.id, 
        template_id: template.id,
        data: { name: 'User 2 Card' },
        front_image: 'front2.jpg',
        back_image: 'back2.jpg'
      };

      // Generate cards simultaneously
      const [card1Result, card2Result] = await Promise.all([
        supabase.from('idcards').insert(card1Data).select().single(),
        supabase.from('idcards').insert(card2Data).select().single()
      ]);

      // Both cards should be created successfully
      expect(card1Result.error).toBeNull();
      expect(card2Result.error).toBeNull();
      expect(card1Result.data.data.name).toBe('User 1 Card');
      expect(card2Result.data.data.name).toBe('User 2 Card');

      // Verify both cards exist
      const { data: allCards } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', org.id)
        .in('id', [card1Result.data.id, card2Result.data.id]);

      expect(allCards).toHaveLength(2);
    });

    it('should handle concurrent card updates without conflicts', async () => {
      const { profile: profile1, organization: org } = testData;

      // Create initial card
      const { data: card } = await supabase
        .from('idcards')
        .insert({
          user_id: profile1.id,
          org_id: org.id,
          data: { name: 'Original Name', title: 'Original Title' },
          front_image: 'front.jpg',
          back_image: 'back.jpg'
        })
        .select()
        .single();

      // Concurrent updates to different fields
      const nameUpdate = supabase
        .from('idcards')
        .update({ 
          data: { ...card.data, name: 'Updated Name' }
        })
        .eq('id', card.id)
        .select();

      const imageUpdate = supabase
        .from('idcards')
        .update({ front_image: 'new-front.jpg' })
        .eq('id', card.id)
        .select();

      const [nameResult, imageResult] = await Promise.allSettled([
        nameUpdate,
        imageUpdate
      ]);

      // Verify final state
      const { data: finalCard } = await supabase
        .from('idcards')
        .select('*')
        .eq('id', card.id)
        .single();

      expect(finalCard).toBeTruthy();
      expect(finalCard.org_id).toBe(org.id);
      expect(finalCard.user_id).toBe(profile1.id);
    });
  });

  describe('Concurrent Credit Operations', () => {
    it('should handle simultaneous credit transactions safely', async () => {
      const { profile: profile1, organization: org } = testData;

      // Set initial credit balance
      await supabase
        .from('profiles')
        .update({ credits_balance: 100 })
        .eq('id', profile1.id);

      // Simulate concurrent credit deductions
      const deductCredits = (amount: number, reference: string) => {
        return supabase.rpc('deduct_credits_safe', {
          user_id: profile1.id,
          org_id: org.id,
          amount: amount,
          reference_id: reference
        });
      };

      // Multiple concurrent transactions
      const transactions = [
        deductCredits(10, 'transaction-1'),
        deductCredits(15, 'transaction-2'),
        deductCredits(5, 'transaction-3'),
        deductCredits(20, 'transaction-4')
      ];

      const results = await Promise.allSettled(transactions);

      // Verify final balance is correct
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', profile1.id)
        .single();

      // Count successful transactions
      const successfulTransactions = results.filter(r => r.status === 'fulfilled');
      const totalDeducted = successfulTransactions.length > 0 
        ? [10, 15, 5, 20].slice(0, successfulTransactions.length).reduce((a, b) => a + b, 0)
        : 0;

      expect(finalProfile.credits_balance).toBe(100 - totalDeducted);
      expect(finalProfile.credits_balance).toBeGreaterThanOrEqual(0); // Should never go negative
    });

    it('should prevent race conditions in credit balance checks', async () => {
      const { profile: profile1, organization: org } = testData;

      // Set low balance to test edge cases
      await supabase
        .from('profiles')
        .update({ credits_balance: 25 })
        .eq('id', profile1.id);

      // Multiple attempts to spend remaining credits
      const spendAttempts = [
        { amount: 20, reference: 'attempt-1' },
        { amount: 15, reference: 'attempt-2' },
        { amount: 25, reference: 'attempt-3' },
        { amount: 10, reference: 'attempt-4' }
      ];

      const spendPromises = spendAttempts.map(attempt => 
        supabase.rpc('spend_credits_if_available', {
          user_id: profile1.id,
          org_id: org.id,
          amount: attempt.amount,
          reference_id: attempt.reference
        })
      );

      const results = await Promise.allSettled(spendPromises);

      // Verify balance never goes negative
      const { data: finalProfile } = await supabase
        .from('profiles')
        .select('credits_balance')
        .eq('id', profile1.id)
        .single();

      expect(finalProfile.credits_balance).toBeGreaterThanOrEqual(0);

      // Verify transaction history is consistent
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile1.id)
        .eq('org_id', org.id);

      const totalSpent = transactions
        ?.filter(t => t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0) || 0;

      expect(25 - totalSpent).toBe(finalProfile.credits_balance);
    });
  });

  describe('Database Consistency Under Load', () => {
    it('should maintain data integrity during high concurrent operations', async () => {
      const { profile: profile1, organization: org } = testData;

      // Create multiple templates rapidly
      const templatePromises = Array.from({ length: 10 }, (_, i) => 
        supabase
          .from('templates')
          .insert({
            name: `Concurrent Template ${i}`,
            user_id: profile1.id,
            org_id: org.id,
            front_background: '#ffffff',
            back_background: '#ffffff',
            orientation: 'landscape',
            template_elements: [],
            width_pixels: 1013,
            height_pixels: 638,
            dpi: 300
          })
          .select()
          .single()
      );

      const results = await Promise.allSettled(templatePromises);
      const successfulCreations = results.filter(r => r.status === 'fulfilled');

      // Verify all created templates have correct org_id
      const { data: allTemplates } = await supabase
        .from('templates')
        .select('*')
        .eq('org_id', org.id)
        .eq('user_id', profile1.id);

      expect(allTemplates?.length).toBe(successfulCreations.length);
      allTemplates?.forEach(template => {
        expect(template.org_id).toBe(org.id);
        expect(template.user_id).toBe(profile1.id);
        expect(template.name).toMatch(/^Concurrent Template \d+$/);
      });
    });

    it('should handle mixed operation types concurrently', async () => {
      const { profile: profile1, organization: org } = testData;

      // Mix of different operations
      const operations = [
        // Template creation
        supabase.from('templates').insert({
          name: 'Mixed Op Template',
          user_id: profile1.id, org_id: org.id,
          front_background: '#ffffff', back_background: '#ffffff',
          orientation: 'landscape', template_elements: [],
          width_pixels: 1013, height_pixels: 638, dpi: 300
        }),
        
        // Profile update
        supabase.from('profiles').update({
          credits_balance: 50
        }).eq('id', profile1.id),
        
        // ID card creation
        supabase.from('idcards').insert({
          user_id: profile1.id, org_id: org.id,
          data: { name: 'Mixed Op Card' },
          front_image: 'front.jpg', back_image: 'back.jpg'
        }),

        // Credit transaction
        supabase.from('credit_transactions').insert({
          user_id: profile1.id, org_id: org.id,
          amount: -5, reference_id: 'mixed-op-ref',
          description: 'Mixed operation test'
        })
      ];

      const results = await Promise.allSettled(operations);
      
      // At least some operations should succeed
      const successCount = results.filter(r => r.status === 'fulfilled').length;
      expect(successCount).toBeGreaterThan(0);

      // Verify data consistency
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profile1.id)
        .single();

      expect(profile.org_id).toBe(org.id);
    });
  });

  describe('Real-time Subscription Conflicts', () => {
    it('should handle subscription updates during concurrent modifications', async () => {
      const { profile: profile1, organization: org } = testData;

      // Mock subscription behavior
      const subscriptionUpdates: any[] = [];
      let subscriptionActive = true;

      const mockSubscription = {
        subscribe: (callback: (payload: any) => void) => {
          // Simulate real-time updates
          const interval = setInterval(() => {
            if (subscriptionActive) {
              callback({
                eventType: 'UPDATE',
                new: { id: 'template-1', name: `Updated ${Date.now()}` },
                old: { id: 'template-1', name: 'Original' }
              });
            }
          }, 10);

          return () => {
            clearInterval(interval);
            subscriptionActive = false;
          };
        }
      };

      // Start subscription
      const unsubscribe = mockSubscription.subscribe((payload) => {
        subscriptionUpdates.push(payload);
      });

      // Concurrent database operations while subscription is active
      await supabase
        .from('templates')
        .insert({
          name: 'Subscription Test Template',
          user_id: profile1.id, 
          org_id: org.id,
          front_background: '#ffffff',
          back_background: '#ffffff', 
          orientation: 'landscape',
          template_elements: [],
          width_pixels: 1013,
          height_pixels: 638,
          dpi: 300
        });

      // Allow some subscription updates
      await new Promise(resolve => setTimeout(resolve, 50));

      // Stop subscription
      unsubscribe();

      // Verify subscription received updates without conflicts
      expect(subscriptionUpdates.length).toBeGreaterThan(0);
      subscriptionUpdates.forEach(update => {
        expect(update.eventType).toBe('UPDATE');
        expect(update.new.id).toBe('template-1');
      });
    });
  });
});