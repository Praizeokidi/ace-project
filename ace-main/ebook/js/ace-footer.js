(() => {
  "use strict";

  const body = document.body;
  const footer = document.querySelector("[data-ace-footer]");
  if (!footer) return;

  const cta = footer.querySelector("[data-footer-cta]");
  const ctaSecondary = footer.querySelector("[data-footer-cta-secondary]");
  const context = body.dataset.footerContext || "ebook";

  const contextualCtas = {
    ebook: {
      label: "Purchase the Workbook",
      href: "#priority-actual",
      secondaryLabel: "Access the Toolkit",
      secondaryHref: "./toolkit/",
    },
    training: {
      label: "Book Training",
      href: "#training-form",
      secondaryLabel: "Explore the Workbook",
      secondaryHref: "../index.html",
    },
    consultation: {
      label: "Schedule Consultation",
      href: "#consultation-form",
      secondaryLabel: "Explore Training",
      secondaryHref: "../training/training.html",
    },
    toolkit: {
      label: "Purchase Toolkit",
      href: "#purchase",
      secondaryLabel: "Compare Packages",
      secondaryHref: "#compare",
    },
  };

  const selectedCta = contextualCtas[context] || contextualCtas.ebook;
  if (cta) {
    cta.textContent = selectedCta.label;
    cta.href = selectedCta.href;
  }
  if (ctaSecondary) {
    ctaSecondary.textContent = selectedCta.secondaryLabel;
    ctaSecondary.href = selectedCta.secondaryHref;
  }

  const header = document.querySelector("[data-header]");
  const backToTop = footer.querySelector("[data-footer-top]");
  const progress = footer.querySelector("[data-footer-progress]");

  const updateScrollState = () => {
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
    const ratio = documentHeight > 0 ? Math.min(scrollTop / documentHeight, 1) : 0;

    header?.classList.toggle("is-scrolled", scrollTop > 12);
    backToTop?.classList.toggle("is-visible", scrollTop > 420);
    if (progress) progress.style.transform = `scaleX(${ratio})`;
  };

  updateScrollState();
  window.addEventListener("scroll", updateScrollState, { passive: true });

  backToTop?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  const newsletterForm = footer.querySelector("[data-footer-newsletter]");
  const newsletterStatus = footer.querySelector("[data-footer-newsletter-status]");
  const newsletterEndpoint = footer.dataset.newsletterEndpoint || "/api/public-submissions/newsletter";

  newsletterForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!newsletterStatus) return;

    const submitButton = newsletterForm.querySelector("button[type=submit]");
    const email = newsletterForm.querySelector("input[type=email]")?.value.trim();
    if (!email || !email.includes("@")) {
      newsletterStatus.textContent = "Enter a valid email address to subscribe.";
      newsletterStatus.className = "ace-footer__newsletter-status is-error";
      return;
    }

    const originalLabel = submitButton?.textContent || "Subscribe";
    if (submitButton) {
      submitButton.disabled = true;
      submitButton.textContent = "Sending…";
    }
    newsletterStatus.textContent = "Submitting your subscription…";
    newsletterStatus.className = "ace-footer__newsletter-status";

    try {
      const response = await fetch(newsletterEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ email, source: `ace-footer-${context}` }),
      });
      if (!response.ok) throw new Error("Newsletter endpoint unavailable");
      newsletterForm.reset();
      newsletterStatus.textContent = "Thank you. You are on the ACE updates list.";
      newsletterStatus.className = "ace-footer__newsletter-status is-success";
    } catch (error) {
      console.warn("Newsletter subscription is not connected yet.", error);
      newsletterStatus.textContent = "Subscription is not connected yet. Please contact ACE directly.";
      newsletterStatus.className = "ace-footer__newsletter-status is-error";
    } finally {
      if (submitButton) {
        submitButton.disabled = false;
        submitButton.textContent = originalLabel;
      }
    }
  });

  const revealItems = footer.querySelectorAll("[data-footer-reveal]");
  if ("IntersectionObserver" in window && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    const observer = new IntersectionObserver((entries, currentObserver) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        currentObserver.unobserve(entry.target);
      });
    }, { threshold: 0.12 });
    revealItems.forEach((item) => observer.observe(item));
  } else {
    revealItems.forEach((item) => item.classList.add("is-visible"));
  }
})();
