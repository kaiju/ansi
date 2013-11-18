/**
 * ansi.js
 * Load & parse an ANSI file
 *
 * Author: Josh <josh@kaiju.net>
 */

/**
 * @constructor
 *
 * @param {string|object} options.ansi_data ANSI to display
 * @param {string} options.url URL to file to display
 */
function ansi(ansi_data, callbacks) {

    this.data = [];
    this.callbacks = (callbacks !== undefined && typeof callbacks === 'object') ? callbacks : {};

    this.palette = {
        NORMAL: {
            BLACK: [0,0,0],
            RED: [187,25,0],
            GREEN: [0,180,0],
            YELLOW: [186,105,0],
            BLUE: [2,33,184],
            MAGENTA: [187,44,185],
            CYAN: [0,183,185],
            WHITE: [184,184,184]
        },
        BOLD: {
            BLACK: [104,104,104],
            RED: [255,110,104],
            GREEN: [96,250,104],
            YELLOW: [255,252,103],
            BLUE: [105,114,255],
            MAGENTA: [255,119,255],
            CYAN: [96,254,255],
            WHITE: [255,255,255]
        }
    }

    this.fg_colors = {
        30: 'BLACK',
        31: 'RED',
        32: 'GREEN',
        33: 'YELLOW',
        34: 'BLUE',
        35: 'MAGENTA',
        36: 'CYAN',
        37: 'WHITE'
    }

    this.bg_colors = {
        40: 'BLACK',
        41: 'RED',
        42: 'GREEN',
        43: 'YELLOW',
        44: 'BLUE',
        45: 'MAGENTA',
        46: 'CYAN',
        47: 'WHITE'
    }

    if (ansi_data !== undefined) this.load(ansi_data);


}

/**
 * Load an ANSI string into the internal data structure
 * @memberOf ansi
 * @param {string} string ANSI String
 */
ansi.prototype.load = function load(ansi_data) {
    this.data = [];
    if (typeof ansi_data === 'string') {
        for (var i=0;i<ansi_data.length;i++) this.data.push(ansi_data.charCodeAt(i));
    } else {
        this.data = ansi_data;
    }
    return this;
}

/**
 * Define a callback to run on a specific control code
 */
ansi.prototype.on = function on(action, callback) {
    this.callbacks[action] = callback;
    return this;
}

/**
 * Clear a callback
 */
ansi.prototype.off = function off() {
    this.callbacks = {};
    return this;
}

ansi.prototype.dump = function dump() {
    return JSON.stringify(this.data);
}

ansi.prototype._get_code = function _get_code(index) {

}

/**
 * Parse loaded ANSI data and fire callbacks
 */
ansi.prototype.parse = function parse() {
    for (var i=0;i<this.data.length;i++) {

        if (this.data[i] === 27 && this.data[(i+1)] === 91) {
            args = '';

            for (var ci=(i+2);ci<this.data.length;ci++) {
                i = ci;
                var code = this.data[ci];

                if (code === 109) { // m: graphical mode change
                    args = args.split(';').map(Number);
                    if (typeof this.callbacks.MODE_CHANGE === 'function') this.callbacks.MODE_CHANGE.apply(this, args);
                    if (typeof this.callbacks.DEBUG === 'function') this.callbacks.DEBUG.apply(this, ['MODE_CHANGE', args]);
                    break;
                } else if (code === 72 || code === 102) { // H/f: move to
                    args = args.split(';').map(Number);
                    if (typeof this.callbacks.MOVE_TO === 'function') this.callbacks.MOVE_TO.apply(null, args);
                    break;
                } else if (code === 65) { // A: move up
                    args = [Number(args)];
                    if (typeof this.callbacks.MOVE_UP === 'function') this.callbacks.MOVE_UP.apply(null, args);
                    break;
                } else if (code === 66) { // B: move down
                    args = [Number(args)];
                    if (typeof this.callbacks.MOVE_DOWN === 'function') this.callbacks.MOVE_DONW.apply(null, args);
                    break;
                } else if (code === 67) { // C: move right
                    args = [Number(args)];
                    if (typeof this.callbacks.MOVE_RIGHT === 'function') this.callbacks.MOVE_RIGHT.apply(null, args);
                    break;
                } else if (code === 68) { // D: move left
                    args = [Number(args)];
                    if (typeof this.callbacks.MOVE_LEFT === 'function') this.callbacks.MOVE_LEFT.apply(null, args);
                    break;
                } else if (code === 82) { // R: report position
                    if (typeof this.callbacks.REPORT_POSITION === 'function') this.callbacks.REPORT_POSITION.apply(null, args.split(';'));
                    break;
                } else if (code === 115) { // s: save position
                    if (typeof this.callbacks.SAVE_POSITION === 'function') this.callbacks.SAVE_POSITION.apply(null, args.split(';'));
                    break;
                } else if (code === 117) { // u: load position
                    if (typeof this.callbacks.LOAD_POSITION === 'function') this.callbacks.LOAD_POSITION.apply(null, args.split(';'));
                    break;
                } else if (code === 50 && this.data[(ci+1)] === 74) { // 2J: clear screen
                    if (typeof this.callbacks.CLEAR_SCREEN === 'function') this.callbacks.CLEAR_SCREEN.apply(null, args.split(';'));
                    break;
                } else if (code === 75) { // K: clear to line
                    if (typeof this.callbacks.CLEAR_LINE === 'function') this.callbacks.CLEAR_LINE.apply(null, args.split(';'));
                    break;
                } else if (code === 112 || code === 108 || code === 104) {
                    console.log('got char ' + code);
                    break;
                } else {
                    args += String.fromCharCode(code);
                }

            }

        } else if (this.data[i] === 10) { // linefeed
            if (typeof this.callbacks.LINE_FEED === 'function') this.callbacks.LINE_FEED.apply(null);
        } else if (this.data[i] === 13) { // carriage return
            if (typeof this.callbacks.CARRIAGE_RETURN === 'function') this.callbacks.CARRIAGE_RETURN.apply(null);
        } else { // character
            if (typeof this.callbacks.DRAW === 'function') this.callbacks.DRAW.apply(null, [this.data[i]]);
        }

    }
    return this;
}
