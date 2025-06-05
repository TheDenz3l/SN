/**
 * Authentication Service for SwiftNotes
 * Handles user authentication, registration, and session management
 */

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tier: string;
  credits: number;
  hasCompletedSetup: boolean;
  writingStyle?: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  session?: {
    access_token: string;
    refresh_token: string;
    expires_at: number;
  };
  error?: string;
  details?: any[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
}

/**
 * Get the API URL from environment or default
 */
const getApiUrl = () => {
  return import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
};

/**
 * Check if backend server is running
 */
export const checkBackendHealth = async (): Promise<boolean> => {
  try {
    const apiUrl = getApiUrl();
    const response = await fetch(`${apiUrl}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.ok;
  } catch (error) {
    console.error('Backend health check failed:', error);
    return false;
  }
};

/**
 * Register a new user
 */
export const register = async (credentials: RegisterCredentials): Promise<AuthResponse> => {
  try {
    const apiUrl = getApiUrl();
    
    // Check if backend is running
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      return {
        success: false,
        error: 'Backend server is not running. Please start the backend server.'
      };
    }

    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store the auth token
      if (data.session?.access_token) {
        localStorage.setItem('auth_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        localStorage.setItem('token_expires_at', data.session.expires_at.toString());
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } else {
      return {
        success: false,
        error: data.error || 'Registration failed',
        details: data.details
      };
    }
  } catch (error) {
    console.error('Registration error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Registration failed'
    };
  }
};

/**
 * Login user
 */
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  try {
    const apiUrl = getApiUrl();
    
    // Check if backend is running
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      return {
        success: false,
        error: 'Backend server is not running. Please start the backend server.'
      };
    }

    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(credentials),
    });

    const data = await response.json();

    if (response.ok && data.success) {
      // Store the auth token
      if (data.session?.access_token) {
        localStorage.setItem('auth_token', data.session.access_token);
        localStorage.setItem('refresh_token', data.session.refresh_token);
        localStorage.setItem('token_expires_at', data.session.expires_at.toString());
      }

      return {
        success: true,
        user: data.user,
        session: data.session
      };
    } else {
      return {
        success: false,
        error: data.error || 'Login failed'
      };
    }
  } catch (error) {
    console.error('Login error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Login failed'
    };
  }
};

/**
 * Logout user
 */
export const logout = async (): Promise<void> => {
  try {
    // Clear local storage
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');

    // Sign out handled by backend API
  } catch (error) {
    console.error('Logout error:', error);
  }
};

/**
 * Get current user from backend
 */
export const getCurrentUser = async (): Promise<{ user: User | null; error?: string }> => {
  try {
    const token = localStorage.getItem('auth_token');
    if (!token) {
      return { user: null, error: 'No auth token found' };
    }

    const apiUrl = getApiUrl();
    
    // Check if backend is running
    const isHealthy = await checkBackendHealth();
    if (!isHealthy) {
      return { user: null, error: 'Backend server is not running' };
    }

    const response = await fetch(`${apiUrl}/user/profile`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (response.ok) {
      const data = await response.json();
      return { user: data.user };
    } else if (response.status === 401) {
      // Token is invalid, clear it
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('token_expires_at');
      return { user: null, error: 'Authentication expired' };
    } else {
      return { user: null, error: 'Failed to fetch user profile' };
    }
  } catch (error) {
    console.error('Get current user error:', error);
    return { user: null, error: error instanceof Error ? error.message : 'Unknown error' };
  }
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  const token = localStorage.getItem('auth_token');
  const expiresAt = localStorage.getItem('token_expires_at');
  
  if (!token || !expiresAt) {
    return false;
  }

  // Check if token is expired
  const now = Date.now();
  const expiry = parseInt(expiresAt);
  
  if (now >= expiry) {
    // Token is expired, clear it
    localStorage.removeItem('auth_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('token_expires_at');
    return false;
  }

  return true;
};

/**
 * Get auth token for API requests
 */
export const getAuthToken = (): string | null => {
  if (!isAuthenticated()) {
    return null;
  }
  return localStorage.getItem('auth_token');
};
