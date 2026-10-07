// Arming sword: fullered lenticular blade, curved crossguard with langets,
// leather-wrapped grip with risers, steel ferrules and a wheel pommel.
import { THREE, RoundedBoxGeometry, V, clamp, smooth, mesh, tex, lighten, curve, freeFrames, sweepGeo, bladeGeo, brushedCanvas, leatherCanvas } from '../kit.js';

export function build() {
  const G = new THREE.Group();

  const brushed = brushedCanvas({ edges: [0, 1], edgeW: .1 });
  const steel = new THREE.MeshPhysicalMaterial({
    color: 0xd9dde2, metalness: 1, roughness: .5,
    roughnessMap: tex(brushed, { repeat: [1, 3], color: false }),
    bumpMap: tex(brushed, { repeat: [1, 3], color: false }), bumpScale: .15,
    clearcoat: .15, clearcoatRoughness: .3
  });
  const darkSteel = new THREE.MeshPhysicalMaterial({
    color: 0xb9bec4, metalness: 1, roughness: .7,
    roughnessMap: tex(brushedCanvas({ w: 128, h: 512, edges: [], base: 120 }), { repeat: [2, 2], color: false })
  });

  /* blade: 80 cm, distal taper, fuller over the first 60 % */
  const len = 8, th = t => .042 * (1 - .55 * t);
  const w = t => {
    let v = .56 * (1 - .38 * t);
    if (t > .86) v *= Math.pow(Math.sin(Math.PI / 2 * clamp((1 - t) / .14, 0, 1)), .85);
    return v;
  };
  const blade = bladeGeo({
    len, nAlong: 320, nAcross: 64,
    spine: t => -w(t) / 2, edge: t => w(t) / 2,
    half: (t, u) => {
      const x = 2 * u - 1;
      const e = smooth(0, .28, 1 - Math.abs(x));
      let z = th(t) * (1 - .3 * x * x) * Math.pow(e, .9);
      const fade = smooth(.02, .08, t) * (1 - smooth(.54, .63, t));
      if (fade > 0) z -= th(t) * .4 * fade * Math.exp(-Math.pow(x / (.2 * (.45 + .55 * fade)), 4));
      return z;
    }
  });
  blade.rotateX(Math.PI);
  blade.translate(0, .06, 0);
  G.add(mesh(blade, steel));

  /* crossguard */
  {
    const pts = [];
    for (let i = 0; i <= 120; i++) { const x = -1.12 + 2.24 * i / 120; pts.push(V(x, -.075 * Math.pow(Math.abs(x) / 1.12, 2.2), 0)); }
    const F = freeFrames(pts, V(0, 0, 1), V(0, 1, 0));
    const flare = u => Math.max(smooth(.07, 0, u), smooth(.93, 1, u));
    const taper = u => 1 - .3 * Math.pow(Math.abs(u - .5) * 2, 1.3);
    G.add(mesh(sweepGeo(F, {
      center: true, width: .2, P: 32, round: 5, vScale: 3,
      widthFn: u => .2 * taper(u) + .08 * flare(u),
      thickFn: u => .17 * taper(u) + .06 * flare(u)
    }), darkSteel));
    for (const sx of [1, -1]) {
      const knob = mesh(new THREE.SphereGeometry(.105, 32, 20), darkSteel);
      knob.scale.set(.7, 1, 1.15); knob.position.set(sx * 1.13, -.075, 0);
      G.add(knob);
    }
    const block = mesh(new RoundedBoxGeometry(.42, .24, .27, 4, .06), darkSteel);
    block.position.y = -.01; G.add(block);
    // langets pressed onto the blade flats
    const s = new THREE.Shape();
    s.moveTo(-.1, 0); s.lineTo(.1, 0); s.quadraticCurveTo(.07, -.25, .015, -.4); s.quadraticCurveTo(0, -.42, -.015, -.4); s.quadraticCurveTo(-.07, -.25, -.1, 0);
    for (const sz of [1, -1]) {
      const g = new THREE.ExtrudeGeometry(s, { depth: .016, bevelEnabled: true, bevelThickness: .004, bevelSize: .005, bevelSegments: 2 });
      g.translate(0, -.1, sz > 0 ? .043 : -.059);
      G.add(mesh(g, darkSteel));
    }
  }

  /* grip: oval, swelled, two risers under the leather */
  const y0 = .13, y1 = 2.1;
  {
    const pts = [];
    for (let i = 0; i <= 140; i++) {
      const y = y0 + (y1 - y0) * i / 140, k = (y - y0) / (y1 - y0);
      let r = .132 + .028 * Math.sin(Math.PI * k);
      for (const yr of [.75, 1.45]) r += .011 * Math.exp(-Math.pow((y - yr) / .045, 2));
      pts.push(new THREE.Vector2(r, y));
    }
    const lc = leatherCanvas(6);
    const leather = new THREE.MeshPhysicalMaterial({
      color: 0x3d2516, roughness: .62, sheen: .4, sheenColor: new THREE.Color(0x8a5a3a),
      map: tex(lighten(lc, .45), { repeat: [1, 2.2] }), bumpMap: tex(lc, { repeat: [1, 2.2], color: false }), bumpScale: 3
    });
    const grip = mesh(new THREE.LatheGeometry(pts, 64), leather);
    grip.scale.z = .8; G.add(grip);
    for (const [y, r] of [[y0 + .03, .148], [y1 - .03, .145]]) {
      const f = mesh(new THREE.CylinderGeometry(r, r + .006, .1, 48), darkSteel);
      f.scale.z = .82; f.position.y = y; G.add(f);
      const lip = mesh(new THREE.TorusGeometry(r + .004, .012, 10, 48), darkSteel);
      lip.rotation.x = Math.PI / 2; lip.scale.y = .82; lip.position.y = y + (y < 1 ? -.05 : .05); G.add(lip);
    }
  }

  /* wheel pommel + peen block */
  {
    const prof = [[.001, .15], [.12, .15], [.155, .115], [.2, .1], [.3, .125], [.38, .1], [.42, .05], [.43, 0], [.42, -.05], [.38, -.1], [.3, -.125], [.2, -.1], [.155, -.115], [.12, -.15], [.001, -.15]]
      .map(([r, h]) => new THREE.Vector2(r, h));
    const g = new THREE.LatheGeometry(prof, 72);
    g.rotateX(Math.PI / 2);
    const pommel = mesh(g, steel);
    pommel.position.y = y1 + .44; G.add(pommel);
    const neck = mesh(new THREE.CylinderGeometry(.08, .1, .1, 32), darkSteel); neck.position.y = y1 + .05; G.add(neck);
    const peen = mesh(new RoundedBoxGeometry(.13, .09, .13, 3, .035), darkSteel); peen.position.y = y1 + .9; G.add(peen);
  }

  return G;
}
