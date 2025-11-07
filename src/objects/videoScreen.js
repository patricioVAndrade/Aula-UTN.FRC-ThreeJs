import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// url: link de YouTube (puede ser watch o embed); el módulo lo convertirá a embed loop
// Crear una pantalla de video con iframe (CSS3D) y su marco/oclusor en WebGL para integrarse a la pared
export function addVideoScreen(webScene, cssScene, url, dims, { width = 8, height = 4.5, position = new THREE.Vector3(0, 3, dims.AULA_LARGO/2 - 0.02), rotationY = Math.PI } = {}) {
  const autoplay = false; const muted = true;
  const embedUrl = toEmbedLoopUrl(url, { autoplay, muted });
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.style.border = '0';
  iframe.width = String(width * 100);
  iframe.height = String(height * 100);
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.setAttribute('allowfullscreen', '');
  iframe.setAttribute('playsinline', '1');
  iframe.allowFullscreen = true;

  const object = new CSS3DObject(iframe);
  object.position.copy(position);
  object.rotation.y = rotationY;
  // Escala CSS3D: 1 unidad = 1px por defecto; ajustamos para que coincida con unidades Three
  const pxPerUnit = 100; // porque arriba usamos width*100/height*100
  object.scale.set(1/pxPerUnit, 1/pxPerUnit, 1/pxPerUnit);

  cssScene.add(object);

  // Crear marco y panel trasero en WebGL (ligeramente más grande que el iframe) pegado a la pared
  const group = new THREE.Group();
  group.position.copy(position);
  group.rotation.y = rotationY;

  const bezel = 0.2; // grosor del borde alrededor
  const depth = 0.03; // profundidad del marco
  const panel = new THREE.Mesh(
    new THREE.BoxGeometry(width + bezel, height + bezel, depth),
    new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.6, roughness: 0.4 })
  );
  panel.castShadow = false; panel.receiveShadow = true;
  // Ligeramente dentro de la pared para evitar z-fighting con la propia pared
  panel.position.z = 0; // el grupo ya está a -0.02 de la pared
  group.add(panel);

  // Borde resaltado: cuatro listones finos al frente del panel
  const edgeThick = 0.05;
  const edgeDepth = depth * 0.6;
  const materialEdge = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.5, roughness: 0.6 });
  const top = new THREE.Mesh(new THREE.BoxGeometry(width + bezel, edgeThick, edgeDepth), materialEdge);
  const bottom = top.clone();
  const left = new THREE.Mesh(new THREE.BoxGeometry(edgeThick, height + bezel, edgeDepth), materialEdge);
  const right = left.clone();
  top.position.set(0, (height + bezel)/2, edgeDepth*0.25);
  bottom.position.set(0, -(height + bezel)/2, edgeDepth*0.25);
  left.position.set(-(width + bezel)/2, 0, edgeDepth*0.25);
  right.position.set((width + bezel)/2, 0, edgeDepth*0.25);
  group.add(top, bottom, left, right);

  // Oclusor invisible para cálculos de visibilidad/ocultación del CSS3D
  const occluder = new THREE.Mesh(
    new THREE.PlaneGeometry(width, height),
    new THREE.MeshBasicMaterial({ color: 0x000000, visible: false })
  );
  occluder.position.z = depth * 0.51; // al frente del panel
  occluder.userData.isVideoOccluder = true;
  group.add(occluder);

  webScene.add(group);

  // Devolver referencias útiles para control externo (ocultación por raycast)
  const api = {
    element: iframe,
    position: object.position, // referencia a la posición world del CSS3D
    cssObject: object,
    webGroup: group,
    occluder,
    size: { width, height }
  };
  return api;
}

function toEmbedLoopUrl(url, { autoplay = true, muted = true } = {}) {
  try {
    const u = new URL(url);
    let videoId = '';
    if (u.hostname.includes('youtube.com')) {
      if (u.pathname.startsWith('/watch')) videoId = u.searchParams.get('v') || '';
      else if (u.pathname.startsWith('/embed/')) videoId = u.pathname.split('/').pop();
      else if (u.pathname.startsWith('/shorts/')) videoId = u.pathname.split('/').pop();
    } else if (u.hostname === 'youtu.be') {
      videoId = u.pathname.substring(1);
    }
    if (!videoId) return url;
    // loop y autoplay en embed requieren playlist=videoId para loop infinito
  const origin = encodeURIComponent(window.location.origin);
  const ap = autoplay ? 1 : 0;
  const mt = muted ? 1 : 0;
  const controls = autoplay ? 0 : 1; // mostrar controles si no hay autoplay, ayuda a ver preview
  return `https://www.youtube.com/embed/${videoId}?autoplay=${ap}&mute=${mt}&loop=1&playlist=${videoId}&controls=${controls}&modestbranding=1&rel=0&playsinline=1&enablejsapi=1&origin=${origin}`;
  } catch { return url; }
}
