module('lively.ide.tools.FileTree').requires('lively.persistence.BuildSpec', 'lively.morphic.Widgets').toRun(function() {

lively.BuildSpec('lively.ide.tools.FileTree', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(381.2,413.0),
    className: "lively.morphic.Window",
    draggingEnabled: true,
    layout: {
        adjustForNewBounds: true
    },
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _ClipMode: "auto",
        _Extent: lively.pt(375.2,388.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        _Visible: true,
        className: "lively.morphic.Box",
        droppingEnabled: true,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "fileTree",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _Position: lively.pt(0,0),
            _Extent: lively.pt(20.0,20.0),
            className: "lively.morphic.Button",
            label: "⟳",
            layout: {resizeHeight: false, resizeWidth: true},
            name: "UpdateButton",
            connectionRebuilder: function connectionRebuilder() { lively.bindings.connect(this, "fire", this.get("fileTree"), "update", {}); }
        }, {
            _Position: lively.pt(20, 0),
            _Extent: lively.pt(50.0,20.0),
            className: "lively.morphic.Button",
            label: "Open",
            layout: {resizeHeight: false, resizeWidth: true},
            name: "OpenButton",
            connectionRebuilder: function connectionRebuilder() { lively.bindings.connect(this, "fire", this.get("fileTree"), "openFile", {}); }
        },{
            _Extent: lively.pt(400.0,120.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(0.0,20.0),
            childrenPerPage: 9999,
            className: "lively.morphic.Tree",
            name: "tree",
            depth: 0,
            sourceModule: "lively.morphic.Widgets"
        }],
        reset: function reset() {
        // this.reset()
        this.applyStyle({fill: Color.white, clipMode: 'auto', borderWidth: 0});
        var tree = this.get('tree');
        tree.childrenPerPage = 9999;
        tree.setItem({name: 'empty'});
        lively.bindings.connect(this.get('UpdateButton'), 'fire', this, 'update');
        this.get("fileTree").get('tree').selection = null;
    },
        update: function update() {
        // this.update();
        var tree = this.get('tree');
        tree.setItem({name: "loading..."});
        this.withFileTreeDo(function(err, rootItem) {
            tree.setItem(rootItem);
            tree.expand();
        });
    },
        withFileTreeDo: function withFileTreeDo(func) {
        // this.withFileTreeDo(function(err, rootItem) {  })
        // creates the tree data used for a lively.morphic.Tree to display the
        // files and folders of the base LK dir
        [requireDirectoryWatcher,
         getLKDir,
         getLKFiles,
         createFileTree,
         createTreeItems
        ].doAndContinue(null, function() { func(null, state.rootItem); });
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var tree = this.get('tree');
        var state = Global.state = {
            lkDir: null,
            fileInfos: null,
            tree: tree,
            root: {}, rootItem: {}
        }
        function requireDirectoryWatcher(next) {
            require('lively.ide.DirectoryWatcher').toRun(next);
        }
        function getLKDir(next) {
            lively.shell.exec('echo $WORKSPACE_LK', function(cmd) {
                state.lkDir = cmd.resultString().trim();
                if (!state.lkDir.endsWith('/')) state.lkDir += '/';
                next();
            });
        }
        function getLKFiles(next) {
            lively.ide.DirectoryWatcher.withFilesOfDir(state.lkDir, function(files) {
                state.fileInfos = files; next(); });
        }
        function createFileTree(next) {
            // state.root looks like {
            //     "History.md": statObj,
            //     "R-workspace.html": statObj,
            //     "servers": {
            //         "ClojureServer.js": {/*...*/},
            //         "CommandLineServer.js": {/*...*/}, ...
            //     }
            // }
            Properties.forEachOwn(state.fileInfos, function(name, stat) {
                if (stat.isDirectory) return;
                var relativeFn = name.slice(state.lkDir.length);
                lively.PropertyPath(relativeFn, '/').set(state.root, stat, true)
            });
            next();
        }
        function createTreeItems(next) {
            function isDir(treeNode) {
                return !treeNode.hasOwnProperty('isDirectory') || !!treeNode.isDirectory;
            }
            function createItem(name, treeNode) {
                var item = {
                    name: name,
                    onSelect: function(tree) { state.tree.selection = tree; }
                };
                if (!isDir(treeNode)) return item;
                item.children = Properties.forEachOwn(treeNode, function(subName, subFileInfo) {
                    return createItem(subName, subFileInfo); }).sort(function(a, b) {
                        if (!a.children && b.children) return 1;
                        if (a.children && !b.children) return -1;
                        if (a.name < b.name) return -1;
                        if (a.name == b.name) return 0;
                        return 1;
                    })
                return item;
            }
            state.rootItem = createItem('.', state.root);
            next();
        }
    },
        openFile: function openFile(func) {
    var tree = this.get('tree'),
        sel = tree.getSelectedTree();
    if (!sel) { show('Nothing selected!'); return; }
    var path = this.filePathOfTreeNode(sel)
    lively.ide.openFile(URL.root.withFilename(path));
},
        filePathOfTreeNode: function filePathOfTreeNode(treeNode) {
    function pathInTree(treeNode) {
        return treeNode && treeNode.isTree ?
            pathInTree(treeNode.owner).concat([treeNode.item.name]) : [];
    }
    return pathInTree(treeNode).join('/');
}
    }],
    titleBar: "Files"
});

}) // end of module