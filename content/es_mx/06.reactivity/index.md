---
title: Reactivity
ogImage: true
---

This stuff is getting more and more fun, right?

Before we learn how to make stuff automagically change in your apps _in practice_ I want to touch upon _the theory_ or "how Vue knows how to do it".

## On Reactivity

Very quickly: Vue implements a dependency-tracking based :tooltip-trigger{id="reactivity"}[reactivity] system.

> ooookay...

It basically means that [under the hood] Vue adds some stuff to your code that enables it to keep up with the variables that have been "marked" as reactive. In other words, every time you tell Vue something like:

> "Hey, this variable might change values in the future, so please keep an eye on it, and use its latest value always."

We can't really do that in plain JS, and this one of the reasons technology like Vue exists, to help create UIs with less effort on our part. Although I must tell you also that with the passing of the years and the convergence of ideas that the different frameworks are adopting [there is a proposal to make it happen in the language itself](https://github.com/tc39/proposal-signals): they are calling this **signals**.

::info
[Here](https://vuejs.org/guide/extras/reactivity-in-depth.html#connection-to-signals) is a comparison on how different frameworks implement reactivity on the official guide you can read.
::

::tooltip-content{id="reactivity"}
Here is a cool explanation of what "reactivity" means:
https://www.pzuraq.com/blog/what-is-reactivity#reactivity-in-plain-english
::
