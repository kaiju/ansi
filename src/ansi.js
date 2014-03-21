document.addEventListener('DOMContentLoaded', function() {
	var ansi_elements = document.getElementsByTagName('img');
	var re = new RegExp('\.ans$', 'i');
	for (var i=0;i<ansi_elements.length;i++) {
		if (ansi_elements[i].src.match(re)) {
			replace_element(ansi_elements[i]);
		}
	}
});

function replace_element(element) {

	var options = {
		'charset': (element.getAttribute('data-ansi-charset')) ? element.getAttribute('data-ansi-charset') : 'ISO-8859-1'
	}

	// grab the ansi file
	var request = new XMLHttpRequest();
	request.open('GET', element.src, true);
	request.overrideMimeType('text/plain; charset='+options.charset);
	request.onload = function(response) {
		if (request.status >= 200 && request.status < 400) {

			var c = ansi(request.responseText);

			element.parentElement.insertBefore(c, element);
			element.parentElement.removeChild(element);
		}
	}

	request.onerror = function(error) {

	}

	request.send();

}

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

	var tm = new textmode.display({ cols: columns, rows: lines });

    parser.parse({
        DRAW: function(code) {
            tm.move(cursor.x, cursor.y).draw(code);

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
                    tm.foreColor(fg.NORMAL);
                    tm.backColor(bg.NORMAL);
                } else if (param === 1) { // bold
                    attributes.BOLD = true;
                    tm.foreColor(fg.BOLD);
                } else if (param === 4) { // underscore
                } else if (param === 5) { // blink
                } else if (param === 7) { // reverse
                } else if (param === 8) { // concealed
                } else if (colors[param] !== undefined) { // color
                    if (param >= 30 && param <= 37) { // foreground
                        fg = colors[param];
                        tm.foreColor(fg[(attributes.BOLD) ? 'BOLD' : 'NORMAL']);
                    } else if (param >= 40 && param <= 47) {
                        bg = colors[param];
                        tm.backColor(bg.NORMAL);
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
            tm.move(cursor.x, cursor.y);
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
            tm.move(cursor.x, cursor.y);
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
            tm.move(cursor.x, cursor.y);

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
            tm.move(cursor.x, that_cursor.y);
        },
        CARRIAGE_RETURN: function() {
            cursor.x = 0;
            cursor.y++;
            tm.move(cursor.x, cursor.y);
        }
    });


	return tm.canvas();

}

