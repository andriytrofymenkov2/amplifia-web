/* =====================================================================
   "Ampli", asistente virtual
   ---------------------------------------------------------------------
   Acompaña al visitante por la página, saca turnos paso a paso (arma el
   mensaje de WhatsApp listo para enviar) y orienta según el síntoma.
   Modo demo: responde en el navegador. Para IA real, completar ENDPOINT
   con un servidor propio (p. ej. Cloudflare Worker) que llame a la API de
   Claude; la clave NUNCA va en este archivo.
   ===================================================================== */
(function () {
  const ENDPOINT = '';
  const WA = '5490000000000';
  const I = window.I18N || { lang: 'es', on() {} };
  const L = () => I.lang;
  const norm = s => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');

  /* ---------- textos ---------- */
  const S = {
    es: {
      name: 'Ampli', role: 'Asistente de Grupo Amplifia · responde al instante', ph: 'Escribí tu consulta…', note: 'Asistente virtual · el turno se confirma por WhatsApp',
      fab: 'Asistente', hello: '¡Hola! Soy <b>Ampli</b> 🔧, el asistente de Grupo Amplifia. Te ayudo a sacar turno, a saber qué le puede pasar a tu moto o a recorrer la página. ¿Qué necesitás?',
      chips: ['Sacar turno', 'Mi moto tiene un problema', 'Estoy de viaje', 'Tienda', 'Cómo llegar'],
      tips: { hero: '¿Te ayudo a sacar turno? Lo armamos en 30 segundos.', servicios: '¿No sabés qué tiene tu moto? Contame el síntoma y te oriento.', viajeros: '¿Estás de viaje? Te consigo turno exprés.', tienda: '¿Buscás una herramienta, un generador o un repuesto? Tocá una foto para verla en grande.', contacto: '¿Te paso cómo llegar al taller?' },
      t1: '¡Vamos! ¿Qué vas a traer al taller?', t1o: ['Moto', 'Cuatriciclo / UTV', 'Grupo electrógeno'],
      t2: 'Perfecto. ¿Marca, modelo y año? (por ejemplo: <i>Royal Enfield Himalayan 2022</i>)',
      t3: '¿Qué necesitás que le hagamos?', t3o: ['Service', 'Diagnóstico / falla', 'Motor', 'Frenos / suspensión', 'Otro'],
      t4: '¿Para cuándo?', t4o: ['Lo antes posible', 'Esta semana', 'La semana que viene', 'Estoy de viaje (exprés)'],
      t5: 'Último dato: ¿cómo te llamás?',
      t6: n => `Listo, ${n}. Este es tu pedido de turno. Tocá el botón y se abre WhatsApp con el mensaje armado: el taller te confirma día y horario.`,
      sum: ['Vehículo', 'Modelo', 'Trabajo', 'Cuándo', 'Nombre'], send: 'Enviar pedido por WhatsApp', restart: 'Empezar de nuevo',
      waT: d => `Hola Grupo Amplifia! Quiero pedir un turno.\n• Vehículo: ${d[0]}\n• Modelo: ${d[1]}\n• Trabajo: ${d[2]}\n• Cuándo: ${d[3]}\n• Nombre: ${d[4]}`,
      where: 'Estamos en <b>Av. Principal 123</b>, tu ciudad.', go: 'Cómo llegar', seeMap: 'Ver el mapa',
      hours: 'Los horarios te los confirmamos por WhatsApp, así coordinamos para que te atiendan apenas llegues.',
      price: 'Depende de la moto y del trabajo. Te pasamos <b>diagnóstico y presupuesto por WhatsApp antes de tocar nada</b>.',
      travel: 'Si estás de viaje (a Ushuaia, Chile o de vuelta al norte) te damos prioridad: revisión pre-viaje 360°, aceite, cadena, cubiertas y frenos. Escribinos con tu ubicación y modelo.',
      shop: 'En la tienda tenemos <b>herramientas Motion Pro, grupos electrógenos y repuestos</b>. Tocá cualquier producto para verlo en grande y consultar stock.',
      harley: 'Sí, trabajamos <b>Harley-Davidson</b> y V-twin: service, puesta a punto, motor y transmisión.',
      gen: 'Hacemos <b>service y reparación de grupos electrógenos</b> y también vendemos. ¿Querés traer uno o consultar por un equipo?',
      atv: 'Atendemos <b>cuatriciclos y UTV</b> (Can-Am y otras marcas): mantenimiento, transmisión CVT y diferenciales.',
      thanks: '¡Gracias a vos! Cualquier cosa, acá estoy. 🏍️', human: 'Te paso con el taller por WhatsApp:', waBtn: 'Hablar por WhatsApp',
      fallback: 'Te puedo ayudar a <b>sacar turno</b>, orientarte con una <b>falla</b>, o mostrarte <b>servicios</b>, la <b>tienda</b> y <b>cómo llegar</b>.',
      goSvc: 'Ver servicios', goTravel: 'Sección viajeros', goShop: 'Ir a la tienda', book: 'Sacar turno',
      sym: [
        [/(no arranca|no prende|no enciende|arranque|bateria|burro)/, 'Si no arranca, lo más común es <b>batería, arranque o alimentación</b>. Lo revisamos con escáner y multímetro para no cambiar piezas a ciegas.', 'Diagnóstico / falla'],
        [/(ruido|golpe|cascabel|traquet|suena)/, 'Un ruido nuevo puede ser <b>cadena, válvulas o rodamientos</b>. Mejor no seguir viajando largo sin revisarla.', 'Diagnóstico / falla'],
        [/(freno|frena|pastilla|disco|esponj)/, 'Si el freno está esponjoso o chilla, puede ser <b>líquido, pastillas o discos</b>. Es seguridad: conviene revisarlo ya.', 'Frenos / suspensión'],
        [/(humo|pierde aceite|consume aceite|perdida|gotea)/, 'Humo o pérdidas de aceite pueden venir de <b>retenes, juntas o aros</b>. Lo desarmamos, medimos y te decimos qué conviene.', 'Motor'],
        [/(service|mantenimiento|aceite|filtro|km)/, 'Hacemos el <b>service según manual de fábrica</b>: aceite, filtros, luz de válvulas y sincronización.', 'Service'],
        [/(tirones|se corta|ahoga|falla|ralenti|inyeccion|carbur)/, 'Tirones o cortes suelen ser <b>inyección/carburación, bujías o filtro</b>. Lo diagnosticamos antes de tocar nada.', 'Diagnóstico / falla'],
        [/(suspension|horquilla|amortigu|reten)/, 'Para la suspensión hacemos <b>retenes, aceite de horquilla y rodamientos</b>, pensados para el ripio patagónico.', 'Frenos / suspensión'],
      ],
    },
    en: {
      name: 'Ampli', role: 'Grupo Amplifia assistant · instant replies', ph: 'Type your question…', note: 'Virtual assistant · bookings are confirmed on WhatsApp',
      fab: 'Assistant', hello: 'Hi! I\'m <b>Ampli</b> 🔧, Ride\'s assistant. I can book you a service, help you figure out what\'s wrong with your bike or show you around. What do you need?',
      chips: ['Book a service', 'My bike has a problem', 'I\'m traveling', 'Shop', 'Directions'],
      tips: { hero: 'Want to book a service? Takes 30 seconds.', servicios: 'Not sure what\'s wrong with your bike? Tell me the symptom.', viajeros: 'On a road trip? I can get you an express slot.', tienda: 'Looking for a tool, a generator or a part? Tap a photo to see it bigger.', contacto: 'Want directions to the workshop?' },
      t1: 'Let\'s go! What are you bringing in?', t1o: ['Motorcycle', 'ATV / UTV', 'Generator'],
      t2: 'Great. Make, model and year? (e.g. <i>Royal Enfield Himalayan 2022</i>)',
      t3: 'What do you need done?', t3o: ['Service', 'Diagnosis / fault', 'Engine', 'Brakes / suspension', 'Other'],
      t4: 'When?', t4o: ['As soon as possible', 'This week', 'Next week', 'I\'m traveling (express)'],
      t5: 'Last thing: what\'s your name?',
      t6: n => `Done, ${n}. Here's your booking request. Tap the button and WhatsApp opens with the message ready: the workshop will confirm day and time.`,
      sum: ['Vehicle', 'Model', 'Job', 'When', 'Name'], send: 'Send request on WhatsApp', restart: 'Start over',
      waT: d => `Hi Grupo Amplifia! I'd like to book a service.\n• Vehicle: ${d[0]}\n• Model: ${d[1]}\n• Job: ${d[2]}\n• When: ${d[3]}\n• Name: ${d[4]}`,
      where: 'We are at <b>Av. Principal 123</b>, your city.', go: 'Get directions', seeMap: 'See the map',
      hours: 'We\'ll confirm opening hours on WhatsApp so someone is ready for you when you arrive.',
      price: 'It depends on the bike and the job. We send you the <b>diagnosis and quote on WhatsApp before touching anything</b>.',
      travel: 'If you\'re on a road trip (to Ushuaia, Chile or back north) we give you priority: 360° pre-trip check, oil, chain, tires and brakes. Message us with your location and model.',
      shop: 'Our shop has <b>Motion Pro tools, generators and parts</b>. Tap any product to see it bigger and check stock.',
      harley: 'Yes, we work on <b>Harley-Davidson</b> and V-twins: service, tune-ups, engine and transmission.',
      gen: 'We <b>service and repair generators</b> and sell them too. Want to bring one in or ask about a unit?',
      atv: 'We work on <b>ATVs and UTVs</b> (Can-Am and other brands): maintenance, CVT and differentials.',
      thanks: 'Thank you! I\'m here if you need anything. 🏍️', human: 'Here\'s the workshop on WhatsApp:', waBtn: 'Chat on WhatsApp',
      fallback: 'I can help you <b>book a service</b>, look into a <b>fault</b>, or show you <b>services</b>, the <b>shop</b> and <b>directions</b>.',
      goSvc: 'See services', goTravel: 'Travelers section', goShop: 'Go to the shop', book: 'Book a service',
      sym: [
        [/(won.?t start|doesn.?t start|no start|battery|starter)/, 'If it won\'t start, it\'s usually the <b>battery, starter or fuel supply</b>. We check it with scanner and multimeter, no guesswork.', 'Diagnosis / fault'],
        [/(noise|knock|rattle|ticking|clunk)/, 'A new noise can be the <b>chain, valves or bearings</b>. Better not to ride far before we check it.', 'Diagnosis / fault'],
        [/(brake|pads|disc|spongy)/, 'Spongy or squealing brakes can be <b>fluid, pads or discs</b>. It\'s safety: get it checked now.', 'Brakes / suspension'],
        [/(smoke|oil leak|leak|burning oil)/, 'Smoke or oil leaks may come from <b>seals, gaskets or rings</b>. We strip it down, measure and tell you the best option.', 'Engine'],
        [/(service|maintenance|oil change|filter)/, 'We do <b>factory-schedule service</b>: oil, filters, valve clearance and sync.', 'Service'],
        [/(stall|hesitat|misfire|idle|injection|carb)/, 'Stalling or hesitation is usually <b>fuel injection/carb, plugs or filter</b>. We diagnose before touching anything.', 'Diagnosis / fault'],
        [/(suspension|fork|shock|seal)/, 'For suspension we do <b>fork seals, fork oil and bearings</b>, set up for Patagonian gravel.', 'Brakes / suspension'],
      ],
    },
    pt: {
      name: 'Ampli', role: 'Assistente da Grupo Amplifia · responde na hora', ph: 'Escreva a sua dúvida…', note: 'Assistente virtual · o agendamento é confirmado pelo WhatsApp',
      fab: 'Assistente', hello: 'Olá! Sou o <b>Ampli</b> 🔧, assistente da Grupo Amplifia. Posso agendar um serviço, ajudar a entender o que a sua moto tem ou mostrar a página. Do que você precisa?',
      chips: ['Agendar serviço', 'Minha moto tem um problema', 'Estou viajando', 'Loja', 'Como chegar'],
      tips: { hero: 'Quer agendar um serviço? Leva 30 segundos.', servicios: 'Não sabe o que a sua moto tem? Me conte o sintoma.', viajeros: 'Está viajando? Consigo um horário expresso.', tienda: 'Procurando ferramenta, gerador ou peça? Toque numa foto para ampliar.', contacto: 'Quer saber como chegar à oficina?' },
      t1: 'Vamos lá! O que você vai trazer?', t1o: ['Moto', 'Quadriciclo / UTV', 'Gerador'],
      t2: 'Ótimo. Marca, modelo e ano? (ex.: <i>Royal Enfield Himalayan 2022</i>)',
      t3: 'O que precisa ser feito?', t3o: ['Revisão', 'Diagnóstico / falha', 'Motor', 'Freios / suspensão', 'Outro'],
      t4: 'Para quando?', t4o: ['O quanto antes', 'Esta semana', 'Semana que vem', 'Estou viajando (expresso)'],
      t5: 'Último dado: qual é o seu nome?',
      t6: n => `Pronto, ${n}. Este é o seu pedido. Toque no botão e o WhatsApp abre com a mensagem pronta: a oficina confirma dia e horário.`,
      sum: ['Veículo', 'Modelo', 'Serviço', 'Quando', 'Nome'], send: 'Enviar pedido pelo WhatsApp', restart: 'Começar de novo',
      waT: d => `Olá Grupo Amplifia! Quero agendar um serviço.\n• Veículo: ${d[0]}\n• Modelo: ${d[1]}\n• Serviço: ${d[2]}\n• Quando: ${d[3]}\n• Nome: ${d[4]}`,
      where: 'Estamos na <b>Av. Principal 123</b>, sua cidade.', go: 'Como chegar', seeMap: 'Ver o mapa',
      hours: 'Confirmamos os horários pelo WhatsApp, assim você é atendido assim que chegar.',
      price: 'Depende da moto e do serviço. Enviamos <b>diagnóstico e orçamento pelo WhatsApp antes de mexer em qualquer coisa</b>.',
      travel: 'Se você está viajando (para Ushuaia, Chile ou voltando para o norte) damos prioridade: revisão pré-viagem 360°, óleo, corrente, pneus e freios. Mande sua localização e modelo.',
      shop: 'Na loja temos <b>ferramentas Motion Pro, geradores e peças</b>. Toque em qualquer produto para ampliar e consultar estoque.',
      harley: 'Sim, trabalhamos com <b>Harley-Davidson</b> e V-twin: revisão, regulagem, motor e transmissão.',
      gen: 'Fazemos <b>revisão e conserto de geradores</b> e também vendemos. Quer trazer um ou consultar um equipamento?',
      atv: 'Atendemos <b>quadriciclos e UTVs</b> (Can-Am e outras marcas): manutenção, CVT e diferenciais.',
      thanks: 'Obrigado! Estou por aqui. 🏍️', human: 'Fale com a oficina pelo WhatsApp:', waBtn: 'Falar no WhatsApp',
      fallback: 'Posso ajudar a <b>agendar um serviço</b>, entender uma <b>falha</b> ou mostrar os <b>serviços</b>, a <b>loja</b> e <b>como chegar</b>.',
      goSvc: 'Ver serviços', goTravel: 'Seção viajantes', goShop: 'Ir para a loja', book: 'Agendar serviço',
      sym: [
        [/(nao liga|nao pega|nao da partida|bateria|partida)/, 'Se não pega, o mais comum é <b>bateria, motor de partida ou alimentação</b>. Verificamos com scanner e multímetro.', 'Diagnóstico / falha'],
        [/(barulho|ruido|batida|estalo)/, 'Um barulho novo pode ser <b>corrente, válvulas ou rolamentos</b>. Melhor não rodar longe antes de revisar.', 'Diagnóstico / falha'],
        [/(freio|pastilha|disco|esponjoso)/, 'Freio esponjoso ou chiando pode ser <b>fluido, pastilhas ou discos</b>. É segurança: revise já.', 'Freios / suspensão'],
        [/(fumaca|vazamento|vaza|oleo)/, 'Fumaça ou vazamento de óleo pode vir de <b>retentores, juntas ou anéis</b>. Desmontamos, medimos e dizemos o melhor caminho.', 'Motor'],
        [/(revisao|manutencao|troca de oleo|filtro)/, 'Fazemos a <b>revisão conforme o manual de fábrica</b>: óleo, filtros, folga de válvulas e sincronização.', 'Revisão'],
        [/(falhando|engasga|morre|marcha lenta|injecao|carbur)/, 'Engasgos ou falhas costumam ser <b>injeção/carburação, velas ou filtro</b>. Diagnosticamos antes de mexer.', 'Diagnóstico / falha'],
        [/(suspensao|bengala|amortecedor|retentor)/, 'Na suspensão fazemos <b>retentores, óleo de bengala e rolamentos</b>, pensados para o cascalho patagônico.', 'Freios / suspensão'],
      ],
    },
  };
  const s = () => S[L()] || S.es;
  const waLink = t => `https://wa.me/${WA}?text=${encodeURIComponent(t)}`;
  const MAPS = 'https://www.google.com/maps/dir/?api=1&destination=Av.+Principal+123';

  /* ---------- pistón + biela animados (SVG) ---------- */
  const AMPLI = `<svg class="pz" viewBox="0 0 48 48" aria-hidden="true">
    <path class="pz-cyl" d="M12 4v22M36 4v22" />
    <g class="pz-p"><rect x="13.5" y="0" width="21" height="12" rx="2"/><path class="pz-ring" d="M13.5 3.5h21M13.5 6.5h21"/><circle class="pz-pin" cx="24" cy="8" r="1.8"/></g>
    <line class="pz-rod" x1="24" y1="8" x2="24" y2="34"/>
    <circle class="pz-crank" cx="24" cy="36" r="7"/><circle class="pz-cp" cx="24" cy="31" r="2.2"/>
  </svg>`;

  const root = document.createElement('div');
  root.className = 'pst';
  root.innerHTML = `
    <div class="pst-tip" id="pstTip"><button aria-label="×">×</button><span></span></div>
    <button class="pst-fab" id="pstFab" aria-label="Ampli">${AMPLI}<span class="pst-fab__t"></span></button>
    <section class="pst-panel" id="pstPanel" aria-hidden="true">
      <header class="pst-h">
        <div class="pst-av">${AMPLI}</div>
        <div class="pst-ht"><b></b><small><i></i><span></span></small></div>
        <button class="pst-x" id="pstClose" aria-label="×"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M6 6l12 12M18 6L6 18"/></svg></button>
      </header>
      <div class="pst-body" id="pstBody"></div>
      <form class="pst-f" id="pstForm" autocomplete="off">
        <input id="pstIn" aria-label="Mensaje">
        <button aria-label="Enviar"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2"><path d="M5 12h14M13 6l6 6-6 6"/></svg></button>
      </form>
      <div class="pst-note"></div>
    </section>`;
  document.body.appendChild(root);
  const $ = sel => root.querySelector(sel);
  const body = $('#pstBody'), panel = $('#pstPanel'), tip = $('#pstTip');
  function paint() {
    $('.pst-fab__t').textContent = s().fab;
    $('.pst-ht b').textContent = s().name;
    $('.pst-ht small span').textContent = s().role;
    $('#pstIn').placeholder = s().ph;
    $('.pst-note').textContent = s().note;
  }
  paint();

  // animación del mecanismo: el cigüeñal gira, la biela empuja el pistón
  const pzs = [...root.querySelectorAll('.pz')];
  let ang = 0, speed = 2.2;
  (function spin() {
    ang += speed * 0.016 * 3;
    const r = 5, L = 22, sx = Math.sin(ang) * r, sy = -Math.cos(ang) * r;
    const pinY = 36 + sy - Math.sqrt(L * L - sx * sx);
    for (const z of pzs) {
      z.querySelector('.pz-cp').setAttribute('cx', 24 + sx); z.querySelector('.pz-cp').setAttribute('cy', 36 + sy);
      const rod = z.querySelector('.pz-rod'); rod.setAttribute('x1', 24); rod.setAttribute('y1', pinY); rod.setAttribute('x2', 24 + sx); rod.setAttribute('y2', 36 + sy);
      z.querySelector('.pz-p').setAttribute('transform', `translate(0 ${pinY - 8})`);
    }
    requestAnimationFrame(spin);
  })();

  /* ---------- chat ---------- */
  let flow = null; // pasos del turno
  function bubble(html, who) {
    const d = document.createElement('div'); d.className = 'm ' + who; d.innerHTML = html; body.appendChild(d);
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' }); return d;
  }
  function chips(list) {
    body.querySelectorAll('.pst-chips').forEach(c => c.remove());
    if (!list || !list.length) return;
    const c = document.createElement('div'); c.className = 'pst-chips';
    c.innerHTML = list.map(x => `<button type="button">${x}</button>`).join(''); body.appendChild(c);
    body.scrollTo({ top: body.scrollHeight, behavior: 'smooth' });
  }
  function say(r) {
    let h = `<p>${r.text}</p>`;
    if (r.summary) h += `<dl class="pst-sum">${r.summary.map(([k, v]) => `<dt>${k}</dt><dd>${v}</dd>`).join('')}</dl>`;
    if (r.links) h += r.links.map(([l, u, cls]) => `<a class="pst-link ${cls || ''}" href="${u}" ${u.startsWith('#') ? '' : 'target="_blank" rel="noopener"'}>${l}</a>`).join('');
    if (r.wa) h += `<a class="pst-wa" href="${waLink(r.wa)}" target="_blank" rel="noopener"><svg viewBox="0 0 24 24" fill="currentColor"><path d="M20.5 3.5A11.8 11.8 0 0 0 1.9 17.7L.3 23.7l6.1-1.6A11.8 11.8 0 0 0 23.8 12a11.7 11.7 0 0 0-3.3-8.5ZM12 21.6a9.7 9.7 0 0 1-5-1.4l-.3-.2-3.7 1 1-3.6-.2-.4A9.8 9.8 0 1 1 12 21.6z"/></svg>${r.waLabel || s().waBtn}</a>`;
    bubble(h, 'bot'); chips(r.chips);
  }
  function startBooking() { flow = { step: 1, d: [] }; return { text: s().t1, chips: s().t1o }; }
  function bookingStep(text) {
    const st = s(); flow.d.push(text.replace(/</g, '&lt;'));
    flow.step++;
    if (flow.step === 2) return { text: st.t2 };
    if (flow.step === 3) return { text: st.t3, chips: st.t3o };
    if (flow.step === 4) return { text: st.t4, chips: st.t4o };
    if (flow.step === 5) return { text: st.t5 };
    const d = flow.d; flow = null;
    return { text: st.t6(d[4]), summary: st.sum.map((k, i) => [k, d[i]]), wa: st.waT(d), waLabel: st.send, chips: [st.restart] };
  }
  function reply(raw) {
    const st = s(), t = norm(raw);
    if (flow) return bookingStep(raw);
    if (st.chips[0] === raw || st.restart === raw || st.book === raw || /(turno|reserv|book|appoint|agendar|agend|horario disponible)/.test(t)) return startBooking();
    if (raw === st.chips[1]) return { text: L() === 'en' ? 'Tell me what it does (e.g. "won\'t start", "noise when braking", "oil leak").' : L() === 'pt' ? 'Me conte o que ela faz (ex.: "não pega", "barulho ao frear", "vazamento de óleo").' : 'Contame qué hace (por ejemplo: "no arranca", "ruido al frenar", "pierde aceite").' };
    for (const [re, txt, svc] of st.sym) if (re.test(t)) return { text: txt, chips: [st.book, st.goSvc] , svc };
    if (raw === st.chips[2] || /(viaj|ruta|ushuaia|chile|travel|trip|route|viagem|rota)/.test(t)) return { text: st.travel, wa: I18N.t ? I18N.t('wa.viajero') : '', chips: [st.book, st.goTravel] };
    if (raw === st.chips[3] || /(tienda|shop|loja|herramient|tool|ferrament|motion|repuest|part|peca|comprar|buy)/.test(t)) return { text: st.shop, chips: [st.goShop] };
    if (raw === st.chips[4] || /(donde|direccion|ubicacion|llegar|mapa|where|address|direction|map|onde|endereco|chegar)/.test(t)) return { text: st.where, links: [[st.go + ' ↗', MAPS, 'red'], [st.seeMap, '#contacto']] };
    if (/(horario|abren|atienden|hours|open|horario)/.test(t)) return { text: st.hours, wa: I18N.t('wa.hola') };
    if (/(precio|cuanto|cuesta|presupuesto|price|cost|quote|preco|quanto|orcamento)/.test(t)) return { text: st.price, chips: [st.book] };
    if (/(harley|v-?twin|davidson)/.test(t)) return { text: st.harley, chips: [st.book] };
    if (/(generador|grupo|electrogeno|generator|gerador)/.test(t)) return { text: st.gen, chips: [st.goShop, st.book] };
    if (/(cuatri|atv|utv|can-?am|quad|quadric)/.test(t)) return { text: st.atv, chips: [st.book] };
    if (/(servicio|services|servicos|que hacen|what do you)/.test(t) || raw === st.goSvc) return { nav: '#servicios' };
    if (raw === st.goTravel) return { nav: '#viajeros' };
    if (raw === st.goShop) return { nav: '#tienda' };
    if (/(humano|persona|whatsapp|hablar|telefono|human|person|phone|falar|pessoa)/.test(t)) return { text: st.human, wa: I18N.t('wa.hola') };
    if (/(gracias|genial|thanks|thank|obrigad|perfecto|dale)/.test(t)) return { text: st.thanks };
    if (/^(hola|buenas|hi|hello|hey|ola|oi)\b/.test(t)) return { text: st.hello, chips: st.chips };
    return { text: st.fallback, chips: st.chips };
  }
  async function ask(text) {
    body.querySelectorAll('.pst-chips').forEach(c => c.remove());
    bubble(text.replace(/</g, '&lt;'), 'me');
    let r = reply(text);
    if (r.nav) { close(); document.querySelector(r.nav)?.scrollIntoView({ behavior: 'smooth' }); return; }
    const typing = bubble("<span class='dots'><i></i><i></i><i></i></span>", 'bot typing');
    speed = 9;
    if (ENDPOINT && !flow && !r.summary) {
      try {
        const res = await fetch(ENDPOINT, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ lang: L(), messages: [{ role: 'user', content: text }] }) });
        const data = await res.json(); if (data.reply) r = { text: data.reply };
      } catch (e) {}
    } else await new Promise(ok => setTimeout(ok, 500 + Math.random() * 400));
    speed = 2.2; typing.remove(); say(r);
  }
  let opened = false;
  function open(first) {
    panel.classList.add('on'); panel.setAttribute('aria-hidden', 'false'); root.classList.add('open'); tip.classList.remove('on');
    if (!opened) { opened = true; setTimeout(() => say(first || { text: s().hello, chips: s().chips }), 200); }
    else if (first) say(first);
    if (!matchMedia('(max-width:760px)').matches) setTimeout(() => $('#pstIn').focus({ preventScroll: true }), 300);
  }
  function close() { panel.classList.remove('on'); panel.setAttribute('aria-hidden', 'true'); root.classList.remove('open'); }
  $('#pstFab').onclick = () => panel.classList.contains('on') ? close() : open();
  $('#pstClose').onclick = close;
  $('#pstForm').onsubmit = e => { e.preventDefault(); const v = $('#pstIn').value.trim(); if (!v) return; $('#pstIn').value = ''; ask(v); };
  body.addEventListener('click', e => {
    const c = e.target.closest('.pst-chips button'); if (c) return ask(c.textContent);
    const a = e.target.closest('.pst-link[href^="#"]'); if (a) { e.preventDefault(); close(); document.querySelector(a.getAttribute('href'))?.scrollIntoView({ behavior: 'smooth' }); }
  });
  addEventListener('keydown', e => { if (e.key === 'Escape' && panel.classList.contains('on')) close(); });

  /* ---------- acompaña el recorrido: un consejo por sección (una sola vez) ---------- */
  const seen = new Set(); let tipT, dismissed = 0;
  function showTip(key) {
    if (panel.classList.contains('on') || seen.has(key) || dismissed > 1) return;
    const small = matchMedia('(max-width:760px)').matches;
    if (small && !['viajeros', 'contacto'].includes(key)) return; // en celular, pocos avisos para no tapar contenido
    seen.add(key); tip.dataset.k = key;
    tip.querySelector('span').textContent = s().tips[key];
    tip.classList.add('on'); root.classList.add('talk');
    clearTimeout(tipT); tipT = setTimeout(() => { tip.classList.remove('on'); root.classList.remove('talk'); }, small ? 5000 : 7000);
  }
  tip.querySelector('button').onclick = e => { e.stopPropagation(); tip.classList.remove('on'); root.classList.remove('talk'); dismissed++; };
  tip.onclick = () => {
    const k = tip.dataset.k;
    const first = k === 'hero' ? startBooking() : k === 'viajeros' ? reply(s().chips[2]) : k === 'tienda' ? reply(s().chips[3]) : k === 'contacto' ? reply(s().chips[4]) : k === 'servicios' ? reply(s().chips[1]) : null;
    if (!opened) { opened = true; panel.classList.add('on'); root.classList.add('open'); tip.classList.remove('on'); say({ text: s().hello }); setTimeout(() => say(first), 500); }
    else open(first);
  };
  const ids = { hero: 'hero', servicios: 'servicios', viajeros: 'viajeros', tienda: 'tienda', contacto: 'contacto' };
  const so = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) setTimeout(() => showTip(e.target.id), e.target.id === 'hero' ? 6000 : 900); }), { threshold: 0.45 });
  Object.values(ids).forEach(id => { const el = document.getElementById(id); if (el) so.observe(el); });
  setTimeout(() => root.classList.add('on'), 2500);

  I.on(() => { paint(); if (tip.classList.contains('on')) tip.querySelector('span').textContent = s().tips[tip.dataset.k]; });
  window.DEMO_ASSISTANT = { open, ask, reply };
})();
