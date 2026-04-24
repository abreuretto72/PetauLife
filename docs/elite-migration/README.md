# Elite Migration — pasta de rascunhos

Esta pasta contém **propostas** de arquivos + scripts + auditorias pra executar a migração da paleta antiga (laranja + petróleo, Sora) pra Elite (Ametista & Jade, Inter + Playfair).

**Nada aqui é executado pelo app.** Os arquivos `.proposal` e `.sh` ficam em `docs/` justamente pra serem revisáveis sem efeito colateral. Quando (e só quando) o Belisario aprovar, eles são promovidos pros paths reais do app.

---

## Conteúdo

| Arquivo | Propósito |
|---------|-----------|
| `colors.ts.proposal` | Novo `constants/colors.ts` — tokens Elite + aliases legacy |
| `fonts.ts.proposal` | Novo `constants/fonts.ts` — Inter/Playfair/JetBrains Mono |
| `AuExpertLogo.tsx.proposal` | Novo `components/AuExpertLogo.tsx` — wordmark tipográfico (não PNG) |
| `migration-audit.md` | Inventário dos 1.735 call sites + regras de renomeação |
| `migrate.sh` | Script Onda 1 — renames mecânicos automatizados |
| `README.md` | Este arquivo |

---

## Como revisar

Ler cada `.proposal` e bater com a fonte canônica em `docs/elite-tokens.md`. Três coisas pra conferir:

1. **Paleta em `colors.ts.proposal`**: os hex estão corretos? Tokens legacy (`accent`, `purple`, etc) apontam pros valores Elite pra não quebrar build antes da Onda 2?
2. **Fontes em `fonts.ts.proposal`**: os nomes `Inter_400Regular`, `PlayfairDisplay_500Medium_Italic` batem com o que `@expo-google-fonts/*` expõe? (Os nomes seguem o padrão oficial do pacote.)
3. **Logo em `AuExpertLogo.tsx.proposal`**: a assinatura pública do componente (props `size`, `showTagline`) é compatível com os ~20 call sites atuais? Ver `grep -r 'AuExpertLogo' --include='*.tsx' .`

---

## Como executar (quando aprovado)

### Passo 0 — Commit de backup

```bash
git add .
git commit -m "checkpoint: antes da migração Elite"
```

### Passo 1 — Promover os proposals

```bash
cp docs/elite-migration/colors.ts.proposal        constants/colors.ts
cp docs/elite-migration/fonts.ts.proposal         constants/fonts.ts
cp docs/elite-migration/AuExpertLogo.tsx.proposal components/AuExpertLogo.tsx
```

### Passo 2 — Instalar as fontes

```bash
npm install @expo-google-fonts/inter @expo-google-fonts/playfair-display @expo-google-fonts/jetbrains-mono expo-font
```

### Passo 3 — Carregar fontes em `app/_layout.tsx`

Adicionar no topo:

```tsx
import { useFonts } from 'expo-font';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
} from '@expo-google-fonts/inter';
import {
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
} from '@expo-google-fonts/playfair-display';
import {
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
} from '@expo-google-fonts/jetbrains-mono';
```

E dentro do `_layout`:

```tsx
const [fontsLoaded] = useFonts({
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  PlayfairDisplay_500Medium,
  PlayfairDisplay_500Medium_Italic,
  JetBrainsMono_400Regular,
  JetBrainsMono_500Medium,
});

if (!fontsLoaded) return null; // ou splash screen
```

### Passo 4 — Rodar a Onda 1 (renames mecânicos)

```bash
bash docs/elite-migration/migrate.sh
```

Aplica ~975 renames automaticamente em ~5 segundos. Depois:

```bash
npx tsc --noEmit
```

Deve passar sem erros (os aliases legacy seguram o que restar da Onda 2).

### Passo 5 — Onda 2 (revisão manual)

Abrir `migration-audit.md §Onda 2` e ir arquivo por arquivo dos que ainda usam `purple`, `petrol`, `rose`, `sky`. Rodar:

```bash
grep -rn -E 'colors\.(purple|petrol|rose|sky)\b' \
  --include='*.tsx' --include='*.ts' . \
  --exclude-dir=node_modules --exclude-dir=docs
```

Pra cada ocorrência, decidir conforme as regras do audit (IA → `ai`, clicável → `click`, decorativo → `textSec`, etc).

### Passo 6 — Onda 3 (verificação final)

```bash
# Confirma que nenhum legacy restou
grep -rn -E 'colors\.(accent|petrol|purple|gold|rose|sky|lime)' \
  --include='*.tsx' --include='*.ts' . \
  --exclude-dir=node_modules --exclude-dir=docs

# Confirma que tudo compila
npx tsc --noEmit

# Remove aliases legacy do colors.ts (manualmente)
# — agora que nada usa mais, dá pra apagar as linhas @deprecated
```

### Passo 7 — Smoke test

Abrir o app no device e navegar:
- Login / cadastro
- Hub
- Adicionar pet
- Perfil do pet (aba Geral, IA, Diário, Agenda, Saúde, Prontuário)
- Nova entrada de diário (texto, foto, voz)
- Análise de foto
- Configurações
- Profissionais / Aldeia (se ativo)

Conferir em cada tela: paleta aplicada, logo wordmark no header, tipografia Inter/Playfair carregada, nenhum item visualmente "cor antiga esquecida".

### Passo 8 — Commit final

```bash
git add -A
git commit -m "Elite: migração completa paleta Ametista & Jade + Inter + Playfair"
```

---

## Rollback

Se algo sair do controle:

```bash
git reset --hard HEAD~1   # volta pro commit antes da migração
```

Como a única mudança é cosmética (cores + fontes + logo component + renames), o rollback é seguro e completo.

---

## Estimativa total

| Passo | Tempo |
|-------|-------|
| 0. Commit backup | 1 min |
| 1. Promover proposals | 1 min |
| 2. npm install | 1-2 min |
| 3. Carregar fontes em `_layout.tsx` | 5 min |
| 4. Onda 1 (script) | 5 min |
| 5. Onda 2 (revisão manual) | **3-4h (gargalo)** |
| 6. Onda 3 (verificação) | 30 min |
| 7. Smoke test | 1h |
| 8. Commit final | 2 min |
| **Total** | **~5-7h** |
