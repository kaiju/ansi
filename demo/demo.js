import '../src/ansi.js';

const files = Object.keys(import.meta.glob('./*.ans', { query: '?url' }))
	.map((path) => path.slice(1))
	.sort();

const fonts = import.meta.glob('../src/fonts/*.psf', {
	query: '?url',
	import: 'default',
	eager: true,
});

const ansiSelect = document.getElementById('ansi-select');
const fontSelect = document.getElementById('font-select');
const current = document.getElementById('ansi').getAttribute('data-ansi-src');

for (const file of files) {
	ansiSelect.add(new Option(file.slice(1), file, false, file === current));
}

for (const [path, url] of Object.entries(fonts).sort()) {
	const name = path.split('/').pop();
	fontSelect.add(new Option(name, url, false, name === 'dos9x16.psf'));
}

function render() {
	const img = document.createElement('img');
	img.id = 'ansi';
	img.setAttribute('data-ansi-src', ansiSelect.value);
	img.setAttribute('data-ansi-font', fontSelect.value);
	document.getElementById('ansi').replaceWith(img);
	document.dispatchEvent(new Event('DOMContentLoaded'));
}

ansiSelect.addEventListener('change', render);
fontSelect.addEventListener('change', render);
