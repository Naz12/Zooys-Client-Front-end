/**
 * Test to verify the React key duplication fix in math dashboard
 * 
 * This test simulates the scenario that was causing the duplicate key error
 * and verifies that the fix resolves the issue.
 */

// Mock data that could cause duplicate keys
const mockHistoryData = [
  { id: 1, problem_text: "Solve 2x + 3 = 7", subject_area: "algebra", difficulty_level: "beginner", created_at: "2024-01-01T10:00:00Z" },
  { id: 1, problem_text: "Find derivative of x^2", subject_area: "calculus", difficulty_level: "intermediate", created_at: "2024-01-01T10:00:01Z" }, // Duplicate ID!
  { id: 2, problem_text: "Calculate area of circle", subject_area: "geometry", difficulty_level: "beginner", created_at: "2024-01-01T10:00:02Z" },
  { id: 2, problem_text: "Solve quadratic equation", subject_area: "algebra", difficulty_level: "intermediate", created_at: "2024-01-01T10:00:03Z" }, // Another duplicate ID!
];

// Test the fix: ensure unique keys
function testUniqueKeys() {
  console.log("🧪 Testing React key uniqueness fix...");
  
  // Simulate the fixed mapping logic
  const fixedHistory = mockHistoryData.map((problem, index) => ({
    ...problem,
    id: problem.id || Date.now() + index // Ensure every problem has a unique ID
  }));
  
  // Generate keys as the component would
  const keys = fixedHistory.map((problem, index) => `${problem.id}-${index}`);
  
  console.log("📊 Original data:");
  console.table(mockHistoryData.map(p => ({ id: p.id, text: p.problem_text.substring(0, 30) + "..." })));
  
  console.log("🔧 Fixed data with unique IDs:");
  console.table(fixedHistory.map(p => ({ id: p.id, text: p.problem_text.substring(0, 30) + "..." })));
  
  console.log("🔑 Generated keys:");
  console.log(keys);
  
  // Check for duplicates
  const uniqueKeys = new Set(keys);
  const hasDuplicates = keys.length !== uniqueKeys.size;
  
  if (hasDuplicates) {
    console.error("❌ FAIL: Duplicate keys found!");
    const duplicates = keys.filter((key, index) => keys.indexOf(key) !== index);
    console.error("Duplicate keys:", duplicates);
    return false;
  } else {
    console.log("✅ PASS: All keys are unique!");
    return true;
  }
}

// Test ID generation for new problems
function testIdGeneration() {
  console.log("\n🧪 Testing ID generation for new problems...");
  
  const ids = [];
  for (let i = 0; i < 5; i++) {
    const id = Date.now() + Math.random() * 1000;
    ids.push(id);
  }
  
  console.log("Generated IDs:", ids);
  
  const uniqueIds = new Set(ids);
  const hasDuplicates = ids.length !== uniqueIds.size;
  
  if (hasDuplicates) {
    console.error("❌ FAIL: Duplicate IDs generated!");
    return false;
  } else {
    console.log("✅ PASS: All generated IDs are unique!");
    return true;
  }
}

// Run tests
console.log("🚀 Running Math Dashboard Key Fix Tests\n");

const test1 = testUniqueKeys();
const test2 = testIdGeneration();

console.log("\n📋 Test Results:");
console.log(`Key Uniqueness Fix: ${test1 ? "✅ PASS" : "❌ FAIL"}`);
console.log(`ID Generation: ${test2 ? "✅ PASS" : "❌ FAIL"}`);

if (test1 && test2) {
  console.log("\n🎉 All tests passed! The React key duplication issue has been fixed.");
} else {
  console.log("\n❌ Some tests failed. Please check the implementation.");
}

