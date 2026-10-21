/* =====================================================================
   Grupo Amplifia · datos del stock compartidos entre la web y el panel admin
   ---------------------------------------------------------------------
   DEMO: los datos se guardan en el navegador (IndexedDB), así funciona
   sin internet ni servidor. En producción, este archivo se reemplaza
   por llamadas a la base de datos (por ejemplo Supabase) y las fotos
   se suben a un storage en la nube. La web y el panel no cambian.
   ===================================================================== */
(function () {
  const seq = (key, n) => Array.from({ length: n }, (_, i) => `img/${key}-${i + 1}.jpg`);
  const pick = (key, ns) => ns.map(n => `img/${key}-${n}.jpg`);
  const GAL = { siena: pick("siena", [2]), fiesta: pick("fiesta", [4, 3, 5]), hilux: seq("hilux", 1), amarok: pick("amarok", [3]), taos: pick("taos", [4, 3, 6, 7, 8, 5]) };

  const TYPES = ["SUV", "Pickup", "Hatchback", "Sedán", "Monovolumen", "Coupé", "Utilitario", "Moto"];

  /* Stock real publicado en IG · "Octubre 2026"
     precio = entrega + cuotas en pesos (0 = Consulte) */
  const ROWS = [
    ["Audi","TT Coupé 2.0 T FSI S tronic","Coupé",2014,80000,0,"l0_0"],
    ["Chevrolet","Cruze RS 1.4 AT","Hatchback",2022,54000,17000000,"l0_1"],
    ["Chevrolet","Spin Premier 7 AS AT 1.8","Monovolumen",2025,20000,0,"l0_2"],
    ["Chevrolet","Tracker 1.8 LTZ AT AWD","SUV",2017,93000,14000000,"l0_3"],
    ["Citroën","C3 Feel Pack AT","Hatchback",2025,46000,15000000,"l0_4"],
    ["Citroën","C3 Feel Pack AT","Hatchback",2025,42000,15000000,"l0_5"],
    ["Fiat","Siena 1.4 EL Attractive","Sedán",2017,68000,7000000,"l0_6","siena"],
    ["Fiat","Pulse 1.0 Impetus CVT","SUV",2022,43000,0,"l0_7"],
    ["Fiat","Palio 1.4 Attractive Top","Hatchback",2017,52000,8000000,"l0_8"],
    ["Fiat","Punto 1.4 Attractive Top","Hatchback",2016,125000,8000000,"l1_0"],
    ["Fiat","Grand Siena 1.6 Essence","Sedán",2016,140000,10000000,"l1_1"],
    ["Fiat","Toro 4x4 Volcano","Pickup",2016,186000,14000000,"l1_2"],
    ["Ford","EcoSport 1.5 SE","SUV",2018,65000,16000000,"l1_3"],
    ["Ford","Fiesta 1.6 Titanium AT","Hatchback",2014,69000,8000000,"l1_4","fiesta"],
    ["Honda","HR-V LX CVT","SUV",2017,155000,16000000,"l1_5"],
    ["Jeep","Compass Sport 2.4 MT","SUV",2018,73000,0,"l1_6"],
    ["Peugeot","208 GT","Hatchback",2018,37000,12000000,"l1_7"],
    ["Renault","Clio 1.2 Dynamique","Hatchback",2016,125000,9000000,"l1_8"],
    ["Renault","Sandero 1.6 Intens","Hatchback",2023,14000,0,"l2_0"],
    ["Renault","Logan 1.6 Intens","Sedán",2020,96000,12000000,"l2_1"],
    ["Renault","Kwid 1.0 Iconic Bitono","Hatchback",2025,450,0,"l2_2"],
    ["Renault","Kwid 1.0 Intens","Hatchback",2021,57000,8000000,"l2_3"],
    ["Renault","Kangoo Furgón","Utilitario",2017,140000,10000000,"l2_4"],
    ["Renault","Fluence 2.0 Sport Turbo","Sedán",2013,169000,9000000,"l2_5"],
    ["Toyota","Corolla Cross XEI","SUV",2025,0,0,"l2_6"],
    ["Toyota","Hilux 2.8 SR 4x2 MT","Pickup",2025,20000,0,"l2_7","hilux"],
    ["Toyota","Innova 2.7 8 AS SRV AT","Monovolumen",2018,130000,0,"l2_8"],
    ["Volkswagen","Gol Trend 1.6","Hatchback",2018,113000,9000000,"l3_0"],
    ["Volkswagen","Up! 1.0 Take AA","Hatchback",2016,130000,9500000,"l3_1"],
    ["Volkswagen","Suran 1.6 Comfortline","Monovolumen",2017,100000,10000000,"l3_2"],
    ["Volkswagen","Scirocco 2.0 GTS","Coupé",2017,40000,0,"l3_3"],
    ["Volkswagen","Amarok Comfortline 4x2","Pickup",2021,56000,0,"l3_4","amarok"],
    ["Volkswagen","Taos Comfortline 250 TSI","SUV",2025,null,0,"","taos"],   // publicado en IG el 29/09
  ];
  const FEATURED = ["amarok", "hilux", "siena", "fiesta", "taos"];
  const SHOWCASE = ["taos", "fiesta"];
  // Fotos ilustrativas en alta (Wikimedia Commons) para las unidades sin sesión de fotos propia.
  // Van primero y la foto real de la placa queda como segunda. Créditos en creditos.html
  const ILUS = ["l0_0","l0_1","l0_2","l0_3","l0_4","l0_5","l0_7","l0_8","l1_0","l1_1","l1_2","l1_3","l1_5","l1_6","l1_7","l1_8",
                "l2_0","l2_1","l2_2","l2_3","l2_4","l2_5","l2_6","l2_8","l3_0","l3_1","l3_2","l3_3"];
  const photosFor = (thumb, g) => g ? GAL[g].slice() : ILUS.includes(thumb) ? [`img/ilus/${thumb}.jpg`] : [`img/ilus/l1_1.jpg`];   // autos a pantalla completa en la web (máx. 2)

  const defaults = () => ROWS.map(([brand, name, type, year, km, price, thumb, g], i) => ({
    id: "c" + String(i + 1).padStart(3, "0"),
    brand, name, type, year, km, price,
    photos: photosFor(thumb, g),
    featured: FEATURED.includes(g),
    showcase: SHOWCASE.includes(g),
    sold: false,
    desc: "",
    created: Date.UTC(2026, 9, 1) + i,
  }));

  /* ---------- Base de datos local (IndexedDB) ---------- */
  const DB_NAME = "demo-concesionaria", STORE = "cars";
  let dbp = null;
  function db() {
    if (dbp) return dbp;
    dbp = new Promise((res, rej) => {
      if (!("indexedDB" in window)) return rej(new Error("sin IndexedDB"));
      const r = indexedDB.open(DB_NAME, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(STORE, { keyPath: "id" });
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
    return dbp;
  }
  const tx = (mode, fn) => db().then(d => new Promise((res, rej) => {
    const t = d.transaction(STORE, mode), s = t.objectStore(STORE);
    const out = fn(s);
    t.oncomplete = () => res(out && "result" in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  }));

  const chan = "BroadcastChannel" in window ? new BroadcastChannel("demo-concesionaria") : null;
  const notify = () => { chan && chan.postMessage("changed"); try { localStorage.setItem("demo-concesionaria-updated", Date.now()); } catch (e) {} };

  async function all() {
    try {
      let cars = await tx("readonly", s => s.getAll());
      if (!cars || !cars.length) {           // primera vez: carga el stock de octubre
        cars = defaults();
        await tx("readwrite", s => cars.forEach(c => s.put(c)));
      }
      if (!cars.some(c => "showcase" in c)) {   // datos de una versión anterior de la demo
        const def = defaults();
        cars.forEach(c => { const d = def.find(x => x.id === c.id); c.showcase = d ? d.showcase : false; });
        def.filter(d => !cars.some(c => c.id === d.id)).forEach(d => cars.push(d));
        await tx("readwrite", s => cars.forEach(c => s.put(c)));
      }
      return cars;
    } catch (e) {
      console.warn("Demo: usando datos por defecto (", e.message, ")");
      return defaults();
    }
  }
  async function save(car) { car.updated = Date.now(); await tx("readwrite", s => s.put(car)); notify(); return car; }
  async function remove(id) { await tx("readwrite", s => s.delete(id)); notify(); }
  async function reset() {
    await tx("readwrite", s => { s.clear(); defaults().forEach(c => s.put(c)); });
    notify();
  }
  function onChange(cb) {
    chan && (chan.onmessage = cb);
    addEventListener("storage", e => { if (e.key === "demo-concesionaria-updated") cb(); });
  }
  const newId = () => "c" + Date.now().toString(36);

  window.DEMOAPP = { TYPES, defaults, all, save, remove, reset, onChange, newId };
})();
