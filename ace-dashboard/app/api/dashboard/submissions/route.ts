import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma'; // Assuming standard prisma setup

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '10', 10);
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const skip = (page - 1) * limit;

    const where: any = {};
    if (type) where.type = type;
    if (status) where.status = status;
    
    if (search) {
      where.OR = [
        { reference: { contains: search, mode: 'insensitive' } },
        { contact: { full_name: { contains: search, mode: 'insensitive' } } },
        { contact: { email: { contains: search, mode: 'insensitive' } } },
        { organisation: { name: { contains: search, mode: 'insensitive' } } },
      ];
    }

    const [submissions, total] = await Promise.all([
      prisma.submission.findMany({
        where,
        skip,
        take: limit,
        orderBy: { received_at: 'desc' },
        include: { contact: true, organisation: true },
      }),
      prisma.submission.count({ where }),
    ]);

    return NextResponse.json({
      submissions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
    });
  } catch (error: any) {
    console.error('Failed to fetch submissions:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
