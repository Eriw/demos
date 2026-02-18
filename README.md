# demos

Auto-deploying Claude Code demo projects. Each folder under `demos/demo-*`
is an independent app that gets its own Vercel deployment automatically when
pushed to `main`.

## How it works

```
Push to main
  └─ GitHub Action detects changed demos/demo-* folders
       └─ For each changed demo:
            └─ vercel deploy --prod → live URL in ~2 min
```

The Action uses the Vercel CLI. Every demo folder becomes its own Vercel
project (named after the folder, e.g. `demo-2-recipes`).

## Required GitHub secrets

| Secret | Description |
|---|---|
| `VERCEL_TOKEN` | Vercel API token (Account Settings → Tokens) |
| `VERCEL_ORG_ID` | *(optional)* Team/org ID — only needed for team accounts |

## Adding a new demo

1. Open Claude Code pointing at this repo
2. Ask it to build something:
   > "Build a recipe app in `demos/demo-2-recipes`"
3. Claude creates the folder, builds the app, commits and pushes to `main`
4. GitHub Action auto-provisions a Vercel project for `demo-2-recipes`
5. Vercel deploys it → live URL appears in the Action log

## Demos

| Folder | Description | URL |
|---|---|---|
| [demo-1-template](demos/demo-1-template) | Minimal Next.js 14 starter | *(deploy to see URL)* |

## Local dev for any demo

```bash
cd demos/demo-1-template   # or whichever demo
npm install
npm run dev
```
