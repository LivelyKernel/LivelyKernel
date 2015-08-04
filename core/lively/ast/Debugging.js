module('lively.ast.Debugging').requires('lively.ast.AcornInterpreter').toRun(function() {

Object.extend(lively.ast, {

    halt: function(frame) {
        (function() {
            lively.ast.openDebugger(frame, "Debugger");
        }).delay(0);
        return true;
    },

    openDebugger: function(frame, title) {
        lively.require('lively.ide.tools.Debugger').toRun(function() {
            var m = lively.BuildSpec("lively.ide.tools.Debugger").createMorph();
            m.targetMorph.setTopFrame(frame);
            if (title) m.setTitle(title);
            m.openInWorldCenter().comeForward();
        });
    }

});

(function openDebuggingFlap() {
    lively.whenLoaded(function(world) {
        lively.BuildSpec('lively.ast.DebuggingFlap', {
            _FixedPosition: true,
            _BorderRadius: 20,
            _Extent: lively.pt(130.0,30.0),
            _Fill: Color.rgba(255,255,255,0.8),
            _HandStyle: "pointer",
            className: "lively.morphic.Box",
            currentMenu: null,
            doNotSerialize: ["currentMenu"],
            droppingEnabled: true,
            grabbingEnabled: false,
            isEpiMorph: true,
            menu: null,
            name: "lively.ast.DebuggingFlap",
            style: {zIndex: 997},
            statusText: {isMorphRef: true,name: "statusText"},
            submorphs: [{
                _Align: "center",
                _ClipMode: "hidden",
                _Extent: lively.pt(103.0,20.0),
                _FontFamily: "Helvetica",
                _HandStyle: "pointer",
                _InputAllowed: false,
                _Position: lively.pt(21.5,12.0),
                allowInput: false,
                className: "lively.morphic.Text",
                evalEnabled: false,
                eventsAreIgnored: true,
                fixedHeight: true,
                fixedWidth: true,
                isLabel: true,
                name: "statusText",
                sourceModule: "lively.morphic.TextCore",
                textString: "Debugging"
            }],
            alignInWorld: function alignInWorld() {
            this.world().cachedWindowBounds = null;
            var topRight = this.world().visibleBounds().topRight().addXY(-40, -10);
            this.align(this.worldPoint(this.innerBounds().topRight().scaleBy(3)), topRight);
            this.alignSubmorphs();
        },
        alignSubmorphs: function alignSubmorphs() {
            this.statusText.align(this.statusText.bounds().center(), this.innerBounds().bottomCenter().addXY(0,-8));
            if (lively.Config.get('loadRewrittenCode')) {
                this.statusText.textString = 'In Debug Session';
                this.statusText.applyStyle({textColor: Color.green.lighter()});
            } else {
                this.statusText.textString = 'Not Debugging';
                this.statusText.applyStyle({textColor: Color.red});
            }
            this.menu && this.menu.align(
                this.menu.bounds().bottomCenter(),
                this.innerBounds().bottomCenter().addXY(2, -8-20));
        },
            collapse: function collapse() {
            this.withCSSTransitionForAllSubmorphsDo(function() {
                this.setExtent(lively.pt(130.0,30.0));
                this.alignSubmorphs();
            }, 500, function() {
                if (this.menu) {
                    this.menu.remove();
                    this.menu = null;
                }
            });
        },
            expand: function expand() {
            var self = this,
                dbgStmt = !!lively.Config.get('enableDebuggerStatements'),
                items = [
                ['[' + (dbgStmt ? 'x' : ' ') + '] break on debugger', function() {
                    lively.Config.set('enableDebuggerStatements', !dbgStmt);
                    self.collapse();
                }],
                ['clear cache', function() {
                    if (!lively.IndexedDB.isAvailable()) return self.collapse();
                    lively.IndexedDB.hasStore('Debugging', function(err, exists) {
                        if (err) throw err;
                        if (exists)
                            lively.IndexedDB.clear(function(err) {
                                if (err)
                                    alert('Could not clear Debugging cache: ' + err.message);
                                else
                                    alertOK('Cleared Debugging cache!');
                            }, 'Debugging');
                        else
                            alertOK('No cache to be cleared!');
                    });
                    self.collapse();
                }]
            ];
            this.menu = new lively.morphic.Menu(null, items);
            this.menu.openIn(this, pt(0,0), false);
            this.menu.setBounds(lively.rect(0, -66, 130, 23*items.length));
            this.withCSSTransitionForAllSubmorphsDo(function() {
                this.setExtent(pt(140, 46 + 20*items.length));
                this.alignSubmorphs();
            }, 500, function() {});
        },
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                $super();
                this.onLoad();
            },
            onLoad: function onLoad() {
            this.whenOpenedInWorld(function() {
                this.alignInWorld();
            });
            this.openInWorld();
            this.statusText.setHandStyle('pointer');
            this.isEpiMorph = true;
        },
            onMouseDown: function onMouseDown(evt) {
            if (evt.getTargetMorph() !== this.statusText && evt.getTargetMorph() !== this) return false;
            if (this.menu) this.collapse();
            else this.expand();
            evt.stop(); return true;
        },
            onWorldResize: function onWorldResize() {
            this.alignInWorld();
        }
        });

        if (!lively.Config.get("showMenuBar") || world._MenuBarHidden) {
            // add debugging flap
            lively.BuildSpec('lively.ast.DebuggingFlap').createMorph().openInWorld();
        } else {
            lively.require('lively.morphic.tools.MenuBar').toRun(function() {
                lively.BuildSpec('lively.ast.DebuggingMenuEntry', lively.BuildSpec('lively.morphic.tools.MenuBarEntry').customize({

                    name: 'DebuggingMenuEntry',
                    textString: 'Debugging',

                    changeColorForMenu: false,
                    menuBarAlign: 'right',

                    style: lively.lang.obj.merge(lively.BuildSpec('lively.morphic.tools.MenuBarEntry').attributeStore.style, {
                        extent: lively.pt(120, 22),
                        textColor: Global.Color.white,
                        toolTip: 'Debugging options'
                    }),

                    morphMenuItems: function morphMenuItems() {
                        function cmd(name) { return function() { lively.ide.commands.exec(name); }; }

                        var dbgStmt = !!lively.Config.get('enableDebuggerStatements');
                        return [
                            ['[' + (dbgStmt ? 'x' : ' ') + '] break on debugger', function() {
                                lively.Config.set('enableDebuggerStatements', !dbgStmt);
                            }],
                            ['clear cache', function() {
                                if (!lively.IndexedDB.isAvailable()) return;
                                lively.IndexedDB.hasStore('Debugging', function(err, exists) {
                                    if (err) throw err;
                                    if (exists)
                                        lively.IndexedDB.clear(function(err) {
                                            if (err)
                                                alert('Could not clear Debugging cache: ' + err.message);
                                            else
                                                alertOK('Cleared Debugging cache!');
                                        }, 'Debugging');
                                    else
                                        alertOK('No cache to be cleared!');
                                });
                            }]
                        ];
                    },

                    onLoad: function onLoad() {
                        if (lively.Config.get('loadRewrittenCode')) {
                            this.applyStyle({ fill: Global.Color.green });
                            this.textString = 'Debugging';
                        } else {
                            this.applyStyle({ fill: Global.Color.red });
                            this.textString = 'NOT Debugging';
                        }
                    }

                }));

                // add DebuggingMenuEntry to menubar
                lively.morphic.tools.MenuBar.addEntry(
                    lively.BuildSpec('lively.ast.DebuggingMenuEntry').createMorph()
                );
                if (!lively.Config.get('menuBarDefaultEntries').include('lively.ast.Debugging')) {
                    lively.Config.get('menuBarDefaultEntries').push('lively.ast.Debugging');
                }
            });
        }
    });
})();

Object.extend(lively.ast.Debugging, {

    getMenuBarEntries: function() {
        return [lively.BuildSpec('lively.ast.DebuggingMenuEntry').createMorph()];
    }

});


// patch JSLoader to rewrite code on load
Object.extend(JSLoader, {

    evalJavaScriptFromURL: function(url, source, onLoadCb, headers) {
        if (!source) { console.warn('Could not load %s', url); return; }

        function declarationForGlobals(rewrittenAst) {
            // _0 has all global variables
            var propAccess = lively.PropertyPath('body.0.block.body.0.declarations.4.init.properties'),
                globalProps = propAccess.get(rewrittenAst);
            if (!globalProps) {
                console.warn('Cannot access global declarations of %s ', url);
                return '\n';
            }
            var globalVars = globalProps.pluck('key').pluck('value');
            return globalVars.map(function(varName) {
                return Strings.format('Global["%s"] = _0["%s"];', varName, varName);
            }).join('\n');;
        }

        // rewrite code
        var relUrl = url.indexOf(LivelyLoader.rootPath) == 0 ? url.substr(LivelyLoader.rootPath.length) : url,
            ast, rewrittenAst, rewrittenSource;

        function executeCode(reuse) {
            var noRewrite = relUrl.substr(0, 9) == 'core/lib/';
            if (noRewrite)
                rewrittenSource = source;
            else
                if (!reuse) {
                    ast = lively.ast.parse(source, { locations: true, directSourceFile: relUrl });
                    rewrittenAst = lively.ast.Rewriting.rewrite(ast, LivelyDebuggingASTRegistry, relUrl);
                    rewrittenSource = Strings.format(
                        '(function() {\n%s\n%s\n})();',
                        escodegen.generate(rewrittenAst),
                        declarationForGlobals(rewrittenAst)
                    );
                    ast.source = source;
                }

            try {
                // adding sourceURL improves conventional debugging as it will be used
                // in stack traces by some debuggers
                eval.call(Global, rewrittenSource + "\n//# sourceURL=" + url);

                !reuse && !noRewrite && lively.IndexedDB.isAvailable() && lively.IndexedDB.set(relUrl, {
                    date: headers['last-modified'],
                    ast: ast,
                    rewrittenAst: rewrittenAst,
                    rewrittenSource: rewrittenSource
                }, null /* callback? */, 'Debugging');
            } catch (e) {
                console.error('Error when evaluating %s: %s\n%s', url, e, e.stack);
            }
            if (typeof onLoadCb === 'function') onLoadCb();
        }

        if (lively.IndexedDB.isAvailable()) {
            lively.IndexedDB.ensureObjectStore('Debugging', null, function() {
                lively.IndexedDB.get(relUrl, function(err, cached) {
                    var reuse = false;
                    if (!err && cached != undefined) {
                        if (cached.date == headers['last-modified']) {
                            ast = cached.ast;
                            rewrittenAst = cached.rewrittenAst;
                            rewrittenSource = cached.rewrittenSource;

                            var regEntries = [];
                            acorn.walk.forEachNode(ast, function(node, state, depth, type) {
                                if (node.hasOwnProperty('registryId'))
                                    state.pushIfNotIncluded(node);
                            }, regEntries);
                            if (LivelyDebuggingASTRegistry[relUrl] == undefined)
                                LivelyDebuggingASTRegistry[relUrl] = [];
                            regEntries.forEach(function(node) {
                                LivelyDebuggingASTRegistry[relUrl][node.registryId] = node;
                            });
                            reuse = true;
                        }
                    }
                    executeCode(reuse);
                }, 'Debugging');
            });
        } else
            executeCode();
    }

});

var _getOption = JSLoader.getOption;
JSLoader.getOption = function(option) {
    switch (option) {
    case 'loadRewrittenCode':
        return false;
    case 'onLoadRewrite':
        return true;
    default:
        return _getOption.call(_getOption, option);
    }
}

if (lively.Config.get('loadRewrittenCode'))
    lively.Config.set('improvedJavaScriptEval', false); // me no like improved eval yet

}) // end of module
