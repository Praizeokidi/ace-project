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
    const formData = await req.formData();
    const payload: Record<string, any> = {};
    const training_types: string[] = [];
    const audience: string[] = [];
    const topics: string[] = [];
    
    let email = '';
    let name = '';
    let organization = '';

    formData.forEach((value, key) => {
      if (key === 'training_types[]') {
        training_types.push(value.toString());
      } else if (key === 'audience[]') {
        audience.push(value.toString());
      } else if (key === 'topics[]') {
        topics.push(value.toString());
      } else if (key === 'business_email') {
        email = value.toString();
        payload[key] = value.toString();
      } else if (key === 'full_name') {
        name = value.toString();
        payload[key] = value.toString();
      } else if (key === 'organisation') {
        organization = value.toString();
        payload[key] = value.toString();
      } else {
        payload[key] = value.toString();
      }
    });
    
    if (training_types.length > 0) payload.training_types = training_types;
    if (audience.length > 0) payload.audience = audience;
    if (topics.length > 0) payload.topics = topics;

    // Validation
    const requiredFields = ['full_name', 'organisation', 'job_title', 'business_email', 'telephone', 'country', 'participants', 'delivery_format', 'experience_level', 'training_objectives', 'privacy_consent'];
    for (const field of requiredFields) {
      if (!payload[field]) {
        return NextResponse.json({ ok: false, error: `Missing required field: ${field}` }, { status: 400, headers: corsHeaders });
      }
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({ ok: false, error: 'Invalid email format' }, { status: 400, headers: corsHeaders });
    }

    // Launch mode is intentionally email-only: no database is required for public submissions.
    const reference = generateReference('TRN');
    await sendSubmissionEmail({ reference, type: 'DPIA training', replyTo: email, text: `DPIA training submission\n\nReference: ${reference}\n\n${JSON.stringify(payload, null, 2)}` });
    return NextResponse.json({ ok: true, reference, whatsappUrl: buildWhatsAppUrl(reference, 'DPIA training') }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('DPIA Training submission error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
