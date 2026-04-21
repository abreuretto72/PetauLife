---
name: i18n-auexpert
description: |
  Use when: adding text, creating component with visible text, translating,
  i18n, localization, adding translation key, pt-BR, en-US, missing translation,
  t() function, useTranslation, hardcoded string, toast message, Alert text,
  placeholder, title, label, button text, error message, any visible UI text.
  Trigger with: i18n, t(), useTranslation, translation, pt-BR, en-US,
  hardcoded, string, text, label, placeholder, toast, error message.
---

# i18n — auExpert (PT-BR + EN-US)

## Idiomas ativos no MVP
- `pt-BR` — Português Brasil (default, principal)
- `en-US` — English (segundo idioma)

Arquivos: `i18n/pt-BR.json` e `i18n/en-US.json` (~1400 chaves cada)

---

## ⛔ REGRA ABSOLUTA — Nunca hardcode texto visível

```typescript
// ❌ PROIBIDO — viola regra fundamental do projeto:
<Text>Diário do Rex</Text>
<Text>Nenhuma ocorrência nesta categoria</Text>
placeholder="O que aconteceu hoje?"
toast('Salvo com sucesso', 'success')
Alert.alert('Erro ao salvar')           // Alert.alert também é proibido

// ✅ ÚNICO JEITO CORRETO:
<Text>{t('diary.title', { name: pet.name })}</Text>
<Text>{t('diary.noResults')}</Text>
placeholder={t('diary.placeholder', { name: pet.name })}
toast(t('toast.entrySaved'), 'success')
// Alert.alert → nunca. Usar toast() ou confirm()
```

---

## Estrutura das chaves i18n

```
common.*      Salvar, Cancelar, Voltar, placeholderDate, close, confirm
auth.*        Login, cadastro, reset, biometria, validações
pets.*        Listagem, dados, espécies, vacinas, peso, idade
addPet.*      Modal adicionar pet (step 0, 1, 2)
diary.*       Entrada, narração, filtros, help modal, lentes
health.*      Prontuário, vacinas, alergias, consultas
settings.*    Configurações
toast.*       Mensagens de balão (voz do pet — empático)
errors.*      Erros técnicos → mensagens humanas
members.*     Co-tutores, convites, papéis
```

---

## Tom das mensagens — Voz do Pet

```typescript
// ✅ Tom correto — empático, na voz do pet:
t('toast.saveSuccess')    // "Guardei! 🐾" → sem emoji no código, mas no JSON sim
t('errors.noInternet')    // "Opa, caí da rede! Verifica o Wi-Fi e tenta de novo?"
t('errors.saveFailed')    // "Xi, algo deu errado. Tenta de novo?"
t('errors.noSpace')       // "Sem espaço aqui! Libera um cantinho no celular?"

// ❌ Tom técnico — nunca:
"Error 500: Internal Server Error"
"Network request failed"
"undefined is not an object"
```

---

## Como adicionar nova chave (sempre em ambos os idiomas)

```json
// i18n/pt-BR.json
{
  "diary": {
    "mediaLimitPhoto": "Fotos até {{size}}MB",
    "mediaLimitVideo": "Vídeos até {{size}}MB (máx {{duration}}s)",
    "mediaLimitAudio": "Áudios até {{size}}MB"
  }
}

// i18n/en-US.json
{
  "diary": {
    "mediaLimitPhoto": "Photos up to {{size}}MB",
    "mediaLimitVideo": "Videos up to {{size}}MB (max {{duration}}s)",
    "mediaLimitAudio": "Audio up to {{size}}MB"
  }
}
```

**Nunca adicionar em um idioma sem adicionar no outro.**

---

## Uso no código

```typescript
import { useTranslation } from 'react-i18next';

const MyComponent = () => {
  const { t } = useTranslation();

  // Chave simples:
  t('common.save')                           // "Salvar"

  // Com interpolação:
  t('diary.title', { name: pet.name })       // "Diário do Rex"
  t('diary.mediaLimitPhoto', { size: 10 })   // "Fotos até 10MB"

  // Namespace explícito (mesmo arquivo, prefixo):
  t('toast.entrySaved')                      // no toast.*

  // Em ErrorBoundary (class component, sem hooks):
  import i18n from '@/i18n';
  i18n.t('errors.unexpectedTitle')
};
```

---

## Chaves existentes dos help modais do diário

```json
// Estas chaves já existem (adicionadas anteriormente):
"diary": {
  "helpModalTitle": "...",
  "helpModalSub": "...",
  "helpPanelNote": "...",
  "helpVoice": "...",
  "helpPhoto": "...",
  "helpScanner": "...",
  "helpDocument": "...",
  "helpVideo": "...",
  "helpGallery": "...",
  "helpListen": "...",
  "helpText": "..."
}
```

---

## Chaves do sistema de co-tutores (adicionadas em 2026-04-03)

```json
// 14 chaves em members.* (PT-BR + EN-US):
"members": {
  "title": "Tutores",
  "invite": "Convidar",
  "pending": "Pendentes",
  "active": "Ativos",
  "remove": "Remover",
  "roles": {
    "co_parent": "Co-tutor",
    "caregiver": "Cuidador",
    "viewer": "Observador"
  }
  // ... outras chaves
}
```

---

## Configuração i18n

```typescript
// i18n/index.ts
import { getLocales } from 'expo-localization';

const deviceLocale = getLocales()[0]?.languageTag; // 'pt-BR' ou 'en-US'
const supportedLocales = ['pt-BR', 'en-US'];
const defaultLocale = 'pt-BR';

const lng = supportedLocales.find(l => deviceLocale?.startsWith(l.split('-')[0]))
  ?? defaultLocale;

i18n.init({
  lng,
  fallbackLng: 'pt-BR',
  resources: {
    'pt-BR': { translation: ptBR },
    'en-US': { translation: enUS },
  },
});
```

---

## Checklist ao criar/editar componente

- [ ] Nenhum texto visível hardcoded
- [ ] Chave adicionada em `pt-BR.json` E `en-US.json`
- [ ] Toast usa `t()`, nunca string literal
- [ ] Alert.alert() substituído por `toast()` ou `confirm()`
- [ ] Placeholders e títulos de inputs via `t()`
- [ ] Mensagens de erro via `t('errors.*')` (humanas, voz do pet)
