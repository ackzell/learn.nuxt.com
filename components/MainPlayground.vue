<script setup lang="ts">
import type { DropZone } from '~/types/dnd-spike'
import type { CodePanelId, LayoutNode, LayoutSplit } from '~/types/layout'
import { Splitter } from '@ark-ui/vue'

const ui = useUiState()
const { width: windowWidth } = useWindowSize()
const isMobile = computed(() => windowWidth.value < 768)

// Track slide direction for mobile transitions
// 'forward': incoming slides in from right (next lesson, or docs→code)
// 'back':    incoming slides in from left  (prev lesson, or code→docs)
const slideDirection = ref<'forward' | 'back'>('forward')

watch(
  () => ui.mainViewMode,
  (next, prev) => {
    if (prev === 'docs' && next === 'code')
      slideDirection.value = 'forward'
    else if (prev === 'code' && next === 'docs')
      slideDirection.value = 'back'
  },
)

// When expanding back to desktop, restore split view unless the user explicitly
// chose a focused mode via the desktop nav (tracked by mainViewModeFromDesktop).
watch(isMobile, (nowMobile, wasMobile) => {
  if (!wasMobile && nowMobile) {
    // wide → narrow: if in split mode, default the mobile toggle to docs
    if (ui.mainViewMode === 'split')
      ui.setMainViewMode('docs')
  }
  if (wasMobile && !nowMobile) {
    if (!ui.mainViewModeFromDesktop)
      ui.setMainViewMode('split')
  }
  if (!nowMobile)
    ui.mainViewModeFromDesktop = false
})
const guide = useGuideStore()
const route = useRoute()

watch(
  () => route.path,
  (newPath, oldPath) => {
    if (oldPath && newPath !== oldPath && isMobile.value)
      slideDirection.value = newPath > oldPath ? 'forward' : 'back'
  },
)

const effectiveMainViewMode = computed(() => {
  if (guide.currentGuide?.features?.defaultLayout === 'docs')
    return 'docs'
  return ui.mainViewMode
})
const isSplitMode = computed(() => effectiveMainViewMode.value === 'split')
const isCodeOnlyMode = computed(() => effectiveMainViewMode.value === 'code')
const isDocsOnlyMode = computed(() => effectiveMainViewMode.value === 'docs')

// When reversed, code panel comes first physically; panels array order must match template order.
const isReversed = computed(() => ui.mainLayoutReverse)

const mainPanels = computed(() => {
  const docs = { id: 'docs-panel', minSize: 0, maxSize: 100, collapsible: true, collapsedSize: 0 }
  const code = { id: 'code-panel', minSize: 0, maxSize: 100, collapsible: true, collapsedSize: 0 }
  return isReversed.value ? [code, docs] : [docs, code]
})

const embeddedPanels = computed(() => {
  const docsPart = { id: 'embedded-docs-panel', minSize: 0, maxSize: 100, collapsible: true, collapsedSize: 0 }
  const spacer = { id: 'embedded-spacer-panel', minSize: 0, maxSize: 100, collapsible: true, collapsedSize: 0 }
  return isReversed.value ? [spacer, docsPart] : [docsPart, spacer]
})

// mainSizes index 0 always corresponds to the first panel in mainPanels.
// When not reversed: [0] = docs size, [1] = code size.
// When reversed:     [0] = code size, [1] = docs size.
const mainSizes = computed<number[]>({
  get() {
    const docsSize = isCodeOnlyMode.value ? 0 : isDocsOnlyMode.value ? 100 : ui.panelDocs
    const codeSize = Math.max(0, 100 - docsSize)
    return isReversed.value ? [codeSize, docsSize] : [docsSize, codeSize]
  },
  set(value) {
    if (!isSplitMode.value)
      return
    // value[0] is always the first physical panel.
    ui.panelDocs = isReversed.value ? (value[1] ?? 0) : (value[0] ?? 0)
  },
})

const draggedPanelId = ref<CodePanelId | null>(null)
const activeDropZone = ref<string | null>(null)
const codeSizesMap = ref<Record<string, number[]>>({})

// Dynamic imports for playground components to prevent initialization when not needed
const PanelCodeToolbar = defineAsyncComponent(() =>
  import('~/components/PanelCodeToolbar.vue'),
)
const PlaygroundCodeDockNode = defineAsyncComponent(() =>
  import('~/components/PlaygroundCodeDockNode.vue'),
)

function collectMaxSplitNumber(node: LayoutNode): number {
  if (node.type === 'panel')
    return 0

  const current = Number.parseInt(node.id.replace('split-', ''), 10)
  const childMax = node.children.reduce((max, child) => Math.max(max, collectMaxSplitNumber(child)), 0)
  return Math.max(Number.isNaN(current) ? 0 : current, childMax)
}

const splitIdCounter = ref(Math.max(4, collectMaxSplitNumber(ui.layoutTree) + 1))

function nextSplitId() {
  const id = `split-${splitIdCounter.value}`
  splitIdCounter.value += 1
  return id
}

function onDragStart(panelId: CodePanelId) {
  draggedPanelId.value = panelId
}

function onDragEnd() {
  draggedPanelId.value = null
  activeDropZone.value = null
}

function onDropZoneEnter(zoneId: string) {
  if (!draggedPanelId.value)
    return
  activeDropZone.value = zoneId
}

function onDropZoneLeave() {
  activeDropZone.value = null
}

function onCodeSplitResize(splitId: string, sizes: number[]) {
  codeSizesMap.value = {
    ...codeSizesMap.value,
    [splitId]: [...sizes],
  }
}

function isAxisAlignedDrop(direction: LayoutSplit['direction'], zone: DropZone) {
  return (direction === 'horizontal' && (zone === 'left' || zone === 'right'))
    || (direction === 'vertical' && (zone === 'top' || zone === 'bottom'))
}

function splitForZone(target: LayoutNode, dragged: { type: 'panel', id: CodePanelId }, zone: DropZone): LayoutSplit {
  const direction = zone === 'left' || zone === 'right' ? 'horizontal' : 'vertical'
  const before = zone === 'left' || zone === 'top'
  return {
    type: 'split',
    id: nextSplitId(),
    direction,
    children: before ? [dragged, target] : [target, dragged],
  }
}

function removePanel(node: LayoutNode, panelId: CodePanelId): { node: LayoutNode | null, removed: { type: 'panel', id: CodePanelId } | null } {
  if (node.type === 'panel') {
    if (node.id === panelId)
      return { node: null, removed: node }
    return { node, removed: null }
  }

  let removed: { type: 'panel', id: CodePanelId } | null = null
  const children: LayoutNode[] = []

  for (const child of node.children) {
    const result = removePanel(child, panelId)
    if (result.removed)
      removed = result.removed
    if (result.node)
      children.push(result.node)
  }

  if (children.length === 0)
    return { node: null, removed }
  if (children.length === 1)
    return { node: { ...node, children }, removed }

  return {
    node: {
      ...node,
      children,
    },
    removed,
  }
}

function insertAtTarget(node: LayoutNode, targetId: string, dragged: { type: 'panel', id: CodePanelId }, zone: DropZone): LayoutNode {
  if (node.type === 'panel') {
    if (node.id !== targetId)
      return node
    return splitForZone(node, dragged, zone)
  }

  if (node.id === targetId) {
    if (isAxisAlignedDrop(node.direction, zone)) {
      const insertAtStart = zone === 'left' || zone === 'top'
      return {
        ...node,
        children: insertAtStart
          ? [dragged, ...node.children]
          : [...node.children, dragged],
      }
    }

    return splitForZone(node, dragged, zone)
  }

  return {
    ...node,
    children: node.children.map(child => insertAtTarget(child, targetId, dragged, zone)),
  }
}

function cleanupTree(node: LayoutNode): LayoutNode {
  if (node.type === 'panel')
    return node

  const cleanedChildren = node.children.map(cleanupTree)

  if (cleanedChildren.length === 1)
    return cleanedChildren[0]!

  const flattenedChildren: LayoutNode[] = []
  for (const child of cleanedChildren) {
    if (child.type === 'split' && child.direction === node.direction)
      flattenedChildren.push(...child.children)
    else
      flattenedChildren.push(child)
  }

  if (flattenedChildren.length === 1)
    return flattenedChildren[0]!

  return {
    ...node,
    children: flattenedChildren,
  }
}

function hasPanel(node: LayoutNode, panelId: CodePanelId): boolean {
  if (node.type === 'panel')
    return node.id === panelId

  return node.children.some(child => hasPanel(child, panelId))
}

function collectSplitIds(node: LayoutNode, ids = new Set<string>()) {
  if (node.type === 'split') {
    ids.add(node.id)
    for (const child of node.children)
      collectSplitIds(child, ids)
  }
  return ids
}

function pruneSizesMap(node: LayoutNode) {
  const existingSplitIds = collectSplitIds(node)
  const next: Record<string, number[]> = {}

  for (const [key, value] of Object.entries(codeSizesMap.value)) {
    if (existingSplitIds.has(key) && Array.isArray(value))
      next[key] = value
  }

  codeSizesMap.value = next
}

function ensureRootSplit(node: LayoutNode): LayoutSplit {
  if (node.type === 'split')
    return node

  return {
    type: 'split',
    id: nextSplitId(),
    direction: 'vertical',
    children: [node],
  }
}

function filterVisible(node: LayoutNode, visibleIds: Set<CodePanelId>): LayoutNode | null {
  if (node.type === 'panel')
    return visibleIds.has(node.id) ? node : null

  const children = node.children
    .map(child => filterVisible(child, visibleIds))
    .filter((child): child is LayoutNode => child !== null)

  if (children.length === 0)
    return null

  return {
    ...node,
    children,
  }
}

function collectPanels(node: LayoutNode, out = new Set<CodePanelId>()) {
  if (node.type === 'panel') {
    out.add(node.id)
    return out
  }

  for (const child of node.children)
    collectPanels(child, out)

  return out
}

function ensureAllPanelsExist() {
  const required: CodePanelId[] = ['editor', 'preview', 'console', 'terminal']
  const existing = collectPanels(ui.layoutTree)
  if (required.every(id => existing.has(id)))
    return

  const nextRoot = ensureRootSplit(ui.layoutTree)
  for (const id of required) {
    if (!existing.has(id))
      nextRoot.children.push({ type: 'panel', id })
  }

  ui.layoutTree = ensureRootSplit(cleanupTree(nextRoot))
}

const visiblePanelIds = computed(() => {
  const ids = new Set<CodePanelId>(['editor'])
  if (ui.showPreview)
    ids.add('preview')
  if (ui.showConsole)
    ids.add('console')
  if (ui.showTerminal)
    ids.add('terminal')
  return ids
})

const visibleLayout = computed<LayoutSplit>(() => {
  const filtered = filterVisible(ui.layoutTree, visiblePanelIds.value)
  if (!filtered) {
    return {
      type: 'split',
      id: 'split-visible-fallback',
      direction: 'vertical',
      children: [{ type: 'panel', id: 'editor' }],
    }
  }

  const cleaned = cleanupTree(filtered)
  if (cleaned.type === 'split')
    return cleaned

  return {
    type: 'split',
    id: 'split-visible-wrapper',
    direction: 'vertical',
    children: [cleaned],
  }
})

watch(
  () => ui.layoutTree,
  () => {
    ensureAllPanelsExist()
  },
  { deep: true, immediate: true },
)

watch(
  () => ui.layoutTree,
  (next) => {
    splitIdCounter.value = Math.max(splitIdCounter.value, collectMaxSplitNumber(next) + 1)
  },
  { deep: true },
)

function onZoneDrop(draggedId: CodePanelId, targetId: string, zone: DropZone) {
  const previousLayout = ui.layoutTree
  const removal = removePanel(ui.layoutTree, draggedId)

  if (!removal.removed || !removal.node) {
    onDragEnd()
    return
  }

  const inserted = insertAtTarget(removal.node, targetId, removal.removed, zone)
  if (!hasPanel(inserted, draggedId)) {
    ui.layoutTree = previousLayout
    onDragEnd()
    return
  }

  const cleaned = ensureRootSplit(cleanupTree(inserted))
  if (!hasPanel(cleaned, draggedId)) {
    ui.layoutTree = previousLayout
    onDragEnd()
    return
  }

  ui.layoutTree = cleaned
  pruneSizesMap(cleaned)
  onDragEnd()
}

function onResizeStart() {
  ui.isPanelDragging = true
}

function onMainResize(details: { size: number[] }) {
  mainSizes.value = details.size
}

function onMainResizeEnd(details: { size: number[] }) {
  mainSizes.value = details.size
  ui.isPanelDragging = false
}

function onEmbeddedResize(details: { size: number[] }) {
  mainSizes.value = details.size
}

function onEmbeddedResizeEnd(details: { size: number[] }) {
  mainSizes.value = details.size
  ui.isPanelDragging = false
}
</script>

<template>
  <!-- Mobile: single panel view, toggled via MobilePanelToggle -->
  <template v-if="isMobile">
    <div h-full relative of-hidden>
      <!-- Code dock stays mounted even while the docs pane is shown (just hidden
           with `visibility`, not `display:none`) so the preview iframe keeps
           running and challenge DOM validation can inspect it from the docs view. -->
      <div
        key="code-pane"
        h-full grid="~ rows-[max-content_1fr]"
        :class="isCodeOnlyMode ? 'visible' : 'invisible'"
      >
        <PanelCodeToolbar />
        <div min-h-0 relative of-hidden>
          <PlaygroundCodeDockNode
            :node="visibleLayout"
            :dragged-panel-id="draggedPanelId"
            :active-drop-zone="activeDropZone"
            :sizes-map="codeSizesMap"
            :show-preview="ui.showPreview"
            :show-console="ui.showConsole"
            :show-terminal="ui.showTerminal"
            @drag-start="onDragStart"
            @drag-end="onDragEnd"
            @drop-zone-enter="onDropZoneEnter"
            @drop-zone-leave="onDropZoneLeave"
            @zone-drop="onZoneDrop"
            @split-resize="onCodeSplitResize"
          />
        </div>
      </div>

      <!-- Docs slides over the hidden code dock when active -->
      <Transition :name="slideDirection === 'forward' ? 'mobile-slide-left' : 'mobile-slide-right'">
        <div v-if="!isCodeOnlyMode" key="docs-pane" absolute inset-0 h-full>
          <PanelDocs :key="route.path" />
        </div>
      </Transition>
    </div>
  </template>

  <!-- Desktop: split panel view -->
  <template v-else>
    <!-- Normal order: docs | resize | code -->
    <Splitter.Root
      v-if="!isReversed"
      :key="`${effectiveMainViewMode}-normal`"
      :panels="mainPanels"
      :orientation="ui.mainLayoutOrientation"
      :size="mainSizes"
      h-full of-hidden
      @resize-start="onResizeStart"
      @resize="onMainResize"
      @resize-end="onMainResizeEnd"
    >
      <Splitter.Panel id="docs-panel">
        <PanelDocs v-if="!isCodeOnlyMode" :key="route.path" />
      </Splitter.Panel>

      <Splitter.ResizeTrigger v-if="isSplitMode" id="docs-panel:code-panel" />

      <Splitter.Panel id="code-panel">
        <div v-if="!isDocsOnlyMode" h-full grid="~ rows-[max-content_1fr]">
          <PanelCodeToolbar />
          <div
            min-h-0 relative of-hidden
            :class="guide.embeddedDocs ? 'z-embedded-docs-raised' : ''"
          >
            <PlaygroundCodeDockNode
              :node="visibleLayout"
              :dragged-panel-id="draggedPanelId"
              :active-drop-zone="activeDropZone"
              :sizes-map="codeSizesMap"
              :show-preview="ui.showPreview"
              :show-console="ui.showConsole"
              :show-terminal="ui.showTerminal"
              @drag-start="onDragStart"
              @drag-end="onDragEnd"
              @drop-zone-enter="onDropZoneEnter"
              @drop-zone-leave="onDropZoneLeave"
              @zone-drop="onZoneDrop"
              @split-resize="onCodeSplitResize"
            />
          </div>
        </div>
      </Splitter.Panel>
    </Splitter.Root>

    <!-- Reversed order: code | resize | docs -->
    <Splitter.Root
      v-else
      :key="`${effectiveMainViewMode}-reversed`"
      :panels="mainPanels"
      :orientation="ui.mainLayoutOrientation"
      :size="mainSizes"
      h-full of-hidden
      @resize-start="onResizeStart"
      @resize="onMainResize"
      @resize-end="onMainResizeEnd"
    >
      <Splitter.Panel id="code-panel">
        <div v-if="!isDocsOnlyMode" h-full grid="~ rows-[max-content_1fr]">
          <PanelCodeToolbar />
          <div
            min-h-0 relative of-hidden
            :class="guide.embeddedDocs ? 'z-embedded-docs-raised' : ''"
          >
            <PlaygroundCodeDockNode
              :node="visibleLayout"
              :dragged-panel-id="draggedPanelId"
              :active-drop-zone="activeDropZone"
              :sizes-map="codeSizesMap"
              :show-preview="ui.showPreview"
              :show-console="ui.showConsole"
              :show-terminal="ui.showTerminal"
              @drag-start="onDragStart"
              @drag-end="onDragEnd"
              @drop-zone-enter="onDropZoneEnter"
              @drop-zone-leave="onDropZoneLeave"
              @zone-drop="onZoneDrop"
              @split-resize="onCodeSplitResize"
            />
          </div>
        </div>
      </Splitter.Panel>

      <Splitter.ResizeTrigger v-if="isSplitMode" id="code-panel:docs-panel" />

      <Splitter.Panel id="docs-panel">
        <PanelDocs v-if="!isCodeOnlyMode" :key="route.path" />
      </Splitter.Panel>
    </Splitter.Root>

    <Transition name="slide-fade">
      <!-- Normal embedded docs order: docs iframe | resize | spacer -->
      <Splitter.Root
        v-if="guide.embeddedDocs && !isReversed"
        :panels="embeddedPanels"
        :size="mainSizes"
        inset-0 fixed z-embedded-docs
        @resize-start="onResizeStart"
        @resize="onEmbeddedResize"
        @resize-end="onEmbeddedResizeEnd"
      >
        <Splitter.Panel id="embedded-docs-panel" relative>
          <iframe
            :class="{ 'pointer-events-none': ui.isPanelDragging }"
            :src="guide.embeddedDocs"
            crossorigin="anonymous" allow="cross-origin-isolated"
            credentialless h-full w-full inset-0
          />
        </Splitter.Panel>

        <Splitter.ResizeTrigger id="embedded-docs-panel:embedded-spacer-panel" />

        <Splitter.Panel id="embedded-spacer-panel" relative important-of-visible>
          <div
            border="~ base"
            rounded-full bg-base h-8 w-8 left--4 top-4 absolute z-embedded-docs-close of-hidden
          >
            <IconButton
              tooltip="Close embedded docs"
              tooltip-placement="left"
              padding="sm"
              class="flex h-full w-full items-center justify-center"
              @click="guide.embeddedDocs = ''"
            >
              <div i-ph-caret-left-bold h-4 w-4 />
            </IconButton>
          </div>
        </Splitter.Panel>
      </Splitter.Root>

      <!-- Reversed embedded docs order: spacer | resize | docs iframe -->
      <Splitter.Root
        v-else-if="guide.embeddedDocs && isReversed"
        :panels="embeddedPanels"
        :size="mainSizes"
        inset-0 fixed z-embedded-docs
        @resize-start="onResizeStart"
        @resize="onEmbeddedResize"
        @resize-end="onEmbeddedResizeEnd"
      >
        <Splitter.Panel id="embedded-spacer-panel" relative important-of-visible>
          <div
            border="~ base"
            rounded-full bg-base h-8 w-8 right--4 top-4 absolute z-embedded-docs-close of-hidden
          >
            <IconButton
              tooltip="Close embedded docs"
              tooltip-placement="right"
              padding="sm"
              class="flex h-full w-full items-center justify-center"
              @click="guide.embeddedDocs = ''"
            >
              <div i-ph-caret-right-bold h-4 w-4 />
            </IconButton>
          </div>
        </Splitter.Panel>

        <Splitter.ResizeTrigger id="embedded-spacer-panel:embedded-docs-panel" />

        <Splitter.Panel id="embedded-docs-panel" relative>
          <iframe
            :class="{ 'pointer-events-none': ui.isPanelDragging }"
            :src="guide.embeddedDocs"
            crossorigin="anonymous" allow="cross-origin-isolated"
            credentialless h-full w-full inset-0
          />
        </Splitter.Panel>
      </Splitter.Root>
    </Transition>
  </template>
</template>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.2s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(-30vw);
  opacity: 0;
}

/* Mobile panel slide transitions */
.mobile-slide-left-enter-active,
.mobile-slide-left-leave-active,
.mobile-slide-right-enter-active,
.mobile-slide-right-leave-active {
  transition: transform 0.28s cubic-bezier(0.4, 0, 0.2, 1);
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}

/* docs→code: incoming slides in from right, outgoing exits to left */
.mobile-slide-left-enter-from {
  transform: translateX(100%);
}
.mobile-slide-left-enter-to {
  transform: translateX(0);
}
.mobile-slide-left-leave-from {
  transform: translateX(0);
}
.mobile-slide-left-leave-to {
  transform: translateX(-100%);
}

/* code→docs: incoming slides in from left, outgoing exits to right */
.mobile-slide-right-enter-from {
  transform: translateX(-100%);
}
.mobile-slide-right-enter-to {
  transform: translateX(0);
}
.mobile-slide-right-leave-from {
  transform: translateX(0);
}
.mobile-slide-right-leave-to {
  transform: translateX(100%);
}
</style>
