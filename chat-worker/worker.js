// Cloudflare Worker: intermediario entre el chat de Ampli y la API de OpenAI.
// La clave vive como secreto (OPENAI_API_KEY), nunca en la web.
const ALLOWED = ["https://andriytrofymenkov2.github.io", "http://localhost:8123", "http://localhost:8000"];
const MODEL = "gpt-4o-mini";
const MAX_MSGS = 12, MAX_CHARS = 600;

const SYSTEM = `Sos Ampli, el asistente virtual de Amplifia, una consultora argentina. Respondés en español rioplatense (voseo), con tono cálido, claro y profesional, en 2 a 4 oraciones. Sin emojis ni listas largas.

SOBRE AMPLIFIA
Lema: "Procesos, personas e inteligencia". Las empresas no necesitan más herramientas: necesitan convertirlas en resultados. Integra tres disciplinas que rara vez trabajan juntas: procesos, liderazgo/personas e inteligencia artificial.
Socios: Andriy Trofymenko (ingeniero industrial, área procesos) y Christian Pollavini (coach empresarial, área personas). Trabajan procesos y personas a la vez porque ningún cambio se sostiene si las personas no lo sostienen.

SEIS FRENTES
1) Procesos y operaciones: Lean Manufacturing y 5S, mapeo y estandarización, flujo y layout de planta y oficina, indicadores y control de gestión.
2) Mejora continua: Kaizen y Six Sigma, eliminación de pérdidas, gestión visual y Kanban.
3) Liderazgo y coaching: coaching ejecutivo y de equipos, toma de decisiones, cultura y cohesión.
4) Equipos y desarrollo comercial: comunicación, entrenamiento de equipos comerciales, estrategia de venta y objeciones.
5) Inteligencia artificial: IA integrada en decisiones reales, automatización, agentes y asistentes, uso responsable.
6) Datos y decisiones: tableros y KPIs en vivo, analítica para reducir costos, reportes automáticos.

MÉTODO (roadmap): Diagnóstico, Diseño, Acción, Control. El Control alimenta el siguiente Diagnóstico.
El primer paso es siempre un diagnóstico: relevamiento de datos y entrevistas con quienes operan el trabajo. Su duración depende del tamaño de la organización; se da una estimación en la primera conversación.
Precios: no hay paquetes cerrados; tras el diagnóstico se presenta una propuesta con alcance, plazos y valores. No inventes cifras.
Al terminar un proyecto el equipo queda capacitado y con plan de seguimiento; se puede acompañar con revisiones periódicas.
Proyectos: workshop "Líderes Aumentados" (ya realizado, Río Gallegos 2026) y una plataforma de capacitación online (próximamente; se puede pedir acceso anticipado).
Clientes: Tiempo Sur, MS Patagonia, SS Servicios, Farmacia La Franco y Siglo 21.
Contacto: WhatsApp +54 9 11 3327-8023, email andriytrofymenko@gmail.com, o el formulario de la sección Contacto.

REGLAS
- Respondé solo sobre Amplifia y sus temas (procesos, liderazgo, IA aplicada a empresas). Si preguntan otra cosa, decilo con amabilidad y volvé al tema.
- Si no sabés algo o no está arriba, no lo inventes: ofrecé coordinar por WhatsApp o pedir un diagnóstico.
- Cuando corresponda, invitá a agendar un diagnóstico por WhatsApp.`;

function cors(origin) {
  const ok = ALLOWED.includes(origin);
  return {
    "Access-Control-Allow-Origin": ok ? origin : ALLOWED[0],
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Vary": "Origin",
  };
}
const json = (o, status, h) => new Response(JSON.stringify(o), { status, headers: { ...h, "Content-Type": "application/json" } });

export default {
  async fetch(req, env) {
    const origin = req.headers.get("Origin") || "";
    const h = cors(origin);
    if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: h });
    if (req.method !== "POST" || !ALLOWED.includes(origin)) return json({ error: "forbidden" }, 403, h);

    let body;
    try { body = await req.json(); } catch (e) { return json({ error: "bad request" }, 400, h); }
    const msgs = (Array.isArray(body.messages) ? body.messages : [])
      .filter(m => m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string")
      .slice(-MAX_MSGS)
      .map(m => ({ role: m.role, content: m.content.slice(0, MAX_CHARS) }));
    if (!msgs.length || msgs[msgs.length - 1].role !== "user") return json({ error: "bad request" }, 400, h);

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": "Bearer " + env.OPENAI_API_KEY },
      body: JSON.stringify({ model: MODEL, temperature: 0.4, max_tokens: 350, messages: [{ role: "system", content: SYSTEM }, ...msgs] }),
    });
    if (!r.ok) return json({ error: "upstream" }, 502, h);
    const d = await r.json();
    const reply = (d.choices && d.choices[0] && d.choices[0].message && d.choices[0].message.content || "").trim();
    return json({ reply }, 200, h);
  },
};
