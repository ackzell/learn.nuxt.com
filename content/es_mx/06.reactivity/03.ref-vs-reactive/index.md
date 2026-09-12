---
title: Ref vs Reactive
ogImage: true
---

# The unavoidable question

> Isn't it better to use `reactive()` since I don't have to type `.value` every time?

And alternatively:

> Seems like I can **just** use `reactive()` since it does the same.

Well... nope.

The thing is, if you were to use **just one** of them most of the time, it is advised to default to `ref()` actually. And reach for `reactive()` in more specific use cases.

::tip
[Here](https://michaelnthiessen.com/ref-vs-reactive) is an excellent resource that will provide more in-depth comparisons and an explanation why the author prefers going with `ref()` unless there is something specific that can be done with `reactive()` and it would actually be better.
::

These days is actually easy to write `ref()` code, because the tooling helps you with the `.value` access, like what I mentioned before about the linting and the editor extensions adding "auto typing" it for you. Also, if you check out the other implementations for "signals" in other frameworks, you'll see that they now share a similar idea of "having to unwrap the value" or "call a method to obtain it" in one form or another.

Keep in mind also that `reactive()` works on objects, not on other primitives like strings, numbers, booleans, etc.
