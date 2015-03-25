module('lively.ide.codeeditor.modes.TextList').requires('lively.ide.codeeditor.ace').toRun(function() {

(function defineMode() {

ace.define('ace/mode/textlist_highlight_rules', function(require, exports, module) {
  
  var oop = require("ace/lib/oop");
  var TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;
  
  var TextListHighlightRules = function() {
  
      this.$rules = {
        start: [{
          regex: "^$",
          token: "empty_line"
        },{
          regex: "\\[",
          token: "meta.action.start",
          next: "action"
        }, {defaultToken: "meta.searchline"}],
        action: [
          {regex: "\\s+", token: "text"},
          {regex: "\\]", token: "meta.action.end", next: "start"},
          // {defaultToken: "meta.action.markup.underline"}
          {defaultToken: "meta.action"}
          ]
      };
  }
  
  oop.inherits(TextListHighlightRules, TextHighlightRules);
  
  exports.TextListHighlightRules = TextListHighlightRules;
});


ace.define('ace/mode/textlist', function(require, exports, module) {
  var oop = require("ace/lib/oop"),
      TextMode = require("ace/mode/text").Mode,
      Tokenizer = require("ace/tokenizer").Tokenizer,
      TextListHighlightRules = require("ace/mode/textlist_highlight_rules").TextListHighlightRules;
  
  var Mode = function() {
      this.$tokenizer = new Tokenizer(new TextListHighlightRules().getRules());
      // this.$behaviour = new Behaviour();
  };
  oop.inherits(Mode, TextMode);


  (function() {
    this.type = "textlist";
    this.getNextLineIndent = function(state, line, tab) { return ''; };
    this.$id = "ace/mode/textlist";
  }).call(Mode.prototype);
  
  exports.Mode = Mode;
});

ace.require("ace/edit_session").EditSession.prototype.$modes['ace/mode/textlist'] = new (ace.require("ace/mode/textlist")).Mode()

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// ace.require("ace/mode/textlist").Mode


})();


}) // end of module
