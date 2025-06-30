import { offlineService } from './offlineService';
import { unifiedPostService, InsectPost } from './unifiedPostService';
import { authService } from './authService';

class EnhancedOfflineService {
  private readonly OFFLINE_POSTS_KEY = '@mushi_map_offline_posts';
  private readonly OFFLINE_LIKES_KEY = '@mushi_map_offline_likes';
  private readonly OFFLINE_COMMENTS_KEY = '@mushi_map_offline_comments';

  // 📝 オフライン投稿の作成
  async createOfflinePost(postData: {
    name: string;
    scientificName: string;
    description: string;
    images: string[];
    location: string;
    coordinates?: { latitude: number; longitude: number };
    tags: string[];
  }): Promise<string> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      const offlinePost: InsectPost = {
        id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        name: postData.name,
        scientificName: postData.scientificName,
        description: postData.description,
        images: postData.images,
        location: postData.location,
        coordinates: postData.coordinates,
        tags: postData.tags,
        timestamp: new Date().toISOString(),
        user: {
          id: user.id,
          displayName: user.displayName,
          avatar: user.avatar,
        },
        likesCount: 0,
        isLiked: false,
        commentsCount: 0,
        aiConfidence: 0.85, // デフォルト値
        isOffline: true, // オフライン投稿フラグ
      };

      // ローカルに保存
      await this.saveOfflinePostLocally(offlinePost);

      // オフラインアクションに追加
      await offlineService.saveOfflineAction({
        type: 'create',
        endpoint: '/api/posts',
        method: 'POST',
        data: postData,
        maxRetries: 5,
      });

      console.log('📝 オフライン投稿作成完了:', offlinePost.id);
      return offlinePost.id;
    } catch (error) {
      console.error('オフライン投稿作成エラー:', error);
      throw error;
    }
  }

  // 👍 オフラインいいね
  async createOfflineLike(postId: string): Promise<void> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      const likeData = {
        postId,
        userId: user.id,
        timestamp: new Date().toISOString(),
      };

      // ローカルに保存
      await this.saveOfflineLikeLocally(likeData);

      // オフラインアクションに追加
      await offlineService.saveOfflineAction({
        type: 'like',
        endpoint: `/api/posts/${postId}/like`,
        method: 'POST',
        data: likeData,
        maxRetries: 3,
      });

      console.log('👍 オフラインいいね完了:', postId);
    } catch (error) {
      console.error('オフラインいいねエラー:', error);
      throw error;
    }
  }

  // 💬 オフラインコメント
  async createOfflineComment(postId: string, content: string): Promise<string> {
    try {
      const user = await authService.getCurrentUser();
      if (!user) {
        throw new Error('ユーザーが見つかりません');
      }

      const commentData = {
        id: `offline_comment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        postId,
        userId: user.id,
        content,
        timestamp: new Date().toISOString(),
        user: {
          displayName: user.displayName,
          avatar: user.avatar,
        },
      };

      // ローカルに保存
      await this.saveOfflineCommentLocally(commentData);

      // オフラインアクションに追加
      await offlineService.saveOfflineAction({
        type: 'comment',
        endpoint: `/api/posts/${postId}/comments`,
        method: 'POST',
        data: commentData,
        maxRetries: 3,
      });

      console.log('💬 オフラインコメント完了:', commentData.id);
      return commentData.id;
    } catch (error) {
      console.error('オフラインコメントエラー:', error);
      throw error;
    }
  }

  // 💾 オフライン投稿の自動キャッシュ
  async cachePopularPosts(): Promise<void> {
    try {
      const isOnline = await offlineService.getConnectionStatus();
      if (!isOnline) {
        console.log('オフラインのため、投稿キャッシュをスキップ');
        return;
      }

      // 人気の投稿を取得してキャッシュ
      const popularPosts = await unifiedPostService.getPopularPosts();
      
      for (const post of popularPosts.slice(0, 20)) { // 上位20件をキャッシュ
        await offlineService.cacheData(
          post.id,
          'post',
          post,
          24 * 60 * 60 * 1000 // 24時間
        );

        // 画像もキャッシュ（実際のアプリでは画像ダウンロード）
        for (const imageUrl of post.images) {
          await offlineService.cacheData(
            `image_${post.id}_${imageUrl.split('/').pop()}`,
            'insect',
            { url: imageUrl, localPath: null },
            7 * 24 * 60 * 60 * 1000 // 7日間
          );
        }
      }

      console.log('💾 人気投稿のキャッシュ完了');
    } catch (error) {
      console.error('投稿キャッシュエラー:', error);
    }
  }

  // 📱 オフライン投稿の取得
  async getOfflinePosts(): Promise<InsectPost[]> {
    try {
      return await this.getOfflinePostsLocally();
    } catch (error) {
      console.error('オフライン投稿取得エラー:', error);
      return [];
    }
  }

  // 🔄 ハイブリッド投稿リスト（オンライン + オフライン）
  async getHybridPosts(): Promise<InsectPost[]> {
    try {
      const isOnline = await offlineService.getConnectionStatus();
      let onlinePosts: InsectPost[] = [];
      
      if (isOnline) {
        try {
          onlinePosts = await unifiedPostService.getAllPosts();
        } catch (error) {
          console.log('オンライン投稿取得失敗、キャッシュから取得');
          // キャッシュから取得
          onlinePosts = await this.getCachedPosts();
        }
      } else {
        // オフライン時はキャッシュから取得
        onlinePosts = await this.getCachedPosts();
      }

      // オフライン投稿を取得
      const offlinePosts = await this.getOfflinePosts();

      // 統合してタイムスタンプでソート
      const allPosts = [...onlinePosts, ...offlinePosts]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

      console.log(`🔄 ハイブリッド投稿リスト: オンライン${onlinePosts.length}件, オフライン${offlinePosts.length}件`);
      return allPosts;
    } catch (error) {
      console.error('ハイブリッド投稿取得エラー:', error);
      return [];
    }
  }

  // 🏠 インテリジェントプリロード
  async intelligentPreload(): Promise<void> {
    try {
      const isOnline = await offlineService.getConnectionStatus();
      if (!isOnline) return;

      const user = await authService.getCurrentUser();
      if (!user) return;

      // ユーザーの興味のある内容を推定してプリロード
      const userPosts = await unifiedPostService.getUserPosts(user.id);
      const userTags = new Set(userPosts.flatMap(post => post.tags));
      
      // 関連する投稿をプリロード
      const allPosts = await unifiedPostService.getAllPosts();
      const relevantPosts = allPosts.filter(post => 
        post.tags.some(tag => userTags.has(tag))
      ).slice(0, 10);

      for (const post of relevantPosts) {
        await offlineService.cacheData(
          post.id,
          'post',
          post,
          12 * 60 * 60 * 1000 // 12時間
        );
      }

      console.log('🏠 インテリジェントプリロード完了');
    } catch (error) {
      console.error('インテリジェントプリロードエラー:', error);
    }
  }

  // 🔧 プライベートヘルパーメソッド

  private async saveOfflinePostLocally(post: InsectPost): Promise<void> {
    try {
      const existingPosts = await this.getOfflinePostsLocally();
      existingPosts.push(post);
      
      await offlineService.cacheData(
        'offline_posts_list',
        'post',
        existingPosts,
        30 * 24 * 60 * 60 * 1000 // 30日間
      );
    } catch (error) {
      console.error('オフライン投稿保存エラー:', error);
    }
  }

  private async getOfflinePostsLocally(): Promise<InsectPost[]> {
    try {
      const cached = await offlineService.getCachedData('offline_posts_list', 'post');
      return cached || [];
    } catch (error) {
      console.error('オフライン投稿取得エラー:', error);
      return [];
    }
  }

  private async saveOfflineLikeLocally(likeData: any): Promise<void> {
    try {
      const existingLikes = await this.getOfflineLikesLocally();
      existingLikes.push(likeData);
      
      await offlineService.cacheData(
        'offline_likes_list',
        'post',
        existingLikes,
        7 * 24 * 60 * 60 * 1000 // 7日間
      );
    } catch (error) {
      console.error('オフラインいいね保存エラー:', error);
    }
  }

  private async getOfflineLikesLocally(): Promise<any[]> {
    try {
      const cached = await offlineService.getCachedData('offline_likes_list', 'post');
      return cached || [];
    } catch (error) {
      return [];
    }
  }

  private async saveOfflineCommentLocally(commentData: any): Promise<void> {
    try {
      const existingComments = await this.getOfflineCommentsLocally();
      existingComments.push(commentData);
      
      await offlineService.cacheData(
        'offline_comments_list',
        'post',
        existingComments,
        7 * 24 * 60 * 60 * 1000 // 7日間
      );
    } catch (error) {
      console.error('オフラインコメント保存エラー:', error);
    }
  }

  private async getOfflineCommentsLocally(): Promise<any[]> {
    try {
      const cached = await offlineService.getCachedData('offline_comments_list', 'post');
      return cached || [];
    } catch (error) {
      return [];
    }
  }

  private async getCachedPosts(): Promise<InsectPost[]> {
    try {
      // キャッシュされた投稿を検索
      const cachedPosts: InsectPost[] = [];
      
      // 実際のアプリでは、AsyncStorageのキーを列挙してキャッシュされた投稿を取得
      // デモでは空の配列を返す
      
      return cachedPosts;
    } catch (error) {
      console.error('キャッシュ投稿取得エラー:', error);
      return [];
    }
  }

  // 📊 オフライン統計
  async getOfflineStats(): Promise<{
    offlinePosts: number;
    offlineLikes: number;
    offlineComments: number;
    cachedPosts: number;
    syncPending: number;
  }> {
    try {
      const [offlinePosts, offlineLikes, offlineComments, offlineActions] = await Promise.all([
        this.getOfflinePostsLocally(),
        this.getOfflineLikesLocally(),
        this.getOfflineCommentsLocally(),
        offlineService.getOfflineActions(),
      ]);

      return {
        offlinePosts: offlinePosts.length,
        offlineLikes: offlineLikes.length,
        offlineComments: offlineComments.length,
        cachedPosts: 0, // キャッシュ統計から取得
        syncPending: offlineActions.length,
      };
    } catch (error) {
      console.error('オフライン統計取得エラー:', error);
      return {
        offlinePosts: 0,
        offlineLikes: 0,
        offlineComments: 0,
        cachedPosts: 0,
        syncPending: 0,
      };
    }
  }

  // 🧹 オフラインデータのクリーンアップ
  async cleanupOfflineData(): Promise<void> {
    try {
      // 同期済みのオフラインデータを削除
      const offlineActions = await offlineService.getOfflineActions();
      
      if (offlineActions.length === 0) {
        // 同期完了済みなので、オフラインデータをクリア
        await offlineService.cacheData('offline_posts_list', 'post', [], 0);
        await offlineService.cacheData('offline_likes_list', 'post', [], 0);
        await offlineService.cacheData('offline_comments_list', 'post', [], 0);
        
        console.log('🧹 オフラインデータクリーンアップ完了');
      }
    } catch (error) {
      console.error('オフラインデータクリーンアップエラー:', error);
    }
  }
}

export const enhancedOfflineService = new EnhancedOfflineService();
export default enhancedOfflineService;