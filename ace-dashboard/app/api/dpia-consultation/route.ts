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
    const support_needs: string[] = [];
    
    let email = '';
    let name = '';
    let organization = '';

    formData.forEach((value, key) => {
      if (key === 'support_needs[]') {
        support_needs.push(value.toString());
      } else if (key === 'business_email' || key === 'email') {
        email = value.toString();
        payload[key] = value.toString();
      } else if (key === 'full_name' || key === 'name') {
        name = value.toString();
        payload[key] = value.toString();
      } else if (key === 'organisation') {
        organization = value.toString();
        payload[key] = value.toString();
      } else if (key === 'existing_dpia_file') {
        // Handle file if present, we just store its metadata or pass the file object
        if (value instanceof File && value.size > 0) {
          if (value.size > 10 * 1024 * 1024) {
            return NextResponse.json({ ok: false, error: 'File size exceeds 10MB limit' }, { status: 400, headers: corsHeaders });
          }
          payload.fileName = value.name;
          payload.fileSize = value.size;
          payload.fileType = value.type;
        }
      } else {
        payload[key] = value.toString();
      }
    });
    if (support_needs.length > 0) payload.support_needs = support_needs;

    // Validation
    const requiredFields = ['full_name', 'organisation', 'job_title', 'business_email', 'telephone', 'country', 'processing_description', 'project_stage', 'dpia_status', 'privacy_consent'];
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
    const reference = generateReference('CON');
    await sendSubmissionEmail({ reference, type: 'DPIA consultation', replyTo: email, text: `DPIA consultation submission\n\nReference: ${reference}\n\n${JSON.stringify(payload, null, 2)}` });
    return NextResponse.json({ ok: true, reference, whatsappUrl: buildWhatsAppUrl(reference, 'DPIA consultation') }, { status: 200, headers: corsHeaders });
  } catch (error: any) {
    console.error('DPIA Consultation submission error:', error);
    return NextResponse.json({ ok: false, error: 'Internal server error' }, { status: 500, headers: corsHeaders });
  }
}
