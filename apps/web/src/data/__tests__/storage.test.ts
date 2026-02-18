import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  getSignedPhotoUrl,
  getSignedDSDUrl,
  getSignedDSDLayerUrls,
  uploadAvatar,
  removeAvatar,
  getAvatarPublicUrl,
} from '../storage';

// ---------------------------------------------------------------------------
// Mock supabase client — storage API
// ---------------------------------------------------------------------------

const mockCreateSignedUrl = vi.fn();
const mockUpload = vi.fn();
const mockRemove = vi.fn();
const mockGetPublicUrl = vi.fn();

vi.mock('../client', () => ({
  supabase: {
    storage: {
      from: (bucket: string) => ({
        createSignedUrl: (...args: unknown[]) => mockCreateSignedUrl(bucket, ...args),
        upload: (...args: unknown[]) => mockUpload(bucket, ...args),
        remove: (...args: unknown[]) => mockRemove(bucket, ...args),
        getPublicUrl: (...args: unknown[]) => {
          mockGetPublicUrl(bucket, ...args);
          return { data: { publicUrl: `https://storage.example.com/${bucket}/${args[0]}` } };
        },
      }),
    },
  },
}));

vi.mock('@/lib/constants', () => ({
  SIGNED_URL_EXPIRY_SECONDS: 3600,
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

beforeEach(() => {
  vi.clearAllMocks();
});

describe('getSignedPhotoUrl', () => {
  it('should return signed URL on success', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed-url.example.com/photo.jpg' },
      error: null,
    });

    const result = await getSignedPhotoUrl('user-1/photo.jpg');

    expect(result).toBe('https://signed-url.example.com/photo.jpg');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('clinical-photos', 'user-1/photo.jpg', 3600);
  });

  it('should return null on error', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: new Error('Signed URL error'),
    });

    const result = await getSignedPhotoUrl('user-1/photo.jpg');

    expect(result).toBeNull();
  });

  it('should return null when data has no signedUrl', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: null },
      error: null,
    });

    const result = await getSignedPhotoUrl('user-1/photo.jpg');

    expect(result).toBeNull();
  });

  it('should use custom expiry when provided', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed.example.com' },
      error: null,
    });

    await getSignedPhotoUrl('path.jpg', 7200);

    expect(mockCreateSignedUrl).toHaveBeenCalledWith('clinical-photos', 'path.jpg', 7200);
  });
});

describe('getSignedDSDUrl', () => {
  it('should return signed URL on success', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: { signedUrl: 'https://signed-url.example.com/dsd.jpg' },
      error: null,
    });

    const result = await getSignedDSDUrl('user-1/dsd.jpg');

    expect(result).toBe('https://signed-url.example.com/dsd.jpg');
    expect(mockCreateSignedUrl).toHaveBeenCalledWith('dsd-simulations', 'user-1/dsd.jpg', 3600);
  });

  it('should return null on error', async () => {
    mockCreateSignedUrl.mockResolvedValue({
      data: null,
      error: new Error('DSD error'),
    });

    const result = await getSignedDSDUrl('user-1/dsd.jpg');

    expect(result).toBeNull();
  });
});

describe('getSignedDSDLayerUrls', () => {
  it('should return object mapping paths to signed URLs', async () => {
    mockCreateSignedUrl
      .mockResolvedValueOnce({ data: { signedUrl: 'https://signed/layer1.png' }, error: null })
      .mockResolvedValueOnce({ data: { signedUrl: 'https://signed/layer2.png' }, error: null });

    const result = await getSignedDSDLayerUrls(['path/layer1.png', 'path/layer2.png']);

    expect(result).toEqual({
      'path/layer1.png': 'https://signed/layer1.png',
      'path/layer2.png': 'https://signed/layer2.png',
    });
  });

  it('should omit paths that fail to get signed URL', async () => {
    mockCreateSignedUrl
      .mockResolvedValueOnce({ data: { signedUrl: 'https://signed/ok.png' }, error: null })
      .mockResolvedValueOnce({ data: null, error: new Error('fail') });

    const result = await getSignedDSDLayerUrls(['ok.png', 'fail.png']);

    expect(result).toEqual({
      'ok.png': 'https://signed/ok.png',
    });
    expect(result).not.toHaveProperty('fail.png');
  });

  it('should return empty object for empty paths array', async () => {
    const result = await getSignedDSDLayerUrls([]);

    expect(result).toEqual({});
  });
});

describe('uploadAvatar', () => {
  it('should upload file and return path', async () => {
    mockUpload.mockResolvedValue({ error: null });

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    const result = await uploadAvatar('user-1', file, 'profile');

    expect(result).toBe('user-1/profile.png');
    expect(mockUpload).toHaveBeenCalledWith(
      'avatars',
      'user-1/profile.png',
      file,
      { upsert: true },
    );
  });

  it('should remove old file when oldPath provided', async () => {
    mockRemove.mockResolvedValue({ error: null });
    mockUpload.mockResolvedValue({ error: null });

    const file = new File(['data'], 'new-avatar.jpg', { type: 'image/jpeg' });
    await uploadAvatar('user-1', file, 'profile', 'user-1/old-profile.jpg');

    expect(mockRemove).toHaveBeenCalledWith('avatars', ['user-1/old-profile.jpg']);
  });

  it('should not remove old file when oldPath is not provided', async () => {
    mockUpload.mockResolvedValue({ error: null });

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    await uploadAvatar('user-1', file, 'profile');

    expect(mockRemove).not.toHaveBeenCalled();
  });

  it('should throw when upload fails', async () => {
    mockUpload.mockResolvedValue({ error: new Error('Upload failed') });

    const file = new File(['data'], 'avatar.png', { type: 'image/png' });
    await expect(uploadAvatar('user-1', file, 'profile')).rejects.toThrow('Upload failed');
  });
});

describe('removeAvatar', () => {
  it('should call remove with path', async () => {
    mockRemove.mockResolvedValue({ error: null });

    await removeAvatar('user-1/profile.png');

    expect(mockRemove).toHaveBeenCalledWith('avatars', ['user-1/profile.png']);
  });
});

describe('getAvatarPublicUrl', () => {
  it('should return public URL', () => {
    const result = getAvatarPublicUrl('user-1/profile.png');

    expect(result).toBe('https://storage.example.com/avatars/user-1/profile.png');
    expect(mockGetPublicUrl).toHaveBeenCalledWith('avatars', 'user-1/profile.png');
  });
});
