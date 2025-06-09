# Badge Migration Guide

## Overview
This guide shows the badge implementations found in your codebase and how to migrate them to the unified Badge component.

## Import Statement
Add this import to your component files:
```tsx
import { Badge, NavigationBadge, StatusBadge, CostBadge, TaskBadge } from '../components/ui';
```

## Migration Plan


### components/intuitive/IntuitiveNavigation.tsx

**Found Badge Patterns:**
- bg-primary-100 text-primary-800 (NavigationBadge)
- bg-amber-100 text-amber-800 (NavigationBadge)
- rounded-full text-xs font-medium (Badge)

**Migration Suggestions:**
- Replace with: <NavigationBadge type="primary">{children}</NavigationBadge>
- Replace with: <NavigationBadge type="premium">{children}</NavigationBadge>
- Replace with: <Badge variant="general" style="subtle">{children}</Badge>


### components/intuitive/IntuitiveCard.tsx

**Found Badge Patterns:**
- text-green-600 bg-green-50 (StatusBadge)
- text-red-600 bg-red-50 (StatusBadge)
- text-gray-600 bg-gray-50 (StatusBadge)
- rounded-full text-xs font-medium (Badge)

**Migration Suggestions:**
- Replace with: <StatusBadge status="positive">{children}</StatusBadge>
- Replace with: <StatusBadge status="negative">{children}</StatusBadge>
- Replace with: <StatusBadge status="neutral">{children}</StatusBadge>
- Replace with: <Badge variant="general" style="subtle">{children}</Badge>


### components/CostIndicator.tsx

**Found Badge Patterns:**
- text-green-600 bg-green-50 (StatusBadge)
- px-2 py-1 rounded-md border text-xs font-medium (CostBadge)

**Migration Suggestions:**
- Replace with: <StatusBadge status="positive">{children}</StatusBadge>
- Replace with: <CostBadge type="credits">{children}</CostBadge>


### index.css

**Found Badge Patterns:**
- isp-task-badge (TaskBadge)

**Migration Suggestions:**
- Replace with: <TaskBadge>{children}</TaskBadge>


## Manual Migration Steps

1. **Add Import**: Import the Badge components at the top of each file
2. **Replace Patterns**: Replace the old badge implementations with new components
3. **Test**: Verify the visual appearance matches the original
4. **Remove**: Remove old CSS classes and inline styles

## Example Migrations

### Navigation Badge
```tsx
// Before
<span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
  New
</span>

// After
<NavigationBadge type="default">New</NavigationBadge>
```

### Status Badge
```tsx
// Before
<div className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium text-green-600 bg-green-50">
  +5.2%
</div>

// After
<StatusBadge status="positive">+5.2%</StatusBadge>
```

### Task Badge
```tsx
// Before
<span className="isp-task-badge">ISP TASK</span>

// After
<TaskBadge>ISP TASK</TaskBadge>
```
