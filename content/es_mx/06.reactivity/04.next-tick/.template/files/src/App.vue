<script setup>
import { ref } from 'vue'

const list = ref([])

function addElement() {
  list.value.push({ id: crypto.randomUUID() })

  const elements = document.querySelectorAll('.my-list-element')
  console.log('Checking the DOM:', elements)
}
</script>

<template>
  <div>
    <button @click="addElement">
      Add Element
    </button>

    <p>Number of elements: {{ list.length }}</p>

    <ol>
      <li
        v-for="item in list" :key="item.id"
        class="my-list-element"
      >
        {{ item.id }}
      </li>
    </ol>
  </div>
</template>
