<script setup lang="ts">
import type { LogPayload } from '~/types/console-output'
import type { ClientInfo, FrameFunctions, ParentFunctions } from '~/types/rpc'
import { createBirpc } from 'birpc'
import { challengeDebug } from '~/composables/useChallengeDebug'

const ui = useUiState()
const colorMode = useColorMode()
const preview = usePreviewStore()

const iframe = ref<HTMLIFrameElement>()

// Set up birpc to communicate with iframe
const functions: ParentFunctions = {
  onReady(info: ClientInfo) {
    // Don't access playground store in docs mode
    preview.clientInfo = info
    syncColorMode()
  },
  onNavigate(path: string) {
    preview.location.fullPath = path
  },
}

let rpc: any = null

// Suite validation runs: resolved/awaited by useChallengeValidation.
// Keyed by request id so concurrent or stale responses can't resolve the
// wrong pending call.
const suiteHandlers = new Map<string, { resolve: (payload: any) => void, timer?: ReturnType<typeof setTimeout> }>()
const challengeReadyWaiters = new Set<(ready: boolean) => void>()
let challengeReady = false
let challengeGeneration = 0
let suiteRequestSeq = 0

function nextRequestId(): string {
  suiteRequestSeq += 1
  return `${Date.now()}-${suiteRequestSeq}`
}

/**
 * Runs the in-iframe challenge suite and resolves with its result via the
 * harness's postMessage bridge (`nuxt-playground-challenge`). A unique request
 * id is sent and echoed back so the correct handler resolves even if suites
 * overlap or a stale reply arrives late.
 */
async function runSuite(file: string, timeoutMs = 15_000): Promise<any> {
  const fail = (message: string) => ({
    success: false,
    empty: true,
    passed: false,
    tests: [{ name: 'suite', passed: false, message }],
  })
  const frame = iframe.value?.contentWindow
  challengeDebug('runSuite called', {
    file,
    frameExists: !!frame,
    challengeReady,
    challengeGeneration,
    suiteHandlersPending: suiteHandlers.size,
  })
  if (!frame) {
    challengeDebug('runSuite: no iframe contentWindow, returning fail')
    return fail('Preview is not ready yet.')
  }
  if (!challengeReady) {
    const generation = challengeGeneration
    challengeDebug('runSuite: waiting for challenge-ready (generation', generation, ')')
    const ready = await new Promise<boolean>((resolve) => {
      let pingCount = 0
      let pingTimer: ReturnType<typeof setInterval> | undefined
      let timeoutTimer: ReturnType<typeof setTimeout> | undefined
      const onReady = (ready: boolean) => {
        challengeReadyWaiters.delete(onReady)
        if (pingTimer)
          clearInterval(pingTimer)
        if (timeoutTimer)
          clearTimeout(timeoutTimer)
        resolve(ready)
      }
      challengeReadyWaiters.add(onReady)
      const ping = () => {
        pingCount++
        challengeDebug('challenge-ping #', pingCount)
        frame.postMessage({
          source: 'nuxt-playground-parent-challenge',
          payload: { method: 'challenge-ping' },
        }, '*')
      }
      ping()
      pingTimer = setInterval(ping, 100)
      timeoutTimer = setTimeout(() => {
        challengeDebug('challenge-ready timeout after 1.5s, falling back')
        onReady(false)
      }, Math.min(timeoutMs, 1500))
    })
    if (generation !== challengeGeneration || iframe.value?.contentWindow !== frame) {
      challengeDebug('runSuite: generation mismatch or iframe changed, returning fail')
      return fail('Preview challenge runtime is not ready yet.')
    }
    // Older mounted harnesses do not support the readiness handshake. Fall
    // back to the original request protocol after the short grace period.
    if (!ready) {
      challengeDebug('runSuite: harness did not respond to ping, assuming ready')
      challengeReady = true
    }
  }

  return new Promise((resolve) => {
    const id = nextRequestId()
    challengeDebug('sending run-suite', { id, file })
    let timer: ReturnType<typeof setTimeout> | undefined
    const entry: { resolve: (payload: any) => void, timer?: ReturnType<typeof setTimeout> } = {
      resolve: (payload) => {
        if (timer)
          clearTimeout(timer)
        challengeDebug('suite-handler resolved', { id, passed: payload?.passed, cancelled: payload?.cancelled })
        resolve(payload)
      },
    }
    suiteHandlers.set(id, entry)
    timer = setTimeout(() => {
      suiteHandlers.delete(id)
      challengeDebug('run-suite TIMEOUT after', timeoutMs, 'ms', { id })
      entry.resolve(fail('Timed out running the challenge suite.'))
    }, timeoutMs)
    entry.timer = timer
    frame.postMessage({
      source: 'nuxt-playground-parent-challenge',
      payload: { method: 'run-suite', file, id },
    }, '*')
  })
}

onMounted(() => {
  rpc = createBirpc<FrameFunctions, ParentFunctions>(functions, {
    eventNames: ['onColorModeChange'],
    post(payload) {
      iframe.value?.contentWindow?.postMessage({
        source: 'nuxt-playground-parent',
        payload,
      }, '*')
    },
    on(fn) {
      window.addEventListener('message', (event) => {
        if (event.source !== iframe.value?.contentWindow)
          return
        if (typeof event.data !== 'object')
          return
        if (event.data.source !== 'nuxt-playground-frame')
          return
        fn(event.data.payload)
      })
    },
    onTimeoutError(method) {
      console.warn(`[birpc] timeout on "${method}" (iframe may not be ready yet)`)
      return true
    },
  })

  // Expose the preview iframe's live document so challenge validation can
  // inspect rendered DOM (see composables/useChallengeValidation.ts).
  ;(window as any).__getPreviewDocument = () => iframe.value?.contentDocument ?? null

  window.addEventListener('message', handleConsoleMessage)
  window.addEventListener('message', handleColorModeRequest)
  window.addEventListener('message', handleSuiteMessage)
  ;(window as any).__runChallengeSuite = runSuite
})

onBeforeUnmount(() => {
  window.removeEventListener('message', handleConsoleMessage)
  window.removeEventListener('message', handleColorModeRequest)
  window.removeEventListener('message', handleSuiteMessage)
  if ((window as any).__getPreviewDocument)
    delete (window as any).__getPreviewDocument
  if ((window as any).__runChallengeSuite)
    delete (window as any).__runChallengeSuite
})

function handleSuiteMessage(event: MessageEvent) {
  // Only accept replies from the preview iframe's own window so spoofed
  // messages from other frames can't resolve a pending suite.
  if (event.source !== iframe.value?.contentWindow)
    return
  if (typeof event.data !== 'object')
    return
  if (event.data.source !== 'nuxt-playground-challenge')
    return
  const { payload } = event.data
  if (payload?.method === 'challenge-ready') {
    challengeDebug('received challenge-ready')
    challengeReady = true
    for (const resolve of challengeReadyWaiters)
      resolve(true)
    challengeReadyWaiters.clear()
    return
  }
  if (!payload || payload.method !== 'suite-result')
    return
  if (typeof payload.id !== 'string')
    return
  const handler = suiteHandlers.get(payload.id)
  if (!handler) {
    challengeDebug('suite-result handler NOT FOUND for id:', payload.id, '(stale?)')
    return // stale/unknown request id — ignore
  }
  challengeDebug('suite-result received, resolving handler', { id: payload.id, passed: payload.passed })
  suiteHandlers.delete(payload.id)
  handler.resolve(payload)
}

function handleConsoleMessage(event: MessageEvent) {
  if (event.source !== iframe.value?.contentWindow)
    return
  if (typeof event.data !== 'object')
    return
  if (event.data.source !== 'nuxt-playground-frame')
    return

  const { method, args } = event.data.payload || {}
  if (method === 'onConsoleLog' && args?.[0]) {
    const payload = args[0] as LogPayload
    if (typeof window !== 'undefined' && (window as any).executeLog) {
      (window as any).executeLog(payload)
    }
  }
}

function handleColorModeRequest(event: MessageEvent) {
  if (typeof event.data !== 'object')
    return
  if (event.data.source === 'nuxt-playground-color-mode-request') {
    syncColorMode()
  }
}

function syncColorMode() {
  rpc?.onColorModeChange(colorMode.value)
  iframe.value?.contentWindow?.postMessage({
    source: 'nuxt-playground-color-mode',
    mode: colorMode.value,
  }, '*')
}

/**
 * Resolve every in-flight suite validation as "cancelled" so callers get an
 * immediate response instead of hanging for 15 s after an iframe refresh.
 */
function cancelPendingSuites() {
  challengeDebug('cancelPendingSuites', { waiters: challengeReadyWaiters.size, pending: suiteHandlers.size })
  for (const resolve of challengeReadyWaiters)
    resolve(false)
  challengeReadyWaiters.clear()
  for (const [id, entry] of suiteHandlers) {
    clearTimeout(entry.timer)
    entry.resolve({
      id,
      method: 'suite-result',
      success: false,
      empty: true,
      passed: false,
      cancelled: true,
      tests: [{ name: 'suite', passed: false, message: 'Validation cancelled — preview was refreshed.' }],
    })
  }
  suiteHandlers.clear()
}

function markChallengeNotReady() {
  challengeDebug('markChallengeNotReady', { was: challengeReady, generation: challengeGeneration, next: challengeGeneration + 1 })
  challengeReady = false
  challengeGeneration += 1
}

/**
 * TEMPORARY DEBUG — Probe 1: Fetch the served @vite/client module through the
 * virtual proxy and check if the almostnode HMR bridge shim was injected.
 * Results go to browser console + xterm panel via amoxtli:vite-diag event.
 */
async function checkHmrBridge() {
  if (!(window as any).__almostnodeDebug)
    return
  if (!preview.url)
    return
  try {
    const clientUrl = new URL('@vite/client', preview.url).href
    const response = await fetch(clientUrl)
    const text = await response.text()
    const hasShim = text.includes('window.__almostnodeViteHmrBridge')
    const detail = [
      `[HMR-DIAG] Probe 1 — @vite/client from: ${clientUrl}`,
      `[HMR-DIAG] length: ${text.length}`,
      `[HMR-DIAG] HAS_SHIM: ${hasShim}`,
      `[HMR-DIAG] first 200: ${text.slice(0, 200)}`,
    ].join('\n')
    // eslint-disable-next-line no-console
    console.log(detail)
    window.dispatchEvent(new CustomEvent<string>('amoxtli:vite-diag', { detail }))
  }
  catch (e) {
    const detail = `[HMR-DIAG] Probe 1 FAILED: ${e instanceof Error ? e.message : e}`
    console.error(detail)
    window.dispatchEvent(new CustomEvent<string>('amoxtli:vite-diag', { detail }))
  }
}

function onLoad() {
  challengeDebug('iframe onLoad', { challengeReady, challengeGeneration })
  syncColorMode()
  checkHmrBridge()
}

watch(
  colorMode,
  syncColorMode,
  { flush: 'sync' },
)

defineExpose({
  iframe,
  cancelPendingSuites,
  markChallengeNotReady,
})
</script>

<template>
  <iframe
    v-if="preview.url && preview.location.origin"
    ref="iframe"
    :src="preview.url"
    :class="{ 'pointer-events-none': ui.isPanelDragging }"
    bg-transparent h-full w-full inset-0 absolute allow="geolocation; microphone; camera; payment; autoplay; serial; cross-origin-isolated"
    @load="onLoad"
  />
</template>
