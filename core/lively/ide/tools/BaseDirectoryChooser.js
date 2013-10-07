module('lively.ide.tools.BaseDirectoryChooser').requires('lively.persistence.BuildSpec', "lively.ide.CommandLineInterface").toRun(function() {

lively.BuildSpec('lively.ide.tools.BaseDirectoryChooser', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(311.4,115.4),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "BaseDirectoryChooser",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(305.4,90.4),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: true,
            borderSize: 4.705,
            extentWithoutPlaceholder: lively.pt(304.4,86.4),
            resizeHeight: true,
            resizeWidth: true,
            spacing: 0,
            type: "lively.morphic.Layout.VerticalLayout"
        },
        name: "BaseDirectoryChooser",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _ClipMode: "auto",
            _Extent: lively.pt(295.0,54.0),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(4.7,4.7),
            className: "lively.morphic.List",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            layout: {resizeWidth: true, resizeHeight: true},
            itemList: [{
                isListItem: true,
                string: "default Lively directory",
                value: null
            }],
            name: "DirList",
            selectedLineNo: 0,
            selection: null,
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("BaseDirectoryChooser"), "changeBaseDir", {});
        }
        },{
            _Extent: lively.pt(296.0,27.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(4.7,58.7),
            className: "lively.morphic.Box",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            layout: {
                borderSize: 0,
                resizeWidth: true,
                moveVertical: true,
                spacing: 2.385,
                type: "lively.morphic.Layout.TileLayout"
            },
            name: "Rectangle2",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(20.0,20.0),
                _Position: lively.pt(2.4,2.4),
                className: "lively.morphic.Button",
                label: "+",
                layout: {moveVertical: true},
                name: "DirAdd",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("BaseDirectoryChooser"), "addDirInteractively", {});
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(20.0,20.0),
                _Position: lively.pt(24.8,2.4),
                className: "lively.morphic.Button",
                label: "-",
                layout: {moveVertical: true},
                name: "DirRm",
                sourceModule: "lively.morphic.Widgets",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("BaseDirectoryChooser"), "removeDir", {});
            }
            }]
        }],
        addDir: function addDir(dir) {
        var list = this.get('DirList');
        var idx = list.addItem({isListItem: true, string: String(dir), value: dir});
        list.selectAt(idx);
    },
        addDirInteractively: function addDirInteractively() {
        lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
            'choose directory: ',
            lively.shell.exec('pwd', {sync:true}).resultString(),
            function(files) { return files.filterByKey('isDirectory'); },
            "lively.ide.browseFiles.baseDirList.NarrowingList",
            [this.addDir.bind(this)]);
    },
        changeBaseDir: function changeBaseDir(dir) {
        var path = dir && dir.path ? dir.path : (dir ? String(dir) : null);
        alertOK(dir ? 'base directory is now ' + path : 'resetting base dir');
        lively.ide.CommandLineInterface.setWorkingDirectory(path);
    },
        onKeyDown: function onKeyDown(evt) {
        var keys = evt.getKeyString();
        if (keys === 'Shift-+' || keys === '+') {
            this.addDirInteractively();
            evt.stop(); return true;
        }
        if (keys === 'Backspace' || keys === 'Del' || keys === '-') {
            this.removeDir();
            evt.stop(); return true;
        }
        return false;
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get("DirList").focus();
    },
        removeDir: function removeDir() {
        this.get('DirList').removeItemOrValue(this.get('DirList').selection)
    },
        reset: function reset() {
        this.getPartsBinMetaInfo().addRequiredModule('lively.ide.CommandLineInterface');
        this.get('DirList').setList([{isListItem: true, string: "default Lively directory", value: null}]);
        lively.bindings.connect(this.get('DirAdd'), 'fire', this, 'addDirInteractively');
        lively.bindings.connect(this.get('DirRm'), 'fire', this, 'removeDir');
        lively.bindings.connect(this.get('DirList'), 'selection', this, 'changeBaseDir');
    },
        onLoad: function onLoad() {
        var sel = this.get('DirList').selection;
        sel && this.changeBaseDir(sel);
    }
    }],
    titleBar: "BaseDirectoryChooser"
});

}) // end of module