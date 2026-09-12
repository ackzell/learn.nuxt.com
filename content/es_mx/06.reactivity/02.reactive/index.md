---
title: reactive()
ogImage: true

---

# reactive()

```vue twoslash showLineNumbers=false
<script setup>
import { reactive } from 'vue'
//       ^?
</script>









<template>
  ...
</template>
```

Vue has another way to "mark" your variables and
_keep track of their value changes_.

`reactive()` will turn **an entire object**... well... reactive 😅, this time not by wrapping it into another object, but through something called [proxies](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Proxy).

The nitty gritty of the inner workings is super interesting, but not quite useful to know in the day to day if I'm being honest. I don't think we need to go in depth learning about _how_ Vue does it, and at least for this beginners content we should just be aware that it exists.

So this is how you make **an object** reactive:

::magic-move{lang="vue"}

```vue title="Say we had a player"
<script setup>
const player = {
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3
}
</script>
```

```vue title="Import reactive() and wrap the object with it"
<script setup>
import { reactive } from 'vue'

const player = reactive({
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3
})
</script>
```

```vue title="Let's display the player on the page"
<script setup>
import { reactive } from 'vue'

const player = reactive({
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3
})
</script>

<template>
  <pre>{{ player }}</pre>
</template>
```

```vue title="And we now can heal..."
<script setup>
import { reactive } from 'vue'

const player = reactive({
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3
})
</script>

<template>
  <pre>{{ player }}</pre>

  <button @click="player.health += 10">
    Heal Player
  </button>
</template>
```

```vue title="...or even kill them ☠️"
<script setup>
import { reactive } from 'vue'

const player = reactive({
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3
})
</script>

<template>
  <pre>{{ player }}</pre>

  <button @click="player.health += 10">
    Heal Player
  </button>

  <button @click="player.health = 0; player.spawnsLeft--;">
    Kill Player
  </button>
</template>
```

::

Check out the running example.

```vue live hide={1-3, 9-13, 21-22}
<script setup>
import { reactive } from 'vue'

const player = reactive({
  nametag: 'ackzell',
  health: 15,
  spawnsLeft: 3
})
</script>

<template>
  <pre>{{ player }}</pre>

  <button @click="player.health += 10">
    Heal Player (+10 health)
  </button>

  <button @click="player.health = 0; player.spawnsLeft--">
    Kill Player (health = 0, spawnsLeft - 1)
  </button>
</template>
```

## Keep in mind

For now I want to show you a couple things related to `reactive()` that are important to keep in mind:

### Nested properties

_Nested objects inside a reactive object are also made reactive_. See the playground example for this: let's say the player now has an `inventory[]`: an array of objects they carry.

```file:/src/App.vue {"These are also reactive":8-16} {"Means we can upgrade the player's weapons like this":23-29} {"Note we are calling methods now":46-48} collapse={55-61}
-
```

::tip
Pay close attention to the methods in the `<script>` tag. Did you notice we are not using `.value` at all this time? (It's `player.health`, and **NOT** `player.value.health`) This is because of what we said about _how_ Vue creates the `reactive` objects: since they are proxies, there is no "wrapper" around them.
::

### Original vs reactive proxy objects

Also important: given that proxies are in the end also JS objects, they behave like such. This can lead you to weird behaviors if you tried modifying the original object for some reason. So: always use the reactive version of the object once you have made it reactive. Don't try to use the original object, as it won't be reactive and thus won't trigger updates on the DOM (the rendered page).

They are also, not the same object. I'll leave you an interactive example with some of the things that the official docs cover:

```vue live showConsole=true showPreview=false
<script setup>
import { onMounted, reactive } from 'vue'

const raw = {}

const proxy = reactive(raw)

onMounted(() => {
  console.log('Original object:', raw)
  console.log('Reactive object:', proxy)
  console.log('Are they the same object?', raw === proxy)
})
</script>

<template></template>
```

I created an example on the playground <ButtonShowSolution />

You should be able to perform actions on the original `player` object as well as on the `reactivePlayer` one (the proxy). And while doing so, the console will print the latest value of the object you are modifying. You will see that the original object is not reactive, and thus won't trigger updates on the DOM, whereas the `reactivePlayer` will. And yet, both of them show the same value if you ran `logObjects` (clicking on the button). This is because they point to the same object in memory.

For example, this is the output I got from the following sequence:

```md
Click "Heal Player"
Click "Heal Player"
Click "Heal Reactive Player"
Click "Kill Player"
Click "Heal Reactive Player"
Click "Kill Player"
Click "Log Objects"
```

```ts showLineNumbers=false
Player healed Object {nametag: "ackzell", health: 25, spawnsLeft: 3}
Player healed Object {nametag: "ackzell", health: 35, spawnsLeft: 3}
Player healed Proxy(Object) {nametag: "ackzell", health: 45, spawnsLeft: 3}
Player killed Object {nametag: "ackzell", health: 0, spawnsLeft: 2}
Player healed Proxy(Object) {nametag: "ackzell", health: 10, spawnsLeft: 2}
Player killed Object {nametag: "ackzell", health: 0, spawnsLeft: 1}
Original player object: Object {nametag: "ackzell", health: 0, spawnsLeft: 1}
Reactive player object: Proxy(Object) {nametag: "ackzell", health: 0, spawnsLeft: 1}
```

It's best if you try it yourself and take your time with it. But don't sweat it! We'll discuss some more stuff regarding reactivity and you'll see we don't even use reactive that much at the end of the day.
 