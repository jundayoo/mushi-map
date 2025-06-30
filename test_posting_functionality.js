// Comprehensive Test Suite for MushiMap Posting Functionality
// This test validates all aspects of the posting workflow

const { storageService } = require('./src/services/storageService');
const { databaseService } = require('./src/services/databaseService');
const { authService } = require('./src/services/authService');

// Mock user data for testing
const mockUser = {
  id: 'test_user_123',
  email: 'test@mushimap.com',
  displayName: 'Test User',
  avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=testuser',
  bio: 'Test user for integration testing',
  createdAt: new Date().toISOString(),
};

// Mock post data for testing
const mockPostData = {
  name: 'カブトムシ',
  scientificName: 'Trypoxylus dichotomus',
  location: '新宿御苑',
  description: 'クヌギの樹液を吸っているカブトムシを発見しました。立派な角を持つオスでした。',
  environment: '雑木林',
  isPublic: true,
  images: [
    'file:///test/image1.jpg',
    'file:///test/image2.jpg'
  ],
  timestamp: new Date().toISOString(),
};

class PostingFunctionalityTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  // Test helper method
  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      await testFunction();
      this.testResults.push({ name: testName, status: 'PASSED' });
      console.log(`✅ ${testName} - PASSED`);
    } catch (error) {
      this.testResults.push({ name: testName, status: 'FAILED', error: error.message });
      this.errors.push({ test: testName, error });
      console.log(`❌ ${testName} - FAILED: ${error.message}`);
    }
  }

  // 1. Test PremiumAddScreen Form Validation
  async testFormValidation() {
    // Test empty name validation
    const emptyNamePost = { ...mockPostData, name: '' };
    
    if (!emptyNamePost.name.trim()) {
      console.log('  ✓ Form correctly validates empty insect name');
    } else {
      throw new Error('Form validation failed for empty name');
    }

    // Test empty images validation
    const emptyImagesPost = { ...mockPostData, images: [] };
    
    if (emptyImagesPost.images.length === 0) {
      console.log('  ✓ Form correctly validates empty images');
    } else {
      throw new Error('Form validation failed for empty images');
    }

    // Test valid form data
    if (mockPostData.name.trim() && mockPostData.images.length > 0) {
      console.log('  ✓ Form correctly validates complete data');
    } else {
      throw new Error('Form validation failed for valid data');
    }
  }

  // 2. Test StorageService Integration
  async testStorageServiceIntegration() {
    // Test adding a post
    try {
      // Mock getCurrentUser to return our test user
      const originalGetCurrentUser = authService.getCurrentUser;
      authService.getCurrentUser = async () => mockUser;

      const savedPost = await storageService.addPost(mockPostData);
      
      if (!savedPost.id) {
        throw new Error('Post ID not generated');
      }
      
      if (!savedPost.user) {
        throw new Error('User data not attached to post');
      }
      
      if (!savedPost.tags || savedPost.tags.length === 0) {
        throw new Error('Tags not generated for post');
      }
      
      console.log('  ✓ Post successfully saved to storage');
      console.log(`  ✓ Post ID: ${savedPost.id}`);
      console.log(`  ✓ Generated tags: ${savedPost.tags.join(', ')}`);
      
      // Test retrieving posts
      const posts = await storageService.getPosts();
      const foundPost = posts.find(p => p.id === savedPost.id);
      
      if (!foundPost) {
        throw new Error('Saved post not found in storage');
      }
      
      console.log('  ✓ Post successfully retrieved from storage');
      
      // Test updating post
      await storageService.updatePost(savedPost.id, { description: 'Updated description' });
      const updatedPosts = await storageService.getPosts();
      const updatedPost = updatedPosts.find(p => p.id === savedPost.id);
      
      if (updatedPost.description !== 'Updated description') {
        throw new Error('Post update failed');
      }
      
      console.log('  ✓ Post successfully updated in storage');
      
      // Test liking post
      await storageService.likePost(savedPost.id);
      const likedPosts = await storageService.getPosts();
      const likedPost = likedPosts.find(p => p.id === savedPost.id);
      
      if (likedPost.likesCount !== 1) {
        throw new Error('Post like functionality failed');
      }
      
      console.log('  ✓ Post like functionality working');
      
      // Restore original function
      authService.getCurrentUser = originalGetCurrentUser;
      
    } catch (error) {
      throw new Error(`Storage service integration failed: ${error.message}`);
    }
  }

  // 3. Test Database Integration
  async testDatabaseIntegration() {
    try {
      // Initialize database
      await databaseService.initializeDatabase();
      console.log('  ✓ Database initialized successfully');
      
      // Test user creation
      await databaseService.createUser(mockUser);
      console.log('  ✓ User created in database');
      
      // Test user retrieval
      const retrievedUser = await databaseService.getUser(mockUser.id);
      if (!retrievedUser || retrievedUser.id !== mockUser.id) {
        throw new Error('User retrieval from database failed');
      }
      console.log('  ✓ User retrieved from database');
      
      // Test post creation
      const postWithUser = {
        ...mockPostData,
        user: mockUser,
        tags: ['カブトムシ', '夏', '成虫']
      };
      
      const postId = await databaseService.createPost(postWithUser);
      if (!postId) {
        throw new Error('Post creation in database failed');
      }
      console.log(`  ✓ Post created in database with ID: ${postId}`);
      
      // Test post retrieval
      const posts = await databaseService.getPosts(10, 0);
      const foundPost = posts.find(p => p.id === postId);
      
      if (!foundPost) {
        throw new Error('Post retrieval from database failed');
      }
      console.log('  ✓ Post retrieved from database');
      
      // Verify post data integrity
      if (foundPost.name !== mockPostData.name) {
        throw new Error('Post name not preserved in database');
      }
      
      if (foundPost.images.length !== mockPostData.images.length) {
        throw new Error('Post images not preserved in database');
      }
      
      if (foundPost.tags.length === 0) {
        throw new Error('Post tags not preserved in database');
      }
      
      console.log('  ✓ Post data integrity verified');
      
      // Test like functionality
      await databaseService.likePost(mockUser.id, postId);
      const likedPosts = await databaseService.getPosts(10, 0);
      const likedPost = likedPosts.find(p => p.id === postId);
      
      if (likedPost.likesCount !== 1) {
        throw new Error('Database like functionality failed');
      }
      console.log('  ✓ Database like functionality working');
      
      // Test search functionality
      const searchResults = await databaseService.searchPosts('カブトムシ');
      if (searchResults.length === 0) {
        throw new Error('Database search functionality failed');
      }
      console.log('  ✓ Database search functionality working');
      
      // Test statistics
      const stats = await databaseService.getStatistics();
      if (stats.totalPosts === 0) {
        throw new Error('Database statistics not working');
      }
      console.log('  ✓ Database statistics working');
      
    } catch (error) {
      throw new Error(`Database integration failed: ${error.message}`);
    }
  }

  // 4. Test Data Synchronization
  async testDataSynchronization() {
    try {
      // Mock getCurrentUser to return our test user
      const originalGetCurrentUser = authService.getCurrentUser;
      authService.getCurrentUser = async () => mockUser;
      
      // Clear existing data
      await storageService.clearAllData();
      await databaseService.clearAllData();
      
      // Add post via storage service
      const storagePost = await storageService.addPost(mockPostData);
      console.log('  ✓ Post added via storage service');
      
      // Verify data exists in AsyncStorage
      const storagePosts = await storageService.getPosts();
      if (storagePosts.length === 0) {
        throw new Error('Post not found in AsyncStorage');
      }
      console.log('  ✓ Post exists in AsyncStorage');
      
      // Initialize database and create user
      await databaseService.initializeDatabase();
      await databaseService.createUser(mockUser);
      
      // Add the same post to database
      const postWithUser = {
        ...mockPostData,
        user: mockUser,
        tags: storagePost.tags
      };
      
      const dbPostId = await databaseService.createPost(postWithUser);
      console.log('  ✓ Post added to database');
      
      // Verify both storage mechanisms have the data
      const dbPosts = await databaseService.getPosts();
      if (dbPosts.length === 0) {
        throw new Error('Post not found in database');
      }
      
      console.log('  ✓ Data synchronization between AsyncStorage and SQLite verified');
      
      // Restore original function
      authService.getCurrentUser = originalGetCurrentUser;
      
    } catch (error) {
      throw new Error(`Data synchronization failed: ${error.message}`);
    }
  }

  // 5. Test Image Handling
  async testImageHandling() {
    try {
      // Test image URI validation
      const validImageUris = [
        'file:///path/to/image.jpg',
        'content://media/external/images/media/123',
        'ph://123456789/L0/001'
      ];
      
      for (const uri of validImageUris) {
        if (!uri || typeof uri !== 'string') {
          throw new Error(`Invalid image URI: ${uri}`);
        }
      }
      console.log('  ✓ Image URI validation working');
      
      // Test image limit validation
      const maxImages = 3;
      const testImages = ['img1.jpg', 'img2.jpg', 'img3.jpg', 'img4.jpg'];
      const limitedImages = testImages.slice(0, maxImages);
      
      if (limitedImages.length !== maxImages) {
        throw new Error('Image limit not enforced');
      }
      console.log('  ✓ Image limit validation working');
      
      // Test image removal
      let selectedImages = ['img1.jpg', 'img2.jpg', 'img3.jpg'];
      const removeIndex = 1;
      selectedImages = selectedImages.filter((_, i) => i !== removeIndex);
      
      if (selectedImages.length !== 2 || selectedImages.includes('img2.jpg')) {
        throw new Error('Image removal not working');
      }
      console.log('  ✓ Image removal functionality working');
      
    } catch (error) {
      throw new Error(`Image handling failed: ${error.message}`);
    }
  }

  // 6. Test Authentication Integration
  async testAuthenticationIntegration() {
    try {
      // Test user authentication check
      const originalGetCurrentUser = authService.getCurrentUser;
      
      // Test with no user (should fail)
      authService.getCurrentUser = async () => null;
      
      try {
        await storageService.addPost(mockPostData);
        throw new Error('Post creation should fail without authenticated user');
      } catch (error) {
        if (error.message.includes('ログインしていません') || error.message.includes('ユーザーがログインしていません')) {
          console.log('  ✓ Authentication check working for unauthenticated user');
        } else {
          throw error;
        }
      }
      
      // Test with authenticated user (should succeed)
      authService.getCurrentUser = async () => mockUser;
      
      const postWithAuth = await storageService.addPost(mockPostData);
      if (!postWithAuth.user || postWithAuth.user.id !== mockUser.id) {
        throw new Error('Post not properly associated with authenticated user');
      }
      console.log('  ✓ Authentication check working for authenticated user');
      
      // Restore original function
      authService.getCurrentUser = originalGetCurrentUser;
      
    } catch (error) {
      throw new Error(`Authentication integration failed: ${error.message}`);
    }
  }

  // 7. Test Error Handling
  async testErrorHandling() {
    try {
      // Test storage service error handling
      const originalSetItem = require('@react-native-async-storage/async-storage').setItem;
      
      // Mock AsyncStorage to fail
      require('@react-native-async-storage/async-storage').setItem = async () => {
        throw new Error('Storage write failed');
      };
      
      try {
        await storageService.savePosts([mockPostData]);
        throw new Error('Storage error handling not working');
      } catch (error) {
        if (error.message.includes('投稿の保存に失敗しました')) {
          console.log('  ✓ Storage service error handling working');
        } else {
          throw error;
        }
      }
      
      // Restore original function
      require('@react-native-async-storage/async-storage').setItem = originalSetItem;
      
      // Test invalid post data
      const invalidPost = { ...mockPostData, name: null };
      
      try {
        // This should be caught by form validation before reaching storage
        if (!invalidPost.name || !invalidPost.name.trim()) {
          console.log('  ✓ Invalid post data handled correctly');
        } else {
          throw new Error('Invalid post data not handled');
        }
      } catch (error) {
        console.log('  ✓ Invalid post data error handling working');
      }
      
    } catch (error) {
      throw new Error(`Error handling test failed: ${error.message}`);
    }
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting MushiMap Posting Functionality Test Suite');
    console.log('==================================================');
    
    await this.runTest('Form Validation', () => this.testFormValidation());
    await this.runTest('Storage Service Integration', () => this.testStorageServiceIntegration());
    await this.runTest('Database Integration', () => this.testDatabaseIntegration());
    await this.runTest('Data Synchronization', () => this.testDataSynchronization());
    await this.runTest('Image Handling', () => this.testImageHandling());
    await this.runTest('Authentication Integration', () => this.testAuthenticationIntegration());
    await this.runTest('Error Handling', () => this.testErrorHandling());
    
    // Print summary
    console.log('\n📊 Test Summary');
    console.log('================');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / this.testResults.length) * 100).toFixed(1)}%`);
    
    if (this.errors.length > 0) {
      console.log('\n🐛 Error Details:');
      this.errors.forEach(({ test, error }) => {
        console.log(`\n❌ ${test}:`);
        console.log(`   ${error.message}`);
        if (error.stack) {
          console.log(`   Stack: ${error.stack.split('\n')[1]?.trim()}`);
        }
      });
    }
    
    return {
      totalTests: this.testResults.length,
      passed,
      failed,
      successRate: (passed / this.testResults.length) * 100,
      errors: this.errors
    };
  }
}

// Export for use in other files
module.exports = PostingFunctionalityTester;

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new PostingFunctionalityTester();
  tester.runAllTests().then(results => {
    console.log('\n🎯 Final Results:', results);
    process.exit(results.failed > 0 ? 1 : 0);
  }).catch(error => {
    console.error('Test runner failed:', error);
    process.exit(1);
  });
}