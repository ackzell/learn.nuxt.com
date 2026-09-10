<script setup lang="ts">
import { loadGuideMeta } from '~/composables/useGuideMeta'
import { challenges } from '~/db/challenges'

const router = useRouter()
const route = useRoute()
const guide = useGuideStore()
const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value > 0 && windowWidth.value < 768)

// Load guide meta eagerly so guide.features.defaultLayout is set before first render.
// This ensures isDocsOnlyMode is correct and the code panel won't mount for docs-only lessons.
const { data: initialMeta } = await useAsyncData(
  `guide-meta-${route.path}`,
  () => loadGuideMeta(route.path),
)

if (initialMeta.value) {
  guide.setGuideMeta(initialMeta.value)
}

async function mount(path: string) {
  const guideMeta = await loadGuideMeta(path)

  // If the challenge was already passed, restore the user's saved file contents
  // in the container so the editor shows the code they used to pass (not the
  // broken starting files). This is applied via `filesOverride` only — the
  // store's meta stays pristine so "Reset challenge" (from the show-solution
  // toggle) and "Retake challenge" always return to the broken starting files.
  let restoreFiles: Record<string, string> | undefined
  if (guideMeta?.sessionName && guideMeta?.files) {
    const record = await challenges.getByName(guideMeta.sessionName)
    if (record?.status === 'passed' && record.files) {
      restoreFiles = { ...guideMeta.files, ...record.files }
    }
  }

  // Eagerly update guide meta so reactive state (currentGuide, features) updates
  // immediately on navigation — before any async playground operations complete.
  guide.setGuideMeta(guideMeta)

  // Only mount the playground (code panel) if defaultLayout is not 'docs'
  if (guideMeta?.features?.defaultLayout !== 'docs') {
    await guide.mount(guideMeta, false, restoreFiles)
  }
}

router.afterEach(async (to) => {
  mount(to.path)
})

onMounted(() => {
  mount(router.currentRoute.value.path)
})
</script>

<template>
  <main
    h-100dvh w-screen of-hidden
    grid="~ rows-[max-content_1fr]"
  >
    <header>
      <TheNav />
    </header>
    <MainPlayground />
    <MobilePanelToggle v-if="isMobile" />
    <CommandPalette />
  </main>
</template>
