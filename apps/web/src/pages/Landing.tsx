import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sparkles, Camera, Smile, Layers, FileText, Star, Quote, Check, Zap, Users, RefreshCw } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { SubscriptionPlan } from '@/hooks/useSubscription';
import { formatPrice } from '@/hooks/useSubscription';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-lg sm:text-xl font-semibold tracking-widest font-display">{BRAND_NAME}</span>
          <div className="flex items-center gap-2 sm:gap-4">
            <ThemeToggle />
            <Link to="/login">
              <Button variant="ghost" size="sm">Entrar</Button>
            </Link>
            <Link to="/register">
              <Button size="sm">Começar</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="py-16 sm:py-24 md:py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(42_52%_48%/0.08),transparent)] dark:bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(42_55%_56%/0.12),transparent)]" />
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl relative">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Inteligência Clínica Estética
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-4 sm:mb-6 font-display">
            O padrão ouro da odontologia estética
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto">
            IA que analisa, planeja e gera protocolos personalizados com precisão.
          </p>
          <Link to="/register">
            <Button size="lg" className="px-6 sm:px-8">
              Começar Avaliação Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Stats */}
      <section className="py-8 sm:py-12 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold font-display text-primary">IA</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Análise automática</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold font-display text-primary">250+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Cores de resinas</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold font-display text-primary">15+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Marcas disponíveis</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold font-display text-primary">6</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Tipos de tratamento</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-12 font-display">
            Tudo que você precisa em um só lugar
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              {
                icon: Camera,
                title: 'Análise Visual com IA',
                description: 'Tire uma foto e a IA identifica dentes, classifica cavidades e detecta cor VITA.',
              },
              {
                icon: Smile,
                title: 'Simulação de Sorriso',
                description: 'Visualize o resultado antes de iniciar com simulação DSD e níveis de clareamento.',
              },
              {
                icon: Layers,
                title: 'Protocolo de Estratificação',
                description: 'Receba camada por camada qual resina usar do seu inventário pessoal.',
              },
              {
                icon: FileText,
                title: 'Relatório Profissional',
                description: 'Exporte PDF personalizado com logo do consultório e protocolo completo.',
              },
            ].map((feature, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <feature.icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />
                </div>
                <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-12 font-display">
            O que dizem os dentistas
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: "Economizo horas de pesquisa em cada caso. A IA realmente entende as nuances do planejamento clínico e me dá confiança nas minhas escolhas.",
                author: "Dr. Carlos Mendonça",
                role: "Dentista Estético • São Paulo, SP",
                rating: 5
              },
              {
                quote: "O protocolo de estratificação é excelente, mas o que mais me impressionou foi a simulação DSD. Meus pacientes adoram visualizar o resultado.",
                author: "Dra. Ana Paula Ribeiro",
                role: "Clínica Geral • Rio de Janeiro, RJ",
                rating: 5
              },
              {
                quote: "Ferramenta essencial para quem trabalha com estética dental. A análise de cor e a indicação automática de tratamento economizam muito tempo.",
                author: "Dr. Fernando Costa",
                role: "Especialista em Dentística • Belo Horizonte, MG",
                rating: 5
              },
              {
                quote: "Uso diariamente no meu consultório. A integração com meu inventário pessoal e a gestão de pacientes tornaram meu fluxo de trabalho muito mais eficiente.",
                author: "Dra. Juliana Santos",
                role: "Cirurgiã-Dentista • Curitiba, PR",
                rating: 5
              }
            ].map((testimonial, i) => (
              <Card key={i} className="p-6">
                <div className="flex gap-1 mb-3">
                  {Array.from({ length: testimonial.rating }).map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-primary text-primary" />
                  ))}
                </div>
                <Quote className="w-6 h-6 text-primary/30 mb-2" />
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">{testimonial.quote}</p>
                <div>
                  <p className="font-medium text-sm">{testimonial.author}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-3xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-16 font-display">
            Como funciona
          </h2>
          <div className="space-y-8 sm:space-y-12">
            {[
              {
                step: '01',
                title: 'Tire a foto intraoral',
                description: 'Faça upload da foto clínica e fotos adicionais (sorriso, face) para análise completa.',
              },
              {
                step: '02',
                title: 'IA analisa o caso completo',
                description: 'Detecta múltiplos dentes, classifica tratamentos (resina, porcelana, coroa...) e identifica cor VITA.',
              },
              {
                step: '03',
                title: 'Visualize o resultado',
                description: 'Simulação de clareamento (Natural, White, Hollywood) e análise de proporções ideais do sorriso.',
              },
              {
                step: '04',
                title: 'Receba o protocolo',
                description: 'Protocolo de estratificação ou cimentação personalizado com suas resinas disponíveis.',
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 sm:gap-6">
                <span className="text-2xl sm:text-4xl font-light text-primary/60 font-display">{item.step}</span>
                <div>
                  <h3 className="font-medium text-sm sm:text-base mb-1">{item.title}</h3>
                  <p className="text-sm sm:text-base text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 max-w-2xl">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-12 font-display">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Como a IA faz a recomendação?</AccordionTrigger>
              <AccordionContent>
                Nossa IA analisa a foto clínica detectando múltiplos dentes, classificando o tipo de tratamento indicado (resina, porcelana, coroa, implante, etc.), identificando a cor VITA e gerando um protocolo personalizado baseado no seu inventário de resinas.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>O que é a simulação DSD?</AccordionTrigger>
              <AccordionContent>
                O Digital Smile Design (DSD) analisa proporções faciais e dentais, permitindo simular diferentes níveis de clareamento (Natural, White, Hollywood) para que você e seu paciente visualizem o resultado antes de iniciar o tratamento.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Quais tipos de tratamento são suportados?</AccordionTrigger>
              <AccordionContent>
                A plataforma suporta 6 tipos de tratamento: Resina Composta (com protocolo de estratificação), Faceta de Porcelana (com protocolo de cimentação), Coroa, Implante, Endodontia e Encaminhamento para especialistas.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>Como funciona a gestão de pacientes?</AccordionTrigger>
              <AccordionContent>
                Você pode cadastrar pacientes com informações de contato e notas clínicas. Cada paciente tem um histórico de sessões e casos, com acompanhamento de progresso através de checklists interativos.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>Posso exportar as recomendações?</AccordionTrigger>
              <AccordionContent>
                Sim, todas as avaliações podem ser exportadas em PDF profissional com os dados do caso, fotos clínicas, análise DSD, protocolo completo e logo do seu consultório.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-6">
              <AccordionTrigger>Quanto custa?</AccordionTrigger>
              <AccordionContent>
                O {BRAND_NAME} oferece um plano gratuito com créditos limitados para você experimentar. Para uso contínuo, temos planos pagos com mais créditos para análises e simulações DSD. Veja os preços abaixo.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-7">
              <AccordionTrigger>A ferramenta substitui meu julgamento clínico?</AccordionTrigger>
              <AccordionContent>
                Não. O {BRAND_NAME} é uma ferramenta de apoio à decisão clínica. As recomendações são sugestões baseadas em evidências e devem ser validadas pelo profissional de acordo com cada caso específico.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* Pricing */}
      <LandingPricing />

      {/* CTA */}
      <section className="py-12 sm:py-20 border-t border-border relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,hsl(42_52%_48%/0.06),transparent)] dark:bg-[radial-gradient(ellipse_60%_50%_at_50%_120%,hsl(42_55%_56%/0.10),transparent)]" />
        <div className="container mx-auto px-4 sm:px-6 text-center relative">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4 font-display">
            Pronto para começar?
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mb-6 sm:mb-8">
            Crie sua conta e faça sua primeira avaliação em minutos.
          </p>
          <Link to="/register">
            <Button size="lg" className="px-6 sm:px-8">
              Criar Conta Gratuita
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 sm:py-8">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              <span className="text-xs sm:text-sm text-muted-foreground">
                © {new Date().getFullYear()} {BRAND_NAME}. Ferramenta de apoio à decisão clínica.
              </span>
            </div>
            <div className="flex items-center gap-4 text-xs sm:text-sm text-muted-foreground">
              <Link to="/terms" className="hover:text-foreground hover:underline underline-offset-4">
                Termos de Uso
              </Link>
              <Link to="/privacy" className="hover:text-foreground hover:underline underline-offset-4">
                Privacidade
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function LandingPricing() {
  const { data: plans, isLoading } = useQuery({
    queryKey: ['subscription-plans'],
    queryFn: async (): Promise<SubscriptionPlan[]> => {
      const { data, error } = await supabase
        .from('subscription_plans')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  return (
    <section id="pricing" className="py-12 sm:py-20 border-t border-border bg-secondary/30">
      <div className="container mx-auto px-4 sm:px-6">
        <div className="text-center mb-8 sm:mb-12">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold font-display">
            Planos e preços
          </h2>
          <p className="text-sm sm:text-base text-muted-foreground mt-2">
            Comece gratuitamente e faça upgrade quando precisar
          </p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[400px] rounded-xl" />
            ))}
          </div>
        ) : plans && plans.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {plans.map((plan) => {
              const isFree = plan.price_monthly === 0;
              const isPopular = plan.name === 'Pro';
              const features = Array.isArray(plan.features)
                ? plan.features
                : JSON.parse(plan.features as unknown as string);

              return (
                <Card
                  key={plan.id}
                  className={`relative flex flex-col ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {isPopular && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-primary">
                      Mais Popular
                    </Badge>
                  )}

                  <CardHeader className="text-center pb-2">
                    <CardTitle className="text-xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                  </CardHeader>

                  <CardContent className="flex-1">
                    <div className="text-center mb-4">
                      <div className="flex items-baseline justify-center gap-1">
                        <span className="text-4xl font-bold">
                          {isFree ? 'Grátis' : formatPrice(plan.price_monthly)}
                        </span>
                        {!isFree && <span className="text-muted-foreground">/mês</span>}
                      </div>
                    </div>

                    <div className="bg-primary/10 rounded-lg p-3 mb-4 text-center">
                      <div className="flex items-center justify-center gap-2 text-primary font-semibold">
                        <Zap className="h-4 w-4" />
                        <span>{plan.credits_per_month} créditos/mês</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        1 crédito = 1 análise | 2 créditos = 1 simulação DSD
                      </p>
                    </div>

                    <div className="flex justify-center gap-4 mb-4 text-sm">
                      {plan.max_users > 1 && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{plan.max_users} usuários</span>
                        </div>
                      )}
                      {plan.allows_rollover && (
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <RefreshCw className="h-4 w-4" />
                          <span>Rollover</span>
                        </div>
                      )}
                    </div>

                    <ul className="space-y-2">
                      {features.map((feature: string, index: number) => (
                        <li key={index} className="flex items-start gap-2">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>

                  <CardFooter>
                    <Button
                      className="w-full"
                      variant={isPopular ? 'default' : 'outline'}
                      asChild
                    >
                      <Link to="/register">
                        {isFree ? 'Começar Grátis' : 'Começar'}
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>
        ) : null}

        <p className="text-center text-sm text-muted-foreground mt-8">
          Todos os planos incluem 7 dias de garantia. Cancele a qualquer momento.
        </p>
      </div>
    </section>
  );
}
