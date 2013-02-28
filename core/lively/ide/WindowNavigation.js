module('lively.ide.WindowNavigation').requires('lively.morphic.Widgets', 'lively.persistence.BuildSpec', 'lively.morphic.tests.Helper').toRun(function() {

(function installKeyEventHandler() {
    $("body").off('keydown');
    var winSwitcher;
    $("body").bind('keydown', function(evt) {
        if (evt.keyCode === 116 // F5
        || (evt.keyCode === 192 && (evt.ctrlKey || evt.metaKey))) {
            evt.stopPropagation();
            winSwitcher = winSwitcher || new lively.ide.WindowNavigation.WindowManager().createSwitcher();
            winSwitcher.open({invokingEvent: evt});
            return true;
        }
        return false;
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
            win = this.findWindow(function(ea) { return ea.getName === morphOrTitleOrName; });
        }
        if (!win) return;
        win.comeForward();
    }
},
'morphic switcher', {
    createSwitcher: function() {
        var spec = {
          _ClipMode: "hidden",
          _Extent: "<eval>lively.pt(200,200)",
          _Position: "<eval>lively.pt(0,0)",
          _PreviousBorderWidth: 1,
          _Rotation: 0,
          _Scale: 1,
          _StyleClassNames: [
            "Box",
            "Morph",
            "tab-list"
          ],
          _StyleSheet: ".tab-list {\n\
    background-color: rgba(1,1,1,0.5);\n\
    border-radius: 5px;\n\
}\n\
\n\
.tab-list-item > div {\n\
}\n\
\n\
.tab-list-item span {\n\
    font-family: Verdana;\n\
	font-size: 14pt;\n\
	color: white !important;\n\
	font-width: bold !important;\n\
	text-shadow: none                                     !important;\n\
}\n\
\n\
.tab-list-item.selected {\n\
	font-weight: bold;\n\
	background-color: rgba(1,1,1,0.4);\n\
	border-radius: 5px !important;\n\
	border: 0px white solid !important;\n}",
          className: "lively.morphic.Box",
          closeAndPromoteWindow: "<function>function closeAndPromoteWindow() {\n\
    this.selectCurrent();\n\
    this.removeAllMorphs();\n\
    this.remove();\n\
}",
          currentSel: 1,
          doNotSerialize: [
            "state",
            "timeOpened"
          ],
          droppingEnabled: true,
          halosEnabled: true,
          initialSelection: 1,
          listWindows: "<function>function listWindows(windows) {\n\
            this.removeAllMorphs();\n\
            var texts = windows.map(function(win, i) {\n\
                var title = win.getTitle();\n\
                if (i <= 9) title = i + \' - \' + title\n\
                else title = \'    \' + title;\n\
                var text = lively.morphic.Text.makeLabel(title, {\n\
                        extent: this.getExtent().withY(20),\n\
                        fixedHeight: false\n\
                    });\n\
                this.addMorph(text); \n\
                text.fit();\n\
                text.window = win;\n\
                text.addStyleClassName(\'tab-list-item\');\n\
                return text;\n\
            }, this);\n\
        \n\
            (function() {\n\
                pos = this.innerBounds().topLeft();\n\
                texts.forEach(function(ea) {\n\
                    ea.setPosition(pos);\n\
                    pos = ea.bounds().bottomLeft();\n\
                });\n\
                var listBounds = this.submorphBounds(this.getTransform()).extent();\n\
                this.setExtent(listBounds);\n\
            }).bind(this).delay(0);\n\
        \n\
            this.currentSel = null;\n\
        }",
          name: "WindowSwitcher",
          noWindows: "<function>function noWindows() {\n\
            text = lively.morphic.Text.makeLabel('no windows', {\n\
                extent: this.getExtent().withY(20),\n\
                fixedHeight: false\n\
            });\n\
            text.addStyleClassName(\'tab-list-item\');\n\
            text.addStyleClassName(\'selected\');\n\
            this.addMorph(text);\n\
            (function() {\n\
                this.removeAllMorphs();\n\
                this.remove();\n\
            }).bind(this).delay(2);\n\
        }",
          onKeyDown: "<function>function onKeyDown(evt) {\n\
            var modifierPressed = evt.isCtrlDown() || evt.isCommandKey();\n\
            if (modifierPressed && evt.keyCode === 192) { // \"`\" key\n\
                if (evt.isShiftDown())  this.selectPrev();\n\
                else this.selectNext();\n\
            } else if (evt.keyCode === Event.KEY_DOWN) {\n\
                this.selectNext();\n\
            } else if (evt.keyCode === Event.KEY_UP) {\n\
                this.selectPrev();\n\
            } else if (evt.keyCode === Event.KEY_ESC) {\n\
                this.selectN(0);\n\
                this.closeAndPromoteWindow();\n\
            } else if (evt.keyCode === Event.KEY_RETURN) {\n\
                this.closeAndPromoteWindow();\n\
            } else if (evt.keyCode >= 48 && evt.keyCode <= 58) { // 0-9\n\
                var n = evt.keyCode - 48;\n\
                this.selectN(n);\n\
            }\n\
            evt.stop();\n\
            return true;\n\
        }",
          onKeyUp: "<function>function onKeyUp(evt) {\n\
        //alert(Strings.format(\'code: %s cmd: %s ctrl: %s\',\n\
        //    evt.keyCode, evt.isCommandKey(), evt.isCtrlDown()));\n\
            var startEvt = this.state && this.state.openedWithEvt;\n\
            if (!startEvt) return false;\n\
            if (!startEvt.isCtrlDown() && !startEvt.isCommandKey()) return false;\n\
            var sameModifier = startEvt.isCtrlDown() === evt.isCtrlDown()\n\
                            || startEvt.isCommandKey() === evt.isCommandKey();\n\
            if (!sameModifier) return false;\n\
            this.closeAndPromoteWindow();\n\
            return true;\n\
        }",
          open: "<function>function open(options) {\n\
            var w = $world,\n\
                mgr = new lively.ide.WindowNavigation.WindowManager(w),\n\
                windows = mgr.getWindows().reverse();\n\
        \n\
            this.state = {\n\
                timeOpened: Date.now(),\n\
                openedWithEvt: options && options.invokingEvent,\n\
                showSelLater: Functions.debounce(this.showDelay, this.showSelection.bind(this))\n\
            }\n\
            if (this.state.openedWithEvt) {\n\
                lively.morphic.EventHandler.prototype.patchEvent(this.state.openedWithEvt);\n\
            }\n\
        \n\
            w.addMorphFront(this);\n\
            this.align(this.bounds().center(), w.visibleBounds().center());\n\
            if (windows.length === 0 || windows.length === 1) { this.noWindows(); return; }\n\
            this.listWindows(windows);\n\
            this.selectN(this.initialSelection || 0);\n\
        }",
          reset: "<function>function reset() {\n\
            this.removeAllMorphs();\n\
            this.initialSelection = 1; // index to select\n\
            this.showDelay = 700; // ms\n\
            this.doNotSerialize = [\'timeOpened\', \'state\'];\n\
        }",
          selectCurrent: "<function>function selectCurrent() {\n\
            this.currentSel = (this.currentSel || 0);\n\
            if (!this.submorphs[this.currentSel]) this.currentSel = 0;\n\
            if (this.submorphs[this.currentSel]) this.selectN(this.currentSel, true);\n\
        }",
          selectN: "<function>function selectN(n, suppressSelfPromote) {\n\
            var item = this.submorphs[n];\n\
            if (!item || !item.window) return;\n\
            var win = item.window;\n\
            this.submorphs.invoke(\"removeStyleClassName\", \"selected\");\n\
            item.addStyleClassName(\'selected\');\n\
            this.currentSel = n;\n\
            if (suppressSelfPromote) {\n\
                try { win.comeForward(); } catch(e) { console.error(e) };\n\
                return;\n\
            }\n\
            this.state.showSelLater();\n\
            this.focus();\n\
        }",
          selectNext: "<function>function selectNext() {\n\
            this.currentSel = (this.currentSel || 0) + 1;\n\
            if (!this.submorphs[this.currentSel]) this.currentSel = 0;\n\
            this.selectN(this.currentSel);\n\
        }",
          selectPrev: "<function>function selectPrev() {\n\
            this.currentSel = (this.currentSel || 0) - 1;\n\
            if (!this.submorphs[this.currentSel]) this.currentSel = this.submorphs.length - 1;\n\
            this.selectN(this.currentSel);\n\
        }",
          showDelay: 700,
          showSelection: "<function>function showSelection() {\n\
            // called via debounce\n\
            var n = this.currentSel,\n\
                item = this.submorphs[n],\n\
                 win = item && item.window;\n\
            if (!win) return;\n\
            win.owner.addMorphFront(win);\n\
            this.owner.addMorphFront(this);\n\
            win.show();\n\
            this.focus();\n\
        }",
          showsHalos: false,
          sourceModule: "lively.morphic.Core",
          submorphs: []
        };

        var switcher = lively.morphic.Morph.fromSpec(spec);
        return switcher;
    }
});

AsyncTestCase.subclass('users.robertkrahn.tests.WindowNavigation.WindowManager', lively.morphic.tests.TestCase.prototype,
'running', {
    setUp: function($super) {
        $super();
        this.createWorld();
        this.sut = new lively.ide.WindowNavigation.WindowManager(this.world);
    }
},
'testing', {
    testGetListOfWindows: function() {
        this.world.addFramedMorph(lively.morphic.Morph.makeRectangle(0,0, 100, 100), 'A', pt(20, 20));
        this.world.addTextWindow({title: 'B', content: 'foo', position: pt(10,10)});
        var windows = this.sut.getWindows();
        this.assertEqualState(['A', 'B'], windows.invoke('getTitle'));
        this.done();
    },
    testSelectWindow: function() {
        this.world.addCodeEditor({title: 'A', content: 'foo', position: pt(10,10)});
        this.world.addCodeEditor({title: 'B', content: 'bar', position: pt(20,20)});
        var windows = this.sut.getWindows();
        this.assertEqualState(['A', 'B'], windows.invoke('getTitle'));
        this.delay(function() {
            this.sut.activate(windows[0]);
            this.assert(windows[0].targetMorph.isFocused(), 'code editor in window A not focused');
            this.sut.activate('B');
        }, 0);
        this.delay(function() {
            this.assert(windows[1].targetMorph.isFocused(), 'code editor in window B not focused');
            this.done();
        }, 50);
    }
});

}) // end of module
