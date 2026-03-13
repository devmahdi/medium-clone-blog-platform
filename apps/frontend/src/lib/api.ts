const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public status: number,
    public message: string,
    public errors?: any,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

async function fetchWithAuth(
  endpoint: string,
  options: RequestInit = {},
): Promise<Response> {
  const token =
    typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;

  const headers: Record<string, string> = {};

  // Only set Content-Type for non-FormData requests
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (options.headers) {
    Object.assign(headers, options.headers);
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401 && typeof window !== 'undefined') {
    const refreshToken = localStorage.getItem('refreshToken');
    if (refreshToken) {
      try {
        const refreshResponse = await fetch(`${API_BASE_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshResponse.ok) {
          const data = await refreshResponse.json();
          localStorage.setItem('accessToken', data.accessToken);
          localStorage.setItem('refreshToken', data.refreshToken);
          headers['Authorization'] = `Bearer ${data.accessToken}`;
          return fetch(`${API_BASE_URL}${endpoint}`, { ...options, headers });
        }
      } catch {
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
    const error = await response
      .json()
      .catch(() => ({ message: 'An error occurred' }));
    throw new ApiError(
      response.status,
      error.message || 'An error occurred',
      error.errors,
    );
  }
  return response.json();
}

// ─── Auth ───
export const authApi = {
  async register(data: {
    email: string;
    username: string;
    password: string;
    fullName?: string;
  }) {
    const r = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>(r);
  },
  async login(data: { identifier: string; password: string }) {
    const r = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return handleResponse<{
      user: any;
      accessToken: string;
      refreshToken: string;
    }>(r);
  },
  async logout() {
    return handleResponse(
      await fetchWithAuth('/auth/logout', { method: 'POST' }),
    );
  },
  async changePassword(data: {
    currentPassword: string;
    newPassword: string;
  }) {
    return handleResponse(
      await fetchWithAuth('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    );
  },
};

// ─── Users ───
export const usersApi = {
  async getProfile(identifier: string) {
    return handleResponse<any>(
      await fetchWithAuth(`/users/profile/${identifier}`),
    );
  },
  async updateProfile(data: {
    fullName?: string;
    bio?: string;
    avatarUrl?: string;
    socialLinks?: Record<string, string>;
  }) {
    return handleResponse<any>(
      await fetchWithAuth('/users/profile', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    );
  },
  async followUser(userId: string) {
    return handleResponse(
      await fetchWithAuth(`/users/follow/${userId}`, { method: 'POST' }),
    );
  },
  async unfollowUser(userId: string) {
    return handleResponse(
      await fetchWithAuth(`/users/follow/${userId}`, { method: 'DELETE' }),
    );
  },
  async getFollowers(userId: string, page = 1, limit = 20) {
    return handleResponse<{ data: any[]; meta: any }>(
      await fetchWithAuth(
        `/users/${userId}/followers?page=${page}&limit=${limit}`,
      ),
    );
  },
  async getFollowing(userId: string, page = 1, limit = 20) {
    return handleResponse<{ data: any[]; meta: any }>(
      await fetchWithAuth(
        `/users/${userId}/following?page=${page}&limit=${limit}`,
      ),
    );
  },
};

// ─── Articles ───
export interface Article {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImageUrl?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  author: { id: string; username: string; fullName?: string; avatarUrl?: string };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isBookmarked?: boolean;
}

export const articlesApi = {
  async getAll(params?: {
    page?: number;
    limit?: number;
    tag?: string;
    authorId?: string;
    status?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.authorId) qs.set('authorId', params.authorId);
    if (params?.status) qs.set('status', params.status);
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(`/articles?${qs.toString()}`),
    );
  },

  async getBySlug(slug: string) {
    return handleResponse<Article>(
      await fetchWithAuth(`/articles/${slug}`),
    );
  },

  async create(data: {
    title: string;
    content: string;
    excerpt?: string;
    coverImageUrl?: string;
    tags?: string[];
    status?: 'draft' | 'published';
  }) {
    return handleResponse<Article>(
      await fetchWithAuth('/articles', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    );
  },

  async update(
    slug: string,
    data: {
      title?: string;
      content?: string;
      excerpt?: string;
      coverImageUrl?: string;
      tags?: string[];
      status?: 'draft' | 'published' | 'archived';
    },
  ) {
    return handleResponse<Article>(
      await fetchWithAuth(`/articles/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    );
  },

  async delete(slug: string) {
    return handleResponse(
      await fetchWithAuth(`/articles/${slug}`, { method: 'DELETE' }),
    );
  },

  async getByAuthor(username: string, page = 1, limit = 10) {
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(
        `/articles?author=${username}&page=${page}&limit=${limit}`,
      ),
    );
  },
};

// ─── Bookmarks ───
export const bookmarksApi = {
  async getAll(page = 1, limit = 10) {
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(`/bookmarks?page=${page}&limit=${limit}`),
    );
  },
  async add(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/bookmarks/${articleId}`, { method: 'POST' }),
    );
  },
  async remove(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/bookmarks/${articleId}`, { method: 'DELETE' }),
    );
  },
};

// ─── Claps ───
export const clapsApi = {
  async clap(articleId: string, count = 1) {
    return handleResponse<{ totalClaps: number }>(
      await fetchWithAuth(`/articles/${articleId}/clap`, {
        method: 'POST',
        body: JSON.stringify({ count }),
      }),
    );
  },
};

// ─── Comments ───
export interface Comment {
  id: string;
  content: string;
  author: { id: string; username: string; fullName?: string; avatarUrl?: string };
  articleId: string;
  parentId?: string;
  createdAt: string;
  updatedAt: string;
  replies?: Comment[];
}

export const commentsApi = {
  async getByArticle(articleId: string, page = 1, limit = 50) {
    return handleResponse<{ data: Comment[]; meta: any }>(
      await fetchWithAuth(
        `/articles/${articleId}/comments?page=${page}&limit=${limit}`,
      ),
    );
  },
  async create(articleId: string, content: string, parentId?: string) {
    return handleResponse<Comment>(
      await fetchWithAuth(`/articles/${articleId}/comments`, {
        method: 'POST',
        body: JSON.stringify({ content, parentId }),
      }),
    );
  },
  async update(commentId: string, content: string) {
    return handleResponse<Comment>(
      await fetchWithAuth(`/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    );
  },
  async delete(commentId: string) {
    return handleResponse(
      await fetchWithAuth(`/comments/${commentId}`, { method: 'DELETE' }),
    );
  },
};

// ─── Media ───
export const mediaApi = {
  async uploadCover(file: File) {
    const form = new FormData();
    form.append('file', file);
    return handleResponse<{ url: string; key: string }>(
      await fetchWithAuth('/media/upload/cover', {
        method: 'POST',
        body: form,
      }),
    );
  },
  async uploadContent(file: File) {
    const form = new FormData();
    form.append('file', file);
    return handleResponse<{ url: string; key: string }>(
      await fetchWithAuth('/media/upload/content', {
        method: 'POST',
        body: form,
      }),
    );
  },
};

// ─── Admin ───
export const adminApi = {
  // Users
  async getUsers(params?: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.role) qs.set('role', params.role);
    if (params?.sortBy) qs.set('sortBy', params.sortBy);
    if (params?.sortOrder) qs.set('sortOrder', params.sortOrder);
    return handleResponse<{ data: any[]; meta: any }>(
      await fetchWithAuth(`/admin/users?${qs.toString()}`),
    );
  },
  async banUser(userId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/users/${userId}/ban`, { method: 'POST' }),
    );
  },
  async unbanUser(userId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/users/${userId}/unban`, { method: 'POST' }),
    );
  },
  async promoteToAdmin(userId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/users/${userId}/promote`, { method: 'POST' }),
    );
  },

  // Articles
  async getArticles(params?: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    if (params?.status) qs.set('status', params.status);
    if (params?.sortBy) qs.set('sortBy', params.sortBy);
    if (params?.sortOrder) qs.set('sortOrder', params.sortOrder);
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(`/admin/articles?${qs.toString()}`),
    );
  },
  async featureArticle(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/articles/${articleId}/feature`, {
        method: 'POST',
      }),
    );
  },
  async unfeatureArticle(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/articles/${articleId}/unfeature`, {
        method: 'POST',
      }),
    );
  },
  async archiveArticle(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/articles/${articleId}/archive`, {
        method: 'POST',
      }),
    );
  },
  async deleteArticle(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/articles/${articleId}`, { method: 'DELETE' }),
    );
  },

  // Comments
  async getComments(params?: {
    page?: number;
    limit?: number;
    status?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.status) qs.set('status', params.status);
    return handleResponse<{ data: Comment[]; meta: any }>(
      await fetchWithAuth(`/admin/comments?${qs.toString()}`),
    );
  },
  async approveComment(commentId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/comments/${commentId}/approve`, {
        method: 'POST',
      }),
    );
  },
  async hideComment(commentId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/comments/${commentId}/hide`, {
        method: 'POST',
      }),
    );
  },
  async deleteComment(commentId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/comments/${commentId}`, { method: 'DELETE' }),
    );
  },
};

// ─── Helpers ───
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  return !!localStorage.getItem('accessToken');
}

export function getCurrentUser(): any | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    return JSON.parse(atob(token.split('.')[1]));
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
}
