// Shared procedural-modelling kit used by every asset in the library.
// Units: 1 scene unit = 10 cm.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const ANISO = 8;
/* ------------------------------------------------------------------ math helpers */
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
function hash3(x, y, z) { const h = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return h - Math.floor(h); }
function noise3(x, y, z) {
  const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z);
  const fx = x - X, fy = y - Y, fz = z - Z;
  const u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t;
  return L(
    L(L(hash3(X, Y, Z), hash3(X + 1, Y, Z), u), L(hash3(X, Y + 1, Z), hash3(X + 1, Y + 1, Z), u), v),
    L(L(hash3(X, Y, Z + 1), hash3(X + 1, Y, Z + 1), u), L(hash3(X, Y + 1, Z + 1), hash3(X + 1, Y + 1, Z + 1), u), v), w);
}
const fbm = (x, y, z) => noise3(x, y, z) * .55 + noise3(x * 2.07 + 5.2, y * 2.07, z * 2.07) * .3 + noise3(x * 4.3, y * 4.3 + 1.7, z * 4.3) * .15;

function basisMatrix(p, x, y) {
  const X = x.clone().normalize();
  const Z = new THREE.Vector3().crossVectors(X, y).normalize();
  const Y = new THREE.Vector3().crossVectors(Z, X);
  return new THREE.Matrix4().makeBasis(X, Y, Z).setPosition(p);
}
function place(obj, p, x, y) { basisMatrix(p, x, y).decompose(obj.position, obj.quaternion, obj.scale); return obj; }
function mesh(geo, mat) { const m = new THREE.Mesh(geo, mat); m.castShadow = true; m.receiveShadow = true; return m; }

/* ------------------------------------------------------------------ procedural textures */
function mkCanvas(w, h = w) { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
function tex(c, { repeat = [1, 1], color = true, clampEdge = false } = {}) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = clampEdge ? THREE.ClampToEdgeWrapping : THREE.RepeatWrapping;
  t.repeat.set(repeat[0], repeat[1]);
  t.anisotropy = ANISO;
  if (color) t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
function addNoise(g, w, h, amt) {
  const d = g.getImageData(0, 0, w, h);
  for (let i = 0; i < d.data.length; i += 4) {
    const n = (Math.random() - .5) * amt;
    d.data[i] += n; d.data[i + 1] += n; d.data[i + 2] += n;
  }
  g.putImageData(d, 0, 0);
}
function lighten(src, a) {
  const c = mkCanvas(src.width, src.height), g = c.getContext('2d');
  g.fillStyle = '#fff'; g.fillRect(0, 0, c.width, c.height);
  g.globalAlpha = a; g.drawImage(src, 0, 0);
  return c;
}
// basket-weave nylon (cordura / ripstop)
function weaveCanvas(size, n, ripstop) {
  const c = mkCanvas(size), g = c.getContext('2d'), cs = size / n;
  g.fillStyle = '#6e6e6e'; g.fillRect(0, 0, size, size);
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const x = i * cs, y = j * cs, hor = (i + j) % 2 === 0;
    for (let k = 0; k < 2; k++) {
      const o = k * cs / 2, t = cs / 2;
      const gr = hor ? g.createLinearGradient(0, y + o, 0, y + o + t) : g.createLinearGradient(x + o, 0, x + o + t, 0);
      gr.addColorStop(0, '#4e4e4e'); gr.addColorStop(.5, '#dedede'); gr.addColorStop(1, '#4e4e4e');
      g.fillStyle = gr;
      hor ? g.fillRect(x + .7, y + o, cs - 1.4, t) : g.fillRect(x + o, y + .7, t, cs - 1.4);
    }
  }
  if (ripstop) {
    const s = size / ripstop;
    g.fillStyle = 'rgba(255,255,255,.6)';
    for (let k = 0; k < ripstop; k++) { g.fillRect(k * s, 0, 3, size); g.fillRect(0, k * s, size, 3); }
  }
  addNoise(g, size, size, 34);
  return c;
}
// woven webbing: ribs along the length + twill
function webbingCanvas() {
  const s = 128, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  const n = 16;
  for (let i = 0; i < n; i++) {
    const x = i * s / n, gr = g.createLinearGradient(x, 0, x + s / n, 0);
    gr.addColorStop(0, '#3c3c3c'); gr.addColorStop(.5, '#d6d6d6'); gr.addColorStop(1, '#3c3c3c');
    g.fillStyle = gr; g.fillRect(x, 0, s / n, s);
  }
  g.globalAlpha = .22; g.strokeStyle = '#000'; g.lineWidth = 2;
  for (let k = -s; k < 2 * s; k += 8) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s, s); g.stroke(); }
  g.globalAlpha = 1;
  // darker selvedge on both edges
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, 5, s); g.fillRect(s - 5, 0, 5, s);
  addNoise(g, s, s, 24);
  return c;
}
// 3D spacer "airmesh"
function airmeshCanvas() {
  const s = 256, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, s, s);
  const r = 9, dx = 2 * r * 1.15, dy = r * 1.75;
  for (let row = -1; row * dy < s + dy; row++) for (let col = -1; col * dx < s + dx; col++) {
    const x = col * dx + (row % 2 ? dx / 2 : 0), y = row * dy;
    const gr = g.createRadialGradient(x, y, 1, x, y, r);
    gr.addColorStop(0, '#000'); gr.addColorStop(.75, '#1a1a1a'); gr.addColorStop(1, '#9a9a9a');
    g.fillStyle = gr; g.beginPath(); g.ellipse(x, y, r, r * .8, 0, 0, Math.PI * 2); g.fill();
  }
  addNoise(g, s, s, 20);
  return c;
}
// braided paracord
function braidCanvas(base, tracer) {
  const s = 64, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, s, s);
  for (let i = 0; i < 8; i++) {
    const x = i * 8;
    g.fillStyle = i % 4 === 0 ? tracer : 'rgba(0,0,0,.28)';
    g.beginPath(); g.moveTo(x, 0); g.lineTo(x + 4, 0); g.lineTo(x + 4 + 16, 32); g.lineTo(x + 16, 32); g.fill();
    g.beginPath(); g.moveTo(x + 16, 32); g.lineTo(x + 20, 32); g.lineTo(x + 4, 64); g.lineTo(x, 64); g.fill();
  }
  addNoise(g, s, s, 30);
  return c;
}
// cotton gauze: open leno weave (alpha)
function gauzeMaskCanvas() {
  const s = 128, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#000'; g.fillRect(0, 0, s, s);
  g.strokeStyle = '#fff'; g.lineCap = 'round';
  for (let i = 0; i < 8; i++) {
    const p = i * 16 + 8;
    g.lineWidth = 4.5 + Math.random();
    g.beginPath(); for (let y = 0; y <= s; y += 4) g.lineTo(p + Math.sin(y * .35 + i) * 1.1, y); g.stroke();
    g.lineWidth = 4 + Math.random();
    g.beginPath(); for (let x = 0; x <= s; x += 4) g.lineTo(x, p + Math.sin(x * .3 + i * 2) * 1.1); g.stroke();
  }
  // stray fibres
  g.lineWidth = .8; g.globalAlpha = .7;
  for (let k = 0; k < 40; k++) { const x = Math.random() * s, y = Math.random() * s, a = Math.random() * 6.3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * 9, y + Math.sin(a) * 9); g.stroke(); }
  return c;
}
// elastic crepe: crinkled weft
function crepeCanvas() {
  const s = 256, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 4) {
    g.strokeStyle = y % 8 ? '#5a5a5a' : '#c8c8c8'; g.lineWidth = 2.2;
    g.beginPath();
    for (let x = 0; x <= s; x += 4) g.lineTo(x, y + Math.sin(x * .19 + y * .7) * 1.6 + Math.sin(x * .05 + y) * 1.2);
    g.stroke();
  }
  g.globalAlpha = .25; g.strokeStyle = '#fff'; g.lineWidth = 1;
  for (let x = 0; x < s; x += 6) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, s); g.stroke(); }
  g.globalAlpha = 1;
  addNoise(g, s, s, 26);
  return c;
}
function fineWeaveCanvas() {
  const s = 128, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#909090'; g.fillRect(0, 0, s, s);
  for (let i = 0; i < s; i += 4) {
    g.fillStyle = 'rgba(255,255,255,.5)'; g.fillRect(i, 0, 2, s);
    g.fillStyle = 'rgba(0,0,0,.25)'; g.fillRect(0, i + 1, s, 1.5);
  }
  addNoise(g, s, s, 30);
  return c;
}
function prismCanvas() {
  const s = 128, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#9a9a9a'; g.fillRect(0, 0, s, s);
  for (let y = 0; y < s; y += 8) for (let x = 0; x < s; x += 8) {
    const o = (y / 8) % 2 ? 4 : 0;
    g.fillStyle = '#e8e8e8'; g.beginPath(); g.moveTo(x + o, y); g.lineTo(x + o + 4, y + 4); g.lineTo(x + o, y + 8); g.lineTo(x + o - 4, y + 4); g.fill();
  }
  addNoise(g, s, s, 18);
  return c;
}
function paperCanvas() {
  const s = 256, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  g.lineWidth = .7;
  for (let k = 0; k < 500; k++) { const x = Math.random() * s, y = Math.random() * s, a = Math.random() * 6.3, l = 3 + Math.random() * 10;
    g.strokeStyle = Math.random() < .5 ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.25)';
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke(); }
  addNoise(g, s, s, 20);
  return c;
}

/* --- decals (colour + bump drawn by the same function) */
function decal(W, H, draw) {
  const cm = mkCanvas(W, H), cb = mkCanvas(W, H);
  const gm = cm.getContext('2d'), gb = cb.getContext('2d');
  draw(gm, 'color', W, H);
  draw(gb, 'bump', W, H);
  gb.globalCompositeOperation = 'destination-over'; gb.fillStyle = '#000'; gb.fillRect(0, 0, W, H);
  return { map: tex(cm, { clampEdge: true }), bump: tex(cb, { color: false, clampEdge: true }) };
}
function hatch(g, W, H, ang, sp, c1, c2, lw) {
  g.save(); g.globalCompositeOperation = 'source-atop';
  g.translate(W / 2, H / 2); g.rotate(ang);
  const D = Math.hypot(W, H);
  g.lineWidth = lw;
  for (let x = -D; x < D; x += sp) {
    g.strokeStyle = c1; g.beginPath(); g.moveTo(x, -D); g.lineTo(x, D); g.stroke();
    g.strokeStyle = c2; g.beginPath(); g.moveTo(x + sp / 2, -D); g.lineTo(x + sp / 2, D); g.stroke();
  }
  g.restore();
}
function rrPath(g, x, y, w, h, r) {
  g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r);
  g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
}
function crossPath(g, cx, cy, s, arm, rad) {
  const a = arm / 2, h = s / 2;
  const P = [[-a, -h], [a, -h], [a, -a], [h, -a], [h, a], [a, a], [a, h], [-a, h], [-a, a], [-h, a], [-h, -a], [-a, -a]];
  g.beginPath(); g.moveTo(cx, cy - h);
  for (let k = 1; k <= 12; k++) {
    const p = P[k % 12], q = P[(k + 1) % 12];
    g.arcTo(cx + p[0], cy + p[1], cx + (p[0] + q[0]) / 2, cy + (p[1] + q[1]) / 2, rad);
  }
  g.closePath();
}
function decalMat(d, o = {}) {
  return new THREE.MeshStandardMaterial({
    map: d.map, bumpMap: d.bump, bumpScale: o.bumpScale ?? 2.5, roughness: o.roughness ?? .78,
    metalness: 0, alphaTest: .5, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4, ...o.extra
  });
}

/* ------------------------------------------------------------------ materials */
const weave = weaveCanvas(512, 32, 0);
const ripstop = weaveCanvas(512, 32, 5);
const webC = webbingCanvas();
function fabric(color, cnv, rep, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: o.rough ?? .86,
    map: tex(lighten(cnv, o.vary ?? .22), { repeat: [rep, rep] }),
    bumpMap: tex(cnv, { repeat: [rep, rep], color: false }), bumpScale: o.bump ?? 1.4,
    sheen: o.sheen ?? .7, sheenRoughness: .55, sheenColor: new THREE.Color(o.sheenColor ?? 0xffffff),
    side: o.side ?? THREE.FrontSide
  });
}
function webbing(color, o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color, roughness: o.rough ?? .78, map: tex(lighten(webC, o.vary ?? .3)), bumpMap: tex(webC, { color: false }),
    bumpScale: 2, sheen: .5, sheenRoughness: .5, sheenColor: new THREE.Color(o.sheenColor ?? 0xffffff), side: THREE.DoubleSide
  });
}
const M = {
  whiteFab: fabric(0xf2f1ed, weave, 2.6, { sheenColor: 0xffffff, vary: .2 }),
  redFab: fabric(0xa8131b, ripstop, 2.4, { sheenColor: 0xff8080, vary: .3 }),
  blackFab: fabric(0x202124, weave, 2.6, { sheenColor: 0x8a8a8a, vary: .35 }),
  baseFab: fabric(0x18191b, weave, 4, { sheenColor: 0x666666, vary: .4, rough: .93, bump: 2.2 }),
  airmesh: new THREE.MeshPhysicalMaterial({ color: 0x3a3c40, roughness: .9, map: tex(lighten(airmeshCanvas(), .55), { repeat: [3, 3] }),
    bumpMap: tex(airmeshCanvas(), { repeat: [3, 3], color: false }), bumpScale: 4, sheen: .6, sheenColor: new THREE.Color(0x999999) }),
  pipingRed: webbing(0xb0161e, { sheenColor: 0xff9090 }),
  webRed: webbing(0xb3141c, { sheenColor: 0xff9090 }),
  webBlack: webbing(0x1c1d20, { sheenColor: 0x888888 }),
  tapeRed: webbing(0x9d1219, { sheenColor: 0xff8080 }),
  tapeBlack: webbing(0x17181a, { sheenColor: 0x777777 }),
  teethRed: new THREE.MeshPhysicalMaterial({ color: 0xc41c24, roughness: .32, clearcoat: .4 }),
  teethBlack: new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: .35, clearcoat: .4 }),
  plastic: new THREE.MeshPhysicalMaterial({ color: 0x141416, roughness: .48, clearcoat: .25 }),
  metalSilver: new THREE.MeshStandardMaterial({ color: 0xc8ccd2, metalness: 1, roughness: .24 }),
  metalDark: new THREE.MeshStandardMaterial({ color: 0x2c2d31, metalness: .85, roughness: .34 }),
  threadWhite: new THREE.MeshStandardMaterial({ color: 0xeeeeea, roughness: .65 }),
  threadRed: new THREE.MeshStandardMaterial({ color: 0x7e0c12, roughness: .65 }),
  threadBlack: new THREE.MeshStandardMaterial({ color: 0x0d0d0e, roughness: .6 }),
  cordRed: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7, map: tex(braidCanvas('#b51820', '#f2f2f2')) }),
  cordBlack: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .7, map: tex(braidCanvas('#1d1d20', '#c4161d')) }),
  reflective: new THREE.MeshStandardMaterial({ color: 0xd7dade, metalness: .7, roughness: .3, bumpMap: tex(prismCanvas(), { repeat: [30, 30], color: false }),
    bumpScale: 1.2, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
  clearPVC: new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .06, metalness: 0, transparent: true, opacity: .16, clearcoat: 1,
    clearcoatRoughness: .05, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -6, polygonOffsetUnits: -6 }),
};
const paperC = paperCanvas();
M.paper = new THREE.MeshPhysicalMaterial({ color: 0xf7f6f2, roughness: .62, bumpMap: tex(paperC, { repeat: [3, 3], color: false }), bumpScale: .8 });

/* ------------------------------------------------------------------ soft "pillow" box surface */
class SoftBox {
  constructor(o) {
    Object.assign(this, { w: o.w, h: o.h, d: o.d, r: o.r, hw: o.w / 2, hh: o.h / 2, hd: o.d / 2 });
    this.c = o.center ? o.center.clone() : V();
    this.bx = o.bx ?? 0; this.bt = o.bt ?? 0; this.bb = o.bb ?? 0; this.bz = o.bz ?? 0; this.bzB = o.bzBack ?? this.bz;
    this.pw = o.pw ?? 2; this.wr = o.wrinkle ?? 0; this.wf = o.wrinkleFreq ?? 2.5; this.seed = o.seed ?? 0;
  }
  proj(lp) {
    const { hw, hh, hd, r } = this;
    const q = V(clamp(lp.x, r - hw, hw - r), clamp(lp.y, r - hh, hh - r), clamp(lp.z, r - hd, hd - r));
    let dir = lp.clone().sub(q);
    if (dir.lengthSq() < 1e-12) {
      const ax = Math.abs(lp.x) / hw, ay = Math.abs(lp.y) / hh, az = Math.abs(lp.z) / hd;
      dir = ax >= ay && ax >= az ? V(Math.sign(lp.x) || 1, 0, 0) : ay >= az ? V(0, Math.sign(lp.y) || 1, 0) : V(0, 0, Math.sign(lp.z) || 1);
    }
    dir.normalize();
    return { p: q.addScaledVector(dir, r), n: dir };
  }
  def(p, n) {
    const a = clamp(p.x / this.hw, -1, 1), b = clamp(p.y / this.hh, -1, 1), c = clamp(p.z / this.hd, -1, 1);
    const f = u => 1 - Math.pow(Math.abs(u), this.pw);
    const o = p.clone();
    o.x += a * this.bx * f(b) * f(c);
    o.y += b * (b > 0 ? this.bt : this.bb) * f(a) * f(c);
    o.z += c * (c > 0 ? this.bz : this.bzB) * f(a) * f(b);
    if (this.wr) {
      const s = this.seed, k = this.wf;
      // wrinkles: low-frequency puckering + finer creases, fading into the seams
      const edge = Math.min(1, 4 * f(a) * f(b) * f(c) + .25);
      const wv = (fbm(p.x * k + s, p.y * k, p.z * k) - .5) * 2 + .35 * Math.sin((p.x + p.z * .6) * k * 6 + fbm(p.y * 3, p.x * 3, s) * 6) * (fbm(p.z * 2 + s, p.y * 2, p.x * 2) - .3);
      o.addScaledVector(n, this.wr * wv * edge);
    }
    return o;
  }
  local(lp) { const { p, n } = this.proj(lp); return this.def(p, n); }
  frame(wp) {
    const lp = wp.clone().sub(this.c);
    const { p, n } = this.proj(lp);
    const pos = this.def(p, n);
    const t1 = new THREE.Vector3().crossVectors(n, Math.abs(n.y) < .9 ? V(0, 1, 0) : V(1, 0, 0)).normalize();
    const t2 = new THREE.Vector3().crossVectors(n, t1);
    const e = .01;
    const p1 = this.local(p.clone().addScaledVector(t1, e)).sub(pos);
    const p2 = this.local(p.clone().addScaledVector(t2, e)).sub(pos);
    const nn = new THREE.Vector3().crossVectors(p1, p2).normalize();
    if (nn.dot(n) < 0) nn.negate();
    return { pos: pos.add(this.c), normal: nn };
  }
  geometry(seg = .04) {
    const g = new THREE.BoxGeometry(this.w, this.h, this.d,
      Math.max(2, Math.ceil(this.w / seg)), Math.max(2, Math.ceil(this.h / seg)), Math.max(2, Math.ceil(this.d / seg)));
    const pos = g.attributes.position, nor = g.attributes.normal, uv = g.attributes.uv, v = V();
    for (let i = 0; i < pos.count; i++) {
      v.fromBufferAttribute(pos, i);
      const nx = Math.abs(nor.getX(i)), ny = Math.abs(nor.getY(i));
      if (nx > .5) uv.setXY(i, v.z, v.y); else if (ny > .5) uv.setXY(i, v.x, v.z); else uv.setXY(i, v.x, v.y);
      const o = this.local(v).add(this.c);
      pos.setXYZ(i, o.x, o.y, o.z);
    }
    smoothNormals(g);
    return g;
  }
}
function smoothNormals(g) {
  g.computeVertexNormals();
  const pos = g.attributes.position, nor = g.attributes.normal, map = new Map();
  const key = i => `${Math.round(pos.getX(i) * 1e4)},${Math.round(pos.getY(i) * 1e4)},${Math.round(pos.getZ(i) * 1e4)}`;
  const keys = [];
  for (let i = 0; i < pos.count; i++) {
    const k = key(i); keys.push(k);
    let a = map.get(k); if (!a) { a = [0, 0, 0]; map.set(k, a); }
    a[0] += nor.getX(i); a[1] += nor.getY(i); a[2] += nor.getZ(i);
  }
  for (let i = 0; i < pos.count; i++) {
    const a = map.get(keys[i]), l = Math.hypot(a[0], a[1], a[2]) || 1;
    nor.setXYZ(i, a[0] / l, a[1] / l, a[2] / l);
  }
}

/* ------------------------------------------------------------------ rounded-rect paths */
function rrPieces(hu, hv, r) {
  const a = hu - r, b = hv - r, q = Math.PI * r / 2;
  return [
    [2 * b, t => [hu, -b + t]],
    [q, t => { const g = t / r; return [a + r * Math.cos(g), b + r * Math.sin(g)]; }],
    [2 * a, t => [a - t, hv]],
    [q, t => { const g = Math.PI / 2 + t / r; return [-a + r * Math.cos(g), b + r * Math.sin(g)]; }],
    [2 * b, t => [-hu, b - t]],
    [q, t => { const g = Math.PI + t / r; return [-a + r * Math.cos(g), -b + r * Math.sin(g)]; }],
    [2 * a, t => [-a + t, -hv]],
    [q, t => { const g = 1.5 * Math.PI + t / r; return [a + r * Math.cos(g), -b + r * Math.sin(g)]; }],
  ];
}
const rrLen = (hu, hv, r) => rrPieces(hu, hv, r).reduce((s, p) => s + p[0], 0);
function rrAt(hu, hv, r, s) {
  const P = rrPieces(hu, hv, r), L = rrLen(hu, hv, r);
  s = ((s % L) + L) % L;
  for (const [len, f] of P) { if (s <= len) return f(s); s -= len; }
  return P[0][1](0);
}
function rrSample(hu, hv, r, s0, s1, step = .02, closed = false) {
  const n = Math.max(2, Math.ceil(Math.abs(s1 - s0) / step)), out = [];
  for (let i = 0; i < (closed ? n : n + 1); i++) out.push(rrAt(hu, hv, r, s0 + (s1 - s0) * i / n));
  return out;
}
const rrS = {
  right: (hu, hv, r, y) => y + (hv - r),
  top: (hu, hv, r, x) => 2 * (hv - r) + Math.PI * r / 2 + ((hu - r) - x),
  left: (hu, hv, r, y) => 2 * (hv - r) + Math.PI * r + 2 * (hu - r) + ((hv - r) - y),
};

/* ------------------------------------------------------------------ frames along paths */
function finishFrames(F, closed) {
  const n = F.length;
  for (let i = 0; i < n; i++) {
    const a = closed ? F[(i - 1 + n) % n] : F[Math.max(0, i - 1)];
    const b = closed ? F[(i + 1) % n] : F[Math.min(n - 1, i + 1)];
    const t = b.pos.clone().sub(a.pos).normalize();
    const nrm = F[i].normal.clone().addScaledVector(t, -F[i].normal.dot(t)).normalize();
    F[i].normal = nrm; F[i].tangent = t; F[i].binormal = new THREE.Vector3().crossVectors(t, nrm);
  }
  let L = 0; F[0].s = 0;
  for (let i = 1; i < n; i++) { L += F[i].pos.distanceTo(F[i - 1].pos); F[i].s = L; }
  F.closed = closed;
  F.len = closed ? L + F[n - 1].pos.distanceTo(F[0].pos) : L;
  return F;
}
function surfFrames(surf, pts, closed = false, lift = 0) {
  return finishFrames(pts.map(p => { const f = surf.frame(p); f.pos.addScaledVector(f.normal, typeof lift === 'function' ? lift(p) : lift); return f; }), closed);
}
function freeFrames(pts, widthHint, upHint, closed = false) {
  const n = pts.length;
  const F = pts.map(p => ({ pos: p.clone(), normal: V() }));
  for (let i = 0; i < n; i++) {
    const a = closed ? pts[(i - 1 + n) % n] : pts[Math.max(0, i - 1)];
    const b = closed ? pts[(i + 1) % n] : pts[Math.min(n - 1, i + 1)];
    const t = b.clone().sub(a).normalize();
    const w = (typeof widthHint === 'function' ? widthHint(i, pts[i]) : widthHint).clone();
    w.addScaledVector(t, -w.dot(t)).normalize();
    const nn = new THREE.Vector3().crossVectors(w, t);
    const up = typeof upHint === 'function' ? upHint(i, pts[i]) : upHint;
    if (nn.dot(up) < 0) nn.negate();
    F[i].normal = nn;
  }
  return finishFrames(F, closed);
}
function sampleFrames(F, s) {
  const n = F.length, L = F.len;
  s = F.closed ? ((s % L) + L) % L : clamp(s, 0, F[n - 1].s);
  let i = 0; while (i < n - 1 && F[i + 1].s < s) i++;
  const a = F[i];
  let b, t;
  if (i === n - 1) { b = F.closed ? F[0] : a; t = F.closed ? (s - a.s) / ((L - a.s) || 1) : 0; }
  else { b = F[i + 1]; t = (s - a.s) / ((b.s - a.s) || 1); }
  const nrm = a.normal.clone().lerp(b.normal, t).normalize(), tan = a.tangent.clone().lerp(b.tangent, t).normalize();
  return { pos: a.pos.clone().lerp(b.pos, t), normal: nrm, tangent: tan, binormal: new THREE.Vector3().crossVectors(tan, nrm).normalize() };
}
const curve = (ctrl, n) => new THREE.CatmullRomCurve3(ctrl, false, 'centripetal').getSpacedPoints(n);

/* --- swept strap / piping / padded strap */
function profile(P = 20, n = 8) {
  const out = [];
  for (let k = 0; k < P; k++) {
    const a = 2 * Math.PI * k / P, c = Math.cos(a), s = Math.sin(a);
    out.push([Math.sign(c) * Math.pow(Math.abs(c), 2 / n), Math.sign(s) * Math.pow(Math.abs(s), 2 / n)]);
  }
  return out;
}
function sweepGeo(F, o) {
  const prof = profile(o.P ?? 20, o.round ?? 8), P = prof.length, n = F.length, closed = F.closed;
  const W = o.widthFn || (() => o.width), T = o.thickFn || (() => o.thick);
  const off = o.offset ?? 0, vs = o.vScale ?? 1 / (o.width || .25), L = F.len || 1;
  const pos = [], uv = [], idx = [];
  for (let i = 0; i < n; i++) {
    const f = F[i], u = f.s / L, w = W(u) / 2, t = T(u) / 2;
    for (let k = 0; k <= P; k++) {
      const pr = prof[k % P];
      const p = f.pos.clone().addScaledVector(f.normal, o.center ? pr[1] * t : off + t + pr[1] * t).addScaledVector(f.binormal, pr[0] * w);
      pos.push(p.x, p.y, p.z); uv.push((pr[0] + 1) / 2, f.s * vs);
    }
  }
  const ring = P + 1, segs = closed ? n : n - 1;
  for (let i = 0; i < segs; i++) {
    const a = i * ring, b = ((i + 1) % n) * ring;
    for (let k = 0; k < P; k++) idx.push(a + k, b + k, a + k + 1, b + k, b + k + 1, a + k + 1);
  }
  if (!closed && o.caps !== false) {
    for (const i of [0, n - 1]) {
      const f = F[i], t = T(f.s / L) / 2, c = f.pos.clone().addScaledVector(f.normal, o.center ? 0 : off + t), ci = pos.length / 3;
      pos.push(c.x, c.y, c.z); uv.push(.5, f.s * vs);
      for (let k = 0; k < P; k++) { const a = i * ring + k, b = a + 1; i === 0 ? idx.push(ci, a, b) : idx.push(ci, b, a); }
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}

/* --- stitching (instanced thread bumps) */
class Stitches {
  constructor(mat, size = [.024, .007, .009]) { this.mat = mat; this.size = size; this.m = []; }
  add(F, o = {}) {
    const pitch = o.pitch ?? .034, end = o.to ?? F.len;
    for (let s = (o.from ?? 0) + pitch / 2; s < end; s += pitch) {
      const f = sampleFrames(F, s), u = s / F.len;
      const across = typeof o.across === 'function' ? o.across(u) : (o.across ?? 0);
      const lift = typeof o.lift === 'function' ? o.lift(u) : (o.lift ?? .003);
      const p = f.pos.clone().addScaledVector(f.normal, lift).addScaledVector(f.binormal, across);
      this.m.push(basisMatrix(p, f.tangent, f.normal));
    }
    return this;
  }
  mesh() {
    const g = new THREE.SphereGeometry(.5, 8, 5); g.scale(...this.size);
    const im = new THREE.InstancedMesh(g, this.mat, this.m.length);
    this.m.forEach((m, i) => im.setMatrixAt(i, m));
    im.receiveShadow = true;
    return im;
  }
}
function lerpPts(a, b, n = 20) { const p = []; for (let i = 0; i <= n; i++) p.push(a.clone().lerp(b, i / n)); return p; }
function boxX(surf, st, c, lift) {
  const loop = [];
  for (let k = 0; k < 4; k++) loop.push(...lerpPts(c[k], c[(k + 1) % 4]).slice(0, -1));
  st.add(surfFrames(surf, loop, true, lift), { pitch: .03 });
  st.add(surfFrames(surf, lerpPts(c[0], c[2]), false, lift), { pitch: .03 });
  st.add(surfFrames(surf, lerpPts(c[1], c[3]), false, lift), { pitch: .03 });
}

/* --- conformed decal plane */
function conformPlane(surf, O, U, Vv, w, h, off, seg = 40) {
  const g = new THREE.PlaneGeometry(w, h, seg, Math.max(2, Math.round(seg * h / w)));
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const q = O.clone().addScaledVector(U, p.getX(i)).addScaledVector(Vv, p.getY(i));
    const f = surf.frame(q); f.pos.addScaledVector(f.normal, off);
    p.setXYZ(i, f.pos.x, f.pos.y, f.pos.z);
  }
  g.computeVertexNormals();
  return g;
}

/* ------------------------------------------------------------------ zipper */
function makePull(metal, cordMat) {
  const g = new THREE.Group();
  // slider body
  const base = mesh(new RoundedBoxGeometry(.25, .03, .15, 3, .012), metal); base.position.y = .026; g.add(base);
  const top = mesh(new RoundedBoxGeometry(.22, .026, .12, 3, .011), metal); top.position.set(.01, .05, 0); g.add(top);
  const flare = mesh(new RoundedBoxGeometry(.06, .028, .17, 2, .012), metal); flare.position.set(-.11, .03, 0); g.add(flare);
  const lug = mesh(new THREE.TorusGeometry(.032, .01, 8, 18, Math.PI), metal); lug.position.set(.02, .062, 0); g.add(lug);
  // pull tab (hinged; angle set by caller)
  const pivot = new THREE.Group(); pivot.position.set(.02, .072, 0); g.add(pivot);
  const tabG = new THREE.Group(); pivot.add(tabG);
  const s = new THREE.Shape();
  s.moveTo(0, -.03); s.lineTo(.25, -.042); s.quadraticCurveTo(.33, -.045, .33, 0); s.quadraticCurveTo(.33, .045, .25, .042); s.lineTo(0, .03);
  s.quadraticCurveTo(-.03, .03, -.03, 0); s.quadraticCurveTo(-.03, -.03, 0, -.03);
  const slot = new THREE.Path(); slot.moveTo(.255, -.025); slot.lineTo(.29, -.025); slot.lineTo(.29, .025); slot.lineTo(.255, .025); slot.closePath();
  s.holes.push(slot);
  const tg = new THREE.ExtrudeGeometry(s, { depth: .012, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 2, curveSegments: 10 });
  tg.rotateX(-Math.PI / 2); tg.translate(0, -.006, 0);
  tabG.add(mesh(tg, metal));
  // paracord loop through the slot + barrel knot
  const pts = [];
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2, x = .43 - Math.cos(a) * .165, w = Math.sin(a) * (.05 + .02 * (1 - Math.cos(a)) / 2);
    pts.push(V(x, w * .3, w * .95));
  }
  const loopCurve = new THREE.CatmullRomCurve3(pts, true);
  const cg = new THREE.TubeGeometry(loopCurve, 80, .019, 10, true);
  const cm = cordMat.clone(); cm.map = cordMat.map.clone(); cm.map.repeat.set(26, 1); cm.map.needsUpdate = true;
  tabG.add(mesh(cg, cm));
  const knot = mesh(new THREE.CylinderGeometry(.033, .033, .08, 16), cm); knot.rotation.z = Math.PI / 2; knot.position.set(.39, 0, 0); tabG.add(knot);
  for (const dx of [-.025, 0, .025]) { const r = mesh(new THREE.TorusGeometry(.033, .008, 6, 16), cm); r.rotation.y = Math.PI / 2; r.position.set(.39 + dx, 0, 0); tabG.add(r); }
  const tail = mesh(new THREE.CylinderGeometry(.017, .02, .07, 10), cm); tail.rotation.z = Math.PI / 2; tail.position.set(.45, 0, 0); tabG.add(tail);
  tabG.rotation.z = .1;
  g.userData.pivot = pivot;
  return g;
}
function makeZipper(F, o) {
  const G = new THREE.Group();
  G.add(mesh(sweepGeo(F, { width: o.tapeW ?? .2, thick: .012, offset: -.004, round: 10 }), o.tapeMat));
  const pitch = .016, count = Math.floor(F.len / pitch) - 2;
  const tg = new RoundedBoxGeometry(.011, .012, .05, 1, .004);
  const teeth = new THREE.InstancedMesh(tg, o.teethMat, count);
  for (let i = 0; i < count; i++) {
    const f = sampleFrames(F, (i + 1.5) * pitch);
    const p = f.pos.clone().addScaledVector(f.normal, .014).addScaledVector(f.binormal, (i % 2 ? 1 : -1) * .011);
    teeth.setMatrixAt(i, basisMatrix(p, f.tangent, f.normal));
  }
  teeth.castShadow = true; teeth.receiveShadow = true;
  G.add(teeth);
  if (!F.closed) for (const s of [.012, F.len - .012]) {
    const f = sampleFrames(F, s);
    const stop = mesh(new RoundedBoxGeometry(.03, .02, .08, 1, .006), o.metal);
    G.add(place(stop, f.pos.clone().addScaledVector(f.normal, .015), f.tangent, f.normal));
  }
  for (const sl of o.sliders || []) {
    const f = sampleFrames(F, sl.s);
    const tan = sl.flip ? f.tangent.clone().negate() : f.tangent;
    const pull = makePull(o.metal, o.cordMat);
    place(pull, f.pos.clone().addScaledVector(f.normal, .01), tan, f.normal);
    const bin = new THREE.Vector3().crossVectors(tan, f.normal);
    const gw = V(0, -1, 0);
    let gx = gw.dot(tan), gz = gw.dot(bin);
    let th = Math.hypot(gx, gz) > .35 ? Math.atan2(-gz, gx) : (sl.angle ?? 0);
    pull.userData.pivot.rotation.y = th;
    G.add(pull);
  }
  return G;
}

/* --- buckles & hardware */
function makeBuckle(mat) {
  const g = new THREE.Group();
  const fem = mesh(new RoundedBoxGeometry(.2, .055, .3, 3, .02), mat); fem.position.x = -.08; g.add(fem);
  for (let k = 0; k < 6; k++) { const r = mesh(new RoundedBoxGeometry(.012, .01, .2, 1, .004), mat); r.position.set(-.155 + k * .026, .03, 0); g.add(r); }
  const win = mesh(new RoundedBoxGeometry(.05, .01, .07, 1, .004), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .9 }));
  win.position.set(.0, .024, .08); g.add(win); const win2 = win.clone(); win2.position.z = -.08; g.add(win2);
  const s = new THREE.Shape();
  s.moveTo(.02, -.115); s.lineTo(.2, -.13); s.quadraticCurveTo(.24, -.13, .24, -.09); s.lineTo(.24, .09);
  s.quadraticCurveTo(.24, .13, .2, .13); s.lineTo(.02, .115); s.lineTo(.02, -.115);
  const h = new THREE.Path(); h.moveTo(.17, -.09); h.lineTo(.205, -.09); h.lineTo(.205, .09); h.lineTo(.17, .09); h.closePath(); s.holes.push(h);
  const mg = new THREE.ExtrudeGeometry(s, { depth: .034, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2 });
  mg.rotateX(-Math.PI / 2); mg.translate(0, -.017, 0);
  g.add(mesh(mg, mat));
  const bar = mesh(new RoundedBoxGeometry(.04, .04, .3, 2, .015), mat); bar.position.x = -.2; g.add(bar);
  return g;
}
function makeLadder(mat) {
  const s = new THREE.Shape(); s.moveTo(-.14, -.15); s.lineTo(.14, -.15); s.lineTo(.14, .15); s.lineTo(-.14, .15); s.lineTo(-.14, -.15);
  for (const x of [-.09, .03]) { const h = new THREE.Path(); h.moveTo(x, -.12); h.lineTo(x + .055, -.12); h.lineTo(x + .055, .12); h.lineTo(x, .12); h.closePath(); s.holes.push(h); }
  const g = new THREE.ExtrudeGeometry(s, { depth: .025, bevelEnabled: true, bevelThickness: .006, bevelSize: .008, bevelSegments: 2 });
  g.rotateX(-Math.PI / 2);
  return mesh(g, mat);
}

/* ------------------------------------------------------------------ blades */
// Two-sided blade surface. Along the length t∈[0,1] (y = t·len) the cross-section runs from
// spine(t) (u=0) to edge(t) (u=1) in x; half-thickness is half(t,u) on ±z. Top and bottom
// keep separate vertices so the edges stay crisp.
function bladeGeo({ len, nAlong = 240, nAcross = 48, spine, edge, half, uvAcross = (u) => u }) {
  const pos = [], uv = [], idx = [], row = nAcross + 1;
  for (const side of [1, -1]) {
    const base = pos.length / 3;
    for (let i = 0; i <= nAlong; i++) {
      const t = i / nAlong, x0 = spine(t), x1 = edge(t);
      for (let j = 0; j <= nAcross; j++) {
        const u = j / nAcross;
        pos.push(x0 + (x1 - x0) * u, t * len, side * Math.max(0, half(t, u)));
        uv.push(uvAcross(u), t);
      }
    }
    for (let i = 0; i < nAlong; i++) for (let j = 0; j < nAcross; j++) {
      const a = base + i * row + j, b = a + row;
      side > 0 ? idx.push(a, a + 1, b, b, a + 1, b + 1) : idx.push(a, b, a + 1, b, b + 1, a + 1);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  return g;
}
// Brushed-steel roughness: fine streaks along the blade (v), honed edges smoother.
function brushedCanvas({ w = 256, h = 1024, edges = [0, 1], edgeW = .08, base = 150, edgeVal = 70 } = {}) {
  const c = mkCanvas(w, h), g = c.getContext('2d');
  g.fillStyle = `rgb(${base},${base},${base})`; g.fillRect(0, 0, w, h);
  for (let k = 0; k < 1400; k++) {
    const x = Math.random() * w, y = Math.random() * h, l = 40 + Math.random() * 300, v = base + (Math.random() - .5) * 90;
    g.strokeStyle = `rgba(${v},${v},${v},.5)`; g.lineWidth = Math.random() * 1.4 + .3;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + (Math.random() - .5) * 3, y + l); g.stroke();
  }
  for (const e of edges) {
    const gr = g.createLinearGradient(e * w, 0, (e === 0 ? edgeW : 1 - edgeW) * w, 0);
    gr.addColorStop(0, `rgba(${edgeVal},${edgeVal},${edgeVal},1)`); gr.addColorStop(1, `rgba(${edgeVal},${edgeVal},${edgeVal},0)`);
    g.fillStyle = gr; g.fillRect(0, 0, w, h);
  }
  return c;
}
function leatherCanvas(stripes = 10) {
  const s = 512, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#8a8a8a'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 4000; k++) { const x = Math.random() * s, y = Math.random() * s, r = Math.random() * 2.2;
    g.fillStyle = Math.random() < .5 ? 'rgba(0,0,0,.18)' : 'rgba(255,255,255,.14)'; g.beginPath(); g.arc(x, y, r, 0, 7); g.fill(); }
  // spiral wrap seams
  const step = s / stripes;
  for (let k = -stripes; k < stripes * 2; k++) {
    const y0 = k * step;
    g.strokeStyle = 'rgba(0,0,0,.75)'; g.lineWidth = 5;
    g.beginPath(); g.moveTo(0, y0); g.lineTo(s, y0 + step); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 3;
    g.beginPath(); g.moveTo(0, y0 + 6); g.lineTo(s, y0 + step + 6); g.stroke();
  }
  return c;
}
function stippleCanvas() {
  const s = 256, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 2600; k++) { const x = Math.random() * s, y = Math.random() * s;
    const gr = g.createRadialGradient(x, y, 0, x, y, 3); gr.addColorStop(0, 'rgba(255,255,255,.6)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(x - 3, y - 3, 6, 6); }
  return c;
}

/* ------------------------------------------------------------------ hard goods (tools) */
// Lathe a profile of [radius, height] pairs around y, then point it along 'x', 'y' or 'z'.
function latheAxis(prof, axis = 'y', seg = 64) {
  const g = new THREE.LatheGeometry(prof.map(([r, h]) => new THREE.Vector2(Math.max(1e-4, r), h)), seg);
  if (axis === 'x') g.rotateZ(-Math.PI / 2);
  if (axis === 'z') g.rotateX(Math.PI / 2);
  return g;
}
const v2 = pts => pts.map(([x, y]) => new THREE.Vector2(x, y));
function shapeFrom(pts, holes = []) {
  const s = new THREE.Shape(v2(pts));
  for (const h of holes) s.holes.push(new THREE.Path(v2(h)));
  return s;
}
function circlePts(cx, cy, r, n = 32, cw = true) {
  const out = [];
  for (let k = 0; k < n; k++) { const a = (cw ? -1 : 1) * k / n * Math.PI * 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}
function rrPts(x, y, w, h, r, n = 6) {
  const out = [], c = [[x + w - r, y + r, -Math.PI / 2], [x + w - r, y + h - r, 0], [x + r, y + h - r, Math.PI / 2], [x + r, y + r, Math.PI]];
  for (const [cx, cy, a0] of c) for (let k = 0; k <= n; k++) { const a = a0 + k / n * Math.PI / 2; out.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]); }
  return out;
}
// Extrude along z, centred on z = 0.
function extrude(shape, depth, bevel = .006, o = {}) {
  const g = new THREE.ExtrudeGeometry(shape, { depth, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: o.bevelSize ?? bevel, bevelSegments: o.segs ?? 3, curveSegments: o.curve ?? 24, steps: 1 });
  g.translate(0, 0, -depth / 2);
  return g;
}
function knurlCanvas(step = 8) {
  const s = 128, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  for (let k = -s; k < 2 * s; k += step) {
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.6)';
    g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s, s); g.stroke();
    g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke();
  }
  return c;
}
function woodCanvas(base = [150, 98, 56]) {
  const W = 256, H = 1024, c = mkCanvas(W, H), g = c.getContext('2d'), img = g.createImageData(W, H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const n = fbm(x * .02, y * .004, 1.3), ring = Math.sin((x * .09 + n * 9) * 1.0);
    const k = .82 + .07 * ring + .08 * (fbm(x * .3, y * .01, 7) - .5);
    const i = (y * W + x) * 4;
    img.data[i] = base[0] * k; img.data[i + 1] = base[1] * k; img.data[i + 2] = base[2] * k; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
// Flat printed label (transparent background) as a plane in the x-y plane.
function label(lines, w, h, o = {}) {
  const W = 1024, H = Math.max(32, Math.round(W * h / w)), c = mkCanvas(W, H), g = c.getContext('2d');
  if (o.bg) { g.fillStyle = o.bg; g.fillRect(0, 0, W, H); }
  g.fillStyle = o.color ?? '#111'; g.textBaseline = 'middle'; g.textAlign = o.align ?? 'left';
  const lh = H / lines.length;
  lines.forEach((ln, i) => {
    const [txt, size = .7, weight = 700] = [].concat(ln);
    g.font = `${weight} ${lh * size}px ${o.font ?? '"IBM Plex Sans", Arial, sans-serif'}`;
    g.fillText(txt, o.align === 'center' ? W / 2 : 12, lh * (i + .55));
  });
  if (o.draw) o.draw(g, W, H);
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex(c, { clampEdge: true }), transparent: !o.bg, depthWrite: !!o.bg, roughness: o.rough ?? .5, metalness: o.metal ?? 0,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4
  }));
  return m;
}
const HM = {
  chrome: new THREE.MeshStandardMaterial({ color: 0xe1e5ea, metalness: 1, roughness: .1 }),
  satin: new THREE.MeshStandardMaterial({ color: 0xc9ced4, metalness: 1, roughness: .32,
    roughnessMap: tex(brushedCanvas({ w: 128, h: 512, edges: [], base: 150 }), { repeat: [2, 2], color: false }) }),
  blackOxide: new THREE.MeshStandardMaterial({ color: 0x2a2b2e, metalness: .85, roughness: .42 }),
  forged: new THREE.MeshStandardMaterial({ color: 0x3b3d40, metalness: .85, roughness: .5, bumpMap: tex(stippleCanvas(), { repeat: [4, 4], color: false }), bumpScale: .8 }),
  alu: new THREE.MeshStandardMaterial({ color: 0xbcc1c7, metalness: 1, roughness: .34 }),
  brass: new THREE.MeshStandardMaterial({ color: 0xcaa35a, metalness: 1, roughness: .28 }),
  rubber: new THREE.MeshStandardMaterial({ color: 0x1b1b1c, roughness: .9, bumpMap: tex(stippleCanvas(), { repeat: [3, 3], color: false }), bumpScale: 1.5 }),
  glass: new THREE.MeshPhysicalMaterial({ color: 0xf2f7f8, roughness: .02, transparent: true, opacity: .18, depthWrite: false, clearcoat: 1, side: THREE.DoubleSide }),
};
HM.plastic = (color, rough = .42) => new THREE.MeshPhysicalMaterial({ color, roughness: rough, clearcoat: .25, clearcoatRoughness: .4 });
HM.paint = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: .38, metalness: .2, clearcoat: .6, clearcoatRoughness: .25 });
HM.knurled = (color = 0x1c1d1f, rep = [20, 3]) => new THREE.MeshStandardMaterial({ color, metalness: .75, roughness: .36, bumpMap: tex(knurlCanvas(), { repeat: rep, color: false }), bumpScale: 2.5 });
HM.wood = (base, rep = [1, 1]) => { const w = woodCanvas(base); return new THREE.MeshPhysicalMaterial({ map: tex(w, { repeat: rep }), roughness: .55, clearcoat: .5, clearcoatRoughness: .3, bumpMap: tex(w, { repeat: rep, color: false }), bumpScale: .5 }); };

/* ------------------------------------------------------------------ firearms (display props) */
const GM = {
  nitride: new THREE.MeshPhysicalMaterial({ color: 0x1f2022, metalness: .7, roughness: .36, clearcoat: .15, clearcoatRoughness: .4 }),
  blued: new THREE.MeshPhysicalMaterial({ color: 0x161a22, metalness: .95, roughness: .2, clearcoat: .5, clearcoatRoughness: .15 }),
  stainless: new THREE.MeshStandardMaterial({ color: 0xbcc1c7, metalness: 1, roughness: .26,
    roughnessMap: tex(brushedCanvas({ w: 128, h: 512, edges: [], base: 140 }), { repeat: [3, 1], color: false }) }),
  park: new THREE.MeshStandardMaterial({ color: 0x2b2c2a, metalness: .55, roughness: .62, bumpMap: tex(stippleCanvas(), { repeat: [6, 6], color: false }), bumpScale: .4 }),
  polymer: new THREE.MeshPhysicalMaterial({ color: 0x1c1c1e, roughness: .62, clearcoat: .1, bumpMap: tex(stippleCanvas(), { repeat: [5, 5], color: false }), bumpScale: .35 }),
  dark: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .9 }),
  white: new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: .4 }),
};
GM.cerakote = (color, rep = 4) => new THREE.MeshPhysicalMaterial({ color, metalness: .15, roughness: .58, clearcoat: .1, bumpMap: tex(stippleCanvas(), { repeat: [rep, rep], color: false }), bumpScale: .3 });
GM.stipple = (color) => new THREE.MeshPhysicalMaterial({ color, roughness: .85, bumpMap: tex(stippleCanvas(), { repeat: [10, 10], color: false }), bumpScale: 3 });
// side-profile part: extrude an [x, y] outline through its thickness (z), centred on z = zc
function slab(pts, depth, mat, o = {}) {
  const shape = pts instanceof THREE.Shape ? pts : shapeFrom(pts, o.holes || []);
  const m = mesh(extrude(shape, depth, o.bevel ?? .01, { segs: o.segs ?? 3, curve: o.curve ?? 24 }), mat);
  m.position.z = o.z ?? 0;
  return m;
}
// MIL-STD-1913 Picatinny rail running along +x from x0, top at y (scene units, 1 = 10 cm)
function picatinny(len, mat, o = {}) {
  const g = new THREE.Group(), w = o.width ?? .212;
  const base = mesh(new RoundedBoxGeometry(len, .035, w * .78, 2, .008), mat); base.position.set(len / 2, .0175, 0); g.add(base);
  const n = Math.floor(len / .1001);
  const lug = new THREE.InstancedMesh(new RoundedBoxGeometry(.052, .055, w, 2, .007), mat, n);
  const m = new THREE.Matrix4();
  for (let i = 0; i < n; i++) { m.makeTranslation(.05 + i * .1001, .06, 0); lug.setMatrixAt(i, m); }
  lug.castShadow = lug.receiveShadow = true; g.add(lug);
  return g;
}
// row of dark grooves (serrations, vents) as thin boxes, centred at (x0..x1, y), on face z
function grooves(x0, x1, n, y, h, z, o = {}) {
  const g = new THREE.InstancedMesh(new THREE.BoxGeometry(o.w ?? .016, h, o.d ?? .006), o.mat ?? GM.dark, n);
  const m = new THREE.Matrix4(), q = new THREE.Quaternion().setFromEuler(new THREE.Euler(0, 0, o.tilt ?? 0));
  for (let i = 0; i < n; i++) { m.compose(new THREE.Vector3(x0 + (x1 - x0) * (n === 1 ? .5 : i / (n - 1)), y, z), q, new THREE.Vector3(1, 1, 1)); g.setMatrixAt(i, m); }
  return g;
}

export { bladeGeo, brushedCanvas, leatherCanvas, stippleCanvas };
export { GM, slab, picatinny, grooves };
export { latheAxis, shapeFrom, circlePts, rrPts, extrude, knurlCanvas, woodCanvas, label, HM };
export { THREE, RoundedBoxGeometry, V, clamp, smooth, hash3, noise3, fbm, basisMatrix, place, mesh, mkCanvas, tex, addNoise, lighten, weaveCanvas, webbingCanvas, airmeshCanvas, braidCanvas, gauzeMaskCanvas, crepeCanvas, fineWeaveCanvas, prismCanvas, paperCanvas, decal, hatch, rrPath, crossPath, decalMat, fabric, webbing, M, SoftBox, smoothNormals, rrPieces, rrLen, rrAt, rrSample, rrS, finishFrames, surfFrames, freeFrames, sampleFrames, curve, profile, sweepGeo, Stitches, lerpPts, boxX, conformPlane, makePull, makeZipper, makeBuckle, makeLadder };
