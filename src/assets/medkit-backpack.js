// Large trauma / medkit backpack.
import { THREE, RoundedBoxGeometry, V, clamp, smooth, hash3, noise3, fbm, basisMatrix, place, mesh, mkCanvas, tex, addNoise, lighten, weaveCanvas, webbingCanvas, airmeshCanvas, braidCanvas, gauzeMaskCanvas, crepeCanvas, fineWeaveCanvas, prismCanvas, paperCanvas, decal, hatch, rrPath, crossPath, decalMat, fabric, webbing, M, SoftBox, smoothNormals, rrPieces, rrLen, rrAt, rrSample, rrS, finishFrames, surfFrames, freeFrames, sampleFrames, curve, profile, sweepGeo, Stitches, lerpPts, boxX, conformPlane, makePull, makeZipper, makeBuckle, makeLadder } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const hw = 1.5, hh = 2.2, hd = .95, r = .35, cy = 2.2;
  const body = new SoftBox({ w: 2 * hw, h: 2 * hh, d: 2 * hd, r, center: V(0, cy, 0), bx: .11, bt: .1, bb: 0, bz: .15, bzBack: .12, pw: 2, wrinkle: .013, wrinkleFreq: 1.5, seed: 11 });
  G.add(mesh(body.geometry(.042), M.redFab));
  const base = new SoftBox({ w: 3.07, h: .72, d: 1.97, r: .24, center: V(0, .36, 0), bx: .012, bz: .012, pw: 2, wrinkle: .004, seed: 5 });
  G.add(mesh(base.geometry(.04), M.baseFab));
  const stB = new Stitches(M.threadBlack), stW = new Stitches(M.threadWhite, [.022, .006, .008]);
  // base top stitching
  {
    const pts = rrSample(1.535, .985, .24, 0, rrLen(1.535, .985, .24), .02, true).map(([u, v]) => V(u, .64, v));
    stB.add(surfFrames(base, pts, true), { lift: .003, pitch: .036 });
  }
  // piping on front/back body seams
  const k = r * Math.SQRT1_2;
  for (const sz of [1, -1]) {
    const hu = hw - r + k, hv = hh - r + k, z = sz * (hd - r + k);
    const pts = rrSample(hu, hv, k, 0, rrLen(hu, hv, k), .025, true).map(([u, v]) => V(u, cy + v, z)).filter(p => p.y > .55);
    const F = surfFrames(body, pts, false);
    G.add(mesh(sweepGeo(F, { width: .06, thick: .06, offset: -.022, round: 2, vScale: 12 }), M.webBlack));
  }

  // main compartment zipper (sides + top, two sliders meeting on top)
  {
    const z = .4, s0 = rrS.right(hw, hh, r, -1.25), s1 = rrS.left(hw, hh, r, -1.25);
    const pts = rrSample(hw, hh, r, s0, s1, .012).map(([u, v]) => V(u, cy + v, z));
    const F = surfFrames(body, pts, false);
    const top = (rrS.top(hw, hh, r, 0) - s0) / (s1 - s0) * F.len;
    G.add(makeZipper(F, { tapeMat: M.tapeBlack, teethMat: M.teethBlack, metal: M.metalDark, cordMat: M.cordBlack,
      sliders: [{ s: top - .22, angle: Math.PI }, { s: top + .22, flip: true, angle: Math.PI }] }));
    stB.add(F, { across: .088, pitch: .03 }); stB.add(F, { across: -.088, pitch: .03 });
  }

  // front pocket
  const pc = V(0, 1.68, hd + .16);
  const pocket = new SoftBox({ w: 2.4, h: 2.5, d: .62, r: .24, center: pc, bx: .03, bt: .04, bz: .14, bzBack: 0, pw: 2, wrinkle: .009, wrinkleFreq: 1.9, seed: 21 });
  G.add(mesh(pocket.geometry(.035), M.redFab));
  {
    const pk = .24 * Math.SQRT1_2, hu = 1.2 - .24 + pk, hv = 1.25 - .24 + pk;
    const pts = rrSample(hu, hv, pk, 0, rrLen(hu, hv, pk), .02, true).map(([u, v]) => V(u, pc.y + v, pc.z + (.31 - .24 + pk)));
    G.add(mesh(sweepGeo(surfFrames(pocket, pts, true), { width: .055, thick: .055, offset: -.02, round: 2, vScale: 12 }), M.webBlack));
    const z = pc.z + .03, s0 = rrS.right(1.2, 1.25, .24, -.85), s1 = rrS.left(1.2, 1.25, .24, -.85);
    const zp = rrSample(1.2, 1.25, .24, s0, s1, .012).map(([u, v]) => V(u, pc.y + v, z));
    const F = surfFrames(pocket, zp, false);
    const at = (rrS.top(1.2, 1.25, .24, .55) - s0) / (s1 - s0) * F.len;
    G.add(makeZipper(F, { tapeMat: M.tapeBlack, teethMat: M.teethBlack, metal: M.metalDark, cordMat: M.cordBlack, sliders: [{ s: at, angle: 0 }] }));
    stB.add(F, { across: .088, pitch: .03 }); stB.add(F, { across: -.088, pitch: .03 });
  }
  // patch: white square, red cross, merrowed border
  {
    const d = decal(1024, 1024, (g, mode, W) => {
      rrPath(g, 8, 8, W - 16, W - 16, 110);
      g.fillStyle = mode === 'color' ? '#2b2b2e' : '#cfcfcf'; g.fill();
      hatch(g, W, W, 0, 6, mode === 'color' ? 'rgba(255,255,255,.12)' : 'rgba(255,255,255,.5)', 'rgba(0,0,0,.35)', 2.5);
      rrPath(g, 52, 52, W - 104, W - 104, 76);
      g.fillStyle = mode === 'color' ? '#f3f2ee' : '#7a7a7a'; g.fill();
      if (mode === 'color') { g.save(); g.clip(); g.strokeStyle = 'rgba(0,0,0,.05)'; for (let x = 0; x < W; x += 5) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, W); g.stroke(); } g.restore(); }
      crossPath(g, W / 2, W / 2, W * .66, W * .23, 16);
      g.fillStyle = mode === 'color' ? '#c4161e' : '#b4b4b4'; g.fill();
      g.save(); crossPath(g, W / 2, W / 2, W * .66, W * .23, 16); g.clip();
      hatch(g, W, W, .7, 7, mode === 'color' ? 'rgba(255,120,120,.25)' : 'rgba(255,255,255,.6)', mode === 'color' ? 'rgba(60,0,0,.25)' : 'rgba(0,0,0,.35)', 3);
      g.restore();
    });
    G.add(mesh(conformPlane(pocket, V(0, pc.y + .12, pc.z + .31), V(1, 0, 0), V(0, 1, 0), 1.0, 1.0, .007), decalMat(d)));
    // velcro field outline stitching around patch
    const pts = rrSample(.56, .56, .08, 0, rrLen(.56, .56, .08), .02, true).map(([u, v]) => V(u, pc.y + .12 + v, pc.z + .31));
    stB.add(surfFrames(pocket, pts, true), { lift: .004, pitch: .034 });
  }
  // reflective band across the upper front
  {
    G.add(new THREE.Mesh(conformPlane(body, V(0, 3.4, hd), V(1, 0, 0), V(0, 1, 0), 2.62, .24, .006, 60), M.reflective));
    for (const dy of [.105, -.105]) stB.add(surfFrames(body, lerpPts(V(-1.3, 3.4 + dy, hd), V(1.3, 3.4 + dy, hd), 60), false, .008), { pitch: .032 });
  }

  // top grab handle with padded grip
  {
    const hz = -.25, pts = [];
    for (let i = 0; i <= 140; i++) {
      const x = -.66 + 1.32 * i / 140, ax = Math.abs(x);
      const f = body.frame(V(x, cy + hh, hz));
      const arch = ax < .44 ? .26 * Math.pow(Math.cos(ax / .44 * Math.PI / 2), .55) : 0;
      pts.push(f.pos.addScaledVector(f.normal, .013 + arch));
    }
    const F = freeFrames(pts, V(0, 0, 1), V(0, 1, 0));
    const bump = u => smooth(.27, .36, u) * (1 - smooth(.64, .73, u));
    G.add(mesh(sweepGeo(F, { width: .27, thick: .024, offset: -.012, round: 10 }), M.webBlack));
    G.add(mesh(sweepGeo(F, { widthFn: u => .2 + .14 * bump(u), thickFn: u => .02 + .07 * bump(u), offset: -.01, round: 3, width: .3 }), M.blackFab));
    for (const sx of [1, -1]) {
      const x0 = sx * .47, x1 = sx * .65;
      boxX(body, stW, [V(x0, 5, hz - .11), V(x1, 5, hz - .11), V(x1, 5, hz + .11), V(x0, 5, hz + .11)], .028);
    }
  }

  // sides: MOLLE rows + compression straps with side-release buckles
  for (const sx of [1, -1]) {
    for (const y of [1.78, 2.2, 2.62]) {
      const F = surfFrames(body, lerpPts(V(sx * hw, y, -.72), V(sx * hw, y, .24), 60), false, .01);
      G.add(mesh(sweepGeo(F, { width: .23, thick: .018, offset: -.009, round: 10 }), M.webBlack));
      for (const z of [-.69, -.37, -.05, .21]) {
        const col = surfFrames(body, lerpPts(V(sx * hw, y - .1, z), V(sx * hw, y + .1, z), 10), false, .02);
        stB.add(col, { pitch: .018, across: -.012 }); stB.add(col, { pitch: .018, across: .012 });
      }
    }
    for (const y of [3.15, 1.25]) {
      const lift = p => .012 + .03 * smooth(-.7, -.2, p.z) * (1 - smooth(.55, .8, p.z));
      const F = surfFrames(body, lerpPts(V(sx * hw, y, -.82), V(sx * hw, y, .82), 80), false, lift);
      G.add(mesh(sweepGeo(F, { width: .25, thick: .02, offset: -.01, round: 10 }), M.webBlack));
      const f = sampleFrames(F, F.len * .45);
      const b = makeBuckle(M.plastic);
      G.add(place(b, f.pos.clone().addScaledVector(f.normal, .03), f.tangent, f.normal));
      for (const s of [.04, F.len - .1]) { const a = sampleFrames(F, s); stB.add(surfFrames(body, lerpPts(a.pos.clone().addScaledVector(a.binormal, -.1), a.pos.clone().addScaledVector(a.binormal, .1), 10), false, .022), { pitch: .016 }); }
    }
  }

  // back: airmesh pads
  for (const sx of [1, -1]) for (const y of [3.22, 1.78]) {
    const pad = new SoftBox({ w: 1.05, h: 1.28, d: .22, r: .1, center: V(sx * .6, y, -1.07), bzBack: .07, bz: 0, bx: .01, bt: .01, pw: 2, wrinkle: .006, seed: sx * 7 + y });
    G.add(mesh(pad.geometry(.03), M.airmesh));
    const pts = rrSample(.47, .58, .07, 0, rrLen(.47, .58, .07), .02, true).map(([u, v]) => V(sx * .6 - u, y + v, -1.4));
    stB.add(surfFrames(pad, pts, true), { lift: .003, pitch: .034 });
  }

  // padded shoulder straps + adjustment webbing + ladder locks
  const strapAt = [];
  for (const sx of [1, -1]) {
    const ctrl = [V(.42, 4.3, -.68), V(.45, 4.06, -1.12), V(.5, 3.62, -1.47), V(.58, 2.95, -1.55), V(.68, 2.15, -1.53), V(.78, 1.5, -1.45), V(.86, 1.12, -1.38)]
      .map(p => V(p.x * sx, p.y, p.z));
    const pts = curve(ctrl, 160);
    const F = freeFrames(pts, V(1, 0, 0), V(0, 0, -1));
    const Wf = u => .44 + .2 * Math.sin(Math.PI * Math.min(1, u * 1.15)), Tf = u => .05 + .08 * smooth(0, .18, u) * (1 - .4 * smooth(.85, 1, u));
    G.add(mesh(sweepGeo(F, { widthFn: Wf, thickFn: Tf, width: .5, round: 4, P: 28, vScale: 2.5 }), M.airmesh));
    // outer nylon shell
    G.add(mesh(sweepGeo(F, { widthFn: u => Wf(u) * .9, thickFn: u => Tf(u) + .012, width: .5, round: 4, P: 28, offset: .003, vScale: 4 }), M.blackFab));
    stB.add(F, { across: u => Wf(u) * .42, lift: u => Tf(u) * 1.0 + .01, pitch: .034 });
    stB.add(F, { across: u => -Wf(u) * .42, lift: u => Tf(u) * 1.0 + .01, pitch: .034 });
    strapAt.push(F);
    // webbing down to the base, through a ladder lock, with a hanging tail
    const wctrl = [V(.8, 1.3, -1.43), V(.95, .86, -1.33), V(1.1, .56, -1.2), V(1.2, .38, -1.06), V(1.26, .3, -.96)].map(p => V(p.x * sx, p.y, p.z));
    const WF = freeFrames(curve(wctrl, 60), V(1, -.3, 0).multiply(V(sx, 1, 1)), V(0, 0, -1));
    G.add(mesh(sweepGeo(WF, { width: .25, thick: .02, round: 10 }), M.webBlack));
    const lf = sampleFrames(WF, WF.len * .55);
    G.add(place(makeLadder(M.plastic), lf.pos.clone().addScaledVector(lf.normal, .02), lf.binormal, lf.normal));
    const tctrl = [lf.pos.clone().addScaledVector(lf.normal, .05), V(1.06 * sx, .34, -1.3), V(1.03 * sx, .12, -1.33), V(1.02 * sx, .04, -1.3)];
    const TF = freeFrames(curve(tctrl, 30), V(1, 0, 0), V(0, 0, -1));
    G.add(mesh(sweepGeo(TF, { width: .25, thick: .018, round: 10 }), M.webBlack));
  }
  // sternum strap
  {
    const y = 2.95, pts = [];
    for (let i = 0; i <= 60; i++) { const x = -.72 + 1.44 * i / 60; pts.push(V(x, y - .02 * (1 - Math.pow(x / .72, 2)), -1.69 - .015 * (1 - Math.pow(x / .72, 2)))); }
    const F = freeFrames(pts, V(0, 1, 0), V(0, 0, -1));
    G.add(mesh(sweepGeo(F, { width: .2, thick: .018, round: 10 }), M.webBlack));
    const f = sampleFrames(F, F.len / 2);
    const b = makeBuckle(M.plastic); b.scale.setScalar(.8);
    G.add(place(b, f.pos.clone().addScaledVector(f.normal, .03), f.tangent, f.normal));
  }
  // hang loop
  {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const t = i / 40, x = -.16 + .32 * t; const f = body.frame(V(x, 4.4, -.78)); pts.push(f.pos.addScaledVector(f.normal, .012 + .14 * Math.pow(Math.sin(Math.PI * t), .7))); }
    G.add(mesh(sweepGeo(freeFrames(pts, V(0, 0, 1), V(0, 1, -.4)), { width: .2, thick: .02, round: 10 }), M.webBlack));
  }

  G.add(stB.mesh(), stW.mesh());
  return G;
}
