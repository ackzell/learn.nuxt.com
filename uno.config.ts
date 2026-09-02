import extractorMdc from '@unocss/extractor-mdc'
import {
  defineConfig,
  presetAttributify,
  presetIcons,
  presetTypography,
  presetWebFonts,
  presetWind4,
  transformerDirectives,
} from 'unocss'

import { presetAnimations } from 'unocss-preset-animations'

export default defineConfig({
  shortcuts: {
    'border-base': 'border-gray-200 dark:border-bgr-800',
    'bg-active': 'dark:bg-bgr-700 bg-bgr-100',
    'bg-faded': 'bg-bgr/5 dark:bg-bgr-dark/5',
    'bg-base': 'bg-white dark:bg-bgr-dark',
    'text-faded': 'text-bgr-500/90 dark:text-bgr-300/90',
    'bg-inline-code': 'bg-gray-100 dark:bg-gray-800/75',
    'border-inline-code': 'border-gray-200 dark:border-bgr-700',

    'z-embedded-docs': 'z-100',
    'z-embedded-docs-raised': 'z-101',
    'z-splitter': 'z-102',
    'z-embedded-docs-close': 'z-103',
    'z-tooltip-popper': 'z-104',
    'z-docs-nav': 'z-105',
    'z-nav': 'z-106',
    'z-toasts': 'z-111',
    'z-index-command-palette': 'z-200',
    'z-dialog-overlay': 'z-201',
    'z-dialog-content': 'z-202',

    // brought in from YV
    'sc-toolbar-btn': 'cursor-pointer hover:text-foreground/80 hover:scale-120 transition duration-200 disabled:cursor-not-allowed disabled:opacity-35 disabled:hover:scale-100 active:scale-95',
    'sc-btn-base': 'p-2 rounded-lg bg-transparent',
    'btn': 'sc-btn-base bg-bgr-800 text-bgr-200 dark:bg-bgr-200 dark:text-dark-900',
    'sc-btn-outline': 'sc-btn-base outline-solid outline-bgr text-bgr hover',

    // overriding shadcn as I didn't install it here
    'border-input': 'border-bgr-500/30',
    'bg-popover': 'bg-bgr-50 dark:bg-bgr-dark border-bgr-500/30',
    'bg-input': 'bg-bgr-100/50 dark:bg-bgr-800',

    'sc-error-message': 'text-sm text-negative-700 p-3 border border-negative/30 rounded-md bg-negative/10 dark:text-negative-300',
  },
  safelist: [
    'bg-info/8',
    'bg-positive/8',
    'bg-warning/8',
    'bg-tip/8',
    'bg-challenge/8',
    'bg-success/8',
    'text-info',
    'text-positive',
    'text-warning',
    'text-tip',
    'text-challenge',

    'dark:text-info-400',
    'text-info-700',
    'dark:text-positive-400',
    'text-positive-700',
    'dark:text-warning-400',
    'text-warning-700',
    'dark:text-tip-400',
    'text-tip-700',
    'dark:text-challenge-400',
    'text-challenge-700',

    'border-info',
    'border-positive',
    'border-warning',
    'border-tip',
    'border-challenge',
    'border-success',
    'bg-primary-dark-500',
    'bg-primary-400',
    'text-primary-500',
    'text-primary-dark-300',

    'text-primary-700',
    'text-primary-500',
    'text-primary-dark-500',

    // Ensure the UnoCSS theme color CSS vars are emitted for use by the
    // /pattern/ highlight palette vars in ProsePre.vue (--colors-tip-500,
    // --colors-info-500, --colors-challenge-500).
    'bg-tip-500',
    'bg-info-500',
    'bg-challenge-500',
  ],
  theme: {
    colors: {
      foreground: {
        DEFAULT: 'oklch(40% 0.05 249)',

        dark: {
          DEFAULT: '#f5f5f5', // whitesmoke
        },
      },

      bgr: {
        DEFAULT: 'oklch(0.9702 0 0)',
        50: 'oklch(0.99 0.0002 36)',
        100: 'oklch(0.93 0.0 0)',
        200: 'oklch(0.82 0.0022 36)',
        300: 'oklch(0.72 0.0038 36)',
        400: 'oklch(0.62 0.0045 36)',
        500: 'oklch(0.52 0.0054 36)',
        600: 'oklch(0.42 0.0065 36)',
        700: 'oklch(0.32 0.0075 36)',
        800: 'oklch(0.23 0.0085 36)',
        900: 'oklch(0.17 0.0093 36)',
        dark: 'oklch(0.15 0.01 110)',

        translucent: {
          DEFAULT: 'oklch(0.9702 0 0 / 80%)',
          dark: 'oklch(0.15 0.01 110 / 80%)',
        },
      },

      primary: {
        DEFAULT: 'oklch(77% 0.14 70)',
        50: 'oklch(0.98 0.03 70)',
        100: 'oklch(0.95 0.05 70)',
        200: 'oklch(0.91 0.07 70)',
        300: 'oklch(0.86 0.09 70)',
        400: 'oklch(0.81 0.11 70)',
        500: 'oklch(0.77 0.14 70)',
        600: 'oklch(0.67 0.14 70)',
        700: 'oklch(0.57 0.14 70)',
        800: 'oklch(0.47 0.14 70)',
        900: 'oklch(0.37 0.14 70)',
        950: 'oklch(0.27 0.14 70)',

        dark: {
          DEFAULT: 'oklch(0.5962 0.2423 358.92)',
          50: 'oklch(1 0.15 358.92)',
          100: 'oklch(0.97 0.2423 358.92)',
          200: 'oklch(0.88 0.2423 358.92)',
          300: 'oklch(0.78 0.2423 358.92)',
          400: 'oklch(0.69 0.2423 358.92)',
          500: 'oklch(0.5962 0.2423 358.92)',
          600: 'oklch(0.44 0.2423 358.92)',
          700: 'oklch(0.34 0.2423 358.92)',
          800: 'oklch(0.26 0.2423 358.92)',
          900: 'oklch(0.18 0.2423 358.92)',
          950: 'oklch(0.12 0.2423 358.92)',
        },
      },

      // tailwind blue
      info: {
        DEFAULT: 'oklch(62.3% 0.214 259.815)',
        50: 'oklch(97% 0.014 254.604)',
        100: 'oklch(97% 0.014 254.604)',
        200: 'oklch(97% 0.014 254.604)',
        250: 'oklch(80.9% 0.105 251.813 / 50%)',
        300: 'oklch(80.9% 0.105 251.813)',
        400: 'oklch(70.7% 0.165 254.624)',
        500: 'oklch(62.3% 0.214 259.815)',
        600: 'oklch(54.6% 0.245 262.881)',
        700: 'oklch(48.8% 0.243 264.376)',
        800: 'oklch(42.4% 0.199 265.638)',
        900: 'oklch(37.9% 0.146 265.522)',
        950: 'oklch(28.2% 0.091 267.935)',
        // dark: 'oklch(0.1368 0.091 267.935)',
        dark: 'oklch(6% 0.091 267.935)',
      },
      // tailwind emerald
      positive: {
        DEFAULT: 'oklch(69.6% 0.17 162.48)',
        50: 'oklch(97.9% 0.021 166.113)',
        100: 'oklch(95% 0.052 163.051)',
        200: 'oklch(90.5% 0.093 164.15)',
        300: 'oklch(84.5% 0.143 164.978)',
        400: 'oklch(76.5% 0.177 163.223)',
        500: 'oklch(69.6% 0.17 162.48)',
        600: 'oklch(59.6% 0.145 163.225)',
        700: 'oklch(50.8% 0.118 165.612)',
        800: 'oklch(43.2% 0.095 166.913)',
        900: 'oklch(37.8% 0.077 168.94)',
        950: 'oklch(26.2% 0.051 172.552)',
      },
      // tailwind yellow
      warning: {
        DEFAULT: '#eab308',
        50: '#fefce8',
        100: '#fef9c3',
        200: '#fef08a',
        300: '#fde047',
        400: '#facc15',
        500: '#eab308',
        600: '#ca8a04',
        700: '#a16207',
        800: '#854d0e',
        900: '#713f12',
        950: '#422006',
        dark: '#422006',
      },
      // tailwind red
      negative: {
        DEFAULT: 'oklch(63.7% 0.237 25.331)',
        50: 'oklch(97.1% 0.013 17.38)',
        100: 'oklch(93.6% 0.032 17.717)',
        200: 'oklch(88.5% 0.062 18.334)',
        300: 'oklch(80.8% 0.114 19.571)',
        400: 'oklch(70.4% 0.191 22.216)',
        500: 'oklch(63.7% 0.237 25.331)',
        600: 'oklch(57.7% 0.245 27.325)',
        700: 'oklch(50.5% 0.213 27.518)',
        800: 'oklch(44.4% 0.177 26.899)',
        900: 'oklch(39.6% 0.141 25.723)',
        950: 'oklch(25.8% 0.092 26.042)',
      },
      // tailwind purple
      tip: {
        DEFAULT: 'oklch(62.7% 0.265 303.9)',
        50: 'oklch(97.7% 0.014 308.299)',
        100: 'oklch(94.6% 0.033 307.174)',
        200: 'oklch(90.2% 0.063 306.703)',
        300: 'oklch(82.7% 0.119 306.383)',
        400: 'oklch(71.4% 0.203 305.504)',
        500: 'oklch(62.7% 0.265 303.9)',
        600: 'oklch(55.8% 0.288 302.321)',
        700: 'oklch(49.6% 0.265 301.924)',
        800: 'oklch(43.8% 0.218 303.724)',
        900: 'oklch(38.1% 0.176 304.987)',
        950: 'oklch(29.1% 0.149 302.717)',
        dark: 'oklch(29.1% 0.149 302.717)',
      },

      // tailwind orange
      challenge: {
        DEFAULT: 'oklch(70.5% 0.213 47.604)',
        50: 'oklch(98% 0.016 73.684)',
        100: 'oklch(95.4% 0.038 75.164)',
        200: 'oklch(90.1% 0.076 70.697)',
        300: 'oklch(83.7% 0.128 66.29)',
        400: 'oklch(75% 0.183 55.934)',
        500: 'oklch(70.5% 0.213 47.604)',
        600: 'oklch(64.6% 0.222 41.116)',
        700: 'oklch(55.3% 0.195 38.402)',
        800: 'oklch(47% 0.157 37.304)',
        900: 'oklch(40.8% 0.123 38.172)',
        950: 'oklch(26.6% 0.079 36.259)',
        dark: 'oklch(26.6% 0.079 36.259)',
      },
    },
  },
  presets: [
    presetWind4(),
    presetIcons({
      collections: {
        carbon: () =>
          import('@iconify-json/carbon/icons.json').then(i => i.default),
        mynaui: () =>
          import('@iconify-json/mynaui/icons.json').then(i => i.default),
      },
    }),
    presetAttributify(),
    presetWebFonts({
      provider: 'bunny',
      fonts: {
        sans: {
          name: 'Work Sans',
          weights: [400, 500, 600, 700],
        },
        mono: {
          name: 'Space Mono',
          weights: [200, 400, 500, 600, 700],
        },
        code: {
          name: 'Ubuntu Mono',
          weights: [400, 700],
        },
        terminal: {
          name: 'Share Tech Mono',
          weights: [200, 400, 500, 600, 700],
        },

        // sans: 'Work Sans:400,500,600,700',
        // mono: 'Space Mono:400,500,600,700',
      },
    }),
    presetTypography(),
    presetAnimations(),
  ],
  extractors: [
    extractorMdc(),
  ],
  content: {
    filesystem: [
      './content/**/*.md',
    ],
  },
  transformers: [
    transformerDirectives(),
  ],
})
