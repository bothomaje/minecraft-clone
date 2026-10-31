import * as THREE from 'three';
import { SoundSet } from '../engine/blocks/BlockParams';

const audioLoader = new THREE.AudioLoader();

type SoundEmitter = {
  sounds?: SoundSet;
};

export class SoundManager {
  private buffers = new Map(); // <path, AudioBuffer>
  private pool = new Map(); // <path, THREE.Audio>
  listener: THREE.AudioListener;

  constructor(listener: THREE.AudioListener) {
    this.listener = listener;
  }

  /**
   *
   * @param {string} eventName
   */
  play(emitter: SoundEmitter, eventName: keyof SoundSet) {
    const path = emitter?.sounds?.[eventName];
    if (!path) return;

    const buffer = this.buffers.get(path);
    if (buffer) {
      this.playBuffer(path, buffer);
      return;
    }

    // Lazy-load on first use; cached by path from then on, so repeated
    // plays (e.g. the "breaking" tick) don't re-fetch anything.
    audioLoader.load(
      path,
      (loaded) => {
        this.buffers.set(path, loaded);
        this.playBuffer(path, loaded);
      },
      undefined,
      (err) => console.warn(`SoundManager: failed to load "${path}"`, err),
    );
  }

  private playBuffer(path: string, buffer: AudioBuffer) {
    let audio = this.pool.get(path);
    if (!audio) {
      audio = new THREE.Audio(this.listener);
      this.pool.set(path, audio);
    }

    audio.setBuffer(buffer);
    if (audio.isPlaying) audio.stop();
    audio.play();
  }
}
