# ALDEIA VIVA — Sistema de Avatares IA
## Resolvendo o problema da Aldeia vazia no lançamento

> "O tutor nunca deve ver uma Aldeia vazia.
> Quando ele chega, a comunidade já está lá — viva, ativa, acolhedora."

---

## 1. O PROBLEMA

Todo app social morre no lançamento por um motivo:

```
Tutor se cadastra → Abre a Aldeia → Vazia → "Ninguém aqui" → Desinstala

Isso cria um ciclo mortal:
Ninguém usa → Aldeia vazia → Ninguém quer entrar → App morre
```

A solução clássica é "convidar amigos" — mas ninguém convida amigos pra um app vazio.

---

## 2. A SOLUÇÃO: ALDEIA VIVA

Quando um tutor se cadastra, a IA cria instantaneamente ao redor dele
uma Aldeia viva com **pets avatares** — animais fictícios com personalidade,
história, rotina e comportamento simulados pela IA.

```
Tutor Ana se cadastra em Salto, SP
    │
    ├── IA detecta: Aldeia Salto tem 0 tutores reais
    │
    ├── IA cria instantaneamente:
    │   ├── Thor (Golden, 2 anos, 500m de distância)
    │   ├── Mel (Poodle, 4 anos, 300m)
    │   ├── Bob (SRD, 7 anos, 800m)
    │   ├── Luna (Siamês, 1 ano, 200m)
    │   ├── Simba (Persa, 3 anos, 600m)
    │   ├── Nina (Labrador, 5 anos, 1km)
    │   ├── Pipoca (Vira-lata, 2 anos, 400m)
    │   └── Miau (Bengal, 1 ano, 700m)
    │
    └── Ana abre a Aldeia → "Aldeia Salto — 8 pets na sua vizinhança!"
        Mapa com pins, feed ativo, eventos acontecendo
```

**Ana não sabe que são avatares.** Para ela, a Aldeia está viva.

---

## 3. COMO OS AVATARES FUNCIONAM

### 3.1 Cada avatar é um pet completo com IA

O avatar não é um boneco estático. Ele tem:

| Atributo | Exemplo (Thor) |
|---|---|
| Nome | Thor |
| Espécie | Cão |
| Raça | Golden Retriever |
| Idade | 2 anos |
| Peso | 35 kg |
| Personalidade | Brincalhão, energético, sociável |
| Humor atual | Feliz (muda ao longo do dia) |
| Tutor fictício | Carlos Mendes |
| Localização | ~500m do tutor real (genérica, não exata) |
| Foto | Gerada por IA ou banco de imagens livres |
| Rotina | Passeia 7h e 18h, come 8h e 19h, dorme 22h |
| Diário ativo | Sim — entradas geradas pela IA diariamente |
| Última narração | "Hoje corri tanto no parque que dormi na grama" |

### 3.2 Os avatares agem sozinhos

A IA simula comportamento realista ao longo do dia:

```
07:00 — Thor "saiu para passear" (aparece no mapa em movimento)
07:30 — Thor "postou no feed": "Manhã gelada mas valeu o passeio"
09:00 — Thor "analisou foto": saúde IA 95%
12:00 — Mel "pediu ajuda": "Alguém pode passear com a Mel às 14h?"
14:00 — Bob "respondeu": "Eu posso! Moro perto"
15:00 — Bob "passeou com Mel" (evento registrado)
16:00 — Luna "criou evento": "Encontro de gatos — Sábado 10h"
18:00 — Thor "voltou do segundo passeio"
20:00 — Pipoca "alertou": "Cuidado, fogos no bairro centro"
```

O tutor real vê tudo isso acontecendo. A Aldeia parece viva.

### 3.3 Os avatares interagem com o tutor real

Isso é o mais importante — não são NPCs passivos:

**Avatar pede ajuda ao tutor real:**
```
Mel (Poodle, 300m de você):
"Minha tutora precisa de alguém para passear comigo amanhã às 15h.
 Você pode ajudar? (+15 Pet-Credits)"

[Aceitar]  [Não posso]
```

Se o tutor aceitar, a IA simula o favor completo:
- Confirmação
- "Mel está te esperando no portão"
- "Passeio concluído! Mel voltou feliz"
- Avaliação positiva automática do tutor fictício
- Pet-Credits creditados

**O tutor APRENDE como a Aldeia funciona fazendo de verdade** — só que com avatares.

**Avatar sugere match:**
```
IA sugere: "Rex e Thor têm 92% de compatibilidade!
Thor passeia às 7h perto do Parque Central.
Querem passear juntos?"
```

**Avatar responde ao SOS do tutor:**
Se o tutor testar o SOS:
```
Ana ativa SOS: "Rex está passando mal"

Em 30 segundos:
Carlos (tutor do Thor): "Estou a 500m, posso ajudar!"
Paula (tutora da Mel): "Dr. Marcos na VetAmigo é ótimo,
  fica a 1km de você. Telefone: (11) 4028-1234"
```

O tutor experimenta o SOS funcionando e sente o valor.

### 3.4 Feed da Aldeia sempre com conteúdo

Os avatares mantêm o feed vivo com conteúdo relevante:

```
🐾 Thor acabou de passear no Parque Central
   "Hoje estava ventando bastante. Corri atrás de uma folha
    por 10 minutos. A vida é boa."
   ❤️ 3 curtidas

🐱 Luna está calma hoje
   Saúde IA: 98% · Humor: Calma

📢 Bob alerta: "Cuidado, bueiro aberto na Rua XV"
   📍 Rua XV, próximo ao número 340

🎉 Evento: Encontro da Aldeia no Parque
   Sábado 8h · 5 confirmados
   [Confirmar presença]

🎁 Mel tem ração sobrando
   "Royal Canin Poodle, 3kg fechado, validade 08/2026"
   [Quero!]
```

---

## 4. O TUTOR NÃO SABE QUE SÃO AVATARES?

### 4.1 A ética da transparência

**Opção A — Transparência total (recomendada):**

Na primeira vez que o tutor abre a Aldeia:

```
"Bem-vindo à Aldeia Salto! 🐾

Sua Aldeia está começando. Para você já sentir como
funciona, criamos companheiros de aprendizado — pets
e tutores virtuais que simulam a comunidade real.

Eles vão te ensinar a:
• Pedir e oferecer ajuda
• Participar de eventos
• Usar o SOS
• Ganhar Pet-Credits

Conforme tutores reais se cadastrarem na sua região,
os companheiros de aprendizado vão dando lugar a
vizinhos de verdade.

[Conhecer minha Aldeia]
```

**Os avatares têm um badge sutil:**
- Ícone sparkle roxo (IA) no canto do avatar
- Ao clicar no perfil: "Companheiro de aprendizado — Pet simulado por IA"
- Tooltip discreto, não atrapalha a experiência

### 4.2 Por que transparência é melhor

- Evita sensação de "fui enganado" quando descobrir
- O tutor valoriza a tecnologia ("a IA criou tudo isso!")
- Reforça o diferencial do auExpert (IA que ninguém tem)
- Legalmente mais seguro
- "Companheiro de aprendizado" soa premium, não fake

---

## 5. TRANSIÇÃO: AVATARES → TUTORES REAIS

### 5.1 O desaparecimento gradual

Conforme tutores reais entram na Aldeia, os avatares saem gradualmente:

```
Aldeia Salto — Evolução

Mês 0 (lançamento):
8 avatares + 1 tutor real (Ana)
Ana vê: "9 tutores na Aldeia Salto"

Mês 1:
6 avatares + 5 tutores reais
Avatares mais distantes desaparecem primeiro

Mês 2:
3 avatares + 12 tutores reais
Só avatares complementares permanecem

Mês 3+:
0 avatares + 20+ tutores reais
Aldeia 100% real — avatares não são mais necessários
```

### 5.2 Regras de transição

| Tutores reais na Aldeia | Avatares ativos | Comportamento |
|---|---|---|
| 0-2 | 8-10 | Avatares bem ativos, interagem muito |
| 3-5 | 5-7 | Avatares reduzem atividade gradualmente |
| 6-10 | 2-4 | Só avatares em nichos não cobertos |
| 11-20 | 0-2 | Praticamente só reais, 1-2 avatares de nicho |
| 21+ | 0 | Aldeia 100% real, avatares desativados |

### 5.3 Avatares inteligentes de nicho

Mesmo com tutores reais, a IA pode manter avatares estratégicos:

**Se a Aldeia não tem gato:**
Mantém 1-2 avatares de gato para que tutores de gato se sintam incluídos.

**Se a Aldeia não tem cão grande:**
Mantém 1 avatar de cão grande para diversidade.

**Se ninguém oferece lar temporário:**
Avatar "Paula" oferece lar temporário, mostrando que é possível.

**A ideia:** avatares preenchem lacunas que a comunidade real ainda não cobre.

### 5.4 A despedida do avatar

Quando um avatar é substituído por tutor real:

```
"Thor se mudou da Aldeia Salto!
 Mas não se preocupe — Bruno e seu Golden Max
 acabaram de chegar na vizinhança.
 Bruno é real e mora a 600m de você!"
```

Ou mais sutilmente: o avatar simplesmente para de postar e some do mapa
em 7 dias. Sem drama, sem notificação.

---

## 6. O QUE O TUTOR APRENDE COM OS AVATARES

### 6.1 Tutorial vivencial (não tutorial chato)

Em vez de telas de "como usar o app" que ninguém lê:

```
TUTORIAL TRADICIONAL (chato):
"Toque aqui para pedir ajuda"
"Toque aqui para ver o mapa"
"Toque aqui para criar evento"
→ Tutor pula tudo e não aprende nada

TUTORIAL VIVENCIAL COM AVATARES (auExpert):
Dia 1: Mel pede ajuda → tutor experimenta "aceitar favor"
Dia 2: Thor sugere passeio → tutor experimenta "match"
Dia 3: Bob alerta perigo → tutor experimenta "alertas"
Dia 4: Luna cria evento → tutor experimenta "eventos"
Dia 5: SOS simulado → tutor experimenta "emergência"
Dia 7: Resumo: "Você já sabe usar a Aldeia! Esta semana
        você fez 3 favores, participou de 1 evento e
        ganhou 45 Pet-Credits."
→ Tutor aprendeu tudo fazendo, não lendo
```

### 6.2 Jornada dos primeiros 7 dias (cronograma de avatares)

| Dia | O que acontece | O que o tutor aprende |
|---|---|---|
| 1 | Avatar Mel pede favor simples | Como aceitar e completar favores |
| 1 | Feed mostra posts de avatares | Como o feed funciona |
| 2 | Avatar Thor sugere passeio junto | Como funciona o match de afinidade |
| 2 | Avatar posta narração IA do diário | Que pets "narram" suas experiências |
| 3 | Avatar Bob posta alerta de perigo | Como alertas comunitários funcionam |
| 3 | Avatar Luna cria evento | Como participar de eventos |
| 4 | Avatar oferece item no classificado | Como funciona troca solidária |
| 4 | Tutor recebe primeiro Pet-Credits | Entende o sistema de recompensa |
| 5 | SOS simulado: "Pet perdido na região" | Como o SOS funciona (sem risco real) |
| 5 | Avatares participam da busca | Vê a busca coletiva em ação |
| 6 | IA mostra mapa de humor da Aldeia | Entende contágio emocional |
| 6 | Avatar veterinário parceiro oferece desconto | Entende parceiros verificados |
| 7 | Resumo da semana com tudo que aprendeu | Sensação de competência e pertencimento |

### 6.3 Milestone de graduação

Após 7 dias ou quando completar as ações-chave:

```
🎓 Parabéns, Ana!

Você se formou na Aldeia de Aprendizado!

Nesta semana você:
✅ Aceitou 3 favores
✅ Participou de 1 evento
✅ Respondeu a 1 SOS
✅ Ganhou 45 Pet-Credits
✅ Rex fez 2 amigos

Agora você está pronta para a Aldeia de verdade.
Conforme vizinhos reais forem chegando, sua
comunidade vai crescer.

Nível: Membro da Aldeia Salto
```

---

## 7. TIPOS DE AVATARES

### 7.1 Perfis pré-definidos (banco de personalidades)

A IA não cria do nada — tem templates de personalidade:

#### Cães

| Avatar | Raça | Personalidade | Papel na Aldeia |
|---|---|---|---|
| Thor | Golden Retriever | Sociável, energético, brincalhão | O popular — faz amizade com todos |
| Bob | SRD Vira-lata | Calmo, sábio, idoso | O mentor — dá dicas para novatos |
| Nina | Labrador | Ativa, companheira, medrosa com trovão | A vulnerável — mostra que pedir ajuda é ok |
| Pipoca | SRD pequeno | Travesso, curioso, fugitivo | O aventureiro — simula pet perdido para SOS |
| Max | Pastor Alemão | Protetor, leal, disciplinado | O guardião — responde a todos os SOS |
| Bela | Bulldog Francês | Preguiçosa, carinhosa, com problemas respiratórios | A doentinha — mostra uso do prontuário |

#### Gatos

| Avatar | Raça | Personalidade | Papel na Aldeia |
|---|---|---|---|
| Luna | Siamês | Independente, vocal, curiosa | A elegante — cria eventos sociais |
| Simba | Persa | Calmo, indoor, peludo | O caseiro — mostra cuidado doméstico |
| Miau | Bengal | Ativo, brincalhão, escapa de casa | O fujão — simula busca de gato |
| Nuvem | SRD branco | Tímido, resgatado, com trauma | O resgatado — conecta com ONGs |

#### Tutores fictícios

| Tutor | Pet | Personalidade | Papel |
|---|---|---|---|
| Carlos | Thor | Esportista, sempre no parque | Convida para passeios |
| Paula | Mel | Mãe solo, precisa de ajuda | Pede favores, mostra vulnerabilidade |
| João | Bob | Aposentado, muito tempo livre | Sempre disponível, responde SOS |
| Maria | Luna | Veterinária aposentada | Dá dicas de saúde no feed |
| Pedro | Pipoca | Jovem, distraído, pet foge | Gera SOS de pet perdido |
| Lúcia | Nina | Viaja muito a trabalho | Pede cuidado quando viaja |

### 7.2 Variedade regional

A IA adapta os avatares à região do tutor:

**Brasil — interior de SP:**
- Nomes brasileiros (Thor, Bob, Pipoca)
- Raças comuns no Brasil (SRD, Labrador, Poodle)
- Referências locais ("Parque Municipal", "Praça da Igreja")
- Português natural brasileiro

**Brasil — Rio de Janeiro:**
- "Passeio na orla de Copacabana"
- Mais gatos de apartamento
- Referências a calçadão, praia

**Brasil — Sul:**
- Raças de clima frio (Husky aparece)
- "Hoje nevou e o Thor amou"

**Internacional (en-US):**
- Nomes americanos (Buddy, Max, Bella)
- "Walk in Central Park"
- Medidas em lbs

---

## 8. AVATARES COMO DEMONSTRAÇÃO PARA PARCEIROS

### 8.1 Parceiro entra e vê atividade

Quando um veterinário ou pet shop quer ser parceiro:

```
"Aldeia Salto — 9 tutores, 12 pets
 32 passeios esta semana
 5 vacinas precisam ser feitas
 2 pets com peso acima do ideal
 → Seus potenciais clientes!"
```

O parceiro vê atividade real (mesmo que parte seja avatares).
Isso convence a entrar. E quando entrar, traz tutores reais.

### 8.2 Efeito multiplicador

```
Avatares atraem tutores reais
    → Tutores reais atraem parceiros
        → Parceiros atraem mais tutores
            → Mais tutores substituem mais avatares
                → Aldeia 100% real
```

Os avatares são a faísca que inicia o fogo.

---

## 9. AVATARES NO RAG E DIÁRIO

### 9.1 Interações com avatares alimentam o RAG do pet real

Quando Rex passeia com Thor (avatar):

```
Embedding gerado:
"Rex passeou com Thor (Golden) no Parque Central em 20/04/2026.
 Rex ficou feliz e brincou por 40 minutos."
```

A IA usa isso nas narrações futuras:
"Hoje encontrei o Thor no parque de novo. É meu 3º passeio com ele."

### 9.2 Quando Thor vira real

Se um tutor real com Golden Retriever se cadastra na região:

- Thor (avatar) é desativado
- O novo Golden real herda a "posição social" do Thor no grafo
- A IA faz a transição suavemente:
  "O Thor se mudou, mas chegou o Max que é igualzinho.
   Acho que vamos ser amigos também."

### 9.3 Memórias com avatares permanecem

Mesmo após o avatar sumir, as memórias ficam no RAG:
"Rex brincou com Thor no parque em abril de 2026"

A IA pode referenciar:
"Saudade do Thor. Mas o Max é legal também."

Isso dá profundidade emocional e continuidade narrativa.

---

## 10. CONFIGURAÇÃO TÉCNICA

### 10.1 Banco de dados

```sql
-- Flag na tabela de pets
ALTER TABLE pets ADD COLUMN is_avatar BOOLEAN DEFAULT false;
ALTER TABLE pets ADD COLUMN avatar_template VARCHAR(30);
ALTER TABLE pets ADD COLUMN avatar_active BOOLEAN DEFAULT true;
ALTER TABLE pets ADD COLUMN avatar_created_for UUID REFERENCES users(id);

-- Flag na tabela de users (tutores fictícios)
ALTER TABLE users ADD COLUMN is_avatar BOOLEAN DEFAULT false;
ALTER TABLE users ADD COLUMN avatar_persona JSONB;

-- Tabela de templates de avatar
CREATE TABLE avatar_templates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    species         VARCHAR(3) NOT NULL CHECK (species IN ('dog', 'cat')),
    name            VARCHAR(50) NOT NULL,
    breed           VARCHAR(50) NOT NULL,
    personality     JSONB NOT NULL,          -- {traits, energy, sociability}
    tutor_name      VARCHAR(50) NOT NULL,
    tutor_persona   JSONB NOT NULL,          -- {age, occupation, personality}
    role_in_aldeia  VARCHAR(30) NOT NULL,     -- 'popular', 'mentor', 'vulnerable', etc.
    daily_schedule  JSONB NOT NULL,          -- [{hour, action, mood}]
    narration_style TEXT NOT NULL,            -- Como a IA narra para este avatar
    region_tags     JSONB DEFAULT '["general"]',
    locale          VARCHAR(5) DEFAULT 'pt-BR',
    is_active       BOOLEAN DEFAULT true,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Log de interações tutor real × avatar
CREATE TABLE avatar_interactions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    real_user_id    UUID NOT NULL REFERENCES users(id),
    avatar_pet_id   UUID NOT NULL REFERENCES pets(id),
    interaction_type VARCHAR(30) NOT NULL,    -- 'favor_accepted', 'walk_together', 'sos_response', 'event_joined'
    learning_point  VARCHAR(50),              -- 'how_favors_work', 'how_sos_works', etc.
    pet_credits_earned INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ DEFAULT NOW()
);
```

### 10.2 Edge Function: populate-aldeia-avatars

```
Trigger: Quando novo usuário se cadastra e a Aldeia tem < 10 tutores reais

Input: { user_id, user_location, user_language, user_pet_species }

Fluxo:
1. Contar tutores reais na Aldeia do usuário
2. Se < 10: calcular quantos avatares criar (10 - reais)
3. Selecionar templates do banco:
   - Variar espécies (se tutor tem cão, incluir gatos e vice-versa)
   - Variar personalidades (popular, mentor, vulnerável, aventureiro)
   - Adaptar nomes e referências ao locale
4. Criar pets avatares com is_avatar = true
5. Criar tutores avatares com is_avatar = true
6. Distribuir no mapa (raio 200m - 1.5km do tutor real)
7. Iniciar schedule de ações diárias
8. Gerar primeiro post no feed de cada avatar

Tempo: ~5 segundos (roda em background)
```

### 10.3 Edge Function: avatar-daily-simulation

```
Trigger: Cron job a cada 2 horas

Fluxo:
1. Para cada Aldeia com avatares ativos:
   a. Verificar hora local
   b. Para cada avatar, consultar daily_schedule
   c. Se há ação programada para esta hora:
      - Gerar post no feed
      - Atualizar humor
      - Simular interação (passeio, alerta, evento)
      - Se tem favor pendente, gerar novo pedido
   d. Verificar se tutor real interagiu:
      - Se sim: ajustar comportamento (mais interações)
      - Se não: gerar algo que chame atenção (SOS leve, evento)
2. Verificar transição:
   a. Contar tutores reais vs avatares
   b. Se reais > avatares: desativar avatar mais distante
   c. Se reais > 20: desativar todos os avatares
```

### 10.4 Queries com filtro de avatares

```typescript
// Nas views e queries públicas, avatares aparecem como pets normais:
const fetchAldeiaFeed = async (aldeiaId: string) => {
  const { data } = await supabase
    .from('aldeia_feed')
    .select('*')
    .eq('aldeia_id', aldeiaId)
    .order('created_at', { ascending: false });
  return data; // Inclui posts de avatares E reais
};

// Apenas para admin/analytics — separar reais de avatares:
const fetchRealStats = async (aldeiaId: string) => {
  const { data } = await supabase
    .from('aldeia_members')
    .select('*')
    .eq('aldeia_id', aldeiaId)
    .eq('is_avatar', false);
  return data;
};
```

---

## 11. MÉTRICAS DE SUCESSO

### 11.1 Como saber se os avatares funcionam

| Métrica | Bom | Ruim |
|---|---|---|
| Tutor interage com avatar nos 3 primeiros dias | > 70% | < 40% |
| Tutor aceita primeiro favor de avatar | > 50% | < 25% |
| Tutor volta no dia 2 | > 60% | < 35% |
| Tutor volta no dia 7 | > 40% | < 20% |
| Tutor convida amigo real | > 15% | < 5% |
| Aldeia atinge 10 reais em 30 dias | > 30% das Aldeias | < 10% |
| Tutor percebe que são avatares e reclama | < 5% | > 15% |

### 11.2 Quando desativar avatares definitivamente

```
SE Aldeia tem 20+ tutores reais
E média de 10+ interações/dia entre reais
E tem pelo menos 1 parceiro verificado
→ Desativar todos os avatares
→ Notificação: "Sua Aldeia cresceu! 100% vizinhos reais."
→ Badge: "Aldeia Viva" desbloqueada para todos os membros
```

---

## 12. O QUE NINGUÉM NO MUNDO FAZ

| Funcionalidade | auExpert | Qualquer outro app |
|---|---|---|
| Comunidade viva desde o dia 1 | ✅ Avatares IA | ❌ Aldeia vazia |
| Tutorial vivencial (aprende fazendo) | ✅ Avatares ensinam | ❌ Tutorial chato em slides |
| Transição gradual avatar → real | ✅ Suave e inteligente | ❌ Não se aplica |
| Avatares com personalidade e rotina | ✅ Simulação completa | ❌ Não existe |
| Avatares preenchem lacunas de nicho | ✅ Diversidade garantida | ❌ Depende de quem entra |
| Interações com avatares geram RAG real | ✅ Memória do pet | ❌ Não existe |
| Parceiros veem atividade desde dia 1 | ✅ Convence a entrar | ❌ "0 usuários na região" |
| Pet-Credits ganhos com avatares valem | ✅ Aprendizado = recompensa | ❌ Não existe |

---

## 13. RESUMO DO CONCEITO

```
PROBLEMA: Aldeia vazia no lançamento → ninguém fica

SOLUÇÃO: Aldeia Viva com avatares IA

COMO FUNCIONA:
1. Tutor se cadastra
2. IA popula a Aldeia com 8-10 pets avatares
3. Avatares interagem, pedem ajuda, criam eventos
4. Tutor aprende usando, não lendo
5. Tutores reais vão chegando
6. Avatares vão saindo gradualmente
7. Aldeia fica 100% real

RESULTADO:
• Zero sensação de "app vazio"
• Tutor aprende tudo nos primeiros 7 dias
• Pet-Credits ganhos com avatares são reais
• RAG do pet começa a ser alimentado desde dia 1
• Parceiros veem atividade e querem entrar
• Ciclo virtuoso: avatares → reais → mais reais → avatares somem
```

> "Os avatares são a faísca. Os tutores reais são o fogo.
> A Aldeia Viva garante que a faísca nunca falta."
