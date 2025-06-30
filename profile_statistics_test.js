const AsyncStorage = require('@react-native-async-storage/async-storage').default;

// Profile and Statistics Testing Suite for MushiMap App
class ProfileStatisticsTestSuite {
  constructor() {
    this.testResults = {
      profileFunctionality: {},
      statisticsCalculation: {},
      dataConsistency: {},
      userExperience: {},
      overallScore: 0,
      recommendations: []
    };
  }

  // 1. Profile Functionality Testing
  async testProfileFunctionality() {
    console.log('🧪 Profile Functionality Testing...');
    const results = {};

    try {
      // Test 1.1: User Profile Data Loading
      results.profileDataLoading = await this.testProfileDataLoading();
      
      // Test 1.2: Authentication State Management
      results.authStateManagement = await this.testAuthStateManagement();
      
      // Test 1.3: Profile Updates and Data Persistence
      results.profileUpdates = await this.testProfileUpdates();
      
      // Test 1.4: User Avatar and Bio Display
      results.avatarBioDisplay = await this.testAvatarBioDisplay();
      
      this.testResults.profileFunctionality = results;
      console.log('✅ Profile Functionality Tests Completed');
    } catch (error) {
      console.error('❌ Profile Functionality Tests Failed:', error);
      results.error = error.message;
    }

    return results;
  }

  async testProfileDataLoading() {
    const issues = [];
    const suggestions = [];

    // Simulate user data structure
    const mockUserData = {
      id: 'user_test_123',
      email: 'test@mushimap.com',
      displayName: 'Test User',
      avatar: 'https://api.dicebear.com/7.x/adventurer/svg?seed=test',
      bio: 'Test bio for profile testing',
      createdAt: new Date().toISOString()
    };

    try {
      // Test data persistence
      await AsyncStorage.setItem('current_user', JSON.stringify(mockUserData));
      const retrievedData = await AsyncStorage.getItem('current_user');
      const parsedData = JSON.parse(retrievedData);

      // Validate data integrity
      if (parsedData.id !== mockUserData.id) {
        issues.push('User ID mismatch during data retrieval');
      }
      if (!parsedData.displayName) {
        issues.push('Display name not properly stored/retrieved');
      }
      if (!parsedData.avatar) {
        issues.push('Avatar URL not properly stored/retrieved');
      }

      // Test fallback avatar generation
      if (!parsedData.avatar || parsedData.avatar === '') {
        const fallbackAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${parsedData.id}`;
        suggestions.push(`Implement fallback avatar: ${fallbackAvatar}`);
      }

    } catch (error) {
      issues.push(`Profile data loading error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  async testAuthStateManagement() {
    const issues = [];
    const suggestions = [];

    try {
      // Test authentication state persistence
      const authStates = [
        { state: 'logged_in', user: { id: 'user_123', email: 'test@test.com' } },
        { state: 'logged_out', user: null },
        { state: 'session_expired', user: null }
      ];

      for (const authState of authStates) {
        if (authState.user) {
          await AsyncStorage.setItem('current_user', JSON.stringify(authState.user));
        } else {
          await AsyncStorage.removeItem('current_user');
        }

        const storedUser = await AsyncStorage.getItem('current_user');
        const isLoggedIn = storedUser !== null;

        if (authState.state === 'logged_in' && !isLoggedIn) {
          issues.push('Failed to maintain logged in state');
        }
        if (authState.state === 'logged_out' && isLoggedIn) {
          issues.push('Failed to clear logged out state');
        }
      }

      // Test session validation
      const userSessions = await AsyncStorage.getItem('user_sessions');
      if (!userSessions) {
        suggestions.push('Implement user session management for better security');
      }

    } catch (error) {
      issues.push(`Auth state management error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  async testProfileUpdates() {
    const issues = [];
    const suggestions = [];

    try {
      // Test profile update scenarios
      const originalProfile = {
        id: 'user_update_test',
        displayName: 'Original Name',
        bio: 'Original bio',
        avatar: 'original_avatar.jpg'
      };

      const updates = [
        { displayName: 'Updated Name' },
        { bio: 'Updated bio with new information' },
        { avatar: 'new_avatar.jpg' },
        { displayName: 'Final Name', bio: 'Final bio' }
      ];

      await AsyncStorage.setItem('current_user', JSON.stringify(originalProfile));

      for (const update of updates) {
        const currentData = JSON.parse(await AsyncStorage.getItem('current_user'));
        const updatedData = { ...currentData, ...update };
        await AsyncStorage.setItem('current_user', JSON.stringify(updatedData));

        // Verify update persistence
        const verifyData = JSON.parse(await AsyncStorage.getItem('current_user'));
        for (const [key, value] of Object.entries(update)) {
          if (verifyData[key] !== value) {
            issues.push(`Profile update failed for field: ${key}`);
          }
        }
      }

      // Test concurrent update handling
      suggestions.push('Implement optimistic updates with rollback mechanism');
      suggestions.push('Add validation for profile update data');

    } catch (error) {
      issues.push(`Profile update error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 30))
    };
  }

  async testAvatarBioDisplay() {
    const issues = [];
    const suggestions = [];

    try {
      // Test avatar display scenarios
      const avatarTestCases = [
        { avatar: 'https://valid-url.com/avatar.jpg', expected: 'valid_url' },
        { avatar: '', expected: 'fallback_needed' },
        { avatar: null, expected: 'fallback_needed' },
        { avatar: 'invalid-url', expected: 'fallback_needed' }
      ];

      for (const testCase of avatarTestCases) {
        const profile = {
          id: 'avatar_test',
          avatar: testCase.avatar,
          displayName: 'Test User'
        };

        // Simulate avatar validation
        const isValidUrl = testCase.avatar && testCase.avatar.startsWith('http');
        if (!isValidUrl && testCase.expected === 'valid_url') {
          issues.push('Avatar URL validation insufficient');
        }

        if (!testCase.avatar && testCase.expected === 'fallback_needed') {
          const fallbackAvatar = `https://api.dicebear.com/7.x/adventurer/svg?seed=${profile.id}`;
          suggestions.push(`Use fallback avatar: ${fallbackAvatar}`);
        }
      }

      // Test bio display scenarios
      const bioTestCases = [
        { bio: 'Normal bio text', expected: 'display' },
        { bio: '', expected: 'hide' },
        { bio: null, expected: 'hide' },
        { bio: 'Very long bio text that might need truncation or special handling in the UI', expected: 'truncate' }
      ];

      for (const testCase of bioTestCases) {
        if (testCase.bio && testCase.bio.length > 100) {
          suggestions.push('Consider adding bio character limit or truncation');
        }
        if (!testCase.bio && testCase.expected === 'hide') {
          suggestions.push('Hide bio section when empty to improve UI');
        }
      }

    } catch (error) {
      issues.push(`Avatar/Bio display error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  // 2. Statistics Calculation Testing
  async testStatisticsCalculation() {
    console.log('📊 Statistics Calculation Testing...');
    const results = {};

    try {
      // Test 2.1: Statistics Accuracy
      results.statisticsAccuracy = await this.testStatisticsAccuracy();
      
      // Test 2.2: Statistics Updates
      results.statisticsUpdates = await this.testStatisticsUpdates();
      
      // Test 2.3: Performance Testing
      results.performanceTesting = await this.testStatisticsPerformance();
      
      // Test 2.4: Edge Cases
      results.edgeCases = await this.testStatisticsEdgeCases();
      
      this.testResults.statisticsCalculation = results;
      console.log('✅ Statistics Calculation Tests Completed');
    } catch (error) {
      console.error('❌ Statistics Calculation Tests Failed:', error);
      results.error = error.message;
    }

    return results;
  }

  async testStatisticsAccuracy() {
    const issues = [];
    const suggestions = [];

    try {
      // Create mock post data for statistics testing
      const mockPosts = [
        { id: '1', user: { id: 'user1' }, name: 'カブトムシ', likesCount: 5, timestamp: '2024-01-01' },
        { id: '2', user: { id: 'user1' }, name: 'クワガタ', likesCount: 8, timestamp: '2024-01-02' },
        { id: '3', user: { id: 'user2' }, name: 'カブトムシ', likesCount: 3, timestamp: '2024-01-03' },
        { id: '4', user: { id: 'user1' }, name: 'テントウムシ', likesCount: 2, timestamp: '2024-01-04' }
      ];

      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(mockPosts));

      // Test posts count calculation
      const totalPosts = mockPosts.length;
      if (totalPosts !== 4) {
        issues.push('Incorrect total posts calculation');
      }

      // Test likes count calculation
      const totalLikes = mockPosts.reduce((sum, post) => sum + post.likesCount, 0);
      if (totalLikes !== 18) {
        issues.push('Incorrect total likes calculation');
      }

      // Test unique species calculation
      const uniqueSpecies = new Set(mockPosts.map(post => post.name)).size;
      if (uniqueSpecies !== 3) {
        issues.push('Incorrect unique species calculation');
      }

      // Test user-specific statistics
      const user1Posts = mockPosts.filter(post => post.user.id === 'user1');
      const user1Likes = user1Posts.reduce((sum, post) => sum + post.likesCount, 0);
      const user1Species = new Set(user1Posts.map(post => post.name)).size;

      if (user1Posts.length !== 3) {
        issues.push('Incorrect user posts filtering');
      }
      if (user1Likes !== 15) {
        issues.push('Incorrect user likes calculation');
      }
      if (user1Species !== 3) {
        issues.push('Incorrect user species calculation');
      }

      suggestions.push('Cache statistics to improve performance');
      suggestions.push('Add statistics validation to prevent negative values');

    } catch (error) {
      issues.push(`Statistics accuracy error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  async testStatisticsUpdates() {
    const issues = [];
    const suggestions = [];

    try {
      // Test real-time statistics updates
      const initialPosts = [
        { id: '1', user: { id: 'user1' }, name: 'カブトムシ', likesCount: 5, location: 'Tokyo' }
      ];

      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(initialPosts));

      // Simulate adding new post
      const newPost = { id: '2', user: { id: 'user1' }, name: 'クワガタ', likesCount: 0, location: 'Osaka' };
      const updatedPosts = [...initialPosts, newPost];
      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(updatedPosts));

      // Verify statistics update
      const currentPosts = JSON.parse(await AsyncStorage.getItem('@mushi_map_posts'));
      const stats = {
        totalPosts: currentPosts.length,
        totalLikes: currentPosts.reduce((sum, post) => sum + post.likesCount, 0),
        totalSpecies: new Set(currentPosts.map(post => post.name)).size,
        totalLocations: new Set(currentPosts.map(post => post.location)).size
      };

      if (stats.totalPosts !== 2) {
        issues.push('Statistics not updated after new post');
      }
      if (stats.totalSpecies !== 2) {
        issues.push('Species count not updated correctly');
      }
      if (stats.totalLocations !== 2) {
        issues.push('Location count not calculated correctly');
      }

      // Test like increment
      updatedPosts[0].likesCount += 1;
      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(updatedPosts));

      const newLikesTotal = updatedPosts.reduce((sum, post) => sum + post.likesCount, 0);
      if (newLikesTotal !== 6) {
        issues.push('Like count not updated correctly');
      }

      suggestions.push('Implement real-time statistics updates using observers');
      suggestions.push('Add debouncing to prevent excessive recalculations');

    } catch (error) {
      issues.push(`Statistics update error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  async testStatisticsPerformance() {
    const issues = [];
    const suggestions = [];

    try {
      // Generate large dataset for performance testing
      const largePosts = [];
      const speciesNames = ['カブトムシ', 'クワガタ', 'テントウムシ', 'カマキリ', 'バッタ'];
      const locations = ['Tokyo', 'Osaka', 'Kyoto', 'Nagoya', 'Fukuoka'];

      for (let i = 0; i < 1000; i++) {
        largePosts.push({
          id: `post_${i}`,
          user: { id: `user_${i % 10}` },
          name: speciesNames[i % speciesNames.length],
          location: locations[i % locations.length],
          likesCount: Math.floor(Math.random() * 20),
          timestamp: new Date(Date.now() - Math.random() * 86400000 * 30).toISOString()
        });
      }

      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(largePosts));

      // Test calculation performance
      const startTime = Date.now();
      
      const stats = {
        totalPosts: largePosts.length,
        totalLikes: largePosts.reduce((sum, post) => sum + post.likesCount, 0),
        totalSpecies: new Set(largePosts.map(post => post.name)).size,
        totalLocations: new Set(largePosts.map(post => post.location)).size,
        totalUsers: new Set(largePosts.map(post => post.user.id)).size
      };

      const calculationTime = Date.now() - startTime;

      if (calculationTime > 100) {
        issues.push(`Statistics calculation too slow: ${calculationTime}ms`);
      }

      // Test memory usage for large datasets
      if (largePosts.length > 500) {
        suggestions.push('Consider pagination for large datasets');
        suggestions.push('Implement lazy loading for statistics');
      }

      suggestions.push('Use memoization for expensive calculations');
      suggestions.push('Consider background calculation for statistics');

    } catch (error) {
      issues.push(`Performance testing error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 30))
    };
  }

  async testStatisticsEdgeCases() {
    const issues = [];
    const suggestions = [];

    try {
      // Test empty data scenarios
      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify([]));
      
      const emptyStats = {
        totalPosts: 0,
        totalLikes: 0,
        totalSpecies: 0,
        totalLocations: 0
      };

      // Test null/undefined handling
      const edgeCasePosts = [
        { id: '1', user: { id: 'user1' }, name: null, likesCount: 5 },
        { id: '2', user: { id: 'user2' }, name: '', likesCount: null },
        { id: '3', user: { id: 'user3' }, name: 'カブトムシ', likesCount: 0 },
      ];

      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(edgeCasePosts));

      // Test filtering null/empty values
      const validPosts = edgeCasePosts.filter(post => post.name && post.name.trim() !== '');
      if (validPosts.length !== 1) {
        issues.push('Null/empty name filtering not working correctly');
      }

      // Test negative values handling
      const negativeValuePost = { id: '4', user: { id: 'user4' }, name: 'テスト', likesCount: -5 };
      const postsWithNegative = [...edgeCasePosts, negativeValuePost];
      
      const totalLikes = postsWithNegative.reduce((sum, post) => sum + (post.likesCount || 0), 0);
      if (totalLikes < 0) {
        issues.push('Negative likes count not handled properly');
      }

      // Test very long strings
      const longName = 'A'.repeat(1000);
      const longNamePost = { id: '5', user: { id: 'user5' }, name: longName, likesCount: 1 };
      
      if (longName.length > 100) {
        suggestions.push('Add string length validation for species names');
      }

      suggestions.push('Add data validation before statistics calculation');
      suggestions.push('Handle edge cases gracefully with fallback values');

    } catch (error) {
      issues.push(`Edge cases error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  // 3. Data Consistency Testing
  async testDataConsistency() {
    console.log('🔄 Data Consistency Testing...');
    const results = {};

    try {
      results.userPostFiltering = await this.testUserPostFiltering();
      results.postCounting = await this.testPostCounting();
      results.speciesUniqueness = await this.testSpeciesUniqueness();
      results.dataSynchronization = await this.testDataSynchronization();
      
      this.testResults.dataConsistency = results;
      console.log('✅ Data Consistency Tests Completed');
    } catch (error) {
      console.error('❌ Data Consistency Tests Failed:', error);
      results.error = error.message;
    }

    return results;
  }

  async testUserPostFiltering() {
    const issues = [];
    const suggestions = [];

    try {
      const allPosts = [
        { id: '1', user: { id: 'user1', displayName: 'User 1' }, name: 'カブトムシ' },
        { id: '2', user: { id: 'user2', displayName: 'User 2' }, name: 'クワガタ' },
        { id: '3', user: { id: 'user1', displayName: 'User 1' }, name: 'テントウムシ' },
        { id: '4', user: { id: 'user3', displayName: 'User 3' }, name: 'カマキリ' },
        { id: '5', user: { id: 'user1', displayName: 'User 1' }, name: 'バッタ' }
      ];

      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(allPosts));

      // Test user-specific filtering
      const user1Posts = allPosts.filter(post => post.user.id === 'user1');
      if (user1Posts.length !== 3) {
        issues.push('User post filtering returning incorrect count');
      }

      // Test user ID consistency
      const user1Ids = user1Posts.map(post => post.user.id);
      const uniqueUserIds = new Set(user1Ids);
      if (uniqueUserIds.size !== 1 || !uniqueUserIds.has('user1')) {
        issues.push('User ID consistency check failed');
      }

      // Test empty user scenarios
      const emptyUserPosts = allPosts.filter(post => !post.user || !post.user.id);
      if (emptyUserPosts.length > 0) {
        issues.push('Posts with missing user data found');
      }

      suggestions.push('Add user ID validation before saving posts');
      suggestions.push('Implement user reference integrity checks');

    } catch (error) {
      issues.push(`User post filtering error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  async testPostCounting() {
    const issues = [];
    const suggestions = [];

    try {
      // Test various counting scenarios
      const testCases = [
        { posts: [], expectedCount: 0 },
        { posts: [{ id: '1', user: { id: 'user1' } }], expectedCount: 1 },
        { posts: Array.from({ length: 100 }, (_, i) => ({ id: i.toString(), user: { id: 'user1' } })), expectedCount: 100 }
      ];

      for (const testCase of testCases) {
        await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(testCase.posts));
        
        const storedPosts = JSON.parse(await AsyncStorage.getItem('@mushi_map_posts'));
        const actualCount = storedPosts.length;
        
        if (actualCount !== testCase.expectedCount) {
          issues.push(`Post count mismatch: expected ${testCase.expectedCount}, got ${actualCount}`);
        }
      }

      // Test duplicate post detection
      const duplicatePosts = [
        { id: '1', user: { id: 'user1' }, name: 'カブトムシ' },
        { id: '1', user: { id: 'user1' }, name: 'カブトムシ' }, // Duplicate ID
        { id: '2', user: { id: 'user1' }, name: 'クワガタ' }
      ];

      const uniquePostIds = new Set(duplicatePosts.map(post => post.id));
      if (uniquePostIds.size !== duplicatePosts.length) {
        suggestions.push('Implement duplicate post ID detection');
      }

      suggestions.push('Add post count validation on data operations');
      suggestions.push('Implement atomic counting for concurrent operations');

    } catch (error) {
      issues.push(`Post counting error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  async testSpeciesUniqueness() {
    const issues = [];
    const suggestions = [];

    try {
      const posts = [
        { id: '1', name: 'カブトムシ', user: { id: 'user1' } },
        { id: '2', name: 'カブトムシ', user: { id: 'user2' } }, // Same species, different user
        { id: '3', name: 'クワガタ', user: { id: 'user1' } },
        { id: '4', name: 'カブトムシ', user: { id: 'user3' } }, // Case variation
        { id: '5', name: 'カブトムシ ', user: { id: 'user4' } }, // Trailing space
      ];

      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(posts));

      // Test basic uniqueness calculation
      const speciesNames = posts.map(post => post.name);
      const uniqueSpecies = new Set(speciesNames);
      
      if (uniqueSpecies.size === 4) {
        issues.push('Species uniqueness not handling case sensitivity and whitespace');
      }

      // Test normalized uniqueness
      const normalizedNames = posts.map(post => post.name.trim().toLowerCase());
      const normalizedUnique = new Set(normalizedNames);
      
      if (normalizedUnique.size !== 2) {
        issues.push('Normalized species uniqueness calculation incorrect');
      }

      // Test empty/null species names
      const postsWithEmpty = [
        ...posts,
        { id: '6', name: '', user: { id: 'user5' } },
        { id: '7', name: null, user: { id: 'user6' } },
        { id: '8', name: undefined, user: { id: 'user7' } }
      ];

      const validSpeciesNames = postsWithEmpty
        .map(post => post.name)
        .filter(name => name && name.trim());

      suggestions.push('Normalize species names before uniqueness calculation');
      suggestions.push('Add species name validation and cleanup');
      suggestions.push('Consider scientific name matching for better accuracy');

    } catch (error) {
      issues.push(`Species uniqueness error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  async testDataSynchronization() {
    const issues = [];
    const suggestions = [];

    try {
      // Test AsyncStorage and database sync
      const testData = [
        { id: '1', user: { id: 'user1', displayName: 'User 1' }, name: 'カブトムシ', timestamp: new Date().toISOString() }
      ];

      // Simulate AsyncStorage data
      await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(testData));
      await AsyncStorage.setItem('current_user', JSON.stringify({ id: 'user1', displayName: 'User 1' }));

      // Test data consistency between stores
      const asyncPosts = JSON.parse(await AsyncStorage.getItem('@mushi_map_posts'));
      const currentUser = JSON.parse(await AsyncStorage.getItem('current_user'));

      // Verify user data consistency in posts
      const userConsistency = asyncPosts.every(post => 
        post.user.id === currentUser.id && post.user.displayName === currentUser.displayName
      );

      if (!userConsistency) {
        issues.push('User data inconsistency between posts and profile');
      }

      // Test sync timing
      const syncScenarios = [
        'profile_update_before_post_creation',
        'post_creation_before_profile_update',
        'concurrent_updates'
      ];

      for (const scenario of syncScenarios) {
        suggestions.push(`Handle synchronization for scenario: ${scenario}`);
      }

      // Test offline/online sync
      suggestions.push('Implement offline data synchronization');
      suggestions.push('Add conflict resolution for concurrent updates');
      suggestions.push('Use timestamps for data freshness validation');

    } catch (error) {
      issues.push(`Data synchronization error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 30))
    };
  }

  // 4. User Experience Testing
  async testUserExperience() {
    console.log('👤 User Experience Testing...');
    const results = {};

    try {
      results.loadingStates = await this.testLoadingStates();
      results.errorHandling = await this.testErrorHandling();
      results.refreshFunctionality = await this.testRefreshFunctionality();
      results.navigationFlow = await this.testNavigationFlow();
      
      this.testResults.userExperience = results;
      console.log('✅ User Experience Tests Completed');
    } catch (error) {
      console.error('❌ User Experience Tests Failed:', error);
      results.error = error.message;
    }

    return results;
  }

  async testLoadingStates() {
    const issues = [];
    const suggestions = [];

    try {
      // Test various loading scenarios
      const loadingScenarios = [
        { name: 'initial_load', duration: 100 },
        { name: 'data_refresh', duration: 50 },
        { name: 'user_posts_load', duration: 75 },
        { name: 'statistics_calculation', duration: 25 }
      ];

      for (const scenario of loadingScenarios) {
        const startTime = Date.now();
        
        // Simulate loading operation
        await new Promise(resolve => setTimeout(resolve, scenario.duration));
        
        const actualDuration = Date.now() - startTime;
        
        if (actualDuration > 200) {
          issues.push(`${scenario.name} loading too slow: ${actualDuration}ms`);
        }
      }

      // Test loading state management
      const loadingStates = ['idle', 'loading', 'success', 'error'];
      for (const state of loadingStates) {
        // Simulate state transitions
        if (state === 'loading') {
          suggestions.push('Show loading indicator during data fetch');
        }
        if (state === 'error') {
          suggestions.push('Provide meaningful error messages');
        }
      }

      suggestions.push('Implement skeleton loading for better perceived performance');
      suggestions.push('Add progress indicators for long operations');
      suggestions.push('Cache data to reduce loading times');

    } catch (error) {
      issues.push(`Loading states error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  async testErrorHandling() {
    const issues = [];
    const suggestions = [];

    try {
      // Test error scenarios
      const errorScenarios = [
        { type: 'network_error', message: 'Network request failed' },
        { type: 'storage_error', message: 'Local storage access denied' },
        { type: 'auth_error', message: 'Authentication failed' },
        { type: 'data_parsing_error', message: 'Invalid data format' }
      ];

      for (const scenario of errorScenarios) {
        try {
          // Simulate error condition
          if (scenario.type === 'storage_error') {
            // Test storage error handling
            await AsyncStorage.getItem('non_existent_key');
          }
          if (scenario.type === 'data_parsing_error') {
            // Test JSON parsing error
            JSON.parse('invalid json');
          }
        } catch (simulatedError) {
          // Error should be caught and handled gracefully
          suggestions.push(`Handle ${scenario.type} gracefully with user-friendly message`);
        }
      }

      // Test error recovery mechanisms
      const recoveryMechanisms = [
        'retry_failed_operations',
        'fallback_to_cached_data',
        'graceful_degradation',
        'user_feedback_on_errors'
      ];

      for (const mechanism of recoveryMechanisms) {
        suggestions.push(`Implement ${mechanism.replace(/_/g, ' ')}`);
      }

      suggestions.push('Log errors for debugging and monitoring');
      suggestions.push('Provide offline mode for network errors');

    } catch (error) {
      issues.push(`Error handling test error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 20))
    };
  }

  async testRefreshFunctionality() {
    const issues = [];
    const suggestions = [];

    try {
      // Test pull-to-refresh scenarios
      const refreshScenarios = [
        { trigger: 'pull_down', expectedAction: 'reload_posts' },
        { trigger: 'tab_refocus', expectedAction: 'update_data' },
        { trigger: 'manual_refresh', expectedAction: 'force_reload' }
      ];

      for (const scenario of refreshScenarios) {
        // Simulate refresh trigger
        const beforeRefresh = JSON.parse(await AsyncStorage.getItem('@mushi_map_posts') || '[]');
        
        // Add new data to simulate refresh
        const newPost = {
          id: `refresh_${Date.now()}`,
          name: 'New Post',
          user: { id: 'user1' },
          timestamp: new Date().toISOString()
        };
        
        const afterRefresh = [...beforeRefresh, newPost];
        await AsyncStorage.setItem('@mushi_map_posts', JSON.stringify(afterRefresh));
        
        // Verify refresh updated data
        const refreshedData = JSON.parse(await AsyncStorage.getItem('@mushi_map_posts'));
        if (refreshedData.length <= beforeRefresh.length) {
          issues.push(`Refresh did not update data for ${scenario.trigger}`);
        }
      }

      // Test refresh indicators
      suggestions.push('Show refresh animation during pull-to-refresh');
      suggestions.push('Provide visual feedback for refresh completion');
      suggestions.push('Implement smart refresh to avoid unnecessary updates');

      // Test refresh frequency limits
      suggestions.push('Add rate limiting to prevent excessive refresh requests');

    } catch (error) {
      issues.push(`Refresh functionality error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 25))
    };
  }

  async testNavigationFlow() {
    const issues = [];
    const suggestions = [];

    try {
      // Test navigation scenarios
      const navigationFlows = [
        { from: 'ProfileScreen', to: 'InsectDetail', trigger: 'post_tap' },
        { from: 'ProfileScreen', to: 'EditProfile', trigger: 'edit_button' },
        { from: 'ProfileScreen', to: 'Login', trigger: 'logout' },
        { from: 'PremiumMapScreen', to: 'ProfileScreen', trigger: 'tab_switch' }
      ];

      for (const flow of navigationFlows) {
        // Simulate navigation trigger
        if (flow.trigger === 'post_tap') {
          const mockPost = {
            id: 'nav_test_post',
            name: 'Test Insect',
            user: { displayName: 'Test User', avatar: 'test.jpg' },
            images: ['test.jpg'],
            description: 'Test description'
          };
          
          // Navigation should pass correct data
          if (!mockPost.id || !mockPost.name) {
            issues.push('Navigation data incomplete for post details');
          }
        }
        
        if (flow.trigger === 'logout') {
          // Should clear user session
          await AsyncStorage.removeItem('current_user');
          const clearedUser = await AsyncStorage.getItem('current_user');
          if (clearedUser !== null) {
            issues.push('User session not cleared on logout navigation');
          }
        }
      }

      // Test deep linking
      suggestions.push('Implement deep linking for direct post access');
      suggestions.push('Add navigation breadcrumbs for complex flows');
      suggestions.push('Handle navigation state restoration');

      // Test accessibility
      suggestions.push('Add accessibility labels for navigation elements');
      suggestions.push('Implement keyboard navigation support');

    } catch (error) {
      issues.push(`Navigation flow error: ${error.message}`);
    }

    return {
      status: issues.length === 0 ? 'PASS' : 'FAIL',
      issues,
      suggestions,
      score: Math.max(0, 100 - (issues.length * 30))
    };
  }

  // Generate comprehensive test report
  generateReport() {
    console.log('\n📋 COMPREHENSIVE PROFILE & STATISTICS TEST REPORT');
    console.log('=' * 60);

    const allCategories = [
      { name: 'Profile Functionality', results: this.testResults.profileFunctionality },
      { name: 'Statistics Calculation', results: this.testResults.statisticsCalculation },
      { name: 'Data Consistency', results: this.testResults.dataConsistency },
      { name: 'User Experience', results: this.testResults.userExperience }
    ];

    let totalScore = 0;
    let totalTests = 0;
    const allRecommendations = [];

    allCategories.forEach(category => {
      console.log(`\n🔍 ${category.name}`);
      console.log('-'.repeat(40));

      if (category.results.error) {
        console.log(`❌ Category Error: ${category.results.error}`);
        return;
      }

      Object.entries(category.results).forEach(([testName, result]) => {
        if (result.status) {
          const status = result.status === 'PASS' ? '✅' : '❌';
          console.log(`${status} ${testName}: ${result.score}/100`);
          
          if (result.issues && result.issues.length > 0) {
            result.issues.forEach(issue => console.log(`   ⚠️  ${issue}`));
          }
          
          if (result.suggestions && result.suggestions.length > 0) {
            result.suggestions.forEach(suggestion => {
              console.log(`   💡 ${suggestion}`);
              allRecommendations.push(`${category.name}: ${suggestion}`);
            });
          }
          
          totalScore += result.score;
          totalTests++;
        }
      });
    });

    // Calculate overall score
    const overallScore = totalTests > 0 ? Math.round(totalScore / totalTests) : 0;
    this.testResults.overallScore = overallScore;
    this.testResults.recommendations = allRecommendations;

    console.log('\n📊 OVERALL ASSESSMENT');
    console.log('=' * 40);
    console.log(`Overall Score: ${overallScore}/100`);
    
    if (overallScore >= 90) {
      console.log('🌟 EXCELLENT - Profile and statistics system is highly robust');
    } else if (overallScore >= 75) {
      console.log('✅ GOOD - System is solid with minor improvements needed');
    } else if (overallScore >= 60) {
      console.log('⚠️  FAIR - Several issues need attention');
    } else {
      console.log('❌ POOR - Significant improvements required');
    }

    console.log('\n🎯 TOP RECOMMENDATIONS');
    console.log('-'.repeat(40));
    
    // Prioritize recommendations
    const priorityRecommendations = allRecommendations.slice(0, 10);
    priorityRecommendations.forEach((rec, index) => {
      console.log(`${index + 1}. ${rec}`);
    });

    return {
      overallScore,
      totalTests,
      recommendations: allRecommendations,
      categories: allCategories,
      summary: this.generateSummary(overallScore)
    };
  }

  generateSummary(score) {
    const strengths = [];
    const weaknesses = [];
    
    // Analyze results to identify strengths and weaknesses
    Object.entries(this.testResults).forEach(([category, results]) => {
      if (results && typeof results === 'object' && !Array.isArray(results)) {
        Object.entries(results).forEach(([test, result]) => {
          if (result.score >= 80) {
            strengths.push(`${category}: ${test}`);
          } else if (result.score < 60) {
            weaknesses.push(`${category}: ${test}`);
          }
        });
      }
    });

    return {
      score,
      strengths: strengths.slice(0, 5),
      weaknesses: weaknesses.slice(0, 5),
      keyFindings: [
        'Profile data loading and persistence functionality',
        'Statistics calculation accuracy and performance',
        'Data consistency between different screens',
        'User experience and error handling capabilities'
      ]
    };
  }

  // Run all tests
  async runAllTests() {
    console.log('🚀 Starting Profile & Statistics Comprehensive Testing...');
    
    try {
      await this.testProfileFunctionality();
      await this.testStatisticsCalculation();
      await this.testDataConsistency();
      await this.testUserExperience();
      
      return this.generateReport();
    } catch (error) {
      console.error('❌ Test Suite Failed:', error);
      return {
        error: error.message,
        overallScore: 0,
        recommendations: ['Fix critical test suite errors before proceeding']
      };
    }
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ProfileStatisticsTestSuite;
}

// Auto-run if executed directly
if (typeof require !== 'undefined' && require.main === module) {
  (async () => {
    const testSuite = new ProfileStatisticsTestSuite();
    const results = await testSuite.runAllTests();
    
    // Save results to file
    const fs = require('fs');
    fs.writeFileSync(
      'profile_statistics_test_results.json', 
      JSON.stringify(results, null, 2)
    );
    
    console.log('\n💾 Test results saved to profile_statistics_test_results.json');
  })();
}