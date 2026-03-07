import React from 'react';

/* -----------------------------------------------------------------------
   GroupResultPreview -- Visual mockup of the Group Result detail page.
   NOT real app code. Uses Tailwind classes only. Hardcoded sample data.
   ----------------------------------------------------------------------- */

const groupTeeth = ['11', '21', '12', '22'];

const layers = [
  { order: 1, name: 'Dentina / Corpo', shade: 'A2D', brand: 'Z350 XT', thickness: '0.8mm' },
  { order: 2, name: 'Efeitos Incisais', shade: 'CT', brand: 'Z350 XT', thickness: '0.3mm', optional: true },
  { order: 3, name: 'Esmalte Vestibular', shade: 'WE', brand: 'Z350 XT', thickness: '0.5mm' },
];

const checklist = [
  { text: 'Isolamento absoluto em todos os elementos', checked: true },
  { text: 'Condicionamento acido seletivo por 15s', checked: true },
  { text: 'Adesivo universal em 2 camadas ativas', checked: true },
  { text: 'Fotopolimerizacao individual por dente', checked: false },
  { text: 'Ajuste oclusal bilateral verificado', checked: false },
  { text: 'Acabamento com discos sequenciais', checked: false },
  { text: 'Polimento final com pasta diamantada', checked: false },
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

export default function GroupResultPreview() {
  const checkedCount = checklist.filter((c) => c.checked).length;
  const progressPct = Math.round((checkedCount / checklist.length) * 100);

  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* AI grid pattern overlay */}
      <div
        className="absolute inset-0 opacity-20 pointer-events-none"
        style={{
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
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
          <span className="text-foreground">Protocolo Unificado (4 dentes)</span>
        </nav>

        {/* Page Title + Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold tracking-tight">
            Resina Composta -- Protocolo Unificado
          </h1>
          <button className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
            <svg className="w-4 h-4 text-primary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
            </svg>
            Marcar Todos Concluidos
          </button>
        </div>

        {/* Treatment Type Header Card */}
        <div className="rounded-xl border border-primary/20 bg-primary/5 p-4 shadow-md">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-lg bg-primary/10">
              <svg className="w-8 h-8 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 14.5M14.25 3.104c.251.023.501.05.75.082M19.8 14.5l-2.039 2.039a2.25 2.25 0 01-1.591.659H7.83a2.25 2.25 0 01-1.591-.659L4.2 14.5m15.6 0l.4.4m-16 0l-.4.4" />
              </svg>
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-semibold">Protocolo Unificado</h2>
              <p className="text-sm text-muted-foreground">Resina Composta</p>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {groupTeeth.map((tooth) => (
                  <Badge key={tooth} className="text-muted-foreground border-border">
                    Dente {tooth}
                  </Badge>
                ))}
              </div>
            </div>
            <Badge className="border-border text-muted-foreground bg-muted/50">
              {groupTeeth.length} dentes
            </Badge>
          </div>
        </div>

        {/* Resin Recommendation */}
        <GlassCard className="p-5 shadow-lg shadow-primary/5">
          <div className="flex items-start justify-between mb-3">
            <div>
              <h3 className="text-xl font-semibold flex items-center gap-2">
                <svg className="w-5 h-5 text-foreground/70" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                </svg>
                Filtek Z350 XT
              </h3>
              <p className="text-muted-foreground mt-1">3M ESPE</p>
            </div>
            <Badge className="border-border text-muted-foreground bg-muted/50">Nanoparticulada</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Aplique protocolo identico para: <strong className="text-foreground">11, 21, 12, 22</strong>
          </p>
        </GlassCard>

        {/* Protocol Table */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Protocolo de Estratificacao
          </h3>
          <GlassCard className="overflow-hidden">
            <div className="grid grid-cols-4 gap-2 px-4 py-2.5 text-xs font-medium text-muted-foreground uppercase tracking-wider bg-muted/50">
              <span>Camada</span>
              <span>Resina</span>
              <span>Cor</span>
              <span>Espessura</span>
            </div>
            {layers.map((layer) => (
              <div
                key={layer.order}
                className="grid grid-cols-4 gap-2 px-4 py-3 border-t border-border/50 items-center"
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
        </div>

        {/* Checklist */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Checklist Clinico</h3>
            <span className="text-xs text-muted-foreground/70">
              {checkedCount}/{checklist.length} concluidos
            </span>
          </div>

          {/* Progress bar */}
          <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all duration-500"
              style={{ width: `${progressPct}%` }}
            />
          </div>

          <GlassCard className="divide-y divide-border/50">
            {checklist.map((item, i) => (
              <label
                key={i}
                className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                    item.checked
                      ? 'bg-primary border-primary'
                      : 'border-border'
                  }`}
                >
                  {item.checked && (
                    <svg className="w-3 h-3 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
                <span className={`text-sm ${item.checked ? 'text-muted-foreground line-through' : 'text-foreground'}`}>
                  {item.text}
                </span>
              </label>
            ))}
          </GlassCard>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Recalcular
          </button>
        </div>
      </div>
    </div>
  );
}
