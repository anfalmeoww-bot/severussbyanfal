# Going live — checklist

Everything technical is prepared and tested. Here's exactly what's done, and exactly what's left — split by who has to do it.

## ✅ Already done for you

- [x] The whole app is built, and I ran it end-to-end myself (login, admin, catalog, cart, checkout, orders, account, security checks) — see README.md section 1.
- [x] A real, random `APP_SECRET` has been generated and placed in **`.env.production`**.
- [x] `.env.production` is filled in everywhere it can be — only a few values need your own information (marked `<<< FILL IN >>>`).
- [x] Deployment scripts, ready to copy to your server:
  - `deploy/setup-server.sh` — one command that installs Node.js, sets up the app to run permanently, configures Nginx, and gets you free HTTPS.
  - `deploy/update.sh` — run this any time you upload new code, to rebuild and reload with zero downtime.
  - `deploy/backup-db.sh` — backs up your database; instructions inside for scheduling it daily.
  - `deploy/ecosystem.config.js` / `deploy/nginx.conf.template` — configuration the scripts above use automatically.
- [x] The production build (`npm run build && npm start`) was verified to run correctly.

## ⏳ Steps that need you personally

These genuinely can't be done by me — they require your national ID / Absher login, your own bank account, or you personally agreeing to a provider's terms.

1. **Get your Freelance Certificate** (if you don't have a CR) at the Freelance Platform (freelance.sa) — free, tied to your national ID. See README section 4.
2. **Open a Moyasar account** (payments) using that certificate + your ID + a bank statement. Get your Publishable key, Secret key, and set up a webhook. See README section 6.
3. **Open a Unifonic account** (SMS/OTP) and get an AppSid. See README section 5.
4. **Buy a domain name** and a small VPS (any host — DigitalOcean, Hetzner, etc. all work; ~$5–6/month is enough). Point the domain's DNS "A" record at the server's IP.
5. **Fill in the remaining values** in `.env.production`:
   - `BASE_URL` — your real domain
   - `ADMIN_PHONE_NUMBERS` — your own phone number (this is what gives you store-owner access)
   - `UNIFONIC_APP_SID`, `MOYASAR_SECRET_KEY`, `MOYASAR_PUBLISHABLE_KEY`, `MOYASAR_WEBHOOK_SECRET` — from steps 2–3 above
6. **Upload the project to your server** and run the setup script:
   ```
   scp -r severus-by-anfal your-user@your-server-ip:~/severus-by-anfal
   ssh your-user@your-server-ip
   cd ~/severus-by-anfal
   cp .env.production .env    # after filling in every <<< FILL IN >>> value
   ./deploy/setup-server.sh your-domain.com you@your-email.com
   ```
   That single script installs everything, builds the app, starts it permanently, and sets up free HTTPS.

Once step 6 finishes, your store is live. Come back to this session any time and tell me what's happening on screen if a step doesn't go as expected — I can help debug from the output.
