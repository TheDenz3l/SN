import React from 'react';
import { clsx } from 'clsx';

interface IntuitiveCardProps {
  children: React.ReactNode;
  variant?: 'default' | 'elevated' | 'interactive' | 'subtle';
  padding?: 'none' | 'sm' | 'md' | 'lg' | 'xl';
  hover?: boolean;
  className?: string;
  onClick?: () => void;
  header?: React.ReactNode;
  footer?: React.ReactNode;
  loading?: boolean;
}

const IntuitiveCard: React.FC<IntuitiveCardProps> = ({
  children,
  variant = 'default',
  padding = 'md',
  hover = false,
  className,
  onClick,
  header,
  footer,
  loading = false,
}) => {
  const baseClasses = `
    bg-white rounded-xl border transition-all duration-200 ease-in-out
    ${onClick ? 'cursor-pointer' : ''}
    ${loading ? 'animate-pulse' : ''}
  `;

  const variantClasses = {
    default: `
      border-gray-200 shadow-card
      ${hover ? 'hover:shadow-card-hover hover:border-gray-300' : ''}
      ${onClick ? 'hover:transform hover:scale-[1.01] active:scale-[0.99]' : ''}
    `,
    elevated: `
      border-gray-200 shadow-elevated
      ${hover ? 'hover:shadow-floating hover:border-gray-300' : ''}
      ${onClick ? 'hover:transform hover:scale-[1.01] active:scale-[0.99]' : ''}
    `,
    interactive: `
      border-primary-200 shadow-card hover:shadow-card-hover
      hover:border-primary-300 hover:bg-primary-50/30
      ${onClick ? 'hover:transform hover:scale-[1.01] active:scale-[0.99]' : ''}
    `,
    subtle: `
      border-gray-100 shadow-sm bg-gray-50/50
      ${hover ? 'hover:shadow-card hover:border-gray-200 hover:bg-white' : ''}
      ${onClick ? 'hover:transform hover:scale-[1.01] active:scale-[0.99]' : ''}
    `,
  };

  const paddingClasses = {
    none: '',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
    xl: 'p-10',
  };

  const LoadingSkeleton = () => (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );

  return (
    <div
      className={clsx(
        baseClasses,
        variantClasses[variant],
        className
      )}
      onClick={onClick}
    >
      {header && (
        <div className={clsx(
          'border-b border-gray-200 bg-gray-50/50 rounded-t-xl',
          padding === 'none' ? 'p-4' : paddingClasses[padding]
        )}>
          {header}
        </div>
      )}
      
      <div className={clsx(
        paddingClasses[padding],
        header && footer ? '' : header ? 'rounded-b-xl' : footer ? 'rounded-t-xl' : 'rounded-xl'
      )}>
        {loading ? <LoadingSkeleton /> : children}
      </div>
      
      {footer && (
        <div className={clsx(
          'border-t border-gray-200 bg-gray-50/50 rounded-b-xl',
          padding === 'none' ? 'p-4' : paddingClasses[padding]
        )}>
          {footer}
        </div>
      )}
    </div>
  );
};

// Specialized Card Components for Common Use Cases
export const StatsCard: React.FC<{
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  icon?: React.ReactNode;
  loading?: boolean;
}> = ({ title, value, change, changeType = 'neutral', icon, loading = false }) => {
  const changeColors = {
    increase: 'text-green-600 bg-green-50',
    decrease: 'text-red-600 bg-red-50',
    neutral: 'text-gray-600 bg-gray-50',
  };

  return (
    <IntuitiveCard variant="default" hover loading={loading}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium text-gray-600 mb-1">{title}</p>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          {change && (
            <div className={clsx(
              'inline-flex items-center px-2 py-1 rounded-full text-xs font-medium mt-2',
              changeColors[changeType]
            )}>
              {change}
            </div>
          )}
        </div>
        {icon && (
          <div className="flex-shrink-0 ml-4">
            <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center text-primary-600">
              {icon}
            </div>
          </div>
        )}
      </div>
    </IntuitiveCard>
  );
};

export const ActionCard: React.FC<{
  title: string;
  description: string;
  action: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'default' | 'featured';
}> = ({ title, description, action, icon, onClick, disabled = false, variant = 'default' }) => {
  const isFeatured = variant === 'featured';

  return (
    <IntuitiveCard
      variant="interactive"
      hover={!disabled}
      onClick={disabled ? undefined : onClick}
      className={clsx(
        disabled && 'opacity-50 cursor-not-allowed',
        isFeatured && 'ring-2 ring-primary-200 bg-gradient-to-br from-primary-50 to-blue-50'
      )}
    >
      <div className="flex items-start space-x-4">
        {icon && (
          <div className="flex-shrink-0">
            <div className={clsx(
              'w-10 h-10 rounded-lg flex items-center justify-center',
              isFeatured
                ? 'bg-primary-500 text-white shadow-lg'
                : 'bg-primary-100 text-primary-600'
            )}>
              {icon}
            </div>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <h3 className={clsx(
            'text-lg font-semibold mb-1',
            isFeatured ? 'text-primary-900' : 'text-gray-900'
          )}>
            {title}
          </h3>
          <p className="text-gray-600 mb-3">{description}</p>
          <div className={clsx(
            'font-medium text-sm',
            isFeatured ? 'text-primary-700' : 'text-primary-600'
          )}>
            {action} →
          </div>
        </div>
      </div>
    </IntuitiveCard>
  );
};

export default IntuitiveCard;
