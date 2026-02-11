#!/bin/bash
# Detect hardcoded Portuguese strings in TSX/TS source files.
# This is a WARNING-level check to help migrate remaining strings to i18n.
#
# Excludes:
#   - test files (*.test.*, *.spec.*, __tests__/)
#   - locale/translation files (locales/, i18n.ts)
#   - type definitions (*.d.ts)
#   - UI primitives (components/ui/) — shadcn displayName strings
#   - Terms/Privacy pages — legal text, intentionally hardcoded

set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SRC="$ROOT/src"

# Exit code: 0 = no warnings, 1 = warnings found
EXIT_CODE=0

# Files to scan: .ts and .tsx in src/, excluding noise
FILES=$(find "$SRC" \
  -type f \( -name '*.ts' -o -name '*.tsx' \) \
  ! -path '*/__tests__/*' \
  ! -path '*/test/*' \
  ! -name '*.test.*' \
  ! -name '*.spec.*' \
  ! -name '*.d.ts' \
  ! -path '*/locales/*' \
  ! -path '*/i18n*' \
  ! -path '*/components/ui/*' \
  ! -path '*/pages/Terms.tsx' \
  ! -path '*/pages/Privacy.tsx' \
  | sort)

if [ -z "$FILES" ]; then
  echo "No files to scan."
  exit 0
fi

TOTAL_WARNINGS=0

# Pattern 1: JSX text content — Portuguese words with accented characters
#   Matches: >Texto aqui< or > Algo com acentuação<
#   These are inline text nodes in JSX that should use t()
P1='>[[:space:]]*[A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç]*[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ][A-ZÁÉÍÓÚÂÊÔÃÕÇa-záéíóúâêôãõç]*'

# Pattern 2: Common Portuguese UI words as string literals (in attributes, variables, etc.)
#   These standalone words strongly indicate untranslated strings
P2='"(Salvar|Cancelar|Confirmar|Excluir|Editar|Voltar|Próximo|Carregando|Buscar|Adicionar|Remover|Enviar|Finalizar|Cadastrar|Selecione|Nenhum|Paciente|Avaliação|Avaliações|Inventário|Configurações|Perfil|Relatório|Créditos|Dentista|Clínica|Resultado|Diagnóstico|Tratamento|Protocolo|Exportar)"'

# Pattern 3: Multi-word Portuguese phrases in string literals
#   Matches: "Palavra outra" — two+ words starting with capital, containing accented chars
P3='"[A-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç]+ [a-záéíóúâêôãõçA-ZÁÉÍÓÚÂÊÔÃÕÇ][a-záéíóúâêôãõç ]+'

# Pattern 4: Template literals with Portuguese
P4='`[^`]*[áéíóúâêôãõçÁÉÍÓÚÂÊÔÃÕÇ][^`]*`'

echo "=== i18n Hardcoded String Check ==="
echo ""

for PATTERN_NAME in "JSX_ACCENTED_TEXT" "COMMON_PT_WORDS" "PT_PHRASES" "TEMPLATE_LITERALS"; do
  case "$PATTERN_NAME" in
    JSX_ACCENTED_TEXT)    PATTERN="$P1" ;;
    COMMON_PT_WORDS)      PATTERN="$P2" ;;
    PT_PHRASES)           PATTERN="$P3" ;;
    TEMPLATE_LITERALS)    PATTERN="$P4" ;;
  esac

  MATCHES=$(echo "$FILES" | xargs grep -nE "$PATTERN" 2>/dev/null || true)

  if [ -n "$MATCHES" ]; then
    # Filter out known false positives:
    #   - displayName assignments
    #   - import/require statements
    #   - comments (lines starting with // or *)
    #   - aria-label with English text
    #   - console.log/warn/error
    #   - className strings
    FILTERED=$(echo "$MATCHES" \
      | grep -vE '\.displayName\s*=' \
      | grep -vE '^\s*(//|\*)' \
      | grep -vE 'import |require\(' \
      | grep -vE 'console\.(log|warn|error)' \
      | grep -vE "className=" \
      || true)

    if [ -n "$FILTERED" ]; then
      COUNT=$(echo "$FILTERED" | wc -l | tr -d ' ')
      TOTAL_WARNINGS=$((TOTAL_WARNINGS + COUNT))
      EXIT_CODE=1
      echo "[$PATTERN_NAME] $COUNT warning(s):"
      echo "$FILTERED" | sed 's|^'"$SRC"'/||' | while IFS= read -r line; do
        echo "  WARNING: $line"
      done
      echo ""
    fi
  fi
done

echo "---"
echo "Total warnings: $TOTAL_WARNINGS"

if [ "$TOTAL_WARNINGS" -gt 0 ]; then
  echo ""
  echo "Hint: Use t('key') from react-i18next and add keys to src/locales/pt-BR.json"
  echo "This check is advisory — hardcoded strings in legal pages and UI primitives are excluded."
fi

exit $EXIT_CODE
