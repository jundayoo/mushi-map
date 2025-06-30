import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

export interface OfflineAction {
  id: string;
  type: 'CREATE_INSECT' | 'UPDATE_INSECT' | 'DELETE_INSECT' | 'LIKE_INSECT' | 'UNLIKE_INSECT' | 'CREATE_COMMENT';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiresAt?: number;
}

class OfflineService {
  private readonly OFFLINE_ACTIONS_KEY = 'offline_actions';
  private readonly CACHED_DATA_KEY = 'cached_data';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly DEFAULT_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

  private isOnline: boolean = true;
  private syncInProgress: boolean = false;

  constructor() {
    this.initializeNetworkListener();
  }

  private initializeNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected ?? false;

      if (wasOffline && this.isOnline) {
        this.syncOfflineActions();
      }
    });
  }

  async isConnected(): Promise<boolean> {
    const netInfo = await NetInfo.fetch();
    return netInfo.isConnected ?? false;
  }

  async addOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const newAction: OfflineAction = {
      ...action,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: Date.now(),
      retryCount: 0
    };

    const actions = await this.getOfflineActions();
    actions.push(newAction);
    
    await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
  }

  async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const actionsJson = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return actionsJson ? JSON.parse(actionsJson) : [];
    } catch (error) {
      console.error('Error getting offline actions:', error);
      return [];
    }
  }

  async syncOfflineActions(): Promise<void> {
    if (this.syncInProgress || !this.isOnline) {
      return;
    }

    this.syncInProgress = true;

    try {
      const actions = await this.getOfflineActions();
      
      for (const action of actions) {
        try {
          await this.executeOfflineAction(action);
          await this.removeOfflineAction(action.id);
        } catch (error) {
          console.error(`Failed to sync action ${action.id}:`, error);
          action.retryCount++;
          
          if (action.retryCount >= action.maxRetries) {
            await this.removeOfflineAction(action.id);
          }
        }
      }
    } catch (error) {
      console.error('Error during sync:', error);
    } finally {
      this.syncInProgress = false;
    }
  }

  private async executeOfflineAction(action: OfflineAction): Promise<void> {
    const API_BASE_URL = 'http://localhost:3000';
    
    switch (action.type) {
      case 'CREATE_INSECT':
        await fetch(`${API_BASE_URL}/insects`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${action.data.token}`
          },
          body: JSON.stringify(action.data.insect)
        });
        break;
      case 'LIKE_INSECT':
        await fetch(`${API_BASE_URL}/insects/${action.data.insectId}/like`, {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${action.data.token}` }
        });
        break;
    }
  }

  async setCachedData(key: string, data: any, expirationMs?: number): Promise<void> {
    const cachedItem: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiresAt: expirationMs ? Date.now() + expirationMs : undefined
    };

    try {
      const existingCache = await this.getAllCachedData();
      existingCache[key] = cachedItem;
      await AsyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(existingCache));
    } catch (error) {
      console.error('Error setting cached data:', error);
    }
  }

  async getCachedData(key: string): Promise<any | null> {
    try {
      const allCached = await this.getAllCachedData();
      const cachedItem = allCached[key];

      if (!cachedItem) return null;

      if (cachedItem.expiresAt && Date.now() > cachedItem.expiresAt) {
        await this.removeCachedData(key);
        return null;
      }

      return cachedItem.data;
    } catch (error) {
      console.error('Error getting cached data:', error);
      return null;
    }
  }

  private async getAllCachedData(): Promise<Record<string, CachedData>> {
    try {
      const cachedJson = await AsyncStorage.getItem(this.CACHED_DATA_KEY);
      return cachedJson ? JSON.parse(cachedJson) : {};
    } catch (error) {
      return {};
    }
  }

  private async removeOfflineAction(actionId: string): Promise<void> {
    const actions = await this.getOfflineActions();
    const filteredActions = actions.filter(action => action.id !== actionId);
    await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(filteredActions));
  }

  private async removeCachedData(key: string): Promise<void> {
    const allCached = await this.getAllCachedData();
    delete allCached[key];
    await AsyncStorage.setItem(this.CACHED_DATA_KEY, JSON.stringify(allCached));
  }

  async getOfflineStatus(): Promise<{
    isOnline: boolean;
    pendingActions: number;
    cacheSize: string;
  }> {
    const actions = await this.getOfflineActions();
    const allCached = await this.getAllCachedData();
    const cacheSize = JSON.stringify(allCached).length;

    return {
      isOnline: this.isOnline,
      pendingActions: actions.length,
      cacheSize: this.formatBytes(cacheSize)
    };
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const offlineService = new OfflineService();