module('lively.morphic.tools.Preferences').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.morphic.tools.Preferences', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(674.0,473.0),
    _Position: lively.pt(865.0,47.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    name: "UserPrefPanel",
    sourceModule: "lively.morphic.Widgets",
    titleBar: "Preferences",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(668.0,448.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        _StyleClassNames: ["Morph","Box","UserPrefPanel"],
        _StyleSheet: ".UserPrefPanel {\n\
    	background-color: rgb(200,200,200);\n\
    }\n\
    \n\
    .UserPrefPanel .GroupItems {\n\
    	background: white;\n\
    }\n\
    \n\
    .UserPrefPanel .GroupItems .Text {\n\
    	font-size: 10pt;\n\
    	background: none;\n\
    	border: 0;\n\
    }\n\
    \n\
    .UserPrefPanel .GroupItems .Text.ConfigValue.modified {\n\
    	font-weight: bold;\n\
    }\n\
    \n\
    .UserPrefPanel .GroupItems .Text.ConfigValue {\n\
    	cursor: pointer;\n\
    }\n\
    \n\
    .UserPrefPanel .GroupItems .Text.ConfigValue:hover {\n\
    	text-decoration: underline;\n\
    }",
        className: "lively.morphic.Box",
        droppingEnabled: false,
        layout: {adjustForNewBounds: true,resizeHeight: true,resizeWidth: true},
        name: "UserPrefPanel",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _ClipMode: "auto",
            _Extent: lively.pt(175.0,403.0),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(6.0,10.0),
            _StyleClassNames: ["Morph","Box","List","ConfigCategories"],
            className: "lively.morphic.List",
            itemList: [],
            layout: {resizeHeight: true},
            name: "ConfigCategories",
            selectedLineNo: -1,
            selection: null,
            sourceModule: "lively.morphic.Core",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("UserPrefPanel"), "onConfigGroupSelected", {});
        }
        },{
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(473.0,431.0),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(187.0,10.0),
            _StyleClassNames: ["Morph","Box","GroupItems"],
            className: "lively.morphic.Box",
            droppingEnabled: true,
            layout: {resizeHeight: true,resizeWidth: true},
            name: "GroupItems",
            sourceModule: "lively.morphic.Core",
            addText: function addText(string, layoutState) {
            var t = new lively.morphic.Text(lively.rect(0,0,100, 20), string);
            layoutState.addUnlayoutedMorph(t);
            t.applyStyle({
                visible: false,
                fixedWidth: false, allowInput: false,
                cssStylingMode: true, fill: null, borderWidth: 0,
                whiteSpaceHandling: 'pre'
            }).fitThenDo(function() { t.setVisible(true); layoutState.removeLayoutedMorph(t); });
            return this.addMorph(t);
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,23.0),
            _Position: lively.pt(7.0,417.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            label: "⟳",
            name: "RefreshButton",
            pinSpecs: [{
                accessor: "fire",
                location: 1.5,
                modality: "output",
                pinName: "fire",
                type: "Boolean"
            }],
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("UserPrefPanel"), "reload", {});
        }
        }],
        getConfigItems: function getConfigItems() {
        // this.getConfigItems()
        return Config.allOptionNames().map(function(option) {
            var spec = Config._options[option];
            return {
                name: option,
                value: Config.lookup(option),
                default: spec ? spec.default: null,
                group: spec &&spec.group ? spec.group : '*no group*',
                type: spec ? spec.type: null,
                doc: spec ? spec.doc: null,
                modified: !Config.hasDefaultValue(option),
                setValue: function(newValue) {
                    this.value = Config.set(this.name, newValue);
                    this.modified = !Config.hasDefaultValue(this.name);
                }
            };
        });
    },
        getDefaultConfigGroups: function getDefaultConfigGroups() {
        return this.getConfigItems()
            .groupByKey('group')
            .mapGroups(function(name, valueItemsOfGroup) {
                return {
                    isListItem: true,
                    string: name,
                    value: {showGroupMethod: 'showConfigOptionsForGroup',name: name,items: valueItemsOfGroup}
                };
            }).toArray();
    },
        getKeyBindingGroups: function getKeyBindingGroups(thenDo) {
        // self.getKeyBindingGroups(function(err, bindings) { show('...'+bindings); })
        var codeEditor, codeEditorKeys, shortcutGroups, morphicKeys;
        function getCodeEditor(thenDo) {
            codeEditor = $world.addCodeEditor();
            codeEditor.withAceDo(function(ed) {
                codeEditor.owner.remove();
                thenDo();
            });
        }
        function getCodeEditorKeys(thenDo) {
            codeEditorKeys = lively.morphic.KeyboardDispatcher.global().getEditorKeybindings(codeEditor);
            thenDo();
        }
        function getMorphicKeys(next) {
            morphicKeys = lively.morphic.KeyboardDispatcher.global().getGlobalKeybindings()
            next();
        }
        function getShortcutGroups(thenDo) {
            shortcutGroups = [{
                isListItem: true,
                string: '*Key Shortcuts CodeEditor*',
                value: {
                    showGroupMethod: 'showConfigOptionsCodeEditorKeysBindings',
                    items: codeEditorKeys}
            }, {
                isListItem: true,
                string: '*Key Shortcuts Morphic*',
                value: {
                    showGroupMethod: 'showConfigOptionsCodeEditorKeysBindings',
                    items: morphicKeys}
            }];
            thenDo();
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        [getCodeEditor, getCodeEditorKeys, getMorphicKeys, getShortcutGroups].doAndContinue(null, function() {
            thenDo(null, shortcutGroups); });
    },
        onConfigGroupSelected: function onConfigGroupSelected(group) {
        if (!group) {
            this.get('GroupItems').removeAllMorphs();
        } else {
            this[group.showGroupMethod](group);
        }
    },
        onLoad: function onLoad() {
        this.reload();
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.reload();
    },
        reload: function reload() {
         this.reset();
         this.showConfigGroups();
         this.showHelp();
    },
        newLayoutState: function newLayoutState() {
        return {
            morphsInLayout: [],
            whenLayoutingDoneCallbacks: [],
            addUnlayoutedMorph: function(morph) { this.morphsInLayout.push(morph); },
            removeLayoutedMorph: function(morph) {
                this.morphsInLayout.remove(morph);
                if (this.morphsInLayout.length > 0) return;
                while (this.whenLayoutingDoneCallbacks.length) this.whenLayoutingDoneCallbacks.shift().call();
            }
        }
    },
        reset: function reset() {
        // this.reset()
        lively.bindings.connect(this.get("ConfigCategories"), 'selection', this, 'onConfigGroupSelected');
        lively.bindings.connect(this.get("RefreshButton"), 'fire', this, 'reload');
        this.get("ConfigCategories").setList([]);
        this.get("ConfigCategories").selection = null;
        this.get("GroupItems").removeAllMorphs();
    },
        showHelp: function showHelp() {
            var s = Strings.format('When you click on a Config category on the left you can see and edit the options of that category.')
            this.get('GroupItems').addText(s, this.newLayoutState());
        },
        showConfigGroups: function showConfigGroups() {
        // this.reset(); this.showConfigGroups();
        var self = this, optionGroups = [];
        [function(next) {
            self.getKeyBindingGroups(function(err, bindings) {
                optionGroups.pushAll(bindings); next(); })
        },
        function(next) {optionGroups.pushAll(self.getDefaultConfigGroups()); next(); },
        function sort(next) {
            optionGroups = optionGroups.sortBy(function(item) { return item.string.toLowerCase().charCodeAt(0); }); next();
        }].doAndContinue(null, function() {
            self.get("ConfigCategories").setList(optionGroups);
        })
    },
        showConfigOptionsCodeEditorKeysBindings: function showConfigOptionsCodeEditorKeysBindings(groupItem) {
        var debug = false,
            groupName = groupItem.name,
            itemContainer = this.get('GroupItems'),
            layoutState = this.newLayoutState();
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        itemContainer.removeAllMorphs();
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var optionNameMorphs = [], valueMorphs = [];
        function addConfigValueItems(next) {
            var pos = pt(0,0);
            layoutState.whenLayoutingDoneCallbacks.push(next);
            groupItem.items.forEach(function(item) {
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                // name morph setup
                var nameMorph = itemContainer.addText(item.name + ':', layoutState);
                nameMorph.setPosition(pos);
                pos = pos.addXY(0,20);
                optionNameMorphs.push(nameMorph);
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                // value morph setup
                var valueMorph = nameMorph.valueMorph = itemContainer.addText(item.keys, layoutState);
                valueMorph.addStyleClassName('ConfigValue');
                valueMorph.configItem = item;
            });
        }
        function resizeGroupNames(next) {
            var maxGroupNameWidth = optionNameMorphs.max(function(ea) { return ea.getExtent().x; }).getExtent().x;
            optionNameMorphs.forEach(function(ea) {
                ea.applyStyle({extent: ea.getExtent().withX(maxGroupNameWidth)})
                ea.valueMorph.align(ea.valueMorph.bounds().topLeft(), ea.bounds().topRight());
                ea.valueMorph.setVisible(true);
            });
            next();
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        [addConfigValueItems, resizeGroupNames].doAndContinue();
    },
        showConfigOptionsForGroup: function showConfigOptionsForGroup(groupItem) {
        // this.showConfigOptionsForGroup('lively.persistence');
        // groupName = 'lively.persistence'
        var debug = false,
            groupName = groupItem.name,
            itemContainer = this.get('GroupItems'),
            layoutState = this.newLayoutState();
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        itemContainer.removeAllMorphs();
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var optionNameMorphs = [], valueMorphs = [];
        function addConfigValueItems(next) {
            var pos = pt(0,0);
            layoutState.whenLayoutingDoneCallbacks.push(next);
            groupItem.items.forEach(function(item) {
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                // name morph setup
                var nameMorph = itemContainer.addText(item.name + ':', layoutState);
                nameMorph.setPosition(pos);
                pos = pos.addXY(0,20);
                optionNameMorphs.push(nameMorph);
                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
                // value morph setup
                var valueMorph = nameMorph.valueMorph = itemContainer.addText('', layoutState);
                valueMorph.addStyleClassName('ConfigValue');
                valueMorph.configItem = item;
                valueMorph.addScript(function printValue(val) {
                    return Strings.print(val).replace(/\n/g, '').truncate(40);
                });
                valueMorph.addScript(function onValueChanged() {
                    var item = this.configItem, val = item.value;
                    this[item.modified ? 'addStyleClassName' : 'removeStyleClassName']('modified');
                    this.textString = this.printValue(val);
                });
                valueMorph.addScript(function onMouseDown(evt) {
                    var configItem = this.configItem,
                        w = this.world();
                    w.editPrompt('Enter value for ' + configItem.name, function(input) {
                        if (!input) {
                            w.confirm('Do you really want to remove the config setting for ' + configItem.name + '?', function(input) {
                                if (input) { Config.removeOption(configItem.name); show(configItem.name + ' removed'); }
                                else { show(configItem.name + ' not removed'); }
                            }); return;
                        }
                        try { var newVal = eval(input); } catch(err) {
                            show("error reading new Config value: %s", err); return; }
                        configItem.setValue(newVal);
                        this.onValueChanged()
                        alertOK('set ' + configItem.name + ' to ' + Strings.print(newVal));
                    }.bind(this), this.printValue(configItem.value));
                });
                valueMorph.onValueChanged()
            });
        }
        function resizeGroupNames(next) {
            var maxGroupNameWidth = optionNameMorphs.max(function(ea) { return ea.getExtent().x; }).getExtent().x;
            optionNameMorphs.forEach(function(ea) {
                ea.applyStyle({extent: ea.getExtent().withX(maxGroupNameWidth)})
                ea.valueMorph.align(ea.valueMorph.bounds().topLeft(), ea.bounds().topRight());
                ea.valueMorph.setVisible(true);
            });
            next();
        }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        [addConfigValueItems, resizeGroupNames].doAndContinue();
    }
    }]
});

}) // end of module