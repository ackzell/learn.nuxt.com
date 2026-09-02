export default defineAppConfig({
  codeSnippets: {
    annotation: {
      position: 'row',
      rowPlacement: 'before',
    },
    collapse: {
      toggleable: true,
      collapsedIconClass: 'i-mynaui-chevron-right',
      expandedIconClass: 'i-mynaui-chevron-down',
      widgetClass: '',
    },
    // Per-pattern /pattern/ highlight colors, cycled in order across patterns.
    // Update here (or in `configs/ecHighlight.ts`) to change the palette.
    highlight: {
      colors: ['tip', 'info', 'challenge'],
    },
  },
})
