/**
 * ansi.js
 * Load & parse an ANSI file
 *
 * Author: Josh <josh@kaiju.net>
 *
 * TODO:
 * Options - Carriage Return or Line Feed
 * Options - iCE color support
 */


function ansi(ansi_data, options) {

    this.options = (options !== undefined) ? options : {};

    this.palette = {
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
    }

    this._colors = {
        30: this.palette.BLACK, 
        31: this.palette.RED,
        32: this.palette.GREEN,
        33: this.palette.YELLOW,
        34: this.palette.BLUE,
        35: this.palette.MAGENTA,
        36: this.palette.CYAN,
        37: this.palette.WHITE,
        40: this.palette.BLACK, 
        41: this.palette.RED,
        42: this.palette.GREEN,
        43: this.palette.YELLOW,
        44: this.palette.BLUE,
        45: this.palette.MAGENTA,
        46: this.palette.CYAN,
        47: this.palette.WHITE
    }


    this._cursor = {x:0,y:0},
    this._savedcursor = {x:0,y:0},
    this._parser = new this.parser(ansi_data),
    this._columns = 80,
    this._rows = this.get_lines(),
    this._fg = this.palette.WHITE,
    this._bg = this.palette.BLACK,
    this._attributes = {
            BOLD: false,
            UNDERSCORE: false,
            REVERSE: false,
            CONCEALED: false
        };

}

ansi.prototype.get_lines = function get_lines() {
    var that = this;
    this.rewind();

    this._parser.parse({
        CARRIAGE_RETURN: function() {
            that._cursor.x = 0,
            that._cursor.y++;
        },
        DRAW: function() {
            if (that._cursor.x >= that._columns) {
                that._cursor.x = 0,
                that._cursor.y++;
            } else {
                that._cursor.x++;
            }
        }
    });
    var lines = (this._cursor.y+1);
    this.rewind();
    return lines;
}

ansi.prototype.rewind = function rewind() {
    this._cursor.x = 0,
    this._cursor.y = 0;
}

ansi.prototype.display = function display() {

    var that = this;
    this.rewind();

    tm = new textmode.display({ cols: this._columns, rows: this._rows });

    this._parser.parse({
        DRAW: function(code) {
            tm.move(that._cursor.x, that._cursor.y).draw(code);

            if (that._cursor.x < (that._columns-1)) {
                that._cursor.x++;
            } else {
                that._cursor.x = 0;
                that._cursor.y++;
            }
        },
        MODE_CHANGE: function() {

            for (var i=0;i<arguments.length;i++) {
                var param = arguments[i];

                if (param === 0) { // underscore
                    for (var attribute in that._attributes) that._attributes[attribute] = false;
                    that._fg = that.palette.WHITE;
                    that._bg = that.palette.BLACK;
                    tm.foreColor(that._fg.NORMAL);
                    tm.backColor(that._bg.NORMAL);
                } else if (param === 1) { // bold
                    that._attributes.BOLD = true;
                    tm.foreColor(that._fg.BOLD);
                } else if (param === 4) { // underscore
                } else if (param === 5) { // blink
                } else if (param === 7) { // reverse
                } else if (param === 8) { // concealed
                } else if (that._colors[param] !== undefined) { // color
                    if (param >= 30 && param <= 37) { // foreground
                        that._fg = that._colors[param];
                        tm.foreColor(that._fg[(that._attributes.BOLD) ? 'BOLD' : 'NORMAL']);
                    } else if (param >= 40 && param <= 47) {
                        that._bg = that._colors[param];
                        tm.backColor(that._bg.NORMAL);
                    }
                } else {
                    // caught unexpected parameter
                }

            }
        },
        MOVE_TO: function() {
            var line = (arguments[0] !== undefined) ? arguments[0] : 0;
            var column = (arguments[1] !== undefined) ? arguments[1]: 0;
            that._cursor.x = column;
            that._cursor.y = line;
            tm.move(that._cursor.x, that._cursor.y);
        },
        MOVE_UP: function(amount) {
            if ((that._cursor.y - amount) < 0) {
                that._cursor.y = 0;
            } else {
                that._cursor.y -= amount;
            }
        },
        MOVE_DOWN: function() {

        },
        MOVE_RIGHT: function(amount) {
            that._cursor.x += amount;
            tm.move(that._cursor.x, that._cursor.y);
        },
        MOVE_LEFT: function(amount) {
            if ((that._cursor.x - amount) < 0) {
                that._cursor.x = 0;
            } else {
                that._cursor.x -= amount;                    
            }
        },
        CLEAR_SCREEN: function() {
            that._cursor.x = 0,
            that._cursor.y = 0;
            tm.move(that._cursor.x, that._cursor.y);

        },
        CLEAR_LINE: function() {

        },
        SAVE_POSITION: function() {
            that._savedcursor.x = that._cursor = x,
            that._savedcursor.y = that._cursor = y;
        },
        LOAD_POSITION: function() {
            that._cursor.x = that._savedcursor.x,
            that._cursor.y = that._savedcursor.y;
            tm.move(that._cursor.x, that_cursor.y);
        },
        CARRIAGE_RETURN: function() {
            that._cursor.x = 0;
            that._cursor.y++;
            tm.move(that._cursor.x, that._cursor.y);
        }
    });

}


ansi.prototype.parser = function parser(ansi_data) {

    this.load(ansi_data);
    //this.hooks = (hooks !== undefined && typeof hooks == 'object') ? hooks : {};

}

ansi.prototype.parser.prototype.load = function load(ansi_data) {
    this.data = [];
    if (typeof ansi_data === 'string') {
        for (var i=0;i<ansi_data.length;i++) this.data.push(ansi_data.charCodeAt(i));
    } else if (typeof ansi_data === 'array') {
        this.data = ansi_data;
    }
}

ansi.prototype.parser.prototype.parse = function parse(hooks) {
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

