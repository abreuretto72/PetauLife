# Minutas para aplicações de afiliação — auExpert

Pronto para colar nos formulários. Versão PT-BR primeiro, EN logo abaixo de cada bloco caso o formulário exija inglês (a maioria aceita ambos). Os dois programas exigem que você esteja logado com **email corporativo** (`belisario@multiversodigital.com.br` ou `contato@auexpert.com.br`) e tenha **dados de PJ** (Multiverso Digital) ou CPF para recebimento.

---

## 1. Travelpayouts

**URL:** https://www.travelpayouts.com/signup

**O que é:** marketplace de affiliate networks de viagem (Aviasales, Skyscanner, Booking, Trip.com, Kiwi etc) com tracking unificado. Aprovação rápida (~24h). Gratuito.

### Campos do formulário e textos prontos

#### `Company name / Empresa`
```
Multiverso Digital
```

#### `Website / App URL`
```
https://auexpert.com.br
```
*(Se ainda não está no ar, use `https://www.multiversodigital.com.br/auexpert` ou similar; eles aceitam landing page.)*

#### `Country / País`
```
Brazil
```

#### `Traffic source / Fonte de tráfego`
```
Mobile app (iOS + Android)
```

#### `What is your project about? / Sobre o seu projeto` (~150-300 palavras)

**PT-BR:**
```
auExpert é o primeiro aplicativo brasileiro premium de cuidado e gestão de pets
com inteligência artificial integrada. Operamos em iOS, Android e Web em cinco
idiomas (pt-BR, en-US, es-MX, es-AR, pt-PT). Nosso público-alvo são tutores
de pets de alta renda no Brasil, Portugal e América Latina hispânica que viajam
internacionalmente com seus animais e precisam de orientação especializada.

Em 2026 lançamos o Módulo Viagem, uma feature de concierge baseado em IA que
prepara o roteiro completo do tutor: a IA pesquisa companhias aéreas que
aceitam pets na rota, hotéis pet-friendly no destino, serviços de transporte
de pet especializados e documentação obrigatória. O tutor escolhe e reserva
diretamente nas plataformas parceiras. Cada destino consome em média 5 a 8
buscas distintas (voos + hotéis), e a janela de planejamento típica é de 60
a 180 dias antes da viagem — período em que o tutor compara opções, pesquisa
e reserva.

Pretendemos integrar o Travelpayouts via API + deep links com tracking marker
único por usuário, garantindo atribuição clara das reservas geradas. Nosso
público é nicho mas tem alto LTV: tutores de pet que viajam internacionalmente
gastam tipicamente acima de R$ 5.000 por viagem em transporte e hospedagem.
```

**EN:**
```
auExpert is the first premium Brazilian app for pet care and management with
integrated AI, available on iOS, Android, and Web in five languages (pt-BR,
en-US, es-MX, es-AR, pt-PT). Our target audience are high-income pet tutors
in Brazil, Portugal, and Hispanic Latin America who travel internationally
with their animals and need specialized guidance.

In 2026 we launched the Trip Module — an AI-powered concierge feature that
builds a complete trip itinerary for the tutor: the AI researches airlines
that accept pets on the route, pet-friendly hotels at the destination,
specialized pet transport services, and required documentation. The tutor
chooses and books directly on partner platforms. Each destination averages
5-8 distinct searches (flights + hotels), and the typical planning window is
60-180 days before travel — a period in which the tutor compares options,
researches, and books.

We plan to integrate Travelpayouts via API + deep links with a unique tracking
marker per user, ensuring clear attribution of generated bookings. Our audience
is niche but has high LTV: pet tutors who travel internationally typically
spend over BRL 5,000 (~USD 1,000) per trip on transport and lodging.
```

#### `Estimated monthly traffic / Tráfego mensal estimado`
```
Initial: 500-2.000 unique searches/month (mobile app users)
Year 1 target: 5.000-10.000 unique searches/month
```

#### `Which Travelpayouts partners are you interested in? / Parceiros de interesse`
Marque:
- ✅ **Aviasales** (voos internacionais)
- ✅ **Hotellook** (hotéis)
- ✅ **Booking.com** (hotéis)
- ✅ **Skyscanner** (voos)
- ✅ **Kiwi.com** (voos com conexões complexas)
- ✅ **Trip.com** (alternativo)

#### `How will you promote our partners? / Como vai promover`

**PT-BR:**
```
Integração nativa via API + deep links em cards de roteiro. O tutor descreve
a viagem por voz; nossa IA monta sugestões e cada item é um link rastreável
para a plataforma do parceiro Travelpayouts. Sem banners ou pop-ups invasivos
— a integração é parte do fluxo natural do app.
```

**EN:**
```
Native integration via API + deep links in itinerary cards. The tutor describes
the trip by voice; our AI assembles suggestions, and each item is a tracking
link to the Travelpayouts partner platform. No invasive banners or pop-ups —
the integration is part of the app's natural flow.
```

### Pós-aprovação

1. Travelpayouts envia email com `marker_id` ou `partner_id`.
2. Salvar como secret no Supabase: `TRAVELPAYOUTS_MARKER`.
3. Ajustar `plan-trip-concierge` para anexar `?marker={hash(tutor_id)}` em todas as URLs geradas (~10 linhas de código).

---

## 2. Booking.com Affiliate Partner Programme

**URL:** https://www.booking.com/affiliate-program/

**O que é:** programa direto de afiliação Booking.com — comissão 25-40% sobre o que Booking ganha do hotel (efetivo ~4-6% do valor da reserva). Aprovação **mais rigorosa** que Travelpayouts: 2-4 semanas, exige website ativo (≥3 meses) e descrição cuidadosa do produto.

### Campos do formulário e textos prontos

#### `Company name`
```
Multiverso Digital
```

#### `Country of registration`
```
Brazil
```

#### `Website URL`
```
https://auexpert.com.br
```

#### `Type of website / aplicação`
```
Mobile application (B2C — pet care vertical)
```

#### `Website description` (~300-500 palavras)

**PT-BR:**
```
auExpert (https://auexpert.com.br) é uma plataforma premium de gestão de
cuidado de pets baseada em inteligência artificial, mantida pela Multiverso
Digital. Operamos em iOS, Android e Web em cinco idiomas (português do Brasil,
inglês, espanhol mexicano, espanhol argentino e português europeu). Nosso
público-alvo são tutores de pets de alta renda no Brasil e países lusófonos
e hispânicos que tratam seus animais como membros da família.

Lançamos em abril de 2026 o Módulo de Viagem, uma feature de planejamento de
viagens com pets que entrega ao tutor um roteiro completo gerado por IA. O
fluxo: o tutor descreve a viagem em uma frase por voz (origem, destino, datas,
motivo, pets, acompanhantes); nossa IA pesquisa em tempo real opções de
transporte adequado para pets, documentação exigida pelo país de destino,
itens de checklist de preparação, timeline de 180 dias antes da viagem, e
sugestões de hospedagem que aceitem animais.

Para a vertical de hospedagem, queremos integrar o programa de afiliação da
Booking.com porque o filtro "pet-friendly" da Booking é o mais maduro do
mercado e nosso público específico (tutores viajando com cães e gatos)
depende criticamente desse filtro. Outras plataformas têm dados inconsistentes
sobre política pet, taxas extras por animal e peso máximo aceito.

A integração será feita via deep links na nossa API de roteiro de viagem
(plan-trip-concierge), com tracking marker único por usuário garantindo
atribuição. Cada hotel sugerido na nossa interface vai ser um link rastreável
para o site da Booking pré-filtrado por destino, datas e disponibilidade pet.
Não usamos banners de display nem pop-ups; a integração é parte natural do
fluxo do app.

Audiência inicial: 500-2.000 buscas mensais; meta de 12 meses: 5.000-10.000
buscas mensais. O ticket médio do nosso público em hospedagem internacional
fica entre R$ 800 e R$ 1.500 por noite (USD 160-300), com estadias típicas
de 7-14 noites por viagem internacional.
```

**EN:**
```
auExpert (https://auexpert.com.br) is a premium AI-powered pet care management
platform, owned by Multiverso Digital. We operate on iOS, Android, and Web
in five languages (Brazilian Portuguese, English, Mexican Spanish, Argentine
Spanish, and European Portuguese). Our target audience are high-income pet
tutors in Brazil and Lusophone/Hispanic countries who treat their animals as
family members.

In April 2026 we launched the Travel Module, a feature for planning trips
with pets that delivers a complete AI-generated itinerary. The flow: the
tutor describes the trip in a single voice utterance (origin, destination,
dates, purpose, pets, companions); our AI searches in real time for
pet-appropriate transport options, documentation required by the destination
country, preparation checklist items, a 180-day pre-travel timeline, and
pet-friendly accommodation suggestions.

For the lodging vertical, we want to integrate the Booking.com Affiliate
programme because Booking's pet-friendly filter is the most mature in the
market and our specific audience (tutors traveling with dogs and cats)
depends critically on that filter. Other platforms have inconsistent data
about pet policy, extra fees per animal, and maximum accepted weight.

Integration will be via deep links in our plan-trip-concierge API, with a
unique tracking marker per user ensuring attribution. Every hotel suggested
in our interface will be a tracking link to the Booking site pre-filtered
by destination, dates, and pet availability. We do not use display banners
or pop-ups; the integration is a natural part of the app's flow.

Initial audience: 500-2,000 monthly searches; 12-month target: 5,000-10,000
monthly searches. Average ticket of our audience for international lodging
ranges from BRL 800 to 1,500 per night (USD 160-300), with typical stays
of 7-14 nights per international trip.
```

#### `Type of integration / Tipo de integração`
```
Search Box widget + Deep Links via API
```

#### `Primary integration use case`
```
Native API integration in mobile app — pet-friendly hotel suggestions
generated by AI concierge, displayed as tap-able cards that deep-link
into Booking.com search results pre-filtered for the user's specific
destination, dates, and pet requirements.
```

#### `Marketing channels`
Marque/cite:
- Mobile app (iOS, Android)
- App Store + Play Store organic
- Social media (Instagram @auexpert) — não obrigatório
- SEO de página de captura (https://auexpert.com.br)

#### `Expected monthly traffic / Volume estimado`
```
Year 1: 500-2.000 hotel searches/month
Year 2 target: 5.000-10.000 hotel searches/month
```

### Pós-aprovação

1. Booking envia credenciais (`affiliate_id` + tracking key).
2. Salvar como secret: `BOOKING_AFFILIATE_ID`.
3. Ajustar `plan-trip-concierge` para gerar URLs no padrão `https://www.booking.com/searchresults.html?aid={ID}&checkin={date}&checkout={date}&dest={city}&nflt=hotelfacility%3D4` (a flag `4` é o código do filtro pet-friendly).

---

## 3. Dicas pra os dois processos

**Email corporativo:** use `contato@auexpert.com.br` ou `belisario@multiversodigital.com.br`. Booking pode rejeitar Gmail/Outlook pessoal pra B2B.

**Dados PJ:** ambos pedem CNPJ da Multiverso Digital + endereço fiscal + nome do responsável. Pra Travelpayouts CPF basta, pra Booking PJ é fortemente recomendado.

**Conta bancária pra recebimento:**
- Travelpayouts paga via PayPal, Webmoney, transferência internacional. Mínimo USD 50.
- Booking paga via transferência internacional. Mínimo varia por país, no Brasil ~EUR 100.

**Tempo de aprovação esperado:**
- Travelpayouts: 24-48h. Se demorar mais, mande follow-up via dashboard.
- Booking: 2-4 semanas. Se rejeitar, eles dão o motivo — geralmente "site/app sem tráfego comprovado". Resposta: pedir aprovação condicional com revisão em 90 dias após primeiro lançamento público.

**Mostrar tração quando aplicar:**
- Capturas de tela do app rodando (5-10 telas mostrando o módulo de viagem)
- Vídeo curto demonstrando o fluxo do concierge (30-60s)
- Documento de roadmap com o lançamento previsto

**Se o Booking rejeitar inicialmente:** começar com Travelpayouts integrado a Booking via Travelpayouts (eles repassam ~70% da comissão Booking, então você ganha menos mas começa a operar imediatamente). Quando hit volume mínimo, reaplicar diretamente.

---

## 4. Próximos passos depois das aprovações

Quando os tokens chegarem, me avise os IDs e eu:

1. Adiciono os secrets no Supabase via MCP (`TRAVELPAYOUTS_MARKER`, `BOOKING_AFFILIATE_ID`).
2. Atualizo `plan-trip-concierge` para anexar tracking ID em todas as URLs geradas (~30min de trabalho).
3. Crio tabela `affiliate_clicks` (já tem schema sugerido em `AFFILIATE_APIS_RESEARCH.md`).
4. Adiciono painel `/admin/revenue` mostrando cliques e atribuições por mês.
5. Documento o ciclo de pagamento (NF-e da Multiverso pra recebimento).

Receita esperada nas primeiras semanas pós-integração é simbólica (USD 10-50). Vale como prova de conceito e pra começar a coletar dados de qual vertical converte melhor (voos vs hotéis) — informação que orienta a próxima rodada de integrações.
