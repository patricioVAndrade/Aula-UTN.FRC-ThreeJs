// En: src/objects/ceilingLight.js

import * as THREE from 'three';

// Usamos un nombre en plural porque creará varias luces
export async function addCeilingLights(scene, assets, sceneMgr) {
    const AULA_ANCHO = sceneMgr.AULA_ANCHO;
    const AULA_LARGO = sceneMgr.AULA_LARGO;
    const AULA_ALTO = sceneMgr.AULA_ALTO;

    try {
        // 1. Cargar el "molde" o "plantilla" de la lámpara
        const gltf = await assets.loadGLTF('./assets/ceiling_light.glb');
        const lightModelTemplate = gltf.scene;
        
        // Ajusta la escala si es necesario
        lightModelTemplate.scale.set(0.5, 0.5, 0.5); 
        
        // Hacemos que el modelo de la lámpara genere sombras
        lightModelTemplate.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
            }
        });

        // 2. Definir la cuadrícula de luces
        const numRows = 3; // 3 filas a lo largo (Z)
        const numCols = 2; // 2 columnas a lo ancho (X)

        // 3. Crear y posicionar las luces
        for (let i = 0; i < numRows; i++) {
            for (let j = 0; j < numCols; j++) {
                
                // Clonamos el modelo
                const modelClone = lightModelTemplate.clone();
                
                // Creamos una NUEVA luz para CADA clon
                // (Color, Intensidad, Distancia de alcance)
                // *** Tendrás que ajustar la Intensidad (1.5) y Distancia (15) ***
                const pointLight = new THREE.PointLight(0xFFFFFF, 1.5, 15);
                
                pointLight.castShadow = false; // ¡Esta luz genera sombras!
                
                // "Pegamos" la luz al modelo clonado
                modelClone.add(pointLight);

                // Calculamos la posición en la cuadrícula
                const x = -AULA_ANCHO / 2 + (j + 1) * (AULA_ANCHO / (numCols + 1));
                const z = -AULA_LARGO / 2 + (i + 1) * (AULA_LARGO / (numRows + 1));
                const y = AULA_ALTO - 0.5; // Un poco por debajo del techo
                
                modelClone.position.set(x, y, z);
                
                scene.add(modelClone);
            }
        }

    } catch (error) {
        console.error("Error al cargar las luces del techo:", error);
    }
}