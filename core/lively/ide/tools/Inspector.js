module('lively.ide.tools.Inspector').requires('lively.persistence.BuildSpec', 'lively.morphic.Widgets', 'lively.ide.CodeEditor').toRun(function() {

lively.BuildSpec('lively.ide.tools.Inspector', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(468.2,499.4),
    _Position: lively.pt(82.4,194.8),
    _StyleClassNames: ["Morph","Window"],
    cameForward: false,
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
    draggingEnabled: true,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "ObjectInspector",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1.32,
        _Extent: lively.pt(449.3,463.6),
        _Fill: Color.rgb(235,235,235),
        _Position: lively.pt(4.0,22.0),
        _Scale: 1.02,
        className: "lively.morphic.Box",
        doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
        droppingEnabled: true,
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            extentWithoutPlaceholder: lively.pt(313.2,397.4),
            resizeHeight: true,
            resizeWidth: true
        },
        morphRefId: 2,
        name: "ObjectInspector",
        showInherited: false,
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(112,112,112),
            _BorderRadius: 2.59,
            _BorderWidth: 1.1840000000000002,
            _ClipMode: "auto",
            _Extent: lively.pt(433.0,142.1),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(8.1,38.5),
            className: "lively.morphic.Box",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            layout: {
                resizeWidth: true,
                scaleVertical: true
            },
            name: "Rectangle",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _Extent: lively.pt(1.0,0.0),
                _Fill: Color.rgb(255,255,255),
                _Position: lively.pt(-2.0,0.0),
                className: "lively.morphic.Tree",
                depth: 0,
                doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
                dragAndDrop: true,
                droppingEnabled: true,
                isInLayoutCycle: false,
                layout: {
                    resizeWidth: true,
                    scaleVertical: true,
                },
                name: "ObjectInspectorTree",
                parent: null,
                showMoreNode: null,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                reset: function reset() {
                                            this.item = null;
                                            this.submorphs.invoke("remove");
                                            this.childNodes = null;
                                            this.setExtent(pt(1,1));
                                            this.applyLayout();
                                        },
                select: function select(tree) {
                                            var wasSelected = $super(tree);
                                            if (!wasSelected) {
                                                this.get("ObjectInspectorText").doitContext = this.item.data;
                                            }
                                        }
            }]
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(410.0,28.1),
            _Position: lively.pt(10.7,8.1),
            className: "lively.morphic.Morph",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            isCopyMorphRef: true,
            layout: {
                resizeWidth: true,
            },
            morphRefId: 2,
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "auto",
                _Extent: lively.pt(322.0,21.0),
                _Fill: Color.rgb(243,243,243),
                _FontFamily: "Helvetica",
                _FontSize: 10,
                _Position: lively.pt(92.0,0.0),
                _Scale: 0.998001,
                className: "lively.morphic.DropDownList",
                doNotCopyProperties: [],
                doNotSerialize: [],
                droppingEnabled: true,
                itemList: [{
                    isListItem: true,
                    string: "show standard properties",
                    value: "standard"
                },{
                    isListItem: true,
                    string: "show all properties",
                    value: "properties"
                },{
                    isListItem: true,
                    string: "show morphs",
                    value: "submorphs"
                }],
                layout: {
                    resizeWidth: true
                },
                name: "ObjectInspectorFilterList",
                selectOnMove: false,
                selectedLineNo: 0,
                selection: "standard",
                sourceModule: "lively.morphic.Core",
                submorphs: [],
                valueScale: 1,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "selection", this.get("ObjectInspector"), "setFilter", {});
            }
            },{
                _Extent: lively.pt(92.0,0.0),
                _FontFamily: "Helvetica",
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 84,
                _MinTextWidth: 84,
                _TextColor: Color.rgb(64,64,64),
                allowInput: false,
                className: "lively.morphic.Text",
                doNotSerialize: ["charsTyped"],
                emphasis: [[0,7,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                evalEnabled: false,
                fixedHeight: true,
                fixedWidth: true,
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "Filter:"
            }]
        },{
            _AutocompletionEnabled: true,
            _BorderColor: Color.rgb(204,204,204),
            _BorderRadius: 3,
            _BorderWidth: 1,
            _Extent: lively.pt(441.0,251.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(8.1,189.9),
            _Scale: 0.9803921568627452,
            _ShowActiveLine: false,
            _ShowErrors: true,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _ShowWarnings: true,
            _SoftTabs: true,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace-chrome"],
            _TextMode: "javascript",
            _Theme: "",
            _aceInitialized: true,
            accessibleInInactiveWindow: true,
            allowInput: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            doitContext: null,
            droppingEnabled: true,
            hasRobertsKeys: true,
            layout: {
                resizeWidth: true,
                scaleVertical: true
            },
            name: "ObjectInspectorText",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            submorphs: [],
            textMode: "javascript",
            theme: "",
            doSave: function doSave() {
                        var str = this.textString.strip();
                        if (str.length == 0) {
                            alert("Nothing to save/evaluate");
                            return;
                        }
                        var tree = this.get("ObjectInspectorTree");
                        if(this.get("BindThisToSelection").checked) {
                            var selectedTree = tree.withAllTreesDetect(function(t) {return t.item.isSelected});
                            if (selectedTree) {
                                tree = selectedTree;
                            }
                        }
                        var item = tree.item;
                        var name = item.name;
                        if (name == 'this') {
                            alert("Cannot replace 'this'");
                            return;
                        }
                        var parent = item.parent;
                        if (!parent) {
                            alert("Selected item is not a real property, it cannot be changed directly");
                            return;
                        }
                        if (typeof parent.valueOf() == 'string' && (0 | name) == name) {
                            alert("Strings are immutable");
                            return;
                        }
                        var __evalStatement = str;
                        var str = '"use strict";\n' + str;
                        try {
                            var programNode = lively.ast.acorn.parse(str);
                        } catch (e) {
                            //Just in case the input is an object literal
                            //It must be a more than one property object,
                            //since the other ones are succesfully parsed (not as we intend).
                            //For the case of these more complex object literals,
                            //we only fix the top-level ones.
                            str = '"use strict";(\n' + __evalStatement + ')';
                            try {
                                lively.ast.acorn.parse(str);
                            } catch (e1) {
                                //report the original exception
                                if(e instanceof Error) {
                                    this.textString = e.name + ": " + e.message;
                                }
                                else {
                                    this.textString = 'Unhandled: ' + e;
                                }
                                return;
                            }
                            //now the parse succeeded, but programNode is not initialized
                            //so we'll skip the other fix-ups
                        }
                        var ambiguousLiterals = [];
                        var iter1 = function(seq) {
                            if (seq.body.length > 0 && seq.body.last().type == 'BlockStatement') {
                                seq = seq.body.last();
                            }
                            var lastChild = seq.body.last();
                            if (!lastChild || lastChild.type == 'LabeledStatement') {
                                //if the value to return is an empty or a one-property Object literal,
                                //it is interpreted as a block statement.
                                //To make it work we will have to surround it by round braces
                                ambiguousLiterals.push(seq);
                            } else if (lastChild.type == 'IfStatement') {
                                var iter2 = function(ifNode) {
                                    while (ifNode.consequent.type == 'IfStatement') {
                                        ifNode = ifNode.consequent;
                                    }
                                    if (ifNode.consequent.type == 'BlockStatement' && 
                                        ifNode.consequent.body.length > 0) {
                                            //When deciding what the expected return value of an 
                                            //if statement should be,
                                            //we do not interpret the curly braces construct in
                                            //"if(expr) {}" as an object literal,
                                            //since it is not at all obvious that that's what
                                            //the user intends in this case. 
                                            //Instead, we let eval do its thing, 
                                            //so, if expr is truish, we return undefined.
                                            //
                                            //But for "if(expr) {prop: val}" we guess that
                                            //the user does expect an object instead of val
                                            //when expr is truish, so we "fix" it
                                            iter1(ifNode.consequent);
                                    }
                                    if (ifNode.alternate) {
                                        if(ifNode.alternate.type == 'BlockStatement' && 
                                            ifNode.alternate.body.length > 0) {
                                                iter1(ifNode.alternate);
                                        } else if (ifNode.alternate.type == 'IfStatement') {
                                            iter2(ifNode.alternate);
                                        }
                                    }
                                }
                                iter2(lastChild);
                            }
                        }
                        if (programNode) {
                            iter1(programNode);
                        }
                        while (ambiguousLiterals.length > 0) {
                            var node = ambiguousLiterals.pop();
                            str = str.substring(0, node.start) + '(' +
                                    str.substring(node.start, node.end) +
                                    ')' + str.substring(node.end);
                        }
//Recheck
//                      lively.ast.acorn.parse(str);
                        var ctx = item.data;
                        var isFunc = typeof ctx == 'function';
                        var protoParentItem = tree.parent.item.parentItem;
                        var actualItem = item;
                        if (protoParentItem) {
                            var world = this.world();
                            world.confirm('The '+name+(isFunc ? ' method' : ' property')+' is inherited.\nDo you want to replace it in the prototype where it is inherited from?', function(answer) {
                                if (!answer) {
                                    world.confirm('Do you want to override it in the inheriting object instead?', function(ans) {
                                        if(ans) {
                                            var i = protoParentItem;
                                            while (i.parentItem) {
                                                i = i.parentItem;
                                            }
                                            parent = i.data;
                                            actualItem = i;
                                        } else {
                                            parent = null;
                                        }
                                    })
                                }
                            } );
                        }
                        if (!parent) {
                            return;
                        }
                        if (isFunc && !(Array.isArray(parent) && (0 | name) == name)){
                            //if the original source is under our source control,
                            //ask the user if the definition should be replaced in source/part.
                        } else {
                            var interactiveEval = function() { return eval(str) };
                            try {
                                parent[name] = interactiveEval.call(ctx);
                            } catch(e) {
                                if(e instanceof Error) {
                                    this.textString = e.name + ": " + e.message;
                                }
                                else {
                                    this.textString = 'Unhandled: ' + e;
                                }
                                return;
                            }
                            var that = item.inspector;
                            var value = parent[name];
                            actualItem.data = value;
                            if(!actualItem.children)
                                that.addChildrenTo(actualItem);
                            that.decorate(actualItem);
                            that.tree.layoutAfter(function() { that.update(); });
                        }
            }
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(433.7,3.7),
            _Fill: Color.rgb(204,204,204),
            _Position: lively.pt(8.1,182.4),
            className: "lively.morphic.HorizontalDivider",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            draggingEnabled: true,
            droppingEnabled: true,
            fixed: [],
            layout: {
                resizeWidth: true,
                scaleVertical: true
            },
            minHeight: 20,
            oldPoint: lively.pt(1203.0,407.0),
            pointerConnection: null,
            scalingAbove: [],
            scalingBelow: [],
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                                $super();
                                this.addScalingAbove(this.owner.tree.owner/*Box*/);
                                this.addScalingBelow(this.get('ObjectInspectorText'));
                            }
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(12.0,12.0),
            _Position: lively.pt(9.3,440.6),
            _Scale: 0.9803921568627452,
            checked: false,
            className: "lively.morphic.CheckBox",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            layout: {
                moveVertical: true
            },
            name: "BindThisToSelection",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "setChecked", this.get("ObjectInspector"), "setDoItContext", {});
        }
        },{
            _Extent: lively.pt(193.0,26.0),
            _FontFamily: "Arial, sans-serif",
            _HandStyle: "default",
            _InputAllowed: false,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Position: lively.pt(30.1,435.1),
            _Scale: 0.9803921568627452,
            _TextColor: Color.rgb(64,64,64),
            allowInput: false,
            className: "lively.morphic.Text",
            doNotSerialize: ["charsTyped"],
            emphasis: [[0,24,{
                fontWeight: "bold",
                italics: "normal"
            }]],
            fixedWidth: true,
            layout: {
                moveVertical: true
            },
            name: "Text",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "Bind 'this' to selection"
        }],
        tree: {
            isMorphRef: true,
            name: "ObjectInspectorTree"
        },
        updateFilter: "standard",
        addChildrenTo: function addChildrenTo(item) {
                    var value = item.data;
                    if(value === null || value === undefined || 
                      (typeof value.valueOf() == 'string' && value.length == 1 && 
                      item.name != 'this' && item.parent && typeof item.parent.valueOf() == 'string')) 
                        return;
                    item.children = [];
                    Object.addScript(item, function onExpand() { this.inspector.expand(this); });
                    Object.addScript(item, function onUpdateChildren() { this.inspector.expand(this); });
                },
        createItem: function createItem(obj, property) {
                    var value = obj[property];
                    var item = {data: value, inspector: this, name: property, parent: obj};
                    this.addChildrenTo(item);
                    this.decorate(item);
                    Object.addScript(item, function onSelect(tree) { this.inspector.select(this, tree); });
                    Object.addScript(item, function onUpdate() {
                        this.inspector.decorate(this);''
                    });
                    return item;
                },
        createAccessorItem: function createAccessorItem(obj, property) {
                    var item = {data: obj, inspector: this, name: property};
                    this.decorate(item);
                    Object.addScript(item, function onSelect(tree) { this.inspector.select(this, tree); });
                    Object.addScript(item, function onUpdate() {
                        this.inspector.decorate(this);''
                    });
                    return item;
                },
        createPrototypeItem: function createPrototypeItem(proto, parentItem) {
                    var item = {data: proto, inspector: this, name: " ", doNotSerialize: ["data"], parentItem: parentItem};
                    item.description = "inherited from " + this.prototypename(proto);
                    this.addChildrenTo(item);
                    Object.addScript(item, function onUpdate() {
                        this.description = "inherited from " + this.inspector.prototypename(this.data);
                    });
                    return item;
                },
        decorate: function decorate(item) {
                    item.description = this.describe(item.data);
                },
        describe: function describe(obj) {
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
                    return str;
                },
        displayString: function displayString(o) {
                    var n = Object.prototype.toString.call(o).split(' ')[1]; 
                    n = n.substr(0, n.length - 1);
                    switch(n.valueOf()) {
                        case 'Null':
                            return 'null';
                        case 'Undefined':
                            return 'undefined';
                        case 'String':
                        case 'Array':
                            return Strings.print(o);
                        case 'Function':
                            return Function.prototype.toString.call(o); 
                        case 'Object':
                            //We should try to be more specific
                            var c = o.constructor;
                            if(typeof c == 'function' &&
                                o instanceof c &&
                                Object.getPrototypeOf(o) === c.prototype) {
                                
                                if(c.type && typeof c.type.valueOf() == 'string') {
                                    n = c.type;
                                }
                                else if(c.name && typeof c.name.valueOf() == 'string') {
                                    n = c.name;
                                }
                                return (n.startsWithVowel() ? 'an ' : 'a ') + n;
                            }
                            else {
                                debugger;
                                return 'an Object';
                            }    
                            break;
                        default:
                            return o.toString();
                    }
                },
        expand: function expand(item) {
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
                    var props = [], visitedProps = [], accessors = {};debugger;
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
                    var valueProto = Object.getPrototypeOf(value);
                    var proto = valueProto;
                    while(proto) {
                        Properties.allOwnPropertiesOrFunctions(proto, filter).each(function(prop) {
                            if(!visitedProps.include(prop)) {
                                visitedProps.push(prop);
                                var descr = Object.getOwnPropertyDescriptor(proto, prop);
                                if((!descr || !descr.get) && value[prop] !== proto[prop]) {
                                    props.push(prop);
                                    if(descr.set) {
                                        accessors["set " + prop] = descr.set;
                                        props.push("set " + prop);
                                    }
                                }
                            }
                        });
                        proto = Object.getPrototypeOf(proto);
                    }
                    if (props.length > 1) props = props.sort();
                    var newChildren = [];
                    if(Array.isArray(value) || typeof value.valueOf() == 'string') {
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
                    if (valueProto) {
                        var existing = item.children.detect(function(i) { return i.data === valueProto && i.parentItem; });
                        if (existing) {
                            newChildren.push(existing);
                        } else {
                            newChildren.push(this.createPrototypeItem(valueProto, item));
                        }
                    }
                    if(newChildren.length == 0) {
                        delete item.children;
                        delete item.onExpand;
                        delete item.onUpdateChildren;
                    }
                    else {
                        item.children = newChildren;
                    }
                },
        expandIndexedChildren: function expandIndexedChildren(item, children) {
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
                            Object.addScript(rangeItem, function onSelect(tree) { this.inspector.select(this, tree); });
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
        expandRange: function expandRange(item) {
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
        getFilter: function getFilter() {
                    if (!this.filter) {
                        this.setFilter(this.get("ObjectInspectorFilterList").getSelectedItem());
                    }
                    return this.filter;
                },
        inspect: function inspect(obj) {
                    if (this.owner.isWindow) {
                        this.owner.setTitle(this.typename(obj) + ' Inspector');
                    }
                    this.get("ObjectInspectorText").doitContext = obj;
                    if (!this.filter) this.get("ObjectInspectorFilterList").selectAt(0);
                    this.tree = this.get("ObjectInspectorTree");
                    this.tree.setItem(this.createItem({"this": obj}, "this"));
//                    this.startStepping(500, 'update');
                },
        onWindowGetsFocus: function onWindowGetsFocus() {
                    this.get('ObjectInspectorText').focus();
                },
        prototypename: function prototypename(proto) {
                    var protoName = proto.constructor.type || proto.constructor.name;
                    if(protoName) {
                        return protoName + '.prototype';
                    }
                    return proto.toString();
                },
        reset: function reset() {
                    if (this.owner.isWindow) {
                        this.owner.setTitle("ObjectInspector");
                    }
                    this.get("ObjectInspectorText").textString = "";
                    this.get("ObjectInspectorText").doitContext = null;
                    this.stopStepping();
                    this.get("ObjectInspectorTree").reset();
                    this.get("ObjectInspectorFilterList").setList([
                        {isListItem: true,
                            string: "show standard properties",
                            value: "standard"},
                        {isListItem:true, 
                            string:"show all properties", 
                            value: "properties"},
                        {isListItem:true, 
                            string:"show morphs", 
                            value: "submorphs"}]);
                    this.get("ObjectInspectorFilterList").selectAt(0);
                    this.applyLayout();
                },
        select: function select(item, tree) {
                    if(item.name != 'this' && this.get("BindThisToSelection").checked) {    
                        this.get("ObjectInspectorText").doitContext = item.data;
                    }; 
                    this.get("ObjectInspectorText").textString = this.displayString(item.data);
                },
        setDoItContext: function setDoItContext(bindThisToSelection) {
                    if(bindThisToSelection) {
                        var selectedTree = this.tree.withAllTreesDetect(function(t) {return t.item.isSelected});
                        if (selectedTree) {
                            this.get("ObjectInspectorText").doitContext = selectedTree.item.data;
                        }
                    } else {
                        this.get("ObjectInspectorText").doitContext = this.tree.getRootTree().item.data;
                    }
                },
        setFilter: function setFilter(str) {
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
                    this.tree.layoutAfter(function() { that.update(); });
                },
        typename: function typename(o) {
                    var n = Object.prototype.toString.call(o).split(' ')[1]; 
                    n = n.substr(0, n.length - 1);
                    switch(n.valueOf()) {
                        case 'Function':
                            if(o.prototype instanceof o && o.prototype.constructor === o)  {
                                if(o.type && typeof o.type.valueOf() == 'string') {
                                    return o.type + ' constructor';
                                }
                                else if(o.name && typeof o.name.valueOf() == 'string') {
                                    return o.name + ' constructor';
                                }
                            }
                            return n;
                        case 'Object':
                            //We should try to be more specific
                            var c = o.constructor;
                            if(typeof c == 'function' &&
                                o instanceof c &&
                                Object.getPrototypeOf(o) === c.prototype) {
                                
                                if(c.type && typeof c.type.valueOf() == 'string') {
                                    return c.type + (c.prototype === o ? ' prototype' : '');
                                }
                                else if(c.name && typeof c.name.valueOf() == 'string') {
                                    return c.name + (c.prototype === o ? ' prototype' : '');
                                }
                            }
                            else {
                                debugger;
                            }    
                        default:
                            return n;
                    }
                },
        update: function update() {
                    if (this.tree.item) this.tree.update();
                }
    }],
    titleBar: "ObjectInspector",
    inspect: function inspect(obj) {
    this.get('ObjectInspector').inspect(obj);
},
    reset: function reset() {
    // this.partsBinMetaInfo = that.getPartsBinMetaInfo()
}
});

}) // end of module