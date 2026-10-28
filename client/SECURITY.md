# Website security

The React client communicates with the Bun API for photo-album orders and local
reviews. The site does not provide user accounts or payment processing. Vite
development and preview apply security headers, and `public/_headers` configures
them for hosts that support the Netlify `_headers` format. The Content Security
Policy allows only same-origin application resources plus Google Fonts; it does
not allow third-party review widgets.

For other hosting providers, configure equivalent headers in the host settings.
The headers prevent MIME sniffing, deny framing by other sites, limit referrer
details, and disable unused browser features. The API also validates request
data, limits request sizes and rates, and adds its own response headers. Enable
HSTS (`Strict-Transport-Security`) at the HTTPS hosting layer only after the
production domain is served exclusively over HTTPS. These protections do not
replace HTTPS, backups, or a production-appropriate data store and rate limiter.
