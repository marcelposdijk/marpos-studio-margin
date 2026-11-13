import { defineConfig } from 'astro/config';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: process.env.SITE_URL || 'https://margin.example.org',
  base: process.env.BASE_PATH || '/',
  trailingSlash: 'always',
  output: 'static',
  integrations: [mdx(), sitemap()],
});
