// 3/8" drive ratchet with a 13 mm socket: polished chrome handle with rubber grip, round
// 72-tooth head with reversing lever and quick-release button, knurled socket with size stamp.
import { THREE, RoundedBoxGeometry, V, smooth, mesh, curve, freeFrames, sweepGeo, latheAxis, label, HM } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const hx = 2.3, hy = .45;

  /* socket standing on the floor */
  G.add(mesh(latheAxis([[.11, 0], [.125, .012], [.125, .16], [.118, .175], [.118, .26], [.11, .28], [.11, .36]], 'y', 64).translate(hx, 0, 0), HM.chrome));
  const knurl = mesh(latheAxis([[.127, .03], [.127, .14]], 'y', 64), HM.knurled(0xd9dde2, [30, 2])); knurl.position.x = hx; G.add(knurl);
  const hex = mesh(new THREE.CylinderGeometry(.076, .076, .06, 6, 1, true), new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: .6, side: THREE.DoubleSide })); hex.position.set(hx, .02, 0); G.add(hex);
  const size = label([['13', .9]], .1, .05, { color: '#40454b', align: 'center', metal: .8, rough: .3 });
  size.position.set(hx, .215, .1185); G.add(size);

  /* head */
  G.add(mesh(latheAxis([[.0, .36], [.17, .36], [.19, .38], [.19, .52], [.17, .54], [.0, .54]], 'y', 72).translate(hx, 0, 0), HM.chrome));
  const btn = mesh(new THREE.SphereGeometry(.055, 24, 12, 0, Math.PI * 2, 0, Math.PI / 2), HM.chrome); btn.scale.y = .5; btn.position.set(hx, .54, 0); G.add(btn);
  const lever = mesh(new RoundedBoxGeometry(.1, .03, .2, 2, .012), HM.chrome); lever.position.set(hx - .1, .555, 0); lever.rotation.y = .4; G.add(lever);

  /* handle: flat-oval chrome beam blending into the head, rubber grip */
  const pts = curve([V(0, hy, 0), V(1.2, hy, 0), V(2.0, hy, 0), V(hx - .12, hy, 0)], 80);
  const F = freeFrames(pts, V(0, 0, 1), V(0, 1, 0));
  G.add(mesh(sweepGeo(F, { center: true, round: 3, P: 28, width: .2, widthFn: u => .17 + .1 * smooth(.75, 1, u), thickFn: u => .085 + .05 * smooth(.8, 1, u) }), HM.chrome));
  const gp = curve([V(-.04, hy, 0), V(1.15, hy, 0)], 60);
  const GF = freeFrames(gp, V(0, 0, 1), V(0, 1, 0));
  G.add(mesh(sweepGeo(GF, { center: true, round: 2.5, P: 28, width: .24, widthFn: u => .23 + .02 * Math.sin(Math.PI * u) + .02 * smooth(.08, 0, u), thickFn: u => .15 + .015 * Math.sin(Math.PI * u) }), HM.rubber));
  const lb = label([['3/8" DR · 72T', .7]], .4, .06, { color: '#3d4247', metal: .8, rough: .25 });
  lb.position.set(1.65, hy + .044, 0); lb.rotation.x = -Math.PI / 2; G.add(lb);
  return G;
}
