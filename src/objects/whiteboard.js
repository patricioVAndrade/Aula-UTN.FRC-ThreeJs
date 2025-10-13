import * as THREE from 'three';

export async function addWhiteboard(scene, assets, dims) {
  const gltf = await assets.loadGLTF('./assets/whiteboard.glb');
  const board = gltf.scene;
  board.scale.setScalar(4.5);
  board.position.set(0, 1.2, -dims.AULA_LARGO / 2 + 0.1);
  board.traverse(n => { if (n.isMesh) { n.castShadow = true; }});
  scene.add(board);
}
