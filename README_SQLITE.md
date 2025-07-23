# Calendar Sync App - SQLite Configuration

A full-stack calendar synchronization application with Python Flask backend (SQLite) and React frontend.

## 🗄️ Database: SQLite Configuration

This project is configured to use **SQLite** as the database, which is perfect for development and small to medium deployments. No additional database server setup is required!

### Database Features

- ✅ **Zero Configuration**: SQLite works out of the box
- ✅ **File-Based**: Database stored in `backend/calendar_app.db`
- ✅ **Auto-Creation**: Database and tables created automatically
- ✅ **Sample Data**: Pre-loaded with admin user and sample events
- ✅ **Backup Support**: Easy database backup functionality

## 🚀 Quick Start

### Prerequisites

- Python 3.7+
- Node.js 16+
- npm or yarn

### Backend Setup (SQLite)

1. **Navigate to backend directory**:

   ```bash
   cd backend
   ```

2. **Run the startup script** (Windows):

   ```bash
   start_backend.bat
   ```

   Or manually:

   ```bash
   # Create virtual environment
   python -m venv .venv
   .venv\Scripts\activate

   # Install dependencies
   pip install -r requirements.txt

   # Initialize database
   python scripts/init_db.py

   # Start server
   python app.py
   ```

3. **Backend will be running on**: `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**:

   ```bash
   cd Sync
   ```

2. **Install dependencies**:

   ```bash
   npm install
   ```

3. **Start development server**:

   ```bash
   npm run dev
   ```

4. **Frontend will be running on**: `http://localhost:5173`

## 🔑 Default Login Credentials

After initialization, you can login with these accounts:

| Role              | Email                  | Password    | Permissions                                     |
| ----------------- | ---------------------- | ----------- | ----------------------------------------------- |
| **Admin**         | admin@company.com      | admin123    | Full system access, create events, manage users |
| **Event Creator** | john.doe@company.com   | password123 | Create events, view all events                  |
| **Employee**      | jane.smith@company.com | password123 | View events, receive notifications              |
| **Employee**      | bob.wilson@company.com | password123 | View events, receive notifications              |

## 🛠️ Database Management

### Database Scripts

Located in `backend/scripts/`:

#### Initialize Database

```bash
python scripts/init_db.py
```

- Creates all tables
- Adds default admin user
- Adds sample users and events

#### Database Manager

```bash
# Show database information
python scripts/db_manager.py info

# List all users
python scripts/db_manager.py users

# List all events
python scripts/db_manager.py events

# Create admin user
python scripts/db_manager.py admin

# Backup database
python scripts/db_manager.py backup

# Reset database (WARNING: Deletes all data)
python scripts/db_manager.py reset
```

### Database Location

- **File**: `backend/calendar_app.db`
- **Backups**: `backend/calendar_app.db.backup_YYYYMMDD_HHMMSS`

## 📊 Database Schema

### Users Table

- Authentication and role management
- Departments and permissions
- Email notification preferences

### Events Table

- Event details and scheduling
- Organization-wide or department-specific
- All-day and timed events
- Recurrence rules support

### Notifications Table

- Scheduled event reminders
- Email and push notifications
- Customizable timing

## 🌟 Key Features

### Admin Features

- ✅ Create and manage all organization events
- ✅ User management and role assignments
- ✅ Approve event creator requests
- ✅ Full system administration

### Event Creator Features

- ✅ Create organization-wide events
- ✅ Create department-specific events
- ✅ Manage own events
- ✅ Event notifications and reminders

### Employee Features

- ✅ View all accessible events
- ✅ Receive event notifications
- ✅ Request event creation permissions
- ✅ Update personal preferences

### System Features

- ✅ **Congratulatory Messages**: Success modals after event creation
- ✅ **Cross-User Visibility**: Events instantly visible to all users
- ✅ **Role-Based Access**: Admin, Event Creator, Employee roles
- ✅ **Department Targeting**: Events can target specific departments
- ✅ **Real-Time Updates**: Events appear immediately after creation
- ✅ **Responsive Design**: Works on desktop and mobile

## 🔧 Configuration

### Environment Variables (Optional)

Create `.env` file in backend directory:

```env
SECRET_KEY=your-secret-key-here
JWT_SECRET_KEY=your-jwt-secret-here
DATABASE_URL=sqlite:///calendar_app.db
FLASK_ENV=development
```

### Production Considerations

For production deployment:

1. Change default passwords
2. Set strong SECRET_KEY and JWT_SECRET_KEY
3. Configure proper email settings for notifications
4. Consider database backups strategy
5. Use proper web server (gunicorn, nginx)

## 🐛 Troubleshooting

### Common Issues

**1. Database Permission Errors**

```bash
# Make sure the backend directory is writable
chmod 755 backend/
```

**2. Module Import Errors**

```bash
# Ensure virtual environment is activated
.venv\Scripts\activate
pip install -r requirements.txt
```

**3. Database Corruption**

```bash
# Reset database
python scripts/db_manager.py reset
python scripts/init_db.py
```

**4. Port Already in Use**

```bash
# Kill process using port 5000
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

## 📝 API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh token

### Events

- `GET /api/events` - Get all accessible events
- `POST /api/events` - Create new event
- `GET /api/events/<id>` - Get specific event
- `PUT /api/events/<id>` - Update event
- `DELETE /api/events/<id>` - Delete event

### Admin

- `GET /api/admin/users` - List all users
- `PUT /api/admin/users/<id>` - Update user
- `DELETE /api/admin/users/<id>` - Delete user

## 📂 Project Structure

```
CalendarApp/
├── backend/                 # Python Flask API
│   ├── app.py              # Main application
│   ├── config.py           # Database & app configuration
│   ├── models.py           # SQLAlchemy models
│   ├── extensions.py       # Flask extensions
│   ├── requirements.txt    # Python dependencies
│   ├── calendar_app.db     # SQLite database file
│   ├── routes/             # API route blueprints
│   └── scripts/            # Database management scripts
└── Sync/                   # React Frontend
    ├── src/
    │   ├── components/     # React components
    │   ├── api.js         # API client
    │   └── AuthContext.jsx # Authentication context
    └── package.json       # Node dependencies
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with SQLite database
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

---

**Need Help?** Check the troubleshooting section or create an issue in the repository.
