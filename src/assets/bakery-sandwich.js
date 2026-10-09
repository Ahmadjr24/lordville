// Bakery lunch sandwich (display prop, after a Parisian jambon-beurre): a 280 mm half baguette
// tradition, split low along its length and hinged at the back, its scored, flour-dusted crust
// lifted to show a butter smear, three slices of ham folded in waves over the cut edge and two
// slices of emmental with eyes. The back half sits in a kraft paper sandwich bag with a clear
// window, its mouth folded open and its closed end folded over and sealed with a label.
// Bread axis along x, y up, the cut opens toward +z.
import { THREE, V, mesh, mkCanvas, tex } from '../kit.js';
import { crustCanvas, bumpCanvas, crumbCanvas, fbm, smooth } from '../food.js';

const L = 2.8, W = .31, Hh = .24, N = 2.1, BF = .92;   // length, half-width, half-height, superellipse power, flattened bottom
const yc = .15;                                       // height of the cut above the table
const se = (v, p) => Math.sign(v) * Math.pow(Math.abs(v), p);
const wid = x => W * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / (L / 2), 4)), .38) * (1 + .05 * (fbm(x * 1.3, 1, 2) - .5));
const hgt = x => Hh * Math.pow(Math.max(0, 1 - Math.pow(Math.abs(x) / (L / 2), 4)), .3) * (1 + .06 * (fbm(x * 1.1, 4, 1) - .5));
const zoff = x => .035 * Math.sin(x * 1.2 + .4);
const y0 = x => hgt(x) * BF;                          // centre of the section; the flattened bottom sits on y = 0
function pt(x, phi) {
  const c = Math.cos(phi), s = Math.sin(phi), h = hgt(x);
  return V(x, y0(x) + (s < 0 ? h * BF : h) * se(s, 2 / N), zoff(x) + wid(x) * se(c, 2 / N));
}
// angle on the right (front) side where the section crosses the cut height
function phiCut(x) {
  const h = hgt(x), r = (yc - y0(x)) / (h * BF);
  return -Math.asin(Math.min(1, Math.pow(Math.min(1, Math.abs(r)), N / 2))) * Math.sign(-r || 1);
}
const zc = x => wid(x) * Math.pow(Math.abs(Math.cos(phiCut(x))), 2 / N);

// three grigne scores along the top at about 30° to the axis
const SC = [-.85, 0, .85], CA = Math.cos(.5), SA = Math.sin(.5);
function score(x, z) {
  let g = 0, e = 0;
  for (const xk of SC) {
    const al = (x - xk) * CA + z * SA, ac = -(x - xk) * SA + z * CA, env = Math.max(0, 1 - (al / .42) ** 2);
    g = Math.max(g, Math.exp(-((ac / .04) ** 2)) * env); e = Math.max(e, Math.exp(-(((ac - .06) / .025) ** 2)) * env);
  }
  return [g, e];
}

function loft(nx, na, f) {
  const pos = [], col = [], uv = [], idx = [], c = new THREE.Color();
  for (let i = 0; i <= nx; i++) for (let j = 0; j <= na; j++) { const r = f(i / nx, j / na, c); pos.push(r.x, r.y, r.z); col.push(c.r, c.g, c.b); uv.push(r.x * .6, j / na); }
  for (let i = 0; i < nx; i++) for (let j = 0; j < na; j++) { const a = i * (na + 1) + j, b = a + na + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals(); return g;
}

export function build() {
  const G = new THREE.Group();
  const crust = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78, side: THREE.DoubleSide,
    map: tex(crustCanvas({ base: '#ffffff', spots: ['#e2cdb8', '#f6eee4', '#c8ad94'], n: 2600 }), { repeat: [3, 2] }),
    bumpMap: tex(bumpCanvas({ crack: 120 }), { repeat: [2, 2], color: false }), bumpScale: 1.6 });
  const crumb = new THREE.MeshStandardMaterial({ map: tex(crumbCanvas({ base: '#eedfc0', hole: '#d9c49a', n: 700 }), { repeat: [1.5, 1.5] }),
    bumpMap: tex(crumbCanvas({ base: '#9a9a9a', hole: '#3a3a3a', n: 700 }), { repeat: [1.5, 1.5], color: false }), bumpScale: 1, roughness: .92, side: THREE.DoubleSide });
  const cMain = new THREE.Color(0xa8693a), cLight = new THREE.Color(0xd4a062), cDark = new THREE.Color(0x7e4a22), cFlour = new THREE.Color(0xece6da), cScore = new THREE.Color(0xd4a062);
  const xs = t => -L / 2 + L * t;

  /* bottom half: crust below the cut, flat crumb on top */
  const bottom = loft(160, 40, (t, u, c) => {
    const x = xs(t), p1 = phiCut(x), p2 = -Math.PI - p1, phi = p1 + (p2 - p1) * u, p = pt(x, phi);
    c.copy(cLight).lerp(cMain, smooth(.05, .14, p.y) * .6).lerp(cDark, smooth(.2, 1, Math.abs(x) / (L / 2)) * .35);
    c.offsetHSL(0, 0, (fbm(x * 5, p.y * 8, p.z * 8) - .5) * .12); return p;
  });
  G.add(mesh(bottom, crust));
  const cutFace = (y) => loft(160, 8, (t, u, c) => { const x = xs(t), z = zc(x); c.set(0xffffff); return V(x, y, zoff(x) + (-z + 2 * z * u) * .985); });
  G.add(mesh(cutFace(yc), crumb));
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xa8693a, roughness: .8 });
  const rim = (y, grp) => { for (const sgn of [1, -1]) { const pts = []; for (let k = 0; k <= 120; k++) { const x = -L / 2 * .97 + L * .97 * k / 120; pts.push(V(x, y, zoff(x) + sgn * zc(x) * .985)); } grp.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 160, .014, 6), rimMat)); } };
  rim(yc + .001, G);

  /* top half, built closed, then swung open on its back edge */
  const T = new THREE.Group();
  const top = loft(200, 64, (t, u, c) => {
    const x = xs(t), p1 = phiCut(x), p2 = Math.PI - p1, phi = p1 + (p2 - p1) * u, p = pt(x, phi);
    const [g, e] = score(x, p.z - zoff(x)), up = smooth(.25, .45, p.y);
    p.y += (-g * .05 + e * .03) * up;
    const near = Math.max(g, e, smooth(.38, .44, p.y) * .6), fl = smooth(.55, .62, fbm(x * 25, p.z * 25, 7)) * smooth(.25, .42, p.y) * (.35 + .65 * near);                        // patchy flour on the crown
    c.copy(cMain).lerp(cLight, smooth(.3, .1, p.y) * .5).lerp(cDark, (e + smooth(.25, 1, Math.abs(x) / (L / 2)) * .3) * up);
    c.lerp(cFlour, fl * .6).lerp(cScore, g * up);
    c.offsetHSL(0, 0, (fbm(x * 5, p.y * 8, p.z * 8) - .5) * .12); return p;
  });
  T.add(mesh(top, crust));
  T.add(mesh(cutFace(yc), crumb)); rim(yc - .001, T);
  // hinge on the back edge: rotate about the line (y = yc, z = -zc) so the front lifts ~13 mm
  const hz = zoff(0) - zc(0), P = new THREE.Group(); P.position.set(0, yc, hz); T.position.set(0, -yc, -hz); P.add(T); P.rotation.x = -.32; G.add(P);

  /* butter smear on the bottom crumb */
  { const s = new THREE.Shape(); const n = 80;
    for (let k = 0; k <= n; k++) { const t = k / n, x = -1.15 + 2.3 * t, z = zc(x) * (.78 + .1 * fbm(x * 6, 2, 3)); k ? s.lineTo(x, z) : s.moveTo(x, z); }
    for (let k = n; k >= 0; k--) { const t = k / n, x = -1.15 + 2.3 * t, z = -zc(x) * (.7 + .1 * fbm(x * 6, 5, 3)); s.lineTo(x, z); }
    const g = new THREE.ShapeGeometry(s, 4); g.rotateX(Math.PI / 2); g.scale(1, 1, -1);
    { const p = g.attributes.position; for (let i = 0; i < p.count; i++) p.setY(i, .004 + .003 * fbm(p.getX(i) * 12, p.getZ(i) * 12, 1)); g.computeVertexNormals(); }
    const b = mesh(g, new THREE.MeshPhysicalMaterial({ color: 0xf1dc8a, roughness: .35, clearcoat: .4, side: THREE.DoubleSide })); b.position.y = yc; G.add(b); }

  /* ham: three slices folded in waves, each rolling over the cut edge in a soft fold */
  const ham = new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .5, clearcoat: .12, clearcoatRoughness: .4, sheen: .4, sheenColor: new THREE.Color(0xffd6d0), side: THREE.DoubleSide,
    bumpMap: tex(bumpCanvas({ n: 900, crack: 0 }), { repeat: [3, 3], color: false }), bumpScale: .5 });
  [[-1.22, -.32, .025, 1], [-.45, .45, .055, 2], [.32, 1.22, .035, 3]].forEach(([xa, xb, yb, seed]) => {
    const rf = .04, drop = .05, pink = new THREE.Color(0xe79c9a), fat = new THREE.Color(0xf6d3cc);
    const g = loft(48, 40, (t, v, c) => {
      const x = xa + (xb - xa) * t, zf = zoff(x) + zc(x) + .03 + .04 * (fbm(x * 3, seed, 1) - .5), zb = zoff(x) - zc(x) * .85;
      const span = zf - zb, s = v * (span + Math.PI / 2 * rf + drop);
      const wave = .035 * Math.sin(x * 8 + seed * 2) + .01 * Math.sin(x * 19 + seed);
      const yB = yc + yb + wave + .01 * Math.sin(t * Math.PI);
      let z, y;
      if (s < span) { z = zb + s; y = yB + (s / span) ** 3 * -.01; }
      else if (s < span + Math.PI / 2 * rf) { const a = (s - span) / rf; z = zf + rf * Math.sin(a); y = yB - .01 - rf + rf * Math.cos(a); }
      else { const h = s - span - Math.PI / 2 * rf; z = zf + rf - h * .15; y = yB - .01 - rf - h; }   // hanging fold over the bottom crust
      // slice ends curl down a little
      y -= .02 * (smooth(.85, 1, t) + smooth(.15, 0, t));
      c.copy(pink).lerp(fat, smooth(.08, 0, Math.min(t, 1 - t)) * .9).offsetHSL(0, 0, (fbm(x * 9, s * 9, seed) - .5) * .06);
      return V(x, s < span ? Math.max(y, yc + .002) : y, z);
    });
    G.add(mesh(g, ham));
    const g2 = g.clone(); g2.translate(0, -.018, -.01); G.add(mesh(g2, ham));   // second slice under it: ~2 mm layers
  });

  /* emmental: two slices with eyes, front edges showing past the ham */
  const cheese = new THREE.MeshPhysicalMaterial({ color: 0xf2dc8e, roughness: .55, clearcoat: .1 });
  [[-.62, 1.4], [.55, 2.7]].forEach(([cx, seed]) => {
    const w = .78, d = .5, s = new THREE.Shape(); s.moveTo(-w / 2, -d / 2); s.lineTo(w / 2, -d / 2); s.lineTo(w / 2, d / 2); s.lineTo(-w / 2, d / 2); s.closePath();
    let r = seed * 100; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 6; k++) { const h = new THREE.Path(), rr = .018 + rnd() * .03; h.absarc(-w / 2 + .08 + rnd() * (w - .16), -d / 2 + .08 + rnd() * (d - .16), rr, 0, Math.PI * 2, true); s.holes.push(h); }
    // a bitten-out eye on the front edge, as cheese slices show
    const g = new THREE.ExtrudeGeometry(s, { depth: .018, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2, curveSegments: 16 });
    g.rotateX(-Math.PI / 2);
    const m = mesh(g, cheese); m.position.set(cx, yc + .085, zoff(cx) + zc(cx) - d / 2 + .02); m.rotation.y = (seed - 2) * .05; G.add(m);
  });

  /* kraft sandwich bag around the back half: rounded sleeve, clear window on top, folded and labelled end */
  {
    const xm = -.25, xe = -1.62, hw = .37, hh = .26, rc = .13, ny = hh + .005;
    const kc = mkCanvas(1024, 1024), g = kc.getContext('2d');
    g.fillStyle = '#b58b5c'; g.fillRect(0, 0, 1024, 1024);
    let r = 21; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 9000; k++) { g.fillStyle = rnd() > .5 ? 'rgba(120,85,50,.12)' : 'rgba(215,180,135,.12)'; g.fillRect(rnd() * 1024, rnd() * 1024, 1 + rnd() * 10, 1); }   // fibres
    // window: u around the sleeve with the top face centred at u = .5; v along x
    g.clearRect(1024 * .19, 1024 * .24, 1024 * .12, 1024 * .58);
    for (const u of [.08, .44, .62, .9]) { g.fillStyle = 'rgba(90,60,30,.25)'; g.fillRect(1024 * u, 0, 3, 1024); g.fillStyle = 'rgba(240,210,170,.25)'; g.fillRect(1024 * u + 3, 0, 3, 1024); }
    g.fillStyle = '#7a5530'; g.font = '700 40px "IBM Plex Sans", Arial'; g.textAlign = 'center';
    g.save(); g.translate(1024 * .2, 512); g.rotate(-Math.PI / 2); g.fillText('LORDVILLE BAKERY · FRESH TODAY', 0, 0); g.restore();
    const kraft = new THREE.MeshStandardMaterial({ map: tex(kc), roughness: .9, alphaTest: .5, side: THREE.DoubleSide,
      bumpMap: tex(bumpCanvas({ n: 600, crack: 30 }), { repeat: [2, 2], color: false }), bumpScale: 1.2 });
    // rounded-rectangle perimeter, u = 0 at the bottom centre
    const per = u => {
      const a = u * Math.PI * 2 - Math.PI / 2, c = Math.cos(a), s = Math.sin(a);
      const k = 1 / Math.pow(Math.pow(Math.abs(c) * hh / hw, 4) + Math.pow(Math.abs(s), 4), .25);   // squircle
      return [c * k * hw * .98, s * k * hh];
    };
    const bag = loft(70, 96, (t, u, c) => {
      const x = xm + (xe - xm) * t, [z, y] = per(u);
      const fin = smooth(.82, 1, t), mouth = smooth(.08, 0, t);
      const wr = 1 + .02 * (fbm(u * 10, x * 6, 2) - .5) + mouth * .04 - .03 * smooth(.6, 1, Math.sin(u * Math.PI * 2 - Math.PI / 2)) * (1 - fin);   // top sags a little
      c.set(0xffffff);
      return V(x, ny + y * wr * (1 - fin * .93), z * wr * (1 + fin * .05));
    });
    { const uvs = bag.attributes.uv; for (let i = 0; i < uvs.count; i++) { const iu = i % 97, ix = Math.floor(i / 97); uvs.setXY(i, iu / 96, ix / 70); } }
    G.add(mesh(bag, kraft));
    const win = loft(30, 24, (t, u, c) => { const x = xm + (xe - xm) * (.18 + t * .58), [z, y] = per(.19 + u * .12); c.set(0xffffff); return V(x, ny + y * .995, z * .995); });
    G.add(mesh(win, new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .08, transmission: .92, thickness: .002, transparent: true, opacity: .35, clearcoat: 1, side: THREE.DoubleSide })));
    // folded-over closed end and its label
    const flap = mesh(new THREE.BoxGeometry(.32, .012, hw * 2.05), kraft); flap.position.set(xe + .14, ny + .03, 0); flap.rotation.z = .04; G.add(flap);
    const lbl = mkCanvas(512, 340), lg = lbl.getContext('2d');
    lg.fillStyle = '#f4f1e8'; lg.fillRect(0, 0, 512, 340); lg.strokeStyle = '#7a5530'; lg.lineWidth = 8; lg.strokeRect(14, 14, 484, 312);
    lg.fillStyle = '#3a2a1a'; lg.textAlign = 'center'; lg.font = '700 64px Georgia, serif'; lg.fillText('Jambon-beurre', 256, 110);
    lg.font = '500 34px "IBM Plex Sans", Arial'; lg.fillText('ham · butter · emmental', 256, 170); lg.fillText('baguette tradition', 256, 215);
    lg.font = '700 40px "IBM Plex Sans", Arial'; lg.fillText('€ 18', 256, 285);
    const label = new THREE.Mesh(new THREE.PlaneGeometry(.6, .4), new THREE.MeshStandardMaterial({ map: tex(lbl), roughness: .6, polygonOffset: true, polygonOffsetFactor: -4 }));
    label.rotation.x = -Math.PI / 2; label.rotation.z = Math.PI / 2; label.position.set(xe + .12, ny + .038, 0); G.add(label);
  }
  return G;
}
