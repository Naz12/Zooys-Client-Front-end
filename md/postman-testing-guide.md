# 🧪 Postman Testing Guide for Specialized Endpoints

## 📋 Text Summarization Endpoint Test

### **Endpoint Details:**
- **URL**: `http://localhost:8000/api/summarize/async/text`
- **Method**: `POST`
- **Content-Type**: `application/json`

### **Headers Required:**
```
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json
```

### **Request Body:**
```json
{
  "text": "Born into a wealthy family in New York City, Trump graduated from the Wharton School of the University of Pennsylvania in 1968. He took over his father's real estate business, renamed it the Trump Organization, and expanded it into skyscrapers, hotels, casinos, and golf courses. Trump faced six business bankruptcies in the 1990s and early 2000s, but his business empire continued to grow through licensing deals and real estate development.",
  "options": {
    "language": "en",
    "format": "detailed",
    "focus": "summary"
  }
}
```

## 🔄 Complete Testing Workflow

### **Step 1: Start Text Summarization Job**

**Request:**
```http
POST http://localhost:8000/api/summarize/async/text
Authorization: Bearer YOUR_AUTH_TOKEN
Content-Type: application/json

{
  "text": "Your long text content here...",
  "options": {
    "language": "en",
    "format": "detailed",
    "focus": "summary"
  }
}
```

**Expected Response (202 Accepted):**
```json
{
  "success": true,
  "message": "Summarization job started",
  "job_id": "479cbb8b-8ddc-4f46-a213-9ecb451cdd9b",
  "status": "pending",
  "poll_url": "http://localhost:8000/api/summarize/status/479cbb8b-8ddc-4f46-a213-9ecb451cdd9b",
  "result_url": "http://localhost:8000/api/summarize/result/479cbb8b-8ddc-4f46-a213-9ecb451cdd9b"
}
```

### **Step 2: Check Job Status**

**Request:**
```http
GET http://localhost:8000/api/summarize/status/{job_id}
Authorization: Bearer YOUR_AUTH_TOKEN
```

**Expected Response (200 OK):**
```json
{
  "job_id": "479cbb8b-8ddc-4f46-a213-9ecb451cdd9b",
  "status": "running",
  "progress": 25,
  "stage": "processing",
  "error": null
}
```

**Status Values:**
- `pending` - Job created, waiting to start
- `running` - Job in progress
- `completed` - Job finished successfully
- `failed` - Job failed with error

### **Step 3: Get Job Result (When Completed)**

**Request:**
```http
GET http://localhost:8000/api/summarize/result/{job_id}
Authorization: Bearer YOUR_AUTH_TOKEN
```

**Expected Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "summary": "Donald Trump became a real estate magnate after taking over his father's business, expanding it into various sectors including skyscrapers, hotels, casinos, and golf courses. Despite facing six business bankruptcies in the 1990s and 2000s, his business empire continued to grow through licensing deals and real estate development.",
    "key_points": [
      "Born into a wealthy family in New York City",
      "Graduated from Wharton School of the University of Pennsylvania in 1968",
      "Took over father's real estate business and renamed it Trump Organization",
      "Expanded into skyscrapers, hotels, casinos, and golf courses",
      "Faced six business bankruptcies in the 1990s and early 2000s",
      "Business empire continued to grow through licensing deals",
      "Continued real estate development despite bankruptcies"
    ],
    "confidence_score": 0.8,
    "model_used": "ollama:phi3:mini"
  }
}
```

## 🧪 Test Cases

### **Test Case 1: Basic Text Summarization**
```json
{
  "text": "Artificial intelligence (AI) is intelligence demonstrated by machines, in contrast to the natural intelligence displayed by humans and animals. Leading AI textbooks define the field as the study of 'intelligent agents': any device that perceives its environment and takes actions that maximize its chance of successfully achieving its goals.",
  "options": {
    "language": "en",
    "format": "detailed",
    "focus": "summary"
  }
}
```

### **Test Case 2: Long Text Summarization**
```json
{
  "text": "Climate change refers to long-term shifts in global temperatures and weather patterns. While climate variations are natural, since the 1800s human activities have been the main driver of climate change, primarily due to burning fossil fuels like coal, oil and gas. Burning fossil fuels generates greenhouse gas emissions that act like a blanket wrapped around the Earth, trapping the sun's heat and raising temperatures. The main greenhouse gases that cause climate change include carbon dioxide and methane. These come from using gasoline for driving a car or coal for heating a building, for example. Clearing land and forests can also release carbon dioxide. Landfills for garbage are a major source of methane emissions. Energy, industry, transport, buildings, agriculture and land use are among the main emitters. Climate change can affect our health, ability to grow food, housing, safety and work. Some of us are already more vulnerable to climate impacts, such as people living in small island nations and other developing countries. Conditions like sea-level rise and saltwater intrusion have advanced to the point where whole communities have had to relocate, and protracted droughts are putting people at risk of famine. In the future, the number of 'climate refugees' is expected to rise.",
  "options": {
    "language": "en",
    "format": "detailed",
    "focus": "summary"
  }
}
```

### **Test Case 3: Different Language**
```json
{
  "text": "La inteligencia artificial (IA) es la inteligencia demostrada por máquinas, en contraste con la inteligencia natural mostrada por humanos y animales. Los libros de texto principales de IA definen el campo como el estudio de 'agentes inteligentes': cualquier dispositivo que percibe su entorno y toma acciones que maximizan su posibilidad de éxito al lograr sus objetivos.",
  "options": {
    "language": "es",
    "format": "detailed",
    "focus": "summary"
  }
}
```

## 🔧 Postman Collection Setup

### **Environment Variables:**
```
base_url: http://localhost:8000
auth_token: YOUR_AUTH_TOKEN_HERE
```

### **Pre-request Script:**
```javascript
// Set the job_id from previous response
if (pm.response.json().job_id) {
    pm.environment.set("job_id", pm.response.json().job_id);
}
```

### **Tests Script:**
```javascript
// Test for successful response
pm.test("Status code is 200", function () {
    pm.response.to.have.status(200);
});

pm.test("Response has job_id", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('job_id');
});

pm.test("Response has status", function () {
    const jsonData = pm.response.json();
    pm.expect(jsonData).to.have.property('status');
});
```

## 📊 Expected Performance

### **Processing Times:**
- **Short text** (< 500 words): ~10-20 seconds
- **Medium text** (500-2000 words): ~20-40 seconds
- **Long text** (> 2000 words): ~40-60 seconds

### **Response Sizes:**
- **Summary**: 100-500 words
- **Key points**: 5-10 bullet points
- **Confidence score**: 0.7-0.9 (70%-90%)

## 🚨 Error Handling

### **Common Errors:**

#### **1. Authentication Error (401)**
```json
{
  "success": false,
  "error": "Invalid token format"
}
```

#### **2. Validation Error (422)**
```json
{
  "success": false,
  "error": "Validation failed",
  "details": {
    "text": ["The text field is required."]
  }
}
```

#### **3. Job Processing Error (500)**
```json
{
  "success": false,
  "error": "AI Manager service is currently unavailable"
}
```

#### **4. Job Not Found (404)**
```json
{
  "success": false,
  "error": "Job not found"
}
```

## 🎯 Testing Checklist

### **✅ Pre-Test Setup:**
- [ ] Backend server running on `http://localhost:8000`
- [ ] Valid authentication token
- [ ] Postman configured with correct headers
- [ ] Test data prepared

### **✅ Test Execution:**
- [ ] Start job request successful (202)
- [ ] Job ID received and stored
- [ ] Status polling working (200)
- [ ] Job completion detected
- [ ] Result retrieval successful (200)
- [ ] Summary and key points extracted

### **✅ Validation:**
- [ ] Summary is coherent and relevant
- [ ] Key points are accurate
- [ ] Confidence score is reasonable (0.7-0.9)
- [ ] Model used is correct
- [ ] No errors in processing

## 🚀 Quick Start Commands

### **cURL Commands:**

#### **Start Job:**
```bash
curl -X POST http://localhost:8000/api/summarize/async/text \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "text": "Your text content here...",
    "options": {
      "language": "en",
      "format": "detailed",
      "focus": "summary"
    }
  }'
```

#### **Check Status:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/summarize/status/JOB_ID
```

#### **Get Result:**
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8000/api/summarize/result/JOB_ID
```

This guide should help you test the specialized text endpoint thoroughly with Postman! 🎯




