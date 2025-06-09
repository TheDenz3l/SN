# Design Tokens

## Overview

Design tokens are the visual design atoms of the SwiftNotes design system. They are named entities that store visual design attributes such as colors, spacing, typography, and shadows. These tokens ensure consistency across the entire application and make it easy to maintain and update the visual design.

## Color Tokens

### Primary Colors

The primary color palette represents the SwiftNotes brand identity.

| Token | Value | Usage |
|-------|-------|-------|
| `primary-50` | `#eff6ff` | Lightest primary background |
| `primary-100` | `#dbeafe` | Light primary background |
| `primary-200` | `#bfdbfe` | Subtle primary background |
| `primary-300` | `#93c5fd` | Muted primary elements |
| `primary-400` | `#60a5fa` | Secondary primary elements |
| `primary-500` | `#3b82f6` | **Default primary color** |
| `primary-600` | `#2563eb` | Hover states |
| `primary-700` | `#1d4ed8` | Active states |
| `primary-800` | `#1e40af` | Dark primary elements |
| `primary-900` | `#1e3a8a` | Darkest primary elements |

### Secondary Colors

Secondary colors complement the primary palette.

| Token | Value | Usage |
|-------|-------|-------|
| `secondary-50` | `#f8fafc` | Light secondary background |
| `secondary-100` | `#f1f5f9` | Subtle secondary background |
| `secondary-200` | `#e2e8f0` | Border colors |
| `secondary-300` | `#cbd5e1` | Muted text |
| `secondary-400` | `#94a3b8` | Placeholder text |
| `secondary-500` | `#64748b` | **Default secondary color** |
| `secondary-600` | `#475569` | Secondary text |
| `secondary-700` | `#334155` | Dark secondary text |
| `secondary-800` | `#1e293b` | Darker elements |
| `secondary-900` | `#0f172a` | Darkest elements |

### Semantic Colors

#### Success Colors (Green)
| Token | Value | Usage |
|-------|-------|-------|
| `success-50` | `#f0fdf4` | Success background |
| `success-100` | `#dcfce7` | Light success background |
| `success-500` | `#22c55e` | **Default success color** |
| `success-600` | `#16a34a` | Success hover |
| `success-700` | `#15803d` | Success active |

#### Warning Colors (Yellow/Orange)
| Token | Value | Usage |
|-------|-------|-------|
| `warning-50` | `#fffbeb` | Warning background |
| `warning-100` | `#fef3c7` | Light warning background |
| `warning-500` | `#f59e0b` | **Default warning color** |
| `warning-600` | `#d97706` | Warning hover |
| `warning-700` | `#b45309` | Warning active |

#### Error Colors (Red)
| Token | Value | Usage |
|-------|-------|-------|
| `error-50` | `#fef2f2` | Error background |
| `error-100` | `#fee2e2` | Light error background |
| `error-500` | `#ef4444` | **Default error color** |
| `error-600` | `#dc2626` | Error hover |
| `error-700` | `#b91c1c` | Error active |

#### Info Colors (Blue)
| Token | Value | Usage |
|-------|-------|-------|
| `info-50` | `#eff6ff` | Info background |
| `info-100` | `#dbeafe` | Light info background |
| `info-500` | `#3b82f6` | **Default info color** |
| `info-600` | `#2563eb` | Info hover |
| `info-700` | `#1d4ed8` | Info active |

### Neutral Colors

| Token | Value | Usage |
|-------|-------|-------|
| `white` | `#ffffff` | Pure white |
| `gray-50` | `#f9fafb` | Lightest gray |
| `gray-100` | `#f3f4f6` | Very light gray |
| `gray-200` | `#e5e7eb` | Light gray borders |
| `gray-300` | `#d1d5db` | Gray borders |
| `gray-400` | `#9ca3af` | Muted text |
| `gray-500` | `#6b7280` | **Default gray** |
| `gray-600` | `#4b5563` | Dark text |
| `gray-700` | `#374151` | Darker text |
| `gray-800` | `#1f2937` | Very dark text |
| `gray-900` | `#111827` | Darkest text |
| `black` | `#000000` | Pure black |

## Spacing Tokens

Consistent spacing creates visual rhythm and hierarchy.

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `none` | `0` | 0px | No spacing |
| `xs` | `0.25rem` | 4px | Minimal spacing, tight layouts |
| `sm` | `0.5rem` | 8px | Small spacing, compact elements |
| `md` | `0.75rem` | 12px | **Default spacing**, standard gaps |
| `lg` | `1rem` | 16px | Medium spacing, comfortable layouts |
| `xl` | `1.5rem` | 24px | Large spacing, section separation |
| `2xl` | `2rem` | 32px | Extra large spacing, major sections |
| `3xl` | `3rem` | 48px | Maximum spacing, page-level separation |
| `auto` | `auto` | auto | Automatic spacing |

### Spacing Usage Guidelines

#### Component Internal Spacing
- Use `xs` (4px) for tight internal spacing
- Use `sm` (8px) for standard internal spacing
- Use `md` (12px) for comfortable internal spacing

#### Component External Spacing
- Use `md` (12px) for default component gaps
- Use `lg` (16px) for section spacing
- Use `xl` (24px) for major section separation

#### Layout Spacing
- Use `xl` (24px) for page margins
- Use `2xl` (32px) for major layout sections
- Use `3xl` (48px) for page-level separation

## Typography Tokens

### Font Families

| Token | Value | Usage |
|-------|-------|-------|
| `font-sans` | `Inter, system-ui, sans-serif` | **Default font**, body text |
| `font-mono` | `'JetBrains Mono', monospace` | Code, technical content |

### Font Sizes

| Token | Value | Pixels | Usage |
|-------|-------|--------|-------|
| `text-xs` | `0.75rem` | 12px | Small text, captions |
| `text-sm` | `0.875rem` | 14px | Small body text |
| `text-base` | `1rem` | 16px | **Default body text** |
| `text-lg` | `1.125rem` | 18px | Large body text |
| `text-xl` | `1.25rem` | 20px | Small headings |
| `text-2xl` | `1.5rem` | 24px | Medium headings |
| `text-3xl` | `1.875rem` | 30px | Large headings |
| `text-4xl` | `2.25rem` | 36px | Extra large headings |

### Font Weights

| Token | Value | Usage |
|-------|-------|-------|
| `font-normal` | `400` | **Default weight**, body text |
| `font-medium` | `500` | Emphasized text |
| `font-semibold` | `600` | Subheadings, important text |
| `font-bold` | `700` | Headings, strong emphasis |

### Line Heights

| Token | Value | Usage |
|-------|-------|-------|
| `leading-tight` | `1.25` | Tight line height, headings |
| `leading-normal` | `1.5` | **Default line height**, body text |
| `leading-relaxed` | `1.625` | Relaxed line height, long text |

## Shadow Tokens

Shadows create depth and hierarchy in the interface.

| Token | Value | Usage |
|-------|-------|-------|
| `shadow-card` | `0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px 0 rgb(0 0 0 / 0.06)` | **Default card shadow** |
| `shadow-card-hover` | `0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -1px rgb(0 0 0 / 0.06)` | Card hover state |
| `shadow-elevated` | `0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -2px rgb(0 0 0 / 0.05)` | Modal, dropdown elevation |
| `shadow-floating` | `0 20px 25px -5px rgb(0 0 0 / 0.1), 0 10px 10px -5px rgb(0 0 0 / 0.04)` | Floating elements |
| `shadow-glow` | `0 0 20px rgb(14 165 233 / 0.3)` | Focus glow effect |

## Border Radius Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-none` | `0` | No border radius |
| `rounded-sm` | `0.125rem` | Small radius (2px) |
| `rounded` | `0.25rem` | **Default radius** (4px) |
| `rounded-md` | `0.375rem` | Medium radius (6px) |
| `rounded-lg` | `0.5rem` | Large radius (8px) |
| `rounded-xl` | `0.75rem` | Extra large radius (12px) |
| `rounded-2xl` | `1rem` | Maximum radius (16px) |
| `rounded-full` | `9999px` | Fully rounded (pills, circles) |

## Animation Tokens

### Duration

| Token | Value | Usage |
|-------|-------|-------|
| `duration-75` | `75ms` | Very fast transitions |
| `duration-100` | `100ms` | Fast transitions |
| `duration-150` | `150ms` | **Default transition** |
| `duration-200` | `200ms` | Medium transitions |
| `duration-300` | `300ms` | Slow transitions |
| `duration-500` | `500ms` | Very slow transitions |

### Easing

| Token | Value | Usage |
|-------|-------|-------|
| `ease-linear` | `linear` | Linear easing |
| `ease-in` | `cubic-bezier(0.4, 0, 1, 1)` | Ease in |
| `ease-out` | `cubic-bezier(0, 0, 0.2, 1)` | **Default easing**, ease out |
| `ease-in-out` | `cubic-bezier(0.4, 0, 0.2, 1)` | Ease in and out |

## Breakpoint Tokens

Responsive design breakpoints for different screen sizes.

| Token | Value | Usage |
|-------|-------|-------|
| `sm` | `640px` | Small tablets and large phones |
| `md` | `768px` | Tablets |
| `lg` | `1024px` | Small desktops and laptops |
| `xl` | `1280px` | Large desktops |
| `2xl` | `1536px` | Extra large screens |

## Z-Index Tokens

Layering system for overlapping elements.

| Token | Value | Usage |
|-------|-------|-------|
| `z-0` | `0` | Default layer |
| `z-10` | `10` | Dropdowns, tooltips |
| `z-20` | `20` | Sticky headers |
| `z-30` | `30` | Modals, overlays |
| `z-40` | `40` | Navigation |
| `z-50` | `50` | **Highest priority**, notifications |

## Usage Examples

### CSS Custom Properties

```css
:root {
  /* Colors */
  --color-primary: theme('colors.primary.500');
  --color-success: theme('colors.success.500');
  
  /* Spacing */
  --spacing-md: theme('spacing.3');
  --spacing-lg: theme('spacing.4');
  
  /* Shadows */
  --shadow-card: theme('boxShadow.card');
}
```

### Tailwind CSS Classes

```tsx
// Using color tokens
<div className="bg-primary-500 text-white">Primary Button</div>
<div className="bg-success-50 text-success-700">Success Message</div>

// Using spacing tokens
<div className="p-4 m-6 space-y-3">Content with spacing</div>

// Using typography tokens
<h1 className="text-2xl font-bold leading-tight">Heading</h1>
<p className="text-base font-normal leading-normal">Body text</p>

// Using shadow tokens
<div className="shadow-card hover:shadow-card-hover">Card</div>
```

### Component Props

```tsx
// Using spacing tokens in components
<Stack spacing="lg">
  <Button variant="primary">Action</Button>
</Stack>

<Grid gap="md" cols={{ base: 1, md: 2 }}>
  <Card />
</Grid>
```

## Token Naming Convention

### Structure
`{category}-{variant}-{scale}`

### Examples
- `primary-500` - Primary color at 500 scale
- `text-lg` - Large text size
- `shadow-card` - Card shadow variant
- `spacing-md` - Medium spacing value

### Guidelines
- Use semantic names when possible
- Maintain consistent scaling (50, 100, 200, etc.)
- Group related tokens by category
- Use descriptive variant names
