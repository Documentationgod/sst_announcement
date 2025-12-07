import { NextRequest } from 'next/server';
import { applyRateLimit, adminLimiterOptions, generalLimiterOptions, type RateLimitOptions } from './rateLimit';
import { requireAuth, requireAdmin, requireSuperAdmin, type AuthenticatedUser } from './auth';
import { requireAllowedDomain } from './domain';

interface AuthOptions {
  rateLimitOptions?: RateLimitOptions;
  requireSuperAdmin?: boolean;
  enforceDomain?: boolean;
}

export async function authenticateRequest(
  request: NextRequest,
  options: AuthOptions = {}
): Promise<AuthenticatedUser> {
  const {
    rateLimitOptions = adminLimiterOptions,
    requireSuperAdmin = false,
    enforceDomain = true,
  } = options;

  await applyRateLimit(request, rateLimitOptions);

  const user = await requireAuth(request, { enforceDomain });

  if (enforceDomain) {
    requireAllowedDomain(user);
  }

  if (requireSuperAdmin) {
    requireSuperAdmin(user);
  } else {
    requireAdmin(user);
  }

  return user;
}

