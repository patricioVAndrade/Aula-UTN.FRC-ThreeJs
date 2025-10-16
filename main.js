import * as THREE from 'three';
import { SceneManager } from './src/sceneManager.js';
import { AssetsManager } from './src/assetsManager.js';
import { PlayerController } from './src/playerController.js';
import { InteractionManager } from './src/interactionManager.js';
import { addWhiteboard } from './src/objects/whiteboard.js';
import { addTeacherDesk } from './src/objects/teacherDesk.js';
import { addNoticeBoard } from './src/objects/noticeBoard.js';
import { addSchoolDesks } from './src/objects/schoolDesks.js';
import { addClock } from './src/objects/clock.js';
import { addDoor } from './src/objects/door.js';
import { addBackpack } from './src/objects/backpack.js';
import { addVideoScreen } from './src/objects/videoScreen.js';
import { addChargePanel, addChargePanelLazy } from './src/objects/chargePanel.js';

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

// ===================================
// VARIABLES DE ESTADO E INTERACCIÓN
// ===================================
const obstacles = [];
const interactiveObjects = [];

const pdfViewer = document.getElementById('pdf-viewer');
const pdfFrame = document.getElementById('pdf-frame');
const closePdfBtn = document.getElementById('close-pdf');

// crear habitación (floor y paredes)
sceneMgr.createRoom(texLoader);

// ===================================
// CARGA Y DISPOSICIÓN DE TUS ASSETS (CORREGIDO)
// ===================================
async function setupScene() {
  await addWhiteboard(scene, assets, sceneMgr);
  const teacherDesk = await addTeacherDesk(scene, assets, obstacles);
  await addNoticeBoard(scene, assets, sceneMgr, obstacles, interactiveObjects);
  await addSchoolDesks(scene, assets, obstacles, interactiveObjects);
  await addClock(scene, assets, sceneMgr);
  await addDoor(scene, assets, sceneMgr, obstacles);
  await addBackpack(scene, assets, obstacles);
  // Pantalla de video en pared frontal: usa la escena CSS3D
  const screenObj = addVideoScreen(sceneMgr.cssScene, 'https://www.youtube.com/watch?v=cenYWW8zJUE', sceneMgr, { width: 8, height: 4.5, position: new THREE.Vector3(0, 3, sceneMgr.AULA_LARGO/2 - 0.01), rotationY: Math.PI });
  // Agregar punto de interacción para el video (E alterna reproducir/pausar)
  interactiveObjects.push({ type: 'video', position: screenObj.position.clone(), iframe: screenObj.element });
  // Botón físico en el escritorio del profesor para activar/desactivar el video
  // Panel de carga en la pared con la misma función del botón
  // Ubicar el panel al lado del pizarrón (misma pared: Z negativa), con un desplazamiento en X
  // Hacer que el panel mire hacia la zona de bancos y sillas calculando dinámicamente el centro
  const chairs = interactiveObjects.filter(o => o.type === 'chair');
  let desksCenter = new THREE.Vector3(0, 1.2, 2);
  if (chairs.length > 0) {
    const sum = new THREE.Vector3();
    for (const c of chairs) sum.add(c.position);
    desksCenter = sum.multiplyScalar(1 / chairs.length);
    desksCenter.y = 1.2; // mantener altura del panel para evitar inclinación vertical
  }
  // Cargar el panel en modo perezoso para que aparezca un placeholder al instante
  const chargePanel = addChargePanelLazy(scene, assets, sceneMgr, {
    x: 6, // desplazamiento a la derecha del pizarrón (centrado en x=0)
    y: 2.5,
    z: -sceneMgr.AULA_LARGO / 2,
    lookAtTarget: desksCenter,
    yawOffset: -1.25 // ajuste fino si la normal del modelo no coincide
  });
  setupVideoRaycast(chargePanel, screenObj.element);
  // Punto de interacción para HUD (E para activar/desactivar video)
  const worldPos = new THREE.Vector3();
  chargePanel.getWorldPosition(worldPos);
  interactiveObjects.push({ type: 'video', position: worldPos.clone(), iframe: screenObj.element });
}
setupScene();

// ===================================
// CONTROLES, FÍSICA E INTERACCIONES (modularizado)
// ===================================
const hud = document.getElementById('hud');
const player = new PlayerController(camera, renderer.domElement, scene, obstacles, hud);
const interaction = new InteractionManager(camera, player, interactiveObjects, { viewer: pdfViewer, frame: pdfFrame, closeBtn: closePdfBtn });

// Habilita Pointer Lock al hacer click (requerido por el navegador)
document.body.addEventListener('click', () => player.lock());
renderer.domElement.addEventListener('click', () => player.lock());

let prev = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  // actualizar interacciones potenciales
  interaction.scanPotential();
  const potentialInteraction = interaction.potential;

  if (player.isSitting) player.setHUD('Mouse: Mirar alrededor • Presiona [E] para levantarte');
  else if (player.isReadingPDF) {}
  else if (potentialInteraction) {
    if (potentialInteraction.type === 'chair') player.setHUD('Presiona [E] para sentarte');
    if (potentialInteraction.type === 'pdf') player.setHUD('Presiona [E] para leer el documento');
    if (potentialInteraction.type === 'video') player.setHUD('Presiona [E] para activar/desactivar video');
  } else if (player.controls.isLocked) player.setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir');
  else player.setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir');

  player.update(dt);
  renderer.render(scene, camera);
  if (sceneMgr.cssRenderer && sceneMgr.cssScene) sceneMgr.cssRenderer.render(sceneMgr.cssScene, camera);
}
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); if (sceneMgr.cssRenderer) sceneMgr.cssRenderer.setSize(innerWidth, innerHeight); });

// Raycasting para el botón de video
function setupVideoRaycast(targetObject, iframe) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let playing = true;

  function toggleVideo() {
    try {
      const cmd = playing ? 'pauseVideo' : 'playVideo';
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      playing = !playing;
    } catch (e) { /* noop */ }
  }

  renderer.domElement.addEventListener('click', (event) => {
    if (!player.controls.isLocked) return; // Solo cuando estás en modo caminar
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(targetObject, true);
    if (hits.length > 0) {
      toggleVideo();
      // pequeño feedback visual: toggle emissive de las mallas del panel
      const toggle = (node) => {
        node.traverse?.(child => {
          if (child.isMesh && child.material && 'emissive' in child.material) {
            if (child.material.emissiveIntensity === undefined) child.material.emissiveIntensity = 0;
            child.material.emissiveIntensity = child.material.emissiveIntensity > 0 ? 0 : 0.7;
          }
        });
      };
      toggle(targetObject);
    }
  });
}