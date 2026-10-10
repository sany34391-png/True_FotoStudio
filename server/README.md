# Server

The Bun server accepts photo orders at `POST /api/orders` and sends them to
`t64117837@gmail.com` through SMTP. The SMTP sender credentials stay on the
server and must never be added to the client.

## Configure email

Edit the ready-to-use `server/.env` file and replace `SMTP_USER` with the
sender's Gmail address and `SMTP_PASS` with its Google App Password. For Gmail,
enable 2-Step Verification and create an App Password; do not use the regular
Google password. The checked-in-safe template is `.env.example`.

`server/.env` is excluded by `.gitignore`. Never commit it, put SMTP credentials
in client code, or share the App Password. The server recognizes the example
placeholder values and will start without attempting to send mail until they
are replaced.

For a different email provider, set its SMTP host, port, and secure-connection
settings. Port 465 generally uses `SMTP_SECURE=true`; port 587 generally uses
`SMTP_SECURE=false`.

If a reverse proxy changes the browser `Origin` header, set
`ALLOWED_ORIGINS` to a comma-separated list of the exact trusted origins (for
example `https://photos.example.com`). Do not use `*`. Keep the API behind the
trusted proxy. By default, the API accepts same-origin requests and the local
Vite development origin only.

## Run locally

Open two terminals. In the first, start the API from `server`:

```bash
cd server
bun run dev
```

In the second, start the Vite client from `client`:

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
simultaneous SMTP sends help reduce spam and resource abuse. The SMTP credentials
are only read by the server. Limits are in-memory and reset when the server
restarts; use an external rate limiter for a multi-instance production setup.
