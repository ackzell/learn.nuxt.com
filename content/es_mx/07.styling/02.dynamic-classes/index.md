---
title: "Dynamic Classes"
ogImage: true
---

# Dynamic Classes

> Well, if I can bind the `style` attribute, I should be able to bind the `class` attribute too, right?

Right you are!

So let's do that now, and see a few things worth knowing for this use case.

## Explicit class names

In the following example, we will bind the `class` attribute to a dynamic value based on the state of a checkbox. When the checkbox is checked, the text will change color because we are conditionally applying a different class to the text element.

```file:/src/App.vue live showConsole extract={1-4, 14-23, 57-59, 62-75, 200-210, 250} hide={1-16}
-
```

Here is the whole implementation, with some notes that explain more about what is going on with the code.

```file:/src/App.vue title="Explicit class names" extract={1-4, 14-23, 57-76, 200-210, 250} /\bchecked-class\b/ /unchecked-class/ {"We can still have static classes as well as the dynamic ones just like with any other attribute binding": 22} {"When the condition is true a class is applied, and a different class is applied otherwise":23-25} /isChecked/ collapse={8-11}
-
```

## Toggling classes

You can also toggle a class on or off based on :tooltip-trigger{id="truthy-falsy"}[`truthy` | `falsy` values]:

::tooltip-content{id="truthy-falsy"}

From the [MDN Docs](https://developer.mozilla.org/en-US/docs/Glossary/Truthy):

> In JavaScript, a truthy value is a value that is considered true when encountered in a Boolean context. All values are truthy unless they are defined as falsy. That is, all values are truthy except false, 0, -0, 0n, "", null, undefined, NaN, and document.all.

::

```file:/src/App.vue live showConsole extract={1-2,5,24-31,57-59,79-117,200-202,211-220,250} hide={1-13}
-
```

```file:/src/App.vue title="Toggling classes" showConsole extract={1-2,[1],5,[1],24-31,57-59,79-117,200-202,211-220,250} collapse={8-9} {"'' is falsy, so the class won't be applied":27} {"123 is truthy, the class will be applied":45} {"Actually useful: we dynamically toggle the class on and off depending on a reactive variable's current value":51}
-
```

You probably noticed that we are using an object now instead of a string for the `:class` binding we used in the first example. The keys of the object are the class names, and only when their values are truthy, the class will be applied to the element.

::tip
Don't forget you can still apply your static classes along with the dynamic ones. You can do that by adding a `class` attribute to the element, and then using the `:class` binding for the dynamic classes. (`.my-item` in the example above is a static class, while `.highlighted` is a dynamic class.)
::

## Multiple classes

We can also apply multiple classes at once, and there are a couple ways to do it: instead of a string, we use an object or an array.

From the previous example, let's now make the `.my-item` class also be conditionally applied to the element

```file:/src/App.vue live showConsole extract={1-2,6,33-40,57-59,121-137,200-202,211-220,250} hide={1-13}
-
```

```file:/src/App.vue title="Multiple classes (using objects)" showConsole extract={1-2,[1],6,[1],33-40,57-59,121-137,200-202,211-220,250} collapse={1-14} {"Each key is a class, and each one depends on the value of the reactive variable":26-29}
-
```

Take a look at this now:

```file:/src/App.vue live showConsole extract={1-2,7-8,42-49,57-59,141-163,200-202,216-219, 221-224,247-249,250} hide={1-14}
-
```

```file:/src/App.vue extract={1-2,[1],7-8,[1],42-49,57-59,141-163,200-202,216-219, 221-224,247-249,250} collapse={1-16} {"Now using an array instead of an object":33-36} {"These two lines accomplish the same thing: only include the class when the condition is true":34-35}
-
```

## Objects in arrays

Consider this now: the actual class name is dynamically generated.

In our example, the user has the ability to toggle custom styles for the content below and a dropdown will let them choose between different styles.

```file:/src/App.vue live showConsole extract={1-2,10-13,51-59,167-198,200-202,226-245,250} hide={1-14}
-
```

```file:/src/App.vue title="Objects in arrays" extract={1-2,[1],10-13,[1],51-59,167-198,200-202,226-245,250} collapse={19-41} {"These will be used as keys for the object we dynamically assign to the class attribute":6} {"Using the ternary operator we saw before":44} {"The classname is derived from the value of the reactive variable":45}  /error/ /warning/ /info/ /success/
-
```

::tip
TL;DR

I know it seems like a lot, but at the end of the day we want to provide the class names we want to apply: either as the _keys_ in an object, or as the _string entries_ in an array that is bound to the `class` attribute.
::
 