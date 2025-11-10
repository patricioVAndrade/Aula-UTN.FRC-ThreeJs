import * as THREE from 'three';

export async function addStudyTipsPaper(scene, assets) {
    try {
        const gltf = await assets.loadGLTF('./assets/paper_debris.glb');
        const paper = gltf.scene;

        // Posición sobre el escritorio del profesor
        paper.position.set(5, 1.235, -10);
        paper.rotation.y = -Math.PI / 2;

        // --- AJUSTA ESTA ESCALA ---
        // Este modelo es grande, así que probablemente necesites
        // hacerlo mucho más pequeño. Prueba con valores así:
        paper.scale.set(0.02, 0.02, 0.02); 
        
        // Habilitamos sombras
        paper.traverse(node => {
            if (node.isMesh) {
                node.castShadow = true;
                node.receiveShadow = true;
            }
        });

        scene.add(paper);
        
        // Devolvemos el modelo para poder leer su posición
        return paper; 

    } catch (error) {
        console.error("Error al cargar el papel de tips:", error);
        return null;
    }
}