import * as THREE from 'three';

export interface AtlasRegion {
  u0: number;
  v0: number;
  u1: number;
  v1: number;
}

type Image = CanvasImageSource & { width: number; height: number };

export class TextureAtlas {
  readonly texture: THREE.CanvasTexture;
  private regions: Map<THREE.Texture, AtlasRegion>;

  constructor(
    texture: THREE.CanvasTexture,
    regions: Map<THREE.Texture, AtlasRegion>,
  ) {
    this.texture = texture;
    this.regions = regions;
  }

  static build(textures: Set<THREE.Texture>): TextureAtlas {
    const list = [...textures];

    // check that image exists
    const image = (texture: THREE.Texture) => {
      const img = texture.image as Image | undefined;
      if (!img?.width)
        throw new Error(
          'Texture image not loaded. Await loading before building the atlas.',
        );
      return img;
    };

    const tileSize = image(list[0]).width;
    const numColumns = Math.ceil(Math.sqrt(list.length));
    const numRows = Math.ceil(list.length / numColumns);
    const width = numColumns * tileSize;
    const height = numRows * tileSize;

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const canvasContext = canvas.getContext('2d')!;
    canvasContext.imageSmoothingEnabled = false;

    const padU = 0.02 / width;
    const padV = 0.02 / height;
    const regions = new Map<THREE.Texture, AtlasRegion>();

    list.forEach((texture, index) => {
      const img = image(texture);
      if (img.width !== tileSize || img.height !== tileSize)
        throw new Error(
          `Atlas needs equal square tiles (${tileSize}px), got ${img.width}x${img.height}`,
        );

      const column = index % numColumns;
      const row = Math.floor(index / column);
      canvasContext.drawImage(img, column * tileSize, row * tileSize);
      regions.set(texture, {
        u0: (column * tileSize) / width + padU,
        u1: ((column + 1) * tileSize) / width - padU,
        v1: 1 - (row * tileSize) / height - padV,
        v0: 1 - ((row + 1) * tileSize) / height + padV,
      });
    });

    const texture = new THREE.CanvasTexture(canvas);
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.magFilter = THREE.NearestFilter;
    texture.minFilter = THREE.NearestFilter;
    texture.generateMipmaps = false;
    return new TextureAtlas(texture, regions);
  }

  region(texture: THREE.Texture): AtlasRegion {
    const region = this.regions.get(texture);
    if (!region) throw new Error('Texture is not in atlas');
    return region;
  }
}
