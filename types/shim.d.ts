declare module '#build/templates/vue' {
  const files: Record<string, string>
  export default files
}
declare module '#build/templates/html' {
  const files: Record<string, string>
  export default files
}
declare module '#build/templates/vue-sass' {
  const files: Record<string, string>
  export default files
}
declare module 'monaco-editor-core/esm/vs/editor/contrib/codelens/browser/codeLensCache' {}
declare module 'monaco-editor-core/esm/vs/editor/contrib/inlayHints/browser/inlayHintsController' {}
declare module 'monaco-editor-core/esm/vs/editor/contrib/suggest/browser/suggestMemory' {}
declare module 'monaco-editor-core/esm/vs/platform/actionWidget/browser/actionWidget' {}
declare module 'monaco-editor-core/esm/vs/editor/common/services/treeViewsDndService' {}
declare module 'luna-console' {
  interface LunaConsoleOptions {
    theme?: string
  }
  class LunaConsole {
    constructor(element: HTMLElement, options?: LunaConsoleOptions)
    setOption(key: string, value: any): void
    log(...args: any[]): void
    warn(...args: any[]): void
    error(...args: any[]): void
    info(...args: any[]): void
    debug(...args: any[]): void
    table(...args: any[]): void
    dir(...args: any[]): void
    clear(keepHistory?: boolean): void
  }
  export default LunaConsole
}
declare module 'luna-console/luna-console.css' {}
declare module '~/templates/console-interceptor' {
  export const CONSOLE_INTERCEPTOR_CODE: string
}
declare module 'virtual:guide-session-map' {
  const map: Record<string, string>
  export default map
}
declare module 'virtual:guide-meta-map' {
  const map: Record<string, () => Promise<{ meta: import('./guides').GuideMeta }>>
  export default map
}
declare module 'virtual:quiz-map' {
  const map: Record<string, import('./quiz').QuizMapEntry>
  export default map
}
