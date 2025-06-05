import React from 'react';
import { Link } from 'react-router-dom';
import { DocumentTextIcon } from '@heroicons/react/24/outline';

interface AuthLayoutProps {
  children: React.ReactNode;
}

const AuthLayout: React.FC<AuthLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        {/* Logo */}
        <Link to="/" className="flex justify-center items-center">
          <DocumentTextIcon className="h-12 w-12 text-blue-600" />
          <span className="ml-3 text-2xl font-bold text-gray-900">SwiftNotes</span>
        </Link>
        
        {/* Tagline */}
        <p className="mt-4 text-center text-sm text-gray-600">
          AI-powered professional note generation for healthcare professionals
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-lg sm:rounded-lg sm:px-10 border border-gray-200">
          {children}
        </div>
        
        {/* Footer links */}
        <div className="mt-6 text-center">
          <div className="flex justify-center space-x-6 text-sm text-gray-500">
            <Link to="/privacy" className="hover:text-gray-700">
              Privacy Policy
            </Link>
            <Link to="/terms" className="hover:text-gray-700">
              Terms of Service
            </Link>
            <Link to="/support" className="hover:text-gray-700">
              Support
            </Link>
          </div>
          
          <p className="mt-4 text-xs text-gray-400">
            © 2025 SwiftNotes. All rights reserved.
          </p>
        </div>
      </div>
      
      {/* Background decoration */}
      <div className="absolute inset-0 -z-10 overflow-hidden">
        <div className="absolute left-[calc(50%-4rem)] top-10 -z-10 transform-gpu blur-3xl sm:left-[calc(50%-18rem)] lg:left-48 lg:top-[calc(50%-30rem)] xl:left-[calc(50%-24rem)]">
          <div
            className="aspect-[1108/632] w-[69.25rem] bg-gradient-to-r from-blue-100 to-slate-100 opacity-20"
            style={{
              clipPath:
                'polygon(73.6% 51.7%, 91.7% 11.8%, 100% 46.4%, 97.4% 82.2%, 92.5% 84.9%, 75.7% 64%, 55.3% 47.5%, 46.5% 49.4%, 45% 62.9%, 50.3% 87.2%, 21.3% 64.1%, 0.1% 100%, 5.4% 51.1%, 21.4% 63.9%, 58.9% 0.2%, 73.6% 51.7%)',
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AuthLayout;
