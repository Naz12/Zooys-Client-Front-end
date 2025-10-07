# Backend Troubleshooting Guide

## Common Issues and Solutions

### 1. Backend Server Not Running
**Error**: `Failed to fetch` or `CORS` errors
**Solution**: 
- Ensure the backend server is running on `http://localhost:8000`
- Check if the backend process is active
- Verify the correct port is being used

### 2. 500 Internal Server Error with HTML Response
**Error**: `Invalid JSON response` or `HTML instead of JSON`
**Symptoms**: 
- API returns HTML error page instead of JSON
- Console shows `<!DOCTYPE html>` in response
- 500 status code

**Solutions**:
1. **Check Backend Logs**: Look at the backend server console for error details
2. **Database Connection**: Verify database is running and accessible
3. **Environment Variables**: Ensure all required environment variables are set
4. **Dependencies**: Check if all required packages are installed
5. **API Routes**: Verify the API endpoint exists and is properly configured

### 3. CORS Issues
**Error**: `CORS` related errors in console
**Solution**:
- Ensure CORS is properly configured in the backend
- Check if the frontend URL is allowed in CORS settings
- Verify the backend is accepting requests from the frontend domain

### 4. Authentication Issues
**Error**: `401 Unauthorized` or token-related errors
**Solution**:
- Check if the authentication token is valid
- Verify token expiration
- Ensure the backend authentication middleware is working

## Debugging Steps

### 1. Check Backend Server Status
```bash
# Check if the backend server is running
curl http://localhost:8000/api/health

# Or check the process
ps aux | grep "your-backend-process"
```

### 2. Check Backend Logs
Look for error messages in the backend console output:
- Database connection errors
- Missing environment variables
- API route errors
- Authentication failures

### 3. Test API Endpoints Directly
```bash
# Test the specific endpoint that's failing
curl -X GET "http://localhost:8000/api/ai-results?page=1&per_page=15&tool_type=summarize" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 4. Check Database Connection
- Ensure the database is running
- Verify connection credentials
- Check if the required tables exist

### 5. Environment Variables
Verify all required environment variables are set:
- Database connection strings
- API keys
- JWT secrets
- CORS settings

## Frontend Error Handling

The frontend now includes improved error handling for:
- Backend connection issues
- HTML error page responses
- Invalid JSON responses
- Network timeouts

When these errors occur, the frontend will:
1. Display a user-friendly error message
2. Show a retry button
3. Provide guidance on how to fix the issue
4. Log detailed error information to the console

## Getting Help

If you continue to experience issues:
1. Check the browser console for detailed error messages
2. Look at the backend server logs
3. Verify all dependencies are installed
4. Ensure the backend server is properly configured
5. Check if the database is accessible

## Quick Fixes

### Restart Backend Server
```bash
# Stop the backend server (Ctrl+C)
# Then restart it
npm start
# or
python manage.py runserver
# or whatever command you use to start your backend
```

### Clear Browser Cache
- Hard refresh the page (Ctrl+F5)
- Clear browser cache and cookies
- Try in an incognito/private window

### Check Network
- Ensure no firewall is blocking the connection
- Verify the port 8000 is not being used by another process
- Check if there are any proxy settings interfering