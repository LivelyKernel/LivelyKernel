module('lively.ide.BrowserCommands').requires('lively.ide.BrowserFramework').toRun(function() {

lively.ide.BrowserCommand.subclass('lively.ide.AllModulesLoadCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() { return 'Load all' },

    trigger: function() { 
        var srcCtrl = lively.ide.SourceControl;
        var browser = this.browser;
        var progressBar = lively.morphic.World.current().addProgressBar();
        var files = srcCtrl.interestingLKFileNames(browser.getTargetURL());
        files.forEachShowingProgress(
            progressBar,
            function(ea) { srcCtrl.addModule(ea) },
            Functions.K, // label func
            function() { progressBar.remove(); browser.allChanged() }); 
    },
});

lively.ide.BrowserCommand.subclass('lively.ide.ShowLineNumbersCommand', {
    
    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() { return 'LineNo' },

    trigger: function() {
        browser = this.browser;
        browser.ensureSourceNotAccidentlyDeleted(function() {
            browser.showLines = !browser.showLines;
            browser.allChanged();
        });
    }

});

lively.ide.BrowserCommand.subclass('lively.ide.RefreshCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() { return 'Refresh' },

    trigger: function() {
        var browser = this.browser;
        browser.ensureSourceNotAccidentlyDeleted(function() {
            browser.allChanged();
        });
    }

});
lively.ide.BrowserCommand.subclass('lively.ide.ParserDebugCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() { return this.browser.showsParserErrors() ? 'Dbg errors is on' : 'Dbg errors is off' },

    trigger: function() {
        if (this.browser.showsParserErrors()) this.browser.turnParserErrorsOff();
        else this.browser.turnParserErrorsOn();
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.EvaluateCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() {
        if (this.browser.evaluate) return 'Eval on';
        return 'Eval off'
    },

    trigger: function() {
        this.browser.evaluate = !this.browser.evaluate;
    }

});
lively.ide.BrowserCommand.subclass('lively.ide.ChangesGotoChangeSetCommand', {

    isActive: Functions.True,

    wantsButton: function() {
        return false;//true;
    },

    asString: function() {
        if (this.browser.changesGotoChangeSet) return 'To ChangeSet';
        return 'To files'
    },

    trigger: function() {
        this.browser.changesGotoChangeSet = !this.browser.changesGotoChangeSet;
    }

});

lively.ide.BrowserCommand.subclass('lively.ide.SortCommand', {

    filter: new lively.ide.SortFilter(),

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() {
        if (this.browserIsSorting()) return 'Unsort';
        return 'Sort'
    },

    trigger: function() {
        var filter = this.filter;
        var browser = this.browser;
        var isSorting = this.browserIsSorting();

        browser.ensureSourceNotAccidentlyDeleted(function() {
            browser.filterPlaces.forEach(function(ea) {
                isSorting ?
                    browser.uninstallFilters(function(f) { return f === filter }, ea) :
                    browser.installFilter(filter, ea);
            });
            browser.allChanged();
        });

    },

    browserIsSorting: function() {
        return this.browser.getPane1Filters().include(this.filter);
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.AddNewFileCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() { return 'Add module' },

    world: function() { return lively.morphic.World.current() },

    createModuleFile: function(url) {
        var content = '';
        if (url.filename().endsWith('.ometa')) {
            content = this.ometaTemplate();
        } else {
            if (!url.filename().endsWith('.js'))
                url = new URL(url.toString() + '.js');
            content = this.moduleTemplateFor(url);
        }
        var webR = new WebResource(url).beSync();
        if (webR.exists()) {
            this.world().notify('File ' + url + ' already exists!');
            return null
        }
        webR.put(content);
        return url.filename();
    },
    createNamespaceDir: function(url) {
        new WebResource(url).create();
        return url.filename(); 
    },

    createFileOrDir: function(input) {
        if (input === null) return;

        var browser = this.browser,
            url = browser.getTargetURL().withFilename(input),
            nodeName = url.isLeaf() ? this.createModuleFile(url) : this.createNamespaceDir(url);

        browser.rootNode().locationChanged();
        browser.allChanged();
        browser.inPaneSelectNodeNamed('Pane1', nodeName);
    },


    moduleTemplateFor: function(url) {
        var filename = url.filename(),
            moduleName = url.asModuleName();
        return Strings.format('module(\'%s\').requires().toRun(function() {\n\n// Enter your code here\n\n}) // end of module',
                moduleName);
    },

    ometaTemplate: function(filename) {
        return 'ometa TestParser <: Parser {\n\texampleRule = 1\n}';
    },

    trigger: function() {
        var command = this, browser = this.browser;
        browser.ensureSourceNotAccidentlyDeleted(function() {
            command.world().prompt('Enter filename (something like foo or foo.js or foo.ometa or foo/)', 
                command.createFileOrDir.bind(command));
        });
    },
    
});

lively.ide.BrowserCommand.subclass('lively.ide.BrowseWorldCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() { return 'Browse world...' }

});

lively.ide.BrowserCommand.subclass('lively.ide.ViewSourceCommand', {

    isActive: function() { return this.browser.selectedNode() && this.browser.selectedNode().isMemberNode },

    wantsButton: Functions.True,

    asString: function() { return 'View as...' },

    trigger: function() {
    var browser = this.browser;
    var world = lively.morphic.World.current();
    var spec = [
        {caption: 'default', value: undefined},
        {caption: 'javascript', value: 'javascript'}
    ];
    var items = spec.collect(function(ea) {
      return [ea.caption,function(evt) {
            browser.ensureSourceNotAccidentlyDeleted(function() {
                browser.viewAs = ea.value;
                browser.selectedNode().signalTextChange()
            });
        }];
    });
    var menu = new MenuMorph(items);
    menu.openIn(world,world.firstHand().getPosition());
},

});
lively.ide.BrowserCommand.subclass('lively.ide.SaveChangesCommand', {

    wantsButton: Functions.True,

    isActive: Functions.True,

    asString: function() {
        return 'Push changes back';
    },

    trigger: function() {
        var b = this.browser;
        var w = lively.morphic.World.current()
        if (!(b instanceof lively.ide.LocalCodeBrowser)) {
            console.log('Save changes not yet implemented for ' + b);
            return;
        }    
        if (!b.worldProxy) {
            w.setStatusMessage('Browser has no WorldProxy -- cannot save!', Color.red, 5);
            return;
        }
        b.worldProxy.writeChangeSet(b.changeSet);
        w.setStatusMessage('Successfully stored world', Color.green);
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.ChangeSetMenuCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        return (this.browser.selectionInPane('Pane1') instanceof lively.ide.ChangeSetNode && pane == 'Pane2') ||
            this.browser instanceof lively.ide.LocalCodeBrowser && pane == 'Pane1';
    },

    trigger: function() {
        var cmd = this;
        return [['add class', cmd.addClass.bind(this)], ['add doit', cmd.addDoit.bind(this)]];
    },

    getChangeSet: function() {
        if (this.browser.selectionInPane('Pane1') instanceof lively.ide.ChangeSetNode)
            return this.browser.selectionInPane('Pane1').target;
        if (this.browser instanceof lively.ide.LocalCodeBrowser)
            return this.browser.changeSet;
        throw new Error('Do not know which ChangeSet to choose for command');
    },

    addClass: function() {
        this.createChange(ClassChange, 'NewClass', 'Object');
    },

    addDoit: function() {
        var node = this, w = this.world();

        w.prompt('Enter name for doit', function(name) {
            node.createChange(DoitChange, '// empty',  name);
        }, 'doit');
    },
    createChange: function(/*ChangeClass and arguments*/) {
        var w = this.world(),
            node = this,
            b = this.browser,
            args = $A(arguments),
            klass = args.shift();
        try {
            var change = klass.create.apply(klass, args);
            node.getChangeSet().addSubElement(change);
            if (b.evaluate) change.evaluate();
            b.allChanged();
            if (args[0]) {
                b.selectNodeNamed(args[0]);
                b.selectStringInSourcePane(args[0]);
            }
        } catch(e) {
            if (change) change.remove();
            w.alert('Error when creating: ' + klass.name + '\n' + e);
        }
    },
});

lively.ide.BrowserCommand.subclass('lively.ide.ClassChangeMenuCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var sel = this.browser.selectedNode();
        var paneOfSel = this.browser.paneNameOfNode(sel);
        var paneNoOfSel = Number(paneOfSel.substring('Pane'.length));
        var nextPane = 'Pane' + (paneNoOfSel+1);
        return  sel instanceof lively.ide.ChangeSetClassNode && pane == nextPane ||
            sel instanceof lively.ide.ChangeSetClassElemNode && pane == paneOfSel;
    },


    trigger: function() {
        var cmd = this;
        return [['add method', cmd.addMethod.bind(this)]];
    },
addMethod: function() {
    var b = this.browser;
    var w = lively.morphic.World.current();
     classChange = b.selectedNode().target instanceof ClassChange ?
            b.selectedNode().target : b.selectedNode().target.parent();

    var createChange = function(methodName) {
        var change = ProtoChange.create(methodName, 'function() {}');
        classChange.addSubElement(change);
        if (b.evaluate)
            change.evaluate();
        b.allChanged();
    }

    w.prompt('Enter method name', function(n1) {
        createChange(n1);
    });
},

});

lively.ide.BrowserCommand.subclass('lively.ide.ClassHierarchyViewCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        return this.browser.selectedNode() && this.browser.selectedNode().isClassNode
    },


    trigger: function() {
        return [['view hierarchy', this.viewHierarchy.curry(this.browser.selectedNode().target.name).bind(this)]];
    },

    viewHierarchy: function(klassName) {
        var w = lively.morphic.World.current();

        var klass = Class.forName(klassName)
        if (!klass) {
            w.alert('Cannot find class ' + klassName)
            return
        }

        var list = klass.withAllSortedSubclassesDo(function(kl, idx, level) {
            var indent = Array.range(1, level).inject('', function(str, idx) { return str + '  ' });
            return {isListItem: true, string: indent + (kl.type || kl.name), value: kl};
        });
        //var listPane = newRealListPane(new Rectangle(0,0, 400, 400));
        //listPane.innerMorph().updateList(list);
        // w.addFramedMorph(listPane, klass.type + ' and its subclasses');
        var asText = list.pluck('string').join('\n');
        w.addTextWindow({title: klass.type + ' and its subclasses', content: asText})
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.AddToFileFragmentCommand', {

    documentation: 'Abstract command. It\'s subclasses are supposed to add some kind of source code to another parsed source entity',

    wantsMenu: Functions.True,

    menuName: null,
    targetPane: null,
    nodeType: 'not specified',
    tab: Config.isNewMorphic ? lively.morphic.Text.prototype.tab : '\t',

    isActive: function(pane) {
        return pane == this.targetPane && this.findSiblingNode() != null;
    },

    findSiblingNode: function() {
        var isValid = function(node) {
            return node && node[this.nodeType] && node.target;
        }.bind(this);
        var b = this.browser, node = b.selectedNode();
        if (isValid(node)) return node;
        node = b.selectionInPane(this.targetPane);
        if (isValid(node)) return node;
        return b.nodesInPane(this.targetPane).reverse().detect(function(node) { return isValid(node) });
    },

    trigger: function() {
        var siblingNode = this.findSiblingNode(), self = this;
        return [[this.menuName, function() {
            console.log('Doing a ' + self.menuName + ' after ' + siblingNode.asString());
            self.browser.ensureSourceNotAccidentlyDeleted(function() { self.interactiveAddTo(siblingNode) });    
        }]]
    },

    interactiveAddTo: function(siblingNode) {
        throw new Error('Subclass responsibility')
    },

    createSource: function(methodName) {
        throw new Error('Subclass responsibility');
    },
    createAndAddSource: function(/*siblingNode and other args*/) {
        var args = $A(arguments),
            siblingNode = args.shift(),
            src = this.createSource.apply(this,args),
            newTarget = siblingNode.target.addSibling(src);
        this.browser.allChanged();
        if (!newTarget) {
            console.warn('Cannot select new browser item that was added with ' + this.menuName)
            return
        }
        this.browser.selectNodeMatching(function(node) { return node && node.target == newTarget });
    },
    selectStringInSourcePane: function(string) { this.browser.selectStringInSourcePane(string) },
});

lively.ide.AddToFileFragmentCommand.subclass('lively.ide.AddClassToFileFragmentCommand', {

    menuName: 'add class',
    targetPane: 'Pane2',
    nodeType: 'isClassNode',

    interactiveAddTo: function(siblingNode) {
        var w = this.world(), b = this.browser, self = this;
        var className = 'MyClass'
        self.createAndAddSource(siblingNode, className, 'Object' );
        this.selectStringInSourcePane(className);
    },

    createSource: function(className, superClassName) {
            return Strings.format('%s.subclass(\'%s\',\n\'default category\', {\n%sm1: function() {},\n});',
                superClassName, className, this.tab);
        },

});

lively.ide.AddToFileFragmentCommand.subclass('lively.ide.AddObjectExtendToFileFragmentCommand', {

    menuName: 'add object extension',
    targetPane: 'Pane2',
    nodeType: 'isClassNode',

    interactiveAddTo: function(siblingNode) {
        var w = this.world(), b = this.browser, self = this;
        var className = 'SomeObject'
        self.createAndAddSource(siblingNode, className);
        this.selectStringInSourcePane(className);
    },

    createSource: function(className) {
        return Strings.format('Object.extend(%s, {\n%sm1: function() {},\n});', className, this.tab);
    },

});

lively.ide.AddToFileFragmentCommand.subclass('lively.ide.AddLayerToFileFragmentCommand', {

    menuName: 'add layer',
    targetPane: 'Pane2',
    nodeType: 'isClassNode',

    interactiveAddTo: function(siblingNode) {
        var w = this.world(), b = this.browser, self = this;
        var layerName = "MyLayer";
        self.createAndAddSource(siblingNode, "'" + layerName +"'", "MyClass");
        this.selectStringInSourcePane(layerName);
    },

    createSource: function(layerName, className) {
        return Strings.format('cop.create(%s).refineClass(%s, {\n%smethodName: function(arg1) {\n%s%svar result = cop.proceed(arg1);\n%s%sreturn result\n%s},\n});', layerName, className, this.tab,this.tab,this.tab,this.tab,this.tab);
        },

});

lively.ide.AddToFileFragmentCommand.subclass('lively.ide.AddMethodToFileFragmentCommand', {

    menuName: 'add method',
    targetPane: 'Pane4',
    nodeType: 'isMemberNode',

    interactiveAddTo: function(siblingNode) {
        var w = this.world(), b = this.browser, self = this;
        var methodName = "newMethod";
        self.createAndAddSource(siblingNode, methodName);
        this.selectStringInSourcePane(methodName);
        LastFragment  = this;
        LastSubling = siblingNode;
    },

    createSource: function(methodName) {
        var comment = this.tab + this.tab + '// enter comment here'
        return Strings.format('%s: function() {\n%s\n%s},', this.tab+methodName, comment, this.tab);
    },
});

lively.ide.BrowserCommand.subclass('lively.ide.RunTestMethodCommand', {

    wantsMenu: Functions.True,

    getSelectedNode: function() {
        return this.browser.selectedNode();
    },

    getTestClass: function() {
        var node = this.getSelectedNode(),
            klassName = node.target.getClassName ? node.target.getClassName() : node.target.className,
            klass = Class.forName(klassName);
        return klass && Global.TestCase && klass.isSubclassOf(TestCase) && klass;
    },

    isActive: function(pane) {
        var node = this.getSelectedNode();
        if (!node || !node.isMemberNode || node.target.isStatic() || !node.target.getName().startsWith('test'))
            return;
        return this.getTestClass() != null;
    },

    runTest: function() {
        var klass = this.getTestClass(),
            testSelector = this.getSelectedNode().target.getName();
        var test = new klass();
        test.runTest(testSelector);
        var failures = test.result.failureList();
        if (failures.length == 0) {
            var msg = klass.name + '>>' + testSelector + ' succeeded'; 
            lively.morphic.World.current().setStatusMessage(msg, Color.green, 3);
        } else {
            // lively.morphic.World.current().setStatusMessage(failures[0], Color.red, 6);
            lively.morphic.World.current().logError(test.result.failed[0].err)
        }
    },

    trigger: function() {
        return [['run test', this.runTest.bind(this)]]
    },

});
lively.ide.BrowserCommand.subclass('lively.ide.OpenInFileEditorCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var node = this.browser.selectedNode();
        return  node && node.isModuleNode
    },

    trigger: function() {
        return [['open in text editor', this.openFile.bind(this)]]
    },
    openFile: function() {
        var url = URL.codeBase.withFilename(this.browser.selectedNode().moduleName);
        lively.ide.openFile(url)
    },


});
lively.ide.BrowserCommand.subclass('lively.ide.OpenDiffViewerCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var node = this.browser.selectedNode();
        return  node && node.isModuleNode && Config.isNewMorphic
    },

    trigger: function() {
        return [['diff versions', this.diffVersions.bind(this)]]
    },
    diffVersions: function() {
        var url = URL.codeBase.withFilename(this.browser.selectedNode().moduleName);
        var differ = lively.PartsBin.getPart('VersionDiffer', 'PartsBin/NewWorld');
        var pos = this.world().visibleBounds().center()
        differ.openInWorld();
        differ.align(differ.bounds().center(), pos)
        differ.targetMorph.setURL(url);
    },


});
lively.ide.BrowserCommand.subclass('lively.ide.OpenVersionsOfFile', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var node = this.browser.selectedNode();
        return  node && node.isModuleNode && Config.isNewMorphic
    },
    trigger: function() {
        return [['show versions', this.showVersions.bind(this)]]
    },
    showVersions: function() {
        var filename = this.browser.getPane1Selection().asString(),
            url = this.browser.getTargetURL().withFilename(filename);
        require('lively.ide.VersionTools').toRun(function() {
            new lively.ide.FileVersionViewer().openForURL(url);
        });
    },
});
lively.ide.BrowserCommand.subclass('lively.ide.OpenModulePartCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var node = this.browser.selectedNode();
        return node && node.isModuleNode;
    },
    trigger: function() {
        return [['get module part', this.openModulePart.bind(this)]]
    },
    openModulePart: function() {
        var part = lively.PartsBin.getPart('ModulePart', 'PartsBin/Tools'),
            node = this.browser.getPane1Selection(); // FIXME
        part.openInHand();
        part.setModuleName(node.realModuleName());
    },
});

}) // end of module