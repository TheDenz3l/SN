import { create } from 'zustand';
import { persist } from 'zustand/middleware';
// import type { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

export interface UserProfile {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  tier: 'free' | 'paid' | 'premium';
  credits: number;
  free_generations_used?: number;
  free_generations_reset_date?: string;
  writing_style: string | null;
  has_completed_setup: boolean;
  preferences?: string | null; // JSON string from database
  created_at: string;
  updated_at: string;
}

export interface UserPreferences {
  defaultToneLevel?: number;
  defaultDetailLevel?: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
  emailNotifications?: boolean;
  weeklyReports?: boolean;
  useTimePatterns?: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  tier: 'free' | 'paid' | 'premium';
  credits: number;
  freeGenerationsUsed?: number;
  freeGenerationsResetDate?: string;
  hasCompletedSetup: boolean;
  writingStyle?: string;
  preferences?: UserPreferences;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  // Actions
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<User>) => Promise<void>;
  updateProfile: (updates: Partial<UserProfile>) => Promise<void>;
  setLoading: (loading: boolean) => void;
  initialize: () => Promise<void>;

  // Computed values
  getUserDisplayName: () => string;
  canAccessFeature: (feature: string) => boolean;
}

// Helper function to parse preferences from JSON string or object
const parsePreferences = (preferences?: string | UserPreferences | null): UserPreferences => {
  if (!preferences) return {};

  // If it's already an object, return it directly
  if (typeof preferences === 'object') {
    return preferences;
  }

  // If it's a string, try to parse it
  if (typeof preferences === 'string') {
    try {
      return JSON.parse(preferences);
    } catch (error) {
      console.warn('Failed to parse user preferences:', error);
      return {};
    }
  }

  return {};
};

// Helper function to convert Supabase user + profile to our User interface
// Utility function for creating User from profile (currently unused but kept for future use)
// const createUserFromProfile = (supabaseUser: SupabaseUser, profile: UserProfile): User => ({
//   id: supabaseUser.id,
//   email: supabaseUser.email!,
//   firstName: profile.first_name || undefined,
//   lastName: profile.last_name || undefined,
//   tier: profile.tier,
//   credits: profile.credits,
//   hasCompletedSetup: profile.has_completed_setup,
//   writingStyle: profile.writing_style || undefined,
//   preferences: parsePreferences(profile.preferences),
//   createdAt: profile.created_at,
//   updatedAt: profile.updated_at,
// });

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,

      signUp: async (email: string, password: string, firstName: string, lastName: string) => {
        set({ isLoading: true });
        try {
          // Use backend API for registration
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiUrl}/auth/register`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
              firstName,
              lastName,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Registration failed');
          }

          if (result.success && result.user) {
            // Store the session token
            const token = result.session?.access_token;
            if (token) {
              localStorage.setItem('auth_token', token);
            }

            // Create user object from backend response
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              tier: result.user.tier,
              credits: result.user.credits,
              freeGenerationsUsed: result.user.freeGenerationsUsed || 0,
              freeGenerationsResetDate: result.user.freeGenerationsResetDate,
              hasCompletedSetup: result.user.hasCompletedSetup,
              writingStyle: result.user.writingStyle,
              preferences: parsePreferences(result.user.preferences),
            };

            // Store user data for persistence
            localStorage.setItem('auth_user', JSON.stringify(user));

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            toast.success('Account created successfully!');
          }
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.message || 'Registration failed';
          toast.error(message);
          throw error;
        }
      },

      signIn: async (email: string, password: string) => {
        set({ isLoading: true });
        try {
          // Use backend API for login
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
          const response = await fetch(`${apiUrl}/auth/login`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              email,
              password,
            }),
          });

          const result = await response.json();

          if (!response.ok) {
            throw new Error(result.error || 'Login failed');
          }

          if (result.success && result.user) {
            // Store the session token
            const token = result.session?.access_token;
            if (token) {
              localStorage.setItem('auth_token', token);
              if (result.session?.refresh_token) {
                localStorage.setItem('refresh_token', result.session.refresh_token);
              }
              if (result.session?.expires_at) {
                localStorage.setItem('token_expires_at', result.session.expires_at.toString());
              }
            }

            // Create user object from backend response with proper preference parsing
            const user: User = {
              id: result.user.id,
              email: result.user.email,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              tier: result.user.tier,
              credits: result.user.credits,
              freeGenerationsUsed: result.user.freeGenerationsUsed || 0,
              freeGenerationsResetDate: result.user.freeGenerationsResetDate,
              hasCompletedSetup: result.user.hasCompletedSetup,
              writingStyle: result.user.writingStyle,
              preferences: parsePreferences(result.user.preferences),
              createdAt: result.user.createdAt,
              updatedAt: result.user.updatedAt,
            };

            // Store user data for persistence
            localStorage.setItem('auth_user', JSON.stringify(user));

            set({
              user,
              token,
              isAuthenticated: true,
              isLoading: false,
            });

            toast.success('Welcome back!');
          }
        } catch (error: any) {
          set({ isLoading: false });
          const message = error.message || 'Login failed';
          toast.error(message);
          throw error;
        }
      },

      signOut: async () => {
        try {
          // Call backend logout first (if token exists)
          const currentToken = get().token;
          if (currentToken) {
            try {
              const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
              await fetch(`${apiUrl}/auth/logout`, {
                method: 'POST',
                headers: {
                  'Authorization': `Bearer ${currentToken}`,
                },
              });
            } catch (backendError) {
              console.warn('Backend logout failed:', backendError);
              // Continue with Supabase logout even if backend fails
            }
          }

          // Sign out from Supabase
          const { error } = await supabase.auth.signOut();
          if (error) {
            console.warn('Supabase signOut error:', error);
            // Don't throw here, just log the warning
          }

          // Clear local storage
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');

          // Clear local state regardless of API call results
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          toast.success('Signed out successfully');
        } catch (error: any) {
          console.error('SignOut error:', error);

          // Force logout by clearing state even if there are errors
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

          toast.success('Signed out successfully');
        }
      },

      updateUser: async (updates: Partial<User>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          // Handle preferences separately if they're being updated
          if (updates.preferences !== undefined) {
            // Create a new user object to ensure reference equality changes
            const updatedUser = {
              ...currentUser,
              ...updates,
              preferences: {
                ...currentUser.preferences,
                ...updates.preferences
              },
              updatedAt: new Date().toISOString() // Force timestamp update for component re-mounting
            };

            // Update both state and localStorage for persistence
            set({ user: updatedUser });
            localStorage.setItem('auth_user', JSON.stringify(updatedUser));
            return;
          }

          // Convert User updates to UserProfile updates for other fields
          const profileUpdates: Partial<UserProfile> = {};
          if (updates.firstName !== undefined) profileUpdates.first_name = updates.firstName;
          if (updates.lastName !== undefined) profileUpdates.last_name = updates.lastName;
          if (updates.tier !== undefined) profileUpdates.tier = updates.tier;
          if (updates.credits !== undefined) profileUpdates.credits = updates.credits;
          if (updates.hasCompletedSetup !== undefined) profileUpdates.has_completed_setup = updates.hasCompletedSetup;
          if (updates.writingStyle !== undefined) profileUpdates.writing_style = updates.writingStyle;

          await get().updateProfile(profileUpdates);
        } catch (error) {
          console.error('Error updating user:', error);
          throw error;
        }
      },

      updateProfile: async (updates: Partial<UserProfile>) => {
        const currentUser = get().user;
        if (!currentUser) return;

        try {
          // Use backend API instead of direct Supabase call
          const token = localStorage.getItem('auth_token');
          const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

          const response = await fetch(`${apiUrl}/user/profile`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updates),
          });

          if (!response.ok) {
            throw new Error('Failed to update profile');
          }

          const result = await response.json();

          // Create updated user object with fresh timestamp
          const updatedUser = {
            ...currentUser,
            ...result.user,
            updatedAt: new Date().toISOString() // Force timestamp update for component re-mounting
          };

          // Update both state and localStorage for persistence
          set({ user: updatedUser });
          localStorage.setItem('auth_user', JSON.stringify(updatedUser));
        } catch (error: any) {
          const message = error.message || 'Failed to update profile';
          toast.error(message);
          throw error;
        }
      },

      setLoading: (loading: boolean) => {
        set({ isLoading: loading });
      },

      initialize: async () => {
        try {
          set({ isLoading: true });

          // Check for stored token first
          const storedToken = localStorage.getItem('auth_token');
          const storedUser = localStorage.getItem('auth_user');

          if (storedToken && storedUser) {
            try {
              // First set the stored user data immediately to prevent UI flicker
              const parsedUser = JSON.parse(storedUser);
              set({
                user: parsedUser,
                token: storedToken,
                isAuthenticated: true,
                isLoading: true, // Keep loading true while validating
              });

              // Then validate token with backend and get fresh data
              const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3001/api'}/user/profile`, {
                headers: {
                  'Authorization': `Bearer ${storedToken}`,
                  'Content-Type': 'application/json',
                },
              });

              if (response.ok) {
                const profileData = await response.json();

                // Create fresh user object with latest data from backend
                const freshUser: User = {
                  id: profileData.user.id,
                  email: profileData.user.email,
                  firstName: profileData.user.firstName,
                  lastName: profileData.user.lastName,
                  tier: profileData.user.tier,
                  credits: profileData.user.credits,
                  hasCompletedSetup: profileData.user.hasCompletedSetup,
                  writingStyle: profileData.user.writingStyle,
                  preferences: parsePreferences(profileData.user.preferences),
                  createdAt: profileData.user.createdAt,
                  updatedAt: profileData.user.updatedAt || new Date().toISOString(), // Ensure updatedAt is always set
                };

                // Update localStorage with fresh data
                localStorage.setItem('auth_user', JSON.stringify(freshUser));

                // Update state with fresh data
                set({
                  user: freshUser,
                  token: storedToken,
                  isAuthenticated: true,
                  isLoading: false,
                });
                return;
              } else {
                // Token is invalid, clear storage and state
                localStorage.removeItem('auth_token');
                localStorage.removeItem('auth_user');
                set({
                  user: null,
                  token: null,
                  isAuthenticated: false,
                  isLoading: false,
                });
                return;
              }
            } catch (error) {
              console.error('Error validating stored token:', error);
              localStorage.removeItem('auth_token');
              localStorage.removeItem('auth_user');
              set({
                user: null,
                token: null,
                isAuthenticated: false,
                isLoading: false,
              });
              return;
            }
          }

          // No valid stored session found
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });

        } catch (error) {
          console.error('Error initializing auth:', error);
          set({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false
          });
        }
      },

      getUserDisplayName: () => {
        const user = get().user;
        if (!user) return 'Guest';
        
        if (user.firstName && user.lastName) {
          return `${user.firstName} ${user.lastName}`;
        }
        
        if (user.firstName) {
          return user.firstName;
        }
        
        return user.email.split('@')[0];
      },

      canAccessFeature: (feature: string) => {
        const user = get().user;
        if (!user) return false;

        switch (feature) {
          case 'unlimited_generations':
            return user.tier === 'premium';
          case 'priority_queue':
            return user.tier === 'paid' || user.tier === 'premium';
          case 'advanced_analytics':
            return user.tier === 'premium';
          case 'export_notes':
            return user.tier === 'paid' || user.tier === 'premium';
          case 'custom_templates':
            return user.tier === 'premium';
          default:
            return true; // Basic features available to all
        }
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

// Utility functions for auth
export const getAuthToken = () => {
  return useAuthStore.getState().token;
};

export const isUserAuthenticated = () => {
  return useAuthStore.getState().isAuthenticated;
};

export const getCurrentUser = () => {
  return useAuthStore.getState().user;
};

// Auth API functions (these would typically be in a separate API service)
export const authAPI = {
  login: async (email: string, password: string) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    const response = await fetch(`${apiUrl}/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });

    if (!response.ok) {
      throw new Error('Registration failed');
    }

    return response.json();
  },

  logout: async () => {
    const token = getAuthToken();
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
    if (token) {
      await fetch(`${apiUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    }
  },

  refreshToken: async () => {
    const token = getAuthToken();
    if (!token) throw new Error('No token available');

    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Token refresh failed');
    }

    return response.json();
  },

  getCurrentUser: async () => {
    const token = getAuthToken();
    if (!token) throw new Error('No token available');

    const response = await fetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      throw new Error('Failed to get user data');
    }

    return response.json();
  },
};
