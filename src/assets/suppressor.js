// 9 mm pistol suppressor, 1.5" × 7.3" (display prop), shown with a quarter-section cutaway:
// black Cerakote titanium tube, knurled rear mount with 1/2-28 internal threads, blast chamber,
// stack of nine cone baffles with spacer skirts, front cap with wrench notches, laser-etched
// markings. The cut faces are bare machined metal. Axis along +x (muzzle end at the front).
import { THREE, mkCanvas, tex, mesh, HM, GM } from '../kit.js';

const PHI0 = 0, PHI = Math.PI * 1.5; // solid part of the revolution; the missing quarter faces up and toward the viewer

// closed (r, h) profile → partial lathe along x, plus flat caps on both cut planes
function section(prof, mat, cutMat, seg = 96) {
  const g = new THREE.Group();
  const pts = prof.map(([r, h]) => new THREE.Vector2(Math.max(1e-4, r), h));
  const lathe = new THREE.LatheGeometry([...pts, pts[0]], seg, PHI0, PHI);
  lathe.rotateZ(-Math.PI / 2);
  g.add(mesh(lathe, mat));
  const shape = new THREE.Shape(prof.map(([r, h]) => new THREE.Vector2(h, r)));
  const a = new THREE.ShapeGeometry(shape); a.rotateX(Math.PI / 2);            // plane at φ = 0 (faces +z side)
  const b = new THREE.ShapeGeometry(shape);                                    // plane at φ = 3π/2 (faces +y side)
  for (const geo of [a, b]) { const m = mesh(geo, cutMat); m.material.side = THREE.DoubleSide; g.add(m); }
  return g;
}

export function build() {
  const G = new THREE.Group();
  const shell = GM.cerakote(0x1d1e20, 8); shell.side = THREE.DoubleSide;
  const cut = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: .28, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -1 });
  const ti = new THREE.MeshStandardMaterial({ color: 0x7d838b, metalness: .9, roughness: .38, side: THREE.DoubleSide });
  const soot = new THREE.MeshStandardMaterial({ color: 0x3a3836, metalness: .5, roughness: .7, side: THREE.DoubleSide });

  // rear mount: knurled collar, internal 1/2-28 threads, step into the blast chamber
  const rear = [[.064, 0], [.175, 0], [.19, .015], [.19, .24], [.175, .24], [.175, .17], [.075, .17], [.075, .145]];
  for (let k = 0; k <= 12; k++) rear.push([k % 2 ? .058 : .064, .145 - k * .0115]);
  G.add(section(rear, HM.knurled(0x1d1e20, [40, 2]), cut));
  // main tube
  G.add(section([[.176, .235], [.19, .235], [.19, 1.625], [.176, 1.625]], shell, cut, 128));
  // nine cone baffles with spacer skirts (first one thicker: blast baffle)
  for (let k = 0; k < 9; k++) {
    const h0 = .4 + k * .135, t = k === 0 ? .022 : .012;
    G.add(section([[.034, h0], [.034 + t, h0], [.175, h0 - .07], [.175, h0 - .128], [.163, h0 - .128], [.163, h0 - .072 - t], [.034, h0 - t * 1.2]], k === 0 ? soot : ti, cut, 96));
  }
  // front cap with exit bore
  G.add(section([[.032, 1.61], [.175, 1.61], [.19, 1.625], [.19, 1.78], [.17, 1.835], [.07, 1.85], [.032, 1.85]], shell, cut, 128));
  for (let k = 0; k < 4; k++) {
    const a = (k + .5) / 4 * PHI, n = mesh(new THREE.BoxGeometry(.03, .04, .05), GM.dark);
    n.position.set(1.84, -Math.sin(a) * .15, Math.cos(a) * .15); n.rotation.x = -a; G.add(n);
  }
  // laser-etched markings wrapped on the tube (lower front, clear of the cutaway)
  // texture u wraps around the tube, v runs along it, so the lettering is drawn rotated
  const c = mkCanvas(256, 2048), g = c.getContext('2d');
  g.translate(128, 1024); g.rotate(-Math.PI / 2); g.translate(-1024, -128);
  g.fillStyle = '#c9ccd0'; g.textBaseline = 'middle';
  g.font = '700 92px "IBM Plex Sans", Arial, sans-serif'; g.fillText('LV CAN-9', 40, 80);
  g.font = '500 54px "IBM Plex Mono", monospace'; g.fillText('9MM · 1/2-28 TPI · TITANIUM · SN LV9-00417', 40, 185);
  const lg = new THREE.CylinderGeometry(.1905, .1905, 1.0, 64, 1, true, Math.PI / 4 - .45, .9);
  lg.rotateZ(-Math.PI / 2);
  const lm = new THREE.Mesh(lg, new THREE.MeshStandardMaterial({ map: tex(c, { clampEdge: true }), transparent: true, depthWrite: false, side: THREE.DoubleSide, polygonOffset: true, polygonOffsetFactor: -4 }));
  lm.position.x = .95; G.add(lm);
  return G;
}
