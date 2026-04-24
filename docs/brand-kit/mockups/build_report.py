#!/usr/bin/env python3
"""
build_report.py — gera o PDF consolidado de marketing do auExpert.
Único documento que explica todas as funções + mockups das telas.
"""
import os
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate, PageTemplate, Frame, Paragraph, Spacer, Image as RLImage,
    Table, TableStyle, PageBreak, KeepTogether, KeepInFrame, HRFlowable, NextPageTemplate
)

# ── Paths ────────────────────────────────────────────────────────────────
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
OUT_DIR = os.path.join(ROOT, 'docs', 'brand-kit')
OUT_PDF = os.path.join(OUT_DIR, 'auExpert_Relatorio_Completo.pdf')
MOCKUPS = os.path.dirname(os.path.abspath(__file__))
FONTS = os.path.join(ROOT, 'node_modules', '@expo-google-fonts')

# ── Register fonts ───────────────────────────────────────────────────────
pdfmetrics.registerFont(TTFont('Playfair',     os.path.join(FONTS, 'playfair-display', '500Medium',        'PlayfairDisplay_500Medium.ttf')))
pdfmetrics.registerFont(TTFont('Playfair-It',  os.path.join(FONTS, 'playfair-display', '500Medium_Italic', 'PlayfairDisplay_500Medium_Italic.ttf')))
pdfmetrics.registerFont(TTFont('Inter',        os.path.join(FONTS, 'inter',            '400Regular',       'Inter_400Regular.ttf')))
pdfmetrics.registerFont(TTFont('Inter-M',      os.path.join(FONTS, 'inter',            '500Medium',        'Inter_500Medium.ttf')))
pdfmetrics.registerFont(TTFont('Inter-B',      os.path.join(FONTS, 'inter',            '700Bold',          'Inter_700Bold.ttf')))
pdfmetrics.registerFont(TTFont('Mono',         os.path.join(FONTS, 'jetbrains-mono',   '400Regular',       'JetBrainsMono_400Regular.ttf')))

# ── Elite colors ─────────────────────────────────────────────────────────
BG       = HexColor('#0D0E16')
BGCARD   = HexColor('#161826')
BGDEEP   = HexColor('#08090F')
CLICK    = HexColor('#8F7FA8')
CLICK_L  = HexColor('#A89AC2')
CLICK_D  = HexColor('#6B5A8A')
AI_JADE  = HexColor('#4FA89E')
TEXT     = HexColor('#F0EDF5')
TEXTSEC  = HexColor('#A89FB5')
TEXTDIM  = HexColor('#6B6478')
SUCCESS  = HexColor('#7FA886')
WARNING  = HexColor('#D4A574')
DANGER   = HexColor('#C2645E')
BORDER   = HexColor('#2A2D3E')

# ── Styles ───────────────────────────────────────────────────────────────
def make_styles():
    s = {}
    s['Title']    = ParagraphStyle('Title',    fontName='Playfair',    fontSize=38, leading=46, textColor=TEXT, alignment=TA_LEFT)
    s['H1']       = ParagraphStyle('H1',       fontName='Playfair',    fontSize=26, leading=34, textColor=TEXT, alignment=TA_LEFT, spaceBefore=18, spaceAfter=10)
    s['H2']       = ParagraphStyle('H2',       fontName='Playfair',    fontSize=18, leading=24, textColor=TEXT, alignment=TA_LEFT, spaceBefore=12, spaceAfter=6)
    s['H3']       = ParagraphStyle('H3',       fontName='Inter-B',     fontSize=13, leading=18, textColor=TEXT, alignment=TA_LEFT, spaceBefore=8, spaceAfter=4)
    s['Body']     = ParagraphStyle('Body',     fontName='Inter',       fontSize=11, leading=17, textColor=TEXT,    alignment=TA_LEFT, spaceAfter=6)
    s['BodySec']  = ParagraphStyle('BodySec',  fontName='Inter',       fontSize=11, leading=17, textColor=TEXTSEC, alignment=TA_LEFT, spaceAfter=6)
    s['Bullet']   = ParagraphStyle('Bullet',   fontName='Inter',       fontSize=11, leading=16, textColor=TEXT,    alignment=TA_LEFT, leftIndent=14, bulletIndent=2, spaceAfter=2)
    s['Callout']  = ParagraphStyle('Callout',  fontName='Inter',       fontSize=11, leading=17, textColor=TEXT,    alignment=TA_LEFT, leftIndent=14, rightIndent=8, backColor=HexColor('#1C1A28'), borderColor=CLICK, borderWidth=0, borderPadding=10, spaceBefore=8, spaceAfter=8)
    s['Caption']  = ParagraphStyle('Caption',  fontName='Inter',       fontSize=9,  leading=13, textColor=TEXTDIM, alignment=TA_CENTER)
    s['Meta']     = ParagraphStyle('Meta',     fontName='Mono',        fontSize=9,  leading=12, textColor=TEXTDIM, alignment=TA_LEFT,   spaceAfter=4)
    s['MetaRight']= ParagraphStyle('MetaRight',fontName='Mono',        fontSize=9,  leading=12, textColor=TEXTDIM, alignment=TA_CENTER, spaceAfter=4)
    s['Jade']     = ParagraphStyle('Jade',     fontName='Inter-B',     fontSize=11, leading=16, textColor=AI_JADE, alignment=TA_LEFT, spaceAfter=4)
    s['Sub']      = ParagraphStyle('Sub',      fontName='Inter',       fontSize=12, leading=18, textColor=TEXTSEC, alignment=TA_LEFT, spaceAfter=10)
    s['CoverTag'] = ParagraphStyle('CoverTag', fontName='Mono',        fontSize=9,  leading=12, textColor=TEXTDIM, alignment=TA_LEFT, spaceBefore=20)
    s['WordmarkIt'] = ParagraphStyle('WordmarkIt', fontName='Playfair-It', fontSize=34, leading=40, textColor=TEXT, alignment=TA_LEFT)
    return s

STYLES = make_styles()

# ── Custom layout: dark bg full-bleed ────────────────────────────────────
PAGE_W, PAGE_H = A4
MARGIN_L = 20*mm
MARGIN_R = 20*mm
MARGIN_T = 20*mm
MARGIN_B = 20*mm

def paint_dark_bg(canvas, doc):
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Footer
    canvas.setFont('Mono', 8)
    canvas.setFillColor(TEXTDIM)
    footer = 'AUEXPERT  ·  MULTIVERSO DIGITAL        |        AUEXPERT.COM.BR'
    canvas.drawCentredString(PAGE_W/2, 12*mm, footer)
    # Page number top-right
    canvas.setFont('Mono', 8)
    canvas.drawRightString(PAGE_W - MARGIN_R, PAGE_H - 12*mm, f'{doc.page:02d}')

def paint_cover_bg(canvas, doc):
    canvas.setFillColor(BG)
    canvas.rect(0, 0, PAGE_W, PAGE_H, fill=1, stroke=0)
    # Card gradient-like no topo (simples: card ametista deep)
    card_x = 18*mm
    card_y = PAGE_H - 130*mm
    card_w = PAGE_W - 36*mm
    card_h = 110*mm
    canvas.setFillColor(BGCARD)
    canvas.roundRect(card_x, card_y, card_w, card_h, 6*mm, fill=1, stroke=0)
    # Top accent bar
    canvas.setStrokeColor(CLICK)
    canvas.setLineWidth(1.5)
    canvas.line(card_x, card_y + card_h, card_x + card_w*0.6, card_y + card_h)
    canvas.setStrokeColor(AI_JADE)
    canvas.line(card_x + card_w*0.6, card_y + card_h, card_x + card_w, card_y + card_h)

# ── Helpers pra blocos ───────────────────────────────────────────────────
def h1(text):
    return [Paragraph(text, STYLES['H1']), HRFlowable(width='100%', color=BORDER, thickness=0.5, spaceBefore=2, spaceAfter=8)]

def h2(text):
    return [Paragraph(text, STYLES['H2'])]

def h3(text):
    return [Paragraph(text, STYLES['H3'])]

def p(text, style='Body'):
    return [Paragraph(text, STYLES[style])]

def bullets(items):
    out = []
    for it in items:
        out.append(Paragraph(f'<font color="#8F7FA8">•</font>&nbsp;&nbsp;{it}', STYLES['Bullet']))
    return out

def callout(text):
    return [Paragraph(text, STYLES['Callout'])]

def mockup(filename, caption, width_mm=85):
    path = os.path.join(MOCKUPS, filename)
    # Aspect 780x1688 = 0.462
    w = width_mm * mm
    h = w * (1688/780)
    img = RLImage(path, width=w, height=h)
    cap = Paragraph(caption, STYLES['Caption'])
    t = Table([[img], [cap]], colWidths=[w], hAlign='CENTER')
    t.setStyle(TableStyle([
        ('TOPPADDING', (0, 0), (-1, -1), 0),
        ('BOTTOMPADDING', (0, 1), (-1, 1), 0),
        ('TOPPADDING', (0, 1), (-1, 1), 6),
    ]))
    return [t, Spacer(1, 4*mm)]

def comparison_table(rows):
    """rows = [(left, right), ...] """
    data = [[Paragraph(f'<b>Outros apps</b>', STYLES['BodySec']), Paragraph(f'<b>auExpert</b>', STYLES['Jade'])]]
    for l, r in rows:
        data.append([Paragraph(l, STYLES['BodySec']), Paragraph(r, STYLES['Body'])])
    t = Table(data, colWidths=[80*mm, 80*mm])
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BGCARD),
        ('LINEBELOW', (0,0), (-1,0), 0.5, BORDER),
        ('LINEBELOW', (0,1), (-1,-2), 0.25, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 10),
        ('RIGHTPADDING', (0,0), (-1,-1), 10),
        ('TOPPADDING', (0,0), (-1,-1), 8),
        ('BOTTOMPADDING', (0,0), (-1,-1), 8),
    ]))
    return [t, Spacer(1, 8)]

def feature_table(headers, rows):
    """Tabela genérica com paleta Elite."""
    data = [[Paragraph(f'<b>{h}</b>', STYLES['BodySec']) for h in headers]]
    for r in rows:
        data.append([Paragraph(c, STYLES['Body']) for c in r])
    col_widths = [(170/len(headers))*mm] * len(headers)
    t = Table(data, colWidths=col_widths)
    t.setStyle(TableStyle([
        ('BACKGROUND', (0,0), (-1,0), BGCARD),
        ('LINEBELOW', (0,0), (-1,0), 0.5, BORDER),
        ('LINEBELOW', (0,1), (-1,-2), 0.25, BORDER),
        ('VALIGN', (0,0), (-1,-1), 'TOP'),
        ('LEFTPADDING', (0,0), (-1,-1), 8),
        ('RIGHTPADDING', (0,0), (-1,-1), 8),
        ('TOPPADDING', (0,0), (-1,-1), 6),
        ('BOTTOMPADDING', (0,0), (-1,-1), 6),
    ]))
    return [t, Spacer(1, 8)]

# ── Build story ──────────────────────────────────────────────────────────
story = []

# ═══════════════════════════ CAPA ═══════════════════════════
# Uses cover page template. Content starts inside the card.
story.append(Spacer(1, 50*mm))  # push into card area
story.append(Paragraph('<font face="Playfair-It">au</font> <font face="Playfair" color="#A89FB5">Expert</font>', STYLES['WordmarkIt']))
story.append(Spacer(1, 10*mm))
story.append(Paragraph('Uma inteligência única<br/>para o seu pet', STYLES['Title']))
story.append(Spacer(1, 6*mm))
story.append(Paragraph('Relatório completo de funcionalidades — MVP e roadmap. '
                       'A IA que lê, entende e cuida do seu pet todos os dias.', STYLES['Sub']))
story.append(Spacer(1, 14*mm))
story.append(HRFlowable(width='70%', color=BORDER, thickness=0.5))
story.append(Spacer(1, 4*mm))
story.append(Paragraph('RELATÓRIO DE MARKETING  ·  MULTIVERSO DIGITAL  ·  2026', STYLES['CoverTag']))
story.append(NextPageTemplate('content'))
story.append(PageBreak())

# ═══════════════════════════ §1 O PROBLEMA ═══════════════════════════
story += h1('O problema de todo tutor de pet')
story += p('Sua vida com o pet gera papel. Muito papel.', 'Body')
story += p('Carteirinha de vacinação que está sempre quase cheia. Receita do remédio que o veterinário prescreveu. '
           'Resultado do exame que chegou por e-mail. Nota fiscal da consulta. Apólice do seguro. Certificado do microchip. '
           'Passaporte para viagem internacional.')
story += p('E aí você precisa de alguma coisa — na emergência, na troca de vet, na viagem, pra tirar uma dúvida — e não acha.')
story += callout('<b>O auExpert resolve isso de um jeito que nenhum outro app resolve: '
                 'você só precisa tirar uma foto.</b>')

story += h1('Como funciona')
story += p('É absurdamente simples:')
story += h3('1. Tire uma foto')
story += p('Aponte a câmera para qualquer documento do seu pet. Pode ser a carteirinha aberta, uma folha de exame, '
           'a receita, a embalagem de um remédio, a apólice do seguro. Tire a foto.')
story += h3('2. A IA faz o resto')
story += p('Em segundos, o auExpert identifica o tipo de documento e extrai todas as informações relevantes — '
           'automaticamente. Datas, nomes, números, tabelas, vacinas, dosagens — tudo organizado e pronto pra usar.')
story += h3('3. Você só confere e salva')
story += p('O app mostra tudo que extraiu em cartões organizados. Você dá uma olhada, corrige se for o caso, e salva. '
           'Pronto. Os dados do seu pet estão completos — sem digitação, sem formulário, sem dor de cabeça.')
story += [PageBreak()]

# ═══════════════════════════ §2 HUB MEUS PETS + MOCKUP ═══════════════════════════
story += h1('Hub Meus Pets — tudo em um lugar só')
story += p('A tela inicial reúne todos os pets sob seus cuidados em cards visuais e compactos. Cada card mostra '
           'o essencial: foto, nome, raça, idade, peso, humor atual — identificação rápida em meio segundo. '
           'Famílias com múltiplos pets (cão, gato, sênior, filhote, pet de viagem) podem alternar entre eles com um toque.')

# Mockup 01 lado a lado com explicação
img_path = os.path.join(MOCKUPS, '01-hub.png')
w_img = 75*mm
h_img = w_img * (1688/780)
img_flow = RLImage(img_path, width=w_img, height=h_img)

explain_flow = [
    Paragraph('<b>Cards de pet</b>', STYLES['Jade']),
    Paragraph('Avatar, nome, raça, idade, peso e humor atual. Toque abre o dashboard completo do pet.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Cartão Tutor</b>', STYLES['Jade']),
    Paragraph('Seu perfil + localização + data de cadastro + Proof of Love (gamificação de cuidado).', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Aldeia Solidária</b>', STYLES['Jade']),
    Paragraph('Acesso à rede hiperlocal de tutores, parceiros e guardiões (módulo pós-MVP).', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Nav inferior</b>', STYLES['Jade']),
    Paragraph('Diary, Panel, Agenda e AI — atalhos permanentes pros módulos principais.', STYLES['Body']),
]
t = Table([[img_flow, explain_flow]], colWidths=[w_img + 8*mm, None])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0)]))
story.append(t)
story.append(Spacer(1, 8))

story += [PageBreak()]

# ═══════════════════════════ §3 O QUE A IA LÊ ═══════════════════════════
story += h1('O que o auExpert entende')
story += p('A IA proprietária foi treinada para reconhecer os documentos mais comuns do universo pet brasileiro.')

story += h3('Carteirinha de vacinação — a estrela do onboarding')
story += p('Uma única foto da carteirinha alimenta metade da ficha completa:')
story += bullets([
    'Nome, espécie, raça, sexo, data de nascimento e pelagem',
    'Seus dados como tutor',
    'Cada vacina aplicada, com fabricante, lote, data e validade',
    'Veterinário responsável e CRMV',
    'Próximas doses a aplicar',
    'Castração (data e clínica)',
    'Vermifugações',
])
story += callout('Sabe aqueles apps em que você passa 20 minutos preenchendo formulário?<br/>'
                 '<b>No auExpert, você termina em 30 segundos.</b>')

story += h3('Outros documentos suportados')
story += feature_table(
    ['Leitura instantânea', 'Leitura + sua revisão', 'Outras tecnologias'],
    [
        ['Carteirinha de vacinação', 'Receita manuscrita',   'QR tags externas'],
        ['Certificado de microchip', 'Atestado de saúde',    'Código de barras'],
        ['Apólice de seguro',        'Prontuário de clínica','GPS / smart home'],
        ['Exames laboratoriais',     'Laudo de raio-X',      ''],
        ['Embalagem de ração',       'Fatura / nota fiscal', ''],
        ['Receita impressa',         '',                     ''],
        ['Passaporte internacional', '',                     ''],
        ['Recibo de dispositivo',    '',                     ''],
    ]
)
story += p('<b>Traduzindo:</b> pra coisa nenhuma o app pede que você digite um formulário gigante.', 'BodySec')
story += [PageBreak()]

# ═══════════════════════════ §4 CADASTRO COM FOTO + MOCKUP ═══════════════════════════
story += h1('Cadastro com IA: tire uma foto, o resto é automático')
story += p('Quando você adiciona um pet novo, o auExpert pede só duas coisas: nome e foto. '
           'A IA então identifica raça, porte, idade, cor do pelo, humor pela expressão — tudo com % de confiança. '
           'Você confirma ou ajusta em segundos. Zero formulário.')

img_path = os.path.join(MOCKUPS, '02-analyzing.png')
w_img = 70*mm
img_flow = RLImage(img_path, width=w_img, height=w_img * (1688/780))
explain = [
    Paragraph('<b>1. Foto + mic</b>', STYLES['Jade']),
    Paragraph('Câmera direta ou galeria. O tutor pode ditar observações no microfone enquanto tira a foto.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>2. Análise em ~30s</b>', STYLES['Jade']),
    Paragraph('Claude Opus 4.7 com prompt caching. Identifica raça (com % confiança), estima idade, '
              'porte (pequeno/médio/grande), peso, cor do pelo, e avalia o humor pela expressão corporal.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>3. Confere e salva</b>', STYLES['Jade']),
    Paragraph('Você edita qualquer campo se quiser. Os valores vêm marcados com badge ametista "sugerido pela IA".',
              STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Tipo sanguíneo</b>', STYLES['Jade']),
    Paragraph('Campo novo: DEA 1.1+/1.1-/1.2/3/4/5/7 (cão) ou A/B/AB (gato). Pode deixar pra depois.',
              STYLES['Body']),
]
t = Table([[img_flow, explain]], colWidths=[w_img + 8*mm, None])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0)]))
story.append(t)
story.append(Spacer(1, 12))
story += [PageBreak()]

# ═══════════════════════════ §5 OCR DOCUMENTOS + MOCKUP ═══════════════════════════
story += h1('OCR de documentos: leitura veterinária-grade')
story += p('Quando você fotografa uma carteirinha, receita ou exame, o auExpert aplica um pipeline específico '
           'que entende a linguagem do veterinário brasileiro. Não é OCR genérico — é IA treinada para reconhecer '
           'os padrões do CRMV, os modelos de carteirinha usados nas clínicas daqui, as apólices de seguros nacionais '
           'e as embalagens de produtos veterinários do nosso mercado.')

img_path = os.path.join(MOCKUPS, '05-ocr.png')
w_img = 70*mm
img_flow = RLImage(img_path, width=w_img, height=w_img * (1688/780))
explain = [
    Paragraph('<b>Extração estruturada</b>', STYLES['Jade']),
    Paragraph('Nome da vacina, data de aplicação, dose (primeira/reforço/anual), número do lote, veterinário '
              'responsável — tudo reconhecido em campos separados.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Confiança visível</b>', STYLES['Jade']),
    Paragraph('Cada item vem com uma porcentagem de confiança. Se a IA não tem certeza, ela <b>pede revisão</b> '
              'em vez de salvar dado duvidoso.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>IA honesta</b>', STYLES['Jade']),
    Paragraph('Receita em letra de médico? A IA tenta, mas sempre pede confirmação — nunca salva '
              'dose ou medicamento sem você aprovar.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Lembretes automáticos</b>', STYLES['Jade']),
    Paragraph('Ao salvar a vacina, o app já cria alertas pra próxima dose — 30 dias e 7 dias antes do vencimento.', STYLES['Body']),
]
t = Table([[img_flow, explain]], colWidths=[w_img + 8*mm, None])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0)]))
story.append(t)
story.append(Spacer(1, 12))

story += h2('E o que a IA NÃO tenta adivinhar')
story += p('Esse é um detalhe importante. O auExpert é <b>honesto</b> sobre o que consegue fazer:', 'BodySec')
story += bullets([
    '<b>Coleira com gravação personalizada?</b> A câmera lê, mas é pouca informação. Melhor cadastrar direto.',
    '<b>Receita em letra de médico?</b> A IA tenta, mas <b>sempre pede sua confirmação</b>. Nunca salva dados duvidosos.',
    '<b>QR Code de tag externa?</b> É leitura de QR, não OCR — e o dado fica no servidor do provedor, não no QR.',
    '<b>Dispositivo eletrônico em si?</b> Use o código de barras da caixa, não uma foto do aparelho.',
])
story += [PageBreak()]

# ═══════════════════════════ §6 DIÁRIO COM NARRAÇÃO IA + MOCKUP ═══════════════════════════
story += h1('Diário inteligente — a história viva do seu pet')
story += p('O auExpert é também um diário de vida. Você registra cada momento com foto, vídeo, áudio ou texto — '
           'e a IA transforma em uma narrativa contínua na voz do próprio pet.')

img_path = os.path.join(MOCKUPS, '03-diary.png')
w_img = 70*mm
img_flow = RLImage(img_path, width=w_img, height=w_img * (1688/780))
explain = [
    Paragraph('<b>Entrada multimodal</b>', STYLES['Jade']),
    Paragraph('Toque no microfone e fale o que aconteceu. Ou tire uma foto. Ou grave um áudio do latido. '
              'Ou anexe um documento. O app entende cada tipo.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Narração em 3ª pessoa</b>', STYLES['Jade']),
    Paragraph('A IA traduz o que você disse em narrativa literária sobre o pet — sempre na 3ª pessoa, '
              'respeitando o gênero (o/a Cacau), o humor e o histórico.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Mood tracking automático</b>', STYLES['Jade']),
    Paragraph('A IA infere o humor do dia (Feliz, Calmo, Cansado, Ansioso, Triste, Alerta, etc) '
              'pelo contexto do que você escreveu.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Lentes e tags</b>', STYLES['Jade']),
    Paragraph('Cada entrada é automaticamente classificada em lentes (Saúde, Alimentação, Comportamento, '
              'Treino, etc) pra ver tendências ao longo do tempo.', STYLES['Body']),
]
t = Table([[img_flow, explain]], colWidths=[w_img + 8*mm, None])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0)]))
story.append(t)
story.append(Spacer(1, 12))

story += h2('O que você pode registrar')
story += bullets([
    'Humor do dia (inferido pela IA ou seleção manual)',
    'Refeições e mudanças de dieta',
    'Cocô e xixi (detalhe importante que seu vet ama)',
    'Brincadeiras, treinos e exercícios',
    'Sintomas e observações de comportamento',
    'Consultas, vacinas, exames (criam registro no prontuário automaticamente)',
    'Momentos especiais e fotos memoráveis',
])
story += p('Tudo com análise inteligente. O app entende o que você escreveu, identifica padrões, '
           'e cria a <b>história viva</b> do seu pet.')
story += [PageBreak()]

# ═══════════════════════════ §7 SAÚDE VET-GRADE + MOCKUP ═══════════════════════════
story += h1('Saúde vet-grade — muito além de registros')
story += p('O auExpert não guarda dados — ele <b>entende</b> os dados. A diferença fica clara no prontuário.')

img_path = os.path.join(MOCKUPS, '04-health.png')
w_img = 70*mm
img_flow = RLImage(img_path, width=w_img, height=w_img * (1688/780))
explain = [
    Paragraph('<b>BCS (Body Condition Score)</b>', STYLES['Jade']),
    Paragraph('Escala clínica WSAVA 1-9. Cada foto análise calcula o BCS. 1-3 abaixo do peso, '
              '4-6 ideal, 7-9 sobrepeso. Acompanha ao longo do tempo.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Sinais vitais</b>', STYLES['Jade']),
    Paragraph('Peso, temperatura, FC (freq. cardíaca). Com gráficos de tendência que o veterinário '
              'ama ver em consultas.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Tipo sanguíneo</b>', STYLES['Jade']),
    Paragraph('DEA 1.1+/−, 1.2, 3, 4, 5, 7 (cão) ou A/B/AB (gato). Crítico pra transfusões em emergência.',
              STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Linha do tempo de saúde</b>', STYLES['Jade']),
    Paragraph('Exames viram gráficos de hemograma, bioquímica, alteração de creatinina ao longo dos meses. '
              'Tendências que só se percebem com histórico.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Predisposições por raça</b>', STYLES['Jade']),
    Paragraph('Cacau é Shih Tzu de 10 anos? O app já sabe que a raça tem predisposição a problemas oculares '
              'e cardíacos — e sugere exames preventivos na idade certa.', STYLES['Body']),
]
t = Table([[img_flow, explain]], colWidths=[w_img + 8*mm, None])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0)]))
story.append(t)
story.append(Spacer(1, 12))

story += h2('Validações que evitam erros')
story += bullets([
    '<b>Informou "tipo B" para um cachorro?</b> O app pergunta, porque esse tipo não existe em cães (é sistema felino).',
    '<b>Gata sua gata tipo B vai acasalar?</b> O app alerta sobre risco de isoeritrólise neonatal, algo que mesmo alguns tutores experientes desconhecem.',
    '<b>Peso do pet fora da tendência?</b> O app mostra e sugere atenção.',
])
story += p('<b>Essa é a diferença entre guardar dados e <i>cuidar</i> dos dados.</b>', 'Body')
story += [PageBreak()]

# ═══════════════════════════ §8 MODO EMERGÊNCIA + MOCKUP ═══════════════════════════
story += h1('Modo Emergência — SOS Proxy')
story += p('Um toque na tela e o auExpert mostra tudo que salva vida: tipo sanguíneo, alergias, doenças crônicas, '
           'medicações em uso, contato do veterinário de confiança, microchip. Pronto pra mostrar no pronto-socorro '
           'ou compartilhar com quem achou seu pet.')

img_path = os.path.join(MOCKUPS, '06-emergency.png')
w_img = 70*mm
img_flow = RLImage(img_path, width=w_img, height=w_img * (1688/780))
explain = [
    Paragraph('<b>Um toque = tela completa</b>', STYLES['Jade']),
    Paragraph('Atalho no hub, widget na tela de bloqueio, NFC opcional. 3 segundos da tela pro veterinário.',
              STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Compartilhável sem app</b>', STYLES['Jade']),
    Paragraph('QR Code com link público (temporário, revogável) pra quem não tem o app. '
              'Útil quando alguém acha seu pet na rua.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>SOS Proxy automático</b>', STYLES['Jade']),
    Paragraph('Em emergência médica, o app libera os dados clínicos pra veterinário de plantão autorizado. '
              'Sem burocracia.', STYLES['Body']),
    Spacer(1, 6),
    Paragraph('<b>Contatos de emergência</b>', STYLES['Jade']),
    Paragraph('Você, co-tutor, familiar próximo, vet de confiança, abrigo preferido. Botão "ligar" direto.',
              STYLES['Body']),
]
t = Table([[img_flow, explain]], colWidths=[w_img + 8*mm, None])
t.setStyle(TableStyle([('VALIGN',(0,0),(-1,-1),'TOP'), ('LEFTPADDING',(0,0),(-1,-1),0), ('RIGHTPADDING',(0,0),(-1,-1),0)]))
story.append(t)
story.append(Spacer(1, 12))
story += [PageBreak()]

# ═══════════════════════════ §9 IDENTIFICAÇÃO COMPLETA ═══════════════════════════
story += h1('Identificação completa — muito além do microchip')
story += p('O microchip é só um número. Sozinho, ele <b>não salva seu pet</b>. O que salva é ter todos os dados '
           'certos, nos lugares certos, quando você precisar.')
story += feature_table(
    ['O QUE', 'COMO', 'PRA QUÊ'],
    [
        ['Microchip',              'Leitura instantânea por código de barras', 'Identificação oficial, exigida em viagens'],
        ['QR Code Pet',            'Gerado pelo app, imprime e cola na coleira', 'Quem achou escaneia e liga na hora'],
        ['Plaquinha',              'Cadastro rápido com foto',                  'Backup simples pra identificação visual'],
        ['Contatos de emergência', 'Você + cuidadores (co-tutor, vizinho, parente)', 'Mais de uma pessoa pode ser acionada'],
        ['Registros externos',     'PetLink, SIRAA, RG Pet, sistemas municipais', 'Seu pet aparece em todos os bancos de busca'],
    ]
)
story += p('Quando o sistema nacional do governo federal for lançado (Lei 15.046), o auExpert já vai estar pronto '
           'pra integrar automaticamente.', 'BodySec')

# ═══════════════════════════ §10 INTELIGÊNCIA QUE PROTEGE ═══════════════════════════
story += h1('Inteligência que protege')
story += p('O app não só <b>guarda</b> — ele <b>entende</b> o que está lendo e te avisa:')
story += bullets([
    '<b>"A vacina antirrábica do Pico vence em 30 dias"</b>',
    '<b>"A ração que você dá mudou de linha — confira a nova composição"</b>',
    '<b>"O Mana passou de filhote pra adulto. Hora de revisar a alimentação"</b>',
    '<b>"Seu seguro pet vence em 15 dias, quer renovar?"</b>',
    '<b>"O Cacau andou 40% menos essa semana e pulou refeições 3 dias seguidos. Isso pode ser sinal de algo. Vale uma visita ao veterinário."</b>',
])
story += p('Nenhum app de GPS ou comedouro faz isso hoje. Porque eles veem só uma parte. O auExpert vê o pet inteiro.',
           'BodySec')
story += [PageBreak()]

# ═══════════════════════════ §11 HUB DE DISPOSITIVOS ═══════════════════════════
story += h1('Um hub pra todos os dispositivos do seu pet')
story += p('Tem coleira com GPS? Comedouro inteligente? Portinha com leitor de microchip? Câmera pet? '
           'O auExpert organiza tudo num lugar só. Em vez de abrir 5 apps diferentes, você tem uma visão completa.')
story += h3('Dispositivos integrados')
story += bullets([
    '<b>Rastreadores GPS</b> — Tractive, Invoxa, AirTag',
    '<b>Monitores de atividade</b> — FitBark, Whistle, PetPace',
    '<b>Portinhas e comedouros smart</b> — SureFlap, SureFeed',
    '<b>Câmeras pet</b> — Petcube, Furbo',
    '<b>Coleiras e acessórios</b> — antipulgas, LED, identificação',
])
story += p('<b>E aqui mora a mágica: tudo conversa entre si.</b> O Mana andou 40% menos essa semana '
           '(dado do FitBark) <i>e</i> pulou refeições 3 dias seguidos (dado do comedouro SureFeed)? '
           'O auExpert cruza os dados e te avisa.')

# ═══════════════════════════ §12 ALDEIA SOLIDÁRIA ═══════════════════════════
story += h1('Aldeia Solidária — rede hiperlocal')
story.append(Paragraph('<b>(módulo pós-MVP — 22 tabelas, 13 telas especificadas)</b>', STYLES['BodySec']))
story += p('Uma micro-rede de proteção hiperlocal onde tutores, pets, parceiros e a IA colaboram. Três modos:')
story += h3('Modo Escudo (passivo)')
story += p('Você faz parte da Aldeia do seu bairro automaticamente. Recebe alertas: pet perdido aqui perto, '
           'surto epidemiológico detectado, alerta de envenenamento reportado.')
story += h3('Modo Círculo (ativo)')
story += p('SOS comunitário: "meu pet fugiu agora, alguém por perto consegue ajudar?". Favores solicitados: '
           '"posso deixar o Mel com vocês na viagem?". Sistema de Pet-Credits — moeda solidária de reciprocidade.')
story += h3('Modo Praça (social)')
story += p('Feed, eventos, playdates, vacinação comunitária, memorial digital de pets falecidos. '
           'Avatares IA no onboarding resolvem o cold start da rede — desde o dia 1 você tem com quem interagir.')
story += [PageBreak()]

# ═══════════════════════════ §13 DIFERENCIAL TECNOLÓGICO ═══════════════════════════
story += h1('Por que o auExpert é diferente')
story += comparison_table([
    ('Formulários pra preencher na mão',           'Uma foto e pronto'),
    ('Só guardam dados',                           'Entendem, cruzam e avisam'),
    ('Vivem isolados (1 app por função)',         'Conectam diário, dispositivos e saúde'),
    ('Genéricos pra qualquer mercado',             'Feito pra realidade brasileira'),
    ('Só em inglês ou espanhol',                    'Português, inglês, espanhol (MX e AR), português de Portugal'),
    ('OCR genérico importado',                      'IA que fala a língua do veterinário brasileiro'),
    ('Dados podem vazar sem você saber',           'Criptografia fim-a-fim, RLS no Supabase, LGPD/GDPR'),
])

story += h2('Arquitetura resiliente (infraestrutura invisível ao tutor)')
story += bullets([
    '<b>Claude Opus 4.7</b> para visão e análise de foto (o modelo mais capaz da Anthropic)',
    '<b>Claude Sonnet 4.6</b> para classificação, narração e chat',
    '<b>Gemini 3 Flash</b> para vídeo e áudio (input_types específicos)',
    '<b>Fallback automático</b> — se um modelo falhar, cai pro próximo sem o usuário notar',
    '<b>Self-healing</b> — se a API deprecar um parâmetro, o app auto-adapta sem deploy',
    '<b>Canary rollout</b> — troca de modelo gradual (1% → 5% → 25% → 100%), rollback em 30s',
    '<b>Pre-flight validation</b> — modelo novo é testado antes de chegar pros usuários',
    '<b>Offline-first</b> — o app funciona sem internet, sincroniza depois',
])

# ═══════════════════════════ §14 PRA QUEM É ═══════════════════════════
story += h1('Pra quem é o auExpert')
story += bullets([
    '<b>Tutores que amam o pet como família</b> e querem fazer o melhor',
    '<b>Famílias com mais de um pet</b> (diferentes dietas, idades, necessidades)',
    '<b>Quem viaja com o pet</b> (documentação sempre em ordem pra passaporte CIVZ)',
    '<b>Pets idosos</b> com tratamento complexo e múltiplos medicamentos',
    '<b>Pets jovens</b> onde o tutor quer fazer certo desde o começo',
    '<b>Múltiplos cuidadores</b> — co-tutor, família, cuidador profissional (todos com acesso sincronizado)',
    '<b>Veterinários e petshops parceiros</b> — acesso limitado via convite, pra ver prontuário completo em consulta',
])
story += [PageBreak()]

# ═══════════════════════════ §15 CALL TO ACTION ═══════════════════════════
story += h1('Em poucas palavras')
story += callout('O auExpert transforma uma pilha de papéis, apps e lembretes perdidos em um assistente '
                 'inteligente que conhece seu pet, entende o contexto e te ajuda a cuidar dele todos os dias.<br/><br/>'
                 '<b>Uma foto é tudo que você precisa pra começar.</b>')

story += h1('Pronto pra cuidar do seu pet com a inteligência que ele merece?')
story += p('<b>Baixe o auExpert e comece com uma única foto.</b>')
story += p('<font color="#A89FB5">auExpert</font> — desenvolvido por Multiverso Digital · feito no Brasil · pensado para pets brasileiros', 'Body')

story += [Spacer(1, 20*mm)]
story += [HRFlowable(width='100%', color=BORDER, thickness=0.5)]
story += [Spacer(1, 8)]
story += p('<font face="Mono" size="9" color="#6B6478">AUEXPERT  ·  MULTIVERSO DIGITAL        |        AUEXPERT.COM.BR</font>')

# ── Build doc ────────────────────────────────────────────────────────────
frame_cover = Frame(MARGIN_L, MARGIN_B, PAGE_W - MARGIN_L - MARGIN_R,
                    PAGE_H - MARGIN_T - MARGIN_B, showBoundary=0,
                    leftPadding=8*mm, rightPadding=8*mm, topPadding=8*mm, bottomPadding=8*mm)
frame_content = Frame(MARGIN_L, MARGIN_B, PAGE_W - MARGIN_L - MARGIN_R,
                      PAGE_H - MARGIN_T - MARGIN_B, showBoundary=0,
                      leftPadding=0, rightPadding=0, topPadding=0, bottomPadding=0)

doc = BaseDocTemplate(
    OUT_PDF,
    pagesize=A4,
    title='auExpert — Relatório Completo',
    author='Multiverso Digital',
    subject='Relatório de marketing do auExpert — todas as funções + mockups',
    creator='Multiverso Digital',
)
doc.addPageTemplates([
    PageTemplate(id='cover',   frames=[frame_cover],   onPage=paint_cover_bg),
    PageTemplate(id='content', frames=[frame_content], onPage=paint_dark_bg),
])
doc.build(story)
size_kb = os.path.getsize(OUT_PDF) / 1024
print(f'\n✓ PDF gerado: {OUT_PDF}')
print(f'  Tamanho: {size_kb:.1f} KB')
