/* Shared behaviour: sticky header state, mobile menu, reveal-on-scroll, progress helpers. */
(function () {
  "use strict";
  const ROOT = document.documentElement.dataset.root || "";
  const KEY = "ai-eng-roadmap-cache-v1";
  const PARTS = [["t", "Lý thuyết"], ["b", "Bài tập"], ["p", "Thực hành"]];
  const ORDER = ["p0", "p1", "p2", "p5", "p3", "p4", "p6", "p7", "p8", "p9", "p10"];

  function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); return d && typeof d === "object" ? d : {}; } catch (e) { return {}; } }
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  const phases = () => (typeof PHASES !== "undefined" ? PHASES : []);
  const slug = (id) => id.replace(".", "-");
  function moduleDone(d, m, k) { return !!d[m.id + ":skip"] || !!d[m.id + ":" + k]; }
  function moduleProgress(d, m) { return PARTS.filter(([k]) => moduleDone(d, m, k)).length; }
  function next(d) {
    const P = phases(); if (!P.length) return null;
    const started = (pid) => { const ph = P.find((p) => p.id === pid); return ph && ph.modules.some((m) => d[m.id + ":skip"] || PARTS.some(([k]) => d[m.id + ":" + k])); };
    const order = started("p0") || started("p1") ? ORDER : ORDER.slice(2);
    for (const pid of order) {
      const ph = P.find((p) => p.id === pid);
      for (const m of ph.modules) {
        if (d[m.id + ":skip"]) continue;
        const k = PARTS.find(([k]) => !d[m.id + ":" + k]);
        if (k) return { ph, m, part: k[1] };
      }
    }
    return null;
  }
  function totals(d) {
    let n = 0, x = 0;
    phases().forEach((ph) => ph.modules.forEach((m) => { n += 3; x += moduleProgress(d, m); }));
    return { done: x, total: n, pct: n ? Math.round(x / n * 100) : 0 };
  }
  window.AIE = { ROOT, KEY, PARTS, ORDER, load, save, slug, moduleDone, moduleProgress, next, totals, lessonUrl: (m) => ROOT + (m.link || "bai/" + slug(m.id) + ".html") };

  /* header */
  const sh = document.querySelector(".sh");
  if (sh) {
    const onScroll = () => sh.classList.toggle("scrolled", window.scrollY > 8);
    onScroll(); window.addEventListener("scroll", onScroll, { passive: true });
    const burger = sh.querySelector(".sh-burger"), nav = sh.querySelector(".sh-nav");
    if (burger && nav) {
      burger.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); burger.textContent = o ? "Đóng" : "Menu"; });
      nav.addEventListener("click", (e) => { if (e.target.closest("a")) { nav.classList.remove("open"); burger.setAttribute("aria-expanded", "false"); burger.textContent = "Menu"; } });
    }
    // "Học tiếp" points at the learner's next lesson
    const n = next(load());
    document.querySelectorAll("[data-next-lesson]").forEach((a) => { if (n) { a.href = window.AIE.lessonUrl(n.m); a.title = n.m.title; } });
  }

  /* reveal */
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduce && "IntersectionObserver" in window) {
    const els = [...document.querySelectorAll(".reveal")];
    const io = new IntersectionObserver((entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("pre"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    els.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top > window.innerHeight * 0.92) { el.classList.add("pre"); io.observe(el); } });
    window.addEventListener("beforeprint", () => els.forEach((el) => el.classList.remove("pre")));
  }
})();
