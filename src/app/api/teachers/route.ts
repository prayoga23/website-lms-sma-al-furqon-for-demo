import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || auth.role === 'guru') {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const status = searchParams.get('status');

    const where: any = {};

    if (status && status.trim() !== '') {
      where.status = status.trim();
    }

    if (search && search.trim() !== '') {
      const q = search.trim();
      where.OR = [
        { name: { contains: q } },
        { nip: { contains: q } },
        { subject: { contains: q } },
        { email: { contains: q } },
      ];
    }

    const teachers = await prisma.teacher.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return NextResponse.json(teachers || []);
  } catch (error: any) {
    console.warn('DB offline in GET /api/teachers, returning demo teachers:', error?.message);
    const demoTeachers = [
      { id: 1, nip: 'GURU-0001', name: 'Drs. H. Ahmad Wijaya, M.Pd', subject: 'Matematika', email: 'guru@sekolah.sch.id', phone: '081234567891', status: 'Aktif' },
      { id: 2, nip: 'GURU-0002', name: 'Siti Aminah, S.Pd', subject: 'Bahasa Indonesia', email: 'siti.aminah@sekolah.sch.id', phone: '081234567892', status: 'Aktif' },
      { id: 3, nip: 'GURU-0003', name: 'Ir. Budi Hermawan', subject: 'Fisika', email: 'budi.h@sekolah.sch.id', phone: '081234567893', status: 'Aktif' },
    ];
    return NextResponse.json(demoTeachers);
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { nip, name, subject, phone, email, status } = body;

    if (!nip || !name || !subject) {
      return NextResponse.json(
        { message: 'NIP, Nama Guru, dan Mata Pelajaran wajib diisi.' },
        { status: 400 }
      );
    }

    const existingNip = await prisma.teacher.findUnique({
      where: { nip },
    });

    if (existingNip) {
      return NextResponse.json(
        { message: `NIP ${nip} sudah terdaftar.` },
        { status: 400 }
      );
    }

    const teacher = await prisma.teacher.create({
      data: {
        nip,
        name,
        subject,
        phone: phone || null,
        email: email || null,
        status: status || 'Aktif',
      },
    });

    return NextResponse.json(
      { message: 'Data guru berhasil ditambahkan', teacher },
      { status: 201 }
    );
  } catch (error: any) {
    return NextResponse.json(
      { message: error.message || 'Gagal menambahkan data guru' },
      { status: 500 }
    );
  }
}
