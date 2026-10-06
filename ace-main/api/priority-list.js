// api/priority-list.js

const MAX_FIRST_NAME_LENGTH = 80;
const MAX_ORGANISATION_LENGTH = 160;
const MAX_EMAIL_LENGTH = 254;
const MAX_SOURCE_LENGTH = 120;

export default async function handler(request, response) {
  // This endpoint is intended for same-origin browser requests.
  // CORS is deliberately not opened to arbitrary origins.
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      ok: false,
      error: "Method not allowed.",
    });
  }

  try {
    const body = await readRequestBody(request);

    // Honeypot: real visitors should leave this empty.
    if (body.website) {
      // Return a normal-looking response without revealing spam detection.
      return response.status(200).json({ ok: true });
    }

    const firstName = cleanText(body.first_name, MAX_FIRST_NAME_LENGTH);
    const organisation = cleanText(body.organisation, MAX_ORGANISATION_LENGTH);
    const email = cleanText(body.email, MAX_EMAIL_LENGTH).toLowerCase();
    const source = cleanText(
      body.source_page || "DPIA Made Easy priority list",
      MAX_SOURCE_LENGTH,
    );
    const consent = body.updates_consent === "yes";

    if (!firstName || !organisation || !email || !consent) {
      return response.status(400).json({
        ok: false,
        error: "Please complete all required fields and consent to updates.",
      });
    }

    if (!isValidEmail(email)) {
      return response.status(400).json({
        ok: false,
        error: "Please provide a valid email address.",
      });
    }

    const apiKey = process.env.RESEND_API_KEY;
    const sender = process.env.SENDING_EMAIL;
    const receiver = process.env.RECEIVING_EMAIL;
    if (!apiKey || !sender || !receiver) {
      console.error("Missing RESEND_API_KEY environment variable.");
      return response.status(500).json({
        ok: false,
        error: "The email service is not configured.",
      });
    }

    const receivedAt = new Date().toISOString();
    const notificationText = [
      "A new person joined the ACE DPIA priority list.",
      "",
      `First name: ${firstName}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      `Consent: yes`,
      `Source: ${source}`,
      `Received: ${receivedAt}`,
    ].join("\n");

    const welcomeText = [
      `Hi ${firstName},`,
      "",
      "Thank you for joining the ACE DPIA Professional Series priority list.",
      "",
      "We will send launch updates, availability notifications, training announcements, toolkit updates, and corporate package information.",
      "",
      "We respect your inbox. You can unsubscribe at any time by replying to this email.",
      "",
      "ACE Data Protection Consulting",
    ].join("\n");
    const welcomeHtml = buildWelcomeEmailHtml(firstName);
    const resendRequests = [
      {
        from: sender,
        to: [receiver],
        reply_to: email,
        subject: "New ACE DPIA priority-list signup",
        text: notificationText,
      },
      {
        from: sender,
        to: [email],
        reply_to: sender,
        subject: "You are on the ACE DPIA priority list",
        text: welcomeText,
        html: welcomeHtml,
      },
    ];
    const resendResponses = await Promise.all(
      resendRequests.map((emailPayload) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "ace-priority-list/1.0",
          },
          body: JSON.stringify(emailPayload),
        }),
      ),
    );

    if (resendResponses.some((resendResponse) => !resendResponse.ok)) {
      const errors = await Promise.all(
        resendResponses.map((resendResponse) => safeJson(resendResponse)),
      );
      console.error(
        "Priority-list Resend request failed:",
        resendResponses.map((resendResponse) => resendResponse.status),
        errors,
      );

      return response.status(502).json({
        ok: false,
        error: "The submission could not be delivered. Please try again.",
      });
    }

    return response.status(200).json({
      ok: true,
      message: "Your details have been received.",
    });
  } catch (error) {
    console.error("Priority-list handler error:", error);

    return response.status(500).json({
      ok: false,
      error: "The submission could not be processed. Please try again.",
    });
  }
}

async function readRequestBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const contentType = request.headers["content-type"] || "";
  const raw =
    typeof request.body === "string" ? request.body : await readRawBody(request);

  if (contentType.includes("application/json")) {
    return raw ? JSON.parse(raw) : {};
  }

  return Object.fromEntries(new URLSearchParams(raw));
}

function readRawBody(request) {
  return new Promise((resolve, reject) => {
    let data = "";

    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      data += chunk;

      // Prevent unexpectedly large request bodies.
      if (data.length > 20_000) {
        reject(new Error("Request body is too large."));
        request.destroy();
      }
    });

    request.on("end", () => resolve(data));
    request.on("error", reject);
  });
}

function cleanText(value, maxLength) {
  return String(value || "")
    .replace(/[<>]/g, "")
    .trim()
    .slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return { message: "Non-JSON response from Resend." };
  }
}

function buildWelcomeEmailHtml(firstName) {
  return `<!doctype html>
<html lang="en">
  <body style="margin:0;background:#f3f7f8;color:#17323a;font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:620px;margin:32px auto;background:#ffffff;border:1px solid #dce8e8;border-radius:16px;overflow:hidden;">
      <div style="background:#0c5661;padding:28px 36px;color:#ffffff;">
        <p style="margin:0 0 10px;font-size:12px;letter-spacing:2px;text-transform:uppercase;opacity:.8;">ACE DPIA Professional Series</p>
        <h1 style="margin:0;font-size:28px;line-height:1.2;">You are on the priority list</h1>
      </div>
      <div style="padding:36px;">
        <p style="margin:0 0 18px;font-size:18px;line-height:1.5;">Hi ${escapeHtml(firstName)},</p>
        <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4d646a;">Thank you for joining the ACE DPIA Professional Series priority list. We will keep you informed about launch updates, training announcements, toolkit updates, and availability.</p>
        <p style="margin:0;font-size:14px;line-height:1.7;color:#4d646a;">We respect your inbox. You can unsubscribe at any time by replying to this email.</p>
      </div>
    </div>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
