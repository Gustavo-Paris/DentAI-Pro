import { Outlet, useLocation } from 'react-router-dom';
import { NavLink } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
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
  LogOut,
  Search,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '@/components/ui/tooltip';

const navItems = [
  { to: '/dashboard', label: 'Início', icon: LayoutDashboard },
  { to: '/evaluations', label: 'Avaliações', icon: FileText },
  { to: '/patients', label: 'Pacientes', icon: Users },
  { to: '/inventory', label: 'Inventário', icon: Package },
  { to: '/profile', label: 'Perfil', icon: User },
] as const;

export default function AppLayout() {
  const { signOut } = useAuth();
  const location = useLocation();

  const handleSignOut = async () => {
    await signOut();
  };

  const openSearch = () => {
    document.dispatchEvent(new CustomEvent('open-global-search'));
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex fixed inset-y-0 left-0 z-30 w-56 flex-col border-r border-border bg-sidebar">
        {/* Logo — premium breathing room */}
        <div className="flex h-16 items-center px-5 border-b border-border">
          <span className="text-lg font-semibold tracking-[0.2em] font-display text-gradient-gold">{BRAND_NAME}</span>
        </div>

        <nav className="flex-1 py-4 px-2.5 space-y-0.5">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-primary/10 text-primary shadow-2xs'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )
              }
            >
              <item.icon className="w-[18px] h-[18px]" />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="border-t border-border p-3 space-y-3">
          <CreditBadge variant="compact" className="w-full justify-center" />
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  className="h-8 w-8 text-muted-foreground hover:text-destructive"
                  aria-label="Sair da conta"
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Encerrar sessão</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 border-b border-border bg-card/95 backdrop-blur-sm">
        <div className="flex items-center justify-between px-4 h-14">
          <span className="text-lg font-semibold tracking-[0.2em] font-display text-gradient-gold">{BRAND_NAME}</span>
          <div className="flex items-center gap-1.5">
            <button
              onClick={openSearch}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all duration-200 active:scale-95"
              aria-label="Buscar (⌘K)"
            >
              <Search className="w-[18px] h-[18px]" />
            </button>
            <CreditBadge variant="compact" />
            <ThemeToggle />
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-all duration-200 active:scale-95"
              aria-label="Sair da conta"
            >
              <LogOut className="w-[18px] h-[18px]" />
            </button>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="lg:pl-56 pb-20 lg:pb-0">
        <Outlet />
      </main>

      {/* Floating help button */}
      <HelpButton />

      {/* Mobile bottom nav */}
      <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 border-t border-border bg-card/95 backdrop-blur-sm safe-area-bottom">
        <div className="flex items-center justify-around h-[68px]">
          {navItems.map((item) => {
            const isActive =
              item.to === '/dashboard'
                ? location.pathname === '/dashboard'
                : location.pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                className={cn(
                  'relative flex flex-col items-center justify-center gap-0.5 min-w-[56px] h-12 px-3 rounded-xl transition-all duration-200 active:scale-[0.92]',
                  isActive ? 'bg-primary/12' : 'hover:bg-accent/50'
                )}
              >
                <item.icon
                  className={cn(
                    'w-[22px] h-[22px] transition-all duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                />
                <span
                  className={cn(
                    'text-[11px] font-medium leading-tight transition-all duration-200',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-5 h-[3px] rounded-full bg-primary" />
                )}
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
