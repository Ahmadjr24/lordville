// Bandage set: gauze roll, crepe bandage, cloth tape, gauze pad pouch, plasters.
import { THREE, RoundedBoxGeometry, V, clamp, smooth, hash3, noise3, fbm, basisMatrix, place, mesh, mkCanvas, tex, addNoise, lighten, weaveCanvas, webbingCanvas, airmeshCanvas, braidCanvas, gauzeMaskCanvas, crepeCanvas, fineWeaveCanvas, prismCanvas, paperCanvas, decal, hatch, rrPath, crossPath, decalMat, fabric, webbing, M, SoftBox, smoothNormals, rrPieces, rrLen, rrAt, rrSample, rrS, finishFrames, surfFrames, freeFrames, sampleFrames, curve, profile, sweepGeo, Stitches, lerpPts, boxX, conformPlane, makePull, makeZipper, makeBuckle, makeLadder } from '../kit.js';

function rollMesh({ rIn, rOut, gap, width, tail, mat, capColor, lineColor, seg = 72, wave = .012, alpha = false }) {
  const G = new THREE.Group(), cy = rOut + .002;
  const P = [], turns = (rOut - rIn) / gap, tot = turns * 2 * Math.PI, nS = Math.ceil(turns * seg);
  for (let i = 0; i <= nS; i++) {
    const th = tot * i / nS, r = rIn + gap * th / (2 * Math.PI), ph = -Math.PI / 2 - tot + th;
    P.push([r * Math.cos(ph), cy + r * Math.sin(ph), 0]);
  }
  const nT = Math.ceil(tail / .01);
  for (let k = 1; k <= nT; k++) {
    const z = k * tail / nT;
    P.push([z, .002 + wave * Math.pow(Math.sin(z * 6.5), 2) * smooth(0, .25, z) + .045 * Math.pow(z / tail, 5), 1]);
  }
  const nx = 8, pos = [], uv = [], idx = [];
  let s = 0;
  for (let i = 0; i < P.length; i++) {
    if (i) s += Math.hypot(P[i][0] - P[i - 1][0], P[i][1] - P[i - 1][1]);
    for (let j = 0; j <= nx; j++) {
      const x = -width / 2 + width * j / nx, sag = P[i][2] ? .005 * (1 - Math.pow(2 * x / width, 2)) * smooth(0, .3, P[i][0]) : 0;
      pos.push(x, P[i][1] + sag, P[i][0]); uv.push(x, s);
    }
  }
  for (let i = 0; i < P.length - 1; i++) for (let j = 0; j < nx; j++) {
    const a = i * (nx + 1) + j, b = a + nx + 1;
    idx.push(a, b, a + 1, b, b + 1, a + 1);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx); g.computeVertexNormals();
  G.add(mesh(g, mat));
  // end faces: the visible spiral of layers
  const S = 1024, c = mkCanvas(S), cg = c.getContext('2d'), R = S / 2;
  cg.fillStyle = capColor; cg.beginPath(); cg.arc(R, R, R, 0, Math.PI * 2); cg.arc(R, R, R * rIn / rOut, 0, Math.PI * 2, true); cg.fill();
  cg.strokeStyle = lineColor; cg.lineWidth = 1.6;
  cg.beginPath();
  for (let th = 0; th <= tot; th += .02) {
    const r = (rIn + gap * th / (2 * Math.PI)) / rOut * R, ph = -th;
    cg.lineTo(R + r * Math.cos(ph), R + r * Math.sin(ph));
  }
  cg.stroke();
  addNoise(cg, S, S, 18);
  const capMat = new THREE.MeshStandardMaterial({ map: tex(c, { clampEdge: true }), roughness: .95, alphaTest: .5, side: THREE.DoubleSide });
  for (const sx of [1, -1]) {
    const ring = mesh(new THREE.RingGeometry(rIn, rOut, 160, 1), capMat);
    ring.rotation.y = sx * Math.PI / 2; ring.position.set(sx * width / 2, cy, 0);
    G.add(ring);
  }
  G.userData = { cy, rOut };
  return G;
}
function bendOnRoll(geo, R, cy, th0) {
  const p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const s = p.getX(i), t = p.getY(i), h = p.getZ(i), th = th0 + s / R, rr = R + h;
    p.setXYZ(i, t, cy + rr * Math.cos(th), rr * Math.sin(th));
  }
  geo.computeVertexNormals();
  return geo;
}
function plasterGeo(L, W, thick) {
  const s = new THREE.Shape(), r = W / 2 * .92, x = -L / 2, y = -W / 2;
  s.moveTo(x + r, y); s.lineTo(x + L - r, y); s.quadraticCurveTo(x + L, y, x + L, y + r); s.lineTo(x + L, y + W - r);
  s.quadraticCurveTo(x + L, y + W, x + L - r, y + W); s.lineTo(x + r, y + W); s.quadraticCurveTo(x, y + W, x, y + W - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: thick, bevelEnabled: true, bevelThickness: .0015, bevelSize: .002, bevelSegments: 2, curveSegments: 16 });
  const p = g.attributes.position, uv = g.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, (p.getX(i) + L / 2) / L, (p.getY(i) + W / 2) / W);
  g.rotateX(-Math.PI / 2);
  return g;
}
export function build() {
  const G = new THREE.Group();

  // 1) conforming cotton gauze roll, partly unrolled
  {
    const mask = gauzeMaskCanvas();
    const mat = new THREE.MeshStandardMaterial({ color: 0xf5f3ec, roughness: .96, alphaMap: tex(mask, { repeat: [12.5, 12.5], color: false }),
      map: tex(lighten(fineWeaveCanvas(), .15), { repeat: [12.5, 12.5] }), alphaTest: .45, side: THREE.DoubleSide });
    const roll = rollMesh({ rIn: .05, rOut: .42, gap: .0085, width: 1.0, tail: 1.45, mat, capColor: '#efece3', lineColor: 'rgba(150,140,120,.55)' });
    roll.position.set(-.8, 0, -.75); roll.rotation.y = .28;
    G.add(roll);
  }

  // 2) elastic crepe bandage with butterfly clips
  {
    const cc = crepeCanvas();
    const mat = new THREE.MeshPhysicalMaterial({ color: 0xdcb48e, roughness: .92, map: tex(lighten(cc, .35), { repeat: [8, 8] }),
      bumpMap: tex(cc, { repeat: [8, 8], color: false }), bumpScale: 2.5, sheen: .6, sheenColor: new THREE.Color(0xffe2c4), side: THREE.DoubleSide });
    const rIn = .06, rOut = .33, gap = .011;
    const roll = rollMesh({ rIn, rOut, gap, width: .75, tail: .55, mat, capColor: '#d6ae86', lineColor: 'rgba(120,80,40,.55)', wave: .006 });
    const { cy } = roll.userData, R = rOut + .006;
    // elastic band
    const band = new THREE.BoxGeometry(.24, .1, .008, 24, 1, 1);
    roll.add(mesh(bendOnRoll(band, R, cy, .55), webbing(0xd9c7aa, { sheenColor: 0xffffff })));
    // toothed metal plates
    const clipMat = M.metalSilver.clone(); clipMat.side = THREE.DoubleSide;
    for (const sg of [1, -1]) {
      const s = new THREE.Shape(), x0 = .1, x1 = .2;
      s.moveTo(sg * x0, -.07);
      const teeth = 7;
      for (let k = 0; k <= teeth; k++) { const t = -.07 + .14 * k / teeth; s.lineTo(sg * x1, t); if (k < teeth) s.lineTo(sg * (x1 + .03), t + .07 / teeth); }
      s.lineTo(sg * x0, .07); s.lineTo(sg * x0, -.07);
      const ph = new THREE.Path(); ph.moveTo(sg * .115, -.035); ph.lineTo(sg * .14, -.035); ph.lineTo(sg * .14, .035); ph.lineTo(sg * .115, .035); ph.closePath();
      s.holes.push(ph);
      const g = new THREE.ExtrudeGeometry(s, { depth: .006, bevelEnabled: true, bevelThickness: .001, bevelSize: .0015, bevelSegments: 1, steps: 1 });
      roll.add(mesh(bendOnRoll(g, R + .004, cy, .55), clipMat));
    }
    roll.position.set(1.0, 0, -.85); roll.rotation.y = -.42;
    G.add(roll);
  }

  // 3) cloth surgical tape on a plastic core
  {
    const T = new THREE.Group();
    const fw = fineWeaveCanvas();
    const tapeMat = new THREE.MeshStandardMaterial({ color: 0xf6f4ef, roughness: .85, map: tex(lighten(fw, .25), { repeat: [24, 3] }),
      bumpMap: tex(fw, { repeat: [24, 3], color: false }), bumpScale: 1.5, side: THREE.DoubleSide });
    const outer = mesh(new THREE.CylinderGeometry(.3, .3, .25, 120, 1, true), tapeMat); outer.position.y = .125; T.add(outer);
    const sc = mkCanvas(512), sg = sc.getContext('2d');
    sg.fillStyle = '#f1eee6'; sg.fillRect(0, 0, 512, 512);
    for (let r = 160; r < 256; r += 2.2) { sg.strokeStyle = `rgba(150,140,120,${.15 + Math.random() * .2})`; sg.lineWidth = 1; sg.beginPath(); sg.arc(256, 256, r, 0, Math.PI * 2); sg.stroke(); }
    const sideMat = new THREE.MeshStandardMaterial({ map: tex(sc, { clampEdge: true }), roughness: .7, side: THREE.DoubleSide });
    for (const [y, rx] of [[.25, -Math.PI / 2], [0, Math.PI / 2]]) { const m = mesh(new THREE.RingGeometry(.19, .3, 120), sideMat); m.rotation.x = rx; m.position.y = y; T.add(m); }
    const core = new THREE.MeshPhysicalMaterial({ color: 0xeef1f4, roughness: .25, clearcoat: .6, side: THREE.DoubleSide });
    const c1 = mesh(new THREE.CylinderGeometry(.19, .19, .26, 96, 1, true), core); c1.position.y = .125; T.add(c1);
    const c2 = mesh(new THREE.CylinderGeometry(.168, .168, .26, 96, 1, true), core); c2.position.y = .125; T.add(c2);
    for (const y of [.255, -.005]) { const m = mesh(new THREE.RingGeometry(.168, .19, 96), core); m.rotation.x = -Math.PI / 2; m.position.y = y; T.add(m); }
    for (let k = 0; k < 12; k++) { const a = k / 12 * Math.PI * 2, rib = mesh(new THREE.BoxGeometry(.012, .26, .02), core); rib.position.set(Math.cos(a) * .162, .125, Math.sin(a) * .162); rib.rotation.y = -a; T.add(rib); }
    // peeled tail
    const tp = [];
    for (let i = 0; i <= 30; i++) { const a = -.2 + i / 30 * .9; tp.push(V(Math.cos(a) * .303, .125, Math.sin(a) * .303)); }
    const end = tp[tp.length - 1], dir = V(-Math.sin(.7), 0, Math.cos(.7));
    for (let i = 1; i <= 12; i++) tp.push(end.clone().addScaledVector(dir, i * .012).add(V(Math.cos(.7) * .0015 * i * i * .1, 0, Math.sin(.7) * .0015 * i * i * .1)));
    const F = freeFrames(tp, V(0, 1, 0), (i, p) => V(p.x, 0, p.z));
    T.add(mesh(sweepGeo(F, { width: .25, thick: .004, round: 12 }), tapeMat));
    T.position.set(1.35, 0, .45);
    G.add(T);
  }

  // 4) sterile gauze pad pouch
  {
    const surf = new SoftBox({ w: 1.1, h: .05, d: 1.1, r: .024, center: V(0, .025, 0), bt: .035, pw: 2, wrinkle: .002, wrinkleFreq: 6 });
    const P = new THREE.Group();
    P.add(mesh(surf.geometry(.02), M.paper));
    const d = decal(1024, 1024, (g, mode, W, H) => {
      if (mode === 'bump') { g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); g.strokeStyle = '#d0d0d0'; g.lineWidth = 3;
        for (let k = -H; k < W; k += 12) { for (const [a, b] of [[0, 60], [W - 60, W]]) { g.beginPath(); g.moveTo(a, k + a); g.lineTo(b, k + b); g.stroke(); } g.beginPath(); g.moveTo(k, 0); g.lineTo(k + 60, 60); g.stroke(); g.beginPath(); g.moveTo(k, H - 60); g.lineTo(k + 60, H); g.stroke(); }
        return; }
      g.fillStyle = '#fbfbf8'; g.fillRect(0, 0, W, H);
      g.strokeStyle = 'rgba(160,170,180,.5)'; g.lineWidth = 2;
      for (let k = -H; k < W + H; k += 12) { g.beginPath(); g.moveTo(k, 0); g.lineTo(k - H, H); g.stroke(); }
      g.fillStyle = '#fbfbf8'; g.fillRect(70, 70, W - 140, H - 140);
      g.fillStyle = '#1b4f9c'; g.fillRect(70, 70, W - 140, 170);
      g.fillStyle = '#fff'; g.font = '800 92px Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('STERILE', 110, 158);
      g.strokeStyle = '#fff'; g.lineWidth = 6; g.strokeRect(W - 330, 108, 220, 96); g.font = '700 54px Arial'; g.fillText('R', W - 160, 158);
      g.font = '600 40px Arial'; g.fillText('STERILE', W - 318, 158);
      g.fillStyle = '#132b55'; g.font = '800 104px Arial, sans-serif'; g.fillText('GAUZE PAD', 110, 330);
      g.fillStyle = '#333'; g.font = '500 48px Arial, sans-serif';
      g.fillText('10 cm × 10 cm  ·  12-ply', 110, 420);
      g.fillText('100% cotton  ·  non-adherent', 110, 485);
      g.fillStyle = '#c4161e'; g.fillRect(110, 545, W - 220, 6);
      g.fillStyle = '#555'; g.font = '500 36px Arial';
      g.fillText('Do not use if package is damaged.', 110, 610); g.fillText('Single use only.  Store dry.', 110, 660);
      g.font = '700 38px "Courier New", monospace'; g.fillStyle = '#222';
      g.fillText('LOT  2610-04B', 110, 760); g.fillText('EXP  2029-09', 110, 815);
      g.strokeStyle = '#222'; g.lineWidth = 5; g.beginPath(); g.arc(W - 200, 790, 60, 0, Math.PI * 2); g.stroke();
      g.font = '800 70px Arial'; g.fillText('2', W - 221, 792); g.beginPath(); g.moveTo(W - 243, 833); g.lineTo(W - 157, 747); g.stroke();
      g.fillStyle = '#c4161e'; g.font = '800 40px Arial'; g.fillText('▲ PEEL HERE', W / 2 - 130, 900);
      addNoise(g, W, H, 8);
    });
    P.add(mesh(conformPlane(surf, V(0, .05, 0), V(1, 0, 0), V(0, 0, -1), 1.098, 1.098, .0015, 50), decalMat(d, { bumpScale: 1.2, roughness: .55 })));
    P.position.set(.3, 0, 1.25); P.rotation.y = .18;
    G.add(P);
  }

  // 5) adhesive plasters (two open, one wrapped)
  {
    const L = .72, W = .19;
    const pc = mkCanvas(1024, 272), pg = pc.getContext('2d');
    pg.fillStyle = '#d7a37b'; pg.fillRect(0, 0, 1024, 272);
    pg.fillStyle = 'rgba(120,70,40,.45)';
    for (let y = 18; y < 272; y += 22) for (let x = 14 + (y % 44 ? 11 : 0); x < 1024; x += 22) { pg.beginPath(); pg.arc(x, y, 3.2, 0, Math.PI * 2); pg.fill(); }
    addNoise(pg, 1024, 272, 14);
    const pm = new THREE.MeshStandardMaterial({ map: tex(pc, { clampEdge: true }), roughness: .55 });
    const qc = mkCanvas(256), qg = qc.getContext('2d');
    qg.fillStyle = '#f6f3ee'; qg.fillRect(0, 0, 256, 256);
    qg.fillStyle = 'rgba(0,0,0,.14)'; for (let y = 4; y < 256; y += 16) for (let x = 4 + (y % 32 ? 8 : 0); x < 256; x += 16) { qg.beginPath(); qg.arc(x, y, 3, 0, Math.PI * 2); qg.fill(); }
    const padMat = new THREE.MeshPhysicalMaterial({ map: tex(qc), bumpMap: tex(qc, { color: false }), bumpScale: 2, roughness: .4, clearcoat: .3 });
    for (const [x, z, a] of [[-1.15, 1.75, .35], [-.5, 2.25, -.25]]) {
      const pl = new THREE.Group();
      pl.add(mesh(plasterGeo(L, W, .006), pm));
      const pad = mesh(plasterGeo(.25, .13, .012), padMat); pad.position.y = .006; pl.add(pad);
      pl.position.set(x, .002, z); pl.rotation.y = a;
      G.add(pl);
    }
    const surf = new SoftBox({ w: .86, h: .024, d: .3, r: .011, center: V(0, .012, 0), bt: .014, pw: 2, wrinkle: .0015, wrinkleFreq: 9 });
    const wr = new THREE.Group();
    wr.add(mesh(surf.geometry(.012), M.paper));
    const d = decal(1024, 358, (g, mode, W, H) => {
      if (mode === 'bump') { g.fillStyle = '#808080'; g.fillRect(0, 0, W, H); g.fillStyle = '#d0d0d0'; for (const x0 of [0, W - 90]) for (let x = x0; x < x0 + 90; x += 12) g.fillRect(x, 0, 5, H); return; }
      g.fillStyle = '#fbfbf9'; g.fillRect(0, 0, W, H);
      g.fillStyle = 'rgba(160,165,175,.6)'; for (const x0 of [0, W - 90]) for (let x = x0; x < x0 + 90; x += 12) g.fillRect(x, 0, 5, H);
      g.fillStyle = '#c4161e'; g.fillRect(90, 24, W - 180, 14); g.fillRect(90, H - 38, W - 180, 14);
      g.fillStyle = '#132b55'; g.font = '800 62px Arial'; g.textBaseline = 'middle'; g.fillText('ADHESIVE BANDAGE', 130, 130);
      g.fillStyle = '#444'; g.font = '500 36px Arial'; g.fillText('STERILE  ·  72 × 19 mm  ·  latex free', 130, 205);
      g.fillStyle = '#c4161e'; g.font = '800 34px Arial'; g.fillText('◀ PULL', 130, 270); g.fillText('PULL ▶', W - 260, 270);
    });
    wr.add(mesh(conformPlane(surf, V(0, .024, 0), V(1, 0, 0), V(0, 0, -1), .858, .298, .001, 40), decalMat(d, { bumpScale: 1, roughness: .5 })));
    wr.position.set(1.25, 0, 1.55); wr.rotation.y = -.5;
    G.add(wr);
  }
  return G;
}
