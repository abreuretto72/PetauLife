# Pesquisa de APIs de afiliação para o Concierge AI v2

**Status (2026-04-28):** v1 do Concierge usa Anthropic web search — IA sugere voos/hotéis com link pra busca, sem mostrar preço atual. Para o v2 com **preços reais + revenue de afiliação**, precisamos integrar pelo menos uma API de cada vertical. Esta pesquisa cobre as 3 mais relevantes pro perfil de tutor brasileiro de elite.

---

## 1. Voos — comparativo

### 1.1 Amadeus Self-Service

- **URL:** https://developers.amadeus.com/
- **O que entrega:** flight offers search (rotas+datas+passageiros → lista de voos com preços), flight inspiration search, seat maps, on-hold pricing, e ~25 endpoints adicionais.
- **Modelo de preço:**
  - **Test environment** gratuito (10.000 chamadas/mês, dados em delay)
  - **Production:** pay-as-you-go a partir de US$ 0,001 por chamada de search depois de upgrade. Sem fee fixo mensal.
  - Não é affiliate puro — não paga comissão. É API consumption-based. Receita só se você cobrar serviço próprio sobre o que mostra.
- **Aprovação:** signup self-service, cartão de crédito basta. Production exige solicitação simples com URL do app e descrição (~3-5 dias úteis).
- **Cobertura BR:** todas as companhias principais (LATAM, Gol, Azul, AA, United, Delta, Air France, Lufthansa, etc.). Suporte a IATA codes.
- **Cobertura pet:** **NÃO há filtro nativo de "aceita pet"**. Solução: combinar API com base de conhecimento da Anthropic sobre políticas pet por companhia.
- **Ponto forte:** é a API mais ampla e barata para arrancar.
- **Ponto fraco:** preço sem comissão, então monetização precisa vir de assinatura premium ou markup.

### 1.2 Travelpayouts

- **URL:** https://www.travelpayouts.com/
- **O que entrega:** marketplace de affiliate networks de viagem — agrega Aviasales, Skyscanner, Kiwi.com, Booking, Trip.com etc num único SDK/API com tracking de comissão.
- **Modelo de preço:**
  - **Gratuito** pra desenvolvedores
  - **Comissão:** 50-70% da comissão recebida do parceiro final (Aviasales paga ~1,5% do bilhete; do que recebe, Travelpayouts repassa ~70%).
  - Para voos, comissão típica ao desenvolvedor: 0,5-1% do valor do bilhete.
- **Aprovação:** signup self-service, sem cartão. URL do app e descrição simples (~24h).
- **Cobertura BR:** boa via Aviasales (rotas internacionais especialmente). Cobertura doméstica BR via Skyscanner e Kiwi.
- **Cobertura pet:** sem filtro nativo. Mesma combinação com Anthropic se aplica.
- **Ponto forte:** **única opção que paga comissão sobre reservas reais**. Modelo de revenue alinhado.
- **Ponto fraco:** depende do parceiro final aceitar tracking ID; tutor que abre o link e fecha pra reabrir direto pode quebrar atribuição.

### 1.3 Skyscanner Affiliate (direto)

- **URL:** https://partners.skyscanner.net/
- **O que entrega:** apenas widgets e deep links de busca; **não há API REST de search**. Skyscanner descontinuou o B2B Search API em 2023.
- **Modelo de preço:** gratuito. Comissão ~50% da comissão Skyscanner recebe do parceiro (efetivamente ~1% do bilhete).
- **Aprovação:** lenta — semanas. Exige tráfego histórico mínimo (~10k visualizações/mês). Pra app novo, geralmente recusam.
- **Recomendação:** **não usar** como fonte primária. Skyscanner como link em texto sem comissão é melhor que esperar aprovação.

### 1.4 Recomendação para v2

**Combo Amadeus + Travelpayouts:**
- Amadeus para search confiável de voos com preços atuais
- Travelpayouts para gerar deep links de reserva com tracking de comissão

Custo estimado mensal pra ~1.000 buscas de tutor: US$ 10-50 em Amadeus + zero em Travelpayouts. Receita: comissão de 0,5-1% sobre as reservas que vierem da nossa atribuição.

---

## 2. Hotéis — comparativo

### 2.1 Booking.com Affiliate Partner Programme

- **URL:** https://partners.booking.com/
- **O que entrega:** Demand API (hotéis com filtros, incluindo "pet-friendly"), deep links com tracking, widgets.
- **Modelo de preço:**
  - **Gratuito**
  - Comissão: 25-40% da comissão Booking ganha do hotel (efetivamente 4-6% do valor da reserva).
- **Aprovação:** moderada. Exige website ativo (≥3 meses), tráfego mínimo, descrição do produto. Demora 2-4 semanas.
- **Cobertura BR e mundo:** maior do mercado — 28+ milhões de listings.
- **Cobertura pet:** **filtro "pet-friendly" nativo** existe e é confiável (cada hotel reporta política pet, taxa por noite, peso máximo).
- **Ponto forte:** filtro pet-friendly é o mais maduro do mercado.
- **Ponto fraco:** Demand API tem rate limits agressivos; aprovação seletiva.

### 2.2 Hotels.com Affiliate (Expedia Group)

- **URL:** https://www.expediapartnersolutions.com/
- **O que entrega:** Expedia Affiliate Network (EAN) com hotéis, voos, carros, passagens. Cobertura comparável a Booking.
- **Modelo de preço:** comissão ~4-5% do valor da reserva.
- **Aprovação:** rigorosa. Exige tráfego significativo. Costuma ser mais difícil que Booking pra app novo.
- **Cobertura pet:** filtro existe mas qualidade dos dados é inferior a Booking.
- **Recomendação:** usar Booking primário, EAN como segunda opção pós-validação de mercado.

### 2.3 Recomendação para v2

**Booking.com Affiliate primário.** Aplicar assim que o app tiver mil downloads (provável demora de 2-4 semanas pra aprovação). Antes disso, gerar deep links de busca via Anthropic web search já é suficiente como ponte.

---

## 3. Transporte de pet especializado

Não existe API agregadora pra serviços tipo Pet Travel, Pet Air Carrier, agentes IPATA.

**Estratégia v2:**
- Manter Anthropic web search descobrindo provedores por rota
- Construir progressivamente uma base própria `pet_transport_providers` (table) populada por:
  1. Web search da IA durante geração de roteiro
  2. Tutor que reserva e marca "usei este serviço" no `trip_concierge_plans.selected_pet_transport_idx`
  3. Curadoria manual de top fornecedores conhecidos (IPATA member directory: https://www.ipata.org/find-a-pet-shipper)
- Acordo de afiliação direto com 2-3 grandes (Pet Travel SP, Pet Move, agentes IPATA brasileiros) — modelo offline, contrato bilateral, pagamento por lead qualificado.

---

## 4. Próximos passos sugeridos

1. **Aplicar para Travelpayouts agora** — aprovação rápida, sem requisitos de tráfego, gratuito. Já ganha comissão de qualquer link clicado.
2. **Aplicar para Booking.com Affiliate em paralelo** — começa a contar tempo de espera.
3. **Avaliar Amadeus Test environment** — 10k chamadas/mês de graça, dá pra ter prova de conceito v2 com preços reais sem custo.
4. **Documentar tracking IDs** — toda URL gerada pelo Concierge precisa ter `marker={tutor_id_hash}` ou similar pra atribuição.
5. **Adicionar tabela `affiliate_clicks`** — registrar cada `Linking.openURL` disparado dos cards do Concierge pra avaliar quais opções tutor de fato clica (sem isso a gente cega).

---

## 5. Estrutura sugerida de revenue tracking

```sql
CREATE TABLE public.affiliate_clicks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tutor_id uuid NOT NULL REFERENCES public.users(id),
  trip_id uuid REFERENCES public.trips(id),
  concierge_plan_id uuid REFERENCES public.trip_concierge_plans(id),
  vertical text NOT NULL CHECK (vertical IN ('flight','hotel','pet_transport','other')),
  partner_network text,          -- 'travelpayouts','booking','amadeus','direct'
  partner_label text,             -- 'LATAM', 'Hotel Adlon Berlin', etc.
  url_clicked text NOT NULL,
  tracking_marker text,           -- hash do tutor_id pra atribuição
  clicked_at timestamptz NOT NULL DEFAULT now()
);
```

Isso fica pra v2 — útil só quando tiver afiliação ativa.

---

## 6. Decisões pendentes pra Belisario

1. Aplicar ao **Travelpayouts** agora (~30min de trabalho)? Recomendo sim.
2. Aplicar ao **Booking Affiliate** agora (~1h, demora aprovação)? Recomendo sim.
3. **Markup próprio** sobre Amadeus search (cobrar do tutor por busca)? Não recomendo no MVP — atrito pra valor não comprovado.
4. **Plano premium auExpert Concierge** que justifica a mensalidade pelo valor da pesquisa+orçamento? **Recomendo fortemente** — alinha incentivos sem confundir o tutor com markup oculto.
5. Frequência de atualização do `trip_concierge_plans` — regenerar automaticamente quando expira (7 dias) ou só sob demanda? Recomendo sob demanda + banner "regenerar pra preços mais recentes" depois dos 7 dias.

---

**Pendência principal:** validar com pelo menos um teste real em produção que a IA atual (v1, sem APIs externas) entrega valor percebido suficiente antes de investir em integração. Se tutores não usam o concierge, não faz sentido pagar Amadeus.
