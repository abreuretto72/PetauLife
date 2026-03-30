# ALDEIA — Especificação Completa
## A camada comunitária do auExpert

> "A Aldeia protege seu pet sem você perceber.
> E quando você precisa de ajuda, ela já está lá."

---

## 1. O QUE É A ALDEIA

A Aldeia é uma micro-rede de proteção hiperlocal onde tutores, pets, parceiros
e a IA do auExpert colaboram para que nenhum pet fique sem cuidado.

**NÃO é:**
- Rede social com likes e seguidores
- Marketplace de compra e venda
- Grupo de WhatsApp com nome bonito
- App de pet sitter pago
- Instagram de fotos fofas

**É:**
- Sistema de proteção coletiva ativado por IA
- Economia solidária baseada em reciprocidade real
- Comunidade de vizinhança onde ajuda real acontece
- Extensão inteligente do cuidado individual do pet

---

## 2. QUEM PARTICIPA DA ALDEIA

### 2.1 Os 5 tipos de participantes

#### TUTORES (o núcleo)
Quem são: donos de cães e gatos cadastrados no auExpert
Como entram: automaticamente ao criar conta (toda conta está numa Aldeia)
O que fazem: cuidam dos seus pets, ajudam vizinhos, pedem ajuda
Motivação primária: proteger o próprio pet
Motivação secundária: reciprocidade, pertencimento, descontos

#### PETS (sim, o pet participa)
Quem são: cães e gatos com perfil no auExpert
Como entram: o tutor cadastra
O que fazem: têm perfil social próprio, grafo de amizades, reputação
Motivação: a IA fala por eles — o pet "interage" via narração

**INÉDITO:** O pet não é um anexo do tutor. O pet tem presença própria na Aldeia.
O Rex "conhece" o Thor no parque, e isso fica registrado. A Luna "não gosta"
do Simba do vizinho, e a IA sabe. Pets têm rede social entre eles.

#### PARCEIROS VERIFICADOS
Quem são: veterinárias, pet shops, adestradores, passeadores, hotéis, ONGs
Como entram: cadastro + verificação documental + validação por Anciões da Aldeia
O que fazem: oferecem serviços com desconto, patrocinam eventos, dão suporte em SOS
Motivação: clientes qualificados, visibilidade local, dados de demanda da região

#### GUARDIÕES VOLUNTÁRIOS
Quem são: pessoas sem pet que amam animais e querem ajudar
Como entram: cadastro com verificação de identidade
O que fazem: ajudam em buscas, resgatam animais de rua, fazem lar temporário
Motivação: propósito, badges especiais, reconhecimento, possível adoção

#### ONGs E PROTETORES
Quem são: organizações e protetores independentes de animais
Como entram: cadastro + documentação da ONG + validação por Anciões
O que fazem: publicam pets para adoção, pedem voluntários, recebem doações
Motivação: alcance local, voluntários, doações, visibilidade

---

## 3. COMO ENTRAR E PARTICIPAR

### 3.1 Onboarding da Aldeia (automático)

```
Tutor cria conta no auExpert
    │
    ├── GPS detecta localização
    │   IA identifica a Aldeia mais próxima
    │   Ex: "Aldeia Salto, SP"
    │
    ├── Se já existe Aldeia na região:
    │   "Bem-vindo à Aldeia Salto! 48 tutores e 67 pets te esperam."
    │   Tutor entra automaticamente como OBSERVADOR
    │
    └── Se NÃO existe Aldeia na região:
        "Você é o primeiro tutor em Salto! Sua Aldeia começa com você."
        Tutor vira FUNDADOR — a Aldeia é criada automaticamente
        Cada novo tutor da região engorda a Aldeia
```

### 3.2 Níveis de participação (evolução natural)

| Nível | Como chega | Tempo mínimo | O que pode fazer |
|---|---|---|---|
| **Observador** | Criou conta | 0 dias | Ver mapa, receber alertas, pedir SOS |
| **Membro** | Perfil completo + 1 pet cadastrado | 7 dias | Oferecer/pedir favores, ver feed, participar de eventos |
| **Guardião** | 10 favores + Proof of Love Bronze | 30 dias | Cuidar de pets de outros, classificados, criar eventos |
| **Ancião** | 30 favores + Proof of Love Prata + nota ≥4.5 | 90 dias | Moderar, validar parceiros, julgar disputas |
| **Fundador** | Criou a Aldeia da região | 0 dias | Todos os poderes de Ancião + título permanente |

**A evolução é natural, não forçada.** O tutor sobe de nível apenas usando o app
normalmente e ajudando quando pode. Não precisa "grinder" para subir.

---

## 4. MOTIVAÇÃO PARA PARTICIPAR

### 4.1 O funil psicológico (por que o tutor fica)

```
MEDO      → "Se meu pet se perder, quem ajuda?"
              A Aldeia é seguro contra o pior cenário.

EGO       → "Meu pet merece o melhor cuidado"
              O app prova que você cuida bem (Proof of Love).

PREGUIÇA  → "Não quero ter trabalho extra"
              A ajuda é PASSIVA — 1 toque, 0 esforço.

DOPAMINA  → "Ajudei a encontrar um pet perdido"
              Badge + Pet-Credits + notificação de gratidão.

PERTENCER → "Conheço os vizinhos pelo nome do pet"
              A Aldeia cria vizinhança real, não virtual.

MEDO 2    → "Se eu sair, perco a proteção"
              Retenção natural — não dá pra desinstalar a segurança.
```

### 4.2 O que o tutor GANHA concretamente

| Ação | Pet-Credits | Badge | Desconto |
|---|---|---|---|
| Confirmar avistamento de pet perdido | +5 | Olhos da Rua | — |
| Passear com pet de vizinho | +15 | Patas Solidárias | — |
| Cuidar de pet em emergência | +30 | Herói de Emergência | 15% vet parceiro |
| Doar item (ração, brinquedo) | +10 | Mão Aberta | — |
| Organizar evento da Aldeia | +25 | Líder de Matilha | 10% pet shop |
| Resgatar animal de rua | +50 | Anjo da Rua | 20% vet parceiro |
| Lar temporário para resgate | +40/dia | Lar Provisório | 25% ração parceiro |
| Avaliar parceiro verificado | +5 | Crítico Local | — |
| 30 dias consecutivos ativo | +20 | Fiel da Aldeia | 5% qualquer parceiro |

### 4.3 Pet-Credits — como funciona

**Não é dinheiro.** É uma moeda de reciprocidade.

- 1 Pet-Credit = 1 unidade de solidariedade
- Ganha: fazendo favores, ajudando em SOS, doando itens
- Gasta: pedindo favores, pedindo cuidado, prioridade em SOS
- NÃO pode: comprar, vender, transferir para conta bancária

**O saldo importa para a reputação:**
- Saldo positivo = tutor que mais dá do que pede = confiável
- Saldo zero = equilibrado = normal
- Saldo negativo = tutor que só pede = flag de atenção (não punição)

**Pet-Credits em parceiros:**
- Parceiros aceitar converter Pet-Credits em descontos
- 50 Pet-Credits = 5% desconto
- 100 Pet-Credits = 10% desconto
- O parceiro ganha visibilidade e clientes fiéis em troca

---

## 5. FUNCIONALIDADES INÉDITAS E EXCLUSIVAS

### 🔥 5.1 GRAFO SOCIAL DO PET (ninguém tem isso)

O pet tem sua própria rede social. Não o tutor — o PET.

```
           Thor (Golden)
           amigo ★★★★★
              │
    Mel ──── REX ──── Luna (gata)
  (Poodle)   │        convive ★★★☆☆
  amiga ★★★★ │
              │
           Simba (SRD)
           evita ★☆☆☆☆
```

**Como funciona:**
- Quando dois pets se encontram (evento, passeio junto, co-parentalidade),
  a IA registra a interação no grafo de cada um
- O tutor pode classificar: amigo, convive, neutro, evita
- A IA aprende: "Rex ama Golden Retrievers mas evita cães pequenos agressivos"
- O match de afinidade usa o grafo para sugerir novos amigos

**Na narração do diário:**
"Hoje encontrei o Thor no parque de novo. Acho que ele é meu melhor amigo.
 A gente corre junto e depois deita no mesmo lugar pra descansar."

**Na Aldeia:**
- "Rex tem 7 amigos na Aldeia Salto"
- "Pets mais populares da Aldeia: Thor (12 amigos), Rex (7), Luna (4)"
- Se Rex se perder, a IA avisa os tutores dos amigos dele primeiro

### 🔥 5.2 INTELIGÊNCIA COLETIVA DE SAÚDE (revolucionário)

A IA cruza dados de TODOS os pets da Aldeia para detectar padrões:

**Surto epidemiológico local:**
Se 5+ pets na mesma Aldeia apresentam vômito na mesma semana, a IA detecta:

```
⚠️ ALERTA DE SAÚDE — Aldeia Salto
5 pets com sintomas gastrointestinais nos últimos 7 dias.
Possível causa: ração contaminada, água do parque, surto viral.

Pets afetados: Rex, Thor, Mel, Bob, Lola
Localização comum: Parque Central (4/5 visitaram)

RECOMENDAÇÃO: Evite o Parque Central até investigação.
Procure o veterinário se seu pet apresentar sintomas.
```

Nenhum app faz isso. Nenhum. É epidemiologia veterinária por IA.

**Alerta de envenenamento:**
Se 3+ pets na mesma área ficam doentes em 24h:
"URGENTE: Possível envenenamento na região da Rua XV.
3 pets adoeceram após passeio no mesmo quarteirão."

**Sazonalidade local:**
A IA aprende ao longo dos meses:
"Em Salto, carrapatos aumentam 300% em março.
Recomendação: aplicar antiparasitário agora."

### 🔥 5.3 CONTÁGIO EMOCIONAL (inédito absoluto)

A IA monitora o humor de TODOS os pets da Aldeia em tempo real:

```
Mapa de Humor da Aldeia Salto — Hoje

  🟢🟢🟢🟢🟡🟡🔴🟢🟢🟢
  ████████████████████████
  82% pets felizes | 12% neutros | 6% tristes

  ⚠️ Zona de atenção: Bairro Centro
  3 pets ansiosos na mesma rua
  Possível causa: obras barulhentas na região
```

**Se muitos pets numa área ficam ansiosos ao mesmo tempo:**
A IA investiga: barulho? fogos? construção? cão agressivo solto?
E alerta a Aldeia com sugestões de ação.

**Isso é inédito porque:** usa o humor registrado no diário (que já existe
como funcionalidade individual) e agrega coletivamente. O tutor registra
o humor do pet por ele mesmo, mas a IA usa isso para proteger todos.

### 🔥 5.4 SOS COM PROXY DE PRONTUÁRIO (salva vidas)

Quando um tutor ativa SOS de emergência médica:

```
🚨 SOS MÉDICO — Rex (Labrador, 3 anos)
Tutor: Ana Martins | 📍 Rua XV, 234 — Salto

INFORMAÇÕES LIBERADAS PARA QUEM RESPONDER:
├── Alergias: Frango, Pólen
├── Medicação atual: Nenhuma
├── Última vacina: V10 em 15/03/2026
├── Peso: 32 kg
├── Veterinário de confiança: Dr. Carlos — VetAmigo
│   📞 (11) 4028-1234
├── Contato emergência: Paula (irmã) — (11) 99999-8888
└── Observação: Tem medo de trovão, pode estar agitado

Ana precisa de: Transporte até o veterinário
Distância de você: 800m
```

**O tutor que responde ao SOS recebe automaticamente:**
- Dados de saúde relevantes para a emergência
- Contato do veterinário
- Contato de emergência do tutor
- Orientações da IA: "Não dê água se estiver vomitando"

**Após o SOS resolvido:**
- Tudo é registrado no diário do pet
- Embedding no RAG: "Em 20/04/2026, Rex passou mal e o João da Aldeia
  levou ao veterinário. Diagnóstico: indigestão."
- Pet-Credits para quem ajudou
- Avaliação mútua

### 🔥 5.5 BUSCA COLETIVA INTELIGENTE (ninguém tem assim)

Quando um pet se perde, a IA orquestra a busca:

```
FASE 1 (0-30min): Raio 1km
├── Push para todos os tutores no raio
├── Foto + descrição + última localização
├── Mapa em tempo real com avistamentos
└── IA calcula rota provável baseado em:
    • Personalidade do pet (medroso foge longe, sociável fica perto)
    • Horário (noite = se esconde, dia = vagueia)
    • Histórico de passeios (lugares conhecidos)
    • Condição (se está machucado, não vai longe)

FASE 2 (30min-2h): Raio expande para 3km
├── Incluir Aldeias vizinhas
├── Parceiros alertados (vet, pet shop = pontos de avistamento)
├── ONGs alertadas (experiência em busca)
└── Guardiões Voluntários ativados

FASE 3 (2h+): Raio expande para 5km
├── Redes sociais locais notificadas (opcional)
├── IA gera cartaz digital automático com dados do pet
├── Pontos de água e comida mapeados (o pet vai procurar)
└── Histórico de pets perdidos na região (padrões de fuga)
```

**Dashboard de busca em tempo real:**
- Mapa com pins de avistamentos
- IA conecta avistamentos em linha do tempo
- "Rex foi visto às 14h na Rua A, às 14:30 na Rua B → provavelmente
  está se movendo para norte, direção do Parque Central"
- Voluntários podem marcar "estou procurando aqui" para evitar sobreposição

**Quando encontrado:**
- Push para todos: "REX FOI ENCONTRADO! Obrigado, Aldeia!"
- Badge "Herói de Resgate" para quem encontrou
- 50 Pet-Credits
- Registro automático no diário com narração IA:
  "Hoje eu me perdi. Fiquei assustado, andei muito. Mas a Aldeia me achou.
   O João me encontrou perto do parque. Nunca mais fujo de casa."

### 🔥 5.6 MATCH DE AFINIDADE POR IA (exclusivo)

A IA cruza dados de personalidade, rotina e localização:

```
MATCH DE PASSEIO
Rex (Labrador, energia alta, matinal)
    ↕ Compatibilidade: 94%
Thor (Golden, energia alta, matinal)
    📍 Moram a 400m
    🕐 Passeiam entre 7h-8h
    🧠 Ambos sociáveis com cães grandes
    → Sugestão: "Passeio juntos amanhã 7:30?"

MATCH DE CUIDADO MÚTUO
Luna (Siamês, calma, independente)
    ↕ Compatibilidade: 88%
Mimi (Persa, calma, indoor)
    📍 Mesmo prédio, apto 301 e 502
    🧠 Ambas indoor, baixa manutenção
    → Sugestão: "Combinar cuidado quando uma viajar?"

MATCH DE PERSONALIDADE COMPLEMENTAR
Rex (energia alta, ansioso quando sozinho)
    ↕ Terapêutico: 78%
Bob (SRD idoso, calmo, influência positiva)
    📍 Moram a 200m
    🧠 Bob acalma cães ansiosos (observado em 3 encontros)
    → Sugestão: "Bob pode ser boa companhia quando Rex fica sozinho"
```

**A IA aprende com cada encontro registrado:**
- Se Rex e Thor passearam juntos e ambos voltaram com humor "Feliz"
  → o match sobe
- Se Rex encontrou Simba e ficou "Ansioso"
  → a IA sugere evitar
- Após 5 encontros positivos → sugere co-parentalidade

### 🔥 5.7 MEMÓRIA COLETIVA DA ALDEIA (inédito)

A Aldeia tem memória própria via RAG coletivo:

**Cada Aldeia acumula conhecimento local:**
- "O Parque Central é o melhor lugar para cães grandes em Salto"
- "A Rua XV tem muito trânsito, cuidado com passeios"
- "Dr. Carlos da VetAmigo é especialista em Labradores"
- "Em março, carrapatos explodem na região do lago"
- "Dona Maria do apto 102 não gosta de cães no elevador"
- "O porteiro do Edifício Sol é amigo dos pets"

**Tutor novo na Aldeia recebe:**
"Bem-vindo à Aldeia Salto! Aqui vão dicas da comunidade para o Rex:
 → Melhor parque: Parque Central (32 tutores frequentam)
 → Veterinário favorito: Dr. Carlos — VetAmigo (nota 4.9)
 → Cuidado: Rua XV tem trânsito pesado
 → Dica: Dona Lúcia do Pet Shop Amigo dá biscoito de brinde"

A IA personaliza baseado no pet: se é filhote, dicas de filhote.
Se é idoso, dicas de idoso. Se é gato, não sugere parque.

### 🔥 5.8 PREVISÃO DE NECESSIDADE (IA preditiva)

A IA prevê o que o tutor vai precisar antes dele pedir:

```
Baseado em padrões:

"Ana sempre viaja no Carnaval. Faltam 15 dias.
 Ano passado, Paula cuidou do Rex.
 Paula está disponível este ano?"
 → Push para Ana: "Carnaval chegando. Quer pedir à Paula
   para cuidar do Rex como ano passado?"

"Rex está com vacina V10 vencendo em 7 dias.
 Dr. Carlos da VetAmigo tem horário disponível sexta.
 3 pets da Aldeia também precisam vacinar."
 → Push: "Vacinação coletiva na VetAmigo sexta?
   Desconto de 15% para 4+ pets juntos."

"Rex está mais ansioso há 3 semanas.
 Bob (SRD calmo) mora perto e tem efeito positivo.
 Últimos 2 encontros com Bob melhoraram o humor do Rex."
 → Push: "Rex está ansioso ultimamente. Que tal um
   passeio com o Bob? Ele ajuda o Rex a relaxar."
```

### 🔥 5.9 HERANÇA COMUNITÁRIA (emocional e único)

Quando um pet falece, a Aldeia não esquece:

```
A Aldeia de Salto lamenta a partida do Rex.
Rex foi membro por 3 anos.
Tinha 7 amigos na Aldeia.
Participou de 23 encontros.
Ajudou a encontrar 2 pets perdidos.

🌟 Memorial do Rex
Amigos da Aldeia podem deixar uma mensagem:

João: "Rex era o cão mais feliz do parque.
       Thor sente falta dele."

Paula: "Cuidei do Rex tantas vezes.
        Era como se fosse meu também."

Dr. Carlos: "Acompanhei o Rex desde filhote.
             Um paciente exemplar."
```

O memorial fica acessível ao tutor para sempre.
A IA pode gerar um "Livro de Memórias" com todas as
narrações, fotos e momentos da vida do pet.

---

## 6. EVENTOS DA ALDEIA

### 6.1 Tipos de evento

| Tipo | Quem cria | Exemplo |
|---|---|---|
| Passeio coletivo | Qualquer membro | "Passeio no Parque Central — Sábado 8h" |
| Feira de troca | Guardião+ | "Troca de itens pet — Praça da Igreja — Domingo 10h" |
| Vacinação coletiva | Parceiro + Ancião | "V10 com 15% desconto — VetAmigo — 15/04" |
| Encontro social | Qualquer membro | "Café com pets — Padaria Bom Dia — Sábado 9h" |
| Mutirão de resgate | ONG + Anciões | "Resgate de animais na região do rio — voluntários" |
| Workshop | Parceiro | "Adestramento básico gratuito — Parque — Domingo 10h" |
| Adoção | ONG | "Feira de adoção — 15 pets buscando lar" |

### 6.2 Fluxo do evento

```
Criador propõe evento
    → Define: data, hora, local, tipo, limite de pets, descrição
    → IA sugere horário baseado em padrões da Aldeia
    → Publicado no feed da Aldeia

Tutores confirmam presença
    → Lista de confirmados visível
    → IA alerta conflitos: "Rex e Simba não se dão bem, ambos confirmaram"
    → Sugestão: "Chegue 10min antes do Simba para Rex se acomodar"

Dia do evento
    → Check-in por geolocalização
    → Tutor faz check-in e a IA registra no diário de cada pet
    → Fotos do evento alimentam a galeria coletiva
    → Grafo social atualizado (pets que interagiram)

Após evento
    → IA gera narração automática para cada pet que participou
    → Pet-Credits para o organizador
    → Avaliação do evento
    → Fotos compartilhadas no feed
```

---

## 7. SISTEMA DE CONFIANÇA

### 7.1 Score de Confiança Triplo

Não é um número só. São 3 dimensões:

```
SCORE DO TUTOR = 3 dimensões

1. PROOF OF LOVE (cuidado com o próprio pet)
   Diário ativo? Vacinas em dia? Análises IA? Humor registrado?
   → 0 a 100 pontos

2. KARMA DA ALDEIA (solidariedade com outros)
   Favores feitos? SOS respondidos? Eventos organizados?
   → 0 a 100 pontos

3. REPUTAÇÃO SOCIAL (avaliações recebidas)
   Nota média das avaliações de outros tutores?
   → 1 a 5 estrelas

CONFIANÇA FINAL = Proof of Love × Karma × Reputação
```

### 7.2 Verificação de identidade

| Nível | O que verifica | Badge | Requisito para |
|---|---|---|---|
| Email | Email confirmado | — | Criar conta |
| Telefone | SMS verificado | Verificado | Pedir SOS |
| Documento | Foto com documento (OCR via IA) | Identidade | Cuidar de pets de outros |
| Endereço | GPS consistente por 30 dias | Localizado | Criar eventos |
| Completo | Tudo acima + Proof of Love Bronze | Confiável | Ser co-pai, tutor reserva |

### 7.3 Avaliação mútua pós-favor

```
Após cada favor ou cuidado:

Ana avalia João (quem cuidou do Rex):
├── Pontualidade: ★★★★★
├── Cuidado com o pet: ★★★★★
├── Comunicação: ★★★★☆
├── Seguiu orientações: ★★★★★
└── Comentário: "Mandou foto a cada 2h, Rex voltou feliz"

João avalia Ana (dona do Rex):
├── Clareza das instruções: ★★★★★
├── Pontualidade na entrega/busca: ★★★★☆
├── Pet bem cuidado (saúde): ★★★★★
└── Comentário: "Rex é super tranquilo, tudo explicado direitinho"

A avaliação é pública no perfil da Aldeia.
Média abaixo de 3.5 → flag de atenção para Anciões.
Média abaixo de 2.0 → suspensão de favores até resolução.
```

---

## 8. PARCEIROS DA ALDEIA

### 8.1 Como funciona para o parceiro

```
Parceiro se cadastra
    → Upload de CNPJ + alvará + documentos (OCR via IA)
    → Anciões da Aldeia validam (visitam o local)
    → Selo "Parceiro Verificado da Aldeia"

Parceiro oferece:
    → Descontos para membros da Aldeia
    → Desconto maior para Proof of Love mais alto
    → Patrocínio de eventos (ração para encontro, espaço, etc.)
    → Atendimento prioritário em SOS

Parceiro recebe:
    → Visibilidade no mapa da Aldeia
    → Perfil com avaliações dos tutores
    → Dashboard com dados da demanda local:
      "32 cães grandes na sua Aldeia precisam de banho este mês"
      "8 pets com vacina vencendo nos próximos 15 dias"
    → Fluxo constante de clientes fiéis
```

### 8.2 Tabela de descontos por Proof of Love

| Proof of Love | Desconto base | Exemplo |
|---|---|---|
| Nenhum | 0% | — |
| Bronze | 5% | Banho de R$60 → R$57 |
| Prata | 10% | Consulta de R$150 → R$135 |
| Ouro | 15% | Cirurgia de R$2000 → R$1700 |
| Diamante | 20% | Internação de R$500 → R$400 |

O parceiro define o desconto máximo. A Aldeia garante que os clientes são
tutores reais e comprometidos (não "caçadores de desconto").

---

## 9. RANKINGS E COMPETIÇÃO SAUDÁVEL

### 9.1 Rankings da Aldeia

**Tutor mais solidário do mês:**
- Baseado em favores feitos, SOS respondidos, eventos organizados
- Reconhecimento no feed + badge especial + desconto extra em parceiros
- "Ana Martins é a Tutora do Mês da Aldeia Salto! 15 favores em março."

**Pet mais popular:**
- Baseado no grafo social (amigos na Aldeia)
- "Thor é o pet mais popular da Aldeia Salto! 14 amigos."
- Aparece no topo do mapa

**Aldeia mais solidária:**
- Ranking entre Aldeias da mesma cidade/estado
- "Aldeia Salto é a 3ª mais solidária de SP! 127 favores este mês."
- Cria orgulho local e competição entre bairros

### 9.2 Badges exclusivas da Aldeia

| Badge | Como ganha | Raridade |
|---|---|---|
| Olhos da Rua | Confirmou 5 avistamentos | Comum |
| Patas Solidárias | Completou 10 favores | Comum |
| Mão Aberta | Doou 10 itens | Comum |
| Herói de Emergência | Respondeu 3 SOS em <15min | Rara |
| Anjo da Rua | Resgatou animal de rua | Rara |
| Alma da Aldeia | 50 favores + nota ≥4.5 | Épica |
| Lar Provisório | 7 dias de lar temporário | Épica |
| Líder de Matilha | Organizou 5 eventos com 10+ pets | Épica |
| Fundador | Criou a Aldeia da região | Lendária |
| Herói de Resgate | Pet perdido encontrado por você | Lendária |
| Guardião da Aldeia | 1 ano ativo + 100 favores + Ancião | Lendária |

---

## 10. INTEGRAÇÃO COM O REST DO AUEXPERT

### 10.1 Tudo alimenta o RAG do pet

| Evento na Aldeia | Embedding gerado |
|---|---|
| Passeio com pet de vizinho | "João passeou com Rex em 20/04/2026, voltou feliz" |
| SOS respondido | "Rex passou mal, João levou ao vet. Diagnóstico: indigestão" |
| Pet encontrado | "Rex se perdeu e foi encontrado pela Aldeia após 2h" |
| Encontro social | "Rex participou do encontro da Aldeia no parque com 8 cães" |
| Novo amigo | "Rex fez amizade com Thor no parque, brincaram por 1h" |
| Match de passeio | "Rex e Thor agora passeiam juntos 3x por semana" |
| Favor recebido | "Paula cuidou do Rex no fim de semana enquanto Ana viajou" |

### 10.2 A IA usa tudo nas narrações

```
Sem Aldeia (narração genérica):
"Hoje fui passear no parque. Foi legal."

Com Aldeia (narração rica):
"Hoje fui passear com o Thor no Parque Central. É nosso 7º passeio
 junto. O João que levou a gente — ele cuida bem de mim quando a
 mamãe não pode. Na volta, encontrei a Mel que mora no prédio da
 frente. Parece que a Aldeia Salto tá cada vez maior."
```

### 10.3 Testamento Emocional inclui a Aldeia

Se o tutor configurou testamento emocional, a Aldeia é notificada:
"Rex agora é cuidado por Paula (tutora reserva).
 A Aldeia Salto continua protegendo o Rex como sempre."

### 10.4 Conquistas especiais da Aldeia

| Conquista | Condição |
|---|---|
| Social Butterfly | Pet com 10+ amigos na Aldeia |
| Alma da Aldeia | Tutor completou 50 favores |
| A Aldeia é Minha | 1 ano na mesma Aldeia |
| Fundador | Primeira pessoa da região |
| Herói Local | Ajudou a encontrar 3+ pets |

---

## 11. TECNOLOGIA POR TRÁS

### 11.1 Geolocalização

- Aldeia = polígono geográfico baseado em bairros/CEPs
- Raio configurável pelo tutor: 500m, 1km, 3km, 5km
- GPS usado para: match de proximidade, SOS, mapa, eventos
- Privacidade: nunca mostrar endereço exato — apenas área (raio 200m)

### 11.2 Notificações inteligentes

A IA controla a frequência para não irritar:
- SOS e pet perdido: sempre (push imediato, ignora silencioso)
- Sugestão de match: máximo 2 por semana
- Eventos: máximo 1 por dia
- Feed: notificação agrupada 1x por dia
- Alerta de saúde coletiva: sempre (prioridade alta)

### 11.3 Tabelas do banco (resumo)

```
aldeia_communities    → Aldeias (nome, polígono, stats)
aldeia_members        → Tutores na Aldeia (nível, karma, badges)
aldeia_favors         → Favores pedidos/oferecidos/completados
aldeia_sos            → Emergências com status e timeline
aldeia_lost_pets      → Pets perdidos com avistamentos
aldeia_events         → Eventos com confirmações
aldeia_reviews        → Avaliações mútuas pós-favor
aldeia_pet_graph      → Grafo social dos pets (amizades)
aldeia_alerts         → Alertas comunitários
aldeia_classifieds    → Classificados solidários
aldeia_partners       → Parceiros verificados
aldeia_pet_credits    → Histórico de créditos
aldeia_health_alerts  → Alertas de saúde coletiva (IA)
aldeia_rankings       → Rankings mensais
aldeia_memorials      → Memoriais de pets falecidos
```

---

## 12. O QUE NINGUÉM MAIS TEM (resumo)

| Funcionalidade | auExpert | Concorrentes |
|---|---|---|
| Grafo social DO PET (não do tutor) | ✅ | ❌ |
| Inteligência coletiva de saúde (epidemiologia IA) | ✅ | ❌ |
| Contágio emocional (mapa de humor coletivo) | ✅ | ❌ |
| SOS com proxy automático de prontuário | ✅ | ❌ |
| Busca de pet perdido com IA preditiva de rota | ✅ | ❌ |
| Match de afinidade pet-pet por IA | ✅ | ❌ |
| Memória coletiva da Aldeia (RAG comunitário) | ✅ | ❌ |
| Previsão de necessidade (IA preditiva) | ✅ | ❌ |
| Memorial comunitário de pets falecidos | ✅ | ❌ |
| Proof of Love como moeda de confiança | ✅ | ❌ |
| Pet-Credits com desconto real em parceiros | ✅ | ❌ |
| Narração IA que inclui vida social do pet | ✅ | ❌ |
| Herança comunitária (testamento + Aldeia) | ✅ | ❌ |
