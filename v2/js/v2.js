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

    /* 03 · el problema: cada frase entra y sale sola (por tiempo); el scroll solo decide cuál toca */
    var probTrack = $("#problema .track"), items = $$("#probList .ph-item"), probN = $("#probN");
    gsap.fromTo("#problema .bgv", { scale: 1.2 }, { scale: 1, ease: "none", scrollTrigger: { trigger: probTrack, start: "top bottom", end: "bottom bottom", scrub: true } });
    var pw = items.map(function (it) { return words($("h2", it)); });
    var ps = items.map(function (it) { return $(".sub", it); });
    gsap.set(pw, { yPercent: 118 }); gsap.set(ps, { opacity: 0, y: 18 });
    var pCur = -1;
    function showPhrase(k) {
      if (k === pCur) return;
      var prev = pCur, dir = k > prev ? 1 : -1; pCur = k;
      probN.textContent = pad2(k + 1);
      if (prev >= 0) {
        gsap.to(pw[prev], { yPercent: -118 * dir, duration: 0.45, stagger: 0.03, ease: "power2.in", overwrite: true });
        gsap.to(ps[prev], { opacity: 0, duration: 0.25, overwrite: true });
      }
      gsap.set(pw[k], { yPercent: 118 * dir });
      gsap.to(pw[k], { yPercent: 0, duration: 0.85, stagger: 0.05, ease: "power3.out", delay: prev >= 0 ? 0.4 : 0.1, overwrite: true });
      gsap.fromTo(ps[k], { opacity: 0, y: 18 }, { opacity: 0.8, y: 0, duration: 0.6, ease: "power2.out", delay: prev >= 0 ? 0.75 : 0.5, overwrite: true });
    }
    ScrollTrigger.create({ trigger: probTrack, start: "top top", end: "bottom bottom",
      onUpdate: function (s) { showPhrase(clamp(Math.floor(s.progress * items.length), 0, items.length - 1)); } });
    showPhrase(0);
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

    /* 05 · frentes: recorrido horizontal */
    var hz = $("#frentes"), hzTrack = $("#hzTrack");
    function hzDist() { return Math.max(0, hzTrack.offsetWidth - window.innerWidth); }
    function hzLen() { return hzDist() * 0.85; }
    function setH() { hz.style.height = (hzLen() + window.innerHeight) + "px"; }
    setH();
    ScrollTrigger.addEventListener("refreshInit", setH);
    gsap.to(hzTrack, { x: function () { return -hzDist(); }, ease: "none",
      scrollTrigger: { trigger: hz, start: "top top", end: function () { return "+=" + hzLen(); }, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: function (s) { gsap.set("#hzBar", { scaleX: s.progress }); } } });

    /* 06 · roadmap: la línea se llena y cada etapa aparece cuando la línea la alcanza */
    var cols = $$("#metodo .rm-col");
    var rw = cols.map(function (c) { return words($(".cap-title", c)); });
    gsap.set(cols, { opacity: 0, y: 50 });
    rw.forEach(function (w) { gsap.set(w, { yPercent: 118 }); });
    onceIn("#metodo .rm-wrap", function () {
      var tl = gsap.timeline();
      tl.to("#rmLine", { scaleX: 1, duration: 2.6, ease: "power1.inOut" }, 0);
      cols.forEach(function (col, i) {
        var t = 0.15 + i * 0.6;
        tl.call(function () { col.classList.add("on"); }, null, t)
          .to(col, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, t)
          .to(rw[i], { yPercent: 0, duration: 0.8, ease: "power4.out" }, t + 0.1);
      });
      tl.from(".rm-foot", { opacity: 0, y: 16, duration: 0.8 }, 2.4);
    }, "top 75%");

    /* 07 · nosotros: retratos que se abren y textos por palabra */
    $$(".person").forEach(function (p) {
      var ph = $(".ph", p), img = $("img", ph);
      gsap.fromTo(ph, { clipPath: "inset(100% 0% 0% 0%)" }, { clipPath: "inset(0% 0% 0% 0%)", ease: "power3.inOut", scrollTrigger: { trigger: ph, start: "top 90%", end: "top 30%", scrub: 0.6 } });
      gsap.fromTo(img, { scale: 1.1 }, { scale: 1, ease: "none", scrollTrigger: { trigger: ph, start: "top 92%", end: "top 30%", scrub: true } });
      gsap.from($$(".tiny, .role, .bio", p), { opacity: 0, y: 26, duration: 1, stagger: 0.12, ease: "power3.out", scrollTrigger: { trigger: p, start: "top 60%", once: true } });
    });
    $$(".split").forEach(function (el) {
      var w = words(el); el.classList.add("is-split");
      gsap.from(w, { yPercent: 118, duration: 1.25, stagger: 0.07, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    ring3d();

    /* 11 · contacto: se destapa con paralaje */
    gsap.fromTo("#ctInner", { yPercent: -14 }, { yPercent: 0, ease: "none", scrollTrigger: { trigger: "#contacto", start: "top bottom", end: "top top", scrub: true } });
    gsap.fromTo("#contacto .ct-bg", { scale: 1.25 }, { scale: 1, ease: "none", scrollTrigger: { trigger: "#contacto", start: "top bottom", end: "bottom bottom", scrub: true } });
    feed($("#contacto"), [$("#contacto video")]);
  }


  /* ---------- empresas: anillo 3D (mismo mecanismo que el original) ---------- */
  function ring3d() {
    var sec = $("#clientes"), stage = $("#c3dStage"), ring = $("#c3dRing"), hint = $("#c3dHint");
    if (!sec || !stage || !ring) return;
    var cards = $$(".c3d-card", ring), N = cards.length;
    if (!N) return;
    var MARK = '<svg viewBox="0 0 140 165" aria-hidden="true"><polygon class="cb-bar" points="15,100 35,100 39,57 19,57"/><polygon class="cb-bar" points="46,116 66,116 70,42 50,42"/><polygon class="cb-bar" points="75,125 95,125 99,35 79,35"/><polygon class="cb-bar" points="108,159 128,159 132,8 112,8"/><polygon class="cb-stripe" points="15,102 15,72 105,48 105,78"/></svg>';
    var backs = cards.map(function (c) {
      var b = document.createElement("div"); b.className = "c3d-back"; b.setAttribute("aria-hidden", "true"); b.innerHTML = MARK; ring.appendChild(b); return b;
    });
    var STEP = 360 / N, R = 400, rot = 0, vel = 0, CRUISE = reduce ? 8 : 14;
    var dragging = false, tweening = false, running = false, moved = 0, lastX = 0, lastT = 0, dragVel = 0;
    function layout() {
      var w = cards[0].offsetWidth || 260;
      R = (w / 2) / Math.tan(Math.PI / N) * 1.16;
      cards.forEach(function (c, i) {
        c.style.transform = "rotateY(" + (i * STEP) + "deg) translateZ(" + R.toFixed(1) + "px)";
        backs[i].style.transform = "rotateY(" + (i * STEP) + "deg) translateZ(" + (R - 1).toFixed(1) + "px) rotateY(180deg)";
      });
      apply(true);
    }
    var last = 9999;
    function apply(force) {
      ring.style.transform = "rotateX(-9deg) translateZ(" + (-R).toFixed(1) + "px) rotateY(" + rot.toFixed(3) + "deg)";
      if (!force && Math.abs(rot - last) < 1) return;
      last = rot;
      for (var i = 0; i < N; i++) {
        var a = ((i * STEP + rot) % 360 + 540) % 360 - 180, c = Math.cos(a * Math.PI / 180);
        var o = (0.36 + 0.64 * Math.pow((c + 1) / 2, 1.15)).toFixed(3);
        cards[i].style.opacity = o; backs[i].style.opacity = o;
        cards[i].classList.toggle("is-front", c > 0.985);
      }
    }
    var acc = 0;
    gsap.ticker.add(function (time, deltaMs) {
      if (!running || tweening) return;
      acc += deltaMs || 16;
      if (phone && (gsap.ticker.frame & 1)) return;
      var dt = Math.min(0.1, acc / 1000); acc = 0;
      if (!dragging) { vel += (CRUISE - vel) * (1 - Math.exp(-dt * 1.7)); rot += vel * dt; }
      apply();
    });
    stage.addEventListener("pointerdown", function (e) {
      if (tweening) return;
      dragging = true; moved = 0; lastX = e.clientX; lastT = performance.now(); dragVel = 0;
      stage.classList.add("is-dragging");
      try { stage.setPointerCapture(e.pointerId); } catch (err) {}
      if (hint) hint.classList.add("is-hidden");
    });
    stage.addEventListener("pointermove", function (e) {
      if (!dragging) return;
      var now = performance.now(), dx = e.clientX - lastX, dtm = Math.max(1, now - lastT);
      moved += Math.abs(dx); rot += dx * 0.28;
      dragVel = dragVel * 0.6 + (dx * 0.28 / dtm * 1000) * 0.4;
      lastX = e.clientX; lastT = now; apply(true);
    });
    function release() { if (!dragging) return; dragging = false; stage.classList.remove("is-dragging"); vel = clamp(dragVel, -260, 260); }
    stage.addEventListener("pointerup", release); stage.addEventListener("pointercancel", release);
    cards.forEach(function (card, i) {
      card.addEventListener("click", function () {
        if (moved > 6) return;
        var delta = ((-i * STEP - rot) % 360 + 540) % 360 - 180, o = { r: rot };
        tweening = true; vel = 0;
        gsap.to(o, { r: rot + delta, duration: 1.1, ease: "power3.inOut", onUpdate: function () { rot = o.r; apply(true); }, onComplete: function () { tweening = false; } });
      });
    });
    ScrollTrigger.create({ trigger: sec, start: "top 90%", end: "bottom 10%", onToggle: function (s) { running = s.isActive; stage.classList.toggle("is-off", !s.isActive); } });
    var rw0 = window.innerWidth;
    window.addEventListener("resize", function () { if (phone && window.innerWidth === rw0) return; rw0 = window.innerWidth; layout(); });
    layout();
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
