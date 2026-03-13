import { useMemo, useState, useCallback } from 'react';
import { Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { ReactRouterAppShell } from '@parisgroup-ai/pageshell/layouts/adapters/react-router';
import { useAuth } from '@/contexts/AuthContext';
import { BRAND_NAME } from '@/lib/branding';
import { ToSmileLogo } from '@/components/ToSmileLogo';
import { CreditBadge } from '@/components/CreditBadge';
import { PaymentWarningBanner } from '@/components/pricing/PaymentWarningBanner';
import { SidebarCredits } from '@/components/SidebarCredits';
import { ThemeToggle } from '@/components/ThemeToggle';
import { HelpButton } from '@/components/HelpButton';
import * as profiles from '@/data/profiles';
import { QUERY_STALE_TIMES } from '@/lib/constants';
import { profileKeys } from '@/lib/query-keys';
import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  User,
  CreditCard,
  HelpCircle,
} from 'lucide-react';

// Custom brand icon — reuses ToSmileLogo for consistency across all brand touchpoints.
// PageShell mobile header ignores logoSrc and renders icon inside a bg-primary badge.
// This component + CSS override (.brand-tooth-icon) shows the actual logo instead.
const BrandToothIcon = () => <ToSmileLogo className="brand-tooth-icon" />;

/**
 * Avatar with fallback chain: tries each URL in order, shows initials if all fail.
 * Uses `key` reset via urlsKey to avoid stale state when props change.
 */
function AvatarWithFallback({ urls, alt, width, height, className }: {
  urls: string[]; alt: string; width: number; height: number; className: string;
}) {
  const [index, setIndex] = useState(0);

  const currentUrl = urls[index];

  if (!currentUrl) {
    const initials = (alt || '?').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    return (
      <div
        className={`flex items-center justify-center rounded-full bg-sidebar-accent text-sidebar-accent-foreground font-medium text-xs ${className}`}
        style={{ width, height }}
      >
        {initials}
      </div>
    );
  }

  return (
    <img
      src={currentUrl}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setIndex(i => i + 1)}
    />
  );
}

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
      ],
    },
    {
      label: t('components.layout.account'),
      items: [
        { title: t('components.layout.profile'), href: '/profile', icon: User, exact: true },
        { title: t('components.layout.subscription'), href: '/profile?tab=assinatura', icon: CreditCard },
        { title: t('components.layout.support'), href: 'mailto:suporte@tosmile.ai', icon: HelpCircle, external: true },
      ],
    },
  ], [t]);

  // Fetch avatar from profiles table (Supabase Storage) — same source as Profile page.
  // Falls back to Google OAuth avatar_url from user_metadata.
  const { data: profile } = useQuery({
    queryKey: profileKeys.detail(user?.id || ''),
    queryFn: () => profiles.getByUserId(user!.id),
    enabled: !!user?.id,
    staleTime: QUERY_STALE_TIMES.MEDIUM,
  });

  const oauthAvatar = user?.user_metadata?.avatar_url as string | undefined;
  const storageAvatar = profile?.avatar_url
    ? profiles.getAvatarPublicUrl(profile.avatar_url)
    : undefined;

  // Ordered fallback chain: Storage → OAuth (filtered to only truthy values)
  const avatarUrls = useMemo(
    () => [storageAvatar, oauthAvatar].filter((u): u is string => !!u),
    [storageAvatar, oauthAvatar],
  );

  const userInfo = useMemo(() => ({
    name: profile?.full_name ?? user?.user_metadata?.full_name ?? user?.email,
    email: user?.email,
    image: avatarUrls[0],
  }), [profile?.full_name, user?.user_metadata?.full_name, user?.email, avatarUrls]);

  // Custom renderAvatar — fallback chain: Storage URL → OAuth URL → initials
  // key={urls.join} resets component state when the URL list changes
  const renderAvatar = useCallback(
    (props: { src: string; alt: string; width: number; height: number; className: string }) =>
      <AvatarWithFallback key={avatarUrls.join(',')} urls={avatarUrls} alt={props.alt} width={props.width} height={props.height} className={props.className} />,
    [avatarUrls],
  );

  // User menu — only theme toggle and sign out remain (Perfil/Assinatura/Suporte moved to nav)
  const userMenuItems = useMemo(() => [] as Array<{ label: string; href: string; icon?: typeof CreditCard }>, []);

  const themeToggleSlot = useMemo(() => <ThemeToggle />, []);
  const footerSlot = useMemo(() => <SidebarCredits />, []);
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
      renderAvatar={renderAvatar}
      headerThemeToggle={themeToggleSlot}
      showHeaderThemeToggle={false}
      navigation={navigation}
      user={userInfo}
      userMenuItems={userMenuItems}
      onSignOut={signOut}
      themeToggle={themeToggleSlot}
      footer={footerSlot}
      headerRight={headerRightSlot}
    >
      <HelpButton />
      <main id="main-content" className="route-enter section-glow-bg min-h-screen relative overflow-hidden">
        {/* Shared ambient effects — consistent across all pages */}
        <div className="glow-orb w-72 h-72 bg-primary/15 dark:bg-primary/20 top-[-5%] right-[5%]" aria-hidden="true" />
        <div className="glow-orb glow-orb-slow glow-orb-reverse w-56 h-56 bg-[rgb(var(--accent-violet-rgb)/0.10)] dark:bg-[rgb(var(--accent-violet-rgb)/0.12)] top-[40%] left-[-8%]" aria-hidden="true" />
        <div className="glow-orb glow-orb-slow w-48 h-48 bg-primary/10 dark:bg-primary/15 bottom-[10%] right-[55%]" aria-hidden="true" />
        <div className="ai-grid-pattern absolute inset-0 opacity-30 dark:opacity-50 [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,black_70%,transparent_100%)] pointer-events-none" aria-hidden="true" />
        <div className="relative z-10">
          <div className="px-4 pt-4 sm:px-6 lg:px-8 empty:hidden">
            <PaymentWarningBanner />
          </div>
          <Outlet />
        </div>
      </main>
    </ReactRouterAppShell>
  );
}
