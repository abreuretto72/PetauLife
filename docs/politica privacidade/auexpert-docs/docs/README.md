# auExpert — Documentos Legais (site estático multi-idioma)

Site estático que hospeda a **Política de Privacidade** e os **Termos de Uso** do aplicativo auExpert, com seletor de idioma e arquitetura preparada para adicionar novos idiomas sem tocar no HTML.

## Estrutura

```
docs/
├── index.html              Landing page com cards dos dois documentos
├── privacy.html            Política de Privacidade
├── terms.html              Termos de Uso
├── assets/
│   ├── style.css           Estilo único compartilhado (tema escuro, laranja auExpert)
│   ├── languages.js        Configuração central dos idiomas suportados
│   └── i18n.js             Motor de i18n (detecção, carregamento, aplicação no DOM)
└── locales/
    ├── pt-BR.json          Tradução em português do Brasil
    ├── pt-PT.json          Tradução em português de Portugal
    ├── en-US.json          Tradução em inglês dos EUA
    ├── es-MX.json          Tradução em espanhol do México (tuteo)
    └── es-AR.json          Tradução em espanhol da Argentina (voseo)
```

Todos os idiomas estão com **paridade perfeita de 370 chaves** — nenhum idioma tem texto faltando ou sobrando em relação aos outros. Isso é validado via script em CI se você quiser automatizar.

## Como funciona

- **Conteúdo zero no HTML**: o HTML só tem a estrutura. Todo texto (títulos, parágrafos, listas) vem dos arquivos JSON em `locales/`.
- **Detecção automática de idioma**: o site detecta `navigator.language` na primeira visita e aplica o idioma correspondente se existir; caso contrário, cai para `pt-BR`.
- **Preferência persistida**: a escolha do usuário é salva em `localStorage` com a chave `auexpert-docs-lang` e respeitada nas próximas visitas.
- **Seletor no header**: dropdown com bandeira + nome do idioma nativo. Visível em todas as páginas.
- **Sumário lateral dinâmico**: gerado a partir do JSON. Destaque automático da seção visível durante scroll.
- **Responsivo**: sumário vira accordion no topo em telas pequenas (<900px).

## Como adicionar um novo idioma

Já vêm configurados 5 idiomas: **pt-BR**, **pt-PT**, **en-US**, **es-MX**, **es-AR**. Para adicionar um **6º idioma** (ex: francês `fr-FR`):

**1.** Copie `locales/pt-BR.json` → `locales/fr-FR.json` e traduza todos os valores (as chaves ficam iguais).

**2.** Abra `assets/languages.js` e adicione a entrada na lista existente:

```js
const SUPPORTED_LANGUAGES = [
  { code: 'pt-BR', label: 'Português (Brasil)',    flag: '🇧🇷', dir: 'ltr' },
  { code: 'pt-PT', label: 'Português (Portugal)',  flag: '🇵🇹', dir: 'ltr' },
  { code: 'en-US', label: 'English (US)',          flag: '🇺🇸', dir: 'ltr' },
  { code: 'es-MX', label: 'Español (México)',      flag: '🇲🇽', dir: 'ltr' },
  { code: 'es-AR', label: 'Español (Argentina)',   flag: '🇦🇷', dir: 'ltr' },
  { code: 'fr-FR', label: 'Français (France)',     flag: '🇫🇷', dir: 'ltr' }, // ← nova linha
];
```

**3.** Pronto. O idioma aparece automaticamente no seletor, em todas as páginas. Nenhuma mudança de HTML ou CSS necessária.

Para idiomas RTL (árabe, hebraico), defina `dir: 'rtl'` — o motor aplica `<html dir="rtl">` automaticamente.

### Validar paridade de chaves

Antes de publicar um idioma novo, rode este script Python pra garantir que não falta ou sobra nenhuma chave em relação ao idioma base:

```bash
cd docs && python3 -c "
import json, os
def flatten(o, p=''):
    r = set()
    if isinstance(o, dict):
        for k, v in o.items(): r |= flatten(v, f'{p}.{k}' if p else k)
    elif isinstance(o, list):
        for i, v in enumerate(o): r |= flatten(v, f'{p}[{i}]')
    else: r.add(p)
    return r
base = flatten(json.load(open('locales/pt-BR.json')))
for f in sorted(os.listdir('locales')):
    k = flatten(json.load(open(f'locales/{f}')))
    faltam = base - k
    extras = k - base
    print(f, '✅' if not faltam and not extras else f'❌ faltam {len(faltam)}, extras {len(extras)}')
"
```

## Como publicar no GitHub Pages

**Opção 1 — pasta `/docs` na branch `main` (recomendado para este caso):**

1. Copie toda a pasta `docs/` para a raiz do seu repositório do auExpert.
2. Vá em **Settings → Pages** no GitHub.
3. Em **Source**, selecione:
   - Branch: `main`
   - Folder: `/docs`
4. Clique em **Save**.
5. Aguarde ~1 minuto. A URL será `https://<seu-usuario>.github.io/<seu-repo>/`.

**Opção 2 — repositório dedicado `<usuario>.github.io`:**

Se quiser domínio raiz (sem prefixo de repositório), crie um repo chamado `<seu-usuario>.github.io` e copie o conteúdo da pasta `docs/` para a **raiz** do repositório (não dentro de `/docs`).

## Domínio customizado (opcional)

Se quiser um domínio próprio tipo `legal.auexpert.com.br`:

1. Crie um arquivo `docs/CNAME` com o conteúdo `legal.auexpert.com.br`.
2. No DNS do seu domínio, adicione um registro CNAME apontando para `<seu-usuario>.github.io`.
3. Em **Settings → Pages**, configure o custom domain e ative **Enforce HTTPS**.

## Testar localmente

Como o motor de i18n usa `fetch()` para carregar os JSONs, **abrir o HTML direto com duplo clique não funciona** (o navegador bloqueia fetch de `file://`). Use um servidor local simples:

```bash
# Com Python 3
cd docs
python3 -m http.server 8000

# Ou com Node
npx serve docs
```

Acesse `http://localhost:8000`.

## Manutenção do conteúdo

Quando precisar atualizar um documento (nova versão da política, novo texto, etc.):

1. Edite o JSON do idioma correspondente em `locales/`.
2. Atualize `meta.version` e `meta.effectiveDate` no topo do JSON.
3. Atualize também `privacy.meta` / `terms.meta` para refletir a nova data.
4. Commit e push. O GitHub Pages atualiza sozinho em ~1 minuto.

## Limitações conhecidas

- Precisa de servidor HTTP estático para rodar (qualquer um serve — GitHub Pages, Netlify, Vercel, Cloudflare Pages).
- JavaScript é necessário (site não funciona com JS desabilitado). Para audiência jurídica crítica, considerar pré-renderização estática em build step futuro.
- Strings com formatação interna complexa (links, ênfases) requerem a sintaxe `data-i18n="html:chave"` para renderizar HTML em vez de texto puro — já usado em `home.heroTitle`.
