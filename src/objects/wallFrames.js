import * as THREE from 'three';

// Añade cuadros (frames) con imágenes en las paredes.
// Carga texturas de forma asíncrona y ajusta tamaño según aspect ratio real para evitar deformaciones.
export async function addWallFrames(scene, assets, dims, options = {}) {
  const texLoader = assets.texLoader;
  // Reubicamos ambos cuadros en la pared derecha (x = +ANCHO/2) y ajustamos tamaños.
  // También fijamos el logo de sistemas a un aspect ratio más cuadrado para que no se deforme.
  const rightWallX = dims.AULA_ANCHO / 2 - 0.02;
  const frames = [
    {
      file: options.sistemasLogoPath || './assets/logo_sistemas.png',
      title: 'SISTEMAS',
      width: 2.0,
      height: 2.4,
      position: new THREE.Vector3(rightWallX, 3.0, -2.0),
      rotY: -Math.PI / 2
    },
    {
      file: options.utnPhotoPath || './assets/utn_frc_portico.jpg',
      title: 'UTN FRC',
      width: 4.5,
      height: 2.7,
      position: new THREE.Vector3(rightWallX, 2.9, 4.0),
      rotY: -Math.PI / 2
    },
    {
      file: options.ingresantesPosterPath || './assets/posterIngresantes.jpg',
      title: 'INGRESANTES',
      width: 3.2,
      height: 2.2,
      position: new THREE.Vector3(rightWallX, 3.0, -8.0),
      rotY: -Math.PI / 2
    }
  ];

  for (const cfg of frames) {
    const texture = await loadTextureSafe(texLoader, cfg.file, cfg.title);
    texture.colorSpace = THREE.SRGBColorSpace || THREE.sRGBEncoding;
  // Mejora de nitidez a lo lejos
  texture.anisotropy = 16;
  texture.minFilter = THREE.LinearMipmapLinearFilter;
  texture.magFilter = THREE.LinearFilter;

    // Ajuste de aspect ratio real
    const texAR = (texture.image?.width || cfg.width) / (texture.image?.height || cfg.height);
    let w = cfg.width, h = cfg.height;
    const targetAR = w / h;
    if (Math.abs(texAR - targetAR) > 0.05) {
      if (texAR > targetAR) {
        // Textura más apaisada: ajusto ancho
        w = h * texAR;
      } else {
        // Textura más vertical: ajusto alto
        h = w / texAR;
      }
    }

  const mat = new THREE.MeshBasicMaterial({ map: texture });
  // Evitar z-fighting contra la pared: usar factor positivo para traer el cuadro hacia la cámara
  mat.polygonOffset = true;
  mat.polygonOffsetFactor = 1;
  mat.polygonOffsetUnits = 1;
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
  plane.position.copy(cfg.position);
  plane.rotation.y = cfg.rotY;
  // Empujar el cuadro unos centímetros hacia adentro del aula siguiendo la normal del plano
  const normal = new THREE.Vector3(0, 0, 1).applyEuler(new THREE.Euler(0, cfg.rotY, 0));
  // Colocar el ARTE delante del marco pero separado de la pared
  plane.position.addScaledVector(normal, 0.030);
  plane.renderOrder = 2;

    // Marco detrás, un poco más grande
  const frameMat = new THREE.MeshBasicMaterial({ color: 0x111111 });
  frameMat.polygonOffset = true;
  frameMat.polygonOffsetFactor = 2;
  frameMat.polygonOffsetUnits = 2;
    const frame = new THREE.Mesh(new THREE.PlaneGeometry(w * 1.06, h * 1.08), frameMat);
  frame.position.copy(cfg.position);
  frame.rotation.y = cfg.rotY;
  // El marco debe quedar DETRÁS del arte pero por delante de la pared
  frame.position.addScaledVector(normal, 0.028);
  frame.renderOrder = 1;


    scene.add(frame);
    scene.add(plane);
  }
}

function makePlaceholderTexture(text) {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#e6e6e6';
  ctx.fillRect(0, 0, 512, 512);
  ctx.fillStyle = '#222';
  ctx.font = 'bold 48px Arial';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(text, 256, 256);
  return new THREE.CanvasTexture(canvas);
}

function loadTextureSafe(loader, path, title) {
  return new Promise(resolve => {
    loader.load(
      path,
      tex => resolve(tex),
      undefined,
      () => resolve(makePlaceholderTexture(title))
    );
  });
}
