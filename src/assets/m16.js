// M16A2 rifle (display prop), built from side profiles traced off a reference photograph
// (see m16-profiles.js) so the silhouette and proportions match the real rifle: 1006 mm overall,
// 508 mm barrel. Anodised aluminium receivers, parkerised barrel and front sight base, black
// polymer furniture, grey aluminium 30-round magazine. x toward the muzzle, y up, z = right side.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, mkCanvas, tex, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, rrPts, extrude, label, knurlCanvas, stippleCanvas, HM, GM, grooves } from '../kit.js';
import { P as RAW } from './m16-profiles.js';

// Clean-ups on the traced outlines: square off the stock's front face, close the notch the
// photo left in the magwell front wall, and give the trigger guard a clean rounded opening.
const P = structuredClone(RAW);
P.stock.outline = P.stock.outline.map(([x, y]) => [Math.min(x, 2.74), y]);
{
  const lo = P.lower.outline, i0 = lo.findIndex(p => p[0] > 4.58 && p[1] < -.76), i1 = lo.findIndex(p => p[0] > 4.69 && p[1] > -.4);
  P.lower.outline = [...lo.slice(0, i0), [4.59, -.77], [4.6, -.47], ...lo.slice(i1)];
  P.lower.holes = [rrPts(3.51, -.815, .345, .205, .085, 8).reverse()];
  // the photo trace cut a slot into the top of the magazine; run its top edge straight across
  const mo = P.mag.outline, a = mo.findIndex(p => Math.abs(p[0] - 4.591) < .002 && Math.abs(p[1] + .7692) < .002), b = mo.findIndex(p => Math.abs(p[0] - 4.4363) < .002);
  if (a >= 0 && b > a) P.mag.outline = [...mo.slice(0, a + 1), ...mo.slice(b)];
}

// Lathe over part of a revolution (around x) with flat caps on both cut planes.
function sectorLathe(prof, phi0, dphi, mat, capMat = mat, seg = 24) {
  const g = new THREE.Group(), pts = prof.map(([r, h]) => new THREE.Vector2(r, h));
  const lg = new THREE.LatheGeometry([...pts, pts[0]], seg, phi0, dphi); lg.rotateZ(-Math.PI / 2);
  g.add(mesh(lg, mat));
  const sh = new THREE.Shape(prof.map(([r, h]) => new THREE.Vector2(h, r)));
  for (const phi of [phi0, phi0 + dphi]) {
    const cg = new THREE.ShapeGeometry(sh); cg.rotateX(Math.PI / 2); cg.rotateX(phi);   // plane containing the x axis at angle phi
    const m = mesh(cg, capMat); m.material.side = THREE.DoubleSide; g.add(m);
  }
  return g;
}

const part = (name, depth, mat, o = {}) => {
  const p = P[name];
  const g = extrude(shapeFrom(p.outline, p.holes), depth, o.bevel ?? .012, { segs: o.segs ?? 4, curve: 12, bevelSize: o.bevelSize });
  const m = mesh(g, mat); m.position.z = o.z ?? 0; return m;
};

// A2 handguard: round, split top/bottom, two bands of raised rectangular ribs
function handguard(x0, x1, r, cy, mat) {
  const nx = 720, nt = 160, pos = [], col = [], idx = [], P0 = (x1 - x0 - .16) / 31;
  const gap = new THREE.Color(0x0b0b0b), top = new THREE.Color(0x29292b), c = new THREE.Color();
  for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * i / nx, u = (x - x0 - .08) / P0, f = u - Math.floor(u);
    const inRange = x > x0 + .08 && x < x1 - .08;
    const rib = inRange ? smooth(.2, .24, f) * (1 - smooth(.76, .8, f)) : 0;   // flat-topped pads, square shoulders
    const endTaper = smooth(x0, x0 + .15, x) * smooth(x1, x1 - .15, x);
    for (let j = 0; j <= nt; j++) {
      const th = j / nt * Math.PI * 2, s = Math.sin(th);
      const band = smooth(.05, .09, Math.abs(s));  // hairline gap only at the side seams between the two rib rows
      const rr = (r - .04 * (1 - endTaper)) + .022 * rib * band;
      pos.push(x, cy + rr * Math.sin(th), rr * Math.cos(th));
      c.copy(rib * band > .97 ? top : gap); col.push(c.r, c.g, c.b);   // dark floors between pads so the ribs read under any light
    }
  }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + nt + 1; idx.push(a, b, a + 1, b, b + 1, a + 1); }   // outward-facing winding
  let g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3)); g.setIndex(idx);
  g = g.toNonIndexed(); g.computeVertexNormals();   // faceted normals keep the rib shoulders crisp instead of glinting
  const shell = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .85, metalness: 0 });
  const H = new THREE.Group(); H.add(mesh(g, shell));
  // inner wall and annular end faces so the open ends read as a solid shell
  const inner = mat.clone(); inner.side = THREE.BackSide; inner.color.multiplyScalar(.6);
  H.add(mesh(latheAxis([[.22, x0], [.22, x1]], 'x', 64).translate(0, cy, 0), inner));
  for (const [x, s] of [[x0, -1], [x1, 1]]) { const endMat = mat.clone(); endMat.side = THREE.DoubleSide; const ring = mesh(new THREE.RingGeometry(.07, r - .035, 64), endMat); ring.rotation.y = s * Math.PI / 2; ring.position.set(x, cy, 0); H.add(ring); }
  return H;
}

export function build() {
  const G = new THREE.Group();
  const anod = new THREE.MeshPhysicalMaterial({ color: 0x3b3d40, metalness: .35, roughness: .58, clearcoat: .05, clearcoatRoughness: .6,
    bumpMap: tex(stippleCanvas(), { repeat: [8, 8], color: false }), bumpScale: .25 });
  const park = new THREE.MeshStandardMaterial({ color: 0x36383a, metalness: .4, roughness: .75, bumpMap: tex(stippleCanvas(), { repeat: [10, 10], color: false }), bumpScale: .3 });
  const poly = new THREE.MeshPhysicalMaterial({ color: 0x19191a, roughness: .62, clearcoat: .08, bumpMap: tex(stippleCanvas(), { repeat: [6, 6], color: false }), bumpScale: .2 });
  const magMat = new THREE.MeshStandardMaterial({ color: 0x555a60, metalness: .3, roughness: .7 });
  const magRib = new THREE.MeshStandardMaterial({ color: 0x33373c, metalness: .3, roughness: .8 });
  const checker = poly.clone(); checker.bumpMap = tex(knurlCanvas(6), { repeat: [10, 10], color: false }); checker.bumpScale = 2.5;
  const dark = GM.dark;

  /* furniture: stock (rounded oval section), checkered pistol grip with finger swell */
  G.add(part('stock', .26, poly, { bevel: .09, segs: 7 }));
  for (let k = 0; k < 5; k++) { const gv = mesh(new THREE.BoxGeometry(.004, .012, .34), GM.dark); gv.position.set(-.003, -.25 - k * .17, 0); G.add(gv); }
  const bp = mesh(new RoundedBoxGeometry(.1, 1.24, .4, 3, .03), poly); bp.position.set(.05, -.58, 0); G.add(bp);
  const trap = mesh(new THREE.BoxGeometry(.004, .5, .22), dark); trap.position.set(-.003, -.55, 0); G.add(trap);
  for (const y of [-.12, -1.0]) { const sc = mesh(new THREE.CylinderGeometry(.025, .025, .01, 16), GM.nitride); sc.rotation.z = Math.PI / 2; sc.position.set(-.003, y, 0); G.add(sc); }
  const ear = mesh(new RoundedBoxGeometry(.08, .05, .06, 2, .015), GM.nitride); ear.position.set(.45, -1.15, 0); G.add(ear);
  const sw = mesh(new THREE.TorusGeometry(.075, .006, 8, 32), GM.nitride); sw.scale.set(2, 1, 1); sw.position.set(.45, -1.24, 0); sw.rotation.x = .25; G.add(sw);
  const gripMat = poly.clone(); gripMat.bumpMap = tex(knurlCanvas(6), { repeat: [14, 14], color: false }); gripMat.bumpScale = 1.6;
  G.add(part('grip', .18, gripMat, { bevel: .06, segs: 6 }));
  const swell = mesh(new THREE.SphereGeometry(1, 24, 16), poly); swell.scale.set(.05, .09, .1); swell.position.set(3.225, -1.06, 0); G.add(swell);

  /* lower receiver: magwell, integral trigger guard, pins, mag release, selector, bolt catch */
  G.add(part('lower', .2, anod, { bevel: .012 }));
  for (const [x, y] of [[3.01, -.256], [4.62, -.256]]) for (const s of [1, -1]) {
    const pin = mesh(new THREE.CylinderGeometry(.035, .035, .012, 20), anod); pin.rotation.x = Math.PI / 2; pin.position.set(x, y, s * .118); G.add(pin);
  }
  for (const [x, y] of [[3.22, -.33], [3.46, -.31]]) for (const s of [1, -1]) {
    const pn = mesh(new THREE.CircleGeometry(.018, 16), dark); pn.position.set(x, y, s * .1135); pn.rotation.y = s < 0 ? Math.PI : 0; G.add(pn);
  }
  // magazine release button with its raised fence (right side)
  const fence = mesh(new THREE.TorusGeometry(.06, .014, 8, 24), anod); fence.position.set(3.85, -.36, .115); G.add(fence);
  const mr = mesh(new RoundedBoxGeometry(.08, .08, .04, 2, .012), GM.nitride); mr.position.set(3.85, -.36, .122); G.add(mr);
  // selector lever and SAFE / SEMI / BURST markings (left side)
  const phos = new THREE.MeshStandardMaterial({ color: 0x2d2f31, metalness: .4, roughness: .6 });
  const selHub = mesh(new THREE.CylinderGeometry(.045, .045, .02, 24), phos); selHub.rotation.x = Math.PI / 2; selHub.position.set(3.05, -.35, -.12); G.add(selHub);
  const sel = mesh(extrude(shapeFrom([[2.99, -.32], [3.15, -.33], [3.24, -.35], [3.15, -.37], [2.99, -.38]]), .03, .006), phos); sel.position.z = -.13; G.add(sel);
  for (const [t, x, y] of [['SAFE', 3.31, -.35], ['SEMI', 3.05, -.1], ['BURST', 2.79, -.35]]) {
    const m = label([[t, .85, 700]], .09, .025, { color: '#bdbcb4', align: 'center' }); m.material.opacity = .75; m.material.transparent = true;
    m.position.set(x, y, -.1135); m.rotation.y = Math.PI; G.add(m);
  }
  // bolt catch (left side)
  const boss = mesh(new RoundedBoxGeometry(.06, .2, .02, 2, .008), anod); boss.position.set(3.95, -.29, -.118); G.add(boss);
  const bc = mesh(extrude(shapeFrom([[3.86, -.37], [4.03, -.37], [4.05, -.44], [3.96, -.5], [3.86, -.45]]), .03, .006), phos); bc.position.z = -.13; G.add(bc);
  for (let k = 0; k < 4; k++) { const sr = mesh(new THREE.BoxGeometry(.13, .006, .006), GM.dark); sr.position.set(3.955, -.425 - k * .016, -.152); G.add(sr); }
  const rp = mesh(new THREE.CircleGeometry(.012, 12), GM.dark); rp.position.set(3.95, -.22, -.1295); rp.rotation.y = Math.PI; G.add(rp);
  const lmk = label([['LV ARMS', .6, 700], ['M16A2  CAL 5.56 MM', .5, 600], ['SN 9104622', .45, 500]], .7, .2, { color: '#a8acb2', metal: .5, rough: .4 });
  lmk.position.set(4.25, -.5, -.1135); lmk.rotation.y = Math.PI; G.add(lmk);
  // trigger
  const tp = curve([V(3.62, -.56, 0), V(3.66, -.64, 0), V(3.65, -.72, 0), V(3.6, -.77, 0)], 24);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .06, thick: .04, round: 3 }), GM.nitride));

  /* magazine: grey aluminium STANAG with stiffening ribs and black floorplate */
  G.add(part('mag', .2, magMat, { bevel: .012 }));
  // horizontal extent of a traced outline at height y (for placing ribs along the curved body)
  const span = (pts, y) => { const xs = []; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; if ((y1 - y) * (y2 - y) <= 0 && y1 !== y2) xs.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1)); } return [Math.min(...xs), Math.max(...xs)]; };
  const mo = P.mag.outline, my0 = Math.max(...mo.map(p => p[1])) - .1, my1 = Math.min(...mo.map(p => p[1])) + .16;
  for (const s of [1, -1]) for (const f of [.36, .64]) {
    const rp = []; for (let k = 0; k <= 24; k++) { const y = my0 + (my1 - my0) * k / 24, [a, b] = span(mo, y); rp.push(V(a + (b - a) * f, y, s * .112)); }
    G.add(mesh(sweepGeo(freeFrames(rp, V(0, 0, 1), V(1, .1, 0)), { center: true, width: .004, thick: .03, round: 3 }), magRib));   // pressed-in channel
  }
  const wall = mesh(new RoundedBoxGeometry(.1, .32, .2, 2, .01), anod); wall.position.set(4.55, -.615, 0); G.add(wall);
  // flared magwell lip around the magazine
  { const [a, b] = span(mo, -.79), outer = shapeFrom(rrPts(a - .025, -.135, b - a + .05, .27, .02), [rrPts(a + .005, -.105, b - a - .01, .21, .01).reverse()]);
    const lip = mesh(extrude(outer, .05, .006), anod); lip.rotation.x = Math.PI / 2; lip.position.y = -.77; G.add(lip); }
  // black floorplate across the bottom of the magazine
  { const yb = Math.min(...mo.map(p => p[1])), [a, b] = span(mo, yb + .04);
    const fp = mesh(new RoundedBoxGeometry(b - a + .03, .07, .245, 2, .02), poly); fp.position.set((a + b) / 2, yb + .03, 0); fp.rotation.z = .12; G.add(fp); }

  /* upper receiver: body, carry handle with A2 sights, charging handle, forward assist, ejection port */
  G.add(part('upper', .2, anod, { bevel: .014 }));
  G.add(part('handle', .12, anod, { bevel: .014 }));
  // rear of the upper: one smooth slope from the stock face up to the sight base, charging-handle T behind it
  G.add(mesh(extrude(shapeFrom([[2.74, .07], [2.74, .11], [2.96, .26], [3.1, .26], [3.1, .07]]), .2, .014, { segs: 4 }), anod));
  // charging handle: flat T flush with the top of the upper, right behind the sight base, latch in the left wing
  const ch = mesh(new RoundedBoxGeometry(.08, .05, .4, 2, .015), anod); ch.position.set(2.995, .225, 0); G.add(ch);
  const chLatch = mesh(new RoundedBoxGeometry(.12, .045, .07, 2, .012), anod); chLatch.position.set(2.985, .225, -.185); G.add(chLatch);
  for (let k = 0; k < 3; k++) { const sr = mesh(new THREE.BoxGeometry(.006, .047, .06), GM.dark); sr.position.set(2.94 + k * .02, .225, -.19); G.add(sr); }
  // A2 rear sight base: two side walls (ears) with the flip aperture between them, a knurled
  // elevation drum sitting inside the ears, and a large knurled windage knob on the right
  for (const s of [1, -1]) { const ear = mesh(new RoundedBoxGeometry(.29, .15, .03, 3, .014), anod); ear.position.set(3.195, .61, s * .11); G.add(ear); }
  const sbase = mesh(new RoundedBoxGeometry(.3, .06, .25, 2, .015), anod); sbase.position.set(3.195, .54, 0); G.add(sbase);
  const knob = mesh(latheAxis([[0, 0], [.1, 0], [.1, .08], [.088, .09], [0, .09]], 'z', 48), HM.knurled(0x3b3d40, [22, 1])); knob.position.set(3.2, .61, .125); G.add(knob);
  const kmk = mesh(new THREE.BoxGeometry(.006, .02, .004), GM.white); kmk.position.set(3.2, .695, .216); G.add(kmk);
  const drum = mesh(latheAxis([[.11, -.09], [.11, .09]], 'z', 48), HM.knurled(0x3b3d40, [18, 1])); drum.position.set(3.19, .45, 0); G.add(drum);
  for (const s of [1, -1]) { const cap = mesh(new THREE.CircleGeometry(.11, 48), anod); cap.position.set(3.19, .45, s * .09); cap.rotation.y = s < 0 ? Math.PI : 0; G.add(cap); }
  for (const [t, a] of [['8/3', 1.75], ['4', 2.2], ['5', 2.65], ['6', 3.1]]) {
    const m = label([[t, .9, 700]], .05, .03, { color: '#d9d8d0', align: 'center' });
    m.rotation.order = 'ZYX'; m.rotation.set(0, Math.PI / 2, a); m.position.set(3.19 + .1115 * Math.cos(a), .45 + .1115 * Math.sin(a), .05); G.add(m);
  }
  const ap = mesh(new RoundedBoxGeometry(.04, .14, .17, 2, .01), anod); ap.position.set(3.19, .62, 0); G.add(ap);
  const apRing = mesh(new THREE.TorusGeometry(.03, .008, 8, 24), anod); apRing.rotation.y = Math.PI / 2; apRing.position.set(3.168, .64, 0); G.add(apRing);
  const apHole = mesh(new THREE.CylinderGeometry(.012, .012, .05, 16), GM.dark); apHole.rotation.z = Math.PI / 2; apHole.position.set(3.19, .64, 0); G.add(apHole);
  // ejection port with its dust cover, hinge rod and latch bump
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x313336, metalness: .45, roughness: .55 });
  const recess = mesh(new THREE.BoxGeometry(.796, .166, .004), GM.dark); recess.position.set(4.2, .005, .1145); G.add(recess);
  const cover = mesh(new RoundedBoxGeometry(.78, .15, .006, 2, .002), coverMat); cover.position.set(4.2, .005, .1165); G.add(cover);
  const crib = mesh(new RoundedBoxGeometry(.7, .03, .008, 2, .003), coverMat); crib.position.set(4.22, .04, .121); G.add(crib);
  const latch = mesh(new RoundedBoxGeometry(.07, .04, .02, 2, .008), coverMat); latch.position.set(3.87, .06, .124); G.add(latch);
  const hinge = mesh(new THREE.CylinderGeometry(.011, .011, .82, 12), coverMat); hinge.rotation.z = Math.PI / 2; hinge.position.set(4.2, -.075, .118); G.add(hinge);
  // brass deflector: wedge behind the port, tallest at its rear, sloping into the receiver toward the port
  { const w = new THREE.Shape(); w.moveTo(3.6, 0); w.lineTo(3.62, .11); w.lineTo(3.68, .118); w.lineTo(3.8, 0); w.closePath();
    const g = extrude(w, .16, .008); g.rotateX(Math.PI / 2); g.translate(0, .06, .114);
    G.add(mesh(g, anod)); }
  // forward assist: tube proud of the right side, tilted down toward the front, serrated plunger at the rear
  { const FA = new THREE.Group(); FA.position.set(3.4, .1, .095); FA.rotation.z = -.17;
    FA.add(mesh(latheAxis([[.085, 0], [.09, .02], [.09, .3], [.07, .35]], 'x', 40), anod));
    FA.add(mesh(latheAxis([[.0, -.08], [.06, -.08], [.075, -.07], [.075, .01]], 'x', 40), phos));
    for (let k = 0; k < 8; k++) { const r = mesh(new THREE.BoxGeometry(.06, .008, .012), GM.dark); const a = k / 8 * Math.PI * 2; r.position.set(-.04, Math.sin(a) * .074, Math.cos(a) * .074); r.rotation.x = -a; FA.add(r); }
    const web = mesh(new RoundedBoxGeometry(.34, .14, .08, 3, .03), anod); web.position.set(.17, -.05, -.02); FA.add(web);
    G.add(FA); }
  // charging handle latch (left)

  /* barrel nut, delta ring with weld-spring, A2 ribbed handguards, cap */
  const hy = -.037;
  const ringSteel = park.clone(); ringSteel.color.set(0x2f3133);
  G.add(mesh(latheAxis([[.0, 4.78], [.19, 4.78], [.19, 4.92]], 'x', 48), park));
  G.add(mesh(latheAxis([[.19, 4.83], [.3, 4.83], [.312, 4.842], [.312, 4.99], [.262, 5.04]], 'x', 64).translate(0, hy, 0), ringSteel));
  G.add(handguard(5.0, 7.86, .292, hy, poly));
  for (const s of [1, -1]) { const seam = mesh(new THREE.BoxGeometry(2.8, .006, .006), dark); seam.position.set(6.43, hy, s * .3); G.add(seam); }
  G.add(mesh(latheAxis([[.29, 7.84], [.28, 7.9], [.24, 7.94], [.1, 7.95]], 'x', 64).translate(0, hy, 0), ringSteel));

  /* barrel: A2 profile is heavier forward of the front sight base */
  G.add(mesh(latheAxis([[.08, 4.8], [.08, 7.95], [.095, 7.98], [.095, 9.58]], 'x', 48), park));
  G.add(mesh(latheAxis([[.025, 7.86], [.025, 7.98]], 'x', 12).translate(0, .21, 0), park));

  /* A2 front sight base: collar around the barrel, gas block, A-frame tower split into two ears, square post */
  G.add(mesh(latheAxis([[.12, 7.98], [.14, 8.0], [.14, 8.38], [.12, 8.4]], 'x', 48), park));
  const tri = { outline: P.fsb.outline.map(([x, y]) => [Math.min(x, 8.4), y]), holes: P.fsb.holes };   // trim the sliver flush with the collar front
  for (const s of [1, -1]) { const ear = mesh(extrude(shapeFrom(tri.outline, tri.holes), .05, .008, { segs: 2 }), park); ear.position.z = s * .08; G.add(ear); }
  const fbase = mesh(new RoundedBoxGeometry(.45, .08, .22, 2, .02), park); fbase.position.set(8.175, .12, 0); G.add(fbase);
  const post = mesh(new THREE.BoxGeometry(.019, .34, .03), park); post.position.set(8.19, .33, 0); G.add(post);
  const det = mesh(new THREE.CylinderGeometry(.015, .015, .02, 12), park); det.position.set(8.215, .17, 0); G.add(det);
  const lug = mesh(new RoundedBoxGeometry(.16, .1, .07, 2, .015), park); lug.position.set(8.36, -.18, 0); G.add(lug);
  const fear = mesh(new RoundedBoxGeometry(.06, .06, .05, 2, .015), park); fear.position.set(8.05, -.15, 0); G.add(fear);
  const fsw = mesh(new THREE.TorusGeometry(.075, .006, 8, 32), GM.nitride); fsw.scale.set(2, 1, 1); fsw.position.set(8.05, -.25, 0); fsw.rotation.x = .25; G.add(fsw);
  for (const x of [8.06, 8.32]) { const pn = mesh(new THREE.CircleGeometry(.018, 16), dark); pn.position.set(x, .0, .141); G.add(pn); }

  /* A2 "birdcage" flash hider: five real slots, closed at the bottom, flat crowned face */
  const slotW = .27, slots = [-2, -1, 0, 1, 2].map(k => -(Math.PI / 2 + k * Math.PI / 3.2));   // lathe angle phi for each slot centre
  const inside = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .8, side: THREE.DoubleSide });
  G.add(mesh(latheAxis([[.09, 9.56], [.11, 9.6], [.11, 9.72]], 'x', 48), park));
  G.add(mesh(latheAxis([[.11, 10.0], [.11, 10.03], [.095, 10.045], [.045, 10.045]], 'x', 48), park));
  G.add(mesh(latheAxis([[.07, 9.7], [.07, 10.02]], 'x', 32), inside));
  const norm = a => ((a % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
  const cuts = slots.map(c => norm(c)).sort((a, b) => a - b);
  for (let i = 0; i < cuts.length; i++) {
    const a0 = cuts[i] + slotW / 2, a1 = (i + 1 < cuts.length ? cuts[i + 1] : cuts[0] + Math.PI * 2) - slotW / 2;
    G.add(sectorLathe([[.07, 9.72], [.11, 9.72], [.11, 10.0], [.07, 10.0]], a0, a1 - a0, park, inside));
  }
  const bore = mesh(new THREE.CircleGeometry(.045, 24), dark); bore.rotation.y = Math.PI / 2; bore.position.set(10.046, 0, 0); G.add(bore);
  return G;
}
