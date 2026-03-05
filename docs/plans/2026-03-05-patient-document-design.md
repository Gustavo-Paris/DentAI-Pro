---
title: "Patient Document Generation"
created: 2026-03-05
updated: 2026-03-05
status: draft
tags: [type/design, feature/patient-document]
---

# Patient Document Generation

> Gera conteudo em linguagem leiga para o paciente, baseado nos dados clinicos ja existentes no caso.

## Contexto

Dentistas brasileiros estao usando ChatGPT com prompts manuais para gerar orientacoes pos-operatorias, TCLEs e explicacoes de tratamento. O AURIA ja tem todos os dados clinicos necessarios — falta gerar o conteudo voltado ao paciente automaticamente.

Inspirado por: Ebook "IAs que todos os dentistas deveriam conhecer" (Sao Leopoldo Mandic)

## Decisoes

| Decisao | Escolha | Justificativa |
|---------|---------|---------------|
| Separar do PDF clinico | Sim | PDF clinico e tecnico (dentista), documento do paciente e leigo |
| Canal de entrega | SharedEvaluation + WhatsApp + PDF separado | Reutiliza infra existente (90% pronto) |
| TCLE approach | Template fixo com campos dinamicos | Documento legal nao pode ter criatividade da IA |
| Custo em creditos | Gratuito (incluido no caso) | Haiku 4.5 ~$0.002/doc, cobrar cria atrito desnecessario |
| Modelo de IA | Claude Haiku 4.5 | Texto simples, barato, rapido |

## Arquitetura

```
[Pagina de Resultado]
       |
       v botao "Documento do Paciente"
       |
[Edge Function: generate-patient-document]
       |
       |-- Haiku 4.5 -> Explicacao + Pos-op + Dieta (1 chamada)
       |-- Template fixo -> TCLE (preenchimento de campos, sem IA)
       |
       v salva no evaluation record
       |
       |-- SharedEvaluation exibe nova secao "Orientacoes"
       +-- Botao "Baixar PDF do Paciente" (jsPDF, separado do clinico)
```

## Componentes

### 1. Edge Function: `generate-patient-document`

- **Input**: `evaluationId` + `sessionId` + `includeTCLE: boolean`
- Busca dados do caso (dente, tratamento, material, regiao, alertas, preferencias)
- **1 chamada Haiku 4.5** com prompt que retorna JSON estruturado:

```json
{
  "treatment_explanation": "string (2-3 paragrafos)",
  "post_operative": ["orientacao 1", "orientacao 2", "..."],
  "dietary_guide": {
    "avoid": ["alimento 1", "alimento 2"],
    "prefer": ["alimento 1", "alimento 2"],
    "duration_hours": 48
  }
}
```

- **TCLE**: template fixo em `_shared/templates/tcle.ts` com campos dinamicos:
  - `{procedimento}`, `{dente}`, `{material}`, `{riscos}`, `{alternativas}`
  - `{clinica}`, `{dentista}`, `{cro}`, `{data}`
- Sem custo de creditos
- Salva resultado em campo `patient_document: jsonb` na tabela `evaluations`

### 2. Prompt: `patient-document`

- Registrado no prompt registry existente
- Provider: Claude Haiku 4.5
- Mode: `text-tools` (function calling -> JSON estruturado)
- Temperature: 0.3
- System prompt recebe: tipo de tratamento, dente (nome leigo), material, nivel estetico, alertas, idade do paciente
- Regras:
  - Linguagem acessivel (paciente leigo, sem jargao)
  - Portugues brasileiro
  - Tom acolhedor mas profissional
  - Orientacoes pos-op especificas ao tipo de tratamento
  - Guia alimentar baseado no tipo de restauracao

### 3. Frontend: botao na EvaluationDetails

- Novo botao no `headerActions`: "Documento do Paciente" (icone FileText)
- Modal com toggle "Incluir TCLE" (default: on)
- Preview do conteudo gerado
- Acoes: "Copiar", "Baixar PDF", "Enviar WhatsApp"

### 4. SharedEvaluation: nova secao

- Abaixo do DSD, nova secao "Orientacoes do seu Dentista"
- Exibe: explicacao do tratamento, orientacoes pos-op (checklist visual), guia alimentar
- TCLE exibido separado com campo de assinatura (se incluido)
- So aparece se `patient_document` existe no registro

### 5. PDF do Paciente

- Documento separado do PDF clinico
- Layout simples: logo da clinica, nome do paciente, data
- Secoes: Explicacao -> Orientacoes -> Alimentacao -> TCLE (se incluido)
- Font size maior (12-14pt)
- Nome do arquivo: `orientacoes-{paciente}-{data}.pdf`

## Dados necessarios (ja disponiveis)

| Dado | Fonte |
|------|-------|
| Tipo de tratamento | `evaluation.treatment_type` |
| Dente (FDI) | `evaluation.tooth` |
| Material/resina | `evaluation.resins.name` |
| Regiao | `evaluation.region` |
| Alertas | `evaluation.alerts[]` |
| Idade | `evaluation.patient_age` |
| Nivel estetico | `evaluation.aesthetic_level` |
| Bruxismo | `evaluation.bruxism` |
| Nome paciente | `evaluation.patient_name` |
| Clinica/dentista/CRO | `profiles` table |

## Banco de dados

- Novo campo: `evaluations.patient_document jsonb null`
- Sem migration complexa — campo nullable, retrocompativel

## Escopo NAO incluido (futuro)

- Assinatura digital do TCLE (DocuSign/similar)
- Envio por email direto ao paciente
- Traducao automatica (en-US) — MVP so pt-BR
- Lembretes de retorno

## Links

- [[2026-02-28-unified-analysis-design|Unified Analysis Design]]
- [[2026-02-26-full-application-audit|Full Application Audit]]
