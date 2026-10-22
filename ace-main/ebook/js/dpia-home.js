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
  const player = document.querySelector("[data-audio-player]");
  if (!player) return;

  const audio = player.querySelector("[data-audio-element]");
  const toggle = player.querySelector("[data-audio-toggle]");
  const playIcon = player.querySelector(".icon-play");
  const pauseIcon = player.querySelector(".icon-pause");
  const currentTime = player.querySelector("[data-audio-current]");
  const duration = player.querySelector("[data-audio-duration]");
  const track = player.querySelector("[data-audio-track]");
  const knob = player.querySelector("[data-audio-progress]");
  const volume = player.querySelector("[data-audio-volume]");
  const bars = Array.from(player.querySelectorAll("[data-audio-waveform] rect"));

  if (!audio || !toggle) return;

  const formatTime = (seconds) => {
    if (!Number.isFinite(seconds)) return "0:00";
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, "0")}`;
  };

  const setPlayingState = (isPlaying) => {
    player.classList.toggle("is-playing", isPlaying);
    toggle.setAttribute("aria-label", isPlaying ? "Pause briefing" : "Play briefing");
    if (playIcon) playIcon.hidden = isPlaying;
    if (pauseIcon) pauseIcon.hidden = !isPlaying;
  };

  const updateProgress = () => {
    const percentage = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    if (currentTime) currentTime.textContent = formatTime(audio.currentTime);
    if (duration && Number.isFinite(audio.duration)) duration.textContent = formatTime(audio.duration);
    if (track) track.setAttribute("aria-valuenow", formatTime(audio.currentTime));
    if (knob) knob.style.left = `calc(${percentage}% - 15 * var(--audio-u))`;
    bars.forEach((bar, index) => {
      bar.setAttribute("fill", index < Math.ceil((percentage / 100) * bars.length) ? "#d9ae5f" : "#6fb0ea");
    });
  };

  const seek = (clientX) => {
    if (!audio.duration || !track) return;
    const rect = track.getBoundingClientRect();
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    audio.currentTime = ratio * audio.duration;
    updateProgress();
  };

  toggle.addEventListener("click", async () => {
    if (audio.paused) {
      try { await audio.play(); } catch { setPlayingState(false); }
    } else {
      audio.pause();
    }
  });

  track?.addEventListener("click", (event) => seek(event.clientX));
  track?.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    if (!audio.duration) return;
    if (event.key === "Home") audio.currentTime = 0;
    else if (event.key === "End") audio.currentTime = audio.duration;
    else audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + (event.key === "ArrowRight" ? 5 : -5)));
    updateProgress();
  });

  volume?.addEventListener("click", () => {
    audio.muted = !audio.muted;
    volume.setAttribute("aria-label", audio.muted ? "Unmute briefing" : "Mute briefing");
    player.classList.toggle("is-muted", audio.muted);
  });

  audio.addEventListener("loadedmetadata", () => {
    if (duration) duration.textContent = formatTime(audio.duration);
    toggle.disabled = false;
    updateProgress();
  });
  audio.addEventListener("timeupdate", updateProgress);
  audio.addEventListener("play", () => setPlayingState(true));
  audio.addEventListener("pause", () => setPlayingState(false));
  audio.addEventListener("ended", () => { setPlayingState(false); audio.currentTime = 0; updateProgress(); });
  audio.addEventListener("error", () => {
    toggle.disabled = true;
    player.classList.add("is-unavailable");
    toggle.setAttribute("aria-label", "Audio file unavailable");
  });

  setPlayingState(false);
  updateProgress();
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

/* Progressive section motion that never controls visibility. */
(() => {
  const sections = document.querySelectorAll("main section[id$='-actual']");
  if (!sections.length || !("IntersectionObserver" in window)) return;

  sections.forEach((section) => section.classList.add("production-reveal"));
  const observer = new IntersectionObserver((entries, instance) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        instance.unobserve(entry.target);
      }
    });
  }, { rootMargin: "0px 0px -8% 0px", threshold: 0.01 });

  sections.forEach((section) => observer.observe(section));
})();

// Start new document visits at the top, but preserve intentional hash links.
if ("scrollRestoration" in history) history.scrollRestoration = "manual";
window.addEventListener("pageshow", () => {
  if (!window.location.hash) window.scrollTo({ top: 0, left: 0, behavior: "instant" });
});
