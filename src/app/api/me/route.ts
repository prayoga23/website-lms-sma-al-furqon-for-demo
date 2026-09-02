import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const user = await prisma.user.findUnique({
      where: { id: auth.id },
      include: {
        parent: {
          include: {
            students: true,
          },
        },
      },
    });

    if (user) {
      const { password, ...userWithoutPassword } = user;
      return NextResponse.json({ user: userWithoutPassword });
    }
  } catch (dbErr) {
    console.warn('DB offline in /api/me, returning token user payload:', dbErr);
  }

  // Fallback if DB is disconnected/unreachable or user not in DB
  return NextResponse.json({
    user: {
      id: auth.id,
      name: (auth as any).name || (auth.role === 'admin' ? 'Administrator Sekolah' : auth.role === 'guru' ? 'Drs. H. Ahmad Wijaya, M.Pd' : auth.role === 'staff' ? 'Siti Rahmawati, S.Kom' : 'Budi Santoso'),
      email: auth.email,
      role: auth.role,
      parent: auth.role === 'parent' ? { id: auth.parentId || 1, phone: '081234567890', students: [] } : null,
    },
  });
}

