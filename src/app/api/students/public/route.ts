import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get('search') || '';

    const where: any = {};

    if (search.trim()) {
      where.OR = [
        { name: { contains: search.trim() } },
        { nis: { contains: search.trim() } },
        { class: { contains: search.trim() } },
      ];
    }

    const students = await prisma.student.findMany({
      where,
      select: {
        id: true,
        nis: true,
        name: true,
        class: true,
        major: true,
        entryYear: true,
        parentId: true,
      },
      orderBy: [
        { name: 'asc' },
      ],
      take: 20, // limit to max 20 results for quick UI search
    });

    const formattedStudents = students.map((s: any) => ({
      id: s.id,
      nis: s.nis,
      name: s.name,
      class: s.class,
      major: s.major,
      entryYear: s.entryYear,
      hasParent: !!s.parentId,
    }));

    return NextResponse.json(formattedStudents);
  } catch (error: any) {
    console.warn('Error/DB offline in GET /api/students/public, returning demo students:', error?.message);

    const { searchParams } = new URL(req.url);
    const search = (searchParams.get('search') || '').toLowerCase().trim();

    const demoStudents = [
      { id: 1, nis: '20241001', name: 'Ahmad Rizky Pratama', class: 'X-IPA-1', major: 'MIPA', entryYear: 2024, hasParent: true },
      { id: 2, nis: '20241002', name: 'Siti Nur Aisyah', class: 'XI-IPA-2', major: 'MIPA', entryYear: 2024, hasParent: false },
      { id: 3, nis: '20241003', name: 'Muhammad Al-Fatih', class: 'XII-IPS-1', major: 'IPS', entryYear: 2023, hasParent: true },
      { id: 4, nis: '20241004', name: 'Nabila Putri Cahyani', class: 'X-IPA-2', major: 'MIPA', entryYear: 2024, hasParent: false },
    ];

    if (!search) return NextResponse.json(demoStudents);

    const filtered = demoStudents.filter(
      (s) =>
        s.name.toLowerCase().includes(search) ||
        s.nis.toLowerCase().includes(search) ||
        s.class.toLowerCase().includes(search)
    );

    return NextResponse.json(filtered);
  }
}

