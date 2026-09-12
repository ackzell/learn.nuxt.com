<script setup>
import { ref } from 'vue'

const activeColor = ref('tomato')
const fontSize = ref(30)

function increaseFontSize(step = 1) {
  fontSize.value += step
}

function decreaseFontSize(step = 1) {
  fontSize.value -= step
}

function toggleColor() {
  activeColor.value = activeColor.value === 'tomato' ? 'rebeccapurple' : 'tomato'
}
</script>

<template>
  <button @click="increaseFontSize(10)">
    Increase font size
  </button>
  <button @click="decreaseFontSize(10)">
    Decrease font size
  </button>

  <button @click="toggleColor()">
    Toggle color
  </button>
  <div
    :style="{
      color: activeColor,
      fontSize: `${fontSize}px`,
    }"
    style="margin-top: 2rem"
  >
    This text is styled reactively!
  </div>
</template>
