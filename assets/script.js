/*
 * why.fibe.gg — minimal interactions.
 *
 * 1. Stamp the current year in the footer.
 * 2. Reveal eligible blocks (eyebrows, headlines, lists, tiles, cards) as they
 *    enter the viewport. Respects prefers-reduced-motion via CSS.
 * 3. Tilt the persona visuals slightly on pointer move — pointer-fine only.
 * 4. i18n: swap text from /assets/i18n.json for non-en locales.
 */

// ──────────────────────────────────────────────────────────────────────
// I18N — locale detection + text swap
// ──────────────────────────────────────────────────────────────────────
// English content is baked into the HTML, so en-locale visitors see no
// flicker. For other locales we fetch /assets/i18n.json and rewrite every
// [data-i18n] element + [data-i18n-attr] attribute target.
window.FibeI18n = (() => {
  const SUPPORTED = ["en", "uk"];
  const STORAGE_KEY = "fibe.lang";

  const detect = () => {
    // 1. URL path is the canonical signal — /uk/ → uk, / → en. Each locale
    //    has its own statically-rendered HTML, so path wins.
    const seg = location.pathname.split("/").filter(Boolean)[0];
    if (seg && SUPPORTED.includes(seg)) return seg;
    // 2. ?lang= query (handy for testing).
    const params = new URLSearchParams(location.search);
    const fromURL = params.get("lang");
    if (fromURL && SUPPORTED.includes(fromURL)) {
      try { localStorage.setItem(STORAGE_KEY, fromURL); } catch {}
      return fromURL;
    }
    // 3. Stored preference (set by clicking the language switcher).
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored && SUPPORTED.includes(stored)) return stored;
    } catch {}
    // 4. Fall back to the browser's preference, capped to supported.
    const navLang = (navigator.language || "en").toLowerCase();
    if (navLang.startsWith("uk")) return "uk";
    return "en";
  };

  const locale = detect();
  document.documentElement.setAttribute("lang", locale);
  document.documentElement.setAttribute("data-locale", locale);

  const lookup = (dict, dottedKey) => {
    const parts = dottedKey.split(".");
    let cur = dict;
    for (const p of parts) {
      if (cur == null) return undefined;
      cur = cur[p];
    }
    return cur;
  };

  const apply = (dict) => {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      const v = lookup(dict, el.getAttribute("data-i18n"));
      if (typeof v === "string") el.innerHTML = v;
    });
    document.querySelectorAll("[data-i18n-attr]").forEach((el) => {
      const spec = el.getAttribute("data-i18n-attr");
      spec.split(";").forEach((pair) => {
        const eq = pair.indexOf("=");
        if (eq === -1) return;
        const attr = pair.slice(0, eq).trim();
        const key = pair.slice(eq + 1).trim();
        const v = lookup(dict, key);
        if (typeof v === "string") el.setAttribute(attr, v);
      });
    });
    const titleEl = document.querySelector("title[data-i18n]");
    if (titleEl) document.title = titleEl.textContent;
  };

  // English is the in-HTML default — no fetch needed.
  let ready = Promise.resolve();
  if (locale !== "en") {
    ready = fetch("/assets/i18n.json", { cache: "no-cache" })
      .then((r) => r.json())
      .then((data) => {
        const dict = data[locale];
        if (dict) apply(dict);
      })
      .catch((err) => {
        console.warn("i18n: failed to load translations", err);
      });
  }

  return { locale, ready, SUPPORTED };
})();

(() => {
  // ── Centralized tunables ────────────────────────────────────────────
  // How long the persona intro slide dwells (with the chip counting up)
  // before auto-advancing to the video preview. One place to change it.
  const GALLERY_DWELL_MS = 3000;

  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // ── Hero graph tooltips: per-step labels on the Fibe Way + a fallback
  //   "Fibe Way" tooltip when hovering empty parts of the highlighted line.
  document.querySelectorAll("[data-graph]").forEach((graph) => {
    const tip = graph.querySelector("[data-graph-tip]");
    const way = graph.querySelector(".hero__graph-shortest");
    const steps = graph.querySelectorAll(".hero__graph-step");
    if (!tip) return;

    let hideTimer = 0;

    // Position the tooltip just above a hovered SVG element, in graph-
    // container coordinates (so the SVG can scale freely).
    const positionTipAt = (el) => {
      const elRect = el.getBoundingClientRect();
      const graphRect = graph.getBoundingClientRect();
      const cx = elRect.left + elRect.width / 2 - graphRect.left;
      const cy = elRect.top - graphRect.top;
      graph.style.setProperty("--tip-x", `${cx}px`);
      graph.style.setProperty("--tip-y", `${cy - 6}px`);
    };

    const showTipFor = (el, label) => {
      clearTimeout(hideTimer);
      tip.textContent = label;
      positionTipAt(el);
      graph.classList.add("is-tip-visible");
    };
    const hide = () => {
      graph.classList.remove("is-tip-visible");
      if (way) way.classList.remove("is-active");
    };

    // Per-waypoint hovers — read the label from the data-step-label attribute
    // that the build script wrote from i18n.json.
    steps.forEach((stepEl) => {
      const label = stepEl.getAttribute("data-step-label") || "";
      const show = () => showTipFor(stepEl, label);
      stepEl.addEventListener("mouseenter", show);
      stepEl.addEventListener("focus", show);
      stepEl.addEventListener("mouseleave", hide);
      stepEl.addEventListener("blur", hide);
      stepEl.addEventListener("click", (e) => {
        e.preventDefault();
        show();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, 1800);
      });
    });

    // The shortest-line itself still gets the generic "Fibe Way" label when
    // you hover the line between waypoints.
    if (way) {
      const wayLabel = way.getAttribute("aria-label") || "Fibe Way";
      const show = () => {
        showTipFor(way, wayLabel);
        way.classList.add("is-active");
      };
      way.addEventListener("mouseenter", show);
      way.addEventListener("focus", show);
      way.addEventListener("mouseleave", hide);
      way.addEventListener("blur", hide);
      way.addEventListener("click", (e) => {
        e.preventDefault();
        show();
        clearTimeout(hideTimer);
        hideTimer = setTimeout(hide, 1800);
      });
    }

    // Tap anywhere else hides the tip on mobile.
    document.addEventListener("click", (e) => {
      if (!(e.target instanceof Element)) return;
      if (e.target.closest(".hero__graph-step")) return;
      if (e.target.closest(".hero__graph-shortest")) return;
      if (graph.classList.contains("is-tip-visible")) hide();
    });
  });

  // ── For each persona, move the "See it in action" slider into the visual
  //   area AS the visual content, and prepend an "intro" slide (chip + art)
  //   so the user can always swipe/arrow back to the illustration. No modal
  //   open/close — it's just a slider whose first slide is the intro.
  document.querySelectorAll(".persona").forEach((persona) => {
    const visual = persona.querySelector(".persona__visual");
    const action = persona.querySelector(".persona__action");
    if (!visual || !action) return;

    const gallery = document.createElement("div");
    gallery.className = "persona__gallery";
    while (action.firstChild) gallery.appendChild(action.firstChild);

    const sliderEl = gallery.querySelector("[data-slider]");
    const chip = visual.querySelector(".persona__chip");
    const art = visual.querySelector(".persona__art");

    // Build the intro slide as the first slide of the slider. The chip and
    // art move INSIDE this slide so the slider mechanics handle navigation
    // — no separate "closed" state.
    if (sliderEl) {
      const intro = document.createElement("article");
      intro.className = "slide slide--intro";
      if (chip) intro.appendChild(chip);
      if (art) intro.appendChild(art);
      sliderEl.insertBefore(intro, sliderEl.firstChild);

      // Simplification: each preview shows ONE video reference. Drop every
      // non-intro slide after the first so the gallery becomes: intro →
      // single video poster. Markup + i18n for the extras stays in place
      // and is just ignored at runtime — easy to restore if needed.
      const extras = sliderEl.querySelectorAll(".slide:not(.slide--intro)");
      for (let i = 1; i < extras.length; i++) extras[i].remove();
    }

    visual.appendChild(gallery);
    action.remove();

    // The visual is now a slider, always — flag it once so CSS can target it.
    visual.classList.add("persona__visual--slider");

    // ── Auto-advance to slide 1 after the dwell window, counting on the chip.
    const DWELL_MS = GALLERY_DWELL_MS;
    let rafId = 0;
    let startedAt = 0;
    let armed = true;

    const cancelAutoOpen = () => {
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
      startedAt = 0;
      if (chip) {
        chip.classList.remove("is-counting");
        chip.style.removeProperty("--chip-progress");
        const prog = chip.querySelector(".persona__chip-progress");
        if (prog) prog.textContent = "";
      }
    };

    const goToSlide = (index) => {
      if (!sliderEl) return;
      const slides = sliderEl.querySelectorAll(".slide");
      const target = slides[index];
      if (!target) return;
      sliderEl.scrollTo({ left: target.offsetLeft - sliderEl.offsetLeft, behavior: "smooth" });
    };

    const tick = () => {
      if (!startedAt) return;
      const elapsed = performance.now() - startedAt;
      const pct = Math.min(100, Math.round((elapsed / DWELL_MS) * 100));
      if (chip) {
        chip.style.setProperty("--chip-progress", String(pct / 100));
        const prog = chip.querySelector(".persona__chip-progress");
        if (prog) prog.textContent = pct + "%";
      }
      if (elapsed >= DWELL_MS) {
        rafId = 0;
        armed = false;
        cancelAutoOpen();
        goToSlide(1);
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    const startAutoOpen = () => {
      if (!armed) return;
      if (rafId) return;
      if (!chip || !sliderEl) return;
      // If user has already scrolled away from slide 0, don't auto-trigger.
      if (sliderEl.scrollLeft > 4) {
        armed = false;
        return;
      }
      if (!chip.querySelector(".persona__chip-progress")) {
        const prog = document.createElement("span");
        prog.className = "persona__chip-progress";
        chip.appendChild(prog);
      }
      chip.classList.add("is-counting");
      startedAt = performance.now();
      rafId = requestAnimationFrame(tick);
    };

    // Track which slide is currently active. On the intro slide, the gallery
    // chrome (background tint + section header) hides so the visual looks
    // exactly like the original. Any manual scroll also disarms auto-play.
    const updateOnIntro = () => {
      if (!sliderEl) return;
      const onIntro = sliderEl.scrollLeft < 4;
      gallery.classList.toggle("is-on-intro", onIntro);
    };
    if (sliderEl) {
      gallery.classList.add("is-on-intro"); // initial
      sliderEl.addEventListener(
        "scroll",
        () => {
          updateOnIntro();
          if (!armed) return;
          if (sliderEl.scrollLeft > 4) {
            armed = false;
            cancelAutoOpen();
          }
        },
        { passive: true }
      );
    }

    // Observe the persona itself. When ~half of it is in view, arm the timer.
    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.intersectionRatio >= 0.5) startAutoOpen();
            else cancelAutoOpen();
          });
        },
        { threshold: [0, 0.25, 0.5, 0.75] }
      );
      io.observe(persona);
    }
  });

  // ── Deep-link realign ───────────────────────────────────────────────
  // The browser jumps to `location.hash` during initial parse — BEFORE the
  // galleries above are built and webfonts/art settle. That early layout is
  // shorter, so the jump lands too high (often a whole section short, e.g.
  // #fibedentity landing on the research persona on mobile). Re-scroll once
  // layout is stable so deep links / reloads land precisely under the nav.
  if (location.hash.length > 1) {
    const realign = () => {
      const el = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (el) el.scrollIntoView({ block: "start" });
    };
    requestAnimationFrame(() => requestAnimationFrame(realign));
    window.addEventListener("load", realign); // again after images/fonts
  }

  // ── Reveal-on-scroll ────────────────────────────────────────────────
  const revealTargets = document.querySelectorAll(
    [
      // Hero stays visible from first paint — no reveal applied above the fold.
      ".matrix-section .section-head > *",
      ".tile",
      ".persona__head > *",
      ".persona__visual",
      ".persona__body > *",
      ".persona__action-head > *",
      // NOTE: .slide is intentionally NOT a reveal target. Slides live inside
      // the absolutely-positioned, horizontally-scrolled gallery, where the
      // reveal IntersectionObserver can't reliably detect the off-screen
      // video slide — leaving it stuck at opacity:0 when the loader advances
      // to it. The gallery fades in via .persona__visual; slides stay opaque.
      ".solutions .section-head > *",
      ".solution",
      ".how .section-head > *",
      ".how__card",
      ".close__inner > *",
    ].join(",")
  );

  revealTargets.forEach((el) => el.classList.add("reveal"));

  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.08 }
    );
    revealTargets.forEach((el) => io.observe(el));
  } else {
    revealTargets.forEach((el) => el.classList.add("is-visible"));
  }

  // ── Sliders (granular paths) ────────────────────────────────────────
  document.querySelectorAll("[data-slider]").forEach((track) => {
    const shell = track.closest(".slider-shell");
    if (!shell) return;
    const prev = shell.querySelector("[data-slider-prev]");
    const next = shell.querySelector("[data-slider-next]");

    const stepBy = () => {
      const slide = track.querySelector(".slide");
      if (!slide) return track.clientWidth * 0.9;
      const styles = window.getComputedStyle(track);
      const gap = parseFloat(styles.columnGap || styles.gap || "0") || 0;
      return slide.getBoundingClientRect().width + gap;
    };

    const update = () => {
      const max = track.scrollWidth - track.clientWidth;
      const noOverflow = max <= 1;
      [prev, next].forEach((btn) => {
        if (!btn) return;
        btn.style.display = noOverflow ? "none" : "";
      });
      if (noOverflow) return;
      const atStart = track.scrollLeft <= 2;
      const atEnd = track.scrollLeft >= max - 2;
      if (prev) prev.setAttribute("aria-disabled", String(atStart));
      if (next) next.setAttribute("aria-disabled", String(atEnd));
    };

    if (prev) {
      prev.addEventListener("click", () =>
        track.scrollBy({ left: -stepBy(), behavior: "smooth" })
      );
    }
    if (next) {
      next.addEventListener("click", () =>
        track.scrollBy({ left: stepBy(), behavior: "smooth" })
      );
    }
    track.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    // Keyboard support when the slider itself has focus.
    track.addEventListener("keydown", (e) => {
      if (e.key === "ArrowRight") {
        e.preventDefault();
        track.scrollBy({ left: stepBy(), behavior: "smooth" });
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        track.scrollBy({ left: -stepBy(), behavior: "smooth" });
      }
    });
    update();
  });

  // ── Mobile drawer: open/close + ESC + focus management ─────────────
  const drawer = document.querySelector("[data-drawer]");
  const drawerToggle = document.querySelector("[data-drawer-toggle]");
  if (drawer && drawerToggle) {
    const openDrawer = () => {
      drawer.hidden = false;
      drawerToggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("is-drawer-open");
    };
    const closeDrawer = () => {
      drawer.hidden = true;
      drawerToggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("is-drawer-open");
      drawerToggle.focus();
    };

    drawerToggle.addEventListener("click", () => {
      if (drawer.hidden) openDrawer();
      else closeDrawer();
    });

    drawer.addEventListener("click", (e) => {
      const t = e.target;
      if (t instanceof Element && t.closest("[data-drawer-close]")) closeDrawer();
    });

    // Close on link click, THEN scroll. While the drawer is open the body
    // is `overflow: hidden`, which on mobile freezes the document scroll —
    // so a native anchor jump fired during the tap gets clamped and the
    // page never moves (it stayed on whatever section was behind the
    // drawer). Fix: intercept the tap, close the drawer to restore scroll,
    // then scroll to the target on the next frame.
    drawer.querySelectorAll("[data-drawer-link]").forEach((link) => {
      link.addEventListener("click", (e) => {
        const href = link.getAttribute("href") || "";
        const id = href.startsWith("#") ? href.slice(1) : "";
        const target = id ? document.getElementById(id) : null;
        if (!target) {
          setTimeout(closeDrawer, 50);
          return;
        }
        e.preventDefault();
        closeDrawer(); // lifts body overflow:hidden first
        // Two rAFs: let the overflow style settle before scrolling.
        requestAnimationFrame(() =>
          requestAnimationFrame(() => {
            target.scrollIntoView({ behavior: "smooth", block: "start" });
            try {
              history.replaceState(null, "", href);
            } catch {}
          })
        );
      });
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && !drawer.hidden) closeDrawer();
    });
  }

  // ── Sticky path-nav: highlight active section as you scroll ─────────
  const pathLinks = document.querySelectorAll("[data-paths] [data-path]");
  if (pathLinks.length) {
    const linkByTarget = new Map();
    const sections = [];
    pathLinks.forEach((link) => {
      linkByTarget.set(link.dataset.path, link);
      const el = document.getElementById(link.dataset.path);
      if (el) sections.push({ id: link.dataset.path, el });
    });

    // Drawer items live separately but should mirror chip activity.
    const drawerLinks = document.querySelectorAll("[data-drawer] [data-drawer-link]");
    const hashByPath = (id) => "#" + id;
    const matchesDrawer = (link, id) => link.getAttribute("href") === hashByPath(id);

    let lastActive = null;
    const setActive = (id) => {
      if (id === lastActive) return;
      lastActive = id;
      pathLinks.forEach((l) => l.classList.toggle("is-active", l.dataset.path === id));
      drawerLinks.forEach((l) => l.classList.toggle("is-active", matchesDrawer(l, id)));
      // Keep the active chip in view inside the horizontal path strip.
      const active = linkByTarget.get(id);
      if (!active) return;
      const strip = active.closest("[data-paths]");
      if (!strip) return;
      const lRect = active.getBoundingClientRect();
      const sRect = strip.getBoundingClientRect();
      if (lRect.left < sRect.left + 12) {
        strip.scrollBy({ left: lRect.left - sRect.left - 24, behavior: "smooth" });
      } else if (lRect.right > sRect.right - 12) {
        strip.scrollBy({ left: lRect.right - sRect.right + 24, behavior: "smooth" });
      }
    };

    // Threshold for "this section is now active": its top edge has crossed
    // below the sticky nav. Must be ≥ CSS scroll-padding-top (76 px) so that
    // click-to-anchor immediately marks the target section as active.
    const navOffsetPx = () => {
      const nav = document.querySelector(".nav");
      return nav ? nav.getBoundingClientRect().height + 24 : 80;
    };

    const updateActive = () => {
      const offset = navOffsetPx();
      let current = null;
      for (const { id, el } of sections) {
        if (el.getBoundingClientRect().top - offset <= 4) current = id;
      }
      if (current) setActive(current);
      else if (lastActive) {
        // Before the first section — clear active state.
        lastActive = null;
        pathLinks.forEach((l) => l.classList.remove("is-active"));
        drawerLinks.forEach((l) => l.classList.remove("is-active"));
      }
    };

    let scrollRaf = 0;
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => {
        scrollRaf = 0;
        updateActive();
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    updateActive();
  }

  // ── Inline video preview embed for slider slides ────────────────────
  document.querySelectorAll(".slide__action").forEach((action) => {
    action.addEventListener("click", (e) => {
      const slide = action.closest(".slide");
      if (!slide || slide.classList.contains("is-playing")) return;
      const src = action.dataset.embedSrc || "";
      const titleEl = action.querySelector(".slide__title");
      const title = titleEl ? titleEl.textContent.trim() : "Preview";

      if (!src) {
        // No embed URL yet — flash a "Preview coming soon" hint.
        let hint = action.querySelector(".slide__hint");
        if (!hint) {
          hint = document.createElement("span");
          hint.className = "slide__hint";
          hint.textContent = "Preview coming soon";
          const poster = action.querySelector(".slide__poster");
          if (poster) poster.appendChild(hint);
        }
        requestAnimationFrame(() => hint.classList.add("is-visible"));
        clearTimeout(action._hintTimer);
        action._hintTimer = setTimeout(() => hint.classList.remove("is-visible"), 1800);
        return;
      }

      e.preventDefault();
      slide.classList.add("is-playing");
      const poster = action.querySelector(".slide__poster");
      if (!poster) return;
      const wrap = document.createElement("div");
      wrap.className = "slide__iframe-wrap";
      const iframe = document.createElement("iframe");
      iframe.src = src;
      iframe.title = title;
      iframe.setAttribute("loading", "lazy");
      iframe.setAttribute("allow", "autoplay; encrypted-media; fullscreen; picture-in-picture");
      iframe.setAttribute("allowfullscreen", "");
      iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");
      wrap.appendChild(iframe);

      // Simplification: no close button. Once the iframe loads, the only
      // way to return to the poster is a manual page refresh. Keeps the UI
      // free of stray chrome inside the player.
      poster.replaceWith(wrap);
    });
  });

  // ── Solutions "Learn more" modal ────────────────────────────────────
  //   Each .solution__more button has a data-solution-more slug. We fetch
  //   /assets/solutions/{slug}.md, run a tiny markdown parser over it,
  //   and drop the resulting HTML inside the <dialog>.
  (() => {
    const dialog = document.getElementById("solution-modal");
    if (!dialog) return;
    const contentEl = dialog.querySelector("[data-solution-modal-content]");
    const closeBtn = dialog.querySelector("[data-modal-close]");
    if (!contentEl) return;

    // Tiny, intentionally-minimal markdown → HTML.
    // Supports: # ## ### headings, paragraphs, **bold**, *italic*,
    // `inline code`, [link](url), - bullet lists, > blockquotes, --- hr,
    // and blank-line paragraph separators.
    const escapeHtml = (s) =>
      s
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;");

    const inlineMd = (s) =>
      escapeHtml(s)
        .replace(/`([^`]+)`/g, "<code>$1</code>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*]+)\*/g, "<em>$1</em>")
        .replace(
          /\[([^\]]+)\]\(([^)\s]+)\)/g,
          '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>'
        );

    const md2html = (md) => {
      const lines = md.replace(/\r\n/g, "\n").split("\n");
      let html = "";
      let inList = false;
      let paraBuf = [];
      let inQuote = false;
      let quoteBuf = [];

      const flushPara = () => {
        if (paraBuf.length) {
          html += `<p>${inlineMd(paraBuf.join(" "))}</p>`;
          paraBuf = [];
        }
      };
      const flushList = () => {
        if (inList) {
          html += "</ul>";
          inList = false;
        }
      };
      const flushQuote = () => {
        if (inQuote) {
          html += `<blockquote><p>${inlineMd(quoteBuf.join(" "))}</p></blockquote>`;
          inQuote = false;
          quoteBuf = [];
        }
      };
      const flushAll = () => {
        flushPara();
        flushList();
        flushQuote();
      };

      for (const raw of lines) {
        const line = raw.trimEnd();
        if (/^###\s+/.test(line)) {
          flushAll();
          html += `<h3>${inlineMd(line.replace(/^###\s+/, ""))}</h3>`;
        } else if (/^##\s+/.test(line)) {
          flushAll();
          html += `<h2>${inlineMd(line.replace(/^##\s+/, ""))}</h2>`;
        } else if (/^#\s+/.test(line)) {
          flushAll();
          html += `<h1>${inlineMd(line.replace(/^#\s+/, ""))}</h1>`;
        } else if (/^---+\s*$/.test(line)) {
          flushAll();
          html += "<hr>";
        } else if (/^[-*]\s+/.test(line)) {
          flushPara();
          flushQuote();
          if (!inList) {
            html += "<ul>";
            inList = true;
          }
          html += `<li>${inlineMd(line.replace(/^[-*]\s+/, ""))}</li>`;
        } else if (/^>\s?/.test(line)) {
          flushPara();
          flushList();
          inQuote = true;
          quoteBuf.push(line.replace(/^>\s?/, ""));
        } else if (line.trim() === "") {
          flushAll();
        } else {
          flushList();
          flushQuote();
          paraBuf.push(line);
        }
      }
      flushAll();
      return html;
    };

    // Cache fetched markdown per "{locale}/{folder}/{slug}" key so reopening
    // is instant. Markdown files live under /assets/{folder}/{locale}/{slug}.md
    // and fall back to the English version if the localised one is missing.
    const cache = new Map();
    const locale =
      (window.FibeI18n && window.FibeI18n.locale) || "en";
    const loadAndRender = async (slug, folder) => {
      const localised = `/assets/${folder}/${locale}/${slug}.md`;
      const fallback = `/assets/${folder}/en/${slug}.md`;
      contentEl.innerHTML = '<p class="modal__loading">Loading…</p>';
      try {
        let md = cache.get(localised);
        if (md === undefined) {
          let res = await fetch(localised);
          if (!res.ok && locale !== "en") {
            // Try the English fallback.
            res = await fetch(fallback);
          }
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          md = await res.text();
          cache.set(localised, md);
        }
        contentEl.innerHTML = md2html(md);
        // Scroll the modal back to the top in case it had previous content.
        contentEl.scrollTop = 0;
        // Move focus to the close button so ESC and keyboard nav work.
        if (closeBtn) closeBtn.focus({ preventScroll: true });
      } catch (err) {
        contentEl.innerHTML = `<h1>Couldn't load that one</h1><p>Try again in a moment, or check that the file exists at <code>${escapeHtml(localised)}</code>.</p>`;
      }
    };

    // Wire up every kind of "Read more" trigger to the same modal — each
    // attribute names the markdown folder under /assets/.
    const triggers = [
      { attr: "data-solution-more", folder: "solutions" },
      { attr: "data-capture-more",  folder: "principles" },
    ];
    triggers.forEach(({ attr, folder }) => {
      document.querySelectorAll(`[${attr}]`).forEach((btn) => {
        btn.addEventListener("click", () => {
          const slug = btn.getAttribute(attr);
          if (!slug) return;
          dialog.showModal();
          loadAndRender(slug, folder);
        });
      });
    });

    if (closeBtn) {
      closeBtn.addEventListener("click", () => dialog.close());
    }
    // Click on backdrop (outside the dialog box) also closes.
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) dialog.close();
    });
  })();

  // ── Closing-section bubble physics ──────────────────────────────────
  //   Each .close__bubble drifts slowly and bounces off the section's
  //   edges and off the other bubbles. Disabled below 1024px (CSS hides
  //   the container anyway) and when the user prefers reduced motion.
  (() => {
    const section = document.querySelector(".close");
    if (!section) return;
    const container = section.querySelector("[data-bubbles]");
    if (!container) return;
    const els = [...container.querySelectorAll(".close__bubble")];
    if (!els.length) return;
    if (window.innerWidth < 1024) return;
    const reduce =
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduce) return;

    const init = () => {
      const cr = container.getBoundingClientRect();
      if (cr.width < 100 || cr.height < 100) return false; // not ready

      const bubbles = els.map((el) => {
        const r = el.getBoundingClientRect();
        const x = r.left - cr.left;
        const y = r.top - cr.top;
        // Random gentle starting direction.
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.4 + Math.random() * 2; // ≈ 0.40-0.75 px/frame ≈ 24-45 px/s @60fps
        return {
          el,
          x,
          y,
          w: r.width,
          h: r.height,
          // Treat each bubble as a circle for collision: radius based on
          // the longer side, with a small breathing margin.
          rad: Math.max(r.width, r.height) / 2 + 2,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
        };
      });

      container.classList.add("is-simulating");
      // Apply initial transforms now so the bubbles don't jump.
      bubbles.forEach((b) => {
        b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
      });

      let lastW = cr.width;
      let lastH = cr.height;
      let rafId = 0;
      let paused = false;

      const cap = 0.95; // max speed per axis — keeps motion calm but visible
      const clampVel = (b) => {
        if (b.vx > cap) b.vx = cap;
        if (b.vx < -cap) b.vx = -cap;
        if (b.vy > cap) b.vy = cap;
        if (b.vy < -cap) b.vy = -cap;
      };

      const tick = () => {
        const cr = container.getBoundingClientRect();
        const W = cr.width;
        const H = cr.height;

        // On size change (resize), scale positions proportionally so
        // bubbles stay inside the new bounds.
        if (W !== lastW || H !== lastH) {
          const sx = W / lastW;
          const sy = H / lastH;
          for (const b of bubbles) {
            b.x = Math.max(0, Math.min(W - b.w, b.x * sx));
            b.y = Math.max(0, Math.min(H - b.h, b.y * sy));
          }
          lastW = W;
          lastH = H;
        }

        const n = bubbles.length;

        // Integrate + wall bounce.
        for (let i = 0; i < n; i++) {
          const b = bubbles[i];
          b.x += b.vx;
          b.y += b.vy;
          if (b.x < 0) {
            b.x = 0;
            b.vx = Math.abs(b.vx);
          } else if (b.x + b.w > W) {
            b.x = W - b.w;
            b.vx = -Math.abs(b.vx);
          }
          if (b.y < 0) {
            b.y = 0;
            b.vy = Math.abs(b.vy);
          } else if (b.y + b.h > H) {
            b.y = H - b.h;
            b.vy = -Math.abs(b.vy);
          }
        }

        // Pairwise bubble collisions — circle-vs-circle elastic exchange
        // with equal masses, plus a positional shove so they never sit
        // on top of each other.
        for (let i = 0; i < n; i++) {
          const a = bubbles[i];
          const acx = a.x + a.w / 2;
          const acy = a.y + a.h / 2;
          for (let j = i + 1; j < n; j++) {
            const o = bubbles[j];
            const ocx = o.x + o.w / 2;
            const ocy = o.y + o.h / 2;
            const dx = ocx - acx;
            const dy = ocy - acy;
            const distSq = dx * dx + dy * dy;
            const minDist = a.rad + o.rad;
            if (distSq < minDist * minDist && distSq > 0.0001) {
              const dist = Math.sqrt(distSq);
              const nx = dx / dist;
              const ny = dy / dist;
              const overlap = minDist - dist;
              // Separate equally.
              a.x -= nx * overlap * 0.5;
              a.y -= ny * overlap * 0.5;
              o.x += nx * overlap * 0.5;
              o.y += ny * overlap * 0.5;
              // Elastic exchange along the contact normal (equal mass).
              const va = a.vx * nx + a.vy * ny;
              const vb = o.vx * nx + o.vy * ny;
              if (va - vb < 0) {
                // Only swap if they're approaching, never if separating.
                const dv = vb - va;
                a.vx += dv * nx;
                a.vy += dv * ny;
                o.vx -= dv * nx;
                o.vy -= dv * ny;
                clampVel(a);
                clampVel(o);
              }
            }
          }
        }

        // Render.
        for (let i = 0; i < n; i++) {
          const b = bubbles[i];
          b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
        }

        rafId = requestAnimationFrame(tick);
      };

      // Pause when out of viewport — save battery.
      const io = new IntersectionObserver(
        (entries) => {
          entries.forEach((e) => {
            if (e.isIntersecting && !paused && !rafId) {
              rafId = requestAnimationFrame(tick);
            } else if (!e.isIntersecting && rafId) {
              cancelAnimationFrame(rafId);
              rafId = 0;
            }
          });
        },
        { threshold: 0 }
      );
      io.observe(section);

      // Also pause if the page is hidden.
      document.addEventListener("visibilitychange", () => {
        paused = document.hidden;
        if (paused && rafId) {
          cancelAnimationFrame(rafId);
          rafId = 0;
        } else if (!paused && !rafId) {
          rafId = requestAnimationFrame(tick);
        }
      });

      return true;
    };

    // Wait for layout to settle (CSS loaded, fonts loaded, etc.) before
    // grabbing initial positions.
    const tryInit = (attempt = 0) => {
      if (init()) return;
      if (attempt >= 10) return;
      setTimeout(() => tryInit(attempt + 1), 120);
    };
    if (document.readyState === "complete") {
      tryInit();
    } else {
      window.addEventListener("load", () => tryInit());
    }
  })();

  // ── Subtle pointer tilt on persona visuals (fine pointers only) ─────
  const fine =
    window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  const reduce =
    window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  if (fine && !reduce) {
    const visuals = document.querySelectorAll(".persona__visual");
    visuals.forEach((card) => {
      card.style.willChange = "transform";
      card.addEventListener("pointermove", (e) => {
        const rect = card.getBoundingClientRect();
        const x = (e.clientX - rect.left) / rect.width - 0.5;
        const y = (e.clientY - rect.top) / rect.height - 0.5;
        const rx = (-y * 4).toFixed(2);
        const ry = (x * 4).toFixed(2);
        card.style.transform = `perspective(800px) rotateX(${rx}deg) rotateY(${ry}deg)`;
      });
      card.addEventListener("pointerleave", () => {
        card.style.transform = "";
      });
    });
  }
})();
