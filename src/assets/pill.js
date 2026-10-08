// Two-piece hard gelatin capsule (size 0, ~21.7 mm) with a sealing band and printed imprint.
// Built along +y, then laid on its side.
import { THREE, mesh, mkCanvas, tex } from '../kit.js';

// Lathe profile for a domed half-shell: closed dome at y = 0, open end at y = len, wall thickness t.
function shell(r, len, t, seg = 24) {
  const pts = [];
  for (let i = 0; i <= seg; i++) { const a = i / seg * Math.PI / 2; pts.push(new THREE.Vector2(Math.max(1e-4, r * Math.sin(a)), r - r * Math.cos(a))); }
  pts.push(new THREE.Vector2(r, len));
  pts.push(new THREE.Vector2(r - t * .5, len + t * .35)); // rounded rim
  pts.push(new THREE.Vector2(r - t, len));
  for (let i = seg; i >= 0; i--) { const a = i / seg * Math.PI / 2, ri = r - t; pts.push(new THREE.Vector2(Math.max(1e-4, ri * Math.sin(a)), r - ri * Math.cos(a))); }
  return new THREE.LatheGeometry(pts, 96);
}

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group();
  outer.add(G);
  const r = .0367, t = .0011;   // 7.34 mm outer diameter (body)
  const gel = (color, o = {}) => new THREE.MeshPhysicalMaterial({
    color, roughness: .12, clearcoat: 1, clearcoatRoughness: .06, sheen: .2, sheenColor: new THREE.Color(0xffffff),
    transmission: o.transmission ?? 0, thickness: .004, ior: 1.5, side: THREE.DoubleSide, ...o.extra
  });

  // body (ivory, faintly translucent) — dome at the bottom
  const bodyLen = .186;
  const body = mesh(shell(r, bodyLen, t), gel(0xf1ece0, { transmission: .25 }));
  body.position.y = 0; G.add(body);

  // cap (teal), slightly wider, telescoped over the body from the top
  const rc = r + .0012, capLen = .107;
  const cap = mesh(shell(rc, capLen, t), gel(0x14707f));
  cap.rotation.x = Math.PI; cap.position.y = .217; G.add(cap);

  // sealing band where the cap meets the body
  const bandY = .217 - capLen;
  const band = mesh(new THREE.CylinderGeometry(rc + .0007, rc + .0007, .0085, 96, 1, true), gel(0x0f5f6c));
  band.position.y = bandY + .002; G.add(band);
  const lip = mesh(new THREE.TorusGeometry(rc + .0007, .0006, 8, 96), gel(0x0f5f6c));
  lip.rotation.x = Math.PI / 2; lip.position.y = bandY - .0023; G.add(lip);

  // powder fill, seen faintly through the body
  const fill = mesh(new THREE.CylinderGeometry(r - .003, r - .003, .12, 48), new THREE.MeshStandardMaterial({ color: 0xe9e3d4, roughness: 1 }));
  fill.position.y = .1; G.add(fill);

  // printed imprint on cap and body (edible ink)
  // imprint runs along the capsule's length, like real banded capsules
  const print = (txt, color) => {
    const c = mkCanvas(256, 1024), g = c.getContext('2d');
    g.translate(128, 512); g.rotate(Math.PI / 2);
    g.fillStyle = color; g.font = '700 150px "IBM Plex Sans", Arial, sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle';
    g.fillText(txt, 0, 8);
    return new THREE.MeshStandardMaterial({ map: tex(c, { clampEdge: true }), transparent: true, roughness: .3, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  };
  const decal = (rad, y0, txt, color) => {
    const g = new THREE.CylinderGeometry(rad, rad, .07, 64, 1, true, -Math.PI * .2, Math.PI * .4);
    const m = new THREE.Mesh(g, print(txt, color)); m.position.y = y0; return m;
  };
  G.add(decal(r + .0002, .06, 'LV', '#1d1d1d'));
  G.add(decal(rc + .0002, .165, '500', '#f4f1ea'));

  G.rotation.z = Math.PI / 2;
  G.position.y = rc;
  return outer;
}
