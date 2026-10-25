export interface WorldParams {
  seed: number;
  terrain: {
    scale: number;
    magnitude: number;
    offset: number;
    waterLevel: number;
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
  clouds: { scale: number; density: number };
}
