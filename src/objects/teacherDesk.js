export async function addTeacherDesk(scene, assets, obstacles) {
  const gltf = await assets.loadGLTF('./assets/teacher_desk.glb');
  const desk = gltf.scene;
  desk.scale.setScalar(8.0);
  const deskX = 5, deskZ = -10;
  desk.position.set(deskX, -0.2, deskZ);
  desk.rotation.y = Math.PI;
  desk.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
  scene.add(desk);
  obstacles.push({ x: deskX, z: deskZ, r: 2.0 });
  return desk;
}
