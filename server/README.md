# Server

The Bun server accepts photo orders at `POST /api/orders` and sends them to
`t64117837@gmail.com` through SMTP. SMTP sender credentials stay on the server
and must never be added to the client.

## Configure email

Edit `server/.env` and enter the sender account's SMTP credentials. For Gmail,
enable 2-Step Verification and create an App Password; use that password for
`SMTP_PASS`, not your regular Google password. Keep `.env` private and do not
commit it.

For a different email provider, set its SMTP host, port, and secure-connection
settings. Port 465 generally uses `SMTP_SECURE=true`; port 587 generally uses
`SMTP_SECURE=false`.

If SMTP credentials were pasted into a chat, source file, or public repository,
revoke them and generate new credentials.

If a reverse proxy changes the browser `Origin` header, set `ALLOWED_ORIGINS`
to a comma-separated list of exact trusted origins. Do not use `*`; keep the
API behind the trusted proxy. By default, the API accepts same-origin requests
and the local Vite development origin only.

## Run locally

Open two terminals. Start the API from `server`:

```bash
cd server
bun run dev
```

Start the Vite client from `client`:

```bash
cd client
npm run dev
```

The Vite development server proxies `/api` requests to `http://localhost:3001`.
Check `http://localhost:3001/api/health`; `emailConfigured` must be `true` after
you replace the example credentials. In production, serve the site over HTTPS
and route the same-origin `/api` path to this server through the hosting
platform or a reverse proxy.

## Input and abuse protections

The API independently validates and trims every field with Zod, rejects unknown
properties and control characters, limits field and request sizes, and escapes
user text before placing it in the HTML email. A hidden honeypot, same-origin
checks, a per-client limit of five order attempts per 15 minutes, and a cap on
simultaneous SMTP sends help reduce spam and resource abuse. SMTP credentials
are only read by the server. Limits are in-memory and reset when the server
restarts; use an external rate limiter for a multi-instance production setup.

Each order must include one reply contact: an international phone number, an
email address, or a Telegram username (for example `@username`). The contact is
validated on both client and server and included in the notification email.
