import React, { useState, useEffect, useRef, useCallback } from 'react';
import { clsx } from 'clsx';

// Hook for detecting mobile devices and touch capabilities
export const useMobileDetection = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [isTablet, setIsTablet] = useState(false);
  const [isTouch, setIsTouch] = useState(false);
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      
      setScreenSize({ width, height });
      setIsMobile(width < 768);
      setIsTablet(width >= 768 && width < 1024);
      setIsTouch('ontouchstart' in window || navigator.maxTouchPoints > 0);
      setOrientation(width > height ? 'landscape' : 'portrait');
    };

    checkDevice();
    window.addEventListener('resize', checkDevice);
    window.addEventListener('orientationchange', checkDevice);

    return () => {
      window.removeEventListener('resize', checkDevice);
      window.removeEventListener('orientationchange', checkDevice);
    };
  }, []);

  return {
    isMobile,
    isTablet,
    isTouch,
    orientation,
    screenSize,
    isDesktop: !isMobile && !isTablet,
  };
};

// Touch-optimized button component
interface TouchButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = ({
  children,
  onClick,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className,
  icon,
  fullWidth = false,
  hapticFeedback = true,
}) => {
  const { isTouch } = useMobileDetection();
  const [isPressed, setIsPressed] = useState(false);

  const handleTouchStart = useCallback(() => {
    if (disabled) return;
    setIsPressed(true);
    
    // Haptic feedback for supported devices
    if (hapticFeedback && 'vibrate' in navigator) {
      navigator.vibrate(10);
    }
  }, [disabled, hapticFeedback]);

  const handleTouchEnd = useCallback(() => {
    setIsPressed(false);
  }, []);

  const handleClick = useCallback(() => {
    if (disabled) return;
    onClick?.();
  }, [disabled, onClick]);

  const baseClasses = `
    relative inline-flex items-center justify-center font-medium
    transition-all duration-200 ease-in-out focus:outline-none 
    disabled:opacity-50 disabled:cursor-not-allowed
    ${fullWidth ? 'w-full' : ''}
    ${isPressed ? 'scale-95' : 'scale-100'}
  `;

  const variantClasses = {
    primary: 'bg-primary-500 hover:bg-primary-600 text-white shadow-card hover:shadow-card-hover focus:ring-2 focus:ring-primary-200',
    secondary: 'bg-secondary-100 hover:bg-secondary-200 text-secondary-800 shadow-card hover:shadow-card-hover focus:ring-2 focus:ring-secondary-200',
    outline: 'border-2 border-primary-300 hover:border-primary-500 bg-white hover:bg-primary-50 text-primary-700 focus:ring-2 focus:ring-primary-200',
    ghost: 'text-secondary-600 hover:text-primary-600 hover:bg-primary-50 focus:ring-2 focus:ring-primary-200',
  };

  // Touch-optimized sizes (larger touch targets)
  const sizeClasses = {
    sm: isTouch ? 'px-4 py-3 text-sm rounded-xl min-h-[44px]' : 'px-3 py-2 text-sm rounded-lg',
    md: isTouch ? 'px-6 py-4 text-base rounded-xl min-h-[48px]' : 'px-4 py-2.5 text-sm rounded-xl',
    lg: isTouch ? 'px-8 py-5 text-lg rounded-2xl min-h-[52px]' : 'px-6 py-3 text-base rounded-xl',
  };

  return (
    <button
      onClick={handleClick}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={() => setIsPressed(true)}
      onMouseUp={() => setIsPressed(false)}
      onMouseLeave={() => setIsPressed(false)}
      disabled={disabled}
      className={clsx(
        baseClasses,
        variantClasses[variant],
        sizeClasses[size],
        className
      )}
    >
      {icon && <span className="mr-2">{icon}</span>}
      {children}
    </button>
  );
};

// Swipe gesture hook
interface SwipeHandlers {
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}

export const useSwipeGestures = (handlers: SwipeHandlers, threshold: number = 50) => {
  const touchStart = useRef<{ x: number; y: number } | null>(null);
  const touchEnd = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    touchEnd.current = null;
    touchStart.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    touchEnd.current = {
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    };
  }, []);

  const onTouchEnd = useCallback(() => {
    if (!touchStart.current || !touchEnd.current) return;

    const distanceX = touchStart.current.x - touchEnd.current.x;
    const distanceY = touchStart.current.y - touchEnd.current.y;
    const isLeftSwipe = distanceX > threshold;
    const isRightSwipe = distanceX < -threshold;
    const isUpSwipe = distanceY > threshold;
    const isDownSwipe = distanceY < -threshold;

    if (isLeftSwipe && Math.abs(distanceX) > Math.abs(distanceY)) {
      handlers.onSwipeLeft?.();
    } else if (isRightSwipe && Math.abs(distanceX) > Math.abs(distanceY)) {
      handlers.onSwipeRight?.();
    } else if (isUpSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      handlers.onSwipeUp?.();
    } else if (isDownSwipe && Math.abs(distanceY) > Math.abs(distanceX)) {
      handlers.onSwipeDown?.();
    }
  }, [handlers, threshold]);

  return {
    onTouchStart,
    onTouchMove,
    onTouchEnd,
  };
};

// Mobile-optimized input component
interface MobileInputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url';
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  disabled?: boolean;
  error?: string;
  label?: string;
  className?: string;
  autoComplete?: string;
  inputMode?: 'text' | 'decimal' | 'numeric' | 'tel' | 'search' | 'email' | 'url';
}

export const MobileInput: React.FC<MobileInputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onFocus,
  onBlur,
  disabled = false,
  error,
  label,
  className,
  autoComplete,
  inputMode,
}) => {
  const { isMobile } = useMobileDetection();
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
    onFocus?.();
  }, [onFocus]);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
    onBlur?.();
  }, [onBlur]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    onChange?.(e.target.value);
  }, [onChange]);

  return (
    <div className={clsx('space-y-2', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      
      <div className="relative">
        <input
          type={type}
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          inputMode={inputMode}
          className={clsx(
            'w-full border rounded-xl shadow-card transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary-500',
            // Mobile-optimized sizing
            isMobile ? 'px-4 py-4 text-base min-h-[48px]' : 'px-4 py-3 text-sm',
            error ? 'border-red-300 focus:ring-red-200 focus:border-red-500' : 'border-gray-300',
            disabled && 'bg-gray-50 cursor-not-allowed',
            isFocused && 'shadow-card-hover'
          )}
        />
        
        {error && (
          <div className="absolute -bottom-6 left-0 text-sm text-red-600">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

// Mobile-optimized modal component
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
  showCloseButton?: boolean;
  className?: string;
}

export const MobileModal: React.FC<MobileModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showCloseButton = true,
  className,
}) => {
  const { isMobile } = useMobileDetection();
  const swipeHandlers = useSwipeGestures({
    onSwipeDown: onClose,
  });

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: isMobile ? 'max-w-full h-auto max-h-[80vh]' : 'max-w-md',
    md: isMobile ? 'max-w-full h-auto max-h-[90vh]' : 'max-w-lg',
    lg: isMobile ? 'max-w-full h-auto max-h-[95vh]' : 'max-w-2xl',
    full: 'max-w-full h-full',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="flex min-h-full items-end justify-center p-4 text-center sm:items-center sm:p-0">
        <div
          {...(isMobile ? swipeHandlers : {})}
          className={clsx(
            'relative transform overflow-hidden rounded-t-2xl sm:rounded-2xl bg-white text-left shadow-floating transition-all',
            sizeClasses[size],
            isMobile && 'w-full',
            className
          )}
        >
          {/* Header */}
          {(title || showCloseButton) && (
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              {title && (
                <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
              )}
              
              {showCloseButton && (
                <TouchButton
                  variant="ghost"
                  size="sm"
                  onClick={onClose}
                  className="ml-auto"
                >
                  ✕
                </TouchButton>
              )}
            </div>
          )}
          
          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
            {children}
          </div>
          
          {/* Mobile swipe indicator */}
          {isMobile && (
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-1 bg-gray-300 rounded-full" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// Pull-to-refresh component
interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  threshold?: number;
  className?: string;
}

export const PullToRefresh: React.FC<PullToRefreshProps> = ({
  onRefresh,
  children,
  threshold = 80,
  className,
}) => {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0) {
      startY.current = e.touches[0].clientY;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (window.scrollY === 0 && startY.current > 0) {
      currentY.current = e.touches[0].clientY;
      const distance = Math.max(0, currentY.current - startY.current);
      
      if (distance > 0) {
        e.preventDefault();
        setPullDistance(distance);
        setCanRefresh(distance >= threshold);
      }
    }
  }, [threshold]);

  const handleTouchEnd = useCallback(async () => {
    if (canRefresh && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
      }
    }
    
    setPullDistance(0);
    setCanRefresh(false);
    startY.current = 0;
    currentY.current = 0;
  }, [canRefresh, isRefreshing, onRefresh]);

  const refreshProgress = Math.min(pullDistance / threshold, 1);

  return (
    <div
      className={clsx('relative', className)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Pull indicator */}
      {pullDistance > 0 && (
        <div 
          className="absolute top-0 left-0 right-0 flex items-center justify-center bg-primary-50 transition-all duration-200"
          style={{ 
            height: Math.min(pullDistance, threshold),
            transform: `translateY(-${Math.min(pullDistance, threshold)}px)`,
          }}
        >
          <div className="flex items-center space-x-2 text-primary-600">
            <div 
              className={clsx(
                'w-6 h-6 border-2 border-primary-600 rounded-full transition-transform duration-200',
                isRefreshing ? 'animate-spin border-t-transparent' : '',
                canRefresh ? 'rotate-180' : ''
              )}
              style={{
                transform: `rotate(${refreshProgress * 180}deg)`,
              }}
            >
              {!isRefreshing && (
                <div className="w-full h-full flex items-center justify-center">
                  ↓
                </div>
              )}
            </div>
            <span className="text-sm font-medium">
              {isRefreshing ? 'Refreshing...' : canRefresh ? 'Release to refresh' : 'Pull to refresh'}
            </span>
          </div>
        </div>
      )}
      
      {/* Content */}
      <div
        style={{
          transform: `translateY(${Math.min(pullDistance, threshold)}px)`,
          transition: pullDistance === 0 ? 'transform 0.3s ease-out' : 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
};

export default {
  useMobileDetection,
  TouchButton,
  useSwipeGestures,
  MobileInput,
  MobileModal,
  PullToRefresh,
};
