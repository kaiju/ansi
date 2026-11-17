# ansi.js

Display ansi/ascii art in the browser via HTML5 Canvas.

An old project of mine from 2009 that I've been slowly refactoring to get up to speed on modern (post-2015) javascript and web technologies.

### Usage

Use the `<ansi-file>` custom element:

```
<ansi-file src="my-ansi.ans" font="ibm9x16.psf"></ansi-file>
```

#### Attributes

`src`: URL of the ANSI file to render

`font`: URL of a PSF2 (linux console) format font

`cols`: Column width to render by, defaults to `80`

`baud`: Baud rate to display at

### TODO

- Configurable color palettes/iCE color support
- Maybe write some actual tests, like an adult.
- Blink support
