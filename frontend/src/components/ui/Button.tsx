/**
 * Unified Button Component
 * Consolidates IntuitiveButton, ModernButton, and TouchButton functionality
 * Provides comprehensive API with backward compatibility
 */

import React, { useCallback, useState } from 'react';
import { clsx } from 'clsx';

// Loading spinner component
const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg' }> = ({ size = 'md' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  return (
    <svg
      className={clsx('animate-spin', sizeClasses[size])}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
};

// Mobile detection hook
const useMobileDetection = () => {
  const [isTouch] = useState(() => {
    if (typeof window === 'undefined') return false;
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  return { isTouch };
};

export interface ButtonProps {
  children?: React.ReactNode;
  
  // Core variants
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  
  // Style modes (consolidates IntuitiveButton and ModernButton approaches)
  style?: 'solid' | 'gradient' | 'minimal';
  
  // Sizes
  size?: 'sm' | 'md' | 'lg' | 'xl';
  
  // States
  isLoading?: boolean;
  disabled?: boolean;
  
  // Icon support
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  
  // Layout
  fullWidth?: boolean;
  className?: string;
  
  // Interaction
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  
  // Enhanced features
  tooltip?: string;
  hapticFeedback?: boolean; // Mobile optimization
  
  // Accessibility
  'aria-label'?: string;
  'aria-describedby'?: string;
  'data-testid'?: string;
}

const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  style = 'solid',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  fullWidth = false,
  className,
  onClick,
  type = 'button',
  tooltip,
  hapticFeedback = true,
  'aria-label': ariaLabel,
  'aria-describedby': ariaDescribedBy,
  'data-testid': dataTestId,
}) => {
  const { isTouch } = useMobileDetection();
  const [isPressed, setIsPressed] = useState(false);

  // Base classes with responsive touch targets
  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-in-out focus:outline-none 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    transform hover:scale-[1.02] active:scale-[0.98]
    focus:ring-2 focus:ring-offset-2
    ${fullWidth ? 'w-full' : ''}
    ${isTouch ? 'min-h-[44px] min-w-[44px]' : ''} // Touch target optimization
  `;

  // Variant classes based on style mode
  const getVariantClasses = () => {
    const variants = {
      solid: {
        primary: `
          bg-primary-500 hover:bg-primary-600 active:bg-primary-700
          text-white shadow-card hover:shadow-card-hover
          focus:ring-primary-200 border border-primary-500
        `,
        secondary: `
          bg-secondary-100 hover:bg-secondary-200 active:bg-secondary-300
          text-secondary-800 shadow-card hover:shadow-card-hover
          border border-secondary-200 hover:border-secondary-300
          focus:ring-secondary-200
        `,
        outline: `
          border-2 border-primary-300 hover:border-primary-500 active:border-primary-600
          bg-white hover:bg-primary-50 active:bg-primary-100
          text-primary-700 hover:text-primary-800
          shadow-card hover:shadow-card-hover focus:ring-primary-200
        `,
        ghost: `
          text-secondary-600 hover:text-primary-600 hover:bg-primary-50
          active:bg-primary-100 focus:ring-primary-200
        `,
        danger: `
          bg-red-500 hover:bg-red-600 active:bg-red-700
          text-white shadow-card hover:shadow-card-hover
          focus:ring-red-200 border border-red-500
        `,
        success: `
          bg-emerald-500 hover:bg-emerald-600 active:bg-emerald-700
          text-white shadow-card hover:shadow-card-hover
          focus:ring-emerald-200 border border-emerald-500
        `
      },
      gradient: {
        primary: `
          bg-gradient-to-r from-primary-500 to-primary-600 
          hover:from-primary-600 hover:to-primary-700
          text-white shadow-lg hover:shadow-xl hover:shadow-primary-500/25
          focus:ring-primary-200
          before:absolute before:inset-0 before:rounded-xl 
          before:bg-gradient-to-r before:from-white/20 before:to-transparent 
          before:opacity-0 hover:before:opacity-100 before:transition-opacity before:duration-300
        `,
        secondary: `
          bg-gradient-to-r from-secondary-100 to-secondary-200 
          hover:from-secondary-200 hover:to-secondary-300
          text-secondary-800 shadow-md hover:shadow-lg
          border border-secondary-200 hover:border-secondary-300
          focus:ring-secondary-200
        `,
        outline: `
          border-2 border-primary-300 hover:border-primary-500 
          bg-white hover:bg-primary-50 text-primary-700 hover:text-primary-800
          shadow-sm hover:shadow-md focus:ring-primary-200
        `,
        ghost: `
          text-secondary-600 hover:text-primary-600 hover:bg-primary-50
          focus:ring-primary-200
        `,
        danger: `
          bg-gradient-to-r from-red-500 to-red-600 
          hover:from-red-600 hover:to-red-700
          text-white shadow-lg hover:shadow-xl hover:shadow-red-500/25
          focus:ring-red-200
        `,
        success: `
          bg-gradient-to-r from-emerald-500 to-emerald-600 
          hover:from-emerald-600 hover:to-emerald-700
          text-white shadow-lg hover:shadow-xl hover:shadow-emerald-500/25
          focus:ring-emerald-200
        `
      },
      minimal: {
        primary: `text-primary-600 hover:text-primary-700 focus:ring-primary-200`,
        secondary: `text-secondary-600 hover:text-secondary-700 focus:ring-secondary-200`,
        outline: `text-primary-600 hover:text-primary-700 focus:ring-primary-200`,
        ghost: `text-secondary-600 hover:text-primary-600 focus:ring-primary-200`,
        danger: `text-red-600 hover:text-red-700 focus:ring-red-200`,
        success: `text-emerald-600 hover:text-emerald-700 focus:ring-emerald-200`
      }
    };

    return variants[style][variant];
  };

  // Size classes
  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-2xl',
  };

  // Icon size classes
  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  // Mobile touch handlers
  const handleTouchStart = useCallback(() => {
    if (disabled || !isTouch) return;
    setIsPressed(true);
    
    // Haptic feedback for supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [disabled, isTouch, hapticFeedback]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
  }, [disabled, onClick]);

  // Button content
  const buttonContent = (
    <>
      {isLoading ? (
        <LoadingSpinner size={size === 'sm' ? 'sm' : size === 'xl' ? 'lg' : 'md'} />
      ) : (
        <>
          {icon && iconPosition === 'left' && (
            <span className={clsx('flex-shrink-0', iconSizeClasses[size], children && 'mr-2')}>
              {icon}
            </span>
          )}
          {children && <span>{children}</span>}
          {icon && iconPosition === 'right' && (
            <span className={clsx('flex-shrink-0', iconSizeClasses[size], children && 'ml-2')}>
              {icon}
            </span>
          )}
        </>
      )}
    </>
  );

  // Main button element
  const button = (
    <button
      type={type}
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      disabled={disabled || isLoading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      data-testid={dataTestId}
      className={clsx(
        baseClasses,
        getVariantClasses(),
        sizeClasses[size],
        isPressed && isTouch && 'scale-95',
        className
      )}
    >
      {buttonContent}
    </button>
  );

  // Tooltip wrapper
  if (tooltip) {
    return (
      <div className="group relative">
        {button}
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
          {tooltip}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-900"></div>
        </div>
      </div>
    );
  }

  return button;
};

export default Button;
