-- Database initialization script for MongoDB (informational)
-- This file serves as documentation for the database structure
-- MongoDB collections will be created automatically by Prisma

-- Collections that will be created:
-- 1. users - Store organizer accounts
-- 2. events - Store event information
-- 3. registrations - Store event registrations with QR codes

-- Indexes that should be created for performance:
-- users: email (unique)
-- events: slug (unique), organizerId, status
-- registrations: eventId, email, qrCode (unique)
