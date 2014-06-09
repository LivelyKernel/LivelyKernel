module('lively.ide.tools.CodeSearch').requires("lively.ide.tools.CommandLine").toRun(function() {

lively.BuildSpec('lively.ide.tools.CodeSearch', {
    _BorderColor: null,
    _Extent: lively.pt(714.0,503.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: { adjustForNewBounds: true },
    name: "CodeSearch",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(709.0,478.0),
        _Fill: Color.rgb(245,245,245),
        _Position: lively.pt(3.0,22.0),
        _StyleClassNames: ["Morph","Box"],
        _StyleSheet: ".list-item {\n\
    	font-family: Monaco, monospace      !important;\n\
    	font-size: 9pt !important;\n\
    }\n\
    \n\
    .list-item.nameMatch {\n\
    	background-color: #FFFFFF;\n\
    /*background-color: #CCCCCC;*/\n\
    }\n\
    \n\
    .list-item.selectorMatch {\n\
    	background-color: #DDDDDD;\n\
    }\n\
    \n\
    .list-item.sourceMatch {\n\
    /*background-color: #EEEEEE;*/\n\
    	background-color: #CCCCCC;\n\
    /*background-color: #EEEEEE;*/\n\
    }",
        className: "lively.morphic.Box",
        droppingEnabled: true,
        filterState: {
            filters: [],
            items: [],
            searchTerm: "",
            sortKey: "name"
        },
        lastFocused: {
            isMorphRef: true,
            name: "filter"
        },
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true,
        },
        name: "FilterableList",
        prevClicked: null,
        submorphs: [lively.BuildSpec("lively.ide.tools.CommandLine").customize({
            labelString: 'search for: ',
            name: "filter",
            _Extent: lively.pt(701.6,20),
            style: {
                clipMode: "hidden",
                enableDragging: false,
                enableGrabbing: false,
                fontSize: 12,
                gutter: false,
                resizeWidth: true
            },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "inputChange", this.get("FilterableList"), "inputChange", {});
        }
        }),{
            _Extent: lively.pt(200,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 8,
            _Position: lively.pt(4,24),
            className: "lively.morphic.Text",
            droppingEnabled: false,
            fixedWidth: true,
            grabbingEnabled: false,
            layout: { resizeWidth: false },
            name: "resultText",
            textString: "0 matches"
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(12.0,12.0),
            _Position: lively.pt(590,21),
            checked: false,
            className: "lively.morphic.CheckBox",
            droppingEnabled: true,
            layout: {moveHorizontal: true},
            name: "serversearchCheckBox",
            sourceModule: "lively.morphic.Widgets",
            connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "checked", this.get('CodeSearch'), "searchModeChanged", {});
            }
        }, {
            _Extent: lively.pt(200,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 8,
            _Position: lively.pt(614,24),
            className: "lively.morphic.Text",
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {moveHorizontal: true},
            name: "serversearchCheckBoxLabel",
            textString: "searchOnServer"
        }, {
            _BorderColor: Color.rgb(202,202,202),
            _BorderWidth: 1,
            _ClipMode: {
                x: "hidden",
                y: "scroll"
            },
            _Extent: lively.pt(701.6,431.5),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(4,43),
            className: "lively.morphic.List",
            droppingEnabled: true,
            itemMorphs: [],
            layout: {
                adjustForNewBounds: true,
                extent: lively.pt(701.6,431.5),
                padding: 0,
                resizeHeight: true,
                resizeWidth: true
            },
            name: "list",
            selectedIndexes: [],
            sourceModule: "lively.morphic.Lists",
            ensureItemMorphs: function ensureItemMorphs(requiredLength, layout) {
            var itemMorphs = this.getItemMorphs(true);
            requiredLength = Math.min(layout.noOfCandidatesShown, requiredLength);
            if (itemMorphs.length > requiredLength) {
                lively.bindings.noUpdate(function() {
                    itemMorphs.slice(requiredLength).forEach(function(text) {
                        text.setPointerEvents('auto');
                        text.index = undefined;
                        text.setTextString('');
                        text.removeStyleClassName("selected");
                        text.selected = false;
                        text.setHandStyle("default");
        var cssClasses = ["Morph","Text","list-item"];
        text.setStyleClassNames(cssClasses);

                    });
                    itemMorphs = itemMorphs.slice(0,requiredLength);
                });
            } else if (itemMorphs.length < requiredLength) {
                var c = this.listItemContainer,
                    newItems = Array.range(itemMorphs.length, requiredLength-1).collect(function(i) {
                        return c.addMorph(this.createListItemMorph('', i, layout)); }, this);
                itemMorphs = itemMorphs.concat(newItems);
            }
            return itemMorphs;
        },
            focus: function focus() {
                        var win = this.getWindow();
                        win && (win.targetMorph.lastFocused = this);
                        return $super();
                    },
            getMenu: function getMenu() {
                return this.owner.getMenuItemsFor(this.getSelection());
            },
            renderItems: function renderItems(items, from, to, selectedIndexes, renderBounds, layout) {
                        this.ensureItemMorphs(to-from, layout).forEach(function(itemMorph, i) {
                            var listIndex = from+i,
                                selected = selectedIndexes.include(listIndex);
                            itemMorph.setPointerEvents('auto');
                            itemMorph.setPosition(pt(0, listIndex*layout.listItemHeight));
                            itemMorph.index = listIndex;
                            itemMorph.name = String(itemMorph.index);
                            var cssClasses = ["Morph","Text","list-item"];
                            if (items[listIndex].cssClasses) cssClasses.pushAll(items[listIndex].cssClasses);
                            if (selected) cssClasses.push('selected');
                            itemMorph.setStyleClassNames(cssClasses);
                            itemMorph.textString = this.renderFunction(items[listIndex]);
                            if (selected !== itemMorph.selected) {
                                itemMorph.setIsSelected(selected, true/*suppress update*/);
                            }
                        }, this);
                    },
            reset: function reset() {
                        this.listItemStyle = {
                          allowInput: false,
                          borderColor: Color.rgb(204,204,204),
                          borderWidth: 1,
                          fill: null,
                          fixedHeight: false,
                          fixedWidth: true,
                          clipMode: 'hidden',
                          whiteSpaceHandling: 'pre'
                        }
                        this.setClipMode(this.getClipMode())
                        this.cachedBounds=null
                        this.listItemContainer.removeAllMorphs()
                        this.connections = ['listItemDoubleClicked'];
                        // this.itemList[0].value
                    }
        }],
        applyFilter: function applyFilter(filters, thenDo) {
        var self = this;
        self.filterState.filters = filters;
        Functions.debounceNamed(self.id+'applyFilter', 500, function() {
            false && show('applying filter ' + filters);
            self.renderDebounced(thenDo);
        })();
    },
        applySort: function applySort() {
        var sortKey = this.get('sortBySelector').selection || 'name';
        this.filterState.sortKey = sortKey;
        this.render();
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "lastFocused", this, "focusChanged", {});
    },
        execItemAction: function execItemAction(item, n) {
        var action = this.getItemActionsFor(item)[n];
        if (!action) { show("no item action %s exists", n); return; }
        action.exec();
    },
        focusChanged: function focusChanged(newFocus) {

    },
        getCSSClassesForItem: function getCSSClassesForItem(item) {
        return item.value && item.value.matchedAs ? [item.value.matchedAs] : [];
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
        getMenuItemsFor: function getMenuItemsFor(fileItem) {
        return this.getItemActionsFor(fileItem).map(function(ac) {
            return [ac.description, ac.exec]; })
    },
        inputChange: function inputChange() {
        var self = this,
            input = this.get('filter').getInput(),
            searchInputAndFilter = this.splitInputInSearchTermAndFilters(input);

        function onError(err) {
            show('Error in search: ' + (err.stack || err));
            self.reset();
        }

        if (this.filterState.searchTerm === searchInputAndFilter.searchTerm) {
            this.applyFilter(searchInputAndFilter.filters);
        } else {
            this.filterState.searchTerm = searchInputAndFilter.searchTerm;
            [function(next) {
                self.owner.doSearch(searchInputAndFilter.searchTerm, function(err, resultList) {
                    self.filterState.items = resultList;
                    if (err) onError(err); else next();
                });
            },
            function(next) {
                self.applyFilter(searchInputAndFilter.filters, function(err, filteredList) {
                    false && show('applying filter done');
                    if (err) onError(err); else next();
                });

            },
            function(next) { false && alertOK(':)') }].doAndContinue();
        }
    },
        itemsFilter: function itemsFilter(filters, items) {
        filters = (filters || []).map(function(ea) {
            return ea.toLowerCase ? ea.toLowerCase() : ea; });
        var result = items.filter(function(item) {
            return filters.all(function(filter) {
                if (!filter || !filter.length) {
                    return true;
                } else if (Object.isString(filter)) {
                    return item.string.toLowerCase().include(filter);
                } else if (Object.isRegExp(filter)) {
                    return filter.test(item.string);
                } else { return true; }
            });
        });
        return result;
    },
        itemsForList: function itemsForList(items) {
        var self = this
        return items.map(function(ea) {
            var li = ea.isListItem ? ea : {
                isListItem: true,
                string: String(ea),
                value: ea
            }
            if (!li.cssClasses) li.cssClasses = self.getCSSClassesForItem(li)
            return li;
        });
    },
        itemsSort: function itemsSort(sortKey, items) {
        return items;
        // return items.sortBy(function(item) {
        //     if (sortKey === 'name') {
        //         return item.fileName;
        //     } else if (sortKey === 'time') {
        //         return -item.lastModified;
        //     } else if (sortKey === 'size') {
        //         return -item.size;
        //     } else {
        //         return item.fileName;
        //     }
        // });
    },
        listItemDoubleClicked: function listItemDoubleClicked(item) {
        this.execItemAction(item, 0);
    },
        listItemMorph: function listItemMorph(listItem, extent) {
        if (!listItem) listItem = {isListItem: true, string: 'invalid list item: ' + listItem};
        if (listItem.morph) return listItem.morph;
        var string = listItem.string || String(listItem);
        var listItemMorph = new lively.morphic.Text(lively.rect(0,0,extent.x,20), string);
        listItemMorph.item = listItem;
        listItemMorph.applyStyle({
          allowInput: false,
          borderColor: Color.rgb(204,204,204),
          borderWidth: 1,
          fill: null,
          fixedHeight: false,
          fixedWidth: true,
          clipMode: 'hidden',
          whiteSpaceHandling: 'pre'
        });
        return listItemMorph;
    },
        onKeyDown: function onKeyDown(evt) {
        var fl              = this.get('list'),
            filter          = this.get('filter'),
            listFocused = fl.isFocused(),
            filterFocused   = filter.isFocused(),
            keys            = evt.getKeyString(),
            wasHandled      = true;

        function ensureSelectionIsInView(topOrBottom) {
            var visible = fl.getVisibleIndexes();
            // if (visible.include(fl.selectedLineNo)) return;
            var newIdx = topOrBottom === 'top' ? visible.first() : visible.last()-1;
            fl.selectAt(newIdx);
        }

        switch (keys) {
            case 'Enter':
                var sel = fl.getSelection();
                // show(Objects.inspect(sel, {maxDepth: 1}))
                if (sel) this.execItemAction(sel, 0);
                else wasHandled = false;
                break;
            case 'Control-N': case 'Down': fl.selectNext(); break;
            case 'Control-P': case 'Up': fl.selectPrev(); break;
            case "Alt-V": case "PageUp": fl.scrollPage('up'); ensureSelectionIsInView('top'); break;
            case "Control-V": case "PageDown": fl.scrollPage('down'); ensureSelectionIsInView('bottom'); break;
            case "Alt-Shift->": case "End": fl.scrollToBottom(); ensureSelectionIsInView('bottom'); break;
            case "Alt-Shift-<": case "Home": fl.scrollToTop(); ensureSelectionIsInView('top'); break;
            case 'Alt-1': this.execItemAction(fl.selection, 0); break;
            case 'Alt-2': this.execItemAction(fl.selection, 1); break;
            case 'Alt-3': this.execItemAction(fl.selection, 2); break;
            case 'Alt-4': this.execItemAction(fl.selection, 3); break;
            case 'Alt-5': this.execItemAction(fl.selection, 4); break;
            case 'Alt-S': this.userQueryForSort(); break;
            default: wasHandled = false;
        }

        if (!wasHandled) {
            return filterFocused ? false : $super(evt);
        } else {
            evt.stop(); return true;
        }
    },
        onMouseUp: function onMouseUp(evt) {
        var tgt = evt.getTargetMorph();

        if (tgt && tgt.isListItemMorph) {
            if (this.prevClicked === tgt) {
                this.prevClicked = null;
                this.listItemDoubleClicked(this.get('list').selection);
            } else {
                this.prevClicked = tgt;
                (function() { this.prevClicked = null; }).bind(this).delay(0.3);
            }
        }
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('filter').focus();
    },
        render: function render(thenDo) {
        // console.profile(); this.render(); console.profileEnd();
        // this.render();
        this.renderListFiltered(thenDo);
    },
        renderDebounced: function renderDebounced(thenDo) {
        var self = this;
        Functions.debounceNamed(
            ('render-' + this.id), 40,
            function(doFunc) { self.render(doFunc); })(thenDo);
    },
        renderListFiltered: function renderListFiltered(thenDo) {
        var list = this.get('list'),
            filters = this.filterState.filters,
            sortKey = this.filterState.sortKey,
            items = this.filterState.items,
            processItems = Functions.compose(
                this.itemsFilter.curry(filters),
                this.itemsSort.curry(sortKey),
                this.itemsForList.bind(this)),
            processedItems = processItems(items);

            // dirsAndFiles = items.groupBy(function(item) {
            //     return item.isDirectory ? 'directory' : 'file'}),
            // dirsAndFilesSorted = dirsAndFiles.mapGroups(function(_, group) {
            //     return processItems(group); });
        list.isInLayoutCycle = true;
        list.updateList(processedItems.toArray().flatten());
        if (!list.selection) list.selectAt(0);
        this.get('resultText').textString = processedItems.length + ' matches';
        list.isInLayoutCycle = false;
        list.applyLayout();
        thenDo && thenDo.call(this, null, processItems);
    },
        reset: function reset() {
        this.filterState = {
            searchTerm: '',
            items: [],
            sortKey: 'name',
            filters: []
        }
        this.get('list').withAllSubmorphsDo(function(ea) { return ea.applyStyle({cssStylingMode: true}); });
        lively.bindings.connect(this, 'lastFocused', this, 'focusChanged');
        this.get('filter').clearOnInput = false;
        this.get('list').addScript(function getMenu() {
            return this.owner.getMenuItemsFor(this.getSelection());
        });
        this.get('filter').setInput('')
        this.get('list').listItemContainer.removeAllMorphs();
    },
        setList: function setList(items) {
        this.filterState.items = items;
        this.renderDebounced();
    },
        splitInputInSearchTermAndFilters: function splitInputInSearchTermAndFilters(input) {
        // this.inputChange()
        // this.splitInputInSearchTermAndFilters('foo')
        // this.splitInputInSearchTermAndFilters('foo bar')
        // this.splitInputInSearchTermAndFilters('/foo/ bar')
        var parts = input.split(' ').invoke('trim'),
            searchTerm = parts[0],
            reMatch = searchTerm.match(/^\/(.*)\/$/);
        if (reMatch) searchTerm = new RegExp(reMatch[1], 'i');
        return {
            searchTerm: searchTerm,
            filters: parts.slice(1)
        }
    },
        userQueryForSort: function userQueryForSort() {
        var self = this;
        lively.ide.tools.SelectionNarrowing.chooseOne(['time', 'size', 'name'], function(err, selection) {
        self.get('sortBySelector').selection = selection;
        self.applySort();
    })
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

    Functions.debounceNamed(this.id+'doSearch', 800, function(searchTerm) {
        loadingIndicator.setLabel('Loading...');
        self.getWindow().setTitle('CodeSearch for ' + String(searchTerm).truncate(100));
        searchMethod.bind(self, searchTerm, function(err, list) {
            isLoaded = true;
            if (loadingIndicator) loadingIndicator.remove();
            false && show('search done')
            thenDo && thenDo.call(self, err, list);
        }).delay(0.1);
    })(searchTerm);
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

            if (type === 'buildspec')
                name = optParent.buildSpecName;

            if (!name && obj.name) name = obj.name;

            if (obj.namespaceIdentifier)
                name = obj.namespaceIdentifier;

            if (!name && proto != obj)
                name = name + "(obj)"

            if (proto !== obj && obj.isMorph)
                name = obj.name ? obj.name + "(" + String(obj.id).truncate(12) + ")" : String(obj);

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
            var re = new RegExp('.{0,20}' + searchString + '.{0,20}', 'i');

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
                return lively.ide.openFile(path);
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
            var ed = $world.openObjectEditorFor(find.object);
            ed.targetMorph.get('ObjectEditorScriptList').setSelection(find.selector);
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
