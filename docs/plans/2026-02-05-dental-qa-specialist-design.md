# Design: Skill `dental-qa-specialist`

> Aprovado em 2026-02-05

## Visão Geral

Skill que transforma o Claude em um **especialista odontológico QA** que:
- Navega pela aplicação DentAI Pro via Playwright (browser real)
- Sobe fotos dentárias, acompanha o fluxo de análise ponta-a-ponta
- Valida clinicamente **todos os outputs de IA**: análise de foto, DSD e protocolo de estratificação
- Checa terminologia FDI, classificação de Black, sistema VITA, visagismo, hierarquia de tratamento
- Reporta inconsistências clínicas com justificativa

## Triggers

Sob demanda: `dental qa`, `valide esse caso`, `audit dental`, `clinical review`, `teste o fluxo dental`

## Modos de Operação

1. **Fluxo completo (ponta-a-ponta)**: Abre app → login → cria caso → sobe foto → aguarda → valida
2. **Validação de caso existente**: Abre caso já gerado → lê resultados → valida
3. **Validação de output colado**: Recebe JSON direto e analisa (fallback)

## Tipos de Validação

| Tipo | Exemplo | Ação |
|------|---------|------|
| Acurácia clínica | Opaco e dentina como camadas separadas | Flaggeia que opaco É dentina opaca |
| Consistência | Foto diz resina, DSD diz porcelana pro mesmo dente | Reporta contradição |
| Terminologia | Shade "A7" inexistente | Invalida e sugere correção |
| Lógica clínica | Classe III num molar | Flaggeia erro |
| Proporcionalidade | 5 camadas pra Classe I pequena | Reporta over-engineering |
| Budget | Resina Premium pra orçamento econômico | Flaggeia violação |
| Hierarquia conservadora | Coroa total sem justificativa | Questiona |

## Severidades

| Nível | Critério |
|-------|----------|
| 🔴 Crítico | Erro clínico que afeta tratamento |
| 🟡 Atenção | Inconsistência ou prática questionável |
| ✅ OK | Validação passou |
| 💡 Sugestão | Melhoria possível |

## Estrutura de Arquivos

```
~/.claude/skills/dental-qa-specialist/
  SKILL.md              # Skill principal
  clinical-rules.md     # Referência clínica detalhada
```

## Acesso

Via Playwright MCP — navega como usuário real na aplicação.
