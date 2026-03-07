import React from 'react'
import '../../preview-theme.css'

const BRAND = 'ToSmile.ai'

function EmailLink({ email }: { email: string }) {
  return (
    <a
      href={`mailto:${email}`}
      className="text-primary hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded"
    >
      {email}
    </a>
  )
}

export default function PrivacyPreview() {
  return (
    <div className="section-glow-bg relative min-h-screen">
      {/* Ambient glow orb */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div
          className="glow-orb"
          style={{
            width: 500,
            height: 500,
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            background:
              'radial-gradient(circle, rgb(var(--color-primary-rgb) / 0.08) 0%, transparent 70%)',
          }}
        />
      </div>

      <div className="relative">
        {/* Header */}
        <header className="border-b border-border">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
            <span className="text-xl font-display font-semibold text-gradient-brand">
              {BRAND}
            </span>
            <button className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 rounded px-3 py-1.5">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m12 19-7-7 7-7" />
                <path d="M19 12H5" />
              </svg>
              Voltar
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
          <div className="glass-panel rounded-xl p-6 sm:p-10">
            <h1 className="text-2xl sm:text-3xl font-semibold font-display mb-2">
              Política de Privacidade
            </h1>
            <p className="text-muted-foreground mb-8">
              Última atualização: 05/03/2026
            </p>

            <div className="space-y-8">
              {/* Section 1 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  1. Introdução
                </h2>
                <p className="text-muted-foreground">
                  O {BRAND} está comprometido com a proteção da privacidade e dos
                  dados pessoais de seus usuários, em conformidade com a Lei
                  Geral de Proteção de Dados (LGPD - Lei n. 13.709/2018). Esta
                  política descreve como coletamos, utilizamos, armazenamos e
                  protegemos seus dados e os dados clínicos dos pacientes
                  processados pela plataforma.
                </p>
              </section>

              {/* Section 2 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  2. Dados Coletados
                </h2>
                <p className="text-muted-foreground">
                  Coletamos os seguintes tipos de dados:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>
                    <strong>Dados de cadastro:</strong> Nome completo, email
                    profissional, CRO (opcional)
                  </li>
                  <li>
                    <strong>Dados clínicos dos pacientes:</strong> Informações
                    inseridas pelo profissional para análise, incluindo
                    fotografias intraorais e de sorriso
                  </li>
                  <li>
                    <strong>Fotografias clínicas:</strong> Imagens intraorais,
                    fotos de sorriso e demais registros fotográficos
                  </li>
                  <li>
                    <strong>Dados de uso:</strong> Histórico de avaliações
                    realizadas, protocolos gerados, preferências de materiais
                  </li>
                  <li>
                    <strong>Dados técnicos:</strong> Endereço IP, tipo de
                    dispositivo, navegador utilizado
                  </li>
                </ul>
              </section>

              {/* Section 3 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  3. Base Legal para Tratamento (Art. 7 LGPD)
                </h2>
                <p className="text-muted-foreground">
                  O tratamento dos dados é fundamentado nas seguintes bases
                  legais da LGPD:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>
                    <strong>Consentimento (Art. 7, I):</strong> Para o
                    processamento de fotografias clínicas e dados do paciente
                    pela IA
                  </li>
                  <li>
                    <strong>Execução de contrato (Art. 7, V):</strong> Para
                    fornecer o serviço de apoio à decisão clínica contratado
                  </li>
                  <li>
                    <strong>Legítimo interesse (Art. 7, IX):</strong> Para
                    melhorias de segurança, prevenção de fraudes e análises
                    estatísticas agregadas
                  </li>
                </ul>
              </section>

              {/* Section 4 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  4. Processamento de Dados pela Inteligência Artificial
                </h2>
                <p className="text-muted-foreground">
                  Esta seção detalha como a IA processa os dados clínicos e
                  imagens dos pacientes:
                </p>

                <h3 className="text-lg font-semibold font-display mb-2 mt-4">
                  4.1. Ciclo de Vida das Imagens na IA
                </h3>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>
                    As fotografias clínicas são enviadas de forma criptografada
                    (TLS 1.2+) para os provedores de IA
                  </li>
                  <li>
                    O processamento ocorre em tempo real — as imagens NÃO são
                    armazenadas permanentemente
                  </li>
                  <li>
                    Após a conclusão da análise, as imagens são descartadas dos
                    servidores de processamento
                  </li>
                  <li>
                    As fotografias originais permanecem armazenadas com segurança
                    em nossos servidores
                  </li>
                </ul>

                <h3 className="text-lg font-semibold font-display mb-2 mt-4">
                  4.2. Provedores de IA e Subprocessadores
                </h3>
                <p className="text-muted-foreground">
                  Utilizamos os seguintes provedores de IA como subprocessadores
                  de dados:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>
                    <strong>Google (Gemini):</strong> Análise de fotografias
                    clínicas, geração de protocolos e simulação DSD
                  </li>
                  <li>
                    <strong>Anthropic (Claude):</strong> Geração de protocolos de
                    recomendação de materiais e validação de imagens
                  </li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Ambos os provedores operam sob contratos que proibem o uso dos
                  dados para treinamento de modelos.
                </p>

                <h3 className="text-lg font-semibold font-display mb-2 mt-4">
                  4.3. Anonimização e Minimização
                </h3>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>
                    Os dados enviados à IA são MINIMIZADOS — apenas as
                    informações clinicamente necessárias são transmitidas
                  </li>
                  <li>
                    Dados de identificação direta do paciente NÃO são
                    transmitidos aos provedores de IA
                  </li>
                  <li>
                    As análises da IA retornam apenas dados técnicos — não
                    contêm dados pessoais do paciente
                  </li>
                </ul>

                <h3 className="text-lg font-semibold font-display mb-2 mt-4">
                  4.4. Não Treinamento
                </h3>
                <p className="text-muted-foreground">
                  Garantimos que: os dados clínicos e imagens dos seus pacientes
                  NÃO são utilizados para treinar, aprimorar ou calibrar modelos
                  de IA — nem por nós, nem pelos provedores subprocessadores.
                </p>
              </section>

              {/* Section 5 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  5. Finalidade do Uso dos Dados
                </h2>
                <p className="text-muted-foreground">
                  Utilizamos seus dados para:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Gerar sugestões de protocolos restauradores e de cimentação via IA</li>
                  <li>Processar fotografias clínicas para análise e simulação digital de sorriso</li>
                  <li>Manter histórico de avaliações e protocolos gerados</li>
                  <li>Fornecer recomendações personalizadas baseadas no perfil do profissional</li>
                  <li>Enviar comunicações sobre o serviço (quando autorizado)</li>
                  <li>Gerar relatórios em PDF para compartilhamento com pacientes</li>
                  <li>Cumprir obrigações legais e regulatórias</li>
                </ul>
              </section>

              {/* Section 6 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  6. Armazenamento e Segurança
                </h2>
                <p className="text-muted-foreground">
                  Seus dados são armazenados em servidores seguros com múltiplas
                  camadas de proteção:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Criptografia SSL/TLS 1.2+ para toda transmissão de dados</li>
                  <li>Criptografia em repouso (AES-256) para dados sensíveis e fotografias</li>
                  <li>Controle de acesso baseado em funções (RBAC)</li>
                  <li>Autenticação segura com tokens JWT e rotação automática</li>
                  <li>Monitoramento contínuo de segurança e logs de auditoria</li>
                  <li>Backups regulares com recuperação de desastres</li>
                  <li>Fotografias armazenadas em buckets isolados com URLs assinadas</li>
                </ul>
              </section>

              {/* Section 7 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  7. Compartilhamento de Dados
                </h2>
                <p className="text-muted-foreground">
                  Não vendemos, alugamos ou compartilhamos seus dados pessoais com
                  terceiros para fins comerciais. Os dados podem ser
                  compartilhados apenas:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li>Com provedores de IA para processamento em tempo real das análises</li>
                  <li>Com provedores de infraestrutura essenciais (Supabase, Vercel)</li>
                  <li>Com processadores de pagamento (Stripe) para dados de cobrança</li>
                  <li>Quando exigido por lei, ordem judicial ou autoridade regulatória</li>
                  <li>Para proteger nossos direitos legais em caso de litígio</li>
                </ul>
              </section>

              {/* Section 8 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  8. Seus Direitos (LGPD)
                </h2>
                <p className="text-muted-foreground">
                  De acordo com a LGPD (Arts. 17-22), você tem direito a:
                </p>
                <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
                  <li><strong>Acesso:</strong> Solicitar cópia de todos os seus dados pessoais</li>
                  <li><strong>Correção:</strong> Solicitar correção de dados incompletos ou incorretos</li>
                  <li><strong>Exclusão:</strong> Solicitar a eliminação dos seus dados pessoais</li>
                  <li><strong>Portabilidade:</strong> Exportar seus dados em formato estruturado (JSON)</li>
                  <li><strong>Revogação:</strong> Revogar consentimento a qualquer momento</li>
                  <li><strong>Informação:</strong> Saber com quais subprocessadores seus dados foram compartilhados</li>
                  <li><strong>Oposição:</strong> Opor-se ao tratamento de dados quando baseado em legítimo interesse</li>
                </ul>
                <p className="text-muted-foreground mt-2">
                  Para exercer qualquer desses direitos, entre em contato:{' '}
                  <EmailLink email="privacidade@tosmile.ai" />
                </p>
              </section>

              {/* Section 9 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  9. Cookies
                </h2>
                <p className="text-muted-foreground">
                  Utilizamos cookies essenciais para o funcionamento do serviço.
                  Não utilizamos cookies de rastreamento de terceiros para
                  publicidade.
                </p>
              </section>

              {/* Section 10 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  10. Retenção de Dados
                </h2>
                <p className="text-muted-foreground">
                  Mantemos seus dados enquanto sua conta estiver ativa. Após a
                  exclusão da conta, seus dados serão removidos em até 30 dias,
                  exceto quando houver obrigação legal de retenção.
                </p>
              </section>

              {/* Section 11 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  11. Responsabilidade do Profissional
                </h2>
                <p className="text-muted-foreground">
                  O cirurgião-dentista é o controlador dos dados pessoais de seus
                  pacientes perante a LGPD. Ao utilizar o {BRAND}, o profissional
                  se responsabiliza por obter consentimento informado do paciente.
                </p>
              </section>

              {/* Section 12 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  12. Menores de Idade
                </h2>
                <p className="text-muted-foreground">
                  O {BRAND} é destinado exclusivamente a profissionais de
                  odontologia. Quando o profissional inserir dados de pacientes
                  menores de 18 anos, deverá obter consentimento do responsável
                  legal conforme Art. 14 da LGPD.
                </p>
              </section>

              {/* Section 13 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  13. Alterações nesta Política
                </h2>
                <p className="text-muted-foreground">
                  Podemos atualizar esta Política de Privacidade periodicamente.
                  Notificaremos sobre alterações significativas através do email
                  cadastrado ou aviso no serviço.
                </p>
              </section>

              {/* Section 14 */}
              <section>
                <h2 className="text-xl font-semibold font-display mb-3">
                  14. Contato e Encarregado de Dados
                </h2>
                <p className="text-muted-foreground">
                  Para dúvidas sobre esta Política de Privacidade ou sobre o
                  tratamento dos seus dados, entre em contato:
                </p>
                <ul className="list-none text-muted-foreground mt-2 space-y-1">
                  <li>
                    <strong>Email:</strong>{' '}
                    <EmailLink email="privacidade@tosmile.ai" />
                  </li>
                  <li>
                    <strong>Encarregado de Dados (DPO):</strong>{' '}
                    <EmailLink email="dpo@tosmile.ai" />
                  </li>
                </ul>
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
