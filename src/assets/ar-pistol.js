// AR-15 pistol (display prop): 7.5 in barrel, flat-top upper with a free-float slotted rail,
// Troy-style pistol brace on a buffer tube, Holosun-style red dot on a riser, flip-up front
// and rear sights, olive-drab angled foregrip and a black polymer PMAG. The lower receiver,
// pistol grip and magazine reuse the outlines traced for the M16 (m16-profiles.js), so the
// AR family shares one silhouette. x toward the muzzle, y up, z = right side.
import { THREE, RoundedBoxGeometry, V, mesh, tex, curve, freeFrames, sweepGeo, latheAxis, shapeFrom, rrPts, extrude, label, knurlCanvas, stippleCanvas, HM, GM, picatinny } from '../kit.js';
import { P as RAW } from './m16-profiles.js';

// same clean-ups as the M16 build: magwell front wall, trigger-guard opening, magazine top edge
const P = structuredClone(RAW);
{
  const lo = P.lower.outline, i0 = lo.findIndex(p => p[0] > 4.58 && p[1] < -.76), i1 = lo.findIndex(p => p[0] > 4.69 && p[1] > -.4);
  P.lower.outline = [...lo.slice(0, i0), [4.59, -.77], [4.6, -.47], ...lo.slice(i1)];
  P.lower.holes = [rrPts(3.51, -.815, .345, .205, .085, 8).reverse()];
  const mo = P.mag.outline, a = mo.findIndex(p => Math.abs(p[0] - 4.591) < .002 && Math.abs(p[1] + .7692) < .002), b = mo.findIndex(p => Math.abs(p[0] - 4.4363) < .002);
  if (a >= 0 && b > a) P.mag.outline = [...mo.slice(0, a + 1), ...mo.slice(b)];
}
const LX = (p, seg = 48) => latheAxis(p[0][1] > p[p.length - 1][1] ? [...p].reverse() : p, 'x', seg);
function clipBelow(pts, c) {
  const out = [];
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length], ia = a[1] <= c, ib = b[1] <= c;
    if (ia) out.push(a);
    if (ia !== ib) { const t = (c - a[1]) / (b[1] - a[1]); out.push([a[0] + t * (b[0] - a[0]), c]); }
  }
  return out;
}

export function build() {
  const G = new THREE.Group();
  const bump = tex(stippleCanvas(), { repeat: [8, 8], color: false });
  // three distinct blacks: grey anodised aluminium, matte polymer, dark steel
  const anod = new THREE.MeshPhysicalMaterial({ color: 0x34363a, metalness: .35, roughness: .5, clearcoat: .05, clearcoatRoughness: .6, bumpMap: bump, bumpScale: .25 });
  const park = new THREE.MeshStandardMaterial({ color: 0x2a2b2d, metalness: .55, roughness: .55 });
  const poly = new THREE.MeshPhysicalMaterial({ color: 0x1b1b1c, roughness: .8, bumpMap: bump, bumpScale: .2 });
  const bronze = new THREE.MeshStandardMaterial({ color: 0x4b3a35, metalness: .7, roughness: .35 });
  const od = new THREE.MeshStandardMaterial({ color: 0x55573c, roughness: .7, bumpMap: bump, bumpScale: .2 });
  const dark = GM.dark;
  const part = (pts, holes, depth, mat, o = {}) => { const m = mesh(extrude(shapeFrom(pts, holes ?? []), depth, o.bevel ?? .012, { segs: o.segs ?? 4, curve: 12, bevelSize: o.bevelSize }), mat); m.position.z = o.z ?? 0; return m; };
  const smoothLoop = (p, n = 80) => new THREE.CatmullRomCurve3(p.map(([x, y]) => V(x, y, 0)), true, 'centripetal').getSpacedPoints(n).slice(0, -1).map(v => [v.x, v.y]);
  // stadium-shaped slot outline centred at (cx, cy), length l, width w, tilted by a
  const slot = (cx, cy, l, w, a) => { const o = []; for (let i = 0; i <= 12; i++) { const t = -Math.PI / 2 + Math.PI * i / 12; o.push([l / 2 - w / 2 + Math.cos(t) * w / 2, Math.sin(t) * w / 2]); } for (let i = 0; i <= 12; i++) { const t = Math.PI / 2 + Math.PI * i / 12; o.push([-l / 2 + w / 2 + Math.cos(t) * w / 2, Math.sin(t) * w / 2]); } return o.map(([x, y]) => [cx + x * Math.cos(a) - y * Math.sin(a), cy + x * Math.sin(a) + y * Math.cos(a)]); };
  const both = f => { for (const s of [1, -1]) f(s); };

  /* lower receiver, grip, controls (from the M16 trace) */
  G.add(part(P.lower.outline, P.lower.holes, .2, anod));
  const gripMat = poly.clone(); gripMat.bumpMap = tex(knurlCanvas(6), { repeat: [14, 14], color: false }); gripMat.bumpScale = 1.6;
  G.add(part(P.grip.outline, P.grip.holes, .18, gripMat, { bevel: .06, segs: 6 }));
  for (const [x, y] of [[3.01, -.256], [4.62, -.256]]) both(s => { const pin = mesh(new THREE.CylinderGeometry(.035, .035, .012, 20), anod); pin.rotation.x = Math.PI / 2; pin.position.set(x, y, s * .118); G.add(pin); });
  for (const [x, y] of [[3.22, -.33], [3.46, -.31]]) both(s => { const pn = mesh(new THREE.CircleGeometry(.018, 16), dark); pn.position.set(x, y, s * .1135); pn.rotation.y = s < 0 ? Math.PI : 0; G.add(pn); });
  const fence = mesh(new THREE.TorusGeometry(.06, .014, 8, 24), anod); fence.position.set(3.85, -.36, .115); G.add(fence);
  const mr = mesh(new RoundedBoxGeometry(.08, .08, .04, 2, .012), GM.nitride); mr.position.set(3.85, -.36, .122); G.add(mr);
  const sel = mesh(extrude(shapeFrom([[2.99, -.32], [3.15, -.33], [3.24, -.35], [3.15, -.37], [2.99, -.38]]), .03, .006), park); sel.position.z = -.13; G.add(sel);
  const selR = sel.clone(); selR.position.z = .13; G.add(selR);
  const bc = mesh(extrude(shapeFrom([[3.86, -.37], [4.03, -.37], [4.05, -.44], [3.96, -.5], [3.86, -.45]]), .03, .006), park); bc.position.z = -.13; G.add(bc);
  const lmk = label([['LV ARMS', .6, 700], ['LV-15 PISTOL  MULTI-CAL', .5, 600], ['SN 2208411', .45, 500]], .7, .2, { color: '#a8acb2', metal: .5, rough: .4 });
  lmk.position.set(4.25, -.5, -.1135); lmk.rotation.y = Math.PI; G.add(lmk);
  for (const [t, x, y] of [['SAFE', 3.31, -.35], ['FIRE', 2.79, -.35]]) { const m = label([[t, .85, 700]], .09, .025, { color: '#bdbcb4', align: 'center' }); m.position.set(x, y, .1135); G.add(m); }
  const tp = curve([V(3.62, -.56, 0), V(3.66, -.64, 0), V(3.65, -.72, 0), V(3.6, -.77, 0)], 24);
  G.add(mesh(sweepGeo(freeFrames(tp, V(0, 0, 1), V(1, 0, 0)), { center: true, width: .06, thick: .04, round: 3 }), GM.nitride));

  /* PMAG: black polymer, waffle grip band, flared floorplate, magwell lip */
  const mo = P.mag.outline;
  const pmag = new THREE.MeshStandardMaterial({ color: 0x232325, roughness: .8, bumpMap: bump, bumpScale: .2 });
  G.add(part(mo, [], .17, pmag, { bevel: .01 }));
  const waffle = pmag.clone(); waffle.bumpMap = tex(knurlCanvas(10), { repeat: [5, 5], color: false }); waffle.bumpScale = 3;
  const yb = Math.min(...mo.map(p => p[1]));
  G.add(part(clipBelow(mo, yb + .42), [], .18, waffle, { bevel: .01 }));
  { const bot = mo.filter(p => p[1] < yb + .06), a = Math.min(...bot.map(p => p[0])), b = Math.max(...bot.map(p => p[0]));
    const fp = mesh(new RoundedBoxGeometry(b - a + .06, .08, .23, 2, .025), pmag); fp.position.set((a + b) / 2, yb + .025, 0); fp.rotation.z = .12; G.add(fp); }
  both(s => { const w = mesh(new RoundedBoxGeometry(.22, .14, .01, 2, .02), new THREE.MeshStandardMaterial({ color: 0x2c2c2e, roughness: .85 })); w.position.set(4.24, -.95, s * .097); w.rotation.z = .2; G.add(w); });
  // flared magwell lip and the dark seam where the magazine enters
  { const span = (pts, y) => { const xs = []; for (let i = 0; i < pts.length; i++) { const [x1, y1] = pts[i], [x2, y2] = pts[(i + 1) % pts.length]; if ((y1 - y) * (y2 - y) <= 0 && y1 !== y2) xs.push(x1 + (x2 - x1) * (y - y1) / (y2 - y1)); } return [Math.min(...xs), Math.max(...xs)]; };
    const [a, b] = span(mo, -.79), outer = shapeFrom(rrPts(a - .025, -.135, b - a + .05, .27, .02), [rrPts(a + .005, -.105, b - a - .01, .21, .01).reverse()]);
    const lip = mesh(extrude(outer, .05, .006), anod); lip.rotation.x = Math.PI / 2; lip.position.y = -.77; G.add(lip);
    const seam = mesh(new THREE.BoxGeometry(b - a + .01, .01, .2), dark); seam.position.set((a + b) / 2, -.8, 0); G.add(seam); }

  /* flat-top upper: receiver body, Picatinny top, ejection port, forward assist, charging handle */
  const upper = [[2.74, -.18], [4.79, -.18], [4.79, .12], [2.74, .12]];
  G.add(part(upper, [], .18, anod, { bevel: .02, segs: 4 }));
  const top = picatinny(4.79 - 2.76, anod); top.position.set(2.76, .12, 0); G.add(top);
  const recess = mesh(new THREE.BoxGeometry(.796, .166, .004), dark); recess.position.set(4.2, -.01, .1145); G.add(recess);
  const coverMat = new THREE.MeshStandardMaterial({ color: 0x36383b, metalness: .45, roughness: .55 });
  const cover = mesh(new RoundedBoxGeometry(.78, .15, .006, 2, .002), coverMat); cover.position.set(4.2, -.01, .1165); G.add(cover);
  const crib = mesh(new RoundedBoxGeometry(.7, .03, .008, 2, .003), coverMat); crib.position.set(4.22, .025, .121); G.add(crib);
  const hinge = mesh(new THREE.CylinderGeometry(.011, .011, .82, 12), park); hinge.rotation.z = Math.PI / 2; hinge.position.set(4.2, -.09, .118); G.add(hinge);
  { const w = new THREE.Shape(); w.moveTo(3.6, 0); w.lineTo(3.62, .1); w.lineTo(3.68, .108); w.lineTo(3.8, 0); w.closePath();
    const g = extrude(w, .16, .008); g.rotateX(Math.PI / 2); g.translate(0, .02, .114); G.add(mesh(g, anod)); }
  { const FA = new THREE.Group(); FA.position.set(3.35, .02, .095); FA.rotation.z = -.12;
    FA.add(mesh(LX([[.075, 0], [.08, .02], [.08, .3], [.06, .34]], 40), anod));
    FA.add(mesh(LX([[0, -.07], [.055, -.07], [.068, -.06], [.068, .01]], 40), park));
    G.add(FA); }
  const ch = mesh(new RoundedBoxGeometry(.08, .05, .4, 2, .015), anod); ch.position.set(2.79, .07, 0); G.add(ch);
  const chLatch = mesh(new RoundedBoxGeometry(.12, .045, .07, 2, .012), anod); chLatch.position.set(2.78, .07, -.185); G.add(chLatch);

  /* buffer tube, castle nut, end plate and Troy-style pistol brace */
  const ty = -.03;
  G.add(mesh(LX([[.145, 1.66], [.145, 2.66]], 40).translate(0, ty, 0), anod));
  G.add(mesh(LX([[.18, 2.6], [.18, 2.7]], 8).translate(0, ty, 0), park));
  G.add(mesh(LX([[.16, 2.7], [.16, 2.74]], 40).translate(0, ty, 0), park));
  // slim sleeve hugging the tube, thin paddle behind it with a forward-curving hook
  G.add(part([[1.6, .16], [2.32, .16], [2.52, .1], [2.52, -.16], [2.32, -.22], [1.6, -.22]], [], .22, poly, { bevel: .04, segs: 4 }));
  G.add(part(smoothLoop([[1.0, .2], [1.35, .2], [1.66, .16], [1.66, -.2], [1.52, -.28], [1.36, -.46], [1.26, -.62], [1.18, -.67], [1.1, -.62], [1.04, -.42], [1.0, -.1]]), [], .12, poly, { bevel: .02, segs: 3 }));
  both(s => {
    for (let k = 0; k < 6; k++) { const r = mesh(new THREE.BoxGeometry(.014, .14, .01), dark); r.position.set(2.08 + k * .07, .08, s * .152); r.rotation.z = .52; G.add(r); }
    const lg = label([['TROY', .8, 800]], .18, .06, { color: '#7c7e80' }); lg.position.set(1.28, -.3, s * .081); if (s < 0) lg.rotation.y = Math.PI; G.add(lg);
  });

  /* barrel nut and free-float slotted rail with continuous top rail */
  const hx0 = 4.8, hx1 = 7.05, hr = .22, hy = -.08;   // rail top flush with the upper's rail
  G.add(mesh(LX([[.15, 4.78], [.2, 4.8], [.2, 5.11], [.19, 5.13]], 48).translate(0, hy, 0), bronze));
  for (let k = 0; k < 6; k++) { const a = k * Math.PI / 3, n = mesh(new THREE.BoxGeometry(.05, .03, .02), dark); n.position.set(5.11, hy + Math.sin(a) * .195, Math.cos(a) * .195); n.rotation.x = -a; G.add(n); }
  // octagonal rail from eight flat plates; the side and lower-diagonal plates carry real slots
  const ap8 = .235 * Math.cos(Math.PI / 8), fw = 2 * .235 * Math.sin(Math.PI / 8) + .01, L = hx1 - hx0 - .38;
  for (let k = 0; k < 8; k++) {
    const th = k * Math.PI / 4, slotted = k === 0 || k === 4 || k === 7 || k === 5;
    const holes = slotted ? Array.from({ length: 7 }, (_, j) => slot(.17 + j * .22, 0, .16, .05, .55)) : [];
    const pl = mesh(extrude(shapeFrom([[0, -fw / 2], [L, -fw / 2], [L, fw / 2], [0, fw / 2]], holes), .015, .003, { segs: 1, curve: 8 }), anod);
    pl.rotation.x = -th; pl.position.set(hx0 + .38, hy + Math.sin(th) * (ap8 - .0075), Math.cos(th) * (ap8 - .0075)); G.add(pl);
  }
  G.add(mesh(LX([[.2, hx0 + .38], [.2, hx1]], 32), new THREE.MeshStandardMaterial({ color: 0x0a0a0a, roughness: .9, side: THREE.DoubleSide })).translateY(hy));
  const capMat = anod.clone(); capMat.side = THREE.DoubleSide;
  const cap = mesh(new THREE.RingGeometry(.12, .235, 8, 1, Math.PI / 8), capMat); cap.rotation.y = Math.PI / 2; cap.position.set(hx1, hy, 0); G.add(cap);
  const hrail = picatinny(hx1 - hx0 - .38, anod); hrail.position.set(hx0 + .38, hy + ap8 - .012, 0); G.add(hrail);
  const brail = picatinny(.9, anod); brail.rotation.x = Math.PI; brail.position.set(hx1 - 1.0, hy - ap8 + .012, 0); G.add(brail);
  both(s => { const qd = mesh(new THREE.TorusGeometry(.04, .012, 8, 20), park); qd.position.set(hx0 + .3, hy - .05, s * .2); G.add(qd); });

  /* 7.5 in barrel, flash hider, flip-up sights */
  G.add(mesh(LX([[.08, 4.78], [.08, 6.95]], 40), park));
  G.add(mesh(LX([[.09, 6.95], [.11, 6.98], [.11, 7.25], [.095, 7.27], [.045, 7.27]], 40), park));
  for (let k = 0; k < 5; k++) { const a = -Math.PI / 2 + (k - 2) * .9, sl = mesh(new THREE.BoxGeometry(.2, .03, .02), dark); sl.position.set(7.15, Math.sin(a) * .106, Math.cos(a) * .106); sl.rotation.x = -a; G.add(sl); }
  const bore = mesh(new THREE.CircleGeometry(.045, 20), dark); bore.rotation.y = Math.PI / 2; bore.position.set(7.272, 0, 0); G.add(bore);
  const rail0 = hy + ap8 - .012 + .0875;
  // front: clamp, tower, protected post
  const fsBase = mesh(new RoundedBoxGeometry(.2, .1, .26, 2, .02), anod); fsBase.position.set(6.9, rail0 + .02, 0); G.add(fsBase);
  G.add(part([[6.82, rail0 + .06], [6.98, rail0 + .06], [6.95, rail0 + .38], [6.85, rail0 + .38]], [[[6.87, rail0 + .14], [6.93, rail0 + .14], [6.92, rail0 + .3], [6.88, rail0 + .3]]], .2, anod, { bevel: .01 }));
  const fpost = mesh(new THREE.BoxGeometry(.03, .18, .03), park); fpost.position.set(6.9, rail0 + .22, 0); G.add(fpost);
  for (const x of [6.9, 2.92]) { const gl = mesh(new THREE.BoxGeometry(.2, .01, .262), dark); gl.position.set(x, (x > 5 ? rail0 : .2075) + .065, 0); G.add(gl); }
  // rear: aperture between ears
  const rsBase = mesh(new RoundedBoxGeometry(.24, .1, .26, 2, .02), anod); rsBase.position.set(2.92, .12 + .0875 + .02, 0); G.add(rsBase);
  both(s => { const e = mesh(new RoundedBoxGeometry(.12, .28, .045, 3, .02), anod); e.position.set(2.9, .12 + .0875 + .2, s * .1); G.add(e); });
  const ap = mesh(new RoundedBoxGeometry(.04, .22, .14, 2, .01), anod); ap.position.set(2.9, .12 + .0875 + .19, 0); G.add(ap);
  const apHole = mesh(new THREE.CylinderGeometry(.018, .018, .05, 16), dark); apHole.rotation.z = Math.PI / 2; apHole.position.set(2.9, .12 + .0875 + .24, 0); G.add(apHole);

  /* Holosun-style red dot on a riser */
  const R = new THREE.Group(); R.position.set(3.75, .12 + .0875, 0); G.add(R);
  const riser = part([[-.3, 0], [.3, 0], [.3, .08], [.22, .32], [-.22, .32], [-.3, .08]], [rrPts(-.13, .09, .26, .14, .03, 4)], .26, anod, { bevel: .015 }); R.add(riser);
  const nut = mesh(new THREE.CylinderGeometry(.045, .045, .04, 6), park); nut.rotation.x = Math.PI / 2; nut.position.set(-.15, .04, .15); R.add(nut);
  const sight = new THREE.MeshStandardMaterial({ color: 0x1d1e20, metalness: .4, roughness: .55 });
  // box rear blending into a round front tube
  const body = mesh(new RoundedBoxGeometry(.38, .36, .38, 3, .06), sight); body.position.set(-.11, .5, 0); R.add(body);
  R.add(mesh(LX([[.18, .02], [.19, .06], [.19, .26], [.2, .3], [.2, .34]], 48).translate(0, .52, 0), sight));
  const bat = mesh(new RoundedBoxGeometry(.16, .12, .03, 2, .01), sight); bat.position.set(-.12, .47, .2); R.add(bat);
  R.add(mesh(LX([[.17, -.3], [.19, -.26], [.19, -.2]], 40).translate(0, .52, 0), sight));
  const glass = new THREE.MeshPhysicalMaterial({ color: 0x0a1410, metalness: .1, roughness: .05, iridescence: .6, iridescenceIOR: 1.6, envMapIntensity: .5 });
  for (const [x, f] of [[.335, 1], [-.30, -1]]) { const l = mesh(new THREE.CircleGeometry(.16, 36), glass); l.rotation.y = f * Math.PI / 2; l.position.set(x, .52, 0); R.add(l); }
  const turret = mesh(new THREE.CylinderGeometry(.08, .08, .06, 24), HM.knurled(0x1d1e20, [10, 1])); turret.position.set(-.16, .71, 0); R.add(turret);
  const turretR = mesh(new THREE.CylinderGeometry(.07, .07, .05, 24), HM.knurled(0x1d1e20, [10, 1])); turretR.rotation.x = Math.PI / 2; turretR.position.set(.06, .5, .2); R.add(turretR);
  for (let k = 0; k < 3; k++) { const b = mesh(new THREE.CylinderGeometry(.045, .045, .02, 20), new THREE.MeshStandardMaterial({ color: 0x2b2c2f, roughness: .8 })); b.rotation.x = Math.PI / 2; b.position.set(-.22 + k * .1, .5, -.2); R.add(b); }
  const sol = mesh(new THREE.BoxGeometry(.3, .006, .2), new THREE.MeshStandardMaterial({ color: 0x0b1220, metalness: .6, roughness: .2 })); sol.position.set(-.11, .683, 0); R.add(sol);

  /* olive-drab angled foregrip on the lower rail */
  const afgP = smoothLoop([[0, 0], [.7, 0], [.68, -.04], [.5, -.09], [.32, -.16], [.2, -.24], [.1, -.25], [.04, -.18], [.01, -.08]], 90);
  const afg = part(afgP, [], .18, od, { bevel: .04, segs: 4 }); afg.position.set(hx1 - 1.0, hy - ap8 - .075, 0); G.add(afg);
  const odDk = od.clone(); odDk.color.multiplyScalar(.6);
  both(s => { const pk = part(smoothLoop([[.22, -.06], [.48, -.06], [.26, -.16], [.2, -.14]], 40), [], .01, odDk, { bevel: .002 }); pk.position.set(hx1 - 1.0, hy - ap8 - .075, s * .128); G.add(pk); });
  return G;
}
