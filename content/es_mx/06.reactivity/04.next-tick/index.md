---
title: "nextTick()"
ogImage: true
---

# nextTick()

```vue twoslash showLineNumbers=false
<script setup>
import { nextTick } from 'vue'
//       ^?



// usage: with a callback
nextTick(() => {
  // Your code here
})

// OR
// usage: as a promise
async function myFunction() {
  // Your code here
  await nextTick()
  // Your code here
}
</script>


<template>
  ...
</template>
```

There will be times when we want to access the DOM immediately after updating the state (ie. after making updates to the the reactive variables) but that presents a little bit of an issue. Let me show you two examples where this happens and then we'll see how to solve it.

## Immediate DOM Access after State Updates

In this first example we have a list to which we are adding items.

Click on the button and watch the console logging out the elements in the list when the function executes.

```file:/src/App.vue live showConsole hide={13-32} showLineNumbers
-
```

You would see something similar to this on the preview area:

```
Number of elements: 3

139c2ff0-7e0e-4976-ab84-474406c77416
ddfc06c0-40ea-47b6-b842-5ad8026613de
6377b702-a613-4f60-8580-47f701108c13

```

So, yeah, after 3 clicks on the button I get 3 elements in the list, but the interesting part is on the console output:

```
Checking the DOM: NodeList {}
Checking the DOM: NodeList {0: HTMLLIElement}
Checking the DOM: NodeList {0: HTMLLIElement, 1: HTMLLIElement}

```

Just 2 elements are logged as part of the [NodeList](https://developer.mozilla.org/en-US/docs/Web/API/NodeList) after the third click, even though we have 3 elements in the list and we can actually see them on the preview area!

> What?

Feels odd, right? But this is actually expected behavior. Vue batches DOM updates for performance reasons, so when you access the DOM immediately after updating state, you're seeing the "old" DOM structure.

::info
Imagine if Vue didn't batch updates - every single change to a reactive variable would trigger a DOM update, which would potentially drag a large application with lots of elements to a crawl because we are telling the browser to update the DOM over and over again.
::

## Another Scenario

In this example we are trying to focus an input field after it is shown. Remember `v-if` adds and removes elements from the DOM, so when we try to focus the input field immediately after setting `isVisible` to `true`, the element is not yet in the DOM _until the next tick_.

I also left the console output enabled so you can see a warning and an error on the output.

BUT! if you click on the button once more, **now** you get the input field focused.

```file:/src/InputFocus.vue live hide={1, 11, 12-28} showConsole
-
```

> huh

Exactly. This is the same behavior really, just in a different context.

After the first click, the input field is already in the DOM, so it gets focused as intended.

## The solution

To solve these kinds of issues, we need to tell Vue:

> "please wait wait for the DOM to be updated before executing the code"

And we do that by using the [`nextTick`](https://vuejs.org/api/general.html#nexttick) function.

It comes in two flavors, you can use whichever you prefer:

::magic-move{lang="js"}

```js title="Callback based"
import { nextTick } from 'vue'

nextTick(() => {
  // Your code here
})
```

```js title="Promise based"
import { nextTick } from 'vue'

async function myFunction() {
  // Your code here
  await nextTick()
  // Your code here
}
```

::

Here are the solutions to both scenarios, I collapsed some of the code to make it easier to read, but feel free to take your time with it and use it in the playground:

```vue title="Check DOM - Fixed" /nextTick/ {"After the DOM is updated, the callback will run and we'll log the list elements":9} collapse={16-33}
<script setup>
import { nextTick, ref } from 'vue'

const list = ref([])

function addElement() {
  list.value.push({ id: crypto.randomUUID() })

  nextTick(() => {
    const elements = document.querySelectorAll('.my-list-element')
    console.log('Checking the DOM:', elements)
  })
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
```

```vue title="Focus Input - Fixed" /nextTick/ {"After the DOM is updated, we'll await the promise and then focus the input":9} collapse={14-29}
<script setup>
import { nextTick, ref } from 'vue'

const isVisible = ref(false)
const inputRef = ref(null)

async function showInput() {
  isVisible.value = true
  await nextTick()
  inputRef.value.focus()
}
</script>

<template>
  <div>
    <button @click="showInput">
      Show Input
    </button>

    <div>
      <input
        v-if="isVisible"
        ref="inputRef"
        type="text"
        placeholder="I should be focused..."
      >
    </div>
  </div>
</template>
```

::tip
Remember that the callback and promise based approaches are interchangeable syntax, you can use either one depending on your preference.
::

::tip
The official docs talk about `nextTick()` [here](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#dom-update-timing) and [here are the API docs](https://vuejs.org/api/general.html#nexttick) if you want to take a look.
::
 