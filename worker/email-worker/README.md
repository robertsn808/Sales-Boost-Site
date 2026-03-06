# Tech Savvy Hawaii — Email Worker

Cloudflare Email Worker that handles inbound email to `contact@techsavvyhawaii.com`.

## What It Does

1. **Receives** inbound emails via Cloudflare Email Routing
2. **Classifies** intent (new lead, support, spam, etc.) using the AI Worker at `/classify`
3. **Logs** new leads directly into the `savvy-admin` D1 database (`leads` table)
4. **Auto-replies** to new leads with a branded acknowledgment email
5. **Forwards** every email to your personal inbox

## Setup

### 1. Deploy the Worker

```bash
cd worker/email-worker
npm install
wrangler deploy
```

### 2. Set Secrets

```bash
wrangler secret put WORKER_KEY
# Paste the same WORKER_KEY you use for the AI worker
```

### 3. Configure Email Routing in Cloudflare Dashboard

1. Go to **Cloudflare Dashboard** → your `techsavvyhawaii.com` zone
2. Click **Email** → **Email Routing**
3. Enable Email Routing (if not already)
4. Go to **Routes** → **Create address**
5. Custom address: `contact`
6. Destination: Select **Send to a Worker** → pick `tight-fog-5031`
7. Save

### 4. Verify Forwarding Destination

In Email Routing → **Destination addresses**, add and verify `gorjessbbyx3@icloud.com` 
(or whatever personal email you want forwarded to).

## Architecture

```
Inbound email → Cloudflare Email Routing → Email Worker
                                              ├─→ AI Worker /classify (intent detection)
                                              ├─→ D1 leads table (auto-log)
                                              ├─→ Auto-reply (branded email)
                                              └─→ Forward to personal inbox
```

## Notes

- The Email Worker is **separate** from the AI HTTP Worker (`mojo-luna-955c`)
- Email Workers use the `email()` event handler, not `fetch()`
- Auto-replies only fire for `new_lead` classified emails
- Spam-classified emails are NOT logged to D1
- All emails are forwarded regardless of classification
