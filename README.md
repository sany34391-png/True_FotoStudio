# True FotoStudio

The project contains a React/Vite website in `client` and a Bun API in `server`.
The API handles photo-album order email and stores local customer reviews.

## Run locally

Install client dependencies if needed, then run each service in its own terminal:

```powershell
cd client
npm install
npm run dev
```

```powershell
cd server
bun install
bun run dev
```

The Vite development server proxies `/api` requests to `http://localhost:3001`.
Set SMTP credentials in the ignored `server/.env` file before testing email;
see [server/README.md](./server/README.md).
The service prints photo albums only from customer-provided photographs. It does
not offer photography sessions or printing of individual photographs.

## Production setup

For a step-by-step deployment on a Linux VPS with Docker, see
[deploy/README.md](./deploy/README.md).

1. Choose and configure the public HTTPS domain.
2. Set `VITE_SITE_URL=https://your-real-domain.example` in the client build
   environment. The build then creates per-route metadata, canonical links,
   `robots.txt`, and `sitemap.xml`. Without this value, it intentionally does
   not emit placeholder domain URLs.
3. Configure the production SMTP credentials as server environment variables.
4. Deploy the Bun API behind HTTPS and route the same-origin `/api` path to it.
5. Ensure `server/data/reviews.json` is on persistent writable storage. The
   current JSON review store and rate limits support a single API instance;
   use a database and shared rate limiter for multiple instances.
6. Configure HTTPS and security headers at the production host. The
   `client/public/_headers` file is supported by static hosts that use Netlify
   `_headers` syntax; other hosts need equivalent configuration.
7. Publish an accurate privacy notice and verify business claims, delivery,
   prices, service area, and permissions for any customer reviews.

Review submissions are published immediately after server-side validation.
Visitors must agree to public display of their entered name and review. Details
on API validation, storage, and abuse limits are in [server/README.md](./server/README.md).
