/**
 * Unified Layout System
 * Provides standardized layout utilities and consistent spacing
 * Consolidates all layout patterns into reusable components
 */

import React from 'react';
import { clsx } from 'clsx';

// Standardized spacing tokens
export type SpacingToken = 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | 'auto';

// Responsive breakpoint types
export type ResponsiveValue<T> = T | {
  base?: T;
  sm?: T;
  md?: T;
  lg?: T;
  xl?: T;
};

// Spacing token mapping
const spacingMap: Record<SpacingToken, string> = {
  none: '0',
  xs: '1',      // 4px
  sm: '2',      // 8px
  md: '3',      // 12px
  lg: '4',      // 16px
  xl: '6',      // 24px
  '2xl': '8',   // 32px
  '3xl': '12',  // 48px
  auto: 'auto', // auto
};



// Stack Component - Vertical layout with consistent spacing
export interface StackProps {
  children: React.ReactNode;
  spacing?: ResponsiveValue<SpacingToken>;
  align?: 'start' | 'center' | 'end' | 'stretch';
  className?: string;
}

export const Stack: React.FC<StackProps> = ({
  children,
  spacing = 'md',
  align = 'stretch',
  className,
}) => {
  const spaceValue = typeof spacing === 'string' ? spacing : spacing.base || 'md';
  const spaceClass = spacingMap[spaceValue];

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    stretch: 'items-stretch',
  };

  return (
    <div
      className={clsx(
        'flex flex-col',
        `space-y-${spaceClass}`,
        alignClasses[align],
        className
      )}
    >
      {children}
    </div>
  );
};

// Inline Component - Horizontal layout with consistent spacing
export interface InlineProps {
  children: React.ReactNode;
  spacing?: ResponsiveValue<SpacingToken>;
  align?: 'start' | 'center' | 'end' | 'baseline';
  justify?: 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';
  wrap?: boolean;
  className?: string;
}

export const Inline: React.FC<InlineProps> = ({
  children,
  spacing = 'md',
  align = 'center',
  justify = 'start',
  wrap = false,
  className,
}) => {
  const spaceValue = typeof spacing === 'string' ? spacing : spacing.base || 'md';
  const spaceClass = spacingMap[spaceValue];

  const alignClasses = {
    start: 'items-start',
    center: 'items-center',
    end: 'items-end',
    baseline: 'items-baseline',
  };

  const justifyClasses = {
    start: 'justify-start',
    center: 'justify-center',
    end: 'justify-end',
    between: 'justify-between',
    around: 'justify-around',
    evenly: 'justify-evenly',
  };

  return (
    <div
      className={clsx(
        'flex',
        `space-x-${spaceClass}`,
        alignClasses[align],
        justifyClasses[justify],
        wrap && 'flex-wrap',
        className
      )}
    >
      {children}
    </div>
  );
};

// Grid Component - CSS Grid layout with responsive columns
export interface GridProps {
  children: React.ReactNode;
  cols?: ResponsiveValue<number>;
  gap?: ResponsiveValue<SpacingToken>;
  className?: string;
}

export const Grid: React.FC<GridProps> = ({
  children,
  cols = 1,
  gap = 'md',
  className,
}) => {
  // Generate grid column classes
  const getGridCols = (value: ResponsiveValue<number>): string => {
    if (typeof value === 'number') {
      return `grid-cols-${value}`;
    }

    const classes: string[] = [];
    if (value.base) classes.push(`grid-cols-${value.base}`);
    if (value.sm) classes.push(`sm:grid-cols-${value.sm}`);
    if (value.md) classes.push(`md:grid-cols-${value.md}`);
    if (value.lg) classes.push(`lg:grid-cols-${value.lg}`);
    if (value.xl) classes.push(`xl:grid-cols-${value.xl}`);

    return classes.join(' ');
  };

  // Generate gap classes
  const getGapClasses = (value: ResponsiveValue<SpacingToken>): string => {
    if (typeof value === 'string') {
      return `gap-${spacingMap[value]}`;
    }

    const classes: string[] = [];
    if (value.base) classes.push(`gap-${spacingMap[value.base]}`);
    if (value.sm) classes.push(`sm:gap-${spacingMap[value.sm]}`);
    if (value.md) classes.push(`md:gap-${spacingMap[value.md]}`);
    if (value.lg) classes.push(`lg:gap-${spacingMap[value.lg]}`);
    if (value.xl) classes.push(`xl:gap-${spacingMap[value.xl]}`);

    return classes.join(' ');
  };

  return (
    <div
      className={clsx(
        'grid',
        getGridCols(cols),
        getGapClasses(gap),
        className
      )}
    >
      {children}
    </div>
  );
};

// Container Component - Responsive container with max-width
export interface ContainerProps {
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | 'full';
  padding?: ResponsiveValue<SpacingToken>;
  center?: boolean;
  className?: string;
}

export const Container: React.FC<ContainerProps> = ({
  children,
  size = 'xl',
  padding = 'lg',
  center = true,
  className,
}) => {
  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    full: 'max-w-full',
  };

  // Generate padding classes
  const getPaddingClasses = (value: ResponsiveValue<SpacingToken>): string => {
    if (typeof value === 'string') {
      return `p-${spacingMap[value]}`;
    }

    const classes: string[] = [];
    if (value.base) classes.push(`p-${spacingMap[value.base]}`);
    if (value.sm) classes.push(`sm:p-${spacingMap[value.sm]}`);
    if (value.md) classes.push(`md:p-${spacingMap[value.md]}`);
    if (value.lg) classes.push(`lg:p-${spacingMap[value.lg]}`);
    if (value.xl) classes.push(`xl:p-${spacingMap[value.xl]}`);

    return classes.join(' ');
  };

  return (
    <div
      className={clsx(
        'w-full',
        sizeClasses[size],
        getPaddingClasses(padding),
        center && 'mx-auto',
        className
      )}
    >
      {children}
    </div>
  );
};

// Box Component - Generic container with spacing utilities
export interface BoxProps {
  children: React.ReactNode;
  p?: ResponsiveValue<SpacingToken>;
  px?: ResponsiveValue<SpacingToken>;
  py?: ResponsiveValue<SpacingToken>;
  m?: ResponsiveValue<SpacingToken>;
  mx?: ResponsiveValue<SpacingToken>;
  my?: ResponsiveValue<SpacingToken>;
  className?: string;
}

export const Box: React.FC<BoxProps> = ({
  children,
  p,
  px,
  py,
  m,
  mx,
  my,
  className,
}) => {
  const classes: string[] = [];

  // Padding classes
  if (p) {
    const value = typeof p === 'string' ? p : p.base || 'none';
    classes.push(`p-${spacingMap[value]}`);
  }
  if (px) {
    const value = typeof px === 'string' ? px : px.base || 'none';
    classes.push(`px-${spacingMap[value]}`);
  }
  if (py) {
    const value = typeof py === 'string' ? py : py.base || 'none';
    classes.push(`py-${spacingMap[value]}`);
  }

  // Margin classes
  if (m) {
    const value = typeof m === 'string' ? m : m.base || 'none';
    classes.push(`m-${spacingMap[value]}`);
  }
  if (mx) {
    const value = typeof mx === 'string' ? mx : mx.base || 'none';
    classes.push(`mx-${spacingMap[value]}`);
  }
  if (my) {
    const value = typeof my === 'string' ? my : my.base || 'none';
    classes.push(`my-${spacingMap[value]}`);
  }

  return (
    <div className={clsx(classes.join(' '), className)}>
      {children}
    </div>
  );
};

// Spacer Component - Flexible spacing utility
export interface SpacerProps {
  size?: ResponsiveValue<SpacingToken>;
  direction?: 'horizontal' | 'vertical';
}

export const Spacer: React.FC<SpacerProps> = ({
  size = 'md',
  direction = 'vertical',
}) => {
  const spaceValue = typeof size === 'string' ? size : size.base || 'md';
  const spaceClass = spacingMap[spaceValue];

  if (direction === 'horizontal') {
    return <div className={`w-${spaceClass}`} />;
  }

  return <div className={`h-${spaceClass}`} />;
};
