import { createHash } from 'node:crypto';
import { readFile, writeFile, readdir, mkdir, realpath } from 'node:fs/promises';
import { resolve, join, relative, isAbsolute, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse, serializeOuter } from 'parse5';
import sharp from 'sharp';

const widths = [320, 640, 960, 1280, 1600];
const formats = { avif: { quality: 50, effort: 4 }, webp: { quality: 78, effort: 4 } };
const defaultSizes = '(min-width: 768px) 680px, calc(100vw - 40px)';
const attr = (node, name) => node.attrs.find(a => a.name === name)?.value;
function setAttr(node, name, value) {
  const existing = node.attrs.find(a => a.name === name);
  if (existing) existing.value = String(value);
  else node.attrs.push({ name, value: String(value) });
}
function inside(root, path) {
  const rel = relative(root, path);
  return rel !== '..' && !rel.startsWith('../') && !isAbsolute(rel);
}
async function* htmlFiles(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) yield* htmlFiles(path);
    else if (entry.isFile() && entry.name.endsWith('.html')) yield path;
  }
}
function images(node, result = []) {
  if (node.tagName === 'img' && node.parentNode?.tagName !== 'picture') result.push(node);
  for (const child of node.childNodes || []) images(child, result);
  return result;
}

/** Only dist is changed. Original files and all content references stay intact. */
export async function optimizeSite({ outDir = 'dist', publicDir = 'public', basePath = process.env.BASE_PATH || '/' } = {}) {
  const output = resolve(outDir);
  const originals = await realpath(publicDir);
  const base = `/${basePath.split('/').filter(Boolean).join('/')}`.replace(/\/$/, '');
  const imagePrefix = `${base}/images/`;
  const cache = new Map();
  let imageCount = 0;

  async function variants(src) {
    if (cache.has(src)) return cache.get(src);
    const pending = (async () => {
      if (!src.startsWith(imagePrefix) || /[?#]/.test(src)) return null;
      const localPath = decodeURIComponent(src.slice(base.length + 1));
      if (!['.jpg', '.jpeg', '.png', '.webp', '.avif'].includes(extname(localPath).toLowerCase())) return null;
      const path = await realpath(join(originals, localPath));
      if (!inside(originals, path)) throw new Error(`Image points outside public: ${src}`);
      const bytes = await readFile(path);
      const metadata = await sharp(bytes, { animated: true }).metadata();
      // Preserve animation; never turn an animated upload into a still image.
      if ((metadata.pages || 1) > 1) return null;
      const rotated = [5, 6, 7, 8].includes(metadata.orientation);
      const width = rotated ? metadata.height : metadata.width;
      const height = rotated ? metadata.width : metadata.height;
      if (!width || !height) return null;
      const targetWidths = [...new Set([...widths.filter(w => w < width), Math.min(width, 1600)])];
      const key = createHash('sha256').update(bytes).update(JSON.stringify({ formats, targetWidths, rotate: true })).digest('hex').slice(0, 20);
      const directory = join(output, '_images', key);
      await mkdir(directory, { recursive: true });
      const sources = {};
      for (const [format, settings] of Object.entries(formats)) {
        sources[format] = [];
        for (const targetWidth of targetWidths) {
          const name = `${targetWidth}.${format}`;
          await sharp(bytes).rotate().resize({ width: targetWidth, withoutEnlargement: true }).toFormat(format, settings).toFile(join(directory, name));
          sources[format].push({ width: targetWidth, url: `${base}/_images/${key}/${name}` });
        }
      }
      return { width, height, sources };
    })();
    cache.set(src, pending);
    return pending;
  }

  for await (const file of htmlFiles(output)) {
    const html = await readFile(file, 'utf8');
    const document = parse(html, { sourceCodeLocationInfo: true });
    const replacements = [];
    for (const image of images(document)) {
      const src = attr(image, 'src');
      const location = image.sourceCodeLocation;
      if (!src || !location || attr(image, 'data-no-optimize') !== undefined || attr(image, 'srcset')) continue;
      const optimized = await variants(src);
      if (!optimized) continue;
      // Existing explicit dimensions and sizes remain authoritative.
      if (!attr(image, 'width') && !attr(image, 'height')) {
        setAttr(image, 'width', optimized.width);
        setAttr(image, 'height', optimized.height);
      }
      setAttr(image, 'decoding', 'async');
      if (!attr(image, 'loading')) setAttr(image, 'loading', 'lazy');
      const sizes = attr(image, 'sizes') || defaultSizes;
      const sourceTags = Object.entries(optimized.sources).map(([format, entries]) => {
        const node = { nodeName: 'source', tagName: 'source', namespaceURI: 'http://www.w3.org/1999/xhtml', attrs: [], childNodes: [] };
        setAttr(node, 'type', `image/${format}`);
        setAttr(node, 'srcset', entries.map(entry => `${entry.url} ${entry.width}w`).join(', '));
        setAttr(node, 'sizes', sizes);
        return serializeOuter(node);
      }).join('');
      // Keeping img.src on the original also preserves the full-size lightbox.
      replacements.push({ start: location.startOffset, end: location.endOffset, html: `<picture>${sourceTags}${serializeOuter(image)}</picture>` });
      imageCount++;
    }
    // Replace only image tags; do not reserialize scripts or the rest of the page.
    if (replacements.length) {
      let result = html;
      for (const replacement of replacements.sort((a, b) => b.start - a.start)) {
        result = result.slice(0, replacement.start) + replacement.html + result.slice(replacement.end);
      }
      await writeFile(file, result);
    }
  }
  const uniqueImages = (await Promise.all(cache.values())).filter(Boolean).length;
  return { imageCount, uniqueImages };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = await optimizeSite();
  console.log(`Optimized ${result.imageCount} image placements from ${result.uniqueImages} originals (AVIF + WebP, up to 1600px).`);
}
