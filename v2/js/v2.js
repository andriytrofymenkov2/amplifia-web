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
  var phone = window.matchMedia("(max-width: 860px), (hover: none) and (any-hover: none)").matches;
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
  /* nivel del equipo: si es flojo, con poca memoria o con datos limitados, se usa el video liviano; si es muy limitado, solo la imagen */
  var nav = navigator, conn = nav.connection || {}, cores = nav.hardwareConcurrency || 8, mem = nav.deviceMemory || 8;
  var saveData = !!conn.saveData || /(^|-)2g$/.test(conn.effectiveType || "");
  var lowTier = phone || cores <= 4 || mem <= 4 || /3g/.test(conn.effectiveType || "");
  var noVideo = saveData || reduce;
  if (lowTier) root.classList.add("lowtier");
  try { var q = /[?&]tier=(low|high|none)/.exec(location.search); if (q) { lowTier = q[1] === "low"; noVideo = q[1] === "none"; root.classList.toggle("lowtier", lowTier); } } catch (e) {}
  function vsrc(v) { return lowTier || v._lite ? (v.getAttribute("data-lite") || v.getAttribute("data-phone") || v.getAttribute("data-src")) : v.getAttribute("data-src"); }
  function vload(v) {
    if (noVideo || v.getAttribute("src")) return;
    var s = vsrc(v); if (!s) return;
    v.src = s; v.load();
    v.addEventListener("loadeddata", function () { v.classList.add("is-ready"); }, { once: true });
  }

  /* gobernador de fluidez: si el video pierde cuadros, baja a la versión liviana; si aun así no da, queda la imagen fija (siempre se ve bien y nunca hay lag) */
  function watchVideo(v) {
    if (!v || v._watched || !v.getVideoPlaybackQuality) return; v._watched = true;
    var lastT = 0, lastD = 0, bad = 0, checks = 0;
    var iv = setInterval(function () {
      if (document.hidden || v.paused || !v.readyState) return;
      var q = v.getVideoPlaybackQuality(); checks++;
      var dt = q.totalVideoFrames - lastT, dd = q.droppedVideoFrames - lastD; lastT = q.totalVideoFrames; lastD = q.droppedVideoFrames;
      if (dt > 8 && dd / dt > 0.14) bad++; else bad = Math.max(0, bad - 1);
      if (bad >= 2) {
        bad = 0;
        if (!lowTier && !v._lite) { v._lite = true; var t = v.currentTime; v.src = vsrc(v); v.load(); v.addEventListener("loadeddata", function () { try { v.currentTime = t; } catch (e) {} var p = v.play(); if (p && p.catch) p.catch(function () {}); }, { once: true }); }
        else { clearInterval(iv); noVideo = true; v.pause(); v.classList.remove("is-ready"); v.removeAttribute("src"); v.load(); root.classList.add("novideo"); }
      }
      if (checks > 40) clearInterval(iv);
    }, 1500);
  }
  function vplay(v) { vload(v); if (v._s === "play") return; v._s = "play"; if (scrolling) return; var p = v.play(); if (p && p.catch) p.catch(function () {}); watchVideo(v); }
  function vwait(v) { vload(v); if (v._s === "wait") return; v._s = "wait"; v.pause(); }
  function vfree(v) {
    if (v._s === "free") return; v._s = "free"; v.pause();
    if (v.getAttribute("src")) { v.removeAttribute("src"); v.load(); v.classList.remove("is-ready"); }
  }
  /* mientras se scrollea, el video se cambia por una foto fija de su cuadro actual (dibujar un video en movimiento es lo más caro) */
  function freeze(v) {
    try {
      if (!v.videoWidth) return;
      var cv = v._cv;
      if (!cv) { cv = v._cv = document.createElement("canvas"); cv.className = "vfreeze"; cv.width = 640; cv.height = Math.round(640 * v.videoHeight / v.videoWidth); v.parentNode.insertBefore(cv, v.nextSibling); }
      cv.getContext("2d").drawImage(v, 0, 0, cv.width, cv.height);
      cv.style.display = "block"; v.style.visibility = "hidden";
    } catch (e) {}
  }
  function unfreeze(v) { if (v._cv) { v._cv.style.display = "none"; } v.style.visibility = ""; }
  var scrolling = false, scrollT = null, activeVids = [];
  window.addEventListener("scroll", function () {
    if (!scrolling) { scrolling = true; activeVids.forEach(function (v) { if (v._s === "play") { freeze(v); v.pause(); } }); }
    clearTimeout(scrollT);
    scrollT = setTimeout(function () { scrolling = false; activeVids.forEach(function (v) { if (v._s === "play") { var p = v.play(); if (p && p.catch) p.catch(function () {}); unfreeze(v); } }); }, 140);
  }, { passive: true });
  function feed(trigger, vids, getF) {
    if (reduce) return;
    vids.forEach(function (v) { if (v && activeVids.indexOf(v) < 0) activeVids.push(v); });
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
    /* sin máscara: nada recorta las letras (g, p, q, y, j, tildes). La palabra aparece con desvanecido + subida. */
    return SplitText.create(el, { type: "words", wordsClass: "w" }).words;
  }

  /* ---------- cabecera, riel y progreso según la sección ---------- */
  var railEl = $(".rail"), railN = $("#railN"), railT = $("#railT"), navLinks = $$(".nav a");
  $$("[data-name]").forEach(function (s, i) {
    ScrollTrigger.create({
      trigger: s, start: "top 60px", end: "bottom 60px",
      onToggle: function (self) {
        if (!self.isActive) return;
        root.setAttribute("data-hdr", s.getAttribute("data-hdr") || "dark");
        railN.textContent = pad2(i + 1);
        railT.textContent = s.getAttribute("data-name");
        railEl.style.opacity = s.matches(".hero") ? "" : "0";
        navLinks.forEach(function (a) { a.classList.toggle("is-on", a.getAttribute("href") === "#" + s.id); });
        if (s.id !== ampliShown) { ampliShown = s.id; ampliSay(s.id); }
      }
    });
  });
  /* ---------- Ampli: dice una frase por sección (por ahora fijas; luego será un agente) ---------- */
  var AMPLI_LINES = {
    hero: "",
    manifiesto: "Más herramientas no alcanzan. Las integramos con tus procesos y tu gente para que den <b>resultados</b>.",
    problema: "<b>Hola, soy Ampli.</b> Si te suena alguna de estas señales, un diagnóstico es el primer paso.",
    "que-hacemos": "Procesos, IA y personas en un solo equipo: por eso las mejoras <b>se sostienen</b>.",
    frentes: "Seis frentes, desde Lean y Kaizen hasta IA y tableros en vivo. Elegí por dónde <b>empezar</b>.",
    metodo: "Cuatro pasos a tu medida, empezando por un <b>diagnóstico</b> con procesos y personas.",
    consultora: "Andriy lidera los procesos y Christian, las personas. Tocá el <b>+</b> para conocer sus proyectos.",
    proyectos: "Ya hicimos un workshop ejecutivo en Río Gallegos y ahora viene una <b>plataforma de cursos</b>.",
    clientes: "Trabajamos con salud, industria, servicios y aeropuertos: Medisur, SS Servicios, MS Patagonia y más.",
    faq: "¿Dudas sobre alcance, tiempos o costos? Poné el mouse sobre una pregunta: la respuesta está <b>acá</b>.",
    contacto: "Contanos tu desafío: conversamos y te proponemos un camino <b>a la medida</b> de tu empresa."
  };


  var BH_TIP = 84, BUB_GAP = 8, LINE_PAD = 26;
  function metodoZone(boxH) {
    var ln = $(".rm-line"); if (!ln) return null;
    var lr = ln.getBoundingClientRect(); if (!lr.width) return null;
    var lineTop = lr.top - LINE_PAD, lineBottom = lr.bottom + LINE_PAD, vh = window.innerHeight;
    var roomAbove = lineTop - 130 - boxH - (BH_TIP + BUB_GAP + 10);      /* franja + hueco para el globo arriba de todo */
    if (roomAbove > 20) return { top0: 130, bot: lineTop - boxH - (BH_TIP + BUB_GAP + 10), tipBelow: false };
    var belowStart = lineBottom + BH_TIP + BUB_GAP + 10, roomBelow = (vh - 24) - boxH - belowStart;
    if (roomBelow > 20) return { top0: belowStart, bot: vh - 24 - boxH, tipBelow: false };
    /* casi sin lugar en ningún lado: se usa el que tenga más espacio, con el globo hacia ese mismo lado */
    if (lineTop - 100 > vh - lineBottom) return { top0: 100, bot: Math.max(100, lineTop - boxH - 6), tipBelow: false };
    return { top0: Math.min(vh - 24 - boxH, lineBottom + 6), bot: vh - 24 - boxH, tipBelow: true };
  }
  var ampli = $("#ampli"), ampliBubble = $("#ampliBubble"), ampliBtn = $("#ampliBtn"), ampliId = null, ampliT = null, ampliShown = null, ampliX = 0, ampliSide = null;
  /* Ampli mide dónde hay texto en pantalla y elige un lugar LIBRE, siempre distinto al anterior: nunca se para encima de una palabra */
  var ampliY = 0, TEXT_SEL = "h1,h2,h3,h4,p,li,label,input,textarea,button:not(.ampli-btn):not(.menu-btn),.tiny,.btn,.nav-cta,.rm-num,.cap-title,.pr-t,.c3d-name,b";
  var LINE_SEL = ".rm-line, .hz-bar";
  function avoidRects() {
    var out = textRects(), vw = window.innerWidth, vh = window.innerHeight;
    $$(LINE_SEL).forEach(function (el) {
      var cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") return;
      var r = el.getBoundingClientRect(); if (r.bottom < 0 || r.top > vh || !r.width) return;
      out.push({ left: r.left, right: r.right, top: r.top - 22, bottom: r.bottom + 22 });
    });
    return out;
  }
  function textRects() {
    var out = [], vw = window.innerWidth, vh = window.innerHeight;
    $$(TEXT_SEL).forEach(function (el) {
      if (el.closest(".ampli, .hdr, .social, .wa, .rail, .menu, .fq-zoom, .progress, .pre")) return;
      var cs = getComputedStyle(el); if (cs.visibility === "hidden" || cs.display === "none") return;
      var r0 = el.getBoundingClientRect(); if (r0.bottom < 0 || r0.top > vh || r0.right < 0 || r0.left > vw || !r0.width) return;
      var rg = document.createRange(); rg.selectNodeContents(el);
      var rs = rg.getClientRects();
      for (var i = 0; i < rs.length; i++) { var r = rs[i]; if (r.width > 2 && r.height > 2 && r.bottom > 0 && r.top < vh) out.push(r); }
    });
    return out;
  }
  function hit(r, tr, pad) { return !(r.right + pad < tr.left || r.left - pad > tr.right || r.bottom + pad < tr.top || r.top - pad > tr.bottom); }
  function ampliBox() { var r = ampli.getBoundingClientRect(); var b = ampliBtn.getBoundingClientRect(); return { l: b.left, t: b.top, w: b.width, h: b.height }; }
  function ampliPick(avoidNear) {
    var box = ampliBox(), vw = window.innerWidth, vh = window.innerHeight, rects = avoidRects();
    var top0 = 100, bot = vh - 24, rows = 14, cands = [], first = ampliSide === null;
    var mz = ampliId === "metodo" ? metodoZone(box.h) : null;
    if (mz) { top0 = mz.top0; bot = mz.bot; }
    var cols = first ? 2 : 1;
    for (var c = 0; c < cols; c++) for (var r = 0; r < rows; r++) {
      var inset = clamp((vw * 0.044) - box.w - 8, 12, 34);
      var l = first ? (c === 0 ? inset : vw - box.w - inset) : box.l, t = top0 + (bot - top0 - box.h) * r / (rows - 1) + (Math.random() - .5) * 20;
      l = clamp(l, 12, vw - box.w - 12); t = clamp(t, top0, bot - box.h);
    var me = { left: l, right: l + box.w, top: t, bottom: t + box.h }, BW = 350, BH = 84;
      var bl = l > vw / 2 ? l + box.w - BW : l, br = bl + BW;
      var up = { left: bl, right: br, top: t - BH - 8, bottom: t - 8 }, dn = { left: bl, right: br, top: t + box.h + 8, bottom: t + box.h + 8 + BH };
      var hitsMe = 0, hu = 0, hd = 0;
      for (var i = 0; i < rects.length; i++) { if (hit(me, rects[i], 4)) hitsMe++; if (up.top > 88 && hit(up, rects[i], 4)) hu++; else if (up.top <= 88) hu += 99; if (dn.bottom < vh - 10 && hit(dn, rects[i], 4)) hd++; else if (dn.bottom >= vh - 10) hd += 99; }
      var hitsBub = Math.min(hu, hd);
      var waHit = (l + box.w > vw - 110 && t + box.h > vh - 120) ? 2000 : 0;
      var d = Math.hypot(l - box.l, t - box.t);
      cands.push({ l: l, t: t, s: waHit + hitsMe * 1000 + hitsBub * 260 + (d < (avoidNear || 220) ? 500 : 0) + Math.random() * 30 - Math.min(d, 900) / 40 });
    }
    cands.sort(function (a, b) { return a.s - b.s; });
    return cands[0];
  }
  function ampliWalkTo(p, done) {
    var box = ampliBox(), x = gsap.getProperty(ampli, "x"), y = gsap.getProperty(ampli, "y");
    var to = p.l - (box.l - x), toY = p.t - (box.t - y);
    var side = p.l > window.innerWidth / 2 ? "R" : "L";
    ampli.classList.remove("is-open");
    ampli.classList.add("is-walking");
    var dist = Math.hypot(to - x, toY - y), dur = Math.min(1.0, 0.4 + dist / 2200);
    ampli._target = { l: p.l, t: p.t, w: box.w, h: box.h };
    gsap.to(ampli, { x: to, duration: dur, ease: "sine.inOut", overwrite: true });
    gsap.to(ampli, { y: toY, duration: dur * 1.05, ease: "power2.inOut", onUpdate: function () { if (ampliBubble.classList.contains("is-on")) ampliFitNow(ampliBubble); }, onComplete: function () { ampliSide = side; ampli.classList.remove("is-walking"); ampli.classList.toggle("on-right", side === "R"); if (ampliBubble.classList.contains("is-on")) { ampliTips(); ampliFit(ampliBubble); } if (done) done(); } });
  }
  function ampliWalk(id, done) {
    if (phone) { if (ampliSide === null) { gsap.set(ampli, { x: 6, y: 0 }); ampliSide = "L"; } if (done) done(); return; }
    if (ampliSide === null) {
      var p0 = ampliPick(0), bx = ampliBox(), x0 = gsap.getProperty(ampli, "x"), y0 = gsap.getProperty(ampli, "y");
      gsap.set(ampli, { x: p0.l - (bx.l - x0), y: p0.t - (bx.t - y0) }); ampliSide = p0.l > window.innerWidth / 2 ? "R" : "L"; ampli.classList.toggle("on-right", ampliSide === "R"); if (done) done(); return;
    }
    ampliWalkTo(ampliPick(260), done);
  }
  /* si Ampli está en la parte de arriba, el globo y el panel se abren hacia abajo para no salirse de la pantalla */
  function ampliTips(tb) {
    var b = tb || ampliBox(), rs = avoidRects(), vh = window.innerHeight, BW = 350, BH = 84, right = b.l + b.w / 2 > window.innerWidth / 2;
    var bl = right ? b.l + b.w - BW : b.l, br = bl + BW;
    var up = { left: bl, right: br, top: b.t - BH - 8, bottom: b.t - 8 }, dn = { left: bl, right: br, top: b.t + b.h + 8, bottom: b.t + b.h + 8 + BH }, hu = up.top < 90 ? 99 : 0, hd = dn.bottom > vh - 10 ? 99 : 0;
    for (var i = 0; i < rs.length; i++) { if (hit(up, rs[i], 4)) hu++; if (hit(dn, rs[i], 4)) hd++; }
    if (ampliId === "metodo") {
      var mz2 = metodoZone(b.h);
      ampli.classList.toggle("tip-below", mz2 ? mz2.tipBelow : false);
    } else {
      ampli.classList.toggle("tip-below", hd < hu || (hd === hu && b.t < 270));
    }
    ampli.classList.toggle("on-right", right);
  }
  function ampliFitNow(el) {
    el.style.translate = "0 0";
    var r = el.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, dx = 0, dy = 0, m = 14;
    if (r.right > vw - m) dx = vw - m - r.right;
    if (r.left + dx < m) dx = m - r.left;
    if (r.bottom > vh - m) dy = vh - m - r.bottom;
    if (r.top + dy < 90) dy = 90 - r.top;
    el.style.translate = dx + "px " + dy + "px";
  }
  function ampliFit(el, target) {
    el.style.translate = "0 0";
    requestAnimationFrame(function () {
      var r = el.getBoundingClientRect(), vw = window.innerWidth, vh = window.innerHeight, dx = 0, dy = 0, m = 14;
      /* si Ampli todavía está caminando, se mide donde va a estar (destino), no donde está ahora */
      if (target) { var cb = ampliBtn.getBoundingClientRect(); var sx = target.l - cb.left, sy = target.t - cb.top; r = { left: r.left + sx, right: r.right + sx, top: r.top + sy, bottom: r.bottom + sy }; }
      if (r.right > vw - m) dx = vw - m - r.right;
      if (r.left + dx < m) dx = m - r.left;
      if (r.bottom > vh - m) dy = vh - m - r.bottom;
      if (r.top + dy < 90) dy = 90 - r.top;
      el.style.translate = dx + "px " + dy + "px";
    });
  }
  var ampliPinned = 0, dragging = false, dragMoved = false;
  function ampliSay(id) {
    if (!ampliBubble || AMPLI_LINES[id] === undefined) return;
    ampliId = id; clearTimeout(ampliT);
    if (id === "hero") { ampli.classList.add("is-hidden"); ampli.classList.remove("is-open"); ampliBubble.classList.remove("is-on"); return; }
    ampli.classList.remove("is-hidden");
    ampliBubble.classList.remove("is-on");
    ampliWalk(id, null);
    ampliT = setTimeout(function () {
      if (ampliId !== id) return;
      ampliTips(ampli._target); ampliBubble.innerHTML = AMPLI_LINES[id]; ampliBubble.classList.add("is-on"); ampli.classList.add("speaking"); ampliFitNow(ampliBubble);
      ampliT = setTimeout(function () { ampliBubble.classList.remove("is-on"); ampli.classList.remove("speaking"); }, 6500);
    }, 120);
  }
  /* los ojos siguen al mouse */
  if (!phone) {
    var pupils = $$(".a-pupil", ampli), ptick = false, mx = 0, my = 0;
    window.addEventListener("mousemove", function (e) { mx = e.clientX; my = e.clientY; if (!ptick) { ptick = true; requestAnimationFrame(function () { ptick = false;
      var r = ampliBtn.getBoundingClientRect(), dx = mx - (r.left + r.width / 2), dy = my - (r.top + r.height * 0.2), d = Math.max(1, Math.hypot(dx, dy)), k = Math.min(1, d / 200) * 7;
      pupils.forEach(function (p) { p.style.transform = "translate(" + (dx / d * k).toFixed(2) + "px," + (dy / d * k).toFixed(2) + "px)"; }); }); } }, { passive: true });
  }
  /* panel: se abre con un toque y lleva al diagnóstico */
  function ampliOpen(o) { if (o) { ampliTips(); ampliFit($("#ampliPanel")); } ampli.classList.toggle("is-open", o); ampliBtn.setAttribute("aria-expanded", o ? "true" : "false"); if (o) { clearTimeout(ampliT); ampliBubble.classList.remove("is-on"); } }
  ampliBtn.addEventListener("click", function () { if (ampli.classList.contains("is-open")) ampliOpen(false); else if (phone) ampliOpen(true); else { ampliOpen(true); } });
    $("#ampliX").addEventListener("click", function () { ampliOpen(false); });
  $(".ampli-cta").addEventListener("click", function () { ampliOpen(false); });
  document.addEventListener("keydown", function (e) { if (e.key === "Escape") ampliOpen(false); });
  var ampliIdle = null;
  function ampliCheck() {
    if (phone || dragging || Date.now() < ampliPinned || !ampliSide || ampliId === "hero" || ampli.classList.contains("is-open") || ampli.classList.contains("is-walking")) return;
    var b = ampliBox(), me = { left: b.l, right: b.l + b.w, top: b.t, bottom: b.t + b.h }, rs = textRects(), bad = b.t < 90;
    for (var i = 0; i < rs.length && !bad; i++) if (hit(me, rs[i], 6)) bad = true;
    if (bad) ampliWalkTo(ampliPick(160));
  }
  window.addEventListener("scroll", function () { clearTimeout(ampliIdle); ampliIdle = setTimeout(ampliCheck, 900); }, { passive: true });
  window.addEventListener("resize", function () { clearTimeout(ampliIdle); ampliIdle = setTimeout(ampliCheck, 500); });
  /* de vez en cuando pasea a otro lugar libre (movimiento natural) */
  setInterval(function () { if (!phone && !dragging && Date.now() > ampliPinned && ampliSide && ampliId !== "hero" && !document.hidden && !ampli.classList.contains("is-open") && !ampli.classList.contains("is-walking")) ampliWalkTo(ampliPick(300)); }, 13000);
  gsap.to("#prog", { scaleX: 1, ease: "none", scrollTrigger: { start: 0, end: "max", scrub: 0.2 } });
  ScrollTrigger.create({ trigger: "#hero", start: "bottom 60%", end: "max", onToggle: function (s) { $("#wa").classList.toggle("is-on", s.isActive); $("#social").classList.toggle("is-on", s.isActive); } });

  function onceIn(t, fn, start) { ScrollTrigger.create({ trigger: t, start: start || "top 70%", once: true, onEnter: fn }); }

  /* ---------- construcción de las escenas ---------- */
  var heroChars = [];
  function build() {
    /* 01 · inicio */
    var hw = $(".hero-word");
    if (HAS_SPLIT) { heroChars = SplitText.create(hw, { type: "chars", charsClass: "ch" }).chars; gsap.set(heroChars, { yPercent: 115 }); }
    var heroTrack = $("#hero .track");
    if (!lowTier) gsap.to("#heroMedia", { scale: 1.22, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "bottom bottom", scrub: true } });
    gsap.to("#heroCopy", { yPercent: -16, opacity: 0, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "62% top", scrub: true } });
    gsap.to(".hero-scroll", { opacity: 0, ease: "none", scrollTrigger: { trigger: heroTrack, start: "top top", end: "10% top", scrub: true } });
    feed(heroTrack, [$("#hero video")]);

    /* 02 · manifiesto: se enciende solo al llegar */
    var mw = words($("#manifText"), false);
    onceIn("#manifiesto", function () { gsap.to(mw, { opacity: 1, stagger: 0.07, duration: 0.7, ease: "power2.out" }); }, "top 55%");

    /* 03 · el problema: las cinco filas se abren solas (línea, título por palabra, texto de costado) */
    var prRows = $$("#prList .pr-row");
    var prT = prRows.map(function (r) { return words($(".pr-t", r)); });
    prRows.forEach(function (r, i) {
      gsap.set($(".pr-line", r), { scaleX: 0 });
      gsap.set(prT[i], { yPercent: 40, opacity: 0 });
      gsap.set($$(".pr-n, .pr-s", r), { opacity: 0, x: i % 2 ? -40 : 40 });
    });
    onceIn("#prList", function () {
      prRows.forEach(function (r, i) {
        var tl = gsap.timeline({ delay: i * 0.18 });
        tl.to($(".pr-line", r), { scaleX: 1, duration: 1.1, ease: "power3.inOut" })
          .to(prT[i], { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: "power4.out" }, 0.25)
          .to($(".pr-n", r), { opacity: 0.55, x: 0, duration: 0.7, ease: "power3.out" }, 0.3)
          .to($(".pr-s", r), { opacity: 0.7, x: 0, duration: 0.8, ease: "power3.out" }, 0.5);
      });
    }, "top 65%");

    /* 04 · qué hacemos: un solo bloque que se abre desde el centro; los tres módulos aparecen integrados */
    var capsCols = $("#capsCols"), capCols = $$(".col", capsCols);
    var cw = capCols.map(function (c) { return words($(".cap-title", c)); });
    var capRest = $$(".col .tiny, .col .sub", capsCols), nodes = $$(".cols-node", capsCols);
    capsCols.style.clipPath = "inset(0% 50% 0% 50% round 8px)";
    gsap.set(cw, { yPercent: 40, opacity: 0 }); gsap.set(capRest, { opacity: 0, y: 16 });
    gsap.set(".cols-link", { scaleX: 0 }); gsap.set(nodes, { scale: 0 });
    onceIn(capsCols, function () {
      gsap.timeline()
        .fromTo(capsCols, { clipPath: "inset(0% 50% 0% 50% round 8px)" }, { clipPath: "inset(0% 0% 0% 0% round 8px)", duration: 1.5, ease: "power3.inOut" })
        .to(".cols-link", { scaleX: 1, duration: 1.4, ease: "power2.inOut" }, 0.1)
        .to(cw[1], { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: "power4.out" }, 0.7)
        .to([cw[0], cw[2]], { yPercent: 0, opacity: 1, duration: 0.9, stagger: 0.05, ease: "power4.out" }, 0.95)
        .to(capRest, { opacity: 0.8, y: 0, duration: 0.7, stagger: 0.06, ease: "power2.out" }, 1.0)
        .fromTo(".col-img img", { scale: 1.25 }, { scale: 1, duration: 2.4, ease: "power2.out" }, 0.2)
        .to(nodes, { scale: 1, duration: 0.6, stagger: 0.15, ease: "back.out(2.4)" }, 1.3);
    }, "top 70%");

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
    rw.forEach(function (w) { gsap.set(w, { yPercent: 40, opacity: 0 }); });
    onceIn("#metodo .rm-wrap", function () {
      var tl = gsap.timeline();
      tl.to("#rmLine", { scaleX: 1, duration: 2.6, ease: "power1.inOut" }, 0);
      cols.forEach(function (col, i) {
        var t = 0.15 + i * 0.6;
        tl.call(function () { col.classList.add("on"); }, null, t)
          .to(col, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, t)
          .to(rw[i], { yPercent: 0, opacity: 1, duration: 0.8, ease: "power4.out" }, t + 0.1);
      });
      tl.from(".rm-foot", { opacity: 0, y: 16, duration: 0.8 }, 2.4);
      /* la luz viaja con la línea, enciende cada nodo al pasar y después va y viene sin parar (energía por un cable) */
      var spark = $(".rm-spark"), active = null;
      gsap.set(spark, { opacity: 1, left: "0%" });
      function hits() {
        var sx = spark.getBoundingClientRect().left + 10;
        cols.forEach(function (col) {
          var nx = col.getBoundingClientRect().left + 7.5;
          if (Math.abs(sx - nx) < 16 && !col._hit) {
            col._hit = true; col.classList.add("hit");
            setTimeout(function () { col.classList.remove("hit"); col._hit = false; }, 520);
          }
        });
      }
      active = gsap.to(spark, { left: "100%", duration: 2.6, ease: "power1.inOut", onUpdate: hits, onComplete: function () {
        active = gsap.to(spark, { left: "0%", duration: 3.4, ease: "sine.inOut", repeat: -1, yoyo: true, onUpdate: hits });
      } });
      ScrollTrigger.create({ trigger: "#metodo", start: "top bottom", end: "bottom top", onToggle: function (s) { if (active) { if (s.isActive) active.resume(); else active.pause(); } } });
    }, "top 75%");

    /* 07 · nosotros: dos contenedores negros con "+" (mismo mecanismo que la página anterior) */
    (function who() {
      var PEOPLE = [
        { tag: "Procesos", name: "Andriy Trofymenko", role: "Ingeniero industrial · Optimización de procesos · Mejora continua",
          intro: "Especializado en la gestión estratégica de proyectos y la excelencia operativa. Combina rigurosidad técnica y visión integral para transformar procesos, reducir costos y maximizar la productividad, con formación en Industria 4.0.",
          labelA: "Proyectos", listA: ["Cadena de valor del cáñamo", "Capacitación corporativa", "Planta de polietileno", "Reestructuración de layout", "Optimización clínica", "Herramientas de gestión"],
          labelB: "Trabajó con", textB: "Medisur · SS Servicios · MS Patagonia · Aeropuertos Argentina" },
        { tag: "Personas", name: "Christian Pollavini", role: "Coach empresarial · Desarrollo organizacional y comercial",
          intro: "Coach empresarial especializado en desarrollo organizacional y comercial. Trabaja con líderes y equipos para que los cambios de proceso se sostengan en las personas que los llevan adelante.",
          labelA: "Áreas de trabajo", listA: ["Coaching organizacional", "Liderazgo", "Cohesión de equipos", "Entrenamiento de equipos comerciales", "Estrategia de venta", "Manejo de objeciones y cierre"],
          labelB: "", textB: "" }
      ];
      var sec = $("#consultora"), whoCards = $$(".who-card", sec), hots = $$(".who-hot", sec), detail = $("#whoDetail"), xBtn = $("#whoX");
      gsap.set(whoCards, { opacity: 0, y: 50 });
      gsap.set(hots, { opacity: 0, scale: 0.6 });
      onceIn("#whoStage", function () {
        gsap.timeline().to(whoCards, { opacity: 1, y: 0, duration: 1.1, stagger: 0.2, ease: "power3.out" }, 0)
          .to(hots, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.18, ease: "back.out(2.2)" }, 0.9);
      }, "top 75%");

      if (window.matchMedia("(any-hover: hover) and (min-width: 861px)").matches) {
        var CLOSED = { left: "inset(0% 100% 0% 0%)", right: "inset(0% 0% 0% 100%)", top: "inset(0% 0% 100% 0%)", bottom: "inset(100% 0% 0% 0%)" }, OPEN = "inset(0% 0% 0% 0%)";
        var edgeOf = function (e, el) {
          var r = el.getBoundingClientRect(), dx = (e.clientX - (r.left + r.width / 2)) / r.width, dy = (e.clientY - (r.top + r.height / 2)) / r.height;
          return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "top" : "bottom");
        };
        whoCards.forEach(function (card) {
          var color = $(".who-img-color", card);
          card.addEventListener("mouseenter", function (e) { gsap.fromTo(color, { clipPath: CLOSED[edgeOf(e, card)] }, { clipPath: OPEN, duration: 0.8, ease: "power3.out", overwrite: true }); });
          card.addEventListener("mouseleave", function (e) {
            var edge = edgeOf(e, card), toward = { left: CLOSED.right, right: CLOSED.left, top: CLOSED.bottom, bottom: CLOSED.top }[edge];
            gsap.to(color, { clipPath: toward, duration: 0.7, ease: "power3.inOut", overwrite: true });
          });
        });
      }
      function open(i) {
        var d = PEOPLE[i], src = $(".who-img-color", whoCards[i]).getAttribute("src");
        $("#wdImg").src = src; $("#wdImg").alt = d.name;
        $("#wdTag").textContent = d.tag; $("#wdName").textContent = d.name; $("#wdRole").textContent = d.role; $("#wdIntro").textContent = d.intro;
        $("#wdLabelA").textContent = d.labelA;
        var ul = $("#wdListA"); ul.innerHTML = "";
        d.listA.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
        $("#wdBlockB").hidden = !d.textB; $("#wdLabelB").textContent = d.labelB; $("#wdTextB").textContent = d.textB;
        detail.hidden = false; root.classList.add("has-panel");
        var bodyEls = $$(".wd-tag, h3, .wd-role, .wd-intro, .wd-block:not([hidden])", detail);
        gsap.fromTo(detail, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", overwrite: true });
        gsap.fromTo($(".wd-photo img", detail), { scale: 1.12 }, { scale: 1, duration: 1.4, ease: "power2.out", overwrite: true });
        gsap.fromTo(bodyEls, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, delay: 0.15, ease: "power3.out", overwrite: true });
        if (lenis && phone) lenis.stop();
        xBtn.focus({ preventScroll: true });
      }
      function shut() {
        root.classList.remove("has-panel");
        if (detail.hidden) return;
        gsap.to(detail, { opacity: 0, y: 16, duration: 0.3, ease: "power2.in", overwrite: true, onComplete: function () { detail.hidden = true; } });
        if (lenis) lenis.start();
      }
      hots.forEach(function (h) { h.addEventListener("click", function () { open(+h.getAttribute("data-who")); }); });
      xBtn.addEventListener("click", shut);
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });
      ScrollTrigger.create({ trigger: sec, start: "top 85%", end: "bottom 15%", onToggle: function (s) { if (!s.isActive) shut(); } });
    })();
    $$(".split").forEach(function (el) {
      var w = words(el); el.classList.add("is-split");
      gsap.from(w, { yPercent: 40, opacity: 0, duration: 1.25, stagger: 0.07, ease: "power4.out", scrollTrigger: { trigger: el, start: "top 88%", once: true } });
    });

    ring3d();
    feed($("#clientes"), [$("#clientes video")]);

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



  /* ---------- preguntas frecuentes: cada fila se repite 3 veces (bucle sin huecos) y se desplaza en píxeles exactos ---------- */
  var fqTracks = [];
  $$(".fq-row").forEach(function (row) {
    var set = $(".fq-set", row), track = document.createElement("div");
    track.className = "fq-track"; track.style.setProperty("--dur", row.getAttribute("data-speed") || "60s");
    row.appendChild(track); track.appendChild(set);
    for (var k = 0; k < 2; k++) { var c = set.cloneNode(true); c.setAttribute("aria-hidden", "true"); track.appendChild(c); }
    fqTracks.push({ track: track, set: set });
  });
  function fqMeasure() {
    fqTracks.forEach(function (t) { t.track.style.setProperty("--shift", "-" + t.set.offsetWidth + "px"); });
  }
  fqMeasure();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(fqMeasure);
  window.addEventListener("load", fqMeasure);
  window.addEventListener("resize", fqMeasure);
  var ampliHideZoom = function () {};
  /* lupa: una sola tarjeta ampliada, flotando sobre la original.
     Mouse o lápiz: al pasar. Táctil: con un toque. No depende de media queries de hover (notebooks táctiles, Safari, etc.) */
  (function fqLupa() {
    var zoom = $("#fqZoom"), rows = $("#fqRows"), cur = null, hideT = null, lastType = "mouse";
    if (!zoom || !rows) return;
    function place(card) {
      var r = card.getBoundingClientRect();
      zoom.innerHTML = card.innerHTML;
      var w = zoom.offsetWidth, h = zoom.offsetHeight;
      var x = clamp(r.left + r.width / 2 - w / 2, 12, window.innerWidth - w - 12);
      var y = clamp(r.top + r.height / 2 - h / 2, 96, window.innerHeight - h - 12);
      zoom.style.left = x + "px"; zoom.style.top = y + "px";
      zoom.style.transformOrigin = clamp(((r.left + r.width / 2) - x) / w * 100, 0, 100) + "% " + clamp(((r.top + r.height / 2) - y) / h * 100, 0, 100) + "%";
    }
    function anim(props, done) {
      if (window.gsap) { gsap.to(zoom, Object.assign({ overwrite: true, onComplete: done }, props)); }
      else { zoom.style.opacity = props.opacity; if (done) done(); }
    }
    function show(card) {
      clearTimeout(hideT); if (cur === card) return; cur = card;
      zoom.classList.add("is-on"); place(card);
      if (window.gsap) gsap.fromTo(zoom, { opacity: 0, scale: 0.72 }, { opacity: 1, scale: 1, duration: 0.32, ease: "power3.out", overwrite: true });
      else zoom.style.opacity = 1;
    }
    var lastScrollAt = 0, mx = -1, my = -1, scrollEndT = null;
    function hide(instant) {
      clearTimeout(hideT); cur = null;
      if (instant) { if (window.gsap) gsap.killTweensOf(zoom); zoom.style.opacity = 0; zoom.classList.remove("is-on"); return; }
      anim({ opacity: 0, scale: 0.94, duration: 0.1, ease: "power1.in" }, function () { if (!cur) zoom.classList.remove("is-on"); });
    }
    function cardOf(e) { return e.target && e.target.closest ? e.target.closest(".fq-card") : null; }
    document.addEventListener("pointermove", function (e) { mx = e.clientX; my = e.clientY; }, { passive: true });
    rows.addEventListener("pointerdown", function (e) { lastType = e.pointerType || "mouse"; }, true);
    var over = window.PointerEvent ? "pointerover" : "mouseover", out = window.PointerEvent ? "pointerout" : "mouseout";
    rows.addEventListener(over, function (e) { var c = cardOf(e); if (c && (e.pointerType || "mouse") !== "touch" && Date.now() - lastScrollAt > 120) show(c); });
    rows.addEventListener(out, function (e) { var c = cardOf(e); if (c && (e.pointerType || "mouse") !== "touch" && !(e.relatedTarget && c.contains(e.relatedTarget))) hide(); });
    rows.addEventListener("mouseleave", function () { hide(true); });
    rows.addEventListener("pointerleave", function () { hide(true); });
    rows.addEventListener("click", function (e) { var c = cardOf(e); if (c && lastType === "touch") { if (cur === c) hide(); else show(c); } });
    document.addEventListener("click", function (e) { if (!cardOf(e) && cur) hide(true); });
    /* cualquier scroll, rueda o toque en pantalla la apaga al instante; al asentarse, si el mouse (quieto) quedó
       sobre una tarjeta, la lupa se activa igual — no depende de que el mouse se haya movido después */
    function killNow() {
      lastScrollAt = Date.now();
      if (cur || zoom.classList.contains("is-on")) hide(true);
      clearTimeout(scrollEndT);
      scrollEndT = setTimeout(function () {
        if (mx < 0 || lastType === "touch") return;
        var el = document.elementFromPoint(mx, my), c = el && el.closest ? el.closest(".fq-card") : null;
        if (c) show(c);
      }, 140);
    }
    window.addEventListener("scroll", killNow, { passive: true });
    window.addEventListener("wheel", killNow, { passive: true });
    window.addEventListener("touchmove", killNow, { passive: true });
    window.addEventListener("keydown", function (e) { if (e.key === "Escape" || /Arrow|Page|Home|End| /.test(e.key)) killNow(); });
    window.addEventListener("blur", function () { hide(true); });
    ampliHideZoom = function () { hide(true); };
  })();

  /* fuera de pantalla no se anima nada */
  if ("IntersectionObserver" in window) {
    var faqEl = $("#faq");
    new IntersectionObserver(function (es) { faqEl.classList.toggle("is-off", !es[0].isIntersecting); if (!es[0].isIntersecting) ampliHideZoom(); }, { rootMargin: "80px" }).observe(faqEl);
  }

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
