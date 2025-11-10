import * as THREE from 'three';

export async function addNoticeBoard(scene, assets, dims, obstacles, interactiveObjects) {
  const gltf = await assets.loadGLTF('./assets/notice_board.glb');
  const nb = gltf.scene;
  nb.scale.setScalar(1.5);
  const boardX = -dims.AULA_ANCHO / 2;
  const boardZ = 1;
  nb.position.set(boardX, 1.2, boardZ);
  nb.rotation.y = Math.PI / 2;
  nb.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
  scene.add(nb);
  obstacles.push({ x: boardX, z: boardZ, r: 0.5 });
  // Hacer el notice-board interactivo para abrir enlaces externos con E y R
  interactiveObjects.push({
    type: 'link',
    position: new THREE.Vector3(boardX + 0.2, 1.8, boardZ + 0.5),
    urlE: 'https://www.frc.utn.edu.ar/', // Página principal UTN FRC
    urlR: 'https://www.institucional.frc.utn.edu.ar/sistemas/', // Departamento de Sistemas
    interactionRadius: 2.8
  });
}

// Segundo notice-board al lado del pizarrón en la pared frontal, abre 1ero.pdf con E
export async function addNoticeBoardNextToWhiteboard(scene, assets, dims, interactiveObjects, opts = {}) {
  const { x = 6, y = 1.2, z = -dims.AULA_LARGO / 2 + 0.1 } = opts;
  const gltf = await assets.loadGLTF('./assets/notice_board.glb');
  const nb = gltf.scene.clone();
  nb.scale.setScalar(1.5);
  nb.position.set(x, y, z);
  nb.rotation.y = 0; // Orientado hacia el interior como el pizarrón
  nb.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
  scene.add(nb);

  const interactPos = new THREE.Vector3(x, y + 0.6, z + 0.2);
  interactiveObjects.push({ type: 'pdf', position: interactPos, path: './assets/1ero.pdf', interactionRadius: 2.5 });
  return nb;
}
