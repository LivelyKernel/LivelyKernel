/*
 * Optimized Parser for parsing blocks of JavaScript code
 */

Global.ChunkParser = {

  start: function(ometaParser, chunkStart, chunkEnd) {
    this.ometaParser = ometaParser;
    this.isString = (chunkStart === chunkEnd) && (chunkStart === '\'' || chunkStart === '\"');
    this.chunkStart = chunkStart;
    this.chunkEnd = chunkEnd;
    this.chunkEndFound = false;
    this.next = null;
    this.counter = 0;
    this.result = [];
    this.parseStart();
    // dbgOn(true);
    do { this.makeStep() } while (!this.parseRest());
    return this.result;
  },

  parseStart: function() {
    this.result.push(this.ometaParser._applyWithArgs('exactly', this.chunkStart));
  },

  makeStep: function() {
    this.next = this.ometaParser._apply("anything");
    this.result.push(this.next);
    this.nextNext = this.ometaParser.input.hd;
    return this.next;
  },

  backup: function() {
    this.backupRecorded = true;
    this.backupInput = this.ometaParser.input;
    this.backupNext = this.next;
    this.backupNextNext = this.nextNext;
    this.backupCounter = this.counter;
    this.backupResult = this.result;
  },

  useBackup: function() {
    if (!this.backupRecorded) throw dbgOn(new Error('Using Chunk parser backup but did not record it!'));
    this.ometaParser.input = this.backupInput;
    this.next = this.backupNext;
    this.nextNext = this.backupNextNext;
    this.counter = this.backupCounter;
    this.result = this.backupResult;
  },

  parseEscapedChar: function() {
    while (this.next === '\\') {
        this.makeStep();
        this.makeStep();
    }
  },

  parseComment: function() {
    if (this.next !== '/') return false;
    var comment1Opened = this.nextNext === '/';
    var comment2Opened = this.nextNext === '*'
    if (!comment1Opened && !comment2Opened) return;
    this.makeStep(); this.makeStep();
    while (true) { // this seems to crash Safari/Webkit, using do while below
      this.parseEscapedChar();
      if (comment1Opened && (this.next === '\n' || this.next === '\r')) return;
      if (comment2Opened && this.next === '*' && this.nextNext === '/' && this.makeStep()) return;
      this.makeStep();
    }
  },

  parseString: function() {
    var string1Opened;
    var string2Opened;
	if (this.chunkStart === '\'' || this.chunkStart === '"') return;
    if (this.next === '\'') string1Opened = true;
    if (this.next === '"') string2Opened = true;
    if (!string1Opened && !string2Opened) return;
    this.makeStep();
    while (true) { // this seems to crash Safari/Webkit
      this.parseEscapedChar()
      if (string1Opened && this.next === '\'') return;
      if (string2Opened && this.next === '"') return;
      this.makeStep();
    }
  },

  parseRegex: function() {
    var regexOpen = this.next === '/' && this.nextNext !== '*' && this.nextNext !== '/';
    if (!regexOpen) return;
    this.backup();
    this.makeStep();
    while (true) {
      this.parseEscapedChar();
      // Assume regex are on one line
      if (this.next === '\n' || this.next === '\r') {
        this.useBackup();
        return;
      }
      if (this.next === '/') return;
      this.makeStep();
    }
  },

  parseRest: function() {
    this.parseEscapedChar();
    if (!this.isString) {
	    this.parseRegex();
	    this.parseString();
	    this.parseComment();
    }
    if (this.next === this.chunkEnd && this.counter === 0) // end
      return true;
    if (this.next === this.chunkEnd) { // end of another chunk
      this.counter--;
      return false;
    }
    if (this.next === this.chunkStart) // begin of another chunk
      this.counter++;
    return false;
  }

};

OMeta.basicChunk = function() {
  var chunkStart = this._apply("anything"),
      chunkEnd   = this._apply("anything");
  if (!this.chunkParser)
    this.chunkParser = objectThatDelegatesTo(ChunkParser,{});
    //this.chunkParser = objectThatDelegatesTo(Object,ChunkParser, {});
  return this.chunkParser.start(this, chunkStart, chunkEnd);
}
