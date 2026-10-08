(() => {
  "use strict";

  /*
   * Replace these placeholder URLs when Selar or another approved payment
   * platform is configured. Keep provider secrets and payment verification on
   * the server; this page only links to the hosted purchase destination.
   */
  const PURCHASE_URLS = {
    workbook: "https://example.com/replace-with-workbook-url",
    toolkit: "https://example.com/replace-with-toolkit-url",
    bundle: "https://example.com/replace-with-bundle-url",
  };

  const configurePurchaseLinks = () => {
    document.querySelectorAll("[data-purchase-link]").forEach((link) => {
      const product = link.dataset.purchaseLink;
      const destination = PURCHASE_URLS[product];

      if (!destination) return;
      link.href = destination;
      link.addEventListener("click", () => {
        window.dataLayer?.push({
          event: "toolkit_purchase_intent",
          product,
        });
      });
    });
  };

  const setupNavigation = () => {
    const menuToggle = document.querySelector("[data-menu-toggle]");
    const menu = document.querySelector("[data-menu]");

    if (!menuToggle || !menu) return;

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
      });
    });
  };

  document.addEventListener("DOMContentLoaded", () => {
    configurePurchaseLinks();
    setupNavigation();
  });
})();
