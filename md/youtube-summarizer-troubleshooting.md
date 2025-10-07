# YouTube Summarizer Troubleshooting Guide

## Issue: "No summary generated" with empty response `{}`

### Root Cause
The backend server is returning an empty response object, which typically indicates one of these issues:

1. **Backend server not running** on `http://localhost:8000`
2. **Missing API endpoint** `/api/summarize` not implemented
3. **YouTube processing not supported** by the backend
4. **CORS issues** blocking requests (MOST COMMON)
5. **Authentication problems** with auth token

## Issue: CORS Policy Error (MOST COMMON)

### Error Message
```
Access to fetch at 'http://localhost:8000/' from origin 'http://localhost:3000' has been blocked by CORS policy: Response to preflight request doesn't pass access control check: No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

### Root Cause
The backend server is running but doesn't have CORS (Cross-Origin Resource Sharing) configured to allow requests from the frontend.

### Quick Fix
Add CORS middleware to your backend server. See `md/backend-cors-setup.md` for detailed instructions.

### Debugging Steps

#### 1. Check Backend Server Status
- Look for the "Backend Status" component on the YouTube summarizer page
- Green = Online, Red = Offline, Yellow = Error
- Click "Check" button to refresh status

#### 2. Verify Backend Server is Running
```bash
# Check if server is running on port 8000
curl http://localhost:8000/
# or
netstat -an | findstr :8000
```

#### 3. Test API Endpoints
```javascript
// Run in browser console
fetch('http://localhost:8000/api/summarize', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
  },
  body: JSON.stringify({
    content_type: "link",
    source: { type: "url", data: "https://www.youtube.com/watch?v=dQw4w9WgXcQ" },
    options: { mode: "detailed", language: "en", focus: "summary" }
  })
}).then(r => r.text()).then(console.log);
```

#### 4. Check Browser Console
Look for these specific error messages:
- `Backend connection failed` - Server not running
- `Empty response object` - Endpoint not implemented
- `CORS error` - Cross-origin request blocked
- `Failed to fetch` - Network connectivity issue

### Solutions

#### Solution 1: Start Backend Server
```bash
# Navigate to backend directory
cd path/to/backend

# Install dependencies
pip install -r requirements.txt

# Start the server
python app.py
# or
uvicorn main:app --host 0.0.0.0 --port 8000
```

#### Solution 2: Implement Missing Endpoint
The backend needs a `/api/summarize` endpoint that accepts:
```json
{
  "content_type": "link",
  "source": {
    "type": "url", 
    "data": "https://www.youtube.com/watch?v=..."
  },
  "options": {
    "mode": "detailed",
    "language": "en",
    "focus": "summary"
  }
}
```

#### Solution 3: Fix CORS Configuration
Backend needs to allow requests from `http://localhost:3000`:
```python
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### Solution 4: Check Authentication
- Ensure user is logged in
- Check if auth token is valid
- Verify backend accepts the token format

### Expected Backend Response
The backend should return:
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
    "author": "Channel Name",
    "word_count": 500
  }
}
```

### Fallback Mechanism
If the main API fails, the app tries a fallback to `/api/youtube/summarize` endpoint with different parameters.

### Testing URLs
Try these test YouTube URLs:
- `https://www.youtube.com/watch?v=dQw4w9WgXcQ` (Rick Roll - short video)
- `https://www.youtube.com/watch?v=jNQXAC9IVRw` (Me at the zoo - first YouTube video)
- `https://youtu.be/dQw4w9WgXcQ` (Short URL format)

### Common Error Messages

| Error Message | Cause | Solution |
|---------------|-------|----------|
| "Cannot connect to backend server" | Server not running | Start backend server |
| "Empty response object" | Endpoint not implemented | Implement `/api/summarize` |
| "CORS error" | Cross-origin blocked | Configure CORS in backend |
| "No summary generated" | YouTube processing failed | Check backend YouTube support |
| "Invalid YouTube URL" | URL format wrong | Use proper YouTube URL format |

### Backend Requirements
The backend server must:
1. Run on `http://localhost:8000`
2. Have `/api/summarize` endpoint implemented
3. Support YouTube URL processing
4. Return JSON responses
5. Handle CORS for `http://localhost:3000`
6. Accept authentication tokens
