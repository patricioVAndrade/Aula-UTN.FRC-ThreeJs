import * as THREE from 'three';

export async function addSchoolDesks(scene, assets, obstacles, interactiveObjects) {
  const gltf = await assets.loadGLTF('./assets/school_desk.glb');
  const model = gltf.scene;

  const COLS_X = [-7, 0, 7];
  const ROWS_Z = [8, 2, -4];

  for (const z of ROWS_Z) {
    for (const x of COLS_X) {
      const newDesk = model.clone();
      newDesk.scale.setScalar(0.4);
      newDesk.position.set(x, 1, z);
      newDesk.rotation.y = Math.PI / 2;
      newDesk.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});
      scene.add(newDesk);
      obstacles.push({ x, z, r: 1.5 });

      const chairOffset = 0.7;
      interactiveObjects.push({ type: 'chair', position: new THREE.Vector3(x - chairOffset, 0, z + 0.8), sitPosition: new THREE.Vector3(x - chairOffset, 1.1, z + 0.8) });
      interactiveObjects.push({ type: 'chair', position: new THREE.Vector3(x + chairOffset, 0, z + 0.8), sitPosition: new THREE.Vector3(x + chairOffset, 1.1, z + 0.8) });
    }
  }
}
