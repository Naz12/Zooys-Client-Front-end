# 🧪 Stripe Subscription Testing Guide

## 🚀 Quick Start Testing

### 1. **Environment Setup**
Make sure you have these environment variables set in your `.env.local`:

```bash
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_FRONTEND_URL=http://localhost:3001

# Stripe Configuration (Your test key)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_your_stripe_key_here

# Development
NODE_ENV=development
NEXT_PUBLIC_DEBUG_MODE=true
```

### 2. **Start Testing**
1. **Navigate to the test page:** `http://localhost:3001/subscription-test`
2. **Run API tests:** Click "Run All Tests" to verify all endpoints
3. **Test checkout flow:** Click "Test Pro Plan Checkout" or "Test Unlimited Plan Checkout"

---

## 📋 Complete Testing Checklist

### ✅ **API Endpoint Tests**

#### **GET /api/plans** (Public - No Auth Required)
- **Expected:** Array of 3 plans (Free, Pro, Unlimited)
- **Test:** Should return plans with correct structure
- **Verify:** Plan IDs, names, prices, limits

#### **GET /api/subscription** (Auth Required)
- **Expected:** Current subscription or "No active subscription"
- **Test:** Should handle both cases gracefully
- **Verify:** Subscription structure matches API docs

#### **GET /api/subscription/history** (Auth Required)
- **Expected:** Array of past subscriptions
- **Test:** Should return history even if empty
- **Verify:** History structure and dates

#### **GET /api/usage** (Auth Required)
- **Expected:** Usage statistics with limits and percentages
- **Test:** Should calculate remaining usage correctly
- **Verify:** Usage history and reset dates

#### **POST /api/checkout** (Auth Required)
- **Expected:** Checkout session with Stripe URL
- **Test:** Should create session for valid plans
- **Verify:** Redirect URLs and session ID

---

### 💳 **Stripe Checkout Flow Tests**

#### **Test 1: Pro Plan Checkout ($9.99)**
1. Click "Test Pro Plan Checkout"
2. Verify checkout session creation
3. Confirm redirect to Stripe
4. Complete test payment
5. Verify redirect to success page
6. Check subscription status

#### **Test 2: Unlimited Plan Checkout ($29.99)**
1. Click "Test Unlimited Plan Checkout"
2. Verify checkout session creation
3. Confirm redirect to Stripe
4. Complete test payment
5. Verify redirect to success page
6. Check subscription status

#### **Test 3: Payment Cancellation**
1. Start checkout process
2. Cancel on Stripe page
3. Verify redirect to cancel page
4. Check no subscription created

---

### 🔄 **Complete User Flow Test**

#### **Scenario: New User Subscription**
1. **Login** to the application
2. **Navigate** to `/subscription` page
3. **View plans** - should see Free, Pro, Unlimited
4. **Select Pro plan** - click "Select Plan"
5. **Checkout flow** - verify plan details and features
6. **Payment** - click "Continue to Payment"
7. **Stripe redirect** - complete test payment
8. **Success page** - verify subscription activation
9. **Dashboard** - check usage limits updated

#### **Scenario: Existing User Upgrade**
1. **Login** with existing subscription
2. **Navigate** to subscription page
3. **View current plan** - should show active subscription
4. **Select higher plan** - click "Upgrade"
5. **Upgrade flow** - verify proration details
6. **Payment** - complete upgrade payment
7. **Verification** - check new limits active

---

## 🐛 **Common Issues & Solutions**

### **Issue: "Unauthenticated" Errors**
- **Cause:** Missing or invalid auth token
- **Solution:** Ensure user is logged in and token is valid
- **Check:** Browser dev tools → Application → Local Storage → auth_token

### **Issue: "Plan is not available"**
- **Cause:** Plan ID doesn't exist or is inactive
- **Solution:** Check plan IDs in `/api/plans` response
- **Verify:** Use correct plan IDs (1=Free, 2=Pro, 3=Unlimited)

### **Issue: "User already has an active subscription"**
- **Cause:** User already subscribed to a plan
- **Solution:** Test with different user or cancel existing subscription
- **Check:** Current subscription status via `/api/subscription`

### **Issue: Stripe Checkout Not Loading**
- **Cause:** Invalid Stripe publishable key
- **Solution:** Verify Stripe key is correct and starts with `pk_test_`
- **Check:** Environment variables are loaded correctly

### **Issue: Webhook Not Processing**
- **Cause:** Webhook endpoint not configured or not receiving events
- **Solution:** Check webhook URL in Stripe dashboard
- **Verify:** Webhook events are being sent to backend

---

## 📊 **Test Data & Expected Results**

### **Plans Structure**
```json
[
  {
    "id": 1,
    "name": "Free",
    "price": 0.00,
    "currency": "USD",
    "limit": 20,
    "is_active": true
  },
  {
    "id": 2,
    "name": "Pro", 
    "price": 9.99,
    "currency": "USD",
    "limit": 500,
    "is_active": true
  },
  {
    "id": 3,
    "name": "Unlimited",
    "price": 29.99,
    "currency": "USD", 
    "limit": 10000,
    "is_active": true
  }
]
```

### **Checkout Response**
```json
{
  "checkout_url": "https://checkout.stripe.com/pay/cs_test_...",
  "session_id": "cs_test_..."
}
```

### **Subscription Response**
```json
{
  "id": 25,
  "status": "active",
  "active": true,
  "plan": {
    "id": 2,
    "name": "Pro",
    "price": 9.99,
    "currency": "USD",
    "limit": 500
  },
  "current_usage": 0,
  "usage_reset_date": "2025-11-27T11:42:18.000000Z",
  "starts_at": "2025-10-27T11:42:18.000000Z",
  "ends_at": "2025-11-27T11:42:18.000000Z"
}
```

---

## 🎯 **Testing Scenarios**

### **Happy Path Tests**
- ✅ New user can subscribe to Pro plan
- ✅ New user can subscribe to Unlimited plan  
- ✅ Existing user can upgrade plan
- ✅ Payment success redirects correctly
- ✅ Subscription status updates immediately
- ✅ Usage limits are applied correctly

### **Error Handling Tests**
- ✅ Invalid plan ID returns error
- ✅ Unauthenticated requests are rejected
- ✅ Payment cancellation works
- ✅ Network errors are handled gracefully
- ✅ Stripe API errors are caught

### **Edge Cases**
- ✅ User with existing subscription tries to subscribe again
- ✅ Inactive plan selection
- ✅ Expired auth token handling
- ✅ Webhook processing delays

---

## 🔧 **Debugging Tools**

### **Browser Dev Tools**
- **Network Tab:** Monitor API calls and responses
- **Console:** Check for JavaScript errors
- **Application Tab:** Verify auth tokens and storage

### **Test Page Features**
- **API Status:** Real-time endpoint testing
- **Response Times:** Performance monitoring
- **Error Details:** Detailed error messages
- **Environment Check:** Configuration validation

### **Backend Logs**
- **Laravel Logs:** Check for server-side errors
- **Stripe Dashboard:** Monitor webhook events
- **Database:** Verify subscription records

---

## 🚀 **Production Readiness Checklist**

### **Environment**
- [ ] Switch to live Stripe keys (`pk_live_...`)
- [ ] Update API URLs to production
- [ ] Configure production webhook URLs
- [ ] Set up error monitoring

### **Security**
- [ ] Validate all inputs
- [ ] Implement rate limiting
- [ ] Use HTTPS in production
- [ ] Sanitize user data

### **Performance**
- [ ] Implement caching
- [ ] Optimize API calls
- [ ] Add loading states
- [ ] Monitor response times

### **Monitoring**
- [ ] Set up error tracking
- [ ] Monitor payment success rates
- [ ] Track subscription metrics
- [ ] Alert on critical failures

---

## 📞 **Support & Troubleshooting**

### **If Tests Fail**
1. **Check environment variables** are set correctly
2. **Verify backend is running** on port 8000
3. **Check authentication** - ensure user is logged in
4. **Review browser console** for JavaScript errors
5. **Check network tab** for API call failures

### **If Stripe Issues**
1. **Verify Stripe key** is correct and active
2. **Check webhook configuration** in Stripe dashboard
3. **Test with Stripe test cards** (4242 4242 4242 4242)
4. **Review Stripe logs** for API errors

### **If Backend Issues**
1. **Check Laravel logs** for server errors
2. **Verify database connection** and migrations
3. **Test API endpoints** directly with curl/Postman
4. **Check webhook processing** and event handling

This comprehensive testing guide should help you verify that your Stripe subscription system is working correctly end-to-end!

