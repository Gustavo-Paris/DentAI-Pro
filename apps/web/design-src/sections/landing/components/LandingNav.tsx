import type React from 'react'

export interface LandingNavProps {
  brandName?: string
  onSignIn?: () => void
  onGetStarted?: () => void
}

export const LandingNav: React.FC<LandingNavProps> = ({
  brandName = 'ToSmile.ai',
  onSignIn,
  onGetStarted,
}) => (
  <nav className="sticky top-0 z-50 glass-panel border-b border-border/50">
    <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-3">
      <span className="text-lg font-bold text-primary neon-text tracking-tight">
        {brandName}
      </span>
      <div className="flex items-center gap-3">
        <button
          onClick={() => onSignIn?.()}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-1.5"
        >
          Entrar
        </button>
        <button
          onClick={() => onGetStarted?.()}
          className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring"
        >
          Comecar
        </button>
      </div>
    </div>
  </nav>
)
