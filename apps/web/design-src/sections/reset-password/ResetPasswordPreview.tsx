import '../../preview-theme.css'
import React from 'react'

/* ── Brand panel ── */
function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-background">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(var(--color-primary-rgb)/0.08),_transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgb(var(--color-primary-rgb)/0.05),_transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(var(--color-primary-rgb)/0.03),_transparent_40%)]" />
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage:
            'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)',
          backgroundSize: '24px 24px',
        }}
      />
      <div className="glow-orb w-64 h-64 bg-primary/15 top-[10%] left-[-10%]" />
      <div className="glow-orb glow-orb-slow glow-orb-reverse w-48 h-48 bg-[rgb(var(--accent-violet-rgb)/0.10)] bottom-[20%] right-[5%]" />
      <svg
        className="absolute bottom-8 right-8 w-64 h-64 opacity-[0.06] pointer-events-none"
        viewBox="0 0 64 64"
        fill="none"
      >
        <path
          d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z"
          fill="rgb(var(--color-primary-rgb))"
          opacity="0.7"
        />
      </svg>
      <div className="relative flex flex-col h-full px-12 xl:px-16 py-12 xl:py-16">
        <div className="flex flex-col justify-center flex-1">
          <span className="font-display tracking-[0.2em] text-gradient-brand text-2xl font-semibold mb-6">
            ToSmile.ai
          </span>
          <h2 className="text-3xl xl:text-4xl font-display font-semibold tracking-tight mb-3 neon-text">
            Odontologia estética inteligente
          </h2>
          <p className="text-muted-foreground text-lg mb-10">
            Protocolos de estratificação e simulações de sorriso com IA generativa.
          </p>
          <ul className="space-y-4">
            {[
              { icon: '✦', label: 'Análise visual inteligente com IA' },
              { icon: '🛡', label: 'Dados protegidos e criptografados' },
              { icon: '⚡', label: 'Resultados em menos de 2 minutos' },
              { icon: '🎨', label: 'Protocolos com suas resinas favoritas' },
            ].map((f) => (
              <li key={f.label} className="flex items-center gap-3 text-sm text-muted-foreground">
                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0">
                  {f.icon}
                </span>
                {f.label}
              </li>
            ))}
          </ul>
        </div>
        <p className="text-xs text-muted-foreground mt-auto pb-2">
          Mais de 500 dentistas já usam ToSmile.ai
        </p>
      </div>
    </div>
  )
}

/* ── Password requirement indicator ── */
function PasswordReq({ label, met }: { label: string; met: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-xs ${met ? 'text-green-500' : 'text-muted-foreground'}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${met ? 'bg-green-500' : 'bg-muted-foreground/40'}`} />
      {label}
    </li>
  )
}

/* ── Reset Password Preview ── */
export default function ResetPasswordPreview() {
  return (
    <div className="section-glow-bg min-h-screen bg-background flex">
      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8">
        <div className="w-full max-w-sm">
          <div className="text-center mb-6 sm:mb-8">
            <span className="font-display tracking-[0.2em] text-gradient-brand text-lg sm:text-xl font-semibold lg:hidden">
              ToSmile.ai
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 lg:mt-0 mb-2 neon-text">
              Redefinir senha
            </h1>
            <p className="text-sm text-muted-foreground">
              Digite sua nova senha
            </p>
          </div>

          {/* Form */}
          <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Nova senha</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Mostrar senha"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
              {/* Password requirements */}
              <ul className="mt-2 space-y-1">
                <PasswordReq label="Mínimo 8 caracteres" met={true} />
                <PasswordReq label="Letra maiúscula" met={true} />
                <PasswordReq label="Letra minúscula" met={true} />
                <PasswordReq label="Número" met={true} />
              </ul>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium leading-none">Confirmar nova senha</label>
              <div className="relative">
                <input
                  type="password"
                  placeholder="••••••••••••"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  aria-label="Mostrar senha"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow btn-glow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              Atualizar senha
            </button>
          </form>

          {/* Success state preview (below form for visual reference) */}
          <div className="mt-12 pt-8 border-t border-dashed border-border">
            <p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">
              Estado: senha atualizada
            </p>
            <div className="flex flex-col items-center gap-4">
              <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10">
                <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path d="M22 11.08V12a10 10 0 11-5.93-9.14" />
                  <path d="M22 4L12 14.01l-3-3" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold font-display neon-text">Senha atualizada!</h2>
              <p className="text-sm text-muted-foreground text-center">
                Redirecionando para o dashboard...
              </p>
            </div>
          </div>

          {/* Invalid link state preview */}
          <div className="mt-12 pt-8 border-t border-dashed border-border">
            <p className="text-xs text-muted-foreground text-center mb-4 uppercase tracking-wider">
              Estado: link inválido
            </p>
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold font-display neon-text">Link inválido</h2>
              <p className="text-sm text-muted-foreground">
                Este link expirou ou já foi utilizado. Solicite um novo link de recuperação.
              </p>
              <button className="w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow btn-glow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                Solicitar novo link
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
