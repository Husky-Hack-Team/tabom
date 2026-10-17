# Vercel + Supabase deployment test

This isolated mini-site checks all three parts of the deployment:

1. Vercel serves `index.html`, `styles.css`, and `app.js`.
2. The frontend calls the Vercel Function at `/api/health`.
3. `/api/supabase-check` inserts, reads, and deletes one temporary Supabase row.

The Supabase secret is used only inside the server-side function. It is never sent to the browser.

## 1. Prepare Supabase

Open the Supabase SQL Editor for the test project and run [`supabase/setup.sql`](supabase/setup.sql).

The script enables Row Level Security, gives `anon` and `authenticated` no table access,
and grants only `service_role` the operations required by the test.

## 2. Create the Vercel project

Import this repository into Vercel and set **Root Directory** to:

```text
deployment-test
```

No build command, output directory, or dependency installation is needed.

## 3. Add Vercel environment variables

In **Project Settings → Environment Variables**, add:

```text
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SECRET_KEY=sb_secret_your_server_only_key
```

Use a new Supabase secret key from **Project Settings → API Keys**. A legacy
`SUPABASE_SERVICE_ROLE_KEY` also works, but the newer secret key is preferred.
Add the variables to Production and Preview if you want both environments tested.
Redeploy after adding or changing them.

Never prefix the secret with `NEXT_PUBLIC_`, `VITE_`, or otherwise expose it to browser code.

## 4. Verify

Open the Vercel deployment URL. The frontend card is immediately green, the backend card
checks itself, and the Supabase check runs when you press **Run database test**.

All three green cards confirm:

- static frontend delivery works;
- the Vercel Function runtime works;
- Vercel can securely reach Supabase and perform insert/read/delete operations.

## Troubleshooting

- **Backend says 404:** confirm the Vercel project's Root Directory is `deployment-test`, then redeploy.
- **Missing environment variables:** add both values in Vercel and redeploy.
- **HTTP 401:** verify that `SUPABASE_SECRET_KEY` is a secret key for the same project as `SUPABASE_URL`.
- **Permission denied / table not found:** run `supabase/setup.sql` in the correct Supabase project.
- **Works in Production but not Preview:** enable both variables for the Preview environment and redeploy the preview.

The Vercel CLI is optional. If installed, local development can be started from this folder with:

```powershell
vercel dev
```
