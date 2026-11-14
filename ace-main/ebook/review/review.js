(() => {
  const form = document.querySelector("#dpia-review-form");
  if (!form) return;

  const status = document.querySelector("[data-review-form-status]");
  const submitButton = form.querySelector('button[type="submit"]');
  const submitLabel = form.querySelector("[data-review-submit-label]");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phonePattern = /^[+0-9 ()-]+$/;

  const setFieldError = (field, message) => {
    const error = document.getElementById(`${field.id}-error`);
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", String(Boolean(message)));
  };

  const validateField = (field) => {
    const value = field.value.trim();
    let message = "";

    if (field.required && !value) {
      message = "This field is required.";
    } else if (field.type === "email" && value && !emailPattern.test(value)) {
      message = "Enter a valid business email address.";
    } else if (
      field.type === "tel" &&
      value &&
      (!phonePattern.test(value) || !/\d/.test(value))
    ) {
      message = "Use only +, digits, spaces, dashes and parentheses.";
    }

    setFieldError(field, message);
    return !message;
  };

  const validateForm = () => {
    const fields = [...form.querySelectorAll("input, textarea")];
    let valid = true;
    let firstInvalid = null;

    fields.forEach((field) => {
      if (!validateField(field)) {
        valid = false;
        firstInvalid ||= field;
      }
    });

    if (!valid) firstInvalid?.focus();
    return valid;
  };

  form.querySelectorAll("input, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      if (field.getAttribute("aria-invalid") === "true") validateField(field);
    });
    field.addEventListener("blur", () => {
      if (form.dataset.submitted === "true") validateField(field);
    });
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "review-contact-status";
    form.dataset.submitted = "true";

    if (!validateForm()) return;

    submitButton.disabled = true;
    submitLabel.textContent = "Sending request…";

    try {
      const response = await fetch(window.aceDashboardEndpoint("/api/dpia-review", form), {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));

      if (!response.ok || !result.ok) {
        throw new Error(result.error || "The review request could not be sent.");
      }

      form.hidden = true;
      status.className = "review-contact-status is-success";
      status.textContent = result.reference
        ? `Thank you. Your review request has been sent. Reference: ${result.reference}`
        : "Thank you. Your review request has been sent.";
      status.focus();
    } catch (error) {
      console.error("DPIA review request error:", error);
      status.className = "review-contact-status is-error";
      status.textContent =
        error instanceof Error && error.message
          ? error.message
          : "We could not send your request. Please try again.";
      submitButton.disabled = false;
      submitLabel.textContent = "Send review request";
    }
  });
})();
