# Plano Elite auExpert — Transformar o App no Queridinho da Classe Dominante

**Data:** 22/04/2026
**Objetivo:** reposicionar auExpert para o tutor de elite (renda familiar R$ 15k+, orçamento pet R$ 1.500-5.000/mês) sem quebrar código existente. Plano único de R$ 129/mês com cobrança web.
**Filosofia guia:** qualidade de cliente e qualidade de resultado, cobrando o justo. Sem teatro de luxo, sem gamificação infantil, sem cutucada de massa.

---

## O princípio que rege todas as decisões abaixo

Elite no Brasil **reconhece qualidade, não precisa ser convencida por grito visual**. O que vende pra esse público é o contrário do que vende pra massa: menos exclamação, mais substância. Menos gamificação, mais autoridade clínica. Menos "jornada", mais ferramenta que funciona. Menos patinha fofa, mais elegância tipográfica.

A régua de cada decisão abaixo é uma pergunta única: **"isso seria publicado na Tatler, na Vogue Casa, ou no Olhar Digital?"** Se a resposta for Olhar Digital, está errado.

---

## Pilar 1 — Voz e copywriting (a mudança mais existencial)

O tom atual do app tem muito "Eba!", "Xi!", "Opa!", "Calma, humano!", "— seu pet". Isso é adorável pra classe média aspiracional, mas soa infantilizado pra elite. A voz do pet tem que sobreviver — ela é **o** diferencial da marca — mas precisa migrar de "cachorrinho animado" para "golden retriever sofisticado que observa o mundo". Tem que soar como se a narração fosse escrita por Clarice Lispector ouvindo um bulldog francês comentar o dia.

### O que trocar

**Antes:** *"Eba! Seu pet foi cadastrado com sucesso!"*
**Depois:** *"Pronto. Está tudo registrado."*

**Antes:** *"Xi! Algo deu errado. Tente de novo, humano!"*
**Depois:** *"Algo não saiu como esperado. Tente novamente."*

**Antes (narração):** *"Fui pro vet hoje, levei um espeto no braço mas fui bem corajoso!"*
**Depois (narração em 3ª pessoa, literária):** *"Rex foi ao veterinário esta manhã. A agulha não era novidade, mas o silêncio da sala, sim. Voltou mais grave, como se tivesse se lembrado de algo que não soube nomear."*

### Diretrizes da voz refinada

- **Terceira pessoa sempre** (regra 5 do CLAUDE.md se mantém).
- **Registro literário, não infantil.** Vocabulário de resenha de livro, não de rotulo de ração.
- **Afeto por precisão, não por exclamação.** A emoção vem do detalhe observado, não do ponto final duplo.
- **Sem onomatopeia, sem "humano", sem vocativo fofinho.** O pet não fala com o tutor — descreve o dia em que o tutor também apareceu.
- **Nomes próprios usados com respeito.** "Rex foi ao parque" em vez de "o Rex foi brincar no parquinho".
- **Assinatura discreta.** Ao invés de "— seu pet", basta um pontilhado ou nada — a voz é suficiente como assinatura.

### Onde aplicar

Reescrever integralmente os arquivos de i18n:
- `i18n/pt-BR.json` — todas as chaves `toast.*`, `errors.*`, prompts da IA em edge functions, microcopy de onboarding.
- `i18n/en-US.json` — equivalente no registro literário inglês.

**Edge functions que geram copy** (`bridge-health-to-diary`, `generate-personality`, `generate-ai-insight`, `classify-diary-entry`): atualizar o prompt de sistema para incluir diretriz literária explícita. Exemplo de nova regra no prompt:

> *Voice rules: write as a third-person narrator observing the pet's inner life. Use precise, literary Portuguese. No exclamation marks, no onomatopoeia, no pet-owner vocatives. Emotional depth comes from observed detail, not performed excitement. Reference: Clarice Lispector narrating a small act.*

Sem mexer em código nenhum de orquestração — só prompt e i18n. Zero risco de quebra.

---

## Pilar 2 — Design system (refinamento, não revolução)

A identidade dark atual já está alinhada com o posicionamento elite. O que precisa de ajuste é sutil mas importante: **mais respiro, mais hierarquia editorial, menos saturação**.

### Tipografia — introduzir um serif

O Sora sozinho dá identidade tech. Adicionar uma fonte serif pra títulos e narração traz sensação editorial imediata:

- **Headers e títulos de tela:** Fraunces ou Playfair Display (serif, peso 600).
- **Corpo:** Sora continua.
- **Narração do pet:** **Cormorant Garamond Italic** substituindo Caveat. Caveat é handwriting cartunesco — Cormorant é italics de livro bom. A narração ganha imediatamente peso literário.
- **Dados/scores/timestamps:** JetBrains Mono continua.

Impacto no código: zero. Troca de `fontFamily` em `constants/fonts.ts` e adição da fonte no load do Expo. Nenhuma lógica tocada.

### Paleta — dessaturar levemente

O laranja atual `#E8813A` é ótimo mas pode pesar um clique na direção editorial:

- **Accent editorial:** `#D17547` (terracota quente, ainda identificável como "laranja da marca" mas com pátina menos neon).
- **Accent original** pode ficar como `accentBright` para CTAs específicos que precisem de energia.
- **Warm dark opcional:** um segundo background `#14201C` (dark com viés quente, quase charcoal) para modo leitura (Diário, editorial). Mais acolhedor que o azul petróleo.

Mudança é 2 linhas em `constants/colors.ts`. Zero quebra.

### Layout — mais respiro

- Aumentar spacing vertical entre blocos em 30% (de `rs(16)` médio pra `rs(24)`).
- Hero imagery: sempre que tiver foto do pet, ela ganha proporção 16:9 ou 4:5, sem crop agressivo, sem overlay visual sobreposto.
- Cards com menos info empilhada — cada card um respiro, uma foto, três linhas de texto no máximo.
- Home do hub: foto do pet como hero absoluto da tela, stats como linha sutil embaixo, não como cards coloridos.

Não é redesign — é aumentar `padding` e diminuir densidade. Pode ser feito tela por tela sem tocar em lógica.

### Remover do design

- **Paw PNGs coloridos nos toasts** (`pata_verde.png`, `pata_vermelha.png`, etc.): substituir por ícone Lucide em círculo com cor semântica. Mantém a clareza visual de sucesso/erro sem o cartum. O componente `ToastPaw.tsx` continua existindo — só muda o que renderiza dentro.
- **Glow laranja forte em botões biométricos**: reduzir opacity de 0.25 pra 0.12. Menos LED, mais joalheria.

---

## Pilar 3 — Remover gamificação infantil

O CLAUDE.md atual menciona em pós-MVP: "Conquistas Pet — 30 emblemas, XP, níveis", "Proof of Love (none → bronze → silver → gold → diamond)", "Pet-Credits como moeda". **Nada disso combina com elite.** Tutor elite não coleciona emblema de ter escovado o dente do pet. Não quer ser gamificado.

### O que fazer

- **Remover dos roadmaps public-facing:** XP, níveis, badges, Proof of Love colorido, Pet-Credits.
- **Substituir por indicadores discretos de consistência.** Um tutor que registrou entradas 20 dias seguidos vê um pequeno selo "Hábito consistente" — texto simples, cor única. Nada competitivo, nada comparativo.
- **Retrospectivas periódicas** (mensal, anual) como substituto elegante de gamificação. Ver Pilar 6.

O código de XP/badges se ainda não foi escrito, não escreve. Se já tem tabela `pet_achievements` na migration, mantém no banco (soft-remove na UI) e documenta como deprecado.

---

## Pilar 4 — Aldeia reposicionada como "Círculo"

A Aldeia como está especificada é um aplicativo diferente dentro do auExpert — "rede solidária hiperlocal" com 22 tabelas, Pet-Credits, favores, grafo social, avatares IA pra resolver cold start. Esse produto dentro do produto **fala para o tutor de classe média engajada, não para a elite**. Elite não pede favor pro vizinho — contrata dog walker. Não troca ração — compra a melhor. Não quer feed comunitário misturando pets aleatórios — quer curadoria.

### O reframe

**Aldeia → Círculo.** Mudança de conceito, não só de nome:

- **Por convite apenas** (trial first year: auto-convite a quem aceita termo). Ou seja — é uma camada dentro do app, não uma rede aberta.
- **Curadoria editorial, não feed público.** Uma seção "Círculo" que funciona como uma pequena revista:
  - Perfis mensais de tutores interessantes (entrevistas curtas, bem escritas).
  - Lista curada de veterinários parceiros (por cidade).
  - Hotéis pet-friendly premium, spas, passeios.
  - Eventos exclusivos (feira de criadores éticos, workshop de comportamento animal com nome conhecido).
- **Sem Pet-Credits, sem favores, sem grafo social.** Remove completamente.
- **Sem SOS comunitário público.** Elite com emergência liga pro vet particular ou usa concierge.
- **Sim: rede de clínicas parceiras para viagens.** O tutor que viaja pra Trancoso tem, no Círculo, a indicação da melhor clínica da região caso precise.

### O que remove do roadmap

Das 22 tabelas documentadas da Aldeia, ficam no máximo 8: `circulo_members`, `circulo_partners` (substitui `aldeia_partners`), `circulo_editorial_posts`, `circulo_events`, `circulo_event_rsvps`, `circulo_vets_directory`, `circulo_hotels_directory`, `circulo_memorials`. O resto (feed, reactions, pet graph, favors, credits, alerts, classifieds, reviews, rankings, health alerts coletivos, avatares) fica em docs de arquivo como "considerado e descartado para posicionamento elite".

### O que ganha

Muita coisa deixa de ser construída. Seis a oito meses de dev que iam para Aldeia voltam pro core. Isso é acelerador gigantesco do MVP.

---

## Pilar 5 — Autoridade clínica visível (adição nova, existencial)

Elite compra de gente e de autoridade, não de app. **Se o auExpert não tiver uma cara humana reconhecível por trás dele, a elite não confia.**

### O que adicionar

**Página "Conselho Clínico"** (no site e no app, seção settings/sobre):

- Três nomes reais de veterinários de prestígio como Conselheiros Clínicos. Não precisam ser celebridade — precisam ter CRMV, especialização reconhecida, foto profissional decente, bio de 3 linhas. Ex: um(a) veterinário(a) especializado em dermatologia, outro(a) em comportamento, outro(a) em geriatria pet.
- Como aparecem no app: rodapé da tela de análise IA diz "Análise baseada em diretrizes revisadas pelo Conselho Clínico auExpert". Só isso. Discreto, autoritativo.
- Modelo de relação com eles: consultoria mensal remunerada de R$ 2-3k/mês cada, revisão trimestral dos prompts principais e da evolução do produto. Não é fachada — é uma camada real de revisão clínica.

**Editorial mensal escrito por um dos conselheiros** (1 artigo/mês, 1500 palavras, tema atual — ex: "O que saber antes de adotar um golden retriever", "Sinais precoces de disfunção cognitiva em gatos idosos"). Aparece no Círculo e vai pra newsletter.

**Credenciais no prontuário gerado.** O PDF de prontuário inclui no cabeçalho: "Documento gerado pelo auExpert com base em dados fornecidos pelo tutor. Para uso clínico, apresente à sua veterinária(o) de confiança."

Impacto no código: uma nova tela estática, uma coluna `reviewed_by` opcional em `prontuario_cache`, ajuste de template do PDF. Trivial.

---

## Pilar 6 — Features aspiracionais (adição)

Features que justificam sozinhas R$ 129/mês aos olhos da elite. Cada uma dessas é pilar de retenção anual.

### 6.1 Retrospectiva anual do pet

No dia 31 de dezembro (e também no aniversário do pet, se registrado), o app gera automaticamente uma retrospectiva editorial:
- Foto-capa (a mais admirada do ano ou a que o tutor marcar).
- 12 meses em 12 páginas, uma história por mês construída a partir do diário + narrações + análises.
- Estatísticas discretas (não gamificadas): "Rex passou 3 manhãs de inverno deitado na cozinha. Ficou curioso com 47 animais que cruzaram o caminho."
- Exportável como PDF no template luxuoso + opção de imprimir como livro via parceiro (Photobook, Umbrella Books, integração via link externo com affiliate).

Como isso encaixa no código atual: reutiliza integralmente o pipeline de `generate-prontuario` + template de PDF + dados do diário. É uma EF nova (`generate-yearly-retrospective`) que não toca em nada existente. Pode ser feita em 1-2 semanas de dev no final do MVP.

### 6.2 Carta ao pet (registrar memória)

Funcionalidade discreta no menu de settings do pet: "Escrever uma carta para [nome]". Tutor escreve um texto longo, o app arquiva com data, e na retrospectiva anual (ou em marcos) aparece como "Cartas que o tutor deixou pra Rex". Também disponível para leitura no aniversário do pet e como parte do "Legado" (ver 6.3).

Impacto técnico: uma tabela nova `pet_letters`, um editor simples. Não mexe em nada existente.

### 6.3 Plano de legado ("Testamento emocional" refinado)

O CLAUDE.md já lista isso como pós-MVP. Tornar elite:

- Formulário clínico e afetivo: quem cuida de Rex se algo acontecer comigo? Onde estão as vacinas? Quais são as alergias? Qual o veterinário? Qual a ração? O que Rex gosta? Do que tem medo?
- Exportável como PDF de 4 páginas (template sóbrio, sério) chamado "Plano de Legado para [nome]".
- Pode ser compartilhado (link ou PDF) com o guardião designado, que recebe notificação "Você foi designado guardião de Rex no plano de legado do tutor".
- Zero melodrama no copy — linguagem de documento notarial afetivo.

Zero risco técnico: tabela nova `pet_legacy_plans`, exportação PDF, compartilhamento via link assinado.

### 6.4 Documento de viagem internacional

Para tutor cosmopolita: "Prepare a viagem com Rex". Seleciona país destino, o app gera:
- Lista de vacinas obrigatórias com status (em dia / vencida / não aplicada).
- Check de microchip.
- Lista de documentos necessários (atestado internacional, CVI).
- Lista de companhias aéreas pet-friendly com peso máximo do pet, custo estimado.
- Ficha clínica em inglês (exportável).

Diferencial brutal para o tutor elite que viaja. Dados já existem no app — é só reorganização + uma tabela de regras por país. 3-4 semanas de dev, bem depois do MVP.

### 6.5 Atestado de saúde emocional

Ficha PDF sóbria e oficial-looking para apresentar em hotéis pet-friendly, pet-shops de destino, etc. "Rex é um cão equilibrado, socialmente adaptado, sem histórico de agressividade. Vacinas em dia. Tutor responsável desde 2022."

Gerado com um clique. Sem promessa clínica, sem diagnóstico — é basicamente um resumo afetivo com data e identidade. Utilidade prática alta.

---

## Pilar 7 — Transparência e privacidade como diferencial

Elite é cética sobre dados. Transformar a postura em vantagem de marca.

### Página "Seus dados, seu controle"

Uma tela real em settings (não só texto legal), com:

- **Exportar tudo.** Botão que gera zip com todos os dados do tutor (JSON estruturado + todas as fotos em alta + PDFs consolidados). Sem captcha, sem e-mail de confirmação — ação direta.
- **Anonimização para treino de IA.** Toggle explícito. Default: DESLIGADO. Copy: "Se você autorizar, usaremos uma versão anonimizada dos seus dados (sem fotos, sem identificadores) para melhorar a IA. Você pode desligar a qualquer momento."
- **Apagar conta e todos os dados.** Botão vermelho, processo claro: 30 dias de grace, depois anonimização dupla e remoção física. Sem fricção artificial.

### Página "Como sua privacidade funciona"

Linguagem clara, sem juridiquês:

> *Usamos IA de última geração (Claude, da Anthropic). As análises de foto são processadas e descartadas — nenhuma foto fica armazenada nos servidores da IA. Seus dados clínicos ficam no Supabase (servidor Europa), criptografados, acessíveis só por você. Não vendemos dado nenhum, pra ninguém, nunca.*

Prestígio instantâneo. Elite reconhece e paga mais caro pela postura.

---

## Pilar 8 — Suporte humano e concierge

Elite espera resposta humana. Não robô, não chatbot, não FAQ.

### Layer mínimo viável

- **Suporte por email com SLA de 24h em dia útil.** Resposta assinada por pessoa real (fundador ou COO, na fase inicial). Zero auto-resposta genérica.
- **Onboarding email personalizado.** 30 minutos após assinar, tutor recebe email: "Belisario aqui, fundador do auExpert. Vi que Rex acabou de ser cadastrado — golden retriever é uma das raças mais queridas por aqui. Se precisar de algo, responda este email diretamente." Na fase inicial (primeiros 500 assinantes), é escrito à mão. Depois, template com variáveis dinâmicas.
- **Check-in 30 dias.** "Como tem sido sua experiência? Tem alguma funcionalidade que você sente falta?" — humano, assinado, breve.

### Add-on opcional (depois do MVP, não no lançamento)

**Conexão com veterinário remoto** — R$ 89/mês adicional (opcional). Tutor tem acesso a chat com veterinária(o) parceira, resposta em até 2h em horário comercial. Não substitui consulta presencial — é triagem clínica qualificada. Tutor liga e desliga quando quiser.

Isso **é** o Concierge, mas sem dar esse nome premium. É só "Conexão com veterinário remoto" — funcional, direto, justo.

---

## Pilar 9 — Site, marca e marketing

O app pode estar impecável — se o site for um template genérico de SaaS com "Get started", nada disso importa.

### Site

- **Editorial, fotográfico, quieto.** Referências: site da Hermès Petit H, do Loro Piana, da Aesop. Não: site de app tech.
- **Hero:** foto grande de cachorro ou gato em contexto natural, pouco texto. Não: mockup de iPhone com feature list.
- **Tipografia:** Fraunces ou Canela para headers, serif clássico.
- **Prova social:** não depoimento com estrelinha. Citação longa, em itálico, assinada por nome + raça do pet. Uma, no máximo duas por página.
- **Sem comparação com concorrentes.** Elite não quer ver "somos melhores que 11pets". Elite quer ver uma afirmação do produto em si.
- **Página "Conselho Clínico"** em destaque no menu.
- **Página "Editorial"** com os artigos mensais — vira SEO premium a longo prazo.

### Instagram

- Foto profissional ou foto amadora muito boa. Nunca print de tela ou infográfico.
- Legenda editorial, não caption de engajamento ("Etiqueta um amigo que ama cachorro" está banido).
- Posts raros (3-4/semana) e de qualidade. Menos volume, mais permanência.
- Reels só quando tiver algo real para mostrar (evento, novo conselheiro, feature nova filmada com calma).

### Aquisição

- **Parcerias com 20-30 veterinários premium** nas 5 maiores capitais. Modelo: aplicativo gratuito para 6 meses pra ele usar em paciente, incentivo financeiro discreto por indicação que vira assinatura (R$ 30 de comissão — não é o que o move, mas reconhece a indicação).
- **Newsletter semanal** editorial. Primeira barreira de aquisição: assinar newsletter é grátis, vira o funil pro app.
- **PR em veículos específicos:** Vogue Casa, Tatler Brasil, Wish Report, Casa Vogue, seção de estilo do Estadão. Zero press release pra imprensa tech.
- **Eventos presenciais pequenos** no Rio, SP e BH nos primeiros 12 meses: jantar com 15 tutores influentes da cidade, curadoria fechada, auExpert apresenta + escuta. Custo: R$ 15-25k por evento. ROI: 3-5 assinantes Premium vitalícios + word-of-mouth poderoso.
- **Zero Google Ads, zero Meta Ads de massa.** Custo alto, público errado.

---

## Sequência de execução — 4 ondas, sem quebrar código

### Onda 1 (semanas 1-3) — Trocas mecânicas sem lógica
Baixo risco, impacto imediato na percepção.

1. Reescrever integralmente `i18n/pt-BR.json` e `i18n/en-US.json` no registro literário (Pilar 1). Não mexe em código, só troca strings.
2. Atualizar prompts de sistema nas 5 edge functions de geração de texto (classify, bridge, narrate, insight, personality) com diretriz literária. Só troca prompt.
3. Substituir Caveat por Cormorant Garamond Italic em `constants/fonts.ts`. Adicionar Fraunces como serif de header.
4. Trocar paw PNGs nos toasts por ícone Lucide + cor semântica. Mesmo componente, novo conteúdo interno.
5. Ajustar paleta `#E8813A` → `#D17547` como `accent`, renomear antigo como `accentBright`.
6. Aumentar spacing vertical das telas principais (Hub, Pet, Diário, Health) em 20-30%.

### Onda 2 (semanas 4-6) — Adições que não tocam no core
Adicionar sem refatorar.

1. Criar páginas estáticas: "Conselho Clínico", "Seus dados, seu controle", "Como sua privacidade funciona" — só telas novas.
2. Adicionar botão "Exportar todos os dados" em settings (reutiliza infra de PDF + criar uma EF `export-full-user-data`).
3. Adicionar toggle "Anonimização para treino de IA" (lê/escreve `users.ai_training_consent`).
4. Implementar envio automático do email de onboarding personalizado (Edge Function + Resend/Postmark).

### Onda 3 (semanas 7-12) — Features aspiracionais
Retrospectiva + Legado + documentação de viagem. Só novas tabelas e EFs, zero refatoração.

1. `generate-yearly-retrospective` — nova EF + novo PDF template.
2. `pet_letters` — tabela + tela simples de composição.
3. `pet_legacy_plans` — tabela + form + PDF de legado.
4. `pet_travel_prep` — tabela de regras por país + EF + PDF.
5. `pet_health_attestation` — EF simples para gerar o atestado.

### Onda 4 (semanas 13-24) — Reframe Aldeia → Círculo e camada de marca
Mais tempo, mais impacto.

1. Documentar o reframe Aldeia → Círculo oficialmente (atualizar `aldeia-spec.md` como deprecated + novo `circulo-spec.md`).
2. Desenvolver Círculo como novo módulo (8 tabelas, 4-5 telas — bem menos que Aldeia).
3. Onboard dos 3 Conselheiros Clínicos (contrato, fotos, bios, primeiro artigo).
4. Redesign do site.
5. Primeiro evento presencial (SP ou RJ).
6. Pitching para Vogue Casa, Estadão.

---

## O que NÃO muda

Pra deixar claro o que está preservado:

- **Stack técnica inteira.** Expo, Supabase, React Query, Zustand, i18n, edge functions — nada troca.
- **Schema do banco core.** Todas as 12+ tabelas do MVP continuam como estão. Só adiciona novas.
- **Proteções do CLAUDE.md.** Regras invioláveis (i18n hardcode, soft-delete, RLS, getAIConfig) continuam.
- **Protected files.** `classify-diary-entry`, `analyze-pet-photo`, `useDiaryEntry`, `DocumentScanner` — nada desse pipeline é tocado.
- **Fluxo de publicação do diário.** Mic-first, anexos, Gravar no Diário, processamento em background — tudo igual.
- **20 lentes.** Continuam. Talvez renomear 1 ou 2 que soem cringes, mas arquitetura é idêntica.
- **Modelo de IA via `app_config`.** Mantido.

---

## Métricas de sucesso (leading indicators, primeiros 6 meses)

Como saber se o reposicionamento pegou:

- **Trial → paid conversion ≥ 45%.** Elite filtra na entrada — quem entra no trial e ativa é quem converte.
- **Churn mensal ≤ 3%.** Assinatura anual domina (> 65% dos pagantes); não devem sair rápido.
- **NPS ≥ 60.** Elite fala mal quando decepcionada, bem quando surpresa.
- **Word-of-mouth como aquisição principal.** Se > 40% dos novos assinantes vieram por indicação, está vencendo.
- **Nenhum review de 1 estrela mencionando "muito caro".** Se aparecer, o filtro de posicionamento está vazando.
- **Newsletter com abertura ≥ 50%.** Indicador de engajamento editorial real.

---

## O que decidir agora (pra destravar execução)

1. **Os 3 nomes do Conselho Clínico.** Sem isso, Pilar 5 não roda. Sugiro que você liste 5-6 veterinários que você respeita e faça a aproximação pessoalmente nas próximas 2 semanas. Oferece R$ 2-3k/mês + equity pequena (0,1-0,2%) em troca de consultoria mensal + nome/foto + 1 artigo/trimestre.
2. **A voz de referência pra reescrita do i18n.** Definir 1 ou 2 autores brasileiros como bússola (sugestões: Clarice Lispector, Ana Cristina Cesar, Raduan Nassar). Quando tiver dúvida de tom, pergunta "o Raduan escreveria assim?".
3. **O parceiro de print/photobook para Retrospectiva.** Escolher entre Photobook Brasil, Umbrella Books, Mimo. Afeta o acabamento da feature.
4. **Os 3 veículos editoriais para mirar em PR.** Vogue Casa, Tatler, Wish? Casa Vogue, Estadão Economia, Valor Econômico? Depende de onde está o teu ICP.

---

## Resumo em uma frase

**auExpert vira o app queridinho da elite quando parar de performar afeto cartunesco e começar a exercer afeto literário — sem mudar o que o produto faz, apenas como ele soa, respira e se apresenta.**
