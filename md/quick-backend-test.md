# Quick Backend Test Setup

## Problem
You're getting `No summary in response: {}` which means:
- ✅ Backend server is running
- ✅ CORS is configured  
- ❌ `/api/summarize` endpoint is not working properly

## Quick Solution

### Option 1: Use the Test Backend (Recommended)
1. **Install Python dependencies:**
   ```bash
   pip install fastapi uvicorn
   ```

2. **Run the test backend:**
   ```bash
   python test/simple-backend-example.py
   ```

3. **Test the YouTube summarizer** - it should now work!

### Option 2: Fix Your Existing Backend

#### For FastAPI Backend:
```python
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# CORS Configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class SummarizeRequest(BaseModel):
    content_type: str
    source: dict
    options: dict

@app.post("/api/summarize")
async def summarize(request: SummarizeRequest):
    # Your YouTube summarization logic here
    return {
        "summary": "This is a test summary...",
        "metadata": {
            "content_type": "link",
            "processing_time": "5.2s",
            "tokens_used": 1500,
            "confidence": 0.95
        },
        "source_info": {
            "title": "Test Video",
            "url": request.source.get("data"),
            "author": "Test Channel"
        }
    }
```

#### For Express.js Backend:
```javascript
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());

app.post('/api/summarize', (req, res) => {
  const { content_type, source, options } = req.body;
  
  res.json({
    summary: "This is a test summary...",
    metadata: {
      content_type: content_type,
      processing_time: "5.2s",
      tokens_used: 1500,
      confidence: 0.95
    },
    source_info: {
      title: "Test Video",
      url: source.data,
      author: "Test Channel"
    }
  });
});

app.listen(8000, () => {
  console.log('Backend running on http://localhost:8000');
});
```

## Testing Steps

### 1. Test Backend Connectivity
Run in browser console:
```javascript
fetch('http://localhost:8000/')
  .then(r => r.json())
  .then(console.log)
  .catch(console.error);
```

### 2. Test API Endpoint
Run in browser console:
```javascript
fetch('http://localhost:8000/api/summarize', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    content_type: "link",
    source: { type: "url", data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    options: { mode: "detailed", language: "en", focus: "summary" }
  })
})
.then(r => r.json())
.then(console.log)
.catch(console.error);
```

### 3. Use the Test Script
Run `test/backend-api-test.js` in browser console for comprehensive testing.

## Expected Response Format
```json
{
  "summary": "Video summary text...",
  "metadata": {
    "content_type": "link",
    "processing_time": "5.2s",
    "tokens_used": 1500,
    "confidence": 0.95
  },
  "source_info": {
    "title": "Video Title",
    "url": "https://www.youtube.com/watch?v=...",
    "author": "Channel Name"
  }
}
```

## Troubleshooting

### If you still get empty responses:
1. **Check backend logs** for errors
2. **Verify endpoint exists** at `http://localhost:8000/api/summarize`
3. **Test with curl:**
   ```bash
   curl -X POST http://localhost:8000/api/summarize \
     -H "Content-Type: application/json" \
     -d '{"content_type":"link","source":{"type":"url","data":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"},"options":{"mode":"detailed","language":"en","focus":"summary"}}'
   ```

### If you get CORS errors:
- Make sure CORS is configured in your backend
- Check that `http://localhost:3000` is in allowed origins

### If you get authentication errors:
- Check if your backend requires authentication
- Verify the auth token format
