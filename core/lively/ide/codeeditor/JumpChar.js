module('lively.ide.codeeditor.JumpChar').requires('lively.ide.codeeditor.TextOverlay').toRun(function() {
"use strict";

/*
 * The jump-char plugin allows the user to directly jump to any visible
 * character in a codeeditor. It works by activating the jump-char using Cmd+j.
 * The user is asked to press the character he wants to jump to. If there is only
 * one occurrence of this character in the visible area of the editor, the cursor
 * is directly moved to it. If there are more occurrences a text overlay will
 * appear, showing characters a-z. Pressing any of the overlayed keys will narrow
 * down the possibilities. This repeats until a single occurrence can be selected.
 *
 */

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// editor interaction

function forward(pos) {
    return {column: pos.column + 1, row: pos.row};
}

function jumpToOccurence(editor, occ) {
    // jumps to occurrence, if selection / emacs mark active selects to position
    // not we actually place the cursor to occ+1
    var pos = editor.getCursorPosition();
    if (editor.pushEmacsMark) editor.pushEmacsMark(pos, false);
    var method = editor.emacsMark && editor.emacsMark() ?
        'selectToPosition' : 'moveCursorToPosition';
    editor.selection[method](forward(occ));
}

function visibleRange(editor) {
    var firstRow = editor.renderer.getFirstFullyVisibleRow(),
        lastRow  = editor.renderer.getLastFullyVisibleRow(),
        lastCol  = editor.session.getScreenLastRowColumn(lastRow);

    return {
        start: {row: firstRow, column: 0},
        end: {row: lastRow, column: lastCol}
    };
}

function highlightJumpTargets(editor, kbd, jumpGroups) {
    // installs text overlays each occurrence in every jumpgroup
    jumpGroups.forEach(function(jumpGroup) {
        jumpGroup.occurrences.forEach(function(occ) {
            editor.$morph.addTextOverlay({
                text: jumpGroup.key,
                classNames: ['jump-char-overlay'],
                start: occ});
        });
    });
    var c1 = jumpGroups.first().key, c2 =jumpGroups.last().key;
    editor.showCommandLine('Press a key between ' + c1 + ' and ' + c2);
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// computing jump-stuff

/*
 * data JumpGroup = {range :: Range
 *                  ,key :: Char
 *                  ,occurrences :: [Position]}
 *
 * data SelectionKeys = [Char]
 *
 */

function findOccurrencesOf(editor, range, key) {
    // findOccurrencesOf :: Editor -> Range -> Char -> [Position]
    var occRange = {start: range.start, end: {row: range.end.row, column: range.end.column+1}}
    var string = editor.session.getTextRange(occRange),
        lines = Strings.lines(string);

    return lines.reduce(function(occurrences, line, row) {
        var absRow = range.start.row + row,
            chars = line.split(""),
            startCol = row === 0 ? range.start.column : 0;
        return occurrences.concat(chars.reduce(function(occurrences, cha, col) {
            cha === key && occurrences.push({row: absRow, column: col + startCol});
            return occurrences;
        }, []));
    }, []);
}

function buildJumpGroups(editor, range, key, selectionKeys) {
    // buildJumpGroups :: Editor -> Range -> Char -> SelectionKeys -> [JumpGroup]
    var occurrences = findOccurrencesOf(editor, range, key),
        occPerGroup = Math.ceil(occurrences.length / selectionKeys.length),
        groupedOccurrences = occurrences.toTuples(occPerGroup);
    return selectionKeys.slice(0, groupedOccurrences.length).zip(groupedOccurrences).map(function(ea) {
        return {
            key: ea[0],
            occurrences: ea[1],
            range: {start: ea[1].first(), end: ea[1].last()}
        }
    })
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// jump-char handler has two states:
// - first we need to find out what char we want to jump to. This is handled by
//   readingCharToFind. If there is no or only one occurrence of char, directly
//   jump to it and uninstall the key handler
// - otherwise highlight (via textoverlays) all possible jump occurrences. By
//   default we anly let the user choose max 26 (a-z) jump locations. If there are
//   more occurrences we group all the occurences into 26 "JumpGroups", each getting
//   a char between a-z assigned. Pressing a key narrows down the possible range in
//   which the selection can occur. This happens recursively until we have a single
//   occurence choosen.

function readingCharToFind(editor, kbd, key, hashId) {
    // shift = hashId 4
    if ((hashId === 0 && key !== 'esc' && key !== 'backspace') || hashId === 4) {
         return {command: 'null', passEvent: true};
    }

    if (!key || hashId !== -1) {
        editor.keyBinding.removeKeyboardHandler(kbd);
        return null;
    }

    // [a-z]
    var selectionKeys = Array.range(97, 97+25).map(function(n) { return String.fromCharCode(n); }),
        jumpGroups = buildJumpGroups(editor, visibleRange(editor), key, selectionKeys)

    kbd.state = {
        step: 'selectingTargetChar',
        level: 1,
        charToFind: key,
        jumpGroups: jumpGroups,
        selectionKeys: selectionKeys
    };

    if (!jumpGroups || !jumpGroups.length) {
        editor.showCommandLine("key " + key + " not visible");
        editor.keyBinding.removeKeyboardHandler(kbd);
    } else if (jumpGroups.length === 1 && jumpGroups[0].occurrences.length === 1) {
        jumpToOccurence(editor, jumpGroups[0].occurrences[0]);
        editor.keyBinding.removeKeyboardHandler(kbd);
    } else {
        highlightJumpTargets(editor, kbd, jumpGroups);
    }

    return {command: 'null'};
}

function selectingTargetChar(editor, kbd, key) {
    var jumpGroups = kbd.state.jumpGroups;
    if (!kbd.state.selectionKeys.include(key)) { // some other key pressed, abort
        editor.keyBinding.removeKeyboardHandler(kbd);
        return {command: 'null'};
    }

    var jumpGroup = jumpGroups.detect(function(jumpGroup) {
        return jumpGroup.key === key; });

    if (!jumpGroup) return {command: 'null'}; // try again

    var occ = jumpGroup.occurrences;

    if (!occ.length) {
        editor.showCommandLine('selected jumpGroup has no occurrences?\nSomething is wrong...');
        editor.keyBinding.removeKeyboardHandler(kbd);
        return {command: 'null'};
    }

    if (occ.length === 1) { // we are done
        jumpToOccurence(editor, occ[0]);
        editor.keyBinding.removeKeyboardHandler(kbd);
        return {command: 'null'};
    }

    // narrow down on jumpGroup
    var charToFind = kbd.state.charToFind,
        nextJumpGroups = buildJumpGroups(editor, jumpGroup.range, charToFind, kbd.state.selectionKeys);

    if (!nextJumpGroups.length) {
        editor.showCommandLine('Could not compute next jump group?\nSomething is wrong...');
        editor.keyBinding.removeKeyboardHandler(kbd);
        return {command: 'null'};
    }

    kbd.state = {
        step: 'selectingTargetChar',
        level: kbd.state.level+1,
        charToFind: charToFind,
        jumpGroups: nextJumpGroups,
        selectionKeys: kbd.state.selectionKeys
    }

    editor.$morph.removeTextOverlay();
    highlightJumpTargets(editor, kbd, nextJumpGroups);

    return {command: 'null'};
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// jumpChar is the code editor command that can be executed as an interactive
// command

function jumpChar(editor, options) {
    var kbd = editor.getKeyboardHandler();
    if (kbd.isJumpChar) return;

    editor.showCommandLine('Choose jump location: Press a character');

    var HashHandler = lively.ide.ace.require("ace/keyboard/hash_handler").HashHandler,
        jumpCharHandler = new HashHandler();

    jumpCharHandler.isJumpChar = true;
    jumpCharHandler.debug = false;

    jumpCharHandler.state = {
        step: 'readingCharToFind',
    };

    jumpCharHandler.handleKeyboard = function(data, hashId, key, keyCode) {
        if (this.state.step === 'readingCharToFind') {
            return readingCharToFind(editor, this, key, hashId);
        } else if (this.state.step === 'selectingTargetChar') {
            return selectingTargetChar(editor, this, key);
        } else {
            editor.keyBinding.removeKeyboardHandler(this);
            return null;
        }
    }

    jumpCharHandler.attach = function(editor) {
        jumpCharHandler.debug && show('jumpChar installed');
    }

    jumpCharHandler.detach = function(editor) {
        jumpCharHandler.debug && show('jumpChar uninstalled');
        editor.$morph.removeTextOverlay();
    }

    editor.keyBinding.addKeyboardHandler(jumpCharHandler);
}

Object.extend(lively.ide.codeeditor.JumpChar, {
    setup: function(keyboardHandler) {
        keyboardHandler.addCommands([{
            name: 'jumpChar',
            exec: jumpChar,
            bindKey: {win: 'Ctrl-J',  mac: 'Command-j'},
        }]);
    }
});

(function setupCSS() {
    var css = ".jump-char-overlay {\n"
            + "    z-index: 999;\n"
            + "    font-family: Monaco, monospace;\n"
            + "    font-size: 11px;\n"
            + "    position: absolute;\n"
            + "    color: white;\n"
            + "    background: steelblue;\n"
            + "    padding: 1px;\n"
            + "    border-radius: 0;\n"
            + "    box-shadow: none;\n"
            + "    white-space: pre;\n"
            + "}\n"
            + ".jump-char-overlay.hidden {\n"
            + "    display: none;\n"
            + "}\n"
            + ".emacs-mode .ace_text-layer {\n"
            + "    z-index: 1 !important;\n"
            + "}\n"
    XHTMLNS.addCSSDef(css, 'lively.ide.JumpCharOverlay');
})();

}) // end of module
