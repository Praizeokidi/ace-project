/**
 * ebook-preview.js
 * -------------------------------------------------------------------------
 * Two independent, self-contained interactions:
 *  1. The 3D book showcase (thumbnail selection -> stage).
 *  2. The "Take a Look Inside" lightbox for interior preview pages.
 *
 * No stock or fabricated interior page images are shipped — the tiles are
 * wired up and ready to receive real scans/renders in /ebook/assets/preview
 * (see the TODO markers in index.html). The lightbox logic below already
 * supports ESC, click-outside, prev/next and focus handling so it works
 * as soon as real assets are dropped in.
 * ------------------------------------------------------------------------- */

(function () {
  "use strict";

  function initShowcase() {
    const stage = document.querySelector("[data-eb-showcase-stage]");
    const thumbs = document.querySelectorAll("[data-eb-showcase-thumb]");
    if (!stage || !thumbs.length) return;

    thumbs.forEach((thumb) => {
      thumb.addEventListener("click", () => {
        thumbs.forEach((t) => t.classList.remove("is-active"));
        thumb.classList.add("is-active");

        const template = thumb.querySelector("[data-eb-book-template]");
        if (template) {
          stage.innerHTML = "";
          stage.appendChild(template.content.cloneNode(true));
        }

        const caption = thumb.getAttribute("data-eb-caption");
        const captionEl = document.querySelector("[data-eb-showcase-caption]");
        if (captionEl && caption) captionEl.textContent = caption;

        window.EbookCheckout && window.EbookCheckout.trackEvent("book_preview_open", { view: caption });
      });
    });
  }

  function initLightbox() {
    const tiles = Array.from(document.querySelectorAll("[data-eb-preview-tile]"));
    const overlay = document.querySelector("[data-eb-lightbox]");
    if (!tiles.length || !overlay) return;

    const titleEl = overlay.querySelector("[data-eb-lightbox-title]");
    const bodyEl = overlay.querySelector("[data-eb-lightbox-body]");
    const closeBtn = overlay.querySelector("[data-eb-lightbox-close]");
    const prevBtn = overlay.querySelector("[data-eb-lightbox-prev]");
    const nextBtn = overlay.querySelector("[data-eb-lightbox-next]");

    let activeIndex = 0;
    let lastFocused = null;

    function render() {
      const tile = tiles[activeIndex];
      const label = tile.getAttribute("data-eb-label") || "Preview";
      const note = tile.getAttribute("data-eb-note") || "";
      if (titleEl) titleEl.textContent = label;
      if (bodyEl) bodyEl.textContent = note;
    }

    function open(index) {
      activeIndex = index;
      lastFocused = document.activeElement;
      render();
      overlay.classList.add("is-open");
      overlay.setAttribute("aria-hidden", "false");
      document.body.style.overflow = "hidden";
      closeBtn && closeBtn.focus();
      window.EbookCheckout && window.EbookCheckout.trackEvent("book_preview_open", {
        tile: tiles[index].getAttribute("data-eb-label"),
      });
    }

    function close() {
      overlay.classList.remove("is-open");
      overlay.setAttribute("aria-hidden", "true");
      document.body.style.overflow = "";
      if (lastFocused) lastFocused.focus();
    }

    function step(delta) {
      activeIndex = (activeIndex + delta + tiles.length) % tiles.length;
      render();
    }

    tiles.forEach((tile, index) => {
      tile.addEventListener("click", () => open(index));
      tile.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          open(index);
        }
      });
    });

    closeBtn && closeBtn.addEventListener("click", close);
    prevBtn && prevBtn.addEventListener("click", () => step(-1));
    nextBtn && nextBtn.addEventListener("click", () => step(1));

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });

    document.addEventListener("keydown", (e) => {
      if (!overlay.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(1);
      if (e.key === "ArrowLeft") step(-1);
    });
  }

  document.addEventListener("DOMContentLoaded", function () {
    initShowcase();
    initLightbox();
  });
})();
