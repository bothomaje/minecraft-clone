import { CONFIG } from '../app/Config';
import { state } from '../app/state';
import { mergeInto } from '../engine/persistence/mergeParams';

export class PersistenceSystem {
  constructor(world, player) {
    this.world = world;
    this.player = player;
    document.addEventListener('keydown', this.onKeyDown.bind(this));
  }

  onKeyDown(event) {
    switch (event.code) {
      case 'F1':
        this.save();
        break;
      case 'F2':
        this.load();
        break;
    }
  }

  /**
   * Saves the world data to local storage
   */
  save() {
    localStorage.setItem(
      CONFIG.world.persistenceKeys.params,
      JSON.stringify(this.world.params),
    );
    localStorage.setItem(
      CONFIG.world.persistenceKeys.data,
      JSON.stringify(this.world.dataStore.serialize()),
    );
    localStorage.setItem(
      CONFIG.world.persistenceKeys.inventory,
      JSON.stringify(this.player.inventory.serialize()),
    );
    this.showMessage('Game saved');
  }

  /**
   * Loads the game from disk
   */
  load() {
    const parameters = localStorage.getItem(
      CONFIG.world.persistenceKeys.params,
    );
    const data = localStorage.getItem(CONFIG.world.persistenceKeys.data);
    const inventory = localStorage.getItem(
      CONFIG.world.persistenceKeys.inventory,
    );

    if (!parameters || !data) {
      this.showMessage('No game has been saved yet');
      return;
    }

    const savedParams = this.readJson(parameters);
    const savedInventory = inventory ? this.readJson(inventory) : null;

    if (!savedParams || !this.world.dataStore.restore(this.readJson(data))) {
      this.showMessage('Save data is corrupted');
      return;
    }

    mergeInto(this.world.params, savedParams);
    if (savedInventory) {
      this.player.inventory.restore(savedInventory);
    }

    this.showMessage('Game loaded');
    this.world.generate();
  }

  showMessage(message) {
    state.status = message;
    setTimeout(() => {
      state.status = '';
    }, 3000);
  }

  readJson(text) {
    try {
      return JSON.parse(text);
    } catch {
      return null;
    }
  }
}
