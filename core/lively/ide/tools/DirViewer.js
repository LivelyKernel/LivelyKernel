module('lively.ide.tools.DirViewer').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.DirViewer', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(500,476.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    ignoreEventsOnExpand: false,
    layout: { adjustForNewBounds: true },
    name: "DirViewer",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(495,451.0),
        _Fill: Color.rgb(245,245,245),
        _Position: lively.pt(3.0,22.0),
        _StyleSheet: ".list-item {\n\
    	font-family: Monaco, monospace !important;\n\
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
                _Position: lively.pt(5,0),
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
            }, 
            {
                _Extent: lively.pt(20.0,18.0),
                _Position: lively.pt(1,0),
                className: "lively.morphic.Button",
                label: "⟳",
                name: "refreshButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "refreshContent", {});
            }
            }, {
                _Extent: lively.pt(50.0,18.0),
                _Position: lively.pt(2,0),
                className: "lively.morphic.Button",
                label: "hiera",
                name: "printDirHieraButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "printDirHierarchy", {});
            }
            }, {
                _Extent: lively.pt(50.0,18.0),
                _Position: lively.pt(2,0),
                className: "lively.morphic.Button",
                label: "add dir",
                name: "addDirButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "createDirInteractively", {});
            }
            }, {
                _Extent: lively.pt(50.0,18.0),
                _Position: lively.pt(3,0),
                className: "lively.morphic.Button",
                label: "add file",
                name: "addFileButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "createFileInteractively", {});
            }
            }, {
                _Extent: lively.pt(50.0,18.0),
                _Position: lively.pt(4,0),
                className: "lively.morphic.Button",
                label: "set cwd",
                name: "setCwdButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "changeCwd", {});
            }
            }, {
                _Extent: lively.pt(60.0,18.0),
                _Position: lively.pt(5,0),
                className: "lively.morphic.Button",
                label: "download",
                name: "downloadDirButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("DirViewer"), "downloadDir", {});
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
            isMultipleSelectionList: false,
            // multipleSelectionMode: 'multiSelectWithShift',
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
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "listItemDoubleClicked", this.get("DirViewer"), "listItemDoubleClicked", {});
        },
            createListItemMorph: function createListItemMorph(string, i, layout) {
            var m = $super(string, i, layout);
            m.renderContext().textNode.style.pointerEvents = 'none'; // issue with double clk
            m.addScript(function onClick(evt) {
              // FIXME rk 2015-01-13: using onDoubleClick would be better but
              // for some reason repeated double clicks arent recognized reliably,
              // so this hack helpes with that
              if (this._dblClickHelper_wasTarget) {
                var list = this.owner.owner,
                    value = this.owner.owner.itemList[this.index];
                lively.bindings.signal(list, 'listItemDoubleClicked', value.value || value);
              } else {
                this._dblClickHelper_wasTarget = true;
                setTimeout(function() { delete  this._dblClickHelper_wasTarget; }.bind(this), 400);
              }
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
        createFileInteractively: function createFileInteractively() {
        var base = this.dirState.path,
            self = this;
        Functions.composeAsync(
            function(next) {
                $world.prompt("Create file: Enter a name", function(input) {
                    next(!input ? new Error("no input") : null, input); });
            },
            function(fileName, next) {
                var path = lively.lang.string.joinPath(base, fileName);
                lively.shell.writeFile(path, "empty file", function(cmd) {
                    next(null, path); });
            },
            function(filePath, next) {
              self.fetchAndDisplayDirContent(function(err) { next(err, filePath); });
            },
            function(filePath, next) {
                var name = filePath.split('/').last();
                setTimeout(function() {
                  self.get("fileList").setSelectionMatching(new RegExp(" " + name + "$"));
                  next();
                }, 40);
            })(function(err) {
                if (err) show("Error creating file: " + err);
                else Global.alertOK("File created");
            });
    },
        changeCwd: function changeCwd() {
        var d = this.dirState.path;
        $world.alertOK(d + '\nis now Lively\'s working directory');
        lively.ide.CommandLineInterface.setWorkingDirectory(d);
    },
        downloadDir: function downloadDir() {
          var path = this.dirState.path
          var url = URL.nodejsBase.withFilename("DownloadDirServer/")
            .withQuery({path: path});
          window.open(url, "_blank");
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "lastFocused", this, "focusChanged", {});
    },

        printDirHierarchy: function printDirHierarchy() {
          lively.ide.commands.exec(
            'lively.ide.CommandLineInterface.printDirectory',
            {dir: this.dirState.path});
        },

        createDirInteractively: function createDirInteractively() {
        var base = this.dirState.path,
            self = this;
        Functions.composeAsync(
            function(next) {
                $world.prompt("Create directory: Enter a name", function(input) {
                    next(!input ? new Error("no input") : null, input); });
            },
            function(dirName, next) {
                var path = lively.lang.string.joinPath(base, dirName);
                lively.shell.run("mkdir -p " + path, {}, function(err, cmd) {
                    next(null, dirName); });
            },
            function(dirName, next) {
              self.fetchAndDisplayDirContent(function(err) { next(err, dirName); });
            },
            function(dirName, next) {
                setTimeout(function() {
                  self.get("fileList").setSelectionMatching(new RegExp(" " + dirName + "$"));
                  next();
                }, 40);
            })(function(err) {
                if (err) show("Error creating directory: " + err);
                else Global.alertOK("Directory created");
            });
    },

        deleteSelectedFileInteractively: function deleteSelectedFileInteractively() {
        var sel = this.get("fileList").selection;
        if (!sel) { show("nothing selected"); return; }

        var base = this.dirState.path,
            self = this;
        var path = base + (base.endsWith("/") ? "" : "/") + sel.fileName;

        $world.confirm("Really delete " + path + "?", function(input) {
            if (!input) return;
            lively.shell.run("rm -rf " + sel.fileName, {cwd: base}, function(err, cmd) {
                self.fetchAndDisplayDirContent(); });
        });
    },

        doActionForFileItem: function doActionForFileItem(fileItem) {
        var j = lively.ide.FileSystem.joinPaths;
        var fullPath = j(this.dirState.path, fileItem.path);
        if (fileItem.isDirectory) {
            this.goto(fullPath);
        } else {
            lively.ide.openFile(fullPath)
        }
    },
        refreshContent: function refreshContent() {
        var list = this.get("fileList");
        var index = list.selectedLineNo;
        var scroll = list.getScroll()[0];
        this.fetchAndDisplayDirContent(function() {
          list.setScroll(0, scroll);
          list.selectAt(index);
        });
      },
        fetchAndDisplayDirContent: function fetchAndDisplayDirContent(thenDo) {
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
            function(err, files) {
                self.dirState.files = [parentDir].concat(files);
                lively.bindings.connect(
                  self, 'dirContentUpdated',
                  {thenDo: function() {thenDo && thenDo();}}, 'thenDo',
                  {removeAfterUpdate: true});
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
        },
        remove = {
            description: 'remove',
            exec: function() {
              $world.confirm("really remove " + fullPath + "?", function(input) {
                if (!input) return;
                lively.shell.rm(fullPath, function(err) {
                  if (!err) self.get("fileList").removeItemOrValue(item);
                  else show("Error removing " + fullPath + ": " + (err.stack || err));
                })
              })
            }
        },
        browse = {
            description: 'open in browser',
            exec: function() {
              var dir = lively.shell.getWorkingDirectory();
              if (fullPath.indexOf(dir) !== 0) $world.inform("Cannot browse " + fullPath + " because file is not accessible from the web");
              else window.open(fullPath.slice(dir.length))
            }
        },
        rename = {
          description: 'rename',
          exec: function() {
            $world.prompt("rename " + item.path + " to:", function(input) {
              if (!input) return;
              lively.shell.run("mv " + fullPath + " " + j(dir, input), function(err, cmd) {
                if (err) $world.inform("error renaming: " + err);
                else $world.alertOK(fullPath + " -> " + j(dir, input));
                self.fetchAndDisplayDirContent(function() {
                  self.get("fileList").setSelectionMatching(new RegExp(" " + input + "$"));
                });
              });
            }, {historyId: "lively.ide.DirViewer.rename", insput: item.path});
          }
        };
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    if (!item) return [];
    var self = this;
    var j = lively.ide.FileSystem.joinPaths;
    var dir = this.dirState.path;
    var fullPath = j(this.dirState.path, item.path);
    return item.isDirectory ?
      [copyPath, browse, rename, remove] :
      [copyPath, browse, rename, remove, openInSCB, openInTextEditor];
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
        this.getWindow().setTitle('Dir: ' + dir);
        this.fetchAndDisplayDirContent();
    },
        gotoParentDir: function gotoParentDir() {
        var j = lively.ide.FileSystem.joinPaths;
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
                return fileInfo.path.toLowerCase().include(filter);
            } else if (Object.isRegExp(filter)) {
                return filter.test(fileInfo.path);
            } else { return true; }
        });
    },
        itemsForList: function itemsForList(items) {
        return items.map(function(ea) {
            return {
                isListItem: true,
                string: stringify(ea),
                value: ea,
                cssClasses: [ea.isDirectory ? 'directory' : 'file']
            }
        });

        function stringify(item) {
            var size = Global.Numbers.humanReadableByteSize(item.size);
            return Strings.format("%s %s %s",
                pad(printDate(item.lastModified), 20),
                pad(size, 9),
                item.path || item.fileName);
        }

        function pad(string, entireLength) { return Strings.pad(string, entireLength-string.length, true); }

        function printDate(d) {
            return d && String(d) !== "Invalid Date" && d.format ?
                d.format("yyyy-mm-dd HH:MM:ss") : "no date";
        }

    },

        itemsSort: function itemsSort(sortKey, items) {
        return items.sortBy(function(item) {
            if (sortKey === 'name') {
                return item.path;
            } else if (sortKey === 'time') {
                return -item.lastModified;
            } else if (sortKey === 'size') {
                return -item.size;
            } else {
                return item.path;
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

    onKeyDown: function onKeyDown(evt) {
    var fl              = this.get('fileList'),
        dirInput        = this.get('targetDir'),
        filter          = this.get('filter'),
        dirInputFocused = dirInput.isFocused(),
        fileListFocused = fl.isFocused(),
        filterFocused   = filter.isFocused(),
        keys            = evt.getKeyString(),
        wasHandled      = true;

    switch (keys) {
        case 'Enter':
            var sel = fl.getSelection();
            if (sel && (!dirInputFocused || this.dirState.path === dirInput.getInput()))
                this.doActionForFileItem(sel);
            else
                wasHandled = false;
            break;
        case 'Shift-^': this.gotoParentDir(); break;
        case 'Control-N': case 'Down': fl.selectNext(); break;
        case 'Control-P': case 'Up': fl.selectPrev(); break;
        case "Alt-V": case "PageUp": fl.scrollPage('up'); ensureSelectionIsInView('top'); break;
        case "Control-V": case "PageDown": fl.scrollPage('down'); ensureSelectionIsInView('bottom'); break;
        case "Alt-Shift->": case "End": fl.scrollToBottom(); ensureSelectionIsInView('bottom'); break;
        case "Alt-Shift-<": case "Home": fl.scrollToTop(); ensureSelectionIsInView('top'); break;
        case "Command-Shift-+": case "Control-Shift-+": this.createDirInteractively(); break;
        case 'F1': dirInput.focus(); break;
        case 'F2': fl.focus(); break;
        case 'F3': filter.focus(); break;
        case 'Alt-Down':
            if (dirInputFocused) fl.focus();
            if (fileListFocused) filter.focus();
            break;
        case 'Alt-Up':
            if (fileListFocused) dirInput.focus();
            if (filterFocused) fl.focus();
            break;
        case 'Alt-1': this.execItemAction(fl.selection, 0); break;
        case 'Alt-2': this.execItemAction(fl.selection, 1); break;
        case 'Alt-3': this.execItemAction(fl.selection, 2); break;
        case 'Alt-4': this.execItemAction(fl.selection, 3); break;
        case 'Alt-5': this.execItemAction(fl.selection, 4); break;
        case 'Alt-C': this.changeCwd(); break;
        case 'Alt-S': this.userQueryForSort(); break;
        case 'Alt-P': this.printDirHierarchy(); break;
        default: wasHandled = false;
    }

    if (!wasHandled) {
        return dirInputFocused || filterFocused ? false : $super(evt);
    } else {
        evt.stop(); return true;
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    function ensureSelectionIsInView(topOrBottom) {
        var visible = fl.getVisibleIndexes();
        // if (visible.include(fl.selectedLineNo)) return;
        var newIdx = topOrBottom === 'top' ? visible.first() : visible.last()-1;
        fl.selectAt(newIdx);
    }
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
    fileList.isInLayoutCycle = true;
    fileList.updateList(dirsAndFilesSorted.toArray().flatten());
    if (!fileList.selection) fileList.selectAt(0);
    fileList.isInLayoutCycle = false;
    fileList.applyLayout();
    lively.bindings.signal(this, 'dirContentUpdated');
},
selectFileNamed: function selectFileNamed(fn) {
  this.get("fileList").setSelectionMatching(new RegExp(" " +fn+"$"))
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
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
            this.dirState = Object.extend({}, this.dirState);
        }
    }],
    titleBar: "DirViewer"
});

Object.extend(lively.ide.tools.DirViewer, {
    on: function(path) {
        var dirViewer = lively.BuildSpec('lively.ide.tools.DirViewer').createMorph();
        dirViewer.targetMorph.goto(path || lively.ide.CommandLineInterface.cwd());
        return dirViewer.openInWorldCenter().comeForward();
    },
    onFile: function(path) {
        var sep = '/',
            fileParts = path.split(sep),
            dirPath = fileParts.slice(0,-1).join(sep),
            fn = fileParts.last(),
            d = lively.ide.tools.DirViewer.on(dirPath);
        lively.bindings.once(d.targetMorph, 'dirContentUpdated', {select: function() {
          (function() { d.targetMorph.selectFileNamed(fn); }).delay(0);
        }}, 'select');
        return d;
    }
});

}) // end of module
