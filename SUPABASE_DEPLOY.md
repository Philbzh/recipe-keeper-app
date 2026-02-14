**Deploying this app to Supabase Hosting**

Overview
- This document explains how to prepare and deploy the Vite React app to Supabase Static Hosting, create the needed `kv` table, and configure environment variables.

Prerequisites
- A Supabase account and project
- Your project repository (recommended: push this repo to GitHub)
- Your Supabase project's URL and anon key (Project Settings → API)

1) Create the `kv` table
- Open the Supabase dashboard for your project → `SQL Editor` → `New query` and paste the SQL from `supabase/create_kv_table.sql` then run it.

2) Add environment variables (for local dev)
- Create a `.env` or `.env.local` at repo root with:

```
VITE_SUPABASE_URL=https://your-project-ref.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

3) Configure environment variables in Supabase Hosting (for production)
- In the Supabase dashboard → `Settings` → `Environment Variables` (or in the Site settings when configuring Hosting), add the two variables above so the frontend can access the anon key at runtime.

4) Connect your repo to Supabase Hosting
- In Supabase dashboard → `Hosting` → `New Site` → `Connect repository` (GitHub/GitLab) and select this repository.
- Set the build command: `npm run build`
- Set the publish directory: `dist`
- Add environment variables in the Site settings (same `VITE_SUPABASE_*` values).

5) Local build & test
- Install deps and run dev server:

```bash
npm install
npm run dev
```

- To test the production build locally:

```bash
npm run build
npm run preview
```

6) Optional: CI (GitHub Actions) — build on push
- You can add this minimal workflow to build on push (Supabase will run the build when it detects new commits if you connected the repo):

File: `.github/workflows/build.yml`

```yaml
name: Build
on:
  push:
    branches: [ main ]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Use Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run build
      - run: echo "Built" # artifact or deploy step optional; Supabase will build from repo when connected
```

7) Notes about auth & per-user data
- The app uses Supabase Auth for sign-up / sign-in. When signed in, data is stored under keys prefixed with `user:{userId}:<key>` in the `kv` table so each user has isolated data.
- The anon key is intentionally public in the frontend; it only allows client operations permitted by your Supabase RLS / policies. If you plan to expose writable DB tables, configure Row-Level Security and policies in Supabase accordingly.

8) Troubleshooting
- If you get a blank app after deployment, verify the Site's environment variables are set (Supabase doesn't inherit your local `.env`).
- Check build logs in Supabase Hosting for errors (dependency issues, Node version mismatches). Adjust Node version in `package.json` engines or in the build settings.
- If auth calls fail, ensure the `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are correct and not reversed.

Further help
- If you'd like, I can:
  - add a sign-out / account menu UI to `src/recipe_keeper_app.tsx`,
  - create a GitHub Actions workflow that triggers an API-based deployment, or
  - run a local verification build here and report any build errors.
