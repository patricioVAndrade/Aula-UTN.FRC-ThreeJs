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
import { addChargePanelLazy } from './src/objects/chargePanel.js';

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
// Referencia global al API de la pantalla para usar en el loop
let videoScreen = null;

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
  // Pantalla de video en pared frontal: CSS3D + marco WebGL pegado a la pared
  videoScreen = addVideoScreen(scene, sceneMgr.cssScene, 'https://www.youtube.com/watch?v=cenYWW8zJUE', sceneMgr, { width: 8, height: 4.5, position: new THREE.Vector3(0, 3, sceneMgr.AULA_LARGO/2 - 0.02), rotationY: Math.PI });
  interactiveObjects.push({ type: 'video', position: videoScreen.position.clone(), iframe: videoScreen.element });
  
  // Panel de carga con orientación hacia los bancos
  const chairs = interactiveObjects.filter(o => o.type === 'chair');
  let desksCenter = new THREE.Vector3(0, 1.2, 2);
  if (chairs.length > 0) {
    const sum = new THREE.Vector3();
    chairs.forEach(c => sum.add(c.position));
    desksCenter = sum.multiplyScalar(1 / chairs.length);
    desksCenter.y = 1.2;
  }
  
  const chargePanel = addChargePanelLazy(scene, assets, sceneMgr, {
    x: 6,
    y: 2.5,
    z: -sceneMgr.AULA_LARGO / 2,
    lookAtTarget: desksCenter,
    yawOffset: -1.25
  });
  setupVideoRaycast(chargePanel, videoScreen.element);
  
  const worldPos = new THREE.Vector3();
  chargePanel.getWorldPosition(worldPos);
  interactiveObjects.push({ type: 'video', position: worldPos.clone(), iframe: videoScreen.element });
}
setupScene();

// ===================================
// CONTROLES, FÍSICA E INTERACCIONES (modularizado)
// ===================================
const hud = document.getElementById('hud');
const player = new PlayerController(camera, renderer.domElement, scene, obstacles, hud);
const interaction = new InteractionManager(camera, player, interactiveObjects, { viewer: pdfViewer, frame: pdfFrame, closeBtn: closePdfBtn });
const visRaycaster = new THREE.Raycaster();

document.body.addEventListener('click', () => player.lock());
renderer.domElement.addEventListener('click', () => player.lock());

let prev = performance.now();

function animate() {
  requestAnimationFrame(animate);
  const now = performance.now();
  const dt = Math.min(0.033, (now - prev) / 1000);
  prev = now;

  interaction.scanPotential();
  const potentialInteraction = interaction.potential;

  updateHUD(potentialInteraction);
  player.update(dt);
  
  renderer.render(scene, camera);
  if (sceneMgr.cssRenderer && sceneMgr.cssScene) {
    sceneMgr.cssRenderer.render(sceneMgr.cssScene, camera);
  }

  handleVideoOcclusion();
}

function updateHUD(potentialInteraction) {
  if (player.isSitting) {
    player.setHUD('Mouse: Mirar alrededor • Presiona [E] para levantarte');
  } else if (player.isReadingPDF) {
    // No mostrar HUD
  } else if (potentialInteraction) {
    if (potentialInteraction.type === 'chair') player.setHUD('Presiona [E] para sentarte');
    else if (potentialInteraction.type === 'pdf') player.setHUD('Presiona [E] para leer el documento');
    else if (potentialInteraction.type === 'video') player.setHUD('Presiona [E] play/pausa video • [R] sonido on/off');
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

function setupVideoRaycast(targetObject, iframe) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  let playing = false;

  renderer.domElement.addEventListener('click', (event) => {
    if (!player.controls.isLocked) return;
    
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObject(targetObject, true);
    
    if (hits.length > 0) {
      const cmd = playing ? 'pauseVideo' : 'playVideo';
      iframe.contentWindow.postMessage(JSON.stringify({ event: 'command', func: cmd, args: [] }), '*');
      playing = !playing;
      
      if (playing && !iframe.dataset.autoplayBoosted) {
        const url = new URL(iframe.src);
        if (url.searchParams.get('autoplay') !== '1') {
          url.searchParams.set('autoplay', '1');
          iframe.src = url.toString();
          iframe.dataset.autoplayBoosted = '1';
        }
      }
      
      targetObject.traverse(child => {
        if (child.isMesh && child.material && 'emissive' in child.material) {
          if (child.material.emissiveIntensity === undefined) child.material.emissiveIntensity = 0;
          child.material.emissiveIntensity = child.material.emissiveIntensity > 0 ? 0 : 0.7;
        }
      });
    }
  });
}