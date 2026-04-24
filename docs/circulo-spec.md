# Círculo — reframe do módulo social (antiga Aldeia) para posicionamento Elite

> **Status:** spec ativa — 2026-04-23
> **Substitui:** `docs/aldeia-spec.md` (deprecada, mantida como referência histórica)
> **Fase:** pós-MVP — não construir antes do core Elite estabilizar
> **Origem:** Pilar 4 do plano de posicionamento Elite (`docs/elite/posicionamento/2026-04-22_plano_elite_auexpert.md`)

---

## 1. Conceito

A Aldeia original era "rede solidária hiperlocal" — 22 tabelas, Pet-Credits, favores, feed comunitário, grafo social, avatares IA pra cold start. Esse produto dentro do produto falava para o tutor de classe média engajada, não para a elite.

**Elite não pede favor pro vizinho — contrata dog walker. Não troca ração — compra a melhor. Não quer feed comunitário misturando pets aleatórios — quer curadoria.**

O Círculo é o que sobra quando se aplica o filtro Elite à Aldeia:

- Curadoria editorial, não feed público
- Acesso por convite apenas
- Parceiros verificados, não comunidade aberta
- Zero mecânica transacional (Pet-Credits, favores, SOS comunitário)

---

## 2. O que o Círculo OFERECE

### 2.1 Editorial curado (substitui "feed")

Uma seção "Círculo" que funciona como pequena revista mensal:

- **Perfis mensais de tutores interessantes** — entrevistas curtas, bem escritas, com foto profissional. Tema: a relação com o pet, não auto-promoção.
- **Lista curada de veterinários parceiros** por cidade — especialidade, link para agendamento direto, credenciais visíveis.
- **Hotéis pet-friendly premium, spas, passeios** — indicação por cidade, revisados pelo editor.
- **Eventos exclusivos** — feira de criadores éticos, workshop de comportamento animal com nome reconhecido, curadoria fechada.

### 2.2 Rede de clínicas parceiras para viagens

Tutor que viaja pra Trancoso tem, no Círculo, a indicação da melhor clínica da região caso precise. Dados: nome, endereço, telefone 24h, especialidades, credencial veterinária responsável. Curadoria manual do editor — não auto-cadastro.

### 2.3 Memoriais de pets (substitui `aldeia_memorials`)

Memorial privado ou compartilhável por URL assinado (sem login). Sem feed público, sem comentários abertos — apenas a família e convidados específicos.

### 2.4 Eventos com RSVP fechado

Eventos criados pelo editorial ou por tutores verificados. RSVP por convite. Sem feed aberto.

---

## 3. O que o Círculo NÃO tem (removido da Aldeia original)

Corte explícito para o posicionamento Elite:

- **Pet-Credits** — economia comunitária de favores foi descartada. Elite não gamifica reciprocidade.
- **Favores** (passeio, creche, transporte, alimentação, grooming) — contratar serviço resolve melhor.
- **SOS comunitário público** — elite com emergência liga pro vet particular ou concierge, não pede ajuda pro bairro. Proxy de prontuário médico continua existindo no core (compartilhamento via URL temporária com vet de confiança), não como broadcast.
- **Feed público misturando pets** — nunca. Curadoria editorial sempre.
- **Grafo social entre pets** — amizade entre pets como mecânica — fora de escopo. Se dois pets se conheceram na pracinha, o tutor escreve no diário, a IA registra. Não precisa de grafo social gamificado.
- **Rankings e leaderboards** — fora. Elite não coleciona pontos.
- **Avatares IA para cold start** — não. Se a rede começar vazia, começa vazia — curadoria editorial preenche.
- **Alertas comunitários de saúde por epidemiologia coletiva** — interessante tecnicamente, mas viola privacidade do tipo de tutor elite. Se for implementado no futuro, é opt-in explícito e anonimizado.
- **Classificados solidários** (doação, troca, empréstimo) — fora.
- **Avaliações mútuas pós-favor** — fora, porque favor é fora.
- **Cartão QR compartilhável do pet** — movido pro core do app (carteirinha), não Círculo.
- **Retrospectiva anual com avatar social** — movido pro Pilar 6 como feature standalone.

---

## 4. Modelo de dados — 8 tabelas (era 22)

```
-- Membros
circulo_members
  id                uuid PK
  user_id           uuid FK → public.users
  invited_by        uuid FK → public.users (nullable — founder invites are NULL)
  invited_at        timestamptz
  joined_at         timestamptz (nullable until accepted)
  status            check IN ('invited', 'active', 'left')
  region            text  -- cidade / estado pra curadoria editorial regional
  bio_short         text  -- exibido no diretório se ativo
  show_in_directory boolean default false
  is_active         boolean default true
  created_at        timestamptz default now()

-- Conteúdo editorial (substitui feed)
circulo_editorial_posts
  id            uuid PK
  slug          text UNIQUE  -- URL amigável
  type          check IN ('profile', 'interview', 'essay', 'calendar', 'event_feature')
  title         text
  subtitle      text
  author_name   text   -- nome público do autor (pode ser editor ou tutor entrevistado)
  body_md       text   -- Markdown
  hero_image_url text
  published_at  timestamptz
  region        text   -- opcional, se relevante geograficamente
  tags          text[]
  is_active     boolean default true
  created_at    timestamptz default now()

-- Eventos (curados)
circulo_events
  id              uuid PK
  title           text
  description_md  text
  type            check IN ('fair', 'workshop', 'talk', 'social', 'exhibition')
  starts_at       timestamptz
  ends_at         timestamptz
  location_name   text
  location_gps    point  -- pgcrypto encriptado? avaliar
  region          text
  capacity        int    -- nullable = ilimitado
  curated_by      text   -- nome do editor responsável
  cover_url       text
  is_active       boolean default true
  created_at      timestamptz default now()

-- RSVP de eventos
circulo_event_rsvps
  id           uuid PK
  event_id     uuid FK → circulo_events ON DELETE CASCADE
  member_id    uuid FK → circulo_members
  status       check IN ('yes', 'maybe', 'no')
  responded_at timestamptz
  is_active    boolean default true

-- Diretório de parceiros verificados
circulo_partners
  id               uuid PK
  name             text
  type             check IN ('vet_clinic', 'vet_hospital', 'grooming', 'hotel', 'spa', 'trainer', 'walker', 'pet_shop')
  region           text
  address          text
  phone            text  -- 24h se aplicável
  emergency_phone  text
  specialties      text[]
  vet_crmv         text  -- se aplicável — visivel
  curator_notes    text  -- por que entrou no Círculo
  verified_at      timestamptz
  is_active        boolean default true
  created_at       timestamptz default now()

-- Diretório veterinário específico (subset de partners, mas com metadados clínicos)
circulo_vets_directory
  id            uuid PK
  partner_id    uuid FK → circulo_partners
  vet_full_name text
  crmv          text
  specialties   text[]  -- dermatologia, cardiologia, etc
  languages     text[]  -- ['pt-BR', 'en'] — útil pra tutor estrangeiro
  teleconsulta  boolean default false
  is_active     boolean default true

-- Diretório hotéis pet-friendly (subset de partners, com metadados hoteleiros)
circulo_hotels_directory
  id            uuid PK
  partner_id    uuid FK → circulo_partners
  hotel_name    text
  city          text
  country       text
  price_tier    check IN ('$$', '$$$', '$$$$')  -- Elite: só aceita $$$ e $$$$
  pet_services  text[]  -- ['sitter_on_site', 'dog_park', 'spa_pet', 'vet_oncall']
  max_pet_size  check IN ('small', 'medium', 'large')
  notes_md      text
  is_active     boolean default true

-- Memoriais (substitui aldeia_memorials)
circulo_memorials
  id                uuid PK
  pet_id            uuid FK → pets (pet já falecido, marcado is_deceased=true)
  tutor_id          uuid FK → public.users
  title             text  -- "Em memória de Rex"
  body_md           text  -- obituário literário
  cover_url         text
  gallery_urls      text[]
  share_token       text UNIQUE  -- para URL pública temporária
  share_expires_at  timestamptz
  visibility        check IN ('private', 'invite_only', 'unlisted_link')
  is_active         boolean default true
  created_at        timestamptz default now()
```

**RLS:** todas com RLS ativo. Princípio geral: só membros ativos do Círculo leem conteúdo editorial e eventos; memorials seguem visibility do dono.

---

## 5. Edge Functions necessárias

- `circulo-invite-create` — gerar convite (rate limit: max 3 por membro por semana).
- `circulo-invite-accept` — aceitar convite, migrar status `invited` → `active`.
- `circulo-event-rsvp` — responder RSVP a evento.
- `circulo-memorial-share-link` — gerar URL temporária assinada para memorial compartilhável.

Nenhuma EF para favores, SOS, Pet-Credits, rankings, grafo social — essas features foram cortadas.

---

## 6. Telas (pós-MVP — 5 telas em vez de 13)

1. **Círculo — home** (editorial mensal + próximos eventos + destaques regionais)
2. **Perfil de parceiro** (clínica, hotel, etc — sem comentários públicos)
3. **Detalhes de evento** (descrição + RSVP + mapa)
4. **Diretório** (filtro por tipo e região)
5. **Memorial** (privado ou via link compartilhado)

Sem feed, sem SOS, sem favores, sem rankings, sem avatares IA.

---

## 7. Onboarding no Círculo

- **Primeiro ano:** todos tutores Elite ativos são convidados automaticamente ao aceitarem o termo de uso do Círculo.
- **Depois:** convite por membro existente (máx 3 por mês, sem economia de pontos).
- **Não aceita fila de espera pública.** Entrada é contratual/editorial.

---

## 8. Conteúdo editorial mensal — ritmo

- 1 perfil de tutor/pet (entrevista, ~1500 palavras)
- 1 ensaio do editorial ou de um conselheiro (quando o Conselho Clínico voltar ao escopo)
- 1 agenda de eventos do mês
- 1 destaque regional (sugestão de vet/hotel/passeio por cidade grande)

Total: 4 peças/mês. Editor: profissional contratado (freelance inicial, in-house após 2.000 membros ativos).

---

## 9. O que a Aldeia original preservou mesmo no Círculo (ponte de migração)

Se decidir preservar dados antigos da `aldeia_*` (caso tenham sido populados em teste):

- `aldeia_memorials` → migra para `circulo_memorials` com transformação simples (mesmo schema)
- `aldeia_partners` (tipo `vet`, `pet_shop`, `hotel`, `grooming`) → migra para `circulo_partners` descartando campos de rating comunitário
- Todo o resto (22 − 2 = 20 tabelas) **não migra** — é descartado

Ver `docs/aldeia-spec.md` (agora deprecado) para o modelo original e decidir migração manualmente se necessário.

---

## 10. Relação com o core Elite

O Círculo **não substitui** nenhuma feature do core. O core Elite (Diário, Prontuário, Análise de Foto, Retrospectiva, Plano de Legado) funciona sem o Círculo. O Círculo é layer editorial opcional que acompanha a assinatura — não é o produto principal.

**Decisão de produto:** se Círculo for cortado no futuro, o core Elite sobrevive. Se core Elite for cortado, não há produto. Priorizar core em qualquer conflito de roadmap.

---

## 11. Timeline sugerida (quando for o momento)

Não construir antes do core Elite estabilizar (Retrospectiva, Carta, Legado, Viagem, Atestado — Pilar 6 do plano de posicionamento).

Estimativa quando começar: **3-4 semanas** de dev + 2 semanas de onboarding editorial (contratar editor, fechar primeiras 3 pautas, design das telas).

---

## 12. Decisões em aberto (precisam do Belisario antes de começar)

1. **Nome definitivo.** "Círculo" é provisório. Alternativas: "Curadoria", "Edição", "Biblioteca", "Revista auExpert", "Salão".
2. **Modelo de convite inicial.** Todo tutor Elite ganha convite, ou seleção por critério (tempo de assinatura, engajamento, região)?
3. **Preço.** Círculo está embutido no plano Elite de R$ 129/mês, ou é add-on opcional (R$ 29/mês adicional)?
4. **Editor.** Contratar freelance (R$ 4-6k/mês) ou o próprio Belisario escreve no primeiro ano?
5. **Geografia.** Começar com SP + RJ + BH, ou só SP primeiro?
