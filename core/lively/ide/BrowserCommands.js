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
            this.world().alert('File ' + url + ' already exists!');
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
    }

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
    var menu = new lively.morphic.Menu(items);
    menu.openIn(world,world.firstHand().getPosition());
}

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
        w.addTextWindow({title: klass.type + ' and its subclasses', content: asText});
    },

});
lively.ide.BrowserCommand.subclass('lively.ide.UnloadClassCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        return this.browser.selectedNode() && this.browser.selectedNode().isClassNode
    },


    trigger: function() {
        return [['unload', this.unloadClass.bind(this, this.browser.selectedNode().target.name)]];
    },

    unloadClass: function(klassName) {
        var klass = Class.forName(klassName);
        if (!klass) {
            console.log('Class %s not loaded', klassName);
            return;
        }
        klass.remove();
        alertOK(klassName + ' successfully unloaded');
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.AddToFileFragmentCommand',
'doc', {
    documentation: 'Abstract command. It\'s subclasses are supposed to add some kind of source code to another parsed source entity',
},
'properties', {
    wantsMenu: Functions.True,
    menuName: null,
    targetPane: null,
    nodeType: 'not specified',
    tab: lively.morphic.Text.prototype.tab,
},
'testing', {

    isActive: function(pane) {
        return pane == this.targetPane && !!this.findSiblingNode();
    }

},
'nodes', {
    findSiblingNode: function() {
        var nodeType = this.nodeType,
            b = this.browser,
            node = b.selectedNode(),
            isValid = function(node) { return node && node[nodeType] && node.target };
        if (isValid(node)) return node;
        node = b.selectionInPane(this.targetPane);
        if (isValid(node)) return node;
        return b.nodesInPane(this.targetPane)
                   .reverse()
                   .detect(function(node) { return isValid(node) });
    },

    selectStringInSourcePane: function(string) { this.browser.selectStringInSourcePane(string) }
},
'command actions', {

    trigger: function() {
        var siblingNode = this.findSiblingNode(), self = this;
        return [[this.menuName, function() {
            console.log('Doing a ' + self.menuName + ' after ' + siblingNode.asString());
            self.browser.ensureSourceNotAccidentlyDeleted(
                function() { self.interactiveAddTo(siblingNode) });
        }]];
    },

    interactiveAddTo: function(siblingNode) {
        throw new Error('Subclass responsibility')
    },

    createSource: function(methodName) {
        throw new Error('Subclass responsibility');
    },

    createAndAddSource: function(/*siblingNode and other args*/) {
        var args = Array.from(arguments),
            siblingNode = args.shift(),
            src = this.createSource.apply(this, args),
            newTarget = siblingNode.target.addSibling(src);
        this.browser.allChanged();
        if (newTarget) {
            this.browser.selectNodeMatching(function(node) {
                return node && node.target === newTarget });
        } else {
            console.warn('Cannot select new browser item that was added with ' + this.menuName);
        }
    }

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

lively.ide.AddToFileFragmentCommand.subclass('lively.ide.AddMethodToFileFragmentCommand',
'properties', {
    menuName: 'add method',
    targetPane: 'Pane4',
    nodeType: 'isMemberNode'
},
'command actions', {
    interactiveAddTo: function(siblingNode) {
        var b = this.browser,
            methodName = "newMethod";
        this.ensureSourceHasComma(siblingNode);
        var needsComma = !!siblingNode.nextNode();
        this.createAndAddSource(siblingNode, methodName, needsComma);
        this.selectStringInSourcePane(methodName);
    },

    ensureSourceHasComma: function(node) {
        var src = node.target.getSourceCode();
        if (/,\s*$/.test(src)) return;
        src = src.replace(/(\s*)$/, ',$1');
        node.target.putSourceCode(src);
    },

    createSource: function(methodName, needsComma) {
        var comment = this.tab + this.tab + '// enter comment here'
        return Strings.format('%s: function() {\n%s\n%s}%s',
                              this.tab + methodName, comment, this.tab,
                              needsComma ? ',' : '');
    }
});

lively.ide.BrowserCommand.subclass('lively.ide.RunTestMethodCommand', {

    wantsMenu: Functions.True,

    getSelectedNode: function() {
        return this.browser.selectedNode();
    },

    getTestClass: function() {
        var node = this.getSelectedNode();
            klassName = (node.isClassNode && node.target.getName())
                     || (node.target.getClassName && node.target.getClassName())
                     || node.target.className,
            klass = Class.forName(klassName);
        return Class.isClass(klass) && Global.TestCase && klass.isSubclassOf(TestCase) && klass;
    },

    isActive: function(pane) {
        var node = this.getSelectedNode();
        if (!node) return false;
        if (node.isClassNode && !!this.getTestClass()) return true;
        if (node.isMemberNode && !node.target.isStatic() && node.target.getName().startsWith('test')) return true;
        return false;
    },

    showTestResult: function(testClassName, testSelector, test) {
        var failures = test.result.failureList(),
            world = lively.morphic.World.current();
        if (failures.length == 0) {
            var msg = testSelector ?
                testClassName + '>>' + testSelector + ' succeeded' :
                'all tests of ' + testClassName + ' succeeded';
            world.setStatusMessage(msg, Color.green, 3);
        } else {
            world.logError(test.result.failed[0].err);
        }
    },

    runTest: function() {
        var moduleName = this.browser.getSelectedModule().name();
        require(moduleName).toRun(function() {
            var klass = this.getTestClass(),
                node = this.getSelectedNode(),
                testSelector = node.isMemberNode && node.target.getName(),
                test = klass && new klass(),
                tests = undefined;
            if (testSelector) {
                alertOK('Running test ' + klass.type + '>>' + testSelector);
                tests = [new klass(test.result, testSelector)];
            } else {
                alertOK('Running all tests of ' + klass.type);
            }
            test.runAllThenDo(null, this.showTestResult.bind(this, klass.name, testSelector, test), tests);
        }.bind(this));
    },

    trigger: function() {
        return [['run test', this.runTest.bind(this)]]
    }

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
        return  node && node.isModuleNode;
    },

    trigger: function() {
        return [['diff versions', this.diffVersions.bind(this)]]
    },
    diffVersions: function() {
        var moduleNode = this.browser.getPane1Selection(),
            moduleName = moduleNode && moduleNode.moduleName;
        if (!moduleNode || !moduleName) {
            alert('No module selected');
            return;
        }
        var m = module(moduleName),
            url = m.uri(),
            differ = lively.PartsBin.getPart('VersionDiffer', 'PartsBin/Tools'),
            pos = this.world().visibleBounds().center()
        differ.openInWorld();
        differ.align(differ.bounds().center(), pos)
        differ.targetMorph.setURL(url);
    },


});
lively.ide.BrowserCommand.subclass('lively.ide.OpenVersionsOfFile', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var node = this.browser.selectedNode();
        return  node && node.isModuleNode;
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
