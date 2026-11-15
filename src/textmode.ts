/**
 * An appropriation of a text mode display using the canvas element
 *
 * Usage: let tm = new textmode.display(options);
 *
 * Author: Josh Mast <josh@mast.zone>
 */

import type textmodeFont from "./textmode_font";

/**
 * Creates and returns a new textmode display
 */
export default class textmode {
  /** Textmode font */
  _font: textmodeFont;
  /** Width in columns */
  _cols: number;
  /** Height in rows */
  _rows: number;
  /** Cursor X state */
  _cursorX: number;
  /** Cursor Y state */
  _cursorY: number;
  /** Foreground color state */
  _fgColor: number[];
  /** Background color state */
  _bgColor: number[];

  _canvas: HTMLCanvasElement;
  _context: CanvasRenderingContext2D;

  constructor(font: textmodeFont, cols: number = 80, rows: number = 25) {
    // constructor options
    this._cols = cols;
    this._rows = rows;
    this._font = font;

    // cursor state
    this._cursorX = 0;
    this._cursorY = 0;

    // color state
    this._fgColor = [184, 184, 184];
    this._bgColor = [0, 0, 0];

    // set up canvas
    this._canvas = document.createElement("canvas");
    this._context = this._canvas.getContext("2d");
    const canvasElementWidth: number = this._cols * this._font.glyphWidth;
    const canvasElementHeight: number = this._rows * this._font.glyphHeight;

    this._canvas.width = canvasElementWidth;
    this._canvas.height = canvasElementHeight;
    this._canvas.tabIndex = 1;
    this._context.fillStyle = "#000000";
    this._context.fillRect(0, 0, canvasElementWidth, canvasElementHeight);
  }

  get canvas() {
    return this._canvas;
  }

  /**
   * Draw a character at the cursor position in the display
   *
   * @param charcode Character code to draw
   * @return textmode
   */
  draw(charcode: number): textmode {
    if (this._font.glyphs[charcode] === undefined) return;

    const cdata = this._context.createImageData(
        this._font.glyphWidth,
        this._font.glyphHeight,
      ),
      character = this._font.glyphs[charcode];

    for (let z = 0; z < character.length; z++) {
      const bit = (z + 1) * 4 - 4;
      const color = character[z] ? this._fgColor : this._bgColor;
      cdata.data[bit] = color[0];
      cdata.data[bit + 1] = color[1];
      cdata.data[bit + 2] = color[2];
      cdata.data[bit + 3] = 255; // alpha support in the future?
    }

    this._context.putImageData(
      cdata,
      this._cursorX * this._font.glyphWidth,
      this._cursorY * this._font.glyphHeight,
    );

    return this;
  }

  /**
   * Move the cursor to a position in the display
   *
   * @param {int} col Column to move to
   * @param {int} row Row to move to
   */
  move(col: number, row: number): textmode {
    this._cursorX = col;
    this._cursorY = row;
    return this;
  }

  /**
   * Move the cursor to a column
   * @param col Column to move to
   */
  col(col: number): textmode {
    this._cursorX = col;
    return this;
  }

  /**
   * Move the cursor to a row
   * @param row Row to move to
   */
  row(row: number): textmode {
    this._cursorY = row;
    return this;
  }

  /**
   * Set the foreground color by array of RGB values
   *
   * @param RGBArray Array of RGB values
   */
  foreColor(RGBArray: number[]): textmode {
    this._fgColor = RGBArray;
    return this;
  }

  /**
   * Set the background color by array of RGB values
   *
   * @param RGBArray Array of RGB values
   */
  backColor(RGBArray: number[]): textmode {
    this._bgColor = RGBArray;
    return this;
  }
}
