# Scaler Email Domain Restriction Setup

## Overview

This application now restricts access to users with **Scaler email addresses only**:

- `@scaler.com`
- `@sst.scaler.com`

## ✅ What's Been Implemented

### 1. **Code-Level Restrictions**

- **Clerk User Sync** (`lib/services/clerk.ts`): Validates email domain before storing user in database
- **Middleware** (`middleware.ts`): Integrates Clerk middleware for route protection
- **Domain Validation** (`lib/middleware/domain.ts`): Enhanced error messages for unauthorized domains
- **Auto Sign-out** (`contexts/AppUserContext.tsx`): Automatically signs out users with non-Scaler emails
- **Login Page** (`components/pages/Login.tsx`): Shows clear message about allowed email domains

### 2. **Automatic Cleanup**

When a non-Scaler email tries to log in:

1. ✅ The user is **deleted from Clerk** (won't appear in Clerk dashboard)
2. ✅ The user is **not stored in your database**
3. ✅ The user is **automatically signed out**
4. ✅ Clear error message is displayed

## 🔧 Required: Clerk Dashboard Configuration

To prevent non-Scaler emails from even reaching the sign-in flow, you **must** configure Clerk:

### Step 1: Enable Email Restrictions in Clerk Dashboard

1. Go to your Clerk Dashboard: https://dashboard.clerk.com
2. Navigate to **Configure** → **Email, Phone, Username**
3. Scroll to **Restrictions** section
4. Enable **"Restrict email addresses to specific domains"**
5. Add the allowed domains:
   ```
   scaler.com
   sst.scaler.com
   ```

### Step 2: Configure Authentication Methods

1. In Clerk Dashboard, go to **Configure** → **Email, Phone, Username**
2. Make sure **Email address** is enabled
3. Under **Social connections**, ensure Google is configured
4. Under **Advanced** → **Allowlist/Blocklist**:
   - Set **Allowlist** to the Scaler domains
   - This prevents sign-ups from other domains at the Clerk level

### Step 3: Optional - Disable Sign-ups from Unknown Emails

1. Go to **Configure** → **Settings**
2. Under **Sign-up mode**, you can:
   - Set to **"Restricted"** to only allow invited users
   - Or keep **"Public"** but with domain restrictions (recommended)

## 📋 Testing the Restrictions

### Test Case 1: Non-Scaler Email

1. Try to sign in with a Gmail/Yahoo/etc. email
2. Expected behavior:
   - User can attempt Google sign-in via Clerk modal
   - After authentication, user is immediately signed out
   - Error message: "Access denied. Only Scaler email addresses are allowed..."
   - User is deleted from Clerk dashboard
   - No entry in your database

### Test Case 2: Scaler Email

1. Sign in with `user@scaler.com` or `user@sst.scaler.com`
2. Expected behavior:
   - Successful authentication
   - User profile loaded
   - Access to dashboard granted

## 🔒 Security Layers

This implementation provides **3 layers of security**:

1. **Clerk Dashboard Restrictions** (Recommended to configure)
   - Blocks non-Scaler emails at sign-in
   - Cleanest user experience

2. **Middleware Protection**
   - Uses Clerk's middleware to protect routes
   - Blocks unauthorized access before reaching API

3. **Database Sync Validation**
   - Validates domain in `syncClerkUser`
   - Deletes Clerk user if unauthorized
   - Prevents database pollution

## 🚨 Important Notes

### For Development

- Make sure you have Scaler email access for testing
- If you need to test with a non-Scaler email temporarily, you'll need to:
  1. Modify `ALLOWED_DOMAINS` in `lib/middleware/domain.ts`
  2. Restart the development server

### For Production

- **Always use Clerk Dashboard restrictions** for best user experience
- Code-level restrictions are a backup, not the primary defense
- Monitor Clerk logs for unauthorized access attempts

## 🔍 Troubleshooting

### Issue: Users with non-Scaler emails are still getting in

**Solution:** Check these in order:

1. Verify Clerk Dashboard has domain restrictions configured
2. Clear browser cache and cookies
3. Check environment variables are set correctly
4. Verify `ALLOWED_DOMAINS` in `lib/middleware/domain.ts`

### Issue: Scaler users can't log in

**Solution:**

1. Verify the email domain is exactly `@scaler.com` or `@sst.scaler.com`
2. Check Clerk Dashboard allowlist includes both domains
3. Check server logs for specific error messages

### Issue: User appears in Clerk Dashboard but not in app

**Solution:** This is expected behavior:

- The user authenticated with Clerk briefly
- Code detected non-Scaler domain
- User was deleted from Clerk and logged out
- Check server logs for "🚫 Deleted unauthorized Clerk user" message

## 📝 Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
```

## 🎯 Next Steps

1. ✅ Configure Clerk Dashboard domain restrictions (see Step 1 above)
2. ✅ Test with both Scaler and non-Scaler emails
3. ✅ Monitor Clerk and application logs
4. ✅ Deploy changes to production

## 📞 Support

If you encounter issues:

1. Check the browser console for client-side errors
2. Check server logs for backend errors
3. Verify Clerk Dashboard configuration
4. Review this document's troubleshooting section
