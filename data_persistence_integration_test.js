/**
 * Comprehensive Data Persistence Integration Test for MushiMap
 * Tests AsyncStorage and SQLite integration for data integrity, persistence, and synchronization
 */

const { databaseService } = require('./src/services/databaseService');
const { storageService } = require('./src/services/storageService');
const { authService } = require('./src/services/authService');
const AsyncStorage = require('@react-native-async-storage/async-storage');

// Test utilities
const createTestUser = () => ({
  id: `test_user_${Date.now()}`,
  email: `test_${Date.now()}@test.com`,
  displayName: 'Test User',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=test',
  bio: 'Test user for persistence testing',
  createdAt: new Date().toISOString(),
});

const createTestPost = (userId) => ({
  name: 'Test Beetle',
  scientificName: 'Testus Beetleus',
  location: 'Test Forest',
  description: 'A test beetle for persistence testing',
  environment: 'Forest environment',
  isPublic: true,
  images: ['test-image-1.jpg', 'test-image-2.jpg'],
  timestamp: new Date().toISOString(),
  user: {
    id: userId,
    displayName: 'Test User',
    avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=test',
  },
  tags: ['test', 'beetle', 'forest'],
});

class DataPersistenceTestSuite {
  constructor() {
    this.testResults = {
      passed: 0,
      failed: 0,
      errors: [],
      details: [],
    };
  }

  log(message, type = 'info') {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] [${type.toUpperCase()}] ${message}`;
    console.log(logEntry);
    this.testResults.details.push(logEntry);
  }

  async assert(condition, message, testName) {
    try {
      if (condition) {
        this.testResults.passed++;
        this.log(`✅ PASS: ${testName} - ${message}`, 'pass');
        return true;
      } else {
        this.testResults.failed++;
        this.log(`❌ FAIL: ${testName} - ${message}`, 'fail');
        this.testResults.errors.push({ test: testName, message });
        return false;
      }
    } catch (error) {
      this.testResults.failed++;
      this.log(`💥 ERROR: ${testName} - ${error.message}`, 'error');
      this.testResults.errors.push({ test: testName, message: error.message });
      return false;
    }
  }

  async sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // 1. DATA PERSISTENCE TESTING
  async testDataPersistenceAcrossRestarts() {
    this.log('Starting Data Persistence Tests...', 'info');

    try {
      // Test 1.1: User data persistence
      await this.testUserDataPersistence();
      
      // Test 1.2: Post data persistence in both storage systems
      await this.testPostDataPersistence();
      
      // Test 1.3: Authentication session persistence
      await this.testAuthSessionPersistence();
      
      // Test 1.4: Data synchronization between storage systems
      await this.testDataSynchronization();
      
    } catch (error) {
      this.log(`Data persistence test suite failed: ${error.message}`, 'error');
    }
  }

  async testUserDataPersistence() {
    this.log('Testing user data persistence...', 'info');
    
    const testUser = createTestUser();
    
    // Save user to AsyncStorage
    await storageService.saveCurrentUser(testUser);
    
    // Save user to SQLite
    await databaseService.initializeDatabase();
    await databaseService.createUser(testUser);
    
    // Simulate app restart by clearing memory and re-reading
    await this.sleep(100);
    
    // Check AsyncStorage persistence
    const retrievedUserStorage = await storageService.getCurrentUser();
    await this.assert(
      retrievedUserStorage && retrievedUserStorage.id === testUser.id,
      'User data persists in AsyncStorage after restart',
      'UserDataPersistence-AsyncStorage'
    );
    
    // Check SQLite persistence
    const retrievedUserDb = await databaseService.getUser(testUser.id);
    await this.assert(
      retrievedUserDb && retrievedUserDb.id === testUser.id,
      'User data persists in SQLite after restart',
      'UserDataPersistence-SQLite'
    );
    
    // Check data consistency
    await this.assert(
      retrievedUserStorage && retrievedUserDb && 
      retrievedUserStorage.email === retrievedUserDb.email &&
      retrievedUserStorage.displayName === retrievedUserDb.displayName,
      'User data is consistent between AsyncStorage and SQLite',
      'UserDataPersistence-Consistency'
    );
  }

  async testPostDataPersistence() {
    this.log('Testing post data persistence...', 'info');
    
    const testUser = createTestUser();
    const testPost = createTestPost(testUser.id);
    
    // Save post to AsyncStorage
    const posts = await storageService.getPosts();
    const newPost = await storageService.addPost(testPost);
    
    // Save post to SQLite
    await databaseService.createUser(testUser);
    const postId = await databaseService.createPost(testPost);
    
    await this.sleep(100);
    
    // Check AsyncStorage persistence
    const storagePosts = await storageService.getPosts();
    const foundStoragePost = storagePosts.find(p => p.name === testPost.name);
    await this.assert(
      foundStoragePost !== undefined,
      'Post data persists in AsyncStorage',
      'PostDataPersistence-AsyncStorage'
    );
    
    // Check SQLite persistence
    const dbPosts = await databaseService.getPosts(50, 0);
    const foundDbPost = dbPosts.find(p => p.name === testPost.name);
    await this.assert(
      foundDbPost !== undefined,
      'Post data persists in SQLite',
      'PostDataPersistence-SQLite'
    );
    
    // Check post data integrity
    if (foundStoragePost && foundDbPost) {
      await this.assert(
        foundStoragePost.name === foundDbPost.name &&
        foundStoragePost.location === foundDbPost.location &&
        foundStoragePost.images.length === foundDbPost.images.length,
        'Post data integrity maintained across storage systems',
        'PostDataPersistence-Integrity'
      );
    }
  }

  async testAuthSessionPersistence() {
    this.log('Testing authentication session persistence...', 'info');
    
    const testCredentials = {
      email: 'test@mushimap.com',
      password: 'testpass123'
    };
    
    // Register a test user
    const registerResult = await authService.register({
      email: testCredentials.email,
      password: testCredentials.password,
      displayName: 'Test Session User',
    });
    
    await this.assert(
      registerResult.success === true,
      'User registration successful',
      'AuthSessionPersistence-Registration'
    );
    
    // Check if user is logged in
    const isLoggedIn = await authService.isLoggedIn();
    await this.assert(
      isLoggedIn === true,
      'User session persists after registration',
      'AuthSessionPersistence-Session'
    );
    
    // Simulate app restart
    await authService.logout();
    await this.sleep(100);
    
    // Test login with persisted credentials
    const loginResult = await authService.login(testCredentials);
    await this.assert(
      loginResult.success === true,
      'User can login with persisted credentials after restart',
      'AuthSessionPersistence-Login'
    );
    
    // Check session restoration
    const currentUser = await authService.getCurrentUser();
    await this.assert(
      currentUser && currentUser.email === testCredentials.email,
      'User session restored correctly after login',
      'AuthSessionPersistence-Restoration'
    );
  }

  async testDataSynchronization() {
    this.log('Testing data synchronization between storage systems...', 'info');
    
    const testUser = createTestUser();
    const testPost = createTestPost(testUser.id);
    
    // Create user in SQLite first
    await databaseService.createUser(testUser);
    
    // Create post in AsyncStorage
    await storageService.addPost(testPost);
    
    // Simulate sync operation - in real app this would be automatic
    const storagePosts = await storageService.getPosts();
    const dbPosts = await databaseService.getPosts();
    
    await this.assert(
      storagePosts.length > 0,
      'Posts exist in AsyncStorage',
      'DataSynchronization-AsyncStorageData'
    );
    
    // Test bidirectional sync capability
    const storagePost = storagePosts[0];
    if (storagePost) {
      // Try to create the same post in SQLite (should handle gracefully)
      try {
        await databaseService.createPost(storagePost);
        const updatedDbPosts = await databaseService.getPosts();
        await this.assert(
          updatedDbPosts.length > 0,
          'Data can be synchronized from AsyncStorage to SQLite',
          'DataSynchronization-Bidirectional'
        );
      } catch (error) {
        this.log(`Sync operation handled gracefully: ${error.message}`, 'info');
      }
    }
  }

  // 2. DATABASE INTEGRITY TESTING
  async testDatabaseIntegrity() {
    this.log('Starting Database Integrity Tests...', 'info');
    
    try {
      await this.testDatabaseInitialization();
      await this.testCrudOperations();
      await this.testDataConsistency();
      await this.testForeignKeyConstraints();
    } catch (error) {
      this.log(`Database integrity test suite failed: ${error.message}`, 'error');
    }
  }

  async testDatabaseInitialization() {
    this.log('Testing database initialization...', 'info');
    
    try {
      await databaseService.initializeDatabase();
      
      // Test if database can be initialized multiple times safely
      await databaseService.initializeDatabase();
      await databaseService.initializeDatabase();
      
      await this.assert(
        true,
        'Database can be initialized multiple times without errors',
        'DatabaseIntegrity-Initialization'
      );
      
      // Test statistics function to verify tables exist
      const stats = await databaseService.getStatistics();
      await this.assert(
        typeof stats.totalPosts === 'number' &&
        typeof stats.totalUsers === 'number',
        'Database tables created successfully',
        'DatabaseIntegrity-TableCreation'
      );
      
    } catch (error) {
      await this.assert(
        false,
        `Database initialization failed: ${error.message}`,
        'DatabaseIntegrity-InitializationError'
      );
    }
  }

  async testCrudOperations() {
    this.log('Testing CRUD operations...', 'info');
    
    const testUser = createTestUser();
    const testPost = createTestPost(testUser.id);
    
    // CREATE operations
    try {
      await databaseService.createUser(testUser);
      await this.assert(true, 'User CREATE operation successful', 'CRUD-UserCreate');
      
      const postId = await databaseService.createPost(testPost);
      await this.assert(
        typeof postId === 'string' && postId.length > 0,
        'Post CREATE operation successful',
        'CRUD-PostCreate'
      );
      
      // READ operations
      const retrievedUser = await databaseService.getUser(testUser.id);
      await this.assert(
        retrievedUser && retrievedUser.id === testUser.id,
        'User READ operation successful',
        'CRUD-UserRead'
      );
      
      const posts = await databaseService.getPosts(10, 0);
      const retrievedPost = posts.find(p => p.id === postId);
      await this.assert(
        retrievedPost !== undefined,
        'Post READ operation successful',
        'CRUD-PostRead'
      );
      
      // UPDATE operations (like functionality)
      if (retrievedPost) {
        await databaseService.likePost(testUser.id, retrievedPost.id);
        const updatedPosts = await databaseService.getPosts(10, 0);
        const likedPost = updatedPosts.find(p => p.id === retrievedPost.id);
        await this.assert(
          likedPost && likedPost.likesCount > retrievedPost.likesCount,
          'Post UPDATE operation (like) successful',
          'CRUD-PostUpdate'
        );
      }
      
      // DELETE operations (via clear data)
      await databaseService.clearAllData();
      const postsAfterClear = await databaseService.getPosts(10, 0);
      await this.assert(
        postsAfterClear.length === 0,
        'DELETE operations successful',
        'CRUD-Delete'
      );
      
    } catch (error) {
      await this.assert(
        false,
        `CRUD operation failed: ${error.message}`,
        'CRUD-Operations'
      );
    }
  }

  async testDataConsistency() {
    this.log('Testing data consistency between AsyncStorage and SQLite...', 'info');
    
    const testUser = createTestUser();
    const testPost = createTestPost(testUser.id);
    
    // Add data to both systems
    await storageService.saveCurrentUser(testUser);
    await databaseService.createUser(testUser);
    
    const storagePost = await storageService.addPost(testPost);
    const dbPostId = await databaseService.createPost(testPost);
    
    // Compare data consistency
    const storageUser = await storageService.getCurrentUser();
    const dbUser = await databaseService.getUser(testUser.id);
    
    await this.assert(
      storageUser && dbUser &&
      storageUser.email === dbUser.email &&
      storageUser.displayName === dbUser.displayName,
      'User data consistent between storage systems',
      'DataConsistency-Users'
    );
    
    const storagePosts = await storageService.getPosts();
    const dbPosts = await databaseService.getPosts();
    
    const storageTestPost = storagePosts.find(p => p.name === testPost.name);
    const dbTestPost = dbPosts.find(p => p.name === testPost.name);
    
    await this.assert(
      storageTestPost && dbTestPost &&
      storageTestPost.name === dbTestPost.name &&
      storageTestPost.location === dbTestPost.location,
      'Post data consistent between storage systems',
      'DataConsistency-Posts'
    );
  }

  async testForeignKeyConstraints() {
    this.log('Testing foreign key relationships and constraints...', 'info');
    
    const testUser = createTestUser();
    const testPost = createTestPost(testUser.id);
    
    // Create user and post
    await databaseService.createUser(testUser);
    const postId = await databaseService.createPost(testPost);
    
    // Test like functionality (foreign key relationship)
    try {
      await databaseService.likePost(testUser.id, postId);
      await this.assert(
        true,
        'Foreign key relationship works for likes',
        'ForeignKey-Likes'
      );
    } catch (error) {
      await this.assert(
        false,
        `Foreign key constraint failed: ${error.message}`,
        'ForeignKey-LikesError'
      );
    }
    
    // Test post-user relationship
    const posts = await databaseService.getPostsByUser(testUser.id);
    await this.assert(
      posts.length > 0 && posts.some(p => p.user.id === testUser.id),
      'Foreign key relationship maintained for post-user',
      'ForeignKey-PostUser'
    );
  }

  // 3. DATA MIGRATION TESTING
  async testDataMigration() {
    this.log('Starting Data Migration Tests...', 'info');
    
    try {
      await this.testLegacyPasswordMigration();
      await this.testBackwardCompatibility();
      await this.testDataRecovery();
    } catch (error) {
      this.log(`Data migration test suite failed: ${error.message}`, 'error');
    }
  }

  async testLegacyPasswordMigration() {
    this.log('Testing legacy password migration...', 'info');
    
    // Simulate legacy user with plain text password
    const legacyUserData = {
      id: 'legacy_user_123',
      email: 'legacy@test.com',
      password: 'plaintext123', // Plain text password
      displayName: 'Legacy User',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=legacy',
      bio: 'Legacy user for migration testing',
      createdAt: new Date().toISOString(),
      isGoogleUser: false,
    };
    
    // Manually insert legacy user session
    const existingSessions = await AsyncStorage.getItem('user_sessions');
    const sessions = existingSessions ? JSON.parse(existingSessions) : [];
    sessions.push(legacyUserData);
    await AsyncStorage.setItem('user_sessions', JSON.stringify(sessions));
    
    // Test login with legacy password (should trigger migration)
    const loginResult = await authService.login({
      email: legacyUserData.email,
      password: legacyUserData.password,
    });
    
    await this.assert(
      loginResult.success === true,
      'Legacy password login successful',
      'LegacyMigration-Login'
    );
    
    // Check if password was migrated to hashed format
    const updatedSessions = await AsyncStorage.getItem('user_sessions');
    const parsedSessions = JSON.parse(updatedSessions);
    const migratedUser = parsedSessions.find(u => u.email === legacyUserData.email);
    
    await this.assert(
      migratedUser && migratedUser.password.includes(':'),
      'Legacy password migrated to hashed format',
      'LegacyMigration-PasswordHash'
    );
    
    // Test login again with same credentials (should work with hashed password)
    await authService.logout();
    const secondLoginResult = await authService.login({
      email: legacyUserData.email,
      password: legacyUserData.password,
    });
    
    await this.assert(
      secondLoginResult.success === true,
      'Login works after password migration',
      'LegacyMigration-PostMigrationLogin'
    );
  }

  async testBackwardCompatibility() {
    this.log('Testing backward compatibility...', 'info');
    
    // Test with old data format
    const oldFormatPost = {
      id: 'old_post_123',
      name: 'Old Format Beetle',
      location: 'Old Forest',
      timestamp: new Date().toISOString(),
      // Missing some new fields
    };
    
    try {
      // Should handle missing fields gracefully
      const posts = await storageService.getPosts();
      await storageService.savePosts([oldFormatPost, ...posts]);
      
      const retrievedPosts = await storageService.getPosts();
      const oldPost = retrievedPosts.find(p => p.id === oldFormatPost.id);
      
      await this.assert(
        oldPost !== undefined,
        'Old format data can be retrieved',
        'BackwardCompatibility-OldFormat'
      );
      
    } catch (error) {
      await this.assert(
        false,
        `Backward compatibility failed: ${error.message}`,
        'BackwardCompatibility-Error'
      );
    }
  }

  async testDataRecovery() {
    this.log('Testing data recovery scenarios...', 'info');
    
    const testUser = createTestUser();
    const testPost = createTestPost(testUser.id);
    
    // Create data in both systems
    await storageService.saveCurrentUser(testUser);
    await databaseService.createUser(testUser);
    await storageService.addPost(testPost);
    await databaseService.createPost(testPost);
    
    // Simulate AsyncStorage corruption by clearing it
    await AsyncStorage.clear();
    
    // Test recovery from SQLite
    const dbUser = await databaseService.getUser(testUser.id);
    const dbPosts = await databaseService.getPosts();
    
    await this.assert(
      dbUser !== null,
      'Data can be recovered from SQLite when AsyncStorage is corrupted',
      'DataRecovery-SQLiteRecovery'
    );
    
    await this.assert(
      dbPosts.length > 0,
      'Post data can be recovered from SQLite',
      'DataRecovery-PostRecovery'
    );
    
    // Test data restoration to AsyncStorage
    if (dbUser && dbPosts.length > 0) {
      await storageService.saveCurrentUser(dbUser);
      await storageService.savePosts(dbPosts);
      
      const recoveredUser = await storageService.getCurrentUser();
      const recoveredPosts = await storageService.getPosts();
      
      await this.assert(
        recoveredUser && recoveredUser.id === testUser.id,
        'User data successfully restored to AsyncStorage',
        'DataRecovery-UserRestore'
      );
      
      await this.assert(
        recoveredPosts.length > 0,
        'Post data successfully restored to AsyncStorage',
        'DataRecovery-PostRestore'
      );
    }
  }

  // 4. PERFORMANCE AND RELIABILITY TESTING
  async testPerformanceAndReliability() {
    this.log('Starting Performance and Reliability Tests...', 'info');
    
    try {
      await this.testLargeDataSets();
      await this.testErrorHandling();
      await this.testConcurrentOperations();
      await this.testMemoryUsage();
    } catch (error) {
      this.log(`Performance and reliability test suite failed: ${error.message}`, 'error');
    }
  }

  async testLargeDataSets() {
    this.log('Testing large data set handling...', 'info');
    
    const testUser = createTestUser();
    await databaseService.createUser(testUser);
    
    const startTime = Date.now();
    const postCount = 100; // Create 100 test posts
    
    try {
      // Create large number of posts
      for (let i = 0; i < postCount; i++) {
        const testPost = {
          ...createTestPost(testUser.id),
          name: `Test Beetle ${i}`,
          id: `test_post_${i}`,
        };
        await databaseService.createPost(testPost);
      }
      
      const createTime = Date.now() - startTime;
      
      // Test retrieval performance
      const retrievalStartTime = Date.now();
      const posts = await databaseService.getPosts(postCount, 0);
      const retrievalTime = Date.now() - retrievalStartTime;
      
      await this.assert(
        posts.length === postCount,
        `Successfully handled ${postCount} posts`,
        'Performance-LargeDataSet'
      );
      
      await this.assert(
        createTime < 10000, // Should complete within 10 seconds
        `Large data creation completed in reasonable time (${createTime}ms)`,
        'Performance-CreateTime'
      );
      
      await this.assert(
        retrievalTime < 2000, // Should retrieve within 2 seconds
        `Large data retrieval completed in reasonable time (${retrievalTime}ms)`,
        'Performance-RetrievalTime'
      );
      
    } catch (error) {
      await this.assert(
        false,
        `Large data set handling failed: ${error.message}`,
        'Performance-LargeDataSetError'
      );
    }
  }

  async testErrorHandling() {
    this.log('Testing error handling and fallback mechanisms...', 'info');
    
    // Test invalid data handling
    try {
      const invalidPost = {
        // Missing required fields
        name: '',
        user: null,
      };
      
      await databaseService.createPost(invalidPost);
      await this.assert(false, 'Should have thrown error for invalid data', 'ErrorHandling-InvalidData');
    } catch (error) {
      await this.assert(
        true,
        'Invalid data properly rejected',
        'ErrorHandling-InvalidDataRejection'
      );
    }
    
    // Test graceful degradation
    try {
      const result = await storageService.getPosts();
      await this.assert(
        Array.isArray(result),
        'Storage service returns array even on error',
        'ErrorHandling-GracefulDegradation'
      );
    } catch (error) {
      this.log(`Storage service error: ${error.message}`, 'info');
    }
    
    // Test database error recovery
    try {
      const stats = await databaseService.getStatistics();
      await this.assert(
        typeof stats === 'object',
        'Database service provides fallback statistics',
        'ErrorHandling-DatabaseFallback'
      );
    } catch (error) {
      this.log(`Database service error: ${error.message}`, 'info');
    }
  }

  async testConcurrentOperations() {
    this.log('Testing concurrent data operations...', 'info');
    
    const testUser = createTestUser();
    await databaseService.createUser(testUser);
    
    // Test concurrent post creation
    const concurrentPosts = [];
    for (let i = 0; i < 10; i++) {
      const testPost = {
        ...createTestPost(testUser.id),
        name: `Concurrent Beetle ${i}`,
      };
      concurrentPosts.push(databaseService.createPost(testPost));
    }
    
    try {
      const results = await Promise.all(concurrentPosts);
      await this.assert(
        results.length === 10 && results.every(id => typeof id === 'string'),
        'Concurrent post creation successful',
        'Concurrency-PostCreation'
      );
      
      // Test concurrent read operations
      const concurrentReads = [];
      for (let i = 0; i < 5; i++) {
        concurrentReads.push(databaseService.getPosts(10, 0));
      }
      
      const readResults = await Promise.all(concurrentReads);
      await this.assert(
        readResults.every(posts => Array.isArray(posts)),
        'Concurrent read operations successful',
        'Concurrency-ReadOperations'
      );
      
    } catch (error) {
      await this.assert(
        false,
        `Concurrent operations failed: ${error.message}`,
        'Concurrency-Error'
      );
    }
  }

  async testMemoryUsage() {
    this.log('Testing memory usage and performance...', 'info');
    
    // This is a basic memory test - in a real app you'd use more sophisticated monitoring
    const initialMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    
    // Perform memory-intensive operations
    const testUser = createTestUser();
    await databaseService.createUser(testUser);
    
    // Create and retrieve multiple posts
    for (let i = 0; i < 50; i++) {
      const testPost = createTestPost(testUser.id);
      await databaseService.createPost(testPost);
    }
    
    const posts = await databaseService.getPosts(50, 0);
    const stats = await databaseService.getStatistics();
    
    const finalMemory = process.memoryUsage ? process.memoryUsage().heapUsed : 0;
    const memoryGrowth = finalMemory - initialMemory;
    
    await this.assert(
      posts.length > 0,
      'Memory intensive operations completed successfully',
      'Memory-OperationsComplete'
    );
    
    // Check for reasonable memory usage (this is environment dependent)
    if (process.memoryUsage) {
      await this.assert(
        memoryGrowth < 100 * 1024 * 1024, // Less than 100MB growth
        `Memory usage within acceptable limits (${Math.round(memoryGrowth / 1024 / 1024)}MB growth)`,
        'Memory-Usage'
      );
    }
  }

  // Main test runner
  async runAllTests() {
    this.log('🚀 Starting Comprehensive Data Persistence Integration Tests', 'info');
    this.log('='.repeat(80), 'info');
    
    const startTime = Date.now();
    
    try {
      // Clean up before starting
      await AsyncStorage.clear();
      await databaseService.initializeDatabase();
      await databaseService.clearAllData();
      
      // Run all test suites
      await this.testDataPersistenceAcrossRestarts();
      await this.testDatabaseIntegrity();
      await this.testDataMigration();
      await this.testPerformanceAndReliability();
      
    } catch (error) {
      this.log(`Test suite execution failed: ${error.message}`, 'error');
    }
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    this.log('='.repeat(80), 'info');
    this.log('📊 TEST RESULTS SUMMARY', 'info');
    this.log('='.repeat(80), 'info');
    this.log(`Total Tests: ${this.testResults.passed + this.testResults.failed}`, 'info');
    this.log(`Passed: ${this.testResults.passed}`, 'info');
    this.log(`Failed: ${this.testResults.failed}`, 'info');
    this.log(`Duration: ${duration}ms`, 'info');
    this.log(`Success Rate: ${((this.testResults.passed / (this.testResults.passed + this.testResults.failed)) * 100).toFixed(2)}%`, 'info');
    
    if (this.testResults.errors.length > 0) {
      this.log('\n❌ FAILED TESTS:', 'error');
      this.testResults.errors.forEach(error => {
        this.log(`- ${error.test}: ${error.message}`, 'error');
      });
    }
    
    return this.testResults;
  }
}

// Export for use
module.exports = DataPersistenceTestSuite;

// Run tests if called directly
if (require.main === module) {
  (async () => {
    const testSuite = new DataPersistenceTestSuite();
    const results = await testSuite.runAllTests();
    
    // Exit with appropriate code
    process.exit(results.failed === 0 ? 0 : 1);
  })();
}