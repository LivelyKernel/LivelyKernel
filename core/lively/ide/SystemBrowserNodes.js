module('lively.ide.SystemBrowserNodes').requires('lively.ide.BrowserFramework').toRun(function() {

lively.ide.BrowserNode.subclass('lively.ide.SourceControlNode', {

    documentation: 'The root node of the SystemBrowser. Represents a URL',

    initialize: function($super, target, browser, parent) {
        $super(target, browser, parent);
        this.allFiles = [];
        this.subNamespacePaths = [];
    },

    addFile: function(file) { this.allFiles.push(file) },

    removeFile: function(file) { this.allFiles = this.allFiles.without(file) },

    locationChanged: function() {
        var url = this.browser.getTargetURL();
        this.browser.selectNothing();

        try {
            var filesAndDirs = this.target.interestingLKFileNames(url)
                                .partition(function(ea) { return ea.endsWith("/"); })
            this.allFiles = filesAndDirs[1];
            this.subNamespacePaths = filesAndDirs[0].map(function(ea) {
                return URL.codeBase.withFilename(ea); });
        } catch (e) {
            // can happen when a restored browser from a world that has been moved
            // uses a now incorrect relative URL
            this.statusMessage('Cannot get files for code browser with url '
                + url + ' error ' + e, Color.red, 6);
            // show(e.stack)
            this.allFiles = [];
            this.subNamespacePaths = [];
        }

        // FIXME remove the inconsistency of "core" files
        var isUrlRootOfRepository = this.browser.codeBaseUrlString() == String(url);
        this.parentNamespacePath = isUrlRootOfRepository ? null : url.withFilename('../');
    },

    childNodes: function() {
        // js files + OMeta files (.txt)
        //if (this._childNodes) return this._childNodes; // optimization
        var moduleNodes = [],
            nsNodes = [],
            srcDb = this.target,
            b = this.browser;

        // modules (files)
        if (this.allFiles.length == 0) this.locationChanged();
        if (!this.subNamespacePaths) this.subNamespacePaths = [];
        for (var i = 0; i < this.allFiles.length; i++) {
            var fn = this.allFiles[i];
            if (fn.endsWith('.js')) {
                moduleNodes.push(new lively.ide.CompleteFileFragmentNode(
                    srcDb.rootFragmentForModule(fn), b, this, fn));
            } else if (fn.endsWith('.ometa')) {
                moduleNodes.push(new lively.ide.CompleteOmetaFragmentNode(
                    srcDb.rootFragmentForModule(fn), b, this, fn));
            } else if (fn.endsWith('.css')) {
                moduleNodes.push(new lively.ide.CompleteCSSFragmentNode(
                    srcDb.rootFragmentForModule(fn), b, this, fn));
            } else if (fn.match(/\.(tm)?snippets$/)) {
                moduleNodes.push(new lively.ide.CompleteSnippet(
                    srcDb.rootFragmentForModule(fn), b, this, fn));
            }
        };
        moduleNodes = moduleNodes.sortBy(function(node) { return node.asString().toLowerCase() });

        // namespace nodes
        nsNodes.pushAll(this.subNamespacePaths.map(function(relativePath) {
            return new lively.ide.NamespaceNode(relativePath, b, this); }, this));
        nsNodes = nsNodes.sortBy(function(node) { return node.asString() });
        if (this.parentNamespacePath) {
            nsNodes.push(new lively.ide.NamespaceNode(this.parentNamespacePath, b, this));
        }
        return this._childNodes = nsNodes.concat(moduleNodes);
    }
});

lively.ide.BrowserNode.subclass('lively.ide.FileFragmentNode', {

    doNotSerialize: ['savedSource'],

    toString: function() {
        return this.constructor.name + '<' + this.getName() + '>'
    },

    getName: function() { // not unique!
        return this.target.name || this.sourceString().truncate(22).replace('\n', '') + '(' + this.type + ')';
    },

    sourceString: function() {
        if (!this.target)
            return 'entity not loaded';
        this.savedSource = this.target.getSourceCode();
        return this.savedSource;
    },

    asString: function() {
        var name = this.getName();
        if (this.showLines()) name += ' (' + this.target.startLine() + '-' + this.target.stopLine() + ')';
        return name;
    },

    showLines: function() {
        return this.browser.showLines;
    },

    saveSource: function($super, newSource, sourceControl) {
        lively.ide.enableDebugFileParsing(this.browser.debugMode);
        this.target.putSourceCode(newSource);
        this.savedSource = this.target.getSourceCode(); // assume that users sees newSource after that
        lively.ide.enableDebugFileParsing(false);
        return true;
    },

    menuSpec: function($super) {
        var spec = $super(), node = this;

        spec.push(['add sibling below', function() {
            node.browser.ensureSourceNotAccidentlyDeleted(function() {
                var world = lively.morphic.World.current();
                world.prompt('Enter source code', function(input) {
                    if (input == null) return;
                    node.target.addSibling(input);
                    node.browser.allChanged();
                });
            });
        }]);

        spec.push(['remove', function() {
            node.browser.ensureSourceNotAccidentlyDeleted(function() {
                var prevDefinitions = node.getDefinitions();
                node.target.remove();
                node.cleanupSource(prevDefinitions, []);
                node.browser.allChanged();
            });
        }]);


        spec.push(['show browse ref', function() {
            var world = lively.morphic.World.current(),
                path = node.target.getOwnerNamePath();
            if (!path || path.length === 0) return;
            var browseDoit = Strings.format("$world.browseCode(%s, %s, %s);",
                                            path[1] ? Strings.print(path[1]) : 'null',
                                            path[2] ? Strings.print(path[2]) : 'null',
                                            Strings.print(module(path[0]).name()));
            var text = world.addTextWindow({title: "browse it!", content: browseDoit});
            text.emphasizeAll({doit: {code: browseDoit}});
        }]);

        return spec;
    },

    getSourceControl: function() {
        if (this.target.getSourceControl)
            return this.target.getSourceControl();
        return lively.ide.SourceControl;
    },

    onDrop: function(other) {
        if (!other) return;
        console.log(' Moving ' + this.target + ' to ' + other.target);
        if (!other.handleDrop(this))
            this.target.moveTo(other.target.stopIndex+1);
        this.signalChange();
    },

    onDrag: function() {
        // onDrop does all the work
    },

});

lively.ide.BrowserNode.subclass('lively.ide.NamespaceNode',
'documentation', {
    documentation: 'Has as its target a relative path to a subnamespace like lively/ast/. Sets new browser location on activation.'
},
'initialization', {
    nameExtractor: /\/?([^\/]+)\/$/,

    initialize: function($super, target, browser, parent) {
        $super(target, browser, parent);
        this.setLocalName();
    },

    setLocalName: function() {
        this.localName = this.target.filename();
    },
},
'default', {
    asString: function() { return this.localName },

    completeURL: function() { return new URL(this.target) },

    onSelect: function($super) {
        $super();
        this.browser.setTargetURL(this.completeURL())
    },
});

lively.ide.FileFragmentNode.subclass('lively.ide.MultiFileFragmentsNode', {

    initialize: function($super, target, browser, parent) {
        $super(target, browser, parent)
        this.targets = [target];
    },

    sourceString: function() {
        throw new Error('Subclass responsibility')
    },

    newSource: function(newSource) {
        // throw new Error('Not yet implemented')
    },

    evalSource: function(newSource) {
        return false;
    },

    saveSource: function($super, newSource, sourceControl) {
        // throw new Error('Not yet implemented')
    },

    menuSpec: function($super) {
        return [];
    },

    onDrop: function(other) {
        throw new Error('Not yet implemented')
    },

    onDrag: function() {
        // onDrop does all the work
    },

});

lively.ide.FileFragmentNode.subclass('lively.ide.CompleteFileFragmentNode', // should be module file node
'testing', {
    isModuleNode: true
},
'settings', {
    maxStringLength: 10000
},
'initializing', {
    initialize: function($super, target, browser, parent, moduleName) {
        $super(target, browser, parent);
        this.moduleName = moduleName;
        this.showAll = false;
    }
},
'accessing', {
    childNodes: function() {
        var acceptedTypes = ['klassDef', 'klassExtensionDef', 'functionDef', 'objectDef',
                             'copDef', 'traitDef', 'buildspecDef' /*,'propertyDef'*/],
            browser = this.browser,
            completeFileFragment = this.target;
        if (!completeFileFragment) return [];

        function typeToClass(type) {
            if (type === 'klassDef' || type === 'klassExtensionDef')
                return lively.ide.CategorizedClassFragmentNode;
            if (type === 'functionDef')
                return lively.ide.FunctionFragmentNode;
            if (type === 'copDef')
                return lively.ide.CopFragmentNode;
            if (type === 'traitDef')
                return lively.ide.TraitFragmentNode;
            if (type === 'buildspecDef')
                return lively.ide.BuildSpecFragmentNode;
            return lively.ide.ObjectFragmentNode;
        }
        var self = this;
        return this.target.subElements(2)
            .select(function(ea) { return acceptedTypes.include(ea.type) })
            .collect(function(ff) { return new (typeToClass(ff.type))(ff, browser, self) });
    },

    sourceString: function($super) {
        this.loadModule();
        return this.target.getFileString();
    },

    getSourceCodeMode: function() {
        var node = this.browser.selectedNode();
        if (!node) return 'text';
        var ff = node.target;
        var fileName = ff.getFileName && ff.getFileName();
        !fileName && (fileName = ff.fileName);
        if (!fileName) return 'text';
        if (fileName.match(/\.js$/)) return 'javascript';
        return 'text';
    }

},
'conversion', {

    asString: function() {
        var name = this.moduleName;
        name = name.substring(name.lastIndexOf('/') + 1, name.length);
        if (!this.target) return name + ' (not parsed)';
        if (!this.showLines()) return name;
        return name + ' (' + this.target.startLine() + '-' + this.target.stopLine() + ')';
    },

    url: function() {
        return URL.codeBase.withFilename(this.moduleName);
    },

    realModuleName: function() {
        return this.url().asModuleName();
    }

},
'loading', {
    loadModule: function() {
        if (this.target) return;
        this.target = lively.ide.SourceControl.addModule(this.moduleName).ast();
        this.signalChange();
    },

    reparse: function() {
        lively.ide.enableDebugFileParsing(this.browser.debugMode);
        this.getSourceControl().reparseModule(this.moduleName, true);
        this.signalChange();
        lively.ide.enableDebugFileParsing(false);
    }
},
'consistency', {
    checkForRedundantClassDefinitions: function() {
        var childNodes = this.childNodes();

        var klassDefs = childNodes
            .select(function(node) { return node.target && !node.target.getSourceCode().startsWith('Object.extend') && (node.target.type == 'klassDef' || node.target.type == 'klassExtensionDef') })
            .pluck('target');

        var multiple = klassDefs.inject([], function(multiple, klassDef) {
            var moreThanOnce = klassDefs.any(function(otherKlassDef) {
                return klassDef !== otherKlassDef && klassDef.name == otherKlassDef.name;
            });
            if (moreThanOnce) multiple.push(klassDef);
            return multiple;
        });

        if (multiple.length == 0) return;

        var msg = 'Warning! Multiple klass definitions in module ' + this.moduleName +':';
        multiple.forEach(function(klassDef) { msg += '\n\t' + klassDef });

        lively.morphic.World.current().setStatusMessage(msg, Color.blue)
    },
},
'menu', {
    menuSpec: function($super) {
        var menu = [];
        if (!this.target) return menu;
        var browser = this.browser, node = this;

        menu.unshift(['reparse', this.reparse.bind(this) ]);

        menu.unshift(['remove', function() {
            $world.confirm("Do you really want to delete " + node.moduleName, function(bool) {
                if (bool) {
                   browser.sourceDatabase().removeFile(node.moduleName);
                   browser.rootNode().removeFile(node.moduleName);
                   browser.allChanged()
                }
            })
        }]);

        var world = lively.morphic.World.current(),
            moduleName = lively.ide.ModuleWrapper.forFile(node.moduleName).moduleName(),
            hasWorldRequirement = world.hasWorldRequirement(moduleName),
            entryName = (hasWorldRequirement ? 'remove from' : 'add to') + ' world requirements';

        menu.unshift([entryName, function() {
            if (hasWorldRequirement) {
                world.removeWorldRequirement(moduleName)
                alertOK(moduleName + ' removed from local requirements');
            } else {
                world.addWorldRequirement(moduleName);
                module(moduleName).load()
                alertOK(moduleName + ' added to local requirements');
            }
        }]);

        return menu;
    }
},
'selection', {
    onSelect: function($super) {
        this.browser.currentModuleName = this.target.name;
        $super();
    }
},
'evaluation', {
    evalSource: function(newSource) {
        if (!this.browser.evaluate) return false;
        var url = this.url().toString();
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                eval.call(Global, newSource + "\n//# sourceURL=" + url);
            } catch (er) {
                console.log("error evaluating module:" + er);
                throw(er);
            }
        });
        console.log('Successfully evaluated module');
        return true;
    }
});

lively.ide.CompleteFileFragmentNode.subclass('lively.ide.CompleteOmetaFragmentNode', {

    menuSpec: function($super) {
        var menu = $super(), fileName = this.moduleName, browser = this.browser;
        if (!this.target) return menu;
        var world = lively.morphic.World.current();
        menu.unshift(['Translate grammar', function() {
            world.prompt(
                'File name of translated grammar?',
                function(input) {
                    if (!input.endsWith('.js')) input += '.js';
                    world.prompt(
                        'Additional requirements (comma separated)?',
                        function(requirementsString) {
                            var requirements = requirementsString ? requirementsString.split(',') : null,
                                source = lively.ide.ModuleWrapper.forFile(fileName).getSource(),
                                compiled = OMetaSupport.translate(source, requirements, input),
                                targetFile = lively.ide.ModuleWrapper.forFile(input);
                            targetFile.setSource(compiled, true);
                            alertOK('... written to ' + targetFile.fileName());
                            browser.updateFileList();
                            browser.selectNodeNamed(targetFile.fileName().match('[^/]*$'));
                            browser.allChanged();
                        });
                },
                fileName.replace(/^\.\.\//, '').replace(/\.[^.]+$/, '.js')
            ) }]);
            return menu;
    },

    childNodes: function() {
        var fileDef = this.target;
        if (!fileDef) return [];
        var browser = this.browser;
        var ometaNodes = fileDef.subElements()
            .select(function(ea) { return ea.type === 'ometaDef'})
            .collect(function(ea) { return new lively.ide.OMetaGrammarNode(ea, browser, this) });
/***/
ometaNodes.forEach(function(ea) { console.log(ea.target.name) });
/***/
        var rest = fileDef.subElements()
            .select(function(ea) { return !fileDef.subElements().include(ea) })
            .collect(function(ea) { return new lively.ide.ObjectFragmentNode(ea, browser, this) });
        return ometaNodes.concat(rest);
    },

    evalSource: function(newSource) {
        var def = OMetaSupport.translateToJs(newSource);
        if (!def) throw(dbgOn(new Error('Cannot translate!')));
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                eval(def);
            } catch (er) {
                console.log("error evaluating: " + er);
                throw(er)
            }
        });
        console.log('Successfully evaluated OMeta definition');
        return true;
    },

    onSelect: function($super) { this.browser.currentModuleName = null; $super(); },

    getSourceCodeMode: function() { return 'text'; }
});

lively.ide.FileFragmentNode.subclass('lively.ide.OMetaGrammarNode', {

    isGrammarNode: true,

    childNodes: function() {
        var def = this.target;
        var browser = this.browser;
        return this.target.subElements()
            .collect(function(ea) { return new lively.ide.OMetaRuleNode(ea, browser, this) });
    },

    evalSource: lively.ide.CompleteOmetaFragmentNode.prototype.evalSource,

    getSourceCodeMode: function() { return 'text'; }
});

lively.ide.FileFragmentNode.subclass('lively.ide.OMetaRuleNode', {

    isMemberNode: true,

    evalSource: function(newSource) {
        var def = this.target.buildNewFileString(newSource);
        lively.ide.CompleteOmetaFragmentNode.prototype.evalSource.call(this, def);
        return true;
    },

    getSourceCodeMode: function() { return 'text'; }
});

lively.ide.FileFragmentNode.subclass('lively.ide.CategorizedClassFragmentNode', {

    isClassNode: true,

    getName: function($super) {
        return $super().split('.').last() + (this.target.type == 'klassExtensionDef' ? ' (extension)' : '')
    },

    childNodes: function() {
        var classFragment = this.target, browser = this.browser, self = this;

        // gather methods and create category nodes

        if (classFragment.categories) {
            var categoryNodes = classFragment.categories.collect(function(ff) {
                return new lively.ide.MethodCategoryFragmentNode(ff, browser, self);
            });
            categoryNodes.unshift(new lively.ide.AllMethodCategoryFragmentNode(classFragment, browser, self));
            return categoryNodes;
        }
        return this.target.subElements().collect(function(ea) {
            return new lively.ide.ClassElemFragmentNode(ea, browser, this);
        }, this);

    },

    menuSpec: function($super) {
        var menu = $super();
        var fragment = this.target;
        var index = fragment.name ? fragment.name.lastIndexOf('.') : -1;
        // don't search for complete namespace name, just its last part
        var searchName = index === -1 ? fragment.name : fragment.name.substring(index+1);
        menu.unshift(['references', function() {
            var list = lively.ide.SourceControl
                .searchFor(searchName)
                .without(fragment)
            var title = 'references of' + fragment.name;
            new ChangeList(title, null, list, searchName).openIn(lively.morphic.World.current()) }]);
        return menu;
    },

    handleDrop: function(nodeDroppedOntoMe) {
        if (!(nodeDroppedOntoMe instanceof lively.ide.ClassElemFragmentNode))
            return false;
        if (this.target.subElements().length == 0) {
            this.statusMessage('FIXME: adding nodes to empty classes!', Color.red);
            return false;
        }
        this.statusMessage('Adding ' + nodeDroppedOntoMe.asString() +
                           ' to ' + this.asString() + ' and removing original', Color.green);
        var source = nodeDroppedOntoMe.target.getSourceCode();
        nodeDroppedOntoMe.target.remove();
        this.target.subElements().last().addSibling(source);

        return true;
    },

    evalSource: function(newSource) {
        if (!this.browser.evaluate) return false;
        var sourceName = this.browser.selectedNode().getName();
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                eval.call(Global, newSource + "\n//# sourceURL=" + sourceName);
            } catch (er) {
                console.log("error evaluating class:" + er);
                throw(er)
            }
        });
        console.log('Successfully evaluated class');
        return true;
    },

    onSelect: function($super) {
        $super();
        var paneName = this.browser.paneNameOfNode(this),
            idx = Number(paneName[paneName.length-1]),
            nextPane = 'Pane' + (idx + 1);
        this.browser.inPaneSelectNodeNamed(nextPane, '-- all --');
    },

});

lively.ide.MultiFileFragmentsNode.subclass('lively.ide.MethodCategoryFragmentNode', {

    isCategoryNode: true,

    getName: function() { return this.target.getName() },

    sourceString: lively.ide.FileFragmentNode.prototype.sourceString, // FIXME

    newSource: function(newSource) {
        this.statusMessage('not yet supported, sorry', Color.red);
    },

    childNodes: function() {
        var browser = this.browser;
        return this.target.subElements().collect(function(ea) { return new lively.ide.ClassElemFragmentNode(ea, browser, this) }, this);
    },

    handleDrop: function(nodeDroppedOntoMe) {
        if (!(nodeDroppedOntoMe instanceof lively.ide.ClassElemFragmentNode)) return false;

        if (this.target.subElements().length == 0) { // FIXME also empty categories should work!!!
            this.statusMessage('Adding to empty categories not yet supported, sorry', Color.red);
            return
        }

        this.statusMessage('Adding ' + nodeDroppedOntoMe.asString() + ' to ' + this.asString() + ' and removing original', Color.green);
        var source = nodeDroppedOntoMe.target.getSourceCode();
        nodeDroppedOntoMe.target.remove();
        this.target.subElements().last().addSibling(source);

        return true;
    },

    mergeFileFragment: function(fileFragment) {
        if (fileFragment.type != 'propertyDef') return false;
        if (fileFragment.category != this.target.category) return false;
        if (this.targets.include(fileFragment)) return false;
        this.targets.push(fileFragment);
        return true
    },

});

lively.ide.FileFragmentNode.subclass('lively.ide.AllMethodCategoryFragmentNode',
'accessing', {
    getName: function() { return '-- all --' },
    childNodes: function() {
        var classFragment = this.target;
        var browser = this.browser;
        return classFragment.subElements()
            .select(function(ea) { return ea.type === 'propertyDef' })
            .collect(function(ea) { return new lively.ide.ClassElemFragmentNode(ea, browser, this) }, this);
    },
},
'evaluating', {
    evalSource: lively.ide.CategorizedClassFragmentNode.prototype.evalSource,
},
'dragging & droppping', {
    handleDrop: function(nodeDroppedOntoMe) {
        return false;
        // do nothing
    },
},
'testing', {
    isClassNode: true
});

lively.ide.FileFragmentNode.subclass('lively.ide.ObjectFragmentNode', {

    isObjectNode: true,

    asString: function($super) {
        return $super() + ' (object)'
    },

    childNodes: function() {
        if (!this.target.subElements()) return [];
        // FIXME duplication with ClassFragmentNode
        var obj = this.target;
        var browser = this.browser;
        return obj.subElements()
            .select(function(ea) { return ea.type === 'propertyDef' })
            // .sort(function(a,b) { if (!a.name || !b.name) return -999; return a.name.charCodeAt(0)-b.name.charCodeAt(0) })
            .collect(function(ea) { return new lively.ide.ClassElemFragmentNode(ea, browser, this) });
    },

    menuSpec: lively.ide.CategorizedClassFragmentNode.prototype.menuSpec, // FIXME

})

lively.ide.FileFragmentNode.subclass('lively.ide.ClassElemFragmentNode', {

    isMemberNode: true,

    menuSpec: function($super) {
        var menu = $super();
        var fragment = this.target;
        var searchName = fragment.name;
        return [
            ['senders', function() {
                lively.morphic.World.current().openMethodFinderFor(searchName, '__sender'); }],
            ['implementors', function() {
                lively.morphic.World.current().openMethodFinderFor(searchName, '__implementor'); }]
        ].concat(menu);
    },

    sourceString: function($super) {
        var src = $super();
        var view = this.browser.viewAs;
        if (!view) {
            return src;
        }
        if (view !== 'javascript') {
            throw new Error('unknown source view');
        }
        return src;
    },
    saveSource: function($super, newSource, sourceControl) {
        // saves the source code of an object method or property.
        // in case that the property name changes we offer to either add it as
        // a new property or modify the old.

        // save the old values for later access, $super modifies this.target heavily
        var self = this, target = this.target,
            propertyName = target.name,
            pType = target.type,
            oldS = target.getSourceCode(),
            success = $super(newSource, sourceControl)

        if (!success || pType !== this.target.type
         || pType !== "propertyDef"
         || this.target.name === propertyName
         || propertyName === lively.ide.AddMethodToFileFragmentCommand.prototype.newMethodName)
            return success;

        function saveOld(rename) {
            if (rename) return;
            var sibling = target.addSibling(oldS);
            try {
                (new lively.ide.ClassElemFragmentNode(sibling, browser, self.parent))
                    .evalSource(oldS);
            } catch(e){ browser.setStatusMessage(e, Color.red); }
            browser.allChanged();
        }

        var browser = this.browser,
            preserve = lively.Config.get("propertyPreservation", true);
        // The method has to be readded after it was removed, therefore the delay.
        if (preserve === undefined) $world.confirm("You changed the name of the method / property.\n"
                              + "Do you want to add the current code as a new method / property\n"
                              + "or rename the original method / property?", saveOld, ['Add as new', 'Rename']);
        else saveOld.delay(0, !preserve);
    },



    evalSource: function(newSource) {
        if (!this.browser.evaluate) return false;
        var ownerName = this.target.className || this.target.findOwnerFragment().name;
        if (!lively.Class.forName(ownerName)) {
            console.log('Didn\'t find class/object');
            return false
        }
        var methodName = this.target.name;
        var methodString = this.target.getSourceCode();
        var layerCommand = this.target.isStatic() ? 'layerObject' : 'layerClass';
        var def;
        if (this.target.layerName) {
            def = Strings.format('%s(%s, %s, {\n\t%s})',
                layerCommand, this.target.layerName, this.target.className, this.target.getSourceCode());
        } if (this.target.isStatic()) {
            def = 'Object.extend(' + ownerName + ', {\n' + methodString +'\n});';
        } else {
            def = ownerName + ".addMethods({\n" + methodString +'\n});';
        }

        var sourceName = this.browser.selectedNode().getName();
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                console.log('Going to eval ' + def);
                eval.call(Global, def + "\n//# sourceURL=" + sourceName);
                eval(def);
            } catch (er) {
                console.log("error evaluating method " + methodString + ': ' + er);
                throw(er)
            }
        });
        console.log('Successfully evaluated #' + methodName);
        return true;
    },

    getDefinitions: function() {
        var targetClassName = this.target.className || this.target.findOwnerFragment().name,
            targetName = this.target.name;
        return [targetClassName + '#' + targetName];
    },

    asString: function($super) {
        var string = $super();
        if (this.target.isStatic instanceof Function)
            string +=  this.target.isStatic() ? ' (static)' : ' (proto)';
        return string;
    },

    getSourceCodeMode: function() { return 'javascript:LabeledStatement'; }
});

lively.ide.FileFragmentNode.subclass('lively.ide.FunctionFragmentNode', {

    isFunctionNode: true,

    asString: function($super) { return $super() + ' (function)' },

    menuSpec: lively.ide.ClassElemFragmentNode.prototype.menuSpec, // FIXME

});

lively.ide.FileFragmentNode.subclass('lively.ide.CopFragmentNode', {

    isClassNode: true,

    childNodes: function() {
        return this.target.subElements().collect(function(fileFragment) {
            return new lively.ide.CopRefineFragmentNode(fileFragment, this.browser, this.target)
        }, this);
    },

    evalSource: function(newSource) {
        if (!this.browser.evaluate) return false;
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                eval(newSource);
            } catch (er) {
                console.log("error evaluating layer:" + er);
                throw(er)
            }
        });
        console.log('Successfully evaluated layer');
        return true;
    },

});

lively.ide.FileFragmentNode.subclass('lively.ide.CopRefineFragmentNode', {

    childNodes: function() {
        return this.target.subElements().collect(function(fileFragment) {
            return new lively.ide.CopMemberFragmentNode(fileFragment, this.browser, this)
        }, this);
    },

    evalSource: function(newSource) {
        var source = Strings.format('cop.create("%s")%s', this.parent.getName(), newSource);
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                eval(source);
            } catch (er) {
                this.statusMessage('Could not eval ' + this.asString() + ' because ' + e, Color.red, 5)
            }
        }.bind(this));
        this.statusMessage('Successfully evaled ' + this.asString(), Color.green, 3)
        return true;
    }

});

lively.ide.FileFragmentNode.subclass('lively.ide.CopMemberFragmentNode', {

    isMemberNode: true,

    evalSource: function(newSource) {
        this.parent.evalSource(this.parent.sourceString());
        return true;
    },

    getSourceCodeMode: function() { return 'javascript:LabeledStatement'; }
});

lively.ide.FileFragmentNode.subclass('lively.ide.TraitFragmentNode', {

    isClassNode: true,

    childNodes: function() {
        return this.target.subElements().collect(function(fileFragment) {
            return new lively.ide.TraitElemFragmentNode(fileFragment, this.browser, this)
        }, this);
     },

    evalSource: function(newSource) {
        this.browser.withCurrentModuleActiveDo(function() {
            try {
                eval(newSource);
            } catch (er) {
                console.warn("error evaluating Trait:" + er);
                throw(er)
            }
        });
        console.log('Successfully evaluated layer');
        return true;
    },

});

lively.ide.FileFragmentNode.subclass('lively.ide.TraitElemFragmentNode', {

    isMemberNode: true,

    evalSource: function(newSource) {
        this.parent.evalSource(this.parent.sourceString());
        return true;
    },

    getSourceCodeMode: function() { return 'javascript:LabeledStatement'; }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// CSS support
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
lively.ide.CompleteFileFragmentNode.subclass('lively.ide.CompleteCSSFragmentNode', {

    menuSpec: function($super) { return []; },

    childNodes: function() { return []; },

    evalSource: function(newSource) { return false; },

    getSourceCodeMode: function() { return 'css'; },

    onSelect: function($super) { this.browser.currentModuleName = null; $super(); }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// Snippets for the CodeEditor, TextMate style
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
lively.ide.CompleteFileFragmentNode.subclass('lively.ide.CompleteSnippet', {

    menuSpec: function($super) {
        var menu = [];

        // if (!this.target) return menu;
        var browser = this.browser, node = this;

        menu.unshift(['reparse', this.reparse.bind(this) ]);

        menu.unshift(['remove', function() {
            $world.confirm("Do you really want to delete " + node.moduleName, function(bool) {
                if (bool) {
                   browser.sourceDatabase().removeFile(node.moduleName);
                   browser.rootNode().removeFile(node.moduleName);
                   browser.allChanged()
                }
            })
        }]);

        return menu;
    },

    childNodes: function() { return []; },

    evalSource: function(newSource) {
        var url = this.target.fileURL();
        if (!url) {
            this.statusMessage('Cannot parse snippet rules, found no url for ' + this.target, Color.red, 6); return false; }
        var snippets = lively.morphic.CodeEditor.snippets;
        if (!snippets) {
            this.statusMessage('Cannot parse snippet rules, found no snippet handler', Color.red, 6); return false; }
        try {
            snippets.readSnippetsFromURL(url);
        } catch(e) {
            show(e);
            this.statusMessage('Error parsing snippets:\n' + e, Color.red, 6);
            return false;
        }
        return true;
    },

    getSourceCodeMode: function(attribute) { return 'snippets'; },

    onSelect: function($super) {
        this.browser.currentModuleName = null;
        $super();
    }
});

lively.ide.FileFragmentNode.subclass('lively.ide.BuildSpecFragmentNode', {
    isClassNode: true,
    childNodes: function() { return []; },
    evalSource: function(newSource) {
        this.browser.withCurrentModuleActiveDo(function() {
            try { eval(newSource); } catch (er) {
                console.warn("error evaluating BuildSpec:" + er);
                throw(er);
            }
        });
        return true;
    }
});

}) // end of module
