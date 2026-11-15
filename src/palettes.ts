export const colors = {
  BLACK: 0,
  RED: 1,
  GREEN: 2,
  YELLOW: 3,
  BLUE: 4,
  MAGENTA: 5,
  CYAN: 6,
  WHITE: 7,
};

// reverse big endian RGB to little endian ABGR so we can quickly shove it into a ImageData Uint32Array view.
// If you're on PowerPC or s390x I'm sorry.
const pack = (rgb: number) =>
  (0xff000000 |
    ((rgb & 0xff) << 16) |
    (rgb & 0xff00) |
    ((rgb >> 16) & 0xff)) >>>
  0;

export const rgbPalettes: Map<string, number[]> = new Map(
  Object.entries({
    // cga/ega/vga according to wikipedia https://en.wikipedia.org/wiki/ANSI_escape_code#Colors
    "ibm-vga": [
      0x000000, 0xc40000, 0x00c400, 0xc47e00, 0x0000c4, 0xc400c4, 0x00c4c4,
      0xc4c4c4, 0x4e4e4e, 0xdc4e4e, 0x4edc4e, 0xf3f34e, 0x4e4edc, 0xf34ef3,
      0x4ef3f3, 0xffffff,
    ],
    // my original palette
    original: [
      0x000000, 0xb91900, 0x00b400, 0xba6900, 0x0221b8, 0xbb2cb9, 0x00b7b9,
      0xb8b8b8, 0x686868, 0xff6e68, 0x60fa68, 0xfffc67, 0x6972ff, 0xff77ff,
      0x60feff, 0xffffff,
    ],
  }),
);

export const palettes: Map<string, number[]> = new Map(
  [...rgbPalettes].map(([name, rgb]) => [name, rgb.map(pack)]),
);
