/* Almacén de propiedades del demo.
 * Base: data.js (datos de demostración). Si el panel guardó cambios, se usan los de IndexedDB de este navegador.
 * En producción esto se reemplaza por la API de tu sistema de gestión o por una base (Supabase) con login real. */
(function () {
  const DB = "demo-inmobiliaria", ST = "kv", KEY = "props-v2";
  const chan = "BroadcastChannel" in window ? new BroadcastChannel("demo-props") : null;

  function db() {
    return new Promise((ok, ko) => {
      const r = indexedDB.open(DB, 1);
      r.onupgradeneeded = () => r.result.createObjectStore(ST);
      r.onsuccess = () => ok(r.result);
      r.onerror = () => ko(r.error);
    });
  }
  async function get(k) {
    const d = await db();
    return new Promise((ok, ko) => { const q = d.transaction(ST).objectStore(ST).get(k); q.onsuccess = () => ok(q.result); q.onerror = () => ko(q.error); });
  }
  async function set(k, v) {
    const d = await db();
    return new Promise((ok, ko) => { const t = d.transaction(ST, "readwrite"); t.objectStore(ST).put(v, k); t.oncomplete = ok; t.onerror = () => ko(t.error); });
  }
  async function del(k) {
    const d = await db();
    return new Promise((ok, ko) => { const t = d.transaction(ST, "readwrite"); t.objectStore(ST).delete(k); t.oncomplete = ok; t.onerror = () => ko(t.error); });
  }
  const base = () => JSON.parse(JSON.stringify(window.DEMODATA.propiedades)).map(p => ({ estado: "publicada", ...p }));

  window.DemoStore = {
    async load() {
      try { const saved = await get(KEY); if (Array.isArray(saved)) return saved; } catch (e) {}
      return base();
    },
    async save(list) { await set(KEY, list); chan && chan.postMessage("changed"); },
    async reset() { await del(KEY); chan && chan.postMessage("changed"); },
    onChange(fn) { chan && chan.addEventListener("message", fn); },
    // foto: ruta base del sitio ("img/p/<id>/<n>" + "-s|-m|-l.jpg") o imagen subida desde el panel (data:)
    img(f, size) { return f.startsWith("data:") ? f : f + "-" + (size || "l") + ".jpg"; },
    base,
  };
})();
