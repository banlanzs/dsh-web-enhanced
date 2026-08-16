/**
 * Skin catalog: the selectable full-surface skins. Each skin is one
 * `ThemeTokenOverrides` layer — every value a `{ light, dark }` pair so the
 * skin stays legible under both Appearance preferences (the host owns the
 * scheme; a skin only recolors the alias tokens). Applied through the theme
 * service's override stack, a skin composes with (never replaces) the built-in
 * light/dark palettes, and removing the layer restores the stock UI.
 *
 * `none` carries no tokens: it is the "stock" choice that simply stacks
 * nothing.
 * @module dsh-web-enhanced/src/client/skins/themes
 */

import type { ThemeTokenOverrides } from '@deepseek-ai/dsh-client-ui-theme/client'

/** Scheme-invariant override value (applied to both palettes). */
const both = (value: string): { light: string; dark: string } => ({ light: value, dark: value })

/** Deep-sea navy / cool white-blue — recolors every alias surface. */
const OCEAN: ThemeTokenOverrides = {
  '--dsw-alias-bg-base': { light: '#F4F8FD', dark: '#0C121B' },
  '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#111A27' },
  '--dsw-alias-bg-layer-2': { light: '#ECF2FA', dark: '#162130' },
  '--dsw-alias-bg-layer-3': { light: '#E2EBF7', dark: '#1C2A3D' },
  '--dsw-alias-bg-overlay': { light: '#DCE7F4', dark: '#22334A' },
  '--dsw-alias-bg-module-platform': { light: '#FFFFFF', dark: '#111A27' },
  '--dsw-alias-bg-skeleton': { light: 'rgba(19, 45, 83, 0.08)', dark: 'rgba(148, 180, 220, 0.12)' },
  '--dsw-alias-bg-mask-1': { light: 'rgba(19, 37, 62, 0.3)', dark: 'rgba(4, 8, 14, 0.55)' },
  '--dsw-alias-bg-mask-2': { light: 'rgba(19, 37, 62, 0.12)', dark: 'rgba(4, 8, 14, 0.25)' },
  '--dsw-alias-bg-mask-3': { light: 'rgba(19, 37, 62, 0.3)', dark: 'rgba(4, 8, 14, 0.5)' },
  '--dsw-alias-bg-mask-drop': { light: 'rgba(244, 248, 253, 0.72)', dark: 'rgba(12, 18, 27, 0.7)' },
  '--dsw-alias-border-l1': { light: 'rgba(19, 45, 83, 0.08)', dark: 'rgba(148, 180, 220, 0.08)' },
  '--dsw-alias-border-l2': { light: 'rgba(19, 45, 83, 0.14)', dark: 'rgba(148, 180, 220, 0.15)' },
  '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(19, 45, 83, 0.1)', dark: 'rgba(148, 180, 220, 0.1)' },
  '--dsw-alias-border-l3': { light: 'rgba(19, 45, 83, 0.22)', dark: 'rgba(148, 180, 220, 0.24)' },
  '--dsw-alias-border-l4': { light: 'rgba(19, 45, 83, 0.32)', dark: 'rgba(148, 180, 220, 0.34)' },
  '--dsw-alias-border-inverted': { light: 'rgba(19, 45, 83, 0.06)', dark: 'rgba(148, 180, 220, 0.12)' },
  '--dsw-alias-border-inverted2': { light: 'rgba(19, 45, 83, 0.08)', dark: 'rgba(148, 180, 220, 0.08)' },
  '--dsw-alias-label-primary': { light: '#13243E', dark: '#EAF2FC' },
  '--dsw-alias-label-secondary': { light: '#40597A', dark: '#AFC3DC' },
  '--dsw-alias-label-tertiary': { light: '#5D7696', dark: '#8399B5' },
  '--dsw-alias-label-caption': { light: '#7E93AC', dark: '#6B829F' },
  '--dsw-alias-label-dimmed': { light: '#C9D4E2', dark: '#4E5F76' },
  '--dsw-alias-label-primary-bluish': { light: '#2E5EB8', dark: '#BFD6F6' },
  '--dsw-alias-label-primary-dimmed': { light: '#1E3556', dark: '#D7E3F4' },
  '--dsw-alias-label-primary-inverted': { light: '#FFFFFF', dark: '#162130' },
  '--dsw-alias-label-primary-foreground': { light: '#FFFFFF', dark: '#FFFFFF' },
  '--dsw-alias-brand-primary': { light: '#13243E', dark: '#EAF2FC' },
  '--dsw-alias-brand-text': { light: '#13243E', dark: '#EAF2FC' },
  '--dsw-alias-brand-primary-invert': { light: '#FFFFFF', dark: '#0C121B' },
  '--dsw-alias-state-business-primary': { light: '#3F76D8', dark: '#6E9BE8' },
  '--dsw-alias-state-business-tertiary': { light: '#DCE9FB', dark: '#1D2C44' },
  '--dsw-alias-state-success-tertiary': { light: '#DDF3E4', dark: '#12271C' },
  '--dsw-alias-state-warn-tertiary': { light: '#FCEED6', dark: '#2A2416' },
  '--dsw-alias-button-primary-fill': { light: '#3F76D8', dark: '#4A7FD9' },
  '--dsw-alias-button-primary-hover': { light: '#5C8DE0', dark: '#5E8FE6' },
  '--dsw-alias-button-primary-dimmed': { light: '#DCE9FB', dark: '#162130' },
  '--dsw-alias-button-info-fill': { light: '#3F76D8', dark: '#6E9BE8' },
  '--dsw-alias-button-info-hover': { light: '#5C8DE0', dark: '#7FA8EF' },
  '--dsw-alias-button-elevated-fill': { light: '#FFFFFF', dark: '#162130' },
  '--dsw-alias-button-floating-fill': { light: '#FFFFFF', dark: '#162130' },
  '--dsw-alias-button-floating-hover': { light: '#F0F5FB', dark: '#1C2A3D' },
  '--dsw-alias-button-contrast-fill': { light: '#26364D', dark: '#EAF2FC' },
  '--dsw-alias-button-ghost-active-fill': { light: '#DCE7F4', dark: '#1C2A3D' },
  '--dsw-alias-button-ghost-active-hover': { light: '#E9F0F8', dark: '#162130' },
  '--dsw-alias-button-ghost-active-border': { light: '#8FA3BC', dark: '#6B829F' },
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(63, 118, 216, 0.08)', dark: 'rgba(126, 164, 223, 0.1)' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(63, 118, 216, 0.14)', dark: 'rgba(126, 164, 223, 0.2)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(63, 118, 216, 0.2)', dark: 'rgba(126, 164, 223, 0.26)' },
  '--dsw-alias-interactive-bg-hover-danger': { light: 'rgba(236, 19, 19, 0.05)', dark: 'rgba(242, 90, 90, 0.14)' },
  '--dsw-alias-interactive-bg-hover-solid': { light: '#F0F5FB', dark: '#1C2A3D' },
  '--dsw-alias-markdown-code-block': { light: '#F0F5FB', dark: '#0D141F' },
  '--dsw-alias-markdown-code-block-banner': { light: '#F5F8FD', dark: '#121B29' },
}

/** Warm sand / soft charcoal — amber accents on cream and umber surfaces. */
const AMBER: ThemeTokenOverrides = {
  '--dsw-alias-bg-base': { light: '#FBF7F0', dark: '#171310' },
  '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#1E1915' },
  '--dsw-alias-bg-layer-2': { light: '#F6EFE3', dark: '#26201A' },
  '--dsw-alias-bg-layer-3': { light: '#F0E6D5', dark: '#2E261E' },
  '--dsw-alias-bg-overlay': { light: '#EDE2CE', dark: '#362C22' },
  '--dsw-alias-bg-module-platform': { light: '#FFFFFF', dark: '#1E1915' },
  '--dsw-alias-bg-skeleton': { light: 'rgba(90, 63, 22, 0.08)', dark: 'rgba(226, 190, 138, 0.12)' },
  '--dsw-alias-bg-mask-1': { light: 'rgba(62, 45, 20, 0.3)', dark: 'rgba(10, 7, 4, 0.55)' },
  '--dsw-alias-bg-mask-2': { light: 'rgba(62, 45, 20, 0.12)', dark: 'rgba(10, 7, 4, 0.25)' },
  '--dsw-alias-bg-mask-3': { light: 'rgba(62, 45, 20, 0.3)', dark: 'rgba(10, 7, 4, 0.5)' },
  '--dsw-alias-bg-mask-drop': { light: 'rgba(251, 247, 240, 0.72)', dark: 'rgba(23, 19, 16, 0.7)' },
  '--dsw-alias-border-l1': { light: 'rgba(90, 63, 22, 0.08)', dark: 'rgba(226, 190, 138, 0.08)' },
  '--dsw-alias-border-l2': { light: 'rgba(90, 63, 22, 0.14)', dark: 'rgba(226, 190, 138, 0.15)' },
  '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(90, 63, 22, 0.1)', dark: 'rgba(226, 190, 138, 0.1)' },
  '--dsw-alias-border-l3': { light: 'rgba(90, 63, 22, 0.22)', dark: 'rgba(226, 190, 138, 0.24)' },
  '--dsw-alias-border-l4': { light: 'rgba(90, 63, 22, 0.32)', dark: 'rgba(226, 190, 138, 0.34)' },
  '--dsw-alias-border-inverted': { light: 'rgba(90, 63, 22, 0.06)', dark: 'rgba(226, 190, 138, 0.12)' },
  '--dsw-alias-border-inverted2': { light: 'rgba(90, 63, 22, 0.08)', dark: 'rgba(226, 190, 138, 0.08)' },
  '--dsw-alias-label-primary': { light: '#3E2E1B', dark: '#F5EDE1' },
  '--dsw-alias-label-secondary': { light: '#6B563B', dark: '#D6C2A4' },
  '--dsw-alias-label-tertiary': { light: '#8A7354', dark: '#B39D7E' },
  '--dsw-alias-label-caption': { light: '#A8906D', dark: '#947E60' },
  '--dsw-alias-label-dimmed': { light: '#D9CBB4', dark: '#6A5843' },
  '--dsw-alias-label-primary-bluish': { light: '#A96A12', dark: '#EBB765' },
  '--dsw-alias-label-primary-dimmed': { light: '#57401F', dark: '#E7D9C5' },
  '--dsw-alias-label-primary-inverted': { light: '#FFFFFF', dark: '#26201A' },
  '--dsw-alias-label-primary-foreground': { light: '#FFFFFF', dark: '#1E1915' },
  '--dsw-alias-brand-primary': { light: '#3E2E1B', dark: '#F5EDE1' },
  '--dsw-alias-brand-text': { light: '#3E2E1B', dark: '#F5EDE1' },
  '--dsw-alias-brand-primary-invert': { light: '#FFFFFF', dark: '#171310' },
  '--dsw-alias-state-business-primary': { light: '#C77E1E', dark: '#E0A24A' },
  '--dsw-alias-state-business-tertiary': { light: '#F8E8CE', dark: '#332718' },
  '--dsw-alias-state-success-tertiary': { light: '#E1F0DC', dark: '#172616' },
  '--dsw-alias-state-warn-tertiary': { light: '#FBEFD2', dark: '#2E2412' },
  '--dsw-alias-button-primary-fill': { light: '#C77E1E', dark: '#A9701F' },
  '--dsw-alias-button-primary-hover': { light: '#D6923A', dark: '#E0A24A' },
  '--dsw-alias-button-primary-dimmed': { light: '#F8E8CE', dark: '#26201A' },
  '--dsw-alias-button-info-fill': { light: '#C77E1E', dark: '#E0A24A' },
  '--dsw-alias-button-info-hover': { light: '#D6923A', dark: '#E9B468' },
  '--dsw-alias-button-elevated-fill': { light: '#FFFFFF', dark: '#26201A' },
  '--dsw-alias-button-floating-fill': { light: '#FFFFFF', dark: '#26201A' },
  '--dsw-alias-button-floating-hover': { light: '#F6EFE3', dark: '#2E261E' },
  '--dsw-alias-button-contrast-fill': { light: '#4A3A21', dark: '#F5EDE1' },
  '--dsw-alias-button-ghost-active-fill': { light: '#F0E6D5', dark: '#2E261E' },
  '--dsw-alias-button-ghost-active-hover': { light: '#F6EFE3', dark: '#26201A' },
  '--dsw-alias-button-ghost-active-border': { light: '#B79A6F', dark: '#947E60' },
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(199, 126, 30, 0.08)', dark: 'rgba(224, 162, 74, 0.1)' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(199, 126, 30, 0.14)', dark: 'rgba(224, 162, 74, 0.2)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(199, 126, 30, 0.2)', dark: 'rgba(224, 162, 74, 0.26)' },
  '--dsw-alias-interactive-bg-hover-danger': { light: 'rgba(236, 19, 19, 0.05)', dark: 'rgba(242, 90, 90, 0.14)' },
  '--dsw-alias-interactive-bg-hover-solid': { light: '#F6EFE3', dark: '#2E261E' },
  '--dsw-alias-markdown-code-block': { light: '#F6EFE3', dark: '#14100C' },
  '--dsw-alias-markdown-code-block-banner': { light: '#FBF7F0', dark: '#1A1511' },
}

/** Forest — moss greens over pine dark and sage light. */
const FOREST: ThemeTokenOverrides = {
  '--dsw-alias-bg-base': { light: '#F4F8F4', dark: '#0E1411' },
  '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#141C17' },
  '--dsw-alias-bg-layer-2': { light: '#EBF2EA', dark: '#1A241D' },
  '--dsw-alias-bg-layer-3': { light: '#E0EBDF', dark: '#212D24' },
  '--dsw-alias-bg-overlay': { light: '#D8E6D6', dark: '#28362C' },
  '--dsw-alias-bg-module-platform': { light: '#FFFFFF', dark: '#141C17' },
  '--dsw-alias-bg-skeleton': { light: 'rgba(31, 66, 42, 0.08)', dark: 'rgba(155, 200, 168, 0.12)' },
  '--dsw-alias-bg-mask-1': { light: 'rgba(24, 50, 32, 0.3)', dark: 'rgba(4, 9, 6, 0.55)' },
  '--dsw-alias-bg-mask-2': { light: 'rgba(24, 50, 32, 0.12)', dark: 'rgba(4, 9, 6, 0.25)' },
  '--dsw-alias-bg-mask-3': { light: 'rgba(24, 50, 32, 0.3)', dark: 'rgba(4, 9, 6, 0.5)' },
  '--dsw-alias-bg-mask-drop': { light: 'rgba(244, 248, 244, 0.72)', dark: 'rgba(14, 20, 17, 0.7)' },
  '--dsw-alias-border-l1': { light: 'rgba(31, 66, 42, 0.08)', dark: 'rgba(155, 200, 168, 0.08)' },
  '--dsw-alias-border-l2': { light: 'rgba(31, 66, 42, 0.14)', dark: 'rgba(155, 200, 168, 0.15)' },
  '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(31, 66, 42, 0.1)', dark: 'rgba(155, 200, 168, 0.1)' },
  '--dsw-alias-border-l3': { light: 'rgba(31, 66, 42, 0.22)', dark: 'rgba(155, 200, 168, 0.24)' },
  '--dsw-alias-border-l4': { light: 'rgba(31, 66, 42, 0.32)', dark: 'rgba(155, 200, 168, 0.34)' },
  '--dsw-alias-border-inverted': { light: 'rgba(31, 66, 42, 0.06)', dark: 'rgba(155, 200, 168, 0.12)' },
  '--dsw-alias-border-inverted2': { light: 'rgba(31, 66, 42, 0.08)', dark: 'rgba(155, 200, 168, 0.08)' },
  '--dsw-alias-label-primary': { light: '#1C3325', dark: '#E9F2EA' },
  '--dsw-alias-label-secondary': { light: '#3F5A48', dark: '#B2C8B7' },
  '--dsw-alias-label-tertiary': { light: '#5B7663', dark: '#8CA394' },
  '--dsw-alias-label-caption': { light: '#7B927F', dark: '#718A79' },
  '--dsw-alias-label-dimmed': { light: '#C6D6C8', dark: '#4C5F51' },
  '--dsw-alias-label-primary-bluish': { light: '#2F7D46', dark: '#A4D6B2' },
  '--dsw-alias-label-primary-dimmed': { light: '#294534', dark: '#D8E6DA' },
  '--dsw-alias-label-primary-inverted': { light: '#FFFFFF', dark: '#1A241D' },
  '--dsw-alias-label-primary-foreground': { light: '#FFFFFF', dark: '#0E1411' },
  '--dsw-alias-brand-primary': { light: '#1C3325', dark: '#E9F2EA' },
  '--dsw-alias-brand-text': { light: '#1C3325', dark: '#E9F2EA' },
  '--dsw-alias-brand-primary-invert': { light: '#FFFFFF', dark: '#0E1411' },
  '--dsw-alias-state-business-primary': { light: '#3E8B57', dark: '#7CB88F' },
  '--dsw-alias-state-business-tertiary': { light: '#DCF0E1', dark: '#1B2B20' },
  '--dsw-alias-state-success-tertiary': { light: '#DCF0E1', dark: '#172616' },
  '--dsw-alias-state-warn-tertiary': { light: '#FCEED6', dark: '#2A2416' },
  '--dsw-alias-button-primary-fill': { light: '#3E8B57', dark: '#47875C' },
  '--dsw-alias-button-primary-hover': { light: '#56A06E', dark: '#5C9C6E' },
  '--dsw-alias-button-primary-dimmed': { light: '#DCF0E1', dark: '#1A241D' },
  '--dsw-alias-button-info-fill': { light: '#3E8B57', dark: '#7CB88F' },
  '--dsw-alias-button-info-hover': { light: '#56A06E', dark: '#96C7A5' },
  '--dsw-alias-button-elevated-fill': { light: '#FFFFFF', dark: '#1A241D' },
  '--dsw-alias-button-floating-fill': { light: '#FFFFFF', dark: '#1A241D' },
  '--dsw-alias-button-floating-hover': { light: '#EBF2EA', dark: '#212D24' },
  '--dsw-alias-button-contrast-fill': { light: '#2B4232', dark: '#E9F2EA' },
  '--dsw-alias-button-ghost-active-fill': { light: '#E0EBDF', dark: '#212D24' },
  '--dsw-alias-button-ghost-active-hover': { light: '#EBF2EA', dark: '#1A241D' },
  '--dsw-alias-button-ghost-active-border': { light: '#8AA691', dark: '#718A79' },
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(62, 139, 87, 0.08)', dark: 'rgba(124, 184, 143, 0.1)' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(62, 139, 87, 0.14)', dark: 'rgba(124, 184, 143, 0.2)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(62, 139, 87, 0.2)', dark: 'rgba(124, 184, 143, 0.26)' },
  '--dsw-alias-interactive-bg-hover-danger': { light: 'rgba(236, 19, 19, 0.05)', dark: 'rgba(242, 90, 90, 0.14)' },
  '--dsw-alias-interactive-bg-hover-solid': { light: '#EBF2EA', dark: '#212D24' },
  '--dsw-alias-markdown-code-block': { light: '#EBF2EA', dark: '#0C110E' },
  '--dsw-alias-markdown-code-block-banner': { light: '#F4F8F4', dark: '#111814' },
}

/** Violet — iridescent purple over lavender light and plum dark. */
const VIOLET: ThemeTokenOverrides = {
  '--dsw-alias-bg-base': { light: '#F7F5FC', dark: '#120F1A' },
  '--dsw-alias-bg-layer-1': { light: '#FFFFFF', dark: '#181423' },
  '--dsw-alias-bg-layer-2': { light: '#F0ECF9', dark: '#1F1A2C' },
  '--dsw-alias-bg-layer-3': { light: '#E7E1F4', dark: '#262035' },
  '--dsw-alias-bg-overlay': { light: '#DED7F0', dark: '#2E2740' },
  '--dsw-alias-bg-module-platform': { light: '#FFFFFF', dark: '#181423' },
  '--dsw-alias-bg-skeleton': { light: 'rgba(56, 38, 98, 0.08)', dark: 'rgba(184, 164, 228, 0.12)' },
  '--dsw-alias-bg-mask-1': { light: 'rgba(43, 29, 76, 0.3)', dark: 'rgba(6, 4, 12, 0.55)' },
  '--dsw-alias-bg-mask-2': { light: 'rgba(43, 29, 76, 0.12)', dark: 'rgba(6, 4, 12, 0.25)' },
  '--dsw-alias-bg-mask-3': { light: 'rgba(43, 29, 76, 0.3)', dark: 'rgba(6, 4, 12, 0.5)' },
  '--dsw-alias-bg-mask-drop': { light: 'rgba(247, 245, 252, 0.72)', dark: 'rgba(18, 15, 26, 0.7)' },
  '--dsw-alias-border-l1': { light: 'rgba(56, 38, 98, 0.08)', dark: 'rgba(184, 164, 228, 0.08)' },
  '--dsw-alias-border-l2': { light: 'rgba(56, 38, 98, 0.14)', dark: 'rgba(184, 164, 228, 0.15)' },
  '--dsw-alias-border-l2-darkmode-thin': { light: 'rgba(56, 38, 98, 0.1)', dark: 'rgba(184, 164, 228, 0.1)' },
  '--dsw-alias-border-l3': { light: 'rgba(56, 38, 98, 0.22)', dark: 'rgba(184, 164, 228, 0.24)' },
  '--dsw-alias-border-l4': { light: 'rgba(56, 38, 98, 0.32)', dark: 'rgba(184, 164, 228, 0.34)' },
  '--dsw-alias-border-inverted': { light: 'rgba(56, 38, 98, 0.06)', dark: 'rgba(184, 164, 228, 0.12)' },
  '--dsw-alias-border-inverted2': { light: 'rgba(56, 38, 98, 0.08)', dark: 'rgba(184, 164, 228, 0.08)' },
  '--dsw-alias-label-primary': { light: '#2A2050', dark: '#EEEAF8' },
  '--dsw-alias-label-secondary': { light: '#4E4275', dark: '#C4B8DE' },
  '--dsw-alias-label-tertiary': { light: '#6A5D91', dark: '#9C90BB' },
  '--dsw-alias-label-caption': { light: '#8A7DAB', dark: '#7E72A1' },
  '--dsw-alias-label-dimmed': { light: '#D2CBE4', dark: '#574B74' },
  '--dsw-alias-label-primary-bluish': { light: '#6442C8', dark: '#C5B0F5' },
  '--dsw-alias-label-primary-dimmed': { light: '#3A2E63', dark: '#DFD8F0' },
  '--dsw-alias-label-primary-inverted': { light: '#FFFFFF', dark: '#1F1A2C' },
  '--dsw-alias-label-primary-foreground': { light: '#FFFFFF', dark: '#120F1A' },
  '--dsw-alias-brand-primary': { light: '#2A2050', dark: '#EEEAF8' },
  '--dsw-alias-brand-text': { light: '#2A2050', dark: '#EEEAF8' },
  '--dsw-alias-brand-primary-invert': { light: '#FFFFFF', dark: '#120F1A' },
  '--dsw-alias-state-business-primary': { light: '#7A52D6', dark: '#A98AEC' },
  '--dsw-alias-state-business-tertiary': { light: '#EAE2FA', dark: '#241D38' },
  '--dsw-alias-state-success-tertiary': { light: '#DDF3E4', dark: '#12271C' },
  '--dsw-alias-state-warn-tertiary': { light: '#FCEED6', dark: '#2A2416' },
  '--dsw-alias-button-primary-fill': { light: '#7A52D6', dark: '#8459DE' },
  '--dsw-alias-button-primary-hover': { light: '#8F6ADD', dark: '#9673E4' },
  '--dsw-alias-button-primary-dimmed': { light: '#EAE2FA', dark: '#1F1A2C' },
  '--dsw-alias-button-info-fill': { light: '#7A52D6', dark: '#A98AEC' },
  '--dsw-alias-button-info-hover': { light: '#8F6ADD', dark: '#B9A0F1' },
  '--dsw-alias-button-elevated-fill': { light: '#FFFFFF', dark: '#1F1A2C' },
  '--dsw-alias-button-floating-fill': { light: '#FFFFFF', dark: '#1F1A2C' },
  '--dsw-alias-button-floating-hover': { light: '#F0ECF9', dark: '#262035' },
  '--dsw-alias-button-contrast-fill': { light: '#3B3059', dark: '#EEEAF8' },
  '--dsw-alias-button-ghost-active-fill': { light: '#E7E1F4', dark: '#262035' },
  '--dsw-alias-button-ghost-active-hover': { light: '#F0ECF9', dark: '#1F1A2C' },
  '--dsw-alias-button-ghost-active-border': { light: '#A292C6', dark: '#7E72A1' },
  '--dsw-alias-interactive-bg-hover': { light: 'rgba(122, 82, 214, 0.08)', dark: 'rgba(169, 138, 236, 0.1)' },
  '--dsw-alias-interactive-bg-hover-accent': { light: 'rgba(122, 82, 214, 0.14)', dark: 'rgba(169, 138, 236, 0.2)' },
  '--dsw-alias-interactive-bg-active': { light: 'rgba(122, 82, 214, 0.2)', dark: 'rgba(169, 138, 236, 0.26)' },
  '--dsw-alias-interactive-bg-hover-danger': { light: 'rgba(236, 19, 19, 0.05)', dark: 'rgba(242, 90, 90, 0.14)' },
  '--dsw-alias-interactive-bg-hover-solid': { light: '#F0ECF9', dark: '#262035' },
  '--dsw-alias-markdown-code-block': { light: '#F0ECF9', dark: '#100D17' },
  '--dsw-alias-markdown-code-block-banner': { light: '#F7F5FC', dark: '#15111F' },
}

/** Selectable skin id. */
export const SKIN_IDS = ['none', 'ocean', 'amber', 'forest', 'violet'] as const

/** One selectable skin: id plus its alias-token override layer. */
export interface SkinDefinition {
  /** Skin id — the persisted choice. */
  readonly id: (typeof SKIN_IDS)[number]
  /** Locale key naming the skin. */
  readonly nameKey: `skins.${(typeof SKIN_IDS)[number]}.name`
  /** Locale key describing the skin. */
  readonly descKey: `skins.${(typeof SKIN_IDS)[number]}.desc`
  /** Alias-token overrides stacked over the active theme (empty = stock). */
  readonly tokens: ThemeTokenOverrides
  /** Preview swatches: [background, layer, accent] for the light mode. */
  readonly lightSwatch: readonly [string, string, string]
  /** Preview swatches: [background, layer, accent] for the dark mode. */
  readonly darkSwatch: readonly [string, string, string]
}

/** The catalog, in display order. */
export const SKINS: readonly SkinDefinition[] = [
  {
    id: 'none',
    nameKey: 'skins.none.name',
    descKey: 'skins.none.desc',
    tokens: {},
    lightSwatch: ['#FFFFFF', '#F2F3F5', '#4D6BFE'],
    darkSwatch: ['#111418', '#1B1F26', '#7C96FF'],
  },
  {
    id: 'ocean',
    nameKey: 'skins.ocean.name',
    descKey: 'skins.ocean.desc',
    tokens: OCEAN,
    lightSwatch: ['#F4F8FD', '#E2EBF7', '#3F76D8'],
    darkSwatch: ['#0C121B', '#1C2A3D', '#6E9BE8'],
  },
  {
    id: 'amber',
    nameKey: 'skins.amber.name',
    descKey: 'skins.amber.desc',
    tokens: AMBER,
    lightSwatch: ['#FBF7F0', '#F0E6D5', '#C77E1E'],
    darkSwatch: ['#171310', '#2E261E', '#E0A24A'],
  },
  {
    id: 'forest',
    nameKey: 'skins.forest.name',
    descKey: 'skins.forest.desc',
    tokens: FOREST,
    lightSwatch: ['#F4F8F4', '#E0EBDF', '#3E8B57'],
    darkSwatch: ['#0E1411', '#212D24', '#7CB88F'],
  },
  {
    id: 'violet',
    nameKey: 'skins.violet.name',
    descKey: 'skins.violet.desc',
    tokens: VIOLET,
    lightSwatch: ['#F7F5FC', '#E7E1F4', '#7A52D6'],
    darkSwatch: ['#120F1A', '#262035', '#A98AEC'],
  },
]

/** Look up one skin by id (unknown/absent storage resolves to `none`). */
export function skinOf(id: string): SkinDefinition {
  return SKINS.find(skin => skin.id === id) ?? SKINS[0]
}
