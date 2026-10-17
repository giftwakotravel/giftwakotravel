# GiftWako Travel — Next.js rebuild

A faithful Next.js rebuild of the WordPress site at giftwakotravel.co.za, using the
theme's design system (Manrope + Pacifico, ocean/gold/navy palette) and the local
media collected in `build/media/`.

## Run

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm start
```

## Structure

| Path | Purpose |
| --- | --- |
| `app/` | App Router pages (home, tours-and-services, plan-a-trip, about, contact, 6 service pages, events, legal, account, my-trips, photo-credits) |
| `app/api/trip-request/route.ts` | Trip request intake (validation ported from the WP PHP handler) |
| `app/globals.css` | Design system ported from `recon/theme/assets/css/site.css` + `build/giftwako-child/assets/css/child.css` |
| `components/` | Header, Footer, PageBand, CtaBand, TripCard, TripRequestForm, ServicePage, AccountForm |
| `lib/site.ts` | Business details, nav, footer links, WhatsApp helpers |
| `lib/data.ts` | Trips, services, packages, destinations, pillars |
| `public/images/` | Photography + logos (copied from `build/media/`) |
| `public/icons/` | UI icons (from `recon/theme/assets/icons/`) |
| `public/fonts/` | Manrope, Pacifico, Literata |

## Trip request delivery

`POST /api/trip-request` validates the form (same rules as the WordPress plugin:
honeypot + timestamp spam traps, required fields, option whitelists, date and
number ranges, consent) and then delivers in this order:

1. **Resend** — set `RESEND_API_KEY`, `TRIP_REQUEST_EMAIL_TO` (e.g.
   `info@giftwakotravel.co.za`), optional `TRIP_REQUEST_EMAIL_FROM`.
2. **Webhook** — set `TRIP_REQUEST_WEBHOOK_URL` to POST the request as JSON.
3. **Fallback** — appends one JSON line per request to `data/trip-requests.jsonl`
   (gitignored; useful in dev and on a plain Node host).

Spam-trapped submissions are silently accepted, as on the live site.

## Notes vs. the WordPress original

- Office hours were an empty Customizer field rendered as a `[to add: office hours]`
  placeholder on the live site — omitted here; add the real value when known.
- Account/My trips pages render the site's forms but, until the SBOS booking
  backend is connected, submissions show the same "online services are being set
  up" message the live site already displays.
- "Services available to book now" renders the empty-state note (the live site's
  SBOS catalogue only contained a test item).
