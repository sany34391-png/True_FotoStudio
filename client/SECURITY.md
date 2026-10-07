# Website security

The client is a static React application and does not provide accounts, payment
processing, or a private API. It sends basic security headers during Vite
development and preview, and `public/_headers` configures the same protections
on hosts that support the Netlify `_headers` format. A restrictive Content
Security Policy is intentionally not configured so site images, fonts, and the
Yandex reviews widget are not blocked.

For other hosting providers, configure the headers from `public/_headers` in
the host's settings. The headers prevent MIME sniffing, deny framing by other
sites, limit referrer details, and disable unused browser features. Enable HSTS
(`Strict-Transport-Security`) at the HTTPS hosting layer only after the
production domain is served exclusively over HTTPS. These basic headers cannot
replace HTTPS, server-side validation, access controls, or backups if a backend
is added later.
