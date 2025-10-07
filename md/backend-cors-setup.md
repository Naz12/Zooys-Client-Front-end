# Backend CORS Configuration Guide

## Problem
The frontend (http://localhost:3000) cannot communicate with the backend (http://localhost:8000) due to CORS (Cross-Origin Resource Sharing) policy blocking the requests.

## Error Message
```
Access to fetch at 'http://localhost:8000/' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## Solutions

### For FastAPI Backend (Python)

#### 1. Install CORS Middleware
```bash
pip install fastapi[all]
```

#### 2. Add CORS Configuration
```python
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",  # Frontend development server
        "http://127.0.0.1:3000",  # Alternative localhost
        "http://localhost:3001",  # Alternative port
    ],
    allow_credentials=True,
    allow_methods=["*"],  # Allow all HTTP methods
    allow_headers=["*"],  # Allow all headers
)

# Your existing routes
@app.get("/")
async def root():
    return {"message": "Backend is running"}

@app.post("/api/summarize")
async def summarize(request: SummarizeRequest):
    # Your summarization logic here
    pass
```

#### 3. Complete Backend Example
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

app = FastAPI(title="AI Dashboard Backend")

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:3001",
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    content_type: str
    source: dict
    options: dict

class SummarizeResponse(BaseModel):
    summary: str
    metadata: dict
    source_info: dict

@app.get("/")
async def health_check():
    return {"status": "ok", "message": "Backend is running"}

@app.get("/health")
async def health():
    return {"status": "healthy", "timestamp": "2025-01-07T16:50:54Z"}

@app.post("/api/summarize")
async def summarize(request: SummarizeRequest):
    try:
        # Your YouTube summarization logic here
        if request.content_type == "link" and request.source.get("type") == "url":
            url = request.source.get("data")
            if "youtube.com" in url or "youtu.be" in url:
                # Process YouTube URL
                summary = "This is a sample YouTube summary..."
                return SummarizeResponse(
                    summary=summary,
                    metadata={
                        "content_type": "link",
                        "processing_time": "5.2s",
                        "tokens_used": 1500,
                        "confidence": 0.95
                    },
                    source_info={
                        "title": "Sample Video Title",
                        "url": url,
                        "author": "Sample Channel",
                        "word_count": 500
                    }
                )
        
        raise HTTPException(status_code=400, detail="Unsupported content type")
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### For Express.js Backend (Node.js)

#### 1. Install CORS Package
```bash
npm install cors
```

#### 2. Add CORS Configuration
```javascript
const express = require('express');
const cors = require('cors');

const app = express();

// CORS Configuration
app.use(cors({
  origin: [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Your existing routes
app.get('/', (req, res) => {
  res.json({ message: 'Backend is running' });
});

app.post('/api/summarize', (req, res) => {
  // Your summarization logic here
  res.json({
    summary: 'Sample summary...',
    metadata: { processing_time: '5.2s' },
    source_info: { title: 'Sample Video' }
  });
});

app.listen(8000, () => {
  console.log('Backend server running on http://localhost:8000');
});
```

### For Flask Backend (Python)

#### 1. Install Flask-CORS
```bash
pip install flask-cors
```

#### 2. Add CORS Configuration
```python
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

# CORS Configuration
CORS(app, origins=[
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "http://localhost:3001"
])

@app.route('/')
def health_check():
    return jsonify({"message": "Backend is running"})

@app.route('/api/summarize', methods=['POST'])
def summarize():
    data = request.get_json()
    # Your summarization logic here
    return jsonify({
        "summary": "Sample summary...",
        "metadata": {"processing_time": "5.2s"},
        "source_info": {"title": "Sample Video"}
    })

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8000, debug=True)
```

## Testing CORS Configuration

### 1. Test Backend Health
```bash
curl http://localhost:8000/
```

### 2. Test CORS Headers
```bash
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: POST" \
     -H "Access-Control-Request-Headers: Content-Type" \
     -X OPTIONS \
     http://localhost:8000/api/summarize
```

### 3. Test from Browser Console
```javascript
fetch('http://localhost:8000/', {
  method: 'GET',
  headers: { 'Content-Type': 'application/json' }
})
.then(response => response.json())
.then(data => console.log('Backend response:', data))
.catch(error => console.error('CORS Error:', error));
```

## Expected Response Headers
After proper CORS configuration, you should see these headers in the response:
```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization
Access-Control-Allow-Credentials: true
```

## Quick Fix for Development
If you need a quick temporary fix for development, you can disable CORS in your browser (NOT recommended for production):

### Chrome
```bash
chrome.exe --user-data-dir=/tmp/foo --disable-web-security --disable-features=VizDisplayCompositor
```

### Firefox
1. Open `about:config`
2. Set `security.fileuri.strict_origin_policy` to `false`

**⚠️ Warning: Only use browser CORS disabling for development. Never use in production!**

## Production Considerations
For production deployment:
1. Set specific allowed origins (not `*`)
2. Use HTTPS
3. Implement proper authentication
4. Add rate limiting
5. Use environment variables for configuration
