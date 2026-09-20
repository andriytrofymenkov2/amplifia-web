(function () {
  "use strict";

  gsap.registerPlugin(ScrollTrigger);

  /* On Android the address bar slides away as you scroll, which fires a resize.
     By default ScrollTrigger answers a resize with a full refresh: it measures
     every trigger on the page again, i.e. a complete layout, in the middle of
     the scroll. That alone can turn a smooth page into a slideshow, and it
     happens whether or not there is a video on screen. */
  ScrollTrigger.config({ ignoreMobileResize: true, limitCallbacks: true });

  /* A 120 Hz phone asks for 120 frames a second, so every scrubbed timeline and
     every ticker below would run twice as often as on a 60 Hz screen, for
     motion nobody can tell apart. Capped, the phone has room to actually draw. */
  if (window.AMP_PHONE) gsap.ticker.fps(60);

  /* Our own resize work has the same problem: on a phone only a real width
     change is a layout change — the address bar is not. */
  function onResize(fn) {
    var w = window.innerWidth;
    window.addEventListener("resize", function () {
      if (window.AMP_PHONE && window.innerWidth === w) return;
      w = window.innerWidth;
      fn();
    });
  }

  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var isTouch = window.matchMedia("(hover: none)").matches || window.innerWidth < 860;

  /* ---------------- Lenis smooth scroll ---------------- */
  var lenis = null;
  if (!reduceMotion && window.Lenis && !window.AMP_PHONE) {
    lenis = new window.Lenis({ duration: 1.1, smoothWheel: true });
    lenis.on("scroll", ScrollTrigger.update);
    gsap.ticker.add(function (time) { lenis.raf(time * 1000); });
    gsap.ticker.lagSmoothing(0);
  }

  /* ---------------- Custom cursor ---------------- */
  var cursorDot = document.getElementById("cursorDot");
  if (cursorDot && !isTouch) {
    var cx = window.innerWidth / 2, cy = window.innerHeight / 2;
    var dotX = gsap.quickTo(cursorDot, "x", { duration: 0.35, ease: "power3.out" });
    var dotY = gsap.quickTo(cursorDot, "y", { duration: 0.35, ease: "power3.out" });
    window.addEventListener("mousemove", function (e) {
      cx = e.clientX; cy = e.clientY;
      dotX(cx); dotY(cy);
    }, { passive: true });
    document.querySelectorAll("a, button, [data-cursor='hover'], .front, .fan-card, .who-hot, .who-x, .faq-q, .wa-float, .proj-btn, .orb-btn, .orb-x, .orb-cta, .cf-send, .cf-mail, .c3d-stage, .c3d-modal-x").forEach(function (el) {
      el.addEventListener("mouseenter", function () { cursorDot.classList.add("is-hover"); });
      el.addEventListener("mouseleave", function () { cursorDot.classList.remove("is-hover"); });
    });
  }

  /* ---------------- Progress line ---------------- */
  gsap.to("#progressLine", {
    scaleX: 1,
    ease: "none",
    scrollTrigger: { start: 0, end: "max", scrub: true }
  });

  /* ---------------- Word / line splitting ---------------- */
  function splitWords(el) {
    var text = el.textContent.trim();
    el.textContent = "";
    text.split(/\s+/).forEach(function (word, i, arr) {
      var span = document.createElement("span");
      span.className = "word";
      span.textContent = word;
      el.appendChild(span);
      /* the space must live OUTSIDE the inline-block span — trailing
         whitespace inside an inline-block's own line box gets trimmed,
         which silently collapses every inter-word gap to zero. */
      if (i < arr.length - 1) el.appendChild(document.createTextNode(" "));
    });
    return el.querySelectorAll(".word");
  }

  document.querySelectorAll(".split-words").forEach(function (el) {
    var words = splitWords(el);
    gsap.set(words, { yPercent: 110, opacity: 0 });
  });

  document.querySelectorAll(".reveal-lines span").forEach(function (el) {
    gsap.set(el, { yPercent: 110, opacity: 0 });
  });

  /* ---------------- Wordmark letter glow (once, on load) ----------------
     a very thin lime outline travels across "AMPLIFIA" strictly one
     letter at a time, left to right, automatically — pure text-stroke-
     color (the solid white fill never changes), so it can't reintroduce
     the double-antialiasing/gray-fringe problem a background-clip:text
     overlay did. Runs once on load rather than looping forever: a
     permanent animation on the brand's own wordmark read as more "tech
     demo" than the sober, premium register the rest of the site holds
     to, but the one-time detail on arrival is worth keeping. */
  document.querySelectorAll(".wordmark").forEach(function (el) {
    var text = el.textContent;
    el.textContent = "";
    var letters = text.split("").map(function (ch) {
      var span = document.createElement("span");
      span.className = "wm-letter";
      span.textContent = ch;
      el.appendChild(span);
      return span;
    });

    var i = 0;
    var sweep = setInterval(function () {
      letters.forEach(function (l) { l.classList.remove("is-lit"); });
      if (i >= letters.length) { clearInterval(sweep); return; }
      letters[i].classList.add("is-lit");
      i++;
    }, 280);
  });

  function revealWordsTween(el, opts) {
    var words = el.querySelectorAll(".word");
    return gsap.to(words, Object.assign({
      yPercent: 0,
      opacity: 1,
      stagger: 0.03,
      duration: 0.8,
      ease: "power3.out"
    }, opts || {}));
  }

  /* Scrub-driven word reveal used inside scroll-track timelines: adds a
     reveal + a matching hide later in the same timeline at position `at`.
     Every tween in a scrubbed timeline needs an EXPLICIT duration — GSAP's
     default (0.5s) inflates the timeline's totalDuration past 1, which
     would silently break the 0–1 "fraction of scroll" mapping every
     position value in this file relies on. */
  function scrubWords(tl, el, at, dur, exitAt, exitDur) {
    var words = el.querySelectorAll(".word");
    /* eased rather than linear, so each word decelerates into place
       instead of sliding at a constant, mechanical speed — reads as a
       soft settle rather than a typewriter effect. */
    tl.to(words, { yPercent: 0, opacity: 1, stagger: dur / words.length, duration: dur, ease: "power2.out" }, at);
    if (exitAt != null) {
      tl.to(words, { opacity: 0, yPercent: -30, duration: exitDur || 0.12, ease: "power1.in" }, exitAt);
    }
  }

  /* ---------------- HERO ---------------- */
  (function heroSection() {
    var hero = document.getElementById("hero");
    var eyebrow = hero.querySelector(".reveal-lines span");
    var wordmark = hero.querySelector(".wordmark");
    var tagline = hero.querySelector(".tagline");
    var heroImg = hero.querySelector(".hero-network img");

    var expandBox = document.getElementById("heroExpand");

    gsap.set(hero, { "--hero-tint": 0 });
    gsap.set(wordmark, { opacity: 0, yPercent: 20 });
    gsap.set(heroImg, { scale: 1.06, transformOrigin: "50% 50%" });
    gsap.set(expandBox, { opacity: 0, scale: 0.94, transformOrigin: "50% 50%" });

    gsap.timeline({ delay: 0.3 })
      .to(expandBox, { opacity: 1, scale: 1, duration: 0.9, ease: "power3.out" })
      .to(eyebrow, { yPercent: 0, opacity: 1, duration: 0.7, ease: "power3.out" }, 0.1)
      .to(wordmark, { opacity: 1, yPercent: 0, duration: 1, ease: "power4.out" }, 0.2)
      .add(revealWordsTween(tagline, { stagger: 0.03 }), 0.5);

    var tl = gsap.timeline({
      scrollTrigger: { trigger: hero, start: "top top", end: "bottom bottom", scrub: 1 }
    });

    /* the "scroll-expansion" mechanic: the card grows from a small
       rounded rectangle to a full-bleed frame as the user scrolls,
       before the rest of the hero (Ken-Burns drift, crossfade) plays out
       exactly as before. maxWidth/maxHeight are animated too because the
       CSS max-* clamp used for the small initial card would otherwise
       cap the card short of true full-bleed. */
    tl.to(expandBox, { width: "100vw", height: "100vh", maxWidth: "100vw", maxHeight: "100vh", borderRadius: 0, duration: 0.4, ease: "none" }, 0);
    /* slow Ken-Burns drift on the photograph — a photo can't be "drawn"
       node by node the way the previous SVG network was, so continuity
       with the scroll comes from a steady, deliberate zoom instead. */
    tl.to(heroImg, { scale: 1.22, duration: 1, ease: "none" }, 0);
    /* the eyebrow and tagline just fade out early, same as before — but
       the mark + wordmark scale up together with the growing card
       instead, so it reads as one piece expanding rather than the text
       simply dimming while the card grows on its own. */
    tl.to(hero.querySelector(".eyebrow"), { opacity: 0, duration: 0.2, ease: "none" }, 0.02);
    tl.to(hero.querySelector(".tagline"), { opacity: 0, duration: 0.2, ease: "none" }, 0.02);
    tl.to(hero.querySelector(".hero-title-stack"), { scale: 1.7, transformOrigin: "50% 50%", duration: 0.4, ease: "none" }, 0);
    tl.to(hero.querySelector(".hero-title-stack"), { opacity: 0, duration: 0.15, ease: "none" }, 0.3);
    tl.to(".hero-foot", { opacity: 0, duration: 0.2, ease: "none" }, 0.02);
    /* the darkening scrim over the photo is only there to help the copy
       read on first view — it lifts completely as soon as the text has
       cleared out, so the rest of the scroll shows the bare photograph. */
    tl.to(hero.querySelector(".scene-vignette"), { opacity: 0, duration: 0.35, ease: "none" }, 0.05);
    /* crossfade into 01 — Capacidad Humana: the video is what the user
       has been watching grow to full-bleed, so it has to be the last
       thing on screen — not the background photo reappearing behind it.
       The background is fully hidden behind the opaque, full-bleed box
       from progress 0.4 onward, so it can fade out early with zero
       visible effect; the box/video then stays the only visible layer
       and fades out last, right at the very end. */
    /* gray → green as the visitor scrolls: the hero opens exactly as it
       was, then this drives --hero-tint (read by the ::after blend layers
       in the CSS) up so that by the time the box fades out the footage
       is already the same green as the ink video waiting behind it. */
    tl.to(hero, { "--hero-tint": 0.75, duration: 0.55, ease: "none" }, 0.25);
    tl.to(".hero-network", { opacity: 0, duration: 0.1, ease: "none" }, 0.45);
    tl.to(expandBox, { opacity: 0, scale: 0.985, duration: 0.15, ease: "power1.in" }, 0.85);
  })();

  /* ---------------- Hero → El problema → Qué hacemos: scroll snap ----------------
     these three slides are one continuous background that changes
     color/footage as you scroll, so resting halfway between two of them
     shows a muddy half-blend of both — the transition looks unfinished.
     Whenever the visitor stops scrolling inside this stretch, a short
     idle carries the scroll on to the next slide top in the direction
     they were heading (or back to the previous one if they barely
     moved), so every rest point is a fully-resolved slide. Past the top
     of "Qué hacemos" the page scrolls freely again. */
  (function introSnap() {
    if (reduceMotion || !lenis) return;
    var problema = document.getElementById("problema");
    var queHacemos = document.getElementById("que-hacemos");
    var metodo = document.getElementById("metodo");
    var frentes = document.getElementById("frentes");
    var consultora = document.getElementById("consultora");
    var settleTimer = null;
    var snapping = false;
    var lastY = window.scrollY;
    var dir = 1;

    window.addEventListener("scroll", function () {
      var now = window.scrollY;
      if (now !== lastY) dir = now > lastY ? 1 : -1;
      lastY = now;
      if (snapping) return;
      clearTimeout(settleTimer);
      settleTimer = setTimeout(function () {
        var stops = [0, problema.offsetTop, queHacemos.offsetTop];
        /* "Qué hacemos" -> "Método": also a rest point, so the hand-over
           between their backgrounds never stops halfway. Only when slide 3
           fits the screen (on a short/tall phone it needs free scrolling). */
        if (queHacemos.offsetHeight <= window.innerHeight * 1.15) {
          stops.push(frentes.offsetTop);
          if (frentes.offsetHeight <= window.innerHeight * 1.15) {
            stops.push(metodo.offsetTop);
            if (metodo.offsetHeight <= window.innerHeight * 1.15) stops.push(consultora.offsetTop);
          }
        }
        var y = window.scrollY;
        if (y <= 4 || y >= stops[stops.length - 1] - 4) return;
        var i = 0;
        while (i < stops.length - 2 && y >= stops[i + 1]) i++;
        var a = stops[i], b = stops[i + 1];
        if (Math.abs(y - a) <= 4 || Math.abs(y - b) <= 4) return;
        var frac = (y - a) / (b - a);
        var target = dir > 0 ? (frac > 0.1 ? b : a) : (frac < 0.9 ? a : b);
        snapping = true;
        lenis.scrollTo(target, {
          duration: 1.0,
          easing: function (t) { return 1 - Math.pow(1 - t, 3); },
          onComplete: function () { snapping = false; lastY = window.scrollY; }
        });
      }, 140);
    }, { passive: true });
  })();

  /* ---------------- Shared background bridge ----------------
     One fixed layer behind Hero → El problema → Qué hacemos. The ink
     layer fades in on the exact same scroll range hero's own video
     fades out on (progress 0.85–1.0 of the hero track), so the two
     dissolve into each other instead of hero cutting to black first.
     Ink → drops crossfades the same way at the problema/qué-hacemos
     seam, using each section's own pass-through progress. */
  (function bgBridge() {
    var hero = document.getElementById("hero");
    var problema = document.getElementById("problema");
    var queHacemos = document.getElementById("que-hacemos");
    var layerInk = document.getElementById("bridgeInk");
    var layerDrops = document.getElementById("bridgeDrops");
    var layerLight = document.getElementById("bridgeLight");
    var layerThreads = document.getElementById("bridgeThreads");
    var layerMist = document.getElementById("bridgeMist");
    var layerFil = document.getElementById("bridgeFil");
    var layerDust = document.getElementById("bridgeDust");
    var clientsEl = document.getElementById("clientes");
    var layerBoke = document.getElementById("bridgeBoke");
    var faqEl = document.getElementById("faq");
    var layerRise = document.getElementById("bridgeRise");
    var projEl = document.getElementById("proyectos");
    var metodo = document.getElementById("metodo");
    var frentes = document.getElementById("frentes");
    var whoEl = document.getElementById("consultora");

    gsap.set([layerInk, layerDrops, layerLight, layerThreads, layerMist, layerFil, layerDust, layerBoke, layerRise], { autoAlpha: 0 });

    /* Every one of these triggers reports progress 0 for its entire
       "not reached yet" range and progress 1 for its entire "already
       passed" range — onUpdate still fires on every scroll tick even
       then, so without a guard each handler would keep re-asserting its
       resting value and fight whichever earlier/later trigger is
       actually supposed to own that layer at that point in the scroll.
       Only acting strictly between 0 and 1 lets control of a layer pass
       cleanly from one trigger to the next. */
    /* Each handler also pins its final resting value exactly once, at the
       moment it crosses out of its active range — a fast scroll or a snap
       can land on the very last frame without ever passing through an
       "active" tick near 1, which would otherwise leave the layers stuck
       at whatever the previous tick set (e.g. ink still 1, drops still 0
       when "Qué hacemos" is already on screen). */
    function crossfade(from, into, start, end) {
      var state = "before";
      return function (self) {
        var st = typeof start === "function" ? start() : start;
        var s = self.progress <= 0 ? "before" : self.progress >= 1 ? "after" : "active";
        if (s === "active") {
          state = s;
          var t = Math.max(0, Math.min(1, (self.progress - st) / (end - st)));
          if (from) gsap.set(from, { autoAlpha: 1 - t });
          gsap.set(into, { autoAlpha: t });
          return;
        }
        if (s === state) return;
        state = s;
        var rest = s === "after" ? 1 : 0;
        if (from) gsap.set(from, { autoAlpha: 1 - rest });
        gsap.set(into, { autoAlpha: rest });
      };
    }

    /* thread (hero's own video) -> ink, mirroring hero's internal
       fade-out window exactly (see heroSection: expandBox fades 0.85–1.0) */
    var heroST = ScrollTrigger.create({
      trigger: hero,
      start: "top top",
      end: "bottom bottom",
      scrub: true,
      onUpdate: crossfade(null, layerInk, 0.85, 1)
    });

    /* ink -> drops, over the last stretch of "El problema" passing
       through the viewport (it's a normal min-height:100vh section, not
       a tall scroll-track, so "top bottom" to "bottom top" spans its
       entire time on screen) */
    var probST = ScrollTrigger.create({
      trigger: problema,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: crossfade(layerInk, layerDrops, probEnd, 1)
    });

    /* Decode budget: only videos that are (or are about to be) visible
       play. Toggled solely when the desired state flips — never per
       frame — and with lead time so nothing hitches on the way in. */
    /* progress of the problema trigger at which the last scene is resting
       (the pinned stretch ends); the ink->drops hand-over happens after it */
    function probEnd() { return 0.82; }
    var heroVideo = document.getElementById("heroVideo");
    var videoLayers = [layerInk, layerDrops, layerThreads, layerLight, layerMist, layerFil, layerDust, layerBoke, layerRise];
    function setPlaying(v, on) {
      /* the cached flag alone is not enough: releasing a layer pauses the
         element behind this function's back, so check what the element is
         really doing before deciding there is nothing to do */
      if (!v || (v._on === on && v.paused === !on)) return;
      v._on = on;
      if (on) {
        if (!v.getAttribute("src")) { window.ampSrc(v); return; }
        var pr = v.play(); if (pr && pr.catch) pr.catch(function () {});
      } else v.pause();
    }
    /* phones: exactly one video decodes — the one that is fully opaque */
    var phonePending = false;
    function phoneCheck() {
      if (phonePending) return;
      phonePending = true;
      requestAnimationFrame(function () {
        phonePending = false;
        /* whichever layer is the most visible right now is the one that plays;
           the one fading out freezes. There is always exactly one video
           decoding, and the image on screen never stops moving. */
        var inkOp = gsap.getProperty(videoLayers[0], "opacity");
        var heroOp = heroST.progress < 1 ? 1 - inkOp : 0;
        var vis = -1, best = heroOp, op, i;
        for (i = 0; i < videoLayers.length; i++) {
          op = gsap.getProperty(videoLayers[i], "opacity");
          if (op > best) { best = op; vis = i; }
        }
        for (i = 0; i < videoLayers.length; i++) setPlaying(videoLayers[i], i === vis);
        setPlaying(heroVideo, vis < 0 && heroOp > 0);
      });
    }
    function syncVideos() {
      var h = heroST.progress, p = probST.progress, i;
      var on = [
        h > 0.6 && p < 1,
        p > probEnd() - 0.08 && !!queST && queST.progress < 1 && (!qh || qh.state() !== "after"),
        !!queST && queST.progress > qhStart() - 0.12 && !!frST && frST.progress < 1,
        !!frST && frST.progress > frStart() - 0.12 && !!metST && metST.progress < 1,
        !!metST && metST.progress > metStart() - 0.12 && !!whoST && whoST.progress < 1,
        !!whoST && whoST.progress > whStart() - 0.12 && !!prST && prST.progress < 1,
        !!prST && prST.progress > pjStart() - 0.12 && !!clST && clST.progress < 1,
        !!clST && clST.progress > clStart() - 0.12 && !!faST && faST.progress < 1,
        !!faST && faST.progress > faStart() - 0.12
      ];
      var cur = -1;
      for (i = 0; i < on.length; i++) if (on[i]) cur = i;

      /* Phones decode ONE video at a time. During a hand-over the outgoing
         layer freezes on its current frame and the incoming one waits on its
         first frame until it is fully opaque — the crossfade still happens,
         but the phone never has to decode two full-screen videos at once
         (which is what made the transitions stutter). Because a frozen layer
         keeps showing the frame it stopped on, and a fresh one starts at 0,
         nothing jumps. */
      if (window.AMP_PHONE) {
        if (h < 1) window.ampSrc(heroVideo); else window.ampFree(heroVideo);
        /* decided on the next frame, once every hand-over has written its
           opacity for this frame — reading them earlier can catch a stale value
           and leave the visible layer frozen */
        phoneCheck();
      } else {
        if (h < 1) window.ampSrc(heroVideo); else window.ampFree(heroVideo);
        setPlaying(heroVideo, h < 1);
        for (i = 0; i < videoLayers.length; i++) setPlaying(videoLayers[i], on[i]);
      }
      /* loading budget: the current layer and its two neighbours stay in
         memory, everything else is released */
      if (cur < 0) window.ampSrc(videoLayers[0]);
      else for (i = 0; i < videoLayers.length; i++) {
        if (Math.abs(i - cur) <= 1) window.ampSrc(videoLayers[i]); else window.ampFree(videoLayers[i]);
      }
    }
    ScrollTrigger.addEventListener("scrollEnd", syncVideos);
    ScrollTrigger.create({ start: 0, end: "max", onUpdate: syncVideos });
    ScrollTrigger.addEventListener("refresh", syncVideos);

    /* Hand-overs between the backgrounds, in page order:
         drops -> wave   while "Frentes" arrives   (driven by slide 3's exit)
         wave  -> light  while "Roadmap" arrives   (driven by Frentes' exit)
         light -> mist   while "Quiénes somos" arrives (driven by Roadmap's exit)
         mist  -> black  as "Quiénes somos" leaves.
       Each one is a section leaving its own trigger: it starts at H/(H+vh),
       exactly when the next slide begins to enter, and reaches 1 exactly when
       that slide sits at the top - so the whole entrance IS the crossfade.
       Every handler only writes inside its own range and pins the resting
       values once on leaving it. */
    function handOver(section, fromLayer, toLayer) {
      var state = "before";
      var start = function () {
        var H = section.offsetHeight;
        return H / (H + window.innerHeight);
      };
      var st = ScrollTrigger.create({
        trigger: section,
        start: "top bottom",
        end: "bottom top",
        scrub: true,
        onUpdate: function (self) {
          var a = start(), p = self.progress;
          if (p <= a) {
            if (state !== "before") {
              state = "before";
              gsap.set(fromLayer, { autoAlpha: 1 });
              if (toLayer) gsap.set(toLayer, { autoAlpha: 0 });
            }
            return;
          }
          if (p >= 1) {
            if (state !== "after") {
              state = "after";
              gsap.set(fromLayer, { autoAlpha: 0 });
              if (toLayer) gsap.set(toLayer, { autoAlpha: 1 });
            }
            return;
          }
          state = "active";
          var t = (p - a) / (1 - a);
          gsap.set(fromLayer, { autoAlpha: 1 - t });
          if (toLayer) gsap.set(toLayer, { autoAlpha: t });
        }
      });
      return { st: st, start: start, state: function () { return state; } };
    }
    var qh = handOver(queHacemos, layerDrops, layerThreads);
    var fr = handOver(frentes, layerThreads, layerLight);
    var me = handOver(metodo, layerLight, layerMist);
    var wh = handOver(whoEl, layerMist, layerFil);
    var pj = handOver(projEl, layerFil, layerDust);
    var cl = handOver(clientsEl, layerDust, layerBoke);
    var fq = handOver(faqEl, layerBoke, layerRise);
    var queST = qh.st, frST = fr.st, metST = me.st, whoST = wh.st, prST = pj.st, clST = cl.st, faST = fq.st;
    var whStart = wh.start, pjStart = pj.start, clStart = cl.start, faStart = fq.start;
    var qhStart = qh.start, frStart = fr.start, metStart = me.start;

    /* ---- slide 2: text-side shade ----
       The shade belongs to slide 2 alone, so its opacity is an envelope
       over "El problema" passing through the viewport: it swells in while
       the ink arrives, holds while the slide is on screen (progress 0.5 =
       section top at viewport top, where the snap rests), and eases out
       before the ink hands over to the drops. It's a plain gradient with
       an opacity change — cheap, unlike the cursor "lantern" mask that
       used to sit on top and made the video stutter. */
    var shade = document.getElementById("bridgeShade");
    function smooth(a, b, x) {
      var t = Math.max(0, Math.min(1, (x - a) / (b - a)));
      return t * t * (3 - 2 * t);
    }
    ScrollTrigger.create({
      trigger: problema,
      start: "top bottom",
      end: "bottom top",
      scrub: true,
      onUpdate: function (self) {
        var p = self.progress;
        var env = smooth(0.05, 0.5, p) * (1 - smooth(0.62, 0.84, p));
        shade.style.opacity = env;
      }
    });
  })();

  /* ---------------- EL PROBLEMA ---------------- */
  /* One screen in normal page flow. The fan of cards has a life of its
     own: it turns by itself, forever, every 1.9s - completely independent
     of scrolling (nobody has to scroll five times to see five symptoms,
     and whoever stays simply watches them go by). The visitor can also
     click a card or swipe/drag to turn it. The loop only runs while the
     slide is on screen. */
  (function problemaSection() {
    var track = document.getElementById("problema");
    var heading = track.querySelector(".offer-heading");
    var statement = track.querySelector(".problem-statement");
    var meta = track.querySelector(".rotor-meta");
    var count = document.getElementById("rotorCount");
    var fan = document.getElementById("cardFan");
    var cards = Array.prototype.slice.call(fan.querySelectorAll(".fan-card"));
    var close = track.querySelector(".problem-close");
    var N = cards.length;
    var narrow = window.matchMedia("(max-width: 860px)");

    gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
    gsap.set(meta, { opacity: 0, y: 12 });
    gsap.set(close, { opacity: 0, y: 24 });

    var shown = -1;     /* card currently in front */
    var started = false;
    var onScreen = false;
    var autoT = null;

    /* fan geometry — the same knobs as the reference component
       (overlap, spread, per-card lift/scale) */
    function layout(active, forceDir) {
      var maxOff = narrow.matches ? 1 : 2;
      var W = cards[0].offsetWidth;
      var spacing = Math.max(10, W * (narrow.matches ? 0.6 : 0.5));
      var stepDeg = narrow.matches ? 7 : 9;
      cards.forEach(function (card, j) {
        var off = j - active;
        if (off > N / 2) off -= N; else if (off < -N / 2) off += N;
        var abs = Math.abs(off);
        var visible = abs <= maxOff;
        /* 3D: side cards tilt back (rotationX) and recede (z) under a
           shared perspective, like the reference fan */
        var to = {
          x: Math.round(off * spacing),
          y: Math.round(abs * abs * 5 - (off === 0 ? 10 : 0)),
          z: -abs * 110,
          rotation: off * stepDeg,
          rotationX: off === 0 ? 0 : 10,
          scale: off === 0 ? 1 : 0.97,
          opacity: visible ? (abs === 0 ? 1 : abs === 1 ? 0.96 : 0.85) : 0
        };
        card.style.zIndex = 100 - abs;
        card.classList.toggle("is-active", off === 0);
        var prev = card._off;
        card._off = off;

        /* GPU-promote the card only while it moves (smooth), then drop the
           layer and, for the card in front, the 3D perspective entirely:
           text on a layer with a fractional scale / perspective gets
           resampled and turns soft, so at rest the front card is a plain
           integer-pixel translate and stays razor sharp. */
        card.style.willChange = "transform, opacity";
        function settle() {
          card.style.willChange = "auto";
          if (off === 0) gsap.set(card, { transformPerspective: 0, force3D: false });
        }
        if (off !== 0) gsap.set(card, { transformPerspective: 1100 });

        if (prev === undefined) {           /* first time: the fan opens */
          gsap.set(card, { transformPerspective: 1100 });
          gsap.fromTo(card, { x: 0, y: 46, z: -160, rotation: 0, rotationX: 0, scale: 0.9, opacity: 0 },
            Object.assign({ duration: 1.1, ease: "expo.out", delay: 0.05 * abs, onComplete: settle }, to));
        } else if (Math.abs(off - prev) > maxOff) {   /* wrapped around */
          gsap.set(card, { transformPerspective: 1100, x: to.x, y: to.y + 30, z: to.z, rotation: to.rotation, rotationX: to.rotationX, scale: to.scale, opacity: 0 });
          gsap.to(card, { y: to.y, opacity: to.opacity, duration: 0.8, ease: "power3.out", delay: 0.2, overwrite: true, onComplete: settle });
        } else {
          gsap.to(card, Object.assign({ duration: 1.0, ease: "power3.out", overwrite: true, onComplete: settle }, to));
        }
      });
    }

    function show(i, forceDir) {
      if (i === shown) return;
      shown = i;
      count.textContent = "0" + (i + 1);
      layout(i, forceDir);
    }

    function auto() {
      if (started && onScreen) show((shown + 1) % N, 1);
      schedule();
    }
    function schedule() {
      clearTimeout(autoT);
      if (started && onScreen) autoT = setTimeout(auto, 1900);
    }

    /* click a card to bring it to the front; swipe / drag to turn */
    cards.forEach(function (card, j) {
      card.addEventListener("click", function () {
        if (fan._dragged) return;
        if (j !== shown) { show(j, j > shown ? 1 : -1); schedule(); }
      });
    });
    var px = null;
    fan.addEventListener("pointerdown", function (e) { px = e.clientX; fan._dragged = false; });
    window.addEventListener("pointerup", function (e) {
      if (px === null) return;
      var dx = e.clientX - px; px = null;
      if (Math.abs(dx) > 50) {
        fan._dragged = true;
        var dir = dx < 0 ? 1 : -1;
        show((shown + dir + N) % N, dir);
        schedule();
      }
    });

    /* run only while the slide is on screen */
    ScrollTrigger.create({
      trigger: track,
      start: "top 85%",
      end: "bottom 15%",
      onToggle: function (self) { onScreen = self.isActive; schedule(); }
    });

    var intro = gsap.timeline({
      scrollTrigger: { trigger: track, start: "top 60%", once: true }
    });
    intro.to(heading, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
      .to(heading, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.3)
      .add(revealWordsTween(statement, { duration: 1.1, stagger: 0.08, ease: "power4.out" }), 0.45)
      .to(meta, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.4)
      .add(function () { started = true; show(0); schedule(); }, 1.5)
      .to(close, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" }, 2.1);
  })();

  /* ---------------- QUÉ HACEMOS ---------------- */
  /* Everything lands together, once, as soon as the section is reached.
     Motion is opacity + transform only (compositor-friendly): no blur
     filters animated over the live video behind it. Each card rises, and
     its own title / lines / disciplines follow a beat behind so it reads
     as layered, not as a block sliding in. */
  (function offerSection() {
    var track = document.getElementById("que-hacemos");
    var steps = track.querySelectorAll(".offer-card");
    var sectionIndex = track.querySelector(".offer-heading");
    var closing = track.querySelector(".offer-closing");

    gsap.set(sectionIndex, { opacity: 0, y: 14, "--u": 0 });
    gsap.set(steps, { opacity: 0, y: 48 });
    steps.forEach(function (card) { gsap.set(card.children, { opacity: 0, y: 16 }); });
    gsap.set(closing, { opacity: 0, y: 22 });

    var tl = gsap.timeline({
      scrollTrigger: { trigger: track, start: "top 60%", once: true },
      defaults: { force3D: true }
    });
    tl.to(sectionIndex, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" })
      .to(sectionIndex, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.2);
    steps.forEach(function (card, i) {
      var at = 0.35 + i * 0.18;
      tl.to(card, { opacity: 1, y: 0, duration: 1.2, ease: "power3.out" }, at)
        .to(card.children, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "power3.out" }, at + 0.25);
    });
    tl.to(closing, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" }, 1.6);

    /* Spotlight: one light for all three cards. It follows the cursor; when
       there is no cursor (phones, or before the first mouse move / after the
       mouse leaves the window) it drifts across the cards on its own, so the
       effect is always alive. Only two custom properties per card are written,
       at most once per frame, and only while the section is on screen. */
    var px = -9999, py = -9999, usingPointer = false, active = false, pending = false;
    var reduceGlow = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    function paint() {
      pending = false;
      for (var i = 0; i < steps.length; i++) {
        var r = steps[i].getBoundingClientRect();
        steps[i].style.setProperty("--mx", (px - r.left).toFixed(1) + "px");
        steps[i].style.setProperty("--my", (py - r.top).toFixed(1) + "px");
      }
      track.style.setProperty("--xp", Math.max(0, Math.min(1, px / window.innerWidth)).toFixed(3));
    }
    function queue() { if (!pending) { pending = true; requestAnimationFrame(paint); } }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      usingPointer = true; px = e.clientX; py = e.clientY;
      if (active) queue();
    }, { passive: true });
    document.documentElement.addEventListener("mouseleave", function () { usingPointer = false; });
    window.addEventListener("scroll", function () { if (active && usingPointer) queue(); }, { passive: true });
    var paintedOnce = false;
    gsap.ticker.add(function (time) {
      if (!active || usingPointer || window.ampOff("glow")) return;
      if (window.AMP_PHONE) { if (paintedOnce) return; paintedOnce = true; }
        if (window.AMP_LITE && (gsap.ticker.frame & 1)) return;
      /* ambient drift across the cards */
      var r = track.getBoundingClientRect(), t = reduceGlow ? 0 : time;
      px = window.innerWidth * (0.5 + 0.42 * Math.sin(t * 0.45));
      py = r.top + r.height * (0.36 + 0.26 * (0.5 + 0.5 * Math.sin(t * 0.33 + 1.2)));
      paint();
    });
    ScrollTrigger.create({
      trigger: track, start: "top 90%", end: "bottom 10%",
      onToggle: function (self) { active = self.isActive; if (active) { paintedOnce = false; queue(); } }
    });
  })();

  /* ---------------- MÉTODO — the roadmap ---------------- */
  /* One screen, plays itself on arrival: four cards arrive one after the
     other and a dashed connector draws itself from each card to the next
     (lighting the next card's border as it lands). Afterwards the dashes
     keep flowing forward along the whole path for as long as the slide is
     on screen. Connectors are built from the real card positions. */
  (function roadmapSection() {
    var track = document.getElementById("metodo");
    var heading = track.querySelector(".offer-heading");
    var statement = track.querySelector(".roadmap-statement");
    var sub = document.getElementById("roadSub");
    var roadmap = document.getElementById("roadmap");
    var svg = document.getElementById("roadLinks");
    var steps = Array.prototype.slice.call(track.querySelectorAll(".road-step"));
    var loopNote = document.getElementById("roadLoop");
    var mobile = window.matchMedia("(max-width: 860px)");
    var NS = "http://www.w3.org/2000/svg";
    var masks = [], links = [], shown = 0;   /* shown = connectors already drawn */

    gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
    gsap.set(sub, { opacity: 0, y: 12 });
    gsap.set(loopNote, { opacity: 0, y: 14 });
    steps.forEach(function (st) {
      gsap.set(st, { opacity: 0, y: 46 });
      gsap.set(st.children, { opacity: 0, y: 12 });
    });

    function build() {
      if (mobile.matches) return;
      svg.innerHTML = "";
      masks = []; links = [];
      var defs = document.createElementNS(NS, "defs");
      svg.appendChild(defs);
      for (var i = 0; i < steps.length - 1; i++) {
        var a = steps[i], b = steps[i + 1];
        var x1 = a.offsetLeft + a.offsetWidth, y1 = a.offsetTop + a.offsetHeight / 2;
        var x2 = b.offsetLeft, y2 = b.offsetTop + b.offsetHeight / 2;
        var c = (x2 - x1) * 0.55;
        var d = "M" + x1 + " " + y1 + " C " + (x1 + c) + " " + y1 + ", " + (x2 - c) + " " + y2 + ", " + x2 + " " + y2;

        var mask = document.createElementNS(NS, "mask");
        mask.setAttribute("id", "roadMask" + i);
        mask.setAttribute("maskUnits", "userSpaceOnUse");
        mask.setAttribute("x", "-20"); mask.setAttribute("y", "-20");
        mask.setAttribute("width", roadmap.offsetWidth + 40); mask.setAttribute("height", roadmap.offsetHeight + 40);
        var reveal = document.createElementNS(NS, "path");
        reveal.setAttribute("d", d);
        reveal.setAttribute("fill", "none");
        reveal.setAttribute("stroke", "#fff");
        reveal.setAttribute("stroke-width", "8");
        var len = reveal.getTotalLength ? reveal.getTotalLength() : 200;
        reveal.style.strokeDasharray = len;
        reveal.style.strokeDashoffset = i < shown ? 0 : len;
        mask.appendChild(reveal);
        defs.appendChild(mask);

        var path = document.createElementNS(NS, "path");
        path.setAttribute("d", d);
        path.setAttribute("class", "road-link");
        path.setAttribute("mask", "url(#roadMask" + i + ")");
        svg.appendChild(path);
        masks.push({ el: reveal, len: len });
        links.push(path);
      }
    }
    build();
    ScrollTrigger.addEventListener("refresh", build);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(build);

    /* fast entrance (about 2s end to end): the visitor should never wait for
       the slide to finish drawing itself, and it starts as soon as the
       slide begins to enter rather than when it is mostly on screen */
    var T0 = 0.45, GAP = 0.26;
    var tl = gsap.timeline({ scrollTrigger: { trigger: track, start: "top 78%", once: true } });
    tl.to(heading, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0)
      .to(heading, { "--u": 1, duration: 0.6, ease: "power3.inOut" }, 0.1)
      .add(revealWordsTween(statement, { duration: 0.7, stagger: 0.05, ease: "power4.out" }), 0.1)
      .to(sub, { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }, 0.4);
    steps.forEach(function (st, i) {
      var t = T0 + i * GAP;
      tl.to(st, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, t)
        .to(st.children, { opacity: 1, y: 0, duration: 0.45, stagger: 0.05, ease: "power3.out" }, t + 0.12)
        .add(function () { st.classList.add("is-lit"); }, t + 0.25);
      if (i < steps.length - 1) {
        tl.add(function () {
          var m = masks[i];
          if (!m) return;
          gsap.to(m.el, { strokeDashoffset: 0, duration: 0.4, ease: "power2.inOut", onComplete: function () { shown = Math.max(shown, i + 1); } });
        }, t + 0.3);
      }
    });
    tl.to(loopNote, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, T0 + steps.length * GAP);

    /* the dashes only flow while the slide is on screen */
    ScrollTrigger.create({
      trigger: track, start: "top 85%", end: "bottom 15%",
      onToggle: function (self) { track.classList.toggle("is-live", self.isActive); }
    });
  })();

  /* ---------------- FRENTES — six panels ---------------- */
  /* One screen. The six fronts are tall panels side by side: one is open
     (title + what we do there), the other five stay narrow. The open one
     changes by itself every 3.4s while the slide is on screen; hovering,
     focusing or tapping a panel opens it and holds the rotation there
     (it resumes a few seconds after the pointer leaves). */
  (function frontsSection() {
    var track = document.getElementById("frentes");
    if (!track) return;
    var heading = track.querySelector(".offer-heading");
    var statement = track.querySelector(".fronts-statement");
    var sub = document.getElementById("frontsSub");
    var row = document.getElementById("frontsRow");
    var panels = Array.prototype.slice.call(row.querySelectorAll(".front"));
    var N = panels.length;

    gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
    gsap.set(sub, { opacity: 0, y: 12 });
    gsap.set(panels, { opacity: 0, y: 46 });

    var current = -1, started = false, onScreen = false, held = false, timer = null;

    function show(i) {
      if (i === current) return;
      current = i;
      panels.forEach(function (p, k) { p.classList.toggle("is-active", k === i); });
    }
    function schedule() {
      clearTimeout(timer);
      /* On a phone the panels are stacked and open by growing: animating a
         height re-lays out everything below it, and doing that on a loop
         every few seconds is what made this section drag. Here it opens on
         a tap instead, so the page only reflows when somebody asks it to. */
      if (window.AMP_PHONE) return;
      if (started && onScreen && !held) timer = setTimeout(function () { show((current + 1) % N); schedule(); }, 3400);
    }
    function pick(i) { if (!started) return; held = true; clearTimeout(timer); show(i); }
    function release() { held = false; clearTimeout(timer); timer = setTimeout(schedule, 2400); }

    panels.forEach(function (p, i) {
      p.addEventListener("mouseenter", function () { pick(i); });
      p.addEventListener("focus", function () { pick(i); });
      p.addEventListener("click", function () { pick(i); });
      p.addEventListener("keydown", function (e) { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick(i); } });
    });
    row.addEventListener("mouseleave", release);
    row.addEventListener("focusout", function (e) { if (!row.contains(e.relatedTarget)) release(); });

    var tl = gsap.timeline({ scrollTrigger: { trigger: track, start: "top 60%", once: true } });
    tl.to(heading, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
      .to(heading, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.3)
      .add(revealWordsTween(statement, { duration: 1.1, stagger: 0.08, ease: "power4.out" }), 0.45)
      .to(sub, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.2)
      .to(panels, { opacity: 1, y: 0, duration: 1.0, stagger: 0.1, ease: "power3.out" }, 1.4)
      .add(function () { started = true; show(0); schedule(); }, 2.2);

    ScrollTrigger.create({
      trigger: track, start: "top 85%", end: "bottom 15%",
      onToggle: function (self) { onScreen = self.isActive; schedule(); }
    });
  })();

  /* ---------------- QUIÉNES SOMOS ---------------- */
  /* One screen. A big joint portrait fills the stage (its edges dissolve
     into the black); a "+" on each person opens their story in a panel
     that covers the stage (Esc or the x closes it). On phones the two
     portraits are separate cards with a "+" and the panel is full screen. */
  (function whoSection() {
    var track = document.getElementById("consultora");
    if (!track) return;
    var PEOPLE = [
      { tag: "Procesos", name: "Andriy Trofymenko", role: "Ingeniero industrial · Optimización de procesos · Mejora continua",
        img: "Imagenes%20usadas/who-andriy.jpg",
        intro: "Especializado en la gestión estratégica de proyectos y la excelencia operativa. Combina rigurosidad técnica y visión integral para transformar procesos, reducir costos y maximizar la productividad, con formación en Industria 4.0.",
        labelA: "Proyectos", listA: ["Cadena de valor del cáñamo", "Capacitación corporativa", "Planta de polietileno", "Reestructuración de layout", "Optimización clínica", "Herramientas de gestión"],
        labelB: "Trabajó con", textB: "Medisur · SS Servicios · MS Patagonia · Aeropuertos Argentina" },
      { tag: "Personas", name: "Christian Pollavini", role: "Coach empresarial · Desarrollo organizacional y comercial",
        img: "Imagenes%20usadas/who-christian.jpg",
        intro: "Coach empresarial especializado en desarrollo organizacional y comercial. Trabaja con líderes y equipos para que los cambios de proceso se sostengan en las personas que los llevan adelante.",
        labelA: "Áreas de trabajo", listA: ["Coaching organizacional", "Liderazgo", "Cohesión de equipos", "Entrenamiento de equipos comerciales", "Estrategia de venta", "Manejo de objeciones y cierre"],
        labelB: "", textB: "" }
    ];
    var heading = track.querySelector(".offer-heading");
    var statement = track.querySelector(".who-statement");
    var close = document.getElementById("whoClose");
    var hots = Array.prototype.slice.call(track.querySelectorAll(".who-hot"));
    var cards = track.querySelectorAll(".who-card");
    var detail = document.getElementById("whoDetail");
    var xBtn = document.getElementById("whoX");
    var isPhone = window.matchMedia("(max-width: 860px)");

    gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
    gsap.set(close, { opacity: 0, y: 14 });
    gsap.set(hots, { opacity: 0, scale: 0.6 });
    gsap.set(cards, { opacity: 0, y: 40 });

    var tl = gsap.timeline({ scrollTrigger: { trigger: track, start: "top 60%", once: true } });
    tl.to(heading, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
      .to(heading, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.3)
      .add(revealWordsTween(statement, { duration: 1.1, stagger: 0.08, ease: "power4.out" }), 0.45)
      .to(close, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 1.2)
      .to(hots, { opacity: 1, scale: 1, duration: 0.7, stagger: 0.18, ease: "back.out(2.2)" }, 2.0)
      .to(cards, { opacity: 1, y: 0, duration: 1.0, stagger: 0.2, ease: "power3.out" }, 1.0);

    /* directional hover reveal (mouse devices on desktop only) */
    if (window.matchMedia("(hover: hover) and (min-width: 861px)").matches) {
      var CLOSED = {
        left: "inset(0% 100% 0% 0%)",   /* opens from the left edge */
        right: "inset(0% 0% 0% 100%)",
        top: "inset(0% 0% 100% 0%)",
        bottom: "inset(100% 0% 0% 0%)"
      };
      var OPEN = "inset(0% 0% 0% 0%)";
      var edgeOf = function (e, el) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        return Math.abs(dx) > Math.abs(dy) ? (dx < 0 ? "left" : "right") : (dy < 0 ? "top" : "bottom");
      };
      cards.forEach(function (card) {
        var color = card.querySelector(".who-img-color");
        if (!color) return;
        card.addEventListener("mouseenter", function (e) {
          gsap.fromTo(color, { clipPath: CLOSED[edgeOf(e, card)] }, { clipPath: OPEN, duration: 0.8, ease: "power3.out", overwrite: true });
        });
        card.addEventListener("mouseleave", function (e) {
          /* it collapses towards the edge the pointer leaves through */
          var edge = edgeOf(e, card);
          var toward = { left: CLOSED.right, right: CLOSED.left, top: CLOSED.bottom, bottom: CLOSED.top }[edge];
          gsap.to(color, { clipPath: toward, duration: 0.7, ease: "power3.inOut", overwrite: true });
        });
      });
    }

    function open(i) {
      var d = PEOPLE[i];
      document.getElementById("wdImg").src = d.img;
      document.getElementById("wdImg").alt = d.name;
      document.getElementById("wdTag").textContent = d.tag;
      document.getElementById("wdName").textContent = d.name;
      document.getElementById("wdRole").textContent = d.role;
      document.getElementById("wdIntro").textContent = d.intro;
      document.getElementById("wdLabelA").textContent = d.labelA;
      var ul = document.getElementById("wdListA");
      ul.innerHTML = "";
      d.listA.forEach(function (t) { var li = document.createElement("li"); li.textContent = t; ul.appendChild(li); });
      var bB = document.getElementById("wdBlockB");
      bB.hidden = !d.textB;
      document.getElementById("wdLabelB").textContent = d.labelB;
      document.getElementById("wdTextB").textContent = d.textB;
      detail.hidden = false;
      document.documentElement.classList.add("has-panel");
      var body = detail.querySelectorAll(".wd-tag, h3, .wd-role, .wd-intro, .wd-block:not([hidden])");
      gsap.fromTo(detail, { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 0.55, ease: "power3.out", overwrite: true });
      gsap.fromTo(detail.querySelector(".wd-photo img"), { scale: 1.12 }, { scale: 1, duration: 1.4, ease: "power2.out", overwrite: true });
      gsap.fromTo(body, { opacity: 0, y: 14 }, { opacity: 1, y: 0, duration: 0.7, stagger: 0.07, delay: 0.15, ease: "power3.out", overwrite: true });
      if (lenis && isPhone.matches) lenis.stop();
      xBtn.focus({ preventScroll: true });
    }
    function shut() {
      document.documentElement.classList.remove("has-panel");
      if (detail.hidden) return;
      gsap.to(detail, { opacity: 0, y: 16, duration: 0.3, ease: "power2.in", overwrite: true, onComplete: function () { detail.hidden = true; } });
      if (lenis) lenis.start();
    }
    hots.forEach(function (h) { h.addEventListener("click", function () { open(+h.getAttribute("data-who")); }); });
    xBtn.addEventListener("click", shut);
    document.addEventListener("keydown", function (e) { if (e.key === "Escape") shut(); });

    ScrollTrigger.create({
      trigger: track, start: "top 85%", end: "bottom 15%",
      onToggle: function (self) { track.classList.toggle("is-live", self.isActive); if (!self.isActive) shut(); }
    });
  })();

  /* ---------------- Generic reveal for non-track sections ---------------- */
  document.querySelectorAll(".section-about .statement-md, .section-contact .statement-md").forEach(function (el) {
    ScrollTrigger.create({
      trigger: el,
      start: "top 78%",
      onEnter: function () { revealWordsTween(el); },
      once: true
    });
  });

  document.querySelectorAll(".reveal-fade").forEach(function (el) {
    gsap.to(el, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power2.out",
      scrollTrigger: { trigger: el, start: "top 82%", once: true }
    });
  });

  /* ---------------- Header: highlight the slide you are on ---------------- */
  (function navSpy() {
    document.querySelectorAll(".main-nav a[href^='#']").forEach(function (link) {
      var target = document.getElementById(link.getAttribute("href").slice(1));
      if (!target) return;
      ScrollTrigger.create({
        trigger: target,
        start: "top 55%",
        end: "bottom 55%",
        onToggle: function (self) { link.classList.toggle("is-current", self.isActive); }
      });
    });
  })();

  /* ---------------- EMPRESAS / FAQ / CONTACTO / WHATSAPP ---------------- */
  (function sellingBlocks() {
    var WA = "5491133278023";
    var EMAIL = "andriytrofymenko@gmail.com";

    /* companies: a 3D ring of cards (empty placeholders until logos are added).
       Same mechanics as the reference carousel - a cylinder of faces seen in
       perspective, drag to rotate with inertia, click a face to bring it to
       the front - plus a slow turn of its own while it is on screen. Driven by
       one rAF (gsap ticker) that only writes transforms/opacity. */
    (function trust() {
      var sec = document.getElementById("clientes");
      var stage = document.getElementById("c3dStage");
      var ring = document.getElementById("c3dRing");
      if (!sec || !stage || !ring) return;
      var cards = Array.prototype.slice.call(ring.querySelectorAll(".c3d-card"));
      var hint = document.getElementById("c3dHint");
      var heading = sec.querySelector(".offer-heading");
      var N = cards.length;
      if (!N) return;
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      cards.forEach(function (c) { if (c.querySelector("img")) c.classList.add("has-logo"); });

      /* the reverse of each card: same box, turned to face inwards, so when a
         card swings round the back of the ring is a designed surface, not a void */
      var MARK = '<svg viewBox="0 0 140 165" aria-hidden="true"><polygon class="cb-bar" points="15,100 35,100 39,57 19,57"/><polygon class="cb-bar" points="46,116 66,116 70,42 50,42"/><polygon class="cb-bar" points="75,125 95,125 99,35 79,35"/><polygon class="cb-bar" points="108,159 128,159 132,8 112,8"/><polygon class="cb-stripe" points="15,102 15,72 105,48 105,78"/></svg>';
      var backs = cards.map(function (c) {
        var b = document.createElement("div");
        b.className = "c3d-back";
        b.setAttribute("aria-hidden", "true");
        b.innerHTML = MARK;
        ring.appendChild(b);
        return b;
      });

      var STEP = 360 / N, R = 400;
      /* it always turns by itself: about 14 deg/s (one card every ~2s, a full
         turn in ~26s); a gentler 8 deg/s when the system asks for reduced motion */
      var rot = 0, vel = 0, CRUISE = reduce ? 8 : 14;     /* degrees / second */
      var dragging = false, hovering = false, tweening = false, running = false, moved = 0;
      var lastX = 0, lastT = 0, dragVel = 0;

      function layout() {
        var w = cards[0].offsetWidth || 260;
        R = (w / 2) / Math.tan(Math.PI / N) * 1.16;       /* faces do not touch */
        cards.forEach(function (c, i) {
          c.style.transform = "rotateY(" + (i * STEP) + "deg) translateZ(" + R.toFixed(1) + "px)";
          backs[i].style.transform = "rotateY(" + (i * STEP) + "deg) translateZ(" + (R - 1).toFixed(1) + "px) rotateY(180deg)";
        });
        apply();
      }

      function apply() {
        /* a slight look-down tilt so the far side of the ring rises above the near
           side and the whole cylinder reads in 3D */
        ring.style.transform = "rotateX(-9deg) translateZ(" + (-R).toFixed(1) + "px) rotateY(" + rot.toFixed(3) + "deg)";
        for (var i = 0; i < N; i++) {
          var a = ((i * STEP + rot) % 360 + 540) % 360 - 180;       /* -180..180, 0 = facing us */
          var c = Math.cos(a * Math.PI / 180);
          var o = (0.36 + 0.64 * Math.pow((c + 1) / 2, 1.15)).toFixed(3);   /* far cards stay clearly visible */
          cards[i].style.opacity = o;
          backs[i].style.opacity = o;
          cards[i].classList.toggle("is-front", c > 0.985);
        }
      }

      var tickAccum = 0;
      function tick(time, deltaMs) {
        if (!running || tweening) return;
        tickAccum += deltaMs || 16;
        /* 24 faces re-styled every frame is a lot for a phone; at half rate the
           ring still turns at exactly the same speed (the skipped time is kept) */
        if (window.AMP_PHONE && (gsap.ticker.frame & 1)) return;
        var dt = Math.min(0.1, tickAccum / 1000); tickAccum = 0;
        if (dragging) {
          /* nothing: rot is set by the pointer */
        } else {
          /* never stops: after a drag / click it eases back to its own cruise speed */
          vel += (CRUISE - vel) * (1 - Math.exp(-dt * 1.7));
          rot += vel * dt;
        }
        apply();
      }

      /* drag with inertia */
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
        moved += Math.abs(dx);
        rot += dx * 0.28;
        dragVel = dragVel * 0.6 + (dx * 0.28 / dtm * 1000) * 0.4;   /* deg / s, smoothed */
        lastX = e.clientX; lastT = now;
        apply();                                                     /* follow the pointer this very frame */
      });
      function release() {
        if (!dragging) return;
        dragging = false;
        stage.classList.remove("is-dragging");
        vel = Math.max(-260, Math.min(260, dragVel));               /* keeps spinning, then eases back to cruise */
      }
      stage.addEventListener("pointerup", release);
      stage.addEventListener("pointercancel", release);
      stage.addEventListener("mouseenter", function () { hovering = true; });
      stage.addEventListener("mouseleave", function () { hovering = false; });

      /* click a face: bring it to the front (and open it when it has a logo) */
      function bringToFront(i, done) {
        var target = -i * STEP;
        var delta = ((target - rot) % 360 + 540) % 360 - 180;       /* shortest way round */
        tweening = true; vel = 0;
        var o = { r: rot };
        gsap.to(o, { r: rot + delta, duration: 1.1, ease: "power3.inOut",
          onUpdate: function () { rot = o.r; apply(); },
          onComplete: function () { tweening = false; if (done) done(); } });
      }
      var modal = document.getElementById("c3dModal");
      function openModal(card) {
        var img = card.querySelector("img");
        document.getElementById("c3dModalLogo").innerHTML = "";
        if (img) document.getElementById("c3dModalLogo").appendChild(img.cloneNode());
        document.getElementById("c3dModalName").textContent = card.getAttribute("data-name") || "";
        document.getElementById("c3dModalDesc").textContent = card.getAttribute("data-desc") || "";
        modal.hidden = false;
        document.documentElement.classList.add("has-panel");
        gsap.fromTo(modal.querySelector(".c3d-modal-card"), { opacity: 0, y: 30, scale: 0.96 }, { opacity: 1, y: 0, scale: 1, duration: 0.5, ease: "power3.out" });
        gsap.fromTo(modal, { opacity: 0 }, { opacity: 1, duration: 0.35 });
      }
      function closeModal() {
        document.documentElement.classList.remove("has-panel");
        if (modal.hidden) return;
        gsap.to(modal, { opacity: 0, duration: 0.3, onComplete: function () { modal.hidden = true; } });
      }
      cards.forEach(function (card, i) {
        card.addEventListener("click", function () {
          if (moved > 6) return;                                     /* it was a drag */
          bringToFront(i, card.classList.contains("has-logo") ? function () { openModal(card); } : null);
        });
      });
      document.getElementById("c3dModalX").addEventListener("click", closeModal);
      modal.addEventListener("click", function (e) { if (e.target === modal) closeModal(); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") closeModal(); });

      /* run only while the section is on screen */
      gsap.ticker.add(tick);
      ScrollTrigger.create({
        trigger: sec, start: "top 90%", end: "bottom 10%",
        onToggle: function (self) {
          running = self.isActive;
          stage.classList.toggle("is-off", !self.isActive);
          if (!running) closeModal();
        }
      });
      onResize(layout);
      ScrollTrigger.addEventListener("refresh", layout);
      layout();

      /* entrance: the ring swings in from the side while the stage fades up
         (auto-turn is held until it lands so the two never fight) */
      gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
      gsap.set(stage, { opacity: 0, y: 40 });
      var spin = { r: -70 };
      rot = spin.r; tweening = true; apply();
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 78%", once: true } })
        .to(heading, { opacity: 1, y: 0, duration: 0.5, ease: "power3.out" }, 0)
        .to(heading, { "--u": 1, duration: 0.6, ease: "power3.inOut" }, 0.1)
        .to(stage, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
        .to(spin, { r: 0, duration: 1.4, ease: "power3.out",
          onUpdate: function () { rot = spin.r; apply(); },
          onComplete: function () { tweening = false; } }, 0.1);
    })();

    /* Proyectos: reveal + the same cursor light as the capability cards
       (drifts on its own on touch screens), only while on screen */
    (function projects() {
      var sec = document.getElementById("proyectos");
      if (!sec) return;
      var heading = sec.querySelector(".offer-heading"), statement = sec.querySelector(".proj-statement");
      var cards = Array.prototype.slice.call(sec.querySelectorAll(".proj-card"));
      var grid = document.getElementById("projGrid");
      gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 65%", once: true } })
        .to(heading, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
        .to(heading, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.3)
        .add(revealWordsTween(statement, { duration: 1.1, stagger: 0.08, ease: "power4.out" }), 0.45)
        .to(cards, { opacity: 1, y: 0, duration: 0.9, stagger: 0.14, ease: "power3.out" }, 0.8);

      var px = -9999, py = -9999, usingPointer = false, active = false, pending = false;
      var still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      function paint() {
        pending = false;
        for (var i = 0; i < cards.length; i++) {
          var r = cards[i].getBoundingClientRect();
          cards[i].style.setProperty("--mx", (px - r.left).toFixed(1) + "px");
          cards[i].style.setProperty("--my", (py - r.top).toFixed(1) + "px");
        }
        grid.style.setProperty("--xp", Math.max(0, Math.min(1, px / window.innerWidth)).toFixed(3));
      }
      function queue() { if (!pending) { pending = true; requestAnimationFrame(paint); } }
      document.addEventListener("pointermove", function (e) {
        if (e.pointerType === "touch") return;
        usingPointer = true; px = e.clientX; py = e.clientY;
        if (active) queue();
      }, { passive: true });
      document.documentElement.addEventListener("mouseleave", function () { usingPointer = false; });
      window.addEventListener("scroll", function () { if (active && usingPointer) queue(); }, { passive: true });
      var paintedOnce = false;
      gsap.ticker.add(function (time) {
        if (!active || usingPointer || window.ampOff("glow")) return;
        if (window.AMP_PHONE) { if (paintedOnce) return; paintedOnce = true; }
        if (window.AMP_LITE && (gsap.ticker.frame & 1)) return;
        var r = grid.getBoundingClientRect(), t = still ? 0 : time;
        px = window.innerWidth * (0.5 + 0.4 * Math.sin(t * 0.4 + 0.8));
        py = r.top + r.height * (0.34 + 0.3 * (0.5 + 0.5 * Math.sin(t * 0.3 + 2)));
        paint();
      });
      ScrollTrigger.create({
        trigger: grid, start: "top 92%", end: "bottom 8%",
        onToggle: function (self) { active = self.isActive; if (active) { paintedOnce = false; queue(); } }
      });
    })();

    /* Frentes: the collapsed names run up the panels on ONE line each, all at
       the same size - the largest at which the longest name still fits. */
    (function frontTitles() {
      var row = document.querySelector(".fronts-row");
      if (!row) return;
      var fronts = Array.prototype.slice.call(row.querySelectorAll(".front"));
      function fit() {
        if (window.innerWidth <= 860) { row.style.removeProperty("--vt"); return; }
        var f0 = fronts[0], H = f0.clientHeight, i, longest = 0;
        var num = f0.querySelector(".front-num");
        var top = num.offsetTop + num.offsetHeight + 14;
        var bottom = parseFloat(getComputedStyle(f0.querySelector(".front-vtitle")).bottom) || 24;
        var avail = H - top - bottom;
        var probe = fronts[0].querySelector(".front-vtitle");
        var saved = probe.style.cssText;
        for (i = 0; i < fronts.length; i++) {
          var t = fronts[i].querySelector(".front-vtitle");
          t.style.fontSize = "100px";
          longest = Math.max(longest, t.getBoundingClientRect().height);
          t.style.fontSize = "";
        }
        probe.style.cssText = saved;
        if (!longest || avail <= 0) return;
        var gap = parseFloat(getComputedStyle(row).columnGap) || 10;
        var narrow = (row.clientWidth - gap * (fronts.length - 1)) / (fronts.length - 1 + 5.4);
        var size = Math.min(avail / longest * 100, (narrow - 16) / 1.12, 56);
        row.style.setProperty("--vt", Math.max(13, size).toFixed(1) + "px");
      }
      fit();
      onResize(fit);
      window.addEventListener("load", fit);
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(fit);
      ScrollTrigger.addEventListener("refresh", fit);
    })();

    /* FAQ: one answer open at a time */
    (function faq() {
      var sec = document.getElementById("faq");
      if (!sec) return;
      var heading = sec.querySelector(".offer-heading"), statement = sec.querySelector(".faq-statement"), sub = document.getElementById("faqSub");
      var items = Array.prototype.slice.call(sec.querySelectorAll(".faq-item"));
      gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
      gsap.set(sub, { opacity: 0, y: 12 });
      gsap.set(items, { opacity: 0, y: 30 });
      function toggle(it, open) {
        it.classList.toggle("is-open", open);
        it.querySelector(".faq-q").setAttribute("aria-expanded", open ? "true" : "false");
      }
      items.forEach(function (it) {
        it.querySelector(".faq-q").addEventListener("click", function () {
          var willOpen = !it.classList.contains("is-open");
          items.forEach(function (o) { toggle(o, false); });
          if (willOpen) toggle(it, true);
        });
      });
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 65%", once: true } })
        .to(heading, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
        .to(heading, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.3)
        .add(revealWordsTween(statement, { duration: 1.1, stagger: 0.08, ease: "power4.out" }), 0.45)
        .to(sub, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 1.2)
        .to(items, { opacity: 1, y: 0, duration: 0.9, stagger: 0.09, ease: "power3.out" }, 0.9);
    })();

    /* contact: arrival + the form (no backend: it opens WhatsApp / the mail app
       with the message already written) */
    (function contact() {
      var sec = document.getElementById("contacto");
      if (!sec) return;
      var heading = sec.querySelector(".offer-heading"), statement = sec.querySelector(".contact-statement");
      var sub = document.getElementById("contactSub"), steps = sec.querySelectorAll(".contact-steps li");
      var direct = document.getElementById("contactDirect"), form = document.getElementById("contactForm");
      gsap.set(heading, { opacity: 0, y: 14, "--u": 0 });
      gsap.set(sub, { opacity: 0, y: 14 });
      gsap.set(steps, { opacity: 0, x: -16 });
      gsap.set(direct, { opacity: 0, y: 14 });
      gsap.set(form, { opacity: 0, y: 44 });
      gsap.timeline({ scrollTrigger: { trigger: sec, start: "top 62%", once: true } })
        .to(heading, { opacity: 1, y: 0, duration: 0.8, ease: "power3.out" }, 0.1)
        .to(heading, { "--u": 1, duration: 0.9, ease: "power3.inOut" }, 0.3)
        .add(revealWordsTween(statement, { duration: 1.1, stagger: 0.08, ease: "power4.out" }), 0.45)
        .to(sub, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 1.2)
        .to(steps, { opacity: 1, x: 0, duration: 0.8, stagger: 0.14, ease: "power3.out" }, 1.5)
        .to(direct, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out" }, 2.1)
        .to(form, { opacity: 1, y: 0, duration: 1.1, ease: "power3.out" }, 0.9);

      var note = document.getElementById("cfNote");
      function values() {
        var f = new FormData(form);
        return { name: (f.get("name") || "").trim(), email: (f.get("email") || "").trim(), company: (f.get("company") || "").trim(), challenge: (f.get("challenge") || "").trim() };
      }
      function valid(v) {
        var ok = true;
        form.querySelectorAll(".cf-field").forEach(function (el) { el.classList.remove("is-error"); });
        function bad(name) { ok = false; form.querySelector('[name="' + name + '"]').closest(".cf-field").classList.add("is-error"); }
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
        var v = values();
        if (!valid(v)) return;
        window.open("https://wa.me/" + WA + "?text=" + encodeURIComponent(message(v)), "_blank", "noopener");
        note.classList.remove("is-error");
        note.textContent = "Se abrió WhatsApp con tu mensaje listo. ¡Gracias!";
      });
      document.getElementById("cfMail").addEventListener("click", function () {
        var v = values();
        if (!valid(v)) return;
        window.location.href = "mailto:" + EMAIL + "?subject=" + encodeURIComponent("Diagnóstico Amplifia") + "&body=" + encodeURIComponent(message(v));
        note.classList.remove("is-error");
        note.textContent = "Se abrió tu correo con el mensaje listo.";
      });
    })();

    /* WhatsApp button: appears once you leave the hero */
    (function whatsapp() {
      var btn = document.getElementById("waFloat");
      var hero = document.getElementById("hero");
      if (!btn || !hero) return;
      ScrollTrigger.create({
        trigger: hero, start: "bottom 60%", end: "max",
        onToggle: function (self) {
          btn.classList.toggle("is-on", self.isActive);
          var soc = document.getElementById("social");
          if (soc) soc.classList.toggle("is-on", self.isActive);
        }
      });
    })();
    /* Assistant orb (no AI connected yet): appears after the hero, follows the
       cursor with its highlight, and greets each section once with a short
       line. Tap/click opens a small panel. */
    (function assistant() {
      var orb = document.getElementById("orb");
      var hero = document.getElementById("hero");
      if (!orb || !hero) return;
      var btn = document.getElementById("orbBtn"), bubble = document.getElementById("orbBubble");
      var shine = orb.querySelector(".orb-shine"), timer = 0, talkTimer = 0, seen = {};
      var LINES = {
        problema: "Hola, soy Ampli. \u00bfTe suena alguno de estos problemas?",
        "que-hacemos": "Tres capacidades, un mismo objetivo: que tu negocio crezca.",
        frentes: "Eleg\u00ed el frente por el que quer\u00e9s empezar.",
        metodo: "Diagn\u00f3stico, dise\u00f1o y acci\u00f3n: as\u00ed trabajamos.",
        consultora: "Ellos son Andriy y Christian, mis jefes.",
        proyectos: "El primer proyecto ya se hizo. El siguiente est\u00e1 en camino.",
        clientes: "Empresas que ya conf\u00edan en nosotros.",
        faq: "\u00bfAlguna duda? Soy Ampli: probablemente est\u00e9 ac\u00e1.",
        contacto: "Contanos tu caso y te respondemos r\u00e1pido. Yo te espero, Ampli."
      };
      /* Roaming: the orb is not parked. Each section sends it to a different
         spot along the screen edges (kept clear of the WhatsApp button and of
         the centre of the content), it travels there on a soft spring with a
         jelly stretch along its movement, keeps drifting a little while idle,
         and is nudged by the scroll speed. */
      var goo = orb.querySelector(".orb-goo"), halo = orb.querySelector(".orb-halo");
      var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      var ox = 0, oy = 0, vx = 0, vy = 0, tx = 0, ty = 0, spots = {}, lastY = window.scrollY, side = false;
      function measure() {
        var vw = window.innerWidth, vh = window.innerHeight, small = vw <= 860;
        var o = small ? 56 : 64, left0 = parseFloat(getComputedStyle(orb).left) || 16;
        var freeW = Math.max(0, vw - 2 * left0 - o);
        var up = Math.max(0, Math.min(vh * 0.6, vh - 380));
        var rightY = Math.min(up, Math.max(small ? 100 : 190, up * 0.5));
        /* on phones the text fills the width, so it roams only along the bottom band */
        var home = { x: 0, y: 0 }, lmid = { x: 0, y: up * (small ? 0.12 : 0.45) }, lhigh = { x: 0, y: up * (small ? 0.24 : 0.85) };
        var low = { x: freeW * (small ? 0.4 : 0.08), y: 0 }, rmid = { x: freeW, y: rightY };
        spots = { hero: home, home: home, problema: lmid, "que-hacemos": rmid, frentes: low, metodo: lhigh, consultora: rmid, proyectos: lhigh, clientes: lmid, faq: low, contacto: home };
        return { left0: left0, o: o, vw: vw, freeW: freeW, up: up };
      }
      var geo = measure(), spot = "home", phoneScrolling = false, scrollIdle = 0;
      if (window.AMP_PHONE) {
        window.addEventListener("scroll", function () {
          phoneScrolling = true;
          clearTimeout(scrollIdle);
          scrollIdle = setTimeout(function () { phoneScrolling = false; }, 220);
        }, { passive: true });
      }
      function go(id) { spot = spots[id] ? id : "home"; tx = spots[spot].x; ty = spots[spot].y; if (reduce) { ox = tx; oy = ty; } }
      /* WebGL body: one tiny fragment shader draws the liquid (a morphing
         blob + three droplets fused with a smooth union, shaded like a lit
         sphere), so all the motion runs on the GPU instead of repainting a
         filtered DOM tree every frame. If WebGL is not available the CSS
         version above stays in place. */
      var gl = null, glU = {}, glCanvas = null;
      (function initGL() {
        try {
          glCanvas = document.createElement("canvas");
          glCanvas.className = "orb-gl-canvas";
          glCanvas.setAttribute("aria-hidden", "true");
          var ctx = glCanvas.getContext("webgl", { alpha: true, premultipliedAlpha: true, antialias: false, powerPreference: "low-power" });
          if (!ctx) return;
          var vs = "attribute vec2 a;void main(){gl_Position=vec4(a,0.,1.);}";
          var fs = [
            "precision mediump float;",
            "uniform vec2 uRes,uVel,uLook;uniform float uTime,uK,uTalk;",
            "float smin(float a,float b,float k){float h=max(k-abs(a-b),0.)/k;return min(a,b)-h*h*k*.25;}",
            "float map(vec2 p){",
            "  float sp=length(uVel);",
            "  if(sp>.0001){vec2 d=uVel/sp;float al=dot(p,d);vec2 pe=p-d*al;p=d*(al/(1.+uK))+pe/(1.-.7*uK);}",
            "  float t=uTime,a=atan(p.y,p.x);",
            "  float r=.5*(1.+.05*sin(3.*a+t*.9)+.035*sin(2.*a-t*1.3+1.7)+.03*sin(5.*a+t*.6+.8)+.04*uTalk*sin(7.*a+t*8.));",
            "  float d=length(p)-r;",
            "  vec2 lag=-uVel*.35;",
            "  vec2 c1=vec2(cos(t*.55),sin(t*.71))*(.34+.30*(.5+.5*sin(t*.63)))+lag;",
            "  vec2 c2=vec2(cos(t*.43+2.1),sin(t*.61+1.3))*(.34+.30*(.5+.5*sin(t*.5+1.7)))+lag;",
            "  vec2 c3=vec2(cos(t*.37+4.2),sin(t*.52+3.1))*(.34+.30*(.5+.5*sin(t*.57+3.4)))+lag;",
            "  d=smin(d,length(p-c1)-.15*(.65+.35*sin(t*.9)),.16);",
            "  d=smin(d,length(p-c2)-.11*(.65+.35*sin(t*1.1+1.)),.16);",
            "  d=smin(d,length(p-c3)-.13*(.65+.35*sin(t*.8+2.)),.16);",
            "  return d;",
            "}",
            "void main(){",
            "  float px=uRes.x/1.8;",
            "  vec2 p=(gl_FragCoord.xy-.5*uRes)/px;",
            "  float d=map(p);",
            "  float aa=1.4/px;",
            "  float al=1.-smoothstep(-aa,aa,d);",
            "  if(al<=0.){gl_FragColor=vec4(0.);return;}",
            "  vec2 e=vec2(.012,0.);",
            "  vec2 g=vec2(map(p+e.xy)-map(p-e.xy),map(p+e.yx)-map(p-e.yx));",
            "  float depth=clamp(-d/.34,0.,1.);",
            "  vec3 n=normalize(vec3(normalize(g+1e-5)*(1.-depth),.15+.85*depth));",
            "  vec3 L=normalize(vec3(uLook.x*.6-.25,uLook.y*.6+.45,.85));",
            "  float df=clamp(dot(n,L),0.,1.);",
            "  vec3 dark=vec3(.29,.39,.03),mid=vec3(.77,.90,.20),lt=vec3(.93,1.,.53);",
            "  vec3 col=mix(dark,mid,smoothstep(0.,.6,df));",
            "  col=mix(col,lt,smoothstep(.55,1.,df)*.8);",
            "  float sw=.5+.5*sin(p.x*5.+uTime*.8+sin(p.y*4.-uTime*.6)*1.5);",
            "  col+=vec3(.10,.13,0.)*sw*depth;",
            "  vec3 h=normalize(L+vec3(0.,0.,1.));",
            "  col+=pow(max(dot(n,h),0.),36.)*.55;",
            "  col+=vec3(.6,.75,.2)*pow(1.-n.z,2.5)*.25;",
            "  col*=.78+.22*smoothstep(-.5,.4,p.y);",
            "  gl_FragColor=vec4(col*al,al);",
            "}"
          ].join("\n");
          function sh(type, src) {
            var s = ctx.createShader(type); ctx.shaderSource(s, src); ctx.compileShader(s);
            if (!ctx.getShaderParameter(s, ctx.COMPILE_STATUS)) throw new Error("shader");
            return s;
          }
          var prog = ctx.createProgram();
          ctx.attachShader(prog, sh(ctx.VERTEX_SHADER, vs));
          ctx.attachShader(prog, sh(ctx.FRAGMENT_SHADER, fs));
          ctx.linkProgram(prog);
          if (!ctx.getProgramParameter(prog, ctx.LINK_STATUS)) throw new Error("link");
          ctx.useProgram(prog);
          var buf = ctx.createBuffer();
          ctx.bindBuffer(ctx.ARRAY_BUFFER, buf);
          ctx.bufferData(ctx.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), ctx.STATIC_DRAW);
          var loc = ctx.getAttribLocation(prog, "a");
          ctx.enableVertexAttribArray(loc);
          ctx.vertexAttribPointer(loc, 2, ctx.FLOAT, false, 0, 0);
          ["uRes", "uVel", "uLook", "uTime", "uK", "uTalk"].forEach(function (n) { glU[n] = ctx.getUniformLocation(prog, n); });
          ctx.clearColor(0, 0, 0, 0);
          glCanvas.addEventListener("webglcontextlost", function (e) { e.preventDefault(); gl = null; orb.classList.remove("orb-gl"); if (glCanvas.parentNode) glCanvas.parentNode.removeChild(glCanvas); });
          btn.appendChild(glCanvas);
          gl = ctx;
          orb.classList.add("orb-gl");
        } catch (err) { gl = null; }
      })();
      function sizeGL() {
        if (!gl) return;
        var dpr = window.AMP_PHONE ? 1 : Math.min(window.devicePixelRatio || 1, 2);
        var px = Math.round(geo.o * 1.8 * dpr);
        if (glCanvas.width !== px) { glCanvas.width = px; glCanvas.height = px; gl.viewport(0, 0, px, px); }
      }
      /* smoothed inputs for the shader (low-pass, so nothing ever jumps) */
      var sv = { x: 0, y: 0 }, sk = 0, talk = 0, look = { x: 0, y: 0, tx: 0, ty: 0 }, kick = 0;
      onResize(function () { geo = measure(); go(spot); sizeGL(); });
      sizeGL();
      /* Motion: an exact (frame-rate independent) damped spring toward the
         section's spot - no per-frame jitter, a soft settle instead of a
         wobble. The idle drift is a pure slow sine added on top, and the
         scroll speed is measured every frame and low-passed (no event jolts). */
      var scrollLP = 0, prevScroll = window.scrollY, ovx = 0, ovy = 0;
      function springStep(x, v, target, dt) {
        var w = 5.6, z = 0.66, x0 = x - target;
        var wz = w * z, al = w * Math.sqrt(1 - z * z), e = Math.exp(-wz * dt), c = Math.cos(al * dt), s = Math.sin(al * dt);
        var k = (v + wz * x0) / al;
        return { x: target + e * (x0 * c + k * s), v: e * (-wz * (x0 * c + k * s) + (-x0 * al * s + (v + wz * x0) * c)) };
      }
      function drawBody(time) {
        if (!gl) return;
        gl.clear(gl.COLOR_BUFFER_BIT);
        gl.uniform2f(glU.uRes, glCanvas.width, glCanvas.height);
        gl.uniform1f(glU.uTime, reduce ? 3 : time % 600);
        gl.uniform2f(glU.uVel, Math.max(-0.6, Math.min(0.6, sv.x * 0.02)), Math.max(-0.6, Math.min(0.6, sv.y * 0.02)));
        gl.uniform2f(glU.uLook, look.x, look.y);
        gl.uniform1f(glU.uK, sk);
        gl.uniform1f(glU.uTalk, talk);
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      }
      gsap.ticker.add(function (time, dtms) {
        if (!orb.classList.contains("is-on") || window.ampOff("orb")) return;
        /* On a phone Ampli stays in its corner: it never travels over the text
           (where its bubble used to cover it) and the page keeps the whole GPU
           for the scroll. Only its body keeps living, at half frame rate. */
        if (window.AMP_PHONE) {
          /* while the finger is moving the page, the GPU belongs to the scroll:
             Ampli's body stops redrawing and picks up again once it settles */
          if (phoneScrolling || (gsap.ticker.frame & 1)) return;
          sv.x = sv.y = sk = 0;
          talk += ((orb.classList.contains("is-talking") ? 1 : 0) - talk) * 0.12;
          drawBody(time);
          return;
        }
        var dt = Math.min(dtms, 50) / 1000, f = dt * 60, open = orb.classList.contains("is-open");
        var w = reduce ? 0 : (open ? 0.25 : 1);

        /* scroll speed, per frame, smoothed */
        var sy = window.scrollY, ds = (sy - prevScroll) / Math.max(f, 0.25); prevScroll = sy;
        scrollLP += (ds - scrollLP) * (1 - Math.pow(0.85, f));
        var push = reduce ? 0 : Math.max(-46, Math.min(46, scrollLP * 0.9));

        var tgx = tx, tgy = Math.max(0, Math.min(geo.up, ty - push));
        if (reduce) { ox = tgx; oy = tgy; ovx = ovy = 0; }
        else {
          var sx = springStep(ox, ovx, tgx, dt), sy2 = springStep(oy, ovy, tgy, dt);
          ox = sx.x; ovx = sx.v; oy = sy2.x; ovy = sy2.v;
          /* soft walls */
          if (ox < 0) { ox = 0; if (ovx < 0) ovx = -ovx * 0.4; } else if (ox > geo.freeW) { ox = geo.freeW; if (ovx > 0) ovx = -ovx * 0.4; }
          if (oy < 0) { oy = 0; if (ovy < 0) ovy = -ovy * 0.4; } else if (oy > geo.up) { oy = geo.up; if (ovy > 0) ovy = -ovy * 0.4; }
        }
        vx = ovx / 60; vy = ovy / 60;                       /* px per frame, for the body's stretch */

        var dx = ox + Math.sin(time * 0.6) * 8 * w, dy = oy + Math.cos(time * 0.8) * 6 * w;
        dx = Math.max(0, Math.min(geo.freeW, dx)); dy = Math.max(0, Math.min(geo.up, dy));
        /* the box (and its text) moves in whole pixels so the text is sharp; the body alone takes the fraction */
        var rx = Math.round(dx), ry = Math.round(dy);
        orb.style.translate = rx + "px " + (-ry) + "px";
        var fxy = (dx - rx).toFixed(2) + "px " + (ry - dy).toFixed(2) + "px";
        if (gl) glCanvas.style.translate = fxy; else goo.style.translate = fxy;
        halo.style.translate = fxy;

        var a = 1 - Math.pow(0.82, f);
        sv.x += (vx - sv.x) * a; sv.y += (vy - sv.y) * a;
        var ksp = Math.hypot(sv.x, sv.y), kt = reduce ? 0 : Math.min(ksp * 0.045, 0.34);
        sk += (kt - sk) * a;
        talk += ((orb.classList.contains("is-talking") ? 1 : 0) - talk) * (1 - Math.pow(0.9, f));
        look.x += (look.tx - look.x) * (1 - Math.pow(0.9, f)); look.y += (look.ty - look.y) * (1 - Math.pow(0.9, f));
        if (gl) {
          drawBody(time);
        } else {
          var ang = Math.atan2(-sv.y, sv.x) * 57.2958;
          goo.style.transform = sk > 0.004 ? "rotate(" + ang.toFixed(1) + "deg) scale(" + (1 + sk).toFixed(3) + "," + (1 - sk * 0.7).toFixed(3) + ") rotate(" + (-ang).toFixed(1) + "deg)" : "";
        }
        var right = geo.left0 + dx + geo.o / 2 > geo.vw / 2;
        if (right !== side) { side = right; orb.classList.toggle("is-right", right); }
      });
      function say(text) {
        /* no speech bubbles on a phone: they sat on top of the copy */
        if (window.AMP_PHONE || orb.classList.contains("is-open")) return;
        bubble.textContent = text;
        bubble.classList.add("is-on");
        orb.classList.add("is-talking");
        clearTimeout(timer); clearTimeout(talkTimer);
        talkTimer = setTimeout(function () { orb.classList.remove("is-talking"); }, 1800);
        timer = setTimeout(function () { bubble.classList.remove("is-on"); }, 5200);
      }
      function setOpen(open) {
        orb.classList.toggle("is-open", open);
        btn.setAttribute("aria-expanded", open ? "true" : "false");
        if (open) { bubble.classList.remove("is-on"); orb.classList.remove("is-talking"); }
      }
      btn.addEventListener("click", function () { setOpen(!orb.classList.contains("is-open")); });
      document.getElementById("orbClose").addEventListener("click", function () { setOpen(false); });
      orb.querySelector(".orb-cta").addEventListener("click", function () { setOpen(false); });
      document.addEventListener("keydown", function (e) { if (e.key === "Escape") setOpen(false); });
      ScrollTrigger.create({
        trigger: hero, start: "bottom 90%", end: "max",
        onToggle: function (self) {
          orb.classList.toggle("is-on", self.isActive);
          if (!self.isActive) { setOpen(false); bubble.classList.remove("is-on"); }
        }
      });
      Object.keys(LINES).forEach(function (id) {
        var el = document.getElementById(id);
        if (!el) return;
        ScrollTrigger.create({
          trigger: el, start: "top 55%", end: "bottom 55%",
          onToggle: function (self) {
            if (self.isActive) go(id);
            if (self.isActive && !seen[id]) { seen[id] = 1; setTimeout(function () { if (self.isActive) say(LINES[id]); }, 500); }
          }
        });
      });
      if (window.matchMedia("(hover: hover)").matches) {
        document.addEventListener("pointermove", function (e) {
          var r = btn.getBoundingClientRect();
          var dx = (e.clientX - (r.left + r.width / 2)) / window.innerWidth;
          var dy = (e.clientY - (r.top + r.height / 2)) / window.innerHeight;
          look.tx = Math.max(-1, Math.min(1, dx * 2)); look.ty = Math.max(-1, Math.min(1, -dy * 2));
          shine.style.setProperty("--lx", (34 + Math.max(-1, Math.min(1, dx * 2)) * 22).toFixed(1) + "%");
          shine.style.setProperty("--ly", (26 + Math.max(-1, Math.min(1, dy * 2)) * 18).toFixed(1) + "%");
        }, { passive: true });
      }
    })();
  })();

  /* ---------------- Mobile nav ---------------- */
  var navToggle = document.getElementById("navToggle");
  var mobileNav = document.getElementById("mobileNav");
  navToggle.addEventListener("click", function () {
    var isOpen = mobileNav.classList.toggle("is-open");
    document.documentElement.classList.toggle("has-panel", isOpen);
    navToggle.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });
  mobileNav.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      mobileNav.classList.remove("is-open");
      document.documentElement.classList.remove("has-panel");
    }
  });

  /* ---------------- ?fps=1 : on-screen frame-rate readout ---------------- */
  if (/[?&]fps=1/.test(location.search)) {
    var box = document.createElement("div");
    box.style.cssText = "position:fixed;left:8px;top:8px;z-index:9999;background:rgba(0,0,0,.82);color:#d7f24a;font:600 12px/1.45 monospace;padding:7px 10px;border-radius:8px;pointer-events:none;white-space:pre";
    document.body.appendChild(box);
    var ids = ["hero", "problema", "que-hacemos", "frentes", "metodo", "consultora", "proyectos", "clientes", "faq", "contacto"];
    var n = 0, worst = 0, last = performance.now(), since = last;
    (function loop(now) {
      var d = now - last; last = now;
      n++; if (d > worst) worst = d;
      if (now - since >= 700) {
        var mid = window.innerHeight / 2, where = "";
        for (var k = 0; k < ids.length; k++) {
          var el = document.getElementById(ids[k]);
          if (!el) continue;
          var r = el.getBoundingClientRect();
          if (r.top <= mid && r.bottom >= mid) { where = ids[k]; break; }
        }
        box.textContent = Math.round(n * 1000 / (now - since)) + " fps   peor " + Math.round(worst) + " ms\n" + where;
        n = 0; worst = 0; since = now;
      }
      requestAnimationFrame(loop);
    })(performance.now());
  }


  /* ---------------- ?diag=1 : who is actually eating the frames ----------------
     Chrome reports every frame that took too long together with the scripts that
     ran in it and how much of it went into style and layout. Scrolling the page
     with this on tells us, from the real phone, whether the cost is our
     JavaScript or the browser re-laying out the page — and which function. */
  if (/[?&]diag=1/.test(location.search)) {
    var dbox = document.createElement("div");
    dbox.style.cssText = "position:fixed;left:6px;top:6px;right:6px;z-index:99999;background:rgba(0,0,0,.88);color:#d7f24a;font:600 11px/1.5 monospace;padding:8px 10px;border-radius:8px;pointer-events:none;white-space:pre-wrap";
    dbox.textContent = "midiendo… scrolleá 15 segundos";
    document.body.appendChild(dbox);
    var agg = {}, nLong = 0, worstMs = 0, styleMs = 0, scriptMs = 0, renderMs = 0, blockMs = 0, t0 = performance.now();
    function draw() {
      var rows = Object.keys(agg).map(function (k) { return [k, agg[k]]; });
      rows.sort(function (a, b) { return b[1] - a[1]; });
      var secs = Math.max(1, (performance.now() - t0) / 1000);
      dbox.textContent =
        "cuadros largos: " + nLong + "  peor: " + Math.round(worstMs) + "ms  en " + Math.round(secs) + "s\n" +
        "tareas " + Math.round(scriptMs) + "  render " + Math.round(renderMs) + "  maqueta " + Math.round(styleMs) + "  bloqueo " + Math.round(blockMs) + "\n" +
        rows.slice(0, 6).map(function (r) { return "  " + Math.round(r[1]) + "ms  " + r[0]; }).join("\n");
    }
    try {
      new PerformanceObserver(function (list) {
        list.getEntries().forEach(function (e) {
          nLong++;
          if (e.duration > worstMs) worstMs = e.duration;
          var end = e.startTime + e.duration;
          if (e.styleAndLayoutStart) styleMs += end - e.styleAndLayoutStart;
          if (e.renderStart) renderMs += end - e.renderStart;
          blockMs += e.blockingDuration || 0;
          (e.scripts || []).forEach(function (sc) {
            var k = (sc.sourceFunctionName || sc.invoker || sc.name || "?") + "";
            var url = (sc.sourceURL || "").split("/").pop().split("?")[0];
            k = (k + (url ? " @" + url : "")).slice(0, 44);
            agg[k] = (agg[k] || 0) + sc.duration;
            scriptMs += sc.duration;
          });
        });
        draw();
      }).observe({ type: "long-animation-frame", buffered: true });
      setInterval(draw, 1000);
    } catch (err) {
      dbox.textContent = "este navegador no informa cuadros largos";
    }
  }

  /* ---------------- Recalculate once layout has fully settled ----------------
     The Fraunces webfont changes text (and therefore document) height once
     it loads, which shifts every scroll-track's true position after
     ScrollTrigger's initial measurement — refresh after it's done. Every
     trigger here uses "top top"/"bottom bottom" relative to its own track
     element (never a cached pixel string), so a refresh always recomputes
     from live layout. */
  requestAnimationFrame(function () { ScrollTrigger.refresh(); });
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(function () { ScrollTrigger.refresh(); });
  }
  window.addEventListener("load", function () { ScrollTrigger.refresh(); });
})();
