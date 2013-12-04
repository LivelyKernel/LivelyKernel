module('lively.ide.tools.CommandLine').requires('lively.persistence.BuildSpec', "lively.ide.CodeEditor").toRun(function() {

lively.BuildSpec('lively.ide.tools.CommandLine', {
    name: "CommandLine",
    className: "lively.morphic.CodeEditor",
    theme: Config.get('aceDefaultTheme'),
    _ShowGutter: false,
    style: {
        gutter: false,
        enableGrabbing: false,
        enableDragging: false,
        clipMode: 'hidden',
        fontSize: 12
    },
    _Extent: pt(300, 18),
    clearOnInput: true,
    addCommandToHistory: function addCommandToHistory(cmd) {
        var hist = this.commandHistory,
            items = hist.items;
        if (items.last() === cmd) return;
        items.push(cmd);
        if (items.length > hist.max) {
            hist.items = items = items.slice(-hist.max);
        }
        hist.index = items.length - 1;
    },

    browseHistory: function browseHistory() {
        var cmdL = this;
        var items = this.commandHistory.items.map(function(item, i) {
            return {isListItem: true, string: item, value: i}
        }).reverse();
        lively.ide.tools.SelectionNarrowing.chooseOne(items, function(err, i) {
            Object.isNumber(i) && cmdL.setAndShowHistItem(i);
            cmdL.focus.bind(cmdL).delay(0);
        });
    },

    commandLineInput: function commandLineInput(text) {
        if (text.length > 0) this.addCommandToHistory(text);
        lively.bindings.signal(this, 'input', text);
        // for compatibility with old texts:
        lively.bindings.signal(this, 'savedTextString', text);
        this.clearOnInput && this.clear();
    },

    clear: function clear() {
        $super();
        if (this.labelString) this.textString = this.labelString;
    },

    focus: function focus() {
        if (this.labelString) {
            var p = this.getCursorPositionAce();
            if (p && p.row === 0 && p.column < this.labelString.length) {
                p.column = this.labelString.length;
                this.withAceDo(function(ed) { ed.moveCursorToPosition(p); })
            }
        }
        var win = this.getWindow();
        win && (win.targetMorph.lastFocused = this);
        return $super();
    },

    getInput: function getInput() {
        var input = this.textString;
        if (this.labelString && input.indexOf(this.labelString) === 0) {
            input = input.slice(this.labelString.length);
        }
        return input;
    },

    setInput: function setInput(text) {
        if (this.labelString) text = this.labelString + text;
        return this.textString = text;
    },

    initializeAce: function initializeAce() {
        this.withAceDo(function(ed) { this.makeEditorLabelAware(ed); });
        lively.bindings.connect(this, 'textString', this, 'inputChanged', {
            converter: function(string) { return this.sourceObj.getInput(); }
        });
        return $super();
    },

    makeEditorLabelAware: function makeEditorLabelAware(ed) {
        function offsetColumnForLabel(session, row, column) {
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            var labelString = session.labelString;
            if (!labelString || row !== 0) return column;
            var lineString = session.getDisplayLine(row, null, 0, 0);
            if (lineString.startsWith(labelString) && column < labelString.length) {
                column = labelString.length;
            }
            return column;
        }

        ed.selection.moveCursorTo = ed.selection.moveCursorTo.wrap(function(proceed, row, column, keepDesiredColumn) {
            column = offsetColumnForLabel(this.session, row, column);
            return proceed(row, column, keepDesiredColumn);
        });

        ed.selection.setSelectionAnchor = ed.selection.setSelectionAnchor.wrap(function(proceed,row, column) {
            column = offsetColumnForLabel(this.session, row,column);
            return proceed(row, column);
        });
    },

    setLabel: function setLabel(labelString) {
        var textString = this.textString;
        if (this.labelString && this.textString.indexOf(this.labelString) === 0) {
            textString = textString.slice(this.labelString.length);
        }
        this.labelString = labelString;
        this.withAceDo(function(ed) { ed.session.labelString = labelString; });
        this.setInput(textString);
    },

    setAndShowHistItem: function setAndShowHistItem(idx) {
    var hist = this.commandHistory, items = hist.items, len = items.length-1, i = idx;
    if (!Numbers.between(i, 0, len+1)) hist.index = i = len;
    else hist.index = i;
    if (this.getInput() !== items[i] && typeof items[i] !== 'undefined') this.setInput(items[i]);
},

    showHistItem: function showHistItem(dir) {
        dir = dir || 'next';
        var hist = this.commandHistory, items = hist.items, len = items.length-1, i = hist.index;
        if (!Numbers.between(i, 0, len+1)) hist.index = i = len;
        if (this.getInput() !== items[i] && typeof items[i] !== 'undefined') { this.setInput(items[i]); return; }
        if (dir === 'next') {
            if (i > len) return;
            i = ++hist.index;
        } else {
            if (i <= 0) return;
            i = --hist.index;
        }
        this.setInput(items[i] || '');
    },

    showNextCommand: function showNextCommand() {
        this.showHistItem('next');
    },

    showPrevCommand: function showPrevCommand() {
        this.showHistItem('prev');
    },

    onKeyDown: function onKeyDown(evt) {
        if (this.showsCompleter()) return $super(evt);
        var sig = evt.getKeyString();
        switch(sig) {
            case 'Enter': this.commandLineInput(this.getInput()); evt.stop(); return true;
            case 'Up':
            case 'Control-Up':
            case 'Alt-P': this.showPrevCommand(); this.focus(); evt.stop(); return true;
            case 'Down':
            case 'Alt-å': // "Alt-N"
            case 'Control-Down': this.showNextCommand(); this.focus(); evt.stop(); return true;
            case 'Alt-H': this.browseHistory(); evt.stop(); return true;
            case 'Esc':
            case 'Control-G': this.clear(); evt.stop(); return true;
            default: return $super(evt);        
        }
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // init
    initCommandLine: function initCommandLine(ed) {
        this.isCommandLine = true;
        ed.renderer.scrollBar.element.style.display = 'none';
        ed.renderer.scrollBar.width = 0;
        ed.resize(true);
    },
    reset: function reset() {
        this.commandHistory = {items: [], max: 30, index: 0};
        this.connections = {input: {}};
    },
    onLoad: function onLoad() {
        $super();
        this.withAceDo(function(ed) { this.initCommandLine(ed); });
    },
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.reset();
    }
});

Object.extend(lively.ide.tools.CommandLine, {
    histories: {},
    get: function(id) {
        var cmdLine = lively.BuildSpec('lively.ide.tools.CommandLine').createMorph();
        if (id) cmdLine.commandHistory = this.getHistory(id);
        return cmdLine;
    },
    getHistory: function(id) {
        if (!this.histories[id]) this.histories[id] = {items: [], max: 30, index: 0};
        return this.histories[id];
    }
});

}) // end of module