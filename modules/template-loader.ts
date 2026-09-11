import type { ViteDevServer } from 'vite'
import type { QuizMapEntry, QuizStrings, QuizStructure } from '~/types/quiz'
import { existsSync, readFileSync, utimesSync } from 'node:fs'
import fs from 'node:fs/promises'
import process from 'node:process'
import { fileURLToPath } from 'node:url'
import { addTemplate, addVitePlugin, defineNuxtModule } from '@nuxt/kit'
import { watch } from 'chokidar'
import fg from 'fast-glob'
import yaml from 'js-yaml'
import { join, relative, resolve } from 'pathe'
import { TEMPLATE_TYPES } from '~/types/guides'
import { isBinaryFile } from '../lib/binary'
import { generateChallengeSuiteFile } from '../lib/challenge-banking'
import { validateQuizStrings, validateQuizStructure } from '../lib/quiz-validation'

export default defineNuxtModule({
  meta: {
    name: 'template-loader',
  },

  setup(_, nuxt) {
    let viteServer: ViteDevServer | undefined
    const templateModules = new Set<string>()

    // Use a hook to ensure we have the live Vite server instance
    nuxt.hook('vite:serverCreated', (server, { isClient }) => {
      if (isClient) {
        viteServer = server
      }
    })

    if (nuxt.options.dev) {
      const watcher = watch(
        join(process.cwd(), 'content'),
        { ignoreInitial: true },
      )

      watcher.on('all', async (event: string, path: string) => {
        if (!path.includes('.template/files') && !path.includes('.template/solutions'))
          return

        if (!viteServer) {
          // console.error('Vite server not available for HMR')
          return
        }

        // console.warn(`Template ${event}:`, path)

        // 1. READ RAW CONTENT FOR WEBCONTAINER
        let content = ''
        try {
          content = isBinaryFile(path)
            ? (await fs.readFile(path)).toString('base64')
            : await fs.readFile(path, 'utf-8')
        }
        catch {
          if (event !== 'unlink')
            return // Ignore if file was just deleted
        }

        const isSolution = path.includes('.template/solutions/')
        const subDir = isSolution ? '.template/solutions/' : '.template/files/'
        const filesBase = path.substring(0, path.indexOf(subDir) + subDir.length)
        const filename = relative(filesBase, path) // → "src/App.vue"

        // 2. BROADCAST TO FRONTEND
        if (event === 'change' || event === 'add') {
          viteServer.ws.send({
            type: 'custom',
            event: 'template:update',
            data: { filename, content },
          })
        }

        // 3. TOUCH index.ts TO FORCE VITE NATIVE HMR AND CACHE BUSTING
        try {
          const indexTsPath = path.replace(/\.template\/(files|solutions)\/.*$/, '.template/index.ts')
          const now = new Date()
          utimesSync(indexTsPath, now, now)
        }
        catch (err) {
          console.error('Failed to touch index.ts:', err)
        }

        // 4. INVALIDATE VITE MODULE GRAPH (CLIENT + SSR)
        const invalidateGraph = (graph: any) => {
          if (!graph || !graph.urlToModuleMap)
            return
          for (const [url, mod] of graph.urlToModuleMap) {
            if (url.includes('.template')) {
              graph.invalidateModule(mod)
            }
          }
        }

        invalidateGraph(viteServer.moduleGraph)
        if ((viteServer as any).environments?.ssr) {
          invalidateGraph((viteServer as any).environments.ssr.moduleGraph)
        }
        else if ((viteServer as any).ssrModules) {
          // Fallback for older Vite
        }

        // 4. INVALIDATE VITE GLOB VIRTUAL MODULES
        for (const [url, mod] of viteServer.moduleGraph.urlToModuleMap) {
          if (url.includes('glob') || url.includes('.template')) {
            viteServer.moduleGraph.invalidateModule(mod)
            // console.warn('Invalidated glob/template module:', url)
          }
        }

        // 5. MODIFY SIBLING MD TO BUST NUXT CONTENT CACHE
        // Nuxt Content hashes the raw file content and caches it. If we only touch the timestamp,
        // it skips the `beforeParse` hook entirely! We must change the actual raw text.
        try {
          const parentDir = path.split('.template')[0]!
          const siblingFiles = await fs.readdir(parentDir)
          const mdFile = siblingFiles.find(f => f.endsWith('.md'))
          if (mdFile) {
            const mdPath = join(parentDir, mdFile)
            let mdContent = await fs.readFile(mdPath, 'utf-8')
            if (mdContent.endsWith(' ')) {
              mdContent = mdContent.slice(0, -1)
            }
            else {
              mdContent += ' '
            }
            await fs.writeFile(mdPath, mdContent, 'utf-8')
          }
        }
        catch {
          // console.error('Failed to modify sibling MD:', err)
        }

        // Note: full-reload was removed here. The editor receives live
        // updates via the custom template:update HMR event, and the
        // markdown panel refreshes via the MD touch + Nuxt Content HMR.
      })

      // Watch the quizzes/ bank so YAML edits invalidate virtual:quiz-map
      // without a full dev-server restart.
      const quizWatcher = watch(
        join(process.cwd(), 'quizzes'),
        { ignoreInitial: true },
      )
      quizWatcher.on('all', () => {
        if (!viteServer)
          return
        for (const [url, mod] of viteServer.moduleGraph.urlToModuleMap) {
          if (url.includes('quiz-map')) {
            viteServer.moduleGraph.invalidateModule(mod)
          }
        }
      })
      nuxt.hook('close', () => quizWatcher.close())

      // Watch the challenges/ bank so suite/string edits invalidate the
      // .template/index.ts transforms that bake the generated suites (mirrors
      // the quizzes watcher). The transform also registers the bank files via
      // addWatchFile; this is a belt-and-braces invalidation so HMR re-runs
      // the bake even for lessons whose transform graph was never requested.
      const challengeWatcher = watch(
        join(process.cwd(), 'challenges'),
        { ignoreInitial: true },
      )
      challengeWatcher.on('all', () => {
        if (!viteServer)
          return
        const invalidate = (graph: any) => {
          if (!graph?.urlToModuleMap)
            return
          for (const [url, mod] of graph.urlToModuleMap) {
            if (url.includes('.template'))
              graph.invalidateModule(mod)
          }
        }
        invalidate(viteServer.moduleGraph)
        if ((viteServer as any).environments?.ssr) {
          invalidate((viteServer as any).environments.ssr.moduleGraph)
        }
      })
      nuxt.hook('close', () => challengeWatcher.close())
    }

    // Default Templates
    const templates = TEMPLATE_TYPES
    for (const name of templates) {
      addTemplate({
        filename: `templates/${name}.ts`,
        getContents: async () => {
          const dir = fileURLToPath(new URL(`../templates/${name}`, import.meta.url))
          const files = await fg('**/*.*', {
            ignore: ['**/node_modules/**', '**/.git/**', '**/.nuxt/**'],
            dot: true,
            cwd: dir,
            onlyFiles: true,
            absolute: true,
          })

          const filesMap: Record<string, string> = {}
          await Promise.all(
            files.sort().map(async (filename) => {
              const content = isBinaryFile(filename)
                ? (await fs.readFile(filename)).toString('base64')
                : await fs.readFile(filename, 'utf-8')
              filesMap[relative(dir, filename)] = content
            }),
          )
          return `export default ${JSON.stringify(filesMap)}`
        },
      })
    }

    // The Transformer Plugin
    addVitePlugin({
      name: 'nuxt-playground:template-loader',
      enforce: 'pre',

      async transform(code, id) {
        if (!id.match(/\/\.template\/index\.ts/))
          return

        templateModules.add(id)
        // console.warn('Transforming template index:', id)

        async function getFileMap(dir: string) {
          const files = await fg('**/*.*', {
            ignore: ['**/node_modules/**', '**/.git/**', '**/.nuxt/**'],
            dot: true,
            cwd: dir,
            onlyFiles: true,
            absolute: false,
          })

          if (!files.length)
            return undefined

          const filesMap: Record<string, string> = {}
          await Promise.all(
            files.sort().map(async (filename) => {
              const fullPath = resolve(dir, filename)
              const content = isBinaryFile(fullPath)
                ? (await fs.readFile(fullPath)).toString('base64')
                : await fs.readFile(fullPath, 'utf-8')
              // console.warn('reading:', fullPath, content.slice(0, 50))
              filesMap[filename] = content
            }),
          )
          return filesMap
        }

        const filesDir = resolve(id, '../files')
        const solutionsDir = resolve(id, '../solutions')

        const [files, solutions] = await Promise.all([
          getFileMap(filesDir),
          getFileMap(solutionsDir),
        ])

        // Tell Vite these files are dependencies of this transform.
        // When they change, Vite will invalidate the cached transform
        // and re-run it on next request (fixing stale content on refresh).
        if (files) {
          // for (const [fname, fcontent] of Object.entries(files)) {
          for (const [fname] of Object.entries(files)) {
            this.addWatchFile(resolve(filesDir, fname))
            // console.warn(`  ${fname}: ${(fcontent as string).length} chars, first 80: ${(fcontent as string).slice(0, 80)}`)
          }
        }
        if (solutions) {
          for (const fname of Object.keys(solutions)) {
            this.addWatchFile(resolve(solutionsDir, fname))
          }
        }

        // Challenge lessons reference a shared bank (validation.challenge);
        // generate the mounted suite from it, baking in locale strings.
        const generatedFiles = await generateChallengeSuiteFile({
          code,
          sourceId: id,
          files,
          addWatchFile: file => this.addWatchFile(file),
        })

        return {
          code: [
            code,
            `meta.files = ${JSON.stringify(generatedFiles)}`,
            `meta.solutions = ${JSON.stringify(solutions)}`,
            '',
          ].join('\n'),
          map: null,
        }
      },
    })

    // ── Virtual module: guide-meta-map ──
    // import.meta.glob doesn't work in vite 8 / rolldown builds (resolves to empty).
    // We scan content/**/.template/index.ts with fast-glob at build time and generate
    // a virtual module with lazy-loading imports for each lesson's meta.
    const virtualId = 'virtual:guide-meta-map'
    const resolvedVirtualId = `\0${virtualId}`

    addVitePlugin({
      name: 'nuxt-playground:guide-meta-map',
      enforce: 'pre',

      resolveId(id) {
        if (id === virtualId)
          return resolvedVirtualId
      },

      async load(id) {
        if (id !== resolvedVirtualId)
          return

        const contentDir = join(process.cwd(), 'content')
        const files = await fg(['**/.template/index.ts'], {
          cwd: contentDir,
          dot: true,
          absolute: true,
          onlyFiles: true,
          ignore: ['**/node_modules/**'],
        })

        const entries: [string, string][] = files
          .sort()
          .map((filePath) => {
            // contentDir = /Users/.../content, filePath = /Users/.../content/en/01.intro/01.context/.template/index.ts
            const relativePath = relative(contentDir, filePath)
            // en/01.intro/01.context/.template/index.ts
            const routePath = `/${
              relativePath
                .replace(/\/\.template\/index\.ts$/, '')
                .split('/')
                .map(part => part.replace(/^\d+[a-z]*\./i, ''))
                .join('/')
            }`

            return [routePath, filePath]
          })

        const importLines = entries.map(([route, filePath]) =>
          `  ${JSON.stringify(route)}: () => import(${JSON.stringify(filePath)})`,
        )

        return `const map = {\n${importLines.join(',\n')}\n};\nexport default map;\n`
      },
    })

    // ── Virtual module: guide-session-map ──
    // Maps normalized route path → sessionName for every lesson, so nav
    // components can show challenge completion status without loading the
    // full lesson metadata (which would be heavy). Mirrors guide-meta-map.
    const sessionVirtualId = 'virtual:guide-session-map'
    const sessionResolvedId = `\0${sessionVirtualId}`

    addVitePlugin({
      name: 'nuxt-playground:guide-session-map',
      enforce: 'pre',

      resolveId(id) {
        if (id === sessionVirtualId)
          return sessionResolvedId
      },

      async load(id) {
        if (id !== sessionResolvedId)
          return

        const contentDir = join(process.cwd(), 'content')
        const files = await fg(['**/.template/index.ts'], {
          cwd: contentDir,
          dot: true,
          absolute: true,
          onlyFiles: true,
          ignore: ['**/node_modules/**'],
        })

        const entries = files
          .sort()
          .map((filePath) => {
            const relativePath = relative(contentDir, filePath)
            const routePath = `/${
              relativePath
                .replace(/\/\.template\/index\.ts$/, '')
                .split('/')
                .map(part => part.replace(/^\d+[a-z]*\./i, ''))
                .join('/')
            }`

            // Extract `sessionName` from the GuideMeta using a non-executing
            // regex so we don't need to import every lesson module at build time.
            let sessionName = ''
            try {
              const source = readFileSync(filePath, 'utf-8')
              const m = source.match(/sessionName\s*:\s*['"`]([^'"`]+)['"`]/)
              if (m?.[1])
                sessionName = m[1]
            }
            catch {}

            return [routePath, sessionName]
          })

        const lines = entries.map(([route, session]) =>
          `  ${JSON.stringify(route)}: ${JSON.stringify(session)}`,
        )

        return `export default {\n${lines.join(',\n')}\n};\n`
      },
    })

    // ── Virtual module: quiz-map ──
    // Scans the `quizzes/` bank (structure + per-locale string YAML) and
    // exposes every quiz as one data payload. The `Quiz` component resolves a
    // quiz by id and the current locale from this map. Mirrors the
    // guide-meta-map/guide-session-map virtual modules.
    const quizMapVirtualId = 'virtual:quiz-map'
    const quizMapResolvedId = `\0${quizMapVirtualId}`

    addVitePlugin({
      name: 'nuxt-playground:quiz-map',
      enforce: 'pre',

      resolveId(id) {
        if (id === quizMapVirtualId)
          return quizMapResolvedId
      },

      async load(id) {
        if (id !== quizMapResolvedId)
          return

        const quizzesDir = join(process.cwd(), 'quizzes')
        let quizDirs: string[] = []
        try {
          quizDirs = await fg('*', {
            cwd: quizzesDir,
            onlyDirectories: true,
            deep: 1,
            ignore: ['**/node_modules/**'],
          })
        }
        catch {
          // quizzes/ dir may not exist yet — that's fine, empty map.
        }

        const entries: Record<string, QuizMapEntry> = {}

        for (const dir of quizDirs.sort()) {
          const quizPath = join(quizzesDir, dir)
          const indexFile = join(quizPath, 'index.yaml')
          if (!existsSync(indexFile))
            continue

          const structure = yaml.load(readFileSync(indexFile, 'utf-8')) as QuizStructure | undefined
          if (!structure) {
            console.warn(`[quiz-map] "${dir}" has an empty index.yaml — skipping.`)
            continue
          }
          try {
            validateQuizStructure(structure)
          }
          catch (e) {
            if (nuxt.options.dev) {
              console.warn(`[quiz-map] invalid quiz "${dir}":`, (e as Error).message)
              continue
            }
            throw e
          }

          const strings: Record<string, QuizStrings> = {}
          const localeFiles = await fg('*.yaml', {
            cwd: quizPath,
            onlyFiles: true,
            ignore: ['index.yaml'],
          })
          for (const fname of localeFiles.sort()) {
            const locale = fname.replace(/\.yaml$/, '')
            const parsed = yaml.load(readFileSync(join(quizPath, fname), 'utf-8')) as
              Record<string, QuizStrings> | undefined
            const quizStrings = parsed?.[dir]
            if (!quizStrings) {
              console.warn(`[quiz-map] "${dir}" (${locale}) is missing its "${dir}" block — skipped.`)
              continue
            }
            const problems = validateQuizStrings(structure, quizStrings)
            if (problems.length) {
              console.warn(`[quiz-map] "${dir}" (${locale}):`)
              for (const p of problems)
                console.warn(`  - ${p}`)
            }
            strings[locale] = quizStrings
          }

          entries[dir] = { id: dir, structure, strings }
        }

        return `export default ${JSON.stringify(entries)}\n`
      },
    })
  },
})
