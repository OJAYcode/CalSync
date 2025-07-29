#!/usr/bin/env python3
"""
Email Service using Gmail SMTP
Handles email notifications for the calendar app
"""

import os
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime

def send_email_notification(to_email, subject, content, html_content=None):
    """
    Send an email notification using Gmail SMTP
    
    Args:
        to_email (str): Recipient email address
        subject (str): Email subject
        content (str): Plain text content
        html_content (str): HTML content (optional)
    
    Returns:
        bool: True if successful, False otherwise
    """
    try:
        # Get Gmail credentials from environment
        gmail_user = os.getenv('GMAIL_USER')
        gmail_password = os.getenv('GMAIL_APP_PASSWORD')
        
        if not gmail_user or not gmail_password:
            print("❌ Gmail credentials not configured")
            return False
        
        # Create message
        msg = MIMEMultipart('alternative')
        msg['Subject'] = subject
        msg['From'] = gmail_user
        msg['To'] = to_email
        
        # Add plain text and HTML parts
        text_part = MIMEText(content, 'plain')
        msg.attach(text_part)
        
        if html_content:
            html_part = MIMEText(html_content, 'html')
            msg.attach(html_part)
        
        # Send email
        with smtplib.SMTP_SSL('smtp.gmail.com', 465) as server:
            server.login(gmail_user, gmail_password)
            server.send_message(msg)
        
        print(f"✅ Email sent successfully to {to_email}")
        return True
        
    except Exception as e:
        print(f"❌ Error sending email: {e}")
        return False

def send_event_reminder_email(user_email, user_name, event_title, event_time, event_description=""):
    """
    Send event reminder email
    
    Args:
        user_email (str): User's email address
        user_name (str): User's name
        event_title (str): Event title
        event_time (str): Event time
        event_description (str): Event description
    
    Returns:
        bool: True if successful, False otherwise
    """
    subject = f"📅 Event Reminder: {event_title}"
    
    # Plain text content
    content = f"""
Hello {user_name},

This is a reminder for your upcoming event:

Event: {event_title}
Time: {event_time}
Description: {event_description}

Best regards,
CalSync Team
    """.strip()
    
    # HTML content
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Event Reminder</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #3B82F6; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .event-details {{ background-color: white; padding: 15px; margin: 15px 0; border-radius: 5px; border-left: 4px solid #3B82F6; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>📅 Event Reminder</h1>
        </div>
        <div class="content">
            <p>Hello {user_name},</p>
            <p>This is a reminder for your upcoming event:</p>
            
            <div class="event-details">
                <h3>{event_title}</h3>
                <p><strong>Time:</strong> {event_time}</p>
                {f'<p><strong>Description:</strong> {event_description}</p>' if event_description else ''}
            </div>
            
            <p>Best regards,<br>CalSync Team</p>
        </div>
        <div class="footer">
            <p>This is an automated reminder from CalSync</p>
        </div>
    </div>
</body>
</html>
    """.strip()
    
    return send_email_notification(user_email, subject, content, html_content)

def send_welcome_email(user_email, user_name):
    """
    Send welcome email to new users
    
    Args:
        user_email (str): User's email address
        user_name (str): User's name
    
    Returns:
        bool: True if successful, False otherwise
    """
    subject = "🎉 Welcome to CalSync!"
    
    content = f"""
Hello {user_name},

Welcome to CalSync! We're excited to have you on board.

CalSync helps you stay organized with:
• Event scheduling and reminders
• Team collaboration
• Department feeds
• Real-time notifications

Get started by creating your first event!

Best regards,
CalSync Team
    """.strip()
    
    html_content = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Welcome to CalSync</title>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #10B981; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }}
        .content {{ background-color: #f9fafb; padding: 20px; border-radius: 0 0 8px 8px; }}
        .feature {{ background-color: white; padding: 15px; margin: 10px 0; border-radius: 5px; }}
        .footer {{ text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎉 Welcome to CalSync!</h1>
        </div>
        <div class="content">
            <p>Hello {user_name},</p>
            <p>Welcome to CalSync! We're excited to have you on board.</p>
            
            <h3>What CalSync offers:</h3>
            <div class="feature">📅 Event scheduling and reminders</div>
            <div class="feature">👥 Team collaboration</div>
            <div class="feature">📢 Department feeds</div>
            <div class="feature">🔔 Real-time notifications</div>
            
            <p>Get started by creating your first event!</p>
            
            <p>Best regards,<br>CalSync Team</p>
        </div>
        <div class="footer">
            <p>Thank you for choosing CalSync</p>
        </div>
    </div>
</body>
</html>
    """.strip()
    
    return send_email_notification(user_email, subject, content, html_content) 