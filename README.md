# Real Essence Festival 2.0

The Real Essence Festival 2.0 microsite is a Next.js registration and event
landing page for Sedaap Supreme Noodles.

## Local development

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000`.

## Environment variables

Create `.env.local` with the server-side values below:

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-server-only-key
RESEND_API_KEY=your-resend-api-key
EMAIL_FROM=Real Essence Festival <hello@your-domain.com>
```

The Supabase service-role key and Resend API key must never be exposed as
`NEXT_PUBLIC_*` variables or committed to Git.

## Database

Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL editor.
It creates the registrations table and removes the retired gate check-in
objects from earlier versions of the project.

The registration endpoint stores attendee details and sends a confirmation
email when Resend is configured. Re-registering the same email returns the
existing registration instead of creating a duplicate.

## Useful commands

```bash
pnpm lint
pnpm exec tsc --noEmit
pnpm build
```

## Project structure

- `src/app/page.tsx` — landing page composition.
- `src/components/` — sections, navigation, registration form, and shared UI.
- `src/app/api/register/route.ts` — validated registration endpoint.
- `src/emails/confirmation.ts` — HTML and plain-text confirmation templates.
- `src/lib/email.ts` — server-side Resend delivery helper.
- `src/lib/supabase.ts` — server-only database client and registration type.
- `supabase/schema.sql` — database schema and cleanup migration.
- `public/brand/` and `public/photos/` — site artwork and event photography.
