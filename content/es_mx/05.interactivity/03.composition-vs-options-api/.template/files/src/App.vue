<script>
export default {
  data() {
    return {
      msg: 'Hola Options API!',
      greetedCount: 0,
    }
  },
  computed: {
    timesGreeted() {
      const isPlural = this.greetedCount > 1
      const times = isPlural ? 'times' : 'time'

      return this.greetedCount > 0
        ? `I've greeted you ${this.greetedCount} ${times}`
        : 'I have not greeted you yet.'
    },
  },
  methods: {
    greetMe() {
      console.log(`Hello there!`)
      this.greetedCount++
    },
    reset() {
      this.greetedCount = 0
    },
  },
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
