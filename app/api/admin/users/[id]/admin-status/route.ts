import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/withAuth';
import { adminLimiterOptions } from '@/lib/middleware/rateLimit';
import { updateUserAdminStatus, getUserById } from '@/lib/data/users';
import { BadRequestError, NotFoundError } from '@/lib/utils/errors';
import { parseId } from '@/lib/utils/validation';

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

    if (typeof body.is_admin !== 'boolean') {
      throw new BadRequestError('is_admin is required and must be a boolean');
    }

    // Check if user exists
    const targetUser = await getUserById(id);
    if (!targetUser) {
      throw new NotFoundError('User', id);
    }

    const updatedUser = await updateUserAdminStatus(id, body.is_admin);

    return NextResponse.json({
      success: true,
      data: updatedUser,
      message: `User admin status updated to ${body.is_admin ? 'admin' : 'student'}`,
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
