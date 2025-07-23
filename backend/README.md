# Calendar Sync App - Backend

A Python Flask backend for the organizational calendar syncing application.

## Features

- User authentication and authorization with JWT
- Role-based access control (Admin, Event Creator, Employee)
- User registration and login
- Admin dashboard for user management
- Event creator permission system
- Database models for users, events, and notifications
- RESTful API endpoints

## Setup

1. Create a virtual environment:

```bash
python -m venv venv
```

2. Activate the virtual environment:

```bash
# Windows
venv\Scripts\activate
# Linux/Mac
source venv/bin/activate
```

3. Install dependencies:

```bash
pip install -r requirements.txt
```

4. Set up environment variables:

```bash
cp .env.example .env
# Edit .env with your configurations
```

5. Run the application:

```bash
python app.py
```

The server will start on `http://localhost:5000`

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password

### Admin (Admin only)

- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/<id>` - Update user
- `POST /api/admin/users/<id>/toggle-status` - Activate/deactivate user
- `GET /api/admin/event-creator-requests` - Get creator requests
- `POST /api/admin/event-creator-requests/<id>/approve` - Approve request
- `POST /api/admin/event-creator-requests/<id>/reject` - Reject request
- `POST /api/admin/users/<id>/revoke-event-permission` - Revoke permissions
- `GET /api/admin/stats` - Get dashboard statistics

## Default Admin Account

Email: admin@company.com
Password: admin123

**Important:** Change the default admin password after first login!

## User Roles

1. **Admin**: Full system access, can manage users and events
2. **Event Creator**: Can create and manage events (limited number)
3. **Employee**: Can view events and receive notifications

## Database Schema

- **Users**: Authentication, roles, and preferences
- **Events**: Calendar events with organization-wide or department-specific scope
- **Notifications**: Event reminders and system notifications
- **EventCreatorRequests**: Requests for event creation permissions
