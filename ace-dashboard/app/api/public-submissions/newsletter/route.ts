import { NextRequest, NextResponse } from 'next/server';
import { createSubmissionFromForm } from '@/lib/submissions';
import { sendSubmissionEmail } from '@/lib/notifications';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-forwarded-for, x-real-ip',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const payload: Record<string, any> = {};
    
    let email = '';

    formData.forEach((value, key) => {
      if (key === 'email') {
        email = value.toString();
      }
      payload[key] = value.toString();
    });
    
    // Validation
    if (!email) {
      return NextResponse.json({ ok: false, error: 'Missing required field: email' }, { status: 400, headers: corsHeaders });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email format' }, { status: 400, headers: corsHeaders });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';

    const result = await createSubmissionFromForm({
      type: 'PRIORITY_LIST',
      email,
      name: 'Newsletter subscriber',
      organization: 'ACE website updates',
      payload,
      source_ip_hash: ip,
    });

    await sendSubmissionEmail({
      reference: result.reference,
      type: 'newsletter subscription',
      replyTo: email,
      text: `New ACE newsletter subscription\n\nReference: ${result.reference}\nEmail: ${email}`,
    });

    return NextResponse.json({ ok: true, reference: result.reference || 'SUBMITTED' }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Newsletter submission error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
