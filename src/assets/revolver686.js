// Stainless 4 in .357 Magnum double-action revolver (display prop, 686/66 pattern), traced from a
// photograph of the left side and scaled to its 243 mm overall length. Brushed stainless frame
// with top strap and cylinder window, six-shot fluted cylinder, half-lug barrel with the ejector
// rod visible in its shroud, pinned red-insert ramp front sight, adjustable rear sight, spurred
// hammer, smooth trigger, black finger-groove rubber grip, thumbpiece and sideplate screws.
// x toward the muzzle, y up, z = the gun's right side (the photo shows the left, -z).
import { THREE, RoundedBoxGeometry, V, mesh, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, extrude, label, stippleCanvas, tex, HM, GM } from '../kit.js';

const S = 2.43 / 620;                               // photo px → model units (1 = 100 mm)
const X = px => (px - 332) * S, Y = py => (182 - py) * S;
const pts = a => a.map(([x, y]) => [X(x), Y(y)]);
// traced outlines are sparse polygons: densify the straight runs, then pass a closed centripetal
// Catmull-Rom spline through them so edges stay straight and corners round off like machined steel
function smoothLoop(p, step = 6, n = 200) {
  const d = [];
  for (let i = 0; i < p.length; i++) {
    const a = p[i], b = p[(i + 1) % p.length], k = Math.max(1, Math.round(Math.hypot(b[0] - a[0], b[1] - a[1]) / step));
    for (let j = 0; j < k; j++) d.push(V(a[0] + (b[0] - a[0]) * j / k, a[1] + (b[1] - a[1]) * j / k, 0));
  }
  return new THREE.CatmullRomCurve3(d, true, 'centripetal').getSpacedPoints(n).slice(0, -1).map(v => [v.x, v.y]);
}
const LX = (p, seg = 48) => latheAxis(p[0][1] > p[p.length - 1][1] ? [...p].reverse() : p, 'x', seg);

export function build() {
  const G = new THREE.Group();
  // satin stainless, brush lines running lengthwise
  const brush = GM.stainless.roughnessMap.clone(); brush.center.set(.5, .5); brush.rotation = Math.PI / 2; brush.needsUpdate = true;
  const steel = new THREE.MeshPhysicalMaterial({ color: 0xc4c8cc, metalness: 1, roughness: .38, roughnessMap: brush, anisotropy: .6 });
  const steelHi = steel.clone(); steelHi.roughness = .3;
  const steelDk = steel.clone(); steelDk.color.set(0x9a9fa5); steelDk.roughness = .45;
  const black = new THREE.MeshStandardMaterial({ color: 0x141416, metalness: .6, roughness: .35 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x18181a, roughness: .88, bumpMap: tex(stippleCanvas(), { repeat: [24, 24], color: false }), bumpScale: 1.2 });
  const dark = GM.dark;
  const slab = (p, depth, mat, o = {}) => {
    const outline = o.smooth === false ? pts(p) : smoothLoop(pts(p), .02);
    const holes = (o.holes ?? []).map(h => o.smoothHoles ? smoothLoop(pts(h), .02, 80) : pts(h));
    const m = mesh(extrude(shapeFrom(outline, holes), depth, o.bevel ?? .009, { segs: o.segs ?? 3, curve: 16, bevelSize: o.bevelSize }), mat); m.position.z = o.z ?? 0; return m;
  };
  const both = f => { for (const s of [1, -1]) f(s); };

  /* frame: top strap, cylinder window, front post, grip frame (under the rubber) */
  const FW = .3;
  G.add(slab([[540, 150], [700, 156], [722, 160], [724, 268], [714, 282], [704, 294], [560, 297], [548, 302], [545, 330], [495, 330], [468, 296], [452, 242], [456, 230], [478, 212], [498, 194], [518, 170], [528, 156]],
    FW, steel, { holes: [[[566, 163], [700, 163], [700, 268], [566, 268]]], bevel: .006, segs: 2 }));
  // recoil shield: a boss behind the cylinder standing just proud of the frame faces
  const shield = mesh(LX([[.19, X(560)], [.19, X(566) + .005], [.18, X(566) + .012]], 48), steelDk); shield.position.y = Y(214); shield.scale.set(1, 1, (FW / 2 + .016) / .19); G.add(shield);
  // matte bead-blasted strip along the top strap, yoke parting line, forcing-cone gap
  const matte = new THREE.MeshStandardMaterial({ color: 0x8a8f95, metalness: .9, roughness: .65 });
  const strap = mesh(new THREE.BoxGeometry(X(700) - X(560), .004, .1), matte); strap.position.set((X(560) + X(700)) / 2, Y(152) + .003, 0); G.add(strap);
  both(s => { const yl = mesh(new THREE.BoxGeometry(.008, Y(268) - Y(292), .004), dark); yl.position.set(X(702), (Y(268) + Y(292)) / 2, s * (FW / 2 + .006)); G.add(yl); });
  const gap = mesh(new THREE.CylinderGeometry(.115, .115, .012, 32), dark); gap.rotation.z = Math.PI / 2; gap.position.set(X(690) + .009, 0, 0); G.add(gap);
  // trigger guard: round-section bar swept along its centre line
  const tg = curve([[702, 296], [672, 302], [661, 322], [650, 344], [630, 360], [604, 369], [579, 364], [561, 350], [552, 332], [551, 312], [553, 298]].map(([x, y]) => V(X(x), Y(y), 0)), 64);
  G.add(mesh(sweepGeo(freeFrames(tg, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .09, thick: .045, round: 6 }), steel));

  /* barrel with top rib, half-lug ejector shroud, ejector rod */
  const xb0 = X(700), xm = X(952), br = .088;
  G.add(mesh(LX([[.11, xb0 - .02], [.11, xb0 + .04], [br, xb0 + .08], [br, xm - .015], [br - .012, xm], [.05, xm]], 56), steel));
  const crown = mesh(new THREE.RingGeometry(.045, .076, 40), steelDk); crown.rotation.y = Math.PI / 2; crown.position.x = xm + .001; G.add(crown);
  const bore = mesh(new THREE.CircleGeometry(.046, 32), dark); bore.rotation.y = Math.PI / 2; bore.position.x = xm - .03; G.add(bore);
  G.add(mesh(LX([[.046, xm - .03], [.046, xm]], 32), new THREE.MeshStandardMaterial({ color: 0x2a2a2c, metalness: .8, roughness: .5, side: THREE.BackSide })));
  const rib = mesh(new RoundedBoxGeometry(xm - xb0 - .06, .04, .1, 2, .012), steel); rib.position.set((xb0 + xm) / 2 + .02, br - .005, 0); G.add(rib);
  const ribTop = mesh(new THREE.BoxGeometry(xm - xb0 - .1, .004, .07), new THREE.MeshStandardMaterial({ color: 0x8a8f95, metalness: .9, roughness: .65 })); ribTop.position.set((xb0 + xm) / 2 + .02, br + .016, 0); G.add(ribTop);
  // half lug: flat sides, rounded underside, front sweeping up into the barrel in a concave curve
  G.add(slab([[716, 200], [800, 200], [884, 202], [872, 207], [862, 218], [855, 236], [846, 251], [832, 257], [742, 257], [728, 252], [718, 240]], .1, steel,
    { holes: [[[744, 223], [834, 223], [838, 229], [834, 235], [744, 235]]], smoothHoles: true, bevel: .02, bevelSize: .018, segs: 4 }));
  const rodY = Y(229), rod = mesh(LX([[.026, X(690)], [.026, X(845)]], 24), steelDk); rod.position.y = rodY; G.add(rod);
  const tip = mesh(LX([[.034, X(838)], [.036, X(842)], [.036, X(854)], [.03, X(858)]], 24), HM.knurled ? HM.knurled(0xb8bcc0, [20, 1]) : steel); tip.position.y = rodY; G.add(tip);

  /* front sight: pinned ramp with red insert */
  const fs = slab([[900, 162], [930, 148], [946, 146], [950, 162]], .045, steel, { bevel: .004 }); G.add(fs);
  const red = new THREE.MeshStandardMaterial({ color: 0xe0281c, roughness: .35, emissive: 0x500805 });
  G.add(slab([[927, 152], [941, 147], [945, 147], [943, 156]], .05, red, { bevel: .002 }));
  both(s => { const pin = mesh(new THREE.CylinderGeometry(.012, .012, .01, 12), steelDk); pin.rotation.x = Math.PI / 2; pin.position.set(X(938), Y(155), s * .026); G.add(pin); });

  /* adjustable rear sight: leaf in the top strap, notched blade, elevation and windage screws */
  const leaf = mesh(new RoundedBoxGeometry(X(585) - X(522), .05, .13, 2, .012), black); leaf.position.set((X(522) + X(585)) / 2, Y(150) + .015, 0); G.add(leaf);
  const blade = mesh(new RoundedBoxGeometry(.07, .07, .16, 2, .008), black); blade.position.set(X(530), Y(150) + .06, 0); G.add(blade);
  const notch = mesh(new THREE.BoxGeometry(.075, .045, .035), dark); notch.position.set(X(530), Y(150) + .085, 0); G.add(notch);
  const elev = mesh(new THREE.CylinderGeometry(.02, .02, .012, 16), steelDk); elev.position.set(X(575), Y(150) + .045, 0); G.add(elev);
  const wind = mesh(new THREE.CylinderGeometry(.016, .016, .02, 16), steelDk); wind.rotation.x = Math.PI / 2; wind.position.set(X(530), Y(150) + .055, .085); G.add(wind);

  /* fluted six-shot cylinder (cross-section extruded along the bore) */
  const cx0 = X(572), cx1 = X(690), cy = Y(214), CR = .2, CL = cx1 - cx0;
  const cs = new THREE.Shape(), fr = .052, fd = CR + .012;
  const fl = k => Math.PI / 6 + k * Math.PI / 3, half = Math.asin(fr / fd) * 1.05;
  for (let k = 0; k < 6; k++) {
    const a = fl(k), a1 = fl(k + 1);
    if (k === 0) cs.moveTo(CR * Math.cos(a + half), CR * Math.sin(a + half));
    cs.absarc(0, 0, CR, a + half, a1 - half, false);
    const fx = fd * Math.cos(a1), fy = fd * Math.sin(a1);
    cs.absarc(fx, fy, fr, a1 + Math.PI + 1.2, a1 + Math.PI - 1.2, true);
  }
  const ch = k => { const a = Math.PI / 2 + k * Math.PI / 3, h = new THREE.Path(); h.absarc(.125 * Math.cos(a), .125 * Math.sin(a), .046, 0, Math.PI * 2, true); return h; };
  for (let k = 0; k < 6; k++) cs.holes.push(ch(k));
  // flutes stop short of both ends: plain rear band with a small chamfer, plain front band with
  // a 45° chamfer and chamfered chamber mouths
  const xr = cx0 + .1, xf = cx1 - .065;
  const cyl = mesh(extrude(cs, xf - xr, .004, { segs: 1, curve: 20 }).rotateY(Math.PI / 2), steelHi); cyl.position.set((xr + xf) / 2, cy, 0); G.add(cyl);
  G.add(mesh(LX([[.17, cx0], [CR, cx0 + .01], [CR, xr + .003]], 64), steelHi).translateY(cy));
  const fs0 = new THREE.Shape(); fs0.absarc(0, 0, CR - .016, 0, Math.PI * 2, false);
  for (let k = 0; k < 6; k++) { const a = Math.PI / 2 + k * Math.PI / 3, h = new THREE.Path(); h.absarc(.125 * Math.cos(a), .125 * Math.sin(a), .062, 0, Math.PI * 2, true); fs0.holes.push(h); }
  const front = mesh(extrude(fs0, .033, .016, { segs: 1, curve: 24 }).rotateY(Math.PI / 2), steelHi); front.position.set(xf + .0325, cy, 0); G.add(front);
  const cylIn = mesh(LX([[.17, cx0 + .06], [.17, cx1 - .03]], 40), dark); cylIn.position.y = cy; G.add(cylIn);
  // cylinder stop notches (bolt cuts) and the cylinder gap at the forcing cone
  for (let k = 0; k < 6; k++) {
    const a = k * Math.PI / 3, n = mesh(new THREE.BoxGeometry(.05, .02, .025), dark);
    n.position.set(cx0 + .14, cy + Math.sin(a) * (CR - .005), Math.cos(a) * (CR - .005)); n.rotation.x = -a; G.add(n);
  }
  G.add(mesh(LX([[.035, cx0 - .01], [.035, cx1 + .02]], 24), steelDk).translateY(cy));

  /* yoke screw, sideplate screws (right), thumbpiece and lock (left) */
  const screw = (px, py, z) => { const sc = mesh(new THREE.CylinderGeometry(.022, .022, .01, 20), steelDk); sc.rotation.x = Math.PI / 2; sc.position.set(X(px), Y(py), z); G.add(sc); const sl = mesh(new THREE.BoxGeometry(.036, .006, .004), dark); sl.position.set(X(px), Y(py), z + Math.sign(z) * .006); G.add(sl); };
  for (const [px, py] of [[712, 275], [520, 230], [545, 280], [500, 300]]) screw(px, py, FW / 2 + .006);
  // sideplate: a fine recessed seam on the right
  const sp = new THREE.CatmullRomCurve3(pts([[505, 205], [552, 200], [562, 240], [560, 292], [520, 312], [488, 300], [478, 255]]).map(([x, y]) => V(x, y, FW / 2 + .006)), true, 'centripetal');
  G.add(mesh(new THREE.TubeGeometry(sp, 120, .0035, 6, true), dark));
  // cylinder release thumbpiece (left): contoured black tab, sloped front, five grooves
  const th = mesh(extrude(shapeFrom([[-.075, -.05], [.03, -.055], [.075, -.02], [.075, .02], [.03, .055], [-.075, .05]]), .03, .01, { segs: 2 }), black);
  th.position.set(X(548), Y(214), -(FW / 2 + .026)); G.add(th);
  for (let k = 0; k < 5; k++) { const g = mesh(new THREE.BoxGeometry(.008, .085, .006), dark); g.position.set(X(548) - .055 + k * .022, Y(214), -(FW / 2 + .044)); G.add(g); }
  const lock = mesh(new THREE.CircleGeometry(.018, 20), dark); lock.rotation.y = Math.PI; lock.position.set(X(518), Y(200), -(FW / 2 + .0175)); G.add(lock);

  /* hammer (spur, checkered) and trigger */
  G.add(slab([[503, 184], [503, 205], [522, 214], [540, 205], [540, 176], [528, 160], [515, 160], [505, 169]], .12, black, { bevel: .01 }));
  G.add(slab([[472, 172], [478, 165], [505, 169], [512, 178], [503, 184], [481, 181]], .16, black, { bevel: .01 }));   // wide spur
  const chk = mesh(new THREE.BoxGeometry(X(506) - X(474), .004, .15), HM.knurled(0x1a1a1c, [8, 3])); chk.position.set((X(474) + X(506)) / 2, Y(167.5) + .012, 0); chk.rotation.z = -.12; G.add(chk);
  G.add(slab([[574, 300], [612, 300], [606, 318], [597, 328], [598, 342], [610, 354], [624, 362], [616, 366], [598, 358], [585, 344], [578, 326]], .09, black, { bevel: .01 }));

  /* black rubber finger-groove grip with grip screw */
  const GRIP0 = [[440, 229], [462, 227], [471, 236], [477, 254], [485, 268], [500, 280], [531, 295], [545, 310], [548, 330], [548, 349], [541, 348], [521, 337], [505, 336], [492, 341], [483, 350], [477, 364], [476, 387], [462, 413], [465, 442], [453, 463], [451, 482], [444, 490], [387, 483], [337, 480], [335, 472], [347, 435], [346, 420], [350, 405], [355, 380], [363, 358], [367, 347], [385, 318], [419, 272], [429, 240]];
  // grip: about 10% shallower front to back than the raw trace and a touch lower at the top
  const GRIP = GRIP0.map(([x, y]) => [520 + (x - 520) * .9, y < 245 ? y + 6 : y]);
  G.add(slab(GRIP, .16, rubber, { bevel: .1, bevelSize: .045, segs: 8 }));
  both(s => { const gs = mesh(new THREE.CylinderGeometry(.03, .03, .012, 20), black); gs.rotation.x = Math.PI / 2; gs.position.set(X(400), Y(395), s * .183); G.add(gs); });

  /* markings: barrel roll marks and frame stamps */
  const lm = label([['LV ARMS  &  CO.', .8, 600]], .5, .06, { color: '#6d7278', metal: .8, rough: .4 }); lm.position.set(X(830), 0, -(br + .002)); lm.rotation.y = Math.PI; G.add(lm);
  const rm = label([['.357 MAGNUM CTG.', .8, 600]], .5, .06, { color: '#6d7278', metal: .8, rough: .4 }); rm.position.set(X(830), 0, br + .002); G.add(rm);
  const mm = label([['MOD 686-6', .8, 600]], .2, .04, { color: '#7a7f85', metal: .8 }); mm.position.set(X(690), Y(285), FW / 2 + .016); G.add(mm);
  return G;
}
