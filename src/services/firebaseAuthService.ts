import { 
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { auth } from '../config/firebase';
import { databaseService } from './databaseService';
import { api } from './api';
import { Platform } from 'react-native';

export interface User {
  id: string;
  email: string;
  displayName: string;
  avatar?: string;
  bio?: string;
  createdAt?: string;
  firebaseUid?: string;
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

class FirebaseAuthService {
  private readonly CURRENT_USER_KEY = 'current_user';
  private currentUser: User | null = null;

  constructor() {
    // 認証状態の監視
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.syncUserData(firebaseUser);
      } else {
        this.currentUser = null;
        await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
      }
    });
  }

  private async syncUserData(firebaseUser: FirebaseUser): Promise<void> {
    try {
      const user: User = {
        id: firebaseUser.uid,
        email: firebaseUser.email || '',
        displayName: firebaseUser.displayName || 'ユーザー',
        avatar: firebaseUser.photoURL || `https://api.dicebear.com/7.x/adventurer/svg?seed=${firebaseUser.uid}`,
        firebaseUid: firebaseUser.uid,
        createdAt: firebaseUser.metadata.creationTime || new Date().toISOString()
      };

      this.currentUser = user;
      await AsyncStorage.setItem(this.CURRENT_USER_KEY, JSON.stringify(user));

      // バックエンドと同期
      try {
        await api.post('/auth/sync', {
          firebaseUid: user.id,
          email: user.email,
          displayName: user.displayName,
          avatar: user.avatar
        });
      } catch (apiError) {
        console.warn('バックエンド同期エラー:', apiError);
      }

      // ローカルデータベースと同期
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
        console.warn('ローカルDB同期エラー:', dbError);
      }
    } catch (error) {
      console.error('ユーザーデータ同期エラー:', error);
    }
  }

  async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        credentials.email,
        credentials.password
      );

      await this.syncUserData(userCredential.user);

      return { 
        success: true, 
        user: this.currentUser || undefined 
      };
    } catch (error: any) {
      console.error('ログインエラー:', error);
      
      // エラーメッセージの日本語化
      let errorMessage = 'ログインに失敗しました';
      if (error.code === 'auth/user-not-found') {
        errorMessage = 'このメールアドレスは登録されていません';
      } else if (error.code === 'auth/wrong-password') {
        errorMessage = 'パスワードが正しくありません';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません';
      } else if (error.code === 'auth/too-many-requests') {
        errorMessage = 'ログイン試行回数が多すぎます。しばらくしてからお試しください';
      }

      return { success: false, error: errorMessage };
    }
  }

  async register(data: RegisterData): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Firebaseでユーザー作成
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        data.email,
        data.password
      );

      // プロフィール情報を更新
      await updateProfile(userCredential.user, {
        displayName: data.displayName,
        photoURL: data.avatar || `https://api.dicebear.com/7.x/adventurer/svg?seed=${userCredential.user.uid}`
      });

      // ユーザーデータを同期
      await this.syncUserData(userCredential.user);

      // バックエンドにユーザー登録
      try {
        await api.post('/auth/register', {
          firebaseUid: userCredential.user.uid,
          email: data.email,
          displayName: data.displayName,
          avatar: data.avatar,
          bio: data.bio
        });
      } catch (apiError) {
        console.warn('バックエンド登録エラー:', apiError);
      }

      return { 
        success: true, 
        user: this.currentUser || undefined 
      };
    } catch (error: any) {
      console.error('登録エラー:', error);
      
      // エラーメッセージの日本語化
      let errorMessage = 'アカウント作成に失敗しました';
      if (error.code === 'auth/email-already-in-use') {
        errorMessage = 'このメールアドレスは既に登録されています';
      } else if (error.code === 'auth/weak-password') {
        errorMessage = 'パスワードは6文字以上にしてください';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'メールアドレスの形式が正しくありません';
      }

      return { success: false, error: errorMessage };
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(auth);
      this.currentUser = null;
      await AsyncStorage.removeItem(this.CURRENT_USER_KEY);
    } catch (error) {
      console.error('ログアウトエラー:', error);
      throw error;
    }
  }

  async getCurrentUser(): Promise<User | null> {
    if (this.currentUser) {
      return this.currentUser;
    }

    try {
      const userJson = await AsyncStorage.getItem(this.CURRENT_USER_KEY);
      if (userJson) {
        this.currentUser = JSON.parse(userJson);
        return this.currentUser;
      }
      return null;
    } catch (error) {
      console.error('現在のユーザー取得エラー:', error);
      return null;
    }
  }

  async isLoggedIn(): Promise<boolean> {
    return auth.currentUser !== null;
  }

  async updateProfile(updates: Partial<User>): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        return { success: false, error: 'ログインが必要です' };
      }

      // Firebaseプロフィールを更新
      const profileUpdates: any = {};
      if (updates.displayName) profileUpdates.displayName = updates.displayName;
      if (updates.avatar) profileUpdates.photoURL = updates.avatar;

      if (Object.keys(profileUpdates).length > 0) {
        await updateProfile(currentUser, profileUpdates);
      }

      // ローカルデータを更新
      await this.syncUserData(currentUser);

      // バックエンドを更新
      try {
        await api.put('/users/profile', {
          firebaseUid: currentUser.uid,
          ...updates
        });
      } catch (apiError) {
        console.warn('バックエンドプロフィール更新エラー:', apiError);
      }

      return { 
        success: true, 
        user: this.currentUser || undefined 
      };
    } catch (error) {
      console.error('プロフィール更新エラー:', error);
      return { success: false, error: 'プロフィールの更新に失敗しました' };
    }
  }

  async signInWithGoogle(): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      if (Platform.OS === 'web') {
        // Web環境でのGoogle認証
        const provider = new GoogleAuthProvider();
        provider.setCustomParameters({
          prompt: 'select_account'
        });
        
        const result = await signInWithPopup(auth, provider);
        await this.syncUserData(result.user);
        
        return { 
          success: true, 
          user: this.currentUser || undefined 
        };
      } else {
        // React Native環境では、GoogleSignin等のライブラリが必要
        // 現時点では未実装
        return { 
          success: false, 
          error: 'モバイル環境でのGoogle認証は準備中です' 
        };
      }
    } catch (error: any) {
      console.error('Google認証エラー:', error);
      
      let errorMessage = 'Google認証に失敗しました';
      if (error.code === 'auth/popup-closed-by-user') {
        errorMessage = '認証がキャンセルされました';
      } else if (error.code === 'auth/popup-blocked') {
        errorMessage = 'ポップアップがブロックされています';
      }
      
      return { success: false, error: errorMessage };
    }
  }

  // 認証状態の変更を監視
  onAuthStateChanged(callback: (user: User | null) => void): () => void {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await this.syncUserData(firebaseUser);
        callback(this.currentUser);
      } else {
        callback(null);
      }
    });

    return unsubscribe;
  }
}

export const firebaseAuthService = new FirebaseAuthService();