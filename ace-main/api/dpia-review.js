const { formidable } = require("formidable");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^[+0-9 ()-]+$/;

function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function textValue(value) {
  return String(firstValue(value) || "").trim();
}

function parseForm(req) {
  const form = formidable({ multiples: false, maxFields: 6, maxFieldsSize: 32 * 1024 });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields) => {
      if (error) {
        reject(error);
        return;
      }
      resolve(fields);
    });
  });
}

async function sendEmailWithResend({ reference, businessEmail, emailText }) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SENDING_EMAIL;
  const receiver = process.env.RECEIVING_EMAIL;

  if (!apiKey || !sender || !receiver) {
    throw new Error(
      "Missing RESEND_API_KEY, SENDING_EMAIL, or RECEIVING_EMAIL environment variable.",
    );
  }

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [receiver],
      reply_to: businessEmail,
      subject: `New DPIA review request: ${reference}`,
      text: emailText,
    }),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    console.error("Resend API error:", resendError);
    throw new Error("Resend rejected the review request.");
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, { ok: false, error: "Method not allowed" });
  }

  try {
    const fields = await parseForm(req);
    const fullName = textValue(fields.full_name);
    const organisation = textValue(fields.organisation);
    const jobTitle = textValue(fields.job_title);
    const businessEmail = textValue(fields.business_email);
    const telephone = textValue(fields.telephone);
    const processingDescription = textValue(fields.processing_description);

    if (!fullName || !organisation || !jobTitle || !businessEmail || !processingDescription) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please complete all required contact fields.",
      });
    }

    if (!EMAIL_PATTERN.test(businessEmail)) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please enter a valid business email address.",
      });
    }

    if (telephone && (!PHONE_PATTERN.test(telephone) || !/\d/.test(telephone))) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please enter a telephone number using only +, digits, spaces, dashes and parentheses.",
      });
    }

    const reference = `ACE-REVIEW-${Date.now().toString().slice(-6)}`;
    const emailText = [
      `Reference: ${reference}`,
      "",
      "DPIA review request",
      "-------------------",
      `Full name: ${fullName}`,
      `Organisation: ${organisation}`,
      `Job title / role: ${jobTitle}`,
      `Business email: ${businessEmail}`,
      `Telephone: ${telephone || "Not provided"}`,
      `Processing activity and DPIA status: ${processingDescription}`,
    ].join("\n");

    await sendEmailWithResend({ reference, businessEmail, emailText });

    return sendJson(res, 200, { ok: true, reference });
  } catch (error) {
    console.error("DPIA review API error:", error);
    return sendJson(res, 500, {
      ok: false,
      error: "The review request could not be processed.",
    });
  }
}

module.exports = handler;

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
