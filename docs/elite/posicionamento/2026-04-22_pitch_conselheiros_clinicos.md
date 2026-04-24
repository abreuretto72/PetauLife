# Pitch para o Conselho Clínico auExpert

**Documento estratégico — abril/2026**
**Autor:** Belisario Retto / Multiverso Digital
**Finalidade:** Apresentar o auExpert a médicos veterinários candidatos ao Conselho Clínico do app e conduzi-los, em 4–6 semanas, do primeiro contato à assinatura do contrato de consultoria.

---

## 0. Leitura deste documento em 60 segundos

Você está recrutando três médicos veterinários para serem a autoridade clínica visível de um aplicativo premium de cuidado preventivo. Não é influenciador. Não é garoto-propaganda. É um **conselho consultivo** — o mesmo modelo que conselhos científicos têm em laboratórios farmacêuticos, em fintechs de saúde e em startups de biotech.

O que você oferece: remuneração mensal recorrente, participação societária simbólica, visibilidade junto a uma audiência de tutores de classe dominante, e o protagonismo de moldar como a inteligência artificial é usada na clínica veterinária brasileira durante a próxima década.

O que você pede: quatro a seis horas por mês de revisão técnica, um artigo trimestral assinado, e o direito de usar o nome e a especialidade do conselheiro no app, no site e em peças institucionais.

Este documento é a base de três entregáveis concretos que você vai produzir a partir dele: um e-mail de primeiro contato, um deck de apresentação para a reunião presencial, e um contrato de consultoria modelo. O último capítulo lista a sequência de passos para os próximos 45 dias.

---

## Parte 1 — O que é o auExpert

### 1.1 Posicionamento de uma linha

auExpert é o primeiro prontuário inteligente de cuidado preventivo para cães e gatos no Brasil — um aplicativo que combina diário de vida, análise visual por inteligência artificial e histórico clínico estruturado, desenhado para tutores que levam o cuidado do pet a sério.

### 1.2 O problema real

A relação entre tutor e clínica veterinária no Brasil é fragmentada. O prontuário mora no sistema da clínica e o tutor não tem acesso. A carteira de vacinas é um papel que se perde. O histórico alimentar vira mensagem no WhatsApp. A troca de veterinário zera toda a memória. A consulta acontece uma vez, e entre uma consulta e outra não existe nada — nem monitoramento, nem contexto, nem educação preventiva estruturada.

O tutor premium sente isso com especial desconforto. Ele investe R$ 1.500 a R$ 5.000 por mês em rações, acompanhamento, serviços e medicamentos, e não tem uma visão longitudinal do que está funcionando. Quando o pet adoece, ele chega na clínica sem linha do tempo, sem padrões, sem dados. O veterinário, por sua vez, recebe relatos enviesados e precisa reconstruir o contexto a cada consulta.

### 1.3 A solução

O auExpert organiza, em um único aplicativo no celular do tutor, o que hoje está disperso em cinco lugares: prontuário, diário, carteira de vacinas, galeria de fotos e anotações informais. Três camadas de inteligência artificial atuam sobre esses dados.

**Camada um — estrutura.** O tutor fotografa uma carteira de vacinas, uma receita ou um exame. A IA extrai as informações e as organiza no prontuário do pet. Não é o tutor digitando — é o app lendo por ele.

**Camada dois — narrativa.** O tutor registra o dia do pet por voz ou texto. A IA gera uma narração em terceira pessoa, em registro literário, preservando a memória afetiva. Ao final do ano, o tutor recebe uma retrospectiva que é o livro da vida do pet.

**Camada três — análise.** O tutor fotografa o pet com uma preocupação específica — uma lesão, uma postura, uma condição da pele. O app faz uma análise visual com disclaimers explícitos, nunca diagnóstica, e orienta se a ida ao veterinário é prudente. É triagem inteligente, não substituição do profissional.

Todas as três camadas aprendem sobre aquele pet específico — a raça, a idade, o histórico, as alergias, a personalidade — e as respostas são contextuais. Dois Border Collies não recebem a mesma análise. A memória é isolada por pet.

### 1.4 A pilha tecnológica

A espinha dorsal é Claude Sonnet 4.6, o modelo de linguagem da Anthropic, com Haiku 4.5 em tarefas auxiliares. A orquestração roda em Supabase com funções serverless em Deno, PostgreSQL com extensão pgvector para memória semântica, e armazenamento de mídia em WebP otimizado. O aplicativo é React Native em Expo, disponível em iOS e Android.

Nada disso é relevante para o conselheiro — mas é relevante que ele saiba que não se trata de um chatbot genérico. É um sistema com arquitetura de dados clínicos, memória persistente, auditoria completa de interações com a IA, conformidade com LGPD, e infraestrutura preparada para escala.

### 1.5 O estado atual

O app está em fase MVP, em testes fechados com dois cães de referência — Mana, uma chihuahua, e Pico, um border collie. A co-tutora Anita participa dos testes de usabilidade. A arquitetura está estabilizada, os protótipos visuais estão completos, as funcionalidades centrais do diário inteligente estão implementadas. O lançamento público está previsto para o segundo semestre de 2026, após a constituição do Conselho Clínico — que é pré-requisito comercial, não adereço.

---

## Parte 2 — Posicionamento e mercado

### 2.1 O tutor-alvo

O auExpert não é para o tutor médio. É para o tutor que pensa o pet como membro da família, que contrata consultas de bem-estar sem o pet estar doente, que lê rótulos de ração, que tem veterinário de confiança e volta ao mesmo profissional há anos. No Brasil, essa camada representa entre 200 e 400 mil domicílios — concentrados em São Paulo, Rio, Belo Horizonte, Curitiba, Porto Alegre, Brasília e no entorno dessas capitais.

É uma audiência pequena em número e desproporcional em voz. Esse tutor escreve, indica, critica e é ouvido. Ele não é um influenciador — ele é quem os influenciadores querem ter como cliente.

### 2.2 Preço e modelo de receita

A assinatura é única: R$ 129 por mês ou R$ 1.290 por ano, com 14 dias de teste gratuito. Pets ilimitados na mesma conta. O pagamento acontece pelo site via Pagar.me, não pelas lojas de aplicativo — o que preserva a margem e evita a taxa de 30% do ecossistema Apple/Google.

Não haverá plano gratuito permanente. Não haverá versão de nível inferior. Essa decisão é estratégica: o preço filtra, e o filtro protege a qualidade da base de usuários, dos dados e da comunidade interna.

### 2.3 Projeção

Com 5.000 assinantes ativos, a receita mensal é de R$ 645.000, e o lucro líquido depois de impostos, custos de IA, infraestrutura e processamento de pagamentos é de aproximadamente R$ 490.000. Chegar a 5.000 assinantes em 18 meses é meta conservadora dentro do TAM elite brasileiro. O crescimento não depende de viralidade — depende de presença curada, referência clínica e qualidade percebida.

### 2.4 Por que agora

Três vetores se encontraram. O primeiro é a maturidade dos modelos de linguagem: o que era demonstração em 2023 virou infraestrutura confiável em 2026. O segundo é a humanização do pet, que passou de tendência a estado permanente — a geração de tutores que hoje tem entre 30 e 50 anos tratará seus pets como filhos pelos próximos vinte anos. O terceiro é o vácuo regulatório: ainda não existe um padrão do que seja um "prontuário inteligente" no Brasil. Quem estabelecer o padrão nos próximos 24 meses define o vocabulário que o setor usará pela próxima década.

O Conselho Clínico é parte dessa definição. Por isso importa ter nomes que serão reconhecidos em dez anos — não os de maior seguidores agora, os de maior consistência.

---

## Parte 3 — O Conselho Clínico

### 3.1 Natureza do vínculo

Não é emprego. Não é sociedade operacional. Não é garoto-propaganda. É um contrato de consultoria com entregas definidas, remuneração mensal e cláusula de confidencialidade. O conselheiro mantém sua clínica, seu consultório, sua atividade acadêmica — e adiciona uma frente paralela de influência digital.

### 3.2 Composição

O Conselho terá três médicos veterinários, cada um com uma especialidade complementar. A composição de referência é a seguinte.

Um especialista em **medicina preventiva e clínica geral de cães e gatos**, com experiência em check-ups, vacinas e diagnóstico diferencial de quadros comuns. Esse é o conselheiro de base — sua palavra modera o tom de tudo que o app fala sobre saúde cotidiana.

Um especialista em **comportamento animal**, com formação em etologia ou behaviorismo aplicado. No auExpert, as lentes de humor e as análises de postura, expressão e linguagem corporal são funcionalidades centrais — e não se faz isso seriamente sem um etólogo validando.

Um especialista em **geriatria e cuidados paliativos**. Pet idoso é a faixa em que o cuidado preventivo se torna literalmente uma questão de anos de vida adicionais. É também o momento em que o tutor premium gasta mais e procura mais. Um conselheiro dessa especialidade dá ao app a credibilidade para ser usado do primeiro dia ao último.

Essa composição não é rígida. Se um candidato excepcional tiver especialidade em dermatologia, oncologia ou nutrição clínica, o desenho pode ser ajustado — mas sempre três vagas, nunca mais.

### 3.3 Entregas do conselheiro

O contrato prevê quatro responsabilidades concretas, mensuráveis e limitadas em tempo.

**Revisão de prompts clínicos.** Uma vez por mês, o conselheiro recebe o conjunto de prompts que a IA usa para gerar análises, insights e orientações na sua área de especialidade. Ele revisa, sugere ajustes de linguagem, marca frases que beiram o diagnóstico, propõe reformulações. Tempo estimado: duas horas.

**Artigo trimestral assinado.** A cada três meses, o conselheiro publica um texto de 800 a 1.500 palavras no blog e no aplicativo, sobre um tema da sua especialidade. O tom é educativo, não promocional. A Multiverso Digital fornece editor de apoio — o conselheiro não precisa formatar, revisar ortografia ou montar referências. Tempo estimado: quatro a seis horas por artigo.

**Consulta pontual para casos de produto.** Quando a equipe desenvolve uma funcionalidade nova na área do conselheiro — uma nova lente, uma nova análise, um novo fluxo — ele é consultado por escrito, por videochamada curta ou por áudio no WhatsApp. Acontece talvez três a quatro vezes no ano. Tempo estimado: uma hora por consulta.

**Uso do nome e da imagem.** O conselheiro autoriza que seu nome, foto profissional, CRMV e especialidade sejam usados no site, no aplicativo (página "Conselho Clínico"), em peças de marketing e em materiais de imprensa. Nada além disso — não haverá uso em propagandas com diálogos, encenações ou endosso comercial direto.

A soma dos compromissos fica entre quatro e seis horas mensais. É trabalho real, mas compatível com rotina de consultório.

### 3.4 O que o conselheiro não faz

Ele não atende tutores pelo aplicativo. Ele não responde dúvidas individuais. Ele não revisa casos clínicos específicos de pets usuários. Ele não valida diagnósticos. Ele não assume responsabilidade clínica pelo que a IA diz — essa responsabilidade permanece do tutor e do veterinário assistente de cada pet. Juridicamente, o conselheiro atua sobre o sistema, não sobre os casos.

Essa separação protege o conselheiro e protege o tutor. O contrato deixa isso explícito.

### 3.5 Governança

O Conselho se reúne por videochamada uma vez por trimestre, em encontro de noventa minutos. A pauta é preparada pela Multiverso e enviada com cinco dias de antecedência. As decisões do conselho são consultivas — a Multiverso tem a palavra final sobre o produto — mas nenhuma funcionalidade clínica entra no ar sem ter passado pela revisão do conselheiro da área correspondente. Essa é a garantia que o conselho tem de que sua contribuição é real, não ornamental.

---

## Parte 4 — O que o conselheiro ganha

### 4.1 Remuneração mensal

R$ 2.500 mensais, pagos via nota fiscal de prestação de serviços, reajustados anualmente pelo IPCA. O valor considera as quatro a seis horas mensais do conselheiro mais a cessão de nome e imagem — cessão que tem, por si só, valor próprio em qualquer mercado de consultoria.

### 4.2 Participação societária

0,15% do capital da Multiverso Digital, vestido em três anos (um terço ao ano). A saída do conselheiro antes do primeiro ano implica perda da fração não vestida. Depois do terceiro ano, a participação é definitiva, independentemente da continuidade do contrato. Essa participação existe para alinhar horizontes — o conselheiro ganha com o crescimento do app, e não apenas com o mês corrente.

Em cenários de captação, venda estratégica ou expansão internacional, essa participação pode representar valores muito superiores à soma dos honorários mensais. É a engrenagem que converte o vínculo de consultoria em parceria real.

### 4.3 Visibilidade qualificada

A audiência do auExpert é estreita e influente. Os 5.000 primeiros assinantes — meta dos primeiros 18 meses — são tutores de classe dominante em capitais brasileiras. O conselheiro aparece no rodapé de cada análise clínica do aplicativo, na página de autoridade do site, e no material de imprensa em lançamentos. É visibilidade dirigida exatamente ao público que um veterinário premium quer alcançar.

Para um profissional que já atende em clínica de alto padrão, o Conselho é extensão natural de marca. Para um profissional que quer subir de patamar, é alavanca acelerada.

### 4.4 Publicação de autoria

Quatro artigos por ano, editados profissionalmente, publicados em plataforma de audiência qualificada. Ao longo de três anos, o conselheiro acumula doze textos assinados — material que vira portfólio, base para palestras, ponte para publicação em revistas especializadas e argumento em candidaturas acadêmicas.

### 4.5 Acesso antecipado a dados agregados

Com o crescimento da base, o auExpert gera dados epidemiológicos anonimizados de valor clínico real — prevalência de sintomas por região, padrões alimentares, correlações comportamentais, sazonalidade de quadros. O Conselho tem acesso antecipado a esses relatórios, sob termo de confidencialidade, antes de qualquer publicação pública. É inteligência de mercado clínico que nenhum conselheiro teria de outra forma.

### 4.6 Influência sobre o que virá

O Brasil ainda não decidiu como a inteligência artificial será usada na clínica veterinária. Os primeiros produtos que estabelecerem padrões definirão o vocabulário do setor pela próxima década. O conselheiro que participa agora, aos 35 ou 40 anos, chega aos 50 como referência consolidada na interseção entre veterinária e tecnologia — um posicionamento que hoje praticamente não existe no país.

Isso é o que o dinheiro não compra sozinho.

---

## Parte 5 — Perfil do candidato ideal

O candidato ideal tem entre 32 e 48 anos. Tem CRMV ativo, titulação além da graduação (residência, mestrado, título de especialista), clínica ou consultório próprio ou posição de destaque em clínica consolidada, e presença digital cuidada — seja redes sociais em tom profissional, seja artigos publicados, seja palestras. Não precisa ser uma celebridade; precisa ser um profissional respeitado e pesquisável.

O candidato ideal tem ceticismo saudável em relação a hype de IA. Ele vai fazer perguntas duras sobre responsabilidade clínica, sobre risco de diagnóstico, sobre como o app evita substituir o veterinário. Essas perguntas são bem-vindas. Elas mostram que ele entende o que está em jogo e elas tornam a conversa melhor.

O candidato ideal trata a veterinária como ofício, não como negócio apenas. Ele se importa com como o tutor aprende, como o tutor decide, como o pet vive. Essa afinidade com o propósito do produto é mais importante do que qualquer credencial.

O candidato que deve ser evitado é o que quer protagonismo excessivo, o que busca o Conselho como trampolim para produto próprio concorrente, o que não tem tempo para as quatro a seis horas mensais, e o que tem conflitos de interesse com indústrias de ração, medicamento ou equipamento de forma que comprometa a independência da palavra do Conselho.

---

## Parte 6 — Estrutura do deck de apresentação

A reunião presencial ou por videochamada com o candidato dura sessenta minutos. O deck de apresentação tem dez slides, com tempo de fala de trinta e cinco a quarenta minutos e vinte minutos reservados para conversa. A estrutura sugerida é a seguinte.

**Slide 1 — Abertura.** Tela de login do auExpert em alta resolução, tagline abaixo: "Uma inteligência única para o seu pet." Nenhum texto adicional. Dois segundos de silêncio antes de falar. O produto aparece antes do discurso.

**Slide 2 — O problema.** Três frases sobre a fragmentação do cuidado preventivo no Brasil e o desconforto que isso gera no tutor premium. Sem gráficos. Sem dados. Uma narrativa curta em tom humano.

**Slide 3 — Demonstração ao vivo.** Substitua o slide por uma demonstração de dois minutos no celular. Fotografe um exame ou carteira de vacinas real, mostre a extração pela IA, abra uma entrada de diário, mostre a narração gerada. Uma demonstração de dois minutos vale mais que trinta slides.

**Slide 4 — Tecnologia em uma respiração.** Claude Sonnet 4.6, Supabase, pgvector. Uma linha sobre auditoria, uma linha sobre conformidade LGPD. Passa rápido.

**Slide 5 — Posicionamento.** "Não é para todos. É para os tutores que levam o cuidado do pet a sério." Preço, modelo, audiência-alvo, projeção financeira em uma única linha.

**Slide 6 — O Conselho Clínico.** Composição das três vagas, natureza do vínculo, responsabilidades em dois pontos curtos.

**Slide 7 — O que o conselheiro recebe.** Remuneração, participação, visibilidade, publicação, acesso a dados, influência sobre o padrão do setor. Seis blocos, dois segundos em cada.

**Slide 8 — O que o conselheiro não faz.** Tão importante quanto o slide anterior. Mostra que a proposta é séria, delimitada e juridicamente pensada.

**Slide 9 — Por quê você.** Slide personalizado para cada candidato, com três frases escritas sob medida sobre por que aquele profissional específico é a pessoa certa para aquela cadeira. Esse slide é o mais trabalhoso de preparar e o mais decisivo da reunião.

**Slide 10 — Próximo passo.** "Se fizer sentido, a gente assina o contrato em duas semanas. Enquanto isso, te envio o rascunho para revisão do seu advogado." Fim. Sem pressão. Sem urgência fabricada.

O tom da apresentação é o mesmo tom do produto: preciso, contido, confiante sem arrogância. Nada de superlativos. Nada de promessas infladas. O candidato ideal percebe rigor, e rigor é o que vende.

---

## Parte 7 — Sequência de abordagem

### 7.1 Identificação dos candidatos

Monte uma lista inicial de dezoito a vinte e quatro nomes — seis a oito para cada uma das três especialidades. Use três fontes de pesquisa.

A primeira fonte é acadêmica. O Lattes dos programas de residência e mestrado em medicina veterinária das principais universidades (USP, Unesp, UFRGS, UFMG, UFPR) dá o mapa dos profissionais com produção científica consistente.

A segunda fonte é associativa. Os sites das sociedades brasileiras de especialidades (SBCV, Abravet, Anclivepa, sociedades de etologia e comportamento) listam os certificados em cada área.

A terceira fonte é digital. Busque no Instagram e no LinkedIn perfis profissionais com mais de 5.000 seguidores, tom técnico (não comercial), e engajamento real. Evite perfis de conteúdo viral; procure perfis de conteúdo de autoridade.

Cruze as três fontes. Os nomes que aparecem em pelo menos duas entram na lista curta.

### 7.2 Primeiro contato

O primeiro contato é por e-mail, nunca por direct no Instagram, nunca por WhatsApp sem convite prévio. O e-mail é curto, pessoal, sem anexos pesados, sem links de marketing. Estrutura recomendada:

> **Assunto:** Consulta sobre um projeto — Dr(a). [Nome], veterinária + IA
>
> Dr(a). [Sobrenome],
>
> Me chamo Belisario Retto, sou fundador da Multiverso Digital. Acompanho o seu trabalho em [referência específica: uma publicação, uma palestra, um caso público] há algum tempo e queria pedir quinze minutos do seu dia para uma conversa.
>
> Estamos finalizando o lançamento de um aplicativo de cuidado preventivo para cães e gatos, com núcleo em análise por inteligência artificial, e estamos constituindo o Conselho Clínico que vai dar direção técnica ao produto. A cadeira de [especialidade] é uma das três, e o seu nome veio em primeiro lugar na nossa conversa interna por razões que explico na reunião.
>
> Não é pedido de indicação nem de parceria comercial — é um convite formal de assento em conselho consultivo, com contrato, remuneração, participação societária, e entregas delimitadas.
>
> Topa conversar trinta minutos por videochamada na próxima semana?
>
> Com apreço,
> Belisario Retto
> Multiverso Digital
> [link único do site]

O e-mail cabe em uma tela de celular. Não tem negrito, não tem listas, não tem gráficos. É uma carta curta. O que vende é o tom, não o volume.

### 7.3 Primeira reunião

A primeira reunião acontece por videochamada, dura trinta a quarenta minutos, e tem três momentos. Nos primeiros dez minutos, você escuta — sobre a trajetória do candidato, sobre o que ele está fazendo hoje, sobre o que o incomoda no setor. Nos vinte minutos do meio, você apresenta o app e o Conselho usando o deck. Nos últimos dez minutos, você abre para as perguntas dele e responde diretamente.

Ao final, você propõe um segundo encontro presencial (ou, se geograficamente impossível, um segundo videochamada) onde entregará o rascunho do contrato e a proposta detalhada. Esse segundo encontro acontece duas semanas depois. Nunca, em hipótese alguma, feche o contrato na primeira reunião. O candidato precisa de tempo para pensar, e você precisa demonstrar que não tem pressa.

### 7.4 Proposta formal

Entre a primeira e a segunda reunião, envie por e-mail um documento de três a cinco páginas com a proposta escrita. Esse documento tem a mesma estrutura deste pitch mas adaptada ao candidato — especialidade específica, responsabilidades aplicadas àquela área, valores de remuneração, clausulado essencial do contrato. O documento é um PDF com o logotipo do auExpert, tipografia sóbria, e sem nada promocional. É um instrumento jurídico em tom humano.

### 7.5 Contrato

O contrato é redigido por advogado especializado em direito societário e propriedade intelectual, contém no mínimo as cláusulas de objeto, remuneração, entregas, cessão de nome e imagem, confidencialidade, não-concorrência limitada a produtos veterinários-digitais diretamente substitutos, participação societária com vesting, limitação de responsabilidade clínica, e rescisão. Duração inicial: dois anos, renovável por acordo escrito.

A assinatura é presencial sempre que possível. Há valor simbólico real em assinar em papel, em uma mesa, com café — e não em DocuSign às onze da noite.

---

## Parte 8 — Cronograma dos primeiros 45 dias

**Semana 1.** Construção da lista curta de 18 a 24 candidatos, redação personalizada do e-mail de primeiro contato para cada um, preparação dos slides 1 a 8 do deck (os genéricos).

**Semana 2.** Envio dos primeiros e-mails, seis por vez, com três dias de intervalo entre as ondas. Registro de respostas em planilha simples. Preparação do slide 9 (personalizado) para cada candidato que responder.

**Semana 3.** Primeiras reuniões por videochamada. Meta: oito a dez reuniões realizadas. Pós-reunião, enviar o documento de proposta escrita para os candidatos que demonstrarem interesse real.

**Semana 4.** Seguimento, segunda rodada de reuniões, conversas finais. Filtragem para os três escolhidos por especialidade.

**Semana 5.** Reuniões de fechamento presencial com os três escolhidos. Entrega do contrato assinado pela Multiverso para revisão do advogado de cada conselheiro.

**Semana 6.** Assinatura dos contratos. Sessão fotográfica profissional dos três conselheiros. Redação das bios para o site. Preparação do anúncio público.

Durante toda essa janela, não fale publicamente sobre quem está sendo abordado. Discrição é parte da proposta — e candidatos que descobrem que outros candidatos foram contatados ao mesmo tempo tendem a reagir mal. O anúncio público só acontece quando os três estão assinados.

---

## Parte 9 — Lançamento do Conselho

Quando os três contratos estiverem assinados, o anúncio do Conselho Clínico é o primeiro grande movimento público de marketing do auExpert. A sequência sugerida é a seguinte.

A página "Conselho Clínico" do site entra no ar simultaneamente ao anúncio, com as três fotografias profissionais, biografias curtas, CRMV visível, áreas de atuação e uma carta de abertura assinada por você explicando por que o Conselho existe.

Nas redes sociais, um post único institucional no Instagram e no LinkedIn com as três fotos e uma legenda sóbria apresentando o Conselho. Cada conselheiro replica no próprio perfil, com texto pessoal sobre por que aceitou o convite.

Uma nota enviada para dez veículos especializados — Petmag, Cães & Cia, portais de veterinária, canais de empreendedorismo em saúde — com release curto e link para a página. Um ou dois desses veículos converterão em matéria. Basta.

Nada de evento de lançamento. Nada de coquetel. Nada de ativação influenciador. O Conselho é anunciado como se sempre tivesse existido — com a naturalidade de quem não precisa fazer barulho para ser notado.

Três meses depois, o primeiro artigo trimestral do Conselho é publicado. Esse artigo é, na prática, o segundo movimento de marketing — e o primeiro em que o Conselho aparece fazendo, não sendo apresentado. A partir daí, a cadência é trimestral, consistente, silenciosa.

---

## Encerramento

O Conselho Clínico não é estratégia de marketing disfarçada de estrutura técnica. É estrutura técnica real que produz autoridade, e autoridade é o que o tutor premium compra quando assina R$ 129 por mês. A diferença entre o auExpert e qualquer aplicativo genérico de pet não é o código — é a quem esse código responde.

Os três médicos veterinários que aceitarem essa cadeira serão os primeiros nomes do setor no Brasil a ocupar a interseção entre clínica e inteligência artificial de consumo. Quem aceitar primeiro escolhe a cadeira. Quem esperar entra depois ou não entra.

Esse é o pitch. O resto é execução.

---

*Documento interno — Multiverso Digital — abril de 2026.*
*Distribuição restrita a Belisario Retto e ao advogado responsável pela redação dos contratos do Conselho Clínico.*
