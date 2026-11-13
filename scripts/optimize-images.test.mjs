import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import sharp from 'sharp';
import { parse } from 'parse5';
import { optimizeSite } from './optimize-images.mjs';

function nodes(node, tag) {
  return [...(node.tagName === tag ? [node] : []), ...(node.childNodes || []).flatMap(child => nodes(child, tag))];
}
const attr = (node, name) => node.attrs.find(a => a.name === name)?.value;

test('optimizes covers and Markdown images under a Pages path without changing originals, animation or scripts', async () => {
  const root = await mkdtemp(join(tmpdir(), 'margin-images-'));
  try {
    const publicDir = join(root, 'public');
    const outDir = join(root, 'dist');
    await mkdir(join(publicDir, 'images'), { recursive: true });
    await mkdir(join(outDir, 'posts'), { recursive: true });
    // EXIF rotation makes the displayed width 480 rather than the encoded 240.
    const original = await sharp({ create: { width: 240, height: 480, channels: 3, background: '#426b58' } }).jpeg().withMetadata({ orientation: 6 }).toBuffer();
    await writeFile(join(publicDir, 'images', 'portrait.jpg'), original);
    const animated = await sharp({ create: { width: 16, height: 32, channels: 3, pageHeight: 16, background: '#426b58' } }).gif({ delay: [100, 100], loop: 0 }).toBuffer();
    await writeFile(join(publicDir, 'images', 'animated.gif'), animated);
    const script = '<script>const text = "<img src=\\"/demo/images/portrait.jpg\\">";</script>';
    await writeFile(join(outDir, 'index.html'), `<html><body><img src="/demo/images/portrait.jpg" alt="A &amp; B" sizes="400px" loading="eager">${script}</body></html>`);
    await writeFile(join(outDir, 'posts', 'index.html'), '<html><body><div class="prose"><img src="/demo/images/portrait.jpg" alt="Story"><img src="https://example.org/remote.jpg"><img src="/demo/images/animated.gif"></div></body></html>');
    const result = await optimizeSite({ publicDir, outDir, basePath: '/demo/' });
    assert.deepEqual(result, { imageCount: 2, uniqueImages: 1 });
    assert.deepEqual(await readFile(join(publicDir, 'images', 'portrait.jpg')), original);
    assert.deepEqual(await readFile(join(publicDir, 'images', 'animated.gif')), animated);
    const html = await readFile(join(outDir, 'index.html'), 'utf8');
    assert.ok(html.includes(script), 'inline scripts must remain byte-for-byte unchanged');
    const document = parse(html);
    assert.equal(nodes(document, 'picture').length, 1);
    const image = nodes(document, 'img')[0];
    assert.equal(attr(image, 'src'), '/demo/images/portrait.jpg', 'original remains the fallback and lightbox source');
    assert.equal(attr(image, 'width'), '480');
    assert.equal(attr(image, 'height'), '240');
    assert.equal(attr(image, 'alt'), 'A & B');
    assert.equal(attr(image, 'loading'), 'eager');
    const sources = nodes(document, 'source');
    assert.deepEqual(sources.map(source => attr(source, 'type')), ['image/avif', 'image/webp']);
    for (const source of sources) {
      assert.equal(attr(source, 'sizes'), '400px');
      const entries = attr(source, 'srcset').split(', ');
      assert.equal(entries.length, 2, 'small originals must not be enlarged');
      for (const entry of entries) {
        const [url, width] = entry.split(' ');
        const metadata = await sharp(join(outDir, url.replace('/demo/', ''))).metadata();
        assert.equal(metadata.width, Number(width.slice(0, -1)));
        assert.ok(metadata.width <= 480);
        assert.equal(metadata.height, metadata.width / 2);
      }
    }
    const story = parse(await readFile(join(outDir, 'posts/index.html'), 'utf8'));
    assert.equal(nodes(story, 'picture').length, 1, 'remote and GIF images stay unchanged');
    const dirs = await readdir(join(outDir, '_images'));
    assert.equal(dirs.length, 1, 'reuse generated files across pages');
    assert.deepEqual(await optimizeSite({ publicDir, outDir, basePath: '/demo/' }), { imageCount: 0, uniqueImages: 0 }, 'already optimized markup stays untouched');
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
