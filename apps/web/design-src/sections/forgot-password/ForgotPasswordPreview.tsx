import '../../preview-theme.css'
import { Sparkles, Shield, Zap, Palette, ArrowLeft, Mail, Send } from 'lucide-react'

const BRAND_NAME = 'ToSmile.ai'

const FEATURES = [
  { Icon: Sparkles, label: 'Analise visual inteligente com IA' },
  { Icon: Shield, label: 'Dados protegidos e criptografados' },
  { Icon: Zap, label: 'Resultados em menos de 2 minutos' },
  { Icon: Palette, label: 'Protocolos com suas resinas favoritas' },
] as const

export default function ForgotPasswordPreview() {
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
            <linearGradient id="tooth-wm-fp" x1="16" y1="10" x2="48" y2="54" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="rgb(var(--color-primary-rgb))" />
              <stop offset="100%" stopColor="rgb(var(--color-primary-rgb))" stopOpacity="0.7" />
            </linearGradient>
          </defs>
          <path
            d="M22 15C18 15 14 19 14 25C14 32 19 38 23 43C25 46.5 27 51 29 51C30.5 51 31.2 47.5 32 44C32.8 47.5 33.5 51 35 51C37 51 39 46.5 41 43C45 38 50 32 50 25C50 19 46 15 42 15C38.5 15 36 17 34 19.5L32 22L30 19.5C28 17 25.5 15 22 15Z"
            fill="url(#tooth-wm-fp)"
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
              Recuperar senha
            </h1>
            <p className="text-sm text-muted-foreground animate-[fade-in-up_0.6s_ease-out_0.3s_both]">
              Digite seu email para receber o link de recuperacao
            </p>
          </div>

          <div className="animate-[fade-in-up_0.6s_ease-out_0.4s_both]">
            {/* Form */}
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none">Email</label>
                <input
                  type="email"
                  placeholder="nome@exemplo.com"
                  className="flex h-10 w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
                />
              </div>

              <button
                type="submit"
                className="btn-press btn-glow w-full inline-flex items-center justify-center gap-2 rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <Send className="w-4 h-4" />
                Enviar link de recuperacao
              </button>
            </form>

            {/* ── Success state preview ── */}
            <div className="mt-12 pt-8 border-t border-dashed border-border">
              <p className="text-[10px] text-muted-foreground text-center mb-6 uppercase tracking-widest font-medium">
                Estado: email enviado
              </p>
              <div className="glass-panel rounded-2xl p-6 space-y-5">
                <div className="flex items-center justify-center">
                  <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 glow-icon">
                    <Mail className="w-8 h-8 text-primary" />
                  </div>
                </div>
                <div className="text-center space-y-2">
                  <h2 className="text-lg font-semibold font-display neon-text">Email enviado!</h2>
                  <p className="text-sm text-muted-foreground">
                    Enviamos um link para <strong className="text-foreground">dr.joao@clinica.com</strong>. Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                  </p>
                </div>
                <button className="btn-press w-full inline-flex items-center justify-center rounded-md border border-border bg-background px-4 py-2.5 text-sm font-medium hover:bg-muted/50 transition-colors">
                  Reenviar email
                </button>
              </div>
            </div>

            {/* Back to login */}
            <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-8 cursor-pointer hover:text-foreground transition-colors group">
              <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" />
              Voltar para login
            </div>
          </div>
        </div>
      </div>
    </main>
  )
}
