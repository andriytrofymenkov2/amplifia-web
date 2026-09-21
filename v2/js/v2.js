/* AMPLIFIA v2 — vocabulario de movimiento mínimo:
   1) titulares que suben por línea (una vez), 2) escenas fijas que cambian de paso al scrollear,
   3) un solo video (el hero). Scroll nativo. Sin efectos que compitan con el texto. */
(function () {
  "use strict";
  var root = document.documentElement;
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove("js"); return; }
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });

  var WA = "5491133278023", EMAIL = "andriytrofymenko@gmail.com";
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ---------- Menú móvil y anclas ---------- */
  var burger = $(".burger"), menu = $(".menu");
  function setMenu(open) {
    root.classList.toggle("menu-open", open);
    burger.setAttribute("aria-expanded", open ? "true" : "false");
    menu.setAttribute("aria-hidden", open ? "false" : "true");
  }
  burger.addEventListener("click", function () { setMenu(!root.classList.contains("menu-open")); });
  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a) return;
    var id = a.getAttribute("href");
    var t = id.length > 1 ? $(id) : null;
    if (!t && id !== "#top") return;
    e.preventDefault();
    setMenu(false);
    var y = t && id !== "#top" ? t.getBoundingClientRect().top + window.pageYOffset : 0;
    window.scrollTo({ top: y, behavior: reduce ? "auto" : "smooth" });
  });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") setMenu(false); });

  /* ---------- Sección actual: tono de la cabecera, riel y menú ---------- */
  var secs = $$("[data-name]");
  var railEl = $(".rail"), railN = $("#railN"), railT = $("#railT"), navLinks = $$(".nav a");
  secs.forEach(function (s, i) {
    ScrollTrigger.create({
      trigger: s, start: "top 60px", end: "bottom 60px",
      onToggle: function (self) {
        if (!self.isActive) return;
        root.setAttribute("data-hdr", s.getAttribute("data-hdr") || "dark");
        railN.textContent = ("0" + (i + 1)).slice(-2);
        railT.textContent = s.getAttribute("data-name");
        railEl.classList.toggle("is-off", !s.querySelector(".track, .hero-track"));
        navLinks.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + s.id); });
      }
    });
  });

  /* ---------- WhatsApp: aparece al salir del hero ---------- */
  ScrollTrigger.create({
    trigger: "#hero", start: "bottom 60%", end: "max",
    onToggle: function (self) { $("#wa").classList.toggle("is-on", self.isActive); }
  });

  /* ---------- Titulares: suben por línea, una sola vez ---------- */
  function reveal(el) {
    if (el.closest(".scene") || reduce || !window.SplitText) { el.classList.add("is-split"); return; }
    SplitText.create(el, {
      type: "lines", mask: "lines", autoSplit: true,
      onSplit: function (self) {
        el.classList.add("is-split");
        return gsap.from(self.lines, {
          yPercent: 110, duration: 1.1, ease: "power4.out", stagger: 0.09,
          scrollTrigger: { trigger: el, start: "top 88%", once: true }
        });
      }
    });
  }
  var fontsReady = document.fonts && document.fonts.ready ? document.fonts.ready : Promise.resolve();
  fontsReady.then(function () { $$(".rv-lines").forEach(reveal); ScrollTrigger.refresh(); });
  setTimeout(function () { $$(".rv-lines").forEach(function (e) { e.classList.add("is-split"); }); }, 2500);

  /* ---------- Hero ---------- */
  var heroVideo = $("#heroVideo");
  var heroWord = $(".hero-word span"), heroTag = $(".hero-tag");
  if (!reduce) {
    gsap.set(heroWord, { yPercent: 115 });
    gsap.set(heroTag, { opacity: 0, y: 14 });
    gsap.timeline({ delay: 0.15 })
      .to(heroWord, { yPercent: 0, duration: 1.5, ease: "power4.out" })
      .to(heroTag, { opacity: 1, y: 0, duration: 1, ease: "power3.out" }, 0.9);
  }
  var heroTrack = $(".hero-track");
  gsap.to(".hero-media", { scale: 1.16, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "bottom top", scrub: true } });
  gsap.to(".hero-copy", { yPercent: -14, opacity: 0, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "70% top", scrub: true } });
  gsap.to(".hero-scroll", { opacity: 0, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "12% top", scrub: true } });

  /* el video sólo en pantallas grandes; en el celular queda el póster (liviano) */
  var wide = window.matchMedia("(min-width: 861px)");
  if (wide.matches && !reduce && heroVideo) {
    var startVideo = function () {
      heroVideo.src = heroVideo.getAttribute("data-src");
      heroVideo.style.opacity = 0;
      heroVideo.addEventListener("playing", function () { gsap.to(heroVideo, { opacity: 1, duration: 1.2, ease: "power1.out" }); }, { once: true });
      var p = heroVideo.play(); if (p && p.catch) p.catch(function () {});
    };
    window.addEventListener("load", function () { setTimeout(startVideo, 400); });
    ScrollTrigger.create({
      trigger: heroTrack, start: "top top", end: "bottom top",
      onToggle: function (self) {
        if (!heroVideo.src) return;
        if (self.isActive) { var p = heroVideo.play(); if (p && p.catch) p.catch(function () {}); } else heroVideo.pause();
      }
    });
  }

  /* ---------- Escenas fijas: un paso por vez ---------- */
  function scene(section, items, onStep) {
    var track = $(".track", section), n = items.length, cur = -1;
    gsap.set(items, { autoAlpha: 0 });
    function go(i) {
      if (i === cur) return;
      var dir = i > cur ? 1 : -1;
      if (cur >= 0) gsap.to(items[cur], { autoAlpha: 0, y: -28 * dir, duration: 0.45, ease: "power2.in", overwrite: true });
      if (cur < 0) gsap.set(items[i], { autoAlpha: 1, y: 0 });
      else gsap.fromTo(items[i], { autoAlpha: 0, y: 40 * dir }, { autoAlpha: 1, y: 0, duration: 0.85, ease: "power3.out", delay: 0.28, overwrite: true });
      cur = i;
      if (onStep) onStep(i);
    }
    go(0);
    return ScrollTrigger.create({
      trigger: track, start: "top top", end: "bottom bottom",
      onUpdate: function (self) { go(Math.min(n - 1, Math.floor(self.progress * n))); }
    });
  }
  function scrollToStep(st, i, n) {
    window.scrollTo({ top: st.start + (i + 0.5) / n * (st.end - st.start), behavior: reduce ? "auto" : "smooth" });
  }

  var mm = gsap.matchMedia();
  mm.add("(min-width: 861px)", function () {
    /* El problema */
    var probN = $("#probN");
    scene($("#problema"), $$("#probScene .item"), function (i) { probN.textContent = ("0" + (i + 1)).slice(-2); });

    /* Frentes: lista + panel */
    var frBtns = $$("#frList li");
    var frST = scene($("#frentes"), $$("#frPanels .fr-panel"), function (i) {
      frBtns.forEach(function (li, k) { li.classList.toggle("is-on", k === i); });
    });
    frBtns.forEach(function (li, k) { li.firstElementChild.onclick = function () { scrollToStep(frST, k, frBtns.length); }; });

    /* Roadmap: línea de tiempo */
    var nodes = $$("#rdNodes li"), fill = $("#rdFill");
    scene($("#metodo"), $$("#rdScene .rd-item"), function (i) {
      nodes.forEach(function (li, k) { li.classList.toggle("is-on", k <= i); });
      gsap.to(fill, { scaleX: i / (nodes.length - 1), duration: 0.7, ease: "power2.out", overwrite: true });
    });

    /* Qué hacemos: el foco sigue al scroll */
    $$(".cap").forEach(function (c) {
      ScrollTrigger.create({ trigger: c, start: "top 68%", end: "bottom 38%", toggleClass: { targets: c, className: "is-on" } });
    });

    /* Retratos: una pizca de paralaje, nada más */
    if (!reduce) $$(".person .ph img").forEach(function (img) {
      gsap.fromTo(img, { yPercent: -4 }, { yPercent: 4, ease: "none", scrollTrigger: { trigger: img.parentNode, start: "top bottom", end: "bottom top", scrub: true } });
    });
    return function () { $$(".cap").forEach(function (c) { c.classList.remove("is-on"); }); };
  });

  /* ---------- Preguntas frecuentes ---------- */
  var qas = $$(".qa");
  var refreshT;
  qas.forEach(function (q) {
    var b = $("button", q);
    b.addEventListener("click", function () {
      var open = !q.classList.contains("is-open");
      qas.forEach(function (o) { o.classList.remove("is-open"); $("button", o).setAttribute("aria-expanded", "false"); });
      if (open) { q.classList.add("is-open"); b.setAttribute("aria-expanded", "true"); }
      clearTimeout(refreshT);
      refreshT = setTimeout(function () { ScrollTrigger.refresh(); }, 650);
    });
  });

  /* ---------- Formulario (mismo mensaje que la versión actual) ---------- */
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
  function message(v) {
    return "Hola, soy " + v.name + (v.company ? " (" + v.company + ")" : "") + ". Quiero consultar por un diagnóstico.\n\nMi desafío: " + v.challenge + "\n\nMi email: " + v.email;
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var v = values(); if (!valid(v)) return;
    window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(message(v)), "_blank", "noopener");
    note.classList.remove("is-error");
    note.textContent = "Se abrió WhatsApp con tu mensaje listo. ¡Gracias!";
  });
  $("#cfMail").addEventListener("click", function () {
    var v = values(); if (!valid(v)) return;
    window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Diagnóstico Amplifia") + "&body=" + encodeURIComponent(message(v));
    note.classList.remove("is-error");
    note.textContent = "Se abrió tu correo con el mensaje listo.";
  });

  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
