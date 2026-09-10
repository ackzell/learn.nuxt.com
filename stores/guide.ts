import type { Raw } from 'vue'
import type { GuideMeta, PlaygroundFeatures, TemplateType } from '~/types/guides'
import { TEMPLATE_TYPES } from '~/types/guides'

const defaultFeatures = Object.freeze(<PlaygroundFeatures>{
  fileTree: false,
  terminal: false,
  console: false,
  download: true,
})

function toPlain<T>(value: T): T {
  if (value == null)
    return value
  return JSON.parse(JSON.stringify(value)) as T
}

export const useGuideStore = defineStore('guide', () => {
  let play: ReturnType<typeof usePlaygroundStore> | null = null
  const { t } = useI18n()

  function getPlaygroundStore() {
    if (!play) {
      play = usePlaygroundStore()
    }
    return play
  }

  const ui = useUiState()
  const preview = usePreviewStore()

  const features = ref<PlaygroundFeatures>(defaultFeatures)
  const currentGuide = shallowRef<Raw<GuideMeta>>()
  const showingSolution = ref(false)
  const embeddedDocs = ref('')

  const ignoredFiles = computed(() => transformGuideIgnoredFiles(currentGuide.value?.ignoredFiles))

  const buttonSolutionMessage = computed(() => currentGuide.value?.buttonSolutionMessage ? t(currentGuide.value.buttonSolutionMessage) : t('show-solution'))
  // On challenge lessons "Show solution" is a non-destructive peek, so its pair
  // button hides the solution instead of resetting the editor. Plain lessons
  // keep the legacy destructive starter⇄solution swap ("Reset challenge").
  const buttonResetMessage = computed(() => currentGuide.value?.buttonResetMessage
    ? t(currentGuide.value.buttonResetMessage)
    : currentGuide.value?.validation
      ? t('challenge.hide-solution')
      : t('reset-challenge'))

  // Snapshot of the container files taken right before a solution peek, keyed
  // by sessionName so a stale peek can never be restored onto a different
  // guide. Undefined unless a challenge-lesson peek is open.
  let peekSnapshot: { key: string, files: Record<string, string> } | undefined

  watch(features, () => {
    if (features.value.fileTree === true) {
      if (ui.panelFileTree <= 0)
        ui.panelFileTree = 20
    }
    else if (features.value.fileTree === false) {
      ui.panelFileTree = 0
    }

    if (features.value.terminal === true)
      ui.showTerminal = true
    else if (features.value.terminal === false)
      ui.showTerminal = false

    if (features.value.console === true)
      ui.showConsole = true
    else if (features.value.console === false)
      ui.showConsole = false
  })

  async function mount(guide?: GuideMeta, withSolution = false, filesOverride?: Record<string, string>) {
    const playgroundStore = getPlaygroundStore()
    if (!playgroundStore.webcontainer) {
      await playgroundStore.init()
    }

    // Any reset/navigation mount (not a peek-restore) invalidates a stale
    // solution snapshot so it can't be restored later.
    if (!withSolution && filesOverride === undefined)
      peekSnapshot = undefined

    function isTemplateType(value: unknown): value is TemplateType {
      return typeof value === 'string'
        && TEMPLATE_TYPES.includes(value as TemplateType)
    }

    const templateName = isTemplateType(guide?.template)
      ? guide.template
      : 'html'

    await playgroundStore.mount({
      ...(filesOverride ?? guide?.files),
      ...withSolution ? guide?.solutions : {},
    }, templateName)

    // playgroundStore.fileSelected = undefined
    // await nextTick()
    // playgroundStore.fileSelected = playgroundStore.files.get(startingFile)

    playgroundStore.fileSelected = playgroundStore.files.get(guide?.startingFile || 'app.vue')
    preview.setFullPath(guide?.startingUrl || '/')

    const safeGuide = toPlain(guide)

    features.value = {
      ...defaultFeatures,
      ...safeGuide?.features,
    }
    currentGuide.value = safeGuide
    showingSolution.value = withSolution

    return undefined
  }

  async function toggleSolutions() {
    const guide = currentGuide.value
    const isChallenge = !!guide?.validation

    // Plain lessons: legacy destructive swap between the lesson's starter and
    // its reference solution ("update the lesson contents").
    if (!isChallenge) {
      await mount(guide, !showingSolution.value)
      return
    }

    // Challenge lessons: "Show solution" is a non-destructive peek. Opening it
    // snapshots the container; closing it restores the user's own code (their
    // partial attempt or saved passing solution) — never the pristine starter.
    const playgroundStore = getPlaygroundStore()
    if (!showingSolution.value) {
      const files: Record<string, string> = {}
      for (const [filepath, vf] of playgroundStore.files)
        files[filepath] = vf.read()
      peekSnapshot = { key: guide?.sessionName ?? '', files }
      await mount(guide, true)
    }
    else {
      const files = peekSnapshot?.key === (guide?.sessionName ?? '') && Object.keys(peekSnapshot.files).length > 0
        ? peekSnapshot.files
        : undefined
      peekSnapshot = undefined
      await mount(guide, false, files)
    }
  }

  function openEmbeddedDocs(url: string) {
    embeddedDocs.value = url
  }

  function setGuideMeta(guideMeta?: GuideMeta) {
    const safeGuide = toPlain(guideMeta)

    features.value = {
      ...defaultFeatures,
      ...safeGuide?.features,
    }
    currentGuide.value = safeGuide
  }

  return {
    mount,
    toggleSolutions,
    setGuideMeta,
    features,
    currentGuide,
    showingSolution,
    embeddedDocs,
    openEmbeddedDocs,
    ignoredFiles,

    buttonSolutionMessage,
    buttonResetMessage,
  }
})

if (import.meta.hot)
  import.meta.hot.accept(acceptHMRUpdate(useGuideStore, import.meta.hot))
