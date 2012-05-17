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
        this.browser.selectNothing();
        var url = this.browser.getTargetURL();
        try {            
            this.allFiles = this.target.interestingLKFileNames(url);
        } catch(e) {
            // can happen when browser in a serialized world that 
            // is moved tries to relativize a URL
            this.statusMessage('Cannot get files for code browser with url ' 
                + url + ' error ' + e, Color.red, 6)
            this.allFiles = [];
        }

        this.parentNamespacePath = url.withFilename('../');
        this.subNamespacePaths = this.pathsToSubNamespaces(url);
    },
    pathsToSubNamespaces: function(url) {
        var webR = webR = new WebResource(url).beSync(),
            dirs = webR.getSubElements().subCollections;
            paths = dirs.collect(function(ea) { return ea.getURL() });
        return paths;
    },

    
    childNodes: function() {
        // js files + OMeta files (.txt) + lkml files + ChangeSet current
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
            } else if (fn.endsWith('.lkml')) {
                moduleNodes.push(new lively.ide.ChangeSetNode(
                    ChangeSet.fromFile(fn, srcDb.getCachedText(fn)), b, this));
            } 
        };
        moduleNodes = moduleNodes.sortBy(function(node) { return node.asString().toLowerCase() });

        // namespace nodes        
        for (var i = 0; i < this.subNamespacePaths.length; i++) {
            var relativePath = this.subNamespacePaths[i];
            nsNodes.push(new lively.ide.NamespaceNode(relativePath, b, this));
        }
        nsNodes = nsNodes.sortBy(function(node) { return node.asString() });
        if (this.parentNamespacePath)
            nsNodes.push(new lively.ide.NamespaceNode(this.parentNamespacePath, b, this));

        // add local changes
        var nodes = nsNodes;
        nodes = nodes.concat(moduleNodes);
        nodes.push(ChangeSet.current().asNode(b));

        this._childNodes = nodes;

        return nodes;
    },
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
        this.target.debugMode = this.browser.debugMode
        this.target.putSourceCode(newSource);
        this.savedSource = this.target.getSourceCode(); // assume that users sees newSource after that
        return true;
    },

    menuSpec: function($super) {
        var spec = $super();
        var node = this;
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
                node.target.remove();
                node.browser.allChanged()
            });
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
    documentation: 'Has as its target a relative path to a subnamespace like lively/AST/. Sets new browser location on activation.'
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

    onSelect: function() {
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
    isModuleNode: true,
},
'settings', {
    maxStringLength: 10000,
},
'initializing', {
    initialize: function($super, target, browser, parent, moduleName) {
        $super(target, browser, parent);
        this.moduleName = moduleName;
        this.showAll = false;
    },
},
'accssing', { 
    childNodes: function() {
        var acceptedTypes = ['klassDef', 'klassExtensionDef', 'functionDef', 'objectDef', 'copDef', 'traitDef', /*'propertyDef'*/];
        var browser = this.browser;
        var completeFileFragment = this.target;
        if (!completeFileFragment) return [];

        var typeToClass = function(type) {
            if (type === 'klassDef' || type === 'klassExtensionDef')
                return lively.ide.CategorizedClassFragmentNode;
            if (type === 'functionDef')
                return lively.ide.FunctionFragmentNode;
            if (type === 'copDef')
                return lively.ide.CopFragmentNode;
            if (type === 'traitDef')
                return lively.ide.TraitFragmentNode;
            return lively.ide.ObjectFragmentNode;
        }
        return this.target.subElements(2)
            .select(function(ea) { return acceptedTypes.include(ea.type) })
            .collect(function(ff) { return new (typeToClass(ff.type))(ff, browser) });

    },
     
    sourceString: function($super) {
        this.loadModule();
        var src = this.target.getFileString();
        if (Config.isNewMorphic) return src;
        return !this.showAll && src.length > this.maxStringLength ? '' : src;
    },
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
    },


},
'loading', {
    loadModule: function() {
        if (this.target) return;
        this.target = lively.ide.SourceControl.addModule(this.moduleName).ast();
        this.signalChange();
    },
    reparse: function() {
         this.getSourceControl().reparseModule(this.moduleName, true);
         this.signalChange();
    },
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

        // menu.unshift(['check for redundant klass definitions', function() {
            // node.checkForRedundantClassDefinitions()
        // }]);

        var moduleName = lively.ide.ModuleWrapper.forFile(node.moduleName).moduleName(),
            cs = ChangeSet.current(),
            hasWorldRequirement = cs.hasWorldRequirement(moduleName),
            entryName = (hasWorldRequirement ? 'Remove from' : 'Add to') + ' world requirements';
        
        menu.unshift([entryName, function() {
            if (hasWorldRequirement) {
                cs.removeWorldRequirement(moduleName)
                alertOK(moduleName + ' removed from local requirements');
            } else {
                cs.addWorldRequirement(moduleName);
                module(moduleName).load()
                alertOK(moduleName + ' added to local requirements');
            }
        }]);

        return menu;
    }    
},
'selection', {
    onSelect: function() { this.browser.currentModuleName = this.target.name },
});

lively.ide.CompleteFileFragmentNode.subclass('lively.ide.CompleteOmetaFragmentNode', {

    menuSpec: function($super) {
        var menu = $super();
        var fileName = this.moduleName;
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
                            var requirments = requirementsString ? requirementsString.split(',') : null;
                            OMetaSupport.translateAndWrite(fileName, input, requirments) }
                    );    
                },
                fileName.slice(0, fileName.indexOf('.'))
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
        try {
            eval(def);
        } catch (er) {
            console.log("error evaluating: " + er);
            throw(er)
        }
        console.log('Successfully evaluated OMeta definition');
        return true;
    },
    onSelect: function() { this.browser.currentModuleName = null },
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

});

lively.ide.FileFragmentNode.subclass('lively.ide.OMetaRuleNode', {

    isMemberNode: true,

    evalSource: function(newSource) {
        var def = this.target.buildNewFileString(newSource);
        lively.ide.CompleteOmetaFragmentNode.prototype.evalSource(def);
        return true;
    },

});

lively.ide.FileFragmentNode.subclass('lively.ide.CategorizedClassFragmentNode', {
 
    isClassNode: true,

    getName: function($super) {
        return $super() + (this.target.type == 'klassExtensionDef' ? ' (extension)' : '')
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
        // menu.unshift(['add to current ChangeSet', function() {
        //     lively.morphic.World.current().confirm('Add methods?', function(addMethods) {
        //         var cs = ChangeSet.current();
        //         var classChange = new 
        //     });
        // }]);
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
            return
        }
        this.statusMessage('Adding ' + nodeDroppedOntoMe.asString() + ' to ' + this.asString() + ' and removing original', Color.green);
        var source = nodeDroppedOntoMe.target.getSourceCode();
        nodeDroppedOntoMe.target.remove();
        this.target.subElements().last().addSibling(source);
        
        return true;
    },

    evalSource: function(newSource) {
            if (!this.browser.evaluate) return false;
        try {
            var currentModule, moduleName = this.browser.currentModuleName;
            if (moduleName && !moduleName.include('undefined'))
                currentModule = module(moduleName);
            currentModule && currentModule.activate();
            eval(newSource);
        } catch (er) {
            console.log("error evaluating class:" + er);
            throw(er)
        } finally {
            currentModule && currentModule.deactivate();
        }
        console.log('Successfully evaluated class');
        return true;
    },

    onSelect: function() {
        var paneName = this.browser.paneNameOfNode(this),
            idx = Number(paneName[paneName.length-1]),
            nextPane = 'Pane' + (idx + 1);
        this.browser.inPaneSelectNodeNamed(nextPane, '-- all --');
        setTimeout((function() {
            this.browser.inPaneSelectNodeNamed(nextPane, '-- all --')
        }).bind(this), 200);
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
    isClassNode: true,
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
                    var list = lively.ide.SourceControl
                        .searchFor(searchName)
                        .select(function(ea) {
                            if (!ea.name || !ea.name.include(searchName)) return true;
                            var src = ea.getSourceCodeWithoutSubElements();
                            return src.indexOf(searchName) !== src.lastIndexOf(searchName)
                    }); // we don't want pure implementors, but implementors which are also senders should appear
                    var title = 'senders of' + searchName;
                    new ChangeList(title, null, list, searchName).openIn(lively.morphic.World.current()) }],
            ['implementors', function() {
                    var list = lively.ide.SourceControl
                        .searchFor(searchName)
                        .without(fragment)
                        .select(function(ea) { return ea.name === searchName });
                    var title = 'implementers of' + searchName;
                    new ChangeList(title, null, list, searchName).openIn(lively.morphic.World.current()) }]
        ].concat(menu);
    },

    sourceString: function($super) {
        var src = $super();
        var view = this.browser.viewAs;
        if (!view) {
            return src;
        }
        if (view != 'javascript') {
            return 'unknown source view';
        }
        return result;
    },
    
    evalSource: function(newSource) {
        if (!this.browser.evaluate) return false;
        var ownerName = this.target.className || this.target.findOwnerFragment().name;
        if (!Class.forName(ownerName)) {
            console.log('Didn\'t found class/object');
            return false
        }
        var methodName = this.target.name;
        var methodString = this.target.getSourceCode();
        var layerCommand = this.target.isStatic() ? 'layerObject' : 'layerClass';
        var def;
        if (this.target.layerName) {
            def = Strings.format('%s(%s, %s, {\n\t%s})',
                layerCommand, this.target.layerName, this.target.className, this.target.getSourceCode());
            console.log('Going to eval ' + def);
        } if (this.target.isStatic()) {
            def = 'Object.extend(' + ownerName + ', {\n' + methodString +'\n});';
        } else {
            def = ownerName + ".addMethods({\n" + methodString +'\n});';
        }
        try {
            eval(def);
        } catch (er) {
            console.log("error evaluating method " + methodString + ': ' + er);
            throw(er)
        }
        console.log('Successfully evaluated #' + methodName);
        return true;
    },

    asString: function($super) {
        var string = $super();
        if (this.target.isStatic instanceof Function)
            string +=  this.target.isStatic() ? ' (static)' : ' (proto)';
        return string;
    },
    
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
        try {
            eval(newSource);
        } catch (er) {
            console.log("error evaluating layer:" + er);
            throw(er)
        }
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
        try {
            eval(source);
        } catch (er) {
            this.statusMessage('Could not eval ' + this.asString() + ' because ' + e, Color.red, 5)
        }
        this.statusMessage('Successfully evaled ' + this.asString(), Color.green, 3)
        return true;
    },



});
lively.ide.FileFragmentNode.subclass('lively.ide.CopMemberFragmentNode', {

    isMemberNode: true,
    
    evalSource: function(newSource) {
        this.parent.evalSource(this.parent.sourceString());
        return true;
    },

});
lively.ide.FileFragmentNode.subclass('lively.ide.TraitFragmentNode', {

    isClassNode: true,

    childNodes: function() {
        return this.target.subElements().collect(function(fileFragment) {
            return new lively.ide.TraitElemFragmentNode(fileFragment, this.browser, this)
        }, this);
     },

    evalSource: function(newSource) {
        try {
            eval(newSource);
        } catch (er) {
            console.warn("error evaluating Trait:" + er);
            throw(er)
        }
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

});

}) // end of module