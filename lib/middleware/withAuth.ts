import { NextRequest } from 'next/server';
import { applyRateLimit, adminLimiterOptions, generalLimiterOptions, type RateLimitOptions } from './rateLimit';
import { requireAuth, requireAdmin, requireSuperAdmin } from './auth';
import { requireAllowedDomain } from './domain';
import type { AuthenticatedUser } from '../types/index';

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
    requireSuperAdmin: needsSuperAdmin = false,
    enforceDomain = true,
  } = options;

  await applyRateLimit(request, rateLimitOptions);

  const user = await requireAuth(request, { enforceDomain });

  if (enforceDomain) {
    requireAllowedDomain(user);
  }

  if (needsSuperAdmin) {
    requireSuperAdmin(user);
  } else {
    requireAdmin(user);
  }

  return user;
}

