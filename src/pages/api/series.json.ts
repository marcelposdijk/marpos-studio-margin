import { getAllSeries } from '../../lib/content';

export async function GET() {
	const series = await getAllSeries();
	return new Response(JSON.stringify({ generated: new Date().toISOString(), count: series.length, series: series.map(s => ({ name: s.name, postCount: s.posts.length })) }, null, 2), {
		headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=3600' },
	});
}
