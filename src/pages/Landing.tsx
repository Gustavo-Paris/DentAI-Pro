import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Sparkles, Target, Clock, BookOpen, Star, Quote } from 'lucide-react';

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <span className="text-lg sm:text-xl font-semibold tracking-tight">ResinMatch AI</span>
          <div className="flex items-center gap-2 sm:gap-4">
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
      <section className="py-16 sm:py-24 md:py-32">
        <div className="container mx-auto px-4 sm:px-6 text-center max-w-3xl">
          <Badge variant="secondary" className="mb-4">
            <Sparkles className="w-3 h-3 mr-1" />
            Potencializado por IA
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight mb-4 sm:mb-6">
            A resina ideal para cada caso clínico
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground mb-8 sm:mb-10 max-w-xl mx-auto">
            Inteligência artificial que analisa seu caso e recomenda a melhor resina composta com justificativa técnica detalhada.
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
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-2xl sm:text-3xl font-semibold">500+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Avaliações realizadas</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold">250+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Cores de resinas</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-semibold">15+</p>
              <p className="text-xs sm:text-sm text-muted-foreground">Marcas disponíveis</p>
            </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              {
                icon: Clock,
                title: 'Rápido',
                description: 'Recomendação em segundos, não horas de pesquisa.',
              },
              {
                icon: Sparkles,
                title: 'IA Avançada',
                description: 'Análise inteligente baseada em evidências científicas.',
              },
              {
                icon: Target,
                title: 'Preciso',
                description: 'Considera todas as variáveis do caso clínico.',
              },
              {
                icon: BookOpen,
                title: 'Educativo',
                description: 'Justificativas detalhadas para cada recomendação.',
              },
            ].map((benefit, index) => (
              <div key={index} className="text-center">
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-secondary flex items-center justify-center mx-auto mb-3 sm:mb-4">
                  <benefit.icon className="w-4 h-4 sm:w-5 sm:h-5 text-foreground" />
                </div>
                <h3 className="font-medium text-sm sm:text-base mb-1 sm:mb-2">{benefit.title}</h3>
                <p className="text-xs sm:text-sm text-muted-foreground">{benefit.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-12 sm:py-20 border-t border-border bg-secondary/30">
        <div className="container mx-auto px-4 sm:px-6 max-w-4xl">
          <h2 className="text-xl sm:text-2xl font-semibold text-center mb-8 sm:mb-12">
            O que dizem os dentistas
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              {
                quote: "Economizo horas de pesquisa em cada caso. A IA realmente entende as nuances da seleção de resinas e me dá confiança nas minhas escolhas.",
                author: "Dr. Carlos Mendonça",
                role: "Dentista Estético • São Paulo, SP",
                rating: 5
              },
              {
                quote: "O protocolo de estratificação que a ferramenta gera é excelente. Meus resultados estéticos melhoraram significativamente desde que comecei a usar.",
                author: "Dra. Ana Paula Ribeiro",
                role: "Clínica Geral • Rio de Janeiro, RJ",
                rating: 5
              },
              {
                quote: "Ferramenta essencial para quem trabalha com estética dental. A análise de cor e a sugestão de camadas é impressionantemente precisa.",
                author: "Dr. Fernando Costa",
                role: "Especialista em Dentística • Belo Horizonte, MG",
                rating: 5
              },
              {
                quote: "Uso diariamente no meu consultório. A integração com meu inventário pessoal torna as recomendações ainda mais práticas e aplicáveis.",
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
                <Quote className="w-6 h-6 text-muted-foreground/30 mb-2" />
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-16">
            Como funciona
          </h2>
          <div className="space-y-8 sm:space-y-12">
            {[
              {
                step: '01',
                title: 'Preencha o formulário',
                description: 'Informe os dados do paciente, características do caso e requisitos estéticos.',
              },
              {
                step: '02',
                title: 'IA analisa seu caso',
                description: 'Nossa inteligência artificial processa as informações e consulta o banco de resinas.',
              },
              {
                step: '03',
                title: 'Receba a recomendação',
                description: 'Obtenha a resina ideal com justificativa técnica e alternativas.',
              },
            ].map((item, index) => (
              <div key={index} className="flex gap-4 sm:gap-6">
                <span className="text-2xl sm:text-4xl font-light text-muted-foreground/50">{item.step}</span>
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
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold text-center mb-8 sm:mb-12">
            Perguntas frequentes
          </h2>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="item-1">
              <AccordionTrigger>Como a IA faz a recomendação?</AccordionTrigger>
              <AccordionContent>
                Nossa IA analisa os dados do seu caso clínico (tipo de cavidade, região, requisitos estéticos, etc.) e cruza com um banco de dados de resinas compostas, considerando as indicações de cada material para fornecer a melhor recomendação.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-2">
              <AccordionTrigger>Quais resinas estão no banco de dados?</AccordionTrigger>
              <AccordionContent>
                Temos as principais marcas do mercado como 3M ESPE, Ivoclar Vivadent, Kulzer, FGM, Dentsply, SDI, Tokuyama e Shofu. O banco é constantemente atualizado com mais de 250 cores disponíveis.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-3">
              <AccordionTrigger>Posso exportar as recomendações?</AccordionTrigger>
              <AccordionContent>
                Sim, todas as recomendações podem ser exportadas em PDF com os dados do caso, a resina recomendada, justificativa técnica, protocolo de aplicação e alternativas.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-4">
              <AccordionTrigger>É gratuito?</AccordionTrigger>
              <AccordionContent>
                Sim, você pode criar uma conta e fazer avaliações gratuitamente. O histórico de avaliações fica salvo na sua conta.
              </AccordionContent>
            </AccordionItem>
            <AccordionItem value="item-5">
              <AccordionTrigger>A ferramenta substitui meu julgamento clínico?</AccordionTrigger>
              <AccordionContent>
                Não. O ResinMatch AI é uma ferramenta de apoio à decisão clínica. As recomendações são sugestões baseadas em evidências e devem ser validadas pelo profissional de acordo com cada caso específico.
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </section>

      {/* CTA */}
      <section className="py-12 sm:py-20 border-t border-border">
        <div className="container mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-3 sm:mb-4">
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
                © {new Date().getFullYear()} ResinMatch AI. Ferramenta de apoio à decisão clínica.
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
