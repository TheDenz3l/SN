/**
 * UI Components Index
 * Central export point for all UI components
 * Provides both new unified components and backward compatibility
 */

// New unified components
export { default as Button } from './Button';
export type { ButtonProps } from './Button';

export { default as Badge, NavigationBadge, StatusBadge, CostBadge, TaskBadge } from './Badge';
export type { BadgeProps } from './Badge';

export { Stack, Inline, Grid, Container, Box, Spacer } from './Layout';
export type { StackProps, InlineProps, GridProps, ContainerProps, BoxProps, SpacerProps, SpacingToken, ResponsiveValue } from './Layout';

// Backward compatibility exports
export { 
  IntuitiveButton, 
  ModernButton, 
  TouchButton 
} from './ButtonCompat';

export type { 
  IntuitiveButtonProps, 
  ModernButtonProps, 
  TouchButtonProps 
} from './ButtonCompat';

// Re-export for easy migration
export { default as UnifiedButton } from './Button';
