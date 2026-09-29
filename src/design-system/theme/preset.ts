import Aura from '@primevue/themes/aura'
import { definePreset } from '@primevue/themes'

/**
 * Rukun design tokens layered on top of Aura.
 * Semantic palette: teal primary, amber warning, rose danger.
 * ponytail: full multi-surface token map; extend when brand evolves
 */
export const RukunPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f3f7f1',
      100: '#e8f0e3',
      200: '#d2e0c9',
      300: '#b2cba4',
      400: '#8db281',
      500: '#699762',
      600: '#477d4e',
      700: '#2d6247',
      800: '#24503b',
      900: '#214735',
      950: '#10291f',
    },
    formField: { borderRadius: '8px', focusBorderColor: '{primary.600}' },
    colorScheme: {
      light: {
        primary: {
          color: '{primary.700}',
          inverseColor: '#ffffff',
          hoverColor: '{primary.800}',
          activeColor: '{primary.900}',
        },
        surface: {
          0: '#ffffff',
          50: '{slate.50}',
          100: '{slate.100}',
          200: '{slate.200}',
          300: '{slate.300}',
          400: '{slate.400}',
          500: '{slate.500}',
          600: '{slate.600}',
          700: '{slate.700}',
          800: '{slate.800}',
          900: '{slate.900}',
          950: '{slate.950}',
        },
      },
      dark: {
        surface: {
          0: '#ffffff',
          50: '{zinc.50}',
          100: '{zinc.100}',
          200: '{zinc.200}',
          300: '{zinc.300}',
          400: '{zinc.400}',
          500: '{zinc.500}',
          600: '{zinc.600}',
          700: '{zinc.700}',
          800: '{zinc.800}',
          900: '{zinc.900}',
          950: '{zinc.950}',
        },
      },
    },
  },
})

export const primeVueConfig = {
  theme: {
    preset: RukunPreset,
    options: {
      darkModeSelector: '.dark',
      cssLayer: false,
    },
  },
} as const
