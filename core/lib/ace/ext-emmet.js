ace.define("ace/ext/emmet",["require","exports","module","ace/keyboard/hash_handler","ace/editor","ace/snippets","ace/range","resources","resources","range","tabStops","resources","utils","actions","ace/config","ace/config"], function(require, exports, module) {
"use strict";
var HashHandler = require("ace/keyboard/hash_handler").HashHandler;
var Editor = require("ace/editor").Editor;
var snippetManager = require("ace/snippets").snippetManager;
var Range = require("ace/range").Range;
var emmet, emmetPath;
function AceEmmetEditor() {}

AceEmmetEditor.prototype = {
    setupContext: function(editor) {
        this.ace = editor;
        this.indentation = editor.session.getTabString();
        if (!emmet)
            emmet = window.emmet;
        emmet.require("resources").setVariable("indentation", this.indentation);
        this.$syntax = null;
        this.$syntax = this.getSyntax();
    },
    getSelectionRange: function() {
        var range = this.ace.getSelectionRange();
        var doc = this.ace.session.doc;
        return {
            start: doc.positionToIndex(range.start),
            end: doc.positionToIndex(range.end)
        };
    },
    createSelection: function(start, end) {
        var doc = this.ace.session.doc;
        this.ace.selection.setRange({
            start: doc.indexToPosition(start),
            end: doc.indexToPosition(end)
        });
    },
    getCurrentLineRange: function() {
        var ace = this.ace;
        var row = ace.getCursorPosition().row;
        var lineLength = ace.session.getLine(row).length;
        var index = ace.session.doc.positionToIndex({row: row, column: 0});
        return {
            start: index,
            end: index + lineLength
        };
    },
    getCaretPos: function(){
        var pos = this.ace.getCursorPosition();
        return this.ace.session.doc.positionToIndex(pos);
    },
    setCaretPos: function(index){
        var pos = this.ace.session.doc.indexToPosition(index);
        this.ace.selection.moveToPosition(pos);
    },
    getCurrentLine: function() {
        var row = this.ace.getCursorPosition().row;
        return this.ace.session.getLine(row);
    },
    replaceContent: function(value, start, end, noIndent) {
        if (end == null)
            end = start == null ? this.getContent().length : start;
        if (start == null)
            start = 0;        
        
        var editor = this.ace;
        var doc = editor.session.doc;
        var range = Range.fromPoints(doc.indexToPosition(start), doc.indexToPosition(end));
        editor.session.remove(range);
        
        range.end = range.start;
        
        value = this.$updateTabstops(value);
        snippetManager.insertSnippet(editor, value);
    },
    getContent: function(){
        return this.ace.getValue();
    },
    getSyntax: function() {
        if (this.$syntax)
            return this.$syntax;
        var syntax = this.ace.session.$modeId.split("/").pop();
        if (syntax == "html" || syntax == "php") {
            var cursor = this.ace.getCursorPosition();
            var state = this.ace.session.getState(cursor.row);
            if (typeof state != "string")
                state = state[0];
            if (state) {
                state = state.split("-");
                if (state.length > 1)
                    syntax = state[0];
                else if (syntax == "php")
                    syntax = "html";
            }
        }
        return syntax;
    },
    getProfileName: function() {
        switch(this.getSyntax()) {
          case "css": return "css";
          case "xml":
          case "xsl":
            return "xml";
          case "html":
            var profile = emmet.require("resources").getVariable("profile");
            if (!profile)
                profile = this.ace.session.getLines(0,2).join("").search(/<!DOCTYPE[^>]+XHTML/i) != -1 ? "xhtml": "html";
            return profile;
        }
        return "xhtml";
    },
    prompt: function(title) {
        return prompt(title);
    },
    getSelection: function() {
        return this.ace.session.getTextRange();
    },
    getFilePath: function() {
        return "";
    },
    $updateTabstops: function(value) {
        var base = 1000;
        var zeroBase = 0;
        var lastZero = null;
        var range = emmet.require('range');
        var ts = emmet.require('tabStops');
        var settings = emmet.require('resources').getVocabulary("user");
        var tabstopOptions = {
            tabstop: function(data) {
                var group = parseInt(data.group, 10);
                var isZero = group === 0;
                if (isZero)
                    group = ++zeroBase;
                else
                    group += base;

                var placeholder = data.placeholder;
                if (placeholder) {
                    placeholder = ts.processText(placeholder, tabstopOptions);
                }

                var result = '${' + group + (placeholder ? ':' + placeholder : '') + '}';

                if (isZero) {
                    lastZero = range.create(data.start, result);
                }

                return result;
            },
            escape: function(ch) {
                if (ch == '$') return '\\$';
                if (ch == '\\') return '\\\\';
                return ch;
            }
        };

        value = ts.processText(value, tabstopOptions);

        if (settings.variables['insert_final_tabstop'] && !/\$\{0\}$/.test(value)) {
            value += '${0}';
        } else if (lastZero) {
            value = emmet.require('utils').replaceSubstring(value, '${0}', lastZero);
        }
        
        return value;
    }
};


var keymap = {
    expand_abbreviation: {"mac": "ctrl+alt+e", "win": "alt+e"},
    match_pair_outward: {"mac": "ctrl+d", "win": "ctrl+,"},
    match_pair_inward: {"mac": "ctrl+j", "win": "ctrl+shift+0"},
    matching_pair: {"mac": "ctrl+alt+j", "win": "alt+j"},
    next_edit_point: "alt+right",
    prev_edit_point: "alt+left",
    toggle_comment: {"mac": "command+/", "win": "ctrl+/"},
    split_join_tag: {"mac": "shift+command+'", "win": "shift+ctrl+`"},
    remove_tag: {"mac": "command+'", "win": "shift+ctrl+;"},
    evaluate_math_expression: {"mac": "shift+command+y", "win": "shift+ctrl+y"},
    increment_number_by_1: "ctrl+up",
    decrement_number_by_1: "ctrl+down",
    increment_number_by_01: "alt+up",
    decrement_number_by_01: "alt+down",
    increment_number_by_10: {"mac": "alt+command+up", "win": "shift+alt+up"},
    decrement_number_by_10: {"mac": "alt+command+down", "win": "shift+alt+down"},
    select_next_item: {"mac": "shift+command+.", "win": "shift+ctrl+."},
    select_previous_item: {"mac": "shift+command+,", "win": "shift+ctrl+,"},
    reflect_css_value: {"mac": "shift+command+r", "win": "shift+ctrl+r"},

    encode_decode_data_url: {"mac": "shift+ctrl+d", "win": "ctrl+'"},
    expand_abbreviation_with_tab: "Tab",
    wrap_with_abbreviation: {"mac": "shift+ctrl+a", "win": "shift+ctrl+a"}
};

var editorProxy = new AceEmmetEditor();
exports.commands = new HashHandler();
exports.runEmmetCommand = function(editor) {
    editorProxy.setupContext(editor);
    if (editorProxy.getSyntax() == "php")
        return false;
    var actions = emmet.require("actions");

    if (this.action == "expand_abbreviation_with_tab") {
        if (!editor.selection.isEmpty())
            return false;
    }
    
    if (this.action == "wrap_with_abbreviation") {
        return setTimeout(function() {
            actions.run("wrap_with_abbreviation", editorProxy);
        }, 0);
    }
    
    var pos = editor.selection.lead;
    var token = editor.session.getTokenAt(pos.row, pos.column);
    if (token && /\btag\b/.test(token.type))
        return false;
    
    try {
        var result = actions.run(this.action, editorProxy);
    } catch(e) {
        editor._signal("changeStatus", typeof e == "string" ? e : e.message);
        console.log(e);
        result = false;
    }
    return result;
};

for (var command in keymap) {
    exports.commands.addCommand({
        name: "emmet:" + command,
        action: command,
        bindKey: keymap[command],
        exec: exports.runEmmetCommand,
        multiSelectAction: "forEach"
    });
}

exports.updateCommands = function(editor, enabled) {
    if (enabled) {
        editor.keyBinding.addKeyboardHandler(exports.commands);
    } else {
        editor.keyBinding.removeKeyboardHandler(exports.commands);
    }
};

exports.isSupportedMode = function(modeId) {
    return modeId && /css|less|scss|sass|stylus|html|php|twig/.test(modeId);
};

var onChangeMode = function(e, target) {
    var editor = target;
    if (!editor)
        return;
    var enabled = exports.isSupportedMode(editor.session.$modeId);
    if (e.enableEmmet === false)
        enabled = false;
    if (enabled) {
        if (typeof emmetPath == "string") {
            require("ace/config").loadModule(emmetPath, function() {
                
            });
            emmetPath = null;
        }
    }
    exports.updateCommands(editor, enabled);
};

exports.AceEmmetEditor = AceEmmetEditor;
require("ace/config").defineOptions(Editor.prototype, "editor", {
    enableEmmet: {
        set: function(val) {
            this[val ? "on" : "removeListener"]("changeMode", onChangeMode);
            onChangeMode({enableEmmet: !!val}, this);
        },
        value: true
    }
});

exports.setCore = function(e) {
    if (typeof e == "string")
       emmetPath = e;
    else
       emmet = e;
};
});
                (function() {
                    ace.require(["ace/ext/emmet"], function() {});
                })();
            