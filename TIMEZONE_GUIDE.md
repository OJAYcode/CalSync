# 🌍 Timezone Support for CalSync

Your CalSync application now supports **real-time location-based time** for all events and notifications. Events are created in your local timezone and displayed correctly regardless of where users are located.

## ✨ Features

### 🕐 **Local Time Creation**
- Events are created using your local timezone
- Automatic timezone detection based on IP address
- Manual timezone selection available

### 🌍 **Multi-Timezone Display**
- Events are displayed in each user's local timezone
- Automatic conversion between timezones
- Support for all major world timezones

### 📱 **Timezone-Aware Notifications**
- Event reminders sent in local time
- Email notifications with correct local times
- Push notifications with timezone context

## 🚀 How It Works

### 1. **Event Creation**
When you create an event:
1. System detects your timezone (IP-based or manual)
2. Converts your local time to UTC for storage
3. Stores timezone information with the event
4. Creates notifications in local time

### 2. **Event Display**
When viewing events:
1. System detects viewer's timezone
2. Converts UTC times back to local timezone
3. Displays times in viewer's local format

### 3. **Notifications**
When sending reminders:
1. Uses event's original timezone
2. Converts to recipient's local timezone
3. Sends notifications with correct local times

## 📋 API Endpoints

### Get Timezone Information
```http
GET /timezone
```

**Response:**
```json
{
  "current_timezone": "America/New_York",
  "current_local_time": "2025-07-29T14:30:00-04:00",
  "timezone_offset_hours": -4,
  "available_timezones": [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "Europe/London",
    "Asia/Tokyo"
  ]
}
```

### Create Event with Timezone
```http
POST /events
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "title": "Team Meeting",
  "description": "Weekly team sync",
  "start_datetime": "2025-07-30T10:00:00",
  "end_datetime": "2025-07-30T11:00:00",
  "timezone": "America/New_York"
}
```

### Get Events in Local Timezone
```http
GET /events?timezone=America/New_York
```

**Response:**
```json
[
  {
    "id": 1,
    "title": "Team Meeting",
    "start_datetime": "2025-07-30T10:00:00-04:00",
    "end_datetime": "2025-07-30T11:00:00-04:00",
    "start_datetime_utc": "2025-07-30T14:00:00+00:00",
    "end_datetime_utc": "2025-07-30T15:00:00+00:00",
    "timezone": "America/New_York"
  }
]
```

## 🔧 Configuration

### Environment Variables
Update `backend/config.env`:

```env
# Timezone Settings
DEFAULT_TIMEZONE=UTC

# Optional: Override default timezone
DEFAULT_TIMEZONE=America/New_York
```

### Supported Timezones
The system supports all standard timezone names:

- **UTC** - Universal Coordinated Time
- **America/New_York** - Eastern Time
- **America/Chicago** - Central Time
- **America/Denver** - Mountain Time
- **America/Los_Angeles** - Pacific Time
- **Europe/London** - British Time
- **Europe/Paris** - Central European Time
- **Europe/Berlin** - Central European Time
- **Asia/Tokyo** - Japan Standard Time
- **Asia/Shanghai** - China Standard Time
- **Australia/Sydney** - Australian Eastern Time
- **Pacific/Auckland** - New Zealand Standard Time

## 🧪 Testing

### Test Timezone Functionality
```bash
cd backend
python test_timezone.py
```

### Test Event Creation with Timezone
```bash
# Create event in New York timezone
curl -X POST http://localhost:5000/events \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Event",
    "start_datetime": "2025-07-30T10:00:00",
    "end_datetime": "2025-07-30T11:00:00",
    "timezone": "America/New_York"
  }'
```

### Test Timezone Detection
```bash
# Get timezone info
curl http://localhost:5000/timezone
```

## 📊 Database Schema

### Events Table (Updated)
```sql
CREATE TABLE events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    start_datetime TEXT NOT NULL,  -- UTC time
    end_datetime TEXT NOT NULL,    -- UTC time
    created_by INTEGER NOT NULL,
    timezone TEXT DEFAULT 'UTC',   -- NEW: Event timezone
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users (id)
);
```

## 🎯 Usage Examples

### Frontend Integration

```javascript
// Get user's timezone
const timezoneResponse = await fetch('/timezone');
const timezoneData = await timezoneResponse.json();
const userTimezone = timezoneData.current_timezone;

// Create event in local timezone
const eventData = {
  title: 'Team Meeting',
  start_datetime: '2025-07-30T10:00:00',
  end_datetime: '2025-07-30T11:00:00',
  timezone: userTimezone
};

const response = await fetch('/events', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(eventData)
});

// Get events in local timezone
const eventsResponse = await fetch(`/events?timezone=${userTimezone}`);
const events = await eventsResponse.json();
```

### Backend Integration

```python
from timezone_utils import timezone_utils

# Get user's timezone
user_timezone = timezone_utils.get_user_timezone(request.remote_addr)

# Convert local time to UTC
local_time = "2025-07-30T10:00:00"
utc_time = timezone_utils.parse_event_datetime(local_time, user_timezone)

# Convert UTC back to local time
local_time = timezone_utils.convert_to_local_time(utc_time, user_timezone)
```

## 🌍 Timezone Detection

### Automatic Detection
The system automatically detects your timezone using:
1. **IP Geolocation** - Determines timezone from your IP address
2. **Fallback** - Uses default timezone if detection fails

### Manual Override
You can manually specify timezone:
1. **Frontend** - User selects timezone from dropdown
2. **API** - Include `timezone` parameter in requests
3. **Configuration** - Set default timezone in config

## 📱 Notification Integration

### Event Reminders
Event reminders are sent in the correct timezone:
- **Push notifications** show local event time
- **Email notifications** include local time information
- **Scheduled reminders** use event's original timezone

### Example Email Template
```html
<h2>Event Reminder</h2>
<p>Hi {user_name},</p>
<p>You have an upcoming event:</p>
<div>
    <h3>{event_title}</h3>
    <p><strong>Time:</strong> {local_event_time}</p>
    <p><strong>Your timezone:</strong> {user_timezone}</p>
</div>
```

## 🔍 Troubleshooting

### Common Issues

1. **Wrong timezone detected**
   - Check IP geolocation service
   - Verify network location
   - Use manual timezone override

2. **Events showing wrong times**
   - Verify timezone conversion
   - Check database timezone column
   - Test with known timezone

3. **Notifications in wrong time**
   - Check event timezone storage
   - Verify notification service timezone handling
   - Test timezone conversion functions

### Debug Commands

```bash
# Test timezone detection
python test_timezone.py

# Check database timezone column
sqlite3 calendar_app.db "PRAGMA table_info(events);"

# View events with timezone info
sqlite3 calendar_app.db "SELECT id, title, start_datetime, timezone FROM events;"
```

## 🚀 Deployment

### Production Checklist
- [ ] Set appropriate default timezone
- [ ] Test timezone detection accuracy
- [ ] Verify notification timezone handling
- [ ] Check database timezone column exists
- [ ] Test with multiple timezones

### Environment Setup
```env
# Production timezone settings
DEFAULT_TIMEZONE=America/New_York
```

## 📈 Benefits

### For Users
- **Accurate times** - Events show in your local time
- **No confusion** - No need to convert between timezones
- **Consistent experience** - Same time format everywhere

### For Admins
- **Global reach** - Events work for users worldwide
- **Automatic handling** - No manual timezone management
- **Reliable notifications** - Reminders sent at correct times

---

**🎉 Your CalSync application now provides a seamless timezone experience for users worldwide!** 