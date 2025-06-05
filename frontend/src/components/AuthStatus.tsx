/**
 * Authentication Status Component
 * Shows current auth status and provides login/logout functionality
 */

import React, { useState, useEffect } from 'react';
import { 
  getCurrentUser, 
  login, 
  logout, 
  register, 
  checkBackendHealth,
  isAuthenticated,
  type User,
  type LoginCredentials,
  type RegisterCredentials 
} from '../services/authService';

interface AuthStatusProps {
  onAuthChange?: (user: User | null) => void;
}

export const AuthStatus: React.FC<AuthStatusProps> = ({ onAuthChange }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [backendHealthy, setBackendHealthy] = useState(false);

  // Login form state
  const [loginForm, setLoginForm] = useState<LoginCredentials>({
    email: '',
    password: ''
  });

  // Register form state
  const [registerForm, setRegisterForm] = useState<RegisterCredentials>({
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    checkAuthStatus();
    checkBackend();
  }, []);

  const checkBackend = async () => {
    const healthy = await checkBackendHealth();
    setBackendHealthy(healthy);
  };

  const checkAuthStatus = async () => {
    setLoading(true);
    try {
      if (isAuthenticated()) {
        const { user: currentUser, error } = await getCurrentUser();
        if (currentUser) {
          setUser(currentUser);
          onAuthChange?.(currentUser);
        } else if (error) {
          setError(error);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication check failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await login(loginForm);
      if (result.success && result.user) {
        setUser(result.user);
        setShowLogin(false);
        setLoginForm({ email: '', password: '' });
        onAuthChange?.(result.user);
      } else {
        setError(result.error || 'Login failed');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await register(registerForm);
      if (result.success && result.user) {
        setUser(result.user);
        setShowRegister(false);
        setRegisterForm({ email: '', password: '', firstName: '', lastName: '' });
        onAuthChange?.(result.user);
      } else {
        setError(result.error || 'Registration failed');
        if (result.details) {
          console.error('Registration validation errors:', result.details);
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      setUser(null);
      onAuthChange?.(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Logout failed');
    }
  };

  if (loading) {
    return (
      <div className="auth-status loading">
        <div className="spinner">🔄</div>
        <span>Checking authentication...</span>
      </div>
    );
  }

  return (
    <div className="auth-status">
      {/* Backend Health Status */}
      <div className={`backend-status ${backendHealthy ? 'healthy' : 'unhealthy'}`}>
        <span className="status-indicator">
          {backendHealthy ? '🟢' : '🔴'}
        </span>
        <span>
          Backend: {backendHealthy ? 'Connected' : 'Disconnected'}
        </span>
        {!backendHealthy && (
          <button onClick={checkBackend} className="retry-btn">
            Retry
          </button>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="error-message">
          <span>❌ {error}</span>
          <button onClick={() => setError(null)}>✕</button>
        </div>
      )}

      {/* User Status */}
      {user ? (
        <div className="user-info">
          <div className="user-details">
            <span className="user-email">👤 {user.email}</span>
            <span className="user-tier">🎯 {user.tier}</span>
            <span className="user-credits">💰 {user.credits} credits</span>
          </div>
          <button onClick={handleLogout} className="logout-btn">
            Logout
          </button>
        </div>
      ) : (
        <div className="auth-actions">
          {!showLogin && !showRegister && (
            <>
              <button onClick={() => setShowLogin(true)} className="login-btn">
                Login
              </button>
              <button onClick={() => setShowRegister(true)} className="register-btn">
                Register
              </button>
            </>
          )}

          {/* Login Form */}
          {showLogin && (
            <form onSubmit={handleLogin} className="auth-form">
              <h3>Login</h3>
              <input
                type="email"
                placeholder="Email"
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={loginForm.password}
                onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                required
              />
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Logging in...' : 'Login'}
                </button>
                <button type="button" onClick={() => setShowLogin(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Register Form */}
          {showRegister && (
            <form onSubmit={handleRegister} className="auth-form">
              <h3>Register</h3>
              <input
                type="email"
                placeholder="Email"
                value={registerForm.email}
                onChange={(e) => setRegisterForm({ ...registerForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password (min 8 chars, 1 upper, 1 lower, 1 number)"
                value={registerForm.password}
                onChange={(e) => setRegisterForm({ ...registerForm, password: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="First Name"
                value={registerForm.firstName}
                onChange={(e) => setRegisterForm({ ...registerForm, firstName: e.target.value })}
              />
              <input
                type="text"
                placeholder="Last Name"
                value={registerForm.lastName}
                onChange={(e) => setRegisterForm({ ...registerForm, lastName: e.target.value })}
              />
              <div className="form-actions">
                <button type="submit" disabled={loading}>
                  {loading ? 'Registering...' : 'Register'}
                </button>
                <button type="button" onClick={() => setShowRegister(false)}>
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
};
