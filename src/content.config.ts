import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const postsCollection = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/posts' }),
	schema: z.object({
		title: z.string(),
		description: z.string(),
		pubDate: z.coerce.date(),
		author: z.string(),
		image: z.object({
			src: z.string(),
			alt: z.string()
		}).optional(),
		category: z.string(),
		tags: z.array(z.string()).default([]),
		featured: z.boolean().default(false),
		draft: z.boolean().default(false),
		series: z.string().optional(),
		seriesOrder: z.number().optional(),
	}),
});

const pagesCollection = defineCollection({
	loader: glob({ pattern: '**/*.md', base: './src/content/pages' }),
	schema: z.object({
		title: z.string(),
		description: z.string().optional(),
		showSocial: z.boolean().default(false),
	}),
});

const photosCollection = defineCollection({
  loader: glob({ base: './content', pattern: 'photos/*.json',
    generateId: ({ entry }) => entry.split('/').pop()!.replace(/\.json$/, ''),
  }),
  schema: z.object({
    title: z.string().min(1),
    image: z.object({ src: z.string().startsWith('/src/assets/images/library/'), alt: z.string().min(1) }),
    thumbnail: z.object({ src: z.string().startsWith('/src/assets/images/library/'), alt: z.string() }).optional(),
    categories: z.array(z.string()).default([]),
    credit: z.string().default(''),
    sourceUrl: z.string().url().optional(),
    visible: z.boolean().default(true),
    order: z.number().default(0),
  }),
});

export const collections = {
	'posts': postsCollection,
	'pages': pagesCollection,
	'photos': photosCollection,
};
