module('lively.ide.WindowNavigation').requires('lively.morphic.Widgets', 'lively.morphic.Events', 'lively.ide.tools.SelectionNarrowing').toRun(function() {

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
    findWindow: function(func) { return this.getWindows().detect(func); },
    makeWindowActive: function(win) {
        win && win.comeForward();
    },
    showWindow: function(win) {
        if (!win) return;
        if (this.showWindowCaller && this.showWindowTarget === win) return;
        if (this.showWindowCaller) { Global.clearInterval(this.showWindowCaller); delete this.showWindowCaller; }
        this.showWindowTarget = win;
        var self = this;
        this.showWindowCaller = (function() {
            if (this.showWindowTarget) this.showWindowTarget.show();
        }).bind(this).delay(0.8);
    },

    resetList: function(windowLister) {
        this.showWindowTarget = null;
        if (this.showWindowCaller) { Global.clearInterval(this.showWindowCaller); delete this.showWindowCaller; }
        windowLister.deactivate();
    },
    resetListAndRevertActiveWindow: function(windowLister) {
        if (this.currentWindow) this.currentWindow.comeForward();
        this.resetList(windowLister);
    }
},
'morphic switcher', {
    startWindowSelection: function() {
        var winMgr = this,
            windows = this.getWindows().reverse(),
            topMostWin = windows[0],
            firstIsActive = lively.morphic.Morph.focusedMorph().ownerChain().include(topMostWin);
        lively.ide.tools.SelectionNarrowing.getNarrower({
            name: 'lively.ide.WindowNavigation.NarrowingList',
            setup: function(narrower) {
                lively.bindings.connect(narrower, 'confirmedSelection', winMgr, 'makeWindowActive');
                lively.bindings.connect(narrower, 'selection', winMgr, 'showWindow');
                lively.bindings.connect(narrower, 'confirmedSelection', winMgr, 'resetList', {converter: function() { return this.sourceObj; }});
                lively.bindings.connect(narrower, 'escapePressed', winMgr, 'resetListAndRevertActiveWindow');
            },
            spec: {
                prompt: "select window: ",
                preselect: firstIsActive ? 1 : 0,
                maxItems: 20,
                candidates: windows.map(function(ea, i) {
                    return {isListItem: true, string: (i+1) + ' - ' + ea.getTitle(), value: ea}; })
            }
        })
        return this;
    }

});

Object.extend(lively.ide.WindowNavigation.WindowManager, {
    current: function() {
        return this._current || (this._current = new lively.ide.WindowNavigation.WindowManager($world));
    },
    reset: function() {
        this._current = null;
    }
});

}) // end of module
