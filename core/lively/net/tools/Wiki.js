module('lively.net.tools.Wiki').requires('lively.morphic.Complete', 'lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.wiki.VersionViewer', {
    _Extent: lively.pt(354.0,196.0),
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
        _Extent: lively.pt(348.0,171.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        _path: null,
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
            _ClipMode: "hidden",
            _Extent: lively.pt(339.0,19.0),
            _FontFamily: "Arial, sans-serif",
            _HandStyle: null,
            _InputAllowed: true,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(4.2,4.2),
            allowInput: true,
            className: "lively.morphic.Text",
            emphasis: [[0,0,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            fixedHeight: true,
            isInputLine: true,
            layout: {
                resizeHeight: false,
                resizeWidth: true
            },
            name: "pathText",
            sourceModule: "lively.morphic.TextCore",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("VersionViewer"), "setPath", {});
        }
        },{
            _ClipMode: { x: "hidden", y: "scroll" },
            _Extent: lively.pt(339.6,109.2),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(4.2,25.8),
            isMultipleSelectionList: true,
            multipleSelectionMode: "multiSelectWithShift",
            className: "lively.morphic.List",
            droppingEnabled: true,
            itemMorphs: [],
            layout: {
                adjustForNewBounds: true,
                extent: lively.pt(339.6,109.2),
                listItemHeight: 19,
                maxExtent: lively.pt(339.6,109.2),
                maxListItems: 6,
                noOfCandidatesShown: 1,
                padding: 0,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "VersionList",
            sourceModule: "lively.morphic.Lists",
            submorphs: []
        },{
            _Extent: lively.pt(339.6,29.1),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(4.2,137.7),
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {
                borderSize: 3.975,
                extentWithoutPlaceholder: lively.pt(378.6,100.0),
                resizeHeight: false,
                resizeWidth: true,
                spacing: 4.25,
                type: "lively.morphic.Layout.HorizontalLayout"
            },
            name: "Rectangle",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(163.7,21.2),
                _Position: lively.pt(171.9,4.0),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "Visit",
                layout: {
                    resizeWidth: true
                },
                name: "VisitButton",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("VersionViewer"), "visitVersion", {});
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(163.7,21.2),
                _Position: lively.pt(4.0,4.0),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "Revert",
                layout: {
                    resizeWidth: true
                },
                name: "RevertButton",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("VersionViewer"), "revertToVersion", {});
            }
            }, {
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(163.7,21.2),
                _Position: lively.pt(4.0,4.0),
                className: "lively.morphic.Button",
                isPressed: false,
                label: "Diff",
                layout: {resizeWidth: true},
                name: "DiffButton",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("VersionViewer"), "diffSelectedVersions", {});
            }
            }]
        }],
        getPath: function getPath() {
        return this._path;
    },
        getTimemachineBasePath: function getTimemachineBasePath() {
            return URL.root.withFilename('timemachine/');
        },
        getVersions: function getVersions() {
        var p = this.getPath();
        if (!p) return;
        module('lively.store.Interface').load(true);
        var self = this;
        new lively.store.ObjectRepository().getRecords({
            paths: [p],
            attributes: ['path', 'date', 'author', 'change', 'version']
        }, function(err, rows) {
            self.showResult(err, rows);
        });
    },
        onLoad: function onLoad() {
        // this.getVersions();
    },
        reset: function reset() {
            // lively.bindings.connect(this.get('UpdateButton'), 'fire', this, 'getVersions');
            lively.bindings.connect(this.get('pathText'), 'savedTextString', this, 'setPath');
            lively.bindings.connect(this.get('VisitButton'), 'fire', this, 'visitVersion');
            lively.bindings.connect(this.get('RevertButton'), 'fire', this, 'revertToVersion');
            this.get('pathText').beInputLine();
            this._path = null;
            this.get('VersionList').setList([]);
            this.get('pathText').textString = '';
        },
        revertToVersion: function revertToVersion() {
        var sel = this.get('VersionList').selection;
        if (!sel) { $world.inform('No version selected'); return; }
        var path = this.getPath(),
            getURL = this.getTimemachineBasePath().withFilename(sel.date + '/').withFilename(path),
            putURL = URL.root.withFilename(this.getPath()),
            prompt = 'Do you really want to revert \n'
                    + path
                    + '\nto its version from\n'
                    + new Date(sel.date).format('yy/mm/dd hh:MM:ss') + '?';
            $world.confirm(prompt, function(input) {
                if (!input) { $world.alertOK('Revert aborted.'); return; }
                getURL.asWebResource().beAsync().get().whenDone(function(content, status) {
                    if (!status.isSuccess()) {
                        $world.alert('Revert failed.\nCould not read version: ' + status);
                        return;
                    }
                    putURL.asWebResource().beAsync().put(content).whenDone(function(_, status) {
                        if (!status.isSuccess()) {
                            $world.alert('Revert failed.\nCould not write version: ' + status);
                            return;
                        }
                        $world.alertOK(path + ' successfully reverted.');
                    });
                });
            });
    },
        setPath: function setPath(path) {
        try {
            // we expect a relative path to be entered, if it's a full URL try
            // to make it into a path
            var url = new URL(path);
            path = url.relativePathFrom(URL.root);
        } catch (e) {}
        this.get('pathText').textString = path;
        this._path = path; this.getVersions();
    },
        showResult: function showResult(err, versions) {
            if (err) { show(err); versions && show(versions); return; }
            var items = versions.map(function(version) {
                try {
                    var date = new Date(version.date).format('yy/mm/dd HH:MM:ss tt');
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
                .withFilename(this.getPath());
            window.open(''+url);
        },
        diffSelectedVersions: function diffSelectedVersions() {
            var selections = this.get('VersionList').getSelections()
            if (selections.length < 2) {
                this.world().inform('Please select two versions (shift click).');
                return;
            }
            var versions = selections.slice(-2),
                path = versions[0].path,
                v1 = versions[0].version,
                v2 = versions[1].version;
            lively.ide.diffVersions(path, v1, v2, {type: "unified"});
        },
    }],
    titleBar: "VersionViewer",
    setPath: function setPath(p) {
    this.targetMorph.setPath(p);
}
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
    grabbingEnabled: false,
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
            versionViewer.setPath(URL.source.relativePathFrom(URL.root));
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
