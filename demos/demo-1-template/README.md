# demo-1-template

Minimal Next.js 14 starter (App Router). Use this as a base for new demos.

## Local dev

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Structure

```
app/
  layout.js   – root HTML shell + metadata
  page.js     – home page (replace with your content)
  globals.css – global styles
```

## Deploying

Pushing changes under `demos/demo-1-template/` to `main` automatically
triggers the GitHub Action, which deploys this folder as its own Vercel project.
