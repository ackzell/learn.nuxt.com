// Per-pattern highlight palette for /pattern/ regex highlights in code fences.
//
// Each unique /pattern/ in a fence is assigned the next color in `palette`
// (cycling), so adjacent patterns are visually distinct while all matches of
// the same pattern share one color.
//
// The palette values are stable +/- hue steps in oklch that read as distinct
// accent colors on both light and dark backgrounds, and are designed to stay
// clearly separate from the primary `--amv-highlight` accent used for
// annotation rows / line tints.

export const highlightPalette = [
  'tip',
  'info',
  'challenge',
] as const

export type HighlightPaletteColor = (typeof highlightPalette)[number]

// CSS variables (exposed as --ec-hl-<color> on the code block) used to tint
// each variant. Values are derived from the project's UnoCSS theme colors so
// they stay consistent with the rest of the design system.
export function highlightCssVar(color: HighlightPaletteColor): string {
  return `--ec-hl-${color}`
}
