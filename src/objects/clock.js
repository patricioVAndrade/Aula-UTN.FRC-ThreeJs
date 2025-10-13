export async function addClock(scene, assets, dims) {
  const gltf = await assets.loadGLTF('./assets/reloj.glb');
  gltf.scene.scale.setScalar(0.2);
  gltf.scene.position.set(dims.AULA_ANCHO / 2 - 0.2, dims.AULA_ALTO - 2.5, 0);
  gltf.scene.rotation.y = -Math.PI / 2;
  scene.add(gltf.scene);
}
