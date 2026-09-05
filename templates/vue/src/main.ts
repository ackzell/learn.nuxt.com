import type { ClientInfo, FrameFunctions, ParentFunctions } from '../../../types/rpc'
import { createBirpc } from 'birpc'
import { createApp } from 'vue'
import App from './App.vue'

const app = createApp(App)

// The challenge runtime imports @vitest/expect + chai, which are heavy and
// (in the container dev server) fragile to serve. Load it lazily: only when
// the host actually pings/runs a challenge, mirroring the html template.
let challengeStarted = false
window.addEventListener('message', (event) => {
  if (challengeStarted)
    return
  if (typeof event.data !== 'object' || event.data === null)
    return
  if (event.data.source !== 'nuxt-playground-parent-challenge')
    return
  challengeStarted = true
  import('../__challenge__/harness').then(({ startChallengeRuntime }) => {
    startChallengeRuntime('/__challenge__/suite.ts')
  }).catch(() => {
    // Guard has already been armed; if the import fails the host will get a
    // suite-result failure on its next run-suite instead of a crashing preview.
  })
})

// Initialize RPC bridge to communicate with parent frame (amoxtli-vue)
const functions: FrameFunctions = {
  onColorModeChange(mode) {
    document.documentElement.classList.toggle('dark', mode === 'dark')
  },
}

const rpc = createBirpc<ParentFunctions, FrameFunctions>(functions, {
  post(payload) {
    window.parent.postMessage({
      source: 'nuxt-playground-frame',
      payload,
    }, '*')
  },
  on(fn) {
    window.addEventListener('message', (event) => {
      if (typeof event.data !== 'object')
        return
      if (event.data.source !== 'nuxt-playground-parent')
        return
      fn(event.data.payload)
    })
  },
})

// Signal to parent that Vue app is ready with actual installed versions
let vueVersion = 'unknown'
try {
  const vuePackage = await fetch('/node_modules/vue/package.json').then(r => r.json())
  vueVersion = vuePackage.version
}
catch (e) {
  vueVersion = (window as any).__vueVersion || 'unknown'
}

const clientInfo: ClientInfo = {
  versionVue: vueVersion,
  versionNuxt: 'N/A',
}
rpc.onReady(clientInfo)

app.mount('#app')
