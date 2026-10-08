// 18 mm snap-off utility knife: yellow ABS body with black rubber over-mould, chrome nose,
// ribbed slider, segmented snap-off blade with score lines. Built flat in x-y, laid down.
import { THREE, RoundedBoxGeometry, V, mesh, shapeFrom, extrude, label, HM } from '../kit.js';

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);
  const T = .2;
  const body = shapeFrom([[0, .06], [.08, 0], [1.3, 0], [1.42, .03], [1.5, .1], [1.5, .2], [1.32, .27], [.2, .29], [.04, .24]]);
  G.add(mesh(extrude(body, T, .02, { segs: 4 }), HM.plastic(0xf0b81c, .4)));
  const grip = shapeFrom([[.14, .035], [1.0, .035], [1.06, .1], [1.0, .25], [.2, .265], [.12, .2]]);
  G.add(mesh(extrude(grip, T + .03, .012), HM.rubber));
  // chrome nose and blade
  const nose = mesh(new RoundedBoxGeometry(.12, .2, T + .02, 3, .03), HM.chrome); nose.position.set(1.47, .14, 0); G.add(nose);
  const blade = shapeFrom([[1.2, .09], [1.98, .05], [1.86, .2], [1.2, .2]]);
  G.add(mesh(extrude(blade, .006, .0012), HM.satin));
  // score lines for snapping off segments
  for (let k = 0; k < 5; k++) {
    const x = 1.56 + k * .085, l = mesh(new THREE.BoxGeometry(.004, .17, .008), new THREE.MeshStandardMaterial({ color: 0x5a5f66, metalness: .8, roughness: .4 }));
    l.position.set(x, .135, 0); l.rotation.z = -.5; G.add(l);
  }
  // ground edge bevel highlight
  const bev = mesh(new THREE.BoxGeometry(.78, .012, .0075), HM.chrome);
  bev.position.set(1.59, .072, 0); bev.rotation.z = -.051; G.add(bev);
  // slider on the top edge
  const sl = mesh(new RoundedBoxGeometry(.24, .07, .12, 3, .02), HM.plastic(0x1b1b1c, .5)); sl.position.set(1.0, .31, 0); G.add(sl);
  for (let k = 0; k < 6; k++) { const r = mesh(new THREE.BoxGeometry(.012, .02, .11), HM.rubber); r.position.set(.91 + k * .035, .35, 0); G.add(r); }
  // body screw and print
  for (const s of [1, -1]) {
    const sc = mesh(new THREE.CylinderGeometry(.035, .035, .01, 20), HM.chrome); sc.rotation.x = Math.PI / 2; sc.position.set(1.2, .14, s * (T / 2 + .022)); G.add(sc);
    const slot = mesh(new THREE.BoxGeometry(.05, .008, .004), HM.blackOxide); slot.position.set(1.2, .14, s * (T / 2 + .028)); G.add(slot);
  }
  const lb = label([['LV · 18 mm', .75]], .26, .045, { color: '#1b1b1c' });
  lb.position.set(.62, .13, T / 2 + .045); G.add(lb);

  G.rotation.x = -Math.PI / 2;
  return outer;
}
