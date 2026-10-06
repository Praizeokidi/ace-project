const fs = require("fs");
const path = require("path");

const MAX_EMAIL_LENGTH = 254;

export default async function handler(request, response) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    return response.status(405).json({
      ok: false,
      error: "Method not allowed.",
    });
  }

  try {
    const body = await readRequestBody(request);
    const email = cleanText(body.email, MAX_EMAIL_LENGTH).toLowerCase();
    const source = cleanText(body.source || "ACE website footer", 120);

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
      console.error("Missing RESEND_API_KEY, SENDING_EMAIL, or RECEIVING_EMAIL environment variable.");
      return response.status(500).json({
        ok: false,
        error: "The email service is not configured.",
      });
    }

    const receivedAt = new Date().toISOString();
    const logoPath = path.join(__dirname, "..", "images", "logo.png");
    const logoAttachment = {
      filename: "ace-logo.png",
      content: fs.readFileSync(logoPath).toString("base64"),
      content_id: "ace-logo",
    };
    const notificationText = [
      "A new ACE updates and resources subscriber joined.",
      "",
      `Email: ${email}`,
      `Source: ${source}`,
      `Received: ${receivedAt}`,
    ].join("\n");

    const welcomeText = [
      "Thank you for subscribing to ACE updates and resources.",
      "",
      "You will receive publication updates, training announcements, toolkit releases, and practical privacy resources from ACE.",
      "",
      "We respect your inbox. You can unsubscribe at any time by replying to this email.",
      "",
      "ACE — Privacy, data protection, and cybersecurity consultancy",
    ].join("\n");

    const welcomeHtml = buildWelcomeEmailHtml();

    const resendRequests = [
      {
        from: sender,
        to: [receiver],
        reply_to: email,
        subject: "New ACE updates and resources subscriber",
        text: notificationText,
      },
      {
        from: sender,
        to: [email],
        reply_to: sender,
        subject: "Welcome to ACE updates and resources",
        text: welcomeText,
        html: welcomeHtml,
        attachments: [logoAttachment],
      },
    ];

    const resendResponses = await Promise.all(
      resendRequests.map((emailPayload) =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "User-Agent": "ace-newsletter/1.0",
          },
          body: JSON.stringify(emailPayload),
        }),
      ),
    );

    if (resendResponses.some((resendResponse) => !resendResponse.ok)) {
      const errors = await Promise.all(resendResponses.map((resendResponse) => safeJson(resendResponse)));
      console.error("Resend newsletter request failed:", errors);
      return response.status(502).json({
        ok: false,
        error: "The subscription could not be delivered. Please try again.",
      });
    }

    return response.status(200).json({
      ok: true,
      message: "You are now subscribed to ACE updates and resources.",
    });
  } catch (error) {
    console.error("Newsletter handler error:", error);
    return response.status(500).json({
      ok: false,
      error: "The subscription could not be processed. Please try again.",
    });
  }
}

async function readRequestBody(request) {
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const contentType = request.headers["content-type"] || "";
  const raw = typeof request.body === "string" ? request.body : await readRawBody(request);

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
  return String(value || "").replace(/[<>]/g, "").trim().slice(0, maxLength);
}

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function buildWelcomeEmailHtml() {
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Welcome to ACE updates and resources</title>
  </head>
  <body style="margin:0;background:#f3f7f8;color:#17323a;font-family:Arial,Helvetica,sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
      Practical privacy resources, training announcements and toolkit releases from ACE.
    </div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#f3f7f8;padding:32px 12px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:620px;background:#ffffff;border:1px solid #dce8e8;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background:#0c5661;padding:28px 36px;">
                <img src="cid:ace-logo" alt="ACE Data Protection Consulting" width="190" style="display:block;width:190px;max-width:100%;height:auto;background:#ffffff;padding:10px;border-radius:6px;">
                <h1 style="margin:12px 0 0;color:#ffffff;font-size:28px;line-height:1.2;font-weight:700;">Welcome to the ACE updates list</h1>
              </td>
            </tr>
            <tr>
              <td style="padding:36px;">
                <p style="margin:0 0 18px;font-size:18px;line-height:1.5;color:#17323a;">Thank you for subscribing.</p>
                <p style="margin:0 0 22px;font-size:15px;line-height:1.7;color:#4d646a;">You will receive publication updates, training announcements, toolkit releases, and practical privacy resources from ACE.</p>
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:0 0 24px;background:#edf8f5;border-left:4px solid #35a889;">
                  <tr><td style="padding:16px 18px;color:#24504b;font-size:14px;line-height:1.6;">Our updates are designed to help organisations build practical, responsible data protection and cybersecurity programmes.</td></tr>
                </table>
                <p style="margin:0;font-size:14px;line-height:1.7;color:#4d646a;">We respect your inbox. You can unsubscribe at any time by replying to this email.</p>
              </td>
            </tr>
            <tr>
              <td style="border-top:1px solid #e5eeee;padding:22px 36px;background:#fbfdfd;">
                <p style="margin:0;color:#587178;font-size:12px;line-height:1.6;">ACE — Privacy, data protection, and cybersecurity consultancy</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0;color:#769096;font-size:11px;line-height:1.5;">You received this email because you subscribed to ACE updates and resources.</p>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

async function safeJson(response) {
  try {
    return await response.json();
  } catch {
    return { message: "Non-JSON response from Resend." };
  }
}
