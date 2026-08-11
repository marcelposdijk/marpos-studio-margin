import rss from '@astrojs/rss';
import { getAllPosts } from '../lib/content';

export async function GET(context) {
  const posts = await getAllPosts();

  return rss({
    title: 'Margin',
    description: 'A dark editorial Astro theme for magazines and blogs.',
    site: context.site,
    items: posts.map(post => ({
      title: post.title,
      description: post.description,
      pubDate: post.pubDate,
      link: `/posts/${post.slug}/`,
      categories: [post.category],
    })),
    customData: `<language>en-us</language>`,
  });
}
