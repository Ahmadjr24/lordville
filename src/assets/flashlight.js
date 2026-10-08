// Tactical LED flashlight: anodised aluminium with knurled body, finned head, smooth reflector,
// LED emitter behind a lens, rubber tail switch and a steel pocket clip. Built along +x.
import { THREE, V, mesh, freeFrames, sweepGeo, latheAxis, label, HM } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const anod = new THREE.MeshStandardMaterial({ color: 0x1d1e20, metalness: .75, roughness: .32 });
  const knurl = HM.knurled(0x1d1e20, [28, 2]);

  // tail switch (rubber boot) and tail cap
  G.add(mesh(latheAxis([[0, -.035], [.05, -.032], [.075, -.018], [.085, 0], [.085, .02]], 'x'), HM.rubber));
  G.add(mesh(latheAxis([[.085, .0], [.11, .0], [.13, .015], [.135, .04], [.135, .2], [.128, .22], [.128, .24]], 'x'), anod));
  for (let k = 0; k < 3; k++) G.add(mesh(new THREE.TorusGeometry(.136, .006, 8, 64), anod).rotateY(Math.PI / 2).translateZ(.07 + k * .045));
  // knurled body tube
  G.add(mesh(latheAxis([[.124, .24], [.128, .26], [.128, .96], [.134, .985]], 'x', 72), knurl));
  // head with cooling fins
  G.add(mesh(latheAxis([[.134, .985], [.15, 1.04], [.176, 1.13], [.184, 1.16], [.184, 1.39], [.178, 1.42], [.155, 1.425]], 'x', 72), anod));
  for (let k = 0; k < 4; k++) G.add(mesh(new THREE.TorusGeometry(.184, .01, 8, 72), new THREE.MeshStandardMaterial({ color: 0x0b0b0c, roughness: .6 })).rotateY(Math.PI / 2).translateZ(1.19 + k * .04));
  // reflector, LED and lens
  G.add(mesh(latheAxis([[.03, 1.24], [.06, 1.27], [.11, 1.33], [.152, 1.41]], 'x', 64), new THREE.MeshStandardMaterial({ color: 0xf0f2f4, metalness: 1, roughness: .05, side: THREE.DoubleSide })));
  const led = mesh(new THREE.BoxGeometry(.012, .05, .05), new THREE.MeshStandardMaterial({ color: 0xf6e7a8, emissive: 0x6b5a20, roughness: .4 }));
  led.position.x = 1.245; G.add(led);
  const lens = new THREE.Mesh(new THREE.CircleGeometry(.155, 64), HM.glass); lens.rotation.y = Math.PI / 2; lens.position.x = 1.415; G.add(lens);
  // crenellated bezel
  for (let k = 0; k < 6; k++) {
    const a = k / 6 * Math.PI * 2, c = mesh(new THREE.BoxGeometry(.03, .04, .07), anod);
    c.position.set(1.43, Math.cos(a) * .165, Math.sin(a) * .165); c.rotation.x = a; G.add(c);
  }
  // pocket clip on top
  const cp = [V(.2, .128, 0), V(.24, .17, 0), V(.32, .165, 0), V(.8, .145, 0), V(.86, .155, 0)];
  const CF = freeFrames(cp, V(0, 0, 1), V(0, 1, 0));
  G.add(mesh(sweepGeo(CF, { center: true, width: .1, thick: .012, round: 8 }), HM.satin));
  // printed markings on the head
  const lb = label([['LV-T8', .7], ['800 lm · IPX8', .55, 600]], .18, .07, { color: '#c9cdd2' });
  lb.position.set(1.28, .186, 0); lb.rotation.set(-Math.PI / 2, 0, 0); G.add(lb);
  return G;
}
