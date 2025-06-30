// Code Analysis Test for MushiMap Posting Functionality
// This performs static analysis of the codebase structure

const fs = require('fs');
const path = require('path');

class CodeAnalyzer {
  constructor() {
    this.issues = [];
    this.warnings = [];
    this.successes = [];
  }

  analyzeFile(filePath, description) {
    console.log(`\n🔍 Analyzing: ${description}`);
    console.log(`📁 File: ${filePath}`);
    
    if (!fs.existsSync(filePath)) {
      this.issues.push(`❌ File not found: ${filePath}`);
      return null;
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    this.successes.push(`✅ File exists: ${description}`);
    return content;
  }

  checkDependencyIntegration() {
    console.log('\n🔗 Checking Dependency Integration');
    
    // Check PremiumAddScreen
    const addScreenContent = this.analyzeFile(
      './src/screens/PremiumAddScreen.tsx',
      'PremiumAddScreen Component'
    );
    
    if (addScreenContent) {
      // Check for database service import
      if (!addScreenContent.includes('databaseService')) {
        this.issues.push('❌ PremiumAddScreen does not import databaseService');
      } else {
        this.successes.push('✅ PremiumAddScreen imports databaseService');
      }
      
      // Check for storage service usage
      if (addScreenContent.includes('storageService.addPost')) {
        this.successes.push('✅ PremiumAddScreen uses storageService');
      } else {
        this.issues.push('❌ PremiumAddScreen does not use storageService');
      }
      
      // Check for image picker integration
      if (addScreenContent.includes('expo-image-picker')) {
        this.successes.push('✅ Image picker properly integrated');
      } else {
        this.issues.push('❌ Image picker not integrated');
      }
      
      // Check for form validation
      if (addScreenContent.includes('name.trim()') && addScreenContent.includes('selectedImages.length')) {
        this.successes.push('✅ Form validation implemented');
      } else {
        this.warnings.push('⚠️ Form validation may be incomplete');
      }
    }
    
    // Check StorageService
    const storageContent = this.analyzeFile(
      './src/services/storageService.ts',
      'Storage Service'
    );
    
    if (storageContent) {
      // Check for AsyncStorage usage
      if (storageContent.includes('@react-native-async-storage/async-storage')) {
        this.successes.push('✅ AsyncStorage properly imported');
      } else {
        this.issues.push('❌ AsyncStorage not imported');
      }
      
      // Check for database integration
      if (!storageContent.includes('databaseService')) {
        this.issues.push('❌ StorageService not integrated with DatabaseService');
      }
      
      // Check for tag generation
      if (storageContent.includes('generateTags')) {
        this.successes.push('✅ Tag generation implemented');
      } else {
        this.warnings.push('⚠️ Tag generation not found');
      }
    }
    
    // Check DatabaseService
    const dbContent = this.analyzeFile(
      './src/services/databaseService.ts',
      'Database Service'
    );
    
    if (dbContent) {
      // Check for SQLite usage
      if (dbContent.includes('expo-sqlite')) {
        this.successes.push('✅ SQLite properly integrated');
      } else {
        this.issues.push('❌ SQLite not integrated');
      }
      
      // Check for table creation
      if (dbContent.includes('CREATE TABLE')) {
        this.successes.push('✅ Database schema defined');
      } else {
        this.issues.push('❌ Database schema not defined');
      }
      
      // Check for transaction support
      if (dbContent.includes('BEGIN TRANSACTION')) {
        this.successes.push('✅ Transaction support implemented');
      } else {
        this.warnings.push('⚠️ Transaction support not found');
      }
    }
  }

  checkPackageDependencies() {
    console.log('\n📦 Checking Package Dependencies');
    
    const packageContent = this.analyzeFile(
      './package.json',
      'Package Dependencies'
    );
    
    if (packageContent) {
      const packageJson = JSON.parse(packageContent);
      const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };
      
      const requiredDeps = {
        'expo-image-picker': 'Image picker functionality',
        'expo-sqlite': 'SQLite database',
        '@react-native-async-storage/async-storage': 'Local storage',
        'expo-linear-gradient': 'UI gradients',
        '@expo/vector-icons': 'Icons'
      };
      
      for (const [dep, description] of Object.entries(requiredDeps)) {
        if (deps[dep]) {
          this.successes.push(`✅ ${description} dependency installed: ${deps[dep]}`);
        } else {
          this.issues.push(`❌ Missing dependency: ${dep} (${description})`);
        }
      }
    }
  }

  checkDataFlow() {
    console.log('\n🔄 Checking Data Flow Integration');
    
    // Analyze the posting flow
    const addScreenContent = fs.readFileSync('./src/screens/PremiumAddScreen.tsx', 'utf8');
    const storageContent = fs.readFileSync('./src/services/storageService.ts', 'utf8');
    const dbContent = fs.readFileSync('./src/services/databaseService.ts', 'utf8');
    
    // Check if PremiumAddScreen calls database service
    if (addScreenContent.includes('databaseService')) {
      this.successes.push('✅ PremiumAddScreen integrated with database');
    } else {
      this.issues.push('❌ PremiumAddScreen not integrated with database');
      this.issues.push('❌ Critical: Posts only saved to AsyncStorage, not database');
    }
    
    // Check if there's data synchronization
    if (storageContent.includes('databaseService') || dbContent.includes('storageService')) {
      this.successes.push('✅ Data synchronization between storage services');
    } else {
      this.issues.push('❌ No data synchronization between AsyncStorage and SQLite');
    }
  }

  checkErrorHandling() {
    console.log('\n🛡️ Checking Error Handling');
    
    const files = [
      './src/screens/PremiumAddScreen.tsx',
      './src/services/storageService.ts',
      './src/services/databaseService.ts'
    ];
    
    files.forEach(file => {
      const content = fs.readFileSync(file, 'utf8');
      
      // Check for try-catch blocks
      const tryCatchCount = (content.match(/try\s*{/g) || []).length;
      if (tryCatchCount > 0) {
        this.successes.push(`✅ ${path.basename(file)}: ${tryCatchCount} try-catch blocks found`);
      } else {
        this.warnings.push(`⚠️ ${path.basename(file)}: No error handling found`);
      }
      
      // Check for user-friendly error messages
      if (content.includes('Alert.alert') && content.includes('エラー')) {
        this.successes.push(`✅ ${path.basename(file)}: User-friendly error messages`);
      }
    });
  }

  checkFormValidation() {
    console.log('\n✅ Checking Form Validation');
    
    const addScreenContent = fs.readFileSync('./src/screens/PremiumAddScreen.tsx', 'utf8');
    
    // Check for required field validation
    if (addScreenContent.includes('name.trim()')) {
      this.successes.push('✅ Name field validation implemented');
    } else {
      this.issues.push('❌ Name field validation missing');
    }
    
    // Check for image validation
    if (addScreenContent.includes('selectedImages.length')) {
      this.successes.push('✅ Image validation implemented');
    } else {
      this.issues.push('❌ Image validation missing');
    }
    
    // Check for form submission validation
    if (addScreenContent.includes('handleSubmit')) {
      this.successes.push('✅ Form submission handler implemented');
    } else {
      this.issues.push('❌ Form submission handler missing');
    }
  }

  generateReport() {
    console.log('\n📊 Analysis Report');
    console.log('==================');
    
    console.log(`\n✅ Successes (${this.successes.length}):`);
    this.successes.forEach(success => console.log(`  ${success}`));
    
    console.log(`\n⚠️ Warnings (${this.warnings.length}):`);
    this.warnings.forEach(warning => console.log(`  ${warning}`));
    
    console.log(`\n❌ Issues (${this.issues.length}):`);
    this.issues.forEach(issue => console.log(`  ${issue}`));
    
    const totalChecks = this.successes.length + this.warnings.length + this.issues.length;
    const successRate = ((this.successes.length / totalChecks) * 100).toFixed(1);
    
    console.log(`\n📈 Overall Health: ${successRate}%`);
    
    if (this.issues.length > 0) {
      console.log('\n🔥 Critical Issues That Need Immediate Attention:');
      const criticalIssues = this.issues.filter(issue => issue.includes('Critical'));
      criticalIssues.forEach(issue => console.log(`  ${issue}`));
    }
    
    return {
      successRate: parseFloat(successRate),
      successes: this.successes.length,
      warnings: this.warnings.length,
      issues: this.issues.length,
      totalChecks
    };
  }

  async runAnalysis() {
    console.log('🔍 Starting MushiMap Posting Functionality Code Analysis');
    console.log('=========================================================');
    
    this.checkPackageDependencies();
    this.checkDependencyIntegration();
    this.checkDataFlow();
    this.checkFormValidation();
    this.checkErrorHandling();
    
    return this.generateReport();
  }
}

// Run the analysis
const analyzer = new CodeAnalyzer();
analyzer.runAnalysis().then(results => {
  console.log('\n🎯 Final Analysis Results:');
  console.log(`  Total Checks: ${results.totalChecks}`);
  console.log(`  Success Rate: ${results.successRate}%`);
  console.log(`  Successes: ${results.successes}`);
  console.log(`  Warnings: ${results.warnings}`);
  console.log(`  Issues: ${results.issues}`);
  
  if (results.issues > 0) {
    console.log('\n💡 Recommendation: Fix critical issues before deploying to production');
    process.exit(1);
  } else {
    console.log('\n🎉 Posting functionality is ready for production!');
    process.exit(0);
  }
}).catch(error => {
  console.error('Analysis failed:', error);
  process.exit(1);
});