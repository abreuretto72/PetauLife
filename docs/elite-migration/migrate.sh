#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════
# migrate.sh — Onda 1 da migração Elite (renames mecânicos)
# ═══════════════════════════════════════════════════════════════════════════
#
# PROPOSTA — este script ainda não foi executado no repo.
#
# Renomeia os ~975 call sites dos tokens LEGACY com destino inequívoco.
# Os tokens ambíguos (purple / petrol / rose / sky) NÃO são tocados por
# aqui — eles precisam de revisão manual conforme `migration-audit.md §Onda 2`.
#
# COMO USAR (quando a migração for aprovada):
#
#   1. Promover os .proposal pra arquivos reais:
#      cp docs/elite-migration/colors.ts.proposal        constants/colors.ts
#      cp docs/elite-migration/fonts.ts.proposal         constants/fonts.ts
#      cp docs/elite-migration/AuExpertLogo.tsx.proposal components/AuExpertLogo.tsx
#
#   2. Instalar fontes:
#      npm install @expo-google-fonts/inter @expo-google-fonts/playfair-display @expo-google-fonts/jetbrains-mono
#
#   3. Carregar fontes em app/_layout.tsx (ver `elite-tokens.md §5.1.1`)
#
#   4. Rodar este script (DA RAIZ do repo):
#      bash docs/elite-migration/migrate.sh
#
#   5. Verificar:
#      npx tsc --noEmit
#      git diff --stat
#
#   6. Smoke test no device + revisão manual dos tokens ambíguos
#      (ver §Onda 2 do migration-audit.md)
#
# SEGURANÇA:
#   - Backup via git (commit antes de rodar)
#   - Só mexe em .ts e .tsx
#   - Exclui node_modules/ e docs/
#   - Usa sed in-place com extensão temporária (compatível com macOS e Linux)
#
# ═══════════════════════════════════════════════════════════════════════════

set -euo pipefail

# Cor do terminal pra feedback visual (funciona em bash/zsh)
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo "═══════════════════════════════════════════════"
echo "  Migração Elite — Onda 1 (renames mecânicos)"
echo "═══════════════════════════════════════════════"
echo ""

# Confirma que estamos na raiz do repo
if [ ! -f "package.json" ] || [ ! -d "constants" ]; then
  echo "ERRO: rode este script da raiz do projeto auExpert."
  exit 1
fi

# Aviso de backup
if [ -z "$(git status --porcelain 2>/dev/null)" ]; then
  echo -e "${GREEN}✓${NC} Working tree limpo (backup via git OK)"
else
  echo -e "${YELLOW}⚠${NC}  Você tem mudanças não commitadas. Recomendo commitar antes."
  read -p "Continuar mesmo assim? (y/N) " -n 1 -r
  echo
  [[ $REPLY =~ ^[Yy]$ ]] || exit 1
fi

echo ""
echo "Buscando arquivos afetados..."

# Lista arquivos que contêm tokens legacy mecânicos
FILES=$(grep -rl -E "colors\.(accent|accentLight|accentDark|accentGlow|accentSoft|accentMed|gold|goldSoft|lime|limeSoft|petrolDark|petrolGlow|roseSoft)\b" \
  --include='*.tsx' --include='*.ts' . \
  --exclude-dir=node_modules --exclude-dir=docs 2>/dev/null || true)

N=$(echo "$FILES" | grep -c . 2>/dev/null || echo 0)
echo -e "  ${N} arquivos candidatos."
echo ""

if [ "$N" = "0" ]; then
  echo "Nada a migrar — provavelmente já foi executado antes."
  exit 0
fi

# Detecta variante de sed (BSD/macOS vs GNU/Linux)
if sed --version >/dev/null 2>&1; then
  SED_INPLACE=(-i)  # GNU
else
  SED_INPLACE=(-i '')  # BSD/macOS
fi

# Aplica as substituições
echo "Aplicando renames..."

# accent* → click*
# Ordem importa: dos mais específicos pros mais genéricos, pra não duplicar
echo "$FILES" | xargs -I {} sed "${SED_INPLACE[@]}" \
  -e 's/\bcolors\.accentLight\b/colors.clickLight/g' \
  -e 's/\bcolors\.accentDark\b/colors.clickDark/g' \
  -e 's/\bcolors\.accentGlow\b/colors.clickSoft/g' \
  -e 's/\bcolors\.accentSoft\b/colors.clickSoft/g' \
  -e 's/\bcolors\.accentMed\b/colors.clickRing/g' \
  -e 's/\bcolors\.accent\b/colors.click/g' \
  -e 's/\bcolors\.goldSoft\b/colors.warningSoft/g' \
  -e 's/\bcolors\.gold\b/colors.warning/g' \
  -e 's/\bcolors\.limeSoft\b/colors.successSoft/g' \
  -e 's/\bcolors\.lime\b/colors.success/g' \
  -e 's/\bcolors\.petrolDark\b/colors.textSec/g' \
  -e 's/\bcolors\.petrolGlow\b/colors.textSec/g' \
  -e 's/\bcolors\.roseSoft\b/colors.dangerSoft/g' \
  {}

echo -e "${GREEN}✓${NC} Renames aplicados."
echo ""

# Verifica resultado
REMAINING_MECH=$(grep -r -E "colors\.(accent|accentLight|accentDark|accentGlow|accentSoft|accentMed|gold|goldSoft|lime|limeSoft|petrolDark|petrolGlow|roseSoft)\b" \
  --include='*.tsx' --include='*.ts' . \
  --exclude-dir=node_modules --exclude-dir=docs 2>/dev/null | wc -l || echo 0)

if [ "$REMAINING_MECH" -gt 0 ]; then
  echo -e "${YELLOW}⚠${NC}  Ainda restam $REMAINING_MECH ocorrências mecânicas — conferir manualmente."
else
  echo -e "${GREEN}✓${NC} Zero ocorrências de tokens mecânicos legacy."
fi

# Reporta o que resta (ambíguo, precisa de revisão manual)
REMAINING_AMBIG=$(grep -r -E "colors\.(purple|purpleSoft|petrol|petrolSoft|rose|sky|skySoft)\b" \
  --include='*.tsx' --include='*.ts' . \
  --exclude-dir=node_modules --exclude-dir=docs 2>/dev/null | wc -l || echo 0)

echo ""
echo "═══════════════════════════════════════════════"
echo "  Próximos passos — Onda 2 (revisão manual)"
echo "═══════════════════════════════════════════════"
echo ""
echo "  Ainda restam $REMAINING_AMBIG ocorrências de tokens ambíguos:"
echo "    purple / petrol / rose / sky (e variants Soft)"
echo ""
echo "  Siga o guia em:"
echo "    docs/elite-migration/migration-audit.md  §Onda 2"
echo ""
echo "  Sugestão de busca por arquivo pra começar:"
echo "    grep -rn -E 'colors\\.(purple|petrol|rose|sky)\\b' \\"
echo "      --include='*.tsx' --include='*.ts' . \\"
echo "      --exclude-dir=node_modules --exclude-dir=docs"
echo ""
echo "  Depois de tudo migrado:"
echo "    npx tsc --noEmit    # deve passar"
echo "    smoke test no device"
echo ""
