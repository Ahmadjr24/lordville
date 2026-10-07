// Unit of red blood cells: clear PVC bag with RF-welded border, ISBT 128 label,
// printed volume scale, two twist-off outlet ports and a coiled, crimp-sealed donor tube.
// Built upright (ports at +y, front at +z), then laid flat on its back.
import { THREE, RoundedBoxGeometry, V, mesh, mkCanvas, tex, addNoise, SoftBox, conformPlane, finishFrames, sweepGeo, curve } from '../kit.js';

function film(o = {}) {
  return new THREE.MeshPhysicalMaterial({
    color: 0xf2f6f8, metalness: 0, roughness: o.rough ?? .08, transmission: 1, thickness: o.thick ?? .02, ior: 1.45,
    clearcoat: .6, clearcoatRoughness: .1, side: THREE.DoubleSide, ...o.extra
  });
}
function barcode(g, x, y, w, h, seed) {
  let s = seed;
  const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  g.fillStyle = '#111';
  for (let cx = x; cx < x + w;) { const bw = 2 + Math.floor(rnd() * 4) * 2; if (rnd() > .45) g.fillRect(cx, y, bw, h); cx += bw + 2; }
}
function labelDecal() {
  const W = 1000, H = 1050, c = mkCanvas(W, H), g = c.getContext('2d');
  g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, W, H);
  g.strokeStyle = '#222'; g.lineWidth = 3;
  g.beginPath(); g.moveTo(W / 2, 20); g.lineTo(W / 2, H - 20); g.moveTo(20, H / 2); g.lineTo(W - 20, H / 2); g.stroke();
  g.fillStyle = '#111'; g.textBaseline = 'top';
  // upper left: donation identification number
  barcode(g, 40, 50, 420, 110, 17);
  g.font = '600 34px "IBM Plex Mono", "Courier New", monospace'; g.fillText('W0123 26 456789 ▣ 8', 40, 175);
  g.font = '500 24px Arial, sans-serif'; g.fillText('Lordville Regional Blood Service', 40, 230);
  g.fillText('Collected: 2026-09-28', 40, 270);
  g.font = '600 22px Arial'; g.fillText('VOLUNTEER DONOR', 40, 320);
  g.font = '400 20px Arial'; g.fillText('Properly identify intended recipient.', 40, 370); g.fillText('Rx only. See circular of information.', 40, 400);
  // upper right: ABO / Rh, blue band for group O
  g.fillStyle = '#2f6fd1'; g.fillRect(W / 2 + 20, 30, W / 2 - 50, 430);
  barcode(g, W / 2 + 60, 50, 380, 80, 33);
  g.fillStyle = '#fff'; g.font = '800 250px Arial, sans-serif'; g.fillText('O', W / 2 + 140, 140);
  g.font = '700 54px Arial'; g.fillText('Rh POSITIVE', W / 2 + 70, 390);
  // lower left: product
  g.fillStyle = '#111'; barcode(g, 40, H / 2 + 30, 420, 90, 51);
  g.font = '600 26px "IBM Plex Mono", monospace'; g.fillText('E0336V00', 40, H / 2 + 130);
  g.font = '800 46px Arial'; g.fillText('RED BLOOD CELLS', 40, H / 2 + 190);
  g.font = '500 28px Arial'; g.fillText('Leukocytes reduced', 40, H / 2 + 250); g.fillText('AS-3 (Nutricel)', 40, H / 2 + 290);
  g.fillText('Approx. 300 mL', 40, H / 2 + 330); g.fillText('Store at 1–6 °C', 40, H / 2 + 370);
  // lower right: expiry
  barcode(g, W / 2 + 40, H / 2 + 30, 400, 90, 77);
  g.font = '600 26px "IBM Plex Mono", monospace'; g.fillText('2026-11-09 23:59', W / 2 + 40, H / 2 + 130);
  g.font = '700 34px Arial'; g.fillText('EXPIRES', W / 2 + 40, H / 2 + 190);
  g.font = '800 64px Arial'; g.fillText('09 NOV 2026', W / 2 + 40, H / 2 + 235);
  g.font = '500 26px Arial'; g.fillText('CMV negative', W / 2 + 40, H / 2 + 330); g.fillText('Irradiated: no', W / 2 + 40, H / 2 + 370);
  addNoise(g, W, H, 8);
  return c;
}
function scaleDecal() {
  const W = 256, H = 1400, c = mkCanvas(W, H), g = c.getContext('2d');
  g.clearRect(0, 0, W, H);
  g.fillStyle = 'rgba(20,20,24,.9)'; g.font = '600 30px Arial'; g.textBaseline = 'middle';
  for (let k = 0; k <= 10; k++) {
    const y = 60 + k * 128, major = k % 2 === 0;
    g.fillRect(150, y - 2, major ? 90 : 55, 4);
    if (major && k) { g.fillText(String(k * 50), 40, y); }
  }
  g.font = '700 30px Arial'; g.fillText('mL', 60, 40);
  return c;
}

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group();
  outer.add(G);

  /* blood volume and the clear PVC pillow around it */
  const blood = new SoftBox({ w: 1.14, h: 1.74, d: .05, r: .024, bz: .1, pw: 2.2, wrinkle: .003, wrinkleFreq: 3, seed: 2 });
  const bloodMat = new THREE.MeshPhysicalMaterial({ color: 0x4d0207, roughness: .22, clearcoat: 1, clearcoatRoughness: .15, sheen: .3, sheenColor: new THREE.Color(0x8a1018) });
  G.add(mesh(blood.geometry(.02), bloodMat));
  const pillow = new SoftBox({ w: 1.17, h: 1.77, d: .06, r: .029, bz: .105, pw: 2.2, wrinkle: .003, wrinkleFreq: 3, seed: 2 });
  const pm = new THREE.Mesh(pillow.geometry(.02), film());
  G.add(pm);

  /* welded border with hanger holes and slit (bottom) */
  {
    const W = 1.42, H = 2.2, r = .09, s = new THREE.Shape();
    s.moveTo(-W / 2 + r, -H / 2); s.lineTo(W / 2 - r, -H / 2); s.quadraticCurveTo(W / 2, -H / 2, W / 2, -H / 2 + r);
    s.lineTo(W / 2, H / 2 - r); s.quadraticCurveTo(W / 2, H / 2, W / 2 - r, H / 2); s.lineTo(-W / 2 + r, H / 2);
    s.quadraticCurveTo(-W / 2, H / 2, -W / 2, H / 2 - r); s.lineTo(-W / 2, -H / 2 + r); s.quadraticCurveTo(-W / 2, -H / 2, -W / 2 + r, -H / 2);
    const inner = new THREE.Path(), iw = 1.17 / 2, ih = 1.77 / 2, ir = .03;
    inner.moveTo(-iw + ir, -ih); inner.lineTo(iw - ir, -ih); inner.quadraticCurveTo(iw, -ih, iw, -ih + ir); inner.lineTo(iw, ih - ir);
    inner.quadraticCurveTo(iw, ih, iw - ir, ih); inner.lineTo(-iw + ir, ih); inner.quadraticCurveTo(-iw, ih, -iw, ih - ir); inner.lineTo(-iw, -ih + ir);
    inner.quadraticCurveTo(-iw, -ih, -iw + ir, -ih);
    s.holes.push(inner);
    for (const x of [-.42, .42]) { const h = new THREE.Path(); h.absarc(x, -1.0, .045, 0, Math.PI * 2, true); s.holes.push(h); }
    const slit = new THREE.Path(); slit.moveTo(-.12, -1.01); slit.lineTo(.12, -1.01); slit.lineTo(.12, -.99); slit.lineTo(-.12, -.99); slit.closePath(); s.holes.push(slit);
    const g = new THREE.ExtrudeGeometry(s, { depth: .012, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 1, curveSegments: 24 });
    g.translate(0, 0, -.006);
    const ec = mkCanvas(256), eg = ec.getContext('2d');
    eg.fillStyle = '#808080'; eg.fillRect(0, 0, 256, 256);
    eg.strokeStyle = 'rgba(255,255,255,.6)'; eg.lineWidth = 2;
    for (let k = 0; k < 256; k += 8) { eg.beginPath(); eg.moveTo(k, 0); eg.lineTo(k, 256); eg.stroke(); }
    const border = new THREE.Mesh(g, film({ rough: .3, thick: .012, extra: { bumpMap: tex(ec, { repeat: [40, 40], color: false }), bumpScale: 1 } }));
    G.add(border);
  }

  /* label + printed scale */
  const label = new THREE.MeshStandardMaterial({ map: tex(labelDecal(), { clampEdge: true }), roughness: .55, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  G.add(mesh(conformPlane(pillow, V(-.06, -.22, .1), V(1, 0, 0), V(0, 1, 0), .9, .945, .003, 40), label));
  const ink = new THREE.MeshStandardMaterial({ map: tex(scaleDecal(), { clampEdge: true }), roughness: .4, alphaTest: .4, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  G.add(new THREE.Mesh(conformPlane(pillow, V(.47, .05, .1), V(1, 0, 0), V(0, 1, 0), .18, 1.5, .002, 8), ink));

  /* outlet ports with twist-off protectors */
  const clear = film({ rough: .12, thick: .03 });
  const cap = new THREE.MeshPhysicalMaterial({ color: 0xe8edf2, roughness: .35, transmission: .4, thickness: .05, clearcoat: .5 });
  for (const x of [-.25, .25]) {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.05, .05, .42, 32), clear);
    tube.position.set(x, .99, 0); G.add(tube);
    const c1 = mesh(new THREE.CylinderGeometry(.062, .062, .12, 32), cap); c1.position.set(x, 1.24, 0); G.add(c1);
    const tab = mesh(new RoundedBoxGeometry(.2, .16, .025, 2, .01), cap); tab.position.set(x, 1.37, 0); G.add(tab);
    const ring = mesh(new THREE.TorusGeometry(.064, .01, 8, 32), cap); ring.rotation.x = Math.PI / 2; ring.position.set(x, 1.18, 0); G.add(ring);
  }

  /* donor tube: leaves the top, coils flat beside the bag, heat-sealed segments */
  {
    const floorZ = -(.03 + .105) + .042;
    const ctrl = [V(0, .8, 0), V(0, 1.1, 0), V(.02, 1.42, -.03), V(.35, 1.66, floorZ), V(.8, 1.62, floorZ)];
    const C = V(1.48, 1.05, 0), turns = 2.3, r0 = .64, r1 = .24, a0 = 2.5;
    const spiral = [];
    for (let i = 0; i <= 260; i++) {
      const k = i / 260, a = a0 - k * turns * Math.PI * 2, r = r0 + (r1 - r0) * k;
      spiral.push(V(C.x + r * Math.cos(a), C.y + r * Math.sin(a), floorZ));
    }
    const pts = curve([...ctrl, ...spiral.filter((_, i) => i % 6 === 0)], 700);
    const F = finishFrames(pts.map(p => ({ pos: p, normal: V(0, 0, 1) })), false);
    const L = F.len, crimps = [];
    for (let s = 1.6; s < L - .1; s += .62) crimps.push(s / L);
    crimps.push(1 - .02 / L);
    const cr = u => crimps.reduce((m, c) => Math.max(m, Math.exp(-Math.pow((u - c) * L / .022, 2))), 0);
    G.add(new THREE.Mesh(sweepGeo(F, { center: true, P: 24, round: 2, width: .08, widthFn: u => .08 * (1 + .55 * cr(u)), thickFn: u => .08 * (1 - .78 * cr(u)) }), clear));
    const inside = u => u > .006 ? 1 - cr(u) : 0;
    G.add(mesh(sweepGeo(F, { center: true, P: 16, round: 2, width: .06, widthFn: u => .058 * inside(u), thickFn: u => .058 * inside(u) }), bloodMat));
  }

  G.rotation.x = -Math.PI / 2;
  outer.traverse(o => { if (o.isMesh && o.material.transmission) o.castShadow = false; });
  return outer;
}
