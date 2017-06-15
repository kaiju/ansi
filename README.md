
# ansi.js

### Load ansi/ascii in your browser, displayed via HTML5 Canvas



A small project of mine from 2009 that has gradually turned into more modular and usable bits of code.



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
* Configurable color palettes/iCE color support
* More character sets
* SAUCE support
