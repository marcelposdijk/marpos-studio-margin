import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://astro-uzen-theme.pages.dev',
  output: 'server',
  adapter: cloudflare({ mode: 'directory' }),
  integrations: [mdx(), sitemap()],
});
