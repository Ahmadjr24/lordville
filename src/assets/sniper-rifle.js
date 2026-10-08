// .308 bolt-action precision rifle (display prop): round action with tactical bolt knob,
// fluted heavy barrel and ported muzzle brake, stippled flat-dark-earth synthetic stock with
// vertical grip, adjustable cheek riser and recoil pad, Picatinny rail, 5–25×56 riflescope
// with turrets, illumination dial, side focus, throw lever, sunshade and coated lenses, in two
// rings; deployed bipod. x toward the muzzle, y up, z right; bore on y = 0.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, curve, freeFrames, sweepGeo, latheAxis, label, HM, GM, slab, grooves, picatinny } from '../kit.js';

function turret(h, r, mat, txt) {
  const T = new THREE.Group();
  T.add(mesh(latheAxis([[r * .8, 0], [r * .8, h * .35], [r, h * .38], [r, h * .95], [r * .9, h], [0, h]], 'y', 48), mat));
  const lb = label([[txt, .8, 600]], r * 1.6, r * .9, { color: '#e8e8e4', align: 'center' });
  lb.rotation.x = -Math.PI / 2; lb.position.y = h + .002; T.add(lb);
  // engraved click marks around the cap
  const ticks = new THREE.InstancedMesh(new THREE.BoxGeometry(.006, h * .3, .02), GM.white, 40), m = new THREE.Matrix4();
  for (let k = 0; k < 40; k++) { const a = k / 40 * Math.PI * 2; m.compose(V(Math.cos(a) * (r + .001), h * .8, Math.sin(a) * (r + .001)), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), -a), V(1, k % 5 ? .5 : 1, 1)); ticks.setMatrixAt(k, m); }
  T.add(ticks);
  return T;
}

export function build() {
  const G = new THREE.Group();
  const fde = GM.cerakote(0x8c7a5b, 6);
  const scopeMat = new THREE.MeshPhysicalMaterial({ color: 0x1b1c1e, metalness: .6, roughness: .42, clearcoat: .2 });

  /* stock */
  const stock = [[4.25, -.12], [4.2, -.38], [3.9, -.44], [1.1, -.46], [.25, -.46], [-.05, -.48], [-.18, -.62], [-.36, -1.2], [-.5, -1.27], [-.86, -1.22], [-.8, -1.05], [-.65, -.62],
    [-1.3, -.55], [-2.1, -.78], [-4.45, -1.02], [-4.5, -.98], [-4.5, .08], [-3.0, .12], [-2.9, .02], [-1.5, -.02], [-.95, -.12], [-.8, -.12], [3.9, -.12]];
  G.add(slab(stock, .44, fde, { bevel: .07, segs: 6, curve: 24 }));
  for (const s of [1, -1]) {
    G.add(grooves(-.78, -.3, 1, -.85, .45, s * .292, { w: .32, d: .004, mat: GM.stipple(0x7d6c4f), tilt: .3 }));
    G.add(grooves(1.6, 3.6, 1, -.3, .2, s * .292, { w: 2.0, d: .004, mat: GM.stipple(0x7d6c4f) }));
  }
  // adjustable cheek riser on the comb, with its two posts and knobs
  const riser = mesh(new RoundedBoxGeometry(1.25, .18, .4, 4, .08), fde); riser.position.set(-2.55, .2, 0); G.add(riser);
  for (const x of [-2.9, -2.2]) {
    const p = mesh(new THREE.CylinderGeometry(.03, .03, .2, 16), GM.nitride); p.position.set(x, .06, 0); G.add(p);
    const k = mesh(new THREE.CylinderGeometry(.05, .05, .06, 18), HM.knurled()); k.rotation.x = Math.PI / 2; k.position.set(x, .14, .25); G.add(k);
  }
  // recoil pad, sling studs, magazine and trigger guard
  G.add(slab([[-4.5, .1], [-4.72, .1], [-4.74, .0], [-4.74, -.98], [-4.72, -1.06], [-4.5, -1.06]], .46, HM.rubber, { bevel: .03, segs: 4 }));
  for (const x of [-3.9, 3.3]) { const st = mesh(new THREE.TorusGeometry(.05, .014, 8, 20), GM.nitride); st.position.set(x, x < 0 ? -.98 : -.5, 0); G.add(st); }
  G.add(slab([[.6, -.46], [.6, -.62], [.12, -.62], [.12, -.46]], .26, GM.nitride, { bevel: .015 }));
  G.add(slab([[.05, -.47], [.05, -.75], [-.02, -.8], [-.4, -.8], [-.42, -.72], [-.42, -.6], [-.34, -.6], [-.34, -.73], [-.03, -.73], [-.03, -.47]], .1, GM.nitride, { bevel: .01 }));
  const tp = curve([V(-.16, -.5, 0), V(-.14, -.6, 0), V(-.17, -.68, 0)], 20);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .05, thick: .035, round: 3 }), GM.nitride));

  /* action, bolt, rail */
  G.add(mesh(latheAxis([[.0, -.95], [.12, -.94], [.16, -.88], [.17, -.62], [.18, -.6], [.18, 2.0], [.16, 2.05]], 'x', 64), GM.nitride));
  const port = mesh(new THREE.BoxGeometry(.7, .14, .02), GM.dark); port.position.set(.75, .08, .165); port.rotation.x = -.35; G.add(port);
  const bp = curve([V(-.25, .05, .12), V(-.25, .0, .3), V(-.32, -.12, .44)], 24);
  G.add(mesh(sweepGeo(freeFrames(bp, V(1, 0, 0), V(0, 1, 0)), { center: true, width: .055, thick: .055, round: 2 }), GM.nitride));
  const bk = mesh(new THREE.SphereGeometry(.1, 24, 18), GM.polymer); bk.scale.set(1, 1, 1.15); bk.position.set(-.33, -.15, .5); G.add(bk);
  G.add(grooves(-.4, -.26, 6, -.15, .02, .6, { w: .01, d: .1, mat: GM.dark }));
  const rail = picatinny(2.6, GM.nitride); rail.position.set(-.55, .18, 0); G.add(rail);

  /* fluted heavy barrel + muzzle brake */
  G.add(mesh(latheAxis([[.15, 2.0], [.15, 2.3], [.13, 3.0], [.11, 8.5]], 'x', 64), GM.nitride));
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2, f = mesh(new RoundedBoxGeometry(4.6, .03, .03, 2, .012), GM.dark);
    f.position.set(5.6, Math.sin(a) * .118, Math.cos(a) * .118); f.rotation.x = -a; G.add(f);
  }
  G.add(mesh(latheAxis([[.13, 8.5], [.14, 8.52], [.14, 9.15], [.12, 9.2], [.04, 9.2]], 'x', 48), GM.nitride));
  for (const x of [8.65, 8.8, 8.95]) for (const s of [1, -1]) { const p = mesh(new THREE.BoxGeometry(.08, .1, .02), GM.dark); p.position.set(x, 0, s * .137); G.add(p); }

  /* bipod, deployed */
  const bb = mesh(new RoundedBoxGeometry(.3, .14, .32, 3, .04), GM.nitride); bb.position.set(3.75, -.52, 0); G.add(bb);
  for (const s of [1, -1]) {
    const leg = curve([V(3.75, -.55, s * .12), V(3.95, -1.2, s * .3), V(4.1, -1.75, s * .42)], 20);
    G.add(mesh(sweepGeo(freeFrames(leg, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .07, thick: .07, round: 2 }), GM.nitride));
    const ext = curve([V(3.98, -1.25, s * .31), V(4.12, -1.82, s * .43)], 10);
    G.add(mesh(sweepGeo(freeFrames(ext, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .05, thick: .05, round: 2 }), GM.stainless));
    const foot = mesh(new THREE.SphereGeometry(.07, 18, 12), HM.rubber); foot.scale.set(1.2, .7, 1.2); foot.position.set(4.13, -1.86, s * .44); G.add(foot);
  }

  /* riflescope */
  const sy = .62;
  const S = new THREE.Group(); S.position.y = sy; G.add(S);
  S.add(mesh(latheAxis([[.15, -.6], [.15, 2.0]], 'x', 64), scopeMat));
  S.add(mesh(latheAxis([[.15, 2.0], [.17, 2.15], [.28, 2.55], [.29, 2.6], [.29, 3.1], [.27, 3.12]], 'x', 64), scopeMat));
  S.add(mesh(latheAxis([[.27, 3.12], [.275, 3.13], [.275, 3.7], [.265, 3.72], [.25, 3.72]], 'x', 64), scopeMat));
  S.add(mesh(latheAxis([[.25, 3.7], [.25, 3.715]], 'x', 64), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, side: THREE.BackSide })));
  const coat = new THREE.MeshPhysicalMaterial({ color: 0x03070a, metalness: .05, roughness: .04, envMapIntensity: .35, iridescence: .7, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700], clearcoat: 1 });
  const obj = mesh(new THREE.CircleGeometry(.245, 48), coat); obj.rotation.y = Math.PI / 2; obj.position.x = 3.2; S.add(obj);
  S.add(mesh(latheAxis([[.15, -.6], [.17, -.7], [.21, -.9], [.215, -1.1], [.205, -1.22], [.19, -1.24]], 'x', 64), scopeMat));
  S.add(mesh(latheAxis([[.218, -.95], [.218, -1.1]], 'x', 64), HM.knurled(0x1b1c1e, [30, 1])));
  const ocu = mesh(new THREE.CircleGeometry(.17, 40), coat); ocu.rotation.y = -Math.PI / 2; ocu.position.x = -1.22; S.add(ocu);
  const eyeR = mesh(new THREE.TorusGeometry(.19, .025, 10, 48), HM.rubber); eyeR.rotation.y = Math.PI / 2; eyeR.position.x = -1.24; S.add(eyeR);
  S.add(mesh(latheAxis([[.165, -.4], [.175, -.38], [.175, -.15], [.165, -.13]], 'x', 64), HM.knurled(0x1b1c1e, [40, 1])));
  const lever = mesh(new RoundedBoxGeometry(.06, .14, .05, 2, .02), scopeMat); lever.position.set(-.26, .22, 0); S.add(lever);
  const saddle = mesh(new RoundedBoxGeometry(.56, .3, .4, 4, .1), scopeMat); saddle.position.set(.85, 0, 0); S.add(saddle);
  const el = turret(.2, .13, scopeMat, '0'); el.position.set(.85, .13, 0); S.add(el);
  const wd = turret(.17, .12, scopeMat, 'R'); wd.rotation.x = Math.PI / 2; wd.position.set(.85, 0, .18); S.add(wd);
  const sf = turret(.15, .14, scopeMat, '∞'); sf.rotation.x = -Math.PI / 2; sf.position.set(.85, 0, -.18); S.add(sf);
  const ill = mesh(latheAxis([[.07, 0], [.07, .07], [.0, .075]], 'y', 24), scopeMat); ill.rotation.x = -Math.PI / 2; ill.position.set(.85, 0, -.32); S.add(ill);
  const sm = label([['5–25×56  FFP  MRAD', .8, 600]], .8, .05, { color: '#d9d9d6' }); sm.position.set(1.55, .03, .152); sm.rotation.y = 0; S.add(sm);
  // rings on the rail
  for (const x of [-.25, 1.6]) {
    S.add(mesh(new THREE.TorusGeometry(.17, .035, 12, 40), GM.nitride).rotateY(Math.PI / 2).translateZ(x));
    const base = mesh(new RoundedBoxGeometry(.2, .32, .26, 3, .04), GM.nitride); base.position.set(x, -.27, 0); S.add(base);
    const cap = mesh(new RoundedBoxGeometry(.16, .06, .3, 2, .02), GM.nitride); cap.position.set(x, .18, 0); S.add(cap);
    for (const s of [1, -1]) { const b = mesh(new THREE.CylinderGeometry(.022, .022, .02, 6), GM.dark); b.rotation.x = Math.PI / 2; b.position.set(x, .12, s * .2); S.add(b); }
    const nut = mesh(new THREE.CylinderGeometry(.045, .045, .05, 6), GM.nitride); nut.rotation.x = Math.PI / 2; nut.position.set(x, -.34, .16); S.add(nut);
  }
  return G;
}
