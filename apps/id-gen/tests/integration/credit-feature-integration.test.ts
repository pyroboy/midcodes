import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { testDataManager } from '../utils/TestDataManager';
import { 
  deductCardGenerationCredit,
  canGenerateCard,
  canCreateTemplate,
  getUserCredits,
  incrementTemplateCount
} from '$lib/utils/credits';
import { supabase } from '$lib/supabaseClient';

describe('Feature Integration - Watermark Removal in Card Generation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Watermark Application Based on User Status', () => {
    it('should apply watermarks for users without remove_watermarks feature', async () => {
      const { profile, template } = testData;

      // Ensure user doesn't have watermark removal
      await supabase
        .from('profiles')
        .update({ remove_watermarks: false })
        .eq('id', profile.id);

      // Simulate card generation process with watermark logic
      const userCredits = await getUserCredits(profile.id);
      const shouldApplyWatermark = !userCredits?.remove_watermarks;

      expect(shouldApplyWatermark).toBe(true);

      // Create ID card with watermarked images
      const cardImagePrefix = shouldApplyWatermark ? 'watermarked' : 'clean';
      
      const { data: idCard, error } = await supabase
        .from('idcards')
        .insert({
          template_id: template.id,
          org_id: profile.org_id,
          front_image: `test/${cardImagePrefix}_front.png`,
          back_image: `test/${cardImagePrefix}_back.png`,
          data: {
            name: 'Test User',
            position: 'Developer',
            employee_id: 'EMP001'
          }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(idCard).toBeDefined();

      // Verify watermarked images are used
      expect(idCard.front_image).toContain('watermarked');
      expect(idCard.back_image).toContain('watermarked');
    });

    it('should remove watermarks for premium users', async () => {
      const { profile, template } = testData;

      // Grant watermark removal feature
      await supabase
        .from('profiles')
        .update({ remove_watermarks: true })
        .eq('id', profile.id);

      // Verify user has feature
      const userCredits = await getUserCredits(profile.id);
      const shouldApplyWatermark = !userCredits?.remove_watermarks;

      expect(shouldApplyWatermark).toBe(false);

      // Create ID card without watermarks
      const cardImagePrefix = shouldApplyWatermark ? 'watermarked' : 'clean';
      
      const { data: idCard, error } = await supabase
        .from('idcards')
        .insert({
          template_id: template.id,
          org_id: profile.org_id,
          front_image: `test/${cardImagePrefix}_front.png`,
          back_image: `test/${cardImagePrefix}_back.png`,
          data: {
            name: 'Premium User',
            position: 'Manager',
            employee_id: 'EMP002'
          }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(idCard).toBeDefined();

      // Verify clean images are used
      expect(idCard.front_image).toContain('clean');
      expect(idCard.back_image).toContain('clean');
    });

    it('should handle watermark status changes between card generations', async () => {
      const { profile, template } = testData;

      // Start without watermark removal
      await supabase
        .from('profiles')
        .update({ remove_watermarks: false })
        .eq('id', profile.id);

      // Generate first card (with watermarks)
      let userCredits = await getUserCredits(profile.id);
      const firstCardPrefix = userCredits?.remove_watermarks ? 'clean' : 'watermarked';

      await supabase
        .from('idcards')
        .insert({
          template_id: template.id,
          org_id: profile.org_id,
          front_image: `test/${firstCardPrefix}_front_1.png`,
          back_image: `test/${firstCardPrefix}_back_1.png`,
          data: { name: 'User Before Premium', card_number: 1 }
        });

      // Grant watermark removal
      await supabase
        .from('profiles')
        .update({ remove_watermarks: true })
        .eq('id', profile.id);

      // Generate second card (without watermarks)
      userCredits = await getUserCredits(profile.id);
      const secondCardPrefix = userCredits?.remove_watermarks ? 'clean' : 'watermarked';

      await supabase
        .from('idcards')
        .insert({
          template_id: template.id,
          org_id: profile.org_id,
          front_image: `test/${secondCardPrefix}_front_2.png`,
          back_image: `test/${secondCardPrefix}_back_2.png`,
          data: { name: 'User After Premium', card_number: 2 }
        });

      // Verify different watermark status for each card
      const { data: cards } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', profile.org_id)
        .order('created_at', { ascending: true });

      expect(cards).toHaveLength(2);
      expect(cards![0].front_image).toContain('watermarked');
      expect(cards![1].front_image).toContain('clean');
    });
  });

  describe('Watermark Feature UI Integration', () => {
    it('should reflect watermark status in UI calculations', async () => {
      const { profile } = testData;

      // Test without watermark removal
      let credits = await getUserCredits(profile.id);
      let uiState = {
        showWatermarkPreview: !credits?.remove_watermarks,
        showUpgradePrompt: !credits?.remove_watermarks,
        watermarkStatusText: credits?.remove_watermarks ? 'Watermarks Removed' : 'Contains Watermark',
        premiumBadgeVisible: credits?.remove_watermarks
      };

      expect(uiState.showWatermarkPreview).toBe(true);
      expect(uiState.showUpgradePrompt).toBe(true);
      expect(uiState.watermarkStatusText).toBe('Contains Watermark');
      expect(uiState.premiumBadgeVisible).toBe(false);

      // Grant watermark removal feature
      await supabase
        .from('profiles')
        .update({ remove_watermarks: true })
        .eq('id', profile.id);

      // UI should update
      credits = await getUserCredits(profile.id);
      uiState = {
        showWatermarkPreview: !credits?.remove_watermarks,
        showUpgradePrompt: !credits?.remove_watermarks,
        watermarkStatusText: credits?.remove_watermarks ? 'Watermarks Removed' : 'Contains Watermark',
        premiumBadgeVisible: credits?.remove_watermarks
      };

      expect(uiState.showWatermarkPreview).toBe(false);
      expect(uiState.showUpgradePrompt).toBe(false);
      expect(uiState.watermarkStatusText).toBe('Watermarks Removed');
      expect(uiState.premiumBadgeVisible).toBe(true);
    });
  });
});

describe('Feature Integration - Unlimited Templates in Template Creation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Template Creation Workflow Integration', () => {
    it('should enforce template limits in actual creation workflow', async () => {
      const { profile, organization } = testData;

      // Test complete template creation workflow with limits
      const templateCreationResults = [];

      for (let i = 1; i <= 3; i++) {
        const canCreate = await canCreateTemplate(profile.id);
        
        if (canCreate) {
          // Simulate actual template creation
          const { data: template, error } = await supabase
            .from('templates')
            .insert({
              name: `Integration Test Template ${i}`,
              org_id: organization.id,
              template_elements: {
                front: [{ 
                  type: 'text', 
                  content: `Template ${i} Content`,
                  style: { fontSize: 14, x: 50, y: 100 }
                }],
                back: []
              },
              width_pixels: 600,
              height_pixels: 400,
              dpi: 300,
              orientation: 'landscape',
              user_id: profile.id
            })
            .select()
            .single();

          if (!error) {
            // Update user template count
            const result = await incrementTemplateCount(profile.id);
            templateCreationResults.push({ 
              success: true, 
              template: template,
              templateCount: result.newCount
            });
          } else {
            templateCreationResults.push({ 
              success: false, 
              error: error.message 
            });
          }
        } else {
          templateCreationResults.push({ 
            success: false, 
            error: 'Template creation blocked by limit' 
          });
        }
      }

      // Verify creation results
      expect(templateCreationResults.filter(r => r.success)).toHaveLength(2); // Only 2 should succeed
      expect(templateCreationResults[2].success).toBe(false); // Third should fail

      // Verify final user state
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.template_count).toBe(2);
      expect(finalCredits?.unlimited_templates).toBe(false);
    });

    it('should allow unlimited template creation for premium users', async () => {
      const { profile, organization } = testData;

      // Grant unlimited templates
      await supabase
        .from('profiles')
        .update({ unlimited_templates: true })
        .eq('id', profile.id);

      // Test creating many templates
      const templateCreationResults = [];

      for (let i = 1; i <= 5; i++) {
        const canCreate = await canCreateTemplate(profile.id);
        expect(canCreate).toBe(true); // Should always be true with unlimited

        const { data: template, error } = await supabase
          .from('templates')
          .insert({
            name: `Unlimited Template ${i}`,
            org_id: organization.id,
            template_elements: {
              front: [{ 
                type: 'text', 
                content: `Unlimited Template ${i}`,
                style: { fontSize: 16, x: 50, y: 100 }
              }],
              back: []
            },
            width_pixels: 800,
            height_pixels: 600,
            dpi: 300,
            orientation: 'portrait',
            user_id: profile.id
          })
          .select()
          .single();

        expect(error).toBeNull();
        
        await incrementTemplateCount(profile.id);
        templateCreationResults.push({ success: true, template: template });
      }

      // All creations should succeed
      expect(templateCreationResults.filter(r => r.success)).toHaveLength(5);

      // Verify final state
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.template_count).toBe(5);
      expect(finalCredits?.unlimited_templates).toBe(true);
    });
  });

  describe('Template UI State Integration', () => {
    it('should calculate correct UI state for template limits', async () => {
      const { profile } = testData;

      // Test various template states
      const testStates = [
        { count: 0, unlimited: false, expectedRemaining: 2, expectedCanCreate: true },
        { count: 1, unlimited: false, expectedRemaining: 1, expectedCanCreate: true },
        { count: 2, unlimited: false, expectedRemaining: 0, expectedCanCreate: false },
        { count: 10, unlimited: true, expectedRemaining: Infinity, expectedCanCreate: true }
      ];

      for (const state of testStates) {
        await supabase
          .from('profiles')
          .update({
            template_count: state.count,
            unlimited_templates: state.unlimited
          })
          .eq('id', profile.id);

        const credits = await getUserCredits(profile.id);
        const canCreate = await canCreateTemplate(profile.id);

        // Calculate UI state
        const templatesRemaining = credits?.unlimited_templates 
          ? Infinity 
          : Math.max(0, 2 - (credits?.template_count || 0));

        const showUpgradePrompt = !credits?.unlimited_templates && (credits?.template_count || 0) >= 2;
        const showPremiumBadge = credits?.unlimited_templates || false;

        expect(canCreate).toBe(state.expectedCanCreate);
        expect(templatesRemaining).toBe(state.expectedRemaining);

        if (state.count >= 2 && !state.unlimited) {
          expect(showUpgradePrompt).toBe(true);
        }

        if (state.unlimited) {
          expect(showPremiumBadge).toBe(true);
        }
      }
    });
  });
});

describe('Feature Integration - Credit Deduction During Real Card Generation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Complete Card Generation Workflow', () => {
    it('should handle complete paid card generation workflow', async () => {
      const { profile, template } = testData;

      // Set up user for paid generation
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10, // Past free limit
          credits_balance: 5
        })
        .eq('id', profile.id);

      // Simulate complete card generation workflow
      const cardGenerationWorkflow = async (cardData: any) => {
        // 1. Check if generation is allowed
        const canGenerate = await canGenerateCard(profile.id);
        if (!canGenerate.canGenerate) {
          return { success: false, error: 'Generation not allowed', needsCredits: canGenerate.needsCredits };
        }

        // 2. Deduct credits
        const creditResult = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          cardData.id
        );
        if (!creditResult.success) {
          return { success: false, error: 'Credit deduction failed' };
        }

        // 3. Create the actual card
        const { data: idCard, error } = await supabase
          .from('idcards')
          .insert({
            template_id: template.id,
            org_id: profile.org_id,
            front_image: cardData.frontImage,
            back_image: cardData.backImage,
            data: cardData.data
          })
          .select()
          .single();

        if (error) {
          return { success: false, error: error.message };
        }

        return { 
          success: true, 
          card: idCard, 
          newBalance: creditResult.newBalance 
        };
      };

      // Generate a card
      const result = await cardGenerationWorkflow({
        id: 'workflow-test-card',
        frontImage: 'workflow/front.png',
        backImage: 'workflow/back.png',
        data: {
          name: 'Workflow Test User',
          position: 'Tester',
          employee_id: 'WORK001'
        }
      });

      expect(result.success).toBe(true);
      expect(result.newBalance).toBe(4); // 5 - 1 = 4

      // Verify card was created
      expect(result.card).toBeDefined();
      expect(result.card.data.name).toBe('Workflow Test User');

      // Verify user state updated
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(4);
      expect(finalCredits?.card_generation_count).toBe(11);

      // Verify transaction logged
      const { data: transaction } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'workflow-test-card')
        .single();

      expect(transaction).toBeDefined();
      expect(transaction.amount).toBe(-1);
    });

    it('should prevent card generation when credits are insufficient', async () => {
      const { profile, template } = testData;

      // Set up user with no credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 0
        })
        .eq('id', profile.id);

      // Attempt generation
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(false);
      expect(canGenerate.needsCredits).toBe(true);

      // Credit deduction should fail
      const creditResult = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'blocked-card'
      );
      expect(creditResult.success).toBe(false);

      // Card creation should be prevented
      const shouldProceedWithCreation = creditResult.success;
      expect(shouldProceedWithCreation).toBe(false);

      // Verify no card was created
      const { data: cards } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', profile.org_id);

      expect(cards || []).toHaveLength(0);
    });

    it('should handle free generations seamlessly in workflow', async () => {
      const { profile, template } = testData;

      // User with free generations available
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 3, // 7 free left
          credits_balance: 20
        })
        .eq('id', profile.id);

      const initialBalance = 20;

      // Generate a free card
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true);
      expect(canGenerate.needsCredits).toBe(false);

      const creditResult = await deductCardGenerationCredit(
        profile.id,
        profile.org_id,
        'free-workflow-card'
      );

      expect(creditResult.success).toBe(true);
      expect(creditResult.newBalance).toBe(initialBalance); // No change

      // Create card
      const { data: idCard, error } = await supabase
        .from('idcards')
        .insert({
          template_id: template.id,
          org_id: profile.org_id,
          front_image: 'free/workflow_front.png',
          back_image: 'free/workflow_back.png',
          data: { name: 'Free Generation User' }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(idCard).toBeDefined();

      // Verify state
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(initialBalance);
      expect(finalCredits?.card_generation_count).toBe(4);

      // No transaction for free generation
      const { data: transactions } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', profile.id)
        .eq('reference_id', 'free-workflow-card');

      expect(transactions || []).toHaveLength(0);
    });
  });
});

describe('Feature Integration - Batch Operations with Credit Validation', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Batch Card Generation Workflow', () => {
    it('should validate credits before batch operation and process what is affordable', async () => {
      const { profile, template } = testData;

      // Set up user with limited credits
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 10,
          credits_balance: 3
        })
        .eq('id', profile.id);

      // Simulate batch request for 5 cards
      const batchRequest = [
        { name: 'Batch User 1', id: 'BTH001' },
        { name: 'Batch User 2', id: 'BTH002' },
        { name: 'Batch User 3', id: 'BTH003' },
        { name: 'Batch User 4', id: 'BTH004' },
        { name: 'Batch User 5', id: 'BTH005' }
      ];

      // Pre-validation
      const initialCredits = await getUserCredits(profile.id);
      const availableCredits = initialCredits?.credits_balance || 0;
      const maxProcessable = Math.min(batchRequest.length, availableCredits);

      expect(maxProcessable).toBe(3);

      // Process batch
      const batchResults = [];
      let processedCount = 0;

      for (const cardData of batchRequest) {
        if (processedCount >= maxProcessable) {
          batchResults.push({ 
            success: false, 
            error: 'Insufficient credits',
            cardData: cardData
          });
          continue;
        }

        // Deduct credit
        const creditResult = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `batch-${cardData.id}`
        );

        if (creditResult.success) {
          // Create card
          const { data: idCard, error } = await supabase
            .from('idcards')
            .insert({
              template_id: template.id,
              org_id: profile.org_id,
              front_image: `batch/${cardData.id}_front.png`,
              back_image: `batch/${cardData.id}_back.png`,
              data: cardData
            })
            .select()
            .single();

          if (!error) {
            batchResults.push({ 
              success: true, 
              card: idCard,
              newBalance: creditResult.newBalance
            });
            processedCount++;
          } else {
            batchResults.push({ 
              success: false, 
              error: error.message 
            });
          }
        } else {
          batchResults.push({ 
            success: false, 
            error: 'Credit deduction failed' 
          });
        }
      }

      // Verify batch results
      const successfulCards = batchResults.filter(r => r.success);
      const failedCards = batchResults.filter(r => !r.success);

      expect(successfulCards).toHaveLength(3);
      expect(failedCards).toHaveLength(2);

      // Verify final user state
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(0);
      expect(finalCredits?.card_generation_count).toBe(13);

      // Verify cards were created
      const { data: createdCards } = await supabase
        .from('idcards')
        .select('*')
        .eq('org_id', profile.org_id);

      expect(createdCards).toHaveLength(3);
    });

    it('should handle mixed free and paid generations in batch processing', async () => {
      const { profile, template } = testData;

      // Set up user with some free generations left
      await supabase
        .from('profiles')
        .update({
          card_generation_count: 8, // 2 free left
          credits_balance: 2
        })
        .eq('id', profile.id);

      const batchRequest = Array.from({ length: 5 }, (_, i) => ({
        name: `Mixed Batch User ${i + 1}`,
        id: `MIX${String(i + 1).padStart(3, '0')}`
      }));

      // Process with mixed billing
      const batchResults = [];
      let currentGenerationCount = 8;
      let currentBalance = 2;

      for (const [index, cardData] of batchRequest.entries()) {
        const willUseFree = currentGenerationCount < 10;
        
        const creditResult = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `mixed-${cardData.id}`
        );

        if (creditResult.success) {
          const { data: idCard, error } = await supabase
            .from('idcards')
            .insert({
              template_id: template.id,
              org_id: profile.org_id,
              front_image: `mixed/${cardData.id}_front.png`,
              back_image: `mixed/${cardData.id}_back.png`,
              data: cardData
            })
            .select()
            .single();

          if (!error) {
            batchResults.push({ 
              success: true, 
              card: idCard,
              usedFree: willUseFree,
              balanceAfter: creditResult.newBalance
            });
            
            currentGenerationCount++;
            if (!willUseFree) {
              currentBalance--;
            }
          }
        } else {
          batchResults.push({ 
            success: false, 
            error: 'Credit deduction failed' 
          });
          break; // Stop processing on failure
        }
      }

      // Analyze results
      const successfulCards = batchResults.filter(r => r.success);
      const freeCards = successfulCards.filter(r => r.usedFree);
      const paidCards = successfulCards.filter(r => !r.usedFree);

      expect(freeCards).toHaveLength(2); // Used 2 free
      expect(paidCards).toHaveLength(2); // Used 2 paid
      expect(successfulCards).toHaveLength(4); // Total successful

      // Verify final state
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(0);
      expect(finalCredits?.card_generation_count).toBe(12);
    });
  });
});

describe('Feature Integration - Credit Requirements for Different Card Types', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Card Type-Specific Credit Requirements', () => {
    it('should handle different credit costs for various card types', async () => {
      const { profile, organization } = testData;

      // Create templates with different complexity levels
      const templates = [
        {
          name: 'Basic ID Card',
          type: 'basic',
          creditCost: 1,
          elements: {
            front: [{ type: 'text', content: 'Basic Card' }],
            back: []
          }
        },
        {
          name: 'Professional ID Card',
          type: 'professional', 
          creditCost: 2,
          elements: {
            front: [
              { type: 'text', content: 'Professional Card' },
              { type: 'image', src: 'logo.png' },
              { type: 'qr_code', data: 'employee_data' }
            ],
            back: [{ type: 'text', content: 'Security features' }]
          }
        },
        {
          name: 'Premium ID Card',
          type: 'premium',
          creditCost: 3,
          elements: {
            front: [
              { type: 'text', content: 'Premium Card' },
              { type: 'image', src: 'premium_logo.png' },
              { type: 'hologram', pattern: 'security' },
              { type: 'barcode', format: 'code128' }
            ],
            back: [
              { type: 'magnetic_stripe', data: 'encoded_data' },
              { type: 'rfid', data: 'chip_data' }
            ]
          }
        }
      ];

      // Create templates in database
      const createdTemplates = [];
      for (const template of templates) {
        const { data, error } = await supabase
          .from('templates')
          .insert({
            name: template.name,
            org_id: organization.id,
            template_elements: template.elements,
            width_pixels: 600,
            height_pixels: 400,
            dpi: 300,
            orientation: 'landscape',
            user_id: profile.id,
            metadata: {
              card_type: template.type,
              credit_cost: template.creditCost,
              complexity_level: template.type
            }
          })
          .select()
          .single();

        expect(error).toBeNull();
        createdTemplates.push({ ...data, creditCost: template.creditCost });
      }

      // Set user with sufficient credits
      await supabase
        .from('profiles')
        .update({
          credits_balance: 10,
          card_generation_count: 10 // Past free limit
        })
        .eq('id', profile.id);

      // Test generation with different card types
      const generationResults = [];
      let currentBalance = 10;

      for (const template of createdTemplates) {
        const initialCredits = await getUserCredits(profile.id);
        
        // Check if user can afford this card type
        const canAfford = (initialCredits?.credits_balance || 0) >= template.creditCost;
        
        if (canAfford) {
          // Simulate multi-credit deduction for complex cards
          let deductionSuccess = true;
          for (let i = 0; i < template.creditCost; i++) {
            const result = await deductCardGenerationCredit(
              profile.id,
              profile.org_id,
              `${template.name.toLowerCase().replace(/\s+/g, '-')}-deduction-${i + 1}`
            );
            if (!result.success) {
              deductionSuccess = false;
              break;
            }
          }

          if (deductionSuccess) {
            // Create the card
            const { data: idCard, error } = await supabase
              .from('idcards')
              .insert({
                template_id: template.id,
                org_id: profile.org_id,
                front_image: `cards/${template.metadata.card_type}_front.png`,
                back_image: `cards/${template.metadata.card_type}_back.png`,
                data: {
                  name: `${template.metadata.card_type} User`,
                  card_type: template.metadata.card_type,
                  complexity: template.metadata.complexity_level
                },
                metadata: {
                  credits_used: template.creditCost,
                  card_type: template.metadata.card_type
                }
              })
              .select()
              .single();

            generationResults.push({
              success: true,
              cardType: template.metadata.card_type,
              creditsUsed: template.creditCost,
              card: idCard
            });

            currentBalance -= template.creditCost;
          } else {
            generationResults.push({
              success: false,
              cardType: template.metadata.card_type,
              error: 'Credit deduction failed'
            });
          }
        } else {
          generationResults.push({
            success: false,
            cardType: template.metadata.card_type,
            error: 'Insufficient credits'
          });
        }
      }

      // Verify results
      const successfulGenerations = generationResults.filter(r => r.success);
      expect(successfulGenerations).toHaveLength(3); // All should succeed with 10 credits

      // Verify total credits used
      const totalCreditsUsed = successfulGenerations.reduce((sum, r) => sum + r.creditsUsed, 0);
      expect(totalCreditsUsed).toBe(6); // 1 + 2 + 3 = 6

      // Verify final balance
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(4); // 10 - 6 = 4
    });

    it('should prevent generation when credits are insufficient for card type', async () => {
      const { profile, organization } = testData;

      // Create expensive template
      const { data: expensiveTemplate } = await supabase
        .from('templates')
        .insert({
          name: 'Ultra Premium Card',
          org_id: organization.id,
          template_elements: {
            front: [{ type: 'holographic_foil', pattern: 'rainbow' }],
            back: [{ type: 'smart_chip', encryption: 'aes256' }]
          },
          width_pixels: 600,
          height_pixels: 400,
          metadata: { credit_cost: 5, card_type: 'ultra_premium' }
        })
        .select()
        .single();

      // Set user with insufficient credits
      await supabase
        .from('profiles')
        .update({
          credits_balance: 3,
          card_generation_count: 10
        })
        .eq('id', profile.id);

      // Attempt to generate expensive card
      const canGenerate = await canGenerateCard(profile.id);
      expect(canGenerate.canGenerate).toBe(true); // Can generate basic cards

      // But should fail when attempting multi-credit deduction
      let successfulDeductions = 0;
      for (let i = 0; i < 5; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `ultra-premium-attempt-${i + 1}`
        );
        if (result.success) {
          successfulDeductions++;
        } else {
          break;
        }
      }

      expect(successfulDeductions).toBe(3); // Only 3 credits available

      // Card generation should be prevented
      const remainingCredits = await getUserCredits(profile.id);
      expect(remainingCredits?.credits_balance).toBe(0);

      // No ultra premium card should be created
      const { data: ultraCards } = await supabase
        .from('idcards')
        .select('*')
        .eq('template_id', expensiveTemplate.id);

      expect(ultraCards || []).toHaveLength(0);
    });
  });
});

describe('Feature Integration - Credit-Based Quality and Resolution Settings', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Quality Tier Credit Requirements', () => {
    it('should apply different credit costs based on quality settings', async () => {
      const { profile, template } = testData;

      // Define quality tiers with credit requirements
      const qualityTiers = [
        { name: 'Basic', dpi: 150, creditMultiplier: 1, suffix: 'basic' },
        { name: 'Standard', dpi: 300, creditMultiplier: 1, suffix: 'standard' },
        { name: 'High', dpi: 600, creditMultiplier: 2, suffix: 'high' },
        { name: 'Ultra', dpi: 1200, creditMultiplier: 3, suffix: 'ultra' }
      ];

      // Set user past free limit with sufficient credits
      await supabase
        .from('profiles')
        .update({
          credits_balance: 15,
          card_generation_count: 10
        })
        .eq('id', profile.id);

      const qualityResults = [];
      let currentBalance = 15;

      for (const quality of qualityTiers) {
        const creditsRequired = quality.creditMultiplier;
        const canAfford = currentBalance >= creditsRequired;

        if (canAfford) {
          // Deduct credits based on quality
          let deductionSuccess = true;
          for (let i = 0; i < creditsRequired; i++) {
            const result = await deductCardGenerationCredit(
              profile.id,
              profile.org_id,
              `quality-${quality.suffix}-deduction-${i + 1}`
            );
            if (!result.success) {
              deductionSuccess = false;
              break;
            }
          }

          if (deductionSuccess) {
            // Create card with quality settings
            const { data: idCard, error } = await supabase
              .from('idcards')
              .insert({
                template_id: template.id,
                org_id: profile.org_id,
                front_image: `quality/${quality.suffix}_${quality.dpi}dpi_front.png`,
                back_image: `quality/${quality.suffix}_${quality.dpi}dpi_back.png`,
                data: {
                  name: `${quality.name} Quality User`,
                  quality_tier: quality.name
                },
                metadata: {
                  quality_settings: {
                    dpi: quality.dpi,
                    tier: quality.name,
                    credits_used: creditsRequired
                  }
                }
              })
              .select()
              .single();

            qualityResults.push({
              success: true,
              quality: quality.name,
              dpi: quality.dpi,
              creditsUsed: creditsRequired,
              card: idCard
            });

            currentBalance -= creditsRequired;
          }
        } else {
          qualityResults.push({
            success: false,
            quality: quality.name,
            error: 'Insufficient credits for this quality'
          });
        }
      }

      // Verify quality generation results
      const successfulQuality = qualityResults.filter(r => r.success);
      expect(successfulQuality).toHaveLength(4); // All should succeed with 15 credits

      // Verify total credits used: 1 + 1 + 2 + 3 = 7
      const totalCreditsUsed = successfulQuality.reduce((sum, r) => sum + (r.creditsUsed || 0), 0);
      expect(totalCreditsUsed).toBe(7);

      // Verify cards have correct quality metadata
      successfulQuality.forEach((result, index) => {
        expect(result.card.metadata.quality_settings.tier).toBe(qualityTiers[index].name);
        expect(result.card.metadata.quality_settings.dpi).toBe(qualityTiers[index].dpi);
      });

      // Verify final balance
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(8); // 15 - 7 = 8
    });

    it('should handle resolution limitations based on available credits', async () => {
      const { profile, template } = testData;

      // Set user with limited credits
      await supabase
        .from('profiles')
        .update({
          credits_balance: 2,
          card_generation_count: 10
        })
        .eq('id', profile.id);

      // Attempt high resolution generation (requires 3 credits)
      const initialCredits = await getUserCredits(profile.id);
      const availableCredits = initialCredits?.credits_balance || 0;
      const highResolutionCost = 3;

      // Should fall back to lower resolution
      const affordableQuality = availableCredits >= highResolutionCost ? 'ultra' : 
                               availableCredits >= 2 ? 'high' : 'standard';

      expect(affordableQuality).toBe('high');

      // Generate with affordable quality
      const creditsToUse = affordableQuality === 'high' ? 2 : 1;
      
      for (let i = 0; i < creditsToUse; i++) {
        const result = await deductCardGenerationCredit(
          profile.id,
          profile.org_id,
          `resolution-fallback-${i + 1}`
        );
        expect(result.success).toBe(true);
      }

      // Create card with fallback quality
      const { data: idCard, error } = await supabase
        .from('idcards')
        .insert({
          template_id: template.id,
          org_id: profile.org_id,
          front_image: `fallback/${affordableQuality}_resolution_front.png`,
          back_image: `fallback/${affordableQuality}_resolution_back.png`,
          data: {
            name: 'Fallback Quality User',
            intended_quality: 'ultra',
            actual_quality: affordableQuality
          },
          metadata: {
            quality_fallback: {
              requested: 'ultra',
              delivered: affordableQuality,
              reason: 'insufficient_credits'
            }
          }
        })
        .select()
        .single();

      expect(error).toBeNull();
      expect(idCard.metadata.quality_fallback.delivered).toBe('high');

      // Verify credits exhausted
      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(0);
    });
  });

  describe('Premium Quality Features Integration', () => {
    it('should provide enhanced quality options for premium users', async () => {
      const { profile, template } = testData;

      // Grant premium features
      await supabase
        .from('profiles')
        .update({
          credits_balance: 50,
          card_generation_count: 10,
          unlimited_templates: true,
          remove_watermarks: true
        })
        .eq('id', profile.id);

      // Premium users get access to exclusive quality options
      const premiumQualities = [
        { name: 'Professional Print', dpi: 2400, creditCost: 5 },
        { name: 'Exhibition Grade', dpi: 4800, creditCost: 10 }
      ];

      const userCredits = await getUserCredits(profile.id);
      const isPremiumUser = userCredits?.unlimited_templates || userCredits?.remove_watermarks;
      
      expect(isPremiumUser).toBe(true);

      // Generate premium quality cards
      const premiumResults = [];
      
      for (const quality of premiumQualities) {
        // Premium users get quality enhancements
        const actualCreditCost = isPremiumUser ? Math.floor(quality.creditCost * 0.8) : quality.creditCost;
        
        // Deduct credits
        for (let i = 0; i < actualCreditCost; i++) {
          await deductCardGenerationCredit(
            profile.id,
            profile.org_id,
            `premium-${quality.name.toLowerCase().replace(/\s+/g, '-')}-${i + 1}`
          );
        }

        // Create premium quality card
        const { data: idCard, error } = await supabase
          .from('idcards')
          .insert({
            template_id: template.id,
            org_id: profile.org_id,
            front_image: `premium/${quality.name.toLowerCase().replace(/\s+/g, '-')}_front.png`,
            back_image: `premium/${quality.name.toLowerCase().replace(/\s+/g, '-')}_back.png`,
            data: {
              name: 'Premium Quality User',
              quality_tier: quality.name
            },
            metadata: {
              premium_quality: {
                tier: quality.name,
                dpi: quality.dpi,
                credits_used: actualCreditCost,
                premium_discount: isPremiumUser,
                watermark_free: userCredits?.remove_watermarks
              }
            }
          })
          .select()
          .single();

        expect(error).toBeNull();
        premiumResults.push({
          quality: quality.name,
          creditsUsed: actualCreditCost,
          originalCost: quality.creditCost
        });
      }

      // Verify premium discounts applied
      expect(premiumResults[0].creditsUsed).toBe(4); // 5 * 0.8 = 4
      expect(premiumResults[1].creditsUsed).toBe(8); // 10 * 0.8 = 8

      // Verify total credits used with discount
      const totalCreditsUsed = premiumResults.reduce((sum, r) => sum + r.creditsUsed, 0);
      expect(totalCreditsUsed).toBe(12); // 4 + 8 = 12

      const finalCredits = await getUserCredits(profile.id);
      expect(finalCredits?.credits_balance).toBe(38); // 50 - 12 = 38
    });
  });
});

describe('Feature Integration - UI State Calculations', () => {
  let testData: any;

  beforeEach(async () => {
    testData = await testDataManager.createMinimalTestData();
  });

  afterEach(async () => {
    await testDataManager.cleanupAll();
  });

  describe('Dynamic UI State Based on Credit Status', () => {
    it('should calculate correct UI elements for different user states', async () => {
      const { profile } = testData;

      const testScenarios = [
        {
          name: 'New User',
          state: { credits: 0, generations: 0, unlimited: false, watermarks: false },
          expectedUI: {
            canGenerate: true,
            showUpgradeButton: false,
            showPremiumBadge: false,
            creditWarning: false,
            templatesRemaining: 2
          }
        },
        {
          name: 'User Past Free Limit, No Credits',
          state: { credits: 0, generations: 10, unlimited: false, watermarks: false },
          expectedUI: {
            canGenerate: false,
            showUpgradeButton: true,
            showPremiumBadge: false,
            creditWarning: true,
            templatesRemaining: 2
          }
        },
        {
          name: 'Premium User',
          state: { credits: 100, generations: 15, unlimited: true, watermarks: true },
          expectedUI: {
            canGenerate: true,
            showUpgradeButton: false,
            showPremiumBadge: true,
            creditWarning: false,
            templatesRemaining: Infinity
          }
        }
      ];

      for (const scenario of testScenarios) {
        await supabase
          .from('profiles')
          .update({
            credits_balance: scenario.state.credits,
            card_generation_count: scenario.state.generations,
            unlimited_templates: scenario.state.unlimited,
            remove_watermarks: scenario.state.watermarks,
            template_count: 0 // Reset for testing
          })
          .eq('id', profile.id);

        // Calculate UI state
        const credits = await getUserCredits(profile.id);
        const canGenerate = await canGenerateCard(profile.id);
        const canCreate = await canCreateTemplate(profile.id);

        const uiState = {
          canGenerate: canGenerate.canGenerate,
          showUpgradeButton: !canGenerate.canGenerate && canGenerate.needsCredits,
          showPremiumBadge: credits?.unlimited_templates || credits?.remove_watermarks,
          creditWarning: (credits?.credits_balance || 0) < 5 && (credits?.card_generation_count || 0) >= 10,
          templatesRemaining: credits?.unlimited_templates ? Infinity : Math.max(0, 2 - (credits?.template_count || 0))
        };

        // Verify UI state matches expectations
        expect(uiState.canGenerate).toBe(scenario.expectedUI.canGenerate);
        expect(uiState.showUpgradeButton).toBe(scenario.expectedUI.showUpgradeButton);
        expect(uiState.showPremiumBadge).toBe(scenario.expectedUI.showPremiumBadge);
        expect(uiState.creditWarning).toBe(scenario.expectedUI.creditWarning);
        expect(uiState.templatesRemaining).toBe(scenario.expectedUI.templatesRemaining);
      }
    });

    it('should handle real-time UI updates when user status changes', async () => {
      const { profile } = testData;

      // Initial state: User with no credits past free limit
      await supabase
        .from('profiles')
        .update({
          credits_balance: 0,
          card_generation_count: 10,
          unlimited_templates: false,
          remove_watermarks: false
        })
        .eq('id', profile.id);

      // Calculate initial UI state
      let credits = await getUserCredits(profile.id);
      let canGenerate = await canGenerateCard(profile.id);
      
      let uiState = {
        showGenerateButton: canGenerate.canGenerate,
        showUpgradeButton: !canGenerate.canGenerate && canGenerate.needsCredits,
        showPremiumBadge: credits?.unlimited_templates || credits?.remove_watermarks,
        creditsDisplay: credits?.credits_balance || 0,
        generationsDisplay: `${credits?.card_generation_count || 0}/10 free used`
      };

      expect(uiState.showGenerateButton).toBe(false);
      expect(uiState.showUpgradeButton).toBe(true);
      expect(uiState.showPremiumBadge).toBe(false);

      // Simulate user purchasing credits
      await supabase
        .from('profiles')
        .update({ credits_balance: 50 })
        .eq('id', profile.id);

      // Recalculate UI state
      credits = await getUserCredits(profile.id);
      canGenerate = await canGenerateCard(profile.id);
      
      uiState = {
        showGenerateButton: canGenerate.canGenerate,
        showUpgradeButton: !canGenerate.canGenerate && canGenerate.needsCredits,
        showPremiumBadge: credits?.unlimited_templates || credits?.remove_watermarks,
        creditsDisplay: credits?.credits_balance || 0,
        generationsDisplay: `${credits?.card_generation_count || 0}/10 free used`
      };

      expect(uiState.showGenerateButton).toBe(true);
      expect(uiState.showUpgradeButton).toBe(false);
      expect(uiState.creditsDisplay).toBe(50);

      // Simulate granting premium features
      await supabase
        .from('profiles')
        .update({ 
          unlimited_templates: true,
          remove_watermarks: true 
        })
        .eq('id', profile.id);

      // Final UI state
      credits = await getUserCredits(profile.id);
      
      uiState = {
        showGenerateButton: canGenerate.canGenerate,
        showUpgradeButton: !canGenerate.canGenerate && canGenerate.needsCredits,
        showPremiumBadge: credits?.unlimited_templates || credits?.remove_watermarks,
        creditsDisplay: credits?.credits_balance || 0,
        generationsDisplay: `${credits?.card_generation_count || 0}/10 free used`
        // Premium features are handled separately in the UI
      };

      expect(uiState.showPremiumBadge).toBe(true);
      expect(credits?.unlimited_templates).toBe(true);
      expect(credits?.remove_watermarks).toBe(true);
    });
  });

  describe('Card Type and Quality UI Integration', () => {
    it('should display correct options based on credit balance and card types', async () => {
      const { profile } = testData;

      // Test different user states and their UI implications
      const testStates = [
        {
          name: 'Low Credits User',
          credits: 2,
          generations: 10,
          expectedOptions: {
            basicCards: true,
            standardQuality: true,
            highQuality: true,
            ultraQuality: false,
            premiumCards: false
          }
        },
        {
          name: 'High Credits User',
          credits: 20,
          generations: 15,
          expectedOptions: {
            basicCards: true,
            standardQuality: true,
            highQuality: true,
            ultraQuality: true,
            premiumCards: true
          }
        }
      ];

      for (const state of testStates) {
        await supabase
          .from('profiles')
          .update({
            credits_balance: state.credits,
            card_generation_count: state.generations
          })
          .eq('id', profile.id);

        const credits = await getUserCredits(profile.id);
        const availableCredits = credits?.credits_balance || 0;

        // Calculate UI options
        const uiOptions = {
          basicCards: availableCredits >= 1,
          standardQuality: availableCredits >= 1,
          highQuality: availableCredits >= 2,
          ultraQuality: availableCredits >= 3,
          premiumCards: availableCredits >= 5
        };

        // Verify UI state matches expectations
        expect(uiOptions.basicCards).toBe(state.expectedOptions.basicCards);
        expect(uiOptions.standardQuality).toBe(state.expectedOptions.standardQuality);
        expect(uiOptions.highQuality).toBe(state.expectedOptions.highQuality);
        expect(uiOptions.ultraQuality).toBe(state.expectedOptions.ultraQuality);
        expect(uiOptions.premiumCards).toBe(state.expectedOptions.premiumCards);
      }
    });
  });
});