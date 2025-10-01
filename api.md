# Backend API Understanding & Analysis

## **1. API Architecture Overview**

### **Base URL**: `http://localhost:8000/api/`
- **Protocol**: HTTP/HTTPS
- **Port**: 8000
- **Path**: `/api/` prefix for all endpoints
- **Documentation**: Zooys Client API Documentation

## **2. Authentication System**

### **User Registration & Login**
- **POST /api/register**: New user registration
  - **Input**: `{ name, email, password }`
  - **Output**: `{ user, token }`
  - **Purpose**: Create new user accounts

- **POST /api/login**: User authentication
  - **Input**: `{ email, password }`
  - **Output**: `{ user, token }`
  - **Purpose**: Authenticate existing users

- **POST /api/logout**: Session termination
  - **Input**: Bearer token in header
  - **Output**: Success/error response
  - **Purpose**: End user session and revoke tokens

### **Security Features**
- **Token-based Authentication**: JWT or similar token system
- **Token Revocation**: Logout revokes all user tokens
- **Bearer Token**: Standard Authorization header format

## **3. Subscription & Payment System**

### **Plan Management**
- **GET /api/plans**: List available subscription plans
  - **Output**: `{ id, name, price, currency, interval, limit }`
  - **Purpose**: Display pricing options to users

### **Subscription Management**
- **GET /api/subscription**: Current user's active subscription
  - **Output**: `{ plan, price, currency, limit, starts_at, ends_at }`
  - **Purpose**: Show user's current plan details

- **GET /api/subscription/history**: User's subscription history
  - **Output**: List of subscriptions with active status
  - **Purpose**: Track subscription changes over time

### **Payment Processing**
- **POST /api/stripe/webhook**: Stripe webhook handler
  - **Events**: `checkout.session.completed`, `invoice.payment_failed`, `customer.subscription.deleted`
  - **Purpose**: Handle payment events from Stripe

## **4. AI Tool Endpoints**

### **YouTube Processing**
- **POST /api/youtube/summarize**: YouTube video summarization
  - **Input**: `{ video_url, language?, mode? }`
  - **Output**: `{ summary }`
  - **Purpose**: Summarize YouTube videos

### **PDF Processing**
- **POST /api/pdf/summarize**: PDF document summarization
  - **Input**: `{ file_path }`
  - **Output**: `{ summary }`
  - **Purpose**: Summarize PDF documents

### **AI Writing**
- **POST /api/writer/run**: AI writing generation
  - **Input**: `{ prompt, mode? }`
  - **Output**: `{ output }`
  - **Purpose**: Generate AI-written content

### **Math Solving**
- **POST /api/math/solve**: Mathematical problem solving
  - **Input**: `{ problem }`
  - **Output**: `{ solution }`
  - **Purpose**: Solve mathematical problems

### **Flashcard Generation**
- **POST /api/flashcards/generate**: Create study flashcards
  - **Input**: `{ topic }`
  - **Output**: Array of question/answer pairs
  - **Purpose**: Generate educational flashcards

### **Diagram Creation**
- **POST /api/diagram/generate**: Generate diagrams
  - **Input**: `{ description }`
  - **Output**: `{ diagram text }`
  - **Purpose**: Create diagrams from descriptions

## **5. API Design Patterns**

### **RESTful Architecture**
- **Resource-based URLs**: Clear resource naming
- **HTTP Methods**: Appropriate use of GET, POST
- **Status Codes**: Standard HTTP response codes
- **JSON Format**: Consistent request/response format

### **Authentication Pattern**
- **Token-based**: JWT or similar token system
- **Bearer Authentication**: Standard header format
- **Session Management**: Token revocation on logout

### **Error Handling**
- **Standard HTTP Codes**: 200, 400, 401, 500, etc.
- **Consistent Format**: Likely JSON error responses
- **Validation**: Input validation for all endpoints

## **6. Integration Opportunities**

### **Frontend Integration Points**
- **Authentication Flow**: Login/register forms
- **Subscription Management**: Plan selection and billing
- **AI Tool Integration**: Connect each dashboard tool to corresponding API
- **File Upload**: PDF processing requires file upload
- **Real-time Updates**: Webhook handling for payment events

### **Data Flow**
1. **User Authentication**: Login → Get token → Store in frontend
2. **API Calls**: Include token in Authorization header
3. **File Processing**: Upload files → Process → Display results
4. **Subscription**: Check plan limits → Process requests → Update usage

## **7. Security Considerations**

### **Authentication Security**
- **Token Expiration**: Tokens likely have expiration times
- **Token Refresh**: May need refresh token mechanism
- **Secure Storage**: Frontend must securely store tokens
- **HTTPS**: All API calls should use HTTPS in production

### **Input Validation**
- **File Uploads**: PDF files need validation
- **URL Validation**: YouTube URLs must be valid
- **Input Sanitization**: All text inputs need sanitization
- **Rate Limiting**: API likely has rate limits

## **8. Missing Endpoints (Potential Gaps)**

### **User Management**
- **Profile Updates**: No endpoint for updating user profile
- **Password Reset**: No password reset functionality
- **Email Verification**: No email verification endpoint

### **Content Management**
- **History/Saved Items**: No endpoints for saving user content
- **Export Options**: No endpoints for exporting results
- **Batch Processing**: No endpoints for processing multiple items

### **Analytics**
- **Usage Tracking**: No endpoints for tracking user activity
- **Performance Metrics**: No endpoints for system monitoring

## **9. Implementation Strategy**

### **Frontend Integration Plan**
1. **Authentication**: Implement login/register forms
2. **API Client**: Create HTTP client with token management
3. **Tool Integration**: Connect each dashboard tool to API
4. **Error Handling**: Implement comprehensive error handling
5. **Loading States**: Add loading indicators for API calls

### **Required Frontend Changes**
- **API Client**: HTTP client with authentication
- **Token Management**: Secure token storage and refresh
- **File Upload**: PDF upload functionality
- **Error Handling**: User-friendly error messages
- **Loading States**: Progress indicators for API calls

## **10. Development Considerations**

### **Environment Setup**
- **API Base URL**: Configure for different environments
- **CORS**: Ensure CORS is properly configured
- **Authentication**: Implement token-based auth
- **File Handling**: Handle file uploads and downloads

### **Testing Strategy**
- **API Integration Tests**: Test all endpoints
- **Authentication Tests**: Test login/logout flow
- **Error Handling Tests**: Test error scenarios
- **Performance Tests**: Test with large files and data

## **11. API Endpoint Summary**

### **Authentication Endpoints**
- `POST /api/register` - User registration
- `POST /api/login` - User login
- `POST /api/logout` - User logout

### **Subscription Endpoints**
- `GET /api/plans` - List subscription plans
- `GET /api/subscription` - Get current subscription
- `GET /api/subscription/history` - Get subscription history
- `POST /api/stripe/webhook` - Stripe webhook handler

### **AI Tool Endpoints**
- `POST /api/youtube/summarize` - YouTube video summarization
- `POST /api/pdf/summarize` - PDF document summarization
- `POST /api/writer/run` - AI writing generation
- `POST /api/math/solve` - Mathematical problem solving
- `POST /api/flashcards/generate` - Flashcard generation
- `POST /api/diagram/generate` - Diagram creation

## **12. Frontend Integration Requirements**

### **HTTP Client Setup**
- **Base URL Configuration**: `http://localhost:8000/api/`
- **Authentication Headers**: Bearer token in Authorization header
- **Error Handling**: Comprehensive error response handling
- **Request/Response Interceptors**: Token refresh and error handling

### **State Management**
- **Authentication State**: User login status and token
- **Subscription State**: Current plan and limits
- **API Loading States**: Loading indicators for each endpoint
- **Error State**: Error messages and recovery options

### **File Handling**
- **PDF Upload**: File upload for PDF processing
- **File Validation**: File type and size validation
- **Progress Tracking**: Upload progress indicators
- **Error Handling**: Upload failure recovery

---

This backend API provides a comprehensive foundation for the Zooys Dashboard, with all the necessary endpoints for authentication, subscription management, and AI tool functionality. The frontend implementation will need to integrate with these endpoints to provide a seamless user experience.

## Updated API Endpoints

The API has been updated with the following endpoint structure:

### Authentication Endpoints
- `POST /api/register` - User registration
- `POST /api/login` - User authentication  
- `POST /api/logout` - User logout
- `GET /api/user` - Get current user profile

### Subscription Endpoints
- `GET /api/plans` - Get available subscription plans
- `GET /api/subscription` - Get current subscription
- `GET /api/subscription/history` - Get subscription history
- `GET /api/usage` - Get usage statistics (not implemented yet)

### Payment Endpoints
- `POST /api/checkout` - Create Stripe checkout session (not implemented yet)

### AI Tool Endpoints
- `POST /api/youtube/summarize` - YouTube video summarization
- `POST /api/pdf/summarize` - PDF document summarization
- `POST /api/writer/run` - AI content writing
- `POST /api/math/solve` - Math problem solving
- `POST /api/flashcards/generate` - Flashcard generation
- `POST /api/diagram/generate` - Diagram generation

For detailed API documentation, see [API_ENDPOINTS.md](./API_ENDPOINTS.md).

