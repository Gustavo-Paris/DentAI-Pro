import { useMemo } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { ReactRouterAppShell } from '@parisgroup-ai/pageshell/layouts/adapters/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_NAME } from '@/lib/branding';
import { CreditBadge } from '@/components/CreditBadge';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HelpButton } from '@/components/HelpButton';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  User,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

// Custom brand icon — renders the tooth SVG with gradient (matches /logo.svg).
// PageShell mobile header ignores logoSrc and renders icon inside a bg-primary badge.
// This component + CSS override (.brand-tooth-icon) shows the actual logo instead.
const BrandToothIcon = () => (
  <svg className="brand-tooth-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" fill="none">
    <defs>
      <linearGradient id="brand-teal" x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#5EDECE"/>
        <stop offset="50%" stopColor="#2A9D8F"/>
        <stop offset="100%" stopColor="#228B7E"/>
      </linearGradient>
    </defs>
    <path d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z" fill="url(#brand-teal)"/>
    <path d="M20 26C24 30 28 31.5 32 31.5C36 31.5 40 30 44 26" stroke="#2A9D8F" strokeWidth="2" strokeLinecap="round" fill="none" opacity="0.4"/>
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

  const userInfo = useMemo(() => ({
    name: user?.user_metadata?.full_name ?? user?.email,
    email: user?.email,
    image: user?.user_metadata?.avatar_url,
  }), [user?.user_metadata?.full_name, user?.email, user?.user_metadata?.avatar_url]);

  const userMenuItems = useMemo(() => [
    { label: t('components.layout.subscription', { defaultValue: 'Assinatura' }), href: '/profile?tab=assinatura', icon: CreditCard },
    { label: t('components.layout.support', { defaultValue: 'Suporte' }), href: 'mailto:suporte@tosmile.ai', icon: HelpCircle },
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
        title: BRAND_NAME,
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
