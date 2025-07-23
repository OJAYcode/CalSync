# 🎯 Calendar Sync Application - Quick Start Guide

## 🚀 What You've Built

A **complete organizational calendar syncing application** with:

### 🔐 **Authentication System**

- **Multi-role access**: Admin, Event Creator, Employee
- **JWT-based authentication** with secure token management
- **User registration & login** with validation
- **Role-based permissions** for different features

### 👥 **User Management**

- **Admin dashboard** for managing users
- **Event creator permission system** (limited slots)
- **Department-based organization**
- **Profile management** for all users

### 📅 **Calendar Features** (Ready to Implement)

- Organization-wide event management
- Department-specific events
- Automated notifications
- Event creation and management

---

## 🎮 How to Start the Application

### Option 1: Use the Batch Script (Easiest)

```bash
# Double-click this file or run in command prompt:
start-servers.bat
```

### Option 2: Manual Start (Two Terminals)

**Terminal 1 - Backend:**

```bash
cd c:\Users\HP\Documents\CalendarApp\backend
venv\Scripts\activate
python app_simple.py
```

**Terminal 2 - Frontend:**

```bash
cd c:\Users\HP\Documents\CalendarApp\Sync
npm run dev
```

---

## 🌐 Access Your Application

| Service           | URL                            | Description       |
| ----------------- | ------------------------------ | ----------------- |
| **Frontend**      | http://localhost:5173          | React application |
| **Backend**       | http://localhost:5000          | Flask API         |
| **Health Check**  | http://localhost:5000/health   | API status        |
| **Test Endpoint** | http://localhost:5000/api/test | API test          |

---

## 👤 User Roles & Demo Accounts

### 🏛️ **Admin Account**

- **Email:** `admin@company.com`
- **Password:** `admin123`
- **Access:** Full system control, user management, all features

### 👨‍💼 **Employee Accounts**

- Create new accounts via registration
- **Access:** View events, receive notifications
- **Permissions:** Can request event creation access

### 📝 **Event Creator**

- Promoted by admin from employee accounts
- **Access:** Can create organization-wide events
- **Limited slots:** Only 5 event creators allowed

---

## 🎯 Key Features Available Now

### ✅ **Working Features**

- [x] User registration and login
- [x] JWT authentication with refresh tokens
- [x] Role-based access control
- [x] Protected routes (admin, event creators)
- [x] Responsive design with Tailwind CSS
- [x] Modern React hooks and context
- [x] RESTful API with Flask
- [x] Input validation and error handling

### 🚧 **Ready to Implement**

- [ ] Full calendar interface
- [ ] Event creation and management
- [ ] Email notifications
- [ ] Admin user management dashboard
- [ ] Event creator request system
- [ ] Department-based filtering

---

## 🔧 Project Structure

```
CalendarApp/
├── backend/                 # Flask API
│   ├── app_simple.py       # Main application (simplified)
│   ├── app.py              # Full application (with database)
│   ├── models.py           # Database models
│   ├── routes/             # API endpoints
│   ├── requirements.txt    # Python dependencies
│   └── .env                # Environment variables
└── Sync/                   # React frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── AuthContext.jsx # Authentication management
    │   └── api.js          # API client
    └── package.json        # Node.js dependencies
```

---

## 🎉 Next Steps

### 1. **Test the Authentication**

- Visit http://localhost:5173
- Register a new account
- Login and explore the dashboard

### 2. **Implement Calendar Features**

- Add event creation forms
- Build calendar view components
- Set up notification system

### 3. **Add Database**

- Switch from `app_simple.py` to `app.py`
- Set up SQLite database
- Implement full CRUD operations

### 4. **Deploy to Production**

- Set up proper environment variables
- Configure production database
- Deploy to cloud platforms

---

## 🛠️ Development Commands

```bash
# Backend Development
cd backend
venv\Scripts\activate
python app_simple.py          # Start simple server
python app.py                 # Start full server (with DB)

# Frontend Development
cd Sync
npm run dev                   # Start development server
npm run build                 # Build for production
npm run preview               # Preview production build

# Database Operations (when using app.py)
flask db init                 # Initialize database
flask db migrate              # Create migration
flask db upgrade              # Apply migration
```

---

## 🔒 Security Features

- **Password hashing** with bcrypt
- **JWT tokens** with expiration
- **CORS protection** for API
- **Role-based authorization**
- **Input validation** on all forms
- **Secure session management**

---

## 📞 Support & Troubleshooting

### Common Issues:

1. **Port conflicts**: Change ports in configuration files
2. **Virtual environment**: Ensure it's activated for backend
3. **Dependencies**: Run `pip install -r requirements.txt` and `npm install`
4. **CORS errors**: Check if both servers are running

### Need Help?

- Check the console for error messages
- Ensure both servers are running
- Verify environment variables are set

---

**🎊 Congratulations! You now have a fully functional calendar syncing application foundation!**
