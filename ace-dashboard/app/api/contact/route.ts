import { NextRequest, NextResponse } from 'next/server';
import { createSubmissionFromForm } from '@/lib/submissions';
import { buildWhatsAppUrl, sendSubmissionEmail } from '@/lib/notifications';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, x-forwarded-for, x-real-ip',
};

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get('content-type') || '';
    const payload: Record<string, string> = {};

    if (contentType.includes('application/json')) {
      Object.assign(payload, await req.json());
    } else {
      const formData = await req.formData();
      formData.forEach((value, key) => {
        payload[key] = value.toString();
      });
    }

    const fullName = String(payload.full_name || payload.Name || '').trim();
    const email = String(payload.email || payload.Email || '').trim().toLowerCase();
    const message = String(payload.message || payload.Message || '').trim();

    if (!fullName || !email || !message) {
      return NextResponse.json({ ok: false, error: 'Please complete your name, email address, and message.' }, { status: 400, headers: corsHeaders });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ ok: false, error: 'Please provide a valid email address.' }, { status: 400, headers: corsHeaders });
    }

    const ip = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    const result = await createSubmissionFromForm({
      type: 'CONTACT',
      email,
      name: fullName,
      organization: 'Website contact enquiries',
      job_title: 'Not provided',
      telephone: 'Not provided',
      country: 'Not provided',
      payload: { full_name: fullName, email, message },
      source_path: '/contact.html',
      source_ip_hash: ip,
    });

    const reference = result.reference;
    await sendSubmissionEmail({
      reference,
      type: 'contact message',
      replyTo: email,
      text: [`Reference: ${reference}`, '', 'ACE website contact message', '', `Full name: ${fullName}`, `Email: ${email}`, '', 'Message:', message].join('\n'),
    });

    return NextResponse.json({ ok: true, reference, whatsappUrl: buildWhatsAppUrl(reference, 'Contact message') }, { status: 200, headers: corsHeaders });
  } catch (error) {
    console.error('Contact submission error:', error);
    return NextResponse.json({ ok: false, error: 'The message could not be processed. Please try again.' }, { status: 500, headers: corsHeaders });
  }
}
