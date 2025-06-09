import React from 'react';
import { clsx } from 'clsx';

interface IntuitiveButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  tooltip?: string;
  fullWidth?: boolean;
}

const IntuitiveButton: React.FC<IntuitiveButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  disabled = false,
  icon,
  iconPosition = 'left',
  className,
  onClick,
  type = 'button',
  tooltip,
  fullWidth = false,
}) => {
  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-in-out focus:outline-none 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    transform hover:scale-[1.02] active:scale-[0.98]
    focus:ring-2 focus:ring-offset-2
    ${fullWidth ? 'w-full' : ''}
  `;

  const variantClasses = {
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
      bg-green-500 hover:bg-green-600 active:bg-green-700
      text-white shadow-card hover:shadow-card-hover
      focus:ring-green-200 border border-green-500
    `,
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
    xl: 'px-8 py-4 text-lg rounded-2xl',
  };

  const iconSizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-5 h-5',
    xl: 'w-6 h-6',
  };

  const LoadingSpinner = () => (
    <svg
      className={clsx('animate-spin', iconSizeClasses[size])}
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
        d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );

  const buttonContent = (
    <>
      {isLoading ? (
        <LoadingSpinner />
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

  const button = (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || isLoading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {buttonContent}
    </button>
  );

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

export default IntuitiveButton;
