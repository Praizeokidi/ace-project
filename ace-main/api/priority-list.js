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

    if (!process.env.RESEND_API_KEY) {
      console.error("Missing RESEND_API_KEY environment variable.");
      return response.status(500).json({
        ok: false,
        error: "The email service is not configured.",
      });
    }

    if (!process.env.RECEIVING_EMAIL || !process.env.SENDING_EMAIL) {
      console.error(
        "Missing RECEIVING_EMAIL or SENDING_EMAIL environment variable.",
      );
      return response.status(500).json({
        ok: false,
        error: "The email service is not configured.",
      });
    }

    const messageText = [
      "A new person joined the ACE DPIA priority list.",
      "",
      `First name: ${firstName}`,
      `Organisation: ${organisation}`,
      `Email: ${email}`,
      `Consent: yes`,
      `Source: ${source}`,
      `Received: ${new Date().toISOString()}`,
    ].join("\n");

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
        "User-Agent": "ace-priority-list/1.0",
      },
      body: JSON.stringify({
        from: `ACE Priority List <${process.env.SENDING_EMAIL}>`,
        to: [process.env.RECEIVING_EMAIL],
        reply_to: email,
        subject: "New ACE DPIA priority-list signup",
        text: messageText,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await safeJson(resendResponse);
      console.error(
        "Resend request failed:",
        resendResponse.status,
        resendError,
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
  // Vercel may already parse JSON requests into request.body.
  if (request.body && typeof request.body === "object") {
    return request.body;
  }

  const contentType = request.headers["content-type"] || "";

  if (contentType.includes("application/json")) {
    return request.body || {};
  }

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const raw =
      typeof request.body === "string"
        ? request.body
        : await readRawBody(request);
    return Object.fromEntries(new URLSearchParams(raw));
  }

  // This supports a raw request body when Vercel has not parsed it.
  const raw = await readRawBody(request);
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
