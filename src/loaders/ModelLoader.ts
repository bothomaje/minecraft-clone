import { Group } from 'three';
import { GLTFLoader } from 'three/examples/jsm/Addons.js';

interface Models {
  pickaxe: Group | undefined;
}
export class ModelLoader {
  loader = new GLTFLoader();

  models: Models = {
    pickaxe: undefined,
  };

  /**
   * Loads the 3D models into memory
   * @param {(object) => ()} onLoad
   */
  loadModels(onLoad: (models: Models) => void) {
    this.loader.load('/models/pickaxe.glb', (model) => {
      this.models.pickaxe = model.scene;
      onLoad(this.models);
    });
  }
}
