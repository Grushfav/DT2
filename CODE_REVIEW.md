# Code Review - BT2 Horizon Prototype

**Date:** 2024  
**Reviewer:** AI Code Review  
**Project:** BT2 Horizon Travel Booking Platform

## Executive Summary

This is a React + Express.js travel booking platform with Supabase backend. The codebase is functional but has several security concerns, code quality issues, and areas for improvement. Overall architecture is reasonable, but production readiness requires addressing critical security vulnerabilities.

---

## 🔴 Critical Security Issues

### 1. **Weak Default JWT Secret**
**Location:** `server/auth.js:5`
```javascript
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production'
```
**Issue:** Default secret is hardcoded and predictable. If `.env` is missing, tokens can be forged.  
**Risk:** Authentication bypass, privilege escalation  
**Fix:** Remove default, require JWT_SECRET in environment:
```javascript
const JWT_SECRET = process.env.JWT_SECRET
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET environment variable is required')
}
```

### 2. **Weak Default Admin Key**
**Location:** `server/index.js:22`
```javascript
const ADMIN_KEY = process.env.ADMIN_KEY || 'secret-admin-key'
```
**Issue:** Default admin key is predictable and weak.  
**Risk:** Unauthorized admin access  
**Fix:** Require ADMIN_KEY in environment, use strong random key in production.

### 3. **No Input Sanitization**
**Location:** Throughout `server/index.js`  
**Issue:** User inputs are not sanitized before database operations. Text fields could contain SQL injection attempts (though Supabase uses parameterized queries, still risky).  
**Risk:** XSS, data corruption  
**Fix:** Add input validation/sanitization library (e.g., `validator.js`, `joi`):
```javascript
const validator = require('validator')
// Sanitize text inputs
const sanitizedTitle = validator.escape(req.body.title)
```

### 4. **CORS Configuration Too Permissive**
**Location:** `server/index.js:24`
```javascript
app.use(cors())
```
**Issue:** Allows all origins.  
**Risk:** CSRF attacks, unauthorized API access  
**Fix:** Configure allowed origins:
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}))
```

### 5. **Socket.IO CORS Too Permissive**
**Location:** `server/index.js:539-544`
```javascript
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
})
```
**Issue:** Allows all origins for WebSocket connections.  
**Risk:** Unauthorized chat access  
**Fix:** Restrict to frontend origin.

### 6. **Password Storage**
**Status:** ✅ Good - Uses bcrypt with salt rounds (10)  
**Location:** `server/auth.js:7-8`

### 7. **No Rate Limiting**
**Issue:** No rate limiting on authentication endpoints or API routes.  
**Risk:** Brute force attacks, DDoS  
**Fix:** Add `express-rate-limit`:
```javascript
const rateLimit = require('express-rate-limit')
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5 // 5 attempts
})
app.post('/api/auth/login', authLimiter, ...)
```

### 8. **Sensitive Data in Logs**
**Location:** Multiple places in `server/index.js`  
**Issue:** Logs may contain user data, email addresses, etc.  
**Risk:** Privacy violations, GDPR issues  
**Fix:** Remove or redact sensitive data from logs.

---

## 🟡 Security Concerns

### 9. **No HTTPS Enforcement**
**Issue:** No mention of HTTPS in production.  
**Risk:** Man-in-the-middle attacks  
**Fix:** Use HTTPS in production, enforce with middleware.

### 10. **Token Storage in localStorage**
**Location:** `src/contexts/AuthContext.jsx:10, 71, 96`  
**Issue:** JWT tokens stored in localStorage are vulnerable to XSS.  
**Risk:** Token theft  
**Fix:** Consider httpOnly cookies (requires backend changes) or ensure XSS protection.

### 11. **No CSRF Protection**
**Issue:** No CSRF tokens for state-changing operations.  
**Risk:** CSRF attacks  
**Fix:** Add CSRF protection middleware.

### 12. **Email Credentials in Environment**
**Status:** ✅ Good - Using environment variables  
**Note:** Ensure `.env` is never committed (check `.gitignore`).

---

## 🟠 Code Quality Issues

### 13. **Inconsistent Error Handling**
**Location:** Throughout codebase  
**Issue:** Some endpoints return generic errors, others provide detailed messages.  
**Example:** `server/index.js:103` vs `server/index.js:651`  
**Fix:** Standardize error responses, use error handling middleware.

### 14. **Missing Input Validation**
**Location:** Multiple endpoints  
**Issue:** Many endpoints don't validate required fields or data types.  
**Example:** `server/index.js:558` - `name` and `phone` checked, but no format validation  
**Fix:** Add validation middleware (e.g., `express-validator`):
```javascript
const { body, validationResult } = require('express-validator')
app.post('/api/leads', [
  body('name').trim().isLength({ min: 1, max: 100 }),
  body('phone').matches(/^\+?[\d\s-()]+$/),
  body('email').optional().isEmail()
], async (req, res) => {
  const errors = validationResult(req)
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }
  // ...
})
```

### 15. **Code Duplication**
**Issue:** API_BASE constant repeated in many components  
**Location:** Multiple files in `src/components/`  
**Fix:** Create a shared config file:
```javascript
// src/config/api.js
export const API_BASE = import.meta.env.VITE_API_BASE || 'http://localhost:4000'
```

### 16. **Inconsistent Async/Await**
**Location:** Mixed usage of promises and async/await  
**Example:** `src/components/CrazyDealBadge.jsx:14-31` uses `.then()`, while `src/components/Packages.jsx` uses async/await  
**Fix:** Standardize on async/await for consistency.

### 17. **Missing Error Boundaries**
**Issue:** No React error boundaries to catch component errors.  
**Risk:** Entire app crashes on component error  
**Fix:** Add error boundary component.

### 18. **Console Statements in Production Code**
**Location:** 49+ console.log/error/warn statements in `src/`  
**Issue:** Debug statements should be removed or use a logging library.  
**Fix:** Use a logging library (e.g., `winston`, `pino`) with environment-based levels.

### 19. **Magic Numbers and Strings**
**Issue:** Hardcoded values throughout codebase  
**Example:** `server/index.js:464` - `10 * 1024 * 1024` (file size limit)  
**Fix:** Extract to constants/config.

### 20. **No TypeScript**
**Issue:** JavaScript without type checking increases bug risk.  
**Fix:** Consider migrating to TypeScript for better type safety.

---

## 🟢 Architecture & Design

### 21. **Good Separation of Concerns**
✅ Backend (`server/`) and frontend (`src/`) are well separated.

### 22. **Database Abstraction**
✅ Good use of `db.js` module for database operations.

### 23. **Context API Usage**
✅ Proper use of React Context for authentication.

### 24. **Missing API Client Layer**
**Issue:** Direct `fetch` calls scattered throughout components.  
**Fix:** Create a centralized API client:
```javascript
// src/utils/api.js
class ApiClient {
  constructor(baseURL) {
    this.baseURL = baseURL
  }
  
  async request(endpoint, options = {}) {
    const token = localStorage.getItem('auth_token')
    const headers = {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers
    }
    
    const response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers
    })
    
    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`)
    }
    
    return response.json()
  }
}
```

### 25. **Large Server File**
**Issue:** `server/index.js` is 1940 lines - too large.  
**Fix:** Split into route modules:
```
server/
  routes/
    auth.js
    packages.js
    requests.js
    chat.js
    ...
```

---

## 🐛 Potential Bugs

### 26. **Race Condition in AuthContext**
**Location:** `src/contexts/AuthContext.jsx:12-21`  
**Issue:** `useEffect` dependency array is empty but uses `token` state.  
**Fix:** Add proper dependencies or use `useCallback`.

### 27. **Memory Leak Risk**
**Location:** `src/components/CrazyDealBadge.jsx:33`  
**Issue:** `mounted = false` assignment in cleanup may not work as intended.  
**Fix:** Use `useRef`:
```javascript
const mountedRef = useRef(true)
useEffect(() => {
  return () => { mountedRef.current = false }
}, [])
```

### 28. **No Validation for File Uploads**
**Location:** `server/index.js:468`  
**Issue:** File type not validated, only size.  
**Risk:** Malicious file uploads  
**Fix:** Validate file MIME types:
```javascript
const allowedTypes = ['image/jpeg', 'image/png', 'image/webp']
if (!allowedTypes.includes(req.file.mimetype)) {
  return res.status(400).json({ error: 'Invalid file type' })
}
```

### 29. **Date Parsing Without Validation**
**Location:** Multiple places  
**Issue:** Dates parsed without validation (e.g., `server/index.js:193`)  
**Fix:** Validate date formats before parsing.

### 30. **Missing Transaction Handling**
**Issue:** Multi-step database operations (e.g., trip join) not wrapped in transactions.  
**Risk:** Data inconsistency on partial failures  
**Fix:** Use database transactions where appropriate.

---

## 📋 Best Practices

### 31. **Environment Variables**
✅ Good use of environment variables for configuration.

### 32. **Error Messages**
⚠️ Some error messages expose internal details (e.g., database errors).  
**Fix:** Return generic messages to users, log detailed errors server-side.

### 33. **API Versioning**
**Issue:** No API versioning (`/api/v1/...`).  
**Fix:** Add versioning for future compatibility.

### 34. **Documentation**
✅ Good README files, but missing API documentation.  
**Fix:** Add OpenAPI/Swagger documentation.

### 35. **Testing**
**Issue:** Only one test file found (`CountrySelect.test.jsx`).  
**Fix:** Add comprehensive test coverage:
- Unit tests for utilities
- Integration tests for API endpoints
- E2E tests for critical flows

---

## 🔧 Recommendations

### Immediate Actions (Before Production)
1. ✅ Fix critical security issues (#1-8)
2. ✅ Add input validation (#14)
3. ✅ Configure proper CORS (#4, #5)
4. ✅ Add rate limiting (#7)
5. ✅ Remove console statements or use logging library (#18)

### Short-term Improvements
1. ✅ Refactor large server file (#25)
2. ✅ Create API client layer (#24)
3. ✅ Add error boundaries (#17)
4. ✅ Standardize error handling (#13)
5. ✅ Add comprehensive tests (#35)

### Long-term Enhancements
1. ✅ Migrate to TypeScript (#20)
2. ✅ Add API versioning (#33)
3. ✅ Implement proper logging (#18)
4. ✅ Add monitoring and alerting
5. ✅ Performance optimization (caching, database indexes)

---

## 📊 Code Metrics

- **Total Files Reviewed:** ~50+
- **Lines of Code:** ~10,000+
- **Security Issues:** 12 (8 critical, 4 concerns)
- **Code Quality Issues:** 8
- **Potential Bugs:** 5
- **Test Coverage:** <5%

---

## ✅ Positive Aspects

1. ✅ Good use of modern React patterns (hooks, context)
2. ✅ Proper password hashing with bcrypt
3. ✅ Environment-based configuration
4. ✅ Clear project structure
5. ✅ Good documentation in README files
6. ✅ Proper use of Supabase for database
7. ✅ Socket.IO for real-time features
8. ✅ Email notifications implemented

---

## 📝 Summary

The codebase is functional and shows good understanding of modern web development practices. However, **critical security vulnerabilities must be addressed before production deployment**. The main areas of concern are:

1. **Security:** Weak defaults, no input validation, permissive CORS
2. **Code Quality:** Large files, duplication, inconsistent patterns
3. **Testing:** Minimal test coverage
4. **Production Readiness:** Missing rate limiting, error handling, monitoring

**Priority:** Address all 🔴 Critical Security Issues before any production deployment.

---

## Next Steps

1. Create a prioritized task list from this review
2. Set up a staging environment for testing fixes
3. Implement security fixes first
4. Add tests as you fix issues
5. Consider a security audit before production launch

