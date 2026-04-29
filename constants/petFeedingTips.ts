/**
 * constants/petFeedingTips.ts
 *
 * Catalogo curado de dicas de alimentacao por especie e raca.
 * Usado pelo carrossel que entretem o tutor durante a geracao/regeneracao
 * do cardapio (que demora 30-90s).
 *
 * Estrutura:
 *  - GENERIC[species][locale] = dicas gerais da especie
 *  - BY_BREED[breedKey] = { species, tips: { locale: string[] } }
 *  - getFeedingTipsForPet(species, breed, locale) -> string[] (10-12 itens shuffle)
 *
 * Tom: registro Elite (3a pessoa, factual, sem onomatopeia, sem exclamacao
 * performatica). Frase curta, util.
 */

type Locale = 'pt-BR' | 'en-US';
type Species = 'dog' | 'cat';

const GENERIC: Record<Species, Record<Locale, string[]>> = {
  dog: {
    'pt-BR': [
      'Caes adultos comem 2 vezes ao dia. A regularidade ajuda a digestao e o controle de peso.',
      'Filhotes ate 6 meses precisam de 3 a 4 refeicoes diarias por terem estomago pequeno.',
      'Agua fresca disponivel o dia inteiro. Trocar pelo menos uma vez ao dia.',
      'Petiscos nao devem passar de 10% do total calorico do dia.',
      'Evitar cebola, alho, uvas, chocolate, abacate, macadamia e xilitol — sao toxicos.',
      'Aguardar 1 a 2 horas apos o exercicio para alimentar (e o oposto: comer antes do passeio favorece torcao gastrica).',
      'Caes idosos pedem alimento com menos calorias e mais fibra para apoiar a digestao.',
      'Trocas de racao devem ser graduais, em 7 a 10 dias, misturando a nova com a antiga.',
      'Mudancas no apetite que duram mais de 48 horas merecem atencao do veterinario.',
      'Caes com tendencia a obesidade respondem bem a comedouros lentos e enriquecimento alimentar.',
      'Frutas seguras em pequena quantidade: maca sem semente, banana, melancia sem semente, morango.',
      'Vegetais bem-aceitos: cenoura cozida, abobrinha, brocolis cozido, batata-doce assada.',
    ],
    'en-US': [
      'Adult dogs eat twice a day. Regular schedule helps digestion and weight control.',
      'Puppies up to 6 months need 3 to 4 meals daily because of small stomachs.',
      'Fresh water available all day. Change it at least once.',
      'Treats should not exceed 10% of total daily calories.',
      'Avoid onion, garlic, grapes, chocolate, avocado, macadamia and xylitol — toxic.',
      'Wait 1 to 2 hours after exercise to feed (and the opposite: eating before walks raises bloat risk).',
      'Senior dogs need fewer calories and more fiber to support digestion.',
      'Switch foods gradually over 7 to 10 days, mixing the new with the old.',
      'Appetite changes lasting more than 48 hours deserve a vet check.',
      'Dogs prone to obesity respond well to slow feeders and food enrichment.',
      'Safe fruits in small amounts: seedless apple, banana, seedless watermelon, strawberry.',
      'Well-tolerated vegetables: cooked carrot, zucchini, cooked broccoli, baked sweet potato.',
    ],
  },
  cat: {
    'pt-BR': [
      'Gatos preferem comer pequenas porcoes ao longo do dia (5 a 10 vezes). Petisqueiras ajudam.',
      'Agua corrente atrai gato — fontes filtradas elevam a hidratacao e protegem rins.',
      'Bebedouro e comedouro longe do banheiro reduzem rejeicao por contaminacao olfativa.',
      'Comida umida ajuda na hidratacao, especialmente em gatos com tendencia a calculos urinarios.',
      'Evitar leite de vaca em adultos — a maioria e intolerante a lactose.',
      'Plantas perigosas: lirio, comigo-ninguem-pode, azaleia, samambaia. Manter fora do alcance.',
      'Petiscos representam ate 10% do total diario. Excesso descompensa o equilibrio nutricional.',
      'Gatos castrados tendem a obesidade — racao especifica e enriquecimento ambiental ajudam.',
      'Comida na altura do peito reduz refluxo e desconforto cervical em idosos.',
      'Trocas de racao em 7 a 10 dias com mistura gradual reduzem rejeicao alimentar.',
      'Tigela larga e rasa evita o desconforto dos bigodes encostando nas paredes.',
      'Recusa alimentar por mais de 24 horas em gatos pode causar lipidose hepatica — procurar veterinario.',
    ],
    'en-US': [
      'Cats prefer small portions throughout the day (5 to 10 times). Snack feeders help.',
      'Running water attracts cats — filtered fountains boost hydration and protect kidneys.',
      'Place water and food away from the litter box to avoid scent rejection.',
      'Wet food supports hydration, especially in cats prone to urinary stones.',
      'Avoid cow milk in adults — most are lactose intolerant.',
      'Dangerous plants: lily, dieffenbachia, azalea, fern. Keep out of reach.',
      'Treats up to 10% of daily total. Excess unbalances the diet.',
      'Neutered cats tend to gain weight — specific kibble and environmental enrichment help.',
      'Chest-height food reduces reflux and neck strain in seniors.',
      'Switch foods over 7 to 10 days with gradual mixing to reduce rejection.',
      'Wide shallow bowl avoids whisker discomfort against the walls.',
      'Refusing food for more than 24 hours can cause hepatic lipidosis — see a vet.',
    ],
  },
};

const BY_BREED: Record<string, { species: Species; tips: Record<Locale, string[]> }> = {
  // ---------- CAES ----------
  chihuahua: {
    species: 'dog',
    tips: {
      'pt-BR': [
        'Chihuahuas tem alto risco de hipoglicemia — refeicoes pequenas a cada 4 horas evitam quedas de glicose.',
        'Estomago minusculo: porcoes generosas causam vomito. Dividir em 3 a 4 refeicoes diarias.',
        'Predisposicao a problema dentario — racao seca e snacks dentais ajudam a higiene oral.',
        'Tendem a obesidade rapidamente. Pesar a porcao em vez de medir por volume aumenta a precisao.',
        'Pet pequeno = osso pequeno. Evitar ossos cozidos, sempre.',
        'Sensiveis ao frio: queimam mais calorias para manter temperatura no inverno.',
      ],
      'en-US': [
        'Chihuahuas have high hypoglycemia risk — small meals every 4 hours prevent glucose drops.',
        'Tiny stomach: large portions cause vomiting. Split into 3 to 4 daily meals.',
        'Dental predisposition — dry kibble and dental treats support oral hygiene.',
        'Quickly prone to obesity. Weighing portions beats measuring by volume.',
        'Small dog = small bones. Always avoid cooked bones.',
        'Cold-sensitive: burn more calories keeping warm in winter.',
      ],
    },
  },
  border_collie: {
    species: 'dog',
    tips: {
      'pt-BR': [
        'Border Collies queimam muita energia — racao premium com 25 a 30% de proteina sustenta o trabalho mental e fisico.',
        'Mente ativa: comedouros de enriquecimento (snuffle mat, kong recheado) sao quase obrigatorios.',
        'Bebem mais que a media em dias de muito trabalho — manter a agua sempre fresca.',
        'Sensibilidade a graos em alguns individuos — observar coceira recorrente apos refeicoes.',
        'Articulacoes fortes precisam de glicosamina e omega 3 desde adulto jovem.',
        'Risco de torcao gastrica: pausa de 1h entre comer e correr.',
      ],
      'en-US': [
        'Border Collies burn lots of energy — premium kibble with 25 to 30% protein supports mental and physical work.',
        'Active mind: enrichment feeders (snuffle mat, stuffed Kong) are nearly required.',
        'Drink more than average on heavy work days — keep water fresh.',
        'Some are grain-sensitive — watch for recurring itching after meals.',
        'Strong joints need glucosamine and omega 3 from young adult.',
        'Bloat risk: pause 1 hour between eating and running.',
      ],
    },
  },
  golden_retriever: {
    species: 'dog',
    tips: {
      'pt-BR': [
        'Goldens amam comida — autocontrole e baixo. Comedouro lento previne engasgo e ajuda saciedade.',
        'Predisposicao a displasia coxofemoral: glicosamina, condroitina e omega 3 desde filhote.',
        'Pelagem brilhante depende de gordura saudavel — oleo de peixe e oleo de coco em pequena dose.',
        'Risco de torcao gastrica em refeicoes grandes apos exercicio. Sempre dividir e dar tempo.',
        'Tendencia a hipotireoidismo em adultos — fibra adequada protege metabolismo.',
        'Brincadeiras de busca antes da refeicao melhoram a digestao por gerar pausa natural.',
      ],
      'en-US': [
        'Goldens love food — self-control is low. Slow feeders prevent gulping and help satiety.',
        'Hip dysplasia predisposition: glucosamine, chondroitin and omega 3 from puppy.',
        'Shiny coat depends on healthy fat — fish oil and a touch of coconut oil.',
        'Bloat risk on large meals after exercise. Always split and give time.',
        'Adult hypothyroid tendency — proper fiber protects metabolism.',
        'Pre-meal fetch games improve digestion by creating natural pauses.',
      ],
    },
  },
  labrador: {
    species: 'dog',
    tips: {
      'pt-BR': [
        'Labradores tem mutacao genetica POMC que reduz a sensacao de saciedade — porcoes precisas sao essenciais.',
        'Adultos sedentarios ganham 1kg por mes facilmente. Pesar mensalmente e ajustar.',
        'Predisposicao a displasia: oleo de peixe e suplemento articular reduzem inflamacao.',
        'Saude do intestino se beneficia de prebioticos e probioticos em uso continuo.',
        'Brincar antes da refeicao reduz ansiedade alimentar e a tendencia a engolir rapido.',
        'Risco de pancreatite com gordura em excesso — moderar petiscos calorigenos.',
      ],
      'en-US': [
        'Labradors have a POMC mutation that reduces satiety — precise portions are essential.',
        'Sedentary adults gain 1kg per month easily. Weigh monthly and adjust.',
        'Hip dysplasia predisposition: fish oil and joint supplements reduce inflammation.',
        'Gut health benefits from continuous prebiotics and probiotics.',
        'Pre-meal play reduces food anxiety and gulping.',
        'Pancreatitis risk with excess fat — moderate high-calorie treats.',
      ],
    },
  },
  pug: {
    species: 'dog',
    tips: {
      'pt-BR': [
        'Pugs tem face curta (braquicefalico) — comedouro elevado reduz engasgo e refluxo.',
        'Tendencia a obesidade alta: 70% sao acima do peso. Pesar racao em gramas evita excesso.',
        'Calor compromete digestao — refeicoes em horarios mais frescos do dia.',
        'Pele com dobras: omega 3 e zinco apoiam a barreira cutanea.',
        'Predisposicao a problemas dentarios — racao seca e escovacao regulares.',
        'Caminhada apos refeicao deve ser leve e curta — exercicio intenso eleva risco respiratorio.',
      ],
      'en-US': [
        'Pugs are brachycephalic — raised feeder reduces choking and reflux.',
        'High obesity tendency: 70% are overweight. Weigh kibble in grams to avoid excess.',
        'Heat impairs digestion — feed during cooler hours.',
        'Skin folds: omega 3 and zinc support skin barrier.',
        'Dental predisposition — dry food and regular brushing.',
        'Post-meal walks should be light and short — intense exercise raises breathing risk.',
      ],
    },
  },
  // ---------- GATOS ----------
  persa: {
    species: 'cat',
    tips: {
      'pt-BR': [
        'Persas tem face achatada — comedouro raso e largo evita que os bigodes encostem.',
        'Pelagem longa: oleo de peixe e biotina mantem o pelo brilhante e reduzem bolas de pelo.',
        'Tendencia a doenca renal policistica — agua corrente e dieta umida sao protetores.',
        'Olhos lacrimejantes: limpar diariamente. Inflamacao recorrente merece avaliacao.',
        'Sedentarios por natureza — porcao calorica menor que a de gatos ativos.',
        'Predisposicao a constipacao com dieta seca — alternar com umida ajuda.',
      ],
      'en-US': [
        'Persians are flat-faced — wide shallow bowls avoid whisker contact.',
        'Long coat: fish oil and biotin keep fur shiny and reduce hairballs.',
        'Polycystic kidney disease risk — running water and wet diet are protective.',
        'Watery eyes: clean daily. Recurring inflammation deserves a check.',
        'Naturally sedentary — lower caloric needs than active cats.',
        'Constipation tendency on dry-only diets — alternating with wet helps.',
      ],
    },
  },
  siames: {
    species: 'cat',
    tips: {
      'pt-BR': [
        'Siameses sao ativos e magrelos por natureza — racao calorica densa em pequenas porcoes.',
        'Inteligencia alta: comedouros de enriquecimento mantem a mente ocupada.',
        'Pedem agua com frequencia — fonte de agua e quase obrigatoria.',
        'Sensibilidade digestiva em alguns individuos — racao com proteina hidrolisada se houver desconforto.',
        'Vocais e ansiosos: rotina alimentar regular reduz miados por comida.',
        'Predisposicao a amiloidose — proteinas de alta qualidade protegem rins e figado.',
      ],
      'en-US': [
        'Siamese are active and naturally lean — calorie-dense kibble in small portions.',
        'High intelligence: enrichment feeders keep the mind busy.',
        'Frequent drinkers — water fountain almost required.',
        'Digestive sensitivity in some — hydrolyzed protein kibble if discomfort arises.',
        'Vocal and anxious: regular feeding routine reduces meowing for food.',
        'Amyloidosis predisposition — high-quality protein protects kidneys and liver.',
      ],
    },
  },
  maine_coon: {
    species: 'cat',
    tips: {
      'pt-BR': [
        'Maine Coons crescem ate os 4 anos — manter racao de filhote por mais tempo apoia o desenvolvimento.',
        'Porte grande pede tigela e bebedouro maiores que o padrao felino.',
        'Predisposicao a cardiomiopatia hipertrofica — taurina e omega 3 sao protetores.',
        'Pelagem grossa: omega 3 reduz queda e bolas de pelo.',
        'Apetite robusto — comedouro com porcao programada evita excesso.',
        'Articulacoes apoiam corpo grande — glicosamina desde adulto jovem.',
      ],
      'en-US': [
        'Maine Coons grow until age 4 — keep kitten food longer to support development.',
        'Large frame needs bigger bowls and water dispensers than standard.',
        'Hypertrophic cardiomyopathy risk — taurine and omega 3 are protective.',
        'Thick coat: omega 3 reduces shedding and hairballs.',
        'Robust appetite — programmed portion feeders avoid excess.',
        'Joints carry large body — glucosamine from young adult.',
      ],
    },
  },
};

/**
 * Normaliza nome de raca para chave do catalogo.
 *  - lowercase
 *  - remove acentos
 *  - troca espacos/hifen por underscore
 */
function normalizeBreedName(breed: string | null | undefined): string {
  if (!breed) return '';
  return breed
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s_-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_');
}

function pickLocale(locale: string): Locale {
  return locale && locale.toLowerCase().startsWith('en') ? 'en-US' : 'pt-BR';
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Retorna 10 a 12 dicas para o pet, misturando especificas da raca (4 a 6)
 * com genericas da especie (6 a 8). Se a raca nao esta no catalogo,
 * usa apenas genericas.
 */
export function getFeedingTipsForPet(
  species: Species | string | null | undefined,
  breed: string | null | undefined,
  locale: string,
): string[] {
  const sp: Species = species === 'cat' ? 'cat' : 'dog';
  const lang = pickLocale(locale);
  const generic = GENERIC[sp][lang];

  const breedKey = normalizeBreedName(breed);
  const breedEntry = BY_BREED[breedKey];
  const breedTips = breedEntry && breedEntry.species === sp
    ? breedEntry.tips[lang]
    : [];

  const breedShuffled = shuffle(breedTips).slice(0, 6);
  const genericShuffled = shuffle(generic).slice(0, breedShuffled.length > 0 ? 6 : 12);

  // Intercala alternando especificas e genericas (1 racial, 1 generica, ...)
  const result: string[] = [];
  const longest = Math.max(breedShuffled.length, genericShuffled.length);
  for (let i = 0; i < longest; i++) {
    if (i < breedShuffled.length) result.push(breedShuffled[i]);
    if (i < genericShuffled.length) result.push(genericShuffled[i]);
  }
  return result;
}
