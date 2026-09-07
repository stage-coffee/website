import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'

export default defineConfig({
  site: 'https://stagecoffee.com',
  output: 'static',
  build: { format: 'directory' },
  trailingSlash: 'ignore',
  integrations: [react(), sitemap()],
})
