/**
 * ebook-checkout.js
 * -------------------------------------------------------------------------
 * Product configuration, pricing rendering, and a clean checkout
 * abstraction for DPIA MADE EASY.
 *
 * IMPORTANT — PAYMENT SECURITY
 * This file intentionally contains NO payment secret keys and performs
 * NO client-side payment verification. When Paystack or Flutterwave is
 * connected, this module should only:
 *   1. Collect the buyer's email/name.
 *   2. Initialize a checkout session (public key only, or a call to your
 *      own backend endpoint that creates the session).
 *   3. Hand off to the payment provider's hosted checkout / inline widget.
 * The SERVER must independently verify the transaction with the provider
 * before an order is created or a download link is issued. Never trust a
 * "successful" status reported directly by browser JavaScript.
 *
 * Until a backend + payment keys are wired in, `EbookCheckout.startCheckout()`
 * puts the UI into a "checkout-ready" state (see PRODUCT.checkoutReady)
 * instead of faking a transaction.
 * ------------------------------------------------------------------------- */

(function (window) {
  "use strict";

  /* -----------------------------------------------------------------------
     PRODUCT CONFIGURATION
     Single source of truth for price/currency. Update these values once
     ACE confirms final pricing — everything in the UI reads from here.
     ----------------------------------------------------------------------- */
  const PRODUCT = {
    id: "dpia-made-easy",
    title: "DPIA Made Easy",
    subtitle: "Data Privacy Impact Assessments",
    edition: "Professional Workbook Edition",
    author: "S. A. Kitchener, CIPPE, CIPM",
    format: "PRODUCT_FORMAT", // TODO: e.g. "Digital PDF workbook"
    pageCount: null,          // TODO: BOOK_PAGE_COUNT
    isbn: null,               // TODO: BOOK_ISBN
    publicationDate: null,    // TODO: BOOK_PUBLICATION_DATE

    // --- Pricing (TODO: confirm with ACE and replace placeholders) ---
    PRODUCT_CURRENCY: "NGN",
    PRODUCT_CURRENCY_SYMBOL: "₦",
    PRODUCT_PRICE: null,            // e.g. 25000 — set to enable purchase
    PRODUCT_COMPARE_AT_PRICE: null, // e.g. 35000 — optional strike-through price
    PRODUCT_DISCOUNT: null,         // e.g. "30% OFF" — optional badge text

    // Delivery / policy copy — only shown once confirmed accurate.
    deliveryMethod: null, // TODO: e.g. "Secure digital download after payment verification"
    refundPolicyUrl: null, // TODO: link to refund-policy.html once published

    // Flips to true once a real payment gateway + backend verification
    // endpoint are connected. Keeps the CTA truthful in the meantime.
    checkoutReady: false,
  };

  function formatPrice(amount) {
    if (amount === null || amount === undefined) return null;
    return PRODUCT.PRODUCT_CURRENCY_SYMBOL + Number(amount).toLocaleString("en-NG");
  }

  function renderPricing() {
    const priceEl = document.querySelector("[data-eb-price]");
    const compareEl = document.querySelector("[data-eb-compare-price]");
    const saveEl = document.querySelector("[data-eb-save-badge]");
    const barPriceEl = document.querySelector("[data-eb-bar-price]");

    const price = formatPrice(PRODUCT.PRODUCT_PRICE);
    const compare = formatPrice(PRODUCT.PRODUCT_COMPARE_AT_PRICE);

    if (priceEl) priceEl.textContent = price || "Price coming soon";
    if (barPriceEl) barPriceEl.textContent = price || "Price TBC";

    if (compareEl) {
      if (compare) {
        compareEl.textContent = compare;
        compareEl.hidden = false;
      } else {
        compareEl.hidden = true;
      }
    }

    if (saveEl) {
      if (PRODUCT.PRODUCT_DISCOUNT) {
        saveEl.textContent = PRODUCT.PRODUCT_DISCOUNT;
        saveEl.hidden = false;
      } else {
        saveEl.hidden = true;
      }
    }
  }

  /* -----------------------------------------------------------------------
     ANALYTICS HOOKS
     Provider-agnostic. Wire this into GA4 / GTM / another platform by
     replacing the body of trackEvent — every call site in the page stays
     the same.
     ----------------------------------------------------------------------- */
  function trackEvent(name, detail) {
    detail = detail || {};
    if (window.dataLayer && typeof window.dataLayer.push === "function") {
      window.dataLayer.push(Object.assign({ event: name }, detail));
    }
    if (window.gtag) {
      window.gtag("event", name, detail);
    }
    document.dispatchEvent(new CustomEvent("eb:" + name, { detail }));
    // console.debug("[ebook analytics]", name, detail);
  }

  /* -----------------------------------------------------------------------
     CHECKOUT ABSTRACTION
     Replace the body of `startCheckout` with a real Paystack/Flutterwave
     initialization once credentials exist. The rest of the UI never needs
     to change.
     ----------------------------------------------------------------------- */
  function startCheckout(context) {
    trackEvent("checkout_started", { productId: PRODUCT.id, context: context || "unknown" });

    if (!PRODUCT.checkoutReady || !PRODUCT.PRODUCT_PRICE) {
      window.EbookUI && window.EbookUI.openCheckoutModal();
      return;
    }

    // --- Real integration goes here, e.g.: ---
    // const handler = PaystackPop.setup({
    //   key: "PUBLIC_KEY_ONLY",
    //   email: buyerEmail,
    //   amount: PRODUCT.PRODUCT_PRICE * 100,
    //   currency: PRODUCT.PRODUCT_CURRENCY,
    //   callback: (response) => verifyPaymentServerSide(response.reference),
    // });
    // handler.openIframe();
  }

  function verifyPaymentServerSide(reference) {
    // Placeholder for a call to your own backend, e.g.:
    // return fetch(`/api/payments/verify?reference=${reference}`).then(r => r.json());
    // The backend re-checks the transaction with Paystack/Flutterwave's
    // server-side API before creating an order or issuing a download link.
    return Promise.reject(new Error("Server-side verification endpoint not yet configured."));
  }

  window.EbookProduct = PRODUCT;
  window.EbookCheckout = {
    PRODUCT: PRODUCT,
    formatPrice: formatPrice,
    renderPricing: renderPricing,
    trackEvent: trackEvent,
    startCheckout: startCheckout,
    verifyPaymentServerSide: verifyPaymentServerSide,
  };

  document.addEventListener("DOMContentLoaded", function () {
    renderPricing();
    trackEvent("ebook_page_view", { productId: PRODUCT.id });
  });
})(window);
