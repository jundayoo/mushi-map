import * as SQLite from 'expo-sqlite';
import { InsectPost, UserProfile } from './storageService';

class DatabaseService {
  private db: SQLite.SQLiteDatabase | null = null;

  async initializeDatabase(): Promise<void> {
    try {
      // データベースが既に初期化されている場合はスキップ
      if (this.db) {
        console.log('データベースは既に初期化済み');
        return;
      }

      this.db = await SQLite.openDatabaseAsync('mushiMap.db');
      await this.createTables();
      console.log('データベース初期化完了');
    } catch (error) {
      console.error('データベース初期化エラー:', error);
      // SQLiteエラーの場合はデータベースをnullにして続行
      this.db = null;
      console.warn('データベース機能は無効になりました。AsyncStorageのみ使用します。');
    }
  }

  private async createTables(): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      // ユーザーテーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          displayName TEXT NOT NULL,
          email TEXT UNIQUE NOT NULL,
          avatar TEXT,
          bio TEXT,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL
        );
      `);

      // 投稿テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS posts (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          scientificName TEXT,
          location TEXT,
          description TEXT,
          environment TEXT,
          isPublic INTEGER NOT NULL DEFAULT 1,
          timestamp TEXT NOT NULL,
          userId TEXT NOT NULL,
          likesCount INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          updatedAt TEXT NOT NULL,
          FOREIGN KEY (userId) REFERENCES users (id)
        );
      `);

      // 画像テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS images (
          id TEXT PRIMARY KEY,
          postId TEXT NOT NULL,
          uri TEXT NOT NULL,
          order_index INTEGER NOT NULL DEFAULT 0,
          createdAt TEXT NOT NULL,
          FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE
        );
      `);

      // タグテーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS tags (
          id TEXT PRIMARY KEY,
          name TEXT UNIQUE NOT NULL,
          createdAt TEXT NOT NULL
        );
      `);

      // 投稿タグ関連テーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS post_tags (
          postId TEXT NOT NULL,
          tagId TEXT NOT NULL,
          PRIMARY KEY (postId, tagId),
          FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE,
          FOREIGN KEY (tagId) REFERENCES tags (id) ON DELETE CASCADE
        );
      `);

      // いいねテーブル
      await this.db.execAsync(`
        CREATE TABLE IF NOT EXISTS likes (
          id TEXT PRIMARY KEY,
          userId TEXT NOT NULL,
          postId TEXT NOT NULL,
          createdAt TEXT NOT NULL,
          UNIQUE(userId, postId),
          FOREIGN KEY (userId) REFERENCES users (id) ON DELETE CASCADE,
          FOREIGN KEY (postId) REFERENCES posts (id) ON DELETE CASCADE
        );
      `);

      // インデックス作成
      await this.db.execAsync(`
        CREATE INDEX IF NOT EXISTS idx_posts_timestamp ON posts (timestamp DESC);
        CREATE INDEX IF NOT EXISTS idx_posts_user ON posts (userId);
        CREATE INDEX IF NOT EXISTS idx_images_post ON images (postId);
        CREATE INDEX IF NOT EXISTS idx_likes_post ON likes (postId);
        CREATE INDEX IF NOT EXISTS idx_likes_user ON likes (userId);
      `);

      console.log('テーブル作成完了');
    } catch (error) {
      console.error('テーブル作成エラー:', error);
      throw error;
    }
  }

  // ユーザー関連
  async createUser(user: UserProfile): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      const now = new Date().toISOString();
      await this.db.runAsync(
        `INSERT INTO users (id, displayName, email, avatar, bio, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [user.id, user.displayName, user.email, user.avatar, user.bio, now, now]
      );
    } catch (error) {
      console.error('ユーザー作成エラー:', error);
      throw new Error('ユーザーの作成に失敗しました');
    }
  }

  async getUser(userId: string): Promise<UserProfile | null> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      const result = await this.db.getFirstAsync(
        'SELECT * FROM users WHERE id = ?',
        [userId]
      ) as any;

      return result ? {
        id: result.id,
        displayName: result.displayName,
        email: result.email,
        avatar: result.avatar,
        bio: result.bio,
        createdAt: result.createdAt,
      } : null;
    } catch (error) {
      console.error('ユーザー取得エラー:', error);
      return null;
    }
  }

  // 投稿関連
  async createPost(post: InsectPost): Promise<string> {
    if (!this.db) {
      console.warn('データベースが利用できません。投稿IDを返します。');
      return post.id;
    }

    try {
      const postId = post.id; // 既存のIDを使用
      const now = new Date().toISOString();

      // トランザクション開始
      await this.db.execAsync('BEGIN TRANSACTION');

      // 投稿作成
      await this.db.runAsync(
        `INSERT INTO posts (id, name, scientificName, location, description, environment, 
         isPublic, timestamp, userId, likesCount, createdAt, updatedAt) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          postId,
          post.name,
          post.scientificName,
          post.location,
          post.description,
          post.environment,
          post.isPublic ? 1 : 0,
          post.timestamp,
          post.user.id,
          post.likesCount || 0,
          now,
          now
        ]
      );

      // 画像追加
      for (let i = 0; i < post.images.length; i++) {
        const imageId = `${postId}_${i}`;
        await this.db.runAsync(
          'INSERT INTO images (id, postId, uri, order_index, createdAt) VALUES (?, ?, ?, ?, ?)',
          [imageId, postId, post.images[i], i, now]
        );
      }

      // タグ追加
      for (const tagName of post.tags) {
        // タグが存在しない場合は作成
        await this.db.runAsync(
          'INSERT OR IGNORE INTO tags (id, name, createdAt) VALUES (?, ?, ?)',
          [`tag_${tagName}`, tagName, now]
        );

        // 投稿とタグを関連付け
        await this.db.runAsync(
          'INSERT INTO post_tags (postId, tagId) VALUES (?, ?)',
          [postId, `tag_${tagName}`]
        );
      }

      await this.db.execAsync('COMMIT');
      return postId;
    } catch (error) {
      await this.db?.execAsync('ROLLBACK');
      console.error('投稿作成エラー:', error);
      throw new Error('投稿の作成に失敗しました');
    }
  }

  async getPosts(limit: number = 50, offset: number = 0): Promise<InsectPost[]> {
    if (!this.db) {
      console.warn('データベースが利用できません。空の配列を返します。');
      return [];
    }

    try {
      const posts = await this.db.getAllAsync(`
        SELECT p.*, u.displayName, u.avatar
        FROM posts p
        JOIN users u ON p.userId = u.id
        ORDER BY p.timestamp DESC
        LIMIT ? OFFSET ?
      `, [limit, offset]) as any[];

      const result: InsectPost[] = [];

      for (const post of posts) {
        // 画像取得
        const images = await this.db.getAllAsync(
          'SELECT uri FROM images WHERE postId = ? ORDER BY order_index',
          [post.id]
        ) as any[];

        // タグ取得
        const tags = await this.db.getAllAsync(`
          SELECT t.name 
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tagId
          WHERE pt.postId = ?
        `, [post.id]) as any[];

        result.push({
          id: post.id,
          name: post.name,
          scientificName: post.scientificName,
          location: post.location,
          description: post.description,
          environment: post.environment,
          isPublic: Boolean(post.isPublic),
          images: images.map(img => img.uri),
          timestamp: post.timestamp,
          user: {
            id: post.userId,
            displayName: post.displayName,
            avatar: post.avatar,
          },
          likesCount: post.likesCount,
          tags: tags.map(tag => tag.name),
        });
      }

      return result;
    } catch (error) {
      console.error('投稿取得エラー:', error);
      return [];
    }
  }

  async getPostsByUser(userId: string): Promise<InsectPost[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      const posts = await this.db.getAllAsync(`
        SELECT p.*, u.displayName, u.avatar
        FROM posts p
        JOIN users u ON p.userId = u.id
        WHERE p.userId = ?
        ORDER BY p.timestamp DESC
      `, [userId]) as any[];

      const result: InsectPost[] = [];

      for (const post of posts) {
        const images = await this.db.getAllAsync(
          'SELECT uri FROM images WHERE postId = ? ORDER BY order_index',
          [post.id]
        ) as any[];

        const tags = await this.db.getAllAsync(`
          SELECT t.name 
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tagId
          WHERE pt.postId = ?
        `, [post.id]) as any[];

        result.push({
          id: post.id,
          name: post.name,
          scientificName: post.scientificName,
          location: post.location,
          description: post.description,
          environment: post.environment,
          isPublic: Boolean(post.isPublic),
          images: images.map(img => img.uri),
          timestamp: post.timestamp,
          user: {
            id: post.userId,
            displayName: post.displayName,
            avatar: post.avatar,
          },
          likesCount: post.likesCount,
          tags: tags.map(tag => tag.name),
        });
      }

      return result;
    } catch (error) {
      console.error('ユーザー投稿取得エラー:', error);
      return [];
    }
  }

  // いいね機能
  async likePost(userId: string, postId: string): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      await this.db.execAsync('BEGIN TRANSACTION');

      // いいね追加
      const likeId = `${userId}_${postId}_${Date.now()}`;
      await this.db.runAsync(
        'INSERT OR IGNORE INTO likes (id, userId, postId, createdAt) VALUES (?, ?, ?, ?)',
        [likeId, userId, postId, new Date().toISOString()]
      );

      // いいね数更新
      await this.db.runAsync(
        'UPDATE posts SET likesCount = likesCount + 1 WHERE id = ?',
        [postId]
      );

      await this.db.execAsync('COMMIT');
    } catch (error) {
      await this.db?.execAsync('ROLLBACK');
      console.error('いいねエラー:', error);
      throw new Error('いいねに失敗しました');
    }
  }

  // 統計情報
  async getStatistics(): Promise<{
    totalPosts: number;
    totalLikes: number;
    totalSpecies: number;
    totalUsers: number;
  }> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      const stats = await this.db.getFirstAsync(`
        SELECT 
          (SELECT COUNT(*) FROM posts) as totalPosts,
          (SELECT SUM(likesCount) FROM posts) as totalLikes,
          (SELECT COUNT(DISTINCT name) FROM posts) as totalSpecies,
          (SELECT COUNT(*) FROM users) as totalUsers
      `) as any;

      return {
        totalPosts: stats.totalPosts || 0,
        totalLikes: stats.totalLikes || 0,
        totalSpecies: stats.totalSpecies || 0,
        totalUsers: stats.totalUsers || 0,
      };
    } catch (error) {
      console.error('統計取得エラー:', error);
      return {
        totalPosts: 0,
        totalLikes: 0,
        totalSpecies: 0,
        totalUsers: 0,
      };
    }
  }

  // 検索機能
  async searchPosts(query: string): Promise<InsectPost[]> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      const posts = await this.db.getAllAsync(`
        SELECT DISTINCT p.*, u.displayName, u.avatar
        FROM posts p
        JOIN users u ON p.userId = u.id
        LEFT JOIN post_tags pt ON p.id = pt.postId
        LEFT JOIN tags t ON pt.tagId = t.id
        WHERE p.name LIKE ? 
           OR p.scientificName LIKE ?
           OR p.location LIKE ?
           OR p.description LIKE ?
           OR p.environment LIKE ?
           OR t.name LIKE ?
        ORDER BY p.timestamp DESC
      `, Array(6).fill(`%${query}%`)) as any[];

      const result: InsectPost[] = [];

      for (const post of posts) {
        const images = await this.db.getAllAsync(
          'SELECT uri FROM images WHERE postId = ? ORDER BY order_index',
          [post.id]
        ) as any[];

        const tags = await this.db.getAllAsync(`
          SELECT t.name 
          FROM tags t
          JOIN post_tags pt ON t.id = pt.tagId
          WHERE pt.postId = ?
        `, [post.id]) as any[];

        result.push({
          id: post.id,
          name: post.name,
          scientificName: post.scientificName,
          location: post.location,
          description: post.description,
          environment: post.environment,
          isPublic: Boolean(post.isPublic),
          images: images.map(img => img.uri),
          timestamp: post.timestamp,
          user: {
            id: post.userId,
            displayName: post.displayName,
            avatar: post.avatar,
          },
          likesCount: post.likesCount,
          tags: tags.map(tag => tag.name),
        });
      }

      return result;
    } catch (error) {
      console.error('検索エラー:', error);
      return [];
    }
  }

  // データベースクリア（デバッグ用）
  async clearAllData(): Promise<void> {
    if (!this.db) throw new Error('データベースが初期化されていません');

    try {
      await this.db.execAsync(`
        DELETE FROM likes;
        DELETE FROM post_tags;
        DELETE FROM tags;
        DELETE FROM images;
        DELETE FROM posts;
        DELETE FROM users;
      `);
      console.log('全データクリア完了');
    } catch (error) {
      console.error('データクリアエラー:', error);
      throw new Error('データのクリアに失敗しました');
    }
  }
}

export const databaseService = new DatabaseService();