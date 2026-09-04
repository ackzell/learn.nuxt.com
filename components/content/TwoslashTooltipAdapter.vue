<script setup lang="ts">
defineProps<{
  id: string
  content: string
  tokenHtml: string
  persisted?: boolean
}>()
</script>

<template>
  <TooltipTrigger
    :id="id"
    no-icon
    no-follow
    :default-shown="persisted"
    :persistent="persisted"
    :hide-timeout="100"
    :placement="persisted ? 'bottom-start' : undefined"
  >
    <span class="twoslash-token-content" v-html="tokenHtml" />
  </TooltipTrigger>
  <TooltipContent :id="id">
    <div class="twoslash-popup-content" v-html="content" />
  </TooltipContent>
</template>
