# Local development

Everything runs on this Mac. No step here touches production. Note that pushing the theme to `main` **does** deploy it live.

| Piece | Local URL | Talks to |
|---|---|---|
| Ghost 6.72 (Docker) running this theme as `snook` | http://localhost:2368 (admin `/ghost`) | MySQL in Docker |
| Mailpit (catches all Ghost email: magic links, signups) | http://localhost:8025 | — |
| break-order-worker (`wrangler dev`) | http://localhost:8787/api | local Ghost, Square **sandbox**, local KV, Stripe **test** |

On `localhost:2368` the theme sets `window.BREAK_API_BASE` to `http://localhost:8787/api`. Everywhere else it uses `https://thebreaksales.ca/api`. This is set in `default.hbs`.

## Start

```bash
colima start --cpu 2 --memory 4 --disk 30 --mount /Volumes/DevSSD:w
```
```bash
docker compose -f dev/docker-compose.yml up -d
```
```bash
cd ../break-order-worker && npm run dev
```

Edits to the theme show up on reload, because the repo is bind-mounted and Ghost runs with `NODE_ENV=development`.

The local admin login is in `dev/.local-admin`, which is gitignored. The worker's local Ghost Admin key is already in `../break-order-worker/.dev.vars`.

## Stop or reset

```bash
docker compose -f dev/docker-compose.yml down
```
```bash
docker compose -f dev/docker-compose.yml down -v
```
The second command wipes the local Ghost database and content. After a wipe, redo the admin setup and the integration key.

## Stripe (test mode)

```bash
stripe login
```
```bash
stripe listen --forward-to localhost:8787/api/stripe/webhook
```
Put `sk_test_…` and the `whsec_…` that `stripe listen` prints into `../break-order-worker/.dev.vars`.

## Paid catalogs (Stripe Checkout)

A catalog page uses Stripe instead of Square invoices when it has the internal tag `#stripe`. Its submit button then reads "Checkout".

- Each product card's button URL is the SKU prefix, e.g. `#OBSC-CREW-OLV`. The button text lists the sizes, e.g. `YS,YM,YL,S,M,L,XL,XXL,$45.00`. The price in the text is for display only.
- SKU = prefix + `-` + size, e.g. `OBSC-CREW-OLV-YS`. Each SKU must be an **active Stripe Price whose lookup key is the SKU**. The worker charges the Stripe price, never the page's.
- The worker's `POST /api/checkout` creates the Checkout Session. `POST /api/stripe/webhook` handles `checkout.session.completed`: it records the order in KV as `stripe-order:<session>` and clears the member's draft.
- In production, add a Stripe webhook endpoint at `https://thebreaksales.ca/api/stripe/webhook` for `checkout.session.completed`.

Without Stripe keys, test against a fake Stripe: set `STRIPE_API_BASE` (see `.dev.vars.example`) and run a mock that serves `/v1/prices` and `/v1/checkout/sessions`.

## Google Forms Apps Script

The worker posts form submissions to an Apps Script web app (`APPS_SCRIPT_URL` in `break-order-worker/src/index.ts`). Pull its source with clasp:

```bash
clasp login
```
```bash
clasp clone <scriptId>
```

## Real content

Export from https://thebreaksales.ca/ghost: Settings → Advanced → Import/Export → Export. Then import the file at http://localhost:2368/ghost. Member labels must match page slugs for the catalog access gating to work.
