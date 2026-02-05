# Relatório QA Dental — Avaliação "teste" (2df79c8d)

> Gerado em 2026-02-05 pela skill `dental-qa-specialist`

**Modo:** Caso Existente (Playwright)
**Dentes avaliados:** 11, 13, 21, 23, 31, 41 (todos)

## Resultado: 🔴 3 erros críticos, 9 pontos de atenção, 2 sugestões

---

## 🔴 Crítico (3)

### 1. Shade A2 ignora preferência de clareamento BL1/BL2 (Dentes 11, 21)

**Evidência:** Paciente selecionou "Clareamento notável (BL1/BL2)". Os dentes 11 e 21 (facetas de porcelana) têm cor alvo A2. A2 é 4-5 tons abaixo de BL2.
**Contraste:** Os dentes 13 e 23 (resina direta) CORRETAMENTE ajustaram para WB (≈BL2).
**Impacto:** Incisivos centrais ficarão visivelmente mais escuros que os caninos — resultado estético inaceitável.
**Sugestão:** Cor alvo das facetas deve ser BL2 ou compatível com os dentes adjacentes em resina.

### 2. Cimento diferente entre centrais contralaterais (Dente 11 vs 21)

**Evidência:**
- Dente 11: cimento **White Opaque (WO)** — para mascarar substrato manchado
- Dente 21: cimento **A2** — standard, sem mascaramento

**Regra clínica:** Incisivos centrais (11 e 21) são o ponto mais visível do sorriso. Cimentos diferentes = resultado final diferente. Devem usar o MESMO protocolo de cimentação.
**Sugestão:** Unificar cor do cimento. Se 11 precisa WO por substrato manchado, avaliar se 21 também precisa, ou ajustar ambos.

### 3. Protocolos diferentes para caninos contralaterais idênticos (Dente 13 vs 23)

**Evidência:**
- Dente 13: **3 camadas** (Dentina + Efeitos + Esmalte), marca "3M ESPE", confiança **Alta**
- Dente 23: **2 camadas** (Dentina + Esmalte), marca "Solventum", confiança **Média**
- Ambos: Classe IV Grande, anterior, mesma cor, mesmo nível estético

**Regra clínica:** Dentes contralaterais com mesmo diagnóstico devem ter protocolos espelhados para garantir simetria estética.
**Agravantes:**
- Brand naming inconsistente: "3M ESPE" e "Solventum" são a mesma empresa/produto (Filtek Z350 XT)
- Confiança diferente (Alta vs Média) sem justificativa para o mesmo quadro clínico

---

## 🟡 Atenção (9)

### 1. Camadas efeitos e esmalte idênticas (Dente 13)
A1E em ambas. Sem diferenciação óptica. Efeitos deveria usar CT ou GT para "halo opaco incisal".

### 2. Opaco embutido na descrição da camada (Dente 23)
Shade diz "WB (com opaco WB 0.5mm no fundo)" — mistura duas sub-camadas numa linha. Ambíguo para o dentista: é uma camada ou duas?

### 3. Passo-a-passo desincronizado da tabela (Dentes 13, 23)
Steps referenciam shades originais (WT, WE), tabela mostra substituições (A1E). Dentista lendo os steps procuraria shades que não existem no Z350 XT.

### 4. Concentração de HF inconsistente (Dente 11 vs 21)
- Dente 11: Ácido fluorídrico **5%** (Condac Porcelana FGM)
- Dente 21: Ácido fluorídrico **10%**
Mesma cerâmica, mesmo caso — deveria ser a mesma concentração.

### 5. Encaminhamento sem especialidade definida (Dentes 31, 41)
"Dente requer avaliação especializada" sem indicar qual especialista nem por quê.

### 6. Badge "Indireta" em encaminhamentos (Dentes 31, 41)
Encaminhamento não é procedimento direto nem indireto. Badge semanticamente incorreto.

### 7. Alternativa simplificada contraditória (Dente 23)
Diz "Técnica não aplicável" mas protocolo principal USA Z350 XT dentro do orçamento.

### 8. "Opção Ideal fora do estoque" contraditória (Dente 23)
Recomenda Z350 XT como "fora do orçamento" mas protocolo principal JÁ usa Z350 XT.

### 9. Corredor bucal "Excessivo" sem sugestão de correção (DSD)
Achado clínico relevante sem recomendação de tratamento associada.

---

## 💡 Sugestões (2)

- **Classe IV Grande com alta estética:** Considerar mencionar restauração indireta como alternativa para melhor longevidade.
- **Z350 XT sem shades BL nativos:** Recomendar resina com BL como primeira opção quando paciente deseja clareamento.

---

## ✅ Validações OK

- Notação FDI: Todos os dentes válidos (11, 13, 21, 23, 31, 41)
- Classificação de Black: Classe IV nos dentes 13 e 23 (anterior) = correto
- Hierarquia conservadora: Resina direta como primeira opção = adequado
- Protocolo de polimento: Sequência completa de 5 etapas
- Protocolo de cimentação: Etapas clinicamente corretas
- Formato resin_brand: "Fabricante - Linha" respeitado
- DSD linhas médias: Facial centrada, dental alinhada
- Plano oclusal: Nivelado

---

## Resumo por Dente

| Dente | Tratamento | Camadas | Issues | Status |
|-------|-----------|---------|--------|--------|
| 11 | Faceta Porcelana | Cimentação WO | Shade A2 ≠ BL pref, HF 5% | 🔴 |
| 13 | Resina Classe IV | 3 (Dent+Efeit+Esm) | Efeitos=Esmalte, steps desync | 🟡 |
| 21 | Faceta Porcelana | Cimentação A2 | Shade A2 ≠ BL pref, cimento ≠ 11, HF 10% | 🔴 |
| 23 | Resina Classe IV | 2 (Dent+Esm) | ≠ dente 13, opaco embutido, contradições | 🔴 |
| 31 | Encaminhamento | — | Sem especialidade, badge errado | 🟡 |
| 41 | Encaminhamento | — | Sem especialidade, badge errado | 🟡 |

---

## Padrões Sistêmicos (para correção de prompts)

1. **Falta de consistência entre dentes contralaterais** — A IA gera cada dente isoladamente sem comparar com o contralateral.
2. **Preferência de clareamento aplicada parcialmente** — Resinas ajustam, facetas ignoram.
3. **Steps e tabela gerados independentemente** — Substituições de shade atualizam tabela mas não steps.
4. **Encaminhamentos genéricos** — Prompt não exige justificativa nem especialidade.
5. **Brand naming inconsistente** — "3M ESPE" vs "Solventum" para o mesmo produto.
6. **Efeitos layer sem shade adequado** — Usa shade de esmalte ao invés de translúcido.
