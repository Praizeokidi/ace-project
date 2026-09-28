(() => {
  const menuToggle = document.querySelector("[data-menu-toggle]");
  const menu = document.querySelector("[data-menu]");
  const header = document.querySelector("[data-header]");

  if (menuToggle && menu) {
    menuToggle.addEventListener("click", () => {
      const isOpen = menu.classList.toggle("is-open");
      menuToggle.setAttribute("aria-expanded", String(isOpen));
      document.body.classList.toggle("mobile-menu-open", isOpen);
    });

    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => {
        menu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("mobile-menu-open");
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.classList.contains("is-open")) {
        menu.classList.remove("is-open");
        menuToggle.setAttribute("aria-expanded", "false");
        document.body.classList.remove("mobile-menu-open");
        menuToggle.focus();
      }
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

document.addEventListener("DOMContentLoaded", () => {
  const toolkitModal = document.querySelector("[data-toolkit-modal]");
  const toolkitOpenTriggers = document.querySelectorAll(
    "[data-toolkit-modal-open]",
  );
  const toolkitCloseTriggers = document.querySelectorAll(
    "[data-toolkit-modal-close]",
  );

  if (toolkitModal) {
    const openModal = () => {
      toolkitModal.classList.add("is-open");
      toolkitModal.setAttribute("aria-hidden", "false");
      document.body.classList.add("toolkit-modal-open");
    };

    const closeModal = () => {
      toolkitModal.classList.remove("is-open");
      toolkitModal.setAttribute("aria-hidden", "true");
      document.body.classList.remove("toolkit-modal-open");
    };

    toolkitOpenTriggers.forEach((trigger) => {
      trigger.addEventListener("click", openModal);
    });

    toolkitCloseTriggers.forEach((trigger) => {
      trigger.addEventListener("click", closeModal);
    });

    document.addEventListener("keydown", (event) => {
      if (
        event.key === "Escape" &&
        toolkitModal.classList.contains("is-open")
      ) {
        closeModal();
      }
    });
  }
});

document.addEventListener("DOMContentLoaded", () => {
  const player = document.querySelector("[data-audio-player]");
  if (!player) return;

  const audio = player.querySelector("[data-audio-element]");
  const toggle = player.querySelector("[data-audio-toggle]");
  const playIcon = player.querySelector(".icon-play");
  const pauseIcon = player.querySelector(".icon-pause");
  const currentTime = player.querySelector("[data-audio-current]");
  const duration = player.querySelector("[data-audio-duration]");
  const progress = player.querySelector("[data-audio-progress]");

  if (!audio || !toggle) return;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60).toString().padStart(2, "0");
    return `${minutes}:${remainingSeconds}`;
  };

  const setPlayingState = (isPlaying) => {
    player.classList.toggle("is-playing", isPlaying);
    toggle.setAttribute("aria-label", isPlaying ? "Pause author introduction" : "Play author introduction");
    if (playIcon) playIcon.hidden = isPlaying;
    if (pauseIcon) pauseIcon.hidden = !isPlaying;
  };

  const updateProgress = () => {
    const percentage = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    if (progress) progress.style.width = `${percentage}%`;
  };

  toggle.addEventListener("click", async () => {
    if (audio.paused) {
      try {
        await audio.play();
      } catch {
        setPlayingState(false);
      }
    } else {
      audio.pause();
    }
  });

  audio.addEventListener("loadedmetadata", () => {
    if (duration) duration.textContent = formatTime(audio.duration);
    updateProgress();
    toggle.disabled = false;
  });

  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("play", () => setPlayingState(true));
  audio.addEventListener("pause", () => setPlayingState(false));
  audio.addEventListener("ended", () => {
    setPlayingState(false);
    audio.currentTime = 0;
    updateProgress();
  });

  audio.addEventListener("error", () => {
    toggle.disabled = true;
    toggle.setAttribute("aria-label", "Audio preview unavailable");
    player.classList.add("is-unavailable");
  });

  toggle.disabled = true;
  setPlayingState(false);
  if (audio.readyState >= 1) {
    if (duration) duration.textContent = formatTime(audio.duration);
    updateProgress();
    toggle.disabled = false;
  }
});


/* Floating navbar scroll-spy and anchor offset support. */
(() => {
  const header = document.querySelector("[data-header]");
  const menu = document.querySelector("[data-menu]");
  if (!header) return;

  const links = [...(menu?.querySelectorAll('a[href*="#"]') || [])];
  const sections = links
    .map((link) => document.getElementById(link.hash.slice(1)))
    .filter(Boolean);

  const setCurrent = (id) => {
    links.forEach((link) => {
      const current = link.hash === `#${id}`;
      link.classList.toggle("is-current", current);
      if (current) link.setAttribute("aria-current", "location");
      else link.removeAttribute("aria-current");
    });
  };

  if (sections.length && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setCurrent(visible.target.id);
      },
      { rootMargin: "-28% 0px -58% 0px", threshold: [0.05, 0.2, 0.5] },
    );
    sections.forEach((section) => observer.observe(section));
  }

  links.forEach((link) => {
    link.addEventListener("click", () => {
      const target = document.getElementById(link.hash.slice(1));
      if (target) window.setTimeout(() => setCurrent(target.id), 0);
    });
  });
})();

