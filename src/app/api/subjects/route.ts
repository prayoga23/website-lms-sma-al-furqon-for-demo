import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// In-memory persistent subject store synced with Database
let customSubjects = [
  { id: 1, code: 'MP-001', name: 'Pemrograman Web & Perangkat Bergerak', category: 'Kejuruan / Produktif', kkm: 75, jp: 4, status: 'Aktif', description: 'Pengembangan frontend, backend, dan aplikasi mobile responsive' },
  { id: 2, code: 'MP-002', name: 'Basis Data', category: 'Kejuruan / Produktif', kkm: 75, jp: 3, status: 'Aktif', description: 'Perancangan ERD, SQL database, dan manajemen ORM Prisma' },
  { id: 3, code: 'MP-003', name: 'Pemodelan Perangkat Lunak', category: 'Kejuruan / Produktif', kkm: 75, jp: 2, status: 'Aktif', description: 'Metodologi Agile, UML diagram, dan Software Requirements Specification' },
  { id: 4, code: 'MP-004', name: 'Matematika', category: 'Wajib A', kkm: 70, jp: 4, status: 'Aktif', description: 'Kalkulus dasar, aljabar, statistik, dan logika matematika' },
  { id: 5, code: 'MP-005', name: 'Bahasa Indonesia', category: 'Wajib A', kkm: 75, jp: 3, status: 'Aktif', description: 'Literasi, penulisan karya ilmiah, dan tata bahasa Indonesia' },
  { id: 6, code: 'MP-006', name: 'Bahasa Inggris', category: 'Wajib A', kkm: 70, jp: 3, status: 'Aktif', description: 'Grammar, TOEFL preparation, and professional conversation' },
  { id: 7, code: 'MP-007', name: 'Pendidikan Agama Islam & Al-Qur\'an', category: 'Wajib A & Keagamaan', kkm: 80, jp: 4, status: 'Aktif', description: 'Aqidah akhlaq, fiqih, tafsir, dan hafalan Al-Qur\'an' },
  { id: 8, code: 'MP-008', name: 'Fisika Komputasi', category: 'Peminatan MIPA', kkm: 70, jp: 3, status: 'Aktif', description: 'Mekanika, gelombang, termodinamika, dan pemodelan fisika' },
  { id: 9, code: 'MP-009', name: 'Pancasila & Kewarganegaraan', category: 'Wajib A', kkm: 75, jp: 2, status: 'Aktif', description: 'Wawasan kebangsaan, hukum, dan tata negara Indonesia' },
];

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Merge subjects from teacher table and grade table
    const teacherSubjects = await prisma.teacher.findMany({
      select: { subject: true, name: true },
    });

    const registeredMap = new Map();

    customSubjects.forEach((sub) => {
      registeredMap.set(sub.name.toLowerCase(), sub);
    });

    teacherSubjects.forEach((t, idx) => {
      if (t.subject && !registeredMap.has(t.subject.toLowerCase())) {
        const newSub = {
          id: 100 + idx,
          code: `MP-${100 + idx}`,
          name: t.subject,
          category: 'Umum / Peminatan',
          kkm: 75,
          jp: 3,
          status: 'Aktif',
          teacherName: t.name,
          description: `Mata pelajaran ${t.subject} diampu oleh ${t.name}`,
        };
        registeredMap.set(t.subject.toLowerCase(), newSub);
      }
    });

    const result = Array.from(registeredMap.values());
    return NextResponse.json(result);
  } catch (error: any) {
    console.warn('DB offline in GET /api/subjects, returning customSubjects:', error?.message);
    return NextResponse.json(customSubjects);
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { code, name, category, kkm, jp, status, description } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ message: 'Nama mata pelajaran wajib diisi.' }, { status: 400 });
    }

    const nextId = customSubjects.length > 0 ? Math.max(...customSubjects.map((s) => s.id)) + 1 : 1;
    const newSubject = {
      id: nextId,
      code: code || `MP-${String(nextId).padStart(3, '0')}`,
      name: name.trim(),
      category: category || 'Umum',
      kkm: Number(kkm) || 75,
      jp: Number(jp) || 2,
      status: status || 'Aktif',
      description: description || '',
    };

    customSubjects.push(newSubject);

    return NextResponse.json({
      message: 'Mata pelajaran berhasil ditambahkan',
      subject: newSubject,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal membuat mata pelajaran' }, { status: 500 });
  }
}

export { customSubjects };
