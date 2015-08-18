module('lively.persistence.BuildSpecMorphExtensions').requires("lively.morphic.Core").toRun(function() {

lively.morphic.Morph.addMethods(
'UI builder', {

    buildSpecProperties: {
        name: {},
        doNotSerialize: {defaultValue: [], getter: function(morph, val) { if (!morph.hasOwnProperty("doNotSerialize")) return []; return val && val.reject(function(ea) { return !Object.isString(ea) || ea.startsWith('$$'); }) }},
        doNotCopyProperties: {defaultValue: [], getter: function(morph, val) { if (!morph.hasOwnProperty("doNotCopyProperties")) return []; return val && val.reject(function(ea) { return !Object.isString(ea) || ea.startsWith('$$'); }) }},
        grabbingEnabled: {defaultValue: undefined},
        draggingEnabled: {defaultValue: undefined},
        droppingEnabled: {defaultValue: undefined},
        halosEnabled: {defaultValue: true},
        _ClipMode: {defaultValue: 'visible'},
        _StyleSheet: {getter: function(morph, val) { return !val || Object.isString(val) ? val : val.getText(); }},
        _StyleClassNames: {},
        _Position: {defaultValue: lively.pt(0.0,0.0)},
        _Extent: {getter: function(morph) { return morph.getExtent(); }},
        _Fill: {defaultValue: null, getter: function(morph) { return morph.getFill(); }},
        _BorderColor: {defaultValue: Color.rgb(0,0,0), getter: function(morph) { return morph.getBorderColor(); }},
        _BorderWidth: {defaultValue: 0, getter: function(morph) { return morph.getBorderWidth(); }},
        _BorderStyle: {defaultValue: 'solid', getter: function(morph) { return morph.getBorderStyle(); }},
        _BorderRadius: {defaultValue: 0, getter: function(morph) { return morph.getBorderRadius(); }},
        _Opacity: {defaultValue: 1, getter: function(morph) { return morph.getOpacity(); }},
        _Rotation: {defaultValue: 0},
        _Scale: {defaultValue: 1},
        submorphs: {
            filter: function(morph, submorphs) {
              // since we now handle all the submorphs explicitly, we exclude all
              // of them from the usual recreation and entangling process
                return [];
            },
            getter: function(morph, val) {
                // the getter has to retrieve all the the buildspecs from the
                // submorphs
                return val.map(function(m) { return m.buildSpec() });
            },
            recreate: function(instance, spec) {
                // we recreate all the morphs from the respective buildspec,
                // and we also make sure they are entangled properly
                spec.submorphs.forEach(function(subSpec){
                    instance.addMorph(subSpec.createMorph())
                });
            },
            tracker: {
                signals: ['addMorph', 'removeMorph'],
                add: function(instance, elem) { instance.addMorph(elem); },
                remove: function(instance, elem) { instance.removeMorph(elem); }
            }
        },
        // excludes:
        showsHalos: {exclude: true},
        scripts: {exclude: true},
        id: {exclude: true},
        registeredForMouseEvents: {exclude: true},
        partsBinMetaInfo: {exclude: true},
        eventHandler: {exclude: true},
        derivationIds: {exclude: true},
        partTests: {exclude: true},
        magnets: {exclude: true},
        moved: {exclude: true},
        _renderContext: {exclude: true},
        _isRendered: {exclude: true},
        owner: {exclude: true},
        cachedBounds: {exclude: true},
        isBeingDragged: {exclude: true},
        halos: {exclude: true},
        priorExtent: {exclude: true},
        distanceToDragEvent: {exclude: true},
        prevScroll: {exclude: true},
        _PreviousBorderWidth: {exclude: true},
        attributeConnections: {exclude: true},
        isLockOwner: {exclude: true},
        isInLayoutCycle: {exclude: true},
        modalMorph: {exclude: true},
        currentMenu: {exclude: true},
        layout: {
            defaultValue: {},
            getter: function(morph, val) {
                // FIXME this code should go into the layouter!
                var result = {};
                if (!val) return result;
                if (Object.isString(val)) { return val; }
                    Properties.forEachOwn(val, function(name, prop) {
                    if (name === "layouter" && prop && prop.constructor) {
                        result.type = prop.constructor.type;
                        result.borderSize = prop.borderSize;
                        result.spacing = prop.spacing;
                        return;
                    }
                    result[name] = prop;
                });
                return result;
            },
            recreate: function(instance, spec) {
                var layout = instance.layout = {};
                if (!spec.layout) return;
                var layouterKlassName = Object.isString(spec.layout) ? spec.layout : spec.layout.type;
                if (layouterKlassName) {
                    var layouterKlass = lively.lookup(layouterKlassName);
                    layout.layouter = new layouterKlass();
                    layout.layouter.spacing = spec.layout.spacing;
                    layout.layouter.borderSize = spec.layout.borderSize;
                }
                var excludes = ['type', 'borderSize', 'spacing']
                Properties.forEachOwn(spec.layout, function(name, prop) {
                    if (!excludes.include(name)) layout[name] = prop; });
            }
        },
        shape: { exclude: true,
                 getter: function(morph, val) {
                    if(morph.shape.constructor.name === 'Ellipse') {
                        var shape = {}
                        for ( var key in morph.shape ) {
                            if(key != '_renderContext')
                                shape[key] = morph.shape[key];
                        }
                        shape.constructor = morph.shape.constructor;
                        return shape;
                    } else {
                        return null;
                    }
                },
                recreate: function(instance, spec) {
                    if(spec.shape && spec.shape.constructor.name === 'Ellipse') {
                        var shape = new spec.shape.constructor();
                        for ( var key in spec.shape )
                            shape[key] = spec.shape[key];
                        instance.setShape(shape);
                    }
                }
            }
    },

    getBuildSpecProperties: function(rawProps) {
        rawProps = rawProps || Object.mergePropertyInHierarchy(this, "buildSpecProperties");
        var props = Object.keys(rawProps).groupBy(function(key) {
                if(this.shape && this.shape.constructor.name == 'Ellipse' && key == 'shape')
                    return 'includes';
                return rawProps[key].exclude ? 'excludes' : 'includes'; }, this),
            scripts = Functions.own(this).select(function(sel) {
                return this[sel].hasLivelyClosure; }, this),
            ownProps = Properties.own(this)
                       .withoutAll(props.excludes)
                       .reject(function(key) { return key.startsWith('$$'); });
        return props.includes.concat(ownProps).concat(scripts).uniq();
    },

    buildSpec: function() {
        return lively.persistence.SpecObject.fromMorph(this);
    },

    onFromBuildSpecCreated: Functions.Null
});

Object.extend(lively.morphic.Morph, {
    fromSpec: function(object) {
        return lively.persistence.SpecObject.fromPlainObject(object).createMorph();
    },

    fromSpecString: function(string) {
        return lively.persistence.SpecObject.fromString(string).createMorph();
    }
});


(function setupLists() {
    module("lively.morphic.Lists").runWhenLoaded(function() {
        lively.morphic.List.addMethods(
        'UI builder', {
            buildSpecProperties: {
                itemList: {defaultValue: []},
                selectedIndexes: {defaultValue: []}
            },
            onFromBuildSpecCreated: function($super) {
                $super();
                return this.setList(this.itemList || []);
            }
        });

        lively.morphic.OldList.addMethods(
        'UI builder', {
            buildSpecProperties: {
                itemList: {defaultValue: []}
            },
            onFromBuildSpecCreated: function($super) {
                $super();
                this.setList(this.itemList || []);
            }
        });
});

})();

(function setupText() {
    module("lively.morphic.TextCore").runWhenLoaded(function() {


        lively.morphic.Text.addMethods(
        'UI builder', {

            buildSpecProperties: {
                textString: {
                    defaultValue: '',
                    getter: function(morph, val) { return val || '' },
                    recreate: function(instance, spec) {
                        instance.textString = spec.textString;
                        // important: emphasis after textString!
                        if (spec.emphasis) instance.emphasizeRanges(spec.emphasis);
                    }
                },
                emphasis: {
                    getter: function(morph, val) {
                        var styles = morph.getChunkStyles(),
                            ranges = morph.getChunkRanges();
                        return ranges.collect(function(range, i) {
                                return [range[0], range[1], styles[i].asSpec()]; });
                    },
                    recreate: function(instance, spec) { /*see textString*/ }
                },
                isLabel: {defaultValue: false, recreate: function(instance, spec) { if (spec.isLabel) instance.beLabel(); }},
                _FontSize: {defaultValue: 10},
                fixedWidth: {defaultValue: false},
                fixedHeight: {defaultValue: false},
                allowsInput: {defaultValue: true},
                _FontFamily: {defaultValue: 'Arial'},
                _MaxTextWidth: {defaultValue: null},
                _MaxTextHeight: {defaultValue: null},
                textColor: {defaultValue: Color.rgb(0,0,0)},
                _Padding: { defaultValue: lively.Rectangle.inset(0),
                            getter: function(morph) { return morph.shape.getPadding(); },
                            recreate: function(instance, spec) { instance.setPadding(spec._Padding); }},
                _WhiteSpaceHandling: {defaultValue: "pre-wrap"},
                _MinTextWidth: {defaultValue: null},
                _MinTextHeight: {defaultValue: null},
                _WordBreak: {defaultValue: 'normal'},
                // excludes:
                cachedTextString: {exclude: true},
                savedTextString: {exclude: true},
                charsReplaced: {exclude: true},
                charsTyped: {exclude: true},
                lastFindLoc: {exclude: true},
                parseErrors: {exclude: true},
                textChunks: {exclude: true},
                priorSelectionRange: {exclude: true},
                previousSelection: {exclude: true},
                undoSelectionRange: {exclude: true}
            }

        });
    });
})();

(function setupCodeEditor() {
    module('lively.ide.CodeEditor').runWhenLoaded(function() {
        lively.morphic.CodeEditor.addMethods(
            'UI builder', {
                buildSpecProperties: {
                    textString: {defaultValue: '', getter: function(morph) { return morph.textString }},
                    theme: {
                        defaultValue: 'chrome',
                        getter: function(morph) { return morph.getTheme(); },
                        recreate: function(morph, spec) { morph.setTheme(spec.theme); }
                    },
                    textMode: {
                        defaultValue: 'text',
                        getter: function(morph) { return morph.getTextMode(); },
                        recreate: function(morph, spec) { morph.setTextMode(spec.textMode); }
                    },
                    // excludes
                    _isFocused: {exclude: true},
                    savedTextString: {exclude: true},
                    aceEditor: {exclude: true}
                }
            });
    });
})();

(function setupWidgets() {
    module("lively.morphic.Widgets").runWhenLoaded(function() {

        lively.morphic.Button.addMethods(
        'UI builder', {
            buildSpecProperties: {
                submorphs: {
                    exclude: true,
                    filter: function(morph, submorphs) { return submorphs.without(morph.label); }
                },
                isActive: {defaultValue: true},
                label: {
                    defaultValue: '',
                    getter: function(morph, val) { return val.textString || ''; },
                    recreate: function(instance, spec) { instance.ensureLabel(spec.label); }
                },
                style: {defaultValue: lively.morphic.Button.prototype.style}
            }
        });

        lively.morphic.Window.addMethods(
        'UI builder', {
            buildSpecProperties: {
                submorphs: {
                    exclude: true,
                    filter: function(morph, submorphs) {
                        var handles = [morph.reframeHandle, morph.bottomReframeHandle, morph.rightReframeHandle];
                        return submorphs.withoutAll(handles).without(morph.titleBar);
                    }
                },
                titleBar: {
                    getter: function(morph, val) { return val ? val.getTitle() : ''; },
                    recreate: function(instance, spec) { instance.titleBar = instance.makeTitleBar(spec.titleBar, instance.getExtent().x); }
                },
                _Extent: {
                    recreate: function(instance, spec, key, val) {
                        instance._Extent = spec._Extent;

                        // BEGIN migrate window style
                        var diffExtent = lively.pt(10.0,30.0),
                            newContentOffset = lively.pt(8, 47);
                        if (spec.contentOffset && spec.contentOffset.lessPt(newContentOffset)) {
                            instance._Extent = instance._Extent.addPt(diffExtent);
                        }
                        // END migrate window style

                        instance.setExtent(instance._Extent);
                    }
                },
                grabbingEnabled: {defaultValue: false},
                reframeHandle: {exclude: true},
                bottomReframeHandle: {exclude: true},
                rightReframeHandle: {exclude: true},
                targetMorph: {exclude: true},
                cameForward: {exclude: true},
                collapsedExtent: {exclude: true},
                collapsedTransform: {exclude: true},
                expandedExtent: {exclude: true},
                expandedTransform: {exclude: true},
                highlighted: {exclude: true},
                ignoreEventsOnExpand: {exclude: true}
            },

            onFromBuildSpecCreated: function($super) {
                $super();

                // BEGIN migrate window style
                var newContentOffset = lively.pt(8, 47);
                if (this.getBorderRadius() === 0)
                    this.setBorderRadius(10);
                if (this.contentOffset && this.contentOffset.lessPt(newContentOffset)) {
                    var diffPos = newContentOffset.subPt(this.contentOffset);
                    this.contentOffset = newContentOffset;
                    this.submorphs.forEach(function(m) {
                        m.setPosition(m.getPosition().addPt(diffPos));
                    });
                }
                if (this.submorphs.length == 1) {
                    this.submorphs[0].setBorderRadius(8);
                    this.submorphs[0].setBorderWidth(0);
                }
                // END migrate window style

                this.makeReframeHandles();
                this.addMorph(this.titleBar);
                this.targetMorph = this.submorphs[0];
            }

        });

        lively.morphic.Tree.addMethods(
        'buildSpec', {
            buildSpecProperties: {
                childNodes: {exclude: true},
                icon: {exclude: true},
                isInLayoutCycle: false,
                item: {exclude: true},
                label: {exclude: true},
                node: {exclude: true},
                layout: {exclude: true}
            },

            onBuildSpecCreated: function(buildSpec) {
                if (this.item && Object.isFunction(this.item.serializeExpr)) {
                    buildSpec.item = item;
                }
            },

            onFromBuildSpecCreated: function() {
                this.initializeLayout();
                this.disableDragging();
                this.setItem(this.item || {name: "tree with no item"});
            }
        });

        lively.morphic.Image.addMethods(
        'buildSpec', {
            buildSpecProperties: {
                url: {getter: function(morph) { return morph.getImageURL(); }},
                useNativeExtent: {defaultValue: false}
            },

            onFromBuildSpecCreated: function() {
                this.setImageURL(this.url, this.useNativeExtent);
            }
        });

        lively.morphic.Slider.addMethods(
        'UI builder', {
            onFromBuildSpecCreated: function($super) {
                $super();
                this.sliderKnob = this.submorphs.detect(function(ea) { return ea.isSliderKnob; });
            }
        });
    
        lively.morphic.SliderKnob.addMethods(
        'UI builder', {
            onFromBuildSpecCreated: function($super) {
                $super();
                this.slider = this.ownerChain().detect(function(ea) { return ea.isSlider; });
            }
        });
    
        lively.morphic.HorizontalDivider.addMethods(
        'buildSpec', {
            buildSpecProperties: {
                fixed: {exclude: true}, // TODO: mark as a valid array entanglement
                scalingAbove: {defaultValue: [], getter: function() { return [] }},
                scalingBelow: {defaultValue: [], getter: function() { return [] }}
            }
        });

    });
})();

(function setupAdditionalMorphs() {
    module("lively.morphic.AdditionalMorphs").runWhenLoaded(function() {

        lively.morphic.Path.addMethods(
        'buildSpec', {

            buildSpecProperties: {
                controlPoints: {

                    getter: function(morph, val) {
                        return morph.shape.getPathElements().invoke('attributeFormat').join(' ');
                    },

                    recreate: function(instance, spec) {
                        instance.controlPoints = null;
                        instance.shape.setPathElements(
                            lively.morphic.Shapes.PathElement.parse(
                                spec.controlPoints));
                        // FIXME
                        spec._Origin && instance.setOrigin(spec._Origin);
                    }
                }
            }

        });
    });
})();

(function setupTabs() {
    module('lively.morphic.TabMorphs').runWhenLoaded(function() {

        lively.morphic.TabBar.addMethods(
        'UI builder', {
            buildSpecProperties: {
                tabContainer: {exclude: true},
                tabs: {exclude: true}
            },
            onFromBuildSpecCreated: function($super) {
                $super();
                this.tabContainer = this.owner;
                this.tabs = this.submorphs.filter(function(ea) {
                  return !!ea.isTab; });
            }
        });

        lively.morphic.TabContainer.addMethods(
        'UI builder', {
            buildSpecProperties: {
                tabBarStrategy: {
                    getter: function(morph, val) { return morph.tabBarStrategy.constructor.type; },
                    recreate: function(instance, spec) { instance.tabBarStrategy = new (lively.lookup(spec.tabBarStrategy))(); }
                }
            },
            onFromBuildSpecCreated: function($super) {
                $super();
                this.tabBar = this.submorphs.detect(function(ea) { return ea.isTabBar; });
            }
        });

        lively.morphic.Tab.addMethods(
        'UI builder', {
            buildSpecProperties: {
                label: {
                    defaultValue: '',
                    getter: function(morph, val) { return val.textString || ''; },
                    recreate: function(instance, spec) {
                        instance.label = spec.submorphs[0] && spec.submorphs[0].attributeStore.textString;
                    },
                    exclude: true
                },
                pane: { // index of the pane in tabContainer.submorphs
                    defaultValue: -1,
                    getter: function(morph, val) {
                        return morph.tabContainer.submorphs.indexOf(val); }
                },
                tabBar: {exclude: true},
                tabContainer: {exclude: true}
            },
            onFromBuildSpecCreated: function($super) {
                $super();
                this.tabContainer = this.ownerChain().detect(function(ea) { return ea.isTabContainer; });
                this.pane = this.tabContainer.submorphs[this.pane];
                this.tabBar = this.tabContainer.tabBar
                this.initializeLabel(this.label);
            }
        });

        lively.morphic.TabPane.addMethods(
        'UI builder', {
            buildSpecProperties: {
                tab: { // index of the tab in tabBar.submorphs
                    defaultValue: -1,
                    getter: function(morph, val) { return morph.tabBar.submorphs.indexOf(val); }
                },
                tabContainer: {exclude: true},
                tabBar: {exclude: true}
            },
            onFromBuildSpecCreated: function($super) {
                $super();
                this.tabContainer = this.ownerChain().detect(function(ea) { return ea.isTabContainer; })
                this.tabBar = this.tabContainer.getTabBar();
                this.tab = this.tabBar.submorphs[this.tab];
            }
        });
    });
})();

}) // end of moduled of module
