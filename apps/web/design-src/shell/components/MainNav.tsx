import {
  LayoutDashboard,
  FileText,
  Users,
  Package,
  User,
  CreditCard,
  HelpCircle,
} from 'lucide-react'

export interface NavSection {
  label?: string
  items: Array<{
    title: string
    href: string
    icon?: React.ComponentType
    exact?: boolean
    external?: boolean
  }>
}

export function getDefaultNavigation(): NavSection[] {
  return [
    {
      items: [
        { title: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
        { title: 'Avaliações', href: '/evaluations', icon: FileText },
        { title: 'Pacientes', href: '/patients', icon: Users },
        { title: 'Inventário', href: '/inventory', icon: Package },
      ],
    },
    {
      label: 'Conta',
      items: [
        { title: 'Perfil', href: '/profile', icon: User, exact: true },
        { title: 'Assinatura', href: '/profile?tab=assinatura', icon: CreditCard },
        { title: 'Suporte', href: 'mailto:suporte@tosmile.ai', icon: HelpCircle, external: true },
      ],
    },
  ]
}

export function MainNav() {
  const sections = getDefaultNavigation()
  return (
    <nav aria-label="Main navigation">
      {sections.map((section, i) => (
        <div key={i}>
          {section.label && (
            <span className="text-overline text-muted-foreground px-3 mb-1 block">
              {section.label}
            </span>
          )}
          <ul>
            {section.items.map((item) => (
              <li key={item.href}>
                <a href={item.href} className="flex items-center gap-2 px-3 py-2 rounded-md text-sm hover:bg-accent">
                  {item.icon && <item.icon />}
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  )
}
