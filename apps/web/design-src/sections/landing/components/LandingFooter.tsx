import type React from 'react'

export interface LandingFooterProps {
  brandName?: string
  year?: number
  onTerms?: () => void
  onPrivacy?: () => void
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  brandName = 'ToSmile.ai',
  year = 2026,
  onTerms,
  onPrivacy,
}) => (
  <footer className="px-6 py-8 border-t border-border/50">
    <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
      <p className="text-xs text-muted-foreground">
        &copy; {year} {brandName}. Ferramenta de apoio a decisao clinica.
      </p>
      <div className="flex items-center gap-6">
        <button
          onClick={() => onTerms?.()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          Termos de Uso
        </button>
        <button
          onClick={() => onPrivacy?.()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded px-1"
        >
          Privacidade
        </button>
      </div>
    </div>
  </footer>
)
