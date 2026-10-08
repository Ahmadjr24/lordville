// K-12 Sport-style 9×19 mm competition pistol (display prop), built from outlines traced off a
// side photograph (k12-profiles.js) at its published 216 mm length: steel frame with beavertail
// and squared trigger guard, slide riding low in the frame rails with slanted front and rear
// serrations, chrome barrel showing through the slide top, adjustable rear sight, extended
// safety, aluminium grip panels with a machined pocket, checkered front and back straps, and a
// stepped competition magazine base pad. x toward the muzzle, y up, z = the pistol's left side.
import { THREE, RoundedBoxGeometry, mesh, latheAxis, shapeFrom, rrPts, extrude, label, knurlCanvas, stippleCanvas, tex, HM, GM } from '../kit.js';
import { P } from './k12-profiles.js';

const slab = (name, depth, mat, o = {}) => {
  const p = P[name], m = mesh(extrude(shapeFrom(p.outline, p.holes), depth, o.bevel ?? .01, { segs: o.segs ?? 4, curve: 12 }), mat);
  m.position.z = o.z ?? 0; return m;
};
// grip geometry measured off the photo: front-strap and back-strap edges as lines in y
const front = y => .571 + .26 * (y + 1.04), back = y => .031 + .28 * (y + 1.04);

export function build() {
  const G = new THREE.Group();
  const bump = tex(stippleCanvas(), { repeat: [8, 8], color: false });
  const cera = new THREE.MeshPhysicalMaterial({ color: 0x76736e, metalness: .6, roughness: .42, clearcoat: .1, bumpMap: bump, bumpScale: .15 });
  const panelMat = new THREE.MeshPhysicalMaterial({ color: 0x4d4943, metalness: .55, roughness: .48, bumpMap: bump, bumpScale: .15 });
  const knurl = new THREE.MeshStandardMaterial({ color: 0x5f5d58, metalness: .5, roughness: .6, bumpMap: tex(knurlCanvas(5), { repeat: [18, 18], color: false }), bumpScale: 3 });
  const black = new THREE.MeshPhysicalMaterial({ color: 0x141416, metalness: .5, roughness: .4, clearcoat: .2 });
  const dark = GM.dark;
  const zs = .12 + .012, zf = .125 + .015;      // outer faces of slide and frame

  /* frame (with beavertail and trigger guard) and slide */
  G.add(slab('frame', .25, cera, { bevel: .015 }));
  G.add(slab('slide', .24, cera, { bevel: .012 }));
  // slide-to-frame parting line, slightly darker
  for (const s of [1, -1]) { const ln = mesh(new THREE.BoxGeometry(1.9, .004, .004), dark); ln.position.set(1.2, -.043, s * (zf + .001)); G.add(ln); }

  /* slanted serrations, both sides, rear and front */
  for (const s of [1, -1]) for (const [x0, x1, n] of [[.29, .64, 9], [1.65, 1.99, 8]]) for (let k = 0; k < n; k++) {
    const g = mesh(new THREE.BoxGeometry(.012, .13, .008), new THREE.MeshStandardMaterial({ color: 0x2a2927, metalness: .5, roughness: .6 }));
    g.position.set(x0 + (x1 - x0) * k / (n - 1), .045, s * (zs + .001)); g.rotation.z = -.28; G.add(g);
  }

  /* chrome barrel hood in the slide-top cut-out, extractor, muzzle */
  const chrome = new THREE.MeshStandardMaterial({ color: 0xe6e6e6, metalness: 1, roughness: .12, envMapIntensity: 1.4 });
  const cut = mesh(new RoundedBoxGeometry(.3, .03, .17, 2, .01), dark); cut.position.set(1.093, .1, 0); G.add(cut);
  const hood = mesh(new RoundedBoxGeometry(.27, .07, .15, 3, .02), chrome); hood.position.set(1.093, .089, 0); G.add(hood);
  const cal = label([['9×19', .8, 600]], .1, .03, { color: '#4b4b4b', metal: .9, rough: .2 }); cal.position.set(1.1, .125, 0); cal.rotation.x = -Math.PI / 2; G.add(cal);
  const ext = mesh(new RoundedBoxGeometry(.27, .022, .016, 2, .008), black); ext.position.set(.82, .004, zs + .006); G.add(ext);
  for (const [sz, x0, x1, y0] of [[1, .955, 1.23, .04], [-1, .93, 1.27, .02]]) {
    const rim = mesh(new THREE.BoxGeometry(x1 - x0 + .02, .135 - y0, .003), dark); rim.position.set((x0 + x1) / 2, (y0 + .135) / 2 - .005, sz * (zs + .0015)); G.add(rim);
    const face = mesh(new RoundedBoxGeometry(x1 - x0, .126 - y0, .006, 2, .002), chrome); face.position.set((x0 + x1) / 2, (y0 + .126) / 2, sz * (zs + .003)); G.add(face);
  }
  // right side: extractor set into the slide just behind the port
  const rext = mesh(new RoundedBoxGeometry(.3, .04, .01, 2, .006), black); rext.position.set(.76, .07, -(zs + .004)); G.add(rext);
  const rextLine = mesh(new THREE.BoxGeometry(.31, .05, .002), dark); rextLine.position.set(.76, .07, -(zs + .0012)); G.add(rextLine);
  G.add(mesh(latheAxis([[.065, 2.14], [.065, 2.17], [.055, 2.175], [.03, 2.175]], 'x', 40), chrome));
  const bore = mesh(new THREE.CircleGeometry(.03, 24), dark); bore.rotation.y = Math.PI / 2; bore.position.set(2.176, 0, 0); G.add(bore);

  /* sights: adjustable rear with windage screw and elevation screw, steel front post */
  const sbase = mesh(extrude(shapeFrom([[.3, .122], [.7, .122], [.7, .135], [.62, .152], [.3, .152]]), .09, .004), black); G.add(sbase);
  const blade = mesh(extrude(shapeFrom([[.3, .14], [.37, .14], [.37, .227], [.3, .227]], [[[.31, .227], [.31, .197], [.36, .197], [.36, .227]].map(p => p)]), .13, .004), black); G.add(blade);
  const wscrew = mesh(new THREE.CylinderGeometry(.02, .02, .012, 16), black); wscrew.rotation.x = Math.PI / 2; wscrew.position.set(.335, .175, .07); G.add(wscrew);
  const wslot = mesh(new THREE.BoxGeometry(.03, .005, .004), dark); wslot.position.set(.335, .175, .077); wslot.rotation.z = .6; G.add(wslot);
  const escrew = mesh(new THREE.CylinderGeometry(.018, .018, .012, 16), black); escrew.position.set(.5, .158, 0); G.add(escrew);
  const eslot = mesh(new THREE.BoxGeometry(.028, .004, .005), dark); eslot.position.set(.5, .165, 0); G.add(eslot);
  G.add(slab('fsight', .05, black, { bevel: .004 }));

  /* hammer, trigger, extended safety, magazine release, pins and screws */
  const hm = new THREE.Group(); hm.position.set(.17, .08, 0); hm.rotation.z = .25; G.add(hm);
  hm.add(mesh(new THREE.TorusGeometry(.052, .018, 12, 32), black));
  const hb = mesh(new RoundedBoxGeometry(.06, .14, .07, 2, .015), black); hb.position.set(.02, -.1, 0); hm.add(hb);
  const spur = mesh(new RoundedBoxGeometry(.06, .035, .075, 2, .012), new THREE.MeshStandardMaterial({ color: 0x141416, metalness: .5, roughness: .5, bumpMap: tex(knurlCanvas(4), { repeat: [4, 4], color: false }), bumpScale: 3 }));
  spur.position.set(-.035, .062, 0); hm.add(spur);
  G.add(slab('trigger', .06, black, { bevel: .006 }));
  G.add(mesh(extrude(shapeFrom([[.37, -.17], [.6, -.18], [.65, -.135], [.61, -.085], [.4, -.095]]), .025, .006), black).translateZ(zf + .016));
  G.add(mesh(extrude(shapeFrom([[.39, -.16], [.58, -.17], [.62, -.135], [.59, -.095], [.41, -.1]]), .022, .005), black).translateZ(-(zf + .015)));
  const mrel = mesh(latheAxis([[0, 0], [.0625, 0], [.0625, .012], [.05, .02], [0, .022]], 'z', 32), black); mrel.position.set(.69, -.49, zf); G.add(mrel);
  for (const [x, y, r] of [[.96, -.125, .025], [1.12, -.12, .01], [.98, -.22, .018]]) {
    const pin = mesh(new THREE.CylinderGeometry(r, r, .01, 16), black); pin.rotation.x = Math.PI / 2; pin.position.set(x, y, zf + .002); G.add(pin);
  }

  /* grip: panels with a machined pocket and logo, checkered front and back straps */
  const gy0 = -.33, gy1 = -.98, inset = (y, a, b) => [back(y) + a, front(y) - b];
  const panelPts = [[...[inset(gy0, .07, .12)[0]], gy0], [inset(gy0, .07, .12)[1], gy0], [inset(gy1, .07, .12)[1], gy1], [inset(gy1, .07, .12)[0], gy1]];
  const pocketPts = [[inset(gy0 - .07, .12, .17)[0], gy0 - .07], [inset(gy0 - .07, .12, .17)[1], gy0 - .07], [inset(gy1 + .05, .12, .17)[1], gy1 + .05], [inset(gy1 + .05, .12, .17)[0], gy1 + .05]];
  const rounded = (q, r) => { const s = new THREE.Shape(); const n = q.length; for (let i = 0; i < n; i++) { const p0 = q[(i + n - 1) % n], p1 = q[i], p2 = q[(i + 1) % n];
      const d0 = Math.hypot(p1[0] - p0[0], p1[1] - p0[1]), d2 = Math.hypot(p2[0] - p1[0], p2[1] - p1[1]);
      const a = [p1[0] + (p0[0] - p1[0]) * r / d0, p1[1] + (p0[1] - p1[1]) * r / d0], b = [p1[0] + (p2[0] - p1[0]) * r / d2, p1[1] + (p2[1] - p1[1]) * r / d2];
      i ? s.lineTo(a[0], a[1]) : s.moveTo(a[0], a[1]); s.quadraticCurveTo(p1[0], p1[1], b[0], b[1]); } s.closePath(); return s; };
  for (const s of [1, -1]) {
    const pan = mesh(extrude(rounded(panelPts, .06), .028, .008), panelMat); pan.position.z = s * (zf + .006); G.add(pan);
    const pk = mesh(extrude(rounded(pocketPts, .05), .006, .002), new THREE.MeshStandardMaterial({ color: 0x3c3934, metalness: .4, roughness: .7 }));
    pk.position.z = s * (zf + .0285); G.add(pk);
    for (const [x0, w] of [[0, .07], [1, .06]]) {
      const ed = x0 ? (y => [back(y) + .005, back(y) + w]) : (y => [front(y) - w, front(y) - .005]), yt = x0 ? -.62 : -.4;
      const strip = [[ed(yt)[0], yt], [ed(yt)[1], yt], [ed(-1.03)[1], -1.03], [ed(-1.03)[0], -1.03]];
      const k = mesh(extrude(shapeFrom(strip), .004, 0), knurl); k.position.z = s * (zf + .004); G.add(k);
    }
    for (const [sx, sy] of [[.33, -.2], [.4, -.88]]) {
      const scr = mesh(new THREE.CylinderGeometry(.026, .026, .012, 18), black); scr.rotation.x = Math.PI / 2; scr.position.set(sx, sy, s * (zf + .036)); G.add(scr);
      const sl = mesh(new THREE.BoxGeometry(.04, .006, .004), dark); sl.position.set(sx, sy, s * (zf + .043)); sl.rotation.z = .3; G.add(sl);
    }
  }
  // engraved logo in the left panel pocket, running along the grip
  const logo = label([['LV ARMS', .8, 700]], .5, .07, { color: '#c9c6bf' });
  logo.position.set(.37, -.6, zf + .037); logo.rotation.z = Math.PI / 2 + .27; G.add(logo);

  /* stepped competition magazine base pad */
  G.add(slab('magpad', .3, new THREE.MeshPhysicalMaterial({ color: 0x4d4943, metalness: .5, roughness: .5, bumpMap: bump, bumpScale: .15 }), { bevel: .012 }));

  for (const sz of [1, -1]) { const seam = mesh(new THREE.BoxGeometry(.5, .008, .004), dark); seam.position.set(.31, -1.17, sz * .163); G.add(seam); }

  /* markings */
  const mk = label([['K-12', .9, 'italic 500']], .22, .07, { color: '#4d4b47', metal: .6, rough: .4 });
  mk.position.set(1.62, -.11, zf + .002); G.add(mk);
  const sp = label([['Sport', .9, 'italic 500']], .12, .05, { color: '#4d4b47', font: 'Georgia, serif' }); sp.position.set(1.83, -.11, zf + .002); G.add(sp);
  const sn = label([['TM02-26LV0418', .8, 600]], .3, .03, { color: '#4d4b47' }); sn.position.set(1.45, .07, zs + .002); G.add(sn);
  const sn2 = label([['TM02-26LV0418', .8, 600]], .28, .03, { color: '#4d4b47' }); sn2.position.set(.82, -.12, zf + .002); G.add(sn2);
  return G;
}
