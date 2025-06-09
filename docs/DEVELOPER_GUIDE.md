# Developer Guide

## Overview

This guide provides comprehensive information for developers working with the SwiftNotes Design System. It covers setup, development workflows, best practices, and contribution guidelines.

## Quick Start

### Installation

The design system components are part of the SwiftNotes frontend application. No additional installation is required.

### Basic Usage

```tsx
import React from 'react';
import { Button, Badge, Stack, Container } from '../components/ui';

function MyComponent() {
  return (
    <Container size="lg" padding="xl">
      <Stack spacing="lg">
        <h1>My Page</h1>
        <Badge variant="success">Active</Badge>
        <Button variant="primary" onClick={() => console.log('clicked')}>
          Click me
        </Button>
      </Stack>
    </Container>
  );
}

export default MyComponent;
```

## Development Environment

### Prerequisites

- Node.js 18+ 
- npm or yarn
- TypeScript knowledge
- React 18+ experience

### Project Structure

```
frontend/src/
├── components/
│   ├── ui/                    # Design system components
│   │   ├── Button.tsx         # Button component
│   │   ├── Badge.tsx          # Badge components
│   │   ├── Layout.tsx         # Layout components
│   │   ├── index.ts           # Component exports
│   │   └── test-*.tsx         # Test components
│   ├── intuitive/             # Legacy components (being migrated)
│   └── layout/                # Layout containers
├── docs/                      # Documentation
│   ├── DESIGN_SYSTEM.md       # Main documentation
│   ├── COMPONENT_API.md       # API reference
│   ├── DESIGN_TOKENS.md       # Design tokens
│   └── migration guides/      # Migration documentation
└── scripts/                   # Development scripts
    ├── migrate-*.js           # Migration scripts
    └── verify-*.js            # Verification scripts
```

### Development Scripts

```bash
# Start development server
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test

# Build for production
npm run build

# Design system specific scripts
npm run analyze-components      # Analyze component usage
npm run migration-analysis      # Generate migration reports
npm run verify-design-system    # Verify design system compliance
```

## Component Development

### Creating New Components

#### 1. Component Structure

```tsx
// components/ui/NewComponent.tsx
import React from 'react';
import { clsx } from 'clsx';

export interface NewComponentProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const NewComponent: React.FC<NewComponentProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  className,
}) => {
  const baseClasses = 'inline-flex items-center justify-center';
  
  const variantClasses = {
    primary: 'bg-primary-500 text-white',
    secondary: 'bg-secondary-500 text-white',
  };
  
  const sizeClasses = {
    sm: 'px-3 py-1 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {children}
    </div>
  );
};

export default NewComponent;
```

#### 2. Export from Index

```tsx
// components/ui/index.ts
export { default as NewComponent } from './NewComponent';
export type { NewComponentProps } from './NewComponent';
```

#### 3. Add Tests

```tsx
// components/ui/__tests__/NewComponent.test.tsx
import { render, screen } from '@testing-library/react';
import { NewComponent } from '../NewComponent';

describe('NewComponent', () => {
  it('renders children correctly', () => {
    render(<NewComponent>Test content</NewComponent>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies variant classes correctly', () => {
    render(<NewComponent variant="secondary">Test</NewComponent>);
    const element = screen.getByText('Test');
    expect(element).toHaveClass('bg-secondary-500');
  });
});
```

### Component Guidelines

#### TypeScript Best Practices

```tsx
// Use proper prop types
interface ComponentProps {
  // Required props
  children: React.ReactNode;
  
  // Optional props with defaults
  variant?: 'primary' | 'secondary';
  
  // Event handlers
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  
  // Ref forwarding
  ref?: React.Ref<HTMLButtonElement>;
}

// Use forwardRef for components that need refs
const Component = React.forwardRef<HTMLButtonElement, ComponentProps>(
  ({ children, onClick, ...props }, ref) => {
    return (
      <button ref={ref} onClick={onClick} {...props}>
        {children}
      </button>
    );
  }
);

Component.displayName = 'Component';
```

#### Styling Guidelines

```tsx
// Use clsx for conditional classes
import { clsx } from 'clsx';

const className = clsx(
  'base-classes',
  {
    'conditional-class': condition,
    'another-class': anotherCondition,
  },
  userClassName
);

// Use design tokens
const styles = {
  primary: 'bg-primary-500 text-white',
  secondary: 'bg-secondary-500 text-white',
};

// Responsive design
const responsiveClasses = 'text-sm md:text-base lg:text-lg';
```

#### Accessibility Requirements

```tsx
// Include proper ARIA attributes
<button
  aria-label={ariaLabel}
  aria-describedby={describedBy}
  aria-pressed={isPressed}
  disabled={disabled}
>
  {children}
</button>

// Support keyboard navigation
const handleKeyDown = (event: React.KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault();
    onClick?.(event);
  }
};
```

## Testing

### Unit Testing

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button } from '../Button';

describe('Button Component', () => {
  it('handles click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('shows loading state', () => {
    render(<Button loading>Loading</Button>);
    expect(screen.getByRole('button')).toBeDisabled();
    expect(screen.getByText('Loading')).toBeInTheDocument();
  });
});
```

### Accessibility Testing

```tsx
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('component is accessible', async () => {
  const { container } = render(<Button>Accessible button</Button>);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Visual Regression Testing

```tsx
// Using Storybook for visual testing
export default {
  title: 'Components/Button',
  component: Button,
};

export const Primary = () => <Button variant="primary">Primary</Button>;
export const Secondary = () => <Button variant="secondary">Secondary</Button>;
export const Loading = () => <Button loading>Loading</Button>;
```

## Migration Strategies

### Gradual Migration

#### 1. Identify Components to Migrate

```bash
# Run migration analysis
npm run migration-analysis

# This generates reports showing:
# - Legacy component usage
# - Migration priorities
# - Potential breaking changes
```

#### 2. Create Migration Plan

```tsx
// Example migration plan
const migrationPlan = {
  phase1: ['Button', 'Badge'],           // High priority
  phase2: ['Layout', 'Grid'],            // Medium priority  
  phase3: ['Form', 'Modal'],             // Low priority
};
```

#### 3. Implement Gradually

```tsx
// Before migration
import IntuitiveButton from '../intuitive/IntuitiveButton';

// During migration (both supported)
import { Button } from '../ui';
import IntuitiveButton from '../intuitive/IntuitiveButton';

// After migration
import { Button } from '../ui';
```

### Breaking Change Management

#### Version Components

```tsx
// Support both old and new APIs temporarily
interface ButtonProps {
  // New API
  variant?: 'primary' | 'secondary';
  
  // Legacy API (deprecated)
  /** @deprecated Use variant="primary" instead */
  primary?: boolean;
}

const Button: React.FC<ButtonProps> = ({ variant, primary, ...props }) => {
  // Handle legacy props
  const resolvedVariant = variant || (primary ? 'primary' : 'secondary');
  
  return <button className={getVariantClasses(resolvedVariant)} {...props} />;
};
```

#### Provide Migration Utilities

```tsx
// Migration helper
export const migrateButtonProps = (oldProps: OldButtonProps): ButtonProps => {
  return {
    variant: oldProps.primary ? 'primary' : 'secondary',
    size: oldProps.large ? 'lg' : 'md',
    // ... other mappings
  };
};
```

## Performance Optimization

### Bundle Size

```tsx
// Tree-shakeable exports
export { Button } from './Button';
export { Badge } from './Badge';
export { Stack, Inline, Grid } from './Layout';

// Avoid default exports for better tree-shaking
// Bad
export default { Button, Badge, Stack };

// Good
export { Button, Badge, Stack };
```

### Runtime Performance

```tsx
// Memoize expensive calculations
const memoizedClasses = useMemo(() => {
  return clsx(baseClasses, variantClasses[variant]);
}, [variant]);

// Use callback refs for performance
const setRef = useCallback((node: HTMLElement | null) => {
  if (node) {
    // Setup logic
  }
}, []);
```

### Loading Strategies

```tsx
// Lazy load heavy components
const HeavyComponent = React.lazy(() => import('./HeavyComponent'));

// Code splitting by route
const DashboardPage = React.lazy(() => import('../pages/DashboardPage'));
```

## Debugging

### Common Issues

#### 1. TypeScript Errors

```tsx
// Issue: Property 'variant' does not exist
// Solution: Import proper types
import type { ButtonProps } from '../ui';

// Issue: Cannot find module '../ui'
// Solution: Check import path and exports
import { Button } from '../components/ui';
```

#### 2. Styling Issues

```tsx
// Issue: Styles not applying
// Solution: Check Tailwind class names and purging
className="bg-primary-500" // Correct
className="bg-primary" // Incorrect - missing scale

// Issue: Custom styles overridden
// Solution: Use proper specificity or !important
className="!bg-red-500" // Force override
```

#### 3. Accessibility Issues

```tsx
// Issue: Focus not visible
// Solution: Ensure focus styles are applied
className="focus:outline-none focus:ring-2 focus:ring-primary-500"

// Issue: Screen reader issues
// Solution: Add proper ARIA labels
aria-label="Close dialog"
aria-describedby="error-message"
```

### Development Tools

#### Browser Extensions
- React Developer Tools
- axe DevTools
- Tailwind CSS IntelliSense

#### VS Code Extensions
- ES7+ React/Redux/React-Native snippets
- Tailwind CSS IntelliSense
- Auto Rename Tag
- Bracket Pair Colorizer

## Contributing

### Code Style

```tsx
// Use consistent formatting
const Component: React.FC<Props> = ({ 
  children, 
  variant = 'primary',
  ...props 
}) => {
  return (
    <div 
      className={clsx(
        'base-classes',
        variantClasses[variant]
      )}
      {...props}
    >
      {children}
    </div>
  );
};
```

### Commit Guidelines

```bash
# Use conventional commits
feat: add new Button component
fix: resolve Badge accessibility issue
docs: update component API documentation
refactor: improve Layout component performance
test: add unit tests for Badge component
```

### Pull Request Process

1. Create feature branch from main
2. Implement changes with tests
3. Update documentation
4. Run verification scripts
5. Submit PR with detailed description
6. Address review feedback
7. Merge after approval

### Documentation Requirements

- Update component API documentation
- Add usage examples
- Include accessibility notes
- Update migration guides if needed
- Add TypeScript definitions

## Resources

### Internal Documentation
- [Design System Overview](./DESIGN_SYSTEM.md)
- [Component API Reference](./COMPONENT_API.md)
- [Design Tokens](./DESIGN_TOKENS.md)
- [Accessibility Guidelines](./ACCESSIBILITY_GUIDELINES.md)

### External Resources
- [React Documentation](https://react.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
- [Testing Library Documentation](https://testing-library.com/docs/)

### Tools and Libraries
- [clsx](https://github.com/lukeed/clsx) - Conditional class names
- [Heroicons](https://heroicons.com/) - Icon library
- [Headless UI](https://headlessui.com/) - Unstyled components
- [Radix UI](https://www.radix-ui.com/) - Low-level UI primitives
