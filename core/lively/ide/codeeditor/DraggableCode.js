module('lively.ide.codeeditor.DraggableCode').requires("lively.ast", 'lively.morphic.DraggableJavaScript', 'lively.ide.codeeditor.MorphicOverlay').toRun(function() {

Object.extend(lively.ide.codeeditor.DraggableCode, {

  installIn: function(editor) {
    // lively.ide.codeeditor.DraggableCode.installIn(that)
    // lively.ide.codeeditor.DraggableCode.uninstallFrom(that)
    // that.aceEditor.session["$lively-draggable-code-extensions"]
    // this.aceEditor.getKeyboardHandler().addCommand({
    // this.aceEditor.commands.
    // this.aceEditor.execCommand("lively.morphic.DraggableJavaScript.grabCode")

    editor.withAceDo(function(ed) {
      var ext = ed.session["$lively-draggable-code-extensions"] || (ed.session["$lively-draggable-code-extensions"] = {});
      if (!ext.mouseUpHandler) {
        ext.mouseUpHandler = function(evt) { lively.ide.codeeditor.DraggableCode.onMouseUp(editor, evt) };
        ed.on("mouseup", ext.mouseUpHandler)
      }
      if (!ext.mouseMoveHandler) {
        ext.mouseMoveHandler = function(evt) { lively.ide.codeeditor.DraggableCode.onMouseMove(editor, evt) };
        ed.on("mousemove", ext.mouseMoveHandler);
      }

      ed.commands.addCommand({
        name: "lively.morphic.DraggableJavaScript.grabCode",
        readOnly: true,
        scrollIntoView: "cursor",
        exec: function(ed) { ed.$morph.makeAndGrabTileForNode(); }
      });
    });

    editor.addScript(function codeEditorMenuItems() {
      return lively.ide.codeeditor.DraggableCode.codeEditorMenuItems(this, $super());
    });

    ace.ext.keys.addKeyCustomizationLayer("draggable-code", {
      commandKeyBinding: {
        "Command-G": "lively.morphic.DraggableJavaScript.grabCode"
      },
      priority: 100
    });

// ace.ext.keys.addKeyCustomizationLayer("user-key-bindings", {
//   commandKeyBinding: {
//     "Command-G": "lively.morphic.DraggableJavaScript.grabCode"
//   },
//   priority: 100
// });

  },

  uninstallFrom: function(editor) {
    editor.withAceDo(function(ed) {
      var ext = ed.session["$lively-draggable-code-extensions"];
      if (ext && ext.mouseUpHandler) {
        ed.off("mouseup", ext.mouseUpHandler);
        delete ext.mouseUpHandler;
      }
      if (ext && ext.mouseMoveHandler) {
        ed.off("mousemove", ext.mouseMoveHandler);
        delete ext.mouseMoveHandler;
      }
    });
  },

  ensureNodeSelectionOverlay: function(editor, node) {
    var o = editor.nodeSelectionOverlay
        || (editor.nodeSelectionOverlay = editor.morphicOverlayCreate());
    if (node) {
      o.state.node = node;
      var nodeRange = editor.astNodeRange(node);
      nodeRange && nodeRange.end.column;
      o.setAtRange(editor, nodeRange, nodeRange.start.row !== nodeRange.end.row);
    }
    return o;
  },

  getVisibleNodeSelectionOverlay: function(editor) {
    var o = editor.nodeSelectionOverlay;
    return o && o.owner === editor ? o : null;
  },

  astNodesAtGlobalPos: function(editor, pos) {
    var ast = editor.getSession().$ast,
        docPos = editor.morphicPosToDocPos(pos),
        idx = editor.positionToIndex(docPos),
        nodes = lively.ast.nodesAt(idx, ast);
    return nodes;
  },

  astNodeAtGlobalPos: function(editor, pos) {
    return lively.ide.codeeditor.DraggableCode.astNodesAtGlobalPos(editor, pos).last();
  },

  astNodeAtEvt: function(editor, evt) {
    return lively.ide.codeeditor.DraggableCode.astNodeAtGlobalPos(editor, evt.getPosition());
  },

  onMouseMove: function(editor, aceEvt) {
    var evt = aceEvt.domEvent;
    if ($world.currentMenu || !editor.getSession().$ast) return;
    if ($world.hands[0].carriesGrabbedMorphs || !editor.getSelectionRangeAce().isEmpty()) {
      var overlay = lively.ide.codeeditor.DraggableCode.getVisibleNodeSelectionOverlay(editor);
      overlay && overlay.remove();
      return false;
    }

    var node = lively.ide.codeeditor.DraggableCode.astNodeAtEvt(editor, evt);
    node && lively.ide.codeeditor.DraggableCode.ensureNodeSelectionOverlay(editor, node);
    return !!node;
  },

  onMouseUp: function(editor, aceEvt) {
    if (!editor.getSession().$ast) return false;
    var evt = aceEvt.domEvent;
    var overlay = lively.ide.codeeditor.DraggableCode.getVisibleNodeSelectionOverlay(editor);
    if (!overlay || !overlay.innerBounds().expandBy(10).containsPoint(evt.getPositionIn(overlay))) {
      overlay && overlay.remove();
      return false;
    }

    var range = editor.astNodeRange(overlay.state.node);
    // delayed so that it doesn't interfere with mouse up selection
    (function() { editor.setSelectionRangeAce(range); overlay.remove(); }).delay(0);
    evt.stop(); return true;
  },

  codeEditorMenuItems: function(editor, items) {
    if (!editor.getSession().$ast) return items;
    items.unshift({isMenuItem: true, isDivider: true});
    items.unshift(["clone", function() { lively.ide.codeeditor.DraggableCode.makeAndGrabTileForNode(editor, true); }]);
    items.unshift(["grab", function() { lively.ide.codeeditor.DraggableCode.makeAndGrabTileForNode(editor); }]);
    return items;
  },

  makeAndGrabTileForNode: function(editor, dontRemove) {

    var extractionRange;
    var overlay = lively.ide.codeeditor.DraggableCode.getVisibleNodeSelectionOverlay(editor);
    var node = overlay && overlay.state.node;

    if (node) {
      extractionRange = editor.astNodeRange(node);
    } else {
      var selRange = editor.getSelectionRangeAce();
      if (selRange.isEmpty()) {
        selRange = editor.getLineRange(selRange.start.row, true);
        // trim line
        var lineString = editor.getTextRange(selRange);
        var spacesFront = lineString.match(/^\s*/)[0].length;
        var spacesEnd = lineString.match(/\s*$/)[0].length;
        selRange.start.column += spacesFront;
        selRange.end.column -= spacesEnd;
      }

      var selectionString = editor.getTextRange(selRange);
      try {
        lively.ast.parse(selectionString);
        extractionRange = selRange;
      } catch (e) {
        var ast = editor.getSession().$ast;
        var nodesStart = lively.ast.nodesAt(editor.positionToIndex(selRange.start), ast)
        var nodesEnd = lively.ast.nodesAt(editor.positionToIndex(selRange.end), ast)
        var selNode = nodesStart.intersect(nodesEnd).last()
        extractionRange = editor.astNodeRange(selNode);
      }
    }

    editor.setSelectionRangeAce(extractionRange);
    var sess = editor.getSession();
    var code = editor.getTextRange(extractionRange);
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forCode(code, {});
    var dragged = lively.morphic.DraggableJavaScript.createDragItemAndGrabIt(code, dropjs);
    document.execCommand("copy");

    if (dontRemove) return;
    if (extractionRange.start.column === 0 && extractionRange.start.row > 0) {
      extractionRange.start.row--;
      extractionRange.start.column = sess.getLine(extractionRange.start.row).length;
    }
    var undo = {
      deltas: [{
        action: "remove",
        start: extractionRange.start,
        end: extractionRange.end,
        codeEditor: editor,
        lines: code.split("\n"),
        session: sess
    }], group: "doc"};
    var doc = sess.getUndoManager().$doc;

    sess.getUndoManager().execute({args: [[undo], doc]})
    sess.remove(extractionRange)

    // if (document.execCommand("copy")) {
    //   var sess = this.getSession();
    //   var doc = this.getSession().getUndoManager().$doc;
    //   sess.getUndoManager().execute({args: [[undo], doc]})
    //   sess.getUndoManager().reset()
    // } else {

    // }

    // if (!document.execCommand("cut")) this.aceEditor.execCommand("cut");
  }

});


}) // end of module
