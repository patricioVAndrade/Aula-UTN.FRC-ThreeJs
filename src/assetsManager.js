import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js';

export class AssetsManager {
  constructor() {
    this.gltfLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/');
    this.gltfLoader.setDRACOLoader(draco);
    this.texLoader = new THREE.TextureLoader();
  }

  loadGLTF(path) {
    return this.gltfLoader.loadAsync(path);
  }
}
