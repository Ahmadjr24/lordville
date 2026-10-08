// 7.5 m / 25 ft tape measure: yellow case with rubber bumper, lock button, belt clip,
// cupped steel blade pulled out with printed cm/inch scale and a riveted end hook.
import { THREE, RoundedBoxGeometry, V, mesh, mkCanvas, tex, freeFrames, sweepGeo, label, HM } from '../kit.js';

function bladeTex(len) {
  const W = 4096, H = 256, c = mkCanvas(W, H), g = c.getContext('2d'), pxcm = W / (len * 10);
  g.fillStyle = '#f1c21b'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#111';
  for (let mm = 0; mm <= len * 100; mm++) {
    const x = W - mm * pxcm / 10, h = mm % 10 === 0 ? 70 : mm % 5 === 0 ? 46 : 26;
    g.fillRect(x - 1, 0, 2, h);
    if (mm % 10 === 0 && mm) { g.font = '700 40px "IBM Plex Sans", Arial'; g.textAlign = 'center'; g.fillStyle = mm % 100 === 0 ? '#c4161e' : '#111'; g.fillText(String(mm / 10), x - 18, 110); g.fillStyle = '#111'; }
  }
  // inch scale along the other edge
  const pxin = pxcm * 2.54;
  for (let s = 0; s <= len * 10 / 2.54 * 16; s++) {
    const x = W - s * pxin / 16, h = s % 16 === 0 ? 70 : s % 8 === 0 ? 50 : s % 4 === 0 ? 36 : 22;
    g.fillRect(x - 1, H - h, 2, h);
    if (s % 16 === 0 && s) { g.font = '700 40px "IBM Plex Sans", Arial'; g.textAlign = 'center'; g.fillText(String(s / 16), x - 18, H - 92); }
  }
  return c;
}

export function build() {
  const G = new THREE.Group();
  const S = .76, D = .36;
  const caseG = new THREE.Group(); caseG.position.y = S / 2; G.add(caseG);
  caseG.add(mesh(new RoundedBoxGeometry(S, S, D, 6, .16), HM.plastic(0xf0b81c, .38)));
  caseG.add(mesh(new RoundedBoxGeometry(S + .03, S + .03, D - .08, 6, .17), HM.rubber));
  // side badge
  const badge = label([['7.5 m', .55], ['25 ft', .45, 600]], .3, .2, { color: '#111', align: 'center' });
  badge.position.set(-.02, .03, D / 2 + .002); caseG.add(badge);
  const ring = mesh(new THREE.TorusGeometry(.2, .012, 8, 48), HM.rubber); ring.position.set(-.02, .03, D / 2); caseG.add(ring);
  // lock button on the top-front
  const lock = mesh(new RoundedBoxGeometry(.2, .08, .14, 3, .03), HM.plastic(0x1b1b1c, .5)); lock.position.set(.18, S / 2 + .03, 0); lock.rotation.z = -.35; caseG.add(lock);
  // belt clip on the back side
  const cp = [V(-.2, .3, -D / 2), V(-.2, .35, -D / 2 - .05), V(-.2, .1, -D / 2 - .06), V(-.2, -.22, -D / 2 - .035)];
  for (const dx of [0]) {
    const F = freeFrames(cp.map(p => p.clone().add(V(dx, 0, 0))), V(1, 0, 0), V(0, 0, -1));
    caseG.add(mesh(sweepGeo(F, { center: true, width: .2, thick: .016, round: 8 }), HM.chrome));
  }
  // mouth and blade
  const mouth = mesh(new RoundedBoxGeometry(.06, .08, .3, 2, .02), HM.plastic(0x1b1b1c, .6)); mouth.position.set(S / 2 + .01, -S / 2 + .07, 0); caseG.add(mouth);
  const len = 1.25, bw = .25, bg = new THREE.PlaneGeometry(len, bw, 120, 10);
  const p = bg.attributes.position;
  for (let i = 0; i < p.count; i++) { const z = p.getY(i), x = p.getX(i); p.setXYZ(i, x, -.018 * (1 - (2 * z / bw) ** 2), z); }
  bg.computeVertexNormals();
  const blade = mesh(bg, new THREE.MeshPhysicalMaterial({ map: tex(bladeTex(len), { clampEdge: true }), roughness: .35, clearcoat: .8, side: THREE.DoubleSide }));
  blade.position.set(S / 2 + len / 2, .085, 0); G.add(blade);
  // end hook with rivets
  const hook = mesh(new RoundedBoxGeometry(.02, .12, .27, 2, .006), HM.satin); hook.position.set(S / 2 + len + .01, .04, 0); G.add(hook);
  const tab = mesh(new RoundedBoxGeometry(.09, .01, .2, 2, .004), HM.satin); tab.position.set(S / 2 + len - .03, .075, 0); G.add(tab);
  for (const z of [-.05, .05]) { const r = mesh(new THREE.CylinderGeometry(.014, .014, .012, 12), HM.satin); r.position.set(S / 2 + len - .04, .082, z); G.add(r); }
  return G;
}
