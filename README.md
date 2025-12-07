# SST Announcement System

A comprehensive announcement management system for SCALER School of Technology, featuring Clerk authentication, real-time announcements, TV display integration, emergency alerts, email notifications, and role-based admin controls.

## 📋 Table of Contents

- [Overview](#-overview)
- [Features](#-features)
- [Architecture](#️-architecture)
- [Quick Start](#-quick-start)
- [API Endpoints](#-api-endpoints)
- [Database Schema](#️-database-schema)
- [Security Features](#-security-features)
- [User Roles & Permissions](#-user-roles--permissions)
- [Rate Limiting](#-rate-limiting)
- [Email Notifications](#-email-notifications)
- [TV Display Integration](#-tv-display-integration)
- [Emergency Alerts](#-emergency-alerts)
- [Development](#️-development)
- [Deployment](#-deployment)
- [Troubleshooting](#-troubleshooting)
- [Database Schema Updates](#-database-schema-updates)
- [Contributing](#-contributing)
- [Support](#-support)
- [License](#-license)

## 🎯 Overview

The SST Announcement System is a full-stack Next.js application designed to manage and display college announcements. Built with Next.js 16 App Router, it features a modern React frontend with SCALER branding and a serverless API architecture using Next.js API routes.

## ✨ Features

### Core Features
- **Clerk Authentication** - Secure authentication with role-based access control
- **Announcement Management** - Create, read, update, and delete announcements
- **Category System** - Organize announcements by categories (College, Tech, Tech Events, Tech Workshops, Academic, Sports, Other)
- **Scheduling** - Schedule announcements for future publication (Super Admin only)
- **Expiry Management** - Set expiry dates with visual indicators for expired announcements
- **Multiple Deadlines** - Add multiple deadline entries per announcement with custom labels (e.g., "Form closes", "Interview date", "Results announced")
- **Priority System** - Priority announcements with expiration windows (P0-P3 levels)
- **Target Year Filtering** - Target announcements to specific student years
- **Search & Filter** - Search announcements by title/description and filter by category
- **Pagination** - Load announcements in batches (Dashboard: 5 items, All Announcements: 6 items) with "Load More" button
- **TV Display Integration** - Send announcements to TV screens via `/api/tv` endpoint
- **Email Notifications** - Send email alerts using Resend API
- **Emergency Alerts** - Priority emergency announcements with immediate visibility
- **Rate Limiting** - API rate limiting to prevent abuse with multiple tiers

### Admin Features
- **Role-Based Access Control** - Four user roles: Student, Student Admin, Admin, Super Admin
- **User Management** - Manage users, roles, and admin privileges (Super Admin only)
- **Announcement Moderation** - Review, approve, or reject announcements

### UI/UX Features
- **SCALER Branding** - Professional design with SCALER School of Technology branding
- **Dark Theme** - Modern dark mode design with gradient backgrounds
- **Glassmorphism** - Frosted glass effects on cards and panels
- **Responsive Design** - Mobile-first responsive layout
- **Animations** - Smooth transitions and hover effects
- **Loading States** - Skeleton loaders and loading indicators
- **Toast Notifications** - User-friendly feedback system
- **Pagination** - Efficient loading of announcements with "Load More" functionality
- **Deadline Visualization** - Visual indicators for multiple deadlines with passed/upcoming status
- **Smart Prioritization** - Expired and deadline announcements prioritized in "Recent Announcements"
- **Approaching Deadline Alerts** - Highlight announcements with approaching deadlines/expiries for students (within 7 days)

## 🏗️ Architecture

### Technology Stack
- **Framework**: Next.js 16.0.7 (App Router)
- **Language**: TypeScript 5.6.3
- **UI Library**: React 19.2.1
- **Styling**: Tailwind CSS 3.4.14
- **Database**: PostgreSQL with Drizzle ORM 0.33.0
- **Authentication**: Clerk (@clerk/nextjs 6.35.6, @clerk/backend 2.25.0)
- **Email Service**: Resend API 4.0.0
- **Deployment**: Vercel (with cron jobs)
- **UI Components**: Lucide React icons, Tailwind Merge, Class Variance Authority

### Project Structure

```
sst_announcement/
├── app/                          # Next.js App Router
│   ├── api/                      # API Routes
│   │   ├── admin/                # Admin endpoints
│   │   │   ├── dashboard/        # Dashboard stats
│   │   │   └── users/            # User management
│   │   │       ├── [id]/         # User by ID routes
│   │   │       │   ├── admin-status/  # Update admin status
│   │   │       │   ├── role/           # Update user role
│   │   │       │   └── route.ts       # Get user by ID
│   │   │       └── route.ts           # Get all users
│   │   ├── announcements/       # Announcement CRUD
│   │   │   ├── [id]/             # Announcement by ID
│   │   │   └── route.ts          # List/Create announcements
│   │   ├── profile/              # User profile
│   │   ├── tv/                   # TV display endpoint
│   │   ├── test-email/           # Test email functionality
│   │   └── debug-email/          # Debug email configuration
│   ├── all-announcements/        # All announcements page
│   ├── layout.tsx                # Root layout with Clerk
│   └── page.tsx                  # Main page/router
│
├── components/                    # React Components
│   ├── forms/                    # Form components
│   │   ├── CreateAnnouncementForm.tsx
│   │   └── EmergencyAlertForm.tsx
│   ├── modals/                   # Modal dialogs
│   │   ├── CreateAnnouncementModal.tsx
│   │   ├── EditAnnouncementModal.tsx
│   │   ├── DeleteConfirmModal.tsx
│   │   ├── UserManagementModal.tsx
│   │   └── index.tsx             # Modal exports
│   ├── pages/                    # Page components
│   │   ├── Dashboard.tsx
│   │   ├── AllAnnouncements.tsx
│   │   └── Login.tsx
│   └── ui/                       # UI components
│       ├── card.tsx
│       ├── button.tsx
│       ├── badge.tsx
│       ├── toast.tsx
│       └── QuickEmergencyButton.tsx
│
├── lib/                          # Backend Library
│   ├── config/                   # Configuration
│   │   ├── config.ts
│   │   ├── db.ts                 # Database connection
│   │   └── env.ts                # Environment validation
│   ├── data/                     # Data access layer
│   │   ├── announcements.ts      # Announcement data access
│   │   └── users.ts              # User data access
│   ├── middleware/               # Middleware functions
│   │   ├── auth.ts               # Authentication middleware
│   │   ├── domain.ts             # Domain validation
│   │   └── rateLimit.ts          # Rate limiting
│   ├── schema.ts                 # Drizzle ORM schema
│   ├── services/                 # External services
│   │   ├── clerk.ts              # Clerk service
│   │   └── email.ts              # Email service (Resend)
│   ├── types/                    # TypeScript types
│   │   └── index.ts              # Type definitions
│   └── utils/                    # Utilities
│       ├── errors.ts             # Error classes
│       ├── roleUtils.ts          # Role utilities
│       └── validation.ts         # Validation functions
│
├── contexts/                     # React Context providers
│   └── AppUserContext.tsx        # User context
│
├── hooks/                        # Custom React hooks
│   ├── useToast.ts               # Toast notifications
│   └── useCountUp.ts             # Count-up animation
│
├── services/                     # Frontend API service
│   └── api.ts                    # API client
│
├── types/                        # TypeScript types
│   └── index.ts                  # Type definitions
│
├── utils/                        # Frontend utilities
│   ├── dateUtils.ts              # Date formatting
│   ├── announcementUtils.ts      # Announcement utilities
│   ├── linkParser.tsx            # Link parsing
│   ├── priorityMapping.ts        # Priority mapping
│   └── studentYear.ts            # Student year utilities
│
├── constants/                    # Constants and configurations
│   ├── categories.ts             # Category definitions
│   └── categoryStyles.tsx        # Category styling
│
├── config/                       # Configuration files
│   └── config.ts                 # App configuration
│
├── middleware.ts                 # Next.js middleware (CORS)
├── next.config.js                # Next.js configuration
├── vercel.json                   # Vercel deployment config
└── package.json                  # Dependencies and scripts
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v18 or higher)
- PostgreSQL database
- Clerk account (for authentication)
- Resend account (for email notifications, optional)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd sst_announcement
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   # Database (Required)
   DATABASE_URL=postgresql://user:password@localhost:5432/database_name
   
   # Clerk Authentication (Required)
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
   CLERK_SECRET_KEY=sk_test_...
   
   # Session (Required)
   SESSION_SECRET=your_session_secret
   
   # Email (Resend) - Optional
   RESEND_API_KEY=re_...
   RESEND_FROM_EMAIL=noreply@yourdomain.com
   
   # Optional Configuration
   FRONTEND_URL=http://localhost:3000
   BACKEND_URL=http://localhost:3000
   DEPLOYMENT=local
   CRON_SECRET=your_cron_secret
   ```

4. **Set up the database**
   
   The database schema is defined in `lib/schema.ts` using Drizzle ORM. You'll need to:
   - Create the database tables manually based on the schema
   - Ensure all required tables exist: `users`, `announcements`, `announcement_engagements`
   - Add any missing columns if you encounter schema errors (see [Database Schema Updates](#-database-schema-updates) section)

5. **Start the development server**
   ```bash
   npm run dev
   ```

6. **Access the Application**
   - Application: http://localhost:3000
   - API Routes: http://localhost:3000/api/*

## 📚 API Endpoints

### Public Endpoints
- `GET /api/announcements` - Get all announcements (with pagination: `?limit=10&offset=0`)
- `GET /api/announcements/[id]` - Get announcement by ID
- `GET /api/tv` - Get announcements for TV display (where `send_tv = true`, returns top 5)

### Authenticated Endpoints
- `GET /api/profile` - Get current user profile
- `POST /api/announcements` - Create announcement (Student Admin+)
- `PATCH /api/announcements/[id]` - Update announcement (Admin+)
- `DELETE /api/announcements/[id]` - Delete announcement (Admin+)

### Admin Endpoints
- `GET /api/admin/dashboard` - Get admin dashboard stats (Admin+)
- `GET /api/admin/users` - Get all users (Admin+)
- `GET /api/admin/users/[id]` - Get user by ID (Admin+)
- `PATCH /api/admin/users/[id]/role` - Update user role (Super Admin only)
- `PATCH /api/admin/users/[id]/admin-status` - Update admin status (Super Admin only)

### Utility Endpoints
- `POST /api/test-email` - Test email functionality (Admin+)
- `GET /api/debug-email` - Debug email configuration (Admin+)

## 🗄️ Database Schema

### Users Table (`users`)
- `id` - Primary key (serial)
- `clerk_id` - Unique Clerk user ID (text, not null, unique)
- `email` - User email (text, not null, unique)
- `username` - Display name (varchar 100)
- `role` - User role enum: `student`, `student_admin`, `admin`, `super_admin`, `user` (default: `student`)
- `created_at` - Account creation timestamp (with timezone)
- `last_login` - Last login timestamp (with timezone)

### Announcements Table (`announcements`)
- `id` - Primary key (serial)
- `title` - Announcement title (varchar 255, not null)
- `description` - Full description (text, not null)
- `category` - Category (varchar 100, not null): `college`, `tech`, `tech-events`, `tech-workshops`, `academic`, `sports`, `other`
- `author_id` - Foreign key to users (integer, references users.id, onDelete: set null)
- `created_at` - Creation timestamp (with timezone, default now)
- `updated_at` - Last update timestamp (with timezone)
- `expiry_date` - When announcement expires (with timezone)
- `deadlines` - Multiple deadlines stored as JSONB array: `[{label: string, date: string}, ...]` (default: `[]`)
- `scheduled_at` - When to publish (with timezone, Super Admin only)
- `reminder_time` - Reminder notification time (with timezone)
- `is_active` - Active status (boolean, default: true)
- `status` - Enum: `scheduled`, `active`, `urgent`, `expired` (default: `active`)
- `views_count` - View count (integer, default: 0)
- `clicks_count` - Click count (integer, default: 0)
- `send_email` - Whether to send email notification (boolean, default: false, not null)
- `email_sent` - Whether email was sent (boolean, default: false, not null)
- `send_tv` - Whether to display on TV screens (boolean, default: false, not null)
- `priority_until` - Priority expiration timestamp (with timezone)
- `priority_level` - Priority level (integer, default: 3): `0`=P0 (Highest), `1`=P1 (High), `2`=P2 (Medium), `3`=P3 (Normal)
- `is_emergency` - Emergency flag (boolean, default: false, not null)
- `emergency_expires_at` - Emergency expiration (with timezone)
- `visible_after` - Visibility start time (with timezone)
- `target_years` - Array of target student years (integer array, nullable)

### Announcement Engagements Table (`announcement_engagements`)
- `id` - Primary key (serial)
- `announcement_id` - Foreign key to announcements (integer, not null, references announcements.id, onDelete: cascade)
- `user_id` - Foreign key to users (integer, references users.id, onDelete: set null)
- `event_type` - Event type enum: `view`, `click`, `dismiss` (text, not null)
- `created_at` - Event timestamp (with timezone, default now)

## 🔐 Security Features

- **Clerk Authentication** - Secure JWT-based authentication
- **Role-Based Access Control** - Four-tier permission system
- **Domain Validation** - Restricts access to `@scaler.com` and `@sst.scaler.com` emails
- **Rate Limiting** - Prevents API abuse with configurable limits (see [Rate Limiting](#-rate-limiting) section)
- **CORS Protection** - Centralized CORS handling via Next.js middleware (`middleware.ts`)
- **SQL Injection Prevention** - Parameterized queries with Drizzle ORM
- **Environment Variable Protection** - Sensitive data in `.env.local` with validation
- **Request Validation** - Input validation for all API endpoints
- **IP-based Rate Limiting** - Tracks requests by client IP address

## 🎨 User Roles & Permissions

### Student
- View active announcements
- View announcements with deadlines regardless of status
- View scheduled announcements once scheduled time has passed
- Filter and search announcements
- Cannot see announcements scheduled for the future
- Cannot create or modify announcements
- See approaching deadline/expiry alerts (within 7 days)

### Student Admin
- All student permissions
- Create and manage own announcements
- Cannot schedule or access admin features
- Cannot edit/delete other users' announcements

### Admin
- All Student Admin permissions
- Manage all announcements (edit, delete)
- View all users
- Cannot manage user roles or schedule announcements

### Super Admin
- All Admin permissions
- Schedule announcements for future publication
- Manage user roles and admin status
- Full system access
- Access to all admin endpoints

## ⚡ Rate Limiting

The system implements multiple rate limiting tiers to protect against API abuse. Rate limits are configured in `lib/middleware/rateLimit.ts` and use an in-memory store (Map-based) that tracks requests by IP address.

### Rate Limit Tiers

1. **General Limiter** (`generalLimiterOptions`)
   - Window: 15 minutes
   - Max Requests: 100 per IP
   - Used for: General API endpoints

2. **Auth Limiter** (`authLimiterOptions`)
   - Window: 15 minutes
   - Max Requests: 25 per IP
   - Used for: Authentication-related endpoints

3. **Admin Limiter** (`adminLimiterOptions`)
   - Window: 15 minutes
   - Max Requests: 200 per IP
   - Used for: Admin endpoints

4. **Strict Limiter** (`strictLimiterOptions`)
   - Window: 1 hour
   - Max Requests: 3 per IP
   - Used for: Sensitive operations (e.g., email sending)

### How It Works

- Rate limits are tracked per IP address using the `x-forwarded-for` or `x-real-ip` headers
- Each rate limit window resets after the specified time period
- When a limit is exceeded, a `ForbiddenError` is thrown with the message: "Too many requests, please try again later."
- The rate limiter uses an in-memory Map store (resets on server restart)

### Customization

To adjust rate limits, modify the options in `lib/middleware/rateLimit.ts`:

```typescript
export const generalLimiterOptions: RateLimitOptions = {
  windowMs: 15 * 60 * 1000,  // 15 minutes in milliseconds
  max: 100,                   // Maximum requests per window
  keyPrefix: 'general',       // Prefix for storage key
};
```

## 📧 Email Notifications

The system uses Resend API for email notifications:
- Configured via `RESEND_API_KEY` and `RESEND_FROM_EMAIL` environment variables
- Sends formatted HTML emails for announcements
- Tracks email delivery status (`email_sent` field)
- Currently hardcoded to send to: `mohammed.24bcs10278@sst.scaler.com`
- Email sending is optional per announcement (`send_email` flag)
- Test email functionality available via `/api/test-email` endpoint
- Debug email configuration available via `/api/debug-email` endpoint

## 📺 TV Display Integration

- Announcements with `send_tv = true` are available via `/api/tv`
- Returns top 5 most recent TV-enabled announcements
- Filtered by `send_tv` flag in database
- Ordered by creation date (newest first)
- Designed for digital signage integration
- Includes rate limiting for API protection
- Public endpoint (no authentication required)

## 🚨 Emergency Alerts

- **Emergency Mode** - Special announcement type with priority display
- **Quick Emergency Button** - One-click emergency alert creation from dashboard
- **Automatic Priority** - Emergency announcements automatically get priority status
- **Email & TV** - Can send to both email and TV displays simultaneously
- **Expiration** - Configurable emergency duration (1-168 hours)
- **Visual Indicators** - Emergency announcements are visually distinct
- **Immediate Visibility** - Emergency announcements bypass normal visibility rules
- **Priority Levels** - Supports P0 (Highest) through P3 (Normal) priority levels

## 🛠️ Development

### Available Scripts
```bash
npm run dev        # Start development server
npm run build      # Build for production
npm start          # Start production server
npm run lint       # Run ESLint
npm run type-check # TypeScript type checking
```

### Key Technologies
- **Next.js 16** - React framework with App Router
- **Drizzle ORM** - Type-safe database queries
- **Clerk** - Authentication and user management
- **Resend** - Email delivery service
- **Tailwind CSS** - Utility-first CSS framework
- **TypeScript** - Type-safe JavaScript
- **PostgreSQL** - Relational database
- **Lucide React** - Icon library

### Development Workflow
1. Make changes to code
2. Run `npm run type-check` to verify TypeScript
3. Run `npm run lint` to check code quality
4. Test locally with `npm run dev`
5. Build for production with `npm run build`

## 🚀 Deployment

### Vercel Deployment
1. Connect your repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on push to main branch

### Environment Variables for Production
- `DATABASE_URL` - Production PostgreSQL connection string
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - Clerk publishable key
- `CLERK_SECRET_KEY` - Clerk secret key
- `SESSION_SECRET` - Session secret for secure sessions
- `RESEND_API_KEY` - Resend API key (optional)
- `RESEND_FROM_EMAIL` - Verified sender email (optional)
- `DEPLOYMENT=production` - Set deployment mode
- `CRON_SECRET` - Secret for cron job authentication

### Cron Jobs
The system includes a daily cron job (configured in `vercel.json`) for scheduled announcements:
- **Path**: `/api/scheduler`
- **Schedule**: `0 0 * * *` (daily at midnight UTC)
- **Purpose**: Processes scheduled announcements and updates announcement statuses
- **Note**: Vercel Hobby plan only supports daily cron jobs

### CORS Configuration
CORS is handled in two places:
1. **Next.js Middleware** (`middleware.ts`) - Handles CORS for all `/api` routes
2. **Vercel Headers** (`vercel.json`) - Additional CORS headers for deployment

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Failed**
   - Verify PostgreSQL is running
   - Check `DATABASE_URL` in `.env.local`
   - Ensure database exists and is accessible
   - Verify connection string format: `postgresql://user:password@host:port/database`

2. **Clerk Authentication Not Working**
   - Verify Clerk keys in `.env.local`
   - Check domain configuration in Clerk dashboard
   - Ensure `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set (must start with `pk_`)
   - Ensure `CLERK_SECRET_KEY` is set (must start with `sk_`)

3. **Email Not Sending**
   - Verify `RESEND_API_KEY` is set
   - Check `RESEND_FROM_EMAIL` is a verified domain in Resend
   - Use `/api/debug-email` endpoint to test configuration
   - Check Resend dashboard for delivery status

4. **CORS Errors**
   - CORS is handled automatically by `middleware.ts`
   - Verify middleware is in project root
   - Check `vercel.json` headers configuration
   - Ensure API routes are under `/api` path

5. **Build Errors**
   - Delete `.next` folder and rebuild: `rmdir /s .next && npm run build` (Windows) or `rm -rf .next && npm run build` (Mac/Linux)
   - Check TypeScript errors: `npm run type-check`
   - Verify all environment variables are set
   - Check for missing dependencies: `npm install`

6. **"send_tv column does not exist" Error**
   - The `send_tv` column needs to be added to the `announcements` table
   - Run this SQL command in your PostgreSQL database:
     ```sql
     ALTER TABLE announcements 
     ADD COLUMN IF NOT EXISTS send_tv BOOLEAN DEFAULT false NOT NULL;
     ```
   - Or connect to your database and execute the SQL directly

7. **Rate Limiting Issues**
   - Rate limits are configured in `lib/middleware/rateLimit.ts`
   - Adjust limits if needed for your use case
   - Rate limits reset on server restart (in-memory store)
   - Check IP detection if rate limits aren't working correctly

8. **TypeScript Errors**
   - Run `npm run type-check` to see all errors
   - Ensure all types are properly imported
   - Check for missing type definitions

9. **Environment Variable Validation Errors**
   - Ensure all required environment variables are set (see `lib/config/env.ts`)
   - Required variables: `DATABASE_URL`, `SESSION_SECRET`, `CLERK_SECRET_KEY`
   - Check `.env.local` file is in the root directory

## 📝 Database Schema Updates

### Adding Missing Columns
If you encounter errors about missing columns, you can add them manually using SQL:

**Add `send_tv` column:**
```sql
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS send_tv BOOLEAN DEFAULT false NOT NULL;
```

**Add `priority_until` column (if needed):**
```sql
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS priority_until TIMESTAMPTZ;
```

**Add `target_years` column (if needed):**
```sql
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS target_years INTEGER[];
```

**Add `visible_after` column (if needed):**
```sql
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS visible_after TIMESTAMPTZ;
```

**Add `deadlines` column (if needed):**
```sql
ALTER TABLE announcements 
ADD COLUMN IF NOT EXISTS deadlines JSONB DEFAULT '[]'::jsonb;

-- Optional: Add GIN index for better query performance
CREATE INDEX IF NOT EXISTS idx_announcements_deadlines 
ON announcements USING GIN (deadlines);
```

### Removing Unused Tables
If you need to remove unused tables, you can do so manually:
```sql
DROP TABLE IF EXISTS announcement_comments CASCADE;
```

### Manual Schema Updates
The database schema is defined in `lib/schema.ts` using Drizzle ORM. When adding new columns or tables:
1. Update the schema in `lib/schema.ts`
2. Run the corresponding SQL ALTER TABLE commands in your database
3. Ensure the schema matches your database structure

## 📝 License

ISC License

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For issues and questions:
- Create an issue in the repository
- Check existing documentation files
- Review API route implementations in `app/api/`
- Check TypeScript types in `types/index.ts` and `lib/types/index.ts`

## 🙏 Acknowledgments

- SCALER School of Technology for branding and inspiration
- Clerk for authentication infrastructure
- Resend for email delivery
- Drizzle ORM for type-safe database queries
- All open-source contributors

---

**Built with ❤️ for SCALER School of Technology**
