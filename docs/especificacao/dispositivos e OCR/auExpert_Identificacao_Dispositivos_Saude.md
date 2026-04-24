# Resumo Geral — Identificação, Dispositivos e Saúde do Pet no auExpert

> Visão consolidada de como o auExpert pode coletar, validar e usar dados do pet via **OCR** e **QR/barcode scanner**, usando **Claude Opus 4.7** como cérebro.

---

## 1. Filosofia da feature

**Princípio central:** o app tem que ser **proativo**, não um formulário burocrático. Tutor não deve digitar nada que uma câmera possa ler. A IA não deve só extrair — deve **cruzar, validar e sugerir**.

**Três princípios práticos:**

1. **Digitação é último recurso.** Barcode primeiro, OCR depois, input manual por fim.
2. **OCR sempre com revisão humana.** Nunca salvar resultado direto — mostra form pré-preenchido editável. Campos corrigidos com frequência viram sinal pra ajustar o prompt.
3. **Degradação elegante.** Se o tutor só tem 1 documento, extrai o que dá. Se não tem documento nenhum, input manual vira fallback — nunca bloqueio.

---

## 2. Microchip

### Dados do MVP a coletar

- Número (15 dígitos ISO 11784/11785 FDX-B)
- Data de implantação
- Clínica onde foi feito
- Veterinário responsável + CRMV
- Foto do certificado
- 1 contato de emergência

### Dados da V2

- Registros externos onde o chip está cadastrado (PetLink, SIRAA, RG Pet, gov.br futuro, prefeituras)
- Status atual (ativo / perdido / falecido / transferido)
- Última verificação de leitura pelo vet

### Dados da V3

- QR Code "Pet encontrado" gerado pelo app
- Modo emergência com post pronto pra redes sociais
- Lembrete anual de verificação do chip
- Checklist pré-viagem internacional

### Validações que dão pra fazer agora

- **Formato ISO**: 15 dígitos numéricos
- **Prefixo ICAR**: código de país (ex: 076 = Brasil) ou fabricante (faixa 900–998)
- **Unique constraint no Supabase**: evita duplicata dentro do app

### O que **não** dá pra validar

- Consulta automática a bancos externos — não há API pública no Brasil
- Veracidade contra o Sistema Nacional da Lei 15.046 — ainda não operacional

### Coleta por câmera (2 passos)

```
Passo 1: Barcode scanner na etiqueta do fabricante (Code 128 → 15 dígitos)
         → instantâneo, offline, grátis, 99% preciso

Passo 2: OCR no certificado via Claude Opus 4.7
         → extrai data, vet, CRMV, clínica, local de aplicação

Passo 3: Form pré-preenchido pro tutor revisar e confirmar
```

---

## 3. Dispositivos e acessórios do pet

### Categorias cadastráveis

| Categoria | Exemplos | OCR/QR viável? |
|---|---|---|
| **Identificação** | Plaquinha, QR tag, NFC, tatuagem, passaporte | Parcial (placa gravada, passport sim) |
| **Localização GPS** | Tractive, Invoxia, AirTag, Petlove Tracker | Número de série via QR da caixa |
| **Monitoramento de saúde** | FitBark, Whistle Fit, PetPace | Modelo via QR da caixa |
| **Controle de acesso** | Portinha SureFlap, comedouro SureFeed | Modelo via QR da caixa |
| **Câmera e interação** | Petcube, Furbo | Modelo via QR da caixa |
| **Proteção física** | Coleira antipulgas (Seresto), antilatido, LED | OCR na embalagem |
| **Emergência** | QR tag Pawcode, botão SOS do tracker | Link interno, não OCR |
| **Documentação** | Apólice de seguro pet | OCR funciona muito bem |

### Integração em camadas

1. **Nível 1 — Cadastro passivo:** campo "Dispositivos" na ficha com marca, modelo, ID, data de ativação. Permite lembretes (bateria, garantia, mensalidade).
2. **Nível 2 — Deep link:** botão "Ver localização do Pico" abre o Tractive direto.
3. **Nível 3 — API:** integração oficial permite mapa dentro do auExpert + cruzamento com diário ("Mana andou 40% menos e pulou 3 refeições nesta semana").
4. **Nível 4 — Marketplace:** ofertas de GPS, seguros, portinhas dentro do app.

**Onde o auExpert fica único:** no nível 3, cruzando dados de dispositivo × diário × documentos. Nenhum app de tracker faz isso porque nenhum tem o diário.

---

## 4. Saúde e tipo sanguíneo

### Ponto técnico crítico

**Hemograma de rotina NÃO inclui tipo sanguíneo.** Tipagem é exame específico, feito geralmente só em pré-operatório, transfusão ou reprodução. A maioria dos pets nunca foi tipado.

### Sistemas por espécie

- **Cão**: sistema DEA (Dog Erythrocyte Antigen) — DEA 1.1 +/− é o principal
- **Gato**: sistema AB — tipos A, B, AB (tipo B em gatos tem relevância reprodutiva crítica por isoeritrólise neonatal)
- **Outras espécies**: sistemas próprios, raramente tipadas

### Estado do campo no app (3 possibilidades, não 2)

```typescript
type BloodTypeStatus =
  | { status: "known"; type: string; source: "exam" | "tutor_informed"; verifiedAt: Date }
  | { status: "unknown_not_tested"; note?: string } // nunca foi tipado — normal
  | { status: "not_informed" } // estado inicial
```

### Regras inteligentes que a IA aplica

1. **OCR detectou tipagem explícita** → preenche automático + notifica tutor
2. **OCR detectou hemograma SEM tipagem** → educa o tutor: "hemograma não testa isso, converse com o vet se quiser tipar"
3. **Validação cruzada por espécie** → cão com tipo "B" informado dispara confirmação (não existe em cães)
4. **Gato tipo B** → alerta sobre importância reprodutiva
5. **Exibição prioritária no Modo Emergência** junto com alergias e condições crônicas

---

## 5. Documentos processáveis por OCR

### Matriz de viabilidade

**Alta viabilidade** (impressos padronizados):

- Carteirinha de vacinação — **maior unlock de onboarding**, alimenta metade da ficha
- Certificado de microchip
- Apólice de seguro pet
- Embalagem de produto (ração, medicamento, antiparasitário, vacina)
- Receita veterinária impressa
- Resultado de exame laboratorial
- Pet passport / CIVZ

**Média** (formato varia):

- Receita manuscrita
- Atestado/declaração de saúde
- Laudo de imagem (o texto do laudo, não a imagem em si)
- Prontuário veterinário
- Fatura de pet shop

**Baixa ou nula**:

- Dispositivo eletrônico em si — usa QR/barcode da caixa, não OCR
- Coleiras e plaquinhas gravadas — pouca info
- QR de tag de pet encontrado — dado vive em servidor de terceiro

---

## 6. Arquitetura técnica proposta

### Edge Function genérica: `analyze-pet-document`

Um único endpoint, roteador interno por tipo detectado:

```
1. Classificação (Claude Haiku 4.5, ~500 tokens, rápido e barato)
   ↓ identifica: carteirinha | microchip | receita | exame | seguro | ração | etc.

2. Extração especializada (Claude Opus 4.7, alta resolução 2576px)
   ↓ prompt dedicado por tipo de documento retorna JSON estruturado

3. Engine de regras (camada de inteligência)
   ↓ cruza extração com dados existentes, dispara ações

4. Upsert em tabelas de domínio
   ↓ pet_vaccines, pet_microchip_details, pet_medications, pet_exams, etc.

5. Notificações/sugestões pro tutor
```

**Corte de custo importante:** classificação no Haiku, extração no Opus. ~30% de economia por documento.

### Schema Supabase genérico

```sql
CREATE TABLE pet_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id UUID NOT NULL REFERENCES pets(id) ON DELETE CASCADE,

  file_url TEXT NOT NULL,
  file_mime_type TEXT,
  file_size_bytes INTEGER,

  document_type TEXT NOT NULL,
  document_subtype TEXT,

  extracted_data JSONB,
  extraction_model TEXT,
  extraction_confidence NUMERIC,
  extraction_reviewed_by_user BOOLEAN DEFAULT false,
  extraction_reviewed_at TIMESTAMPTZ,

  captured_at TIMESTAMPTZ DEFAULT NOW(),
  document_date DATE,
  notes TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  registered_by UUID REFERENCES public.users(id),
  updated_by UUID REFERENCES public.users(id),
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES public.users(id)
);
```

Documento original guardado como fonte; dados estruturados viram entidades de domínio. Se OCR errar, tutor corrige na entidade — documento continua disponível como referência visual.

### Engine de regras (híbrida)

**Regras determinísticas em tabela** (instantâneas, zero custo de IA):

- Vacina vencendo
- Validade de medicamento
- Validação de formato por espécie (DEA pra cão, A/B/AB pra gato)
- Duplicidade de microchip

**Claude como raciocínio contextual** (eventos importantes, resumo semanal):

- Peso fora da curva
- Pet passou de filhote pra adulto → sugerir nova ração
- Raça + idade = exames preventivos recomendados
- Mudança de padrão no diário = investigar

**Fila de revisão** onde tutor aprova/descarta sugestões — feedback melhora regras com o tempo.

---

## 7. Fluxo de UX unificado

**Uma tela só: "Adicionar documento do pet"**

```
[📸 Tirar foto | 🖼 Galeria | 📄 PDF]
          ↓
Claude classifica: "Isso parece uma carteirinha de vacinação. Confirma?"
          ↓
Extração aparece em cards por seção:
  ✓ Dados do pet (4 campos novos detectados)
  ✓ Microchip (se presente)
  ✓ 7 vacinas encontradas
  ✓ Castração em 12/03/2024
          ↓
[Salvar tudo] [Revisar campo a campo]
          ↓
Engine de regras dispara:
  • Lembrete de reforço da V10 em 2 meses
  • Alerta: antirrábica venceu há 30 dias
  • Sugestão: "quer registrar o contato da clínica?"
```

**Principal feature de onboarding:** "tira uma foto da carteirinha e tá pronto" em vez de 30 campos pra preencher.

---

## 8. Priorização sugerida

### MVP (próximas semanas, depois que os bugs do diário fecharem)

1. Barcode scanner pro número de microchip
2. Edge Function `analyze-pet-document` com 1 tipo: **certificado de microchip**
3. Schema `pet_microchip_details` + `pet_emergency_contacts`
4. Validação de formato ISO + unique constraint

### V2 (curto prazo)

5. Adicionar tipo **carteirinha de vacinação** (maior impacto em onboarding)
6. Adicionar tipo **embalagem de ração** (aproveita refactor do "Trocar ração")
7. Campo "Dispositivos do pet" com cadastro passivo
8. Engine de regras básica (vacinas vencendo, validade)

### V3 (médio prazo)

9. Tipo **receita veterinária** → gera lembretes de medicação
10. Tipo **exame laboratorial** → inclui detecção de tipagem sanguínea com as nuances por espécie
11. Deep links pros apps de GPS/health trackers populares
12. Claude como raciocínio contextual semanal

### V4 (longo prazo)

13. QR Code "Pet encontrado" + modo emergência
14. Integração via API com 1 tracker (Tractive candidato natural)
15. Marketplace/parcerias
16. Checklist pré-viagem internacional

---

## 9. Considerações de custo

- **Classificação**: Haiku 4.5, ~US$ 0,001 por documento
- **Extração**: Opus 4.7 em alta resolução, ~US$ 0,025–0,03 por documento
- **Análise contextual semanal**: Opus 4.7 com contexto do pet, ~US$ 0,05–0,10 por pet/semana

**Otimização:** redimensionar imagem client-side pra 1568px em documentos de boa qualidade, perdendo ganho de alta-res mas cortando tokens de imagem pela metade. Reservar alta-res pra embalagem de ração (texto miúdo) e certificados com carimbos.

---

## 10. O que conecta tudo

O auExpert deixa de ser "um diário com cadastro de pet" e vira **uma camada inteligente que lê documentos, conhece o pet, e ajuda o tutor a cuidar proativamente**.

A sequência de valor:

1. Tutor tira foto → OCR extrai → form pré-preenchido
2. Dados estruturados alimentam diário, gráficos, lembretes
3. Engine de regras cruza tudo e sugere ações
4. Modo emergência consolida o que salva vida num único toque
5. Diário + documentos + dispositivos viram histórico médico completo que vet adora ver

Isso é o diferencial real contra concorrentes. Nenhum app de pet no Brasil faz essa camada proativa hoje.

---

## Referências técnicas

- **Modelos**: Claude Opus 4.7 (`claude-opus-4-7`) para extração em alta resolução; Claude Haiku 4.5 (`claude-haiku-4-5-20251001`) para classificação.
- **Stack auExpert**: React Native/Expo SDK 52+, TypeScript, Supabase (PostgreSQL + Edge Functions), React Query, Zustand, Expo Router v4.
- **i18n**: pt-BR, en-US, es-MX, es-AR, pt-PT.
- **Padrão de FKs**: `registered_by`, `updated_by`, `deleted_by` sempre apontando pra `public.users`.
- **Padrão de microchip**: ISO 11784/11785 FDX-B, 15 dígitos, códigos ICAR de país/fabricante.
