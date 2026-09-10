<script setup lang="ts">
import { Splitter } from '@ark-ui/vue'
import { extname } from 'pathe'
import Toasts from '@/components/Toasts/Toasts.vue'
import { isBinaryFile } from '@/lib/binary'
import { filesToVirtualFsTree } from '@/templates/utils'

const ui = useUiState()
const guide = useGuideStore()

// Dynamic import to prevent playground store access when not rendered
const LazyPanelEditorMonaco = defineAsyncComponent({
  loader: () => import('./PanelEditorMonaco.client.vue'),
  loadingComponent: { template: '<div />' },
  delay: 200,
  timeout: 3000,
})

// Make play a reactive ref so the template reacts when store is initialized
const play = ref<ReturnType<typeof usePlaygroundStore> | null>(null)

function getPlaygroundStore() {
  if (!play.value) {
    play.value = usePlaygroundStore()
  }
  return play.value
}

const files = ref<any[]>([])
const directory = computed(() => filesToVirtualFsTree(files.value))

const input = ref<string>('')

// A monotonically-increasing counter bumped every time a VirtualFile is
// written to via the HMR path so we can force the editor-content watch
// to re-evaluate even though the VirtualFile reference didn't change.
const contentVersion = ref(0)

const IMAGE_MIME: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.avif': 'image/avif',
}

const displayType = computed(() => {
  const file = play.value?.fileSelected
  if (!file)
    return 'none'
  if (!isBinaryFile(file.filepath))
    return 'text'
  return extname(file.filepath).toLowerCase() in IMAGE_MIME ? 'image' : 'binary'
})

const imageDataUrl = computed(() => {
  const file = play.value?.fileSelected
  if (!file)
    return ''
  const ext = extname(file.filepath).toLowerCase()
  const mime = IMAGE_MIME[ext]
  if (!mime)
    return ''
  return `data:${mime};base64,${file.read()}`
})

/**
 * Rebuild the files list from the playground store.
 * Called both at mount and whenever the store's files map changes.
 */
function syncFiles(playground: ReturnType<typeof usePlaygroundStore>) {
  files.value = Array
    .from(playground.files.values())
    .filter(file => !isFileIgnored(file.filepath, guide.ignoredFiles))
    .filter(file => !file.filepath.startsWith('__challenge__/'))
}

// Initialize data only when component is mounted
onMounted(() => {
  const playground = getPlaygroundStore()

  // Reactively keep the file list in sync with the playground store.
  // playground.files is a shallowReactive Map — Vue tracks .size, .has(),
  // iteration, etc., so this watch fires whenever mount() adds/removes files.
  watch(
    () => [playground.files.size, guide.currentGuide, guide.showingSolution],
    () => {
      syncFiles(playground)
    },
    { immediate: true },
  )

  // Keep the editor content in sync with the selected file.
  // We include `contentVersion` so that HMR-driven content mutations
  // (which don't change the VirtualFile reference) still trigger a refresh.
  watch(
    () => [playground.fileSelected, guide.currentGuide, guide.showingSolution, contentVersion.value],
    () => {
      const content = playground.fileSelected?.read() || ''
      input.value = content
    },
    { immediate: true },
  )

  // Listen for the custom DOM event emitted by the playground store/plugin
  // when a file update arrives from the dev server.
  if (import.meta.client) {
    const handleTemplateUpdate = (e: Event) => {
      const event = e as CustomEvent<string>
      const playground = getPlaygroundStore()
      if (event.detail && event.detail === playground.fileSelected?.filepath) {
        contentVersion.value++
      }
    }

    window.addEventListener('template-file-updated', handleTemplateUpdate)

    onUnmounted(() => {
      window.removeEventListener('template-file-updated', handleTemplateUpdate)
    })
  }
})

const onTextInput = useDebounceFn(_onTextInput, 500)
function _onTextInput() {
  if (input.value != null) {
    play.value?.fileSelected?.write(input.value)
    play.value?.notifyFileChanged()
  }
}

function startDragging() {
  ui.isPanelDragging = true
}

function onResize(e: { size: number[] }) {
  ui.panelFileTree = e.size[0] ?? 0
}

function endDragging(e: { size: number[] }) {
  ui.isPanelDragging = false
  ui.panelFileTree = e.size[0] ?? 0
}

const panels = [
  { id: 'file-tree-panel', minSize: 0, maxSize: 100, collapsible: true, collapsedSize: 0 },
  { id: 'editor-pane', minSize: 0, maxSize: 100, collapsible: true, collapsedSize: 0 },
]

const sizes = computed<number[]>({
  get() {
    const fileTree = guide.features.fileTree === false ? 0 : ui.panelFileTree
    return [fileTree, Math.max(0, 100 - fileTree)]
  },
  set(value) {
    ui.panelFileTree = value[0] ?? 0
  },
})
</script>

<template>
  <Splitter.Root
    v-if="play"
    :panels="panels"
    :size="sizes"
    of-hidden
    @resize-start="startDragging"
    @resize="onResize"
    @resize-end="endDragging"
  >
    <Splitter.Panel
      id="file-tree-panel"
      flex="~ col" h-full of-auto
    >
      <div
        h-full
        grid="~ rows-[min-content_1fr]"
      >
        <div
          flex="~ gap-2 items-center"
          border="b base dashed"
          px4 py2
          bg="dark:bgr-dark bgr-50"
        >
          <div i-ph-tree-structure-duotone flex-none />
          <span text-sm>{{ $t('files') }}</span>
        </div>
        <div py2>
          <PanelEditorFileSystemTree
            v-model="play.fileSelected"
            :directory="directory"
            :depth="-1"
          />
        </div>
      </div>
    </Splitter.Panel>

    <Splitter.ResizeTrigger
      v-if="guide.features.fileTree !== false"
      id="file-tree-panel:editor-pane"
    />

    <Splitter.Panel id="editor-pane" min-h-0>
      <Toasts />
      <PanelSnapshotsSidebar h-full min-h-0>
        <div
          data-dock-drag-handle="true"
          draggable="true"
          flex="~ gap-2 items-center"
          border="b base dashed"
          px4 py2
          bg="dark:bgr-dark bgr-50"
          class="active:cursor-grabbing"
        >
          <FileIcon :path="play.fileSelected?.filepath || ''" />
          <span text-sm flex-auto>{{ play.fileSelected?.filepath || $t('editor') }}</span>
          <ButtonShowSolution
            :show-solution-message="guide.buttonSolutionMessage"
            :reset-message="guide.buttonResetMessage"
            text-sm my--1 mr--3 px2 py1 rounded op50 flex-none
            hover="bg-active op100"
          />
        </div>
        <ClientOnly>
          <template v-if="play.fileSelected">
            <div
              v-if="displayType === 'image'"
              flex="~ col items-center justify-center" p8 h-full
            >
              <img
                :src="imageDataUrl"
                :alt="play.fileSelected.filepath"
                max-h-full max-w-full of-auto
              >
            </div>
            <div
              v-else-if="displayType === 'binary'"
              flex="~ col items-center justify-center"
              text-sm op50 h-full
            >
              <div i-ph-file-duotone text-4xl mb2 />
              <span>{{ $t('binary-no-preview') }}</span>
            </div>
            <LazyPanelEditorMonaco
              v-else
              v-model="input"
              :filepath="play.fileSelected.filepath"
              h-full w-full
              @change="onTextInput"
            />
          </template>
        </ClientOnly>
      </PanelSnapshotsSidebar>
    </Splitter.Panel>
  </Splitter.Root>
</template>
