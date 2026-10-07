import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

const securityHeaders = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
}

export default defineConfig({
  plugins: [react()],
  server: {
    headers: securityHeaders,
  },
  preview: {
    headers: securityHeaders,
  },
})
