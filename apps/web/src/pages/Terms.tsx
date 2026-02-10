import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { BRAND_NAME } from '@/lib/branding';

export default function Terms() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between">
          <Link to="/" className="text-lg sm:text-xl font-semibold tracking-[0.2em] font-display text-primary">
            {BRAND_NAME}
          </Link>
          <Link to="/">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar
            </Button>
          </Link>
        </div>
      </header>

      <main className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-3xl">
        <h1 className="text-2xl sm:text-3xl font-semibold font-display mb-6 sm:mb-8">Termos de Uso</h1>
        
        <div className="prose prose-sm sm:prose-base prose-neutral dark:prose-invert max-w-none space-y-6">
          <p className="text-muted-foreground">
            Última atualização: {new Date().toLocaleDateString('pt-BR')}
          </p>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">1. Aceitação dos Termos</h2>
            <p className="text-muted-foreground">
              Ao acessar e usar o {BRAND_NAME}, você concorda com estes Termos de Uso. 
              Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">2. Descrição do Serviço</h2>
            <p className="text-muted-foreground">
              O {BRAND_NAME} é uma ferramenta de apoio à decisão clínica que utiliza inteligência artificial 
              para sugerir resinas compostas adequadas para casos odontológicos. O serviço fornece recomendações 
              baseadas em dados inseridos pelo usuário e um banco de dados de materiais restauradores.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">3. Limitação de Responsabilidade</h2>
            <p className="text-muted-foreground">
              <strong>IMPORTANTE:</strong> O {BRAND_NAME} é uma ferramenta de apoio e NÃO substitui o julgamento 
              clínico profissional. As recomendações fornecidas são sugestões baseadas em algoritmos e não devem 
              ser consideradas como diagnóstico ou prescrição médica/odontológica.
            </p>
            <p className="text-muted-foreground mt-2">
              O profissional de saúde é o único responsável pelas decisões clínicas tomadas em relação ao 
              tratamento de seus pacientes. Não nos responsabilizamos por quaisquer danos ou prejuízos 
              resultantes do uso das recomendações fornecidas pela plataforma.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">4. Uso Adequado</h2>
            <p className="text-muted-foreground">Você concorda em:</p>
            <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
              <li>Fornecer informações precisas e verdadeiras ao usar o serviço</li>
              <li>Não compartilhar suas credenciais de acesso com terceiros</li>
              <li>Não utilizar o serviço para fins ilegais ou não autorizados</li>
              <li>Não tentar acessar áreas restritas do sistema</li>
              <li>Respeitar a privacidade e dados de pacientes</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">5. Propriedade Intelectual</h2>
            <p className="text-muted-foreground">
              Todo o conteúdo do {BRAND_NAME}, incluindo mas não limitado a textos, gráficos, logos, ícones, 
              imagens, algoritmos e software, é propriedade exclusiva do {BRAND_NAME} ou de seus licenciadores 
              e é protegido por leis de propriedade intelectual.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">6. Conta do Usuário</h2>
            <p className="text-muted-foreground">
              Você é responsável por manter a confidencialidade de sua conta e senha. Qualquer atividade 
              realizada em sua conta é de sua responsabilidade. Notifique-nos imediatamente sobre qualquer 
              uso não autorizado de sua conta.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">7. Modificações do Serviço</h2>
            <p className="text-muted-foreground">
              Reservamo-nos o direito de modificar, suspender ou descontinuar o serviço a qualquer momento, 
              com ou sem aviso prévio. Também podemos atualizar estes Termos de Uso periodicamente.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">8. Rescisão</h2>
            <p className="text-muted-foreground">
              Podemos encerrar ou suspender seu acesso ao serviço imediatamente, sem aviso prévio, por qualquer 
              motivo, incluindo violação destes Termos de Uso.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">9. Lei Aplicável</h2>
            <p className="text-muted-foreground">
              Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa 
              será submetida ao foro da comarca de São Paulo, SP.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold font-display mb-3">10. Contato</h2>
            <p className="text-muted-foreground">
              Para dúvidas sobre estes Termos de Uso, entre em contato através do email: 
              contato@auria.dental
            </p>
          </section>
        </div>
      </main>
    </div>
  );
}
