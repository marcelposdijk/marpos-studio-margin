#!/usr/bin/env python3
"""Migrate markdown posts from astro-uzen-theme to Ink CMS via API."""
import json, re, os, sys
from pathlib import Path

import urllib.request

CMS_URL = "https://ink-cms.2849288402.workers.dev"
CMS_TOKEN = "ink_migrate_dcd25dc516d6a7577cc0a4a3c45702a2"

POSTS_DIR = Path("/home/keith/.nanobot/workspace/astro-uzen-theme/src/content/posts")

def parse_frontmatter(text):
    """Parse YAML-like frontmatter from markdown."""
    m = re.match(r'^---\n(.*?)\n---\n(.*)', text, re.DOTALL)
    if not m:
        return {}, text
    fm_text, body = m.group(1), m.group(2).strip()
    data = {}
    for line in fm_text.split('\n'):
        line = line.strip()
        if not line or line.startswith('#'):
            continue
        if ':' in line:
            key, val = line.split(':', 1)
            key = key.strip()
            val = val.strip().strip('"').strip("'")
            if val.lower() in ('true', 'false'):
                data[key] = val.lower() == 'true'
            else:
                data[key] = val
    return data, body

def extract_image_url(fm):
    """Extract image URL from frontmatter text."""
    m = re.search(r'url:\s*"?(.+?)"?\s*$', fm, re.MULTILINE)
    return m.group(1) if m else None

def extract_image_alt(fm):
    m = re.search(r'alt:\s*"?(.+?)"?\s*$', fm, re.MULTILINE)
    return m.group(1) if m else None

def create_post(post_data):
    """Create a post via CMS API."""
    url = f"{CMS_URL}/api/admin/posts"
    req = urllib.request.Request(url, method='POST')
    req.add_header('Content-Type', 'application/json')
    req.add_header('Authorization', f'Bearer {CMS_TOKEN}')
    req.add_header('User-Agent', 'InkCMS-Migrate/1.0')
    body = json.dumps(post_data).encode('utf-8')
    try:
        resp = urllib.request.urlopen(req, body)
        result = json.loads(resp.read())
        print(f"  ✓ Created: {post_data['title']} (slug: {post_data.get('slug', 'auto')})")
        return result
    except urllib.error.HTTPError as e:
        err = e.read().decode()
        print(f"  ✗ Failed: {post_data['title']} — {e.code} {err}")
        return None
    except Exception as e:
        print(f"  ✗ Error: {post_data['title']} — {e}")
        return None

def main():
    posts = sorted(POSTS_DIR.glob('*.md'))
    print(f"Found {len(posts)} posts to migrate\n")

    # Read raw frontmatter for image extraction
    for md_file in posts:
        raw = md_file.read_text()
        # Extract frontmatter block for image parsing
        fm_match = re.match(r'^---\n(.*?)\n---', raw, re.DOTALL)
        fm_block = fm_match.group(1) if fm_match else ''
        
        fm, body = parse_frontmatter(raw)
        
        cover_url = extract_image_url(fm_block)
        cover_alt = extract_image_alt(fm_block)
        
        post_data = {
            'title': fm.get('title', md_file.stem),
            'slug': md_file.stem,
            'description': fm.get('description', ''),
            'body': body,
            'category': fm.get('category', 'Uncategorized'),
            'author': fm.get('author', 'Unknown'),
            'featured': fm.get('featured', False),
            'draft': fm.get('draft', False),
        }
        if cover_url:
            post_data['cover_url'] = cover_url
            post_data['cover_alt'] = cover_alt or ''
        if fm.get('series'):
            post_data['series'] = fm['series']
            if fm.get('seriesOrder'):
                post_data['series_order'] = int(fm['seriesOrder'])
        if fm.get('pubDate'):
            post_data['pub_date'] = fm['pubDate'] + 'T00:00:00Z'
        
        print(f"Migrating: {post_data['title']}")
        create_post(post_data)

    print("\nDone!")

if __name__ == '__main__':
    main()
