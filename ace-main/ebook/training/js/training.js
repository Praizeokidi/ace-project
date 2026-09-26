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
  const form = document.querySelector("#dpia-training-form");
  if (!form) return;

  const status = form.querySelector("[data-training-status]");
  const submitButton = form.querySelector(".training-submit");
  const submitLabel = submitButton?.querySelector("[data-submit-label]");
  const locationFields = form.querySelector("[data-location-fields]");
  const success = document.querySelector("[data-training-success]");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const checked = (name) =>
    form.querySelectorAll(`[name="${name}"]:checked`).length;
  const requiredFields = () => [
    ...form.querySelectorAll(
      '[required]:not([type="radio"]):not([type="checkbox"])',
    ),
  ];

  const updateLocation = () => {
    const delivery = form.querySelector(
      'input[name="delivery_format"]:checked',
    )?.value;
    if (locationFields)
      locationFields.hidden = !["In-Person", "Hybrid"].includes(delivery);
  };

  const updateSubmitState = () => {
    const fieldsReady = requiredFields().every((field) => field.value.trim());
    const trainingReady = checked("training_types[]") > 0;
    const audienceReady = checked("audience[]") > 0;
    const participantsReady = Boolean(
      form.querySelector('input[name="participants"]:checked'),
    );
    const deliveryReady = Boolean(
      form.querySelector('input[name="delivery_format"]:checked'),
    );
    const flexibilityReady = Boolean(
      form.querySelector('input[name="date_flexible"]:checked'),
    );
    const privacyReady = Boolean(
      form.querySelector("#training-privacy-consent")?.checked,
    );
    if (submitButton)
      submitButton.disabled = !(
        fieldsReady &&
        trainingReady &&
        audienceReady &&
        participantsReady &&
        deliveryReady &&
        flexibilityReady &&
        privacyReady
      );
  };

  const showError = (message) => {
    status.textContent = message;
    status.className = "form-status is-error";
  };

  const validate = () => {
    let valid = true;
    const firstInvalid = [];
    requiredFields().forEach((field) => {
      const message = !field.value.trim()
        ? "This field is required."
        : field.type === "email" && !emailPattern.test(field.value.trim())
          ? "Enter a valid business email address."
          : "";
      field.setAttribute("aria-invalid", message ? "true" : "false");
      if (message) {
        valid = false;
        firstInvalid.push(field);
      }
    });
    if (!checked("training_types[]")) {
      showError("Select at least one training type.");
      valid = false;
    } else if (!checked("audience[]")) {
      showError("Select at least one participant group.");
      valid = false;
    } else if (!form.querySelector('input[name="participants"]:checked')) {
      showError("Select an approximate number of participants.");
      valid = false;
    } else if (!form.querySelector('input[name="delivery_format"]:checked')) {
      showError("Select a preferred delivery format.");
      valid = false;
    } else if (!form.querySelector('input[name="date_flexible"]:checked')) {
      showError("Tell us whether the date is flexible.");
      valid = false;
    } else if (!form.querySelector("#training-privacy-consent").checked) {
      showError("Please accept the privacy consent before submitting.");
      valid = false;
    } else status.textContent = "";
    firstInvalid[0]?.focus();
    return valid;
  };

  form.querySelectorAll('input[name="delivery_format"]').forEach((input) =>
    input.addEventListener("change", () => {
      updateLocation();
      updateSubmitState();
    }),
  );
  form
    .querySelectorAll("input, select, textarea")
    .forEach((field) =>
      field.addEventListener(
        field.type === "radio" || field.type === "checkbox"
          ? "change"
          : "input",
        updateSubmitState,
      ),
    );
  updateLocation();
  updateSubmitState();

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.className = "form-status";
    status.textContent = "";
    if (!validate()) return;

    submitButton.disabled = true;
    submitLabel.textContent = "Sending request…";

    try {
      const response = await fetch("/api/dpia-training", {
        method: "POST",
        body: new FormData(form),
        headers: { Accept: "application/json" },
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok || !result.ok)
        throw new Error(
          result.error || "The training request could not be sent.",
        );
      form.hidden = true;
      success.hidden = false;
      success.querySelector("[data-training-reference]").textContent =
        result.reference || `ACE-TRAINING-${Date.now().toString().slice(-6)}`;
      success.focus();
    } catch (error) {
      console.error(error);
      showError("We could not send your request. Please try again.");
      submitButton.disabled = false;
      submitLabel.textContent = "Request DPIA Training";
    }
  });
})();

//Journey Step ACTIVITY
(() => {
  const journey = document.querySelector(".journey-steps");
  const detail = document.querySelector("#journey-detail");

  if (!journey || !detail) return;

  const journeyContent = {
    awareness:
      "Awareness creates a shared understanding of DPIA purpose, terminology, and organisational responsibility.",

    screening:
      "Screening helps teams decide whether a proposed processing activity is likely to require a DPIA.",

    scoping:
      "Scoping defines the processing activity, systems, data flows, stakeholders, and affected individuals.",

    assessment:
      "Assessment helps participants identify privacy risks, likely impacts, and areas requiring deeper consideration.",

    risk: "Risk management turns identified concerns into practical mitigations, ownership, and follow-up actions.",

    governance:
      "Governance embeds DPIA decisions into approval, accountability, review, and organisational practice.",
  };

  const steps = journey.querySelectorAll("[data-journey-step]");

  const activateStep = (step) => {
    const key = step.dataset.journeyStep;
    const description = journeyContent[key];

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

//SKELETON LOADER ACTIVITY
document.addEventListener("DOMContentLoaded", () => {
  const skeleton = document.querySelector("#training-skeleton");
  const content = document.querySelector("#training-content");

  if (!skeleton || !content) return;

  // Keep the skeleton visible briefly while the page initializes.
  window.setTimeout(() => {
    skeleton.hidden = true;
    content.hidden = false;
    content.classList.add("is-ready");
  }, 700);
});


// Automatically move through the Learning journey steps.
(() => {
  const journey = document.querySelector(".learning-journey");
  const steps = journey?.querySelectorAll("[data-journey-step]");
  if (!journey || !steps || steps.length < 2 || journey.dataset.autoplayReady) return;

  journey.dataset.autoplayReady = "true";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let index = [...steps].findIndex((step) => step.classList.contains("is-active"));
  let timer = null;
  let paused = false;

  const stop = () => {
    if (timer) {
      window.clearInterval(timer);
      timer = null;
    }
  };

  const start = () => {
    stop();
    if (paused || reducedMotion.matches || document.hidden) return;
    timer = window.setInterval(() => {
      index = (index + 1) % steps.length;
      steps[index].click();
    }, 3000);
  };

  const pause = () => {
    paused = true;
    stop();
  };

  const resume = () => {
    paused = false;
    start();
  };

  journey.addEventListener("mouseenter", pause);
  journey.addEventListener("mouseleave", resume);
  journey.addEventListener("focusin", pause);
  journey.addEventListener("focusout", (event) => {
    if (!journey.contains(event.relatedTarget)) resume();
  });
  document.addEventListener("visibilitychange", start);
  reducedMotion.addEventListener?.("change", start);

  start();
})();
