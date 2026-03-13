const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = localStorage.getItem('accessToken');

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  // Handle 401 - try to refresh token
  if (response.status === 401) {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });

        if (refreshResponse.ok) {
          const { accessToken, refreshToken: newRefreshToken } =
            await refreshResponse.json();
          localStorage.setItem('accessToken', accessToken);
          localStorage.setItem('refreshToken', newRefreshToken);

          // Retry original request
          headers['Authorization'] = `Bearer ${accessToken}`;
          return fetch(`${API_BASE_URL}${endpoint}`, {
            ...options,
            headers,
          });
        }
      } catch (error) {
        // Refresh failed, clear tokens
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
    }
  }

  return response;
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({
      message: 'An error occurred',
    }));
    throw new ApiError(
      response.status,
      error.message || 'An error occurred',
      error.errors
    );
  }

  return response.json();
}

// Auth API
export const authApi = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>(response);
  },

  async login(data: { identifier: string; password: string }) {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>(response);
  },

  async logout() {
    const response = await fetchWithAuth('/auth/logout', { method: 'POST' });
    return handleResponse(response);
  },

  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    const response = await fetchWithAuth('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },
};

// Users API
export const usersApi = {
  async getProfile(identifier: string) {
    const response = await fetchWithAuth(`/users/profile/${identifier}`);
    return handleResponse<any>(response);
  },

  async updateProfile(data: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    socialLinks?: {
      twitter?: string;
      github?: string;
      website?: string;
      linkedin?: string;
    };
  }) {
    const response = await fetchWithAuth('/users/profile', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
    return handleResponse<any>(response);
  },

  async followUser(userId: string) {
    const response = await fetchWithAuth(`/users/follow/${userId}`, {
      method: 'POST',
    });
    return handleResponse(response);
  },

  async unfollowUser(userId: string) {
    const response = await fetchWithAuth(`/users/follow/${userId}`, {
      method: 'DELETE',
    });
    return handleResponse(response);
  },

  async getFollowers(userId: string, page = 1, limit = 20) {
    const response = await fetchWithAuth(
      `/users/${userId}/followers?page=${page}&limit=${limit}`
    );
    return handleResponse<{ data: any[]; meta: any }>(response);
  },

  async getFollowing(userId: string, page = 1, limit = 20) {
    const response = await fetchWithAuth(
      `/users/${userId}/following?page=${page}&limit=${limit}`
    );
    return handleResponse<{ data: any[]; meta: any }>(response);
  },
};

// Helper to check if user is authenticated
export function isAuthenticated(): boolean {
  return !!localStorage.getItem('accessToken');
}

// Helper to get current user from token
export function getCurrentUser(): any | null {
  const token = localStorage.getItem('accessToken');
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload;
  } catch {
    return null;
  }
}
