# Gamificação — inventário para depreciação Elite

> **Status:** inventário somente, 2026-04-23. Nenhum código removido ainda.
> **Origem:** Pilar 3 do plano de posicionamento Elite (`docs/elite/posicionamento/2026-04-22_plano_elite_auexpert.md`).
> **Regra:** "O código de XP/badges se ainda não foi escrito, não escreve. Se já tem tabela `pet_achievements` na migration, mantém no banco (soft-remove na UI) e documenta como deprecado."

---

## Escopo da remoção (para sessão futura)

A gamificação infantil — XP, níveis, badges, Proof of Love, Pet-Credits, Rankings — **não combina com posicionamento Elite**. Esta spec mapeia onde ela mora hoje pra que a próxima sprint possa depreciar com cirurgia.

Princípio: **banco fica intacto** (migration já aplicada, soft-remove não derrubou), **UI some**, **lógica fica em modo no-op**.

---

## 1. Código React Native (mais pesado)

| Arquivo | Estado no Elite |
|---|---|
| `lib/achievements.ts` (520 linhas — XP_THRESHOLDS, ACHIEVEMENT_CATALOG com 41 badges, `xpForLevel()`, `checkAndAwardAchievements()`, `getPetStats()`, `computeStreak()`) | **Marcar `@deprecated` no topo.** Manter funções expostas (pra não quebrar callers existentes) mas `checkAndAwardAchievements` vira no-op (retorna array vazio sem escrever). |
| `components/lenses/AchievementsLensContent.tsx` (XPProgressBar, BadgeTile, RARITY_COLOR map) | **Ocultar do Diário.** Remover da lista de lenses ativas. Se tutor ainda tem o módulo aberto, exibe mensagem "Em breve: novo formato de marcos". |
| `app/(app)/pet/[id]/achievements.tsx` (tela dedicada de conquistas) | **Remover da navegação.** Se tutor abrir via deep link antigo, redirecionar pra retrospectiva anual (Pilar 6). |
| `hooks/useDiaryEntry.ts:280-282` (chama `checkAndAwardAchievements` após publicar entrada) | **Remover a chamada.** Ou manter, mas `checkAndAward` já será no-op. |

---

## 2. Banco (preservar, não migrar pra baixo)

| Elemento | Ação |
|---|---|
| `pets.xp_total INT DEFAULT 0` (coluna) | Mantém no schema. Ninguém grava mais. Ninguém lê. |
| `pets.level INT DEFAULT 1` (coluna) | Idem. |
| `achievements` (tabela — pet_id, achievement_key, xp_reward, rarity, icon_name, UNIQUE(pet_id, achievement_key)) | Mantém. Inserts param. Selects param. Se futuro Retrospectiva quiser reusar como fonte de eventos-chave, serve de base. |
| Migration `019_achievements.sql` | Não reverter. Comentar no topo: `-- DEPRECATED 2026-04-23: gamificação saiu do escopo Elite. Tabela preservada pra re-uso em retrospectiva anual.` |

**Nenhuma migration nova.** Remoção de código sem migration de banco é a aposta mais segura: se decidirmos voltar com gamificação em nova forma, os dados históricos estão lá.

---

## 3. i18n (strings pequenas, remoção simples)

Chaves pra marcar como descontinuadas (podem ficar no JSON por compatibilidade com versões antigas; não são mais referenciadas pela UI):

| Chave | Valor atual |
|---|---|
| `pet.achievements` | "Conquistas" |
| `pet.achievementsSub` | "Emblemas e XP" |
| `achievements.statXp` | "XP" |
| `achievements.level` | "Nível {{level}}" |
| `achievements.xpProgress` | "{{xp}}/{{next}} XP" |
| `achievements.titles.level1..level10` | "Tutor Iniciante" → "Tutor Herói" (10 títulos) |
| `achievements.proofOfLove` / `proofTier.*` | "Bronze", "Prata", "Ouro", "Diamante" |
| `achievements.catalog.*` | 41 chaves de badge (título + descrição) |
| Badge UI labels: `badgeOk`, `badgeOverdue`, `badgeLevel`, `badgeSeeAll` | Auxiliares |

**Total:** ~85-95 chaves afetadas em `pt-BR.json` e `en-US.json` respectivamente.

---

## 4. Docs

| Arquivo | Status |
|---|---|
| `docs/plano-elite.md` §6 | Já diz "Gamificação pesada — fora do escopo Elite". OK. |
| `docs/elite/posicionamento/2026-04-22_plano_elite_auexpert.md` §Pilar 3 | Especificação do reframe. OK. |
| `docs/prototypes/conquistas_pet.jsx` | Protótipo antigo. Marcar como DEPRECATED no topo. |

---

## 5. Aldeia original (já depreciada)

A Aldeia original tinha um sistema paralelo de gamificação comunitária:

- `aldeia_pet_credits_log` — histórico de créditos
- `aldeia_rankings` — rankings mensais (5 tipos)
- `Proof of Love` (none → bronze → silver → gold → diamond)
- `Admirar` (reconhecimento de cuidado)

Tudo isto já está em `docs/aldeia-spec.md` (agora depreciado — ver `docs/circulo-spec.md`). Nenhuma dessas tabelas foi aplicada ao banco de produção. Segue não-implementado e fora de escopo.

---

## 6. Substituição elegante (não é "remoção" seca — é migração de conceito)

O plano Elite já indica a substituição, mas vale repetir aqui:

- XP/níveis/badges → **retrospectiva anual** (Pilar 6) — uma peça editorial/narrativa, não pontuação.
- Proof of Love → **narrativa literária no diário** — o cuidado aparece na narração, não em medalha.
- Pet-Credits → **zero**. Não tem substituto. Elite não gamifica reciprocidade.
- Rankings → **zero**. Elite não se compara.
- "Hábito consistente" (plano de posicionamento §Pilar 3): um selo discreto quando tutor registra 20 dias seguidos no diário — texto simples, cor única, sem competição. **Isto sim pode vir.**

---

## 7. Ordem de execução sugerida (quando for o momento)

1. Adicionar `@deprecated` nos headers de `lib/achievements.ts` e `AchievementsLensContent.tsx`.
2. Remover a chamada de `checkAndAwardAchievements` do `hooks/useDiaryEntry.ts`.
3. Remover a lens Achievements do Diário.
4. Remover a tela `/pet/[id]/achievements` da navegação (redirecionar deep links pra retrospectiva).
5. Marcar chaves i18n correspondentes como `@deprecated` em comentário interno do JSON (se suportar).
6. Deixar banco intacto. Documentar a decisão no próximo CHANGELOG.

Estimativa total: **1 sessão focada de 2-3 horas**. Baixíssimo risco — sem nenhuma dependência externa crítica.
