# Diário do Pet — Especificação Técnica Completa

## 1. O QUE É O DIÁRIO DO PET

O Diário é o coração do PetauLife+. É uma timeline cronológica da vida do pet
onde cada momento é registrado e narrado pela IA na voz do animal.

**Não é um blog.** Não é um feed de fotos. É um livro de vida onde o pet "conta"
o que viveu, com memória acumulativa (RAG) que torna cada narração mais rica
ao longo do tempo.

### Tipos de entrada no diário:

| Tipo | Quem cria | Exemplo |
|------|-----------|---------|
| manual | Tutor escreve/fala | "Levei o Rex no parque" |
| photo_analysis | IA ao analisar foto | "Foto mostra pet saudável no jardim" |
| vaccine | Automático ao cadastrar vacina | "Rex tomou V10 hoje" |
| allergy | Automático ao registrar alergia | "Descobrimos que Rex tem alergia a frango" |
| ai_insight | IA semanal | "Rex está 15% mais ativo esta semana" |
| milestone | Automático por conquista | "Rex completou 100 passeios!" |
| mood_change | Automático por mudança brusca | "Humor do Rex mudou de Feliz para Ansioso" |

### O que NÃO é entrada de diário:
- Notificações push (tabela separada)
- Mensagens entre tutores (pós-MVP)
- Comentários de cuidadores (pós-MVP)

---

## 2. FLUXO DO TUTOR (Passo a Passo)

### 2.1 Criar entrada manual

```
Tutor abre Dashboard do Pet
    → Clica no botão "Diário" ou botão flutuante "+"
    → Tela "Nova Entrada"
    → Escolhe como contar:
        → FALAR (mic) → STT transcreve → texto no campo
        → FOTO → IA analisa → texto gerado automaticamente
        → DIGITAR → tutor escreve no campo
    → Seleciona humor (ou IA sugere)
    → Pode anexar até 5 fotos
    → Clica "Gerar Narração"
    → IA processa (2-4s):
        1. Busca RAG (top 5 memórias relevantes)
        2. Monta prompt com contexto
        3. Claude API gera narração
        4. Sugere tags
        5. Calcula mood_score
    → Preview: texto do tutor + narração IA
    → Tutor pode:
        → Publicar (salva tudo)
        → Refazer narração (IA gera outra versão)
        → Editar texto dele
        → Adicionar/remover fotos
        → Mudar humor
    → Ao publicar:
        1. INSERT diary_entries
        2. INSERT mood_logs
        3. UPDATE pets.current_mood
        4. UPDATE pets.total_diary_entries (+1)
        5. INSERT media_files (se tem fotos)
        6. Edge Function: generate-embedding
        7. INSERT pet_embeddings
        8. INSERT rag_conversations (auditoria)
```

### 2.2 Editar entrada existente

```
Tutor abre timeline do diário
    → Clica numa entrada
    → Clica no ícone de edição (lápis laranja)
    → Pode editar:
        → Texto do tutor (tutor_input)
        → Humor (mood)
        → Tags
        → Fotos (adicionar/remover)
        → Marcar/desmarcar como especial
    → NÃO pode editar:
        → Narração IA (ela é regenerada ao salvar)
        → Data da entrada (entry_date)
    → Ao salvar:
        1. UPDATE diary_entries
        2. Se mudou humor: INSERT novo mood_logs
        3. Se mudou texto: regenerar narração IA
        4. Se mudou texto: atualizar embedding no RAG
        5. UPDATE pets.current_mood (se mudou humor)
```

### 2.3 Excluir entrada

```
Tutor clica no ícone lixeira (vermelho)
    → Confirmação: "Tem certeza? A memória será mantida no RAG."
    → Soft delete: UPDATE diary_entries SET is_deleted = true
    → O embedding NÃO é excluído (memória permanece)
    → A entrada some da timeline mas o RAG ainda lembra
```

### 2.4 Ver timeline

```
Tutor abre o diário
    → Vê lista cronológica (mais recente primeiro)
    → Pode filtrar por:
        → Tipo (manual, saúde, IA, marcos, cápsulas)
        → Humor (feliz, calmo, triste, etc.)
        → Período (semana, mês, 3 meses, tudo)
        → Favoritos (is_special = true)
    → Cada entrada mostra:
        → Data e hora
        → Tipo (badge colorido)
        → Texto do tutor (se manual)
        → Narração IA (fonte Caveat)
        → Humor (dot colorido + label)
        → Tags
        → Fotos (thumbnails)
        → Marcador de especial (estrela dourada)
    → Scroll infinito com paginação (20 por página)
```

---

## 3. TABELAS DO BANCO DE DADOS

### 3.1 diary_entries (tabela principal)

```sql
CREATE TABLE diary_entries (
    -- Identificação
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),

    -- Input do tutor
    tutor_input     TEXT NOT NULL,           -- Texto que o tutor escreveu/falou (3-2000 chars)
    input_method    VARCHAR(10) NOT NULL     -- 'voice' | 'photo' | 'text'
                    CHECK (input_method IN ('voice', 'photo', 'text')),

    -- Narração IA
    ai_narration    TEXT,                    -- Narração gerada pela IA na voz do pet
    ai_narration_lang VARCHAR(5),            -- Idioma da narração: 'pt-BR' | 'en-US'

    -- Humor
    mood            VARCHAR(20) NOT NULL     -- 'ecstatic'|'happy'|'calm'|'tired'|'anxious'|'sad'|'playful'|'sick'
                    CHECK (mood IN ('ecstatic','happy','calm','tired','anxious','sad','playful','sick')),
    mood_score      INTEGER,                 -- 0-100, inferido pela IA do texto
    mood_source     VARCHAR(10) DEFAULT 'manual'  -- 'manual' | 'ai_suggested'
                    CHECK (mood_source IN ('manual', 'ai_suggested')),

    -- Tipo da entrada
    entry_type      VARCHAR(20) NOT NULL DEFAULT 'manual'
                    CHECK (entry_type IN ('manual','photo_analysis','vaccine','allergy','ai_insight','milestone','mood_change')),

    -- Tags e classificação
    tags            JSONB DEFAULT '[]',      -- ['parque','brincadeira','chuva'] — IA sugere, tutor edita
    is_special      BOOLEAN DEFAULT false,   -- Momento especial destacado na timeline

    -- Fotos anexadas
    photo_urls      JSONB DEFAULT '[]',      -- [{url, thumbnail_url, media_file_id}] — max 5

    -- Vínculo com análise de foto (se veio de análise)
    linked_photo_analysis_id UUID REFERENCES photo_analyses(id),

    -- Data
    entry_date      DATE NOT NULL DEFAULT CURRENT_DATE,

    -- Controle
    is_deleted      BOOLEAN DEFAULT false,   -- Soft delete
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices
CREATE INDEX idx_diary_entries_pet_id ON diary_entries(pet_id);
CREATE INDEX idx_diary_entries_entry_date ON diary_entries(entry_date DESC);
CREATE INDEX idx_diary_entries_pet_date ON diary_entries(pet_id, entry_date DESC);
CREATE INDEX idx_diary_entries_mood ON diary_entries(pet_id, mood);
CREATE INDEX idx_diary_entries_type ON diary_entries(pet_id, entry_type);
CREATE INDEX idx_diary_entries_special ON diary_entries(pet_id, is_special) WHERE is_special = true;
CREATE INDEX idx_diary_entries_not_deleted ON diary_entries(pet_id, is_deleted) WHERE is_deleted = false;
```

### 3.2 mood_logs (registro de humor)

```sql
CREATE TABLE mood_logs (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),

    mood            VARCHAR(20) NOT NULL
                    CHECK (mood IN ('ecstatic','happy','calm','tired','anxious','sad','playful','sick')),
    score           INTEGER NOT NULL CHECK (score >= 0 AND score <= 100),

    source          VARCHAR(20) NOT NULL     -- 'manual' | 'ai_diary' | 'ai_photo' | 'ai_auto'
                    CHECK (source IN ('manual', 'ai_diary', 'ai_photo', 'ai_auto')),
    source_id       UUID,                    -- ID da diary_entry ou photo_analysis que gerou

    notes           TEXT,                    -- Observações opcionais do tutor

    logged_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_mood_logs_pet_id ON mood_logs(pet_id);
CREATE INDEX idx_mood_logs_logged_at ON mood_logs(pet_id, logged_at DESC);
```

### 3.3 pet_embeddings (memória RAG)

```sql
CREATE TABLE pet_embeddings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,

    embedding       VECTOR(1536) NOT NULL,   -- Vetor gerado via API de embeddings

    content_text    TEXT NOT NULL,            -- Texto resumido que gerou o embedding
    content_type    VARCHAR(20) NOT NULL      -- 'diary' | 'photo_analysis' | 'vaccine' | 'allergy' | 'mood'
                    CHECK (content_type IN ('diary','photo_analysis','vaccine','allergy','mood')),

    source_id       UUID NOT NULL,            -- ID do registro original
    source_table    VARCHAR(30) NOT NULL      -- 'diary_entries' | 'photo_analyses' | 'vaccines' | 'allergies'
                    CHECK (source_table IN ('diary_entries','photo_analyses','vaccines','allergies','mood_logs')),

    metadata        JSONB DEFAULT '{}',       -- {date, mood, tags, scores, entry_type}
    importance_score DECIMAL(3,2) DEFAULT 0.50 -- 0.00-1.00
                    CHECK (importance_score >= 0 AND importance_score <= 1),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pet_embeddings_pet_id ON pet_embeddings(pet_id);
CREATE INDEX idx_pet_embeddings_type ON pet_embeddings(pet_id, content_type);
CREATE INDEX idx_pet_embeddings_created ON pet_embeddings(pet_id, created_at DESC);

-- Index para busca vetorial (cosine similarity)
CREATE INDEX idx_pet_embeddings_vector ON pet_embeddings
    USING ivfflat (embedding vector_cosine_ops)
    WITH (lists = 100);
```

### 3.4 rag_conversations (auditoria IA)

```sql
CREATE TABLE rag_conversations (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),

    query_type      VARCHAR(30) NOT NULL      -- 'diary_narration' | 'photo_analysis' | 'insight' | 'question'
                    CHECK (query_type IN ('diary_narration','photo_analysis','insight','question')),

    input_text      TEXT,                     -- Input do tutor ou contexto enviado
    context_ids     JSONB,                    -- [UUIDs dos embeddings recuperados do RAG]
    context_count   INTEGER,                  -- Quantos embeddings foram usados como contexto

    output_text     TEXT NOT NULL,             -- Resposta da IA (narração gerada)

    model_used      VARCHAR(50) DEFAULT 'claude-sonnet-4-20250514',
    tokens_input    INTEGER,                  -- Tokens de entrada consumidos
    tokens_output   INTEGER,                  -- Tokens de saída consumidos
    latency_ms      INTEGER,                  -- Tempo de resposta em ms

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_rag_conversations_pet_id ON rag_conversations(pet_id);
CREATE INDEX idx_rag_conversations_created ON rag_conversations(created_at DESC);
```

### 3.5 media_files (fotos do diário)

```sql
CREATE TABLE media_files (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID REFERENCES pets(id),
    uploaded_by     UUID NOT NULL REFERENCES users(id),

    bucket_name     VARCHAR(30) NOT NULL      -- 'pet-photos' | 'avatars'
                    CHECK (bucket_name IN ('pet-photos', 'avatars')),
    original_name   VARCHAR(255),
    original_size_bytes INTEGER NOT NULL,
    compressed_size_bytes INTEGER,
    compression_ratio DECIMAL(4,2),           -- Calculado: 1 - (compressed/original)

    paths           JSONB NOT NULL,           -- {thumbnail: '...', medium: '...', original: '...'}
    mime_type       VARCHAR(50) NOT NULL,
    width           INTEGER,
    height          INTEGER,

    source_table    VARCHAR(30),              -- 'diary_entries' | 'photo_analyses' | 'pets'
    source_id       UUID,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_media_files_pet_id ON media_files(pet_id);
CREATE INDEX idx_media_files_source ON media_files(source_table, source_id);
```

### 3.6 Campos relevantes na tabela pets

```sql
-- Estas colunas da tabela pets são atualizadas pelo diário:
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_mood VARCHAR(20) DEFAULT 'happy';
ALTER TABLE pets ADD COLUMN IF NOT EXISTS current_mood_updated_at TIMESTAMPTZ;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS total_diary_entries INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS total_photos INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS ai_personality_summary TEXT;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS health_score INTEGER DEFAULT 50;
```

---

## 4. ROW LEVEL SECURITY (RLS)

```sql
-- Habilitar RLS em todas as tabelas
ALTER TABLE diary_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE rag_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- diary_entries: via ownership do pet
CREATE POLICY diary_entries_select ON diary_entries FOR SELECT
    USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

CREATE POLICY diary_entries_insert ON diary_entries FOR INSERT
    WITH CHECK (
        author_id = auth.uid()
        AND pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
    );

CREATE POLICY diary_entries_update ON diary_entries FOR UPDATE
    USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

-- Mesmo padrão para mood_logs
CREATE POLICY mood_logs_select ON mood_logs FOR SELECT
    USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

CREATE POLICY mood_logs_insert ON mood_logs FOR INSERT
    WITH CHECK (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

-- pet_embeddings
CREATE POLICY pet_embeddings_select ON pet_embeddings FOR SELECT
    USING (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

CREATE POLICY pet_embeddings_insert ON pet_embeddings FOR INSERT
    WITH CHECK (pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid()));

-- rag_conversations
CREATE POLICY rag_conversations_select ON rag_conversations FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY rag_conversations_insert ON rag_conversations FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- media_files
CREATE POLICY media_files_select ON media_files FOR SELECT
    USING (
        uploaded_by = auth.uid()
        OR pet_id IN (SELECT id FROM pets WHERE owner_id = auth.uid())
    );

CREATE POLICY media_files_insert ON media_files FOR INSERT
    WITH CHECK (uploaded_by = auth.uid());
```

---

## 5. VIEWS

### 5.1 Timeline do diário (view principal)

```sql
CREATE OR REPLACE VIEW v_diary_timeline AS
SELECT
    de.id,
    de.pet_id,
    de.author_id,
    de.tutor_input,
    de.input_method,
    de.ai_narration,
    de.mood,
    de.mood_score,
    de.mood_source,
    de.entry_type,
    de.tags,
    de.is_special,
    de.photo_urls,
    de.entry_date,
    de.created_at,
    de.updated_at,
    -- Pet info
    p.name AS pet_name,
    p.species AS pet_species,
    p.breed AS pet_breed,
    -- Author info
    u.full_name AS author_name,
    -- Computed
    CASE
        WHEN de.entry_date = CURRENT_DATE THEN 'Hoje'
        WHEN de.entry_date = CURRENT_DATE - 1 THEN 'Ontem'
        ELSE TO_CHAR(de.entry_date, 'DD/MM/YYYY')
    END AS display_date,
    TO_CHAR(de.created_at, 'HH24:MI') AS display_time,
    jsonb_array_length(de.photo_urls) AS photo_count
FROM diary_entries de
JOIN pets p ON p.id = de.pet_id
JOIN users u ON u.id = de.author_id
WHERE de.is_deleted = false
ORDER BY de.entry_date DESC, de.created_at DESC;
```

### 5.2 Resumo mensal

```sql
CREATE OR REPLACE VIEW v_diary_monthly_summary AS
SELECT
    de.pet_id,
    DATE_TRUNC('month', de.entry_date)::DATE AS month,
    COUNT(*) AS total_entries,
    COUNT(*) FILTER (WHERE de.entry_type = 'manual') AS manual_entries,
    COUNT(*) FILTER (WHERE de.entry_type = 'photo_analysis') AS photo_entries,
    COUNT(*) FILTER (WHERE de.is_special = true) AS special_moments,
    ROUND(AVG(de.mood_score)) AS avg_mood_score,
    MODE() WITHIN GROUP (ORDER BY de.mood) AS dominant_mood,
    SUM(jsonb_array_length(de.photo_urls)) AS total_photos,
    array_agg(DISTINCT t.tag) FILTER (WHERE t.tag IS NOT NULL) AS top_tags
FROM diary_entries de
LEFT JOIN LATERAL jsonb_array_elements_text(de.tags) AS t(tag) ON true
WHERE de.is_deleted = false
GROUP BY de.pet_id, DATE_TRUNC('month', de.entry_date)
ORDER BY month DESC;
```

### 5.3 Estatísticas do humor

```sql
CREATE OR REPLACE VIEW v_mood_stats AS
SELECT
    ml.pet_id,
    ml.mood,
    COUNT(*) AS count,
    ROUND(AVG(ml.score)) AS avg_score,
    MAX(ml.logged_at) AS last_logged,
    ROUND(
        COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (PARTITION BY ml.pet_id),
        1
    ) AS percentage
FROM mood_logs ml
WHERE ml.logged_at >= NOW() - INTERVAL '30 days'
GROUP BY ml.pet_id, ml.mood
ORDER BY count DESC;
```

---

## 6. FUNCTIONS

### 6.1 Busca RAG (busca semântica)

```sql
CREATE OR REPLACE FUNCTION fn_search_rag(
    p_pet_id UUID,
    p_query_embedding VECTOR(1536),
    p_limit INTEGER DEFAULT 5,
    p_content_types TEXT[] DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    content_text TEXT,
    content_type VARCHAR(20),
    source_id UUID,
    metadata JSONB,
    importance_score DECIMAL,
    similarity FLOAT,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT
        pe.id,
        pe.content_text,
        pe.content_type,
        pe.source_id,
        pe.metadata,
        pe.importance_score,
        1 - (pe.embedding <=> p_query_embedding) AS similarity,
        pe.created_at
    FROM pet_embeddings pe
    WHERE pe.pet_id = p_pet_id
        AND (p_content_types IS NULL OR pe.content_type = ANY(p_content_types))
    ORDER BY pe.embedding <=> p_query_embedding
    LIMIT p_limit;
END;
$$;
```

### 6.2 Criar entrada no diário (function completa)

```sql
CREATE OR REPLACE FUNCTION fn_create_diary_entry(
    p_pet_id UUID,
    p_author_id UUID,
    p_tutor_input TEXT,
    p_input_method VARCHAR(10),
    p_mood VARCHAR(20),
    p_mood_score INTEGER DEFAULT NULL,
    p_mood_source VARCHAR(10) DEFAULT 'manual',
    p_entry_type VARCHAR(20) DEFAULT 'manual',
    p_tags JSONB DEFAULT '[]',
    p_is_special BOOLEAN DEFAULT false,
    p_photo_urls JSONB DEFAULT '[]',
    p_linked_photo_analysis_id UUID DEFAULT NULL,
    p_entry_date DATE DEFAULT CURRENT_DATE
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_entry_id UUID;
BEGIN
    -- Validações
    IF LENGTH(p_tutor_input) < 3 THEN
        RAISE EXCEPTION 'tutor_input deve ter no mínimo 3 caracteres';
    END IF;

    IF LENGTH(p_tutor_input) > 2000 THEN
        RAISE EXCEPTION 'tutor_input deve ter no máximo 2000 caracteres';
    END IF;

    IF jsonb_array_length(p_photo_urls) > 5 THEN
        RAISE EXCEPTION 'Máximo de 5 fotos por entrada';
    END IF;

    -- Verificar ownership do pet
    IF NOT EXISTS (SELECT 1 FROM pets WHERE id = p_pet_id AND owner_id = p_author_id) THEN
        RAISE EXCEPTION 'Pet não pertence a este tutor';
    END IF;

    -- Inserir entrada
    INSERT INTO diary_entries (
        pet_id, author_id, tutor_input, input_method,
        mood, mood_score, mood_source, entry_type,
        tags, is_special, photo_urls,
        linked_photo_analysis_id, entry_date
    ) VALUES (
        p_pet_id, p_author_id, p_tutor_input, p_input_method,
        p_mood, p_mood_score, p_mood_source, p_entry_type,
        p_tags, p_is_special, p_photo_urls,
        p_linked_photo_analysis_id, p_entry_date
    ) RETURNING id INTO v_entry_id;

    -- Registrar mood_log
    INSERT INTO mood_logs (pet_id, author_id, mood, score, source, source_id)
    VALUES (
        p_pet_id,
        p_author_id,
        p_mood,
        COALESCE(p_mood_score, CASE p_mood
            WHEN 'ecstatic' THEN 100
            WHEN 'happy' THEN 80
            WHEN 'calm' THEN 60
            WHEN 'playful' THEN 70
            WHEN 'tired' THEN 40
            WHEN 'anxious' THEN 25
            WHEN 'sad' THEN 10
            WHEN 'sick' THEN 15
            ELSE 50
        END),
        'ai_diary',
        v_entry_id
    );

    RETURN v_entry_id;
END;
$$;
```

### 6.3 Atualizar narração IA

```sql
CREATE OR REPLACE FUNCTION fn_update_diary_narration(
    p_entry_id UUID,
    p_ai_narration TEXT,
    p_ai_narration_lang VARCHAR(5),
    p_mood_score INTEGER DEFAULT NULL,
    p_tags JSONB DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE diary_entries
    SET
        ai_narration = p_ai_narration,
        ai_narration_lang = p_ai_narration_lang,
        mood_score = COALESCE(p_mood_score, mood_score),
        tags = COALESCE(p_tags, tags),
        updated_at = NOW()
    WHERE id = p_entry_id;
END;
$$;
```

### 6.4 Listar timeline com paginação

```sql
CREATE OR REPLACE FUNCTION fn_get_diary_timeline(
    p_pet_id UUID,
    p_page INTEGER DEFAULT 1,
    p_per_page INTEGER DEFAULT 20,
    p_entry_type VARCHAR(20) DEFAULT NULL,
    p_mood VARCHAR(20) DEFAULT NULL,
    p_only_special BOOLEAN DEFAULT false,
    p_date_from DATE DEFAULT NULL,
    p_date_to DATE DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    tutor_input TEXT,
    input_method VARCHAR(10),
    ai_narration TEXT,
    mood VARCHAR(20),
    mood_score INTEGER,
    entry_type VARCHAR(20),
    tags JSONB,
    is_special BOOLEAN,
    photo_urls JSONB,
    entry_date DATE,
    created_at TIMESTAMPTZ,
    display_date TEXT,
    display_time TEXT,
    photo_count INTEGER,
    total_count BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER;
BEGIN
    v_offset := (p_page - 1) * p_per_page;

    RETURN QUERY
    SELECT
        de.id,
        de.tutor_input,
        de.input_method,
        de.ai_narration,
        de.mood,
        de.mood_score,
        de.entry_type,
        de.tags,
        de.is_special,
        de.photo_urls,
        de.entry_date,
        de.created_at,
        CASE
            WHEN de.entry_date = CURRENT_DATE THEN 'Hoje'
            WHEN de.entry_date = CURRENT_DATE - 1 THEN 'Ontem'
            ELSE TO_CHAR(de.entry_date, 'DD/MM/YYYY')
        END AS display_date,
        TO_CHAR(de.created_at, 'HH24:MI') AS display_time,
        jsonb_array_length(de.photo_urls)::INTEGER AS photo_count,
        COUNT(*) OVER()::BIGINT AS total_count
    FROM diary_entries de
    WHERE de.pet_id = p_pet_id
        AND de.is_deleted = false
        AND (p_entry_type IS NULL OR de.entry_type = p_entry_type)
        AND (p_mood IS NULL OR de.mood = p_mood)
        AND (p_only_special = false OR de.is_special = true)
        AND (p_date_from IS NULL OR de.entry_date >= p_date_from)
        AND (p_date_to IS NULL OR de.entry_date <= p_date_to)
    ORDER BY de.entry_date DESC, de.created_at DESC
    LIMIT p_per_page
    OFFSET v_offset;
END;
$$;
```

---

## 7. TRIGGERS

### 7.1 Atualizar humor do pet ao inserir mood_log

```sql
CREATE OR REPLACE FUNCTION trg_update_pet_mood()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE pets
    SET
        current_mood = NEW.mood,
        current_mood_updated_at = NOW(),
        updated_at = NOW()
    WHERE id = NEW.pet_id;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_update_pet_mood
    AFTER INSERT ON mood_logs
    FOR EACH ROW
    EXECUTE FUNCTION trg_update_pet_mood();
```

### 7.2 Incrementar contador de entradas

```sql
CREATE OR REPLACE FUNCTION trg_increment_diary_count()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.is_deleted = false THEN
        UPDATE pets
        SET
            total_diary_entries = total_diary_entries + 1,
            total_photos = total_photos + jsonb_array_length(NEW.photo_urls),
            updated_at = NOW()
        WHERE id = NEW.pet_id;
    END IF;

    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_increment_diary_count
    AFTER INSERT ON diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION trg_increment_diary_count();
```

### 7.3 Atualizar updated_at automaticamente

```sql
CREATE OR REPLACE FUNCTION trg_set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trigger_diary_updated_at
    BEFORE UPDATE ON diary_entries
    FOR EACH ROW
    EXECUTE FUNCTION trg_set_updated_at();
```

---

## 8. EDGE FUNCTIONS (Supabase)

### 8.1 generate-diary-narration

```
Trigger: POST /functions/v1/generate-diary-narration
Input: { pet_id, entry_id, tutor_input, mood, user_language }

Fluxo:
1. Buscar dados do pet (name, breed, species, age, personality_tags)
2. Buscar alergias do pet
3. Gerar embedding do tutor_input
4. Chamar fn_search_rag() com embedding → top 5 contextos
5. Montar prompt:
   - System: "Você é {name}, um {breed}..."
   - Context: últimas 5 memórias do RAG
   - User: "{tutor_input}"
   - Mood: "{mood}"
   - Idioma: "{user_language}"
6. Chamar Claude API (claude-sonnet-4-20250514)
7. Extrair: narration, suggested_tags, mood_score
8. Chamar fn_update_diary_narration()
9. Registrar em rag_conversations
10. Retornar { narration, tags, mood_score }

Tempo esperado: 2-4 segundos
Custo: ~$0.003/chamada
```

### 8.2 generate-embedding

```
Trigger: Chamado pela generate-diary-narration após salvar
Input: { pet_id, content_text, content_type, source_id, source_table, metadata }

Fluxo:
1. Chamar API de embeddings com content_text
2. Receber vector(1536)
3. Calcular importance_score baseado em content_type:
   - vaccine/allergy: 0.90
   - photo_analysis: 0.80
   - diary (manual): 0.50
   - mood: 0.30
4. INSERT em pet_embeddings
5. Verificar se pet tem 5+ entradas → gerar ai_personality_summary

Tempo esperado: ~1 segundo
Custo: ~$0.0001/chamada
```

---

## 9. QUERIES COMUNS (Frontend → Supabase)

### 9.1 Carregar timeline

```typescript
// hooks/useDiary.ts
const fetchTimeline = async (petId: string, page: number, filters: DiaryFilters) => {
  const { data, error } = await supabase
    .rpc('fn_get_diary_timeline', {
      p_pet_id: petId,
      p_page: page,
      p_per_page: 20,
      p_entry_type: filters.type || null,
      p_mood: filters.mood || null,
      p_only_special: filters.onlySpecial || false,
      p_date_from: filters.dateFrom || null,
      p_date_to: filters.dateTo || null,
    });
  return data;
};
```

### 9.2 Criar entrada

```typescript
const createEntry = async (entry: NewDiaryEntry) => {
  // 1. Criar entrada no banco
  const { data: entryId } = await supabase
    .rpc('fn_create_diary_entry', {
      p_pet_id: entry.petId,
      p_author_id: entry.authorId,
      p_tutor_input: entry.tutorInput,
      p_input_method: entry.inputMethod,
      p_mood: entry.mood,
      p_mood_source: entry.moodSource,
      p_entry_type: entry.entryType,
      p_tags: entry.tags,
      p_is_special: entry.isSpecial,
      p_photo_urls: entry.photoUrls,
    });

  // 2. Gerar narração IA
  const { data: narration } = await supabase.functions
    .invoke('generate-diary-narration', {
      body: {
        pet_id: entry.petId,
        entry_id: entryId,
        tutor_input: entry.tutorInput,
        mood: entry.mood,
        user_language: 'pt-BR',
      },
    });

  return { entryId, narration };
};
```

### 9.3 Buscar estatísticas de humor

```typescript
const fetchMoodStats = async (petId: string) => {
  const { data } = await supabase
    .from('v_mood_stats')
    .select('*')
    .eq('pet_id', petId);
  return data;
};
```

### 9.4 Buscar resumo mensal

```typescript
const fetchMonthlySummary = async (petId: string, month: string) => {
  const { data } = await supabase
    .from('v_diary_monthly_summary')
    .select('*')
    .eq('pet_id', petId)
    .eq('month', month)
    .single();
  return data;
};
```

---

## 10. MAPA DE NOMES (evitar erros)

### Tabela → Colunas mais usadas no código:

| Tabela | Coluna | Tipo | Uso no código |
|--------|--------|------|---------------|
| diary_entries | id | UUID | entry.id |
| diary_entries | pet_id | UUID | entry.petId |
| diary_entries | author_id | UUID | entry.authorId |
| diary_entries | tutor_input | TEXT | entry.tutorInput |
| diary_entries | input_method | VARCHAR | entry.inputMethod |
| diary_entries | ai_narration | TEXT | entry.aiNarration |
| diary_entries | mood | VARCHAR | entry.mood |
| diary_entries | mood_score | INTEGER | entry.moodScore |
| diary_entries | mood_source | VARCHAR | entry.moodSource |
| diary_entries | entry_type | VARCHAR | entry.entryType |
| diary_entries | tags | JSONB | entry.tags |
| diary_entries | is_special | BOOLEAN | entry.isSpecial |
| diary_entries | photo_urls | JSONB | entry.photoUrls |
| diary_entries | entry_date | DATE | entry.entryDate |
| diary_entries | is_deleted | BOOLEAN | entry.isDeleted |
| mood_logs | mood | VARCHAR | log.mood |
| mood_logs | score | INTEGER | log.score |
| mood_logs | source | VARCHAR | log.source |
| pet_embeddings | embedding | VECTOR | embedding.vector |
| pet_embeddings | content_text | TEXT | embedding.contentText |
| pet_embeddings | content_type | VARCHAR | embedding.contentType |
| pet_embeddings | importance_score | DECIMAL | embedding.importanceScore |

### Convenção de nomes:
- **Banco (SQL):** snake_case → `tutor_input`, `mood_score`, `entry_type`
- **TypeScript:** camelCase → `tutorInput`, `moodScore`, `entryType`
- **Supabase retorna** snake_case → converter no frontend com types gerados

### Valores permitidos (CHECK constraints):

```
mood:         'ecstatic'|'happy'|'calm'|'tired'|'anxious'|'sad'|'playful'|'sick'
input_method: 'voice'|'photo'|'text'
entry_type:   'manual'|'photo_analysis'|'vaccine'|'allergy'|'ai_insight'|'milestone'|'mood_change'
mood_source:  'manual'|'ai_suggested'
source (mood_logs): 'manual'|'ai_diary'|'ai_photo'|'ai_auto'
content_type (embeddings): 'diary'|'photo_analysis'|'vaccine'|'allergy'|'mood'
source_table (embeddings): 'diary_entries'|'photo_analyses'|'vaccines'|'allergies'|'mood_logs'
```

---

## 11. ORDEM DE CRIAÇÃO NO BANCO

Execute nesta ordem para evitar erros de dependência:

```
1. CREATE TABLE pets (se não existir)
2. CREATE TABLE users (se não existir)
3. CREATE TABLE diary_entries
4. CREATE TABLE mood_logs
5. CREATE EXTENSION vector (se não existir)
6. CREATE TABLE pet_embeddings
7. CREATE TABLE rag_conversations
8. CREATE TABLE media_files
9. CREATE todos os INDEX
10. ENABLE RLS em todas as tabelas
11. CREATE todas as POLICY
12. CREATE VIEW v_diary_timeline
13. CREATE VIEW v_diary_monthly_summary
14. CREATE VIEW v_mood_stats
15. CREATE FUNCTION fn_search_rag
16. CREATE FUNCTION fn_create_diary_entry
17. CREATE FUNCTION fn_update_diary_narration
18. CREATE FUNCTION fn_get_diary_timeline
19. CREATE FUNCTION trg_update_pet_mood
20. CREATE FUNCTION trg_increment_diary_count
21. CREATE FUNCTION trg_set_updated_at
22. CREATE TRIGGER trigger_update_pet_mood
23. CREATE TRIGGER trigger_increment_diary_count
24. CREATE TRIGGER trigger_diary_updated_at
```
