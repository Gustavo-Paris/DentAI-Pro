import { describe, it, expect } from 'vitest';
import { withQuery, withMutation } from '../utils';

// ---------------------------------------------------------------------------
// Tests for withQuery and withMutation
// ---------------------------------------------------------------------------

describe('withQuery', () => {
  it('should return data on success', async () => {
    const data = [{ id: '1', name: 'Test' }];

    const result = await withQuery(() =>
      Promise.resolve({ data, error: null }),
    );

    expect(result).toEqual(data);
  });

  it('should throw on error', async () => {
    const error = { message: 'Query failed', details: '', hint: '', code: '42P01' };

    await expect(
      withQuery(() => Promise.resolve({ data: null, error })),
    ).rejects.toEqual(error);
  });

  it('should return null when data is null and no error (cast as T)', async () => {
    // withQuery casts data as T, so null is returned without throwing
    const result = await withQuery<string | null>(() =>
      Promise.resolve({ data: null, error: null }),
    );

    expect(result).toBeNull();
  });

  it('should return data when error is null', async () => {
    const data = { id: '1', count: 42 };

    const result = await withQuery(() =>
      Promise.resolve({ data, error: null }),
    );

    expect(result).toEqual(data);
  });

  it('should throw the PostgrestError object directly when error is present', async () => {
    const pgError = { message: 'relation not found', details: '', hint: '', code: '42P01' };

    try {
      await withQuery(() => Promise.resolve({ data: null, error: pgError }));
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBe(pgError);
    }
  });

  it('should prefer error over null-data (error takes precedence)', async () => {
    const pgError = { message: 'some error', details: '', hint: '', code: '42P01' };

    try {
      await withQuery(() => Promise.resolve({ data: null, error: pgError }));
      expect.fail('should have thrown');
    } catch (err) {
      // Should throw the pgError, not return null
      expect(err).toBe(pgError);
    }
  });
});

describe('withMutation', () => {
  it('should resolve on success (no error)', async () => {
    await expect(
      withMutation(() => Promise.resolve({ error: null })),
    ).resolves.toBeUndefined();
  });

  it('should throw on error', async () => {
    const error = { message: 'Update failed', details: '', hint: '', code: '42P01' };

    await expect(
      withMutation(() => Promise.resolve({ error })),
    ).rejects.toEqual(error);
  });

  it('should throw the PostgrestError object directly', async () => {
    const pgError = { message: 'permission denied', details: '', hint: '', code: '42501' };

    try {
      await withMutation(() => Promise.resolve({ error: pgError }));
      expect.fail('should have thrown');
    } catch (err) {
      expect(err).toBe(pgError);
    }
  });

  it('should not return any value on success', async () => {
    const result = await withMutation(() => Promise.resolve({ error: null }));
    expect(result).toBeUndefined();
  });
});
