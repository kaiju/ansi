import ansi_parser from "./ansi_parser";
import { palettes } from "./palettes";
import textmodeDisplay from "./textmode";

class Ansi extends HTMLElement {
  static observedAttributes: string[] = ["src", "cols", "baud", "font"];
  private display: textmodeDisplay = new textmodeDisplay();
  private controller?: AbortController;

  constructor() {
    super();
    this.attachShadow({ mode: "open" });
  }

  async connectedCallback() {
    this.load();
  }

  attributeChangedCallback(_name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue && this.isConnected) this.load();
  }

  private async load() {
    // cancel any previous invocation
    this.controller?.abort();

    const controller = new AbortController();
    this.controller = controller;
    const signal = controller.signal;

    // get src
    if (!this.hasAttribute("src")) {
      // nothing more to do here!
      return;
    }
    const url = this.getAttribute("src");

    // get optional column
    const columns: number = this.hasAttribute("cols")
      ? Number(this.getAttribute("cols"))
      : 80;

    // Baud rate
    const baud: number = Number(this.getAttribute("baud"));

    // grab our ansi data
    const response = await fetch(url, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.arrayBuffer();

    // Set up our parser
    const parser = new ansi_parser(data, columns);

    const palette = palettes.get("original");

    // Do an initial parse of the file in order to get our row count so we can
    // size the display
    for (const _ of parser.parse({
      EOF: (footer) => {
        // quick and nasty SAUCE parsing
        // read the last 128 bytes
        if (footer.byteLength >= 128) {
          const s = footer.subarray(footer.length - 128);
          const decoder = new TextDecoder();

          const header = decoder.decode(s.subarray(0, 5));

          if (header !== "SAUCE") return;

          const _version = decoder.decode(s.subarray(5, 7));
          const title = decoder.decode(s.subarray(7, 42)).trimEnd();
          const author = decoder.decode(s.subarray(42, 62)).trimEnd();
          const group = decoder.decode(s.subarray(62, 82)).trimEnd();

          const date = decoder.decode(s.subarray(82, 90));
          const year = date.substring(0, 4);
          const month = date.substring(4, 6);
          const day = date.substring(6, 8);

          const label = `${title} by ${author} <${group}> on ${month}-${day}-${year}`;
          this.display.setAttribute("label", label);
          this.textContent = label;

          this.dispatchEvent(new CustomEvent("sauce", { detail: label }));
        }
      },
    })) { };

    // Set up our textmode display
    if (this.hasAttribute("font")) this.display.setAttribute("font", this.getAttribute("font"));
    this.display.setAttribute("cols", columns.toString());
    this.display.setAttribute("rows", parser.rows.toString());
    this.display.fgColor = palette[37];
    this.display.bgColor = palette[40];
    await this.display.init();
    if (signal.aborted) return;

    this.shadowRoot?.replaceChildren(this.display);

    // render time
    const b = parser.parse({
      CHAR: (code: number) => {
        this.display
          .move(parser.curX, parser.curY)
          .draw(code);
      },
      CHAR_MODE: () => {
        // TODO handle 6x6x6 256 color sequences
        this.display.fgColor =
          palette[
            parser.fgColor - 30 + (parser.attributes.BOLD ? 8 : 0)
          ];
        this.display.bgColor = palette[parser.bgColor - 40];
      },
    });

    let start: number;
    let bytesRead: number = 0;
    const tick = (timestamp: number) => {
      if (signal.aborted) return;
      if (start === undefined) start = timestamp;

      // How much time has elapsed since we started?
      const elapsed = timestamp - start;
      // How many bytes should we read based on baud rate and time elapsed?
      const bytesToRead =
        baud !== 0 ? (elapsed / 1000) * (baud / 10)  : data.byteLength;

      // Go ahead and parse those bytes
      while (bytesRead < bytesToRead) {
        const bytes = b.next();
        bytesRead = bytes.value;
      }

      // Render
      this.display.render();

      // If we haven't read everything, onto the next frame
      if (bytesRead < data.byteLength) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

}
window.customElements.define("ansi-file", Ansi);
