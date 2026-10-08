// Acetate eyeglasses, 52□20-145: tortoiseshell front with wrap curve, anti-reflective lenses,
// five-barrel metal hinges with pin rivets, keyhole bridge pads and bent temple tips.
import { THREE, RoundedBoxGeometry, V, smooth, fbm, mesh, mkCanvas, tex, curve, freeFrames, sweepGeo } from '../kit.js';

const LENS = { a: .26, b: .2, n: 3.1, cx: .37 }; // lens half-width/height, superellipse power, centre offset

function tortoiseCanvas() {
  const W = 512, c = mkCanvas(W), g = c.getContext('2d'), img = g.createImageData(W, W);
  for (let y = 0; y < W; y++) for (let x = 0; x < W; x++) {
    const u = x / W * 6, v = y / W * 6;
    // tileable-ish turbulence via periodic sampling
    let n = fbm(Math.sin(u) * 2 + u * .2, Math.cos(v) * 2 + v * .35, u * .3 + v * .2);
    n = n + .35 * fbm(u * 2.3, v * 2.3 + 4, 2.1) - .2;
    const k = smooth(.35, .75, n);
    const i = (y * W + x) * 4;
    img.data[i] = 38 + k * 170; img.data[i + 1] = 16 + k * 92; img.data[i + 2] = 8 + k * 20; img.data[i + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  return c;
}
// superellipse outline; grow lets the rim be thicker on top (brow) than on the bottom
function lensPts(grow = 0, top = 0, n = 96) {
  const pts = [];
  for (let k = 0; k < n; k++) {
    const t = k / n * Math.PI * 2, c = Math.cos(t), s = Math.sin(t);
    const a = LENS.a + grow, b = LENS.b + grow + (s > 0 ? top * s : 0);
    let x = Math.sign(c) * Math.pow(Math.abs(c), 2 / LENS.n) * a, y = Math.sign(s) * Math.pow(Math.abs(s), 2 / LENS.n) * b;
    // classic shape: slightly narrower toward the bottom-nose corner
    if (y < 0 && x < 0) x *= 1 - .12 * (-y / b) * (-x / a);
    pts.push(new THREE.Vector2(x, y));
  }
  return pts;
}
// bend a geometry around the face (wrap) after it has been placed in frame space
function wrap(g, k = .22) {
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) p.setZ(i, p.getZ(i) - k * p.getX(i) * p.getX(i));
  g.computeVertexNormals();
  return g;
}

export function build() {
  const G = new THREE.Group();
  const tc = tortoiseCanvas();
  const acetate = new THREE.MeshPhysicalMaterial({
    color: 0xffffff, map: tex(tc, { repeat: [1.6, 1.6] }), roughness: .18, clearcoat: 1, clearcoatRoughness: .04,
    sheen: .2, sheenColor: new THREE.Color(0xffd9a8)
  });
  const metal = new THREE.MeshStandardMaterial({ color: 0xcfd2d6, metalness: 1, roughness: .22 });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0xeef4f2, roughness: .02, transparent: true, opacity: .12, depthWrite: false, clearcoat: 1,
    iridescence: .8, iridescenceIOR: 1.35, iridescenceThicknessRange: [280, 420], side: THREE.DoubleSide
  });

  /* front: two rims, a keyhole bridge, end pieces */
  const D = .045; // frame thickness (front to back)
  for (const sx of [-1, 1]) {
    const shape = new THREE.Shape(lensPts(.034, .026).map(p => p.clone()));
    shape.holes.push(new THREE.Path(lensPts(0).reverse()));
    const g = new THREE.ExtrudeGeometry(shape, { depth: D, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 4, curveSegments: 4 });
    g.translate(sx * LENS.cx, 0, -D / 2);
    G.add(mesh(wrap(g), acetate));
    // lens: sits in the groove, gently curved front surface
    const ls = new THREE.Shape(lensPts(.012));
    const lg = new THREE.ExtrudeGeometry(ls, { depth: .014, bevelEnabled: true, bevelThickness: .003, bevelSize: .003, bevelSegments: 2, curveSegments: 4 });
    const lp = lg.attributes.position;
    for (let i = 0; i < lp.count; i++) {
      const x = lp.getX(i), y = lp.getY(i), r2 = (x / LENS.a) ** 2 + (y / LENS.b) ** 2;
      lp.setZ(i, lp.getZ(i) + .018 * (1 - Math.min(1, r2)));
    }
    lg.translate(sx * LENS.cx, 0, -.012);
    const lens = new THREE.Mesh(wrap(lg), glass); lens.castShadow = false; G.add(lens);
    // integrated nose pad
    const pad = mesh(new THREE.SphereGeometry(.05, 24, 16), acetate);
    pad.scale.set(.45, 1, .7); pad.rotation.z = sx * .45;
    pad.position.set(sx * .13, -.06, -.045 - .22 * .13 * .13); G.add(pad);
  }
  // keyhole bridge
  {
    const pts = [];
    for (let i = 0; i <= 40; i++) { const x = -.135 + .27 * i / 40; pts.push(V(x, .12 + .035 * Math.sin(Math.PI * i / 40), -.22 * x * x)); }
    const F = freeFrames(pts, V(0, 0, 1), V(0, 1, 0));
    G.add(mesh(sweepGeo(F, { center: true, width: D + .01, thick: .045, round: 5, P: 24 }), acetate));
  }
  // end pieces with decorative pin rivets
  const hx = LENS.cx + LENS.a + .05, hy = .1, hz = -.22 * hx * hx;
  for (const sx of [-1, 1]) {
    const ep = mesh(new RoundedBoxGeometry(.07, .11, .11, 4, .028), acetate);
    ep.position.set(sx * (hx - .02), hy, hz - .04); ep.rotation.y = sx * .35; G.add(ep);
    for (const dy of [-.035, .035]) {
      const pin = mesh(new THREE.CylinderGeometry(.011, .011, .01, 6), metal);
      pin.rotation.x = Math.PI / 2; pin.position.set(sx * (hx - .04), hy + dy, hz + .03); G.add(pin);
    }
  }

  /* five-barrel hinges and temples */
  for (const sx of [-1, 1]) {
    const px = sx * (hx + .02), pz = hz - .12;
    for (let k = 0; k < 5; k++) {
      const barrel = mesh(new THREE.CylinderGeometry(.018, .018, .017, 20), metal);
      barrel.position.set(px, hy - .045 + k * .0225, pz); G.add(barrel);
    }
    const screw = mesh(new THREE.CylinderGeometry(.012, .012, .006, 16), metal); screw.position.set(px, hy + .06, pz); G.add(screw);
    for (const dz of [.04, -.04]) {
      const plate = mesh(new RoundedBoxGeometry(.012, .1, .07, 2, .004), metal);
      plate.position.set(px - sx * .012, hy, pz + dz); G.add(plate);
    }
    // temple: straight back, slight outward splay, then bends down behind the ear
    const ctrl = [V(px, hy, pz - .02), V(px + sx * .02, hy, pz - .5), V(px + sx * .03, hy - .01, pz - 1.15), V(px + sx * .02, hy - .07, pz - 1.32), V(px, hy - .25, pz - 1.48), V(px - sx * .01, hy - .36, pz - 1.52)];
    const F = freeFrames(curve(ctrl, 160), V(0, 1, 0), V(sx, 0, 0));
    G.add(mesh(sweepGeo(F, {
      center: true, round: 4, P: 24, width: .1,
      widthFn: u => .085 - .035 * smooth(0, .6, u) + .01 * smooth(.85, 1, u),
      thickFn: u => .034 - .01 * smooth(0, .5, u) + .006 * smooth(.85, 1, u)
    }), acetate));
    // printed size on the inside of the left temple
    if (sx < 0) {
      const c = mkCanvas(1024, 96), g = c.getContext('2d');
      g.fillStyle = '#e9dcc4'; g.font = '600 64px "IBM Plex Mono", monospace'; g.textBaseline = 'middle';
      g.fillText('LV 520  52□20  145', 20, 50);
      const m = new THREE.Mesh(new THREE.PlaneGeometry(.42, .04), new THREE.MeshStandardMaterial({ map: tex(c, { clampEdge: true }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
      m.position.set(px + .02, hy, pz - .45); m.rotation.y = Math.PI / 2; G.add(m);
    }
  }
  return G;
}
