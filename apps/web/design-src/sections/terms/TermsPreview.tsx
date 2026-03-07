import '../../preview-theme.css'
import sampleData from '../../../design/sections/terms/data.json'

const BRAND = 'ToSmile.ai'

/* Show 5 representative sections: 1, 2, 3, 7, 12 */
const VISIBLE_SECTIONS = [1, 2, 3, 7, 12]

const tocEntries = sampleData.sections.map((s) => ({
  number: s.number,
  title: s.title,
}))

function EmailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-primary hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded"
    >
      {email}
    </a>
  )
}

interface TermsSection {
  number: number
  title: string
  paragraphs?: string[]
  items?: string[]
  important?: string
  closing?: string
}

function SectionCard({
  section,
  index,
}: {
  section: TermsSection
  index: number
}) {
  const delay = 0.3 + index * 0.15
  return (
    <section
      className="glass-panel rounded-xl p-6 sm:p-8"
      style={{ animation: `fade-in-up 0.6s ease-out ${delay}s both` }}
    >
      <h2 className="text-heading text-xl font-semibold mb-4">
        <span className="text-primary mr-2">{section.number}.</span>
        {section.title}
      </h2>

      {section.important && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 px-4 py-3 mb-4">
          <p className="text-sm font-semibold text-warning">
            {section.important}
          </p>
        </div>
      )}

      {section.paragraphs?.map((p, i) => (
        <p
          key={i}
          className="text-muted-foreground leading-relaxed mb-3 last:mb-0"
        >
          {p}
        </p>
      ))}

      {section.items && (
        <ul className="list-disc list-inside text-muted-foreground space-y-1.5 mt-3 ml-1">
          {section.items.map((item, i) => (
            <li key={i} className="leading-relaxed">
              {item}
            </li>
          ))}
        </ul>
      )}

      {section.closing && (
        <p className="text-muted-foreground leading-relaxed mt-4 font-medium">
          {section.closing}
        </p>
      )}

      {section.number === 12 && (
        <p className="text-muted-foreground leading-relaxed mt-2">
          <EmailLink email={sampleData.contactEmail} />
        </p>
      )}
    </section>
  )
}

export default function TermsPreview() {
  const visibleSections = sampleData.sections.filter((s) =>
    VISIBLE_SECTIONS.includes(s.number)
  ) as TermsSection[]

  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Ambient glow orbs */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 400,
            height: 400,
            top: '5%',
            left: '10%',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)',
          }}
        />
        <div
          className="glow-orb glow-orb-slow"
          style={{
            width: 350,
            height: 350,
            top: '50%',
            right: '5%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.06) 0%, transparent 70%)',
            animationDelay: '5s',
          }}
        />
      </div>

      <div className="relative">
        {/* Nav bar */}
        <header
          className="border-b border-border"
          style={{ animation: 'fade-in-up 0.6s ease-out 0s both' }}
        >
          <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <span className="text-xl font-display font-semibold text-gradient-brand cursor-pointer">
              {BRAND}
            </span>
            <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-3 py-1.5">
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
              Voltar
            </button>
          </div>
        </header>

        {/* Main content */}
        <main className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6">
          {/* Page title */}
          <div style={{ animation: 'fade-in-up 0.6s ease-out 0.1s both' }}>
            <h1 className="text-heading neon-text text-2xl sm:text-3xl font-semibold mb-2">
              {sampleData.title}
            </h1>
            <p className="text-sm text-muted-foreground">
              Ultima atualização: {sampleData.lastUpdated}
            </p>
          </div>

          {/* Table of contents */}
          <nav
            className="glass-panel rounded-xl p-5 sm:p-6"
            aria-label="Sumário"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
          >
            <h2 className="text-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Sumário
            </h2>
            <ol className="space-y-1.5">
              {tocEntries.map((entry) => (
                <li key={entry.number}>
                  <span className="text-sm text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <span className="text-primary/60 mr-2 font-medium tabular-nums">
                      {String(entry.number).padStart(2, '0')}
                    </span>
                    {entry.title}
                  </span>
                </li>
              ))}
            </ol>
          </nav>

          {/* Content sections */}
          {visibleSections.map((section, i) => (
            <SectionCard key={section.number} section={section} index={i} />
          ))}

          {/* Remaining sections indicator */}
          <div
            className="text-center py-4"
            style={{ animation: 'fade-in-up 0.6s ease-out 1.1s both' }}
          >
            <p className="text-xs text-muted-foreground/60">
              + {sampleData.sections.length - VISIBLE_SECTIONS.length} seções
              adicionais no documento completo
            </p>
          </div>

          {/* Footer */}
          <footer
            className="border-t border-border pt-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ animation: 'fade-in-up 0.6s ease-out 1.2s both' }}
          >
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="hover:text-primary transition-colors cursor-pointer">
                Privacidade
              </span>
              <span className="text-border">|</span>
              <span className="hover:text-primary transition-colors cursor-pointer">
                Termos
              </span>
            </div>
            <p className="text-xs text-muted-foreground/60">
              &copy; {new Date().getFullYear()} {BRAND}. Todos os direitos
              reservados.
            </p>
          </footer>
        </main>
      </div>
    </div>
  )
}
