/**
 * An appropriation of a text mode display using the canvas element
 *
 * Usage: let tm = new textmode.display(options);
 *
 * Author: Josh Mast <josh@mast.zone>
 */

import defaultFontUrl from "./fonts/ibm-vga-9x16.psf?url";
import textmodeFont from "./textmode_font";

export default class textmodeDisplay extends HTMLElement {
  static observedAttributes: string[] = ["font", "cols", "rows", "label"];

  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D = this.canvas.getContext("2d");

  private imageData: ImageData;
  private data: Uint32Array;

  private font: textmodeFont;
  private cols: number;
  private rows: number;

  curX: number = 0; // column position
  curY: number = 0; // row position

  dirty: boolean = false;

  curXMin: number = 0;
  curXMax: number = 0;
  curYMin: number = 0;
  curYMax: number = 0;

  fgColor: number;
  bgColor: number;

  constructor() {
    super();
    this.attachShadow({ mode: "open" }).appendChild(this.canvas);
  }

  // connect to dom
  connectedCallback() {
    this.canvas.width = this.imageData.width;
    this.canvas.height = this.imageData.height;
    this.canvas.tabIndex = 1;
    this.render();
    this.shadowRoot?.replaceChildren(this.canvas);
  }

  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue !== newValue && this.isConnected) this.init();

    if (_name === "label") {
      this.canvas.title = newValue;
    }
  }

  async init() {
    // load our font
    const fontUrl = this.getAttribute("font") ?? defaultFontUrl;
    this.font = await textmodeFont.load(fontUrl);

    // Get our column/rows
    this.cols = this.hasAttribute("cols")
      ? Number(this.getAttribute("cols"))
      : 80;
    this.rows = this.hasAttribute("rows")
      ? Number(this.getAttribute("rows"))
      : 25;

    // Get our pixel width/height
    const pixelWidth: number = this.cols * this.font.glyphWidth;
    const pixelHeight: number = this.rows * this.font.glyphHeight;

    // Create a image data buffer for our entire canvas
    this.imageData = new ImageData(pixelWidth, pixelHeight);
    this.data = new Uint32Array(this.imageData.data.buffer);

    this.clear();
  }

  clear() {
    this.data.fill((0xff000000 | this.bgColor) >>> 0);
    this.dirty = true;
    this.curX = this.curXMin = 0;
    this.curXMax = this.cols - 1;
    this.curY = this.curYMin = 0;
    this.curYMax = this.rows - 1;
  }

  draw(c: number) {
    if (this.font.glyphs[c] === undefined) return;

    if (this.dirty === false) {
      this.dirty = true;
      this.curXMin = this.curXMax = this.curX;
      this.curYMin = this.curYMax = this.curY;
    } else {
      this.curXMin = Math.min(this.curXMin, this.curX);
      this.curXMax = Math.max(this.curXMax, this.curX);
      this.curYMin = Math.min(this.curYMin, this.curY);
      this.curYMax = Math.max(this.curYMax, this.curY);
    }

    // walk each bit in the glyph bitmap and turn it into a rgba pixel array
    for (let bit = 0; bit < this.font.glyphs[c].length; bit++) {
      // determine if this is a foreground or background color based on bit
      const color = this.font.glyphs[c][bit] ? this.fgColor : this.bgColor;

      const pixel = (0xff000000 | color) >>> 0;

      // TODO- understand this math a little better
      // where are we column-wise within the glyph dimensions
      const pcol =
        this.curX * this.font.glyphWidth + (bit % this.font.glyphWidth);
      // where are we row-wise within the glyph dimensions
      const prow =
        this.curY * this.font.glyphHeight +
        Math.floor(bit / this.font.glyphWidth);

      // translate glyph pixel dimension to our canvas buffer
      const pos = prow * this.imageData.width + pcol;
      this.data[pos] = pixel;
    }

    return this;
  }

  move(x: number, y: number) {
    this.curX = x;
    this.curY = y;
    return this;
  }

  render() {
    if (!this.dirty) return;
    this.context.putImageData(
      this.imageData,
      0,
      0,
      this.curXMin * this.font.glyphWidth,
      this.curYMin * this.font.glyphHeight,
      (this.curXMax - this.curXMin + 1) * this.font.glyphWidth,
      (this.curYMax - this.curYMin + 1) * this.font.glyphHeight,
    );
    this.dirty = false;
  }
}
window.customElements.define("textmode-display", textmodeDisplay);
