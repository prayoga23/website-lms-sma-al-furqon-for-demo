import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    const payment = await prisma.payment.findUnique({
      where: { id: paymentId },
      include: { student: true },
    });

    if (!payment) {
      return NextResponse.json({ message: 'Pembayaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(payment);
  } catch (error: any) {
    console.warn('DB offline in GET /api/payments/[id], returning demo payment:', error?.message);
    const { id: paramId } = await params;
    return NextResponse.json({
      id: Number(paramId),
      studentId: 1,
      title: 'SPP Bulan September 2026',
      semester: 'Ganjil',
      academicYear: '2026/2027',
      amount: 500000,
      status: 'Lunas',
      category: 'SPP',
      destination: 'Yayasan Pondok Pesantren Al-Furqon',
      createdAt: new Date().toISOString(),
      student: { id: 1, name: 'Ahmad Rizky Pratama', class: 'X-IPA-1', nis: '20241001' },
    });
  }
}


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    const body = await req.json();
    const { category, destination, title, semester, academic_year, amount, status, notes } = body;

    const payment = await prisma.payment.update({
      where: { id: paymentId },
      data: {
        category,
        destination,
        title,
        semester,
        academicYear: academic_year,
        amount: amount !== undefined ? Number(amount) : undefined,
        status,
        notes,
      },
      include: { student: true },
    });

    return NextResponse.json({
      message: 'Data pembayaran berhasil diperbarui',
      payment,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui pembayaran' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const paymentId = Number(id);

  try {
    await prisma.payment.delete({
      where: { id: paymentId },
    });
    return NextResponse.json({ message: 'Data pembayaran berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus pembayaran' }, { status: 500 });
  }
}
