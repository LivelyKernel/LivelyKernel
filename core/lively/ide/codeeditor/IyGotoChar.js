module('lively.ide.codeeditor.IyGotoChar').requires().toRun(function() {

Object.extend(lively.ide.codeeditor.IyGotoChar, {

  setupIyGoToChar: function(keyboardHandler) {
    var debug = false;
    function iyGoToChar(editor, options) {
        var kbd = editor.getKeyboardHandler();
        if (kbd.isIyGoToChar) return;

        var HashHandler = lively.ide.ace.require("ace/keyboard/hash_handler").HashHandler,
            iyGoToCharHandler = new HashHandler();

        iyGoToCharHandler.isIyGoToChar = true;

        iyGoToCharHandler.handleKeyboard = function(data, hashId, key, keyCode) {
            // first invocation: if a key is pressed remember this char as the char
            // to search for
            // subsequent invocations: when the same char is pressed, move to the
            // next found location of that char, other wise deactivate this mode

            // shift key or raw event
            debug && show("hashId: %s, key: %s", hashId, key);
            // shift = hashId 4
            if ((hashId === 0 && key !== 'esc' && key !== 'backspace') || hashId === 4) return {command: 'null', passEvent: true};
            if (!this.charToFind) {
                if (key && hashId === -1) {
                    this.charToFind = key;
                } else {
                    editor.keyBinding.removeKeyboardHandler(this);
                    return null;
                }
            }
            if (key !== this.charToFind) {
                debug && show('input was %s and not %s, exiting', key, this.charToFind);
                editor.keyBinding.removeKeyboardHandler(this);
                return null;
            }
            return {
                command: iyGoToCharHandler.commands.moveForwardTo,
                args: {backwards: options.backwards, needle: key, preventScroll: true, wrap: false}};
        }

        iyGoToCharHandler.attach = function(editor) {
            debug && show('iygotochar installed');
            this.$startPos = editor.getCursorPosition();
        }
        iyGoToCharHandler.detach = function(editor) {
            debug && show('iygotochar uninstalled');
            if (this.$startPos && editor.pushEmacsMark) editor.pushEmacsMark(this.$startPos, false);
        }

        iyGoToCharHandler.addCommands([{
            name: 'moveForwardTo',
            exec: function(ed, options) {
                var sel = ed.selection, range = sel.getRange();
                if (options.backwards) sel.moveCursorLeft();
                options.start = sel.getSelectionLead();
                var foundRange = ed.find(options);
                if (!foundRange) {
                    if (options.backwards) sel.moveCursorRight();
                    return;
                }
                var hasSel = ed.emacsMark ? !!ed.emacsMark() : !sel.selection.isEmpty();
                var start, end;
                if (!hasSel) { start = foundRange.end, end = foundRange.end }
                else {
                    start = options.backwards ? foundRange.start : range.start;
                    end = options.backwards ? range.end : foundRange.end
                }
                var newRange = foundRange.constructor.fromPoints(start, end);
                sel.setRange(newRange, options.backwards);
            },
            multiSelectAction: 'forEach',
            readOnly: true
        }]);
        editor.keyBinding.addKeyboardHandler(iyGoToCharHandler);
    }

    function iyGoToCharBackwards(editor, args) {
        iyGoToChar(editor, {backwards: true});
    }

    keyboardHandler.addCommands([{name: 'iyGoToChar', exec: iyGoToChar, readOnly: true}]);
    keyboardHandler.addCommands([{name: 'iyGoToCharBackwards', exec: iyGoToCharBackwards, readOnly: true}]);
    if (keyboardHandler.platform === "mac") {
      keyboardHandler.bindKeys({"CMD-.": "iyGoToChar"});
      keyboardHandler.bindKeys({"CMD-,": "iyGoToCharBackwards"});
    } else {
      keyboardHandler.bindKeys({"c-.": "iyGoToChar"});
      keyboardHandler.bindKeys({"c-,": "iyGoToCharBackwards"});
    }
  }

});

}) // end of module
