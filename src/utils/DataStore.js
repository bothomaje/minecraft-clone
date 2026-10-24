export class DataStore {
  constructor() {
    this.data = {};
  }

  clear() {
    this.data = {};
  }

  contains(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    return this.data[key] !== undefined;
  }

  get(chunkX, chunkZ, blockX, blockY, blockZ) {
    const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    const value = this.data[key];

    if (value === undefined) return undefined;

    return typeof value === 'number' ? { id: value, state: null } : value;
  }

  set(chunkX, chunkZ, blockX, blockY, blockZ, value) {
    const key = this.getKey(chunkX, chunkZ, blockX, blockY, blockZ);
    this.data[key] = value;
  }

  getKey(chunkX, chunkZ, blockX, blockY, blockZ) {
    return `${chunkX}-${chunkZ}-${blockX}-${blockY}-${blockZ}`;
  }
}
