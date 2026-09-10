import type { GuideMeta } from '~/types/guides'

let templatesMapPromise: Promise<any>

function normalizePath(path: string) {
  return path.replace(/\/$/, '').replace(/\/\d+[a-z]*\./gi, '/')
}

async function getTemplatesMap() {
  templatesMapPromise ??= import('virtual:guide-meta-map').then(m => m.default)
  return templatesMapPromise
}

/**
 * Loads the guide's metadata with its **pristine** template files — no saved
 * user solutions merged in. Shared by the page mount flow and the challenge
 * retake feature so both get identical, source-of-truth file contents.
 */
export async function loadGuideMeta(path: string): Promise<GuideMeta | undefined> {
  const templatesMap = await getTemplatesMap()
  const normalized = normalizePath(path)
  const result: GuideMeta | undefined = await templatesMap[normalized]?.().then((m: any) => m.meta) ?? undefined

  if (!result)
    return undefined

  // The virtual module exports a shared, mutable meta singleton. Deep-clone it
  // so downstream mutations (e.g. the page merging a saved passing solution
  // into `files`) never poison later loads — a retake must always see the
  // pristine template, and "reset challenge" must restore the broken starting
  // files.
  const clone = structuredClone(result)

  if (clone.files) {
    // In dev mode, always fetch the freshest files to bypass Vite/SSR caching
    if (import.meta.dev && import.meta.client) {
      for (const fname of Object.keys(clone.files)) {
        try {
          const filePath = `${normalized}/.template/files/${fname}`
          const res = await $fetch<{ content?: string }>(`/api/dev-template`, {
            query: { path: filePath.replace(/^\//, '') },
          })
          if (res && res.content !== undefined) {
            clone.files[fname] = res.content
          }
        }
        catch {
          // Fallback to cached content
        }
      }
    }
  }

  return clone
}
