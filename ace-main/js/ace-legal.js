/* ACE legal pages: reading progress and active table-of-contents link (no dependencies) */
(() => {
  "use strict";

  const toc = document.querySelector(".ace-legal__toc");
  if (!toc) return;

  const links = [...toc.querySelectorAll('a[href^="#"]')];
  const targets = links
    .map((a) => document.getElementById(a.getAttribute("href").slice(1)))
    .filter(Boolean);
  const body = document.querySelector(".ace-terms, .ace-legal__body");
  const bar = toc.querySelector(".ace-legal__progress span");
  if (!targets.length || !body) return;

  let ticking = false;

  const update = () => {
    ticking = false;
    const line = window.innerHeight * 0.35;

    let current = targets[0];
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top <= line) current = el;
    });
    links.forEach((a) => {
      const on = a.getAttribute("href") === "#" + current.id;
      a.classList.toggle("is-active", on);
      if (on) a.setAttribute("aria-current", "true");
      else a.removeAttribute("aria-current");
    });

    if (bar) {
      const rect = body.getBoundingClientRect();
      const total = rect.height - window.innerHeight * 0.5;
      const read = total > 0 ? (line - rect.top) / total : 1;
      bar.parentElement.style.setProperty("--read", Math.min(1, Math.max(0, read)).toFixed(3));
      bar.style.setProperty("--read", Math.min(1, Math.max(0, read)).toFixed(3));
    }
  };

  const onScroll = () => {
    if (!ticking) {
      ticking = true;
      requestAnimationFrame(update);
    }
  };

  window.addEventListener("scroll", onScroll, { passive: true });
  window.addEventListener("resize", onScroll);
  update();
})();
