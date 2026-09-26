(() => {
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const header = document.querySelector("[data-header]");

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  if (header) {
    const setScrolledState = () => {
      header.classList.toggle("is-scrolled", window.scrollY > 12);
    };
    setScrolledState();
    window.addEventListener("scroll", setScrolledState, { passive: true });
  }
})();

(() => {
  const form = document.querySelector("#dpia-consultation-form");
  if (!form) return;

  const status = form.querySelector("[data-form-status]");
  const submitButton = document.querySelector(".consultation-submit");
  const submitLabel = submitButton?.querySelector("[data-submit-label]");
  const submitArrow = submitButton?.querySelector("[data-submit-arrow]");
  const uploadWrap = form.querySelector("[data-upload-wrap]");
  const uploadInput = form.querySelector("#existing-dpia-file");
  const fileName = form.querySelector("[data-file-name]");
  const fileError = form.querySelector("[data-file-error]");
  const successState = document.querySelector("[data-success-state]");
  const maxFileSize = 10 * 1024 * 1024;
  const allowedExtensions = ["pdf", "docx", "xlsx"];

  const setFieldError = (field, message) => {
    const error = document.getElementById(`${field.id}-error`);
    if (error) error.textContent = message;
    field.setAttribute("aria-invalid", message ? "true" : "false");
  };

  const validateEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  const selectedValues = (name) =>
    [...form.querySelectorAll(`[name="${name}"]:checked`)].map(
      (input) => input.value,
    );

  const validateForm = () => {
    let valid = true;
    const requiredFields = form.querySelectorAll(
      '[required]:not([type="checkbox"]):not([type="radio"])',
    );

    requiredFields.forEach((field) => {
      const value = field.value.trim();
      let message = "";
      if (!value) message = "This field is required.";
      if (field.type === "email" && value && !validateEmail(value))
        message = "Enter a valid business email address.";
      setFieldError(field, message);
      if (message) valid = false;
    });

    const supportError = form.querySelector("#support-error");
    const supportSelected = selectedValues("support_needs[]");
    if (!supportSelected.length) {
      supportError.textContent = "Select at least one area of support.";
      valid = false;
    } else supportError.textContent = "";

    const privacyConsent = form.querySelector("#privacy-consent");
    if (!privacyConsent.checked) {
      privacyConsent.closest(".consent-row").classList.add("has-error");
      valid = false;
    } else privacyConsent.closest(".consent-row").classList.remove("has-error");

    const fileValid = validateFile();
    if (!fileValid) valid = false;

    return valid;
  };

  const validateFile = () => {
    if (!uploadInput || !uploadInput.files.length) {
      if (fileError) fileError.textContent = "";
      return true;
    }

    const file = uploadInput.files[0];
    const extension = file.name.split(".").pop().toLowerCase();
    let message = "";
    if (!allowedExtensions.includes(extension))
      message = "Upload a PDF, DOCX or XLSX file.";
    if (file.size > maxFileSize) message = "The file must be 10 MB or smaller.";
    if (fileError) fileError.textContent = message;
    return !message;
  };

  const updateSubmitState = () => {
    const requiredFieldsValid = [
      ...form.querySelectorAll(
        '[required]:not([type="checkbox"]):not([type="radio"])',
      ),
    ].every((field) => field.value.trim());
    const supportSelected =
      form.querySelectorAll('input[name="support_needs[]"]:checked').length > 0;
    const stageSelected = form.querySelector(
      'input[name="project_stage"]:checked',
    );
    const statusSelected = form.querySelector(
      'input[name="dpia_status"]:checked',
    );
    const privacyAccepted = form.querySelector("#privacy-consent")?.checked;
    if (submitButton) {
      submitButton.disabled = !(
        requiredFieldsValid &&
        supportSelected &&
        stageSelected &&
        statusSelected &&
        privacyAccepted
      );
    }
  };

  const updateUploadState = () => {
    const selected = form.querySelector('input[name="dpia_status"]:checked');
    if (!uploadWrap) return;
    uploadWrap.hidden = selected?.value !== "Yes";
    if (selected?.value !== "Yes" && uploadInput) {
      uploadInput.value = "";
      if (fileName) fileName.textContent = "No file selected";
      if (fileError) fileError.textContent = "";
    }
  };

  form
    .querySelectorAll('input[name="dpia_status"]')
    .forEach((input) => input.addEventListener("change", updateUploadState));
  uploadInput?.addEventListener("change", () => {
    const file = uploadInput.files[0];
    if (fileName) fileName.textContent = file ? file.name : "No file selected";
    validateFile();
  });

  form.querySelectorAll("input, select, textarea").forEach((field) => {
    field.addEventListener("input", () => {
      if (field.id) setFieldError(field, "");
      updateSubmitState();
    });
    field.addEventListener("change", () => {
      if (field.id) setFieldError(field, "");
      updateSubmitState();
    });
  });

  updateSubmitState();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "";
    status.className = "form-status";

    if (!validateForm()) {
      const firstInvalid = form.querySelector(
        '[aria-invalid="true"], input:invalid, textarea:invalid, select:invalid',
      );
      firstInvalid?.focus();
      status.textContent =
        "Please review the highlighted fields before submitting.";
      return;
    }

    submitButton.disabled = true;
    submitLabel.textContent = "Sending request…";
    submitArrow.textContent = "…";

    try {
      const response = await fetch("/api/dpia-consultation", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });

      let result = {};
      try {
        result = await response.json();
      } catch {
        result = {};
      }

      if (!response.ok || !result.ok) {
        throw new Error(
          result.error || "The consultation request could not be sent.",
        );
      }

      const reference =
        result.reference ||
        `ACE-${new Date().getFullYear()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
      form.hidden = true;
      successState.hidden = false;
      successState.querySelector("[data-reference]").textContent = reference;
      successState.focus();
    } catch (error) {
      console.error(error);
      status.className = "form-status is-error";
      status.textContent =
        error instanceof Error && error.message
          ? error.message
          : "We could not send your request. Please try again.";
      submitButton.disabled = false;
      submitLabel.textContent = "Book a DPIA Consultation";
      submitArrow.textContent = "↗";
    }
  });
})();

(() => {
  const lifecycle = document.querySelector(".lifecycle-track");
  const detail = document.querySelector("#lifecycle-detail");

  if (!lifecycle || !detail) return;

  const lifecycleContent = {
    screening:
      "Screening clarifies whether a DPIA is required and identifies the initial decision context.",

    scoping:
      "Scoping defines the processing activity, systems, data flows, stakeholders, and boundaries.",

    assessment:
      "Assessment identifies potential privacy risks, affected individuals, and likely impacts.",

    risk: "Risk management turns identified concerns into practical mitigations and accountable ownership.",

    accountability:
      "Accountability records the decision, residual risk, approvals, review points, and follow-up actions.",
  };

  const steps = lifecycle.querySelectorAll("[data-lifecycle-step]");

  const activateStep = (step) => {
    const key = step.dataset.lifecycleStep;
    const description = lifecycleContent[key];

    steps.forEach((item) => {
      const isActive = item === step;

      item.classList.toggle("is-active", isActive);
      item.setAttribute("aria-pressed", String(isActive));
    });

    if (description) {
      detail.textContent = description;
    }
  };

  steps.forEach((step) => {
    step.addEventListener("click", () => {
      activateStep(step);
    });

    step.addEventListener("focus", () => {
      activateStep(step);
    });
  });
})();

// Reveal the real consultation page after the ebook-style skeleton initializes.
document.addEventListener("DOMContentLoaded", () => {
  const skeleton = document.querySelector("#consultation-skeleton");
  const content = document.querySelector("#consultation-content");
  if (!skeleton || !content) return;

  window.setTimeout(() => {
    skeleton.hidden = true;
    content.classList.add("is-ready");
  }, 700);
});
