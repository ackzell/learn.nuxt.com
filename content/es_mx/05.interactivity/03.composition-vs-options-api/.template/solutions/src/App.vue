<script setup>
import { computed, ref } from 'vue'

const msg = 'Hola Composition API!'

const { greetMe, reset, timesGreeted } = useGreeter()

function useGreeter() {
  const greetedCount = ref(0)

  const timesGreeted = computed(() => {
    const isPlural = greetedCount.value > 1
    const times = isPlural ? 'times' : 'time'

    return greetedCount.value > 0
      ? `I've greeted you ${greetedCount.value} ${times}`
      : 'I have not greeted you yet.'
  })

  function greetMe() {
    console.log(`Hello there!`)
    greetedCount.value++
  }

  function reset() {
    greetedCount.value = 0
  }

  return {
    greetMe,
    reset,
    timesGreeted,
  }
}
</script>

<template>
  <h1>{{ msg }}</h1>

  <p>{{ timesGreeted }}</p>

  <button @click="greetMe">
    Greet Me
  </button>
  <button @click="reset">
    Reset
  </button>
</template>

<style>
:root {
  --neutral: oklch(0.56 0 0);
  --highlight: #42b983;
}

h1 {
  color: var(--highlight);
}

button {
  margin-inline-end: 1rem;
}
</style>
