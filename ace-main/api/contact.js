const { formidable } = require("formidable");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_NAME_LENGTH = 160;
const MAX_MESSAGE_LENGTH = 5000;

function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function textValue(value, maxLength) {
  return String(firstValue(value) || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFields: 4,
    maxFieldsSize: 16 * 1024,
  });
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

async function sendEmailWithResend({ reference, email, fullName, message }) {
  const apiKey = String(process.env.RESEND_API_KEY || "").trim();
  const sender = String(process.env.SENDING_EMAIL || "").trim();
  const receiver = String(process.env.RECEIVING_EMAIL || "").trim();
  if (!apiKey || !sender || !receiver) {
    throw new Error("Missing Resend email configuration.");
  }

  const emailText = [
    `Reference: ${reference}`,
    "",
    "New ACE contact message",
    "-----------------------",
    `Full name: ${fullName}`,
    `Email: ${email}`,
    "",
    message,
  ].join("\n");

  const resendResponse = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: sender,
      to: [receiver],
      reply_to: email,
      subject: `New ACE contact message: ${reference}`,
      text: emailText,
    }),
  });

  if (!resendResponse.ok) {
    const details = await resendResponse.text();
    console.error("Resend contact request failed:", details);
    throw new Error("Resend rejected the contact message.");
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return sendJson(res, 405, { ok: false, error: "Method not allowed." });
  }

  try {
    const fields = await parseForm(req);
    const fullName = textValue(fields.full_name, MAX_NAME_LENGTH);
    const email = textValue(fields.email, 254).toLowerCase();
    const message = textValue(fields.message, MAX_MESSAGE_LENGTH);

    if (!fullName || !email || !message) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please complete your name, email address, and message.",
      });
    }
    if (!EMAIL_PATTERN.test(email)) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please enter a valid email address.",
      });
    }

    const reference = `ACE-CONTACT-${Date.now().toString().slice(-6)}`;
    await sendEmailWithResend({ reference, email, fullName, message });
    return sendJson(res, 200, { ok: true, reference });
  } catch (error) {
    console.error("Contact API error:", error);
    return sendJson(res, 500, {
      ok: false,
      error: "The message could not be processed. Please try again.",
    });
  }
}

module.exports = handler;
module.exports.config = {
  api: {
    bodyParser: false,
  },
};
