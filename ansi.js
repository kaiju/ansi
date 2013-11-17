/**
 * ansi.js
 * Load & parse an ANSI file
 *
 * Author: Josh <josh@kaiju.net>
 */

/**
 * @constructor
 *
 * @param {string} options.string String to display
 * @param {string} options.url URL to file to display
 */
function ansi(string, callbacks) {
     this.data = [];
     this.callbacks = (callbacks !== undefined && typeof callbacks === 'object') ? callbacks : {};
     if (string !== undefined) this.load(string);
}

/**
 * Load an ANSI string into the internal data structure
 * @memberOf ansi
 * @param {string} string ANSI String
 */
ansi.prototype.load = function load(string) {
    this.data = [];
    for (var i=0;i<string.length;i++) this.data.push({ code: string.charCodeAt(i), char: string.charAt(i) });
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

/**
 * Parse loaded ANSI data and fire callbacks
 */
ansi.prototype.parse = function parse() {
    for (var i=0;i<this.data.length;i++) {

        if (this.data[i].code === 27 && this.data[(i+1)].code === 91) {
            args = '';

            for (var ci=(i+2);ci<this.data.length;ci++) {
                i = ci;
                var char = this.data[ci].char;
                if (char === 'm') { // graphical mode change
                    if (typeof this.callbacks.MODE_CHANGE === 'function') this.callbacks.MODE_CHANGE.apply(null, args.split(';'));
                    break;
                } else if (char === 'H' || char === 'f') { // move to
                    if (typeof this.callbacks.MOVE_TO === 'function') this.callbacks.MOVE_TO.apply(null, args.split(';'));
                    break;
                } else if (char === 'A') { // move up
                    if (typeof this.callbacks.MOVE_UP === 'function') this.callbacks.MOVE_UP.apply(null, args.split(';'));
                    break;
                } else if (char === 'B') { // move down
                    if (typeof this.callbacks.MOVE_DOWN === 'function') this.callbacks.MOVE_DONW.apply(null, args.split(';'));
                    break;
                } else if (char === 'C') { // move right
                    if (typeof this.callbacks.MOVE_RIGHT === 'function') this.callbacks.MOVE_RIGHT.apply(null, args.split(';'));
                    break;
                } else if (char === 'D') { // move left
                    if (typeof this.callbacks.MOVE_LEFT === 'function') this.callbacks.MOVE_LEFT.apply(null, args.split(';'));
                    break;
                } else if (char === 'R') { // report position ???
                    if (typeof this.callbacks.REPORT_POSITION === 'function') this.callbacks.REPORT_POSITION.apply(null, args.split(';'));
                    break;
                } else if (char === 's') { // save position
                    if (typeof this.callbacks.SAVE_POSITION === 'function') this.callbacks.SAVE_POSITION.apply(null, args.split(';'));
                    break;
                } else if (char === 'u') { // load position
                    if (typeof this.callbacks.LOAD_POSITION === 'function') this.callbacks.LOAD_POSITION.apply(null, args.split(';'));
                    break;
                } else if (char === '2' && this.data[(ci+1)].char === 'J') { // clear screen
                    if (typeof this.callbacks.CLEAR_SCREEN === 'function') this.callbacks.CLEAR_SCREEN.apply(null, args.split(';'));
                    break;
                } else if (char === 'K') { // clear to line
                    if (typeof this.callbacks.CLEAR_LINE === 'function') this.callbacks.CLEAR_LINE.apply(null, args.split(';'));
                    break;
                } else {
                    args += char;
                }

            }

        } else if (this.data[i].code === 10) { // linefeed
            if (typeof this.callbacks.LINE_FEED === 'function') this.callbacks.LINE_FEED.apply(null);
        } else if (this.data[i].code === 13) { // carriage return
            if (typeof this.callbacks.CARRIAGE_RETURN === 'function') this.callbacks.CARRIAGE_RETURN.apply(null);
        } else { // character
            if (typeof this.callbacks.DRAW === 'function') this.callbacks.DRAW.apply(null, this.data[i]);
        }

    }
    return this;
}
