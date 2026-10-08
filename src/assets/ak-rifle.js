// AKM-pattern 7.62×39 mm rifle (display prop): stamped receiver with ribbed dust cover and
// rivets, selector lever, charging handle and ejection port, tangent rear sight, 30-round
// ribbed steel magazine, bakelite pistol grip, laminated wood stock and handguards with steel
// ferrules, gas tube and block, hooded front sight with bayonet lug, cleaning rod, slant brake.
// x toward the muzzle, y up, z to the right; bore on y = 0.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, curve, freeFrames, sweepGeo, latheAxis, label, HM, GM, slab, grooves } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const steel = GM.park, blk = GM.nitride;
  const wood = HM.wood([150, 72, 38], [1, .6]);
  const bake = new THREE.MeshPhysicalMaterial({ color: 0x5a2416, roughness: .45, clearcoat: .5, clearcoatRoughness: .3 });

  /* receiver */
  const rec = mesh(new RoundedBoxGeometry(2.6, .52, .25, 3, .025), steel); rec.position.set(-.15, -.06, 0); G.add(rec);
  const cover = mesh(new RoundedBoxGeometry(2.36, .16, .245, 4, .07), steel); cover.position.set(-.26, .25, 0); G.add(cover);
  for (const x of [-1.05, -.75, -.45]) { const r = mesh(new RoundedBoxGeometry(.05, .03, .25, 2, .012), steel); r.position.set(x, .325, 0); G.add(r); }
  const tab = mesh(new RoundedBoxGeometry(.08, .05, .1, 2, .015), steel); tab.position.set(-1.45, .26, 0); G.add(tab);
  const trun = mesh(new RoundedBoxGeometry(.22, .4, .23, 3, .03), steel); trun.position.set(1.25, -.04, 0); G.add(trun);
  // rivets, both sides
  for (const s of [1, -1]) for (const [x, y] of [[-1.3, -.12], [-1.3, -.24], [-1.15, -.24], [.72, -.22], [.88, -.22], [1.05, -.1], [1.05, -.22], [1.2, -.12], [1.2, -.22]]) {
    const rv = mesh(new THREE.SphereGeometry(.022, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2), steel);
    rv.scale.y = .45; rv.rotation.x = s * Math.PI / 2; rv.position.set(x, y, s * .127); G.add(rv);
  }
  // ejection port with bolt carrier inside, charging handle
  const port = mesh(new THREE.BoxGeometry(.6, .13, .006), GM.dark); port.position.set(.45, .12, .128); G.add(port);
  const carrier = mesh(new THREE.BoxGeometry(.56, .08, .004), GM.blued); carrier.position.set(.45, .13, .131); G.add(carrier);
  const ch = mesh(new THREE.CylinderGeometry(.03, .035, .2, 16), GM.blued); ch.rotation.x = Math.PI / 2; ch.position.set(.95, .14, .22); G.add(ch);
  const knob = mesh(new THREE.SphereGeometry(.05, 20, 14), GM.blued); knob.scale.set(1, 1, .8); knob.position.set(.95, .14, .33); G.add(knob);
  // selector lever on the right
  G.add(slab([[-.78, .03], [.44, .04], [.5, .0], [.52, -.1], [.42, -.12], [.4, .0], [-.66, .11], [-.78, .15]], .02, steel, { z: .14, bevel: .006 }));
  const lt = label([['АВ  ОД', .8, 700]], .3, .06, { color: '#d9d9d6' }); lt.position.set(.25, -.12, .128); G.add(lt);

  /* tangent rear sight */
  const rsb = mesh(new RoundedBoxGeometry(.42, .16, .2, 2, .03), steel); rsb.position.set(1.17, .26, 0); G.add(rsb);
  const leaf = mesh(new RoundedBoxGeometry(.46, .025, .11, 2, .008), steel); leaf.position.set(1.12, .35, 0); leaf.rotation.z = .05; G.add(leaf);
  const slider = mesh(new RoundedBoxGeometry(.07, .05, .14, 2, .012), steel); slider.position.set(1.05, .36, 0); G.add(slider);
  const rnotch = mesh(new THREE.BoxGeometry(.03, .03, .025), GM.dark); rnotch.position.set(.9, .375, 0); G.add(rnotch);
  const scale = label([['1 2 3 4 5 6 7 8 9 10', .8, 600]], .38, .03, { color: '#d6d6d0' }); scale.position.set(1.14, .365, .0); scale.rotation.x = -Math.PI / 2; G.add(scale);

  /* fire control: trigger guard, trigger, pistol grip */
  G.add(slab([[-.05, -.3], [-.05, -.62], [-.12, -.66], [-.55, -.66], [-.58, -.62], [-.58, -.3], [-.52, -.3], [-.52, -.6], [-.11, -.6], [-.11, -.3]], .07, steel, { bevel: .008 }));
  const tp = curve([V(-.28, -.33, 0), V(-.25, -.43, 0), V(-.27, -.52, 0), V(-.33, -.57, 0)], 24);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .06, thick: .04, round: 3 }), steel));
  const grip = [[-.58, -.3], [-.62, -.3], [-.66, -.42], [-.76, -.96], [-.74, -1.06], [-.6, -1.12], [-.48, -1.08], [-.44, -1.0], [-.42, -.82], [-.4, -.62], [-.42, -.5], [-.46, -.4], [-.44, -.32]];
  G.add(slab(grip, .24, bake, { bevel: .045, segs: 5 }));
  G.add(grooves(-.73, -.47, 1, -.7, .5, .168, { w: .26, d: .004, mat: GM.stipple(0x4a1d12), tilt: .22 }));

  /* 30-round magazine: curved, three stamped ribs each side, floor plate */
  const mc = curve([V(.28, -.25, 0), V(.34, -.9, 0), V(.62, -1.65, 0), V(1.02, -2.25, 0)], 120);
  const nrm = arr => i => { const t = arr[Math.min(arr.length - 1, i + 1)].clone().sub(arr[Math.max(0, i - 1)]); return V(-t.y, t.x, 0); };
  const MF = freeFrames(mc, V(0, 0, 1), nrm(mc));
  G.add(mesh(sweepGeo(MF, { center: true, round: 6, P: 24, width: .23, widthFn: () => .23, thickFn: u => .56 - .06 * u }), steel));
  for (const off of [-.15, 0, .15]) {
    const rp = mc.map((p, i) => p.clone().addScaledVector(MF[i].normal, off));
    const RF = freeFrames(rp.slice(8, -6), V(0, 0, 1), nrm(rp.slice(8, -6)));
    G.add(mesh(sweepGeo(RF, { center: true, round: 3, P: 16, width: .25, thick: .045 }), steel));
  }
  const floor = mesh(new RoundedBoxGeometry(.6, .06, .27, 2, .02), steel);
  floor.position.copy(mc[mc.length - 1]); floor.rotation.z = Math.atan2(MF[MF.length - 1].tangent.y, MF[MF.length - 1].tangent.x) + Math.PI / 2; G.add(floor);

  /* stock: laminated wood with steel buttplate and tang straps */
  const stock = [[-1.4, .12], [-1.4, -.26], [-2.0, -.42], [-4.3, -1.02], [-4.42, -1.0], [-4.42, -.1], [-3.2, -.03], [-1.9, .08]];
  G.add(slab(stock, .3, wood, { bevel: .05, segs: 6, curve: 24 }));
  G.add(slab([[-4.42, -.07], [-4.48, -.07], [-4.48, -1.04], [-4.42, -1.04]], .38, steel, { bevel: .012 }));
  const trap = mesh(new THREE.BoxGeometry(.004, .16, .22), GM.dark); trap.position.set(-4.495, -.55, 0); G.add(trap);
  for (const y of [.15, -.3]) G.add(slab([[-1.4, y], [-1.95, y - .02], [-1.95, y - .055], [-1.4, y - .035]], .1, steel, { bevel: .006 }));
  const sw = mesh(new THREE.TorusGeometry(.06, .012, 8, 24), steel); sw.position.set(-2.7, -.65, -.2); sw.rotation.y = Math.PI / 2; G.add(sw);

  /* barrel, handguards, gas system, sights, brake */
  G.add(mesh(latheAxis([[.11, 1.15], [.1, 1.35], [.085, 1.6], [.078, 3.4], [.07, 4.6], [.068, 5.2]], 'x', 48), blk));
  const lower = curve([V(1.36, -.04, 0), V(3.12, -.04, 0)], 40);
  G.add(mesh(sweepGeo(freeFrames(lower, V(0, 0, 1), V(0, 1, 0)), { center: true, round: 2.4, P: 32, width: .34, widthFn: u => .32 + .05 * Math.sin(Math.PI * u) - .03 * Math.max(0, Math.sin(u * Math.PI * 7)) * (u > .15 && u < .85 ? 1 : 0), thickFn: () => .34 }), wood));
  const upper = curve([V(1.45, .2, 0), V(3.14, .2, 0)], 30);
  G.add(mesh(sweepGeo(freeFrames(upper, V(0, 0, 1), V(0, 1, 0)), { center: true, round: 2.6, P: 32, width: .24, thick: .17 }), wood));
  for (const x of [1.36, 3.13]) G.add(mesh(latheAxis([[.2, x - .035], [.205, x], [.2, x + .035]], 'x', 48).translate(0, -.04, 0), steel));
  G.add(mesh(latheAxis([[.055, 3.1], [.055, 3.45]], 'x', 24).translate(0, .2, 0), steel));
  const gb = mesh(new RoundedBoxGeometry(.34, .38, .18, 3, .04), steel); gb.position.set(3.58, .08, 0); G.add(gb);
  const fl = mesh(new THREE.TorusGeometry(.06, .015, 8, 24), steel); fl.position.set(3.58, -.16, 0); G.add(fl);
  const fsb = mesh(latheAxis([[.1, 4.65], [.11, 4.68], [.11, 4.92], [.1, 4.95]], 'x', 40), steel); G.add(fsb);
  for (const s of [1, -1]) G.add(slab([[4.7, .05], [4.9, .05], [4.9, .44], [4.82, .48], [4.78, .44], [4.78, .12], [4.7, .12]], .035, steel, { z: s * .07, bevel: .006 }));
  const post = mesh(new THREE.CylinderGeometry(.013, .02, .3, 12), steel); post.position.set(4.8, .25, 0); G.add(post);
  const lug = mesh(new RoundedBoxGeometry(.2, .1, .1, 2, .02), steel); lug.position.set(4.82, -.14, 0); G.add(lug);
  G.add(mesh(latheAxis([[.02, 2.0], [.02, 4.95]], 'x', 12).translate(0, -.15, 0), steel));
  G.add(mesh(latheAxis([[.09, 5.2], [.09, 5.48], [.08, 5.52]], 'x', 40), blk));
  G.add(slab([[5.3, .0], [5.52, .0], [5.52, .1], [5.38, .1]], .07, GM.dark, { bevel: 0, z: 0 }).translateY(.0));
  const bore = mesh(new THREE.CircleGeometry(.035, 24), GM.dark); bore.rotation.y = Math.PI / 2; bore.position.set(5.522, 0, 0); G.add(bore);
  return G;
}
