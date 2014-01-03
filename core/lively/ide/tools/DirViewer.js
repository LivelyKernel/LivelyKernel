module('lively.ide.tools.DirViewer').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.DirViewer', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(498.8,476.0),
    _Position: lively.pt(879.0,66.0),
    _StyleClassNames: ["Morph","Window"],
    cameForward: false,
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(3.0,22.0),
    doNotSerialize: ["highlighted","cameForward"],
    draggingEnabled: true,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "DirViewer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(492.8,451.0),
        _Fill: Color.rgb(245,245,245),
        _Position: lively.pt(3.0,22.0),
        _StyleClassNames: ["Morph","Box"],
        _StyleSheet: ".list-item {\n\
    	font-family: Monaco, monospace                   !important;\n\
    }\n\
    \n\
    .list-item.directory {\n\
    	font-style: italic;\n\
    }\n\
    \n\
    .list-item.file {\n\
    	font-weight: normal;\n\
    }",
        className: "lively.morphic.Box",
        dirState: {
            files: [],
            filter: null,
            path: null,
            sortKey: "name"
        },
        doNotCopyProperties: [],
        doNotSerialize: [],
        droppingEnabled: true,
        isCopyMorphRef: true,
        lastFocused: {
            isMorphRef: true,
            name: "targetDir"
        },
        layout: {
            borderSize: 7.89,
            extentWithoutPlaceholder: lively.pt(492.8,452.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 4.24,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        morphRefId: 1,
        name: "DirViewer",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _AutocompletionEnabled: true,
            _Extent: lively.pt(477.0,18.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(7.9,7.9),
            _ShowActiveLine: false,
            _ShowErrors: true,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _ShowWarnings: true,
            _SoftTabs: true,
            _TextMode: "text",
            _Theme: "chrome",
            _aceInitialized: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            clearOnInput: false,
            commandHistory: {
                index: 10,
                items: ["users","user","/Users/robert/Dropbox/Projects/LivelyKernel","/Users/robert/Dropbox/Projects/LivelyKernel/core","/Users/robert/Dropbox/Projects/LivelyKernel/core/lively/bindings","/Users/robert/Dropbox/Projects/LivelyKernel/core","/Users/robert/Dropbox/Projects/LivelyKernel/","/Users/robert/Dropbox/Projects/LivelyKernel","/Users/robert/Projects","/Users/robert/","/Users/robert/Dropbox/Projects/LivelyKernel"],
                max: 30
            },
            connections: {
                input: {}
            },
            doNotCopyProperties: [],
            doNotSerialize: ["whenOpenedInWorldCallbacks"],
            hasRobertsKeys: true,
            inputChanged: "",
            isCommandLine: true,
            layout: {
                resizeWidth: true
            },
            name: "targetDir",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            storedTextString: "",
            style: {
                clipMode: "hidden",
                enableDragging: false,
                enableGrabbing: false,
                fontSize: 12,
                gutter: false
            },
            submorphs: [],
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
            clear: function clear() {
                $super();
                if (this.labelString) this.textString = this.labelString;
            },
            commandLineInput: function commandLineInput(text) {
                if (text.length > 0) this.addCommandToHistory(text);
                lively.bindings.signal(this, 'input', text);
                // for compatibility with old texts:
                lively.bindings.signal(this, 'savedTextString', text);
                this.clearOnInput && this.clear();
            },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "textString", this, "inputChanged", {converter: 
        function (string) { return this.sourceObj.getInput(); }});
            lively.bindings.connect(this, "input", this.get("DirViewer"), "goto", {});
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
            initCommandLine: function initCommandLine(ed) {
                this.isCommandLine = true;
                ed.renderer.scrollBar.element.style.display = 'none';
                ed.renderer.scrollBar.width = 0;
                ed.resize(true);
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
            onFocus: function onFocus() {
            var win = this.getWindow();
            win && (win.targetMorph.lastFocused = this);
        },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                this.reset();
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
            onLoad: function onLoad() {
                $super();
                this.withAceDo(function(ed) { this.initCommandLine(ed); });
            },
            reset: function reset() {
                this.commandHistory = {items: [], max: 30, index: 0};
                this.connections = {input: {}};
            },
            setAndShowHistItem: function setAndShowHistItem(idx) {
            var hist = this.commandHistory, items = hist.items, len = items.length-1, i = idx;
            if (!Numbers.between(i, 0, len+1)) hist.index = i = len;
            else hist.index = i;
            if (this.getInput() !== items[i] && typeof items[i] !== 'undefined') this.setInput(items[i]);
        },
            setInput: function setInput(text) {
                if (this.labelString) text = this.labelString + text;
                return this.textString = text;
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
            }
        },{
            _Extent: lively.pt(477.0,24.2),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(7.9,30.1),
            className: "lively.morphic.Box",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            layout: {
                borderSize: 1.59,
                extentWithoutPlaceholder: lively.pt(474.0,24.2),
                resizeWidth: true,
                spacing: 2.915,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "Rectangle",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "auto",
                _Extent: lively.pt(113.0,19.0),
                _Fill: Color.rgb(243,243,243),
                _Position: lively.pt(1.6,1.6),
                changeTriggered: false,
                className: "lively.morphic.DropDownList",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: true,
                itemList: ["name","time","size"],
                name: "sortBySelector",
                selectOnMove: false,
                selectedLineNo: 0,
                selection: "name",
                sourceModule: "lively.morphic.Lists",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("DirViewer"), "applySort", {});
            }
            }, {
                _Extent: lively.pt(50.0,18.0),
                className: "lively.morphic.Button",
                label: "set cwd",
                name: "setCwdButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "changeCwd", {});
            }
            }]
        },{
            _BorderColor: Color.rgb(202,202,202),
            _BorderWidth: 1.3139999999999998,
            _ClipMode: {
                x: "hidden",
                y: "scroll"
            },
            _Extent: lively.pt(477.0,362.3),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(7.9,58.6),
            changeTriggered: true,
            className: "lively.morphic.List",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            itemList: [{
                cssClasses: ["directory"],
                isListItem: true,
                string: ".",
                value: {
                    fileName: ".",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Wed Dec 11 2013 21:43:10 GMT-0800 (UTC)"),
                    linkCount: 280,
                    mode: "drwxr-xr-x",
                    path: "",
                    rootDirectory: "./",
                    size: 9520,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "..",
                value: {
                    fileName: "..",
                    group: null,
                    isDirectory: true,
                    isLink: false,
                    lastModified: null,
                    linkCount: 0,
                    mode: null,
                    path: "..",
                    rootDirectory: null,
                    size: null,
                    user: null
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: ".git-lively-working-directory",
                value: {
                    fileName: ".git-lively-working-directory",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sun Apr 21 2013 22:12:31 GMT-0800 (UTC)"),
                    linkCount: 2,
                    mode: "drwxr-xr-x",
                    path: ".git-lively-working-directory",
                    rootDirectory: "./",
                    size: 68,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "Configurations2",
                value: {
                    fileName: "Configurations2",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Sep 05 2013 17:53:49 GMT-0800 (UTC)"),
                    linkCount: 11,
                    mode: "drwxr-xr-x",
                    path: "Configurations2",
                    rootDirectory: "./",
                    size: 374,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "JSONPath",
                value: {
                    fileName: "JSONPath",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Fri Oct 25 2013 04:26:41 GMT-0800 (UTC)"),
                    linkCount: 12,
                    mode: "drwxrwxrwx",
                    path: "JSONPath",
                    rootDirectory: "./",
                    size: 408,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "Lively-html",
                value: {
                    fileName: "Lively-html",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Tue Jul 30 2013 23:56:46 GMT-0800 (UTC)"),
                    linkCount: 10,
                    mode: "drwxr-xr-x@",
                    path: "Lively-html",
                    rootDirectory: "./",
                    size: 340,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "META-INF",
                value: {
                    fileName: "META-INF",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Sep 05 2013 21:26:16 GMT-0800 (UTC)"),
                    linkCount: 3,
                    mode: "drwxr-xr-x",
                    path: "META-INF",
                    rootDirectory: "./",
                    size: 102,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "PartsBin",
                value: {
                    fileName: "PartsBin",
                    group: "localaccounts",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 20:22:23 GMT-0800 (UTC)"),
                    linkCount: 130,
                    mode: "drwxrwxrwx",
                    path: "PartsBin",
                    rootDirectory: "./",
                    size: 4420,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "Pictures",
                value: {
                    fileName: "Pictures",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Fri Sep 06 2013 00:55:13 GMT-0800 (UTC)"),
                    linkCount: 35,
                    mode: "drwxr-xr-x",
                    path: "Pictures",
                    rootDirectory: "./",
                    size: 1190,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "Thumbnails",
                value: {
                    fileName: "Thumbnails",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Sep 05 2013 21:26:16 GMT-0800 (UTC)"),
                    linkCount: 3,
                    mode: "drwxr-xr-x",
                    path: "Thumbnails",
                    rootDirectory: "./",
                    size: 102,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "apps",
                value: {
                    fileName: "apps",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sat Nov 16 2013 14:42:02 GMT-0800 (UTC)"),
                    linkCount: 19,
                    mode: "drwxr-xr-x",
                    path: "apps",
                    rootDirectory: "./",
                    size: 646,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "apps2",
                value: {
                    fileName: "apps2",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sat Oct 27 2012 22:51:35 GMT-0800 (UTC)"),
                    linkCount: 2,
                    mode: "drwxr-xr-x",
                    path: "apps2",
                    rootDirectory: "./",
                    size: 68,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "benchmarks",
                value: {
                    fileName: "benchmarks",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:58 GMT-0800 (UTC)"),
                    linkCount: 6,
                    mode: "drwxr-xr-x",
                    path: "benchmarks",
                    rootDirectory: "./",
                    size: 204,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "bin",
                value: {
                    fileName: "bin",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Tue Dec 10 2013 23:13:56 GMT-0800 (UTC)"),
                    linkCount: 9,
                    mode: "drwxr-xr-x",
                    path: "bin",
                    rootDirectory: "./",
                    size: 306,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "cabal-dev",
                value: {
                    fileName: "cabal-dev",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Fri Nov 29 2013 01:49:17 GMT-0800 (UTC)"),
                    linkCount: 4,
                    mode: "drwxr-xr-x",
                    path: "cabal-dev",
                    rootDirectory: "./",
                    size: 136,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "core",
                value: {
                    fileName: "core",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sat Aug 31 2013 01:38:21 GMT-0800 (UTC)"),
                    linkCount: 14,
                    mode: "drwxr-xr-x",
                    path: "core",
                    rootDirectory: "./",
                    size: 476,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "foo",
                value: {
                    fileName: "foo",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 00:23:56 GMT-0800 (UTC)"),
                    linkCount: 3,
                    mode: "drwxr-xr-x",
                    path: "foo",
                    rootDirectory: "./",
                    size: 102,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "lib",
                value: {
                    fileName: "lib",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Fri Oct 26 2012 23:05:05 GMT-0800 (UTC)"),
                    linkCount: 2,
                    mode: "drwxr-xr-x",
                    path: "lib",
                    rootDirectory: "./",
                    size: 68,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "lively-db",
                value: {
                    fileName: "lively-db",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 00:34:42 GMT-0800 (UTC)"),
                    linkCount: 13,
                    mode: "drwxr-xr-x",
                    path: "lively-db",
                    rootDirectory: "./",
                    size: 442,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "node_modules2",
                value: {
                    fileName: "node_modules2",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Dec 05 2013 18:31:25 GMT-0800 (UTC)"),
                    linkCount: 2,
                    mode: "drwxrwxrwx",
                    path: "node_modules2",
                    rootDirectory: "./",
                    size: 68,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "odf-test",
                value: {
                    fileName: "odf-test",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Mon Sep 16 2013 21:40:46 GMT-0800 (UTC)"),
                    linkCount: 11,
                    mode: "drwxr-xr-x",
                    path: "odf-test",
                    rootDirectory: "./",
                    size: 374,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "out",
                value: {
                    fileName: "out",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Nov 28 2013 00:32:02 GMT-0800 (UTC)"),
                    linkCount: 3,
                    mode: "drwxr-xr-x",
                    path: "out",
                    rootDirectory: "./",
                    size: 102,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "redis",
                value: {
                    fileName: "redis",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Oct 03 2013 21:03:08 GMT-0800 (UTC)"),
                    linkCount: 3,
                    mode: "drwxr-xr-x",
                    path: "redis",
                    rootDirectory: "./",
                    size: 102,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "robertkrahn.org",
                value: {
                    fileName: "robertkrahn.org",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Oct 24 2013 17:36:56 GMT-0800 (UTC)"),
                    linkCount: 10,
                    mode: "drwxrwxrwx",
                    path: "robertkrahn.org",
                    rootDirectory: "./",
                    size: 340,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "sap",
                value: {
                    fileName: "sap",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Thu Nov 01 2012 17:52:00 GMT-0800 (UTC)"),
                    linkCount: 13,
                    mode: "drwxr-xr-x",
                    path: "sap",
                    rootDirectory: "./",
                    size: 442,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "server-test",
                value: {
                    fileName: "server-test",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Tue Jul 23 2013 12:56:23 GMT-0800 (UTC)"),
                    linkCount: 3,
                    mode: "drwxr-xr-x",
                    path: "server-test",
                    rootDirectory: "./",
                    size: 102,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "test",
                value: {
                    fileName: "test",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Wed Oct 30 2013 21:33:49 GMT-0800 (UTC)"),
                    linkCount: 2,
                    mode: "drwxr-xr-x",
                    path: "test",
                    rootDirectory: "./",
                    size: 68,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "users",
                value: {
                    fileName: "users",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Wed Jun 12 2013 10:23:45 GMT-0800 (UTC)"),
                    linkCount: 6,
                    mode: "drwxr-xr-x",
                    path: "users",
                    rootDirectory: "./",
                    size: 204,
                    user: "robert"
                }
            },{
                cssClasses: ["directory"],
                isListItem: true,
                string: "workspace",
                value: {
                    fileName: "workspace",
                    group: "staff",
                    isDirectory: true,
                    isLink: false,
                    lastModified: new Date("Sun Dec 01 2013 23:41:23 GMT-0800 (UTC)"),
                    linkCount: 4,
                    mode: "drwxr-xr-x",
                    path: "workspace",
                    rootDirectory: "./",
                    size: 136,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "#the-lively-universe-6.html#",
                value: {
                    fileName: "#the-lively-universe-6.html#",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 30 2013 17:25:14 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "#the-lively-universe-6.html#",
                    rootDirectory: "./",
                    size: 14089927,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "-- Short.odp",
                value: {
                    fileName: "-- Short.odp",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Invalid Date"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "-- Short.odp",
                    rootDirectory: "./",
                    size: 7411003,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "-- Short.svg",
                value: {
                    fileName: "-- Short.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Invalid Date"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "-- Short.svg",
                    rootDirectory: "./",
                    size: 21214,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: ".DS_Store",
                value: {
                    fileName: ".DS_Store",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 01:33:02 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: ".DS_Store",
                    rootDirectory: "./",
                    size: 15364,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: ".dot",
                value: {
                    fileName: ".dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 22:01:32 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: ".dot",
                    rootDirectory: "./",
                    size: 14728,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: ".gitattributes",
                value: {
                    fileName: ".gitattributes",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 12 2012 00:15:06 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: ".gitattributes",
                    rootDirectory: "./",
                    size: 9,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: ".gitignore",
                value: {
                    fileName: ".gitignore",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 12 2013 20:11:38 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: ".gitignore",
                    rootDirectory: "./",
                    size: 191,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: ".svg",
                value: {
                    fileName: ".svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 22:01:33 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: ".svg",
                    rootDirectory: "./",
                    size: 138348,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: ".travis.yml",
                value: {
                    fileName: ".travis.yml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Dec 10 2013 23:12:31 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: ".travis.yml",
                    rootDirectory: "./",
                    size: 1061,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "120725-notes-brownbag.xhtml",
                value: {
                    fileName: "120725-notes-brownbag.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Jul 25 2012 13:17:04 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "120725-notes-brownbag.xhtml",
                    rootDirectory: "./",
                    size: 47160,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-07-31_session-tracking.html",
                value: {
                    fileName: "2013-07-31_session-tracking.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 00:39:17 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-07-31_session-tracking.html",
                    rootDirectory: "./",
                    size: 12095507,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-02_nodejs-docs.html",
                value: {
                    fileName: "2013-08-02_nodejs-docs.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 01 2013 23:27:30 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-02_nodejs-docs.html",
                    rootDirectory: "./",
                    size: 508615,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-05_clojure.html",
                value: {
                    fileName: "2013-08-05_clojure.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 12 2013 20:20:01 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-05_clojure.html",
                    rootDirectory: "./",
                    size: 1695985,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-05_clojure.html.dot",
                value: {
                    fileName: "2013-08-05_clojure.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Nov 10 2013 13:41:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-05_clojure.html.dot",
                    rootDirectory: "./",
                    size: 31993,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-05_clojure.html.svg",
                value: {
                    fileName: "2013-08-05_clojure.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Nov 10 2013 13:41:59 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-05_clojure.html.svg",
                    rootDirectory: "./",
                    size: 176649,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-05_clojute.html",
                value: {
                    fileName: "2013-08-05_clojute.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Nov 10 2013 13:11:40 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "2013-08-05_clojute.html",
                    rootDirectory: "./",
                    size: 1874818,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_better-bootstrap-autosave0.html",
                value: {
                    fileName: "2013-08-07_better-bootstrap-autosave0.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 21:54:55 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_better-bootstrap-autosave0.html",
                    rootDirectory: "./",
                    size: 3366047,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_better-bootstrap-autosave1.html",
                value: {
                    fileName: "2013-08-07_better-bootstrap-autosave1.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 23:48:19 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_better-bootstrap-autosave1.html",
                    rootDirectory: "./",
                    size: 3965952,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_better-bootstrap-autosave2.html",
                value: {
                    fileName: "2013-08-07_better-bootstrap-autosave2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 00:06:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_better-bootstrap-autosave2.html",
                    rootDirectory: "./",
                    size: 2565359,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_better-bootstrap-autosave3.html",
                value: {
                    fileName: "2013-08-07_better-bootstrap-autosave3.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 00:26:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_better-bootstrap-autosave3.html",
                    rootDirectory: "./",
                    size: 2649955,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_better-bootstrap-autosave4.html",
                value: {
                    fileName: "2013-08-07_better-bootstrap-autosave4.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 00:44:07 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_better-bootstrap-autosave4.html",
                    rootDirectory: "./",
                    size: 2607522,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_better-bootstrap.html",
                value: {
                    fileName: "2013-08-07_better-bootstrap.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 23:57:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_better-bootstrap.html",
                    rootDirectory: "./",
                    size: 4323061,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_vega-autosave0.html",
                value: {
                    fileName: "2013-08-07_vega-autosave0.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 07 2013 16:18:43 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_vega-autosave0.html",
                    rootDirectory: "./",
                    size: 276044,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_vega-autosave1.html",
                value: {
                    fileName: "2013-08-07_vega-autosave1.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 07 2013 15:38:00 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_vega-autosave1.html",
                    rootDirectory: "./",
                    size: 276044,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_vega-autosave2.html",
                value: {
                    fileName: "2013-08-07_vega-autosave2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 07 2013 15:48:08 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_vega-autosave2.html",
                    rootDirectory: "./",
                    size: 276044,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_vega-autosave3.html",
                value: {
                    fileName: "2013-08-07_vega-autosave3.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 07 2013 15:58:21 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_vega-autosave3.html",
                    rootDirectory: "./",
                    size: 276044,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_vega-autosave4.html",
                value: {
                    fileName: "2013-08-07_vega-autosave4.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 07 2013 16:08:34 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_vega-autosave4.html",
                    rootDirectory: "./",
                    size: 276044,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-07_vega.html",
                value: {
                    fileName: "2013-08-07_vega.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 07 2013 14:43:33 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-07_vega.html",
                    rootDirectory: "./",
                    size: 227365,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-09_user-prefs.html",
                value: {
                    fileName: "2013-08-09_user-prefs.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Aug 12 2013 00:47:08 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-09_user-prefs.html",
                    rootDirectory: "./",
                    size: 1831039,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-12_windows-setup.html",
                value: {
                    fileName: "2013-08-12_windows-setup.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 12 2013 12:50:56 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "2013-08-12_windows-setup.html",
                    rootDirectory: "./",
                    size: 484325,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-13_CodeSearch.html",
                value: {
                    fileName: "2013-08-13_CodeSearch.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Aug 16 2013 17:01:21 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-13_CodeSearch.html",
                    rootDirectory: "./",
                    size: 602973,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-17_Lively2Lively_print.pdf",
                value: {
                    fileName: "2013-08-17_Lively2Lively_print.pdf",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Sep 07 2013 02:50:02 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-17_Lively2Lively_print.pdf",
                    rootDirectory: "./",
                    size: 1353056,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-17_new-google-maps.html",
                value: {
                    fileName: "2013-08-17_new-google-maps.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Aug 18 2013 22:05:55 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-17_new-google-maps.html",
                    rootDirectory: "./",
                    size: 610903,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-21_R-evaluate.html",
                value: {
                    fileName: "2013-08-21_R-evaluate.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Sep 04 2013 11:19:11 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-21_R-evaluate.html",
                    rootDirectory: "./",
                    size: 1801182,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-21_webwerkstatt.html",
                value: {
                    fileName: "2013-08-21_webwerkstatt.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 21 2013 14:34:55 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "2013-08-21_webwerkstatt.html",
                    rootDirectory: "./",
                    size: 589728,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-08-22_gitcontrol.html",
                value: {
                    fileName: "2013-08-22_gitcontrol.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 28 2013 00:08:21 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-08-22_gitcontrol.html",
                    rootDirectory: "./",
                    size: 1515965,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-09-05_odf.html",
                value: {
                    fileName: "2013-09-05_odf.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Sep 25 2013 10:04:02 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-09-05_odf.html",
                    rootDirectory: "./",
                    size: 2121264,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-09-05_odf.html.bak",
                value: {
                    fileName: "2013-09-05_odf.html.bak",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Sep 24 2013 15:57:53 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-09-05_odf.html.bak",
                    rootDirectory: "./",
                    size: 2121088,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-09-06_lk-scripts.html",
                value: {
                    fileName: "2013-09-06_lk-scripts.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Dec 02 2013 18:24:11 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-09-06_lk-scripts.html",
                    rootDirectory: "./",
                    size: 547335,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-09-18_recent-changes.html",
                value: {
                    fileName: "2013-09-18_recent-changes.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Sep 20 2013 16:51:05 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-09-18_recent-changes.html",
                    rootDirectory: "./",
                    size: 10932093,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-09-29_fixed-positioning.html",
                value: {
                    fileName: "2013-09-29_fixed-positioning.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 02 2013 14:16:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-09-29_fixed-positioning.html",
                    rootDirectory: "./",
                    size: 11233142,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-09-30_rectangle-navigator.html",
                value: {
                    fileName: "2013-09-30_rectangle-navigator.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Oct 01 2013 11:36:10 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-09-30_rectangle-navigator.html",
                    rootDirectory: "./",
                    size: 1283638,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-10-03_object-storage.html",
                value: {
                    fileName: "2013-10-03_object-storage.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 05 2013 14:25:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "2013-10-03_object-storage.html",
                    rootDirectory: "./",
                    size: 3306773,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-10-07_auth.html",
                value: {
                    fileName: "2013-10-07_auth.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 06:48:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-10-07_auth.html",
                    rootDirectory: "./",
                    size: 653768,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-10-11_worker-fix.html",
                value: {
                    fileName: "2013-10-11_worker-fix.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Oct 11 2013 11:52:43 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-10-11_worker-fix.html",
                    rootDirectory: "./",
                    size: 515420,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-10-15_cyc-learning.html",
                value: {
                    fileName: "2013-10-15_cyc-learning.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Oct 15 2013 19:22:05 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-10-15_cyc-learning.html",
                    rootDirectory: "./",
                    size: 1369182,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-10-25_JSONPath.html",
                value: {
                    fileName: "2013-10-25_JSONPath.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Oct 25 2013 22:45:16 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-10-25_JSONPath.html",
                    rootDirectory: "./",
                    size: 3183595,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-11-05_hyperspace.html",
                value: {
                    fileName: "2013-11-05_hyperspace.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 12 2013 11:55:27 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-11-05_hyperspace.html",
                    rootDirectory: "./",
                    size: 615241,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-11-12_webgl-test.html",
                value: {
                    fileName: "2013-11-12_webgl-test.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 12 2013 14:07:29 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-11-12_webgl-test.html",
                    rootDirectory: "./",
                    size: 484308,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-11-26_process-watchers.html",
                value: {
                    fileName: "2013-11-26_process-watchers.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Nov 27 2013 20:22:36 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-11-26_process-watchers.html",
                    rootDirectory: "./",
                    size: 963759,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-11-29_dynamic-npm-loader.html",
                value: {
                    fileName: "2013-11-29_dynamic-npm-loader.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Dec 01 2013 18:12:31 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-11-29_dynamic-npm-loader.html",
                    rootDirectory: "./",
                    size: 1384231,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-11-30_process-mgr.html",
                value: {
                    fileName: "2013-11-30_process-mgr.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Nov 30 2013 22:57:40 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-11-30_process-mgr.html",
                    rootDirectory: "./",
                    size: 318939,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-12-02_vwf.html",
                value: {
                    fileName: "2013-12-02_vwf.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Dec 10 2013 17:56:07 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "2013-12-02_vwf.html",
                    rootDirectory: "./",
                    size: 868688,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-12-03_search-replace.html",
                value: {
                    fileName: "2013-12-03_search-replace.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 04 2013 00:24:59 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-12-03_search-replace.html",
                    rootDirectory: "./",
                    size: 1495382,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-12-04_svg-prep-snippets.html",
                value: {
                    fileName: "2013-12-04_svg-prep-snippets.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 04 2013 19:32:47 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-12-04_svg-prep-snippets.html",
                    rootDirectory: "./",
                    size: 1226822,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-12-08_key-debugging.html",
                value: {
                    fileName: "2013-12-08_key-debugging.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Dec 08 2013 15:45:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-12-08_key-debugging.html",
                    rootDirectory: "./",
                    size: 404393,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "2013-12-10-file-lister.html",
                value: {
                    fileName: "2013-12-10-file-lister.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 11 2013 18:08:04 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "2013-12-10-file-lister.html",
                    rootDirectory: "./",
                    size: 4279689,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "519581-078_Pin-128.png",
                value: {
                    fileName: "519581-078_Pin-128.png",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 30 2013 22:57:57 GMT-0800 (UTC)"),
                    linkCount: 2,
                    mode: "-rw-------@",
                    path: "519581-078_Pin-128.png",
                    rootDirectory: "./",
                    size: 1815,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "AUTHORS",
                value: {
                    fileName: "AUTHORS",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "AUTHORS",
                    rootDirectory: "./",
                    size: 2181,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "B6482DCB-5033-44FA-AF88-DDBD9F99B533.json",
                value: {
                    fileName: "B6482DCB-5033-44FA-AF88-DDBD9F99B533.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Aug 30 2013 23:49:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "B6482DCB-5033-44FA-AF88-DDBD9F99B533.json",
                    rootDirectory: "./",
                    size: 64,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "BeginnersGuidetoMathsandStatsbehindWebAnalytics.pdf",
                value: {
                    fileName: "BeginnersGuidetoMathsandStatsbehindWebAnalytics.pdf",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jul 15 2013 11:19:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "BeginnersGuidetoMathsandStatsbehindWebAnalytics.pdf",
                    rootDirectory: "./",
                    size: 1232715,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "C0EC46C3-3786-4553-9385-CA429E8B5862.json",
                value: {
                    fileName: "C0EC46C3-3786-4553-9385-CA429E8B5862.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Aug 30 2013 19:01:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "C0EC46C3-3786-4553-9385-CA429E8B5862.json",
                    rootDirectory: "./",
                    size: 35,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ChartBuildingBlocks.xhtml",
                value: {
                    fileName: "ChartBuildingBlocks.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ChartBuildingBlocks.xhtml",
                    rootDirectory: "./",
                    size: 8695335,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "GitAsk2.sh",
                value: {
                    fileName: "GitAsk2.sh",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 15 2013 19:21:56 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rwxrwxrwx",
                    path: "GitAsk2.sh",
                    rootDirectory: "./",
                    size: 1371,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "GitAuth.log",
                value: {
                    fileName: "GitAuth.log",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 15 2013 19:43:15 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "GitAuth.log",
                    rootDirectory: "./",
                    size: 5428,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "Heidelberg Draft - Test 2.1.odp",
                value: {
                    fileName: "Heidelberg Draft - Test 2.1.odp",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Sep 24 2013 21:56:55 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "Heidelberg Draft - Test 2.1.odp",
                    rootDirectory: "./",
                    size: 0,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "Heidelberg Draft - Test 2.odp",
                value: {
                    fileName: "Heidelberg Draft - Test 2.odp",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Sep 24 2013 13:42:04 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "Heidelberg Draft - Test 2.odp",
                    rootDirectory: "./",
                    size: 7390003,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "IssueTemplate.html",
                value: {
                    fileName: "IssueTemplate.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Oct 04 2013 17:54:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "IssueTemplate.html",
                    rootDirectory: "./",
                    size: 138648,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "LICENSE",
                value: {
                    fileName: "LICENSE",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "LICENSE",
                    rootDirectory: "./",
                    size: 1241,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "LSVGPathReader.st",
                value: {
                    fileName: "LSVGPathReader.st",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Sep 24 2013 11:32:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "LSVGPathReader.st",
                    rootDirectory: "./",
                    size: 10846,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ODFFormulaInterpreter.st",
                value: {
                    fileName: "ODFFormulaInterpreter.st",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 23 2013 14:25:41 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "ODFFormulaInterpreter.st",
                    rootDirectory: "./",
                    size: 6464,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ODFFormulaParser.st",
                value: {
                    fileName: "ODFFormulaParser.st",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 23 2013 13:43:02 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "ODFFormulaParser.st",
                    rootDirectory: "./",
                    size: 4064,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "OO-messaging-with-Lively-pres.pdf",
                value: {
                    fileName: "OO-messaging-with-Lively-pres.pdf",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Sep 07 2013 02:49:40 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "OO-messaging-with-Lively-pres.pdf",
                    rootDirectory: "./",
                    size: 1276054,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "R-Graph-Cookbook-eBook02102012_.pdf",
                value: {
                    fileName: "R-Graph-Cookbook-eBook02102012_.pdf",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Sep 07 2013 03:01:09 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "R-Graph-Cookbook-eBook02102012_.pdf",
                    rootDirectory: "./",
                    size: 3397310,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "R-workspace-amelia.html",
                value: {
                    fileName: "R-workspace-amelia.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "R-workspace-amelia.html",
                    rootDirectory: "./",
                    size: 7585051,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "R-workspace.html",
                value: {
                    fileName: "R-workspace.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "R-workspace.html",
                    rootDirectory: "./",
                    size: 395037,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "R-workspace2.html",
                value: {
                    fileName: "R-workspace2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:27 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "R-workspace2.html",
                    rootDirectory: "./",
                    size: 442021,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "README.md",
                value: {
                    fileName: "README.md",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 01:35:16 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "README.md",
                    rootDirectory: "./",
                    size: 1978,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "Reflection.html",
                value: {
                    fileName: "Reflection.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 12 2013 14:14:55 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "Reflection.html",
                    rootDirectory: "./",
                    size: 6325,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "SAPUI5-demo-app.mov",
                value: {
                    fileName: "SAPUI5-demo-app.mov",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Sep 07 2013 02:51:49 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "SAPUI5-demo-app.mov",
                    rootDirectory: "./",
                    size: 1807248,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "Test 1.odp",
                value: {
                    fileName: "Test 1.odp",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Invalid Date"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "Test 1.odp",
                    rootDirectory: "./",
                    size: 10420716,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "Tutorial.html",
                value: {
                    fileName: "Tutorial.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "Tutorial.html",
                    rootDirectory: "./",
                    size: 226865,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "VersionedFileSystem.js",
                value: {
                    fileName: "VersionedFileSystem.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Oct 10 2013 21:23:17 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "VersionedFileSystem.js",
                    rootDirectory: "./",
                    size: 7690,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "WindowsInstallCore.mov",
                value: {
                    fileName: "WindowsInstallCore.mov",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Sep 07 2013 02:52:09 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "WindowsInstallCore.mov",
                    rootDirectory: "./",
                    size: 24032056,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "WireBrowser.html",
                value: {
                    fileName: "WireBrowser.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:36 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "WireBrowser.html",
                    rootDirectory: "./",
                    size: 897509,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "aFile.txt",
                value: {
                    fileName: "aFile.txt",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 04:40:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "aFile.txt",
                    rootDirectory: "./",
                    size: 8,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ace-dev.html",
                value: {
                    fileName: "ace-dev.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 28 2013 21:43:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "ace-dev.html",
                    rootDirectory: "./",
                    size: 1238545,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ace-dev.html.dot",
                value: {
                    fileName: "ace-dev.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 28 2013 21:37:29 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ace-dev.html.dot",
                    rootDirectory: "./",
                    size: 30599,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ace-dev.html.svg",
                value: {
                    fileName: "ace-dev.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 28 2013 21:37:30 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ace-dev.html.svg",
                    rootDirectory: "./",
                    size: 167464,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ace-pure.html",
                value: {
                    fileName: "ace-pure.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 01 2013 00:40:53 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ace-pure.html",
                    rootDirectory: "./",
                    size: 1900,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ace-test.html",
                value: {
                    fileName: "ace-test.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jan 28 2013 14:16:34 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ace-test.html",
                    rootDirectory: "./",
                    size: 655,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ace.html",
                value: {
                    fileName: "ace.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:23 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ace.html",
                    rootDirectory: "./",
                    size: 1084109,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "acorn-setup.html",
                value: {
                    fileName: "acorn-setup.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:23 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "acorn-setup.html",
                    rootDirectory: "./",
                    size: 348934,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "anim.xml",
                value: {
                    fileName: "anim.xml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 16 2013 22:58:53 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "anim.xml",
                    rootDirectory: "./",
                    size: 1839,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "animation.gif",
                value: {
                    fileName: "animation.gif",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 26 2013 16:23:33 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "animation.gif",
                    rootDirectory: "./",
                    size: 262372,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "app-cache-fix.html",
                value: {
                    fileName: "app-cache-fix.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:23 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "app-cache-fix.html",
                    rootDirectory: "./",
                    size: 180310,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "benchmark-morphic-interaction.xhtml",
                value: {
                    fileName: "benchmark-morphic-interaction.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon May 13 2013 10:02:37 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "benchmark-morphic-interaction.xhtml",
                    rootDirectory: "./",
                    size: 992229,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "benchmark-text.xhtml",
                value: {
                    fileName: "benchmark-text.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Jul 29 2012 18:22:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "benchmark-text.xhtml",
                    rootDirectory: "./",
                    size: 1993934,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "blank.html",
                value: {
                    fileName: "blank.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 04 2013 19:33:21 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "blank.html",
                    rootDirectory: "./",
                    size: 17825,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "blank.html.dot",
                value: {
                    fileName: "blank.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Nov 16 2013 14:07:37 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "blank.html.dot",
                    rootDirectory: "./",
                    size: 26800,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "blank.html.svg",
                value: {
                    fileName: "blank.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Nov 16 2013 14:07:37 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "blank.html.svg",
                    rootDirectory: "./",
                    size: 147148,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "bounds-with-scroll-bug.html",
                value: {
                    fileName: "bounds-with-scroll-bug.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "bounds-with-scroll-bug.html",
                    rootDirectory: "./",
                    size: 137729,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "bounds.xhtml",
                value: {
                    fileName: "bounds.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Sep 23 2012 00:01:16 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "bounds.xhtml",
                    rootDirectory: "./",
                    size: 8102697,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "buildspec.html",
                value: {
                    fileName: "buildspec.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "buildspec.html",
                    rootDirectory: "./",
                    size: 630880,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "clojure.html",
                value: {
                    fileName: "clojure.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 30 2013 20:44:07 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "clojure.html",
                    rootDirectory: "./",
                    size: 143756,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "code-analyzation.html",
                value: {
                    fileName: "code-analyzation.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "code-analyzation.html",
                    rootDirectory: "./",
                    size: 2518739,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "content.xml",
                value: {
                    fileName: "content.xml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 19 2013 08:35:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "content.xml",
                    rootDirectory: "./",
                    size: 226923,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "core-redirect.html",
                value: {
                    fileName: "core-redirect.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Jul 24 2013 16:04:19 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "core-redirect.html",
                    rootDirectory: "./",
                    size: 11036326,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "css-fixed.html",
                value: {
                    fileName: "css-fixed.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "css-fixed.html",
                    rootDirectory: "./",
                    size: 973158,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "css-tools.xhtml",
                value: {
                    fileName: "css-tools.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Sep 14 2012 14:02:58 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "css-tools.xhtml",
                    rootDirectory: "./",
                    size: 1229635,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "cyc.html",
                value: {
                    fileName: "cyc.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 22 2013 14:03:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "cyc.html",
                    rootDirectory: "./",
                    size: 1358226,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "debug.json",
                value: {
                    fileName: "debug.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 02 2013 11:36:32 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "debug.json",
                    rootDirectory: "./",
                    size: 1437660,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "debug.pretty.json",
                value: {
                    fileName: "debug.pretty.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 02 2013 11:37:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "debug.pretty.json",
                    rootDirectory: "./",
                    size: 1899577,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "debugging.xhtml",
                value: {
                    fileName: "debugging.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Dec 03 2012 14:32:43 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "debugging.xhtml",
                    rootDirectory: "./",
                    size: 111597,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "detecting-module-cycles.html",
                value: {
                    fileName: "detecting-module-cycles.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 16 2013 17:59:41 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "detecting-module-cycles.html",
                    rootDirectory: "./",
                    size: 1298792,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "detecting-module-cycles.html.dot",
                value: {
                    fileName: "detecting-module-cycles.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 04:27:12 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "detecting-module-cycles.html.dot",
                    rootDirectory: "./",
                    size: 32659,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "detecting-module-cycles.html.svg",
                value: {
                    fileName: "detecting-module-cycles.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 04:27:12 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "detecting-module-cycles.html.svg",
                    rootDirectory: "./",
                    size: 189040,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "empty.html",
                value: {
                    fileName: "empty.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Oct 14 2013 11:36:13 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "empty.html",
                    rootDirectory: "./",
                    size: 14,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "evaluate.pdf",
                value: {
                    fileName: "evaluate.pdf",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Aug 21 2013 22:37:50 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "evaluate.pdf",
                    rootDirectory: "./",
                    size: 72466,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "events-cleanup.html",
                value: {
                    fileName: "events-cleanup.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "events-cleanup.html",
                    rootDirectory: "./",
                    size: 237395,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "favicon.ico",
                value: {
                    fileName: "favicon.ico",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Sep 06 2012 18:04:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "favicon.ico",
                    rootDirectory: "./",
                    size: 1150,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "files.txt",
                value: {
                    fileName: "files.txt",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Oct 11 2013 23:56:14 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "files.txt",
                    rootDirectory: "./",
                    size: 557780,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "findutils-4.2.20-2.exe",
                value: {
                    fileName: "findutils-4.2.20-2.exe",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Aug 20 2013 22:21:29 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "findutils-4.2.20-2.exe",
                    rootDirectory: "./",
                    size: 1992874,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "foo.html",
                value: {
                    fileName: "foo.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Jul 28 2013 20:51:48 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "foo.html",
                    rootDirectory: "./",
                    size: 1329,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "foo.log",
                value: {
                    fileName: "foo.log",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 15 2013 18:33:08 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "foo.log",
                    rootDirectory: "./",
                    size: 75,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "foo.png",
                value: {
                    fileName: "foo.png",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Jul 27 2013 20:59:24 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "foo.png",
                    rootDirectory: "./",
                    size: 718914,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "from-ted.html",
                value: {
                    fileName: "from-ted.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "from-ted.html",
                    rootDirectory: "./",
                    size: 1419696,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "frp-test.html",
                value: {
                    fileName: "frp-test.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 30 2013 14:17:32 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "frp-test.html",
                    rootDirectory: "./",
                    size: 3469405,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "git-askpass_C37D95D2-9423-4B77-A3ED-B5B8BEA4888A.js",
                value: {
                    fileName: "git-askpass_C37D95D2-9423-4B77-A3ED-B5B8BEA4888A.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 09 2013 00:45:19 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "git-askpass_C37D95D2-9423-4B77-A3ED-B5B8BEA4888A.js",
                    rootDirectory: "./",
                    size: 1427,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "git-askpass_C37D95D2-9423-4B77-A3ED-B5B8BEA4888A.js.cmd",
                value: {
                    fileName: "git-askpass_C37D95D2-9423-4B77-A3ED-B5B8BEA4888A.js.cmd",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 09 2013 00:45:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rwxr-xr-x",
                    path: "git-askpass_C37D95D2-9423-4B77-A3ED-B5B8BEA4888A.js.cmd",
                    rootDirectory: "./",
                    size: 94,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "git-control-wip.html",
                value: {
                    fileName: "git-control-wip.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "git-control-wip.html",
                    rootDirectory: "./",
                    size: 1111517,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "github-oauth.html",
                value: {
                    fileName: "github-oauth.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "github-oauth.html",
                    rootDirectory: "./",
                    size: 133617,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "handlebars.html",
                value: {
                    fileName: "handlebars.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "handlebars.html",
                    rootDirectory: "./",
                    size: 111101,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "haskell.html",
                value: {
                    fileName: "haskell.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 11 2013 09:12:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "haskell.html",
                    rootDirectory: "./",
                    size: 2722884,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "haskell.html.dot",
                value: {
                    fileName: "haskell.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Dec 08 2013 05:36:49 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "haskell.html.dot",
                    rootDirectory: "./",
                    size: 31715,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "haskell.html.svg",
                value: {
                    fileName: "haskell.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Dec 08 2013 05:36:50 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "haskell.html.svg",
                    rootDirectory: "./",
                    size: 175000,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "helm.html",
                value: {
                    fileName: "helm.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Nov 04 2013 15:56:35 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "helm.html",
                    rootDirectory: "./",
                    size: 1049448,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "interactive-expl-demo-01.xhtml",
                value: {
                    fileName: "interactive-expl-demo-01.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Sep 20 2012 15:22:22 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "interactive-expl-demo-01.xhtml",
                    rootDirectory: "./",
                    size: 8775970,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "interactive-expl-demo-02.xhtml",
                value: {
                    fileName: "interactive-expl-demo-02.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:59 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "interactive-expl-demo-02.xhtml",
                    rootDirectory: "./",
                    size: 4708928,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "js-everywhere-registration.html",
                value: {
                    fileName: "js-everywhere-registration.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "js-everywhere-registration.html",
                    rootDirectory: "./",
                    size: 169079,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "json-fix",
                value: {
                    fileName: "json-fix",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri May 10 2013 03:32:30 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "json-fix",
                    rootDirectory: "./",
                    size: 23582390,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "kra.hn-dev.html",
                value: {
                    fileName: "kra.hn-dev.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 30 2013 07:33:45 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "kra.hn-dev.html",
                    rootDirectory: "./",
                    size: 456002,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "libpeerconnection.log",
                value: {
                    fileName: "libpeerconnection.log",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Jul 13 2013 06:49:05 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "libpeerconnection.log",
                    rootDirectory: "./",
                    size: 0,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-logo.svg",
                value: {
                    fileName: "lively-logo.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 26 2013 15:21:49 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-logo.svg",
                    rootDirectory: "./",
                    size: 9079,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-on-node.html",
                value: {
                    fileName: "lively-on-node.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 26 2013 12:08:38 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-on-node.html",
                    rootDirectory: "./",
                    size: 1277642,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-screen.html",
                value: {
                    fileName: "lively-screen.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Apr 12 2013 18:22:04 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-screen.html",
                    rootDirectory: "./",
                    size: 7368486,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-store-dev.xhtml",
                value: {
                    fileName: "lively-store-dev.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Aug 07 2012 15:56:09 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-store-dev.xhtml",
                    rootDirectory: "./",
                    size: 105393,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-web-rotating.svg",
                value: {
                    fileName: "lively-web-rotating.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 26 2013 22:51:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-web-rotating.svg",
                    rootDirectory: "./",
                    size: 1514,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-web.html",
                value: {
                    fileName: "lively-web.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Jul 28 2013 14:41:40 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-web.html",
                    rootDirectory: "./",
                    size: 3635893,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively-web.svg",
                value: {
                    fileName: "lively-web.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 26 2013 23:13:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively-web.svg",
                    rootDirectory: "./",
                    size: 9754,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively2Lively.clean.json",
                value: {
                    fileName: "lively2Lively.clean.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Aug 18 2013 20:09:42 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively2Lively.clean.json",
                    rootDirectory: "./",
                    size: 24946419,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively2Lively.html",
                value: {
                    fileName: "lively2Lively.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Aug 17 2013 22:30:47 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively2Lively.html",
                    rootDirectory: "./",
                    size: 23582824,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively2Lively.json",
                value: {
                    fileName: "lively2Lively.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Aug 18 2013 20:08:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively2Lively.json",
                    rootDirectory: "./",
                    size: 23582390,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively2Lively.json.bak",
                value: {
                    fileName: "lively2Lively.json.bak",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Aug 18 2013 20:09:15 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively2Lively.json.bak",
                    rootDirectory: "./",
                    size: 23582390,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "lively2lively2.html",
                value: {
                    fileName: "lively2lively2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 01 2013 15:56:18 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "lively2lively2.html",
                    rootDirectory: "./",
                    size: 3449742,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "memDbg.html",
                value: {
                    fileName: "memDbg.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "memDbg.html",
                    rootDirectory: "./",
                    size: 643078,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "meta.xml",
                value: {
                    fileName: "meta.xml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 19 2013 08:35:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "meta.xml",
                    rootDirectory: "./",
                    size: 1516,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "mimetype",
                value: {
                    fileName: "mimetype",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 19 2013 08:35:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "mimetype",
                    rootDirectory: "./",
                    size: 47,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "missile-launcher.html",
                value: {
                    fileName: "missile-launcher.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "missile-launcher.html",
                    rootDirectory: "./",
                    size: 848438,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "model-sync.html",
                value: {
                    fileName: "model-sync.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "model-sync.html",
                    rootDirectory: "./",
                    size: 1717729,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "module-dependency-vis.html",
                value: {
                    fileName: "module-dependency-vis.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "module-dependency-vis.html",
                    rootDirectory: "./",
                    size: 493406,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "modules-draft.html",
                value: {
                    fileName: "modules-draft.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "modules-draft.html",
                    rootDirectory: "./",
                    size: 1337861,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "my-blank.html",
                value: {
                    fileName: "my-blank.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 08 2013 16:12:05 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "my-blank.html",
                    rootDirectory: "./",
                    size: 154156,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "myplot.png",
                value: {
                    fileName: "myplot.png",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Jul 03 2013 14:11:48 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "myplot.png",
                    rootDirectory: "./",
                    size: 37118,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "nodejs-start.js",
                value: {
                    fileName: "nodejs-start.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jul 22 2013 10:19:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "nodejs-start.js",
                    rootDirectory: "./",
                    size: 64,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "notes-stored.html",
                value: {
                    fileName: "notes-stored.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 30 2013 23:45:16 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "notes-stored.html",
                    rootDirectory: "./",
                    size: 4398200,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "notes.html",
                value: {
                    fileName: "notes.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Dec 03 2013 18:16:11 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "notes.html",
                    rootDirectory: "./",
                    size: 7039049,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "notes.html.dot",
                value: {
                    fileName: "notes.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Oct 14 2013 21:35:53 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "notes.html.dot",
                    rootDirectory: "./",
                    size: 25378,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "notes.html.svg",
                value: {
                    fileName: "notes.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Oct 14 2013 21:35:53 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "notes.html.svg",
                    rootDirectory: "./",
                    size: 143812,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "objects (SilverAir's conflicted copy 2013-12-07).sqlite",
                value: {
                    fileName: "objects (SilverAir's conflicted copy 2013-12-07).sqlite",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 03:05:19 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "objects (SilverAir's conflicted copy 2013-12-07).sqlite",
                    rootDirectory: "./",
                    size: 2566721536,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "objects.sqlite",
                value: {
                    fileName: "objects.sqlite",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 11 2013 21:43:10 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "objects.sqlite",
                    rootDirectory: "./",
                    size: 2926860288,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "ometa.diff",
                value: {
                    fileName: "ometa.diff",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Apr 25 2013 19:06:50 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "ometa.diff",
                    rootDirectory: "./",
                    size: 56548,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "package.json",
                value: {
                    fileName: "package.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Dec 10 2013 23:12:31 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "package.json",
                    rootDirectory: "./",
                    size: 684,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "padding-bug.html",
                value: {
                    fileName: "padding-bug.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:24:29 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "padding-bug.html",
                    rootDirectory: "./",
                    size: 109619,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "people.xhtml",
                value: {
                    fileName: "people.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Sep 20 2012 00:37:05 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "people.xhtml",
                    rootDirectory: "./",
                    size: 4756301,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "plain.html",
                value: {
                    fileName: "plain.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Oct 14 2013 11:06:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "plain.html",
                    rootDirectory: "./",
                    size: 0,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "plugin",
                value: {
                    fileName: "plugin",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 12 2013 15:08:53 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "plugin",
                    rootDirectory: "./",
                    size: 157087,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "positioning.html",
                value: {
                    fileName: "positioning.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "positioning.html",
                    rootDirectory: "./",
                    size: 2832250,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "prolog-from-lively.html",
                value: {
                    fileName: "prolog-from-lively.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:25 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "prolog-from-lively.html",
                    rootDirectory: "./",
                    size: 431215,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "relative-positioning.html",
                value: {
                    fileName: "relative-positioning.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:27 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "relative-positioning.html",
                    rootDirectory: "./",
                    size: 164414,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "removeAfterUpdateIssue.html",
                value: {
                    fileName: "removeAfterUpdateIssue.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:27 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "removeAfterUpdateIssue.html",
                    rootDirectory: "./",
                    size: 283475,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "run_tests.html",
                value: {
                    fileName: "run_tests.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Jun 13 2013 14:56:10 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "run_tests.html",
                    rootDirectory: "./",
                    size: 10654,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "run_tests.html.dot",
                value: {
                    fileName: "run_tests.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 07 2013 16:12:04 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "run_tests.html.dot",
                    rootDirectory: "./",
                    size: 23719,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "run_tests.html.svg",
                value: {
                    fileName: "run_tests.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 07 2013 16:12:05 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "run_tests.html.svg",
                    rootDirectory: "./",
                    size: 129379,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "run_tests.js",
                value: {
                    fileName: "run_tests.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Nov 16 2013 14:40:48 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "run_tests.js",
                    rootDirectory: "./",
                    size: 5045,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "sap-pres2.html",
                value: {
                    fileName: "sap-pres2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 05 2013 16:15:19 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "sap-pres2.html",
                    rootDirectory: "./",
                    size: 0,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "server.9001.pid",
                value: {
                    fileName: "server.9001.pid",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Dec 10 2013 23:11:32 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "server.9001.pid",
                    rootDirectory: "./",
                    size: 5,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "settings.xml",
                value: {
                    fileName: "settings.xml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 19 2013 08:35:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "settings.xml",
                    rootDirectory: "./",
                    size: 10651,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "snippets.html",
                value: {
                    fileName: "snippets.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Dec 07 2013 23:59:35 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "snippets.html",
                    rootDirectory: "./",
                    size: 2149750,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "snippets.html.dot",
                value: {
                    fileName: "snippets.html.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 07 2013 15:44:13 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "snippets.html.dot",
                    rootDirectory: "./",
                    size: 21093,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "snippets.html.svg",
                value: {
                    fileName: "snippets.html.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Nov 07 2013 15:44:14 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "snippets.html.svg",
                    rootDirectory: "./",
                    size: 115855,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "sqlite-storage.js",
                value: {
                    fileName: "sqlite-storage.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 09 2013 04:06:48 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "sqlite-storage.js",
                    rootDirectory: "./",
                    size: 6207,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "streamwork-test.html",
                value: {
                    fileName: "streamwork-test.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:27 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "streamwork-test.html",
                    rootDirectory: "./",
                    size: 17976,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "styles.xml",
                value: {
                    fileName: "styles.xml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Jul 19 2013 08:35:46 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "styles.xml",
                    rootDirectory: "./",
                    size: 59445,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "subservers.html",
                value: {
                    fileName: "subservers.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "subservers.html",
                    rootDirectory: "./",
                    size: 3813249,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "tail-lively-kernel.org-log.sh",
                value: {
                    fileName: "tail-lively-kernel.org-log.sh",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed May 15 2013 23:05:45 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rwxr-xr-x@",
                    path: "tail-lively-kernel.org-log.sh",
                    rootDirectory: "./",
                    size: 70,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "tail-lively-web.org-log.sh",
                value: {
                    fileName: "tail-lively-web.org-log.sh",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Jun 15 2013 00:11:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rwxr-xr-x",
                    path: "tail-lively-web.org-log.sh",
                    rootDirectory: "./",
                    size: 99,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test-pendulum.html",
                value: {
                    fileName: "test-pendulum.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test-pendulum.html",
                    rootDirectory: "./",
                    size: 899995,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.dot",
                value: {
                    fileName: "test.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 21:20:50 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.dot",
                    rootDirectory: "./",
                    size: 29895,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.gviz",
                value: {
                    fileName: "test.gviz",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 14:15:45 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.gviz",
                    rootDirectory: "./",
                    size: 0,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.hs",
                value: {
                    fileName: "test.hs",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 01 2013 11:16:22 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "test.hs",
                    rootDirectory: "./",
                    size: 198,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.html",
                value: {
                    fileName: "test.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Mar 05 2013 18:13:33 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.html",
                    rootDirectory: "./",
                    size: 754,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.js",
                value: {
                    fileName: "test.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Oct 25 2013 06:24:09 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.js",
                    rootDirectory: "./",
                    size: 858,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.json",
                value: {
                    fileName: "test.json",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Aug 29 2013 22:53:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "test.json",
                    rootDirectory: "./",
                    size: 167,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.odp",
                value: {
                    fileName: "test.odp",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 23 2013 23:29:22 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.odp",
                    rootDirectory: "./",
                    size: 7411003,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.patch",
                value: {
                    fileName: "test.patch",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Sep 13 2013 15:57:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.patch",
                    rootDirectory: "./",
                    size: 435,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.png",
                value: {
                    fileName: "test.png",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 17:28:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "test.png",
                    rootDirectory: "./",
                    size: 1488166,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.sh",
                value: {
                    fileName: "test.sh",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Jan 19 2013 23:15:21 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rwxr-xr-x",
                    path: "test.sh",
                    rootDirectory: "./",
                    size: 203,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.svg",
                value: {
                    fileName: "test.svg",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Dec 04 2013 12:12:49 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.svg",
                    rootDirectory: "./",
                    size: 672,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test.txt",
                value: {
                    fileName: "test.txt",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Nov 26 2013 19:01:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test.txt",
                    rootDirectory: "./",
                    size: 26,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test2.dot",
                value: {
                    fileName: "test2.dot",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Oct 12 2013 14:29:54 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test2.dot",
                    rootDirectory: "./",
                    size: 270,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test2.html",
                value: {
                    fileName: "test2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "test2.html",
                    rootDirectory: "./",
                    size: 266963,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "test3.txt",
                value: {
                    fileName: "test3.txt",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 09 2013 11:36:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "test3.txt",
                    rootDirectory: "./",
                    size: 43,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "testing.html",
                value: {
                    fileName: "testing.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:28 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "testing.html",
                    rootDirectory: "./",
                    size: 9090143,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "textundo-proto.xhtml",
                value: {
                    fileName: "textundo-proto.xhtml",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Jul 08 2012 20:51:06 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "textundo-proto.xhtml",
                    rootDirectory: "./",
                    size: 780633,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-10.html",
                value: {
                    fileName: "the-lively-universe-10.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 08 2013 22:58:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe-10.html",
                    rootDirectory: "./",
                    size: 6062122,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-11.html",
                value: {
                    fileName: "the-lively-universe-11.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Nov 09 2013 01:20:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe-11.html",
                    rootDirectory: "./",
                    size: 9943255,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-3.html",
                value: {
                    fileName: "the-lively-universe-3.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Sep 10 2013 17:31:06 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe-3.html",
                    rootDirectory: "./",
                    size: 19180694,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-4.html",
                value: {
                    fileName: "the-lively-universe-4.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 30 2013 16:43:20 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "the-lively-universe-4.html",
                    rootDirectory: "./",
                    size: 15128040,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-6.html",
                value: {
                    fileName: "the-lively-universe-6.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Sep 30 2013 17:46:35 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "the-lively-universe-6.html",
                    rootDirectory: "./",
                    size: 14090312,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-7.html",
                value: {
                    fileName: "the-lively-universe-7.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 08 2013 23:48:26 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe-7.html",
                    rootDirectory: "./",
                    size: 14651371,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-8.html",
                value: {
                    fileName: "the-lively-universe-8.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 08 2013 22:56:03 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe-8.html",
                    rootDirectory: "./",
                    size: 8652590,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe-9.html",
                value: {
                    fileName: "the-lively-universe-9.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 08 2013 22:56:54 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe-9.html",
                    rootDirectory: "./",
                    size: 6018132,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe.html",
                value: {
                    fileName: "the-lively-universe.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Nov 08 2013 23:56:04 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe.html",
                    rootDirectory: "./",
                    size: 10236000,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "the-lively-universe2.html",
                value: {
                    fileName: "the-lively-universe2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:30 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "the-lively-universe2.html",
                    rootDirectory: "./",
                    size: 7304994,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "touchtest.html",
                value: {
                    fileName: "touchtest.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:59 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "touchtest.html",
                    rootDirectory: "./",
                    size: 18376,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "towards-new-modules.html",
                value: {
                    fileName: "towards-new-modules.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Jul 21 2013 21:21:39 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "towards-new-modules.html",
                    rootDirectory: "./",
                    size: 1225066,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "travis-integration.html",
                value: {
                    fileName: "travis-integration.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:30 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "travis-integration.html",
                    rootDirectory: "./",
                    size: 258392,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "typing.mp3",
                value: {
                    fileName: "typing.mp3",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Thu Feb 21 2013 23:30:12 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--@",
                    path: "typing.mp3",
                    rootDirectory: "./",
                    size: 249760,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "useful-code.html",
                value: {
                    fileName: "useful-code.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:30 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "useful-code.html",
                    rootDirectory: "./",
                    size: 99137,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "video.html",
                value: {
                    fileName: "video.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:35 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "video.html",
                    rootDirectory: "./",
                    size: 845581,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "webrtc-2.html",
                value: {
                    fileName: "webrtc-2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jul 29 2013 23:49:38 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "webrtc-2.html",
                    rootDirectory: "./",
                    size: 3107664,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "webrtc-3.html",
                value: {
                    fileName: "webrtc-3.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 30 2013 09:09:50 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "webrtc-3.html",
                    rootDirectory: "./",
                    size: 42346481,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "webrtc.html",
                value: {
                    fileName: "webrtc.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jul 29 2013 23:17:43 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "webrtc.html",
                    rootDirectory: "./",
                    size: 2109041,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "webrtc_dropbox-1.html",
                value: {
                    fileName: "webrtc_dropbox-1.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jul 29 2013 23:50:49 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "webrtc_dropbox-1.html",
                    rootDirectory: "./",
                    size: 0,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "webrtc_dropbox-2.html",
                value: {
                    fileName: "webrtc_dropbox-2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Mon Jul 29 2013 23:51:38 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "webrtc_dropbox-2.html",
                    rootDirectory: "./",
                    size: 773,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "welcome.html",
                value: {
                    fileName: "welcome.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sun Oct 13 2013 21:25:59 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "welcome.html",
                    rootDirectory: "./",
                    size: 257941,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "welcome.htmlbak",
                value: {
                    fileName: "welcome.htmlbak",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Jul 03 2013 09:40:27 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "welcome.htmlbak",
                    rootDirectory: "./",
                    size: 120457,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "word-completion.html",
                value: {
                    fileName: "word-completion.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:36 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "word-completion.html",
                    rootDirectory: "./",
                    size: 506827,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "worker-bootstrap.html",
                value: {
                    fileName: "worker-bootstrap.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:36 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "worker-bootstrap.html",
                    rootDirectory: "./",
                    size: 832995,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "worker-code.js",
                value: {
                    fileName: "worker-code.js",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed May 08 2013 13:57:18 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "worker-code.js",
                    rootDirectory: "./",
                    size: 1976,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "workspace.html",
                value: {
                    fileName: "workspace.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:36 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "workspace.html",
                    rootDirectory: "./",
                    size: 2250132,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "workspace2.html",
                value: {
                    fileName: "workspace2.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:36 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "workspace2.html",
                    rootDirectory: "./",
                    size: 5651683,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "world-db-expt2.sqlite.bak",
                value: {
                    fileName: "world-db-expt2.sqlite.bak",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Oct 08 2013 19:48:12 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "world-db-expt2.sqlite.bak",
                    rootDirectory: "./",
                    size: 152576,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "world-db-expt2.sqlite.bak.2",
                value: {
                    fileName: "world-db-expt2.sqlite.bak.2",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Wed Oct 09 2013 13:37:38 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-rw-rw-",
                    path: "world-db-expt2.sqlite.bak.2",
                    rootDirectory: "./",
                    size: 2439168,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "world-rescue.html",
                value: {
                    fileName: "world-rescue.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:37 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "world-rescue.html",
                    rootDirectory: "./",
                    size: 1953045,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "world-store.html",
                value: {
                    fileName: "world-store.html",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Tue Jul 16 2013 23:25:37 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "world-store.html",
                    rootDirectory: "./",
                    size: 508885,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "world-store.sqlite",
                value: {
                    fileName: "world-store.sqlite",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Fri Oct 04 2013 01:15:11 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "world-store.sqlite",
                    rootDirectory: "./",
                    size: 1425408,
                    user: "robert"
                }
            },{
                cssClasses: ["file"],
                isListItem: true,
                string: "yoshiki2.debug.txt",
                value: {
                    fileName: "yoshiki2.debug.txt",
                    group: "staff",
                    isDirectory: false,
                    isLink: false,
                    lastModified: new Date("Sat Apr 27 2013 20:32:33 GMT-0800 (UTC)"),
                    linkCount: 1,
                    mode: "-rw-r--r--",
                    path: "yoshiki2.debug.txt",
                    rootDirectory: "./",
                    size: 2253613,
                    user: "robert"
                }
            }],
            itemMorphs: [],
            layout: {
                adjustForNewBounds: true,
                extent: lively.pt(477.0,362.3),
                listItemHeight: 19,
                maxExtent: lively.pt(477.0,362.3),
                maxListItems: 20,
                noOfCandidatesShown: 21,
                padding: 0,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "fileList",
            sourceModule: "lively.morphic.Lists",
            submorphs: [{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(462.0,5286.0),
                className: "lively.morphic.Box",
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeWidth: true
                },
                sourceModule: "lively.morphic.Core",
                submorphs: []
            }],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "listItemDoubleClicked", this.get("DirViewer"), "listItemDoubleClicked", {});
        },
            createListItemMorph: function createListItemMorph(string, i, layout) {
            var m = $super(string, i, layout);
            m.renderContext().textNode.style.pointerEvents = 'none'; // issue with double clk
            m.addScript(function onDoubleClick(evt) {
                var list = this.owner.owner,
                    value = this.owner.owner.itemList[this.index];
                lively.bindings.signal(list, 'listItemDoubleClicked', value.value || value);
            });
            return m;
        },
            ensureItemMorphs: function ensureItemMorphs(requiredLength, layout) {
            var itemMorphs = this.getItemMorphs(true);
            requiredLength = Math.min(layout.noOfCandidatesShown, requiredLength);
            if (itemMorphs.length > requiredLength) {
                lively.bindings.noUpdate(function() {
                    itemMorphs.slice(requiredLength).forEach(function(text) {
                        text.setPointerEvents('auto');
                        text.index = undefined;
                        text.setTextString('');
                        text.removeStyleClassName("selected");
                        text.selected = false;
                        text.setHandStyle("default");
        // var cssClasses = ["Morph","Text","list-item"];
        // text.setStyleClassNames(cssClasses);
        
                    });
                    itemMorphs = itemMorphs.slice(0,requiredLength);
                });
            } else if (itemMorphs.length < requiredLength) {
                var c = this.listItemContainer,
                    newItems = Array.range(itemMorphs.length, requiredLength-1).collect(function(i) {
                        return c.addMorph(this.createListItemMorph('', i, layout)); }, this);
                itemMorphs = itemMorphs.concat(newItems);
            }
            return itemMorphs;
        },
            focus: function focus() {
            var win = this.getWindow();
            win && (win.targetMorph.lastFocused = this);
            return $super();
        },
            getMenu: function getMenu() {
                return this.owner.getMenuItemsFor(this.getSelection());
            },
            renderItems: function renderItems(items, from, to, selectedIndexes, renderBounds, layout) {
            this.ensureItemMorphs(to-from, layout).forEach(function(itemMorph, i) {
                var listIndex = from+i,
                    selected = selectedIndexes.include(listIndex);
                itemMorph.setPointerEvents('auto');
                itemMorph.setPosition(pt(0, listIndex*layout.listItemHeight));
                itemMorph.index = listIndex;
                itemMorph.name = String(itemMorph.index);
                var cssClasses = ["Morph","Text","list-item"];
                if (items[listIndex].cssClasses) cssClasses.pushAll(items[listIndex].cssClasses);
                if (selected) cssClasses.push('selected');
                itemMorph.setStyleClassNames(cssClasses);
                itemMorph.textString = this.renderFunction(items[listIndex]);
                if (selected !== itemMorph.selected) {
                    itemMorph.setIsSelected(selected, true/*suppress update*/);
                }
            }, this);
        },
            reset: function reset() {
            this.listItemStyle = {
              allowInput: false,
              borderColor: Color.rgb(204,204,204),
              borderWidth: 1,
              fill: null,
              fixedHeight: false,
              fixedWidth: true,
              clipMode: 'hidden',
              whiteSpaceHandling: 'pre'
            }
            this.setClipMode(this.getClipMode())
            this.cachedBounds=null
            this.listItemContainer.removeAllMorphs()
            this.connections = ['listItemDoubleClicked'];
            // this.itemList[0].value
        }
        },{
            _AutocompletionEnabled: true,
            _Extent: lively.pt(477.0,18.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(7.9,425.1),
            _ShowActiveLine: false,
            _ShowErrors: true,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _ShowWarnings: true,
            _SoftTabs: true,
            _TextMode: "text",
            _Theme: "chrome",
            _aceInitialized: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            clearOnInput: false,
            commandHistory: {
                index: 1,
                items: ["users","user"],
                max: 30
            },
            connections: {
                input: {}
            },
            doNotCopyProperties: [],
            doNotSerialize: ["whenOpenedInWorldCallbacks"],
            hasRobertsKeys: true,
            inputChanged: "",
            isCommandLine: true,
            layout: {
                resizeWidth: true
            },
            name: "filter",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            storedTextString: "",
            style: {
                clipMode: "hidden",
                enableDragging: false,
                enableGrabbing: false,
                fontSize: 12,
                gutter: false
            },
            submorphs: [],
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
            clear: function clear() {
                $super();
                if (this.labelString) this.textString = this.labelString;
            },
            commandLineInput: function commandLineInput(text) {
                if (text.length > 0) this.addCommandToHistory(text);
                lively.bindings.signal(this, 'input', text);
                // for compatibility with old texts:
                lively.bindings.signal(this, 'savedTextString', text);
                this.clearOnInput && this.clear();
            },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "textString", this, "inputChanged", {converter: 
        function (string) { return this.sourceObj.getInput(); }});
            lively.bindings.connect(this, "textChange", this.get("DirViewer"), "applyFilter", {});
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
            initCommandLine: function initCommandLine(ed) {
                this.isCommandLine = true;
                ed.renderer.scrollBar.element.style.display = 'none';
                ed.renderer.scrollBar.width = 0;
                ed.resize(true);
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
            onFocus: function onFocus() {
            var win = this.getWindow();
            win && (win.targetMorph.lastFocused = this);
        },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                this.reset();
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
            onLoad: function onLoad() {
                $super();
                this.withAceDo(function(ed) { this.initCommandLine(ed); });
            },
            reset: function reset() {
                this.commandHistory = {items: [], max: 30, index: 0};
                this.connections = {input: {}};
            },
            setAndShowHistItem: function setAndShowHistItem(idx) {
            var hist = this.commandHistory, items = hist.items, len = items.length-1, i = idx;
            if (!Numbers.between(i, 0, len+1)) hist.index = i = len;
            else hist.index = i;
            if (this.getInput() !== items[i] && typeof items[i] !== 'undefined') this.setInput(items[i]);
        },
            setInput: function setInput(text) {
                if (this.labelString) text = this.labelString + text;
                return this.textString = text;
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
            }
        }],
        applyFilter: function applyFilter(textChangeEvt) {
        var filter = this.get('filter').textString;
        if (filter[0] === '/' && filter.slice(-1) === '/') filter = new RegExp(filter.slice(1,-1), 'ig')
        this.dirState.filter = filter;
        this.renderDebounced();
    },
        applySort: function applySort() {
        var sortKey = this.get('sortBySelector').selection || 'name';
        this.dirState.sortKey = sortKey;
        this.render();
    },
        changeCwd: function changeCwd() {
        var d = this.dirState.path;
        alertOK(d + ' is now working directory');
        lively.ide.CommandLineInterface.setWorkingDirectory(d);
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "lastFocused", this, "focusChanged", {});
    },
        doActionForFileItem: function doActionForFileItem(fileItem) {
        var j = lively.ide.CommandLineInterface.path.join;
        var fullPath = j(this.dirState.path, fileItem.path);
        if (fileItem.isDirectory) {
            this.goto(fullPath);
        } else {
            lively.ide.openFile(fullPath)
        }
    },
        fetchAndDisplayDirContent: function fetchAndDisplayDirContent() {
        // this.fetchAndDisplayDirContent();
        var self = this;
        this.get('filter').textString = ''
        this.get('fileList').setList(['Loading...']);
        var parentDir = {
          fileName: "..",
          group: null,
          isDirectory: true,
          isLink: false,
          lastModified: null,
          linkCount: 0,
          mode: null,
          path: "..",
          rootDirectory: null,
          size: null,
          user: null
        };
        lively.ide.CommandLineSearch.findFiles('*',
            {cwd: this.dirState.path, excludes: '-false', depth: 1},
            function(files) {
                self.dirState.files = [parentDir].concat(files);
                self.renderDebounced();
            });
    },
        focusChanged: function focusChanged(newFocus) {
        if (newFocus === this.get('targetDir')) {
            this.get('fileList').deselectAll();
        }
    },
    getItemActionsFor: function getItemActionsFor(item) {
    var openInSCB = {
            description: 'open in SCB',
            exec: function() {
                // only works when in Lively dir!
                var baseDir = lively.ide.CommandLineInterface.getWorkingDirectory();
                if (fullPath.startsWith(baseDir)) {
                    lively.ide.browse(fullPath.slice(baseDir.length).replace(/^\//, ''));
                } else {
                    show("cannot open " + fullPath.slice(baseDir.length));
                }
            }
        },
        openInTextEditor = {
            description: 'open in TextEditor',
            exec: function() { lively.ide.openFile(fullPath); }
        },
        copyPath = {
            description: 'copy path to clipboard',
            exec: function() {
                // currently only works together with ace and its emacs mode
                if (!lively.ide.ace) return;
                lively.ide.ace.require('ace/keyboard/emacs').killRing.add(fullPath);
            }
        };
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    if (!item) return [];
    var j = lively.ide.CommandLineInterface.path.join;
    var fullPath = j(this.dirState.path, item.path);
    if (item.isDirectory) return [copyPath];
    return [copyPath, openInSCB, openInTextEditor];
},
    execItemAction: function execItemAction(item, n) {
    var action = this.getItemActionsFor(item)[n];
    if (!action) { show("no item action %s exists", n); return; }
    action.exec();
},
        getMenuItemsFor: function getMenuItemsFor(fileItem) {
        return this.getItemActionsFor(fileItem).map(function(ac) {
            return [ac.description, ac.exec]; })
    },
        goto: function goto(dir) {
        this.dirState.path = dir;
        this.get('targetDir').textString = dir;
        this.fetchAndDisplayDirContent();
    },
        gotoParentDir: function gotoParentDir() {
        var j = lively.ide.CommandLineInterface.path.join;
        this.goto(j(this.dirState.path, ".."));
    },
        gotoRoot: function gotoRoot() {
        // this.gotoRoot()
        var dir = lively.ide.CommandLineInterface.getWorkingDirectory();
        this.goto(dir);
    },
        itemsFilter: function itemsFilter(filter, items) {
        filter = filter && filter.toLowerCase ? filter.toLowerCase() : filter;
        return items.select(function(fileInfo) {
            if (!filter) {
                return true
            } else if (Object.isString(filter)) {
                return fileInfo.fileName.toLowerCase().include(filter);
            } else if (Object.isRegExp(filter)) {
                return filter.test(fileInfo.fileName);
            } else { return true; }
        });
    },
        itemsForList: function itemsForList(items) {
        return items.map(function(ea) {
            return {
                isListItem: true,
                string: ea.fileName,
                value: ea,
                cssClasses: [ea.isDirectory ? 'directory' : 'file']
            }
        });
    },
        itemsSort: function itemsSort(sortKey, items) {
        return items.sortBy(function(item) {
            if (sortKey === 'name') {
                return item.fileName;
            } else if (sortKey === 'time') {
                return -item.lastModified;
            } else if (sortKey === 'size') {
                return -item.size;
            } else {
                return item.fileName;
            }
        });
    },
        listItemDoubleClicked: function listItemDoubleClicked(listItem) {
        this.doActionForFileItem(listItem);
    },
        listItemMorph: function listItemMorph(listItem, extent) {
        if (!listItem) listItem = {isListItem: true, string: 'invalid list item: ' + listItem};
        if (listItem.morph) return listItem.morph;
        var string = listItem.string || String(listItem);
        var listItemMorph = new lively.morphic.Text(lively.rect(0,0,extent.x,20), string);
        listItemMorph.item = listItem;
        listItemMorph.applyStyle({
          allowInput: false,
          borderColor: Color.rgb(204,204,204),
          borderWidth: 1,
          fill: null,
          fixedHeight: false,
          fixedWidth: true,
          clipMode: 'hidden',
          whiteSpaceHandling: 'pre'
        });
        return listItemMorph;
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.goto(lively.ide.CommandLineInterface.getWorkingDirectory());
    },
        onKeyDown: function onKeyDown(evt) {
        if (evt.isCommandKey()) return $super(evt);
        var keys = evt.getKeyString(), wasHandled = true;
        var fl = this.get('fileList');
        function ensureSelectionIsInView(topOrBottom) {
            var visible = fl.getVisibleIndexes();
            // if (visible.include(fl.selectedLineNo)) return;
            var newIdx = topOrBottom === 'top' ? visible.first() : visible.last()-1;
            fl.selectAt(newIdx);
        }
        switch (keys) {
            case 'Enter':
                var sel = fl.getSelection();
                if (sel) this.doActionForFileItem(sel);
                else wasHandled = false;
                break;
            case 'Shift-^': this.gotoParentDir(); break;
            case 'Control-N': case 'Down': fl.selectNext(); break;
            case 'Control-P': case 'Up': fl.selectPrev(); break;
            case "Alt-V": case "PageUp": fl.scrollPage('up'); ensureSelectionIsInView('top'); break;
            case "Control-V": case "PageDown": fl.scrollPage('down'); ensureSelectionIsInView('bottom'); break;
            case "Alt-Shift->": case "End": fl.scrollToBottom(); ensureSelectionIsInView('bottom'); break;
            case "Alt-Shift-<": case "Home": fl.scrollToTop(); ensureSelectionIsInView('top'); break;
            case 'F1': this.get('targetDir').focus(); break;
            case 'F2': this.get('fileList').focus(); break;
            case 'F3': this.get('filter').focus(); break;
            case 'Alt-Down':
                if (this.get('targetDir').isFocused()) this.get('fileList').focus();
                if (this.get('fileList').isFocused()) this.get('filter').focus();
                break;
            case 'Alt-Up':
                if (this.get('fileList').isFocused()) this.get('targetDir').focus();
                if (this.get('filter').isFocused()) this.get('fileList').focus();
                break;
            case 'Alt-1': this.execItemAction(fl.selection, 0); break;
            case 'Alt-2': this.execItemAction(fl.selection, 1); break;
            case 'Alt-3': this.execItemAction(fl.selection, 2); break;
            case 'Alt-4': this.execItemAction(fl.selection, 3); break;
            case 'Alt-5': this.execItemAction(fl.selection, 4); break;
            case 'Alt-C': this.changeCwd(); break;
            case 'Alt-S': this.userQueryForSort(); break;
            default: wasHandled = false;
        }
        if (!wasHandled) return $super(evt);
        evt.stop(); return true;
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.lastFocused.focus();
    },
        userQueryForSort: function userQueryForSort() {
        var self = this;
        lively.ide.tools.SelectionNarrowing.chooseOne(['time', 'size', 'name'], function(err, selection) {
        self.get('sortBySelector').selection = selection;
        self.applySort();
    })
    },
        render: function render() {
        // console.profile(); this.render(); console.profileEnd();
        // this.render();
        this.renderDirContentFiltered();
    },
        renderDebounced: function renderDebounced() {
        var self = this;
        Functions.debounceNamed(('render-' + this.id), 40, function() { self.render(); })();
    },
        renderDirContentFiltered: function renderDirContentFiltered(path) {
        var fileList = this.get('fileList'),
            filter = this.dirState.filter,
            sortKey = this.dirState.sortKey,
            items = this.dirState.files,
            processItems = Functions.compose(
                this.itemsFilter.curry(filter),
                this.itemsSort.curry(sortKey),
                this.itemsForList),
            dirsAndFiles = items.groupBy(function(item) {
                return item.isDirectory ? 'directory' : 'file'}),
            dirsAndFilesSorted = dirsAndFiles.mapGroups(function(_, group) {
                return processItems(group); });
    fileList.isInLayoutCycle = true
        fileList.updateList(dirsAndFilesSorted.toArray().flatten());
    fileList.isInLayoutCycle = false;
    fileList.applyLayout();
    },
        reset: function reset() {
        this.dirState = {
            files: [],
            sortKey: 'name',
            filter: null,
            path: null
        }
        this.get('fileList').withAllSubmorphsDo(function(ea) { return ea.applyStyle({cssStylingMode: true}); });
        lively.bindings.connect(this.get('filter'), 'textChange', this, 'applyFilter');
        lively.bindings.connect(this.get('fileList'), 'listItemDoubleClicked', this, 'listItemDoubleClicked');
        lively.bindings.connect(this.get('sortBySelector'), 'selection', this, 'applySort');
        lively.bindings.connect(this.get('targetDir'), 'input', this, 'goto');
        lively.bindings.connect(this, 'lastFocused', this, 'focusChanged');
        this.get('targetDir').clearOnInput = false;
        this.get('filter').clearOnInput = false;
        this.get('sortBySelector').setList(['name', 'time', 'size']);
        this.get('fileList').addScript(function getMenu() {
            return this.owner.getMenuItemsFor(this.getSelection());
        });
        this.get('filter').textString = ''
        this.get('targetDir').textString = ''
        this.get('fileList').listItemContainer.removeAllMorphs();
        this.getWindow().setTitle('DirViewer');
    }
    }],
    titleBar: "DirViewer"
});

}) // end of module