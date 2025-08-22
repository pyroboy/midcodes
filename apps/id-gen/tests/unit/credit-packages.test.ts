import { describe, it, expect } from 'vitest';
import { CREDIT_PACKAGES, PREMIUM_FEATURES } from '$lib/utils/credits';

describe('Credit Packages and Premium Features Tests', () => {
  
  describe('CREDIT_PACKAGES Validation', () => {
    it('should have all required packages defined', () => {
      expect(CREDIT_PACKAGES).toHaveLength(4);
      
      const packageIds = CREDIT_PACKAGES.map(pkg => pkg.id);
      expect(packageIds).toEqual(['small', 'medium', 'large', 'enterprise']);
    });

    it('should have valid structure for all packages', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        // Required properties
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('price');
        expect(pkg).toHaveProperty('pricePerCard');
        expect(pkg).toHaveProperty('description');
        expect(pkg).toHaveProperty('popular');

        // Type validation
        expect(typeof pkg.id).toBe('string');
        expect(typeof pkg.name).toBe('string');
        expect(typeof pkg.credits).toBe('number');
        expect(typeof pkg.price).toBe('number');
        expect(typeof pkg.pricePerCard).toBe('number');
        expect(typeof pkg.description).toBe('string');
        expect(typeof pkg.popular).toBe('boolean');

        // Value validation
        expect(pkg.credits).toBeGreaterThan(0);
        expect(pkg.price).toBeGreaterThan(0);
        expect(pkg.pricePerCard).toBeGreaterThan(0);
        expect(pkg.name.length).toBeGreaterThan(0);
        expect(pkg.description.length).toBeGreaterThan(0);
      });
    });

    it('should have correct price per card calculations', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        const calculatedPricePerCard = pkg.price / pkg.credits;
        expect(pkg.pricePerCard).toBeCloseTo(calculatedPricePerCard, 2);
      });
    });

    it('should show value progression (larger packages should have better rates)', () => {
      for (let i = 1; i < CREDIT_PACKAGES.length; i++) {
        const currentPkg = CREDIT_PACKAGES[i];
        const previousPkg = CREDIT_PACKAGES[i - 1];
        
        // Larger packages should have same or better price per card
        expect(currentPkg.pricePerCard).toBeLessThanOrEqual(previousPkg.pricePerCard);
        
        // Larger packages should have more credits
        expect(currentPkg.credits).toBeGreaterThan(previousPkg.credits);
      }
    });

    it('should have exactly one popular package', () => {
      const popularPackages = CREDIT_PACKAGES.filter(pkg => pkg.popular);
      expect(popularPackages).toHaveLength(1);
      expect(popularPackages[0].id).toBe('medium');
    });

    it('should have appropriate discounts for larger packages', () => {
      const packagesWithDiscount = CREDIT_PACKAGES.filter(pkg => pkg.discount);
      
      packagesWithDiscount.forEach(pkg => {
        expect(pkg.discount).toBeGreaterThan(0);
        expect(pkg.discount).toBeLessThan(100); // Discount should be a percentage
      });

      // Medium, large, and enterprise should have discounts
      expect(packagesWithDiscount.length).toBeGreaterThanOrEqual(3);
    });

    describe('Individual Package Validation', () => {
      it('should have valid small package', () => {
        const smallPackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'small');
        expect(smallPackage).toBeTruthy();
        expect(smallPackage!.credits).toBe(50);
        expect(smallPackage!.price).toBe(250);
        expect(smallPackage!.pricePerCard).toBe(5);
        expect(smallPackage!.popular).toBe(false);
        expect(smallPackage!.name).toBe('Small Package');
      });

      it('should have valid medium package', () => {
        const mediumPackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'medium');
        expect(mediumPackage).toBeTruthy();
        expect(mediumPackage!.credits).toBe(100);
        expect(mediumPackage!.price).toBe(450);
        expect(mediumPackage!.pricePerCard).toBe(4.5);
        expect(mediumPackage!.popular).toBe(true);
        expect(mediumPackage!.discount).toBe(10);
        expect(mediumPackage!.name).toBe('Medium Package');
      });

      it('should have valid large package', () => {
        const largePackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'large');
        expect(largePackage).toBeTruthy();
        expect(largePackage!.credits).toBe(250);
        expect(largePackage!.price).toBe(1000);
        expect(largePackage!.pricePerCard).toBe(4);
        expect(largePackage!.popular).toBe(false);
        expect(largePackage!.discount).toBe(20);
        expect(largePackage!.name).toBe('Large Package');
      });

      it('should have valid enterprise package', () => {
        const enterprisePackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'enterprise');
        expect(enterprisePackage).toBeTruthy();
        expect(enterprisePackage!.credits).toBe(500);
        expect(enterprisePackage!.price).toBe(1800);
        expect(enterprisePackage!.pricePerCard).toBe(3.6);
        expect(enterprisePackage!.popular).toBe(false);
        expect(enterprisePackage!.discount).toBe(28);
        expect(enterprisePackage!.name).toBe('Enterprise Package');
      });
    });
  });

  describe('PREMIUM_FEATURES Validation', () => {
    it('should have all required premium features defined', () => {
      expect(PREMIUM_FEATURES).toHaveLength(2);
      
      const featureIds = PREMIUM_FEATURES.map(feature => feature.id);
      expect(featureIds).toEqual(['unlimited_templates', 'remove_watermarks']);
    });

    it('should have valid structure for all features', () => {
      PREMIUM_FEATURES.forEach(feature => {
        // Required properties
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('price');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('type');

        // Type validation
        expect(typeof feature.id).toBe('string');
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.price).toBe('number');
        expect(typeof feature.description).toBe('string');
        expect(typeof feature.type).toBe('string');

        // Value validation
        expect(feature.price).toBeGreaterThan(0);
        expect(feature.name.length).toBeGreaterThan(0);
        expect(feature.description.length).toBeGreaterThan(0);
        expect(feature.type).toBe('one_time');
      });
    });

    describe('Individual Feature Validation', () => {
      it('should have valid unlimited templates feature', () => {
        const unlimitedTemplates = PREMIUM_FEATURES.find(f => f.id === 'unlimited_templates');
        expect(unlimitedTemplates).toBeTruthy();
        expect(unlimitedTemplates!.name).toBe('Unlimited Templates');
        expect(unlimitedTemplates!.price).toBe(99);
        expect(unlimitedTemplates!.description).toBe('Create unlimited custom templates');
        expect(unlimitedTemplates!.type).toBe('one_time');
      });

      it('should have valid watermark removal feature', () => {
        const removeWatermarks = PREMIUM_FEATURES.find(f => f.id === 'remove_watermarks');
        expect(removeWatermarks).toBeTruthy();
        expect(removeWatermarks!.name).toBe('Remove Watermarks');
        expect(removeWatermarks!.price).toBe(199);
        expect(removeWatermarks!.description).toBe('Remove watermarks from all generated cards');
        expect(removeWatermarks!.type).toBe('one_time');
      });
    });
  });

  describe('Package Selection Logic', () => {
    it('should help users find the right package based on their needs', () => {
      // Helper function to find best package for credit needs
      const findBestPackageForCredits = (neededCredits: number) => {
        return CREDIT_PACKAGES
          .filter(pkg => pkg.credits >= neededCredits)
          .sort((a, b) => a.pricePerCard - b.pricePerCard)[0];
      };

      // Test various credit needs
      const testCases = [
        { needed: 30, expectedPackage: 'small' },
        { needed: 50, expectedPackage: 'small' },
        { needed: 80, expectedPackage: 'medium' },
        { needed: 200, expectedPackage: 'large' },
        { needed: 400, expectedPackage: 'enterprise' }
      ];

      testCases.forEach(({ needed, expectedPackage }) => {
        const bestPackage = findBestPackageForCredits(needed);
        expect(bestPackage?.id).toBe(expectedPackage);
      });
    });

    it('should calculate total savings for larger packages', () => {
      const baselinePrice = CREDIT_PACKAGES[0].pricePerCard; // Small package price per card
      
      CREDIT_PACKAGES.forEach(pkg => {
        if (pkg.id !== 'small') {
          const savings = (baselinePrice - pkg.pricePerCard) * pkg.credits;
          expect(savings).toBeGreaterThan(0);
          
          // Larger packages should have more absolute savings
          if (pkg.id === 'enterprise') {
            expect(savings).toBeGreaterThan(500); // Significant savings for enterprise
          }
        }
      });
    });
  });

  describe('Feature Value Analysis', () => {
    it('should provide appropriate pricing for premium features', () => {
      const unlimitedTemplates = PREMIUM_FEATURES.find(f => f.id === 'unlimited_templates');
      const removeWatermarks = PREMIUM_FEATURES.find(f => f.id === 'remove_watermarks');
      
      expect(unlimitedTemplates!.price).toBeLessThan(removeWatermarks!.price);
      
      // Features should be priced reasonably compared to credit packages
      const mediumPackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'medium');
      expect(unlimitedTemplates!.price).toBeLessThan(mediumPackage!.price);
      expect(removeWatermarks!.price).toBeLessThan(mediumPackage!.price * 1.5); // Not more than 1.5x medium package
    });

    it('should have meaningful feature descriptions', () => {
      PREMIUM_FEATURES.forEach(feature => {
        expect(feature.description).toMatch(/\b(create|remove|unlimited|custom|generated|cards|templates|watermarks)\b/i);
        expect(feature.description.length).toBeGreaterThan(20); // Reasonably descriptive
      });
    });
  });

  describe('Pricing Strategy Validation', () => {
    it('should follow psychological pricing principles', () => {
      CREDIT_PACKAGES.forEach(pkg => {
        // Most prices should end in 0 or 5 for psychological appeal
        const lastDigit = pkg.price % 10;
        expect([0, 5, 9].includes(lastDigit)).toBe(true);
      });

      PREMIUM_FEATURES.forEach(feature => {
        const lastDigit = feature.price % 10;
        expect([0, 5, 9].includes(lastDigit)).toBe(true);
      });
    });

    it('should have reasonable price points for target market', () => {
      // Small package should be accessible entry point
      const smallPackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'small');
      expect(smallPackage!.price).toBeLessThan(300);
      
      // Enterprise package should provide significant volume discount
      const enterprisePackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'enterprise');
      const smallPackageRate = smallPackage!.price / smallPackage!.credits;
      const enterpriseRate = enterprisePackage!.price / enterprisePackage!.credits;
      
      const discount = (smallPackageRate - enterpriseRate) / smallPackageRate;
      expect(discount).toBeGreaterThan(0.25); // At least 25% discount for volume
    });
  });

  describe('Package Metadata and Presentation', () => {
    it('should have appropriate descriptions for target audiences', () => {
      const descriptions = CREDIT_PACKAGES.map(pkg => pkg.description.toLowerCase());
      
      expect(descriptions.some(desc => desc.includes('small') || desc.includes('event'))).toBe(true);
      expect(descriptions.some(desc => desc.includes('medium') || desc.includes('organization'))).toBe(true);
      expect(descriptions.some(desc => desc.includes('frequent') || desc.includes('value'))).toBe(true);
      expect(descriptions.some(desc => desc.includes('school') || desc.includes('corporation') || desc.includes('enterprise'))).toBe(true);
    });

    it('should highlight the popular package appropriately', () => {
      const popularPackage = CREDIT_PACKAGES.find(pkg => pkg.popular);
      expect(popularPackage!.id).toBe('medium');
      
      // Popular package should be middle-tier (good balance of price and value)
      const sortedByPrice = [...CREDIT_PACKAGES].sort((a, b) => a.price - b.price);
      const popularIndex = sortedByPrice.findIndex(pkg => pkg.popular);
      
      // Should not be the cheapest or most expensive
      expect(popularIndex).toBeGreaterThan(0);
      expect(popularIndex).toBeLessThan(sortedByPrice.length - 1);
    });
  });

  describe('Constants Immutability', () => {
    it('should not allow modification of package data', () => {
      expect(() => {
        // TypeScript should prevent this, but test runtime behavior
        (CREDIT_PACKAGES as any).push({ id: 'test', name: 'Test' });
      }).not.toThrow(); // Arrays are not frozen by default
      
      // But the original packages should still be intact
      expect(CREDIT_PACKAGES).toHaveLength(4);
    });

    it('should maintain consistent data across multiple imports', () => {
      // Re-import to test consistency
      const { CREDIT_PACKAGES: reimportedPackages } = require('$lib/utils/credits');
      
      expect(reimportedPackages).toEqual(CREDIT_PACKAGES);
      expect(reimportedPackages).toHaveLength(4);
    });
  });

  describe('Integration with Business Logic', () => {
    it('should support package lookup by ID', () => {
      const findPackageById = (id: string) => CREDIT_PACKAGES.find(pkg => pkg.id === id);
      
      expect(findPackageById('small')).toBeTruthy();
      expect(findPackageById('medium')).toBeTruthy();
      expect(findPackageById('large')).toBeTruthy();
      expect(findPackageById('enterprise')).toBeTruthy();
      expect(findPackageById('nonexistent')).toBeUndefined();
    });

    it('should support feature lookup by ID', () => {
      const findFeatureById = (id: string) => PREMIUM_FEATURES.find(feature => feature.id === id);
      
      expect(findFeatureById('unlimited_templates')).toBeTruthy();
      expect(findFeatureById('remove_watermarks')).toBeTruthy();
      expect(findFeatureById('nonexistent')).toBeUndefined();
    });

    it('should calculate total cost for multiple purchases', () => {
      const calculateTotal = (packageId: string, featureIds: string[]) => {
        const pkg = CREDIT_PACKAGES.find(p => p.id === packageId);
        const features = PREMIUM_FEATURES.filter(f => featureIds.includes(f.id));
        
        return (pkg?.price || 0) + features.reduce((sum, f) => sum + f.price, 0);
      };
      
      // Test various combinations
      expect(calculateTotal('small', [])).toBe(250);
      expect(calculateTotal('medium', ['unlimited_templates'])).toBe(549); // 450 + 99
      expect(calculateTotal('large', ['unlimited_templates', 'remove_watermarks'])).toBe(1298); // 1000 + 99 + 199
    });
  });
});
