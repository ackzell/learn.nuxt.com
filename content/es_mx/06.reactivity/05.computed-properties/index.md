---
title: "computed()"
ogImage: true
---

# computed()

```vue twoslash showLineNumbers=false
<script setup>
import { computed, ref } from 'vue'
//       ^?








const purchase = ref(100)
const tax = 0.16

const grandTotal = computed(
  () => (purchase.value * (1 + tax))
)
</script>

<template>
  ...
</template>
```

These are super cool in my opinion. A little bit of magic hurts no one 😁. One of the most powerful concepts in Vue if you ask me and soon I hope I'll explain myself why.

Computed props are another way to define a piece of reactive data (along `ref()` and `reactive()`) that in this case will update when their _dependencies_ do.

```vue title="Declaring a computed prop" {"grandTotal is a reactive variable itself":7} {"We pass in a getter function":8-10}
<script setup>
import { computed, ref } from 'vue'

const purchase = ref(100)
const tax = 0.16

const grandTotal = computed(
  () => {
    return (purchase.value * (1 + tax))
  }
)
</script>

```

## They enable cleaner templates

Imagine we wanted to apply some transformation to a given string input:

```vue live
<script setup>
import { ref } from 'vue'

const message = ref('hello there')
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <p>
    <code>transformed message:</code>
    {{ message
      ? `👏${message.split(' ').join('👏')}👏`.toUpperCase()
      : 'No message was set'
    }}
  </p>
</template>
```

We know we can use [JS expressions in templates](/rendering-on-the-page/text-interpolation), this is why we are able to _transform_ the string within the mustaches and even add the ternary operator as we've seen earlier in this book.

```vue title="In template calculations" {"Transform the string to add the emojis, notify the user when there is no message available":16-19} collapse={1-6}
<script setup>
import { ref } from 'vue'

const message = ref('')
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <p>
    <code>transformed message:</code>
    {{ message
      ? `👏${message.split(' ').join('👏')}👏`.toUpperCase()
      : 'No message was set'
    }}
  </p>
</template>
```

It might not be super annoying for this particular example, but the template becomes cluttered when you have lots of these "in place" value calculations. Let's introduce a `clappingMessage` computed prop as an alternative:

```vue live
<script setup>
import { computed, ref } from 'vue'

const message = ref('hello there')

const clappingMessage = computed(() => {
  const split = message.value.split(' ')

  return message.value
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
})
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <p>
    <code>transformed message:</code>
    {{ clappingMessage }}
  </p>
</template>
```

```vue title="Computed props in templates" collapse={1-4, 12-20} /clappingMessage/ {"Render the variable on the template instead of the whole logic to calculate (or compute) the new text": 23}
<script setup>
import { computed, ref } from 'vue'

const message = ref('hello there')
const clappingMessage = computed(() => {
  const split = message.value.split(' ')

  return message.value
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
})
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <p>
    <code>transformed message:</code>
    {{ clappingMessage }}
  </p>
</template>
```

Maybe we can agree here: having _just_ `clappingMessage` in the template makes it more readable.

## What about methods?

> yeah, what about them?
>
> I could _just_ use a method to decorate the string

Ahh, yes! That is true. So you mean something like:

```vue live hide={2-5, 16-21}
<script setup>
import { computed, ref } from 'vue'

const message = ref('still works!')

function clappifyString(theMessage) {
  const split = theMessage.split(' ')

  return theMessage
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
}
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <p>
    <code>transformed message:</code>
    {{ clappifyString(message) }}
  </p>
</template>
```

It clearly does the job. Can't argue there. But to continue the conversation regarding this there is something important to note about computed props...

## Cache

> what?

We mentioned the _dependencies_ of the computed props a couple times and this is where they hopefully will make sense.

Check the console on this example and note how many times the `'calculating squared'` message appears:

```vue live showConsole
<script setup>
import { computed, ref } from 'vue'

const amount = ref(3)
const squared = computed(() => {
  console.log('calculating squared')
  return amount.value * amount.value
})
</script>

<template>
  {{ squared }} {{ squared }} {{ squared }}
</template>
```

It was printed **only once**! But why? Well, as long as `amount`'s value doesn't change, no matter how many times I use the computed prop, it will return the last value itself calculated.

```vue title="Computed cache" {"We print the value 3 times on the page, but never alter the amount variable":12} {"amount is the dependency here":7}
<script setup>
import { computed, ref } from 'vue'

const amount = ref(3)
const squared = computed(() => {
  console.log('calculating squared')
  return amount.value * amount.value
})
</script>

<template>
  {{ squared }} {{ squared }} {{ squared }}
</template>
```

::tip
Rendering a value on multiple places is common in front end apps (think online shopping carts for example), so we are not that far from reality here! Keeps your template clean, and performs well since you calculate the value only once.
::

Back to the "Computed vs Methods" from before: clearly, there is an advantage on using computed props on specific cases as they will **only** execute the new _computation_ when one of their deps updates. This is good :tooltip-trigger{id='computed-performance'}[for performance]: you avoid executing _on every re-render_ which is what methods do.

::tooltip-content{id='computed-performance'}
From the [official docs](https://vuejs.org/guide/essentials/computed.html#computed-caching-vs-methods):

> Imagine we have an expensive computed property `list`, which requires looping through a huge array and doing a lot of computations. Then we may have other computed properties that in turn depend on `list`. Without caching, we would be executing `list`’s getter many more times than necessary! In cases where you do not want caching, use a method call instead.

::

> Show me the money

Sure, let's go.

The following is an example where there is a forced re-render and you'll see how the method runs on every render _and_ on every `message` update, whereas the computed prop getter will only execute when the `message` value updates, otherwise returning the cached value.

```vue live showConsole hide={2-6, 25-52}
<script setup>
import { computed, ref } from 'vue'

const message = ref('hi there')
const isDisplayed = ref(true)

const clappingMessage = computed(() => {
  console.log('clappingMessage computed getter ran')
  const split = message.value.split(' ')

  return message.value
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
})

function clappifyString(theMessage) {
  console.log('clappifyString method ran')
  const split = theMessage.split(' ')

  return theMessage
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
}
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <label>
    <input type="checkbox" :checked="isDisplayed" @input="isDisplayed = !isDisplayed">
    Show output
  </label>
  <div v-if="isDisplayed">
    <h2>Method</h2>

    <p>
      <code>transformed message:</code>
      {{ clappifyString(message) }}
    </p>

    <h2>Computed property</h2>

    <p>
      <code>transformed message:</code>
      {{ clappingMessage }}
    </p>
  </div>
</template>
```

```vue title="Computed vs Method" {"the v-if will force the rerender":37} /isDisplayed/ collapse={9-13, 18-22, 27-36} {"Executes the method every time the div is added to the DOM + message changes":42} {"Executes the getter callback from the computed only when message changes":49}
<script setup>
import { computed, ref } from 'vue'

const message = ref('hi there')
const isDisplayed = ref(true)

const clappingMessage = computed(() => {
  console.log('clappingMessage computed getter ran')
  const split = message.value.split(' ')

  return message.value
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
})

function clappifyString(theMessage) {
  console.log('clappifyString method ran')
  const split = theMessage.split(' ')

  return theMessage
    ? `👏${split.join('👏')}👏`.toUpperCase()
    : 'No message was set'
}
</script>

<template>
  <p>
    <input
      :value="message"
      @input="message = $event.target.value"
    >
  </p>
  <label>
    <input type="checkbox" :checked="isDisplayed" @input="isDisplayed = !isDisplayed">
    Show output
  </label>
  <div v-if="isDisplayed">
    <h2>Method</h2>

    <p>
      <code>transformed message:</code>
      {{ clappifyString(message) }}
    </p>

    <h2>Computed property</h2>

    <p>
      <code>transformed message:</code>
      {{ clappingMessage }}
    </p>
  </div>
</template>
```

If I **didn't type anything in the input but still toggled the checkbox a few times**, I get in the console:

```md /5/ showLineNumbers=false
clappifyString method ran
clappingMessage computed getter ran
5 clappifyString method ran
```

The method ran 5 times (once each time the checkbox was checked) and the computed getter only ran once in all these show/hide cycles.

## Calculate _derived_ values

Have you worked with a spreadsheet before? You know, using the formulas for getting the total of a sum and things like that?

We can tell Vue to help us accomplish something similar with computed props. Let's build on top of the very first example from this lesson:

```vue live hide={12-22}
<script setup>
import { computed, ref } from 'vue'

const purchase = ref(100)
const TAX = 0.16

const grandTotal = computed(
  () => (purchase.value * (1 + TAX)).toFixed(2)
)
</script>

<template>
  <input type="number" :value="purchase" @input="purchase = $event.target.value">

  <p>
    Your purchase: {{ purchase }}
  </p>

  <p>
    <strong>Total: {{ grandTotal }}</strong>
  </p>
</template>
```

We are letting the user update the `purchase` value from the input, and we _automagically_ calculate the total based on a hardcoded tax amount that should be applied to the transaction.

```vue collapse={12-22} {"All the calculation done within the callback":8} {"This is one of the dependencies of the computed value":4} {"This is a constant, but still in scope for the computed callback to reach it":5}
<script setup>
import { computed, ref } from 'vue'

const purchase = ref(100)
const TAX = 0.16

const grandTotal = computed(
  () => (purchase.value * (1 + TAX)).toFixed(2)
)
</script>

<template>
  <input type="number" :value="purchase" @input="purchase = $event.target.value">

  <p>
    Your purchase: {{ purchase }}
  </p>

  <p>
    <strong>Total: {{ grandTotal }}</strong>
  </p>
</template>
```

## Assigning values to them

In my opinion it is hard to find a use for this, but the ability is there, so let's give it a shot first:

```vue twoslash title="The wrong way"
// @errors: 2540
<script setup>
import { computed, ref } from 'vue'

const purchase = ref(100)
const tax = 0.16

const grandTotal = computed(
  () => (purchase.value * (1 + tax))
)

grandTotal.value = 300
</script>

<template>
  ...
</template>
```

To do that, we use a different syntax when declaring `grandTotal`:

```vue live showConsole hide={26-46}
<script setup>
import { computed, ref } from 'vue'

const purchase = ref(100)
const tax = 0.16

const grandTotal = computed(
  {
    get: () => (purchase.value * (1 + tax)),
    set: (value) => {
      console.log('running the computed setter')
      purchase.value = value
    }
  }
)

function handle300() {
  grandTotal.value = 300
}

function handle500() {
  grandTotal.value = 500
}
</script>

<template>
  <button @click="handle300">
    Set purchase to 300
  </button>

  <button @click="handle500">
    Set purchase to 500
  </button>

  <p>
    <code>purchase: {{ purchase }}</code>
  </p>

  <p>
    <code>grandTotal: {{ grandTotal }}</code>
  </p>
</template>
```

```vue title="The right way" collapse={2-5, 17-38} {"An object with a getter and a setter methods":8-14}
<script setup>
import { computed, ref } from 'vue'

const purchase = ref(100)
const tax = 0.16

const grandTotal = computed(
  {
    get: () => (purchase.value * (1 + tax)),
    set: (value) => {
      console.log('running the computed setter')
      purchase.value = value
    }
  }
)

function handle300() {
  grandTotal.value = 300
}

function handle500() {
  grandTotal.value = 500
}
</script>

<template>
  <button @click="handle300">
    Set purchase to 300
  </button>

  <button @click="handle500">
    Set purchase to 500
  </button>

  <p>
    <code>purchase: {{ purchase }}</code>
  </p>

  <p>
    <code>grandTotal: {{ grandTotal }}</code>
  </p>
</template>
```

::info

The official docs also provide an example of [writing values to computed props](https://vuejs.org/guide/essentials/computed.html#writable-computed). YET they explicitly have a best practice of basically [leaving them alone](https://vuejs.org/guide/essentials/computed.html#best-practices) because there are other ways to accomplish things. I still think we should treat them as read-only, but still telling you about it in case you find them out in the wild.

::

## Previous value

In a newer version of Vue (3.4) they introduced an ability to read the previous calculated value and so you could do something like "only return the latest value that is below a threshold":

```vue live showConsole hide={15-19, 22-33}
<script setup>
import { computed, ref } from 'vue'

const THRESHOLD = 20
const temperature = ref(0)

const calculatedValue = computed((previous = 0) => {
  console.log('previous value', previous)

  return temperature.value <= THRESHOLD
    ? temperature.value
    : previous
})

function getRandomIntInclusive(min, max) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
}
</script>

<template>
  <p>temperature: <code>{{ temperature }}</code></p>
  <p> calculatedValue: <code>{{ calculatedValue }}</code></p>

  <button @click="temperature += getRandomIntInclusive(5, 10)">
    Increase temperature
  </button>

  <button @click="temperature -= getRandomIntInclusive(10, 20)">
    Decrease temperature
  </button>
</template>
```

Note that the getter is the same, we just read the previous value and we do _something_ with it.

```vue title="The previous argument" showConsole collapse={15-33} {"Passing a previous value and adding a default too":7} /previous/
<script setup>
import { computed, ref } from 'vue'

const THRESHOLD = 20
const temperature = ref(0)

const calculatedValue = computed((previous = 0) => {
  console.log('previous value', previous)

  return temperature.value <= THRESHOLD
    ? temperature.value
    : previous
})

function getRandomIntInclusive(min, max) {
  const minCeiled = Math.ceil(min)
  const maxFloored = Math.floor(max)
  return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled)
}
</script>

<template>
  <p>temperature: <code>{{ temperature }}</code></p>
  <p> calculatedValue: <code>{{ calculatedValue }}</code></p>

  <button @click="temperature += getRandomIntInclusive(5, 10)">
    Increase temperature
  </button>

  <button @click="temperature -= getRandomIntInclusive(10, 20)">
    Decrease temperature
  </button>
</template>
```
 