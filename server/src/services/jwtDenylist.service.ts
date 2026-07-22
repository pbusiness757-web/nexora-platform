/**
 * In-memory JWT denylist.
 * Entries are auto-expired when the token's own exp passes.
 * On process restart the list clears — acceptable for stateless JWTs
 * where the cookie is also cleared on logout.
 */

// token → expiry (unix seconds)
const denied = new Map<string, number>();

/** Call on logout. expSeconds is the token's own `exp` field. */
export function addToDenylist(token: string, expSeconds: number): void {
  denied.set(token, expSeconds);
  _prune();
}

/** Returns true if this token has been explicitly invalidated. */
export function isDenied(token: string): boolean {
  const exp = denied.get(token);
  if (exp === undefined) return false;
  if (exp < _nowSeconds()) {
    denied.delete(token);
    return false;
  }
  return true;
}

function _nowSeconds(): number {
  return Math.floor(Date.now() / 1000);
}

/** Remove entries whose tokens have already expired naturally. */
function _prune(): void {
  const now = _nowSeconds();
  for (const [token, exp] of denied) {
    if (exp < now) denied.delete(token);
  }
}
