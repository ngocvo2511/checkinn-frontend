/**
 * The login form lives on the home page. Community pages send signed-out visitors there with
 * `?login=1&next=<path>`, and after a customer signs in the home page returns them to `next`.
 */
export function loginHref(next: string): string {
  const target = safeNext(next);
  return target ? `/?login=1&next=${encodeURIComponent(target)}` : '/?login=1';
}

/**
 * Accepts only a same-site path such as `/community/posts/1?x=y`. Anything that could leave the site
 * (`//evil.example`, `/\evil.example`, `https://…`, `javascript:…`) is rejected, so `next` cannot be
 * used as an open redirect.
 */
export function safeNext(raw: string | null | undefined): string | null {
  if (!raw || raw.length > 2000) return null;
  if (!raw.startsWith('/') || raw.startsWith('//') || raw.startsWith('/\\')) return null;
  if (/[\u0000-\u001f\u007f]/.test(raw)) return null;
  return raw;
}
