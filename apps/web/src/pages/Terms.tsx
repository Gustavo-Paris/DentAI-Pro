import { useTranslation } from 'react-i18next';
import { BRAND_NAME } from '@/lib/branding';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';

const sectionHeadingClass = "text-xl font-semibold font-display mb-3";

// Not using PageShell composite: static legal page with branded header — DetailPage
// is designed for data-fetched entity views, not static content with custom navigation.
export default function Terms() {
  const { t } = useTranslation();
  return (
    <LegalPageLayout title={t('pages.termsTitle')}>
      <p className="text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <section>
        <h2 className={sectionHeadingClass}>1. Aceitação dos Termos</h2>
        <p className="text-muted-foreground">
          Ao acessar e usar o {BRAND_NAME}, você concorda com estes Termos de Uso.
          Se você não concordar com qualquer parte destes termos, não deve usar nosso serviço.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>2. Descrição do Serviço</h2>
        <p className="text-muted-foreground">
          O {BRAND_NAME} é uma ferramenta de apoio à decisão clínica que utiliza inteligência artificial
          para sugerir resinas compostas adequadas para casos odontológicos. O serviço fornece recomendações
          baseadas em dados inseridos pelo usuário e um banco de dados de materiais restauradores.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>3. Limitação de Responsabilidade</h2>
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
        <h2 className={sectionHeadingClass}>4. Uso Adequado</h2>
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
        <h2 className={sectionHeadingClass}>5. Propriedade Intelectual</h2>
        <p className="text-muted-foreground">
          Todo o conteúdo do {BRAND_NAME}, incluindo mas não limitado a textos, gráficos, logos, ícones,
          imagens, algoritmos e software, é propriedade exclusiva do {BRAND_NAME} ou de seus licenciadores
          e é protegido por leis de propriedade intelectual.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>6. Conta do Usuário</h2>
        <p className="text-muted-foreground">
          Você é responsável por manter a confidencialidade de sua conta e senha. Qualquer atividade
          realizada em sua conta é de sua responsabilidade. Notifique-nos imediatamente sobre qualquer
          uso não autorizado de sua conta.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>7. Modificações do Serviço</h2>
        <p className="text-muted-foreground">
          Reservamo-nos o direito de modificar, suspender ou descontinuar o serviço a qualquer momento,
          com ou sem aviso prévio. Também podemos atualizar estes Termos de Uso periodicamente.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>8. Rescisão</h2>
        <p className="text-muted-foreground">
          Podemos encerrar ou suspender seu acesso ao serviço imediatamente, sem aviso prévio, por qualquer
          motivo, incluindo violação destes Termos de Uso.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>9. Lei Aplicável</h2>
        <p className="text-muted-foreground">
          Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil. Qualquer disputa
          será submetida ao foro da comarca de São Paulo, SP.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>10. Contato</h2>
        <p className="text-muted-foreground">
          Para dúvidas sobre estes Termos de Uso, entre em contato através do email:{' '}
          <a href="mailto:contato@tosmile.ai" className="text-primary hover:underline">contato@tosmile.ai</a>
        </p>
      </section>
    </LegalPageLayout>
  );
}
