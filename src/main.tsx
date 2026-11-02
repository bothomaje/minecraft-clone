import { createRoot } from 'react-dom/client';
import { texturesReady } from './loaders/TextureManager';
import { GameCanvas } from './r3f/GameCanvas';

texturesReady.then(() =>
  createRoot(document.getElementById('app')!).render(<GameCanvas />),
);
