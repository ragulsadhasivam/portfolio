// Real-time 3D hero: a full-scale standing desk workstation and a jointed 3D avatar of Ragul, in metres.
// World scale: 1 unit = 1 metre. Avatar 1.82 m. Desktop surface at 1.02 m (about waist height).
// Likeness from the owner's character sheet: black open shirt over a white tee, olive chinos, white sneakers,
// short dark curly hair, short beard and moustache, silver bracelet (right wrist), dark smartwatch (left wrist).
// If assets/model/ragul.glb exists it replaces the procedural avatar (see loadGLB).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
const small = matchMedia('(max-width: 960px)').matches;

const COL = {
  skin: 0xa86f4c, skinDeep: 0x8f5b3d, hair: 0x17100c, beard: 0x1c1410,
  shirt: 0x15161b, tee: 0xf2f0ea, chino: 0x8b9a6b, shoe: 0xf4f2ec, sole: 0xc9c2b4,
  silver: 0xd3d7de, watch: 0x15181f, strap: 0x23272f,
  top: 0xf3efe8, black: 0x16171b, steel: 0x2a2c33, leaf: 0x3c8a52, pot: 0xece8e0, amber: 0xffa94d,
};
const mat = (c, o = {}) => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6, metalness: 0, ...o });
const rng = (s) => () => (s = (s * 16807) % 2147483647) / 2147483647;
const lerp = THREE.MathUtils.lerp, clamp = THREE.MathUtils.clamp;

/* ---------- helpers ---------- */
function roundedSlab(w, d, h, r, bevel = 0.004) {
  const s = new THREE.Shape(), x = -w / 2, y = -d / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r);
  s.lineTo(x + w, y + d - r); s.quadraticCurveTo(x + w, y + d, x + w - r, y + d);
  s.lineTo(x + r, y + d); s.quadraticCurveTo(x, y + d, x, y + d - r);
  s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y);
  const g = new THREE.ExtrudeGeometry(s, { depth: h, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 3, curveSegments: 8 });
  g.rotateX(-Math.PI / 2); return g;
}
function mesh(geo, material, parent, pos, shadow = true) {
  const m = new THREE.Mesh(geo, material); if (pos) m.position.set(...pos);
  m.castShadow = shadow; m.receiveShadow = true; parent && parent.add(m); return m;
}
function taper(r0, r1, len, material, parent, seg = 20) { // cylinder hanging down from its origin (-Y)
  const g = new THREE.CylinderGeometry(r0, r1, len, seg); g.translate(0, -len / 2, 0);
  const m = new THREE.Mesh(g, material); m.castShadow = true; m.receiveShadow = true; parent && parent.add(m); return m;
}
function canvasTex(w, h, draw) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h; const g = cv.getContext('2d'); draw(g, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t;
}

/* ---------- renderer / scene / camera ---------- */
const canvas = document.getElementById('scene3d-canvas');
const stage = document.getElementById('stage3d');
let renderer;
try {
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
} catch (e) { document.documentElement.classList.add('no-webgl'); throw e; }
renderer.setPixelRatio(Math.min(devicePixelRatio, small ? 1.6 : 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.02;
renderer.shadowMap.enabled = true; renderer.shadowMap.type = THREE.PCFSoftShadowMap;

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(27, 1, 0.1, 40);
const root = new THREE.Group(); scene.add(root);

/* ---------- lights: warm key, soft fill, faint rim ---------- */
scene.add(new THREE.HemisphereLight(0xffe4cf, 0xb4562c, 0.9));
const key = new THREE.DirectionalLight(0xffd9b6, 2.6); key.position.set(-2.6, 3.8, 3.4); key.target.position.set(0.4, 0.9, 0);
key.castShadow = true; key.shadow.mapSize.set(small ? 1024 : 2048, small ? 1024 : 2048);
Object.assign(key.shadow.camera, { left: -3, right: 3, top: 3, bottom: -1, near: 0.5, far: 12 });
key.shadow.radius = 5; key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02;
scene.add(key, key.target);
const fill = new THREE.DirectionalLight(0xfff0e2, 0.7); fill.position.set(3, 1.8, 4); scene.add(fill);
const rim = new THREE.DirectionalLight(0xff9a62, 1.1); rim.position.set(2.5, 2.4, -3); scene.add(rim);

/* ---------- floor: catches shadows only, so the page's terracotta shows through ---------- */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 8), new THREE.ShadowMaterial({ opacity: 0.4 }));
floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true; root.add(floor);
function blob(x, z, w, d, op) {
  const t = canvasTex(128, 128, (g) => { const gr = g.createRadialGradient(64, 64, 2, 64, 64, 62); gr.addColorStop(0, 'rgba(60,24,8,1)'); gr.addColorStop(1, 'rgba(60,24,8,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), new THREE.MeshBasicMaterial({ map: t, transparent: true, opacity: op, depthWrite: false }));
  m.rotation.x = -Math.PI / 2; m.position.set(x, 0.003, z); root.add(m); return m;
}

/* ---------- the workstation (real scale) ---------- */
const desk = new THREE.Group(); root.add(desk);
const DESK_Y = 1.02;            // desktop surface height (m)
const topM = mat(COL.top, { roughness: 0.42 }), blackM = mat(COL.black, { roughness: 0.5 }), steelM = mat(COL.steel, { roughness: 0.4, metalness: 0.4 });

const slab = mesh(roundedSlab(1.8, 0.8, 0.032, 0.05, 0.004), topM, desk, [0, DESK_Y - 0.036, 0]);   // 1.8 x 0.8 m top
[-1, 1].forEach((s) => {
  mesh(new THREE.BoxGeometry(0.075, 0.9, 0.075), steelM, desk, [s * 0.74, 0.5, 0]);                 // columns
  mesh(new THREE.BoxGeometry(0.075, 0.045, 0.72), steelM, desk, [s * 0.74, 0.0225, 0]);             // feet
  mesh(new THREE.BoxGeometry(0.12, 0.07, 0.62), steelM, desk, [s * 0.74, DESK_Y - 0.075, 0]);       // top brackets
  mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.025, 14), steelM, desk, [s * 0.74, 0.008, 0.34]).rotation.x = Math.PI / 2; // glides
});
mesh(new THREE.BoxGeometry(1.48, 0.06, 0.05), steelM, desk, [0, DESK_Y - 0.105, -0.28]);            // rear crossbar
mesh(new THREE.BoxGeometry(0.16, 0.022, 0.012), blackM, desk, [0.62, DESK_Y - 0.06, 0.4]);          // height controller
const ctl = canvasTex(256, 40, (g, w, h) => { g.fillStyle = '#0d0e11'; g.fillRect(0, 0, w, h); g.fillStyle = '#e8e4dc'; g.font = '20px sans-serif'; g.fillText('^  v   1  2  3  4', 14, 28); });
mesh(new THREE.PlaneGeometry(0.15, 0.02), new THREE.MeshBasicMaterial({ map: ctl }), desk, [0.62, DESK_Y - 0.06, 0.4065], false);

// curved ultrawide monitor (about 1.2 m wide, 0.35 m tall)
const MON = { w: 1.2, h: 0.36, R: 1.8, y: DESK_Y + 0.33, z: -0.2 };
const arc = MON.w / MON.R;
const wall = new THREE.TextureLoader().load('assets/img/wallpaper.jpg'); wall.colorSpace = THREE.SRGBColorSpace; wall.wrapS = THREE.RepeatWrapping; wall.repeat.x = -1; wall.offset.x = 1; wall.anisotropy = 4;
const screenMat = new THREE.MeshBasicMaterial({ map: wall, side: THREE.BackSide });
const mon = new THREE.Group(); mon.position.set(0, MON.y, MON.z + MON.R); desk.add(mon);
const mk = (r, h, mt, side) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r, r, h, 48, 1, true, Math.PI - arc / 2, arc), mt); m.material.side = side; m.castShadow = true; mon.add(m); return m; };
mk(MON.R, MON.h, screenMat, THREE.BackSide);
mk(MON.R + 0.004, MON.h + 0.022, new THREE.MeshStandardMaterial({ color: 0x0b0b0e, roughness: 0.4 }), THREE.BackSide).scale.set(1, 1, 1);
const shell = new THREE.Mesh(new THREE.CylinderGeometry(MON.R + 0.03, MON.R + 0.03, MON.h + 0.022, 48, 1, false, Math.PI - arc / 2 - 0.004, arc + 0.008), new THREE.MeshStandardMaterial({ color: 0x101114, roughness: 0.45 })); shell.castShadow = true; mon.add(shell);
mesh(new THREE.BoxGeometry(0.07, 0.24, 0.045), blackM, desk, [0, DESK_Y + 0.12, MON.z - 0.03]);        // neck
mesh(new THREE.BoxGeometry(0.46, 0.014, 0.22), blackM, desk, [0, DESK_Y + 0.007, MON.z + 0.06]);       // base
const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.009, 0.009, 0.46, 12), blackM); bar.rotation.z = Math.PI / 2; bar.position.set(0, MON.y + MON.h / 2 + 0.035, MON.z - 0.01); bar.castShadow = true; desk.add(bar);
mesh(new THREE.BoxGeometry(0.02, 0.05, 0.035), blackM, desk, [0, MON.y + MON.h / 2 + 0.01, MON.z - 0.01]);

// keyboard, mat, mouse
const kbTex = canvasTex(512, 160, (g, w, h) => {
  g.fillStyle = '#17181c'; g.fillRect(0, 0, w, h);
  for (let r = 0; r < 5; r++) for (let c = 0; c < 21; c++) { g.fillStyle = '#26282f'; g.fillRect(10 + c * 23.6, 10 + r * 28, 20, 22); g.fillStyle = 'rgba(255,170,80,.55)'; g.fillRect(10 + c * 23.6, 31 + r * 28, 20, 2); }
});
mesh(new THREE.BoxGeometry(0.8, 0.003, 0.3), mat(0x101114, { roughness: 0.9 }), desk, [0.0, DESK_Y + 0.0015, 0.17]);   // desk mat
const kb = mesh(new THREE.BoxGeometry(0.44, 0.022, 0.14), blackM, desk, [-0.03, DESK_Y + 0.014, 0.18]);
mesh(new THREE.PlaneGeometry(0.42, 0.13), new THREE.MeshStandardMaterial({ map: kbTex, roughness: 0.5 }), desk, [-0.03, DESK_Y + 0.0262, 0.18], false).rotation.x = -Math.PI / 2;
const mouse = mesh(new THREE.SphereGeometry(0.03, 20, 14), blackM, desk, [0.34, DESK_Y + 0.014, 0.19]); mouse.scale.set(0.9, 0.5, 1.55);

// phone on stand, pen cup, headphones, plants, books
const phoneTex = canvasTex(128, 256, (g, w, h) => { const gr = g.createLinearGradient(0, 0, w, h); gr.addColorStop(0, '#0c0d12'); gr.addColorStop(0.7, '#1b1210'); gr.addColorStop(1, '#ff9a3c'); g.fillStyle = gr; g.fillRect(0, 0, w, h); });
const ph = new THREE.Group(); ph.position.set(-0.56, DESK_Y, 0.05); ph.rotation.y = 0.35; desk.add(ph);
mesh(new THREE.CylinderGeometry(0.05, 0.055, 0.012, 24), blackM, ph, [0, 0.006, 0]);
mesh(new THREE.BoxGeometry(0.014, 0.1, 0.016), blackM, ph, [0, 0.06, -0.01]);
const phone = mesh(new THREE.BoxGeometry(0.072, 0.15, 0.008), blackM, ph, [0, 0.12, 0]); phone.rotation.x = -0.18;
const pscr = mesh(new THREE.PlaneGeometry(0.066, 0.143), new THREE.MeshBasicMaterial({ map: phoneTex }), phone, [0, 0, 0.0045], false);

const cup = mesh(new THREE.CylinderGeometry(0.036, 0.034, 0.1, 24), blackM, desk, [0.38, DESK_Y + 0.05, -0.12]);
const r1 = rng(11);
for (let i = 0; i < 6; i++) { const p = mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.16, 6), mat(i % 2 ? 0xc2955a : 0x2b2b2e), desk, [0.38 + (r1() - 0.5) * 0.04, DESK_Y + 0.14, -0.12 + (r1() - 0.5) * 0.04]); p.rotation.set((r1() - 0.5) * 0.3, 0, (r1() - 0.5) * 0.3); }
mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.008, 20), blackM, desk, [0.52, DESK_Y + 0.004, -0.02]);   // coaster

const hp = new THREE.Group(); hp.position.set(-0.8, DESK_Y, 0.0); desk.add(hp);
mesh(new THREE.CylinderGeometry(0.075, 0.08, 0.012, 28), blackM, hp, [0, 0.006, 0]);
mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.26, 10), blackM, hp, [0, 0.14, 0]);
const band = new THREE.Mesh(new THREE.TorusGeometry(0.095, 0.011, 10, 28, Math.PI), blackM); band.position.set(0, 0.3, 0); band.castShadow = true; hp.add(band);
[-1, 1].forEach((s) => { const c = mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.04, 26), mat(0x1b1c21, { roughness: 0.55 }), hp, [s * 0.095, 0.3, 0]); c.rotation.z = Math.PI / 2; mesh(new THREE.TorusGeometry(0.037, 0.005, 8, 22), mat(0x8a6a3a, { metalness: 0.5, roughness: 0.35 }), c, [0, s * 0.021, 0]).rotation.x = Math.PI / 2; });

function plant(x, y, z, scale = 1) {
  const g = new THREE.Group(); g.position.set(x, y, z); g.scale.setScalar(scale); desk.add(g);
  mesh(new THREE.CylinderGeometry(0.07, 0.055, 0.1, 26), mat(COL.pot, { roughness: 0.7 }), g, [0, 0.05, 0]);
  mesh(new THREE.CylinderGeometry(0.066, 0.066, 0.012, 22), mat(0x4a3322), g, [0, 0.098, 0]);
  const r = rng(Math.floor(x * 100 + 7));
  for (let i = 0; i < 12; i++) {
    const l = mesh(new THREE.SphereGeometry(0.04, 12, 8), mat(i % 3 ? COL.leaf : 0x2f7a47, { roughness: 0.6, side: THREE.DoubleSide }), g, null);
    const a = (i / 12) * Math.PI * 2 + r(); const h = 0.13 + r() * 0.12;
    l.scale.set(0.7, 1.7 + r() * 0.8, 0.22); l.position.set(Math.cos(a) * 0.045, h, Math.sin(a) * 0.045); l.rotation.z = -Math.cos(a) * 0.8; l.rotation.x = Math.sin(a) * 0.8;
  }
  return g;
}
plant(-0.66, DESK_Y, 0.16, 1.05);
const books = new THREE.Group(); books.position.set(0.74, DESK_Y, -0.12); desk.add(books);
[[0.26, 0.036, 0.19, 0x1a1b20, 0], [0.25, 0.03, 0.18, 0x2b2c33, 0.05], [0.24, 0.026, 0.17, 0x1d1e23, -0.03]].forEach(([w, h, d, c, ry], i) => {
  mesh(new THREE.BoxGeometry(w, h, d), mat(c, { roughness: 0.7 }), books, [0, [0.018, 0.051, 0.079][i], 0]).rotation.y = ry;
});
plant(0.74, DESK_Y + 0.092, -0.12, 0.8);

blob(0, 0.05, 2.2, 1.1, 0.34);

/* ---------- the avatar (jointed, 1.82 m) ---------- */
const AV_X = 1.32, AV_Z = 0.28;
const person = new THREE.Group(); person.position.set(AV_X, 0, AV_Z); person.rotation.y = -0.38; root.add(person);
const skin = mat(COL.skin, { roughness: 0.55 }), skinDeep = mat(COL.skinDeep, { roughness: 0.6 }), hairM = mat(COL.hair, { roughness: 0.9 });
const shirtM = mat(COL.shirt, { roughness: 0.88 }), teeM = mat(COL.tee, { roughness: 0.85 }), chinoM = mat(COL.chino, { roughness: 0.9 });
const rig = {}; // named joints for animation

const hips = new THREE.Group(); hips.position.y = 0.96; person.add(hips); rig.hips = hips;
// legs
function leg(side) {
  const hipJ = new THREE.Group(); hipJ.position.set(side * 0.085, -0.02, 0); hips.add(hipJ);
  const thigh = taper(0.085, 0.062, 0.46, chinoM, hipJ);
  const knee = new THREE.Group(); knee.position.y = -0.46; hipJ.add(knee);
  const shin = taper(0.062, 0.047, 0.44, chinoM, knee);
  const cuff = taper(0.05, 0.052, 0.05, chinoM, knee); cuff.position.y = -0.4;
  const ankle = new THREE.Group(); ankle.position.y = -0.44; knee.add(ankle);
  const shoe = mesh(new THREE.SphereGeometry(0.1, 24, 16), mat(COL.shoe, { roughness: 0.55 }), ankle, [0, -0.04, 0.07]); shoe.scale.set(0.82, 0.55, 1.75);
  mesh(new THREE.BoxGeometry(0.1, 0.022, 0.285), mat(COL.sole, { roughness: 0.7 }), ankle, [0, -0.083, 0.075]);
  const lace = mesh(new THREE.BoxGeometry(0.07, 0.01, 0.1), mat(0xe8e5dd), ankle, [0, 0.0, 0.07]); lace.rotation.x = -0.4;
  return { hipJ, knee, ankle };
}
rig.legR = leg(-1); rig.legL = leg(1);
mesh(new THREE.SphereGeometry(0.16, 24, 16), chinoM, hips, [0, -0.13, 0]).scale.set(1.08, 0.62, 0.62);

// spine / torso: white tee core + black open shirt (lathe with the front cut away)
const spine = new THREE.Group(); spine.position.y = 0.02; hips.add(spine); rig.spine = spine;
const prof = [[0.175, -0.13], [0.172, -0.05], [0.166, 0.06], [0.172, 0.22], [0.19, 0.36], [0.2, 0.46], [0.17, 0.52], [0.075, 0.55]].map(([r, y]) => new THREE.Vector2(r, y));
const tee = new THREE.Mesh(new THREE.LatheGeometry(prof, 36), teeM); tee.scale.set(1.28, 1, 0.66); tee.castShadow = tee.receiveShadow = true; spine.add(tee);
const shirtProf = [[0.215, -0.16], [0.205, -0.08], [0.195, 0.02], [0.19, 0.12], [0.205, 0.25], [0.222, 0.37], [0.228, 0.46], [0.18, 0.52], [0.09, 0.545]].map(([r, y]) => new THREE.Vector2(r, y));
const shirtGeo = new THREE.LatheGeometry(shirtProf, 40, 0.62, Math.PI * 2 - 1.24);
const shirt = new THREE.Mesh(shirtGeo, new THREE.MeshStandardMaterial({ color: COL.shirt, roughness: 0.88, side: THREE.DoubleSide })); shirt.scale.set(1.28, 1, 0.68); shirt.castShadow = shirt.receiveShadow = true; spine.add(shirt);
[-1, 1].forEach((s) => {   // collar + front edges
  const col = mesh(new THREE.BoxGeometry(0.1, 0.035, 0.02), shirtM, spine, [s * 0.075, 0.545, 0.115]); col.rotation.set(0.5, s * 0.15, s * -0.7);
  const edge = mesh(new THREE.BoxGeometry(0.012, 0.6, 0.02), shirtM, spine, [s * 0.145, 0.24, 0.158]); edge.rotation.set(0, s * -0.55, s * 0.05);
});
const neckJ = new THREE.Group(); neckJ.position.y = 0.56; spine.add(neckJ); rig.neck = neckJ;
mesh(new THREE.CylinderGeometry(0.052, 0.062, 0.1, 22), skinDeep, neckJ, [0, 0.0, 0.01]);

// arms (shoulder -> elbow -> hand)
function arm(side) {
  const sh = new THREE.Group(); sh.position.set(side * 0.255, 0.44, 0); spine.add(sh);
  const cap = mesh(new THREE.SphereGeometry(0.066, 20, 16), shirtM, sh, [0, 0, 0]);
  taper(0.062, 0.052, 0.3, shirtM, sh);
  const el = new THREE.Group(); el.position.y = -0.3; sh.add(el);
  mesh(new THREE.SphereGeometry(0.053, 18, 14), shirtM, el, [0, 0, 0]);
  taper(0.053, 0.05, 0.11, shirtM, el);                      // rolled sleeve
  const fore = taper(0.044, 0.033, 0.26, skin, el); fore.position.y = -0.04;
  const wr = new THREE.Group(); wr.position.y = -0.3; el.add(wr);
  const hand = mesh(new THREE.SphereGeometry(0.043, 18, 14), skin, wr, [0, -0.045, 0]); hand.scale.set(0.95, 1.25, 0.6);
  const finger = mesh(new THREE.CylinderGeometry(0.009, 0.01, 0.075, 10), skin, wr, [0, -0.13, 0.012]); finger.visible = false;
  if (side < 0) { const b = mesh(new THREE.TorusGeometry(0.036, 0.004, 8, 24), mat(COL.silver, { metalness: 0.85, roughness: 0.25 }), wr, [0, -0.012, 0]); b.rotation.x = Math.PI / 2; }
  else { mesh(new THREE.CylinderGeometry(0.037, 0.037, 0.026, 26), mat(COL.strap), wr, [0, -0.012, 0]); mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.012, 26), mat(COL.watch, { roughness: 0.25, metalness: 0.4 }), wr, [0, -0.012, 0.034]).rotation.x = Math.PI / 2; }
  return { sh, el, wr, finger, hand };
}
rig.armR = arm(-1); rig.armL = arm(1);

// head (about 0.23 m tall, in the owner's likeness)
const headJ = new THREE.Group(); headJ.position.set(0, 0.1, 0.012); neckJ.add(headJ); rig.head = headJ;
const head = new THREE.Group(); head.scale.setScalar(0.31); headJ.add(head);
const HS = new THREE.Vector3(0.92, 1.06, 0.97), HR = 0.36;
const hm = (geo, m) => { const x = new THREE.Mesh(geo, m); x.castShadow = true; x.receiveShadow = true; return x; };
const skull = hm(new THREE.SphereGeometry(HR, 56, 40), skin); skull.scale.copy(HS); head.add(skull);
const jaw = hm(new THREE.SphereGeometry(HR * 0.86, 44, 30), skin); jaw.scale.set(0.9, 0.74, 0.92); jaw.position.set(0, -0.16, 0.03); head.add(jaw);
const beardM = mat(COL.beard, { roughness: 0.95, side: THREE.DoubleSide });
const beard = hm(new THREE.SphereGeometry(HR * 1.012, 48, 32, 0.04 * Math.PI, 0.92 * Math.PI, 0.72 * Math.PI, 0.3 * Math.PI), beardM); beard.scale.copy(HS); head.add(beard);
const jawBeard = hm(new THREE.SphereGeometry(HR * 0.865, 40, 28, 0.04 * Math.PI, 0.92 * Math.PI, 0.45 * Math.PI, 0.55 * Math.PI), beardM); jawBeard.scale.set(0.9, 0.74, 0.92); jawBeard.position.copy(jaw.position); head.add(jawBeard);
const stub = hm(new THREE.SphereGeometry(HR * 1.008, 48, 32, 0.05 * Math.PI, 0.9 * Math.PI, 0.5 * Math.PI, 0.24 * Math.PI), mat(COL.beard, { transparent: true, opacity: 0.4, roughness: 1, side: THREE.DoubleSide })); stub.scale.copy(HS); head.add(stub);
[-1, 1].forEach((s) => { const e = hm(new THREE.SphereGeometry(0.075, 16, 12), skinDeep); e.scale.set(0.45, 1, 0.75); e.position.set(s * 0.335, -0.01, -0.01); head.add(e); });
const nose = hm(new THREE.SphereGeometry(0.05, 18, 14), skinDeep); nose.scale.set(0.9, 1.15, 1.05); nose.position.set(0, -0.035, 0.355); head.add(nose);
const eyes = new THREE.Group(); head.add(eyes); const irises = [];
[-1, 1].forEach((s) => {
  const eg = new THREE.Group(); eg.position.set(s * 0.12, 0.052, 0.318); eyes.add(eg);
  const w = new THREE.Mesh(new THREE.SphereGeometry(0.058, 22, 16), mat(0xf8f5ee, { roughness: 0.25 })); w.scale.set(1.15, 0.8, 0.5); eg.add(w);
  const ir = new THREE.Group(); ir.position.z = 0.017; eg.add(ir); irises.push(ir);
  const iris = new THREE.Mesh(new THREE.SphereGeometry(0.034, 18, 14), mat(0x3b2112, { roughness: 0.2 })); iris.scale.set(1, 1, 0.45); ir.add(iris);
  const pupil = new THREE.Mesh(new THREE.SphereGeometry(0.016, 14, 10), mat(0x050302, { roughness: 0.1 })); pupil.position.z = 0.01; pupil.scale.set(1, 1, 0.4); ir.add(pupil);
  const glint = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff })); glint.position.set(0.012, 0.012, 0.018); ir.add(glint);
  const brow = hm(new THREE.BoxGeometry(0.15, 0.04, 0.035), hairM); brow.position.set(s * 0.125, 0.15, 0.335); brow.rotation.set(-0.12, 0, s * -0.12); head.add(brow);
});
[-1, 1].forEach((s) => { const m = hm(new THREE.SphereGeometry(0.05, 16, 12), mat(COL.beard, { roughness: 0.95 })); m.scale.set(1.7, 0.5, 0.6); m.position.set(s * 0.055, -0.1, 0.345); m.rotation.z = s * -0.2; head.add(m); });
const smile = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.009, 8, 24, Math.PI * 0.62), mat(0x3a1512)); smile.rotation.z = Math.PI * 1.19; smile.position.set(0, -0.125, 0.345); smile.scale.set(1, 0.8, 0.5); head.add(smile);
const mouth = new THREE.Mesh(new THREE.SphereGeometry(0.05, 20, 14), mat(0x3a1512, { roughness: 0.5 })); mouth.scale.set(1.1, 0.18, 0.3); mouth.position.set(0, -0.165, 0.338); mouth.visible = false; head.add(mouth);
const backCap = hm(new THREE.SphereGeometry(HR * 1.04, 40, 28, Math.PI, Math.PI, 0, 0.66 * Math.PI), hairM); backCap.scale.copy(HS); backCap.position.y = 0.01; head.add(backCap);
const topCap = hm(new THREE.SphereGeometry(HR * 1.05, 40, 28, 0, Math.PI * 2, 0, 0.3 * Math.PI), hairM); topCap.scale.copy(HS); topCap.position.set(0, 0.015, -0.02); topCap.rotation.x = -0.12; head.add(topCap);
[-1, 1].forEach((s) => { const sb = hm(new THREE.BoxGeometry(0.03, 0.17, 0.06), hairM); sb.position.set(s * 0.33, 0.04, 0.12); head.add(sb); });
const r2 = rng(31);
for (let i = 0; i < 64; i++) {
  const th = Math.acos(1 - r2() * 0.8) * 0.92, ph2 = r2() * Math.PI * 2, rr = 0.07 + r2() * 0.07;
  if (Math.sin(ph2) > 0.4 && th > 0.9) continue;
  const cl = hm(new THREE.SphereGeometry(rr, 12, 10), hairM); const R = HR * 1.04 + rr * 0.35;
  cl.position.set(Math.sin(th) * Math.cos(ph2) * R * HS.x, Math.cos(th) * R * HS.y + 0.02, Math.sin(th) * Math.sin(ph2) * R * HS.z - 0.01); head.add(cl);
}

blob(AV_X, AV_Z, 0.7, 0.5, 0.45);

/* ---------- poses: target joint angles, eased every frame ---------- */
const POSES = {
  pocket: { // hands in pockets, relaxed (like the character sheet)
    armR: { sx: 0.08, sz: -0.04, ex: -0.55, ez: 0.3, fin: false }, armL: { sx: 0.08, sz: 0.04, ex: -0.55, ez: -0.3, fin: false }, spineY: 0,
  },
  point: {  // right hand points at the viewer
    armR: { sx: -1.38, sz: -0.12, ex: -0.22, ez: 0, fin: true }, armL: { sx: 0.08, sz: 0.04, ex: -0.55, ez: -0.3, fin: false }, spineY: -0.1,
  },
  explain: { // open hand gesture
    armR: { sx: -0.75, sz: -0.5, ex: -1.25, ez: 0.1, fin: false }, armL: { sx: 0.08, sz: 0.04, ex: -0.55, ez: -0.3, fin: false }, spineY: -0.08,
  },
  arms: {    // arms crossed
    armR: { sx: -0.35, sz: 0.55, ex: -1.9, ez: -0.7, fin: false }, armL: { sx: -0.35, sz: -0.55, ex: -1.9, ez: 0.7, fin: false }, spineY: 0,
  },
};
const cur = { armR: { sx: 0, sz: 0, ex: 0, ez: 0 }, armL: { sx: 0, sz: 0, ex: 0, ez: 0 }, spineY: 0 };
let poseName = 'pocket';
const st = { yaw: 0, pitch: 0, mouth: 0, speaking: false, pulse: 0, blinkAt: 2.2, blinkT: -1, shiftAt: 5, shiftFrom: 0, shiftTo: 0, shiftT: 0, last: 0 };
const pointer = new THREE.Vector2(0, 0);

function applyArm(a, tgt, k) {
  const c = cur[a === rig.armR ? 'armR' : 'armL'];
  c.sx = lerp(c.sx, tgt.sx, k); c.sz = lerp(c.sz, tgt.sz, k); c.ex = lerp(c.ex, tgt.ex, k); c.ez = lerp(c.ez, tgt.ez, k);
  a.sh.rotation.set(c.sx, 0, c.sz); a.el.rotation.set(c.ex, 0, c.ez); a.finger.visible = tgt.fin;
}
function update(t, dt) {
  const k = 1 - Math.exp(-dt * 4.5);
  const P = POSES[poseName];
  applyArm(rig.armR, P.armR, k); applyArm(rig.armL, P.armL, k);
  cur.spineY = lerp(cur.spineY, P.spineY, k);
  // breathing (chest and shoulders), quiet sway, occasional weight shift
  const b = Math.sin(t * 1.5), b2 = Math.sin(t * 0.55);
  spine.scale.set(1 + 0.006 * b, 1 + 0.01 * b, 1 + 0.008 * b);
  spine.position.y = 0.02 + 0.003 * b;
  if (t > st.shiftAt && st.shiftT <= 0) { st.shiftFrom = hips.position.x; st.shiftTo = (Math.random() - 0.5) * 0.05; st.shiftT = 1; st.shiftAt = t + 6 + Math.random() * 5; }
  if (st.shiftT > 0) { st.shiftT = Math.max(0, st.shiftT - dt / 2.2); const e = 1 - st.shiftT; hips.position.x = lerp(st.shiftFrom, st.shiftTo, e * e * (3 - 2 * e)); }
  hips.rotation.z = -hips.position.x * 0.5 + 0.006 * b2; spine.rotation.z = hips.position.x * 0.5 - 0.006 * b2;
  spine.rotation.y = cur.spineY + 0.02 * Math.sin(t * 0.4);
  // head: follows the pointer, gently
  const ty = clamp(pointer.x, -1, 1) * 0.5 + 0.38 * 0 - 0.1, tx = clamp(-pointer.y, -1, 1) * 0.25;
  st.yaw = lerp(st.yaw, ty, 1 - Math.exp(-dt * 4)); st.pitch = lerp(st.pitch, tx, 1 - Math.exp(-dt * 4));
  neckJ.rotation.set(st.pitch * 0.5, st.yaw * 0.5, 0); headJ.rotation.set(st.pitch * 0.5 + (st.speaking ? Math.sin(t * 3) * 0.03 : 0), st.yaw * 0.5, 0);
  irises.forEach((ir) => { ir.position.x = clamp(st.yaw + 0.2, -0.6, 0.6) * 0.025; ir.position.y = st.pitch * 0.02; });
  // blink
  if (t > st.blinkAt && st.blinkT < 0) st.blinkT = t;
  if (st.blinkT >= 0) { const p = (t - st.blinkT) / 0.15; eyes.scale.y = p < 1 ? 1 - Math.sin(p * Math.PI) * 0.92 : 1; if (p >= 1) { st.blinkT = -1; st.blinkAt = t + 2.2 + Math.random() * 3.2; } }
  // mouth
  st.pulse *= Math.exp(-dt * 7);
  const open = st.speaking ? Math.min(1, 0.28 + st.pulse * 0.72 + (Math.sin(t * 17) * 0.5 + 0.5) * 0.22) : 0;
  st.mouth = lerp(st.mouth, open, 1 - Math.exp(-dt * 22));
  const talk = st.mouth > 0.12; mouth.visible = talk; smile.visible = !talk; mouth.scale.y = 0.18 + st.mouth * 1.2; mouth.position.y = -0.165 - st.mouth * 0.012;
  // phone glow shimmer
  pscr.material.color.setScalar(0.92 + 0.08 * Math.sin(t * 0.8));
  if (mixer) mixer.update(dt);
}

/* ---------- optional: a generated 3D model replaces the procedural avatar ---------- */
let mixer = null;
async function loadGLB(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  const m = gltf.scene; const box = new THREE.Box3().setFromObject(m); const size = box.getSize(new THREE.Vector3());
  const s = 1.82 / size.y; m.scale.setScalar(s); box.setFromObject(m); m.position.y -= box.min.y;
  m.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  person.clear(); person.add(m); person.rotation.y = -0.3;
  if (gltf.animations && gltf.animations.length) { mixer = new THREE.AnimationMixer(m); mixer.clipAction(gltf.animations[0]).play(); }
  window.__glb = true;
}

/* ---------- layout, loop ---------- */
let camOverride = null;
function frameCamera() {
  const w = canvas.clientWidth, h = canvas.clientHeight; if (!w || !h) return;
  renderer.setSize(w, h, false); camera.aspect = w / h;
  if (camOverride) { camera.fov = camOverride.fov || 27; camera.position.set(...camOverride.pos); camera.lookAt(...camOverride.look); camera.updateProjectionMatrix(); return; }
  camera.fov = 27;
  const fov = THREE.MathUtils.degToRad(camera.fov);
  const needH = 2.3, needW = 2.95;                                  // metres to keep in frame: floor to 2.1 m, desk + avatar width
  const d = Math.max(needH / (2 * Math.tan(fov / 2)), needW / (2 * Math.tan(fov / 2) * camera.aspect));
  camera.position.set(0.42, 1.42, d + 0.25); camera.lookAt(0.42, 0.95, 0); camera.updateProjectionMatrix();
}
new ResizeObserver(frameCamera).observe(canvas); frameCamera();
addEventListener('pointermove', (e) => pointer.set((e.clientX / innerWidth) * 2 - 1, (e.clientY / innerHeight) * 2 - 1), { passive: true });

let visible = true, running = false, t0 = performance.now(), last = 0;
function frame(now) {
  const t = (now - t0) / 1000, dt = Math.min(0.05, t - last); last = t;
  update(t, reduce ? 0.016 : dt);
  renderer.render(scene, camera);
}
function loop() {
  if (reduce) { frame(performance.now()); return; }
  if (running || !visible || document.hidden) return;
  running = true;
  const tick = (now) => { if (!visible || document.hidden) { running = false; return; } frame(now); requestAnimationFrame(tick); };
  requestAnimationFrame(tick);
}
new IntersectionObserver(([e]) => { visible = e.isIntersecting; loop(); }).observe(stage);
document.addEventListener('visibilitychange', loop);
if (reduce) { for (let i = 0; i < 90; i++) update(i / 30, 1 / 30); }
loop();
stage.classList.add('ready');
const glbUrl = document.body.dataset.avatarGlb; if (glbUrl) loadGLB(glbUrl);

/* ---------- API for the page script ---------- */
window.scene3d = {
  setPose(name) { const map = { stand: 'pocket', lean: 'pocket', arms: 'arms', point: 'point', explain: 'explain' }; poseName = POSES[map[name] || name] ? (map[name] || name) : 'pocket'; if (reduce) { for (let i = 0; i < 60; i++) update(last + i / 30, 1 / 30); renderer.render(scene, camera); } },
  setSpeaking(v) { st.speaking = v; },
  pulse() { st.pulse = 1; },
  info() { return { avatarHeightM: 1.82, deskTopM: DESK_Y, deskWidthM: 1.8, deskDepthM: 0.8, monitorWidthM: MON.w, glb: !!window.__glb, objects: root.children.length, draws: renderer.info.render.calls, tris: renderer.info.render.triangles }; },
  view(o) { camOverride = o || null; frameCamera(); if (reduce) renderer.render(scene, camera); },
  _rig: rig,
};
document.dispatchEvent(new Event('scene3d-ready'));
