// .357 Magnum double-action revolver, 4" full-underlug barrel (display prop): satin stainless
// frame with top strap and recoil shield, six-shot fluted cylinder (loaded), ribbed barrel with
// red-insert ramp sight, adjustable rear sight, checkered hammer spur, smooth combat trigger,
// cylinder release, and checkered walnut grips with medallions. x toward the muzzle, y up.
import { THREE, RoundedBoxGeometry, V, mesh, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, extrude, label, HM, GM, slab, grooves } from '../kit.js';

function cylinderShape(R, rc, rh, flute) {
  const pts = [], n = 180;
  for (let i = 0; i < n; i++) {
    const a = i / n * Math.PI * 2;
    let r = R;
    if (flute) for (let k = 0; k < 6; k++) {
      const af = Math.PI / 2 + Math.PI / 6 + k * Math.PI / 3;
      let d = Math.atan2(Math.sin(a - af), Math.cos(a - af));
      if (Math.abs(d) < .22) r = Math.min(r, R - .034 * Math.sqrt(1 - (d / .22) ** 2));
    }
    pts.push([r * Math.cos(a), r * Math.sin(a)]);
  }
  const holes = [];
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3, h = [];
    for (let j = 0; j < 28; j++) { const b = -j / 28 * Math.PI * 2; h.push([rc * Math.cos(a) + rh * Math.cos(b), rc * Math.sin(a) + rh * Math.sin(b)]); }
    holes.push(h);
  }
  return shapeFrom(pts, holes);
}

export function build() {
  const G = new THREE.Group();
  const steel = GM.stainless;

  /* frame with cylinder window and trigger guard */
  const frame = [[.98, 1.1], [.98, .82], [.92, .7], [.88, .66], [.78, .64], [.77, .55], [.745, .45], [.69, .405], [.56, .405], [.5, .44], [.46, .5],
    [.42, .5], [.36, .14], [.2, .1], [.12, .2], [.2, .62], [.22, .75], [.24, .86], [.29, .97], [.31, 1.08], [.36, 1.12]];
  const window = [[.43, .69], [.905, .69], [.905, 1.075], [.43, 1.075]];
  const guard = [[.73, .615], [.72, .5], [.675, .455], [.575, .455], [.525, .5], [.525, .615]];
  G.add(slab(frame, .27, steel, { holes: [window, guard], bevel: .016, segs: 4 }));
  for (const [x, y] of [[.3, .6], [.66, .93], [.36, .3]]) {
    const sc = mesh(new THREE.CylinderGeometry(.022, .022, .01, 20), steel); sc.rotation.x = Math.PI / 2; sc.position.set(x, y, .152); G.add(sc);
    const sl = mesh(new THREE.BoxGeometry(.034, .006, .004), GM.dark); sl.position.set(x, y, .158); sl.rotation.z = .5; G.add(sl);
  }

  /* cylinder: rear and front plain bands, fluted middle, loaded chambers */
  const cy = .885, R = .185, rc = .115, rh = .045;
  const seg = (x0, x1, flute) => {
    const g = extrude(cylinderShape(R, rc, rh, flute), x1 - x0, .006, { segs: 2, curve: 12 });
    g.rotateY(Math.PI / 2); g.translate((x0 + x1) / 2, cy, 0);
    return mesh(g, steel);
  };
  G.add(seg(.44, .5, false), seg(.5, .82, true), seg(.82, .875, false));
  for (let k = 0; k < 6; k++) {
    const a = Math.PI / 2 + k * Math.PI / 3, y = cy + rc * Math.sin(a), z = -rc * Math.cos(a);
    const ch = mesh(new THREE.CylinderGeometry(rh - .001, rh - .001, .42, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, side: THREE.BackSide, roughness: .7 }));
    ch.rotation.z = Math.PI / 2; ch.position.set(.66, y, z); G.add(ch);
    const nose = mesh(latheAxis([[.042, .84], [.042, .855], [.028, .865], [.012, .868]], 'x', 20).translate(0, y, z), new THREE.MeshStandardMaterial({ color: 0xb5714a, metalness: .9, roughness: .35 }));
    G.add(nose);
  }
  const pin = mesh(latheAxis([[.035, .87], [.03, .9], [.0, .905]], 'x', 24).translate(0, cy, 0), steel); G.add(pin);

  /* barrel: tube, ventilated top rib, full underlug, ramp front sight */
  const by = 1.0;
  G.add(mesh(latheAxis([[.09, .9], [.085, .92], [.085, 1.9], [.08, 1.92], [.03, 1.922]], 'x', 64).translate(0, by, 0), steel));
  const crown = mesh(new THREE.CircleGeometry(.03, 24), GM.dark); crown.rotation.y = Math.PI / 2; crown.position.set(1.923, by, 0); G.add(crown);
  G.add(slab([[.9, 1.0], [1.92, 1.0], [1.92, .86], [1.88, .82], [.98, .82], [.9, .86]], .15, steel, { bevel: .015, segs: 3 }));
  const rodEnd = mesh(new THREE.CircleGeometry(.022, 20), GM.dark); rodEnd.rotation.y = Math.PI / 2; rodEnd.position.set(1.936, .885, 0); G.add(rodEnd);
  const rib = mesh(new RoundedBoxGeometry(.98, .045, .1, 2, .012), steel); rib.position.set(1.42, 1.09, 0); G.add(rib);
  G.add(grooves(.96, 1.88, 46, 1.113, .004, 0, { w: .008, d: .09, mat: new THREE.MeshStandardMaterial({ color: 0x5c6168, metalness: .9, roughness: .5 }) }));
  G.add(slab([[1.72, 1.1], [1.9, 1.1], [1.9, 1.17], [1.87, 1.185]], .05, steel, { bevel: .004 }));
  const insert = mesh(new THREE.BoxGeometry(.03, .06, .052), new THREE.MeshStandardMaterial({ color: 0xd01e1e, emissive: 0x400000, roughness: .3 })); insert.position.set(1.88, 1.15, 0); G.add(insert);

  /* rear sight, hammer, trigger, cylinder release */
  const rs = mesh(new RoundedBoxGeometry(.2, .06, .16, 2, .015), GM.blued); rs.position.set(.4, 1.14, 0); G.add(rs);
  const rn = mesh(new THREE.BoxGeometry(.21, .04, .035), GM.dark); rn.position.set(.4, 1.16, 0); G.add(rn);
  const adj = mesh(new THREE.CylinderGeometry(.018, .018, .02, 16), GM.blued); adj.rotation.x = Math.PI / 2; adj.position.set(.42, 1.13, .085); G.add(adj);
  const hammer = [[.27, .98], [.33, 1.06], [.31, 1.12], [.24, 1.17], [.12, 1.19], [.09, 1.16], [.18, 1.11], [.21, 1.0]];
  G.add(slab(hammer, .1, steel, { bevel: .01 }));
  const spur = slab([[.1, 1.17], [.22, 1.16], [.22, 1.175], [.12, 1.195]], .1, HM.knurled(0xbcc1c7, [10, 2]), { bevel: .008 }); G.add(spur);
  const tp = curve([V(.655, .64, 0), V(.68, .55, 0), V(.665, .49, 0), V(.62, .46, 0)], 30);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .1, thick: .04, round: 3 }), steel));
  const latch = slab([[.3, .93], [.43, .93], [.43, .985], [.3, .985]], .03, steel, { z: -.165, bevel: .006 }); G.add(latch);
  G.add(grooves(.32, .41, 6, .957, .045, -.183, { w: .008, d: .005 }));

  /* checkered walnut grips with medallions */
  const grip = new THREE.Shape();
  grip.moveTo(.47, .64); grip.quadraticCurveTo(.5, .44, .45, .26); grip.quadraticCurveTo(.42, .1, .38, .0);
  grip.quadraticCurveTo(.3, -.1, .17, -.08); grip.quadraticCurveTo(.05, -.05, .05, .08);
  grip.quadraticCurveTo(.06, .36, .14, .56); grip.quadraticCurveTo(.2, .74, .32, .74); grip.quadraticCurveTo(.42, .74, .47, .64);
  const wood = HM.wood([120, 62, 32], [1.5, 1]);
  wood.bumpMap = HM.knurled().bumpMap.clone(); wood.bumpMap.repeat.set(4, 4); wood.bumpMap.needsUpdate = true; wood.bumpScale = 2;
  G.add(slab(grip, .32, wood, { bevel: .045, segs: 6, curve: 32 }));
  for (const s of [1, -1]) {
    const md = mesh(new THREE.CylinderGeometry(.045, .045, .01, 32), steel); md.rotation.x = Math.PI / 2; md.position.set(.27, .5, s * .21); G.add(md);
  }

  /* markings */
  const m1 = label([['.357 MAGNUM CTG', .8]], .5, .04, { color: '#6b7076', metal: .7, rough: .3 });
  m1.position.set(1.4, .91, .087); G.add(m1);
  const m2 = label([['LV ARMS · MODEL 4', .8]], .5, .04, { color: '#6b7076', metal: .7, rough: .3 });
  m2.position.set(1.4, .91, -.087); m2.rotation.y = Math.PI; G.add(m2);
  return G;
}
