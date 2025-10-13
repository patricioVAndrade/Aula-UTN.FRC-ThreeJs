import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

// ===================================
// SETUP BÁSICO
// ===================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB); // Cielo azul claro

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);

// CORREGIDO: Ajustamos la posición para no estar dentro de la puerta
camera.position.set(-10, 1.7, -7.5); 

// CORREGIDO: Hacemos que la cámara mire hacia el centro del aula al iniciar
camera.lookAt(0, 1.5, 0); 

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(innerWidth, innerHeight);
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;
document.body.appendChild(renderer.domElement);

const gltfLoader = new GLTFLoader();
const draco = new DRACOLoader();
draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
gltfLoader.setDRACOLoader(draco);
const texLoader = new THREE.TextureLoader();

// ===================================
// VARIABLES DE ESTADO E INTERACCIÓN
// ===================================
const obstacles = [];
const interactiveObjects = [];
let isSitting = false;
let isReadingPDF = false;
let potentialInteraction = null;
const interactionDist = 2;

const pdfViewer = document.getElementById('pdf-viewer');
const pdfFrame = document.getElementById('pdf-frame');
const closePdfBtn = document.getElementById('close-pdf');

// ===================================
// ILUMINACIÓN (CORREGIDA)
// ===================================
// CORREGIDO: Intensidades reducidas para una iluminación natural
scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));
const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(15, 25, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.camera.near = 0.5;
sun.shadow.camera.far = 60;
sun.shadow.camera.left = -25;
sun.shadow.camera.right = 25;
sun.shadow.camera.top = 25;
sun.shadow.camera.bottom = -25;
scene.add(sun);

// ===================================
// ESTRUCTURA DEL AULA CON TUS TEXTURAS
// ===================================
const AULA_ANCHO = 22;
const AULA_LARGO = 30; // Un poco más larga
const AULA_ALTO = 8;

const floorTexture = texLoader.load('./assets/pisomadera.jpg');
floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
floorTexture.repeat.set(AULA_ANCHO / 4, AULA_LARGO / 4);
const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
const floor = new THREE.Mesh(new THREE.PlaneGeometry(AULA_ANCHO, AULA_LARGO), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

const wallTexture = texLoader.load('./assets/Bricks078_1K-JPG_Color.jpg');
wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
wallTexture.repeat.set(AULA_ANCHO / 5, AULA_ALTO / 5);
const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.9 });
const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(AULA_ANCHO, AULA_ALTO), wallMat);
wallBack.position.set(0, AULA_ALTO / 2, -AULA_LARGO / 2);
wallBack.receiveShadow = true;
scene.add(wallBack);

const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(AULA_LARGO, AULA_ALTO), wallMat);
wallLeft.position.set(-AULA_ANCHO / 2, AULA_ALTO / 2, 0);
wallLeft.rotation.y = Math.PI / 2;
wallLeft.receiveShadow = true;
scene.add(wallLeft);

const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(AULA_LARGO, AULA_ALTO), wallMat);
wallRight.position.set(AULA_ANCHO / 2, AULA_ALTO / 2, 0);
wallRight.rotation.y = -Math.PI / 2;
wallRight.receiveShadow = true;
scene.add(wallRight);

// ===================================
// CARGA Y DISPOSICIÓN DE TUS ASSETS (CORREGIDO)
// ===================================
async function setupScene() {
  // --- Pizarra ---
  const whiteboardGltf = await gltfLoader.loadAsync('./assets/whiteboard.glb');
  const whiteboard = whiteboardGltf.scene;
  whiteboard.scale.setScalar(4.5); // CORREGIDO: Escala funcional
  whiteboard.position.set(0, 1.2, -AULA_LARGO / 2 + 0.1); // Ligero ajuste en Z para evitar z-fighting
  whiteboard.traverse(n => { if (n.isMesh) { n.castShadow = true; }});
  scene.add(whiteboard);
  

 // --- Escritorio del Profesor (CORREGIDO) ---
  const teacherDeskGltf = await gltfLoader.loadAsync('./assets/teacher_desk.glb');
  const teacherDesk = teacherDeskGltf.scene;
  teacherDesk.scale.setScalar(8.0); // CORREGIDO: Se restauró la escala grande que preferías
  
  // Se define la posición una sola vez para usarla en el modelo, la colisión y el PDF
  const deskX = 5;
  const deskZ = -10;
  
  teacherDesk.position.set(deskX, -0.2, deskZ); // Se ajusta la altura Y para que no flote
  teacherDesk.rotation.y = Math.PI;
  teacherDesk.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
  scene.add(teacherDesk);
  
  // CORREGIDO: La colisión ahora usa las coordenadas correctas y un radio positivo
  obstacles.push({ x: deskX, z: deskZ, r: 2.0 }); // Radio ajustado
  
 
  // --- Tablón de Anuncios (NUEVO) ---
  const noticeBoardGltf = await gltfLoader.loadAsync('./assets/notice_board.glb');
  const noticeBoard = noticeBoardGltf.scene;
  noticeBoard.scale.setScalar(1.5); // Escala inicial para el tablón
  
  // Posición en la pared izquierda
  const boardX = -AULA_ANCHO / 2;
  const boardZ = 1;
  
  noticeBoard.position.set(boardX, 1.2, boardZ);
  noticeBoard.rotation.y = Math.PI / 2; // Rotado para que quede plano en la pared
  noticeBoard.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
  scene.add(noticeBoard);
  
  // Se agrega una colisión para el tablón
  obstacles.push({ x: boardX, z: boardZ, r: 0.5 });
  
  // El punto de interacción del PDF se mueve aquí, sobre una de las hojas amarillas
  // (Las coordenadas están ajustadas relativas a la posición del tablón)
  interactiveObjects.push({ 
    type: 'pdf', 
    position: new THREE.Vector3(boardX + 0.2, 1.8, boardZ + 0.5), 
    path: './assets/plan.pdf' 
  });
 

  // --- Pupitres dobles (CORREGIDO - Usando Clones y nueva disposición) ---
  const deskGltf = await gltfLoader.loadAsync('./assets/school_desk.glb');
  const deskModel = deskGltf.scene;
  
  // Disposición 3x3 para los escritorios dobles
  const COLS_X = [-7, 0, 7];
  const ROWS_Z = [8, 2, -4];

  for (const z of ROWS_Z) {
    for (const x of COLS_X) {
      const newDesk = deskModel.clone();
      newDesk.scale.setScalar(0.4);
      newDesk.position.set(x, 1, z);
      newDesk.rotation.y = Math.PI / 2;
      newDesk.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
      scene.add(newDesk);
      
      obstacles.push({ x, z, r: 1.5 }); // Obstáculo más grande para el escritorio doble

      // AÑADIDO: Puntos de interacción para las DOS sillas
      const chairOffset = 0.7; // Distancia del centro a cada silla
      
      // Silla Izquierda
      interactiveObjects.push({ 
          type: 'chair', 
          position: new THREE.Vector3(x - chairOffset, 0, z + 0.8), 
          sitPosition: new THREE.Vector3(x - chairOffset, 1.1, z + 0.8) 
      });
      // Silla Derecha
      interactiveObjects.push({ 
          type: 'chair', 
          position: new THREE.Vector3(x + chairOffset, 0, z + 0.8), 
          sitPosition: new THREE.Vector3(x + chairOffset, 1.1, z + 0.8) 
      });
    }
  }

  // --- Assets Adicionales ---
  const relojGltf = await gltfLoader.loadAsync('./assets/reloj.glb');
  relojGltf.scene.scale.setScalar(0.2);
  relojGltf.scene.position.set(AULA_ANCHO / 2 - 0.2, AULA_ALTO - 2.5, 0);
  relojGltf.scene.rotation.y = -Math.PI / 2;
  scene.add(relojGltf.scene);

  // --- Puerta (CORREGIDO) ---
  const puertaGltf = await gltfLoader.loadAsync('./assets/puertadoble.glb');
  puertaGltf.scene.scale.setScalar(0.011);
  // CORREGIDO: Posición a la izquierda
  puertaGltf.scene.position.set(-AULA_ANCHO / 2 + 0.1, 0, -9);
  // CORREGIDO: Rotación para la pared izquierda
  puertaGltf.scene.rotation.y = Math.PI ;
  scene.add(puertaGltf.scene);
  // CORREGIDO: Obstáculo movido a la nueva posición
  obstacles.push({ x: -AULA_ANCHO / 2, z: -8, r: 1.5 });

  const mochilaGltf = await gltfLoader.loadAsync('./assets/mochila.glb');
  mochilaGltf.scene.scale.setScalar(0.8);
  mochilaGltf.scene.position.set(-8.5, 0, 12);
  mochilaGltf.scene.rotation.y = 0.5;
  scene.add(mochilaGltf.scene);
  obstacles.push({ x: -8.5, z: 12, r: 0.5 });
}
setupScene();

// ===================================
// CONTROLES, FÍSICA Y LOOP (SIN CAMBIOS)
// ===================================
const fps = new PointerLockControls(camera, document.body);
const hud = document.getElementById('hud');
function setHUD(msg){ if (hud) hud.innerHTML = `<span class="pill">${msg}</span>`; }
document.body.addEventListener('click', () => { if (!isSitting && !isReadingPDF) fps.lock(); });
fps.addEventListener('lock', () => { if(!isSitting) setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir'); });
fps.addEventListener('unlock', () => setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir'));

const keys = { w:false, a:false, s:false, d:false, shift:false, space:false };
addEventListener('keydown', e => { if (e.code === 'KeyW') keys.w = true; if (e.code === 'KeyA') keys.a = true; if (e.code === 'KeyS') keys.s = true; if (e.code === 'KeyD') keys.d = true; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = true; if (e.code === 'Space') keys.space = true; });
addEventListener('keyup', e => { if (e.code === 'KeyW') keys.w = false; if (e.code === 'KeyA') keys.a = false; if (e.code === 'KeyS') keys.s = false; if (e.code === 'KeyD') keys.d = false; if (e.code === 'ShiftLeft' || e.code === 'ShiftRight') keys.shift = false; if (e.code === 'Space') keys.space = false; });

function handleInteraction() {
  if (!potentialInteraction) return;

  if (potentialInteraction.type === 'chair') {
    isSitting = true;

    // Copiamos la posición base de la silla
    camera.position.copy(potentialInteraction.sitPosition);

    // Ajustamos la altura y la posición hacia atrás
    camera.position.y = 1.25; // Altura más realista al estar sentado
    camera.position.z -= 0.25; // Retrocede un poco para quedar detrás de la mesa

    fps.lock(); // Permite seguir mirando con el mouse
  }

  if (potentialInteraction.type === 'pdf') {
    isReadingPDF = true;
    pdfFrame.src = potentialInteraction.path;
    pdfViewer.classList.remove('hidden');
    fps.unlock();
  }
}

function stopInteraction() {
  if (isSitting) {
  isSitting = false;
  const dir = new THREE.Vector3();
  camera.getWorldDirection(dir);
  dir.y = 0;
  dir.normalize();
  // retrocede medio metro y vuelve a altura de pie
  camera.position.addScaledVector(dir, -0.5);
  camera.position.y = 1.7;
}

  if (isReadingPDF) { isReadingPDF = false; pdfFrame.src = ""; pdfViewer.classList.add('hidden'); fps.lock(); }
}
closePdfBtn.addEventListener('click', stopInteraction);
addEventListener('keydown', e => { if (e.code === 'KeyE') { if (isSitting || isReadingPDF) stopInteraction(); else handleInteraction(); }});

const speed = 4, runMult = 2, jumpVel = 5, gravity = 15; let velY = 0, onFloor = true;
const bounds = { minX: -AULA_ANCHO/2 + 1, maxX: AULA_ANCHO/2 - 1, minZ: -AULA_LARGO/2 + 1, maxZ: AULA_LARGO/2 - 1 };
function resolveCollisions(qx, qz, r = 0.4) { qx = Math.max(bounds.minX, Math.min(bounds.maxX, qx)); qz = Math.max(bounds.minZ, Math.min(bounds.maxZ, qz)); for (let i = 0; i < 3; i++) { let pushed = false; for (const o of obstacles) { const dx = qx - o.x, dz = qz - o.z, dist = Math.hypot(dx, dz), minDist = r + o.r; if (dist < minDist) { const overlap = minDist - dist; qx += (dx/dist) * overlap; qz += (dz/dist) * overlap; pushed = true; } } if (!pushed) break; } return { nx: qx, nz: qz }; }

let prev = performance.now();
const forward = new THREE.Vector3(), up = new THREE.Vector3(0, 1, 0), right = new THREE.Vector3(), intent = new THREE.Vector3();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  potentialInteraction = null;
  if (!isSitting && !isReadingPDF) {
    for (const obj of interactiveObjects) { if (camera.position.distanceTo(obj.position) < interactionDist) { potentialInteraction = obj; break; } }
  }
  
  if (isSitting) setHUD('Mouse: Mirar alrededor • Presiona [E] para levantarte');
  else if (isReadingPDF) {}
  else if (potentialInteraction) {
    if (potentialInteraction.type === 'chair') setHUD('Presiona [E] para sentarte');
    if (potentialInteraction.type === 'pdf') setHUD('Presiona [E] para leer el documento');
  } else if (fps.isLocked) setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir');
  else setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir');

  if (fps.isLocked && !isSitting) {
    camera.getWorldDirection(forward); forward.y = 0; forward.normalize();
    right.crossVectors(forward, up).normalize();
    intent.set(0,0,0);
    let v = speed * (keys.shift ? runMult : 1);
    if (keys.w) intent.add(forward); if (keys.s) intent.sub(forward); if (keys.d) intent.add(right); if (keys.a) intent.sub(right);
    if (intent.lengthSq() > 0) intent.setLength(v * dt);

    if (onFloor && keys.space) { velY = jumpVel; onFloor = false; }
    velY -= gravity * dt;
    let ny = camera.position.y + velY * dt;
    if (ny < 1.7) { ny = 1.7; velY = 0; onFloor = true; }

    let qx = camera.position.x + intent.x, qz = camera.position.z + intent.z;
    const solved = resolveCollisions(qx, qz);
    camera.position.set(solved.nx, ny, solved.nz);
  }
  renderer.render(scene, camera);
}
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });