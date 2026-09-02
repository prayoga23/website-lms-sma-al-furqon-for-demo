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

  let items: any[] = [];
  try {
    const where: any = {};
    if (category) where.category = category;

    items = await prisma.academicInformation.findMany({
      where,
      orderBy: { date: 'desc' },
    });
  } catch (error: any) {
    console.warn('DB offline in GET /api/academic, returning demo items:', error?.message);
    items = [
      { id: 1, title: 'Pengumuman Pelaksanaan UTS Ganjil', category: 'Pengumuman', description: 'UTS Ganjil dilaksanakan mulai 15 September 2026.', date: '2026-09-01' },
      { id: 2, title: 'Jadwal Ujian Tengah Semester (UTS)', category: 'Jadwal Ujian', description: 'Jadwal UTS dapat diunduh pada portal.', date: '2026-09-01' },
      { id: 3, title: 'Kegiatan Ekstrakurikuler Wajib', category: 'Kegiatan', description: 'Kegiatan ekskul pramuka dan seni.', date: '2026-08-28' },
    ];
  }

  const grouped = {
    jadwal_pelajaran: items.filter((i: any) => i.category === 'Jadwal Pelajaran'),
    jadwal_ujian: items.filter((i: any) => i.category === 'Jadwal Ujian'),
    prestasi: items.filter((i: any) => i.category === 'Prestasi'),
    kegiatan: items.filter((i: any) => i.category === 'Kegiatan'),
    pengumuman: items.filter((i: any) => i.category === 'Pengumuman'),
    all: items,
  };

  return NextResponse.json(grouped);
}

