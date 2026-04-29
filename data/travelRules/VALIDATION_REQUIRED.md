# Validação obrigatória das regras de viagem antes do lançamento

Este catálogo foi gerado em **abril/2026** com base em conhecimento geral.
Antes do release público para o módulo de viagem, **cada um dos 25 países** DEVE ser validado contra:

1. Site oficial da autoridade sanitária do destino (Ministério da Agricultura, USDA, MAFF, DAFF, etc.)
2. Embaixada ou consulado brasileiro no destino
3. Site da companhia aérea (regras IATA pra animais)
4. Veterinário especialista em viagens internacionais

## Países críticos — revisar primeiro

Ordem de prioridade por volatilidade regulatória:

1. **US** — CDC mudou regras em 2024 pra cães (alto risco — Brasil incluído)
2. **GB** — pós-Brexit, regras mudaram em 2021 e podem mudar novamente
3. **AU**, **NZ** — regras estritas, processos longos (6+ meses)
4. **JP** — protocolo de 180+ dias, raramente muda mas extremamente complexo
5. **EU** (11 países) — regulação 576/2013 está estável mas Echinococcus pode ser ampliado
6. **AE** — regras de import permit podem mudar rapidamente
7. **Mercosul** (AR/UY/PY/CL/CO) — geralmente estável

## Lista de checagem por país

Recomenda-se criar 25 cards no Linear/Trello, um por país, com sub-tarefas:

- [ ] Confirmar microchip ISO 11784/11785 com autoridade
- [ ] Confirmar janela da vacina antirrábica (min/max dias)
- [ ] Confirmar formato e prazo do atestado de saúde / health certificate
- [ ] Confirmar se CVI MAPA é exigido (sempre é pra saída do BR)
- [ ] Confirmar requirements adicionais (Echinococcus, RNATT, quarentena, etc.)
- [ ] Confirmar URL e nomenclatura da autoridade sanitária no `descriptionKey` i18n
- [ ] Validar tradução `travel.country.{ISO}` em pt-BR

## Fontes oficiais por região

### EU (PT, ES, FR, IT, DE, NL, BE, AT, IE, GR, SE)
- https://food.ec.europa.eu/animals/movement-pets_en
- Animal Health Regulation (EU) 2016/429
- Pet Travel Scheme (PETS): Regulation 576/2013

### Reino Unido (GB)
- https://www.gov.uk/bring-pet-to-great-britain
- DEFRA Animal Health Certificate (AHC)

### Estados Unidos (US)
- https://www.cdc.gov/importation/dogs/index.html (CDC)
- https://www.aphis.usda.gov/aphis/pet-travel (USDA APHIS)

### Canadá (CA)
- https://inspection.canada.ca/importing-food-plants-or-animals/

### México (MX)
- https://www.gob.mx/senasica

### Mercosul (AR, UY, PY, CL, CO)
- AR: https://www.argentina.gob.ar/senasa
- UY: https://www.gub.uy/ministerio-ganaderia-agricultura-pesca
- PY: http://www.senacsa.gov.py/
- CL: https://www.sag.gob.cl/
- CO: https://www.ica.gov.co/

### Japão (JP)
- https://www.maff.go.jp/aqs/english/animal/dog/import-other.html

### Austrália / Nova Zelândia (AU, NZ)
- AU: https://www.agriculture.gov.au/biosecurity-trade/cats-dogs
- NZ: https://www.mpi.govt.nz/import/live-animals/cats-and-dogs/

### Emirados Árabes Unidos (AE)
- https://www.moccae.gov.ae/en/services/livestock-development.aspx

### Suíça (CH)
- https://www.blv.admin.ch/blv/en/home.html (OSAV)

## Responsável e prazo

- **Responsável:** [definir]
- **Prazo:** antes do go-live público do módulo
- **Frequência de revisão pós-lançamento:** semestral (abril e outubro)

## Origem dos dados

Catálogo curado por Belisario Retto + Claude (2026-04). Estrutura segue
spec PR1_modulo_viagem.md rev 2. Compartilha bases regionais via
`shared/euCommon.ts`, `shared/mercosulCommon.ts`, `shared/auOceaniaCommon.ts`,
`shared/strictRabies.ts` para reduzir duplicação.

## Quando o catálogo NÃO cobre um país

O sistema tem fallback automático em duas camadas:

1. **`travel_rules_generated`** (cache global no Supabase) — primeiro tutor que
   viaja para um país desconhecido dispara geração via Edge Function
   `generate-travel-rules` (Claude Opus 4.7). Demais reaproveitam por 90 dias.
2. **`generic_fallback`** (`genericInternational.ts`) — se a geração IA falha
   ou está em andamento, mostra checklist genérica internacional com banner
   forte de disclaimer pedindo consulta a vet + embaixada.

Tutor SEMPRE deve confirmar com vet, embaixada/consulado e companhia aérea.
Banner de disclaimer aparece em TODA tela que renderizar regras com
`source !== 'static_catalog'` e não pode ser dispensado nas telas de
planejamento e checklist.
