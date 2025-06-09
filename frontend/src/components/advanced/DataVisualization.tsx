import React, { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { clsx } from 'clsx';
import IntuitiveCard from '../intuitive/IntuitiveCard';
import { useEnhancedAnimation } from './AnimationProvider';

// Color palettes for charts
const CHART_COLORS = {
  primary: ['#0ea5e9', '#0284c7', '#0369a1', '#075985', '#0c4a6e'],
  success: ['#10b981', '#059669', '#047857', '#065f46', '#064e3b'],
  warning: ['#f59e0b', '#d97706', '#b45309', '#92400e', '#78350f'],
  purple: ['#a855f7', '#9333ea', '#7c3aed', '#6d28d9', '#5b21b6'],
  gradient: ['#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7'],
};

interface ChartData {
  name: string;
  value: number;
  [key: string]: any;
}

interface ChartProps {
  data: ChartData[];
  title?: string;
  subtitle?: string;
  height?: number;
  className?: string;
  colorScheme?: keyof typeof CHART_COLORS;
  showLegend?: boolean;
  showGrid?: boolean;
  animate?: boolean;
}

// Custom Tooltip Component
const CustomTooltip: React.FC<{
  active?: boolean;
  payload?: any[];
  label?: string;
  formatter?: (value: any, name: string) => [string, string];
}> = ({ active, payload, label, formatter }) => {
  if (!active || !payload || !payload.length) return null;

  return (
    <div className="bg-white p-3 rounded-xl shadow-elevated border border-gray-200">
      <p className="font-medium text-gray-900 mb-2">{label}</p>
      {payload.map((entry, index) => (
        <div key={index} className="flex items-center space-x-2 text-sm">
          <div
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: entry.color }}
          />
          <span className="text-gray-600">{entry.name}:</span>
          <span className="font-medium text-gray-900">
            {formatter ? formatter(entry.value, entry.name)[0] : entry.value}
          </span>
        </div>
      ))}
    </div>
  );
};

// Enhanced Line Chart
export const EnhancedLineChart: React.FC<ChartProps & {
  dataKeys?: string[];
  strokeWidth?: number;
  showDots?: boolean;
}> = ({
  data,
  title,
  subtitle,
  height = 300,
  className,
  colorScheme = 'primary',
  showLegend = true,
  showGrid = true,
  animate = true,
  dataKeys = ['value'],
  strokeWidth = 2,
  showDots = true,
}) => {
  const { shouldAnimate, getAnimationDuration } = useEnhancedAnimation();
  const colors = CHART_COLORS[colorScheme];

  const animationProps = shouldAnimate() && animate ? {
    animationDuration: getAnimationDuration(1000),
    animationBegin: 0,
  } : { isAnimationActive: false };

  return (
    <IntuitiveCard variant="default" padding="lg" className={className}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          {dataKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={colors[index % colors.length]}
              strokeWidth={strokeWidth}
              dot={showDots ? { fill: colors[index % colors.length], strokeWidth: 2, r: 4 } : false}
              activeDot={{ r: 6, stroke: colors[index % colors.length], strokeWidth: 2 }}
              {...animationProps}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </IntuitiveCard>
  );
};

// Enhanced Bar Chart
export const EnhancedBarChart: React.FC<ChartProps & {
  dataKeys?: string[];
  barSize?: number;
  layout?: 'horizontal' | 'vertical';
}> = ({
  data,
  title,
  subtitle,
  height = 300,
  className,
  colorScheme = 'primary',
  showLegend = true,
  showGrid = true,
  animate = true,
  dataKeys = ['value'],
  barSize = 30,
  layout = 'vertical',
}) => {
  const { shouldAnimate, getAnimationDuration } = useEnhancedAnimation();
  const colors = CHART_COLORS[colorScheme];

  const animationProps = shouldAnimate() && animate ? {
    animationDuration: getAnimationDuration(1000),
    animationBegin: 0,
  } : { isAnimationActive: false };

  return (
    <IntuitiveCard variant="default" padding="lg" className={className}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart 
          data={data} 
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          layout={layout}
        >
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          {dataKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={colors[index % colors.length]}
              radius={[4, 4, 0, 0]}
              maxBarSize={barSize}
              {...animationProps}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </IntuitiveCard>
  );
};

// Enhanced Area Chart
export const EnhancedAreaChart: React.FC<ChartProps & {
  dataKeys?: string[];
  fillOpacity?: number;
  stackId?: string;
}> = ({
  data,
  title,
  subtitle,
  height = 300,
  className,
  colorScheme = 'gradient',
  showLegend = true,
  showGrid = true,
  animate = true,
  dataKeys = ['value'],
  fillOpacity = 0.6,
  stackId,
}) => {
  const { shouldAnimate, getAnimationDuration } = useEnhancedAnimation();
  const colors = CHART_COLORS[colorScheme];

  const animationProps = shouldAnimate() && animate ? {
    animationDuration: getAnimationDuration(1000),
    animationBegin: 0,
  } : { isAnimationActive: false };

  return (
    <IntuitiveCard variant="default" padding="lg" className={className}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <AreaChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />}
          <XAxis 
            dataKey="name" 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <YAxis 
            stroke="#64748b"
            fontSize={12}
            tickLine={false}
            axisLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
          
          {dataKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stackId={stackId}
              stroke={colors[index % colors.length]}
              fill={colors[index % colors.length]}
              fillOpacity={fillOpacity}
              strokeWidth={2}
              {...animationProps}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </IntuitiveCard>
  );
};

// Enhanced Pie Chart
export const EnhancedPieChart: React.FC<ChartProps & {
  innerRadius?: number;
  outerRadius?: number;
  showLabels?: boolean;
  labelFormatter?: (entry: any) => string;
}> = ({
  data,
  title,
  subtitle,
  height = 300,
  className,
  colorScheme = 'primary',
  showLegend = true,
  animate = true,
  innerRadius = 0,
  outerRadius = 80,
  showLabels = true,
  labelFormatter,
}) => {
  const { shouldAnimate, getAnimationDuration } = useEnhancedAnimation();
  const colors = CHART_COLORS[colorScheme];

  const animationProps = shouldAnimate() && animate ? {
    animationDuration: getAnimationDuration(1000),
    animationBegin: 0,
  } : { isAnimationActive: false };

  const renderLabel = (entry: any) => {
    if (!showLabels) return '';
    if (labelFormatter) return labelFormatter(entry);
    return `${entry.name}: ${entry.value}`;
  };

  return (
    <IntuitiveCard variant="default" padding="lg" className={className}>
      {(title || subtitle) && (
        <div className="mb-6">
          {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
          {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <ResponsiveContainer width="100%" height={height}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={outerRadius}
            innerRadius={innerRadius}
            fill="#8884d8"
            dataKey="value"
            {...animationProps}
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}
        </PieChart>
      </ResponsiveContainer>
    </IntuitiveCard>
  );
};

// Chart utilities
export const formatChartData = (
  rawData: any[],
  nameKey: string,
  valueKey: string | string[],
  nameFormatter?: (name: any) => string,
  valueFormatter?: (value: any) => number
): ChartData[] => {
  return rawData.map(item => {
    const result: ChartData = {
      name: nameFormatter ? nameFormatter(item[nameKey]) : item[nameKey],
      value: 0,
    };

    if (Array.isArray(valueKey)) {
      valueKey.forEach(key => {
        result[key] = valueFormatter ? valueFormatter(item[key]) : item[key];
      });
      result.value = valueFormatter ? valueFormatter(item[valueKey[0]]) : item[valueKey[0]];
    } else {
      result.value = valueFormatter ? valueFormatter(item[valueKey]) : item[valueKey];
    }

    return result;
  });
};

export const generateTimeSeriesData = (
  days: number,
  baseValue: number = 100,
  variance: number = 20
): ChartData[] => {
  const data: ChartData[] = [];
  const now = new Date();

  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    
    data.push({
      name: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      value: Math.round(baseValue + (Math.random() - 0.5) * variance * 2),
      date: date.toISOString(),
    });
  }

  return data;
};

export default {
  EnhancedLineChart,
  EnhancedBarChart,
  EnhancedAreaChart,
  EnhancedPieChart,
  formatChartData,
  generateTimeSeriesData,
};
