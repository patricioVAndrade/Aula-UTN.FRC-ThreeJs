import * as THREE from 'three';

// Añade la pizarra con contenido paginado y flechas de navegación
// Ahora requiere cámara y renderer para poder hacer picking sobre las flechas.
export async function addWhiteboard(scene, assets, dims, camera, renderer) {
  const gltf = await assets.loadGLTF('./assets/whiteboard.glb');
  const board = gltf.scene;
  board.scale.setScalar(4.5);
  board.position.set(0, 1.2, -dims.AULA_LARGO / 2 + 0.1);
  board.traverse(n => { if (n.isMesh) { n.castShadow = true; }});
  scene.add(board);

  // Calcular dimensiones aproximadas del área útil del pizarrón
  const box = new THREE.Box3().setFromObject(board);
  const size = new THREE.Vector3();
  box.getSize(size);
  const center = new THREE.Vector3();
  box.getCenter(center);

  // Ajustamos área interna (reducción para bordes del modelo)
  const usableWidth = size.x * 0.85;
  const usableHeight = size.y * 0.55; // el modelo suele incluir patas, reducimos altura

  // Canvas para el texto (relación 2:1 aprox manteniendo resolución adecuada)
  const canvas = document.createElement('canvas');
  canvas.width = 1600; // suficiente para texto nítido
  canvas.height = 900;
  const ctx = canvas.getContext('2d');

  // Config texto
  const fontSize = 38;
  const lineHeight = 46;
  ctx.font = `bold ${fontSize}px Arial`;
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';

  // === MODIFICACIÓN 1: Array de líneas ===
  // Contenido total (se eliminan las líneas de bienvenida)
  const allLines = [
    'Ingeniería de Sistemas',
    '',
    '¿Qué es?',
    'Profesionales que diseñan, desarrollan y gestionan sistemas informáticos complejos.',
    '',
    'Áreas de formación:',
    '- Desarrollo de Software',
    '- Inteligencia Artificial',
    '- Ciberseguridad',
    '- Gestión de Proyectos',
    '- Bases de Datos',
    '- Redes y Comunicaciones',
    '',
    'Salidas laborales:',
    '- Empresas tecnológicas',
    '- Bancos y financieras',
    '- Industria y manufactura',
    '- Startups',
    '- Consultoras de IT',
    '',
    'Habilidades desarrolladas:',
    '- Pensamiento lógico y analítico',
    '- Trabajo en equipo',
    '- Resolución de problemas complejos',
    '- Comunicación efectiva',
    '',
    'Rol del ingeniero/a:',
    'Asegurar calidad, escalabilidad y seguridad de soluciones tecnológicas.',
  ];

  // Paginar automáticamente según altura disponible en canvas
  const marginTop = 40;
  const marginLeft = 50;
  const maxLinesPerPage = Math.floor((canvas.height - marginTop - 40) / lineHeight);
  const pages = [];
  for (let i = 0; i < allLines.length; i += maxLinesPerPage) {
    pages.push(allLines.slice(i, i + maxLinesPerPage));
  }
  
  // === MODIFICACIÓN 2: Añadir página especial ===
  // Añadimos manualmente la página de bienvenida al final
  pages.push([
    '¡Bienvenido/a a Ingeniería de Sistemas de Informacion!',
    'Aula Virtual por: Franco Belbruno y Patricio Valentin Andrade'
  ]);
  
  let currentPage = 0;

  // === MODIFICACIÓN 3: Función de renderizado ===
  function renderPage() {
    // Fondo
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Comprobar si es la última página (la de bienvenida)
    if (currentPage === pages.length - 1) {
        // --- Lógica de renderizado especial para la bienvenida ---
        
        const pageLines = pages[currentPage];
        const x_center = canvas.width / 2;
        let y = canvas.height / 3; // Empezar 1/3 abajo

        // 1. "Bienvenidos" (Grande, Centrado)
        ctx.font = `bold ${fontSize + 12}px Arial`; // Fuente más grande (50px)
        ctx.fillStyle = '#000';
        ctx.textAlign = 'center'; // Centrado
        ctx.fillText(pageLines[0], x_center, y);
        
        y += lineHeight * 2.5; // Espacio extra

        // 2. "Autores" (Chico, Centrado)
        ctx.font = `bold ${fontSize - 4}px Arial`; // Fuente más chica (34px)
        ctx.fillStyle = '#111';
        ctx.fillText(pageLines[1], x_center, y);

    } else {
        // --- Lógica de renderizado normal (la que ya tenías) ---
        
        ctx.font = `bold ${fontSize}px Arial`; // Resetear fuente
        ctx.textAlign = 'left';             // Resetear alineación
        
        const pageLines = pages[currentPage];
        let y = marginTop;
        for (const line of pageLines) {
            ctx.fillStyle = line.startsWith('-') ? '#111' : '#000';
            ctx.fillText(line, marginLeft, y);
            y += lineHeight;
        }
    }
    
    // Indicador de página
    ctx.fillStyle = '#444';
    ctx.font = `bold ${fontSize - 6}px Arial`;
    ctx.textAlign = 'left'; // Asegurarse que el indicador esté alineado a la izquierda
    const indicator = `Página ${currentPage + 1}/${pages.length}`;
    ctx.fillText(indicator, canvas.width - 320, canvas.height - 60);
    texture.needsUpdate = true;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.anisotropy = 4;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;

  // Plano que se ajusta al tamaño del pizarrón
  const planeGeo = new THREE.PlaneGeometry(usableWidth, usableHeight);
  const planeMat = new THREE.MeshBasicMaterial({ map: texture });
  const planeMesh = new THREE.Mesh(planeGeo, planeMat);
  planeMesh.position.set(center.x, center.y + (usableHeight * 0.05), board.position.z + 0.02);
  scene.add(planeMesh);

  // Flechas de navegación (triángulos simples)
  const arrowMat = new THREE.MeshBasicMaterial({ color: 0x222222 });
  const arrowMatInactive = new THREE.MeshBasicMaterial({ color: 0x777777 });
  const arrowGeo = new THREE.ConeGeometry(0.12, 0.28, 24);

  const leftArrow = new THREE.Mesh(arrowGeo, arrowMat);
  leftArrow.rotation.z = Math.PI; // invertido
  leftArrow.rotation.x = Math.PI * 0.5;
  leftArrow.position.set(center.x - usableWidth * 0.55, center.y - usableHeight * 0.45, board.position.z + 0.05);
  leftArrow.userData.whiteboardArrow = 'prev';

  const rightArrow = new THREE.Mesh(arrowGeo, arrowMat);
  rightArrow.rotation.x = Math.PI * 0.5;
  rightArrow.position.set(center.x + usableWidth * 0.55, center.y - usableHeight * 0.45, board.position.z + 0.05);
  rightArrow.userData.whiteboardArrow = 'next';

  scene.add(leftArrow);
  scene.add(rightArrow);

  // Raycaster para clicks
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  function onClick(ev) {
    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hits = raycaster.intersectObjects([leftArrow, rightArrow], true);
    if (hits.length) {
      const tag = hits[0].object.userData.whiteboardArrow;
      if (tag === 'prev' && currentPage > 0) currentPage--;
      else if (tag === 'next' && currentPage < pages.length - 1) currentPage++;
      updateArrows();
      renderPage();
    }
  }
  renderer.domElement.addEventListener('click', onClick);

  function updateArrows() {
    leftArrow.material = currentPage === 0 ? arrowMatInactive : arrowMat;
    rightArrow.material = currentPage === pages.length - 1 ? arrowMatInactive : arrowMat;
  }

  // Navegación por teclado cercana al pizarrón
  function isActive() {
    const locked = document.pointerLockElement === renderer.domElement;
    const dist = camera.position.distanceTo(planeMesh.position);
    return locked && dist < 7.0; // ampliar rango para poder cambiar de página desde más lejos
  }

  function goPrev() {
    if (currentPage > 0) {
      currentPage--;
      updateArrows();
      renderPage();
    }
  }
  function goNext() {
    if (currentPage < pages.length - 1) {
      currentPage++;
      updateArrows();
      renderPage();
    }
  }
  function onKeyDown(e) {
    if (!isActive()) return;
    if (e.key === 'ArrowLeft') {
      goPrev();
    } else if (e.key === 'ArrowRight') {
      goNext();
    }
  }
  window.addEventListener('keydown', onKeyDown);

  // Primera renderización
  renderPage();
  updateArrows();

  // Devuelve datos para integrarse con el sistema de interacción
  return {
    position: planeMesh.position.clone(),
    plane: planeMesh,
    arrows: { left: leftArrow, right: rightArrow },
    goPrev,
    goNext
  };
}