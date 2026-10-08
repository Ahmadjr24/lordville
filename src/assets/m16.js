// M16A2 rifle (display prop), built from side profiles traced off a reference photograph
// (see m16-profiles.js) so the silhouette and proportions match the real rifle: 1006 mm overall,
// 508 mm barrel. Anodised aluminium receivers, parkerised barrel and front sight base, black
// polymer furniture, grey aluminium 30-round magazine. x toward the muzzle, y up, z = right side.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, mkCanvas, tex, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, extrude, label, knurlCanvas, stippleCanvas, HM, GM, grooves } from '../kit.js';
import { P } from './m16-profiles.js';

const part = (name, depth, mat, o = {}) => {
  const p = P[name];
  const g = extrude(shapeFrom(p.outline, p.holes), depth, o.bevel ?? .012, { segs: o.segs ?? 4, curve: 12, bevelSize: o.bevelSize });
  const m = mesh(g, mat); m.position.z = o.z ?? 0; return m;
};

// A2 handguard: round, split top/bottom, two bands of raised rectangular ribs
function handguard(x0, x1, r, cy, mat) {
  const nx = 520, nt = 120, pos = [], idx = [], P0 = (x1 - x0 - .16) / 28;
  for (let i = 0; i <= nx; i++) {
    const x = x0 + (x1 - x0) * i / nx, u = (x - x0 - .08) / P0, f = u - Math.floor(u);
    const inRange = x > x0 + .08 && x < x1 - .08;
    const rib = inRange ? smooth(.12, .22, f) * (1 - smooth(.78, .88, f)) : 0;
    const endTaper = smooth(x0, x0 + .05, x) * smooth(x1, x1 - .05, x);
    for (let j = 0; j <= nt; j++) {
      const th = j / nt * Math.PI * 2, s = Math.sin(th);
      const band = smooth(.14, .3, Math.abs(s)) * (1 - smooth(.93, .985, Math.abs(s)));  // gap at the side seams and the top/bottom centre lines
      const rr = (r - .012 * (1 - endTaper)) + .016 * rib * band;
      pos.push(x, cy + rr * Math.sin(th), rr * Math.cos(th));
    }
  }
  for (let i = 0; i < nx; i++) for (let j = 0; j < nt; j++) { const a = i * (nt + 1) + j, b = a + nt + 1; idx.push(a, a + 1, b, b, a + 1, b + 1); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
  return mesh(g, mat);
}

export function build() {
  const G = new THREE.Group();
  const anod = new THREE.MeshPhysicalMaterial({ color: 0x3b3d40, metalness: .35, roughness: .55, clearcoat: .15, clearcoatRoughness: .6,
    bumpMap: tex(stippleCanvas(), { repeat: [8, 8], color: false }), bumpScale: .25 });
  const park = new THREE.MeshStandardMaterial({ color: 0x2c2e2c, metalness: .55, roughness: .6, bumpMap: tex(stippleCanvas(), { repeat: [10, 10], color: false }), bumpScale: .3 });
  const poly = new THREE.MeshPhysicalMaterial({ color: 0x19191a, roughness: .62, clearcoat: .08, bumpMap: tex(stippleCanvas(), { repeat: [6, 6], color: false }), bumpScale: .2 });
  const magMat = new THREE.MeshPhysicalMaterial({ color: 0x6b7178, metalness: .5, roughness: .5, clearcoat: .15 });
  const checker = poly.clone(); checker.bumpMap = tex(knurlCanvas(6), { repeat: [10, 10], color: false }); checker.bumpScale = 2.5;
  const dark = GM.dark;

  /* furniture: stock (rounded oval section), checkered pistol grip with finger swell */
  G.add(part('stock', .3, poly, { bevel: .07, segs: 6 }));
  const bp = mesh(new RoundedBoxGeometry(.1, 1.24, .4, 3, .03), poly); bp.position.set(.05, -.58, 0); G.add(bp);
  const trap = mesh(new THREE.BoxGeometry(.004, .5, .22), dark); trap.position.set(-.003, -.55, 0); G.add(trap);
  for (const y of [-.12, -1.0]) { const sc = mesh(new THREE.CylinderGeometry(.025, .025, .01, 16), GM.nitride); sc.rotation.z = Math.PI / 2; sc.position.set(-.003, y, 0); G.add(sc); }
  const sw = mesh(new THREE.TorusGeometry(.065, .014, 8, 24, Math.PI * 1.2), GM.nitride); sw.position.set(.42, -1.2, 0); sw.rotation.z = Math.PI * .9; G.add(sw);
  G.add(part('grip', .2, poly, { bevel: .05, segs: 5 }));
  for (const s of [1, -1]) {
    const pnl = new THREE.Mesh(extrude(shapeFrom([[2.95, -.62], [3.3, -.6], [3.2, -1.2], [2.9, -1.33], [2.82, -1.25]]), .004, 0), checker);
    pnl.position.z = s * .151; G.add(pnl);
  }

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
  const sel = mesh(new RoundedBoxGeometry(.2, .05, .02, 2, .012), GM.nitride); sel.position.set(3.0, -.34, -.122); sel.rotation.z = .2; G.add(sel);
  const selHub = mesh(new THREE.CylinderGeometry(.04, .04, .02, 20), GM.nitride); selHub.rotation.x = Math.PI / 2; selHub.position.set(3.05, -.35, -.12); G.add(selHub);
  const selMk = label([['SAFE', .8, 700], ['SEMI', .8, 700], ['BURST', .8, 700]], .17, .18, { color: '#e8e6dc', align: 'center' });
  selMk.position.set(2.92, -.36, -.1135); selMk.rotation.y = Math.PI; G.add(selMk);
  // bolt catch (left side)
  const bc = new THREE.Mesh(extrude(shapeFrom([[4.0, -.3], [4.18, -.3], [4.2, -.4], [4.1, -.48], [4.0, -.42]]), .02, .006), GM.nitride);
  bc.position.z = -.125; G.add(bc);
  const lmk = label([['LV ARMS', .6, 700], ['M16A2  CAL 5.56 MM', .5, 600], ['SN 9104622', .45, 500]], .7, .2, { color: '#a8acb2', metal: .5, rough: .4 });
  lmk.position.set(4.25, -.5, -.1135); lmk.rotation.y = Math.PI; G.add(lmk);
  // trigger
  const tp = curve([V(3.48, -.47, 0), V(3.52, -.56, 0), V(3.5, -.64, 0), V(3.44, -.68, 0)], 24);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .05, thick: .035, round: 3 }), GM.nitride));

  /* magazine: grey aluminium STANAG with stiffening ribs and black floorplate */
  G.add(part('mag', .2, magMat, { bevel: .012 }));
  // horizontal extent of a traced outline at height y (for placing ribs along the curved body)
  const span = (pts, y) => { const xs = []; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; if ((y1 - y) * (y2 - y) <= 0 && y1 !== y2) xs.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1)); } return [Math.min(...xs), Math.max(...xs)]; };
  const mo = P.mag.outline, my0 = Math.max(...mo.map(p => p[1])) - .1, my1 = Math.min(...mo.map(p => p[1])) + .16;
  for (const s of [1, -1]) for (const f of [.36, .64]) {
    const rp = []; for (let k = 0; k <= 24; k++) { const y = my0 + (my1 - my0) * k / 24, [a, b] = span(mo, y); rp.push(V(a + (b - a) * f, y, s * .112)); }
    G.add(mesh(sweepGeo(freeFrames(rp, V(0, 0, 1), V(1, .1, 0)), { center: true, width: .03, thick: .04, round: 3 }), magMat));
  }
  // black floorplate across the bottom of the magazine
  { const yb = Math.min(...mo.map(p => p[1])), [a, b] = span(mo, yb + .04);
    const fp = mesh(new RoundedBoxGeometry(b - a + .03, .07, .245, 2, .02), poly); fp.position.set((a + b) / 2, yb + .03, 0); fp.rotation.z = .12; G.add(fp); }

  /* upper receiver: body, carry handle with A2 sights, charging handle, forward assist, ejection port */
  G.add(part('upper', .2, anod, { bevel: .014 }));
  G.add(part('handle', .12, anod, { bevel: .014 }));
  G.add(part('chandle', .26, anod, { bevel: .012 }));
  // A2 rear sight: windage knob (right), elevation drum, flip aperture
  const knob = mesh(latheAxis([[0, 0], [.07, 0], [.075, .01], [.075, .06], [.06, .07], [0, .07]], 'z', 32), HM.knurled(0x3b3d40, [12, 1])); knob.position.set(3.18, .53, .06); G.add(knob);
  const drum = mesh(new THREE.CylinderGeometry(.08, .08, .2, 32), HM.knurled(0x3b3d40, [16, 1])); drum.rotation.x = Math.PI / 2; drum.position.set(3.12, .16, 0); G.add(drum);
  const drumMk = label([['8/3  4  5  6', .8, 600]], .14, .03, { color: '#e8e6dc' }); drumMk.position.set(3.12, .16, .101); G.add(drumMk);
  const ap = new THREE.Mesh(extrude(shapeFrom([[3.12, .26], [3.24, .26], [3.24, .46], [3.12, .46]], [[[3.165, .385], [3.195, .385], [3.195, .355], [3.165, .355]]]), .05, .006), anod);
  G.add(ap);
  // ejection port with its dust cover, hinge rod and latch bump
  const port = mesh(new RoundedBoxGeometry(.8, .16, .02, 2, .006), new THREE.MeshPhysicalMaterial({ color: 0x232426, metalness: .5, roughness: .45 }));
  port.position.set(4.2, .005, .107); G.add(port);
  const latch = mesh(new RoundedBoxGeometry(.1, .04, .03, 2, .01), GM.nitride); latch.position.set(4.15, .07, .118); G.add(latch);
  const hinge = mesh(new THREE.CylinderGeometry(.012, .012, .82, 12), GM.nitride); hinge.rotation.z = Math.PI / 2; hinge.position.set(4.2, -.08, .115); G.add(hinge);
  G.add(grooves(3.9, 4.5, 7, .02, .12, .118, { w: .006, d: .004, mat: new THREE.MeshStandardMaterial({ color: 0x151516, roughness: .7 }) }));
  // brass deflector and forward assist (right rear of the upper)
  const defl = mesh(new RoundedBoxGeometry(.15, .17, .07, 3, .03), anod); defl.position.set(3.45, -.01, .1); G.add(defl);
  const fa = mesh(latheAxis([[.065, 3.52], [.07, 3.56], [.07, 3.82]], 'x', 32), anod); fa.position.set(0, .13, .1); fa.rotation.y = .12; G.add(fa);
  const fab = mesh(new RoundedBoxGeometry(.07, .12, .1, 2, .025), GM.nitride); fab.position.set(3.5, .14, .12); G.add(fab);
  G.add(grooves(3.47, 3.47, 1, .14, .1, .171, { w: .004, d: .004 }));
  // charging handle latch (left)
  const chl = mesh(new RoundedBoxGeometry(.1, .05, .04, 2, .012), anod); chl.position.set(2.99, .2, -.15); G.add(chl);

  /* barrel nut, delta ring with weld-spring, A2 ribbed handguards, cap */
  const hy = -.037;
  G.add(mesh(latheAxis([[.2, 4.77], [.3, 4.8], [.315, 4.83], [.315, 4.87], [.3, 4.9]], 'x', 64).translate(0, hy, 0), park));
  G.add(mesh(latheAxis([[.31, 4.79], [.325, 4.81], [.325, 4.85], [.31, 4.87]], 'x', 64).translate(0, hy, 0), GM.nitride));
  G.add(handguard(4.88, 7.86, .292, hy, poly));
  for (const s of [1, -1]) { const seam = mesh(new THREE.BoxGeometry(2.9, .006, .006), dark); seam.position.set(6.37, hy, s * .3); G.add(seam); }
  G.add(mesh(latheAxis([[.29, 7.84], [.28, 7.9], [.24, 7.94], [.1, 7.95]], 'x', 64).translate(0, hy, 0), park));

  /* barrel (A2 profile), gas tube stub, front sight base, bayonet lug, sling swivel */
  G.add(mesh(latheAxis([[.1, 4.85], [.1, 7.95], [.085, 8.0], [.085, 9.58]], 'x', 48), park));
  G.add(mesh(latheAxis([[.025, 7.9], [.025, 8.02]], 'x', 12).translate(0, .21, 0), park));
  const fsbBody = mesh(new RoundedBoxGeometry(.48, .36, .2, 4, .06), park); fsbBody.position.set(8.2, -.01, 0); G.add(fsbBody);
  G.add(mesh(latheAxis([[.12, 7.96], [.13, 7.98], [.13, 8.06], [.12, 8.08]], 'x', 32), park));
  G.add(mesh(latheAxis([[.12, 8.36], [.13, 8.38], [.13, 8.46], [.12, 8.48]], 'x', 32), park));
  const tri = P.fsb;
  G.add(mesh(extrude(shapeFrom(tri.outline, tri.holes), .07, .012, { segs: 3 }), park));
  const post = mesh(new THREE.BoxGeometry(.04, .2, .04), park); post.position.set(8.19, .44, 0); G.add(post);
  const det = mesh(new THREE.CylinderGeometry(.03, .03, .03, 16), park); det.position.set(8.19, .3, 0); G.add(det);
  const lug = mesh(new RoundedBoxGeometry(.16, .1, .08, 2, .02), park); lug.position.set(8.38, -.2, 0); G.add(lug);
  const fsw = mesh(new THREE.TorusGeometry(.07, .015, 8, 24), GM.nitride); fsw.position.set(8.0, -.3, 0); G.add(fsw);
  const pin1 = mesh(new THREE.CircleGeometry(.02, 16), dark); pin1.position.set(8.06, .08, .101); G.add(pin1);
  const pin2 = mesh(new THREE.CircleGeometry(.02, 16), dark); pin2.position.set(8.32, .08, .101); G.add(pin2);

  /* A2 "birdcage" flash hider: five slots, closed at the bottom */
  G.add(mesh(latheAxis([[.09, 9.56], [.11, 9.6], [.114, 9.63], [.114, 10.0], [.105, 10.04], [.06, 10.06]], 'x', 48), park));
  for (let k = 0; k < 5; k++) {
    const a = Math.PI / 2 + (k - 2) * Math.PI / 3.2, s = mesh(new THREE.BoxGeometry(.3, .024, .03), dark);
    s.position.set(9.83, Math.sin(a) * .112, Math.cos(a) * .112); s.rotation.x = -(a - Math.PI / 2); G.add(s);
  }
  const bore = mesh(new THREE.CircleGeometry(.05, 24), dark); bore.rotation.y = Math.PI / 2; bore.position.set(10.061, 0, 0); G.add(bore);
  return G;
}
