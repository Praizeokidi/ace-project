const fs = require("fs/promises");
const path = require("path");
const { formidable } = require("formidable");

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set([".pdf", ".docx", ".xlsx"]);
const ALLOWED_MIME_TYPES = new Set([
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function sendJson(res, statusCode, payload) {
  return res.status(statusCode).json(payload);
}

function firstValue(value) {
  return Array.isArray(value) ? value[0] : value;
}

function textValue(value) {
  return String(firstValue(value) || "").trim();
}

function arrayValue(value) {
  if (!value) return [];
  return Array.isArray(value) ? value.map(String) : [String(value)];
}

function parseForm(req) {
  const form = formidable({
    multiples: false,
    maxFileSize: MAX_FILE_SIZE,
    keepExtensions: true,
  });

  return new Promise((resolve, reject) => {
    form.parse(req, (error, fields, files) => {
      if (error) {
        reject(error);
        return;
      }

      resolve({ fields, files });
    });
  });
}

function getUploadedFile(files) {
  const value = files?.existing_dpia_file;
  if (!value) return null;
  return Array.isArray(value) ? value[0] : value;
}

function validateUploadedFile(file) {
  if (!file) return null;

  const originalFilename = file.originalFilename || "";
  const extension = path.extname(originalFilename).toLowerCase();
  const mimeType = file.mimetype || "";

  if (!ALLOWED_EXTENSIONS.has(extension)) {
    return "The uploaded document must be a PDF, DOCX, or XLSX file.";
  }

  if (mimeType && !ALLOWED_MIME_TYPES.has(mimeType)) {
    return "The uploaded document has an unsupported file type.";
  }

  if (file.size > MAX_FILE_SIZE) {
    return "The uploaded document must be 10 MB or smaller.";
  }

  return null;
}

function buildEmailText({
  reference,
  fullName,
  organisation,
  jobTitle,
  businessEmail,
  telephone,
  country,
  supportNeeds,
  processingDescription,
  projectStage,
  dpiaStatus,
  consultationFormat,
  preferredDate,
  preferredTime,
  alternativeDatetime,
  additionalInformation,
  marketingConsent,
}) {
  return [
    `Reference: ${reference}`,
    "",
    "DPIA consultation request",
    "--------------------------",
    `Full name: ${fullName}`,
    `Organisation: ${organisation}`,
    `Job title: ${jobTitle}`,
    `Business email: ${businessEmail}`,
    `Telephone: ${telephone || "Not provided"}`,
    `Country: ${country}`,
    `Support needs: ${supportNeeds.join(", ")}`,
    `Processing description: ${processingDescription}`,
    `Project stage: ${projectStage}`,
    `DPIA status: ${dpiaStatus}`,
    `Consultation format: ${consultationFormat || "Not provided"}`,
    `Preferred date: ${preferredDate || "Not provided"}`,
    `Preferred time: ${preferredTime || "Not provided"}`,
    `Alternative datetime: ${alternativeDatetime || "Not provided"}`,
    `Additional information: ${additionalInformation || "Not provided"}`,
    `Marketing consent: ${marketingConsent || "Not provided"}`,
  ].join("\n");
}

async function sendEmailWithResend({
  reference,
  businessEmail,
  emailText,
  uploadedFile,
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const sender = process.env.SENDING_EMAIL;
  const receiver = process.env.RECEIVING_EMAIL;

  if (!apiKey || !sender || !receiver) {
    throw new Error(
      "Missing RESEND_API_KEY, SENDING_EMAIL, or RECEIVING_EMAIL environment variable.",
    );
  }

  const attachments = [];

  if (uploadedFile) {
    const fileBuffer = await fs.readFile(uploadedFile.filepath);

    attachments.push({
      filename: uploadedFile.originalFilename || "dpia-document",
      content: fileBuffer.toString("base64"),
    });
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
      subject: `New DPIA consultation request: ${reference}`,
      text: emailText,
      attachments,
    }),
  });

  if (!resendResponse.ok) {
    const resendError = await resendResponse.text();
    console.error("Resend API error:", resendError);
    throw new Error("Resend rejected the email request.");
  }
}

async function handler(req, res) {
  if (req.method !== "POST") {
    return sendJson(res, 405, {
      ok: false,
      error: "Method not allowed",
    });
  }

  try {
    const { fields, files } = await parseForm(req);
    const uploadedFile = getUploadedFile(files);

    const fileError = validateUploadedFile(uploadedFile);
    if (fileError) {
      return sendJson(res, 400, {
        ok: false,
        error: fileError,
      });
    }

    const fullName = textValue(fields.full_name);
    const organisation = textValue(fields.organisation);
    const jobTitle = textValue(fields.job_title);
    const businessEmail = textValue(fields.business_email);
    const telephone = textValue(fields.telephone);
    const country = textValue(fields.country);
    const supportNeeds = arrayValue(fields["support_needs[]"]);
    const processingDescription = textValue(fields.processing_description);
    const projectStage = textValue(fields.project_stage);
    const dpiaStatus = textValue(fields.dpia_status);
    const privacyConsent = textValue(fields.privacy_consent);
    const consultationFormat = textValue(fields.consultation_format);
    const preferredDate = textValue(fields.preferred_date);
    const preferredTime = textValue(fields.preferred_time);
    const alternativeDatetime = textValue(fields.alternative_datetime);
    const additionalInformation = textValue(fields.additional_information);
    const marketingConsent = textValue(fields.marketing_consent);

    if (
      !fullName ||
      !organisation ||
      !jobTitle ||
      !businessEmail ||
      !country ||
      supportNeeds.length === 0 ||
      !processingDescription ||
      !projectStage ||
      !dpiaStatus ||
      !privacyConsent
    ) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please complete the required consultation fields.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please enter a valid business email address.",
      });
    }

    const reference = `ACE-CONSULTATION-${Date.now().toString().slice(-6)}`;

    const emailText = buildEmailText({
      reference,
      fullName,
      organisation,
      jobTitle,
      businessEmail,
      telephone,
      country,
      supportNeeds,
      processingDescription,
      projectStage,
      dpiaStatus,
      consultationFormat,
      preferredDate,
      preferredTime,
      alternativeDatetime,
      additionalInformation,
      marketingConsent,
    });

    await sendEmailWithResend({
      reference,
      businessEmail,
      emailText,
      uploadedFile,
    });

    return sendJson(res, 200, {
      ok: true,
      reference,
    });
  } catch (error) {
    console.error("DPIA consultation API error:", error);

    return sendJson(res, 500, {
      ok: false,
      error: "The consultation request could not be processed.",
    });
  }
}

module.exports = handler;

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
