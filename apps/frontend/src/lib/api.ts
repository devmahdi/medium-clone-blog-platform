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
        localStorage.removeItem('user');
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
  subtitle?: string;
  coverImageUrl?: string;
  tags?: string[];
  status: 'draft' | 'published' | 'archived';
  viewCount: number;
  likeCount: number;
  commentCount: number;
  readingTimeMinutes?: number;
  author: {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
    bio?: string;
  };
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  isBookmarked?: boolean;
}

// NOTE: Articles module not implemented in backend yet
// These endpoints are placeholders for future implementation
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
    return handleResponse<Article>(await fetchWithAuth(`/articles/${slug}`));
  },

  async create(data: {
    title: string;
    content: string;
    excerpt?: string;
    subtitle?: string;
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
      subtitle?: string;
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

  async search(query: string, page = 1, limit = 20) {
    const qs = new URLSearchParams({
      q: query,
      page: String(page),
      limit: String(limit),
    });
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(`/articles/search?${qs.toString()}`),
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

// ─── Feed ───
export const feedApi = {
  /**
   * Get personalized feed from followed authors
   * Requires authentication
   */
  async getPersonalized(params?: {
    page?: number;
    limit?: number;
    tag?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(`/feed/personalized?${qs.toString()}`),
    );
  },

  /**
   * Get explore feed (global, all published articles)
   * Public endpoint
   */
  async getExplore(params?: {
    page?: number;
    limit?: number;
    sortBy?: 'recent' | 'popular' | 'trending';
    tag?: string;
    dateFrom?: string;
    dateTo?: string;
  }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.sortBy) qs.set('sortBy', params.sortBy);
    if (params?.tag) qs.set('tag', params.tag);
    if (params?.dateFrom) qs.set('dateFrom', params.dateFrom);
    if (params?.dateTo) qs.set('dateTo', params.dateTo);
    const url = `/feed/explore?${qs.toString()}`;
    // Public endpoint, but still use fetchWithAuth to include token if available
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(url),
    );
  },
};

// ─── Bookmarks ───
export const bookmarksApi = {
  async getAll(page = 1, limit = 20) {
    return handleResponse<{ data: Article[]; meta: any }>(
      await fetchWithAuth(`/bookmarks?page=${page}&limit=${limit}`),
    );
  },
  async add(postId: string) {
    return handleResponse(
      await fetchWithAuth('/bookmarks', {
        method: 'POST',
        body: JSON.stringify({ postId }),
      }),
    );
  },
  async remove(articleId: string) {
    return handleResponse(
      await fetchWithAuth(`/bookmarks/${articleId}`, { method: 'DELETE' }),
    );
  },
  async isBookmarked(articleId: string) {
    try {
      const response = await fetchWithAuth(`/bookmarks/check/${articleId}`);
      const data = await handleResponse<{ isBookmarked: boolean }>(response);
      return data.isBookmarked;
    } catch {
      return false;
    }
  },
};

// ─── Claps ───
export const clapsApi = {
  async add(articleId: string, count = 1) {
    return handleResponse<{
      userClaps: number;
      totalClaps: number;
      added: number;
      message: string;
    }>(
      await fetchWithAuth(`/claps/articles/${articleId}`, {
        method: 'POST',
        body: JSON.stringify({ count }),
      }),
    );
  },
  async getCount(articleId: string) {
    return handleResponse<{
      totalClaps: number;
      userClaps: number;
      maxClaps: number;
      canClap: boolean;
    }>(await fetchWithAuth(`/claps/articles/${articleId}`));
  },
};

// ─── Comments ───
export interface Comment {
  id: string;
  content: string;
  status: string;
  likeCount: number;
  isEdited: boolean;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
    fullName?: string;
    avatarUrl?: string;
  };
  canEdit: boolean;
  canDelete: boolean;
  replies?: Comment[];
}

export const commentsApi = {
  /**
   * Get comments for an article (nested tree structure)
   */
  async getByArticle(articleId: string) {
    return handleResponse<{ comments: Comment[]; total: number }>(
      await fetchWithAuth(`/comments/articles/${articleId}`),
    );
  },

  /**
   * Create a top-level comment on an article
   */
  async create(articleId: string, content: string) {
    return handleResponse<Comment>(
      await fetchWithAuth(`/comments/articles/${articleId}`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    );
  },

  /**
   * Reply to an existing comment
   */
  async reply(commentId: string, content: string) {
    return handleResponse<Comment>(
      await fetchWithAuth(`/comments/${commentId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      }),
    );
  },

  /**
   * Update a comment
   */
  async update(commentId: string, content: string) {
    return handleResponse<Comment>(
      await fetchWithAuth(`/comments/${commentId}`, {
        method: 'PATCH',
        body: JSON.stringify({ content }),
      }),
    );
  },

  /**
   * Delete a comment (soft delete)
   */
  async delete(commentId: string) {
    return handleResponse(
      await fetchWithAuth(`/comments/${commentId}`, { method: 'DELETE' }),
    );
  },
};

// ─── Tags ───
// NOTE: Tags module not implemented in backend yet
export const tagsApi = {
  async getTrending(limit = 10) {
    return handleResponse<{ data: any[] }>(
      await fetchWithAuth(`/tags/trending?limit=${limit}`),
    );
  },
  async getAll(params?: { page?: number; limit?: number; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    return handleResponse<{ data: any[]; meta: any }>(
      await fetchWithAuth(`/tags?${qs.toString()}`),
    );
  },
};

// ─── Stats ───
// NOTE: Stats module not implemented in backend yet
export const statsApi = {
  async getOverview() {
    return handleResponse<{
      totalUsers: number;
      totalArticles: number;
      totalComments: number;
      totalViews: number;
    }>(await fetchWithAuth('/stats/overview'));
  },
  async getGrowth(period: 'week' | 'month' | 'year' = 'month') {
    return handleResponse<{
      users: any[];
      articles: any[];
      comments: any[];
      views: any[];
    }>(await fetchWithAuth(`/stats/growth?period=${period}`));
  },
};

// ─── Media ───
export const mediaApi = {
  async uploadAvatar(file: File) {
    const form = new FormData();
    form.append('file', file);
    return handleResponse<{ url: string; key: string }>(
      await fetchWithAuth('/media/upload/avatar', {
        method: 'POST',
        body: form,
      }),
    );
  },
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
  async delete(fileKey: string) {
    return handleResponse(
      await fetchWithAuth(`/media/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
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

  // Tags
  async getTags(params?: { page?: number; limit?: number; search?: string }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    if (params?.search) qs.set('search', params.search);
    return handleResponse<{ data: any[]; meta: any }>(
      await fetchWithAuth(`/admin/tags?${qs.toString()}`),
    );
  },
  async createTag(name: string, description?: string) {
    return handleResponse(
      await fetchWithAuth('/admin/tags', {
        method: 'POST',
        body: JSON.stringify({ name, description }),
      }),
    );
  },
  async updateTag(tagId: string, data: { name?: string; description?: string }) {
    return handleResponse(
      await fetchWithAuth(`/admin/tags/${tagId}`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    );
  },
  async deleteTag(tagId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/tags/${tagId}`, { method: 'DELETE' }),
    );
  },
  async mergeTags(sourceTagId: string, targetTagId: string) {
    return handleResponse(
      await fetchWithAuth(`/admin/tags/${sourceTagId}/merge`, {
        method: 'POST',
        body: JSON.stringify({ targetTagId }),
      }),
    );
  },

  // Settings
  async getSettings() {
    return handleResponse<any>(await fetchWithAuth('/admin/settings'));
  },
  async updateSettings(data: any) {
    return handleResponse(
      await fetchWithAuth('/admin/settings', {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
    );
  },

  // Media
  async getMediaFiles(params?: { page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.page) qs.set('page', String(params.page));
    if (params?.limit) qs.set('limit', String(params.limit));
    return handleResponse<{ data: any[]; meta: any }>(
      await fetchWithAuth(`/admin/media?${qs.toString()}`),
    );
  },
  async deleteMediaFile(fileKey: string) {
    return handleResponse(
      await fetchWithAuth(`/media/${encodeURIComponent(fileKey)}`, {
        method: 'DELETE',
      }),
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
  const userStr = localStorage.getItem('user');
  if (userStr) {
    try {
      return JSON.parse(userStr);
    } catch {}
  }
  // Fallback: decode from token
  const token = localStorage.getItem('accessToken');
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return {
      id: payload.sub,
      email: payload.email,
      username: payload.username,
      role: payload.role,
    };
  } catch {
    return null;
  }
}

export function isAdmin(): boolean {
  const user = getCurrentUser();
  return user?.role === 'ADMIN';
}

export function logout() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
  }
}
