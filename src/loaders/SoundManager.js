import * as THREE from 'three';

const audioLoader = new THREE.AudioLoader();

export class SoundManager {
  #buffers = new Map(); // <path, AudioBuffer>
  #pool = new Map(); // <path, THREE.Audio>

  constructor(listener) {
    this.listener = listener;
  }

  /**
   * @param {{ sounds?: Record<string, string> }} emitter
   * @param {string} eventName
   */
  play(emitter, eventName) {
    const path = emitter?.sounds?.[eventName];
    if (!path) return;

    const buffer = this.#buffers.get(path);
    if (buffer) {
      this.#playBuffer(path, buffer);
      return;
    }

    // Lazy-load on first use; cached by path from then on, so repeated
    // plays (e.g. the "breaking" tick) don't re-fetch anything.
    audioLoader.load(
      path,
      (loaded) => {
        this.#buffers.set(path, loaded);
        this.#playBuffer(path, loaded);
      },
      undefined,
      (err) => console.warn(`SoundManager: failed to load "${path}"`, err),
    );
  }

  #playBuffer(path, buffer) {
    let audio = this.#pool.get(path);
    if (!audio) {
      audio = new THREE.Audio(this.listener);
      this.#pool.set(path, audio);
    }

    audio.setBuffer(buffer);
    if (audio.isPlaying) audio.stop();
    audio.play();
  }
}
