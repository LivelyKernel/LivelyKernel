module('lively.ide.tools.SystemConsole').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.SystemConsole', {
    _Extent: lively.pt(493.0,234.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    name: "SystemConsole",
    layout: {adjustForNewBounds: true},
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _ClipMode: "scroll",
        _Extent: lively.pt(487.0,209.0),
        _Fill: Color.rgb(255,255,255),
        _FontSize: 10,
        _Position: lively.pt(3.0,22.0),
        _StyleSheet: ".list-item.error {\n\
    	color: red !important;\n\
    }\n\
    \n\
    .list-item.warn {\n\
    	color: orange !important;\n\
    }\n\
    \n\
    .list-item.new-log-item {\n\
    	font-weight: bold;\n\
    }\n\
    .list-item.log {\n\
    }",
        className: "lively.morphic.List",
        droppingEnabled: true,
        grabbingEnabled: false,
        isMultipleSelectionList: true,
        itemMorphs: [],
        layout: {
            adjustForNewBounds: true,
            extent: lively.pt(487.0,209.0),
            listItemHeight: 19,
            maxExtent: lively.pt(487.0,209.0),
            maxListItems: 11,
            noOfCandidatesShown: 1,
            padding: 0,
            resizeHeight: true,
            resizeWidth: true
        },
        multipleSelectionMode: "multiSelectWithShift",
        name: "SystemConsole",
        sourceModule: "lively.morphic.Lists",

        clear: function clear() {
            this.setList([]);
        },

        editItems: function editItems(items) {
            items.pluck('value').map(function(v) {
                $world.addCodeEditor({
                    title: 'log item ' + new Date(v.time),
                    content: v.string,
                    textMode: 'text'
                }).getWindow().comeForward();
            });
        },

        install: function install(_console, _window) {
            this.installConsoleWrapper(_console);
            this.installErrorCapture(_window);
        },

        installConsoleWrapper: function installConsoleWrapper(console) {
            var c = console || Global.console;
            if (!c.addConsumer) this.prepareConsole(c);

            this.warn = this.wrapperFunc('warn');
            this.error = this.wrapperFunc('error');
            this.log = this.wrapperFunc('log');

            if (c.consumers && !c.consumers.include(this)) c.addConsumer(this);
        },

        prepareConsole: function prepareConsole(platformConsole) {
            var required = ['log', 'group', 'groupEnd', 'warn', 'assert', 'error'];
            function emptyFunc() {}

            for (var i = 0; i < required.length; i++) {
                if (!platformConsole[required[i]]) platformConsole[required[i]] = emptyFunc;
            }

            var consumers = platformConsole.consumers = [];
            platformConsole.wasWrapped = false;

            function addWrappers() {
                if (platformConsole.wasWrapped) return;

                var props = [];
                for (var name in platformConsole) props.push(name);

                for (var i = 0; i < props.length; i++) {
                    (function(name) {
                        var func = platformConsole[name];
                        platformConsole['$' + name] = func;
                        if (typeof func !== 'function') return;
                        platformConsole[name] = function(/*arguments*/) {
                            func.apply(platformConsole, arguments);
                            for (var i = 0; i < consumers.length; i++) {
                                var consumerFunc = consumers[i][name];
                                if (consumerFunc) {
                                    consumerFunc.apply(consumers[i], arguments);
                                }
                            }
                        };
                    })(props[i]);
                }
                platformConsole.wasWrapped = true;
            }

            function removeWrappers() {
                for (var name in platformConsole) {
                    if (name[0] !== '$') continue;
                    var realName = name.substring(1, name.length);
                    platformConsole[realName] = platformConsole[name];
                    delete platformConsole[name];
                }
            }

            platformConsole.removeWrappers = removeWrappers;
            platformConsole.addWrappers = addWrappers;

            platformConsole.addConsumer = function(c) {
                if (consumers.indexOf(c === -1)) {
                    addWrappers();
                    consumers.push(c);
                }
            };

            platformConsole.removeConsumer = function(c) {
                var idx = consumers.indexOf(c);
                if (idx >= 0) consumers.splice(idx, 1);
                if (consumers.length === 0) removeWrappers();
            };

        },

        installErrorCapture: function installErrorCapture(_window) {
            if (!_window) _window = window;
            // window.removeEventListener('error', errorHandler)

            if (this._errorHandler) return;

            this._errorHandler = (function errorHandler(errEvent, url, lineNumber, column, errorObj) {
                var err = errEvent.error || errEvent;
                if (err.stack) {
                    var string = String(err.stack)
                    console.error("%s", string.replace(/\n/g, ''));
                } else if (err.message) {
                    console.error(err.message);
                } else console.error("%s  %s:%s", err, url, lineNumber);
            }).bind(this);

            _window.addEventListener('error', this._errorHandler);
        },

        morphMenuItems: function morphMenuItems() {
            var items = $super(),
                c = lively.Config,
                logsVerbose = c.get("verboseLogging");
            return items.concat([
                ['clear', this.clear.bind(this)],
                ['[' + (logsVerbose ? 'x' : ' ') + '] allow message popups', toggleVerboseLogging]
            ]);

            function toggleVerboseLogging() {
                c.set("verboseLogging", !logsVerbose);
            }
        },

        onDoubleClick: function onDoubleClick(evt) {
            var items = this.getSelectedItems()
            if (!items || !items.length) return false;
            this.editItems(items);
            evt.stop();
            return true;
        },

        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
            $super();
            console.log('System console started successfully.');
        },

        onKeyDown: function onKeyDown(evt) {
            var s = evt.getKeyString();
            if (s === "Enter") {
                var items = this.getSelectedItems();
                items.length && this.editItems(items);
                evt.stop(); return true;
            }
            return $super(evt);
        },

        onLoad: function onLoad() {
            this.clear();
            this.install();
        },

        onLoadFromPartsBin: function onLoadFromPartsBin() {
            this.onLoad();
            console.log('System console started successfully.');
        },

        onOwnerChanged: function onOwnerChanged(newOwner) {
            this[this.world() ? 'install' : 'uninstall']();
        },

        onWindowGetsFocus: function onWindowGetsFocus() {
            this.world() && this.focus();
        },

        reset: function reset() {
            this.enableMultipleSelections('multiSelectWithShift');
            this.uninstall();
            this.clear();
            this.getWindow().setTitle('System Console');
            this.getWindow().name = "SystemConsole";
            // this.partsBinMetaInfo = meta
        },

        setupScroll: function setupScroll(noOfItems, layout) {
            $super(noOfItems, layout);
            this.setClipMode('scroll');
        },

        uninstall: function uninstall() {
            this.uninstallConsoleWrapper();
            this.uninstallErrorCapture();
        },

        uninstallConsoleWrapper: function uninstallConsoleWrapper() {
            console.consumers.remove(this);
        },

        uninstallErrorCapture: function uninstallErrorCapture() {
            if (!this._errorHandler) return;
            window.removeEventListener('error', this._errorHandler);
            delete this._errorHandler;
        },

        wrapperFunc: function wrapperFunc(type) {

        var list = this;

        return function consoleWrapper(/*args*/) {
            var string = String(arguments[0]);
            for (var i = 1; i < arguments.length; i++) {
                var idx = string.indexOf('%s');
                if (idx > -1) string = string.slice(0,idx) + String(arguments[i]) + string.slice(idx+2);
            }

            var oneLine = string.replace(/\n/g, '');

            keepScrollOrScrollDownAfter(function() {
                var last = list.getList().last()
                var repeated = repeatEntry(oneLine, last);
                if (repeated) {
                    list.removeItemOrValue(last);
                    oneLine = repeated;
                };

                list.addItem({
                    isListItem: true,
                    string: oneLine,
                    value: {string: string, time: Date.now()},
                    cssClassNames: [type, 'new-log-item']
                });

                unemphasizeOldItems();
            });
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function repeatEntry(string, item) {
            if (!item) return null;
            var repeatRe = /^[0-9]+x\s*/,
                repeatMatch = item.string.match(repeatRe);
            if (repeatMatch && repeatMatch[0]) {
                var repeat = parseInt(repeatMatch[0]);
                var itemString = item.string.replace(repeatRe, '');
            } else {
                var repeat = 1;
                var itemString = item.string;
            }

            return !isNaN(repeat) && itemString === string ?
                (repeat + 1) + 'x ' + string : null;
        }

        function keepScrollOrScrollDownAfter(func) {
            if (!list.world()) { func(); return; }

            var maxScroll = list.getMaxScrollExtent().y;
            var scroll = list.getScroll();
            var scrollDown = scroll[1] >= maxScroll - 10;

            func();

            if (scrollDown) list.scrollToBottom();
            else list.setScroll(scroll[0], scroll[1])
        }

        function unemphasizeOldItems() {
            var now = Date.now();
            var old = 1000*10;
            list.getList()
                .filter(function(ea) { return now - ea.value.time > old; })
                .forEach(function(ea) { ea.cssClassNames.remove('new-log-item'); })
        }
    },

    }],
    titleBar: "System Console"
});


Object.extend(lively.ide.tools.SystemConsole, {

    openInContext: function(globalContext) {
        var win = lively.BuildSpec('lively.ide.tools.SystemConsole')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
        win.targetMorph.reset();
        win.targetMorph.install(globalContext.console, globalContext);
        return win;
    },

    open: function() {
        return lively.BuildSpec('lively.ide.tools.SystemConsole')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
    }
});

}) // end of module
