import * as THREE from 'three';

// Coloca un libro antiguo abierto sobre un banco de alumno
// opts: { x, y, z, rotationY, scale }
export async function addOpenOldBook(scene, assets, opts = {}) {
  const {
    x = 0,
    y = 1.35,
    z = 100,
    rotationY = Math.PI / 2,
    scale = 0.2
  } = opts;

  const gltf = await assets.loadGLTF('./assets/open_old_book.glb');
  const book = gltf.scene;
  book.scale.setScalar(scale);
  book.position.set(x, y, z);
  book.rotation.y = rotationY;
  book.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});

  // Ajuste automático de altura: raycast hacia abajo para apoyar el libro sobre la mesa si hay geometría
  const ray = new THREE.Raycaster(new THREE.Vector3(x, y + 1.0, z), new THREE.Vector3(0, -1, 0), 0, 3.0);
  const hits = ray.intersectObjects(scene.children, true);
  if (hits.length) {
    const hit = hits[0];
    book.position.y = hit.point.y + 0.015; // pequeño margen para evitar z-fighting
  } else {
    book.position.y = y;
  }

  scene.add(book);
  return book;
}
