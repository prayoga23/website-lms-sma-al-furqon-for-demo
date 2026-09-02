import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { customSubjects } from '@/lib/subjects-data';


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


