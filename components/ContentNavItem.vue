<script setup lang="ts">
import type { ContentNavigationItem } from '@nuxt/content'

const props = withDefaults(
  defineProps<{
    item: ContentNavigationItem
    level?: number
    current?: string
  }>(),
  {
    level: 0,
  },
)

const route = useRoute()
const ui = useUiState()
const progress = useChallengeProgress()

const sessionMap = await import('virtual:guide-session-map').then(m => m.default)

const resolved = computed(() => {
  if (props.item.children?.length === 1)
    return props.item.children[0]
  return props.item
})

const completed = computed(() => {
  if (!resolved.value || resolved.value.children?.length)
    return false
  const sessionName = sessionMap[resolved.value.path]
  return progress.isCompleted(sessionName)
})

// Frontmatter fields typed as a record to avoid `as any` assertions in the
// template (requirement: compute typed values in <script setup>).
const metaRecord = computed<Record<string, unknown>>(() => {
  const meta = resolved.value?.meta
  return (meta && typeof meta === 'object' ? meta : {}) as Record<string, unknown>
})

const isChallenge = computed(() => metaRecord.value.isChallenge === true || metaRecord.value.isChallenge === 'true')
const unlisted = computed(() => metaRecord.value.unlisted === true || metaRecord.value.unlisted === 'true')

const paddingLeft = computed(() => `${0.5 + props.level * 0.8}rem`)
</script>

<template>
  <div v-if="resolved && (!unlisted || current?.startsWith(resolved.path))" class="content-nav-item font-mono">
    <template v-if="resolved.children?.length">
      <details :open="route.path.includes(resolved.path)">
        <summary>
          <div
            flex="~ gap-1 items-center" px1 py0.5 cursor-pointer select-none
            hover="text-primary dark:text-primary-dark-300 bg-bgr-100/35 dark:bg-bgr-700/45"
            :style="{ paddingLeft }"
          >
            <div class="caret" un-transition i-mynaui-chevron-right-solid text-sm op80 flex-none duration-400 />
            <div i-mynaui-folder-solid opacity-80 flex-none />
            <div ml1>
              {{ resolved.title }}
            </div>
          </div>
        </summary>
        <div v-if="resolved.children?.length">
          <ContentNavItem
            v-for="child of resolved.children"
            :key="child.path"
            :item="child"
            :current="current"
            :level="props.level + 1"
          />
        </div>
      </details>
    </template>
    <NuxtLink
      v-else
      :to="resolved.path"
      :style="{ paddingLeft }"
      :class="{ 'text-primary dark:text-primary-dark-300  bg-bgr-50 dark:bg-bgr-900': resolved.path === route.path }"
      flex="~ gap-1 items-center"
      hover="text-primary dark:text-primary-dark-300 bg-bgr-100/35 dark:bg-bgr-700/45" px1 py0.5
      @click="ui.isContentDropdownShown = false"
    >
      <div class="caret" un-transition i-mynaui-chevron-right-solid text-sm op0 flex-none duration-400 />
      <div v-if="isChallenge && completed" i-mynaui-check-solid text-positive flex-none />
      <div v-else-if="isChallenge" i-mynaui-lightning-solid text-challenge op90 flex-none />
      <div v-else i-mynaui-file-solid op80 flex-none />
      <div ml1>
        {{ resolved.title }}
      </div>
    </NuxtLink>
  </div>
</template>

<style>
.content-nav-item details summary {
  list-style-type: none;
}

.content-nav-item details[open] .caret {
  transform: rotate(90deg);
}
</style>
