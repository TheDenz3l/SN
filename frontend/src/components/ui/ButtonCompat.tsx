/**
 * Button Compatibility Layer
 * Provides backward compatibility for existing button components
 * Allows gradual migration without breaking existing code
 */

import React from 'react';
import Button from './Button';

// IntuitiveButton compatibility wrapper
export interface IntuitiveButtonProps {
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

export const IntuitiveButton: React.FC<IntuitiveButtonProps> = (props) => {
  return <Button {...props} style="solid" />;
};

// ModernButton compatibility wrapper
export interface ModernButtonProps {
  children?: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  isLoading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  iconPosition?: 'left' | 'right';
  className?: string;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
}

export const ModernButton: React.FC<ModernButtonProps> = (props) => {
  return <Button {...props} style="gradient" />;
};

// TouchButton compatibility wrapper
export interface TouchButtonProps {
  children?: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
  hapticFeedback?: boolean;
}

export const TouchButton: React.FC<TouchButtonProps> = (props) => {
  return <Button {...props} style="solid" hapticFeedback={props.hapticFeedback ?? true} />;
};

// Export the unified Button as default
export default Button;
