import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const parents = await prisma.parents.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(parents);
  } catch (error: any) {
    console.warn('DB offline in GET /api/parents, returning demo parents:', error?.message);
    const demoParents = [
      { id: 1, phone: '081234567890', user: { id: 4, name: 'Budi Santoso', email: 'orangtua@sekolah.sch.id' } },
    ];
    return NextResponse.json(demoParents);
  }
}

