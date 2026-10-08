// Zip-seal baggie holding four cannabis buds and some shake: clear PE film with crinkles,
// red zip track, write-on panel. Buds are lumpy colas covered in calyxes, orange pistils,
// sugar leaves and frosty trichomes. Built upright (zip at +y, front +z), then laid flat.
import { THREE, V, fbm, mesh, mkCanvas, tex, SoftBox, conformPlane, freeFrames, sweepGeo } from '../kit.js';

let seedN = 1;
const rnd = () => { seedN = (seedN * 16807) % 2147483647; return (seedN - 1) / 2147483646; };
const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _s = new THREE.Vector3(), _up = V(0, 1, 0);

function leafShape() {
  const s = new THREE.Shape(); s.moveTo(0, 0);
  const n = 7;
  for (let k = 1; k <= n; k++) { const t = k / n, w = .028 * Math.sin(Math.PI * t) ** .8; s.lineTo(w + .006, t * .13 - .008); s.lineTo(w, t * .13); }
  for (let k = n; k >= 1; k--) { const t = k / n, w = .028 * Math.sin(Math.PI * t) ** .8; s.lineTo(-w, t * .13); s.lineTo(-w - .006, t * .13 - .008); }
  s.lineTo(0, 0);
  return s;
}

function bud(len, rad, seed) {
  seedN = seed * 7919 + 13;
  const G = new THREE.Group();
  // core: tapered, lumpy cola
  const g = new THREE.IcosahedronGeometry(1, 5), p = g.attributes.position, col = [];
  const v = V(), c = new THREE.Color();
  for (let i = 0; i < p.count; i++) {
    v.fromBufferAttribute(p, i);
    const y = v.y, taper = 1 - .7 * Math.pow(Math.max(0, y), 1.6) - .25 * Math.pow(Math.max(0, -y), 3);
    const n = fbm(v.x * 2.4 + seed, v.y * 2.4, v.z * 2.4), n2 = fbm(v.x * 7 + seed, v.y * 7 + 3, v.z * 7);
    const k = .78 + .45 * n + .18 * n2;
    p.setXYZ(i, v.x * rad * taper * k, y * len / 2 * (.92 + .16 * n), v.z * rad * taper * k);
    c.setHSL(.2 + .05 * n2 - .03 * n, .55 + .2 * n, .04 + .04 * n2);
    if (n2 > .68) c.lerp(new THREE.Color(0x5b3a6b), .4); // purple tint in cold spots
    col.push(c.r, c.g, c.b);
  }
  g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
  g.computeVertexNormals();
  G.add(mesh(g, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: .78 })));

  const nrm = g.attributes.normal, surf = i => ({ p: V().fromBufferAttribute(p, i), n: V().fromBufferAttribute(nrm, i) });
  // calyxes: teardrop pods packed over the surface
  const cal = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ roughness: .7 }), 320);
  for (let k = 0; k < cal.count; k++) {
    const { p: q, n } = surf(Math.floor(rnd() * p.count));
    const sz = .018 + rnd() * .016;
    _q.setFromUnitVectors(_up, n.clone().add(V(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(.8)).normalize());
    _m.compose(q.addScaledVector(n, sz * .4), _q, _s.set(sz * .65, sz * 1.2, sz * .65));
    cal.setMatrixAt(k, _m);
    cal.setColorAt(k, c.setHSL(.19 + rnd() * .08, .5 + rnd() * .25, .045 + rnd() * .05));
  }
  G.add(cal);
  // pistils: curly orange hairs
  const curl = new THREE.CatmullRomCurve3([V(0, 0, 0), V(.004, .015, 0), V(-.002, .03, .004), V(.006, .042, .002)]);
  const pis = new THREE.InstancedMesh(new THREE.TubeGeometry(curl, 8, .0016, 4), new THREE.MeshStandardMaterial({ roughness: .6 }), 260);
  for (let k = 0; k < pis.count; k++) {
    const { p: q, n } = surf(Math.floor(rnd() * p.count));
    _q.setFromUnitVectors(_up, n.clone().add(V(rnd() - .5, rnd() - .5, rnd() - .5)).normalize());
    _m.compose(q.addScaledVector(n, .01), _q, _s.setScalar(.7 + rnd() * .8));
    pis.setMatrixAt(k, _m);
    pis.setColorAt(k, c.setHSL(.06 + rnd() * .04, .85, .14 + rnd() * .1));
  }
  G.add(pis);
  // sugar leaves poking out
  const leafMat = new THREE.MeshStandardMaterial({ color: 0x3a5222, roughness: .75, side: THREE.DoubleSide });
  const lg = new THREE.ShapeGeometry(leafShape(), 2);
  for (let k = 0; k < 7; k++) {
    const { p: q, n } = surf(Math.floor(rnd() * p.count));
    const leaf = mesh(lg, leafMat);
    leaf.position.copy(q);
    leaf.quaternion.setFromUnitVectors(_up, n.clone().lerp(V(0, 1, 0), .3).normalize());
    leaf.rotateY(rnd() * Math.PI); leaf.rotateX(-.5 - rnd() * .5);
    leaf.scale.setScalar(.7 + rnd() * .6);
    G.add(leaf);
  }
  // trichomes: frost over everything
  const tri = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 6, 4), new THREE.MeshStandardMaterial({ color: 0xd8d4c4, roughness: .35 }), 1400);
  for (let k = 0; k < tri.count; k++) {
    const { p: q, n } = surf(Math.floor(rnd() * p.count));
    q.addScaledVector(n, .02 + rnd() * .02).add(V(rnd() - .5, rnd() - .5, rnd() - .5).multiplyScalar(.03));
    _m.compose(q, _q.identity(), _s.setScalar(.0018 + rnd() * .0015));
    tri.setMatrixAt(k, _m);
  }
  G.add(tri);
  // cut stem at the base
  const stem = mesh(new THREE.CylinderGeometry(.014, .018, .08, 10), new THREE.MeshStandardMaterial({ color: 0x8a8a52, roughness: .8 }));
  stem.position.y = -len / 2 - .02; G.add(stem);
  return G;
}

export function build() {
  const outer = new THREE.Group(), G = new THREE.Group(); outer.add(G);

  /* buds, lying inside the bag (bag local: x across, y up to the zip, z thickness) */
  for (const [x, y, ang, len, rad, seed] of [[-.17, -.2, .5, .44, .11, 1], [.2, -.3, -.9, .38, .1, 2], [-.08, .16, 1.55, .36, .1, 3], [.22, .14, .25, .3, .09, 4]]) {
    const b = bud(len, rad, seed);
    b.position.set(x, y, (seed % 2 ? -.01 : .01)); b.rotation.set(0, seed * 1.3, ang, 'ZYX');
    G.add(b);
  }
  // shake settled at the bottom
  const crumbs = new THREE.InstancedMesh(new THREE.IcosahedronGeometry(1, 0), new THREE.MeshStandardMaterial({ roughness: .8 }), 90);
  const c = new THREE.Color();
  seedN = 99;
  for (let k = 0; k < crumbs.count; k++) {
    _q.setFromEuler(new THREE.Euler(rnd() * 6, rnd() * 6, rnd() * 6));
    _m.compose(V((rnd() - .5) * .8, -.52 + rnd() * .1, (rnd() - .5) * .1), _q, _s.set(.008 + rnd() * .012, .006 + rnd() * .008, .01 + rnd() * .012));
    crumbs.setMatrixAt(k, _m); crumbs.setColorAt(k, c.setHSL(.2 + rnd() * .06, .5, .05 + rnd() * .05));
  }
  G.add(crumbs);

  /* the bag */
  const W = .96, H = 1.22;
  const bag = new SoftBox({ w: W, h: H, d: .03, r: .014, center: V(0, -.04, 0), bz: .15, pw: 3.2, wrinkle: .012, wrinkleFreq: 4.5, seed: 8 });
  const film = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .12, transparent: true, opacity: .14, depthWrite: false, clearcoat: 1, clearcoatRoughness: .06, side: THREE.DoubleSide });
  const shell = new THREE.Mesh(bag.geometry(.02), film); shell.castShadow = false; G.add(shell);
  // flat welded side seals
  for (const sx of [-1, 1]) {
    const seal = new THREE.Mesh(new THREE.BoxGeometry(.04, H, .008), film); seal.position.set(sx * (W / 2 + .01), -.04, 0); G.add(seal);
  }
  // zip track: red interlocking profile + clear partner, and the lip above it
  const zy = .5, track = [];
  for (let i = 0; i <= 60; i++) track.push(V(-W / 2 - .02 + (W + .04) * i / 60, zy, 0));
  const F = freeFrames(track, V(0, 1, 0), V(0, 0, 1));
  G.add(mesh(sweepGeo(F, { center: true, width: .03, thick: .045, round: 3 }), new THREE.MeshPhysicalMaterial({ color: 0xc81e2a, roughness: .35, clearcoat: .5 })));
  for (const dy of [-.03, .03]) {
    const ridge = track.map(q => q.clone().add(V(0, dy, 0)));
    const rm = new THREE.Mesh(sweepGeo(freeFrames(ridge, V(0, 1, 0), V(0, 0, 1)), { center: true, width: .014, thick: .03, round: 2 }), film);
    rm.castShadow = false; G.add(rm);
  }
  const lip = new THREE.Mesh(new THREE.BoxGeometry(W + .04, .14, .01), film); lip.position.y = zy + .1; lip.castShadow = false; G.add(lip);

  /* white write-on panel with marker */
  const pc = mkCanvas(768, 384), pg = pc.getContext('2d');
  pg.fillStyle = '#f7f7f4'; pg.fillRect(0, 0, 768, 384);
  pg.strokeStyle = '#9a9a9a'; pg.lineWidth = 3;
  for (const y of [150, 250, 350]) { pg.beginPath(); pg.moveTo(30, y); pg.lineTo(738, y); pg.stroke(); }
  pg.fillStyle = '#141414'; pg.font = '700 120px "Comic Sans MS", "Bradley Hand", "Segoe Print", cursive';
  pg.fillText('3.5 g', 60, 130);
  pg.font = '600 76px "Comic Sans MS", "Bradley Hand", "Segoe Print", cursive'; pg.fillText('OG Kush', 80, 235);
  const panelMat = new THREE.MeshStandardMaterial({ map: tex(pc, { clampEdge: true }), roughness: .6, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 });
  G.add(mesh(conformPlane(bag, V(.12, .36, .1), V(1, 0, 0), V(0, 1, 0), .6, .2, .004, 30), panelMat));

  G.rotation.x = -Math.PI / 2;
  return outer;
}
