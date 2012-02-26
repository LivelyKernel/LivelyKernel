module('lively.jsMorphic').requires('lively.ide.SourceDatabase', 'lively.AST.Parser', 'lively.persistence.Serializer').toRun(function() {

module('lively.jsMorphic.lively');
Object.extend(lively.jsMorphic.lively, {

    libFiles: ["morphic.js", "widgets.js", "blocks.js", "threads.js",  "objects.js", "gui.js",
                    "lists.js", "byob.js", "store.js"],
    updateLibFiles: function() {
        var path = 'lively/jsMorphic/lib/',
            updater = new lively.jsMorphic.lively.FileUpdater();
        updater.addNamespaceDefToJsMorphicFiles(this.libFiles, path);
    },

    getSource: function(fileName) {
        return URL.codeBase.withFilename('lively/jsMorphic/lib/' + fileName)
                           .asWebResource().forceUncached().get().content;
    },

    getAllSources: function() {
        return this.libFiles.collect(function(file) { return this.getSource(file); }, this).join("\n");
    },

    createJsMorphicNamespaceDef: function(source) {
        var ast = lively.AST.Parser.parse(source);
        // lively.AST.VariableAnalyzer.findUnboundVariableNamesInAST(ast);
        var vars = ast.children.select(function(ea) { return ea.isVarDeclaration; }),
            jsonized = vars.collect(function(varDecl) {
                return '  ' + varDecl.name + ': ' + varDecl.name;
            }).join(',\n'),
            jsMorphicNs = 'if (!lively.jsMorphic) lively.jsMorphic = {};\n' +
                          'Object.extend(lively.jsMorphic, {\n' + jsonized + '\n});';
        return jsMorphicNs;
    },

    load: function() {
        var errorOccurred = false;
        try {
            var source = this.getAllSources();
            console.log("Eval: \n" + source);
            // for binding "this"
            source = "(function() {\n" + source + "\n}).call(lively.jsMorphic);";
            eval(source);
            this.addPatches();
            this.morphicjsIsLoaded = true;
            alertOK('morphic.js successfully loaded');
        } catch(e) {
            errorOccurred = true;
            alert("Error loading jsMorphic: " + e);
        }
    },

    addPatches: function() {
        lively.jsMorphic.Morph.prototype.drawTexture =
            lively.jsMorphic.Morph.prototype.drawTexture.wrap(function(proceed, url) {
                if (!url.startsWith('http')) {
                    url = URL.codeBase.withFilename('lively/jsMorphic/lib/' + url).toString();
                }
                return proceed(url);
            });
        Global.updatePalette = lively.jsMorphic.updatePalette;
    },

    interactiveLoad: function() {
        if (!this.morphicjsIsLoaded) {
            this.load();
        }
    }
});

Object.extend(lively.jsMorphic, {
    jsMorphicClasses: function(recursive) {
        return this.gather(
            'jsMorphicClasses',
            function(ea) { return ea && ea !== this.constructor &&
                           ea.name && ea.name[0] === ea.name[0].toUpperCase()},
            recursive);
    }
});


// For updating the lib
Object.subclass('lively.jsMorphic.lively.FileUpdater',
'source handling', {
    markerStart: "/* AUTOMATICALLY GENERATED */\n",
    markerEnd: "/* AUTOMATICALLY GENERATED END */\n",

    addExtensionMarker: function(string) {
        if (!string.endsWith('\n')) string += '\n';
        return this.markerStart + string + this.markerEnd;
    },

    hasExtension: function(source) {
        return /AUTOMATICALLY GENERATED/.test(source);
    },

    removeExtension: function(source) {
        if (!this.hasExtension(source)) return source;
        var startIdx = source.indexOf(this.markerStart),
            endIdx = source.indexOf(this.markerEnd) + this.markerEnd.length;
        return source.slice(0, startIdx) + source.slice(endIdx, source.length);;
    },

    extend: function(source, extensionSource) {
        source = this.removeExtension(source);
        if (!source.endsWith('\n')) {
            source += '\n';
        }
        return source + this.addExtensionMarker(extensionSource);
    }
},
'source analyzation', {
    findTopLevelVariables: function(source) {
        return lively.AST.VariableAnalyzer.findTopLevelVarDeclarationsIn(source);
        // var ast = lively.AST.Parser.parse(source),
        //     vars = lively.AST.VariableAnalyzer.findTopLevelVarDeclarationsIn(source)
        //     vars = ast.children.select(function(ea) { return ea.isVarDeclaration; });
        // return vars;
    },

    createNamespaceDef: function(vars) {
        var jsonized = vars.collect(function(name) {
              return '  ' + name + ': ' + name;
            }).join(',\n'),
            jsMorphicNs = 'if (!lively.jsMorphic) lively.jsMorphic = {};\n' +
                          'Object.extend(lively.jsMorphic, {\n' + jsonized + '\n});';
        return jsMorphicNs;
    },

    createNamespaceDefForSource: function(source) {
        return this.createNamespaceDef(this.findTopLevelVariables(source));
    }
},
'file handling', {

    path: 'lively/jsMorphic/lib/',

    getWebResource: function(fileName) {
        return URL.codeBase.withFilename(this.path + fileName).asWebResource();
    },

    getSource: function(fileName) {
        return this.getWebResource(fileName).get().content;
    },

    writeSource: function(fileName, source) {
        this.getWebResource(fileName).put(source);
    }
},
'file update', {
    addNamespaceDefToFile: function(fileName) {
        var source = this.getSource(fileName),
            namespaceDef = this.createNamespaceDefForSource(source),
            extendedSource = this.extend(source, namespaceDef);
        this.writeSource(fileName, extendedSource);
    },
    addNamespaceDefToJsMorphicFiles: function(files, path) {
        this.path = path;
        files.doAndContinue(function(next, ea) {
            alertOK('Updating ' + ea);
            try {
                this.addNamespaceDefToFile(ea);
            } catch(e) {
                alert('Error updating ' + ea + '\n' + e);
            } finally {
                next.delay(0);
            }
        }, null, this);
    }
});


/*
 * Shapes
 */

lively.morphic.Shapes.Shape.subclass('lively.jsMorphic.lively.Canvas',
'initializing', {
    initHTML: function($super, ctx) {
        if (!ctx.shapeNode) {
            ctx.shapeNode = lively.jsMorphic.newCanvas();
        }
        $super(ctx);
        lively.bindings.signal(this, 'canvasCreated', ctx.shapeNode);
    },
    setExtentHTML: function(ctx, value) {
        if (!ctx.shapeNode) return;
        // requires directly setting width/height at element
        // jQuery accessors/css does not work
        ctx.shapeNode.width = value.x;
        ctx.shapeNode.height = value.y;
    }
});


/*
 * Morphs
 */

lively.morphic.Morph.subclass("lively.jsMorphic.lively.World",
'initializing', {
    doNotSerialize: [],

    // for allowing right click in jsMorphic
    showsMorphMenu: false,
    showsHalosOnRightClick: false,

    // drag
    draggingEnabled: false,
    grabbingEnabled: false,

    getCanvas: function() {
        return this.renderContext().shapeNode;
    },

    initialize: function($super, bounds) {
        $super(new lively.jsMorphic.lively.Canvas(bounds));
        this.jsMorph = new lively.jsMorphic.WorldMorph(this.getCanvas(), false);
        this.setBounds(bounds);
        this.startStepping(20, 'jsMorphicWorldLoop');
    },

    appendHTML: function($super, ctx, optMorphAfter) {
        $super(ctx, optMorphAfter);
        var canvas = this.getCanvas();
        if (this.jsMorph && canvas) {
            this.jsMorph.worldCanvas = canvas;
        }
    },

    onrestore: function($super) {
        $super();
        lively.bindings.connect(
            this.getShape(), 'canvasCreated',
            this, 'restoreCanvas',
            {removeAfterUpdate: true});
    },

    restoreCanvas: function(canvas) {
        this.jsMorph.worldCanvas = canvas;
        this.jsMorph.initEventListeners();
        this.jsMorph.changed();

        this.jsMorph.forAllChildren(function(ea) {
            ea.drawNew();
            ea.changed();
        });
    }
},
'ticking', {
    jsMorphicWorldLoop: function() {
        this.jsMorph.doOneCycle();
    }
},
'accessing', {
    setExtent: function($super, point) {
        this.jsMorph.setExtent(new lively.jsMorphic.Point(point.x, point.y));
        return $super(point);
    }
},
'rendering', {
    renderAfterUsing: function ($super, ctx, morphBefore) {
        $super(ctx, morphBefore);
        this.jsMorph.changed();
    }
},
'events', {

    // I currently have no idea why these events aren't dispatch automatically
    // since we don't handle them....
    onKeyDown: function(evt) {
        var m = this.jsMorph;
        if (m.keyboardReceiver) {
            m.keyboardReceiver.processKeyDown(evt);
        }
        if (evt.keyIdentifier === 'U+0008' || evt.keyIdentifier === 'Backspace') {
				    evt.stop();
        }
        return true;
    },

    onKeyPress: function(evt) {
        var m = this.jsMorph;
        if (m.keyboardReceiver) {
            m.keyboardReceiver.processKeyPress(evt);
        }
        evt.stop();
        return true;
    }
},
'PartsBin', {
    logoHTMLString: function ($super) {
        var m = this.jsMorph;
        if (!m || !m.worldCanvas || !m.worldCanvas.toDataURL) {
            return $super();
        }
        var node = this.renderContext().morphNode.cloneNode();
        node.appendChild($('<img src="' + m.worldCanvas.toDataURL() + '"/>')[0]);
        return Exporter.stringify(node);
    }
});

/*
* Serialization
*/

lively.persistence.GenericConstructorPlugin.subclass('lively.jsMorphic.lively.SerializationPlugin',
'accessing', {
    jsMorphicClasses: function() {
        if (!this._cachedClasses) {
            this._cachedClasses = lively.jsMorphic.jsMorphicClasses()
        }
        return this._cachedClasses;
    },

    jsMorphicClassOf: function(obj) {
        return this.jsMorphicClasses().detect(function(klass) {
            return klass === obj.constructor;
        });
    },

    getConstructorName: function(obj) {
        var klass = this.jsMorphicClassOf(obj);
        return klass && 'lively.jsMorphic.' + klass.name;
    }
},
'jsMorphic serialization', {
    addInfoForJsMorphicInstance: function(persistentCopy) {
        var classPlugin = lively.persistence.ClassPlugin,
            sourceModuleProp = classPlugin.prototype.sourceModuleNameProperty;
        persistentCopy[sourceModuleProp] = 'lively.jsMorphic';
    },

    addInfoForJsMorph: function(morph, persistentCopy) {
        if (!morph.image) return;
        persistentCopy.__jsMorphicCanvasSpec__ = 'lively.jsMorphic.newCanvas({x:'
                                               + morph.image.width + ',y:'
                                               + morph.image.height + '})';
    },

    restoreJsMorph: function(obj) {
        var canvasSpec = obj.__jsMorphicCanvasSpec__;
        if (!canvasSpec) return;
        try {
            // FIXME, better use object and read props from there
            obj.image = eval(canvasSpec);
        } catch(e) {
            console.error(e);
        }
    }
},
'plugin interface', {
    additionallySerialize: function($super, original, persistentCopy) {
        var isJSMorphicObject = $super(original, persistentCopy);
        // is jsMorphic object?
        if (isJSMorphicObject) {
            this.addInfoForJsMorphicInstance(persistentCopy);
            if (original.isMorph) {
                this.addInfoForJsMorph(original, persistentCopy);
            }
        }
    },

    afterDeserializeObj: function(obj) {
        if (obj.isMorph) {
            this.restoreJsMorph(obj);
        }
    }
});

(function addSerializerPlugin() {
    lively.persistence.pluginsForLively.pushIfNotIncluded(
        lively.jsMorphic.lively.SerializationPlugin);
})();


/*
 * now initiate loading the js morphic lib
 */
(function loadJSMorphicLib() {
    lively.jsMorphic.lively.load();
})();

}); // end of module