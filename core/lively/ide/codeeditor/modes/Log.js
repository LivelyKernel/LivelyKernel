module('lively.ide.codeeditor.modes.Log').requires('lively.ide.codeeditor.ace').toRun(function() {

(function defineMode() {

ace.define('ace/mode/log_highlight_rules', function(require, exports, module) {
  
  var oop = require("ace/lib/oop");
  var TextHighlightRules = ace.require("ace/mode/text_highlight_rules").TextHighlightRules;
  
  var LogHighlightRules = function() {
  
      this.$rules = {
        start: [{
          regex: "^$",
          token: "empty_line"
        },
        {regex: "^\\[log\\]", token: "entity.meta.log", next: "log"},
        {regex: "^\\[warn?i?n?g?\\]", token: "entity.meta.warning", next: "warning"},
        {regex: "^\\[error\\]", token: "entity.meta.error", next: "error"},
        {defaultToken: "text"}],
        log: [
          {regex: "^\\[log\\]", token: "entity.meta.log", next: "log"},
          {regex: "^\\[warni?n?g?\\]", token: "entity.meta.warning", next: "warning"},
          {regex: "^\\[error\\]", token: "entity.meta.error", next: "error"},
          {defaultToken: "text.meta.log"}
        ],
        warning: [
          {regex: "^\\[log\\]", token: "entity.meta.log", next: "log"},
          {regex: "^\\[warn?i?n?g?\\]", token: "entity.meta.warning", next: "warning"},
          {regex: "^\\[error\\]", token: "entity.meta.error", next: "error"},
          {defaultToken: "text.meta.warning"}
        ],
        error: [
          {regex: "^\\[log\\]", token: "entity.meta.log", next: "log"},
          {regex: "^\\[warn?i?n?g?\\]", token: "entity.meta.warning", next: "warning"},
          {regex: "^\\[error\\]", token: "entity.meta.error", next: "error"},
          {defaultToken: "text.meta.error"}
        ]
      };
  }
  
  oop.inherits(LogHighlightRules, TextHighlightRules);
  
  exports.LogHighlightRules = LogHighlightRules;
});


ace.define('ace/mode/log', function(require, exports, module) {
  var oop = require("ace/lib/oop"),
      TextMode = require("ace/mode/text").Mode,
      Tokenizer = require("ace/tokenizer").Tokenizer,
      LogHighlightRules = require("ace/mode/log_highlight_rules").LogHighlightRules;
  
  var Mode = function() {
      this.$tokenizer = new Tokenizer(new LogHighlightRules().getRules());
      // this.$behaviour = new Behaviour();
  };
  oop.inherits(Mode, TextMode);


  (function() {
    this.type = "log";
    this.getNextLineIndent = function(state, line, tab) { return ''; };
    this.$id = "ace/mode/log";
  }).call(Mode.prototype);
  
  exports.Mode = Mode;
});

ace.require("ace/edit_session").EditSession.prototype.$modes['ace/mode/log'] = new (ace.require("ace/mode/log")).Mode()

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

// ace.require("ace/mode/log").Mode


})();


}) // end of module
