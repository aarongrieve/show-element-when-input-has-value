/* =========================================================
   AIRON — interaction + motion
   GSAP + ScrollTrigger + Lenis, plus a canvas "sea + mist" bg
   ========================================================= */
(function () {
  "use strict";

  const prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const hasGSAP = typeof window.gsap !== "undefined";
  if (hasGSAP && typeof window.ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);
  }

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  document.getElementById("year").textContent = new Date().getFullYear();

  /* =======================================================
     1. LENIS SMOOTH SCROLL  (synced to ScrollTrigger)
     ======================================================= */
  let lenis = null;
  function initSmoothScroll() {
    if (prefersReduced || typeof window.Lenis === "undefined") return;
    lenis = new Lenis({ duration: 1.15, lerp: 0.09, wheelMultiplier: 1, smoothWheel: true });
    lenis.on("scroll", () => { if (hasGSAP && ScrollTrigger) ScrollTrigger.update(); });
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);

    // anchor links -> lenis
    $$('a[href^="#"]').forEach((a) => {
      a.addEventListener("click", (e) => {
        const id = a.getAttribute("href");
        if (id.length < 2) return;
        const el = document.querySelector(id);
        if (!el) return;
        e.preventDefault();
        lenis.scrollTo(el, { offset: -10, duration: 1.2 });
      });
    });
  }

  /* =======================================================
     2. ATMOSPHERIC CANVAS — layered sea waves + drifting motes
     ======================================================= */
  function initFX() {
    const canvas = document.getElementById("fx");
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let w, h, dpr, t = 0;
    const mouse = { x: 0.5, y: 0.5, tx: 0.5, ty: 0.5 };

    const motes = [];
    function seedMotes() {
      motes.length = 0;
      const count = Math.min(70, Math.floor(window.innerWidth / 22));
      for (let i = 0; i < count; i++) {
        motes.push({
          x: Math.random(), y: Math.random(),
          r: Math.random() * 1.8 + 0.4,
          s: Math.random() * 0.00018 + 0.00004,
          a: Math.random() * 0.5 + 0.15,
          hue: Math.random() > 0.5 ? 168 : 32,
          drift: Math.random() * Math.PI * 2,
        });
      }
    }

    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = canvas.width = Math.floor(innerWidth * dpr);
      h = canvas.height = Math.floor(innerHeight * dpr);
      canvas.style.width = innerWidth + "px";
      canvas.style.height = innerHeight + "px";
      seedMotes();
    }

    // three stacked wave bands (Teifi / sea / horizon)
    const bands = [
      { amp: 0.045, len: 1.4, sp: 0.6,  yy: 0.72, col: "rgba(47,111,102,0.30)" },
      { amp: 0.060, len: 1.0, sp: 0.9,  yy: 0.82, col: "rgba(95,179,163,0.22)" },
      { amp: 0.085, len: 0.7, sp: 1.25, yy: 0.94, col: "rgba(9,20,20,0.9)"     },
    ];

    function drawBand(b) {
      const my = (mouse.y - 0.5) * 0.04 * h;
      ctx.beginPath();
      ctx.moveTo(0, h);
      const step = Math.max(6, w / 160);
      for (let x = 0; x <= w; x += step) {
        const nx = x / w;
        const y =
          b.yy * h + my +
          Math.sin(nx * Math.PI * 2 * (2 / b.len) + t * b.sp) * b.amp * h +
          Math.sin(nx * Math.PI * 2 * (5 / b.len) + t * b.sp * 1.7) * b.amp * 0.35 * h;
        ctx.lineTo(x, y);
      }
      ctx.lineTo(w, h);
      ctx.closePath();
      ctx.fillStyle = b.col;
      ctx.fill();
    }

    function frame() {
      t += 0.006;
      mouse.x += (mouse.tx - mouse.x) * 0.05;
      mouse.y += (mouse.ty - mouse.y) * 0.05;
      ctx.clearRect(0, 0, w, h);

      // ambient top glow that follows the cursor a touch
      const g = ctx.createRadialGradient(
        w * (0.5 + (mouse.x - 0.5) * 0.3), h * 0.12, 0,
        w * 0.5, h * 0.12, h * 0.9
      );
      g.addColorStop(0, "rgba(24,42,42,0.55)");
      g.addColorStop(0.5, "rgba(11,16,18,0.15)");
      g.addColorStop(1, "rgba(7,10,11,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      // drifting motes (mist / embers)
      for (const m of motes) {
        m.y -= m.s;
        m.drift += 0.01;
        if (m.y < -0.02) { m.y = 1.02; m.x = Math.random(); }
        const px = (m.x + Math.sin(m.drift) * 0.01) * w + (mouse.x - 0.5) * 30 * m.r;
        const py = m.y * h;
        ctx.beginPath();
        ctx.arc(px, py, m.r * dpr, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(${m.hue}, 55%, 65%, ${m.a})`;
        ctx.fill();
      }

      bands.forEach(drawBand);
      raf = requestAnimationFrame(frame);
    }

    let raf;
    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("mousemove", (e) => {
      mouse.tx = e.clientX / innerWidth;
      mouse.ty = e.clientY / innerHeight;
    }, { passive: true });
    document.addEventListener("visibilitychange", () => {
      if (document.hidden) { cancelAnimationFrame(raf); }
      else if (!prefersReduced) { raf = requestAnimationFrame(frame); }
    });

    resize();
    if (prefersReduced) {
      // static single paint
      bands.forEach(drawBand);
    } else {
      raf = requestAnimationFrame(frame);
    }
    requestAnimationFrame(() => canvas.classList.add("is-on"));
  }

  /* =======================================================
     3. CUSTOM CURSOR
     ======================================================= */
  function initCursor() {
    const cur = document.getElementById("cursor");
    if (!cur || !window.matchMedia("(hover:hover) and (pointer:fine)").matches) return;
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    function loop() {
      cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
      cur.style.transform = `translate(${cx}px, ${cy}px)`;
      requestAnimationFrame(loop);
    }
    loop();
    document.addEventListener("mouseover", (e) => {
      const el = e.target.closest("[data-cursor]");
      cur.classList.toggle("is-hover", !!el && el.dataset.cursor === "hover");
      cur.classList.toggle("is-play", !!el && el.dataset.cursor === "play");
    });
  }

  /* =======================================================
     4. PRELOADER  ->  HERO INTRO
     ======================================================= */
  function initPreloader() {
    const pre = document.getElementById("preloader");
    const bar = document.getElementById("preloadBar");
    const pct = document.getElementById("preloadPct");
    const letters = $$("[data-preload-word] span");

    if (!hasGSAP) { if (pre) pre.style.display = "none"; heroIntro(); revealSetup(); return; }

    const tl = gsap.timeline();
    tl.to(letters, { y: 0, duration: 0.9, ease: "power4.out", stagger: 0.06 });

    const prog = { v: 0 };
    tl.to(prog, {
      v: 100, duration: 1.4, ease: "power1.inOut",
      onUpdate() {
        const val = Math.round(prog.v);
        if (bar) bar.style.width = val + "%";
        if (pct) pct.textContent = String(val).padStart(2, "0");
      },
    }, 0.2);

    tl.to("[data-preload-word]", { y: -20, opacity: 0, duration: 0.5, ease: "power2.in" }, "+=0.15");
    tl.to(pre, {
      yPercent: -100, duration: 0.9, ease: "power4.inOut",
      onStart() { pre.classList.add("is-done"); },
      onComplete() { pre.style.display = "none"; },
    }, "-=0.2");

    tl.add(heroIntro, "-=0.6");
  }

  /* =======================================================
     5. HERO INTRO
     ======================================================= */
  function heroIntro() {
    if (!hasGSAP) return;
    const letters = $$("[data-hero-letter]");
    gsap.set(letters, { yPercent: 120, opacity: 0 });
    gsap.to(letters, {
      yPercent: 0, opacity: 1, duration: 1.1, ease: "power4.out", stagger: 0.08,
    });

    // eyebrow / sub / actions / meta
    const bits = $$(".hero [data-reveal]");
    gsap.to(bits, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.09, delay: 0.5 });

    // subtle continuous float on the letters + parallax on scroll
    if (!prefersReduced) {
      letters.forEach((l, i) => {
        gsap.to(l, {
          y: "+=10", duration: 2.6 + i * 0.2, ease: "sine.inOut",
          yoyo: true, repeat: -1, delay: 1 + i * 0.1,
        });
      });
      if (ScrollTrigger) {
        gsap.to(".hero__title", {
          yPercent: 28, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });
        gsap.to(".hero__sub, .hero__actions, .hero__meta", {
          yPercent: 60, opacity: 0.2, ease: "none",
          scrollTrigger: { trigger: ".hero", start: "top top", end: "bottom top", scrub: true },
        });
      }
    }
  }

  /* =======================================================
     6. SCROLL REVEALS  (generic + line-split)
     ======================================================= */
  function splitLines(el) {
    // wrap words so we can reveal per line-ish (word groups)
    const text = el.textContent.trim();
    el.innerHTML = "";
    const words = text.split(/\s+/);
    const holder = document.createElement("span");
    holder.className = "reveal-line";
    const inner = document.createElement("span");
    inner.textContent = text;
    holder.appendChild(inner);
    el.appendChild(holder);
    return inner;
  }

  function revealSetup() {
    if (!hasGSAP || !ScrollTrigger) {
      $$("[data-reveal]").forEach((e) => { e.style.opacity = 1; e.style.transform = "none"; });
      return;
    }

    // generic reveals (skip hero, handled in intro)
    $$("[data-reveal]").forEach((el) => {
      if (el.closest(".hero")) return;
      gsap.to(el, {
        opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
        scrollTrigger: { trigger: el, start: "top 88%" },
      });
    });

    // headline line reveals
    $$("[data-reveal-lines]").forEach((el) => {
      const inner = splitLines(el);
      gsap.to(inner, {
        yPercent: 0, duration: 1.1, ease: "power4.out",
        scrollTrigger: { trigger: el, start: "top 85%" },
      });
    });

    // tracklist stagger
    gsap.from("[data-track]", {
      opacity: 0, y: 24, duration: 0.7, ease: "power3.out", stagger: 0.06,
      scrollTrigger: { trigger: "#tracklist", start: "top 80%" },
    });

    // 3D tilt intro on cover
    gsap.from("#featuredCover", {
      rotateY: -18, rotateX: 8, opacity: 0, scale: 0.92, duration: 1.2, ease: "power3.out",
      scrollTrigger: { trigger: ".release", start: "top 75%" },
    });

    // stat count-up
    $$("[data-count]").forEach((el) => {
      const end = parseInt(el.dataset.count, 10);
      const o = { v: 0 };
      ScrollTrigger.create({
        trigger: el, start: "top 90%", once: true,
        onEnter() {
          gsap.to(o, { v: end, duration: 1.4, ease: "power2.out",
            onUpdate() { el.textContent = Math.round(o.v); } });
        },
      });
    });
  }

  /* =======================================================
     7. PARALLAX elements
     ======================================================= */
  function initParallax() {
    if (!hasGSAP || !ScrollTrigger || prefersReduced) return;
    $$("[data-parallax]").forEach((el) => {
      const amt = parseFloat(el.dataset.parallax) || 0.1;
      gsap.to(el, {
        yPercent: -amt * 100, ease: "none",
        scrollTrigger: { trigger: el, start: "top bottom", end: "bottom top", scrub: true },
      });
    });
  }

  /* =======================================================
     8. MARQUEES
     ======================================================= */
  function initMarquees() {
    if (!hasGSAP || prefersReduced) return;
    const tracks = $$("[data-marquee]");
    if (tracks.length) {
      tracks.forEach((tr, i) => {
        gsap.to(tr, { xPercent: -100, duration: 22, ease: "none", repeat: -1 });
      });
    }
    const foot = $("[data-marquee-foot]");
    if (foot) {
      // duplicate content to allow seamless loop
      foot.innerHTML = foot.innerHTML + foot.innerHTML;
      gsap.to(foot, {
        xPercent: -50, ease: "none",
        scrollTrigger: { trigger: ".footer", start: "top bottom", end: "bottom top", scrub: 1 },
      });
    }
  }

  /* =======================================================
     9. NAV hide on scroll down / show on up
     ======================================================= */
  function initNav() {
    const nav = document.getElementById("nav");
    if (!nav) return;
    let last = 0;
    const onScroll = (y) => {
      if (y > last && y > 320) nav.classList.add("is-hidden");
      else nav.classList.remove("is-hidden");
      last = y;
    };
    if (lenis) lenis.on("scroll", ({ scroll }) => onScroll(scroll));
    else window.addEventListener("scroll", () => onScroll(window.scrollY), { passive: true });
  }

  /* =======================================================
     10. FEATURED "PLAYER" — animated waveform toggle
     (visual preview; real streaming via the platform links)
     ======================================================= */
  function initPlayer() {
    const cover = document.getElementById("featuredCover");
    const btn = document.getElementById("playToggle");
    const canvas = document.getElementById("coverWave");
    if (!cover || !btn || !canvas) return;

    const ctx = canvas.getContext("2d");
    let playing = false, raf = null, phase = 0;
    const bars = 48;
    const heights = new Array(bars).fill(0.2);
    const targets = new Array(bars).fill(0.2);

    function size() {
      const r = canvas.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      canvas.width = r.width * dpr; canvas.height = r.height * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function draw() {
      const r = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, r.width, r.height);
      const bw = r.width / bars;
      phase += 0.08;
      for (let i = 0; i < bars; i++) {
        if (playing) {
          if (Math.random() < 0.12) targets[i] = Math.random() * 0.9 + 0.1;
          const env = 0.5 + 0.5 * Math.sin(phase + i * 0.4);
          targets[i] = Math.max(targets[i] * 0.96, 0.12 + env * 0.55);
        } else {
          targets[i] = 0.14;
        }
        heights[i] += (targets[i] - heights[i]) * 0.2;
        const bh = heights[i] * r.height * 0.9;
        const x = i * bw + bw * 0.2;
        const grd = ctx.createLinearGradient(0, r.height, 0, r.height - bh);
        grd.addColorStop(0, "rgba(95,179,163,0.25)");
        grd.addColorStop(1, "rgba(224,160,90,0.95)");
        ctx.fillStyle = grd;
        ctx.fillRect(x, r.height - bh, bw * 0.6, bh);
      }
      raf = requestAnimationFrame(draw);
    }

    function start() {
      playing = true; cover.classList.add("is-playing");
      btn.setAttribute("aria-pressed", "true");
      size(); if (!raf) draw();
    }
    function stop() {
      playing = false; cover.classList.remove("is-playing");
      btn.setAttribute("aria-pressed", "false");
      setTimeout(() => { if (!playing && raf) { cancelAnimationFrame(raf); raf = null; ctx.clearRect(0,0,canvas.width,canvas.height); } }, 700);
    }
    btn.addEventListener("click", (e) => { e.preventDefault(); playing ? stop() : start(); });
    window.addEventListener("resize", () => { if (playing) size(); }, { passive: true });
  }

  /* =======================================================
     11. NEWSLETTER (front-end only, graceful)
     ======================================================= */
  function initSignup() {
    const form = document.getElementById("signup");
    const note = document.getElementById("signupNote");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const email = form.email.value.trim();
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
      note.classList.remove("is-ok", "is-err");
      if (!ok) { note.textContent = "Hmm — that email doesn't look right."; note.classList.add("is-err"); return; }
      note.textContent = "Diolch! You're on the list — new songs incoming.";
      note.classList.add("is-ok");
      form.reset();
      if (hasGSAP) gsap.fromTo(note, { y: 6, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power2.out" });
      /* TODO(airon): POST { email } to your provider (Mailchimp / Buttondown / etc.) */
    });
  }

  /* =======================================================
     BOOT
     ======================================================= */
  function boot() {
    initSmoothScroll();
    initFX();
    initCursor();
    initPreloader();
    revealSetup();
    initParallax();
    initMarquees();
    initNav();
    initPlayer();
    initSignup();
    if (hasGSAP && ScrollTrigger) {
      window.addEventListener("load", () => ScrollTrigger.refresh());
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else { boot(); }
})();
