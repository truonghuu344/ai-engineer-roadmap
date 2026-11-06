/* Shared behaviour: sticky header state, mobile menu, reveal-on-scroll, progress helpers. */
(function () {
  "use strict";
  const ROOT = document.documentElement.dataset.root || "";
  const KEY = "ai-eng-roadmap-cache-v1";
  const PARTS = [["t", "Lý thuyết"], ["b", "Bài tập"], ["p", "Thực hành"]];
  const ORDER = ["p0", "p1", "p2", "p3", "p4", "p5", "p6", "p7", "p8", "p9", "p10"];

  /* v2 (11/2026): P0.1 cũ (numpy, pandas, matplotlib) tách thành P0.1 Python, P0.2 numpy, P0.3 pandas, P0.4 matplotlib; toán P0.2 → P0.5, công cụ P0.3 → P0.7 */
  function migrate(d) {
    if (d._v >= 2) return d;
    const out = { _v: 2 };
    for (const [k, v] of Object.entries(d)) {
      const m = k.match(/^p0\.([123])(:.*)$/);
      if (!m) { out[k] = v; continue; }
      if (m[1] === "1") ["p0.1", "p0.2", "p0.3", "p0.4"].forEach((id) => { out[id + m[2]] = v; });
      else out["p0." + (m[1] === "2" ? "5" : "7") + m[2]] = v;
    }
    try {
      localStorage.setItem(KEY, JSON.stringify(out));
      const ex = (id) => "aie-ex-" + id, g = (id) => localStorage.getItem(ex(id));
      const e2 = g("p0.2"), e3 = g("p0.3");
      ["p0.1", "p0.2", "p0.3"].forEach((id) => localStorage.removeItem(ex(id)));
      if (e2) localStorage.setItem(ex("p0.5"), e2);
      if (e3) localStorage.setItem(ex("p0.7"), e3);
    } catch (e) {}
    return out;
  }
  function load() { try { const d = JSON.parse(localStorage.getItem(KEY) || "null"); return d && typeof d === "object" ? migrate(d) : { _v: 2 }; } catch (e) { return {}; } }
  load();                                   /* chuyển dữ liệu cũ ngay khi trang mở */
  function save(d) { try { localStorage.setItem(KEY, JSON.stringify(d)); } catch (e) {} }
  const phases = () => (typeof PHASES !== "undefined" ? PHASES : []);
  const slug = (id) => id.replace(".", "-");
  function moduleDone(d, m, k) { return !!d[m.id + ":skip"] || !!d[m.id + ":" + k]; }
  function moduleProgress(d, m) { return PARTS.filter(([k]) => moduleDone(d, m, k)).length; }
  function next(d) {
    const P = phases(); if (!P.length) return null;
    const started = (pid) => { const ph = P.find((p) => p.id === pid); return ph && ph.modules.some((m) => d[m.id + ":skip"] || PARTS.some(([k]) => d[m.id + ":" + k])); };
    const any = P.some((ph) => started(ph.id));
    const order = !any || started("p0") || started("p1") ? ORDER : ORDER.slice(2);   /* người mới: bắt đầu từ P0.1 */
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
  /* ================= effects ================= */
  const fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* confetti: AIE.confetti(x, y, n) bursts from a viewport point */
  let cv = null, ctx2 = null, bits = [], raf = 0;
  function confetti(x, y, n) {
    if (reduce) return;
    if (!cv) { cv = document.createElement("canvas"); cv.className = "fx-confetti"; cv.setAttribute("aria-hidden", "true"); document.body.appendChild(cv); ctx2 = cv.getContext("2d"); }
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    cv.width = innerWidth * dpr; cv.height = innerHeight * dpr; ctx2.setTransform(dpr, 0, 0, dpr, 0, 0);
    const cs = getComputedStyle(document.documentElement);
    const cols = ["--accent", "--hot", "--ok", "--side"].map((v) => cs.getPropertyValue(v).trim() || "#2C47D1").concat(["#F2B705"]);
    for (let i = 0; i < (n || 40); i++) {
      const a = -Math.PI / 2 + (Math.random() - .5) * Math.PI * .9, v = 5 + Math.random() * 7;
      bits.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v, r: Math.random() * 6.28, vr: (Math.random() - .5) * .4, w: 5 + Math.random() * 5, h: 3 + Math.random() * 4, c: cols[i % cols.length], life: 0 });
    }
    if (!raf) raf = requestAnimationFrame(tick);
  }
  function tick() {
    ctx2.clearRect(0, 0, innerWidth, innerHeight);
    bits = bits.filter((b) => b.life < 110 && b.y < innerHeight + 20);
    bits.forEach((b) => {
      b.life++; b.vy += .28; b.vx *= .985; b.x += b.vx; b.y += b.vy; b.r += b.vr;
      ctx2.save(); ctx2.globalAlpha = Math.max(0, 1 - b.life / 110); ctx2.translate(b.x, b.y); ctx2.rotate(b.r);
      ctx2.fillStyle = b.c; ctx2.fillRect(-b.w / 2, -b.h / 2, b.w, b.h * Math.abs(Math.cos(b.r * 1.7)) + 1); ctx2.restore();
    });
    raf = bits.length ? requestAnimationFrame(tick) : 0;
    if (!raf) ctx2.clearRect(0, 0, innerWidth, innerHeight);
  }
  window.AIE.confetti = confetti;
  window.AIE.confettiAt = (el, n) => { const r = el.getBoundingClientRect(); confetti(r.left + r.width / 2, r.top + r.height / 2, n); };

  /* reading progress + back to top */
  const bar = document.createElement("div"); bar.className = "fx-prog"; bar.innerHTML = "<i></i>";
  if (sh) sh.appendChild(bar);
  const top = document.createElement("button");
  top.className = "fx-top"; top.type = "button"; top.setAttribute("aria-label", "Lên đầu trang");
  top.innerHTML = '<svg viewBox="0 0 46 46" aria-hidden="true"><circle class="tr" cx="23" cy="23" r="21"/><circle class="pr" cx="23" cy="23" r="21"/></svg><b>↑</b>';
  document.body.appendChild(top);
  top.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" }));
  const barI = bar.firstChild, ring = top.querySelector(".pr");
  let ticking = false;
  const onProg = () => {
    ticking = false;
    const max = document.documentElement.scrollHeight - innerHeight, f = max > 0 ? Math.min(1, scrollY / max) : 0;
    barI.style.transform = `scaleX(${f})`; ring.style.strokeDashoffset = String(132 * (1 - f));
    top.classList.toggle("on", scrollY > innerHeight * 1.2);
  };
  window.addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(onProg); } }, { passive: true });
  window.addEventListener("resize", onProg); onProg();

  /* cursor spotlight + gentle tilt on cards */
  if (fine && !reduce) {
    const spot = ".fcard, .trio-card, .lcard, .excard, .pn a, .abox, .pblock, .stats > div, .dl, .mcard";
    document.addEventListener("pointermove", (e) => {
      const el = e.target.closest && e.target.closest(spot); if (!el) return;
      if (!el.classList.contains("fx-spot")) el.classList.add("fx-spot");
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", (e.clientX - r.left) + "px"); el.style.setProperty("--my", (e.clientY - r.top) + "px");
      if (el.matches(".fcard, .trio-card")) {
        const px = (e.clientX - r.left) / r.width - .5, py = (e.clientY - r.top) / r.height - .5;
        el.classList.add("fx-tilt"); el.style.transform = `perspective(900px) rotateX(${(-py * 5).toFixed(2)}deg) rotateY(${(px * 6).toFixed(2)}deg) translateY(-4px)`;
      }
    }, { passive: true });
    document.addEventListener("pointerout", (e) => {
      const el = e.target.closest && e.target.closest(".fx-tilt"); if (el && !el.contains(e.relatedTarget)) el.style.transform = "";
    });
    /* hero light */
    const hero = document.querySelector(".hero");
    if (hero) {
      hero.addEventListener("pointermove", (e) => { const r = hero.getBoundingClientRect(); hero.style.setProperty("--hx", (e.clientX - r.left) + "px"); hero.style.setProperty("--hy", (e.clientY - r.top) + "px"); hero.classList.add("lit"); });
      hero.addEventListener("pointerleave", () => hero.classList.remove("lit"));
    }
  }

  /* hero intro: children slide in one after another */
  const heroCol = document.querySelector(".hero-grid > div");
  if (heroCol && !reduce) { [...heroCol.children].forEach((c, i) => c.style.setProperty("--i", i)); heroCol.classList.add("fx-in"); }

  /* click ripple */
  if (!reduce) document.addEventListener("pointerdown", (e) => {
    const el = e.target.closest && e.target.closest(".btn, .sh-cta, .btn-check, .tab, .fchip"); if (!el) return;
    if (!el.classList.contains("fx-rip")) { if (getComputedStyle(el).position === "static") el.style.position = "relative"; el.classList.add("fx-rip"); }
    const r = el.getBoundingClientRect(), s = Math.max(r.width, r.height) * 2.2, sp = document.createElement("span");
    sp.className = "rip"; sp.style.cssText = `width:${s}px;height:${s}px;left:${e.clientX - r.left - s / 2}px;top:${e.clientY - r.top - s / 2}px`;
    el.appendChild(sp); setTimeout(() => sp.remove(), 650);
  });

  /* numbers count up when they come into view */
  const nums = [...document.querySelectorAll(".stats b, [data-count]")].filter((b) => /^\d+$/.test(b.textContent.trim()));
  if (nums.length && !reduce && "IntersectionObserver" in window) {
    const io2 = new IntersectionObserver((es) => es.forEach((e) => {
      if (!e.isIntersecting) return; io2.unobserve(e.target);
      const el = e.target, to = +el.dataset.to, t0 = performance.now(), dur = 1100;
      const step = (t) => { const k = Math.min(1, (t - t0) / dur), v = Math.round(to * (1 - Math.pow(1 - k, 3))); el.textContent = v; if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }), { threshold: .6 });
    nums.forEach((b) => { b.dataset.to = b.textContent.trim(); b.textContent = "0"; io2.observe(b); });
  }

  /* staggered reveal: siblings that appear together come in one by one */
  document.querySelectorAll(".reveal.pre").forEach((el) => {
    const sib = [...el.parentElement.children].filter((x) => x.classList.contains("reveal"));
    const i = sib.indexOf(el); if (sib.length > 1 && i > 0) { el.style.transitionDelay = Math.min(i % 6, 5) * 70 + "ms"; el.addEventListener("transitionend", () => (el.style.transitionDelay = ""), { once: true }); }
  });
  /* roadmap bars wait until visible, then grow */
  const growers = [...document.querySelectorAll("#gantt, #bars")];
  if (growers.length && !reduce && "IntersectionObserver" in window) {
    const io3 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.remove("fx-wait"); io3.unobserve(e.target); } }), { threshold: .25 });
    growers.forEach((g) => { g.classList.add("fx-wait"); io3.observe(g); });
  }
})();
