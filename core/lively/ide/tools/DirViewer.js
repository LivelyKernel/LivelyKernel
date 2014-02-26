module('lively.ide.tools.DirViewer').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.DirViewer', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(498.8,476.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    ignoreEventsOnExpand: false,
    layout: { adjustForNewBounds: true },
    name: "DirViewer",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(492.8,451.0),
        _Fill: Color.rgb(245,245,245),
        _Position: lively.pt(3.0,22.0),
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
        dirState: {files: [], filter: null, path: null, sortKey: "name" },
        droppingEnabled: true,
        isCopyMorphRef: true,
        lastFocused: {
            isMorphRef: true,
            name: "targetDir"
        },
        layout: {
            borderSize: 8,
            extentWithoutPlaceholder: lively.pt(492.8,452.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 4,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        morphRefId: 1,
        name: "DirViewer",
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
            droppingEnabled: true,
            layout: {
                borderSize: 2,
                extentWithoutPlaceholder: lively.pt(474.0,24.2),
                resizeWidth: true,
                spacing: 3,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "Rectangle",
            submorphs: [{
                _ClipMode: "auto",
                _Extent: lively.pt(113.0,19.0),
                _Fill: Color.rgb(243,243,243),
                _Position: lively.pt(1.6,1.6),
                className: "lively.morphic.DropDownList",
                droppingEnabled: true,
                itemList: ["name","time","size"],
                name: "sortBySelector",
                selectOnMove: false,
                selectedLineNo: 0,
                selection: "name",
                sourceModule: "lively.morphic.Lists",
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
            _BorderWidth: 1,
            _ClipMode: {x: "hidden", y: "scroll"},
            _Extent: lively.pt(477.0,362.3),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(7.9,58.6),
            changeTriggered: true,
            className: "lively.morphic.List",
            droppingEnabled: true,
            itemList: [],
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
                }
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
            connections: { input: {} },
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
