// The catalogue. To add an asset: write src/assets/<id>.js exporting build() → THREE.Object3D,
// add an entry here, then run `node tools/thumbs.mjs <id>` to render its thumbnail.
//
// pose: rotZ tilts the model in its own plane, rotY turns it on the turntable (radians);
//       lift floats it above the floor (scene units, 1 = 10 cm).
// view: camera azimuth / elevation (radians) for the opening shot.

export const CATEGORIES = [
  { id: 'medical', name: 'Medical' },
  { id: 'weapons', name: 'Weapons' },
];

export const ASSETS = [
  {
    id: 'medkit-bag', code: 'MED-001', name: 'White medkit bag', category: 'medical', added: '2026-10-07',
    pose: { rotY: .38 }, view: { az: .55, el: .32 },
    summary: 'Soft-sided first-aid pouch in white cordura with red trim.',
    features: [
      'Embroidered red cross on the lid and “FIRST AID” on the front',
      'Two-way #8 zipper around three sides, metal sliders with paracord pulls',
      'Bias-bound red piping and top-stitched panels',
      'Webbing carry handle with box-X stitched tabs',
      'Steel D-rings on both ends',
      'Clear PVC ID window with a filled-in card on the back',
    ],
  },
  {
    id: 'bandage-set', code: 'MED-002', name: 'Bandage set', category: 'medical', added: '2026-10-07',
    pose: {}, view: { az: .45, el: .5 },
    summary: 'Five dressings laid out on the bench, from roll gauze to plasters.',
    features: [
      'Open-weave cotton gauze roll, partly unrolled, with the layer spiral visible on its ends',
      'Elastic crepe bandage with toothed butterfly clips',
      'Cloth surgical tape on a ribbed plastic core, end peeled up',
      'Sterile 10 × 10 cm gauze pad pouch with crimped paper seal',
      'Adhesive plasters: two open, one in its wrapper',
    ],
  },
  {
    id: 'medkit-backpack', code: 'MED-003', name: 'Medkit backpack', category: 'medical', added: '2026-10-07',
    pose: { rotY: -.32 }, view: { az: .6, el: .25 },
    summary: 'Large EMS trauma backpack in red ripstop on a ballistic-nylon base.',
    features: [
      'Two-way main zipper over the top and down both sides',
      'Front pocket with its own zipper and a merrowed cross patch',
      'Reflective band across the upper front',
      'MOLLE rows and compression straps with side-release buckles',
      'Airmesh back pads and padded harness with sternum strap and ladder locks',
      'Padded top grab handle and hang loop',
    ],
  },
  {
    id: 'blood-bag', code: 'MED-004', name: 'Blood bag', category: 'medical', added: '2026-10-07',
    pose: { rotY: .2 }, view: { az: .35, el: .62 },
    summary: 'Unit of red blood cells in a clear PVC bag, lying flat with its donor tube coiled beside it.',
    features: [
      'Clear PVC pillow with an RF-welded frosted border, hanger holes and slit',
      'ISBT 128 style label: donation number, group O Rh positive, product code, expiry',
      'Printed volume scale in 50 mL steps',
      'Two outlet ports with twist-off protectors',
      'Donor tube filled with blood and heat-sealed into numbered segments',
    ],
  },
  {
    id: 'sword', code: 'WPN-001', name: 'Arming sword', category: 'weapons', added: '2026-10-07',
    pose: { rotZ: -.95, lift: .9 }, view: { az: .3, el: .18 },
    summary: 'Single-handed medieval sword with a fullered blade and wheel pommel.',
    features: [
      '80 cm lenticular blade with distal taper and a fuller over the first 60 %',
      'Brushed steel with honed, brighter edges',
      'Curved crossguard with flared terminals, central block and langets',
      'Leather-wrapped oval grip over two risers, steel ferrules',
      'Wheel pommel with peen block',
    ],
  },
  {
    id: 'machete', code: 'WPN-002', name: 'Machete', category: 'weapons', added: '2026-10-07',
    pose: { rotZ: -.95, lift: .7 }, view: { az: .3, el: .2 },
    summary: 'Latin-pattern field machete with a coated carbon-steel blade.',
    features: [
      '46 cm 1075 carbon-steel blade with a widening belly and upswept tip',
      'Black protective coating with scuffs, bright hand-ground edge bevel',
      'Moulded polymer handle with stippled grip, guard flare and hooked butt',
      'Brass rivets, brass lanyard grommet and an orange paracord loop',
    ],
  },
];
