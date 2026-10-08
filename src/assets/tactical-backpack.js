// 3-day tactical assault pack in coyote brown 500D cordura: full MOLLE/PALS grid on the front
// and sides, zippered admin pocket with a hook-and-loop field and PVC morale patch, two-way main
// zipper, side compression straps with buckles, drag handle, hydration port, padded airmesh
// harness with PALS webbing on the straps, sternum strap with whistle buckle, ladder-lock adjusters.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, mkCanvas, tex, addNoise, lighten, weaveCanvas, decal, hatch, rrPath, decalMat, fabric, webbing, M, SoftBox, rrLen, rrSample, rrS, surfFrames, freeFrames, sampleFrames, curve, sweepGeo, Stitches, lerpPts, boxX, conformPlane, makeZipper, makeBuckle, makeLadder, place } from '../kit.js';

function loopCanvas() {
  const s = 256, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#7a7a7a'; g.fillRect(0, 0, s, s);
  for (let k = 0; k < 9000; k++) { const x = Math.random() * s, y = Math.random() * s, v = 90 + Math.random() * 120;
    g.strokeStyle = `rgba(${v},${v},${v},.6)`; g.lineWidth = .8; g.beginPath(); g.arc(x, y, 1.5 + Math.random() * 2, 0, Math.PI * 1.4); g.stroke(); }
  return c;
}

export function build() {
  const G = new THREE.Group();
  const weave = weaveCanvas(512, 32, 0);
  const coyote = fabric(0x7a6a4e, weave, 2.6, { sheenColor: 0xd8c7a4, vary: .32 });
  const coyoteDk = fabric(0x5e5240, weave, 4, { sheenColor: 0xb8a684, vary: .38, rough: .93, bump: 2.2 });
  const web = webbing(0x6c5d44, { sheenColor: 0xd0bf9a });
  const loopC = loopCanvas();
  const loopMat = new THREE.MeshStandardMaterial({ color: 0x766750, roughness: 1, map: tex(lighten(loopC, .35), { repeat: [6, 6] }), bumpMap: tex(loopC, { repeat: [6, 6], color: false }), bumpScale: 3, polygonOffset: true, polygonOffsetFactor: -2 });
  const thread = new THREE.MeshStandardMaterial({ color: 0x4f4433, roughness: .7 });
  const st = new Stitches(thread);

  const hw = 1.45, hh = 2.3, hd = .8, r = .3, cy = 2.3;
  const body = new SoftBox({ w: 2 * hw, h: 2 * hh, d: 2 * hd, r, center: V(0, cy, 0), bx: .1, bt: .1, bz: .1, bzBack: .08, pw: 2.2, wrinkle: .014, wrinkleFreq: 1.6, seed: 31 });
  G.add(mesh(body.geometry(.042), coyote));
  const base = new SoftBox({ w: 2.96, h: .6, d: 1.66, r: .22, center: V(0, .3, 0), bx: .01, bz: .01, pw: 2, wrinkle: .004, seed: 4 });
  G.add(mesh(base.geometry(.04), coyoteDk));
  st.add(surfFrames(base, rrSample(1.48, .83, .22, 0, rrLen(1.48, .83, .22), .02, true).map(([u, v]) => V(u, .56, v)), true), { pitch: .036 });
  // binding tape on the front and back seams
  const k = r * Math.SQRT1_2;
  for (const sz of [1, -1]) {
    const hu = hw - r + k, hv = hh - r + k, z = sz * (hd - r + k);
    const pts = rrSample(hu, hv, k, 0, rrLen(hu, hv, k), .025, true).map(([u, v]) => V(u, cy + v, z)).filter(p => p.y > .5);
    G.add(mesh(sweepGeo(surfFrames(body, pts, false), { width: .07, thick: .05, offset: -.02, round: 3, vScale: 12 }), web));
  }

  /* main two-way zipper */
  {
    const z = .2, s0 = rrS.right(hw, hh, r, -1.4), s1 = rrS.left(hw, hh, r, -1.4);
    const F = surfFrames(body, rrSample(hw, hh, r, s0, s1, .012).map(([u, v]) => V(u, cy + v, z)), false);
    const top = (rrS.top(hw, hh, r, 0) - s0) / (s1 - s0) * F.len;
    G.add(makeZipper(F, { tapeMat: web, teethMat: M.teethBlack, metal: M.metalDark, cordMat: M.cordBlack, sliders: [{ s: top - .25, angle: Math.PI }, { s: top + .25, flip: true, angle: Math.PI }] }));
    st.add(F, { across: .088, pitch: .03 }); st.add(F, { across: -.088, pitch: .03 });
  }

  /* front: full-width PALS grid (rows 1" apart, bar-tacked every 1.5") */
  for (let row = 0; row < 5; row++) {
    const y = .95 + row * .38;
    const F = surfFrames(body, lerpPts(V(-1.28, y, hd), V(1.28, y, hd), 80), false, .011);
    G.add(mesh(sweepGeo(F, { width: .25, thick: .02, offset: -.01, round: 10 }), web));
    for (let c = 0; c <= 6; c++) {
      const x = -1.26 + c * .42;
      const col = surfFrames(body, lerpPts(V(x, y - .11, hd), V(x, y + .11, hd), 10), false, .022);
      st.add(col, { pitch: .016, across: -.012 }); st.add(col, { pitch: .016, across: .012 });
    }
  }

  /* admin pocket with loop field and morale patch */
  const pc = V(0, 3.62, hd + .1);
  const pocket = new SoftBox({ w: 2.3, h: 1.2, d: .34, r: .14, center: pc, bx: .02, bt: .03, bz: .08, bzBack: 0, pw: 2, wrinkle: .008, seed: 9 });
  G.add(mesh(pocket.geometry(.03), coyote));
  {
    const pz = pc.z + .02, s0 = rrS.right(1.15, .6, .14, -.4), s1 = rrS.left(1.15, .6, .14, -.4);
    const F = surfFrames(pocket, rrSample(1.15, .6, .14, s0, s1, .012).map(([u, v]) => V(u, pc.y + v, pz)), false);
    G.add(makeZipper(F, { tapeMat: web, teethMat: M.teethBlack, metal: M.metalDark, cordMat: M.cordBlack, sliders: [{ s: F.len * .3, angle: 0 }] }));
    st.add(F, { across: .088, pitch: .03 });
    G.add(mesh(conformPlane(pocket, V(0, pc.y - .04, pc.z + .17), V(1, 0, 0), V(0, 1, 0), 1.7, .72, .006, 50), loopMat));
    st.add(surfFrames(pocket, rrSample(.86, .37, .04, 0, rrLen(.86, .37, .04), .02, true).map(([u, v]) => V(u, pc.y - .04 + v, pc.z + .17)), true, .006), { pitch: .03 });
    const d = decal(1024, 640, (g, mode, W, H) => {
      rrPath(g, 6, 6, W - 12, H - 12, 70);
      g.fillStyle = mode === 'color' ? '#3d3a2e' : '#a8a8a8'; g.fill();
      rrPath(g, 34, 34, W - 68, H - 68, 50); g.lineWidth = 14; g.strokeStyle = mode === 'color' ? '#c9b98f' : '#e0e0e0'; g.stroke();
      // mountain mark and lettering, raised PVC
      g.fillStyle = mode === 'color' ? '#c9b98f' : '#e0e0e0';
      g.beginPath(); g.moveTo(140, 420); g.lineTo(270, 200); g.lineTo(330, 300); g.lineTo(390, 230); g.lineTo(520, 420); g.closePath(); g.fill();
      g.font = '800 120px "Chakra Petch", "Arial Black", sans-serif'; g.textBaseline = 'middle'; g.fillText('LORDVILLE', 140, 520);
      g.font = '700 70px "Chakra Petch", Arial, sans-serif'; g.fillText('RECON', 570, 300);
    });
    G.add(mesh(conformPlane(pocket, V(0, pc.y - .04, pc.z + .17), V(1, 0, 0), V(0, 1, 0), .95, .6, .02, 30), decalMat(d, { roughness: .55, bumpScale: 4 })));
  }

  /* top: drag handle and hydration port */
  {
    const hz = -.35, pts = [];
    for (let i = 0; i <= 120; i++) {
      const x = -.6 + 1.2 * i / 120, ax = Math.abs(x);
      const f = body.frame(V(x, cy + hh, hz));
      pts.push(f.pos.addScaledVector(f.normal, .013 + (ax < .38 ? .22 * Math.pow(Math.cos(ax / .38 * Math.PI / 2), .6) : 0)));
    }
    G.add(mesh(sweepGeo(freeFrames(pts, V(0, 0, 1), V(0, 1, 0)), { width: .3, thick: .028, offset: -.014, round: 10 }), web));
    for (const sx of [1, -1]) boxX(body, st, [V(sx * .42, 5, hz - .12), V(sx * .6, 5, hz - .12), V(sx * .6, 5, hz + .12), V(sx * .42, 5, hz + .12)], .03);
    const hood = mesh(new RoundedBoxGeometry(.5, .16, .3, 4, .07), coyote); hood.position.set(0, cy + hh + .05, -hd + .12); G.add(hood);
    const hole = mesh(new THREE.CircleGeometry(.06, 24), new THREE.MeshStandardMaterial({ color: 0x0a0a0a })); hole.position.set(0, cy + hh + .05, -hd - .031); hole.rotation.y = Math.PI; G.add(hole);
  }

  /* sides: PALS rows and compression straps */
  for (const sx of [1, -1]) {
    for (const y of [1.6, 1.98, 2.36, 2.74]) {
      const F = surfFrames(body, lerpPts(V(sx * hw, y, -.6), V(sx * hw, y, .05), 50), false, .011);
      G.add(mesh(sweepGeo(F, { width: .25, thick: .02, offset: -.01, round: 10 }), web));
      for (const z of [-.58, -.27, .03]) { const col = surfFrames(body, lerpPts(V(sx * hw, y - .11, z), V(sx * hw, y + .11, z), 10), false, .022); st.add(col, { pitch: .016, across: -.012 }); st.add(col, { pitch: .016, across: .012 }); }
    }
    for (const y of [3.4, 1.1]) {
      const lift = p => .012 + .03 * smooth(-.6, -.15, p.z) * (1 - smooth(.45, .7, p.z));
      const F = surfFrames(body, lerpPts(V(sx * hw, y, -.7), V(sx * hw, y, .7), 80), false, lift);
      G.add(mesh(sweepGeo(F, { width: .25, thick: .02, offset: -.01, round: 10 }), web));
      const f = sampleFrames(F, F.len * .5);
      G.add(place(makeBuckle(M.plastic), f.pos.clone().addScaledVector(f.normal, .03), f.tangent, f.normal));
    }
  }

  /* back: airmesh pads with spine channel */
  for (const sx of [1, -1]) {
    const pad = new SoftBox({ w: .95, h: 3.3, d: .2, r: .1, center: V(sx * .58, 2.55, -.9), bzBack: .06, bz: 0, bx: .01, bt: .01, pw: 2.4, wrinkle: .006, seed: sx * 5 });
    G.add(mesh(pad.geometry(.03), M.airmesh));
  }

  /* harness: padded straps with PALS loops, adjusters, sternum strap */
  for (const sx of [1, -1]) {
    const ctrl = [V(.42, 4.42, -.55), V(.45, 4.18, -.98), V(.5, 3.72, -1.3), V(.58, 3.05, -1.38), V(.68, 2.25, -1.36), V(.78, 1.6, -1.28), V(.86, 1.22, -1.22)].map(p => V(p.x * sx, p.y, p.z));
    const F = freeFrames(curve(ctrl, 160), V(1, 0, 0), V(0, 0, -1));
    const Wf = u => .44 + .2 * Math.sin(Math.PI * Math.min(1, u * 1.15)), Tf = u => .05 + .08 * smooth(0, .18, u) * (1 - .4 * smooth(.85, 1, u));
    G.add(mesh(sweepGeo(F, { widthFn: Wf, thickFn: Tf, width: .5, round: 4, P: 28, vScale: 2.5 }), M.airmesh));
    G.add(mesh(sweepGeo(F, { widthFn: u => Wf(u) * .9, thickFn: u => Tf(u) + .012, width: .5, round: 4, P: 28, offset: .003, vScale: 4 }), coyote));
    st.add(F, { across: u => Wf(u) * .4, lift: u => Tf(u) + .01, pitch: .034 });
    st.add(F, { across: u => -Wf(u) * .4, lift: u => Tf(u) + .01, pitch: .034 });
    for (const u of [.3, .42, .54]) {
      const a = sampleFrames(F, F.len * u), w = Wf(u) * .8, lift = Tf(u) + .025;
      const p0 = a.pos.clone().addScaledVector(a.normal, lift).addScaledVector(a.binormal, -w / 2), p1 = a.pos.clone().addScaledVector(a.normal, lift).addScaledVector(a.binormal, w / 2);
      G.add(mesh(sweepGeo(freeFrames(lerpPts(p0, p1, 10), a.tangent, a.normal), { width: .2, thick: .018, round: 10 }), web));
    }
    const wctrl = [V(.8, 1.4, -1.27), V(.95, .95, -1.18), V(1.1, .62, -1.05), V(1.2, .42, -.92), V(1.25, .32, -.82)].map(p => V(p.x * sx, p.y, p.z));
    const WF = freeFrames(curve(wctrl, 60), V(sx, -.3, 0), V(0, 0, -1));
    G.add(mesh(sweepGeo(WF, { width: .25, thick: .02, round: 10 }), web));
    const lf = sampleFrames(WF, WF.len * .55);
    G.add(place(makeLadder(M.plastic), lf.pos.clone().addScaledVector(lf.normal, .02), lf.binormal, lf.normal));
    const TF = freeFrames(curve([lf.pos.clone().addScaledVector(lf.normal, .05), V(1.06 * sx, .38, -1.16), V(1.03 * sx, .14, -1.18), V(1.02 * sx, .05, -1.15)], 30), V(1, 0, 0), V(0, 0, -1));
    G.add(mesh(sweepGeo(TF, { width: .25, thick: .018, round: 10 }), web));
  }
  {
    const y = 3.05, pts = [];
    for (let i = 0; i <= 60; i++) { const x = -.74 + 1.48 * i / 60; pts.push(V(x, y - .02 * (1 - (x / .74) ** 2), -1.53 - .015 * (1 - (x / .74) ** 2))); }
    const F = freeFrames(pts, V(0, 1, 0), V(0, 0, -1));
    G.add(mesh(sweepGeo(F, { width: .2, thick: .018, round: 10 }), web));
    const f = sampleFrames(F, F.len / 2), b = makeBuckle(M.plastic); b.scale.setScalar(.8);
    G.add(place(b, f.pos.clone().addScaledVector(f.normal, .03), f.tangent, f.normal));
  }

  G.add(st.mesh());
  return G;
}
