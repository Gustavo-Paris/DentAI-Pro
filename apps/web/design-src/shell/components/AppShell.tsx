import { ReactRouterAppShell } from '@parisgroup-ai/pageshell/layouts/adapters/react-router'
import { MainNav } from './MainNav'
import { ProductUserMenu } from './UserMenu'
import { BrandIcon } from './BrandIcon'

interface ProductShellProps {
  children: React.ReactNode
  navigationItems: Array<{
    label?: string
    items: Array<{ title: string; href: string; icon?: React.ComponentType; exact?: boolean; external?: boolean }>
  }>
  user?: { name: string; email?: string; image?: string }
  headerRight?: React.ReactNode
  footer?: React.ReactNode
  themeToggle?: React.ReactNode
  onSignOut?: () => void
}

export function ProductShell({
  children,
  navigationItems,
  user,
  headerRight,
  footer,
  themeToggle,
  onSignOut,
}: ProductShellProps) {
  return (
    <ReactRouterAppShell
      theme="odonto-ai"
      brand={{
        logoSrc: '/logo.svg',
        icon: BrandIcon,
        title: 'ToSmile' as string,
        href: '/dashboard',
      }}
      navigation={navigationItems}
      user={user}
      userMenuItems={[]}
      onSignOut={onSignOut}
      themeToggle={themeToggle}
      headerThemeToggle={themeToggle}
      footer={footer}
      headerRight={headerRight}
    >
      {children}
    </ReactRouterAppShell>
  )
}
