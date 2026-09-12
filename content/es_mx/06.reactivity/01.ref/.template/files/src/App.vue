<script setup>
import { ref, version } from 'vue'

const message = ref('Hola ref!')

function updateMessage(ev) {
  // `ev.target.value` is how you get the input's value natively,
  // this is not Vue, it's the browser's API
  message.value = ev.target.value
}

function logMessage() {
  console.log(message)

  console.log(message.value)
}

console.log('version:', version)
</script>

<template>
  <h1>{{ message }}</h1>

  <input
    :value="message"
    @input="updateMessage"
  >
  <button
    @click="logMessage"
  >
    log message
  </button>

  <p>Version is: <code>{{ version }}</code></p>
</template>

<style>
h1 {
  color: #42b983;
}

input {
  margin-right: 0.5rem;
}
</style>
