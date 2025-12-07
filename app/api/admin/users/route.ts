import { NextRequest, NextResponse } from 'next/server';
import { authenticateRequest } from '@/lib/middleware/withAuth';
import { adminLimiterOptions } from '@/lib/middleware/rateLimit';
import { getAllUsers } from '@/lib/data/users';

export async function GET(request: NextRequest) {
  try {
    const user = await authenticateRequest(request, {
      rateLimitOptions: adminLimiterOptions,
      enforceDomain: true,
    });

    // Get all users
    const users = await getAllUsers();
    let usersWithRoles = users.map((item: any) => ({
      ...item,
      role: item.role || 'student',
      role_display: item.role === 'super_admin' ? 'Super Admin' : 
                   item.role === 'admin' ? 'Admin' : 
                   item.role === 'student_admin' ? 'Student Admin' : 'Student',
    }));

    // Handle search functionality
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    
    if (email) {
      const searchResults = usersWithRoles.filter((user: any) => 
        user.email && user.email.toLowerCase().includes(email.toLowerCase())
      );
      
      return NextResponse.json({
        success: true,
        data: searchResults,
      });
    }

    return NextResponse.json({
      success: true,
      data: usersWithRoles,
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


