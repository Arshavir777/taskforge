const DEFAULT_PATH = '/profile'

/** Only allow same-origin relative paths as redirect targets (prevents open redirects). */
export function safeNext(next: string | null): string {
  if (!next || !next.startsWith('/') || next.startsWith('//') || next.startsWith('/\\')) {
    return DEFAULT_PATH
  }
  return next
}
