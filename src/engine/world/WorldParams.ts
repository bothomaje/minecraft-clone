export interface WorldParams {
  seed: number;
  terrain: {
    waterLevel: number;
    baseHeight: number;
    continent: { scale: number; amplitude: number };
    hills: {
      scale: number;
      amplitude: number;
      octaves: number;
      persistence: number;
    };
    mountains: {
      scale: number;
      amplitude: number;
      threshold: number;
      power: number;
    };
  };
  biomes: {
    scale: number;
    variation: { amplitude: number; scale: number };
    tundraToTemperate: number;
    temperateToJungle: number;
    jungleToDesert: number;
  };
  trees: {
    trunk: { minHeight: number; maxHeight: number };
    canopy: { minRadius: number; maxRadius: number; density: number };
    frequency: number;
  };
  clouds: { scale: number; density: number; height: number };
}
