---
title: "Brainstorm — Wizard Flow Pro"
created: 2026-02-06
updated: 2026-02-06
status: draft
tags: [type/plan, status/draft]
---

# Brainstorm — Wizard Flow: Melhorias e Novas Funcionalidades

> Análise completa do fluxo de wizard atual com propostas de melhorias em UX, entrega de valor, e funcionalidades novas.

## Estado Atual — Resumo

O wizard tem 6 etapas: **Foto → Preferências → Análise IA → DSD → Revisão → Resultado**. Detecta múltiplos dentes, gera protocolos de estratificação (resina) e cimentação (porcelana), oferece simulação DSD com before/after, e salva rascunhos automaticamente. É funcional e sólido, mas tem oportunidades claras de melhoria.

---

## A. Melhorias de UX (Experiência do Usuário)

### A1. Navegação Livre Entre Steps (Step Jumping)
**Problema:** Atualmente só é possível voltar 1 step por vez. O dentista não pode pular de Revisão direto para Foto.
**Proposta:** Permitir clicar em qualquer step já completado no stepper para voltar. Steps futuros permanecem bloqueados.
**Valor:** Reduz frustração quando o dentista quer re-verificar algo sem percorrer todo o caminho de volta.
**Esforço:** Baixo — o WizardPage do PageShell já suporta; basta habilitar no adapter.

### A2. Resumo Contextual no Stepper (Smart Breadcrumbs)
**Problema:** O stepper mostra apenas ícone + nome do step. O dentista não tem visão rápida do que já foi preenchido.
**Proposta:** Ao hover/tap num step completo, mostrar mini-tooltip com resumo:
- Step 1: Thumbnail da foto + "2 fotos enviadas"
- Step 2: "Natural (A1/A2)"
- Step 3: "4 dentes detectados, confiança 87%"
- Step 4: "Simetria 55%, Proporção 65%"
- Step 5: "3 dentes selecionados, Paciente: João"
**Valor:** Orientação rápida sem precisar navegar.
**Esforço:** Médio.

### A3. Indicador de Progresso com Tempo Estimado
**Problema:** Na análise (Step 3) e DSD (Step 4), o usuário não sabe quanto tempo vai esperar.
**Proposta:** Adicionar estimativa de tempo restante baseada em histórico:
- "Análise ~ 15-25s" com barra de progresso temporal
- "Simulação gerando em segundo plano ~ 60s"
**Valor:** Reduz ansiedade durante espera. Padrão UX de transparência.
**Esforço:** Baixo — já tem os dados, só precisa exibir.

### A4. Onboarding do Wizard (First-Time Experience)
**Problema:** Usuário novo não sabe o que esperar do fluxo, custo de créditos, o que é DSD, etc.
**Proposta:** No primeiro uso, mostrar um mini-tour (3-4 cards tipo coach marks):
1. "Envie uma foto intraoral e a IA analisa automaticamente"
2. "Receba uma simulação do sorriso ideal"
3. "Revise e customize o protocolo de tratamento"
4. "Custo: 3 créditos por caso completo"
Opção "Não mostrar novamente" persistida em localStorage.
**Valor:** Reduz abandono de novos usuários. Aumenta confiança.
**Esforço:** Baixo-Médio.

### A5. Animação de Transição Entre Steps
**Problema:** Transição entre steps é abrupta (corte seco).
**Proposta:** Slide horizontal suave (150-250ms) com direction awareness — slide-left ao avançar, slide-right ao voltar. Framer Motion ou CSS transitions.
**Valor:** Sensação de "app premium", fluidez.
**Esforço:** Baixo.

### A6. Mobile: Stepper Redesign
**Problema:** No mobile, o stepper atual mostra dots + card do step atual. Funcional mas não diferenciado.
**Proposta:** Progress bar minimalista no topo (tipo app de delivery) com step number e nome. Tap para expandir lista completa dos steps.
**Valor:** Mais espaço vertical para conteúdo. Padrão mobile moderno.
**Esforço:** Médio.

---

## B. Melhorias de Valor Clínico (AI & Protocolos)

### B1. Confidence Score Visível + Explicabilidade
**Problema:** A IA retorna um `confidence` score, mas não é exibido de forma proeminente. O dentista não sabe quão confiável é a detecção.
**Proposta:**
- Badge de confiança por dente (Alta >80%, Média 50-80%, Baixa <50%)
- Cor: verde/amarelo/vermelho
- Tooltip explicando: "Alta confiança: lesão claramente visível na imagem"
- Badge global na análise: "Confiança geral: 87%"
**Valor:** Transparência. O dentista decide quanto confiar na IA. Requisito ético para IA clínica.
**Esforço:** Baixo — dados já existem, só precisa apresentar melhor.

### B2. Comparativo de Materiais no Protocolo
**Problema:** O protocolo recomenda marcas/tons específicos, mas não mostra alternativas lado a lado.
**Proposta:** Na página de resultado, adicionar tab "Comparativo" mostrando:
- Resina recomendada vs. alternativas
- Tabela: marca, opacidade, polibilidade, durabilidade, faixa de preço
- Destaque se o dentista tem no inventário
**Valor:** Decisão informada. Reduz dependência de uma marca específica.
**Esforço:** Médio — precisa enriquecer o prompt de recomendação para retornar comparativos.

### B3. Galeria de Referências Visuais por Classificação
**Problema:** O dentista recebe "Classe IV, substrato escuro" mas não tem referência visual do que isso significa em termos de resultado.
**Proposta:** Para cada classificação (Black I-VI, substrato claro/escuro/metálico), mostrar fotos de referência de casos similares finalizados (banco de imagens genérico, não de pacientes reais — ou com consentimento).
**Valor:** Contexto visual para decisão de tratamento. Ferramenta educacional.
**Esforço:** Alto — requer curadoria de banco de imagens.

### B4. Score de Complexidade do Caso
**Problema:** Não há indicação clara da complexidade do caso para o dentista planejar tempo/recursos.
**Proposta:** Calcular e exibir um "Complexity Score" baseado em:
- Número de dentes
- Classe da cavidade (IV e V mais complexas)
- Profundidade
- Condição do substrato
- Necessidade de tratamento especial (endodontia, encaminhamento)
Exibir como: "Caso Simples / Moderado / Complexo" com breakdown.
**Valor:** Planejamento de agenda. Ajuda na comunicação com o paciente sobre tempo.
**Esforço:** Baixo-Médio — lógica de scoring no frontend baseada nos dados que já existem.

### B5. Sugestão de Fotos Adicionais Baseada na Análise
**Problema:** As fotos adicionais (45°, face) são opcionais no Step 1, antes da análise.
**Proposta:** Após a análise (Step 3), se a IA detectar necessidade, sugerir fotos adicionais:
- "Detectamos dentes anteriores — uma foto a 45° melhoraria a análise DSD"
- "Caso complexo — foto facial ajudaria no planejamento visagístico"
Com opção de "Adicionar foto agora" (volta ao Step 1 com dados preservados) ou "Continuar sem".
**Valor:** Melhora qualidade da análise sem obrigar foto extra upfront.
**Esforço:** Médio.

### B6. Histórico de Análises do Mesmo Dente
**Problema:** Se o paciente já teve avaliações anteriores do mesmo dente, não há comparação.
**Proposta:** Na Revisão (Step 5), se o paciente for selecionado e tiver histórico, mostrar:
- "Dente 11 — avaliado em 15/01/2026: Classe III, resina recomendada"
- Alerta se o tratamento indicado agora difere do anterior
- Timeline visual do dente
**Valor:** Continuidade do cuidado. Detecção de progressão/regressão. Diferencial pro.
**Esforço:** Médio — query no banco por paciente + dente.

---

## C. Novas Funcionalidades

### C1. Modo Rápido (Quick Case) — Sem DSD
**Problema:** Nem todo caso precisa de DSD (ex: posteriores, emergências). O fluxo força 6 steps mesmo quando o dentista só quer protocolo.
**Proposta:** No Step 2, oferecer dois caminhos:
- **Caso Completo** (3 créditos): Foto → Preferências → Análise → DSD → Revisão → Resultado
- **Caso Rápido** (1 crédito): Foto → Análise → Revisão → Resultado (pula DSD e Preferências)
O Quick Case seria ideal para: posteriores, emergências, casos onde estética não é prioridade.
**Valor:** Economia de créditos. Fluxo mais rápido. Segmentação inteligente.
**Esforço:** Médio — condicional no wizard para pular steps 2 e 4.

### C2. Modo Batch (Múltiplas Fotos de uma Vez)
**Problema:** Se o dentista tem 5 pacientes para avaliar, precisa fazer o wizard 5 vezes.
**Proposta:** "Modo Batch" na tela inicial:
- Upload de múltiplas fotos
- Cada foto gera uma análise automática (paralelo)
- Dashboard de resultados: foto | dentes detectados | ações
- Clique para abrir revisão individual
**Valor:** Produtividade massiva para clínicas com volume. Diferencial enterprise.
**Esforço:** Alto — orquestração paralela, UI nova.

### C3. Notas de Voz no Wizard
**Problema:** No Step 5 (Revisão), o campo "Notas Clínicas" exige digitação. Dentistas preferem ditar.
**Proposta:** Botão de microfone ao lado do campo de notas clínicas:
- Speech-to-text via Web Speech API (nativo do browser)
- Transcrição em tempo real
- Edição manual após transcrição
**Valor:** UX mobile-first. Mãos livres durante atendimento. Adoção mais rápida.
**Esforço:** Baixo — Web Speech API é nativa, sem custo de API.

### C4. Compartilhamento com Paciente (Patient View)
**Problema:** O share link atual mostra dados clínicos resumidos. O paciente não entende termos técnicos.
**Proposta:** Criar uma "Patient View" do caso:
- Linguagem leiga: "Seu dente da frente precisa de uma restauração"
- Foto com anotação visual dos dentes afetados
- Simulação DSD before/after (o principal selling point)
- Estimativa de sessões
- Botão "Agendar consulta" (link configurável pelo dentista)
- Sem termos técnicos (Classe IV → "cavidade grande", substrato → omitido)
**Valor:** Comunicação com paciente. Aceitação de tratamento. Marketing do dentista.
**Esforço:** Médio-Alto — nova página com tradução de termos + config de branding.

### C5. Template de Protocolos Personalizados
**Problema:** Os protocolos gerados pela IA são genéricos (baseados na literatura). Cada dentista tem suas preferências de marca/técnica.
**Proposta:** Na página de Perfil, seção "Meus Protocolos":
- Salvar protocolos favoritos como templates
- Definir marcas preferidas de resina/cerâmica/cimento
- Na próxima análise, a IA prioriza essas preferências
- "Clone e edite" a partir de protocolos gerados
**Valor:** Personalização. Reduz edição manual. Fidelização.
**Esforço:** Médio — novo CRUD + context no prompt.

### C6. Modo Educacional (Learning Mode)
**Problema:** Estudantes e recém-formados usariam a ferramenta para aprender, mas o wizard é "prático" demais.
**Proposta:** Toggle "Modo Aprendizado" no perfil:
- Em cada step, mostra explicação adicional:
  - Step 3: "A IA classificou como Classe IV porque..."
  - Step 4: "A proporção dourada ideal é 1.618:1 porque..."
  - Step 5: "Resina nanoparticulada foi escolhida porque..."
- Links para artigos/referências
- Quiz opcional: "Você concorda com a indicação da IA? Por quê?"
**Valor:** Mercado de faculdades. Diferencial educacional. Upsell de plano.
**Esforço:** Médio-Alto — conteúdo educacional + UI condicional.

### C7. Integração com Agenda/Calendar
**Problema:** Após criar o caso, o dentista precisa manualmente agendar o paciente.
**Proposta:** No resultado (Step 6), opção "Agendar tratamento":
- Estimativa de tempo baseada no protocolo (ex: "Restauração Classe IV ~ 45min")
- Integração com Google Calendar (add event) ou geração de .ics
- Inclui: paciente, dente, tipo de tratamento, materiais necessários
**Valor:** Workflow end-to-end. Reduz trabalho manual pós-caso.
**Esforço:** Baixo-Médio (Google Calendar link) a Alto (integração full).

### C8. Relatório de Tendências por Paciente
**Problema:** Não há visão longitudinal da saúde bucal do paciente.
**Proposta:** Na página do paciente, tab "Tendências":
- Gráfico temporal: número de dentes afetados por sessão
- Mapa de calor da arcada: dentes mais tratados
- Evolução de scores DSD (simetria, proporção) ao longo do tempo
- Alertas: "Paciente com 3+ restaurações no mesmo quadrante — investigar causa sistêmica"
**Valor:** Visão holística. Diagnóstico preventivo. Diferencial clínico.
**Esforço:** Médio — agregação de dados existentes + charts.

---

## D. Melhorias Técnicas / Performance

### D1. Prefetch Inteligente
**Problema:** Cada step carrega dados sob demanda. Há micro-latências perceptíveis.
**Proposta:** Prefetch no background:
- Ao chegar no Step 2, começar upload da foto para Storage (não esperar Step 3)
- Ao chegar no Step 4, pré-carregar assets de comparação
- Service worker para cache de assets estáticos do wizard
**Valor:** Percepção de velocidade.
**Esforço:** Médio.

### D2. Análise Otimista com Streaming
**Problema:** O Step 3 mostra timeline falsa (6 sub-steps animados) enquanto espera uma única resposta da API.
**Proposta:** Se possível com Gemini, usar streaming response para atualizar a UI em tempo real conforme a IA processa. Mesmo se não disponível via Gemini, trocar a timeline fake por progress real (bytes recebidos / timeout estimado).
**Valor:** Honestidade da UI. Sensação de velocidade real.
**Esforço:** Médio-Alto (depende da API do Gemini suportar streaming para structured output).

### D3. Offline-First para Fotos
**Problema:** Se a conexão cair entre o upload e a análise, o usuário perde a foto.
**Proposta:** Salvar foto no IndexedDB imediatamente após seleção. Se a conexão falhar, a foto persiste e o wizard pode ser retomado.
**Valor:** Robustez. Especialmente importante para clínicas com internet instável.
**Esforço:** Baixo-Médio.

### D4. Cancelamento de Operações Longas
**Problema:** Não há botão de cancelar durante análise ou DSD. O usuário fica preso esperando.
**Proposta:** Botão "Cancelar" durante Steps 3 e 4 que:
- Aborta a request (AbortController)
- Permite voltar ao step anterior
- Não consome crédito (crédito só é consumido após resposta bem-sucedida)
**Valor:** Controle do usuário. Evita crédito "jogado fora" em caso de erro.
**Esforço:** Baixo — AbortController já é padrão.

---

## E. Priorização Recomendada

### Impacto Alto + Esforço Baixo (Quick Wins)
1. **A1** — Navegação livre entre steps
2. **B1** — Confidence score visível
3. **A3** — Indicador de tempo estimado
4. **A5** — Animação de transição
5. **D4** — Cancelamento de operações
6. **C3** — Notas de voz

### Impacto Alto + Esforço Médio (Next Sprint)
7. **C1** — Modo rápido (Quick Case)
8. **B4** — Score de complexidade
9. **B6** — Histórico do mesmo dente
10. **C4** — Patient View (compartilhamento leigo)
11. **A4** — Onboarding first-time

### Impacto Alto + Esforço Alto (Roadmap)
12. **C5** — Templates personalizados
13. **C8** — Tendências por paciente
14. **C2** — Modo batch
15. **C6** — Modo educacional
16. **B3** — Galeria de referências visuais

---

## F. Análise de Mercado — Contexto

Baseado em pesquisa de mercado (fev/2026):

- **Overjet / VideaAI / Pearl**: Focam em radiografias (panorâmicas, periapicais). AURIA se diferencia por trabalhar com fotos intraorais diretas e DSD — um nicho menos saturado.
- **SmileCloud**: Principal concorrente em DSD, mas focado em laboratórios protéticos. AURIA é dentist-first.
- **PreTeeth AI Pro**: App mobile com DSD rápido, mas sem protocolos de tratamento. AURIA entrega o protocolo completo.
- **Diagnocat**: Forte em CBCT/3D. AURIA é mais acessível (só precisa de foto do celular).

**Diferencial AURIA que deve ser mantido e amplificado:**
1. Protocolo de tratamento completo (não só diagnóstico)
2. DSD integrado no mesmo fluxo (não é app separado)
3. Funciona com foto de celular (baixa barreira de entrada)
4. Multi-dente em sessão única
5. Inventário integrado com recomendações

---

*Documento gerado como ponto de partida para discussão. Prioridades e escopo devem ser validados antes da implementação.*
