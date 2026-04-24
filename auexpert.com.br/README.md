# auexpert.com.br — site institucional

Site oficial do auExpert servido no domínio principal `https://auexpert.com.br/`.

## Estrutura

```
auexpert.com.br/
├── index.html               # Landing / marketing principal
├── invite/
│   └── index.html           # Landing de convite de pet (deep link fallback)
├── privacidade.html         # Política de privacidade (LGPD)
├── termos.html              # Termos de uso
├── contato.html             # Canais de contato + formulário
├── .well-known/
│   ├── apple-app-site-association   # iOS Universal Links (SEM extensão)
│   └── assetlinks.json              # Android App Links
└── README.md                # Este arquivo
```

## O que está pronto

- Identidade visual completa na paleta **Ametista & Jade** (ver `docs/elite-tokens.md` do projeto app)
- Tipografia: **Inter** (body) + **Playfair Display** (títulos e logo) + **JetBrains Mono** (dados)
- Responsivo (mobile-first, com breakpoint em 640px)
- Dark mode exclusivo (single theme, consistente com o app)
- Políticas LGPD e termos de uso em pt-BR
- Deep links configurados pra `/invite/*`, `/pet/*`, `/p/*` apontarem pro app

## O que precisa ser substituído antes do deploy de produção

### 1. iOS Universal Links — `.well-known/apple-app-site-association`

Trocar `TEAMID` pelo **Team ID de 10 caracteres** da conta Apple Developer. Exemplo:

```
"appID": "ABCDE12345.br.com.multiversodigital.auexpert"
```

O Team ID está em [App Store Connect → Membership](https://developer.apple.com/account/#MembershipDetail).

**Importante:** este arquivo NÃO TEM extensão (`.json` não). O servidor precisa servir com `Content-Type: application/json` e sem redirecionamento.

### 2. Android App Links — `.well-known/assetlinks.json`

Trocar o `sha256_cert_fingerprints` pelo fingerprint real do keystore de assinatura do APK/AAB.

Para obter:

```bash
# Debug keystore (durante desenvolvimento)
keytool -list -v -keystore ~/.android/debug.keystore -alias androiddebugkey -storepass android

# Release keystore (produção)
keytool -list -v -keystore /path/to/release.keystore -alias <sua-alias>
```

Procure a linha "SHA256:" e copie o valor (formato `AA:BB:CC:...`). Cole em `sha256_cert_fingerprints`.

Se usar **Google Play App Signing**, pegue o SHA-256 em [Play Console → Release → App Integrity → App Signing](https://play.google.com/console) — esse é o correto para produção.

### 3. Links da loja — `index.html` e `invite/index.html`

Procurar por `play.google.com/store/apps/details?id=` e `apps.apple.com/app/auexpert/id000000000` e atualizar com os IDs reais quando o app for publicado.

### 4. Captura de email da lista de espera — `index.html` JS `handleWaitlist()`

A função só loga no console. Em produção, fazer POST pra:
- Supabase Edge Function
- Mailchimp/ConvertKit/Beehiiv API
- Ou form handler serverless da plataforma de deploy (Vercel/Netlify serverless functions)

### 5. Formulário de contato — `contato.html` JS `handleContact()`

Mesma coisa — hoje só loga. Em produção, endpoint real (ex: Formspree, Resend, ou edge function própria).

## Deploy

O site é estático puro — HTML + CSS inline + JS inline, sem build step. Pode rodar em qualquer hospedagem estática.

### Opção 1 — Vercel (recomendado)

```bash
npm i -g vercel
cd auexpert.com.br
vercel --prod
```

Configurar domínio customizado `auexpert.com.br` no dashboard da Vercel.

### Opção 2 — Netlify

```bash
npm i -g netlify-cli
cd auexpert.com.br
netlify deploy --prod --dir=.
```

### Opção 3 — Cloudflare Pages

```bash
npm i -g wrangler
wrangler pages deploy . --project-name=auexpert
```

### Opção 4 — Servidor tradicional (Apache/Nginx)

Apontar o virtual host para esta pasta como document root.

**Atenção Nginx** — adicionar bloco para servir o arquivo sem extensão (`apple-app-site-association`) com o MIME correto:

```nginx
location = /.well-known/apple-app-site-association {
    default_type application/json;
    try_files $uri =404;
}
```

**Atenção Apache** — adicionar `.htaccess` com:

```apache
<Files "apple-app-site-association">
  ForceType application/json
</Files>
```

## Como testar deep links depois do deploy

### iOS
1. Publicar o site com o `apple-app-site-association` correto
2. Fazer build do app Expo com o entitlement de Associated Domains incluindo `applinks:auexpert.com.br`
3. Instalar o app no dispositivo
4. Abrir um link tipo `https://auexpert.com.br/invite/TOKEN` do Safari/Mail/Messages — deve abrir no app

### Android
1. Publicar o site com o `assetlinks.json` correto
2. Configurar `intent-filter` no `AndroidManifest.xml` pra `auexpert.com.br` com `android:autoVerify="true"`
3. Testar com:
   ```bash
   adb shell am start -W -a android.intent.action.VIEW -d "https://auexpert.com.br/invite/TOKEN" br.com.multiversodigital.auexpert
   ```

## Testes de validação dos arquivos `.well-known`

Apple validator oficial:
```
https://app-site-association.cdn-apple.com/a/v1/auexpert.com.br
```

Google statement list generator / validator:
```
https://developers.google.com/digital-asset-links/tools/generator
```

## DNS

O domínio `auexpert.com.br` precisa apontar pra plataforma de hospedagem. Configuração típica:

- **Registro A:** `auexpert.com.br` → IP da plataforma
- **Registro CNAME:** `www.auexpert.com.br` → `auexpert.com.br`
- SSL/TLS automático (Vercel, Netlify, Cloudflare já fornecem)

## Checklist antes de divulgar publicamente

- [ ] Team ID (iOS) substituído em `apple-app-site-association`
- [ ] SHA-256 (Android) substituído em `assetlinks.json`
- [ ] Links da Play Store e App Store atualizados com IDs reais
- [ ] Endpoint de captura de email da lista de espera plugado
- [ ] Endpoint do formulário de contato plugado
- [ ] Política de privacidade revisada por advogado
- [ ] Termos de uso revisados por advogado
- [ ] Email `@auexpert.com.br` funcionando (MX configurado)
- [ ] Deploy feito, domínio propagado, HTTPS ativo
- [ ] Testes de deep link passando em iOS e Android

## Paleta & tipografia — referência rápida

```
Fundo:         #0D0E16 (tinta violeta)
Superfície:    #161826
Clique:        #8F7FA8 (ametista) — única cor tocável
IA:            #4FA89E (jade) — exclusiva de elementos gerados por IA
Texto:         #F0EDF5 (luar lilás)
Secundário:    #A89FB5
Dim:           #6B6478

Fontes:
- Body:    Inter 400/500 (Google Fonts)
- Display: Playfair Display 500, 500 italic (Google Fonts)
- Mono:    JetBrains Mono 400/500 (Google Fonts)
```

Regras no tokens-doc do app: `docs/elite-tokens.md`.
