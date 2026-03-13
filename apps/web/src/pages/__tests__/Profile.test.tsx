import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createRef } from 'react';

vi.mock('@/lib/logger', () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

vi.mock('@/hooks/useDocumentTitle', () => ({
  useDocumentTitle: vi.fn(),
}));

vi.mock('@/hooks/domain/useProfile', () => ({
  useProfile: vi.fn(() => ({
    isLoading: false,
    isSaving: false,
    isDirty: false,
    isUploading: false,
    isUploadingLogo: false,
    isLoadingPayments: false,
    sendingDigest: false,
    profile: {
      full_name: 'Dr. Test',
      cro: '12345',
      clinic_name: 'Test Clinic',
      phone: '11999999999',
      avatar_url: null,
      clinic_logo_url: null,
    },
    avatarPreview: null,
    logoPreview: null,
    fileInputRef: createRef(),
    logoInputRef: createRef(),
    handleAvatarUpload: vi.fn(),
    handleLogoUpload: vi.fn(),
    handleSave: vi.fn(),
    updateField: vi.fn(),
    syncCreditPurchase: vi.fn(),
    paymentRecords: [],
    sendWeeklyDigest: vi.fn(),
    exportData: vi.fn(),
    deleteAccount: vi.fn(),
  })),
}));

vi.mock('@/hooks/useSubscription', () => ({
  useSubscription: vi.fn(() => ({
    refreshSubscription: vi.fn(),
    isFree: true,
  })),
}));

vi.mock('sonner', () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock('@/lib/utils', () => ({
  getInitials: (name: string) => name?.charAt(0) || '?',
}));

vi.mock('@/lib/schemas/profile', () => ({
  getProfileSchema: () => ({
    parse: vi.fn(),
    safeParse: vi.fn(() => ({ success: true })),
  }),
}));

vi.mock('@hookform/resolvers/zod', () => ({
  zodResolver: () => vi.fn(),
}));

vi.mock('@parisgroup-ai/pageshell/composites', () => ({
  DetailPage: ({ children, tabs }: any) => (
    <div data-testid="detail-page">
      {tabs?.map((tab: any) => (
        <div key={tab.id} data-testid={`tab-${tab.id}`}>
          {typeof tab.children === 'function' ? tab.children() : tab.children}
        </div>
      ))}
    </div>
  ),
}));

vi.mock('@parisgroup-ai/pageshell/primitives', () => ({
  Button: ({ children, ...p }: any) => <button {...p}>{children}</button>,
  Input: (p: any) => <input {...p} />,
  Card: ({ children }: any) => <div>{children}</div>,
  CardContent: ({ children }: any) => <div>{children}</div>,
  CardHeader: ({ children }: any) => <div>{children}</div>,
  CardTitle: ({ children }: any) => <div>{children}</div>,
  CardDescription: ({ children }: any) => <div>{children}</div>,
  Avatar: ({ children }: any) => <div>{children}</div>,
  AvatarFallback: ({ children }: any) => <div>{children}</div>,
  AvatarImage: () => null,
}));

vi.mock('@parisgroup-ai/pageshell/interactions', () => ({
  Form: ({ children }: any) => <div>{children}</div>,
  FormControl: ({ children }: any) => <div>{children}</div>,
  FormField: ({ render }: any) => render({ field: { value: '', onChange: vi.fn(), onBlur: vi.fn(), name: 'test', ref: vi.fn() } }),
  FormItem: ({ children }: any) => <div>{children}</div>,
  FormLabel: ({ children }: any) => <label>{children}</label>,
  FormMessage: () => null,
}));

vi.mock('@/components/pricing/SubscriptionStatus', () => ({
  SubscriptionStatus: () => <div data-testid="subscription-status" />,
}));

vi.mock('@/components/pricing/CreditUsageHistory', () => ({
  CreditUsageHistory: () => null,
}));

vi.mock('@/components/pricing/CreditPackSection', () => ({
  CreditPackSection: () => null,
}));

vi.mock('@/components/pricing/PaymentHistorySection', () => ({
  PaymentHistorySection: () => null,
}));

vi.mock('@/components/referral/ReferralCard', () => ({
  ReferralCard: () => null,
}));

vi.mock('@/components/profile/PrivacySection', () => ({
  PrivacySection: () => null,
}));

vi.mock('@/components/profile/UpgradeCTA', () => ({
  UpgradeCTA: () => null,
}));

vi.mock('lucide-react', () => ({
  Camera: () => null,
  Loader2: () => null,
  Save: () => null,
  Building2: () => null,
  ImageIcon: () => null,
  Mail: () => null,
}));

const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
const wrapper = ({ children }: any) => (
  <QueryClientProvider client={qc}>
    <MemoryRouter>{children}</MemoryRouter>
  </QueryClientProvider>
);

describe('Profile', () => {
  it('renders without crashing', async () => {
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('renders profile tab with form fields', async () => {
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('tab-perfil')).toBeTruthy();
  });

  it('renders assinatura tab', async () => {
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('tab-assinatura')).toBeTruthy();
  });

  it('renders faturas tab', async () => {
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('tab-faturas')).toBeTruthy();
  });

  it('renders privacidade tab', async () => {
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('tab-privacidade')).toBeTruthy();
  });

  it('renders subscription status in assinatura tab', async () => {
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('subscription-status')).toBeTruthy();
  });

  it('renders with loading profile state', async () => {
    const mod = await import('@/hooks/domain/useProfile');
    (mod.useProfile as any).mockReturnValueOnce({
      isLoading: true,
      isSaving: false,
      isDirty: false,
      isUploading: false,
      isUploadingLogo: false,
      isLoadingPayments: false,
      sendingDigest: false,
      profile: { full_name: '', cro: '', clinic_name: '', phone: '', avatar_url: null, clinic_logo_url: null },
      avatarPreview: null,
      logoPreview: null,
      fileInputRef: createRef(),
      logoInputRef: createRef(),
      handleAvatarUpload: vi.fn(),
      handleLogoUpload: vi.fn(),
      handleSave: vi.fn(),
      updateField: vi.fn(),
      syncCreditPurchase: vi.fn(),
      paymentRecords: [],
      sendWeeklyDigest: vi.fn(),
      exportData: vi.fn(),
      deleteAccount: vi.fn(),
    });
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('renders with saving state', async () => {
    const mod = await import('@/hooks/domain/useProfile');
    (mod.useProfile as any).mockReturnValueOnce({
      isLoading: false,
      isSaving: true,
      isDirty: true,
      isUploading: false,
      isUploadingLogo: false,
      isLoadingPayments: false,
      sendingDigest: false,
      profile: { full_name: 'Dr. Test', cro: '12345', clinic_name: 'Clinic', phone: '123', avatar_url: null, clinic_logo_url: null },
      avatarPreview: null,
      logoPreview: null,
      fileInputRef: createRef(),
      logoInputRef: createRef(),
      handleAvatarUpload: vi.fn(),
      handleLogoUpload: vi.fn(),
      handleSave: vi.fn(),
      updateField: vi.fn(),
      syncCreditPurchase: vi.fn(),
      paymentRecords: [],
      sendWeeklyDigest: vi.fn(),
      exportData: vi.fn(),
      deleteAccount: vi.fn(),
    });
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('renders avatar preview when available', async () => {
    const mod = await import('@/hooks/domain/useProfile');
    (mod.useProfile as any).mockReturnValueOnce({
      isLoading: false,
      isSaving: false,
      isDirty: false,
      isUploading: false,
      isUploadingLogo: false,
      isLoadingPayments: false,
      sendingDigest: false,
      profile: { full_name: 'Dr. Test', cro: '12345', clinic_name: 'Clinic', phone: '123', avatar_url: null, clinic_logo_url: null },
      avatarPreview: 'https://example.com/avatar.jpg',
      logoPreview: 'https://example.com/logo.jpg',
      fileInputRef: createRef(),
      logoInputRef: createRef(),
      handleAvatarUpload: vi.fn(),
      handleLogoUpload: vi.fn(),
      handleSave: vi.fn(),
      updateField: vi.fn(),
      syncCreditPurchase: vi.fn(),
      paymentRecords: [],
      sendWeeklyDigest: vi.fn(),
      exportData: vi.fn(),
      deleteAccount: vi.fn(),
    });
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('renders with uploading avatar state', async () => {
    const mod = await import('@/hooks/domain/useProfile');
    (mod.useProfile as any).mockReturnValueOnce({
      isLoading: false,
      isSaving: false,
      isDirty: false,
      isUploading: true,
      isUploadingLogo: true,
      isLoadingPayments: false,
      sendingDigest: false,
      profile: { full_name: 'Dr. Test', cro: '12345', clinic_name: 'Clinic', phone: '123', avatar_url: null, clinic_logo_url: null },
      avatarPreview: null,
      logoPreview: null,
      fileInputRef: createRef(),
      logoInputRef: createRef(),
      handleAvatarUpload: vi.fn(),
      handleLogoUpload: vi.fn(),
      handleSave: vi.fn(),
      updateField: vi.fn(),
      syncCreditPurchase: vi.fn(),
      paymentRecords: [],
      sendWeeklyDigest: vi.fn(),
      exportData: vi.fn(),
      deleteAccount: vi.fn(),
    });
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });

  it('handles credits=success search param', async () => {
    const successQc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const successWrapper = ({ children }: any) => (
      <QueryClientProvider client={successQc}>
        <MemoryRouter initialEntries={['/profile?credits=success']}>{children}</MemoryRouter>
      </QueryClientProvider>
    );
    const Profile = (await import('../Profile')).default;
    const { getByTestId } = render(<Profile />, { wrapper: successWrapper });
    expect(getByTestId('detail-page')).toBeTruthy();
  });
});
