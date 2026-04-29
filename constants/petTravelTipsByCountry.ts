/**
 * constants/petTravelTipsByCountry.ts
 *
 * Catalogo curado de dicas de viagem com pet por pais de destino.
 * Usado pelo carrossel de espera enquanto a IA monta o roteiro
 * (60-120s pelo Opus 4.7 + web_search).
 *
 * Estrutura:
 *  - GENERIC[locale] = dicas universais para qualquer destino
 *  - BY_COUNTRY[ISO2] = dicas especificas do pais
 *  - getTravelTipsForCountry(code, locale) -> string[] com mistura curada
 *
 * Tom: registro Elite — factual, 3a pessoa, frase curta. Sem onomatopeia,
 * sem exclamacao performatica, sem assinatura.
 *
 * Cobertura inicial: 10 paises do TOP_COUNTRY_CODES (BR, US, PT, ES, FR,
 * IT, DE, GB, JP, AR). Para destinos fora dessa lista, usa apenas dicas
 * genericas.
 */

type Locale = 'pt-BR' | 'en-US';

const GENERIC: Record<Locale, string[]> = {
  'pt-BR': [
    'Microchip ISO 11784/11785 e padrao internacional. Sem ele, varios paises recusam a entrada do pet.',
    'Vacina antirrabica precisa estar entre 30 dias e 12 meses antes da viagem na maioria dos destinos.',
    'CVI (Certificado Veterinario Internacional) tem validade curta — emitir 10 a 5 dias antes do embarque.',
    'Caixa de transporte aerea precisa ser homologada IATA. Conferir dimensoes e ventilacao com a companhia.',
    'Pet em cabine costuma ser limitado a 7-9 kg incluindo a caixa. Acima disso, vai em porao climatizado.',
    'Acostumar o pet a caixa de transporte semanas antes reduz estresse no embarque.',
    'Hidratar bem antes do voo, mas evitar refeicao pesada nas 4 horas anteriores.',
    'Sedacao geral nao e recomendada — pode comprometer a regulacao de temperatura em altitude.',
    'Levar copia digital e impressa de todos os documentos do pet, alem da carteira de vacinas.',
    'Hoteis pet-friendly costumam cobrar taxa de limpeza adicional. Confirmar antes da reserva.',
  ],
  'en-US': [
    'ISO 11784/11785 microchip is the international standard. Without it, many countries refuse pet entry.',
    'Rabies vaccine must be between 30 days and 12 months prior to travel for most destinations.',
    'Health certificate has a short validity — issue 10 to 5 days before departure.',
    'Air carrier must be IATA-compliant. Check dimensions and ventilation with the airline.',
    'In-cabin pet usually limited to 7-9 kg including carrier. Heavier pets travel in climate-controlled cargo.',
    'Familiarize the pet with the carrier weeks ahead to reduce boarding stress.',
    'Hydrate well before the flight but avoid heavy meals in the 4 hours before.',
    'General sedation is not recommended — it can impair temperature regulation at altitude.',
    'Carry digital and printed copies of all pet documents plus the vaccination booklet.',
    'Pet-friendly hotels often charge an extra cleaning fee. Confirm before booking.',
  ],
};

const BY_COUNTRY: Record<string, Record<Locale, string[]>> = {
  // ────────── BRASIL (BR) — viagem domestica ──────────
  BR: {
    'pt-BR': [
      'Em viagens domesticas no Brasil, basta atestado de saude veterinario emitido em ate 10 dias e carteira de vacinas atualizada.',
      'Companhias aereas brasileiras (Latam, Gol, Azul) aceitam pet em cabine ate 7 kg incluindo caixa. Reservar com 30 dias de antecedencia.',
      'No transporte rodoviario, a maioria das empresas nao aceita pet — Buser e algumas linhas regionais sao excecoes.',
      'Praias brasileiras pet-friendly: Itamambuca (SP), Pipa (RN), Camburi (SP). Algumas exigem coleira e saquinho de coleta.',
      'Em parques nacionais, sempre verificar regras: Fernando de Noronha proibe pets, Itatiaia e Chapada dos Veadeiros permitem em algumas areas.',
      'Verao no Sudeste e Nordeste: pisada quente queima patas. Levar bota de silicone ou caminhar so de manha cedo e fim de tarde.',
      'Lagosta e siri-mole na praia: caes que comem sobras crus podem ter intoxicacao por toxinas marinhas.',
      'Cidades com clima ameno como Campos do Jordao, Petropolis e Gramado sao otimas para pets sensiveis ao calor.',
    ],
    'en-US': [
      'For domestic travel within Brazil, a vet health certificate issued within 10 days plus updated vaccinations is enough.',
      'Brazilian airlines (Latam, Gol, Azul) accept in-cabin pets up to 7 kg including carrier. Book 30 days ahead.',
      'On road transport, most bus companies do not accept pets — Buser and some regional lines are exceptions.',
      'Pet-friendly Brazilian beaches: Itamambuca (SP), Pipa (RN), Camburi (SP). Leash and waste bags often required.',
      'For national parks, check rules: Fernando de Noronha bans pets; Itatiaia and Chapada dos Veadeiros allow in some areas.',
      'Summer in Southeast and Northeast: hot pavement burns paws. Use silicone boots or walk early morning and late afternoon.',
      'Beach scraps like raw lobster and crab can cause marine toxin poisoning in dogs that eat them.',
      'Mild-climate cities like Campos do Jordao, Petropolis and Gramado are great for heat-sensitive pets.',
    ],
  },

  // ────────── ESTADOS UNIDOS (US) ──────────
  US: {
    'pt-BR': [
      'EUA exige microchip ISO + vacina antirrabica vigente. Pet de estados sem raiva (HI) tem regras especiais.',
      'CVI emitido pelo MAPA precisa de chancela do consulado americano se o pet vier do Brasil.',
      'Cidades pet-friendly por excelencia: Portland (OR), Austin (TX), San Diego (CA), Denver (CO).',
      'Cadeias hoteleiras com politica pet aberta: Kimpton, La Quinta, Red Roof, Best Western Pet-Friendly.',
      'Restaurantes com patio (patio dining) sao quase sempre dog-friendly. Dentro do salao, depende do estado.',
      'United, Delta e American Airlines aceitam pet em cabine. Southwest e a mais flexivel para racas pequenas.',
      'Parques nacionais americanos limitam pets a trilhas pavimentadas. So Acadia, Shenandoah e Grand Canyon (rim) sao mais abertos.',
      'Em Nova York e San Francisco, transporte publico aceita pets em caixa fechada — pet solto so em horarios off-peak no metro de NY.',
    ],
    'en-US': [
      'US requires ISO microchip + current rabies vaccine. Pets from rabies-free states (HI) have special rules.',
      'Health certificate from origin country must be endorsed by USDA-accredited vet for international entry.',
      'Top pet-friendly cities: Portland (OR), Austin (TX), San Diego (CA), Denver (CO).',
      'Pet-open hotel chains: Kimpton, La Quinta, Red Roof, Best Western Pet-Friendly.',
      'Patio dining is almost always dog-friendly. Indoor seating varies by state law.',
      'United, Delta and American Airlines accept in-cabin pets. Southwest is the most flexible for small breeds.',
      'US National Parks limit pets to paved trails. Acadia, Shenandoah and Grand Canyon (rim) are more open.',
      'In NYC and San Francisco, public transit accepts pets in closed carriers — off-peak hours allow loose pets on NYC subway.',
    ],
  },

  // ────────── PORTUGAL (PT) ──────────
  PT: {
    'pt-BR': [
      'Portugal aceita pets do Brasil com microchip ISO, antirrabica vigente e CVI emitido em ate 10 dias antes do embarque.',
      'Lisboa e Porto sao excelentes para pets: muitos cafes, restaurantes e parques aceitam caes ao ar livre.',
      'Transporte publico em Lisboa (metro, bonde, comboio) aceita pet em caixa fechada. Caes-guia entram livremente.',
      'Praia pet-friendly: Carcavelos (com horario), Costa Caparica, Praia da Adraga. Sazonalidade no verao.',
      'Em parques nacionais como Geres e Serra da Estrela, pets sao bem-vindos com guia e saco de coleta.',
      'Verao em Lisboa pode passar dos 35°C. Caminhar so cedo e a noite, agua sempre disponivel.',
      'Mercados municipais (Mercado da Ribeira, Bolhao) costumam aceitar pets em coleira no espaco externo.',
      'Alfacinha, bacalhau salgado e doces conventuais — atencao com sal e acucar; manter pet na racao habitual.',
    ],
    'en-US': [
      'Portugal accepts pets from Brazil with ISO microchip, current rabies vaccine and health certificate issued within 10 days.',
      'Lisbon and Porto are excellent for pets: many cafes, restaurants and parks welcome dogs outdoors.',
      'Lisbon public transit (metro, tram, train) accepts pets in closed carriers. Service dogs enter freely.',
      'Pet-friendly beaches: Carcavelos (with hours), Costa Caparica, Praia da Adraga. Seasonal restrictions in summer.',
      'In national parks like Geres and Serra da Estrela, pets are welcome on leash with waste bags.',
      'Lisbon summers can exceed 35°C. Walk only early and late, with water always available.',
      'Municipal markets (Ribeira, Bolhao) often allow leashed pets in outdoor areas.',
      'Local treats high in salt and sugar — keep the pet on regular kibble.',
    ],
  },

  // ────────── ESPANHA (ES) ──────────
  ES: {
    'pt-BR': [
      'Espanha aceita pets via UE: microchip ISO + antirrabica vigente + passaporte EU ou CVI internacional.',
      'Madrid, Barcelona e Valencia tem cultura pet-friendly forte: terrazas (areas externas) sempre aceitam caes.',
      'Praias com horario pet em Barcelona: Llevant, Cala dels Frares (verao limita horarios; inverno e livre).',
      'Renfe (trens espanhois) aceita pet em caixa ate 10 kg. AVE permite pets de qualquer porte com taxa adicional.',
      'Festas como San Fermin (Pamplona) e Tomatina (Bunol) sao desaconselhaveis — barulho extremo e multidoes.',
      'Verao em Andaluzia ultrapassa 40°C. Pets sensiveis ao calor preferem destinos do norte (Galicia, Asturias).',
      'Tapas com alho, cebola ou azeitona em excesso — manter pet longe das mesas.',
      'Caes considerados PPP (cao potencialmente perigoso) tem regras especificas: focinheira em via publica e seguro obrigatorio.',
    ],
    'en-US': [
      'Spain accepts pets via EU rules: ISO microchip + current rabies + EU passport or international health certificate.',
      'Madrid, Barcelona and Valencia have strong pet-friendly culture: terrazas (outdoor seating) always welcome dogs.',
      'Pet-hour beaches in Barcelona: Llevant, Cala dels Frares (summer limits hours; winter is open).',
      'Renfe (Spanish trains) accepts pets in carrier up to 10 kg. AVE allows any size with extra fee.',
      'Avoid festivals like San Fermin (Pamplona) and Tomatina (Bunol) — extreme noise and crowds.',
      'Andalusia summers exceed 40°C. Heat-sensitive pets prefer northern destinations (Galicia, Asturias).',
      'Tapas with garlic, onion or excess olives — keep the pet away from tables.',
      'Dogs classified as PPP (potentially dangerous) have specific rules: muzzle in public and mandatory insurance.',
    ],
  },

  // ────────── FRANCA (FR) ──────────
  FR: {
    'pt-BR': [
      'Franca segue padrao UE: microchip ISO + antirrabica + passaporte EU ou CVI. Brasil tem que titular antirrabica para alguns pets.',
      'Paris e exemplar em cultura pet — caes entram em maioria de cafes, restaurantes e algumas lojas.',
      'Metro de Paris: pet em coleira ou caixa, com ticket adicional pra portes medio/grande.',
      'TGV e SNCF aceitam pet com taxa baixa. Reservar bilhete pet junto com o do tutor.',
      'Cao categoria 1 ou 2 (algumas racas) precisa de focinheira, seguro e licenca municipal.',
      'Litoral mediterraneo (Cannes, Nice) e mais pet-friendly que praias atlanticas em alta temporada.',
      'Patisserie e charcuterie tem alimentos altamente proibitivos pra caes (chocolate, uva, cebola). Vigilancia.',
      'Inverno em Paris e umido — patas precisam ser secas apos cada saida pra evitar dermatite.',
    ],
    'en-US': [
      'France follows EU standard: ISO microchip + rabies + EU passport or health certificate. Some pets need rabies titer.',
      'Paris is exemplary in pet culture — dogs enter most cafes, restaurants and some shops.',
      'Paris metro: leashed or in carrier, extra ticket for medium/large dogs.',
      'TGV and SNCF accept pets with low fee. Book pet ticket together with passenger.',
      'Category 1 or 2 dogs (some breeds) require muzzle, insurance and municipal license.',
      'Mediterranean coast (Cannes, Nice) is more pet-friendly than Atlantic beaches in high season.',
      'Patisserie and charcuterie contain pet-toxic foods (chocolate, grapes, onion). Stay vigilant.',
      'Paris winters are damp — paws should be dried after each walk to prevent dermatitis.',
    ],
  },

  // ────────── ITALIA (IT) ──────────
  IT: {
    'pt-BR': [
      'Italia segue UE: microchip ISO + antirrabica + passaporte EU ou CVI. Pets do Brasil precisam de titulacao antirrabica.',
      'Italianos amam pets — Roma, Florenca e Veneza tem alta receptividade em hoteis, restaurantes e ate igrejas pequenas.',
      'Veneza tem regras especiais: pet em coleira em vaporetto, passaporte sanitario sempre na bolsa.',
      'Trenitalia (Frecciarossa, Frecciargento) aceita pet com bilhete dedicado. Pet pequeno em caixa pode ir gratis.',
      'Verao no sul (Napoles, Sicilia) ultrapassa 38°C — passeios so antes das 9h e depois das 19h.',
      'Praias livres (spiagge libere) sao mais permissivas que estabelecimentos privados. Verificar antes.',
      'Antipasto com queijos curados e embutidos pode ter sodio em excesso pra pets — manter racao.',
      'Toscana e Umbria sao otimas para pets: agriturismos pet-friendly, trilhas e clima ameno na primavera/outono.',
    ],
    'en-US': [
      'Italy follows EU: ISO microchip + rabies + EU passport or health certificate. Pets from Brazil need rabies titer.',
      'Italians love pets — Rome, Florence and Venice are highly welcoming at hotels, restaurants and even small churches.',
      'Venice has special rules: leashed pet on vaporetto, health passport always in bag.',
      'Trenitalia (Frecciarossa, Frecciargento) accepts pets with dedicated ticket. Small pet in carrier can travel free.',
      'Summer in the south (Naples, Sicily) exceeds 38°C — walks only before 9am and after 7pm.',
      'Free beaches (spiagge libere) are more permissive than private establishments. Check first.',
      'Antipasto with cured cheese and cold cuts may have excess sodium for pets — stick to kibble.',
      'Tuscany and Umbria are great for pets: pet-friendly agriturismos, trails and mild climate in spring/autumn.',
    ],
  },

  // ────────── ALEMANHA (DE) ──────────
  DE: {
    'pt-BR': [
      'Alemanha segue UE: microchip ISO + antirrabica + passaporte EU ou CVI. Brasil exige titulacao antirrabica para alguns pets.',
      'Alemania e referencia em cultura pet — caes em metro, lojas, escritorios e ate alguns supermercados.',
      'Deutsche Bahn (DB ICE, IC, RE) aceita pets com bilhete crianca para portes medios/grandes; pequenos em caixa vao gratis.',
      'Hundefuhrerschein (carteira pra dono de cao) e exigida em alguns estados — verificar antes da viagem longa.',
      'Listenhunde (racas listadas como perigosas) tem restricoes severas em alguns estados (NRW, Bavaria).',
      'Berlim e Munique sao especialmente pet-friendly. Hamburgo tem mais regras de coleira em parques.',
      'Ordem publica (Ordnungsamt) fiscaliza saco de coleta — multa de 35-150 EUR por infracoes.',
      'Inverno alemao e rigoroso — pets de pelo curto precisam de capa termica, principalmente em viagem ao norte (Hamburgo, Lubeque).',
    ],
    'en-US': [
      'Germany follows EU: ISO microchip + rabies + EU passport or health certificate. Brazil requires rabies titer for some pets.',
      'Germany is a reference in pet culture — dogs in metro, shops, offices and even some supermarkets.',
      'Deutsche Bahn (DB ICE, IC, RE) accepts pets with child ticket for medium/large; small pets in carrier travel free.',
      'Hundefuhrerschein (dog owner license) is required in some states — verify before long trips.',
      'Listed breeds (Listenhunde, considered dangerous) have severe restrictions in some states (NRW, Bavaria).',
      'Berlin and Munich are especially pet-friendly. Hamburg has stricter leash rules in parks.',
      'Public order (Ordnungsamt) enforces waste bags — fines 35-150 EUR for violations.',
      'German winter is harsh — short-coat pets need thermal layers, especially in the north (Hamburg, Lubeck).',
    ],
  },

  // ────────── REINO UNIDO (GB) ──────────
  GB: {
    'pt-BR': [
      'Reino Unido tem entrada estrita: microchip ISO + antirrabica + tratamento contra Echinococcus 1 a 5 dias antes do embarque (caes).',
      'Brasil esta na lista de paises com risco controlado — pet pode entrar pelo regime PETS sem quarentena.',
      'Londres e excepcional para pets — pubs, transporte publico (Tube, onibus) e ate alguns taxis pretos aceitam caes.',
      'Pais e Galicia tem trilhas e parques nacionais mais pet-friendly que cidades grandes. Lake District e referencia.',
      'Eurostar nao aceita pets — apenas caes-guia. Travessia pelo canal e via ferry (P&O, DFDS) ou Folkestone-Calais (Le Shuttle).',
      'Inverno britanico e umido e frio — pets precisam de toalha sempre e secagem completa apos passeios.',
      'Restaurantes com Beer Garden e quase sempre pet-friendly. Por dentro depende do estabelecimento.',
      'Algumas racas como Pit Bull, Tosa Inu, Dogo Argentino sao banidas pelo Dangerous Dogs Act 1991.',
    ],
    'en-US': [
      'UK has strict entry: ISO microchip + rabies + Echinococcus treatment 1 to 5 days before arrival (dogs).',
      'Brazil is on the controlled-risk list — pets can enter via PETS scheme without quarantine.',
      'London is exceptional for pets — pubs, public transport (Tube, buses) and even some black cabs accept dogs.',
      'Wales and Scotland have more pet-friendly trails and national parks than big cities. Lake District is a reference.',
      'Eurostar does not accept pets — only service dogs. Channel crossing via ferry (P&O, DFDS) or Folkestone-Calais (Le Shuttle).',
      'British winter is wet and cold — pets need towels always and full drying after walks.',
      'Pubs with beer gardens are almost always pet-friendly. Indoor depends on the venue.',
      'Some breeds like Pit Bull, Tosa Inu, Dogo Argentino are banned under the Dangerous Dogs Act 1991.',
    ],
  },

  // ────────── JAPAO (JP) ──────────
  JP: {
    'pt-BR': [
      'Japao tem o protocolo mais rigoroso: microchip + 2 antirrabicas + titulacao FAVN apos a 2a + espera de 180 dias antes da entrada.',
      'O processo todo leva 7-8 meses minimo. Quem nao cumpre o periodo, pet vai pra quarentena por ate 180 dias.',
      'Toquio e Osaka tem cafes-pet (neko cafe, dog cafe), parques especificos como Yoyogi Dog Run.',
      'JR (trem-bala Shinkansen) aceita pet em caixa fechada de ate 10 kg, com bilhete pet adicional.',
      'Templos e santuarios (Senso-ji, Meiji Jingu) raramente aceitam pets — checar antes de ir.',
      'Hoteis pet-friendly sao raros em chains internacionais. Ryokans tradicionais quase nunca aceitam — pesquisar com cuidado.',
      'Verao em Toquio e umido e quente (35°C + 80% umidade). Caes braquicefalicos sofrem demais.',
      'Cultura japonesa exige extrema limpeza — saco de coleta, garrafa de agua para diluir urina, e absoluta etiqueta.',
    ],
    'en-US': [
      'Japan has the strictest protocol: microchip + 2 rabies vaccines + FAVN titer after 2nd + 180-day wait before entry.',
      'The full process takes 7-8 months minimum. Failing the wait means up to 180 days quarantine on arrival.',
      'Tokyo and Osaka have pet cafes (neko cafe, dog cafe), specific parks like Yoyogi Dog Run.',
      'JR (Shinkansen bullet train) accepts pets in closed carriers up to 10 kg with extra pet ticket.',
      'Temples and shrines (Senso-ji, Meiji Jingu) rarely accept pets — check before going.',
      'Pet-friendly hotels are rare in international chains. Traditional ryokans almost never accept — research carefully.',
      'Tokyo summer is humid and hot (35°C + 80% humidity). Brachycephalic dogs suffer greatly.',
      'Japanese culture demands extreme cleanliness — waste bags, water bottle to dilute urine, and absolute etiquette.',
    ],
  },

  // ────────── ARGENTINA (AR) ──────────
  AR: {
    'pt-BR': [
      'Argentina aceita pets do Brasil com microchip ISO + antirrabica em validade + CVI emitido pelo MAPA em ate 10 dias.',
      'Buenos Aires e altamente pet-friendly — Recoleta, Palermo e San Telmo tem muitos cafes e bares com mesa pra cao.',
      'Subte (metro de BA) aceita pet em caixa fechada. Trens regionais (Sarmiento, Mitre) tambem.',
      'Bariloche e El Calafate sao destinos otimos para pets — clima frio, trilhas e cabanas pet-friendly.',
      'Festival do Asado: cuidado com ossos cozidos jogados — esmagam dentes e podem causar perfuracao intestinal.',
      'Carros chequeiros (taxis) costumam aceitar pet pequeno em caixa. Cabify e Uber tem opcao Pet.',
      'Inverno na Patagonia e severo. Pets de pelo curto precisam de capa termica, principalmente em El Calafate e Ushuaia.',
      'Praias de Mar del Plata limitam pets na alta temporada (dez-fev). Pinamar e Carilo sao mais permissivos.',
    ],
    'en-US': [
      'Argentina accepts pets from Brazil with ISO microchip + valid rabies + health certificate issued by MAPA within 10 days.',
      'Buenos Aires is highly pet-friendly — Recoleta, Palermo and San Telmo have many cafes and bars with dog seating.',
      'Subte (BA metro) accepts pets in closed carriers. Regional trains (Sarmiento, Mitre) too.',
      'Bariloche and El Calafate are excellent pet destinations — cool climate, trails and pet-friendly cabins.',
      'Asado festival: beware cooked bones tossed aside — they crush teeth and can cause intestinal perforation.',
      'Standard taxis usually accept small pets in carriers. Cabify and Uber have a Pet option.',
      'Patagonia winter is severe. Short-coat pets need thermal layers, especially in El Calafate and Ushuaia.',
      'Mar del Plata beaches restrict pets in high season (Dec-Feb). Pinamar and Carilo are more permissive.',
    ],
  },
};

function pickLocale(locale: string | undefined): Locale {
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
 * Retorna 10 a 12 dicas para a viagem, misturando especificas do pais (4 a 6)
 * com genericas (4 a 6). Se o pais nao esta no catalogo, retorna so genericas.
 *
 * @param countryCode ISO Alpha-2 (BR, US, PT, ES, FR, IT, DE, GB, JP, AR, ...)
 * @param locale string como 'pt-BR' | 'en-US' | 'es-MX' | 'pt-PT'
 */
export function getTravelTipsForCountry(
  countryCode: string | null | undefined,
  locale: string,
): string[] {
  const lang = pickLocale(locale);
  const generic = GENERIC[lang];

  const code = (countryCode || '').toUpperCase().trim();
  const countrySpecific = code && BY_COUNTRY[code] ? BY_COUNTRY[code][lang] : [];

  const cShuffled = shuffle(countrySpecific).slice(0, 6);
  const gShuffled = shuffle(generic).slice(0, cShuffled.length > 0 ? 6 : 12);

  // Intercala (1 do pais, 1 generica, ...) para alternancia visual no carrossel
  const out: string[] = [];
  const longest = Math.max(cShuffled.length, gShuffled.length);
  for (let i = 0; i < longest; i++) {
    if (i < cShuffled.length) out.push(cShuffled[i]);
    if (i < gShuffled.length) out.push(gShuffled[i]);
  }
  return out;
}

/** Lista os codigos de pais cobertos pelo catalogo. Util pra debug/tests. */
export function listCoveredCountries(): string[] {
  return Object.keys(BY_COUNTRY).sort();
}
