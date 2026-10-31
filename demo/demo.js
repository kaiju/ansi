import '../src/ansi.js';

const files = Object.keys(import.meta.glob('./*.ans', { query: '?url' }))
	.map((path) => path.slice(1))
	.sort();

const select = document.getElementById('ansi-select');
const current = document.getElementById('ansi').getAttribute('data-ansi-src');

for (const file of files) {
	const option = new Option(file.slice(1), file, false, file === current);
	select.add(option);
}

select.addEventListener('change', () => {
	const img = document.createElement('img');
	img.id = 'ansi';
	img.setAttribute('data-ansi-src', select.value);
	document.getElementById('ansi').replaceWith(img);
	document.dispatchEvent(new Event('DOMContentLoaded'));
})
