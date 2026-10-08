// 600 mm spirit level: painted aluminium box section with milled reading edges, rubber end caps,
// level and plumb vials (acrylic blocks, green fluid, bubbles, gauge rings), mm scale, hang hole.
import { THREE, RoundedBoxGeometry, V, mesh, shapeFrom, rrPts, circlePts, extrude, label, HM } from '../kit.js';

function vial(len) {
  const V0 = new THREE.Group();
  V0.add(new THREE.Mesh(new THREE.CylinderGeometry(.068, .068, len, 32), HM.glass));
  const fluid = new THREE.Mesh(new THREE.CylinderGeometry(.06, .06, len - .02, 32), new THREE.MeshPhysicalMaterial({ color: 0xa4e534, emissive: 0x2c4a05, roughness: .1, transparent: true, opacity: .82 }));
  V0.add(fluid);
  for (const y of [-.075, .075]) { const r = mesh(new THREE.TorusGeometry(.069, .005, 8, 32), new THREE.MeshStandardMaterial({ color: 0x111111 })); r.rotation.x = Math.PI / 2; r.position.y = y; V0.add(r); }
  return V0;
}

export function build() {
  const G = new THREE.Group();
  const L = 6, H = .6, D = .3, y0 = H / 2;

  /* body: side profile with windows and hang hole, extruded through its thickness */
  const outline = rrPts(-L / 2, -H / 2, L, H, .02, 3);
  const win = rrPts(-.42, -.17, .84, .34, .1).reverse(), plumb = circlePts(2.3, 0, .19), hang = circlePts(-2.62, 0, .09);
  const body = mesh(extrude(shapeFrom(outline, [win, plumb, hang]), D, .008), HM.paint(0xe4b11d));
  body.position.y = y0; G.add(body);
  // milled aluminium reading faces
  for (const s of [1, -1]) { const e = mesh(new THREE.BoxGeometry(L - .1, .02, D + .006), HM.alu); e.position.y = y0 + s * (H / 2 + .004); G.add(e); }
  // rubber end caps
  for (const s of [1, -1]) { const c = mesh(new RoundedBoxGeometry(.14, H + .05, D + .04, 3, .03), HM.rubber); c.position.set(s * (L / 2 + .02), y0, 0); G.add(c); }
  // window frames
  const frame = HM.plastic(0x1b1b1c, .5);
  for (const s of [1, -1]) {
    const f = mesh(extrude(shapeFrom(rrPts(-.47, -.22, .94, .44, .13), [rrPts(-.42, -.17, .84, .34, .1).reverse()]), .02, .004), frame);
    f.position.set(0, y0, s * (D / 2 + .01)); G.add(f);
    const pr = mesh(new THREE.TorusGeometry(.215, .025, 10, 48), frame); pr.position.set(2.3, y0, s * (D / 2 + .01)); G.add(pr);
  }
  // level vial (horizontal) in an acrylic block
  const block = new THREE.Mesh(new THREE.BoxGeometry(.82, .3, D - .02), HM.glass); block.position.set(0, y0, 0); G.add(block);
  const lv = vial(.6); lv.rotation.z = Math.PI / 2; lv.position.set(0, y0 + .02, 0); G.add(lv);
  const bub = mesh(new THREE.SphereGeometry(.05, 24, 16), new THREE.MeshPhysicalMaterial({ color: 0xf6ffe0, roughness: .05, transparent: true, opacity: .7 }));
  bub.scale.set(1.5, .5, .9); bub.position.set(.01, y0 + .068, 0); G.add(bub);
  // plumb vial (vertical)
  const pv = vial(.32); pv.position.set(2.3, y0, 0); G.add(pv);
  const pb = bub.clone(); pb.scale.set(.5, 1.3, .9); pb.position.set(2.3, y0 + .1, .0); pb.rotation.z = Math.PI / 2; G.add(pb);
  // mm scale along the top edge and the maker's label
  const scale = label([['']], 5.0, .1, {
    draw: (g, W, Hh) => {
      g.fillStyle = '#111';
      for (let mm = 0; mm <= 500; mm += 1) { const x = 6 + mm / 500 * (W - 12), h = mm % 10 === 0 ? Hh * .6 : mm % 5 === 0 ? Hh * .42 : Hh * .25; g.fillRect(x - .8, 0, 1.6, h); }
      g.font = `600 ${Hh * .32}px "IBM Plex Mono", monospace`; g.textAlign = 'center';
      for (let cm = 0; cm <= 50; cm += 5) g.fillText(String(cm), 6 + cm / 50 * (W - 12), Hh * .85);
    }
  });
  scale.position.set(-.4, y0 + H / 2 - .07, D / 2 + .009); G.add(scale);
  const lb = label([['LV  600 mm', .6], ['±0.5 mm/m · MAGNETIC BASE', .4, 600]], .9, .2, { color: '#151515' });
  lb.position.set(-1.45, y0 - .1, D / 2 + .009); G.add(lb);
  return G;
}
