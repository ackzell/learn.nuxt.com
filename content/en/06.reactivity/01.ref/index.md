---
title: ref()
ogImage: true

---

# ref()

```vue twoslash showLineNumbers=false
<script setup>
import { ref } from 'vue'
//       ^?
</script>









<template>
  ...
</template>
```

> So how do we _mark_ those variables then?

Great question! The [recommended way](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#declaring-reactive-state-1) to do so is by _wrapping_ them with `ref()`.

::magic-move{lang="vue"}

```vue title="We start with a \`message\` variable"

<script setup>
import { version } from 'vue'

const message = 'Hola ref!'
</script>

````

```vue title="Wrap it in ref()"
<script setup>
import { ref, version } from 'vue'

// "hey Vue, please keep an eye on this variable
// and use the latest value for it whenever it changes"
const message = ref('Hola ref!')
</script>
````

Let's focus on _reading the value_ first in our example code:

```vue title="Now we use it in the template"
<script setup>
import { ref, version } from 'vue'

// "hey Vue, please keep an eye on this variable
// and use the latest value for it whenever it changes"
const message = ref('Hola ref!')
</script>

<template>
  <h1>{{ message }}</h1>
</template>
```

::

<!--
file:/src/App.vue title="App.vue" {"We import ref":2} {"The message variable is now reactive":4} {"We use the variable in the template, like before":22} collapse={6-18, 24-40} /message/
-->

That's great, I think I had similar code somewhere in the examples already. It is actually pretty intuitive, isn't it?

You will use these reactive variables in two places: the `<script>` tag and the `<template>` tag. Let's see how to work with them in each of those.

## A more complex example

We'll work with a slightly more complex example to understand a couple things better: What happens if we update the value of the `message` _after_ it has been declared?

Let's add an `<input />` and a `<button />` to update the `message` variable and focus on the flow of the value for that variable:

```file:/src/App.vue live  hide={1-20, 36-46} showConsole=true
-
```

When the user enters something in the input, the `h1` will automagically be updated with the :tooltip-trigger{id='input-event'}[input's current (latest) value]. And when you click on the button, you should see in the console output the latest value that matches the `h1`.

::tooltip-content{id='input-event'}
Remember: this is a [DOM event](https://developer.mozilla.org/en-US/docs/Web/API/Element/input_event) we are listening to.
::

Something :tooltip-trigger{id='console-output'}[like this]:

```ts showLineNumbers=false
RefImpl {dep: Dep, __v_isRef: true, __v_isShallow: false, _rawValue: "Hola ref!", _value: "Hola ref!"}
Hola ref!
```

Note that the first line is an object, whereas the second is the actual _string value_.

::tooltip-content{id='console-output'}
With a very small caveat: on the actual browser (if you opened up your console right now and looked for the logged output, you might see actually a bit of an ever so slightly different output.

I actually had to do some magic to intercept the console in the live component as well as the playground (and I'm really proud of the outcome 🤓), then make it behave as close to _"real browser output as possible"_ but it won't be the exact same.

::

Here is the breakdown of the full file:

```file:/src/App.vue title="App.vue" {"Handles the update from the input":6-10} {"This logs the 'wrapped' variable, eg. an object":13}  {"Whereas this logs the actual value we care about":15} {"Bind the message variable to the input's value and change it when user types in it":25}  collapse={2-5, 18-19, 29-41}
-
```

## ref() inside the `<script>` tag

Did you notice the `.value` we appended when referring to `message` in the `<script>` tag? We **must** use the `.value` there because otherwise we would be referring to the "wrapper object" that Vue uses to keep track of the changes for the variable.

:tooltip-trigger{id='ts-tooling'}[TypeScript based tooling] will prevent you from trying to assign a value directly to `message` without the `.value` and will throw a compilation error like this one:

```vue twoslash
// @errors: 2322
<script setup lang="ts">
import { ref } from 'vue'

let message = ref('Hello world!')

function updateMessage(ev) {
  message = 'a new value for the variable'
}
</script>
```

::tooltip-content{id='ts-tooling'}

We will cover this in more detail when we start leveraging TS more, but if you are curious there is a great section that explains how to set up TS in a Vue project [in the official guide](https://vuejs.org/guide/typescript/overview)
::

::tip
There is also a linting rule that will prevent you from making this mistake: [vue/no-ref-as-operand](https://eslint.vuejs.org/rules/no-ref-as-operand.html)
::

::info
The official guide has a more in-depth explanation to all of this, you really should go read it [here](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#why-refs)
::

## ref() inside the `<template>` tag

That is not the case when referring to the `message` variable in the `<template>` tag because Vue _unwraps_ the value for you :tooltip-trigger{id="unwrapping"}[(with some caveats)] in that case.

::tooltip-content{id="unwrapping"}

> Ref unwrapping in templates only applies if the ref is a top-level property in the template render context.

> Another thing to note is that a ref does get unwrapped if it is the final evaluated value of a text interpolation (i.e. a `{{ }}` tag)

Learn more about this in [the official documentation](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#caveat-when-unwrapping-in-templates)
::

Finally, I left the `version` variable on purpose here. Don't mark your variables reactive if:

- You know the _value won't change_
- You _don't need_ to keep track of it

```file:/src/App.vue title="App.vue" {"NOT reactive":18} collapse={4-17, 22-27, 36-45} /(?<!')\bversion\b/
-
```

::tip
In the [words of the docs](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#why-refs):

> Another nice trait of refs is that unlike plain variables, you can pass refs into functions while retaining access to the latest value and the reactivity connection. This is particularly useful when refactoring complex logic into reusable code.

::

Let's make sure the key takeaways are clear:

:quiz{id="ref-unwrapping"}
