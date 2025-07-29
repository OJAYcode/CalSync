#!/usr/bin/env python3
"""
CalSync Backend API
Calendar synchronization application backend
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager, create_access_token, jwt_required, get_jwt_identity
import secrets
from datetime import datetime, timedelta
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv

# Import models and database
import database as db
from users import User
from events import Event
from firebase_service import send_event_reminder_notification
from email_service import send_event_reminder_email

# Load environment variables
load_dotenv('config.env')

app = Flask(__name__)

# JWT Configuration
app.config['JWT_SECRET_KEY'] = os.getenv('SECRET_KEY', 'your_super_secret_key_here_change_this_in_production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(days=7)  # Tokens expire in 7 days
jwt = JWTManager(app)

# Enable CORS for all origins (for production deployment)
CORS(app, origins="*")

# Initialize database
db.init_database()

# Create model instances
user_model = User()
event_model = Event()

def create_notifications_for_event(event_id, start_datetime, reminders):
    """Create notification records for all users for each reminder time (in minutes)"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        users = user_model.get_all_users()
        for reminder in reminders:
            notify_at = (datetime.fromisoformat(start_datetime) - timedelta(minutes=reminder)).isoformat()
            for user in users:
                cursor.execute('''
                    INSERT INTO notifications (event_id, user_id, notify_at, sent)
                    VALUES (?, ?, ?, 0)
                ''', (event_id, user['id'], notify_at))
        conn.commit()
        conn.close()
    except Exception as e:
        print(f"Error creating notifications: {e}")

# Add 'read' column to notifications table if not present
try:
    conn = db.get_connection()
    cursor = conn.cursor()
    cursor.execute("PRAGMA table_info(notifications)")
    columns = [row[1] for row in cursor.fetchall()]
    if 'read' not in columns:
        cursor.execute('ALTER TABLE notifications ADD COLUMN read BOOLEAN DEFAULT 0')
        conn.commit()
    conn.close()
except Exception as e:
    print(f"Could not add 'read' column to notifications: {e}")

def send_due_notifications():
    """Send notifications for events that are due"""
    try:
        now = datetime.now()
        
        # Get all due notifications with user info
        cursor = db.get_connection().cursor()
        cursor.execute('''
            SELECT n.id, n.event_id, n.user_id, n.notify_at, e.title, e.start_datetime, e.description,
                   u.email, u.first_name, u.last_name, u.fcm_token
            FROM notifications n
            JOIN events e ON n.event_id = e.id
            JOIN users u ON n.user_id = u.id
            WHERE n.sent = 0 AND n.notify_at <= ?
        ''', (now,))
        
        notifications = cursor.fetchall()
        
        for notification in notifications:
            notification_id, event_id, user_id, notify_at, title, start_datetime, description, email, first_name, last_name, fcm_token = notification
            
            # Format event time
            event_time = start_datetime.strftime("%B %d, %Y at %I:%M %p")
            user_name = f"{first_name} {last_name}".strip()
            
            # PRIORITY 1: Send Push Notification (Primary)
            success = False
            if fcm_token:
                try:
                    success = send_event_reminder_notification([fcm_token], title, event_time, event_id)
                    if success:
                        print(f"✅ Push notification sent to {user_name} for event: {title}")
                    else:
                        print(f"❌ Failed to send push notification to {user_name}")
                except Exception as e:
                    print(f"❌ Error sending push notification to {user_name}: {e}")
            
            # PRIORITY 2: Send Email Notification (Fallback only if push fails or no FCM token)
            if not fcm_token or not success:
                try:
                    email_success = send_event_reminder_email(email, user_name, title, event_time, description)
                    if email_success:
                        print(f"✅ Email notification sent to {user_name} for event: {title}")
                    else:
                        print(f"❌ Failed to send email notification to {user_name}")
                except Exception as e:
                    print(f"❌ Error sending email notification to {user_name}: {e}")
            
            # Mark notification as sent
            cursor.execute('UPDATE notifications SET sent = 1 WHERE id = ?', (notification_id,))
            db.get_connection().commit()
            
    except Exception as e:
        print(f"❌ Error in send_due_notifications: {e}")

# Start background scheduler
scheduler = BackgroundScheduler()
scheduler.add_job(send_due_notifications, 'interval', minutes=1)
scheduler.start()

# Force database schema and default data initialization on every backend start
db.init_database()

# Authentication Routes
@app.route('/auth/signup', methods=['POST'])
def signup():
    """User signup endpoint"""
    try:
        data = request.get_json()
        result = user_model.create_user(
            email=data['email'],
            password=data['password'],
            first_name=data['first_name'],
            last_name=data['last_name'],
            role=data.get('role', 'employee')
        )
        
        if result['success']:
            return jsonify({'message': 'User created successfully'}), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    """User login endpoint"""
    try:
        data = request.get_json()
        result = user_model.login_user(data['email'], data['password'])
        
        if result['success']:
            # Create JWT token
            access_token = create_access_token(identity=result['user']['id'])
            
            return jsonify({
                'message': 'Login successful',
                'token': access_token,
                'user': result['user']
            }), 200
        else:
            return jsonify({'error': result['error']}), 401
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/logout', methods=['POST'])
def logout():
    """User logout endpoint"""
    try:
        # With JWT, we don't need to store sessions server-side
        # The client just needs to remove the token
        return jsonify({'message': 'Logged out successfully'}), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Event Routes
@app.route('/events', methods=['GET'])
def get_events():
    """Get all events"""
    try:
        events = event_model.get_all_events()
        return jsonify(events), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events', methods=['POST'])
@jwt_required()
def create_event():
    """Create a new event - requires authentication"""
    try:
        # Get user ID from JWT token
        user_id = get_jwt_identity()
        
        # Get user data
        user = user_model.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        data = request.get_json()
        
        # Validate required fields
        required_fields = ['title', 'start_datetime', 'end_datetime']
        for field in required_fields:
            if not data.get(field):
                return jsonify({'error': f'Missing required field: {field}'}), 400
        
        # Create event
        result = event_model.create_event(
            title=data['title'],
            description=data.get('description', ''),
            start_datetime=data['start_datetime'],
            end_datetime=data['end_datetime'],
            created_by=user_id
        )
        
        if result['success']:
            # Handle reminders/notifications
            reminders = data.get('reminders', [15])  # Default: 15 min before
            create_notifications_for_event(result['event_id'], data['start_datetime'], reminders)
            return jsonify(result), 201
        else:
            return jsonify({'error': result['error']}), 400
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['GET'])
def get_event(event_id):
    """Get event by ID"""
    try:
        event = event_model.get_event_by_id(event_id)
        if event:
            return jsonify(event), 200
        else:
            return jsonify({'error': 'Event not found'}), 404
            
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/stats', methods=['GET'])
def get_event_stats():
    """Get event statistics for dashboard"""
    try:
        total_events = event_model.get_events_count()
        today_events = event_model.get_today_events_count()
        return jsonify({
            'total_events': total_events,
            'today_events': today_events,
            'upcoming_events': 0,   # TODO: Implement upcoming events count
            'completed_events': 0   # TODO: Implement completed events count
        }), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/events/<int:event_id>', methods=['DELETE'])
@jwt_required()
def delete_event(event_id):
    """Delete an event by ID (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    try:
        success = event_model.delete_event(event_id)
        if success:
            return jsonify({'message': 'Event deleted successfully'}), 200
        else:
            return jsonify({'error': 'Failed to delete event'}), 500
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# User Routes
@app.route('/users/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get current user information"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        return jsonify(user), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update current user information"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        # Only allow updating certain fields
        allowed_fields = ['first_name', 'last_name', 'department', 'email']
        update_data = {k: v for k, v in data.items() if k in allowed_fields}
        if not update_data:
            return jsonify({'error': 'No valid fields to update'}), 400
        result = user_model.update_user(user['id'], update_data)
        if result['success']:
            # Update session (JWT token is not session, so no direct session update here)
            # The user object returned by get_user_by_id is the current state
            return jsonify({'message': 'Profile updated successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change user password"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        if not user:
            return jsonify({'error': 'User not found'}), 404
        data = request.get_json()
        old_password = data.get('old_password')
        new_password = data.get('new_password')
        if not old_password or not new_password:
            return jsonify({'error': 'Old and new password required'}), 400
        result = user_model.change_password(user['id'], old_password, new_password)
        if result['success']:
            return jsonify({'message': 'Password changed successfully'}), 200
        else:
            return jsonify({'error': result['error']}), 400
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users', methods=['GET'])
@jwt_required()
def get_all_users():
    """Get all users (admin only)"""
    try:
        user_id = get_jwt_identity()
        user = user_model.get_user_by_id(user_id)
        
        if not user:
            return jsonify({'error': 'User not found'}), 404
        
        if user['role'] != 'admin':
            return jsonify({'error': 'Admin access required'}), 403
        
        users = user_model.get_all_users()
        return jsonify(users), 200
        
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Department Management Endpoints
@app.route('/departments', methods=['GET'])
def list_departments():
    """List all departments"""
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('SELECT id, name FROM departments ORDER BY name ASC')
        departments = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(departments), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/departments', methods=['POST'])
@jwt_required()
def add_department():
    """Add a new department (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    name = data.get('name', '').strip()
    if not name:
        return jsonify({'error': 'Department name required'}), 400
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('INSERT INTO departments (name) VALUES (?)', (name,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Department added successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/departments/<int:dept_id>', methods=['DELETE'])
@jwt_required()
def delete_department(dept_id):
    """Delete a department (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user.get('role') != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM departments WHERE id = ?', (dept_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Department deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Department Feed Endpoints
@app.route('/department-feeds', methods=['GET'])
def list_department_feeds():
    """List all department feeds, optionally filter by department"""
    try:
        department = request.args.get('department')
        conn = db.get_connection()
        cursor = conn.cursor()
        if department:
            cursor.execute('SELECT * FROM department_feeds WHERE department = ? ORDER BY created_at DESC', (department,))
        else:
            cursor.execute('SELECT * FROM department_feeds ORDER BY created_at DESC')
        feeds = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(feeds), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/department-feeds', methods=['POST'])
@jwt_required()
def create_department_feed():
    """Create a new department feed (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    data = request.get_json()
    title = data.get('title')
    content = data.get('content')
    department = data.get('department')
    if not title or not content or not department:
        return jsonify({'error': 'Title, content, and department are required'}), 400
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO department_feeds (title, content, department, created_by)
            VALUES (?, ?, ?, ?)
        ''', (title, content, department, user['id']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Feed created successfully'}), 201
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/department-feeds/<int:feed_id>', methods=['DELETE'])
@jwt_required()
def delete_department_feed(feed_id):
    """Delete a department feed (admin only)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user or user['role'] != 'admin':
        return jsonify({'error': 'Admin access required'}), 403
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('DELETE FROM department_feeds WHERE id = ?', (feed_id,))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Feed deleted successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# Health check
@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'database': 'sqlite',
        'message': 'Calendar App API is running'
    }), 200

@app.route('/notifications', methods=['GET'])
@jwt_required()
def get_notifications():
    """Get pending notifications for the logged-in user (sent=1, read=0)"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            SELECT n.id, n.event_id, n.notify_at, n.sent, n.read, e.title, e.start_datetime, e.end_datetime
            FROM notifications n
            JOIN events e ON n.event_id = e.id
            WHERE n.user_id = ? AND n.sent = 1 AND n.read = 0
            ORDER BY n.notify_at ASC
        ''', (user['id'],))
        notifications = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return jsonify(notifications), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/notifications/<int:notif_id>/read', methods=['POST'])
@jwt_required()
def mark_notification_read(notif_id):
    """Mark a notification as read"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    try:
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE notifications SET read = 1 WHERE id = ? AND user_id = ?
        ''', (notif_id, user['id']))
        conn.commit()
        conn.close()
        return jsonify({'message': 'Notification marked as read'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

@app.route('/users/fcm-token', methods=['POST'])
@jwt_required()
def update_fcm_token():
    """Update user's FCM token for push notifications"""
    user_id = get_jwt_identity()
    user = user_model.get_user_by_id(user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    try:
        data = request.get_json()
        fcm_token = data.get('fcm_token')
        
        if not fcm_token:
            return jsonify({'error': 'FCM token is required'}), 400
        
        conn = db.get_connection()
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE users SET fcm_token = ? WHERE id = ?
        ''', (fcm_token, user['id']))
        conn.commit()
        conn.close()
        
        # Update session (JWT token is not session, so no direct session update here)
        # The user object returned by get_user_by_id is the current state
        
        return jsonify({'message': 'FCM token updated successfully'}), 200
    except Exception as e:
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    print("🚀 Starting SQLite Calendar App...")
    print("📊 Features available:")
    print("   ✅ User signup (employee/admin)")
    print("   ✅ User login/logout")
    print("   ✅ Event creation (authenticated users)")
    print("   ✅ Event viewing (public)")
    print("   ✅ Dashboard stats")
    print("   ✅ Admin user management")
    print()
    print("🔗 API Endpoints:")
    print("   POST /auth/signup   - Create new user")
    print("   POST /auth/login    - Login user")
    print("   POST /auth/logout   - Logout user")
    print("   GET  /events        - Get all events")
    print("   POST /events        - Create event (auth required)")
    print("   GET  /events/stats  - Get dashboard stats")
    print("   GET  /users/me      - Get current user")
    print("   PUT  /users/me      - Update current user")
    print("   POST /auth/change-password - Change password")
    print("   GET  /users         - Get all users (admin only)")
    print()
    print("🌐 Frontend should connect to: http://localhost:5000")
    
    app.run(debug=True, port=5000)
