import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);

  try {
    const student = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    if (!student) {
      return NextResponse.json({ message: 'Siswa tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(student);
  } catch (error: any) {
    console.warn('DB offline in GET /api/students/[id], returning demo student:', error?.message);
    return NextResponse.json({
      id: studentId,
      nis: '20241001',
      name: 'Ahmad Rizky Pratama',
      class: 'X-IPA-1',
      major: 'MIPA',
      entryYear: 2024,
      isSantri: false,
      residenceType: 'Non-Asrama',
      sppNominal: 500000,
      activityNominal: 150000,
      parent: { user: { name: 'Budi Santoso', email: 'orangtua@sekolah.sch.id' }, phone: '081234567890' },
    });
  }
}


export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);

  try {
    const body = await req.json();
    const {
      nis,
      name,
      class: studentClass,
      major,
      entry_year,
      parent_name,
      parent_phone,
      is_santri,
      residence_type,
      spp_nominal,
      activity_nominal,
      has_discount,
      discount_notes,
    } = body;

    const student = await prisma.student.update({
      where: { id: studentId },
      data: {
        nis,
        name,
        class: studentClass,
        major,
        entryYear: entry_year ? Number(entry_year) : undefined,
        isSantri: is_santri !== undefined ? Boolean(is_santri) : undefined,
        residenceType: residence_type !== undefined ? residence_type : undefined,
        sppNominal: spp_nominal !== undefined ? Number(spp_nominal) : undefined,
        activityNominal: activity_nominal !== undefined ? Number(activity_nominal) : undefined,
        hasDiscount: has_discount !== undefined ? Boolean(has_discount) : undefined,
        discountNotes: discount_notes !== undefined ? discount_notes : undefined,
      },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    if (student.parent) {
      if (parent_phone !== undefined) {
        await prisma.parents.update({
          where: { id: student.parent.id },
          data: { phone: parent_phone },
        });
      }
      if (parent_name !== undefined && student.parent.user) {
        await prisma.user.update({
          where: { id: student.parent.user.id },
          data: { name: parent_name },
        });
      }
    }

    const updatedStudent = await prisma.student.findUnique({
      where: { id: studentId },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Data siswa berhasil diperbarui',
      student: updatedStudent,
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui siswa' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const studentId = Number(id);

  try {
    await prisma.student.delete({
      where: { id: studentId },
    });
    return NextResponse.json({ message: 'Data siswa berhasil dihapus' });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menghapus siswa' }, { status: 500 });
  }
}
