/**
 * generate-pngs.js — converte os SVGs master em PNGs nos tamanhos exigidos
 * por iOS e Android, colocando-os direto em `assets/images/` com os nomes
 * que o Expo espera.
 *
 * Uso:
 *   cd <projeto>
 *   node docs/brand-kit/app-icon/generate-pngs.js
 *
 * Requisitos:
 *   - sharp (já está nas deps do projeto: `sharp@^0.33`)
 *   - Playfair Display instalado no sistema OU conexão pra baixar via @import
 *     (o sharp renderiza o SVG via headless chromium embutido)
 *
 * Gera:
 *   assets/images/icon.png                 → iOS + universal (1024×1024)
 *   assets/images/adaptive-icon.png        → Android foreground (432×432)
 *   assets/images/adaptive-icon-bg.png     → Android background (432×432)
 *   assets/images/notification-icon.png    → Android status bar (192×192)
 *   assets/images/favicon.png              → Web (48×48)
 *   assets/images/splash-icon.png          → Splash screen (200×200)
 */

const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const BRAND_KIT = path.join(__dirname);
const OUT = path.join(__dirname, '../../../assets/images');

const jobs = [
  // iOS + universal — superellipse mask é aplicado pela Apple, então full-bleed
  { src: 'icon-ios-1024.svg', out: 'icon.png', size: 1024 },
  // Também gera uma versão pro splash (circular/square depending on expo config)
  { src: 'icon-ios-1024.svg', out: 'splash-icon.png', size: 400 },
  // Favicon (web)
  { src: 'icon-ios-1024.svg', out: 'favicon.png', size: 96 },

  // Android adaptive icon — foreground (safe zone dentro)
  { src: 'icon-android-foreground.svg', out: 'adaptive-icon.png', size: 432 },
  // Android background (Expo aceita color via config, mas se quiser imagem:)
  { src: 'icon-android-background.svg', out: 'adaptive-icon-bg.png', size: 432 },

  // Notification icon — monochrome, alpha-only
  { src: 'icon-notification.svg', out: 'notification-icon.png', size: 192 },
];

(async () => {
  if (!fs.existsSync(OUT)) {
    console.error(`Destino não existe: ${OUT}`);
    process.exit(1);
  }

  for (const job of jobs) {
    const srcPath = path.join(BRAND_KIT, job.src);
    const outPath = path.join(OUT, job.out);

    if (!fs.existsSync(srcPath)) {
      console.error(`Source não existe: ${srcPath}`);
      continue;
    }

    try {
      await sharp(srcPath, { density: 300 })
        .resize(job.size, job.size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png({ compressionLevel: 9, quality: 95 })
        .toFile(outPath);

      const stat = fs.statSync(outPath);
      console.log(`✓ ${job.out.padEnd(30)} ${job.size}×${job.size}  (${(stat.size/1024).toFixed(1)} KB)`);
    } catch (err) {
      console.error(`✗ ${job.out}: ${err.message}`);
    }
  }

  console.log('\nPronto. Rodar `npx expo prebuild --clean` pra aplicar os ícones no projeto nativo.');
})();
