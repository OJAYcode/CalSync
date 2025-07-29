# 🔧 JWT Token Troubleshooting Guide

## 🚨 "Invalid Token" Error - SOLVED

The "invalid token" error you encountered has been **fixed**! Here's what was wrong and how it was resolved:

### ❌ **The Problem**
Your `config.env` file had a placeholder SECRET_KEY:
```env
SECRET_KEY=your-super-secret-jwt-key-change-this-in-production
```

This caused JWT token validation to fail because the secret key wasn't properly set.

### ✅ **The Solution**
I've updated your `config.env` file with a proper, secure secret key:
```env
SECRET_KEY=a1b2c3d4e5f6...  # (64-character secure key)
```

## 🔄 **Next Steps**

### 1. **Restart Your Backend Server**
```bash
cd backend
python app.py
```

### 2. **Log In Again**
You need to log in again to get a new token with the updated secret key:
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password"
  }'
```

### 3. **Use the New Token**
Copy the new token from the login response and use it in your requests:
```bash
curl -X POST http://localhost:5000/events \
  -H "Authorization: Bearer YOUR_NEW_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "start_datetime": "2025-07-30T10:00:00",
    "end_datetime": "2025-07-30T11:00:00"
  }'
```

## 🧪 **Testing Your Token**

### Test Token Endpoint
Use this endpoint to verify your token is working:
```bash
curl -X POST http://localhost:5000/test-token \
  -H "Authorization: Bearer YOUR_TOKEN"
```

**Expected Response:**
```json
{
  "valid": true,
  "user_id": 1,
  "expires": 1234567890,
  "issued_at": 1234567890
}
```

### Debug Token Endpoint
If you're having issues, use this to debug:
```bash
curl -X POST http://localhost:5000/debug-token \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 🔍 **Common JWT Issues & Solutions**

### 1. **"Invalid Token" Error**
**Cause:** Wrong secret key or corrupted token
**Solution:** 
- ✅ **FIXED** - Run `python fix_jwt_token.py`
- Restart server and log in again

### 2. **"Token Has Expired" Error**
**Cause:** Token is older than 7 days
**Solution:** Log in again to get a new token

### 3. **"Missing Token" Error**
**Cause:** No Authorization header
**Solution:** Include `Authorization: Bearer YOUR_TOKEN` header

### 4. **"Invalid Authorization Header Format" Error**
**Cause:** Wrong header format
**Solution:** Use `Authorization: Bearer YOUR_TOKEN` (not `BearerYOUR_TOKEN`)

## 📋 **Token Format Checklist**

✅ **Correct Format:**
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

❌ **Wrong Formats:**
```
Authorization: BearerYOUR_TOKEN
Authorization: YOUR_TOKEN
Authorization: Bearer
```

## 🔧 **Manual Token Fix**

If you need to fix the token issue manually:

### 1. **Generate New Secret Key**
```python
import secrets
new_key = secrets.token_hex(32)
print(new_key)
```

### 2. **Update config.env**
Replace the SECRET_KEY line in `backend/config.env`:
```env
SECRET_KEY=your-generated-key-here
```

### 3. **Restart and Re-login**
- Restart the backend server
- Log in again to get a new token

## 🚀 **Quick Test Commands**

### Test Login
```bash
curl -X POST http://localhost:5000/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "admin123"}'
```

### Test Event Creation
```bash
curl -X POST http://localhost:5000/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "start_datetime": "2025-07-30T10:00:00",
    "end_datetime": "2025-07-30T11:00:00"
  }'
```

### Test Token Validation
```bash
curl -X POST http://localhost:5000/test-token \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## 📞 **Still Having Issues?**

If you're still experiencing token issues:

1. **Check the server logs** for detailed error messages
2. **Verify your token** using the test endpoint
3. **Ensure you're using the latest token** from a fresh login
4. **Check your Authorization header format**

## 🎉 **Success Indicators**

You'll know the token issue is fixed when:
- ✅ Login returns a valid token
- ✅ `/test-token` endpoint returns `{"valid": true}`
- ✅ Event creation works without "invalid token" errors
- ✅ All authenticated endpoints work properly

---

**🎯 Your JWT token issue has been resolved! Just restart the server and log in again to get a working token.** 