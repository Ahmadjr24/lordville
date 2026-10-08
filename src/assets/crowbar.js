// 600 mm wrecking bar: hexagonal forged steel, gooseneck with a flattened, split nail claw,
// angled chisel end, red paint worn back to bare steel at both working ends. Laid flat.
import { THREE, V, smooth, mesh, curve, freeFrames, sweepGeo, HM } from '../kit.js';

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);
  // centreline: chisel bend, straight shank, gooseneck hook
  const ctrl = [V(-.32, -.08, 0), V(-.12, -.015, 0), V(.2, 0, 0), V(2.5, 0, 0), V(4.8, 0, 0), V(5.25, .12, 0), V(5.42, .45, 0), V(5.3, .76, 0), V(5.02, .84, 0), V(4.78, .72, 0)];
  const pts = curve(ctrl, 360);
  const L = pts.length;
  const flat = u => Math.max(smooth(.05, 0, u), smooth(.93, 1, u));
  const W = u => .19 + .14 * smooth(.93, 1, u) + .06 * smooth(.05, 0, u);
  const Th = u => .17 - .12 * flat(u);
  // in-plane normal from the local tangent (z × t), so the hex never flips around the hook
  const inPlane = arr => i => { const t = arr[Math.min(arr.length - 1, i + 1)].clone().sub(arr[Math.max(0, i - 1)]); return V(-t.y, t.x, 0); };
  const F = freeFrames(pts, V(0, 0, 1), inPlane(pts));
  G.add(mesh(sweepGeo(F, { center: true, P: 6, round: 2, width: .2, widthFn: W, thickFn: Th, vScale: 2 }), HM.forged));
  // paint over the middle section
  const a = Math.floor(L * .07), b = Math.floor(L * .88);
  const mid = pts.slice(a, b), PF = freeFrames(mid, V(0, 0, 1), inPlane(mid));
  const paint = HM.paint(0xb3201b);
  G.add(mesh(sweepGeo(PF, { center: true, P: 6, round: 2, width: .21, widthFn: u => .21 + .01 * u, thickFn: () => .181 }), paint));
  // claw V-slot: a dark wedge between the two prongs
  const tip = F[L - 1], prev = F[L - 30];
  const slot = mesh(new THREE.BoxGeometry(.24, .07, .05), new THREE.MeshStandardMaterial({ color: 0x0c0c0c, roughness: .9 }));
  slot.position.copy(tip.pos).lerp(prev.pos, .35);
  slot.quaternion.setFromUnitVectors(V(1, 0, 0), tip.pos.clone().sub(prev.pos).normalize());
  G.add(slot);

  G.rotation.x = -Math.PI / 2;
  return outer;
}
