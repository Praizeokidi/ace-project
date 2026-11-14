/* Programme pathways: accessible tabs (progressive enhancement; all panels show without JS) */
(function () {
  "use strict";
  var root = document.querySelector("[data-pathway]");
  if (!root || root.getAttribute("data-pathway-ready")) return;
  root.setAttribute("data-pathway-ready", "true");

  var tabs = Array.prototype.slice.call(root.querySelectorAll("[role=tab]"));
  var panels = Array.prototype.slice.call(
    root.querySelectorAll("[role=tabpanel]"),
  );
  var caption = root.querySelector("[data-pathway-caption]");
  var total = root.querySelectorAll(".pathway-card").length;

  function select(index, focus) {
    tabs.forEach(function (tab, i) {
      var on = i === index;
      tab.classList.toggle("is-active", on);
      tab.setAttribute("aria-selected", on ? "true" : "false");
      tab.tabIndex = on ? 0 : -1;
      panels[i].hidden = !on;
    });
    var panel = panels[index];
    var n = panel.querySelectorAll(".pathway-card").length;
    if (caption) {
      caption.textContent =
        "Showing " +
        panel.getAttribute("data-pathway-name").replace("&amp;", "&") +
        " \u00b7 " +
        n +
        " of " +
        total +
        " programmes";
    }
    if (focus) tabs[index].focus();
  }

  tabs.forEach(function (tab, i) {
    tab.addEventListener("click", function () {
      select(i, false);
    });
    tab.addEventListener("keydown", function (e) {
      var k = e.key,
        next = null;
      if (k === "ArrowDown" || k === "ArrowRight") next = (i + 1) % tabs.length;
      else if (k === "ArrowUp" || k === "ArrowLeft")
        next = (i - 1 + tabs.length) % tabs.length;
      else if (k === "Home") next = 0;
      else if (k === "End") next = tabs.length - 1;
      if (next !== null) {
        e.preventDefault();
        select(next, true);
      }
    });
  });

  root.classList.add("is-enhanced");
  select(0, false);
})();
