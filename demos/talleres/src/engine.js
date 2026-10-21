// Motor monocilíndrico procedural, realista, que se arma y se desarma solo.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const canvas = document.getElementById('engine');
const host = canvas.parentElement;
const isMobile = matchMedia('(max-width: 760px)').matches;
const Q = isMobile ? 0.65 : 1; // calidad de segmentos

const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.6 : 2));
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(32, 1, 0.1, 100);

// ---------- entorno de estudio (softboxes) para reflejos realistas ----------
const pmrem = new THREE.PMREMGenerator(renderer);
function studioEnv() {
  const s = new THREE.Scene();
  s.add(new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), new THREE.MeshBasicMaterial({ color: 0x030304, side: THREE.BackSide })));
  const panel = (w, h, color, k, pos) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshBasicMaterial({ color: new THREE.Color(color).multiplyScalar(k), side: THREE.DoubleSide }));
    m.position.set(...pos); m.lookAt(0, 0, 0); s.add(m);
  };
  panel(10, 3.5, 0xffffff, 7, [0, 12, 3]);        // softbox cenital
  panel(1.4, 12, 0xffffff, 5, [-12, 1, 4]);       // tira izquierda
  panel(1.4, 12, 0xf0f4ff, 3.5, [12, 2, -3]);     // tira derecha
  panel(9, 1.2, 0xff1a0a, 3, [5, -3, -12]);       // tira roja trasera
  panel(14, 5, 0xc8d0dc, 0.9, [0, 1, 13]);        // relleno frontal suave
  panel(20, 20, 0x15161a, 1, [0, -14, 0]);        // piso oscuro
  return pmrem.fromScene(s, 0.02).texture;
}
scene.environment = studioEnv();
scene.environmentIntensity = 0.9;

// ---------- luces ----------
const key = new THREE.DirectionalLight(0xffffff, 2.2);
key.position.set(-4, 9, 5); key.castShadow = true;
key.shadow.mapSize.set(isMobile ? 1024 : 2048, isMobile ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -8, right: 8, top: 8, bottom: -8, near: 1, far: 30 });
key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; key.shadow.radius = 4;
scene.add(key);
const rim = new THREE.PointLight(0xff1a10, 38, 30, 1.6); rim.position.set(4.5, 2.5, -3.5); scene.add(rim);
const rim2 = new THREE.PointLight(0xff2a1a, 20, 20, 1.6); rim2.position.set(-5, -1.5, -2); scene.add(rim2);

// ---------- texturas procedurales ----------
function canvasTex(size, draw, color = false) {
  const c = document.createElement('canvas'); c.width = c.height = size;
  draw(c.getContext('2d'), size);
  const t = new THREE.CanvasTexture(c); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = 8;
  if (color) t.colorSpace = THREE.SRGBColorSpace; return t;
}
// fibra de carbono (sarga 2x2)
const carbon = canvasTex(512, (g, S) => {
  const cells = 16, s = S / cells;
  for (let y = 0; y < cells; y++) for (let x = 0; x < cells; x++) {
    const h = ((x - y) % 4 + 4) % 4 < 2;
    const gr = h ? g.createLinearGradient(0, y * s, 0, y * s + s) : g.createLinearGradient(x * s, 0, x * s + s, 0);
    gr.addColorStop(0, '#08080a'); gr.addColorStop(0.5, '#3b3d42'); gr.addColorStop(1, '#08080a');
    g.fillStyle = gr; g.fillRect(x * s, y * s, s, s);
  }
}, true);
carbon.repeat.set(2, 2);
// fundición (grano)
const cast = canvasTex(256, (g, S) => {
  const d = g.createImageData(S, S);
  for (let i = 0; i < d.data.length; i += 4) { const v = 110 + Math.random() * 110; d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255; }
  g.putImageData(d, 0, 0);
});
cast.repeat.set(3, 3);
// aluminio cepillado
const brushed = canvasTex(512, (g, S) => {
  g.fillStyle = '#808080'; g.fillRect(0, 0, S, S);
  for (let i = 0; i < 2600; i++) { const y = Math.random() * S, v = 90 + Math.random() * 90; g.strokeStyle = `rgba(${v},${v},${v},.35)`; g.lineWidth = Math.random() * 1.2; g.beginPath(); g.moveTo(0, y); g.lineTo(S, y + (Math.random() - .5) * 2); g.stroke(); }
});

// ---------- materiales ----------
const M = {
  case: new THREE.MeshPhysicalMaterial({ color: 0x1b1d21, metalness: 0.55, roughness: 0.55, roughnessMap: cast, bumpMap: cast, bumpScale: 0.6, clearcoat: 0.35, clearcoatRoughness: 0.4 }),
  paint: new THREE.MeshPhysicalMaterial({ color: 0x0f1012, metalness: 0.35, roughness: 0.5, roughnessMap: cast, bumpMap: cast, bumpScale: 0.4, clearcoat: 0.5, clearcoatRoughness: 0.3 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xc9cdd2, metalness: 1, roughness: 0.32, roughnessMap: brushed }),
  machined: new THREE.MeshStandardMaterial({ color: 0xe6e8eb, metalness: 1, roughness: 0.18 }),
  chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 1, roughness: 0.05 }),
  steel: new THREE.MeshStandardMaterial({ color: 0x8d9299, metalness: 1, roughness: 0.3, roughnessMap: brushed }),
  dark: new THREE.MeshStandardMaterial({ color: 0x2a2c30, metalness: 0.9, roughness: 0.35 }),
  red: new THREE.MeshPhysicalMaterial({ color: 0xd40500, metalness: 0.2, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.08 }),
  anod: new THREE.MeshStandardMaterial({ color: 0xc70800, metalness: 0.9, roughness: 0.28, roughnessMap: brushed }),
  carbon: new THREE.MeshPhysicalMaterial({ map: carbon, metalness: 0.3, roughness: 0.38, clearcoat: 1, clearcoatRoughness: 0.03 }),
  ceramic: new THREE.MeshPhysicalMaterial({ color: 0xf4f1ea, metalness: 0, roughness: 0.15, clearcoat: 0.6 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: 0.28 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x0b0b0c, metalness: 0, roughness: 0.8 }),
};

// ---------- helpers de geometría ----------
const seg = n => Math.max(8, Math.round(n * Q));
const cyl = (r, h, mat, rt = r, s = 48) => new THREE.Mesh(new THREE.CylinderGeometry(rt, r, h, seg(s)), mat);
function finGeo(rIn, rOut, th) { // aleta con borde redondeado (torno)
  const p = [new THREE.Vector2(rIn, -th / 2), new THREE.Vector2(rOut - th * 0.6, -th * 0.42), new THREE.Vector2(rOut, 0), new THREE.Vector2(rOut - th * 0.6, th * 0.42), new THREE.Vector2(rIn, th / 2)];
  return new THREE.LatheGeometry(p, seg(72));
}
// tornillo hexagonal con arandela y caña (eje local Y)
function boltMesh(len = 0.28, r = 0.055, headMat = M.chrome) {
  const g = new THREE.Group();
  const head = cyl(r, 0.07, headMat, r * 0.92, 6); head.position.y = 0.035; g.add(head);
  const washer = cyl(r * 1.35, 0.018, M.machined, r * 1.35, 20); washer.position.y = -0.009; g.add(washer);
  const shank = cyl(r * 0.55, len, M.steel, r * 0.55, 10); shank.position.y = -len / 2; g.add(shank);
  return g;
}
function gearGeo(r, teeth, depth, hole = 0.12) {
  const sh = new THREE.Shape(); const tH = r * 0.12;
  for (let i = 0; i < teeth * 2; i++) {
    const a0 = (i / (teeth * 2)) * Math.PI * 2, a1 = ((i + 1) / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r - tH : r;
    const p0 = [Math.cos(a0) * rr, Math.sin(a0) * rr], p1 = [Math.cos(a1) * rr, Math.sin(a1) * rr];
    i === 0 ? sh.moveTo(...p0) : sh.lineTo(...p0); sh.lineTo(...p1);
  }
  const h = new THREE.Path(); h.absarc(0, 0, hole, 0, Math.PI * 2, true); sh.holes.push(h);
  for (let k = 0; k < 5; k++) {
    const a = (k / 5) * Math.PI * 2, p = new THREE.Path();
    p.absarc(Math.cos(a) * r * 0.55, Math.sin(a) * r * 0.55, r * 0.14, 0, Math.PI * 2, true); sh.holes.push(p);
  }
  const g = new THREE.ExtrudeGeometry(sh, { depth, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 4 });
  g.translate(0, 0, -depth / 2); return g;
}

// ---------- registro de piezas ----------
const engine = new THREE.Group(); scene.add(engine);
const parts = [];
/* opciones: unscrew = eje local ('y'|'z') para desenroscar girando antes de salir */
function part(obj, parent, dir, dist, start, spin = [0, 0, 0], label, opt = {}) {
  parent.add(obj);
  const p = { obj, base: { p: obj.position.clone(), q: obj.quaternion.clone() }, dir: new THREE.Vector3(...dir).normalize(), dist, start, spin: new THREE.Vector3(...spin), label, k: 0, ...opt };
  parts.push(p); return p;
}

// ---------- cárter (dos mitades) ----------
const caseD = 1.6, crankY = -1.05;
const prof = new THREE.Shape();
prof.moveTo(-1.35, 0.55); prof.lineTo(-1.6, 0.05); prof.quadraticCurveTo(-1.65, -0.75, -1.0, -1.0);
prof.lineTo(0.9, -1.0); prof.quadraticCurveTo(1.6, -0.8, 1.6, 0.0); prof.lineTo(1.3, 0.6); prof.lineTo(0.55, 0.95); prof.lineTo(-0.55, 0.95); prof.closePath();
const halfGeo = new THREE.ExtrudeGeometry(prof, { depth: caseD / 2 - 0.12, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.06, bevelSegments: 4, curveSegments: 10 });
[-1, 1].forEach(sgn => {
  const half = new THREE.Group();
  const body = new THREE.Mesh(halfGeo, M.case);
  body.position.z = sgn > 0 ? 0.03 : -(caseD / 2 - 0.12) - 0.03; half.add(body);
  if (sgn > 0) { const gk = new THREE.Mesh(new THREE.ExtrudeGeometry(prof, { depth: 0.03, bevelEnabled: false, curveSegments: 10 }), M.red); gk.position.z = -0.015; half.add(gk); }
  for (let k = 0; k < 7; k++) {
    const rib = new THREE.Mesh(new RoundedBoxGeometry(0.06, 0.3, caseD / 2 - 0.12, 2, 0.02), M.alu);
    rib.position.set(-0.9 + k * 0.28, -1.06, sgn * caseD / 4); half.add(rib);
  }
  half.position.set(0, crankY, 0);
  part(half, engine, [0, 0, sgn], 1.35, 0.74);
});

// ---------- cigüeñal (volantes de inercia, perno común para las dos bielas) ----------
const crank = new THREE.Group();
const shaft = cyl(0.12, 2.4, M.machined, 0.12, 24); shaft.rotation.x = Math.PI / 2; crank.add(shaft);
const fly = new THREE.Shape(); fly.absarc(0, 0, 0.72, 0, Math.PI * 2, false);
const flyHole = new THREE.Path(); flyHole.absarc(0, -0.38, 0.16, 0, Math.PI * 2, true); fly.holes.push(flyHole);
const flyGeo = new THREE.ExtrudeGeometry(fly, { depth: 0.16, bevelEnabled: true, bevelSize: 0.03, bevelThickness: 0.03, bevelSegments: 3, curveSegments: seg(40) });
[-0.32, 0.16].forEach(z => { const w = new THREE.Mesh(flyGeo, M.steel); w.position.z = z; crank.add(w); });
const crankPin = cyl(0.1, 0.5, M.machined, 0.1, 20); crankPin.rotation.x = Math.PI / 2; crankPin.position.y = 0.38; crank.add(crankPin);
crank.position.set(0, crankY, 0);
const crankP = part(crank, engine, [0, -1, 0.3], 0.9, 0.84, [0, 0, 0], 'Cigüeñal');

// ---------- unidad de cilindro (se usa dos veces: V a 45°) ----------
const CR = 0.38, ROD = 1.75, cylBase = 1.05, cylLen = 1.6;
function finPlate(hw, hd, th) {
  const s = new THREE.Shape(), r = Math.min(hw, hd) * 0.45;
  s.moveTo(-hw + r, -hd); s.lineTo(hw - r, -hd); s.quadraticCurveTo(hw, -hd, hw, -hd + r); s.lineTo(hw, hd - r); s.quadraticCurveTo(hw, hd, hw - r, hd);
  s.lineTo(-hw + r, hd); s.quadraticCurveTo(-hw, hd, -hw, hd - r); s.lineTo(-hw, -hd + r); s.quadraticCurveTo(-hw, -hd, -hw + r, -hd);
  const g = new THREE.ExtrudeGeometry(s, { depth: th, bevelEnabled: true, bevelSize: 0.012, bevelThickness: 0.012, bevelSegments: 2, curveSegments: 6 });
  g.rotateX(-Math.PI / 2); g.translate(0, -th / 2, 0); return g;
}
const helix = []; for (let i = 0; i <= 80; i++) { const a = i / 80 * Math.PI * 12; helix.push(new THREE.Vector3(Math.cos(a) * 0.08, i / 80 * 0.36, Math.sin(a) * 0.08)); }
const springGeo = new THREE.TubeGeometry(new THREE.CatmullRomCurve3(helix), seg(200), 0.014, 6, false);
const units = [];
function cylinderUnit(phi, zOff, front, delay) {
  const g = new THREE.Group(); g.position.set(0, crankY, 0); g.rotation.z = phi; engine.add(g);
  const u = { g, phi };

  // cilindro: núcleo negro + aletas que crecen hacia la tapa, cantos mecanizados
  const cylinder = new THREE.Group();
  const core = cyl(0.6, cylLen, M.paint, 0.6, 48); core.position.y = cylLen / 2; cylinder.add(core);
  for (let k = 0; k < 10; k++) {
    const y = 0.1 + k * 0.155, hw = 0.5 + k * 0.024, hd = 0.86 + k * 0.012;
    const f = new THREE.Mesh(finPlate(hw, hd, 0.05), M.paint); f.position.y = y; cylinder.add(f);
    const e = new THREE.Mesh(finPlate(hw + 0.008, hd + 0.008, 0.012), M.machined); e.position.y = y + 0.026; cylinder.add(e);
  }
  cylinder.add(cyl(0.64, 0.03, M.red, 0.64, 40));
  cylinder.position.y = cylBase;
  part(cylinder, g, [0, 1, 0], 1.7, 0.52 + delay, [0, 0.25, 0], front ? 'Cilindros' : null);

  // tapa de cilindro con aletas
  const head = new THREE.Group();
  const hb = new THREE.Mesh(new RoundedBoxGeometry(1.45, 0.5, 2.0, 4, 0.12), M.paint); hb.position.y = 0.25; head.add(hb);
  for (let k = 0; k < 4; k++) { const f = new THREE.Mesh(finPlate(0.8, 1.06, 0.045), M.alu); f.position.y = 0.06 + k * 0.13; head.add(f); }
  const port = cyl(0.17, 0.35, M.paint, 0.17, 24); port.rotation.z = Math.PI / 2; port.position.set(front ? -0.8 : 0.8, 0.18, 0.35); head.add(port);
  head.position.y = cylBase + cylLen;
  part(head, g, [0, 1, 0], 2.7, 0.36 + delay, [0, -0.2, 0], front ? 'Tapas de cilindro' : null);

  // tapa de balancines cromada, en dos niveles (estilo Evolution)
  const rock = new THREE.Group();
  rock.add(new THREE.Mesh(new RoundedBoxGeometry(1.25, 0.2, 1.75, 4, 0.08), M.chrome));
  const r2 = new THREE.Mesh(new RoundedBoxGeometry(1.0, 0.2, 1.45, 5, 0.09), M.chrome); r2.position.y = 0.18; rock.add(r2);
  const strip = new THREE.Mesh(new RoundedBoxGeometry(1.02, 0.035, 1.47, 2, 0.015), M.red); strip.position.y = 0.09; rock.add(strip);
  rock.position.y = cylBase + cylLen + 0.6;
  part(rock, g, [0, 1, 0], 2.85, 0.14 + delay, [0, 0.3, 0], front ? 'Balancines' : null);
  [[-0.42, -0.58], [0.42, -0.58], [-0.42, 0.58], [0.42, 0.58]].forEach(([x, z], i) => {
    const b = boltMesh(0.34, 0.042); b.position.set(x, cylBase + cylLen + 0.81, z);
    part(b, g, [0, 1, 0], 3.5, 0.0 + delay + i * 0.012, [0, 0, 0], null, { unscrew: 'y', turns: 4 });
  });

  // válvulas con resortes rojos
  [-0.22, 0.22].forEach(x => {
    const v = new THREE.Group();
    const stem = cyl(0.024, 0.85, M.machined, 0.024, 10); stem.position.y = 0.42; v.add(stem);
    v.add(cyl(0.15, 0.035, M.steel, 0.11, 24));
    const sp = new THREE.Mesh(springGeo, M.anod); sp.position.y = 0.42; v.add(sp);
    v.position.set(x, cylBase + cylLen - 0.1, 0);
    part(v, g, [x * 2, 1, 0], 2.1, 0.44 + delay, [0, 1, 0], null);
  });

  // bujía lateral (lado derecho de la tapa)
  const plug = new THREE.Group();
  plug.add(cyl(0.06, 0.2, M.steel, 0.06, 12));
  const hex = cyl(0.11, 0.09, M.machined, 0.11, 6); hex.position.y = 0.14; plug.add(hex);
  const ins = cyl(0.07, 0.34, M.ceramic, 0.05, 20); ins.position.y = 0.36; plug.add(ins);
  const boot = cyl(0.1, 0.32, M.red, 0.085, 20); boot.position.y = 0.66; plug.add(boot);
  plug.position.set(0, cylBase + cylLen + 0.25, 1.0); plug.rotation.x = Math.PI / 2 - 0.35;
  part(plug, g, [0, 0.34, 0.94], 2.6, 0.06 + delay, [0, 0, 0], front ? 'Bujías' : null, { unscrew: 'y', turns: 5 });

  // pistón
  const piston = new THREE.Group();
  piston.add(cyl(0.5, 0.52, M.machined, 0.5, 48));
  [0.17, 0.1, 0.03].forEach(y => { const r = new THREE.Mesh(new THREE.TorusGeometry(0.502, 0.012, 6, seg(48)), M.dark); r.rotation.x = Math.PI / 2; r.position.y = y + 0.05; piston.add(r); });
  const pin = cyl(0.07, 0.62, M.steel, 0.07, 12); pin.rotation.x = Math.PI / 2; pin.position.y = -0.1; piston.add(pin);
  u.piston = piston; u.pistonP = part(piston, g, [0, 1, 0], 1.0, 0.62 + delay, [0, 0.8, 0], front ? 'Pistones' : null);

  // biela (horquilla y cuchilla sobre el mismo perno)
  const rod = new THREE.Group();
  const bs = new THREE.Shape(); bs.moveTo(-0.12, 0); bs.lineTo(-0.07, ROD); bs.lineTo(0.07, ROD); bs.lineTo(0.12, 0); bs.closePath();
  const beam = new THREE.Mesh(new THREE.ExtrudeGeometry(bs, { depth: 0.09, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 2 }), M.steel); beam.position.z = -0.045; rod.add(beam);
  rod.add(new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.06, 12, seg(28)), M.steel));
  const sm = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.045, 10, seg(24)), M.steel); sm.position.y = ROD; rod.add(sm);
  rod.position.z = zOff;
  u.rod = rod; u.rodP = part(rod, g, [0, 1, 0], 0.5, 0.68 + delay, [0, 0, 0], front ? 'Bielas' : null);
  units.push(u);
}
const V = Math.PI / 8; // 22,5° por lado = V a 45°
cylinderUnit(V, -0.07, true, 0);
cylinderUnit(-V, 0.07, false, 0.03);

// ---------- varillas de balancines (cromadas, desde la distribución hasta cada tapa) ----------
[[V, -0.12], [V, 0.04], [-V, -0.04], [-V, 0.12]].forEach(([phi, dx], i) => {
  const h = cylBase + cylLen - 0.05;
  const a = new THREE.Vector3(0.42 + dx, crankY + 0.55, 0.66);
  const b = new THREE.Vector3(-Math.sin(phi) * h + Math.cos(phi) * (0.25 + dx), crankY + Math.cos(phi) * h, 0.66);
  const len = a.distanceTo(b);
  const tube = new THREE.Group();
  tube.add(cyl(0.045, len, M.chrome, 0.045, 16));
  [-len / 2 + 0.06, len / 2 - 0.06].forEach(y => { const c = cyl(0.065, 0.1, M.machined, 0.065, 16); c.position.y = y; tube.add(c); });
  tube.position.copy(a).add(b).multiplyScalar(0.5);
  tube.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  part(tube, engine, [0, 0.2, 1], 1.6, 0.46 + i * 0.01, [0, 0, 0], i === 0 ? 'Varillas' : null);
});

// ---------- tapas laterales: distribución cónica (derecha) y tapa izquierda de carbono ----------
function sideCover(r, x, y, z, sgn, mat, ring, n, start, label, cone = false) {
  const g = new THREE.Group();
  const d = cyl(cone ? r * 0.62 : r * 0.93, cone ? 0.32 : 0.16, mat, r, 72); d.rotation.x = sgn * Math.PI / 2; d.position.z = sgn * (cone ? 0.08 : 0); g.add(d);
  g.add(new THREE.Mesh(new THREE.TorusGeometry(r * 0.99, 0.03, 10, seg(72)), M.machined));
  if (ring) { const t = new THREE.Mesh(new THREE.TorusGeometry(r * 0.58, 0.025, 8, seg(64)), M.red); t.position.z = sgn * (cone ? 0.25 : 0.085); g.add(t); }
  g.position.set(x, y, z);
  part(g, engine, [0, 0, sgn], 2.3, start, [0, 0, 0.4 * sgn], label);
  for (let k = 0; k < n; k++) {
    const a = k / n * Math.PI * 2 + 0.3; const b = boltMesh(0.3, 0.045);
    b.rotation.x = sgn * Math.PI / 2;
    b.position.set(x + Math.cos(a) * r * 0.86, y + Math.sin(a) * r * 0.86, z + sgn * 0.06);
    part(b, engine, [Math.cos(a) * 0.25, Math.sin(a) * 0.25, sgn], 3.2 + (k % 2) * 0.35, start - 0.14 + k * 0.006, [0, 0, 0], null, { unscrew: 'y', turns: 4 });
  }
}
const caseZ = caseD / 2 + 0.08;
sideCover(0.62, 0.62, crankY + 0.05, caseZ, 1, M.chrome, true, 6, 0.26, 'Tapa de distribución', true);
sideCover(0.78, -0.35, crankY - 0.1, -caseZ, -1, M.carbon, true, 8, 0.24, null);

// engranajes de distribución (aparecen al sacar la tapa cónica)
const gears = [];
[[0.62, -0.05, 0.52, 22], [0.3, 0.5, 0.3, 14], [1.0, 0.45, 0.28, 13]].forEach(([x, y, r, t], i) => {
  const gm = new THREE.Mesh(gearGeo(r, t, 0.08), i === 0 ? M.machined : M.steel);
  gm.position.set(x, crankY + y, caseD / 2 + 0.02);
  part(gm, engine, [0, 0, 1], 1.1 + i * 0.22, 0.38, [0, 0, 0]);
  gears.push({ m: gm, r: r * (i % 2 ? -1 : 1) });
});

// ---------- filtro de aire redondo (lado derecho, entre los cilindros) ----------
const airY = crankY + cylBase + cylLen * 0.62;
const air = new THREE.Group();
const ab = cyl(0.95, 0.34, M.chrome, 0.88, 72); ab.rotation.x = Math.PI / 2; air.add(ab);
const af = cyl(0.62, 0.06, M.carbon, 0.62, 64); af.rotation.x = Math.PI / 2; af.position.z = 0.19; air.add(af);
const ar = new THREE.Mesh(new THREE.TorusGeometry(0.66, 0.03, 10, seg(64)), M.red); ar.position.z = 0.2; air.add(ar);
const throat = cyl(0.28, 0.6, M.alu, 0.32, 32); throat.rotation.x = Math.PI / 2; throat.position.z = -0.42; air.add(throat);
air.position.set(0, airY, 1.25);
part(air, engine, [0.1, 0.25, 1], 2.4, 0.12, [0, 0, 0.6], 'Filtro de aire');
{ // tornillo central único, como el original
  const b = boltMesh(0.5, 0.075); b.rotation.x = Math.PI / 2; b.position.set(0, airY, 1.5);
  part(b, engine, [0, 0.1, 1], 3.6, 0, [0, 0, 0], null, { unscrew: 'y', turns: 5 });
}

// ---------- filtro de aceite cromado ----------
const filter = new THREE.Group();
const fb = cyl(0.25, 0.45, M.chrome, 0.25, 40); fb.rotation.z = Math.PI / 2; filter.add(fb);
for (let k = 0; k < 14; k++) { const fl = new THREE.Mesh(new RoundedBoxGeometry(0.32, 0.035, 0.035, 1, 0.01), M.machined); const a = k / 14 * Math.PI * 2; fl.position.set(-0.03, Math.cos(a) * 0.255, Math.sin(a) * 0.255); filter.add(fl); }
filter.position.set(-1.72, crankY - 0.3, 0.35);
part(filter, engine, [-1, -0.2, 0.3], 1.6, 0.3, [0, 0, 0], 'Filtro de aceite');

// ---------- doble escape cromado ----------
const flames = [];
function flameTex(stops) { // degradé a lo largo de la llama: abajo (base caliente) → arriba (punta que se apaga)
  const c = document.createElement('canvas'); c.width = 8; c.height = 256; const g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 256, 0, 0); stops.forEach(([o, col]) => gr.addColorStop(o, col)); g.fillStyle = gr; g.fillRect(0, 0, 8, 256);
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t;
}
// cono a lo largo de +x (base en la puntera, punta hacia atrás)
const flameGeo = new THREE.ConeGeometry(0.2, 1.4, 20, 1, true); flameGeo.rotateZ(-Math.PI / 2); flameGeo.translate(0.7, 0, 0);
const flameMatO = new THREE.MeshBasicMaterial({ map: flameTex([[0, 'rgba(255,240,200,1)'], [0.25, 'rgba(255,150,40,.95)'], [0.6, 'rgba(230,40,0,.6)'], [1, 'rgba(120,0,0,0)']]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const flameMatI = new THREE.MeshBasicMaterial({ map: flameTex([[0, 'rgba(220,240,255,1)'], [0.4, 'rgba(80,140,255,.8)'], [1, 'rgba(0,40,255,0)']]), transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide });
const glowTex = (() => { const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
  const r = g.createRadialGradient(64, 64, 0, 64, 64, 64); r.addColorStop(0, 'rgba(255,230,180,1)'); r.addColorStop(0.25, 'rgba(255,140,40,.7)'); r.addColorStop(0.6, 'rgba(220,40,0,.18)'); r.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = r; g.fillRect(0, 0, 128, 128); const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; return t; })();
const glowMat = new THREE.SpriteMaterial({ map: glowTex, blending: THREE.AdditiveBlending, transparent: true, depthWrite: false });
const fireLight = new THREE.PointLight(0xff7a1a, 0, 9, 1.8); scene.add(fireLight);
function header(pts, label, start) {
  const path = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(path, seg(160), 0.12, seg(24), false), M.chrome);
  const end = pts[pts.length - 1];
  const tip = cyl(0.19, 0.8, M.carbon, 0.19, 40); tip.rotation.z = Math.PI / 2 - 0.08; tip.position.set(end[0] + 0.3, end[1] + 0.02, end[2]); m.add(tip);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.022, 8, seg(40)), M.machined); ring.rotation.y = Math.PI / 2; ring.position.set(end[0] + 0.7, end[1] + 0.05, end[2]); m.add(ring);
  // llamarada: núcleo azul + lengua naranja (aditivo), apuntando hacia atrás
  const fl = new THREE.Group(); fl.position.set(end[0] + 0.74, end[1] + 0.05, end[2]); fl.rotation.z = 0.08;
  const outer = new THREE.Mesh(flameGeo, flameMatO); outer.scale.set(1, 1, 1); fl.add(outer);
  const inner = new THREE.Mesh(flameGeo, flameMatI); inner.scale.set(0.55, 0.5, 0.5); fl.add(inner);
  const glow = new THREE.Sprite(glowMat.clone()); glow.position.x = 0.25; fl.add(glow);
  fl.visible = false; m.add(fl); flames.push({ g: fl, o: outer, i: inner, glow, seed: Math.random() * 10 });
  part(m, engine, [0.3, -0.25, 1], 1.7, start, [0, 0, 0], label);
}
const fp = h => [-Math.sin(V) * h - 0.75, crankY + Math.cos(V) * h + 0.2];
const rp = h => [Math.sin(V) * h + 0.75, crankY + Math.cos(V) * h + 0.2];
header([[...fp(cylBase + cylLen + 0.1), 0.35], [-1.85, 1.3, 0.5], [-2.15, 0.2, 0.6], [-2.0, -1.4, 0.65], [-1.2, -2.15, 0.6], [0.6, -2.2, 0.55], [2.2, -2.0, 0.5]], 'Escapes', 0.28);
header([[...rp(cylBase + cylLen + 0.1), 0.35], [1.75, 1.35, 0.55], [1.95, 0.6, 0.75], [1.75, -0.6, 0.9], [2.0, -1.55, 0.85], [2.3, -1.6, 0.8]], null, 0.3);

// ---------- piso: sombra real + oclusión de contacto ----------
const floorY = -2.42;
const floor = new THREE.Mesh(new THREE.PlaneGeometry(30, 30), new THREE.ShadowMaterial({ opacity: 0.55 }));
floor.rotation.x = -Math.PI / 2; floor.position.y = floorY; floor.receiveShadow = true; engine.add(floor);
const sc = document.createElement('canvas'); sc.width = sc.height = 256;
const sg = sc.getContext('2d'); const rg = sg.createRadialGradient(128, 128, 0, 128, 128, 128);
rg.addColorStop(0, 'rgba(0,0,0,.9)'); rg.addColorStop(1, 'rgba(0,0,0,0)'); sg.fillStyle = rg; sg.fillRect(0, 0, 256, 256);
const ao = new THREE.Mesh(new THREE.PlaneGeometry(7.5, 3.4), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(sc), transparent: true, depthWrite: false }));
ao.rotation.x = -Math.PI / 2; ao.position.y = floorY + 0.005; engine.add(ao);

engine.traverse(o => { if (o.isMesh && o !== floor && o !== ao) { o.castShadow = true; o.receiveShadow = true; } });

// ---------- etiquetas HTML ----------
const labelLayer = document.getElementById('labels');
const labeled = []; // sin carteles sobre las piezas
labeled.forEach((p, i) => {
  const el = document.createElement('div'); el.className = 'lbl';
  el.innerHTML = `<i></i><span class="lt"></span>`; el.dataset.es = p.label;
  labelLayer.appendChild(el); p.el = el;
});

// ---------- animación ----------
const easeIO = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const clamp01 = v => Math.min(Math.max(v, 0), 1);
let explode = 0, target = 0, mode = 'auto', phaseT = 0;
const DUR = 2.1;             // duración del despiece completo (s)
const HOLD_IN = 3.2, HOLD_OUT = 1.6; // armado: ralentí + acelerada con llamarada; desarmado: pausa corta
const REV0 = 1.0, REV1 = 2.6;        // ventana de la acelerada dentro del tiempo armado
const statusEl = document.getElementById('engineStatus');
const toggleBtn = document.getElementById('engineToggle');
const btnTxt = document.getElementById('engineBtnTxt');
const T = k => (window.I18N ? I18N.t(k) : k);
function paintTexts() {
  if (statusEl) statusEl.textContent = T(target ? 'eng.exploded' : 'eng.assembled');
  if (btnTxt) btnTxt.textContent = T(target ? 'eng.arm' : 'eng.disarm');
  for (const p of labeled) p.el.querySelector('.lt').textContent = window.I18N ? I18N.label(p.label) : p.label;
}
window.I18N?.on(paintTexts);

function setTarget(v) {
  target = v; phaseT = 0;
  paintTexts();
  host.classList.toggle('is-exploded', !!v);
}
toggleBtn?.addEventListener('click', () => {
  mode = 'manual';
  // invierte desde el punto actual sin saltos
  const cur = target ? Math.min(phaseT / DUR, 1) : 1 - Math.min(phaseT / DUR, 1);
  setTarget(target ? 0 : 1); phaseT = (target ? cur : 1 - cur) * DUR;
  clearTimeout(window.__rideResume); window.__rideResume = setTimeout(() => mode = 'auto', 10000);
});

// arrastre horizontal para girar (en celular no bloquea el scroll vertical)
let yaw = 0, yawVel = 0, dragging = false, lastX = 0;
canvas.addEventListener('pointerdown', e => { dragging = true; lastX = e.clientX; });
addEventListener('pointerup', () => dragging = false);
addEventListener('pointercancel', () => dragging = false);
addEventListener('pointermove', e => { if (!dragging) return; const dx = e.clientX - lastX; lastX = e.clientX; yawVel = dx * 0.006; yaw += yawVel; });
let mx = 0, my = 0;
addEventListener('pointermove', e => { mx = e.clientX / innerWidth - 0.5; my = e.clientY / innerHeight - 0.5; });

const fit = { s: 1, x: 0, y: 0 };
function resize() {
  const w = host.clientWidth, h = host.clientHeight;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  const portrait = w / h < 0.9;
  camera.fov = portrait ? 44 : 30;
  camera.position.set(0, portrait ? 0.6 : 1.1, portrait ? 15.5 : 15);
  camera.lookAt(0, portrait ? 0.4 : 0.2, 0);
  camera.updateProjectionMatrix();
  const visH = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
  const visW = visH * camera.aspect;
  fit.s = portrait ? Math.min(0.8, visW / 8.4) : Math.min(1, visW / 12.5);
  fit.x = portrait ? 0 : visW * 0.17;
  fit.y = portrait ? visH * 0.27 : 0.15;
  fit.portrait = portrait;
  // el botón Armar/Desarmar se ubica pegado al motor (debajo, a la izquierda del cárter)
  const a = new THREE.Vector3(fit.x - 1.0 * fit.s, fit.y - (portrait ? 2.68 : 2.2) * fit.s, 0).project(camera);
  const bx = Math.min(Math.max((a.x * 0.5 + 0.5) * w - 32, 12), w - 250), by = (-a.y * 0.5 + 0.5) * h - 32;
  toggleBtn?.style.setProperty('--bx', bx.toFixed(0) + 'px'); toggleBtn?.style.setProperty('--by', by.toFixed(0) + 'px');
}
addEventListener('resize', resize); resize();

let visible = true;
new IntersectionObserver(([e]) => visible = e.isIntersecting, { threshold: 0 }).observe(host);

const clock = new THREE.Clock();
let theta = 0;
const v = new THREE.Vector3(), tmp = new THREE.Vector3(), qSpin = new THREE.Quaternion(), eul = new THREE.Euler(), AX = { y: new THREE.Vector3(0, 1, 0), z: new THREE.Vector3(0, 0, 1) };
setTarget(0);
// modo captura: ?x=0..1 congela el despiece (solo para revisión)
const FIX = new URLSearchParams(location.search).get('x');

function tick() {
  requestAnimationFrame(tick);
  if (!visible) { clock.getDelta(); return; }
  const dt = Math.min(clock.getDelta(), 0.05);
  const t = clock.elapsedTime;

  phaseT += dt;
  if (mode === 'auto') {
    if (target === 0 && phaseT > HOLD_IN + DUR) setTarget(1);
    else if (target === 1 && phaseT > HOLD_OUT + DUR) setTarget(0);
  }
  const prog = Math.min(phaseT / DUR, 1);
  explode = FIX !== null ? +FIX : (target ? prog : 1 - prog);

  // motor en marcha cuando está armado (ralentí con vibración)
  const running = 1 - clamp01(explode * 4);
  // acelerada: solo armado, en la ventana REV0..REV1 del tiempo de espera
  const hold = target === 0 ? phaseT - DUR : -1;
  const rev = hold > REV0 && hold < REV1 ? Math.sin(Math.PI * (hold - REV0) / (REV1 - REV0)) : 0;
  theta += dt * (1.0 + running * 11 + rev * 26);
  // llamaradas con explosiones irregulares (petardeo) al final de la acelerada
  let fire = 0;
  for (const f of flames) {
    const pop = rev > 0.15 ? Math.max(0, Math.sin(t * 31 + f.seed) * Math.sin(t * 17.3 + f.seed * 2)) : 0;
    const k = rev > 0.15 ? Math.min(1, rev * 1.3) * (0.55 + 0.6 * pop) : 0;
    f.g.visible = k > 0.02; fire = Math.max(fire, k);
    const len = 0.35 + k * 0.6 + Math.random() * 0.18 * k, w = 0.7 + k * 0.45 + Math.random() * 0.12;
    f.o.scale.set(len, w, w); f.i.scale.set(len * 0.6, w * 0.55, w * 0.55);
    f.o.material.opacity = Math.min(0.85, k);
    f.glow.scale.setScalar(0.6 + k * 1.1 + Math.random() * 0.2); f.glow.material.opacity = Math.min(1, k * 1.1);
  }
  if (flames[0]) { flames[0].g.getWorldPosition(fireLight.position); }
  fireLight.intensity = fire * (50 + Math.random() * 25);

  for (let i = 0; i < parts.length; i++) {
    const p = parts[i];
    // ventana temporal de cada pieza: desarma en orden y arma en orden inverso
    const local = clamp01((explode - p.start * 0.62) / 0.38);
    let off, turn = 0;
    if (p.unscrew) {
      // 1) gira y retrocede el largo de la rosca  2) sale en línea recta
      const k1 = clamp01(local / 0.5), k2 = easeIO(clamp01((local - 0.5) / 0.5));
      off = 0.16 * k1 + (p.dist - 0.16) * k2;
      turn = p.turns * Math.PI * 2 * k1;
    } else off = p.dist * easeIO(local);
    p.k = local;
    p.obj.position.copy(p.base.p).addScaledVector(p.dir, off);
    // rotación: base + giro de desenroscado sobre su propio eje + leve deriva flotante en el despiece
    const k = easeIO(local), drift = Math.sin(t * 0.6 + i) * 0.05 * k;
    eul.set(p.spin.x * k + drift * 0.5, p.spin.y * k + drift, p.spin.z * k);
    p.obj.quaternion.copy(p.base.q).multiply(qSpin.setFromEuler(eul));
    if (turn) p.obj.quaternion.multiply(qSpin.setFromAxisAngle(AX[p.unscrew], turn));
  }

  // mecanismo: dos bielas sobre el mismo perno del cigüeñal (V a 45°)
  crank.rotation.set(0, 0, -theta);
  crank.position.copy(crankP.base.p).addScaledVector(crankP.dir, crankP.dist * easeIO(crankP.k));
  for (const u of units) {
    const al = theta + u.phi, sx = Math.sin(al) * CR, sy = Math.cos(al) * CR;
    const pinY = sy + Math.sqrt(ROD * ROD - sx * sx);
    const kr = easeIO(u.rodP.k), kp = easeIO(u.pistonP.k);
    u.rod.position.set(sx, sy + u.rodP.dist * kr, u.rod.position.z);
    u.rod.rotation.set(0, 0.4 * kr, Math.atan2(sx, pinY - sy));
    u.piston.position.set(0, pinY + 0.1 + u.pistonP.dist * kp, 0);
    u.piston.rotation.set(0, u.pistonP.spin.y * kp, 0);
  }

  for (const g of gears) g.m.rotation.z += dt * (0.25 + running * 2.6) / g.r * 0.3;

  // giro suave + arrastre + parallax
  if (!dragging) { yawVel *= 0.94; yaw += yawVel; }
  const idle = Math.sin(t * 0.22) * 0.5;
  engine.rotation.y = -0.6 + idle + yaw + mx * 0.25;
  engine.rotation.x = 0.06 + my * 0.1;
  const ex = easeIO(explode);
  const vib = running * 0.006 + rev * 0.02;
  engine.scale.setScalar(fit.s * (1 - 0.4 * ex));
  engine.position.set(fit.x + Math.sin(theta * 2) * vib, fit.y - 0.7 * fit.s * ex + Math.sin(t * 1.1) * 0.03 + Math.cos(theta * 2) * vib, 0);
  rim.intensity = 38 + Math.sin(t * 2) * 5 + ex * 30;

  renderer.render(scene, camera);

  // etiquetas
  const w = host.clientWidth, h = host.clientHeight;
  for (const p of labeled) {
    p.obj.getWorldPosition(v); tmp.copy(v).project(camera);
    p.el.style.transform = `translate3d(${((tmp.x * 0.5 + 0.5) * w).toFixed(1)}px,${((-tmp.y * 0.5 + 0.5) * h).toFixed(1)}px,0)`;
    const sy = (-tmp.y * 0.5 + 0.5);
    p.el.style.opacity = (fit.portrait && sy > 0.48 ? 0 : clamp01((p.k - 0.9) / 0.1)).toFixed(2);
  }
}
tick();
document.documentElement.classList.add('engine-ready');
