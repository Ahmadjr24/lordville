import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ASSETS, CATEGORIES } from './registry.js';

const $ = s => document.querySelector(s);
const THUMB = new URLSearchParams(location.search).get('thumb');
const catName = id => CATEGORIES.find(c => c.id === id)?.name ?? id;
const fmt = n => n.toLocaleString('en-US');

/* ------------------------------------------------------------------ library grid */
const ui = { filter: 'all', query: '' };
try { ui.filter = localStorage.getItem('lib.filter') || 'all'; } catch { /* storage unavailable */ }

function visibleAssets() {
  const q = ui.query.trim().toLowerCase();
  return ASSETS.filter(a => (ui.filter === 'all' || a.category === ui.filter) &&
    (!q || [a.name, a.code, a.summary, catName(a.category), ...a.features].join(' ').toLowerCase().includes(q)));
}
function renderFilters() {
  const chips = [{ id: 'all', name: 'All' }, ...CATEGORIES].map(c => {
    const n = c.id === 'all' ? ASSETS.length : ASSETS.filter(a => a.category === c.id).length;
    return `<button class="chip" type="button" data-f="${c.id}" aria-pressed="${ui.filter === c.id}">${c.name}<span>${n}</span></button>`;
  }).join('');
  $('#filters').innerHTML = chips;
  $('#filters').querySelectorAll('.chip').forEach(b => b.addEventListener('click', () => {
    ui.filter = b.dataset.f;
    try { localStorage.setItem('lib.filter', ui.filter); } catch { /* ignore */ }
    renderFilters(); renderGrid();
  }));
}
function renderGrid() {
  const list = visibleAssets();
  $('#count').textContent = `${list.length} of ${ASSETS.length} assets`;
  $('#grid').innerHTML = list.map(a => `
    <a class="card" href="#${a.id}">
      <div class="thumb"><img src="thumbs/${a.id}.webp" alt="${a.name}" loading="lazy" onerror="this.replaceWith(Object.assign(document.createElement('span'),{className:'nothumb',textContent:'No preview yet'}))"></div>
      <div class="card-meta"><span class="code">${a.code}</span><span class="cat">${catName(a.category)}</span></div>
      <h3>${a.name}</h3>
      <p>${a.summary}</p>
    </a>`).join('') || `<p class="empty">No assets match “${ui.query}”. Try a name, a code like MED-002, or a material.</p>`;
}

/* ------------------------------------------------------------------ 3D viewer */
let V = null;
const cache = new Map();

function css(name) { return getComputedStyle(document.documentElement).getPropertyValue(name).trim() || '#888'; }
function initViewer() {
  if (V) return V;
  const canvas = $('#view');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: !!THUMB, preserveDrawingBuffer: !!THUMB });
  renderer.setPixelRatio(THUMB ? 1 : Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = .85;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
  const camera = new THREE.PerspectiveCamera(32, 1, .01, 500);
  const controls = new OrbitControls(camera, canvas);
  controls.enableDamping = true;
  controls.maxPolarAngle = Math.PI * .495;
  controls.autoRotateSpeed = 1.4;
  scene.add(new THREE.HemisphereLight(0xffffff, 0x8a8178, .35));
  const key = new THREE.DirectionalLight(0xfff3e4, 3);
  key.castShadow = true;
  const SM = innerWidth < 800 ? 2048 : 4096;
  key.shadow.mapSize.set(SM, SM);
  key.shadow.bias = -.0003; key.shadow.normalBias = .012; key.shadow.radius = 5;
  scene.add(key, key.target);
  const rim = new THREE.DirectionalLight(0xdde7ff, .9); scene.add(rim);
  const fill = new THREE.DirectionalLight(0xffffff, .35); scene.add(fill);
  const fill2 = new THREE.DirectionalLight(0xf2f4ff, .8); scene.add(fill2); // lifts the far (left) side
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(400, 400),
    THUMB ? new THREE.ShadowMaterial({ opacity: .22 }) : new THREE.MeshStandardMaterial({ roughness: .94, envMapIntensity: .5 }));
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; scene.add(floor);
  V = { renderer, scene, camera, controls, key, rim, fill, fill2, floor, current: null, raf: 0 };
  applyStageColors();
  const ro = new ResizeObserver(() => resize()); ro.observe(canvas.parentElement);
  resize();
  return V;
}
function applyStageColors() {
  if (!V) return;
  if (THUMB) { V.scene.background = null; return; }
  const bg = new THREE.Color(css('--stage')), fl = new THREE.Color(css('--stage-floor'));
  V.scene.background = bg;
  V.scene.fog = new THREE.Fog(bg, 30, 90);
  V.floor.material.color = fl;
}
function resize() {
  const el = $('#view').parentElement, w = el.clientWidth, h = el.clientHeight;
  if (!w || !h) return;
  V.renderer.setSize(w, h, false);
  V.camera.aspect = w / h; V.camera.updateProjectionMatrix();
}
async function loadAsset(meta) {
  if (!cache.has(meta.id)) cache.set(meta.id, (async () => {
    const mod = await import(`./assets/${meta.id}.js`);
    const obj = mod.build();
    obj.rotation.order = 'YXZ'; // tilt in the model's own plane first, then turn on the turntable
    obj.rotation.y += meta.pose?.rotY ?? 0;
    obj.rotation.z += meta.pose?.rotZ ?? 0;
    obj.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(obj), c = box.getCenter(new THREE.Vector3());
    obj.position.set(-c.x, -box.min.y + (meta.pose?.lift ?? 0), -c.z);
    obj.updateMatrixWorld(true);
    const stats = { tris: 0, meshes: 0, mats: new Set() };
    obj.traverse(o => {
      if (!o.isMesh) return;
      const g = o.geometry, n = (g.index ? g.index.count : g.attributes.position.count) / 3;
      stats.tris += n * (o.isInstancedMesh ? o.count : 1); stats.meshes++;
      for (const m of [].concat(o.material)) { stats.mats.add(m); if (m.envMapIntensity !== undefined) m.envMapIntensity = .55; }
    });
    const fbox = new THREE.Box3().setFromObject(obj);
    return { obj, box: fbox, stats };
  })());
  return cache.get(meta.id);
}
function frame(meta, box) {
  const { camera, controls, key, rim, fill, fill2 } = V;
  const sphere = box.getBoundingSphere(new THREE.Sphere()), r = sphere.radius, c = sphere.center;
  const az = meta.view?.az ?? .5, el = meta.view?.el ?? .3;
  const dir = new THREE.Vector3(Math.sin(az) * Math.cos(el), Math.sin(el), Math.cos(az) * Math.cos(el));
  // tightest distance that keeps all eight box corners in view
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), tanH = tanV * camera.aspect;
  const R = new THREE.Vector3().crossVectors(new THREE.Vector3(0, 1, 0), dir).normalize(), U = new THREE.Vector3().crossVectors(dir, R);
  let fit = 0;
  for (let k = 0; k < 8; k++) {
    const p = new THREE.Vector3(k & 1 ? box.max.x : box.min.x, k & 2 ? box.max.y : box.min.y, k & 4 ? box.max.z : box.min.z).sub(c);
    fit = Math.max(fit, p.dot(dir) + Math.max(Math.abs(p.dot(R)) / tanH, Math.abs(p.dot(U)) / tanV));
  }
  fit *= THUMB ? 1.06 : 1.12;
  controls.target.copy(c);
  camera.position.copy(c).addScaledVector(dir, fit);
  camera.near = r / 50; camera.far = fit + r * 40; camera.updateProjectionMatrix();
  controls.minDistance = r * .35; controls.maxDistance = r * 6;
  controls.update();
  V.home = { pos: camera.position.clone(), target: c.clone() };
  key.position.copy(c).add(new THREE.Vector3(-.55, 1, .65).normalize().multiplyScalar(r * 4));
  key.target.position.copy(c);
  Object.assign(key.shadow.camera, { left: -r * 1.4, right: r * 1.4, top: r * 1.4, bottom: -r * 1.4, near: r * .5, far: r * 9 });
  key.shadow.camera.updateProjectionMatrix();
  rim.position.copy(c).add(new THREE.Vector3(.7, .5, -.9).multiplyScalar(r * 4));
  fill.position.copy(c).add(new THREE.Vector3(.6, .2, .9).multiplyScalar(r * 4));
  fill2.position.copy(c).add(new THREE.Vector3(-.3, .45, -.9).multiplyScalar(r * 4));
}
function loop() {
  V.controls.update();
  V.renderer.render(V.scene, V.camera);
  V.raf = requestAnimationFrame(loop);
}
function setWire(on) {
  if (!V?.current) return;
  V.current.obj.traverse(o => { if (o.isMesh) [].concat(o.material).forEach(m => { m.wireframe = on; }); });
  $('#t-wire').setAttribute('aria-pressed', on);
}

/* ------------------------------------------------------------------ detail view */
let openToken = 0;
async function openAsset(meta) {
  const token = ++openToken;
  $('#library').hidden = true; $('#detail').hidden = false;
  document.title = `${meta.name} · Lordville Asset Library`;
  $('#d-eyebrow').textContent = `${catName(meta.category)} · ${meta.code}`;
  $('#d-name').textContent = meta.name;
  $('#d-summary').textContent = meta.summary;
  $('#d-features').innerHTML = meta.features.map(f => `<li>${f}</li>`).join('');
  $('#d-added').textContent = meta.added;
  for (const id of ['#d-size', '#d-tris', '#d-meshes', '#d-mats']) $(id).textContent = '…';
  const list = visibleAssets().length ? visibleAssets() : ASSETS;
  const i = Math.max(0, list.findIndex(a => a.id === meta.id));
  const prev = list[(i - 1 + list.length) % list.length], next = list[(i + 1) % list.length];
  $('#d-prev').href = '#' + prev.id; $('#d-prev').title = prev.name;
  $('#d-next').href = '#' + next.id; $('#d-next').title = next.name;
  $('#d-pos').textContent = `${i + 1} / ${list.length}`;
  initViewer(); resize();
  $('#building').textContent = 'Building model…'; $('#building').hidden = false;
  if (!V.raf) loop();
  await new Promise(r => setTimeout(r, 30)); // let the overlay paint before the heavy build
  let res;
  try { res = await loadAsset(meta); } catch (e) {
    $('#building').textContent = `Could not build this model: ${e.message}`; console.error(e); return;
  }
  if (token !== openToken) return;
  if (V.current) { setWire(false); V.scene.remove(V.current.obj); }
  V.current = res; V.scene.add(res.obj);
  frame(meta, res.box);
  const s = res.box.getSize(new THREE.Vector3()).multiplyScalar(10);
  $('#d-size').textContent = `${s.x.toFixed(0)} × ${s.y.toFixed(0)} × ${s.z.toFixed(0)} cm`;
  $('#d-tris').textContent = fmt(Math.round(res.stats.tris));
  $('#d-meshes').textContent = fmt(res.stats.meshes);
  $('#d-mats').textContent = fmt(res.stats.mats.size);
  $('#building').hidden = true;
}
function closeDetail() {
  openToken++;
  $('#detail').hidden = true; $('#library').hidden = false;
  document.title = 'Lordville Asset Library';
  if (V?.raf) { cancelAnimationFrame(V.raf); V.raf = 0; }
}
function route() {
  const id = location.hash.slice(1), meta = ASSETS.find(a => a.id === id);
  meta ? openAsset(meta) : closeDetail();
}

/* ------------------------------------------------------------------ boot */
if (THUMB) {
  document.documentElement.classList.add('thumbmode');
  // review renders can override the camera: ?thumb=id&az=..&el=..&zoom=..
  const q = new URLSearchParams(location.search), base = ASSETS.find(a => a.id === THUMB);
  const meta = q.has('az') ? { ...base, view: { az: +q.get('az'), el: +(q.get('el') ?? .2) } } : base;
  if (q.has('zoom')) document.documentElement.style.setProperty('--zoom', q.get('zoom'));
  $('#library').hidden = true; $('#detail').hidden = false;
  initViewer(); resize();
  loadAsset(meta).then(res => {
    V.scene.add(res.obj); frame(meta, res.box);
    if (q.has('zoom')) { const z = +q.get('zoom'); V.camera.position.lerp(V.controls.target, 1 - 1 / z); if (q.has('tx')) { const d = new THREE.Vector3(+q.get('tx'), +(q.get('ty') ?? 0), 0).applyMatrix4(res.obj.matrixWorld).sub(V.controls.target); V.camera.position.add(d); V.controls.target.add(d); } V.camera.lookAt(V.controls.target); }
    for (let k = 0; k < 3; k++) V.renderer.render(V.scene, V.camera);
    window.__thumb = $('#view').toDataURL('image/webp', .9);
  });
} else {
  renderFilters(); renderGrid();
  $('#q').addEventListener('input', e => { ui.query = e.target.value; renderGrid(); });
  $('#t-rotate').addEventListener('click', e => {
    V.controls.autoRotate = !V.controls.autoRotate; e.currentTarget.setAttribute('aria-pressed', V.controls.autoRotate);
  });
  $('#t-wire').addEventListener('click', e => setWire(e.currentTarget.getAttribute('aria-pressed') !== 'true'));
  $('#t-reset').addEventListener('click', () => {
    if (!V?.home) return;
    V.camera.position.copy(V.home.pos); V.controls.target.copy(V.home.target); V.controls.update();
  });
  addEventListener('keydown', e => {
    if ($('#detail').hidden || e.target.matches('input')) return;
    if (e.key === 'Escape') location.hash = '';
    if (e.key === 'ArrowLeft') location.hash = $('#d-prev').hash;
    if (e.key === 'ArrowRight') location.hash = $('#d-next').hash;
  });
  const themeChange = () => applyStageColors();
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', themeChange);
  new MutationObserver(themeChange).observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
  addEventListener('hashchange', route);
  route();
}
