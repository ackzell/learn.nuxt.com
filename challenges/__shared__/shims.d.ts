/**
 * Ambient module types for mounting components from source in Vue templates.
 * The generated suite lives in `__challenge__/` and imports the learner's
 * component relative to it; Vite resolves these at runtime.
 */
declare module '*.vue' {
  const component: any
  export default component
}

declare module '*.vue?raw' {
  const source: string
  export default source
}
