module('lively.ide.WindowNavigation').requires('lively.morphic.Widgets', 'lively.persistence.BuildSpec').toRun(function() {

(function installKeyEventHandler() {
    $("body").off('keydown');
    var winSwitcher;
    $("body").bind('keydown', function(evt) {
        // lively.morphic.EventHandler.prototype.patchEvent(evt);
        if (evt.keyCode === 116 // F5
        || (evt.keyCode === 192 && (evt.ctrlKey || evt.metaKey))) {
            evt.stopPropagation();
            winSwitcher = winSwitcher || new lively.ide.WindowNavigation.WindowManager().createSwitcher();
            winSwitcher.open({invokingEvent: evt});
            return true;
        }
        if (evt.keyCode === Event.KEY_ESC && evt.metaKey && $world.closeActiveWindow()) {
            evt.stopPropagation();
            return true;
        }
        return undefined;
    });
})();

Object.subclass('lively.ide.WindowNavigation.WindowManager',
'initialzing', {
    initialize: function(containerMorph) {
        this.root = containerMorph;
    }
},
'accessing', {
    getWindows: function() {
        return this.root.submorphs.select(function(ea) { return ea.isWindow; });
    },
    findWindow: function(func) { return this.getWindows().detect(func); }
},
'interaction', {
    activate: function(morphOrTitleOrName) {
        if (!morphOrTitleOrName) return;
        var win = morphOrTitleOrName.isMorph && morphOrTitleOrName;
        if (!win) {
            win = this.findWindow(function(ea) { return ea.getTitle() === morphOrTitleOrName; });
        }
        if (!win) {
            win = this.findWindow(function(ea) { return ea.getName() === morphOrTitleOrName; });
        }
        if (!win) return;
        win.comeForward();
    }
},
'morphic switcher', {
    createSwitcher: function() {
        var spec = {
            _ClipMode: "hidden",
            _Extent: lively.pt(200,200),
            _Position: lively.pt(0,0),
            _PreviousBorderWidth: 1,
            _Rotation: 0,
            _Scale: 1,
            _StyleClassNames: ["Box", "Morph", "tab-list"],
            _StyleSheet: ".tab-list {\n"
                       + "  background-color: rgba(1,1,1,0.5);\n"
                       + "  border-radius: 5px;\n"
                       + "}\n"
                       + ".tab-list-item span {\n"
                       + "  font-family: Verdana;\n"
                       + "  font-size: 14pt;\n"
                       + "  color: white !important;\n"
                       + "  font-width: bold !important;\n"
                       + "  text-shadow: none !important;\n"
                       + "}\n"
                       + ".tab-list-item.selected {\n"
                       + "  font-weight: bold;\n"
                       + "  background-color: rgba(1,1,1,0.4);\n"
                       + "  border-radius: 5px !important;\n"
                       + "  border: 0px white solid !important;\n"
                       + "}",
            className: "lively.morphic.Box",
            closeAndPromoteWindow: function closeAndPromoteWindow() {
                this.selectCurrent();
                this.removeAllMorphs();
                this.remove();
            },
            currentSel: 1,
            doNotSerialize: ["state", "timeOpened"],
            droppingEnabled: true,
            halosEnabled: true,
            initialSelection: 1,
            listWindows: function listWindows(windows) {
                this.removeAllMorphs();
                var texts = windows.map(function(win, i) {
                    var title = win.getTitle();
                    if (i <= 9) title = i + ' - ' + title
                    else title = '    ' + title;
                    var text = lively.morphic.Text.makeLabel(title, {
                        extent: this.getExtent().withY(20),
                        fixedHeight: false
                    });
                    this.addMorph(text);
                    text.fit();
                    text.window = win;
                    text.addStyleClassName('tab-list-item');
                    return text;
                }, this);

                (function() {
                    var pos = this.innerBounds().topLeft();
                    texts.forEach(function(ea) {
                        ea.setPosition(pos);
                        pos = ea.bounds().bottomLeft();
                    });
                    var listBounds = this.submorphBounds(this.getTransform()).extent();
                    this.setExtent(listBounds);
                }).bind(this).delay(0);

                this.currentSel = null;
            },
            name: "WindowSwitcher",
            noWindows: function noWindows() {
                var text = lively.morphic.Text.makeLabel('no windows', {
                    extent: this.getExtent().withY(20),
                    fixedHeight: false
                });
                text.addStyleClassName('tab-list-item');
                text.addStyleClassName('selected');
                this.addMorph(text);
                (function() {
                    this.removeAllMorphs();
                    this.remove();
                }).bind(this).delay(2);
            },
            onKeyDown: function onKeyDown(evt) {
                var modifierPressed = evt.isCtrlDown() || evt.isCommandKey();
                if (modifierPressed && evt.keyCode === 192) { // \"`\" key
                    if (evt.isShiftDown())  this.selectPrev();
                    else this.selectNext();
                } else if (evt.keyCode === Event.KEY_DOWN) {
                    this.selectNext();
                } else if (evt.keyCode === Event.KEY_UP) {
                    this.selectPrev();
                } else if (evt.keyCode === Event.KEY_ESC) {
                    this.selectN(0);
                    this.closeAndPromoteWindow();
                } else if (evt.keyCode === Event.KEY_RETURN) {
                    this.closeAndPromoteWindow();
                } else if (evt.keyCode >= 48 && evt.keyCode <= 58) { // 0-9
                    var n = evt.keyCode - 48;
                    this.selectN(n);
                }
                evt.stop();
                return true;
            },
            onKeyUp: function onKeyUp(evt) {
                //alert(Strings.format('code: %s cmd: %s ctrl: %s',
                //    evt.keyCode, evt.isCommandKey(), evt.isCtrlDown()));
                var startEvt = this.state && this.state.openedWithEvt;
                if (!startEvt) return false;
                if (!startEvt.isCtrlDown() && !startEvt.isCommandKey()) return false;
                var sameModifier = startEvt.isCtrlDown() === evt.isCtrlDown()
                                || startEvt.isCommandKey() === evt.isCommandKey();
                if (!sameModifier) return false;
                this.closeAndPromoteWindow();
                return true;
            },
            open: function open(options) {
                var w = lively.morphic.World.current(),
                    mgr = new lively.ide.WindowNavigation.WindowManager(w),
                    windows = mgr.getWindows().reverse(),
                    sel = windows[0] && windows[0].isActive() ? 1 : 0;

                this.state = {
                    timeOpened: Date.now(),
                    openedWithEvt: options && options.invokingEvent,
                    showSelLater: Functions.debounce(this.showDelay, this.showSelection.bind(this))
                }
                if (this.state.openedWithEvt) {
                    lively.morphic.EventHandler.prototype.patchEvent(this.state.openedWithEvt);
                }

                w.addMorphFront(this);
                this.align(this.bounds().center(), w.visibleBounds().center());
                if (windows.length === 0) { this.noWindows(); return; }
                this.listWindows(windows);
                this.selectN(sel);
            },
            reset: function reset() {
                this.removeAllMorphs();
                this.initialSelection = 1; // index to select
                this.showDelay = 700; // ms
                this.doNotSerialize = ['timeOpened', 'state'];
            },
            selectCurrent: function selectCurrent() {
                this.currentSel = (this.currentSel || 0);
                if (!this.submorphs[this.currentSel]) this.currentSel = 0;
                if (this.submorphs[this.currentSel]) this.selectN(this.currentSel, true);
            },
            selectN: function selectN(n, suppressSelfPromote) {
                var item = this.submorphs[n];
                if (!item || !item.window) return;
                var win = item.window;
                this.submorphs.invoke("removeStyleClassName", "selected");
                item.addStyleClassName('selected');
                this.currentSel = n;
                if (suppressSelfPromote) {
                    try { win.comeForward(); } catch(e) { console.error(e) };
                    return;
                }
                this.state.showSelLater();
                this.focus();
            },
            selectNext: function selectNext() {
                this.currentSel = (this.currentSel || 0) + 1;
                if (!this.submorphs[this.currentSel]) this.currentSel = 0;
                this.selectN(this.currentSel);
            },
            selectPrev: function selectPrev() {
                this.currentSel = (this.currentSel || 0) - 1;
                if (!this.submorphs[this.currentSel]) this.currentSel = this.submorphs.length - 1;
                this.selectN(this.currentSel);
            },
            showDelay: 700,
            showSelection: function showSelection() {
                // called via debounce
                var n = this.currentSel,
                    item = this.submorphs[n],
                    win = item && item.window;
                if (!win) return;
                win.show();
                this.focus();
            },
            showsHalos: false,
            sourceModule: "lively.morphic.Core",
            submorphs: []
        };

        var switcher = lively.morphic.Morph.fromSpec(spec);
        return switcher;
    }
});

}) // end of module
