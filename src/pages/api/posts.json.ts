import config from '../../config.json';
import { getAllPosts } from '../../lib/content';

export async function GET() {
	const siteUrl = 'https://astro-uzen-theme.pages.dev';
	const posts = await getAllPosts();
	return new Response(JSON.stringify({
		site: { title: config.siteTitle, description: config.siteDescription, url: siteUrl, license: 'MIT' },
		generated: new Date().toISOString(),
		count: posts.length,
		posts: posts.map(p => ({
			title: p.title, slug: p.slug, url: `${siteUrl}/posts/${p.slug}/`,
			description: p.description, pubDate: p.pubDate.toISOString(),
			author: p.author, category: p.category, tags: p.tags,
			series: p.series || null, readingTime: p.reading_time, featured: p.featured,
		})),
	}, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' } });
}
