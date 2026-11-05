// Presentation 06 deck runtime (based on class_06/deck.js). Pages are the <section class="page"> elements in
// document order; a page inside <div class="unit" data-title> belongs to it.
// Keys: ←/→ navigate, t = table of contents, i = progress / step counter, a = autoplay, f = fullscreen.
// URL: ?autoplay plays each page for its data-duration (or a per-template default); &loop restarts at the end;
// ?record hides HUD, controls and cursor and ignores keys and touch; dispatch "deck:play" on window to start.
// window receives "deck:end" when the last page's time is up.
(() => {
  const deck = document.getElementById("deck");
  const pages = [...deck.querySelectorAll("section.page")];
  const total = pages.length;
  const unitOf = (page) => page.closest(".unit")?.dataset.title ?? "";
  const titleOf = (page, i) => page.dataset.title || `Page ${i + 1}`;

  let current = -1;
  const params = new URLSearchParams(location.search);
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const LEAVE_MS = 650; // matches the page-out animation in deck.css
  if (params.has("record")) document.body.classList.add("is-record");

  // Page numbers: any .page-num inside a page shows its position in the deck.
  pages.forEach((page, i) => page.querySelectorAll(".page-num").forEach((el) => (el.textContent = i + 1)));

  // ---------- Slide scaling ----------
  const fit = () => {
    const css = getComputedStyle(document.documentElement);
    const w = Number(css.getPropertyValue("--stage-w"));
    const h = Number(css.getPropertyValue("--stage-h"));
    document.documentElement.style.setProperty("--scale", Math.min(innerWidth / w, innerHeight / h));
  };
  addEventListener("resize", fit);
  fit();

  // ---------- TOC ----------
  const toc = document.getElementById("toc");
  const tocList = toc.querySelector("ol");
  let lastUnit = null;
  const tocLinks = pages.map((page, i) => {
    const unit = unitOf(page);
    if (unit && unit !== lastUnit) {
      const li = document.createElement("li");
      li.className = "toc-unit";
      li.textContent = unit;
      tocList.append(li);
    }
    lastUnit = unit;
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.href = `#/${i + 1}`;
    a.className = unit ? "in-unit" : "";
    a.innerHTML = `<span class="n">${i + 1}</span><span class="t"></span><span class="kind">${page.dataset.type}</span>`;
    a.querySelector(".t").textContent = titleOf(page, i);
    a.addEventListener("click", () => setToc(false));
    li.append(a);
    tocList.append(li);
    return a;
  });

  const setToc = (open) => {
    document.body.classList.toggle("toc-open", open);
    if (open) setPlaying(false);
  };
  const setHud = (hidden) => {
    document.body.classList.toggle("hud-hidden", hidden);
    localStorage.setItem("deck-hud-hidden", hidden ? "1" : "0");
  };
  setHud(localStorage.getItem("deck-hud-hidden") === "1");

  // ---------- HUD ----------
  const bar = document.querySelector("#progress > span");
  const counter = document.getElementById("counter");
  const renderHud = () => {
    const page = pages[current];
    const pct = total > 1 ? Math.round((current / (total - 1)) * 100) : 100;
    bar.style.width = `${pct}%`;
    counter.querySelector(".unit").textContent = unitOf(page);
    counter.querySelector(".type").textContent = page.dataset.type;
    counter.querySelector(".step").textContent = `step ${current + 1} / ${total}`;
    counter.querySelector(".pct").textContent = `${pct}%`;
    tocLinks.forEach((a, i) => a.classList.toggle("is-current", i === current));
  };

  // ---------- Three.js diagrams (lazy ES modules exporting mount(el)) ----------
  const diagrams = new Map();
  const enterDiagrams = (page) => {
    page.querySelectorAll(".diagram[data-module]").forEach(async (el) => {
      if (!diagrams.has(el)) {
        diagrams.set(el, null);
        el.innerHTML = '<div class="diagram-status">Loading diagram…</div>';
        try {
          const mod = await import(new URL(el.dataset.module, location.href).href);
          el.innerHTML = "";
          diagrams.set(el, (await mod.mount(el)) ?? {});
        } catch (err) {
          // file:// blocks ES modules; anything else is a real error worth showing.
          el.querySelector(".diagram-status").textContent =
            location.protocol === "file:"
              ? "Diagram needs an http server (see README)."
              : `Diagram failed to load: ${err?.message ?? err}`;
          console.error(err);
          return;
        }
      }
      if (pages[current] === page) diagrams.get(el)?.start?.();
    });
  };
  const leaveDiagrams = (page) =>
    page.querySelectorAll(".diagram[data-module]").forEach((el) => diagrams.get(el)?.stop?.());

  // ---------- Navigation ----------
  // The old page stays visible (.is-leaving) while it fades out; its diagrams stop once it is gone.
  const go = (index) => {
    const next = Math.max(0, Math.min(total - 1, index));
    if (next === current) return;
    const prev = current;
    pages.forEach((p) => {
      if (p.classList.contains("is-leaving")) { clearTimeout(p._leave); p.classList.remove("is-leaving"); if (p !== pages[next]) leaveDiagrams(p); }
    });
    if (prev >= 0) {
      const old = pages[prev];
      old.classList.remove("is-active");
      if (reduced) leaveDiagrams(old);
      else {
        old.classList.add("is-leaving");
        old._leave = setTimeout(() => { old.classList.remove("is-leaving"); if (pages[current] !== old) leaveDiagrams(old); }, LEAVE_MS);
      }
    }
    deck.dataset.dir = next > prev ? "next" : "prev";
    current = next;
    const page = pages[current];
    page.classList.add("is-active");
    if (page.dataset.type === "doc") {
      page.scrollTop = 0;
      page.focus({ preventScroll: true });
    }
    enterDiagrams(page);
    renderHud();
    const hash = `#/${current + 1}`;
    if (location.hash !== hash) history.replaceState(null, "", hash);
    document.title = `${titleOf(page, current)} · GenAI System Mindset`;
    schedule();
  };

  // ---------- Autoplay ----------
  const durationOf = (page) => {
    if (page.dataset.duration) return Number(page.dataset.duration);
    if (page.querySelector(".cover")) return 7;
    if (page.querySelector(".layout-statement-dark")) return 9;
    if (page.querySelector(".diagram[data-module]") || page.dataset.type === "doc") return 20;
    return 15;
  };
  let playing = false, timer = 0, slideStart = 0, slideMs = 0, left = 0;
  const advance = () => {
    if (current < total - 1) return go(current + 1);
    dispatchEvent(new Event("deck:end"));
    if (params.has("loop")) go(0);
    else setPlaying(false);
  };
  function schedule() {
    clearTimeout(timer);
    slideMs = durationOf(pages[current]) * 1000;
    slideStart = performance.now();
    left = slideMs;
    if (playing) timer = setTimeout(advance, slideMs);
  }
  function setPlaying(on) {
    if (on === playing) return;
    playing = on;
    document.body.classList.toggle("is-playing", on);
    if (on) { slideStart = performance.now() - (slideMs - left); timer = setTimeout(advance, left); }
    else { clearTimeout(timer); left = Math.max(0, slideMs - (performance.now() - slideStart)); }
  }

  // ---------- On-screen controls (auto-hide after a few idle seconds) ----------
  const controls = document.getElementById("controls");
  const ring = controls?.querySelector(".ring circle");
  const toggleFull = () => (document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.());
  controls?.addEventListener("click", (e) => {
    const act = e.target.closest("button")?.dataset.act;
    if (act === "prev") go(current - 1);
    if (act === "next") go(current + 1);
    if (act === "play") setPlaying(!playing);
    if (act === "full") toggleFull();
    e.target.closest("button")?.blur();
  });
  let idle = 0;
  const wake = () => {
    if (document.body.classList.contains("is-record")) return;
    document.body.classList.remove("controls-idle");
    clearTimeout(idle);
    idle = setTimeout(() => document.body.classList.add("controls-idle"), 2500);
  };
  addEventListener("mousemove", wake);
  addEventListener("touchstart", wake, { passive: true });
  wake();
  const paintRing = () => {
    const done = !slideMs ? 0 : playing ? (performance.now() - slideStart) / slideMs : (slideMs - left) / slideMs;
    ring?.style.setProperty("--p", Math.min(1, Math.max(0, done)).toFixed(3));
    requestAnimationFrame(paintRing);
  };
  if (ring) requestAnimationFrame(paintRing);

  const fromHash = () => {
    const n = parseInt(location.hash.replace(/^#\/?/, ""), 10);
    return Number.isFinite(n) ? n - 1 : 0;
  };
  addEventListener("hashchange", () => go(fromHash()));

  pages.forEach((p) => {
    if (p.dataset.type === "doc") p.tabIndex = -1;
  });

  // In a doc page Space / ↓ scroll first; they advance only once the end is reached.
  const atEnd = (p) => p.scrollTop + p.clientHeight >= p.scrollHeight - 2;
  const atStart = (p) => p.scrollTop <= 2;

  const recording = document.body.classList.contains("is-record");
  addEventListener("deck:play", () => setPlaying(true));
  addEventListener("keydown", (e) => {
    if (recording || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
    const page = pages[current];
    const isDoc = page.dataset.type === "doc";

    switch (e.key) {
      case "t":
      case "T":
        setToc(!document.body.classList.contains("toc-open"));
        break;
      case "i":
      case "I":
        setHud(!document.body.classList.contains("hud-hidden"));
        break;
      case "Escape":
        setToc(false);
        break;
      case "a":
      case "A":
        setPlaying(!playing);
        break;
      case "f":
      case "F":
        toggleFull();
        break;
      case "ArrowRight":
      case "PageDown":
      case "n":
        go(current + 1);
        break;
      case "ArrowLeft":
      case "PageUp":
      case "p":
        go(current - 1);
        break;
      case "Home":
        go(0);
        break;
      case "End":
        go(total - 1);
        break;
      case "ArrowDown":
      case " ":
        if (e.key === " " && e.shiftKey) {
          if (isDoc && !atStart(page)) return;
          go(current - 1);
        } else {
          if (isDoc && !atEnd(page)) return; // let the browser scroll
          go(current + 1);
        }
        break;
      case "ArrowUp":
        if (isDoc && !atStart(page)) return;
        go(current - 1);
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  // Touch: horizontal swipe navigates; vertical stays native scroll.
  let touch = null;
  addEventListener("touchstart", (e) => (touch = e.touches[0]), { passive: true });
  addEventListener("touchend", (e) => {
    if (!touch || recording) return;
    const dx = e.changedTouches[0].clientX - touch.clientX;
    const dy = e.changedTouches[0].clientY - touch.clientY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
    touch = null;
  });

  go(fromHash());
  if (params.has("autoplay")) setPlaying(true);
})();
