// Latin-pattern machete: 46 cm 1075 carbon-steel blade with black coating and a
// bright ground edge bevel, moulded polymer handle with brass rivets and a paracord lanyard.
import { THREE, V, clamp, smooth, mesh, mkCanvas, tex, addNoise, lighten, freeFrames, sweepGeo, bladeGeo, stippleCanvas, braidCanvas } from '../kit.js';

const BEVEL = .7; // where the edge grind starts, as a fraction of blade width from the spine

function bladeMaps() {
  const W = 256, H = 2048;
  const col = mkCanvas(W, H), cg = col.getContext('2d');
  const mr = mkCanvas(W, H), mg = mr.getContext('2d'); // g = roughness, b = metalness
  // grind line wanders slightly, like a hand-finished edge
  const grind = y => (BEVEL + .012 * Math.sin(y * .011) + .006 * Math.sin(y * .047)) * W;
  for (let y = 0; y < H; y++) {
    const gx = grind(y);
    cg.fillStyle = '#1b1c1e'; cg.fillRect(0, y, gx, 1);
    cg.fillStyle = '#c9cdd2'; cg.fillRect(gx, y, W - gx, 1);
    mg.fillStyle = 'rgb(0,150,40)'; mg.fillRect(0, y, gx, 1);
    mg.fillStyle = 'rgb(0,70,255)'; mg.fillRect(gx, y, W - gx, 1);
  }
  // grinding scratches across the bevel, wear scuffs through the coating
  for (let k = 0; k < 2200; k++) {
    const y = Math.random() * H, x = grind(y) + Math.random() * (W - grind(y));
    const v = 170 + Math.random() * 60;
    cg.strokeStyle = `rgba(${v},${v},${v + 5},.5)`; cg.lineWidth = .7;
    cg.beginPath(); cg.moveTo(x, y); cg.lineTo(x + 20, y - 6); cg.stroke();
  }
  for (let k = 0; k < 260; k++) {
    const x = Math.random() * W * BEVEL, y = Math.random() * H, l = 6 + Math.random() * 40, a = Math.random() * Math.PI;
    cg.strokeStyle = 'rgba(120,124,130,.55)'; cg.lineWidth = .8 + Math.random();
    cg.beginPath(); cg.moveTo(x, y); cg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); cg.stroke();
    mg.strokeStyle = 'rgba(0,110,180,.7)'; mg.lineWidth = .8 + Math.random();
    mg.beginPath(); mg.moveTo(x, y); mg.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); mg.stroke();
  }
  // etched marking near the handle
  cg.save(); cg.translate(W * .3, H * .7); cg.rotate(-Math.PI / 2); cg.scale(-1, 1); // the blade is flipped after building, so pre-mirror the etch
  cg.fillStyle = 'rgba(150,152,156,.75)'; cg.font = '600 34px "IBM Plex Mono", "Courier New", monospace';
  cg.fillText('1075 CARBON  ·  18 IN', 0, 0); cg.restore();
  addNoise(cg, W, H, 10);
  return { map: tex(col, { clampEdge: true }), mr: tex(mr, { color: false, clampEdge: true }) };
}

export function build() {
  const G = new THREE.Group();

  /* blade */
  const len = 4.6;
  const spine = t => t < .8 ? 0 : .3 * Math.pow((t - .8) / .2, 1.7);
  const edge = t => {
    const w0 = .42 + .16 * smooth(0, .8, t);
    if (t <= .82) return w0;
    const e = (t - .82) / .18, wTop = .42 + .16 * smooth(0, .8, .82);
    return wTop - (wTop - .3) * Math.pow(e, 2.1);
  };
  const T = t => .028 * (1 - .35 * t);
  const geo = bladeGeo({
    len, nAlong: 300, nAcross: 60, spine, edge,
    half: (t, u) => {
      const r = Math.sqrt(clamp(u / .035, 0, 1));
      const bev = u > BEVEL ? Math.pow((1 - u) / (1 - BEVEL), 1.15) : 1;
      return T(t) / 2 * r * bev;
    }
  });
  geo.rotateX(Math.PI);
  geo.translate(-.05, .05, 0);
  const { map, mr } = bladeMaps();
  const bladeMat = new THREE.MeshPhysicalMaterial({ color: 0xffffff, map, metalness: 1, roughness: 1, metalnessMap: mr, roughnessMap: mr, clearcoat: .2, clearcoatRoughness: .5 });
  G.add(mesh(geo, bladeMat));

  /* handle: curved toward the edge at the butt, guard flare and finger swells */
  const hc = y => V(.17 + .085 * Math.pow(Math.max(0, y) / 1.45, 2.2), y, 0);
  const pts = [];
  for (let i = 0; i <= 140; i++) pts.push(hc(-.06 + 1.52 * i / 140));
  const F = freeFrames(pts, V(1, 0, 0), V(0, 0, 1));
  const Wf = u => .36 + .11 * smooth(.08, 0, u) + .13 * smooth(.86, 1, u) - .02 * Math.max(0, Math.sin((u - .12) / .7 * Math.PI * 3)) * (u > .12 && u < .82 ? 1 : 0);
  const Tf = u => .23 + .03 * Math.sin(Math.PI * u) + .02 * smooth(.9, 1, u);
  const st = stippleCanvas();
  const poly = new THREE.MeshPhysicalMaterial({
    color: 0x2f3427, roughness: .78, map: tex(lighten(st, .3), { repeat: [2, 2] }),
    bumpMap: tex(st, { repeat: [2, 2], color: false }), bumpScale: 2.5, sheen: .3, sheenColor: new THREE.Color(0x9aa38a)
  });
  G.add(mesh(sweepGeo(F, { center: true, widthFn: Wf, thickFn: Tf, width: .4, round: 3, P: 36, vScale: 2.5 }), poly));
  // parting line of the mould
  const seam = mesh(sweepGeo(F, { center: true, widthFn: u => Wf(u) + .006, thickFn: () => .012, width: .4, round: 4, P: 16 }),
    new THREE.MeshStandardMaterial({ color: 0x23271d, roughness: .6 }));
  G.add(seam);

  /* brass rivets, both sides */
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a25a, metalness: 1, roughness: .3 });
  for (const [y, u] of [[.28, .23], [.72, .52], [1.12, .78]]) {
    const c = hc(y);
    for (const sz of [1, -1]) {
      const r = mesh(new THREE.SphereGeometry(.048, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), brass);
      r.scale.y = .32; r.rotation.x = sz * Math.PI / 2; r.position.set(c.x, y, sz * (Tf(u) / 2 - .006));
      G.add(r);
    }
  }

  /* lanyard: brass grommet + paracord loop */
  const hole = hc(1.31);
  for (const sz of [1, -1]) {
    const ring = mesh(new THREE.TorusGeometry(.05, .013, 12, 32), brass);
    ring.position.set(hole.x, hole.y, sz * .125); G.add(ring);
  }
  const holeIn = mesh(new THREE.CylinderGeometry(.045, .045, .26, 24, 1, true), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: 1, side: THREE.DoubleSide }));
  holeIn.rotation.x = Math.PI / 2; holeIn.position.copy(hole); G.add(holeIn);
  const cord = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: .75, map: tex(braidCanvas('#c76a1e', '#1b1b1b')) });
  cord.map.repeat.set(40, 1);
  const lp = [];
  for (let k = 0; k < 30; k++) {
    const a = k / 30 * Math.PI * 2;
    lp.push(V(hole.x + .03 * Math.sin(2 * a), hole.y + .27 - Math.cos(a) * .27, Math.sin(a) * (.17 + .03 * (1 - Math.cos(a)))));
  }
  G.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(lp, true), 120, .02, 10, true), cord));
  const knot = mesh(new THREE.SphereGeometry(.045, 20, 14), cord);
  knot.scale.set(1, 1.3, 1); knot.position.set(hole.x, hole.y + .52, 0); G.add(knot);

  return G;
}
