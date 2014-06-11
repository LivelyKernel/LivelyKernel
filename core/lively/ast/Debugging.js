module('lively.ast.Debugging').requires('lively.ast.Rewriting').toRun(function() {

Object.extend(lively.ast, {

    halt: function(frame) {
        (function() {
            lively.ast.openDebugger(frame, "Debugger");
        }).delay(0);
        return true;
    },

    openDebugger: function(frame, title) {
        lively.require('lively.ide.tools.Debugger').toRun(function() {
            var m = lively.BuildSpec("lively.ide.tools.Debugger").createMorph();
            m.targetMorph.setTopFrame(frame);
            if (title) m.setTitle(title);
            m.openInWorldCenter().comeForward();
        });
    }

});

lively.BuildSpec('lively.ast.DebuggingFlap', {
    _FixedPosition: true,
    _BorderRadius: 20,
    _Extent: lively.pt(130.0,30.0),
    _Fill: Color.rgba(255,255,255,0.8),
    _HandStyle: "pointer",
    className: "lively.morphic.Box",
    currentMenu: null,
    doNotSerialize: ["currentMenu"],
    droppingEnabled: true,
    grabbingEnabled: false,
    isEpiMorph: true,
    menu: null,
    name: "lively.ast.DebuggingFlap",
    style: {zIndex: 997},
    statusText: {isMorphRef: true,name: "statusText"},
    submorphs: [{
        _Align: "center",
        _ClipMode: "hidden",
        _Extent: lively.pt(87.0,20.0),
        _FontFamily: "Helvetica",
        _HandStyle: "pointer",
        _InputAllowed: false,
        _Position: lively.pt(21.5,12.0),
        allowInput: false,
        className: "lively.morphic.Text",
        evalEnabled: false,
        eventsAreIgnored: true,
        fixedHeight: true,
        fixedWidth: true,
        isLabel: true,
        name: "statusText",
        sourceModule: "lively.morphic.TextCore",
        textString: "Debugging"
    }],
    alignInWorld: function alignInWorld() {
    this.world().cachedWindowBounds = null;
    var topRight = this.world().visibleBounds().topRight().addXY(-40, -10);
    this.align(this.worldPoint(this.innerBounds().topRight().scaleBy(3)), topRight);
    this.alignSubmorphs();
},
alignSubmorphs: function alignSubmorphs() {
    this.statusText.align(this.statusText.bounds().center(), this.innerBounds().bottomCenter().addXY(0,-8));
    if (lively.Config.get('loadRewrittenCode')) {
        this.statusText.textString = 'Debugging: on';
        this.statusText.applyStyle({textColor: Color.green.lighter()});
    } else {
        this.statusText.textString = 'Debugging: off';
        this.statusText.applyStyle({textColor: Color.red});
    }
    this.menu && this.menu.align(
        this.menu.bounds().bottomCenter(),
        this.innerBounds().bottomCenter().addXY(2, -8-20));
},
    collapse: function collapse() {
    // this.collapse()
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(lively.pt(130.0,30.0));
        this.alignSubmorphs();
    }, 500, function() {
        if (this.menu) {
            this.menu.remove();
            this.menu = null;
        }
    });
},
    expand: function expand() {
    var self = this,
        dbgStmt = !!lively.Config.get('enableDebuggerStatements'),
        items = [
        ['debugger stmt ' + (dbgStmt ? 'on' : 'off'), function() {
            lively.Config.set('enableDebuggerStatements', !dbgStmt);
            self.collapse();
        }]
    ];
    this.menu = new lively.morphic.Menu(null, items);
    this.menu.openIn(this, pt(0,0), false);
    this.menu.setBounds(lively.rect(0,-66,130,23*1));
    this.withCSSTransitionForAllSubmorphsDo(function() {
        this.setExtent(pt(140, 46+23*1));
        this.alignSubmorphs();
    }, 500, function() {});
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.onLoad();
    },
    onLoad: function onLoad() {
    this.whenOpenedInWorld(function() {
        this.alignInWorld();
    });
    this.openInWorld();
    this.statusText.setHandStyle('pointer');
    this.isEpiMorph = true;
},
    onMouseDown: function onMouseDown(evt) {
    if (evt.getTargetMorph() !== this.statusText && evt.getTargetMorph() !== this) return false;
    if (this.menu) this.collapse();
    else this.expand();
    evt.stop(); return true;
},
    onWorldResize: function onWorldResize() {
    this.alignInWorld();
},
    reset: function reset() {
    this.setExtent(lively.pt(100.0,30.0));
    this.statusText = lively.morphic.Text.makeLabel('Debugging off', {align: 'center', textColor: Color.red, fill: null});
    this.addMorph(this.statusText);
    this.statusText.name = 'statusText'
    this.setFixed(true);
    this.isEpiMorph = true;
    this.setHandStyle('pointer');
    this.statusText.setHandStyle('pointer');
    this.startStepping(5*1000, 'update');
    this.grabbingEnabled = false;
    this.lock();
    this.doNotSerialize = ['currentMenu']
    this.currentMenu = null;
    this.buildSpec();
}
});

(function openDebuggingFlap() {
    lively.whenLoaded(function(world) {
        lively.BuildSpec('lively.ast.DebuggingFlap').createMorph().openInWorld();
    });
})();

cop.create('DebugGlobalErrorHandlerLayer')
.beGlobal()
.refineClass(lively.morphic.World, {
    logError: function(err, optName) {
        if (err.isUnwindException) {
            var msg = 'Caught UnwindingException!';
            this.setStatusMessage(msg, Color.purple.darker(), 10);
            return false;
        } else {
            return cop.proceed(err, optName);
        }
    }
});

}) // end of module
