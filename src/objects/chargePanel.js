import * as THREE from 'three';

export async function addChargePanel(scene, assets, dims, { x, y = 1.5, z, rotationY, lookAtTarget, yawOffset = 0 } = {}) {
  // Cargar primero el nombre real en assets (chargerpannel.glb); si no, intentar chargepanel.glb
  let gltf;
  try {
    gltf = await assets.loadGLTF('./assets/chargerpannel.glb');
  } catch (e) {
    gltf = await assets.loadGLTF('./assets/chargepanel.glb');
  }
  const panel = gltf.scene;
  panel.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});

  // Envolver en un grupo para posicionamiento estable
  const root = new THREE.Group();
  root.add(panel);

  // Auto-escala para asegurar visibilidad (~1.2 unidades su lado mayor)
  const boxBefore = new THREE.Box3().setFromObject(panel);
  const size = new THREE.Vector3();
  boxBefore.getSize(size);
  const longest = Math.max(size.x, size.y, size.z) || 1;
  const target = 1.2; // tamaño objetivo en unidades de escena
  const s = target / longest;
  panel.scale.multiplyScalar(s);

  // Centrar el modelo en su origen para que root.position sea el punto de anclaje
  const boxAfter = new THREE.Box3().setFromObject(panel);
  const center = new THREE.Vector3();
  boxAfter.getCenter(center);
  panel.position.sub(center); // mueve el contenido para que root (0,0,0) quede al centro del modelo

  // Posicionamiento por defecto: pared izquierda si no se especifica
  const posX = (typeof x === 'number') ? x : (-dims.AULA_ANCHO / 2 + 0.05);
  const posZ = (typeof z === 'number') ? z : 0;
  root.position.set(posX, y, posZ);
  // Empujar medio paso hacia dentro del aula para evitar z-fighting si está pegado a pared Z
  if (posZ <= -dims.AULA_LARGO/2 + 0.2) root.position.z += 0.12; // pared trasera
  if (posZ >=  dims.AULA_LARGO/2 - 0.2) root.position.z -= 0.12; // pared frontal

  // Orientación: si se proporciona un objetivo, mirar hacia él; si no, usar rotationY o por defecto hacia adentro
  if (lookAtTarget && lookAtTarget.isVector3) {
    const target = lookAtTarget.clone();
    // Mantener misma altura para evitar inclinación hacia arriba/abajo
    target.y = root.position.y;
    root.lookAt(target);
    if (yawOffset) root.rotateY(yawOffset);
  } else {
    root.rotation.y = (typeof rotationY === 'number') ? rotationY : Math.PI / 2; // mirando hacia adentro
  }

  scene.add(root);
  return root;
}

// Variante de carga perezosa: devuelve un grupo inmediatamente con un placeholder
// y carga el GLB en segundo plano. Útil para reducir la percepción de espera.
export function addChargePanelLazy(scene, assets, dims, { x, y = 1.5, z, rotationY, lookAtTarget, yawOffset = 0 } = {}) {
  const root = new THREE.Group();

  // Placeholder simple: una placa con leve emissive
  const phGeo = new THREE.BoxGeometry(0.6, 0.6, 0.05);
  const phMat = new THREE.MeshStandardMaterial({ color: 0x4466ff, emissive: 0x112244, metalness: 0.1, roughness: 0.7 });
  const placeholder = new THREE.Mesh(phGeo, phMat);
  placeholder.castShadow = true; placeholder.receiveShadow = true;
  root.add(placeholder);

  // Posición y orientación (igual que en la versión async)
  const posX = (typeof x === 'number') ? x : (-dims.AULA_ANCHO / 2 + 0.05);
  const posZ = (typeof z === 'number') ? z : 0;
  root.position.set(posX, y, posZ);
  if (posZ <= -dims.AULA_LARGO/2 + 0.2) root.position.z += 0.12;
  if (posZ >=  dims.AULA_LARGO/2 - 0.2) root.position.z -= 0.12;

  if (lookAtTarget && lookAtTarget.isVector3) {
    const target = lookAtTarget.clone();
    target.y = root.position.y;
    root.lookAt(target);
    if (yawOffset) root.rotateY(yawOffset);
  } else {
    root.rotation.y = (typeof rotationY === 'number') ? rotationY : Math.PI / 2;
  }

  scene.add(root);

  // Comenzar carga en segundo plano y reemplazar placeholder al finalizar
  (async () => {
    try {
      let gltf;
      try {
        gltf = await assets.loadGLTF('./assets/chargerpannel.glb');
      } catch (e) {
        gltf = await assets.loadGLTF('./assets/chargepanel.glb');
      }
      const panel = gltf.scene;
      panel.traverse(n => { if (n.isMesh) { n.castShadow = true; n.receiveShadow = true; }});

      // Auto-escala y centrado
      const boxBefore = new THREE.Box3().setFromObject(panel);
      const size = new THREE.Vector3();
      boxBefore.getSize(size);
      const longest = Math.max(size.x, size.y, size.z) || 1;
      const target = 1.2;
      const s = target / longest;
      panel.scale.multiplyScalar(s);

      const boxAfter = new THREE.Box3().setFromObject(panel);
      const center = new THREE.Vector3();
      boxAfter.getCenter(center);
      panel.position.sub(center);

      // Reemplazar placeholder por el modelo real
      root.remove(placeholder);
      root.add(panel);
    } catch (err) {
      // Si falla, mantener el placeholder y atenuar color para indicar error
      if (placeholder && placeholder.material) {
        placeholder.material.color.set(0x555555);
        placeholder.material.emissive.set(0x111111);
      }
      // Opcional: console.warn('No se pudo cargar chargePanel:', err);
    }
  })();

  return root;
}
