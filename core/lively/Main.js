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

var reqs = ["lively.persistence.Serializer", "lively.ChangeSet"];
if (!Config.isNewMorphic) reqs.push('lively.Core');
module('lively.Main').requires(reqs).toRun(function() {

Object.subclass('lively.Main.WorldDataAccessor',
'initializing', {
    initialize: function(canvas) {
        this.canvas = canvas;
    },
    modulesBeforeDeserialization: function() { return Config.modulesBeforeDeserialization || [] },

},
'accessing and creation', {
    modulesBeforeChanges: function() { return Config.modulesBeforeChanges || [] },
    modulesBeforeWorldLoad: function() { return Config.modulesBeforeWorldLoad || [] },
    modulesOnWorldLoad: function() { return Config.modulesOnWorldLoad || [] },
    getCanvas: function() { return this.canvas },
    getWorld: function() {  throw new Error('Subclass responsibility') },
    getChangeSet: function() {  throw new Error('Subclass responsibility') },
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

        if (Config.useOfflineStorage) module("lively.Persistence").load(true);
        var os = Global.OfflineStorage && new OfflineStorage();
        if (os && OfflineStorage.available() && os.isOfflineStorageEnabled() && os.shouldAutoLoad()) {
            var json = os.getLocalJSONData();
            changeSet = os.deserializeChangeSetFromLocalStorage();
            return new lively.Main.JSONWorldData(canvas, json, changeSet);
        }

        if (jsonNode) {
            Config.modulesBeforeWorldLoad.push('lively.persistence.ObjectExtensions');
            changeSet = lively.persistence.Serializer.deserializeChangeSetFromDocument(doc);
            return new lively.Main.JSONWorldData(canvas, jsonNode.textContent, changeSet);
        }

        var morphNodes = $A(doc.getElementsByTagName('g')).concat($A(doc.getElementsByTagName('div'))),
            worldNode = morphNodes.detect(function(node) {
                return LivelyNS.getAttribute(node, 'type') === 'WorldMorph' });
        if (worldNode) {
            changeSet = ChangeSet.fromWorld(worldNode);
            return new lively.Main.XMLWorldData(canvas, worldNode, changeSet);
        }

        if (canvas.tagName == 'canvas') {
            return new lively.Main.NewWorldData(canvas);
        }

        throw new Error('Cannot access data to load world');
    },
});
lively.Main.WorldDataAccessor.subclass('lively.Main.XMLWorldData',
'initializing', {
    initialize: function($super, canvas, worldNode, changeSet) {
        $super(canvas);
        this.worldNode = worldNode;
        this.changeSet = changeSet;
    },
},
'accessing and creation', {
    getWorld: function() {
        if (this.world) return world;
        var importer = new Importer();
        this.world = importer.loadWorldContents(this.canvas);
        return this.world;
    },
    getChangeSet: function() { return this.changeSet },
});
lively.Main.WorldDataAccessor.subclass('lively.Main.JSONWorldData',
'initializing', {
    initialize: function($super, canvas, json, changeSet) {
        $super(canvas);
        this.jso = lively.persistence.Serializer.parseJSON(json);
        this.changeSet = changeSet;
    },
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
    },
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
    modulesBeforeDeserialization: function($super) { return $super().concat('lively.morphic.Serialization') },

});
Object.subclass('lively.Main.Loader',
'properties', {
    connections: ['finishLoading'],
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
        // selection style of morphs/texts/lists etc.
        XHTMLNS.addCSSDef(':focus {outline:none; border:0px}\n\
            .visibleSelection:focus  { outline: 2px auto -webkit-focus-ring-color;}')
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
            console.log("Running finishLoadingCallbacks");
            Config.finishLoadingCallbacks.forEach(function(cb){
                cb(world);
            });
        } else {
            console.log("Not running any finishLoadingCallbacks");
        }            
    },

},
'maybe deprecated', {
    configPatches: function() {
        // Class browser visibility can be overridden with Config.browserAnyway
        Config.showBrowser = !Config.skipMostExamples || Config.browserAnyway;
    },
    replaceWindowMorphIfNotExisiting: function() {
        // This stub allows us to run without Widgets.js
        if(!Global.WindowMorph) { WindowMorph = function() {} }
    },
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

        Config.useGetTransformToElement = false; // for manually applying transform

        lively.Main.Examples = lively.Main.HTMLExamples; // replace class

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
        this.onFinishLoading(world)

        if (!Config.skipMostExamples)
            new lively.Main.HTMLExamples().populateWorldWithExamples(world);
    },

});


// uses demo flags from defaultconfig.js and localconfig.js
Object.subclass('lively.Main.Examples', {

    showStar: function(world) {
        if (Config.showStar) {  // Make a star
            var makeStarVertices = function(r,center,startAngle) {
                var vertices = [];
                var nVerts = 10;
                for (var i=0; i <= nVerts; i++) {
                    var a = startAngle + (2*Math.PI/nVerts*i);
                    var p = lively.Point.polar(r,a);
                    if (i%2 == 0) p = p.scaleBy(0.39);
                    vertices.push(p.addPt(center));
                }
                return vertices;
            }

            widget = Morph.makePolygon(makeStarVertices(50,pt(0,0),0), 1, Color.black, Color.yellow);
            widget.setPosition(pt(125, 275));
            world.addMorph(widget);

            if (Config.showStar && Config.spinningStar) {  // Make the star spin as a test of stepping
                widget.startStepping(60, "rotateBy", 0.1);
                if (world !== lively.morphic.World.current()) world.suspendAllActiveScripts();
            }
        }
    },

    showSampleMorphs: function(world) {
        if (Config.showSampleMorphs) {
            var colors = Color.wheel(4);
            var loc = pt(150, 450);
            var widgetExtent = pt(70, 30);
            var dy = pt(0,50);
            var dx = pt(120,0);

            // Create a sample rectangle
            widget = Morph.makeRectangle(loc, widgetExtent);
            widget.setFill(colors[0]);
            world.addMorph(widget);

            // Create a sample ellipse
            widget = Morph.makeEllipse(loc.addPt(dx).extent(widgetExtent), 1, Color.black, colors[1]);
            world.addMorph(widget);

            // Create a sample line
            loc = loc.addPt(dy);
            widget = Morph.makeLine([pt(0,0), pt(70,0)], 2, Color.black);
            widget.setPosition(loc.addXY(0,15));
            world.addMorph(widget);

            // Create a sample polygon
            widget = Morph.makePolygon([pt(0,0),pt(70,0),pt(40,30)], 1, Color.black, colors[2]);
            world.addMorph(widget);
            widget.setPosition(loc.addPt(dx));
            loc = loc.addPt(dy);

            // Create sample text morphs
            if (Config.showTextSamples) {
                widget = new lively.morphic.Text(loc.extent(pt(100,50)),"Big Text"); // big text
                world.addMorph(widget.applyStyle({fontSize: 20, textColor: Color.blue}));

                widget = new lively.morphic.Text(loc.addPt(dx).extent(pt(140,50)),"Unbordered"); // unbordered text
                world.addMorph(widget.applyStyle({fontSize: 20, borderWidth: 0, fill: null}));
            }
        }
    },

    populateSlideWorld: function(world) {
        if(Config.showWebStack) {
            var loc = pt(100, 80);
            var captions = [
            "               JavaScript",
            "                 Widgets",
            "      HTML, CSS, DOM, etc.",
            "                Browser",
            "    OS: Network, Graphics, ..."
            ];
            for (var i = 0; i < captions.length; i++) { // add boxed text
                var txt = new lively.morphic.Text(loc.extent(pt(300, 50)), captions[i]);
                txt.applyStyle({fontSize: 20, fill: Color.hsb(70*i,0.7,0.8)});
                loc = loc.addXY(0,35);
                world.addMorph(txt);
            }
        }

        this.showStar(world);
        this.showSampleMorphs(world);
    },

    makeSlideWorld: function(world) {
        var link = new LinkMorph(null, pt(60, 400));
        // KP: note that element deletion interferes with iteration, so
        // we make an array first and then remove
        link.myWorld.submorphs.clone().forEach(function(m) {
            if (m instanceof LinkMorph) return;
            m.remove();
        });
        this.populateSlideWorld(link.myWorld)
        return link;
    },

    showClock: function(world) {
        require('lively.Examples').toRun(function() {
            var widget = new ClockMorph(pt(80, 100), 50);
            world.addMorph(widget);
            widget.startSteppingScripts();
        });

    },

    showEngine: function(world) {
        require('lively.Examples').toRun(function() {
            EngineMorph.makeEngine(world, pt(230, 30))
        });
    },

    showAsteroids: function(world) {
        require('lively.Examples').toRun(function(unsused, examplesModule) {
            using(examplesModule.asteroids).run(function(app) {
                var gameMorph = app.makeGameMorph(pt(500, 360).extent(pt(600, 300)));
                world.addMorph(new WindowMorph(gameMorph, 'Asteroids!'));
                app.initialize();
                gameMorph.runAsteroidsGame();
                gameMorph.owner.collapse();
            });
        });
    },

    showWeather: function(world) {
        require('lively.Examples').toRun(function() {
            // Maybe the icons should have rectangular images (unlike here)
            var weather = new WeatherWidget().openIn(world, pt(685, 165));
            world.topSubmorph().rotateBy(-0.2);
        });
    },

    showStocks: function(world) {
        require('lively.Examples').toRun(function() {
            var stockWidget = new StockWidget();
            stockWidget.openIn(world, pt(350, 500));
        });
    },

    showTesterRunnerForDevelopment: function() {
        var requirements = Config.loadTests.collect(function(ea) { return 'tests.' + ea});
        if (requirements.length === 0) requirements.push('lively.TestFramework');
        require(requirements).toRun(function(currentModule) {
            TestRunner.openIn();
            console.log('Tests loaded: .............................  ' + TestCase.allSubclasses().length);
        });
    },

    showLivelyConsole: function(world) {
        if (!window.console.consumers) return
        var consoleWidget = new ConsoleWidget(50).openIn(world, pt(0,0));
        consoleWidget.setPosition(pt(0, world.viewport().height - consoleWidget.bounds().height + 20 /*magic number*/));
    },

    showFabrikComponents: function() {
        if (Config.showFabrikComponentBox)
            require('lively.Fabrik').toRun(function() { Fabrik.openComponentBox() });
        if (Config.showFahrenheitCelsiusExample)
            require('lively.Fabrik').toRun(function() { Fabrik.openFahrenheitCelsiusExample() });
        if (Config.showTextListExample)
            require('lively.Fabrik').toRun(function() { Fabrik.openFabrikTextListExample() });
        if (Config.openFabrikBrowserExample)
            require('lively.Fabrik').toRun(function() { Fabrik.openFabrikBrowserExample() });
        if (Config.showFabrikWebRequestExample)
            require('lively.Fabrik').toRun(function() { Fabrik.openFabrikWebRequestExample() });
        if (Config.showFabrikWeatherWidgetExample)
            require('lively.Fabrik').toRun(function() { Fabrik.openFabrikWeatherWidgetExample() });
    },

    showTileScripting: function() {
        require('lively.TileScripting').toRun(function(unused, tsModule) { tsModule.TileBox.open() });
    },

    showToolDock: function() {
        require('lively.Helper').toRun(function(unused, helper) { new helper.ToolDock().startUp(); })
    },

    showInnerWorld: function(world) {
        var lm1 = new LinkMorph(null, pt(60, 460));
        world.addMorph(lm1);
        lm1.addLabel("More complex sample widgets");

        lm1.myWorld.onEnter = function() {
            if (this.enterCount > 0) return;

            require('lively.WebPIM').toRun(function() {
                PIM = new WebPIM().openIn(lm1.myWorld, pt(200, 110));
            });


            if (Config.showRSSReader() && Config.showNetworkExamples) {
                require('lively.Examples').toRun(function() {
                    console.log('initializing RSS reader');
                    new FeedWidget("http://feeds.feedburner.com/ajaxian").openIn(lm1.myWorld, pt(725, 120));
                });
            }

            if (Config.showCanvasScape()) {
                require('lively.Examples').toRun(function(unused, examplesModule) {
                    lm1.myWorld.addMorph(new WindowMorph(new examplesModule.canvascape.CanvasScapeMorph(new Rectangle(20,50,800,300)), 'CanvasScape')).collapse();
                });
            }

            if (false && !Config.skipMostExamples && Config.showMap) { // unfortunately the maps API has changed
                require('lively.Examples').toRun(function(unused, exampleModule) {
                    var tile = exampleModule.maps.tileExtent;
                    var map = new MapFrameMorph(new Rectangle(0, 0, 2*tile.x, 2*tile.y), true);
                    map.setScale(0.7);
                    map.setPosition(pt(160, 250));
                    lm1.myWorld.addMorph(map);
                });
            }

            if (!Config.skipMostExamples && Config.showKaleidoscope) { // unfortunately the maps API has changed
                require('lively.Examples').toRun(function(unused, exampleModule) {
                    var kaleidoscopeWorld = new LinkMorph(null, pt(60, 560));
                    lm1.myWorld.addMorph(kaleidoscopeWorld);
                    kaleidoscopeWorld.addLabel("Kaleidoscope");
                    kaleidoscopeWorld.myWorld.onEnter = function() {
                        if (!kaleidoscopeWorld.enterCount) kaleidoscopeWorld.enterCount = 0;
                        if (kaleidoscopeWorld.enterCount > 0) return
                        var kal = new SymmetryMorph(300, 7);
                        kaleidoscopeWorld.myWorld.addMorph(kal);
                        kal.startUp();
                        kal.addMorph(Morph.makeStar(pt(0,30)))
                        kal.addMorph(Morph.makeStar(pt(20,160)))
                    }
                });
            }

            // Add sample curve stuff
            if (Config.showCurveExample) {
                var g = lively.scene;
                // bezier blob
                var shape = new g.Path([
                    new g.MoveTo(true, 0,  0),
                    new g.CurveTo(true, 50, 0),
                    new g.CurveTo(true, 50, 50),
                    new g.CurveTo(true, 0, 50),
                    new g.CurveTo(true, 0, 0)
                    ]);
                var widget = widget = new lively.morphic.Morph(shape);
                widget.applyStyle({fill: Color.red, borderWidth: 3, borderColor: Color.black});
                this.addMorph(widget);

                // rectangle with rounded corners
                var shape = new g.Path([
                    new g.MoveTo(true, 10,  0),
                    new g.CurveTo(true, 60, 0),
                    new g.CurveTo(true, 70, 10),
                    new g.CurveTo(true, 70, 40),
                    new g.CurveTo(true, 60, 50),
                    new g.CurveTo(true, 10, 50),
                    new g.CurveTo(true, 0, 40),
                    new g.CurveTo(true, 0, 10),
                    new g.CurveTo(true, 10, 0),
                    ]);

                // for (var i = 2; i<=8; i+=2) {
                //     // this will work too
                //     // shape2[i].radius = pt(10,10); shape2[i].type = "arc";
                //     shape2[i].radius = 10; shape2[i].type = "arc";
                // }
                widget = new lively.morphic.Morph(shape);
                widget.applyStyle({fill: Color.green, borderWidth: 2, borderColor: Color.red});
                this.addMorph(widget);
            }

            if (Config.showBitmap) {
                var width = 800;
                var height = 500;
                var url = "http://maps.google.com/mapdata?"+
                "Point=b&Point.latitude_e6=61500000&Point.longitude_e6=-3191200000&Point.iconid=15&"+
                "Point=e&Point=b&Point.latitude_e6=61500000&Point.longitude_e6=-3191200600&Point.iconid=16&"+
                "Point=e&latitude_e6=61500000&longitude_e6=-3191200000&zm=8000&w=" +
                width + "&h=" + height + "&cc=US&min_priority=2";
                this.addMorphBack(new WindowMorph(new ImageMorph(new Rectangle(50, 10, width, height), url, true), 'Tampere'));
            }

            if (Config.showSquiggle())
                require('lively.Examples').toRun(function() {
                    lm1.myWorld.addFramedMorph(new SquiggleMorph(pt(300, 300)), 'Freehand', pt(560, 380));
                });

            if (Config.showVideo())
                require('lively.Helper').toRun(function() { new VideoMorph().openExample(lm1.myWorld) });

        } // lm1.myWorld.onEnter
    },

    showSlideWorld: function(world) {
        // load from slideWorld
        // Make a slide for "turning web programming upside down"
        if (Config.loadSerializedSubworlds) {
            var webResource = new WebResource(URL.source.withFilename("slide.xhtml")),
                doc = webResource.get().contentDocument,
                slideWorld = new Importer().loadWorldContents(doc),
                link = world.addMorph(new LinkMorph(slideWorld, pt(60, 400)));
            link.addLabel("Simple example morphs");
        } else {
            var link = this.makeSlideWorld(world);
            world.addMorph(link);
            link.addLabel("Simple example morphs");
        }
    },

    showDeveloperWorld: function(world) {
        var devWorld = new LinkMorph(null, pt(60, 520));
        world.addMorph(devWorld);
        devWorld.addLabel("Development Tools");

        if (Config.showBrowser) new SimpleBrowser().openIn(devWorld.myWorld, pt(20, 20));

        if (Config.showTester)
            require('lively.Examples').toRun(function() { new TestWidget().openIn(devWorld.myWorld, pt(935, 450)) });


        if (!Config.skipMostExamples && !UserAgent.isTouch) new ObjectBrowser().openIn(devWorld.myWorld, pt(50, 100));

        // Sample executable script pane
        if (Config.showPenScript) {
            require('lively.ChangeSet').toRun(function() {
                ChangeSet.fromFile(URL.codeBase.withFilename('Pen.lkml').toString()).evaluate();
                var textmorphClass = Config.showTestText ? TestTextMorph : lively.morphic.Text,
                    widget = new textmorphClass(pt(50,30).extent(pt(250,50)), Pen.script);
                widget.align(widget.bounds().bottomRight(), world.bounds().topRight().addPt(pt(-150,100)));
                if (Config.showHilbertFun)
                    Pen.hilbertFun(devWorld.myWorld, widget.bounds().bottomLeft().addXY(180,80));
                devWorld.myWorld.addMorph(widget);
            });
        };

        if (Config.showWebStore()) {
            var store = new FileBrowser();
            store.openIn(Config.webStoreInMain ? lively.morphic.World.current() : devWorld.myWorld, pt(460, 120));
        };

        if (Config.showDOMBrowser) {
            var browser = new DOMBrowser();
            console.log('showing DOMBrowser!');
            browser.openIn(Config.webStoreInMain ? lively.morphic.World.current() : devWorld.myWorld, pt(260, 120));
        };

        if (Config.showTwoPaneObjectBrowser) {
            var browser = new TwoPaneObjectBrowser();
            console.log('showing TwoPaneBrowser!');
            browser.openIn(Config.webStoreInMain ? lively.morphic.World.current() : devWorld.myWorld, pt(160, 150));
        }

        if (Config.showSystemBrowser) {
            require('lively.ide').toRun(function() {
                new lively.ide.SystemBrowser().openIn(Config.webStoreInMain ? lively.morphic.World.current() : devWorld.myWorld, pt(100, 350))
            })
        }

        if (Config.showGridDemo)
            require('lively.GridLayout').toRun(function() {
                alert('demo!!');
                GridLayoutMorph.demo(devWorld.myWorld, pt(90,450));
            });
    },

    showFabrikWorld: function(world) {
        require('lively.Fabrik').toRun(function() {
            var fabrikWorld = new LinkMorph(null, pt(60, 330));
            world.addMorph(fabrikWorld);
            fabrikWorld.addLabel("Visual programming with Fabrik");
            fabrikWorld.myWorld.onEnter = function() {
                if (this.enterCount > 0) return;
                Global.Fabrik.openFabrikBrowserExample(fabrikWorld.myWorld, pt(70,245));
                Global.Fabrik.openFahrenheitCelsiusExample(fabrikWorld.myWorld, pt(100,20));
                Global.Fabrik.openComponentBox(fabrikWorld.myWorld, pt(620,100));
                Global.Fabrik.openFabrikWebRequestExample(fabrikWorld.myWorld, pt(400,445));
            };
        });
    },

    // Populate the world with sample objects, widgets and applications
    populateWorldWithExamples: function(world) {

        if (Config.showOnlySimpleMorphs) {
            // Simply put basic shapes in world and nothing else (for testing)
            this.populateSlideWorld(world);
            // If Tools.js is loaded, and Config.debugExtras == true
            //   then the following call will print a trace of populateSlideWorld
            //   to the console...
            // lively.lang.Execution.trace(function() {populateSlideWorld(world) });
            return;
        }

        var widget;

        if (Config.showClock) this.showClock(world)
        if (Config.showEngine()) this.showEngine(world);
        if (Config.showAsteroids()) this.showAsteroids(world);
        if (Config.showWeather() && Config.showNetworkExamples) this.showWeather(world);
        if (Config.showStocks() && Config.showNetworkExamples) this.showStocks(world);

        if (Config.showTesterRunnerForDevelopment) this.showTesterRunnerForDevelopment()

        this.showFabrikComponents();

        if (Config.activateTileScripting) this.showTileScripting();
        if (Config.showToolDock) this.showToolDock();

        if (Config.showInnerWorld) this.showInnerWorld(world);
        if (Config.showSlideWorld) this.showSlideWorld(world);
        if (Config.showDeveloperWorld) this.showDeveloperWorld(world);

        if (Config.showLivelyConsole) this.showLivelyConsole(world);

        if (Config.testTracing) lively.lang.Execution.testTrace();

        return world;
    },

});
lively.Main.Examples.subclass('lively.Main.HTMLExamples', {

    showStar: function(world) {
            var makeStarVertices = function(r,center,startAngle) {
                var vertices = [];
                var nVerts = 10;
                for (var i=0; i <= nVerts; i++) {
                    var a = startAngle + (2*Math.PI/nVerts*i);
                    var p = lively.Point.polar(r,a);
                    if (i%2 == 0) p = p.scaleBy(0.39);
                    vertices.push(p.addPt(center));
                }
                return vertices;
            }

            var vertices = makeStarVertices(50,pt(0,0),0);
            var widget = Morph.makePolygon(vertices, 1, Color.black, Color.yellow);
            widget.setName('star')
            world.addMorph(widget);
            widget.setPosition(pt(125, 275));

            if (Config.showStar && Config.spinningStar) {  // Make the star spin as a test of stepping
                widget.startStepping(60, "rotateBy", 0.1);
                if (world !== lively.morphic.World.current()) world.suspendAllActiveScripts();
            }
    },

    showSampleMorphs: function(world) {
        if (Config.showSampleMorphs) {
            var colors = Color.wheel(4);
            var loc = pt(150, 450);
            var widgetExtent = pt(70, 30);
            var dy = pt(0,50);
            var dx = pt(120,0);

            // Create a sample rectangle
            widget = Morph.makeRectangle(loc, widgetExtent);
            widget.setFill(colors[0]);
            world.addMorph(widget);

            // Create a sample ellipse
            widget = Morph.makeEllipse(loc.addPt(dx).extent(widgetExtent), 1, Color.black, colors[1]);
            // var shape = new HTML5EllipseShape(loc.addPt(dx).extent(widgetExtent));
            // widget = new Morph(shape);
            widget.setFill(colors[1]);
            world.addMorph(widget);

            // // Create a sample line
            loc = loc.addPt(dy);
            widget = Morph.makeLine([pt(0,0), pt(-10,20), pt(70,0)], 2, Color.black);
            widget.setPosition(loc.addXY(0,15));
            world.addMorph(widget);
            //
            // Create a sample polygon
            widget = Morph.makePolygon([pt(0,0),pt(70,0),pt(40,30)], 1, Color.black, colors[2]);
            world.addMorph(widget);
            widget.setPosition(loc.addPt(dx));
            loc = loc.addPt(dy);
            //
            // // Create sample text morphs
            widget = new lively.morphic.Text(loc.extent(pt(100,50)),"Big Text"); // big text
            world.addMorph(widget.applyStyle({fontSize: 20, textColor: Color.blue}));

            widget = new lively.morphic.Text(loc.addPt(dx).extent(pt(140,50)),"Unbordered"); // unbordered text
            world.addMorph(widget.applyStyle({fontSize: 20, borderWidth: 0, fill: null}));
        }
    },

    populateSlideWorld: function(world) {
        this.showStar(world);
        this.showSampleMorphs(world);
    },

    populateWorldWithExamples: function($super, world) {
        this.populateSlideWorld(world);

        // load other examples
        Config.showAsteroids = Functions.False
        Config.showInnerWorld = false
        Config.showSlideWorld = false
        Config.showDeveloperWorld = false
        require('lively.Examples').toRun(function() { $super(world) });
    },

});
Object.extend(lively.Main, {
    getLoader: function(canvas) {
        if (canvas.tagName.toUpperCase() == 'CANVAS' || Config.isNewMorphic) return new lively.Main.CanvasLoader();
        if (canvas.tagName.toUpperCase() == 'SVG' && !Config.forceHTML) return new lively.Main.Loader();
        if (canvas.tagName.toUpperCase() == 'DIV' || Config.forceHTML) return new lively.Main.HTMLLoader();
        throw new Error('No loader for ' + canvas);
    },
});

}); // end of module
