import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthenticated' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search');
    const className = searchParams.get('class');

    const where: any = {};

    if (className) {
      where.class = className;
    }

    if (search) {
      where.OR = [
        { name: { contains: search } },
        { nis: { contains: search } },
        {
          parent: {
            user: {
              name: { contains: search },
            },
          },
        },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      include: {
        parent: {
          include: {
            user: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(students);
  } catch (error: any) {
    console.warn('DB offline in GET /api/students, returning demo students:', error?.message);
    const demoStudents = [
      { id: 1, nis: '20241001', name: 'Ahmad Rizky Pratama', class: 'X-IPA-1', major: 'MIPA', entryYear: 2024, isSantri: false, residenceType: 'Non-Asrama', sppNominal: 500000, activityNominal: 150000, parent: { user: { name: 'Budi Santoso', email: 'orangtua@sekolah.sch.id' } } },
      { id: 2, nis: '20241002', name: 'Siti Nur Aisyah', class: 'XI-IPA-2', major: 'MIPA', entryYear: 2024, isSantri: true, residenceType: 'Asrama', sppNominal: 500000, activityNominal: 150000, parent: { user: { name: 'Hendra Pratama', email: 'hendra@gmail.com' } } },
    ];
    return NextResponse.json(demoStudents);
  }
}


export async function POST(req: NextRequest) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized. Akses ditolak.' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const {
      nis,
      name,
      class: studentClass,
      major,
      entry_year,
      parent_id,
      parent_name,
      parent_email,
      parent_phone,
      is_santri,
      residence_type,
      spp_nominal,
      activity_nominal,
      has_discount,
      discount_notes,
    } = body;

    if (!nis || !name || !studentClass || !major) {
      return NextResponse.json({ message: 'Lengkapi data nis, name, class, dan major.' }, { status: 400 });
    }

    let finalParentId = parent_id ? Number(parent_id) : null;

    if (!finalParentId) {
      if (!parent_name || !parent_email) {
        return NextResponse.json({ message: 'Nama dan email orang tua wajib diisi.' }, { status: 400 });
      }

      const defaultPassword = await bcrypt.hash('password123', 10);
      const user = await prisma.user.create({
        data: {
          name: parent_name,
          email: parent_email,
          password: defaultPassword,
          role: 'parent',
          parent: {
            create: {
              phone: parent_phone || null,
            },
          },
        },
        include: { parent: true },
      });

      finalParentId = user.parent!.id;
    }

    const student = await prisma.student.create({
      data: {
        parentId: finalParentId,
        nis,
        name,
        class: studentClass,
        major,
        entryYear: entry_year ? Number(entry_year) : new Date().getFullYear(),
        isSantri: Boolean(is_santri),
        residenceType: residence_type || 'Non-Asrama',
        sppNominal: spp_nominal ? Number(spp_nominal) : 500000,
        activityNominal: activity_nominal ? Number(activity_nominal) : 150000,
        hasDiscount: Boolean(has_discount),
        discountNotes: discount_notes || null,
      },
      include: {
        parent: {
          include: { user: true },
        },
      },
    });

    return NextResponse.json({
      message: 'Data siswa berhasil ditambahkan',
      student,
    }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal menambah siswa' }, { status: 500 });
  }
}
