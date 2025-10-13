export async function addBackpack(scene, assets, obstacles) {
  const gltf = await assets.loadGLTF('./assets/mochila.glb');
  gltf.scene.scale.setScalar(0.8);
  gltf.scene.position.set(-8.5, 0, 12);
  gltf.scene.rotation.y = 0.5;
  scene.add(gltf.scene);
  obstacles.push({ x: -8.5, z: 12, r: 0.5 });
}
