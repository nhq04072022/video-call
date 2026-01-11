-- Migration: Add calendar and notification tables
-- Date: 2024-01-XX
-- Description: Adds tables for mentor calendar management and notification system

-- Create mentor_availability_slots table for managing mentor availability
CREATE TABLE IF NOT EXISTS mentor_availability_slots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    mentor_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6), -- 0 = Sunday, 6 = Saturday
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    timezone VARCHAR(50) DEFAULT 'UTC',
    is_recurring BOOLEAN DEFAULT TRUE,
    valid_from DATE,
    valid_until DATE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CHECK (end_time > start_time)
);

-- Create notification_preferences table for user notification settings
CREATE TABLE IF NOT EXISTS notification_preferences (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    email_enabled BOOLEAN DEFAULT TRUE,
    in_app_enabled BOOLEAN DEFAULT TRUE,
    push_enabled BOOLEAN DEFAULT FALSE,
    notify_24h_before BOOLEAN DEFAULT TRUE,
    notify_1h_before BOOLEAN DEFAULT TRUE,
    notify_15min_before BOOLEAN DEFAULT TRUE,
    notify_5min_before BOOLEAN DEFAULT TRUE,
    quiet_hours_start TIME,
    quiet_hours_end TIME,
    timezone VARCHAR(50) DEFAULT 'UTC',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create notifications table for in-app notification records
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    type VARCHAR(50) NOT NULL, -- 'session_reminder', 'session_accepted', 'session_canceled', etc.
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    read_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Create notification_jobs table for scheduled notification jobs
CREATE TABLE IF NOT EXISTS notification_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
    notification_type VARCHAR(50) NOT NULL, -- '24h_before', '1h_before', '15min_before', '5min_before'
    scheduled_time TIMESTAMP NOT NULL,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'sent', 'failed', 'canceled'
    sent_at TIMESTAMP,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for calendar and notification tables
CREATE INDEX IF NOT EXISTS idx_availability_mentor_id ON mentor_availability_slots(mentor_id);
CREATE INDEX IF NOT EXISTS idx_availability_is_active ON mentor_availability_slots(is_active);
CREATE INDEX IF NOT EXISTS idx_availability_day_of_week ON mentor_availability_slots(day_of_week);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read_at ON notifications(read_at);
CREATE INDEX IF NOT EXISTS idx_notifications_session_id ON notifications(session_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_session_id ON notification_jobs(session_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_user_id ON notification_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_status ON notification_jobs(status);
CREATE INDEX IF NOT EXISTS idx_notification_jobs_scheduled_time ON notification_jobs(scheduled_time);
