module('lively.ide.codeeditor.modes.TextTree').requires('lively.ide.codeeditor.ace').toRun(function() {

(function defineMode() {

// ace.require("ace/mode/texttree").Mode

ace.define("ace/mode/texttree",["require","exports","module"], function(require, exports, module) {
  var oop = require("ace/lib/oop");
  var TextMode = require("ace/mode/text").Mode;
  var TextHighlightRules = require("ace/mode/text_highlight_rules").TextHighlightRules;
  var Behaviour = require("ace/mode/behaviour").Behaviour;

  var Mode = function() {
      this.HighlightRules = TextHighlightRules;
      this.$behaviour = new Behaviour();
  };

  oop.inherits(Mode, TextMode);

  (function() {
      this.type = "text";
      this.getNextLineIndent = function(state, line, tab) { return ''; };
      this.$id = "ace/mode/texttree";
  }).call(Mode.prototype);

  exports.Mode = Mode;
});

ace.require("ace/edit_session").EditSession.prototype.$modes['ace/mode/texttree'] = new (ace.require("ace/mode/texttree")).Mode()

})();

Object.extend(lively.ide.codeeditor.modes.TextTree, {

  ensureLines: function(treeStringOrLines) {
    return Array.isArray(treeStringOrLines) ?
      treeStringOrLines : lively.lang.string.lines(treeStringOrLines);
  },

  itemTextStartColumn: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        idx = lines[row].lastIndexOf("\\-");
    return idx === -1 ? lines[row].lastIndexOf("|-") : idx;
  },

  itemTextOfRow: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString);
    return lines[row].replace(/^[| \\-]*/, '');
  },

  parentRowOfRow: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        treeStruct = lines[row].match(/^[| \\-]*/, '')[0],
        level = Math.max(self.itemTextStartColumn(lines,row),0),
        rowOffset = 0;
    lines.slice(0,row).reverse().detect(function(l) {
      rowOffset++;
      return l[level] !== '\\' && l[level] !== '|'; });
    return row - rowOffset;
  },

  parentItemTextStartPosition: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        parentRow = self.parentRowOfRow(lines, row);
    return {column: self.itemTextStartColumn(lines, parentRow), row: parentRow};
  },

  parentItemTextOfRow: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        row = self.parentRowOfRow(lines, row);
    return self.itemTextOfRow(lines, row);
  },

  rootPathFromRow: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        rows = [row],
        counter = 0;
    while (row && row > 0) {
      if (counter++ > 100) throw new Error("Endlessness");
      row = self.parentRowOfRow(lines, row);
      rows.unshift(row);
    }
    return rows.map(self.itemTextOfRow.curry(lines));
  }

});

var TextTreeMode = lively.ide.ace.require('ace/mode/texttree').Mode;

TextTreeMode.addMethods({

    commands: {

      "tree.up": {
        bindKey: "alt-up",
        exec: function(ed) {
          var pos = ed.getCursorPosition();
          var r = pos.row;
          var upPos = lively.ide.codeeditor.modes.TextTree.parentItemTextStartPosition(ed.getValue(), r);
          ed.moveCursorTo(upPos.row, upPos.column+1)
          ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
        }
      },

      "tree.path": {
        bindKey: "alt-p",
        exec: function(ed, args) {
          var path = lively.ide.codeeditor.modes.TextTree.rootPathFromRow(
            ed.getValue(), ed.getCursorPosition().row);
          show(path.join((args && args.join) || "/"));
          lively.ide.ace.require("ace/keyboard/emacs").killRing.add(path.join("/"));
        }
      },

      "tree.open-as-file": {
        bindKey: 'alt-o',
        exec: function (ed, args) {
          var path = lively.ide.codeeditor.modes.TextTree.rootPathFromRow(
            ed.getValue(), ed.getCursorPosition().row);
          lively.ide.openFile(path.join("/"))
        }
      }
    },

    attach: function(ed) {
        ed.commands.addCommands(this.commands);
    },

    detach: function(ed) {
        ed.commands.removeCommands(this.commands);
    },

    morphMenuItems: function(items, editor) {
        var mode = this;
        // items.push(['text tree',[
        //     ['change Clojure runtime environment (Command-e)', function() { mode.commands.changeClojureEnv.exec(editor.aceEditor); }],
        //     ['interrupt eval (Command-.)', function() { mode.commands.evalInterrupt.exec(editor.aceEditor); }],
        //     ['pretty print code (Tab)', function() { mode.commands.prettyPrint.exec(editor.aceEditor); }],
        //     ['print doc for selected expression (Command-?)', function() { mode.commands.printDoc.exec(editor.aceEditor); }]
        // ]]);

        return items;
    },
});

}) // end of module
