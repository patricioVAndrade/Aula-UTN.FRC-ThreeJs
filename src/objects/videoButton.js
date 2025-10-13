import * as THREE from 'three';

// Crea un botón físico (malla simple) para el escritorio del profesor
// Devuelve el mesh del botón para poder hacer raycast y detectar clics
export function addVideoButton(parentDesk, scene) {
  const radius = 0.20;
  const height = 0.08;
  const geom = new THREE.CylinderGeometry(radius, radius, height, 32);
  const mat = new THREE.MeshStandardMaterial({ color: 0xe74c3c, emissive: 0x2b0a07, metalness: 0.2, roughness: 0.6 });
  const button = new THREE.Mesh(geom, mat);
  button.castShadow = true;
  button.receiveShadow = true;
  // Posicionar en coordenadas de mundo cerca del borde del escritorio
  const base = new THREE.Vector3();
  parentDesk.getWorldPosition(base);
  button.position.set(base.x - 0.7, base.y + 1.5, base.z + 0.6);
  scene.add(button);
  // Marcador para identificar en raycast
  button.userData.type = 'videoButton';
  return button;
}
