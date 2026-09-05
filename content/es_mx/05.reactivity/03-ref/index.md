---
title: ref()
ogImage: true

---

# ref()

> So how do we _mark_ those variables then?

Great question! The [recommended way](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#declaring-reactive-state-1) to do so is by "wrapping" them with `ref()`.

::magic-move{lang="vue"}

```vue title="We start with a message variable"
<script setup>
import { version } from 'vue'

const message = 'Hola ref!'
</script>
```

```vue title="Wrap it in ref()"
<script setup>
import { ref, version } from 'vue'

const message = ref('Hola ref!')
</script>
```

Let's focus on _reading the value_ first in our example code:

```vue title="Now we can use it in the template"
<script setup>
import { ref, version } from 'vue'

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

But then, we need to also see the rest of the code to understand a couple things better: What happens if we update the value of the `message` _after_ it has been declared?

## ref() inside the `<script>` tag

Let's focus now on the flow of the `message`'s value now that we update it from the text input: when the user types something, the `h1` will be automagically updated with the input's current value. And when you click on the button, you should see in the console output the latest value that matches the `h1`.

```file:/src/App.vue title="App.vue" {"Handles the update from the input":6-10} {"This logs the 'wrapped' variable, eg. an object":13}  {"Whereas this logs the actual value we care about":15} {"Bind the message variable to the input's value and change it when user types in it":24}  collapse={2-5, 18-19, 29-41}
-
```

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

```file:/src/App.vue title="App.vue" {"NOT reactive":18} collapse={4-17, 22-27, 33-41} /(?<!')\bversion\b/
-
```

::tip
In the [words of the docs](https://vuejs.org/guide/essentials/reactivity-fundamentals.html#why-refs):

> Another nice trait of refs is that unlike plain variables, you can pass refs into functions while retaining access to the latest value and the reactivity connection. This is particularly useful when refactoring complex logic into reusable code.

::

Asegurémonos de que las ideas clave quedaron claras:

::quiz{id="ref-unwrapping"}
 