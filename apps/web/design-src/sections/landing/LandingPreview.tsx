import '../../preview-theme.css'
import { useState } from 'react'
import {
  Sparkles,
  Camera,
  Smile,
  Layers,
  FileText,
  Star,
  Check,
  ChevronDown,
  ArrowRight,
  Zap,
  Users,
  RefreshCw,
} from 'lucide-react'
import type {
  LandingStat,
  LandingFeature,
  LandingStep,
  LandingTestimonial,
  LandingFAQ,
  LandingPlan,
} from '../../../design/sections/landing/types'
import mockData from '../../../design/sections/landing/data.json'

const ICON_MAP: Record<string, React.ElementType> = {
  Camera,
  Smile,
  Layers,
  FileText,
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
}

export default function LandingPreview() {
  const stats = mockData.stats as LandingStat[]
  const features = mockData.features as LandingFeature[]
  const steps = mockData.steps as LandingStep[]
  const testimonials = mockData.testimonials as LandingTestimonial[]
  const faqs = mockData.faqs as LandingFAQ[]
  const plans = mockData.plans as LandingPlan[]
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="section-glow-bg relative min-h-screen">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="glow-orb glow-orb-1" />
        <div className="glow-orb glow-orb-2" />
        <div className="glow-orb glow-orb-3" />
      </div>
      <div className="relative">
        {/* 1. Navigation */}
        <nav className="sticky top-0 z-50 glass-panel border-b border-border/50 px-6 py-3">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
            <span className="text-lg font-bold text-primary">ToSmile.ai</span>
            <div className="flex items-center gap-3">
              <button className="text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded-lg px-3 py-1.5">
                Entrar
              </button>
              <button className="bg-primary text-primary-foreground rounded-lg px-4 py-2 text-sm font-medium btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring">
                Comecar
              </button>
            </div>
          </div>
        </nav>

        {/* 2. Hero Section */}
        <section className="px-6 py-16 sm:py-24">
          <div className="max-w-6xl mx-auto text-center space-y-6">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
              <Sparkles className="h-4 w-4" />
              Inteligencia Clinica Estetica
            </div>

            {/* Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-heading leading-tight">
              Odontologia estetica{' '}
              <span className="text-primary">inteligente</span>
              {' '}com IA
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              IA que analisa, planeja e gera protocolos personalizados com precisao.
            </p>

            {/* CTA */}
            <div className="space-y-3">
              <button className="bg-primary text-primary-foreground rounded-lg px-8 py-3 text-base font-medium btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center gap-2">
                <Sparkles className="h-5 w-5" />
                Testar Gratis em 2 Minutos
              </button>
              <p className="text-sm text-muted-foreground">
                Sem cartao de credito. 3 creditos gratis.
              </p>
            </div>
          </div>
        </section>

        {/* 3. Stats Section */}
        <section className="px-6 py-12 bg-secondary/30">
          <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-6">
            {stats.map((stat, i) => (
              <div key={i} className="text-center space-y-1">
                <p className="text-4xl sm:text-5xl font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* 4. Features Section */}
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-heading">Tudo que voce precisa em um so lugar</h2>
              <p className="text-muted-foreground">Ferramentas completas para odontologia estetica com IA</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feat, i) => {
                const Icon = ICON_MAP[feat.icon] || FileText
                return (
                  <div key={i} className="glass-panel rounded-xl p-6 hover:shadow-md hover:-translate-y-1 transition-all cursor-pointer space-y-4">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <h3 className="font-semibold text-foreground">{feat.title}</h3>
                    <p className="text-sm text-muted-foreground">{feat.description}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </section>

        {/* 5. How It Works Section */}
        <section className="px-6 py-16 bg-secondary/20">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-heading">Como funciona</h2>
              <p className="text-muted-foreground">4 passos simples para seu protocolo personalizado</p>
            </div>
            <div className="space-y-8">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold shrink-0">
                      {step.number}
                    </div>
                    {i < steps.length - 1 && <div className="w-px h-full bg-border mt-2" />}
                  </div>
                  <div className="pb-8">
                    <h3 className="font-semibold text-foreground">{step.title}</h3>
                    <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 6. Testimonials Section */}
        <section className="px-6 py-16">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-heading">O que dizem os dentistas</h2>
              <p className="text-muted-foreground">Profissionais que ja usam a plataforma</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {testimonials.map((t, i) => (
                <div key={i} className="glass-panel rounded-xl p-6 border-l-4 border-l-primary/40 space-y-3 hover:shadow-md transition-shadow">
                  {/* Stars */}
                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: 5 }, (_, si) => (
                      <Star key={si} className={`h-4 w-4 ${si < t.rating ? 'fill-primary text-primary' : 'text-muted-foreground/30'}`} />
                    ))}
                    {t.highlight && (
                      <span className="ml-2 inline-flex items-center gap-1 text-xs rounded-full bg-primary/10 text-primary px-2 py-0.5 font-medium">
                        <Zap className="h-3 w-3" />
                        {t.highlight}
                      </span>
                    )}
                  </div>
                  {/* Quote */}
                  <p className="text-sm text-foreground italic">&ldquo;{t.quote}&rdquo;</p>
                  {/* Author */}
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold">
                      {getInitials(t.name)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{t.role} &middot; {t.clinic}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 7. FAQ Section */}
        <section className="px-6 py-16 bg-secondary/20">
          <div className="max-w-3xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-heading">Perguntas frequentes</h2>
            </div>
            <div className="glass-panel rounded-xl overflow-hidden divide-y divide-border">
              {faqs.map((faq, i) => (
                <div key={i}>
                  <button
                    onClick={() => setOpenFaq(openFaq === i ? null : i)}
                    className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <span className="text-sm font-medium text-foreground">{faq.question}</span>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground shrink-0 transition-transform ${openFaq === i ? 'rotate-180' : ''}`} />
                  </button>
                  {openFaq === i && (
                    <div className="px-5 pb-4">
                      <p className="text-sm text-muted-foreground">{faq.answer}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* 8. Pricing Section */}
        <section className="px-6 py-16" id="pricing">
          <div className="max-w-6xl mx-auto space-y-10">
            <div className="text-center space-y-2">
              <h2 className="text-3xl font-bold text-heading">Planos e precos</h2>
              <p className="text-muted-foreground">Comece gratuitamente e faca upgrade quando precisar</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
              {plans.map((plan, i) => (
                <div key={i} className={`glass-panel rounded-xl p-6 space-y-4 ${plan.popular ? 'ai-shimmer-border scale-105 relative' : 'hover:shadow-md transition-shadow'}`}>
                  {plan.popular && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-xs rounded-full bg-primary text-primary-foreground px-3 py-1 font-medium whitespace-nowrap">
                      Mais Popular
                    </span>
                  )}
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">{plan.name}</h3>
                    <p className="text-2xl font-bold text-foreground mt-1">{plan.price}</p>
                  </div>
                  <span className="inline-block text-xs rounded-full bg-primary/10 text-primary px-2.5 py-1 font-medium">
                    {plan.credits} creditos
                  </span>
                  <ul className="space-y-2">
                    {plan.features.map((f, fi) => (
                      <li key={fi} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button className={`w-full rounded-lg px-4 py-2.5 text-sm font-medium transition-colors focus-visible:ring-2 focus-visible:ring-ring ${
                    plan.popular
                      ? 'bg-primary text-primary-foreground btn-press btn-glow'
                      : 'glass-panel hover:bg-muted text-foreground'
                  }`}>
                    {plan.price === 'Gratis' ? 'Comecar Gratis' : 'Comecar'}
                  </button>
                </div>
              ))}
            </div>
            <p className="text-center text-xs text-muted-foreground">
              1 credito = 1 analise | 2 creditos = 1 simulacao DSD
            </p>
          </div>
        </section>

        {/* 9. CTA Section */}
        <section className="px-6 py-16 bg-secondary/30">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl font-bold text-heading">Veja a IA em acao com seu proprio caso</h2>
            <p className="text-muted-foreground">
              Crie sua conta, tire uma foto e receba um protocolo completo em menos de 2 minutos.
            </p>
            <div className="flex flex-col items-center gap-3">
              {['Analise visual com IA', 'Protocolo personalizado', 'Resultado em minutos'].map((b, i) => (
                <span key={i} className="inline-flex items-center gap-2 text-sm text-foreground">
                  <Check className="h-4 w-4 text-primary" />
                  {b}
                </span>
              ))}
            </div>
            <button className="bg-primary text-primary-foreground rounded-lg px-8 py-3 text-base font-medium btn-press btn-glow transition-colors focus-visible:ring-2 focus-visible:ring-ring inline-flex items-center gap-2">
              <Sparkles className="h-5 w-5" />
              Criar Conta Gratuita
            </button>
          </div>
        </section>

        {/* 10. Footer */}
        <footer className="px-6 py-6 border-t border-border/50">
          <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">
              &copy; 2026 ToSmile.ai. Ferramenta de apoio a decisao clinica.
            </p>
            <div className="flex items-center gap-4">
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded px-1">
                Termos de Uso
              </button>
              <button className="text-xs text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-ring rounded px-1">
                Privacidade
              </button>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
