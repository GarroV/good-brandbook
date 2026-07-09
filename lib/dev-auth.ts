// Dev-only auth bypass for local prototyping.
//
// Guarded by NODE_ENV: even if DISABLE_AUTH=1 is set in a production build, this
// returns false — the bypass cannot be shipped open. Only `next dev`
// (NODE_ENV=development) honours it.
export function isAuthDisabled(): boolean {
  return process.env.DISABLE_AUTH === '1' && process.env.NODE_ENV !== 'production'
}
