// Seeded multigrain breakfast roll (display prop, after a bakery rustic multiseed roll): about
// 100 mm across and 50 mm tall with a flat heel, golden crust darkening toward the crown, three
// rustic tears opening from the top, and a cap of poppy, sesame, brown and golden linseed and a
// few sunflower kernels; beside it a second roll cut in half to show the open, seed-flecked crumb.
// y up; the whole roll sits at the origin.
import { THREE, V, mesh, tex } from '../kit.js';
import { blob, scatter, tint, crustCanvas, bumpCanvas, crumbCanvas, fbm, smooth } from '../food.js';

// rustic tears radiating from the crown: 0 outside, 1 at the bottom of a tear
const TEARS = [[.3, .9], [2.25, .75], [4.1, .85]];
function tear(d, seed) {
  if (d.y < .45) return 0;
  const phi = Math.atan2(d.z, d.x); let t = 0;
  for (const [a0, len] of TEARS) {
    const a = a0 + seed + .45 * (1 - d.y);                     // tears curve a little as they run out
    let dl = phi - a; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
    const w = .045 + .05 * (1 - d.y);
    t = Math.max(t, Math.exp(-((dl / w) ** 2)) * smooth(.45 + (1 - len) * .4, .7, d.y) * (1 - smooth(.94, .99, d.y)));
  }
  return t;
}
// raised baked lips either side of each tear
function lip(d, seed) {
  if (d.y < .45) return 0;
  const phi = Math.atan2(d.z, d.x); let t = 0;
  for (const [a0, len] of TEARS) {
    const a = a0 + seed + .45 * (1 - d.y); let dl = phi - a; dl = Math.atan2(Math.sin(dl), Math.cos(dl));
    const w = .045 + .05 * (1 - d.y);
    t = Math.max(t, Math.exp(-(((Math.abs(dl) - w * 1.6) / (w * .7)) ** 2)) * smooth(.45 + (1 - len) * .4, .7, d.y) * (1 - smooth(.94, .99, d.y)));
  }
  return t;
}
// roll surface for unit direction d: 100 mm across, 50 mm tall, flat heel, low dome
function rollShape(seed = 0, R = .5, H = .5) {
  return d => {
    const n = fbm(d.x * 2.2 + seed, d.y * 2.2, d.z * 2.2) - .5, fine = fbm(d.x * 9 + seed, d.y * 9, d.z * 9) - .5;
    const top = d.y > 0;
    const yy = top ? Math.pow(d.y, .8) * (H - .1) : -Math.pow(-d.y, .4) * .1;
    const rr = R * (1 + n * .06 + fine * .012) * (top ? 1 - .08 * Math.pow(d.y, 3) : 1 - .06 * smooth(.3, 1, -d.y));
    const k = Math.hypot(d.x, d.z) || 1e-6, rad = top ? rr * Math.pow(k, .9) : rr * Math.pow(k, .55);
    const tr = tear(d, seed) * .045 - lip(d, seed) * .02;       // tears sink 3–5 mm, lips stand ~2 mm proud
    return V(d.x / k * rad, yy + .1 + n * .02 - tr, d.z / k * rad * .97);
  };
}

export function build() {
  const G = new THREE.Group();
  const crust = new THREE.MeshPhysicalMaterial({
    vertexColors: true, roughness: .62, sheen: .25, sheenColor: new THREE.Color(0xffe2b0),
    map: tex(crustCanvas({ base: '#ffffff', spots: ['#e8dccc', '#f4ece2', '#ddd0bf'], n: 9000, rmax: 2.5, alpha: .3 }), { repeat: [3, 2] }),
    bumpMap: tex(bumpCanvas(), { repeat: [3, 2], color: false }), bumpScale: 1.4,
  });
  // bake gradient: pale heel, golden sides, deep brown crown
  const bake = (d, p, c, seed = 0) => {
    const t = smooth(-.2, .9, d.y), j = fbm(d.x * 6, d.y * 6, d.z * 6) - .5;
    const heel = new THREE.Color(0xc48a4c), side = new THREE.Color(0xe2c08a), main = new THREE.Color(0xcf9a55), crown = new THREE.Color(0xb8783e);
    c.copy(heel).lerp(side, smooth(-.4, -.05, d.y)).lerp(main, smooth(0, .45, d.y)).lerp(crown, smooth(.35, .9, d.y));
    c.offsetHSL(0, 0, j * .06 - (d.y < -.5 ? .04 : 0));
    // tears: dark baked lips, pale crumb showing at the bottom
    const tr = tear(d, seed), lp = lip(d, seed); c.lerp(new THREE.Color(0x8e5428), lp * .8); if (tr > .05) c.lerp(new THREE.Color(0xd9be8a), smooth(.5, .95, tr) * .5);
  };

  /* seeds and flakes (shared geometry, instanced) */
  const sesame = new THREE.SphereGeometry(.016, 10, 6); sesame.scale(1, .25, .56);
  const sunflower = new THREE.SphereGeometry(.035, 12, 8); sunflower.scale(1, .21, .36);
  const poppy = new THREE.SphereGeometry(.0065, 6, 4); poppy.scale(1, .8, 1);
  const linseed = new THREE.SphereGeometry(.022, 10, 6); linseed.scale(1, .32, .55);
  const sm = (hex, rough = .5, o = {}) => new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: rough, clearcoat: o.cc ?? .2, clearcoatRoughness: .5, ...o.extra });
  // seeds cover the cap (about 75% of the diameter), thinning down the sides, none in the tears
  const cap = seed => rnd => { const y = Math.pow(rnd(), .6) * .95 + .05, a = rnd() * Math.PI * 2, r = Math.sqrt(1 - y * y), d = V(Math.cos(a) * r, y, Math.sin(a) * r);
    if (y < .35 && rnd() > smooth(.05, .35, y)) return null; return tear(d, seed) > .25 ? null : d; };

  function roll(seed) {
    const R = new THREE.Group(), shape = rollShape(seed);
    const crown = cap(seed);
    R.add(mesh(blob(shape, (d, p, c) => bake(d, p, c, seed)), crust));
    // partly sunk into the crust: small negative lift
    R.add(tint(scatter(shape, poppy, sm(0, .45, { cc: .1 }), 950, crown, { lift: -.0005, scale: [.8, 1.2], seed: seed + 2 }), [0x2a2c33, 0x34363e, 0x23242a]));
    R.add(tint(scatter(shape, sesame, sm(0, .4), 240, crown, { lift: -.0005, scale: [.75, 1.1], seed: seed + 3 }), [0xe3d3ae, 0xd8c69c, 0xeadcb8]));
    R.add(tint(scatter(shape, linseed, sm(0, .25, { cc: .8 }), 90, crown, { lift: -.0005, scale: [.75, 1.05], seed: seed + 4 }), [0x6e3f22, 0x7d4a22, 0xc8a05a]));
    R.add(tint(scatter(shape, sunflower, sm(0, .55), 12, crown, { lift: -.0005, scale: [.85, 1.1], seed: seed + 1 }), [0xcfc3a0, 0xbdb294]));
    return { R, shape };
  }

  // whole roll
  G.add(roll(0).R);

  // second roll cut through the middle, cut face toward the viewer
  {
    const { R, shape } = roll(7.3);
    const H = new THREE.Group(); H.add(R);
    // flatten everything on +z onto the cut plane and lay the crumb face over it
    R.children[0].geometry.attributes.position.array.forEach((v, i, a) => { if (i % 3 === 2 && v > 0) a[i] = 0; });
    R.children[0].geometry.computeVertexNormals();
    R.children.slice(1).forEach(im => { const m = new THREE.Matrix4(), p = V(); let k = 0; for (let i = 0; i < im.count; i++) { im.getMatrixAt(i, m); p.setFromMatrixPosition(m); if (p.z < -.01) im.setMatrixAt(k++, m); } im.count = k; });
    const outline = []; for (let k = 0; k <= 96; k++) { const a = k / 96 * Math.PI * 2, p = shape(V(Math.cos(a), Math.sin(a), 0)); outline.push(new THREE.Vector2(p.x * .985, (p.y - .1) * .985 + .1)); }
    const face = new THREE.ShapeGeometry(new THREE.Shape(outline), 64);
    { const p = face.attributes.position; for (let i = 0; i < p.count; i++) p.setZ(i, (fbm(p.getX(i) * 14, p.getY(i) * 14, 3) - .5) * .01); face.computeVertexNormals(); }
    { const uv = face.attributes.uv, p = face.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, p.getX(i) * 1.1 + .5, p.getY(i) * 1.1); }
    const crumb = new THREE.MeshStandardMaterial({ map: tex(crumbCanvas({ base: '#e2cda2', hole: '#c2a273', seeds: 90, n: 700, stretch: 1.8 })), bumpMap: tex(crumbCanvas({ base: '#b0b0b0', hole: '#303030', n: 700, stretch: 1.8 }), { color: false }), bumpScale: 2, roughness: .9 });
    const f = mesh(face, crumb); f.position.z = .002; H.add(f);
    // thin crust rim on the cut edge
    const rim = []; for (const v of outline) rim.push(V(v.x, v.y, .001));
    H.add(mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(rim, true), 128, .013, 6, true), new THREE.MeshStandardMaterial({ color: 0xc48a4c, roughness: .75 })));
    H.rotation.y = -.5; H.position.set(1.15, 0, .35);
    G.add(H);
  }
  return G;
}
