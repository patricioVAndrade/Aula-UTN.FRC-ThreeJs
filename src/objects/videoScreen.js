import * as THREE from 'three';
import { CSS3DObject } from 'three/examples/jsm/renderers/CSS3DRenderer.js';

// url: link de YouTube (puede ser watch o embed); el módulo lo convertirá a embed loop
export function addVideoScreen(cssScene, url, dims, { width = 8, height = 4.5, position = new THREE.Vector3(0, 3, dims.AULA_LARGO/2 - 0.01), rotationY = Math.PI } = {}) {
  const embedUrl = toEmbedLoopUrl(url);
  const iframe = document.createElement('iframe');
  iframe.src = embedUrl;
  iframe.style.border = '0';
  iframe.width = String(width * 100);
  iframe.height = String(height * 100);
  iframe.allow = 'accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share';
  iframe.allowFullscreen = true;

  const object = new CSS3DObject(iframe);
  object.position.copy(position);
  object.rotation.y = rotationY;
  // Escala CSS3D: 1 unidad = 1px por defecto; ajustamos para que coincida con unidades Three
  const pxPerUnit = 100; // porque arriba usamos width*100/height*100
  object.scale.set(1/pxPerUnit, 1/pxPerUnit, 1/pxPerUnit);

  cssScene.add(object);
  return object;
}

function toEmbedLoopUrl(url) {
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
  return `https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&loop=1&playlist=${videoId}&controls=0&modestbranding=1&rel=0&enablejsapi=1&origin=${origin}`;
  } catch { return url; }
}
