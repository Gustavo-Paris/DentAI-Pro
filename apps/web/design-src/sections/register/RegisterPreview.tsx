import '../../preview-theme.css'
import { Sparkles, Shield, Zap, Palette, Eye, Check } from 'lucide-react'

const BRAND_NAME = 'ToSmile.ai'

const FEATURES = [
  { Icon: Sparkles, label: 'Analise visual inteligente com IA' },
  { Icon: Shield, label: 'Dados protegidos e criptografados' },
  { Icon: Zap, label: 'Resultados em menos de 2 minutos' },
  { Icon: Palette, label: 'Protocolos com suas resinas favoritas' },
] as const

function PasswordReq({ label, met }: { label: string; met: boolean }) {
  return (
    <li className={`flex items-center gap-2 text-xs transition-colors ${met ? 'text-[rgb(var(--color-success-rgb))]' : 'text-muted-foreground'}`}>
      <span className={`flex items-center justify-center w-3.5 h-3.5 rounded-full transition-colors ${met ? 'bg-[rgb(var(--color-success-rgb))]' : 'bg-muted-foreground/20'}`}>
        {met && <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />}
      </span>
      {label}
    </li>
  )
}

export default function RegisterPreview() {
  return (
    <main className="section-glow-bg min-h-screen bg-background flex">
      {/* ─── Brand panel — desktop only ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden grain-overlay bg-background" aria-hidden="true">
        {/* Radial gradient layers */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgb(var(--color-primary-rgb)/0.08),_transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,_rgb(var(--color-primary-rgb)/0.05),_transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgb(var(--color-primary-rgb)/0.03),_transparent_40%)]" />

        {/* Dot grid */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: 'radial-gradient(circle, var(--color-foreground) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        />

        {/* AI grid pattern with mask fade */}
        <div
          className="absolute inset-0 ai-grid-pattern opacity-30 dark:opacity-50"
          style={{
            maskImage: 'radial-gradient(ellipse 60% 50% at 40% 50%, black 20%, transparent 70%)',
            WebkitMaskImage: 'radial-gradient(ellipse 60% 50% at 40% 50%, black 20%, transparent 70%)',
          }}
        />

        {/* Floating glow orbs */}
        <div className="glow-orb w-64 h-64 bg-primary/15 dark:bg-primary/25 top-[10%] left-[-10%]" />
        <div className="glow-orb glow-orb-slow glow-orb-reverse w-48 h-48 bg-[rgb(var(--accent-violet-rgb)/0.10)] dark:bg-[rgb(var(--accent-violet-rgb)/0.12)] bottom-[20%] right-[5%]" />

        {/* Decorative tooth watermark */}
        <svg
          className="absolute bottom-8 right-8 w-64 h-64 xl:w-72 xl:h-72 opacity-[0.06] pointer-events-none"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 64 64"
          fill="none"
        >
          <defs>
            <linearGradient id="tooth-wm-reg" x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgb(var(--color-primary-rgb))" />
              <stop offset="100%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z"
            fill="url(#tooth-wm-reg)"
          />
          <path
            d="M20 26C24 30 28 31.5 32 31.5C36 31.5 40 30 44 26"
            stroke="rgb(var(--color-primary-rgb))"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
            opacity="0.4"
          />
        </svg>

        <div className="relative flex flex-col h-full px-12 xl:px-16 py-12 xl:py-16">
          <div className="flex flex-col justify-center flex-1">
            <span className="font-display tracking-[0.2em] text-gradient-brand text-2xl font-semibold mb-6 animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
              {BRAND_NAME}
            </span>
            <h2 className="text-3xl xl:text-4xl font-display font-semibold tracking-tight mb-3 animate-[fade-in-up_0.6s_ease-out_0.3s_both] neon-text">
              Odontologia estetica inteligente
            </h2>
            <p className="text-muted-foreground text-lg mb-10 animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
              Protocolos de estratificacao e simulacoes de sorriso com IA generativa.
            </p>

            <ul className="space-y-4 animate-[fade-in-up_0.6s_ease-out_0.5s_both]">
              {FEATURES.map(({ Icon, label }) => (
                <li key={label} className="flex items-center gap-3 text-sm text-muted-foreground">
                  <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary shrink-0 glow-icon">
                    <Icon className="w-4 h-4" />
                  </span>
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <p className="text-xs text-muted-foreground mt-auto pb-2 animate-[fade-in-up_0.6s_ease-out_0.7s_both]">
            Mais de 500 dentistas ja usam {BRAND_NAME}
          </p>
        </div>
      </div>

      {/* ─── Form panel ─── */}
      <div className="flex-1 flex items-center justify-center px-4 sm:px-6 py-8 dark:bg-gradient-to-b dark:from-card/50 dark:to-background">
        <div className="w-full max-w-sm">
          {/* Header */}
          <div className="text-center mb-6 sm:mb-8">
            <span className="font-display tracking-[0.2em] text-gradient-brand text-lg sm:text-xl font-semibold lg:hidden animate-[fade-in-up_0.6s_ease-out_0.2s_both]">
              {BRAND_NAME}
            </span>
            <h1 className="text-xl sm:text-2xl font-semibold font-display mt-6 sm:mt-8 lg:mt-0 mb-2 animate-[fade-in-up_0.6s_ease-out_0.3s_both] neon-text">
              Criar sua conta
            </h1>
            <p className="text-sm text-muted-foreground animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              Comece a usar em poucos minutos
            </p>
          </div>

          <div className="animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
            {/* Google OAuth button */}
            <button className="btn-press w-full mb-4 inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium shadow-sm hover:shadow-md hover:bg-muted/50 transition-all duration-200">
              <svg className="w-4 h-4 mr-2" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18A10.96 10.96 0 001 12c0 1.77.42 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Continuar com Google
            </button>

            {/* Divider */}
            <div className="relative mb-4">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 text-muted-foreground">ou</span>
              </div>
            </div>

            {/* Form */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Nome completo</label>
                <input
                  placeholder="Dr. Joao Silva"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">CRO (opcional)</label>
                <input
                  placeholder="CRO-SP 12345"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email profissional</label>
                <input
                  type="email"
                  placeholder="nome@exemplo.com"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Senha</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Mostrar senha"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>

                {/* Password strength indicator */}
                <div className="flex gap-1 mt-2">
                  <div className="h-1 flex-1 rounded-full bg-[rgb(var(--color-success-rgb))]" />
                  <div className="h-1 flex-1 rounded-full bg-[rgb(var(--color-success-rgb))]" />
                  <div className="h-1 flex-1 rounded-full bg-[rgb(var(--color-warning-rgb))]" />
                  <div className="h-1 flex-1 rounded-full bg-muted" />
                </div>

                {/* Password requirements */}
                <ul className="mt-2 space-y-1">
                  <PasswordReq label="Minimo 8 caracteres" met={true} />
                  <PasswordReq label="Letra maiuscula" met={true} />
                  <PasswordReq label="Letra minuscula" met={true} />
                  <PasswordReq label="Numero" met={false} />
                </ul>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Confirmar senha</label>
                <div className="relative">
                  <input
                    type="password"
                    placeholder="••••••••••••"
                    className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring pr-10 transition-colors"
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="Mostrar senha"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Terms checkbox */}
              <div className="flex items-start space-x-3">
                <div className="mt-0.5">
                  <div className="flex items-center justify-center h-4 w-4 rounded border border-primary bg-primary text-primary-foreground">
                    <Check className="w-3 h-3" strokeWidth={3} />
                  </div>
                </div>
                <span className="text-sm leading-relaxed text-muted-foreground">
                  Concordo com os{' '}
                  <span className="text-primary underline underline-offset-4 cursor-pointer hover:text-primary/80 transition-colors">
                    Termos de Uso
                  </span>{' '}
                  e{' '}
                  <span className="text-primary underline underline-offset-4 cursor-pointer hover:text-primary/80 transition-colors">
                    Politica de Privacidade
                  </span>
                </span>
              </div>

              {/* CAPTCHA placeholder */}
              <div className="flex justify-center">
                <div className="w-[300px] h-[65px] rounded-md border border-dashed border-border flex items-center justify-center text-xs text-muted-foreground bg-muted/30">
                  Cloudflare Turnstile
                </div>
              </div>

              <button
                type="submit"
                className="btn-press btn-glow w-full inline-flex items-center justify-center rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                Criar conta
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Ja tem uma conta?{' '}
              <span className="text-primary hover:text-primary/80 underline underline-offset-4 cursor-pointer transition-colors">
                Entrar
              </span>
            </p>
          </div>
        </div>
      </div>
    </main>
  )
}
