/**
 * Parse a string for ansi control codes and execute callbacks
 *
 * Author: Josh Mast <josh@mast.zone>
 */

const LF: number = 10; // Line Feed
const CR: number = 13; // Carriage Return
const EOF: number = 26; // DOS end of file

const CUU: number = 65; // Cursor up
const CUD: number = 66; // Cursor down
const CUF: number = 67; // Cursor forward
const CUB: number = 68; // Cursor back
const CUP: number = 72; // Cursor position
const SGR: number = 109; // Select Graphic Rendition (i.e. mode change)
const ED: number = 74; // Erase in display
const EL: number = 75; // Erase line
const HVP: number = 102; // Horizontal vertical position
const SCP: number = 115; // Save cursor position
const RCP: number = 117; // Restore cursor position

export interface parserCallbacks {
  CHAR?(code: number): void;
  NEWLINE?(): void;
  EOF?(footer: Uint8Array<ArrayBuffer>): void;

  // CSI callbacks
  CUR_UP?(n: number): void;
  CUR_DOWN?(n: number): void;
  CUR_FORWARD?(n: number): void;
  CUR_BACK?(n: number): void;
  CUR_POS?(r: number, c: number): void;
  CHAR_MODE?(...params: number[]): void;
  ERASE_DISPLAY?(n: number): void;
  ERASE_LINE?(n: number): void;
  SAVE_CUR?(): void;
  RESTORE_CUR?(): void;
}

export default class ansi_parser {
  data: Uint8Array<ArrayBuffer>;

  columns: number;
  rows: number = 0;

  // state
  fgColor: number = 37;
  bgColor: number = 40;

  curX: number = 0;
  _curY: number = 0;

  get curY() {
    return this._curY;
  }

  set curY(v) {
    this._curY = v;
    // Count total rows
    this.rows = Math.max(this.rows, this._curY);
  }

  scurX: number = 0;
  scurY: number = 0;

  attributes = {
    BOLD: false,
    UNDERLINE: false,
    REVERSE: false,
  };

  constructor(data: ArrayBuffer, columns: number = 80) {
    this.data = new Uint8Array(data);

    if (columns) this.columns = columns;
  }

  defaults() {
    this.fgColor = 37;
    this.bgColor = 40;
    this.rows = 0;
    this.curX = 0;
    this.curY = 0;
    this.scurX = 0;
    this.scurY = 0;
    this.attributes = {
      BOLD: false,
      UNDERLINE: false,
      REVERSE: false,
    };
  }

  *parse(fn: parserCallbacks) {
    this.defaults();
    for (let i = 0; i < this.data.length; i++) {
      // Iterate our bytes

      if (this.data[i] === 27 && this.data[i + 1] === 91) {
        // Start of Control Sequence

        let args: string = "";

        for (let ci = i + 2; ci < this.data.length; ci++) {
          // iterate over bytes until our final byte
          i = ci;
          if (this.data[ci] >= 64 && this.data[ci] <= 126) {
            // final byte

            switch (this.data[ci]) {
              case CUU: {
                const c = Number(args) || 1;
                this.curY = Math.max(0, this.curY - c);
                fn.CUR_UP?.(c);
                break;
              }
              case CUD: {
                const c = Number(args) || 1;
                this.curY += c;
                fn.CUR_DOWN?.(c);
                break;
              }
              case CUF: {
                const c = Number(args) || 1;
                this.curX = Math.min(this.columns - 1, this.curX + c);
                fn.CUR_FORWARD?.(c);
                break;
              }
              case CUB: {
                const c = Number(args) || 1;
                this.curX = Math.max(0, this.curX - c);
                fn.CUR_BACK?.(c);
                break;
              }
              case CUP:
              case HVP: {
                const [row, col] = args.split(";").map(Number);
                // move x/y is 1 based and defaults to 1
                this.curX = (col || 1) - 1;
                this.curY = (row || 1) - 1;
                fn.CUR_POS?.(row, col);
                break;
              }
              case SGR: {
                const params: number[] = args.split(";").map(Number);

                for (let i = 0; i < params.length; i++) {
                  const p = params[i];

                  // colors
                  if (p >= 30 && p <= 37) {
                    this.fgColor = p;
                    continue;
                  }
                  if (p >= 40 && p <= 47) {
                    this.bgColor = p;
                    continue;
                  }

                  switch (p) {
                    case 0: // reset
                      for (const attribute in this.attributes)
                        this.attributes[attribute] = false;
                      this.fgColor = 37;
                      this.bgColor = 40;
                      break;
                    case 1:
                      this.attributes.BOLD = true;
                      break;
                    case 4:
                      this.attributes.UNDERLINE = true;
                      break;
                    case 7:
                      this.attributes.REVERSE = true;
                      break;
                  }
                }

                fn.CHAR_MODE?.(...params);
                break;
              }
              case ED: {
                const n: number = Number(args) || 0;
                switch (n) {
                  case 0: // clear from cursor to end of screen
                    break;
                  case 1: // clear from cursor to beginning of screen
                    break;
                  case 2: // clear entire screen, reset cursor in ANSI.SYS
                    this.curX = 0;
                    this.curY = 0;
                    break;
                  case 3: // clear screen and scrollback buffer (x-term specific)
                    break;
                }
                fn.ERASE_DISPLAY?.(n);
                break;
              }
              case EL:
                fn.ERASE_LINE?.(Number(args) || 0);
                break;
              case SCP:
                this.scurX = this.curX;
                this.scurY = this.curY;
                fn.SAVE_CUR?.();
                break;
              case RCP:
                this.curX = this.scurX;
                this.curY = this.scurY;
                fn.RESTORE_CUR?.();
                break;
            }
            break;
          } else {
            // Collect CSI arguments
            args += String.fromCharCode(this.data[ci]);
          }
        }
      } else if (this.data[i] === LF) {
        // Line Feed
        // TODO- figure out a more complete newline strategy
      } else if (this.data[i] === CR) {
        // Carriage Return
        this.curX = 0;
        this.curY++;
        fn.NEWLINE?.();
      } else if (this.data[i] === EOF) {
        // EOF
        const footer = this.data.subarray(i + 1);
        fn.EOF?.(footer);
        break;
      } else {
        // Character
        fn.CHAR?.(this.data[i]);

        // Advance our cursor
        if (this.curX < this.columns - 1) {
          this.curX++;
        } else {
          this.curX = 0;
          this.curY++;
        }
      }
      yield i + 1;
    }
    return this.data.byteLength;
  }
}
