import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/withAuth';
import { adminLimiterOptions } from '@/lib/middleware/rateLimit';
import { updateUserRole, getUserById } from '@/lib/data/users';
import { BadRequestError, NotFoundError } from '@/lib/utils/errors';
import { parseId } from '@/lib/utils/validation';
import type { UserRole } from '@/lib/types/index';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request, {
      rateLimitOptions: adminLimiterOptions,
      requireSuperAdmin: true,
      enforceDomain: true,
    }); 

    const { id: idParam } = await params;
    const id = parseId(idParam, 'User ID');
    const body = await request.json();

    if (!body.role || typeof body.role !== 'string') {
      throw new BadRequestError('Role is required and must be a string');
    }

    const validRoles: UserRole[] = ['student', 'student_admin', 'admin', 'super_admin'];
    if (!validRoles.includes(body.role as UserRole)) {
      throw new BadRequestError(`Role must be one of: ${validRoles.join(', ')}`);
    }

    // Check if user exists
    const targetUser = await getUserById(id);
    if (!targetUser) {
      throw new NotFoundError('User', id);
    }

    const updatedUser = await updateUserRole(id, body.role as UserRole);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User role updated to ${body.role}`,
    });

  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Internal server error',
      },
      { status: error.status || 500 }
    );
  }
}


