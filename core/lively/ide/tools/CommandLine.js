module('lively.ide.tools.CommandLine').requires('lively.persistence.BuildSpec', "lively.ide.CodeEditor").toRun(function() {

lively.BuildSpec('lively.ide.tools.CommandLine', {
    name: "CommandLine",
    className: "lively.morphic.CodeEditor",
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

    commandLineInput: function commandLineInput(text) {
        if (text.length > 0) this.addCommandToHistory(text);
        lively.bindings.signal(this, 'input', text);
        // for compatibility with old texts:
        lively.bindings.signal(this, 'savedTextString', text);
        this.clearOnInput && this.clear();
    },

    showHistItem: function showHistItem(dir) {
        dir = dir || 'next';
        var hist = this.commandHistory, items = hist.items, len = items.length-1, i = hist.index;
        if (!Numbers.between(i, 0, len-1)) hist.index = i = len;
        if (this.textString !== items[i]) { this.textString = items[i]; return; }
        if (dir === 'next') {
            if (i >= len) return;
            i = ++hist.index;
        } else {
            if (i <= 0) return;
            i = --hist.index;
        }
        this.textString = items[i];
    },

    showNextCommand: function showNextCommand() {
        this.showHistItem('next');
    },

    showPrevCommand: function showPrevCommand() {
        this.showHistItem('prev');
    },

    onKeyDown: function onKeyDown(evt) {
        var sig = evt.getKeyString();
        switch(sig) {
            case 'Enter': this.commandLineInput(this.textString); evt.stop(); return true;
            case 'Up':
            case 'Control-Up':
            case 'Control-P': this.showPrevCommand(); this.focus(); evt.stop(); return true;
            case 'Down':
            case 'Control-N':
            case 'Control-Down': this.showNextCommand(); this.focus(); evt.stop(); return true;
            case 'Esc':
            case 'Control-C':
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
        this.onFromBuildSpecCreated();
    },
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.withAceDo(function(ed) { this.initCommandLine(ed); });
        this.reset();
    }
});

}) // end of module