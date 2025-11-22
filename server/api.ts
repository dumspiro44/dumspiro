
import { WPSettings, WPPost, TranslationJob } from '../types';

const API_BASE = '/api'; // Nginx will proxy this to backend:3001

export class API {
  private static getHeaders() {
    const token = localStorage.getItem('auth_token');
    return {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : ''
    };
  }

  static async login(username: string, password: string): Promise<boolean> {
    try {
      const res = await fetch(`${API_BASE}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('auth_token', data.token);
        return true;
      }
      return false;
    } catch (e) {
      console.error("Login error", e);
      return false;
    }
  }

  static async getSettings(): Promise<WPSettings> {
    const res = await fetch(`${API_BASE}/settings`, { headers: this.getHeaders() });
    if (!res.ok) throw new Error('Failed to fetch settings');
    return res.json();
  }

  static async saveSettings(settings: WPSettings): Promise<boolean> {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    return res.ok;
  }

  static async getPosts(): Promise<WPPost[]> {
    const res = await fetch(`${API_BASE}/posts`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  static async validateConnection(settings: WPSettings): Promise<boolean> {
    const res = await fetch(`${API_BASE}/connect`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(settings),
    });
    const data = await res.json();
    return data.valid;
  }

  static async checkPolylang(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/wp/check-polylang`, { 
        method: 'POST',
        headers: this.getHeaders()
    });
    const data = await res.json();
    return data.installed;
  }

  static async installPolylang(): Promise<boolean> {
    const res = await fetch(`${API_BASE}/wp/install-polylang`, { 
        method: 'POST',
        headers: this.getHeaders()
    });
    const data = await res.json();
    return data.success;
  }

  static async getJobs(): Promise<TranslationJob[]> {
    const res = await fetch(`${API_BASE}/jobs`, { headers: this.getHeaders() });
    if (!res.ok) return [];
    return res.json();
  }

  static async createJobs(postIds: number[], targetLangs: string[]): Promise<void> {
    await fetch(`${API_BASE}/translate`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ postId: postIds, targetLangs }),
    });
  }
}
