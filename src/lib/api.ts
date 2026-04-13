// API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    this.token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
  }

  setToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('access_token', token);
    }
  }

  removeToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user');
    }
  }

  private async request<T>(endpoint: string, options: FetchOptions = {}): Promise<T> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers || {}),
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      // Token expired - try refresh
      const refreshed = await this.refreshToken();
      if (refreshed) {
        // Retry with new token
        headers['Authorization'] = `Bearer ${this.token}`;
        const retryResponse = await fetch(`${this.baseUrl}${endpoint}`, {
          ...options,
          headers,
        });
        if (!retryResponse.ok) {
          const error = await retryResponse.json();
          throw new Error(error.error || error.detail || 'Request failed');
        }
        return retryResponse.json();
      } else {
        this.removeToken();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication required');
      }
    }

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Request failed' }));
      throw new Error(error.error || error.detail || 'Request failed');
    }

    return response.json();
  }

  async refreshToken(): Promise<boolean> {
    const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refresh_token') : null;
    if (!refreshToken) return false;

    try {
      const response = await fetch(`${this.baseUrl}/auth/token/refresh/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) return false;

      const data = await response.json();
      this.setToken(data.access);
      return true;
    } catch {
      return false;
    }
  }

  // Auth endpoints
  async register(data: { username: string; email: string; first_name: string; password: string; password_confirm: string }) {
    return this.request<{ user: any; access_token: string; refresh_token: string; message: string }>('/auth/register/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async login(username: string, password: string) {
    return this.request<{ user: any; access_token: string; refresh_token: string; message: string }>('/auth/login/', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async getProfile() {
    return this.request<any>('/auth/profile/');
  }

  async updateProfile(data: { bio?: string }) {
    return this.request<any>('/auth/profile/', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  // Courses/RichContent endpoints
  async getRichContents(params?: { search?: string; ordering?: string }) {
    const query = new URLSearchParams(params as any).toString();
    return this.request<any>(`/courses/?${query}`);
  }

  async getRichContent(id: number) {
    return this.request<any>(`/courses/${id}/`);
  }

  async getRichContentPreview(id: number) {
    return this.request<any>(`/courses/${id}/preview/`);
  }

  async createRichContent(data: { title: string; content: string; is_published?: boolean; media_blocks?: any[]; terms?: any[]; accordion_sections?: any[] }) {
    return this.request<any>('/courses/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Upload media block file (updates existing block by index)
  async uploadMediaBlock(contentId: number, mediaBlockId: number, formData: FormData) {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/courses/${contentId}/media/${mediaBlockId}/`, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || error.detail || 'Upload failed');
    }

    return response.json();
  }

  // Upload term media block file (updates existing block)
  async uploadTermMediaBlock(contentId: number, termId: number, mediaBlockId: number, formData: FormData) {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    const response = await fetch(`${this.baseUrl}/courses/${contentId}/terms/${termId}/media/${mediaBlockId}/`, {
      method: 'PATCH',
      headers,
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Upload failed' }));
      throw new Error(error.error || error.detail || 'Upload failed');
    }

    return response.json();
  }
}

export const api = new ApiClient(API_BASE_URL);
export default api;
