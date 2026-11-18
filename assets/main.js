/* Atelier Verant — interactions & scroll choreography */
(() => {
  "use strict";

  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const fine = window.matchMedia("(pointer: fine)").matches;
  const hasGsap = typeof window.gsap !== "undefined" && typeof window.ScrollTrigger !== "undefined";
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  $$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));

  /* ---------- Smooth scroll ---------- */
  let lenis = null;
  if (!reduce && typeof window.Lenis !== "undefined") {
    lenis = new window.Lenis({ lerp: 0.08, wheelMultiplier: 0.9 });
    if (hasGsap) {
      lenis.on("scroll", window.ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  $$('a[href^="#"]').forEach((a) => {
    a.addEventListener("click", (e) => {
      const id = a.getAttribute("href");
      const target = id.length > 1 && document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      closeMenu();
      if (lenis) lenis.scrollTo(target, { duration: 1.8 });
      else target.scrollIntoView({ behavior: reduce ? "auto" : "smooth" });
    });
  });

  /* ---------- Header ---------- */
  const header = $(".site-header");
  let lastY = window.scrollY;
  const onScroll = () => {
    const y = window.scrollY;
    if (header) {
      header.classList.toggle("is-scrolled", y > 40);
      const open = document.documentElement.classList.contains("menu-open");
      if (!open && y > 320 && y > lastY + 2) header.classList.add("is-hidden");
      if (y < lastY - 2 || y < 320) header.classList.remove("is-hidden");
    }
    lastY = y;
  };
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Mobile menu ---------- */
  const menuBtn = $(".menu-btn");
  function closeMenu() {
    if (!document.documentElement.classList.contains("menu-open")) return;
    document.documentElement.classList.remove("menu-open");
    if (menuBtn) { menuBtn.setAttribute("aria-expanded", "false"); $(".label", menuBtn).textContent = "Menü"; }
    if (lenis) lenis.start();
  }
  if (menuBtn) {
    menuBtn.addEventListener("click", () => {
      const open = document.documentElement.classList.toggle("menu-open");
      menuBtn.setAttribute("aria-expanded", String(open));
      $(".label", menuBtn).textContent = open ? "Schließen" : "Menü";
      if (lenis) open ? lenis.stop() : lenis.start();
    });
  }

  /* ---------- Page transitions: cut to black ---------- */
  const curtain = $(".curtain");
  document.addEventListener("click", (e) => {
    const a = e.target.closest("a[href]");
    if (!a || !curtain || reduce) return;
    const href = a.getAttribute("href");
    if (!href || href.startsWith("#") || a.target === "_blank" || e.metaKey || e.ctrlKey || e.shiftKey) return;
    if (!/\.html(#.*)?$/.test(href)) return;
    e.preventDefault();
    $("span", curtain).textContent = a.dataset.word || "Verant";
    curtain.classList.add("is-leaving");
    setTimeout(() => (window.location.href = href), 600);
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted && curtain) curtain.classList.remove("is-leaving"); });

  /* ---------- Copy buttons ---------- */
  $$("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const flash = (t) => { btn.textContent = t; setTimeout(() => (btn.textContent = "Kopieren"), 1600); };
      const fallback = () => {
        const el = document.getElementById(btn.dataset.target);
        if (!el) return;
        const r = document.createRange();
        r.selectNodeContents(el);
        const s = window.getSelection();
        s.removeAllRanges();
        s.addRange(r);
        flash("Markiert");
      };
      try { navigator.clipboard.writeText(btn.dataset.copy).then(() => flash("Kopiert"), fallback); }
      catch (_) { fallback(); }
    });
  });

  /* ---------- Contact form (demo, nothing is sent) ---------- */
  const form = $("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      let ok = true;
      $$("[data-required]", form).forEach((input) => {
        const err = input.parentElement.querySelector(".err");
        let msg = "";
        if (!input.value.trim()) msg = "Bitte ausfüllen.";
        else if (input.type === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.value)) msg = "Bitte eine gültige E-Mail-Adresse eingeben.";
        if (err) err.textContent = msg;
        if (msg) ok = false;
      });
      const consent = $("#f-consent");
      const cErr = $("#consent-err");
      if (consent && !consent.checked) { ok = false; cErr.textContent = "Bitte bestätigen Sie den Datenschutzhinweis."; }
      else if (cErr) cErr.textContent = "";
      if (!ok) return;

      $("#success-name").textContent = $("#f-name").value.trim().split(" ")[0];
      const success = $("#form-success");
      form.hidden = true;
      success.hidden = false;
      if (hasGsap && !reduce) gsap.from(success, { y: 30, opacity: 0, duration: 1.1, ease: "power3.out" });
      if (lenis) lenis.scrollTo(success, { offset: -160 });
      if (hasGsap) ScrollTrigger.refresh();
    });
    const reset = $("#form-reset");
    if (reset) reset.addEventListener("click", () => {
      form.reset();
      form.hidden = false;
      $("#form-success").hidden = true;
      if (hasGsap) ScrollTrigger.refresh();
    });
  }

  /* ---------- Cursor ---------- */
  if (fine && !reduce) {
    const cur = document.createElement("div");
    cur.className = "cursor";
    cur.innerHTML = "<span>Ansehen</span>";
    document.body.appendChild(cur);
    let x = innerWidth / 2, y = innerHeight / 2, cx = x, cy = y;
    window.addEventListener("mousemove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
    const loop = () => {
      cx += (x - cx) * 0.2;
      cy += (y - cy) * 0.2;
      cur.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(loop);
    };
    loop();
    document.addEventListener("mouseover", (e) => {
      const view = e.target.closest("[data-cursor='view']");
      const link = e.target.closest("a, button, summary, label.chip, input, textarea");
      cur.classList.toggle("is-view", !!view);
      cur.classList.toggle("is-link", !view && !!link);
    });
  }

  /* ======================================================================
     GSAP choreography
     ====================================================================== */
  if (!hasGsap || reduce) return;
  gsap.registerPlugin(ScrollTrigger);
  const T0 = 0.6; // after the fade from black

  /* Opening titles */
  const heroLines = $$("[data-hero] .line-mask > span");
  if (heroLines.length) gsap.from(heroLines, { yPercent: 110, duration: 1.6, ease: "expo.out", stagger: 0.12, delay: T0 + 0.7 });
  const heroFade = $$("[data-hero-fade]");
  if (heroFade.length) gsap.from(heroFade, { opacity: 0, y: 16, duration: 1.4, ease: "power2.out", stagger: 0.1, delay: T0 + 1.1 });

  /* Film hero: slow push-in on load, then the camera pulls back as you scroll */
  $$(".film").forEach((film) => {
    const img = $(".ph img", film);
    const content = $(".film-content", film);
    const bars = $$(".bars i", film);
    const ph = $(".ph", film);
    if (ph) gsap.fromTo(ph, { scale: 1.14 }, { scale: 1, duration: 3.4, ease: "power2.out", delay: T0 });
    const tl = gsap.timeline({ scrollTrigger: { trigger: film, start: "top top", end: "bottom top", scrub: true } });
    if (img) tl.fromTo(img, { scale: 1.06, yPercent: 0 }, { scale: 1, yPercent: 12, filter: "saturate(0.6) contrast(1.1) brightness(0.55) sepia(0.08)", ease: "none" }, 0);
    if (content) tl.to(content, { yPercent: -40, opacity: 0, ease: "none" }, 0);
    if (bars.length) tl.to(bars, { height: 0, ease: "none" }, 0);
  });

  /* Parallax inside photos */
  $$("[data-parallax]").forEach((el) => {
    const amt = parseFloat(el.dataset.parallax) || 8;
    gsap.fromTo(el, { yPercent: -amt }, {
      yPercent: amt,
      ease: "none",
      scrollTrigger: { trigger: el.parentElement, start: "top bottom", end: "bottom top", scrub: true },
    });
  });

  /* Photo reveal: a shutter wipes open, the image settles */
  $$("[data-reveal-img]").forEach((el) => {
    const img = $("img", el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    tl.fromTo(el, { clipPath: "inset(0% 0% 100% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.5, ease: "expo.inOut" });
    if (img) tl.from(img, { scale: 1.3, duration: 2, ease: "expo.out" }, 0.2);
  });

  /* Headings rise out of a mask */
  $$("[data-split-lines]").forEach((el) => {
    gsap.from($$(".line-mask > span", el), {
      yPercent: 110,
      duration: 1.3,
      ease: "expo.out",
      stagger: 0.08,
      scrollTrigger: { trigger: el, start: "top 86%", once: true },
    });
  });

  $$("[data-reveal]").forEach((el) => {
    gsap.from(el, {
      y: 36,
      opacity: 0,
      duration: 1.2,
      ease: "power3.out",
      delay: parseFloat(el.dataset.delay) || 0,
      scrollTrigger: { trigger: el, start: "top 90%", once: true },
    });
  });

  /* Statement: words light up as you read */
  $$("[data-words]").forEach((el) => {
    const walk = (node) => {
      Array.from(node.childNodes).forEach((n) => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) frag.appendChild(document.createTextNode(part));
            else { const s = document.createElement("span"); s.className = "w"; s.textContent = part; frag.appendChild(s); }
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1) walk(n);
      });
    };
    walk(el);
    gsap.fromTo($$(".w", el), { opacity: 0.12 }, {
      opacity: 1,
      stagger: 0.06,
      ease: "none",
      scrollTrigger: { trigger: el, start: "top 80%", end: "bottom 50%", scrub: true },
    });
  });

  $$("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count);
    const obj = { v: 0 };
    gsap.to(obj, {
      v: end,
      duration: 2.2,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 92%", once: true },
      onUpdate: () => (el.textContent = Math.round(obj.v).toLocaleString("de-DE")),
    });
  });

  const mm = gsap.matchMedia();

  /* Scene: pinned photograph, subtitles change like a film */
  $$(".scene").forEach((scene) => {
    const subs = $$(".subtitle", scene);
    const img = $(".ph img", scene);
    scene.classList.add("is-js");
    gsap.set(subs, { opacity: 0, y: 20 });
    const tl = gsap.timeline({
      scrollTrigger: { trigger: scene, start: "top top", end: "+=" + subs.length * 70 + "%", pin: true, scrub: 0.6 },
    });
    if (img) tl.fromTo(img, { scale: 1.25 }, { scale: 1, ease: "none", duration: subs.length * 2 }, 0);
    subs.forEach((s, i) => {
      tl.to(s, { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }, i * 2 + 0.2);
      if (i < subs.length - 1) tl.to(s, { opacity: 0, y: -20, duration: 0.5, ease: "power2.in" }, i * 2 + 1.5);
    });
  });

  /* Project reel (desktop): horizontal travel with a frame counter */
  const reel = $(".reel-pin");
  const track = $(".track");
  if (reel && track) {
    mm.add("(min-width: 861px)", () => {
      const items = $$(".project", track);
      const countEl = $(".reel-count b");
      const dist = () => Math.max(0, track.scrollWidth - window.innerWidth);
      const tween = gsap.to(track, {
        x: () => -dist(),
        ease: "none",
        scrollTrigger: {
          trigger: reel,
          start: "top top",
          end: () => "+=" + dist(),
          pin: true,
          scrub: 0.8,
          invalidateOnRefresh: true,
          onUpdate: (self) => {
            gsap.set(".reel-rail span", { scaleX: self.progress });
            if (countEl) countEl.textContent = String(Math.min(items.length, Math.floor(self.progress * items.length) + 1)).padStart(2, "0");
          },
        },
      });
      items.forEach((item) => {
        const img = $(".ph img", item);
        if (!img) return;
        gsap.fromTo(img, { xPercent: 4, scale: 1.12 }, {
          xPercent: -4,
          scale: 1.12,
          ease: "none",
          scrollTrigger: { trigger: item, containerAnimation: tween, start: "left right", end: "right left", scrub: true },
        });
      });
    });
  }

  /* Technical drawing draws itself */
  const drawing = $("[data-draw]");
  if (drawing) {
    const strokes = $$(".ln, .ln-thin, .ln-accent, .hatch", drawing);
    strokes.forEach((p) => {
      let len = 0;
      try { len = p.getTotalLength(); } catch (_) { len = 0; }
      if (!len) return;
      p.style.strokeDasharray = len;
      p.style.strokeDashoffset = len;
    });
    const tl = gsap.timeline({ scrollTrigger: { trigger: drawing, start: "top 75%", end: "bottom 55%", scrub: 1 } });
    tl.to(strokes, { strokeDashoffset: 0, ease: "none", stagger: 0.04, duration: 1 });
    tl.from($$("text, .fill-accent", drawing), { opacity: 0, stagger: 0.02, duration: 0.3 }, 0.4);
  }

  /* Closing scene: slow drift */
  $$(".closing").forEach((c) => {
    const img = $(".ph img", c);
    if (img) gsap.fromTo(img, { scale: 1.2, yPercent: -6 }, { scale: 1, yPercent: 4, ease: "none", scrollTrigger: { trigger: c, start: "top bottom", end: "bottom bottom", scrub: true } });
  });

  /* Leistungen: stacked cards recede as the next arrives */
  mm.add("(min-width: 961px)", () => {
    const cards = $$(".discipline");
    cards.forEach((card, i) => {
      const next = cards[i + 1];
      if (!next) return;
      gsap.to(card, {
        scale: 0.95,
        filter: "brightness(0.6)",
        ease: "none",
        scrollTrigger: { trigger: next, start: "top 70%", end: "top 15%", scrub: true },
      });
    });
  });

  /* Leistungsphasen */
  const phases = $(".phases");
  if (phases) {
    gsap.fromTo($(".rail", phases), { scaleY: 0 }, {
      scaleY: 1,
      ease: "none",
      scrollTrigger: { trigger: phases, start: "top 60%", end: "bottom 60%", scrub: true },
    });
    const items = $$(".phase", phases);
    const bars = $$(".phase-bar i");
    items.forEach((item, i) => {
      ScrollTrigger.create({
        trigger: item,
        start: "top 62%",
        onEnter: () => { item.classList.add("is-active"); bars.forEach((b, j) => b.classList.toggle("on", j <= i)); },
        onLeaveBack: () => { item.classList.remove("is-active"); bars.forEach((b, j) => b.classList.toggle("on", j < i)); },
      });
    });
  }

  /* Kontakt: split image breathes */
  const split = $(".split-media img");
  if (split) gsap.fromTo(split, { scale: 1.15 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ".split", start: "top top", end: "bottom bottom", scrub: true } });

  window.addEventListener("load", () => ScrollTrigger.refresh());
})();
