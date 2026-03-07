import React from 'react'
import '../../preview-theme.css'

const BRAND = 'ToSmile.ai'

export default function NotFoundPreview() {
  return (
    <div className="section-glow-bg relative min-h-screen flex flex-col">
      {/* Ambient glow orb */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 450,
            height: 450,
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
      </div>

      {/* Header */}
      <header className="relative border-b border-border">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <span className="font-display tracking-[0.2em] text-gradient-brand text-lg font-semibold">
            {BRAND}
          </span>
        </div>
      </header>

      {/* Centered error content */}
      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {/* SearchX icon */}
          <svg
            width="64"
            height="64"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground/30 mx-auto mb-4"
            aria-hidden="true"
          >
            <path d="m13.5 8.5-5 5" />
            <path d="m8.5 8.5 5 5" />
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>

          {/* Error code */}
          <p
            className="text-6xl font-semibold font-display text-muted-foreground/50 mb-2"
            aria-hidden="true"
          >
            404
          </p>

          {/* Heading */}
          <h1 className="text-xl font-semibold font-display mb-2">
            Página não encontrada
          </h1>

          {/* Description */}
          <p className="text-sm text-muted-foreground mb-6">
            O endereço que você tentou acessar não existe ou foi removido.
          </p>

          {/* CTA Button */}
          <button className="btn-glow inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="m12 19-7-7 7-7" />
              <path d="M19 12H5" />
            </svg>
            Voltar ao início
          </button>
        </div>
      </div>
    </div>
  )
}
