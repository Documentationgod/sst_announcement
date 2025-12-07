import { NextRequest } from 'next/server';
import type { AuthenticatedUser, UserRole } from '../types/index';
import { ForbiddenError, UnauthorizedError } from '../utils/errors';
import { requireAllowedDomain } from './domain';
import { syncClerkUser, verifyClerkToken } from '../services/clerk';
import { normalizeUserRole } from '../utils/roleUtils';

export function extractBearerToken(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (!authHeader) {
    return null;
  }

  if (authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

function extractSessionCookie(request: NextRequest): string | null {
  const sessionCookie = request.cookies.get('__session');
  return sessionCookie?.value || null;
}

export async function getUserFromRequest(request: NextRequest): Promise<AuthenticatedUser | null> {
  const token = extractBearerToken(request) ?? extractSessionCookie(request);
  
  if (!token) {
    return null;
  }

  const claims = await verifyClerkToken(token);
  
  if (!claims) {
    return null;
  }

  const user = await syncClerkUser(claims);
  
  return user;
}

export async function requireAuth(request: NextRequest, options?: { enforceDomain?: boolean }): Promise<AuthenticatedUser> {
  const user = await getUserFromRequest(request);
  if (!user) {
    throw new UnauthorizedError('Authentication required');
  }

  if (options?.enforceDomain) {
    requireAllowedDomain(user);
  }

  return user;
}

export function requireRole(user: AuthenticatedUser, role: UserRole): void {
  const hierarchy: Record<UserRole, number> = {
    student: 1,
    student_admin: 2,  
    admin: 2,          
    super_admin: 3,
  };

  const normalizedUserRole = normalizeUserRole(user.role, (user as any).is_admin);
  const userRoleLevel = hierarchy[normalizedUserRole] ?? 1;
  if (userRoleLevel < hierarchy[role]) {
    throw new ForbiddenError(`This resource requires ${role} role or higher`);
  }
}

export function hasAdminAccess(user: AuthenticatedUser): boolean {
  const normalizedRole = normalizeUserRole(user.role, (user as any).is_admin);
  return ['student_admin', 'admin', 'super_admin'].includes(normalizedRole);
}

export function hasAnnouncementPriority(user: AuthenticatedUser, targetRole: UserRole): boolean {
  const announcementPriority: Record<UserRole, number> = {
    student: 1,
    student_admin: 2,
    admin: 3,          
    super_admin: 4,
  };
  
  const normalizedUserRole = normalizeUserRole(user.role, (user as any).is_admin);
  const userPriority = announcementPriority[normalizedUserRole] ?? 1;
  const targetPriority = announcementPriority[targetRole] ?? 1;
  return userPriority > targetPriority;
}

export function requireAdmin(user: AuthenticatedUser): void {
  if (!hasAdminAccess(user)) {
    throw new ForbiddenError('This resource requires admin access');
  }
}

export function requireStudentAdmin(user: AuthenticatedUser): void {
  requireRole(user, 'student_admin');
}

export function requireSuperAdmin(user: AuthenticatedUser): void {
  requireRole(user, 'super_admin');
}
