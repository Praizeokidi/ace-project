import { NextRequest, NextResponse } from 'next/server';
import { sendSubmissionEmail, buildWhatsAppUrl } from '@/lib/notifications';
import { generateReference } from '@/lib/utils';

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
    const contentType = req.headers.get('content-type') || '';
    let payload: Record<string, any> = {};
    
    if (contentType.includes('application/json')) {
      payload = await req.json();
    } else if (contentType.includes('application/x-www-form-urlencoded')) {
      const text = await req.text();
      const params = new URLSearchParams(text);
      params.forEach((value, key) => {
        payload[key] = value;
      });
    } else if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    } else {
      return NextResponse.json({ ok: false, error: 'Unsupported content type' }, { status: 415, headers: corsHeaders });
    }

    // Honeypot check
    if (payload.website) {
      return NextResponse.json({ ok: true, reference: 'SILENT_OK' }, { status: 200, headers: corsHeaders });
    }

    const { first_name, organisation, email, source_page, updates_consent, ...rest } = payload;
    
    // Validation
    if (!first_name || !organisation || !email || !source_page) {
      return NextResponse.json({ ok: false, error: 'Missing required fields' }, { status: 400, headers: corsHeaders });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email format' }, { status: 400, headers: corsHeaders });
    }

    // Launch mode is intentionally email-only: no database is required for public submissions.
    const reference = generateReference('PRL');
    await sendSubmissionEmail({ reference, type: 'priority list', replyTo: email, text: `priority list submission\n\nReference: ${reference}\n\n${JSON.stringify(payload, null, 2)}` });
    return NextResponse.json({ ok: true, reference, whatsappUrl: buildWhatsAppUrl(reference, 'priority list') }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('Priority List submission error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
