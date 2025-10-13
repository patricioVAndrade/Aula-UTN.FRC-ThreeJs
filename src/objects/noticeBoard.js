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
  interactiveObjects.push({ type: 'pdf', position: new THREE.Vector3(boardX + 0.2, 1.8, boardZ + 0.5), path: './assets/plan.pdf' });
}
