Global/*
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

module('lively.Main').requires("lively.persistence.Serializer", "lively.ChangeSet").toRun(function() {

// The WorldDataAccessor reads data in some form (e.g. JSON) from some source
// e.g. meta nodes in a DOM and creates and initializes lively.morphic.Worlds
// from it
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
        // currently we only support JSON embedded in XHTML meta nodes
        var doc = canvas.ownerDocument,
            changeSet = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc),
            jsonNode = doc.getElementById(lively.persistence.Serializer.jsonWorldId),
            json = jsonNode.textContent == "" ? jsonNode.content : jsonNode.textContent;
        return new lively.Main.JSONMorphicData(canvas, jsonNode && json, changeSet);
    }
});

lively.Main.WorldDataAccessor.subclass('lively.Main.NewWorldData',
'accessing and creation', {
    getWorld: function() {
        if (this.world) return this.world;
        this.world = new lively.morphic.World(this.getCanvas());
        return this.world;
    },
    getChangeSet: function() {
        var doc = this.getCanvas().ownerDocument;
        this.changeSet = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc);
        return this.changeSet;
    }
});

lively.Main.WorldDataAccessor.subclass('lively.Main.JSONMorphicData',
'initializing', {
    initialize: function($super, canvas, json, changeSet) {
        $super(canvas);
        this.jso = lively.persistence.Serializer.parseJSON(json);
        this.changeSet = changeSet;
    }
},
'accessing and creation', {
    getWorld: function() {
        if (this.world) return this.world;
        this.world = lively.morphic.World.createFromJSOOn(this.jso, document.body);
        return this.world;
    },

    getChangeSet: function() { return this.changeSet },

    modulesBeforeChanges: function($super) {
        var modulesInJson = this.jso ? lively.persistence.Serializer.sourceModulesIn(this.jso) : [];
        console.log('Found modules required for loading because '
                   + 'serialized objects require them: '
                   + modulesInJson);
        return $super()
               .concat(modulesInJson)
               .concat('lively.morphic.Complete')
               .uniq();
    },
    modulesBeforeDeserialization: function($super) { return $super().concat('lively.morphic.Serialization') }

});

// The loader defines what should happen after the bootstrap phase to get a
// lively.morphic.World running
Object.subclass('lively.Main.Loader',
'properties', {
    connections: ['finishLoading']
},
'accessing', {
    getCanvas: function() { return this.canvas },
    getWorldData: function() {
        if (!this.worldData) {
            this.worldData = lively.Main.WorldDataAccessor.forCanvas(this.getCanvas());
        }
        return this.worldData;
    }
},
'preparation', {

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

        if (UserAgent.webKitVersion) {
            cssDef += ':focus {\n'
                    + '  outline:none;\n'
                    + '}\n'
                    + '.visibleSelection:focus {\n'
                    + '  outline: 2px auto -webkit-focus-ring-color;\n'
                    + '}\n';
        }

        if (UserAgent.fireFoxVersion) {
            cssDef += ':focus {\n'
                    + '  outline:none;\n'
                    + '}\n'
                    + '.visibleSelection:focus {\n'
                    + "  -moz-box-shadow: 0 0px 3px blue;\n"
                    + "  box-shadow:0 0px 3px blue;\n"
                    + "}\n"
        }

        XHTMLNS.addCSSDef(cssDef);

        // disable Firefox spellchecking
        if (UserAgent.fireFoxVersion) {
            document.body.spellcheck = false;
        }
    }

},
'loading', {

    systemStart: function(canvas) {
        console.group("World loading");
        this.canvas = canvas;
        this.loadWorld(canvas);
    },

    loadWorld: function() {
        var self = this, worldData = this.getWorldData();
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
        lively.whenLoaded = function(cb) { cb(world) };
        if (Config.textUndoEnabled) {
            (function setupUndo() {
                if (!Config.get("textUndoEnabled")) return;
                Trait("lively.morphic.TextUndo.TextMutationObserverTrait").applyTo(lively.morphic.Text);
                console.log("Text undo enabled");
            })();
        }
        if (Config.undoLogging) {
            lively.morphic.World.current().GlobalLogger = new lively.GlobalLogger();
        }
        console.log("The world is now completely loaded.");
    }

});


Object.extend(lively.Main, {
    getLoader: function(canvas) { return new lively.Main.Loader(); }
});

}); // end of module
