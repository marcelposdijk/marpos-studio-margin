import { withBase } from '../lib/urls';
export function GET({ site }: { site: URL }) {
  return new Response(`User-agent: *
Allow: /

Sitemap: ${new URL(withBase('/sitemap-index.xml'), site)}
`, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
}
