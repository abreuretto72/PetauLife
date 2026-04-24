# auExpert — App Icon (novo, Elite)

Ícone tipográfico alinhado à identidade Elite (Ametista & Jade, Playfair italic).
Substitui o mascote cartoon do PetauLife+ (que ainda está em `assets/images/icon_app_ok.png`).

## Design

**Conceito:** wordmark "au" em Playfair Display Italic sobre gradiente ametista, com um traço jade discreto sob o wordmark (assinatura).

**Raciocínio:**
- Posicionamento premium — apps pet geralmente usam mascote cartoon, um wordmark tipográfico diferencia visualmente como "premium/sério"
- Consistência — usa a mesma tipografia do logo no app, reforçando identidade
- Escalabilidade — texto simples renderiza bem de 1024×1024 até 20×20
- Leitura rápida na grade de apps — alto contraste + forma distinta

## Arquivos master (SVG)

| Arquivo | Propósito | Canvas |
|---------|-----------|--------|
| `icon-ios-1024.svg` | iOS + universal. Full-bleed (iOS aplica superellipse mask) | 1024×1024 |
| `icon-android-foreground.svg` | Android adaptive — camada foreground (transparente, "au" dentro da safe zone) | 432×432 |
| `icon-android-background.svg` | Android adaptive — camada background (ametista gradient) | 432×432 |
| `icon-notification.svg` | Android status bar — monocromático branco, alpha-only | 192×192 |
| `preview.html` | Preview renderizado em todos os tamanhos + mocks de máscara | — |

## Como gerar os PNGs

O Expo espera PNGs em `assets/images/`. Existe um script pronto que converte os SVGs master em PNGs nos tamanhos certos usando `sharp` (já nas deps do projeto):

```bash
cd <raiz-do-projeto-auExpert>
node docs/brand-kit/app-icon/generate-pngs.js
```

Saída (coloca direto em `assets/images/`):
- `icon.png` 1024×1024 — iOS + universal
- `adaptive-icon.png` 432×432 — Android foreground
- `adaptive-icon-bg.png` 432×432 — Android background
- `notification-icon.png` 192×192 — Android status bar
- `favicon.png` 96×96 — Web
- `splash-icon.png` 400×400 — Splash screen

## Configurar o Expo pra usar os novos ícones

Depois que os PNGs forem gerados, editar `app.json` (ou `app.config.ts`):

```json
{
  "expo": {
    "icon": "./assets/images/icon.png",

    "splash": {
      "image": "./assets/images/splash-icon.png",
      "resizeMode": "contain",
      "backgroundColor": "#0D0E16"
    },

    "ios": {
      "supportsTablet": true
    },

    "android": {
      "adaptiveIcon": {
        "foregroundImage": "./assets/images/adaptive-icon.png",
        "backgroundColor": "#8F7FA8"
      },
      "notificationIcon": "./assets/images/notification-icon.png"
    },

    "web": {
      "favicon": "./assets/images/favicon.png"
    }
  }
}
```

Depois rodar:
```bash
npx expo prebuild --clean
```

Isso regenera as pastas `ios/` e `android/` com os ícones novos em todos os tamanhos que cada plataforma exige (iOS: ~15 variantes automaticamente; Android: mipmap-hdpi até -xxxhdpi + adaptive icon XML).

## Fallback — se `sharp` der problema

Alguns ambientes Windows têm dificuldade com `sharp` + fonts system. Alternativas:

**Opção 1 — Inkscape CLI:**
```bash
inkscape icon-ios-1024.svg --export-type=png --export-filename=icon.png --export-width=1024
```

**Opção 2 — ImageMagick:**
```bash
magick convert -density 300 -background none icon-ios-1024.svg -resize 1024x1024 icon.png
```

**Opção 3 — Online (zero setup):**
- [CloudConvert](https://cloudconvert.com/svg-to-png) — upload SVG, escolher tamanho, baixar PNG
- [SVG2PNG](https://svgtopng.com/)

Importante: quem for converter precisa ter Playfair Display instalada no sistema, ou o converter precisa suportar `@import` de Google Fonts (CloudConvert suporta; ImageMagick não).

## Regras do ícone

1. **NÃO** adicionar elementos novos (patinha, silhueta de pet, pata estilizada). O wordmark é suficiente e melhor escalável.
2. **NÃO** mudar a cor de fundo pra sólido — o gradiente sutil dá profundidade e diferencia de apps baratos com fundo flat.
3. **NÃO** trocar Playfair por outra serif "parecida" — a curva do `a` e a inclinação do italic são características distintivas da tipografia.
4. **Em contextos monocromáticos** (silkscreen, fax, impressão 1 cor), usar o wordmark sólido em branco/preto — ver `docs/brand-kit/auexpert-wordmark-mono-*.svg`.

## A/B test sugerido

Antes de fazer release oficial, vale testar duas variantes lado-a-lado na loja (via A/B test do Play Console / App Store Connect):
- **A:** ícone novo (wordmark Elite, arquivos deste folder)
- **B:** ícone antigo (mascote cartoon, `assets/images/icon_app_ok.png`)

Métrica: install rate. Se o novo ficar ≥ antigo, manter o novo. Se cair, voltar o antigo e iterar o design.
