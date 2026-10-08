// Compact 9×19 mm striker-fired pistol (display prop): polymer frame with stippled grip panels,
// finger grooves, undercut trigger guard and accessory rail; nitrided slide with front and rear
// serrations, ejection port with barrel hood, three-dot sights; threaded barrel for a suppressor.
// Built in side profile: x toward the muzzle, y up, z to the right.
import { THREE, RoundedBoxGeometry, V, mesh, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, label, GM, HM, slab, grooves } from '../kit.js';

export function build() {
  const G = new THREE.Group();
  const SW = .25; // slide width (25 mm)

  /* frame */
  const frame = [
    [1.72, .83], [1.72, .63], [1.6, .6], [1.2, .6], [1.19, .52], [1.165, .36], [1.12, .3], [1.08, .285], [.83, .285], [.76, .31], [.735, .38],
    // finger grooves down the front strap
    [.72, .42], [.69, .36], [.68, .3], [.655, .26], [.64, .2], [.615, .16], [.6, .1], [.575, .06], [.56, .0], [.53, -.06], [.5, -.12],
    [.47, -.16], [.44, -.18], [-.07, -.18], [-.1, -.13], [-.08, -.06], [.04, .3], [.12, .55], [.12, .6], [.04, .66], [-.07, .73], [-.08, .78], [-.02, .83]
  ];
  const guard = [[1.115, .56], [1.118, .38], [1.07, .335], [.85, .335], [.79, .37], [.785, .56]];
  const frameMat = GM.polymer.clone(); frameMat.color.set(0x2c2c2e);
  G.add(slab(frame, .27, frameMat, { holes: [guard], bevel: .026, segs: 5 }));
  // stippled grip panels, slightly proud of the frame
  const panel = [[.64, .45], [.6, .3], [.48, -.02], [.43, -.11], [-.03, -.11], [-.04, -.04], [.1, .38], [.14, .5]];
  G.add(slab(panel, .31, GM.stipple(0x1b1b1d), { bevel: .008 }));
  // accessory rail slots under the dust cover
  for (let k = 0; k < 3; k++) { const s = mesh(new THREE.BoxGeometry(.05, .03, .24), GM.dark); s.position.set(1.3 + k * .12, .6, 0); G.add(s); }
  // magazine base pad
  const pad = mesh(new RoundedBoxGeometry(.56, .07, .3, 3, .025), GM.polymer); pad.position.set(.19, -.2, 0); pad.rotation.z = .04; G.add(pad);
  // controls: magazine release, slide stop, takedown lever
  const mr = mesh(new RoundedBoxGeometry(.07, .07, .04, 2, .015), GM.polymer); mr.position.set(.76, .5, -.145); G.add(mr);
  const ss = slab([[.72, .79], [.93, .79], [.96, .82], [.72, .84]], .025, GM.nitride, { z: -.15, bevel: .005 }); G.add(ss);
  for (const s of [1, -1]) { const tk = mesh(new RoundedBoxGeometry(.11, .035, .02, 2, .008), GM.nitride); tk.position.set(1.03, .7, s * .142); G.add(tk); }
  // trigger with integral safety blade
  const tp = curve([V(.99, .58, 0), V(1.0, .5, 0), V(.985, .43, 0), V(.95, .39, 0)], 30);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .07, thick: .035, round: 4 }), GM.polymer));
  const blade = mesh(new RoundedBoxGeometry(.012, .1, .02, 1, .004), GM.dark); blade.position.set(1.0, .48, 0); G.add(blade);

  /* slide */
  const slide = [[0, .83], [1.86, .83], [1.86, 1.0], [1.78, 1.1], [.05, 1.1], [0, 1.05]];
  G.add(slab(slide, SW, GM.nitride, { bevel: .018, segs: 4 }));
  // top flat with chamfered edges along the slide
  for (const s of [1, -1]) { const ch = mesh(new THREE.BoxGeometry(1.72, .03, .03), GM.nitride); ch.position.set(.92, 1.095, s * .12); ch.rotation.x = s * .7; G.add(ch); }
  const stripe = mesh(new THREE.BoxGeometry(1.7, .004, .1), GM.blued); stripe.position.set(.92, 1.12, 0); G.add(stripe);
  // serrations, both sides, rear and front
  for (const s of [1, -1]) {
    G.add(grooves(.07, .33, 9, .96, .18, s * (SW / 2 + .019), { w: .014, d: .006, tilt: -.12 }));
    G.add(grooves(1.55, 1.76, 7, .96, .16, s * (SW / 2 + .019), { w: .014, d: .006, tilt: -.12 }));
  }
  // ejection port with exposed barrel hood
  const port = mesh(new THREE.BoxGeometry(.44, .17, .006), GM.dark); port.position.set(1.13, 1.0, SW / 2 + .018); G.add(port);
  const hood = mesh(new RoundedBoxGeometry(.42, .02, .16, 2, .006), GM.stainless); hood.position.set(1.12, 1.105, 0); G.add(hood);
  const hoodSide = mesh(new THREE.BoxGeometry(.4, .12, .006), GM.stainless); hoodSide.position.set(1.12, .99, SW / 2 + .02); G.add(hoodSide);
  // three-dot sights
  const rear = slab([[.06, 1.1], [.24, 1.1], [.22, 1.18], [.08, 1.18]], .2, GM.nitride, { bevel: .006 }); G.add(rear);
  const notch = mesh(new THREE.BoxGeometry(.2, .05, .045), GM.dark); notch.position.set(.15, 1.165, 0); G.add(notch);
  const front = slab([[1.73, 1.1], [1.8, 1.1], [1.79, 1.18], [1.745, 1.18]], .045, GM.nitride, { bevel: .004 }); G.add(front);
  const dot = (x, y, z, r = .012) => { const d = mesh(new THREE.CircleGeometry(r, 16), GM.white); d.position.set(x, y, z); d.rotation.y = -Math.PI / 2; G.add(d); };
  dot(.055, 1.15, .07); dot(.055, 1.15, -.07); dot(1.743, 1.155, 0, .011);
  const glow = mesh(new THREE.CircleGeometry(.006, 12), new THREE.MeshStandardMaterial({ color: 0x9cff9c, emissive: 0x2aff4a, emissiveIntensity: .8 }));
  glow.position.set(1.7425, 1.155, 0); glow.rotation.y = -Math.PI / 2; G.add(glow);
  // muzzle face: barrel, threads protruding for a suppressor, recoil spring guide
  const by = .99;
  G.add(mesh(latheAxis([[.063, 1.86], [.063, 1.87]], 'x', 40).translate(0, by, 0), GM.stainless));
  const th = []; for (let k = 0; k <= 16; k++) th.push([k % 2 ? .058 : .052, 1.87 + k * .0091]);
  th.push([.05, 2.02], [.03, 2.02]);
  G.add(mesh(latheAxis(th, 'x', 40).translate(0, by, 0), GM.stainless));
  const bore = mesh(new THREE.CircleGeometry(.03, 24), GM.dark); bore.rotation.y = Math.PI / 2; bore.position.set(2.021, by, 0); G.add(bore);
  const guide = mesh(new THREE.CircleGeometry(.035, 24), GM.dark); guide.rotation.y = Math.PI / 2; guide.position.set(1.861, .875, 0); G.add(guide);
  // markings
  const lm = label([['LV 17  ·  9×19', .75]], .5, .05, { color: '#8d9298', metal: .6, rough: .35 });
  lm.position.set(.95, .9, -(SW / 2 + .019)); lm.rotation.y = Math.PI; G.add(lm);
  const sn = label([['LV-104622', .8]], .22, .03, { color: '#6d7178' }); sn.position.set(1.42, .68, .141); G.add(sn);
  return G;
}
