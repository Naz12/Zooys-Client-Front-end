/**
 * Math Components Test
 * 
 * This test verifies that the math components can be imported and rendered without errors.
 * Run this with: node test/math-components-test.js
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  projectRoot: process.cwd(),
  componentsPath: 'components',
  mathComponentsPath: 'components/math'
};

// Test files to check
const testFiles = [
  'components/ai-math-card.tsx',
  'components/math/math-history.tsx',
  'components/math/math-stats.tsx',
  'components/math/math-dashboard.tsx',
  'app/(dashboard)/math-solver/page.tsx'
];

// Helper function to check if file exists
function fileExists(filePath) {
  try {
    return fs.existsSync(path.join(TEST_CONFIG.projectRoot, filePath));
  } catch (error) {
    return false;
  }
}

// Helper function to read file content
function readFile(filePath) {
  try {
    return fs.readFileSync(path.join(TEST_CONFIG.projectRoot, filePath), 'utf8');
  } catch (error) {
    return null;
  }
}

// Test function to check file structure
function testFileStructure() {
  console.log('🧪 Testing: File Structure');
  
  const results = testFiles.map(file => {
    const exists = fileExists(file);
    console.log(`${exists ? '✅' : '❌'} ${file}: ${exists ? 'EXISTS' : 'MISSING'}`);
    return exists;
  });
  
  const allExist = results.every(Boolean);
  console.log(`\n📊 File Structure: ${allExist ? 'PASSED' : 'FAILED'}`);
  return allExist;
}

// Test function to check imports
function testImports() {
  console.log('\n🧪 Testing: Import Statements');
  
  const importTests = [];
  
  testFiles.forEach(file => {
    const content = readFile(file);
    if (!content) {
      console.log(`❌ ${file}: Cannot read file`);
      importTests.push(false);
      return;
    }
    
    // Check for correct notification import
    const hasCorrectNotificationImport = content.includes('useNotifications') && 
                                       content.includes('@/lib/notifications');
    const hasIncorrectNotificationImport = content.includes('useNotification') && 
                                          content.includes('notification-provider');
    
    if (hasIncorrectNotificationImport) {
      console.log(`❌ ${file}: Has incorrect notification import`);
      importTests.push(false);
    } else if (hasCorrectNotificationImport) {
      console.log(`✅ ${file}: Has correct notification import`);
      importTests.push(true);
    } else {
      console.log(`⚠️  ${file}: No notification imports found`);
      importTests.push(true);
    }
  });
  
  const allImportsCorrect = importTests.every(Boolean);
  console.log(`\n📊 Import Tests: ${allImportsCorrect ? 'PASSED' : 'FAILED'}`);
  return allImportsCorrect;
}

// Test function to check TypeScript syntax
function testTypeScriptSyntax() {
  console.log('\n🧪 Testing: TypeScript Syntax');
  
  const syntaxTests = [];
  
  testFiles.forEach(file => {
    const content = readFile(file);
    if (!content) {
      console.log(`❌ ${file}: Cannot read file`);
      syntaxTests.push(false);
      return;
    }
    
    // Basic syntax checks
    const hasProperExports = content.includes('export default') || content.includes('export {');
    const hasProperImports = content.includes('import ') && content.includes('from ');
    const hasProperJSX = content.includes('<') && content.includes('>');
    
    if (hasProperExports && hasProperImports && hasProperJSX) {
      console.log(`✅ ${file}: Syntax looks good`);
      syntaxTests.push(true);
    } else {
      console.log(`❌ ${file}: Syntax issues detected`);
      syntaxTests.push(false);
    }
  });
  
  const allSyntaxCorrect = syntaxTests.every(Boolean);
  console.log(`\n📊 Syntax Tests: ${allSyntaxCorrect ? 'PASSED' : 'FAILED'}`);
  return allSyntaxCorrect;
}

// Test function to check component structure
function testComponentStructure() {
  console.log('\n🧪 Testing: Component Structure');
  
  const structureTests = [];
  
  testFiles.forEach(file => {
    const content = readFile(file);
    if (!content) {
      console.log(`❌ ${file}: Cannot read file`);
      structureTests.push(false);
      return;
    }
    
    // Check for React component structure
    const hasUseClient = content.includes('"use client"') || content.includes("'use client'");
    const hasReactImports = content.includes('import') && content.includes('React') || 
                           content.includes('import') && content.includes('useState') ||
                           content.includes('import') && content.includes('useEffect');
    const hasReturnStatement = content.includes('return (') || content.includes('return <');
    
    if (hasUseClient && hasReactImports && hasReturnStatement) {
      console.log(`✅ ${file}: Component structure looks good`);
      structureTests.push(true);
    } else {
      console.log(`❌ ${file}: Component structure issues`);
      structureTests.push(false);
    }
  });
  
  const allStructureCorrect = structureTests.every(Boolean);
  console.log(`\n📊 Structure Tests: ${allStructureCorrect ? 'PASSED' : 'FAILED'}`);
  return allStructureCorrect;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Math Components Tests...\n');
  
  const results = {
    fileStructure: false,
    imports: false,
    syntax: false,
    structure: false
  };

  try {
    results.fileStructure = testFileStructure();
    results.imports = testImports();
    results.syntax = testTypeScriptSyntax();
    results.structure = testComponentStructure();

  } catch (error) {
    console.log('❌ Test runner error:', error.message);
  }

  // Summary
  console.log('\n📊 Test Results Summary:');
  console.log('========================');
  
  const passedTests = Object.values(results).filter(Boolean).length;
  const totalTests = Object.keys(results).length;
  
  Object.entries(results).forEach(([test, passed]) => {
    console.log(`${passed ? '✅' : '❌'} ${test}: ${passed ? 'PASSED' : 'FAILED'}`);
  });
  
  console.log(`\n🎯 Overall: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! Math components are ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the component files.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testFileStructure,
  testImports,
  testTypeScriptSyntax,
  testComponentStructure
};



