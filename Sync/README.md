# Calendar Sync Application

A comprehensive organizational calendar syncing application built with React.js frontend and Python Flask backend. This application allows organizations to manage events, sync calendars across all employees, and send automated notifications.

## Features

### 🔐 Authentication & Authorization

- **Multi-role system**: Admin, Event Creator, Employee
- **Secure JWT authentication** with token refresh
- **Role-based access control** for different features
- **User registration** with email validation
- **Password security** with hashing and validation

### 👥 User Management

- **Admin dashboard** for user management
- **Event creator permission system** (limited number of creators)
- **Department-based organization**
- **User profile management**
- **Account activation/deactivation**

### 📅 Calendar System (Coming Soon)

- **Organization-wide events**
- **Department-specific events**
- **Recurring events support**
- **Event creation and management**
- **Real-time calendar synchronization**

### 🔔 Notification System (Coming Soon)

- **Email notifications** for upcoming events
- **Push notifications** (web-based)
- **Customizable notification preferences**
- **Automated reminders** before events
- **Real-time event updates**

## Tech Stack

### Frontend

- **React 19** with hooks
- **React Router 6** for routing
- **React Query** for data fetching and caching
- **React Hook Form** for form handling
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API calls

### Backend

- **Python 3.8+**
- **Flask** web framework
- **SQLAlchemy** ORM
- **JWT Extended** for authentication
- **Flask-CORS** for cross-origin requests
- **APScheduler** for background tasks
- **Bcrypt** for password hashing

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Python 3.8+
- Git

### Backend Setup

1. **Navigate to backend directory**

   ```bash
   cd backend
   ```

2. **Create virtual environment**

   ```bash
   python -m venv venv
   ```

3. **Activate virtual environment**

   ```bash
   # Windows
   venv\Scripts\activate
   # Linux/Mac
   source venv/bin/activate
   ```

4. **Install dependencies**

   ```bash
   pip install -r requirements.txt
   ```

5. **Set up environment variables**

   ```bash
   cp .env.example .env
   # Edit .env with your configurations
   ```

6. **Run the backend**
   ```bash
   python app.py
   ```

The backend will be available at `http://localhost:5000`

### Frontend Setup

1. **Navigate to frontend directory**

   ```bash
   cd Sync
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

The frontend will be available at `http://localhost:5173`

## User Roles & Permissions

### 🏛️ Admin

- **Full system access**
- Create and manage all events
- Manage users and their permissions
- View admin dashboard and statistics
- Approve/reject event creator requests
- Access to all system features

**Default Admin Account:**

- Email: `admin@company.com`
- Password: `admin123` (⚠️ Change after first login!)

### 📝 Event Creator

- **Limited event creation access** (configurable limit)
- Create organization-wide events
- Manage their own events
- View all events and calendars
- Receive all event notifications
- Request additional permissions

### 👤 Employee

- **Basic access level**
- View all organization events
- Receive event notifications
- Update personal preferences
- Request event creation permissions
- Department-specific event visibility

## API Endpoints

### Authentication

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh JWT token
- `GET /api/auth/me` - Get current user info
- `PUT /api/auth/me` - Update user profile
- `POST /api/auth/change-password` - Change password

### Admin (Admin only)

- `GET /api/admin/users` - Get all users with pagination
- `PUT /api/admin/users/<id>` - Update user information
- `POST /api/admin/users/<id>/toggle-status` - Activate/deactivate user
- `GET /api/admin/event-creator-requests` - Get creator requests
- `POST /api/admin/event-creator-requests/<id>/approve` - Approve request
- `POST /api/admin/event-creator-requests/<id>/reject` - Reject request
- `POST /api/admin/users/<id>/revoke-event-permission` - Revoke permissions
- `GET /api/admin/stats` - Get dashboard statistics

## Configuration

### Environment Variables

**Backend (.env)**

```env
FLASK_ENV=development
SECRET_KEY=your-super-secret-key
JWT_SECRET_KEY=your-jwt-secret-key
DATABASE_URL=sqlite:///calendar_app.db
REDIS_URL=redis://localhost:6379/0
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-password
MAX_EVENT_CREATORS=5
```

**Frontend (.env)**

```env
VITE_API_BASE_URL=http://localhost:5000
```

## Database Schema

### Users Table

- Authentication and profile information
- Role-based permissions
- Department assignments
- Notification preferences

### Events Table

- Event details and scheduling
- Organization/department scope
- Notification settings
- Recurrence rules

### Notifications Table

- Scheduled notifications
- Delivery tracking
- User preferences

### Event Creator Requests Table

- Permission request management
- Approval workflow
- Request tracking

## Development

### Code Structure

```
CalendarApp/
├── backend/
│   ├── app.py              # Flask application
│   ├── config.py           # Configuration
│   ├── models.py           # Database models
│   ├── schemas.py          # Validation schemas
│   ├── extensions.py       # Flask extensions
│   └── routes/
│       ├── auth.py         # Authentication routes
│       └── admin.py        # Admin routes
└── Sync/
    ├── src/
    │   ├── components/     # React components
    │   ├── AuthContext.jsx # Authentication context
    │   ├── api.js          # API client
    │   └── App.jsx         # Main app component
    └── public/
```

### Available Scripts

**Frontend**

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

**Backend**

- `python app.py` - Start development server
- `flask db migrate` - Create database migration
- `flask db upgrade` - Apply database migrations

## Upcoming Features

### 📅 Calendar Features

- [ ] Full calendar view with month/week/day layouts
- [ ] Event creation and editing interface
- [ ] Recurring events with advanced patterns
- [ ] Event categories and color coding
- [ ] Import/export calendar functionality

### 🔔 Advanced Notifications

- [ ] Email templates and customization
- [ ] SMS notifications integration
- [ ] Slack/Teams integration
- [ ] Notification scheduling options
- [ ] Digest notifications

### 👥 Team Collaboration

- [ ] Event invitations and RSVPs
- [ ] Meeting room booking
- [ ] Resource scheduling
- [ ] Team availability views
- [ ] Calendar sharing permissions

### 📊 Analytics & Reporting

- [ ] Event attendance tracking
- [ ] Usage analytics dashboard
- [ ] Custom reports generation
- [ ] Export capabilities
- [ ] Performance metrics

### 🔧 System Enhancements

- [ ] Multi-tenant support
- [ ] Advanced search and filtering
- [ ] Bulk operations
- [ ] API rate limiting
- [ ] Audit logging

## Contributing

1. **Fork the repository**
2. **Create a feature branch** (`git checkout -b feature/amazing-feature`)
3. **Commit your changes** (`git commit -m 'Add amazing feature'`)
4. **Push to the branch** (`git push origin feature/amazing-feature`)
5. **Open a Pull Request**

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Security

- **JWT tokens** with configurable expiration
- **Password hashing** using bcrypt
- **CORS protection** for cross-origin requests
- **Input validation** on all endpoints
- **Role-based access control** for sensitive operations

## Support

For support and questions:

- 📧 Email: support@company.com
- 📝 Issues: GitHub Issues
- 📚 Documentation: This README

---

**⚠️ Important Security Notes:**

1. Change default admin credentials after setup
2. Use strong secret keys in production
3. Configure proper email settings for notifications
4. Set up Redis for production notifications
5. Use HTTPS in production environment+ Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
