import { describe, it, expect } from 'vitest';
import { THUMBNAIL_PRESETS } from '../useSignedUrl';

describe('THUMBNAIL_PRESETS', () => {
  it('should have list preset', () => {
    expect(THUMBNAIL_PRESETS.list).toEqual({
      width: 120,
      height: 120,
      quality: 60,
      resize: 'cover',
    });
  });

  it('should have grid preset', () => {
    expect(THUMBNAIL_PRESETS.grid).toEqual({
      width: 200,
      height: 200,
      quality: 70,
      resize: 'cover',
    });
  });

  it('should have small preset', () => {
    expect(THUMBNAIL_PRESETS.small).toEqual({
      width: 64,
      height: 64,
      quality: 50,
      resize: 'cover',
    });
  });

  it('should have medium preset with contain resize', () => {
    expect(THUMBNAIL_PRESETS.medium.resize).toBe('contain');
    expect(THUMBNAIL_PRESETS.medium.width).toBe(400);
  });

  it('should have all four presets', () => {
    const keys = Object.keys(THUMBNAIL_PRESETS);
    expect(keys).toEqual(['list', 'grid', 'small', 'medium']);
  });
});
