import React, { useEffect, useRef, useState, useCallback } from 'react';
import { clsx } from 'clsx';

// Screen reader utilities
export const announceToScreenReader = (message: string, priority: 'polite' | 'assertive' = 'polite') => {
  const announcement = document.createElement('div');
  announcement.setAttribute('aria-live', priority);
  announcement.setAttribute('aria-atomic', 'true');
  announcement.className = 'sr-only';
  announcement.textContent = message;
  
  document.body.appendChild(announcement);
  
  // Remove after announcement
  setTimeout(() => {
    document.body.removeChild(announcement);
  }, 1000);
};

// Skip link component for keyboard navigation
export const SkipLink: React.FC<{
  href: string;
  children: React.ReactNode;
}> = ({ href, children }) => {
  return (
    <a
      href={href}
      className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 bg-primary-600 text-white px-4 py-2 rounded-lg z-50 focus:outline-none focus:ring-2 focus:ring-primary-200"
    >
      {children}
    </a>
  );
};

// Focus trap hook for modals and dialogs
export const useFocusTrap = (isActive: boolean) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!isActive) return;

    const container = containerRef.current;
    if (!container) return;

    // Store the previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Get all focusable elements
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus the first element
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        // Let parent handle escape
        e.stopPropagation();
      }
    };

    document.addEventListener('keydown', handleTabKey);
    document.addEventListener('keydown', handleEscapeKey);

    return () => {
      document.removeEventListener('keydown', handleTabKey);
      document.removeEventListener('keydown', handleEscapeKey);
      
      // Restore focus to the previously active element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isActive]);

  return containerRef;
};

// Accessible button component with proper ARIA attributes
interface AccessibleButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  ariaLabel?: string;
  ariaDescribedBy?: string;
  ariaExpanded?: boolean;
  ariaControls?: string;
  type?: 'button' | 'submit' | 'reset';
}

export const AccessibleButton: React.FC<AccessibleButtonProps> = ({
  children,
  onClick,
  disabled = false,
  loading = false,
  variant = 'primary',
  size = 'md',
  className,
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  type = 'button',
}) => {
  const handleClick = useCallback(() => {
    if (disabled || loading) return;
    onClick?.();
  }, [disabled, loading, onClick]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      handleClick();
    }
  }, [handleClick]);

  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-in-out
    focus:outline-none focus:ring-2 focus:ring-offset-2
    disabled:opacity-50 disabled:cursor-not-allowed
  `;

  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white focus:ring-primary-200',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-800 focus:ring-secondary-200',
    outline: 'border-2 border-primary-300 hover:border-primary-500 bg-white hover:bg-primary-50 text-primary-700 focus:ring-primary-200',
    ghost: 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50 focus:ring-primary-200',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-200',
  };

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm rounded-lg',
    md: 'px-4 py-2.5 text-sm rounded-xl',
    lg: 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      type={type}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      disabled={disabled || loading}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      aria-expanded={ariaExpanded}
      aria-controls={ariaControls}
      aria-busy={loading}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {loading && (
        <span className="sr-only">Loading...</span>
      )}
      {children}
    </button>
  );
};

// Accessible form field with proper labeling and error handling
interface AccessibleFormFieldProps {
  id: string;
  label: string;
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'textarea';
  value?: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  helpText?: string;
  className?: string;
  rows?: number;
}

export const AccessibleFormField: React.FC<AccessibleFormFieldProps> = ({
  id,
  label,
  type = 'text',
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
  error,
  helpText,
  className,
  rows = 3,
}) => {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  
  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  const describedBy = [
    error ? errorId : null,
    helpText ? helpId : null,
  ].filter(Boolean).join(' ') || undefined;

  const inputClasses = clsx(
    'w-full px-4 py-3 border rounded-xl shadow-card transition-all duration-200',
    'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500',
    error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300',
    disabled && 'bg-gray-50 cursor-not-allowed',
    className
  );

  return (
    <div className="space-y-2">
      <label 
        htmlFor={id}
        className="block text-sm font-medium text-gray-700"
      >
        {label}
        {required && (
          <span className="text-red-500 ml-1" aria-label="required">*</span>
        )}
      </label>
      
      {type === 'textarea' ? (
        <textarea
          id={id}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          className={inputClasses}
        />
      ) : (
        <input
          id={id}
          type={type}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          aria-describedby={describedBy}
          aria-invalid={error ? 'true' : 'false'}
          className={inputClasses}
        />
      )}
      
      {helpText && (
        <p id={helpId} className="text-sm text-gray-600">
          {helpText}
        </p>
      )}
      
      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
};

// Accessible modal with proper ARIA attributes and focus management
interface AccessibleModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  className?: string;
  closeOnEscape?: boolean;
  closeOnBackdrop?: boolean;
}

export const AccessibleModal: React.FC<AccessibleModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  className,
  closeOnEscape = true,
  closeOnBackdrop = true,
}) => {
  const modalRef = useFocusTrap(isOpen);
  const titleId = `modal-title-${Math.random().toString(36).substr(2, 9)}`;

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && closeOnEscape) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
      announceToScreenReader(`Modal opened: ${title}`);
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
      if (isOpen) {
        announceToScreenReader('Modal closed');
      }
    };
  }, [isOpen, onClose, closeOnEscape, title]);

  if (!isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget && closeOnBackdrop) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleBackdropClick}
        aria-hidden="true"
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div
          ref={modalRef}
          className={clsx(
            'relative transform overflow-hidden rounded-2xl bg-white text-left shadow-floating transition-all',
            'max-w-lg w-full',
            className
          )}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 id={titleId} className="text-lg font-semibold text-gray-900">
              {title}
            </h2>
            
            <AccessibleButton
              variant="ghost"
              size="sm"
              onClick={onClose}
              ariaLabel="Close modal"
              className="ml-4"
            >
              <span aria-hidden="true">✕</span>
            </AccessibleButton>
          </div>
          
          {/* Content */}
          <div className="p-6">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Live region for dynamic content announcements
export const LiveRegion: React.FC<{
  message: string;
  priority?: 'polite' | 'assertive';
  className?: string;
}> = ({ message, priority = 'polite', className }) => {
  return (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={clsx('sr-only', className)}
    >
      {message}
    </div>
  );
};

// Progress indicator with accessibility features
interface AccessibleProgressProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  className?: string;
}

export const AccessibleProgress: React.FC<AccessibleProgressProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  className,
}) => {
  const percentage = Math.round((value / max) * 100);
  const progressId = `progress-${Math.random().toString(36).substr(2, 9)}`;

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <div className="flex justify-between items-center">
          <label htmlFor={progressId} className="text-sm font-medium text-gray-700">
            {label}
          </label>
          {showPercentage && (
            <span className="text-sm text-gray-600">{percentage}%</span>
          )}
        </div>
      )}
      
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          id={progressId}
          role="progressbar"
          aria-valuenow={value}
          aria-valuemin={0}
          aria-valuemax={max}
          aria-label={label || `Progress: ${percentage}%`}
          className="bg-primary-500 h-2 rounded-full transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      
      <LiveRegion message={`Progress: ${percentage}% complete`} />
    </div>
  );
};

// Keyboard navigation helper
export const useKeyboardNavigation = (
  items: string[],
  onSelect: (index: number) => void,
  isActive: boolean = true
) => {
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!isActive) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex(prev => (prev + 1) % items.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex(prev => (prev - 1 + items.length) % items.length);
          break;
        case 'Enter':
        case ' ':
          e.preventDefault();
          onSelect(selectedIndex);
          break;
        case 'Home':
          e.preventDefault();
          setSelectedIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setSelectedIndex(items.length - 1);
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [items.length, selectedIndex, onSelect, isActive]);

  return {
    selectedIndex,
    setSelectedIndex,
  };
};

export default {
  announceToScreenReader,
  SkipLink,
  useFocusTrap,
  AccessibleButton,
  AccessibleFormField,
  AccessibleModal,
  LiveRegion,
  AccessibleProgress,
  useKeyboardNavigation,
};
