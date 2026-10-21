/* =====================================================================
   Grupo Amplifia · Asesor virtual
   ---------------------------------------------------------------------
   Modo demo: responde en el navegador con la información de la página y
   el stock cargado en el panel (data.js). Para convertirlo en un vendedor
   con IA, completar ASSISTANT_ENDPOINT con la URL de un servidor propio
   (por ejemplo un Cloudflare Worker) que reciba { system, messages } y
   llame a la API de Claude. La clave de la API NUNCA va en este archivo.
   ===================================================================== */
(function () {
  const ASSISTANT_ENDPOINT = "";   // ej: "https://asesor-demo.tu-worker.workers.dev"
  const WA = "5490000000000";
  const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const money = n => "$ " + Math.round(n).toLocaleString("es-AR");
  const km = k => k == null || k === "" ? "km a consultar" : +k === 0 ? "0 km" : (+k).toLocaleString("es-AR") + " km";
  const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  const stock = () => (typeof STOCK !== "undefined" ? STOCK : []).filter(c => !c.sold);

  /* ---------- Toda la información de la página (también sirve de "prompt" para la IA) ---------- */
  const INFO = {
    agencia: "Grupo Amplifia, demo de concesionaria: usados seleccionados y 0km.",
    direcciones: ["Av. Principal 123, tu ciudad"],
    whatsapp: "0000 00-0000", telefono: "0000 00-0000", email: "contacto@ejemplo.com",
    redes: "Redes sociales de tu marca",
    financiacion: "Financiación hasta el 100% con crédito prendario, planes de 12 a 60 cuotas, aprobación rápida. El usado puede servir como entrega.",
    usados: "Tasación gratis y sin compromiso. El usado se toma como parte de pago o se vende en consignación. Proceso: fotos por WhatsApp → tasación en la agencia → cerrás el trato en el día.",
    garantia: "Todas las unidades pasan control mecánico y de documentación antes de publicarse. Fotos reales de cada unidad.",
    precios: "Los precios publicados son de entrega + cuotas en pesos. Algunas unidades figuran como 'Consulte'.",
  };
  function systemPrompt() {
    const lista = stock().map(c => `- ${c.brand} ${c.name} · ${c.type} · ${c.year} · ${km(c.km)} · ${c.price ? money(c.price) + " (entrega + cuotas)" : "precio a consultar"}`).join("\n");
    return `Sos el asesor virtual de ventas de ${INFO.agencia}
Tu objetivo es VENDER: entendé qué necesita la persona (uso, presupuesto, tipo de auto, si tiene usado para entregar), recomendá unidades concretas del stock y llevala a reservar una prueba de manejo o a hablar por WhatsApp con un vendedor.
Hablá en español rioplatense, cálido, breve (2 a 4 oraciones), sin inventar datos. Si no sabés algo, ofrecé derivar por WhatsApp.

DATOS DE LA AGENCIA
- Direcciones: ${INFO.direcciones.join(" / ")}
- WhatsApp: ${INFO.whatsapp} · Teléfono: ${INFO.telefono} · Email: ${INFO.email}
- Redes: ${INFO.redes}
- Financiación: ${INFO.financiacion}
- Usados: ${INFO.usados}
- Calidad: ${INFO.garantia}
- Precios: ${INFO.precios}

STOCK DISPONIBLE HOY (${stock().length} unidades)
${lista}`;
  }

  /* ---------- Motor local (demo) ---------- */
  const TYPE_WORDS = [
    [/\b(suvs?|camionetitas?|crossovers?|todoterreno)\b/, ["SUV"]],
    [/\b(pick ?ups?|camionetas?|4x4|chatas?)\b/, ["Pickup"]],
    [/\b(sedan(es)?|tres cuerpos|baul grande)\b/, ["Sedán"]],
    [/\b(hatch(back)?s?|chicos?|ciudad|primer auto|economicos?|gasolero)\b/, ["Hatchback"]],
    [/\b(familiar(es)?|7 asientos|siete asientos|monovolumen(es)?|para la familia)\b/, ["Monovolumen", "SUV"]],
    [/\b(coupes?|deportivos?)\b/, ["Coupé"]],
    [/\b(utilitarios?|furgon(es)?|para trabajar|carga)\b/, ["Utilitario", "Pickup"]],
  ];
  const BRAND_ALIAS = { vw: "Volkswagen", volks: "Volkswagen", chevy: "Chevrolet", chevrolet: "Chevrolet", citroen: "Citroën", mercedes: "Mercedes-Benz" };

  function parseBudget(t) {
    const m = t.match(/(\d+(?:[.,]\d+)?)\s*(m|mill|millon|millones|palos)\b/) || t.match(/\$?\s?(\d{1,3}(?:\.\d{3}){2,})/);
    if (!m) return null;
    let v = m[1];
    if (/\./.test(v) && v.split(".").length > 2) v = v.replace(/\./g, "");
    v = parseFloat(String(v).replace(",", "."));
    if (m[2]) v *= 1e6;
    return v >= 1e5 ? v : null;
  }
  function search(t) {
    const brands = [...new Set(stock().map(c => c.brand))];
    let brand = brands.find(b => t.includes(norm(b))) || Object.entries(BRAND_ALIAS).find(([k]) => new RegExp("\\b" + k + "\\b").test(t))?.[1];
    let types = null; for (const [re, ty] of TYPE_WORDS) if (re.test(t)) { types = ty; break; }
    const budget = /(hasta|menos de|maximo|presupuesto|tengo)/.test(t) ? parseBudget(t) : null;
    const y = t.match(/\b(20[0-2]\d)\b/); const minYear = y ? +y[1] : (/\b(nuevo|ultimo modelo|reciente)\b/.test(t) ? 2022 : 0);
    const okm = /\b0 ?km\b/.test(t);
    const fewKm = /poco[s]? ?km|pocos kilometros/.test(t);
    // modelo puntual (ej: "hilux", "amarok", "cruze")
    const model = stock().find(c => c.name.split(" ").some(w => w.length > 2 && new RegExp("\\b" + norm(w) + "\\b").test(t) && !/^(at|mt|cvt|1\.\d|2\.\d)$/i.test(w)));
    if (!brand && !types && !budget && !minYear && !okm && !fewKm && !model) return null;
    let l = stock().filter(c =>
      (!brand || c.brand === brand) && (!types || types.includes(c.type)) &&
      (!budget || (c.price && c.price <= budget)) && (!minYear || c.year >= minYear) && (!okm || c.km === 0));
    if (model && !types && !budget) l = l.filter(c => c.name === model.name || c.brand === brand);
    if (fewKm) l.sort((a, b) => (a.km ?? 9e9) - (b.km ?? 9e9));
    else l.sort((a, b) => (b.featured ? 1 : 0) - (a.featured ? 1 : 0) || b.year - a.year);
    return { list: l, brand, types, budget, minYear, okm };
  }
  function cuotaEj(precio) {
    const fin = precio * .6, i = .45 / 12, n = 36;
    return fin * i / (1 - Math.pow(1 + i, -n));
  }

  function localReply(raw) {
    const t = norm(raw);
    if (/^(hola|buenas|buen dia|buenas tardes|buenas noches|que tal|hey)\b/.test(t) && t.length < 25)
      return { text: "¡Hola! 👋 Soy el asesor virtual de Grupo Amplifia. ¿Qué tipo de auto estás buscando? Contame tu presupuesto o para qué lo vas a usar y te muestro opciones del stock.", chips: ["Busco una SUV", "Algo hasta 10 millones", "Pickups", "¿Cómo es la financiación?"] };
    if (/(asesor|vendedor|humano|persona|hablar con alguien|whatsapp|llamar|telefono|numero|contacto)/.test(t))
      return { text: `Te paso con un vendedor por WhatsApp (${INFO.whatsapp}) y te atiende al toque. También podés llamar al ${INFO.telefono}.`, wa: "Hola Grupo Amplifia! Vengo del asesor de la web y quiero hablar con un vendedor." };
    if (/(donde|direccion|ubicacion|llegar|mapa|sucursal|agencia|visitar|horario|abren|atienden)/.test(t))
      return { text: `Estamos en <b>Av. Principal 123</b>, tu ciudad. Coordinamos una visita y una prueba de manejo.`, links: [], chips: ["Reservar prueba de manejo"] };
    if (/(prueba de manejo|probarlo|test drive|reservar|reserva)/.test(t))
      return { text: "¡Buenísimo! Te reservamos la prueba de manejo por WhatsApp: decinos qué auto y qué día te queda cómodo.", wa: "Hola Grupo Amplifia! Quiero reservar una prueba de manejo." };
    if (/(usado|tasar|tasacion|vender mi|vendo mi|parte de pago|permuta|consign|entregar mi)/.test(t))
      return { text: "Tu usado vale como parte de pago 🙌 La tasación es <b>gratis y sin compromiso</b>: mandanos fotos, marca, modelo, año y km por WhatsApp, te pasamos un valor y podés salir con tu auto nuevo en el día. Si preferís, lo vendemos por vos en consignación.", wa: "Hola Grupo Amplifia! Quiero tasar mi usado. Es un ...", chips: ["¿Cómo es la financiación?", "Ver SUVs"] };
    const budget = parseBudget(t);
    if (/(financ|cuota|credito|prendario|interes|tasa|plan|pagar en)/.test(t)) {
      let txt = `Financiamos <b>hasta el 100%</b> con crédito prendario, de 12 a 60 cuotas y con aprobación rápida. Tu usado también suma como entrega.`;
      if (budget) txt += ` Por ejemplo, un auto de ${money(budget)} con 40% de entrega queda en unas <b>36 cuotas de ${money(cuotaEj(budget))}</b> (valor de referencia).`;
      return { text: txt, chips: ["Simular mi cuota", "Autos hasta 10 millones", "Hablar con un asesor"] };
    }
    if (/(garantia|revisad|confiable|seguro|papeles|transferencia)/.test(t))
      return { text: INFO.garantia + " Además te acompañamos con la gestoría y la transferencia.", chips: ["Ver destacados", "Hablar con un asesor"] };
    const r = search(t);
    if (r) {
      if (!r.list.length) return { text: "Ahora no tengo una unidad exacta con eso, pero entran autos todas las semanas. ¿Querés que un vendedor te avise cuando llegue?", wa: `Hola Grupo Amplifia! Estoy buscando: ${raw}. ¿Me avisan si entra algo?`, chips: ["Ver todo el stock"] };
      const n = r.list.length;
      let intro = n === 1 ? "Tengo esta unidad que te puede interesar:" : `Tengo <b>${n} opciones</b> para vos. Te muestro las mejores:`;
      if (r.budget) intro = `Con ${money(r.budget)} de entrega te muestro ${n === 1 ? "esta opción" : "estas opciones"}:`;
      return { text: intro, cars: r.list.slice(0, 4), more: n > 4 ? r : null, chips: ["¿Cómo es la financiación?", "Reservar prueba de manejo"] };
    }
    if (/(stock|que tienen|que autos|disponible|catalogo|ver autos|destacad)/.test(t)) {
      const l = stock().filter(c => c.featured).slice(0, 4);
      return { text: `Hoy tenemos <b>${stock().length} unidades</b> listas para entregar. Estas son las destacadas:`, cars: l, chips: ["Busco una SUV", "Pickups", "Algo hasta 10 millones"] };
    }
    if (/(gracias|genial|perfecto|dale|buenisimo)/.test(t))
      return { text: "¡Gracias a vos! Cuando quieras, te esperamos en la agencia o seguimos por WhatsApp. 🚗", wa: "Hola Grupo Amplifia! Vengo del asesor de la web." };
    return { text: "Te puedo ayudar a encontrar tu auto, simular cuotas o tasar tu usado. Contame qué buscás (por ejemplo: <i>“una SUV hasta 15 millones”</i> o <i>“una pickup 4x4”</i>).", chips: ["Busco una SUV", "Pickups", "Algo hasta 10 millones", "Tasar mi usado"] };
  }

  /* ---------- Interfaz ---------- */
  const SPARK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="M12 3l1.8 4.9L19 9.7l-5.2 1.8L12 16.5l-1.8-5L5 9.7l5.2-1.8z"/><path d="M19 15l.8 2.1L22 18l-2.2.8L19 21l-.8-2.2L16 18l2.2-.9z"/></svg>';
  const root = document.createElement("div");
  root.className = "asst";
  root.innerHTML = `
    <div class="asst-tip" id="asstTip"><button aria-label="Cerrar">×</button>¿Te ayudo a encontrar tu próximo auto?</div>
    <button class="asst-fab" id="asstFab" aria-label="Abrir asesor virtual">${SPARK}<span>Asesor Amplifia</span></button>
    <section class="asst-panel" id="asstPanel" aria-label="Asesor virtual Grupo Amplifia" aria-hidden="true">
      <header class="asst-h">
        <div class="asst-av">${SPARK}</div>
        <div class="asst-ht"><b>Asesor Grupo Amplifia</b><small><i></i>En línea · responde al instante</small></div>
        <button class="asst-x" id="asstClose" aria-label="Cerrar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <div class="asst-body" id="asstBody"></div>
      <form class="asst-f" id="asstForm" autocomplete="off">
        <input id="asstIn" placeholder="Escribí tu consulta…" aria-label="Tu consulta">
        <button aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </form>
      <div class="asst-note">Asistente virtual · para cerrar la compra te derivamos a un vendedor</div>
    </section>`;
  document.body.appendChild(root);
  const $ = id => document.getElementById(id);
  const body = $("asstBody"), panel = $("asstPanel");
  const history = [];
  let opened = false;

  function bubble(html, who) {
    const d = document.createElement("div");
    d.className = "msg " + who; d.innerHTML = html; body.appendChild(d);
    body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
    return d;
  }
  function carCard(c) {
    const img = (c.photos && c.photos[0]) || "img/favicon.png";
    return `<div class="asst-car" data-id="${c.id}">
      <img src="${img}" alt="">
      <div><b>${c.brand} ${c.name}</b><small>${c.year} · ${km(c.km)}</small>
      <span class="p">${c.price ? money(c.price) + " <em>entrega + cuotas</em>" : "Consultá el precio"}</span>
      <div class="r"><button type="button" data-act="ver">Ver fotos</button><a href="${waLink(`Hola Grupo Amplifia! Me interesa el ${c.brand} ${c.name} ${c.year}. ¿Sigue disponible?`)}" target="_blank" rel="noopener">Lo quiero</a></div></div></div>`;
  }
  function render(r) {
    let h = `<p>${r.text}</p>`;
    if (r.cars) h += `<div class="asst-cars">${r.cars.map(carCard).join("")}</div>`;
    if (r.more) h += `<button type="button" class="asst-more" data-more='${JSON.stringify({ t: r.more.types ? r.more.types[0] : "", b: r.more.brand || "", y: r.more.minYear || 0 })}'>Ver las ${r.more.list.length} en el stock →</button>`;
    if (r.links) h += r.links.map(([l, u]) => `<a class="asst-link" href="${u}" target="_blank" rel="noopener">${l} ↗</a>`).join("");
    if (r.wa) h += `<a class="asst-wa" href="${waLink(r.wa)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.3 23.7l6.1-1.6A11.8 11.8 0 0 0 23.8 12a11.7 11.7 0 0 0-3.3-8.5ZM12 21.6a9.7 9.7 0 0 1-5-1.4l-.3-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.6z"/></svg>Seguir por WhatsApp</a>`;
    bubble(h, "bot");
    if (r.chips) { const c = document.createElement("div"); c.className = "asst-chips"; c.innerHTML = r.chips.map(x => `<button type="button">${x}</button>`).join(""); body.appendChild(c); }
    body.scrollTo({ top: body.scrollHeight, behavior: "smooth" });
  }
  async function ask(text) {
    body.querySelectorAll(".asst-chips").forEach(c => c.remove());
    bubble(text.replace(/</g, "&lt;"), "me");
    history.push({ role: "user", content: text });
    const typing = bubble("<span class='dots'><i></i><i></i><i></i></span>", "bot typing");
    let r;
    try {
      if (ASSISTANT_ENDPOINT) {
        const res = await fetch(ASSISTANT_ENDPOINT, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ system: systemPrompt(), messages: history }) });
        const data = await res.json();
        r = { text: (data.reply || "").replace(/\n/g, "<br>"), chips: ["Hablar con un asesor"] };
      } else {
        await new Promise(ok => setTimeout(ok, 650 + Math.random() * 500));
        r = localReply(text);
      }
    } catch (e) { r = { text: "Uy, se cortó la conexión. Seguimos por WhatsApp así no perdés tiempo:", wa: "Hola Grupo Amplifia! " + text }; }
    typing.remove();
    history.push({ role: "assistant", content: r.text.replace(/<[^>]+>/g, "") });
    render(r);
  }
  function open() {
    panel.classList.add("on"); panel.setAttribute("aria-hidden", "false"); root.classList.add("open"); $("asstTip").classList.remove("on");
    if (!opened) { opened = true; setTimeout(() => render(localReply("hola")), 250); }
    setTimeout(() => $("asstIn").focus({ preventScroll: true }), 300);
  }
  function close() { panel.classList.remove("on"); panel.setAttribute("aria-hidden", "true"); root.classList.remove("open"); }
  $("asstFab").onclick = () => panel.classList.contains("on") ? close() : open();
  $("asstClose").onclick = close;
  $("asstForm").onsubmit = e => { e.preventDefault(); const v = $("asstIn").value.trim(); if (!v) return; $("asstIn").value = ""; ask(v); };
  body.addEventListener("click", e => {
    const chip = e.target.closest(".asst-chips button");
    if (chip) {
      const t = chip.textContent;
      if (t === "Simular mi cuota") { close(); document.getElementById("financiacion").scrollIntoView(); return; }
      if (t === "Ver todo el stock") { close(); document.getElementById("stock").scrollIntoView(); return; }
      return ask(t);
    }
    const ver = e.target.closest('[data-act="ver"]');
    if (ver && typeof openCar === "function") { const c = stock().find(x => x.id === ver.closest(".asst-car").dataset.id); if (c) openCar(c); return; }
    const more = e.target.closest(".asst-more");
    if (more && typeof setFilters === "function") { const m = JSON.parse(more.dataset.more); close(); setFilters(m.t, m.b, m.y); document.getElementById("stock").scrollIntoView(); }
  });
  addEventListener("keydown", e => { if (e.key === "Escape" && panel.classList.contains("on")) close(); });
  $("asstTip").querySelector("button").onclick = e => { e.stopPropagation(); $("asstTip").classList.remove("on"); };
  $("asstTip").onclick = open;
  setTimeout(() => { if (!opened) $("asstTip").classList.add("on"); }, 7000);

  window.DEMO_ASSISTANT = { systemPrompt, open, ask, localReply, search };
})();
