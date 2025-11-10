import * as THREE from 'three';
import { SceneManager } from './src/sceneManager.js';
import { AssetsManager } from './src/assetsManager.js';
import { PlayerController } from './src/playerController.js';
import { InteractionManager } from './src/interactionManager.js';
import { addWhiteboard } from './src/objects/whiteboard.js';
import { addTeacherDesk } from './src/objects/teacherDesk.js';
import { addNoticeBoard, addNoticeBoardNextToWhiteboard } from './src/objects/noticeBoard.js';
import { addSchoolDesks } from './src/objects/schoolDesks.js';
import { addClock } from './src/objects/clock.js';
import { addDoor } from './src/objects/door.js';
import { addBackpack } from './src/objects/backpack.js';
import { addVideoScreen } from './src/objects/videoScreen.js';
import { addOpenOldBook } from './src/objects/openOldBook.js';
import { addWallFrames } from './src/objects/wallFrames.js';
import { addCeiling } from './src/objects/ceiling.js';
import { addCeilingLights } from './src/objects/ceilingLight.js';
import { addStudyTipsPaper } from './src/objects/studyTipsPaper.js';

// ===================================
// SETUP BÁSICO (modularizado)
// ===================================
const sceneMgr = new SceneManager();
const scene = sceneMgr.scene;
const assets = new AssetsManager();
const texLoader = assets.texLoader;
const renderer = sceneMgr.createRenderer(document.body);
const cssRenderer = sceneMgr.createCSSRenderer(document.body);
sceneMgr.setupLights();

const camera = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.1, 200);
camera.position.set(-10, 1.7, -7.5);
camera.lookAt(0, 1.5, 0);
const listener = new THREE.AudioListener();
camera.add(listener);

// ===================================
// VARIABLES DE ESTADO E INTERACCIÓN
// ===================================
const obstacles = [];
const interactiveObjects = [];

const pdfViewer = document.getElementById('pdf-viewer');
const pdfFrame = document.getElementById('pdf-frame');
const closePdfBtn = document.getElementById('close-pdf');
const audioLoader = new THREE.AudioLoader();
const ambientSound = new THREE.Audio(listener);

audioLoader.load(
  // Ruta a tu archivo de sonido
  './assets/ambiente_colegio.mp3',
  
  // Callback cuando se carga
  function(buffer) {
    ambientSound.setBuffer(buffer); // Asigna el audio cargado
    ambientSound.setLoop(true);       // Queremos que se repita
    ambientSound.setVolume(0.3);      // Volumen bajo, es de fondo
    // No lo reproducimos aquí, esperamos al primer clic del usuario
  },
  
  // Opcional: Callback de progreso
  function (xhr) {
    console.log( 'Audio ' + (xhr.loaded / xhr.total * 100) + '% loaded' );
  },
  
  // Opcional: Callback de error
  function (err) {
    console.log( 'Error al cargar el audio ambiental' );
  }
);

// 4. Variable de control para iniciar el audio una sola vez
let audioStarted = false;
// ---------------------
// Referencia global al API de la pantalla para usar en el loop
let videoScreen = null;

// crear habitación (floor y paredes)
sceneMgr.createRoom(texLoader);

// ===================================
// CARGA Y DISPOSICIÓN DE TUS ASSETS (CORREGIDO)
// ===================================
async function setupScene() {
  // Whiteboard ahora requiere cámara y renderer para paginación y navegación con teclas
  const paper = await addStudyTipsPaper(scene, assets);
  const whiteboardApi = await addWhiteboard(scene, assets, sceneMgr, camera, renderer);
  // Registrar como objeto interactivo para mostrar cartel HUD con radio ampliado
  interactiveObjects.push({ type: 'whiteboard', position: whiteboardApi.position, interactionRadius: 4.0 });
  const teacherDesk = await addTeacherDesk(scene, assets, obstacles);
  addCeiling(scene, assets, sceneMgr);
  await addCeilingLights(scene, assets, sceneMgr);
  await addNoticeBoard(scene, assets, sceneMgr, obstacles, interactiveObjects);
  await addNoticeBoardNextToWhiteboard(scene, assets, sceneMgr, interactiveObjects);
  await addSchoolDesks(scene, assets, obstacles, interactiveObjects);
  await addClock(scene, assets, sceneMgr);
  await addDoor(scene, assets, sceneMgr, obstacles);
  await addBackpack(scene, assets, obstacles, interactiveObjects);
    // Cuadros en las paredes (requiere colocar las imágenes en assets o se usan placeholders)
    await addWallFrames(scene, assets, sceneMgr, {
      utnPhotoPath: './assets/utn_frc_portico.jpg',
      sistemasLogoPath: './assets/logo_sistemas.png'
    });
  videoScreen = addVideoScreen(scene, sceneMgr.cssScene, 'https://www.youtube.com/watch?v=cenYWW8zJUE', sceneMgr, { width: 8, height: 4.5, position: new THREE.Vector3(0, 3, sceneMgr.AULA_LARGO/2 - 0.02), rotationY: Math.PI });
  interactiveObjects.push({ type: 'video', position: videoScreen.position.clone(), iframe: videoScreen.element });
  

  // 2. Si se cargó correctamente, lo hacemos interactivo
  if (paper) {
      const paperPosVec = new THREE.Vector3();
      paper.getWorldPosition(paperPosVec);

      // Lo añadimos al array de interacciones
      interactiveObjects.push({ 
          type: 'tips',
          position: paperPosVec.clone(),
          interactionRadius: 3 // Un radio pequeño
      });
  }
    
  // Pantalla de video en pared frontal: CSS3D + marco WebGL pegado a la pared
  
  
  // Panel de carga con orientación hacia los bancos
  const chairs = interactiveObjects.filter(o => o.type === 'chair');
  let desksCenter = new THREE.Vector3(0, 1.2, 2);
  if (chairs.length > 0) {
    const sum = new THREE.Vector3();
    chairs.forEach(c => sum.add(c.position));
    desksCenter = sum.multiplyScalar(1 / chairs.length);
    desksCenter.y = 1.2;
  }
  
  

  // Libro antiguo abierto en el banco del medio del curso (x=0, z=2), mirando al pizarrón (hacia -Z)
  const book = await addOpenOldBook(scene, assets, { x: 0, y: 1, z: -4, rotationY: Math.PI, scale: 2 });
  // Hacerlo interactivo: al presionar E cerca, abrir assets/plan.pdf
  const bookPos = new THREE.Vector3();
  book.getWorldPosition(bookPos);
  interactiveObjects.unshift({ type: 'pdf', position: bookPos.clone(), path: './assets/plan.pdf', interactionRadius: 2.2 });
}
setupScene();

// ===================================
// CONTROLES, FÍSICA E INTERACCIONES (modularizado)
// ===================================
const hud = document.getElementById('hud');
const player = new PlayerController(camera, renderer.domElement, scene, obstacles, hud);
const interaction = new InteractionManager(camera, player, interactiveObjects, { viewer: pdfViewer, frame: pdfFrame, closeBtn: closePdfBtn });
const visRaycaster = new THREE.Raycaster();

// UI Banner para la mochila
const backpackBanner = document.getElementById('backpack-banner');
const closeBackpackBannerBtn = document.getElementById('close-backpack-banner');
let backpackBannerVisible = false;

function showBackpackBanner() {
  if (!backpackBannerVisible) {
    backpackBanner.classList.remove('hidden');
    // Ocultar HUD pequeño mientras el banner grande está visible
    if (hud) hud.style.display = 'none';
    backpackBannerVisible = true;
  }
}

function hideBackpackBanner() {
  if (backpackBannerVisible) {
    backpackBanner.classList.add('hidden');
    if (hud) hud.style.display = '';
    backpackBannerVisible = false;
  }
}

if (closeBackpackBannerBtn) {
  closeBackpackBannerBtn.addEventListener('click', () => hideBackpackBanner());
}

document.body.addEventListener('click', () => {
  player.lock();
  
  // --- AÑADIR ESTO ---
  // Inicia el audio en el primer click y solo una vez
  if (!audioStarted && ambientSound.buffer) {
    ambientSound.play();
    audioStarted = true;
  }
  // ---------------------
});

renderer.domElement.addEventListener('click', () => {
  player.lock();

  // --- AÑADIR ESTO TAMBIÉN AQUÍ ---
  if (!audioStarted && ambientSound.buffer) {
    ambientSound.play();
    audioStarted = true;
  }
  // ---------------------
});

let prev = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  interaction.scanPotential();
  const potentialInteraction = interaction.potential;

  updateHUD(potentialInteraction);
  // Mostrar/ocultar banner grande de la mochila según proximidad
  if (player.isReadingPDF || player.isReadingTips) {
    hideBackpackBanner();
  } else if (potentialInteraction && potentialInteraction.type === 'link' && potentialInteraction.bannerId === 'backpack') {
    showBackpackBanner();
  } else {
    hideBackpackBanner();
  }
  player.update(dt);
  
  renderer.render(scene, camera);
  if (sceneMgr.cssRenderer && sceneMgr.cssScene) {
    sceneMgr.cssRenderer.render(sceneMgr.cssScene, camera);
  }

  handleVideoOcclusion();
}

function updateHUD(potentialInteraction) {
  if (player.isReadingPDF) {
    // No mostrar HUD
  } else if (player.isReadingTips) {
    player.setHUD('Presiona [E] o [Esc] para cerrar');
  
  }
    else if (potentialInteraction) {
    
    if (potentialInteraction.type === 'pdf') player.setHUD('Presiona [E] para leer el documento');
  else if (potentialInteraction.type === 'tips') player.setHUD('Presiona [E] para leer los tips');
  else if (potentialInteraction.type === 'video') player.setHUD('Presiona [E] play/pausa video • [R] sonido on/off');
  else if (potentialInteraction.type === 'whiteboard') player.setHUD('Usa ← → para cambiar página');
  else if (potentialInteraction.type === 'link') {
    if (potentialInteraction.hud) player.setHUD(potentialInteraction.hud);
    else player.setHUD('Presiona [E] abrir enlace • [R] acción secundaria');
  }
  } else if (player.controls.isLocked) {
    player.setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir');
  } else {
    player.setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir');
  }
}

function handleVideoOcclusion() {
  if (!videoScreen || !videoScreen.cssObject) return;

  const camPos = camera.position;
  const screenPos = new THREE.Vector3();
  videoScreen.webGroup.getWorldPosition(screenPos);
  
  const screenForward = new THREE.Vector3(0, 0, -1);
  screenForward.applyQuaternion(videoScreen.webGroup.quaternion);
  const toCam = camPos.clone().sub(screenPos).normalize();
  const facing = screenForward.dot(toCam) < 0;
  
  const w = videoScreen.size.width;
  const h = videoScreen.size.height;
  const cols = 5, rows = 3;
  const samples = [];
  
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const ox = (i / (cols - 1) - 0.5) * w * 0.9;
      const oy = (j / (rows - 1) - 0.5) * h * 0.9;
      const wp = new THREE.Vector3(ox, oy, 0);
      videoScreen.webGroup.localToWorld(wp);
      samples.push(wp);
    }
  }
  
  let visibleSamples = 0;
  for (const sp of samples) {
    const dir = sp.clone().sub(camPos).normalize();
    const distToScreen = sp.distanceTo(camPos);
    visRaycaster.set(camPos, dir);
    visRaycaster.far = distToScreen + 0.5;
    const hits = visRaycaster.intersectObjects(scene.children, true);
    
    let hitScreen = false;
    for (const hit of hits) {
      if (hit.distance > distToScreen - 0.3) {
        let p = hit.object;
        while (p) {
          if (p === videoScreen.webGroup) {
            hitScreen = true;
            break;
          }
          p = p.parent;
        }
        if (hitScreen) break;
      } else {
        break;
      }
    }
    if (hitScreen) visibleSamples++;
  }
  
  const visibilityRatio = visibleSamples / samples.length;
  const el = videoScreen.cssObject.element;
  const shouldHide = !facing || visibilityRatio < 0.5;
  
  el.style.visibility = shouldHide ? 'hidden' : 'visible';
  el.style.opacity = shouldHide ? '0' : '1';
  
  visRaycaster.far = Infinity;
}

animate();

addEventListener('resize', () => {
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(innerWidth, innerHeight);
  if (sceneMgr.cssRenderer) sceneMgr.cssRenderer.setSize(innerWidth, innerHeight);
});

