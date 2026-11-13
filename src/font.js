const fontCache = new Map();

/**
 * Represents a textmode font
 */
export default class font {
  /**
   * @param {int} glyphWidth of each character in pixels
   * @param {int} glyphHeight of each character in pixels
   * @param {Uint8Array[]} glyphs Per-glyph pixel data, one 0/1 entry per pixel
   */
  constructor(glyphWidth, glyphHeight, glyphs) {
    this.glyphWidth = glyphWidth;
    this.glyphHeight = glyphHeight;
    this.glyphs = glyphs;
  }

  /**
   * Parse a PSF2 (Linux console) font
   *
   * Glyphs are indexed by position in the font; any Unicode table is ignored.
   *
   * @param {ArrayBuffer} buffer
   *
   * @return {font}
   */
  static fromPSF2(buffer) {
    const bytes = new Uint8Array(buffer);
    if (bytes.length < 32) throw new Error("PSF2 data truncated");

    const view = new DataView(buffer);
    if (view.getUint32(0, true) !== 0x864ab572) {
      throw new Error("Not a PSF2 font");
    }

    const headerSize = view.getUint32(8, true);
    const count = view.getUint32(16, true);
    const bytesPerGlyph = view.getUint32(20, true);
    const height = view.getUint32(24, true);
    const width = view.getUint32(28, true);
    const bytesPerRow = Math.ceil(width / 8);

    if (width === 0 || height === 0 || bytesPerGlyph < bytesPerRow * height) {
      throw new Error("Invalid PSF2 glyph dimensions");
    }
    if (headerSize + count * bytesPerGlyph > bytes.length) {
      throw new Error("PSF2 data truncated");
    }

    const glyphs = [];
    for (let c = 0; c < count; c++) {
      const glyphOffset = headerSize + c * bytesPerGlyph;
      const glyph = new Uint8Array(width * height);
      for (let y = 0; y < height; y++) {
        const rowOffset = glyphOffset + y * bytesPerRow;
        for (let x = 0; x < width; x++) {
          glyph[y * width + x] =
            (bytes[rowOffset + (x >> 3)] >> (7 - (x & 7))) & 1;
        }
      }
      glyphs.push(glyph);
    }

    return new font(width, height, glyphs);
  }

  /**
   * Fetch and parse a PSF2 font
   *
   * @param {string} url
   *
   * @return {Promise<font>}
   */
  static async load(url) {
    if (!fontCache.has(url)) fontCache.set(url, (async () => {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      return font.fromPSF2(await response.arrayBuffer());
    })());
    return fontCache.get(url);

  }
}
