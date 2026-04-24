# Plano Elite — auExpert

> Plano consolidado para transformar o MVP atual numa versão Elite (única linha de produto).
> **Regra inegociável: só entra no plano o que funciona em produção HOJE**, com tecnologia madura e fornecedores estabelecidos.
> Tudo que é aspiracional, beta, ou depende de modelo não-maduro está fora — e está listado explicitamente em §6.
>
> Decisão: sem versão Lite. Melhor de IA, nova identidade visual, posicionamento premium.
> Fora do escopo inicial: conselho de vets / marketplace profissional.
>
> Este documento é só planejamento. Nenhum código do app é alterado por ele.

---

## 1. Princípios que definem "Elite"

Cinco princípios que funcionam como filtro pra toda decisão daqui pra frente:

1. **Sempre o melhor modelo disponível** — hoje Claude Opus 4.6 para análise clínica e narrativa; Sonnet 4.6 para tarefas com volume e latência; Haiku 4.5 para classificação e validação. Sempre via `app_config`, nunca hardcoded.
2. **Multimodal nativo e temporal** — foto, vídeo, áudio, voz e prontuário atravessando o tempo, sempre com **protocolo de captura definido** para análises comparativas (sem promessa de mágica em foto casual).
3. **Proativo, mas honesto** — o app conta pro tutor o que mudou antes do tutor perguntar, mas nunca promete o que não pode entregar. Qualquer anomalia estatística vem com disclaimer de "sugestivo de, não diagnóstico".
4. **Percepção de premium em cada toque** — tipografia, animação, haptic, voz narrativa, tudo transmite "isto é caro e vale o preço".
5. **Zero atrito clínico no que é maduro** — OCR de documento impresso, STT, câmera. Para casos onde a tecnologia tem limite (receita manuscrita, áudio interpretativo), deixar claro pro tutor e manter ele no controle.

---

## 2. Baseline — o que já temos a favor

O MVP atual chega ao Elite com uma base sólida. Não é reescrita, é elevação de teto.

- AI-first no diário (STT + narração em 3ª pessoa + 8 lentes de classificação modulares)
- Offline-first com fila de mutações e sync automático
- RAG isolado por pet (embeddings + importâncias por tipo)
- Prontuário funcional: vacinas, alergias, medicações, consultas, exames, cirurgias
- `analyze-pet-photo` com frameworks reais (WSAVA, UNESP-Botucatu, Purina, ASPCA) — validado lado a lado contra Gemini, vence em narrativa e hedge clínico
- Prompt caching ativo nas EFs críticas
- Dataset anonimizado sendo coletado com consentimento LGPD
- CRONs proativos (vacinas, padrões de saúde, clima, financeiro)
- i18n em cinco locales com IA respondendo no idioma do dispositivo
- NetworkGuard, ErrorBoundary e PdfActionModal consolidados

---

## 3. Gaps por eixo

### 3.1 Inteligência / IA

- Modelos nas EFs estão em Sonnet 4. Atualizar para **Opus 4.6** (análise clínica, narração), **Sonnet 4.6** (classificação, chat) e **Haiku 4.5** (triagem rápida e validação pós-geração). Tecnologia madura, em produção em escala.
- Vídeo e áudio hoje rodam em Gemini por falta de suporte nativo do Claude a vídeo. Manter Gemini só nesses dois casos é aceitável — Elite é "melhor ferramenta pra cada tarefa", não "Claude em tudo".
- **Extended thinking** ligado em análise de foto clínica e em consolidação semanal. GA na API há meses, encarece ~2-3× mas aumenta muito a qualidade.
- **Streaming SSE** na UI de análise (resultado aparece conforme a IA escreve). Padrão documentado da Anthropic, bibliotecas Expo prontas.
- **Comparação longitudinal com protocolo** (ver §4 H1) — não é "qualquer foto vs qualquer foto", exige foto de referência em condições controladas.
- **Detecção estatística de anomalia** em curvas de peso e humor — **matemática pura (média móvel + desvio padrão), não IA**. Requer 30+ dias de dados. Linguagem de output sempre hedge ("tendência de", "sugestivo de"), nunca diagnóstico.

### 3.2 Dados / Prontuário

- OCR de documentos **impressos** (carteira de vacina, resultado de exame laboratorial, bula de medicação) via Claude Vision — maduro, funciona bem.
- OCR de **receita manuscrita** — aceito com aviso explícito ao tutor: "Receitas escritas à mão têm erro de leitura. Confira cada campo antes de salvar." Nada é salvo sem confirmação.
- Timeline clínica unificada (`app/(app)/pet/[id]/timeline.tsx`) juntando vacinas, consultas, medicações, exames e fotos-milestone.
- Documentos externos (PDFs de exame, imagens de RX) armazenados e indexados no RAG.
- Curva de peso e humor como gráfico nativo, não apenas texto.

### 3.3 UX e identidade visual

- Dark atual com laranja está em território visual de apps mid-tier brasileiros (Nubank, Stone, fintechs). Elite precisa de algo mais particular. **Resolvido** — ver §7: paleta Ametista & Jade.
- Loading states estáticos → animação com assinatura (linhas clínicas desenhando o pet, por exemplo).
- Haptic contextual via `expo-haptics` (maduro em iOS, parcial em Android).
- Tipografia: Sora cumpre função mas é genérica. **Resolvido** — ver §7.2: Inter (body) + Playfair Display (logo e títulos curtos) + JetBrains Mono (números), todas bundladas, com fallback SF Pro Text no iOS.
- Microinterações: transição entre telas, entrada do balão toast, pulse do mic.

### 3.4 Voz e narração

Concentra o maior diferencial percebido do Elite. Toda a pilha aqui é madura.

- **Texto da narração** com voz narrativa literária autoral. Direção: **"Narrador Clarice"** como preset padrão — 3ª pessoa próxima, contemplativa, sensorial, frases curtas. Inspiração em Clarice Lispector de "Laços de Família" e "Felicidade Clandestina", **não** na Clarice de "A Hora da Estrela" (o app não pode deprimir tutor).
- **Presets de voz narrativa** (tutor escolhe nas configurações do pet):
  1. **Clarice** — literária brasileira, contemplativa. Padrão Elite.
  2. **Neutro clínico** — descritivo e factual. Usado automaticamente em eventos de saúde.
  3. **Divertido** — coloquial e leve.
- **Seleção automática de preset por contexto**: app nunca narra receita de medicação em Clarice; função `getNarrationPreset(entry_type, pet_preference)` decide.
- **Voz real (TTS) via catálogo ElevenLabs** — catálogo de vozes pré-selecionadas (brasileiras, cadência lenta, timbre condizente com preset literário). **Mapeamento por porte/temperamento**, não geração. Ex.: pet pequeno vivaz → voz feminina aguda; pet grande calmo → voz grave. Tecnologia madura, em milhares de apps em produção.
- **STT** hoje usa o nativo do device. Upgrade para Whisper large-v3 via EF melhora transcrição de gírias, nomes de raça e termos veterinários. Maduro.

**Exemplo lado a lado (mesma cena)**:

> **Voz neutra (atual)**: "Mana brincou com o chinelo hoje à tarde. Mordeu algumas vezes e balançou a cabeça com animação."
>
> **Voz Clarice (Elite)**: "Havia o chinelo. E havia Mana. Entre a boca pequena e a borracha branca, um mundo inteiro esperava para ser mordido. Ela descobriu, como quem descobre uma coisa antiga. E depois descobriu de novo."

**Por que isso respeita a regra de 3ª pessoa (CLAUDE.md §5)**: a regra não é obstáculo, é pré-requisito. Clarice escreve observando de fora com intimidade. Perfeito pra narrador do pet. Nunca "eu mordi", nunca "meu dono" — sempre "ela", "a cadela pequena", "Mana".

**System prompt do narrador Clarice** (ativado por `narrator_voice = 'clarice'`):

```
Você é um narrador literário brasileiro, na tradição de Clarice Lispector
em "Laços de Família" — contemplativo, sensorial, próximo, nunca pesado.

- Escreva em 3ª pessoa. O pet é sempre "ele", "ela", ou pelo nome.
- Frases curtas. Vírgulas para dar ritmo de respiração.
- Capture o instante. Uma cena, um gesto, uma epifania doméstica mínima.
- Sensorial: textura, som, cheiro, luz.
- Máximo 80 palavras.
- Nunca: metáforas metafísicas pesadas, referências à morte, linguagem depressiva.
- Sempre: ternura, leveza, um fiapo de encantamento no cotidiano.
- Proibido: "eu", "meu dono", "meu humano", qualquer 1ª pessoa.
```

**Três guard rails obrigatórios** pra evitar que o narrador caia em niilismo ou fique cruel em contextos clínicos:

1. **Filtro temático** — entradas de saúde, sintoma ou peso anormal caem automaticamente pra preset neutro clínico.
2. **Filtro de densidade** — máximo 90 palavras, nunca parágrafo único gigante.
3. **Validador pós-geração** — segundo prompt cheap (Haiku) valida se o texto caiu em niilismo ou referência a morte/sofrimento. Se sim, regenera uma vez.

**Consistência entre narrações do mesmo pet** — campo `pets.narrator_fingerprint` guarda 3-4 entradas anteriores pra uso como few-shot no prompt, mantendo voz coesa ao longo do tempo.

### 3.5 Reliability

- Streaming SSE nas EFs de análise (mudar percepção de velocidade sem reduzir latência real).
- Pré-processamento client-side de imagem (resize + WebP) antes do upload de OCR.
- Cache de embeddings no RAG (mesma foto não regera).

### 3.6 Privacidade

- Base sólida já existe (RLS + soft delete + consentimento granular).
- **Column-level encryption** em campos sensíveis (condições médicas, medicações controladas) via `pgcrypto` nativo do Postgres. Maduro. Indicação visual via ícone Lock do Lucide.
- **Exportação completa LGPD** ("baixar todos os meus dados") em 1 toque: query + zip + link temporário no Supabase Storage. Trivial e diferencial de posicionamento.
- **Nota honesta**: criptografia end-to-end real (chave só no device) é viável mas complexa — fora do escopo atual. Column-level já é significativamente melhor que o padrão do mercado.

### 3.7 Monetização

- RevenueCat já plugado.
- Decisão em aberto (ver §10): trial curto ou pago desde o primeiro dia; mensal + anual com desconto; sem tier gratuito permanente.
- Price anchoring sugerido: R$ 29,90/mês ou R$ 299/ano, com benchmarking em Strava Premium, Duolingo Max e Apple Fitness+.

---

## 4. Hero features — as que definem o Elite

Três features hero, todas com tecnologia madura.

### H1 — Comparação longitudinal com protocolo de foto de referência

**O problema que evita**: análise comparativa em fotos casuais (luz diferente, ângulo diferente, hora diferente) gera falsos positivos que minam a confiança no app.

**Como funciona**:
- Tutor tira uma "foto padrão mensal" usando **câmera guiada** (overlay na tela mostra enquadramento esperado, orientação, distância). Similar ao padrão das fotos de documentos.
- Essa foto vira snapshot de referência (`longitudinal_snapshots`).
- Análises comparam sempre contra a última referência, nunca contra foto casual.
- Output é narrativo e hedge: "Em relação ao registro de fevereiro, pelagem aparenta levemente mais brilhante. Postura e massa muscular consistentes."
- Nunca quantifica o que não pode medir ("20% mais brilhante" vira "aparentemente mais brilhante").

**Tecnologia**: Claude Vision compara 2 imagens no mesmo prompt. Maduro. Protocolo de captura guiada é CSS overlay + orientação via `expo-sensors`. Maduro.

### H2 — Narrador literário com voz real (catálogo TTS)

**O problema que evita**: prometer "voz única do pet gerada por IA" quando a tecnologia existente exige sample de áudio do próprio pet (que não existe para a voz narrativa).

**Como funciona**:
- Cada entrada do diário é narrada em 3ª pessoa no preset escolhido pelo tutor (Clarice como padrão, ou neutro clínico, ou divertido).
- Texto gerado por Claude Opus 4.6 (preset literário) ou Sonnet 4.6 (presets neutro/divertido).
- Áudio gerado por **ElevenLabs TTS** com **catálogo de vozes brasileiras pré-selecionadas**, mapeadas por porte e temperamento do pet. Seleção automática com override manual (tutor pode trocar a voz).
- Player inline no card do diário. Compartilhável como arquivo de áudio.

**Tecnologia**: ElevenLabs é produto em produção há anos, milhares de apps, SLA público. Vozes brasileiras boas disponíveis. Integração via HTTP simples. Custo ~US$0.30/mil caracteres no plano Creator.

### H3 — Leitor de documentos impressos

**O problema que evita**: prometer OCR de receita manuscrita sem ressalva e depois o tutor ficar bravo quando a IA lê "Amoxicilina" como "Amoxirilin".

**Como funciona**:
- Foto de documento **impresso**: carteira de vacina, resultado de exame laboratorial, bula, atestado. IA extrai campos, tutor confirma de uma vez só.
- Foto de **receita manuscrita**: aceito, mas com banner explícito "Receita manuscrita tem erro de leitura. Confira cada campo antes de salvar." Cada campo vira input editável com valor pré-preenchido. Nada salva sem revisão explícita.
- Depois de confirmar, itens são estruturados no prontuário e lembretes criados quando aplicável.

**Tecnologia**: Claude Vision + Gemini Vision fazem OCR de texto impresso com alta acurácia. Manuscrito é limite conhecido — transparência com tutor resolve a expectativa.

---

## 5. Features de suporte Elite (segunda onda)

Todas validadas como maduras.

- **Insight diário narrado** — 60s de áudio às 20h com a voz narrativa do pet, opcional. Gera texto + TTS + push com anexo.
- **Relatório mensal premium** — PDF gerado com identidade visual nova, enviado por email. `expo-print` + template HTML. Já temos base no app.
- **Retrospectiva anual como slideshow com narração** — montagem server-side via ffmpeg de fotos do ano + narração TTS. Maduro. **Não é vídeo generativo.**
- **Detecção estatística de anomalias** — média móvel + desvio padrão em peso e humor. Requer 30+ dias de dados (disclaimer explícito antes de ativar).
- **Classificação de presença em áudio** — detecta latido, uivo, miado, silêncio via Gemini. **Não diagnóstico emocional.** Útil pra timeline do diário ("hoje seu pet latiu mais que o habitual").
- **Integração Apple Health / Google Fit** — acesso via `expo-health-connect`. Só liga análise de correlação após 4 semanas de dados. Linguagem sempre de correlação, nunca de causalidade.
- **Cápsula do tempo** — entrada gravada hoje, liberada em X anos. Campo de data + cron. Trivial.
- **Compartilhamento clínico via URL temporária** — token + deep link + RLS. Permite um vet externo consultar o prontuário completo sem ter o app instalado (cumpre a promessa "sem conselho de vet embutido"). Maduro.
- **Exportação LGPD em 1 toque** — query + zip + link temporário no Supabase Storage. Trivial.

---

## 6. O que NÃO entra no escopo — e por quê

Tudo que foi considerado e descartado por risco real de não funcionar:

- **Voice cloning "gerado a partir de raça/personalidade"** — não existe tecnologia que faça isso sem sample de áudio de referência. Substituído por **catálogo TTS curado** em H2.
- **Detecção de claudicação em vídeo (gait analysis)** — análise de marcha veterinária não tem modelo production-grade em API pública. Pode vir no futuro; hoje é pesquisa.
- **Retrospectiva como vídeo generativo (Sora/Veo)** — caro, lento, inconsistente em cenas de animais domésticos. Substituído por **slideshow de fotos reais + narração TTS**.
- **Medição AR do corpo do pet** (altura, comprimento via câmera) — ARKit/ARCore tem precisão ruim em corpo peludo. Erro de ±5cm em pet pequeno é inaceitável.
- **Análise de áudio para "estado emocional do pet"** — classificar latido ansioso vs latido alegre não tem acurácia clínica. Fica só a classificação de presença (latido/uivo/miado/silêncio).
- **Criptografia E2E real (chave só no device)** — viável mas complexo, atrasa entrega. Column-level com pgcrypto entrega 80% do valor com 20% do custo.
- **Rede social, Aldeia, feed, chat entre tutores** — pós-MVP, fora do escopo Elite inicial.
- **Marketplace de pet shops ou veterinários** — fora do escopo.
- **Conselho consultivo de vets embutido no app** — decisão explícita do tutor, fora do escopo atual.
- **Gamificação pesada** — não combina com o posicionamento Elite.

---

## 7. Identidade visual — TRAVADA em 2026-04-23

Decisões fechadas em sessão de design/validação. Fonte canônica e detalhada: **`docs/elite-tokens.md`**. Este capítulo resume o que ficou travado.

### 7.1 Paleta: Ametista & Jade

Escolhida após comparação cega de 10 variações (Tinta&Latão, Vinho, Obsidiana, Nevoeiro, Ametista, Turquesa, Ocre, Aço, Ouro, Coral) em mockups do Hub, Diário, Prontuário e Análise de Foto. Ametista & Jade sobreviveu a todos os testes de densidade e legibilidade.

- **Fundo:** tinta violeta `#0D0E16` (dark com toque sutil de ametista)
- **Toque (`click`):** ametista `#8F7FA8` — cor única de clicáveis. Ícones de ação, chevrons, CTAs, bordas de botão. Violência cultural intencional: roxo historicamente é sóbrio, realeza, contemplação. Cada toque carrega esse sotaque.
- **IA (`ai`):** jade `#4FA89E` — cor exclusiva de saída da IA. Labels, sparkles, confidence scores, borda de cards de observação. Jade na cultura chinesa é saúde e longevidade — coincidência perfeita com o domínio do app.
- **Saúde (`success`):** sálvia fria `#7FA886`
- **Atenção (`warning`):** âmbar `#D4A574`
- **Perigo (`danger`):** tijolo arrosado `#C2645E` — também exclusivo da lixeira (herdado da regra #10 do CLAUDE.md)
- **Texto:** luar lilás `#F0EDF5` (primário), muted `#A89FB5` (secundário), dim `#6B6478` (labels)

**Regra inviolável:** ametista é território exclusivo do toque. Jade é território exclusivo da IA. Nenhum texto informativo, logo, decoração ou ênfase pode usar essas duas cores fora de sua função semântica. Nome do token é `click` (não `accent`) e `ai` (não `purple`) pra carregar a regra no próprio vocabulário.

**Padrão canônico de três dimensões** (estabelecido na validação):

- **Autoria (jade)** — sinaliza quem escreveu (IA). Categorias, labels, confidence, sparkles.
- **Substância (creme)** — o conteúdo em si, otimizado pra leitura.
- **Severidade (semântica)** — comunica quanto importa. Sálvia/âmbar/tijolo.

### 7.2 Tipografia: Inter + Playfair Display + JetBrains Mono

Testadas Playfair (serifa) e Inter (sans) pra narração literária. **Inter venceu** por três motivos: legibilidade máxima no scroll mobile, coerência com o resto da UI (sem alternância entre famílias tipográficas), e robustez cross-platform.

- **`body` — Inter (bundlada via `@expo-google-fonts/inter`)** — UI, labels, botões, quotes do tutor, narração da IA, qualquer texto verbal. Fallback no iOS: `'SF Pro Text'` (caso raro de bundle falhar). Narração da IA usa Inter 15px regular, line-height 1,7, letter-spacing 0,1px, dentro do container canônico jade.
- **`display` — Playfair Display (bundlada)** — APENAS em: logo `auExpert` (`au` em itálico, `Expert` em romano), títulos literários curtos (nome do pet em card grande, título "Diário da Mana" no header). Nunca em corpo de texto nem em narração.
- **`mono` — JetBrains Mono (bundlada)** — scores numéricos, timestamps, níveis, XP, confidence da IA.
- **Caveat (handwriting) removida**. A voz Clarice mora em Inter 15px dentro do container jade com aspas retas e label "NARRAÇÃO DA IA" — composição visual, não forma da letra, é o que sinaliza "isto é literário".

**Regra inviolável de itálico** (herdada de CLAUDE.md #10, ampliada pra Elite): itálico só existe no logo `au`. Nunca em corpo de texto, narração, labels, quotes, humores, scores, tags.

**Bundle:** ~200-280 KB adicionais (Inter 300/400/500 + Playfair 500 regular+italic + JetBrains 400/500). Aceitável pro tier Elite. Subset Latin + PT-BR só, pra economizar.

**Validação obrigatória antes de produção:** iPhone SE + Android compacto (Galaxy A14) + tablet grande. Narração em 15px precisa ler confortavelmente em todos, com particular atenção pro iOS, onde o olho do tutor já está acostumado com SF Pro.

### 7.3 Logo

Mascote cartoon cachorro + balão "au" **fica reservado pro ícone da app store/homescreen** — lá ele sobrevive como identidade de instalação. Nas telas internas do app, vira **wordmark tipográfico puro**:

- `au` em Playfair Display Italic 500, cor `text` (luar brilhante)
- `Expert` em Playfair Display Regular 500, cor `textSec` (luar dim)
- Três tamanhos oficiais: `large` (login), `normal` (header interno), `small` (drawer/footer)

Benefício: escala pra favicon, notificação push, carteirinha PDF, cabeçalho de email — sem virar mancha ilegível em contexto pequeno.

### 7.4 Regras derivadas que entram no CLAUDE.md junto com a execução

- **Humores do pet → cores semânticas** (8 humores mapeados em 4 cores semânticas + ícone pra nuance).
- **Três vozes no diário** (tutor / IA literária / chips inferidos) distinguidas por composição visual, nunca por forma de letra.
- **Stripe jade 26×2px no topo de cards de identificação IA** (análise de foto, OCR, classificação de documento) pra declarar autoria sem poluir a superfície.
- **Nenhum tutor-facing element** em preto puro `#000000`, branco puro só em texto dentro de CTA primária, itálico só no logo.
- **Legibilidade:** corpo de texto ≥ 14px, narração IA ≥ 15px com line-height 1,7, labels ≥ 11px, chips usam variante `...Text` sobre fundo `...Soft` (contraste ≥ 4,5:1).

### 7.5 Escopo da migração quando a execução for autorizada

Sessão focada de **6-8 horas**, num único commit revisado:

1. Reescrita de `constants/colors.ts` com tokens Elite (~30 min)
2. Reescrita de `constants/fonts.ts` + bundle Inter/Playfair/JetBrains Mono via `expo-font` (~30 min)
3. Busca/substituição global `accent → click` (~20 min)
4. **Revisão manual do `purple` caso a caso** — principal gargalo, ~2-3h (IA → vira jade; biometria facial → vira ametista se clicável; gato → vira neutro)
5. Correção de usos de tokens removidos (`petrol`, `gold`, `rose`, `sky`, `lime`) — ~2h
6. Adicionar script `scripts/audit-elite-tokens.ts` ao pre-commit pra bloquear hex hardcoded e uso de tokens legacy
7. Atualizar CLAUDE.md com capítulo "Elite design tokens" apontando pra `elite-tokens.md`
8. Verificação visual screen-by-screen no device — 1-2h
9. Sem alias de compatibilidade. Corte limpo.

**Nada será executado até aprovação explícita do Belisario.**

---

## 8. Mudanças técnicas obrigatórias

Todas apoiadas em tecnologia madura.

### Banco e config

- `app_config`: trocar todos os modelos pra Opus 4.6 / Sonnet 4.6 / Haiku 4.5. Adicionar flag `enable_extended_thinking`.
- Novas tabelas:
  - `pet_voice_profiles` (voice_id do catálogo ElevenLabs + preset selecionado)
  - `longitudinal_snapshots` (foto de referência mensal por pet + metadados do protocolo)
  - `ocr_documents` (originais + extracted + confirmed_by_user boolean)
- `pets`: adicionar `reference_photo_id`, `weight_trend_30d`, `mood_trend_30d`, `narrator_voice` (`clarice | neutral | playful`), `narrator_fingerprint` (jsonb com últimas narrações).

### Edge Functions novas

- `analyze-document-ocr` — foto impressa → estrutura do prontuário
- `generate-pet-voice` — narração → áudio ElevenLabs → URL Supabase Storage
- `compare-pet-photos` — foto atual vs snapshot referência → delta textual hedge
- `detect-health-anomalies` — CRON semanal, estatística simples, gera alerta hedge
- `generate-monthly-report` — CRON mensal, gera PDF + push
- `validate-narration` — roda inline após narração Clarice, Haiku valida filtro temático
- `generate-retrospective` — CRON anual, monta slideshow via ffmpeg + TTS

### EFs existentes a atualizar

- `analyze-pet-photo` — plugar extended thinking + comparação com snapshot (quando disponível)
- `classify-diary-entry` — atualizar modelo para Sonnet 4.6
- Generator de narração — adicionar blocos por preset + `narrator_fingerprint` no contexto
- Todas — adicionar `ai_model_*` novos ao `_shared/ai-config.ts`

### App (código)

- Refatorar tela de análise para **streaming SSE** (UI reage enquanto a IA escreve)
- Novo componente `PetVoicePlayer` (player de áudio inline no diário)
- Novo componente `NarratorPresetSelector` (configuração do pet)
- Novo fluxo de OCR (`app/(app)/pet/[id]/ocr.tsx`) com confirmação por campo
- Novo fluxo de foto-referência mensal (`app/(app)/pet/[id]/reference-photo.tsx`) com overlay de captura
- Timeline clínica unificada (`app/(app)/pet/[id]/timeline.tsx`)
- Novo design system (`constants/colors-v2.ts` + novo `AuExpertLogo`)
- Migração de cores/fontes/radii via codemod (não manual — quebraria em 300+ lugares)

---

## 9. Roadmap em 4 fases

**F0 — Fundação Elite (1-2 semanas)**
Atualizar modelos via `app_config`. Limpar referências antigas. Fechar os bugs pendentes (date parsing, AddPetModal preservation). Sem feature nova. **Zero risco técnico.**

**F1 — Hero features (4-6 semanas)**
H1 comparação longitudinal com protocolo, H2 narrador literário com voz real (catálogo TTS), H3 OCR de documentos impressos. Todas com tecnologia madura. Essas três bastam pra justificar "Elite" no marketing.

**F2 — Nova identidade (3-4 semanas, paralelizável com F1)**
Contratar designer, moodboard, fechar direção, implementar design system novo, migrar telas via codemod. Trabalho de design, risco técnico zero.

**F3 — Expansão (6-8 semanas)**
Insight diário narrado, relatório mensal, retrospectiva anual (slideshow + narração), detecção estatística de anomalias, classificação de presença em áudio, integração Apple Health / Google Fit. Tudo maduro.

**F4 — Polimento + GA (2-3 semanas)**
Monetização fechada (RevenueCat tiers), trial, onboarding narrativo, A/B test de preço, prep de App Store e Play Store com screenshots novos.

---

## 10. Decisões que precisam ser tomadas antes de começar

Nenhuma dessas pode ser respondida sem você:

1. **Trial** — 7 dias, 14 dias, ou pago desde o primeiro dia com garantia de 30 dias?
2. **Preço** — R$ 19,90 / R$ 29,90 / R$ 39,90 mensal? Desconto anual de quanto?
3. **Designer** — tem alguém ou precisa contratar? Orçamento disponível?
4. **ElevenLabs vs Google TTS Studio** — ElevenLabs tem vozes brasileiras mais naturais e é mais caro (~US$0.30/mil chars no Creator). Google TTS é mais barato mas as vozes soam mais robóticas em pt-BR. Recomendo ElevenLabs.
5. **Voz narrativa Clarice** — confirmada como preset padrão do Elite, ou quer avaliar outras referências (Guimarães Rosa, Manoel de Barros, Rubem Alves)?
6. **Plataformas** — iOS + Android simultâneos ou foco num primeiro?
7. **Sunset do MVP atual** — tutores que já usam entram no Elite de graça por N meses ou pagam assim que lançar?
8. **Rebranding do nome auExpert** — manter ou avaliar? (Recomendo manter.)

---

## 11. Próximo passo sugerido

Quando você fechar respostas pras 1-8 acima e quiser começar pela F0 ou F1, eu transformo este plano em backlog no formato do projeto (tasks com estimativas + sprints). Até lá, nenhum código foi tocado.

---

## Apêndice — Maturidade técnica de cada peça

Referência de risco para decisões futuras.

| Peça | Maturidade | Observação |
|---|---|---|
| Claude Opus / Sonnet / Haiku (texto + vision) | Produção | Base do app hoje |
| Prompt caching (Anthropic) | Produção | Já uso |
| Extended thinking (Claude) | Produção | Encarece ~2-3× |
| Streaming SSE (Anthropic) | Produção | Lib Expo pronta |
| Gemini Vision / Audio (presença) | Produção | Já uso |
| ElevenLabs TTS | Produção | SLA público |
| Whisper large-v3 STT | Produção | Open-source ou API paga |
| OCR de texto impresso via Vision | Produção | Alta acurácia |
| OCR de manuscrito | Limitado | Requer confirmação manual |
| Comparação longitudinal de fotos | Requer protocolo | Protocolo de captura resolve |
| Detecção estatística de anomalia | Produção | Matemática pura |
| pgcrypto column-level | Produção | Postgres nativo |
| expo-haptics | Produção | Parcial em Android |
| expo-health-connect | Produção | Apple Health + Google Fit |
| expo-print (PDF) | Produção | Já uso |
| ffmpeg server-side (slideshow) | Produção | Décadas de uso |
| RevenueCat | Produção | Já uso |
