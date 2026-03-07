---
title: Clinical Depth Upgrade - Design
created: 2026-03-06
updated: 2026-03-06
status: approved
tags: [type/design, status/approved]
---

# Clinical Depth Upgrade

4 features interconectadas para elevar a profundidade clínica do sistema.

## 1. Anamnese + Radiografia no Step 1

O step 1 (Foto) se expande para **"Dados do Caso"**, consolidando todos os inputs:

1. Foto intraoral (obrigatoria)
2. Foto 45 graus (opcional, ja existe)
3. Foto do rosto (opcional, ja existe)
4. **Radiografia** (opcional, novo) - panoramica, periapical ou bitewing
5. **Anamnese** (opcional, novo) - gravacao de voz + textarea editavel

### Anamnese

- Reutiliza `useSpeechToText` (ja existe no projeto)
- Botao de microfone como acao primaria + textarea para edicao/complemento
- Conteudo livre - dentista fala o que quiser (queixa, historico, expectativas)
- Salvo como `anamnesis: string | null` no evaluation
- Enviado como contexto para analyze-dental-photo, recommend-resin e recommend-cementation
- Incluido no PDF de resultado
- Restaurado pelo draft auto-save

### Radiografia

- Area de upload (drag & drop), mesmo padrao visual das fotos opcionais
- Aceita JPEG, PNG. Auto-deteccao do tipo pela IA (panoramica/periapical/bitewing)
- Enviada como `radiographBase64` no payload de analyze-dental-photo
- Analise radiografica extrai: nivel osseo, proporcao coroa/raiz, lesoes periapicais, caries interproximais, reabsorcoes
- Cruzamento com foto clinica:
  - Carie foto + confirmada rx = confianca sobe
  - Dente saudavel foto + lesao rx = warning
  - Gengivoplastia sugerida + coroa/raiz favoravel rx = confirma
  - Gengivoplastia sugerida + raiz curta rx = contraindica
- Salvo como `radiograph_url` (Supabase Storage) + `radiograph_type` no evaluation
- Resumo radiografico passado para recommend-resin e recommend-cementation

## 2. Upgrade de Modelos

| Tarefa | Antes | Depois |
|--------|-------|--------|
| Analise de foto | Gemini 3.1 Pro | **Gemini 2.5 Pro** |
| Protocolos resina | Claude Sonnet 4.6 | **Claude Opus 4.6** |
| Protocolos cimentacao | Claude Sonnet 4.6 | **Claude Opus 4.6** |
| Fallback foto | Haiku 4.5 | **Claude Sonnet 4.6** |
| Simulacao DSD | Nano Banana 2 | Manter |
| Lip validation | Haiku 4.5 | Manter |

### Timeouts ajustados

- Gemini 2.5 Pro: 90s (manter)
- Claude Opus: 60s (era 45s)
- Fallback Sonnet foto: timeout dinamico (restante do budget 140s)

## 3. Aprofundamento dos Prompts

Principio: **profundidade clinica real, nao verbosidade**. Informacao densa e precisa.

### Analise de foto

- Diagnostico diferencial quando achado ambiguo (carie vs pigmentacao vs restauracao antiga)
- Correlacao com anamnese quando presente
- Classificacao de severidade com criterios objetivos
- Avaliacao de prognostico restaurador por dente (favoravel/reservado/desfavoravel)
- Analise radiografica integrada quando rx disponivel

### Protocolos de resina

- Justificativa clinica para cada decisao
- Sequencia operatoria detalhada mas concisa
- Alertas clinicos contextuais (proximidade pulpar, sensibilidade reportada)
- Integracao com anamnese e achados radiograficos

### Protocolos de cimentacao

- Decisao fundamentada substrato-cimento (raciocinio, nao so tabela)
- Warnings contextuais (dente escurecido, remanescente comprometido)
- Tempo de trabalho e sequencia pratica

### Formato de saida

O tool schema existente nao muda. O conteudo dentro dos campos sera mais denso e preciso.

## 4. Correcao da Gengivoplastia

### Deteccao inconsistente

- Gemini 2.5 Pro + anamnese: correlacionar queixa do paciente com achado visual
- Com rx: proporcao coroa/raiz real (erupcao passiva alterada vs microdontia)
- Simplificar regras: indicacao baseada em evidencia combinada (foto + anamnese + rx)

### Textura/cor artificial na simulacao DSD

- Referencia explicita a textura da gengiva adjacente nao-modificada
- Regras de cor: mesma cor e textura que gengiva ao redor (stippling, gradiente, vascularizacao)
- Transicao suave na linha de corte (nao corte reto digital)

### Magnitude do corte variavel

- Analise de foto passa medidas relativas por dente ("reduzir ~15% da coroa visivel")
- Prompt DSD recebe medidas precisas, nao genericas
- Fallback: regra proporcional golden ratio (largura/comprimento 75-80%)
- Com rx: proporcao coroa/raiz real para calcular maximo seguro

## Abordagem de Implementacao

Incremental em 4 fases, cada uma deployavel isoladamente:

1. **Fase 1**: Step 1 expandido (anamnese + radiografia) + upgrade de modelos
2. **Fase 2**: Aprofundamento dos prompts (analise de foto + protocolos)
3. **Fase 3**: Correcao da gengivoplastia (deteccao + simulacao + magnitude)
4. **Fase 4**: Integracao cruzada (rx informando gengivo, anamnese informando protocolos)

## Decisoes Chave

- Qualidade clinica > custo (sistema cobra o valor necessario)
- Anamnese e radiografia no step 1 (consolidar inputs, menos friction)
- Wizard mantem 6 steps (nao adiciona novo step)
- Tool schemas existentes nao mudam (conteudo mais rico nos mesmos campos)
- Panoramica como MVP de radiografia, periapical/bitewing aceitos tambem
- Auto-deteccao do tipo de radiografia pela IA
