# Layout System Migration Guide

## Overview
This guide shows the layout patterns found in your codebase and how to migrate them to the unified Layout system.

## Import Statement
Add this import to your component files:
```tsx
import { Stack, Inline, Grid, Container, Box, Spacer } from '../components/ui';
```

## Standardized Spacing Tokens
Use these standardized spacing tokens instead of arbitrary values:
- `xs` = 4px
- `sm` = 8px  
- `md` = 12px (default)
- `lg` = 16px
- `xl` = 24px
- `2xl` = 32px
- `3xl` = 48px

## Layout Analysis Results


### components/layout/IntuitiveLayout.tsx

**Found Layout Patterns:**
- Flex Layouts: 1 occurrences
  Pattern: `flex items-center space-x-\d+`
  Examples: `flex items-center space-x-3`
- Flex Layouts: 1 occurrences
  Pattern: `flex items-center justify-between`
  Examples: `flex items-center justify-between`
- Spacing Patterns: 1 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-3`
- Spacing Patterns: 2 occurrences
  Pattern: `space-y-[1-6]`
  Examples: `space-y-6`, `space-y-6`
- Spacing Patterns: 3 occurrences
  Pattern: `p-[1-6]`
  Examples: `p-6`, `p-6`, `p-6`
- Spacing Patterns: 6 occurrences
  Pattern: `px-[1-6]`
  Examples: `px-6`, `px-6`, `px-3`
- Spacing Patterns: 5 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-2`, `py-2`, `py-2`
- Container Patterns: 1 occurrences
  Pattern: `max-w-\w+`
  Examples: `max-w-7xl`
- Container Patterns: 1 occurrences
  Pattern: `mx-auto`
  Examples: `mx-auto`
- Container Patterns: 3 occurrences
  Pattern: `w-full`
  Examples: `w-full`, `w-full`, `w-full`

**Migration Suggestions:**
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center space-x-3`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center justify-between`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-y-6`, `space-y-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `p-6`, `p-6`, `p-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `px-6`, `px-6`, `px-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-2`, `py-2`, `py-2`
- Container Patterns: <Container size="xl">
  Examples to replace: `max-w-7xl`
- Container Patterns: <Container size="xl">
  Examples to replace: `mx-auto`
- Container Patterns: <Container size="xl">
  Examples to replace: `w-full`, `w-full`, `w-full`


### components/layout/Layout.tsx

**Found Layout Patterns:**
- Flex Layouts: 4 occurrences
  Pattern: `flex items-center space-x-\d+`
  Examples: `flex items-center space-x-2`, `flex items-center space-x-4`, `flex items-center space-x-2`
- Spacing Patterns: 4 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-2`, `space-x-4`, `space-x-2`
- Spacing Patterns: 2 occurrences
  Pattern: `space-y-[1-6]`
  Examples: `space-y-1`, `space-y-1`
- Spacing Patterns: 14 occurrences
  Pattern: `px-[1-6]`
  Examples: `px-4`, `px-2`, `px-2`
- Spacing Patterns: 7 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-4`, `py-2`, `py-2`
- Container Patterns: 1 occurrences
  Pattern: `max-w-\w+`
  Examples: `max-w-7xl`
- Container Patterns: 1 occurrences
  Pattern: `mx-auto`
  Examples: `mx-auto`
- Container Patterns: 1 occurrences
  Pattern: `w-full`
  Examples: `w-full`

**Migration Suggestions:**
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center space-x-2`, `flex items-center space-x-4`, `flex items-center space-x-2`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-2`, `space-x-4`, `space-x-2`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-y-1`, `space-y-1`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `px-4`, `px-2`, `px-2`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-4`, `py-2`, `py-2`
- Container Patterns: <Container size="xl">
  Examples to replace: `max-w-7xl`
- Container Patterns: <Container size="xl">
  Examples to replace: `mx-auto`
- Container Patterns: <Container size="xl">
  Examples to replace: `w-full`


### components/layout/AuthLayout.tsx

**Found Layout Patterns:**
- Spacing Patterns: 1 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-6`
- Spacing Patterns: 1 occurrences
  Pattern: `p-[1-6]`
  Examples: `p-1`
- Spacing Patterns: 3 occurrences
  Pattern: `px-[1-6]`
  Examples: `px-6`, `px-4`, `px-1`
- Spacing Patterns: 1 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-1`
- Container Patterns: 2 occurrences
  Pattern: `max-w-\w+`
  Examples: `max-w-md`, `max-w-md`
- Container Patterns: 2 occurrences
  Pattern: `mx-auto`
  Examples: `mx-auto`, `mx-auto`
- Container Patterns: 2 occurrences
  Pattern: `w-full`
  Examples: `w-full`, `w-full`

**Migration Suggestions:**
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `p-1`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `px-6`, `px-4`, `px-1`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-1`
- Container Patterns: <Container size="xl">
  Examples to replace: `max-w-md`, `max-w-md`
- Container Patterns: <Container size="xl">
  Examples to replace: `mx-auto`, `mx-auto`
- Container Patterns: <Container size="xl">
  Examples to replace: `w-full`, `w-full`


### pages/DashboardPage.tsx

**Found Layout Patterns:**
- Grid Layouts: 2 occurrences
  Pattern: `grid grid-cols-1 gap-\d+`
  Examples: `grid grid-cols-1 gap-5`, `grid grid-cols-1 gap-4`
- Grid Layouts: 6 occurrences
  Pattern: `grid-cols-\d+`
  Examples: `grid-cols-1`, `grid-cols-2`, `grid-cols-4`
- Flex Layouts: 1 occurrences
  Pattern: `flex items-center space-x-\d+`
  Examples: `flex items-center space-x-3`
- Flex Layouts: 3 occurrences
  Pattern: `flex items-center justify-between`
  Examples: `flex items-center justify-between`, `flex items-center justify-between`, `flex items-center justify-between`
- Spacing Patterns: 1 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-3`
- Spacing Patterns: 1 occurrences
  Pattern: `space-y-[1-6]`
  Examples: `space-y-6`
- Spacing Patterns: 2 occurrences
  Pattern: `gap-[1-6]`
  Examples: `gap-5`, `gap-4`
- Spacing Patterns: 10 occurrences
  Pattern: `p-[1-6]`
  Examples: `p-6`, `p-5`, `p-5`
- Spacing Patterns: 7 occurrences
  Pattern: `px-[1-6]`
  Examples: `px-3`, `px-2`, `px-6`
- Spacing Patterns: 5 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-1`, `py-4`, `py-4`
- Container Patterns: 1 occurrences
  Pattern: `mx-auto`
  Examples: `mx-auto`

**Migration Suggestions:**
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid grid-cols-1 gap-5`, `grid grid-cols-1 gap-4`
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid-cols-1`, `grid-cols-2`, `grid-cols-4`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center space-x-3`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center justify-between`, `flex items-center justify-between`, `flex items-center justify-between`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-y-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `gap-5`, `gap-4`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `p-6`, `p-5`, `p-5`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `px-3`, `px-2`, `px-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-1`, `py-4`, `py-4`
- Container Patterns: <Container size="xl">
  Examples to replace: `mx-auto`


### pages/IntuitiveDashboardPage.tsx

**Found Layout Patterns:**
- Grid Layouts: 1 occurrences
  Pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
  Examples: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Grid Layouts: 1 occurrences
  Pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  Examples: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Grid Layouts: 6 occurrences
  Pattern: `grid-cols-\d+`
  Examples: `grid-cols-1`, `grid-cols-2`, `grid-cols-4`
- Flex Layouts: 1 occurrences
  Pattern: `flex items-center space-x-\d+`
  Examples: `flex items-center space-x-3`
- Flex Layouts: 1 occurrences
  Pattern: `flex items-center justify-between`
  Examples: `flex items-center justify-between`
- Flex Layouts: 1 occurrences
  Pattern: `flex items-start space-x-\d+`
  Examples: `flex items-start space-x-4`
- Spacing Patterns: 2 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-3`, `space-x-4`
- Spacing Patterns: 2 occurrences
  Pattern: `gap-[1-6]`
  Examples: `gap-6`, `gap-6`
- Spacing Patterns: 2 occurrences
  Pattern: `p-[1-6]`
  Examples: `p-6`, `p-6`
- Spacing Patterns: 1 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-1`
- Container Patterns: 1 occurrences
  Pattern: `mx-auto`
  Examples: `mx-auto`

**Migration Suggestions:**
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid-cols-1`, `grid-cols-2`, `grid-cols-4`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center space-x-3`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center justify-between`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-start space-x-4`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-3`, `space-x-4`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `gap-6`, `gap-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `p-6`, `p-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-1`
- Container Patterns: <Container size="xl">
  Examples to replace: `mx-auto`


### pages/IntuitiveNotesHistoryPage.tsx

**Found Layout Patterns:**
- Grid Layouts: 1 occurrences
  Pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
  Examples: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Grid Layouts: 2 occurrences
  Pattern: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
  Examples: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Grid Layouts: 13 occurrences
  Pattern: `grid-cols-\d+`
  Examples: `grid-cols-1`, `grid-cols-3`, `grid-cols-1`
- Flex Layouts: 8 occurrences
  Pattern: `flex items-center space-x-\d+`
  Examples: `flex items-center space-x-4`, `flex items-center space-x-4`, `flex items-center space-x-4`
- Flex Layouts: 2 occurrences
  Pattern: `flex items-center justify-between`
  Examples: `flex items-center justify-between`, `flex items-center justify-between`
- Spacing Patterns: 8 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-4`, `space-x-4`, `space-x-4`
- Spacing Patterns: 6 occurrences
  Pattern: `space-y-[1-6]`
  Examples: `space-y-6`, `space-y-4`, `space-y-6`
- Spacing Patterns: 5 occurrences
  Pattern: `gap-[1-6]`
  Examples: `gap-6`, `gap-6`, `gap-4`
- Spacing Patterns: 11 occurrences
  Pattern: `p-[1-6]`
  Examples: `p-6`, `p-6`, `p-1`
- Spacing Patterns: 3 occurrences
  Pattern: `px-[1-6]`
  Examples: `px-3`, `px-3`, `px-3`
- Spacing Patterns: 5 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-3`, `py-2`, `py-2`
- Container Patterns: 1 occurrences
  Pattern: `mx-auto`
  Examples: `mx-auto`
- Container Patterns: 4 occurrences
  Pattern: `w-full`
  Examples: `w-full`, `w-full`, `w-full`

**Migration Suggestions:**
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4`
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`, `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3`
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid-cols-1`, `grid-cols-3`, `grid-cols-1`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center space-x-4`, `flex items-center space-x-4`, `flex items-center space-x-4`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center justify-between`, `flex items-center justify-between`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-4`, `space-x-4`, `space-x-4`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-y-6`, `space-y-4`, `space-y-6`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `gap-6`, `gap-6`, `gap-4`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `p-6`, `p-6`, `p-1`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `px-3`, `px-3`, `px-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-3`, `py-2`, `py-2`
- Container Patterns: <Container size="xl">
  Examples to replace: `mx-auto`
- Container Patterns: <Container size="xl">
  Examples to replace: `w-full`, `w-full`, `w-full`


### components/DefaultGenerationSettings.tsx

**Found Layout Patterns:**
- Grid Layouts: 1 occurrences
  Pattern: `grid-cols-\d+`
  Examples: `grid-cols-2`
- Flex Layouts: 3 occurrences
  Pattern: `flex items-center justify-between`
  Examples: `flex items-center justify-between`, `flex items-center justify-between`, `flex items-center justify-between`
- Spacing Patterns: 1 occurrences
  Pattern: `space-x-[1-6]`
  Examples: `space-x-3`
- Spacing Patterns: 2 occurrences
  Pattern: `space-y-[1-6]`
  Examples: `space-y-6`, `space-y-3`
- Spacing Patterns: 1 occurrences
  Pattern: `gap-[1-6]`
  Examples: `gap-2`
- Spacing Patterns: 4 occurrences
  Pattern: `p-[1-6]`
  Examples: `p-6`, `p-2`, `p-3`
- Spacing Patterns: 2 occurrences
  Pattern: `px-[1-6]`
  Examples: `px-4`, `px-4`
- Spacing Patterns: 2 occurrences
  Pattern: `py-[1-6]`
  Examples: `py-2`, `py-2`
- Container Patterns: 1 occurrences
  Pattern: `w-full`
  Examples: `w-full`

**Migration Suggestions:**
- Grid Layouts: <Grid cols={{ base: 1, md: 2, lg: 4 }} gap="md">
  Examples to replace: `grid-cols-2`
- Flex Layouts: <Inline spacing="md" align="center">
  Examples to replace: `flex items-center justify-between`, `flex items-center justify-between`, `flex items-center justify-between`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-x-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `space-y-6`, `space-y-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `gap-2`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `p-6`, `p-2`, `p-3`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `px-4`, `px-4`
- Spacing Patterns: Use standardized spacing tokens (xs, sm, md, lg, xl, 2xl, 3xl)
  Examples to replace: `py-2`, `py-2`
- Container Patterns: <Container size="xl">
  Examples to replace: `w-full`


## Migration Examples

### Grid Layouts
```tsx
// Before
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</div>

// After
<Grid cols={{ base: 1, md: 2, lg: 4 }} gap="xl">
  {items.map(item => <div key={item.id}>{item.content}</div>)}
</Grid>
```

### Flex Layouts
```tsx
// Before
<div className="flex items-center space-x-3">
  <Icon />
  <span>Text</span>
</div>

// After
<Inline spacing="md" align="center">
  <Icon />
  <span>Text</span>
</Inline>
```

### Stack Layouts
```tsx
// Before
<div className="flex flex-col space-y-4">
  <div>Item 1</div>
  <div>Item 2</div>
</div>

// After
<Stack spacing="lg">
  <div>Item 1</div>
  <div>Item 2</div>
</Stack>
```

### Container Layouts
```tsx
// Before
<div className="max-w-xl mx-auto p-6">
  <Content />
</div>

// After
<Container size="xl" padding="xl">
  <Content />
</Container>
```

### Box Layouts (Spacing Utilities)
```tsx
// Before
<div className="p-4 mx-2 my-6">
  <Content />
</div>

// After
<Box p="lg" mx="sm" my="xl">
  <Content />
</Box>
```

## Responsive Design
The new layout system supports responsive values:

```tsx
// Responsive grid
<Grid 
  cols={{ base: 1, sm: 2, md: 3, lg: 4 }} 
  gap={{ base: 'sm', md: 'md', lg: 'lg' }}
>
  {items}
</Grid>

// Responsive spacing
<Stack spacing={{ base: 'sm', md: 'md', lg: 'lg' }}>
  {items}
</Stack>
```

## Migration Strategy

1. **Phase 1**: Import layout components in target files
2. **Phase 2**: Replace grid patterns with Grid component
3. **Phase 3**: Replace flex patterns with Stack/Inline components
4. **Phase 4**: Replace container patterns with Container component
5. **Phase 5**: Replace spacing patterns with Box component
6. **Phase 6**: Test and verify visual consistency

## Benefits

- **Consistency**: Standardized spacing across the application
- **Responsive**: Built-in responsive design support
- **Maintainable**: Centralized layout logic
- **Type-safe**: TypeScript support for all props
- **Flexible**: Supports both simple and complex layouts

## Testing

After migration, verify:
- Visual appearance matches original
- Responsive behavior works correctly
- No layout shifts or breaks
- Accessibility is maintained
