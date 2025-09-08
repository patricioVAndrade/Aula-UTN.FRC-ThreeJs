import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';

/** =================
 *  ESCENA + RENDERER
 * ================= */
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0b0f14);

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 100);
// Altura de ojos y spawn en zona despejada (frente del aula)
camera.position.set(0, 1.65, -1.0);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

/** =========
 *  LUCES
 * ========= */
scene.add(new THREE.HemisphereLight(0xffffff, 0x202535, 0.5));

const sun = new THREE.DirectionalLight(0xffffff, 0.8);
sun.position.set(6, 8, 4);
sun.castShadow = true;
sun.shadow.mapSize.set(1024,1024);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 30;
sun.shadow.camera.left = -12;
sun.shadow.camera.right = 12;
sun.shadow.camera.top = 10;
sun.shadow.camera.bottom = -10;
scene.add(sun);

// 3 lamparitas de techo
const lampY = 5.6;
[ new THREE.Vector3(-6, lampY, -2),
  new THREE.Vector3(0,  lampY, -2),
  new THREE.Vector3(6,  lampY, -2)
].forEach(p => {
  const bulb = new THREE.PointLight(0xffffff, 0.35, 20, 2.0);
  bulb.position.copy(p);
  bulb.castShadow = true;
  scene.add(bulb);

  const bulbMesh = new THREE.Mesh(
    new THREE.SphereGeometry(0.12, 16, 16),
    new THREE.MeshStandardMaterial({ emissive: 0xffffff, emissiveIntensity: 2, color: 0xddddff })
  );
  bulbMesh.position.copy(p);
  scene.add(bulbMesh);
});

/** =========================
 *  AULA (piso, paredes, techo)
 * ========================= */
const floor = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 14),
  new THREE.MeshStandardMaterial({ color: 0x383e49, roughness: 0.95 })
);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// Pared fondo (z=-8)
const backWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 6),
  new THREE.MeshStandardMaterial({ color: 0xf2f5f9, roughness: 1.0 })
);
backWall.position.set(0, 3, -8);
backWall.receiveShadow = true;
scene.add(backWall);

// Pared izquierda (x=-10)
const leftWall = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 6),
  new THREE.MeshStandardMaterial({ color: 0xecf1f7, roughness: 1.0 })
);
leftWall.rotation.y = Math.PI / 2;
leftWall.position.set(-10, 3, -1);
leftWall.receiveShadow = true;
scene.add(leftWall);

// Pared derecha (x=10)
const rightWall = new THREE.Mesh(
  new THREE.PlaneGeometry(14, 6),
  new THREE.MeshStandardMaterial({ color: 0xecf1f7, roughness: 1.0 })
);
rightWall.rotation.y = -Math.PI / 2;
rightWall.position.set(10, 3, -1);
rightWall.receiveShadow = true;
scene.add(rightWall);

// Pared frontal (cierra el aula por delante)
const frontWall = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 6),
  new THREE.MeshStandardMaterial({ color: 0xf2f5f9, roughness: 1.0 })
);
frontWall.rotation.y = Math.PI;       // mira hacia atrás
frontWall.position.set(0, 3, 0.2);    // un poco delante del 0
frontWall.receiveShadow = true;
scene.add(frontWall);

// Techo
const ceiling = new THREE.Mesh(
  new THREE.PlaneGeometry(20, 14),
  new THREE.MeshStandardMaterial({ color: 0xf8fbff, roughness: 1.0 })
);
ceiling.rotation.x = Math.PI / 2;
ceiling.position.set(0, 6, -1);
scene.add(ceiling);

// Zócalos
function addBaseboard(x, y, z, w, h, rotY=0) {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, 0.05),
    new THREE.MeshStandardMaterial({ color: 0xdadfe7, roughness: 0.9 })
  );
  m.position.set(x, y, z);
  m.rotation.y = rotY;
  scene.add(m);
}
const baseY = 0.12;
addBaseboard(0, baseY, -7.98, 20, 0.24, 0);            // fondo
addBaseboard(-9.98, baseY, -1, 14, 0.24, Math.PI/2);   // izquierda
addBaseboard(9.98, baseY, -1, 14, 0.24, Math.PI/2);    // derecha

/** ============================
 *  PIZARRONES DE VIDRIO + FONDO
 * ============================ */
function addGlassBoard({ position, size=[6,2.6], tint=0x99c4ff }) {
  const [w,h] = size;
  // fondo blanco (ligeramente detrás)
  const back = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshStandardMaterial({ color: 0xffffff })
  );
  back.position.set(position.x, position.y, position.z - 0.05);
  scene.add(back);

  // vidrio
  const glass = new THREE.Mesh(
    new THREE.PlaneGeometry(w, h),
    new THREE.MeshPhysicalMaterial({
      transmission: 0.95,
      transparent: true,
      roughness: 0.15,
      thickness: 0.02,
      clearcoat: 0.5,
      metalness: 0.0,
      color: tint
    })
  );
  glass.position.copy(position);
  scene.add(glass);

  // marco simple
  const frameMat = new THREE.MeshStandardMaterial({ color: 0x222a35, metalness: 0.2, roughness: 0.6 });
  const frame = new THREE.Group();
  const t = 0.05;
  const z = position.z + 0.01;
  const up = new THREE.Mesh(new THREE.BoxGeometry(w, t, t), frameMat); up.position.set(position.x, position.y + h/2 + t/2, z); frame.add(up);
  const dn = new THREE.Mesh(new THREE.BoxGeometry(w, t, t), frameMat); dn.position.set(position.x, position.y - h/2 - t/2, z); frame.add(dn);
  const lf = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), frameMat); lf.position.set(position.x - w/2 - t/2, position.y, z); frame.add(lf);
  const rg = new THREE.Mesh(new THREE.BoxGeometry(t, h, t), frameMat); rg.position.set(position.x + w/2 + t/2, position.y, z); frame.add(rg);
  scene.add(frame);
}
// Principal, centrado en pared del fondo
addGlassBoard({ position: new THREE.Vector3(0, 1.5, -7.9), size: [6, 2.6] });
// Secundario, más chico, a la izquierda
addGlassBoard({ position: new THREE.Vector3(-6.5, 1.4, -7.9), size: [3.2, 1.8], tint: 0xa7d2ff });

/** =================
 *  PUPITRES + SILLAS
 * ================= */
const obstacles = []; // para colisiones (pupitres/sillas)

function addDesk(x, z) {
  const desk = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(1.2, 0.06, 0.6),
    new THREE.MeshStandardMaterial({ color: 0xcaa472, roughness: 0.6 })
  );
  top.position.y = 0.75; desk.add(top);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.5, roughness: 0.4 });
  const legGeom = new THREE.CylinderGeometry(0.03, 0.03, 0.72, 12);
  [[ 0.5,0.36, 0.25],[-0.5,0.36, 0.25],[0.5,0.36,-0.25],[-0.5,0.36,-0.25]]
    .forEach(p => { const m = new THREE.Mesh(legGeom, legMat); m.position.set(...p); desk.add(m); });

  desk.position.set(x, 0, z);
  desk.castShadow = true;
  scene.add(desk);

  // obstáculo circular del pupitre (más delgado)
  obstacles.push({ x, z, r: 0.6 });
}

function addChair(x, z) {
  const chair = new THREE.Group();
  // asiento
  const seat = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.05, 0.5),
    new THREE.MeshStandardMaterial({ color: 0x9a7b58, roughness: 0.7 })
  );
  seat.position.y = 0.44; chair.add(seat);

  // Respaldo hacia atrás (positivo z)
  const back = new THREE.Mesh(
    new THREE.BoxGeometry(0.5, 0.45, 0.05),
    new THREE.MeshStandardMaterial({ color: 0x9a7b58, roughness: 0.7 })
  );
  back.position.set(0, 0.66, +0.22);
  chair.add(back);

  // patas
  const legMat = new THREE.MeshStandardMaterial({ color: 0x4a5568, metalness: 0.4, roughness: 0.5 });
  const legGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.44, 10);
  [[ 0.22,0.22, 0.22],[-0.22,0.22, 0.22],[0.22,0.22,-0.22],[-0.22,0.22,-0.22]]
    .forEach(p => { const m = new THREE.Mesh(legGeom, legMat); m.position.set(...p); chair.add(m); });

  // La silla queda entre el alumno y el pupitre (ligeramente detrás del pupitre)
  chair.position.set(x, 0, z + 0.55);
  chair.castShadow = true;
  scene.add(chair);

  // obstáculo circular de la silla (más delgado)
  obstacles.push({ x: x, z: z + 0.55, r: 0.4 });
}

// ==== Layout con PASILLOS (central y laterales) ====
// columnas (x) dejando pasillo central (~2 m) y laterales
const COLS_X = [-6, -2, 2, 6];   // 4 columnas
// filas (z) más separadas del frente al fondo
const ROWS_Z = [-2.2, -4.4, -6.2]; // 3 filas

for (const z of ROWS_Z) {
  for (const x of COLS_X) {
    addDesk(x, z);
    addChair(x, z);
  }
}

// Escritorio del docente
(function addTeacherDesk(){
  const desk = new THREE.Group();
  const top = new THREE.Mesh(
    new THREE.BoxGeometry(2.2, 0.08, 0.9),
    new THREE.MeshStandardMaterial({ color: 0xb18a63, roughness: 0.6 })
  );
  top.position.y = 0.85; desk.add(top);

  const legMat = new THREE.MeshStandardMaterial({ color: 0x414b5a, metalness: 0.4, roughness: 0.4 });
  const legGeom = new THREE.CylinderGeometry(0.04, 0.04, 0.82, 12);
  [[ 1,0.41, 0.38],[-1,0.41, 0.38],[1,0.41,-0.38],[-1,0.41,-0.38]]
    .forEach(p => { const m = new THREE.Mesh(legGeom, legMat); m.position.set(...p); desk.add(m); });

  desk.position.set(0, 0, -6.2);
  desk.castShadow = true;
  scene.add(desk);

  obstacles.push({ x:0, z:-6.2, r:1.2 });
})();

/** =======================
 *  BRUMA SUAVE (profundidad)
 * ======================= */
scene.fog = new THREE.Fog(0x0b0f14, 18, 36);

/** =====================================
 *  CONTROLES: ORBIT vs PRIMERA PERSONA
 * ===================================== */
const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.target.set(0, 1.2, -3);
orbit.minDistance = 2.2;
orbit.maxDistance = 18;
orbit.maxPolarAngle = Math.PI * 0.49;

// FPS (pointer lock)
const fps = new PointerLockControls(camera, document.body);

// UI para activar FPS con click
const hud = document.getElementById('hud');
function setHUD(msg){ if (hud) hud.innerHTML = `<span class="pill">${msg}</span>`; }
setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir');

document.body.addEventListener('click', () => {
  if (!isFPS) return;
  fps.lock();
});
fps.addEventListener('lock', () => setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir'));
fps.addEventListener('unlock', () => setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir'));

let isFPS = true;           // ← activar/desactivar modo primera persona
orbit.enabled = !isFPS;     // si FPS, apagamos Orbit

/** ==========================
 *  MOVIMIENTO EN PRIMERA PERSONA
 * ========================== */
const keys = { w:false, a:false, s:false, d:false, shift:false, space:false };
addEventListener('keydown', e => {
  if (e.code === 'KeyW') keys.w = true;
  if (e.code === 'KeyA') keys.a = true;
  if (e.code === 'KeyS') keys.s = true;
  if (e.code === 'KeyD') keys.d = true;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true;
  if (e.code === 'Space') keys.space = true;
});
addEventListener('keyup', e => {
  if (e.code === 'KeyW') keys.w = false;
  if (e.code === 'KeyA') keys.a = false;
  if (e.code === 'KeyS') keys.s = false;
  if (e.code === 'KeyD') keys.d = false;
  if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false;
  if (e.code === 'Space') keys.space = false;
});

// Parámetros
const speed = 2.2;             // m/s
const runMult = 1.8;           // correr con Shift
const jumpVel = 3.2;
const gravity = 9.8;
let velY = 0;
let onFloor = true;

// límites del aula (x,z) — caja utilizable (ajustado a frontWall)
const bounds = { minX: -8.8, maxX: 8.8, minZ: -7.0, maxZ: -0.6 };

// utilidad: clamp
const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

// colisión circular contra obstáculos + paredes
function collideCircle(nx, nz, r=0.30) {
  for (const o of obstacles) {
    const dx = nx - o.x, dz = nz - o.z;
    const dist = Math.hypot(dx, dz);
    if (dist < (r + o.r)) {
      const ang = Math.atan2(dz, dx);
      const push = (r + o.r) - dist + 0.02;
      nx += Math.cos(ang) * push;
      nz += Math.sin(ang) * push;
    }
  }
  nx = clamp(nx, bounds.minX, bounds.maxX);
  nz = clamp(nz, bounds.minZ, bounds.maxZ);
  return { nx, nz };
}

/** =========
 *  LOOP
 * ========= */
let prev = performance.now();
function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.033, (now - prev) / 1000); // cap 30ms
  prev = now;

  if (isFPS) {
    orbit.enabled = false;

    if (fps.isLocked) {
      // dirección plano XZ
      const forward = new THREE.Vector3();
      camera.getWorldDirection(forward);
      forward.y = 0; 
      forward.normalize();

      // ✅ derecha correcta = forward × up  (NO up × forward)
      const up = new THREE.Vector3(0, 1, 0);
      const right = new THREE.Vector3().crossVectors(forward, up).normalize();

      const move = new THREE.Vector3();
      let v = speed * (keys.shift ? runMult : 1);
      if (keys.w) move.add(forward);
      if (keys.s) move.sub(forward);
      if (keys.d) move.add(right);   // D → derecha
      if (keys.a) move.sub(right);   // A → izquierda
      if (move.lengthSq() > 0) move.setLength(v * dt);

      // salto / gravedad
      if (onFloor && keys.space) { velY = jumpVel; onFloor = false; }
      velY -= gravity * dt;
      let ny = camera.position.y + velY * dt;
      if (ny < 1.65) { ny = 1.65; velY = 0; onFloor = true; }

      // aplicar movimiento + colisiones SOLO si te movés
      let nx = camera.position.x;
      let nz = camera.position.z;
      if (move.lengthSq() > 0) {
        nx += move.x;
        nz += move.z;
        const c = collideCircle(nx, nz, 0.30);
        nx = c.nx; nz = c.nz;
      }

      camera.position.set(nx, ny, nz);
    }
  } else {
    orbit.enabled = true;
    orbit.update();
  }

  renderer.render(scene, camera);
}
animate();

/** =========
 *  RESIZE
 * ========= */
addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
});

// Activá pointer lock con click (FPS)
document.body.addEventListener('click', () => {
  if (isFPS) fps.lock();
});
fps.addEventListener('lock', () => {
  const hud = document.getElementById('hud');
  if (hud) hud.innerHTML = '<span class="pill">W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir</span>';
});
fps.addEventListener('unlock', () => {
  const hud = document.getElementById('hud');
  if (hud) hud.innerHTML = '<span class="pill">Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir</span>';
});
