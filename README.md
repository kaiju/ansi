# ansi.js

Display ansi/ascii art in the browser via HTML5 Canvas.

An old project of mine from 2009. Now with some modern improvements like porting to typescript, improved parsing, sauce support, and more.

### Usage

Load an ANSI file using any element with a `data-ansi-src` attribute:

```
<img data-ansi-src="my_ansi.ans">
```

#### Attributes

`data-ansi-src`: URL of the ANSI file to display

`data-ansi-charset`: Character encoding of the ANSI file, default is ISO-8859-1

On DOM ready, each element with a `data-ansi-src` attribute is replaced with a `canvas` element. Additional attributes (aside from `width` and `height`) are copied onto the new `canvas` element as well.

### TODO
* Web Components?
* Baud rate emulation
* Configurable color palettes/iCE color support
* Maybe write some actual tests, like an adult.
