/**
 * Resolve a path inside `public/` against Vite's configured base.
 *
 * GitHub Pages serves this project from `/oscar/`, so a literal `/images/x.jpg`
 * would 404 there while still working in local dev. Every public asset goes
 * through this helper so the same source builds correctly at any base.
 */
export function asset(path: string): string {
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/+$/, '')}/${path.replace(/^\/+/, '')}`;
}
