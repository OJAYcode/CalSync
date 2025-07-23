## 🔧 Network Error Troubleshooting Guide

Since you're getting "Network Error" when creating events, let's debug step by step:

### Step 1: Test Backend Connection

Open a new command prompt and test the backend:

```cmd
curl http://localhost:5000/api/events/test
```

OR in your current terminal:

```cmd
python -c "import requests; print(requests.get('http://localhost:5000/api/events/test').json())"
```

### Step 2: Restart Backend (Important!)

The CORS configuration was updated, so you need to restart the backend:

1. **Stop the current backend** (Ctrl+C in the terminal where it's running)
2. **Restart it:**
   ```cmd
   cd c:\Users\HP\Documents\CalendarApp\backend
   python app.py
   ```

### Step 3: Check Browser Console

1. Open your React app in the browser
2. Open Developer Tools (F12)
3. Go to the Console tab
4. Try to create an event
5. Look for the debug messages:
   - "=== DEBUG INFO ==="
   - API Base URL
   - Token exists
   - Any error messages

### Step 4: Common Issues & Solutions

**Issue: CORS Error**

- Solution: Make sure backend is restarted after CORS update

**Issue: 401 Unauthorized**

- Solution: Try logging out and logging back in

**Issue: Token Issues**

- Check if you're logged in properly
- Try refreshing the page

**Issue: Wrong URL**

- The API should call `/api/events` (which I've fixed)

### Step 5: Manual Test

If all else fails, test the API directly:

```javascript
// Open browser console on your React app and run:
fetch("http://localhost:5000/api/events/test")
  .then((r) => r.json())
  .then((data) => console.log("Backend test:", data))
  .catch((e) => console.error("Error:", e));
```

Try these steps and let me know what you see in the console!
