import { describe, it, expect } from 'vitest';
import { 
  CREDIT_PACKAGES,
  PREMIUM_FEATURES,
} from '$lib/utils/credits';

describe('Credits Constants Tests', () => {
  describe('Credit Package Constants', () => {
    it('should have valid CREDIT_PACKAGES structure', () => {
      expect(CREDIT_PACKAGES).toHaveLength(4);
      
      CREDIT_PACKAGES.forEach(pkg => {
        expect(pkg).toHaveProperty('id');
        expect(pkg).toHaveProperty('name');
        expect(pkg).toHaveProperty('credits');
        expect(pkg).toHaveProperty('price');
        expect(pkg).toHaveProperty('pricePerCard');
        expect(pkg).toHaveProperty('description');
        expect(pkg).toHaveProperty('popular');

        expect(typeof pkg.id).toBe('string');
        expect(typeof pkg.name).toBe('string');
        expect(typeof pkg.credits).toBe('number');
        expect(typeof pkg.price).toBe('number');
        expect(typeof pkg.pricePerCard).toBe('number');
        expect(typeof pkg.description).toBe('string');
        expect(typeof pkg.popular).toBe('boolean');

        // Verify price per card calculation
        const expectedPricePerCard = pkg.price / pkg.credits;
        expect(pkg.pricePerCard).toBeCloseTo(expectedPricePerCard, 2);
      });
    });

    it('should have medium package marked as popular', () => {
      const mediumPackage = CREDIT_PACKAGES.find(pkg => pkg.id === 'medium');
      expect(mediumPackage).toBeTruthy();
      expect(mediumPackage?.popular).toBe(true);
    });

    it('should have packages with increasing value (decreasing price per card)', () => {
      const pricesPerCard = CREDIT_PACKAGES.map(pkg => pkg.pricePerCard);
      
      for (let i = 1; i < pricesPerCard.length; i++) {
        expect(pricesPerCard[i]).toBeLessThanOrEqual(pricesPerCard[i - 1]);
      }
    });
  });

  describe('Premium Feature Constants', () => {
    it('should have valid PREMIUM_FEATURES structure', () => {
      expect(PREMIUM_FEATURES).toHaveLength(2);
      
      PREMIUM_FEATURES.forEach(feature => {
        expect(feature).toHaveProperty('id');
        expect(feature).toHaveProperty('name');
        expect(feature).toHaveProperty('price');
        expect(feature).toHaveProperty('description');
        expect(feature).toHaveProperty('type');

        expect(typeof feature.id).toBe('string');
        expect(typeof feature.name).toBe('string');
        expect(typeof feature.price).toBe('number');
        expect(typeof feature.description).toBe('string');
        expect(feature.type).toBe('one_time');
      });
    });

    it('should have unlimited_templates feature', () => {
      const unlimitedTemplates = PREMIUM_FEATURES.find(f => f.id === 'unlimited_templates');
      expect(unlimitedTemplates).toBeTruthy();
      expect(unlimitedTemplates?.name).toBe('Unlimited Templates');
      expect(unlimitedTemplates?.price).toBe(99);
    });

    it('should have remove_watermarks feature', () => {
      const removeWatermarks = PREMIUM_FEATURES.find(f => f.id === 'remove_watermarks');
      expect(removeWatermarks).toBeTruthy();
      expect(removeWatermarks?.name).toBe('Remove Watermarks');
      expect(removeWatermarks?.price).toBe(199);
    });
  });
});
