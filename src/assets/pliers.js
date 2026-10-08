// 200 mm combination pliers: two forged halves crossing at a riveted pivot, serrated gripping
// jaws, side cutters, and dipped two-colour insulated grips. Built flat in x-y, laid down.
import { THREE, V, smooth, mesh, curve, freeFrames, sweepGeo, shapeFrom, extrude, label, HM } from '../kit.js';

function half(s) {
  // upper jaw / lower handle, CCW; serrations along the inner jaw face
  const pts = [[.56, .006], [.585, .032], [.42, .088], [.2, .16], [.02, .17], [-.12, .13], [-.2, .05], [-.4, -.03], [-1.3, -.11], [-1.36, -.15], [-1.32, -.2], [-.4, -.13], [-.18, -.1], [-.02, -.12], [.1, -.06], [.13, -.005], [.18, .004]];
  for (let x = .2; x < .545; x += .022) { pts.push([x, .006]); pts.push([x + .011, .022]); }
  // the lower half is the mirror image; reverse so the outline stays counter-clockwise
  return shapeFrom(s > 0 ? pts : pts.map(([x, y]) => [x, -y]).reverse());
}

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);
  const t = .055, open = .06;
  const grip = HM.plastic(0xc3141c, .5), grip2 = HM.plastic(0xe4b21a, .5);
  for (const s of [1, -1]) {
    const H = new THREE.Group(); H.rotation.z = s * open / 2;
    const m = mesh(extrude(half(s), t, .01, { segs: 3 }), HM.satin); m.position.z = s * t / 2;
    H.add(m);
    // dipped grip over the handle
    const ctrl = [V(-.36, -.07, 0), V(-.8, -.11, 0), V(-1.37, -.158, 0)].map(p => V(p.x, p.y * s, 0));
    const F = freeFrames(curve(ctrl, 60), V(0, 1, 0), V(0, 0, 1));
    const w = u => .15 + .03 * smooth(.85, 1, u) + .02 * smooth(.12, 0, u);
    H.add(mesh(sweepGeo(F, { center: true, round: 2.6, P: 28, width: .16, widthFn: w, thickFn: u => w(u) * .9 }), grip));
    // second colour on the inner layer near the guard
    const G2 = freeFrames(curve(ctrl.slice(0, 2), 20), V(0, 1, 0), V(0, 0, 1));
    H.add(mesh(sweepGeo(G2, { center: true, round: 2.6, P: 28, width: .19, thick: .17 }), grip2));
    G.add(H);
  }
  // pivot rivet, domed both sides
  for (const s of [1, -1]) {
    const r = mesh(new THREE.SphereGeometry(.07, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2), HM.chrome);
    r.scale.y = .25; r.rotation.x = s * Math.PI / 2; r.position.z = s * (t + .008); G.add(r);
  }
  const lb = label([['200 mm · 1000 V', .7]], .3, .04, { color: '#41464c', metal: .7, rough: .3 });
  lb.position.set(.05, .1, t + .012); G.add(lb);

  G.rotation.x = -Math.PI / 2;
  return outer;
}
