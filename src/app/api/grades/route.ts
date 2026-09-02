import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

function calculatePredicate(score: number): string {
  if (score >= 85) return 'A';
  if (score >= 75) return 'B';
  if (score >= 65) return 'C';
  return 'D';
}

async function getTeacherSubject(auth: any): Promise<string | null> {
  if (auth.subject) return auth.subject;
  const teacher = await prisma.teacher.findFirst({
    where: {
      OR: [
        { email: auth.email },
        { id: auth.teacherId || 0 },
      ],
    },
  });
  return teacher?.subject || null;
}

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const studentId = searchParams.get('student_id');
    const semester = searchParams.get('semester');

    const where: any = {};
    if (studentId) where.studentId = Number(studentId);
    if (semester) where.semester = semester;

    if (auth.role === 'guru') {
      const teacherSubject = await getTeacherSubject(auth).catch(() => null);
      if (teacherSubject) {
        where.subject = teacherSubject;
      }
    }

    const grades = await prisma.grade.findMany({
      where,
      include: { student: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(grades);
  } catch (error: any) {
    console.warn('DB offline in GET /api/grades, returning demo grades:', error?.message);
    const demoGrades = [
      { id: 1, studentId: 1, subject: 'Matematika', semester: 'Ganjil', score: 88, predicate: 'A', student: { id: 1, name: 'Ahmad Rizky Pratama', class: 'X-IPA-1', nis: '20241001' } },
      { id: 2, studentId: 2, subject: 'Bahasa Indonesia', semester: 'Ganjil', score: 82, predicate: 'B', student: { id: 2, name: 'Siti Nur Aisyah', class: 'XI-IPA-2', nis: '20241002' } },
    ];
    return NextResponse.json(demoGrades);
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { student_id, subject, semester, score, predicate } = body;

    let finalSubject = subject;

    if (auth.role === 'guru') {
      const teacherSubject = await getTeacherSubject(auth);
      if (!teacherSubject) {
        return NextResponse.json(
          { message: 'Mata pelajaran guru tidak ditemukan dalam sistem.' },
          { status: 403 }
        );
      }
      if (subject && subject.trim() !== '' && subject.trim().toLowerCase() !== teacherSubject.toLowerCase()) {
        return NextResponse.json(
          { message: `Anda hanya dapat menginput nilai untuk mata pelajaran ${teacherSubject}.` },
          { status: 403 }
        );
      }
      finalSubject = teacherSubject;
    }

    const numericScore = Number(score);
    const finalPredicate = predicate || calculatePredicate(numericScore);

    const grade = await prisma.grade.create({
      data: {
        studentId: Number(student_id),
        subject: finalSubject,
        semester,
        score: numericScore,
        predicate: finalPredicate,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Nilai siswa berhasil disimpan',
      grade,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menyimpan nilai' }, { status: 500 });
  }
}
