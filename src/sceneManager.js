import * as THREE from 'three';

export class SceneManager {
  constructor() {
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x87CEEB);
    this.AULA_ANCHO = 22;
    this.AULA_LARGO = 30;
    this.AULA_ALTO = 8;
  }

  createRenderer(canvasParent = document.body) {
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(innerWidth, innerHeight);
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 0.9;
    canvasParent.appendChild(renderer.domElement);
    this.renderer = renderer;
    return renderer;
  }

  setupLights() {
    this.scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 0.8));
    const sun = new THREE.DirectionalLight(0xffffff, 1.0);
    sun.position.set(15, 25, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.near = 0.5;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -25;
    sun.shadow.camera.right = 25;
    sun.shadow.camera.top = 25;
    sun.shadow.camera.bottom = -25;
    this.scene.add(sun);
  }

  createRoom(texLoader) {
    const AULA_ANCHO = this.AULA_ANCHO;
    const AULA_LARGO = this.AULA_LARGO;
    const AULA_ALTO = this.AULA_ALTO;

    const floorTexture = texLoader.load('./assets/pisomadera.jpg');
    floorTexture.wrapS = floorTexture.wrapT = THREE.RepeatWrapping;
    floorTexture.repeat.set(AULA_ANCHO / 4, AULA_LARGO / 4);
    const floorMat = new THREE.MeshStandardMaterial({ map: floorTexture, roughness: 0.8 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(AULA_ANCHO, AULA_LARGO), floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    const wallTexture = texLoader.load('./assets/Bricks078_1K-JPG_Color.jpg');
    wallTexture.wrapS = wallTexture.wrapT = THREE.RepeatWrapping;
    wallTexture.repeat.set(AULA_ANCHO / 5, AULA_ALTO / 5);
    const wallMat = new THREE.MeshStandardMaterial({ map: wallTexture, roughness: 0.9 });
    const wallBack = new THREE.Mesh(new THREE.PlaneGeometry(AULA_ANCHO, AULA_ALTO), wallMat);
    wallBack.position.set(0, AULA_ALTO / 2, -AULA_LARGO / 2);
    wallBack.receiveShadow = true;
    this.scene.add(wallBack);

    const wallLeft = new THREE.Mesh(new THREE.PlaneGeometry(AULA_LARGO, AULA_ALTO), wallMat);
    wallLeft.position.set(-AULA_ANCHO / 2, AULA_ALTO / 2, 0);
    wallLeft.rotation.y = Math.PI / 2;
    wallLeft.receiveShadow = true;
    this.scene.add(wallLeft);

    const wallRight = new THREE.Mesh(new THREE.PlaneGeometry(AULA_LARGO, AULA_ALTO), wallMat);
    wallRight.position.set(AULA_ANCHO / 2, AULA_ALTO / 2, 0);
    wallRight.rotation.y = -Math.PI / 2;
    wallRight.receiveShadow = true;
    this.scene.add(wallRight);

    // Pared frontal (cerrando el aula por el lado positivo de Z)
    const wallFront = new THREE.Mesh(new THREE.PlaneGeometry(AULA_ANCHO, AULA_ALTO), wallMat);
    wallFront.position.set(0, AULA_ALTO / 2, AULA_LARGO / 2);
    wallFront.rotation.y = Math.PI; // Que el frente mire hacia dentro del aula
    wallFront.receiveShadow = true;
    this.scene.add(wallFront);
  }
}
