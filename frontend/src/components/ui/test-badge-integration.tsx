/**
 * Badge Integration Test Component
 * Tests the unified Badge component and specialized variants
 */

import React from 'react';
import { SparklesIcon, CreditCardIcon } from '@heroicons/react/24/outline';
import { Badge, NavigationBadge, StatusBadge, CostBadge, TaskBadge } from './index';

const TestBadgeIntegration: React.FC = () => {
  const handleRemove = (badgeType: string) => {
    console.log(`Removed ${badgeType} badge`);
  };

  const handleClick = (badgeType: string) => {
    console.log(`Clicked ${badgeType} badge`);
  };

  return (
    <div className="p-8 space-y-8">
      <h1 className="text-2xl font-bold">Badge Component Integration Test</h1>
      
      {/* Unified Badge Tests */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Unified Badge Component</h2>
        <div className="space-y-4">
          
          {/* Basic variants */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Badge variant="primary">Primary</Badge>
              <Badge variant="secondary">Secondary</Badge>
              <Badge variant="success">Success</Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="error">Error</Badge>
              <Badge variant="info">Info</Badge>
              <Badge variant="neutral">Neutral</Badge>
            </div>
          </div>

          {/* Style modes */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Style Modes</h3>
            <div className="flex flex-wrap gap-2">
              <Badge style="filled" variant="primary">Filled</Badge>
              <Badge style="outline" variant="primary">Outline</Badge>
              <Badge style="subtle" variant="primary">Subtle</Badge>
              <Badge style="gradient" variant="primary">Gradient</Badge>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Sizes</h3>
            <div className="flex items-center gap-2">
              <Badge size="sm">Small</Badge>
              <Badge size="md">Medium</Badge>
              <Badge size="lg">Large</Badge>
            </div>
          </div>

          {/* With icons */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">With Icons</h3>
            <div className="flex flex-wrap gap-2">
              <Badge icon={<SparklesIcon />}>With Icon</Badge>
              <Badge icon={<CreditCardIcon />} iconPosition="right">Icon Right</Badge>
              <Badge icon={<SparklesIcon />} />
            </div>
          </div>

          {/* Interactive badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Interactive</h3>
            <div className="flex flex-wrap gap-2">
              <Badge onClick={() => handleClick('clickable')}>Clickable</Badge>
              <Badge removable onRemove={() => handleRemove('removable')}>Removable</Badge>
              <Badge 
                removable 
                onRemove={() => handleRemove('both')}
                onClick={() => handleClick('both')}
              >
                Both
              </Badge>
            </div>
          </div>

          {/* All style combinations */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Style Combinations</h3>
            <div className="grid grid-cols-4 gap-4">
              {['filled', 'outline', 'subtle', 'gradient'].map(style => (
                <div key={style} className="space-y-2">
                  <h4 className="text-sm font-medium capitalize">{style}</h4>
                  <div className="space-y-1">
                    {['primary', 'success', 'warning', 'error'].map(variant => (
                      <Badge 
                        key={`${style}-${variant}`}
                        style={style as any}
                        variant={variant as any}
                        size="sm"
                      >
                        {variant}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Specialized Badge Components */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Specialized Badge Components</h2>
        <div className="space-y-4">
          
          {/* Navigation Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Navigation Badges</h3>
            <div className="flex flex-wrap gap-2">
              <NavigationBadge type="default">New</NavigationBadge>
              <NavigationBadge type="premium">Pro</NavigationBadge>
              <NavigationBadge type="new">New Feature</NavigationBadge>
              <NavigationBadge type="beta">Beta</NavigationBadge>
            </div>
          </div>

          {/* Status Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Status Badges</h3>
            <div className="flex flex-wrap gap-2">
              <StatusBadge status="increase">+5.2%</StatusBadge>
              <StatusBadge status="decrease">-2.1%</StatusBadge>
              <StatusBadge status="neutral">0.0%</StatusBadge>
              <StatusBadge status="positive">Approved</StatusBadge>
              <StatusBadge status="negative">Rejected</StatusBadge>
            </div>
          </div>

          {/* Cost Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Cost Badges</h3>
            <div className="flex flex-wrap gap-2">
              <CostBadge type="free" icon={<SparklesIcon />}>Free</CostBadge>
              <CostBadge type="credits" icon={<CreditCardIcon />}>1 Credit</CostBadge>
              <CostBadge type="premium">Premium</CostBadge>
            </div>
          </div>

          {/* Task Badges */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Task Badges</h3>
            <div className="flex flex-wrap gap-2">
              <TaskBadge>ISP TASK</TaskBadge>
              <TaskBadge completed>COMPLETED</TaskBadge>
            </div>
          </div>
        </div>
      </section>

      {/* Real-world Examples */}
      <section>
        <h2 className="text-xl font-semibold mb-4">Real-world Examples</h2>
        <div className="space-y-4">
          
          {/* Navigation Item Example */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Navigation Item</h3>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <span>Dashboard</span>
              <div className="flex items-center space-x-2">
                <NavigationBadge type="new">New</NavigationBadge>
                <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
              </div>
            </div>
          </div>

          {/* Stats Card Example */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Stats Card</h3>
            <div className="p-4 bg-white border rounded-lg">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold">$12,345</p>
              <StatusBadge status="increase">+12.5% from last month</StatusBadge>
            </div>
          </div>

          {/* Action Card Example */}
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Action Card</h3>
            <div className="p-4 bg-white border rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-semibold">Generate Note</h4>
                  <p className="text-sm text-gray-600">Create AI-powered notes</p>
                </div>
                <CostBadge type="free" icon={<SparklesIcon />}>
                  Free (2/2 remaining)
                </CostBadge>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default TestBadgeIntegration;
