// 250 mm (10") adjustable wrench: chrome-vanadium body with hang hole, fixed and sliding jaws,
// threaded worm in its window, size and jaw-scale markings. Built flat in x-y, laid down.
import { THREE, V, mesh, latheAxis, shapeFrom, circlePts, extrude, label, HM } from '../kit.js';

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);
  const T = .14;

  // body: rounded handle end with hang hole, neck, head with fixed jaw and throat
  const pts = [[.14, -.13], [1.7, -.15], [1.95, -.22], [2.24, -.25], [2.24, .02], [2.25, .14], [2.3, .2], [2.36, .22], [2.66, .22], [2.71, .27], [2.66, .36], [2.5, .4], [2.25, .4], [2.02, .34], [1.82, .19], [1.7, .15], [.14, .13]];
  for (let k = 1; k < 16; k++) { const a = Math.PI / 2 + k / 16 * Math.PI; pts.push([.14 + Math.cos(a) * .135, Math.sin(a) * .135]); }
  const window = [[1.98, -.18], [1.98, -.03], [2.17, -.03], [2.17, -.18]];
  G.add(mesh(extrude(shapeFrom(pts, [circlePts(.17, 0, .055), window]), T, .02, { segs: 4 }), HM.chrome));
  // sliding jaw with its rack running down into the head
  const jaw = shapeFrom([[2.245, -.2], [2.56, -.17], [2.68, -.07], [2.69, .02], [2.26, .02]]);
  G.add(mesh(extrude(jaw, T - .01, .018), HM.chrome));
  // worm screw: threaded lathe in the window, axis along y
  const th = [];
  for (let k = 0; k <= 14; k++) { const y = -.172 + k * .0095; th.push([k % 2 ? .064 : .05, y]); }
  const worm = mesh(latheAxis(th, 'y', 48), HM.knurled(0xc9ced4, [1, 1]));
  worm.position.set(2.075, 0, 0); G.add(worm);
  const pin = mesh(new THREE.CylinderGeometry(.018, .018, .19, 16), HM.chrome); pin.position.set(2.075, -.105, 0); G.add(pin);
  // markings: size on the handle, jaw scale on the head
  const lb = label([['250 mm · 10"', .6], ['Cr-V  DROP FORGED', .45, 600]], .7, .14, { color: '#5f656c', metal: .6, rough: .3 });
  lb.position.set(.9, 0, T / 2 + .021); G.add(lb);
  const sc = label([['0 · 10 · 20 · 30 mm', .8, 600]], .3, .035, { color: '#3d4247', metal: .6 });
  sc.position.set(2.42, -.12, T / 2 + .016); G.add(sc);

  G.rotation.x = -Math.PI / 2;
  return outer;
}
