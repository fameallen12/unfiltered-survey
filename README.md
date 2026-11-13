# UNFILTERED Community Survey

Standalone Next.js (App Router) + TypeScript + Tailwind + Supabase survey. Not connected to the UNFILTERED marketplace.

## Structure
```
app/ layout.tsx · page.tsx · globals.css · api/submit/route.ts
components/Survey.tsx      multi-step UI
lib/questions.ts           question config + validation (shared client/server)
lib/rateLimit.ts           basic in-memory rate limiter
supabase/migration.sql     table + RLS
.env.example
```

## Supabase setup
1. Create a project at supabase.com.
2. SQL Editor → paste and run `supabase/migration.sql`. RLS is enabled with no policies, so anonymous users cannot read or write directly.
3. Project Settings → API: copy the Project URL and the `service_role` key.

## Local development
```bash
npm install
cp .env.example .env.local   # fill in the two values
npm run dev                  # http://localhost:3000
npm run build                # production check
```

## Vercel deployment
1. Push this folder to its own Git repository.
2. Import it in Vercel (framework auto-detected as Next.js).
3. Add environment variables: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` (server-only; do not prefix with `NEXT_PUBLIC_`).
4. Deploy. Read responses in Supabase → Table Editor.

## Security notes
- Server validates every answer against the allowed options; honeypot field; 5 submissions per IP per 10 min (best-effort on serverless; use Upstash/Vercel KV for strict limits); a unique per-session `client_token` blocks duplicates.
- No names, emails or IPs are stored.
