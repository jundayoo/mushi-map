import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';

export interface CachedData {
  id: string;
  type: 'insect' | 'post' | 'user' | 'discovery' | 'chat';
  data: any;
  timestamp: number;
  expiresAt?: number;
  size: number; // バイト数
}

export interface OfflineAction {
  id: string;
  type: 'create' | 'update' | 'delete' | 'like' | 'comment';
  endpoint: string;
  method: 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  data: any;
  timestamp: number;
  retryCount: number;
  maxRetries: number;
}

export interface CacheStats {
  totalItems: number;
  totalSize: number; // バイト
  expiredItems: number;
  diskUsage: string;
  lastCleanup: number;
}

class OfflineService {
  private readonly CACHE_PREFIX = '@mushi_map_cache_';
  private readonly OFFLINE_ACTIONS_KEY = '@mushi_map_offline_actions';
  private readonly CACHE_STATS_KEY = '@mushi_map_cache_stats';
  private readonly MAX_CACHE_SIZE = 50 * 1024 * 1024; // 50MB
  private readonly DEFAULT_CACHE_TTL = 24 * 60 * 60 * 1000; // 24時間
  
  private connectionListeners: Array<(isConnected: boolean) => void> = [];
  private isOnline = true;
  private syncInProgress = false;

  constructor() {
    this.initializeNetworkMonitoring();
    this.schedulePeriodicCleanup();
  }

  // 🌐 ネットワーク監視の初期化
  private initializeNetworkMonitoring() {
    NetInfo.addEventListener(state => {
      const wasOnline = this.isOnline;
      this.isOnline = state.isConnected ?? false;
      
      if (!wasOnline && this.isOnline) {
        console.log('🌐 オンラインに復帰しました');
        this.syncOfflineActions();
      } else if (wasOnline && !this.isOnline) {
        console.log('📱 オフラインモードに切り替わりました');
      }

      // リスナーに通知
      this.connectionListeners.forEach(listener => {
        listener(this.isOnline);
      });
    });
  }

  // 📡 接続状態監視リスナーの追加
  addConnectionListener(listener: (isConnected: boolean) => void) {
    this.connectionListeners.push(listener);
    // 現在の状態を即座に通知
    listener(this.isOnline);
  }

  // 📡 接続状態監視リスナーの削除
  removeConnectionListener(listener: (isConnected: boolean) => void) {
    this.connectionListeners = this.connectionListeners.filter(l => l !== listener);
  }

  // 🌐 現在の接続状態を取得
  async getConnectionStatus(): Promise<boolean> {
    const state = await NetInfo.fetch();
    this.isOnline = state.isConnected ?? false;
    return this.isOnline;
  }

  // 💾 データのキャッシュ
  async cacheData(
    id: string, 
    type: CachedData['type'], 
    data: any, 
    ttl: number = this.DEFAULT_CACHE_TTL
  ): Promise<boolean> {
    try {
      const serializedData = JSON.stringify(data);
      const size = new Blob([serializedData]).size;
      
      const cachedItem: CachedData = {
        id,
        type,
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
        size,
      };

      await AsyncStorage.setItem(
        `${this.CACHE_PREFIX}${type}_${id}`,
        JSON.stringify(cachedItem)
      );

      await this.updateCacheStats();
      await this.enforceMaxCacheSize();

      console.log(`💾 キャッシュ保存完了: ${type}/${id} (${this.formatBytes(size)})`);
      return true;
    } catch (error) {
      console.error('キャッシュ保存エラー:', error);
      return false;
    }
  }

  // 📖 キャッシュからデータを取得
  async getCachedData(id: string, type: CachedData['type']): Promise<any | null> {
    try {
      const cached = await AsyncStorage.getItem(`${this.CACHE_PREFIX}${type}_${id}`);
      if (!cached) return null;

      const cachedItem: CachedData = JSON.parse(cached);
      
      // 有効期限チェック
      if (cachedItem.expiresAt && Date.now() > cachedItem.expiresAt) {
        await this.removeCachedData(id, type);
        return null;
      }

      console.log(`📖 キャッシュヒット: ${type}/${id}`);
      return cachedItem.data;
    } catch (error) {
      console.error('キャッシュ読み込みエラー:', error);
      return null;
    }
  }

  // 🗑️ キャッシュデータの削除
  async removeCachedData(id: string, type: CachedData['type']): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(`${this.CACHE_PREFIX}${type}_${id}`);
      await this.updateCacheStats();
      return true;
    } catch (error) {
      console.error('キャッシュ削除エラー:', error);
      return false;
    }
  }

  // 📝 オフラインアクションの保存
  async saveOfflineAction(action: Omit<OfflineAction, 'id' | 'timestamp' | 'retryCount'>): Promise<string> {
    try {
      const actionId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const fullAction: OfflineAction = {
        ...action,
        id: actionId,
        timestamp: Date.now(),
        retryCount: 0,
      };

      const existingActions = await this.getOfflineActions();
      existingActions.push(fullAction);

      await AsyncStorage.setItem(
        this.OFFLINE_ACTIONS_KEY,
        JSON.stringify(existingActions)
      );

      console.log(`📝 オフラインアクション保存: ${action.type} ${action.endpoint}`);
      return actionId;
    } catch (error) {
      console.error('オフラインアクション保存エラー:', error);
      throw error;
    }
  }

  // 📋 オフラインアクションの取得
  async getOfflineActions(): Promise<OfflineAction[]> {
    try {
      const stored = await AsyncStorage.getItem(this.OFFLINE_ACTIONS_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.error('オフラインアクション取得エラー:', error);
      return [];
    }
  }

  // 🔄 オフラインアクションの同期
  async syncOfflineActions(): Promise<{ success: number; failed: number }> {
    if (this.syncInProgress || !this.isOnline) {
      return { success: 0, failed: 0 };
    }

    this.syncInProgress = true;
    let successCount = 0;
    let failedCount = 0;

    try {
      const actions = await this.getOfflineActions();
      const pendingActions = actions.filter(action => action.retryCount < action.maxRetries);

      console.log(`🔄 オフラインアクション同期開始: ${pendingActions.length}件`);

      for (const action of pendingActions) {
        try {
          await this.executeAction(action);
          successCount++;
          
          // 成功したアクションを削除
          await this.removeOfflineAction(action.id);
        } catch (error) {
          console.error(`アクション実行失敗: ${action.id}`, error);
          failedCount++;
          
          // リトライ回数を増やす
          action.retryCount++;
          if (action.retryCount >= action.maxRetries) {
            await this.removeOfflineAction(action.id);
          } else {
            await this.updateOfflineAction(action);
          }
        }
      }

      if (successCount > 0) {
        Alert.alert(
          '同期完了',
          `${successCount}件のオフライン操作を同期しました`,
          [{ text: 'OK' }]
        );
      }

      console.log(`🔄 同期完了: 成功${successCount}件, 失敗${failedCount}件`);
    } catch (error) {
      console.error('同期処理エラー:', error);
    } finally {
      this.syncInProgress = false;
    }

    return { success: successCount, failed: failedCount };
  }

  // ⚡ アクションの実行
  private async executeAction(action: OfflineAction): Promise<void> {
    // 実際のアプリでは fetch を使用してAPIを呼び出す
    console.log(`⚡ アクション実行: ${action.method} ${action.endpoint}`);
    
    // デモ用の遅延
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // 10%の確率で失敗をシミュレート
    if (Math.random() < 0.1) {
      throw new Error('ネットワークエラー（シミュレート）');
    }
  }

  // 🗑️ オフラインアクションの削除
  private async removeOfflineAction(actionId: string): Promise<void> {
    const actions = await this.getOfflineActions();
    const filteredActions = actions.filter(action => action.id !== actionId);
    await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(filteredActions));
  }

  // ✏️ オフラインアクションの更新
  private async updateOfflineAction(updatedAction: OfflineAction): Promise<void> {
    const actions = await this.getOfflineActions();
    const actionIndex = actions.findIndex(action => action.id === updatedAction.id);
    
    if (actionIndex >= 0) {
      actions[actionIndex] = updatedAction;
      await AsyncStorage.setItem(this.OFFLINE_ACTIONS_KEY, JSON.stringify(actions));
    }
  }

  // 📊 キャッシュ統計の更新
  private async updateCacheStats(): Promise<void> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      let totalSize = 0;
      let expiredItems = 0;
      const now = Date.now();

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const item: CachedData = JSON.parse(cached);
            totalSize += item.size;
            
            if (item.expiresAt && now > item.expiresAt) {
              expiredItems++;
            }
          }
        } catch (error) {
          // 破損したキャッシュアイテムをスキップ
        }
      }

      const stats: CacheStats = {
        totalItems: cacheKeys.length,
        totalSize,
        expiredItems,
        diskUsage: this.formatBytes(totalSize),
        lastCleanup: now,
      };

      await AsyncStorage.setItem(this.CACHE_STATS_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error('キャッシュ統計更新エラー:', error);
    }
  }

  // 📊 キャッシュ統計の取得
  async getCacheStats(): Promise<CacheStats> {
    try {
      const stored = await AsyncStorage.getItem(this.CACHE_STATS_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('キャッシュ統計取得エラー:', error);
    }

    return {
      totalItems: 0,
      totalSize: 0,
      expiredItems: 0,
      diskUsage: '0 B',
      lastCleanup: 0,
    };
  }

  // 🧹 期限切れキャッシュのクリーンアップ
  async cleanupExpiredCache(): Promise<{ removed: number; freedBytes: number }> {
    let removedCount = 0;
    let freedBytes = 0;

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      const now = Date.now();

      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const item: CachedData = JSON.parse(cached);
            
            if (item.expiresAt && now > item.expiresAt) {
              await AsyncStorage.removeItem(key);
              removedCount++;
              freedBytes += item.size;
            }
          }
        } catch (error) {
          // 破損したアイテムも削除
          await AsyncStorage.removeItem(key);
          removedCount++;
        }
      }

      await this.updateCacheStats();
      
      console.log(`🧹 クリーンアップ完了: ${removedCount}件削除, ${this.formatBytes(freedBytes)}解放`);
    } catch (error) {
      console.error('クリーンアップエラー:', error);
    }

    return { removed: removedCount, freedBytes };
  }

  // 📏 キャッシュサイズ制限の強制
  private async enforceMaxCacheSize(): Promise<void> {
    const stats = await this.getCacheStats();
    
    if (stats.totalSize <= this.MAX_CACHE_SIZE) {
      return;
    }

    console.log('📏 キャッシュサイズ上限に達しました、古いアイテムを削除中...');

    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      // タイムスタンプでソート（古いものから削除）
      const items: Array<{ key: string; item: CachedData }> = [];
      
      for (const key of cacheKeys) {
        try {
          const cached = await AsyncStorage.getItem(key);
          if (cached) {
            const item: CachedData = JSON.parse(cached);
            items.push({ key, item });
          }
        } catch (error) {
          // 破損したアイテムは削除対象に含める
          await AsyncStorage.removeItem(key);
        }
      }

      // 古い順にソート
      items.sort((a, b) => a.item.timestamp - b.item.timestamp);

      let currentSize = stats.totalSize;
      let removedCount = 0;

      for (const { key, item } of items) {
        if (currentSize <= this.MAX_CACHE_SIZE * 0.8) { // 80%まで削減
          break;
        }

        await AsyncStorage.removeItem(key);
        currentSize -= item.size;
        removedCount++;
      }

      await this.updateCacheStats();
      console.log(`📏 サイズ制限強制: ${removedCount}件削除`);
    } catch (error) {
      console.error('サイズ制限強制エラー:', error);
    }
  }

  // 🕐 定期クリーンアップのスケジュール
  private schedulePeriodicCleanup(): void {
    // 1時間ごとにクリーンアップ
    setInterval(() => {
      this.cleanupExpiredCache();
    }, 60 * 60 * 1000);
  }

  // 🗑️ 全キャッシュのクリア
  async clearAllCache(): Promise<boolean> {
    try {
      const keys = await AsyncStorage.getAllKeys();
      const cacheKeys = keys.filter(key => key.startsWith(this.CACHE_PREFIX));
      
      await AsyncStorage.multiRemove(cacheKeys);
      await this.updateCacheStats();
      
      console.log(`🗑️ 全キャッシュクリア: ${cacheKeys.length}件削除`);
      return true;
    } catch (error) {
      console.error('キャッシュクリアエラー:', error);
      return false;
    }
  }

  // 🛠️ ヘルパーメソッド: バイト数の可読形式変換
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // 📱 オフライン操作のヘルパーメソッド
  async performOfflineAction(
    type: OfflineAction['type'],
    endpoint: string,
    method: OfflineAction['method'],
    data: any,
    maxRetries: number = 3
  ): Promise<string> {
    if (this.isOnline) {
      // オンラインの場合は即座に実行
      try {
        await this.executeAction({
          id: '',
          type,
          endpoint,
          method,
          data,
          timestamp: Date.now(),
          retryCount: 0,
          maxRetries,
        });
        return 'immediate_success';
      } catch (error) {
        // 失敗した場合はオフラインキューに追加
        return await this.saveOfflineAction({
          type,
          endpoint,
          method,
          data,
          maxRetries,
        });
      }
    } else {
      // オフラインの場合はキューに追加
      return await this.saveOfflineAction({
        type,
        endpoint,
        method,
        data,
        maxRetries,
      });
    }
  }
}

export const offlineService = new OfflineService();
export default offlineService;