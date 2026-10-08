// 550 mm (22") panel saw: tapered spring-steel blade with 7 TPI teeth and an etched mark,
// closed beech handle with hand hole, brass split-nut screws. Built flat in x-y, laid down.
import { THREE, V, mesh, shapeFrom, rrPts, extrude, label, HM } from '../kit.js';

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);

  /* blade */
  const x0 = 1.0, x1 = 5.5, pitch = .036, pts = [[x0, 1.1], [x0, .02]];
  for (let x = x0 + .02; x < x1 - .01; x += pitch) { pts.push([x, 0]); pts.push([x + pitch * .62, .038]); }
  pts.push([x1, .02], [x1, .52], [x1 - .06, .56]);
  const blade = mesh(extrude(shapeFrom(pts), .009, .0012, { segs: 1 }), HM.satin);
  G.add(blade);
  const etch = label([['LV  PANEL SAW', .55], ['550 mm · 22" · 7 TPI · HARDPOINT', .38, 600]], 1.3, .22, { color: '#4e545b', metal: .9, rough: .3 });
  etch.position.set(2.2, .7, .007); G.add(etch);
  // tooth set: alternate teeth bent a hair either side
  const set = new THREE.InstancedMesh(new THREE.BoxGeometry(.016, .036, .004), HM.satin, Math.floor((x1 - x0) / pitch) - 1);
  const m = new THREE.Matrix4();
  for (let i = 0; i < set.count; i++) { m.makeTranslation(x0 + .045 + i * pitch, .02, (i % 2 ? 1 : -1) * .006); set.setMatrixAt(i, m); }
  G.add(set);

  /* closed handle with a hand hole */
  const outline = new THREE.Shape();
  outline.moveTo(1.0, -.02); outline.lineTo(1.28, .1); outline.lineTo(1.28, 1.05);
  outline.quadraticCurveTo(1.25, 1.32, .95, 1.38); outline.quadraticCurveTo(.55, 1.42, .3, 1.25);
  outline.quadraticCurveTo(.05, 1.05, -.05, .55); outline.quadraticCurveTo(-.1, .15, .2, -.05);
  outline.quadraticCurveTo(.6, -.12, 1.0, -.02);
  outline.holes.push(new THREE.Path(rrPts(.22, .22, .76, .86, .22, 8).reverse().map(([x, y]) => new THREE.Vector2(x, y))));
  const wood = HM.wood([168, 104, 58], [1, .7]);
  const h = mesh(extrude(outline, .24, .055, { segs: 6, curve: 32 }), wood);
  G.add(h);
  // brass split-nut screws through handle and blade
  for (const [x, y] of [[1.13, .26], [1.13, .9], [.62, 1.24]]) for (const s of [1, -1]) {
    const nut = mesh(new THREE.CylinderGeometry(.05, .052, .02, 28), HM.brass); nut.rotation.x = Math.PI / 2; nut.position.set(x, y, s * .181); G.add(nut);
    const slot = mesh(new THREE.BoxGeometry(.075, .01, .01), new THREE.MeshStandardMaterial({ color: 0x3a2a12, roughness: .7 })); slot.position.set(x, y, s * .192); slot.rotation.z = .6; G.add(slot);
  }

  G.rotation.x = -Math.PI / 2;
  return outer;
}
