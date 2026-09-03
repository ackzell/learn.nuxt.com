/* eslint-disable node/prefer-global/process */

import { readFile, watch } from 'node:fs/promises'
import { createServer } from 'node:http'
import { extname, join } from 'node:path'

// `process` is intentionally NOT imported: both real Node and almostnode inject
// it as a global, and importing `node:process` is an extra resolution seam that
// the container runtime does not need. The old static-server template (which
// worked) used the global, so we stay consistent with it.
const MIME = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.mjs': 'application/javascript',
  '.css': 'text/css',
}

const INJECTED_SCRIPT_BLOCKING = `
<script>
  (function() {
    if (!document.documentElement.classList.contains('dark')
      && sessionStorage.getItem('playground-dark') === 'true') {
      document.documentElement.classList.add('dark')
    }
  })();
<\/script>`

const INJECTED_STYLE = `
<style>
  html:not(.dark) body { background: #ffffff; color: #2c3e50; }
  html.dark body { background: #101010; color: #e5e7eb; }
  body { transition: background-color 0.15s, color 0.15s; }
</style>`

const INJECTED_SCRIPT = `
<script>
  window.addEventListener('message', function(e) {
    if (e.data && e.data.source === 'nuxt-playground-color-mode') {
      const dark = e.data.mode === 'dark'
      sessionStorage.setItem('playground-dark', dark)
      document.documentElement.classList.toggle('dark', dark)
    }
  });
  window.parent.postMessage({ source: 'nuxt-playground-color-mode-request' }, '*');

  let reloadVersion = 0;
  async function checkForReload() {
    try {
      const response = await fetch('/__reload', { cache: 'no-store' });
      if (!response.ok)
        return;
      const nextVersion = Number(await response.text());
      if (reloadVersion && nextVersion !== reloadVersion)
        location.reload();
      reloadVersion = nextVersion;
    } catch {}
  }
  checkForReload();
  setInterval(checkForReload, 1000);
<\/script>`

/**
 * Build a static HTTP server for the HTML template. The file watcher / live
 * reload is intentionally skipped during tests by leaving `watchFs = false` so
 * the watcher doesn't keep the process (or the test) alive.
 */
// Plain declaration + `export {}` keeps the bare binding for both Node ESM
// and almostnode's ESM→CJS transform.
function createHtmlServer({ watchFs = true, cwd = process.cwd() } = {}) {
  const clients = new Set()
  let reloadVersion = 0

  let watcher
  if (watchFs) {
    watcher = watch('.', { recursive: true })
    ;(async () => {
      for await (const event of watcher) {
        if (
          event.filename?.endsWith('.html')
          || event.filename?.endsWith('.js')
          || event.filename?.endsWith('.mjs')
          || event.filename?.endsWith('.css')
        ) {
          reloadVersion += 1
          for (const res of clients)
            res.write(String(reloadVersion))
        }
      }
    })()
  }

  const server = createServer(async (req, res) => {
    if (req.url === '/__reload' && watchFs) {
      res.writeHead(200, {
        'Content-Type': 'text/plain',
        'Cache-Control': 'no-cache',
      })
      res.end(String(reloadVersion))
      return
    }

    try {
      const url = new URL(req.url, 'http://localhost')
      const isDark = url.searchParams.get('dark') === 'true'
      const pathname = url.pathname

      const file = pathname === '/' ? '/index.html' : pathname
      const mime = MIME[extname(file)] ?? 'text/plain'
      // `pathname` begins with `/`; resolve against `cwd` (avoid join treating
      // it as absolute by stripping the leading slash).
      const rel = file.replace(/^\/+/, '')
      let content = await readFile(join(cwd, rel), 'utf-8')

      if (mime === 'text/html') {
        if (isDark) {
          if (content.includes('<html')) {
            content = content.includes('class="')
              ? content.replace('class="', 'class="dark ')
              : content.replace('<html', '<html class="dark"')
          }
          else {
            content = `<html class="dark">${content}`
          }
        }

        content = content.includes('<head>')
          ? content.replace('<head>', `<head>${INJECTED_SCRIPT_BLOCKING}`)
          : INJECTED_SCRIPT_BLOCKING + content

        content = content.includes('</head>')
          ? content.replace('</head>', `${INJECTED_STYLE}${INJECTED_SCRIPT}</head>`)
          : content + INJECTED_STYLE + INJECTED_SCRIPT
      }

      res.writeHead(200, { 'Content-Type': mime })
      res.end(content)
    }
    catch {
      res.writeHead(404)
      res.end('Not found')
    }
  })

  server.closeFileWatcher = () => watcher?.return?.()

  return server
}

export { createHtmlServer }

// Automatic start when run directly (`node server.js`).
//
// `import.meta.main` is NOT available in almostnode's runtime (its ESM->CJS
// transform only exposes url/dirname/filename on import.meta), so we detect
// the entry by checking the resolved script path in `process.argv[1]` instead.
// When this module is imported by a test, `process.argv[1]` points at the
// test runner, not `server.js`, so the side-effect listen is skipped.
if (process.argv[1]?.split('/').pop() === 'server.js') {
  const port = Number(process.env.PORT || 5173)
  const server = createHtmlServer()
  server.listen(port, '0.0.0.0', () => {
    // eslint-disable-next-line no-console
    console.log(`HTML dev server listening on http://0.0.0.0:${port}`)
  })
}
