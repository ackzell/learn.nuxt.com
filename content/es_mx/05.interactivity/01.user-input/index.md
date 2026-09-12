---
title: User input
ogImage: true
---

# User input

Having an app that shows stuff on the screen is cool and all, but the user should also be able to interact with it if we want to build something actually useful.

Let's see what we can do to make our app interactive.

## Listen to events

The most basic way to make an app interactive is to listen to DOM events. For example, we can listen to the `click` event on a button and do something when the user clicks it.

This is what it would look like [if we did it in plain JS](https://developer.mozilla.org/en-US/docs/Web/API/Document_Object_Model/Events#eventtarget.addeventlistener):

::magic-move{lang="html"}

```html title="Add a button somewhere in the page" showLineNumbers=false
<button id="my-button">Click me</button>
```

```html title="Add an event listener to the button" showLineNumbers=false
<script>
  const btn = document.querySelector('my-button')

  function handleClick(event) {
    alert('Button clicked!')
  }

  btn.addEventListener('click', greet)
</script>

<button id="my-button">Click me</button>
```

::

So, for a button that is in the page, we need to first select it using `querySelector` and then add an event listener to it using `addEventListener`. This is a bit of boilerplate that we have to write every time we want to listen to an event.

::info
An awesome library called [`jQuery`](https://jquery.com/) was a great way to simplify our lives because it brought in a simpler API to do the same thing, besides providing a way of dealing with cross-browser inconsistencies.
::
