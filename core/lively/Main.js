/*
 * Copyright (c) 2006-2009 Sun Microsystems, Inc.
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

/**
 * Main.js.  System startup and demo loading.
 */
module('lively.Main').requires("lively.persistence.Serializer", "lively.ChangeSet").toRun(function() {

Object.subclass('lively.Main.WorldDataAccessor',
'initializing', {
    initialize: function(canvas) {
        this.canvas = canvas;
    },
    modulesBeforeDeserialization: function() { return Config.modulesBeforeDeserialization || [] }

},
'accessing and creation', {
    modulesBeforeChanges: function() { return Config.modulesBeforeChanges || [] },
    modulesBeforeWorldLoad: function() { return Config.modulesBeforeWorldLoad || [] },
    modulesOnWorldLoad: function() { return Config.modulesOnWorldLoad || [] },
    getCanvas: function() { return this.canvas },
    getWorld: function() {  throw new Error('Subclass responsibility') },
    getChangeSet: function() {  throw new Error('Subclass responsibility') }
});

Object.extend(lively.Main.WorldDataAccessor, {
    forCanvas: function(canvas) {
        var doc = canvas.ownerDocument, changeSet,
            jsonNode = doc.getElementById(lively.persistence.Serializer.jsonWorldId);

        if (Config.isNewMorphic) {

            // Meta elements do not have any text content. this violates
            // not only html5 but also xhtml. For html5 I am fixing this
            // using the content attribute, as it should be. For what
            // should have been xhtml, I do not care.

            changeSet = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc);

            // The text content of *every* meta element should be emtpy,
            // everything else is a browser bug, and you should not rely
            // on it. However, Lively does, which is why we need this
            // distinction here.

            var json = jsonNode.textContent;
            if(json === "") {
              // this is the content attribute, a.k.a. the proper way.
              json = jsonNode.content;
            }

            return new lively.Main.NewMorphicData(canvas, jsonNode && json, changeSet);
        }

        if (Config.createNewWorld)
            return new lively.Main.NewWorldData(canvas);


        if (jsonNode) {
            Config.modulesBeforeWorldLoad.push('lively.persistence.ObjectExtensions');
            changeSet = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc);
            return new lively.Main.JSONWorldData(canvas, jsonNode.textContent, changeSet);
        }

        if (canvas.tagName == 'canvas') {
            return new lively.Main.NewWorldData(canvas);
        }

        throw new Error('Cannot access data to load world');
    }
});

lively.Main.WorldDataAccessor.subclass('lively.Main.JSONWorldData',
'initializing', {
    initialize: function($super, canvas, json, changeSet) {
        $super(canvas);
        this.jso = lively.persistence.Serializer.parseJSON(json);
        this.changeSet = changeSet;
    }
},
'accessing and creation', {
    modulesBeforeChanges: function($super) {
        var modulesInJson = this.jso ? lively.persistence.Serializer.sourceModulesIn(this.jso) : [];
        console.log('Found modules required for loading because serialized objects require them: ' +
            modulesInJson);
        return $super().concat(modulesInJson).uniq();
    },


    getWorld: function() {
        if (this.world) return world;
        this.world = lively.persistence.Serializer.deserializeWorldFromJso(this.jso);
        return this.world;
    },
    getChangeSet: function() { return this.changeSet },
});

lively.Main.WorldDataAccessor.subclass('lively.Main.NewWorldData',
'accessing and creation', {
    getWorld: function() {
        if (this.world) return world;
        this.world = new lively.morphic.World(this.getCanvas());
        return this.world;
    },
    getChangeSet: function() {
        var doc = this.getCanvas().ownerDocument;
        this.changeSet = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc);
        return this.changeSet;
    }
});

lively.Main.JSONWorldData.subclass('lively.Main.NewMorphicData',
'accessing and creation', {
    getWorld: function() {
        if (this.world) return this.world;
        if (!this.jso) { // we have no serialized world, create a new one
            var bounds = new Rectangle(0,0, 1200, 850);
            this.world = lively.morphic.World.createOn(document.body, bounds);
        } else {
            this.world = lively.morphic.World.createFromJSOOn(this.jso, document.body);
        }
        return this.world;
    },

    modulesBeforeChanges: function($super) {
        return $super().concat('lively.morphic.Complete');
    },
    modulesBeforeDeserialization: function($super) { return $super().concat('lively.morphic.Serialization') }

});

Object.subclass('lively.Main.Loader',
'properties', {
    connections: ['finishLoading']
},
'accessing', {
    getCanvas: function() { return this.canvas },
    getWorldData: function() {
        if (!this.worldData)
            this.worldData = lively.Main.WorldDataAccessor.forCanvas(this.getCanvas());
        return this.worldData;
    },
},
'preparation', {

    prepareForLoading: function() {
        this.canvasHeightPatch(this.getCanvas());
        this.configPatches();
        this.debuggingExtras();
        this.clipboardHack();
        this.replaceWindowMorphIfNotExisiting();
        this.setupCounter(this.getCanvas());
        Event.prepareEventSystem(this.getCanvas());
    },

    debuggingExtras: function() {
        // Name the methods for showStack
        if (Config.tallyLOC && lively.lang.Execution.tallyLOC) lively.lang.Execution.tallyLOC();
        // Name the methods for showStack
        if (Config.debugExtras) lively.lang.Execution.installStackTracers();
    },

    clipboardHack: function() {
        if (!Config.suppressClipboardHack) ClipboardHack.ensurePasteBuffer();
    },

    setupCounter: function(doc) {
        var maxCount = new Query('//*[@id]').findAll(doc).inject(0, function(max, ea) {
            function getNumber(id) { return Number(id.split(':')[0]) }
            var no =  getNumber(ea.getAttribute('id')) || 0
            return Math.max(max, no);
        });
        lively.data.Wrapper.prototype.newId(maxCount);
    },

    browserSpecificFixes: function() {
        if (Global.navigator.appName == 'Opera') window.onresize();
        var cssDef = "";
        // 1. Don't DOM-select arbitrary elements on mouse move
        // none is different to -moz-none:
        // none has the same meaning as in display rule, none of the
        // sub-elements can overwrite it whereas -moz-none allows
        // child elements to overwrite -moz-user-select
        cssDef += "*:not(:focus) {\n"
                + "  -moz-user-select: -moz-none;\n"
                + "  -webkit-user-select: none;\n"
                + "  -ms-user-select: none;\n"
                + "  user-select: none;\n"
                + "}"
                + ".visibleSelection:focus, .visibleSelection:focus * {\n"
                + "  -moz-user-select: element;\n"
                + "  -webkit-user-select: auto;\n"
                + "  -ms-user-select: auto;\n"
                + "  user-select: auto;\n"
                + "}\n";
        // 2. selection style of morphs/texts/lists etc.
        // suppress focus highlight for most elements
        // only texts, lists, etc should show the real focus
        cssDef += ':focus {\n'
                + '  outline:none;\n'
                + '}\n'
                + '.visibleSelection:focus {\n'
                + '  outline: 2px auto ' + (UserAgent.webKitVersion ? '-webkit-focus-ring-color' : 'blue') + ';\n'
                + '}\n';
        XHTMLNS.addCSSDef(cssDef);

        // disable Firefox spellchecking
        if (UserAgent.fireFoxVersion) {
            document.body.spellcheck = false;
        }
    },

    canvasHeightPatch: function(canvas) {
        if (canvas.height && canvas.height.baseVal && canvas.height.baseVal.value < 200) {
            // a forced value, some browsers have problems with height=100%
            canvas.setAttribute("height", "800");
        }
    },

},
'loading', {

    systemStart: function(canvas) {
        console.group("World loading");

        this.canvas = canvas;

        this.prepareForLoading();
        this.loadWorld(canvas);
    },

    loadWorld: function() {
        var self = this,
                    worldData = this.getWorldData();
        require(worldData.modulesBeforeDeserialization()).toRun(function() {
            require(worldData.modulesBeforeChanges()).toRun(function() {
                var changes = !Config.skipChanges && worldData.getChangeSet();
                changes && changes.evaluateWorldRequirements();
                require(worldData.modulesBeforeWorldLoad()).toRun(function() {
                    changes && changes.evaluateAllButInitializer();
                    require(worldData.modulesOnWorldLoad()).toRun(function() {
                        var world = worldData.getWorld();
                        world.setChangeSet(changes);
                        world.displayOnCanvas(self.getCanvas());
                        changes && changes.evaluateInitializer();
                        self.onFinishLoading(world);
                    });
                });
            });
        });
    },

    onFinishLoading: function(world) {
        console.groupEnd("World loading");
        world.hideHostMouseCursor();
        this.browserSpecificFixes()
        lively.bindings.signal(this, 'finishLoading', world);
        lively.bindings.signal(world, 'finishLoading', world);
        // notify libraries loaded *very* early
        if (Config.finishLoadingCallbacks) {
            Config.finishLoadingCallbacks.forEach(function(cb){
                cb(world);
            });
        }
        lively.whenLoaded = function(callback) { callback.call(world) }
        console.log("The world is now completely loaded.");
    },

},
'maybe deprecated', {
    configPatches: function() {},
    replaceWindowMorphIfNotExisiting: function() {
        // This stub allows us to run without Widgets.js
        if(!Global.WindowMorph) { WindowMorph = function() {} }
    }
});

lively.Main.Loader.subclass('lively.Main.CanvasLoader',
'preperation', {
    prepareForLoading: function() {
        // made optional for NewLively world
        Event.prepareEventSystem && Event.prepareEventSystem(this.getCanvas());
    },
});
lively.Main.Loader.subclass('lively.Main.HTMLLoader',
'preparation', {
    setupCounter: function($super, doc) { return $super(doc.element || doc) },
},
'loading', {
    systemStart: function($super, canvas) {
        var loader = this,
            modules = [
                Config.useFlattenedHTMLRenderingLayer ? 'projects.HTML5.RenderingLayerFlattened' : 'projects.HTML5.RenderingLayer',
                Config.useDelayedHTMLRendering ? 'projects.HTML5.HTMLSceneDelayed' : 'projects.HTML5.HTMLScene'];

        require(modules).toRun(function() {
            if (!canvas.isHTMLElementWrapper)
                canvas = new HTMLElementWrapper(canvas);

            if (Global.HTML5RenderingLayer) {
                connect(loader, 'finishLoading', loader, 'enableLayerInWorld');
                cop.withLayers([HTML5RenderingLayer], function() {
                    $super(canvas);
                });
                console.log('_________USING HTML5RenderingLayer____________')
            } else {
                connect(loader, 'finishLoading', lively.morphic.World, 'currentWorld');
                $super(canvas);
            }
        });
    },

    enableLayerInWorld: function(world) {
        world.setWithLayers([HTML5RenderingLayer]);
        world.firstHand().setWithLayers([HTML5RenderingLayer]);
    },

    createNewWorld: function(canvas) {
        // FIXME, add it somewhere
        var world = new lively.morphic.World(canvas);
        world.displayOnCanvas(canvas);
        this.onFinishLoading(world);
    }

});

Object.extend(lively.Main, {
    getLoader: function(canvas) {
        if (canvas.tagName.toUpperCase() == 'CANVAS' || Config.isNewMorphic) return new lively.Main.CanvasLoader();
        if (canvas.tagName.toUpperCase() == 'DIV' || Config.forceHTML) return new lively.Main.HTMLLoader();
        throw new Error('No loader for ' + canvas);
    }
});

}); // end of module
