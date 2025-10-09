# 🧮 **Math API Usage Guide - Complete Implementation**

## 📋 **Overview**

The Math API client is fully integrated with the universal file upload system and provides comprehensive functionality for solving mathematical problems using both text input and image uploads.

---

## 🔧 **Current Implementation Status**

### ✅ **Fully Implemented Features**

1. **Text-based Math Problems** - Complete
2. **Image-based Math Problems** - Complete with universal file upload
3. **Math Problem History** - Complete with filtering
4. **Paginated Math Problems** - Complete
5. **Math Statistics** - Complete
6. **Problem Management** - Complete (view, delete)

### 🎯 **API Integration**

The math API client properly integrates with:
- ✅ Universal file upload system
- ✅ FormData handling for image uploads
- ✅ Authentication system
- ✅ Error handling and user feedback
- ✅ TypeScript strict typing

---

## 📝 **Usage Examples**

### **1. Text-Based Math Problems**

```typescript
import { mathApi } from '@/lib/math-api-client';

// Solve a basic arithmetic problem
const result = await mathApi.solveMathProblem({
  problem_text: "What is 2 + 2?",
  subject_area: "arithmetic",
  difficulty_level: "beginner"
});

console.log(result.math_solution.final_answer); // "4"
console.log(result.math_solution.step_by_step_solution);
```

### **2. Image-Based Math Problems**

```typescript
import { mathApi } from '@/lib/math-api-client';

// Solve a math problem from an image
const handleImageUpload = async (imageFile: File) => {
  try {
    const result = await mathApi.solveMathProblemWithImage(
      imageFile,
      'maths',        // subject area
      'intermediate'  // difficulty level
    );
    
    console.log('Problem solved:', result.math_solution.final_answer);
    console.log('File URL:', result.math_problem.file_url);
  } catch (error) {
    console.error('Error solving math problem:', error);
  }
};
```

### **3. Get Math History with Filtering**

```typescript
// Get last 10 problems in algebra
const history = await mathApi.getHistory({
  per_page: 10,
  subject: 'algebra'
});

// Get all problems with advanced difficulty
const advancedProblems = await mathApi.getHistory({
  difficulty: 'advanced'
});
```

### **4. Get Paginated Math Problems**

```typescript
// Get page 2 with 15 problems per page
const problems = await mathApi.getProblems({
  page: 2,
  per_page: 15,
  subject: 'geometry'
});

console.log('Total problems:', problems.pagination.total);
console.log('Current page:', problems.pagination.current_page);
```

### **5. Get Specific Problem with Solutions**

```typescript
// Get a specific problem with all its solutions
const problemDetail = await mathApi.getProblem(32);
console.log('Problem:', problemDetail.math_problem.problem_text);
console.log('Solutions:', problemDetail.math_problem.solutions);
```

### **6. Get Math Statistics**

```typescript
const stats = await mathApi.getStats();
console.log('Total problems solved:', stats.total_problems);
console.log('Problems by subject:', stats.problems_by_subject);
console.log('Success rate:', stats.success_rate);
```

### **7. Delete Math Problems**

```typescript
// Delete a specific problem
await mathApi.deleteProblem(32);
console.log('Problem deleted successfully');
```

---

## 🖼️ **Image Upload Best Practices**

### **File Requirements**
- **Supported formats:** JPEG, PNG, GIF, WebP
- **Maximum size:** 10MB
- **Field name:** `problem_image`

### **Implementation Example**

```typescript
const handleFileUpload = async (file: File) => {
  // Validate file
  if (!file.type.startsWith('image/')) {
    throw new Error('Please select an image file');
  }
  
  if (file.size > 10 * 1024 * 1024) { // 10MB
    throw new Error('File size must be less than 10MB');
  }
  
  // Upload and solve
  const result = await mathApi.solveMathProblemWithImage(file);
  return result;
};
```

---

## 🔄 **FormData Integration**

The math API client properly uses FormData for image uploads:

```typescript
// Inside solveMathProblemWithImage method
const formData = new FormData();
formData.append('problem_image', imageFile);
formData.append('subject_area', subjectArea);
formData.append('difficulty_level', difficultyLevel);

// API client automatically handles FormData
return this.apiClient.post<MathProblemResponse>('/math/solve', formData);
```

The API client automatically:
- ✅ Sets correct Content-Type for FormData
- ✅ Includes authentication headers
- ✅ Handles CORS properly
- ✅ Provides detailed error handling

---

## 📊 **Response Structure**

### **MathProblemResponse**
```typescript
{
  math_problem: {
    id: number;
    problem_text: string | null;
    problem_image: string | null;
    file_url?: string;           // For image problems
    subject_area: string;
    difficulty_level: string;
    problem_type?: 'text' | 'image';
    created_at: string;
  };
  math_solution: {
    id: number;
    solution_method: string;
    step_by_step_solution: string;
    final_answer: string;
    explanation: string;
    verification: string;
    created_at: string;
  };
  ai_result: {
    id: number;
    title: string;
    file_url: string;
    created_at: string;
  };
}
```

### **MathProblemsResponse (Paginated)**
```typescript
{
  math_problems: MathProblem[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}
```

---

## 🎯 **Subject Areas**

| **Value** | **Description** | **Use Case** |
|-----------|-----------------|--------------|
| `arithmetic` | Basic math operations | Addition, subtraction, multiplication, division |
| `algebra` | Algebraic equations | Solving for x, factoring, equations |
| `geometry` | Shapes and spatial problems | Area, volume, angles, shapes |
| `calculus` | Derivatives and integrals | Limits, derivatives, integrals |
| `statistics` | Data analysis | Mean, median, probability |
| `trigonometry` | Angles and triangles | Sin, cos, tan, triangles |
| `maths` | General mathematics | Default for image problems |

---

## 📈 **Difficulty Levels**

| **Value** | **Description** | **Examples** |
|-----------|-----------------|--------------|
| `beginner` | Basic problems | Simple arithmetic, basic algebra |
| `intermediate` | Moderate complexity | Quadratic equations, geometry |
| `advanced` | Complex problems | Calculus, advanced statistics |

---

## 🚨 **Error Handling**

The math API client provides comprehensive error handling:

```typescript
try {
  const result = await mathApi.solveMathProblem({
    problem_text: "What is 2 + 2?",
    subject_area: "arithmetic"
  });
} catch (error) {
  if (error.status === 401) {
    // Authentication required
    console.error('Please log in to use this feature');
  } else if (error.status === 403) {
    // No active subscription
    console.error('Active subscription required');
  } else if (error.status === 422) {
    // Validation error
    console.error('Invalid input:', error.response);
  } else {
    // Other errors
    console.error('Error:', error.message);
  }
}
```

---

## 🔧 **Integration with Components**

### **React Component Example**

```typescript
import { useState } from 'react';
import { mathApi } from '@/lib/math-api-client';

const MathSolver = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const solveTextProblem = async (problemText: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mathApi.solveMathProblem({
        problem_text: problemText,
        subject_area: 'maths',
        difficulty_level: 'intermediate'
      });
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const solveImageProblem = async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await mathApi.solveMathProblemWithImage(file);
      setResult(response);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {/* Component implementation */}
    </div>
  );
};
```

---

## ✅ **Verification Checklist**

- ✅ **Universal File Upload Integration** - Math API properly uses FormData
- ✅ **Authentication** - All requests include Bearer token
- ✅ **Error Handling** - Comprehensive error handling with user-friendly messages
- ✅ **TypeScript Support** - Strict typing for all interfaces and methods
- ✅ **CORS Support** - Proper headers for cross-origin requests
- ✅ **File Validation** - Supports image formats and size limits
- ✅ **Pagination** - Full pagination support for large datasets
- ✅ **Filtering** - Query parameters for subject and difficulty filtering
- ✅ **Statistics** - Complete statistics and analytics
- ✅ **Problem Management** - View, delete, and manage math problems

---

## 🚀 **Ready for Production**

The Math API client is fully implemented and ready for production use. It provides:

1. **Complete API Coverage** - All endpoints from the documentation
2. **Universal File Upload** - Proper FormData handling for images
3. **Type Safety** - Full TypeScript support
4. **Error Handling** - Comprehensive error management
5. **User Experience** - Loading states and user feedback
6. **Scalability** - Pagination and filtering for large datasets

The implementation follows all workspace rules and best practices, ensuring a robust and maintainable codebase.
