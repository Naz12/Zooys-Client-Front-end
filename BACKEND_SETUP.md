# 🚀 Backend Setup Guide

## **Quick Start**

The CORS errors you're seeing indicate that the backend server is not running. Here's how to fix it:

### **Option 1: Start the Backend Server**

1. **Navigate to your backend directory** (where your Laravel/PHP backend is located)
2. **Start the server:**
   ```bash
   # For Laravel
   php artisan serve --host=0.0.0.0 --port=8000
   
   # Or for other PHP frameworks
   php -S localhost:8000
   ```

3. **Verify the server is running:**
   ```bash
   curl http://localhost:8000/api/health
   # or
   curl http://localhost:8000/api/status
   ```

### **Option 2: Use Mock Data (Development Only)**

If you don't have the backend running yet, you can use mock data for development:

1. **Create a mock API server** (optional):
   ```bash
   # Install json-server globally
   npm install -g json-server
   
   # Create a mock API
   json-server --watch mock-api.json --port 8000
   ```

2. **Or modify the frontend to use mock data** (see below)

## **CORS Configuration**

If you have the backend running but still getting CORS errors, add these headers to your backend:

### **Laravel Backend:**
```php
// In your Laravel backend, add to app/Http/Middleware/Cors.php:

public function handle($request, Closure $next)
{
    return $next($request)
        ->header('Access-Control-Allow-Origin', 'http://localhost:3000')
        ->header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        ->header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With')
        ->header('Access-Control-Allow-Credentials', 'true');
}
```

### **Other Backend Frameworks:**
```javascript
// Express.js
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true
}));

// FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

## **Frontend Configuration**

The frontend is now configured to use a Next.js proxy in development:

### **Development Mode:**
- Frontend: `http://localhost:3000`
- API calls go to: `http://localhost:3000/api/*` (proxied to backend)
- Backend should be running on: `http://localhost:8000`

### **Production Mode:**
- API calls go directly to: `http://localhost:8000/api/*`
- Set `NEXT_PUBLIC_API_URL` environment variable

## **Testing the Setup**

1. **Start the backend server:**
   ```bash
   # In your backend directory
   php artisan serve --host=0.0.0.0 --port=8000
   ```

2. **Start the frontend:**
   ```bash
   # In your frontend directory
   npm run dev
   ```

3. **Test the connection:**
   - Open browser dev tools
   - Go to Network tab
   - Try uploading a file
   - Check if API calls are successful

## **Troubleshooting**

### **CORS Errors:**
- ✅ Backend server is running on port 8000
- ✅ CORS headers are configured in backend
- ✅ Frontend is using Next.js proxy in development

### **Network Errors:**
- ✅ Backend server is accessible at `http://localhost:8000`
- ✅ No firewall blocking port 8000
- ✅ Backend API endpoints are working

### **API Errors:**
- ✅ Backend has the required API endpoints
- ✅ Authentication is working
- ✅ Database is connected

## **Environment Variables**

Create a `.env.local` file in your frontend directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000

# Development
NODE_ENV=development
```

## **Quick Fix for Development**

If you want to continue development without the backend, you can:

1. **Comment out RAG functionality temporarily**
2. **Use mock data for testing**
3. **Focus on frontend development first**

The frontend will now show better error messages when the backend is not available.

## **Next Steps**

1. **Start your backend server**
2. **Test the API endpoints**
3. **Verify CORS is working**
4. **Continue with development**

---

**Need Help?** Check the console for detailed error messages and ensure your backend server is running on port 8000.
