// Interacciones de la página
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const mobile = matchMedia('(max-width: 760px)');
  const I = window.I18N;

  /* ---------- fibra de carbono realista (sarga 2x2, cada mecha con sus fibras) ----------
     Se generan dos texturas: una con las mechas horizontales brillando y otra con las
     verticales. Al mover el mouse o hacer scroll se mezclan, como el reflejo real del carbono. */
  function carbonTile(bright) {
    const S = 3, cell = 7 * S, n = 4, W = cell * n;
    const c = document.createElement('canvas'); c.width = c.height = W;
    const g = c.getContext('2d');
    g.fillStyle = '#060607'; g.fillRect(0, 0, W, W);
    let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
    for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
      const horiz = ((x - y) % 4 + 4) % 4 < 2;
      const k = horiz === (bright === 'h') ? 1 : 0.55;
      const x0 = x * cell, y0 = y * cell;
      // cuerpo de la mecha: brillo en el centro, sombra en los bordes
      const gr = horiz ? g.createLinearGradient(0, y0, 0, y0 + cell) : g.createLinearGradient(x0, 0, x0 + cell, 0);
      const hi = Math.round(30 * k + 12), mid = Math.round(15 * k + 9);
      gr.addColorStop(0, 'rgb(8,8,9)'); gr.addColorStop(0.18, `rgb(${mid},${mid},${mid + 2})`);
      gr.addColorStop(0.5, `rgb(${hi},${hi},${hi + 3})`); gr.addColorStop(0.82, `rgb(${mid},${mid},${mid + 2})`); gr.addColorStop(1, 'rgb(8,8,9)');
      g.fillStyle = gr; g.fillRect(x0, y0, cell, cell);
      // fibras finas a lo largo de la mecha
      for (let f = 0; f < 9; f++) {
        const o = 2 + rnd() * (cell - 4), a = (0.03 + rnd() * 0.07) * k;
        g.strokeStyle = rnd() > 0.5 ? `rgba(255,255,255,${a})` : `rgba(0,0,0,${a * 1.6})`;
        g.lineWidth = 0.6;
        g.beginPath();
        if (horiz) { g.moveTo(x0 + 1, y0 + o); g.lineTo(x0 + cell - 1, y0 + o); }
        else { g.moveTo(x0 + o, y0 + 1); g.lineTo(x0 + o, y0 + cell - 1); }
        g.stroke();
      }
      // extremos de la mecha (donde se cruza por debajo) más oscuros
      const eg = horiz ? g.createLinearGradient(x0, 0, x0 + cell, 0) : g.createLinearGradient(0, y0, 0, y0 + cell);
      eg.addColorStop(0, 'rgba(0,0,0,.3)'); eg.addColorStop(0.1, 'rgba(0,0,0,0)'); eg.addColorStop(0.9, 'rgba(0,0,0,0)'); eg.addColorStop(1, 'rgba(0,0,0,.3)');
      g.fillStyle = eg; g.fillRect(x0, y0, cell, cell);
    }
    return c.toDataURL('image/png');
  }
  try {
    const root = document.documentElement.style;
    root.setProperty('--cf-a', `url(${carbonTile('h')})`);
    root.setProperty('--cf-b', `url(${carbonTile('v')})`);
  } catch (e) {}
  let px = 0.5, raf = 0;
  const flip = () => { raf = 0; document.documentElement.style.setProperty('--cff', (0.5 + 0.5 * Math.sin(scrollY / 380 + px * 3.2)).toFixed(3)); };
  const queue = () => { if (!raf) raf = requestAnimationFrame(flip); };
  addEventListener('scroll', queue, { passive: true });
  addEventListener('pointermove', e => {
    px = e.clientX / innerWidth;
    document.documentElement.style.setProperty('--lx', (px * 100).toFixed(1) + '%');
    document.documentElement.style.setProperty('--ly', (e.clientY / innerHeight * 100).toFixed(1) + '%');
    queue();
  }, { passive: true });
  flip();

  /* ---------- loader ---------- */
  const bar = $('#loaderBar'), pct = $('#loaderPct');
  let p = 0, done = false;
  if (new URLSearchParams(location.search).has('x')) p = 99;
  const fake = setInterval(() => { p = Math.min(p + Math.random() * 9, done ? 100 : 92); bar.style.width = p + '%'; pct.textContent = String(Math.round(p)).padStart(2, '0'); if (p >= 100) { clearInterval(fake); finish(); } }, 70);
  const t0 = performance.now();
  (function wait() { if (document.documentElement.classList.contains('engine-ready') || performance.now() - t0 > 4000) done = true; else requestAnimationFrame(wait); })();
  function finish() { $('#loader').classList.add('done'); intro(); }

  function intro() {
    if (!window.gsap) { $$('.hero__title .ln>span').forEach(s => s.style.transform = 'none'); return; }
    gsap.to('.hero__title .ln>span', { y: 0, duration: 1.1, ease: 'expo.out', stagger: 0.09, delay: 0.1 });
    gsap.from('.hero__copy .kicker, .hero__sub, .hero__ctas, .hero__hud', { opacity: 0, y: 24, duration: 0.9, ease: 'power3.out', stagger: 0.08, delay: 0.35 });
    gsap.from('.nav', { opacity: 0, y: -20, duration: 0.8, delay: 0.3 });
  }

  /* ---------- nav ---------- */
  const nav = $('#nav'); let lastY = 0;
  addEventListener('scroll', () => {
    const y = scrollY;
    nav.classList.toggle('scrolled', y > 40);
    nav.classList.toggle('hide', y > lastY && y > innerHeight * 0.8 && !document.body.classList.contains('menu-open'));
    lastY = y;
    $('.wa-float').classList.toggle('on', y > innerHeight * 0.6);
  }, { passive: true });
  $('#burger').addEventListener('click', () => document.body.classList.toggle('menu-open'));
  $$('#menu a').forEach(a => a.addEventListener('click', () => document.body.classList.remove('menu-open')));

  /* ---------- palabras que se encienden con el scroll ---------- */
  function splitWords(el) {
    const walk = n => [...n.childNodes].forEach(c => {
      if (c.nodeType === 3) {
        const frag = document.createDocumentFragment();
        c.textContent.split(/(\s+)/).forEach(t => { if (!t) return; if (/^\s+$/.test(t)) frag.append(t); else { const s = document.createElement('span'); s.className = 'w'; s.textContent = t; frag.append(s); } });
        c.replaceWith(frag);
      } else if (c.nodeType === 1 && !c.classList.contains('w')) walk(c);
    });
    walk(el); el._words = $$('.w', el); updWords(el);
  }
  function updWords(el) {
    const r = el.getBoundingClientRect(), words = el._words || [];
    // empieza a encenderse al entrar y termina cuando el centro del texto llega un poco por debajo de la mitad de la pantalla
    const prog = Math.min(Math.max((innerHeight * 0.92 - r.top) / (innerHeight * 0.32 + r.height / 2), 0), 1);
    const n = Math.ceil(prog * words.length);
    words.forEach((w, i) => w.classList.toggle('on', i < n));
  }
  const wordEls = $$('.reveal-words');
  wordEls.forEach(splitWords);
  addEventListener('scroll', () => wordEls.forEach(updWords), { passive: true });
  I.on(() => wordEls.forEach(splitWords)); // al cambiar idioma se vuelve a partir el texto

  /* ---------- reveal ---------- */
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('on'); io.unobserve(e.target); } }), { threshold: 0.2 });
  $$('.reveal-up').forEach(el => io.observe(el));
  const stepIO = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { $$('.step').forEach((s, i) => setTimeout(() => s.classList.add('on'), i * 220)); stepIO.disconnect(); } }), { threshold: 0.3 });
  stepIO.observe($('.steps'));

  /* ---------- servicios: acordeón ---------- */
  const items = $$('.svc__item'); let cur = 0, auto, hoverT;
  const open = i => { if (i === cur && items[i].classList.contains('is-open')) return; cur = i; items.forEach((it, k) => it.classList.toggle('is-open', k === i)); };
  const loop = () => { clearInterval(auto); if (mobile.matches) return; auto = setInterval(() => open((cur + 1) % items.length), 5200); };
  items.forEach((it, i) => {
    it.addEventListener('click', () => { open(i); loop(); });
    // en escritorio se abre al pasar el mouse, con una pequeña intención para no "saltar" al cruzar
    it.addEventListener('mouseenter', () => { if (mobile.matches) return; clearTimeout(hoverT); hoverT = setTimeout(() => { open(i); loop(); }, 140); });
    it.addEventListener('mouseleave', () => clearTimeout(hoverT));
  });
  new IntersectionObserver(([e]) => e.isIntersecting ? loop() : clearInterval(auto), { threshold: 0.25 }).observe($('#svc'));

  /* ---------- ruta de viajeros ---------- */
  const route = $('#route');
  new IntersectionObserver(([e], obs) => {
    if (!e.isIntersecting) return; obs.disconnect();
    const line = $('.route__line');
    line.style.transition = 'stroke-dashoffset 2.2s cubic-bezier(.7,0,.2,1)';
    line.style.strokeDashoffset = '500';
    let k = 0; const iv = setInterval(() => { k += 2; route.querySelector('.route__stops').style.setProperty('--rp', Math.min(k, 50) + '%'); if (k >= 50) clearInterval(iv); }, 30);
    $$('.stop', route).forEach((s, i) => { s.style.opacity = 0; s.style.transform = 'translateY(10px)'; s.style.transition = `opacity .6s ${0.2 + i * 0.25}s, transform .6s ${0.2 + i * 0.25}s`; requestAnimationFrame(() => { s.style.opacity = 1; s.style.transform = 'none'; }); });
  }, { threshold: 0.4 }).observe(route);

  /* ---------- tienda ---------- */
  const PRODUCTS = [
    { cat: 'herramientas', brand: 'Motion Pro', k: 'p.1', img: 'herr-llave' },
    { cat: 'herramientas', brand: 'Motion Pro', k: 'p.2', img: 'herr-tubos' },
    { cat: 'herramientas', brand: 'Motion Pro', k: 'p.3', img: 'herr-rojo' },
    { cat: 'generadores', b: 'b.gen', k: 'p.4', img: 'generador-1' },
    { cat: 'generadores', b: 'b.gen', k: 'p.5', img: 'generador-2' },
    { cat: 'repuestos', b: 'b.brakes', k: 'p.6', img: 'brembo-2' },
    { cat: 'repuestos', b: 'b.ign', k: 'p.7', img: 'bujia' },
    { cat: 'repuestos', b: 'b.susp', k: 'p.8', img: 'suspension' },
  ];
  const rail = $('#rail');
  let filterNow = 'all';
  const brandOf = p => p.brand || I.t(p.b);
  function renderShop() {
    rail.innerHTML = PRODUCTS.map((p, i) => `
      <article class="prod${filterNow !== 'all' && p.cat !== filterNow ? ' hid' : ''}" data-cat="${p.cat}" data-i="${i}">
        <div class="prod__img" role="button" tabindex="0" aria-label="${I.t(p.k)}"><img src="img/m/${p.img}.jpg" alt="${I.t(p.k)}" loading="lazy" draggable="false"></div>
        <div class="prod__b"><span class="mono">${brandOf(p)}</span><h4>${I.t(p.k)}</h4>
          <a href="${I.wa('prod', I.t(p.k))}" target="_blank" rel="noopener">${I.t('shop.ask')} <b>»</b></a></div>
      </article>`).join('');
  }
  renderShop(); I.on(renderShop);
  const filter = f => {
    filterNow = f;
    $$('.filters button').forEach(b => b.classList.toggle('is-on', b.dataset.f === f));
    $$('.prod').forEach(pr => pr.classList.toggle('hid', f !== 'all' && pr.dataset.cat !== f));
    rail.scrollTo({ left: 0, behavior: 'smooth' });
  };
  $$('.filters button').forEach(b => b.addEventListener('click', () => filter(b.dataset.f)));
  $$('.cat').forEach(c => c.addEventListener('click', () => filter(c.dataset.filter)));
  let down = false, sx = 0, sl = 0, moved = false;
  rail.addEventListener('pointerdown', e => { if (e.pointerType !== 'mouse') return; down = true; moved = false; sx = e.clientX; sl = rail.scrollLeft; rail.classList.add('drag'); });
  addEventListener('pointerup', () => { down = false; rail.classList.remove('drag'); });
  addEventListener('pointermove', e => { if (!down) return; const dx = e.clientX - sx; if (Math.abs(dx) > 4) moved = true; rail.scrollLeft = sl - dx; });
  rail.addEventListener('click', e => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);

  /* ---------- visor de productos en grande ---------- */
  const lb = document.createElement('div');
  lb.className = 'lb'; lb.setAttribute('aria-hidden', 'true');
  lb.innerHTML = `<div class="lb__img"><img alt=""></div>
    <div class="lb__info"><span class="mono"></span><h4></h4><p class="lb__count mono"></p><a class="btn btn--red" target="_blank" rel="noopener"><b></b><span class="arr">»</span></a></div>
    <button class="lb__x" aria-label="Cerrar">✕</button><button class="lb__nav lb__prev" aria-label="Anterior">‹</button><button class="lb__nav lb__next" aria-label="Siguiente">›</button>`;
  document.body.appendChild(lb);
  let lbList = [], lbIdx = 0;
  function lbShow(i) {
    lbIdx = (i + lbList.length) % lbList.length;
    const p = PRODUCTS[lbList[lbIdx]], img = $('.lb__img img', lb);
    img.classList.remove('ok');
    const src = `img/${p.img}.jpg`;
    const pre = new Image(); pre.onload = () => { img.src = src; img.alt = I.t(p.k); requestAnimationFrame(() => img.classList.add('ok')); }; pre.src = src;
    $('.lb__info span', lb).textContent = brandOf(p);
    $('.lb__info h4', lb).textContent = I.t(p.k);
    $('.lb__count', lb).textContent = `${lbIdx + 1} / ${lbList.length}`;
    const a = $('.lb__info a', lb); a.href = I.wa('prod', I.t(p.k)); $('b', a).textContent = I.t('shop.ask');
  }
  function lbOpen(i) {
    lbList = $$('.prod:not(.hid)').map(el => +el.dataset.i);
    lb.classList.add('on'); lb.setAttribute('aria-hidden', 'false'); document.body.style.overflow = 'hidden';
    lbShow(lbList.indexOf(i));
  }
  function lbClose() { lb.classList.remove('on'); lb.setAttribute('aria-hidden', 'true'); document.body.style.overflow = ''; }
  rail.addEventListener('click', e => { const im = e.target.closest('.prod__img'); if (im) lbOpen(+im.closest('.prod').dataset.i); });
  rail.addEventListener('keydown', e => { if (e.key === 'Enter') { const im = e.target.closest('.prod__img'); if (im) lbOpen(+im.closest('.prod').dataset.i); } });
  $('.lb__x', lb).onclick = lbClose;
  $('.lb__prev', lb).onclick = () => lbShow(lbIdx - 1);
  $('.lb__next', lb).onclick = () => lbShow(lbIdx + 1);
  lb.addEventListener('click', e => { if (e.target === lb || e.target.classList.contains('lb__img')) lbClose(); });
  addEventListener('keydown', e => { if (!lb.classList.contains('on')) return; if (e.key === 'Escape') lbClose(); if (e.key === 'ArrowRight') lbShow(lbIdx + 1); if (e.key === 'ArrowLeft') lbShow(lbIdx - 1); });
  let tx = 0;
  lb.addEventListener('touchstart', e => tx = e.touches[0].clientX, { passive: true });
  lb.addEventListener('touchend', e => { const d = e.changedTouches[0].clientX - tx; if (Math.abs(d) > 50) lbShow(lbIdx + (d < 0 ? 1 : -1)); });
  window.DEMO = { lbOpen, filter };

  /* ---------- parallax (GSAP) ---------- */
  if (window.gsap && window.ScrollTrigger) {
    gsap.registerPlugin(ScrollTrigger);
    $$('.parallax img').forEach(img => gsap.fromTo(img, { yPercent: -8 }, { yPercent: 8, ease: 'none', scrollTrigger: { trigger: img.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.parallax-in img').forEach(img => gsap.fromTo(img, { yPercent: -10 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: img.parentElement, start: 'top bottom', end: 'bottom top', scrub: true } }));
    $$('.parallax-in').forEach((f, i) => gsap.from(f, { clipPath: 'inset(100% 0 0 0)', duration: 1.3, ease: 'expo.out', delay: i * 0.12, scrollTrigger: { trigger: f, start: 'top 85%' } }));
    gsap.to('.hero__stage', { yPercent: 18, opacity: 0.25, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__copy', { yPercent: -30, opacity: 0, ease: 'none', scrollTrigger: { trigger: '.hero', start: '30% top', end: 'bottom top', scrub: true } });
    gsap.from('.contact__big svg', { yPercent: 40, opacity: 0, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: '.contact', start: 'top 75%' } });
  }
})();
