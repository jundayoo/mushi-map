import AsyncStorage from '@react-native-async-storage/async-storage';
import { databaseService } from './databaseService';
import { authService } from './authService';
import { collectionService } from './collectionService';

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

class UnifiedPostService {
  private readonly POSTS_KEY = '@mushi_map_posts';

  async initializeDataSync(): Promise<void> {
    try {
      await databaseService.initializeDatabase();
      await this.syncData();
    } catch (error) {
      console.error('データ同期初期化エラー:', error);
    }
  }

  async syncData(): Promise<void> {
    try {
      const asyncPosts = await this.getAsyncStoragePosts();
      const dbPosts = await this.getDatabasePosts();
      
      await this.reconcileData(asyncPosts, dbPosts);
    } catch (error) {
      console.error('データ同期エラー:', error);
    }
  }

  async addPost(post: Omit<InsectPost, 'id' | 'user' | 'likesCount' | 'tags'>): Promise<InsectPost> {
    try {
      const currentUser = await authService.getCurrentUser();
      if (!currentUser) {
        throw new Error('ユーザーがログインしていません');
      }

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

      const asyncPosts = await this.getAsyncStoragePosts();
      const updatedPosts = [newPost, ...asyncPosts];
      
      await AsyncStorage.setItem(this.POSTS_KEY, JSON.stringify(updatedPosts));

      try {
        await databaseService.createPost(newPost);
      } catch (dbError) {
        console.warn('データベース保存エラー（AsyncStorageには保存済み）:', dbError);
      }

      // コレクション発見記録
      try {
        await collectionService.recordDiscovery(newPost.id);
        console.log('昆虫発見記録完了:', newPost.id);
      } catch (collectionError) {
        console.warn('昆虫発見記録失敗:', collectionError);
      }
      
      return newPost;
    } catch (error) {
      console.error('投稿追加エラー:', error);
      throw new Error('投稿の追加に失敗しました');
    }
  }

  async getPosts(): Promise<InsectPost[]> {
    try {
      const asyncPosts = await this.getAsyncStoragePosts();
      
      try {
        const dbPosts = await this.getDatabasePosts();
        return this.mergePostData(asyncPosts, dbPosts);
      } catch (dbError) {
        console.warn('データベースから投稿取得失敗、AsyncStorageデータを使用:', dbError);
        return asyncPosts;
      }
    } catch (error) {
      console.error('投稿取得エラー:', error);
      return [];
    }
  }

  async getUserPosts(userId: string): Promise<InsectPost[]> {
    try {
      const allPosts = await this.getPosts();
      return allPosts.filter(post => post.user.id === userId);
    } catch (error) {
      console.error('ユーザー投稿取得エラー:', error);
      return [];
    }
  }

  async updatePost(postId: string, updates: Partial<InsectPost>): Promise<void> {
    try {
      const asyncPosts = await this.getAsyncStoragePosts();
      const updatedPosts = asyncPosts.map(post => 
        post.id === postId ? { ...post, ...updates } : post
      );
      
      await AsyncStorage.setItem(this.POSTS_KEY, JSON.stringify(updatedPosts));
      console.log('投稿更新完了（AsyncStorage）:', postId);
    } catch (error) {
      console.error('投稿更新エラー:', error);
      throw new Error('投稿の更新に失敗しました');
    }
  }

  async deletePost(postId: string): Promise<void> {
    try {
      const asyncPosts = await this.getAsyncStoragePosts();
      const filteredPosts = asyncPosts.filter(post => post.id !== postId);
      
      await AsyncStorage.setItem(this.POSTS_KEY, JSON.stringify(filteredPosts));
      console.log('投稿削除完了（AsyncStorage）:', postId);
    } catch (error) {
      console.error('投稿削除エラー:', error);
      throw new Error('投稿の削除に失敗しました');
    }
  }

  private async getAsyncStoragePosts(): Promise<InsectPost[]> {
    try {
      const postsJson = await AsyncStorage.getItem(this.POSTS_KEY);
      return postsJson ? JSON.parse(postsJson) : [];
    } catch (error) {
      console.error('AsyncStorage投稿取得エラー:', error);
      return [];
    }
  }

  private async getDatabasePosts(): Promise<InsectPost[]> {
    try {
      const dbPosts = await databaseService.getPosts();
      return dbPosts;
    } catch (error) {
      console.error('データベース投稿取得エラー:', error);
      return [];
    }
  }

  private mergePostData(asyncPosts: InsectPost[], dbPosts: InsectPost[]): InsectPost[] {
    const postMap = new Map<string, InsectPost>();
    
    dbPosts.forEach(post => postMap.set(post.id, post));
    
    asyncPosts.forEach(post => {
      if (postMap.has(post.id)) {
        postMap.set(post.id, { ...postMap.get(post.id)!, ...post });
      } else {
        postMap.set(post.id, post);
      }
    });
    
    return Array.from(postMap.values()).sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }

  private async reconcileData(asyncPosts: InsectPost[], dbPosts: InsectPost[]): Promise<void> {
    try {
      const asyncIds = new Set(asyncPosts.map(p => p.id));
      const dbIds = new Set(dbPosts.map(p => p.id));
      
      for (const post of asyncPosts) {
        if (!dbIds.has(post.id)) {
          try {
            await databaseService.createPost(post);
          } catch (error) {
            console.warn(`データベースへの投稿同期失敗 (ID: ${post.id}):`, error);
          }
        }
      }
      
      for (const post of dbPosts) {
        if (!asyncIds.has(post.id)) {
          const asyncPost: InsectPost = {
            id: post.id,
            name: post.name,
            scientificName: post.scientificName,
            location: post.location,
            description: post.description,
            environment: post.environment,
            isPublic: post.isPublic,
            images: post.images,
            timestamp: post.timestamp,
            user: post.user,
            likesCount: post.likesCount,
            tags: post.tags,
          };
          asyncPosts.push(asyncPost);
        }
      }
      
      if (asyncPosts.length > 0) {
        await AsyncStorage.setItem(this.POSTS_KEY, JSON.stringify(asyncPosts));
      }
    } catch (error) {
      console.error('データ整合性確保エラー:', error);
    }
  }

  private generateTags(name: string, environment: string): string[] {
    const tags = [];
    
    if (name.includes('カブト')) tags.push('カブトムシ');
    if (name.includes('クワガタ')) tags.push('クワガタ');
    if (name.includes('チョウ') || name.includes('蝶')) tags.push('チョウ');
    if (name.includes('テントウ')) tags.push('テントウムシ');
    if (name.includes('カマキリ')) tags.push('カマキリ');
    
    if (environment.includes('森') || environment.includes('林')) tags.push('森林');
    if (environment.includes('公園')) tags.push('都市部');
    if (environment.includes('川') || environment.includes('池')) tags.push('水辺');
    if (environment.includes('花') || environment.includes('草')) tags.push('草地');
    
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) tags.push('春');
    else if (month >= 6 && month <= 8) tags.push('夏');
    else if (month >= 9 && month <= 11) tags.push('秋');
    else tags.push('冬');
    
    tags.push('成虫');
    
    return [...new Set(tags)];
  }
}

export const unifiedPostService = new UnifiedPostService();