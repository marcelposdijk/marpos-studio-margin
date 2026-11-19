import { withBase } from './urls';

const libraryPath = '/src/assets/images/library/';
const images = import.meta.glob<string>(
  '/src/assets/images/library/**/*.{jpg,jpeg,png,webp,gif,avif}',
  { eager: true, import: 'default', query: '?url&no-inline' },
);

export function imageUrl(src: string): string {
  const path = src.startsWith('/images/') ? libraryPath + src.slice('/images/'.length) : src;
  if (!path.startsWith(libraryPath)) return withBase(src);
  const url = images[path];
  if (url) return url;
  if (src.startsWith(libraryPath)) throw new Error(`Library image not found: ${src}`);
  return withBase(src);
}
