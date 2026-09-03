// HTML template entry point. Renders a minimal starting state.
//
// When this preview is a challenge, the host marks it with a `?challenge=`
// query param pointing at the authored suite file. Only then do we load the
// validation runtime (which registers the `run-suite` message listener the
// host drives via postMessage). Plain HTML demos skip the harness entirely.
const challenge = new URLSearchParams(location.search).get('challenge')

const app = document.querySelector('#app')
app.innerHTML = `
  <h1>HTML Template</h1>
  <p>Edit this file to get started.</p>
`

if (challenge) {
  import('/__challenge__/harness.js').then(({ startChallengeRuntime }) => {
    startChallengeRuntime(challenge)
  })
}
