(function() {
function get_ansi_from_url(url, charset, success, error) {

	var request = new XMLHttpRequest();
	request.open('GET', url, true);
	request.overrideMimeType('text/plain; charset='+charset)

	if (typeof success === 'function') {
		request.onload = function(response) {
			if (request.status >= 200 && request.status < 400) {
				success(request.responseText);
			} else {
				// error
			}
		}
	}

	if (typeof error === 'function') {
		request.error = error;
	}

	request.send();

}

function replace_all() {

	var elements = [];

	if ('querySelectorAll' in document) {
		elements = document.querySelectorAll('[data-ansi-src]');
	} else {

		var document_elements = document.getElementsByTagName('*');

		for (var i=0;i<document_elements.length;i++) {
			if (document_elements[i].hasAttribute('data-ansi-src')) {
				elements.push(elements[i]);
			}
		}

	}

	for (var i=0;i<elements.length;i++) {
		if (!elements[i].hasAttribute('data-ansi-processed')) {
			replace_element(elements[i]);
		}
	}

}

function replace_element(element) {

	var url = element.getAttribute('data-ansi-src');
	var charset = (element.hasAttribute('data-ansi-charset')) ? element.getAttribute('data-ansi-charset') : 'ISO-8859-1';

	get_ansi_from_url(url, charset, function(ansi_data) {
		var canvas_element = ansi(ansi_data);

		element.parentElement.insertBefore(canvas_element, element);
		element.parentElement.removeChild(element);

		for (var i=0;i<element.attributes.length;i++) {

			var attrName = element.attributes[i].nodeName;
			var attrValue = element.attributes[i].nodeValue;

			if (attrName !== 'width' && attrName !== 'height') {
				canvas_element.setAttribute(attrName, attrValue);
			}

		}

		canvas_element.setAttribute('data-ansi-processed', 'true');

	});

}

document.addEventListener('DOMContentLoaded', replace_all);

function ansi(data, options) {

	var parser = new ansi_parser(data),
		palette = {
		    BLACK: {
		        NORMAL: [0,0,0],
		        BOLD: [104,104,104]
		    },
		    RED: {
		        NORMAL: [185,25,0],
		        BOLD: [255,110,104]
		    },
		    GREEN: {
		        NORMAL: [0,180,0],
		        BOLD: [96,250,104]
		    },
		    YELLOW: {
		        NORMAL: [186,105,0],
		        BOLD: [255,252,103]
		    },
		    BLUE: {
		        NORMAL: [2,33,184],
		        BOLD: [105,114,255]
		    },
		    MAGENTA: {
		        NORMAL: [187,44,185],
		        BOLD: [255,119,255]
		    },
		    CYAN: {
		        NORMAL: [0,183,185],
		        BOLD: [96,254,255]
		    },
		    WHITE: {
		        NORMAL: [184,184,184],
		        BOLD: [255,255,255]
		    }
		},
		colors = {
		    30: palette.BLACK, 
		    31: palette.RED,
		    32: palette.GREEN,
		    33: palette.YELLOW,
		    34: palette.BLUE,
		    35: palette.MAGENTA,
		    36: palette.CYAN,
		    37: palette.WHITE,
		    40: palette.BLACK, 
		    41: palette.RED,
		    42: palette.GREEN,
		    43: palette.YELLOW,
		    44: palette.BLUE,
		    45: palette.MAGENTA,
		    46: palette.CYAN,
		    47: palette.WHITE
		},
		cursor = {
			x: 0,
			y: 0
		},
		savedcursor = {
			x: 0,
			y: 0
		},
		columns = 80,
		lines = get_lines(),
		fg = palette.WHITE,
		bg = palette.BLACK,
		attributes = {
			BOLD: false,
			UNDERSCORE: false,
			REVERSE: false,
			CONCEALED: false
		}

	function get_lines() {

		var x = 0,
			y = 0,
			lines = 0;

		var actions = {
			'DRAW': function() {
				if (x >= columns) {
					x = 0;
					y++;
				} else {
					x++;
				}
			},
			'CARRIAGE_RETURN': function() {
				x = 0;
				y++;
			}
		}
		parser.parse(actions);
		lines = y+1;
		return lines;
	}

	var display = new textmode.display({ cols: columns, rows: lines });

    parser.parse({
        DRAW: function(code) {
            display.move(cursor.x, cursor.y).draw(code);

            if (cursor.x < (columns-1)) {
                cursor.x++;
            } else {
                cursor.x = 0;
                cursor.y++;
            }
        },
        MODE_CHANGE: function() {

            for (var i=0;i<arguments.length;i++) {
                var param = arguments[i];

                if (param === 0) { // underscore
                    for (var attribute in attributes) attributes[attribute] = false;
                    fg = palette.WHITE;
                    bg = palette.BLACK;
                    display.foreColor(fg.NORMAL);
                    display.backColor(bg.NORMAL);
                } else if (param === 1) { // bold
                    attributes.BOLD = true;
                    display.foreColor(fg.BOLD);
                } else if (param === 4) { // underscore
                } else if (param === 5) { // blink
                } else if (param === 7) { // reverse
                } else if (param === 8) { // concealed
                } else if (colors[param] !== undefined) { // color
                    if (param >= 30 && param <= 37) { // foreground
                        fg = colors[param];
                        display.foreColor(fg[(attributes.BOLD) ? 'BOLD' : 'NORMAL']);
                    } else if (param >= 40 && param <= 47) {
                        bg = colors[param];
                        display.backColor(bg.NORMAL);
                    }
                } else {
                    // caught unexpected parameter
                }

            }
        },
        MOVE_TO: function() {
            var line = (arguments[0] !== undefined) ? arguments[0] : 0;
            var column = (arguments[1] !== undefined) ? arguments[1]: 0;
            cursor.x = column;
            cursor.y = line;
            display.move(cursor.x, cursor.y);
        },
        MOVE_UP: function(amount) {
            if ((cursor.y - amount) < 0) {
                cursor.y = 0;
            } else {
                cursor.y -= amount;
            }
        },
        MOVE_DOWN: function() {

        },
        MOVE_RIGHT: function(amount) {
            cursor.x += amount;
            display.move(cursor.x, cursor.y);
        },
        MOVE_LEFT: function(amount) {
            if ((cursor.x - amount) < 0) {
                cursor.x = 0;
            } else {
                cursor.x -= amount;                    
            }
        },
        CLEAR_SCREEN: function() {
            cursor.x = 0,
            cursor.y = 0;
            display.move(cursor.x, cursor.y);

        },
        CLEAR_LINE: function() {

        },
        SAVE_POSITION: function() {
            savedcursor.x = cursor = x,
            savedcursor.y = cursor = y;
        },
        LOAD_POSITION: function() {
            cursor.x = that._savedcursor.x,
            cursor.y = that._savedcursor.y;
            display.move(cursor.x, that_cursor.y);
        },
        CARRIAGE_RETURN: function() {
            cursor.x = 0;
            cursor.y++;
            display.move(cursor.x, cursor.y);
        }
    });

	return display.canvas();

}

/**
 * ansi_parser.js
 * Parse a string for ansi control codes and execute callbacks
 *
 * Author: Josh <josh@kaiju.net>
 */
 
function ansi_parser(data) {

	this.ACTIONS = {
		'MODE_CHANGE': 109,
		'MOVE_TO': [72,102],
		'MOVE_UP': 65,
		'MOVE_DOWN': 66,
		'MOVE_RIGHT': 67,
		'MOVE_LEFT': 68,
		'REPORT_POSITION': 82,
		'SAVE_POSITION': 115,
		'LOAD_POSITION': 117,
		'CLEAR_SCREEN': 2,
		'CLEAR_LINE': 75
	}

	this.data = [];
	if (typeof data === 'string') {
	    for (var i=0;i<data.length;i++) this.data.push(data.charCodeAt(i));
	} else if (typeof ansi_data === 'array') {
	    this.data = data;
	}

}

ansi_parser.prototype.parse = function parse(hooks) {
    for (var i=0;i<this.data.length;i++) {

        if (this.data[i] === 27 && this.data[(i+1)] === 91) {
            args = '';

            for (var ci=(i+2);ci<this.data.length;ci++) {
                i = ci;
                var code = this.data[ci];

                if (code === 109) { // m: graphical mode change
                    args = args.split(';').map(Number);
                    if (typeof hooks.MODE_CHANGE === 'function') hooks.MODE_CHANGE.apply(this, args);
                    if (typeof hooks.DEBUG === 'function') hooks.DEBUG.apply(this, ['MODE_CHANGE', args]);
                    break;
                } else if (code === 72 || code === 102) { // H/f: move to
                    args = args.split(';').map(Number);
                    if (typeof hooks.MOVE_TO === 'function') hooks.MOVE_TO.apply(null, args);
                    break;
                } else if (code === 65) { // A: move up
                    args = [Number(args)];
                    if (typeof hooks.MOVE_UP === 'function') hooks.MOVE_UP.apply(null, args);
                    break;
                } else if (code === 66) { // B: move down
                    args = [Number(args)];
                    if (typeof hooks.MOVE_DOWN === 'function') hooks.MOVE_DOWN.apply(null, args);
                    break;
                } else if (code === 67) { // C: move right
                    args = [Number(args)];
                    if (typeof hooks.MOVE_RIGHT === 'function') hooks.MOVE_RIGHT.apply(null, args);
                    break;
                } else if (code === 68) { // D: move left
                    args = [Number(args)];
                    if (typeof hooks.MOVE_LEFT === 'function') hooks.MOVE_LEFT.apply(null, args);
                    break;
                } else if (code === 82) { // R: report position
                    if (typeof hooks.REPORT_POSITION === 'function') hooks.REPORT_POSITION.apply(null, args.split(';'));
                    break;
                } else if (code === 115) { // s: save position
                    if (typeof hooks.SAVE_POSITION === 'function') hooks.SAVE_POSITION.apply(null, args.split(';'));
                    break;
                } else if (code === 117) { // u: load position
                    if (typeof hooks.LOAD_POSITION === 'function') hooks.LOAD_POSITION.apply(null, args.split(';'));
                    break;
                } else if (code === 50 && this.data[(ci+1)] === 74) { // 2J: clear screen
                    i++;
                    if (typeof hooks.CLEAR_SCREEN === 'function') hooks.CLEAR_SCREEN.apply(null, args.split(';'));
                    break;
                } else if (code === 75) { // K: clear to line
                    if (typeof hooks.CLEAR_LINE === 'function') hooks.CLEAR_LINE.apply(null, args.split(';'));
                    break;
                } else if (code === 112 || code === 108 || code === 104) {
                    console.log('got char ' + code);
                    break;
                } else {
                    args += String.fromCharCode(code);
                }

            }

        } else if (this.data[i] === 10) { // linefeed
            if (typeof hooks.LINE_FEED === 'function') hooks.LINE_FEED.apply(null);
        } else if (this.data[i] === 13) { // carriage return
            if (typeof hooks.CARRIAGE_RETURN === 'function') hooks.CARRIAGE_RETURN.apply(null);
        } else { // character
            if (typeof hooks.DRAW === 'function') hooks.DRAW.apply(null, [this.data[i]]);
        }

    }
    return this;
}

/**
 * textmode.js
 * An appropriation of a text mode display using the canvas element
 *
 * Usage: var tm = new textmode.display(options);
 *
 * Author: Josh <josh@kaiju.net>
 */

var textmode = {

    characterSets: [],

    binaryString2HexString: function(binaryString) {
        var hex = ""
        for (var i=0;i<binaryString.length;i+=4) {
            hex += parseInt(binaryString.slice(i,i+4), 2).toString(16).toUpperCase();
        }
        return hex;
    },

    hexString2BinaryString: function(hexString) {
        var bin = ""
        for (var i=0;i<hexString.length;i++) {
            var chunk = parseInt("0x"+hexString[i], 16).toString(2)
            while(chunk.length < 4) chunk = "0" + chunk;
            bin += chunk
        }
        return bin;
    },

    hexString2RGBArray: function(hexString) {
        if (hexString.charAt(0) === '#') hexString = hexString.slice(1);
        var rgb = [];
        for (var i=0;i<hexString.length;i+=2) {
            rgb.push(parseInt("0x"+hexString.slice(i,i+2),16));
        }
        return rgb;
    },

    addCharacterSet: function(characterSetObject) {
        // convert hex string to binary string so we're not doing it on render
        for (var i=0;i<characterSetObject.characters.length;i++) characterSetObject.characters[i] = textmode.hexString2BinaryString(characterSetObject.characters[i]);

        textmode.characterSets.push(characterSetObject);
    },

    /**
     * Creates and returns a new textmode display
     * @constructor
     *
     * @param {int} options.cols Display width in rows. Default: 80
     * @param {int} options.rows Display height in rows. Default: 25
     * @param {string} options.characterSet Name of character set to use. Default: First loaded character set
     */
    display: function(options) {

        // constructor options
        this.options = (options === undefined) ? {} : options;
        this._cols = (options.cols === undefined) ? 80 : options.cols;
        this._rows = (options.rows === undefined) ? 25 : options.rows;
        this._characterSet = (options.characterSet === undefined) ? textmode.characterSets[0] : textmode.characterSets[options.characterSet];

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

}

/**
 * Return canvas element
 * @memberof textmode.display
 *
 * @return {HTMLElement} Canvas element
 */
textmode.display.prototype.canvas = function canvas() {
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
textmode.display.prototype.draw = function(charcode) {

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
textmode.display.prototype.move = function(col, row) {
    this._cursorX = col;
    this._cursorY = row;
    return this;
}

textmode.display.prototype.col = function col(col) {
    this._cursorX = col;
    return this;
}

textmode.display.prototype.row = function row(row) {
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
textmode.display.prototype.foreColor = function(RGBArray) {
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
textmode.display.prototype.backColor = function(RGBArray) {
    this._bgColor = RGBArray;
    return this;
}

textmode.addCharacterSet({
    name: 'cp437',
    description: 'IBM PC CP437 9x16',
    characterWidth: 9,
    characterHeight: 16,
    characters: [
        '000000000000000000000000000000000000',
        '00001F902A540A057A9940A04FC000000000',
        '00001F9FEDB7FBFD86E77FBFCFC000000000',
        '0000000006C7F3F9FCFE3E0E020000000000',
        '000000000101C1F1FC7C1C04000000000000',
        '0000000303C1E39DCEE70C06078000000000',
        '0000000303C3F3FDFE7E0C06078000000000',
        '0000000000000060783C0C00000000000000',
        'FF7FBFDFEFF7FB9D86C373BFDFEFF7FBFDFE',
        '000000000001E1988442330F000000000000',
        'FF7FBFDFEFF61A657ABD4CB0DFEFF7FBFDFE',
        '00000781C1A191E198CC66330F0000000000',
        '00000F0CC663319878183F06030000000000',
        '00000FC663F180C06030383C1C0000000000',
        '00001FCC67F3198CC66333B9DCCC00000000',
        '000000030186D8F1CE3C6D86030000000000',
        '0040301C0F07C3F9F0F07030100000000000',
        '00010181C1E1F3F87C1E0701804000000000',
        '0000060787E0C060307E1E06000000000000',
        '0000198CC6633198CC6600198CC000000000',
        '00001FDB6DB6D9EC361B0D86C36000000000',
        '003E318C038363198C6C1C0318C7C0000000',
        '000000000000000000FE7F3F9FC000000000',
        '0000060787E0C060307E1E060FC000000000',
        '0000060787E0C06030180C06030000000000',
        '000006030180C06030183F0F030000000000',
        '000000000000C031FC0C0C00000000000000',
        '0000000000018181FC601800000000000000',
        '000000000000030180C07F00000000000000',
        '00000000000141B1FC6C1400000000000000',
        '000000000101C0E0F87C7F3F800000000000',
        '000000000FE7F1F0F8381C04000000000000',
        '000000000000000000000000000000000000',
        '0000060783C1E06030180006030000000000',
        '0033198CC240000000000000000000000000',
        '0000000D86C7F1B0D86C7F1B0D8000000000',
        '180C1F18CC2601F00C0643318F8180C00000',
        '000000000C2630303030303190C000000000',
        '00000E0D86C1C1D9B8CC66330EC000000000',
        '00180C060600000000000000000000000000',
        '00000303030180C060301806018000000000',
        '00000C0300C06030180C0606060000000000',
        '00000000000330F1FE3C3300000000000000',
        '000000000000C060FC180C00000000000000',
        '000000000000000000000C06030300000000',
        '0000000000000001FC000000000000000000',
        '000000000000000000000006030000000000',
        '000000000020303030303030100000000000',
        '00000E0D8C663359ACC6631B070000000000',
        '000006070780C06030180C060FC000000000',
        '00001F18C0606060606060319FC000000000',
        '00001F18C06030F00C0603318F8000000000',
        '0000030383C36331FC0C060303C000000000',
        '00003F980C0603F00C0603318F8000000000',
        '00000E0C0C0603F18CC663318F8000000000',
        '00003F98C06030303030180C060000000000',
        '00001F18CC6631F18CC663318F8000000000',
        '00001F18CC6631F80C0603030F0000000000',
        '000000000180C00000000C06000000000000',
        '000000000180C00000000C06060000000000',
        '00000000C0C0C0C0C0300C0300C000000000',
        '000000000003F000007E0000000000000000',
        '0000000C0300C0300C0C0C0C0C0000000000',
        '00001F18CC60606030180006030000000000',
        '0000000F8C663379BCDE6E300F8000000000',
        '0000040706C63319FCC6633198C000000000',
        '00003F0CC66331F0CC6633199F8000000000',
        '00000F0CCC26030180C06119878000000000',
        '00003E0D86633198CC66331B1F0000000000',
        '00003F8CC62341E0D06031199FC000000000',
        '00003F8CC62341E0D06030181E0000000000',
        '00000F0CCC260301BCC66319874000000000',
        '00003198CC6633F98CC6633198C000000000',
        '00000F030180C06030180C06078000000000',
        '0000078180C0603018CC66330F0000000000',
        '0000398CC66361E0F06C33199CC000000000',
        '00003C0C06030180C06031199FC000000000',
        '0000319DCFE7F3598CC6633198C000000000',
        '0000319CCF67F3799CC6633198C000000000',
        '00001F18CC6633198CC663318F8000000000',
        '00003F0CC66331F0C06030181E0000000000',
        '00001F18CC6633198CC66B378F80C0700000',
        '00003F0CC66331F0D86633199CC000000000',
        '00001F18CC6300E0180663318F8000000000',
        '00001F8FC5A0C06030180C06078000000000',
        '00003198CC6633198CC663318F8000000000',
        '00003198CC6633198CC6360E020000000000',
        '00003198CC663359ACD67F3B8D8000000000',
        '00003198C6C3E0E0707C363198C000000000',
        '0000198CC66330F030180C06078000000000',
        '00003F98C8606060606061319FC000000000',
        '00000F06030180C06030180C078000000000',
        '000000100C0701C0701C0701804000000000',
        '00000F0180C06030180C0603078000000000',
        '101C1B18C000000000000000000000000000',
        '000000000000000000000000000007F80000',
        '001806018000000000000000000000000000',
        '000000000003C030F8CC66330EC000000000',
        '0000380C0603C1B0CC6633198F8000000000',
        '000000000003E31980C060318F8000000000',
        '0000070180C1E1B198CC66330EC000000000',
        '000000000003E319FCC060318F8000000000',
        '00000706C32181E06030180C0F0000000000',
        '000000000003B33198CC66330F80C661E000',
        '0000380C060361D8CC6633199CC000000000',
        '000006030001C06030180C06078000000000',
        '00000180C00070180C06030180C66330F000',
        '0000380C060331B0F07836199CC000000000',
        '00000E030180C06030180C06078000000000',
        '00000000000763F9ACD66B3598C000000000',
        '000000000006E198CC6633198CC000000000',
        '000000000003E3198CC663318F8000000000',
        '000000000006E198CC6633198F860303C000',
        '000000000003B33198CC66330F80C0607800',
        '000000000006E1D8CC6030181E0000000000',
        '000000000003E318C03806318F8000000000',
        '000004060307E0C06030180D838000000000',
        '000000000006633198CC66330EC000000000',
        '00000000000633198CC6631B070000000000',
        '0000000000063319ACD66B3F8D8000000000',
        '00000000000631B070381C1B18C000000000',
        '00000000000633198CC663318FC06063E000',
        '000000000007F330303030319FC000000000',
        '000003830180C1C030180C0601C000000000',
        '000006030180C06030180C06030000000000',
        '00001C030180C03830180C060E0000000000',
        '003B37000000000000000000000000000000',
        '000000000101C1B18CC6633F800000000000',
        '00000F0CCC26030180C06119878183800000',
        '000033000006633198CC66330EC000000000',
        '000606060003E319FCC060318F8000000000',
        '00080E0D8003C030F8CC66330EC000000000',
        '000033000003C030F8CC66330EC000000000',
        '00300C030003C030F8CC66330EC000000000',
        '001C1B070003C030F8CC66330EC000000000',
        '000000000003E31980C060318F8183800000',
        '00080E0D8003E319FCC060318F8000000000',
        '000031800003E319FCC060318F8000000000',
        '00300C030003E319FCC060318F8000000000',
        '000019800001C06030180C06078000000000',
        '000C0F0CC001C06030180C06078000000000',
        '00300C030001C06030180C06078000000000',
        '00630002038363198CFE633198C000000000',
        '38360E0203836319FCC6633198C000000000',
        '0C0C001FC66311A0F06831199FC000000000',
        '00000000000760D86C7E6C360DC000000000',
        '00000F8D8CC663F998CC663319C000000000',
        '00080E0D8003E3198CC663318F8000000000',
        '000031800003E3198CC663318F8000000000',
        '00300C030003E3198CC663318F8000000000',
        '00181E198006633198CC66330EC000000000',
        '00300C030006633198CC66330EC000000000',
        '00003180000633198CC663318FC06061E000',
        '0063000F8C6633198CC663318F8000000000',
        '00630018CC6633198CC663318F8000000000',
        '000C060F8C66030180C63E06030000000000',
        '001C1B0C86078180C06030399F8000000000',
        '0000198CC3C0C1F8307E0C06030000000000',
        '007C33198F862331BCCC663318C000000000',
        '000706C30180C1F830180C360E0000000000',
        '000C0C0C0003C030F8CC66330EC000000000',
        '000606060001C06030180C06078000000000',
        '000C0C0C0003E3198CC663318F8000000000',
        '000C0C0C0006633198CC66330EC000000000',
        '00001D9B8006E198CC6633198CC000000000',
        '766E0018CE67B3F9BCCE633198C000000000',
        '00000F0D86C1F000FC000000000000000000',
        '00000E0D86C1C000F8000000000000000000',
        '00000C06000180C0C0C063318F8000000000',
        '00000000000003F980C06030000000000000',
        '00000000000003F80C060301800000000000',
        '0030380C4663606060606E21818181F00000',
        '0030380C466360606066672687E060300000',
        '000006030000C060303C1E0F030000000000',
        '000000000001B1B1B06C1B00000000000000',
        '000000000006C1B06C6C6C00000000000000',
        '112204488112204488112204488112204488',
        '555515554555515554555515554555515554',
        'DD3BB74EEDD3BB74EEDD3BB74EEDD3BB74EE',
        '180C06030180C06030180C06030180C06030',
        '180C06030180C061F0180C06030180C06030',
        '180C06030187C061F0180C06030180C06030',
        '361B0D86C361B0D9EC361B0D86C361B0D86C',
        '0000000000000001FC361B0D86C361B0D86C',
        '000000000007C061F0180C06030180C06030',
        '361B0D86C367B019EC361B0D86C361B0D86C',
        '361B0D86C361B0D86C361B0D86C361B0D86C',
        '000000000007F019EC361B0D86C361B0D86C',
        '361B0D86C367B019FC000000000000000000',
        '361B0D86C361B0D9FC000000000000000000',
        '180C06030187C061F0000000000000000000',
        '0000000000000001F0180C06030180C06030',
        '180C06030180C0603F000000000000000000',
        '180C06030180C061FF000000000000000000',
        '0000000000000001FF180C06030180C06030',
        '180C06030180C0603F180C06030180C06030',
        '0000000000000001FF000000000000000000',
        '180C06030180C061FF180C06030180C06030',
        '180C06030180FC603F180C06030180C06030',
        '361B0D86C361B0D86F361B0D86C361B0D86C',
        '361B0D86C361BCC07F000000000000000000',
        '000000000001FCC06F361B0D86C361B0D86C',
        '361B0D86C367BC01FF000000000000000000',
        '000000000007FC01EF361B0D86C361B0D86C',
        '361B0D86C361BCC06F361B0D86C361B0D86C',
        '000000000007FC01FF000000000000000000',
        '361B0D86C367BC01EF361B0D86C361B0D86C',
        '180C06030187FC01FF000000000000000000',
        '361B0D86C361B0D9FF000000000000000000',
        '000000000007FC01FF180C06030180C06030',
        '0000000000000001FF361B0D86C361B0D86C',
        '361B0D86C361B0D87F000000000000000000',
        '180C06030180FC603F000000000000000000',
        '000000000000FC603F180C06030180C06030',
        '00000000000000007F361B0D86C361B0D86C',
        '361B0D86C361B0D9FF361B0D86C361B0D86C',
        '180C06030187FC61FF180C06030180C06030',
        '180C06030180C061F0000000000000000000',
        '00000000000000003F180C06030180C06030',
        'FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF',
        '0000000000000001FFFFFFFFFFFFFFFFFFFF',
        'F0783C1E0F0783C1E0F0783C1E0F0783C1E0',
        '0F87C3E1F0F87C3E1F0F87C3E1F0F87C3E1F',
        'FFFFFFFFFFFFFFFE00000000000000000000',
        '000000000003B371B0D86C370EC000000000',
        '00001E198CC6636198C66331998000000000',
        '00003F98CC66030180C06030180000000000',
        '000000000007F1B0D86C361B0D8000000000',
        '00003F98C6018060303030319FC000000000',
        '000000000003F361B0D86C360E0000000000',
        '0000000000033198CC6633198F8603030000',
        '000000000766E06030180C06030000000000',
        '00001F8303C33198CC661E060FC000000000',
        '00000E0D8C6633F98CC6631B070000000000',
        '00000E0D8C663318D86C361B1DC000000000',
        '00000786018060F8CC663319878000000000',
        '000000000003F36DB6DB3F00000000000000',
        '000000006063F36DB6F33F18180000000000',
        '00000706060301F0C060300C038000000000',
        '0000000F8C6633198CC6633198C000000000',
        '000000000FE00001FC00003F800000000000',
        '000000000180C1F8301800000FC000000000',
        '0000000601806018181818000FC000000000',
        '0000000181818180601806000FC000000000',
        '0000038361B0C06030180C06030180C06030',
        '180C06030180C06030186C361B0700000000',
        '000000000000C000FC000C00000000000000',
        '000000000003B37000766E00000000000000',
        '001C1B0D8380000000000000000000000000',
        '000000000000000030180000000000000000',
        '000000000000000030000000000000000000',
        '0007830180C06031D86C360F038000000000',
        '00360D86C361B0D800000000000000000000',
        '001E1981818191F800000000000000000000',
        '0000000007E3F1F8FC7E3F1F800000000000',
        '000000000000000000000000000000000000'
    ]
});})()