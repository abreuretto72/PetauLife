# ALDEIA — Modelo de Dados e Mapa de Telas
## Especificação técnica completa para o banco de dados e navegação

> Segue os padrões do CLAUDE.md v6:
> - Todo `id`: `UUID DEFAULT gen_random_uuid()`
> - Toda tabela: `created_at TIMESTAMPTZ DEFAULT NOW()`
> - Soft delete: `is_deleted BOOLEAN DEFAULT false`
> - RLS ativo em TODAS as tabelas
> - SQL: snake_case · TypeScript: camelCase
> - Responsivo: rs(), fs(), wp(), hp()
> - Zero emojis — Lucide icons
> - Clicável = laranja · Lixeira = vermelho

---

## 1. MAPA DE TELAS E CONEXÕES

### 1.1 Visão geral da navegação

```
Hub Principal (hub)
│
├── Card "Aldeia" (topo do hub)
│   └── TELA: Aldeia Home ─────────────────────────────────
│       │                                                   │
│       ├── Aba FEED                                        │
│       │   ├── Posts de tutores e pets                      │
│       │   ├── Admirar pet (botão ❤️ no card)              │
│       │   ├── Comentar post                               │
│       │   ├── Compartilhar cartão do pet                   │
│       │   └── [+] Criar novo post                         │
│       │       └── MODAL: Novo Post                        │
│       │                                                   │
│       ├── Aba MAPA                                        │
│       │   ├── Mapa com pins de tutores (raio 200m)        │
│       │   ├── Pins de parceiros verificados               │
│       │   ├── Pins de alertas ativos                      │
│       │   ├── Pins de eventos futuros                     │
│       │   ├── Toque no pin → TELA: Perfil Público do Pet  │
│       │   └── Toque no parceiro → TELA: Perfil Parceiro   │
│       │                                                   │
│       ├── Aba SOS                                         │
│       │   ├── Botão grande "SOS Emergência"               │
│       │   │   └── MODAL: Tipo de SOS                      │
│       │   │       ├── Emergência Médica                   │
│       │   │       ├── Pet Perdido                         │
│       │   │       └── Preciso de Ajuda Urgente             │
│       │   ├── SOS ativos na Aldeia (timeline)             │
│       │   ├── Toque no SOS → TELA: Detalhes SOS           │
│       │   │   ├── Mapa em tempo real                      │
│       │   │   ├── Avistamentos                            │
│       │   │   ├── Prontuário proxy (se médico)            │
│       │   │   └── [Quero Ajudar]                          │
│       │   └── Histórico de SOS resolvidos                 │
│       │                                                   │
│       └── Aba MAIS                                        │
│           ├── Eventos                                     │
│           │   ├── Lista de eventos futuros                │
│           │   ├── Toque → TELA: Detalhes Evento           │
│           │   └── [+] Criar evento                        │
│           │       └── MODAL: Novo Evento                  │
│           ├── Favores                                     │
│           │   ├── Pedidos abertos                         │
│           │   ├── Meus favores (feitos/recebidos)         │
│           │   └── [+] Pedir favor                         │
│           │       └── MODAL: Novo Favor                   │
│           ├── Classificados                               │
│           │   ├── Itens disponíveis                       │
│           │   └── [+] Oferecer item                       │
│           │       └── MODAL: Novo Classificado            │
│           ├── Rankings                                    │
│           │   └── TELA: Rankings da Aldeia                │
│           ├── Parceiros                                   │
│           │   └── TELA: Lista de Parceiros                │
│           │       └── TELA: Perfil Parceiro               │
│           └── Minha Aldeia                                │
│               ├── Stats da Aldeia                         │
│               ├── Meus Pet-Credits                        │
│               ├── Meu nível e karma                       │
│               └── Membros da Aldeia                       │
│
├── Card do Tutor
│   └── Perfil do Tutor (já existe)
│       └── Seção "Minha Aldeia"
│           ├── Pet-Credits: 125
│           ├── Karma: 78/100
│           ├── Nível: Guardião
│           └── [Ver Aldeia]
│
└── Card do Pet
    └── Dashboard do Pet (já existe)
        └── Seção "Amigos na Aldeia"
            ├── Grafo social mini (3 amigos + "ver todos")
            ├── Compatibilidade sugerida
            └── [Ver na Aldeia]
                └── TELA: Perfil Público do Pet
```

### 1.2 Telas novas da Aldeia (lista completa)

| # | Tela | Tipo | Acessa de | Acessa para |
|---|------|------|-----------|-------------|
| 1 | Aldeia Home | Tab com 4 abas | Hub card "Aldeia" | Feed, Mapa, SOS, Mais |
| 2 | Perfil Público do Pet | Tela cheia | Mapa pin, Feed card, Grafo | Admirar, Mensagem, Match |
| 3 | Detalhes SOS | Tela cheia | Aba SOS | Mapa busca, Prontuário proxy, Ajudar |
| 4 | Detalhes Evento | Tela cheia | Aba Mais > Eventos | Confirmar, Mapa, Participantes |
| 5 | Rankings da Aldeia | Tela cheia | Aba Mais > Rankings | Perfil Público do Pet |
| 6 | Perfil Parceiro | Tela cheia | Mapa, Lista Parceiros | Avaliações, Descontos, Mapa |
| 7 | Lista Parceiros | Tela cheia | Aba Mais > Parceiros | Perfil Parceiro |

| # | Modal | Acessa de |
|---|-------|-----------|
| M1 | Novo Post | Feed [+] |
| M2 | Tipo de SOS | Aba SOS botão grande |
| M3 | SOS Emergência Médica | M2 opção 1 |
| M4 | SOS Pet Perdido | M2 opção 2 |
| M5 | Novo Evento | Aba Mais > Eventos [+] |
| M6 | Novo Favor | Aba Mais > Favores [+] |
| M7 | Novo Classificado | Aba Mais > Classificados [+] |
| M8 | Avaliação Pós-Favor | Automático ao completar favor |
| M9 | Cartão Compartilhável | Perfil Público do Pet > Compartilhar |

---

## 2. TABELAS DO BANCO DE DADOS

### Convenções seguidas (conforme CLAUDE.md seção 7 e 10):

```
- id: UUID PRIMARY KEY DEFAULT gen_random_uuid()
- created_at: TIMESTAMPTZ NOT NULL DEFAULT NOW()
- updated_at: TIMESTAMPTZ NOT NULL DEFAULT NOW() (se editável)
- Soft delete: is_deleted BOOLEAN DEFAULT false
- Foreign keys: REFERENCES tabela(id) ON DELETE CASCADE
- Enum via CHECK: CHECK (coluna IN ('valor1', 'valor2'))
- SQL: snake_case
- TypeScript: camelCase
- RLS ativo em TODAS as tabelas
- Índices: idx_tabela_coluna
```

---

### 2.1 aldeia_communities (a Aldeia em si)

```sql
CREATE TABLE aldeia_communities (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Identificação
    name            VARCHAR(100) NOT NULL,   -- "Aldeia Salto"
    slug            VARCHAR(50) NOT NULL UNIQUE, -- "aldeia-salto-sp"
    description     TEXT,

    -- Localização
    country_code    VARCHAR(2) NOT NULL,     -- 'BR', 'US', 'JP'
    state_code      VARCHAR(10),             -- 'SP', 'RJ', 'CA'
    city            VARCHAR(100) NOT NULL,
    neighborhood    VARCHAR(100),
    center_lat      DECIMAL(10,7) NOT NULL,
    center_lng      DECIMAL(10,7) NOT NULL,
    radius_km       DECIMAL(4,1) DEFAULT 3.0, -- Raio padrão em km
    locale          VARCHAR(5) NOT NULL DEFAULT 'pt-BR',

    -- Estatísticas (atualizadas por trigger)
    total_members   INTEGER DEFAULT 0,
    total_pets      INTEGER DEFAULT 0,
    total_partners  INTEGER DEFAULT 0,
    total_favors    INTEGER DEFAULT 0,
    total_sos       INTEGER DEFAULT 0,
    total_events    INTEGER DEFAULT 0,

    -- Avatares
    avatar_count    INTEGER DEFAULT 0,       -- Avatares ativos na Aldeia
    is_fully_real   BOOLEAN DEFAULT false,    -- true quando 0 avatares

    -- Controle
    founded_by      UUID REFERENCES users(id),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_communities_location ON aldeia_communities(country_code, state_code, city);
CREATE INDEX idx_aldeia_communities_center ON aldeia_communities USING gist (
    ST_SetSRID(ST_MakePoint(center_lng, center_lat), 4326)
);
CREATE INDEX idx_aldeia_communities_slug ON aldeia_communities(slug);
```

### 2.2 aldeia_members (tutores na Aldeia)

```sql
CREATE TABLE aldeia_members (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,

    -- Nível
    level           VARCHAR(20) NOT NULL DEFAULT 'observer'
                    CHECK (level IN ('observer','member','guardian','elder','founder')),

    -- Scores
    karma_score     INTEGER DEFAULT 0 CHECK (karma_score >= 0 AND karma_score <= 100),
    trust_score     DECIMAL(3,2) DEFAULT 0.00 CHECK (trust_score >= 0 AND trust_score <= 5),
    pet_credits     INTEGER DEFAULT 0,

    -- Contadores
    favors_given    INTEGER DEFAULT 0,
    favors_received INTEGER DEFAULT 0,
    sos_responded   INTEGER DEFAULT 0,
    events_organized INTEGER DEFAULT 0,
    events_attended INTEGER DEFAULT 0,
    reviews_received INTEGER DEFAULT 0,
    admirations_given INTEGER DEFAULT 0,

    -- Verificação
    verified_email    BOOLEAN DEFAULT false,
    verified_phone    BOOLEAN DEFAULT false,
    verified_document BOOLEAN DEFAULT false,
    verified_address  BOOLEAN DEFAULT false,

    -- Título
    title           VARCHAR(30) DEFAULT 'novato'
                    CHECK (title IN ('novato','dedicado','exemplar','referencia','guardiao','lendario')),

    -- Configurações
    notification_radius_km DECIMAL(3,1) DEFAULT 3.0,
    visible_on_map  BOOLEAN DEFAULT true,

    -- Controle
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_active_at  TIMESTAMPTZ DEFAULT NOW(),
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(aldeia_id, user_id)
);

CREATE INDEX idx_aldeia_members_aldeia ON aldeia_members(aldeia_id);
CREATE INDEX idx_aldeia_members_user ON aldeia_members(user_id);
CREATE INDEX idx_aldeia_members_level ON aldeia_members(aldeia_id, level);
CREATE INDEX idx_aldeia_members_karma ON aldeia_members(aldeia_id, karma_score DESC);
```

### 2.3 aldeia_feed (posts do feed)

```sql
CREATE TABLE aldeia_feed (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),
    pet_id          UUID REFERENCES pets(id),

    -- Conteúdo
    content_type    VARCHAR(20) NOT NULL
                    CHECK (content_type IN ('post','story','alert','event_share','achievement','ai_generated')),
    text_content    TEXT,                     -- Texto do post
    photo_urls      JSONB DEFAULT '[]',       -- [{url, thumbnail_url}] max 5
    linked_event_id UUID REFERENCES aldeia_events(id),
    linked_sos_id   UUID REFERENCES aldeia_sos(id),

    -- Interações
    admirations_count INTEGER DEFAULT 0,
    comments_count  INTEGER DEFAULT 0,

    -- Story (expira em 24h)
    is_story        BOOLEAN DEFAULT false,
    story_expires_at TIMESTAMPTZ,

    -- Controle
    is_deleted      BOOLEAN DEFAULT false,
    is_avatar       BOOLEAN DEFAULT false,    -- Post de avatar IA
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_feed_aldeia ON aldeia_feed(aldeia_id, created_at DESC);
CREATE INDEX idx_aldeia_feed_author ON aldeia_feed(author_id);
CREATE INDEX idx_aldeia_feed_pet ON aldeia_feed(pet_id);
CREATE INDEX idx_aldeia_feed_story ON aldeia_feed(aldeia_id, is_story, story_expires_at)
    WHERE is_story = true AND is_deleted = false;
```

### 2.4 aldeia_feed_reactions (admirações e comentários)

```sql
CREATE TABLE aldeia_feed_reactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    feed_post_id    UUID NOT NULL REFERENCES aldeia_feed(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),

    reaction_type   VARCHAR(10) NOT NULL
                    CHECK (reaction_type IN ('admire','comment')),
    comment_text    TEXT,                     -- Só se reaction_type = 'comment'

    is_avatar       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Máximo 1 admiração por user por post por dia
    UNIQUE(feed_post_id, user_id, reaction_type)
);

CREATE INDEX idx_feed_reactions_post ON aldeia_feed_reactions(feed_post_id);
CREATE INDEX idx_feed_reactions_user ON aldeia_feed_reactions(user_id);
```

### 2.5 aldeia_pet_graph (grafo social dos pets)

```sql
CREATE TABLE aldeia_pet_graph (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pet_id          UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
    friend_pet_id   UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,

    -- Classificação
    relationship    VARCHAR(15) NOT NULL DEFAULT 'neutral'
                    CHECK (relationship IN ('best_friend','friend','acquaintance','neutral','avoid')),
    compatibility_score INTEGER CHECK (compatibility_score >= 0 AND compatibility_score <= 100),

    -- Histórico
    times_met       INTEGER DEFAULT 1,
    last_met_at     TIMESTAMPTZ DEFAULT NOW(),
    first_met_at    TIMESTAMPTZ DEFAULT NOW(),

    -- Quem registrou
    registered_by   UUID NOT NULL REFERENCES users(id),
    ai_suggested    BOOLEAN DEFAULT false,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(pet_id, friend_pet_id),
    CHECK (pet_id != friend_pet_id)
);

CREATE INDEX idx_pet_graph_pet ON aldeia_pet_graph(pet_id);
CREATE INDEX idx_pet_graph_friend ON aldeia_pet_graph(friend_pet_id);
CREATE INDEX idx_pet_graph_relationship ON aldeia_pet_graph(pet_id, relationship);
```

### 2.6 aldeia_favors (favores solidários)

```sql
CREATE TABLE aldeia_favors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    requester_id    UUID NOT NULL REFERENCES users(id),
    responder_id    UUID REFERENCES users(id),  -- NULL até alguém aceitar
    pet_id          UUID NOT NULL REFERENCES pets(id),

    -- Tipo e descrição
    favor_type      VARCHAR(20) NOT NULL
                    CHECK (favor_type IN ('walk','care','transport','feeding','grooming','other')),
    description     TEXT NOT NULL,
    input_method    VARCHAR(10) DEFAULT 'text'
                    CHECK (input_method IN ('voice','text')),

    -- Quando
    needed_date     DATE NOT NULL,
    needed_time_start TIME,
    needed_time_end TIME,
    is_urgent       BOOLEAN DEFAULT false,

    -- Localização (ponto de encontro)
    location_lat    DECIMAL(10,7),
    location_lng    DECIMAL(10,7),
    location_name   VARCHAR(200),

    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'open'
                    CHECK (status IN ('open','accepted','in_progress','completed','cancelled','expired')),

    -- Recompensa
    credits_offered INTEGER DEFAULT 15,
    credits_paid    BOOLEAN DEFAULT false,

    -- Controle
    is_avatar       BOOLEAN DEFAULT false,
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_favors_aldeia ON aldeia_favors(aldeia_id, status);
CREATE INDEX idx_aldeia_favors_requester ON aldeia_favors(requester_id);
CREATE INDEX idx_aldeia_favors_responder ON aldeia_favors(responder_id);
CREATE INDEX idx_aldeia_favors_date ON aldeia_favors(needed_date);
CREATE INDEX idx_aldeia_favors_open ON aldeia_favors(aldeia_id, status)
    WHERE status = 'open' AND is_deleted = false;
```

### 2.7 aldeia_sos (emergências)

```sql
CREATE TABLE aldeia_sos (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    requester_id    UUID NOT NULL REFERENCES users(id),
    pet_id          UUID NOT NULL REFERENCES pets(id),

    -- Tipo
    sos_type        VARCHAR(20) NOT NULL
                    CHECK (sos_type IN ('medical','lost_pet','urgent_help')),

    -- Descrição
    description     TEXT NOT NULL,
    input_method    VARCHAR(10) DEFAULT 'text'
                    CHECK (input_method IN ('voice','text')),

    -- Localização
    location_lat    DECIMAL(10,7) NOT NULL,
    location_lng    DECIMAL(10,7) NOT NULL,
    location_name   VARCHAR(200),
    search_radius_km DECIMAL(3,1) DEFAULT 1.0,

    -- Status
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active','responding','resolved','cancelled')),
    resolved_at     TIMESTAMPTZ,
    resolved_by     UUID REFERENCES users(id),
    resolution_notes TEXT,

    -- Proxy de prontuário (dados compartilhados com quem responde)
    proxy_data      JSONB,                   -- {allergies, medications, weight, vet_contact, emergency_contact}
    proxy_enabled   BOOLEAN DEFAULT true,

    -- Fase de busca (para lost_pet)
    search_phase    INTEGER DEFAULT 1         -- 1: 1km, 2: 3km, 3: 5km
                    CHECK (search_phase >= 1 AND search_phase <= 3),
    phase_expanded_at TIMESTAMPTZ,

    -- Contadores
    responders_count INTEGER DEFAULT 0,
    sightings_count INTEGER DEFAULT 0,

    -- Controle
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_sos_aldeia ON aldeia_sos(aldeia_id, status);
CREATE INDEX idx_aldeia_sos_active ON aldeia_sos(aldeia_id, status)
    WHERE status IN ('active','responding');
CREATE INDEX idx_aldeia_sos_location ON aldeia_sos USING gist (
    ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
);
```

### 2.8 aldeia_sos_responses (respostas ao SOS)

```sql
CREATE TABLE aldeia_sos_responses (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sos_id          UUID NOT NULL REFERENCES aldeia_sos(id) ON DELETE CASCADE,
    responder_id    UUID NOT NULL REFERENCES users(id),

    response_type   VARCHAR(20) NOT NULL
                    CHECK (response_type IN ('on_my_way','can_help','sighting','info','found')),

    message         TEXT,
    photo_url       VARCHAR(500),

    -- Localização do avistamento (para lost_pet)
    sighting_lat    DECIMAL(10,7),
    sighting_lng    DECIMAL(10,7),
    sighting_time   TIMESTAMPTZ,

    -- Créditos
    credits_earned  INTEGER DEFAULT 0,

    is_avatar       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_sos_responses_sos ON aldeia_sos_responses(sos_id, created_at);
CREATE INDEX idx_sos_responses_responder ON aldeia_sos_responses(responder_id);
```

### 2.9 aldeia_events (eventos da Aldeia)

```sql
CREATE TABLE aldeia_events (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    organizer_id    UUID NOT NULL REFERENCES users(id),

    -- Detalhes
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    event_type      VARCHAR(20) NOT NULL
                    CHECK (event_type IN ('walk','fair','vaccination','social','rescue','workshop','adoption')),

    -- Quando
    event_date      DATE NOT NULL,
    start_time      TIME NOT NULL,
    end_time        TIME,

    -- Onde
    location_lat    DECIMAL(10,7),
    location_lng    DECIMAL(10,7),
    location_name   VARCHAR(200) NOT NULL,

    -- Limites
    max_pets        INTEGER,                  -- NULL = sem limite
    max_attendees   INTEGER,

    -- Contadores
    confirmed_count INTEGER DEFAULT 0,
    attended_count  INTEGER DEFAULT 0,

    -- Status
    status          VARCHAR(15) NOT NULL DEFAULT 'upcoming'
                    CHECK (status IN ('upcoming','ongoing','completed','cancelled')),

    -- Créditos para organizador
    credits_reward  INTEGER DEFAULT 25,

    -- Controle
    is_avatar       BOOLEAN DEFAULT false,
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_events_aldeia ON aldeia_events(aldeia_id, event_date);
CREATE INDEX idx_aldeia_events_upcoming ON aldeia_events(aldeia_id, event_date)
    WHERE status = 'upcoming' AND is_deleted = false;
```

### 2.10 aldeia_event_attendees (confirmações de evento)

```sql
CREATE TABLE aldeia_event_attendees (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id        UUID NOT NULL REFERENCES aldeia_events(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id),
    pet_id          UUID REFERENCES pets(id),

    status          VARCHAR(15) NOT NULL DEFAULT 'confirmed'
                    CHECK (status IN ('confirmed','maybe','cancelled','attended')),

    checked_in      BOOLEAN DEFAULT false,
    checked_in_at   TIMESTAMPTZ,

    is_avatar       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(event_id, user_id)
);

CREATE INDEX idx_event_attendees_event ON aldeia_event_attendees(event_id);
CREATE INDEX idx_event_attendees_user ON aldeia_event_attendees(user_id);
```

### 2.11 aldeia_reviews (avaliações mútuas)

```sql
CREATE TABLE aldeia_reviews (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    favor_id        UUID REFERENCES aldeia_favors(id),

    reviewer_id     UUID NOT NULL REFERENCES users(id),
    reviewed_id     UUID NOT NULL REFERENCES users(id),

    -- Scores
    punctuality     INTEGER NOT NULL CHECK (punctuality >= 1 AND punctuality <= 5),
    pet_care        INTEGER NOT NULL CHECK (pet_care >= 1 AND pet_care <= 5),
    communication   INTEGER NOT NULL CHECK (communication >= 1 AND communication <= 5),
    instructions    INTEGER NOT NULL CHECK (instructions >= 1 AND instructions <= 5),
    overall_score   DECIMAL(2,1) NOT NULL,    -- Média calculada

    comment         TEXT,

    -- Controle
    is_avatar       BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(favor_id, reviewer_id)
);

CREATE INDEX idx_aldeia_reviews_reviewed ON aldeia_reviews(reviewed_id, created_at DESC);
CREATE INDEX idx_aldeia_reviews_aldeia ON aldeia_reviews(aldeia_id);
```

### 2.12 aldeia_alerts (alertas comunitários)

```sql
CREATE TABLE aldeia_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    author_id       UUID NOT NULL REFERENCES users(id),

    -- Tipo
    alert_type      VARCHAR(20) NOT NULL
                    CHECK (alert_type IN ('danger','warning','info','lost_pet','found_pet','noise','health')),

    -- Conteúdo
    title           VARCHAR(150) NOT NULL,
    description     TEXT NOT NULL,
    photo_url       VARCHAR(500),

    -- Localização
    location_lat    DECIMAL(10,7),
    location_lng    DECIMAL(10,7),
    location_name   VARCHAR(200),

    -- Validade
    expires_at      TIMESTAMPTZ,              -- NULL = não expira
    is_resolved     BOOLEAN DEFAULT false,
    resolved_at     TIMESTAMPTZ,

    -- Controle
    is_avatar       BOOLEAN DEFAULT false,
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_alerts_aldeia ON aldeia_alerts(aldeia_id, created_at DESC);
CREATE INDEX idx_aldeia_alerts_active ON aldeia_alerts(aldeia_id, is_resolved, expires_at)
    WHERE is_deleted = false;
CREATE INDEX idx_aldeia_alerts_type ON aldeia_alerts(aldeia_id, alert_type);
```

### 2.13 aldeia_classifieds (classificados solidários)

```sql
CREATE TABLE aldeia_classifieds (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    author_id       UUID NOT NULL REFERENCES users(id),

    -- Item
    title           VARCHAR(150) NOT NULL,
    description     TEXT,
    category        VARCHAR(20) NOT NULL
                    CHECK (category IN ('food','medicine','accessory','toy','carrier','clothing','other')),
    condition       VARCHAR(10) NOT NULL DEFAULT 'used'
                    CHECK (condition IN ('new','used','expired_soon')),
    photo_urls      JSONB DEFAULT '[]',

    -- Tipo de oferta
    offer_type      VARCHAR(10) NOT NULL DEFAULT 'donation'
                    CHECK (offer_type IN ('donation','exchange','lend')),
    credits_price   INTEGER DEFAULT 0,        -- 0 = doação gratuita

    -- Status
    status          VARCHAR(15) NOT NULL DEFAULT 'available'
                    CHECK (status IN ('available','reserved','taken','expired')),
    taken_by        UUID REFERENCES users(id),

    -- Controle
    is_avatar       BOOLEAN DEFAULT false,
    is_deleted      BOOLEAN DEFAULT false,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_classifieds_aldeia ON aldeia_classifieds(aldeia_id, status);
CREATE INDEX idx_aldeia_classifieds_category ON aldeia_classifieds(aldeia_id, category);
CREATE INDEX idx_aldeia_classifieds_available ON aldeia_classifieds(aldeia_id)
    WHERE status = 'available' AND is_deleted = false;
```

### 2.14 aldeia_partners (parceiros verificados)

```sql
CREATE TABLE aldeia_partners (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    owner_user_id   UUID REFERENCES users(id), -- Tutor que também é parceiro

    -- Identificação
    business_name   VARCHAR(200) NOT NULL,
    business_type   VARCHAR(20) NOT NULL
                    CHECK (business_type IN ('vet','pet_shop','groomer','walker','hotel','trainer','ong','other')),
    description     TEXT,
    cnpj            VARCHAR(18),              -- Ou equivalente no país
    logo_url        VARCHAR(500),

    -- Contato
    phone           VARCHAR(20),
    whatsapp        VARCHAR(20),
    email           VARCHAR(150),
    website         VARCHAR(300),

    -- Localização
    address         TEXT,
    location_lat    DECIMAL(10,7),
    location_lng    DECIMAL(10,7),

    -- Horário
    business_hours  JSONB,                    -- [{day, open, close}]

    -- Descontos
    discount_bronze INTEGER DEFAULT 5,
    discount_silver INTEGER DEFAULT 10,
    discount_gold   INTEGER DEFAULT 15,
    discount_diamond INTEGER DEFAULT 20,
    accepts_pet_credits BOOLEAN DEFAULT false,

    -- Avaliação
    avg_rating      DECIMAL(2,1) DEFAULT 0.0,
    total_reviews   INTEGER DEFAULT 0,

    -- Verificação
    verified_by     UUID REFERENCES users(id), -- Ancião que validou
    verified_at     TIMESTAMPTZ,
    is_verified     BOOLEAN DEFAULT false,

    -- Controle
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_aldeia_partners_aldeia ON aldeia_partners(aldeia_id, business_type);
CREATE INDEX idx_aldeia_partners_verified ON aldeia_partners(aldeia_id)
    WHERE is_verified = true AND is_active = true;
CREATE INDEX idx_aldeia_partners_location ON aldeia_partners USING gist (
    ST_SetSRID(ST_MakePoint(location_lng, location_lat), 4326)
);
```

### 2.15 aldeia_pet_credits_log (histórico de créditos)

```sql
CREATE TABLE aldeia_pet_credits_log (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL REFERENCES users(id),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),

    -- Transação
    amount          INTEGER NOT NULL,          -- Positivo = ganhou, negativo = gastou
    balance_after   INTEGER NOT NULL,          -- Saldo após transação

    -- Origem
    source_type     VARCHAR(20) NOT NULL
                    CHECK (source_type IN ('favor_given','favor_received','sos_responded',
                           'event_organized','donation','review','daily_active',
                           'partner_discount','achievement','avatar_interaction')),
    source_id       UUID,                      -- ID do favor, evento, etc.
    description     VARCHAR(200),

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_pet_credits_user ON aldeia_pet_credits_log(user_id, created_at DESC);
CREATE INDEX idx_pet_credits_aldeia ON aldeia_pet_credits_log(aldeia_id);
```

### 2.16 aldeia_health_alerts (alertas de saúde coletiva — IA)

```sql
CREATE TABLE aldeia_health_alerts (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),

    -- Detecção
    alert_type      VARCHAR(20) NOT NULL
                    CHECK (alert_type IN ('outbreak','poisoning','seasonal','parasite','behavioral')),
    severity        VARCHAR(10) NOT NULL DEFAULT 'medium'
                    CHECK (severity IN ('low','medium','high','critical')),

    -- Descrição
    title           VARCHAR(200) NOT NULL,
    description     TEXT NOT NULL,
    recommendation  TEXT NOT NULL,

    -- Dados da IA
    affected_pets   JSONB NOT NULL DEFAULT '[]', -- [pet_ids]
    affected_count  INTEGER NOT NULL,
    common_location VARCHAR(200),              -- Parque, rua, bairro
    common_symptoms JSONB,                     -- [{symptom, count}]
    confidence      DECIMAL(3,2),              -- 0.00 - 1.00
    ai_analysis     TEXT,                      -- Análise detalhada da IA

    -- Status
    is_active       BOOLEAN DEFAULT true,
    resolved_at     TIMESTAMPTZ,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_health_alerts_aldeia ON aldeia_health_alerts(aldeia_id, is_active);
CREATE INDEX idx_health_alerts_type ON aldeia_health_alerts(aldeia_id, alert_type);
```

### 2.17 aldeia_memorials (memoriais de pets falecidos)

```sql
CREATE TABLE aldeia_memorials (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),
    pet_id          UUID NOT NULL REFERENCES pets(id),
    created_by      UUID NOT NULL REFERENCES users(id),

    -- Dados do pet
    pet_name        VARCHAR(50) NOT NULL,
    pet_species     VARCHAR(3) NOT NULL CHECK (pet_species IN ('dog','cat')),
    pet_breed       VARCHAR(50),
    years_in_aldeia INTEGER,
    friends_count   INTEGER DEFAULT 0,
    favors_helped   INTEGER DEFAULT 0,
    events_attended INTEGER DEFAULT 0,
    photo_url       VARCHAR(500),

    -- Memorial
    ai_tribute      TEXT,                      -- Texto gerado pela IA
    book_of_memories_url VARCHAR(500),         -- PDF/link do livro gerado

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memorials_aldeia ON aldeia_memorials(aldeia_id);
CREATE INDEX idx_memorials_pet ON aldeia_memorials(pet_id);
```

### 2.18 aldeia_memorial_messages (mensagens no memorial)

```sql
CREATE TABLE aldeia_memorial_messages (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    memorial_id     UUID NOT NULL REFERENCES aldeia_memorials(id) ON DELETE CASCADE,
    author_id       UUID NOT NULL REFERENCES users(id),

    message         TEXT NOT NULL,
    is_avatar       BOOLEAN DEFAULT false,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_memorial_messages_memorial ON aldeia_memorial_messages(memorial_id);
```

### 2.19 aldeia_rankings (rankings mensais)

```sql
CREATE TABLE aldeia_rankings (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),

    -- Período
    ranking_month   DATE NOT NULL,             -- Primeiro dia do mês
    ranking_type    VARCHAR(20) NOT NULL
                    CHECK (ranking_type IN ('most_admired_pet','healthiest_pet','most_social_pet',
                           'most_dedicated_tutor','most_solidary_tutor')),

    -- Top 5
    rankings        JSONB NOT NULL,            -- [{position, user_id/pet_id, name, score, photo_url}]

    generated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE(aldeia_id, ranking_month, ranking_type)
);

CREATE INDEX idx_rankings_aldeia ON aldeia_rankings(aldeia_id, ranking_month DESC);
```

### 2.20 avatar_templates (templates por região/idioma)

```sql
CREATE TABLE avatar_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species         VARCHAR(3) NOT NULL CHECK (species IN ('dog', 'cat')),

    -- Localização
    country_code    VARCHAR(2) NOT NULL,
    region_code     VARCHAR(10),
    locale          VARCHAR(5) NOT NULL,

    -- Pet
    pet_name        VARCHAR(50) NOT NULL,
    breed           VARCHAR(50) NOT NULL,
    breed_local_name VARCHAR(50),
    age_years       INTEGER DEFAULT 2,
    weight_kg       DECIMAL(4,1),
    personality     JSONB NOT NULL,

    -- Tutor fictício
    tutor_first_name VARCHAR(50) NOT NULL,
    tutor_last_name VARCHAR(50) NOT NULL,
    tutor_persona   JSONB NOT NULL,

    -- Comportamento
    role_in_aldeia  VARCHAR(20) NOT NULL
                    CHECK (role_in_aldeia IN ('popular','mentor','vulnerable','adventurer','guardian','sickly',
                           'elegant','homebody','escapist','rescued')),
    writing_style   JSONB NOT NULL,
    vocabulary      JSONB NOT NULL,
    daily_schedule  JSONB NOT NULL,
    narration_style TEXT NOT NULL,

    -- Localização geográfica
    local_references JSONB NOT NULL,
    climate_zone    VARCHAR(20),
    unit_system     VARCHAR(10) DEFAULT 'metric'
                    CHECK (unit_system IN ('metric', 'imperial')),
    currency_symbol VARCHAR(5),

    -- Fotos
    photo_bank      JSONB NOT NULL DEFAULT '[]', -- [{url, context: 'profile'|'walk'|'home'|'friends'}]

    -- Controle
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avatar_templates_region ON avatar_templates(country_code, region_code, locale);
CREATE INDEX idx_avatar_templates_species ON avatar_templates(species);
```

### 2.21 avatar_interactions (log de interações tutor real × avatar)

```sql
CREATE TABLE avatar_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    real_user_id    UUID NOT NULL REFERENCES users(id),
    avatar_pet_id   UUID NOT NULL REFERENCES pets(id),
    aldeia_id       UUID NOT NULL REFERENCES aldeia_communities(id),

    interaction_type VARCHAR(30) NOT NULL
                    CHECK (interaction_type IN ('favor_accepted','favor_completed','walk_together',
                           'sos_response','event_joined','post_reacted','message_sent','match_accepted')),
    learning_point  VARCHAR(50),

    credits_earned  INTEGER DEFAULT 0,

    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_avatar_interactions_user ON avatar_interactions(real_user_id);
CREATE INDEX idx_avatar_interactions_aldeia ON avatar_interactions(aldeia_id);
```

### 2.22 Colunas extras em tabelas existentes

```sql
-- Na tabela pets: flags de avatar e social
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_avatar BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS avatar_template_id UUID REFERENCES avatar_templates(id);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS avatar_active BOOLEAN DEFAULT true;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS avatar_created_for UUID REFERENCES users(id);
ALTER TABLE pets ADD COLUMN IF NOT EXISTS aldeia_friends_count INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS aldeia_admirations INTEGER DEFAULT 0;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS is_deceased BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN IF NOT EXISTS deceased_at TIMESTAMPTZ;

-- Na tabela users: flags de avatar e Aldeia
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_avatar BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_persona JSONB;
ALTER TABLE users ADD COLUMN IF NOT EXISTS proof_of_love VARCHAR(10) DEFAULT 'none'
    CHECK (proof_of_love IN ('none','bronze','silver','gold','diamond'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS aldeia_id UUID REFERENCES aldeia_communities(id);
```

---

## 3. ORDEM DE CRIAÇÃO NO BANCO

Execute nesta ordem para evitar erros de dependência:

```
 1. ALTER TABLE users (adicionar colunas aldeia)
 2. ALTER TABLE pets (adicionar colunas avatar/social)
 3. CREATE TABLE aldeia_communities
 4. CREATE TABLE aldeia_members
 5. CREATE TABLE aldeia_events
 6. CREATE TABLE aldeia_sos
 7. CREATE TABLE aldeia_feed
 8. CREATE TABLE aldeia_feed_reactions
 9. CREATE TABLE aldeia_pet_graph
10. CREATE TABLE aldeia_favors
11. CREATE TABLE aldeia_sos_responses
12. CREATE TABLE aldeia_event_attendees
13. CREATE TABLE aldeia_reviews
14. CREATE TABLE aldeia_alerts
15. CREATE TABLE aldeia_classifieds
16. CREATE TABLE aldeia_partners
17. CREATE TABLE aldeia_pet_credits_log
18. CREATE TABLE aldeia_health_alerts
19. CREATE TABLE aldeia_memorials
20. CREATE TABLE aldeia_memorial_messages
21. CREATE TABLE aldeia_rankings
22. CREATE TABLE avatar_templates
23. CREATE TABLE avatar_interactions
24. CREATE todos os INDEX
25. ENABLE RLS em todas as tabelas
26. CREATE todas as POLICY
```

---

## 4. MAPA DE NOMES SQL → TYPESCRIPT

| Tabela | Coluna SQL | TypeScript | Tipo |
|--------|-----------|------------|------|
| aldeia_communities | id | id | string |
| aldeia_communities | name | name | string |
| aldeia_communities | center_lat | centerLat | number |
| aldeia_communities | center_lng | centerLng | number |
| aldeia_communities | total_members | totalMembers | number |
| aldeia_communities | is_fully_real | isFullyReal | boolean |
| aldeia_members | level | level | AldeiaLevel |
| aldeia_members | karma_score | karmaScore | number |
| aldeia_members | trust_score | trustScore | number |
| aldeia_members | pet_credits | petCredits | number |
| aldeia_members | favors_given | favorsGiven | number |
| aldeia_feed | content_type | contentType | FeedContentType |
| aldeia_feed | admirations_count | admirationsCount | number |
| aldeia_feed | is_story | isStory | boolean |
| aldeia_pet_graph | relationship | relationship | PetRelationship |
| aldeia_pet_graph | compatibility_score | compatibilityScore | number |
| aldeia_favors | favor_type | favorType | FavorType |
| aldeia_favors | status | status | FavorStatus |
| aldeia_favors | credits_offered | creditsOffered | number |
| aldeia_sos | sos_type | sosType | SosType |
| aldeia_sos | search_phase | searchPhase | number |
| aldeia_sos | proxy_data | proxyData | ProxyData |
| aldeia_partners | business_type | businessType | BusinessType |
| aldeia_partners | is_verified | isVerified | boolean |
| aldeia_health_alerts | severity | severity | Severity |
| aldeia_health_alerts | confidence | confidence | number |

### Valores permitidos (CHECK constraints resumo):

```typescript
type AldeiaLevel = 'observer' | 'member' | 'guardian' | 'elder' | 'founder';
type TutorTitle = 'novato' | 'dedicado' | 'exemplar' | 'referencia' | 'guardiao' | 'lendario';
type FeedContentType = 'post' | 'story' | 'alert' | 'event_share' | 'achievement' | 'ai_generated';
type ReactionType = 'admire' | 'comment';
type PetRelationship = 'best_friend' | 'friend' | 'acquaintance' | 'neutral' | 'avoid';
type FavorType = 'walk' | 'care' | 'transport' | 'feeding' | 'grooming' | 'other';
type FavorStatus = 'open' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'expired';
type SosType = 'medical' | 'lost_pet' | 'urgent_help';
type SosStatus = 'active' | 'responding' | 'resolved' | 'cancelled';
type SosResponseType = 'on_my_way' | 'can_help' | 'sighting' | 'info' | 'found';
type EventType = 'walk' | 'fair' | 'vaccination' | 'social' | 'rescue' | 'workshop' | 'adoption';
type EventStatus = 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
type AlertType = 'danger' | 'warning' | 'info' | 'lost_pet' | 'found_pet' | 'noise' | 'health';
type ClassifiedCategory = 'food' | 'medicine' | 'accessory' | 'toy' | 'carrier' | 'clothing' | 'other';
type OfferType = 'donation' | 'exchange' | 'lend';
type BusinessType = 'vet' | 'pet_shop' | 'groomer' | 'walker' | 'hotel' | 'trainer' | 'ong' | 'other';
type HealthAlertType = 'outbreak' | 'poisoning' | 'seasonal' | 'parasite' | 'behavioral';
type Severity = 'low' | 'medium' | 'high' | 'critical';
type AvatarRole = 'popular' | 'mentor' | 'vulnerable' | 'adventurer' | 'guardian' | 'sickly'
               | 'elegant' | 'homebody' | 'escapist' | 'rescued';
type ProofOfLove = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond';
type CreditSource = 'favor_given' | 'favor_received' | 'sos_responded' | 'event_organized'
                  | 'donation' | 'review' | 'daily_active' | 'partner_discount'
                  | 'achievement' | 'avatar_interaction';
```

---

## 5. RESUMO

| Categoria | Tabelas | Total colunas |
|-----------|---------|---------------|
| Core | aldeia_communities, aldeia_members | ~55 |
| Feed | aldeia_feed, aldeia_feed_reactions | ~25 |
| Social | aldeia_pet_graph | ~12 |
| Favores | aldeia_favors, aldeia_reviews | ~35 |
| SOS | aldeia_sos, aldeia_sos_responses | ~35 |
| Eventos | aldeia_events, aldeia_event_attendees | ~25 |
| Alertas | aldeia_alerts, aldeia_health_alerts | ~25 |
| Economia | aldeia_classifieds, aldeia_partners, aldeia_pet_credits_log | ~50 |
| Memorial | aldeia_memorials, aldeia_memorial_messages | ~18 |
| Rankings | aldeia_rankings | ~6 |
| Avatares | avatar_templates, avatar_interactions | ~30 |
| Alterações | pets (+8 colunas), users (+4 colunas) | ~12 |
| **TOTAL** | **22 tabelas** | **~328 colunas** |
