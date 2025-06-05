/**
 * Centralized API service for SwiftNotes frontend
 * Handles all HTTP requests to the backend API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Helper function to get auth token
const getAuthToken = () => {
  return localStorage.getItem('auth_token');
};

// Helper function to create headers with auth token
const createHeaders = (includeAuth = false): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// Helper function to handle API responses
const handleResponse = async (response: Response) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Network error' }));
    const errorMessage = errorData.error || `HTTP ${response.status}: ${response.statusText}`;

    // Handle specific authentication errors
    if (response.status === 401) {
      // Clear invalid token
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
    }

    throw new Error(errorMessage);
  }

  return response.json();
};

// Auth API endpoints
export const authAPI = {
  login: async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify({ email, password }),
    });
    return handleResponse(response);
  },

  register: async (userData: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: createHeaders(),
      body: JSON.stringify(userData),
    });
    return handleResponse(response);
  },

  logout: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  refreshToken: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  getCurrentUser: async () => {
    const response = await fetch(`${API_BASE_URL}/auth/me`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },
};

// User API endpoints
export const userAPI = {
  getProfile: async () => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  updateProfile: async (updates: any) => {
    const response = await fetch(`${API_BASE_URL}/user/profile`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  completeSetup: async (setupData: {
    writingStyle: string;
    ispTasks: Array<{ description: string }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/user/complete-setup`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(setupData),
    });
    return handleResponse(response);
  },

  getUsage: async () => {
    // Add cache-busting parameter to ensure fresh data
    const cacheBuster = Date.now();
    const response = await fetch(`${API_BASE_URL}/user/usage?_t=${cacheBuster}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/user/change-password`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  updateWritingStyle: async (writingStyle: string) => {
    const response = await fetch(`${API_BASE_URL}/user/writing-style`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify({ writingStyle }),
    });
    return handleResponse(response);
  },

  updatePreferences: async (preferences: {
    defaultToneLevel?: number;
    defaultDetailLevel?: string;
    emailNotifications?: boolean;
    weeklyReports?: boolean;
  }) => {
    const response = await fetch(`${API_BASE_URL}/user/preferences`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(preferences),
    });
    return handleResponse(response);
  },

  exportData: async () => {
    const response = await fetch(`${API_BASE_URL}/user/export-data`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  deleteAccount: async () => {
    const response = await fetch(`${API_BASE_URL}/user/delete-account`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },
};

// Notes API endpoints
export const notesAPI = {
  getNotes: async (params?: {
    page?: number;
    limit?: number;
    search?: string;
    noteType?: string;
    sortBy?: string;
    sortOrder?: string;
    startDate?: string;
    endDate?: string;
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.append('page', params.page.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.noteType) searchParams.append('noteType', params.noteType);
    if (params?.sortBy) searchParams.append('sortBy', params.sortBy);
    if (params?.sortOrder) searchParams.append('sortOrder', params.sortOrder);
    if (params?.startDate) searchParams.append('startDate', params.startDate);
    if (params?.endDate) searchParams.append('endDate', params.endDate);

    const response = await fetch(`${API_BASE_URL}/notes?${searchParams}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  getNote: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  createNote: async (noteData: {
    title: string;
    content: any;
    noteType?: string;
  }) => {
    const response = await fetch(`${API_BASE_URL}/notes`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(noteData),
    });
    return handleResponse(response);
  },

  updateNote: async (id: string, updates: {
    title?: string;
    content?: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteNote: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/notes/${id}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  bulkDeleteNotes: async (noteIds: string[]) => {
    const response = await fetch(`${API_BASE_URL}/notes/bulk`, {
      method: 'DELETE',
      headers: createHeaders(true),
      body: JSON.stringify({ noteIds }),
    });
    return handleResponse(response);
  },

  exportNotes: async (params?: {
    format?: 'json' | 'csv' | 'txt';
    noteIds?: string[];
  }) => {
    const searchParams = new URLSearchParams();
    if (params?.format) searchParams.append('format', params.format);
    if (params?.noteIds) {
      params.noteIds.forEach(id => searchParams.append('noteIds', id));
    }

    const response = await fetch(`${API_BASE_URL}/notes/export?${searchParams}`, {
      headers: createHeaders(true),
    });

    if (!response.ok) {
      throw new Error('Export failed');
    }

    return response; // Return the response directly for file download
  },

  getRecentNotes: async (limit?: number) => {
    const searchParams = new URLSearchParams();
    if (limit) searchParams.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/notes/recent?${searchParams}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },
};

// ISP Tasks API endpoints
export const ispTasksAPI = {
  getTasks: async () => {
    const response = await fetch(`${API_BASE_URL}/isp-tasks`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  createTask: async (taskData: {
    description: string;
    orderIndex?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/isp-tasks`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(taskData),
    });
    return handleResponse(response);
  },

  addTask: async (description: string) => {
    const response = await fetch(`${API_BASE_URL}/isp-tasks`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify({ description }),
    });
    return handleResponse(response);
  },

  updateTask: async (id: string, updates: {
    description?: string;
    orderIndex?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/isp-tasks/${id}`, {
      method: 'PUT',
      headers: createHeaders(true),
      body: JSON.stringify(updates),
    });
    return handleResponse(response);
  },

  deleteTask: async (id: string) => {
    const response = await fetch(`${API_BASE_URL}/isp-tasks/${id}`, {
      method: 'DELETE',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },
};

// AI API endpoints
export const aiAPI = {
  generateNote: async (requestData: {
    title: string;
    sections: Array<{
      taskId?: string;
      prompt: string;
      type: 'task' | 'comment' | 'general';
    }>;
  }) => {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },

  getQueueStatus: async (requestId: string) => {
    const response = await fetch(`${API_BASE_URL}/queue/status/${requestId}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  generatePreview: async (requestData: {
    prompt: string;
    taskDescription?: string;
    detailLevel?: 'brief' | 'moderate' | 'detailed' | 'comprehensive';
    toneLevel?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/ai/preview`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(requestData),
    });
    return handleResponse(response);
  },
};

// Writing Analytics API endpoints
export const writingAnalyticsAPI = {
  logAnalytics: async (data: {
    noteId: string;
    noteSectionId?: string;
    originalGenerated: string;
    userEditedVersion?: string;
    editType?: 'minor' | 'major' | 'style_change' | 'content_addition' | 'complete_rewrite';
    confidenceScore?: number;
    userSatisfactionScore?: number;
    feedbackNotes?: string;
    tokensUsed?: number;
    generationTimeMs?: number;
    styleMatchScore?: number;
  }) => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/log`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  getAnalyticsSummary: async () => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/summary`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  getAnalyticsHistory: async (limit = 50, offset = 0) => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/history?limit=${limit}&offset=${offset}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  getStyleEvolution: async (limit = 20) => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/style-evolution?limit=${limit}`, {
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },

  evolveStyle: async (data: {
    newStyle: string;
    triggerReason: string;
    notesAnalyzed?: number;
    improvementMetrics?: any;
  }) => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/evolve-style`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  analyzeStyle: async (writingStyle: string) => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/analyze-style`, {
      method: 'POST',
      headers: createHeaders(true),
      body: JSON.stringify({ writingStyle }),
    });
    return handleResponse(response);
  },

  updateConfidence: async () => {
    const response = await fetch(`${API_BASE_URL}/writing-analytics/update-confidence`, {
      method: 'PUT',
      headers: createHeaders(true),
    });
    return handleResponse(response);
  },
};

// Health check endpoint
export const healthAPI = {
  check: async () => {
    const response = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(response);
  },
};

// Export all APIs
export default {
  auth: authAPI,
  user: userAPI,
  notes: notesAPI,
  ispTasks: ispTasksAPI,
  ai: aiAPI,
  health: healthAPI,
};
