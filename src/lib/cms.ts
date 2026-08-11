/**
 * cms.ts — Ink CMS data adapter
 *
 * Fetches posts from an Ink CMS instance at build time,
 * replacing Astro content collections with API-driven content.
 *
 * Set these in config.json → cms:
 *   url:    "https://ink-cms.example.com"
 *   token:  "ink_xxx" (API key with posts.read)
 */

import config from '../config.json';
import { marked } from 'marked';

marked.setOptions({ breaks: false, gfm: true });

export interface CMSPost {
  id: string;
  slug: string;
  title: string;
  description: string;
  body: string;
  pubDate: Date;
  author: string;
  category: string;
  tags: string[];
  featured: boolean;
  draft: boolean;
  cover_url: string | null;
  cover_alt: string | null;
  type: 'post' | 'page';
  series?: string | null;
  series_order?: number | null;
  reading_time?: number | null;
}

interface RawPost {
  id: string;
  slug: string;
  title: string;
  description?: string;
  body?: string;
  pub_date?: string;
  author?: string;
  category?: string;
  tags?: string | string[];
  featured?: number | boolean;
  draft?: number | boolean;
  cover_url?: string | null;
  cover_alt?: string | null;
  series?: string | null;
  series_order?: number | null;
  reading_time?: number | null;
}

const CMS_URL = (config as any).cms?.url || '';
const CMS_TOKEN = (config as any).cms?.token || '';

async function fetchAPI(path: string): Promise<any> {
  if (!CMS_URL) throw new Error('CMS URL not configured. Set cms.url in config.json');
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (CMS_TOKEN) headers['Authorization'] = `Bearer ${CMS_TOKEN}`;
  const res = await fetch(`${CMS_URL}/api${path}`, { headers });
  if (!res.ok) throw new Error(`CMS API error: ${res.status} ${res.statusText}`);
  return res.json();
}

function parseTags(raw: string | string[] | undefined): string[] {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try {
    const p = JSON.parse(raw);
    return Array.isArray(p) ? p : [];
  } catch {
    return [];
  }
}

function normalize(p: RawPost): CMSPost {
  return {
    id: p.id,
    slug: p.slug,
    title: p.title || 'Untitled',
    description: p.description || '',
    body: p.body || '',
    pubDate: new Date(p.pub_date || Date.now()),
    author: p.author || 'Unknown',
    category: p.category || 'Uncategorized',
    tags: parseTags(p.tags),
    featured: !!p.featured,
    draft: !!p.draft,
    cover_url: p.cover_url || null,
    cover_alt: p.cover_alt || null,
    type: (p as any).type || 'post',
    series: p.series || null,
    series_order: p.series_order ?? null,
    reading_time: p.reading_time ?? null,
  };
}

/** Fetch all published posts (drafts excluded) */
export async function getAllPosts(): Promise<CMSPost[]> {
  const data = await fetchAPI('/admin/posts?type=post');
  const posts = (data.posts || []).map(normalize);
  return posts
    .filter(p => !p.draft)
    .sort((a, b) => b.pubDate.valueOf() - a.pubDate.valueOf());
}

/** Fetch all pages (type=page) */
export async function getAllPages(): Promise<CMSPost[]> {
  const data = await fetchAPI('/admin/pages');
  const pages = (data.pages || []).map(normalize);
  return pages.filter(p => !p.draft);
}

/** Fetch a single page by slug */
export async function getPageBySlug(slug: string): Promise<CMSPost | null> {
  const pages = await getAllPages();
  return pages.find(p => p.slug === slug) || null;
}

/** Fetch a single post by slug */
export async function getPostBySlug(slug: string): Promise<CMSPost | null> {
  const posts = await getAllPosts();
  return posts.find(p => p.slug === slug) || null;
}

/** Get all unique categories with counts */
export async function getCategories(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  for (const p of posts) {
    map.set(p.category, (map.get(p.category) || 0) + 1);
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** Get all unique tags */
export async function getTags(): Promise<{ name: string; count: number }[]> {
  const posts = await getAllPosts();
  const map = new Map<string, number>();
  for (const p of posts) {
    for (const t of p.tags) {
      map.set(t, (map.get(t) || 0) + 1);
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

/** Get all series with their posts */
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
    .map(([name, sposts]) => ({
      name,
      posts: sposts.sort((a, b) => (a.series_order || 0) - (b.series_order || 0)),
    }))
    .sort((a, b) => b.posts.length - a.posts.length);
}

/** Render markdown body to HTML */
export function renderMarkdown(body: string): string {
  return marked.parse(body || '');
}

