/**
 * Database Setup Component
 * Handles initial database setup and verification
 */

import React, { useState, useEffect } from 'react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon
} from '@heroicons/react/24/outline';
import { checkDatabaseStatus, createUserProfile, initializeDatabase, type DatabaseStatus } from '../services/setupService';
import toast from 'react-hot-toast';

interface DatabaseSetupProps {
  onSetupComplete: () => void;
}

const DatabaseSetup: React.FC<DatabaseSetupProps> = ({ onSetupComplete }) => {
  const [status, setStatus] = useState<DatabaseStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreatingProfile, setIsCreatingProfile] = useState(false);
  const [isInitializingDatabase, setIsInitializingDatabase] = useState(false);

  const checkStatus = async () => {
    setIsLoading(true);
    try {
      const dbStatus = await checkDatabaseStatus();
      setStatus(dbStatus);
      
      // If everything is ready, automatically proceed
      if (dbStatus.isInitialized && dbStatus.tablesExist && dbStatus.userProfileExists) {
        setTimeout(() => {
          onSetupComplete();
        }, 1000);
      }
    } catch (error) {
      console.error('Status check failed:', error);
      toast.error('Failed to check database status');
    } finally {
      setIsLoading(false);
    }
  };

  const createProfile = async () => {
    setIsCreatingProfile(true);
    try {
      const result = await createUserProfile();

      if (result.success) {
        toast.success('User profile created successfully!');
        await checkStatus(); // Recheck status
      } else {
        toast.error(result.error || 'Failed to create user profile');
      }
    } catch (error) {
      console.error('Profile creation failed:', error);
      toast.error('Failed to create user profile');
    } finally {
      setIsCreatingProfile(false);
    }
  };

  const initDatabase = async () => {
    setIsInitializingDatabase(true);
    try {
      const result = await initializeDatabase();

      if (result.success) {
        toast.success('Database initialized successfully!');
        await checkStatus(); // Recheck status
      } else {
        toast.error(result.error || 'Failed to initialize database');
      }
    } catch (error) {
      console.error('Database initialization failed:', error);
      toast.error('Failed to initialize database');
    } finally {
      setIsInitializingDatabase(false);
    }
  };

  useEffect(() => {
    checkStatus();
  }, []);

  if (isLoading) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="text-center">
            <ArrowPathIcon className="mx-auto h-12 w-12 text-blue-500 animate-spin" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Checking Database Status
            </h2>
            <p className="mt-2 text-gray-600">
              Please wait while we verify your database setup...
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!status) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="bg-white shadow-sm rounded-lg p-8">
          <div className="text-center">
            <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-500" />
            <h2 className="mt-4 text-xl font-semibold text-gray-900">
              Database Check Failed
            </h2>
            <p className="mt-2 text-gray-600">
              Unable to check database status. Please try again.
            </p>
            <button
              onClick={checkStatus}
              className="mt-4 btn-primary"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white shadow-sm rounded-lg p-8">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Database Setup</h1>
          <p className="mt-2 text-gray-600">
            Let's make sure your database is ready for SwiftNotes
          </p>
        </div>

        <div className="space-y-6">
          {/* Database Tables Status */}
          <div className="flex items-start space-x-3">
            {status.tablesExist ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5" />
            ) : (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                Database Tables
              </h3>
              <p className="text-gray-600">
                {status.tablesExist 
                  ? 'All required database tables are present and accessible.'
                  : 'Database tables need to be created.'
                }
              </p>
              {!status.tablesExist && (
                <button
                  onClick={initDatabase}
                  disabled={isInitializingDatabase}
                  className="mt-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isInitializingDatabase ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Initializing Database...
                    </div>
                  ) : (
                    'Initialize Database'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* User Profile Status */}
          <div className="flex items-start space-x-3">
            {status.userProfileExists ? (
              <CheckCircleIcon className="h-6 w-6 text-green-500 mt-0.5" />
            ) : status.tablesExist ? (
              <ExclamationTriangleIcon className="h-6 w-6 text-yellow-500 mt-0.5" />
            ) : (
              <div className="h-6 w-6 rounded-full bg-gray-300 mt-0.5" />
            )}
            <div className="flex-1">
              <h3 className="text-lg font-medium text-gray-900">
                User Profile
              </h3>
              <p className="text-gray-600">
                {status.userProfileExists 
                  ? 'Your user profile is set up and ready.'
                  : status.tablesExist
                    ? 'User profile needs to be created.'
                    : 'Waiting for database tables to be created first.'
                }
              </p>
              {status.tablesExist && !status.userProfileExists && (
                <button
                  onClick={createProfile}
                  disabled={isCreatingProfile}
                  className="mt-3 btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingProfile ? (
                    <div className="flex items-center">
                      <ArrowPathIcon className="w-4 h-4 mr-2 animate-spin" />
                      Creating Profile...
                    </div>
                  ) : (
                    'Create User Profile'
                  )}
                </button>
              )}
            </div>
          </div>

          {/* Overall Status */}
          <div className="border-t pt-6">
            {status.isInitialized && status.tablesExist && status.userProfileExists ? (
              <div className="text-center">
                <CheckCircleIcon className="mx-auto h-12 w-12 text-green-500" />
                <h3 className="mt-4 text-lg font-medium text-gray-900">
                  Database Setup Complete!
                </h3>
                <p className="mt-2 text-gray-600">
                  Your database is ready. Proceeding to setup...
                </p>
                <div className="mt-4">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full animate-pulse" style={{ width: '100%' }}></div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center">
                <div className="flex justify-center space-x-4">
                  <button
                    onClick={checkStatus}
                    className="btn-outline"
                  >
                    <ArrowPathIcon className="w-4 h-4 mr-2" />
                    Retry Check
                  </button>
                  {status.tablesExist && status.userProfileExists && (
                    <button
                      onClick={onSetupComplete}
                      className="btn-primary"
                    >
                      Continue to Setup
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Error Display */}
          {status.error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-400 mt-0.5" />
                <div className="ml-3">
                  <h4 className="text-sm font-medium text-red-800">Error</h4>
                  <p className="mt-1 text-sm text-red-700">{status.error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DatabaseSetup;
