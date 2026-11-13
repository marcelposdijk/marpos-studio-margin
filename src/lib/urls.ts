/** Prefix site-local URLs without changing stored content or external links. */
export function withBase<T extends string | undefined>(url: T): T {
  if (!url || !url.startsWith('/') || url.startsWith('//')) return url;
  const base = import.meta.env.BASE_URL.replace(/\/$/, '');
  if (!base || url === base || url.startsWith(`${base}/`)) return url;
  return `${base}${url}` as T;
}
