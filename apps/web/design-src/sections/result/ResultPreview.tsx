import React from 'react';

/* -----------------------------------------------------------------------
   ResultPreview -- Visual mockup of the single-tooth Result detail page.
   NOT real app code. Uses Tailwind classes only. Hardcoded sample data.
   ----------------------------------------------------------------------- */

const layers = [
  { order: 1, name: 'Camada Opaca', shade: 'OA2', brand: 'Z350 XT', thickness: '0.3mm', color: 'bg-amber-500' },
  { order: 2, name: 'Dentina / Corpo', shade: 'A2D', brand: 'Z350 XT', thickness: '1.0mm', color: 'bg-yellow-600' },
  { order: 3, name: 'Efeitos Incisais', shade: 'CT', brand: 'Z350 XT', thickness: '0.3mm', color: 'bg-purple-500', optional: true },
  { order: 4, name: 'Esmalte Palatino', shade: 'A2E', brand: 'Z350 XT', thickness: '0.5mm', color: 'bg-sky-400' },
  { order: 5, name: 'Esmalte Vestibular', shade: 'WE', brand: 'Z350 XT', thickness: '0.5mm', color: 'bg-cyan-300' },
];

const tabs = ['Protocolo', 'Acabamento', 'Checklist', 'DSD'];

const checklist = [
  'Isolamento absoluto instalado',
  'Condicionamento acido 37% por 15s em esmalte',
  'Aplicacao do adesivo em 2 camadas ativas',
  'Fotopolimerizacao adequada de cada incremento',
  'Verificacao oclusal com papel articular',
  'Acabamento com discos de granulacao decrescente',
  'Polimento final com pasta diamantada',
];

function Badge({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium ${className}`}>
      {children}
    </span>
  );
}

function GlassCard({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-border bg-card backdrop-blur-md shadow-sm ${className}`}>
      {children}
    </div>
  );
}

export default function ResultPreview() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* AI grid pattern overlay */}
      <div className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hover:text-foreground/70 cursor-pointer transition-colors">Dashboard</span>
          <span>/</span>
          <span className="hover:text-foreground/70 cursor-pointer transition-colors">Avaliacao</span>
          <span>/</span>
          <span className="text-foreground">Dente 21</span>
        </nav>

        {/* Treatment Type Header Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M19.8 14.5l-2.039 2.039a2.25 2.25 0 01-1.591.659H7.83a2.25 2.25 0 01-1.591-.659L4.2 14.5m15.6 0l.4.4m-16 0l-.4.4" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Resina Composta</h2>
              <p className="text-sm text-muted-foreground">Dente 21 -- anterior superior</p>
              <p className="text-xs text-muted-foreground mt-0.5">05 Mar 2026, 10:30</p>
            </div>
            <Badge className="border-primary/30 text-primary bg-primary/10">Direta</Badge>
          </div>
        </div>

        {/* Main Resin Recommendation */}
        <GlassCard className="p-0 shadow-lg shadow-primary/5">
          <div className="p-5">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <svg className="w-5 h-5 text-primary" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" /></svg>
                  Filtek Z350 XT
                </h3>
                <p className="text-muted-foreground mt-1">3M ESPE</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge className="border-border text-muted-foreground bg-muted/50">Nanoparticulada</Badge>
                <Badge className="border-primary/20 text-primary bg-primary/10 animate-pulse">
                  No seu estoque
                </Badge>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
              {[
                { label: 'Opacidade', value: 'Translucida' },
                { label: 'Resistencia', value: 'Alta' },
                { label: 'Polimento', value: 'Excelente' },
                { label: 'Estetica', value: 'Superior' },
              ].map((stat) => (
                <div key={stat.label} className="bg-muted/50 rounded-xl p-3">
                  <span className="text-muted-foreground text-xs">{stat.label}</span>
                  <p className="font-medium text-foreground">{stat.value}</p>
                </div>
              ))}
            </div>

            {/* Justification */}
            <div className="mt-4 pt-4 border-t border-border">
              <h4 className="font-medium mb-2 text-sm">Justificativa</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                Z350 XT foi selecionada por sua excelente capacidade de mimetismo estetico em restauracoes
                anteriores de Classe IV. Sua nanotecnologia proporciona polimento superior e longevidade cromatica.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Tab Navigation */}
        <div className="rounded-xl border border-border bg-muted/50 backdrop-blur-md px-3 py-2 inline-flex gap-1">
          {tabs.map((tab, i) => (
            <button
              key={tab}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                i === 0
                  ? 'bg-primary text-primary-foreground'
                  : 'text-muted-foreground hover:text-foreground/70'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Protocol Table */}
        <GlassCard className="overflow-hidden">
          {/* Table header */}
          <div className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
            <span>Camada</span>
            <span>Resina</span>
            <span>Cor</span>
            <span>Espessura</span>
          </div>

          {/* Table rows */}
          {layers.map((layer) => (
            <div
              key={layer.order}
              className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-border/50 items-center"
              style={{ borderLeftWidth: '4px', borderLeftColor: 'currentColor' }}
            >
              <span className="font-medium text-sm text-foreground">
                {layer.order}. {layer.name}
                {layer.optional && (
                  <span className="ml-1 text-xs font-normal text-muted-foreground/70">(opcional)</span>
                )}
              </span>
              <span className="text-sm text-muted-foreground">{layer.brand}</span>
              <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-muted text-sm font-medium text-foreground w-fit">
                {layer.shade}
              </span>
              <span className="text-sm text-muted-foreground">{layer.thickness}</span>
            </div>
          ))}
        </GlassCard>

        {/* Alternatives */}
        <div>
          <h3 className="font-semibold mb-3">Outras Alternativas</h3>
          <div className="space-y-3">
            {[
              { name: 'Harmonize', brand: 'Kerr', reason: 'Tecnologia ARC que se adapta a cor dos dentes adjacentes.' },
              { name: 'Empress Direct', brand: 'Ivoclar Vivadent', reason: 'Excelente mimetismo optico com sistema de camadas simplificado.' },
            ].map((alt) => (
              <GlassCard key={alt.name} className="p-4 hover:shadow-md transition-shadow duration-200">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-foreground">{alt.name}</span>
                  <span className="text-sm text-muted-foreground">{alt.brand}</span>
                </div>
                <p className="text-sm text-muted-foreground">{alt.reason}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Disclaimer */}
        <div className="rounded-xl border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-warning shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <p className="text-sm text-warning/70">
              Este protocolo e uma sugestao baseada em IA e nao substitui o julgamento clinico profissional.
              Sempre avalie o caso individualmente.
            </p>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            Recalcular
          </button>
          <button className="px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            Baixar PDF
          </button>
          <button className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors">
            Novo Caso
          </button>
        </div>
      </div>
    </div>
  );
}
