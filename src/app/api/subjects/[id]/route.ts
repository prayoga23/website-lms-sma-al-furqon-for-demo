import { NextRequest, NextResponse } from 'next/server';
import { customSubjects } from '@/lib/subjects-data';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const subId = Number(id);

  const subject = customSubjects.find((s) => s.id === subId);
  if (!subject) {
    return NextResponse.json({ message: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
  }

  return NextResponse.json(subject);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const subId = Number(id);

  const index = customSubjects.findIndex((s) => s.id === subId);
  if (index === -1) {
    return NextResponse.json({ message: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
  }

  try {
    const body = await req.json();
    const { code, name, category, kkm, jp, status, description } = body;

    customSubjects[index] = {
      ...customSubjects[index],
      code: code || customSubjects[index].code,
      name: name || customSubjects[index].name,
      category: category || customSubjects[index].category,
      kkm: kkm !== undefined ? Number(kkm) : customSubjects[index].kkm,
      jp: jp !== undefined ? Number(jp) : customSubjects[index].jp,
      status: status || customSubjects[index].status,
      description: description !== undefined ? description : customSubjects[index].description,
    };

    return NextResponse.json({
      message: 'Data mata pelajaran berhasil diperbarui',
      subject: customSubjects[index],
    });
  } catch (error: any) {
    return NextResponse.json({ message: error.message || 'Gagal memperbarui mata pelajaran' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const auth = getAuthUser(req);
  if (!auth || !['admin', 'guru', 'staff'].includes(auth.role)) {
    return NextResponse.json({ message: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await params;
  const subId = Number(id);

  const index = customSubjects.findIndex((s) => s.id === subId);
  if (index === -1) {
    return NextResponse.json({ message: 'Mata pelajaran tidak ditemukan' }, { status: 404 });
  }

  customSubjects.splice(index, 1);
  return NextResponse.json({ message: 'Mata pelajaran berhasil dihapus' });
}
