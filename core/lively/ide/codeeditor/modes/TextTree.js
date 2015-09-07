module('lively.ide.codeeditor.modes.TextTree').requires('lively.ide.codeeditor.ace').toRun(function() {

// FIXME helper
function takeWhile(arr, predFunc) {
  var result = [];
  for (var i = 0; i < arr.length; i++) {
    var val = arr[i];
    if (!predFunc(val, i)) break;
    result.push(val);
  }
  return result;
}


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
        lines = self.ensureLines(treeString);
    if (!lines[row]) return 0;
    var idx = lines[row].lastIndexOf("\\-");
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

  subtree: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        col = self.itemTextStartColumn(lines, row);
    return takeWhile(lines.slice(row+1), function(_, i) {
      return col < self.itemTextStartColumn(treeString, row+i+1);
    });
  },

  siblingsWithRows: function(treeString, row) {
    // var treeString = that.textString;
    // var row = that.getCursorPositionAce().row
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        parentRow = self.parentRowOfRow(lines, row),
        col = self.itemTextStartColumn(lines, row),
        subtree = self.subtree(lines, parentRow);
    return subtree.reduce(function(siblings, line, i) {
        var absRow = parentRow+i+1;
        var currentCol = self.itemTextStartColumn(lines, absRow)
        return col === currentCol ?
          siblings.concat([[absRow, line]]) :
          siblings
      }, []);
  },

  siblingsWithRowsAndCurrentLine: function(treeString, row) {
    var self = lively.ide.codeeditor.modes.TextTree,
        lines = self.ensureLines(treeString),
        siblings = self.siblingsWithRows(lines, row),
        index = 0,
        current = siblings.detect(function(rowAndLine, i) {
          index = i; return rowAndLine[0] === row; });
    return {index: index, siblings: siblings};
  },

  siblings: function(treeString, row) {
    // var treeString = that.textString;
    // var row = that.getCursorPositionAce().row
    // self.siblings(treeString, row);
    var self = lively.ide.codeeditor.modes.TextTree;
    return self.siblingsWithRows(treeString, row)
      .map(function(rowAndLine) { return rowAndLine[1]; })
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
  },

  rangeForSubtree: function(ed, row, subtree) {
    if (!subtree.length) return null;
    var endRow = row + subtree.length - 1,
        endPos = {row: endRow, column: ed.session.getLine(endRow).length},
        range = lively.ide.ace.require("ace/range").Range.fromPoints({row: row, column: 0}, endPos);
    return range;
  }

});

var TextTreeMode = lively.ide.ace.require('ace/mode/texttree').Mode;

TextTreeMode.addMethods({

    commands: {

      "tree.move-to-parent": {
        bindKey: "alt-left",
        exec: function(ed) {
          var pos = ed.getCursorPosition();
          var r = pos.row;
          var upPos = lively.ide.codeeditor.modes.TextTree.parentItemTextStartPosition(ed.getValue(), r);
          ed.moveCursorTo(upPos.row, upPos.column+1);
          ed.renderer.scrollCursorIntoView();
          ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
        }
      },

      "tree.move-to-prev-sibling": {
        bindKey: "alt-up",
        exec: function(ed) {
          var treeFuncs = lively.ide.codeeditor.modes.TextTree,
              pos = ed.getCursorPosition(),
              siblings = treeFuncs.siblingsWithRowsAndCurrentLine(ed.getValue(), pos.row),
              prev = siblings.siblings[siblings.index-1],
              col = treeFuncs.itemTextStartColumn(ed.getValue(), pos.row);
          ed.moveCursorTo(prev[0], ed.session.getLine(prev[0]).length);
          ed.renderer.scrollCursorIntoView();
          ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
        }
      },

      "tree.move-to-next-sibling": {
        bindKey: "alt-down",
        exec: function(ed) {
          var treeFuncs = lively.ide.codeeditor.modes.TextTree,
              pos = ed.getCursorPosition(),
              siblings = treeFuncs.siblingsWithRowsAndCurrentLine(ed.getValue(), pos.row),
              prev = siblings.siblings[siblings.index+1],
              col = treeFuncs.itemTextStartColumn(ed.getValue(), pos.row);
          ed.moveCursorTo(prev[0], ed.session.getLine(prev[0]).length);
          ed.renderer.scrollCursorIntoView();
          ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
        }
      },

      "tree.path": {
        bindKey: "alt-p",
        exec: function(ed, args) {
          var path = lively.ide.codeeditor.modes.TextTree.rootPathFromRow(
            ed.getValue(), ed.getCursorPosition().row);
          ed.$morph.setStatusMessage(path.join((args && args.join) || "/"));
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
      },

      "tree.select-subtree": {
        bindKey: 'alt-space',
        exec: function (ed, args) {
          var startPos = ed.getCursorPosition(),
              subtree = lively.ide.codeeditor.modes.TextTree.subtree(ed.getValue(), startPos.row),
              range = lively.ide.codeeditor.modes.TextTree.rangeForSubtree(ed, startPos.row+1, subtree);
          if (range) {
            range.setStart(startPos.row, 0); // select parent itself
            ed.selection.setRange(range)
            ed.centerSelection();
            ed.pushEmacsMark && ed.pushEmacsMark(startPos, false);
          }
        }
      },

      "tree.select-subtrees-of-siblings": {
        bindKey: 'alt-shift-space',
        exec: function (ed, args) {
          var treeFuncs = lively.ide.codeeditor.modes.TextTree,
              pos = ed.getCursorPosition(),
              siblings = treeFuncs.siblingsWithRowsAndCurrentLine(ed.getValue(), pos.row),
              subtrees = siblings.siblings.map(function(rowAndLine) {
                return treeFuncs.subtree(ed.getValue(), rowAndLine[0]);
              }),
              ranges = siblings.siblings.map(function(rowAndLine, i) {
                return subtrees[i] ? treeFuncs.rangeForSubtree(ed, rowAndLine[0]+1, subtrees[i]) : null;
              }).compact();
          if (!ranges.length) return;
          ed.selection.clearSelection();
          ed.moveCursorToPosition(ranges[0].start);
          ranges.reverse().forEach(function(range) { ed.selection.addRange(range); })
          ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
        }
      },

      "tree.select-siblings": {
        bindKey: 'ctrl-alt-space',
        exec: function (ed, args) {
          var treeFuncs = lively.ide.codeeditor.modes.TextTree,
              pos = ed.getCursorPosition(),
              siblings = treeFuncs.siblingsWithRowsAndCurrentLine(ed.getValue(), pos.row),
              ranges = siblings.siblings.map(function(rowAndLine) {
                var start = {column: 0, row: rowAndLine[0]};
                var end = {column: ed.session.getLine(rowAndLine[0]).length, row: rowAndLine[0]};
                return lively.ide.ace.require("ace/range").Range.fromPoints(start, end);
              });
          ed.selection.clearSelection();
          ranges.reverse().forEach(function(range) { ed.selection.addRange(range); })
          ed.pushEmacsMark && ed.pushEmacsMark(pos, false);
        }
      }
    },

    attach: function(ed) {
        ed.commands.addCommands(this.commands);
    },

    detach: function(ed) {
        ed.commands.removeCommands(this.commands);
    },

    morphMenuItems: function(items, ed) {
        var mode = this;

        items.pushAll([
          ["tree.move-to-parent (alt-left)",                     function() { ed.aceEditor.execCommand("tree.move-to-parent"); }],
          ["tree.move-to-prev-sibling (alt-up)",                 function() { ed.aceEditor.execCommand("tree.move-to-prev-sibling"); }],
          ["tree.move-to-next-sibling (alt-down)",               function() { ed.aceEditor.execCommand("tree.move-to-next-sibling"); }],
          ["tree.path (alt-p)",                                  function() { ed.aceEditor.execCommand("tree.path"); }],
          ["tree.open-as-file (alt-o)",                          function() { ed.aceEditor.execCommand("tree.open-as-file"); }],
          ["tree.select-subtree (alt-space)",                    function() { ed.aceEditor.execCommand("tree.select-subtree"); }],
          ["tree.select-subtrees-of-siblings (alt-shift-space)", function() { ed.aceEditor.execCommand("tree.select-subtrees-of-siblings"); }],
          ["tree.select-siblings (ctrl-alt-space)",              function() { ed.aceEditor.execCommand("tree.select-siblings"); }]]);

        return items;
    },
});

lively.ide.allCodeEditors()
  .filter(function(ed) { return ed.getTextMode() === "texttree"; })
  .forEach(function(ed) { ed.setTextMode("text"); ed.setTextMode("texttree"); })

}) // end of module
