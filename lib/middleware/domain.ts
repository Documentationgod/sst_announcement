import type { AuthenticatedUser } from '../types/index';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';

// CRITICAL: Only these email domains are allowed
const ALLOWED_DOMAINS = ['scaler.com', 'sst.scaler.com'];

export function getEmailDomain(email: string): string | null {
  if (!email || typeof email !== 'string') {
    return null;
  }
  const parts = email.split('@');
  if (parts.length !== 2) {
    return null;
  }
  return parts[1].toLowerCase();
}

export function isAllowedDomain(email: string): boolean {
  const domain = getEmailDomain(email);
  return domain ? ALLOWED_DOMAINS.includes(domain) : false;
}

export function requireAllowedDomain(user: AuthenticatedUser | null | undefined): asserts user is AuthenticatedUser {
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (!user.email) {
    throw new ForbiddenError('Invalid user: Email address is required');
  }

  if (!isAllowedDomain(user.email)) {
    const domain = getEmailDomain(user.email);
    throw new ForbiddenError(
      `Access denied. Only Scaler email addresses are allowed (@scaler.com or @sst.scaler.com). Your email domain: @${domain}`
    );
  }
}
