import ansi_parser from "./ansi_parser";
import defaultFontUrl from "./fonts/ibm9x16.psf?url";
import textmode from "./textmode";
import textmodeFont from "./textmode_font";

function replace_all() {
  const elements = document.querySelectorAll("[data-ansi-src]");
  for (let i = 0; i < elements.length; i++) {
    if (!elements[i].hasAttribute("data-ansi-processed")) {
      replace_element(elements[i]);
    }
  }
}

async function replace_element(element: Element) {
  const url = element.getAttribute("data-ansi-src");
  const fontUrl = element.hasAttribute("data-ansi-font")
    ? element.getAttribute("data-ansi-font")
    : defaultFontUrl;

  // grab our ansi data
  const response = await fetch(url);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.arrayBuffer();

  const canvas_element = ansi(data, await textmodeFont.load(fontUrl));

  element.parentElement.insertBefore(canvas_element, element);
  element.parentElement.removeChild(element);

  for (let i = 0; i < element.attributes.length; i++) {
    const attrName = element.attributes[i].nodeName;
    const attrValue = element.attributes[i].nodeValue;

    if (attrName !== "width" && attrName !== "height") {
      canvas_element.setAttribute(attrName, attrValue);
    }
  }

  canvas_element.setAttribute("data-ansi-processed", "true");
}

document.addEventListener("DOMContentLoaded", replace_all);

function ansi(data: ArrayBuffer, font: textmodeFont) {
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
    columns = 80,
    lines = get_lines(),
    fg = palette.WHITE,
    bg = palette.BLACK,
    attributes = {
      BOLD: false,
      UNDERSCORE: false,
      REVERSE: false,
      CONCEALED: false,
    };

  // parse ansi data and count lines so we know how to size canvas
  function get_lines() {
    let x = 0,
      y = 0,
      lines = 0;

    const actions = {
      CHAR: (_code: number) => {
        if (x >= columns) {
          x = 0;
          y++;
        } else {
          x++;
        }
      },
      CUR_FORWARD: (n: number) => {
        x += n;
      },
      NEWLINE: () => {
        x = 0;
        y++;
      },
      EOF: () => {
        x = 0;
        y++;
      },
    };
    parser.parse(actions);
    lines = y + 1;
    return lines;
  }

  const display = new textmode(font, columns, lines);

  parser.parse({
    CHAR: (code: number) => {
      display.move(cursor.x, cursor.y).draw(code);

      if (cursor.x < columns - 1) {
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
          display.foreColor(fg.NORMAL);
          display.backColor(bg.NORMAL);
        } else if (param === 1) {
          // bold
          attributes.BOLD = true;
          display.foreColor(fg.BOLD);
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
            display.foreColor(fg[attributes.BOLD ? "BOLD" : "NORMAL"]);
          } else if (param >= 40 && param <= 47) {
            bg = colors[param];
            display.backColor(bg.NORMAL);
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
      console.log(`cursor up: ${n}`)
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

    }
  });

  return display.canvas;
}
