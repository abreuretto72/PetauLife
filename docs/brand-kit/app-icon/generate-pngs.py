#!/usr/bin/env python3
"""
generate-pngs.py — gera PNGs do ícone auExpert Elite a partir da fonte
Playfair Display (instalada em node_modules/@expo-google-fonts/playfair-display).

Alternativa ao generate-pngs.js — usa Pillow em vez de sharp. Mais confiável
porque PIL renderiza o texto diretamente (sem depender de SVG renderer com
suporte a web fonts).

Uso:
  cd <raiz-do-projeto>
  python3 docs/brand-kit/app-icon/generate-pngs.py

Requisitos: pip install pillow
Gera em assets/images/:
  icon.png, adaptive-icon.png, adaptive-icon-bg.png,
  notification-icon.png, favicon.png, splash-icon.png
"""

import os
from PIL import Image, ImageDraw, ImageFont

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
FONT_PATH = os.path.join(ROOT, 'node_modules', '@expo-google-fonts',
                         'playfair-display', '500Medium_Italic',
                         'PlayfairDisplay_500Medium_Italic.ttf')
OUT = os.path.join(ROOT, 'assets', 'images')

# Elite palette
AMETISTA_LIGHT = (156, 139, 184)   # #9C8BB8
AMETISTA      = (143, 127, 168)    # #8F7FA8
AMETISTA_DARK = (92, 74, 120)      # #5C4A78
JADE          = (79, 168, 158)     # #4FA89E
CREAM         = (245, 241, 248)    # #F5F1F8
WHITE         = (255, 255, 255)

def make_gradient(w, h):
    """Gradiente diagonal ametista light → ametista → ametista dark."""
    img = Image.new('RGB', (w, h), AMETISTA)
    pixels = img.load()
    for y in range(h):
        for x in range(w):
            # diagonal: distância do canto superior esquerdo
            t = (x + y) / (w + h)
            if t < 0.55:
                # interpolar light → mid
                lt = t / 0.55
                r = int(AMETISTA_LIGHT[0] + (AMETISTA[0] - AMETISTA_LIGHT[0]) * lt)
                g = int(AMETISTA_LIGHT[1] + (AMETISTA[1] - AMETISTA_LIGHT[1]) * lt)
                b = int(AMETISTA_LIGHT[2] + (AMETISTA[2] - AMETISTA_LIGHT[2]) * lt)
            else:
                # interpolar mid → dark
                lt = (t - 0.55) / 0.45
                r = int(AMETISTA[0] + (AMETISTA_DARK[0] - AMETISTA[0]) * lt)
                g = int(AMETISTA[1] + (AMETISTA_DARK[1] - AMETISTA[1]) * lt)
                b = int(AMETISTA[2] + (AMETISTA_DARK[2] - AMETISTA[2]) * lt)
            pixels[x, y] = (r, g, b)
    return img

def draw_au(img, size, color, font_size_ratio=0.48, y_offset=-0.04):
    """Desenha 'au' em Playfair Italic. Proporções ajustadas:
    - font_size 48% mantém respiro generoso ao redor (iOS recomenda >= 20%)
    - y_offset negativo pra subir levemente (centering óptico do italic)
    """
    draw = ImageDraw.Draw(img)
    font_size = int(size * font_size_ratio)
    font = ImageFont.truetype(FONT_PATH, font_size)
    bbox = draw.textbbox((0, 0), "au", font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    x = (size - text_w) // 2 - bbox[0]
    y = (size - text_h) // 2 - bbox[1] + int(size * y_offset)
    draw.text((x, y), "au", font=font, fill=color)

def draw_jade_underline(img, size):
    """Traço jade sutil sob o 'au', bem separado das letras."""
    draw = ImageDraw.Draw(img, 'RGBA')
    line_w = int(size * 0.16)
    line_h = max(3, int(size * 0.010))
    x = (size - line_w) // 2
    y = int(size * 0.73)
    draw.rounded_rectangle(
        [x, y, x + line_w, y + line_h],
        radius=line_h // 2,
        fill=(*JADE, 230)
    )

def make_ios_icon(size=1024):
    img = make_gradient(size, size)
    draw_au(img, size, CREAM, font_size_ratio=0.48, y_offset=-0.04)
    draw_jade_underline(img, size)
    return img

def make_android_foreground(size=432):
    """Transparente + só o 'au' dentro da safe zone (66% centro)."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_au(img, size, CREAM, font_size_ratio=0.42, y_offset=-0.04)
    draw_jade_underline(img, size)
    return img

def make_android_background(size=432):
    return make_gradient(size, size).convert('RGBA')

def make_notification(size=192):
    """Monocromático branco em fundo transparente. Font maior pra ser
    legível no status bar onde o sistema renderiza super pequeno."""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw_au(img, size, WHITE, font_size_ratio=0.58, y_offset=-0.03)
    return img

def save_png(img, out_name):
    path = os.path.join(OUT, out_name)
    img.save(path, 'PNG', optimize=True)
    kb = os.path.getsize(path) / 1024
    print(f"  ✓ {out_name:30s} {img.size[0]}×{img.size[1]}  ({kb:.1f} KB)")

def main():
    if not os.path.exists(FONT_PATH):
        print(f"ERROR: font não encontrada em {FONT_PATH}")
        print("Rodar `npm install` primeiro pra instalar @expo-google-fonts/playfair-display")
        return 1

    if not os.path.exists(OUT):
        print(f"ERROR: dir destino não existe: {OUT}")
        return 1

    print(f"Fonte: {FONT_PATH}")
    print(f"Saída: {OUT}\n")

    # 1. iOS / universal — 1024x1024
    save_png(make_ios_icon(1024),  'icon.png')

    # 2. Splash — mesma arte mas tamanho menor
    save_png(make_ios_icon(400),   'splash-icon.png')

    # 3. Favicon (web)
    save_png(make_ios_icon(96),    'favicon.png')

    # 4. Android adaptive foreground
    save_png(make_android_foreground(432), 'adaptive-icon.png')

    # 5. Android adaptive background (opcional — Expo aceita backgroundColor string)
    save_png(make_android_background(432), 'adaptive-icon-bg.png')

    # 6. Notification icon (status bar)
    save_png(make_notification(192), 'notification-icon.png')

    print("\nPronto. Próximos passos:")
    print("  1. Conferir os PNGs em assets/images/")
    print("  2. Atualizar app.json (ver docs/brand-kit/app-icon/README.md)")
    print("  3. Rodar: npx expo prebuild --clean")
    return 0

if __name__ == '__main__':
    import sys
    sys.exit(main())
