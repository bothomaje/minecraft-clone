import { Game } from './core/Game';
import { texturesReady } from './loaders/TextureManager';

const app = await texturesReady.then(() => new Game());
app.start();
