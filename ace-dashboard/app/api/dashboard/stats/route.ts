import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const [totalSubmissions, byType, byStatus] = await Promise.all([
      prisma.submission.count(),
      prisma.submission.groupBy({
        by: ['type'],
        _count: { type: true },
      }),
      prisma.submission.groupBy({
        by: ['status'],
        _count: { status: true },
      }),
    ]);

    // Format grouped data
    const breakdownByType = byType.reduce((acc: any, curr) => {
      acc[curr.type] = curr._count.type;
      return acc;
    }, {});

    const breakdownByStatus = byStatus.reduce((acc: any, curr) => {
      acc[curr.status] = curr._count.status;
      return acc;
    }, {});

    // Recent count (e.g. last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentCount = await prisma.submission.count({
      where: {
        received_at: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Conversion rate placeholder (or calculate based on page views if you track them)
    // Here we'll return a static or derived placeholder, as conversion typically requires analytics integration
    const conversionRate = totalSubmissions > 0 ? 'N/A (Requires analytics)' : '0%';

    return NextResponse.json({
      totalSubmissions,
      breakdownByType,
      breakdownByStatus,
      recentCount,
      conversionRate,
    });
  } catch (error: any) {
    console.error('Failed to fetch stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
