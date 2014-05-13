module('lively.morphic.Charts').requires('lively.morphic.Core', 'lively.ide.CodeEditor', 'lively.morphic.Widgets', 'cop.Layers').toRun(function() {
    
lively.morphic.Path.subclass("lively.morphic.Charts.VariableBox",
{
    initialize: function($super, extent, text, alwaysResize) {
        var arrowHeight = 5;
        extent = extent || pt(0, 0);
        this.maximumExtent = extent;
        this.alwaysResize = alwaysResize;
        var verticies = [
            pt(0, 0),
            pt(extent.x, 0),
            pt(extent.x, extent.y - arrowHeight),
            pt(extent.x / 2 + arrowHeight, extent.y - arrowHeight),
            pt(extent.x / 2, extent.y),
            pt(extent.x / 2 - arrowHeight, extent.y - arrowHeight),
            pt(0, extent.y - arrowHeight),
            pt(0, 0)
        ];
        
        $super(verticies);
        this.setBorderWidth(2);
        this.setBorderColor(Color.rgbHex("f0ad4e"));
        this.setFill(Color.white);
        
        if (text) {
            this.setTextString(text);
            this.adjustExtent();
        }
    },
    setTextString: function(string) {
        if (!this.textBox) {
            var textBox = new lively.morphic.Text();
            this.textBox = textBox;
            
            textBox.setExtent(this.maximumExtent);
            textBox.setFillOpacity(0);
            textBox.setBorderWidth(0);
            textBox.setFontSize(11);
            // textBox.setWhiteSpaceHandling("nowrap");
            textBox.setClipMode("auto");
            // textBox.setFixedWidth(false);
            // textBox.setFixedHeight(false);
            
            if (this.alwaysResize)
                connect(textBox, "textString", this, "adjustExtent", {});
            
            this.addMorph(textBox);
        }
        
        this.textBox.setTextString(string);
    },
    adjustExtent: function() {
        if (this.getControlPoints()) {
            var clampPt = function(pt1, pt2) {
                return pt(
                    pt1.x < pt2.x ? pt1.x : pt2.x,
                    pt1.y < pt2.y ? pt1.y : pt2.y
                )
            }
            
            var textBounds = this.textBox.computeRealTextBounds();
            var textExtent = pt(textBounds.width, textBounds.height);
            this.setExtent(clampPt(textExtent, this.maximumExtent));
        } else {
            console.log("deferring with this", this);
            this.tries = (this.tries || 0) + 1;
            if (this.tries < 10)
                setTimeout(this.adjustExtent.bind(this), 200);
        }
    },
    setExtent: function($super, extent) {
        // a super call has strange effects on the shape
        var controlPoints = this.getControlPoints();
        var topRight = controlPoints[1];
        var arrowHeight = 5;
        
        controlPoints[1].setPos(pt(extent.x, 0));
        controlPoints[2].setPos(pt(extent.x, extent.y));
        controlPoints[3].setPos(pt(extent.x / 2 + arrowHeight, extent.y));
        controlPoints[4].setPos(pt(extent.x / 2, extent.y + arrowHeight));
        controlPoints[5].setPos(pt(extent.x / 2 - arrowHeight, extent.y));
        controlPoints[6].setPos(pt(0, extent.y));
    }
});
    
lively.morphic.Morph.subclass("lively.morphic.Charts.PlusButton",
{
    initialize: function($super, droppingArea, optColor) {
        $super();
        var width = 10;
        var height = 10;
        // Bootstrap-blue as default
        if (!optColor) optColor = Color.rgb(66, 139, 202);
        
        this.droppingArea = droppingArea;
        
        this.setFillOpacity(0);
        this.setExtent(pt(width, height));
        this.setName("PlusButton");
        this.addStyleClassName('dataflow-clickable');
        // do not be affected by VerticalLayout of InteractionArea
        this.isLayoutable = false;
        
        var vertices = [pt(0, height / 2), pt(width, height / 2)];
        this.line1 = new lively.morphic.Path(vertices);
        this.line1.setBorderColor(optColor);
        this.line1.setBorderWidth(2);
        this.addMorph(this.line1);
        
        vertices = [pt(width / 2, 0), pt(width / 2, height)];
        this.line2 = new lively.morphic.Path(vertices);
        this.line2.setBorderColor(optColor);
        this.line2.setBorderWidth(2);
        this.addMorph(this.line2);
        
        this.submorphs[0].disableEvents();
        this.submorphs[1].disableEvents();
        
    },
    setColor: function(color) {
        this.line1.setBorderColor(color);
        this.line2.setBorderColor(color);
    },
    
    onMouseUp: function(evt) {
        var contextMenuComponents = this.droppingArea.getContextMenuComponents();
        var items = contextMenuComponents.map(function(ea) {
            return [ea.name, function() {
                var morph = ea.create();
                morph.openInHand();
            }];
        });
        
        var menu = new lively.morphic.Menu("Add new data flow component", items);
        menu.openIn($world, this.getPositionInWorld());
    },

});

lively.morphic.Morph.subclass("lively.morphic.Charts.DroppingArea", {
    initialize: function($super, extent) {
        $super();
        this.setExtent(extent);
        this.setFill(Color.white);
        this.setBorderWidth(1);
        this.layout = {adjustForNewBounds: true};
        
        this.createPlusButton();
    },
    createPlusButton: function() {
        var plusButton = new lively.morphic.Charts.PlusButton(this);
        plusButton.layout = {moveVertical: true};
        this.addMorph(plusButton);
        var position = pt(4, this.getExtent().y - plusButton.getExtent().y - 4);
        plusButton.setPosition(position);
        this.plusButton = plusButton;
    },
    
    wantsDroppedMorph: function(aMorph){
        if (!(aMorph instanceof lively.morphic.Charts.Component) && $world.draggedMorph !== aMorph) {
            this.attachListener(aMorph);
            return true;
        }
        return false;
    },
    onrestore: function($super) {
        $super();
        this.withAllSubmorphsDo(function (submorph) {
            // only submorphs which already had listenersAttached
            if (submorph.listenersAttached) {
                this.attachListener(submorph, true);
            }
        }, this, 1);
    },
    
    attachListener: function(aMorph) {
        // abstract
        alert("attachListener should have been overridden");
    },
    getContextMenuComponents: function() {
        // abstract
        alert("getContextMenuComponents should have been overridden");
    }
    
});

lively.morphic.Morph.subclass("lively.morphic.Charts.PrototypeArea", {
    
    initialize: function($super, extent) {
        $super();
        this.setExtent(extent);
        this.setFill(Color.white);
        this.setBorderWidth(1);
        this.layout = {adjustForNewBounds: true};
        this.setBorderColor(Color.rgb(66, 139, 202));
        this.setBorderRadius(5);
        
        this.createSampleProtoypes();
        
        // add morph name
        this.morphName = this.createMorphName();
        this.addMorph(this.morphName);
    },
    createMorphName: function() {
        var x = 45, y = 20;
        var morphName = new lively.morphic.Text(lively.rect(this.getExtent().x / 2 - x / 2, this.getExtent().y - y - 2, x, y), "morph");
        morphName.setFill(Color.white);
        morphName.setBorderWidth(0);
        morphName.layout = {
            centeredHorizontal: true,
            moveVertical: true
        };
        morphName.cachedName = morphName.getTextString();
        
        return morphName;
    },


    createSampleProtoypes: function(){
        var container = new lively.morphic.Morph.makeRectangle(lively.rect(1, 1, this.getExtent().x - 2, this.getExtent().y / 6));
        container.setFill(Color.white);
        container.setBorderWidth(0);
        container.setBorderRadius(5);
        var containerLayout = new lively.morphic.Layout.HorizontalLayout();
        containerLayout.setSpacing(10);
        containerLayout.borderSize = 7;
        container.setLayouter(containerLayout);
        container.disableDropping();
        container.disableGrabbing();
        this.addMorph(container);
        
        // add border line
        var line = new lively.morphic.Path([pt(0, this.getExtent().y / 6), pt(this.getExtent().x, this.getExtent().y / 6)]);
        line.setBorderColor(Color.rgb(66, 139, 202));
        this.addMorph(line);
        
        // add prototype components
        var showedMorphs = 5;
        this.getPrototypeComponents().reverse().each(function(eachCreateFunction, index){
            if (index <= showedMorphs) {
                var morph = eachCreateFunction.create();
                container.addMorph(morph);
            }
        });
        
        // update container Layout
        setTimeout(function(){container.getLayouter().layout(container, container.submorphs);}.bind(this), 1);
        
        if (showedMorphs <= this.getPrototypeComponents().length) return;
        
        // add ... for more prototype components
        var moreContainer = new lively.morphic.Morph.makeRectangle(lively.rect(50, 10, 20, 20));
        moreContainer.setFill(Color.white);
        moreContainer.setBorderWidth(0);
        moreContainer.disableGrabbing();
        for (var index = 0; index < 3; index++){
            var circle = lively.morphic.Morph.makeCircle(pt(0, 0), 2, 0, Color.black, Color.black);
            circle.setPosition(pt(index * 5 + 2, 8));
            circle.eventsAreIgnore = true;
            circle.disableGrabbing();
            moreContainer.addMorph(circle);
        };
        
        // add menu to moreContainer
        var _this = this;
        moreContainer.onMouseUp = function(){
            var items = _this.getPrototypeComponents()
                .splice(showedMorphs, _this.getPrototypeComponents().length - showedMorphs)
                .map(function(ea) {
                    return [ea.name, function() {
                        var morph = ea.create();
                        morph.openInHand();
                    }];
                });
            var menu = new lively.morphic.Menu("Add prototype morph", items);
            menu.openIn($world, this.getPositionInWorld());
        }
        container.addMorph(moreContainer);
    },
    
    getPrototypeComponents: function() {
        var createOnMouseDownFor = function(morphName) {
            return function(evt) {
                var prototype = this.copy();
                prototype.setPosition(pt(-4, -4));
                prototype.setExtent(this.bigExtent || pt(20, 20));
                prototype.setName(morphName);
                prototype.isPrototypeMorph = true;
                prototype.openInHand();
            };
        }
        var componentNames = [
            {
                create: function() {
                    var rectangle = lively.morphic.Morph.makeRectangle(lively.rect(0, 0, 10, 20));
                    rectangle.setBorderWidth(0);
                    rectangle.setFill(Color.rgb(66, 139, 202));
                    rectangle.bigExtent = pt(20, 60);
                    rectangle.onMouseDown = createOnMouseDownFor("rectangle");
                    return rectangle;
                }
            },
            {
                create: function() {
                    var circle = lively.morphic.Morph.makeCircle(pt(0, 0), 5, 0, Color.black, Color.rgb(66, 139, 202));
                    circle.bigExtent = pt(50, 50);
                    circle.onMouseDown = createOnMouseDownFor("circle");
                    return circle;
                }
            },
            {
                create: function() {
                    var line = lively.morphic.Morph.makeLine([pt(0, 0), pt(10, 20)], 2, Color.rgb(66, 139, 202));
                    line.onMouseDown = createOnMouseDownFor("line");;
                    return line;
                }
            },
            {
                create: function(){
                    var text = lively.morphic.Text.makeLabel("A");
                    text.bigExtent = pt(17, 24);
                    text.eventsAreIgnored = false;
                    text.setTextColor(Color.rgb(66, 139, 202));
                    text.onMouseDown = createOnMouseDownFor("text");
                    return text;
                }
            }, 
            {   
                create: function() {
                    var pieSector = new lively.morphic.Charts.PieSector(45, 20);
                    pieSector.bigExtent = pt(90, 90);
                    pieSector.onMouseDown = createOnMouseDownFor("pieSector");;
                    return pieSector;
                }
            }
        ];
        
        return componentNames;
    },

    attachListener: function attachListener(aMorph, force) {
        var _this = this;
        if (!force && aMorph.listenersAttached)
            return;
        aMorph.listenersAttached = true;
        
        if (!aMorph.layout) {
            aMorph.layout = {};
        }
        aMorph.layout.adjustForNewBounds = true;

        aMorph.isPrototypeMorph = true;
        
        var methods = ["setExtent", "setFill", "setRotation", "setOrigin"];
        
        methods.each(function(methodName) {
           var oldFn = aMorph[methodName];
           
           aMorph[methodName] = function() {
                var argsForOldFn = Array.prototype.slice.call(arguments);

                oldFn.apply(aMorph, argsForOldFn);
                var applyToExistingCopies = false;
                if (applyToExistingCopies && _this.copiedMorphs) {
                    _this.copiedMorphs.map(function(copiedMorph) {
                        oldFn.apply(copiedMorph, argsForOldFn);
                    });
                }
                
                // save the function call so that it can be replayed
                aMorph.__appliedCommands = aMorph.__appliedCommands || {};
                
                var appliedCommand = {fn: oldFn, args: argsForOldFn};
                
                aMorph.__appliedCommands[methodName] = appliedCommand;
                
                Functions.debounceNamed(_this.id, 1000, function() {
                    _this.owner.component.onContentChanged();
                })();
           };
        });
        
        // override addMorph
        var oldAddMorphFn = aMorph.addMorph;
        aMorph.addMorph = function(newMorph) {
            _this.owner.addCategoryFor(newMorph);
            var argsForOldFn = Array.prototype.slice.call(arguments);
            oldAddMorphFn.apply(aMorph, argsForOldFn);
            _this.attachListener(newMorph);
        };
        
        var oldRemoveMorphFn = aMorph.remove;
        aMorph.remove = function(temporary) {
            oldRemoveMorphFn.apply(this, arguments);
            if (!temporary) {
                _this.owner.removeCategoryOf(this);
            }
        };
        
        // backup ID so that we can match the mappings for prototype submorphs with their cloned correspondencies
        aMorph.savedID = aMorph.id;
    }
});


    
lively.morphic.Morph.subclass("lively.morphic.Charts.Dashboard", {
    
    initialize: function($super, env) {
        $super();
        this.reposition();
        this.setFill(Color.rgbHex("#f0ad4e"));
        this.setFillOpacity(0.1);
        this.setClipMode("auto");
        this.setName("Dashboard");
        this.startLayouting();
        
        this.env = env;
        if (!this.env.interaction) this.env.interaction = {};
        
        this.reframeHandle = this.addMorph(new lively.morphic.ReframeHandle('left', pt(5, this.getExtent().y)));
        this.reframeHandle.registerForEvent("dblclick", this, "minimize", true);
    },
    alignAllHandles: function() {
        this.reframeHandle.alignWithWindow();
    },
    
    startLayouting: function () {
        this.isLayouting = true;
        this.startStepping(500, "layoutDashboard");
    },
    
    layoutDashboard: function() {
        var space = pt(0, 20);
        this.findMorphsToLayout().inject(pt(20, space.y),
            function(lastPos, ea) {
                ea.align(ea.bounds().topLeft(), lastPos);
                return ea.bounds().bottomLeft().addPt(space);
            }, this)
        var halos = this.world().currentHaloTarget &&
            this.world().currentHaloTarget.halos;
        if (halos)
            halos.invoke('alignAtTarget');
    },
    
    findMorphsToLayout: function() {
        var halos = this.world().currentHaloTarget && this.world().currentHaloTarget.halos;
        // check if dragging etc...
        if (halos && halos.detect(function(ea) {
                return ea.infoLabel && ea.infoLabel.owner
            })){
            return [];
        }
        return this.submorphs.select(function(ea) {
            return ea instanceof lively.morphic.Charts.Component; 
        }, this).reject(function(ea) {
            return ea.isEpiMorph || (ea instanceof lively.morphic.HandMorph) 
            || ea == this
            || ea.isMetaTool
            || ea instanceof lively.morphic.Window
            || !ea.dashboardLayoutable()
        }, this).sortBy(function(ea) {
            return ea.bounds().topLeft().y
        })
    },
    
    update: function() {
        var _this = this;
        Properties.own(this.env).each(function(ea) {
            var viewer = _this.getSubmorphsByAttribute("envKey", ea)[0];
            if (!viewer) {
                viewer = _this.addViewer(ea);
            }
        
            viewer.update(_this.env[ea]);
            viewer.updated = true;
        });
        this.removeUnusedViewers();
    },
    onrestore: function($super) {
        $super();
        var _this = this;
        // do this at the very end of loading the world, since it uses sendToBack
        // and this should be called after all other morphs have been created
        setTimeout(function() {
            _this.reposition();
        }, 0);
        
    },


    
    removeUnusedViewers: function() {
        this.submorphs.each(function(ea) {
            // Leave submorphs without updated-attr. untouched
            if (ea.updated == undefined) return;
                
            if (!ea.updated) {
                ea.remove();
            } else {
                ea.updated = false;
            }
        })
    },
    
    addViewer: function(envKey) {
        var content;
        if (envKey === "interaction") {
            content = "InteractionPanel";
        } else if (envKey.indexOf("canvas") != -1){
            // envKey contains "canvas"
            content = "Canvas";
        } else {
            content = "JsonViewer";
        }
        var viewer = lively.morphic.Charts.Component.createWindow(content);
        viewer.envKey = envKey;
        viewer.setName(envKey + "Viewer");
        viewer.setExtent(pt(this.getExtent().x - 40, viewer.getExtent().y));
        viewer.setPosition(pt(20, 20));
        viewer.description.setTextString(viewer.description.getTextString() + " - " + envKey);
        
        this.addMorph(viewer);
        
        return viewer;
    },

    
    minimize: function() {
        var minimizedWidth = 25;

        this.setExtent(pt(minimizedWidth, window.innerHeight));
        this.setPosition(pt(window.innerWidth - minimizedWidth, 0));
    },
    
    reposition: function() {
        var scrollbarOffset = 15;
        var height = window.innerHeight - scrollbarOffset;
        var width = window.innerWidth / 2;
        
        //interaction panel should have max 800 px width and min of half window width
        if (width > 800){
            width = 800;
        }
        

        this.setExtent(lively.pt(width, height));
        this.setPosition(lively.pt(window.innerWidth - width - scrollbarOffset, 0))
        
        //update exentent of all viewers in the dashboard
        this.submorphs.each(function (viewer){
            if (viewer instanceof lively.morphic.Charts.Component){
                viewer.setExtent(pt(width - 40, viewer.getExtent().y));
            }
        });
        
        // while reloading the world, everything else must be done before doing this
        var _this = this;
        setTimeout(function() {
            _this.sendToBack();
            _this.setFixedPosition(true);
        }, 0);
    },

});

lively.morphic.Charts.DroppingArea.subclass("lively.morphic.Charts.InteractionArea", {
    
    initialize: function($super, extent) {
        $super(extent);
        this.setName("InteractionArea");
        this.dashboard = $morph("Dashboard");
        this.setBorderWidth(0);
        this.plusButton.setColor(Color.rgbHex("f0ad4e"));
    },

    overrideGetter: function(interactions, key) {
        interactions["_" + key] = interactions[key];
        interactions.__defineGetter__(key, function() {
            if (window.activeComponent) {
                window.activeComponent.interactionVariables.pushIfNotIncluded(key);
            }
            return interactions["_" + key];
        })
        interactions.__defineSetter__(key, function(value) {
            interactions["_" + key] = value;
        })
    },

    attachListener: function(aMorph, force) {
        // This is actually the wrong place to do this, but if it's done
        // during initialization, the PlusButton can not be positioned at the 
        // bottom left corner, although it is not layouted at all!
        if (!this.getLayouter()) {
            // have a Layout to sort the interaction parts vertically
            this.setLayouter(new lively.morphic.Layout.VerticalLayout());
        }
        // only attach listener once
        // don't attach listeners, if a container is dragged around
        if ((!force && aMorph.listenersAttached) || aMorph.isContainer)
            return;

        aMorph.listenersAttached = true;
        
        var dashboard = this.dashboard;
        var interactionArea = this;
        
        // attach remove -> remove interaction variable
        var oldRemove = aMorph.remove;
        
        aMorph.remove = function() {
            if (this.owner instanceof lively.morphic.Charts.InteractionArea) {
                this.owner.removeVariable(this.getName());
                if (this.interactionConnections)
                    this.interactionConnections.each(function(ea) {
                        ea.disconnect();
                    });
            }
            oldRemove.apply(aMorph, arguments);
        }
        
        // attach onDropOn -> create interaction variable and connections
        var oldOnDropOn = aMorph.onDropOn;

        aMorph.onDropOn = function() {
            if (arguments[0] instanceof lively.morphic.Charts.InteractionArea) {
                // When dropping arbitrary morphs into the InteractionArea, we ask the user for the connectionAttribute
                if (!this.connectionAttribute) {
                    var _this = this;
                    var setConnectionAttribute = function(attr) {
                        _this.connectionAttribute = attr;
                        _this.createContainer();
                        _this.createInteractionVariable();
                    }
                    var description = "Choose attribute of to connect with";
                    $world.prompt(description, setConnectionAttribute, {input: "value"})
                } else {
                    this.createContainer();
                    this.createInteractionVariable();
                }
            }
        }
        
        aMorph.createContainer = function() {
            var name = this.getName();
            var attribute = this.connectionAttribute;
            
            // Create text field for the variable's name
            var nameField = new lively.morphic.Text(rect(0, 0, 100, 25), name);
            nameField.setPosition(pt(this.getExtent().x + 2, 0));
            nameField.setName("NameField");
            connect(nameField, "textString", this, "setName");
            
            // Create text field for the variable's value
            var valueField = new lively.morphic.Text(rect(0, 0, 100, 25), this[attribute]);
            valueField.setPosition(nameField.getPosition().addPt(pt(nameField.getExtent().x + 2, 0)));
            valueField.setName("ValueField");
            connect(this, attribute, valueField, "setTextString");
            
            // Create container
            var container = new lively.morphic.Box(rect(0, 0, 10, 10));
            container.setFill(Color.white);
            container.setBorderWidth(1);
            container.setBorderColor(Color.rgb(240,173,78));
            container.setBorderRadius(5);
            container.isContainer = true;
            container.setLayouter(new lively.morphic.Layout.HorizontalLayout());
            container.addMorph(nameField);
            container.addMorph(valueField);
            container.addMorph(this);
            
            // don't let submorphs overlap the right border
            container.setExtent(pt(
                container.getBounds().width + container.layout.layouter.verticalBorderSpace() / 2,
                container.getExtent().y
            ));

            
            var oldRemove = container.remove;
            
            var _this = this;
            container.remove = function() {
                interactionArea.removeVariable(_this.getName());
                oldRemove.apply(container, arguments);
            }
            
            $morph("InteractionArea").addMorph(container);
        }
            
        aMorph.updateObservers = function(value) {
            interactionArea.updateObservers(value, this.getName());
        }
        
        aMorph.createInteractionVariable = function() {
            var name = this.getName();
            var attribute = this.connectionAttribute;
            
            // create new interaction variable, if it does't exist
            if (!dashboard.env.interaction[name]){
                console.log("create interaction variable: " + name);
                
                // Create interaction variable
                dashboard.env.interaction[name] = this[attribute];
                this.interactionConnections = [];
                
                // update the interaction variable value when the attribute is changed
                this.interactionConnections.push(connect(this, attribute, dashboard.env.interaction, name));
                
                // update all components that use this interaction variable
                this.interactionConnections.push(connect(this, attribute, this, "updateObservers"));
                
                interactionArea.overrideGetter(dashboard.env.interaction, aMorph.getName());
            }
            
            // set the name of the Container
            this.owner.setName(name + "Container");
        }
        
        // if all the listeners are forced to reattach, overrideGetters again
        if (force) {
            this.overrideGetter(dashboard.env.interaction, aMorph.getName());
        }
        
        // attach setName -> update interaction variable, TODO: update connections
        var oldSetName = aMorph.setName;
        
        aMorph.setName = function() {
            var oldName = this.getName();
            oldSetName.apply(aMorph, arguments);
            this.interactionConnections.each(function(ea) {
                ea.disconnect();
            });
            interactionArea.renameVariable(oldName, this);
        }
    },
    updateObservers: function(value, key) {
        this.getObservers(key).each(function (ea) {
            ea.onContentChanged();
            ea.highlight();
        });
    },
    renameVariable: function(oldName, inputMorph) {
        this.removeVariable(oldName);
        inputMorph.createInteractionVariable();
    },
    getContextMenuComponents: function() {
        var componentNames = [
            {
                name: "range",
                create: function() {
                    var part = $world.loadPartItem("Slider", "PartsBin/Inputs");
                    part.connectionAttribute = "value";
                    return part;
                },
            },
            {
                name: "text",
                create: function() {
                    var part = $world.loadPartItem("InputField", "PartsBin/Inputs");
                    part.connectionAttribute = "textString";
                    return part;
                },
            },
            {
                name: "color",
                create: function() {
                    var part = $world.loadPartItem("ColorPickerButton", "PartsBin/Inputs");
                    part.connectionAttribute = "color";
                    return part;
                },
            },
            {
                name: "toggle",
                create: function() {
                    var part = $world.loadPartItem("ToggleButton", "PartsBin/Inputs");
                    part.connectionAttribute = "isToggled";
                    return part;
                },
            },
            {
                name: "dropdown",
                create: function() {
                    var part = $world.loadPartItem("DropDownList", "PartsBin/Inputs");
                    part.connectionAttribute = "selection";
                    return part;
                },
            },
            {
                name: "spinner",
                create: function() {
                    var part = $world.loadPartItem("Spinner", "PartsBin/BP2013H2");
                    part.connectionAttribute = "value";
                    return part;
                },
            },
            {
                name: "checkbox",
                create: function() {
                    var part = $world.loadPartItem("CheckBox", "PartsBin/Inputs");
                    part.connectionAttribute = "checked";
                    return part;
                },
            },
            {
                name: "startStopSlider",
                create: function() {
                    var part = $world.loadPartItem("StartStopSlider", "PartsBin/BP2013H2");
                    part.connectionAttribute = "value";
                    return part;
                },
            },
        ];
        
        return componentNames;
    },
    removeVariable: function(name) {
        console.log("remove interaction variable: " + name);
        delete $morph("Dashboard").env.interaction[name];
        delete $morph("Dashboard").env.interaction["_" + name];
        this.getObservers(name).each(function (ea) {
            ea.interactionVariables.remove(name);
        })
    },
    getObservers: function(interactionVariable) {
        var all = lively.morphic.Charts.DataFlowComponent.getAllComponents();
        return all.filter(function (ea) {
            return ea.interactionVariables.indexOf(interactionVariable) >= 0
        });
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Component", {

    initialize: function($super, content) {
        $super();

        this.content = content;
        this.content.component = this;
        
        this.setExtent(this.content.extent);
        
        this.componentHeader = this.createComponentHeader();
        this.componentBody = this.createComponentBody();

        this.layout = {adjustForNewBounds: true};
        this.wasDragged = false;
        this.interactionVariables = [];
        this.interactionVariableFields = [];
        
        this.minimizeOnHeaderClick();
        this.makeReframeHandles();
        
        this.componentHeader.addMorph(this.createCloser());
        this.componentHeader.addMorph(this.createSwapper());
    },
    
    createCloser: function() {
        var closer = new lively.morphic.Charts.Closer();
        closer.setPosition(pt(this.getExtent().x - 18, 7));
        closer.layout = {moveHorizontal: true}
        
        return closer;
    },
    
    createSwapper: function() {
        var swapper = new lively.morphic.Charts.Swapper();
        swapper.setPosition(pt(this.getExtent().x - 40, 7));
        swapper.layout = {moveHorizontal: true}
        
        return swapper;
    },
    
    swapContent: function(newContentName) {
        var newContent = new lively.morphic.Charts[newContentName]();
        
        newContent.setExtent(this.content.getExtent());
        newContent.setPosition(this.content.getPosition());
        
        this.content.remove();
        this.content = newContent;
        this.content.component = this;
        
        if (!this.content.layout) {
            this.content.layout = {};
        }
        this.content.layout.resizeWidth = true;
        this.content.layout.resizeHeight = true;
        this.content.layout.adjustForNewBounds = true;
        
        this.componentBody.addMorph(newContent);
        this.content.update(this.data);
        
        this.description.setTextString(this.content.description);
    },

    createMinimizer: function() {
        // abstract
    },
    createComponentBody: function() {
        var componentBody = new lively.morphic.Morph();
        componentBody.setName("ComponentBody");
        componentBody.setStyleClassNames(["ComponentBody"]);
        
        var headerHeight = 24;
        componentBody.setExtent(this.getExtent().subPt(pt(2, headerHeight)));
        componentBody.setPosition(pt(0, headerHeight));
        
        componentBody.setStyleSheet(this.getBodyCSS());
        componentBody.setFill();
        componentBody.setBorderStyle();
        
        this.addMorph(componentBody);
        
        componentBody.layout = {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        };
        
        componentBody.disableGrabbing();
        componentBody.disableDragging();
        
        if (!this.content.layout) {
            this.content.layout = {};
        }
        
        this.content.layout.resizeWidth = true;
        this.content.layout.resizeHeight = true;
        this.content.layout.adjustForNewBounds = true;
        
        this.content.setExtent(componentBody.getExtent().subPt(pt(6, 6)));
        this.content.setPosition(pt(3, 3));
        componentBody.addMorph(this.content);
        
        return componentBody;
    },

    onContentChanged: function() {
        // abstract
    },

    minimize: function(evt) {
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            if (this.isMinimized) {
                this.setExtent(pt(this.getExtent().x, this.maximizedHeight));
                this.componentBody.setVisible(true);
                this.isMinimized = false;
            }
            else {
                this.maximizedHeight = this.getExtent().y;
                this.componentBody.setVisible(false);
                this.setExtent(pt(this.getExtent().x, 24 + 7));
                this.isMinimized = true;
            }
        }
    },
    
    createComponentHeader: function() {
        var headerHeight = 24;
        var header = new lively.morphic.Morph();
        header.setName("ComponentHeader");
        header.setStyleClassNames(["ComponentHeader"]);
        header.setExtent(pt(this.getExtent().x, headerHeight));
        header.ignoreEvents();
        header.setAppearanceStylingMode(false);
        header.setStyleSheet(this.getHeaderCSS());
        header.setFill();
        header.setBorderStyle();
        header.setAppearanceStylingMode(false);
        
        this.addMorph(header);
        
        header.layout = {
            adjustForNewBounds: true,
            resizeWidth: true
        };
        
        var text = new lively.morphic.Text();
        text.setName("Description");
        text.setExtent(pt(50, 24));
        text.setFillOpacity(0);
        text.setBorderWidth(0);
        text.ignoreEvents();
        text.setTextColor(Color.white);
        text.setFontSize(11);
        text.setWhiteSpaceHandling("nowrap");
        text.setTextString(this.content.description);
        
        this.description = text;
        header.addMorph(this.description);

        this.errorText = this.createErrorText();
        header.addMorph(this.errorText);
        
        return header;
    },
    setDescription: function(string) {
        this.description.setTextString(string);
    },
    
    createErrorText: function() {
        var t = new lively.morphic.Text();
        t.setTextString("");
        t.setName("ErrorText");
        
        // don't ask, that's lively
        var _this = this;
        setTimeout(function() {
            var descriptionWidth = _this.getSubmorphsByAttribute("name", "Description")[0].getTextBounds().width;
            t.setExtent(pt(_this.getExtent().x - descriptionWidth - 80, 20));
            t.setPosition(pt(descriptionWidth + 20, 0));            
        }, 10);

        t.setFontSize(10);
        t.setFillOpacity(0);
        t.setBorderWidth(0);
        t.setClipMode("hidden");
        t.setWhiteSpaceHandling("nowrap");
        t.layout = {resizeWidth: true};
        t.disableEvents();
        return t;
    },
    
    applyDefaultStyle: function() {
        this.componentHeader.setStyleSheet(this.getHeaderCSS());
        this.componentBody.setStyleSheet(this.getBodyCSS());
        
        this.description.setTextColor(Color.white);
        
        this.errorText.setTextColor(Color.white);
        var minimizer = this.getSubmorphsByAttribute("name", "Minimizer");
        if (minimizer.length)
        {
            minimizer[0].applyDefaultStyle();
        }
    },
    
    applyErrorStyle: function() {
        
        var errorColor = Color.rgb(169, 68, 66);
        // It seems as the color cannot be set via CSS?
        this.description.setTextColor(errorColor);
        this.errorText.setTextColor(errorColor);
        
        this.componentHeader.setStyleSheet(this.getErrorHeaderCSS());
        this.componentBody.setStyleSheet(this.getErrorBodyCSS());
        
        
        
        var minimizer = this.getSubmorphsByAttribute("name", "Minimizer");
        if (minimizer.length)
        {
            minimizer[0].applyErrorStyle();
        }
    },
    
    getBodyCSS: function() {
        // abstract
    },
    
    getHeaderCSS: function() {
        // abstract
    },
    
    minimizeOnHeaderClick: function() {
        var _this = this;
        this.onMouseUp = function(evt) {
            if (!(evt.target.className === "Morph ComponentHeader"))
                return;
                
            var headerClicked = _this.componentHeader.fullContainsWorldPoint(pt(evt.pageX, evt.pageY));
            if (headerClicked) {
                _this.minimize(evt);
            }
        }
    },
    
    wantsToBeDroppedInto: function($super, target) {
        var ownerChain = target.ownerChain();
        ownerChain.unshift(target);

        // find owner which is Charts.Component
        for (var i = 0; i < ownerChain.length; i++) {
            var proto = Object.getPrototypeOf(ownerChain[i]);
            while (proto != null) {
                if (proto == lively.morphic.Charts.Component.prototype)
                    return false;
                proto = Object.getPrototypeOf(proto);
            }
        }

        return $super(target);
    },
    dashboardLayoutable: function() {
        return this.content.dashboardLayoutable;
    },
    remove: function($super) {
        $super();

        if (!this.wasDragged) {
            // notify the content of the removal
            this.content.remove();
        }
    },

    
    makeReframeHandles: function () {
        var context = this;
        context.spacing = 4;
        // create three reframe handles (bottom, right, and bottom-right) and align them to the window
        var e = context.getExtent();
        context.reframeHandle = context.addMorph(new lively.morphic.ReframeHandle('corner', pt(14,14)));
        context.reframeHandle.setName("ReframeHandle");
        context.rightReframeHandle = context.addMorph(new lively.morphic.ReframeHandle('right', e.withX(context.spacing)));
        context.rightReframeHandle.setName("RightReframeHandle");
        context.bottomReframeHandle = context.addMorph(new lively.morphic.ReframeHandle('bottom', e.withY(context.spacing)));
        context.bottomReframeHandle.setName("BottomReframeHandle");
        context.alignAllHandles();
    },
    
    alignAllHandles: function (optMorph) {
        var context = optMorph || this;
        var handles = [context.reframeHandle, context.bottomReframeHandle, context.rightReframeHandle];
        handles.forEach(function (each) {
            if (each && each.owner) {
                each.alignWithWindow();
            }
        })
    },
    
    removalNeedsConfirmation: function() {
        return this.content.removalNeedsConfirmation();
    }
});

Object.extend(lively.morphic.Charts.Component, {
    create: function(componentName) {
        if (componentName == "FanIn" || componentName == "FanOut") {
            return new lively.morphic.Charts[componentName]();
        } else {
            return new lively.morphic.Charts.DataFlowComponent(new lively.morphic.Charts[componentName]());
        }
    },
    createWindow: function(componentName) {
        return new lively.morphic.Charts.WindowComponent(new lively.morphic.Charts[componentName]());
    },
    getComponentNames: function() {
        return [
            "Script",
            "FanOut",
            "FanIn",
            "JsonViewer",
            "LinearLayout",
            "MorphCreator",
            "JsonFetcher",
            "Canvas",
            "Table",
            "EntityViewer",
            "InteractionPanel",
            "DataImporter",
            "WebPage"
        ];
    }
});


lively.morphic.Charts.Component.subclass("lively.morphic.Charts.WindowComponent", {

    initialize: function($super, content) {
        $super(content);
    
        this.isDragged = true;
        this.position = this.getPositionInWorld();
    },
    
    onDragStart: function($super, evt) {
        this.isDragged = true;
        this.wasDragged = true;
        $super(evt);
    },
    
    onDropOn: function($super, aMorph) {
        $super(aMorph);
        
        this.isDragged = false;
    },
    
    update: function(data) {
        this.data = data;
        this.content.update(data);
    },



    onDrag: function($super, evt) {
        $super();
        this.position = this.getPositionInWorld();
    },
    remove: function($super) {
        $super();
        
        var line = $morph("Line" + this);
        if (!this.isDragged && line)
            line.remove();
    },

    onContentChanged: function() {
        // do nothing
    },
    
    createMinimizer: function() {
        var minimizer = new lively.morphic.Charts.Minimizer();
        minimizer.setPosition(pt(this.getExtent().x - 42, 8));
        minimizer.layout = {moveHorizontal: true}
        
        return minimizer;
    },
    
getBodyCSS: function() {
        return ".ComponentBody {\
            background-color: rgb(255, 255, 255) !important;\
            border-width: 1px !important;\
            border-color: #f0ad4e !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: 0px !important;\
            margin-left: 0px !important;\
            margin-right: 0px !important;\
            margin-top: 0px !important;\
            padding-bottom: 0px !important;\
            padding-left: 0px !important;\
            padding-right: 0px !important;\
            padding-top: 0px !important;\
            position: relative !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            box-shadow: 0 10px 20px rgba(0,0,0,.2) !important;\
        }";
    },
    
getHeaderCSS: function() {
    return	".ComponentHeader { \
        background-color: #f0ad4e !important; \
        color: white !important; \
        background-attachment: scroll !important;\
        background-clip: border-box !important;\
        background-image: none !important;\
        background-origin: padding-box !important;\
        background-size: auto !important;\
        border-bottom-color: #f0ad4e !important;\
        border-bottom-style: solid !important;\
        border-bottom-width: 1px !important;\
        border-image-outset: 0px !important;\
        border-image-repeat: stretch !important;\
        border-image-slice: 100% !important;\
        border-image-source: none !important;\
        border-image-width: 1 !important;\
        border-left-color: #f0ad4e !important;\
        border-left-style: solid !important;\
        border-left-width: 1px !important;\
        border-right-color: #f0ad4e !important;\
        border-right-style: solid !important;\
        border-right-width: 1px !important;\
        border-top-color: #f0ad4e !important;\
        border-top-style: solid !important;\
        border-top-width: 1px !important;\
        box-sizing: border-box !important;\
        color: rgb(255, 255, 255) !important;\
        cursor: auto !important;\
        display: block !important;\
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
        font-size: 14px !important;\
        line-height: 20px !important;\
        margin-bottom: -1px !important;\
        padding-bottom: 10px !important;\
        padding-left: 10px !important;\
        padding-right: 15px !important;\
        padding-top: 2px !important;\
        position: relative !important;\
        text-decoration: none solid rgb(255, 255, 255) !important;\
        z-index: 2 !important;\
        font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
        -webkit-box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
        box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
        border-width: 1px !important;\
    }";
}
});

Object.subclass('lively.morphic.Charts.ExcelConverter',
'default category', {
    convertFromFile: function(file) {
        var deferred = new $.Deferred();
        var _this = this;
        this.ensureXLSisLoaded().then(function() {
            _this.processBlob(file, deferred);  
        });
        return deferred.promise();
    },
    
    convertFromFilePath: function(filePath) {
        var deferred = new $.Deferred();
        var _this = this;
        this.ensureXLSisLoaded().then(function() {
            var xhr = new XMLHttpRequest();
            xhr.open('GET', filePath, true);
            xhr.responseType = 'blob';
            
            xhr.onload = function(e) {
              if (this.status == 200) {
                _this.processBlob(this.response, deferred);
              } else {
                  deferred.reject(this.status);
              }
            };
            
            xhr.send();
        });
        
        return deferred.promise();
    },
    processBlob: function(blob, deferred) {
        var reader = new FileReader();
        var _this = this;
        reader.onload = function(e) {
        	var data = e.target.result;
        	var wb = XLS.read(data, {type:'binary'});
        	
        	var xlsAsJson = _this.convertWorkbookToJson(wb);
        	console.log("xlsAsJson", xlsAsJson);
        	deferred.resolve(xlsAsJson);
        };
        reader.readAsBinaryString(blob);
    },
    convertWorkbookToJson: function(workbook) {
    	var result = {};
    	workbook.SheetNames.forEach(function(sheetName) {
    		var rowObjectArray = XLS.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
    		if(rowObjectArray.length > 0){
    			result[sheetName] = rowObjectArray;
    		}
    	});
    	return result;
    },
    ensureXLSisLoaded: function() {
        // TODO: use a more lively way to load this dependency
        if (window.XLS)
            return new $.Deferred().resolve().promise();

        return $.getScript("http://oss.sheetjs.com/js-xls/xls.js");
    }
});

Object.subclass('lively.morphic.Charts.MrDataConverter',
'default category', {
    getParser: function() {
        // https://github.com/shancarter/mr-data-converter
        // Copyright (c) 2011 Shan Carter
        // 
        // Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the 'Software'), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:
        // 
        // The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.
        // 
        // THE SOFTWARE IS PROVIDED 'AS IS', WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
        //  CSVParser.js
        //  Mr-Data-Converter
        //
        //  Input CSV or Tab-delimited data and this will parse it into a Data Grid Javascript object
        //
        //  CSV Parsing Function from Ben Nadel, http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
        
        
        var isDecimal_re     = /^\s*(\+|-)?((\d+([,\.]\d+)?)|([,\.]\d+))\s*$/;
        
        var CSVParser = {
        
          //---------------------------------------
          // UTILS
          //---------------------------------------
        
          isNumber: function(string) {
            if( (string == null) || isNaN( new Number(string) ) ) {
              return false;
            }
            return true;
          },
        
        
          //---------------------------------------
          // PARSE
          //---------------------------------------
          //var parseOutput = CSVParser.parse(this.inputText, this.headersProvided, this.delimiter, this.downcaseHeaders, this.upcaseHeaders);
        
          parse: function (input, headersIncluded, delimiterType, downcaseHeaders, upcaseHeaders, decimalSign) {
        
            var dataArray = [];
        
            var errors = [];
        
            //test for delimiter
            //count the number of commas
            var RE = new RegExp("[^,]", "gi");
            var numCommas = input.replace(RE, "").length;
        
            //count the number of tabs
            RE = new RegExp("[^\t]", "gi");
            var numTabs = input.replace(RE, "").length;
        
            var rowDelimiter = "\n";
            //set delimiter
            var columnDelimiter = ",";
            if (numTabs > numCommas) {
              columnDelimiter = "\t"
            };
        
            if (delimiterType === "comma") {
              columnDelimiter = ","
            } else if (delimiterType === "tab") {
              columnDelimiter = "\t"
            }
        
        
            // kill extra empty lines
            RE = new RegExp("^" + rowDelimiter + "+", "gi");
            input = input.replace(RE, "");
            RE = new RegExp(rowDelimiter + "+$", "gi");
            input = input.replace(RE, "");
        
            // var arr = input.split(rowDelimiter);
            //
            // for (var i=0; i < arr.length; i++) {
            //   dataArray.push(arr[i].split(columnDelimiter));
            // };
        
        
            // dataArray = jQuery.csv(columnDelimiter)(input);
            dataArray = this.CSVToArray(input, columnDelimiter);
        
            //escape out any tabs or returns or new lines
            for (var i = dataArray.length - 1; i >= 0; i--){
              for (var j = dataArray[i].length - 1; j >= 0; j--){
                dataArray[i][j] = dataArray[i][j].replace("\t", "\\t");
                dataArray[i][j] = dataArray[i][j].replace("\n", "\\n");
                dataArray[i][j] = dataArray[i][j].replace("\r", "\\r");
              };
            };
        
        
            var headerNames = [];
            var headerTypes = [];
            var numColumns = dataArray[0].length;
            var numRows = dataArray.length;
            if (headersIncluded) {
        
              //remove header row
              headerNames = dataArray.splice(0,1)[0];
              numRows = dataArray.length;
        
            } else { //if no headerNames provided
        
              //create generic property names
              for (var i=0; i < numColumns; i++) {
                headerNames.push("val"+String(i));
                headerTypes.push("");
              };
        
            }
        
        
            if (upcaseHeaders) {
              for (var i = headerNames.length - 1; i >= 0; i--){
                headerNames[i] = headerNames[i].toUpperCase();
              };
            };
            if (downcaseHeaders) {
              for (var i = headerNames.length - 1; i >= 0; i--){
                headerNames[i] = headerNames[i].toLowerCase();
              };
            };
        
            //test all the rows for proper number of columns.
            for (var i=0; i < dataArray.length; i++) {
              var numValues = dataArray[i].length;
              if (numValues != numColumns) {this.log("Error parsing row "+String(i)+". Wrong number of columns.")};
            };
        
            //test columns for number data type
            var numRowsToTest = dataArray.length;
            var threshold = 0.9;
            for (var i=0; i < headerNames.length; i++) {
              var numFloats = 0;
              var numInts = 0;
              for (var r=0; r < numRowsToTest; r++) {
                if (dataArray[r]) {
                  //replace comma with dot if comma is decimal separator
                  if(decimalSign='comma' && isDecimal_re.test(dataArray[r][i])){
                    dataArray[r][i] = dataArray[r][i].replace(",", ".");
                  }
                  if (CSVParser.isNumber(dataArray[r][i])) {
                    numInts++
                    if (String(dataArray[r][i]).indexOf(".") > 0) {
                      numFloats++
                    }
                  };
                };
        
              };
        
              if ((numInts / numRowsToTest) > threshold){
                if (numFloats > 0) {
                  headerTypes[i] = "float"
                } else {
                  headerTypes[i] = "int"
                }
              } else {
                headerTypes[i] = "string"
              }
            }
        
        
        
        
        
            return {'dataGrid':dataArray, 'headerNames':headerNames, 'headerTypes':headerTypes, 'errors':this.getLog()}
        
          },
        
        
          //---------------------------------------
          // ERROR LOGGING
          //---------------------------------------
          errorLog:[],
        
          resetLog: function() {
            this.errorLog = [];
          },
        
          log: function(l) {
            this.errorLog.push(l);
          },
        
          getLog: function() {
            var out = "";
            if (this.errorLog.length > 0) {
              for (var i=0; i < this.errorLog.length; i++) {
                out += ("!!"+this.errorLog[i] + "!!\n");
              };
              out += "\n"
            };
        
            return out;
          },
        
        
        
          //---------------------------------------
          // UTIL
          //---------------------------------------
        
            // This Function from Ben Nadel, http://www.bennadel.com/blog/1504-Ask-Ben-Parsing-CSV-Strings-With-Javascript-Exec-Regular-Expression-Command.htm
            // This will parse a delimited string into an array of
            // arrays. The default delimiter is the comma, but this
            // can be overriden in the second argument.
            CSVToArray: function( strData, strDelimiter ){
              // Check to see if the delimiter is defined. If not,
              // then default to comma.
              strDelimiter = (strDelimiter || ",");
        
              // Create a regular expression to parse the CSV values.
              var objPattern = new RegExp(
                (
                  // Delimiters.
                  "(\\" + strDelimiter + "|\\r?\\n|\\r|^)" +
        
                  // Quoted fields.
                  "(?:\"([^\"]*(?:\"\"[^\"]*)*)\"|" +
        
                  // Standard fields.
                  "([^\"\\" + strDelimiter + "\\r\\n]*))"
                ),
                "gi"
                );
        
        
              // Create an array to hold our data. Give the array
              // a default empty first row.
              var arrData = [[]];
        
              // Create an array to hold our individual pattern
              // matching groups.
              var arrMatches = null;
        
        
              // Keep looping over the regular expression matches
              // until we can no longer find a match.
              while (arrMatches = objPattern.exec( strData )){
        
                // Get the delimiter that was found.
                var strMatchedDelimiter = arrMatches[ 1 ];
        
                // Check to see if the given delimiter has a length
                // (is not the start of string) and if it matches
                // field delimiter. If id does not, then we know
                // that this delimiter is a row delimiter.
                if (
                  strMatchedDelimiter.length &&
                  (strMatchedDelimiter != strDelimiter)
                  ){
        
                  // Since we have reached a new row of data,
                  // add an empty row to our data array.
                  arrData.push( [] );
        
                }
        
        
                // Now that we have our delimiter out of the way,
                // let's check to see which kind of value we
                // captured (quoted or unquoted).
                if (arrMatches[ 2 ]){
        
                  // We found a quoted value. When we capture
                  // this value, unescape any double quotes.
                  var strMatchedValue = arrMatches[ 2 ].replace(
                    new RegExp( "\"\"", "g" ),
                    "\""
                    );
        
                } else {
        
                  // We found a non-quoted value.
                  var strMatchedValue = arrMatches[ 3 ];
        
                }
        
        
                // Now that we have our value string, let's add
                // it to the data array.
                arrData[ arrData.length - 1 ].push( strMatchedValue );
              }
        
              // Return the parsed data.
              return( arrData );
            }
        
        
        
        }
        
        return CSVParser;        
    },
});

lively.morphic.Path.subclass('lively.morphic.Charts.PieSector',
'default category', {
    initialize: function($super, degree, radius, optCenter) {
        if (!degree) degree = 45;
        if (!radius) radius = 20;
        if (!optCenter) optCenter = pt(0,0);
        this.exactness = 1;
    
        var points = [optCenter];
        for (var i = 15; i <= degree; i += this.exactness){
            var radianMeasure = i / 360 * 2 * Math.PI;
            var x = Math.cos(radianMeasure) * radius + optCenter.x;
            var y = Math.sin(radianMeasure) * radius + optCenter.y;
            points.push(pt(x,y));
        }
        points.push(optCenter);
       
        $super(points);
        this.setOrigin(pt(0,0));
        
        // save parameter to pie createPieSector
        this.center = optCenter;
        this.radius = radius;
        this.degree = degree;
        this.setFill(Color.rgb(66, 139, 202));
        this.setBorderWidth(0);
        this.originalVertices = this.vertices();
        return this;
    },
    
    setScale: function(absoluteFactor) {
        var oldVertices = this.originalVertices;
        var newVertices = oldVertices.map(function(ea) { return ea.scaleBy(absoluteFactor) });
     
        this.setVertices(newVertices);
        this.cachedBounds = null;
        this._savedScale = absoluteFactor;
        this.center = newVertices[0];
        this.radius = (newVertices[0] - newVertices[1]).length;
    },

    setDegree: function(degree) {
        // calculate new vertices and discard old vertices
        var points = [this.center];
        for (var i = 0; i <= degree; i += this.exactness){
            var radianMeasure = i / 360 * 2 * Math.PI;
            var x = Math.cos(radianMeasure) * this.radius + this.center.x;
            var y = Math.sin(radianMeasure) * this.radius + this.center.y;
            points.push(pt(x,y));
        }
        points.push(this.center);
        
        this = new lively.morphic.Path(points);
        this.degree = degree;
        this.originalVertices = points;
        this._savedScale = 1;
        //this.cachedBounds = null;
       
    },
    setMappedProperty: function(value) {
        this.mappedProperty = value;
    },
    
    scaleBy: function(factor) {
        if (isNaN(factor))
            return;
        this.setScale((this._savedScale || 1) * factor);
    },
    
    setRadius: function(radius) {
        var vertices = this.vertices();
        
        // iterate over vertices but ignore first and last one because these are center points
        for (var i = 1; i < vertices.length - 1; i++){
            var radianMeasure = i*10 / 360 * 2 * Math.PI;
            var x = Math.cos(radianMeasure) * radius + this.center.x;
            var y = Math.sin(radianMeasure) * radius + this.center.y;
            vertices[i] = pt(x,y);
        }
        
        this.setVertices(vertices);
        this.originalVertices = vertices;
        this.radius = radius;
        this._savedScale = 1;
        //this.cachedBounds = null;
    },
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Content", {
    
    initialize: function($super) {
        $super();
        this.setClipMode("auto");
        this.isAutoEvalActive = true;
    },

    update: function(data) {
        // abstract
    },
    adaptBackgroundColor: function() {
        var backgroundColor = Color.white;
        if (!this.isAutoEvalActive) {
            backgroundColor = Color.rgbHex("EFEFEF");
        }
        this.submorphs[0].setFill(backgroundColor);
    },
    onKeyUp: function(evt) {
        if (evt.keyCode == 27) {
            // esc was pressed
            this.toggleAutoEvaluation();
        }
        
        if (this.isAutoEvalActive !== false) {
            this.component.onContentChanged();
        }
    },
    toggleAutoEvaluation: function() {
        // switch is used to avoid reinitialization of existing scenarios
        if (typeof this.isAutoEvalActive == "boolean") {
            this.isAutoEvalActive = !this.isAutoEvalActive;
        } else {
            this.isAutoEvalActive = false;
        }
        this.adaptBackgroundColor();
    },
    dashboardLayoutable: true,

    throwError: function(error) {
        this.component.throwError(error);
    },
    
    migrateFromPart: function(oldComponent) {
        // abstract
    },
    
    removalNeedsConfirmation: function() {
        return false;
    }
});

lively.morphic.Charts.Content.subclass("lively.morphic.Charts.InteractionPanel", {
    
    initialize : function($super){
        $super();
        this.description = "InteractionPanel";
        this.extent = pt(400, 200);
        
        this.dashboard = $morph("Dashboard");
        
        // don't ask why there is an extent of pt(0, 0)...
        this.droppingArea = new lively.morphic.Charts.InteractionArea(pt(0, 0));
        this.droppingArea.layout.resizeWidth = true;
        this.droppingArea.layout.resizeHeight = true;
        
        this.addMorph(this.droppingArea);
        
        
    },
    
    update: function(data) {
        // nothing to do
    },

    remove: function($super) {
        $super();
        
        var _this = this;
        Properties.own($morph("Dashboard").env.interaction).each(function (ea) {
            if (ea.indexOf("_") != 0) {
                _this.droppingArea.removeVariable(ea);
            }
        })
    },
    

});

lively.morphic.Charts.Content.subclass("lively.morphic.Charts.NullContent", {
    
    initialize : function($super) {
        $super();
        
        this.description = "";
        this.extent = pt(400, 40);
    },

    update: function(data) {
        return data;
    },
});

lively.morphic.Path.subclass("lively.morphic.Charts.Arrow", {
    
    initialize: function($super, aMorph, positionX) {
        
        this.componentMorph = aMorph;
        var arrowHeight = 10, arrowBase = 20;
        this.isLayoutable = false;
        var controlPoints = [pt(0, 0), pt(arrowBase, arrowHeight), pt(2 * arrowBase, 0)];
        
        $super(controlPoints);
        this.setBorderColor(Color.rgb(66, 139, 202));
        this.setFill(Color.rgb(66, 139, 202));
        this.setFillOpacity(0);
        this.addStyleClassName('dataflow-clickable');
        this.positionAtMorph(positionX);
        this.setBorderWidth(1);
        this.deactivate(true);
    },
    
    getTipPosition: function() {
        return this.getPositionInWorld().addPt(pt(this.getExtent().x / 2, this.getExtent().y)); 
    },
    
    isActive: function() {
        return this.activated;
    },
    
    toggle: function() {
        if(!this.activated)
            this.activate();
        else
            this.deactivate();
    },
    remove: function($super) {
        
        this.componentMorph.removeArrowFromArray(this);
        $super();
    },

    showContextMenu: function(position) {
        var _this = this;
        
        var componentNames = lively.morphic.Charts.Component.getComponentNames();
        
        var contextItems = componentNames.map(function(ea) {
            return [ea, function() {
                _this.deactivate();
                _this.createComponent(ea);
                _this.activate();
                _this.componentMorph.notifyNextComponent();
            }];
        });
        
        var menu = new lively.morphic.Menu("Add new data flow component", contextItems);
        menu.openIn($world, position);
    },

    newMethod: function() {
        // enter comment here
    },

    
    positionAtMorph: function(positionX) {
        var aMorph = this.componentMorph;
        var extent = aMorph.getExtent();
        
        var offsetX = (extent.x - this.getExtent().x) / 2;
        var offsetY = extent.y + 15;
        
        this.setPosition(pt(positionX || offsetX, offsetY));
        aMorph.addMorph(this);
        
        // Since addMorph removes the morph and adds it on the new owner,
        // remove is called on the arrow once. There it is also removed
        // from the componentMorph's arrows-array and needs to be pushed again.
        if (aMorph.arrows) {
            aMorph.arrows.push(this);
        }
    },
    
    activate: function() {
        this.activated = true;
        this.setBorderStyle('solid');
        this.componentMorph.onArrowActivated(this);
    },
    
    deactivate: function(optPreventPropagation) {
        this.activated = false;
        this.setBorderStyle('dotted');
        if (!optPreventPropagation) {
            this.componentMorph.onArrowDeactivated(this);
        }
    },
    
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.toggle();
        } else if (e.isRightMouseButtonDown()) {
            this.showContextMenu(e.scaledPos);
        }
    },
    
    createComponent: function(componentName) {
        var newComponent = new lively.morphic.Charts.Component.create(componentName);
        
        var extent =  this.componentMorph.getExtent();
        var offset = pt(0,extent.y + newComponent.componentOffset);
        
        var newPosition = this.componentMorph.getPosition().addPt(offset);
        newComponent.setPosition(newPosition);

        var componentBelow = this.componentMorph.getComponentInDirectionFrom(1, this.getTipPosition());
        if (componentBelow) {
            componentBelow.move(newComponent.getExtent().y + newComponent.componentOffset, newPosition.y + newComponent.getExtent().y);
        }
        
        $world.addMorph(newComponent);
        this.componentMorph.refreshConnectionLines();
    }
});
Object.subclass('lively.morphic.Charts.Utils',
'default category', {

});

Object.extend(lively.morphic.Charts.Utils, {
    arrangeOnCircle : function(data, radius, center, morphName) {
        // define morphs as array of all morphs which should be arranged
        var morphs = [];
        data.each(function (eachDatum){
            if (morphName)    
                morphs.push(eachDatum.morphs[morphName]);
            else 
                morphs = morphs.concat(Properties.ownValues(eachDatum.morphs));
        });
        
        // determine the margin, dependent of the maximum extent of all elements and the radius
        if (!Object.isObject(center)) {
            var maxOrigin = morphs.reduce(function (max, el) {
                var origin = el.getPosition().subPt(el.bounds().topLeft());
                var maxValue = Math.max(origin.x, origin.y);
                return pt(Math.max(maxValue, max.x), Math.max(maxValue, max.y));
            }, pt(0, 0));
            center = pt(10 + maxOrigin.x + radius, 10 + maxOrigin.y + radius);
        }
        
        var path = [];
        var curId = 0;
        for (var i = -90; i <= 270; i = i + 360.0 / (morphs.length)){
            var morph = morphs[curId];
            var radianMeasure = +(i / 360 * 2 * Math.PI).toFixed(4);
            var newPt = center.addPt(pt(Math.cos(radianMeasure) * radius, Math.sin(radianMeasure) * radius));
            morph.setPosition(newPt);
            if (morph.oldRotation !== undefined) morph.setRotation(morph.oldRotation);
            morph.oldRotation = morph.getRotation();
            morph.rotateBy(Math.PI / 2.0 + radianMeasure);
            curId++;
        }
    },
    arrangeOnPath: function(path, entity, rotateElements, morphName) {
        
        function sign(x) {
            return x ? x < 0 ? -1 : 1 : 0;
        }
        
        var morphs = [];
    	var morphObjects = entity.pluck("morphs");
    	morphObjects.each(function (eachMorphObject){
    	    if (morphName){
    	        morphs.push(eachMorphObject[morphName])
    	    } else {
    	        morphs = morphs.concat(Properties.ownValues(eachMorphObject));
    	    }
    	});
	
    	if (!morphs.length)
    	    return;
    	
    	// determine overall length of the path
    	var length = path.reduce(function (sum, cur, i, all) {
    		if (i > 0)
    			return sum + cur.dist(all[i - 1]);
    		else
    			return sum;
    	}, 0);
      
        var distance;
        if (path[0].subPt(path[path.length - 1]).r() < 0.1) {
            // path is closed, leave space between last and first element
    	    distance = length / (morphs.length);
        } else {
            // path is open, distribute elements evenly from start to end
            distance = length / (morphs.length - 1);
        }
        
        // set position of first morph and remove it from the array
        morphs[0].setPosition(path[0]);
        morphs.splice(0, 1);
    
        var lastPt = path[0];
    	var curPt = path[0];
    	var curPathIndex = 1;
    	var rotation = 0;

    	morphs.each( function (morph, index) {
    		var distanceToTravel = distance;
    		while (distanceToTravel) {
    			var pieceLength = curPt.dist(path[curPathIndex]);
    			if (pieceLength >= distanceToTravel || (index == morphs.length - 1 && curPathIndex == path.length - 1)) {
    			
    				var direction = path[curPathIndex].subPt(curPt);
    				curPt = curPt.addPt(direction.normalized().scaleBy(distanceToTravel));
    				morph.setPosition(curPt);
    				if (morph.oldRotation) morph.setRotation(morph.oldRotation);
    				if (rotateElements) {
    				    if (curPt.y == lastPt.y) {
    				        rotation = Math.PI / 2 + sign(lastPt.x - curPt.x) * (Math.PI / 2);
    				    } else {
    				        var sign = curPt.y > lastPt.y ? 1 : -1;
    				        rotation = Math.atan((curPt.x - lastPt.x) / (lastPt.y - curPt.y)) + sign * Math.PI / 2;
    				    }
    				    morph.oldRotation = morph.getRotation();
			            morph.rotateBy(rotation);
    				}
    				//lastPt = curPt;
    				distanceToTravel = 0;
    			} else {
    				curPt = path[curPathIndex];
    				lastPt = path[curPathIndex - 1];
    				curPathIndex++;
    				distanceToTravel -= pieceLength;
    			}
    		}
    	});
    },
    createConnection: function (entity1, entity2, connections) {
        connections.each( function (conn) {
            conn.morph.setEnd = function (point) {this.setVertices([pt(0, 0), point.subPt(this.getPosition())])};
            // var from = conn["get" + entity1]();
            // var to = conn["get" + entity2]();
            var from = conn[entity1];
            var to = conn[entity2];
            if (to.morph && from.morph) {
                connect(from.morph, "position", conn.morph, "setPosition", {});
                connect(to.morph, "position", conn.morph, "setEnd", {});
            }
        });
    },
    createCurvedConnection: function (entity1, entity2, connections) {
        connections.each( function (conn) {
            var from = conn[entity1];
            var to = conn[entity2];
            
            if (to.morph && from.morph) {
                var bezierDistance = 50;
                
                var getControlPointsForCurve = function(m1, m2) {
                    var halfDistance = m2.getPosition().subPt(m1.getPosition()).scaleBy(0.5);
                    return [
                        m1.getPosition(),
                        m1.getPosition().addXY(0, halfDistance.y),
                        m2.getPosition().addXY(0, -halfDistance.y),
                        m2.getPosition()
                    ];
                };
                
                var controlPoints = getControlPointsForCurve(from.morph, to.morph);
                
                conn.morph.updateCurve = function() {
                    setCurve(getControlPointsForCurve(from.morph, to.morph), this);
                };
                
                
                var setCurve = function(controlPoints, connectionMorph) {
                    var lineWidth = connectionMorph.getBorderWidth();
                    var ptToString = function(point) { return point.x + ',' + point.y };
                    var svgDescriptors = "M" + ptToString(controlPoints[0]) + "C" + controlPoints.slice(1)
                        .map(ptToString).join(' ');
                    
                    var bezierCurve = connectionMorph;
            
                    bezierCurve.shape.setPathElements(lively.morphic.Shapes.PathElement.parse(svgDescriptors));
                    bezierCurve.setPosition(lively.pt(0, 0));
            
                    // this fixes the wrong bounding box which can clip parts of the path
                    bezierCurve.shape.getBounds = function() {
                        var b = this.renderContext().pathNode.getBBox();
                        return new Rectangle(b.x - lineWidth, b.y - lineWidth, b.width + 2 * lineWidth, b.height + 2 * lineWidth);
                    };
                    bezierCurve.__dirtyFixTheBorderWidthFlag = true;
                };
                
                setCurve(controlPoints, conn.morph);
                
                connect(from.morph, "position", conn.morph, "updateCurve", {});
                connect(to.morph, "position", conn.morph, "updateCurve", {});
            }
        });
    },
    arrangeHorizontal: function(morphs, y, width, morphName) {
        console.log(morphs)
        if (!Object.isNumber(y)) {
            var maxY = morphs.pluck("morph").reduce(function (max, el) {
                var origin = el.getPosition().subPt(el.bounds().topLeft());
                return Math.max(origin.y, max);
            }, 0);
            y = 10 + maxY;
        }
        if (!Object.isNumber(width)) {
            width = this.defaultWidth;
        }
        
        var originX = morphs[0].morphs[Properties.own(morphs[0].morphs)[0]].getOrigin().x;
        if (morphName) originX = morphs[0].morphs[morphName].getOrigin().x;
        var x = 10 + originX;
        this.arrangeOnPath([pt(x, y), pt(x + width, y)], morphs);
    },
    defaultWidth: 350,
    arrange2D: function(data, propertyX, propertyY, rect, morphName) {
        // TODO: smart margin
        var bounds = rect || lively.rect(10, 10, 500, 500);

        var xMax = Math.max.apply(null, data.pluck(propertyX));
        var xMin = Math.min.apply(null, data.pluck(propertyX));
        var yMax = Math.max.apply(null, data.pluck(propertyY));
        var yMin = Math.min.apply(null, data.pluck(propertyY));
        
        var invalidNumbers = [xMax, xMin, yMax, yMin].some(function(ea) { return isNaN(ea)});
        if (invalidNumbers) {
            alert("arrange2D encountered NaN values in data");
        }
        
        data.each(function (ea) {
            var x = (ea[propertyX] - xMin) / (xMax - xMin);
            var y = (ea[propertyY] - yMin) / (yMax - yMin);
            
            if (morphName)
                ea.morphs[morphName].setPosition(pt(x, y).scaleBy(bounds.width, bounds.height).addPt(bounds.topLeft()));
            else
                Properties.own(ea.morphs).each(function (morphName){
                   ea.morphs[morphName].setPosition(pt(x, y).scaleBy(bounds.width, bounds.height).addPt(bounds.topLeft()));
                });
        });
    },
    addLegend: function(entries, startPt) {
        // entries is array of {name: "", color: xyz} and startPt is optional
        if(!startPt) startPt = pt(0, 0);
        var container = [];
        
        entries.each(function(eachEntry){
           var rectangle = lively.morphic.Morph.makeRectangle(lively.rect(0, 0, 20, 20));
           rectangle.setBorderWidth(0);
           rectangle.setFill(eachEntry.color);
           
           var text = lively.morphic.Text.makeLabel(eachEntry.name);
           text.setPosition(pt(25, 0))
           text.setExtent(pt(200, 20));
           
           rectangle.addMorph(text);
           container.push({morphs: { legend: rectangle}});
        });
        this.arrangeOnPath([startPt, startPt.addPt(pt(0, 20 * entries.length))], container);
        return container;
    },
    arrangeVertical: function(morphs, x, height, morphName) {
        if (!Object.isNumber(x)) {
            var maxX = morphs.pluck("morph").reduce(function (max, el) {
                var origin = el.getPosition().subPt(el.bounds().topLeft());
                return Math.max(origin.x, max);
            }, 0);
            x = 10 + maxX;
        }
        if (!Object.isNumber(height)) {
            height = this.defaultWidth;
        }

        // add margin
        var originY = morphs[0].morphs[Properties.own(morphs[0].morphs)[0]].getOrigin().y;
        if (morphName) originY = morphs[0].morphs[morphName].getOrigin().y;
        var y = 10 + originY;
        this.arrangeOnPath([pt(x, y), pt(x, y + height)], morphs);
    },
    hashStringToColor: function(str) {
       function djb2(str){
          var hash = 5381;
          for (var i = 0; i < str.length; i++) {
            hash = ((hash << 5) + hash) + str.charCodeAt(i); /* hash * 33 + c */
          }
          return hash;
        }
        
      var hash = djb2(str);
      var r = (hash & 0xFF0000) >> 16;
      var g = (hash & 0x00FF00) >> 8;
      var b = hash & 0x0000FF;
      var colorString = "#" + ("0" + r.toString(16)).substr(-2) + ("0" + g.toString(16)).substr(-2) + ("0" + b.toString(16)).substr(-2);
      return Color.fromString(colorString);
    },

    aggregateBy: function (data, attribute) {
        var getFunction = function(propertyName, optAggregationFunction) {
            // optAggregationFunction may be empty, "sum", "avg" or a function which takes an array as a parameter
            
            if (!this.children)
                return this[propertyName];
            
            if (!optAggregationFunction || optAggregationFunction == "sum") {
                return this.children.pluck(propertyName).sum();
            } else if (optAggregationFunction == "avg") {
                return this.children.pluck(propertyName).sum() / this.children.length;
            } else if(Object.isFunction(optAggregationFunction)) {
                return optAggregationFunction(this.children.pluck(propertyName));
            }
        };

        var groupsAsObject = data.groupByKey(attribute);

        var groupsAsArray = Properties.own(groupsAsObject).map(function(groupIdentifier) {
            var groupChildren = groupsAsObject[groupIdentifier];

            var eachCategory = {
                children : groupChildren,
                get : getFunction
            };

            eachCategory[attribute] = groupIdentifier;

            // add getFunction and link from children to parent
            groupChildren.each(function(child) {
                child.parent = eachCategory;
                child.get = getFunction;
            });

            return eachCategory;
        });
        
        groupsAsArray.map = function(fn){
            var index = 0;
            var list = [];
            groupsAsArray.each(function (ea){
                list.push(fn.apply(ea, [ea, index++]));
                ea.children.each(function(childValue){
                    list.push(fn.apply(childValue, [childValue, index++]));
                });
            });
            index = 0;
            return list;
        };
        groupsAsArray.totalLength = groupsAsArray.length + groupsAsArray.pluck("children").pluck("length").sum();
        return groupsAsArray;
    },
    
    aggregateByOld: function (data, attribute, aggregationType){
        if (data == null) return;

        var showChildrenFunction = function(){
            if (this.children.length == 0) return;
            
            this.morph.setOpacityAnimated(0, 1000);
            this.children.each(function(child){
                child.morph.setOpacityAnimated(1, 1000);
            });
        }
        var showParentFunction = function(){
            if (!this.parent) return;
            
            // hide all children of this parent
            this.parent.children.each(function(child){
                child.morph.setOpacityAnimated(0, 1000);
            });
            
            
            this.parent.morph.setOpacityAnimated(1, 1000);
        }
        
        var grouped = {};
        Properties.own(data).each(function(key){
            var obj = data[key];
            var value = obj[attribute];
            if (!grouped[value]){
                grouped[value] = {};
            }
            grouped[value][key] = obj;
            obj.parent = grouped[value];
            obj.key = key;
            obj.hasParent = function(){ return true};
            obj.hasChildren = function(){ return false};
            obj.showParent = showParentFunction;
            obj.showChildren = showChildrenFunction;
        });
        
        var size = 0;
        //add children
        Properties.own(grouped).each(function (key){
            var ea = grouped[key];
            ea.children = Properties.own(ea).map(function(key){
                return ea[key];
            });;
            size += ea.children.length + 1;
            ea.showChildren = showChildrenFunction;
            
            // TODO: fix this cheat
            var keys = ["population", "Energy"]
            keys.each(function(eachKey) {
                ea[eachKey] = ea.children.pluck(eachKey).filter(function(eachValue){
                    return !isNaN(eachValue);
                }).sum() / ea.children.length;
            });
            ea["summedPopulation"] = ea["population"] * ea.children.length;
            
            ea.key = key;
            ea.hasParent = function(){ return false};
            ea.hasChildren = function(){ return true};
        });
        
        var index = 0;
        grouped.map = function(fn){
            var list = [];
            grouped.children.each(function (ea){
                list.push(fn.apply(ea, [ea, index++]));
                ea.children.each(function(childValue){
                    list.push(fn.apply(childValue, [childValue, index++]));
                })
            });
            index = 0;
            return list;
        };
        
        grouped.children = Properties.own(grouped).map(function(key){
            return grouped[key];
        });
        console.log("index",size )
        grouped.length = size;
        return grouped;
    },
    
    show: function(morphOrMorphs) {
        this.animateOpacity(morphOrMorphs, 1);
    },
    
    hide: function(morphOrMorphs) {
        this.animateOpacity(morphOrMorphs, 0);
    },
    
    animateOpacity: function(morphOrMorphs, value) {
        var time = 1000;
        var doneCallback;
        if (Object.isArray(morphOrMorphs)) {
            morphOrMorphs.each(function(eachMorph) {
                if (value > 0)
                    eachMorph.setVisible(true);
                else
                    doneCallback = function () { eachMorph.setVisible(false) };
                eachMorph.setOpacityAnimated(value, time, doneCallback);
            })
        } else {
            var morph = morphOrMorphs;
            if (value > 0)
                morph.setVisible(true);
            else
                doneCallback = function () { morph.setVisible(false) };
            morph.setOpacityAnimated(value, time, doneCallback);
        }
    },
    
    join: function(options) {
        // options should be an object with the following keys:
        // sources : array of datasets
        // sourceAttributes: array of attributes which define the join
        // targetAttribute: the name of the attribute which holds the joined attribute
        
        var joined = [];
        var targetAttribute = options.targetAttribute;
        
        var getOrCreateElement = function(value) {
            var el = joined.find(function(ea) { return ea[targetAttribute] == value });
            if (!el) {
                el = {};
                el[targetAttribute] = value;
                joined.push(el);    
            }
            return el;
        }
        
        options.sources.each(function(eachSource, sourceIndex) {
            eachSource.each(function(eachSourceElement) {
                var currentSourceAttribute = options.sourceAttributes[sourceIndex];
                var attributeValue = eachSourceElement[currentSourceAttribute];

                var joinElement = getOrCreateElement(attributeValue);
                
                var clonedObject = {}
                
                Properties.own(eachSourceElement).each(function(eachKey) {
                    if (currentSourceAttribute == eachKey)
                        return;
                    
                    clonedObject[eachKey] = eachSourceElement[eachKey];
                });
                joinElement[currentSourceAttribute] = clonedObject;
            });
        });
        
        return joined;
    },
    
    convertCSVtoJSON: function(csvString) {
        var parser = new lively.morphic.Charts.MrDataConverter;
        parser = parser.getParser();
        if (csvString.length > 0)
            return parser.parse(csvString, true, "	", true, false);
        return null;
    },
    
    loadXlsFromPath: function(filePath) {
        var converter = new lively.morphic.Charts.ExcelConverter()
        return converter.convertFromFilePath(filePath);
    },
    getWikiHTML: function(query) {
        var url = "http://en.wikipedia.org/w/api.php?action=parse&page=" + query + "&format=json&prop=text&section=0"
        var htmlDeferred = new $.Deferred;
        $.ajax({
            url: url,
            dataType: "jsonp",
            success: function(response) {
                htmlDeferred.resolve(response.parse.text["*"]);
            },
            error: function() { htmlDeferred.reject(arguments) }
        })
        return htmlDeferred.promise();
    },
    showWikiToolTip: function(query) {
        // this.getWikiHTML(query).done(function(wikiHTML) {
        //     var wikiText = $(wikiHTML);
        //     wikiText = wikiText.children(undefined, "p").text();
        //     var v = new lively.morphic.Charts.VariableBox(pt(500, 500), wikiText, true);
        //     $world.addMorph(v);
        //     setTimeout(v.adjustExtent.bind(v), 500);
        // });
        var url = "http://de.m.wikipedia.org/w/index.php?search=" + query;
        var wikiPage = new lively.morphic.Charts.WindowComponent(new lively.morphic.Charts.WebPage(url));
        
        $world.addMorph(wikiPage);
        return wikiPage;
    }
});

lively.morphic.Path.subclass("lively.morphic.Charts.Line", {
    onMouseUp: function(e) {
        if (e.isLeftMouseButtonDown()) {
            this.openDataInspector(e.getPosition());
        }
    },
    
    remove: function($super) {
        if (this.viewer) {
            this.viewer.remove();
        }
        $super();
    },
    
    openDataInspector: function(evtPosition) {
        
        this.viewer = lively.morphic.Charts.Component.createWindow("JsonViewer");
        this.viewer.update(this.data);
        this.viewer.wasDragged = true;
        this.viewer.openInHand();
        
        this.viewerLine = new lively.morphic.Path([evtPosition, evtPosition]);
        this.viewerLine.setName('Line' + this.viewer);
        this.viewerLine.setBorderColor(Color.rgb(144, 144, 144));
        
        var center = pt(this.getPositionInWorld().x, evtPosition.y);
        var circle = lively.morphic.Morph.makeEllipse(new Rectangle(center.x, center.y - 3, 6, 6));
        circle.setBorderWidth(1);
        circle.setBorderColor(Color.rgb(144, 144, 144));
        circle.setFill();
        
        this.viewerLine.addMorph(circle);
        $world.addMorph(this.viewerLine);
        
        var spec = {
            converter: 
                function(pos) {
                    return pos.addPt(pt(200, 10));
                }
        };
        
        connect(this.viewer, 'position', this.viewerLine.getControlPoints().last(), 'setPos', spec);
        
    },
    
    updateViewer: function(data) {
        this.data = data;
        if (this.viewer) {
            this.viewer.update(data);
        }
    },
    
    onMouseOver: function() {
        this.setBorderWidth(5);
    },
    
    onMouseOut: function() {
        this.setBorderWidth(1);
    }, 
    
    initialize: function($super, vertices) {
        $super(vertices);
        this.setBorderColor(Color.rgb(144, 144, 144));
    },

    
});

lively.morphic.Charts.Component.subclass("lively.morphic.Charts.DataFlowComponent", {
    initialize: function($super, content) {
        $super(content);
        var arrow = new lively.morphic.Charts.Arrow(this);
        this.arrows = [arrow];
        
        this.data = null;
    },
    updateComponent : function() {
        // refresh interactionVariables array
        this.interactionVariables = [];
        window.activeComponent = this;
        var newData = this.content.update(this.data);
        window.activeComponent = null;
        // this.drawVariableBoxes();
        // check whether the return value already was a promise
        if (newData && typeof newData.done == "function") {
            return newData;
        } else {
            return new $.Deferred().resolve(newData);
        }
    },
    highlight: function() {
        var header = $(this.componentHeader.renderContext().shapeNode);
        var body = $(this.componentBody.renderContext().shapeNode);
        if (!header.hasClass("highlighted")) {
            header.addClass("highlighted");
            header.one("transitionend", function () {
                $(this).removeClass("highlighted");
            });
        }
        if (!body.hasClass("highlighted")) {
            body.addClass("highlighted");
            body.one("transitionend", function () {
                $(this).removeClass("highlighted");
            });
        }
    },
    drawVariableBoxes: function() {
        var position = this.description.getBounds().topRight();
        var _this = this;
        
        // remove the existing ones
        // this.interactionVariableFields.each(function(ea) {
        //     ea.remove();
        // });
        
        // draw the new ones
        this.interactionVariables.each(function(ea) {
            if (_this.get("var_" + ea))
                return;
                
            var box = new lively.morphic.Charts.VariableBox();
            box.setName("var_" + ea);
            box.varName = ea;
            box.setPosition(position)
            box.setExtent(pt(50, 24));
            box.setFillOpacity(0);
            box.setBorderWidth(0);
            box.ignoreEvents();
            box.setTextColor(Color.white);
            box.setFontSize(11);
            box.setWhiteSpaceHandling("nowrap");
            box.setTextString(ea);
            box.highlight = function(value) {
                this.setTextString(value);
                var _this = this;
                setTimeout(function() {
                    _this.setTextString(_this.varName);
                }, 1000);
            };
            
            connect($morph("Dashboard").env.interaction, ea, label, "highlight");
        
            _this.interactionVariableFields.push(label);
            _this.componentHeader.addMorph(label);
            
            position = position.addPt(pt(box.getExtent().x, 0));
        });
    },
    
    getComponentInDirection : function($super, direction) {
        var components = this.getComponentsInDirection(direction);

        if (components.length) {
            components.sort(function (a, b) {
                if (direction == -1){
                    return b.getPosition().y - a.getPosition().y
                } else return a.getPosition().y - b.getPosition().y
            })
            return components[0];
        }
        return null;
    },
    
    getComponentsInDirection : function($super, direction) {
        var components = [];
        var pxInterval = 100;
        
        // choose upper left corner as point
        var currentPoint = this.getPositionInWorld();

        var rightBoundary = this.getPositionInWorld().x + this.getExtent().x;
        while (currentPoint.x < rightBoundary) {
            
            var component = this.getComponentInDirectionFrom(direction, currentPoint)
    
            if (component) {
                components.pushIfNotIncluded(component);
            }
            
            currentPoint = currentPoint.addPt(pt(pxInterval, 0));
        }
    
        return components;
    },
    
    errorColor: Color.rgb(210, 172, 172),
    backgroundColor: Color.rgb(66, 139, 202),
    
    notifyNeighborsOfDragStart: function() {
        this.neighbors = [];
        var neighbor;
        
        var _this = this;
        this.arrows.each(function(arrow){
            if (arrow.isActive()) {
                neighbor = _this.getComponentInDirection(1, arrow.getTipPosition());
                if (neighbor) {
                    _this.neighbors.push(neighbor);
                }
            }
        });
    },
    
    drawConnectionLine: function(arrow) {
        var target = this.getComponentInDirectionFrom(1, arrow.getTipPosition());
        
        if (target && arrow.isActive()) {
            // found component to send data to, so draw connection
            
            arrow.target = target;
            
            var from = pt(arrow.getExtent().x/2,arrow.getExtent().y);
            var to = pt(from.x, target.getPositionInWorld().y - arrow.getTipPosition().y + arrow.getExtent().y);
            arrow.connectionLine = new lively.morphic.Charts.Line([from, to]);
            arrow.connectionLine.setBorderStyle('dotted');
            arrow.addMorph(arrow.connectionLine);
        }
    },
    

    
    drawAllConnectionLines: function() {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.drawConnectionLine(ea);
        });
    },
    

    
    refreshConnectionLines: function() {
        this.removeAllConnectionLines();
        this.drawAllConnectionLines();
    },
    
    removeConnectionLine: function(arrow) {
        if (arrow.connectionLine) {
            arrow.target = null;
            arrow.connectionLine.remove();
            arrow.connectionLine = null;
        }
    },
    

    
    removeAllConnectionLines: function() {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.removeConnectionLine(ea);
        });
    },
    

    
    notifyNeighborsOfDragEnd: function() {
        var _this = this;
        this.arrows.each(function (arrow){
            var neighbor = _this.getComponentInDirection(1, arrow.getPositionInWorld());
            if (neighbor) {
                neighbor.notify();
            }
            
            if (_this.neighbors && _this.neighbors.length) {
                _this.neighbors.invoke("notify");
            }
        });
    },
    
    onArrowActivated: function(arrow) {
        this.drawConnectionLine(arrow);
        this.update();
        this.notifyDashboard();
    },
    
    onArrowDeactivated: function(arrow) {
        var component = this.getComponentInDirectionFrom(1, arrow.getPositionInWorld());

        this.removeConnectionLine(arrow);
       
        if (component) {
            component.notify();
        }
        
        this.notifyDashboard();
    },
    

    

    

    
    calculateSnappingPosition: function() {
        // snap to position below component above, if there is one
        var componentAbove = this.getComponentInDirection(-1, this.globalBounds().topCenter().addPt(pt(0, -50)));

        if (componentAbove && !componentAbove.isMerger()) {
            // snap below component above
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            var snappingThreshold = 200;
            if (this.getPositionInWorld().y < posBelowComponent.y + snappingThreshold) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            return this.calculateSnappingPositionInGrid();
        }
    },
    
    calculateSnappingPositionInGrid: function() {
        var pos = this.getPositionInWorld();
        var offset = pt(0, 0);
        
        // Find the nearest fitting snapping point
        var remainder = pt(pos.x % this.gridWidth, pos.y % this.gridWidth);
        if (remainder.x > this.gridWidth / 2) {
            offset.x = this.gridWidth;
        }
        if (remainder.y > this.gridWidth / 2) {
            offset.y = this.gridWidth;
        }
        return pos.subPt(remainder).addPt(offset);
    },
    
    remove: function($super) {
        $super();
        if (!window["migrationProcessIsActive"]) {
            this.onClose();
        }
    },
    
    addPreviewMorph: function() {
        var morph = $morph("PreviewMorph" + this);
        if (!morph) {
            // adds the preview morph directly behind the component
            var morph = new lively.morphic.Box(rect(0,0,0,0));
            morph.setName("PreviewMorph" + this);
            morph.setBorderWidth(1);
            morph.setBorderRadius(5);
            morph.setBorderColor(Color.rgb(191,166,88));
            morph.setBorderStyle('dashed');
            $world.addMorph(morph,this);
        }
        morph.setPosition(this.getPositionInWorld());
        morph.setExtent(this.getExtent());
        this.previewAdded = true;
    },
    
    removePreviewMorph: function() {
        if (this.previewAdded) {
            $morph("PreviewMorph" + this).remove();
            this.previewAdded = false;
        } else {
            assert($morph("PreviewMorph" + this) === null, "previewAdded was false, but previewMorph was still found!");
        }
    },
    

    
    onResizeEnd: function() {
        var newExtent = this.calculateSnappingExtent(true);
        this.setExtent(newExtent, this.resizingFrom);
        this.drawAllConnectionLines();
        this.removePreviewMorph();
        this.setOpacity(1);
    },
    onResizeStart: function() {
        this.removeAllConnectionLines();
        this.addPreviewMorph();
        this.setOpacity(0.7);
    },

    
    onDragStart: function($super, evt) {
        var _this = this;
        this.wasDragged = true;
        $super(evt);
        this.removeAllConnectionLines();

        // Save the upper neighbor, so that it can be notified to redraw
        // its connection lines. It can not be notified at the moment, since
        // since we are still below it. Notification is done in onDropOn.

        this.savedUpperNeighbors = this.getComponentsInDirection(-1);
        
        // fanOut reacts to this and temporarily removes the arrow
        this.savedUpperNeighbors.each(function (ea) {
            ea.handleLowerNeighborMoved(_this);
        })
        
        this.addPreviewMorph();
        this.setOpacity(0.7);
        this.notifyNeighborsOfDragStart();
        
        // take the dragged component out of the layout
        var componentsBelow = this.getComponentsInDirection(1);
        componentsBelow.each(function (c) {
            c.move(-_this.getExtent().y - _this.componentOffset);
        });
        
        // save cached position for the automatic layouting
        lively.morphic.Charts.DataFlowComponent.getAllComponents().each(function (ea) {
            ea.cachedPosition = ea.getPosition();
        });
        
        // trigger this once to avoid flickering
        this.onDrag();
    },
    handleLowerNeighborMoved: function(component) {
        // should be overridden by FanOut
        return;
    },
    
    onDragEnd: function($super, evt) {
        $super(evt);
        // positioning is done in onDropOn

        this.removePreviewMorph();
        this.setOpacity(1);
        
        lively.morphic.Charts.DataFlowComponent.getAllComponents().each(function (ea) {
            ea.cachedPosition = null;
        });
    },
    
    onClose: function() {
        // only do this if the component is really removed
        // it is temporarily removed while dragging..
        if (!this.wasDragged) {
            var _this = this;

            var componentsBelow = this.getComponentsInDirection(1);
            var componentsAbove = this.getComponentsInDirection(-1);
            
            componentsBelow.each(function (c) {
                c.move(-_this.getExtent().y - _this.componentOffset);
            });

            componentsAbove.each(function (c){
                // if there is a component below, reuse the connection line
                // otherwise FanOut deletes the whole arrow
                c.refreshConnectionLines();
                if (!componentsBelow.length) {
                    c.handleLowerNeighborMoved(_this);
                }
            });

            this.notifyNextComponent();
        }
    },
    
    gridWidth: 20,
    
    componentOffset: 50,
    
    isMerger: function() {
        return false;
    },

    removeArrowFromArray: function(arrow) {
        this.arrows.remove(arrow);
    },

    realignAllComponents : function() {
        var previewMorph = $morph("PreviewMorph" + this);
        
        // reset the position of all components
        var all = lively.morphic.Charts.DataFlowComponent.getAllComponents();
        all.each(function (ea) {
            ea.setPosition(ea.getCachedPosition());
        })

        var componentsBelow = this.getComponentsInDirection(1);
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentsToMove = [];

        // select all components the preview intersects
        componentsToMove = componentsAbove.concat(componentsBelow).filter(function (c) {
            return (c && previewMorph.globalBounds().intersects(c.innerBounds().translatedBy(c.getPosition())))
        });

        // move the components
        componentsToMove.each(function (c) {
            var distanceBelow = previewMorph.getBounds().bottom() + c.componentOffset - c.getPosition().y;
            c.move(distanceBelow, previewMorph.getBounds().bottom());
        });
    },

    move: function(y, aggregatedY) {
        var componentsBelow = this.getComponentsInDirection(1);
        var componentsAbove = this.getComponentsInDirection(-1);
        var _this = this, distanceToMove;
        if (y > 0) {
            distanceToMove = (aggregatedY + this.componentOffset) - this.getPosition().y;
            if (distanceToMove > 0) {
                // move all components below
                // also pass the aggregatedY as we first propagate the move before actually
                // updating the positions (otherwise getComponentsInDirection won't work)
                componentsBelow.each(function (ea) {
                    ea.move(distanceToMove, pt(_this.getPosition().x, aggregatedY + _this.componentOffset).addPt(pt(0, _this.getExtent().y)).y)
                });
                this.setPosition(this.getPosition().addPt(pt(0, distanceToMove)));
            }
        } else if (y < 0) {
            distanceToMove = y;
            // determine how far we can actually move to the top
            // if we can't move for the full y, take the furthest that is possible
            componentsAbove.each(function (ea) {
                distanceToMove = Math.max(distanceToMove, ea.getPosition().y + ea.getExtent().y + _this.componentOffset -  _this.getPosition().y);
            });
            // update the position accordingly and move the components below to the top as well
            this.setPosition(_this.getPosition().addPt(pt(0, distanceToMove)));
            componentsBelow.each(function (ea) {
                ea.move(distanceToMove)
            });
        }
    },


    
    createMinimizer: function() {
        var minimizer = new lively.morphic.Charts.Minimizer();
        minimizer.setPosition(pt(this.getExtent().x - 27, 8));
        minimizer.layout = {moveHorizontal: true}
        
        return minimizer;
    },

    
    
    onDrag: function($super) {
        $super();
        var previewMorph = $morph("PreviewMorph" + this);
        var previewPos = this.calculateSnappingPosition();
        var previewExtent = this.calculateSnappingExtent();
        previewMorph.setPosition(previewPos);
        previewMorph.setExtent(previewExtent);

        this.realignAllComponents();
    },
    
    onDropOn: function($super, aMorph) {
        $super();
        if (aMorph == $world) {
            var newpos = this.calculateSnappingPosition();
            var newext = this.calculateSnappingExtent();
            this.setPosition(newpos);
            this.setExtent(newext);
        }

        var componentsAbove = this.getComponentsInDirection(-1);
        componentsAbove.concat(this.savedUpperNeighbors || []).each(function (neighbor) {
            neighbor.refreshConnectionLines();
        });
        this.savedUpperNeighbors = null;

        this.drawAllConnectionLines();
        this.notifyNeighborsOfDragEnd();
        this.notify();
        this.wasDragged = false;
    },
    
    update: function() {
        
        this.refreshData();

        var text = this.get("ErrorText");
        text.setTextString("");
        this.componentHeader.setToolTip("");
        text.error = null;
        
        var promise;
        try {
            promise = this.updateComponent();
            this.applyDefaultStyle();
            
        } catch (e) {
            this.applyErrorStyle();
            if (!e.alreadyThrown){
                this.throwError(e);
            }
            return;
        }
        
        var _this = this;
        promise.done(function() {
            // return content of arguments or arguments[0] for ajaxCalls
            if (arguments.length == 1 || arguments[1] == "success") {
                _this.data = arguments[0];
            } else {
                _this.data = arguments;
            }
            _this.notifyNextComponent();
        }).fail(function () {
            //don't propagate
        });
    },
    
    notifyNextComponent: function() {
        
        if (this.called>1000){
            return;
        }
        this.called = (this.called || 0)+1;
        var _this = this;
        setTimeout(function(){
            _this.called = 0;
        },10000);
        console.log(this.called);
        
        this.arrows.each(function (arrow){
            if (arrow.isActive()) {
                if (arrow.connectionLine) {
                    arrow.connectionLine.updateViewer(_this.data);
                }
                
                var dependentComponent = _this.getComponentInDirectionFrom(1, arrow.getPositionInWorld());
                if (dependentComponent) {
                    dependentComponent.notify();
                }
            }  
        });
        if (this.arrows.length == 0){
            //alert("Component has no arrows.");
        }
    },
    
    onContentChanged: function() {
        if (this.content.isAutoEvalActive !== false){
            var _this = this;
            Functions.debounceNamed(this.id, 300, function() {
                _this.notify();
                _this.notifyDashboard();
            })();
        }
    },
    
    notifyDashboard: function() {
        var dashboard = $morph("Dashboard");
        if (!dashboard && !Object.isEmpty(this.env)) {
            dashboard = new lively.morphic.Charts.Dashboard(this.env);
            dashboard.openInWorld();
            dashboard.sendToBack();
        }
        if (dashboard) {
            dashboard.update();
        }
    },

    notify: function() {
        this.update();
    },
    

    calculateSnappingExtent: function(ignoreComponentAbove) {

        var componentAbove = this.getComponentInDirection(-1);
        var oldExtent = this.getExtent();
        var offsetX = 0;
        var offsetY = 0;
        
        // Find the nearest fitting snapping extent
        if (oldExtent.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (oldExtent.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }

        if (componentAbove && !ignoreComponentAbove && !componentAbove.isMerger()) {
            // calculate extent depending on the extent of some other component
            return pt(componentAbove.getExtent().x, Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY);
        } else {
            // calculate new extent depending on raster
            var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
            var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
            return pt(x,y);
        }
    },

    
    refreshData: function() {
        var componentAbove = this.getComponentInDirection(-1);
        if (componentAbove){
            this.data = componentAbove.getData(this);
        } else {
            this.data = null;
        }
    },
    
    getComponentInDirectionFrom: function(direction, point) {
        // direction should be an int, which indicates the vertical direction
        // -1 is up and 1 is down
        var allComponents = lively.morphic.Charts.DataFlowComponent.getAllComponents();
        var closestComponent = null;

        // choose the top middle point as myPosition as default
        var myPosition = point || this.globalBounds().topCenter();
        var _this = this;
        allComponents.forEach(function(el) {
            if (el == _this || el.isBeingDragged)
                return;
            
            var elPosition = el.getPositionInWorld();
            
            // check for the nearest component straight above or below myPosition
            if (-direction * elPosition.y <= -direction * myPosition.y &&
                elPosition.x <= myPosition.x && elPosition.x + el.getExtent().x >= myPosition.x) {
                
                if (closestComponent == null || -direction * elPosition.y > -direction * closestComponent.getPositionInWorld().y)
                    closestComponent = el;
            }
        });
        return closestComponent;
    },
    adjustForNewBounds: function() {
        // resizeVertical, resizeHorizontal, moveVertical, moveHorizontal
        if (this.getLayouter()) {
            this.applyLayout();
            return;
        }

        var newExtent = this.getShape().getBounds().extent();
        if (!this.priorExtent) {
            this.priorExtent = newExtent;
            return;
        }

        var scalePt = newExtent.scaleByPt(this.priorExtent.invertedSafely()),
            diff = newExtent.subPt(this.priorExtent);

        for (var i = 0; i < this.submorphs.length; i++) {
            var morph = this.submorphs[i], spec = morph.layout;
            if (!spec) continue;
            var moveX = 0, moveY = 0, resizeX = 0, resizeY = 0;

            if (spec.centeredHorizontal)
                moveX = this.innerBounds().center().x - morph.bounds().center().x;
            if (spec.centeredVertical)
                moveY = this.innerBounds().center().y - morph.bounds().center().y;

            if (spec.moveHorizontal) moveX = diff.x;
            if (spec.moveVertical) moveY = diff.y;
            if (spec.resizeWidth) resizeX = diff.x;
            if (spec.resizeHeight) resizeY = diff.y;

            if (spec.scaleHorizontal || spec.scaleVertical) {
                var morphScale = pt(
                    spec.scaleHorizontal ? scalePt.x : 1,
                    spec.scaleVertical ? scalePt.y : 1);
                morph.setPosition(morph.getPosition().scaleByPt(morphScale));
                morph.setExtent(morph.getExtent().scaleByPt(morphScale));
            }

            if (moveX || moveY) morph.moveBy(pt(moveX, moveY));
            if (resizeX || resizeY) morph.setExtent(morph.getExtent().addXY(resizeX, resizeY));
        }

        this.priorExtent = newExtent;
    },


    
    onCreateFromPartsBin: function() {
        var _this = this;
        setTimeout(function () {
            if ($world.firstHand().isPressed()) {
                _this.onDragStart({hand: $world.firstHand()});
                $world.draggedMorph = _this;
            }
        }, 10);
    },
    
    setExtent: function($super, newExtent) {
        var oldExtent = this.getExtent();
        $super(newExtent);
        
        if (!this.isMerger() && this.arrows) {
            this.arrows.each(function (arrow){
                 arrow.positionAtMorph();
            });
        }

        this.adjustForNewBounds();
        
        // Before added to the world, we don't want to inform other components of changing extent
        if (this.owner) {
            var _this = this;
            var componentsBelow = this.getComponentsInDirection(1);
            componentsBelow.each(function (c) {
                c.move(newExtent.y - oldExtent.y, _this.getPosition().y + newExtent.y);
            });
        }
        
        var previewMorph = $morph("PreviewMorph" + this);
        if (previewMorph) {
            var previewExtent = this.calculateSnappingExtent(true);
            previewMorph.setExtent(previewExtent);
        }
    },

    throwError: function(error) {
        var text = this.get("ErrorText");
        text.setTextString(error.toString());
        this.componentHeader.setToolTip(error.stack || error.toString());
        text.error = error;
        error.alreadyThrown = true;
        throw error;
    },

       
    getData : function(target){
        
        var arrowToTarget = this.arrows.detect(function (arrow){
            var arrowX =  arrow.getTipPosition().x;
            return target.getPosition().x <= arrowX &&
                arrowX <= target.getPosition().x + target.getExtent().x;
        });
        if (arrowToTarget && arrowToTarget.isActive()) {
            return this.data;
        }
        return null;
    },

    getCachedPosition : function() {
        // cached position for automatic layouting
        return this.cachedPosition || this.getPosition();
    },
    
    migrateFrom : function(oldComponent){
        this.setExtent(oldComponent.getExtent());
        this.setPosition(oldComponent.getPosition());
        this.arrows = oldComponent.arrows;
        this.data = oldComponent.data;
        
        this.content.migrateFromPart(oldComponent);
        if (this.migrateFromPart)
            this.migrateFromPart(oldComponent);
        
        oldComponent.remove();
        $world.addMorph(this);
    },

    getBodyCSS : function() {
        var color = this.backgroundColor.toString();
        return ".ComponentBody {\
            background-color: rgb(255, 255, 255) !important;\
            border-bottom-left-radius: 5px !important;\
            border-bottom-right-radius: 5px !important;\
            border-width: 1px !important;\
            border-color: " + color + " !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: 0px !important;\
            margin-left: 0px !important;\
            margin-right: 0px !important;\
            margin-top: 0px !important;\
            padding-bottom: 0px !important;\
            padding-left: 0px !important;\
            padding-right: 0px !important;\
            padding-top: 0px !important;\
            position: relative !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            transition: all 0.3s ease-in-out !important;\
        }\
        .ComponentBody.highlighted { \
            border-color: rgb(192, 223, 250) !important;\
        }";
    },
    
    getErrorBodyCSS : function() {
        return ".ComponentBody {\
            background-color: rgb(255, 255, 255) !important;\
            border-bottom-left-radius: 5px !important;\
            border-bottom-right-radius: 5px !important;\
            border-width: 1px !important;\
            border-color: rgb(235, 204, 209) !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: 0px !important;\
            margin-left: 0px !important;\
            margin-right: 0px !important;\
            margin-top: 0px !important;\
            padding-bottom: 0px !important;\
            padding-left: 0px !important;\
            padding-right: 0px !important;\
            padding-top: 0px !important;\
            position: relative !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
            box-shadow: 0 5px 10px rgba(0,0,0,.2) !important;\
        }";
    },
    
    
    getHeaderCSS: function() {
        var color = this.backgroundColor.toString();
        return	".ComponentHeader { \
            background-color: " + color + "; !important; \
            color: white !important; \
            border-top-left-radius: 4px !important; \
            border-top-right-radius: 4px !important;\
            background-attachment: scroll !important;\
            background-clip: border-box !important;\
            background-image: none !important;\
            background-origin: padding-box !important;\
            background-size: auto !important;\
            border-bottom-color: " + color + " !important;\
            border-bottom-style: solid !important;\
            border-bottom-width: 1px !important;\
            border-image-outset: 0px !important;\
            border-image-repeat: stretch !important;\
            border-image-slice: 100% !important;\
            border-image-source: none !important;\
            border-image-width: 1 !important;\
            border-left-color: " + color + " !important;\
            border-left-style: solid !important;\
            border-left-width: 1px !important;\
            border-right-color: " + color + " !important;\
            border-right-style: solid !important;\
            border-right-width: 1px !important;\
            border-top-color: " + color + " !important;\
            border-top-style: solid !important;\
            border-top-width: 1px !important;\
            box-sizing: border-box !important;\
            color: rgb(255, 255, 255) !important;\
            cursor: auto !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: -1px !important;\
            padding-bottom: 10px !important;\
            padding-left: 10px !important;\
            padding-right: 15px !important;\
            padding-top: 2px !important;\
            position: relative !important;\
            text-decoration: none solid rgb(255, 255, 255) !important;\
            z-index: 0 !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            border-width: 1px !important;\
            transition: all 0.3s ease-in-out !important;\
        }\
        .ComponentHeader.highlighted { \
            background-color: rgb(192, 223, 250) !important;\
            border-color: rgb(192, 223, 250) !important;\
        }";
    },
    
    getErrorHeaderCSS: function() {
        return	".ComponentHeader { \
            background-color: rgb(235, 204, 209); !important; \
            border-top-left-radius: 4px !important; \
            border-top-right-radius: 4px !important;\
            background-attachment: scroll !important;\
            background-clip: border-box !important;\
            background-image: none !important;\
            background-origin: padding-box !important;\
            background-size: auto !important;\
            border-bottom-color: rgb(235, 204, 209) !important;\
            border-bottom-style: solid !important;\
            border-bottom-width: 1px !important;\
            border-image-outset: 0px !important;\
            border-image-repeat: stretch !important;\
            border-image-slice: 100% !important;\
            border-image-source: none !important;\
            border-image-width: 1 !important;\
            border-left-color: rgb(235, 204, 209) !important;\
            border-left-style: solid !important;\
            border-left-width: 1px !important;\
            border-right-color: rgb(235, 204, 209) !important;\
            border-right-style: solid !important;\
            border-right-width: 1px !important;\
            border-top-color: rgb(235, 204, 209) !important;\
            border-top-style: solid !important;\
            border-top-width: 1px !important;\
            box-sizing: border-box !important;\
            cursor: auto !important;\
            display: block !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            font-size: 14px !important;\
            line-height: 20px !important;\
            margin-bottom: -1px !important;\
            padding-bottom: 10px !important;\
            padding-left: 10px !important;\
            padding-right: 15px !important;\
            padding-top: 2px !important;\
            position: relative !important;\
            text-decoration: none solid rgb(255, 255, 255) !important;\
            z-index: 2 !important;\
            font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif !important;\
            -webkit-box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            box-shadow: 0 -1px 5px rgba(0,0,0,.2) !important;\
            border-width: 1px !important;\
        }";
    },
});

Object.extend(lively.morphic.Charts.DataFlowComponent, {
    getAllComponents: function() {
        return $world.withAllSubmorphsSelect(function(el) {
            return el instanceof lively.morphic.Charts.DataFlowComponent;
        });
    }
});

lively.morphic.Charts.Content.subclass("lively.morphic.Charts.LinearLayout", {
    
    initialize: function($super) {
        $super();
        this.description = "LinearLayout";
        this.extent = pt(600, 600);
        
        this.setFill(Color.white);
        this.OFFSET = 20;
        this.currentX = this.OFFSET;
        this.setName("LinearLayout");
        this.layout = {
            resizeHeight: true,
            resizeWidth: true
        }
    },
    
    addElement: function(element){
        var morph = element.morph.duplicate();
        morph.setPosition(pt(this.currentX, this.getExtent().y - morph.getExtent().y));
        this.currentX = this.currentX + morph.getExtent().x + this.OFFSET;
        this.addMorph(morph);
    },
    
    clear: function(){
        this.currentX = this.OFFSET;
        this.removeAllMorphs();
    },
    
    update: function(data) {
        // create linear layout containing rects from data
        this.clear();
        if (this.data) {
            var _this = this;
            data.each(function(ea) {
                _this.addElement(ea);
            });
        }

        return data;
    }
} );

cop.create('FixLoadingLayer').refineClass(lively.morphic.Layout.TileLayout, {
    basicLayout: function(container, submorphs) {
        try {
        var result = cop.proceed(container, submorphs);
        } catch(e){
            console.log("Error during layout: " + e);
            return null;
        }
        return result;
    }}
).beGlobal();

lively.morphic.Charts.Content.subclass("lively.morphic.Charts.Canvas", {
    
    initialize: function($super) {
        $super();
        this.description = "Canvas";
        this.extent = pt(600, 300);
        
        this.setFill(Color.white);
        this.setName("Canvas");
        this.layout = {
            resizeHeight: true,
            resizeWidth: true
        };
    },

    update: function(data) {
        console.log("Canvas update");
        // create linear layout containing rects from data
        this.clearAndRemoveContainer();
        
        if (data === null) return;

        var _this = this;
        
        // create container for visual elements, if it does not exist yet
        if (!this.canvasMorph)
            this.canvasMorph = new lively.morphic.Box(new rect(0, 0, 10, 10));
            
        if (Object.isArray(data)) {
            // data ist just an array of data containing morphs
            
            console.time("addElements in Canvas");
            data.each(function(datum){
                _this.addElement(datum, _this.canvasMorph);
            });
            console.timeEnd("addElements in Canvas");
            
        } else if (Object.isObject(data) && data.morphs) {
            // data contains morphs as well as scale information
            
            if (JSON.stringify(data.scaleX) !== JSON.stringify(this.priorSpecX) || JSON.stringify(data.scaleY) !== JSON.stringify(this.priorSpecY))
                this.redrawScales = true;
                
            // if the scales are not in the data anymore, reset the prior specs
            if (!data.scaleX) this.priorSpecX = undefined;
            if (!data.scaleY) this.priorSpecY = undefined;
            
            // scales do not exist or need to be redrawn
            if (!(this.scaleX || this.scaleY) || this.redrawScales)
                this.addScales(data, this.canvasMorph);
                
            // add the actual visual elements
            data.morphs.each(function(datum){
                _this.addElement(datum, _this.canvasMorph);
            });
            
            // position the morphs according to the scales,
            // remember scale specifications
            if (this.scaleX) {
                this.scaleX.update(data.morphs);
                this.priorSpecX = $.extend(true, {}, data.scaleX);
            }
            if (this.scaleY) {
                this.scaleY.update(data.morphs);
                this.priorSpecY = $.extend(true, {}, data.scaleY);
            }
        }
        
        // add the container
        this.addMorph(this.canvasMorph);
        
        return data;
    },
    setExtent: function($super, extent) {
        $super(extent);
        this.redrawScales = true;
    },
    addScales: function(data, container) {
        var margin = 92;
        
        // remove existing scales
        if (this.scaleX)
            this.scaleX.remove();
        if (this.scaleY)
            this.scaleY.remove();
        
        this.redrawScales = false;

        if (data.scaleX) {
            var spec = {
                key: data.scaleX.key,
                from: data.scaleX.from,
                to: data.scaleX.to,
                sectors: data.scaleX.sectors,
                labels: data.scaleX.labels
            }
            this.scaleX = new lively.morphic.Charts.Scale("x", this.getExtent().x - 2 * margin, spec);
            this.scaleX.setPosition(this.innerBounds().bottomLeft().addPt(pt(margin, -margin)));
            container.addMorph(this.scaleX);
        } else {
            delete this.scaleX;
        }
        if (data.scaleY) {
            var spec = {
                key: data.scaleY.key,
                from: data.scaleY.from,
                to: data.scaleY.to,
                sectors: data.scaleY.sectors,
                labels: data.scaleY.labels
            }
            this.scaleY = new lively.morphic.Charts.Scale("y", this.getExtent().y - 2 * margin, spec);
            this.scaleY.setPosition(pt(margin, margin));
            container.addMorph(this.scaleY);
        } else {
            delete this.scaleY;
        }
    },

    addElement: function(element, container) {

		var morphs = {};
        if (element.morphs) {
            morphs = element.morphs;
        } else {
            morphs["morph"] = element;
        }
        Properties.ownValues(morphs).each(function (eachMorph){
            container.addMorph(eachMorph);
        });
        setTimeout(function() {
            Properties.own(morphs).each(function (eachMorph){
                if (morphs[eachMorph].__dirtyFixTheBorderWidthFlag) {
                    morphs[eachMorph].setBorderWidth(morphs[eachMorph].getBorderWidth());
                } 
            });
        }, 0);

    },

    scale: function() {
        var margin = 15;
        var ownWidth = this.getExtent().x - margin;
        var ownHeight = this.getExtent().y - margin;
        var maxX = 1;
        var maxY = 1;
        
        this.submorphs.forEach(function(morph) {
            var x = morph.getBounds().right();
            var y = morph.getBounds().bottom();
            
            maxX = Math.max(x, maxX);
            maxY = Math.max(y, maxY);
        });
        
        var scaleFactor = Math.min(ownWidth/maxX, ownHeight/maxY);
        
        this.submorphs.forEach(function(morph) {
            var x = morph.getPosition().x * scaleFactor;
            var y = morph.getPosition().y * scaleFactor;
            
            morph.setPosition(pt(x,y));
        });
    },

    onResizeEnd: function($super) {
        $super();
        this.scale();
    },
    
    clearAndRemoveContainer: function(){
        var container = this.submorphs[0];
        if (!container) return;
        
        // delete all PrototypeMorphs
        var prototypeMorphs = container.submorphs.filter(function(ea) {
            return ea.isPrototypeMorph;
        });
        prototypeMorphs.each(function(ea) {
            ea.remove();
        });
        
        //remove canvasMorph from component
        container.remove();
    }
    
} );

lively.morphic.CodeEditor.subclass('lively.morphic.Charts.CodeEditor',
{
    initialize: function($super) {
        $super();
        this.disableGutter();
    },
    
    boundEval: function(codeStr) {
        var ctx = this.getDoitContext() || this;
        
        var __evalStatement = this.createEvalStatement(ctx, codeStr);
        
        // see also $super
        
        // Evaluate the string argument in a context in which "this" is
        // determined by the result of #getDoitContext
        var str,
        interactiveEval = function() {
            try {
                return eval(__evalStatement);
            } catch (e) {
                return eval(__evalStatement);
            }
        };
        
        try {
            var result = interactiveEval.call(ctx);
            if (localStorage.getItem("LivelyChangesets:" + location.pathname))
                ChangeSet.logDoit(str, ctx.lvContextPath());
            return result;
        } catch(e) {throw e}
        
    },
    
    createEvalStatement: function(ctx, codeStr) {
        // The parameters ctx and codeStr are not strictly necessary for calling this function.
        // Instead, this should highlight the fact that these variables need to be in the scope
        // when evaluating the evalStatement.
        
        var evalFunction = (function() {
            var env = $morph("Dashboard") ? $morph('Dashboard').env : {};

            var data = ctx.component.data;
            with ((ctx.component.env && ctx.component.env.interaction) || window) {
                with (lively.morphic.Charts.Utils) {
                    var ret = eval(codeStr);
                }
            }
            ctx.component.env = env;
            return ret;
        }).toString()

        var evalStatement = "(" + evalFunction + ")();"
        return evalStatement;
    },
        
    onChanged: function(optForceEvaluation) {
        if (!this.isValid()) {
            return;
        }
        
        var newSession = this.aceEditor.getSession().toString();
        if (!optForceEvaluation && this.oldSession) {
            
            if (this.oldSession == newSession)
                return;
        }
        this.oldSession = newSession;
        
        this.owner.component.onContentChanged();
    },
    isValid: function() {
        var str = this.getSession();
        try {
            eval("throw 0;" + str);
        } catch (e) {
            if (e === 0)
                return true;
        }
        return false;
    },
    
    doit: function(printResult, editor) {
        var text = this.getSelectionMaybeInComment(),
            result = this.tryBoundEval(text);
        if (printResult) { this.printObject(editor, result); return; }
        
        var sel = this.getSelection();
        if (sel && sel.isEmpty()) sel.selectLine();
        return result;
    }
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.MorphCreator',
'default category', {
    
    initialize : function($super){
        $super();
        this.description = "MorphCreator";
        this.extent = pt(400, 200);
        this.setExtent(this.extent);
        this.layout = {adjustForNewBounds: true};
        this.setPosition(pt(0, 0));

        this.createMappingArea();
        this.createPrototypeArea();    
    },
    createPrototypeMorph: function() {
        var prototypeMorph = lively.morphic.Morph.makeRectangle(lively.rect(0,0,20,60));
        prototypeMorph.setFill(Color.rgb(66, 139, 202));
        prototypeMorph.setBorderWidth(0);
        prototypeMorph.setName("rectangle");
        var position = this.prototypeArea.getExtent().scaleBy(0.5).subPt(prototypeMorph.getExtent().scaleBy(0.5));
        prototypeMorph.setPosition(position);
        this.prototypeArea.addMorph(prototypeMorph);
        this.prototypeArea.attachListener(prototypeMorph);
        
        return prototypeMorph;
    },
    createPrototypeArea: function() {
        this.prototypeArea = new lively.morphic.Charts.PrototypeArea(pt(this.extent.x / 3 * 1, this.extent.y));
        this.prototypeArea.setName("PrototypeArea");
        this.prototypeArea.setPosition(pt(this.mappingContainer.getBounds().topRight().x + 6, 0));
        this.prototypeArea.layout.resizeHeight = true;
        this.prototypeArea.layout.moveHorizontal = true;
        
        this.morphInput = this.prototypeArea.morphName;
         
        var prototypeMorph = this.createPrototypeMorph();
        this.addCategoryFor(prototypeMorph);
        
        this.addMorph(this.prototypeArea);
    },
    createMappingArea: function() {
        // create container for all lines
        var bounds = lively.rect(0, 0, this.extent.x / 3 * 2 - 6, this.extent.y);
        this.mappingContainer = new lively.morphic.Box(bounds);
        this.mappingContainer.setLayouter(new lively.morphic.Layout.VerticalLayout());
        this.addMorph(this.mappingContainer);
    },
    addCategoryFor: function(aMorph) {
        var bounds = this.mappingContainer.bounds();
        var mappingCategory = new lively.morphic.Charts.MappingLineCategory(bounds, aMorph);
        this.mappingContainer.addMorph(mappingCategory);
    },
    removeCategoryOf: function(aMorph) {
        this.mappingContainer.submorphs
            .find(function(ea) {
                return ea.categoryMorph == aMorph;
            }).remove();
    },
    createMappingInput: function(inputHeight) {
        var mappingInput = new lively.morphic.Morph.makeRectangle(
            lively.rect(0, 0, this.extent.x / 3 * 2 - 3, inputHeight - 3)
        );
        
        mappingInput.setFill(Color.white);
        mappingInput.setBorderRadius(5);
        mappingInput.setBorderColor(Color.rgb(66, 139, 202));
        mappingInput.layout = {resizeWidth: true};
        mappingInput.layout.layouter = new lively.morphic.Layout.TightHorizontalLayout(mappingInput);
        mappingInput.layout.layouter.spacing = 4;
        mappingInput.layout.layouter.borderSize = 2; 
        this.datumInput = this.createInputField("datum");
        mappingInput.addMorph(this.datumInput);
        
        if (!lively.morphic.Charts.MorphCreator.counter) lively.morphic.Charts.MorphCreator.counter = 1;
        var currentID = lively.morphic.Charts.MorphCreator.counter;
        lively.morphic.Charts.MorphCreator.counter++;
        this.morphInput = this.createInputField("morph" + currentID);
        mappingInput.addMorph(this.morphInput);
        
        mappingInput.addMorph(lively.morphic.Text.makeLabel("mappingInput:"));
        return mappingInput;
    },


    update : function($super, data) {
        if (!data) {
            return;
        }
        
        var prototypeMorph = this.getPrototypeMorph();
        
        var morphName = this.morphInput.getTextString();
        
        if (this.morphInput.cachedName !== morphName) {
            this.pruneOldMorphName(data.pluck("morphs"), this.morphInput.cachedName);
            this.morphInput.cachedName = morphName;
        }
        
        this.morphCreatorUtils = new lively.morphic.Charts.MorphCreatorUtils();
        
        var sampleDatum = data[0];
        var mainCategory = this.getMappingCategoryFor(prototypeMorph);
        var mappings = mainCategory.getAllMappings();
        mappings = this.extractDependencies(mappings, sampleDatum);
        
        var mappingFunction = this.generateMappingFunction(mappings, mainCategory);
        
        var _this = this;
        var submorphMappings = this.getMappingCategoriesForSubmorphs(prototypeMorph)
            .map(function(category) {
                var submorphPrototype = category.categoryMorph;
                var extractedDependencies = _this.extractDependencies(category.getAllMappings(), sampleDatum);
                var mappingFunction = _this.generateMappingFunction(extractedDependencies, category);
                
                return {
                    submorphPrototype: submorphPrototype,
                    mappings: extractedDependencies,
                    mappingFunction: mappingFunction
                };
            });
        
        
        var bulkCopy = this.smartBulkCopy(prototypeMorph, data.totalLength || data.length);
        var copiedMorphs = bulkCopy.copiedMorphs;
        this.copiedMorphs = copiedMorphs;
        data = data.map(function(ea, index) {
            var prototypeInstance = copiedMorphs[index];
            prototypeInstance.mappings = mappings;            

            mappingFunction(prototypeInstance, ea);
            
            // apply submorphMappings
            submorphMappings.each(function(aMapping) {
                var id = aMapping.submorphPrototype.savedID;
                var submorphClone = prototypeInstance.getSubmorphsByAttribute("savedID", id).first();
                aMapping.mappingFunction(submorphClone, ea);
                submorphClone.mappings = submorphMappings.mappings;
            });
            
            // ensure that each datum is an object (primitives will get wrapped here)
            ea = ({}).valueOf.call(ea);
            ea[morphName] = prototypeInstance;
            
            prototypeInstance.datum = ea;
            return prototypeInstance;
        });
        
        // deferred evaluation of all mappings that used range
        var attributeMap = this.getAttributeMap();
        var _this = this;
        data.each(function(ea, index) {
            Properties.own(_this.morphCreatorUtils.ranges).each(function (key) {
                var mappingCategory = _this.getMappingCategoryFor(prototypeMorph);
                var lineIndex = mappingCategory.getIndexOf(key);
                var setterFn = attributeMap[key];
                if (setterFn) {
                    try {
                        setterFn(_this.morphCreatorUtils.interpolate.bind(_this.morphCreatorUtils, key), ea, index);
                        mappingCategory.hideErrorAt(lineIndex);
                    } catch (e) {
                        mappingCategory.showErrorAt(lineIndex);
                        console.log(e);
                    }
                }
            });
        });
        
        // if pie chart, calculate arg
        if (prototypeMorph instanceof lively.morphic.Charts.PieSector) {
            this.calculatePieChart(data);
        }
        
        delete this.morphCreatorUtils;
        
        return data;
    },
    getMappingCategoryFor: function(morph) {
        return this.mappingContainer.submorphs.find(function(ea) {
            return ea.categoryMorph == morph;
        });
    },
    getMappingCategoriesForSubmorphs: function(morph) {
        return this.mappingContainer.submorphs.filter(function(ea) {
            return ea.categoryMorph != morph;
        });
    },
    calculatePieChart: function(data) {
        var mappedPropertySum = data.filter(function(ea){return ea.morph.mappedProperty}).sum();
        var rotation = 0;
        data.each(function(ea){
            ea.morph.setPosition(pt(220, 300));
            ea.morph.setOrigin(ea.morph.center);
            ea.morph.setDegree(ea.morph.mappedProperty / mappedPropertySum * 360);
            rotation += ea.morph.mappedProperty / mappedPropertySum;
            ea.morph.setRotation((1 - rotation) * 2 * Math.PI);
        });
    },
    
    smartBulkCopy: function(prototypeMorph, amount) {
        // TODO: determine type at runtime 
        var type = "dontUseCopyByInstantiation",
            copiedMorphs = [],
            newMorph;
        var useFastBulkCopy = true;
        var cloned = false;
        
        if (type == "box") {
            // box
            for (var i = 0; i < amount; i++) {
    			newMorph = new lively.morphic.Morph()
    			newMorph.setExtent(pt(100.0,100.0))
    			newMorph.setFill(Color.blue)    
			    copiedMorphs.push(newMorph);
			}
        } else if (type == "circle") {
            // circle
            for (var i = 0; i < amount; i++) {
			    newMorph = lively.morphic.Morph.makeCircle(pt(100, 100), 100, 0, Color.black, Color.blue)
			    copiedMorphs.push(newMorph);
			}
        } else if (type == "line") {
            // line
            for (var i = 0; i < amount; i++) {
			    var verts = [pt(0.0,0.0), pt(100.0,100.0)];
			    newMorph = lively.morphic.Morph.makeLine(verts, 1, Color.black)
			    copiedMorphs.push(newMorph);
			}
        } else if (type == "text") {
			// text
			for (var i = 0; i < amount; i++) {
    			newMorph = new lively.morphic.Text(lively.rect(0, 0, 75, 25), "Some Text")
    			newMorph.setFillOpacity(0)
    			newMorph.setBorderStyle("hidden")
    			copiedMorphs.push(newMorph);
			}
        } else if (useFastBulkCopy) {
            // fastBulkCopy
            copiedMorphs = prototypeMorph.fastBulkCopy(amount);
            cloned = true;
        } else {
            // normal copy
            for (var i = amount - 1; i >= 0; i--) {
                copiedMorphs.push(prototypeMorph.copy());
            }
            cloned = true;
        }
        
        return {
            copiedMorphs: copiedMorphs,
            cloned: cloned,
        };
    },
    createInputField: function(text) {
        var input = $world.loadPartItem("InputField", "PartsBin/Inputs");
        input.setTextString(text);
        input.setName(text);
        input.setBorderColor(Color.white)
        input.setBorderRadius(0);
        input.setExtent(pt(80, 20));
        input.setFontSize(10);
        return input;
    },
    
    wantsDroppedMorph: function(aMorph) {
        return (!(aMorph instanceof lively.morphic.Charts.Component) && $world.draggedMorph !== aMorph);
    },
    
    
    migrateFromPart: function(oldComponent) {
        this.codeEditor.setTextString(oldComponent.content.codeEditor.getTextString());
        var newPrototype = this.getSubmorphsByAttribute("isPrototypeMorph", true)[0];
        var oldPrototype = oldComponent.getSubmorphsByAttribute("isPrototypeMorph", true)[0];
        var componentBody = this.component.getSubmorphsByAttribute("name","ComponentBody")[0];
        
        newPrototype.remove();
        componentBody.addMorph(oldPrototype);
    },
    
    removalNeedsConfirmation: function() {
        return true;
    },
    
    pruneOldMorphName: function(morphObjects, oldMorphName) {
        morphObjects.each(function(eachMorphObject) {
            if (eachMorphObject && eachMorphObject[oldMorphName]) {
                delete eachMorphObject[oldMorphName];
            }
        })
    },
    
    generateMappingFunction: function(mappingObjects, mappingCategory) {
        
        var attributeMap = this.getAttributeMap();
        
        // holds an array of functions where each accepts a morph and sets the specified
        // property to the result of the specified expression
        var _this = this;
        var mappingFunctions = mappingObjects.map(function(eachMapping) {
            var morphCreatorUtils = {
                range: _this.morphCreatorUtils.public.range.bind(null, eachMapping.attribute)
            }
            
            var valueFn = function(datum) {
                var env = $morph("Dashboard") ? $morph('Dashboard').env : { interaction: {} };
                with (env.interaction)
                with (lively.morphic.Charts.Utils)
                with (datum)
                with (morphCreatorUtils) {
                    return eval(eachMapping.value);
                }
            };
            
            var setterFn = attributeMap[eachMapping.attribute];
            if (setterFn) {
                return setterFn.bind(null, valueFn);
            } else {
                return null;
            }
        });
        
        var _this = this;
        var combinedMappingFunction = function(morph, datum) {
            mappingFunctions.each(function(eachMappingFunction, index) {
                try {
                    eachMappingFunction(morph, datum);
                    mappingCategory.hideErrorAt(index);
                } catch (e) {
                    mappingCategory.showErrorAt(index);
                    console.warn(e);
                }
                
            });
        };
        
        return combinedMappingFunction;
    },
    
    extractDependencies: function(mappings, sampleDatum) {
        // We assume that sampleDatum is a good representation for all datum-elements.
        // If a property exists in sampleDatum, it hopefully exists in the remaining datum-elements.
        
        var _this = this;
        mappings.each(function(aMapping) {
            var expressionString = aMapping.value;
            try {
                var ast = lively.ast.acorn.parse(expressionString);
            } catch (e) {
                // this error will reoccur and propagate when evaluating it
                // in generateMappingFunction's function
                return;
            }

            var identifiers = _this.gatherIdentifiers(ast)
                .uniq()
                .filter(function(anIdentifier) {
                    if (anIdentifier == "datum") return true;
                    return Object.isObject(sampleDatum) && anIdentifier in sampleDatum;
                })
            
            aMapping.dependentAttributes = identifiers;
        });
        
        return mappings;
    },
    
    gatherIdentifiers: function(subTree) {
        var _this = this;
        var badKeys = "property";
        var identifiers = [];
        
        if (subTree.type === "Identifier") {
            identifiers.push(subTree.name);
        }
        
        Properties.own(subTree).each(function(attr) {
            if (badKeys.include(attr)) {
                return;
            }
    
            var el = subTree[attr];
            if (Object.isObject(el)) {
                identifiers = identifiers.concat(_this.gatherIdentifiers(el));
            }
        });
        
        return identifiers;
    },

    getAttributeMap: function() {
        return {
            extent: function(valueFn, morph, datum) {
                morph.setExtent(valueFn(datum));
            },
            height: function(valueFn, morph, datum) {
                morph.setExtent(lively.pt(morph.getExtent().x, valueFn(datum)));
            },
            width: function(valueFn, morph, datum) {
                morph.setExtent(lively.pt(valueFn(datum), morph.getExtent().y));
            },
            color: function(valueFn, morph, datum) {
                morph.setFill(valueFn(datum));
            },
            rotation: function(valueFn, morph, datum) {
                morph.setRotation(valueFn(datum), morph);
            },
            position: function(valueFn, morph, datum) {
                morph.setPosition(valueFn(datum), morph);
            },
            x: function(valueFn, morph, datum) {
                morph.setPosition(lively.pt(valueFn(datum), morph.getPosition().y));
            },
            y: function(valueFn, morph, datum) {
                morph.setPosition(lively.pt(morph.getPosition().x, valueFn(datum)));
            },
            borderWidth: function(valueFn, morph, datum) {
                morph.setBorderWidth(valueFn(datum));
            },
            borderColor: function(valueFn, morph, datum) {
                morph.setBorderColor(valueFn(datum));
            }
        };
    },
    
    getPrototypeMorph: function() {
        var morph = this.getSubmorphsByAttribute("isPrototypeMorph", true).first();
        if (!morph) {
            this.throwError(new Error("No prototype morph found"));
        }
        
        return morph;
    }

});

Object.subclass('lively.morphic.Charts.MorphCreatorUtils',
'default category', {
    initialize: function() {
        this.ranges = {};
        var _this = this;
        // publicly exposed utils functions
        this.public = {
            range: function(property, samples) {
                var sampleValues = samples;
                if (!Object.isArray(samples)) {
                    // put all arguments but the first one into an array
                    sampleValues = Array.prototype.slice.call(arguments).slice(1, arguments.length);
                }
                if (!_this.ranges[property]) {
                    _this.ranges[property] = { samples : sampleValues, values: [] };
                }
                return function(value) {
                    _this.ranges[property].values.push(value);
                }
            }
        }
    },
    interpolate: function(property, index) {
        var samples = this.ranges[property].samples;
        var values = this.ranges[property].values;
        var value = values[index];
        var min = values.min();
        var max = values.max();
        
        if (samples.length == 1) return samples[0];
        
        var intervalCount = samples.length - 1;
        
        // scale value to interval [0,1]
        var scaledValue = (value - min) / ((max - min) || 1);
        
        // select the right interval from the samples array
        // 0.55 would fall into the 2nd interval from [1, 10, 100]
        var intervalStartIndex = Math.floor(scaledValue * intervalCount);
        if (intervalStartIndex == intervalCount) {
            intervalStartIndex -= 1;
        }
        
        var intervalStart = samples[intervalStartIndex];
        var intervalEnd = samples[intervalStartIndex + 1]
        
        // the scaled value needs to be adapted to the new interval with this magic formula
        var scaledIntervalValue = (scaledValue - intervalStartIndex / intervalCount) * intervalCount;
        
        var interpolationFunction;
        switch(true) {
            case Object.isNumber(samples[0]):
                interpolationFunction = this.interpolateNumber;
                break;
            case samples[0] instanceof Color:
                interpolationFunction = this.interpolateColor;
                break;
            case samples[0] instanceof lively.Point:
                interpolationFunction = this.interpolatePoint;
                break;
            default:
                interpolationFunction = function() { return null; };
        }
        
        return interpolationFunction(intervalStart, intervalEnd, scaledIntervalValue);
    },
    interpolatePoint: function(start, end, value) {
        return pt(
            start.x + value * (end.x - start.x),
            start.y + value * (end.y - start.y)
        )
    },
    interpolateNumber: function(start, end, value) {
        return start + value * (end - start);
    },
    interpolateColor: function(start, end, value) {
        return new Color(
            start.r + value * (end.r - start.r),
            start.g + value * (end.g - start.g),
            start.b + value * (end.b - start.b),
            start.a + value * (end.a - start.a)
        );
    },
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.Table', {
    
    initialize : function($super){
        $super();
        this.description = "Table";
        this.extent = pt(400,200);
    },
    
    createTable : function(columnCount, rowCount, colors) {
        var table = this.table;
        //use existing table and try to add only columns rows
        if (this.table){
            while (this.table.numRows - rowCount < 0){
                this.table.addRow(new Array(this.table.numCols));
            }
            while (this.table.numRows - rowCount > 0){
                this.table.removeRow();
            }
            
            while (this.table.numCols - columnCount < 0){
                this.table.addCol("defaultName");
            }
            while (this.table.numCols - columnCount > 0){
                this.table.removeCol();
            }
        } else {
            //create table
            var spec = {};
            spec.showColHeads = true;
            spec.showRowHeads = false;
            
            table = new lively.morphic.DataGrid(columnCount, rowCount, spec);
            table.setFill(Color.white);
            
            table.disableGrabbing();
            table.disableDragging();
            
            this.table = table;
            if (table.numRows != 0 && table.numRows < 7 && this.component){
                this.table.setExtent(pt(this.getExtent().x, table.numRows * 30 + 50));
                this.component.setExtent(pt(this.getExtent().x, table.numRows * 30 + 50));
            }
        }
        
        // set gridmode of table cells to hidden
        // set colors of cells
        var _this = this;
        this.colHeadCells = [];
        table.rows.each(function(column){
            column.each(function(ea, index){
                if (column[0] instanceof lively.morphic.DataGridColHead){
                    if (colors && colors[index]){
                        ea.setFill(colors[index]);
                    } else {
                        ea.setFill(Color.rgbHex("D6E6F4"));
                    }
                    // attach the handler to bring up the context menu on ColHead-cells
                    _this.attachListeners(ea);
                    
                    // save the colHeadCells to re-attach the listeners on reload
                    _this.colHeadCells.push(ea);
                }
                else 
                    ea.setFill(Color.white)
                ea.setClipMode("hidden");
                ea.setWhiteSpaceHandling("nowrap");
                ea.setBorderColor(Color.rgb(144, 144, 144));
            });
        });
        return table;
    },
    onRestore: function($super) {
        $super();
        // re-attach the handlers for the context menu on the appropriate cells
        if (this.colHeadCells) {
            var _this = this;
            this.colHeadCells.each(function(ea) {
                _this.attachListeners(ea);
            });
        }
    },
    attachListeners: function(cell) {
        var oldMouseUp = cell.onMouseUp;
        // to get the hand morph
        cell.addStyleClassName('dataflow-clickable');
        var table = this;
        cell.onMouseUp = function(evt) {
            if (evt.isRightMouseButtonDown()) {
                // activate the cell, just for "beauty"-reasons
                this.activate();
                table.showContextMenu(this);
            } else if (evt.isLeftMouseButtonDown()) {
                table.handleClick(cell, "Sort");
            } else {
                // else apply the old method
                oldMouseUp.apply(cell, arguments);
            }
        }
    },
    showContextMenu: function(cell) {
        var _this = this;
        var itemNames = this.getContextMenuItems();
        
        var items = itemNames.map(function(ea) {
            return [ea, function() {
                _this.handleClick(cell, ea);
            }]
        });
        
        var menu = new lively.morphic.Menu("Select action", items);
        menu.openIn($world, cell.getPositionInWorld());
    },
    getContextMenuItems: function() {
        return [
            "Statistics",
            "Sort"
            ];
    },
    handleClick: function(cell, method) {
        var attribute = cell.getTextString();
        
        switch(method) {
            case "Statistics":
                var statistics = this.calculateStatistics(attribute);
                var inspector = lively.morphic.Charts.Component.createWindow("Table");
                inspector.setDescription("Statistics - " + attribute);
                inspector.openInWorld(cell.getPositionInWorld());
                inspector.update(statistics);
                break;
            case "Sort":
                var data = this.component.data;
                data.sort(function(a, b) {
                    if (cell.sortedAsc) {
                        // sort descending
                        return a[attribute] < b[attribute];
                    } else {
                        // sort ascending
                        return a[attribute] > b[attribute];
                    }
                });
                cell.sortedAsc = !cell.sortedAsc;
                var scrollPosition = this.table.getScroll();
                this.component.onContentChanged();
                var _this = this;
                this.table.setScroll(scrollPosition[0], scrollPosition[1]);
                break;
        }
    },
    calculateStatistics: function(attribute) {
        var data = this.component.data.pluck(attribute);
        
        var result = [];
        var heuristics = this.getStatisticFunctions();
        
        heuristics.each(function(ea) {
            result.push({heuristic: ea.name, value: ea.calculation.apply(data)});
        });
        
        return result;
    },
    getStatisticFunctions: function() {
        
        // calculate the average value
        var avg = function() {
            var sum = 0;
            var count = 0;
            this.each(function(ea) {
                if (Number.isFinite(ea)) {
                    sum += ea;
                    count++;
                }
            });
            
            return sum / count;
        }
        
        return [
            {name: "min", calculation: Array.prototype.min},
            {name: "max", calculation: Array.prototype.max},
            {name: "avg", calculation: avg}
        ];
    },
    
    updateTable : function(){
        this.submorphs.invoke("remove");
        if (this.table){
            this.table.setClipMode("auto");
            this.addMorph(this.table);
            this.table.setExtent(this.getExtent());
            this.table.layout = {resizeWidth: true, resizeHeight: true};
        }
    },
    setExtent: function($super, newExtent) {
        $super(newExtent);
        if (this.table) this.table.setExtent(newExtent);
    },
    
    update : function(data, colors){
        if (data == null || data == [] || data == {}){
            this.clearTable();
            return;
        }
        
        if (!Object.isArray(data.first())){
            //if primitive
            if (typeof data.first().valueOf() != "object") {
                this.table = this.createTable(1, data.length + 1, colors);
            } else {
                var attributes = [];
                data.each(function(ea){
                    for (var key in ea){
                        attributes.pushIfNotIncluded(key);
                    }
                });
                this.table = this.createTable(attributes.length, data.length + 1, colors);
                this.table.setColNames(attributes);
            }
        } else {
            this.table = this.createTable(data[0].length, data.length + 1, colors);
        }
        
        //add data to table
        var _this = this;
        data.each(function (ea, col){
            
            if (Object.isArray(ea)) {
                ea.each(function (el, row){
                    _this.table.atPut(row, col, el.toString())
                });
            } else {
                //if primitive
                if (typeof ea.valueOf() != "object") {
                    _this.table.atPut(0, col, ea || "-");
                } else {
                    attributes.each(function (attr, row){
                        if (ea[attr] == 0)
                            _this.table.atPut(row, col, 0);
                        else
                            _this.table.atPut(row, col, ea[attr] || "-");
                    });
                }
            }
            
        });
        this.updateTable();
        
        return data;
    },
    
    clearTable : function() {
        if (this.table){
            this.table.remove();
            this.table = undefined;
        }
        this.updateTable();
    },
    
    onDoubleClick : function() {
        this.updateCellWidth();
    },
    
    onClick : function() {
       
    },
    
    updateCellWidth : function() {
        if(!this.table) return;
       
        var table = this.table;
        var activeCell = table.rows[table.getActiveRowIndex()][table.getActiveColIndex()];
        
        if (table.getActiveRowIndex() == 0){
            activeCell = this.biggestCell(table.getActiveColIndex());
        }
        
        var oldWidth = activeCell.getExtent().x;
        var numberOfLines = activeCell.computeRealTextBounds().height / 20;
        var newWidth = activeCell.computeRealTextBounds().width * numberOfLines  + 10;
        var index = table.getActiveColIndex();
        table.setColWidth(index, newWidth);
        var diff = newWidth - oldWidth;
        
        //move all columns right of index
        for (var j = index + 1; j < table.rows[0].length; j++) {
            for (var i = 0; i < table.rows.length; i++) {
                var curCell = table.rows[i][j];
                var pos = curCell.getPosition();
                curCell.setPosition(pt(pos.x + diff, pos.y));
            }
        }
    },
    
    biggestCell: function (columnIndex) {
        var activeCell = this.table.rows[this.table.getActiveRowIndex()][columnIndex];
        
        for (var i = 1; i < this.table.rows.length; i++){
            var curentBounds = this.table.rows[i][columnIndex].computeRealTextBounds();
            var activeBounds = activeCell.computeRealTextBounds();
            if ((curentBounds.height > activeBounds.height) || 
                ((curentBounds.height == activeBounds.height) &&
                (curentBounds.width > activeBounds.width))){
                activeCell = this.table.rows[i][columnIndex];
            }
        }
        
        return activeCell;
    }
    
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.EntityViewer', {
    
    initialize : function($super){
        $super();
        this.description = "EntityViewer";
        this.extent = pt(400,200);
        
        this.layout = {adjustForNewBounds: true};
    },
    
    update : function(data){
        //data is array of entities
        this.data = data;
        
        this.submorphs.invoke("remove");
        
        if (data == null) return;
        var _this = this;
        var height = 50;
        var colorConnection = {};
        
        data.each(function (el, index){
            var table = new lively.morphic.Charts.Table();
            
            var formattedEntities = _this.formatEntities(el.items);
            var color;
            
            if (formattedEntities.items[0]._entityType && (color = colorConnection[formattedEntities.items[0]._entityType])){
                //if table is entity and is referenced (by another table) color whole table head
                Properties.own(formattedEntities.items[0]).each(function(ea, index){
                    formattedEntities.colors[index] = color;
                });
            } 
            
            //add colors to colorConnection 
            Properties.own(formattedEntities.connections).each(function(ea){
                colorConnection[ea] = formattedEntities.connections[ea];
            })
            
            table.update(formattedEntities.items, formattedEntities.colors);
            
            var width = _this.component.getExtent().x - 30;
            if (table.table.numRows != 0 && table.table.numRows < 7){
                table.setExtent(pt(width, (table.table.numRows - 1) * 30 + 50));
            } else {
                table.setExtent(pt(width, 200));
            }    
            
            table.setPosition(pt(10, height - 10));
            _this.addMorph(table);
            
            if (table.layout) {
                table.layout.resizeHeight = false;
            } else {
                table.layout = {
                    resizeHeight: false,
                    resizeWidth: true,
                    adjustForNewBounds: true
                }
            }
            
            //create table description
            var text = new lively.morphic.Text();
            text.setTextString(el.entityTypeName);
            text.setFillOpacity(0);
            text.setBorderWidth(0);
            text.setExtent(pt(200,20));
            text.setPosition(pt(10, height - 40));
            _this.addMorph(text);
            height += table.getExtent().y  + 40;
        });
        
        this.component.setExtent(pt(this.getExtent().x, height));//data.length * 240 + 40));
    },
    
    formatEntities : function (items){
        var _this = this;
        var addColor = function(index, entityType){
            var color = _this.getColors(Properties.own(colors).length);
            colors[index] = color; 
            connections[entityType] = color; 
        };
        var connections = {};
        var colors = {};
        var items = items.map(function (row, rowIndex){
            var newRow = {};
            Properties.own(row).map(function(cellAttribute, columnIndex){
                var cell = row[cellAttribute];
                var entityType = cell._entityType;
                if (entityType){
                    if (rowIndex == 0) addColor(columnIndex, entityType);
                    newRow[cellAttribute] = entityType;
                    return;
                } else if (Object.isArray(cell)){
                    entityType = cell.first()._entityType;
                    if (entityType){
                        if (rowIndex == 0) addColor(columnIndex, entityType);
                        newRow[cellAttribute] = entityType + "s";
                        return;
                    } 
                } 
                newRow[cellAttribute] = cell;
            });
            return newRow;
        });
        return {items: items, colors: colors, connections: connections};
    },
    
    getColors : function(index){
        var colors = [Color.rgbHex("#428bca"),
                Color.rgbHex("#47a447"),
                Color.rgbHex("#39b3d7"),
                Color.rgbHex("#ed9c28"),
                Color.rgbHex("#d2322d")];
        return colors[index % colors.length];
    }
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.JsonViewer',
'default category', {
    
    initialize: function($super) {

        $super();
        this.description = "JsonViewer";
        this.extent = pt(400, 200);
        
        this.objectTree = new lively.morphic.Tree();
        this.objectTree.setName("ObjectInspectorTree");
        this.addMorph(this.objectTree);
    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.objectTree.setExtent(newExtent.subPt(pt(1, 0)));
    },
    
    update: function(data) {
        if (data != null)
            this.inspect(data);
            
        return data;
    },
    
    addChildrenTo: function(item) {
        var value = item.data;
        // don't add any children for primitives or empty objects
        if(this.isPrimitive(value) || Object.isEmpty(value.valueOf())) return;
        item.children = [];
        Object.addScript(item, function onExpand() { this.inspector.expand(this); });
        Object.addScript(item, function onUpdateChildren() { this.inspector.expand(this); });
    },
    
    
    colorize: function(obj) {
        if (obj == null) return;
        switch (typeof obj.valueOf()) {
            case "string": return {color: Color.web.green};
            case "number": return {color: Color.rgb(255, 115, 0)};
            case "boolean" : return {color: Color.web.purple};
        }
    },
    
    
    createAccessorItem: function(obj, property) {
        var item = {data: obj, inspector: this, name: property};
        this.decorate(item);
        Object.addScript(item, function onUpdate() {
            this.inspector.decorate(this);
        });
        return item;
    },
    
    
    createItem: function(obj, property) {
        var value = obj[property];
        // try to convert strings to number
        value = this.tryToParseNumber(value);
        
        var item = {data: value, inspector: this, name: property, parent: obj};
        this.addChildrenTo(item);
        this.decorate(item);
    
        Object.addScript(item, function onUpdate() {
            this.inspector.decorate(this);
        });
        return item;
    },
    
    
    createPrototypeItem: function(proto, parentItem) {
        var item = {data: proto, inspector: this, name: " ", doNotSerialize: ["data"], parentItem: parentItem};
        item.description = "inherited from " + this.prototypename(proto);
        this.addChildrenTo(item);
        Object.addScript(item, function onUpdate() {
            this.description = "inherited from " + this.inspector.prototypename(this.data);
        });
        return item;
    },
    
    
    decorate: function(item) {
        item.description = this.describe(item.data);
        item.descriptionStyle = this.colorize(item.data);
    },
    
    
    describe: function(obj) {
        var str;
        if (obj && obj.name) {
            if(typeof obj.name.valueOf() == 'string')
                str = obj.name;
            else if(typeof obj.name == 'function' && obj.name.length == 0) {
                try {    
                    str = obj.name();
                } catch(e) {}
            }
        }
        if (!str) str = Objects.shortPrintStringOf(obj);
        if (str.length > 32) str = str.substring(0, 32) + '...';
        return ":  " + str;
    },
    
    
    expand: function(item) {
        var alreadyThere = [];
        var i = item.parentItem;
        while(i) {
            i.children.each(function(it) {
                if(i !== it) {
                    alreadyThere.push(it.name);
                }
            });
            i = i.parentItem;
        }
        var value = Objects.asObject(item.data);
        var currentFilter = this.getFilter();
        var filter = currentFilter;
        if(alreadyThere.length > 0) {
            filter = function(obj, prop) {
                return currentFilter(obj, prop) && !alreadyThere.include(prop);
            }
        }
        var props = [], visitedProps = [], accessors = {};
        Properties.allOwnPropertiesOrFunctions(value, filter).each(function(prop) {
            if(!visitedProps.include(prop)) {
                visitedProps.push(prop);
                var descr = Object.getOwnPropertyDescriptor(value, prop);
                if(descr) { 
                    if(descr.get) {
                        accessors["get " + prop] = descr.get;
                        props.push("get " + prop);
                    } else
                        props.push(prop);
                    if(descr.set) {
                        accessors["set " + prop] = descr.set;
                        props.push("set " + prop);
                    }
                } else
                    props.push(prop);
            }
        });
        // var valueProto = Object.getPrototypeOf(value);
        // var proto = valueProto;
        // while(proto) {
        //     Properties.allOwnPropertiesOrFunctions(proto, filter).each(function(prop) {
        //         if(!visitedProps.include(prop)) {
        //             visitedProps.push(prop);
        //             var descr = Object.getOwnPropertyDescriptor(proto, prop);
        //             if((!descr || !descr.get) && value[prop] !== proto[prop]) {
        //                 props.push(prop);
        //                 if(descr.set) {
        //                     accessors["set " + prop] = descr.set;
        //                     props.push("set " + prop);
        //                 }
        //             }
        //         }
        //     });
        //     proto = Object.getPrototypeOf(proto);
        // }
        if (props.length > 1) props = props.sort();
        var newChildren = [];
        if(Array.isArray(value)) {
            this.expandIndexedChildren(item, newChildren);
        }
        var lookupKeys = [], lookupValues = [];
        item.children.each(function(i) { 
            lookupKeys.push(i.name);
            lookupValues.push(i);
        });
        props.each(function(prop) {
            var existingIndex = lookupKeys.indexOf(prop);
            var accessor = (prop.startsWith("get ") || prop.startsWith("set ")) && accessors[prop];
            if (existingIndex > -1) {
                var existing = lookupValues.at(existingIndex);
                existing.data = accessor ? accessor : value[prop];
                this.decorate(existing);
                newChildren.push(existing);
            } else {
                newChildren.push(accessor ? this.createAccessorItem(accessor, prop) : this.createItem(value, prop));
            }
        }, this);
        // if (valueProto) {
        //     var existing = item.children.detect(function(i) { return i.data === valueProto && i.parentItem; });
        //     if (existing) {
        //         newChildren.push(existing);
        //     } else {
        //         newChildren.push(this.createPrototypeItem(valueProto, item));
        //     }
        // }
        if(newChildren.length == 0) {
            delete item.children;
            delete item.onExpand;
            delete item.onUpdateChildren;
        }
        else {
            item.children = newChildren;
        }
    },
    
    
    expandIndexedChildren: function(item, children) {
        var o = item.data;
        var lookupKeys = [], lookupValues = [];
        item.children.each(function(i) { 
            lookupKeys.push(i.name);
            lookupValues.push(i);
        });
        for(var i = 0; i < (0 | ((o.length + 98) / 100)); i++) {
            var end = 99;
            if(i + 1 === (0 | ((o.length + 98) / 100))) {
                end = (o.length - 1) % 100;
            }
            var name = '' + i * 100 + '..' + (i * 100 + end);
            var existingIndex = lookupKeys.indexOf(name);
            if (existingIndex > -1) {
                var existing = lookupValues.at(existingIndex);
                existing.data = o;
                children.push(existing);
            } else {
                var rangeItem = {data: o, inspector: this, name: name, start: i * 100, end: i * 100 + end};
                rangeItem.children = [];
                Object.addScript(rangeItem, function onExpand() { this.inspector.expandRange(this); });
                Object.addScript(rangeItem, function onUpdateChildren() { this.inspector.expandRange(this); });
                children.push(rangeItem);
            }
        }
        if(1 === o.length % 100) {
            var name = '' + (o.length - 1);
            var existingIndex = lookupKeys.indexOf(name);
            if (existingIndex > -1) {
                var existing = lookupValues.at(existingIndex);
                existing.data = o[o.length - 1];
                children.push(existing);
            } else {
                children.push(this.createItem(o, name));
            }
        }
    },
    
    
    expandRange: function(item) {
        var o = item.data;
        var start = item.start;
        var end = item.end;
        if(item.children.length - 1 == end - start) {
            for(var i = start; i <= end; i++) {
                var existing = item.children[i - start];
                existing.data = o[i];
                this.decorate(existing);
            }
        } else {
            var newChildren = [];
            for(var i = start; i <= end; i++) {
                newChildren.push(this.createItem(o, '' + i));
            }
            item.children = newChildren;
        }
    },
    
    
    getFilter: function() {
        if (!this.filter) {
            // always show all properties
            this.setFilter("properties");
        }
        return this.filter;
    },
    
    
    inspect: function(data) {
        this.tree = this.get("ObjectInspectorTree");
    
        // this starts the actual inspection
        this.tree.setItem(this.createItem({"this": Object.clone(data)}, "this"));
        
        var startTime = new Date().getTime();
        var maximalTime = 500;
        function expand(root, maxDepth, depth) {
            var endTime = new Date().getTime();

            if (endTime - startTime > maximalTime) {
                return;
            }
            
            if (!maxDepth) maxDepth = 10;
            if (!depth) depth = 0;
            if (depth > maxDepth) return;
            if (root.toggle) root.toggle();
            // expand only the first tree in the first level
            if (depth <= Object.isArray(data) ? 1 : 0) {
                var firstTree = root.submorphs.find(function (ea) {
                    return ea instanceof lively.morphic.Tree;
                })
                if (firstTree)
                    expand(firstTree, maxDepth, depth + 1);
            } else {
                // expand all subtrees of the first element
                for (var i = 0; i < root.submorphs.length; i++) {
                    if (root.submorphs[i] instanceof lively.morphic.Tree)
                        expand(root.submorphs[i], maxDepth, depth + 1);
                }
            }
        }

        expand(this.get("ObjectInspectorTree"), 3);
    },
    
    
    isPrimitive: function(arg) {
      return arg == null || (typeof arg.valueOf() != "object");
    },
    
    
    prototypename: function(proto) {
        var protoName = proto.constructor.type || proto.constructor.name;
        if(protoName) {
            return protoName + '.prototype';
        }
        return proto.toString();
    },
    
    
    reset: function() {
        this.stopStepping();
        this.get("ObjectInspectorTree").reset();
        this.applyLayout();
    },
    
    
    setFilter: function(str) {
        var startsAlphaNum = /^[a-zA-Z0-9]/;
        var fn = {
            standard: function(obj, prop) {
                if(Array.isArray(obj) || typeof obj.valueOf() == 'string') {
                    if((0 | prop) == prop) {
                        return false;
                    }
                }
                return startsAlphaNum.test(prop) &&
                    obj.propertyIsEnumerable(prop);
            },
            properties: function(obj, prop) {
                if(Array.isArray(obj) || typeof obj.valueOf() == 'string') {
                    if((0 | prop) == prop) {
                        return false;
                    }
                }
                return true;
            },
            submorphs: function(obj, prop) {
                if(Array.isArray(obj)) {
                    if((0 | prop) == prop) {
                        return false;
                    }
                }
                return prop == 'submorphs' || 
                    obj[prop] instanceof lively.morphic.Morph;
            },
        };
        this.filter = fn[str];
        if(this.tree.item) {
            this.addChildrenTo(this.tree.item);
        }
        var that = this;
        //this.tree.layoutAfter(function() { that.update(); });
    },
    
    
    tryToParseNumber: function(value) {
        if (!isNaN(parseFloat(value)) && isFinite(value)){
            value = parseFloat(value);
        }
        return value;
    },
    
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.Script',
'default category', {
    
    initialize : function($super){
        $super();
        this.description = "Script";
        this.extent = pt(400, 200);

        this.codeEditor = new lively.morphic.Charts.CodeEditor();
        this.codeEditor.setName("CodeEditor");
        this.codeEditor.setTextString(this.getDefaultCodeString());
        this.codeEditor.layout = {
            resizeWidth: true,
            resizeHeight: true
        };
        this.addMorph(this.codeEditor);
    },
    
    setExtent: function($super, newExtent) {
        $super(newExtent);
        this.codeEditor.setExtent(newExtent);
    },
    
    update: function(data) {
        this.codeEditor.doitContext = this;
        this.data = data;
        
        if (!this.codeEditor.getSelectionRangeAce())
            return this.data;
        
        var returnValue = this.codeEditor.evalAll();
        
        if (returnValue instanceof Error) {
            this.throwError(returnValue);
        }

        // return value of last expression
        return returnValue;
    },
    
    migrateFromPart: function(oldComponent) {
        this.codeEditor.setTextString(oldComponent.content.codeEditor.getTextString());
    },
    
    removalNeedsConfirmation: function() {
        var currentCode = this.codeEditor.getTextString()
        return currentCode.length > 0 && currentCode != this.getDefaultCodeString();
    },
    
    getDefaultCodeString: function() {
        var existingScripts = lively.morphic.Charts.DataFlowComponent.getAllComponents();
        return existingScripts.length ? "data" : "[1, 2, 3, 4]";
    }
});
lively.morphic.Charts.Script.subclass('lively.morphic.Charts.JsonFetcher', {
    initialize: function($super) {
        $super();
        this.description = "JsonFetcher";
        this.extent = pt(400, 100);
        this.codeEditor.setTextString('data = $.ajax("https://api.github.com/users");');
    },
    
    removalNeedsConfirmation: function() {
        return true;
    }
});


lively.morphic.Charts.DataFlowComponent.subclass('lively.morphic.Charts.Fan',
'default category', {
    
    initialize : function($super, content){
        $super(content);
        this.removeSubmorph("Minimizer");
        this.removeSubmorph("ComponentBody");
        this.removeSubmorph("Swapper");
        this.removeSubmorph("BottomReframeHandle");
        this.removeSubmorph("ReframeHandle");
    },

    calculateSnappingPosition: function() {
        var componentsAbove = this.getComponentsInDirection(-1);
        var componentAbove;
        if (componentsAbove.length > 0)
            componentAbove = componentsAbove.first();

        if (componentAbove && !componentAbove.isMerger()) {
            // snap below component above
            var posBelowComponent = componentAbove.getPosition().addPt(pt(0,componentAbove.getExtent().y + this.componentOffset));
            var snappingThreshold = 200;
            if (this.getPositionInWorld().y < posBelowComponent.y + snappingThreshold) {
                // snap directly below component above
                return posBelowComponent;
            }
            // snap into column of component above
            var yGrid = this.calculateSnappingPositionInGrid().y;
            return pt(posBelowComponent.x, yGrid);
        } else {
            return this.calculateSnappingPositionInGrid();
        }
    },

    calculateSnappingExtent: function(ignoreComponentAbove) {
        
        var componentsAbove = this.getComponentsInDirection(-1);
        var oldExtent = this.getExtent();
        var offsetX = 0;
        var offsetY = 0;

        // Find the nearest fitting snapping extent
        if (oldExtent.x % this.gridWidth > this.gridWidth / 2) {
            offsetX = this.gridWidth;
        }
        if (oldExtent.y % this.gridWidth > this.gridWidth / 2) {
            offsetY = this.gridWidth;
        }
        
        if (componentsAbove.length > 0  && !ignoreComponentAbove) {
            // calculate extent depending on the extent of some other component
            
            if (componentsAbove.length == 1) {
                width = componentsAbove[0].getExtent().x;
            } else {
                var componentXes = componentsAbove.map(function(ea) { return ea.getPosition().x });
                var width = componentXes.max() - componentXes.min();
                width += componentsAbove.last().getExtent().x;
                width = Math.max(100, width);
            }
            return pt(width, Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY);
        } else {
            // calculate new extent depending on raster
            var x = Math.floor(oldExtent.x / this.gridWidth) * this.gridWidth + offsetX;
            var y = Math.floor(oldExtent.y / this.gridWidth) * this.gridWidth + offsetY;
            return pt(x,y);
        }
    },

    isMerger: function() {
        return true;
    },
    
    updateComponent: function() {
        // nothing needs to be done, just resolve with the old data
        return new $.Deferred().resolve(this.data);
    },
    removeSubmorph: function(name) {
        var submorphs = this.getSubmorphsByAttribute("name", name);
        if (submorphs.length)
        {
            submorphs[0].remove();
        }
    },
    

    

});

lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanIn',
'default category', {

    initialize : function($super){
        var nullContent = new lively.morphic.Charts.NullContent();
        nullContent.description = "FanIn";
        this.extent = pt(400, 100);
        
        $super(nullContent);
        
        this.arrows[0].positionAtMorph();
    },

    refreshData: function() {
        this.data = null;

        var componentsAbove = this.getComponentsInDirection(-1);
        for (var i = 0; i < componentsAbove.length; i++) {
            this.data = this.data || [];
            this.data.push(componentsAbove[i].getData(this));
        }
    },
});
lively.morphic.Charts.Fan.subclass('lively.morphic.Charts.FanOut',
'default category', {
    
    initialize : function($super){
        var nullContent = new lively.morphic.Charts.NullContent();
        nullContent.description = "FanOut";
        this.extent = pt(400, 100);
        
        $super(nullContent);

        //delete arrow
        this.arrows[0].remove();
        this.arrows.clear();
    },

    refreshData: function() {
        this.data = null;

        // take the first component to the top
        // if there are multiple ones take the first from the left
        var componentAbove = this.getComponentInDirection(-1);
        if (componentAbove)
            this.data = componentAbove.getData(this);
    },
    onResizeEnd: function($super) {
        $super();
        var _this = this;
        this.arrows.each(function (ea) {
            if (_this.getPosition().x + _this.getExtent().x < ea.target.getPosition().x) {
                _this.removeArrowFromArray(ea);
                ea.remove();
            }
        })
    },
    handleLowerNeighborMoved: function(component) {
        var arrowToTarget = this.getArrowToTarget(component);
        if (arrowToTarget) {
            this.removeArrowFromArray(arrowToTarget);
            arrowToTarget.remove();
        }
    },
    getArrowToTarget: function(target) {
        return this.arrows.detect(function (arrow){
            var arrowX =  arrow.getTipPosition().x;
            return target.getPositionInWorld().x <= arrowX &&
                arrowX <= target.getPositionInWorld().x + target.getExtent().x;
        });
    },


    getData : function(target){
        var arrowToTarget = this.getArrowToTarget(target);
        
        if (!arrowToTarget){
            //create new arrow for this target
            var offset = this.getPosition().x;
            var positionX = target.getExtent().x / 2 + target.getPosition().x - 20 - offset;
            var newArrow = new lively.morphic.Charts.Arrow(this, positionX);
            newArrow.activate();
            return this.data;
        }
        
        if (arrowToTarget.isActive()) {
            return this.data;
        }
        
        return null;
    },
    
    migrateFromPart: function(oldComponent) {
        var _this = this;
        this.arrows.each(function(ea) {
            _this.addMorph(ea);
        })
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Minimizer",
{
    initialize: function($super) {
        $super();
        
        var width = 20;
        var height = 8;
        
        this.setFillOpacity(0);
        this.setExtent(pt(width, height));
        this.setName("Minimizer");
        this.addStyleClassName('dataflow-clickable');
        this.orientation = "up";
        
        var vertices = [pt(0, height), pt(width / 2, 0), pt(width, height)];
        this.line = new lively.morphic.Path(vertices);
        this.line.setBorderColor(Color.white);
        this.line.setBorderWidth(2);
        
        this.addMorph(this.line);
        this.submorphs[0].disableEvents();
        
    },
    
onMouseUp: function(evt) {

        var component = this.owner.owner;
        
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            if (component.isMinimized) {
                component.setExtent(pt(component.getExtent().x, component.maximizedHeight));
                component.componentBody.setVisible(true);
                component.isMinimized = false;
            } else {
                component.maximizedHeight = component.getExtent().y;
                component.componentBody.setVisible(false);
                component.setExtent(pt(component.getExtent().x, 24 + 6));
                component.isMinimized = true;
            }
            this.flip();
        }
        
    },
    flip: function() {
        
        var points = this.submorphs[0].getControlPoints();
        var width = this.getExtent().x;
        var height = this.getExtent().y;
        
        if (this.orientation === "up") {
            points[0].setPos(pt(0, 0));
            points[1].setPos(pt(width / 2, height));
            points[2].setPos(pt(width, 0));
            this.orientation = "down";
        } else {
            points[0].setPos(pt(0, height));
            points[1].setPos(pt(width / 2, 0));
            points[2].setPos(pt(width, height));
            this.orientation = "up";
        }
        
    },
    
    applyDefaultStyle: function() {
        this.line.setBorderColor(Color.white);
    },
    
    applyErrorStyle: function() {
        this.line.setBorderColor(Color.rgb(169, 68, 66));
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Swapper",
{
    initialize: function($super) {
        $super();
        
        var width = 10;
        var height = 10;
        
        this.setFillOpacity(0);
        this.setExtent(pt(width, height));
        this.setName("Swapper");
        this.addStyleClassName('dataflow-clickable');
        
        var vertices = [pt(0, 0),  pt(width / 2, height - 1), pt(width, 0)];
        var line = new lively.morphic.Path(vertices);
        line.setBorderColor(Color.white);
        line.setBorderWidth(2);
        this.addMorph(line);
        
        this.submorphs[0].disableEvents();
    },
    onMouseUp: function(evt) {
        console.log("menu");
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            this.showContentMenu();
        }
        // evt.stopPropagation();
        return false;
    },
    showContentMenu: function() {
        var component = this.owner.owner;
        
        var componentNames = lively.morphic.Charts.Component.getComponentNames().filter(function(ea) {
            return ea != "FanIn" && ea != "FanOut"
        });
        
        var contextItems = componentNames.map(function(ea) {
            return [ea, function() {
                component.swapContent(ea);
            }];
        });
        
        var menu = new lively.morphic.Menu("Select Viewer", contextItems);
        menu.openIn($world, this.getPositionInWorld());
        
        var _this = this;
        setTimeout(function() {
            menu.setPosition(_this.getPositionInWorld().subPt(pt(menu.getExtent().x, 0)));
        }, 0);
    }
});

lively.morphic.Morph.subclass("lively.morphic.Charts.Closer",
{
    initialize: function($super) {
        $super();
        
        var width = 10;
        var height = 10;
        
        this.setFillOpacity(0);
        this.setExtent(pt(width, height));
        this.setName("Closer");
        this.addStyleClassName('dataflow-clickable');
        
        var vertices = [pt(0, 0), pt(width, height)];
        var line = new lively.morphic.Path(vertices);
        line.setBorderColor(Color.white);
        line.setBorderWidth(2);
        this.addMorph(line);
        
        vertices = [pt(0, height), pt(width, 0)];
        line = new lively.morphic.Path(vertices);
        line.setBorderColor(Color.white);
        line.setBorderWidth(2);
        this.addMorph(line);
        
        this.submorphs[0].disableEvents();
        this.submorphs[1].disableEvents();
        
    },
    
    onMouseUp: function(evt) {
        var component = this.owner.owner;
        
        if (evt.isLeftMouseButtonDown() && !evt.isCtrlDown()) {
            if (!component.removalNeedsConfirmation() || confirm('Are you sure you want to close this component?')) {
                component.remove();
            }
        }
    },
});

Object.subclass('lively.morphic.Charts.EntityFactory',
'default category', {

    initialize: function($super) { },

    createEntityTypeFromList : function(entityTypeName, list, identityFunction) {

        var createEntityTypeFromList, _makeEntityType, _clearBackReferences, _addBackReferencesTo, __extractEntityTypeFromList, __extractEntityFromAttribute;

        createEntityTypeFromList = function(entityTypeName, list, identityFunction) {
          return _makeEntityType(entityTypeName, list);
        };

        __extractEntityFromAttribute = function (entityTypeName, identityFunction, sourceName) {
          return this.extractEntityFromList(entityTypeName, identityFunction, sourceName, true);
        };

        __extractEntityTypeFromList = function (entityTypeName, identityFunction, sourceListName, noArray) {
            var isFunction = function (functionToCheck) {
               var getType = {};
               return functionToCheck && getType.toString.call(functionToCheck) === '[object Function]';
            };

          if (!isFunction(identityFunction)) {
              var attr = identityFunction;

              identityFunction = function(ea) { return ea[attr] };
          }

          var currentEntityType = this;
          var allNewEntities = {};

          var _getOrAdd = function(file) {
              var id = identityFunction(file);
              if (allNewEntities[id])
                  return allNewEntities[id];
              else {
                  allNewEntities[id] = file;
                  return file;
              }
          };

          // clearBackReferences
          currentEntityType.getAll().each(function(eachCurrentEntity) {
            var newEntities;
            if (noArray) {
              var eachNewEntity = eachCurrentEntity[sourceListName];
              currentEntityType._clearBackReferences(eachNewEntity);
            } else {
              newEntities = eachCurrentEntity[sourceListName];
              newEntities.each(function(eachNewEntity, index) {
                currentEntityType._clearBackReferences(eachNewEntity);
              });
            }
          });

          currentEntityType.getAll().each(function(eachCurrentEntity) {
            var newEntities;
            if (noArray) {
              var eachNewEntity = eachCurrentEntity[sourceListName];
              eachNewEntity = _getOrAdd(eachNewEntity);
              // replace the reference in the array to avoid multiple objects for the same entity
              eachCurrentEntity[sourceListName] = eachNewEntity;
              currentEntityType._addBackReferencesTo(eachNewEntity, eachCurrentEntity, entityTypeName);
            } else {
              newEntities = eachCurrentEntity[sourceListName];
              newEntities.each(function(eachNewEntity, index) {
                eachNewEntity = _getOrAdd(eachNewEntity);
                // replace the reference in the array to avoid multiple objects for the same entity
                newEntities[index] = eachNewEntity;
                currentEntityType._addBackReferencesTo(eachNewEntity, eachCurrentEntity, entityTypeName);
              });
            }
          });
    
          // convert to array
          allNewEntities = Properties.own(allNewEntities).map(function(key) {return allNewEntities[key]})

          return _makeEntityType(entityTypeName, allNewEntities);
        };

        _makeEntityType = function(entityTypeName, list) {

          var Entity = {
            items : list,
            entityTypeName : entityTypeName,
            itemsProto : {}
          };

          var proto = {
            extractEntityFromList : __extractEntityTypeFromList,
            extractEntityFromAttribute : __extractEntityFromAttribute,
            _addBackReferencesTo : _addBackReferencesTo,
            _clearBackReferences : _clearBackReferences,
            getAll : function() { return Entity.items },
            _isEntity: true,
            _getEntityType: function() {return }
          };

          Entity.__proto__ = proto;

          Entity.setIdentityAttribute = function(attributeGetter) {

            Entity.items = Entity.getAll().uniqBy(function(a, b) { return attributeGetter(a) == attributeGetter(b) });

            // Entity.getIdentity = ... ?

            return Entity.items;
          };

          Entity.mapTo = function() {
            console.warn("yet to implement");
          }

          return Entity;
        };
        
        _clearBackReferences = function(entity) {
            var attribute = "referencing" + this.entityTypeName + "s";
            entity[attribute] = [];
        };

        _addBackReferencesTo = function(entity, reference, entityTypeName) {

          var attribute = "referencing" + this.entityTypeName + "s";
          
          if (!entity[attribute])
            entity[attribute] = [];

          entity._entityType = entityTypeName;
          
          entity[attribute].push(reference);

          Object.defineProperty(entity, attribute, {
            enumerable: false,
            writable: true
          });

          entity["get" + this.entityTypeName + "s"] = function() {
            return this[attribute];
          };

          return entity;
        };

        return _makeEntityType(entityTypeName, list);
    },



});

lively.morphic.Path.subclass("lively.morphic.Charts.Scale", {
    initialize: function($super, dimension, length, spec) {
        this.dimension = dimension;
        this.property = spec.key;
        this.fixedMin = spec.from;
        this.fixedMax = spec.to;
        this.tickCount = spec.sectors;
        this.labelFrequency = spec.labels;
        this.pitchlines = [];
        this.labels = [];

        if (dimension == "x") {
            $super([pt(0, 0), pt(length, 0)]);
        } else if (dimension == "y") {
            $super([pt(0, length), pt(0, 0)]);
        }
        
        this.addDescription();
        this.createArrowHeadEnd();
    },
    addDescription: function() {
        var description = lively.morphic.Text.makeLabel(this.property);
        description.setFill(Color.white);
        description.setBorderColor(Color.rgbHex("#f0ad4e"));
        description.setBorderWidth(1);
        description.setBorderRadius(5);
        
        var _this = this;
        if (this.dimension == "x") {
            setTimeout(function () {
                description.setOrigin(pt(description.getBounds().right() / 2, 0));
                description.setPosition(pt(_this.getExtent().x / 2, _this.getExtent().y).addPt(pt(0, 30)));
            }, 0);
        } else if (this.dimension == "y") {
            setTimeout(function () {
                description.setOrigin(pt(description.getBounds().right() / 2, 0));
                description.rotateBy(-Math.PI / 2);
                description.setPosition(pt(-70, _this.getExtent().y / 2));
            }, 0);
        }
        
        this.description = description;
        this.addMorph(description);
    },
    addPitchlines: function() {
        // add pitchlines if neccessary
        
        // if the range did't change, do not refresh the lines
        if (this.min == this.priorMin && this.max == this.priorMax)
            return;
            
        this.priorMin = this.min;
        this.priorMax = this.max;
            
        // delete all pitchlines and redraw them with the updated range
        this.clearPitchlines();
        for (var absValue = 0, i = 0; i < this.tickCount; absValue += this.length / this.tickCount, i++) {
            this.pitchlines.push(this.addPitchlineAt(absValue, this.min + i * this.tickRange, i % this.labelFrequency == 0));
        }
        
        this.description.bringToFront();
    },
    determineSpec: function(data) {
        this.length = this.getExtent()[this.dimension];
        
        var values = data.pluck(this.property).filter(function (ea) { return ea !== undefined});
        this.max = (this.fixedMax != undefined) ? this.fixedMax : Math.max.apply(null, values);
        this.min = (this.fixedMin != undefined) ? this.fixedMin : Math.min.apply(null, values);
        
        if (this.tickCount == undefined)
                this.tickCount = Math.ceil(this.length / 20) - 1;
        
        this.labelFrequency = this.labelFrequency || 5;
        
        if (this.fixedMin != undefined || this.fixedMax != undefined) {
            this.tickRange = (this.max - this.min) / this.tickCount;
        } else {
            this.tickRange = this.calculateTickRange(this.max - this.min, this.tickCount);
        }
        if (this.fixedMin == undefined)
            this.min = this.tickRange * Math.floor(this.min / this.tickRange);
        if (this.fixedMax == undefined)
            this.max = this.tickRange * this.tickCount + this.min;
    },
    clearPitchlines: function() {
        this.pitchlines.each(function(ea) {
            ea.remove();
        });
        this.labels.each(function(ea) {
            ea.remove();
        });
    },
    addPitchlineAt: function(absValue, value, isMajor) {
        var pitchlineLength = isMajor ? 10 : 5;
        var borderWidth = this.getBorderWidth();
        if (isMajor && value != undefined) {
            this.addLabel(absValue, value, pitchlineLength);
        }
        if (this.dimension == "x") {
            var line = new lively.morphic.Path([
                pt(absValue, 0),
                pt(absValue, pitchlineLength)
            ]);
        } else if (this.dimension == "y") {
            var line = new lively.morphic.Path([
                pt(0, this.length - absValue - borderWidth),
                pt(-pitchlineLength, this.length - absValue - borderWidth)
            ]);
        }
        this.addMorph(line);
        return line;
    },
    addLabel: function(absValue, value, pitchlineLength) {
        var pitchlineLength = pitchlineLength || 10;
        var borderWidth = this.getBorderWidth();
        value = (Math.round(value) || 0).toLocaleString();
        var label = lively.morphic.Text.makeLabel(value);
        label.setToolTip(value);
        
        var _this = this;
        setTimeout(function () {
            if (_this.dimension == "x") {
                label.setOrigin(pt(label.getBounds().right() / 2, 0));
                label.setPosition(pt(absValue, pitchlineLength));
            } else if (_this.dimension == "y") {
                label.setOrigin(pt(label.getBounds().right(), label.getBounds().bottom() / 2));
                label.setPosition(pt(-pitchlineLength, _this.length - absValue - borderWidth))
            }
            label.setOpacity(1);
        }, 0);
        label.setOpacity(0);
        this.labels.push(label)
        this.addMorph(label);
        return label;
    },
    addMarker: function(morph) {
        var labelValue = morph["property" + this.dimension.toUpperCase()];
        if (this.dimension == "x") {
            var absValue = morph.getPosition().x - this.getPosition().x;
        } else if (this.dimension == "y") {
            var absValue = this.length - (morph.getPosition().y - this.getPosition().y);
        }
        this.marker = this.addLabel(absValue, labelValue);
        this.marker.setFill(Color.white);
        this.marker.setBorderColor(Color.rgbHex("#f0ad4e"));
        this.marker.setBorderWidth(1);
        this.marker.setBorderRadius(5);
        
        this.markerLine = this.addPitchlineAt(absValue, undefined, true);
        this.markerLine.setBorderColor(Color.rgbHex("#f0ad4e"));
    },
    removeMarker: function() {
        if (this.marker) {
            this.marker.remove();
        }
        if (this.markerLine) {
            this.markerLine.remove();
        }
    },

    calculateTickRange: function(range, tickCount) {
        var unroundedTickSize = range / (tickCount - 1);
        var x = Math.ceil(Math.log(unroundedTickSize, 10) / Math.LN10 - 1);
        var pow10x = Math.pow(10, x);
        var roundedTickRange = Math.ceil(unroundedTickSize / pow10x) * pow10x;
        return roundedTickRange;
    },
    
    update: function(data) {
        console.log("Scale update");
        this.determineSpec(data);
        this.addPitchlines();
        this.positionMorphs(data, this.min, this.max);
    },
    positionMorphs: function(data) {
        var _this = this;
        data.each(function (ea) {
            // TODO select the correct morph
            var morph = ea.morphs[Object.keys(ea.morphs)[0]];
            // calculate relative position on scale, LINEAR
            var relValue = ((ea[_this.property] || 0) - _this.min) / (_this.max - _this.min);
            var absValue = relValue * _this.length;
            var scalePosition = _this.getPosition();
            var newPosition = morph.getPosition().copy();
            if (_this.dimension == "x") {
                morph.propertyX = ea[_this.property];
                newPosition.x = absValue + scalePosition.x;
                if (!morph.scaleXListenersAttached) {
                    _this.attachListener(morph, absValue);
                }
            } else {
                morph.propertyY = ea[_this.property];
                newPosition.y = _this.length - absValue + scalePosition.y;
                if (!morph.scaleYListenersAttached) {
                    _this.attachListener(morph, absValue);
                }
            }
            morph.setPosition(newPosition);
        });
    },
    attachListener: function(morph, absValue) {
        // if (this.dimension == "x") {
        //     morph.scaleXListenersAttached = true;
        // } else if (this.dimension == "y") {
        //     morph.scaleYListenersAttached = true;
        // }
        var _this = this;
        var oldMouseOver = morph.onMouseOver;
        morph.onMouseOver = function (evt) {
            if (oldMouseOver)
                oldMouseOver.apply(morph, arguments);
            _this.addMarker(morph);
        }
        var oldMouseOut = morph.onMouseOut;
        morph.onMouseOut = function (evt) {
            if (oldMouseOut)
                oldMouseOut.apply(morph, arguments);
            _this.removeMarker(morph);
        }
    },
    createArrow: function () {
        var arrowHead = new lively.morphic.Path([pt(0,0), pt(10,4.5), pt(0,9)]);
        arrowHead.applyStyle({borderWidth: 1, borderColor: Color.black})
        arrowHead.adjustOrigin(pt(10, 6));
        return arrowHead;
    }
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.DataImporter', {
    initialize: function($super) {
        $super();
        this.promises = [];
        
        this.description = "Data Importer";
        this.extent = pt(400, 200);
        
        this.setLayouter(new lively.morphic.Layout.HorizontalLayout());
        this.setClipMode("hidden");
        
        this.fileList = this.createFileList();
        var dropArea = this.createDropArea();

        this.addMorph(this.fileList);
        this.addMorph(dropArea);
        
        
        this.setUpPasteHandling();
},
    
    createDropArea: function() {
        var grey = Color.rgb(201,201,201);
        var dropArea = new lively.morphic.Morph();
        dropArea.setBorderStyle("dashed");
        dropArea.setBorderWidth(2.5);
        dropArea.setBorderColor(grey);
        dropArea.setFill(Color.white);
        dropArea.layout = {
          adjustForNewBounds: true,
          moveHorizontal: true,
          resizeHeight: true
        };
        dropArea.setExtent(this.extent.scaleBy(0.5, 0.8));
        dropArea.setPosition(pt(0, 10));
        
        this.boundOnHTML5Drop = this.onHTML5Drop.bind(this);
        dropArea.registerForEvent('drop', this, 'boundOnHTML5Drop', true);
    
        
        var text = new lively.morphic.Text();
        text.setName("DropHereLabel");
        text.setFillOpacity(0);
        
        text.setFixedHeight(false);
        text.setFixedWidth(false);
        
        text.setBorderWidth(0);
        text.ignoreEvents();
        text.setTextColor(grey);
        text.setFontSize(20);
        text.setWhiteSpaceHandling("nowrap");
        text.setTextString("Drop files here");
        // text.setPosition(pt(5, 15));
        text.layout = {
          centeredHorizontal: true,
          centeredVertical: true
        }
        
        dropArea.addMorph(text);
    
        return dropArea;
    },
    
    createFileList: function() {
        var fileList = new lively.morphic.List()

        fileList.setBorderStyle("solid")
        fileList.setExtent(this.extent.scaleBy(0.45, 0.8));  
        fileList.setClipMode({x: 'hidden', y: 'auto'});
        
        fileList.layout = {
          adjustForNewBounds: true,
          resizeWidth: true,
          resizeHeight: true
        };
        
        fileList.onKeyDown = this.handleKeyDownInFileList.bind(this);

        return fileList;
    },
    
    handleKeyDownInFileList: function(evt) {
        var fileList = this.fileList;
        
        if (evt.which == 46) {
            // "DEL" key
            var selectedIndexes = fileList.getSelectedIndexes().slice();
            selectedIndexes.each(function(index) {
                fileList.removeItemOrValue(fileList.itemList[index])
            });

            if (this.promises) {
                // remove selected items from our promise list
                this.promises = this.promises.filter(function(_, index) { return !selectedIndexes.include(index); });
                this.pipePromisesToData();
            }
            
            this.component.notify();
            return true;
        }
        
        return false;
    },
    
    removalNeeedsConfirmation: function() {
        return true;
    },
    
    onHTML5Drop: function(evt) {
        evt.stop();
    	var dataSource = evt.dataTransfer || evt.clipboardData;
    	
    	var files = dataSource.files;
    	var strings = dataSource.items;
    	
    	this.promises = this.promises.concat(this.processDroppedFiles(files), this.processDroppedStrings(strings));
    	
    	this.pipePromisesToData();
        this.component.notify();
    },
    processDroppedFiles: function(fileList) {
        var _this = this;
        var dataPromises = [];
        for (var i = 0; i < fileList.length; i++) {
            var eachFile = fileList[i];
            var fileType = eachFile.name.split(".").last();
            var successfullyAdded = true;
            switch(fileType) {
                case "xls":
                    var converter = new lively.morphic.Charts.ExcelConverter();
                    dataPromises.push(converter.convertFromFile(eachFile));
                    break;
                case "json":
                    var jsonConversionPromise = _this.convertBlobToString(eachFile).then(function(jsonString) {
                        return JSON.parse(jsonString);
                    });
                    dataPromises.push(jsonConversionPromise);
                    break;
                default:
                    alert("Unrecognized filetype.");
                    successfullyAdded = false;
            }
            
            if (successfullyAdded) {
                this.addItem(eachFile.name);
            }
    	};
    	return dataPromises;
    },
    addItem: function(str) {
        var number = this.fileList.itemList.length + 1;
        this.fileList.addItem(number + " " + str);
    },
    processDroppedStrings: function(stringList) {
        var dataPromises = [];
        for (var i = 0; i < stringList.length; i++) {
            if (stringList[i].kind === "string" && stringList[i].type == "text/plain")
                dataPromises.push(this.extractDataFromStringItem(stringList[i]));
        }
        return dataPromises;
    },
    getValidJSONFromString: function(str) {
        try {
            var jsonObj = JSON.parse(str);
            if (jsonObj && typeof jsonObj === "object" && jsonObj !== null) {
                return jsonObj;
            }
        } catch (e) { }
        return false;
    },
    extractDataFromStringItem: function(stringItem) {
        var deferred = new $.Deferred();
        var _this = this;
        
        var getAbbreviatedString = function(str) {
            return str.replace(/\n/g, "").slice(0, 20) + " ...";
        }
        
        stringItem.getAsString(function(str) {
            var jsonObj = _this.getValidJSONFromString(str);

            if (jsonObj) {
                deferred.resolve(jsonObj);
                _this.addItem(getAbbreviatedString(str) + " (JSON)");
                return;
            }
            
            var csvObj = lively.morphic.Charts.Utils.convertCSVtoJSON(str);
            
            // for now, just assume it is proper CSV if there is more than one header
            var validCsv = csvObj.headerNames.length > 1;
            if (validCsv) {
                deferred.resolve(csvObj);
                _this.addItem(getAbbreviatedString(str) + " (CSV)");
                return;
            }

            if (_this.isAValidURL(str)) {
                // fetch url
                _this.getBlobFromURL(str).done(function(blob) {
                    blob.name = str.split("/").last();
                    var filePromise = _this.processDroppedFiles([blob])[0];
                    filePromise.done(function(result) {
                        deferred.resolve(result);
                    }).fail(function(status) {
                        alert("Error when reading file: " + status);
                        deferred.resolve(null);
                    })
                }).fail(function(status) {
                    alert("Error when retrieving Data from URL: " + status);
                    deferred.resolve(null);
                });
                
                return;
            }
            alert("Dragged string is neither proper JSON nor a valid URL")
            deferred.resolve();
        });
        
        return deferred.promise();
    },
    
    isAValidURL: function(str) {
        var regexp = /((ftp|http|https):\/\/)?(\w+:{0,1}\w*@)?(\S+)(:[0-9]+)?(\/|\/([\w#!:.?+=&%@!\-\/]))?/
        return regexp.test(str);
    },
    
    convertBlobToString: function(blob) {
        var reader = new FileReader();
        var _this = this;
        var deferred = new $.Deferred();
        reader.onload = function(e) {
        	deferred.resolve(e.target.result);
        };
        reader.readAsBinaryString(blob);
        
        return deferred.promise();
    },
    
    update: function() {
        return this.data;
    },
    
    getBlobFromURL: function(filePath) {
        var deferred = new $.Deferred();
        
        var xhr = new XMLHttpRequest();
        xhr.open('GET', filePath, true);
        xhr.responseType = 'blob';
        
        var handleError = function(e) {
            alert("Error when loading blob", e);
            deferred.reject();
        }
        
        xhr.onload = function(e) {
            if (this.status == 200) {
                deferred.resolve(this.response);
            } else {
                handleError(e);
            }
        };
        
        xhr.onerror = handleError;
        try {
            xhr.send();
        } catch (e) {
            handleError();
        }
        
        return deferred;
    },
    
    pipePromisesToData: function() {
        this.data = $.when.apply(null, this.promises).then(function() {
            return Array.prototype.slice.apply(arguments);
        });
    },
    
    setUpPasteHandling: function() {
        // TODO: Why doesn't this work?
        // this.renderContext().morphNode.addEventListener("paste", this.onHTML5Drop.bind(this));
        
        var pasteHandler = this.onHTML5Drop.bind(this);
        var oldOnFocus = this.onFocus,
            oldOnBlur = this.onBlur;
        
        var _this = this;
        
        this.onFocus = function (evt) {
            oldOnFocus.call(_this, evt);
            window.addEventListener("paste", pasteHandler);
        }
        
        this.onBlur = function (evt) {
            oldOnBlur.call(_this, evt);
            setTimeout(function() {
                window.removeEventListener("paste", pasteHandler);
            }, 1000);
        }
    }
});

lively.morphic.Charts.Content.subclass('lively.morphic.Charts.WebPage', {
    initialize: function($super, url) {
        $super();

        this.description = "Web Page";
        this.extent = pt(400, 400);
        this.setClipMode("hidden");
        
        url = url || "http://en.m.wikipedia.org/wiki/Hasso_Plattner";
        var iframe = lively.morphic.World.loadInIFrame(url, lively.rect(0, 0, this.extent.x - 10, this.extent.y - 30));
        this.addMorph(iframe);
        
        setTimeout(function() {
            iframe.layout = {
                resizeWidth : true,
                resizeHeight : true
            };
        }, 0);
    },
    dashboardLayoutable: false,
});

lively.morphic.Box.subclass("lively.morphic.Charts.CoordinateSystem",
{
    initialize: function($super, extent) {
        $super(extent);
        
        this.setFill(Color.white);
        this.setName("CoordinateSystem");
        this.setClipMode("hidden");
    },
    addElement: function(element) {
        if (!element.listenersAttached)
            this.attachListeners(element);
            
        var prevPos = element.getPosition();
        this.addMorph(element);
        element.setPosition(this.transformPosition(prevPos));
    },

    attachListeners: function(element) {
        element.listenersAttached = true;
        
        var _this = this;
        element.setTransformedPosition = function(pos) {
            this.setPosition(_this.transformPosition(pos));
        }
    },
    transformPosition: function(pos) {
        var height = this.getExtent().y;
        return pt(pos.x, height - pos.y);
    }
});

lively.morphic.Box.subclass("lively.morphic.Charts.MappingLine",
{
    initialize: function($super, extent, container){
        $super(extent);
        this.container = container;
        
        this.layout = {
            adjustForNewBounds: true,
            resizeWidth: true
        }
        
        this.attributeField = this.createAttributeField();
        this.valueField = this.createValueField();
        
        // setup connections to notice if new line is required
        connect(this.attributeField, "textString", this, "handleMappingChange", {});
        connect(this.valueField, "textString", this, "handleMappingChange", {});
    },
    createValueField: function() {
        var offset = 120;
        var valueField = new lively.morphic.Text(lively.rect(offset, 0, this.getExtent().x - offset, 14), "");
        valueField.setFill(Color.white);
        valueField.setTextColor(this.INACTIVE_COLOR);
        valueField.setBorderColor(this.INACTIVE_COLOR);
        valueField.setBorderWidth(1);
        valueField.setBorderStyle("dashed");
        valueField.setBorderRadius(8);
        valueField.setFixedHeight(false);
        valueField.layout = {
            resizeWidth: true
        }
        valueField.setWordBreak("break-word");
        
        valueField.setStyleSheet(this.getFieldCSS());
        valueField.setWhiteSpaceHandling("normal");
        
        this.valueField = valueField;
        
        var _this = this;
        valueField.onTabPressed = function(evt) {
            if (evt.isShiftDown())
                _this.focusPreviousInput(this);
            else
                _this.focusNextInput(this);
            evt.stop();
        }
        
        // fit the height when the valueField resizes
        connect(valueField.shape, "_Extent", this, "fitHeight", {});
        
        this.addMorph(valueField);
        
        return valueField;
    },
    fitHeight: function() {
        var newExtent = lively.pt(this.getExtent().x, this.valueField.getExtent().y);
        this.setExtent(newExtent);
        this.container.refreshLayout();
    },
    createAttributeField: function() {
        var maxWidth = 100;
        var attributeField = new lively.morphic.Text(lively.rect(0, 0, maxWidth, 20), "");
        attributeField.setBorderWidth(0);
        attributeField.setBorderRadius(8);
        attributeField.setFill(this.INACTIVE_COLOR);
        attributeField.setTextColor(Color.white);
        attributeField.setFixedWidth(false);
        attributeField.setMinTextWidth(30);
        attributeField.setMaxTextWidth(maxWidth);
        attributeField.setPadding(lively.rect(8,2,0,0));
        
        attributeField.setStyleSheet(this.getFieldCSS());

        this.attributeField = attributeField;
        
        var _this = this;
        attributeField.onTabPressed = function(evt) {
            if (evt.isShiftDown())
                _this.focusPreviousInput(this);
            else
                _this.focusNextInput(this);
            evt.stop();
        }
        
        this.addMorph(attributeField);
        
        return attributeField;
    },
    getFieldCSS: function() {
        return ".Text {\
        	padding-bottom: 5px !important;\
        	padding-top: 0px !important;\
        }\
        .Text :focus {\
            outline: none;\
        }";
    },
    focusNextInput: function(sender) {
        if (sender == this.attributeField) {
            // jump to next field in the same line
            this.valueField.focus();
            this.valueField.selectAll();
        }
        else {
            // jump to the first field in the next line
            var nextLine = this.container.getNextLine(this);
            nextLine.attributeField.focus();
            nextLine.attributeField.selectAll();
        }
    },
    isEmpty: function() {
        return this.attributeField.getTextString() == "" && this.valueField.getTextString() == "";
    },
    focusPreviousInput: function(sender) {
        if (sender == this.valueField) {
            this.attributeField.focus();
            this.attributeField.selectAll();
        }
        else {
            var prevLine = this.container.getPreviousLine(this);
            prevLine.valueField.focus();
            prevLine.valueField.selectAll();
        }
    },
    
    ensureNewLine: function() {
        if (this.isEmpty()){
            // do not remove ourself
            if (this.container.emptyLine != this) {
                this.container.emptyLine.remove();
                this.container.emptyLine = this;
                this.attributeField.setFill(this.INACTIVE_COLOR);
                this.valueField.setBorderColor(this.INACTIVE_COLOR);
                var lastLine = this.container.getLastLine();
                
                // to always have the empty line as last line, re-add this line
                if (lastLine != this) {
                    // save the focused field to set the focus after re-adding the line
                    var focused = this.attributeField.isFocused() ? this.attributeField : this.valueField;
                    this.remove();
                    this.container.addLine(this);
                    focused.focus();
                }
            }
        } else if (this.container.emptyLine == this) {
            // this line is not empty anymore, but was before,
            // so create a new empty one
            this.container.createEmptyLine();
            this.attributeField.setFill(this.ACTIVE_COLOR);
            this.valueField.setTextColor(this.ACTIVE_COLOR);
            this.valueField.setBorderColor(this.ACTIVE_COLOR);
        }
    },
    ACTIVE_COLOR: Color.rgbHex("4C5E70"),
    INACTIVE_COLOR: Color.rgb(166, 175, 184),
    ERROR_COLOR: Color.rgb(169, 68, 66),
    ERROR_BACKGROUND_COLOR: Color.rgb(235, 204, 209),
    getMapping: function() {
        return {
            attribute: this.attributeField.getTextString(),
            value: this.valueField.getTextString()
        }
    },
    showError: function() {
        this.attributeField.setFill(this.ERROR_BACKGROUND_COLOR);
        this.valueField.setBorderColor(this.ERROR_BACKGROUND_COLOR);
        
        this.attributeField.setTextColor(this.ERROR_COLOR);
        this.valueField.setTextColor(this.ERROR_COLOR);
    },
    hideError: function() {
        this.attributeField.setFill(this.ACTIVE_COLOR);
        this.valueField.setBorderColor(this.ACTIVE_COLOR);
        
        this.attributeField.setTextColor(Color.white);
        this.valueField.setTextColor(Color.black);
    },
    handleMappingChange: function() {
        this.ensureNewLine();
        // TODO: find a better way to do this
        this.owner.owner.owner.component.onContentChanged();
    },
    remove: function($super) {
        this.container.removeLineFromList(this);
        $super();
    }
    
});

lively.morphic.Box.subclass("lively.morphic.Charts.MappingLineCategory",
{
    initialize: function($super, extent, categoryMorph) {
        $super(extent);
        this.categoryMorph = categoryMorph;
        this.mappingLines = [];
        this.setFill(Color.white);
        this.layout = {
            adjustForNewBounds: true,
            resizeWidth: true,
            resizeHeight: true
        }
        
        // layout for layouting the lines vertically
        var layout = new lively.morphic.Layout.VerticalLayout();
        layout.setSpacing(7.5);
        this.setLayouter(layout);
        
        // add category name
        var text = lively.morphic.Text.makeLabel(categoryMorph.getName());
        text.eventsAreIgnored = true;
        this.addMorph(text);

        // create the initial mapping line
        this.createEmptyLine();
    },
    refreshLayout: function() {
        this.getLayouter().layout(this, this.submorphs);
    },
    getAllMappings: function() {
        var mappings = [];
        
        this.mappingLines.each(function(mappingLine) {
            if (!mappingLine.isEmpty()) {
                mappings.push(mappingLine.getMapping());
            }
        });
        
        return mappings;
    },
    showErrorAt: function(mappingIndex) {
        this.mappingLines[mappingIndex].showError();
    },
    getIndexOf: function(attribute) {
        var index = -1;
        this.mappingLines.each(function(mappingLine, i) {
            if (mappingLine.getMapping().attribute == attribute) {
                index = i;
            }
        });
        return index;
    },
    hideErrorAt: function(mappingIndex) {
        this.mappingLines[mappingIndex].hideError();
    },
    getNextLine: function(sender) {
        var senderPos = sender.getPosition();
        var closest;
        var allFollowing = this.mappingLines.select(function(ea) {
            return ea.getPosition().y > senderPos.y;
        });
        
        var next = undefined;
        var minY = Number.MAX_VALUE;
        allFollowing.each(function(ea) {
            var posY = ea.getPosition().y;
            if (posY < minY) {
                next = ea;
                minY = posY;
            }
        });
        
        // if no next line was found, return the sender
        return next ? next : sender;
    },
    getLastLine: function() {
        var maxY = 0;
        var last;
        this.mappingLines.each(function(ea) {
            var posY = ea.getPosition().y;
            if (posY > maxY) {
                last = ea;
                maxY = posY;
            }
        });
        
        return last;
    },
    getPreviousLine: function(sender) {
        var senderPos = sender.getPosition();
        var closest
        var allPrevious = this.mappingLines.select(function(ea) {
            return ea.getPosition().y < senderPos.y;
        });
        
        var previous = undefined;
        var maxY = 0;
        allPrevious.each(function(ea) {
            var posY = ea.getPosition().y;
            if (posY > maxY) {
                previous = ea;
                maxY = posY;
            }
        });
        
        // if no previous line was found, return the sender
        return previous ? previous : sender;
    },
    createEmptyLine: function() {
        var line = new lively.morphic.Charts.MappingLine(lively.rect(0, 0, this.getExtent().x, 20), this);
        
        this.emptyLine = line;
        this.addLine(line);
        
        return line;
    },
    removeLineFromList: function(line) {
        this.mappingLines.remove(line);
    },
    addLine: function(line) {
        this.mappingLines.push(line);
        this.addMorph(line);
    }
});

}) // end of module
