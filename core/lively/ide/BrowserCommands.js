module('lively.ide.BrowserCommands').requires('lively.ide.BrowserFramework').toRun(function() {

lively.ide.BrowserCommand.subclass('lively.ide.AllModulesLoadCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        return pane === 'Pane1';
    },

    loadModules: function() {
        var srcCtrl = lively.ide.SourceControl,
            browser = this.browser,
            files = srcCtrl.interestingLKFileNames(browser.getTargetURL()),
            progressBar = lively.morphic.World.current().addProgressBar();

        files.forEachShowingProgress(
            progressBar,
            function(ea) { srcCtrl.addModule(ea) },
            Functions.K, // label func
            function() { progressBar.remove(); browser.allChanged() });
    },

    trigger: function() {
        return [['load visible modules', this.loadModules.bind(this)]];
    },
});

lively.ide.BrowserCommand.subclass('lively.ide.ShowLineNumbersCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() {
        var checkboxString = this.browser.showLines ? '[X]' : '[ ]';
        return checkboxString + ' ' + 'Show line numbers in panes';
    },

    trigger: function() {
        var browser = this.browser;
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

    asString: function() {
        var checkboxString = this.browser.showsParserErrors() ? '[X]' : '[ ]';
        return checkboxString + ' ' + 'Show parser errors';
    },

    trigger: function() {
        if (this.browser.showsParserErrors()) {
            this.browser.turnParserErrorsOff();
        } else {
            this.browser.turnParserErrorsOn();
        }
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.EvaluateCommand', {

    isActive: Functions.True,

    wantsButton: Functions.True,

    asString: function() {
        var checkboxString = this.browser.evaluate ? '[X]' : '[ ]';
        return checkboxString + ' ' + 'Evaluate code when saving';
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
        if (this.browserIsSorting()) return 'Order as in File';
        return 'Order alphabetically';
    },

    trigger: function() {
        var filter = this.filter;
        var browser = this.browser;
        var isSorting = this.browserIsSorting();

        browser.ensureSourceNotAccidentlyDeleted(function() {
            if (isSorting) {
                browser.uninstallFilter(filter);
            } else {
                browser.installFilter(filter);
            }
        });
        browser.allChanged();
    },

    browserIsSorting: function() {
        return this.browser.getPane1Filters().include(this.filter);
    },

});

lively.ide.BrowserCommand.subclass('lively.ide.AddNewFileCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        return pane === 'Pane1';
    },

    world: function() { return lively.morphic.World.current() },

    createModuleFile: function(url) {
        var content = '';
        var extension = url.extension();
        if (extension === '') {
            extension = 'js';
            url = new URL(url.toString() + '.js')
        }
        if (extension === 'ometa') {
            content = this.ometaTemplate();
        } else if (extension === 'js') {
            content = this.moduleTemplateFor(url);
        }
        var webR = new WebResource(url).beSync();
        if (webR.exists()) {
            this.world().alert('File ' + url + ' already exists!');
            return null;
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

    addNewFile: function() {
        var command = this,
            browser = this.browser;

        browser.ensureSourceNotAccidentlyDeleted(function() {
            command.world().prompt('Enter filename (something like foo or foo.js or foo.ometa or foo/)',
                command.createFileOrDir.bind(command));
        });
    },

    trigger: function() {
        return [['add new file', this.addNewFile.bind(this)]]
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
        var browser = this.browser,
            world = lively.morphic.World.current(),
            spec = [
                {caption: 'default', value: undefined},
                {caption: 'javascript', value: 'javascript'}
            ],
            items = spec.collect(function(ea) {
              return [ea.caption,function(evt) {
                    browser.ensureSourceNotAccidentlyDeleted(function() {
                        browser.viewAs = ea.value;
                        browser.selectedNode().signalTextChange()
                    });
                }];
            });
        var menu = new lively.morphic.Menu(this.asString(), items);
        menu.openIn(world,world.firstHand().getPosition());
    }

});

lively.ide.BrowserCommand.subclass('lively.ide.ClassHierarchyViewCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        if (!this.browser.selectedNode()
        || !this.browser.selectedNode().isClassNode) return false;
        var klassName = this.browser.selectedNode().target.name,
            klass = lively.Class.forName(klassName);
        return klass && lively.Class.isClass(klass);
    },


    trigger: function() {
        return [['view hierarchy', this.viewHierarchy.bind(this, this.browser.selectedNode().target.name)]];
    },

    viewHierarchy: function(klassName) {
        var w = lively.morphic.World.current();

        var klass = lively.Class.forName(klassName)
        if (!klass || !lively.Class.isClass(klass)) {
            show('No such class ' + klassName)
            return
        }

        function makeListItem(klass, level, addString) {
            return {
                isListItem: true,
                value: klass,
                string: Strings.indent((addString || '') + (klass.type || klass.name), '  ', level)
            };
        }

        var allClasses = Global.classes(true);
        function directSubclasses(klass) {
          allClasses.filter(function(ea) { return ea.superclass === klass });
        }

        function withAllSortedSubclassesDo(rootKlass, doFunc) {
          // this method iterates func on all subclasses of klass (including klass)
          // it is ensured that the klasses are sorted by a) subclass relationship and b) name (not type!)
          // func gets as parameters: 1) the class 2) index in list 3) level of inheritance
          // compared to klass (1 for direct subclasses and so on)

          function createSortedSubclassList(klass, level) {
            var list = lively.lang.chain(directSubclasses(klass))
              .sortBy(function(ea) { return ea.name.charCodeAt(0) })
              .map(function(subclass) { return createSortedSubclassList(subclass, level + 1) })
              .flatten().value();
            return [{klass: klass, level: level}].concat(list)
          }

          return createSortedSubclassList(rootKlass, 0)
            .map(function(spec, idx) { return doFunc(spec.klass, idx, spec.level) })
        }

        var subclasses = Global.classes(true).filter(function(ea) { return lively.lang.class.isSubclassOf(ea, klass); });
        var superclasses = lively.lang.class.superclasses(klass);
        var list = superclasses.map(function(kl,i ) { return makeListItem(kl, i); })
          .concat([makeListItem(klass, superclasses.length, '-->')])
          .concat(subclasses.map(function(ea) {
            var depLevel = lively.lang.class.superclasses(ea).indexOf(klass);
            var indent = superclasses.length + depLevel + 2;
            return makeListItem(ea, indent)
          }));

        //var listPane = newRealListPane(new Rectangle(0,0, 400, 400));
        //listPane.innerMorph().updateList(list);
        // w.addFramedMorph(listPane, klass.type + ' and its subclasses');
        var asText = superclasses.concat(list).pluck('string').join('\n');
        w.addCodeEditor({
            title: klass.type + ' and its subclasses', content: asText,
            textMode: 'text', tabSize: 2
        }).getWindow().comeForward();
    },

});
lively.ide.BrowserCommand.subclass('lively.ide.UnloadClassCommand', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        return this.browser.selectedNode() &&
            this.browser.selectedNode().isClassNode;
    },


    trigger: function() {
        return [['unload', this.unloadClass.bind(this, this.browser.selectedNode().target.name)]];
    },

    unloadClass: function(klassName) {
        var klass = lively.Class.forName(klassName);
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
            console.log('Doing a ' + self.menuName + (siblingNode ? ' after ' + siblingNode.asString() : ''));
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
            sibling = siblingNode && siblingNode.target;

        if (!sibling && this.browser.selectedNode() && this.browser.selectedNode().isModuleNode)
          sibling = this.browser.selectedNode().target.subElements(1).first();

        if (!sibling)
          throw new Error("file fragment command cannot find sibling for createAndAddSource()!");

        var newTarget = sibling.addSibling(src);
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

    isActive: function(pane) {
        return pane == this.targetPane;
    },

    interactiveAddTo: function(siblingNode) {
        var w = this.world(), b = this.browser, self = this;
        var className = 'MyClass'
        self.createAndAddSource(siblingNode, className, 'Object' );
        this.selectStringInSourcePane(className);
    },

    createSource: function(className, superClassName) {
        return Strings.format('%s.subclass(\'%s\',\n\'default category\', {\n%sm1: function() {},\n});\n',
            superClassName, className, this.tab);
    }

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
        return Strings.format('cop.create(%s).refineClass(%s, {\n%smethodName: function(arg1) {\n%s%svar result = cop.proceed(arg1);\n%s%sreturn result\n%s},\n});\n', layerName, className, this.tab,this.tab,this.tab,this.tab,this.tab);
    },

});

lively.ide.AddToFileFragmentCommand.subclass('lively.ide.AddMethodToFileFragmentCommand',
'properties', {
    menuName: 'add method',
    targetPane: 'Pane4',
    nodeType: 'isMemberNode',
    newMethodName: "newMethod"
},
 'command actions', {
    interactiveAddTo: function(siblingNode) {
        var methodName = this.newMethodName,
            ff = siblingNode.target,
            nextFF = ff.nextElement();
        this.createAndAddSource(siblingNode, methodName);
        this.selectStringInSourcePane(methodName);
    },

    createSource: function(methodName) {
        var comment = this.tab + this.tab + '// enter comment here'
        return Strings.format(',\n%s: function() {\n%s\n%s}',
                              this.tab + methodName, comment, this.tab);
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
            klass = lively.Class.forName(klassName);
        return lively.Class.isClass(klass) && Global.TestCase && klass.isSubclassOf(TestCase) && klass;
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
            if (!klass) {
                alert('Cannot run tests of %s, klass not found!', node);
                return;
            }
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
        return node && node.isModuleNode;
    },

    trigger: function() {
        return [['open in text editor', this.openFile.bind(this)]]
    },

    openFile: function() {
        var url = this.browser.getSelectedModule().uri()
        lively.ide.openFile(url)
    }

});

lively.ide.BrowserCommand.subclass('lively.ide.OpenVersionsOfFile', {

    wantsMenu: Functions.True,

    isActive: function(pane) {
        var node = this.browser.selectedNode();
        return node && node.isModuleNode;
    },

    trigger: function() {
        return [['show versions', this.showVersions.bind(this)]]
    },

    showVersions: function() {
        var filename = this.browser.getPane1Selection().asString(),
            url = this.browser.getTargetURL().withFilename(filename),
            path = url.relativePathFrom(URL.root);
        lively.require('lively.net.tools.Wiki').toRun(function() {
            var versionViewer = lively.BuildSpec('lively.wiki.VersionViewer').createMorph().openInWorldCenter();
            versionViewer.setPath(path);
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

lively.ide.BrowserCommand.subclass('lively.ide.DebugNextMethodCallCommand', {

    wantsMenu: Functions.True,

    getSelectedNode: function() {
        return this.browser.selectedNode();
    },

    isActive: function(pane) {
        var node = this.getSelectedNode();
        if (!node) return false;
        if (node.isMemberNode) return true;
        return false;
    },

    installDebugger: function() {
      var node = this.getSelectedNode(),
          methodName = node.target.getName(),
          implementor = lively.lookup(node.parent.target.getName()),
          ed = this.browser.getSourcePane();
      if (!implementor) { ed.showError(new Error(`Cannot find implementor of ${methodName}`)); return; }
      if (!node.target.isStatic()) implementor = implementor.prototype;
      lively.debugNextMethodCall(implementor, methodName);
      ed.setStatusMessage(`Next time ${methodName} is called a debugger will open.`)
    },

    trigger: function() {
        return [['debug next method call', this.installDebugger.bind(this)]]
    }

});

}) // end of module
