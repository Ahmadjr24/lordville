// PH2 × 125 mm screwdriver: fluted two-component handle (hard red, soft black), hex bolster,
// chrome-vanadium shaft and a black-oxide Phillips tip. Built along +x.
import { THREE, V, smooth, mesh, latheAxis, shapeFrom, extrude, label, HM } from '../kit.js';

export function build() {
  const G = new THREE.Group();

  /* handle: lathe with six flutes, coloured by zone */
  const prof = [[0, 0], [.1, .004], [.14, .03], [.158, .08], [.162, .16], [.158, .55], [.15, .7], [.13, .84], [.1, .93], [.08, .97], [.07, 1.0]];
  // densify the profile so the colour zones and flutes have rings to land on
  const dense = [];
  for (let k = 0; k < prof.length - 1; k++) for (let j = 0; j < 8; j++) { const t = j / 8; dense.push([prof[k][0] + (prof[k + 1][0] - prof[k][0]) * t, prof[k][1] + (prof[k + 1][1] - prof[k][1]) * t]); }
  dense.push(prof[prof.length - 1]);
  const g = latheAxis(dense, 'y', 96);
  const p = g.attributes.position, col = [], red = new THREE.Color(0xb3121a), blk = new THREE.Color(0x1b1b1c), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i), y = p.getY(i), z = p.getZ(i), th = Math.atan2(z, x);
    const flute = smooth(.1, .2, y) * (1 - smooth(.72, .85, y));
    const k = 1 - .1 * flute * Math.pow(Math.max(0, Math.cos(6 * th)), 3);
    p.setX(i, x * k); p.setZ(i, z * k);
    const soft = smooth(.14, .18, y) * (1 - smooth(.66, .7, y));
    c.copy(red).lerp(blk, soft); col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.rotateZ(-Math.PI / 2); g.computeVertexNormals();
  G.add(mesh(g, new THREE.MeshPhysicalMaterial({ vertexColors: true, roughness: .45, clearcoat: .4, clearcoatRoughness: .3 })));
  // hang hole through the end cap
  const hole = mesh(new THREE.CylinderGeometry(.03, .03, .34, 20, 1, true), new THREE.MeshStandardMaterial({ color: 0x0b0b0b, side: THREE.DoubleSide }));
  hole.position.x = .07; G.add(hole);
  // size print on the soft grip end
  const lb = label([['PH2 × 125', .7]], .2, .05, { color: '#e9e6e0' });
  lb.position.set(.45, 0, .166); G.add(lb);

  /* bolster, shaft and tip */
  const bol = mesh(new THREE.CylinderGeometry(.055, .055, .08, 6), HM.chrome); bol.rotation.z = Math.PI / 2; bol.position.x = 1.03; G.add(bol);
  G.add(mesh(latheAxis([[.032, 1.06], [.032, 2.06]], 'x', 32), HM.chrome));
  G.add(mesh(latheAxis([[.032, 2.06], [.032, 2.2], [.026, 2.28], [.008, 2.36], [.002, 2.365]], 'x', 32), HM.blackOxide));
  // four Phillips flutes
  const fin = shapeFrom([[2.17, 0], [2.36, 0], [2.17, .046]]);
  for (let k = 0; k < 4; k++) {
    const m = mesh(extrude(fin, .016, .002), HM.blackOxide); m.rotation.x = k * Math.PI / 2 + Math.PI / 4; G.add(m);
  }
  return G;
}
