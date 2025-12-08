import { createClerkClient, verifyToken } from '@clerk/backend';
import type { JwtPayload } from '@clerk/types';
import { eq } from 'drizzle-orm';
import { getEnvConfig } from '../config/env';
import { getDb } from '../config/db';
import { users } from '../schema';
import { mapUser } from '../data/users';
import type { AuthenticatedUser } from '../types/index';
import { isAllowedDomain } from '../middleware/domain';

type ClerkJwtPayload = JwtPayload & {
  sub: string;
  email?: string;
  first_name?: string;
  last_name?: string;
  username?: string;
};

let cachedSecretKey: string | null = null;
let clerkClient: ReturnType<typeof createClerkClient> | null = null;

function getSecretKey(): string {
  if (cachedSecretKey) {
    return cachedSecretKey;
  }

  const env = getEnvConfig();
  if (!env.CLERK_SECRET_KEY) {
    throw new Error('CLERK_SECRET_KEY is not configured');
  }
  cachedSecretKey = env.CLERK_SECRET_KEY;
  return cachedSecretKey!;
}

function getClerkClient() {
  if (clerkClient) {
    return clerkClient;
  }
  
  clerkClient = createClerkClient({
    secretKey: getSecretKey(),
  });
  
  return clerkClient;
}

export async function verifyClerkToken(token: string): Promise<ClerkJwtPayload | null> {
  try {
    const payload = await verifyToken(token, {
      secretKey: getSecretKey(),
    });
    return payload as ClerkJwtPayload;
  } catch (error) {
    console.warn('Clerk token verification failed:', error);
    return null;
  }
}

export async function syncClerkUser(claims: ClerkJwtPayload): Promise<AuthenticatedUser> {
  const db = getDb();
  const externalId = claims.sub;
  if (!externalId) {
    throw new Error('Clerk token missing subject');
  }

  // Try to get email from token claims first (faster than API call)
  let email = claims.email;
  let displayName = claims.username || claims.first_name || claims.last_name || null;

  // Only call Clerk API if we don't have email in claims
  if (!email) {
    const clerk = getClerkClient();
    const clerkUser = await clerk.users.getUser(externalId);
    email = clerkUser.emailAddresses.find(e => e.id === clerkUser.primaryEmailAddressId)?.emailAddress;
    
    if (!email) {
      throw new Error('Clerk user has no email address');
    }
    displayName = clerkUser.username || clerkUser.firstName || clerkUser.lastName || null;
  }

  // Validate email domain - CRITICAL: Block non-Scaler domains
  if (!isAllowedDomain(email)) {
    // Delete the Clerk user to prevent them from appearing in Clerk dashboard
    try {
      const clerk = getClerkClient();
      await clerk.users.deleteUser(externalId);
      console.log(`🚫 Deleted unauthorized Clerk user: ${email}`);
    } catch (deleteError) {
      console.error('Failed to delete unauthorized Clerk user:', deleteError);
    }
    throw new Error('Access restricted to Scaler email addresses only (@scaler.com or @sst.scaler.com)');
  }

  // First, try to find by clerk_id (most common case, uses index)
  const [existingByClerkId] = await db.select().from(users).where(eq(users.clerkId, externalId)).limit(1);
  if (existingByClerkId) {
    // Only update if email or username changed, or lastLogin is old (> 1 hour)
    const needsUpdate = 
      existingByClerkId.email !== email || 
      existingByClerkId.username !== displayName ||
      !existingByClerkId.lastLogin ||
      (Date.now() - new Date(existingByClerkId.lastLogin).getTime()) > 3600000; // 1 hour

    if (needsUpdate) {
      const [updated] = await db
        .update(users)
        .set({
          email,
          username: displayName ?? existingByClerkId.username,
          lastLogin: new Date(),
        })
        .where(eq(users.id, existingByClerkId.id!))
        .returning();

      return mapUser(updated ?? existingByClerkId);
    }
    
    // No update needed, return existing user
    return mapUser(existingByClerkId);
  }

  // If not found by clerk_id, check if email exists (uses index)
  const [existingByEmail] = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existingByEmail) {
    // Update the existing user with the new clerk_id
    const [updated] = await db
      .update(users)
      .set({
        clerkId: externalId,
        username: displayName ?? existingByEmail.username,
        lastLogin: new Date(),
      })
      .where(eq(users.id, existingByEmail.id!))
      .returning();

    return mapUser(updated);
  }

  // Create new user
  const [created] = await db
    .insert(users)
    .values({
      clerkId: externalId,
      email,
      username: displayName,
      role: 'user',
      lastLogin: new Date(),
    })
    .returning();

  return mapUser(created);
}
