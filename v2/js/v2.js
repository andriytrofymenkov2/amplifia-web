/* AMPLIFIA v2 — capítulos inmersivos.
   Carga → hero → manifiesto (palabras que se encienden) → problema (una frase por vez)
   → paneles que se abren (clip-path) → recorrido horizontal → roadmap → láminas que suben.
   Scroll suave con Lenis en escritorio; nativo en celular. Un video decodificando por vez. */
(function () {
  "use strict";
  var root = document.documentElement, body = document.body;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("js"); body.classList.remove("is-loading"); return; }
  gsap.registerPlugin(ScrollTrigger);
  var HAS_SPLIT = !!window.SplitText;
  if (HAS_SPLIT) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true });

  var WA = "5491133278023", EMAIL = "andriytrofymenko@gmail.com";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var phone = window.matchMedia("(max-width: 860px), (hover: none)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  var pad2 = function (n) { return ("0" + n).slice(-2); };

  /* ---------- scroll suave ---------- */
  var lenis = null;
  if (!phone && !reduce && window.Lenis && !/[?&]native=1/.test(location.search)) {
    lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.9 });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (t) { lenis.raf(t * 1000); });
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  function scrollToY(y) {
    if (lenis) lenis.scrollTo(y, { duration: 1.9, easing: function (t) { return 1 - Math.pow(1 - t, 4); } });
    else window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- menú y anclas ---------- */
  var menuBtn = $(".menu-btn"), menu = $("#menu");
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    menuBtn.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
    if (lenis) { if (open) lenis.stop(); else lenis.start(); }
    else body.style.overflow = open ? "hidden" : "";
  }
  menuBtn.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href"), t = id.length > 1 ? $(id) : null;
    if (!t && id !== "#top") return;
    e.preventDefault();
    var wasOpen = root.classList.contains("menu-open");
    setMenu(false);
    var y = t && id !== "#top" ? t.getBoundingClientRect().top + window.pageYOffset : 0;
    setTimeout(function () { scrollToY(y); }, wasOpen ? 250 : 0);
  });

  /* ---------- video: uno decodifica, el vecino espera, el resto se libera ---------- */
  function vsrc(v) { return phone ? (v.getAttribute("data-phone") || "") : v.getAttribute("data-src"); }
  function vload(v) {
    if (reduce || v.getAttribute("src")) return;
    var s = vsrc(v); if (!s) return;
    v.src = s; v.load();
    v.addEventListener("loadeddata", function () { v.classList.add("is-ready"); }, { once: true });
  }
  function vplay(v) { vload(v); if (v._s === "play") return; v._s = "play"; var p = v.play(); if (p && p.catch) p.catch(function () {}); }
  function vwait(v) { vload(v); if (v._s === "wait") return; v._s = "wait"; v.pause(); }
  function vfree(v) {
    if (v._s === "free") return; v._s = "free"; v.pause();
    if (v.getAttribute("src")) { v.removeAttribute("src"); v.load(); v.classList.remove("is-ready"); }
  }
  function feed(trigger, vids, getF) {
    if (reduce) return;
    ScrollTrigger.create({ trigger: trigger, start: "top bottom+=100%", end: "bottom top-=100%", onUpdate: apply, onToggle: apply });
    function apply(self) {
      var on = self.isActive, f = getF ? getF() : 0;
      vids.forEach(function (v, i) {
        if (!v) return;
        var d = Math.abs(i - f);
        if (!on) vfree(v); else if (d < 1) vplay(v); else if (d < 1.7) vwait(v); else vfree(v);
      });
    }
  }

  /* ---------- texto: palabras con máscara ---------- */
  function words(el, mask) {
    if (!HAS_SPLIT) return [el];
    var opts = { type: "words", wordsClass: "w" };
    if (mask !== false) { opts.mask = "words"; opts.maskClass = "mk"; }
    return SplitText.create(el, opts).words;
  }

  /* ---------- cabecera, riel y progreso según la sección ---------- */
  var railEl = $(".rail"), railN = $("#railN"), railT = $("#railT");
  $$("[data-name]").forEach(function (s, i) {
    ScrollTrigger.create({
      trigger: s, start: "top 60px", end: "bottom 60px",
      onToggle: function (self) {
        if (!self.isActive) return;
        root.setAttribute("data-hdr", s.getAttribute("data-hdr") || "dark");
        railN.textContent = pad2(i + 1);
        railT.textContent = s.getAttribute("data-name");
        railEl.style.opacity = s.matches(".hero,.prob") ? "" : "0";
      }
    });
  });
  gsap.to("#prog", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
  ScrollTrigger.create({ trigger: "#hero", start: "bottom 60%", end: "max", onToggle: function (s) { $("#wa").classList.toggle("is-on", s.isActive); } });

  function onceIn(t, fn, start) { ScrollTrigger.create({ trigger: t, start: start || "top 70%", once: true, onEnter: fn }); }

  /* ---------- construcción de las escenas ---------- */
  var heroChars = [];
  function build() {
    /* 01 · inicio */
    var hw = $(".hero-word");
    if (HAS_SPLIT) { heroChars = SplitText.create(hw, { type: "chars", charsClass: "ch" }).chars; gsap.set(heroChars, { yPercent: 115 }); }
    var heroTrack = $("#hero .track");
    gsap.to("#heroMedia", { scale: 1.22, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "bottom bottom", scrub: true } });
    gsap.to("#heroCopy", { yPercent: -16, opacity: 0, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "62% top", scrub: true } });
    gsap.to(hw, { letterSpacing: "0.08em", ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "62% top", scrub: true } });
    gsap.to(".hero-scroll", { opacity: 0, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "10% top", scrub: true } });
    feed(heroTrack, [$("#hero video")]);

    /* 02 · manifiesto: se enciende solo al llegar */
    var mw = words($("#manifText"), false);
    onceIn("#manifiesto", function () { gsap.to(mw, { opacity: 1, stagger: 0.07, duration: 0.7, ease: "power2.out" }); }, "top 55%");

    /* 03 · el problema: una frase por vez sobre el mismo fondo */
    var probTrack = $("#problema .track"), items = $$("#probList .ph-item"), probN = $("#probN");
    gsap.fromTo("#problema .bgv", { scale: 1.22 }, { scale: 1, ease: "none", scrollTrigger: { trigger: probTrack, start: "top bottom", end: "bottom bottom", scrub: true } });
    var pIdx = -1;
    var ptl = gsap.timeline({ defaults: { ease: "none" }, scrollTrigger: { trigger: probTrack, start: "top top", end: "bottom bottom", scrub: 0.8 },
      onUpdate: function () { var k = clamp(Math.floor(ptl.time() + 0.3), 0, items.length - 1); if (k !== pIdx) { pIdx = k; probN.textContent = pad2(k + 1); } } });
    items.forEach(function (it, i) {
      var w = words($("h2", it)), sub = $(".sub", it);
      if (i > 0) { gsap.set(w, { yPercent: 118 }); ptl.to(w, { yPercent: 0, duration: 0.5, stagger: 0.05, ease: "power3.out" }, i + 0.08); }
      gsap.set(sub, { y: 18, opacity: 0 });
      ptl.to(sub, { opacity: 0.8, y: 0, duration: 0.35 }, i > 0 ? i + 0.3 : 0.05);
      if (i < items.length - 1) {
        ptl.to(w, { yPercent: -118, duration: 0.35, stagger: 0.03, ease: "power2.in" }, i + 0.6);
        ptl.to(sub, { opacity: 0, duration: 0.25 }, i + 0.58);
      }
    });
    ptl.to({}, { duration: 0.2 }, items.length);
    feed(probTrack, [$("#problema video")]);

    /* 04 · qué hacemos: las tres columnas se abren solas, una hacia la derecha y otra hacia la izquierda */
    $$("#que-hacemos .col").forEach(function (col, i) {
      var from = i % 2 ? "inset(0% 0% 0% 100%)" : "inset(0% 100% 0% 0%)";
      var w = words($(".cap-title", col)), rest = $$(".tiny, .sub", col);
      gsap.set(col, { clipPath: from }); gsap.set(w, { yPercent: 118 }); gsap.set(rest, { opacity: 0, y: 16 });
      onceIn("#que-hacemos .cols", function () {
        gsap.timeline({ delay: i * 0.16 })
          .to(col, { clipPath: "inset(0% 0% 0% 0%)", duration: 1.1, ease: "power3.inOut" })
          .to(w, { yPercent: 0, duration: 0.8, stagger: 0.05, ease: "power4.out" }, 0.45)
          .to(rest, { opacity: 0.8, y: 0, duration: 0.6, stagger: 0.08 }, 0.65);
      }, "top 70%");
    });

    /* 05 · frentes: las seis tarjetas entran alternando derecha / izquierda */
    var cards = $$("#frGrid .card");
    gsap.set(cards, { opacity: 0, x: function (i) { return i % 2 ? -70 : 70; } });
    onceIn("#frGrid", function () { gsap.to(cards, { opacity: 1, x: 0, duration: 1, stagger: 0.09, ease: "power3.out" }); }, "top 75%");

    /* 06 · roadmap: la línea se llena y las cuatro etapas aparecen de costado */
    var cols = $$("#metodo .rm-col");
    gsap.set(cols, { opacity: 0, x: function (i) { return i % 2 ? -80 : 80; } });
    onceIn("#metodo .rm-wrap", function () {
      gsap.timeline().to("#rmLine", { scaleX: 1, duration: 1.8, ease: "power2.inOut" })
        .to(cols, { opacity: 1, x: 0, duration: 0.9, stagger: 0.2, ease: "power3.out" }, 0.2);
    }, "top 75%");

    /* 07 · nosotros: retratos que se abren y textos por palabra */
    $$(".person").forEach(function (p) {
      var ph = $(".ph", p), img = $("img", ph);
      gsap.fromTo(ph, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power3.inOut", scrollTrigger: { trigger: ph, start: "top 90%", end: "top 30%", scrub: 0.6 } });
      gsap.fromTo(img, { scale: 1.32, yPercent: -5 }, { scale: 1, yPercent: 5, ease: "none", scrollTrigger: { trigger: ph, start: "top bottom", end: "bottom top", scrub: true } });
      gsap.from($$(".tiny, .role, .bio", p), { opacity: 0, y: 26, duration: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 60%", once: true } });
    });
    $$(".split").forEach(function (el) {
      var w = words(el); el.classList.add("is-split");
      gsap.from(w, { yPercent: 118, duration: 1.25, stagger: 0.07, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    /* 11 · contacto: se destapa con paralaje */
    gsap.fromTo("#ctInner", { yPercent: -14 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: "#contacto", start: "top bottom", end: "top top", scrub: true } });
    gsap.fromTo("#contacto .ct-bg", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#contacto", start: "top bottom", end: "bottom bottom", scrub: true } });
    feed($("#contacto"), [$("#contacto video")]);
  }

  /* ---------- preguntas frecuentes ---------- */
  var qas = $$(".qa"), refreshT;
  qas.forEach(function (q) {
    var b = $("button", q);
    b.addEventListener("click", function () {
      var open = !q.classList.contains("is-open");
      qas.forEach(function (o) { o.classList.remove("is-open"); $("button", o).setAttribute("aria-expanded", "false"); });
      if (open) { q.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); }
      clearTimeout(refreshT); refreshT = setTimeout(function () { ScrollTrigger.refresh(); }, 650);
    });
  });

  /* ---------- formulario ---------- */
  var form = $("#cf"), note = $("#cfNote");
  function values() {
    var f = new FormData(form);
    return { name: (f.get("name") || "").trim(), email: (f.get("email") || "").trim(), company: (f.get("company") || "").trim(), challenge: (f.get("challenge") || "").trim() };
  }
  function valid(v) {
    var ok = true;
    $$(".cf-field", form).forEach(function (el) { el.classList.remove("is-error"); });
    function bad(name) { ok = false; $('[name="' + name + '"]', form).closest(".cf-field").classList.add("is-error"); }
    if (!v.name) bad("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.email)) bad("email");
    if (!v.challenge) bad("challenge");
    note.classList.toggle("is-error", !ok);
    if (!ok) note.textContent = "Completá tu nombre, un email válido y tu desafío.";
    return ok;
  }
  function message(v) { return "Hola, soy " + v.name + (v.company ? " (" + v.company + ")" : "") + ". Quiero consultar por un diagnóstico.\n\nMi desafío: " + v.challenge + "\n\nMi email: " + v.email; }
  form.addEventListener("submit", function (e) {
    e.preventDefault(); var v = values(); if (!valid(v)) return;
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(message(v)), "_blank", "noopener");
    note.classList.remove("is-error"); note.textContent = "Se abrió WhatsApp con tu mensaje listo. ¡Gracias!";
  });
  $("#cfMail").addEventListener("click", function () {
    var v = values(); if (!valid(v)) return;
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Diagnóstico Amplifia") + "&body=" + encodeURIComponent(message(v));
    note.classList.remove("is-error"); note.textContent = "Se abrió tu correo con el mensaje listo.";
  });

  /* ---------- pantalla de carga y entrada ---------- */
  var pre = $("#pre"), preN = $("#preN"), finished = false;
  function finish() {
    if (finished) return; finished = true;
    body.classList.remove("is-loading");
    var hv = $("#hero video"); if (hv) vplay(hv);
    if (reduce) { pre.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); return; }
    var tl = gsap.timeline({ onComplete: function () { pre.remove(); if (lenis) lenis.start(); ScrollTrigger.refresh(); } });
    tl.to([".pre-mark", ".pre-count"], { opacity: 0, y: -24, duration: 0.5, ease: "power2.in" })
      .to(pre, { yPercent: -100, duration: 1.2, ease: "power4.inOut" }, 0.35)
      .fromTo("#heroMedia img, #heroMedia video", { scale: 1.35 }, { scale: 1, duration: 2.4, ease: "power3.out" }, 0.35);
    if (heroChars.length) tl.to(heroChars, { yPercent: 0, duration: 1.4, stagger: 0.06, ease: "power4.out" }, 0.95);
    tl.from([".hero-kicker", ".hero-tag", ".hero-scroll", ".hdr", ".rail"], { opacity: 0, y: 16, duration: 1, stagger: 0.12, ease: "power3.out" }, 1.4);
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  var loaded = new Promise(function (res) { if (document.readyState === "complete") res(); else window.addEventListener("load", res); });
  var counter = { v: 0 };
  gsap.timeline()
    .from(".pre-mark .bar", { scaleY: 0, duration: 0.9, stagger: 0.12, ease: "power3.out" }, 0)
    .to(counter, { v: 100, duration: 1.9, ease: "power2.inOut", onUpdate: function () { preN.textContent = Math.round(counter.v); } }, 0);
  var minTime = new Promise(function (res) { setTimeout(res, 2000); });
  Promise.race([Promise.all([fontsReady, loaded, minTime]), new Promise(function (res) { setTimeout(res, 5500); })]).then(function () {
    try { build(); } catch (e) { if (window.console) console.error(e); }
    finish();
  });
  setTimeout(function () { if (!finished) { body.classList.remove("is-loading"); if (pre.parentNode) pre.remove(); if (lenis) lenis.start(); } }, 9000);
  window.addEventListener("load", function () { setTimeout(function () { ScrollTrigger.refresh(); }, 600); });
})();
