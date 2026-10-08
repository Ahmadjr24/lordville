// Springfield Hellion-style 5.56 mm bullpup (display prop), built from outlines traced off a side
// photograph of the VHS-2 it is based on (hellion-profiles.js), scaled to 718 mm with a 16 in
// barrel. Polymer chassis with faceted adjustable buttstock, cheek riser and hooked rubber pad;
// top carry rail with folded iron sights and a long side window, forward charging handle,
// ambidextrous selector, switchable ejection-port covers, M-LOK handguard slots, lower accessory
// rail, PMAG-style magazine, pronged flash hider, and a 1–8×24 LPVO in a one-piece cantilever
// mount. x toward the muzzle, y up, z = the rifle's right side.
import { THREE, RoundedBoxGeometry, mesh, latheAxis, shapeFrom, extrude, label, stippleCanvas, knurlCanvas, tex, HM, GM, picatinny } from '../kit.js';
import { P } from './hellion-profiles.js';

const X = px => (px - 5) * 7.175 / 1270, Y = py => (178 - py) * 7.175 / 1270;   // photo pixels → model units
// lathe along +x; points must run front-to-back in increasing x or the faces wind inward
const LX = (p, seg = 48) => latheAxis(p[0][1] > p[p.length - 1][1] ? [...p].reverse() : p, 'x', seg);
// keep the part of a (roughly convex) outline below y = c
function clipBelow(pts, c) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[1] <= c, ib = b[1] <= c;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (c - a[1]) / (b[1] - a[1]); out.push([a[0] + t * (b[0] - a[0]), c]); }
  }
  return out;
}
// annular sector (prong of a flash hider) extruded along x
function prong(r0, r1, a0, a1, len) {
  const s = new THREE.Shape(); s.absarc(0, 0, r1, a0, a1, false); s.absarc(0, 0, r0, a1, a0, true);
  return extrude(s, len, .004, { segs: 1 }).rotateY(Math.PI / 2);
}

export function build() {
  const G = new THREE.Group();
  const bump = tex(stippleCanvas(), { repeat: [6, 6], color: false });
  const poly = new THREE.MeshPhysicalMaterial({ color: 0x34363a, roughness: .7, bumpMap: bump, bumpScale: .3 });
  const polyDk = new THREE.MeshPhysicalMaterial({ color: 0x232427, roughness: .75, bumpMap: bump, bumpScale: .2 });
  const metal = new THREE.MeshStandardMaterial({ color: 0x2e2f31, metalness: .5, roughness: .55 });
  const anod = new THREE.MeshStandardMaterial({ color: 0x1e1f21, metalness: .35, roughness: .6 });
  const grip = polyDk.clone(); grip.bumpMap = tex(stippleCanvas(), { repeat: [14, 14], color: false }); grip.bumpScale = 2.2;
  const dark = GM.dark;
  const slabOf = (pts, holes, depth, mat, o = {}) => { const m = mesh(extrude(shapeFrom(pts, holes), depth, o.bevel ?? .02, { segs: o.segs ?? 4, curve: 12, bevelSize: o.bevelSize }), mat); m.position.z = o.z ?? 0; return m; };
  const slab = (name, depth, mat, o = {}) => slabOf(P[name].outline, P[name].holes, depth, mat, o);
  const both = f => { for (const s of [1, -1]) f(s); };

  /* chassis */
  G.add(slab('stock', .44, poly, { bevel: .04, segs: 1 }));          // chamfered, not rounded
  // M-LOK slots: real openings in the handguard with a dark inner wall 3 mm back
  const slots = [];
  for (let k = 0; k < 4; k++) { const x0 = X(778) + k * .285, x1 = x0 + .24, y0 = Y(165), y1 = y0 + .07; slots.push([[x0, y0], [x1, y0], [x1 + .02, y0 + .035], [x1, y1], [x0, y1], [x0 - .02, y0 + .035]]); }
  G.add(slabOf(P.body.outline, slots, .46, poly, { bevel: .03 }));
  const core = mesh(new THREE.BoxGeometry(X(985) - X(770), .12, .44), dark); core.position.set((X(770) + X(985)) / 2, Y(165) + .035, 0); G.add(core);
  // top: traced rail teeth and blank sight blocks shaved off; a real rail and folded sights replace them
  const top = P.top.outline.map(([x, y]) => [x, Math.min(y, .6)]).filter((p, i, a) => i === 0 || p[0] !== a[i - 1][0] || p[1] !== a[i - 1][1]);
  G.add(slabOf(top, [], .28, polyDk, { bevel: .02 }));
  G.add(slab('magwell', .32, poly, { bevel: .02 }));
  G.add(slab('grip', .26, grip, { bevel: .05, segs: 5 }));
  G.add(slab('guard', .07, poly, { bevel: .012 }));
  const zb = .23 + .03;   // body side face

  /* buttstock: cheek riser, hooked rubber pad, adjustment lever, QD socket */
  const riser = slabOf([[.1, .46], [1.22, .46], [1.22, .54], [1.1, .63], [.14, .63], [.1, .6]], [], .3, poly, { bevel: .025, segs: 1 }); G.add(riser);
  both(s => { const seam = mesh(new THREE.BoxGeometry(1.1, .008, .004), dark); seam.position.set(.66, .475, s * .176); G.add(seam); });
  const padPts = [[0, .5], [-.2, .5], [-.22, .46], [-.22, -.6], [-.2, -.8], [-.12, -.8], [-.08, -.66], [0, -.66]];
  G.add(slabOf(padPts, [], .44, HM.rubber, { bevel: .03, segs: 3 }));
  for (let k = 0; k < 6; k++) { const gr = mesh(new THREE.BoxGeometry(.012, .018, .46), dark); gr.position.set(-.248, .38 - k * .19, 0); G.add(gr); }
  const lev = mesh(new RoundedBoxGeometry(.3, .05, .16, 2, .015), dark); lev.position.set(.75, -.385, 0); G.add(lev);
  const levT = mesh(new RoundedBoxGeometry(.12, .04, .1, 2, .012), metal); levT.position.set(.82, -.405, 0); G.add(levT);
  both(s => {
    const qd = mesh(new THREE.TorusGeometry(.06, .015, 10, 24), metal); qd.position.set(1.05, -.22, s * .262); G.add(qd);
    const qdh = mesh(new THREE.CircleGeometry(.045, 20), dark); qdh.position.set(1.05, -.22, s * .262); if (s < 0) qdh.rotation.y = Math.PI; G.add(qdh);
    for (const [x, y] of [[.3, .1], [.3, -.4], [1.25, .3]]) { const sc = mesh(new THREE.CylinderGeometry(.025, .025, .01, 6), metal); sc.rotation.x = Math.PI / 2; sc.position.set(x, y, s * .264); G.add(sc); }
  });

  /* top rail and folded flip-up sights */
  const railY = .56, railTop = railY + .0875;
  const rail = picatinny(X(930) - X(380), metal); rail.position.set(X(380), railY, 0); G.add(rail);
  for (const [x, w] of [[2.06, .2], [5.33, .16]]) {
    const b = mesh(new RoundedBoxGeometry(w, .08, .22, 2, .02), anod); b.position.set(x, railTop + .03, 0); G.add(b);
    const f = mesh(new RoundedBoxGeometry(w * .8, .03, .16, 2, .01), metal); f.position.set(x + .02, railTop + .08, 0); G.add(f);
  }

  /* receiver sides: ejection-port covers (both sides, switchable), deflector, selector, slots, screws */
  both(s => {
    const z = s * zb, pc = mesh(new RoundedBoxGeometry(.75, .15, .02, 2, .008), metal); pc.position.set(1.98, .14, z); G.add(pc);
    const ln = mesh(new THREE.BoxGeometry(.72, .006, .004), dark); ln.position.set(1.98, .1, z + s * .011); G.add(ln);
    const hinge = mesh(new THREE.CylinderGeometry(.015, .015, .75, 10), metal); hinge.rotation.z = Math.PI / 2; hinge.position.set(1.98, .065, z + s * .008); G.add(hinge);
    const def = mesh(new THREE.SphereGeometry(.05, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xb08d57, metalness: .9, roughness: .35 })); def.rotation.x = s * Math.PI / 2; def.scale.set(1, .5, .8); def.position.set(2.42, .14, z); G.add(def);
    const sel = mesh(latheAxis([[0, 0], [.09, 0], [.09, .015], [.075, .025], [0, .025]], 'z', 32), metal); sel.position.set(X(607), Y(190), z); if (s < 0) sel.rotation.y = Math.PI; G.add(sel);
    const lever = mesh(new RoundedBoxGeometry(.16, .035, .02, 2, .01), metal); lever.position.set(X(607) - .03, Y(190) + .04, s * (zb + .03)); lever.rotation.z = .5; G.add(lever);
    // parting lines at the stock and handguard joints
    for (const [x, y, h] of [[1.49, -.03, .7], [X(760), Y(195), .5]]) { const pl = mesh(new THREE.BoxGeometry(.008, h, .004), dark); pl.position.set(x, y, z + s * .002); G.add(pl); }
    for (const [px, py] of [[790, 195], [970, 195], [148, 218], [435, 222], [375, 98], [520, 120], [700, 120], [330, 205]]) {
      const sc = mesh(new THREE.CylinderGeometry(.025, .025, .012, 6), metal); sc.rotation.x = Math.PI / 2; sc.position.set(X(px), Y(py), s * (zb + .004)); G.add(sc);
      const tx = mesh(new THREE.BoxGeometry(.03, .008, .004), dark); tx.position.set(X(px), Y(py), s * (zb + .011)); G.add(tx);
    }
    const sling = mesh(new THREE.TorusGeometry(.05, .014, 10, 24), metal); sling.position.set(X(1015), Y(215), z); G.add(sling);
  });
  // forward charging handle riding in a slot track along the rail window (left side)
  const track = mesh(new THREE.BoxGeometry(1.4, .025, .01), dark); track.position.set(3.7, .47, -.145); G.add(track);
  const ch = mesh(new RoundedBoxGeometry(.1, .09, .14, 2, .02), metal); ch.position.set(4.35, .47, -.2); G.add(ch);
  for (let k = 0; k < 3; k++) { const r = mesh(new THREE.BoxGeometry(.01, .07, .01), dark); r.position.set(4.32 + k * .03, .47, -.272); G.add(r); }
  const sm = label([['SAFE  ·  FIRE', .8, 700]], .4, .05, { color: '#c93a32' }); sm.position.set(X(650), Y(165), zb + .002); G.add(sm);
  const lr = picatinny(X(975) - X(765), metal, { width: .2 }); lr.rotation.x = Math.PI; lr.position.set(X(765), Y(232) + .095, 0); G.add(lr);
  const mk = label([['LV ARMS', .7, 700], ['HELLION  5.56', .5, 600]], .45, .16, { color: '#9a9b9e' }); mk.position.set(X(210), Y(210), .262); G.add(mk);

  /* barrel, barrel-nut collar and four-prong flash hider */
  const xb = X(1030), xh = X(1170);
  G.add(mesh(LX([[.11, xb - .1], [.11, xb + .2], [.085, xb + .23], [.08, xb + .23], [.08, xh - .4], [.075, xh - .38], [.075, xh]]), metal));
  G.add(mesh(LX([[.08, xh - .01], [.11, xh + .01], [.11, xh + .2], [.07, xh + .2]]), metal));
  for (let k = 0; k < 4; k++) { const a = k * Math.PI / 2 + Math.PI / 4 + .2; const p = mesh(prong(.07, .11, a, a + Math.PI / 2 - .4, .35), metal); p.position.x = xh + .375; G.add(p); }
  const bore = mesh(new THREE.CircleGeometry(.07, 24), dark); bore.rotation.y = Math.PI / 2; bore.position.set(xh + .2 + .001, 0, 0); G.add(bore);
  G.add(mesh(LX([[.028, xh + .202], [.028, xh + .55]], 24), dark));

  /* PMAG-style magazine: flared floorplate, waffle grip band */
  G.add(slab('mag', .22, polyDk, { bevel: .015 }));
  const waffle = polyDk.clone(); waffle.bumpMap = tex(knurlCanvas(10), { repeat: [5, 5], color: false }); waffle.bumpScale = 3;
  G.add(slabOf(clipBelow(P.mag.outline, -1.3), [], .235, waffle, { bevel: .01 }));
  const fp = mesh(new RoundedBoxGeometry(.66, .07, .28, 2, .02), polyDk); fp.position.set(2.34, -1.66, 0); fp.rotation.z = .38; G.add(fp);
  both(s => { const pnl = mesh(new RoundedBoxGeometry(.2, .3, .01, 2, .02), new THREE.MeshStandardMaterial({ color: 0x3a3b3e, roughness: .8 })); pnl.position.set(2.12, -.95, s * .124); pnl.rotation.z = -.27; G.add(pnl); });

  /* 1–8×24 LPVO */
  const sy = railTop + .39, S = new THREE.Group(); S.position.set(0, sy, 0); G.add(S);
  const scope = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, metalness: .35, roughness: .6 });
  const knurl = HM.knurled(0x1c1d1f, [30, 1]);
  S.add(mesh(LX([[.2, 2.38], [.22, 2.4], [.22, 2.62], [.205, 2.66], [.2, 3.08], [.165, 3.14], [.15, 3.18], [.15, 4.4], [.165, 4.46], [.17, 4.55], [.17, 4.83], [.155, 4.85], [.14, 4.85]], 64), scope));
  S.add(mesh(LX([[.225, 2.92], [.225, 3.06]], 64), knurl));
  S.add(mesh(LX([[.212, 2.45], [.212, 2.55]], 64), knurl));
  const fin = mesh(new RoundedBoxGeometry(.1, .04, .25, 2, .015), scope); fin.position.set(2.99, 0, .33); S.add(fin);
  const coat = new THREE.MeshPhysicalMaterial({ color: 0x03070a, metalness: .05, roughness: .04, envMapIntensity: .35, iridescence: .7, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700] });
  for (const [x, r, f] of [[4.83, .14, 1], [2.39, .19, -1]]) { const l = mesh(new THREE.CircleGeometry(r, 40), coat); l.rotation.y = f * Math.PI / 2; l.position.x = x; S.add(l); }
  const saddle = mesh(new RoundedBoxGeometry(.5, .28, .36, 4, .08), scope); saddle.position.set(3.7, 0, 0); S.add(saddle);
  for (const [rot, pos, h, r] of [[[0, 0, 0], [3.7, .13, 0], .12, .11], [[Math.PI / 2, 0, 0], [3.7, 0, .17], .12, .11], [[-Math.PI / 2, 0, 0], [3.7, 0, -.17], .1, .09]]) {
    const t = mesh(latheAxis([[r, 0], [r, h - .02], [r - .02, h], [0, h]], 'y', 40), HM.knurled(0x1c1d1f, [16, 1]));
    t.rotation.set(...rot); t.position.set(...pos); S.add(t);
  }

  /* one-piece cantilever mount: clamp base on the rail, wedge uprights, split rings */
  const base = -.39, rr = .2;
  S.add(slabOf([[2.95, base], [3.95, base], [3.95, base + .08], [4.22, -.2], [4.48, -.2], [4.48, -.14], [4.25, -.14], [3.9, base + .12], [3.45, base + .12], [3.4, -.14], [3.15, -.14], [3.12, base + .1], [2.95, base + .08]], [], .17, anod, { bevel: .015, segs: 1 }));
  for (const x of [3.28, 4.35]) {
    S.add(mesh(LX([[.152, x - .05], [rr, x - .05], [rr, x + .05], [.152, x + .05]], 48), anod));
    S.add(mesh(LX([[.151, x - .05], [.151, x + .05]], 48), anod));
    both(s => {
      const ear = mesh(new RoundedBoxGeometry(.1, .06, .06, 2, .012), anod); ear.position.set(x, 0, s * (rr + .02)); S.add(ear);
      const split = mesh(new THREE.BoxGeometry(.105, .005, .065), dark); split.position.set(x, 0, s * (rr + .02)); S.add(split);
      for (const dx of [-.025, .025]) { const sc = mesh(new THREE.CylinderGeometry(.018, .018, .012, 12), metal); sc.position.set(x + dx, .032, s * (rr + .03)); S.add(sc); }
    });
  }
  for (const x of [3.2, 3.75]) {
    const nut = mesh(new THREE.CylinderGeometry(.06, .06, .05, 6), anod); nut.rotation.x = Math.PI / 2; nut.position.set(x, base + .03, .11); S.add(nut);
    const bolt = mesh(new THREE.CylinderGeometry(.025, .025, .25, 12), metal); bolt.rotation.x = Math.PI / 2; bolt.position.set(x, base - .02, 0); S.add(bolt);
  }
  return G;
}
