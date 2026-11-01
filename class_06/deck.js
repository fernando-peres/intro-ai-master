// Class 06 deck runtime. Pages are the <section class="page"> elements in
// document order; a page inside <div class="unit" data-title> belongs to it.
// Keys: ←/→ navigate, t = table of contents, i = progress / step counter.
(() => {
  const deck = document.getElementById("deck");
  const pages = [...deck.querySelectorAll("section.page")];
  const total = pages.length;
  const unitOf = (page) => page.closest(".unit")?.dataset.title ?? "";
  const titleOf = (page, i) => page.dataset.title || `Page ${i + 1}`;

  let current = -1;

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

  const setToc = (open) => document.body.classList.toggle("toc-open", open);
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
          el.querySelector(".diagram-status").textContent =
            "Diagram needs an http server (see README).";
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
  const go = (index) => {
    const next = Math.max(0, Math.min(total - 1, index));
    if (next === current) return;
    if (current >= 0) {
      pages[current].classList.remove("is-active");
      leaveDiagrams(pages[current]);
    }
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
    document.title = `${titleOf(page, current)} · Class 06`;
  };

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

  addEventListener("keydown", (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
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
    if (!touch) return;
    const dx = e.changedTouches[0].clientX - touch.clientX;
    const dy = e.changedTouches[0].clientY - touch.clientY;
    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) go(current + (dx < 0 ? 1 : -1));
    touch = null;
  });

  go(fromHash());
})();
