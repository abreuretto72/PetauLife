# Plano de Legado — spec

> **Pilar 6.3** do plano de posicionamento Elite (refinamento do "Testamento Emocional")
> **Status:** spec pronta, não implementada
> **Prioridade:** alta — feature de confiança, fala diretamente com responsabilidade do tutor elite

---

## 1. Conceito

**Formulário clínico e afetivo que responde: "Se algo acontecer comigo, quem cuida de [pet]? O que precisam saber?"**

Saída: **PDF de 4 páginas**, template sóbrio e sério, chamado "Plano de Legado para [nome]". Pode ser compartilhado via link assinado (sem login) com o guardião designado.

Registro: notarial afetivo. Zero melodrama. Como se fosse um documento cartorial curto mas humano.

---

## 2. Conteúdo do Plano

Quatro blocos:

### Bloco 1 — Identificação do pet (dados já existem no app)
- Nome, espécie, raça, data de nascimento/adoção, microchip, foto
- Tutor responsável (nome completo + CPF opcional)
- Co-tutores / caregivers registrados

### Bloco 2 — Cuidados essenciais
- **Veterinário de referência** (nome, CRMV, clínica, telefone 24h)
- **Vacinas em dia / vencendo** (tabela puxada do prontuário)
- **Alergias conhecidas** (tabela)
- **Medicações contínuas** (nome, dosagem, horários)
- **Plano de saúde** (se houver — ID da carteirinha)

### Bloco 3 — Rotina e preferências
- **Ração atual** (marca, quantidade por refeição, horários)
- **Petiscos permitidos / proibidos**
- **Passeios** (horários, duração, locais frequentes)
- **Do que o pet gosta** (texto livre — preenchido pelo tutor)
- **Do que o pet tem medo** (texto livre)
- **Comportamentos peculiares** (texto livre — "só dorme de barriga pra cima", "late quando passa o carteiro")

### Bloco 4 — Designação de guardião
- **Guardião primário** (nome, relação com o tutor, contato, já consentiu?)
- **Guardião secundário** (idem)
- **Instruções específicas** (texto livre — "não levar para canil", "se ficar sozinho mais de 4h, chamar a Ana")
- **Mensagem pessoal do tutor ao guardião** (texto livre)

---

## 3. Modelo de dados

```sql
CREATE TABLE pet_legacy_plans (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pet_id                 uuid NOT NULL REFERENCES pets(id) ON DELETE CASCADE,
  user_id                uuid NOT NULL REFERENCES public.users(id),
  
  -- Bloco 2: cuidados essenciais (complementa dados clínicos do prontuário)
  vet_reference          jsonb,       -- { name, crmv, clinic, phone_24h, address }
  health_plan            jsonb,       -- { provider, policy_number, coverage_notes }
  
  -- Bloco 3: rotina e preferências
  routine_food           text,        -- ração, petiscos, horários
  routine_walks          text,        -- passeios, locais, duração
  routine_likes          text,        -- do que gosta (texto livre)
  routine_fears          text,        -- do que tem medo
  routine_quirks         text,        -- comportamentos peculiares
  
  -- Bloco 4: guardião
  guardian_primary       jsonb,       -- { name, relationship, phone, email, consented_at }
  guardian_secondary     jsonb,
  guardian_instructions  text,        -- instruções específicas
  guardian_message       text,        -- mensagem pessoal do tutor
  
  -- Share
  share_token            text UNIQUE,            -- token assinado pra URL pública
  share_expires_at       timestamptz,
  shared_with            jsonb,                  -- log de quem acessou
  
  -- Meta
  reviewed_at            timestamptz,            -- tutor revisa periodicamente
  pdf_url                text,
  is_active              boolean DEFAULT true,
  created_at             timestamptz DEFAULT NOW(),
  updated_at             timestamptz DEFAULT NOW()
);

CREATE INDEX pet_legacy_plans_pet_id_idx ON pet_legacy_plans(pet_id) WHERE is_active;
```

**RLS:**
- Dono do pet tem RW total
- Co-parent tem leitura (não edição)
- Guardião designado tem leitura via URL assinada (sem login)

---

## 4. Edge Functions

### `generate-legacy-plan-pdf`

**Input:** `{ pet_id, legacy_plan_id }`
**Output:** `{ pdf_url }`

PDF template: 4 páginas A4, sóbrio, sem frescura visual. Tipografia Inter + Playfair (títulos), uso sutil de Ametista nos separadores de bloco. Logo auExpert no rodapé. Data de geração no cabeçalho.

Puxa dados do pet (prontuário, vacinas, alergias, medicações do banco) + campos do legacy plan + cartas com `occasion='farewell'` como anexo.

### `share-legacy-plan`

**Input:** `{ legacy_plan_id, guardian_email, expires_in_days }`
**Output:** `{ share_url, token }`

Gera token de 48 bytes base64url (mesmo padrão dos invites profissionais), envia e-mail pro guardião via Resend/Postmark com link `auexpert.com.br/legacy/:token`.

### `notify-legacy-designation`

Quando tutor designa guardião, manda email automático pra pessoa: "Você foi designada(o) guardião de [Rex] no plano de legado de [Belisario]. Para aceitar essa responsabilidade, responda este email."

Tracking do aceite é opcional (não bloqueia). Mas o campo `consented_at` fica como registro.

---

## 5. Telas

**`/pet/[id]/legacy`** — visão geral do plano:
- Status (pronto / pendente campos obrigatórios)
- Preview de cada bloco
- CTA "Revisar" e "Gerar PDF"

**`/pet/[id]/legacy/edit`** — formulário de edição:
- 4 seções expansíveis (Bloco 1 auto-preenchido do prontuário, Blocos 2-4 editáveis)
- Campos com mic STT pra texto livre
- Auto-save em background
- Botão "Salvar" ao final

**`/legacy/[token]`** — vista pública (sem login) para o guardião designado:
- Identificação do tutor
- Plano completo renderizado
- Botão "Baixar PDF"
- Aviso discreto: "Este documento é confidencial. Compartilhe apenas com quem precisa saber."

---

## 6. i18n

```json
"legacy.title": "Plano de Legado",
"legacy.subtitle": "O que quem cuidar de {{name}} precisa saber",
"legacy.blocks.identification": "Identificação",
"legacy.blocks.careEssentials": "Cuidados essenciais",
"legacy.blocks.routine": "Rotina e preferências",
"legacy.blocks.guardian": "Guardião designado",
"legacy.guardian.primary": "Guardião primário",
"legacy.guardian.secondary": "Guardião secundário (alternativo)",
"legacy.guardian.instructions": "Instruções específicas",
"legacy.guardian.message": "Mensagem pessoal",
"legacy.share.title": "Compartilhar com o guardião",
"legacy.share.emailLabel": "E-mail do guardião",
"legacy.share.expires": "Válido por {{days}} dias",
"legacy.share.success": "Link enviado ao guardião.",
"legacy.review.lastReviewed": "Última revisão: {{date}}",
"legacy.review.cta": "Revisar agora",
"legacy.disclaimer": "Este documento é confidencial. Compartilhe apenas com quem precisa saber."
```

---

## 7. Regras de registro (inviolável)

Registro do conteúdo gerado pelo app (disclaimers, labels, mensagens de email): **Elite seco**. Legado não é momento de literatura — é de clareza notarial afetiva. Frases curtas, diretas, sem exclamação.

Exemplo do e-mail enviado ao guardião:
> *Oi, [Nome].*
> *[Tutor] designou você como guardião de [Rex] no plano de legado dele. O documento completo está neste link: [URL]. Ele está disponível por [N] dias.*
> *Se tiver dúvidas, responda este email.*

Nenhuma exclamação. Nenhuma onomatopeia. Polido e direto.

---

## 8. Segurança e privacidade

- Token de share: 48 bytes, base64url, `expires_at` obrigatório (default 30 dias, renovável)
- Acesso via token não persiste sessão — cada leitura é uma requisição isolada
- Log de acessos: `shared_with` jsonb com `{ ip, user_agent, accessed_at }` (max últimos 50)
- Revogação: tutor pode invalidar token a qualquer momento
- Dados sensíveis (contatos, vacinas) criptografia column-level via `pgcrypto` (Pilar 7 do plano)

---

## 9. Estimativa

- Migration + RLS: 1 dia
- Telas (visão + editor + vista pública): 3 dias
- EF `generate-legacy-plan-pdf` + template HTML: 2 dias
- EF `share-legacy-plan` + integração de email: 1 dia
- QA + revisão visual do PDF: 1 dia

**Total: ~8 dias**.

---

## 10. Decisões em aberto

1. **Provedor de email transacional.** Resend, Postmark, SendGrid? Afeta custo (~R$ 100-300/mês pra volume inicial).
2. **Verificação do guardião.** Basta email, ou exigir SMS/biometria? Sugestão: email basta (é sobre cuidado, não transferência de dinheiro).
3. **Revisão periódica obrigatória?** Sugestão: banner discreto se último `reviewed_at` foi há mais de 6 meses — "Seu plano foi revisado pela última vez em [data]. Vale conferir?"
4. **Exportação para cartório?** Futuro: PDF com assinatura digital (ICP-Brasil) pra registrar em cartório se tutor quiser. Fora de escopo inicial.
