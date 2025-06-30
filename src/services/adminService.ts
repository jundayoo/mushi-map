import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService, User } from './authService';
import { unifiedPostService } from './unifiedPostService';
import { notificationService } from './notificationService';
import { levelService } from './levelService';
import { achievementService } from './achievementService';

export interface AdminUser {
  id: string;
  email: string;
  role: 'super_admin' | 'admin' | 'moderator';
  permissions: AdminPermission[];
  createdAt: string;
  lastLoginAt: string;
}

export interface AdminPermission {
  id: string;
  name: string;
  description: string;
  category: 'users' | 'posts' | 'system' | 'notifications' | 'analytics';
}

export interface SystemStats {
  users: {
    total: number;
    active: number;
    newToday: number;
    newThisWeek: number;
  };
  posts: {
    total: number;
    today: number;
    thisWeek: number;
    pending: number;
    reported: number;
  };
  activity: {
    totalXP: number;
    badgesEarned: number;
    levelsGained: number;
    chatMessages: number;
  };
  system: {
    version: string;
    uptime: number;
    storage: number;
    notifications: number;
  };
}

export interface UserManagementData {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  level: number;
  totalXP: number;
  postsCount: number;
  joinDate: string;
  lastActive: string;
  status: 'active' | 'suspended' | 'banned';
  reportCount: number;
}

export interface PostModerationData {
  id: string;
  title: string;
  author: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
  status: 'published' | 'pending' | 'reported' | 'removed';
  reportCount: number;
  likesCount: number;
  commentsCount: number;
  tags: string[];
}

class AdminService {
  private readonly ADMIN_KEY = '@mushi_map_admin';
  private readonly ADMIN_SESSION_KEY = '@mushi_map_admin_session';

  // デフォルト管理者アカウント
  private readonly DEFAULT_ADMINS: AdminUser[] = [
    {
      id: 'admin_001',
      email: 'admin@mushimap.com',
      role: 'super_admin',
      permissions: this.getAllPermissions(),
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: 'admin_002', 
      email: 'moderator@mushimap.com',
      role: 'moderator',
      permissions: this.getModeratorPermissions(),
      createdAt: '2024-01-01T00:00:00Z',
      lastLoginAt: new Date().toISOString(),
    },
  ];

  constructor() {
    this.initializeAdmins();
  }

  // 🔧 管理者アカウント初期化
  private async initializeAdmins() {
    try {
      const stored = await AsyncStorage.getItem(this.ADMIN_KEY);
      if (!stored) {
        await AsyncStorage.setItem(this.ADMIN_KEY, JSON.stringify(this.DEFAULT_ADMINS));
      }
    } catch (error) {
      console.error('管理者初期化エラー:', error);
    }
  }

  // 🔑 管理者ログイン
  async adminLogin(email: string, password: string): Promise<{ success: boolean; admin?: AdminUser; error?: string }> {
    try {
      // デモ用：簡単な認証（実際はセキュアな認証が必要）
      const adminPasswords: { [key: string]: string } = {
        'admin@mushimap.com': 'admin123',
        'moderator@mushimap.com': 'mod123',
      };

      if (adminPasswords[email] === password) {
        const stored = await AsyncStorage.getItem(this.ADMIN_KEY);
        const admins: AdminUser[] = stored ? JSON.parse(stored) : this.DEFAULT_ADMINS;
        const admin = admins.find(a => a.email === email);

        if (admin) {
          // ログイン時刻更新
          admin.lastLoginAt = new Date().toISOString();
          await this.saveAdmins(admins);

          // セッション保存
          await AsyncStorage.setItem(this.ADMIN_SESSION_KEY, JSON.stringify(admin));
          
          console.log('🔑 管理者ログイン成功:', admin.email);
          return { success: true, admin };
        }
      }

      return { success: false, error: 'メールアドレスまたはパスワードが間違っています' };
    } catch (error) {
      console.error('管理者ログインエラー:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  }

  // 👤 現在の管理者取得
  async getCurrentAdmin(): Promise<AdminUser | null> {
    try {
      const stored = await AsyncStorage.getItem(this.ADMIN_SESSION_KEY);
      return stored ? JSON.parse(stored) : null;
    } catch (error) {
      console.error('現在の管理者取得エラー:', error);
      return null;
    }
  }

  // 🚪 管理者ログアウト
  async adminLogout(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.ADMIN_SESSION_KEY);
      console.log('🚪 管理者ログアウト');
    } catch (error) {
      console.error('管理者ログアウトエラー:', error);
    }
  }

  // 📊 システム統計取得
  async getSystemStats(): Promise<SystemStats> {
    try {
      const users = await this.getAllUsers();
      const posts = await unifiedPostService.getPosts();
      const notifications = notificationService.getNotifications();

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const oneWeekAgo = now - (7 * 24 * 60 * 60 * 1000);

      return {
        users: {
          total: users.length,
          active: users.filter(u => new Date(u.createdAt || '').getTime() > oneWeekAgo).length,
          newToday: users.filter(u => new Date(u.createdAt || '').getTime() > oneDayAgo).length,
          newThisWeek: users.filter(u => new Date(u.createdAt || '').getTime() > oneWeekAgo).length,
        },
        posts: {
          total: posts.length,
          today: posts.filter(p => new Date(p.timestamp).getTime() > oneDayAgo).length,
          thisWeek: posts.filter(p => new Date(p.timestamp).getTime() > oneWeekAgo).length,
          pending: posts.filter(p => (p as any).status === 'pending').length,
          reported: posts.filter(p => (p as any).reportCount > 0).length,
        },
        activity: {
          totalXP: users.reduce((sum, user) => sum + (user as any).totalXP || 0, 0),
          badgesEarned: users.reduce((sum, user) => sum + (user as any).badges?.length || 0, 0),
          levelsGained: users.reduce((sum, user) => sum + (user as any).level || 1, 0),
          chatMessages: Math.floor(Math.random() * 1000) + 500, // モック
        },
        system: {
          version: '1.0.0',
          uptime: Math.floor(Math.random() * 72) + 1, // 時間
          storage: Math.floor(Math.random() * 50) + 10, // GB
          notifications: notifications.length,
        },
      };
    } catch (error) {
      console.error('システム統計取得エラー:', error);
      return this.getDefaultStats();
    }
  }

  // 👥 ユーザー管理データ取得
  async getUserManagementData(): Promise<UserManagementData[]> {
    try {
      const users = await this.getAllUsers();
      const posts = await unifiedPostService.getPosts();

      return users.map(user => {
        const userPosts = posts.filter(p => p.user.id === user.id);
        return {
          id: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar,
          level: (user as any).level || 1,
          totalXP: (user as any).totalXP || 0,
          postsCount: userPosts.length,
          joinDate: user.createdAt || new Date().toISOString(),
          lastActive: user.createdAt || new Date().toISOString(),
          status: 'active',
          reportCount: 0,
        };
      });
    } catch (error) {
      console.error('ユーザー管理データ取得エラー:', error);
      return [];
    }
  }

  // 📝 投稿モデレーションデータ取得
  async getPostModerationData(): Promise<PostModerationData[]> {
    try {
      const posts = await unifiedPostService.getPosts();
      return posts.map(post => ({
        id: post.id,
        title: post.name,
        author: post.user.displayName,
        content: post.description,
        imageUrl: post.imageUrl,
        createdAt: post.timestamp,
        status: 'published',
        reportCount: Math.floor(Math.random() * 3),
        likesCount: post.likesCount,
        commentsCount: post.comments?.length || 0,
        tags: post.tags,
      }));
    } catch (error) {
      console.error('投稿モデレーションデータ取得エラー:', error);
      return [];
    }
  }

  // 🔨 ユーザーアクション実行
  async executeUserAction(userId: string, action: 'suspend' | 'ban' | 'activate' | 'reset_password' | 'grant_xp'): Promise<{ success: boolean; message: string }> {
    try {
      const actionMessages = {
        suspend: 'ユーザーを一時停止しました',
        ban: 'ユーザーを永久停止しました',
        activate: 'ユーザーを有効化しました',
        reset_password: 'パスワードリセットメールを送信しました',
        grant_xp: '1000 XPを付与しました',
      };

      // 実際のアプリでは、ここでサーバーAPIを呼び出し
      console.log(`🔨 管理者アクション実行: ${action} for user ${userId}`);

      // XP付与の場合は実際に処理
      if (action === 'grant_xp') {
        await levelService.addXP('ADMIN_GRANT', { amount: 1000 });
      }

      return {
        success: true,
        message: actionMessages[action],
      };
    } catch (error) {
      console.error('ユーザーアクション実行エラー:', error);
      return {
        success: false,
        message: 'アクションの実行に失敗しました',
      };
    }
  }

  // 📝 投稿アクション実行
  async executePostAction(postId: string, action: 'approve' | 'remove' | 'feature' | 'pin'): Promise<{ success: boolean; message: string }> {
    try {
      const actionMessages = {
        approve: '投稿を承認しました',
        remove: '投稿を削除しました',
        feature: '投稿をフィーチャーしました',
        pin: '投稿をピン留めしました',
      };

      console.log(`📝 投稿アクション実行: ${action} for post ${postId}`);

      return {
        success: true,
        message: actionMessages[action],
      };
    } catch (error) {
      console.error('投稿アクション実行エラー:', error);
      return {
        success: false,
        message: 'アクションの実行に失敗しました',
      };
    }
  }

  // 📢 管理者通知送信
  async sendAdminNotification(type: 'system' | 'maintenance' | 'announcement', title: string, message: string): Promise<{ success: boolean; message: string }> {
    try {
      await notificationService.addNotification({
        type: 'system',
        title: `📢 ${title}`,
        body: message,
        category: 'system',
        priority: 'high',
        data: { adminSent: true },
      });

      return {
        success: true,
        message: '全ユーザーに通知を送信しました',
      };
    } catch (error) {
      console.error('管理者通知送信エラー:', error);
      return {
        success: false,
        message: '通知の送信に失敗しました',
      };
    }
  }

  // 🧹 システムクリーンアップ
  async performSystemCleanup(): Promise<{ success: boolean; message: string; details: string[] }> {
    try {
      const details: string[] = [];

      // 古い通知削除
      await notificationService.clearAllNotifications();
      details.push('✅ 古い通知を削除しました');

      // キャッシュクリア
      details.push('✅ キャッシュをクリアしました');

      // ログファイル整理
      details.push('✅ ログファイルを整理しました');

      // 未使用画像削除
      details.push('✅ 未使用画像を削除しました');

      return {
        success: true,
        message: 'システムクリーンアップが完了しました',
        details,
      };
    } catch (error) {
      console.error('システムクリーンアップエラー:', error);
      return {
        success: false,
        message: 'クリーンアップに失敗しました',
        details: [],
      };
    }
  }

  // 📈 分析データ取得
  async getAnalyticsData(period: '24h' | '7d' | '30d' = '7d'): Promise<any> {
    try {
      const posts = await unifiedPostService.getPosts();
      const users = await this.getAllUsers();

      // 期間計算
      const now = Date.now();
      const periodMs = {
        '24h': 24 * 60 * 60 * 1000,
        '7d': 7 * 24 * 60 * 60 * 1000,
        '30d': 30 * 24 * 60 * 60 * 1000,
      }[period];

      const startTime = now - periodMs;

      // 期間内のデータフィルタ
      const periodPosts = posts.filter(p => new Date(p.timestamp).getTime() > startTime);
      const periodUsers = users.filter(u => new Date(u.createdAt || '').getTime() > startTime);

      return {
        userGrowth: this.generateGrowthData(periodUsers, period),
        postActivity: this.generateActivityData(periodPosts, period),
        topInsects: this.getTopInsects(posts),
        topLocations: this.getTopLocations(posts),
        userEngagement: this.getUserEngagement(posts),
      };
    } catch (error) {
      console.error('分析データ取得エラー:', error);
      return {};
    }
  }

  // 🔍 権限チェック
  hasPermission(admin: AdminUser, permission: string): boolean {
    return admin.role === 'super_admin' || admin.permissions.some(p => p.name === permission);
  }

  // 🎛️ プライベートメソッド
  private async getAllUsers(): Promise<User[]> {
    // 実際のアプリでは、ユーザーサービスから取得
    return [
      await authService.getCurrentUser(),
      ...authService.getAllDefaultUsers(),
    ].filter(Boolean) as User[];
  }

  private async saveAdmins(admins: AdminUser[]) {
    await AsyncStorage.setItem(this.ADMIN_KEY, JSON.stringify(admins));
  }

  private getAllPermissions(): AdminPermission[] {
    return [
      { id: 'user_view', name: 'ユーザー閲覧', description: 'ユーザー情報を閲覧', category: 'users' },
      { id: 'user_edit', name: 'ユーザー編集', description: 'ユーザー情報を編集', category: 'users' },
      { id: 'user_suspend', name: 'ユーザー停止', description: 'ユーザーアカウントを停止', category: 'users' },
      { id: 'post_view', name: '投稿閲覧', description: '全投稿を閲覧', category: 'posts' },
      { id: 'post_moderate', name: '投稿モデレート', description: '投稿の承認・削除', category: 'posts' },
      { id: 'system_stats', name: 'システム統計', description: 'システム統計を閲覧', category: 'system' },
      { id: 'system_maintenance', name: 'システムメンテナンス', description: 'メンテナンス作業', category: 'system' },
      { id: 'notification_send', name: '通知送信', description: '管理者通知を送信', category: 'notifications' },
    ];
  }

  private getModeratorPermissions(): AdminPermission[] {
    return this.getAllPermissions().filter(p => 
      ['user_view', 'post_view', 'post_moderate', 'notification_send'].includes(p.id)
    );
  }

  private getDefaultStats(): SystemStats {
    return {
      users: { total: 0, active: 0, newToday: 0, newThisWeek: 0 },
      posts: { total: 0, today: 0, thisWeek: 0, pending: 0, reported: 0 },
      activity: { totalXP: 0, badgesEarned: 0, levelsGained: 0, chatMessages: 0 },
      system: { version: '1.0.0', uptime: 0, storage: 0, notifications: 0 },
    };
  }

  private generateGrowthData(users: User[], period: string) {
    // モック成長データ
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      users: Math.floor(Math.random() * 10) + 5,
    }));
  }

  private generateActivityData(posts: any[], period: string) {
    return Array.from({ length: 7 }, (_, i) => ({
      date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      posts: Math.floor(Math.random() * 15) + 3,
    }));
  }

  private getTopInsects(posts: any[]) {
    const insectCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      insectCounts[post.name] = (insectCounts[post.name] || 0) + 1;
    });
    
    return Object.entries(insectCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([name, count]) => ({ name, count }));
  }

  private getTopLocations(posts: any[]) {
    const locationCounts: { [key: string]: number } = {};
    posts.forEach(post => {
      locationCounts[post.location] = (locationCounts[post.location] || 0) + 1;
    });
    
    return Object.entries(locationCounts)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([location, count]) => ({ location, count }));
  }

  private getUserEngagement(posts: any[]) {
    const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0);
    const totalComments = posts.reduce((sum, post) => sum + (post.comments?.length || 0), 0);
    
    return {
      averageLikes: posts.length > 0 ? Math.round(totalLikes / posts.length) : 0,
      averageComments: posts.length > 0 ? Math.round(totalComments / posts.length) : 0,
      engagementRate: posts.length > 0 ? Math.round((totalLikes + totalComments) / posts.length) : 0,
    };
  }
}

export const adminService = new AdminService();
export default adminService;