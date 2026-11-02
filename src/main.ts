import { start } from './core/Host';
import { texturesReady } from './loaders/TextureManager';

texturesReady.then(start);
