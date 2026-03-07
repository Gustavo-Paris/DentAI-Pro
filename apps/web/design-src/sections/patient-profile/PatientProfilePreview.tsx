import React from 'react';

/* -----------------------------------------------------------------------
   PatientProfilePreview -- Visual mockup of the Patient Profile detail page.
   NOT real app code. Uses Tailwind classes only. Hardcoded sample data.
   ----------------------------------------------------------------------- */

const sessions = [
  { id: 'sess-101', date: '03 Mar 2026, 14:30', teeth: ['11', '21', '12', '22'], done: 4, total: 4 },
  { id: 'sess-102', date: '15 Fev 2026, 09:00', teeth: ['14', '15', '24'], done: 3, total: 3 },
  { id: 'sess-103', date: '10 Jan 2026, 11:30', teeth: ['36', '46'], done: 1, total: 2 },
  { id: 'sess-104', date: '22 Nov 2025, 08:45', teeth: ['37', '47', '38'], done: 1, total: 3 },
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

export default function PatientProfilePreview() {
  return (
    <div className="relative min-h-screen bg-background text-foreground overflow-hidden font-sans">
      {/* Ambient glow orbs */}
      <div className="absolute w-64 h-64 rounded-full bg-primary/15 blur-3xl top-[-8%] left-[10%] animate-pulse" />
      <div className="absolute w-56 h-56 rounded-full bg-accent/10 blur-3xl top-[30%] right-[-6%] animate-pulse" />
      <div className="absolute w-48 h-48 rounded-full bg-primary/10 blur-3xl bottom-[8%] left-[55%] animate-pulse" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <span className="hover:text-foreground/70 cursor-pointer transition-colors">Dashboard</span>
          <span>/</span>
          <span className="hover:text-foreground/70 cursor-pointer transition-colors">Pacientes</span>
          <span>/</span>
          <span className="text-foreground">Maria Clara Oliveira</span>
        </nav>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm">
              MC
            </div>
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Maria Clara Oliveira</h1>
              <p className="text-sm text-muted-foreground">Perfil do Paciente</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="px-3 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors focus-visible:ring-2 focus-visible:ring-primary">
              Nova Avaliacao
            </button>
            <button className="px-3 py-1.5 rounded-lg border border-border text-sm text-foreground/70 hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring">
              Editar
            </button>
            <button className="px-3 py-1.5 rounded-lg text-sm text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus-visible:ring-2 focus-visible:ring-destructive">
              Excluir
            </button>
          </div>
        </div>

        {/* Contact Info Card */}
        <GlassCard className="p-4">
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Informacoes de Contato</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
              <span>(11) 98765-4321</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              <span>maria.clara@email.com</span>
            </div>
          </div>
          <div className="flex items-start gap-2 text-muted-foreground text-sm mt-3 pt-3 border-t border-border">
            <svg className="w-4 h-4 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
            <span>Paciente com historico de sensibilidade dentaria. Preferencia por tratamentos esteticos. Alergia a latex.</span>
          </div>
        </GlassCard>

        {/* Metrics KPIs */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">Metricas</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { value: '5', label: 'Avaliacoes' },
              { value: '12', label: 'Casos' },
              { value: '9', label: 'Concluidos', highlight: true },
              { value: '20/ago', label: 'Primeira Visita' },
            ].map((stat, i) => (
              <GlassCard key={stat.label} className="p-4 text-center">
                <p className={`text-2xl font-semibold ${stat.highlight ? 'text-primary' : 'text-foreground'}`}>
                  {stat.value}
                </p>
                <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Session History */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Historico de Sessoes</h3>
            <button className="px-3 py-1 rounded-lg bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors">
              + Nova Avaliacao
            </button>
          </div>

          <div className="space-y-3">
            {sessions.map((session) => {
              const isCompleted = session.done === session.total;
              const pct = Math.round((session.done / session.total) * 100);

              return (
                <GlassCard
                  key={session.id}
                  className="relative overflow-hidden p-4 hover:shadow-md transition-all duration-300 cursor-pointer group"
                >
                  {/* Left accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-[3px] bg-gradient-to-b ${
                      isCompleted ? 'from-primary to-primary/70' : 'from-primary to-primary/70'
                    }`}
                  />

                  <div className="flex items-center justify-between mb-2 pl-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-foreground">{session.date}</span>
                      <Badge
                        className={
                          isCompleted
                            ? 'border-primary/30 text-primary bg-primary/10'
                            : 'border-primary/30 text-primary bg-primary/10'
                        }
                      >
                        {isCompleted ? 'Concluido' : 'Em progresso'}
                      </Badge>
                    </div>
                    <svg
                      className="w-4 h-4 text-muted-foreground/50 group-hover:text-muted-foreground group-hover:translate-x-0.5 transition-all"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </div>

                  <div className="flex items-center gap-4 pl-2">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-1.5 mb-2">
                        {session.teeth.map((tooth) => (
                          <Badge key={tooth} className="text-muted-foreground border-border">
                            Dente {tooth}
                          </Badge>
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {session.total} {session.total === 1 ? 'caso' : 'casos'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 min-w-[100px]">
                      <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isCompleted ? 'bg-primary' : 'bg-primary'
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="text-xs text-muted-foreground tabular-nums whitespace-nowrap">
                        {session.done}/{session.total}
                      </span>
                    </div>
                  </div>
                </GlassCard>
              );
            })}
          </div>

          <div className="pt-4 text-center">
            <button className="px-4 py-1.5 rounded-lg border border-border text-sm text-muted-foreground hover:bg-muted/50 transition-colors">
              Carregar mais
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
