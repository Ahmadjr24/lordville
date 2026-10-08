// 18 V cordless drill/driver: teal and black housing with rear vents, 2-speed selector,
// numbered clutch collar, keyless chuck with a bit, rubber-gripped handle, trigger and
// direction switch, work light, battery pack with charge gauge. Stands on its battery.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, curve, freeFrames, sweepGeo, latheAxis, label, HM } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const teal = HM.plastic(0x167a78, .4), black = HM.plastic(0x1b1c1d, .5);
  const hy = 1.62; // motor axis height

  /* battery pack */
  const bat = mesh(new RoundedBoxGeometry(1.15, .3, .8, 4, .07), black); bat.position.set(-.08, .15, 0); G.add(bat);
  const batTop = mesh(new RoundedBoxGeometry(1.0, .16, .66, 4, .05), teal); batTop.position.set(-.06, .36, 0); G.add(batTop);
  for (let k = 0; k < 3; k++) {
    const led = mesh(new THREE.BoxGeometry(.012, .03, .06), new THREE.MeshStandardMaterial({ color: 0x1a3a12, emissive: k < 2 ? 0x46e04a : 0x000000, emissiveIntensity: .9 }));
    led.position.set(-.656, .2, -.1 + k * .1); G.add(led);
  }
  const blb = label([['18V', .8]], .26, .1, { color: '#e9ecef' }); blb.position.set(-.05, .16, .401); G.add(blb);
  const rel = mesh(new RoundedBoxGeometry(.18, .06, .2, 2, .02), black); rel.position.set(.5, .33, 0); G.add(rel);
  // work light on the foot
  const light = mesh(new THREE.CircleGeometry(.035, 24), new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff2cc, emissiveIntensity: .7 }));
  light.position.set(.442, .38, 0); light.rotation.y = Math.PI / 2; G.add(light);

  /* handle: rubber over-mould swept up to the motor housing */
  const hp = curve([V(.02, .38, 0), V(.0, .8, 0), V(-.06, 1.2, 0), V(-.08, 1.5, 0)], 60);
  const HF = freeFrames(hp, V(0, 0, 1), V(1, 0, 0));
  const hw = u => .36 + .04 * Math.sin(Math.PI * u) + .08 * smooth(.15, 0, u);
  G.add(mesh(sweepGeo(HF, { center: true, round: 2.6, P: 32, width: .4, widthFn: hw, thickFn: u => .5 + .1 * smooth(.2, 0, u) + .06 * smooth(.8, 1, u) }), HM.rubber));
  // teal spine down the front of the handle
  const sp = curve([V(.22, .45, 0), V(.2, .9, 0), V(.16, 1.3, 0)], 30);
  G.add(mesh(sweepGeo(freeFrames(sp, V(0, 0, 1), V(1, 0, 0)), { center: true, round: 3, P: 24, width: .3, thick: .1 }), teal));
  // trigger and direction switch
  const trig = mesh(new RoundedBoxGeometry(.16, .3, .18, 3, .05), black); trig.position.set(.27, 1.17, 0); trig.rotation.z = -.1; G.add(trig);
  const dir = mesh(new RoundedBoxGeometry(.08, .07, .5, 2, .025), HM.plastic(0xc3141c, .45)); dir.position.set(.12, 1.42, 0); G.add(dir);

  /* motor housing, vents, speed selector */
  G.add(mesh(latheAxis([[0, -.66], [.16, -.655], [.24, -.6], [.29, -.48], [.31, -.3], [.31, .26], [.29, .42], [.26, .52]], 'x', 72).translate(0, hy, 0), teal));
  const cap = mesh(latheAxis([[0, -.68], [.18, -.672], [.25, -.62], [.27, -.55]], 'x', 64).translate(0, hy, 0), black); G.add(cap);
  for (const s of [1, -1]) for (let k = 0; k < 6; k++) {
    const v = mesh(new RoundedBoxGeometry(.24, .025, .02, 2, .008), new THREE.MeshStandardMaterial({ color: 0x050505, roughness: .9 }));
    v.position.set(-.4, hy - .12 + k * .05, s * .298); G.add(v);
  }
  const sel = mesh(new RoundedBoxGeometry(.18, .06, .1, 2, .025), black); sel.position.set(-.05, hy + .32, 0); G.add(sel);
  const sl = label([['1    2', .8]], .26, .05, { color: '#e9ecef', align: 'center' }); sl.position.set(-.05, hy + .312, .0); sl.rotation.x = -Math.PI / 2; sl.position.z = .09; G.add(sl);
  const lb = label([['LV-DD18', .65], ['BRUSHLESS', .45, 600]], .42, .12, { color: '#e9ecef' }); lb.position.set(-.05, hy + .02, .311); G.add(lb);

  /* clutch collar with numbers, keyless chuck, bit */
  G.add(mesh(latheAxis([[.27, .52], [.28, .54], [.28, .7], [.26, .72]], 'x', 72).translate(0, hy, 0), black));
  for (let k = 0; k < 24; k++) {
    const a = k / 24 * Math.PI * 2, r = mesh(new THREE.BoxGeometry(.15, .03, .03), black);
    r.position.set(.62, hy + Math.cos(a) * .285, Math.sin(a) * .285); r.rotation.x = a; G.add(r);
  }
  G.add(mesh(latheAxis([[.2, .72], [.215, .74], [.215, .98], [.18, 1.04], [.13, 1.1]], 'x', 72).translate(0, hy, 0), HM.knurled(0x1b1c1d, [40, 1])));
  G.add(mesh(latheAxis([[.13, 1.1], [.12, 1.12], [.07, 1.16], [.04, 1.17]], 'x', 48).translate(0, hy, 0), HM.chrome));
  G.add(mesh(new THREE.CylinderGeometry(.035, .035, .26, 6).rotateZ(Math.PI / 2).translate(1.27, hy, 0), HM.chrome));
  G.add(mesh(latheAxis([[.035, 1.4], [.028, 1.45], [.003, 1.5]], 'x', 24).translate(0, hy, 0), HM.blackOxide));
  return G;
}
