import React from 'react'
import '../../preview-theme.css'

const BRAND = 'ToSmile.ai'

const sections = [
  {
    title: '1. Aceitação dos Termos',
    content: (
      <p className="text-muted-foreground">
        Ao acessar e usar o {BRAND}, você concorda com estes Termos de Uso. Se
        você não concordar com qualquer parte destes termos, não deve usar nosso
        serviço.
      </p>
    ),
  },
  {
    title: '2. Descrição do Serviço',
    content: (
      <>
        <p className="text-muted-foreground">
          O {BRAND} é uma ferramenta de apoio à decisão clínica destinada
          exclusivamente a cirurgiões-dentistas devidamente habilitados. O
          sistema utiliza modelos de Inteligência Artificial (IA) para analisar
          fotografias clínicas, dados do caso e preferências do profissional,
          gerando SUGESTÕES de:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Seleção de resinas compostas e sistemas adesivos adequados ao caso</li>
          <li>Protocolos de estratificação com sequência de camadas, cores e espessuras</li>
          <li>Simulações digitais de sorriso (DSD) para planejamento estético</li>
          <li>Protocolo de cimentação para restaurações indiretas</li>
        </ul>
        <p className="text-muted-foreground mt-2 font-medium">
          Todas as saídas do sistema são SUGESTÕES geradas por algoritmos e devem
          ser interpretadas exclusivamente como referência técnica, nunca como
          diagnóstico, prescrição ou plano de tratamento definitivo.
        </p>
      </>
    ),
  },
  {
    title: '3. Natureza das Sugestões da IA',
    content: (
      <>
        <p className="text-muted-foreground">
          <strong>AVISO FUNDAMENTAL:</strong> A Inteligência Artificial utilizada
          pelo {BRAND} é uma FERRAMENTA DE AUXÍLIO ao diagnóstico e ao
          planejamento de tratamento. Suas saídas constituem SUGESTÕES que devem
          ser obrigatoriamente validadas pelo cirurgião-dentista antes de
          qualquer aplicação clínica.
        </p>
        <p className="text-muted-foreground mt-2">
          O resultado clínico final do tratamento depende de múltiplos fatores
          que estão FORA do escopo e controle da IA, incluindo mas não limitado
          a:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Experiência, habilidade técnica e formação do profissional</li>
          <li>Seleção e qualidade do material restaurador efetivamente utilizado</li>
          <li>Condições clínicas específicas do paciente</li>
          <li>Protocolo de isolamento, preparo cavitário e técnica adesiva empregada</li>
          <li>Sequência clínica adequada de inserção, fotoativação e acabamento/polimento</li>
          <li>Condições de iluminação, umidade e temperatura durante o procedimento</li>
          <li>Colaboração e adesão do paciente às orientações pós-operatórias</li>
          <li>Interações medicamentosas, alergias e condições sistêmicas do paciente</li>
        </ul>
        <p className="text-muted-foreground mt-2">
          A IA NÃO realiza exame clínico, NÃO avalia condições periodontais em
          tempo real, NÃO verifica a integridade do substrato dental e NÃO
          substitui exames complementares.
        </p>
      </>
    ),
  },
  {
    title: '4. Limitação de Responsabilidade',
    content: (
      <>
        <p className="text-muted-foreground">
          O cirurgião-dentista é o ÚNICO responsável pelas decisões clínicas
          tomadas em relação ao tratamento de seus pacientes. O {BRAND} e seus
          desenvolvedores NÃO se responsabilizam por:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Diagnósticos, planos de tratamento ou condutas clínicas baseadas nas sugestões da IA</li>
          <li>Resultados estéticos ou funcionais dos procedimentos realizados</li>
          <li>Danos, prejuízos ou complicações decorrentes do uso das sugestões fornecidas</li>
          <li>Incompatibilidade entre as sugestões e as condições clínicas reais do paciente</li>
          <li>Falhas decorrentes de informações incorretas ou incompletas fornecidas pelo profissional</li>
        </ul>
      </>
    ),
  },
  {
    title: '5. Uso Adequado',
    content: (
      <>
        <p className="text-muted-foreground">Você concorda em:</p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>Utilizar o serviço exclusivamente como ferramenta complementar de apoio à decisão clínica</li>
          <li>Fornecer informações precisas e verdadeiras ao usar o serviço</li>
          <li>Validar clinicamente TODA sugestão antes de aplicá-la ao paciente</li>
          <li>Não compartilhar suas credenciais de acesso com terceiros</li>
          <li>Não utilizar o serviço para fins ilegais ou não autorizados</li>
          <li>Não tentar acessar áreas restritas do sistema</li>
          <li>Respeitar a privacidade e dados de pacientes conforme a LGPD</li>
          <li>Obter consentimento informado do paciente para uso de suas imagens e dados na plataforma</li>
        </ul>
      </>
    ),
  },
  {
    title: '6. Processamento de Imagens e Dados Clínicos pela IA',
    content: (
      <>
        <p className="text-muted-foreground">
          Ao enviar fotografias clínicas e dados do paciente, você consente que
          estes sejam processados por modelos de IA de terceiros para geração das
          sugestões. Esclarecemos que:
        </p>
        <ul className="list-disc list-inside text-muted-foreground mt-2 space-y-1">
          <li>As imagens são transmitidas de forma criptografada (TLS 1.2+)</li>
          <li>Os provedores de IA NÃO utilizam as imagens para treinamento de seus modelos</li>
          <li>As imagens são processadas em tempo real e NÃO são armazenadas pelos provedores de IA</li>
          <li>Os dados dos pacientes são transmitidos de forma anonimizada</li>
          <li>As fotografias clínicas originais são armazenadas em nossos servidores seguros</li>
          <li>O profissional pode solicitar a exclusão de todas as imagens e dados a qualquer momento</li>
        </ul>
      </>
    ),
  },
  {
    title: '7. Propriedade Intelectual',
    content: (
      <p className="text-muted-foreground">
        Todo o conteúdo do {BRAND}, incluindo mas não limitado a textos,
        gráficos, logos, ícones, imagens, algoritmos e software, é propriedade
        exclusiva do {BRAND} ou de seus licenciadores e é protegido por leis de
        propriedade intelectual.
      </p>
    ),
  },
  {
    title: '8. Conta do Usuário',
    content: (
      <p className="text-muted-foreground">
        Você é responsável por manter a confidencialidade de sua conta e senha.
        Qualquer atividade realizada em sua conta é de sua responsabilidade.
      </p>
    ),
  },
  {
    title: '9. Modificações do Serviço',
    content: (
      <p className="text-muted-foreground">
        Reservamo-nos o direito de modificar, suspender ou descontinuar o
        serviço a qualquer momento, com ou sem aviso prévio.
      </p>
    ),
  },
  {
    title: '10. Rescisão',
    content: (
      <p className="text-muted-foreground">
        Podemos encerrar ou suspender seu acesso ao serviço imediatamente, sem
        aviso prévio, por qualquer motivo, incluindo violação destes Termos de
        Uso.
      </p>
    ),
  },
  {
    title: '11. Lei Aplicável',
    content: (
      <p className="text-muted-foreground">
        Estes Termos de Uso são regidos pelas leis da República Federativa do
        Brasil, em especial a LGPD, o Código de Defesa do Consumidor e o Marco
        Civil da Internet. Foro da comarca de São Paulo, SP.
      </p>
    ),
  },
  {
    title: '12. Contato',
    content: (
      <p className="text-muted-foreground">
        Para dúvidas sobre estes Termos de Uso, entre em contato através do
        email:{' '}
        <a
          href="mailto:contato@tosmile.ai"
          className="text-primary hover:underline transition-colors focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 rounded"
        >
          contato@tosmile.ai
        </a>
      </p>
    ),
  },
]

export default function TermsPreview() {
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
              Termos de Uso
            </h1>
            <p className="text-muted-foreground mb-8">
              Última atualização: 05/03/2026
            </p>

            <div className="space-y-8">
              {sections.map((section) => (
                <section key={section.title}>
                  <h2 className="text-xl font-semibold font-display mb-3">
                    {section.title}
                  </h2>
                  {section.content}
                </section>
              ))}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
