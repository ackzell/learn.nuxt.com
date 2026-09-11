<script setup>
import { ref } from 'vue'

const level = ref(1)
</script>

<template>
  <p v-if="level < 1" class="msg-new">Just getting started</p>
  <p v-else-if="level < 3" class="msg-mid">Getting there</p>
  <p v-else class="msg-done">Mastered it!</p>
</template>