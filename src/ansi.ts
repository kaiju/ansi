import ansi_parser from "./ansi_parser";
import defaultFontUrl from "./fonts/ibm9x16.psf?url";
import textmodeDisplay from "./textmode";
import textmodeFont from "./textmode_font";

class Ansi extends HTMLElement {
  private tm: textmodeDisplay;
  private parser: ansi_parser;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    this.load();
  }

  private async load() {
    // get src
    if (!this.hasAttribute("src")) {
      throw new Error("Missing src attribute");
    }
    const url = this.getAttribute("src");

    // get optional font
    const fontUrl: string = this.getAttribute("font") ?? defaultFontUrl;

    // get optional column
    const columns: number = this.hasAttribute("cols")
      ? Number(this.getAttribute("cols"))
      : 80;

    // grab our ansi data
    const response = await fetch(url);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.arrayBuffer();

    // Set up our parser
    this.parser = new ansi_parser(data);

    // Run through the parser to count rows based on our column size.
    // TODO make 'display' a pluggable interface and just share parsing logic across
    // both passes
    const rows: number = (() => {
      const cursor = { x: 0, y: 0 };
      const savedcursor = { x: 0, y: 0 };
      let maxY = 0;
      this.parser.parse({
        CHAR: (_code: number) => {
          maxY = Math.max(maxY, cursor.y);

          if (cursor.x < columns - 1) {
            cursor.x++;
          } else {
            cursor.x = 0;
            cursor.y++;
          }
        },
        CUR_POS: (row: number, col: number) => {
          cursor.x = col;
          cursor.y = row;
        },
        CUR_UP: (n: number) => {
          cursor.y = Math.max(0, cursor.y - n);
        },
        CUR_DOWN: (_n: number) => {},
        CUR_FORWARD: (n: number) => {
          cursor.x += n;
        },
        CUR_BACK: (n: number) => {
          cursor.x = Math.max(0, cursor.x - n);
        },
        NEWLINE: () => {
          cursor.x = 0;
          cursor.y++;
        },
        ERASE_DISPLAY: (n: number) => {
          if (n === 2) {
            cursor.x = 0;
            cursor.y = 0;
          }
        },
        SAVE_CUR: () => {
          savedcursor.x = cursor.x;
          savedcursor.y = cursor.y;
        },
        RESTORE_CUR: () => {
          cursor.x = savedcursor.x;
          cursor.y = savedcursor.y;
        },
      });
      return maxY + 1;
    })();

    // Set up our textmode display
    this.tm = new textmodeDisplay();
    this.tm.setAttribute("font", fontUrl);
    this.tm.setAttribute("cols", columns.toString());
    this.tm.setAttribute("rows", rows.toString());
    await this.tm.init();

    // Yoink rendering off to our legacy draw function
    await ansi(data, this.tm);

    // render our drawing
    this.tm.render();

    this.shadowRoot!.replaceChildren(this.tm);
  }
}
window.customElements.define("ansi-file", Ansi);

async function ansi(data: ArrayBuffer, display: textmodeDisplay) {
  let parser = new ansi_parser(data),
    palette = {
      BLACK: {
        NORMAL: [0, 0, 0],
        BOLD: [104, 104, 104],
      },
      RED: {
        NORMAL: [185, 25, 0],
        BOLD: [255, 110, 104],
      },
      GREEN: {
        NORMAL: [0, 180, 0],
        BOLD: [96, 250, 104],
      },
      YELLOW: {
        NORMAL: [186, 105, 0],
        BOLD: [255, 252, 103],
      },
      BLUE: {
        NORMAL: [2, 33, 184],
        BOLD: [105, 114, 255],
      },
      MAGENTA: {
        NORMAL: [187, 44, 185],
        BOLD: [255, 119, 255],
      },
      CYAN: {
        NORMAL: [0, 183, 185],
        BOLD: [96, 254, 255],
      },
      WHITE: {
        NORMAL: [184, 184, 184],
        BOLD: [255, 255, 255],
      },
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
      47: palette.WHITE,
    },
    cursor = {
      x: 0,
      y: 0,
    },
    savedcursor = {
      x: 0,
      y: 0,
    },
    fg = palette.WHITE,
    bg = palette.BLACK,
    attributes = {
      BOLD: false,
      UNDERSCORE: false,
      REVERSE: false,
      CONCEALED: false,
    };

  parser.parse({
    CHAR: (code: number) => {
      display.move(cursor.x, cursor.y).draw(code);

      if (cursor.x < Number(display.getAttribute("cols")) - 1) {
        cursor.x++;
      } else {
        cursor.x = 0;
        cursor.y++;
      }
    },
    CHAR_MODE: (...args) => {
      for (let i = 0; i < args.length; i++) {
        const param = args[i];

        if (param === 0) {
          // underscore
          for (const attribute in attributes) attributes[attribute] = false;
          fg = palette.WHITE;
          bg = palette.BLACK;
          display.fgColor = fg.NORMAL;
          display.bgColor = bg.NORMAL;
        } else if (param === 1) {
          // bold
          attributes.BOLD = true;
          display.fgColor = fg.BOLD;
        } else if (param === 4) {
          // underscore
        } else if (param === 5) {
          // blink
        } else if (param === 7) {
          // reverse
        } else if (param === 8) {
          // concealed
        } else if (colors[param] !== undefined) {
          // color
          if (param >= 30 && param <= 37) {
            // foreground
            fg = colors[param];
            display.fgColor = fg[attributes.BOLD ? "BOLD" : "NORMAL"];
          } else if (param >= 40 && param <= 47) {
            bg = colors[param];
            display.bgColor = bg.NORMAL;
          }
        } else {
          // caught unexpected parameter
        }
      }
    },
    CUR_POS: (row: number, col: number) => {
      cursor.x = col;
      cursor.y = row;
      display.move(cursor.x, cursor.y);
    },
    CUR_UP: (n: number) => {
      if (cursor.y - n < 0) {
        cursor.y = 0;
      } else {
        cursor.y -= n;
      }
      display.move(cursor.x, cursor.y);
    },
    CUR_DOWN: (_n: number) => {},
    CUR_FORWARD: (n: number) => {
      cursor.x += n;
      display.move(cursor.x, cursor.y);
    },
    CUR_BACK: (n: number) => {
      if (cursor.x - n < 0) {
        cursor.x = 0;
      } else {
        cursor.x -= n;
      }
    },
    NEWLINE: () => {
      cursor.x = 0;
      cursor.y++;
      display.move(cursor.x, cursor.y);
    },
    ERASE_DISPLAY: (n: number) => {
      // 0: clear from cursor to end of screen
      // 1: clear from cursor to to beginning of screen
      // 2: clear enter screen, move cursor upper left
      switch (n) {
        case 2:
          cursor.x = 0;
          cursor.y = 0;
          display.move(cursor.x, cursor.y);
          break;
      }
    },
    SAVE_CUR: () => {
      savedcursor.x = cursor.x;
      savedcursor.y = cursor.y;
    },
    RESTORE_CUR: () => {
      cursor.x = savedcursor.x;
      cursor.y = savedcursor.y;
      display.move(cursor.x, cursor.y);
    },
    EOF: (footer) => {
      // quick and nasty SAUCE parsing
      // read the last 128 bytes
      if (footer.byteLength >= 128) {
        let s = footer.subarray(footer.length - 128);
        const decoder = new TextDecoder();

        const header = decoder.decode(s.subarray(0, 5));
        const version = decoder.decode(s.subarray(5, 7));
        const title = decoder.decode(s.subarray(7, 42)).trimEnd();
        const author = decoder.decode(s.subarray(42, 62)).trimEnd();
        const group = decoder.decode(s.subarray(62, 82)).trimEnd();

        const date = decoder.decode(s.subarray(82, 90));
        const year = date.substring(0, 4);
        const month = date.substring(4, 6);
        const day = date.substring(6, 8);

        const label = `${title} by ${author} <${group}> on ${month}-${day}-${year}`;
        display.setAttribute("label", label);
        // TODO put this in the actual ansi element innerText
        display.innerText = label;
      }
    },
  });
}
