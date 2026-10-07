// White first-aid pouch.
import { THREE, RoundedBoxGeometry, V, clamp, smooth, hash3, noise3, fbm, basisMatrix, place, mesh, mkCanvas, tex, addNoise, lighten, weaveCanvas, webbingCanvas, airmeshCanvas, braidCanvas, gauzeMaskCanvas, crepeCanvas, fineWeaveCanvas, prismCanvas, paperCanvas, decal, hatch, rrPath, crossPath, decalMat, fabric, webbing, M, SoftBox, smoothNormals, rrPieces, rrLen, rrAt, rrSample, rrS, finishFrames, surfFrames, freeFrames, sampleFrames, curve, profile, sweepGeo, Stitches, lerpPts, boxX, conformPlane, makePull, makeZipper, makeBuckle, makeLadder } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const hw = 1.3, hh = .55, hd = .85, r = .22, cy = .55;
  const body = new SoftBox({ w: 2 * hw, h: 2 * hh, d: 2 * hd, r, center: V(0, cy, 0), bx: .045, bt: .085, bb: 0, bz: .06, pw: 2.2, wrinkle: .007, wrinkleFreq: 2.3, seed: 3 });
  G.add(mesh(body.geometry(.032), M.whiteFab));
  const stW = new Stitches(M.threadWhite), stR = new Stitches(M.threadRed);

  // bias-bound piping at top and bottom seams
  const k = r * Math.SQRT1_2;
  for (const sy of [1, -1]) {
    const y = cy + sy * (hh - r + k), hu = hw - r + k, hv = hd - r + k;
    const pts = rrSample(hu, hv, k, 0, rrLen(hu, hv, k), .02, true).map(([u, v]) => V(u, y, v));
    const F = surfFrames(body, pts, true);
    G.add(mesh(sweepGeo(F, { width: .055, thick: .055, offset: -.02, round: 2, vScale: 14 }), M.pipingRed));
    stW.add(F, { lift: .05, pitch: .04, across: 0, ...{} }); // binding stitch on top of piping
  }

  // two-way zipper around 3 sides of the lid
  {
    const y = cy + .19, s0 = rrS.right(hw, hd, r, -.48), s1 = rrS.left(hw, hd, r, -.48);
    const pts = rrSample(hw, hd, r, s0, s1, .012).map(([u, v]) => V(u, y, v));
    const F = surfFrames(body, pts, false);
    const front = (rrS.top(hw, hd, r, 0) - s0) / (s1 - s0) * F.len;
    G.add(makeZipper(F, { tapeMat: M.tapeRed, teethMat: M.teethRed, metal: M.metalSilver, cordMat: M.cordRed,
      sliders: [{ s: front - .98 }, { s: front + .98, flip: true }] }));
    // tape stitching
    stR.add(F, { across: .088, lift: .004, pitch: .03 });
    stR.add(F, { across: -.088, lift: .004, pitch: .03 });
  }

  // top-panel topstitching
  {
    const pts = rrSample(1.1, .66, .1, 0, rrLen(1.1, .66, .1), .02, true).map(([u, v]) => V(u, cy + hh, v));
    stW.add(surfFrames(body, pts, true), { pitch: .036, lift: .003 });
  }

  // carry handle (webbing loop with box-X stitched tabs)
  {
    const hz = -.42, pts = [];
    for (let i = 0; i <= 120; i++) {
      const x = -.64 + 1.28 * i / 120, ax = Math.abs(x);
      const f = body.frame(V(x, cy + hh, hz));
      const arch = ax < .4 ? .3 * Math.pow(Math.cos(ax / .4 * Math.PI / 2), .6) : 0;
      pts.push(f.pos.addScaledVector(f.normal, .013 + arch));
    }
    const F = freeFrames(pts, V(0, 0, 1), V(0, 1, 0));
    G.add(mesh(sweepGeo(F, { width: .28, thick: .022, offset: -.011, round: 10 }), M.webRed));
    stR.add(F, { across: .12, lift: .012, pitch: .03 }); stR.add(F, { across: -.12, lift: .012, pitch: .03 });
    for (const sx of [1, -1]) {
      const x0 = sx * .43, x1 = sx * .61;
      boxX(body, stR, [V(x0, 1, hz - .11), V(x1, 1, hz - .11), V(x1, 1, hz + .11), V(x0, 1, hz + .11)], .027);
    }
  }

  // embroidered red cross on the lid
  {
    const d = decal(1024, 1024, (g, mode, W) => {
      crossPath(g, W / 2, W / 2, W * .9, W * .32, 26);
      g.fillStyle = mode === 'color' ? '#c4161e' : '#9a9a9a'; g.fill();
      hatch(g, W, W, .7, 7, mode === 'color' ? 'rgba(255,120,120,.28)' : 'rgba(255,255,255,.55)', mode === 'color' ? 'rgba(80,0,0,.25)' : 'rgba(0,0,0,.4)', 3);
      crossPath(g, W / 2, W / 2, W * .9 - 20, W * .32 - 20, 20);
      g.lineWidth = 16; g.strokeStyle = mode === 'color' ? '#8d0d13' : '#d8d8d8'; g.stroke();
    });
    G.add(mesh(conformPlane(body, V(0, cy + hh, .22), V(1, 0, 0), V(0, 0, -1), .64, .64, .004), decalMat(d)));
  }

  // "FIRST AID" embroidery on the front
  {
    const d = decal(2048, 440, (g, mode, W, H) => {
      const col = mode === 'color' ? '#c4161e' : '#a0a0a0';
      crossPath(g, 210, H / 2, 300, 104, 12); g.fillStyle = col; g.fill();
      g.font = '900 250px "Arial Black", "Helvetica Neue", Arial, sans-serif';
      g.textBaseline = 'middle'; g.fillText('FIRST AID', 410, H / 2 + 12);
      hatch(g, W, H, 1.1, 6, mode === 'color' ? 'rgba(255,140,140,.25)' : 'rgba(255,255,255,.5)', mode === 'color' ? 'rgba(60,0,0,.22)' : 'rgba(0,0,0,.4)', 2.5);
    });
    G.add(mesh(conformPlane(body, V(0, cy - .12, hd), V(1, 0, 0), V(0, 1, 0), 1.6, .344, .004), decalMat(d)));
  }

  // D-rings on both ends
  for (const sx of [1, -1]) {
    const pts = lerpPts(V(sx * hw, cy + .07, 0), V(sx * hw, cy - .22, 0), 20);
    const F = surfFrames(body, pts, false, .011);
    G.add(mesh(sweepGeo(F, { width: .22, thick: .02, offset: -.01, round: 10 }), M.webRed));
    boxX(body, stR, [V(sx * hw, cy + .04, -.09), V(sx * hw, cy + .04, .09), V(sx * hw, cy - .12, .09), V(sx * hw, cy - .12, -.09)], .023);
    const f = body.frame(V(sx * hw, cy - .24, 0));
    const ring = new THREE.Group();
    const arc = mesh(new THREE.TorusGeometry(.11, .014, 10, 32, Math.PI), M.metalSilver); arc.rotation.z = Math.PI; ring.add(arc);
    const bar = mesh(new THREE.CylinderGeometry(.014, .014, .22, 10), M.metalSilver); bar.rotation.z = Math.PI / 2; ring.add(bar);
    const holder = new THREE.Group(); holder.add(ring); ring.rotation.x = -.35;
    place(holder, f.pos.clone().addScaledVector(f.normal, .03), V(0, 0, -sx), V(0, 1, 0));
    G.add(holder);
  }

  // clear ID window with card on the back
  {
    const O = V(0, cy - .04, -hd), U = V(-1, 0, 0), Vv = V(0, 1, 0);
    const card = decal(1024, 560, (g, mode, W, H) => {
      if (mode === 'bump') { g.fillStyle = '#777'; g.fillRect(0, 0, W, H); return; }
      g.fillStyle = '#fbfbf7'; g.fillRect(0, 0, W, H);
      g.fillStyle = '#c4161e'; g.fillRect(0, 0, W, 110);
      g.fillStyle = '#fff'; g.font = '800 64px Arial, sans-serif'; g.textBaseline = 'middle'; g.fillText('FIRST AID KIT', 40, 58);
      crossPath(g, W - 90, 55, 70, 24, 4); g.fill();
      g.fillStyle = '#222'; g.font = '600 38px Arial, sans-serif';
      ['Location', 'Checked by', 'Next check'].forEach((t, i) => {
        const y = 200 + i * 110; g.fillText(t + ':', 40, y);
        g.fillRect(300, y + 26, W - 340, 3);
      });
      g.fillStyle = '#1f3a8a'; g.font = 'italic 48px "Segoe Script", "Bradley Hand", "Comic Sans MS", cursive';
      g.fillText('Vehicle 2 — rear', 320, 196); g.fillText('A. Rahman', 320, 306); g.fillText('03 / 2027', 320, 416);
    });
    G.add(mesh(conformPlane(body, O, U, Vv, .92, .5, .004), new THREE.MeshStandardMaterial({ map: card.map, roughness: .6,
      polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 })));
    G.add(new THREE.Mesh(conformPlane(body, O, U, Vv, 1.04, .62, .013), M.clearPVC));
    const pts = rrSample(.52, .31, .03, 0, rrLen(.52, .31, .03), .015, true).map(([u, v]) => O.clone().addScaledVector(U, u).addScaledVector(Vv, v));
    const F = surfFrames(body, pts, true, .012);
    G.add(mesh(sweepGeo(F, { width: .07, thick: .014, offset: -.007, round: 6 }), M.webRed));
    stR.add(F, { lift: .012, pitch: .03 });
  }

  G.add(stW.mesh(), stR.mesh());
  return G;
}
