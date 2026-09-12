---
title: "Binding the style attribute"
ogImage: true
---

# Binding the `style` attribute

We already saw the `v-bind` directive (shorthand: `:`) in action. So for the `style` attribute, you can do exactly that: pass :tooltip-trigger{id='directive-syntax'}[a value] to the directive and that will be the styles that are applied to the element.

::tooltip-content{id="directive-syntax"}
Quick reminder of the syntax of a directive:

::DirectivePartsDiagram
::
::

This means you could prepare a string (`myStyles` in this example) that will be used as the value for the `style` attribute, and then bind it to the element, like so:

```vue live
<script setup>
const activeColor = 'goldenrod'
const myFontSize = 30
const myStyles = `
  color: ${activeColor}; font-size: ${myFontSize}px;
  `
</script>

<template>
  <p :style="myStyles">
    This text is styled dynamically!
  </p>
</template>
```

Sort of okay, but not exactly practical and very prone to errors. Imagine having to manage many such styles at a time, the string would become really long and hard to maintain. Fortunately, Vue allows us to bind an object here too. In the following example you can see we are binding an _inline object_ to the `style` attribute. The keys are the CSS properties and the values still come from our `<script setup>` block.

```vue live
<script setup>
const activeColor = 'tomato'
const myFontSize = 30
</script>

<template>
  <p
    :style="{
      color: activeColor,
      fontSize: `${myFontSize}px`,
    }"
  >
    This text is styled dynamically!
  </p>
</template>
```

::info
Keep in mind that when you update the value in the code above, it changes because the component in the book is re-rendering (think live-reload during development), but not exactly because the value is actually changing in Vue.
::

## Let's make it actually reactive

We'll do so by applying the knowledge we have gained so far about reactivity and turn the variables reactive. After our changes are made, when there is interaction with the buttons, the component will re-render and the styles will be updated.

```vue title="Reactive style tag binding" {"Make the vars reactive": 4-5} {"Methods to update the values": 7-17} {"Updating the values through the buttons": 21-30} /activeColor/ /myFontSize/
<script setup>
import { ref } from 'vue'

const activeColor = ref('tomato')
const myFontSize = ref(30)

function increaseFontSize(step = 1) {
  myFontSize.value += step
}

function decreaseFontSize(step = 1) {
  myFontSize.value -= step
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
  <p
    style="margin-top: 2rem"
    :style="{
      'color': activeColor,
      'font-size': `${myFontSize}px`,
    }"
  >
    This text is styled reactively!
  </p>
</template>
```

Live preview:

```vue live hide={1-30,40}
<script setup>
import { ref } from 'vue'

const activeColor = ref('tomato')
const myFontSize = ref(30)

function increaseFontSize(step = 1) {
  myFontSize.value += step
}

function decreaseFontSize(step = 1) {
  myFontSize.value -= step
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
  <p
    style="margin-top: 2rem"
    :style="{
      'color': activeColor,
      'font-size': `${myFontSize}px`,
    }"
  >
    This text is styled reactively!
  </p>
</template>
```

::tip
Did you notice the CSS properties are now in kebab-case instead of camelCase? This is because we are using a string as the key. Although the recommendation is to use camelCase, Vue is flexible here and let's you write valid CSS property names that way. Cool huh?
::

::tip
Also, note I added a `style` attribute to the `<p>` element. This is because we want to add some margin to the top of the element, but that is a fixed value that won't change. So we can use both the `style` attribute and the `:style` directive at the same time.
::

## An alternative implementation to reactivity

You can also keep the template cleaner by using a reactive object from the start.

::magic-move{lang="vue"}

```vue title="Independent ref() values"
<script setup>
import { ref } from 'vue'

const activeColor = ref('tomato')
const myFontSize = ref(30)

function increaseFontSize(step = 1) {
  myFontSize.value += step
}

function decreaseFontSize(step = 1) {
  myFontSize.value -= step
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
  <p
    style="margin-top: 2rem"
    :style="{
      'color': activeColor,
      'font-size': `${myFontSize}px`,
    }"
  >
    This text is styled reactively!
  </p>
</template>
```

```vue title="Reactive object""
<script setup>
import { ref } from 'vue'

const myStyles = ref({
  color: 'tomato',
  fontSize: '30px'
})

function increaseFontSize(step = 1) {
  myStyles.value.fontSize = `${Number.parseInt(myStyles.value.fontSize) + step}px`
}

function decreaseFontSize(step = 1) {
  myStyles.value.fontSize = `${Number.parseInt(myStyles.value.fontSize) - step}px`
}

function toggleColor() {
  myStyles.value.color = myStyles.value.color === 'tomato' ? 'rebeccapurple' : 'tomato'
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
  <p
    style="margin-top: 2rem"
    :style="myStyles"
  >
    This text is styled reactively!
  </p>
</template>
```

::

Same result:

```vue live hide={1-3, 8-32, 39-40}
<script setup>
import { ref } from 'vue'

const myStyles = ref({
  color: 'tomato',
  fontSize: '30px'
})

function increaseFontSize(step = 1) {
  myStyles.value.fontSize = `${Number.parseInt(myStyles.value.fontSize) + step}px`
}

function decreaseFontSize(step = 1) {
  myStyles.value.fontSize = `${Number.parseInt(myStyles.value.fontSize) - step}px`
}

function toggleColor() {
  myStyles.value.color = myStyles.value.color === 'tomato' ? 'rebeccapurple' : 'tomato'
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
  <p
    style="margin-top: 2rem"
    :style="myStyles"
  >
    This text is styled reactively!
  </p>
</template>
```
 