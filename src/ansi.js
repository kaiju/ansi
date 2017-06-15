import ansi_parser from './ansi_parser.js';
import textmode from './textmode.js';
import cp437 from './charactersets/cp437.js';

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
            'MOVE_RIGHT': function(amount) {
                x += amount;
            },
			'CARRIAGE_RETURN': function() {
				x = 0;
				y++;
			},
            'EOF': function() {
                x = 0;
                y++;
            }
		}
		parser.parse(actions);
		lines = y+1;
		return lines;
	}

	var display = new textmode({ cols: columns, rows: lines, characterSet: cp437 });

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
