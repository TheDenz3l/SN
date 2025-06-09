# SwiftNotes Design System

## Overview

The SwiftNotes Design System is a comprehensive collection of reusable components, design tokens, and guidelines that ensure consistency, accessibility, and efficiency across the SwiftNotes application. This system provides a unified approach to UI development, reducing complexity and improving maintainability.

## Table of Contents

1. [Getting Started](#getting-started)
2. [Design Principles](#design-principles)
3. [Components](#components)
4. [Design Tokens](#design-tokens)
5. [Layout System](#layout-system)
6. [Accessibility](#accessibility)
7. [Migration Guides](#migration-guides)
8. [Developer Tools](#developer-tools)

## Getting Started

### Installation

The design system components are available through the unified UI component library:

```tsx
import { Button, Badge, Stack, Grid, Container } from '../components/ui';
```

### Quick Start

```tsx
import React from 'react';
import { Button, Badge, Stack, Container } from '../components/ui';

function MyComponent() {
  return (
    <Container size="lg" padding="xl">
      <Stack spacing="lg">
        <h1>Welcome to SwiftNotes</h1>
        <Badge variant="success">Active</Badge>
        <Button variant="primary" size="lg">
          Get Started
        </Button>
      </Stack>
    </Container>
  );
}
```

## Design Principles

### 1. Consistency
- Unified visual language across all components
- Standardized spacing, colors, and typography
- Predictable interaction patterns

### 2. Accessibility
- WCAG 2.1 AA compliance
- Keyboard navigation support
- Screen reader compatibility
- High contrast support

### 3. Flexibility
- Responsive design by default
- Customizable through props and variants
- Extensible component architecture

### 4. Performance
- Optimized bundle size
- Efficient rendering
- Minimal runtime overhead

### 5. Developer Experience
- TypeScript support
- Comprehensive documentation
- Clear API design
- Helpful error messages

## Components

### Button Component

The Button component provides a unified interface for all button interactions in the application.

#### Import
```tsx
import { Button } from '../components/ui';
```

#### Basic Usage
```tsx
<Button variant="primary" size="md">
  Click me
</Button>
```

#### Variants
- `primary` - Main call-to-action buttons
- `secondary` - Secondary actions
- `outline` - Outlined buttons for less emphasis
- `ghost` - Minimal buttons for subtle actions
- `danger` - Destructive actions

#### Sizes
- `sm` - Small buttons (32px height)
- `md` - Medium buttons (40px height)
- `lg` - Large buttons (48px height)

#### States
- `loading` - Shows loading spinner
- `disabled` - Disabled state
- `fullWidth` - Takes full container width

#### Props
```tsx
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  onClick?: () => void;
  children: React.ReactNode;
}
```

### Badge Component

The Badge component system provides semantic labeling and status indication.

#### Import
```tsx
import { Badge, NavigationBadge, StatusBadge, CostBadge, TaskBadge } from '../components/ui';
```

#### Basic Usage
```tsx
<Badge variant="primary" style="filled">
  New
</Badge>
```

#### Specialized Badges

##### NavigationBadge
```tsx
<NavigationBadge type="premium">Pro</NavigationBadge>
<NavigationBadge type="new">New Feature</NavigationBadge>
```

##### StatusBadge
```tsx
<StatusBadge status="positive">+5.2%</StatusBadge>
<StatusBadge status="negative">-2.1%</StatusBadge>
```

##### CostBadge
```tsx
<CostBadge type="free">Free</CostBadge>
<CostBadge type="credits">1 Credit</CostBadge>
```

##### TaskBadge
```tsx
<TaskBadge>ISP TASK</TaskBadge>
<TaskBadge completed>COMPLETED</TaskBadge>
```

### Layout System

The Layout system provides consistent spacing and structure across the application.

#### Import
```tsx
import { Stack, Inline, Grid, Container, Box, Spacer } from '../components/ui';
```

#### Stack - Vertical Layout
```tsx
<Stack spacing="lg" align="center">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Stack>
```

#### Inline - Horizontal Layout
```tsx
<Inline spacing="md" justify="between" align="center">
  <span>Left</span>
  <span>Center</span>
  <span>Right</span>
</Inline>
```

#### Grid - CSS Grid Layout
```tsx
<Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</Grid>
```

#### Container - Responsive Container
```tsx
<Container size="xl" padding="lg">
  <Content />
</Container>
```

#### Box - Spacing Utilities
```tsx
<Box p="lg" mx="auto" my="xl">
  <Content />
</Box>
```

## Design Tokens

### Spacing Tokens

Standardized spacing values for consistent layouts:

| Token | Value | Usage |
|-------|-------|-------|
| `xs` | 4px | Minimal spacing |
| `sm` | 8px | Small spacing |
| `md` | 12px | Default spacing |
| `lg` | 16px | Medium spacing |
| `xl` | 24px | Large spacing |
| `2xl` | 32px | Extra large spacing |
| `3xl` | 48px | Maximum spacing |
| `auto` | auto | Automatic spacing |

### Color Tokens

#### Primary Colors
- `primary-50` to `primary-900` - Main brand colors
- `primary-500` - Default primary color

#### Semantic Colors
- `success-*` - Success states (green)
- `warning-*` - Warning states (yellow/orange)
- `error-*` - Error states (red)
- `info-*` - Information states (blue)

#### Neutral Colors
- `gray-50` to `gray-900` - Neutral grays
- `white` - Pure white
- `black` - Pure black

### Typography Tokens

#### Font Sizes
- `text-xs` - 12px
- `text-sm` - 14px
- `text-base` - 16px
- `text-lg` - 18px
- `text-xl` - 20px
- `text-2xl` - 24px
- `text-3xl` - 30px

#### Font Weights
- `font-normal` - 400
- `font-medium` - 500
- `font-semibold` - 600
- `font-bold` - 700

### Shadow Tokens

#### Elevation Shadows
- `shadow-card` - Card elevation
- `shadow-card-hover` - Card hover state
- `shadow-elevated` - Modal/dropdown elevation
- `shadow-floating` - Floating elements

## Responsive Design

### Breakpoints

| Breakpoint | Value | Usage |
|------------|-------|-------|
| `sm` | 640px | Small tablets |
| `md` | 768px | Tablets |
| `lg` | 1024px | Small desktops |
| `xl` | 1280px | Large desktops |

### Responsive Props

Many components support responsive values:

```tsx
<Grid 
  cols={{ base: 1, sm: 2, md: 3, lg: 4 }} 
  gap={{ base: 'sm', md: 'md', lg: 'lg' }}
>
  {items}
</Grid>
```

## Accessibility

### Keyboard Navigation
- All interactive elements are keyboard accessible
- Focus indicators are clearly visible
- Tab order is logical and predictable

### Screen Readers
- Semantic HTML elements
- ARIA labels and descriptions
- Proper heading hierarchy

### Color Contrast
- All text meets WCAG AA contrast requirements
- Interactive elements have sufficient contrast
- Focus indicators are high contrast

### Motion and Animation
- Respects `prefers-reduced-motion`
- Animations are subtle and purposeful
- No auto-playing animations

## Best Practices

### Component Usage

#### Do's
- Use semantic variants (primary, secondary, etc.)
- Leverage the spacing system consistently
- Follow responsive design patterns
- Use appropriate component sizes

#### Don'ts
- Don't use arbitrary spacing values
- Don't override component styles directly
- Don't ignore accessibility guidelines
- Don't mix different design patterns

### Performance

#### Optimization Tips
- Import only needed components
- Use responsive images
- Minimize bundle size
- Leverage component composition

## Migration Guides

### From Legacy Components

Detailed migration guides are available for transitioning from legacy implementations:

- [Button Migration Guide](./BUTTON_MIGRATION_GUIDE.md)
- [Badge Migration Guide](./BADGE_MIGRATION_GUIDE.md)
- [Layout Migration Guide](./LAYOUT_MIGRATION_GUIDE.md)

### Migration Strategy

1. **Audit** - Identify legacy component usage
2. **Plan** - Create migration timeline
3. **Migrate** - Replace components incrementally
4. **Test** - Verify functionality and accessibility
5. **Document** - Update component documentation

## Developer Tools

### TypeScript Support

All components include comprehensive TypeScript definitions:

```tsx
// Full type safety
const button: ButtonProps = {
  variant: 'primary',
  size: 'lg',
  loading: false
};
```

### Development Scripts

```bash
# Analyze component usage
npm run analyze-components

# Generate migration reports
npm run migration-analysis

# Verify design system compliance
npm run verify-design-system
```

### Testing Utilities

```tsx
import { render, screen } from '@testing-library/react';
import { Button } from '../components/ui';

test('button renders correctly', () => {
  render(<Button variant="primary">Click me</Button>);
  expect(screen.getByRole('button')).toBeInTheDocument();
});
```

## Contributing

### Adding New Components

1. Follow the established component patterns
2. Include comprehensive TypeScript types
3. Add accessibility features
4. Write tests and documentation
5. Update the design system documentation

### Updating Existing Components

1. Maintain backward compatibility
2. Update migration guides if needed
3. Test across all usage scenarios
4. Update documentation

## Support

For questions, issues, or contributions:

- Create an issue in the project repository
- Follow the component development guidelines
- Refer to the migration guides for legacy code
- Use the TypeScript definitions for API reference

---

*This design system is continuously evolving. Check back regularly for updates and new components.*
