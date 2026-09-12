<script setup>
import { ref } from 'vue'

const isVisible = ref(false)
const inputRef = ref(null)

function showInput() {
  isVisible.value = true
  inputRef.value.focus()
}
</script>

<template>
  <div>
    <button @click="showInput">
      Show Input
    </button>

    <div>
      <input
        v-if="isVisible"
        ref="inputRef"
        type="text"
        placeholder="I should be focused..."
      >
    </div>
  </div>
</template>
