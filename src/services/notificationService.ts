import { Alert, Platform, Vibration } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';

export interface NotificationData {
  id: string;
  type: 'new_post' | 'level_up' | 'badge_earned' | 'chat_message' | 'live_stream' | 'discovery_nearby' | 'achievement' | 'system';
  title: string;
  body: string;
  data?: any;
  userId?: string;
  timestamp: number;
  isRead: boolean;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  category: 'social' | 'achievement' | 'discovery' | 'system';
  actionButtons?: {
    text: string;
    action: string;
  }[];
  imageUrl?: string;
  sound?: 'default' | 'success' | 'achievement' | 'discovery' | 'urgent';
}

export interface NotificationSettings {
  enabled: boolean;
  social: boolean;
  achievements: boolean;
  discoveries: boolean;
  system: boolean;
  sound: boolean;
  vibration: boolean;
  quietHours: {
    enabled: boolean;
    start: string; // "22:00"
    end: string;   // "07:00"
  };
  location: boolean;
}

class NotificationService {
  private notifications: NotificationData[] = [];
  private listeners: ((notifications: NotificationData[]) => void)[] = [];
  private webSocketMock: any = null;
  private settings: NotificationSettings = {
    enabled: true,
    social: true,
    achievements: true,
    discoveries: true,
    system: true,
    sound: true,
    vibration: true,
    quietHours: {
      enabled: false,
      start: "22:00",
      end: "07:00"
    },
    location: true,
  };

  constructor() {
    this.loadNotifications();
    this.loadSettings();
    this.configureNotifications();
    this.startRealtimeListening();
  }

  // 🔧 通知設定
  private configureNotifications = async () => {
    // Expo Notifications設定
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: this.settings.sound,
        shouldSetBadge: true,
      }),
    });

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'むしマップ',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#4CAF50',
        sound: 'default',
      });

      // 各カテゴリー別チャンネル
      await Notifications.setNotificationChannelAsync('achievements', {
        name: '実績・レベルアップ',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 100, 100, 100],
        lightColor: '#FFC107',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('social', {
        name: 'チャット・ソーシャル',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 150, 150, 150],
        lightColor: '#2196F3',
        sound: 'default',
      });

      await Notifications.setNotificationChannelAsync('discoveries', {
        name: '新しい発見',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 200, 200, 200],
        lightColor: '#4CAF50',
        sound: 'default',
      });
    }
  };

  // 🔄 リアルタイムリスニング開始
  private startRealtimeListening = () => {
    // WebSocketモック（実際のアプリではWebSocket接続）
    this.webSocketMock = setInterval(() => {
      // ランダムで通知を生成（テスト用）
      if (Math.random() < 0.1) { // 10%の確率
        this.generateMockNotification();
      }
    }, 10000); // 10秒間隔でチェック
  };

  // 🎲 モック通知生成（テスト用）
  private generateMockNotification = () => {
    const mockNotifications = [
      {
        type: 'new_post' as const,
        title: '🆕 新しい投稿',
        body: 'タナカさんが珍しいクワガタを発見しました！',
        category: 'social' as const,
        priority: 'normal' as const,
        imageUrl: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=200&q=80',
      },
      {
        type: 'discovery_nearby' as const,
        title: '📍 近くで発見',
        body: 'あなたの周辺500m以内で新しい昆虫が発見されました',
        category: 'discovery' as const,
        priority: 'high' as const,
        imageUrl: 'https://images.unsplash.com/photo-1444927714506-8492d94b5ba0?w=200&q=80',
      },
      {
        type: 'chat_message' as const,
        title: '💬 新しいメッセージ',
        body: 'ムシ愛好家グループに新しいメッセージがあります',
        category: 'social' as const,
        priority: 'normal' as const,
      },
      {
        type: 'live_stream' as const,
        title: '📺 ライブ配信開始',
        body: 'ヤマダさんがクワガタ採集のライブ配信を開始しました',
        category: 'social' as const,
        priority: 'normal' as const,
      },
    ];

    const randomNotification = mockNotifications[Math.floor(Math.random() * mockNotifications.length)];
    this.addNotification(randomNotification);
  };

  // ➕ 通知追加
  addNotification = async (notificationData: Partial<NotificationData>) => {
    const notification: NotificationData = {
      id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: notificationData.type || 'system',
      title: notificationData.title || '通知',
      body: notificationData.body || '',
      data: notificationData.data,
      userId: notificationData.userId,
      timestamp: Date.now(),
      isRead: false,
      priority: notificationData.priority || 'normal',
      category: notificationData.category || 'system',
      actionButtons: notificationData.actionButtons,
      imageUrl: notificationData.imageUrl,
      sound: notificationData.sound || 'default',
    };

    // 静音時間チェック
    if (this.isQuietHours()) {
      notification.priority = 'low';
    }

    // 設定に基づく通知フィルタリング
    if (!this.shouldShowNotification(notification)) {
      return;
    }

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();

    // プッシュ通知送信
    await this.sendPushNotification(notification);

    // ハプティクス・振動
    this.triggerHaptics(notification);

    console.log('🔔 新しい通知:', notification.title);
  };

  // 📱 プッシュ通知送信
  private sendPushNotification = async (notification: NotificationData) => {
    if (!this.settings.enabled) return;

    try {
      const channelId = notification.category === 'achievement' ? 'achievements' :
                       notification.category === 'social' ? 'social' :
                       notification.category === 'discovery' ? 'discoveries' : 'default';

      await Notifications.scheduleNotificationAsync({
        content: {
          title: notification.title,
          body: notification.body,
          data: notification.data,
          sound: this.settings.sound ? 'default' : false,
          badge: this.getUnreadCount(),
          categoryIdentifier: notification.category,
        },
        trigger: null, // 即座に表示
        identifier: notification.id,
      });
    } catch (error) {
      console.error('プッシュ通知送信エラー:', error);
    }
  };

  // 📳 ハプティクス・振動
  private triggerHaptics = (notification: NotificationData) => {
    if (!this.settings.vibration) return;

    const vibrationPatterns = {
      low: [100],
      normal: [0, 150, 100, 150],
      high: [0, 200, 100, 200, 100, 200],
      urgent: [0, 300, 200, 300, 200, 300],
    };

    const pattern = vibrationPatterns[notification.priority] || vibrationPatterns.normal;
    Vibration.vibrate(pattern);
  };

  // 🔇 静音時間チェック
  private isQuietHours = (): boolean => {
    if (!this.settings.quietHours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    
    const start = this.settings.quietHours.start;
    const end = this.settings.quietHours.end;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      return currentTime >= start || currentTime <= end;
    }
  };

  // 🎯 通知表示判定
  private shouldShowNotification = (notification: NotificationData): boolean => {
    if (!this.settings.enabled) return false;

    switch (notification.category) {
      case 'social':
        return this.settings.social;
      case 'achievement':
        return this.settings.achievements;
      case 'discovery':
        return this.settings.discoveries;
      case 'system':
        return this.settings.system;
      default:
        return true;
    }
  };

  // 📖 通知を既読にする
  markAsRead = async (notificationId: string) => {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      notification.isRead = true;
      this.saveNotifications();
      this.notifyListeners();
    }
  };

  // 📖 全て既読
  markAllAsRead = async () => {
    this.notifications.forEach(n => n.isRead = true);
    this.saveNotifications();
    this.notifyListeners();
    
    // バッジカウントリセット
    await Notifications.setBadgeCountAsync(0);
  };

  // 🗑️ 通知削除
  deleteNotification = async (notificationId: string) => {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();

    // プッシュ通知もキャンセル
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  };

  // 🗑️ 全削除
  clearAllNotifications = async () => {
    this.notifications = [];
    this.saveNotifications();
    this.notifyListeners();
    
    await Notifications.cancelAllScheduledNotificationsAsync();
    await Notifications.setBadgeCountAsync(0);
  };

  // 📊 未読数取得
  getUnreadCount = (): number => {
    return this.notifications.filter(n => !n.isRead).length;
  };

  // 📋 通知一覧取得
  getNotifications = (): NotificationData[] => {
    return [...this.notifications];
  };

  // 📋 カテゴリー別通知取得
  getNotificationsByCategory = (category: string): NotificationData[] => {
    return this.notifications.filter(n => n.category === category);
  };

  // 👂 リスナー登録
  addListener = (callback: (notifications: NotificationData[]) => void) => {
    this.listeners.push(callback);
    callback(this.notifications); // 初回実行
  };

  // 👂 リスナー削除
  removeListener = (callback: (notifications: NotificationData[]) => void) => {
    this.listeners = this.listeners.filter(l => l !== callback);
  };

  // 📢 リスナー通知
  private notifyListeners = () => {
    this.listeners.forEach(listener => listener([...this.notifications]));
  };

  // ⚙️ 設定更新
  updateSettings = async (newSettings: Partial<NotificationSettings>) => {
    this.settings = { ...this.settings, ...newSettings };
    await this.saveSettings();
  };

  // ⚙️ 設定取得
  getSettings = (): NotificationSettings => {
    return { ...this.settings };
  };

  // 💾 通知保存
  private saveNotifications = async () => {
    try {
      const notificationsToSave = this.notifications.slice(0, 100); // 最新100件のみ保存
      await AsyncStorage.setItem('notifications', JSON.stringify(notificationsToSave));
    } catch (error) {
      console.error('通知保存エラー:', error);
    }
  };

  // 📂 通知読み込み
  private loadNotifications = async () => {
    try {
      const saved = await AsyncStorage.getItem('notifications');
      if (saved) {
        this.notifications = JSON.parse(saved);
      }
    } catch (error) {
      console.error('通知読み込みエラー:', error);
    }
  };

  // 💾 設定保存
  private saveSettings = async () => {
    try {
      await AsyncStorage.setItem('notificationSettings', JSON.stringify(this.settings));
    } catch (error) {
      console.error('設定保存エラー:', error);
    }
  };

  // 📂 設定読み込み
  private loadSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notificationSettings');
      if (saved) {
        this.settings = { ...this.settings, ...JSON.parse(saved) };
      }
    } catch (error) {
      console.error('設定読み込みエラー:', error);
    }
  };

  // 🔄 権限リクエスト
  requestPermissions = async (): Promise<boolean> => {
    try {
      const { status } = await Notifications.requestPermissionsAsync();
      return status === 'granted';
    } catch (error) {
      console.error('通知権限リクエストエラー:', error);
      return false;
    }
  };

  // 🧹 クリーンアップ
  cleanup = () => {
    if (this.webSocketMock) {
      clearInterval(this.webSocketMock);
    }
    this.listeners = [];
  };

  // 🎯 特定タイプの通知生成（外部から呼び出し用）
  sendLevelUpNotification = (newLevel: number, title: string) => {
    this.addNotification({
      type: 'level_up',
      title: '🎉 レベルアップ！',
      body: `おめでとうございます！レベル${newLevel} ${title}になりました`,
      category: 'achievement',
      priority: 'high',
      sound: 'achievement',
    });
  };

  sendBadgeEarnedNotification = (badgeName: string, badgeIcon: string) => {
    this.addNotification({
      type: 'badge_earned',
      title: '🏆 新しいバッジ獲得！',
      body: `${badgeIcon} ${badgeName}を獲得しました`,
      category: 'achievement',
      priority: 'high',
      sound: 'achievement',
    });
  };

  sendNewPostNotification = (userName: string, insectName: string) => {
    this.addNotification({
      type: 'new_post',
      title: '📸 新しい投稿',
      body: `${userName}さんが${insectName}を発見しました`,
      category: 'social',
      priority: 'normal',
    });
  };

  sendNearbyDiscoveryNotification = (insectName: string, distance: number) => {
    this.addNotification({
      type: 'discovery_nearby',
      title: '📍 近くで発見',
      body: `${distance}m先で${insectName}が発見されました`,
      category: 'discovery',
      priority: 'high',
      sound: 'discovery',
    });
  };
}

export const notificationService = new NotificationService();
export default notificationService;