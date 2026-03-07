import '../../preview-theme.css'
import sampleData from '../../../design/sections/privacy/data.json'

const BRAND = 'ToSmile.ai'

/* Show 5 representative sections: 1, 2, 5, 8, 14 */
const VISIBLE_SECTIONS = [1, 2, 5, 8, 14]

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

interface LabeledItem {
  label: string
  text: string
}

interface ContactItem {
  label: string
  email: string
}

interface PrivacySection {
  number: number
  title: string
  paragraphs?: string[]
  items?: string[]
  labeledItems?: LabeledItem[]
  contacts?: ContactItem[]
  closing?: string
}

function SectionCard({
  section,
  index,
}: {
  section: PrivacySection
  index: number
}) {
  const delay = 0.4 + index * 0.15
  return (
    <section
      className="glass-panel rounded-xl p-6 sm:p-8"
      style={{ animation: `fade-in-up 0.6s ease-out ${delay}s both` }}
    >
      <h2 className="text-heading text-xl font-semibold mb-4">
        <span className="text-primary mr-2">{section.number}.</span>
        {section.title}
      </h2>

      {section.paragraphs?.map((p, i) => (
        <p
          key={i}
          className="text-muted-foreground leading-relaxed mb-3 last:mb-0"
        >
          {p}
        </p>
      ))}

      {section.labeledItems && (
        <ul className="space-y-3 mt-3">
          {section.labeledItems.map((item, i) => (
            <li key={i} className="flex gap-2 text-muted-foreground leading-relaxed">
              <span className="shrink-0 mt-1.5 w-1.5 h-1.5 rounded-full bg-primary/40" />
              <span>
                <strong className="text-foreground/80">{item.label}</strong>{' '}
                {item.text}
              </span>
            </li>
          ))}
        </ul>
      )}

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
        <p className="text-muted-foreground leading-relaxed mt-4">
          {section.closing}
        </p>
      )}

      {section.contacts && (
        <ul className="space-y-2 mt-4">
          {section.contacts.map((contact, i) => (
            <li key={i} className="text-muted-foreground">
              <strong className="text-foreground/80">{contact.label}</strong>{' '}
              <EmailLink email={contact.email} />
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

export default function PrivacyPreview() {
  const visibleSections = sampleData.sections.filter((s) =>
    VISIBLE_SECTIONS.includes(s.number)
  ) as PrivacySection[]

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
            top: '45%',
            right: '8%',
            background:
              'radial-gradient(circle, rgb(var(--accent-violet-rgb) / 0.06) 0%, transparent 70%)',
            animationDelay: '5s',
          }}
        />
        <div
          className="glow-orb glow-orb-reverse"
          style={{
            width: 300,
            height: 300,
            bottom: '10%',
            left: '15%',
            background:
              'radial-gradient(circle, rgb(var(--color-accent-rgb) / 0.05) 0%, transparent 70%)',
            animationDelay: '9s',
          }}
        />
      </div>

      {/* AI grid overlay */}
      <div className="ai-grid-pattern absolute inset-0 pointer-events-none" />

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

          {/* LGPD compliance badge */}
          <div
            className="glass-panel rounded-lg px-4 py-3 inline-flex items-center gap-3 glow-badge"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.2s both' }}
          >
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/10">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="text-success"
                aria-hidden="true"
              >
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10" />
                <path d="m9 12 2 2 4-4" />
              </svg>
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                Em conformidade com a LGPD
              </p>
              <p className="text-xs text-muted-foreground">
                Lei n.o 13.709/2018 - Lei Geral de Proteção de Dados
              </p>
            </div>
          </div>

          {/* Table of contents */}
          <nav
            className="glass-panel rounded-xl p-5 sm:p-6"
            aria-label="Sumário"
            style={{ animation: 'fade-in-up 0.6s ease-out 0.3s both' }}
          >
            <h2 className="text-heading text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-4">
              Sumário
            </h2>
            <ol className="space-y-1.5 columns-1 sm:columns-2">
              {tocEntries.map((entry) => (
                <li key={entry.number} className="break-inside-avoid">
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
            style={{ animation: 'fade-in-up 0.6s ease-out 1.2s both' }}
          >
            <p className="text-xs text-muted-foreground/60">
              + {sampleData.sections.length - VISIBLE_SECTIONS.length} seções
              adicionais no documento completo
            </p>
          </div>

          {/* Footer */}
          <footer
            className="border-t border-border pt-6 pb-8 flex flex-col sm:flex-row items-center justify-between gap-4"
            style={{ animation: 'fade-in-up 0.6s ease-out 1.3s both' }}
          >
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
              <span className="hover:text-primary transition-colors cursor-pointer">
                Termos de Uso
              </span>
              <span className="text-border">|</span>
              <span className="hover:text-primary transition-colors cursor-pointer">
                Privacidade
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
