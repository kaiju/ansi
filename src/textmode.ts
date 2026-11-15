/**
 * An appropriation of a text mode display using the canvas element
 *
 * Usage: let tm = new textmode.display(options);
 *
 * Author: Josh Mast <josh@mast.zone>
 */

import textmodeFont from "./textmode_font";
import defaultFontUrl from "./fonts/ibm9x16.psf?url";

export default class textmodeDisplay extends HTMLElement {
  static observedAttributes: string[] = ["font", "cols", "rows", "label"];

  private canvas: HTMLCanvasElement = document.createElement("canvas");
  private context: CanvasRenderingContext2D = this.canvas.getContext("2d");

  private imageData: ImageData;
  private data: Uint32Array;

  private font: textmodeFont;
  private cols: number;
  private rows: number;

  cursorX: number = 0; // column position
  cursorY: number = 0; // row position

  fgColor: number[] = [184, 184, 184];
  bgColor: number[] = [0, 0, 0];

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

    this.shadowRoot!.replaceChildren(this.canvas);
  }

  // re-render everything on change
  attributeChangedCallback(
    _name: string,
    oldValue: string | null,
    newValue: string | null,
  ) {
    if (oldValue !== newValue && this.isConnected) this.init();

    if (_name == "label") {
      this.canvas.title = this.getAttribute("label");
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

  // turns our rgb arrays into a 32 bit hex value we can easily smash into a Uint32Array
  // stop calling this on every draw and just precompute the pallete when we move
  // those into textmode
  private pack([r, g, b]: number[]) {
    return (0xff000000 | (b << 16) | (g << 8) | r) >>> 0;
  }

  clear() {
    this.data.fill(this.pack(this.bgColor));
    this.cursorX = 0;
    this.cursorY = 0;
  }

  draw(c: number) {
    if (this.font.glyphs[c] === undefined) return;

    // walk each bit in the glyph bitmap and turn it into a rgba pixel array
    for (let bit = 0; bit < this.font.glyphs[c].length; bit++) {
      // determine if this is a foreground or background color based on bit
      const color = this.font.glyphs[c][bit] ? this.fgColor : this.bgColor;

      const pixel = this.pack(color);

      // TODO- understand this math a little better
      // where are we column-wise within the glyph dimensions
      const pcol =
        this.cursorX * this.font.glyphWidth + (bit % this.font.glyphWidth);
      // where are we row-wise within the glyph dimensions
      const prow =
        this.cursorY * this.font.glyphHeight +
        Math.floor(bit / this.font.glyphWidth);

      // translate glyph pixel dimension to our canvas buffer
      const pos = prow * this.imageData.width + pcol;
      this.data[pos] = pixel;
    }

    return this;
  }

  move(x: number, y: number) {
    this.cursorX = x;
    this.cursorY = y;
    return this;
  }

  render() {
    this.context.putImageData(this.imageData, 0, 0);
  }
}
window.customElements.define("textmode-display", textmodeDisplay);
