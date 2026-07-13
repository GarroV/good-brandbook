import { promises as fs } from 'fs'
import path from 'path'

// Local filesystem mirror of downloaded layouts. Only active when the app runs
// locally with LOCAL_LIBRARY_DIR set — a deployed cloud server has no access to
// the user's machine, so this is a hard no-op in production.
export function localLibraryDir(): string | null {
  if (process.env.NODE_ENV === 'production') return null
  const dir = process.env.LOCAL_LIBRARY_DIR?.trim()
  return dir ? dir : null
}

function safeName(value: string): string {
  return value
    .replace(/[^\p{L}\p{N}\-_. ]/gu, '_')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80)
}

// Best-effort write into "02 Generated/<format>/". Never throws — a filesystem
// hiccup must not break the download the user is waiting for. Returns the path
// written, or null when disabled / on failure.
export async function saveDownloadToLocalLibrary(
  format: string,
  filename: string,
  bytes: Uint8Array,
): Promise<string | null> {
  const root = localLibraryDir()
  if (!root) return null
  try {
    const dir = path.join(root, '02 Generated', safeName(format))
    await fs.mkdir(dir, { recursive: true })
    const full = path.join(dir, safeName(filename))
    await fs.writeFile(full, bytes)
    return full
  } catch {
    return null
  }
}
