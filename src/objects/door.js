export async function addDoor(scene, assets, dims, obstacles) {
  const gltf = await assets.loadGLTF('./assets/puertadoble.glb');
  gltf.scene.scale.setScalar(0.011);
  gltf.scene.position.set(-dims.AULA_ANCHO / 2 + 0.1, 0, -9);
  gltf.scene.rotation.y = Math.PI;
  scene.add(gltf.scene);
  obstacles.push({ x: -dims.AULA_ANCHO / 2, z: -8, r: 1.5 });
}
