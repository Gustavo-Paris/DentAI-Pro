

# Análise das Funcionalidades e Proposta de Novo Nome + Landing Page

## Análise das Funcionalidades Atuais

Após revisar todo o código da plataforma, identifiquei as seguintes funcionalidades:

### Funcionalidades Principais

| Funcionalidade | Descrição |
|---|---|
| **Análise de Foto Dental com IA** | Upload de foto intraoral que é analisada por IA para detectar múltiplos dentes, classificar cavidades, identificar cor VITA e determinar tipo de tratamento |
| **Design Digital do Sorriso (DSD)** | Análise de proporções faciais/dentais + simulação visual de clareamento (Natural/White/Hollywood) |
| **Recomendação de Resina por IA** | Protocolo de estratificação personalizado com camadas (Opaque/Dentin/Enamel) baseado no inventário do dentista |
| **Protocolo de Cimentação (Porcelana)** | Protocolo completo para facetas cerâmicas quando indicado |
| **Multi-tratamento** | Suporte a resina, porcelana, coroa, implante, endodontia e encaminhamento |
| **Gestão de Inventário** | Catálogo de 250+ cores de resina (15+ marcas) com inventário pessoal |
| **Gestão de Pacientes** | Cadastro, histórico de sessões, notas clínicas |
| **Checklist de Protocolo** | Checklist interativo por caso para acompanhar execução clínica |
| **Exportação PDF** | Relatório profissional com logo da clínica, fotos e protocolo completo |
| **Busca Global** | Comando ⌘K para buscar pacientes e avaliações rapidamente |

---

## Proposta de Novo Nome

O nome atual "ResinMatch AI" é limitante porque:
- Foca apenas em resinas (a plataforma faz muito mais)
- Não comunica a análise visual/DSD
- Não reflete os múltiplos tipos de tratamento

### Sugestões de Nomes

| Nome | Justificativa |
|---|---|
| **DentAI Pro** | Simples, direto, comunica IA + odontologia profissional |
| **SmileOS** | "Sistema Operacional do Sorriso" - moderno, tech-forward |
| **Odontolytics** | Análise dental inteligente - soa científico e premium |
| **ProtocolAI** | Foco em protocolos clínicos com IA |
| **ClinicalAI Dental** | Enfatiza o uso clínico profissional |

**Recomendação Principal: DentAI Pro**
- Curto e memorável
- Comunica IA claramente
- "Pro" indica ferramenta profissional
- Funciona bem em português e inglês

---

## Atualização da Landing Page

A landing page atual menciona apenas "recomendação de resina", mas a plataforma oferece muito mais. Proponho:

### 1. Atualização do Header/Branding
- Mudar de "ResinMatch AI" para o novo nome
- Atualizar meta tags no index.html

### 2. Nova Seção Hero
- Título: "Planejamento clínico inteligente para seu consultório"
- Subtítulo: "IA que analisa fotos, sugere tratamentos e gera protocolos personalizados em segundos"

### 3. Seção de Funcionalidades (substituir "Benefits")
Destacar as 4 principais capacidades:

| Feature | Título | Descrição |
|---|---|---|
| Camera + Brain | Análise Visual com IA | Tire uma foto e a IA identifica dentes, classifica cavidades e detecta cores |
| Smile | Simulação de Sorriso | Visualize o resultado antes de iniciar com simulação DSD |
| Layers | Protocolo de Estratificação | Receba camada por camada qual resina usar do seu inventário |
| FileText | Relatório Profissional | Exporte PDF personalizado com logo do consultório |

### 4. Nova Seção "Como Funciona" (mais detalhada)
```text
01 - Tire a foto intraoral
     Faça upload da foto clínica e fotos adicionais (sorriso, face)

02 - IA analisa o caso completo
     Detecta múltiplos dentes, classifica tratamentos, identifica cor VITA

03 - Visualize o resultado
     Simulação de clareamento e proporções ideais do sorriso

04 - Receba o protocolo
     Protocolo de estratificação ou cimentação com suas resinas disponíveis
```

### 5. Atualizar Estatísticas
- Manter "500+ Avaliações realizadas"
- Manter "250+ Cores de resinas"
- Manter "15+ Marcas disponíveis"
- Adicionar: "6 Tipos de tratamento" (se houver espaço)

### 6. Atualizar FAQ
Adicionar perguntas sobre:
- DSD e simulação de sorriso
- Tipos de tratamento além de resina
- Gestão de pacientes

### 7. Atualizar Depoimentos
Manter os depoimentos atuais mas verificar se mencionam apenas "resina" - podem precisar de ajustes para refletir a amplitude da ferramenta.

---

## Arquivos a Modificar

| Arquivo | Alterações |
|---|---|
| `index.html` | Atualizar title, meta tags (og:title, description) para novo nome |
| `src/pages/Landing.tsx` | Hero, stats, features, how it works, FAQ |
| `src/pages/Dashboard.tsx` | Logo/nome no header |
| `src/pages/Result.tsx` | Logo/nome no header |
| Todos os headers | Atualizar referências a "ResinMatch AI" |

---

## Seção Técnica

### Implementação

1. **Atualizar index.html**
   - `<title>DentAI Pro</title>`
   - Atualizar og:title, og:description, description

2. **Atualizar Landing.tsx**
   - Novo conteúdo hero com messaging expandido
   - Nova seção de features (4 cards com ícones)
   - Expandir "Como funciona" para 4 passos
   - Atualizar FAQ com 2-3 novas perguntas
   - Atualizar referências do nome no header e footer

3. **Atualizar headers em todas as páginas**
   - Dashboard.tsx
   - Result.tsx
   - Profile.tsx
   - EvaluationDetails.tsx
   - Inventory.tsx
   - Patients.tsx
   - PatientProfile.tsx
   - NewCase.tsx
   - Evaluations.tsx

4. **Considerar componente de branding reutilizável**
   - Criar constante para o nome em um arquivo central
   - Facilitar futuras mudanças de branding

