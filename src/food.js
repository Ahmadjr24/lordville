// Helpers for organic food assets: displaced "blob" surfaces with baked vertex colour,
// surface scattering (seeds, oats, crumbs) and bread crust / crumb textures.
// Units follow the kit: 1 scene unit = 10 cm.
import { THREE, V, mesh, mkCanvas, tex, fbm, noise3, smooth, clamp } from './kit.js';

// Surface defined by a function of the unit direction d -> point on the surface.
// Returns an indexed sphere-topology geometry with smooth normals and vertex colours.
export function blob(shape, color, { w = 160, h = 112 } = {}) {
  const g = new THREE.SphereGeometry(1, w, h);
  const pos = g.attributes.position, col = new Float32Array(pos.count * 3), d = V(), c = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    d.fromBufferAttribute(pos, i).normalize();
    const p = shape(d);
    pos.setXYZ(i, p.x, p.y, p.z);
    color(d, p, c); col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b;
  }
  g.setAttribute('color', new THREE.BufferAttribute(col, 3));
  g.computeVertexNormals();
  return g;
}

// Point and outward normal on a blob surface for direction d (finite differences in direction space).
export function surf(shape, d) {
  d = d.clone().normalize();
  const t1 = Math.abs(d.y) < .9 ? V(0, 1, 0).cross(d).normalize() : V(1, 0, 0).cross(d).normalize(), t2 = d.clone().cross(t1);
  const e = .004, p = shape(d);
  const a = shape(d.clone().addScaledVector(t1, e).normalize()).sub(p), b = shape(d.clone().addScaledVector(t2, e).normalize()).sub(p);
  const n = a.cross(b).normalize(); if (n.dot(d) < 0) n.negate();
  return { p, n };
}

// Instanced scatter of a small part over a blob surface. pick(rnd) returns a direction or null.
// Each instance lies flat on the surface (its local y along the normal) with a random twist.
export function scatter(shape, geo, mat, n, pick, { lift = 0, scale = [1, 1], tilt = .25, seed = 1 } = {}) {
  let s = seed * 9301 + 49297; const rnd = () => (s = (s * 9301 + 49297) % 233280) / 233280;
  const im = new THREE.InstancedMesh(geo, mat, n), m = new THREE.Matrix4(), q = new THREE.Quaternion(), tw = new THREE.Quaternion(), tq = new THREE.Quaternion();
  let k = 0, guard = 0;
  while (k < n && guard++ < n * 40) {
    const d = pick(rnd); if (!d) continue;
    const { p, n: nn } = surf(shape, d);
    q.setFromUnitVectors(V(0, 1, 0), nn);
    tw.setFromAxisAngle(V(0, 1, 0), rnd() * Math.PI * 2);
    tq.setFromAxisAngle(V(1, 0, 0), (rnd() - .5) * tilt);
    q.multiply(tw).multiply(tq);
    const sc = scale[0] + (scale[1] - scale[0]) * rnd();
    m.compose(p.addScaledVector(nn, lift * sc), q, V(sc, sc, sc)); im.setMatrixAt(k++, m);
  }
  im.count = k; im.castShadow = im.receiveShadow = true;
  return im;
}

// Per-instance colour variation for an InstancedMesh (hex list, picked at random with jitter).
export function tint(im, hexes, jitter = .08, seed = 3) {
  let s = seed; const rnd = () => (s = (s * 16807) % 2147483647) / 2147483647;
  const c = new THREE.Color();
  for (let i = 0; i < im.count; i++) { c.set(hexes[Math.floor(rnd() * hexes.length)]); c.offsetHSL(0, 0, (rnd() - .5) * jitter); im.setColorAt(i, c); }
  im.instanceColor.needsUpdate = true;
  return im;
}

// Mottled crust / bake colour map + bump (blisters, flour, tiny cracks)
export function crustCanvas({ base = '#b8743a', spots = ['#8a4a1e', '#d79b5a', '#6b3412'], flour = 0, size = 512, n = 2600 } = {}) {
  const c = mkCanvas(size), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  let s = 7; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < n; k++) {
    g.globalAlpha = .08 + r() * .22; g.fillStyle = spots[Math.floor(r() * spots.length)];
    const x = r() * size, y = r() * size, rr = 1 + r() * 9;
    g.beginPath(); g.ellipse(x, y, rr, rr * (.4 + r() * .6), r() * Math.PI, 0, Math.PI * 2); g.fill();
  }
  if (flour) { g.fillStyle = '#f4ead8'; for (let k = 0; k < flour; k++) { g.globalAlpha = .05 + r() * .25; g.beginPath(); g.arc(r() * size, r() * size, .5 + r() * 2.5, 0, Math.PI * 2); g.fill(); } }
  g.globalAlpha = 1;
  return c;
}
export function bumpCanvas({ size = 512, n = 1800, crack = 60 } = {}) {
  const c = mkCanvas(size), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
  let s = 11; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < n; k++) {
    const v = r() > .5 ? 200 : 40; g.fillStyle = `rgba(${v},${v},${v},${.08 + r() * .15})`;
    g.beginPath(); g.arc(r() * size, r() * size, 1 + r() * 6, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = 'rgba(30,30,30,.5)';
  for (let k = 0; k < crack; k++) {
    let x = r() * size, y = r() * size; g.lineWidth = .5 + r() * 1.2; g.beginPath(); g.moveTo(x, y);
    for (let j = 0; j < 5; j++) { x += (r() - .5) * 26; y += (r() - .5) * 26; g.lineTo(x, y); } g.stroke();
  }
  return c;
}
// open bread crumb (alveoli) for cut faces
export function crumbCanvas({ base = '#efe0c4', hole = '#b89a6e', size = 512, n = 900, seeds = 0 } = {}) {
  const c = mkCanvas(size), g = c.getContext('2d');
  g.fillStyle = base; g.fillRect(0, 0, size, size);
  let s = 5; const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
  for (let k = 0; k < n; k++) {
    const x = r() * size, y = r() * size, rr = 1 + Math.pow(r(), 3) * 14;
    g.fillStyle = hole; g.globalAlpha = .35 + r() * .4;
    g.beginPath(); g.ellipse(x, y, rr * (1 + r()), rr, r() * Math.PI, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#fff8ea'; g.globalAlpha = .3; g.beginPath(); g.ellipse(x - rr * .3, y - rr * .3, rr * .5, rr * .35, 0, 0, Math.PI * 2); g.fill();
  }
  const sc = ['#3a2614', '#e9d9b0', '#5c4a2a'];
  for (let k = 0; k < seeds; k++) { g.globalAlpha = .9; g.fillStyle = sc[k % 3]; g.beginPath(); g.ellipse(r() * size, r() * size, 3 + r() * 3, 1.6 + r(), r() * Math.PI, 0, Math.PI * 2); g.fill(); }
  g.globalAlpha = 1;
  return c;
}

export { fbm, noise3, smooth, clamp };
