# Live Code Preview System

## Architecture Overview

The live preview is an **almostnode-based** system where user code runs in a **real, full Node.js environment inside the browser** (via the local `almostnode` fork's `webcontainer` facade, a drop-in `@webcontainer/api` replacement). The preview output is displayed inside an **iframe**, communicating with the parent page via **`postMessage`-based RPC** (using the `birpc` library).

### High-Level Flow

1. **Templates** (`templates/vue/`, `templates/html/`, `templates/vue-sass/`) define base project files (e.g., a Vite + Vue project)
2. A **Nuxt build module** (`modules/template-loader.ts`) reads these directories at build time and produces virtual modules (`#build/templates/vue`, etc.)
3. When the user navigates to a lesson, the **guide store** (`stores/guide.ts`) calls `playgroundStore.mount()` with the lesson's custom files
4. The **playground store** (`stores/playground.ts`) boots a **WebContainer**, mounts files into its virtual filesystem, installs deps (`pnpm install`), and starts a **Vite dev server** inside the container
5. The dev server's URL is captured, stored in the **preview store** (`stores/preview.ts`), and rendered in the **`PanelPreviewClient`** iframe
6. The iframe and parent communicate via **RPC over `postMessage`** for color mode sync, version info, and console output

---

## Key Files

### Preview Panel Components

| File                                       | Purpose                                                                                                                    |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| `components/PanelPreview.vue`              | Container: URL bar, refresh button, info dropdown. Loads `PanelPreviewLoading` and `PanelPreviewClient` as async children. |
| `components/PanelPreviewClient.client.vue` | The actual iframe that shows the live preview. Sets up birpc RPC with the iframe content. Exposes the `iframe` ref.        |
| `components/PanelPreviewLoading.vue`       | Loading overlay: shows init/mount/install/start/polling status steps before the preview is ready.                          |
| `components/PlaygroundCodeDockNode.vue`    | Docking container: orchestrates which panel (editor, preview, console, terminal) renders in each dock slot.                |

### Stores

| File                   | Purpose                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `stores/preview.ts`    | Stores `location` (origin + fullPath), `url` (combined), `clientInfo` (Vue/Nuxt versions), and `pendingFullPath`. Provides `updateUrl()` and `setFullPath()`.                                                      |
| `stores/playground.ts` | Boots WebContainer (`WebContainer.boot()`), mounts files, runs `pnpm install`, starts Vite dev server, tracks status (init/mount/install/start/polling/ready/interactive/error). Handles HMR for template changes. |
| `stores/guide.ts`      | Calls `playgroundStore.init()` then `playgroundStore.mount()` with lesson-specific files. Tracks showing solutions, features, embedded docs.                                                                       |

### Templates

| File                    | Purpose                                                                               |
| ----------------------- | ------------------------------------------------------------------------------------- |
| `templates/index.ts`    | Dynamic import map for the three template types (vue, html, vue-sass)                 |
| `templates/types.ts`    | `TemplateOptions` interface (files + nuxtrc)                                          |
| `templates/vue.ts`      | Loads `#build/templates/vue` virtual module and merges with lesson-specific files     |
| `templates/html.ts`     | Same for HTML template                                                                |
| `templates/vue-sass.ts` | Same for Vue+Sass template                                                            |
| `templates/utils.ts`    | `filesToWebContainerFs()` - converts `VirtualFile[]` to WebContainer `FileSystemTree` |

### Template Files (on-disk, read at build time)

| File                                | Purpose                                                    |
| ----------------------------------- | ---------------------------------------------------------- |
| `templates/vue/index.html`          | Base HTML shell                                            |
| `templates/vue/src/main.ts`         | Vue app bootstrap + RPC bridge setup                       |
| `templates/vue/src/App.vue`         | Default "Vue 3 Playground" demo component                  |
| `templates/vue/vite.config.ts`      | Vite config with color mode injection plugin               |
| `templates/vue/package.json`        | Dependencies: `vue`, `birpc`, `vite`, `@vitejs/plugin-vue` |
| `templates/html/index.html`         | Minimal HTML template for plain JS demos                   |
| `templates/html/server.js`          | Node.js HTTP server (not Vite) for HTML template           |
| `templates/html/main.js`            | Minimal JS for HTML template                               |
| `templates/vue-sass/index.html`     | Same as vue template                                       |
| `templates/vue-sass/src/main.ts`    | Same RPC bridge as vue template                            |
| `templates/vue-sass/vite.config.ts` | Same color mode injection + Sass preprocessor options      |

### Communication / Types

| File                               | Purpose                                                                                                                                              |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `templates/console-interceptor.ts` | Injected into all HTML files at mount time. Intercepts `console.log/warn/error/info/debug/table/dir` and sends them via `postMessage` to the parent. |
| `types/rpc.ts`                     | `FrameFunctions` (parent calls on iframe: `onColorModeChange`) and `ParentFunctions` (iframe calls on parent: `onReady`, `onNavigate`)               |
| `types/console-output.ts`          | `LogPayload` and `LogLevel` types                                                                                                                    |

---

## How the Iframe Preview Works

### A. Template Loading

1. **Build time**: The `template-loader` module reads `templates/vue/`, `templates/html/`, `templates/vue-sass/` directories and generates virtual modules (`#build/templates/vue`, etc.) containing all file paths and their contents as a JSON-serialized `Record<string, string>`.
2. **Runtime**: When a lesson loads, `guide.mount()` calls `playgroundStore.mount(files, templateName)`.
3. In `playgroundStore.mount()`:
   ```ts
   const templates = templatesMap[templateName] // pre-loaded template files
   const objects = { ...templates, ...map } // merge with lesson files
   ```
   The merged file map includes everything: `index.html`, `package.json`, `vite.config.ts`, `src/main.ts`, `src/App.vue`, etc.
4. **Console interceptor injection**: For any `.html` file, `VirtualFile.fsTransform` is set to `injectHtmlScripts`, which prepends the console interceptor `<script>` before `</head>`. This happens only when writing to the WebContainer FS, not in the editor.

### B. WebContainer Lifecycle

1. `playgroundStore.init()`:
   - Calls `WebContainer.boot()` (a WASM-based full Node.js environment in the browser)
   - Loads templates via dynamic imports
   - Mounts files into the container using `wc.mount(filesToWebContainerFs(...))`
   - Calls `startServer()`
   - Listens to the `server-ready` event

2. `startServer()`:
   - Spawns `pnpm install --prefer-offline` (skipped if `node_modules` already exists)
   - Spawns `pnpm run dev` (runs Vite dev server inside the container on port 5173)
   - Has a fallback timeout of 5s if `server-ready` doesn't fire

3. On `server-ready`:
   ```ts
   wc.on('server-ready', (port, url) => {
     if (port === DEV_SERVER_PORT) {
       preview.location = { origin: url, fullPath: preview.pendingFullPath }
       preview.updateUrl()
       status.value = 'ready'
     }
   })
   ```

### C. Iframe Rendering

1. `preview.url` is set to something like `https://<webcontainer-url>.preview.webcontainer.io/` (or `http://localhost:5173/` in development).
2. `PanelPreview.vue` passes the URL to `PanelPreviewClient.client.vue`:
   ```vue
   <iframe v-if="preview.url" ref="iframe" :src="preview.url" ... />
   ```
3. **No `sandbox` attribute** on the preview iframe — it uses `allow="geolocation; microphone; camera; payment; autoplay; serial; cross-origin-isolated"`.
4. **URL updates**: When the user changes the URL bar or color mode changes, `PanelPreview.vue` calls `refreshIframe(true)`, which constructs a new URL with a `?dark=true/false` query param and sets `iframe.src` directly.

### D. Parent-Iframe Communication (birpc)

**Parent side** (`PanelPreviewClient.client.vue`):

```ts
const functions: ParentFunctions = {
  onReady(info: ClientInfo) { preview.clientInfo = info; syncColorMode() },
  onNavigate(path: string) { preview.location.fullPath = path },
}

rpc = createBirpc<FrameFunctions, ParentFunctions>(functions, {
  post(payload) {
    iframe.value?.contentWindow?.postMessage({ source: 'nuxt-playground-parent', payload }, '*')
  },
  on(fn) {
    window.addEventListener('message', (event) => {
      if (event.source !== iframe.value?.contentWindow)
        return
      if (event.data.source !== 'nuxt-playground-frame')
        return
      fn(event.data.payload)
    })
  },
})
```

**Iframe side** (`templates/vue/src/main.ts`):

```ts
const functions: FrameFunctions = {
  onColorModeChange(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  },
}

const rpc = createBirpc<ParentFunctions, FrameFunctions>(functions, {
  post(payload) {
    window.parent.postMessage({ source: 'nuxt-playground-frame', payload }, '*')
  },
  on(fn) {
    window.addEventListener('message', (event) => {
      if (event.data.source !== 'nuxt-playground-parent')
        return
      fn(event.data.payload)
    })
  },
})

const clientInfo: ClientInfo = { versionVue: vueVersion, versionNuxt: 'N/A' }
rpc.onReady(clientInfo)
```

**Color mode syncing** has a second path via `postMessage` directly:

- Parent sends: `{ source: 'nuxt-playground-color-mode', mode: 'dark'|'light' }`
- Iframe's Vite plugin injects a script that listens for this message and toggles `class="dark"` on `<html>`

### E. Console Output Flow

1. The **console interceptor** (`templates/console-interceptor.ts`, injected into HTML files via `VirtualFile.fsTransform`) wraps all `console.*` methods. It serializes arguments with rich type metadata and detects Vue reactive objects via `__v_isReactive` (works even when Vue is loaded as ESM without `window.Vue`).
2. When code in the iframe calls `console.log()`, the interceptor calls the original method (so it appears in DevTools) and also sends a serialized payload via `postMessage` with `source: 'nuxt-playground-frame'`.
3. `PanelPreviewClient` listens for these messages (guarded by `event.source` to only accept its own iframe) and calls `(window as any).executeLog(payload)`.
4. `PanelConsole.client.vue` registers `window.executeLog` on mount, which forwards logs through the shared `useConsoleOutput()` composable. The composable lazy-loads LunaConsole, manages the theme, and deserializes the payload back into rich JS objects (including `Proxy(Object)` reconstruction for Vue reactives).
5. Both `VueLive.client.vue` and `PanelConsole.client.vue` share the same console logic via `composables/useConsoleOutput.ts`, preventing drift between the two console implementations.

---

## CSS / Resets

### Main App (does NOT affect the preview)

The main app imports:

- `@unocss/reset/tailwind.css` — Tailwind Preflight reset
- `styles/base.css` — custom base styles (global `min-width: 0`, viewport sizing, etc.)

These cannot reach the preview iframe because the iframe loads from a different origin (the WebContainer URL). Browsers enforce cross-origin isolation.

### Template's Own CSS (applied INSIDE the preview)

The template's `index.html` has an inline reset:

```html
<style>
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }
  body {
    font-family: -apple-system, ...;
    background: #f5f5f5;
  }
  #app {
    min-height: 100vh;
  }
</style>
```

Plus the Vite config injects dark mode CSS:

```css
html:not(.dark) body {
  background: #ffffff;
  color: #2c3e50;
}
html.dark body {
  background: #101010;
  color: #e5e7eb;
}
body {
  transition:
    background-color 0.15s,
    color 0.15s;
}
```

These are served by the WebContainer's Vite server as part of the iframe's HTML document, so they **do** affect the preview content.

---

## Key Observations

- **No `srcdoc` usage**: The iframe loads content via a real URL (`:src="preview.url"`), not inline `srcdoc`.
- **Two `postMessage` channels**: (1) the **birpc RPC** channel for structured function calls, and (2) a **direct `postMessage`** channel for color mode + console logging.
- **The Vite `playground-color-mode` plugin** injects color mode handling directly into the iframe's HTML at build time, providing instant dark mode without waiting for Vue to mount.
- **Console interceptor is injected at WebContainer write time** (via `VirtualFile.fsTransform`), not in the editor — the user never sees the interceptor code in their file tree.
- **Cross-contamination prevention**: Both `PanelPreviewClient` and `VueLive.client.vue` filter console messages by `event.source === iframe.contentWindow`, so each console instance only processes logs from its own iframe.
- **Shared console composable**: `PanelConsole` and `VueLive` both use `composables/useConsoleOutput.ts`, which wraps LunaConsole lifecycle, theme management, and deserialization via `useConsoleDeserializer`. The `withDomReconstruction` option enables DOM element reconstruction for the playground panel (via `licia/toEl`).

## Diagram

```
┌──────────────────────────────────────────────────────────────────┐
│  Main Application (host page)                                    │
│                                                                  │
│  ┌────────────┐   ┌──────────────────┐   ┌───────────────────┐  │
│  │PanelPreview│──▶│PanelPreviewClient│   │ PanelConsole      │  │
│  │ (toolbar)  │   │ (.client.vue)    │   │ (.client.vue)     │  │
│  │            │   │                  │   │                   │  │
│  │ refresh,   │   │ <iframe>         │   │ LunaConsole       │  │
│  │ navigate,  │   │   :src=url       │   │ instance          │  │
│  │ version    │   │                  │   │                   │  │
│  └──────┬─────┘   └────────┬─────────┘   └────────▲──────────┘  │
│         │                  │ postMessage          │             │
│         │                  ▼                      │             │
│         │         birpc RPC bridge                │             │
│         │         (onReady, onNavigate,            │             │
│         │          onColorModeChange)              │             │
│         │                                          │             │
│         │         stores/preview.ts                │             │
│         │         (url, location, clientInfo)      │             │
│         └──────────────────────────────────────────┘             │
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ stores/playground.ts  (WebContainer orchestrator)        │   │
│  │                                                          │   │
│  │  1. WebContainer.boot()                                  │   │
│  │  2. wc.mount(files)                                      │   │
│  │  3. pnpm install                                         │   │
│  │  4. pnpm run dev (Vite dev server inside container)      │   │
│  │  5. server-ready → preview.url = url                     │   │
│  └──────────────────────────────────────────────────────────┘   │
│                          │                                       │
│                          ▼                                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │ WebContainer (in-browser WASM Node.js)                   │   │
│  │                                                          │   │
│  │  ┌──────────────────────────────────────────────────┐   │   │
│  │  │ Vite Dev Server (port 5173)                      │   │   │
│  │  │  - serves index.html + src/main.ts + App.vue     │   │   │
│  │  │  - injects dark mode CSS/JS via transformIndexHtml│   │   │
│  │  │  - HMR when files change                         │   │   │
│  │  └──────────────────────────────────────────────────┘   │   │
│  │                                                          │   │
│  │  Filesystem:                                             │   │
│  │    index.html      (with console-interceptor injected)   │   │
│  │    package.json                                          │   │
│  │    vite.config.ts                                        │   │
│  │    src/main.ts      (birpc RPC bridge)                   │   │
│  │    src/App.vue      (user-edited code)                   │   │
│  └──────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

## Hot Reload for Content Templates

When a `.template/files/` file changes in development:

1. The `template-loader` module's file watcher detects the change
2. It sends a Vite HMR event `template:update` with `{ filename, content }` to the client
3. The playground store handles this and writes the updated content to the WebContainer's virtual filesystem
4. Since Vite is running inside the WebContainer, the preview auto-updates via Vite HMR
5. The module also invalidates Vite's module graph and touches the sibling `.md` file to bust Nuxt Content cache

## Challenge Validation Suites

Checkable challenges declare a validation suite in their `.template/index.ts`:

```ts
export const meta: GuideMeta = {
  template: 'html',      // or 'vue' / 'vue-sass'
  validation: {
    file: '/__challenge__/suite.js',  // .js for static html, .ts for vue
  },
}
```

Suites are authored with a **shared vocabulary** — `check()` / `checks()` / `expect()` —
and are executed inside the WebContainer on the same origin as the preview iframe so
they can assert against the live DOM:

```ts
import { check, checks, expect } from './harness.js'   // './harness' for Vue

export default checks([
  check('Renders the greeting', {
    run({ doc }) {
      expect(doc.querySelector('#app p')?.textContent).toContain('Hello')
    },
  }),
])
```

### Shared authoring DSL

- `expect(actual)` — matchers (`toBe`, `toEqual`, `toBeTruthy`, `toContain`,
  `toMatch`, `toBeGreaterThan`, `not`, …). Throws a readable message on failure.
- `check(name, spec)` / `checks([...])` — the preferred, explicit form. Returns a
  suite whose `run(ctx)` produces the shared result shape.
- `describe` / `it` / `test` — minimal, **corrected** shims for migrating existing
  suites. The empty-suite rule applies here too.

### Result shape & message protocol

Both runtimes return the **same** `{ success, passed, tests, empty }` shape over the
same postMessage protocol:

- `run-suite` request (host → iframe) carries a unique **`id`**. The reply
  (`suite-result`, iframe → host) **echoes that id** so the host resolves the right
  pending promise even if suites overlap or a stale response arrives late.
- The host (`PanelPreviewClient`) validates the message `source` is the preview
  iframe's window and ignores replies with unknown/stale ids.
- **Empty suites fail explicitly.** A suite with zero checks never "passes" via the
  `[].every(...) === true` empty-trick. Both runtimes emit a single failing
  `{ name: 'suite', passed: false, message: 'Empty suite: …' }` entry with `empty: true`,
  and the host records it as a failed attempt, never a completion.

### Template-specific runtimes & `ctx`

| Template | Runner | `ctx.doc` | `ctx.mount` | Suite language |
|----------|--------|-----------|-------------|----------------|
| `vue` / `vue-sass` | Vite dev server + Vue Test Utils | ✅ | ✅ (`@vue/test-utils`) | `.ts` |
| `html` | **static `server.js` — no Vite, no npm deps** | ✅ | ❌ (`undefined`) | `.js` |

- `vue` / `vue-sass`: run under Vite, import the `.ts` suite (Vite transpiles), and can
  mount components with Vue Test Utils via `ctx.mount`.
- `html` (static): a dependency-free static server (`node server.js`, no
  `vite`/`@vitest/expect`/`chai` installs). Suites are authored as **plain JavaScript**
  (`.js`) because browsers can't natively import TypeScript. Only `ctx.doc` is available.

How it runs:

- The container starts the dev server (`pnpm run dev` → `node server.js` for the static
  `html` template, Vite for `vue`/`vue-sass`). The runtime entry imports the harness,
  which self-initializes a `run-suite` message listener.
- The harness is **injected, never authored**: `vue`/`vue-sass` `src/main.ts` imports it
  dynamically (and `main.js` does for templates that use it), while the static html
  `server.js` injects a `<script>` tag for it into the served document — each only when
  the preview URL carries a `?challenge=` query param pointing at the suite file.
  Checkable pages therefore never reference the harness/suite in their source, so the
  code the learner sees and edits stays clean; plain HTML demos skip the runtime entirely.
- `ChallengeCheck` / the toolbar both go through `useChallengeValidation`, which calls
  `window.__runChallengeSuite(file)` (exposed by `PanelPreviewClient`) — a single shared
  path so all UI surfaces report consistent results.
- The harness `import()`s the suite (Vite transpiles `.ts`; the static server serves
  `.js` natively), runs it against the live same-origin `document`, and replies with the
  shared `suite-result` shape (including the request id).
- `PanelPreviewClient` resolves the pending promise by id, and the UI renders pass/fail
  per check. Completion is recorded only for a non-empty, fully-passing suite (see the
  `db/challenges` layer, which filters by `status === 'passed'`).

### Scaffolding challenges

`packages/create-content` (`content` CLI) generates a `.template` for new challenges:
- static `html` → `__challenge__/suite.js` with an explicit failing TODO check so a
  fresh scaffold never silently passes.
- `vue`/`vue-sass` → `__challenge__/suite.ts`, `ctx.mount`-compatible (Vue Test Utils).

### Debugging the challenge flow

Set `window.__challengeDebug = true` in the browser console before interacting with a
challenge to enable the `[challenge-debug]` logs. These are emitted by the host-side
challenge plumbing (`ChallengeCheck`, `useChallengeValidation`, `PanelPreview`,
`PanelPreviewClient`) and cover:

- the "Check my work" click (`check button clicked`)
- the suite bridge lifecycle (`runSuite called`, `sending run-suite`,
  `suite-result received`, timeouts, `cancelPendingSuites`, `markChallengeNotReady`,
  iframe `onLoad`)
- validation outcomes and IndexedDB writes (`runValidation: decision`,
  `recording PASS`, `recording ATTEMPT (fail)`)

The flag is independent of `window.__almostnodeDebug` (container/HMR debugging) — set
either or both as needed.

## Quizzes

Quizzes are **static-knowledge assessments** (multiple-choice + true/false), authored
in a shared **quiz bank** and rendered by the `::quiz` MDC block. Unlike challenges,
quizzes never boot a WebContainer — there is no harness, no iframe, and no postMessage
protocol. They are fully client-side.

### The quiz bank

Each quiz lives in its own folder under `quizzes/<id>/`:

```
quizzes/
  basics-reactivity/
    index.yaml          # SHARED structure (edited once, never copied)
    en.yaml             # strings
    es_mx.yaml
    de.yaml             # add when a new locale lands
```

**`index.yaml` — the shared structure.** Question types, option **ids** (and their
order), correct answers and the pass threshold. Changing an answer, the threshold, or
an option list happens here **once**, for every locale:

```yaml
passThreshold: 80
feedback: submit
questions:
  - id: interpolation
    type: mcq
    options: [single-braces, double-braces, square-brackets, parentheses]
    answer: [double-braces]
  - id: ref-reactive
    type: tf
    options: ['true', 'false']
    answer: ['true']
```

`tf` questions must have exactly 2 options and exactly one answer; `mcq` options may
share multiple correct answers. Options are referenced by **id**, never by index, so
reordering or re-labeling options in one language cannot silently break answers in
another.

**`<locale>.yaml` — strings only**, keyed by the same ids. All string fields
(`title`, `prompt`, `options`, `explanation`) are **Markdown**: bold, italic, inline
code, links, and fenced code blocks all render. Multi-line content uses YAML block
scalars (`|`):

```yaml
basics-reactivity:
  title: Vue Basics Checkpoint
  questions:
    interpolation:
      prompt: Which syntax does Vue use to interpolate a value into a template?
      options:
        single-braces: '`{ value }`'
        double-braces: '`{{ value }}`'
      explanation: |
        Vue uses double curly braces — e.g. `{{ message }}`.
```

### Referencing a quiz in a lesson

Use the MDC block anywhere in a lesson's markdown:

```md
::quiz{id="basics-reactivity"}
```

- The quiz resolves for the **active locale**; a locale without strings falls back to
  `en`, and missing option labels fall back to the option id.
- Progress is recorded per page: the block's `sessionName` defaults to the normalized
  lesson path (numeric prefixes stripped), overridable per block:
  `::quiz{id="ref-unwrapping" sessionName="refs"}`.
- **Reusable:** the same id may appear in multiple lessons (e.g. a mid-lesson
  checkpoint + a chapter review).
- A standalone quiz lesson is a docs-only lesson (`defaultLayout: 'docs'`) with a
  minimal `.template/index.ts` — no playground mounts.

### Resolution & data flow

- `modules/template-loader.ts` registers the `virtual:quiz-map` module. It scans
  `quizzes/*/`, parses the YAML (`js-yaml`), **validates invariants** at load, and
  exposes `{ id → { structure, strings } }` as a build-time payload (SSR-safe).
- `composables/useQuiz.ts` resolves a quiz for the active locale
  (`useQuiz(id) → useAsyncData`) and exposes pure `gradeQuiz()` readers.
- `components/content/Quiz.vue` (`::quiz`) renders the questions, grades a submission,
  and renders strings through the **MDC runtime** (`MDC` component, auto-registered by
  `@nuxtjs/mdc`).

### Interaction & grading

- **Submit-then-grade** (V1): the learner selects answers freely, then clicks
  "Check answers". Selections are mutable until submit.
- A question is correct only when the selected ids **exactly** match `answer`
  (no partial credit for multi-select).
- `percentage = round(correct / total * 100)`; `passed = percentage >= passThreshold`.
- Unlimited retakes; "Retake" clears the selections.
- Immediate per-question feedback is designed for but **not implemented** — `index.yaml`
  must keep `feedback: submit` (the loader rejects other values).

### Persistence

`db/quizzes` (Dexie `quizzes` table, added in `db.version(3)`) record each submission:
`sessionName`, `status` (`passed`/`failed`), `passedAt`, `attempts`, and `bestScore`
(best 0-100 percentage). `useQuizProgress` live-queries passed quizzes. Quiz progress
is **independent** of challenge progress — passing one never marks the other.

### Load-time invariant validation

The quiz-map loader throws (build) or warns (dev) on structural problems, and warns on
string-coverage gaps:

- `answer` ids that aren't options; duplicate question ids; `tf` without 2 options or
  with >1 answer; empty answers; out-of-range `passThreshold`; `feedback !== 'submit'`.
- a locale file missing a prompt or an option label for any question.

Add a new quiz folder and it appears in the map automatically; edit any YAML during
development and the watcher invalidates `virtual:quiz-map` without a dev restart.

## Debugging the Container (almostnode)

Set `window.__almostnodeDebug = true` in the browser console **before** triggering a
playground mount. All diagnostic output appears in both the browser console and the
xterm terminal panel via the `amoxtli:vite-diag` custom event.

Diagnostics gated behind this flag:

| Probe | Source | What it checks |
|-------|--------|----------------|
| `logViteDiagnostics` | `playground.ts` | Vite version + chunk.js shape in node_modules |
| `logViteBinHead` | `playground.ts` | First 5 lines of `vite/bin/vite.js` (patched?) |
| `logModuleDiagnostics` | `playground.ts` | `node:module` shim — `createRequire` presence |
| `logModuleDiagnostics2` | `playground.ts` | `require('vite')` success + `createServer` type |
| `logHmrBridgeDiagnostics` | `playground.ts` | **Probe 2**: `createServer` wrapped by almostnode? **Probe 3**: ws shim `_setupHmrBridge` present? |
| `logBroadcastChannelProbe` | `playground.ts` | BroadcastChannel('vite-hmr-bridge') reachable from parent? |
| `checkHmrBridge` | `PanelPreviewClient.client.vue` | **Probe 1**: Fetched `@vite/client` contains HMR bridge shim? |

To run all probes manually: `window.__viteDiag()` (only registered when debug is on).

---

## Interactive Terminal & Console Filtering

### jsh Shell

Pressing **Ctrl+C** in the terminal panel kills the running Vite process, displays `^C`, and drops into an interactive **jsh** shell with a `$ ` prompt.

`jsh` is a custom command registered in almostnode's `child_process.ts` before the bash instance is created. It implements a minimal REPL loop:

- Reads stdin via the global `_activeProcessStdin` EventEmitter (set by the streaming spawn path).
- Writes output to `_streamStdout` / `_streamStderr`.
- Builtins: `cd`, `pwd`, `exit`.
- Subcommands are dispatched through `ctx.exec()` (just-bash interpreter), which re-claims `_activeProcessStdin` after each command returns.
- Respects `_abortSignal` so Ctrl+C during a subcommand also works.

### Console Output Filtering (host-page noise)

`wrapGlobalConsole()` replaces `globalThis.console` methods to route output into the process stream (and thus the terminal panel). Problem: host-page libraries (e.g., `floating-vue`) also call `console.log` from the browser context, and their noise leaks into the terminal.

**Solution**: call-stack inspection. When a wrapped console method fires, `new Error().stack` is captured and checked against `HOST_PAGE_FRAME_PATTERNS` (currently `['floating-vue', 'floatingVue', 'FloatingVue']`). If any pattern matches, the call is skipped (not routed to the stream).

Container code (Vite, user modules) has stack frames with virtual FS paths (`/node_modules/...`, `/src/...`) and does not match host-page patterns, so it passes through normally.

To filter additional host-page libraries, add their names to the `HOST_PAGE_FRAME_PATTERNS` array in `child_process.ts`.

### Streaming Callback Race Condition Fix

almostnode's module-level globals (`_streamStdout`, `_streamStderr`, `_abortSignal`, `_activeProcessStdin`) mean only one process's output can be active at a time. A race existed where `clearStreamingCallbacks()` was called inside `spawnProcess`'s exec callback, which could wipe a newly spawned process's callbacks on fast kill→respawn. The fix removes that call — `setStreamingCallbacks()` in the next process overwrites the globals anyway.
