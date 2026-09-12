---
title: v-on
ogImage: true
---

# `v-on`

The equivalent to the previous logic in Vue would be:

```vue title="App.vue" /v-on:click=/ /handleClick/
<script setup>
function handleClick() {
  alert('Button clicked!')
}
</script>

<template>
  <button v-on:click="handleClick">
    Click me
  </button>
</template>
```

`v-on` is another built in [directive](/rendering-on-the-page/directives) that Vue provides so we can avoid the whole boilerplate that `addEventListener` requires.

The argument we pass to `v-on` is the event we want to listen to, in this case `click`, and the value is the method we want to call when that event happens, in this case `handleClick`.

See it in action:

```vue live
<script setup>
function handleClick() {
  alert('Button clicked!')
}
</script>

<template>
  <button v-on:click="handleClick">
    Click me
  </button>
</template>
```

## Shorthand `@`

Just like the shorthand for `v-bind` is `:`, the shorthand for `v-on` is `@`. So the above code can be rewritten as:

```vue title="App.vue" /@click=/
  <button @click="handleClick">
    Click me
  </button>
```

I prefer using it and most of the code I've seen out there uses it, but you can use the full syntax if you want to be more explicit.

::tip

There is also a linting rule that allows you to enforce the use of the shorthand, so if you try to use `v-on` instead of `@`, you'll get a warning: [vue/v-on-style](https://eslint.vuejs.org/rules/v-on-style). But it could be the other way around too, if you prefer the full syntax.

::
