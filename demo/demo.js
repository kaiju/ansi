import "../src/ansi.ts";

const files = Object.keys(import.meta.glob("./*.ans", { query: "?url" }))
  .map((path) => path.slice(1))
  .sort();

const fonts = import.meta.glob("../src/fonts/*.psf", {
  query: "?url",
  import: "default",
  eager: true,
});

const ansiSelect = document.getElementById("ansi-select");
const fontSelect = document.getElementById("font-select");
const urlForm = document.getElementById("url-form");
const urlInput = document.getElementById("ansi-url");

// ?file=yop-ANSilove.ans&font=ibm9x16.psf, or ?url=https://...&font=...
// (url takes precedence over file)
const params = new URLSearchParams(location.search);
const initialFile = params.get("file") ?? "yop-ANSilove.ans";
const initialFont = params.get("font") ?? "ibm9x16.psf";
urlInput.value = params.get("url") ?? "";

for (const file of files) {
  const name = file.slice(1);
  ansiSelect.add(new Option(name, file, false, name === initialFile));
}

for (const [path, url] of Object.entries(fonts).sort()) {
  const name = path.split("/").pop();
  fontSelect.add(new Option(name, url, false, name === initialFont));
}

// A non-empty URL box overrides the file dropdown
function currentSrc() {
  return urlInput.value || ansiSelect.value;
}

// <ansi-file> loads once when connected, so swap in a fresh element per render
function render() {
  const el = document.createElement("ansi-file");
  el.id = "ansi";
  el.setAttribute("src", currentSrc());
  el.setAttribute("font", fontSelect.value);
  document.getElementById("ansi").replaceWith(el);

  const query = new URLSearchParams({
    font: fontSelect.selectedOptions[0].text,
  });
  if (urlInput.value) {
    query.set("url", urlInput.value);
  } else {
    query.set("file", ansiSelect.selectedOptions[0].text);
  }
  history.replaceState(null, "", `?${query}`);
}

ansiSelect.addEventListener("change", () => {
  urlInput.value = "";
  render();
});
fontSelect.addEventListener("change", render);
urlForm.addEventListener("submit", (event) => {
  event.preventDefault(); // don't actually submit/reload the page
  render();
});

render();
