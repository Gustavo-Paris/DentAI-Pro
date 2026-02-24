import { describe, it, expect } from 'vitest';
import { BRAND_NAME, getBrandTagline, getBrandDescription } from '../branding';

describe('branding constants', () => {
  it('should export BRAND_NAME', () => {
    expect(BRAND_NAME).toBe('ToSmile.ai');
  });

  it('should return brand tagline as a non-empty string', () => {
    const tagline = getBrandTagline();
    expect(typeof tagline).toBe('string');
    expect(tagline.length).toBeGreaterThan(0);
  });

  it('should return brand description as a non-empty string', () => {
    const description = getBrandDescription();
    expect(typeof description).toBe('string');
    expect(description.length).toBeGreaterThan(0);
  });
});
