import '../src/ansi.ts';

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

// ?file=yop-ANSilove.ans&font=ibm9x16.psf
const params = new URLSearchParams(location.search);
const initialFile = params.get('file') ?? 'yop-ANSilove.ans';
const initialFont = params.get('font') ?? 'ibm9x16.psf';

for (const file of files) {
	const name = file.slice(1);
	ansiSelect.add(new Option(name, file, false, name === initialFile));
}

for (const [path, url] of Object.entries(fonts).sort()) {
	const name = path.split('/').pop();
	fontSelect.add(new Option(name, url, false, name === initialFont));
}

// Point the initial <img> at the selection; ansi.js renders it on DOMContentLoaded
const initialImg = document.getElementById('ansi');
initialImg.setAttribute('data-ansi-src', ansiSelect.value);
initialImg.setAttribute('data-ansi-font', fontSelect.value);

function render() {
	const img = document.createElement('img');
	img.id = 'ansi';
	img.setAttribute('data-ansi-src', ansiSelect.value);
	img.setAttribute('data-ansi-font', fontSelect.value);
	document.getElementById('ansi').replaceWith(img);
	document.dispatchEvent(new Event('DOMContentLoaded'));

	const query = new URLSearchParams({
		file: ansiSelect.selectedOptions[0].text,
		font: fontSelect.selectedOptions[0].text,
	});
	history.replaceState(null, '', `?${query}`);
}

ansiSelect.addEventListener('change', render);
fontSelect.addEventListener('change', render);
