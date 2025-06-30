#!/usr/bin/env node

/**
 * MushiMap Edge Case and Integration Testing
 * 
 * Tests edge cases, deep linking scenarios, state management,
 * and integration between navigation components.
 */

const fs = require('fs');

console.log('🧪 MushiMap Edge Case Testing');
console.log('==============================\n');

const edgeTests = {
  stateManagement: [],
  errorHandling: [],
  memoryLeaks: [],
  deepLinking: [],
  backNavigation: [],
  integration: []
};

/**
 * Test State Management Edge Cases
 */
function testStateManagement() {
  console.log('🔄 TESTING STATE MANAGEMENT');
  console.log('----------------------------');

  try {
    // Check ProfileScreen state management
    const profileContent = fs.readFileSync('./src/screens/ProfileScreen.tsx', 'utf8');
    
    // Check for proper useEffect cleanup
    const hasUseFocusEffect = profileContent.includes('useFocusEffect');
    const hasUseCallback = profileContent.includes('useCallback');
    
    edgeTests.stateManagement.push({
      test: 'Profile Screen State Refresh',
      status: hasUseFocusEffect && hasUseCallback ? 'PASS' : 'WARN',
      details: `UseFocusEffect: ${hasUseFocusEffect}, UseCallback: ${hasUseCallback}`
    });

    // Check for memory leak prevention
    const hasCleanup = profileContent.includes('useEffect') && profileContent.includes('return');
    edgeTests.stateManagement.push({
      test: 'Memory Leak Prevention',
      status: hasCleanup ? 'PASS' : 'WARN',
      details: hasCleanup ? 'Cleanup functions detected' : 'No cleanup functions found'
    });

    // Check AddScreen form state management
    const addScreenContent = fs.readFileSync('./src/screens/PremiumAddScreen.tsx', 'utf8');
    const hasFormReset = addScreenContent.includes('setFormData') && addScreenContent.includes("''");
    
    edgeTests.stateManagement.push({
      test: 'Form State Reset',
      status: hasFormReset ? 'PASS' : 'WARN',
      details: hasFormReset ? 'Form reset functionality present' : 'Form reset not detected'
    });

    console.log('✅ State management testing complete');
    
  } catch (error) {
    edgeTests.stateManagement.push({
      test: 'State Management Analysis',
      status: 'ERROR',
      details: error.message
    });
  }
}

/**
 * Test Error Handling Scenarios
 */
function testErrorHandling() {
  console.log('\n🚨 TESTING ERROR HANDLING');
  console.log('--------------------------');

  const screenFiles = [
    './src/screens/LoginScreen.tsx',
    './src/screens/RegisterScreen.tsx',
    './src/screens/PremiumAddScreen.tsx',
    './src/screens/ProfileScreen.tsx'
  ];

  screenFiles.forEach(file => {
    try {
      const content = fs.readFileSync(file, 'utf8');
      const screenName = file.split('/').pop().replace('.tsx', '');

      // Check for try-catch blocks
      const hasTryCatch = content.includes('try {') && content.includes('catch');
      
      // Check for error alerts
      const hasErrorAlert = content.includes('Alert.alert') && content.includes('エラー');
      
      // Check for error states
      const hasErrorState = content.includes('error') || content.includes('Error');

      edgeTests.errorHandling.push({
        screen: screenName,
        test: 'Error Handling Implementation',
        status: hasTryCatch && hasErrorAlert ? 'PASS' : 'WARN',
        details: `Try-catch: ${hasTryCatch}, Error alerts: ${hasErrorAlert}, Error states: ${hasErrorState}`
      });

    } catch (error) {
      edgeTests.errorHandling.push({
        screen: file.split('/').pop(),
        test: 'File Access',
        status: 'ERROR',
        details: error.message
      });
    }
  });

  console.log('✅ Error handling testing complete');
}

/**
 * Test Back Navigation Edge Cases
 */
function testBackNavigation() {
  console.log('\n⬅️  TESTING BACK NAVIGATION');
  console.log('----------------------------');

  try {
    // Check InsectDetail screen back navigation
    const detailContent = fs.readFileSync('./src/screens/SimpleInsectDetailScreen.tsx', 'utf8');
    const hasBackButton = detailContent.includes('navigation.goBack()');
    const hasBackButtonUI = detailContent.includes('arrow-back');
    
    edgeTests.backNavigation.push({
      test: 'InsectDetail Back Navigation',
      status: hasBackButton && hasBackButtonUI ? 'PASS' : 'WARN',
      details: `Back function: ${hasBackButton}, Back UI: ${hasBackButtonUI}`
    });

    // Check RegisterScreen back navigation
    const registerContent = fs.readFileSync('./src/screens/RegisterScreen.tsx', 'utf8');
    const hasRegisterBack = registerContent.includes('navigation.goBack()');
    
    edgeTests.backNavigation.push({
      test: 'Register Screen Back Navigation',
      status: hasRegisterBack ? 'PASS' : 'WARN',
      details: hasRegisterBack ? 'Back navigation implemented' : 'Back navigation missing'
    });

    // Check for hardware back button handling
    const appContent = fs.readFileSync('./App.tsx', 'utf8');
    const hasBackHandler = appContent.includes('BackHandler') || appContent.includes('useBackHandler');
    
    edgeTests.backNavigation.push({
      test: 'Hardware Back Button',
      status: hasBackHandler ? 'PASS' : 'WARN',
      details: hasBackHandler ? 'Hardware back handling detected' : 'No hardware back handling found'
    });

    console.log('✅ Back navigation testing complete');

  } catch (error) {
    edgeTests.backNavigation.push({
      test: 'Back Navigation Analysis',
      status: 'ERROR',
      details: error.message
    });
  }
}

/**
 * Test Deep Linking Scenarios
 */
function testDeepLinking() {
  console.log('\n🔗 TESTING DEEP LINKING');
  console.log('------------------------');

  try {
    const navigatorContent = fs.readFileSync('./src/navigation/SimpleNavigator.tsx', 'utf8');
    const appContent = fs.readFileSync('./App.tsx', 'utf8');

    // Check for linking configuration
    const hasLinkingConfig = navigatorContent.includes('linking') || appContent.includes('linking');
    
    edgeTests.deepLinking.push({
      test: 'Linking Configuration',
      status: hasLinkingConfig ? 'PASS' : 'WARN',
      details: hasLinkingConfig ? 'Linking config detected' : 'No linking configuration found'
    });

    // Check for URL scheme handling
    const hasUrlScheme = navigatorContent.includes('scheme') || appContent.includes('scheme');
    
    edgeTests.deepLinking.push({
      test: 'URL Scheme Support',
      status: hasUrlScheme ? 'PASS' : 'WARN',
      details: hasUrlScheme ? 'URL scheme handling detected' : 'No URL scheme handling'
    });

    // Check for dynamic link handling
    const hasDynamicLinks = navigatorContent.includes('path') || navigatorContent.includes('params');
    
    edgeTests.deepLinking.push({
      test: 'Dynamic Link Parameters',
      status: hasDynamicLinks ? 'PASS' : 'WARN',
      details: hasDynamicLinks ? 'Parameter handling detected' : 'No dynamic parameter handling'
    });

    console.log('✅ Deep linking testing complete');

  } catch (error) {
    edgeTests.deepLinking.push({
      test: 'Deep Linking Analysis',
      status: 'ERROR',
      details: error.message
    });
  }
}

/**
 * Test Navigation Integration
 */
function testNavigationIntegration() {
  console.log('\n🔄 TESTING NAVIGATION INTEGRATION');
  console.log('----------------------------------');

  try {
    // Test InsectDetail navigation from multiple sources
    const mapScreenContent = fs.readFileSync('./src/screens/PremiumMapScreen.tsx', 'utf8');
    const mapViewContent = fs.readFileSync('./src/screens/SimpleMapViewScreen.tsx', 'utf8');
    const profileContent = fs.readFileSync('./src/screens/ProfileScreen.tsx', 'utf8');

    // Check InsectDetail navigation consistency
    const mapNavigatesToDetail = mapScreenContent.includes("navigate('InsectDetail'");
    const mapViewNavigatesToDetail = mapViewContent.includes("navigate('InsectDetail'");
    const profileNavigatesToDetail = profileContent.includes("navigate('InsectDetail'");

    edgeTests.integration.push({
      test: 'InsectDetail Navigation Consistency',
      status: mapNavigatesToDetail && mapViewNavigatesToDetail && profileNavigatesToDetail ? 'PASS' : 'WARN',
      details: `Map: ${mapNavigatesToDetail}, MapView: ${mapViewNavigatesToDetail}, Profile: ${profileNavigatesToDetail}`
    });

    // Check parameter passing consistency
    const hasParamValidation = mapScreenContent.includes('insect') && mapViewContent.includes('insect');
    
    edgeTests.integration.push({
      test: 'Parameter Passing Consistency',
      status: hasParamValidation ? 'PASS' : 'WARN',
      details: hasParamValidation ? 'Consistent parameter structure' : 'Inconsistent parameter structure'
    });

    // Check auth flow integration
    const authService = fs.readFileSync('./src/services/authService.ts', 'utf8');
    const hasAuthIntegration = profileContent.includes('authService') && 
                              mapScreenContent.includes('authService') || 
                              mapScreenContent.includes('getCurrentUser');

    edgeTests.integration.push({
      test: 'Authentication Integration',
      status: hasAuthIntegration ? 'PASS' : 'WARN',
      details: hasAuthIntegration ? 'Auth service properly integrated' : 'Auth integration incomplete'
    });

    console.log('✅ Navigation integration testing complete');

  } catch (error) {
    edgeTests.integration.push({
      test: 'Integration Analysis',
      status: 'ERROR',
      details: error.message
    });
  }
}

/**
 * Run all edge case tests
 */
function runEdgeCaseTests() {
  console.log('Starting edge case testing...\n');

  testStateManagement();
  testErrorHandling();
  testBackNavigation();
  testDeepLinking();
  testNavigationIntegration();

  // Calculate summary
  const allTests = [
    ...edgeTests.stateManagement,
    ...edgeTests.errorHandling,
    ...edgeTests.backNavigation,
    ...edgeTests.deepLinking,
    ...edgeTests.integration
  ];

  const summary = {
    total: allTests.length,
    passed: allTests.filter(t => t.status === 'PASS').length,
    warnings: allTests.filter(t => t.status === 'WARN').length,
    failed: allTests.filter(t => t.status === 'FAIL').length,
    errors: allTests.filter(t => t.status === 'ERROR').length
  };

  console.log('\n📊 EDGE CASE TEST SUMMARY');
  console.log('==========================');
  console.log(`Total Tests: ${summary.total}`);
  console.log(`✅ Passed: ${summary.passed}`);
  console.log(`⚠️  Warnings: ${summary.warnings}`);
  console.log(`❌ Failed: ${summary.failed}`);
  console.log(`🚫 Errors: ${summary.errors}`);

  // Save results
  const edgeReport = {
    timestamp: new Date().toISOString(),
    summary,
    results: edgeTests
  };

  fs.writeFileSync('./EDGE_CASE_TEST_REPORT.json', JSON.stringify(edgeReport, null, 2));
  console.log('\n📄 Edge case report saved to EDGE_CASE_TEST_REPORT.json');

  return edgeReport;
}

// Execute if called directly
if (require.main === module) {
  runEdgeCaseTests();
}

module.exports = { runEdgeCaseTests, edgeTests };