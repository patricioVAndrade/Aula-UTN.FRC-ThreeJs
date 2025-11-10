import * as THREE from 'three';

export async function addTeacherDesk(scene, assets, obstacles) {
  const gltf = await assets.loadGLTF('./assets/teacher_desk.glb'); //
  const desk = gltf.scene;
  desk.scale.setScalar(8.0);
  const deskX = 5, deskZ = -10;
  desk.position.set(deskX, -0.2, deskZ);
  desk.rotation.y = Math.PI;
  desk.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
  scene.add(desk);

  // === INICIO DE LA MODIFICACIÓN ===
  
  // En lugar de 1 obstáculo gigante, creamos 3 más pequeños
  // para simular la forma rectangular del escritorio.
  
  const obstacleRadius = 0.4; // Radio de cada cilindro (0.8m de diámetro)
  const separation = 0.7; // Separación entre los centros de los cilindros
  
  // Obstáculo 1 (Izquierda)
  obstacles.push({ x: deskX - separation, z: deskZ, r: obstacleRadius });
  
  // Obstáculo 2 (Centro)
  obstacles.push({ x: deskX, z: deskZ, r: obstacleRadius });
  
  // Obstáculo 3 (Derecha)
  obstacles.push({ x: deskX + separation, z: deskZ, r: obstacleRadius });
  
  // === FIN DE LA MODIFICACIÓN ===

  return desk;
}
 