import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
  memo,
  lazy,
  Suspense,
  type ComponentType
} from 'react';
import { clsx } from 'clsx';

// Intersection Observer hook for lazy loading
export const useIntersectionObserver = (
  options: IntersectionObserverInit = {}
) => {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasIntersected, setHasIntersected] = useState(false);
  const elementRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsIntersecting(entry.isIntersecting);
        if (entry.isIntersecting && !hasIntersected) {
          setHasIntersected(true);
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [hasIntersected, options]);

  return {
    elementRef,
    isIntersecting,
    hasIntersected,
  };
};

// Lazy loading component wrapper
interface LazyComponentProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  className?: string;
  threshold?: number;
  rootMargin?: string;
}

export const LazyComponent: React.FC<LazyComponentProps> = ({
  children,
  fallback = <div className="animate-pulse bg-gray-200 rounded h-32" />,
  className,
  threshold = 0.1,
  rootMargin = '50px',
}) => {
  const { elementRef, hasIntersected } = useIntersectionObserver({
    threshold,
    rootMargin,
  });

  return (
    <div ref={elementRef} className={className}>
      {hasIntersected ? children : fallback}
    </div>
  );
};

// Debounced input hook
export const useDebounce = <T,>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Throttled function hook
export const useThrottle = <T extends (...args: any[]) => any>(
  func: T,
  delay: number
): T => {
  const lastRan = useRef<number>(0);
  const timeoutRef = useRef<NodeJS.Timeout>();

  return useCallback(
    ((...args: Parameters<T>) => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      const now = Date.now();
      if (now - lastRan.current >= delay) {
        func(...args);
        lastRan.current = now;
      } else {
        timeoutRef.current = setTimeout(() => {
          func(...args);
          lastRan.current = Date.now();
        }, delay - (now - lastRan.current));
      }
    }) as T,
    [func, delay]
  );
};

// Virtual scrolling hook for large lists
interface VirtualScrollOptions {
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export const useVirtualScroll = <T,>(
  items: T[],
  options: VirtualScrollOptions
) => {
  const [scrollTop, setScrollTop] = useState(0);
  const { itemHeight, containerHeight, overscan = 5 } = options;

  const visibleStart = Math.floor(scrollTop / itemHeight);
  const visibleEnd = Math.min(
    visibleStart + Math.ceil(containerHeight / itemHeight),
    items.length - 1
  );

  const startIndex = Math.max(0, visibleStart - overscan);
  const endIndex = Math.min(items.length - 1, visibleEnd + overscan);

  const visibleItems = useMemo(() => {
    return items.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
    }));
  }, [items, startIndex, endIndex]);

  const totalHeight = items.length * itemHeight;
  const offsetY = startIndex * itemHeight;

  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    offsetY,
    handleScroll,
  };
};

// Virtual list component
interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  height: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  className?: string;
  overscan?: number;
}

export const VirtualList = memo(<T,>({
  items,
  itemHeight,
  height,
  renderItem,
  className,
  overscan = 5,
}: VirtualListProps<T>) => {
  const { visibleItems, totalHeight, offsetY, handleScroll } = useVirtualScroll(
    items,
    { itemHeight, containerHeight: height, overscan }
  );

  return (
    <div
      className={clsx('overflow-auto', className)}
      style={{ height }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map(({ item, index }) => (
            <div
              key={index}
              style={{ height: itemHeight }}
              className="flex items-center"
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}) as <T>(props: VirtualListProps<T>) => JSX.Element;

// Image lazy loading component
interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
  placeholder?: string;
  onLoad?: () => void;
  onError?: () => void;
}

export const LazyImage: React.FC<LazyImageProps> = ({
  src,
  alt,
  className,
  placeholder = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZGRkIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtc2l6ZT0iMTgiIHRleHQtYW5jaG9yPSJtaWRkbGUiIGR5PSIuM2VtIiBmaWxsPSIjOTk5Ij5Mb2FkaW5nLi4uPC90ZXh0Pjwvc3ZnPg==',
  onLoad,
  onError,
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  const { elementRef, hasIntersected } = useIntersectionObserver();

  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onLoad?.();
  }, [onLoad]);

  const handleError = useCallback(() => {
    setHasError(true);
    onError?.();
  }, [onError]);

  return (
    <div ref={elementRef} className={clsx('relative overflow-hidden', className)}>
      {!hasIntersected ? (
        <img
          src={placeholder}
          alt=""
          className="w-full h-full object-cover"
          aria-hidden="true"
        />
      ) : (
        <>
          {!isLoaded && !hasError && (
            <img
              src={placeholder}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              aria-hidden="true"
            />
          )}
          <img
            src={src}
            alt={alt}
            onLoad={handleLoad}
            onError={handleError}
            className={clsx(
              'w-full h-full object-cover transition-opacity duration-300',
              isLoaded ? 'opacity-100' : 'opacity-0'
            )}
          />
          {hasError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-100 text-gray-500">
              Failed to load image
            </div>
          )}
        </>
      )}
    </div>
  );
};

// Memoized component wrapper
export const withMemo = <P extends object>(
  Component: ComponentType<P>,
  areEqual?: (prevProps: P, nextProps: P) => boolean
) => {
  return memo(Component, areEqual);
};

// Performance monitoring hook
export const usePerformanceMonitor = (name: string) => {
  const startTime = useRef<number>(0);

  useEffect(() => {
    startTime.current = performance.now();
    
    return () => {
      const endTime = performance.now();
      const duration = endTime - startTime.current;
      
      if (duration > 16) { // More than one frame at 60fps
        console.warn(`Performance warning: ${name} took ${duration.toFixed(2)}ms`);
      }
      
      // Mark performance for DevTools
      if (performance.mark) {
        performance.mark(`${name}-end`);
        performance.measure(name, `${name}-start`, `${name}-end`);
      }
    };
  }, [name]);

  useEffect(() => {
    if (performance.mark) {
      performance.mark(`${name}-start`);
    }
  }, [name]);
};

// Code splitting utility
export const createLazyComponent = <T extends ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ReactNode
) => {
  const LazyComponent = lazy(importFunc);
  
  return (props: React.ComponentProps<T>) => (
    <Suspense fallback={fallback || <div className="animate-pulse bg-gray-200 rounded h-32" />}>
      <LazyComponent {...props} />
    </Suspense>
  );
};

// Bundle size analyzer (development only)
export const useBundleAnalyzer = () => {
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      const analyzeBundle = async () => {
        try {
          const modules = await import.meta.glob('../**/*.{ts,tsx,js,jsx}');
          const moduleCount = Object.keys(modules).length;
          console.log(`Bundle contains ${moduleCount} modules`);
        } catch (error) {
          console.warn('Bundle analysis failed:', error);
        }
      };
      
      analyzeBundle();
    }
  }, []);
};

// Memory usage monitor
export const useMemoryMonitor = (interval: number = 5000) => {
  const [memoryInfo, setMemoryInfo] = useState<{
    usedJSHeapSize?: number;
    totalJSHeapSize?: number;
    jsHeapSizeLimit?: number;
  }>({});

  useEffect(() => {
    if (!('memory' in performance)) return;

    const updateMemoryInfo = () => {
      const memory = (performance as any).memory;
      setMemoryInfo({
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit,
      });
    };

    updateMemoryInfo();
    const intervalId = setInterval(updateMemoryInfo, interval);

    return () => clearInterval(intervalId);
  }, [interval]);

  return memoryInfo;
};

// Optimized list component with windowing
interface OptimizedListProps<T> {
  items: T[];
  renderItem: (item: T, index: number) => React.ReactNode;
  itemHeight?: number;
  maxHeight?: number;
  className?: string;
  emptyMessage?: string;
}

export const OptimizedList = memo(<T,>({
  items,
  renderItem,
  itemHeight = 60,
  maxHeight = 400,
  className,
  emptyMessage = 'No items to display',
}: OptimizedListProps<T>) => {
  if (items.length === 0) {
    return (
      <div className={clsx('flex items-center justify-center py-8 text-gray-500', className)}>
        {emptyMessage}
      </div>
    );
  }

  // Use virtual scrolling for large lists
  if (items.length > 50) {
    return (
      <VirtualList
        items={items}
        itemHeight={itemHeight}
        height={maxHeight}
        renderItem={renderItem}
        className={className}
      />
    );
  }

  // Regular rendering for small lists
  return (
    <div className={clsx('space-y-2', className)} style={{ maxHeight }}>
      {items.map((item, index) => (
        <div key={index}>
          {renderItem(item, index)}
        </div>
      ))}
    </div>
  );
}) as <T>(props: OptimizedListProps<T>) => JSX.Element;

export default {
  useIntersectionObserver,
  LazyComponent,
  useDebounce,
  useThrottle,
  useVirtualScroll,
  VirtualList,
  LazyImage,
  withMemo,
  usePerformanceMonitor,
  createLazyComponent,
  useBundleAnalyzer,
  useMemoryMonitor,
  OptimizedList,
};
