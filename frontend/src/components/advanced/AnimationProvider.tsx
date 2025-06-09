import React, { createContext, useContext, useState, useEffect } from 'react';

interface AnimationContextType {
  prefersReducedMotion: boolean;
  animationSpeed: 'slow' | 'normal' | 'fast';
  enableMicroInteractions: boolean;
  enablePageTransitions: boolean;
  setAnimationSpeed: (speed: 'slow' | 'normal' | 'fast') => void;
  setEnableMicroInteractions: (enable: boolean) => void;
  setEnablePageTransitions: (enable: boolean) => void;
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export const useAnimation = () => {
  const context = useContext(AnimationContext);
  if (!context) {
    throw new Error('useAnimation must be used within an AnimationProvider');
  }
  return context;
};

interface AnimationProviderProps {
  children: React.ReactNode;
}

export const AnimationProvider: React.FC<AnimationProviderProps> = ({ children }) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);
  const [animationSpeed, setAnimationSpeed] = useState<'slow' | 'normal' | 'fast'>('normal');
  const [enableMicroInteractions, setEnableMicroInteractions] = useState(true);
  const [enablePageTransitions, setEnablePageTransitions] = useState(true);

  // Detect user's motion preferences
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
      if (e.matches) {
        setEnableMicroInteractions(false);
        setEnablePageTransitions(false);
      }
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // Load preferences from localStorage
  useEffect(() => {
    const savedSpeed = localStorage.getItem('swiftnotes-animation-speed') as 'slow' | 'normal' | 'fast';
    const savedMicroInteractions = localStorage.getItem('swiftnotes-micro-interactions') === 'true';
    const savedPageTransitions = localStorage.getItem('swiftnotes-page-transitions') === 'true';

    if (savedSpeed) setAnimationSpeed(savedSpeed);
    if (savedMicroInteractions !== null) setEnableMicroInteractions(savedMicroInteractions);
    if (savedPageTransitions !== null) setEnablePageTransitions(savedPageTransitions);
  }, []);

  // Save preferences to localStorage
  useEffect(() => {
    localStorage.setItem('swiftnotes-animation-speed', animationSpeed);
    localStorage.setItem('swiftnotes-micro-interactions', enableMicroInteractions.toString());
    localStorage.setItem('swiftnotes-page-transitions', enablePageTransitions.toString());
  }, [animationSpeed, enableMicroInteractions, enablePageTransitions]);

  // Apply CSS custom properties for animation timing
  useEffect(() => {
    const root = document.documentElement;
    
    const speedMultipliers = {
      slow: 1.5,
      normal: 1,
      fast: 0.7,
    };

    const multiplier = prefersReducedMotion ? 0 : speedMultipliers[animationSpeed];
    
    root.style.setProperty('--animation-speed-multiplier', multiplier.toString());
    root.style.setProperty('--micro-interactions-enabled', enableMicroInteractions ? '1' : '0');
    root.style.setProperty('--page-transitions-enabled', enablePageTransitions ? '1' : '0');
  }, [prefersReducedMotion, animationSpeed, enableMicroInteractions, enablePageTransitions]);

  const value: AnimationContextType = {
    prefersReducedMotion,
    animationSpeed,
    enableMicroInteractions,
    enablePageTransitions,
    setAnimationSpeed,
    setEnableMicroInteractions,
    setEnablePageTransitions,
  };

  return (
    <AnimationContext.Provider value={value}>
      {children}
    </AnimationContext.Provider>
  );
};

// Enhanced animation hook with performance optimization
export const useEnhancedAnimation = () => {
  const { prefersReducedMotion, animationSpeed, enableMicroInteractions } = useAnimation();
  
  const getAnimationDuration = (baseDuration: number) => {
    if (prefersReducedMotion) return 0;
    
    const speedMultipliers = {
      slow: 1.5,
      normal: 1,
      fast: 0.7,
    };
    
    return baseDuration * speedMultipliers[animationSpeed];
  };

  const getAnimationDelay = (baseDelay: number) => {
    if (prefersReducedMotion) return 0;
    return baseDelay;
  };

  const shouldAnimate = (type: 'micro' | 'page' | 'general' = 'general') => {
    if (prefersReducedMotion) return false;
    
    switch (type) {
      case 'micro':
        return enableMicroInteractions;
      case 'page':
        return true; // Page animations are always enabled unless reduced motion
      default:
        return true;
    }
  };

  return {
    getAnimationDuration,
    getAnimationDelay,
    shouldAnimate,
    prefersReducedMotion,
  };
};

// Animation utility components
export const FadeIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 300, className = '' }) => {
  const { getAnimationDuration, getAnimationDelay, shouldAnimate } = useEnhancedAnimation();
  
  if (!shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`animate-fade-in ${className}`}
      style={{
        animationDuration: `${getAnimationDuration(duration)}ms`,
        animationDelay: `${getAnimationDelay(delay)}ms`,
      }}
    >
      {children}
    </div>
  );
};

export const SlideUp: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 300, className = '' }) => {
  const { getAnimationDuration, getAnimationDelay, shouldAnimate } = useEnhancedAnimation();
  
  if (!shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`animate-slide-up ${className}`}
      style={{
        animationDuration: `${getAnimationDuration(duration)}ms`,
        animationDelay: `${getAnimationDelay(delay)}ms`,
      }}
    >
      {children}
    </div>
  );
};

export const ScaleIn: React.FC<{
  children: React.ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}> = ({ children, delay = 0, duration = 300, className = '' }) => {
  const { getAnimationDuration, getAnimationDelay, shouldAnimate } = useEnhancedAnimation();
  
  if (!shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div
      className={`animate-scale-in ${className}`}
      style={{
        animationDuration: `${getAnimationDuration(duration)}ms`,
        animationDelay: `${getAnimationDelay(delay)}ms`,
      }}
    >
      {children}
    </div>
  );
};

// Staggered animation component for lists
export const StaggeredList: React.FC<{
  children: React.ReactNode[];
  staggerDelay?: number;
  className?: string;
}> = ({ children, staggerDelay = 100, className = '' }) => {
  const { shouldAnimate } = useEnhancedAnimation();
  
  if (!shouldAnimate()) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={className}>
      {React.Children.map(children, (child, index) => (
        <FadeIn delay={index * staggerDelay} key={index}>
          {child}
        </FadeIn>
      ))}
    </div>
  );
};

// Micro-interaction wrapper
export const MicroInteraction: React.FC<{
  children: React.ReactNode;
  type: 'hover' | 'focus' | 'active' | 'pulse';
  className?: string;
}> = ({ children, type, className = '' }) => {
  const { shouldAnimate } = useEnhancedAnimation();
  
  const microInteractionClasses = {
    hover: shouldAnimate('micro') ? 'hover:scale-[1.02] hover:shadow-card-hover transition-all duration-200' : '',
    focus: shouldAnimate('micro') ? 'focus:scale-[1.01] focus:shadow-glow transition-all duration-200' : '',
    active: shouldAnimate('micro') ? 'active:scale-[0.98] transition-all duration-100' : '',
    pulse: shouldAnimate('micro') ? 'animate-pulse-slow' : '',
  };

  return (
    <div className={`${microInteractionClasses[type]} ${className}`}>
      {children}
    </div>
  );
};

export default AnimationProvider;
