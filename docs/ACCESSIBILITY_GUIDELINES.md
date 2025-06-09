# Accessibility Guidelines

## Overview

The SwiftNotes Design System is committed to creating inclusive experiences for all users. These guidelines ensure that our components and patterns meet WCAG 2.1 AA standards and provide excellent usability for users with disabilities.

## Core Principles

### 1. Perceivable
Information and UI components must be presentable to users in ways they can perceive.

### 2. Operable
UI components and navigation must be operable by all users.

### 3. Understandable
Information and the operation of UI must be understandable.

### 4. Robust
Content must be robust enough to be interpreted by a wide variety of user agents, including assistive technologies.

## Color and Contrast

### Contrast Requirements

All text and interactive elements must meet WCAG AA contrast requirements:

- **Normal text**: Minimum 4.5:1 contrast ratio
- **Large text** (18pt+ or 14pt+ bold): Minimum 3:1 contrast ratio
- **Interactive elements**: Minimum 3:1 contrast ratio for borders and focus indicators

### Color Usage

#### Do's
- Use color combinations from our design tokens that meet contrast requirements
- Provide multiple ways to convey information (not just color)
- Test with color blindness simulators
- Use semantic colors consistently

#### Don'ts
- Don't rely solely on color to convey information
- Don't use color combinations that fail contrast tests
- Don't use red/green as the only way to show success/error states

### Approved Color Combinations

#### Text on Backgrounds
```css
/* High contrast combinations */
.text-gray-900 { color: #111827; } /* on white backgrounds */
.text-white { color: #ffffff; } /* on dark backgrounds */
.text-primary-700 { color: #1d4ed8; } /* on light backgrounds */

/* Semantic colors with sufficient contrast */
.text-success-700 { color: #15803d; } /* on success-50 background */
.text-error-700 { color: #b91c1c; } /* on error-50 background */
.text-warning-700 { color: #b45309; } /* on warning-50 background */
```

## Keyboard Navigation

### Focus Management

#### Focus Indicators
- All interactive elements must have visible focus indicators
- Focus indicators should have at least 3:1 contrast ratio
- Use consistent focus styling across components

```css
/* Standard focus styling */
.focus-visible {
  outline: 2px solid theme('colors.primary.500');
  outline-offset: 2px;
}
```

#### Tab Order
- Maintain logical tab order that follows visual layout
- Skip links should be provided for main content areas
- Modal dialogs should trap focus within the modal

#### Keyboard Shortcuts
- All mouse interactions must have keyboard equivalents
- Use standard keyboard patterns (Enter, Space, Arrow keys)
- Provide keyboard shortcuts for frequently used actions

### Component-Specific Guidelines

#### Button
```tsx
// Proper keyboard support
<Button 
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }}
>
  Action
</Button>
```

#### Interactive Elements
- Use semantic HTML elements when possible
- Provide proper ARIA labels and descriptions
- Ensure all interactive elements are keyboard accessible

## Screen Reader Support

### Semantic HTML

#### Use Proper Elements
```tsx
// Good: Semantic HTML
<button onClick={handleClick}>Submit</button>
<nav aria-label="Main navigation">...</nav>
<main>...</main>
<aside aria-label="Sidebar">...</aside>

// Bad: Non-semantic elements
<div onClick={handleClick}>Submit</div>
<div className="navigation">...</div>
```

#### Heading Hierarchy
```tsx
// Maintain proper heading order
<h1>Page Title</h1>
  <h2>Section Title</h2>
    <h3>Subsection Title</h3>
  <h2>Another Section</h2>
```

### ARIA Labels and Descriptions

#### When to Use ARIA
- When semantic HTML isn't sufficient
- For complex interactive components
- To provide additional context

```tsx
// ARIA labels for context
<button aria-label="Close dialog">×</button>
<input aria-describedby="password-help" type="password" />
<div id="password-help">Password must be at least 8 characters</div>

// ARIA for dynamic content
<div aria-live="polite" aria-atomic="true">
  {statusMessage}
</div>
```

### Component Examples

#### Button with Loading State
```tsx
<Button 
  loading={isLoading}
  aria-label={isLoading ? 'Processing...' : 'Submit form'}
  disabled={isLoading}
>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

#### Badge with Context
```tsx
<Badge 
  variant="success"
  aria-label="Status: Active"
>
  Active
</Badge>
```

## Form Accessibility

### Labels and Instructions

#### Always Provide Labels
```tsx
// Explicit labels
<label htmlFor="email">Email Address</label>
<input id="email" type="email" required />

// ARIA labels when visual labels aren't possible
<input 
  type="search" 
  aria-label="Search products"
  placeholder="Search..."
/>
```

#### Error Handling
```tsx
// Associate errors with inputs
<label htmlFor="password">Password</label>
<input 
  id="password"
  type="password"
  aria-describedby="password-error"
  aria-invalid={hasError}
/>
{hasError && (
  <div id="password-error" role="alert">
    Password must be at least 8 characters
  </div>
)}
```

### Form Validation

#### Real-time Feedback
- Provide immediate feedback for form validation
- Use `aria-live` regions for dynamic error messages
- Don't rely solely on color for error indication

```tsx
// Accessible form validation
<div className="form-field">
  <label htmlFor="username">Username</label>
  <input
    id="username"
    value={username}
    onChange={handleChange}
    aria-describedby={error ? "username-error" : undefined}
    aria-invalid={!!error}
    className={error ? "border-error-500" : "border-gray-300"}
  />
  {error && (
    <div 
      id="username-error" 
      role="alert"
      className="text-error-700 text-sm mt-1"
    >
      {error}
    </div>
  )}
</div>
```

## Motion and Animation

### Reduced Motion

Respect user preferences for reduced motion:

```css
/* Respect prefers-reduced-motion */
@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

### Animation Guidelines

#### Do's
- Use subtle animations that enhance usability
- Provide alternatives for essential information conveyed through motion
- Keep animations short (under 300ms for most interactions)
- Use easing functions that feel natural

#### Don'ts
- Don't use animations that flash more than 3 times per second
- Don't auto-play animations without user control
- Don't use motion as the only way to convey information

## Component-Specific Guidelines

### Button Component

```tsx
// Accessible button implementation
<Button
  variant="primary"
  size="md"
  disabled={isDisabled}
  loading={isLoading}
  aria-label={isLoading ? 'Processing request...' : undefined}
  onClick={handleClick}
>
  {isLoading ? 'Processing...' : 'Submit'}
</Button>
```

**Accessibility Features:**
- Proper focus management
- Loading state announcements
- Disabled state handling
- Keyboard support (Enter and Space)

### Badge Component

```tsx
// Accessible badge with context
<Badge 
  variant="warning"
  aria-label="Warning: Action required"
>
  Action Required
</Badge>

// Status badge with screen reader context
<StatusBadge 
  status="positive"
  aria-label="Increase of 12.5 percent"
>
  +12.5%
</StatusBadge>
```

### Layout Components

```tsx
// Accessible layout with landmarks
<Container size="xl" padding="lg">
  <Stack spacing="lg">
    <header>
      <h1>Page Title</h1>
    </header>
    
    <main>
      <Grid cols={{ base: 1, md: 2 }} gap="md">
        <section aria-labelledby="section1-title">
          <h2 id="section1-title">Section 1</h2>
          <p>Content...</p>
        </section>
        
        <aside aria-labelledby="sidebar-title">
          <h2 id="sidebar-title">Related Information</h2>
          <p>Sidebar content...</p>
        </aside>
      </Grid>
    </main>
  </Stack>
</Container>
```

## Testing Guidelines

### Automated Testing

#### Tools to Use
- axe-core for automated accessibility testing
- ESLint plugin for JSX accessibility
- Lighthouse accessibility audits

```javascript
// Example accessibility test
import { render, screen } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';

expect.extend(toHaveNoViolations);

test('Button should be accessible', async () => {
  const { container } = render(
    <Button variant="primary">Click me</Button>
  );
  
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### Manual Testing

#### Keyboard Testing
1. Navigate using only the Tab key
2. Activate elements using Enter and Space
3. Test escape key functionality in modals
4. Verify focus is visible and logical

#### Screen Reader Testing
1. Test with NVDA (Windows), JAWS (Windows), or VoiceOver (Mac)
2. Verify all content is announced correctly
3. Test navigation landmarks and headings
4. Verify form labels and error messages

#### Color and Contrast Testing
1. Use browser developer tools to check contrast ratios
2. Test with color blindness simulators
3. Verify information isn't conveyed by color alone

## Common Patterns

### Skip Links
```tsx
// Skip to main content
<a 
  href="#main-content"
  className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-primary-500 focus:text-white focus:rounded"
>
  Skip to main content
</a>
```

### Live Regions
```tsx
// Status announcements
<div 
  aria-live="polite" 
  aria-atomic="true"
  className="sr-only"
>
  {statusMessage}
</div>
```

### Focus Management
```tsx
// Focus management in modals
useEffect(() => {
  if (isOpen) {
    const firstFocusable = modalRef.current?.querySelector('[tabindex="0"], button, input, select, textarea');
    firstFocusable?.focus();
  }
}, [isOpen]);
```

## Resources

### Testing Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [WAVE Web Accessibility Evaluator](https://wave.webaim.org/)
- [Lighthouse Accessibility Audit](https://developers.google.com/web/tools/lighthouse)

### Guidelines and Standards
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices Guide](https://www.w3.org/WAI/ARIA/apg/)
- [WebAIM Resources](https://webaim.org/)

### Screen Readers
- [NVDA (Free)](https://www.nvaccess.org/)
- [JAWS](https://www.freedomscientific.com/products/software/jaws/)
- [VoiceOver (Built into macOS/iOS)](https://www.apple.com/accessibility/mac/vision/)

## Checklist

### Before Release
- [ ] All interactive elements are keyboard accessible
- [ ] Focus indicators are visible and meet contrast requirements
- [ ] Color contrast meets WCAG AA standards
- [ ] Screen reader testing completed
- [ ] Automated accessibility tests pass
- [ ] Form labels and error messages are properly associated
- [ ] Heading hierarchy is logical
- [ ] ARIA labels are provided where needed
- [ ] Motion respects prefers-reduced-motion
- [ ] Skip links are provided for main content areas
