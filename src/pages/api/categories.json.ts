import { getCategories } from '../../lib/content';

export async function GET() {
	const cats = await getCategories();
	return new Response(JSON.stringify({ generated: new Date().toISOString(), count: cats.length, categories: cats }, null, 2), {
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
	});
}
