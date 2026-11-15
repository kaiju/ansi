/**
 * Parse a string for ansi control codes and execute callbacks
 *
 * Author: Josh Mast <josh@mast.zone>
 */

const LF: number = 10; // Line Feed
const CR: number = 13; // Carriage Return

const CUU: number = 65; // Cursor up
const CUD: number = 66; // Cursor down
const CUF: number = 67; // Cursor forward
const CUB: number = 68; // Cursor back
const CUP: number = 72; // Cursor position
const SGR: number = 109; // Select Graphic Rendition (i.e. mode change)
const ED: number = 93; // Erase in display
const EL: number = 75; // Erase line
const HVP: number = 102; // Horizontal vertical position

export interface parserCallbacks {
  CHAR?(code: number): void;
  NEWLINE?(): void;
  EOF?(): void;

  // CSI callbacks
  CUR_UP?(n: number): void;
  CUR_DOWN?(n: number): void;
  CUR_FORWARD?(n: number): void;
  CUR_BACK?(n: number): void;
  CUR_POS?(r: number, c: number): void;
  CHAR_MODE?(...params: number[]): void;
  ERASE_DISPLAY?(n: number): void;
  ERASE_LINE?(n: number): void;
}

export default class ansi_parser {
  data: Uint8Array;

  constructor(data: ArrayBuffer) {
    this.data = new Uint8Array(data);
  }

  parse(fn: parserCallbacks) {
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
              case CUU:
                fn.CUR_UP?.(Number(args));
                break;
              case CUD:
                fn.CUR_DOWN?.(Number(args));
                break;
              case CUF:
                fn.CUR_FORWARD?.(Number(args));
                break;
              case CUB:
                fn.CUR_BACK?.(Number(args));
                break;
              case CUP:
              case HVP: {
                const [row, col] = args.split(";").map(Number);
                fn.CUR_POS?.(row, col);
                break;
              }
              case SGR:
                fn.CHAR_MODE?.(...args.split(";").map(Number));
                break;
              case ED:
                fn.ERASE_DISPLAY?.(Number(args));
                break;
              case EL:
                fn.ERASE_LINE?.(Number(args));
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
        fn.NEWLINE?.();
      } else if (this.data[i] === 25) {
        // EOF
        fn.EOF?.();
      } else {
        // Default to Character drawing
        fn.CHAR?.(this.data[i]);
      }
    }
    return this;
  }
}
