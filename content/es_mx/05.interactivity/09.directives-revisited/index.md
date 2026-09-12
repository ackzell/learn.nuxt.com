---
title: Directives (revisited)
---

This will be quick, I promise. Just wanted to get something out of my chest about directives before we move on to the next topic.

# On directives' syntax

Here is a breakdown of the different parts that make a directive. You can hover over (or tap if on mobile) the different examples of directives and see what corresponds to which legend on the bottom 🤓

:DirectivePartsDiagram

Sure, there is _some more special syntax you have to learn_ on top of good old HTML. But in my humble opinion it isn't difficult to learn nor does it make the markup difficult to read.

Here's actual production code from [the Vue Devtools repo](https://github.com/vuejs/devtools/blob/a27a0881e410bdc00469269f4ecb1b5a79435f0e/packages/ui/src/components/Dropdown.vue). There's more stuff going on that we haven't really covered yet, but see if you can spot the directives and understand what they are doing.

```vue
<script setup lang="ts" generic="T">
import type { FloatingVueCommonProps } from '../types'
import type { ButtonProps } from './Button.vue'
import { Dropdown } from 'floating-vue'
import { computed, provide } from 'vue'
import VueButton from './Button.vue'

const props = withDefaults(defineProps<{
  label?: string
  buttonProps?: ButtonProps
  buttonClass?: string
} & FloatingVueCommonProps>(), {
  trigger: 'click',
  buttonClass: '',
  distance: 0,
  disabled: false,
  buttonProps: () => ({}),
})

defineEmits<{
  'update:visible': [value: boolean]
}>()
defineSlots<{
  'default': () => any
  'popper': (props: { hide: () => void }) => any
  'button-icon': () => any
  'button-icon-right': () => any
}>()
provide('$ui-dropdown-disabled', computed(() => props.disabled))
</script>

<template>
  <Dropdown
    :disabled="disabled" class="w-auto inline-block" :shown="shown"
    :triggers="[trigger]" :distance="distance + 6" :placement="placement"
    :skidding="skidding"
    @update:shown="v => $emit('update:visible', v)"
    @click="(e: MouseEvent) => {
      e.stopPropagation()
    }"
  >
    <slot>
      <VueButton
        v-bind="{
          ...buttonProps,
          disabled,
        }"
        :class="buttonClass"
      >
        <template v-if="label" #default>
          {{ label }}
        </template>
        <template #icon>
          <slot name="button-icon" />
        </template>
        <template #icon-right>
          <slot name="button-icon-right" />
        </template>
      </VueButton>
    </slot>
    <template #popper="{ hide }">
      <div class="rounded-lg shadow-lg overflow-hidden">
        <slot v-bind="{ hide }" name="popper">
          <div class="p2 opacity-40">
            Empty...
          </div>
        </slot>
      </div>
    </template>
  </Dropdown>
</template>
```
