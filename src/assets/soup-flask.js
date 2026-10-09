// Garden soup flask (display prop, after a 16 oz / 470 ml vacuum-insulated stainless food jar):
// 94 mm body on a 98 mm base band, two grip grooves either side of a raised belly band with a black
// badge, dark neck seal, threaded neck. Opened: the screw lid (which doubles as a bowl) and the
// inner stopper stand beside it, and the jar holds a tomato-based garden vegetable soup with
// carrot, courgette, peas, celery and herbs, the folding steel spoon resting in it.
// y up, the jar at the origin.
import { THREE, V, mesh, mkCanvas, tex, latheAxis, GM } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  // bead-blasted stainless, brushing running around the circumference
  const brush = GM.stainless.roughnessMap.clone(); brush.center.set(.5, .5); brush.rotation = Math.PI / 2; brush.repeat.set(1, 6); brush.needsUpdate = true;
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xb8bbbe, metalness: 1, roughness: .45, roughnessMap: brush });
  const steelIn = new THREE.MeshStandardMaterial({ color: 0xc9ccd0, metalness: 1, roughness: .3, side: THREE.DoubleSide });
  const seal = new THREE.MeshStandardMaterial({ color: 0x3a3c3f, roughness: .7 });
  const L = (pts, mat, seg = 96) => mesh(latheAxis(pts, 'y', seg), mat);

  /* jar body: base band, lower body, groove, raised belly band, groove, upper body, shoulder, neck */
  G.add(L([[0, 0], [.47, 0], [.49, .012], [.49, .17], [.472, .185], [.47, .19], [.47, .405], [.462, .41], [.462, .435], [.48, .445],
    [.48, .835], [.462, .845], [.462, .87], [.47, .875], [.47, .95], [.452, .975], [.43, .985], [.43, 1.0]], steel));
  G.add(L([[.43, .985], [.445, .99], [.445, 1.02], [.41, 1.025]], seal));                 // neck seal ring
  // threaded neck and inner wall
  const th = []; for (let k = 0; k <= 12; k++) th.push([k % 2 ? .405 : .395, 1.02 + k * .011]);
  G.add(L([[.41, 1.02], ...th, [.38, 1.16], [.37, 1.155]], steel));
  G.add(L([[.37, 1.155], [.37, .14], [.3, .1], [0, .1]], steelIn));

  /* garden vegetable soup */
  const sy = .93;
  const soupC = mkCanvas(512), sg = soupC.getContext('2d');
  { const gr = sg.createRadialGradient(256, 256, 40, 256, 256, 256); gr.addColorStop(0, '#c4602f'); gr.addColorStop(1, '#a84b22'); sg.fillStyle = gr; sg.fillRect(0, 0, 512, 512);
    let r = 5; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
    for (let k = 0; k < 160; k++) { sg.globalAlpha = .5; sg.fillStyle = ['#e2a04a', '#8a3518', '#d77a3a'][k % 3]; sg.beginPath(); sg.arc(rnd() * 512, rnd() * 512, 2 + rnd() * 10, 0, Math.PI * 2); sg.fill(); }   // oil droplets, tomato bits
    for (let k = 0; k < 240; k++) { sg.globalAlpha = .9; sg.fillStyle = '#3f6f2a'; sg.fillRect(rnd() * 512, rnd() * 512, 2 + rnd() * 3, 1 + rnd() * 2); } }   // herb flecks
  const soup = mesh(new THREE.CircleGeometry(.37, 64).rotateX(-Math.PI / 2), new THREE.MeshPhysicalMaterial({ map: tex(soupC), roughness: .25, clearcoat: .8, clearcoatRoughness: .1 }));
  soup.position.y = sy; G.add(soup);
  // meniscus where the soup meets the wall
  const men = mesh(new THREE.TorusGeometry(.366, .008, 6, 64).rotateX(Math.PI / 2), new THREE.MeshPhysicalMaterial({ color: 0xa84b22, roughness: .25, clearcoat: .8 })); men.position.y = sy + .002; G.add(men);
  // vegetables floating, partly under the surface
  let r = 77; const rnd = () => (r = (r * 16807) % 2147483647) / 2147483647;
  const veg = (geo, hex, n, sink, rough = .45) => {
    const im = new THREE.InstancedMesh(geo, new THREE.MeshPhysicalMaterial({ color: hex, roughness: rough, clearcoat: .6, clearcoatRoughness: .2 }), n), m = new THREE.Matrix4();
    for (let k = 0; k < n; k++) {
      const a = rnd() * Math.PI * 2, q = Math.sqrt(rnd()) * .31, s = .8 + rnd() * .4;
      m.compose(V(Math.cos(a) * q, sy - sink * s, Math.sin(a) * q), new THREE.Quaternion().setFromEuler(new THREE.Euler(rnd() * 3, rnd() * 3, rnd() * 3)), V(s, s, s)); im.setMatrixAt(k, m);
    }
    im.castShadow = im.receiveShadow = true; G.add(im);
  };
  const cube = new THREE.BoxGeometry(.06, .06, .06, 2, 2, 2); { const p = cube.attributes.position; for (let i = 0; i < p.count; i++) { const v = V().fromBufferAttribute(p, i); v.multiplyScalar(1 - .12 * (Math.abs(v.x) + Math.abs(v.y) + Math.abs(v.z)) / .09); p.setXYZ(i, v.x, v.y, v.z); } cube.computeVertexNormals(); }
  veg(cube, 0xe0772a, 14, .025);                                                          // carrot dice
  veg(new THREE.SphereGeometry(.026, 12, 8), 0x6f9a2e, 16, .012, .35);                     // peas
  const zuc = new THREE.CylinderGeometry(.07, .07, .025, 20, 1, false, 0, Math.PI); veg(zuc, 0xcfd89a, 7, .01);   // courgette half-moons
  const zskin = new THREE.CylinderGeometry(.072, .072, .026, 20, 1, true, 0, Math.PI); veg(zskin, 0x3f5f22, 7, .01);
  veg(new THREE.BoxGeometry(.06, .03, .04), 0x9fb565, 8, .015);                           // celery
  veg(new THREE.BoxGeometry(.05, .035, .05), 0xd9cfa8, 9, .02, .6);                        // potato

  /* black badge on the belly band */
  {
    const c = mkCanvas(1000, 360), g = c.getContext('2d');
    const path = (i) => { g.beginPath(); g.moveTo(40 + i, 30 + i); g.quadraticCurveTo(500, 60 + i, 960 - i, 30 + i); g.quadraticCurveTo(990 - i, 180, 960 - i, 330 - i); g.quadraticCurveTo(500, 300 - i, 40 + i, 330 - i); g.quadraticCurveTo(10 + i, 180, 40 + i, 30 + i); g.closePath(); };
    path(0); g.fillStyle = '#e4e6e9'; g.fill(); path(16); g.fillStyle = '#18191b'; g.fill();
    g.fillStyle = '#f2f2f2'; g.font = '800 150px "IBM Plex Sans", Arial'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('LORDVILLE', 500, 186);
    const b = mesh(new THREE.CylinderGeometry(.483, .483, .18, 48, 1, true, -.53, 1.06), new THREE.MeshStandardMaterial({ map: tex(c, { clampEdge: true }), alphaTest: .5, roughness: .35, metalness: .3 }));
    b.position.y = .64; G.add(b);
  }

  /* screw lid beside the jar, standing top-up */
  const lid = new THREE.Group(); lid.position.set(1.05, 0, -.35); G.add(lid);
  lid.add(L([[.4, 0], [.43, .005], [.43, .33], [.425, .37], [.41, .395], [.39, .4], [.37, .4], [.36, .392], [0, .392]], steel));
  lid.add(L([[.43, .005], [.39, .005], [.39, .04]], steelIn));
  // inner stopper: grey polypropylene plug with a grip ridge and silicone seal
  const plug = new THREE.Group(); plug.position.set(.62, 0, .72); plug.rotation.set(0, .4, 0); G.add(plug);
  const pp = new THREE.MeshStandardMaterial({ color: 0x9a9da1, roughness: .55 });
  plug.add(L([[0, 0], [.33, 0], [.35, .02], [.35, .17], [.372, .18], [.372, .21], [.36, .22], [0, .22]], pp));
  plug.add(L([[.352, .06], [.362, .07], [.362, .12], [.352, .13]], new THREE.MeshStandardMaterial({ color: 0x4f5357, roughness: .8 })));
  const ridge = mesh(new THREE.BoxGeometry(.5, .07, .06), pp); ridge.position.y = .25; plug.add(ridge);
  plug.rotation.x = Math.PI; plug.position.y = .25;     // shown upside down, seal side visible

  /* folding spoon, unfolded, resting in the soup against the rim */
  {
    const S = new THREE.Group();
    const bowlG = new THREE.SphereGeometry(1, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2); bowlG.scale(.19, .05, .14);
    const sp = mesh(bowlG, steelIn); S.add(sp);   // lower hemisphere: dish facing up
    const handle = new THREE.Shape(); handle.moveTo(.17, -.05); handle.lineTo(1.25, -.06); handle.quadraticCurveTo(1.3, 0, 1.25, .06); handle.lineTo(.17, .05); handle.closePath();
    const hg = new THREE.ExtrudeGeometry(handle, { depth: .02, bevelEnabled: true, bevelThickness: .004, bevelSize: .004, bevelSegments: 2 }); hg.rotateX(Math.PI / 2);
    const h = mesh(hg, steel); h.position.y = .03; S.add(h);
    const pin = mesh(new THREE.CylinderGeometry(.025, .025, .14, 16), steelIn); pin.rotation.x = Math.PI / 2; pin.position.set(.6, .03, 0); S.add(pin);
    S.rotation.set(0, .5, .75); S.position.set(-.1, sy + .02, .05); G.add(S);
  }
  return G;
}
