import { App } from './app/App';
import { texturesReady } from './loaders/TextureManager';

const app = await texturesReady.then(() => new App());
app.start();
