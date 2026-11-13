/**
 * content.ts — Unified content access layer
 *
 * Switches between local Markdown (Astro content collections)
 * and cloud CMS (Ink CMS API) based on config.json → contentMode.
 *
 * Pages import from HERE, never directly from getCollection or cms.ts.
 *
 * config.json:
 *   "contentMode": "local"   → use src/content/posts/*.md
 *   "contentMode": "cms"     → use Ink CMS API (requires cms.url + cms.token)
 */

import config from '../config.json';
import { getCollection } from 'astro:content';
import { estimateReadingTime } from './readingTime';
import { marked } from 'marked';
import hljs from 'highlight.js';

// ── Markdown renderer with syntax highlighting ───────────────
const renderer = new marked.Renderer();

(renderer as any).code = function(token: { text: string; lang?: string }): string {
	const lang = (token.lang || '').trim();
	let highlighted: string;
	if (lang && hljs.getLanguage(lang)) {
		try {
			highlighted = hljs.highlight(token.text, { language: lang }).value;
		} catch {
			highlighted = escapeHtml(token.text);
		}
	} else {
		// Auto-detect
		try {
			highlighted = hljs.highlightAuto(token.text).value;
		} catch {
			highlighted = escapeHtml(token.text);
		}
	}
	const label = lang || 'code';
	return `<pre data-language="${label}"><code class="hljs language-${lang || 'plaintext'}">${highlighted}</code></pre>`;
};

function escapeHtml(s: string): string {
	return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

marked.use({ renderer, breaks: false, gfm: true });

export type { CMSPost } from './cms';

import type { CMSPost } from './cms';

const MODE: 'local' | 'cms' = (config as any).contentMode || 'local';

// ── Local adapter: Astro content collections → CMSPost ──────
async function getLocalPosts(): Promise<CMSPost[]> {
	const entries = await getCollection('posts');
	return entries
		.filter(e => import.meta.env.DEV || !e.data.draft)
		.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf())
		.map(e => ({
			id: e.id,
			slug: e.id,
			title: e.data.title,
			description: e.data.description || '',
			body: e.body,
			pubDate: e.data.pubDate,
			author: e.data.author || 'Unknown',
			category: e.data.category || 'Uncategorized',
			tags: Array.isArray(e.data.tags) ? e.data.tags : [],
			featured: !!e.data.featured,
			draft: !!e.data.draft,
			cover_url: (e.data as any).image?.src || null,
			cover_alt: (e.data as any).image?.alt || null,
			type: 'post' as const,
			series: (e.data as any).series || null,
			series_order: (e.data as any).seriesOrder ?? null,
			reading_time: estimateReadingTime(e.body),
		}));
}

async function getLocalPages(): Promise<CMSPost[]> {
	const entries = await getCollection('pages');
	return entries.map(e => ({
		id: e.id,
		slug: e.id,
		title: e.data.title,
		description: (e.data as any).description || '',
		body: e.body,
		pubDate: new Date(),
		author: '',
		category: '',
		tags: [],
		featured: false,
		draft: false,
		cover_url: null,
		cover_alt: null,
		type: 'page' as const,
		series: null,
		series_order: null,
		reading_time: estimateReadingTime(e.body),
	}));
}

// ── CMS adapter: lazy-import to avoid fetch in local mode ────
async function getCMSPos(): Promise<CMSPost[]> {
	const cms = await import('./cms');
	return cms.getAllPosts();
}

async function getCMSPages(): Promise<CMSPost[]> {
	const cms = await import('./cms');
	return cms.getAllPages();
}

// ── Public API — same signatures regardless of mode ─────────

export async function getAllPosts(): Promise<CMSPost[]> {
	return MODE === 'cms' ? getCMSPos() : getLocalPosts();
}

export async function getAllPages(): Promise<CMSPost[]> {
	return MODE === 'cms' ? getCMSPages() : getLocalPages();
}

export async function getPageBySlug(slug: string): Promise<CMSPost | null> {
	const pages = await getAllPages();
	return pages.find(p => p.slug === slug) || null;
}

export async function getPostBySlug(slug: string): Promise<CMSPost | null> {
	const posts = await getAllPosts();
	return posts.find(p => p.slug === slug) || null;
}

export async function getCategories(): Promise<{ name: string; count: number }[]> {
	const posts = await getAllPosts();
	const map = new Map<string, number>();
	for (const p of posts) map.set(p.category, (map.get(p.category) || 0) + 1);
	return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export async function getTags(): Promise<{ name: string; count: number }[]> {
	const posts = await getAllPosts();
	const map = new Map<string, number>();
	for (const p of posts) for (const t of p.tags) map.set(t, (map.get(t) || 0) + 1);
	return [...map.entries()].map(([name, count]) => ({ name, count })).sort((a, b) => b.count - a.count);
}

export async function getAllSeries(): Promise<{ name: string; posts: CMSPost[] }[]> {
	const posts = await getAllPosts();
	const map = new Map<string, CMSPost[]>();
	for (const p of posts) {
		if (p.series) {
			if (!map.has(p.series)) map.set(p.series, []);
			map.get(p.series)!.push(p);
		}
	}
	return [...map.entries()]
		.map(([name, sposts]) => ({ name, posts: sposts.sort((a, b) => (a.series_order || 0) - (b.series_order || 0)) }))
		.sort((a, b) => b.posts.length - a.posts.length);
}

export function renderMarkdown(body: string): string {
	return marked.parse(body || '');
}

export const contentMode = MODE;
