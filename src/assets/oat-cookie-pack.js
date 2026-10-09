// Oat cookie pack (display prop, after an organic oat-cookie roll pack): a printed, glossy OPP
// flow-wrap tube 70 mm across and 200 mm long holding 22 stacked oat cookies, about 62 mm by 9 mm.
// It lies on its side with the crimp-sealed fin at the left and the right end torn open, the next
// cookie in view; three cookies are out on the table, craggy and cracked, studded with oat flakes.
// Pack axis along x, y up.
import { THREE, V, mesh, mkCanvas, tex } from '../kit.js';
import { blob, scatter, tint, fbm, smooth } from '../food.js';

const PR = .35, PL = 2.0;   // pack radius and length

/* ---------------- cookie */
// 3–6 short fissures per cookie as segments (model units); used by the geometry and the texture
function fissures(seed) {
  let s = seed * 7919 + 17; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const n = 3 + Math.floor(r() * 4), out = [];
  for (let k = 0; k < n; k++) { const q = Math.sqrt(r()) * .2, a = r() * Math.PI * 2, x = Math.cos(a) * q, z = Math.sin(a) * q, b = r() * Math.PI, l = .1 + r() * .15; out.push([x - Math.cos(b) * l / 2, z - Math.sin(b) * l / 2, x + Math.cos(b) * l / 2, z + Math.sin(b) * l / 2]); }
  return out;
}
function fissure(x, z, seed) {
  let f = 0;
  for (const [ax, az, bx, bz] of fissures(seed)) {
    const dx = bx - ax, dz = bz - az, t = Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / (dx * dx + dz * dz)));
    const d = Math.hypot(x - ax - t * dx, z - az - t * dz), w = .008 * Math.sin(Math.PI * t) + .001;
    f = Math.max(f, Math.exp(-((d / w) ** 2)));
  }
  return f;
}
function cookieShape(seed, R = .31, T = .088) {
  // rounded disc: latitudes below te form the rolled edge, above it the (domed) faces
  const rr = T / 2, te = .6;
  return d => {
    const k = Math.hypot(d.x, d.z), a = Math.atan2(d.z, d.x), th = Math.asin(Math.min(1, Math.abs(d.y))), sg = Math.sign(d.y) || 1;
    const wob = 1 + .05 * (fbm(Math.cos(a) * 1.6 + seed, Math.sin(a) * 1.6, seed) - .5) * 2 + .012 * (fbm(Math.cos(a) * 6, Math.sin(a) * 6, seed) - .5), Rw = R * wob;
    let rad, y;
    if (th < te) { const ph = th / te * Math.PI / 2; rad = Rw - rr + rr * Math.cos(ph); y = sg * rr * Math.sin(ph); }
    else { const t = (Math.PI / 2 - th) / (Math.PI / 2 - te); rad = (Rw - rr) * t; y = sg * rr; }
    if (d.y > 0) y += .012 * (1 - (rad / R) ** 2) + .012 * (fbm(d.x * 14 + seed, 1, d.z * 14) - .5) * smooth(.3, .7, Math.abs(d.y)) - fissure(Math.cos(a) * rad, Math.sin(a) * rad, seed) * .01;   // low dome, lumpy crumbs, fissures
    if (k < 1e-9) rad = 0;
    return V(Math.cos(a) * rad, y, Math.sin(a) * rad);
  };
}
function cookieCanvas(seed, bump) {
  const S = 512, c = mkCanvas(S), g = c.getContext('2d');
  let s = seed * 997 + 13; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  g.fillStyle = bump ? '#808080' : '#c99a5e'; g.fillRect(0, 0, S, S);
  const P = v => (v * 1.5 + .5) * S;   // model x/z -> canvas, matching the planar UVs
  // mottled bake and oat bits
  for (let k = 0; k < 2200; k++) {
    const pal = bump ? ['#9a9a9a', '#5a5a5a', '#b4b4b4'] : ['#b8894e', '#d6a96c', '#a8733c', '#dcbc85'];
    g.globalAlpha = .12 + r() * .25; g.fillStyle = pal[Math.floor(r() * pal.length)];
    g.beginPath(); g.ellipse(r() * S, r() * S, 4 + r() * 12, 3 + r() * 8, r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  // fissures: dark floor, lighter raised edges
  g.globalAlpha = 1; g.lineCap = 'round';
  for (const [ax, az, bx, bz] of fissures(seed)) {
    // jagged path through the segment, so the fissure reads as a tear in the dough
    const pts = []; for (let k = 0; k <= 8; k++) { const t = k / 8, j = k % 8 ? (r() - .5) * 10 : 0; pts.push([P(ax + (bx - ax) * t) + j, P(az + (bz - az) * t) - j * .6]); }
    const draw = (col, w) => { g.strokeStyle = col; g.lineWidth = w; g.beginPath(); pts.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); };
    draw(bump ? '#a8a8a8' : '#d4ac74', 9); draw(bump ? '#202020' : '#8a5a2b', 3.5);
  }
  if (!bump) { g.fillStyle = '#fff6e4'; for (let k = 0; k < 500; k++) { g.globalAlpha = .3 + r() * .5; g.fillRect(r() * S, r() * S, 1.5, 1.5); } }   // sugar sparkle
  g.globalAlpha = 1;
  return c;
}
function cookie(seed, flakes = true) {
  const C = new THREE.Group(), shape = cookieShape(seed);
  const body = new THREE.Color(0xffffff), edge = new THREE.Color(0xc8a07a), under = new THREE.Color(0xb88a5e);
  const geo = blob(shape, (d, p, c) => { const rr = Math.hypot(p.x, p.z) / .31; c.copy(body).lerp(edge, smooth(.8, 1.02, rr)); if (d.y < -.2) c.lerp(under, .7); }, { w: 96, h: 64 });
  { const uv = geo.attributes.uv, p = geo.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * 1.5 + .5, p.getZ(i) * 1.5 + .5); }
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, map: tex(cookieCanvas(seed, false)), bumpMap: tex(cookieCanvas(seed, true), { color: false }), bumpScale: 2.2, roughness: .85 });
  C.add(mesh(geo, mat));
  if (flakes) {
    const fl = new THREE.CylinderGeometry(.03, .032, .005, 10); fl.scale(1, 1, .7);
    const half = new THREE.CylinderGeometry(.03, .032, .005, 10, 1, false, 0, Math.PI); half.scale(1, 1, .7);
    C.add(tint(scatter(shape, fl, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), 20, rnd => { const y = .5 + rnd() * .5, a = rnd() * Math.PI * 2, q = Math.sqrt(1 - y * y); return V(Math.cos(a) * q, y, Math.sin(a) * q); }, { lift: -.002, scale: [.65, 1.3], tilt: .7, seed }), [0xd9bc86, 0xd2b07a, 0xdcc290]));
    C.add(tint(scatter(shape, half, new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), 6, rnd => { const y = .5 + rnd() * .5, a = rnd() * Math.PI * 2, q = Math.sqrt(1 - y * y); return V(Math.cos(a) * q, y, Math.sin(a) * q); }, { lift: -.002, scale: [.7, 1.1], tilt: .7, seed: seed + 50 }), [0xd9bc86, 0xd2b07a]));
  }
  return C;
}

/* ---------------- printed film */
function printCanvas() {
  // u (x) runs around the tube, v (y) along it: logo end at the top of the canvas
  const W = 2048, H = 2048, c = mkCanvas(W, H), g = c.getContext('2d');
  const gr = g.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, '#86c04a'); gr.addColorStop(1, '#73ae3d'); g.fillStyle = gr; g.fillRect(0, 0, W, H);
  const F = (w, sz, fam = '"IBM Plex Sans", Arial, sans-serif') => `${w} ${sz}px ${fam}`;
  // front panel centred at u = .5
  const cx = W / 2, pw = W * .42;
  g.fillStyle = '#3e8a3a';
  g.beginPath(); g.moveTo(cx - pw / 2 - 60, H * .5); g.bezierCurveTo(cx - pw / 2 + 120, H * .44, cx - pw * .1, H * .56, cx - pw / 2 + 40, H * .66); g.bezierCurveTo(cx - pw * .2, H * .76, cx - pw / 2 + 120, H * .9, cx - pw / 2 - 60, H * .92); g.fill();
  g.beginPath(); g.moveTo(cx + pw / 2 + 60, H * .52); g.bezierCurveTo(cx + pw * .1, H * .55, cx + pw * .25, H * .7, cx + pw / 2 + 60, H * .78); g.fill();
  // cream logo box with a sun-over-fields mark
  g.fillStyle = '#f3efd8'; g.fillRect(cx - pw * .32, H * .08, pw * .64, H * .18);
  g.fillStyle = '#2f4a1e'; g.save(); g.translate(cx, H * .155);
  g.beginPath(); g.arc(0, 0, 70, Math.PI, 0); g.fill();
  g.fillStyle = '#f3efd8'; for (let k = 0; k < 5; k++) g.fillRect(-80, -55 + k * 14, 160, 5);
  g.restore();
  g.fillStyle = '#1d1d1b'; g.font = F(700, 86); g.textAlign = 'center'; g.fillText('LORDVILLE', cx, H * .235);
  // title
  g.fillStyle = '#1f3a7a'; g.font = F('italic 800', 210, 'Georgia, serif');
  g.fillText('Oat', cx, H * .39); g.fillText('Cookies', cx, H * .49);
  g.font = F(600, 60); g.fillText('oat cookies · biscuits à l’avoine', cx, H * .545);
  // 43 % oat flakes badge
  g.fillStyle = '#3e8a3a'; g.beginPath(); g.arc(cx + pw * .36, H * .6, 120, 0, Math.PI * 2); g.fill();
  g.fillStyle = '#ffffff'; g.font = F(800, 72); g.fillText('43 %', cx + pw * .36, H * .595); g.font = F(600, 40); g.fillText('oat flakes', cx + pw * .36, H * .625);
  // cookie illustration
  g.save(); g.translate(cx - pw * .02, H * .76);
  const ck = g.createRadialGradient(-40, -40, 20, 0, 0, 260); ck.addColorStop(0, '#d8ad72'); ck.addColorStop(.85, '#b98546'); ck.addColorStop(1, '#94642f');
  g.fillStyle = ck; g.beginPath(); g.ellipse(0, 0, 270, 250, .1, 0, Math.PI * 2); g.fill();
  let s = 3; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 900; k++) { g.fillStyle = ['#e9d2a2', '#a46f37', '#c79358'][k % 3]; g.globalAlpha = .5; const a = r() * Math.PI * 2, q = Math.sqrt(r()) * 245; g.beginPath(); g.ellipse(Math.cos(a) * q, Math.sin(a) * q, 3 + r() * 9, 2 + r() * 4, r() * 3, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1; g.restore();
  // oat sprig on the left
  g.strokeStyle = '#e8b54a'; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - pw * .5, H * .86); g.quadraticCurveTo(cx - pw * .48, H * .7, cx - pw * .4, H * .58); g.stroke();
  g.fillStyle = '#f2c35a'; for (let k = 0; k < 9; k++) { const t = k / 9, x = cx - pw * .5 + t * pw * .1, y = H * (.84 - t * .24); g.beginPath(); g.ellipse(x + (k % 2 ? 40 : -10), y, 46, 15, k % 2 ? -.5 : .5, 0, Math.PI * 2); g.fill(); }
  // bottom organic band
  g.fillStyle = '#d7e34a'; g.fillRect(cx - pw * .38, H * .93, pw * .76, H * .045);
  g.fillStyle = '#1d1d1b'; g.font = F(700, 64); g.fillText('organic · since 1984', cx, H * .965);
  // back panel: ingredients, nutrition and barcode around u = 0 / 1
  g.textAlign = 'left'; g.fillStyle = '#1d1d1b'; g.font = F(500, 34);
  const bx = W * .04, lines = ['Ingredients: wholemeal OAT flakes 43 %,', 'cane sugar, WHEAT flour, sunflower oil,', 'BUTTER, raising agent, sea salt.', '', 'Nutrition per 100 g', 'Energy 2010 kJ / 480 kcal', 'Fat 20 g · Carbohydrate 64 g', 'Sugars 24 g · Protein 7.5 g · Salt 0.4 g', '', 'Store cool and dry.  250 g e'];
  lines.forEach((t, i) => g.fillText(t, bx, H * .2 + i * 48));
  g.fillStyle = '#fff'; g.fillRect(bx, H * .62, 330, 190); g.fillStyle = '#000';
  for (let k = 0; k < 60; k++) if (r() > .4) g.fillRect(bx + 15 + k * 5, H * .63, r() > .5 ? 3 : 2, 140);
  g.font = F(500, 28); g.fillText('4 104420 071 836', bx + 40, H * .62 + 178);
  return c;
}

export function build() {
  const G = new THREE.Group(), cy = PR;
  /* film tube: crimp-sealed fin on the left, torn open on the right */
  const nu = 160, nv = 120, pos = [], uv = [], idx = [], x0 = -PL / 2 - .22, x1 = PL / 2 + .02;
  for (let j = 0; j <= nv; j++) {
    const t = j / nv, x = x0 + (x1 - x0) * t;
    const f = smooth(-PL / 2 + .02, x0 + .02, x);                 // 0 on the tube, 1 at the crimp
    for (let i = 0; i <= nu; i++) {
      const u = i / nu, a = u * Math.PI * 2 - Math.PI / 2;           // u = .5 faces +z
      const wr = 1 + .025 * f * (fbm(u * 18, x * 9, 1) - .5) * 2 + .006 * (fbm(u * 30, x * 30, 3) - .5) - .012 * (1 - f) * (.5 + .5 * Math.cos((x + PL / 2 - .07) / .088 * Math.PI * 2)) + .006 * smooth(PL / 2 - .25, PL / 2, Math.abs(x)) * (fbm(u * 8 + x * 8, x * 3, 5) - .5) * 2;
      const tear = x > PL / 2 - .06 ? smooth(PL / 2 - .06, x1, x) : 0;
      let px = x, py = Math.sin(a) * PR * wr * (1 - f * .97), pz = Math.cos(a) * PR * wr * (1 + f * .5);
      if (tear) { px -= tear * .06 * (fbm(u * 14, 2, 7) + .3 * Math.sin(u * 60)); py *= 1 + tear * .05; pz *= 1 + tear * .05; }   // ragged, slightly flared torn edge
      pos.push(px, py + cy, pz); uv.push(u, 1 - (x - x0) / (x1 - x0));
    }
  }
  for (let j = 0; j < nv; j++) for (let i = 0; i < nu; i++) { const a = j * (nu + 1) + i, b = a + nu + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const film = new THREE.BufferGeometry(); film.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); film.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); film.setIndex(idx); film.computeVertexNormals();
  const print = new THREE.MeshPhysicalMaterial({ map: tex(printCanvas()), roughness: .28, clearcoat: .7, clearcoatRoughness: .15, side: THREE.FrontSide });
  G.add(mesh(film, print));
  const inner = mesh(film, new THREE.MeshStandardMaterial({ color: 0xe9ebee, metalness: .6, roughness: .35, side: THREE.BackSide })); G.add(inner);
  // crimped end fin with serrations
  { const c = mkCanvas(256, 64), g = c.getContext('2d'); g.fillStyle = '#7cb846'; g.fillRect(0, 0, 256, 64); g.fillStyle = 'rgba(0,0,0,.25)'; for (let k = 0; k < 64; k += 4) g.fillRect(0, k, 256, 2);
    const fin = mesh(new THREE.BoxGeometry(.12, .006, PR * Math.PI * .5 * 2.04), new THREE.MeshPhysicalMaterial({ map: tex(c, { repeat: [1, 6] }), roughness: .3, clearcoat: .6 }));
    fin.position.set(x0 - .055, cy, 0); G.add(fin); }
  // long back seal
  const seam = mesh(new THREE.BoxGeometry(PL - .1, .008, .05), print); seam.position.set(0, cy - PR - .002, 0); seam.rotation.x = .1; G.add(seam);

  /* the stack inside: 22 cookies on edge along the tube, the last in view at the open end */
  const stackGeoSrc = cookie(11, false).children[0];
  for (let k = 0; k < 22; k++) {
    const m = k === 21 ? cookie(21, true) : new THREE.Mesh(stackGeoSrc.geometry, stackGeoSrc.material);
    m.rotation.set(k * .7, 0, -Math.PI / 2); m.position.set(-PL / 2 + .07 + k * .088, cy - .02, 0); G.add(m);
  }

  /* three cookies out on the table, one resting across another, a few crumbs */
  const out = [[1.55, .044, .2, 0, .3], [1.2, .044, .9, 0, 1.4], [1.72, .12, .42, .12, 2.2]];
  out.forEach(([x, y, z, tilt, ry], i) => { const c = cookie(31 + i * 7); c.position.set(x, y, z); c.rotation.set(tilt, ry, tilt * .5); G.add(c); });
  const crumbGeo = new THREE.DodecahedronGeometry(.012, 0), cm = new THREE.InstancedMesh(crumbGeo, new THREE.MeshStandardMaterial({ color: 0xc08f55, roughness: .9 }), 30), M = new THREE.Matrix4();
  let s = 9; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < 30; k++) { const sc = .5 + r() * 1.3; M.compose(V(1.0 + r() * 1.1, .006 * sc, -.1 + r() * 1.2), new THREE.Quaternion().setFromEuler(new THREE.Euler(r() * 3, r() * 3, r() * 3)), V(sc, sc * .7, sc)); cm.setMatrixAt(k, M); }
  cm.castShadow = cm.receiveShadow = true; G.add(cm);
  G.position.x = -.4;
  return G;
}
