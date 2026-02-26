import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ReactRouterAppShell } from '@parisgroup-ai/pageshell/layouts/adapters/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_NAME } from '@/lib/branding';
import { CreditBadge } from '@/components/CreditBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HelpButton } from '@/components/HelpButton';
import * as profiles from '@/data/profiles';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  User,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

// Custom brand icon — renders the tooth SVG with teal gradient (matches /logo.svg).
// PageShell mobile header ignores logoSrc and renders icon inside a bg-primary badge.
// This component + CSS override (.brand-tooth-icon) shows the actual logo instead.
const BrandToothIcon = () => (
  <svg className="brand-tooth-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="brand-teal" x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#22d3ee"/>
        <stop offset="50%" stopColor="#06b6d4"/>
        <stop offset="100%" stopColor="#0891b2"/>
      </linearGradient>
    </defs>
    <path d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z" fill="url(#brand-teal)"/>
    <path d="M20 26C24 30 28 31.5 32 31.5C36 31.5 40 30 44 26" stroke="#06b6d4" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
  </svg>
);

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  const navigation = useMemo(() => [
    {
      items: [
        { title: t('components.layout.home'), href: '/dashboard', icon: LayoutDashboard, exact: true },
        { title: t('components.layout.evaluations'), href: '/evaluations', icon: FileText },
        { title: t('components.layout.patients'), href: '/patients', icon: Users },
        { title: t('components.layout.inventory'), href: '/inventory', icon: Package },
        { title: t('components.layout.profile'), href: '/profile', icon: User },
      ],
    },
  ], [t]);

  // Fetch avatar from profiles table (Supabase Storage) — same source as Profile page.
  // Falls back to Google OAuth avatar_url from user_metadata.
  const { data: profile } = useQuery({
    queryKey: ['profile', user?.id],
    queryFn: () => profiles.getByUserId(user!.id),
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  const userInfo = useMemo(() => {
    const storageAvatar = profile?.avatar_url
      ? profiles.getAvatarPublicUrl(profile.avatar_url)
      : undefined;
    const oauthAvatar = user?.user_metadata?.avatar_url as string | undefined;

    return {
      name: profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email,
      email: user?.email,
      image: storageAvatar || oauthAvatar,
    };
  }, [profile, user?.user_metadata?.full_name, user?.user_metadata?.avatar_url, user?.email]);

  const userMenuItems = useMemo(() => [
    { label: t('components.layout.subscription'), href: '/profile?tab=assinatura', icon: CreditCard },
    { label: t('components.layout.support'), href: 'mailto:suporte@tosmile.ai', icon: HelpCircle },
  ], [t]);

  const themeToggleSlot = useMemo(() => <ThemeToggle />, []);
  const footerSlot = useMemo(() => <CreditBadge variant="compact" className="w-full justify-center" />, []);
  const headerRightSlot = useMemo(() => <CreditBadge variant="compact" />, []);

  return (
    <ReactRouterAppShell
      theme="odonto-ai"
      brand={{
        logoSrc: '/logo.svg',
        icon: BrandToothIcon,
        // PageShell types say string, but it renders as React children — JSX works at runtime.
        // This is more reliable than CSS :has() selectors for applying the brand gradient.
        title: (<span className="text-gradient-brand">{BRAND_NAME}</span>) as unknown as string,
        href: '/dashboard',
      }}
      headerThemeToggle={themeToggleSlot}
      navigation={navigation}
      user={userInfo}
      userMenuItems={userMenuItems}
      onSignOut={signOut}
      themeToggle={themeToggleSlot}
      footer={footerSlot}
      headerRight={headerRightSlot}
    >
      <HelpButton />
      <main id="main-content" className="route-enter">
        <Outlet />
      </main>
    </ReactRouterAppShell>
  );
}
