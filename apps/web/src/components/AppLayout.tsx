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
} from 'lucide-react';

export default function AppLayout() {
  const { t } = useTranslation();
  const { user, signOut } = useAuth();

  return (
    <ReactRouterAppShell
      theme="odonto-ai"
      brand={{
        icon: LayoutDashboard,
        title: BRAND_NAME,
        href: '/dashboard',
      }}
      navigation={[
        {
          items: [
            { title: t('components.layout.home'), href: '/dashboard', icon: LayoutDashboard, exact: true },
            { title: t('components.layout.evaluations'), href: '/evaluations', icon: FileText },
            { title: t('components.layout.patients'), href: '/patients', icon: Users },
            { title: t('components.layout.inventory'), href: '/inventory', icon: Package },
            { title: t('components.layout.profile'), href: '/profile', icon: User },
          ],
        },
      ]}
      user={{
        name: user?.user_metadata?.full_name ?? user?.email,
        email: user?.email,
        image: user?.user_metadata?.avatar_url,
      }}
      userMenuItems={[
        { label: t('components.layout.profile'), href: '/profile', icon: User },
      ]}
      onSignOut={signOut}
      themeToggle={<ThemeToggle />}
      footer={<CreditBadge variant="compact" className="w-full justify-center" />}
      headerRight={<CreditBadge variant="compact" />}
    >
      <HelpButton />
      <Outlet />
    </ReactRouterAppShell>
  );
}
