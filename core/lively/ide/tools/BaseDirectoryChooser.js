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
                extentWithoutPlaceholder: lively.pt(100.0,100.0),
                resizeHeight: true,
                resizeWidth: true,
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
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                isPressed: false,
                label: "+",
                name: "DirAdd",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
                lively.bindings.connect(this, "fire", this.get("BaseDirectoryChooser"), "addDirInteractively", {});
            },
                doAction: function doAction() {
                
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(20.0,20.0),
                _Position: lively.pt(24.8,2.4),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                isPressed: false,
                label: "-",
                name: "DirRm",
                pinSpecs: [{
                    accessor: "fire",
                    location: 1.5,
                    modality: "output",
                    pinName: "fire",
                    type: "Boolean"
                }],
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "doAction", {});
                lively.bindings.connect(this, "fire", this.get("BaseDirectoryChooser"), "removeDir", {});
            },
                doAction: function doAction() {
                
            }
            }]
        }],
        addDir: function addDir(dir) {
        this.get('DirList').addItem({isListItem: true, string: dir, value: dir});
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
        alertOK(dir ? 'base directory is now ' + dir : 'resetting base dir');
        lively.ide.CommandLineInterface.setWorkingDirectory(dir ? String(dir) : null);
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
    }
    }],
    titleBar: "BaseDirectoryChooser"
});

}) // end of module