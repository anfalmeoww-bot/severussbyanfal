# SeverusByAnfal

An online store with phone-number + OTP sign-in, a customer storefront (categories, product pages, cart, checkout), and a store-owner admin dashboard — built for Mada / Apple Pay / Visa / Mastercard checkout, fully bilingual (Arabic/English, with RTL), and branded around a white deer mark on a light-blue-and-white identity.

This document is written for someone deploying the site for the first time, including with **little to no coding experience**. Follow it top to bottom.

**In a hurry?** Open **`GOING_LIVE_CHECKLIST.md`** — it lists exactly what's already been prepared for you versus the handful of steps that need your own ID/bank/accounts, with the copy-paste commands for each.

---

## 1. What you're getting, and an important honesty note

This project was built inside a sandboxed environment that could not download any third-party packages (no npm/pip access at all). Rather than hand you unverified, unrunnable code built against libraries I couldn't test, I built the entire backend using **only Node.js's own built-in features** — its built-in HTTP server, its built-in SQLite database (`node:sqlite`), and its built-in `fetch`. The frontend is plain, hand-written HTML/CSS/JavaScript (no React/Next.js, no build step required to run it).

Practically, this means:

- **It has almost zero dependencies.** `npm install` only needs to fetch `typescript` and `tsx` (small dev tools) — nothing else. Less to break, less to update, smaller attack surface.
- **It runs on any machine with Node.js 22.5 or newer.** No Docker, no database server to install — the database is a single SQLite file that's created automatically.
- **I ran the entire app myself** (signup/login, admin category & product management, image upload, add-to-cart, checkout, mock payment, order history, account/phone editing, theme + language switching) before handing it to you — see "What was tested" below.
- If you later want to move to a bigger stack (Next.js, PostgreSQL, etc.) because your catalog grows very large, the code is organized so that's a clean rewrite of the `src/db` layer only — everything else (routes, views, business rules) stays the same shape.

### What was tested end-to-end in this environment

Phone OTP sign-up/login, admin recognition by phone number, category create/rename/delete, product create/edit/delete with image upload, storefront browsing + category filtering in both languages, add-to-cart, cart quantity/remove, checkout → mock payment → order marked paid → stock decremented → cart cleared, order history, account name edit, phone-number change with OTP re-verification (including the admin role automatically updating when the phone number changes), theme switching, CSRF protection, admin-only route protection, and OTP rate-limiting. A production build (`npm run build && npm start`) was also verified.

What was **not** tested (because it requires real accounts/credentials I don't have): actual SMS delivery through Unifonic, and actual card/Apple Pay/Mada charges through Moyasar. The integration code for both is written and follows their documented APIs, but you must verify it against a real sandbox/test account before taking real payments — see sections 5 and 6.

---

## 2. Quick start (running it on your own computer first)

1. Install **Node.js 22.5 or newer** from [nodejs.org](https://nodejs.org) if you don't have it. Check with:
   ```
   node -v
   ```
2. Open a terminal in this folder and install the (very few) dev tools:
   ```
   npm install
   ```
3. Copy the example environment file and open it in a text editor:
   ```
   cp .env.example .env
   ```
4. In `.env`, set at minimum:
   - `APP_SECRET` — generate one with `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"` and paste the result in.
   - `ADMIN_PHONE_NUMBERS` — **your own phone number**, in international format (e.g. `+9665XXXXXXXX`). This is how the site recognizes you as the store owner.
   - Leave `SMS_PROVIDER=console` and `PAYMENT_PROVIDER=mock` for now — this lets you click through the whole site locally without needing real SMS or payment accounts yet. (More on this below.)
5. Start it:
   ```
   npm run dev
   ```
6. Open `http://localhost:3000` in your browser. Enter your phone number to log in — since `SMS_PROVIDER=console`, the 6-digit code is printed **in your terminal**, not actually texted to you. Copy it into the site.
7. Because your number is in `ADMIN_PHONE_NUMBERS`, you'll see a "Store Dashboard" link in your profile menu. Go create your first category and product there.

---

## 3. Understanding the two "dev mode" switches

Two settings in `.env` control whether you're in safe testing mode or real/live mode:

- `SMS_PROVIDER=console` → OTP codes print to your server log instead of being texted. Switch to `SMS_PROVIDER=unifonic` (see section 5) to send real texts.
- `PAYMENT_PROVIDER=mock` → the checkout page shows a "Simulate successful payment" button instead of a real payment form; no money moves. Switch to `PAYMENT_PROVIDER=moyasar` (see section 6) to accept real Mada/Apple Pay/Visa/Mastercard payments.

**Before you launch publicly, both must be switched away from their dev values.** The server prints a warning on startup if `PAYMENT_PROVIDER=mock` is left on in production, as a safety net.

---

## 4. You don't have a Commercial Registration (CR) — what to do

You asked whether it's possible to accept Mada/Apple Pay/card payments and send OTP SMS without a Saudi CR number. Short answer: **yes**, via the free "Freelance Certificate" (وثيقة العمل الحر):

1. Get the free Freelance Certificate at the government's Freelance Platform (منصة العمل الحر, freelance.sa), run by the Ministry of Human Resources and Social Development. This is separate from — and doesn't require — a CR.
2. Sign up with **Moyasar** (moyasar.com) or **PayTabs** using that certificate plus your national ID and a bank statement/letter. Both have documented onboarding paths for freelance-certificate holders. Payouts go straight to your own bank account.
3. For OTP SMS, providers like **Unifonic** and **Msegat** let individuals open accounts directly — this is not gated behind a CR the way a custom branded SMS "Sender ID" registration can be.

Confirm the exact current paperwork directly with whichever provider you pick, since requirements can shift — but this route is real and commonly used by Saudi freelancers and small sellers.

---

## 5. Turning on real SMS (OTP) delivery

The code defaults to **Unifonic**, but is written so you can swap providers without touching the rest of the app.

1. Create a Unifonic account and an "AppSid" for your app.
2. In `.env`, set:
   ```
   SMS_PROVIDER=unifonic
   UNIFONIC_APP_SID=your-app-sid
   UNIFONIC_SENDER_ID=SeverusByAnfal
   ```
3. Before going live, double check the request format in `src/sms/unifonic.ts` against Unifonic's **current** REST API docs (developers.unifonic.com) — SMS provider APIs occasionally rename fields, and I could not place a real test call from this environment.
4. Want a different provider (Msegat, Twilio, etc.) instead? Create a new file in `src/sms/` implementing the same one-method interface in `src/sms/provider.ts`, then select it in `src/sms/index.ts`.

---

## 6. Turning on real payments (Mada / Apple Pay / Visa / Mastercard)

The code defaults to **Moyasar**, using their hosted Payment Form (so card details never touch your own server — they go straight to Moyasar, which keeps you out of PCI-DSS scope).

1. Create a Moyasar account (see section 4 if you don't have a CR).
2. From the Moyasar dashboard, get your **Publishable key** and **Secret key**.
3. In `.env`, set:
   ```
   PAYMENT_PROVIDER=moyasar
   MOYASAR_SECRET_KEY=sk_live_xxx
   MOYASAR_PUBLISHABLE_KEY=pk_live_xxx
   DEFAULT_CURRENCY=SAR
   ```
4. **Set up a webhook** in the Moyasar dashboard pointing to `https://your-domain.com/webhooks/moyasar`, and put the secret token you choose there into `MOYASAR_WEBHOOK_SECRET` in `.env`. This is what confirms payment even if a customer closes their browser mid-checkout.
5. Before going live, check `src/views/checkout.ts` for the exact `<script src="https://cdn.moyasar.com/mpf/...">` version against Moyasar's current docs (docs.moyasar.com/guides/card-payments/basic-integration) — I could not verify the exact current version number from this environment.
6. **To enable Apple Pay specifically:** Moyasar/Apple will give you a domain-verification file. Paste its exact contents into `APPLE_PAY_DOMAIN_ASSOCIATION` in `.env` — the app serves it automatically at `/.well-known/apple-developer-merchantid-domain-association`, which Apple requires to be reachable at that exact path.
7. Every order is re-verified server-side against Moyasar's API before being marked "paid" — the app never trusts the browser redirect or webhook body alone (see `src/routes/orders.ts` and `src/payments/moyasar.ts`).

Want a different gateway (HyperPay, Tap, PayTabs)? Implement the same interface in `src/payments/provider.ts` as a new file in `src/payments/`, then select it in `src/payments/index.ts`. The checkout page (`src/views/checkout.ts`) will need a small adjustment to embed that gateway's own hosted form.

---

## 7. Deploying to a real server

Any Linux server with Node.js 22.5+ works (a $5–6/month VPS from DigitalOcean, Hetzner, or similar is plenty for a small-to-medium store). This is scripted for you already — see **`GOING_LIVE_CHECKLIST.md`** for the short version, or the detail below.

1. Point your domain's DNS "A" record at your server's IP address (do this first — TLS setup needs it to already be pointing there).
2. Copy `.env.production` to `.env` and replace every `<<< FILL IN >>>` marker with your real values (your domain, your phone number, your Moyasar/Unifonic keys). The `APP_SECRET` is already generated for you — leave it as-is.
3. Upload the whole project folder to your server:
   ```
   scp -r severus-by-anfal your-user@your-server-ip:~/severus-by-anfal
   ```
4. On the server, run the one-time setup script — it installs Node.js, pm2, Nginx and Certbot; installs dependencies; builds the app; starts it under pm2 (so it survives crashes/reboots); and configures Nginx + a free Let's Encrypt HTTPS certificate, all in one go:
   ```
   ssh your-user@your-server-ip
   cd ~/severus-by-anfal
   chmod +x deploy/setup-server.sh
   ./deploy/setup-server.sh your-domain.com you@your-email.com
   ```
5. Your store is now live at `https://your-domain.com`.
6. **Whenever you upload new code later**, just run `./deploy/update.sh` on the server — it rebuilds and reloads with zero downtime.
7. **Back up `data/store.db` regularly** (it's your entire database — products, orders, users). `deploy/backup-db.sh` does this for you; the comments inside it show how to schedule it to run automatically every night via `cron`.

Useful commands once it's live:
- `pm2 logs severusbyanfal` — view live server logs
- `pm2 restart severusbyanfal` — restart the app
- `pm2 status` — check it's running

---

## 8. Replacing the placeholder logo

The white deer mark shipped here is placeholder artwork (simple geometric shapes), generated because you didn't have a final logo file ready yet. It lives in one place: `src/views/logo.ts`, plus a rasterized favicon at `public/images/favicon.svg` / `favicon-32.png` / `apple-touch-icon.png`.

To swap in your real logo once you have it:
1. Save your logo as an SVG (preferred) or PNG.
2. Replace the contents of `src/views/logo.ts`'s `deerLogoSvg()` function with your artwork (or simplest: have it render an `<img src="/images/your-logo.svg">` tag instead).
3. Regenerate the favicon files in `public/images/` from your new artwork (any online SVG-to-PNG/favicon converter works).

---

## 9. How the admin/owner access works

Your admin/store-management access is tied entirely to your **phone number**, listed in `ADMIN_PHONE_NUMBERS` in `.env` (comma-separate multiple numbers if more than one person should have owner access). Every request re-checks this list — so:

- If you ever change your own phone number through the site's "My Account" page, you must also update `ADMIN_PHONE_NUMBERS` in `.env` and restart the server, or you'll lose admin access on your new number until you do.
- Removing a number from the list immediately revokes that account's admin access on its very next request — even if they're already logged in.
- Regular customers can never gain admin access no matter what they do in the UI; every admin page and API route checks this server-side, not just in the browser.

---

## 10. Project structure

```
src/
  server.ts          entry point (HTTP server, security headers, routing)
  config.ts          loads and validates .env
  db/                SQLite connection, schema (migrations.sql), data-access functions
  lib/                shared helpers: auth/sessions, OTP, CSRF, rate limiting, i18n, validation
  sms/                SMS provider interface + console (dev) + Unifonic implementations
  payments/           payment provider interface + mock (dev) + Moyasar implementations
  routes/             one file per feature area (auth, account, products, cart, orders, admin/*)
  views/              server-rendered HTML page templates
public/
  css/styles.css      all styling (light-blue/white palette, Dark Blue / Light Blue themes, responsive, RTL-safe)
  js/                 small vanilla-JS files per page (no framework, no build step)
  images/             logo/favicon assets
  uploads/            product images land here at runtime
data/store.db         the SQLite database (created automatically; back this up)
```

---

## 11. Security measures included

- **OTP verification**: 6-digit codes, hashed (never stored in plain text), expire after 5 minutes, max 5 guess attempts before invalidation, rate-limited per phone number (cooldown between sends + hourly cap) to resist SMS-bombing and brute force.
- **Sessions**: random 256-bit tokens, stored hashed server-side, `HttpOnly` + `Secure` (in production) + `SameSite=Lax` cookies — not readable by JavaScript, not sent cross-site.
- **CSRF protection**: every state-changing request (add to cart, admin edits, etc.) requires a per-session CSRF token.
- **Admin access**: enforced server-side on every request by phone-number allowlist, independent of anything the browser sends.
- **Payments**: card data never touches this server — it's tokenized directly against the payment gateway from the browser (PCI scope stays with the gateway). Every payment is independently re-verified against the gateway's API before an order is marked paid; webhook payloads are never trusted at face value.
- **File uploads**: product images are validated by actual file signature/size before being written to disk, with randomized filenames.
- **Security headers**: `Content-Security-Policy`, `X-Frame-Options`, `X-Content-Type-Options`, `Strict-Transport-Security` (in production), `Referrer-Policy` are set on every response.
- **Input validation**: phone numbers, prices, quantities, and text fields are validated/sanitized before touching the database or business logic.

None of this replaces a professional security review before handling real customer payments at scale — but it covers the standard risks for a small-to-medium store.

---

## 12. Known limitations / good next steps

- SQLite is a single file — great up to a solid few thousand orders/products, but if you outgrow it, migrate `src/db` to PostgreSQL (the rest of the app doesn't need to change).
- No automated test suite was written (given the environment constraints, correctness was verified by manually exercising every flow instead — see section 1).
- No shipping-cost or tax calculation — `subtotal_cents` and `total_cents` are currently equal; there's a clear spot in `src/db/repo.ts` (`createOrderFromCart`) to add either later.
- No email notifications (order confirmations, etc.) — could be added alongside the SMS provider using the same pattern.
- Product search isn't implemented — only category browsing, as requested.
