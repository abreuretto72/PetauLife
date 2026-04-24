# Plano de Lançamento Elite — Junho de 2026

**Documento estratégico — 22 de abril de 2026**
**Autor:** Belisario Retto / Multiverso Digital
**Horizonte:** 8 semanas (22/abr → 16/jun) + abertura pública na segunda quinzena de junho
**Relação com outros documentos:** versão enxuta e executável do `2026-04-22_plano_elite_auexpert.md`, com recortes de escopo para caber em 8 semanas. O pitch do `2026-04-22_pitch_conselheiros_clinicos.md` fica para o segundo semestre.

---

## 0. Leitura em 30 segundos

Hoje é 22 de abril. O lançamento precisa acontecer até a última semana de junho — oito semanas calendário, das quais seis são de trabalho efetivo e duas são de rampa de usuários. Para caber no prazo sem sacrificar o posicionamento elite, corto tudo o que depende de terceiros (Conselho Clínico, Aldeia, estúdio de identidade, eventos), e mantenho só o que a Multiverso executa sozinha com as ferramentas que já estão no projeto. O app sai em junho como **produto elite enxuto mas coerente**, e cresce em camadas durante o segundo semestre.

A aposta central é: o posicionamento elite não exige o conjunto completo de funcionalidades aspiracionais do plano original. Ele exige coerência de voz, sobriedade visual, preço e preservação rigorosa da promessa técnica. Tudo isso cabe em oito semanas se a prioridade for disciplina, não ambição.

---

## 1. O que entra no lançamento de junho

### 1.1 Núcleo do produto (já existe, preservar)

Permanece intacto tudo o que hoje funciona no MVP do Diário Inteligente: login com biometria, cadastro de pets (cães e gatos), Hub Meus Pets, diário com entrada unificada por voz, texto e mídia, análise de foto por IA, prontuário com vacinas e alergias, RAG isolado por pet, notificações push, exportação em PDF. A arquitetura de Edge Functions, a pilha Supabase, a orquestração com Claude Sonnet 4.6 e Haiku 4.5, o sistema de i18n e as regras invioláveis do CLAUDE.md continuam sendo a base. Nada disso muda.

### 1.2 O que precisa ser refinado (trabalho da equipe)

Cinco frentes de refinamento acontecem em paralelo nas primeiras quatro semanas. Todas são mudanças de superfície — tipografia, texto, paleta, ícones, copy — que não tocam arquivos protegidos e não quebram lógica de negócio.

A primeira frente é **a reescrita da voz no i18n**. As strings de toast, erro, narração e copywriting hoje usam linguagem afetiva e coloquial ("Eba!", "Xi!", "humano!", "— seu pet"). Para o posicionamento elite, a voz precisa migrar para um registro literário em terceira pessoa, sóbrio e contido, sem perder calor. A referência estilística é a prosa de Clarice Lispector ou Raduan Nassar — frase curta, palavra precisa, cadência controlada. O trabalho é textual, feito diretamente em `i18n/pt-BR.json` e `i18n/en-US.json`, chave por chave, sem alterar a estrutura dos arquivos nem os nomes das chaves.

A segunda frente é **o ajuste da paleta e da tipografia**. O laranja vibrante atual (#E8813A) é substituído pelo âmbar terroso (#D17547) em `constants/colors.ts`, e todos os componentes que hoje importam `accent` herdam a nova cor sem alteração de código. A fonte cursiva Caveat, usada na narração do pet, é substituída por Cormorant Garamond Italic — fonte serif disponível gratuitamente no Google Fonts, que preserva o caráter manuscrito mas com compostura literária. A troca acontece em `constants/fonts.ts`. Sora permanece como tipografia de interface.

A terceira frente é **a substituição dos ícones infantis**. As quatro patinhas coloridas do componente Toast (`pata_verde.png`, `pata_vermelha.png`, `pata_amarela.png`, `pata_rosa.png`) são substituídas por ícones geométricos do Lucide — `CheckCircle2` para sucesso, `AlertCircle` para erro, `AlertTriangle` para aviso, `Info` para informação. A paleta de fundo permanece (verde, vermelho, amarelo, rosa) para preservar a gramática de cores por tipo de mensagem, mas o ícone em si muda de ilustração cartoon para símbolo técnico. Código do ToastPaw troca o `Image` por um ícone Lucide conforme o tipo.

A quarta frente é **a remoção da gamificação do MVP**. Toda menção a XP, badges, conquistas, níveis, medalhas e Proof of Love some da interface do lançamento. O código relacionado não precisa ser apagado — pode ficar em arquivos que não são montados no bundle atual. Na prática, remove-se a importação e o render desses componentes nas telas que os exibem. O tempo gasto é baixo e o ganho de sobriedade é alto.

A quinta frente é **o logotipo**. É aqui que o prazo aperta. A recomendação firme é o **caminho mínimo** detalhado na conversa anterior: contratar um designer tipográfico nos próximos dez dias para entregar, em até três semanas, um wordmark puro da palavra "auExpert" em serif elegante (Cormorant, GT Sectra, Editorial New) ou sans contemporâneo sóbrio (Söhne, Neue Haas Grotesk). Sem mascote, sem balão de fala, sem ilustração. O arquivo PNG transparente entregue substitui `logotipotrans.png` no mesmo caminho, o componente `AuExpertLogo` continua funcionando sem mudança de código. O ícone do aplicativo (o `icon_app_ok.png` com o cachorrinho) permanece no primeiro lançamento — é visto em tamanho pequeno e o tutor só o encontra depois de ter decidido instalar, então o desalinho tem impacto menor e pode ser corrigido na primeira atualização pós-junho.

### 1.3 O que é adicionado do zero (funcionalidade nova mínima)

Duas adições são indispensáveis e cabem no prazo.

A primeira é o **fluxo de assinatura por Pagar.me via site**. O tutor se cadastra no site, insere cartão, completa o pagamento, recebe um link de ativação. No app, faz login com as mesmas credenciais e entra já como assinante. O teste gratuito de 14 dias é controlado por flag no banco com data de expiração. A integração tem três peças: uma página de checkout no site, uma Edge Function `subscription-webhook` que recebe eventos do Pagar.me e atualiza a tabela `subscriptions`, e um hook `useSubscription()` no app que bloqueia funcionalidades premium em caso de assinatura inativa. Nenhuma dessas peças toca arquivos protegidos.

A segunda é a **página institucional do site**. Uma página única, sóbria, com o logotipo novo no topo, um parágrafo de manifesto sobre o que é o app, três blocos curtos descrevendo diário, prontuário e análise, o preço, um botão de assinatura, e um rodapé com política de privacidade, termos de uso e contato. O site não precisa de CMS, nem de blog, nem de área logada — apenas uma landing page estática hospedada em Vercel ou Netlify. Custo próximo de zero.

### 1.4 Suporte humano como substituto do Conselho

Sem Conselho Clínico em junho, a autoridade técnica precisa vir de outro lugar. A resposta simples é: **suporte humano direto com o fundador** nas primeiras semanas. Um canal dedicado de WhatsApp Business, respondido pessoalmente por você, com tempo de resposta inferior a duas horas em horário comercial, nas primeiras 200 assinaturas. Isso não escala — e não precisa escalar. É exatamente o que o tutor elite espera dos primeiros dias de um produto de nicho: contato direto com quem faz. E funciona como pesquisa de mercado em tempo real, calibrando o produto antes da abertura plena.

---

## 2. O que sai do escopo de junho

Cortes explícitos, com data alvo para reentrada no roadmap.

**Conselho Clínico** — adiado para setembro/outubro de 2026. Recrutar três veterinários exige seis a oito semanas só de abordagem e negociação, e o processo não suporta aceleração sem perder qualidade dos nomes. O lançamento de junho acontece com autoridade clínica construída pelo cuidado do produto e pelo atendimento direto do fundador, e o Conselho é anunciado como grande movimento de segundo semestre — o que transforma a entrada dos veterinários em evento, não em requisito.

**Aldeia / Círculo** — permanece pós-MVP, sem data. As 22 tabelas, o grafo social do pet, o sistema de favores, SOS, eventos e Pet-Credits são a visão de expansão da plataforma para 2027. Em junho, nada disso aparece.

**Retrospectiva anual de IA** — precisa de doze meses de dados para fazer sentido. Sai. Volta em dezembro.

**Cartas do futuro, testamento emocional, cápsulas do tempo, roteiros de viagem, nutrição com cardápio IA** — todas as funcionalidades aspiracionais previstas no plano elite original saem do escopo de junho. Entram em camadas trimestrais no segundo semestre, começando pelo que depender de menos dados acumulados.

**Dataset proprietário para IA, anonimização, correlações clínicas** — sai. Essa infraestrutura precisa de volume de usuários para justificar o esforço de engenharia. Quando a base passar de 2.000 tutores ativos, volta à pauta.

**Avatares IA para cold start da Aldeia** — sai junto com a Aldeia.

**Eventos presenciais, parcerias com clínicas, programa de indicação curada** — nada disso em junho. Entram no segundo semestre, já com Conselho Clínico em lugar para dar ancoragem institucional.

**Redesenho pleno de identidade com estúdio** — contrata-se em julho ou agosto, com entrega prevista para outubro. É o que sustenta o anúncio público do Conselho Clínico. Em junho, vive-se com o wordmark refinado feito na semana 1 e o ícone antigo no aplicativo.

---

## 3. Cronograma de oito semanas

### Semana 1 (22/abr — 28/abr) — Decisões e contratações

Três decisões irreversíveis precisam ser tomadas nos primeiros três dias: o autor de referência da voz literária (Clarice Lispector ou Raduan Nassar — recomendação Clarice, pela proximidade com prosa contemporânea urbana), a família tipográfica do novo logotipo, e o designer tipográfico que será contratado. Em paralelo, conta Pagar.me ativada com todos os documentos da Multiverso Digital aprovados, conta de e-mail transacional configurada, domínio do site apontado para Vercel.

Ao final da semana, três contratos estão assinados: designer do logotipo, redator de apoio para reescrita do i18n (se você não fizer sozinho), e contador para emitir as primeiras notas fiscais de assinatura.

### Semana 2 (29/abr — 05/mai) — Paleta, tipografia, voz

Ajuste de `constants/colors.ts` para o âmbar terroso (#D17547) e verificação visual em todas as telas — o impacto é maior do que parece, porque o laranja aparece em botões, ícones clicáveis, badges, CTAs. Troca de `constants/fonts.ts` para Cormorant Garamond Italic na narração. Reescrita integral do `i18n/pt-BR.json` e `i18n/en-US.json` em registro literário — é o trabalho mais demorado e mais importante da semana. Cada chave revisada com a pergunta: "uma pessoa da classe dominante leria isso e sentiria afinidade ou estranhamento?".

### Semana 3 (06/mai — 12/mai) — Ícones e sobriedade visual

Substituição das patinhas PNG por ícones Lucide no componente Toast. Remoção da gamificação das telas onde ela aparece — busca por `XP`, `badge`, `conquista`, `Proof of Love`, `medalha`, `nivel`, e remoção de imports e renders correspondentes. Verificação de que nenhum arquivo protegido do CLAUDE.md foi tocado. QA visual completo em device real: iPhone SE, iPhone 14, Android médio, Android grande.

Entregável da semana: logotipo novo recebido do designer, aprovado, substituído em `assets/images/logotipotrans.png`.

### Semana 4 (13/mai — 19/mai) — Assinatura e site

Implementação da integração Pagar.me. Criação da tabela `subscriptions` (com NOTIFY pgrst após a migração), da Edge Function `subscription-webhook`, do hook `useSubscription()` e do componente `<PremiumGate>`. Teste completo do fluxo: cadastro no site, pagamento com cartão de teste, recebimento do webhook, ativação da conta, login no app, verificação do status premium, bloqueio gracioso caso assinatura expire.

Em paralelo, construção da landing page: manifesto, três blocos, preço, botão de assinatura, rodapé com privacidade e termos. Tom da escrita: o mesmo da voz literária adotada no app. Zero ícones ilustrativos. Fotografia de pet real em preto e branco, de autoria própria ou com licença.

### Semana 5 (20/mai — 26/mai) — QA integrado

Primeira semana em que o sistema inteiro — app, site, assinatura, banco, Edge Functions — precisa funcionar ponta a ponta. Cinco testadores convidados (você, Anita, mais três pessoas de confiança de perfil elite) completam o fluxo do zero: descobrem o produto, assinam, instalam o app, fazem login, adicionam pet, registram entrada de diário, fotografam carteira de vacina, exportam PDF. Cada atrito encontrado vira ticket e é corrigido na mesma semana.

### Semana 6 (27/mai — 02/jun) — Bug bash e polimento

Semana dedicada exclusivamente a correção de bugs, ajuste fino de copy, revisão de microcopy, testes de offline, testes de recuperação de senha, testes de reset biométrico, testes em conexões lentas. Nada de funcionalidade nova. Congela-se o escopo e termina-se o que existe.

Ao final da semana, o canal de WhatsApp Business de suporte está ativo, com número impresso no site e dentro do app (tela de ajuda).

### Semana 7 (03/jun — 09/jun) — Soft launch por convite

Abertura para 50 tutores convidados pessoalmente — amigos, família, contatos diretos da sua rede, nunca mais do que cinquenta. Cada um recebe um link de assinatura com código promocional de 30 dias grátis (30 em vez dos 14 padrão, como cortesia por serem os primeiros). Canal de WhatsApp aberto para estas cinquenta pessoas. Resposta pessoal do fundador em até uma hora durante horário comercial.

Objetivo da semana: ouvir. Não é hora de vender, é hora de aprender. Cada conversa de WhatsApp é registrada, cada atrito é classificado, cada elogio é calibrador.

### Semana 8 (10/jun — 16/jun) — Ajustes e preparação do anúncio

Implementação dos ajustes urgentes identificados no soft launch. Preparação do material de lançamento público: três posts institucionais para Instagram e LinkedIn no tom sóbrio do app, uma nota para veículos especializados (Petmag, portais de pet premium), um e-mail para lista de contatos pessoais qualificados.

### Semana 9 (17/jun — 23/jun) — Abertura pública

Anúncio público silencioso. Nada de evento, nada de live, nada de influenciador. Posts nas redes da empresa, e-mail para a lista, nota para três a cinco veículos. O tutor elite descobre o produto por uma destas vias e chega ao site, assina pelo fluxo já testado, instala o app pelas lojas, começa a usar. Em paralelo, seguimento do soft launch continua — os cinquenta convidados do mês anterior viram primeiros embaixadores orgânicos.

### Semana 10 (24/jun — 30/jun) — Consolidação

Primeira semana de operação em regime. Monitoramento de métricas (assinaturas, churn, uso diário, entradas de diário, análises de foto), atendimento via WhatsApp, correções pontuais, começo de conversas preliminares com candidatos ao Conselho Clínico para setembro. Final do mês, reunião de balanço interno, definição do roadmap de julho a setembro.

---

## 4. Metas realistas para junho

Um mês após a abertura pública (final de junho até final de julho), a meta conservadora é **150 assinantes pagos**. Em posicionamento elite, esse número representa receita mensal próxima de R$ 19.500 e confirma que o produto ressoa com a audiência certa, antes de qualquer investimento em escala.

Meta intermediária ambiciosa: 300 assinantes até final de julho. Meta otimista que vira estudo de caso: 500 assinantes. Nenhuma dessas metas depende de mídia paga — elas se sustentam apenas com a rede pessoal, o boca a boca qualificado, e a curadoria natural de um produto que encontra o seu público.

O número que de fato importa não é o total, é o churn. Se dos 150 primeiros apenas 3 cancelarem no segundo mês, o produto está calibrado. Se 30 cancelarem, algo na proposta está errado e a prioridade vira investigação antes de qualquer crescimento.

---

## 5. Orçamento do período

Estimativa de gastos diretos de 22 de abril a 30 de junho, em reais.

**Designer tipográfico para o wordmark** — entre R$ 4.000 e R$ 8.000 dependendo do profissional escolhido. Recomendação: contratar alguém da faixa intermediária, não o mais barato nem o mais renomado.

**Redator de apoio para i18n** — opcional, entre R$ 2.500 e R$ 5.000 se contratado. Se feito pelo fundador, custo zero.

**Fotografia do site** — R$ 1.500 a R$ 3.500 para uma sessão profissional com dois pets, uso de uma editora de cores sóbrias, direitos de uso para o site e aplicativo.

**Hospedagem do site (Vercel, três meses)** — R$ 0 no plano gratuito, suficiente para a escala inicial.

**Infraestrutura Supabase (junho, projeção)** — entre R$ 150 e R$ 500 dependendo do volume de usuários. Com 150 assinantes, fica na faixa baixa.

**Claude API (junho, projeção com 150 assinantes heavy users)** — entre R$ 3.000 e R$ 9.000. Receita correspondente: R$ 19.500. Margem ainda saudável.

**Contador, notas fiscais, jurídico de termos** — R$ 2.000 inicial mais R$ 500 mensais. Esse custo precisa entrar já em maio.

**Material de lançamento (posts, release)** — entre R$ 0 e R$ 2.000. Pode ser feito internamente.

Soma de gastos únicos do período: R$ 10.000 a R$ 20.000. Soma de gastos recorrentes a partir de junho: R$ 3.500 a R$ 10.000 mensais no patamar inicial. Com 150 assinantes em junho gerando R$ 19.500 de receita, o produto abre o mês de julho em equilíbrio e entra em margem positiva já no segundo mês de operação.

---

## 6. Riscos e o que fazer com cada um

**Risco do logotipo atrasar.** O designer contratado não entrega no prazo, ou entrega algo que não serve. Mitigação: contratar dois designers em paralelo na semana 1, pagando taxa menor a cada um para uma primeira proposta, e escolher na semana 2 com quem seguir para a versão final. Dobra-se o custo inicial (R$ 8.000 a R$ 16.000) mas elimina-se o risco de ficar sem logotipo em maio.

**Risco da integração Pagar.me travar.** Webhooks não chegam, notas fiscais não emitem, reconciliação bancária falha. Mitigação: reservar a semana 4 inteira para essa frente, com dia 5 da semana como prazo limite para ter o fluxo rodando — se não rodar até lá, pausa-se tudo o mais e o fundador dedica os dias restantes à integração. Isso é a única peça do plano cujo atraso inviabiliza o lançamento.

**Risco de lançar com bugs de experiência.** Um erro não crítico mas visível em um fluxo comum pode destruir a primeira impressão. Mitigação: o soft launch da semana 7 existe exatamente para isso. Nenhum lançamento público acontece se a semana 7 revelar mais de dois bugs de impacto alto.

**Risco de copy inconsistente.** Pedaços da interface em voz antiga convivendo com pedaços em voz literária nova é pior do que manter a voz antiga inteira. Mitigação: a reescrita da semana 2 precisa ser integral, não seletiva. Se não der tempo de reescrever tudo, aceita-se recuar para a voz atual em alguns blocos e registra-se dívida técnica para o mês seguinte, mas nunca se aceita hibridez.

**Risco de o mercado não responder.** As 150 assinaturas não aparecem. Mitigação: o plano não prevê investimento em mídia paga precisamente porque preservar capital nos primeiros três meses é o que permite experimentar canais no trimestre seguinte sem urgência. Se o lançamento silencioso não trouxer resposta, julho vira mês de diagnóstico — conversar com os que não assinaram, entender por quê, ajustar posicionamento antes de investir.

---

## 7. O que NÃO fazer durante as oito semanas

Lista curta de coisas que, se aparecerem como tentação, devem ser recusadas sem discussão.

Não mexer em arquivos protegidos do CLAUDE.md. Qualquer ajuste de comportamento nos fluxos centrais do diário, classificação, análise de foto ou documento scanner precisa esperar julho.

Não adicionar funcionalidade nova além do fluxo de assinatura. Ideias boas que surgirem em reunião viram tickets no roadmap de julho, não viram implementações de maio.

Não abrir conversa pública sobre o Conselho Clínico antes do lançamento. O silêncio até setembro é estratégico — o anúncio do Conselho precisa ser o maior movimento público do segundo semestre, e só é o maior se for surpresa.

Não aceitar influenciadores oferecendo parceria de lançamento. A voz do produto é o oposto da voz de influenciador. Uma única parceria errada polui o posicionamento de forma difícil de recuperar.

Não pagar por mídia nos primeiros trinta dias de operação. O aprendizado orgânico dos primeiros cinquenta convidados e dos primeiros cento e cinquenta assinantes é informação que vale mais do que alcance de anúncio.

Não ceder ao pedido de versão gratuita, plano mais barato, ou teste estendido além dos 14 dias padrão (com exceção dos 30 dias de cortesia do soft launch). Preço e escassez são parte do posicionamento — ceder neles sinaliza que a marca não acredita no próprio valor.

---

## 8. O estado do app em 30 de junho

Se o plano for executado sem desvios, em 30 de junho o estado do auExpert será o seguinte.

O produto está em operação pública, disponível em iOS e Android, com site institucional ativo e fluxo de assinatura funcionando por Pagar.me. Entre 150 e 300 tutores pagantes estão usando o app ativamente. A voz do produto é coerente em todos os pontos de contato — site, app, e-mail transacional, WhatsApp de suporte —, a identidade visual está contida e elegante, o logotipo é um wordmark refinado, o ícone do aplicativo está agendado para renovação na primeira atualização pós-lançamento.

A gamificação foi removida. As patinhas coloridas deram lugar a ícones geométricos. A paleta migrou do laranja vibrante para o âmbar terroso. A narração do pet está em Cormorant Garamond Italic, com copy em registro literário que o tutor elite lê sem constrangimento. O prontuário clínico funciona, a análise de foto funciona, o diário funciona, o PDF exporta, a busca por RAG responde por pet.

O Conselho Clínico não existe ainda, mas a lista de candidatos está sendo compilada e o primeiro contato está previsto para agosto. A Aldeia continua no congelador. A identidade visual plena, com estúdio, está contratada com entrega prevista para outubro.

O fundador atende o WhatsApp pessoalmente. Cada tutor que cancela recebe um telefonema. Cada tutor que elogia recebe um agradecimento escrito. Essas práticas são insustentáveis em escala e são exatamente por isso que funcionam em 150 usuários.

A Multiverso Digital entra em julho com caixa positivo, dados reais de uso, base calibrada de tutores elite, e o roadmap do segundo semestre focado em três vetores: Conselho Clínico, funcionalidades aspiracionais (retrospectiva, cartas, legado), e identidade visual plena. Nessa ordem.

---

*Documento operacional — Multiverso Digital — 22 de abril de 2026.*
*Este plano substitui o escopo original do `2026-04-22_plano_elite_auexpert.md` para o período de 22/abr a 30/jun. O plano original volta a valer como roadmap do segundo semestre, a partir de 1º de julho.*
