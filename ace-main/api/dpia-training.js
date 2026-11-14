const { formidable } = require("formidable");

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
    multiples: true,
    maxFileSize: 10 * 1024 * 1024,
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

function buildEmailText({
  reference,
  fullName,
  organisation,
  jobTitle,
  businessEmail,
  telephone,
  country,
  trainingTypes,
  audience,
  participants,
  deliveryFormat,
  experienceLevel,
  trainingObjectives,
  preferredPeriod,
  alternativePeriod,
  dateFlexible,
  trainingLocationCountry,
  trainingCity,
  trainingState,
  trainingDuration,
  additionalRequirements,
  topics,
}) {
  return [
    `Reference: ${reference}`,
    "",
    "DPIA training request",
    "---------------------",
    `Full name: ${fullName}`,
    `Organisation: ${organisation}`,
    `Job title: ${jobTitle}`,
    `Business email: ${businessEmail}`,
    `Telephone: ${telephone}`,
    `Country: ${country}`,
    `Training types: ${trainingTypes.join(", ")}`,
    `Audience: ${audience.join(", ")}`,
    `Participants: ${participants}`,
    `Delivery format: ${deliveryFormat}`,
    `Experience level: ${experienceLevel}`,
    `Training objectives: ${trainingObjectives}`,
    `Preferred period: ${preferredPeriod}`,
    `Alternative period: ${alternativePeriod}`,
    `Date flexible: ${dateFlexible}`,
    `Training location country: ${trainingLocationCountry || "Not provided"}`,
    `Training city: ${trainingCity || "Not provided"}`,
    `Training state: ${trainingState || "Not provided"}`,
    `Training duration: ${trainingDuration || "Not provided"}`,
    `Topics: ${topics.length ? topics.join(", ") : "Not provided"}`,
    `Additional requirements: ${additionalRequirements || "Not provided"}`,
  ].join("\n");
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
      subject: `New DPIA training request: ${reference}`,
      text: emailText,
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
    const { fields } = await parseForm(req);

    const fullName = textValue(fields.full_name);
    const organisation = textValue(fields.organisation);
    const jobTitle = textValue(fields.job_title);
    const businessEmail = textValue(fields.business_email);
    const telephone = textValue(fields.telephone);
    const country = textValue(fields.country);
    const trainingTypes = arrayValue(fields["training_types[]"]);
    const audience = arrayValue(fields["audience[]"]);
    const participants = textValue(fields.participants);
    const deliveryFormat = textValue(fields.delivery_format);
    const experienceLevel = textValue(fields.experience_level);
    const trainingObjectives = textValue(fields.training_objectives);
    const preferredPeriod = textValue(fields.preferred_period);
    const alternativePeriod = textValue(fields.alternative_period);
    const dateFlexible = textValue(fields.date_flexible);
    const privacyConsent = textValue(fields.privacy_consent);

    const trainingLocationCountry = textValue(fields.training_location_country);
    const trainingCity = textValue(fields.training_city);
    const trainingState = textValue(fields.training_state);
    const trainingDuration = textValue(fields.training_duration);
    const additionalRequirements = textValue(fields.additional_requirements);
    const topics = arrayValue(fields["topics[]"]);

    if (
      !fullName ||
      !organisation ||
      !jobTitle ||
      !businessEmail ||
      !telephone ||
      !country ||
      trainingTypes.length === 0 ||
      audience.length === 0 ||
      !participants ||
      !deliveryFormat ||
      !experienceLevel ||
      !trainingObjectives ||
      !preferredPeriod ||
      !alternativePeriod ||
      !dateFlexible ||
      !privacyConsent
    ) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please complete the required training fields.",
      });
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(businessEmail)) {
      return sendJson(res, 400, {
        ok: false,
        error: "Please enter a valid business email address.",
      });
    }

    const reference = `ACE-TRAINING-${Date.now().toString().slice(-6)}`;

    const emailText = buildEmailText({
      reference,
      fullName,
      organisation,
      jobTitle,
      businessEmail,
      telephone,
      country,
      trainingTypes,
      audience,
      participants,
      deliveryFormat,
      experienceLevel,
      trainingObjectives,
      preferredPeriod,
      alternativePeriod,
      dateFlexible,
      trainingLocationCountry,
      trainingCity,
      trainingState,
      trainingDuration,
      additionalRequirements,
      topics,
    });

    await sendEmailWithResend({
      reference,
      businessEmail,
      emailText,
    });

    return sendJson(res, 200, {
      ok: true,
      reference,
    });
  } catch (error) {
    console.error("DPIA training API error:", error);

    return sendJson(res, 500, {
      ok: false,
      error: "The training request could not be processed.",
    });
  }
}

module.exports = handler;

module.exports.config = {
  api: {
    bodyParser: false,
  },
};
