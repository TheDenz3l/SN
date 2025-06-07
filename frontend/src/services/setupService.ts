/**
 * Setup Service for SwiftNotes
 * Handles database initialization and user setup
 */

import { userAPI } from './apiService';

export interface SetupData {
  writingStyle: string;
  ispTasks: Array<{
    id: string;
    description: string;
  }>;
}

export interface DatabaseStatus {
  isInitialized: boolean;
  tablesExist: boolean;
  userProfileExists: boolean;
  error?: string;
}

/**
 * Check if the database is properly initialized
 */
export const checkDatabaseStatus = async (): Promise<DatabaseStatus> => {
  try {
    // Use backend API to check database status
    const token = localStorage.getItem('auth_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    if (!token) {
      return {
        isInitialized: false,
        tablesExist: false,
        userProfileExists: false,
        error: 'User not authenticated'
      };
    }

    // First check if backend server is running
    try {
      const healthResponse = await fetch(`${apiUrl}/health`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!healthResponse.ok) {
        return {
          isInitialized: false,
          tablesExist: false,
          userProfileExists: false,
          error: 'Backend server not responding'
        };
      }
    } catch (error) {
      return {
        isInitialized: false,
        tablesExist: false,
        userProfileExists: false,
        error: 'Backend server not running. Please start the backend server.'
      };
    }

    // Check if we can get user profile (tests user_profiles table)
    const profileResponse = await fetch(`${apiUrl}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (profileResponse.status === 401) {
      return {
        isInitialized: false,
        tablesExist: false,
        userProfileExists: false,
        error: 'User not authenticated - please login again'
      };
    }

    if (!profileResponse.ok) {
      const errorText = await profileResponse.text();
      console.error('Profile fetch error:', errorText);
      return {
        isInitialized: false,
        tablesExist: false,
        userProfileExists: false,
        error: `Database connection failed: ${profileResponse.status}`
      };
    }

    const profileData = await profileResponse.json();
    const userProfileExists = !!profileData.user;

    // Test additional tables to verify full database setup
    const tablesToTest = [
      { endpoint: '/isp-tasks', name: 'isp_tasks' },
      { endpoint: '/notes', name: 'notes' }
    ];

    let allTablesExist = true;
    const tableErrors = [];

    for (const table of tablesToTest) {
      try {
        const testResponse = await fetch(`${apiUrl}${table.endpoint}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });

        // 200 or 404 (empty results) are both OK - means table exists
        // 500 or other errors likely mean table doesn't exist
        if (testResponse.status >= 500) {
          allTablesExist = false;
          tableErrors.push(`${table.name} table may not exist`);
        }
      } catch (error) {
        allTablesExist = false;
        tableErrors.push(`Failed to test ${table.name} table`);
      }
    }

    return {
      isInitialized: userProfileExists && allTablesExist,
      tablesExist: allTablesExist,
      userProfileExists,
      error: tableErrors.length > 0 ? tableErrors.join(', ') : undefined
    };

  } catch (error) {
    console.error('Database status check failed:', error);
    return {
      isInitialized: false,
      tablesExist: false,
      userProfileExists: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
};

/**
 * Initialize database tables (if needed)
 */
export const initializeDatabase = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = localStorage.getItem('auth_token');
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    // Check if backend server is running first
    try {
      const healthResponse = await fetch(`${apiUrl}/health`);
      if (!healthResponse.ok) {
        return {
          success: false,
          error: 'Backend server not responding'
        };
      }
    } catch (error) {
      return {
        success: false,
        error: 'Backend server not running. Please start the backend server.'
      };
    }

    // Check if tables exist first
    const status = await checkDatabaseStatus();

    if (status.tablesExist && status.userProfileExists) {
      return { success: true };
    }

    // Call backend to initialize database
    const response = await fetch(`${apiUrl}/admin/setup/database`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      await response.json(); // Response received but not used
      return { success: true };
    } else {
      const errorData = await response.json().catch(() => ({}));
      return {
        success: false,
        error: errorData.error || `Database initialization failed (${response.status})`
      };
    }
  } catch (error) {
    console.error('Database initialization failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Database initialization failed'
    };
  }
};

/**
 * Create user profile if it doesn't exist
 */
export const createUserProfile = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Try to get user profile first to see if it exists
    const response = await fetch(`${apiUrl}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      // Profile already exists
      return { success: true };
    } else if (response.status === 401) {
      return {
        success: false,
        error: 'User not authenticated'
      };
    } else {
      // Profile might not exist, but this is handled by the backend
      // The backend should create profiles automatically during registration
      return {
        success: false,
        error: 'Profile creation should be handled during registration'
      };
    }

  } catch (error) {
    console.error('User profile creation failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Profile creation failed'
    };
  }
};

/**
 * Complete user setup with writing style and ISP tasks
 */
export const completeSetup = async (setupData: SetupData): Promise<{ success: boolean; error?: string }> => {
  try {
    // Use the backend API for setup completion
    await userAPI.completeSetup({
      writingStyle: setupData.writingStyle,
      ispTasks: setupData.ispTasks.map(task => ({ description: task.description }))
    });

    return { success: true };

  } catch (error) {
    console.error('Setup completion failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Setup completion failed'
    };
  }
};

/**
 * Get user's current setup status
 */
export const getSetupStatus = async (): Promise<{
  hasCompletedSetup: boolean;
  writingStyle?: string;
  ispTasks: Array<{ id: string; description: string; order_index: number }>;
  error?: string;
}> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return {
        hasCompletedSetup: false,
        ispTasks: [],
        error: 'User not authenticated'
      };
    }

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

    // Get user profile
    const profileResponse = await fetch(`${apiUrl}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!profileResponse.ok) {
      return {
        hasCompletedSetup: false,
        ispTasks: [],
        error: 'Failed to fetch user profile'
      };
    }

    const profileData = await profileResponse.json();

    // Get ISP tasks
    const tasksResponse = await fetch(`${apiUrl}/isp-tasks`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    let tasks = [];
    if (tasksResponse.ok) {
      const tasksData = await tasksResponse.json();
      tasks = tasksData.tasks || [];
    }

    return {
      hasCompletedSetup: profileData.user?.hasCompletedSetup || false,
      writingStyle: profileData.user?.writingStyle,
      ispTasks: tasks
    };

  } catch (error) {
    console.error('Setup status check failed:', error);
    return {
      hasCompletedSetup: false,
      ispTasks: [],
      error: error instanceof Error ? error.message : 'Setup status check failed'
    };
  }
};
