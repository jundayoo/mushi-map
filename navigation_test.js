#!/usr/bin/env node

/**
 * MushiMap Navigation and Transition Testing Script
 * 
 * This script performs comprehensive testing of navigation flow,
 * screen transitions, authentication, and state management.
 */

const fs = require('fs');
const path = require('path');

console.log('🐛 MushiMap Navigation Testing Suite');
console.log('=====================================\n');

// Test Results Storage
const testResults = {
  navigationFlow: [],
  screenTransitions: [],
  tabNavigation: [],
  authFlow: [],
  issues: [],
  improvements: []
};

/**
 * Navigation Flow Analysis
 */
function testNavigationFlow() {
  console.log('📱 1. NAVIGATION FLOW TESTING');
  console.log('------------------------------');

  // Check navigation structure
  const navigatorPath = './src/navigation/SimpleNavigator.tsx';
  
  try {
    const navigatorContent = fs.readFileSync(navigatorPath, 'utf8');
    
    // Test stack navigation setup
    const hasNavigationContainer = navigatorContent.includes('NavigationContainer');
    const hasStackNavigator = navigatorContent.includes('createStackNavigator');
    const hasTabNavigator = navigatorContent.includes('createBottomTabNavigator');
    
    testResults.navigationFlow.push({
      test: 'Navigation Structure',
      status: hasNavigationContainer && hasStackNavigator && hasTabNavigator ? 'PASS' : 'FAIL',
      details: `NavigationContainer: ${hasNavigationContainer}, Stack: ${hasStackNavigator}, Tabs: ${hasTabNavigator}`
    });

    // Check route definitions
    const routeDefinitions = [
      'Login',
      'Register', 
      'MainTabs',
      'InsectDetail',
      'MapView'
    ];

    let missingRoutes = [];
    routeDefinitions.forEach(route => {
      if (!navigatorContent.includes(`name="${route}"`)) {
        missingRoutes.push(route);
      }
    });

    testResults.navigationFlow.push({
      test: 'Route Definitions',
      status: missingRoutes.length === 0 ? 'PASS' : 'FAIL',
      details: missingRoutes.length > 0 ? `Missing routes: ${missingRoutes.join(', ')}` : 'All routes defined'
    });

    // Check parameter passing
    const hasInsectDetailParams = navigatorContent.includes('InsectDetail: {');
    testResults.navigationFlow.push({
      test: 'Parameter Passing',
      status: hasInsectDetailParams ? 'PASS' : 'FAIL',
      details: hasInsectDetailParams ? 'InsectDetail params properly typed' : 'Parameter types missing'
    });

    console.log('✅ Navigation structure analysis complete');

  } catch (error) {
    testResults.navigationFlow.push({
      test: 'Navigation File Access',
      status: 'ERROR',
      details: error.message
    });
    console.log('❌ Error reading navigation file');
  }
}

/**
 * Screen Transition Testing
 */
function testScreenTransitions() {
  console.log('\n🎬 2. SCREEN TRANSITION TESTING');
  console.log('--------------------------------');

  const screenFiles = [
    './src/screens/LoginScreen.tsx',
    './src/screens/RegisterScreen.tsx', 
    './src/screens/PremiumMapScreen.tsx',
    './src/screens/SimpleInsectDetailScreen.tsx',
    './src/screens/ProfileScreen.tsx',
    './src/screens/SimpleMapViewScreen.tsx',
    './src/screens/PremiumAddScreen.tsx'
  ];

  screenFiles.forEach(screenFile => {
    try {
      const screenContent = fs.readFileSync(screenFile, 'utf8');
      const screenName = path.basename(screenFile, '.tsx');

      // Check for navigation usage
      const usesNavigation = screenContent.includes('useNavigation');
      const hasNavigateCall = screenContent.includes('navigation.navigate');
      const hasGoBack = screenContent.includes('navigation.goBack');

      testResults.screenTransitions.push({
        screen: screenName,
        test: 'Navigation Implementation',
        status: usesNavigation ? 'PASS' : 'WARN',
        details: `Navigation hook: ${usesNavigation}, Navigate calls: ${hasNavigateCall}, Go back: ${hasGoBack}`
      });

      // Check for animations
      const hasAnimated = screenContent.includes('Animated');
      const hasUseRef = screenContent.includes('useRef');
      const hasTiming = screenContent.includes('Animated.timing');

      testResults.screenTransitions.push({
        screen: screenName,
        test: 'Animation Implementation',
        status: hasAnimated && hasTiming ? 'PASS' : 'WARN',
        details: `Animated: ${hasAnimated}, useRef: ${hasUseRef}, Timing: ${hasTiming}`
      });

      // Check for loading states
      const hasLoading = screenContent.includes('loading') || screenContent.includes('Loading');
      testResults.screenTransitions.push({
        screen: screenName,
        test: 'Loading States',
        status: hasLoading ? 'PASS' : 'WARN',
        details: hasLoading ? 'Loading states implemented' : 'No loading states found'
      });

    } catch (error) {
      testResults.screenTransitions.push({
        screen: path.basename(screenFile, '.tsx'),
        test: 'File Access',
        status: 'ERROR',
        details: error.message
      });
    }
  });

  console.log('✅ Screen transition analysis complete');
}

/**
 * Tab Navigation Testing
 */
function testTabNavigation() {
  console.log('\n📋 3. TAB NAVIGATION TESTING');
  console.log('-----------------------------');

  try {
    const navigatorContent = fs.readFileSync('./src/navigation/SimpleNavigator.tsx', 'utf8');

    // Check tab screens
    const expectedTabs = ['Map', 'Add', 'Profile', 'MapView'];
    let missingTabs = [];
    
    expectedTabs.forEach(tab => {
      if (!navigatorContent.includes(`name="${tab}"`)) {
        missingTabs.push(tab);
      }
    });

    testResults.tabNavigation.push({
      test: 'Tab Screen Definition',
      status: missingTabs.length === 0 ? 'PASS' : 'FAIL',
      details: missingTabs.length > 0 ? `Missing tabs: ${missingTabs.join(', ')}` : 'All tabs defined'
    });

    // Check tab icons
    const hasTabBarIcon = navigatorContent.includes('tabBarIcon');
    const hasIconMapping = navigatorContent.includes('iconName');
    
    testResults.tabNavigation.push({
      test: 'Tab Icons',
      status: hasTabBarIcon && hasIconMapping ? 'PASS' : 'WARN',
      details: `Tab bar icons: ${hasTabBarIcon}, Icon mapping: ${hasIconMapping}`
    });

    // Check tab colors
    const hasActiveTintColor = navigatorContent.includes('tabBarActiveTintColor');
    const hasInactiveTintColor = navigatorContent.includes('tabBarInactiveTintColor');

    testResults.tabNavigation.push({
      test: 'Tab Colors',
      status: hasActiveTintColor && hasInactiveTintColor ? 'PASS' : 'WARN',
      details: `Active color: ${hasActiveTintColor}, Inactive color: ${hasInactiveTintColor}`
    });

    console.log('✅ Tab navigation analysis complete');

  } catch (error) {
    testResults.tabNavigation.push({
      test: 'Tab Navigation Analysis',
      status: 'ERROR',
      details: error.message
    });
  }
}

/**
 * Authentication Flow Testing
 */
function testAuthFlow() {
  console.log('\n🔐 4. AUTHENTICATION FLOW TESTING');
  console.log('----------------------------------');

  try {
    const authServiceContent = fs.readFileSync('./src/services/authService.ts', 'utf8');
    const loginScreenContent = fs.readFileSync('./src/screens/LoginScreen.tsx', 'utf8');
    const profileScreenContent = fs.readFileSync('./src/screens/ProfileScreen.tsx', 'utf8');

    // Check auth service methods
    const authMethods = ['login', 'register', 'logout', 'getCurrentUser', 'isLoggedIn'];
    let missingMethods = [];
    
    authMethods.forEach(method => {
      if (!authServiceContent.includes(`${method}(`)) {
        missingMethods.push(method);
      }
    });

    testResults.authFlow.push({
      test: 'Auth Service Methods',
      status: missingMethods.length === 0 ? 'PASS' : 'FAIL',
      details: missingMethods.length > 0 ? `Missing methods: ${missingMethods.join(', ')}` : 'All auth methods present'
    });

    // Check session persistence
    const hasAsyncStorage = authServiceContent.includes('AsyncStorage');
    const hasUserSession = authServiceContent.includes('CURRENT_USER_KEY');

    testResults.authFlow.push({
      test: 'Session Persistence',
      status: hasAsyncStorage && hasUserSession ? 'PASS' : 'FAIL',
      details: `AsyncStorage: ${hasAsyncStorage}, User session key: ${hasUserSession}`
    });

    // Check protected routes in ProfileScreen
    const hasAuthCheck = profileScreenContent.includes('getCurrentUser');
    const hasLoginRedirect = profileScreenContent.includes("navigation.navigate('Login')");

    testResults.authFlow.push({
      test: 'Protected Routes',
      status: hasAuthCheck && hasLoginRedirect ? 'PASS' : 'WARN',
      details: `Auth check: ${hasAuthCheck}, Login redirect: ${hasLoginRedirect}`
    });

    // Check logout functionality
    const hasLogoutButton = profileScreenContent.includes('logout');
    const hasLogoutConfirm = profileScreenContent.includes('Alert.alert');

    testResults.authFlow.push({
      test: 'Logout Implementation',
      status: hasLogoutButton && hasLogoutConfirm ? 'PASS' : 'WARN',
      details: `Logout button: ${hasLogoutButton}, Confirmation dialog: ${hasLogoutConfirm}`
    });

    console.log('✅ Authentication flow analysis complete');

  } catch (error) {
    testResults.authFlow.push({
      test: 'Auth Flow Analysis',
      status: 'ERROR',
      details: error.message
    });
  }
}

/**
 * Issue Detection and Analysis
 */
function detectIssues() {
  console.log('\n🔍 5. ISSUE DETECTION AND ANALYSIS');
  console.log('-----------------------------------');

  // Analyze test results for issues
  const allTests = [
    ...testResults.navigationFlow,
    ...testResults.screenTransitions,
    ...testResults.tabNavigation,
    ...testResults.authFlow
  ];

  const failedTests = allTests.filter(test => test.status === 'FAIL');
  const warningTests = allTests.filter(test => test.status === 'WARN');
  const errorTests = allTests.filter(test => test.status === 'ERROR');

  console.log(`📊 Test Summary:`);
  console.log(`   ✅ Passed: ${allTests.filter(t => t.status === 'PASS').length}`);
  console.log(`   ⚠️  Warnings: ${warningTests.length}`);
  console.log(`   ❌ Failed: ${failedTests.length}`);
  console.log(`   🚫 Errors: ${errorTests.length}`);

  // Critical issues
  if (failedTests.length > 0) {
    testResults.issues.push({
      severity: 'HIGH',
      category: 'Navigation Failures',
      description: 'Critical navigation components are missing or incorrectly configured',
      details: failedTests.map(t => `${t.test}: ${t.details}`).join('; ')
    });
  }

  // Check for missing MapView in stack
  const navigatorPath = './src/navigation/SimpleNavigator.tsx';
  try {
    const navigatorContent = fs.readFileSync(navigatorPath, 'utf8');
    if (!navigatorContent.includes('MapView')) {
      testResults.issues.push({
        severity: 'MEDIUM',
        category: 'Missing Route',
        description: 'MapView screen not properly integrated into stack navigation',
        details: 'MapView should be accessible from stack navigator, not just tabs'
      });
    }
  } catch (error) {
    // Already handled in navigation flow test
  }

  // Check for deep linking support
  const appContent = fs.readFileSync('./App.tsx', 'utf8');
  if (!appContent.includes('linking') && !appContent.includes('deepLink')) {
    testResults.issues.push({
      severity: 'LOW',
      category: 'Deep Linking',
      description: 'Deep linking configuration not found',
      details: 'Consider implementing deep linking for better user experience'
    });
  }

  console.log('✅ Issue detection complete');
}

/**
 * Generate Improvement Recommendations
 */
function generateRecommendations() {
  console.log('\n💡 6. IMPROVEMENT RECOMMENDATIONS');
  console.log('----------------------------------');

  // Navigation improvements
  testResults.improvements.push({
    category: 'Navigation Performance',
    priority: 'HIGH',
    suggestion: 'Implement lazy loading for screens to improve initial navigation performance',
    implementation: 'Use React.lazy() or React Navigation lazy loading for heavy screens'
  });

  testResults.improvements.push({
    category: 'Error Handling',
    priority: 'HIGH', 
    suggestion: 'Add error boundaries and navigation error handling',
    implementation: 'Implement ErrorBoundary components and navigation error handlers'
  });

  testResults.improvements.push({
    category: 'State Management',
    priority: 'MEDIUM',
    suggestion: 'Implement state persistence across navigation',
    implementation: 'Use Context API or Redux to maintain state across screens'
  });

  testResults.improvements.push({
    category: 'User Experience',
    priority: 'MEDIUM',
    suggestion: 'Add loading indicators during navigation transitions',
    implementation: 'Show skeleton screens or loading overlays during data fetching'
  });

  testResults.improvements.push({
    category: 'Navigation Analytics',
    priority: 'LOW',
    suggestion: 'Implement navigation tracking for user behavior analysis',
    implementation: 'Add navigation listeners to track user journey and screen time'
  });

  console.log('✅ Recommendations generated');
}

/**
 * Generate Test Report
 */
function generateReport() {
  console.log('\n📄 GENERATING COMPREHENSIVE TEST REPORT');
  console.log('=========================================');

  const report = {
    timestamp: new Date().toISOString(),
    testSuite: 'MushiMap Navigation Testing',
    summary: {
      totalTests: [
        ...testResults.navigationFlow,
        ...testResults.screenTransitions, 
        ...testResults.tabNavigation,
        ...testResults.authFlow
      ].length,
      passed: [...testResults.navigationFlow, ...testResults.screenTransitions, ...testResults.tabNavigation, ...testResults.authFlow].filter(t => t.status === 'PASS').length,
      warnings: [...testResults.navigationFlow, ...testResults.screenTransitions, ...testResults.tabNavigation, ...testResults.authFlow].filter(t => t.status === 'WARN').length,
      failed: [...testResults.navigationFlow, ...testResults.screenTransitions, ...testResults.tabNavigation, ...testResults.authFlow].filter(t => t.status === 'FAIL').length,
      errors: [...testResults.navigationFlow, ...testResults.screenTransitions, ...testResults.tabNavigation, ...testResults.authFlow].filter(t => t.status === 'ERROR').length
    },
    results: testResults,
    recommendations: testResults.improvements
  };

  // Write detailed report
  fs.writeFileSync('./NAVIGATION_TEST_REPORT.json', JSON.stringify(report, null, 2));
  
  console.log('📊 Test report saved to NAVIGATION_TEST_REPORT.json');
  console.log('\n🎯 KEY FINDINGS:');
  
  // Display key findings
  if (testResults.issues.length > 0) {
    console.log('\n⚠️  CRITICAL ISSUES FOUND:');
    testResults.issues.forEach(issue => {
      console.log(`   ${issue.severity}: ${issue.description}`);
    });
  }

  console.log('\n🚀 TOP RECOMMENDATIONS:');
  testResults.improvements.slice(0, 3).forEach(improvement => {
    console.log(`   ${improvement.priority}: ${improvement.suggestion}`);
  });

  return report;
}

/**
 * Main Test Execution
 */
function runNavigationTests() {
  console.log('Starting comprehensive navigation testing...\n');

  try {
    testNavigationFlow();
    testScreenTransitions();
    testTabNavigation();
    testAuthFlow();
    detectIssues();
    generateRecommendations();
    
    const report = generateReport();
    
    console.log('\n✅ Navigation testing complete!');
    console.log(`📋 Full report available in: NAVIGATION_TEST_REPORT.json`);
    
    return report;
    
  } catch (error) {
    console.error('❌ Test execution failed:', error);
    process.exit(1);
  }
}

// Execute tests
if (require.main === module) {
  runNavigationTests();
}

module.exports = { runNavigationTests, testResults };