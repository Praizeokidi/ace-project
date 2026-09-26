import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const email = formData.get('email') as string;

    const reference = `ACE-NL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Here you would connect to Prisma to record the newsletter sign up
    // await prisma.submission.create({ ... })

    return NextResponse.json({ ok: true, reference });
  } catch (error: any) {
    console.error('Error processing newsletter:', error);
    return NextResponse.json({ ok: false, error: 'Failed to process submission' }, { status: 500 });
  }
}
