import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');

  const where: any = {};
  if (category) where.category = category;

  try {
    const items = await prisma.academicInformation.findMany({
      where,
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(items);
  } catch (error: any) {
    console.error('Error GET /api/academics:', error);
    try {
      const fallbackItems = await prisma.academicInformation.findMany({
        where,
        orderBy: { date: 'desc' },
      });
      return NextResponse.json(fallbackItems);
    } catch (fallbackError: any) {
      console.warn('DB offline in GET /api/academics, returning demo items:', fallbackError?.message);
      const demoAcademics = [
        { id: 1, title: 'Pengumuman Pelaksanaan UTS Ganjil 2026/2027', category: 'Pengumuman', description: 'Ujian Tengah Semester (UTS) akan dilaksanakan secara serentak mulai tanggal 15 September 2026.', date: '2026-09-01', createdBy: { name: 'Administrator Sekolah' } },
        { id: 2, title: 'Jadwal Kegiatan Ekstrakurikuler & Pramuka', category: 'Kegiatan', description: 'Seluruh siswa kelas X dan XI wajib mengikuti kegiatan ekstrakurikuler pilihan.', date: '2026-08-28', createdBy: { name: 'Drs. H. Ahmad Wijaya, M.Pd' } },
      ];
      return NextResponse.json(demoAcademics);
    }
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { title, category, description, date, imageUrl } = body;

    let validCreatedById: number | null = null;
    if (auth.id) {
      const existingUser = await prisma.user.findUnique({
        where: { id: auth.id },
        select: { id: true },
      });
      if (existingUser) {
        validCreatedById = existingUser.id;
      }
    }

    const academic = await prisma.academicInformation.create({
      data: {
        title,
        category,
        description,
        date,
        imageUrl: imageUrl || null,
        createdById: validCreatedById,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Informasi akademik berhasil ditambahkan',
      academic,
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error POST /api/academics:', error);
    return NextResponse.json({ message: error.message || 'Gagal menambahkan informasi akademik' }, { status: 500 });
  }
}


