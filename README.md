# Real Essence Festival 2.0 — website

Event site for **Sedaap Supreme Noodles' Real Essence Festival 2.0**
· 7–8 November 2026 · Ikeja City Mall, Lagos · free entry.

Built from the approved design (`REF 2.0 V3.pdf`). This folder is everything
needed to host it — source, assets, database schema and docs. No secrets are
included; you generate your own (see [Environment](#4-environment)).

---

## Contents

1. [What's in the box](#1-whats-in-the-box)
2. [Run it locally](#2-run-it-locally)
3. [Deploy it](#3-deploy-it)
4. [Environment](#4-environment)
5. [The page, section by section](#5-the-page-section-by-section)
6. [**Every animation and interaction**](#6-every-animation-and-interaction) ← the detailed part
7. [Brand: colour, type, devices](#7-brand-colour-type-devices)
8. [Images and the asset pipeline](#8-images-and-the-asset-pipeline)
9. [Registration, tickets and the gate scanner](#9-registration-tickets-and-the-gate-scanner)
10. [The confirmation email](#10-the-confirmation-email)
11. [Accessibility rules this code follows](#11-accessibility-rules-this-code-follows)
12. [Tests](#12-tests)
13. [Before you launch](#13-before-you-launch)
14. [Where things live](#14-where-things-live)

---

## 1. What's in the box

Three things share one Next.js app:

| Route | What it is | Needs a database? |
|---|---|---|
| `/` | The public landing page | **No** |
| `/api/*` | Registration, ticket QR, scanner endpoints | Yes |
| `/scan` | The gate scanner (staff only, `noindex`) | Yes |

**You can deploy the landing page today with no database at all.** The form
will return an honest "not connected yet" message instead of pretending to
work. Wire up Supabase when the client is ready — nothing else changes.

**Stack:** Next.js 16 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
Motion (Framer Motion) · Lenis · Supabase · Node 20+.

---

## 2. Run it locally

```bash
npm install
cp .env.example .env.local     # fine to leave it empty for the landing page
npm run dev                    # http://localhost:3000
```

```bash
npm run build                  # production build
npm start                      # serve the build
npm run lint                   # ESLint — currently zero warnings
npx tsc --noEmit               # TypeScript — currently zero errors
```

Node 20 or newer. The lockfile is committed; use `npm ci` on CI.

---

## 3. Deploy it

### Vercel (easiest — it's a Next.js app)

1. Push this folder to a Git repo.
2. Import it in Vercel. Framework preset: **Next.js**. Build command, output
   directory and install command are all auto-detected — leave them alone.
3. Add the environment variables from [§4](#4-environment).
4. Deploy, then set the custom domain.

### Anywhere else that runs Node

```bash
npm ci
npm run build
npm start          # listens on $PORT, default 3000
```

Put it behind nginx/Caddy for TLS. **HTTPS is not optional** — the gate
scanner's camera (`getUserMedia`) only works in a secure context, and over
plain HTTP it fails silently, which looks exactly like a broken app.

### Static hosting (landing page only)

If the client wants plain static files on cPanel or S3, the landing page can
be exported without the API or scanner:

```bash
STATIC_EXPORT=1 NEXT_PUBLIC_STATIC_DEMO=1 npx next build
```

`next.config.ts` switches to `output: "export"` with relative asset paths.
In this mode the form runs a **visual demo only** — it validates, shows the
success state and issues a fake ticket number, and says so on screen. Nothing
is saved. Only use this for a preview, never for real registration.

---

## 4. Environment

Copy `.env.example` → `.env.local` and fill it in. Every variable is documented
in that file; the short version:

| Variable | Purpose | Secret? |
|---|---|---|
| `SUPABASE_URL` | Supabase project URL | No |
| `SUPABASE_SERVICE_ROLE_KEY` | Full database access | **Yes — server only** |
| `TICKET_PRIVATE_KEY` | Signs tickets (Ed25519) | **Yes — server only** |
| `NEXT_PUBLIC_TICKET_PUBLIC_KEY` | Verifies tickets | No — public by design |
| `SCANNER_PIN` | What the gate team types | Yes-ish |
| `SCANNER_SESSION_SECRET` | Signs device tokens | **Yes** |

Generate the key pair with `npm run keygen` and paste both lines in.

> **Rotating `TICKET_PRIVATE_KEY` invalidates every ticket already issued.**
> Do it before registration opens, never after.

---

## 5. The page, section by section

Order is defined in [`src/app/page.tsx`](src/app/page.tsx). Colour bands are
separated by the shaped dividers described in [§6.9](#69-section-dividers).

| # | Section | Component | Band |
|---|---|---|---|
| 1 | Hero — logo, promise, **registration form** | `Hero` + `RegisterForm` | Yellow |
| 2 | Date, venue, countdown, ticker | `DateVenue` | Cream |
| 3 | What's On — six activity cards | `Activities` | Red |
| 4 | Line-up — "names dropping soon" | `Lineup` | Red |
| 5 | Brought to you by Supreme Noodles | `BroughtToYou` | Red |
| 6 | Last year's photos | `Gallery` | Red |
| 7 | Brand story — mascot and packs | `BrandStory` | Green |
| 8 | See you at Ikeja — final CTA | `FinalCta` | Cream |
| 9 | Contact and socials | `Footer` | Yellow |

Always on top: `Nav`, `CursorTrail`, `MascotBuddy`, `ScrollToTop`.

**The page has one primary action: register.** The form is in the hero, the nav
button and both CTAs point back to it. Please keep it that way.

---

## 6. Every animation and interaction

This is the part that makes the page feel like a festival rather than a flyer.
Everything below is real, shipped behaviour.

### 6.0 The rules all of it follows

- **One easing** across the whole site: `cubic-bezier(0.2, 0, 0, 1)`, exposed
  as `--ease-brand`. Springs are used where motion should feel physical.
- **Entrances** are `opacity 0→1` + `translateY 18–26px` + `blur 4px→0` over
  ~400ms, staggered ~80–100ms between siblings.
- **Presses** scale to `0.96` over 150ms.
- **Every animated state also has a static cue** — a colour, an icon or a
  label. Motion is never the only signal.
- **`prefers-reduced-motion` is honoured everywhere.** See [§6.12](#612-reduced-motion).

### 6.1 Smooth scrolling

`SmoothScroll` wraps the page in **Lenis** — momentum scrolling with a 1.05s
duration and exponential easing. In-page anchors are intercepted so they glide
rather than jump, and the target element receives focus so keyboard users land
where the scroll went.

Under reduced motion Lenis is **never initialised** — hijacking the scroll is
exactly what that preference exists to switch off.

### 6.2 Hero

- **Logo** springs in from `scale 0.72, rotate -7°` (stiffness 110, damping 13)
  and then **wobbles** continuously — a ±2.5° rock on a 4s loop, pinned at the
  bottom so it reads as a sticker pinned to the page, not a floating box.
- **Scroll parallax**, driven by `useScroll` on the hero:
  - logo drifts up `-140px` and scales to `0.86`
  - the doodle wallpaper drifts *down* `+120px` (opposite direction = depth)
  - the whole left column fades to `0.25` opacity as you leave
- **Four floating products** (two packs, a bowl, a goodie bag) each drift at a
  different depth (60–140px) and **bob** on independent 5.5–8s loops, so they
  never move in lockstep. Desktop only (`xl:`) — they'd crowd a phone.
- **Headline and body** fade up with blur, staggered 100ms apart.
- **Form card** springs up from `y 36px, rotate 1.5°`.

### 6.3 Registration form — all five states

The one place where motion carries real meaning.

| State | What happens |
|---|---|
| **Idle** | Navy label pill, white field, rounded-full border |
| **Focus** | 3px outline in brand yellow (red on yellow backgrounds) |
| **Error** | Label and border turn red; message slides down (`height 0→auto`, 150ms); focus jumps to the first bad field |
| **Submitting** | Button shows a spinner and "Saving your spot…", fields disable |
| **Success** | Form cross-fades out (150ms) → success panel fades in → 🎉 badge springs from `scale 0.25` → **confetti fires from the card's position** in brand colours → ticket stub springs in at `rotate -2°` with the scannable QR |

The success panel also **scrolls itself into view**, because it's shorter than
the form and can otherwise end up above the fold. The card has a `min-height`
so the swap doesn't shift the page.

Validation is inline and per-field: it waits until you leave a field before
complaining, then updates live as you fix it.

### 6.4 Countdown and ticker

- Live countdown to 7 Nov 2026, 09:00 WAT, in a 4-up grid of yellow tiles with
  red borders. Uses **tabular numbers** so digits don't jitter as they tick.
- Renders `––` until mounted, so the server and client agree.
- Below it, an **infinite marquee** of festival words scrolling at 38s per lap.

### 6.5 Marquees

`Marquee` duplicates its children and translates `-50%`, so the loop is
seamless at any content width. Used by the ticker, the photo walls and the
final CTA strip.

- **Pauses on hover and on keyboard focus** inside it.
- Duplicate copies are `aria-hidden` **and `inert`**, so screen readers don't
  read them twice and Tab can't land on invisible buttons.

### 6.6 Activity cards (What's On)

Six cards, each with a photo from last year.

- **3D pointer-follow tilt**: the card rotates up to ±9° on X and ±11° on Y,
  tracking the cursor through a spring (stiffness 220, damping 20), with a
  1000px perspective. Mouse only — a finger is already on the card.
- Each card sits at a slight **static tilt** (±1.4–2.4°) so the grid looks
  pinned up rather than CAD-drawn.
- **Hover lifts** it (`scale 1.03`, `z 24`) and zooms the photo to 110%.
- The **reveal panel** slides up over the photo with the activity's copy, over
  a bunting illustration.
- The emoji badge **rotates 12°** on hover.
- **The whole card is a button.** Hover, tap and keyboard focus all open the
  same reveal, and `aria-expanded` tracks it — touch and keyboard users get the
  copy, not just mouse users.

### 6.7 Line-up (TBA state)

The design showed six blank placeholder tiles — the bill genuinely isn't
announced. Rather than invent names, the tiles are an honest "to be announced":
a question mark that **rocks ±9° on a 4s loop**, each tile offset by `index ×
0.6s`, over an animated diagonal hatch that brightens on hover. Tiles lift and
rotate ±1.5° on hover. Each carries a yellow **TBA** chip.

### 6.8 "Brought to you by" — highlighter sweep

The wordmark splits: *Supreme* enters from the left at `-6°`, *Noodles* from
the right at `+6°`, both springing to a settled ±2–3°. The Supreme badge sits
over the join and **counter-rotates −40° → +40° as you scroll past**.

Beside it, the body copy's highlighter marks **sweep in left-to-right** —
`background-size` animates `0% → 100%` over 500ms, staggered at 0.2s, 0.5s and
0.75s, so the marker looks drawn by hand rather than pre-printed.

### 6.9 Section dividers

Rebuilt from the design as SVG so they scale to any width. The original PDF
ships them as 5760px rasters that can't tile.

| Divider | Between | How it's drawn |
|---|---|---|
| **Castellated** | Yellow hero → cream | SVG `<pattern>`, 68px tile |
| **Torn edge** | Cream → red | Single organic path, stretched |
| **Checkerboard** | Red → green | SVG `<pattern>`, 22px squares |

The two repeating ones use `patternUnits="userSpaceOnUse"` rather than a
stretched viewBox, so a tooth stays the same size at 390px and at 2560px.
Stretching one viewBox across the width makes the teeth absurdly wide on
desktop — that was a real bug, don't reintroduce it.

Behind every colour band sits a **tiling doodle wallpaper** (balloons, drums,
fireworks, bowls, stars) generated as an inline SVG data-URI and tinted per
section. It parallaxes against the scroll in the hero.

### 6.10 Gallery

Three bands of photos from last year's festival, scrolling at different speeds
(52s, 64s, 52s) with the middle one **running backwards**. Tiles zoom to 110%
and take a red wash on hover.

Tapping one opens a **lightbox**: backdrop fades, image springs in, arrows and
counter beneath. Closes on Escape or backdrop click, steps with ←/→, and focus
moves to the close button on open.

### 6.11 Ambient layers

- **Cursor trail** — noodles, confetti and stars spawn as you move the mouse,
  then fall under gravity, spin and fade. Spawns every ~68px of travel, capped
  at 26 particles. Mouse only, and off entirely under reduced motion.
- **Mr Supreme** — appears after 900px of scroll, springing up from below.
  He **leans toward your cursor** (up to 14°, spring-damped), **waves** when he
  speaks, and tapping him cycles five lines of dialogue. **Tap him five times
  and the page throws a confetti party** for 2.6 seconds while he shakes.
- **Scroll-to-top** — a red circle with a cream ring (so it reads on red,
  green *and* cream) wrapped in a **yellow progress ring** that fills as you
  scroll, driven by a spring so it glides rather than snaps.
- **Nav** — solid red bar; links grow a yellow underline from 0 to full width
  on hover; the mobile sheet slides down from the bar and closes on Escape,
  locking the page behind it.

### 6.12 Reduced motion

Under `prefers-reduced-motion: reduce`, **all** of this degrades gracefully:

- Lenis never initialises; scrolling is native.
- The cursor trail doesn't run at all.
- Confetti never fires.
- All CSS animations (`bob`, `wobble`, marquees) are switched off.
- Parallax transforms resolve to zero — components read the preference and
  pass `0` into their `useTransform` ranges, rather than being overridden in
  CSS afterwards.
- Entrances become plain opacity cross-fades.

This is implemented in [`src/lib/useReducedMotion.ts`](src/lib/useReducedMotion.ts)
via `useSyncExternalStore`, so it's live — a user toggling the OS setting sees
the change without reloading. It returns `true` until mounted, so the first
paint is always the still version.

**Please don't add motion that ignores this.** It's the one rule that makes the
rest defensible.

---

## 7. Brand: colour, type, devices

Tokens live in [`src/app/globals.css`](src/app/globals.css) under `@theme`.

| Token | Value | Used for |
|---|---|---|
| `--color-yellow` | `#f5d551` | Hero band |
| `--color-yellow-deep` | `#ffd701` | Footer, accents, focus rings |
| `--color-red` | `#b10008` | Main body, nav |
| `--color-green` | `#0a4e24` | Brand story, success |
| `--color-navy` | `#1b2a6b` | Form labels |
| `--color-cream` | `#fff9ec` | Text on dark, cards |
| `--color-ink` | `#1a1207` | Text on light |

### ⚠️ Fonts are substitutes

The design uses **Bringbold Nineties** (display) and **JUST Sans** (body/UI).
Neither is freely licensed, so this ships the closest open equivalents:

```
--font-display: var(--font-display), "Playfair Display", Georgia, serif;
--font-sans:    var(--font-sans-ui), "Outfit", ui-sans-serif, system-ui;
```

**To drop in the real faces:** put the `.woff2` files in `public/fonts/`, add an
`@font-face` for each in `globals.css`, and they take over with no other edits —
the licensed names are already first in both stacks.

### Signature devices

Torn-paper edges, castellated and checkerboard dividers, highlighter-marker
text (`.marker`), sticker drop-shadows (`.sticker-shadow`), the chicken mascot,
and the enamel Supreme badge.

---

## 8. Images and the asset pipeline

Everything in `public/` is already optimised and ready to ship.

| Folder | What | Size |
|---|---|---|
| `public/brand/` | Logos, packs, mascot, social icons — WebP with alpha | 1.4 MB |
| `public/photos/` | 80 photos from edition one, longest edge 1280px, WebP q80 | ~8 MB |
| `public/app-icons/` | PWA and Apple touch icons for the scanner | 280 KB |
| `public/demo-tickets/` | Sample QRs for the scanner demo | 40 KB |

The photos came from **280 raw JPEGs (909 MB)** supplied by the client,
curated to 80 and compressed to ~8 MB. The originals are **not** in this folder
— ask the client for the `Untitled Export` set if you need to reselect.

`src/data/photos.json` is the generated manifest (id, category, dimensions).
`docs/design-assets-manifest.md` lists every asset extracted from the design PDF
and where it came from.

---

## 9. Registration, tickets and the gate scanner

Full detail is in **[TICKETING.md](TICKETING.md)**. The gate team's own
one-page instructions are **[GATE-RUNBOOK.md](GATE-RUNBOOK.md)** — print it.

The short version:

```
form → /api/register → Supabase → ticket REF2-XXXX XXXX, signed with Ed25519
                                        ↓
                       confirmation email (QR + the number in large type)
                                        ↓
   /scan → staff PIN → downloads the guest list to the phone
                                        ↓
           camera → verify signature → local lookup → admit / refuse
                                        ↓
                    queued offline, synced when signal returns
```

Three things worth knowing before you touch it:

1. **Tickets can't be forged.** The private key never leaves the server; each
   phone carries only the public key, so it can verify but never issue.
2. **A ticket can't be reused.** `admit()` in
   [`supabase/schema.sql`](supabase/schema.sql) does the check-in as one
   conditional `UPDATE`, so when two gates scan the same ticket simultaneously
   exactly one wins.
3. **The scanner works with no signal.** Guest list and scan queue live in
   IndexedDB; queued scans carry a device-generated UUID so replaying them can
   never double-count.

### Database setup

Run [`supabase/schema.sql`](supabase/schema.sql) once in the Supabase SQL
editor. It creates `registrations`, `scans`, the `admit()` function, the
`gate_stats` view, and enables row-level security with **no anon policy** —
every read and write goes through this app's server using the service-role key.

### Trying the scanner without a database

```bash
npm run demo:tickets     # generate sample signed tickets (needs the keys)
npm run demo:build
npm run demo:phone       # serves over HTTPS on your LAN, prints the URL
```

Demo mode replaces exactly three things — sign-in, the guest-list fetch and the
sync call. The camera, the signature verification and the duplicate logic are
all the real code. An undismissable banner says it's a demo. PIN `1234`.

---

## 10. The confirmation email

Built and tested, but **not wired to a sender** — that was a deliberate client
decision. The hook is marked in
[`src/app/api/register/route.ts`](src/app/api/register/route.ts); drop in
Brevo, Resend or whatever they prefer.

```bash
npm run dev
open http://localhost:3000/api/email/preview             # HTML
open http://localhost:3000/api/email/preview?format=text # plain text
npm run email:shot -- ./out                              # screenshots + size check
```

Written for mail clients, not browsers: table layout, all styles inlined, VML
button so Outlook renders a real filled shape, 11.7 KB (Gmail clips at 102 KB).

**The ticket number is set in large live text under the QR, and that is not
decoration.** Most clients block images by default, so the QR often won't
render — the number is the fallback, and the scanner has a matching
manual-entry mode that takes exactly that string.

Send **both** the HTML and the plain-text part. The `qrUrl` must be an absolute
URL recipients can reach: `https://yourdomain/api/ticket/<ticket>/qr.png`.

---

## 11. Accessibility rules this code follows

Please don't regress these — several were bugs found and fixed during the build.

- Every hover reveal is mirrored on **focus and click**, so keyboard and touch
  users get the same content.
- Focus rings are visible on **every** background (`:focus-visible`, with a
  red variant for yellow sections).
- Marquee duplicate copies are `aria-hidden` **and `inert`** — a hidden copy
  that still takes Tab focus strands keyboard users on invisible controls.
- Tab order is: skip link → nav → form → submit.
- Form inputs are `16px` so iOS doesn't zoom on focus.
- Changing values (countdown, scan counts) use `tabular-nums`.
- Live regions announce form status and scanner verdicts.
- Nothing clips or overlaps at 320px or at 200% zoom.
- Reduced motion is honoured throughout ([§6.12](#612-reduced-motion)).
- `/scan` is `noindex, nofollow`.

---

## 12. Tests

```bash
npm run test:schema   # the database, against real Postgres (PGlite/WASM)
npm run test:ticket   # signing, forgery, typo tolerance, collision space
npm run test:gate     # the scanner, driven through a real camera
npm run test:paths    # both QR decoders — native and the iOS fallback
npm run test:aim      # several tickets in one frame; must read the aimed one
npm run test:demo     # the demo build that goes on a phone
```

These assert and exit non-zero on failure. All except `test:schema` need a
server running (`npm run dev`, or `npm run demo:phone` for the demo ones).

`test:gate`, `test:paths` and `test:aim` play a generated Y4M video of a real
signed QR into Chromium's fake camera, so they exercise the whole path: video
frame → decode → Ed25519 verify → IndexedDB lookup → verdict.

Visual checks (produce screenshots, don't assert):

```bash
node scripts/shots.mjs <outDir> [width] [height]
REDUCED=1 node scripts/shots.mjs <outDir>
node scripts/interactions.mjs <outDir>
```

**Not covered:** the Supabase client calls themselves. The SQL is tested against
real Postgres and the scanner against a real camera, but nothing here has
talked to a live Supabase project. **Do one end-to-end registration against
staging before the gates open.**

---

## 13. Before you launch

| # | What | Where |
|---|---|---|
| 1 | **Wire the confirmation email** to a sender | `src/app/api/register/route.ts` |
| 2 | **Social links are placeholders** — get the real handles | `src/components/Footer.tsx` → `SOCIALS` |
| 3 | **`metadataBase` points at a placeholder domain** | `src/app/layout.tsx` → `SITE` |
| 4 | **Drop in the licensed fonts** | [§7](#7-brand-colour-type-devices) |
| 5 | **Line-up is a TBA placeholder** — replace when the bill is confirmed | `src/components/Lineup.tsx` → `SLOTS` |
| 6 | **Run the schema** in Supabase and do one real test registration | `supabase/schema.sql` |
| 7 | **Generate production keys** and set them in the host | `npm run keygen` |
| 8 | **Brief the gate team** | [GATE-RUNBOOK.md](GATE-RUNBOOK.md) |
| 9 | **Load-test the manifest** if over ~5,000 registrants — it sends the whole list in one response | `src/app/api/scan/manifest/route.ts` |
| 10 | **Decide the duplicate-ticket policy** — the scanner says "send them to the help desk", so make sure that desk exists | — |

### Known limitation, stated plainly

**Two phones that are both offline can each admit the same ticket**, because
neither can see the other. The server resolves it on sync, the losing scan
shows as *disputed* in that device's log, and there's a full audit trail — but
the second person is already inside. If that matters, keep at least one gate on
a reliable connection.

---

## 14. Where things live

```
src/
  app/
    layout.tsx            fonts, metadata, skip link
    page.tsx              section order + Event JSON-LD
    globals.css           brand tokens, keyframes, reduced-motion block
    scan/                 the gate scanner (staff only, noindex)
    api/
      register/           writes to Supabase, issues a signed ticket
      ticket/[ticket]/    the ticket QR as a PNG
      scan/               staff PIN, guest-list manifest, scan sync
      email/preview/      the confirmation email, rendered

  components/
    Nav  Hero  RegisterForm  DateVenue  Activities  Lineup
    BroughtToYou  Gallery  BrandStory  FinalCta  Footer
    Dividers              castellated / torn / checker edges
    Marquee               seamless infinite ticker
    SmoothScroll          Lenis, skipped under reduced motion
    CursorTrail  MascotBuddy  ScrollToTop
    scan/Scanner          the camera and QR decoding
    scan/ServiceWorker    offline shell, production only

  lib/
    utils.ts              FESTIVAL dates — single source of truth
    doodle.ts             tiling SVG wallpaper (server-safe)
    useReducedMotion.ts   reduced motion, mounted, clock, storage
    ticket.ts             ticket ids, Ed25519 sign and verify
    supabase.ts           server-side database client
    scanner-auth.ts       staff PIN and device tokens
    scan-store.ts         scanner IndexedDB (guest list + queue)
    useGate.ts            the gate's whole decision flow
    scanner-demo.ts       the no-database demo mode

  emails/confirmation.ts  the registration email (HTML + text)
  data/                   activities, photos.json, demo guests

public/                   brand art, photos, app icons, sample tickets
supabase/schema.sql       tables, atomic admit(), RLS
scripts/                  tests, key generation, asset and preview tooling
```

### The other documents

- **[TICKETING.md](TICKETING.md)** — how registration, tickets and the gate fit
  together, and why each decision was made.
- **[GATE-RUNBOOK.md](GATE-RUNBOOK.md)** — plain-English instructions for the
  stewards on the day. Print this.
- **[PRD.md](PRD.md)** — the original brief and brand identity.
- **[docs/design-assets-manifest.md](docs/design-assets-manifest.md)** — every
  asset extracted from the design PDF.

---

Questions about intent rather than code are usually answered in `PRD.md` or in
the comments — the non-obvious decisions are explained where they were made.
