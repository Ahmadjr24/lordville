// Dual-tube night vision binocular (PVS-31 style): articulating monoculars on a centre bridge,
// knurled focus rings, coated objective lenses, glowing phosphor eyepieces, dovetail mount shoe,
// rotary switch, IR illuminator and a rear battery cap.
import { THREE, RoundedBoxGeometry, V, mesh, mkCanvas, tex, lighten, stippleCanvas } from '../kit.js';

function knurlCanvas() {
  const s = 128, c = mkCanvas(s), g = c.getContext('2d');
  g.fillStyle = '#808080'; g.fillRect(0, 0, s, s);
  g.lineWidth = 3;
  for (let k = -s; k < 2 * s; k += 8) {
    g.strokeStyle = 'rgba(0,0,0,.6)'; g.beginPath(); g.moveTo(k, 0); g.lineTo(k + s, s); g.stroke();
    g.beginPath(); g.moveTo(k, s); g.lineTo(k + s, 0); g.stroke();
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(k + 3, 0); g.lineTo(k + 3 + s, s); g.stroke(); g.lineWidth = 3;
  }
  return c;
}
// lathe along z: profile is [radius, z] pairs from back to front
function latheZ(prof, seg = 72) {
  const g = new THREE.LatheGeometry(prof.map(([r, z]) => new THREE.Vector2(r, z)), seg);
  g.rotateX(Math.PI / 2);
  return g;
}

export function build() {
  const G = new THREE.Group();
  const st = stippleCanvas();
  const housing = new THREE.MeshPhysicalMaterial({ color: 0x2a2c2b, roughness: .62, map: tex(lighten(st, .2), { repeat: [3, 3] }), bumpMap: tex(st, { repeat: [3, 3], color: false }), bumpScale: 1.2, sheen: .25, sheenColor: new THREE.Color(0x777777) });
  const kc = knurlCanvas();
  const anod = new THREE.MeshStandardMaterial({ color: 0x1c1d1f, metalness: .75, roughness: .38, bumpMap: tex(kc, { repeat: [24, 2], color: false }), bumpScale: 2.5 });
  const smooth = new THREE.MeshStandardMaterial({ color: 0x1e1f21, metalness: .7, roughness: .3 });
  const rubber = new THREE.MeshStandardMaterial({ color: 0x141414, roughness: .92, side: THREE.DoubleSide });
  const glass = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: .02, transmission: 1, thickness: .02, ior: 1.52, iridescence: 1, iridescenceIOR: 1.4, iridescenceThicknessRange: [250, 500], clearcoat: 1 });
  const coating = new THREE.MeshPhysicalMaterial({ color: 0x0b1712, metalness: .3, roughness: .06, iridescence: 1, iridescenceIOR: 1.8, iridescenceThicknessRange: [300, 700], clearcoat: 1 });
  const phosphor = new THREE.MeshStandardMaterial({ color: 0x0a1a0e, emissive: 0x39ff7a, emissiveIntensity: .55, roughness: .2 });

  /* monocular tubes, front = +z */
  for (const sx of [-1, 1]) {
    const T = new THREE.Group(); T.position.x = sx * .33; G.add(T);
    // eyecup (rubber, flared)
    T.add(mesh(latheZ([[.15, -.42], [.165, -.5], [.19, -.58], [.218, -.625], [.212, -.635], [.185, -.6], [.152, -.52], [.138, -.42]]), rubber));
    // eyepiece focus ring (knurled) and dioptre index
    T.add(mesh(latheZ([[.16, -.43], [.176, -.42], [.176, -.31], [.16, -.3]]), anod));
    const tick = mesh(new THREE.BoxGeometry(.006, .02, .03), new THREE.MeshStandardMaterial({ color: 0xf2f2f2, roughness: .5 }));
    tick.position.set(0, .181, -.32); T.add(tick);
    // main body with steps and chamfers
    T.add(mesh(latheZ([[.17, -.31], [.188, -.3], [.19, -.1], [.184, -.08], [.184, .04], [.19, .06], [.19, .23], [.182, .25]]), housing));
    // objective focus ring: knurl + raised grip ribs
    T.add(mesh(latheZ([[.19, .24], [.205, .26], [.205, .43], [.195, .45]]), anod));
    for (let k = 0; k < 18; k++) {
      const a = k / 18 * Math.PI * 2, rib = mesh(new RoundedBoxGeometry(.022, .022, .14, 2, .008), anod);
      rib.position.set(Math.cos(a) * .207, Math.sin(a) * .207, .345); rib.rotation.z = a; T.add(rib);
    }
    // objective bezel with front lip
    T.add(mesh(latheZ([[.2, .44], [.212, .46], [.212, .55], [.205, .565], [.172, .565], [.17, .54]]), smooth));
    // lens stack: coated element behind a curved front glass
    const coat = mesh(new THREE.SphereGeometry(.4, 48, 12, 0, Math.PI * 2, 0, .44), coating);
    coat.rotation.x = Math.PI / 2; coat.position.z = .5 - .4 * Math.cos(.44) + .005; coat.scale.setScalar(1); T.add(coat);
    const front = new THREE.Mesh(new THREE.SphereGeometry(.42, 48, 12, 0, Math.PI * 2, 0, .42), glass);
    front.rotation.x = Math.PI / 2; front.position.z = .555 - .42; T.add(front);
    // eyepiece: phosphor screen glow deep inside the eyecup
    const scr = mesh(new THREE.CircleGeometry(.13, 48), phosphor); scr.rotation.y = Math.PI; scr.position.z = -.46; T.add(scr);
    const eg = new THREE.Mesh(new THREE.SphereGeometry(.3, 48, 10, 0, Math.PI * 2, 0, .45), glass);
    eg.rotation.x = -Math.PI / 2; eg.position.z = -.47 + .3 - .02; T.add(eg);
    // articulation arm up to the bridge
    const arm = mesh(new RoundedBoxGeometry(.2, .12, .46, 3, .04), housing);
    arm.position.set(-sx * .12, .17, -.02); T.add(arm);
    const pivot = mesh(new THREE.CylinderGeometry(.065, .065, .5, 32), smooth);
    pivot.rotation.x = Math.PI / 2; pivot.position.set(-sx * .2, .2, -.02); T.add(pivot);
    for (const z of [.23, -.27]) {
      const cap = mesh(new THREE.CylinderGeometry(.045, .045, .012, 6), anod);
      cap.rotation.x = Math.PI / 2; cap.position.set(-sx * .2, .2, z); T.add(cap);
    }
  }

  /* centre bridge */
  const bridge = mesh(new RoundedBoxGeometry(.3, .3, .62, 4, .06), housing);
  bridge.position.set(0, .2, -.02); G.add(bridge);
  // dovetail mount shoe + latch
  {
    const s = new THREE.Shape(); s.moveTo(-.13, 0); s.lineTo(.13, 0); s.lineTo(.095, .075); s.lineTo(-.095, .075); s.closePath();
    const g = new THREE.ExtrudeGeometry(s, { depth: .42, bevelEnabled: true, bevelThickness: .01, bevelSize: .008, bevelSegments: 2 });
    g.translate(0, .345, -.24);
    G.add(mesh(g, smooth));
    const latch = mesh(new RoundedBoxGeometry(.08, .04, .1, 2, .015), anod); latch.position.set(0, .45, .12); G.add(latch);
  }
  // rotary switch on the front of the bridge
  {
    const knob = mesh(latheZ([[.075, 0], [.08, .01], [.08, .07], [.07, .085], [.001, .085]], 48), housing);
    knob.position.set(0, .2, .29); G.add(knob);
    for (let k = 0; k < 12; k++) {
      const a = k / 12 * Math.PI * 2, r = mesh(new THREE.BoxGeometry(.012, .016, .07), housing);
      r.position.set(Math.cos(a) * .08, .2 + Math.sin(a) * .08, .325); r.rotation.z = a; G.add(r);
    }
    const pointer = mesh(new THREE.BoxGeometry(.012, .055, .006), new THREE.MeshStandardMaterial({ color: 0xf2f2f2 }));
    pointer.position.set(0, .23, .377); pointer.rotation.z = -.7; G.add(pointer);
  }
  // IR illuminator under the switch
  {
    const ir = mesh(latheZ([[.045, 0], [.05, .01], [.05, .09], [.04, .1]], 32), smooth); ir.position.set(0, .085, .28); G.add(ir);
    const lens = mesh(new THREE.CircleGeometry(.038, 32), new THREE.MeshPhysicalMaterial({ color: 0x2a0b0b, roughness: .05, clearcoat: 1 }));
    lens.position.set(0, .085, .381); G.add(lens);
  }
  // battery tube and knurled cap at the back
  {
    const bt = mesh(latheZ([[.07, 0], [.075, .02], [.075, .2]], 48), housing); bt.position.set(0, .22, -.52); G.add(bt);
    const cap = mesh(latheZ([[.001, 0], [.06, 0], [.082, .012], [.082, .09], [.075, .1]], 48), anod); cap.rotation.y = Math.PI; cap.position.set(0, .22, -.52); G.add(cap);
    const lan = mesh(new THREE.TorusGeometry(.03, .008, 8, 24), smooth); lan.position.set(0, .22, -.62); lan.rotation.y = Math.PI / 2; G.add(lan);
  }
  // printed markings on the right tube
  {
    const c = mkCanvas(1024, 256), g = c.getContext('2d');
    g.fillStyle = '#d9d9d6'; g.font = '600 64px "IBM Plex Mono", monospace'; g.textBaseline = 'middle';
    g.fillText('NVG-31  GEN 3+', 30, 80); g.font = '500 44px "IBM Plex Mono", monospace'; g.fillText('AUTO-GATED · S/N 26-0418', 30, 170);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(.3, .075), new THREE.MeshStandardMaterial({ map: tex(c, { clampEdge: true }), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }));
    m.position.set(.33 + .193, 0, -.02); m.rotation.y = Math.PI / 2; G.add(m);
  }
  return G;
}
