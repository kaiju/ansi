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
