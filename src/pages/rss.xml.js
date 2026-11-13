import rss from '@astrojs/rss';
import { withBase } from '../lib/urls';
import config from '../config.json';
import { getAllPosts } from '../lib/content';

export async function GET(context) {
  const posts = await getAllPosts();

  return rss({
    title: config.siteTitle,
    description: config.siteDescription,
    site: context.site,
    items: posts.map(post => ({
      title: post.title,
      description: post.description,
      pubDate: post.pubDate,
      link: withBase(`/posts/${post.slug}/`),
      categories: [post.category],
    })),
    customData: `<language>en-us</language>`,
  });
}
