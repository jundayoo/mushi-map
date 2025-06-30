import AsyncStorage from '@react-native-async-storage/async-storage';
import { authService } from './authService';

export interface InsectPost {
  id: string;
  name: string;
  scientificName: string;
  location: string;
  description: string;
  environment: string;
  isPublic: boolean;
  images: string[];
  timestamp: string;
  user: {
    id: string;
    displayName: string;
    avatar: string;
  };
  likesCount: number;
  tags: string[];
}

export interface UserProfile {
  id: string;
  displayName: string;
  email: string;
  avatar: string;
  bio: string;
  createdAt: string;
}

class StorageService {
  private readonly POSTS_KEY = '@mushi_map_posts';
  private readonly USER_KEY = '@mushi_map_user';
  private readonly SETTINGS_KEY = '@mushi_map_settings';

  // 投稿関連
  async savePosts(posts: InsectPost[]): Promise<void> {
    try {
      await AsyncStorage.setItem(this.POSTS_KEY, JSON.stringify(posts));
    } catch (error) {
      console.error('投稿保存エラー:', error);
      throw new Error('投稿の保存に失敗しました');
    }
  }

  async getPosts(): Promise<InsectPost[]> {
    try {
      const postsJson = await AsyncStorage.getItem(this.POSTS_KEY);
      return postsJson ? JSON.parse(postsJson) : [];
    } catch (error) {
      console.error('投稿取得エラー:', error);
      return [];
    }
  }

  async addPost(post: Omit<InsectPost, 'id' | 'user' | 'likesCount' | 'tags'>): Promise<InsectPost> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }

      const posts = await this.getPosts();
      
      const newPost: InsectPost = {
        ...post,
        id: Date.now().toString(),
        user: {
          id: currentUser.id,
          displayName: currentUser.displayName,
          avatar: currentUser.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=anonymous',
        },
        likesCount: 0,
        tags: this.generateTags(post.name, post.environment),
      };

      const updatedPosts = [newPost, ...posts];
      await this.savePosts(updatedPosts);
      
      return newPost;
    } catch (error) {
      console.error('投稿追加エラー:', error);
      throw new Error('投稿の追加に失敗しました');
    }
  }

  async updatePost(postId: string, updates: Partial<InsectPost>): Promise<void> {
    try {
      const posts = await this.getPosts();
      const updatedPosts = posts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      );
      await this.savePosts(updatedPosts);
    } catch (error) {
      console.error('投稿更新エラー:', error);
      throw new Error('投稿の更新に失敗しました');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      const posts = await this.getPosts();
      const filteredPosts = posts.filter(post => post.id !== postId);
      await this.savePosts(filteredPosts);
    } catch (error) {
      console.error('投稿削除エラー:', error);
      throw new Error('投稿の削除に失敗しました');
    }
  }

  async likePost(postId: string): Promise<void> {
    try {
      const posts = await this.getPosts();
      const updatedPosts = posts.map(post => 
        post.id === postId 
          ? { ...post, likesCount: post.likesCount + 1 } 
          : post
      );
      await this.savePosts(updatedPosts);
    } catch (error) {
      console.error('いいねエラー:', error);
      throw new Error('いいねに失敗しました');
    }
  }

  // ユーザー関連
  async saveCurrentUser(user: UserProfile): Promise<void> {
    try {
      await AsyncStorage.setItem(this.USER_KEY, JSON.stringify(user));
    } catch (error) {
      console.error('ユーザー保存エラー:', error);
      throw new Error('ユーザー情報の保存に失敗しました');
    }
  }

  async getCurrentUser(): Promise<UserProfile | null> {
    try {
      const userJson = await AsyncStorage.getItem(this.USER_KEY);
      return userJson ? JSON.parse(userJson) : null;
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      return null;
    }
  }

  async clearUserData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(this.USER_KEY);
    } catch (error) {
      console.error('ユーザーデータ削除エラー:', error);
      throw new Error('ユーザーデータの削除に失敗しました');
    }
  }

  // 設定関連
  async saveSettings(settings: any): Promise<void> {
    try {
      await AsyncStorage.setItem(this.SETTINGS_KEY, JSON.stringify(settings));
    } catch (error) {
      console.error('設定保存エラー:', error);
      throw new Error('設定の保存に失敗しました');
    }
  }

  async getSettings(): Promise<any> {
    try {
      const settingsJson = await AsyncStorage.getItem(this.SETTINGS_KEY);
      return settingsJson ? JSON.parse(settingsJson) : {};
    } catch (error) {
      console.error('設定取得エラー:', error);
      return {};
    }
  }

  // 検索機能
  async searchPosts(query: string): Promise<InsectPost[]> {
    try {
      const posts = await this.getPosts();
      const lowercaseQuery = query.toLowerCase();
      
      return posts.filter(post => 
        post.name.toLowerCase().includes(lowercaseQuery) ||
        post.scientificName.toLowerCase().includes(lowercaseQuery) ||
        post.location.toLowerCase().includes(lowercaseQuery) ||
        post.description.toLowerCase().includes(lowercaseQuery) ||
        post.environment.toLowerCase().includes(lowercaseQuery) ||
        post.tags.some(tag => tag.toLowerCase().includes(lowercaseQuery))
      );
    } catch (error) {
      console.error('検索エラー:', error);
      return [];
    }
  }

  // ユーティリティ
  private generateTags(name: string, environment: string): string[] {
    const tags = [];
    
    // 昆虫名に基づくタグ
    if (name.includes('カブト')) tags.push('カブトムシ');
    if (name.includes('クワガタ')) tags.push('クワガタ');
    if (name.includes('チョウ') || name.includes('蝶')) tags.push('チョウ');
    if (name.includes('テントウ')) tags.push('テントウムシ');
    if (name.includes('カマキリ')) tags.push('カマキリ');
    
    // 環境に基づくタグ
    if (environment.includes('森') || environment.includes('林')) tags.push('森林');
    if (environment.includes('公園')) tags.push('都市部');
    if (environment.includes('川') || environment.includes('池')) tags.push('水辺');
    if (environment.includes('花') || environment.includes('草')) tags.push('草地');
    
    // 季節タグ（現在の月に基づく）
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) tags.push('春');
    else if (month >= 6 && month <= 8) tags.push('夏');
    else if (month >= 9 && month <= 11) tags.push('秋');
    else tags.push('冬');
    
    // デフォルトタグ
    tags.push('成虫');
    
    return [...new Set(tags)]; // 重複除去
  }

  // データクリア（デバッグ用）
  async clearAllData(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([this.POSTS_KEY, this.USER_KEY, this.SETTINGS_KEY]);
    } catch (error) {
      console.error('データクリアエラー:', error);
      throw new Error('データのクリアに失敗しました');
    }
  }

  // 統計情報
  async getStatistics(): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalSpecies: number;
    totalLocations: number;
  }> {
    try {
      const posts = await this.getPosts();
      const species = new Set(posts.map(post => post.name));
      const locations = new Set(posts.map(post => post.location));
      const totalLikes = posts.reduce((sum, post) => sum + post.likesCount, 0);
      
      return {
        totalPosts: posts.length,
        totalLikes,
        totalSpecies: species.size,
        totalLocations: locations.size,
      };
    } catch (error) {
      console.error('統計取得エラー:', error);
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalSpecies: 0,
        totalLocations: 0,
      };
    }
  }
}

export const storageService = new StorageService();