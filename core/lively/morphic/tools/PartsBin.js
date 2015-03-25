module('lively.morphic.tools.PartsBin').requires('lively.persistence.BuildSpec', 'lively.PartsBin').toRun(function() {

lively.BuildSpec('lively.morphic.tools.PartsBin', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(762.8,512.2),
    _Position: lively.pt(34.6,92.9),
    cameForward: true,
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    layout: { adjustForNewBounds: true },
    name: "PartsBinBrowser",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(754.8,486.2),
        _Fill: Color.rgba(245,245,245,0),
        _Position: lively.pt(4.0,22.0),
        allURLs: [],
        borderWidth: 1,
        categoryName: "Basic",
        className: "lively.morphic.Box",
        connections: {toggleMorePane: {}},
        doNotSerialize: ["categories"],
        layout: {adjustForNewBounds: true, resizeHeight: true, resizeWidth: true},
        name: "PartsBinBrowser",
        selectedPartItem: null,
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(66,66,66),
            _BorderRadius: 6.12,
            _BorderWidth: 2.294,
            _Extent: lively.pt(373.0,433.0),
            _Fill: Color.rgb(235,235,235),
            _Position: lively.pt(379.0,33.0),
            _Visible: false,
            className: "lively.morphic.Box",
            layout: {moveHorizontal: true},
            name: "morePane",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "hidden",
                _Extent: lively.pt(258.0,17.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 12,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 258,
                _MinTextWidth: 258,
                _Position: lively.pt(22.1,8.6),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                fixedHeight: true,
                fixedWidth: true,
                name: "selectedPartName",
                sourceModule: "lively.morphic.TextCore",
                textString: "nothing selected"
            },{
                _ClipMode: "scroll",
                _Extent: lively.pt(330.8,122.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(20.0,56.3),
                className: "lively.morphic.List",
                itemList: [],
                layout: {resizeWidth: true},
                name: "selectedPartVersions",
                sourceModule: "lively.morphic.Core"
            },{
                _BorderColor: Color.rgb(192,192,192),
                _BorderRadius: 7,
                _BorderWidth: 1.5,
                _ClipMode: "auto",
                _Extent: lively.pt(333.0,70.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 315.04,
                _MinTextWidth: 315.04,
                _Position: lively.pt(20.0,180.0),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                fixedHeight: true,
                fixedWidth: true,
                layout: {resizeHeight: true,resizeWidth: true},
                name: "selectedPartComment",
                sourceModule: "lively.morphic.TextCore",
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "savedTextString", this.get("PartsBinBrowser"), "saveCommentForSelectedPartItem", {});
            }
            },{
                _Align: "left",
                _ClipMode: "hidden",
                _Extent: lively.pt(265.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 12,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 265,
                _MinTextWidth: 265,
                _Position: lively.pt(22.4,30.9),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                fixedHeight: true,
                fixedWidth: true,
                name: "selectedPartSpaceName",
                sourceModule: "lively.morphic.TextCore"
            },{
                _Extent: lively.pt(67.0,25.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 9,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 67,
                _MinTextWidth: 67,
                _Position: lively.pt(289.0,31.0),
                _TextColor: Color.rgb(64,64,64),
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,10,{
                    fontWeight: "normal",
                    italics: "normal",
                    uri: "http://www.lively-kernel.org/viral?part=DropDownList&path=PartsBin/Inputs/"
                }]],
                fixedWidth: true,
                name: "shareLink",
                sourceModule: "lively.morphic.TextCore",
                textString: "Share Link"
            },{
                _BorderColor: Color.rgb(169,169,169),
                _BorderRadius: 7,
                _BorderWidth: 1,
                _ClipMode: "auto",
                _Extent: lively.pt(333.0,124.0),
                _FontFamily: "Monaco,monospace",
                _FontSize: 8,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 323,
                _MinTextWidth: 323,
                _Position: lively.pt(21.2,257.9),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                accessibleInInactiveWindow: true,
                allowInput: true,
                className: "lively.morphic.Text",
                evalEnabled: false,
                fixedHeight: true,
                fixedWidth: true,
                layout: {resizeHeight: true,resizeWidth: true},
                name: "CommitLog",
                sourceModule: "lively.morphic.TextCore",
                syntaxHighlightingWhileTyping: false
            },
{
    _BorderColor: Color.rgb(189,190,192),
    _Extent: lively.pt(52,20),
    _Position: lively.pt(20+52*0,390),
    className: "lively.morphic.Button",
    label: "load",
    layout: {moveVertical: true},
    name: "loadPartButton",
    padding: lively.rect(5,0,0,0),
    showsMorphMenu: true,
    sourceModule: "lively.morphic.Widgets",
    connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "loadAndOpenSelectedPartItem", {});
    }
},
{
    _BorderColor: Color.rgb(189,190,192),
    _Extent: lively.pt(52,20),
    _Position: lively.pt(20+52*1,390),
    className: "lively.morphic.Button",
    label: "remove",
    layout: {moveVertical: true},
    name: "removePartButton",
    showsMorphMenu: true,
    sourceModule: "lively.morphic.Widgets",
    padding: lively.rect(5,0,0,0),
    connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyRemoveSelectedPartItem", {});
    }
},
{
    _BorderColor: Color.rgb(189,190,192),
    _BorderRadius: 5,
    _BorderWidth: 1,
    _Extent: lively.pt(52,20),
    _Position: lively.pt(20+52*2,390),
    className: "lively.morphic.Button",
    label: "move",
    layout: {moveVertical: true},
    name: "movePartButton",
    padding: lively.rect(5,0,0,0),
    sourceModule: "lively.morphic.Widgets",
    connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyMoveSelectedPartItem", {});
    }
},
{
    _BorderColor: Color.rgb(189,190,192),
    _Extent: lively.pt(52,20),
    _Position: lively.pt(20+52*3,390),
    className: "lively.morphic.Button",
    label: "copy",
    layout: {moveVertical: true},
    name: "copyPartButton",
    padding: lively.rect(5,0,0,0),
    showsMorphMenu: true,
    sourceModule: "lively.morphic.Widgets",
    connectionRebuilder: function connectionRebuilder() {
        // lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyMoveSelectedPartItem", {});
        lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyCopySelectedPartItem", {});
    }
},
{
    _BorderColor: Color.rgb(189,190,192),
    _Extent: lively.pt(52,20),
    _Position: lively.pt(20+52*4,390),
    className: "lively.morphic.Button",
    label: "revert",
    layout: {moveVertical: true},
    name: "revertButton",
    padding: lively.rect(5,0,0,0),
    sourceModule: "lively.morphic.Widgets",
    connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyRevertSelectedPart", {});
    }
},
// {
//     _BorderColor: Color.rgb(189,190,192),
//     _Extent: lively.pt(52,20),
//     _Position: lively.pt(20+52*4,390),
//     className: "lively.morphic.Button",
//     label: "modules",
//     layout: {moveVertical: true},
//     name: "editModulesButton",
//     padding: lively.rect(5,0,0,0),
//     sourceModule: "lively.morphic.Widgets",
//     connectionRebuilder: function connectionRebuilder() {
//         // TODO implement #interactivelyEditModulesOfSelectedPart
//         // lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyEditModulesOfSelectedPart", {});
//     }
// },

            ]
        },{
            _BorderColor: Color.rgb(210,210,210),
            _BorderWidth: 1.258,
            _ClipMode: "auto",
            _Extent: lively.pt(143.0,432.0),
            _Fill: Color.rgb(255,255,255),
            _FontSize: 10,
            _Position: lively.pt(2.0,52.0),
            className: "lively.morphic.List",
            itemList: [],
            layout: {resizeHeight: true},
            name: "categoryList",
            selectedLineNo: undefined,
            selection: "Basic",
            sourceModule: "lively.morphic.Core",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("PartsBinBrowser"), "categoryName", {});
        }
        },{
            _ClipMode: "scroll",
            _BorderColor: Color.rgb(210,210,210),
            _BorderWidth: 1,
            _Extent: lively.pt(598.0,451.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(154.0,33.0),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "partsBinContents",
            selectedItem: "PartsItem(DropDownList,PartsSpace(PartsBin/Inputs/))",
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            addPartItemAsync: function addPartItemAsync() {
            if (!this.partItemsToBeAdded || this.partItemsToBeAdded.length == 0) {
                this.stopAddingPartItemsAsync();
                return;
            }

            var partItem = this.partItemsToBeAdded.shift();
            var morph = partItem.asPartsBinItem();
            this.addMorph(morph);
            this.adjustForNewBounds()
        },
            adjustForNewBounds: function adjustForNewBounds() {
        /*
            this.adjustForNewBounds()
        */
            $super();
            var bounds = this.innerBounds(),
                delta = 15,
                left = bounds.x + delta,
                top = bounds.y + delta,
                x = left, y = top,
                width = bounds.width;
            this.submorphs.forEach(function(morph) {
                var extent = morph.getExtent();
                if (extent.x + x + delta > width) {
                    x = left;
                    y += extent.y + delta;
                }
                morph.setPosition(pt(x,y));
                x += extent.x + delta;
            });
        },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selectedItem", this.get("PartsBinBrowser"), "setSelectedPartItem", {});
        },
            selectPartItem: function selectPartItem(item) {
            this.selectedItem = item && item.partItem;
            this.submorphs.without(item).invoke('showAsNotSelected');
        },
            startAddingPartItems: function startAddingPartItems(partItems) {
            this.partItemsToBeAdded = partItems.clone();
            this.startStepping(0, 'addPartItemAsync')
        },
            stopAddingPartItemsAsync: function stopAddingPartItemsAsync() {
            this.stopStepping();
            delete this.partItemsToBeAdded;
        },
            unselectAll: function unselectAll() {
            this.submorphs.invoke('showAsNotSelected');
        }
        },{
            _BorderColor: Color.rgb(210,210,210),
            _BorderWidth: 1,
            _Extent: lively.pt(143.0,20.0),
            _Fill: Color.rgba(255,255,255,0),
            _Position: lively.pt(2.0,33.0),
            className: "lively.morphic.Morph",
            droppingEnabled: true,
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(210,210,210),
                _BorderRadius: 0,
                _BorderWidth: 1,
                _Extent: lively.pt(20.0,20.0),
                _Position: lively.pt(123.0,0.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                isPressed: false,
                label: "-",
                name: "removeCategoryButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                style: {
                    borderRadius: 0,
                    padding: lively.rect(8,3,0,0)
                },
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "onFire", {});
            },
                onFire: function onFire() {
                    this.get('PartsBinBrowser').removeCategoryInteractively();
                }
            },{
                _BorderColor: Color.rgb(210,210,210),
                _BorderRadius: 0,
                _BorderWidth: 1,
                _Extent: lively.pt(20.0,20.0),
                _Position: lively.pt(104.0,0.0),
                _StyleClassNames: ["Morph","Button"],
                className: "lively.morphic.Button",
                isPressed: false,
                label: "+",
                name: "addCategoryButton",
                sourceModule: "lively.morphic.Widgets",
                toggle: false,
                value: false,
                style: {
                    borderRadius: 0,
                    padding: lively.rect(6,3,0,0),
                },
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this, "onFire", {});
            },
                onFire: function onFire() {
                            this.get('PartsBinBrowser').addCategoryInteractively()
                        }
            },{
                _BorderColor: Color.rgb(210,210,210),
                _BorderWidth: 1,
                _Extent: lively.pt(20.0,20.0),
                _StyleClassNames: ["Morph","Button","RectButton"],
                className: "lively.morphic.Button",
                isPressed: false,
                label: "⟳",
                name: "reloadButton",
                sourceModule: "lively.morphic.Widgets",
                value: false,
                style: {
                    borderRadius: 0,
                    padding: lively.rect(4,3,0,0),
                },
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "reloadEverything", {});
            }}]
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 2,
            _BorderWidth: 1,
            _Extent: lively.pt(303.0,18.0),
            _Fill: Color.rgb(255,255,255),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 9,
            _HandStyle: null,
            _InputAllowed: true,
            _Position: lively.pt(390.0,8.0),
            _TextColor: Color.rgb(64,64,64),
            allowInput: true,
            className: "lively.morphic.Text",
            emphasis: [[0,17,{italics: "italic"}]],
            fixedHeight: true,
            fixedWidth: true,
            isInputLine: true,
            layout: {resizeWidth: true},
            name: "searchText",
            textString: 'enter search term',
            style: {
                allowInput: true,
                borderColor: Color.rgb(190,190,190),
                borderRadius: 10,
                borderWidth: 1,
                clipMode: "visible",
                enableDragging: true,
                enableDropping: false,
                enableGrabbing: false,
                fill: Color.rgb(255,255,255),
                fixedHeight: true,
                fixedWidth: true,
                fontFamily: "Helvetica",
                fontSize: 10,
                padding: lively.rect(25,1,0,0),
                textColor: Color.rgb(64,64,64)
            },
            submorphs: [{
                _BorderColor: Color.rgb(204,0,0),
                _Extent: lively.pt(13.0,15.0),
                _Position: lively.pt(6.4,1.1),
                className: "lively.morphic.Image",
                droppingEnabled: true,
                sourceModule: "lively.morphic.Widgets",
                url: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAA0AAAAPCAYAAAA/I0V3AAABeUlEQVQoFZVSu6rCQBA9uy4+Sx/gu7DS0k78Az8gjaTTv7KyEPwABRsLFb/AOhEVXwimCaRQc52BLNd7uYG7sNmZnXPmTGZWnM9nXymFSCQCKSWEELwRslQ8Hv8XgXKpaDTKCtvtFuv1GsfjkTVKpRLa7TbK5fIvTeF5nr9cLjGbzTiYyWTwfD5xv9+5zE6ng1ar9UFUtm0zgcDdbhe5XI4Bu90Oo9EIk8kExWIR1WpVEyWp0M+bpqkJFK1UKjAMg4Gr1UoTyFD7/R75fB7ZbPYjQE6tVkMqlQJhKHGwpO/7gf3n+RMjC4UCTqcTbrcbZwvmRKdlWXBdF4T5fi+prZRpOBziPWitRiMYj8fs1+t1fU+GeDwe/nQ6xWKx4EA6neaWO47DPr2UWCyGXq/HippExmazAXXycDhwKTTcRqOB+XyO9yyRTCY1UbwHGdoJ6txgMGBiIpFAv9+H5BpCPvSMCEgEUrxcLhCv1ytUKchHZV+vVzSbTXwBUj2YXiZrC44AAAAASUVORK5CYII="
            }],
            sourceModule: "lively.morphic.TextCore",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("PartsBinBrowser"), "search", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(45.8,19.0),
            _Position: lively.pt(706.4,7.0),
            className: "lively.morphic.Button",
            label: "more",
            layout: {moveHorizontal: true},
            name: "moreButton",
            padding: lively.rect(5,0,0,0),
            showsMorphMenu: true,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "toggleMorePane", {});
        }
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(225.0,18.0),
            _Fill: Color.rgba(243,243,243,0),
            _FontSize: 10,
            _Position: lively.pt(154.0,7.0),
            _StyleClassNames: ["Morph","Box","OldList","DropDownList"],
            className: "lively.morphic.DropDownList",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            itemList: [],
            name: "PartsBinURLChooser",
            selectOnMove: false,
            selectedLineNo: 0,
            selection: URL.create("http://localhost:9001/PartsBin/"),
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("PartsBinBrowser"), "setPartsBinURL", {});
        },
            reset: function reset() {
            this.name = "PartsBinURLChooser";
        }
        }],
        url: null,
        addCategory: function addCategory(categoryName, doNotUpdate) {
        if (!categoryName.startsWith("*")) {
            var url = this.partsBinURL().withFilename(categoryName);
            this.addExternalCategory(categoryName, url, true);
        } else {
            this.categories[categoryName] = {isSpecialCategory: true};
            this.updateCategoryList(categoryName, doNotUpdate);
        }
    },
        addCategoryInteractively: function addCategoryInteractively() {
        var partsBin = this, world = this.world();
        world.prompt('Name of new category?', function(categoryName) {
            if (!categoryName || categoryName == '') {
           alert('no category created!')
           return;
        }
            partsBin.addCategory(categoryName)
        });
    },
        addExternalCategory: function addExternalCategory(categoryName, url, createPath) {
        url = url.asDirectory();
        this.categories[categoryName] = url;
        if (createPath) {
            this.getPartsSpaceForCategory(categoryName).ensureExistance();
        }
        this.updateCategoryList(categoryName);
    },
        addMorphsForPartItems: function addMorphsForPartItems(partItems, doNotSort) {
        this.removeParts();
        if (!doNotSort) {
            partItems = partItems.sortBy(function(ea) {
                return ea.name.toLowerCase()
            });
        }

        var pContents = this.get('partsBinContents');
        pContents.stopAddingPartItemsAsync();
        pContents.startAddingPartItems(partItems);
    },
        addPartsFromURLs: function addPartsFromURLs(urls) {
        var partsBin = this, partItems = [];
        urls.forEach(function(ea) {
            var partPath = ea.saveRelativePathFrom(URL.root),
                match = partPath.match(/(.*\/)(.*).json/);
            if (match)
                partItems.push(lively.PartsBin.getPartItem(match[2], match[1]));
        });
        partsBin.addMorphsForPartItems(partItems, true);
    },
        addPartsOfCategory: function addPartsOfCategory(categoryName) {
        var partsSpace = this.getPartsSpaceForCategory(categoryName);
        connect(partsSpace, 'partItems', this, 'addMorphsForPartItems', {
        converter: function(partItemObj) { return Properties.ownValues(partItemObj) }})
        partsSpace.load(true);
    },
        commitLogString: function commitLogString(metaInfo) {
        if (!metaInfo || !metaInfo.changes) return "";
        return metaInfo.changes
            .reverse()
            .collect(function(ea) {
                return Strings.format("%s %s: \n    %s\n\n",
                    ea.date.format("yyyy-mm-dd HH:MM") ,
                    ea.author, (ea.message || "no comment"));
            })
            .join('');
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "categoryName", this, "loadPartsOfCategory", {});
    },
        defaultPartsBinURL: function defaultPartsBinURL() {
        return new URL(Config.rootPath).withFilename('PartsBin/');
    },
        doSearch: function doSearch() {
        if (URL.root.hostname !== this.partsBinURL().hostname) {
            show('Search not available.'); return; }

        this.showMsg("searching...");
        var pb = this;
        var searchString = this.get('searchText').textString;
        if (!searchString || searchString.length === 0) return;
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // find parts via cmdline
        var partsBinPath = this.partsBinURL().relativePathFrom(URL.root),
            findPath = "$WORKSPACE_LK/" + partsBinPath.replace(/\/\//g, '\/');
        doCommandLineSearch(processResult.curry(listPartItems), searchString);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function doCommandLineSearch(next, searchString) {
                var cmdTemplate = "find %s "
                                + "\\( -name node_modules -o -name '.svn' -o -name '.git' \\) -type d -prune "
                                + "-o -type f -iname '*%s*.json*' -print",
                cmd = Strings.format(cmdTemplate, findPath, searchString);
            lively.require('lively.ide.CommandLineInterface').toRun(function() {
                lively.shell.exec(cmd, next);
            });
        }
        function processResult(next, err, searchCmd) {
            if (searchCmd.getCode()) {
                pb.showMsg('Search failure:\n' + searchCmd.getStderr);
                next([]);
                return;
            }
            var lines = Strings.lines(searchCmd.getStdout());
            var partItemURLs = lines.map(function(line) {
                line = line.replace(/\/\//g, '\/') // double path slashes
                var partPath = line.split(partsBinPath).last();
                return pb.partsBinURL().withFilename(partPath);
            });
            next(partItemURLs)
        }

        function listPartItems(partItemURLs) { pb.addPartsFromURLs(partItemURLs); }
    },
        ensureCategories: function ensureCategories() {
        if (!this.categories)
            this.categories = {uncategorized: 'PartsBin/'};
    },
        getPartsSpaceForCategory: function getPartsSpaceForCategory(categoryName) {
        var url = this.getURLForCategoryNamed(categoryName);
        return lively.PartsBin.partsSpaceWithURL(url);
    },
        getURLForCategoryNamed: function getURLForCategoryNamed(categoryName) {
        this.ensureCategories()

        var relative = this.categories[categoryName];
        if (!relative) return null;
        return URL.ensureAbsoluteCodeBaseURL(relative).withRelativePartsResolved()
    },
        interactivelyCopySelectedPartItem: function interactivelyCopySelectedPartItem(partMorph) {
        // FIXME duplication with interactivelyMoveSelectedPartItem
        var partItem = this.selectedPartItem, categories = this.categories, self = this;
        if (!partItem) { alert('no item selected'); return }
        var items = Properties.own(categories).sort()
                .reject(function(ea) { return ea.startsWith("*") || ea === self. categoryName})
                .collect(function(catName) {
            return [catName, function() {
                var url = new URL(categories[catName]);
                var partsSpace = lively.PartsBin.partsSpaceWithURL(url)
                partItem.copyToPartsSpace(partsSpace);
                alertOK('Copied ' + partItem.name + ' to ' + url);
            }]
        })
        lively.morphic.Menu.openAtHand('Select category', items);
    },
        interactivelyRevertSelectedPart: function interactivelyRevertSelectedPart(partMorph) {
          var version = this.get("selectedPartVersions").getSelection();
          if (!version) return $world.alert("No version selected!");
          var item = this.selectedPartItem;
          if (!version) return $world.alert("No part selected!");

          var urls = [item.getFileURL(),
                      item.getHTMLLogoURL(),
                      item.getMetaInfoURL()];

          var prompt = 'Do you really want to revert \n'
                      + item.anem
                      + '\nto its version from\n'
                      + new Date(version.date).format('yy/mm/dd hh:MM:ss') + '?';

          $world.confirm(prompt, function(input) {
              if (!input) { $world.alertOK('Revert aborted.'); return; }
              lively.net.Wiki.revertResources(urls, version, function(err) {
                  err ? $world.alert('Revert failed:\n' + (err.stack || err)) :
                        $world.alertOK(item.name + ' successfully reverted.');
                  lively.bindings.connect(item, 'partVersions', self, 'setSelectedPartItem', {
                    removeAfterUpdate: true,
                    converter: function() { return this.sourceObj; },
                  });
                  item.loadPartVersions(true);
              });
          });
    },
        interactivelyMoveSelectedPartItem: function interactivelyMoveSelectedPartItem(partMorph) {
        var partItem = this.selectedPartItem, categories = this.categories, self = this;
        if (!partItem) { alert('no item selected'); return }
        var items = Properties.own(categories).sort()
                .reject(function(ea) { return ea.startsWith("*") || ea === self. categoryName})
                .collect(function(catName) {
            return [catName, function() {
                var url = new URL(categories[catName]);
                var partsSpace = lively.PartsBin.partsSpaceWithURL(url)
                partItem.moveToPartsSpace(partsSpace);
                self.reloadEverything();
                alertOK('Moved ' + partItem.name + ' to ' + url);
            }]
        })
        lively.morphic.Menu.openAtHand('Select category', items);
    },
        interactivelyRemoveSelectedPartItem: function interactivelyRemoveSelectedPartItem(partMorph) {
        var item = this.selectedPartItem;
        if (!item) return;
        this.world().confirm("really delete " + item.name + " in PartsBin?", function(answer) {
        if (!answer) return;
        item.del();
        this.reloadEverything();
        alertOK("deleted " + item.name);
        }.bind(this))
    },
        loadAndOpenSelectedPartItem: function loadAndOpenSelectedPartItem(partMorph) {
        var item = this.selectedPartItem;
        if (!item) return;
        connect(item, 'part', this, 'openPart', {removeAfterUpdate: true});
        var selectedVersion = this.get('selectedPartVersions').selection,
            rev = selectedVersion ? selectedVersion.version : null;
        item.loadPart(true, null, rev);
        alertOK('loading ' + item.name + '...');
    },
        loadPartsOfCategory: function loadPartsOfCategory(categoryName) {
        this.removeParts();
        this.setSelectedPartItem(null);
        if (!categoryName) return;
        var webR;
        if (categoryName == "*all*") {
            this.showMsg("loading all...");
            webR = new WebResource(this.partsBinURL()).noProxy().beAsync();
            lively.bindings.connect(webR, 'subDocuments', this, 'onLoadAll');
            webR.getSubElements(10)
        } else if (categoryName == "*latest*") {
            this.showMsg("loading latest...");
            var partsbinDir = this.partsBinURL().saveRelativePathFrom(URL.root);
            lively.ide.CommandLineSearch.findFiles('*.json', {rootDirectory: partsbinDir}, function(result) {
                result = result.sortByKey('lastModified').reverse().slice(0,20);
                this.onLoadLatest(result);
            }.bind(this));
        } else if (categoryName == "*search*") {
            this.doSearch();
        } else {
            this.addPartsOfCategory(categoryName);
        }
    },
        makeUpPartNameFor: function makeUpPartNameFor(name) {
            if (!$morph(name)) return name;
            var i = 2;
            while($morph(name + i)) { i++ }
            return name + i;
        },
        onLoad: function onLoad() {
        this.updatePartsBinURLChooser();
        this.get("PartsBinURLChooser").selectAt(0);
    },
        onLoadAll: function onLoadAll(subDocuments) {
             // alertOK("load all " + subDocuments.length)
             var all = subDocuments.invoke('getURL')
             .select(function(ea) {return ea.filename().endsWith(".json")})
             .sortBy(function(ea) {return ea.filename()});

             this.addPartsFromURLs(all)
        },
        onLoadLatest: function onLoadLatest(latestFiles) {
            var latestURLs = latestFiles.pluck('path').map(function(path) { return URL.root.withFilename(path); });
            this.addPartsFromURLs(latestURLs);
        },
        openPart: function openPart(partMorph) {
            partMorph.setName(this.makeUpPartNameFor(partMorph.getName()));
            lively.morphic.World.current().firstHand().grabMorph(partMorph, null);
            if(partMorph.onCreateFromPartsBin) partMorph.onCreateFromPartsBin();
            partMorph.setPosition(pt(0,0));
        },
        partsBinURL: function partsBinURL() {
            if (this.url) { return this.url; }
            return this.defaultPartsBinURL();
        },
        reloadEverything: function reloadEverything() {
        this.get('categoryList').updateList([]);
        this.get('partsBinContents').removeAllMorphs();
        this.setSelectedPartItem(null);
        this.updateCategoriesDictFromPartsBin(function() {
            this.addCategory("*latest*", true);
            this.addCategory("*all*", true);
            this.addCategory("*search*", true);
            this.get('categoryList').setSelection('Basic');
        });
    },
        removeCategory: function removeCategory(categoryName) {
        var url = this.getURLForCategoryNamed(categoryName);
        if (!url) {
            alert('No category ' + categoryName + ' exists! Doing nothing')
        return;
        }
        var webR = new WebResource(url);
        if (!webR.exists()) {
            alert('Does not exist: ' + url);
        delete this.categories[categoryName];
        lively.PartsBin.removePartsSpace(name);
        this.updateCategoryList();
        return
        }
        webR.getSubElements()
        if (!webR.subDocuments || webR.subDocuments.length > 0 ||
            !webR.subCollections || webR.subCollections.length > 0) {
            alert('Will not remove directory ' + url + ' because it is not empty')
        } else {
            webR.del();
            alertOK('Removed ' + categoryName + ' url ' + url);
        }
        delete this.categories[categoryName];
        lively.PartsBin.removePartsSpace(name);
        this.updateCategoryList();
    },
        removeCategoryInteractively: function removeCategoryInteractively() {
        var partsBin = this, world = this.world();
        world.confirm('Really remove ' + this.categoryName + '?', function(result) {
        if (!result) {
           alert('no category removed!')
           return;
        }
        partsBin.removeCategory(partsBin.categoryName)
        });
    },
        removeParts: function removeParts() {
        this.get('partsBinContents').submorphs.clone().invoke('remove');
    },
        reset: function reset() {
        // this.get("PartsBinURLChooser").showHalos()
        this.connections = {toggleMorePane: {}};
        this.setSelectedPartItem(null);
        delete this.categories;
        this.getPartsBinMetaInfo().requiredModules = ['lively.PartsBin'];
        this.get('categoryList').updateList([]);
        this.get('partsBinContents').removeAllMorphs();
        this.get('searchText').setTextString("");
        this.get("PartsBinURLChooser").setList([]);
        lively.bindings.connect(this.get("PartsBinURLChooser"), 'selection', this, 'setPartsBinURL');
        this.url = null;
    },
        saveCommentForSelectedPartItem: function saveCommentForSelectedPartItem(comment) {
        if (!this.selectedPartItem) {
        alert('no part item selected!')
        return;
        }
        var metaInfo = this.selectedPartItem.getMetaInfo();
        metaInfo.setComment(comment);
        this.selectedPartItem.uploadMetaInfoOnly();
    },
        search: function search(searchString) {
        // triggers search in this.loadPartsOfCategory through connection
        var list = this.get('categoryList');
        list.deselectAll();
        list.setSelection("*search*");
    },
        setMetaInfoOfSelectedItem: function setMetaInfoOfSelectedItem(metaInfo) {
        var comment = (metaInfo && metaInfo.getComment()) ||
            'No comment yet';
        this.get('CommitLog').setTextString(this.commitLogString(metaInfo))
        this.get('selectedPartComment').textString = comment;
    },
        setPartsBinURL: function setPartsBinURL(url) {
        lively.PartsBin.partSpaces = {};
        this.url = url;
        this.reloadEverything();
    },
        setSelectedPartItem: function setSelectedPartItem(item) {
        this.selectedPartItem = item;
        this.get('selectedPartComment').textString = '';
        this.get('selectedPartVersions').updateList(item ? ['Loading versions...']: []);
        this.get('selectedPartVersions').setSelection(null);
        if (!item) {
            this.get('selectedPartName').textString = 'nothing selected'
            this.get('selectedPartSpaceName').textString = ''
        return;
        }
        this.get('selectedPartName').textString = item.name
        this.get('selectedPartSpaceName').textString = item.partsSpaceName

        // load versions
        connect(item, 'partVersions', this, 'setSelectedPartVersions');
        item.loadPartVersions(true);

        // load meta info
        connect(item, 'loadedMetaInfo', this, 'setMetaInfoOfSelectedItem');

        this.setShareLink(item);

        item.loadPartMetaInfo(true);
    },
        setSelectedPartVersions: function setSelectedPartVersions(versions) {
        // alertOK("set versions:" + versions.length)
        var list = versions.collect(function(ea) {
            var formattedDate = ea.date;
            if (formattedDate.format) {
                formattedDate = formattedDate.format("yyyy-mm-dd HH:MM")
            }
            return {
                string: formattedDate + " " + ea.author + " (" + ea.version + ")",
                value: ea, isListItem: true}
        })
        this.get('selectedPartVersions').updateList(list)
    },
        setShareLink: function setShareLink(partItem) {
        var linkText = this.get('shareLink');
        linkText.setTextString('Share Link');
        var url = 'http://www.lively-kernel.org/viral?part='
            + partItem.name + '&path=' + partItem.partsSpaceName;
        linkText.emphasizeAll({uri: url});
    },
        setupConnections: function setupConnections() {
        connect(this.closeButton, 'fire', this, 'remove')
        connect(this.addCategoryButton, 'fire', this, 'addCategoryInteractively')
        connect(this.get('removeCategoryButton'), 'fire', this, 'removeCategoryInteractively')
        connect(this.get('categoryList'), 'selection', this, 'categoryName')
        connect(this, 'categoryName', this, 'loadPartsOfCategory')

        connect(this.get('partsBinContents'), 'selectedItem', this, 'setSelectedPartItem')

        connect(this.get('reloadButton'), "fire", this, "reloadEverything")

        connect(this.get('loadPartButton'), "fire", this, "loadAndOpenSelectedPartItem")

        connect(this.get('removePartButton'), "fire", this, "interactivelyRemoveSelectedPartItem")

        connect(this.get('movePartButton'), "fire", this, "interactivelyMoveSelectedPartItem")
        connect(this.get('copyPartButton'), "fire", this, "interactivelyCopySelectedPartItem")

        connect(this.get('selectedPartComment'), "savedTextString", this, "saveCommentForSelectedPartItem")
    },
        showCommits: function showCommits() {
        if (!this.selectedPartItem) {
            alert('nothing selected');
            return;
        }
        var metaInfo = this.selectedPartItem.loadedMetaInfo;
        this.world().addTextWindow({
            title: 'Commits of ' + metaInfo.partName,
            content: this.commitLogString(metaInfo)
        });
    },
        showMsg: function showMsg(string) {
        var label = new lively.morphic.Text(new Rectangle(0,0,200,30), string);
        label.applyStyle({fill: null, borderWidth: 0})
        this.get('partsBinContents').addMorph(label)
    },
        toggleMorePane: function toggleMorePane() {
        var pane = this.get('morePane'),
            moveOffset = pane.getExtent().withY(0),
            steps = 5, timePerStep = 10,
            btn = pane.get('moreButton');
        if (pane.isVisible()) {
            var dest = pane.getPosition().addPt(moveOffset.negated());
            pane.animatedInterpolateTo(dest, steps, timePerStep, function() {
                btn.setLabel('more')
                pane.setVisible(false)
            });

        } else {
            btn.setLabel('hide')
            pane.setVisible(true)
            this.addMorphBack(pane);
            pane.align(
                pane.bounds().topRight(),
                this.get('partsBinContents').bounds().topRight());
            // move it so that it is completely visible
            var dest = pane.getPosition().addPt(moveOffset);
            pane.animatedInterpolateTo(dest, steps, timePerStep, Functions.Null);
        }
    },
        updateCategoriesDictFromPartsBin: function updateCategoriesDictFromPartsBin(thenDo) {
        delete this.categories;
        this.ensureCategories();
        var webR = new WebResource(this.partsBinURL()).noProxy().beAsync().getSubElements();
    
        var callback = function(collections) {
            collections.forEach(function(dir) {
                var unescape = Global.urlUnescape || Global.unescape,
                    unescaped = unescape(dir.getURL().filename()),
                    name = unescaped.replace(/\/$/,"");
                if (name.startsWith('.')) return;
                this.categories[name] = this.partsBinURL().withFilename(unescaped);
            }, this);
            this.updateCategoryList(this.categoryName);
            thenDo && thenDo.call(this);
        }.bind(this);
    
        lively.bindings.connect(webR, 'subCollections', {cb: callback}, 'cb', {
            updater: function($upd, value) {
                if (!(this.sourceObj.status && this.sourceObj.status.isDone())) return;
                if (!value) return;
                $upd(value);
            }
        });
    },
        updateCategoryList: function updateCategoryList(optCategoryName, doNotUpdate) {
        this.get('categoryList').updateList(
        Properties.own(this.categories).sortBy(function(name) { return name.toLowerCase()}));
        if (!doNotUpdate)
            this.get('categoryList').setSelection(optCategoryName)
    },
        updatePartsBinURLChooser: function updatePartsBinURLChooser() {
        // this.updatePartsBinURLChooser();
        this.get("PartsBinURLChooser").setList(lively.PartsBin.getPartsBinURLs());
    }
}],
    titleBar: "PartsBinBrowser",
    onLoadFromPartsBin: function onLoadFromPartsBin() {
    $super();
    this.targetMorph.reloadEverything();
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    $super();
    this.targetMorph.onLoad();
},
    reset: function reset() {
    // this.partsBinMetaInfo = x.getPartsBinMetaInfo()
}
});

}) // end of module
