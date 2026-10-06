const DEFAULT_RECEIVING_EMAIL = 'praizeokidi@gmail.com';
const DEFAULT_WHATSAPP_NUMBER = '2349050043601';

export function buildWhatsAppUrl(reference: string, type: string) {
  const number = (process.env.WHATSAPP_NUMBER || DEFAULT_WHATSAPP_NUMBER).replace(/\D/g, '');
  const text = [
    'Hello ACE, I have submitted a request through the website.',
    `Type: ${type}`,
    `Reference: ${reference}`,
    'Please confirm receipt and advise on next steps.',
  ].join('\n');
  return `https://wa.me/${number}?text=${encodeURIComponent(text)}`;
}

export async function sendSubmissionEmail(input: {
  reference: string;
  type: string;
  replyTo: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SENDING_EMAIL;
  const receiver = process.env.RECEIVING_EMAIL || DEFAULT_RECEIVING_EMAIL;

  if (!apiKey || !sender) {
    throw new Error('Missing RESEND_API_KEY or SENDING_EMAIL environment variable.');
  }

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: sender,
      to: [receiver],
      reply_to: input.replyTo,
      subject: `New ACE ${input.type} submission: ${input.reference}`,
      text: input.text,
    }),
  });

  if (!response.ok) {
    console.error('Resend submission error:', await response.text());
    throw new Error('Resend rejected the submission email.');
  }
}
