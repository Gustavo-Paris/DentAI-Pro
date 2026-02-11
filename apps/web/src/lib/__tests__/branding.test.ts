import { describe, it, expect } from 'vitest';
import { BRAND_NAME, BRAND_TAGLINE, BRAND_DESCRIPTION } from '../branding';

describe('branding constants', () => {
  it('should export BRAND_NAME', () => {
    expect(BRAND_NAME).toBe('ToSmile.ai');
  });

  it('should export BRAND_TAGLINE as a non-empty string', () => {
    expect(typeof BRAND_TAGLINE).toBe('string');
    expect(BRAND_TAGLINE.length).toBeGreaterThan(0);
  });

  it('should export BRAND_DESCRIPTION as a non-empty string', () => {
    expect(typeof BRAND_DESCRIPTION).toBe('string');
    expect(BRAND_DESCRIPTION.length).toBeGreaterThan(0);
  });
});
