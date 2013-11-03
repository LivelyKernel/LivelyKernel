module('lively.net.tools.Wiki').requires('lively.morphic.Complete', 'lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.wiki.VersionViewer', {
    _Extent: lively.pt(336.0,181.0),
    _Position: lively.pt(812.0,61.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "lively.wiki.VersionViewer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(330.0,156.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            borderSize: 4.185,
            extentWithoutPlaceholder: lively.pt(396.0,146.0),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 2.65,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        morphRefId: 1,
        name: "VersionViewer",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _ClipMode: {x: "hidden",y: "scroll"},
            _Extent: lively.pt(321.6,102.3),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(4.2,26.8),
            changeTriggered: true,
            className: "lively.morphic.List",
            droppingEnabled: true,
            itemMorphs: [],
            layout: {
                adjustForNewBounds: true,
                extent: lively.pt(321.6,102.3),
                listItemHeight: 19,
                maxExtent: lively.pt(321.6,102.3),
                maxListItems: 6,
                noOfCandidatesShown: 1,
                padding: 0,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "VersionList",
            sourceModule: "lively.morphic.Lists",
            submorphs: [{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(321.6,4.0),
                className: "lively.morphic.Box",
                droppingEnabled: true,
                layout: {
                    adjustForNewBounds: true,
                    resizeWidth: true
                }
            }]
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(321.6,20.0),
            _Position: lively.pt(4.2,131.8),
            className: "lively.morphic.Button",
            isPressed: false,
            label: "Visit",
            layout: {resizeWidth: true},
            name: "VisitButton",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("VersionViewer"), "visitVersion", {});
        }
        }],
        getTimemachineBasePath: function getTimemachineBasePath() {
        return URL.root.withFilename('timemachine/');
    },
        getVersions: function getVersions() {
        module('lively.store.Interface').load(true);
        var self = this;
        new lively.store.ObjectRepository().getRecords({
            paths: [this.getWorldPath()],
            attributes: ['path', 'date', 'author', 'change']
        }, function(err, rows) {
            self.showResult(err, rows);
        });
    },
        getWorldPath: function getWorldPath() {
        return URL.source.relativePathFrom(URL.root)
    },
        reset: function reset() {
        lively.bindings.connect(this.get('UpdateButton'), 'fire', this, 'getVersions');
        lively.bindings.connect(this.get('VisitButton'), 'fire', this, 'visitVersion');
        this.get('VersionList').setList([]);
    },
        showResult: function showResult(err, versions) {
        if (err) { show(err); versions && show(versions); return; }
        var items = versions.map(function(version) {
            try {
                var date = new Date(version.date).format('yy/mm/dd hh:mm:ss');
            } catch (e) { show(e); date = 'Invalid date'; }
            return {
                isListItem: true,
                string: version.author + ' - ' + date + ' (' + version.change + ')',
                value: version
            }
        });
        this.get('VersionList').setList(items);
    },
        visitVersion: function visitVersion() {
        var sel = this.get('VersionList').selection;
        if (!sel) { show('nothing selected'); return; }
        var url = this.getTimemachineBasePath()
            .withFilename(encodeURIComponent(sel.date)+'/')
            .withFilename(this.getWorldPath());
        window.open(''+url);
    }
    }],
    getVersions: function() {
        this.targetMorph.getVersions();
    },
    titleBar: "VersionViewer"
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.BuildSpec('lively.wiki.ToolFlap', {
    _FixedPosition: true,
    _BorderRadius: 20,
    _Extent: lively.pt(130.0,30.0),
    _Fill: Color.rgba(255,255,255,0.8),
    _HandStyle: "pointer",
    className: "lively.morphic.Box",
    currentMenu: null,
    doNotSerialize: ["currentMenu"],
    droppingEnabled: true,
    isEpiMorph: true,
    menu: null,
    name: "lively.wiki.ToolFlap",
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
        textString: "Wiki"
    }],
    alignInWorld: function alignInWorld() {
    this.world().cachedWindowBounds = null;
    var topRight = pt(this.world().visibleBounds().width-(40+2*130),-10);
    this.setPosition(topRight);
    this.alignSubmorphs();
},
alignSubmorphs: function alignSubmorphs() {
    this.statusText.align(this.statusText.bounds().center(), this.innerBounds().bottomCenter().addXY(0,-8));
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
    var self = this;
    var items = [
        ['world versions', function() {
            var versionViewer = lively.BuildSpec('lively.wiki.VersionViewer').createMorph().openInWorldCenter();
            versionViewer.getVersions();
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
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
    // this.startStepping(5*1000, 'update');
    this.whenOpenedInWorld(function() {
        this.alignInWorld(); });
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
    this.statusText = lively.morphic.Text.makeLabel('Wiki', {align: 'center', textColor: Color.rgb(33,33,33), fill: null});
    // this.statusText = this.get('statusText')
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
},
    session: function session() {
    return lively.net.SessionTracker.getSession();
}
});

}) // end of module