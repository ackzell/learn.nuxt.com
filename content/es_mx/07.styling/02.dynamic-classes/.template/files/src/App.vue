<script setup>
import { nextTick, ref } from 'vue'

const isChecked = ref(false)
const isHighlighted = ref(false)
const shouldApply = ref(false)
const isToggledOn = ref(false)
const activeClasses = ['highlighted', 'bold']

const shouldFirstClassBeApplied = true
const customStyleEnabled = ref(false)
const classNames = ['error', 'warning', 'info', 'success']
const selectedClassName = ref('')

async function handleClick() {
  isChecked.value = !isChecked.value

  // this next part is only for logging out the DOM element
  // and seeing the correct value in the DOM after the class has been updated
  await nextTick() // Wait for the DOM to update before logging
  console.log(document.querySelector('.my-text'))
}

async function onCheckboxClick() {
  isHighlighted.value = !isHighlighted.value

  await nextTick() // Wait for the DOM to update before logging
  console.log(
    document.querySelector('ul'),
  )
}

async function onApplyCheckboxClick() {
  shouldApply.value = !shouldApply.value

  await nextTick() // Wait for the DOM to update before logging
  console.log(
    document.querySelector('ul').children[0],
  )
}

async function onToggleClasses() {
  isToggledOn.value = !isToggledOn.value

  await nextTick() // Wait for the DOM to update before logging
  console.log(
    document.querySelector('ul'),
  )
}

async function handleSelectionChange(ev) {
  selectedClassName.value = ev.target.value
  await nextTick()

  console.log(document.querySelector('.first-class'))
}
</script>

<template>
  <h1>Dynamic classes</h1>
  <section>
    <h2>Explicit class names</h2>
    <div
      class="my-text"
      :class="isChecked
        ? 'checked-class'
        : 'unchecked-class'"
    >
      This text will change color based on the value of <code>isChecked</code>.
    </div>

    <label>
      <input type="checkbox" @click="handleClick">
      Checked: {{ isChecked }}
    </label>
  </section>

  <section>
    <h2>Toggling classes</h2>

    <label>
      <input type="checkbox" @click="onCheckboxClick">
      Toggle the <code>highlighted</code> class on the last list item.
    </label>

    <ul>
      <li
        class="my-item"
        :class="{ highlighted: '' }"
      >
        This will never have the class <code>highlighted</code>.
      </li>
      <li
        class="my-item"
        :class="{ highlighted: false }"
      >
        This will never have the class <code>highlighted</code>.
      </li>
      <li
        class="my-item"
        :class="{ highlighted: 'yeah' }"
      >
        This will always have the class <code>highlighted</code>.
      </li>
      <li
        class="my-item"
        :class="{ highlighted: 123 }"
      >
        This will always have the class <code>highlighted</code>.
      </li>
      <li
        class="my-item"
        :class="{ highlighted: isHighlighted }"
      >
        This will have the class <code>highlighted</code> if <code>isHighlighted</code> is true.
      </li>
    </ul>
  </section>

  <section>
    <h2>Multiple classes (using objects)</h2>

    <label>
      <input type="checkbox" @click="onApplyCheckboxClick">
      Toggle the <code>highlighted</code> and <code>my-item</code> classes on the list item.
    </label>

    <ul>
      <li
        :class="{
          'highlighted': shouldApply,
          'my-item': shouldApply,
        }"
      >
        This will have the classes <code>highlighted</code> and <code>my-item</code> if <code>shouldApply</code> is true.
      </li>
    </ul>
  </section>

  <section>
    <h2>Multiple classes (using arrays)</h2>

    <label>
      <input type="checkbox" @click="onToggleClasses">
      Toggle the <code>highlighted</code> and <code>bold</code> classes on the last list item.
    </label>

    <ul>
      <li
        class="my-item" :class="isToggledOn && activeClasses"
      >
        This will have the classes <code>highlighted</code> and <code>bold</code> if <code>isToggledOn</code> is true.
      </li>
      <li
        class="my-item"
        :class="[
          isToggledOn && 'highlighted',
          isToggledOn ? 'bold' : '',
        ]"
      >
        This will also have the classes <code>highlighted</code> and <code>bold</code> if <code>isToggledOn</code> is true.
      </li>
    </ul>
  </section>

  <section>
    <h2>Multiple classes (mixing objects and arrays)</h2>

    <label>
      <input
        type="checkbox"
        :value="customStyleEnabled"
        @change="customStyleEnabled = !customStyleEnabled"
      >
      Apply custom style?
    </label>

    <select @change="handleSelectionChange">
      <option value="">
        pick one
      </option>
      <option
        v-for="currentClassName in classNames"
        :key="currentClassName"
        :value="currentClassName"
      >
        {{ currentClassName }}
      </option>
    </select>

    <div
      :class="[
        shouldFirstClassBeApplied ? 'first-class' : '',
        { [selectedClassName]: customStyleEnabled && selectedClassName },
      ]"
    >
      Vue rocks!
    </div>
  </section>
</template>

<style>
.checked-class {
  color: lightseagreen;
}

.unchecked-class {
  color: slateblue;
}

li {
  padding: 0.25rem;
  margin: 0.25rem;
}

.highlighted {
  color: #42b983;
  border: 1px solid #42b983;
}

.my-item {
  padding: 0.25rem;
  margin: 0.25rem;
}

.first-class {
  padding: 1rem;
  font-style: bold;
}

.error {
  color: tomato;
}

.warning {
  color: gold;
}

.info {
  color: dodgerblue;
}

.success {
  color: limegreen;
}

.bold {
  font-weight: bold;
}
</style>
