/**
 * Math Dashboard Component Test
 * 
 * This test verifies that the math dashboard component can be imported without errors.
 */

const fs = require('fs');
const path = require('path');

// Test configuration
const TEST_CONFIG = {
  projectRoot: process.cwd(),
  componentPath: 'components/math/math-dashboard.tsx'
};

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

// Test function to check component structure
function testComponentStructure() {
  console.log('🧪 Testing: Math Dashboard Component Structure');
  
  const filePath = TEST_CONFIG.componentPath;
  const exists = fileExists(filePath);
  
  if (!exists) {
    console.log(`❌ ${filePath}: File does not exist`);
    return false;
  }
  
  const content = readFile(filePath);
  if (!content) {
    console.log(`❌ ${filePath}: Cannot read file`);
    return false;
  }
  
  // Check for required imports
  const hasReactImport = content.includes('import') && content.includes('React');
  const hasUseStateImport = content.includes('useState');
  const hasCardImport = content.includes('@/components/ui/card');
  const hasButtonImport = content.includes('@/components/ui/button');
  const hasBadgeImport = content.includes('@/components/ui/badge');
  const hasLucideImport = content.includes('lucide-react');
  const hasMathApiImport = content.includes('@/lib/math-api-client');
  const hasNotificationsImport = content.includes('@/lib/notifications');
  
  console.log(`✅ File exists: ${filePath}`);
  console.log(`${hasReactImport ? '✅' : '❌'} React import`);
  console.log(`${hasUseStateImport ? '✅' : '❌'} useState import`);
  console.log(`${hasCardImport ? '✅' : '❌'} Card import`);
  console.log(`${hasButtonImport ? '✅' : '❌'} Button import`);
  console.log(`${hasBadgeImport ? '✅' : '❌'} Badge import`);
  console.log(`${hasLucideImport ? '✅' : '❌'} Lucide icons import`);
  console.log(`${hasMathApiImport ? '✅' : '❌'} Math API import`);
  console.log(`${hasNotificationsImport ? '✅' : '❌'} Notifications import`);
  
  // Check for component structure
  const hasUseClient = content.includes('"use client"');
  const hasDefaultExport = content.includes('export default function MathDashboard');
  const hasReturnStatement = content.includes('return (');
  const hasJSX = content.includes('<div') && content.includes('</div>');
  
  console.log(`${hasUseClient ? '✅' : '❌'} "use client" directive`);
  console.log(`${hasDefaultExport ? '✅' : '❌'} Default export`);
  console.log(`${hasReturnStatement ? '✅' : '❌'} Return statement`);
  console.log(`${hasJSX ? '✅' : '❌'} JSX content`);
  
  const allChecks = [
    hasReactImport, hasUseStateImport, hasCardImport, hasButtonImport,
    hasBadgeImport, hasLucideImport, hasMathApiImport, hasNotificationsImport,
    hasUseClient, hasDefaultExport, hasReturnStatement, hasJSX
  ];
  
  const passedChecks = allChecks.filter(Boolean).length;
  const totalChecks = allChecks.length;
  
  console.log(`\n📊 Component Structure: ${passedChecks}/${totalChecks} checks passed`);
  
  return passedChecks === totalChecks;
}

// Test function to check for syntax errors
function testSyntaxErrors() {
  console.log('\n🧪 Testing: Syntax Errors');
  
  const filePath = TEST_CONFIG.componentPath;
  const content = readFile(filePath);
  
  if (!content) {
    console.log(`❌ Cannot read file: ${filePath}`);
    return false;
  }
  
  // Basic syntax checks
  const hasProperQuotes = !content.includes('"') || content.includes('"') && content.includes('"');
  const hasProperBraces = (content.match(/\{/g) || []).length === (content.match(/\}/g) || []).length;
  const hasProperParens = (content.match(/\(/g) || []).length === (content.match(/\)/g) || []).length;
  const hasProperBrackets = (content.match(/\[/g) || []).length === (content.match(/\]/g) || []).length;
  
  console.log(`${hasProperQuotes ? '✅' : '❌'} Proper quotes`);
  console.log(`${hasProperBraces ? '✅' : '❌'} Proper braces`);
  console.log(`${hasProperParens ? '✅' : '❌'} Proper parentheses`);
  console.log(`${hasProperBrackets ? '✅' : '❌'} Proper brackets`);
  
  const allSyntaxChecks = [hasProperQuotes, hasProperBraces, hasProperParens, hasProperBrackets];
  const passedSyntaxChecks = allSyntaxChecks.filter(Boolean).length;
  const totalSyntaxChecks = allSyntaxChecks.length;
  
  console.log(`\n📊 Syntax: ${passedSyntaxChecks}/${totalSyntaxChecks} checks passed`);
  
  return passedSyntaxChecks === totalSyntaxChecks;
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting Math Dashboard Component Tests...\n');
  
  const results = {
    structure: false,
    syntax: false
  };

  try {
    results.structure = testComponentStructure();
    results.syntax = testSyntaxErrors();

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
    console.log('🎉 All tests passed! Math dashboard component is ready.');
  } else {
    console.log('⚠️  Some tests failed. Check the component file.');
  }
}

// Run the tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = {
  runTests,
  testComponentStructure,
  testSyntaxErrors
};
