/* Design B: turns .service-families.sf-tabs into an accessible tabbed view.
   Without this script the families simply stay stacked (compact cards). */
(() => {
  const wrap = document.querySelector(".service-families.sf-tabs");
  if (!wrap) return;

  const families = [...wrap.querySelectorAll(":scope > .service-family")];
  if (families.length < 2) return;

  const list = document.createElement("div");
  list.className = "sf-tablist";
  list.setAttribute("role", "tablist");
  list.setAttribute("aria-label", "Service families");

  const tabs = families.map((fam, i) => {
    const num = fam.querySelector(".service-family-number")?.textContent.trim() || String(i + 1).padStart(2, "0");
    const label = fam.querySelector(".service-family-label")?.textContent.trim() || `Family ${i + 1}`;
    const count = fam.querySelectorAll(".consultation-service-card").length;

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "sf-tab";
    btn.id = `sf-tab-${i}`;
    btn.setAttribute("role", "tab");
    btn.setAttribute("aria-controls", `sf-panel-${i}`);
    btn.innerHTML =
      `<span class="sf-tab-num">${num}</span>` +
      `<span>${label}</span>` +
      `<span class="sf-tab-count">${count} ${count === 1 ? "service" : "services"}</span>`;

    fam.id = `sf-panel-${i}`;
    fam.setAttribute("role", "tabpanel");
    fam.setAttribute("aria-labelledby", btn.id);

    list.appendChild(btn);
    return btn;
  });

  const select = (n, focus) => {
    tabs.forEach((tab, i) => {
      const on = i === n;
      tab.setAttribute("aria-selected", String(on));
      tab.tabIndex = on ? 0 : -1;
      families[i].classList.toggle("is-active", on);
      families[i].inert = !on;
    });
    if (focus) tabs[n].focus();
  };

  list.addEventListener("click", (e) => {
    const i = tabs.indexOf(e.target.closest(".sf-tab"));
    if (i > -1) select(i);
  });

  list.addEventListener("keydown", (e) => {
    const cur = tabs.findIndex((t) => t.getAttribute("aria-selected") === "true");
    const next = {
      ArrowRight: (cur + 1) % tabs.length,
      ArrowLeft: (cur - 1 + tabs.length) % tabs.length,
      Home: 0,
      End: tabs.length - 1,
    }[e.key];
    if (next !== undefined) {
      e.preventDefault();
      select(next, true);
    }
  });

  wrap.before(list);
  wrap.classList.add("is-tabbed");
  select(0);
})();
