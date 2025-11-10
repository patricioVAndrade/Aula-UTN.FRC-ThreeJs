// En: src/objects/ceiling.js
import * as THREE from 'three';

// La función ya NO es 'async'
export function addCeiling(scene, assets, sceneMgr) {

    const AULA_ANCHO = sceneMgr.AULA_ANCHO;
    const AULA_LARGO = sceneMgr.AULA_LARGO;
    const AULA_ALTO = sceneMgr.AULA_ALTO;

    const texLoader = assets.texLoader;

    // *** CAMBIA 'textura_techo.jpg' POR EL NOMBRE REAL DE TU ARCHIVO ***
    const ceilingTexture = texLoader.load('./assets/CeilingTile_Diffuse.jpeg'); 

    // Configura la repetición
    ceilingTexture.wrapS = ceilingTexture.wrapT = THREE.RepeatWrapping;
    // Ajusta estos números (ej. / 2) para que la baldosa se vea de un tamaño lógico
    ceilingTexture.repeat.set(AULA_ANCHO / 2, AULA_LARGO / 2);

    const ceilMat = new THREE.MeshStandardMaterial({ 
        map: ceilingTexture,
            roughness: 0.8,
            color: 0xCCCCCC, // Tinte base

    }); 

    const ceiling = new THREE.Mesh(
        new THREE.PlaneGeometry(AULA_ANCHO, AULA_LARGO), 
        ceilMat
    );

    ceiling.position.y = AULA_ALTO; 
    ceiling.rotation.x = Math.PI / 2;  // Rota para mirar hacia abajo

    ceiling.receiveShadow = true;
    scene.add(ceiling);
}