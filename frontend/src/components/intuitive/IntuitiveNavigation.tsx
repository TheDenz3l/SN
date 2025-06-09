import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { clsx } from 'clsx';
import {
  HomeIcon,
  PlusIcon,
  CogIcon,
  ChartBarIcon,
  DocumentTextIcon,
  UserIcon,
} from '@heroicons/react/24/outline';

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  description: string;
  badge?: string;
  premium?: boolean;
}

interface IntuitiveNavigationProps {
  className?: string;
  collapsed?: boolean;
}

const IntuitiveNavigation: React.FC<IntuitiveNavigationProps> = ({ 
  className,
  collapsed = false 
}) => {
  const location = useLocation();

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: HomeIcon,
      description: 'Overview & analytics',
    },
    {
      name: 'Generate Notes',
      href: '/generate',
      icon: PlusIcon,
      description: 'AI-powered note creation',
      badge: 'New',
    },
    {
      name: 'Notes History',
      href: '/notes',
      icon: DocumentTextIcon,
      description: 'View & manage all notes',
      badge: 'Popular',
    },
    {
      name: 'Analytics',
      href: '/analytics',
      icon: ChartBarIcon,
      description: 'Writing insights',
      premium: true,
    },
    {
      name: 'Setup',
      href: '/setup',
      icon: CogIcon,
      description: 'Configure your account',
    },
    {
      name: 'Profile',
      href: '/profile',
      icon: UserIcon,
      description: 'Manage your profile',
    },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <nav className={clsx('space-y-2', className)}>
      {navigation.map((item) => {
        const Icon = item.icon;
        const active = isActive(item.href);
        
        return (
          <div key={item.name} className="group relative">
            <Link
              to={item.href}
              className={clsx(
                'flex items-center px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                'hover:bg-primary-50 hover:text-primary-700',
                'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2',
                active
                  ? 'bg-primary-100 text-primary-700 shadow-sm border border-primary-200'
                  : 'text-gray-600 hover:text-gray-900',
                collapsed ? 'justify-center' : 'justify-start'
              )}
            >
              <Icon 
                className={clsx(
                  'flex-shrink-0 w-5 h-5',
                  active ? 'text-primary-600' : 'text-gray-400 group-hover:text-primary-500',
                  !collapsed && 'mr-3'
                )} 
              />
              
              {!collapsed && (
                <>
                  <span className="flex-1">{item.name}</span>
                  
                  {/* Badges and indicators */}
                  <div className="flex items-center space-x-2">
                    {item.badge && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {item.badge}
                      </span>
                    )}
                    
                    {item.premium && (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                        Pro
                      </span>
                    )}
                    
                    {active && (
                      <div className="w-2 h-2 bg-primary-500 rounded-full"></div>
                    )}
                  </div>
                </>
              )}
            </Link>
            
            {/* Tooltip for collapsed state */}
            {collapsed && (
              <div className="absolute left-full top-1/2 transform -translate-y-1/2 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50">
                <div className="font-medium">{item.name}</div>
                <div className="text-xs text-gray-300">{item.description}</div>
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
            
            {/* Description for expanded state */}
            {!collapsed && !active && (
              <div className="absolute left-full top-0 ml-2 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap z-50 delay-500">
                {item.description}
                <div className="absolute right-full top-1/2 transform -translate-y-1/2 border-4 border-transparent border-r-gray-900"></div>
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
};

// Brand Logo Component
export const BrandLogo: React.FC<{ 
  collapsed?: boolean; 
  className?: string;
}> = ({ collapsed = false, className }) => {
  return (
    <Link 
      to="/dashboard" 
      className={clsx(
        'flex items-center px-3 py-4 transition-all duration-200',
        'hover:bg-primary-50 rounded-xl',
        'focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2',
        className
      )}
    >
      <img
        src="/assets/logo-transparent.png"
        alt="SwiftNotes Logo"
        className="h-12 w-12 flex-shrink-0 hover:scale-105 transition-transform duration-200"
      />
      {!collapsed && (
        <div className="ml-3">
          <span className="text-xl font-bold text-gray-900">SwiftNotes</span>
          <div className="text-xs text-gray-500 font-medium">AI-Powered Notes</div>
        </div>
      )}
    </Link>
  );
};

// Quick Actions Component
export const QuickActions: React.FC<{ collapsed?: boolean }> = ({ collapsed = false }) => {
  const quickActions = [
    {
      name: 'New Note',
      href: '/generate',
      icon: PlusIcon,
      color: 'bg-primary-500 hover:bg-primary-600',
    },
  ];

  if (collapsed) {
    return (
      <div className="space-y-2">
        {quickActions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.name}
              to={action.href}
              className={clsx(
                'flex items-center justify-center w-10 h-10 rounded-xl text-white transition-all duration-200',
                'hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-200',
                action.color
              )}
            >
              <Icon className="w-5 h-5" />
            </Link>
          );
        })}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {quickActions.map((action) => {
        const Icon = action.icon;
        return (
          <Link
            key={action.name}
            to={action.href}
            className={clsx(
              'flex items-center px-4 py-3 rounded-xl text-white font-medium transition-all duration-200',
              'hover:scale-[1.02] active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-200',
              action.color
            )}
          >
            <Icon className="w-5 h-5 mr-3" />
            {action.name}
          </Link>
        );
      })}
    </div>
  );
};

export default IntuitiveNavigation;
