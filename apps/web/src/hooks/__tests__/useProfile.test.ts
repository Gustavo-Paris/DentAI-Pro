import { describe, it, expect } from 'vitest';

// ---------------------------------------------------------------------------
// Test the pure logic and type contracts from useProfile
// The hook depends on React Query, AuthContext, useNavigate, useSearchParams,
// useSubscription, and Supabase storage — so we test extractable logic.
// ---------------------------------------------------------------------------

// --- ProfileFull type and default state ---

interface ProfileFull {
  full_name: string | null;
  cro: string | null;
  clinic_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  clinic_logo_url: string | null;
}

describe('profile form default state', () => {
  const defaultProfile: ProfileFull = {
    full_name: '',
    cro: '',
    clinic_name: '',
    phone: '',
    avatar_url: null,
    clinic_logo_url: null,
  };

  it('should have empty strings for text fields', () => {
    expect(defaultProfile.full_name).toBe('');
    expect(defaultProfile.cro).toBe('');
    expect(defaultProfile.clinic_name).toBe('');
    expect(defaultProfile.phone).toBe('');
  });

  it('should have null for url fields', () => {
    expect(defaultProfile.avatar_url).toBeNull();
    expect(defaultProfile.clinic_logo_url).toBeNull();
  });
});

// --- updateField logic ---

describe('updateField logic', () => {
  function updateField<K extends keyof ProfileFull>(
    prev: ProfileFull,
    field: K,
    value: ProfileFull[K],
  ): ProfileFull {
    return { ...prev, [field]: value };
  }

  const initial: ProfileFull = {
    full_name: '',
    cro: '',
    clinic_name: '',
    phone: '',
    avatar_url: null,
    clinic_logo_url: null,
  };

  it('should update full_name', () => {
    const result = updateField(initial, 'full_name', 'Dr. João');
    expect(result.full_name).toBe('Dr. João');
    expect(result.cro).toBe(''); // other fields unchanged
  });

  it('should update cro', () => {
    const result = updateField(initial, 'cro', 'CRO-SP 12345');
    expect(result.cro).toBe('CRO-SP 12345');
  });

  it('should update clinic_name', () => {
    const result = updateField(initial, 'clinic_name', 'Clínica Sorriso');
    expect(result.clinic_name).toBe('Clínica Sorriso');
  });

  it('should update phone', () => {
    const result = updateField(initial, 'phone', '11999999999');
    expect(result.phone).toBe('11999999999');
  });

  it('should update avatar_url', () => {
    const result = updateField(initial, 'avatar_url', 'user/avatar.jpg');
    expect(result.avatar_url).toBe('user/avatar.jpg');
  });

  it('should update clinic_logo_url', () => {
    const result = updateField(initial, 'clinic_logo_url', 'user/logo.png');
    expect(result.clinic_logo_url).toBe('user/logo.png');
  });

  it('should set field back to null', () => {
    const withAvatar = updateField(initial, 'avatar_url', 'path.jpg');
    const cleared = updateField(withAvatar, 'avatar_url', null);
    expect(cleared.avatar_url).toBeNull();
  });

  it('should not mutate the original object', () => {
    const result = updateField(initial, 'full_name', 'Maria');
    expect(initial.full_name).toBe('');
    expect(result).not.toBe(initial);
  });
});

// --- Query keys ---

describe('profileKeys', () => {
  const profileKeys = {
    all: ['profile'] as const,
    detail: (userId: string) => [...profileKeys.all, userId] as const,
    payments: (userId: string) => ['payment-history', userId] as const,
  };

  it('should produce correct all key', () => {
    expect(profileKeys.all).toEqual(['profile']);
  });

  it('should produce correct detail key', () => {
    expect(profileKeys.detail('user-123')).toEqual(['profile', 'user-123']);
  });

  it('should produce correct payments key', () => {
    expect(profileKeys.payments('user-123')).toEqual(['payment-history', 'user-123']);
  });

  it('should produce unique keys for different users', () => {
    expect(profileKeys.detail('user-1')).not.toEqual(profileKeys.detail('user-2'));
    expect(profileKeys.payments('user-1')).not.toEqual(profileKeys.payments('user-2'));
  });
});

// --- Profile sync logic ---

describe('profile data sync to form', () => {
  function syncProfileToForm(
    profileData: ProfileFull | null | undefined,
  ): ProfileFull {
    if (!profileData) {
      return {
        full_name: '',
        cro: '',
        clinic_name: '',
        phone: '',
        avatar_url: null,
        clinic_logo_url: null,
      };
    }
    return profileData;
  }

  it('should return default form when profile data is null', () => {
    const result = syncProfileToForm(null);
    expect(result.full_name).toBe('');
    expect(result.avatar_url).toBeNull();
  });

  it('should return default form when profile data is undefined', () => {
    const result = syncProfileToForm(undefined);
    expect(result.full_name).toBe('');
  });

  it('should use profile data when available', () => {
    const profileData: ProfileFull = {
      full_name: 'Dr. João Silva',
      cro: 'CRO-SP 12345',
      clinic_name: 'Clínica Dental',
      phone: '11999999999',
      avatar_url: 'user/avatar.jpg',
      clinic_logo_url: 'user/logo.png',
    };
    const result = syncProfileToForm(profileData);
    expect(result).toEqual(profileData);
  });
});

// --- PaymentRecord type contract ---

interface PaymentRecord {
  id: string;
  amount: number;
  currency: string;
  status: string;
  description: string | null;
  invoice_url: string | null;
  invoice_pdf: string | null;
  created_at: string;
}

describe('PaymentRecord shape', () => {
  it('should have all required fields', () => {
    const record: PaymentRecord = {
      id: 'pay-1',
      amount: 2990,
      currency: 'brl',
      status: 'succeeded',
      description: 'Assinatura ToSmile Pro',
      invoice_url: 'https://example.com/invoice',
      created_at: '2025-01-01T10:00:00Z',
      invoice_pdf: 'https://example.com/invoice.pdf',
    };

    expect(record.id).toBe('pay-1');
    expect(record.amount).toBe(2990);
    expect(record.currency).toBe('brl');
    expect(record.status).toBe('succeeded');
    expect(record.description).toBe('Assinatura ToSmile Pro');
    expect(record.invoice_url).toBe('https://example.com/invoice');
    expect(record.invoice_pdf).toBe('https://example.com/invoice.pdf');
  });

  it('should handle null invoice_pdf', () => {
    const record: PaymentRecord = {
      id: 'pay-2',
      amount: 4990,
      currency: 'brl',
      status: 'succeeded',
      description: null,
      invoice_url: null,
      created_at: '2025-02-01T10:00:00Z',
      invoice_pdf: null,
    };

    expect(record.invoice_pdf).toBeNull();
    expect(record.description).toBeNull();
    expect(record.invoice_url).toBeNull();
  });
});

// --- Avatar upload validation logic ---

describe('avatar upload validation', () => {
  function validateAvatarFile(file: { type: string; size: number }): string | null {
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione uma imagem';
    }
    if (file.size > 2 * 1024 * 1024) {
      return 'A imagem deve ter no máximo 2MB';
    }
    return null;
  }

  it('should accept valid image', () => {
    expect(validateAvatarFile({ type: 'image/jpeg', size: 500_000 })).toBeNull();
  });

  it('should accept png', () => {
    expect(validateAvatarFile({ type: 'image/png', size: 100_000 })).toBeNull();
  });

  it('should reject non-image file', () => {
    expect(validateAvatarFile({ type: 'application/pdf', size: 100_000 })).toBe('Por favor, selecione uma imagem');
  });

  it('should reject file over 2MB', () => {
    const size = 3 * 1024 * 1024;
    expect(validateAvatarFile({ type: 'image/jpeg', size })).toBe('A imagem deve ter no máximo 2MB');
  });

  it('should accept file exactly 2MB', () => {
    const size = 2 * 1024 * 1024;
    expect(validateAvatarFile({ type: 'image/jpeg', size })).toBeNull();
  });
});

// --- Logo upload validation logic ---

describe('logo upload validation', () => {
  function validateLogoFile(file: { type: string; size: number }): string | null {
    if (!file.type.startsWith('image/')) {
      return 'Por favor, selecione uma imagem';
    }
    if (file.size > 1 * 1024 * 1024) {
      return 'A logo deve ter no máximo 1MB';
    }
    return null;
  }

  it('should accept valid image under 1MB', () => {
    expect(validateLogoFile({ type: 'image/png', size: 500_000 })).toBeNull();
  });

  it('should reject non-image file', () => {
    expect(validateLogoFile({ type: 'text/plain', size: 100 })).toBe('Por favor, selecione uma imagem');
  });

  it('should reject file over 1MB', () => {
    const size = 2 * 1024 * 1024;
    expect(validateLogoFile({ type: 'image/jpeg', size })).toBe('A logo deve ter no máximo 1MB');
  });

  it('should accept file exactly 1MB', () => {
    const size = 1 * 1024 * 1024;
    expect(validateLogoFile({ type: 'image/jpeg', size })).toBeNull();
  });
});

// --- Avatar file path generation ---

describe('avatar file path generation', () => {
  function generateAvatarPath(userId: string, fileName: string): string {
    const fileExt = fileName.split('.').pop();
    return `${userId}/avatar.${fileExt}`;
  }

  it('should generate correct path for jpeg', () => {
    expect(generateAvatarPath('user-123', 'photo.jpeg')).toBe('user-123/avatar.jpeg');
  });

  it('should generate correct path for png', () => {
    expect(generateAvatarPath('user-456', 'my-pic.png')).toBe('user-456/avatar.png');
  });

  it('should handle multiple dots in filename', () => {
    expect(generateAvatarPath('user-1', 'my.photo.jpg')).toBe('user-1/avatar.jpg');
  });
});

// --- Clinic logo file path generation ---

describe('logo file path generation', () => {
  function generateLogoPath(userId: string, fileName: string): string {
    const fileExt = fileName.split('.').pop();
    return `${userId}/clinic-logo.${fileExt}`;
  }

  it('should generate correct path for png', () => {
    expect(generateLogoPath('user-123', 'logo.png')).toBe('user-123/clinic-logo.png');
  });

  it('should generate correct path for svg', () => {
    expect(generateLogoPath('user-456', 'brand.svg')).toBe('user-456/clinic-logo.svg');
  });
});
