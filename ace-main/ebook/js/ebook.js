/**
 * ebook.js
 * -------------------------------------------------------------------------
 * Core page interactions for the DPIA MADE EASY product page:
 * header scroll state, mobile navigation drawer, scroll-reveal animations,
 * accordions (What's Inside / FAQ), sticky mobile purchase bar, and the
 * checkout-ready modal. Depends on ebook-checkout.js being loaded first.
 * ------------------------------------------------------------------------- */

(function () {
  "use strict";

  const reduceMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;

  /* ----------------------------- Header ----------------------------- */
  function initHeader() {
    const header = document.querySelector("[data-eb-header]");
    if (!header) return;

    const toggle = header.querySelector("[data-eb-nav-toggle]");
    const nav = header.querySelector("[data-eb-nav]");
    const scrim = document.querySelector("[data-eb-nav-scrim]");

    function setScrolled() {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
    }
    setScrolled();
    window.addEventListener("scroll", setScrolled, { passive: true });

    function closeNav() {
      nav.classList.remove("is-open");
      scrim && scrim.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    }

    function openNav() {
      nav.classList.add("is-open");
      scrim && scrim.classList.add("is-open");
      toggle.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    }

    if (toggle && nav) {
      toggle.addEventListener("click", () => {
        const isOpen = nav.classList.contains("is-open");
        isOpen ? closeNav() : openNav();
      });
      scrim && scrim.addEventListener("click", closeNav);
      nav
        .querySelectorAll("a")
        .forEach((link) => link.addEventListener("click", closeNav));
      document.addEventListener("keydown", (e) => {
        if (e.key === "Escape") closeNav();
      });
    }
  }

  /* --------------------------- Hero reveal --------------------------- */
  function initHeroReveal() {
    const heroCopy = document.querySelector("[data-eb-hero-copy]");
    if (heroCopy) heroCopy.classList.add("is-in");
  }

  /* ------------------------ Scroll reveal (IO) ------------------------ */
  function initScrollReveal() {
    const items = document.querySelectorAll("[data-eb-inview]");
    if (!items.length) return;

    if (reduceMotion || !("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" },
    );

    items.forEach((el) => io.observe(el));
  }

  /* ------------------------- Book parallax tilt ------------------------- */
  function initBookParallax() {
    if (reduceMotion) return;
    const stage = document.querySelector("[data-eb-hero-stage]");
    const book = stage && stage.querySelector(".eb-book");
    if (!stage || !book) return;

    stage.addEventListener("mousemove", (e) => {
      const rect = stage.getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width - 0.5;
      const y = (e.clientY - rect.top) / rect.height - 0.5;
      book.style.transform = `rotateY(${-24 + x * 14}deg) rotateX(${3 - y * 8}deg)`;
    });
    stage.addEventListener("mouseleave", () => {
      book.style.transform = "";
    });
  }

  /* ----------------------------- Accordions ----------------------------- */
  function initAccordions(selector, options) {
    options = options || {};
    const items = document.querySelectorAll(selector);
    if (!items.length) return;

    items.forEach((item, index) => {
      const trigger = item.querySelector("[data-eb-accordion-trigger]");
      const panel = item.querySelector("[data-eb-accordion-panel]");
      if (!trigger || !panel) return;

      const panelId =
        panel.id || `${selector.replace(/[^\w]/g, "")}-panel-${index}`;
      panel.id = panelId;
      trigger.setAttribute("aria-controls", panelId);
      trigger.setAttribute("aria-expanded", "false");
      panel.setAttribute("role", "region");

      function setOpen(open) {
        item.classList.toggle("is-open", open);
        trigger.setAttribute("aria-expanded", String(open));
        panel.style.maxHeight = open ? panel.scrollHeight + "px" : "0px";
      }

      trigger.addEventListener("click", () => {
        const willOpen = !item.classList.contains("is-open");
        if (options.singleOpen) {
          items.forEach((other) => {
            if (other !== item) {
              other.classList.remove("is-open");
              const otherTrigger = other.querySelector(
                "[data-eb-accordion-trigger]",
              );
              const otherPanel = other.querySelector(
                "[data-eb-accordion-panel]",
              );
              otherTrigger &&
                otherTrigger.setAttribute("aria-expanded", "false");
              otherPanel && (otherPanel.style.maxHeight = "0px");
            }
          });
        }
        setOpen(willOpen);
        if (options.trackEvent && window.EbookCheckout) {
          window.EbookCheckout.trackEvent(options.trackEvent, {
            label: trigger.textContent.trim().slice(0, 60),
          });
        }
      });

      if (options.defaultOpenIndex === index) setOpen(true);
    });

    window.addEventListener("resize", () => {
      items.forEach((item) => {
        if (!item.classList.contains("is-open")) return;
        const panel = item.querySelector("[data-eb-accordion-panel]");
        if (panel) panel.style.maxHeight = panel.scrollHeight + "px";
      });
    });
  }

  /* --------------------------- Sticky mobile bar --------------------------- */
  function initMobileBar() {
    const bar = document.querySelector("[data-eb-mobile-bar]");
    const pricingSection = document.querySelector("[data-eb-pricing-section]");
    const hero = document.querySelector("[data-eb-hero]");
    if (!bar || !hero) return;

    let pricingInView = false;

    if ("IntersectionObserver" in window && pricingSection) {
      const io = new IntersectionObserver(
        (entries) =>
          entries.forEach((entry) => (pricingInView = entry.isIntersecting)),
        { threshold: 0.2 },
      );
      io.observe(pricingSection);
    }

    function update() {
      const heroBottom = hero.getBoundingClientRect().bottom;
      const shouldShow = heroBottom < 0 && !pricingInView;
      bar.classList.toggle("is-visible", shouldShow);
    }

    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
  }

  /* ----------------------------- Checkout modal ----------------------------- */
  function initCheckoutModal() {
    const overlay = document.querySelector("[data-eb-checkout-modal]");
    if (!overlay) return;

    const closeBtn = overlay.querySelector("[data-eb-modal-close]");
    const form = overlay.querySelector("[data-eb-checkout-form]");
    const toast = document.querySelector("[data-eb-toast]");
    let lastFocused = null;

    function open() {
      lastFocused = document.activeElement;
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      const firstField = overlay.querySelector("input");
      firstField && firstField.focus();
    }

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    closeBtn && closeBtn.addEventListener("click", close);
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && overlay.classList.contains("is-open")) close();
    });

    form &&
      form.addEventListener("submit", (e) => {
        e.preventDefault();
        showToast(
          "Thanks — we'll email you the moment secure checkout is live.",
        );
        window.EbookCheckout &&
          window.EbookCheckout.trackEvent("checkout_waitlist_submit", {});
        close();
        form.reset();
      });

    function showToast(message) {
      if (!toast) return;
      toast.textContent = message;
      toast.classList.add("is-shown");
      window.clearTimeout(showToast._t);
      showToast._t = window.setTimeout(
        () => toast.classList.remove("is-shown"),
        3600,
      );
    }

    window.EbookUI = window.EbookUI || {};
    window.EbookUI.openCheckoutModal = open;
    window.EbookUI.closeCheckoutModal = close;
  }

  /* ----------------------------- CTA wiring ----------------------------- */
  function initCtas() {
    document.querySelectorAll("[data-eb-buy]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.EbookCheckout &&
          window.EbookCheckout.trackEvent("pricing_cta_click", {
            source: btn.getAttribute("data-eb-buy"),
          });
        window.EbookCheckout &&
          window.EbookCheckout.startCheckout(btn.getAttribute("data-eb-buy"));
      });
    });

    document.querySelectorAll("[data-eb-hero-cta]").forEach((btn) => {
      btn.addEventListener("click", () => {
        window.EbookCheckout &&
          window.EbookCheckout.trackEvent("hero_cta_click", {
            label: btn.textContent.trim(),
          });
      });
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initHeader();
    initHeroReveal();
    initScrollReveal();
    initBookParallax();
    initAccordions("[data-eb-inside-item]", {
      defaultOpenIndex: 0,
      trackEvent: "chapter_open",
    });
    initAccordions("[data-eb-faq-item]", { singleOpen: true });
    initMobileBar();
    initCheckoutModal();
    initCtas();
  });

  document.querySelectorAll("[data-eb-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  (function () {
    var stage = document.querySelector("[data-eb-showcase-stage]");
    if (!stage) return;
    var book = stage.querySelector("[data-eb-rotatable]");
    if (!book) return;

    var rotationY = -18;
    var rotationX = 4;
    var startX = 0;
    var startY = 0;
    var startRotationY = rotationY;
    var startRotationX = rotationX;
    var pointerId = null;

    function clamp(value, min, max) {
      return Math.max(min, Math.min(max, value));
    }

    function render() {
      book.style.setProperty("--eb-rot-y", rotationY + "deg");
      book.style.setProperty("--eb-rot-x", rotationX + "deg");
      var normalized = ((rotationY % 360) + 360) % 360;
      var caption = stage.querySelector("[data-eb-showcase-caption]");
      if (caption) {
        caption.textContent =
          normalized > 135 && normalized < 225
            ? "Back Cover"
            : normalized > 65 && normalized < 295
              ? "Spine / Side View"
              : "Front Cover";
      }
    }

    book.addEventListener("pointerdown", function (event) {
      pointerId = event.pointerId;
      startX = event.clientX;
      startY = event.clientY;
      startRotationY = rotationY;
      startRotationX = rotationX;
      book.classList.add("is-dragging");
      book.setPointerCapture(pointerId);
    });

    book.addEventListener("pointermove", function (event) {
      if (pointerId !== event.pointerId) return;
      rotationY = startRotationY + (event.clientX - startX) * 0.65;
      rotationX = clamp(
        startRotationX - (event.clientY - startY) * 0.28,
        -12,
        18,
      );
      render();
    });

    function stopDragging(event) {
      if (pointerId !== event.pointerId) return;
      pointerId = null;
      book.classList.remove("is-dragging");
    }

    book.addEventListener("pointerup", stopDragging);
    book.addEventListener("pointercancel", stopDragging);
    book.addEventListener("lostpointercapture", function () {
      pointerId = null;
      book.classList.remove("is-dragging");
    });

    book.addEventListener("keydown", function (event) {
      var step = event.shiftKey ? 30 : 12;
      if (event.key === "ArrowLeft") {
        rotationY -= step;
        render();
        event.preventDefault();
      } else if (event.key === "ArrowRight") {
        rotationY += step;
        render();
        event.preventDefault();
      } else if (event.key === "ArrowUp") {
        rotationX = clamp(rotationX - 6, -12, 18);
        render();
        event.preventDefault();
      } else if (event.key === "ArrowDown") {
        rotationX = clamp(rotationX + 6, -12, 18);
        render();
        event.preventDefault();
      } else if (event.key === "Home") {
        rotationY = -18;
        rotationX = 4;
        render();
        event.preventDefault();
      }
    });

    render();
  })();
})();
