import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const teacherId = Number(id);

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return NextResponse.json({ message: 'Guru tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(teacher);
  } catch (error: any) {
    console.warn('DB offline in GET /api/teachers/[id], returning demo teacher:', error?.message);
    const { id } = await params;
    return NextResponse.json({
      id: Number(id),
      nip: 'GURU-0001',
      name: 'Drs. H. Ahmad Wijaya, M.Pd',
      subject: 'Matematika',
      email: 'guru@sekolah.sch.id',
      phone: '081234567891',
      status: 'Aktif',
    });
  }
}


export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const teacherId = Number(id);
    const body = await req.json();
    const { nip, name, subject, phone, email, status } = body;

    if (!nip || !name || !subject) {
      return NextResponse.json(
        { message: 'NIP, Nama Guru, dan Mata Pelajaran wajib diisi.' },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.update({
      where: { id: teacherId },
      data: {
        nip,
        name,
        subject,
        phone: phone || null,
        email: email || null,
        status: status || 'Aktif',
      },
    });

    return NextResponse.json({ message: 'Data guru berhasil diperbarui', teacher });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal memperbarui data guru' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { id } = await params;
    const teacherId = Number(id);

    await prisma.teacher.delete({
      where: { id: teacherId },
    });

    return NextResponse.json({ message: 'Data guru berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal menghapus data guru' },
      { status: 500 }
    );
  }
}
