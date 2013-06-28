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
        // x= new lively.ide.WindowNavigation.WindowManager($world).startWindowSelection();
        // lively.ide.WindowNavigation.windowLister.remove(); lively.ide.WindowNavigation.windowLister = null;
        var list = this.narrowList;
        if (!list) {
            list = this.narrowList = lively.BuildSpec('lively.ide.tools.NarrowingList').createMorph();
        }
        lively.bindings.connect(list, 'confirmedSelection', this, 'makeWindowActive');
        lively.bindings.connect(list, 'selection', this, 'showWindow');
        lively.bindings.connect(list, 'confirmedSelection', this, 'resetList', {converter: function() { return this.sourceObj; }});
        lively.bindings.connect(list, 'escapePressed', this, 'resetListAndRevertActiveWindow');
        var windows = this.getWindows().reverse(),
            topMostWin = windows[0],
            firstIsActive = lively.morphic.Morph.focusedMorph().ownerChain().include(topMostWin);
        var spec = {
            preselect: firstIsActive ? 1 : 0,
            maxItems: 20,
            candidates: windows.map(function(ea, i) {
                return {isListItem: true, string: (i+1) + ' - ' + ea.getTitle(), value: ea}; }),
            // actions: [function(candidate) { show('selected ' + candidate); }],
            // close: function() { show('narrower closed'); }
        }
        list.open(spec);
        return this;
    }

});

Object.extend(lively.ide.WindowNavigation.WindowManager, {
    current: function() {
        return this._current || (this._current = new lively.ide.WindowNavigation.WindowManager($world));
    },
    reset: function() {
        show('resetting window lister');
        if (!this._current) return;
        if (this._current.narrowList) this._current.narrowList.remove();
        this._current.narrowList = null;
        this._current = null;
    }
});

}) // end of module
