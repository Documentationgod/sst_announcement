# Clerk Domain Restriction Setup Guide

## Problem

When users try to sign in with non-Scaler emails, there are delays and multiple redirections because:

1. Clerk allows the sign-in first
2. Our backend then detects invalid domain
3. Backend deletes the Clerk user
4. Multiple redirections occur
5. Toast notification doesn't show properly

## Solution: Restrict at Clerk Dashboard Level

### Step 1: Configure Email Domain Allowlist in Clerk Dashboard

1. Go to your Clerk Dashboard: https://dashboard.clerk.com/
2. Select your application
3. Navigate to **User & Authentication** → **Restrictions**
4. Under **Email address**, enable **Allowlist**
5. Add allowed domains:
   - `scaler.com`
   - `sst.scaler.com`
6. Save changes

### Step 2: Configure Sign-in Settings

1. In Clerk Dashboard, go to **User & Authentication** → **Email, Phone, Username**
2. Ensure **Email address** is enabled
3. Under **Verification**, make sure email verification is enabled
4. This ensures only verified Scaler emails can sign in

### Benefits

After this setup:

- ✅ Non-Scaler emails will be rejected **immediately** at Clerk's sign-in screen
- ✅ No backend delays or redirections
- ✅ Users see clear error message from Clerk
- ✅ No unauthorized users in Clerk dashboard
- ✅ Faster sign-in experience for valid users

### Testing

1. Try signing in with a non-Scaler email (e.g., `test@gmail.com`)
   - Should see immediate error from Clerk: "This email address is not allowed"
2. Try signing in with a Scaler email (e.g., `user@scaler.com`)
   - Should sign in successfully without delays

## Current Backend Protection (Still Active)

Our backend still has multiple layers of protection as fallback:

- Domain validation in `lib/services/clerk.ts` (deletes unauthorized Clerk users)
- Domain validation in `lib/data/users.ts` (blocks database operations)
- Middleware protection in `middleware.ts`
- Auto sign-out in `AppUserContext.tsx`

These ensure security even if Clerk settings are misconfigured.
