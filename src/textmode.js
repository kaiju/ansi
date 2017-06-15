/**
 * textmode.js
 * An appropriation of a text mode display using the canvas element
 *
 * Usage: var tm = new textmode.display(options);
 *
 * Author: Josh <josh@kaiju.net>
 */

var characterSets = [];

export function binaryString2HexString(binaryString)
{
    var hex = ""
    for (var i=0;i<binaryString.length;i+=4) {
        hex += parseInt(binaryString.slice(i,i+4), 2).toString(16).toUpperCase();
    }
    return hex;
}

export function hexString2BinaryString(hexString)
{
    var bin = ""
    for (var i=0;i<hexString.length;i++) {
        var chunk = parseInt("0x"+hexString[i], 16).toString(2)
        while(chunk.length < 4) chunk = "0" + chunk;
        bin += chunk
    }
    return bin;
}

export function hexString2RGBArray(hexString)
{
    if (hexString.charAt(0) === '#') hexString = hexString.slice(1);
    var rgb = [];
    for (var i=0;i<hexString.length;i+=2) {
        rgb.push(parseInt("0x"+hexString.slice(i,i+2),16));
    }
    return rgb;
}

/**
 * Creates and returns a new textmode display
 * @constructor
 *
 * @param {int} options.cols Display width in rows. Default: 80
 * @param {int} options.rows Display height in rows. Default: 25
 * @param {string} options.characterSet 
 */
export default function textmode(options)
{
    // constructor options
    this.options = (options === undefined) ? {} : options;
    this._cols = (options.cols === undefined) ? 80 : options.cols;
    this._rows = (options.rows === undefined) ? 25 : options.rows;
    this._characterSet = options.characterSet;

    // cursor junk
    this._cursorX = 0;
    this._cursorY = 0;
    this._fgColor = [184,184,184];
    this._bgColor = [0,0,0];

    // set up canvas
    this._canvas = document.createElement('canvas');
    this._context = this._canvas.getContext('2d');
    this._widthpx = this._cols * this._characterSet.characterWidth;
    this._heightpx = this._rows * this._characterSet.characterHeight;

    this._canvas.setAttribute('width', this._widthpx);
    this._canvas.setAttribute('height', this._heightpx);
    this._canvas.setAttribute('tabindex', '1');
    this._context.fillStyle = '#000000';
    this._context.fillRect(0, 0, this._widthpx, this._heightpx);
}

/**
 * Return canvas element
 * @memberof textmode
 *
 * @return {HTMLElement} Canvas element
 */
textmode.prototype.canvas = function canvas() {
    return this._canvas;
}

/**
 * Draw a character at the cursor position in the display
 * @memberof textmode.display
 *
 * @param {int} charcode Character code to draw
 *
 * @return {object} textmode.display
 */
textmode.prototype.draw = function(charcode) {

    if (this._characterSet.characters[charcode] === undefined) return;

    var cdata = this._context.createImageData(this._characterSet.characterWidth, this._characterSet.characterHeight),
        character = this._characterSet.characters[charcode];

    for (var z=0;z<character.length;z++) {
        var bit = ((z+1)*4)-4;
        var color = (character[z] === "1") ? this._fgColor : this._bgColor;
        cdata.data[bit] = color[0]
        cdata.data[bit+1] = color[1];
        cdata.data[bit+2] = color[2];
        cdata.data[bit+3] = 255; // alpha support in the future?
    }

    this._context.putImageData(
        cdata,
        this._cursorX*this._characterSet.characterWidth,
        this._cursorY*this._characterSet.characterHeight
    );

    return this;
}

/**
 * Move the cursor to a position in the display
 * @memberof textmode.display
 *
 * @param {int} col Column to move to
 * @param {int} row Row to move to
 *
 * @return {object} textmode.display
 */
textmode.prototype.move = function(col, row) {
    this._cursorX = col;
    this._cursorY = row;
    return this;
}

textmode.prototype.col = function col(col) {
    this._cursorX = col;
    return this;
}

textmode.prototype.row = function row(row) {
    this._cursorY = row;
    return this;
}

/**
 * Set the foreground color by array of RGB values
 * @memberof textmode.display
 *
 * @param {array} RGBArray Array of RGB values
 *
 * @return {object} textmode.display
 */
textmode.prototype.foreColor = function(RGBArray) {
    this._fgColor = RGBArray;
    return this;
}

/**
 * Set the background color by array of RGB values
 * @memberof textmode.display
 *
 * @param {array} RGBArray Array of RGB values
 *
 * @return {object} textmode.display
 */
textmode.prototype.backColor = function(RGBArray) {
    this._bgColor = RGBArray;
    return this;
}
