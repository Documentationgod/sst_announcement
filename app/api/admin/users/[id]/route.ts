import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/withAuth';
import { adminLimiterOptions } from '@/lib/middleware/rateLimit';
import { getUserById } from '@/lib/data/users';
import { NotFoundError } from '@/lib/utils/errors';
import { parseId } from '@/lib/utils/validation';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await authenticateRequest(request, {
      rateLimitOptions: adminLimiterOptions,
      enforceDomain: true,
    });

    const { id: idParam } = await params;
    const id = parseId(idParam, 'User ID');
    const targetUser = await getUserById(id);
    if (!targetUser) {
      throw new NotFoundError('User', id);
    }

    return NextResponse.json({ success: true, data: targetUser });

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


