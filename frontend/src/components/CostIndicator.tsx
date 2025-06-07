import React, { useState } from 'react';
import { InformationCircleIcon, CreditCardIcon, SparklesIcon } from '@heroicons/react/24/outline';

interface CostIndicatorProps {
  cost: number | string;
  type: 'credits' | 'free';
  remaining?: number;
  total?: number;
  tooltip?: string;
  className?: string;
}

const CostIndicator: React.FC<CostIndicatorProps> = ({
  cost,
  type,
  remaining,
  total,
  tooltip,
  className = ''
}) => {
  const [showTooltip, setShowTooltip] = useState(false);

  const getDisplayText = () => {
    if (type === 'free' && remaining !== undefined && total !== undefined) {
      return `Free (${remaining}/${total} remaining)`;
    }
    if (type === 'credits') {
      return `${cost} credit${cost !== 1 ? 's' : ''}`;
    }
    return cost.toString();
  };

  const getIcon = () => {
    if (type === 'free') {
      return <SparklesIcon className="h-4 w-4" />;
    }
    return <CreditCardIcon className="h-4 w-4" />;
  };

  const getColorClasses = () => {
    if (type === 'free') {
      return 'text-green-600 bg-green-50 border-green-200';
    }
    return 'text-blue-600 bg-blue-50 border-blue-200';
  };

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <div
        className={`inline-flex items-center space-x-1 px-2 py-1 rounded-md border text-xs font-medium ${getColorClasses()}`}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        {getIcon()}
        <span>{getDisplayText()}</span>
        {tooltip && (
          <InformationCircleIcon className="h-3 w-3 ml-1 opacity-70" />
        )}
      </div>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 z-50">
          <div className="bg-gray-900 text-white text-xs rounded-lg py-2 px-3 max-w-xs whitespace-normal shadow-lg">
            <div className="text-center">{tooltip}</div>
            {/* Arrow */}
            <div className="absolute top-full left-1/2 transform -translate-x-1/2">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CostIndicator;
