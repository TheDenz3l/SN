/**
 * Auto-resizing textarea component that adjusts height based on content
 * Perfect for ISP task inputs and other dynamic text fields
 */

import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';

interface AutoResizeTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  minRows?: number;
  maxRows?: number;
  onHeightChange?: (height: number) => void;
}

const AutoResizeTextarea = forwardRef<HTMLTextAreaElement, AutoResizeTextareaProps>(
  ({ minRows = 1, maxRows = 10, onHeightChange, className = '', ...props }, ref) => {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    // Expose the textarea ref to parent components
    useImperativeHandle(ref, () => textareaRef.current!, []);

    const adjustHeight = () => {
      const textarea = textareaRef.current;
      if (!textarea) return;

      // Reset height to auto to get the correct scrollHeight
      textarea.style.height = 'auto';
      
      // Calculate line height
      const computedStyle = window.getComputedStyle(textarea);
      const lineHeight = parseInt(computedStyle.lineHeight) || 20;
      const paddingTop = parseInt(computedStyle.paddingTop) || 0;
      const paddingBottom = parseInt(computedStyle.paddingBottom) || 0;
      const borderTop = parseInt(computedStyle.borderTopWidth) || 0;
      const borderBottom = parseInt(computedStyle.borderBottomWidth) || 0;
      
      // Calculate min and max heights
      const minHeight = (lineHeight * minRows) + paddingTop + paddingBottom + borderTop + borderBottom;
      const maxHeight = (lineHeight * maxRows) + paddingTop + paddingBottom + borderTop + borderBottom;
      
      // Get the scroll height and constrain it
      let newHeight = Math.max(minHeight, textarea.scrollHeight);
      newHeight = Math.min(newHeight, maxHeight);
      
      // Apply the new height
      textarea.style.height = `${newHeight}px`;
      
      // Enable/disable scrolling based on whether we've hit the max height
      textarea.style.overflowY = newHeight >= maxHeight ? 'auto' : 'hidden';
      
      // Notify parent of height change
      if (onHeightChange) {
        onHeightChange(newHeight);
      }
    };

    // Adjust height when content changes
    useEffect(() => {
      adjustHeight();
    }, [props.value, minRows, maxRows]);

    // Adjust height on input
    const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (props.onInput) {
        props.onInput(e);
      }
    };

    // Adjust height on change
    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      adjustHeight();
      if (props.onChange) {
        props.onChange(e);
      }
    };

    // Initial height adjustment
    useEffect(() => {
      // Small delay to ensure the textarea is rendered
      const timer = setTimeout(adjustHeight, 0);
      return () => clearTimeout(timer);
    }, []);

    return (
      <textarea
        {...props}
        ref={textareaRef}
        className={`auto-resize-textarea ${className}`}
        onInput={handleInput}
        onChange={handleChange}
        style={{
          minHeight: `${(parseInt(window.getComputedStyle(document.body).lineHeight) || 20) * minRows}px`,
          ...props.style,
        }}
      />
    );
  }
);

AutoResizeTextarea.displayName = 'AutoResizeTextarea';

export default AutoResizeTextarea;
