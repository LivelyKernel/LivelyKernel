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

    makeWindowActive: function(win) { win && win.comeForward(); },

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
        var winMgr = this, windows = this.getWindows().reverse(), topMostWin = windows[0],
            focusedMorph = lively.morphic.Morph.focusedMorph(),
            firstIsActive = (focusedMorph && focusedMorph.ownerChain().include(topMostWin)) || topMostWin.isActive();

        var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
            name: 'lively.ide.WindowNavigation.NarrowingList',
            setup: function(narrower) {
                lively.bindings.connect(narrower, 'selection', winMgr, 'showWindow');
                lively.bindings.connect(narrower, 'escapePressed', winMgr, 'resetListAndRevertActiveWindow');
            },
            spec: {
                prompt: "select window: ",
                preselect: firstIsActive ? 1 : 0,
                maxItems: 20,
                candidates: windowList(),
                actions: [
                    {name: 'come forward', exec: function(candidate) { winMgr.makeWindowActive(candidate); winMgr.resetList(narrower); }},
                    {name: 'close', exec: function(candidate) { candidate.initiateShutdown(); narrower.state.allCandidates = windowList(); narrower.filter(narrower.getInput()); }},
                    {name: 'close all filtered', exec: function(candidate) {
                      var s = narrower.state.originalState || narrower.state;
                      (s.filteredCandidates || []).pluck('value').invoke("initiateShutdown");
                      narrower.state.allCandidates = windowList(); narrower.filter(narrower.getInput());
                    }}]
            }
        });
        
        return this;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function windowList() {
            return winMgr.getWindows().reverse().map(function(ea, i) {
                return {isListItem: true, string: (i+1) + ' - ' + ea.getTitle(), value: ea}; })
        }

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
