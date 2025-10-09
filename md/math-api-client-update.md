# Math API Client Update - New API Integration

## 📋 **Overview**

Updated the math API client (`lib/math-api-client.ts`) to match the new API documentation and endpoints structure.

## 🔄 **Changes Made**

### **1. Updated TypeScript Interfaces**

#### **MathProblem Interface**
- Added `file_url?: string` field for image file URLs
- Added `problem_type?: 'text' | 'image'` field to distinguish problem types
- Made `problem_text` nullable (`string | null`) to support image-only problems
- Added `solutions?: MathSolution[]` field for detailed problem responses

#### **MathStats Interface**
- Updated `recent_activity` structure to match new API:
  ```typescript
  recent_activity: Array<{
    date: string;
    count: number;
  }>;
  ```

### **2. New Interfaces Added**

#### **MathProblemsResponse**
```typescript
export interface MathProblemsResponse {
  math_problems: MathProblem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```

#### **MathProblemDetailResponse**
```typescript
export interface MathProblemDetailResponse {
  math_problem: MathProblem;
}
```

#### **Query Parameter Interfaces**
```typescript
export interface MathHistoryParams {
  per_page?: number;
  subject?: string;
  difficulty?: string;
}

export interface MathProblemsParams {
  page?: number;
  per_page?: number;
  subject?: string;
  difficulty?: string;
}
```

### **3. Updated Methods**

#### **getHistory() Method**
- Added support for query parameters (`per_page`, `subject`, `difficulty`)
- Now builds query string dynamically based on provided parameters

#### **getProblem() Method**
- Updated return type to `MathProblemDetailResponse`
- Now returns problem with associated solutions

#### **New getProblems() Method**
- Added paginated math problems endpoint
- Supports filtering by subject and difficulty
- Returns pagination metadata

### **4. Removed Unused Methods**

Removed methods that are not part of the new API:
- `solveProblem()` - replaced by `solveMathProblem()`
- `getTopics()` - not in new API
- `getDifficulties()` - not in new API
- `updateProblem()` - not in new API
- `getHelp()` - not in new API

### **5. Removed Unused Interfaces**

- `MathSolveRequest`
- `MathSolveResponse`
- `MathHelpRequest`
- `MathHelpResponse`
- `MathUpdateRequest`
- `MathUpdateResponse`

## 🎯 **API Endpoints Supported**

| **Method** | **Endpoint** | **Description** |
|------------|--------------|-----------------|
| `solveMathProblem()` | `POST /math/solve` | Solve text-based math problems |
| `solveMathProblemWithImage()` | `POST /math/solve` | Solve image-based math problems |
| `getHistory()` | `GET /math/history` | Get user's math problem history |
| `getProblems()` | `GET /math/problems` | Get paginated math problems |
| `getProblem()` | `GET /math/problems/{id}` | Get specific problem with solutions |
| `deleteProblem()` | `DELETE /math/problems/{id}` | Delete a math problem |
| `getStats()` | `GET /math/stats` | Get user's math statistics |

## 🔧 **Usage Examples**

### **Get History with Filters**
```typescript
// Get last 10 problems in arithmetic
const history = await mathApi.getHistory({
  per_page: 10,
  subject: 'arithmetic'
});
```

### **Get Paginated Problems**
```typescript
// Get page 2 with 15 problems per page
const problems = await mathApi.getProblems({
  page: 2,
  per_page: 15,
  subject: 'algebra'
});
```

### **Get Problem with Solutions**
```typescript
// Get specific problem with all solutions
const problemDetail = await mathApi.getProblem(32);
console.log(problemDetail.math_problem.solutions);
```

## ✅ **Status**

- ✅ All interfaces updated to match new API structure
- ✅ Pagination support added
- ✅ Query parameters support added
- ✅ Unused methods and interfaces removed
- ✅ No linting errors
- ✅ TypeScript types are strict and accurate

## 🚀 **Ready for Use**

The math API client is now fully updated and compatible with the new API endpoints. All methods support the latest API structure and provide proper TypeScript typing for better development experience.
