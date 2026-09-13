import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

const isDevelopmentServer = process.argv.includes('dev')

export default defineConfig({
  site: 'https://stagecoffee.com',
  output: 'static',
  devToolbar: { enabled: false },
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  server: {
    allowedHosts: ['.trycloudflare.com'],
  },
  vite: {
    // Keep production/check dependency optimization from replacing the JSX
    // runtime used by a live development server.
    cacheDir: isDevelopmentServer
      ? 'node_modules/.vite-dev'
      : 'node_modules/.vite-build',
  },
  integrations: [react(), sitemap()],
})
