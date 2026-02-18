# Claude Code instructions for the `demos` repo

## What this repo is

A collection of small, self-contained demo apps. Every folder under
`demos/demo-*` is an independent app that is automatically deployed to its own
Vercel project whenever changes are pushed to `main`.

## Repo structure

```
demos/
  demo-1-template/   ← minimal Next.js 14 starter (already deployed)
  demo-2-*/          ← future demos go here
.github/
  workflows/
    deploy-demos.yml ← the CI/CD pipeline
README.md
CLAUDE.md            ← this file
```

## How deployment works

1. A push to `main` that touches anything under `demos/**` triggers
   `.github/workflows/deploy-demos.yml`.
2. The workflow detects which `demo-*` folders changed (or re-deploys all of
   them on a manual trigger or first push).
3. For each changed demo it runs `vercel deploy --prod --yes` from inside that
   folder. The Vercel CLI auto-creates the project if it doesn't exist yet,
   named after the folder (e.g. `demo-2-recipes`).
4. The live URL is printed in the GitHub Actions log as a notice annotation.

## Required GitHub secret

| Secret | Where to get it |
|---|---|
| `VERCEL_TOKEN` | Vercel → Account Settings → Tokens |

Do **not** add a `VERCEL_ORG_ID` secret — this repo deploys to a personal
Vercel account and the `--scope` flag is not valid there.

Do **not** connect the Vercel project to GitHub through Vercel's UI — deployment
is handled entirely by GitHub Actions to avoid double-deploys.

## Adding a new demo

1. Create a new folder: `demos/demo-N-<name>/` (e.g. `demos/demo-2-recipes/`).
2. Build the app inside that folder. Any framework that Vercel supports works
   (Next.js, Vite, plain HTML, etc.).
3. Commit and push to `main`. The Action will detect the new folder and deploy
   it automatically. The live URL appears in the Actions log.

## Conventions

- Each demo is fully self-contained — its own `package.json`, no shared deps.
- Demo folder names follow the pattern `demo-N-<short-description>` (kebab-case).
- Pushing directly to `main` is fine for small changes. For larger work, open a
  PR from a feature branch so the deploy only happens after merge.
- Never push to main from a `claude/` branch directly — open a PR instead.
