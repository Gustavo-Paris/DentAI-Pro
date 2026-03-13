import { describe, it, expect, vi, beforeEach } from 'vitest';
import { getByUserId, getFullByUserId, updateProfile } from '../profiles';

let terminalResult: unknown = { data: null, error: null };

const mockMaybeSingle = vi.fn();
const mockSingle = vi.fn();
const mockUpdate = vi.fn();
const mockEq = vi.fn();
const mockSelect = vi.fn();

function createBuilder(): Record<string, (...args: unknown[]) => unknown> {
  const builder: Record<string, (...args: unknown[]) => unknown> = {};
  const chain = (fn: ReturnType<typeof vi.fn>) => (...args: unknown[]) => { fn(...args); return builder; };
  builder.select = chain(mockSelect);
  builder.eq = chain(mockEq);
  builder.update = (...args: unknown[]) => { mockUpdate(...args); return builder; };
  builder.maybeSingle = () => { mockMaybeSingle(); return terminalResult; };
  builder.single = () => { mockSingle(); return terminalResult; };
  builder.then = (resolve: (v: unknown) => void, reject?: (e: unknown) => void) =>
    Promise.resolve(terminalResult).then(resolve, reject);
  return builder;
}

vi.mock('../client', () => ({
  supabase: { from: () => createBuilder() },
}));

beforeEach(() => {
  vi.clearAllMocks();
  terminalResult = { data: null, error: null };
});

describe('profiles.getByUserId', () => {
  it('should return profile when found', async () => {
    const profile = { full_name: 'Dr. Test', avatar_url: null };
    terminalResult = { data: profile, error: null };
    const result = await getByUserId('user-1');
    expect(result).toEqual(profile);
    expect(mockMaybeSingle).toHaveBeenCalled();
  });

  it('should return null when not found', async () => {
    terminalResult = { data: null, error: null };
    const result = await getByUserId('user-1');
    expect(result).toBeNull();
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('DB error') };
    await expect(getByUserId('user-1')).rejects.toThrow('DB error');
  });
});

describe('profiles.getFullByUserId', () => {
  it('should return full profile', async () => {
    const profile = { full_name: 'Dr. Full', cro: '12345', clinic_name: 'Clinic', phone: null, avatar_url: null, clinic_logo_url: null };
    terminalResult = { data: profile, error: null };
    const result = await getFullByUserId('user-1');
    expect(result).toEqual(profile);
    expect(mockSingle).toHaveBeenCalled();
  });

  it('should throw on error', async () => {
    terminalResult = { data: null, error: new Error('Profile error') };
    await expect(getFullByUserId('user-1')).rejects.toThrow('Profile error');
  });
});

describe('profiles.updateProfile', () => {
  it('should update without throwing on success', async () => {
    terminalResult = { error: null };
    await expect(updateProfile('user-1', { full_name: 'Updated' })).resolves.toBeUndefined();
    expect(mockUpdate).toHaveBeenCalledWith({ full_name: 'Updated' });
  });

  it('should throw on error', async () => {
    terminalResult = { error: new Error('Update failed') };
    await expect(updateProfile('user-1', { full_name: 'Test' })).rejects.toThrow('Update failed');
  });
});
