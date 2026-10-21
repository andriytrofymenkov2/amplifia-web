// Idiomas (ES / EN / PT). El español sale del HTML; acá van inglés y portugués
// y los textos que arma JavaScript (productos, motor, WhatsApp).
(() => {
  const D = {
    en: {
      'loader': 'Warming up the engine',
      'nav.services': 'Services', 'nav.travel': 'Travelers', 'nav.shop': 'Shop', 'nav.garage': 'The garage', 'nav.contact': 'Contact',
      'cta.turno': 'Book a service', 'cta.turnoWa': 'Book on WhatsApp', 'cta.services': 'See services', 'cta.travel': 'Express service for travelers', 'cta.wa': 'Message us on WhatsApp',
      'eng.disarm': 'Take engine apart', 'eng.arm': 'Put engine together', 'eng.assembled': 'Assembled', 'eng.exploded': 'Exploded view',
      'hero.kicker': 'Premium workshop · All makes', 'hero.l1': 'Every part', 'hero.l2': 'in its <em>place</em>',
      'hero.sub': 'Full-service repair for motorcycles of every make, ATVs, UTVs and generators. We strip down, measure and repair with the care your bike deserves.',
      'hud.hint': 'Drag the engine to rotate it', 'hud.scroll': 'Scroll',
      'manifesto': '<span class="mf">Every bike that leaves our shop</span> <span class="mf">leaves <em>ready for Patagonia.</em></span>',
      'svc.title': 'Repairs<br><em>without shortcuts.</em>',
      'svc.1.t': 'Diagnostics & electronics', 'svc.1.p': 'Scanner, measurement and experience. We find the fault before touching a single part.', 'svc.1.a': 'Fuel injection', 'svc.1.b': 'Electrical', 'svc.1.c': 'Charging & battery',
      'svc.2.t': 'Service & maintenance', 'svc.2.p': 'Factory-schedule maintenance so your bike keeps its performance and warranty.', 'svc.2.a': 'Oil & filters', 'svc.2.b': 'Valve clearance', 'svc.2.c': 'Throttle sync',
      'svc.3.t': 'Engine & transmission', 'svc.3.p': 'Full teardown, measurement and rebuild to factory torque specs. V-twins, singles and multis.', 'svc.3.a': 'Engine', 'svc.3.b': 'Clutch', 'svc.3.c': 'Gearbox', 'svc.3.d': 'Chain & sprockets',
      'svc.4.t': 'Brakes & suspension', 'svc.4.p': 'Set up for gravel, cold and the Patagonian wind.', 'svc.4.a': 'Pads & discs', 'svc.4.b': 'Bleeding', 'svc.4.c': 'Seals', 'svc.4.d': 'Bearings',
      'svc.5.t': 'ATVs & UTVs', 'svc.5.p': 'Preventive maintenance and repair for work and leisure ATVs and UTVs.', 'svc.5.c': 'Differentials',
      'svc.6.t': 'Generators', 'svc.6.p': 'Service and repair of generators for home, farm and job site.', 'svc.6.b': 'Starting', 'svc.6.c': 'Voltage regulation',
      'travel.label': 'Travelers', 'travel.title': 'Last technical stop<br><em>before the end of the world.</em>',
      'travel.p': 'Heading to Ushuaia, Chile or back north? We check your bike before the toughest stretch of the trip: wind, gravel and hundreds of kilometers with no workshops.',
      'travel.c1': '360° pre-trip inspection', 'travel.c2': 'Oil, filters & chain', 'travel.c3': 'Tires & brakes', 'travel.c4': 'Same-day diagnosis',
      'proc.label': 'How we work', 'proc.title': 'You know what gets done,<br><em>before it gets done.</em>',
      'proc.1.t': 'We listen', 'proc.1.p': 'We hear what\'s wrong and record the condition of the bike.',
      'proc.2.t': 'We diagnose', 'proc.2.p': 'We send you the diagnosis and quote on WhatsApp.',
      'proc.3.t': 'We repair', 'proc.3.p': 'Quality parts, specific tools and factory torque specs.',
      'proc.4.t': 'We test', 'proc.4.p': 'Road test and delivery with a full report of the work.',
      'shop.label': 'Shop', 'shop.title': 'Pro tools,<br><em>generators & parts.</em>', 'shop.aside': 'The same tools we use in the workshop, now for your garage. Ask for stock and price on WhatsApp.',
      'shop.c1s': 'Specialist tools', 'shop.c2s': 'Sales & service', 'shop.c2': 'Power<br>generators', 'shop.c3s': 'OEM & aftermarket', 'shop.c3': 'Parts &<br>lubricants',
      'shop.f.all': 'All', 'shop.f.tools': 'Tools', 'shop.f.gen': 'Generators', 'shop.f.parts': 'Parts', 'shop.note': 'Sample catalog · Illustrative images',
      'shop.ask': 'Check stock',
      'garage.title': 'Built by people<br><em>who ride.</em>',
      'garage.p': 'In the heart of your city. A tidy workshop with specialist tools and the time every job needs: from a Royal Enfield halfway around the continent to a collector Harley or a farm Can-Am.',
      'contact.title': 'Does your bike<br><em>need attention?</em>', 'contact.addr': 'Address', 'contact.corner': '', 'contact.social': 'Social',
      'map.name': 'Full-service motorcycle repair', 'map.go': 'Get directions', 'map.open': 'Open in Google Maps', 'foot.credits': 'Image credits',
      'wa.turno': 'Hi Grupo Amplifia! I\'d like to book a service for my bike.', 'wa.viajero': 'Hi Grupo Amplifia! I\'m on a road trip and need my bike checked.', 'wa.hola': 'Hi Grupo Amplifia!', 'wa.prod': 'Hi Grupo Amplifia! I\'d like to ask about: ',
      'p.1': 'Precision torque wrench', 'p.2': 'Motorcycle socket & ratchet set', 'p.3': 'Socket rail organizer', 'p.4': 'Generator sets · diesel & gasoline', 'p.5': 'Replacement engines & parts', 'p.6': 'Brake pads, discs & fluid', 'p.7': 'Iridium & standard spark plugs', 'p.8': 'Fork seals, fork oil & bearings',
      'b.gen': 'Generators', 'b.brakes': 'Brakes', 'b.ign': 'Ignition', 'b.susp': 'Suspension',
      'lbl.Cigüeñal': 'Crankshaft', 'lbl.Cilindros': 'Cylinders', 'lbl.Tapas de cilindro': 'Cylinder heads', 'lbl.Balancines': 'Rocker boxes', 'lbl.Bujías': 'Spark plugs', 'lbl.Pistones': 'Pistons', 'lbl.Bielas': 'Connecting rods', 'lbl.Varillas': 'Pushrod tubes', 'lbl.Tapa de distribución': 'Cam cover', 'lbl.Filtro de aire': 'Air cleaner', 'lbl.Filtro de aceite': 'Oil filter', 'lbl.Escapes': 'Exhaust',
    },
    pt: {
      'loader': 'Aquecendo o motor',
      'nav.services': 'Serviços', 'nav.travel': 'Viajantes', 'nav.shop': 'Loja', 'nav.garage': 'A oficina', 'nav.contact': 'Contato',
      'cta.turno': 'Agendar serviço', 'cta.turnoWa': 'Agendar pelo WhatsApp', 'cta.services': 'Ver serviços', 'cta.travel': 'Atendimento expresso para viajantes', 'cta.wa': 'Fale conosco no WhatsApp',
      'eng.disarm': 'Desmontar motor', 'eng.arm': 'Montar motor', 'eng.assembled': 'Montado', 'eng.exploded': 'Vista explodida',
      'hero.kicker': 'Oficina premium · Todas as marcas', 'hero.l1': 'Cada peça', 'hero.l2': 'no seu <em>lugar</em>',
      'hero.sub': 'Mecânica completa de motos de todas as marcas, quadriciclos, UTVs e geradores. Desmontamos, medimos e consertamos com o cuidado que a sua moto merece.',
      'hud.hint': 'Arraste o motor para girá-lo', 'hud.scroll': 'Role',
      'manifesto': '<span class="mf">Cada moto que sai daqui,</span> <span class="mf">sai <em>pronta para a Patagônia.</em></span>',
      'svc.title': 'Conserto<br><em>sem atalhos.</em>',
      'svc.1.t': 'Diagnóstico e eletrônica', 'svc.1.p': 'Scanner, medição e experiência. Encontramos a falha antes de tocar em uma peça.', 'svc.1.a': 'Injeção', 'svc.1.b': 'Elétrica', 'svc.1.c': 'Carga e bateria',
      'svc.2.t': 'Revisão e manutenção', 'svc.2.p': 'Manutenção conforme o manual de fábrica, para manter desempenho e garantia.', 'svc.2.a': 'Óleo e filtros', 'svc.2.b': 'Folga de válvulas', 'svc.2.c': 'Sincronização',
      'svc.3.t': 'Motor e transmissão', 'svc.3.p': 'Desmontagem completa, medição e remontagem com torques de fábrica. V-twin, monocilíndricos e multicilíndricos.', 'svc.3.a': 'Motor', 'svc.3.b': 'Embreagem', 'svc.3.c': 'Câmbio', 'svc.3.d': 'Kit relação',
      'svc.4.t': 'Freios e suspensão', 'svc.4.p': 'Ajustados para o cascalho, o frio e o vento patagônico.', 'svc.4.a': 'Pastilhas e discos', 'svc.4.b': 'Sangria', 'svc.4.c': 'Retentores', 'svc.4.d': 'Rolamentos',
      'svc.5.t': 'Quadriciclos e UTVs', 'svc.5.p': 'Manutenção preventiva e conserto de ATVs e UTVs de trabalho ou lazer.', 'svc.5.c': 'Diferenciais',
      'svc.6.t': 'Geradores', 'svc.6.p': 'Revisão e conserto de geradores para casa, campo e obra.', 'svc.6.b': 'Partida', 'svc.6.c': 'Regulagem',
      'travel.label': 'Viajantes', 'travel.title': 'Última parada técnica<br><em>antes do fim do mundo.</em>',
      'travel.p': 'Indo para Ushuaia, para o Chile ou voltando para o norte? Revisamos a sua moto antes do trecho mais duro da viagem: vento, cascalho e centenas de quilômetros sem oficinas.',
      'travel.c1': 'Revisão pré-viagem 360°', 'travel.c2': 'Óleo, filtros e corrente', 'travel.c3': 'Pneus e freios', 'travel.c4': 'Diagnóstico no mesmo dia',
      'proc.label': 'Como trabalhamos', 'proc.title': 'Você sabe o que será feito,<br><em>antes de ser feito.</em>',
      'proc.1.t': 'Recebemos', 'proc.1.p': 'Ouvimos o problema e registramos o estado da moto.',
      'proc.2.t': 'Diagnosticamos', 'proc.2.p': 'Enviamos o diagnóstico e o orçamento pelo WhatsApp.',
      'proc.3.t': 'Consertamos', 'proc.3.p': 'Peças de qualidade, ferramenta específica e torques de fábrica.',
      'proc.4.t': 'Testamos', 'proc.4.p': 'Teste na estrada e entrega com o detalhe do que fizemos.',
      'shop.label': 'Loja', 'shop.title': 'Ferramenta pro,<br><em>geradores e peças.</em>', 'shop.aside': 'A mesma ferramenta que usamos na oficina, agora para a sua garagem. Consulte estoque e preço pelo WhatsApp.',
      'shop.c1s': 'Ferramenta específica', 'shop.c2s': 'Venda e assistência', 'shop.c2': 'Grupos<br>geradores', 'shop.c3s': 'Originais e paralelas', 'shop.c3': 'Peças e<br>lubrificantes',
      'shop.f.all': 'Tudo', 'shop.f.tools': 'Ferramentas', 'shop.f.gen': 'Geradores', 'shop.f.parts': 'Peças', 'shop.note': 'Catálogo de amostra · Imagens ilustrativas',
      'shop.ask': 'Consultar estoque',
      'garage.title': 'Feito por quem<br><em>anda de moto.</em>',
      'garage.p': 'No centro da sua cidade. Uma oficina organizada, com ferramenta específica e o tempo que cada trabalho precisa: de uma Royal Enfield dando a volta no continente a uma Harley de coleção ou um Can-Am de campo.',
      'contact.title': 'A sua moto<br><em>precisa de atenção?</em>', 'contact.addr': 'Endereço', 'contact.corner': '', 'contact.social': 'Redes',
      'map.name': 'Mecânica integral de motos', 'map.go': 'Como chegar', 'map.open': 'Abrir no Google Maps', 'foot.credits': 'Créditos das imagens',
      'wa.turno': 'Olá Grupo Amplifia! Quero agendar um serviço para a minha moto.', 'wa.viajero': 'Olá Grupo Amplifia! Estou viajando de moto e preciso revisar a minha moto.', 'wa.hola': 'Olá Grupo Amplifia!', 'wa.prod': 'Olá Grupo Amplifia! Quero consultar sobre: ',
      'p.1': 'Torquímetro de precisão', 'p.2': 'Jogo de soquetes e catraca para moto', 'p.3': 'Organizador de soquetes', 'p.4': 'Grupos geradores · diesel e gasolina', 'p.5': 'Motores de reposição e peças', 'p.6': 'Pastilhas, discos e fluido de freio', 'p.7': 'Velas de irídio e padrão', 'p.8': 'Retentores, óleo de bengala e rolamentos',
      'b.gen': 'Geradores', 'b.brakes': 'Freios', 'b.ign': 'Ignição', 'b.susp': 'Suspensão',
      'lbl.Cigüeñal': 'Virabrequim', 'lbl.Cilindros': 'Cilindros', 'lbl.Tapas de cilindro': 'Cabeçotes', 'lbl.Balancines': 'Tampas de válvulas', 'lbl.Bujías': 'Velas', 'lbl.Pistones': 'Pistões', 'lbl.Bielas': 'Bielas', 'lbl.Varillas': 'Varetas', 'lbl.Tapa de distribución': 'Tampa do comando', 'lbl.Filtro de aire': 'Filtro de ar', 'lbl.Filtro de aceite': 'Filtro de óleo', 'lbl.Escapes': 'Escapamentos',
    },
    es: {
      'eng.arm': 'Armar motor', 'eng.exploded': 'Despiece',
      'shop.ask': 'Consultar stock',
      'wa.turno': 'Hola Grupo Amplifia! Quiero pedir un turno para mi moto.', 'wa.viajero': 'Hola Grupo Amplifia! Estoy de viaje y necesito revisar mi moto.', 'wa.hola': 'Hola Grupo Amplifia!', 'wa.prod': 'Hola Grupo Amplifia! Quería consultar por: ',
      'p.1': 'Llave de torque de precisión', 'p.2': 'Juego de tubos y crique para moto', 'p.3': 'Organizador de tubos con encastre', 'p.4': 'Grupos electrógenos · diésel y nafta', 'p.5': 'Motores de reemplazo y repuestos', 'p.6': 'Pastillas, discos y líquido de freno', 'p.7': 'Bujías iridium y estándar', 'p.8': 'Retenes, aceite de horquilla y rodamientos',
      'b.gen': 'Grupos electrógenos', 'b.brakes': 'Frenos', 'b.ign': 'Encendido', 'b.susp': 'Suspensión',
    },
  };
  const WA_NUM = '5490000000000';
  const pick = () => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q && D[q]) return q;
    try { const s = localStorage.getItem('demo-lang'); if (s && D[s]) return s; } catch (e) {}
    const n = (navigator.language || 'es').slice(0, 2);
    return n === 'pt' ? 'pt' : n === 'en' ? 'en' : 'es';
  };
  const subs = [];
  const I = window.I18N = {
    lang: 'es',
    t(k) { return (D[I.lang] && D[I.lang][k]) ?? D.es[k] ?? k; },
    label(es) { return I.lang === 'es' ? es : (D[I.lang]['lbl.' + es] || es); },
    wa(k, extra = '') { return `https://wa.me/${WA_NUM}?text=${encodeURIComponent(I.t('wa.' + k) + extra)}`; },
    on(fn) { subs.push(fn); },
    set(l) {
      if (!D[l]) return;
      I.lang = l; document.documentElement.lang = l;
      try { localStorage.setItem('demo-lang', l); } catch (e) {}
      document.querySelectorAll('[data-i18n]').forEach(el => el.textContent = I.t(el.dataset.i18n));
      document.querySelectorAll('[data-i18n-html]').forEach(el => el.innerHTML = I.t(el.dataset.i18nHtml));
      document.querySelectorAll('[data-wa]').forEach(a => a.href = I.wa(a.dataset.wa));
      document.querySelectorAll('[data-lang]').forEach(b => b.classList.toggle('is-on', b.dataset.lang === l));
      subs.forEach(fn => fn(l));
    },
  };
  // el español se toma del HTML original
  document.querySelectorAll('[data-i18n]').forEach(el => { if (!(el.dataset.i18n in D.es)) D.es[el.dataset.i18n] = el.textContent; });
  document.querySelectorAll('[data-i18n-html]').forEach(el => { if (!(el.dataset.i18nHtml in D.es)) D.es[el.dataset.i18nHtml] = el.innerHTML; });
  document.querySelectorAll('[data-lang]').forEach(b => b.addEventListener('click', () => I.set(b.dataset.lang)));
  I.set(pick());
})();
