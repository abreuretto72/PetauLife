# PROMPT PARA CLAUDE CODE — MÓDULO DE NUTRIÇÃO auExpert

## CONTEXTO DO PROJETO
App: auExpert — diário inteligente de pets
Stack: React Native / Expo / TypeScript / Supabase / Claude API
Supabase project: peqpkzituzpwukzusgcq

---

## ⚠️ REGRA ABSOLUTA — LER ANTES DE QUALQUER COISA

Os arquivos abaixo estão CONGELADOS. NÃO ALTERAR sob nenhuma circunstância:
- hooks/useDiaryEntry.ts
- hooks/useDiary.ts
- app/(app)/pet/[id]/diary/new.tsx
- components/diary/TimelineCards.tsx
- components/diary/timelineTypes.ts
- supabase/functions/classify-diary-entry/
- supabase/functions/analyze-pet-photo/
- DB: diary_entries, pets, users, vaccines, exams (ZERO ALTER TABLE)

O módulo de nutrição é uma CAMADA NOVA que lê dados existentes mas NUNCA os modifica.

---

## OBJETIVO
Implementar o módulo completo de Nutrição do auExpert com 12 telas:

**Bloco 1 — Nutrição base:**
- Tela 1: Visão geral com avaliação IA e alertas
- Tela 2: Ração atual com detalhes e porção por peso
- Tela 3: Restrições alimentares (alergias + ASPCA)
- Tela 4: Histórico de rações com linha do tempo
- Tela 5: Trocar ração (OCR da embalagem ou manual)
- Tela 6: Dicas IA personalizadas por raça/fase/peso

**Bloco 2 — Receitas e cardápio:**
- Tela 7: Escolher modalidade (só ração / ração+natural / só natural)
- Tela 8: Rotina só ração (horários + petiscos permitidos)
- Tela 9: Ração + natural (proporções + complementos)
- Tela 10: Só natural/BARF (proporções + ingredientes permitidos)
- Tela 11: Cardápio semanal gerado por IA
- Tela 12: Detalhe de receita (ingredientes + modo de preparo + conservação)

---

## PASSO 1 — BANCO DE DADOS

Executar no Supabase Dashboard SQL Editor:

```sql
-- 1. Tabela principal de nutrição
CREATE TABLE IF NOT EXISTS nutrition_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  modalidade VARCHAR(20) CHECK (modalidade IN ('so-racao', 'racao-natural', 'so-natural')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS nutrition_records_pet_idx ON nutrition_records(pet_id);
ALTER TABLE nutrition_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY nutrition_select ON nutrition_records FOR SELECT USING (is_pet_member(pet_id) OR EXISTS (SELECT 1 FROM pets WHERE id = pet_id AND user_id = auth.uid()));
CREATE POLICY nutrition_insert ON nutrition_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY nutrition_update ON nutrition_records FOR UPDATE USING (auth.uid() = user_id);

-- 2. Tabela de rações registradas
CREATE TABLE IF NOT EXISTS nutrition_food_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.users(id),
  product_name TEXT NOT NULL,
  brand TEXT,
  life_stage VARCHAR(10) CHECK (life_stage IN ('filhote', 'adulto', 'senior')),
  daily_portion_g INTEGER,
  frequency_per_day INTEGER DEFAULT 2,
  notes TEXT,
  ocr_data JSONB,
  started_at DATE NOT NULL DEFAULT CURRENT_DATE,
  ended_at DATE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE nutrition_food_records ENABLE ROW LEVEL SECURITY;
CREATE POLICY food_select ON nutrition_food_records FOR SELECT USING (is_pet_member(pet_id) OR EXISTS (SELECT 1 FROM pets WHERE id = pet_id AND user_id = auth.uid()));
CREATE POLICY food_insert ON nutrition_food_records FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY food_update ON nutrition_food_records FOR UPDATE USING (auth.uid() = user_id);

-- 3. Cardápio cache
CREATE TABLE IF NOT EXISTS nutrition_cardapio_cache (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  modalidade VARCHAR(20),
  data JSONB NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX IF NOT EXISTS cardapio_pet_idx ON nutrition_cardapio_cache(pet_id);
ALTER TABLE nutrition_cardapio_cache ENABLE ROW LEVEL SECURITY;
CREATE POLICY cardapio_select ON nutrition_cardapio_cache FOR SELECT USING (true);
CREATE POLICY cardapio_insert ON nutrition_cardapio_cache FOR INSERT WITH CHECK (true);
CREATE POLICY cardapio_update ON nutrition_cardapio_cache FOR UPDATE USING (true);

NOTIFY pgrst, 'reload schema';
```

---

## PASSO 2 — EDGE FUNCTIONS (novas — não modifica nenhuma existente)

### 2.1 get-nutricao
Criar: supabase/functions/get-nutricao/index.ts

Recebe: { pet_id }
Faz:
1. Busca pet (raça, peso, data nascimento)
2. Busca nutrition_records (modalidade)
3. Busca nutrition_food_records (histórico de rações) ORDER BY started_at DESC
4. Busca allergies WHERE pet_id (restrições conhecidas)
5. Lê diary_entries recentes (somente leitura) para detectar alimentos mencionados
6. Calcula life_stage baseado na idade (filhote < 12m, adulto, senior > 7 anos)
7. Verifica se a ração atual é adequada para a fase de vida
8. Chama Claude API para gerar ai_evaluation em linguagem de tutor
9. Retorna JSON estruturado conforme interface Nutricao em useNutricao.ts

Prompt para Claude gerar ai_evaluation:
```
Você é um nutricionista veterinário do auExpert.
Analise os dados de nutrição do pet e gere uma avaliação em 2-3 frases.
REGRAS:
- Linguagem SIMPLES para tutor leigo
- SEM termos técnicos (não mencionar proteína bruta, mg/kg, etc.)
- Focar no que o tutor pode fazer agora
- Mencionar o nome do pet
- Se a ração é inadequada para a fase, dizer claramente
- Idioma: pt-BR
```

Deploy: npx supabase functions deploy get-nutricao --no-verify-jwt

### 2.2 generate-cardapio
Criar: supabase/functions/generate-cardapio/index.ts

Recebe: { pet_id, language = 'pt-BR' }
Faz:
1. Busca dados do pet e modalidade
2. Busca restrições alimentares (allergies)
3. Gera cardápio semanal via Claude API com:
   - 7 dias com títulos e descrições
   - Ingredientes por dia (CRUZANDO com restrições)
   - Receitas simples para modalidade ração+natural e só-natural
   - Porções ajustadas pelo peso atual
4. Salva em nutrition_cardapio_cache
5. Retorna cardápio

Lista de ingredientes PROIBIDOS (hardcoded — sempre bloquear):
```
chocolate, cacau, xilitol, uva, passa, cebola, alho, cebolinha,
alho-poró, abacate, macadâmia, nozes, álcool, cafeína, sal em excesso,
pimenta, açúcar artificial, ossode frango cozido
```

Deploy: npx supabase functions deploy generate-cardapio --no-verify-jwt

---

## PASSO 3 — HOOK

Criar: hooks/useNutricao.ts
Usar o arquivo JSX anexo (useNutricao.ts) como base.
Adaptar imports para o projeto (supabase, useAuth, etc.).

---

## PASSO 4 — TELAS

### Estrutura de rotas (NOVAS — não modificar rotas existentes):
```
app/(app)/pet/[id]/nutrition.tsx           ← Tela 1: Visão geral (substituir conteúdo existente)
app/(app)/pet/[id]/nutrition/racao.tsx     ← Tela 2: Ração atual
app/(app)/pet/[id]/nutrition/restricoes.tsx ← Tela 3: Restrições
app/(app)/pet/[id]/nutrition/historico.tsx ← Tela 4: Histórico
app/(app)/pet/[id]/nutrition/trocar.tsx    ← Tela 5: Trocar ração
app/(app)/pet/[id]/nutrition/dicas.tsx     ← Tela 6: Dicas IA
app/(app)/pet/[id]/nutrition/modalidade.tsx ← Tela 7: Escolher modalidade
app/(app)/pet/[id]/nutrition/so-racao.tsx  ← Tela 8: Só ração
app/(app)/pet/[id]/nutrition/racao-natural.tsx ← Tela 9: Ração + natural
app/(app)/pet/[id]/nutrition/so-natural.tsx ← Tela 10: Só natural
app/(app)/pet/[id]/nutrition/cardapio.tsx  ← Tela 11: Cardápio semanal
app/(app)/pet/[id]/nutrition/receita.tsx   ← Tela 12: Detalhe receita
```

### Tela 1 — nutrition.tsx (Visão geral)
Usar NutricaoScreen.jsx como referência.
ATENÇÃO: O arquivo nutrition.tsx já existe. Substituir o conteúdo APENAS
se a tela atual não tiver as seções de avaliação IA, alertas, peso e restrições.

### Tela 2 — racao.tsx (Ração atual)
Mostrar:
- Nome da ração + marca + fase de vida
- Alerta se fase inadequada para a idade do pet
- Porção diária calculada pelo peso
- Frequência de refeições
- Histórico de uso (desde quando)
- Suplementos em uso
- Aviso de transição gradual ao trocar
- Botão "Trocar ração"

### Tela 3 — restricoes.tsx (Restrições)
Mostrar:
- Restrições conhecidas do pet (vêm de allergies + nutrition_records)
- Para cada restrição: nome, severidade, descrição da reação
- Lista ASPCA hardcoded de perigosos para todos os cães/gatos
- Botão "Adicionar restrição"
- Formulário de nova restrição (nome + severidade + descrição)

### Tela 4 — historico.tsx (Histórico de rações)
Mostrar:
- Lista cronológica de todas as rações
- Para cada uma: nome, marca, fase, período de uso, motivo da troca
- Linha do tempo visual com barras coloridas
- Botão para adicionar ração antiga manualmente

### Tela 5 — trocar.tsx (Trocar ração)
Mostrar:
- Botão de scanner OCR (usa DocumentScanner existente — NÃO modificar)
- Formulário manual: nome, marca, fase de vida (filhote/adulto/senior), porção diária
- Toggle "Fazer transição gradual" (5 dias)
- Botão salvar → cria registro em nutrition_food_records + encerra o anterior
- Ao usar OCR: o classify-diary-entry (congelado) já extrai dados de embalagens
  Usar os dados extraídos do ocr_data para preencher o formulário automaticamente

### Tela 6 — dicas.tsx (Dicas IA)
Mostrar:
- Dica principal personalizada para raça + fase + peso
- 2-3 rações recomendadas para o porte e fase do pet
- Quando trocar para a próxima fase (filhote → adulto → senior)
- Lembrete sobre água fresca

### Tela 7 — modalidade.tsx (Escolher modalidade)
Usar ModalidadeScreen.jsx como referência.
3 opções: só ração / ração+natural / só natural
Ao selecionar, salvar em nutrition_records.modalidade e navegar para a tela correspondente.

### Tela 8 — so-racao.tsx (Só ração)
Mostrar:
- Rotina de alimentação AM/PM com horários e porções
- Lista de petiscos permitidos (cruzar com restrições do pet)
- Petiscos com restrição marcados como "evitar"
- Lembrete de água

### Tela 9 — racao-natural.tsx (Ração + natural)
Mostrar:
- Barra de proporção (default: 70% ração + 30% natural)
- Slider para ajustar a proporção
- Lista de complementos naturais permitidos por categoria
- Ingredientes da lista ASPCA de proibidos sempre marcados
- Ingredientes com alergia do pet sempre marcados
- Sugestão do dia baseada no cardápio semanal

### Tela 10 — so-natural.tsx (Só natural)
Mostrar:
- Aviso de acompanhamento veterinário
- Gráfico de proporções: proteína/vegetal/carboidrato
- Listas por categoria com ingredientes permitidos e proibidos
- Cálculo de quantidade total diária pelo peso
- Link para gerar cardápio BARF

### Tela 11 — cardapio.tsx (Cardápio semanal)
Usar CardapioSemanalScreen.jsx como referência.
- Dia atual em destaque
- 7 dias com ingredientes e mini-receitas
- Ingredientes proibidos/alergênicos marcados em vermelho
- Botão de regenerar (chama generate-cardapio novamente)
- Toque no dia → navega para receita detalhada

### Tela 12 — receita.tsx (Detalhe da receita)
Usar DetalheReceitaScreen.jsx como referência.
- Tempo de preparo, rendimento, porção por unidade
- Check de segurança (sem ingredientes proibidos para o pet)
- Lista de ingredientes com quantidades em gramas
- Modo de preparo passo a passo
- Informações de conservação (geladeira e freezer)
- Dica IA sobre a receita

---

## PASSO 5 — INTEGRAÇÃO COM OCR EXISTENTE (Tela 5)

O OCR de embalagens já funciona no diary/new.tsx (CONGELADO).
Para a tela de trocar ração, usar uma abordagem diferente:

```typescript
// Em trocar.tsx — usar DocumentScanner existente como componente
// NÃO modificar DocumentScanner.tsx
import DocumentScanner from '../../../../../components/diary/DocumentScanner';

// O scanner retorna base64 da foto
// Chamar classify-diary-entry (congelado) passando inputType: 'ocr_scan'
// Os dados de food extraídos vêm em classifications[0].extracted_data
// Preencher o formulário automaticamente com os dados extraídos
```

---

## PASSO 6 — NAVEGAÇÃO

No arquivo: app/(app)/pet/[id]/_layout.tsx ou _layout da nutrition
ADICIONAR rotas de nutrition/* sem alterar as existentes:
```typescript
// Adicionar apenas as rotas novas de nutrition
'nutrition/racao', 'nutrition/restricoes', 'nutrition/historico',
'nutrition/trocar', 'nutrition/dicas', 'nutrition/modalidade',
'nutrition/so-racao', 'nutrition/racao-natural', 'nutrition/so-natural',
'nutrition/cardapio', 'nutrition/receita'
```

---

## PASSO 7 — VERIFICAÇÃO FINAL

1. Abrir Painel da Mana → tocar em "Nutrição"
2. Verificar se avaliação IA aparece com alerta de ração inadequada (filhote de 2 meses com ração adulta)
3. Verificar se restrições mostram queijo e uva
4. Tocar em "Receitas e cardápio" → escolher "Ração + natural"
5. Verificar se cardápio semanal é gerado sem ingredientes proibidos
6. Tocar em um dia → ver receita detalhada
7. Confirmar que diary/new.tsx continua funcionando normalmente

---

## ARQUIVOS JSX ANEXOS

- NutricaoScreen.jsx — Tela 1: visão geral
- ModalidadeScreen.jsx — Tela 7: escolher modalidade
- CardapioSemanalScreen.jsx — Tela 11: cardápio semanal
- DetalheReceitaScreen.jsx — Tela 12: detalhe da receita
- useNutricao.ts — hook com tipos e lógica

---

## DEPENDÊNCIAS

Nenhuma nova dependência necessária.
O DocumentScanner.tsx existente já suporta OCR.
O classify-diary-entry já extrai dados de embalagens de ração.

---

## RESUMO DO QUE SERÁ CRIADO

```
NOVOS:
  supabase/functions/get-nutricao/index.ts
  supabase/functions/generate-cardapio/index.ts
  hooks/useNutricao.ts
  app/(app)/pet/[id]/nutrition/racao.tsx
  app/(app)/pet/[id]/nutrition/restricoes.tsx
  app/(app)/pet/[id]/nutrition/historico.tsx
  app/(app)/pet/[id]/nutrition/trocar.tsx
  app/(app)/pet/[id]/nutrition/dicas.tsx
  app/(app)/pet/[id]/nutrition/modalidade.tsx
  app/(app)/pet/[id]/nutrition/so-racao.tsx
  app/(app)/pet/[id]/nutrition/racao-natural.tsx
  app/(app)/pet/[id]/nutrition/so-natural.tsx
  app/(app)/pet/[id]/nutrition/cardapio.tsx
  app/(app)/pet/[id]/nutrition/receita.tsx

MODIFICADO (mínimo):
  app/(app)/pet/[id]/nutrition.tsx — substituir conteúdo mantendo a rota
  app/(app)/pet/[id]/_layout.tsx — apenas adicionar novas rotas

DB (apenas adições):
  CREATE TABLE nutrition_records
  CREATE TABLE nutrition_food_records
  CREATE TABLE nutrition_cardapio_cache
```
