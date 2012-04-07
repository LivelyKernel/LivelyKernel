2.1.3 / 2012-04-07
==================

Features:
* Support for Morphic debugging (Christopher Schuster)
* publishing to the PartsBin will check and warn when a conflicting publish operation occured (Astrid Thomschke)

Minor features:
* Globally disable syntax highlighting on world load when disableSyntaxHighlighting=true is added as a query to the world URL
* New text shortcuts. Cmd + Shift + 5/6/7/8 - make selected text black/red/green/blue (Cmd key is Ctrl on windows):

Fixes:
* visual connections were fixed
* text has default padding
* fixing issues when layouting menus
* lively.ast parser and interpreter improved to recognize and execute more JS
* File names for Parts are escaped
* Selection morph fixed
* fixed grab behvior when morph owner is locked
* TextMorph restores selection range on focus 
* less alert messages
* Improved rich text recognition on pasting text
* tab container layout fixes
* external shapes are now initialized with a extent set by a DOM node correctly

2.1.2 / 2012-02-26
==================

  * This is just an experimental core link with our core link script, no changes from lk are merged into webwerksatt

2.1.1 / 2012-02-23
==================

  * Fixed name conflicts
  * several cleanups
  * impoted fixes from webwerkstatt

2.1.0 / 2012-02-22
==================

  * Initial core link
  * renamed and moved several modules to match our naming convention
  * merged changes from webwerkstatt 2012-02-10...2012-02-22
