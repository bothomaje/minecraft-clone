type Image = CanvasImageSource & { width: number; height: number };
const clamp = (value: number) => Math.min(1, Math.max(0, value));

export class Colourmap {
  private pixel: Uint8ClampedArray;
  private width: number;
  private height: number;

  constructor(image: Image) {
    this.width = image.width;
    this.height = image.height;
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const context = canvas.getContext('2d', { willReadFrequently: true })!;
    context.drawImage(image, 0, 0);
    this.pixel = context.getImageData(0, 0, this.width, this.height).data;
  }

  sample(temperature: number, downfall: number): number {
    const t = clamp(temperature);
    const d = clamp(downfall) * t;
    const x = Math.floor((1 - t) * (this.width - 1));
    const y = Math.floor((1 - d) * (this.height - 1));
    const i = (y * this.width + x) * 4;
    return (this.pixel[i] << 16) | (this.pixel[i + 1] << 8) | this.pixel[i + 2];
  }
}
