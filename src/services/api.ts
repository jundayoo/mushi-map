import AsyncStorage from '@react-native-async-storage/async-storage';
import { User, Insect, CreateInsectDto, SearchInsectsDto } from '../types';

const API_BASE_URL = 'http://localhost:3001';

class ApiService {
  private async getAuthHeaders() {
    const token = await AsyncStorage.getItem('authToken');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = await this.getAuthHeaders();

    const response = await fetch(url, {
      ...options,
      headers: {
        ...headers,
        ...options.headers,
      },
    });

    if (!response.ok) {
      throw new Error(`API Error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async registerUser(userData: {
    firebaseUid: string;
    email: string;
    displayName: string;
    photoURL?: string;
  }): Promise<User> {
    return this.request<User>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getProfile(): Promise<User> {
    return this.request<User>('/users/me');
  }

  async updateProfile(userData: Partial<User>): Promise<User> {
    return this.request<User>('/users/me', {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async createInsect(insectData: CreateInsectDto): Promise<Insect> {
    return this.request<Insect>('/insects', {
      method: 'POST',
      body: JSON.stringify(insectData),
    });
  }

  async getInsects(searchParams?: SearchInsectsDto): Promise<Insect[]> {
    const params = new URLSearchParams();
    if (searchParams) {
      Object.entries(searchParams).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          if (Array.isArray(value)) {
            value.forEach(v => params.append(key, v.toString()));
          } else {
            params.append(key, value.toString());
          }
        }
      });
    }
    
    const query = params.toString();
    const endpoint = `/insects${query ? `?${query}` : ''}`;
    return this.request<Insect[]>(endpoint);
  }

  async getMyInsects(): Promise<Insect[]> {
    return this.request<Insect[]>('/insects/my');
  }

  async getInsect(id: string): Promise<Insect> {
    return this.request<Insect>(`/insects/${id}`);
  }

  async updateInsect(id: string, insectData: Partial<CreateInsectDto>): Promise<Insect> {
    return this.request<Insect>(`/insects/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(insectData),
    });
  }

  async deleteInsect(id: string): Promise<void> {
    await this.request(`/insects/${id}`, {
      method: 'DELETE',
    });
  }

  async likeInsect(id: string): Promise<void> {
    await this.request(`/insects/${id}/like`, {
      method: 'POST',
    });
  }
}

export const apiService = new ApiService();