#!/usr/bin/env python3
"""
build_mockups.py — gera 6 PNG mockups das telas principais do auExpert.

Abordagem: cada mockup é construído em SVG (com ícones Lucide reais via lucide_icons.py
+ fontes Elite via fontconfig) e depois rasterizado via cairosvg a 780×1688 (@2x iPhone 14).

Saída: docs/brand-kit/mockups/01-hub.png ... 06-emergency.png

Por que SVG em vez de PIL:
- PIL renderiza glifos por caracter — Lucide icons não são glifos, precisariam de shapes
  desenhados à mão um por um.
- SVG + cairosvg rasteriza paths vetoriais com antialiasing correto, consegue usar fontconfig
  pra fontes Elite, e mantém renderização consistente com o que o RN/Skia entrega em prod.
"""

import os
import sys
import base64
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

import cairosvg
from lucide_icons import svg_icon

# ─── pet photos (reais) ───
def _load_photo(filename):
    path = os.path.join(os.path.dirname(__file__), filename)
    if not os.path.exists(path):
        return None
    with open(path, "rb") as f:
        return f"data:image/jpeg;base64,{base64.b64encode(f.read()).decode()}"

_PHOTOS = {
    "mana":   _load_photo("mana.jpg"),     # Chihuahua filhote (close-up cabeça)
    "pico":   _load_photo("lassir.jpg"),   # Pastor Shetland
    "cacau":  _load_photo("pastor.jpg"),   # Pastor Alemão
    "thor":   _load_photo("reoti.jpg"),    # Pitbull Mix
}


def embed_photo(pet_key, x, y, w, h, clip_id=None, preserve="xMidYMin slice"):
    """Embute foto real dum pet num retângulo [x,y,w,h].
    Default xMidYMin slice ancora pelo topo — preserva as orelhas e a cabeça inteira
    numa foto portrait em quadro quadrado/circular."""
    uri = _PHOTOS.get(pet_key)
    if uri is None:
        return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" fill="#242130"/>'
    clip_attr = f' clip-path="url(#{clip_id})"' if clip_id else ''
    return (f'<image x="{x}" y="{y}" width="{w}" height="{h}" '
            f'href="{uri}" preserveAspectRatio="{preserve}"{clip_attr}/>')


# Alias retrocompatível (usado em mockup_analyzing)
def embed_mana(x, y, w, h, clip_id=None, preserve="xMidYMin slice"):
    return embed_photo("mana", x, y, w, h, clip_id, preserve)

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT  = os.path.join(os.path.dirname(__file__))

# ═════════════════════════ Elite palette ═════════════════════════
C = {
    "bg":          "#0D0E16",
    "bgCard":      "#161826",
    "bgDeep":      "#08090F",
    "card":        "#1A1D2E",
    "cardHover":   "#1E2336",
    "click":       "#8F7FA8",   # ametista — toque
    "clickLight":  "#A89BC0",
    "clickDark":   "#6F6088",
    # Soft tokens — alpha baked into bg (#0D0E16), porque cairosvg não parseia #RRGGBBAA.
    "clickSoft":   "#251F31",   # ametista 0.20 sobre bg
    "clickGhost":  "#181624",   # ametista 0.08 sobre bg
    "ai":          "#4FA89E",   # jade — IA
    "aiSoft":      "#17252A",   # jade 0.14 sobre bg
    "aiText":      "#7CC5BA",
    "success":     "#7FA886",
    "successSoft": "#1C2325",   # sálvia 0.14 sobre bg
    "warning":     "#D4A574",
    "warningSoft": "#282323",   # âmbar 0.14 sobre bg
    "danger":      "#C2645E",
    "dangerSoft":  "#261A20",   # tijolo 0.14 sobre bg
    "text":        "#F0EDF5",
    "textSec":     "#A89FB5",
    "textDim":     "#6B6478",
    "border":      "#2A2D3E",
    "borderLight": "#3A3D50",
}

# Device dimensions — iPhone 14 @1x (rasteriza para @2x)
W, H = 390, 844

# Fontes (Elite)
F_SERIF = "Playfair Display"
F_BODY  = "Inter"
F_MONO  = "JetBrains Mono"
F_HAND  = "Caveat"


# ═════════════════════════ helpers ═════════════════════════

def svg_open(width=W, height=H, bg=C["bg"]):
    return (
        f'<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" '
        f'viewBox="0 0 {width} {height}" width="{width}" height="{height}">'
        f'<rect width="{width}" height="{height}" fill="{bg}"/>'
    )

def status_bar():
    ink = "#F0EDF5"
    return (
        f'<text x="28" y="27" font-family="{F_BODY}" font-weight="600" font-size="15" fill="{ink}">9:41</text>'
        f'<g transform="translate(322 14)" fill="{ink}">'
        f'<rect x="0"  y="9" width="3" height="3" rx="0.5"/>'
        f'<rect x="5"  y="7" width="3" height="5" rx="0.5"/>'
        f'<rect x="10" y="4" width="3" height="8" rx="0.5"/>'
        f'<rect x="15" y="1" width="3" height="11" rx="0.5"/>'
        f'<g transform="translate(26 3) scale(0.42)" fill="none" stroke="{ink}" stroke-width="2.4" '
        f'stroke-linecap="round" stroke-linejoin="round">'
        f'<path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/>'
        f'<path d="M8.5 16.429a5 5 0 0 1 7 0"/><path d="M12 20h.01"/></g>'
        f'<g transform="translate(42 3)">'
        f'<rect x="0" y="0" width="22" height="10" rx="2.5" ry="2.5" fill="none" stroke="{ink}" stroke-width="1" opacity="0.55"/>'
        f'<rect x="1.5" y="1.5" width="16" height="7" rx="1.5" fill="{ink}"/>'
        f'<rect x="22.5" y="3" width="1.5" height="4" rx="0.5" fill="{ink}" opacity="0.55"/>'
        f'</g></g>'
    )

def rect(x, y, w, h, fill="none", stroke=None, stroke_width=1, rx=0, opacity=1):
    s = f' stroke="{stroke}" stroke-width="{stroke_width}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1 else ""
    return f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{rx}" ry="{rx}" fill="{fill}"{s}{o}/>'

def text(x, y, s, size=14, color=C["text"], family=F_BODY, weight="400", italic=False, anchor="start"):
    it = ' font-style="italic"' if italic else ""
    return (
        f'<text x="{x}" y="{y}" font-family="{family}" font-weight="{weight}"{it} '
        f'font-size="{size}" fill="{color}" text-anchor="{anchor}">{s}</text>'
    )

def circle(cx, cy, r, fill="none", stroke=None, stroke_width=1, opacity=1):
    s = f' stroke="{stroke}" stroke-width="{stroke_width}"' if stroke else ""
    o = f' opacity="{opacity}"' if opacity != 1 else ""
    return f'<circle cx="{cx}" cy="{cy}" r="{r}" fill="{fill}"{s}{o}/>'

def avatar_circle(cx, cy, r, initial, color_ring=C["click"], bg=C["clickSoft"], font_size=None, letter_color=None):
    if font_size is None:
        font_size = int(r * 1.1)
    if letter_color is None:
        letter_color = C["clickLight"]  # tom mais claro = letra legível sobre o fundo
    return (
        circle(cx, cy, r, fill=bg, stroke=color_ring, stroke_width=1.5, opacity=0.95)
        + text(cx, cy + font_size*0.36, initial, size=font_size,
               color=letter_color, family=F_SERIF, weight="700", italic=True, anchor="middle")
    )


def tab_bar(active_index=0):
    parts = [rect(0, H-80, W, 80, fill=C["bgCard"]), rect(0, H-80, W, 0.5, fill=C["border"])]
    labels = [("layout-grid", "Painel"), ("book-open", "Diário"),
              ("calendar", "Agenda"), ("sparkles", "IA")]
    xs = [49, 146, 244, 341]
    for i, (icon, lab) in enumerate(labels):
        col = C["click"] if i == active_index else C["textDim"]
        weight = "600" if i == active_index else "500"
        parts.append(svg_icon(icon, xs[i]-12, H-68, size=22, color=col))
        parts.append(text(xs[i], H-30, lab, size=10, color=col, anchor="middle", weight=weight))
    # home indicator
    parts.append(rect(W//2 - 67, H-12, 134, 4, fill=C["text"], rx=2, opacity=0.4))
    return "".join(parts)


# ═════════════════════════ 01 — HUB ═════════════════════════

def mockup_hub():
    svg = [svg_open(), status_bar()]

    # Header: menu — wordmark — avatar + bell
    svg.append(rect(20, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("menu", 28, 64, size=24, color=C["click"]))
    # Wordmark — "au" Playfair italic + "Expert" Inter semibold, posicionado manualmente
    # pra evitar overlap da cauda do "u" italic com a perna do "E".
    svg.append(
        f'<text x="{W//2 - 48}" y="84" font-family="{F_SERIF}" font-style="italic" '
        f'font-weight="700" font-size="27" fill="{C["text"]}">au</text>'
        f'<text x="{W//2 - 12}" y="84" font-family="{F_BODY}" font-weight="600" '
        f'font-size="22" fill="{C["text"]}">Expert</text>'
    )
    svg.append(avatar_circle(296, 76, 18, "B", font_size=16))
    svg.append(rect(326, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("bell", 334, 64, size=24, color=C["click"]))
    svg.append(circle(354, 62, 4.5, fill=C["danger"]))

    # Aldeia card
    svg.append(rect(20, 114, 350, 62, fill=C["bgCard"], rx=16, stroke=C["border"], stroke_width=1))
    svg.append(rect(34, 128, 36, 36, fill=C["aiSoft"], rx=10))
    svg.append(svg_icon("hand-heart", 40, 134, size=24, color=C["ai"]))
    svg.append(text(84, 141, "Aldeia Solidária", size=15, color=C["text"], weight="600"))
    svg.append(svg_icon("map-pin", 82, 150, size=12, color=C["textDim"], stroke=1.6))
    svg.append(text(98, 160, "Aldeia Salto · 8 amigos próximos", size=11, color=C["textDim"], weight="500"))
    svg.append(svg_icon("chevron-right", 340, 132, size=20, color=C["click"]))

    # Eyebrow
    svg.append(text(22, 212, "MEUS PETS · 4", size=11, color=C["textDim"], weight="700"))
    # + Pet button (pill filled)
    svg.append(rect(294, 194, 76, 30, fill=C["click"], rx=15))
    svg.append(svg_icon("plus", 302, 200, size=16, color="#FFFFFF", stroke=2.4))
    svg.append(text(346, 214, "Pet", size=13, color="#FFFFFF", weight="700", anchor="middle"))

    def pet_card(x, y, initial, name, breed, age, weight, health_label,
                 photo_key=None, card_idx=0, status_color="success"):
        out = [rect(x, y, 165, 210, fill=C["bgCard"], rx=20, stroke=C["border"], stroke_width=1)]
        if photo_key:
            # Avatar com foto real recortada em círculo
            cid = f"avatarClip{card_idx}"
            out.append(
                f'<defs><clipPath id="{cid}">'
                f'<circle cx="{x+82}" cy="{y+60}" r="34"/>'
                f'</clipPath></defs>'
            )
            out.append(circle(x+82, y+60, 35.5, fill=C["click"], opacity=0.35))
            # Pitbull e Pastor Alemão são fotos "meio corpo" — não ancorar pelo topo
            # (cortaria o nariz). Usar xMidYMid slice (centrar) funciona melhor.
            preserve = "xMidYMid slice" if photo_key in ("thor", "cacau") else "xMidYMin slice"
            out.append(embed_photo(photo_key, x+82-34, y+60-34, 68, 68,
                                   clip_id=cid, preserve=preserve))
        else:
            out.append(avatar_circle(x+82, y+60, 34, initial, font_size=40))
        out.append(
            f'<text x="{x+82}" y="{y+118}" text-anchor="middle" font-family="{F_SERIF}" '
            f'font-style="italic" font-weight="600" font-size="20" fill="{C["text"]}">{name}</text>'
        )
        out.append(text(x+82, y+136, breed, size=11, color=C["textSec"], weight="500", anchor="middle"))
        out.append(text(x+82, y+156, f"{age} · {weight}", size=11, color=C["textDim"], family=F_MONO, weight="500", anchor="middle"))
        chip_w = 104
        chip_cx = x + (165-chip_w)//2
        sc = C[status_color]
        sb = C[f"{status_color}Soft"]
        icon_name = "shield-check" if status_color == "success" else "alert-circle"
        out.append(rect(chip_cx, y+170, chip_w, 22, fill=sb, rx=11))
        out.append(svg_icon(icon_name, chip_cx+10, y+174, size=13, color=sc, stroke=1.7))
        out.append(text(chip_cx+62, y+185, health_label, size=10, color=sc, weight="600", anchor="middle"))
        return "".join(out)

    svg.append(pet_card(20,  238, "M", "Mana",  "Chihuahua",        "4 meses", "1,8 kg", "Saudável", photo_key="mana",  card_idx=0))
    svg.append(pet_card(205, 238, "P", "Pico",  "Pastor Shetland",  "3 anos",  "12 kg",  "Saudável", photo_key="pico",  card_idx=1))
    svg.append(pet_card(20,  460, "C", "Cacau", "Pastor Alemão",    "6 anos",  "32 kg",  "Atenção",  photo_key="cacau", card_idx=2, status_color="warning"))
    svg.append(pet_card(205, 460, "T", "Thor",  "Pitbull Mix",      "5 anos",  "28 kg",  "Saudável", photo_key="thor",  card_idx=3))

    svg.append(tab_bar(active_index=0))
    svg.append("</svg>")
    return "".join(svg)


# ═════════════════════════ 02 — Analisando foto ═════════════════════════

def mockup_analyzing():
    svg = [svg_open(), status_bar()]

    svg.append(rect(20, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("chevron-left", 29, 64, size=24, color=C["click"]))
    svg.append(text(70, 84, "Novo pet", size=17, color=C["text"], weight="700"))

    # Photo canvas — foto REAL da Mana INTEIRA (contain + bg neutro)
    svg.append(
        f'<defs>'
        f'<clipPath id="photoClip"><rect x="20" y="120" width="350" height="350" rx="24" ry="24"/></clipPath>'
        f'</defs>'
    )
    # Frame mais alto pra acomodar retrato inteiro (390×460 em vez de 350×350)
    frame_x, frame_y, frame_w, frame_h = 20, 120, 350, 410
    svg.append(f'<rect x="{frame_x}" y="{frame_y}" width="{frame_w}" height="{frame_h}" rx="24" fill="#1A1825"/>')
    svg.append(
        f'<defs><clipPath id="photoClipFull"><rect x="{frame_x}" y="{frame_y}" width="{frame_w}" height="{frame_h}" rx="24" ry="24"/></clipPath></defs>'
    )
    # preserveAspectRatio="xMidYMid meet" = foto inteira visível, com bg nas sobras
    svg.append(embed_mana(frame_x, frame_y, frame_w, frame_h, clip_id="photoClipFull", preserve="xMidYMid meet"))
    def corner(x, y, rot):
        return (f'<g transform="translate({x} {y}) rotate({rot})" fill="none" stroke="{C["ai"]}" '
                f'stroke-width="3" stroke-linecap="round"><path d="M 0 22 L 0 0 L 22 0"/></g>')
    svg.append(corner(44,  144, 0))
    svg.append(corner(346, 144, 90))
    svg.append(corner(346, 506, 180))
    svg.append(corner(44,  506, 270))

    step_y = 556
    svg.append(rect(20, step_y, 350, 210, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(rect(36, step_y+18, 142, 22, fill=C["aiSoft"], rx=11))
    svg.append(svg_icon("sparkles", 42, step_y+22, size=14, color=C["ai"], stroke=1.7))
    svg.append(text(60, step_y+33, "INFERIDO PELA IA", size=9, color=C["ai"], weight="700"))
    svg.append(text(36, step_y+62, "Analisando a foto…", size=19, color=C["text"], weight="700", family=F_SERIF, italic=True))

    steps = [
        ("check-circle-2", "Raça identificada",     "Chihuahua (pelo longo) · 0,96", True,  False),
        ("check-circle-2", "Idade estimada",        "filhote, 3–4 meses",            True,  False),
        ("loader",         "Avaliando porte e peso…","~1,5–2 kg esperado",           False, True),
        ("clock",          "Humor e ambiente",       None,                            False, False),
    ]
    for i, (icon, label, sub, done, running) in enumerate(steps):
        y = step_y + 96 + i*27
        if done:
            svg.append(svg_icon("check-circle-2", 36, y-12, size=18, color=C["success"], stroke=2))
        elif running:
            svg.append(f'<circle cx="45" cy="{y-3}" r="9" fill="none" stroke="{C["border"]}" stroke-width="2"/>')
            svg.append(f'<path d="M 54 {y-3} A 9 9 0 0 1 45 {y+6}" fill="none" stroke="{C["ai"]}" stroke-width="2.4" stroke-linecap="round"/>')
        else:
            svg.append(svg_icon("clock", 36, y-12, size=18, color=C["textDim"], stroke=1.8))
        svg.append(text(62, y, label, size=12, color=C["text"] if (done or running) else C["textDim"], weight="500"))
        if sub:
            svg.append(text(62, y+12, sub, size=10, color=C["textSec"], family=F_MONO, weight="400"))

    svg.append(rect(20, 786, 350, 42, fill=C["clickSoft"], rx=21, stroke=C["click"], stroke_width=1.2))
    svg.append(text(W//2, 812, "Cancelar e tirar outra foto", size=13, color=C["click"], weight="600", anchor="middle"))

    svg.append("</svg>")
    return "".join(svg)


# ═════════════════════════ 03 — Diário ═════════════════════════

def mockup_diary():
    svg = [svg_open(), status_bar()]

    svg.append(rect(20, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("chevron-left", 29, 64, size=24, color=C["click"]))
    svg.append(
        f'<text x="{W//2}" y="84" text-anchor="middle" font-family="{F_SERIF}" '
        f'font-style="italic" font-weight="700" font-size="22" fill="{C["text"]}">Diário do Pico</text>'
    )
    svg.append(svg_icon("file-text", 286, 64, size=22, color=C["click"]))
    svg.append(svg_icon("share-2",   328, 64, size=22, color=C["click"]))

    # Filter chips
    y_chip = 112
    x = 20
    for label, active in [("Tudo", True), ("Saúde", False), ("Humor", False), ("Fotos", False), ("IA", False)]:
        w = 14 + len(label)*8 + 14
        if active:
            svg.append(rect(x, y_chip, w, 30, fill=C["click"], rx=15))
            svg.append(text(x + w//2, y_chip+19, label, size=12, color="#FFFFFF", weight="700", anchor="middle"))
        else:
            svg.append(rect(x, y_chip, w, 30, fill="none", rx=15, stroke=C["border"], stroke_width=1))
            svg.append(text(x + w//2, y_chip+19, label, size=12, color=C["textSec"], weight="500", anchor="middle"))
        x += w + 8

    # Date separator
    svg.append(text(20, 176, "HOJE · 23 ABR", size=10, color=C["textDim"], weight="700"))

    # Entry 1 — narração IA
    ent_y = 196
    svg.append(rect(20, ent_y, 350, 232, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(svg_icon("clock", 34, ent_y+16, size=13, color=C["textDim"], stroke=1.7))
    svg.append(text(52, ent_y+26, "18:34", size=11, color=C["textDim"], family=F_MONO))
    svg.append(rect(95, ent_y+14, 82, 20, fill=C["successSoft"], rx=10))
    svg.append(svg_icon("sparkles", 100, ent_y+17, size=12, color=C["ai"], stroke=1.7))
    svg.append(text(138, ent_y+28, "Feliz · IA", size=10, color=C["success"], weight="600", anchor="middle"))
    svg.append(text(34, ent_y+54, "Fomos no parque. Correu muito, latiu pros", size=13, color=C["text"]))
    svg.append(text(34, ent_y+72, "patos, voltou exausto e feliz da vida.", size=13, color=C["text"]))
    svg.append(rect(34, ent_y+88, 322, 1, fill=C["border"]))
    svg.append(rect(34, ent_y+100, 322, 98, fill=C["aiSoft"], rx=12))
    svg.append(svg_icon("sparkles", 44, ent_y+108, size=13, color=C["ai"], stroke=1.8))
    svg.append(text(62, ent_y+119, "NARRAÇÃO DO PICO", size=9, color=C["ai"], weight="700"))
    svg.append(
        f'<text x="44" y="{ent_y+142}" font-family="{F_HAND}" font-weight="500" '
        f'font-size="15" fill="{C["text"]}">Hoje o humano me levou no parque e</text>'
        f'<text x="44" y="{ent_y+160}" font-family="{F_HAND}" font-weight="500" '
        f'font-size="15" fill="{C["text"]}">eu encontrei uns patos que não sabiam</text>'
        f'<text x="44" y="{ent_y+178}" font-family="{F_HAND}" font-weight="500" '
        f'font-size="15" fill="{C["text"]}">quem eu era. Agora sabem. Estou feliz.</text>'
    )
    svg.append(svg_icon("pencil",     318, ent_y+204, size=16, color=C["click"], stroke=1.8))
    svg.append(svg_icon("refresh-cw", 340, ent_y+204, size=16, color=C["click"], stroke=1.8))

    # Date separator 2
    svg.append(text(20, 456, "ONTEM · 22 ABR", size=10, color=C["textDim"], weight="700"))

    # Entry 2 — foto real do Pico + lente pelagem
    ent2_y = 476
    svg.append(rect(20, ent2_y, 350, 158, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    # thumbnail com foto real do Pico, clipada num retângulo arredondado
    svg.append(
        f'<defs><clipPath id="thumbPico">'
        f'<rect x="34" y="{ent2_y+18}" width="72" height="72" rx="12" ry="12"/>'
        f'</clipPath></defs>'
    )
    svg.append(embed_photo("pico", 34, ent2_y+18, 72, 72, clip_id="thumbPico", preserve="xMidYMin slice"))
    svg.append(text(120, ent2_y+30, "14:12 · Casa", size=11, color=C["textDim"], family=F_MONO))
    svg.append(
        f'<text x="120" y="{ent2_y+50}" font-family="{F_SERIF}" font-style="italic" '
        f'font-weight="600" font-size="15" fill="{C["text"]}">Escovação semanal</text>'
    )
    svg.append(rect(120, ent2_y+62, 110, 22, fill=C["aiSoft"], rx=11))
    svg.append(svg_icon("sparkles", 127, ent2_y+66, size=12, color=C["ai"], stroke=1.7))
    svg.append(text(175, ent2_y+77, "Lente: pelagem", size=10, color=C["ai"], weight="600", anchor="middle"))
    svg.append(rect(34, ent2_y+106, 322, 42, fill=C["successSoft"], rx=10))
    svg.append(text(44, ent2_y+122, "PELAGEM", size=9, color=C["ai"], weight="700"))
    svg.append(rect(100, ent2_y+113, 54, 16, fill=C["successSoft"], rx=8, stroke=C["success"], stroke_width=0.8))
    svg.append(text(127, ent2_y+124, "normal", size=9, color=C["success"], weight="600", anchor="middle"))
    svg.append(text(44, ent2_y+138, "Parece saudável, brilho uniforme, sem dermatite.", size=11, color=C["text"]))

    # Entry 3 — vacina
    svg.append(rect(20, 660, 350, 100, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(svg_icon("syringe", 34, 676, size=18, color=C["warning"], stroke=2))
    svg.append(text(60, 688, "Vacina V10 aplicada", size=14, color=C["text"], weight="600"))
    svg.append(text(60, 706, "Dr. Carla · Clínica VetSalto", size=11, color=C["textSec"]))
    svg.append(rect(34, 720, 128, 22, fill=C["warningSoft"], rx=11))
    svg.append(text(98, 735, "próxima em 1 ano", size=10, color=C["warning"], weight="600", anchor="middle"))

    # FAB
    svg.append(f'<circle cx="330" cy="{H-132}" r="36" fill="{C["click"]}" opacity="0.2" />')
    svg.append(f'<circle cx="330" cy="{H-132}" r="30" fill="{C["click"]}" />')
    svg.append(svg_icon("mic", 318, H-144, size=24, color="#FFFFFF", stroke=2.2))

    svg.append(tab_bar(active_index=1))
    svg.append("</svg>")
    return "".join(svg)


# ═════════════════════════ 04 — Prontuário / saúde ═════════════════════════

def mockup_health():
    svg = [svg_open(), status_bar()]

    svg.append(rect(20, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("chevron-left", 29, 64, size=24, color=C["click"]))
    svg.append(
        f'<text x="170" y="84" text-anchor="middle" font-family="{F_SERIF}" '
        f'font-style="italic" font-weight="700" font-size="20" fill="{C["text"]}">Prontuário · Mana</text>'
    )
    svg.append(svg_icon("file-text", 286, 64, size=22, color=C["click"]))
    svg.append(svg_icon("share-2",   328, 64, size=22, color=C["click"]))

    # Tabs
    tab_y = 110
    x = 20
    for i, lab in enumerate(["Geral", "Vitais", "Vacinas", "Exames"]):
        active = (i == 1)
        w = 14 + len(lab)*8 + 14
        if active:
            svg.append(rect(x, tab_y, w, 32, fill=C["click"], rx=16))
            svg.append(text(x+w//2, tab_y+21, lab, size=12, color="#FFFFFF", weight="700", anchor="middle"))
        else:
            svg.append(text(x+w//2, tab_y+21, lab, size=12, color=C["textDim"], weight="500", anchor="middle"))
        x += w + 6

    # Sinais vitais card
    card_y = 164
    svg.append(rect(20, card_y, 350, 172, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(rect(34, card_y+16, 98, 20, fill=C["aiSoft"], rx=10))
    svg.append(svg_icon("sparkles", 40, card_y+19, size=12, color=C["ai"], stroke=1.7))
    svg.append(text(82, card_y+30, "SINAIS VITAIS", size=9, color=C["ai"], weight="700", anchor="middle"))

    def vital_tile(x, y, icon, label, value, unit, status_color, ref=""):
        return (
            svg_icon(icon, x, y, size=18, color=status_color, stroke=2)
            + text(x+26, y+12, label, size=10, color=C["textDim"], weight="600")
            + f'<text x="{x}" y="{y+40}" font-family="{F_MONO}" font-weight="500" font-size="22" fill="{C["text"]}">{value}<tspan font-size="12" fill="{C["textSec"]}" dx="3"> {unit}</tspan></text>'
            + (text(x, y+56, ref, size=9, color=C["textDim"], family=F_MONO) if ref else "")
        )

    svg.append(vital_tile(36,  card_y+52,  "scale",        "PESO",   "3,2", "kg",    C["success"], "ref 2,8–3,5"))
    svg.append(vital_tile(210, card_y+52,  "target",       "BCS",    "5",   "/9",    C["success"], "ideal"))
    svg.append(vital_tile(36,  card_y+118, "activity",     "FC",     "128", "bpm",   C["warning"], "90–140"))
    svg.append(vital_tile(210, card_y+118, "thermometer",  "TEMP",   "38,4","°C",    C["success"], "38–39,2"))

    # Vacinas card
    vac_y = 352
    svg.append(rect(20, vac_y, 350, 150, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(svg_icon("syringe", 34, vac_y+16, size=16, color=C["warning"], stroke=2))
    svg.append(text(58, vac_y+28, "PRÓXIMAS VACINAS", size=10, color=C["textDim"], weight="700"))
    svg.append(rect(240, vac_y+14, 118, 22, fill=C["warningSoft"], rx=11))
    svg.append(svg_icon("alert-triangle", 248, vac_y+18, size=12, color=C["warning"], stroke=1.8))
    svg.append(text(306, vac_y+29, "1 vence em 7 dias", size=9, color=C["warning"], weight="600", anchor="middle"))

    def vac_row(y, name, when, status_color, date_text):
        return (
            circle(42, y+8, 4, fill=status_color)
            + text(56, y+12, name, size=13, color=C["text"], weight="600")
            + text(56, y+28, when, size=11, color=C["textDim"], weight="500")
            + text(356, y+18, date_text, size=11, color=status_color, family=F_MONO, weight="500", anchor="end")
        )

    svg.append(vac_row(vac_y+50, "V10 (Polivalente)", "Reforço anual", C["warning"], "30/04/2026"))
    svg.append(rect(34, vac_y+92, 322, 1, fill=C["border"]))
    svg.append(vac_row(vac_y+100, "Antirrábica",       "Em dia",        C["success"], "12/02/2027"))

    # Predisposições card
    pd_y = 518
    svg.append(rect(20, pd_y, 350, 198, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(rect(34, pd_y+16, 172, 20, fill=C["aiSoft"], rx=10))
    svg.append(svg_icon("sparkles", 40, pd_y+19, size=12, color=C["ai"], stroke=1.7))
    svg.append(text(120, pd_y+30, "PREDISPOSIÇÕES DA RAÇA", size=9, color=C["ai"], weight="700", anchor="middle"))

    sev_bg = {
        C["success"]: C["successSoft"],
        C["warning"]: C["warningSoft"],
        C["danger"]:  C["dangerSoft"],
    }

    def predisp_row(y, name, label, severity_color):
        return (
            svg_icon("alert-circle", 40, y-4, size=14, color=severity_color, stroke=1.8)
            + text(60, y+6, name, size=12, color=C["text"], weight="500")
            + rect(268, y-6, 88, 18, fill=sev_bg[severity_color], rx=9)
            + text(312, y+7, label, size=9, color=severity_color, weight="600", anchor="middle")
        )

    svg.append(predisp_row(pd_y+58,  "Luxação patelar",           "atenção",    C["warning"]))
    svg.append(predisp_row(pd_y+88,  "Hipoglicemia (filhotes)",   "monitorar",  C["danger"]))
    svg.append(predisp_row(pd_y+118, "Colapso traqueal",           "atenção",    C["warning"]))
    svg.append(predisp_row(pd_y+148, "Doença mitral (idosos)",     "normal",     C["success"]))
    svg.append(text(W//2, pd_y+185, "Ver todas as 8 predisposições", size=11, color=C["click"], weight="600", anchor="middle"))

    svg.append(tab_bar(active_index=0))
    svg.append("</svg>")
    return "".join(svg)


# ═════════════════════════ 05 — OCR carteira de vacina ═════════════════════════

def mockup_ocr():
    svg = [svg_open(), status_bar()]

    svg.append(rect(20, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("chevron-left", 29, 64, size=24, color=C["click"]))
    svg.append(text(70, 84, "Documento extraído", size=17, color=C["text"], weight="700"))

    doc_y = 112
    svg.append(
        f'<defs><linearGradient id="docGrad" x1="0" y1="0" x2="1" y2="1">'
        f'<stop offset="0%" stop-color="#E8D89A"/>'
        f'<stop offset="100%" stop-color="#A68B3F"/>'
        f'</linearGradient></defs>'
    )
    svg.append(rect(20, doc_y, 350, 200, fill="url(#docGrad)", rx=16))
    svg.append(rect(20, doc_y, 350, 36, fill="#1a5a3a", rx=16))
    svg.append(rect(20, doc_y+16, 350, 20, fill="#1a5a3a"))
    svg.append(text(40, doc_y+24, "CARTEIRA DE VACINAÇÃO", size=11, color="#E8D89A", weight="700"))
    svg.append(text(40, doc_y+62, "Pet: Mana", size=10, color="#3B2D15", family=F_BODY, weight="500"))
    svg.append(text(40, doc_y+80, "Espécie: Canina  |  Raça: Chihuahua", size=10, color="#3B2D15"))
    svg.append(text(40, doc_y+98, "Sexo: F  |  Nascimento: 18/03/2022", size=10, color="#3B2D15"))
    svg.append(rect(40, doc_y+114, 310, 1, fill="#3B2D15", opacity=0.3))
    svg.append(text(40, doc_y+128, "V10 — L: 2301-B · 12/02/2024 · Dr. Carla", size=9, color="#3B2D15", family=F_MONO))
    svg.append(text(40, doc_y+142, "Antirráb — L: AR-887 · 04/02/2024", size=9, color="#3B2D15", family=F_MONO))
    svg.append(text(40, doc_y+156, "Giárdia — L: GR-112 · 30/01/2024", size=9, color="#3B2D15", family=F_MONO))

    def corner2(x, y, rot):
        return (f'<g transform="translate({x} {y}) rotate({rot})" fill="none" stroke="{C["ai"]}" '
                f'stroke-width="3" stroke-linecap="round"><path d="M 0 20 L 0 0 L 20 0"/></g>')
    svg.append(corner2(32, 124, 0))
    svg.append(corner2(358, 124, 90))
    svg.append(corner2(358, 300, 180))
    svg.append(corner2(32, 300, 270))

    # Detected
    svg.append(rect(20, 332, 350, 46, fill=C["aiSoft"], rx=14))
    svg.append(svg_icon("scan-line", 34, 344, size=20, color=C["ai"]))
    svg.append(text(62, 354, "Carteira de vacinação identificada", size=13, color=C["text"], weight="600"))
    svg.append(text(62, 369, "3 registros extraídos · confidence 0,93", size=10, color=C["textSec"], family=F_MONO))

    # Extracted
    ext_y = 396
    svg.append(rect(20, ext_y, 350, 332, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(rect(34, ext_y+16, 138, 20, fill=C["aiSoft"], rx=10))
    svg.append(svg_icon("sparkles", 40, ext_y+19, size=12, color=C["ai"], stroke=1.7))
    svg.append(text(103, ext_y+30, "EXTRAÍDO PELA IA", size=9, color=C["ai"], weight="700", anchor="middle"))

    def extract_row(y, label, value, conf):
        return (
            text(36, y+6, label, size=10, color=C["textDim"], weight="600")
            + text(36, y+24, value, size=13, color=C["text"], weight="500")
            + f'<text x="356" y="{y+20}" text-anchor="end" font-family="{F_MONO}" font-size="11" fill="{C["aiText"]}" font-weight="500">{conf}</text>'
        )

    svg.append(extract_row(ext_y+52,  "VACINA",         "V10 (Polivalente canina)",   "0,97"))
    svg.append(rect(34, ext_y+88, 322, 1, fill=C["border"]))
    svg.append(extract_row(ext_y+96,  "LOTE",           "2301-B",                      "0,99"))
    svg.append(rect(34, ext_y+132, 322, 1, fill=C["border"]))
    svg.append(extract_row(ext_y+140, "DATA APLICAÇÃO", "12 de fevereiro de 2024",     "0,95"))
    svg.append(rect(34, ext_y+176, 322, 1, fill=C["border"]))
    svg.append(extract_row(ext_y+184, "PRÓXIMO REFORÇO","30 de abril de 2026 (anual)", "0,91"))
    svg.append(rect(34, ext_y+220, 322, 1, fill=C["border"]))
    svg.append(extract_row(ext_y+228, "VETERINÁRIO",    "Dr. Carla · CRMV-SP 12.345",  "0,88"))

    # CTA
    svg.append(rect(20, 744, 350, 52, fill=C["click"], rx=14))
    svg.append(svg_icon("check-circle-2", 50, 758, size=20, color="#FFFFFF", stroke=2.2))
    svg.append(text(W//2 + 16, 777, "Revisar e salvar no prontuário", size=14, color="#FFFFFF", weight="700", anchor="middle"))

    svg.append("</svg>")
    return "".join(svg)


# ═════════════════════════ 06 — SOS emergência ═════════════════════════

def mockup_emergency():
    svg = [svg_open(), status_bar()]

    svg.append(rect(20, 56, 40, 40, fill=C["bgCard"], rx=12))
    svg.append(svg_icon("x", 29, 64, size=24, color=C["click"]))
    svg.append(text(70, 84, "SOS Proxy", size=17, color=C["text"], weight="700"))
    svg.append(rect(310, 62, 60, 28, fill=C["dangerSoft"], rx=14))
    svg.append(svg_icon("shield-alert", 315, 66, size=18, color=C["danger"], stroke=2))
    svg.append(text(350, 81, "ATIVO", size=10, color=C["danger"], weight="700", anchor="middle"))

    # Emergência ativa
    em_y = 116
    svg.append(rect(20, em_y, 350, 170, fill=C["dangerSoft"], rx=20, stroke=C["danger"], stroke_width=1.5))
    svg.append(svg_icon("alert-triangle", 34, em_y+18, size=22, color=C["danger"], stroke=2.2))
    svg.append(text(66, em_y+34, "Emergência médica", size=16, color=C["text"], weight="700"))
    svg.append(text(34, em_y+62, "Mana (Chihuahua · 4 anos · 3,2 kg)", size=13, color=C["text"], weight="500"))
    svg.append(text(34, em_y+82, "Convulsão · iniciada há 3 minutos", size=12, color=C["textSec"]))
    svg.append(svg_icon("clock", 34, em_y+98, size=14, color=C["textDim"], stroke=1.8))
    svg.append(text(54, em_y+110, "21:14 · 23 de abril", size=11, color=C["textDim"], family=F_MONO))
    svg.append(rect(34, em_y+126, 322, 36, fill=C["danger"], rx=18))
    svg.append(svg_icon("share-2", 52, em_y+132, size=18, color="#FFFFFF", stroke=2))
    svg.append(text(W//2 + 10, em_y+149, "Compartilhar prontuário agora", size=13, color="#FFFFFF", weight="700", anchor="middle"))

    # QR
    qr_y = 306
    svg.append(rect(20, qr_y, 350, 232, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(text(W//2, qr_y+22, "PRONTUÁRIO-PROXY · QR", size=10, color=C["textDim"], weight="700", anchor="middle"))
    qr_size = 132
    qr_x = (W - qr_size) // 2
    qr_base_y = qr_y + 38
    svg.append(rect(qr_x-8, qr_base_y-8, qr_size+16, qr_size+16, fill="#FFFFFF", rx=8))
    import random
    random.seed(42)
    cell = qr_size / 9
    for ry in range(9):
        for rx_ in range(9):
            # posicionadores (corner marks)
            if (ry < 3 and rx_ < 3) or (ry < 3 and rx_ > 5) or (ry > 5 and rx_ < 3):
                if ry == 0 or ry == 2 or rx_ == 0 or rx_ == 2 or (ry == 1 and rx_ == 1):
                    if not (ry == 1 and rx_ == 1):
                        svg.append(rect(qr_x+rx_*cell, qr_base_y+ry*cell, cell, cell, fill="#0D0E16"))
                    elif ry == 1 and rx_ == 1:
                        svg.append(rect(qr_x+rx_*cell, qr_base_y+ry*cell, cell, cell, fill="#0D0E16"))
                continue
            if random.random() > 0.45:
                svg.append(rect(qr_x+rx_*cell, qr_base_y+ry*cell, cell, cell, fill="#0D0E16"))

    svg.append(text(W//2, qr_y+196, "Qualquer veterinário lê", size=11, color=C["textSec"], weight="500", anchor="middle"))
    svg.append(text(W//2, qr_y+214, "Expira em 48h · aceita offline", size=10, color=C["textDim"], anchor="middle"))

    # Dados compartilhados
    vs_y = 560
    svg.append(rect(20, vs_y, 350, 170, fill=C["bgCard"], rx=18, stroke=C["border"], stroke_width=1))
    svg.append(rect(34, vs_y+16, 170, 20, fill=C["dangerSoft"], rx=10))
    svg.append(svg_icon("shield-alert", 40, vs_y+19, size=12, color=C["danger"], stroke=1.8))
    svg.append(text(119, vs_y+30, "DADOS COMPARTILHADOS", size=9, color=C["danger"], weight="700", anchor="middle"))

    def data_row(y, icon, label, value):
        return (
            svg_icon(icon, 40, y-6, size=16, color=C["click"], stroke=1.8)
            + text(64, y+6, label, size=11, color=C["textDim"], weight="600")
            + text(64, y+22, value, size=12, color=C["text"], weight="500")
        )

    svg.append(data_row(vs_y+58,  "syringe", "ALERGIAS",         "Amoxicilina · IgE alta"))
    svg.append(data_row(vs_y+98,  "pill",    "MEDICAÇÃO ATIVA",  "Fenobarbital 30 mg · 2×/dia"))
    svg.append(data_row(vs_y+138, "activity","CONDIÇÕES",        "Epilepsia idiopática · 2024"))

    svg.append(tab_bar(active_index=0))
    svg.append("</svg>")
    return "".join(svg)


# ═════════════════════════ runner ═════════════════════════

def rasterize(svg_string, out_name, scale=2):
    out_path = os.path.join(OUT, out_name)
    cairosvg.svg2png(
        bytestring=svg_string.encode('utf-8'),
        write_to=out_path,
        output_width=W*scale,
        output_height=H*scale,
    )
    kb = os.path.getsize(out_path) / 1024
    print(f"  ✓ {out_name:20s} {W*scale}×{H*scale}  ({kb:.1f} KB)")

def main():
    mockups = [
        ("01-hub.png",        mockup_hub),
        ("02-analyzing.png",  mockup_analyzing),
        ("03-diary.png",      mockup_diary),
        ("04-health.png",     mockup_health),
        ("05-ocr.png",        mockup_ocr),
        ("06-emergency.png",  mockup_emergency),
    ]
    print(f"Saída: {OUT}\n")
    for name, fn in mockups:
        svg = fn()
        rasterize(svg, name)
    print("\nPronto.")

if __name__ == '__main__':
    main()
