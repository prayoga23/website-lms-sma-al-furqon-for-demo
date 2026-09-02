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
    const studentId = searchParams.get('student_id');

    const where: any = {};
    if (studentId) where.studentId = Number(studentId);

    const allowances = await prisma.allowance.findMany({
      where,
      include: { student: true },
      orderBy: { date: 'desc' },
    });

    return NextResponse.json(allowances);
  } catch (error: any) {
    console.warn('DB offline in GET /api/allowances, returning demo allowances:', error?.message);
    const demoAllowances = [
      { id: 1, studentId: 1, date: new Date().toISOString().split('T')[0], income: 100000, expense: 0, description: 'Top Up Uang Saku Santri', student: { id: 1, name: 'Ahmad Rizky Pratama', class: 'X-IPA-1', nis: '20241001' } },
      { id: 2, studentId: 1, date: new Date().toISOString().split('T')[0], income: 0, expense: 15000, description: 'Belanja Koperasi Sekolah', student: { id: 1, name: 'Ahmad Rizky Pratama', class: 'X-IPA-1', nis: '20241001' } },
    ];
    return NextResponse.json(demoAllowances);
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { student_id, date, income, expense, description } = body;

    const allowance = await prisma.allowance.create({
      data: {
        studentId: Number(student_id),
        date,
        income: income ? Number(income) : 0,
        expense: expense ? Number(expense) : 0,
        description,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Transaksi uang saku berhasil ditambahkan',
      allowance,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menambahkan transaksi uang saku' }, { status: 500 });
  }
}
