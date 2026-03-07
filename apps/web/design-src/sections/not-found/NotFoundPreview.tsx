import '../../preview-theme.css'
import sampleData from '../../../design/sections/not-found/data.json'

const BRAND = 'ToSmile.ai'

export default function NotFoundPreview() {
  return (
    <div className="section-glow-bg relative min-h-screen flex flex-col">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 500,
            height: 500,
            top: '30%',
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.10) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 300,
            height: 300,
            top: '15%',
            left: '15%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.06) 0%, transparent 70%)',
            animationDelay: '4s',
          }}
        />
      </div>

      {/* Tooth SVG watermark */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
        <svg
          width="320"
          height="320"
          viewBox="0 0 100 120"
          fill="currentColor"
          className="text-foreground opacity-[0.04]"
          aria-hidden="true"
        >
          <path d="M50 5C35 5 25 15 20 25C15 35 12 50 15 65C18 80 22 90 28 100C32 107 38 115 42 115C46 115 48 105 50 95C52 105 54 115 58 115C62 115 68 107 72 100C78 90 82 80 85 65C88 50 85 35 80 25C75 15 65 5 50 5Z" />
        </svg>
      </div>

      {/* Header */}
      <header
        className="relative border-b border-border"
        style={{ animation: 'fade-in-up 0.6s ease-out 0s both' }}
      >
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <span className="font-display tracking-[0.2em] text-gradient-brand text-lg font-semibold cursor-pointer">
            {BRAND}
          </span>
        </div>
      </header>

      {/* Centered error content */}
      <div className="relative flex flex-1 items-center justify-center px-4">
        <div className="text-center max-w-sm">
          {/* SearchX icon */}
          <div
            style={{ animation: 'fade-in-up 0.6s ease-out 0.15s both' }}
          >
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
          </div>

          {/* Error code */}
          <p
            className="text-8xl font-bold font-display text-primary/20 mb-2 neon-text"
            aria-hidden="true"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.25s both' }}
          >
            {sampleData.errorCode}
          </p>

          {/* Heading */}
          <h1
            className="text-heading neon-text text-xl sm:text-2xl font-semibold mb-3"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.35s both' }}
          >
            {sampleData.heading}
          </h1>

          {/* Description */}
          <p
            className="text-sm text-muted-foreground mb-8 leading-relaxed"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.45s both' }}
          >
            {sampleData.description}
          </p>

          {/* Action buttons */}
          <div
            className="flex flex-col sm:flex-row items-center justify-center gap-3"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.55s both' }}
          >
            {/* Primary CTA */}
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
                <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Voltar ao Dashboard
            </button>

            {/* Secondary CTA */}
            <button className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2">
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
              Pagina Inicial
            </button>
          </div>
        </div>
      </div>

      {/* Brand name at bottom */}
      <div
        className="relative text-center pb-8 pt-4"
        style={{ animation: 'fade-in-up 0.6s ease-out 0.7s both' }}
      >
        <span className="text-sm font-display text-gradient-brand font-semibold tracking-wider">
          {BRAND}
        </span>
      </div>
    </div>
  )
}
