# Component API Reference

## Overview

This document provides comprehensive API documentation for all SwiftNotes Design System components. Each component includes detailed prop definitions, usage examples, and implementation notes.

## Button Component

### Props

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
  className?: string;
  type?: 'button' | 'submit' | 'reset';
}
```

### Prop Details

#### variant
- **Type**: `'primary' | 'secondary' | 'outline' | 'ghost' | 'danger'`
- **Default**: `'primary'`
- **Description**: Visual style variant of the button

#### size
- **Type**: `'sm' | 'md' | 'lg'`
- **Default**: `'md'`
- **Description**: Size of the button affecting height and padding

#### loading
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Shows loading spinner and disables interaction

#### disabled
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Disables the button and applies disabled styling

#### fullWidth
- **Type**: `boolean`
- **Default**: `false`
- **Description**: Makes button take full width of container

#### icon
- **Type**: `React.ReactNode`
- **Default**: `undefined`
- **Description**: Icon to display alongside button text

#### iconPosition
- **Type**: `'left' | 'right'`
- **Default**: `'left'`
- **Description**: Position of icon relative to text

### Examples

```tsx
// Basic usage
<Button>Click me</Button>

// With variant and size
<Button variant="secondary" size="lg">Large Secondary</Button>

// With icon
<Button icon={<PlusIcon />} iconPosition="left">Add Item</Button>

// Loading state
<Button loading>Processing...</Button>

// Full width
<Button fullWidth variant="primary">Submit Form</Button>
```

## Badge Component

### Base Badge Props

```tsx
interface BadgeProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  style?: 'filled' | 'outline' | 'subtle' | 'gradient';
  size?: 'sm' | 'md' | 'lg';
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  removable?: boolean;
  onRemove?: () => void;
  onClick?: () => void;
  className?: string;
}
```

### Specialized Badge Components

#### NavigationBadge

```tsx
interface NavigationBadgeProps {
  children: React.ReactNode;
  type?: 'default' | 'premium' | 'new' | 'beta';
  className?: string;
}
```

#### StatusBadge

```tsx
interface StatusBadgeProps {
  children: React.ReactNode;
  status: 'increase' | 'decrease' | 'neutral' | 'positive' | 'negative';
  className?: string;
}
```

#### CostBadge

```tsx
interface CostBadgeProps {
  children: React.ReactNode;
  type: 'free' | 'credits' | 'premium';
  icon?: React.ReactNode;
  className?: string;
}
```

#### TaskBadge

```tsx
interface TaskBadgeProps {
  children: React.ReactNode;
  completed?: boolean;
  className?: string;
}
```

### Examples

```tsx
// Basic badge
<Badge variant="primary">New</Badge>

// Interactive badge
<Badge onClick={() => console.log('clicked')} removable onRemove={() => console.log('removed')}>
  Tag
</Badge>

// Navigation badge
<NavigationBadge type="premium">Pro</NavigationBadge>

// Status badge
<StatusBadge status="positive">+12.5%</StatusBadge>

// Cost badge
<CostBadge type="free" icon={<SparklesIcon />}>Free</CostBadge>

// Task badge
<TaskBadge completed>Completed Task</TaskBadge>
```

## Layout Components

### Stack

```tsx
interface StackProps {
  children: React.ReactNode;
  spacing?: ResponsiveValue<SpacingToken>;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}
```

### Inline

```tsx
interface InlineProps {
  children: React.ReactNode;
  spacing?: ResponsiveValue<SpacingToken>;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}
```

### Grid

```tsx
interface GridProps {
  children: React.ReactNode;
  cols?: ResponsiveValue<number>;
  gap?: ResponsiveValue<SpacingToken>;
  className?: string;
}
```

### Container

```tsx
interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: ResponsiveValue<SpacingToken>;
  center?: boolean;
  className?: string;
}
```

### Box

```tsx
interface BoxProps {
  children: React.ReactNode;
  p?: ResponsiveValue<SpacingToken>;
  px?: ResponsiveValue<SpacingToken>;
  py?: ResponsiveValue<SpacingToken>;
  m?: ResponsiveValue<SpacingToken>;
  mx?: ResponsiveValue<SpacingToken>;
  my?: ResponsiveValue<SpacingToken>;
  className?: string;
}
```

### Spacer

```tsx
interface SpacerProps {
  size?: ResponsiveValue<SpacingToken>;
  direction?: 'horizontal' | 'vertical';
}
```

### Layout Examples

```tsx
// Stack with responsive spacing
<Stack spacing={{ base: 'sm', md: 'md', lg: 'lg' }}>
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>

// Inline with justification
<Inline justify="between" align="center" spacing="md">
  <span>Left</span>
  <span>Right</span>
</Inline>

// Responsive grid
<Grid cols={{ base: 1, sm: 2, md: 3, lg: 4 }} gap="md">
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</Grid>

// Container with padding
<Container size="xl" padding={{ base: 'md', lg: 'xl' }}>
  <Content />
</Container>

// Box with spacing
<Box p="lg" mx="auto" my="xl">
  <Content />
</Box>

// Spacer
<Spacer size="xl" direction="vertical" />
```

## Type Definitions

### SpacingToken

```tsx
type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'auto';
```

### ResponsiveValue

```tsx
type ResponsiveValue<T> = T | {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};
```

## Common Patterns

### Form Layout

```tsx
<Container size="md" padding="xl">
  <Stack spacing="lg">
    <h1>Form Title</h1>
    
    <Stack spacing="md">
      <label>Email</label>
      <input type="email" />
    </Stack>
    
    <Stack spacing="md">
      <label>Password</label>
      <input type="password" />
    </Stack>
    
    <Inline justify="end" spacing="sm">
      <Button variant="outline">Cancel</Button>
      <Button variant="primary" type="submit">Submit</Button>
    </Inline>
  </Stack>
</Container>
```

### Card Layout

```tsx
<Box p="lg" className="bg-white rounded-lg shadow-card">
  <Stack spacing="md">
    <Inline justify="between" align="center">
      <h3>Card Title</h3>
      <Badge variant="success">Active</Badge>
    </Inline>
    
    <p>Card content goes here...</p>
    
    <Inline justify="end" spacing="sm">
      <Button variant="ghost" size="sm">Edit</Button>
      <Button variant="outline" size="sm">Delete</Button>
    </Inline>
  </Stack>
</Box>
```

### Dashboard Grid

```tsx
<Container size="full" padding="xl">
  <Stack spacing="xl">
    <Inline justify="between" align="center">
      <h1>Dashboard</h1>
      <Button variant="primary" icon={<PlusIcon />}>Add New</Button>
    </Inline>
    
    <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="lg">
      {stats.map(stat => (
        <Box key={stat.id} p="lg" className="bg-white rounded-lg shadow-card">
          <Stack spacing="sm">
            <Inline justify="between" align="center">
              <span className="text-sm text-gray-600">{stat.label}</span>
              <stat.icon className="w-5 h-5 text-gray-400" />
            </Inline>
            <span className="text-2xl font-bold">{stat.value}</span>
            <StatusBadge status={stat.trend}>{stat.change}</StatusBadge>
          </Stack>
        </Box>
      ))}
    </Grid>
  </Stack>
</Container>
```

## Accessibility Notes

### Button
- Always includes proper ARIA attributes
- Supports keyboard navigation
- Loading state announces to screen readers
- Disabled state prevents interaction

### Badge
- Uses semantic colors with sufficient contrast
- Interactive badges include proper focus states
- Removable badges have accessible remove buttons

### Layout
- Maintains logical tab order
- Responsive design doesn't break accessibility
- Proper heading hierarchy in examples

## Performance Considerations

### Bundle Size
- Components are tree-shakeable
- Import only what you need
- Shared dependencies are optimized

### Runtime Performance
- Minimal re-renders
- Efficient prop handling
- Optimized responsive calculations

### Memory Usage
- No memory leaks in event handlers
- Proper cleanup in useEffect hooks
- Efficient component composition
