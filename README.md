# PetauLife+

**Uma inteligência unica para o seu pet**

App mobile AI-first para tutores de caes e gatos. Diario inteligente com narracao na voz do pet, analise de fotos por IA, prontuario de saude e notificacoes automaticas.

## Tech Stack

| Camada | Tecnologia |
|--------|-----------|
| Framework | Expo SDK 55 (React Native + TypeScript) |
| Navegacao | Expo Router |
| Estado | Zustand + React Query |
| i18n | react-i18next (PT-BR / EN-US) |
| Icones | Lucide React Native |
| Backend | Supabase (PostgreSQL + pgvector + Auth + Storage + Edge Functions) |
| IA | Claude API (Anthropic) |
| Push | Expo Notifications |

## Funcionalidades MVP

- Login/cadastro com biometria (digital + Face ID)
- Hub "Meus Pets" (caes e gatos)
- Diario inteligente com narracao IA na voz do pet
- Analise de foto por IA (raca, humor, observacoes de saude)
- RAG por pet (memoria vetorial isolada)
- Prontuario: vacinas + alergias
- Notificacoes push (lembretes de vacina, diario, insights IA)

## Filosofia AI-First

1. IA analisa primeiro, tutor confirma depois
2. Microfone (STT) sempre disponivel
3. Camera resolve mais que formularios
4. Digitacao e ultimo recurso

## Setup

```bash
# Instalar dependencias
npm install --legacy-peer-deps

# Configurar variaveis de ambiente
cp .env.local.example .env.local
# Editar .env.local com suas chaves Supabase

# Iniciar
npx expo start
```

## Estrutura

```
app/           Expo Router (auth + app screens)
components/    UI components + PetauLogo + PawIcon
constants/     Design tokens (colors, fonts, spacing, shadows, moods, breeds)
hooks/         useAuth, usePets, useNotifications
stores/        Zustand (auth, pet, ui)
lib/           Supabase client, AI, RAG, storage, notifications
i18n/          PT-BR e EN-US
types/         TypeScript interfaces (12 tabelas MVP + AI responses)
supabase/      Migrations (8), Edge Functions, seed
```

## Banco de Dados

13 tabelas | 30 RLS policies | 25 indexes | 6 functions | 10 triggers | 5 views | 2 storage buckets

## Licenca

Privado - Todos os direitos reservados.
