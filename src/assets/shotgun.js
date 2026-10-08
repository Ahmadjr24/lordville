// 12-gauge pump-action shotgun, 20" barrel (display prop): blued receiver with ejection port,
// visible bolt and loading port, vent-ribbed barrel with brass bead, magazine tube and cap,
// ribbed walnut forend on twin action bars, cross-bolt safety, checkered walnut stock with a
// ventilated rubber recoil pad and spacer, sling swivels. x toward the muzzle, bore on y = 0.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, curve, freeFrames, sweepGeo, latheAxis, label, HM, GM, slab, grooves } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const blue = GM.blued;
  const walnut = HM.wood([128, 66, 34], [1, .5]);

  /* receiver */
  const rec = [[0, .2], [.06, .26], [2.25, .26], [2.4, .2], [2.4, -.26], [2.2, -.4], [.3, -.4], [0, -.32]];
  G.add(slab(rec, .3, blue, { bevel: .02, segs: 4 }));
  // ejection port with bolt face, loading port below
  const port = mesh(new THREE.BoxGeometry(.78, .2, .006), GM.dark); port.position.set(1.5, .05, .171); G.add(port);
  const bolt = mesh(new RoundedBoxGeometry(.5, .14, .02, 2, .01), HM.chrome); bolt.position.set(1.32, .05, .162); G.add(bolt);
  G.add(grooves(1.12, 1.52, 9, .05, .1, .173, { w: .012, d: .004 }));
  const lport = mesh(new THREE.BoxGeometry(.9, .006, .2), GM.dark); lport.position.set(1.4, -.423, 0); G.add(lport);
  const elev = mesh(new THREE.BoxGeometry(.8, .005, .16), GM.blued); elev.position.set(1.4, -.41, 0); G.add(elev);
  // trigger guard group with cross-bolt safety and slide release
  G.add(slab([[1.0, -.4], [1.0, -.7], [.92, -.76], [.4, -.76], [.34, -.7], [.32, -.4], [.4, -.4], [.42, -.68], [.9, -.68], [.92, -.4]], .16, GM.nitride, { bevel: .012 }));
  const tp = curve([V(.62, -.42, 0), V(.66, -.52, 0), V(.62, -.62, 0), V(.56, -.66, 0)], 24);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .06, thick: .04, round: 3 }), GM.nitride));
  const safety = mesh(new THREE.CylinderGeometry(.035, .035, .2, 20), GM.nitride); safety.rotation.x = Math.PI / 2; safety.position.set(.38, -.48, .03); G.add(safety);
  const ring = mesh(new THREE.TorusGeometry(.036, .006, 8, 20), new THREE.MeshStandardMaterial({ color: 0xc81e1e })); ring.position.set(.38, -.48, .12); G.add(ring);
  G.add(slab([[.95, -.45], [1.12, -.45], [1.14, -.5], [.95, -.52]], .03, GM.nitride, { z: -.17, bevel: .006 }));
  const mk = label([['LV ARMS  MODEL 12', .6], ['12 GA · 3" CHAMBER', .45, 600]], .9, .14, { color: '#8a8f97', metal: .7, rough: .3 });
  mk.position.set(1.05, -.2, -.171); mk.rotation.y = Math.PI; G.add(mk);

  /* barrel with vent rib and bead; magazine tube and cap */
  G.add(mesh(latheAxis([[.13, 2.4], [.12, 2.6], [.105, 3.0], [.1, 7.4], [.105, 7.44], [.06, 7.45]], 'x', 64), blue));
  const bore = mesh(new THREE.CircleGeometry(.08, 32), GM.dark); bore.rotation.y = Math.PI / 2; bore.position.set(7.451, 0, 0); G.add(bore);
  const rib = mesh(new RoundedBoxGeometry(4.9, .02, .085, 2, .006), blue); rib.position.set(4.95, .15, 0); G.add(rib);
  const posts = new THREE.InstancedMesh(new THREE.BoxGeometry(.035, .05, .06), blue, 30), m = new THREE.Matrix4();
  for (let i = 0; i < 30; i++) { m.makeTranslation(2.6 + i * .165, .12, 0); posts.setMatrixAt(i, m); } G.add(posts);
  const bead = mesh(new THREE.SphereGeometry(.03, 16, 12), HM.brass); bead.position.set(7.36, .19, 0); G.add(bead);
  const my = -.22;
  G.add(mesh(latheAxis([[.1, 2.4], [.1, 6.3]], 'x', 48).translate(0, my, 0), blue));
  G.add(mesh(latheAxis([[.11, 6.3], [.115, 6.33], [.115, 6.6], [.1, 6.66], [.04, 6.68]], 'x', 48).translate(0, my, 0), HM.knurled(0x161a22, [24, 1])));
  const clamp = mesh(new RoundedBoxGeometry(.14, .4, .2, 3, .04), blue); clamp.position.set(6.2, -.1, 0); G.add(clamp);
  const fsw = mesh(new THREE.TorusGeometry(.06, .014, 8, 24), blue); fsw.position.set(6.5, -.37, 0); G.add(fsw);

  /* forend: ribbed walnut on twin action bars */
  for (const s of [1, -1]) { const bar = mesh(new THREE.BoxGeometry(2.1, .03, .02), GM.nitride); bar.position.set(2.5, my - .02, s * .12); G.add(bar); }
  const fe = curve([V(3.0, my - .03, 0), V(5.0, my - .03, 0)], 50);
  const groove = u => (u > .1 && u < .9 ? .025 * Math.max(0, Math.sin((u - .1) / .8 * Math.PI * 9)) : 0);
  G.add(mesh(sweepGeo(freeFrames(fe, V(0, 0, 1), V(0, 1, 0)), { center: true, round: 2.3, P: 36, width: .44,
    widthFn: u => .4 + .05 * smooth(0, .1, u) * smooth(1, .9, u) - 1.4 * groove(u), thickFn: u => .4 + .04 * smooth(0, .1, u) * smooth(1, .9, u) - 1.4 * groove(u) }), walnut));

  /* stock: checkered pistol grip, comb, recoil pad with white-line spacer */
  const stock = [[0, .24], [0, -.36], [-.35, -.44], [-.6, -.66], [-.72, -.78], [-.86, -.76], [-.88, -.62], [-1.2, -.66], [-3.6, -1.8], [-3.6, -.55], [-2.4, -.25], [-.8, .12]];
  G.add(slab(stock, .36, walnut, { bevel: .055, segs: 6, curve: 32 }));
  for (const s of [1, -1]) G.add(grooves(-.66, -.3, 1, -.48, .3, s * .235, { w: .3, d: .004, mat: (() => { const w = walnut.clone(); w.bumpMap = HM.knurled().bumpMap.clone(); w.bumpMap.repeat.set(6, 6); w.bumpMap.needsUpdate = true; w.bumpScale = 3; return w; })(), tilt: .5 }));
  G.add(slab([[-3.6, -.53], [-3.63, -.53], [-3.63, -1.82], [-3.6, -1.82]], .46, GM.white, { bevel: .006 }));
  const pad = slab([[-3.63, -.52], [-3.9, -.53], [-3.92, -.6], [-3.92, -1.76], [-3.9, -1.84], [-3.63, -1.84]], .46, HM.rubber, { bevel: .03, segs: 4 });
  G.add(pad);
  for (const s of [1, -1]) G.add(grooves(-3.85, -3.7, 3, -1.18, .9, s * .26, { w: .025, d: .006 }));
  const rsw = mesh(new THREE.TorusGeometry(.06, .014, 8, 24), blue); rsw.position.set(-2.9, -1.48, 0); G.add(rsw);
  return G;
}
