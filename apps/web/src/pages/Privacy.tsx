import { useTranslation } from 'react-i18next';
import { BRAND_NAME } from '@/lib/branding';
import { LegalPageLayout } from '@/components/shared/LegalPageLayout';

const sectionHeadingClass = "text-xl font-semibold font-display mb-3";

// Not using PageShell composite: static legal page with branded header — DetailPage
// is designed for data-fetched entity views, not static content with custom navigation.
export default function Privacy() {
  const { t } = useTranslation();
  return (
    <LegalPageLayout title={t('pages.privacyTitle')}>
      <p className="text-muted-foreground">
        Última atualização: {new Date().toLocaleDateString('pt-BR')}
      </p>

      <section>
        <h2 className={sectionHeadingClass}>1. Introdução</h2>
        <p className="text-muted-foreground">
          O {BRAND_NAME} está comprometido com a proteção da privacidade e dos dados pessoais de seus
          usuários, em conformidade com a Lei Geral de Proteção de Dados (LGPD - Lei nº 13.709/2018).
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>2. Dados Coletados</h2>
        <p className="text-muted-foreground">Coletamos os seguintes tipos de dados:</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li><strong>Dados de cadastro:</strong> Nome completo, email profissional, CRO (opcional)</li>
          <li><strong>Dados clínicos:</strong> Informações sobre casos odontológicos inseridos para análise
            (idade do paciente, região do dente, tipo de cavidade, etc.)</li>
          <li><strong>Dados de uso:</strong> Histórico de avaliações realizadas, preferências de resinas</li>
          <li><strong>Dados técnicos:</strong> Endereço IP, tipo de dispositivo, navegador utilizado</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>3. Finalidade do Uso dos Dados</h2>
        <p className="text-muted-foreground">Utilizamos seus dados para:</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Fornecer recomendações personalizadas de resinas compostas</li>
          <li>Manter histórico de avaliações realizadas</li>
          <li>Melhorar nossos algoritmos e qualidade do serviço</li>
          <li>Enviar comunicações sobre o serviço (quando autorizado)</li>
          <li>Cumprir obrigações legais</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>4. Armazenamento e Segurança</h2>
        <p className="text-muted-foreground">
          Seus dados são armazenados em servidores seguros com criptografia de ponta a ponta.
          Utilizamos as melhores práticas de segurança da informação, incluindo:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Criptografia SSL/TLS para transmissão de dados</li>
          <li>Criptografia em repouso para dados sensíveis</li>
          <li>Controle de acesso baseado em funções (RBAC)</li>
          <li>Monitoramento contínuo de segurança</li>
          <li>Backups regulares com recuperação de desastres</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>5. Compartilhamento de Dados</h2>
        <p className="text-muted-foreground">
          Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para fins
          comerciais. Seus dados podem ser compartilhados apenas nas seguintes situações:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Com provedores de serviço essenciais (hospedagem, infraestrutura)</li>
          <li>Quando exigido por lei ou ordem judicial</li>
          <li>Para proteger nossos direitos legais</li>
        </ul>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>6. Seus Direitos (LGPD)</h2>
        <p className="text-muted-foreground">De acordo com a LGPD, você tem direito a:</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li><strong>Acesso:</strong> Solicitar cópia dos seus dados pessoais</li>
          <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
          <li><strong>Exclusão:</strong> Solicitar a eliminação dos seus dados pessoais</li>
          <li><strong>Portabilidade:</strong> Receber seus dados em formato estruturado</li>
          <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
          <li><strong>Informação:</strong> Saber com quem seus dados foram compartilhados</li>
        </ul>
        <p className="text-muted-foreground mt-2">
          Para exercer qualquer desses direitos, entre em contato através do email: <a href="mailto:privacidade@tosmile.ai" className="text-primary hover:underline">privacidade@tosmile.ai</a>
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>7. Cookies</h2>
        <p className="text-muted-foreground">
          Utilizamos cookies essenciais para o funcionamento do serviço, como manutenção de sessão
          e preferências de usuário. Não utilizamos cookies de rastreamento de terceiros para publicidade.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>8. Retenção de Dados</h2>
        <p className="text-muted-foreground">
          Mantemos seus dados enquanto sua conta estiver ativa ou conforme necessário para fornecer
          nossos serviços. Após a exclusão da conta, seus dados serão removidos em até 30 dias,
          exceto quando houver obrigação legal de retenção.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>9. Menores de Idade</h2>
        <p className="text-muted-foreground">
          O {BRAND_NAME} é destinado exclusivamente a profissionais de odontologia. Não coletamos
          intencionalmente dados de menores de 18 anos.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>10. Alterações nesta Política</h2>
        <p className="text-muted-foreground">
          Podemos atualizar esta Política de Privacidade periodicamente. Notificaremos sobre
          alterações significativas através do email cadastrado ou aviso no serviço.
        </p>
      </section>

      <section>
        <h2 className={sectionHeadingClass}>11. Contato</h2>
        <p className="text-muted-foreground">
          Para dúvidas sobre esta Política de Privacidade ou sobre o tratamento dos seus dados,
          entre em contato:
        </p>
        <ul className="list-none text-muted-foreground mt-2 space-y-1">
          <li><strong>Email:</strong> <a href="mailto:privacidade@tosmile.ai" className="text-primary hover:underline">privacidade@tosmile.ai</a></li>
          <li><strong>Encarregado de Dados (DPO):</strong> <a href="mailto:dpo@tosmile.ai" className="text-primary hover:underline">dpo@tosmile.ai</a></li>
        </ul>
      </section>
    </LegalPageLayout>
  );
}
