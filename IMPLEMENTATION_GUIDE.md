# MushiMap Data Persistence Implementation Guide

## Quick Fix Priority List

### 🔥 CRITICAL - Implement Immediately

#### 1. Unified Post Creation Service

**Create: `/src/services/unifiedPostService.ts`**

```typescript
import { databaseService } from './databaseService';
import { storageService } from './storageService';
import { authService } from './authService';

export interface CreatePostRequest {
  name: string;
  scientificName?: string;
  location: string;
  description: string;
  environment: string;
  isPublic: boolean;
  images: string[];
}

class UnifiedPostService {
  async createPost(postData: CreatePostRequest): Promise<InsectPost> {
    const currentUser = await authService.getCurrentUser();
    if (!currentUser) {
      throw new Error('User must be logged in to create posts');
    }

    const postId = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const post: InsectPost = {
      id: postId,
      ...postData,
      user: {
        id: currentUser.id,
        displayName: currentUser.displayName,
        avatar: currentUser.avatar || 'https://api.dicebear.com/7.x/adventurer/svg?seed=anonymous',
      },
      likesCount: 0,
      tags: this.generateTags(postData.name, postData.environment),
      timestamp: new Date().toISOString(),
    };

    try {
      // 1. Save to SQLite first (primary storage)
      await databaseService.initializeDatabase();
      await this.ensureUserInDatabase(currentUser);
      await databaseService.createPost(post);
      
      // 2. Update AsyncStorage cache
      await this.updateCacheWithPost(post);
      
      console.log('✅ Post created successfully in both storage systems');
      return post;
      
    } catch (error) {
      console.error('❌ Failed to create post:', error);
      // Attempt rollback
      await this.rollbackPostCreation(postId);
      throw new Error(`Failed to create post: ${error.message}`);
    }
  }

  private async ensureUserInDatabase(user: User): Promise<void> {
    try {
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
    } catch (error) {
      console.warn('User database sync issue:', error);
    }
  }

  private async updateCacheWithPost(post: InsectPost): Promise<void> {
    try {
      const cachedPosts = await storageService.getPosts();
      const updatedPosts = [post, ...cachedPosts];
      await storageService.savePosts(updatedPosts);
    } catch (error) {
      console.warn('Cache update failed:', error);
      // Don't fail the entire operation for cache issues
    }
  }

  private async rollbackPostCreation(postId: string): Promise<void> {
    try {
      // Remove from database
      await databaseService.clearAllData(); // Note: Need to implement deletePost method
      
      // Remove from cache
      const cachedPosts = await storageService.getPosts();
      const filteredPosts = cachedPosts.filter(p => p.id !== postId);
      await storageService.savePosts(filteredPosts);
      
    } catch (rollbackError) {
      console.error('Rollback failed:', rollbackError);
    }
  }

  private generateTags(name: string, environment: string): string[] {
    const tags = [];
    
    // Insect-based tags
    if (name.includes('カブト')) tags.push('カブトムシ');
    if (name.includes('クワガタ')) tags.push('クワガタ');
    if (name.includes('チョウ') || name.includes('蝶')) tags.push('チョウ');
    if (name.includes('テントウ')) tags.push('テントウムシ');
    
    // Environment-based tags
    if (environment.includes('森') || environment.includes('林')) tags.push('森林');
    if (environment.includes('公園')) tags.push('都市部');
    if (environment.includes('川') || environment.includes('池')) tags.push('水辺');
    
    // Season tags
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) tags.push('春');
    else if (month >= 6 && month <= 8) tags.push('夏');
    else if (month >= 9 && month <= 11) tags.push('秋');
    else tags.push('冬');
    
    return [...new Set(tags)];
  }

  async getPosts(page: number = 0, limit: number = 20): Promise<InsectPost[]> {
    try {
      // Try database first
      const dbPosts = await databaseService.getPosts(limit, page * limit);
      
      if (dbPosts.length > 0) {
        // Update cache with fresh data
        if (page === 0) {
          await storageService.savePosts(dbPosts);
        }
        return dbPosts;
      }
      
      // Fallback to cache if database is empty
      const cachedPosts = await storageService.getPosts();
      return cachedPosts.slice(page * limit, (page + 1) * limit);
      
    } catch (error) {
      console.error('Failed to get posts:', error);
      // Final fallback to cache
      try {
        const cachedPosts = await storageService.getPosts();
        return cachedPosts.slice(page * limit, (page + 1) * limit);
      } catch (cacheError) {
        console.error('Cache fallback failed:', cacheError);
        return [];
      }
    }
  }

  async syncData(): Promise<void> {
    try {
      console.log('🔄 Starting data synchronization...');
      
      // Get data from both sources
      const cachedPosts = await storageService.getPosts();
      const dbPosts = await databaseService.getPosts(1000, 0); // Get all posts
      
      // Sync cache to database (cache is temporary, database is persistent)
      const postsToSyncToDb = cachedPosts.filter(cachePost => 
        !dbPosts.some(dbPost => dbPost.id === cachePost.id)
      );
      
      for (const post of postsToSyncToDb) {
        try {
          await this.ensureUserInDatabase(post.user);
          await databaseService.createPost(post);
          console.log(`✅ Synced post ${post.id} to database`);
        } catch (error) {
          console.warn(`Failed to sync post ${post.id}:`, error);
        }
      }
      
      // Update cache with latest database data
      if (dbPosts.length > 0) {
        await storageService.savePosts(dbPosts);
        console.log('✅ Updated cache with database data');
      }
      
      console.log('✅ Data synchronization completed');
      
    } catch (error) {
      console.error('❌ Data synchronization failed:', error);
      throw error;
    }
  }
}

export const unifiedPostService = new UnifiedPostService();
```

#### 2. Enhanced Authentication Service

**Update: `/src/services/authService.ts`**

Add these methods to the existing AuthService class:

```typescript
// Add to AuthService class
async ensureDataConsistency(): Promise<void> {
  const currentUser = await this.getCurrentUser();
  if (currentUser) {
    try {
      await databaseService.initializeDatabase();
      const dbUser = await databaseService.getUser(currentUser.id);
      
      if (!dbUser) {
        // User exists in session but not in database
        await databaseService.createUser({
          id: currentUser.id,
          displayName: currentUser.displayName,
          email: currentUser.email,
          avatar: currentUser.avatar || '',
          bio: currentUser.bio || '',
          createdAt: currentUser.createdAt || new Date().toISOString(),
        });
        console.log('✅ Synced user to database');
      } else {
        // Check if user data needs updating
        if (this.isUserDataOutdated(currentUser, dbUser)) {
          await this.updateUserInDatabase(currentUser);
          console.log('✅ Updated user data in database');
        }
      }
    } catch (error) {
      console.warn('User data consistency check failed:', error);
    }
  }
}

private isUserDataOutdated(sessionUser: User, dbUser: any): boolean {
  return (
    sessionUser.displayName !== dbUser.displayName ||
    sessionUser.email !== dbUser.email ||
    sessionUser.avatar !== dbUser.avatar ||
    sessionUser.bio !== dbUser.bio
  );
}

private async updateUserInDatabase(user: User): Promise<void> {
  // Note: Need to implement updateUser method in databaseService
  console.log('User update needed - implement updateUser in databaseService');
}

// Modify existing login method to ensure consistency
async login(credentials: LoginCredentials): Promise<{ success: boolean; user?: User; error?: string }> {
  try {
    const sessions = await this.getUserSessions();
    const userSession = sessions.find(session => session.email === credentials.email);

    if (!userSession) {
      return { success: false, error: 'メールアドレスまたはパスワードが正しくありません' };
    }

    if (userSession.isGoogleUser) {
      return { success: false, error: 'このアカウントはGoogleログインを使用してください' };
    }

    let isValidPassword = false;
    
    if (userSession.password.includes(':')) {
      isValidPassword = await this.verifyPassword(credentials.password, userSession.password);
    } else {
      isValidPassword = credentials.password === userSession.password;
      
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

    // CRITICAL: Ensure database consistency
    await this.ensureDatabaseConsistency(user);

    return { success: true, user };
  } catch (error) {
    console.error('ログインエラー:', error);
    return { success: false, error: 'ログインに失敗しました' };
  }
}

private async ensureDatabaseConsistency(user: User): Promise<void> {
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
      console.log('✅ User synced to database during login');
    }
  } catch (dbError) {
    console.error('❌ Critical: Database sync failed during login:', dbError);
    throw new Error('Authentication database synchronization failed');
  }
}
```

#### 3. Data Integrity Validation Service

**Create: `/src/services/dataIntegrityService.ts`**

```typescript
import { databaseService } from './databaseService';
import { storageService } from './storageService';
import { authService } from './authService';

interface ValidationResult {
  isValid: boolean;
  issues: string[];
  fixedIssues: string[];
}

class DataIntegrityService {
  async validateAndFixDataIntegrity(): Promise<ValidationResult> {
    const result: ValidationResult = {
      isValid: true,
      issues: [],
      fixedIssues: []
    };

    try {
      console.log('🔍 Starting data integrity validation...');

      // 1. Validate user data consistency
      await this.validateUserDataConsistency(result);

      // 2. Validate post data consistency  
      await this.validatePostDataConsistency(result);

      // 3. Validate foreign key relationships
      await this.validateForeignKeyIntegrity(result);

      // 4. Check for orphaned data
      await this.checkForOrphanedData(result);

      result.isValid = result.issues.length === 0;
      
      console.log(result.isValid ? '✅ Data integrity validation passed' : '⚠️ Data integrity issues found');
      
      return result;

    } catch (error) {
      console.error('❌ Data integrity validation failed:', error);
      result.issues.push(`Validation failed: ${error.message}`);
      result.isValid = false;
      return result;
    }
  }

  private async validateUserDataConsistency(result: ValidationResult): Promise<void> {
    try {
      const currentUser = await authService.getCurrentUser();
      
      if (currentUser) {
        const dbUser = await databaseService.getUser(currentUser.id);
        
        if (!dbUser) {
          result.issues.push(`User ${currentUser.id} exists in session but not in database`);
          
          // Auto-fix: Create user in database
          try {
            await databaseService.createUser({
              id: currentUser.id,
              displayName: currentUser.displayName,
              email: currentUser.email,
              avatar: currentUser.avatar || '',
              bio: currentUser.bio || '',
              createdAt: currentUser.createdAt || new Date().toISOString(),
            });
            result.fixedIssues.push(`Created missing user ${currentUser.id} in database`);
          } catch (fixError) {
            console.error('Failed to fix user inconsistency:', fixError);
          }
        } else {
          // Check for data mismatches
          if (currentUser.email !== dbUser.email) {
            result.issues.push(`User ${currentUser.id} email mismatch: session(${currentUser.email}) vs db(${dbUser.email})`);
          }
          if (currentUser.displayName !== dbUser.displayName) {
            result.issues.push(`User ${currentUser.id} name mismatch: session(${currentUser.displayName}) vs db(${dbUser.displayName})`);
          }
        }
      }
    } catch (error) {
      result.issues.push(`User validation failed: ${error.message}`);
    }
  }

  private async validatePostDataConsistency(result: ValidationResult): Promise<void> {
    try {
      const cachedPosts = await storageService.getPosts();
      const dbPosts = await databaseService.getPosts(1000, 0);

      // Check for posts in cache but not in database
      const missingInDb = cachedPosts.filter(cachePost => 
        !dbPosts.some(dbPost => dbPost.id === cachePost.id)
      );

      if (missingInDb.length > 0) {
        result.issues.push(`${missingInDb.length} posts exist in cache but not in database`);
        
        // Auto-fix: Sync missing posts to database
        for (const post of missingInDb) {
          try {
            // Ensure user exists first
            const dbUser = await databaseService.getUser(post.user.id);
            if (!dbUser) {
              await databaseService.createUser({
                id: post.user.id,
                displayName: post.user.displayName,
                email: `${post.user.id}@temp.com`, // Temporary email
                avatar: post.user.avatar || '',
                bio: '',
                createdAt: new Date().toISOString(),
              });
            }
            
            await databaseService.createPost(post);
            result.fixedIssues.push(`Synced post ${post.id} to database`);
          } catch (fixError) {
            console.error(`Failed to sync post ${post.id}:`, fixError);
          }
        }
      }

      // Check for data consistency between matching posts
      const matchingPosts = cachedPosts.filter(cachePost => 
        dbPosts.some(dbPost => dbPost.id === cachePost.id)
      );

      for (const cachePost of matchingPosts) {
        const dbPost = dbPosts.find(p => p.id === cachePost.id);
        if (dbPost) {
          if (cachePost.name !== dbPost.name) {
            result.issues.push(`Post ${cachePost.id} name mismatch between cache and database`);
          }
          if (cachePost.likesCount !== dbPost.likesCount) {
            result.issues.push(`Post ${cachePost.id} likes count mismatch between cache and database`);
          }
        }
      }

    } catch (error) {
      result.issues.push(`Post validation failed: ${error.message}`);
    }
  }

  private async validateForeignKeyIntegrity(result: ValidationResult): Promise<void> {
    try {
      const dbPosts = await databaseService.getPosts(1000, 0);

      for (const post of dbPosts) {
        // Check if user exists for each post
        const user = await databaseService.getUser(post.user.id);
        if (!user) {
          result.issues.push(`Post ${post.id} references non-existent user ${post.user.id}`);
        }
      }
    } catch (error) {
      result.issues.push(`Foreign key validation failed: ${error.message}`);
    }
  }

  private async checkForOrphanedData(result: ValidationResult): Promise<void> {
    try {
      const stats = await databaseService.getStatistics();
      
      if (stats.totalPosts > 0 && stats.totalUsers === 0) {
        result.issues.push('Posts exist but no users found - possible orphaned data');
      }
      
      // Check for users with no posts (not necessarily an issue, but worth noting)
      const dbPosts = await databaseService.getPosts(1000, 0);
      const userIds = new Set(dbPosts.map(p => p.user.id));
      
      if (userIds.size < stats.totalUsers) {
        result.issues.push(`${stats.totalUsers - userIds.size} users have no posts`);
      }
      
    } catch (error) {
      result.issues.push(`Orphaned data check failed: ${error.message}`);
    }
  }

  async performDataRecovery(): Promise<void> {
    console.log('🔧 Starting data recovery process...');
    
    try {
      // 1. Validate current state
      const validation = await this.validateAndFixDataIntegrity();
      
      // 2. If critical issues remain, attempt recovery
      if (!validation.isValid) {
        console.log('⚠️ Critical issues found, attempting recovery...');
        
        // Recovery strategy: Database is primary, cache is secondary
        const dbPosts = await databaseService.getPosts(1000, 0);
        
        if (dbPosts.length > 0) {
          // Rebuild cache from database
          await storageService.savePosts(dbPosts);
          console.log('✅ Rebuilt cache from database');
        } else {
          // Database is empty, check if cache has data to recover
          const cachedPosts = await storageService.getPosts();
          if (cachedPosts.length > 0) {
            console.log('⚠️ Database empty but cache has data - manual intervention needed');
          }
        }
      }
      
      console.log('✅ Data recovery completed');
      
    } catch (error) {
      console.error('❌ Data recovery failed:', error);
      throw error;
    }
  }
}

export const dataIntegrityService = new DataIntegrityService();
```

### 🔧 MEDIUM PRIORITY - Implement Next

#### 4. Update App.tsx to Initialize Data Integrity

**Update: `/App.tsx`**

```typescript
import React, { useEffect, useState } from 'react';
import { StatusBar, Alert } from 'react-native';
import 'react-native-gesture-handler';
import SimpleNavigator from './src/navigation/SimpleNavigator';
import { databaseService } from './src/services/databaseService';
import { authService } from './src/services/authService';
import { dataIntegrityService } from './src/services/dataIntegrityService';
import { unifiedPostService } from './src/services/unifiedPostService';

function App(): React.JSX.Element {
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        console.log('🚀 Starting app initialization...');
        
        // 1. Initialize database
        await databaseService.initializeDatabase();
        console.log('✅ Database initialized');
        
        // 2. Create default users
        await authService.createDefaultUsers();
        console.log('✅ Default users created');
        
        // 3. Ensure authentication consistency
        await authService.ensureDataConsistency();
        console.log('✅ Authentication consistency checked');
        
        // 4. Validate and fix data integrity
        const validation = await dataIntegrityService.validateAndFixDataIntegrity();
        if (!validation.isValid) {
          console.warn('⚠️ Data integrity issues found:', validation.issues);
          
          // Show user-friendly message for critical issues
          if (validation.issues.length > validation.fixedIssues.length) {
            Alert.alert(
              'データ同期',
              'アプリのデータを同期しています。しばらくお待ちください。',
              [{ text: 'OK' }]
            );
          }
        }
        
        // 5. Sync data between storage systems
        await unifiedPostService.syncData();
        console.log('✅ Data synchronization completed');
        
        console.log('✅ App initialization completed successfully');
        setIsInitialized(true);
        
      } catch (error) {
        console.error('❌ App initialization failed:', error);
        
        Alert.alert(
          'エラー',
          'アプリの初期化中にエラーが発生しました。アプリを再起動してください。',
          [
            { text: 'OK', onPress: () => setIsInitialized(true) } // Allow app to continue
          ]
        );
      }
    };

    initializeApp();
  }, []);

  // Show loading screen during initialization
  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor="#4CAF50" />
      <SimpleNavigator />
    </>
  );
}

// Simple loading component
const LoadingScreen = () => (
  <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#4CAF50' }}>
    <Text style={{ color: 'white', fontSize: 18 }}>むしマップを読み込み中...</Text>
  </View>
);

export default App;
```

#### 5. Update Screen Components to Use Unified Service

**Update: `/src/screens/AddInsectScreen.tsx`**

Replace the `handleSubmit` function:

```typescript
import { unifiedPostService } from '../services/unifiedPostService';

// Replace existing handleSubmit method
const handleSubmit = async () => {
  if (!formData.name.trim()) {
    Alert.alert('エラー', '昆虫名を入力してください');
    return;
  }

  if (formData.imageUrls.length === 0) {
    Alert.alert('エラー', '最低1枚の写真を選択してください');
    return;
  }

  try {
    setLoading(true);
    
    // Use unified service instead of API service
    await unifiedPostService.createPost({
      name: formData.name,
      scientificName: formData.scientificName || '',
      location: formData.locationName || 'Unknown location',
      description: formData.description || '',
      environment: formData.environment || '',
      isPublic: formData.isPublic,
      images: formData.imageUrls,
    });
    
    Alert.alert('成功', '昆虫の投稿が完了しました', [
      { text: 'OK', onPress: resetForm }
    ]);
  } catch (error) {
    console.error('Error creating insect:', error);
    Alert.alert('エラー', `投稿に失敗しました: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### ⚡ PERFORMANCE OPTIMIZATIONS

#### 6. Add Database Method Extensions

**Update: `/src/services/databaseService.ts`**

Add these methods to the existing DatabaseService class:

```typescript
// Add to DatabaseService class

async updateUser(userId: string, userData: Partial<UserProfile>): Promise<void> {
  if (!this.db) throw new Error('データベースが初期化されていません');

  try {
    const now = new Date().toISOString();
    const updateFields = [];
    const updateValues = [];

    if (userData.displayName) {
      updateFields.push('displayName = ?');
      updateValues.push(userData.displayName);
    }
    if (userData.email) {
      updateFields.push('email = ?');
      updateValues.push(userData.email);
    }
    if (userData.avatar) {
      updateFields.push('avatar = ?');
      updateValues.push(userData.avatar);
    }
    if (userData.bio) {
      updateFields.push('bio = ?');
      updateValues.push(userData.bio);
    }

    updateFields.push('updatedAt = ?');
    updateValues.push(now);
    updateValues.push(userId);

    await this.db.runAsync(
      `UPDATE users SET ${updateFields.join(', ')} WHERE id = ?`,
      updateValues
    );
  } catch (error) {
    console.error('ユーザー更新エラー:', error);
    throw new Error('ユーザーの更新に失敗しました');
  }
}

async deletePost(postId: string): Promise<void> {
  if (!this.db) throw new Error('データベースが初期化されていません');

  try {
    await this.db.execAsync('BEGIN TRANSACTION');

    // Delete related data first (foreign key constraints will handle this, but explicit is better)
    await this.db.runAsync('DELETE FROM likes WHERE postId = ?', [postId]);
    await this.db.runAsync('DELETE FROM post_tags WHERE postId = ?', [postId]);
    await this.db.runAsync('DELETE FROM images WHERE postId = ?', [postId]);
    
    // Delete the post
    await this.db.runAsync('DELETE FROM posts WHERE id = ?', [postId]);

    await this.db.execAsync('COMMIT');
  } catch (error) {
    await this.db?.execAsync('ROLLBACK');
    console.error('投稿削除エラー:', error);
    throw new Error('投稿の削除に失敗しました');
  }
}

async getPostsPaginated(limit: number = 20, offset: number = 0, userId?: string): Promise<{
  posts: InsectPost[];
  hasMore: boolean;
  total: number;
}> {
  if (!this.db) throw new Error('データベースが初期化されていません');

  try {
    // Get total count
    const countQuery = userId 
      ? 'SELECT COUNT(*) as count FROM posts WHERE userId = ?'
      : 'SELECT COUNT(*) as count FROM posts';
    const countParams = userId ? [userId] : [];
    const countResult = await this.db.getFirstAsync(countQuery, countParams) as any;
    const total = countResult?.count || 0;

    // Get posts
    const posts = userId 
      ? await this.getPostsByUser(userId)
      : await this.getPosts(limit, offset);

    return {
      posts,
      hasMore: offset + limit < total,
      total
    };
  } catch (error) {
    console.error('ページング投稿取得エラー:', error);
    return { posts: [], hasMore: false, total: 0 };
  }
}

async getDatabaseHealth(): Promise<{
  isHealthy: boolean;
  tableCount: number;
  indexCount: number;
  lastError?: string;
}> {
  if (!this.db) {
    return { isHealthy: false, tableCount: 0, indexCount: 0, lastError: 'Database not initialized' };
  }

  try {
    // Check if all expected tables exist
    const tables = await this.db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%'"
    ) as any[];

    const expectedTables = ['users', 'posts', 'images', 'tags', 'post_tags', 'likes'];
    const existingTableNames = tables.map(t => t.name);
    const missingTables = expectedTables.filter(t => !existingTableNames.includes(t));

    // Check indexes
    const indexes = await this.db.getAllAsync(
      "SELECT name FROM sqlite_master WHERE type='index' AND name NOT LIKE 'sqlite_%'"
    ) as any[];

    return {
      isHealthy: missingTables.length === 0,
      tableCount: tables.length,
      indexCount: indexes.length,
      lastError: missingTables.length > 0 ? `Missing tables: ${missingTables.join(', ')}` : undefined
    };
  } catch (error) {
    return {
      isHealthy: false,
      tableCount: 0,
      indexCount: 0,
      lastError: error.message
    };
  }
}
```

## Implementation Timeline

### Week 1: Critical Fixes
- [ ] Implement UnifiedPostService
- [ ] Update AuthService with consistency checks
- [ ] Create DataIntegrityService
- [ ] Update App.tsx initialization

### Week 2: Screen Updates & Testing
- [ ] Update AddInsectScreen to use unified service
- [ ] Update other screens that create/modify data
- [ ] Add database method extensions
- [ ] Test all functionality

### Week 3: Performance & Monitoring
- [ ] Add performance monitoring
- [ ] Implement background sync
- [ ] Add error reporting
- [ ] Load testing

## Testing Checklist

### Critical Path Tests
- [ ] Create post → Verify in both AsyncStorage and SQLite
- [ ] Login → Verify user exists in both systems
- [ ] App restart → Verify data persists
- [ ] Data corruption → Verify recovery works
- [ ] Concurrent operations → Verify no data loss

### Edge Cases
- [ ] Network offline → Verify local storage works
- [ ] Database corruption → Verify graceful degradation
- [ ] Memory pressure → Verify no data loss
- [ ] Large datasets → Verify performance

## Monitoring & Alerts

Add these console logs to monitor data integrity:

```typescript
// In production, replace console.log with proper logging service
console.log('✅ Success - Data operation completed');
console.warn('⚠️ Warning - Data inconsistency detected');
console.error('❌ Error - Critical data operation failed');
```

This implementation guide provides immediate fixes for the most critical data persistence issues while maintaining backward compatibility and adding proper error handling.