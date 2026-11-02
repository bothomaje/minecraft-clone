import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import { Game } from '../core/Game';

export function Engine() {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const size = useThree((s) => s.size);
  const game = useRef<Game | null>(null);

  useEffect(() => {
    const g = new Game(scene, gl.domElement);
    game.current = g;
    return () => {
      g.dispose();
      game.current = null;
    };
  }, [scene, gl]);

  useEffect(() => {
    game.current?.resize(size.width, size.height);
  }, [size]);

  useFrame((state, delta) => {
    const g = game.current;
    if (!g) return;

    g.update(delta);

    const camera = g.activeCamera;
    if (state.camera !== camera) state.set({ camera });
  });

  return null;
}
