export async function addBackpack(scene, assets, obstacles, interactiveObjects) {
  const gltf = await assets.loadGLTF('./assets/mochila.glb');
  gltf.scene.scale.setScalar(0.8);
  gltf.scene.position.set(-8.5, 0, 12);
  gltf.scene.rotation.y = 0.5;
  scene.add(gltf.scene);
  obstacles.push({ x: -8.5, z: 12, r: 0.5 });

  // Registrar interacción tipo link al acercarse a la mochila
  interactiveObjects.push({
    type: 'link',
    position: gltf.scene.position.clone().add({ x: 0, y: 1.0, z: 0 }),
    urlE: 'https://www.instagram.com/cet_aeti/?hl=es-la',
    interactionRadius: 2.5,
    hud: 'Por cualquier duda comunicate con el Centro de Estudiantes • [E] Instagram CET-AETI',
    bannerId: 'backpack'
  });
}
