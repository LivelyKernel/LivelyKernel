module('lively.ide.tools.CodeSearch').requires('lively.morphic.tools.FilterableList').toRun(function() {

lively.BuildSpec('lively.ide.tools.CodeSearch', {
    _BorderColor: null,
    _Extent: lively.pt(714.0,523.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: { adjustForNewBounds: true },
    name: "CodeSearch",
    submorphs: [
        lively.BuildSpec('lively.morphic.tools.FilterableList').customize({
            _Extent: lively.pt(709.0,478.0),
            _Position: lively.pt(3.0,22.0),
            _StyleSheet: ".list-item {\n"
                       + "	font-family: Monaco, monospace      !important;\n"
                       + "	font-size: 9pt !important;\n"
                       + "}\n"
                       + ".list-item.nameMatch {\n"
                       + "	background-color: #FFFFFF;\n"
                       + "/*background-color: #CCCCCC;*/\n"
                       + "}\n"
                       + ".list-item.selectorMatch {\n"
                       + "	background-color: #DDDDDD;\n"
                       + "}\n"
                       + ".list-item.sourceMatch {\n"
                       + "/*background-color: #EEEEEE;*/\n"
                       + "	background-color: #CCCCCC;\n"
                       + "/*background-color: #EEEEEE;*/\n"
                       + "}\n",

            filterState: {
                filterTimeout: 400,
                filters: [],
                items: [],
                searchTerm: "",
                sortKey: "name"
            },

            applyFilter: function applyFilter(filters, thenDo) {
                var self = this;
                var searchTerm = filters.searchTerm;
                var itemFilters = filters.filters;

                if (this.filterState.searchTerm === searchTerm) {
                    applyFilters(itemFilters);
                } else {
                    this.filterState.searchTerm = searchTerm;
                    [function(next) {
                        self.owner.doSearch(searchTerm, function(err, resultList) {
                            self.filterState.items = resultList;
                            if (err) onError(err); else next();
                        });
                    },
                    function(next) {
                        self.applyFilter(filters, function(err, filteredList) {
                            false && show('applying filter done');
                            if (err) onError(err); else next();
                        });
        
                    },
                    function(next) { false && alertOK(':)') }].doAndContinue();
                }

                // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

                function applyFilters(filters) {
                    self.filterState.filters = filters;
                    Functions.debounceNamed(self.id+'applyFilter', 500, function() {
                        false && show('applying filter ' + filters);
                        self.renderDebounced(thenDo);
                    })();
                }

                function onError(err) {
                    show('Error in search: ' + (err.stack || err));
                    self.reset();
                }

            },

            parseInput: function parseInput(input) {
                // this.inputChange()
                // this.parseInput('foo')
                // this.parseInput('foo bar')
                // this.parseInput('/foo/ bar')
                var parts = input.split(' ').invoke('trim'),
                    searchTerm = parts[0],
                    reMatch = searchTerm.match(/^\/(.*)\/$/);
                if (reMatch) searchTerm = new RegExp(reMatch[1], 'i');
                return {
                    searchTerm: searchTerm,
                    filters: parts.slice(1)
                }
            },

            getItemActionsFor: function getItemActionsFor(item) {
                var self = this, value = item && (item.value || item);
                var action1 = {
                    description: 'browse selection',
                    exec: function() {
                        self.getWindow().browseCode(value);
                    }
                }, action2 = {
                    description: 'action2',
                    exec: function() {
                        show('action 2 ' + item);
                    }
                };
                return [action1, action2];
            },

            onKeyDown: function onKeyDown(evt) {
                var filter      = this.get('filter'),
                    filterFocused = filter.isFocused(),
                    wasHandled = this.onKeyDownActOnList(evt);
        
                if (!wasHandled && evt.getKeyString() === 'Alt-S') {
                    this.userQueryForSort();
                    wasHandled = true;
                }

                if (!wasHandled) {
                    return filterFocused ? false : $super(evt);
                } else {
                    evt.stop(); return true;
                }
            },

            userQueryForSort: function userQueryForSort() {
                var self = this;
                lively.ide.tools.SelectionNarrowing.chooseOne(['time', 'size', 'name'], function(err, selection) {
                    self.get('sortBySelector').selection = selection;
                    self.applySort();
                })
            }
        }),

        {
            _Extent: lively.pt(200,18.0),
            _Position: lively.pt(5,22+478+4),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 8,
            _HandStyle: "default",
            _InputAllowed: false,
            allowInput: false,
            className: "lively.morphic.Text",
            droppingEnabled: false,
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                resizeWidth: false,
                moveVertical: true
            },
            name: "resultText",
            textString: "0 matches"
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(12.0,12.0),
            _Position: lively.pt(590,24+478),
            checked: false,
            className: "lively.morphic.CheckBox",
            droppingEnabled: true,
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "serversearchCheckBox",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get('CodeSearch'), "searchModeChanged", {});
            }
        }, {
            _Extent: lively.pt(90.0,18.0),
            _Position: lively.pt(614.0,22+478+4),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 8,
            _HandStyle: "default",
            _InputAllowed: false,
            allowInput: false,
            className: "lively.morphic.Text",
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "serversearchCheckBoxLabel",
            textString: "searchOnServer",
            onMouseDown: function onMouseDown(evt) {
                var checkbox = this.get('serversearchCheckBox');
                checkbox.setChecked(!checkbox.isChecked());
            }
        }],

    titleBar: "CodeSearch",
    doSearch: function doSearch(searchTerm, thenDo) {
    // this.reset(); this.get('filter').setInput('indica'); this.inputChange()
    false && show('doing search');

    if (!searchTerm || searchTerm === '') { this.reset(); return; }

    var self = this,
        isLoaded = false,
        loadingIndicator = this.getMorphNamed('LoadingIndicator'),
        searchMethod = self.searchOnServerMode ? self.searchOnServer : self.searchInRuntime;

    if (!loadingIndicator) {
        this.withLoadingIndicatorDo(function(err, _loadingIndicator) {
            if (isLoaded) return;
            loadingIndicator = _loadingIndicator;
            loadingIndicator.setLabel('Input...');
        });
    }

    Functions.debounceNamed(this.id+'doSearch', 800, function(searchTerm, thenDo) {
        loadingIndicator.setLabel('Loading...');
        self.getWindow().setTitle('CodeSearch for ' + String(searchTerm).truncate(100));
        searchMethod.call(self, searchTerm, function(err, list) {
            isLoaded = true;
            lively.bindings.connect(self.get('FilterableList'), 'rendered', loadingIndicator, 'remove', {removeAfterUpdate: true});
            lively.bindings.connect(self.get('FilterableList'), 'rendered', self.get('resultText'), 'textString', { converter: function() { return this.sourceObj.get('list').getList().length + ' matches'; } })
            thenDo && thenDo.call(self, err, list);
        });
    })(searchTerm, thenDo);;
},
    reset: function reset() {
    this.get('FilterableList').reset();
    this.setTitle("CodeSearch");
    this.name = 'CodeSearch';
},

    searchOnServer: function searchOnServer(searchString, thenDo) {
        lively.ide.CommandLineSearch.doGrep(searchString, null, function(lines, baseDir) {
            var candidates = lines.map(function(line) {
                return line.trim() === '' ? null : {
                    isListItem: true,
                    string: line.slice(baseDir.length),
                    value: {baseDir: baseDir, match: line, type: 'grep'}
                };
            }).compact();
            // if (candidates.length === 0) candidates = ['nothing found'];
            thenDo(null, candidates);
        });

    // var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
    //     name: '_lively.ide.CommandLineInterface.doGrepSearch.NarrowingList',
    //     reactivateWithoutInit: true,
    //     spec: {
    //         prompt: 'search for: ',
    //         candidatesUpdaterMinLength: 3,
    //         candidates: [],
    //         maxItems: 25,
    //         candidatesUpdater: candidateBuilder,
    //         keepInputOnReactivate: true,
    //         actions: [{
    //             name: 'open',
    //             exec: function(candidate) {
    //                 if (Object.isString(candidate)) return;
    //                 var isLively = candidate.match.match(/\.?\/?core\//) && candidate.baseDir.match(/\.?\/?/);
    //                 if (isLively) openInSCB(candidate);
    //                 else openInTextEditor(candidate);
    //             }
    //         }, {
    //             name: 'open in system browser',
    //             exec: openInSCB
    //         }, {
    //             name: 'open in text editor',
    //             exec: openInTextEditor
    //         }, {
    //             name: "open grep results in workspace",
    //             exec: function() {
    //                 var state = narrower.state,
    //                     content = narrower.getFilteredCandidates(state.originalState || state).pluck('match').join('\n'),
    //                     title = 'search for: ' + narrower.getInput();
    //                 $world.addCodeEditor({title: title, content: content, textMode: 'text'}).getWindow().comeForward();
    //             }
    //         }]
    //     }
    // });
},
    searchInRuntime: function searchInRuntime(searchString, thenDo) {

    var found = [];

    this.withAllMethodsDo(
        function(obj, methodName, type, optParent) {
            var name;

            if (!obj) return;

            if (type === 'namespace' && matchesSearch(obj.namespaceIdentifier)) {
                found.push({
                    object: obj,
                    objectName: obj.namespaceIdentifier,
                    type: type,
                    selector: '',
                    methodSource: '',
                    parent: optParent
                });
            }

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            // searches through code:

            // we get this already with initialize
            if (methodName === 'constructor' && type === 'class') return;
            if (methodName === 'superclass' && lively.Class.isClass(obj.superclass)) return;

            var proto = obj.constructor && obj.constructor.prototype;

            // class
            if (proto === obj)
                name = obj.constructor.type || obj.constructor.name;

            // class extend
            if (proto === Function.prototype && obj.qualifiedMethodName) {
                name = obj.qualifiedMethodName();
            }

            if (type === 'buildspec')
                name = optParent.buildSpecName;

            if (!name && obj.name) name = obj.name;

            if (obj.namespaceIdentifier)
                name = obj.namespaceIdentifier;

            if (!name && proto != obj)
                name = name + "(obj)"

            if (proto !== obj && obj.isMorph)
                name = obj.name ? obj.name + "(" + String(obj.id).truncate(12) + ")" : String(obj);

            if (name && name.startsWith('Global.'))
                name = name.substr(7);

            if (obj === Global)
                name = "Global";

            name = String(name);
            methodName = String(methodName);
            var source = lively.Class.isClass(obj) ? name : String(obj[methodName]);

            if (![name, methodName, source].some(matchesSearch)) return;

            found.push({
                object: obj,
                selector: methodName,
                objectName: name,
                methodSource: source,
                parent: optParent,
                type: type
            });

            // Search types defined among others in CodeEditor>>doBrowseSenders
            // if (searchType !== "__sender" && matches(func)) {
            //     item.search= 'implementor',
            //     finds.push(item)
            //     return;
            // }

            // if (searchType !== "__implementor") {
            //     var f = obj[func];
            //     if (!f || !f.getOriginal) return;
            //     var source = String(f.getOriginal())
            //     if (matches(source)){
            //         item.search =  'sender'
            //         finds.push(item)
            //     }
            // }

            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            // helper
            function matchesSearch(string) {
                return string.toLowerCase().include(searchString.toLowerCase());
            }
        },

        function(err) {

            // 1. add info about what is matched...
            var re = new RegExp('.{0,20}' + searchString.regExpEscape() + '.{0,20}', 'i');

            found = found.map(function(found) {

                try {
                    var nameMatch = found.objectName.match(re);
                    if (nameMatch && nameMatch[0]) {
                        found.matchedAs = 'nameMatch';
                        found.match = nameMatch[0] || '';
                        return found;
                    }

                    var selectorMatch = found.selector.match(re);
                    if (selectorMatch && selectorMatch[0]) {
                        found.matchedAs = 'selectorMatch';
                        found.match = selectorMatch[0] || '';
                        return found;
                    }

                    var sourceMatch = found.methodSource.match(re);
                    if (sourceMatch && sourceMatch[0]) {
                        found.matchedAs = 'sourceMatch';
                        found.match = sourceMatch[0] || '';
                        return found;
                    }

                    show('not matched: ' + found.objectName + '>>' + found.selector);
                    return found;
                } catch (err) {
                    show(String(err.stack||err));
                    return null;
                }
            }).compact();

            var grouped = found.groupByKey('matchedAs')

            var groupedItems = grouped.map(function(matchedAs, found) {

                try {
                    return {
                        isListItem: true,
                        string: Strings.format("[%s] %s%s%s",
                            found.type,
                            found.objectName,
                            found.selector.length ? '>>' + found.selector : '',
                            found.matchedAs === 'sourceMatch' ?
                                ' ("' + found.match.trim() + '")' : ''),
                        value: found
                    }
                } catch (err) { show(String(err.stack||err)) }

            });

            var items = (groupedItems.nameMatch || [])
                .concat(groupedItems.selectorMatch || [])
                .concat(groupedItems.sourceMatch || []);
            // show('found ' + items.length);
            thenDo && thenDo(null, items);
        });
},
    withAllMethodsDo: function withAllMethodsDo(func, thenDo) {

    var globalNamespaces = Global.subNamespaces();
    var allNamespaces = Global.subNamespaces(true);

    Functions.own(Global).forEach(function(eaMethod) {
        !lively.Class.isClass(Global[eaMethod]) && func(Global, eaMethod, 'global');
    });

    this.world().withAllSubmorphsDo(function(ea) {
        Functions.own(ea).forEach(function(eaMethod) {
            func(ea, eaMethod, 'script')
        });
    });

    allNamespaces.forEach(function(ns) {
        Functions.own(ns).forEach(function(methodName) {
            !lively.Class.isClass(ns[methodName]) && func(ns, methodName, 'extend')
        });
        func(ns, '', 'namespace');
    });

    Global.classes(true).uniq().forEach(function(eaClass) {
        try {
            Functions.own(eaClass).forEach(function(eaMethod) {
                func(eaClass, eaMethod, 'extend');
            });
        } catch (e) {
            show('error searching class side of class ' + eaClass.name + '\n' + e);
        }

        try {
            Functions.own(eaClass.prototype).forEach(function(eaMethod) {
                func(eaClass.prototype, eaMethod, 'class', eaClass);
            });
        } catch (e) {
            show('error searching instance side of class ' + eaClass.name + '\n' + e);
        }
    });

    function findMethodsOfSpec(spec, path) {
        var store = spec.attributeStore;
        var methods = Functions.own(spec.attributeStore).map(function(methodName) {
            return {store: store, methodName: methodName, path: path};
        });
        return methods.concat((store.submorphs || []).map(function(spec, i) {
            return findMethodsOfSpec(spec, path.concat([store.name ? store.name : 'submorphs[' + i + ']']))
        }).flatten());
    }

    Properties.forEachOwn(lively.persistence.BuildSpec.Registry, function(specName, spec) {
        var specMethods = findMethodsOfSpec(spec, []);
        specMethods.forEach(function(ea) {
            func(ea.store, ea.methodName, 'buildpsec', {buildSpecName: specName, spec: spec});
        });
    });

    thenDo && thenDo(null);
},
    withLoadingIndicatorDo: function withLoadingIndicatorDo(doFunc) {
    var self = this;
    lively.require('lively.morphic.tools.LoadingIndicator').toRun(function() {
        var loadingIndicator = lively.BuildSpec('lively.morphic.LoadingIndicator').createMorph();
        (function() {
            self.addMorph(loadingIndicator);
            loadingIndicator.align(
                loadingIndicator.bounds().center(),
                self.innerBounds().center());
        }).delay(0);
        doFunc(null, loadingIndicator);
    });
},
    browseCode: function browseCode(find) {

        if (find.type === 'grep') {
            function openInTextEditor(candidate) {
                if (Object.isString(candidate)) return false;
                var parts = candidate.match.split(':'),
                    path = parts[0], line = parts[1];
                if (line) path += ':' + line;
                lively.ide.openFile(path);
            }

            function openInSCB(candidate) {
                if (Object.isString(candidate)) return false;
                return lively.ide.CommandLineSearch.doBrowseGrepString(candidate.match, candidate.baseDir);
            }

            openInSCB(find) || openInTextEditor(find);
            return
        }

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (find.type === 'namespace') {
            lively.ide.browse(null, null, find.objectName);
            return;
        }

        if (find.type === 'script') {
            $world.openObjectEditorFor(find.object, function(ed) {
                ed.targetMorph.get('ObjectEditorScriptList').setSelection(find.selector);
            });
            return;
        }

        var mod = find.object[find.selector].sourceModule || (find.parent && find.parent.sourceModule);
        if (mod) {
            lively.ide.browse(find.objectName, find.selector, mod.namespaceIdentifier);
            return;
        }

        if (find.type === 'class') {
            return show("cannot browse method %s>>%s b/c class has no sourceModule",
                find.objectName, find.selector);
        }

        if (find.type === 'extend') {
            return show("cannot browse method %s>>%s b/c object has no sourceModule",
                find.objectName, find.selector);
        }

        show('cannot browse ' + find.type + ' ' + find.methodName);

    },

    startSearch: function startSearch(searchTerm) {
        // this.startSearch('test');
        this.get('filter').setInput(String(searchTerm));
    },

    searchModeChanged: function searchModeChanged() {
        var searchOnServer = this.get('serversearchCheckBox').isChecked();
        if (this.searchOnServerMode === searchOnServer) return;
        this.searchOnServerMode = searchOnServer;
        var input = this.get('filter').getInput();
        this.reset();
        this.startSearch(input);
    },

    onKeyDown: function onKeyDown(evt) {
        var keys = evt.getKeyString();
        switch (keys) {
            case 'Command-L': // [L]ocation
            case 'Control-L':
                var cb = this.get('serversearchCheckBox')
                cb.setChecked(!cb.isChecked());
                evt.stop(); return true;
        }
        return $super(evt);
    }

});

Object.extend(lively.ide.tools.CodeSearch, {

    openCodeSearchWindow: function() {
        return lively.BuildSpec('lively.ide.tools.CodeSearch').createMorph().openInWorldCenter().comeForward();
    },

    doSearch: function(searchTerm) {
        var win = this.openCodeSearchWindow();
        win.startSearch(searchTerm);
        return win;
    }

});

}) // end of module
