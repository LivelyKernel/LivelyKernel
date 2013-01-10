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

module('lively.Main').requires("lively.persistence.Serializer").toRun(function() {

// The WorldDataAccessor reads data in some form (e.g. JSON) from some source
// e.g. meta nodes in a DOM and creates and initializes lively.morphic.Worlds
// from it
Object.subclass('lively.Main.WorldDataAccessor',
'initializing', {
    initialize: function(doc) {
        this.doc = doc;
    },
    modulesBeforeDeserialization: function() { return Config.modulesBeforeDeserialization || [] }

},
'accessing and creation', {
    modulesBeforeWorldLoad: function() { return Config.modulesBeforeWorldLoad || [] },
    modulesOnWorldLoad: function() { return Config.modulesOnWorldLoad || [] },
    getDoc: function() { return this.doc },
    getWorld: function() {  throw new Error('Subclass responsibility') }
});

Object.extend(lively.Main.WorldDataAccessor, {
    forDoc: function(doc) {
        return doc.xmlVersion ? this.forXMLDoc(doc) : this.forHTMLDoc(doc);
    },

    forXMLDoc: function(doc) {
        // currently we only support JSON embedded in XHTML meta nodes
        var jsonNode = doc.getElementById(lively.persistence.Serializer.jsonWorldId),
            json = jsonNode.textContent == "" ? jsonNode.content : jsonNode.textContent;
        return new lively.Main.JSONMorphicData(doc, jsonNode && json);
    },

    forHTMLDoc: function(doc) {
        // get the first script tag with the x-lively-world type
        var json = lively.$(doc).find('script[type="text/x-lively-world"]').text();
        return new lively.Main.JSONMorphicData(doc, json);
    }
});

lively.Main.WorldDataAccessor.subclass('lively.Main.NewWorldData',
'accessing and creation', {
    getWorld: function() {
        return this.world ? this.world : this.world = new lively.morphic.World(this.getDoc());
    }
});

lively.Main.WorldDataAccessor.subclass('lively.Main.JSONMorphicData',
'initializing', {
    initialize: function($super, doc, json) {
        $super(doc);
        this.jso = LivelyMigrationSupport.applyWorldJsoTransforms(
            lively.persistence.Serializer.parseJSON(json));
    }
},
'accessing and creation', {
    getWorld: function() {
        if (this.world) return this.world;
        this.world = lively.morphic.World.createFromJSOOn(this.jso, this.getDoc());
        return this.world;
    },

    modulesBeforeDeserialization: function($super) {
        var modulesInJson = this.jso ? lively.persistence.Serializer.sourceModulesIn(this.jso) : [];
        console.log('Found modules required for loading because '
                   + 'serialized objects require them: '
                   + modulesInJson);
        return $super().concat(modulesInJson).concat(['lively.morphic.Complete']).uniq();
    }

});

// The loader defines what should happen after the bootstrap phase to get a
// lively.morphic.World running
Object.subclass('lively.Main.Loader',
'properties', {
    connections: ['finishLoading']
},
'accessing', {
    getDoc: function() { return this.doc },
    getWorldData: function() {
        if (!this.worldData) {
            this.worldData = lively.Main.WorldDataAccessor.forDoc(this.getDoc());
        }
        return this.worldData;
    }
},
'preparation', {

    browserSpecificFixes: function() {
        if (Global.navigator.appName == 'Opera') window.onresize();
        // FIXME rk 2012-12-17: this should use our new CSS support!
        var id = 'lively-base-style',
            existing = document.getElementById(id);
        if (existing) existing.parentNode.removeChild(existing);
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
            cssDef += ':focus:not(input) {\n'
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

        XHTMLNS.addCSSDef(cssDef, id);

        // disable Firefox spellchecking
        if (UserAgent.fireFoxVersion) {
            document.body.spellcheck = false;
        }
    }

},
'loading', {

    systemStart: function(doc) {
        console.group("World loading");
        this.doc = doc;
        this.loadWorld(doc);
    },

    loadWorld: function() {
        var self = this, worldData = this.getWorldData();
        require(worldData.modulesBeforeDeserialization()).toRun(function() {
            require(worldData.modulesBeforeWorldLoad()).toRun(function() {
                require(worldData.modulesOnWorldLoad()).toRun(function() {
                    var world = worldData.getWorld();
                    world.displayOnDocument(self.getDoc());
                    self.onFinishLoading(world);
                });
            });
        });
    },

    onFinishLoading: function(world) {
        console.groupEnd("World loading");
        world.hideHostMouseCursor();
        world.loadingMorph = new lively.morphic.LoadingMorph(rect(0,0,300,200));
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
        console.log("The world is now completely loaded.");
    }

});


Object.extend(lively.Main, {
    getLoader: function(doc) { return new lively.Main.Loader(); }
});

}); // end of module
