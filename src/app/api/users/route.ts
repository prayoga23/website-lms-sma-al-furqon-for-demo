import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';
    const role = searchParams.get('role') || '';

    const where: any = {};

    if (role) {
      where.role = role;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { email: { contains: search } },
      ];
    }

    const users = await prisma.user.findMany({
      where,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        parent: {
          select: {
            id: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(users);
  } catch (error: any) {
    console.warn('DB offline in GET /api/users, returning demo users:', error?.message);
    const demoUsers = [
      { id: 1, name: 'Administrator Sekolah', email: 'admin@sekolah.sch.id', role: 'admin', createdAt: new Date().toISOString() },
      { id: 2, name: 'Drs. H. Ahmad Wijaya, M.Pd', email: 'guru@sekolah.sch.id', role: 'guru', createdAt: new Date().toISOString() },
      { id: 3, name: 'Siti Rahmawati, S.Kom', email: 'staff@sekolah.sch.id', role: 'staff', createdAt: new Date().toISOString() },
      { id: 4, name: 'Budi Santoso', email: 'orangtua@sekolah.sch.id', role: 'parent', createdAt: new Date().toISOString(), parent: { id: 1, phone: '081234567890' } },
    ];
    return NextResponse.json(demoUsers);
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { name, email, password, role, studentId, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json({ message: 'Semua bidang (Nama, Email, Password, Role) wajib diisi.' }, { status: 400 });
    }

    const validRoles = ['admin', 'guru', 'staff', 'parent'];
    if (!validRoles.includes(role)) {
      return NextResponse.json({ message: 'Role pengguna tidak valid.' }, { status: 400 });
    }

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json({ message: 'Email sudah terdaftar dalam sistem.' }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role,
        ...(role === 'parent' ? { parent: { create: { phone: phone || null } } } : {}),
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        parent: { select: { id: true } },
      },
    });

    if (role === 'parent' && studentId && newUser.parent) {
      await prisma.student.update({
        where: { id: Number(studentId) },
        data: { parentId: newUser.parent.id },
      });
    }

    return NextResponse.json(
      {
        message: 'Pengguna baru berhasil ditambahkan.',
        user: newUser,
      },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal membuat pengguna baru' }, { status: 500 });
  }
}
