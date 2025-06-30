import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Crypto from 'expo-crypto';
import { databaseService } from './databaseService';
import { googleAuthService, GoogleUser } from './googleAuthService';
import { firebaseAuthService } from './firebaseAuthService';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  displayName: string;
  avatar?: string;
  bio?: string;
}

// Firebase認証を使用するかどうかのフラグ
const USE_FIREBASE_AUTH = true;

class AuthService {
  private readonly CURRENT_USER_KEY = 'current_user';
  private readonly USER_SESSIONS_KEY = 'user_sessions';
  private readonly SALT_ROUNDS = 10;

  private async hashPassword(password: string): Promise<string> {
    try {
      // ソルトを追加してセキュリティを強化
      const salt = Math.random().toString(36).substring(2, 15);
      const saltedPassword = password + salt;
      
      const hashedPassword = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      // ソルトとハッシュを結合して保存
      return `${salt}:${hashedPassword}`;
    } catch (error) {
      console.error('パスワードハッシュ化エラー:', error);
      throw new Error('パスワードの暗号化に失敗しました');
    }
  }

  private async verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    try {
      const [salt, hash] = hashedPassword.split(':');
      if (!salt || !hash) {
        return false;
      }
      
      const saltedPassword = password + salt;
      const computedHash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        saltedPassword,
        { encoding: Crypto.CryptoEncoding.HEX }
      );
      
      return computedHash === hash;
    } catch (error) {
      console.error('パスワード検証エラー:', error);
      return false;
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.login(credentials);
    }
    
    // 既存のローカル認証
    try {
      const sessions = await this.getUserSessions();
      const userSession = sessions.find(session => session.email === credentials.email);

      if (!userSession) {
        return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
      }

      // Googleユーザーの場合はパスワード不要
      if (userSession.isGoogleUser) {
        return { success: false, error: 'このアカウントはGoogleログインを使用してください' };
      }

      // パスワード検証（新しいハッシュ形式と古い平文の両方をサポート）
      let isValidPassword = false;
      
      if (userSession.password.includes(':')) {
        // 新しいハッシュ形式
        isValidPassword = await this.verifyPassword(credentials.password, userSession.password);
      } else {
        // 古い平文パスワード（レガシー対応）
        isValidPassword = credentials.password === userSession.password;
        
        // 平文パスワードの場合、ハッシュ化して更新
        if (isValidPassword) {
          userSession.password = await this.hashPassword(credentials.password);
          const sessions = await this.getUserSessions();
          const sessionIndex = sessions.findIndex(s => s.id === userSession.id);
          if (sessionIndex >= 0) {
            sessions[sessionIndex] = userSession;
            await AsyncStorage.setItem(this.USER_SESSIONS_KEY, JSON.stringify(sessions));
          }
        }
      }
      
      if (!isValidPassword) {
        return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
      }

      const user: User = {
        id: userSession.id,
        email: userSession.email,
        displayName: userSession.displayName,
        avatar: userSession.avatar || '',
        bio: userSession.bio || '',
        createdAt: userSession.createdAt,
      };

      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

      try {
        await databaseService.initializeDatabase();
        const dbUser = await databaseService.getUser(user.id);
        if (!dbUser) {
          await databaseService.createUser({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            avatar: user.avatar || '',
            bio: user.bio || '',
            createdAt: user.createdAt || new Date().toISOString(),
          });
        }
      } catch (dbError) {
        console.warn('データベース同期エラー:', dbError);
      }

      return { success: true, user };
    } catch (error) {
      console.error('ログインエラー:', error);
      return { success: false, error: 'ログインに失敗しました' };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.register(data);
    }
    
    // 既存のローカル認証
    try {
      const sessions = await this.getUserSessions();
      
      if (sessions.find(session => session.email === data.email)) {
        return { success: false, error: 'このメールアドレスは既に登録されています' };
      }

      const userId = `user_${Date.now()}`;
      const now = new Date().toISOString();
      
      // パスワードをハッシュ化
      const hashedPassword = await this.hashPassword(data.password);
      
      const newUserSession = {
        id: userId,
        email: data.email,
        password: hashedPassword,
        displayName: data.displayName,
        avatar: data.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userId}`,
        bio: data.bio || '',
        createdAt: now,
        isGoogleUser: false,
      };

      sessions.push(newUserSession);
      await AsyncStorage.setItem(this.USER_SESSIONS_KEY, JSON.stringify(sessions));

      const user: User = {
        id: userId,
        email: data.email,
        displayName: data.displayName,
        avatar: newUserSession.avatar,
        bio: data.bio || '',
        createdAt: now,
      };

      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

      try {
        await databaseService.initializeDatabase();
        await databaseService.createUser({
          id: user.id,
          displayName: user.displayName,
          email: user.email,
          avatar: user.avatar || '',
          bio: user.bio || '',
          createdAt: user.createdAt || new Date().toISOString(),
        });
      } catch (dbError) {
        console.warn('データベース同期エラー:', dbError);
      }

      return { success: true, user };
    } catch (error) {
      console.error('登録エラー:', error);
      return { success: false, error: 'アカウント作成に失敗しました' };
    }
  }

  async logout(): Promise<void> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.logout();
    }
    
    // 既存のローカル認証
    try {
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
    } catch (error) {
      console.error('ログアウトエラー:', error);
    }
  }

  async getCurrentUser(): Promise<User | null> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.getCurrentUser();
    }
    
    // 既存のローカル認証
    try {
      const userJson = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('現在のユーザー取得エラー:', error);
      return null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.isLoggedIn();
    }
    
    // 既存のローカル認証
    const user = await this.getCurrentUser();
    return user !== null;
  }

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.updateProfile(updates);
    }
    
    // 既存のローカル認証
    try {
      const currentUser = await this.getCurrentUser();
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      const updatedUser = { ...currentUser, ...updates };
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(updatedUser));

      const sessions = await this.getUserSessions();
      const sessionIndex = sessions.findIndex(session => session.id === currentUser.id);
      if (sessionIndex >= 0) {
        sessions[sessionIndex] = { ...sessions[sessionIndex], ...updates };
        await AsyncStorage.setItem(this.USER_SESSIONS_KEY, JSON.stringify(sessions));
      }

      return { success: true, user: updatedUser };
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return { success: false, error: 'プロフィールの更新に失敗しました' };
    }
  }

  private async getUserSessions(): Promise<any[]> {
    try {
      const sessionsJson = await AsyncStorage.getItem(this.USER_SESSIONS_KEY);
      return sessionsJson ? JSON.parse(sessionsJson) : [];
    } catch (error) {
      console.error('セッション取得エラー:', error);
      return [];
    }
  }

  async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    // Firebase認証を使用する場合
    if (USE_FIREBASE_AUTH) {
      return await firebaseAuthService.signInWithGoogle();
    }
    
    // 既存のローカル認証
    try {
      const googleResult = await googleAuthService.signInWithGoogle();
      
      if (!googleResult.success || !googleResult.user) {
        return { success: false, error: googleResult.error || 'Google認証に失敗しました' };
      }

      const googleUser = googleResult.user;
      
      // 既存のGoogleアカウントユーザーを確認
      const sessions = await this.getUserSessions();
      let existingUser = sessions.find(session => session.email === googleUser.email);

      if (!existingUser) {
        // 新規Googleユーザーを作成
        const userId = `google_${googleUser.id}`;
        const now = new Date().toISOString();
        
        existingUser = {
          id: userId,
          email: googleUser.email,
          password: '', // Googleアカウントはパスワード不要
          displayName: googleUser.name,
          avatar: googleUser.picture,
          bio: `Googleアカウントでログインしました。${googleUser.given_name}です！`,
          createdAt: now,
          isGoogleUser: true,
        };

        sessions.push(existingUser);
        await AsyncStorage.setItem(this.USER_SESSIONS_KEY, JSON.stringify(sessions));
      }

      const user: User = {
        id: existingUser.id,
        email: existingUser.email,
        displayName: existingUser.displayName,
        avatar: existingUser.avatar || googleUser.picture,
        bio: existingUser.bio || '',
        createdAt: existingUser.createdAt,
      };

      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

      // データベースにも保存
      try {
        await databaseService.initializeDatabase();
        const dbUser = await databaseService.getUser(user.id);
        if (!dbUser) {
          await databaseService.createUser({
            id: user.id,
            displayName: user.displayName,
            email: user.email,
            avatar: user.avatar || '',
            bio: user.bio || '',
            createdAt: user.createdAt || new Date().toISOString(),
          });
        }
      } catch (dbError) {
        console.warn('データベース同期エラー:', dbError);
      }

      return { success: true, user };
    } catch (error) {
      console.error('Google認証エラー:', error);
      return { success: false, error: 'Google認証処理中にエラーが発生しました' };
    }
  }

  async createDefaultUsers(): Promise<void> {
    try {
      const sessions = await this.getUserSessions();
      if (sessions.length === 0) {
        // デフォルトユーザーのパスワードをハッシュ化
        const hashedDemo123 = await this.hashPassword('demo123');
        const hashedHanako123 = await this.hashPassword('hanako123');
        
        const defaultUsers = [
          {
            id: 'user_demo1',
            email: 'demo@mushimap.com',
            password: hashedDemo123,
            displayName: '昆虫太郎',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=taro',
            bio: '昆虫観察歴15年のベテランです。カブトムシとクワガタが大好きです！',
            createdAt: new Date().toISOString(),
            isGoogleUser: false,
          },
          {
            id: 'user_demo2',
            email: 'hanako@mushimap.com',
            password: hashedHanako123,
            displayName: '虫好き花子',
            avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=hanako',
            bio: 'チョウやテントウムシなど、美しい昆虫の撮影が趣味です。',
            createdAt: new Date().toISOString(),
            isGoogleUser: false,
          },
        ];

        await AsyncStorage.setItem(this.USER_SESSIONS_KEY, JSON.stringify(defaultUsers));
        console.log('デフォルトユーザーを作成しました（パスワードはハッシュ化済み）');
      }
    } catch (error) {
      console.error('デフォルトユーザー作成エラー:', error);
    }
  }
}

export const authService = new AuthService();