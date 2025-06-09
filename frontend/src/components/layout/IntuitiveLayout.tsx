import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../stores/authStore';
import { clsx } from 'clsx';
import {
  Bars3Icon,
  XMarkIcon,
  UserCircleIcon,
  ArrowRightOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from '@heroicons/react/24/outline';

// Import our intuitive components
import IntuitiveNavigation, { BrandLogo, QuickActions } from '../intuitive/IntuitiveNavigation';
import IntuitiveButton from '../intuitive/IntuitiveButton';

interface IntuitiveLayoutProps {
  children: React.ReactNode;
}

const IntuitiveLayout: React.FC<IntuitiveLayoutProps> = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, getUserDisplayName } = useAuthStore();

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
      signOut();
      navigate('/');
    }
  };

  const getPageTitle = () => {
    const path = location.pathname;
    switch (path) {
      case '/dashboard':
        return 'Dashboard';
      case '/generate':
        return 'Generate Notes';
      case '/notes':
        return 'My Notes';
      case '/setup':
        return 'Setup';
      case '/profile':
        return 'Profile & Settings';
      default:
        return 'SwiftNotes';
    }
  };

  const getUserInitials = () => {
    const name = getUserDisplayName();
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar overlay */}
      <div className={clsx(
        'fixed inset-0 z-50 lg:hidden',
        sidebarOpen ? 'block' : 'hidden'
      )}>
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 transition-opacity duration-300" 
          onClick={() => setSidebarOpen(false)} 
        />
        
        {/* Mobile sidebar */}
        <div className={clsx(
          'fixed inset-y-0 left-0 flex w-80 flex-col bg-white shadow-floating transition-transform duration-300',
          sidebarOpen ? 'transform translate-x-0' : 'transform -translate-x-full'
        )}>
          <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
            <BrandLogo />
            <IntuitiveButton
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(false)}
              icon={<XMarkIcon />}
            />
          </div>
          
          <div className="flex-1 flex flex-col p-6 space-y-6">
            <IntuitiveNavigation />
            <div className="border-t border-gray-200 pt-6">
              <QuickActions />
            </div>
          </div>
        </div>
      </div>

      {/* Desktop sidebar */}
      <div className={clsx(
        'hidden lg:fixed lg:inset-y-0 lg:flex lg:flex-col bg-white border-r border-gray-200 shadow-card transition-all duration-300',
        sidebarCollapsed ? 'lg:w-20' : 'lg:w-80'
      )}>
        {/* Sidebar header */}
        <div className="flex h-16 items-center justify-between px-6 border-b border-gray-200">
          <BrandLogo collapsed={sidebarCollapsed} />
          <IntuitiveButton
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            icon={sidebarCollapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            tooltip={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          />
        </div>
        
        {/* Sidebar content */}
        <div className="flex-1 flex flex-col p-6 space-y-6">
          <IntuitiveNavigation collapsed={sidebarCollapsed} />
          
          <div className="border-t border-gray-200 pt-6">
            <QuickActions collapsed={sidebarCollapsed} />
          </div>
          
          {/* User section */}
          <div className="mt-auto border-t border-gray-200 pt-6">
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className={clsx(
                  'flex items-center w-full px-3 py-2.5 text-sm font-medium rounded-xl transition-all duration-200',
                  'hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-primary-200 focus:ring-offset-2',
                  sidebarCollapsed ? 'justify-center' : 'justify-start'
                )}
              >
                <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm">
                  {getUserInitials()}
                </div>
                {!sidebarCollapsed && (
                  <div className="ml-3 flex-1 text-left">
                    <div className="font-medium text-gray-900">{getUserDisplayName()}</div>
                    <div className="text-xs text-gray-500">{user?.email}</div>
                  </div>
                )}
              </button>
              
              {/* User menu dropdown */}
              {userMenuOpen && (
                <div className={clsx(
                  'absolute bottom-full mb-2 bg-white rounded-xl shadow-elevated border border-gray-200 py-2 z-50',
                  sidebarCollapsed ? 'left-full ml-2 w-48' : 'left-0 right-0'
                )}>
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <UserCircleIcon className="w-4 h-4 mr-3" />
                    Profile & Settings
                  </button>
                  <button
                    onClick={handleLogout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <ArrowRightOnRectangleIcon className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className={clsx(
        'lg:pl-80 transition-all duration-300',
        sidebarCollapsed && 'lg:pl-20'
      )}>
        {/* Top header for mobile */}
        <div className="lg:hidden bg-white border-b border-gray-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <IntuitiveButton
                variant="ghost"
                size="sm"
                onClick={() => setSidebarOpen(true)}
                icon={<Bars3Icon />}
              />
              <h1 className="text-lg font-semibold text-gray-900">{getPageTitle()}</h1>
            </div>
            
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center text-primary-700 font-semibold text-sm"
            >
              {getUserInitials()}
            </button>
          </div>
        </div>

        {/* Page content */}
        <main className="p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default IntuitiveLayout;
