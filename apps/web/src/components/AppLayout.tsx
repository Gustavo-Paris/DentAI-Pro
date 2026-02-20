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
        icon: LayoutDashboard,
        title: BRAND_NAME,
        href: '/dashboard',
      }}
      navigation={navigation}
      user={userInfo}
      userMenuItems={userMenuItems}
      onSignOut={signOut}
      themeToggle={themeToggleSlot}
      footer={footerSlot}
      headerRight={headerRightSlot}
    >
      <HelpButton />
      <Outlet />
    </ReactRouterAppShell>
  );
}
