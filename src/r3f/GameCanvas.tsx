import { Canvas } from '@react-three/fiber';
import { CONFIG } from '../core/Config';
import { Engine } from './Engine';

export function GameCanvas() {
  return (
    <Canvas
      flat
      dpr={window.devicePixelRatio}
      gl={{ antialias: false }}
      shadows={
        CONFIG.renderer.shadowMap.enabled
          ? { type: CONFIG.renderer.shadowMap.type }
          : false
      }
    >
      <color attach="background" args={[CONFIG.renderer.clearColour]} />
      <fog
        attach="fog"
        args={[
          CONFIG.scene.fog.colour,
          CONFIG.scene.fog.near,
          CONFIG.scene.fog.far,
        ]}
      />
      <Engine />
    </Canvas>
  );
}
