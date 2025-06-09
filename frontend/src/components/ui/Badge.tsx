/**
 * Unified Badge Component
 * Consolidates all badge, tag, chip, and label implementations
 * Provides semantic variants with consistent styling
 */

import React from 'react';
import { clsx } from 'clsx';
import { XMarkIcon } from '@heroicons/react/24/outline';

export interface BadgeProps {
  children?: React.ReactNode;
  
  // Semantic variants
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info' | 'neutral';
  
  // Style modes
  style?: 'filled' | 'outline' | 'subtle' | 'gradient';
  
  // Sizes
  size?: 'sm' | 'md' | 'lg';
  
  // Features
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  removable?: boolean;
  onRemove?: () => void;
  
  // Layout
  className?: string;
  
  // Interaction
  onClick?: () => void;
  
  // Accessibility
  'aria-label'?: string;
  'data-testid'?: string;
}

const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  style = 'filled',
  size = 'md',
  icon,
  iconPosition = 'left',
  removable = false,
  onRemove,
  className,
  onClick,
  'aria-label': ariaLabel,
  'data-testid': dataTestId,
}) => {
  // Base classes
  const baseClasses = `
    inline-flex items-center font-medium transition-all duration-200
    ${onClick ? 'cursor-pointer hover:scale-105' : ''}
    ${removable ? 'pr-1' : ''}
  `;

  // Size classes
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs rounded-md',
    md: 'px-2.5 py-1 text-xs rounded-lg',
    lg: 'px-3 py-1.5 text-sm rounded-lg',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-4 h-4',
  };

  // Variant classes based on style mode
  const getVariantClasses = () => {
    const variants = {
      filled: {
        primary: 'bg-primary-500 text-white shadow-sm hover:bg-primary-600',
        secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        success: 'bg-emerald-500 text-white shadow-sm hover:bg-emerald-600',
        warning: 'bg-amber-500 text-white shadow-sm hover:bg-amber-600',
        error: 'bg-red-500 text-white shadow-sm hover:bg-red-600',
        info: 'bg-blue-500 text-white shadow-sm hover:bg-blue-600',
        neutral: 'bg-gray-500 text-white shadow-sm hover:bg-gray-600',
      },
      outline: {
        primary: 'border border-primary-300 text-primary-700 bg-white hover:bg-primary-50',
        secondary: 'border border-secondary-300 text-secondary-700 bg-white hover:bg-secondary-50',
        success: 'border border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50',
        warning: 'border border-amber-300 text-amber-700 bg-white hover:bg-amber-50',
        error: 'border border-red-300 text-red-700 bg-white hover:bg-red-50',
        info: 'border border-blue-300 text-blue-700 bg-white hover:bg-blue-50',
        neutral: 'border border-gray-300 text-gray-700 bg-white hover:bg-gray-50',
      },
      subtle: {
        primary: 'bg-primary-100 text-primary-800 hover:bg-primary-200',
        secondary: 'bg-secondary-100 text-secondary-800 hover:bg-secondary-200',
        success: 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200',
        warning: 'bg-amber-100 text-amber-800 hover:bg-amber-200',
        error: 'bg-red-100 text-red-800 hover:bg-red-200',
        info: 'bg-blue-100 text-blue-800 hover:bg-blue-200',
        neutral: 'bg-gray-100 text-gray-800 hover:bg-gray-200',
      },
      gradient: {
        primary: 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md hover:from-primary-600 hover:to-primary-700',
        secondary: 'bg-gradient-to-r from-secondary-400 to-secondary-500 text-white shadow-md hover:from-secondary-500 hover:to-secondary-600',
        success: 'bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-md hover:from-emerald-600 hover:to-emerald-700',
        warning: 'bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-md hover:from-amber-600 hover:to-amber-700',
        error: 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-md hover:from-red-600 hover:to-red-700',
        info: 'bg-gradient-to-r from-blue-500 to-blue-600 text-white shadow-md hover:from-blue-600 hover:to-blue-700',
        neutral: 'bg-gradient-to-r from-gray-500 to-gray-600 text-white shadow-md hover:from-gray-600 hover:to-gray-700',
      },
    };

    return variants[style][variant];
  };

  // Handle remove click
  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    onRemove?.();
  };

  // Handle badge click
  const handleClick = () => {
    if (onClick) {
      onClick();
    }
  };

  return (
    <span
      className={clsx(
        baseClasses,
        getVariantClasses(),
        sizeClasses[size],
        className
      )}
      onClick={handleClick}
      aria-label={ariaLabel}
      data-testid={dataTestId}
    >
      {/* Left icon */}
      {icon && iconPosition === 'left' && (
        <span className={clsx('flex-shrink-0', iconSizeClasses[size], children && 'mr-1')}>
          {icon}
        </span>
      )}

      {/* Content */}
      {children && <span>{children}</span>}

      {/* Right icon */}
      {icon && iconPosition === 'right' && (
        <span className={clsx('flex-shrink-0', iconSizeClasses[size], children && 'ml-1')}>
          {icon}
        </span>
      )}

      {/* Remove button */}
      {removable && (
        <button
          type="button"
          onClick={handleRemove}
          className={clsx(
            'flex-shrink-0 ml-1 rounded-full p-0.5 hover:bg-black/10 transition-colors',
            iconSizeClasses[size]
          )}
          aria-label="Remove"
        >
          <XMarkIcon className="w-full h-full" />
        </button>
      )}
    </span>
  );
};

export default Badge;

// Specialized Badge Components for Common Use Cases

// Navigation Badge (replaces IntuitiveNavigation badges)
export const NavigationBadge: React.FC<{
  children: React.ReactNode;
  type?: 'default' | 'premium' | 'new' | 'beta';
}> = ({ children, type = 'default' }) => {
  const typeMapping = {
    default: { variant: 'primary' as const, style: 'subtle' as const },
    premium: { variant: 'warning' as const, style: 'subtle' as const },
    new: { variant: 'success' as const, style: 'subtle' as const },
    beta: { variant: 'info' as const, style: 'subtle' as const },
  };

  return (
    <Badge
      variant={typeMapping[type].variant}
      style={typeMapping[type].style}
      size="sm"
    >
      {children}
    </Badge>
  );
};

// Status Badge (replaces StatsCard change indicators)
export const StatusBadge: React.FC<{
  children: React.ReactNode;
  status: 'increase' | 'decrease' | 'neutral' | 'positive' | 'negative';
}> = ({ children, status }) => {
  const statusMapping = {
    increase: { variant: 'success' as const, style: 'subtle' as const },
    positive: { variant: 'success' as const, style: 'subtle' as const },
    decrease: { variant: 'error' as const, style: 'subtle' as const },
    negative: { variant: 'error' as const, style: 'subtle' as const },
    neutral: { variant: 'neutral' as const, style: 'subtle' as const },
  };

  return (
    <Badge
      variant={statusMapping[status].variant}
      style={statusMapping[status].style}
      size="sm"
    >
      {children}
    </Badge>
  );
};

// Cost Badge (replaces CostIndicator)
export const CostBadge: React.FC<{
  children: React.ReactNode;
  type: 'free' | 'credits' | 'premium';
  icon?: React.ReactNode;
}> = ({ children, type, icon }) => {
  const typeMapping = {
    free: { variant: 'success' as const, style: 'outline' as const },
    credits: { variant: 'info' as const, style: 'outline' as const },
    premium: { variant: 'warning' as const, style: 'gradient' as const },
  };

  return (
    <Badge
      variant={typeMapping[type].variant}
      style={typeMapping[type].style}
      size="sm"
      icon={icon}
    >
      {children}
    </Badge>
  );
};

// Task Badge (replaces .isp-task-badge)
export const TaskBadge: React.FC<{
  children: React.ReactNode;
  completed?: boolean;
}> = ({ children, completed = false }) => {
  return (
    <Badge
      variant={completed ? 'success' : 'info'}
      style="subtle"
      size="sm"
    >
      {children}
    </Badge>
  );
};
