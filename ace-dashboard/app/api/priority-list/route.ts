import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    
    // Honeypot check
    const honeypot = formData.get('website') as string;
    if (honeypot) {
      // Bot detected, pretend it succeeded
      return NextResponse.json({ ok: true });
    }

    const firstName = formData.get('first_name') as string;
    const organisationName = formData.get('organisation') as string;
    const email = formData.get('email') as string;
    const sourcePage = formData.get('source_page') as string;
    const updatesConsent = formData.get('updates_consent') === 'yes';

    const reference = `ACE-PRI-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;

    // Here you would connect to Prisma as shown in the consultation route
    // await prisma.submission.create({ ... })
    
    return NextResponse.json({ ok: true, reference });
  } catch (error: any) {
    console.error('Error processing priority list:', error);
    return NextResponse.json({ ok: false, error: 'Failed to process submission' }, { status: 500 });
  }
}
