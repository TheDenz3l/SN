/**
 * Integration Test Component
 * Tests the unified Button component and backward compatibility
 */

import React from 'react';
import { PlusIcon } from '@heroicons/react/24/outline';
import { Button, IntuitiveButton, ModernButton, TouchButton } from './index';

const TestIntegration: React.FC = () => {
  const handleClick = () => {
    console.log('Button clicked!');
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Button Component Integration Test</h1>
      
      {/* Unified Button Tests */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Unified Button Component</h2>
        <div className="space-y-4">
          
          {/* Basic variants */}
          <div className="flex space-x-4">
            <Button variant="primary" onClick={handleClick}>Primary</Button>
            <Button variant="secondary" onClick={handleClick}>Secondary</Button>
            <Button variant="outline" onClick={handleClick}>Outline</Button>
            <Button variant="ghost" onClick={handleClick}>Ghost</Button>
            <Button variant="danger" onClick={handleClick}>Danger</Button>
            <Button variant="success" onClick={handleClick}>Success</Button>
          </div>

          {/* Style modes */}
          <div className="flex space-x-4">
            <Button style="solid" onClick={handleClick}>Solid</Button>
            <Button style="gradient" onClick={handleClick}>Gradient</Button>
            <Button style="minimal" onClick={handleClick}>Minimal</Button>
          </div>

          {/* Sizes */}
          <div className="flex items-center space-x-4">
            <Button size="sm" onClick={handleClick}>Small</Button>
            <Button size="md" onClick={handleClick}>Medium</Button>
            <Button size="lg" onClick={handleClick}>Large</Button>
            <Button size="xl" onClick={handleClick}>Extra Large</Button>
          </div>

          {/* With icons */}
          <div className="flex space-x-4">
            <Button icon={<PlusIcon />} onClick={handleClick}>With Icon</Button>
            <Button icon={<PlusIcon />} iconPosition="right" onClick={handleClick}>Icon Right</Button>
            <Button icon={<PlusIcon />} onClick={handleClick} />
          </div>

          {/* States */}
          <div className="flex space-x-4">
            <Button isLoading onClick={handleClick}>Loading</Button>
            <Button disabled onClick={handleClick}>Disabled</Button>
            <Button tooltip="This is a tooltip" onClick={handleClick}>With Tooltip</Button>
          </div>

          {/* Full width */}
          <Button fullWidth onClick={handleClick}>Full Width Button</Button>
        </div>
      </section>

      {/* Backward Compatibility Tests */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Backward Compatibility</h2>
        <div className="space-y-4">
          
          {/* IntuitiveButton compatibility */}
          <div className="flex space-x-4">
            <IntuitiveButton variant="primary" onClick={handleClick}>Intuitive Primary</IntuitiveButton>
            <IntuitiveButton variant="secondary" onClick={handleClick}>Intuitive Secondary</IntuitiveButton>
            <IntuitiveButton icon={<PlusIcon />} onClick={handleClick}>Intuitive with Icon</IntuitiveButton>
            <IntuitiveButton icon={<PlusIcon />} tooltip="Intuitive tooltip" onClick={handleClick} />
          </div>

          {/* ModernButton compatibility */}
          <div className="flex space-x-4">
            <ModernButton variant="primary" onClick={handleClick}>Modern Primary</ModernButton>
            <ModernButton variant="secondary" onClick={handleClick}>Modern Secondary</ModernButton>
            <ModernButton icon={<PlusIcon />} onClick={handleClick}>Modern with Icon</ModernButton>
          </div>

          {/* TouchButton compatibility */}
          <div className="flex space-x-4">
            <TouchButton variant="primary" onClick={handleClick}>Touch Primary</TouchButton>
            <TouchButton variant="secondary" onClick={handleClick}>Touch Secondary</TouchButton>
            <TouchButton icon={<PlusIcon />} onClick={handleClick}>Touch with Icon</TouchButton>
            <TouchButton icon={<PlusIcon />} hapticFeedback={true} onClick={handleClick} />
          </div>
        </div>
      </section>

      {/* Feature Tests */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Advanced Features</h2>
        <div className="space-y-4">
          
          {/* Mobile optimization */}
          <div className="flex space-x-4">
            <Button hapticFeedback={true} onClick={handleClick}>Haptic Feedback</Button>
            <Button hapticFeedback={false} onClick={handleClick}>No Haptic</Button>
          </div>

          {/* Accessibility */}
          <div className="flex space-x-4">
            <Button aria-label="Close dialog" onClick={handleClick}>×</Button>
            <Button data-testid="test-button" onClick={handleClick}>Test Button</Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestIntegration;
