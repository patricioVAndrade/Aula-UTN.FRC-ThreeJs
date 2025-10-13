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

// ===================================
// SETUP BÁSICO (modularizado)
// ===================================
const sceneMgr = new SceneManager();
const scene = sceneMgr.scene;
const assets = new AssetsManager();
const texLoader = assets.texLoader;
const renderer = sceneMgr.createRenderer(document.body);
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
  await addTeacherDesk(scene, assets, obstacles);
  await addNoticeBoard(scene, assets, sceneMgr, obstacles, interactiveObjects);
  await addSchoolDesks(scene, assets, obstacles, interactiveObjects);
  await addClock(scene, assets, sceneMgr);
  await addDoor(scene, assets, sceneMgr, obstacles);
  await addBackpack(scene, assets, obstacles);
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
  } else if (player.controls.isLocked) player.setHUD('W/A/S/D moverse • Mouse mirar • Shift correr • Espacio saltito • Esc salir');
  else player.setHUD('Click para activar caminar (W/A/S/D, mouse mira) • Esc para salir');

  player.update(dt);
  renderer.render(scene, camera);
}
animate();
addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });