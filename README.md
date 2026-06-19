# Assimilação Tracking

Painel web para controle de pontos de conflito do Assimilação RPG.

O sistema não rola dados e não substitui a mesa de jogo. Ele apenas registra:

- pontos gerados por jogadores, narrador e ameaças;
- pontos alocados em objetivos e ativações;
- saldo restante por rolagem;
- progresso e quanto falta em cada destino.

## Estrutura

```txt
app/
  api/assimilacao/route.ts   Proxy entre Vercel e Apps Script
  page.tsx                   Painel principal
components/
  Dashboard.tsx              Interface do tracking
lib/
  api.ts                     Funções de comunicação com a API
```

## Variáveis de ambiente

Crie `.env.local` no desenvolvimento local:

```env
APPS_SCRIPT_URL=https://script.google.com/macros/s/SEU_DEPLOY_ID/exec
APPS_SCRIPT_TOKEN=
```

Na Vercel, cadastre as mesmas variáveis em:

Project Settings → Environment Variables

## Rodar local

```bash
npm install
npm run dev
```

## Deploy

1. Suba este projeto para o GitHub.
2. Importe o repositório na Vercel.
3. Configure `APPS_SCRIPT_URL` e `APPS_SCRIPT_TOKEN`.
4. Faça o deploy.
