module('lively.morphic.Connectors').requires('lively.morphic.AdditionalMorphs', 'lively.bindings.GeometryBindings', 'lively.morphic.Serialization').toRun(function() {

// also includes visual bindings stuff...

lively.morphic.Box.subclass('lively.morphic.MagnetHalo',
'settings', {
    style: {borderWidth: 0, fill: Color.orange, enableDragging: true},
    defaultExtent: pt(12,12),
    isMagnetHalo: true
},
'initializing', {
    initialize: function($super) {
        $super(pt(0,0).extent(this.defaultExtent));
    }
},
'connection', {
    getControlPoints: function() {
        return (this.attributeConnections || []).select(function(ea) {
            return ea.targetObj && (ea.targetMethodName == 'alignToMagnet')
        }).pluck('targetObj')
    },

    onDrag: function(evt) {
        if (this.currentHalo) {
            this.currentHalo.moveBy(evt.getPosition().subPt(this.currentHalo.prevDragPos))
            this.currentHalo.onDrag(evt);
        }
    },
    onDragStart: function(evt) {
        var handles = this.getControlPoints();
        if (handles.length == 0) return;

        // handles.first().openInWorld()
        // inspect(handles.first())
        alert("down " + handles.first())

        var halo = handles.first().asHalo();
        halo.openInWorld();
        halo.alignAtTarget();
        halo.prevDragPos = evt.getPosition()
        this.currentHalo = halo;

        return;
    },
    onDragEnd: function(evt) {
        if (this.currentHalo)
            this.currentHalo.remove();
        this.currentHalo = null;
    },
});

Object.subclass('lively.morphic.Magnet',
'default category', {
    isMagnet: true,

    initialize: function(morph, pos) {
        this.setMorph(morph);
        this.setPosition(pos);
        this.connectedControlPoints = [];
    },
    setMorph: function(morph) {
        this.morph = morph
    },
    addConnectedControlPoint: function(cp) {
        if (!this.connectedControlPoints)
            this.connectedControlPoints = [];
        if(this.connectedControlPoints.include(cp)) {
            // already connected
            return
        }
        lively.bindings.connect(this.morph, 'globalTransform', cp, 'alignToMagnet')
        this.connectedControlPoints.push(cp)
    },
    removeConnectedControlPoint: function(cp) {
        if (!this.connectedControlPoints) return;
        if (this.morph)
            lively.bindings.disconnect(this.morph, 'globalTransform', cp, 'alignToMagnet')
        this.connectedControlPoints = this.connectedControlPoints.without(cp)
    },
    getConnectedControlPoints: function() {
        return this.connectedControlPoints
    },
    getPosition: function() {
        return this.position
    },
    setPosition: function(pos) {
       this.position = pos
    },
    getGlobalPosition: function() {
        if (!this.morph || !this.morph.world()) return pt(0,0);
        return this.morph.worldPoint(this.getPosition())
    },
    getCachedGlobalPosition: function() {
        if (!this.cachedGlobalPosition)
            this.cachedGlobalPosition = this.getGlobalPosition();
        return this.cachedGlobalPosition
    },
    resetCachedGlobalPosition: function() {
        delete this.cachedGlobalPosition;
    },
    remove: function() {
        // enter comment here
    },
});

lively.morphic.Magnet.subclass('lively.morphic.RelativeMagnet',
'default category', {
    getPosition: function() {
        if (!this.morph) return this.position

        return this.position.scaleByPt(this.morph.getExtent())
    },

    setPosition: function(pos) {
        if (!this.morph) return this.position = pos
        var e = this.morph.getExtent();
        return this.position = pt(pos.x / e.x, pos.y / e.y)
    },
});

Object.subclass('lively.morphic.MagnetSet',
'default category', {
    initialize: function(optWorld) {
        this.magnets = []
        if (optWorld) this.gatherMagnetsIn(optWorld)
    },

    gatherMagnetsIn: function(world) {
        this.magnets = []
        world.withAllSubmorphsDo(function(ea) {
            if (ea.isEpiMorph) return;
            this.magnets.pushAll(ea.getMagnets())
        }.bind(this))
        this.magnets.forEach(function(ea) {
            // there might be some trash in the magnets list...
            if (ea.resetCachedGlobalPosition)
                ea.resetCachedGlobalPosition()
        })
    },
    nearestMagnetsTo: function(point) {
        return this.magnets.sort(function(a, b) {
            return a.getCachedGlobalPosition().dist(point) - b.getCachedGlobalPosition().dist(point)
        })
    },
    nearestMagnetsToControlPoint: function(cp) {
        var pos = cp.getGlobalPos();
        var nearest = this.nearestMagnetsTo(pos)
        return nearest.select(function(ea) {
            return ea.getCachedGlobalPosition().dist(pos) < 10
        }).reject(function(ea) {
            return ea.morph === cp.morph
        })
    },
});

require('lively.LayerableMorphs').toRun(function() {

cop.create('ConnectorLayer')
.refineClass(lively.morphic.World, {
    getMagnets: function() {
        return []
    }
})
.refineClass(lively.morphic.PathVertexControlPointHalo, {
    onDragStart: function(evt) {
        // alertOK('onDragStart')
        this.magnetSet = new lively.morphic.MagnetSet(this.world());
        this.magnetSet.helperMorphs  = []
        // this.magnetSet.magnets.forEach(function(ea) {
            // var m = newShowPt(ea.getCachedGlobalPosition(), 60);
            // m.setFill(Color.gray)
            // m.setOpacity(0.5)
            // this.magnetSet.helperMorphs.push(m)
        // }, this)
        return cop.proceed(evt)
    },
    onDrag: function(evt) {
        cop.proceed(evt);
        var newOffset = evt.getPosition().subPt(this.bounds().center());
        this.dragAction(evt, newOffset);
        if (!this.magnetSet) {
            return
            throw new Error('onDragStart was not called for ' + this)
        }

        var nearestMagnets = this.magnetSet.nearestMagnetsToControlPoint(this.controlPoint)
        if (nearestMagnets.length == 0) {
            this.controlPoint.setConnectedMagnet(null)
            return true
        }
        this.controlPoint.setConnectedMagnet(nearestMagnets[0]);

        this.align( this.bounds().center(),this.controlPoint.getGlobalPos())

        return true
    },
    onDragEnd: function(evt) {
        if (!this.magnetSet) return; // onDragStart not called?
        this.magnetSet.helperMorphs.invoke('remove')
        delete this.magnetSet;

        return cop.proceed(evt)
    },
})

cop.create('lively.morphic.VisualBindingsLayer')
.refineClass(lively.morphic.World, {
    morphMenuItems: function() {
        var items = cop.proceed(),
            debugging = items.detect(function(ea) { return ea[0] == "Debugging"}),
            world = this;
        if (debugging) {
            debugging[1].splice(4, 0, ["Show connectors",
                function() {
                    world.submorphs.forEach(function(ea) {
                        if (ea.isPath && ea.con) ea.owner.addMorph(ea);
                    });
                }]);
        }
        return items;
    }
})
.refineClass(lively.morphic.Morph, {
    morphMenuItems: function() {
        var morph = this,
            connectioNames = Properties.own(this.getConnectionPoints()),
            connectionItems = connectioNames.collect(function(name) {
                return [name, function() {
                    var builder = morph.getVisualBindingsBuilderFor(name)
                    builder.openInHand();
                    builder.setPosition(pt(0,0));
                }]
            }).concat([['Custom ...', function() {
                morph.world().prompt('Name of custom connection start?', function(name) {
                    if (!name) return;
                    var builder = morph.getVisualBindingsBuilderFor(name)
                    builder.openInHand();
                    builder.setPosition(pt(0,0));
                })
            }]])
        return cop.proceed().concat([["Connect ...", connectionItems]]);
    }
})
.beGlobal();

ConnectorLayer.beGlobal();

// cop.create('NoMagnetsLayer')
// .refineClass(lively.morphic.Morph, {
//     getMagnets: function() { return []; }
// })
// .refineClass(lively.morphic.Text, {
//     getMagnets: function() { return []; }
// })
// .refineClass(lively.morphic.Halo, {
//     getMagnets: function() { return []; }
// })
// .refineClass(lively.morphic.HandMorph, {
//     getMagnets: function() { return []; }
// })

// lively.morphic.HandMorph.addMethods({
//     withLayers: [] // NoMagnetsLayer
// });

// lively.morphic.Halo.addMethods({
//     withLayers: [NoMagnetsLayer]
// });

// lively.morphic.Window.addMethods({
//     // withLayers: [NoMagnetsLayer]
// });

cop.create('ConnectorLayer').refineClass(lively.morphic.Path, {
    onMouseUp: function(evt) {
        var result
        cop.withoutLayers([ConnectorLayer], function() {
            result = cop.proceed(evt);
        })
        if (evt.isCommandKey() || evt.isRightMouseButtonDown())
            return result;

        this.showControlPointsHalos()

        return true
    }
}).beGlobal();

});  // end of require LayerableMorphs

lively.morphic.Morph.addMethods(
'visual connectors', {
  morphsContainingPointInExtendedBounds: function (point, outset, list) {
        // if morph1 visually before morph2 than list.indexOf(morph1) < list.indexOf(morph2)
        if (!list) list = [];
        if (!list) outset = 10;

        if (this.owner && !this.getBounds().insetBy(-outset)
                .containsPoint((this.owner.localize(point))))
            return list;
        for (var i = this.submorphs.length -1 ; i >=0; i--)
            this.submorphs[i].morphsContainingPointInExtendedBounds(point, outset, list)

        if (this.innerBounds().insetBy(-outset).containsPoint(this.localize(point)));
            list.push(this);
        return list;
    },
    getMagnets: function() {
        if (!this.magnets)
            this.magnets = [
                new lively.morphic.RelativeMagnet(this, this.innerBounds().topLeft()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().topCenter()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().topRight()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().rightCenter()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().bottomRight()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().bottomCenter()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().bottomLeft()),
                new lively.morphic.RelativeMagnet(this, this.innerBounds().leftCenter())
            ]
        return this.magnets
    },
    showMagnets: function() {
        this.getMagnets().invoke('setVisible', true)
    },
    hideMagnets: function() {
        this.getMagnets().invoke('setVisible', false)
    },
    addDefaultMagnets: function() {
        this.removeUnusedMagnets();
        this.isShowingMagnets = true;
        [pt(0, 0.5), pt(0.5, 1), pt(1, 0.5), pt(0.5, 0)]
            .collect(function(ea) {
                return  this.innerBounds().relativeToAbsPoint(ea)
            }.bind(this))
            .forEach(function(ea) {
                var m = new lively.morphic.Magnet();
                this.addMorph(m);
                // m.setPosition(ea)
                m.align(m.bounds().center(), ea)
            }.bind(this))
    },
    toggleMagnets: function() {
        if (this.isShowingMagnets) {
            this.showMagnets();
        } else {
            this.hideMagnets();
        }
        this.isShowingMagnets = !this.isShowingMagnets
    },

    removeUnusedMagnets: function() {
        this.getMagnets().select(function(ea) {
            return ea.getConnectedControlPoints().length == 0
        }).invoke('remove')
    },

    createConnectorTo: function(otherMorph, lineStyle) {
        if (!otherMorph) throw new Error('Cannot to nothing');

        var line = new lively.morphic.Path([pt(0,0), pt(0,0)]);
        if (lineStyle) line.applyStyle(lineStyle);
        line.disableDropping();

        line.fromMorph = this; line.toMorph = otherMorph;

        line.addScript(function show() {
            var from = this.fromMorph, to = this.toMorph,
                world = from.world() || to.world(),
                cp1 = this.getControlPoints().first(),
                startMagnet = from.getMagnetForPos(
                    to.world() ? to.worldPoint(to.innerBounds().center()) : null),
                cp2 = this.getControlPoints().last(),
                endMagnet = to.getMagnetForPos(
                    from.world() ? from.worldPoint(from.innerBounds().center()) : null);
            if (world) world.addMorphBack(this);
            this.bringToFront();
            if (!startMagnet || !endMagnet) {
                debugger;
                alert("Connection Problem: no magnet found");
                this.hide();
                return;
            }
            cp1.setConnectedMagnet(startMagnet);
            cp2.setConnectedMagnet(endMagnet);
        });

        line.addScript(function hide() {
            this.disconnectFromMagnets();
            this.remove();
        });

        line.show();

        return line;
    },

    getMagnetForPos: function(globalPos) {
        return this.getMagnets()[0];
    },

    getVisualBindingsBuilderFor: function(connectionPointName) {
        return new lively.morphic.ConnectionBuilder(this, connectionPointName);
    }
});

lively.morphic.Path.addMethods(
'visual connectors', {
    withLayers: [], // withLayers: [cop.create('NoMagnetsLayer2')],
    disconnectFromMagnets: function() {
        this.getControlPoints().forEach(function(ctrlPt) {
            if (ctrlPt.connectedMagnet) ctrlPt.setConnectedMagnet(null);
        })
    },
    getMagnets: function() {
        return [ ]
    }
});

lively.morphic.ControlPoint.addMethods({
    alignToMagnet: function() {
        var magnet = this.connectedMagnet;
        if (!magnet || ! magnet.isMagnet) return
        var delta = magnet.getGlobalPosition().subPt(this.getGlobalPos());
        this.moveBy(delta)
        if (this.marker) this.alignMarker()
    },

    setConnectedMagnet: function(magnet) {
        if (this.connectedMagnet) {
            this.connectedMagnet.removeConnectedControlPoint(this);
        };

        this.connectedMagnet = magnet;
        if (!magnet) return;
        magnet.addConnectedControlPoint(this);
        this.alignToMagnet(magnet)
    },
    getConnectedMagnet: function() {
        return this.connectedMagnet
    }
})

Object.extend(lively.bindings, {
    visualConnect: function(source, sourceProp, target, targetProp, spec) {
        if (!source.isMorph && !target.isMorph) {
            throw new Error('Cannot visual connect non-morph!');
        }
        var con = this.connect(source, sourceProp, target, targetProp, spec);
        if (Config.visualConnectEnabled) this.showConnection(con);
        return con;
    },

    editConnection: function(con) {
         var source = con.converterString ||
                   'function converter(value) {\n    return value\n}',
            editor = new lively.morphic.Text(new Rectangle(0,0, 400, 200), source);
            editor.doitContext = con;
        connect(editor, 'savedTextString', con, 'setConverter');
        connect(editor, 'savedTextString', $world, 'alertOK', {converter:
            function() { return 'setting new converter' }})
        editor.applyStyle({syntaxHighlighting: true,
            fontFamily: 'Courier', resizeWidth: true, resizeHeight: true});
        var title = con.targetObj.name && con.sourceObj.name ?
            'Editor for ' + con.targetObj.name + ' -> ' + con.sourceObj.name :
            'Editor for converter function';
        var window = world.addFramedMorph(editor, title);
        return window;
    },

    showConnection: function(con) {
        var source = con.sourceObj,
            target = con.targetObj,
            visualConnector = source.createConnectorTo(target);

        if (!source.world() || !target.world()) return;

        // arrow head
        var arrowHead = new lively.morphic.Path([pt(0,0), pt(0,12), pt(16,6), pt(0,0)]);
        arrowHead.applyStyle({borderWidth: 0, borderColor: Color.black, fill: Color.black})
        arrowHead.adjustOrigin(pt(12,6))
        visualConnector.addArrowHeadEnd(arrowHead)

        con.visualConnector = visualConnector;
        con.visualConnector.con = con; // FIXME
        visualConnector.showsMorphMenu = true; // FIX ... MEE !!!!!

        visualConnector.addScript(function morphMenuItems() {
            var visualConnector = this,
                items = [
                    ['Edit converter', function() {
                        var window = lively.bindings.editConnection(visualConnector.con);
                        window.align(window.bounds().topCenter(),
                                     visualConnector.bounds().bottomCenter()); }],
                    ['Hide', function() {
                        visualConnector.hide();
                        visualConnector.con.autoShowAndHideConnections.invoke('disconnect');
                        visualConnector.con.autoShowAndHideConnections = [];
                    }],
                    ['Disconnect', function() {
                        alertOK('Disconnected ' + visualConnector.con);
                        visualConnector.con.visualDisconnect(); }],
                    ['Cancel', function() {}]];
            return items;
        });

        visualConnector.addScript(function showOrHide(bool) {
            bool ? this.show() : this.hide();
        });

        con.autoShowAndHideConnections = [
            lively.bindings.connect(source, 'owners', visualConnector, 'showOrHide', {
                converter: function(owners) { return !!this.sourceObj.world(); } }),
            lively.bindings.connect(target, 'owners', visualConnector, 'showOrHide', {
                converter: function(owners) { return !!this.sourceObj.world(); } })];
    }

});

AttributeConnection.addMethods(
'visual connection', {
    getVisualConnector: function() { return this.visualConnector },
    visualDisconnect: function() {
        var connector = this.getVisualConnector();
        if (connector) {
            if (connector.hide) {
                connector.hide();
            } else {
                // FIXME for old deserialized connections...
                // add show / hide to class!
                connector.disconnectFromMagnets();
                connector.remove();
            }
        }
        if (this.autoShowAndHideConnections) {
            this.autoShowAndHideConnections.invoke('disconnect');
            this.autoShowAndHideConnections = [];
        }
        this.disconnect();
    }
});

lively.morphic.Box.subclass('lively.morphic.ConnectionBuilder',
'settings', {
    isLayoutable: false
},
'initializing', {
    style: {fill: Color.gray, opacity: 0.5},
    initialize: function($super, sourceMorph, connectionPointSourceName) {
        $super(new Rectangle(0,0, 80, 25));
        this.sourceMorph = sourceMorph;
        this.connectionPointSourceName = connectionPointSourceName;
        var label = lively.morphic.Text.makeLabel(connectionPointSourceName, {
            fixedWidth: true, fixedHeight: true, align: 'center', fontSize: 14, fill: null});
        label.isLayoutable = false; // do not show placeholders
        this.label = this.addMorph(label);
        label.setBounds(this.innerBounds());
        this.adjustOrigin(this.innerBounds().center());
    }
},
'dropping', {
    dropOn: function($super, morph) {
        this.remove();
        var pos = morph.world() ? morph.world().firstHand().getPosition() : pt(0,0);
        this.openConnectToMenu(morph, pos);
    },
    getGrabShadow: function() { return null }

},
'menus', {
    openConnectToMenu: function(morph, pos) {
        var world = morph.world(),
            builder = this,
            morphsUnderMouse = world.morphsContainingPoint(pos).without(world);
        if (morphsUnderMouse.length == 0) {
            alert('Found no target to connect to!');
            return;
        }
        var target = morphsUnderMouse.first(),
            items = [];
        items.push(this.underMorphMenu(pos, builder.sourceMorph));
        items.pushAll(this.propertiesMenuForTarget(target));
        lively.morphic.show(target);
        lively.morphic.Menu.openAtHand('Connect to ' + (target.name || target), items)
    },

    underMorphMenu: function(position, sourceMorph, sourceAttribute) {
        var world = sourceMorph.world(), that = this;
        if (!world) return undefined;
        var morphStack = world.morphsContainingPoint(position).reject(
                function(ea) { return ea.isWorld; }),
            menu = [];
        morphStack.forEach(function(ea) {
            menu.push([ea.name, that.propertiesMenuForTarget(ea)]);
        });
        return ['Connect to under morph ...', menu];
    },

    propertiesMenuForTarget: function(aMorph) {
        var that = this,
            world = aMorph.world(),
            properties = Properties.own(aMorph.getTargetConnectionPoints()),
            menu = [];
        // Properties
        properties.forEach(function(ea) {
            menu.push([ea, function() { (that.createConnectFuncFor(aMorph))(ea);}]);});
        // Scripts
        var scriptMenuItems = [];
        Functions.own(aMorph).forEach(function(scriptName) {
                scriptMenuItems.push([scriptName, function() {
                    (that.createConnectFuncFor(aMorph))(scriptName);}]);
            });
        menu.push(["Scripts ...", scriptMenuItems]);
        // Custom
        menu.push(["Custom ...", function() {
            world.prompt('Enter name of connection point', function(input) {
                if (!input) return;
                (that.createConnectFuncFor(aMorph))(input);
            })
        }])
        menu.push(['Cancel', function() {}]);
        return menu;
    },

    createConnectFuncFor: function(targetMorph) {
        var builder = this;
        return function(propertyName) {
            var con = lively.bindings.visualConnect(
                builder.sourceMorph, builder.connectionPointSourceName,
                targetMorph, propertyName);
        };
    }

});

lively.morphic.Path.addMethods({

    showControlPointsHalos: function() {
        if (!this.world()) return false;
        if (this.halos && this.halos.length > 0) {
            this.world().showHalosFor(this, this.halos.select(function(ea) {
                return ea instanceof lively.morphic.PathVertexControlPointHalo
            }));
            this.halos.invoke('alignAtTarget');
            return true;
        }
        return false;
        // For now, let's display Control Points only when halos are on --
        //   there are some problems with CP alignment when they are off.
        //this.halos = this.getControlPointHalos();
        //this.world().showHalosFor(this, this.halos);
        //this.halos.invoke('alignAtTarget');
    }

});

}) // end of module
