// 16 oz claw hammer: forged head with polished, slightly domed striking face and split claw,
// fibreglass shaft with a rubber over-moulded grip and flared butt. Built standing, laid on its side.
import { THREE, V, smooth, mesh, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, extrude, label, HM } from '../kit.js';

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);
  const T = .26; // head thickness

  /* head body: neck, eye and cheeks */
  const body = shapeFrom([[-.48, 2.9], [-.3, 2.88], [-.16, 2.82], [.16, 2.82], [.22, 2.86], [.24, 3.1], [.16, 3.14], [-.16, 3.14], [-.3, 3.08], [-.48, 3.1]]);
  G.add(mesh(extrude(body, T, .02), HM.forged));
  // striking face, polished and slightly domed
  G.add(mesh(latheAxis([[0, -.632], [.06, -.63], [.125, -.622], [.138, -.61], [.138, -.57], [.124, -.54], [.108, -.47]], 'x', 64), HM.satin).translateY(3.0));
  // split claw: two prongs with a V-slot between them
  const claw = new THREE.Shape();
  claw.moveTo(.18, 2.84); claw.quadraticCurveTo(.5, 2.84, .8, 2.6); claw.lineTo(.84, 2.63);
  claw.quadraticCurveTo(.62, 2.98, .2, 3.12); claw.lineTo(.18, 2.84);
  for (const sz of [1, -1]) {
    const g = extrude(claw, .1, .012); g.translate(0, 0, sz * .075);
    G.add(mesh(g, HM.forged));
  }
  const slot = new THREE.Mesh(extrude(claw, .05, 0), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: .8 }));
  slot.scale.set(1, 1, 1); slot.position.set(-.03, -.02, 0); G.add(slot);
  // weight stamp on the cheek
  const st = label([['16 OZ', .7], ['450 g', .5, 600]], .2, .12, { color: '#9ca1a7', align: 'center', metal: .8, rough: .4 });
  st.position.set(0, 2.98, T / 2 + .021); G.add(st);

  /* handle: fibreglass core + rubber grip */
  const pts = []; for (let i = 0; i <= 80; i++) pts.push(V(0, -.02 + 2.86 * i / 80, 0));
  const F = freeFrames(pts, V(1, 0, 0), V(0, 0, 1));
  G.add(mesh(sweepGeo(F, { center: true, round: 2.6, P: 32, width: .26, widthFn: u => .25 - .03 * smooth(.5, 1, u), thickFn: u => .19 - .02 * smooth(.5, 1, u), vScale: 2 }), HM.plastic(0xe9b71c, .35)));
  const gp = []; for (let i = 0; i <= 80; i++) gp.push(V(0, -.04 + 1.62 * i / 80, 0));
  const GF = freeFrames(gp, V(1, 0, 0), V(0, 0, 1));
  const grip = u => .33 + .05 * smooth(.08, 0, u) + .025 * Math.sin(Math.PI * Math.min(1, u * 1.2)) - .05 * smooth(.85, 1, u);
  G.add(mesh(sweepGeo(GF, { center: true, round: 2.4, P: 32, width: .35, widthFn: grip, thickFn: u => grip(u) * .74, vScale: 2 }), HM.rubber));
  // yellow inlay stripe on the grip
  const stripe = mesh(sweepGeo(freeFrames(gp.slice(20, 66), V(1, 0, 0), V(0, 0, 1)), { center: true, round: 2.4, P: 32, width: .1, thick: .27 }), HM.plastic(0xe9b71c, .35));
  stripe.position.z = .0; G.add(stripe);

  G.rotation.x = -Math.PI / 2;
  return outer;
}
