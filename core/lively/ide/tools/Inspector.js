module('lively.ide.tools.Inspector').requires('lively.persistence.BuildSpec', 'lively.morphic.Widgets', 'lively.ide.CodeEditor').toRun(function() {

lively.BuildSpec('lively.ide.tools.Inspector', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(449.2,532.4),
    _Position: lively.pt(983.4,26.8),
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
        _Extent: lively.pt(430.3,496.6),
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
            _Extent: lively.pt(414.0,309.4),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(8.1,41.2),
            className: "lively.morphic.Box",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            layout: {
                resizeHeight: false,
                resizeWidth: true
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
                    scaleVertical: true,
                    scaleHorizontal: true
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
            _Extent: lively.pt(414.0,28.1),
            _Position: lively.pt(8.1,8.1),
            className: "lively.morphic.Morph",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            droppingEnabled: true,
            isCopyMorphRef: true,
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
            _Extent: lively.pt(422.0,107.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(8.1,360.6),
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
                scaleVertical: true,
                scaleHorizontal: true
            },
            name: "ObjectInspectorText",
            sourceModule: "lively.ide.CodeEditor",
            storedString: "",
            submorphs: [],
            textMode: "javascript",
            theme: ""
        },{
            _BorderColor: Color.rgb(204,0,0),
            _Extent: lively.pt(414.7,4.0),
            _Fill: Color.rgb(204,204,204),
            _Position: lively.pt(8.1,352.6),
            className: "lively.morphic.HorizontalDivider",
            doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
            draggingEnabled: true,
            droppingEnabled: true,
            fixed: [],
            layout: {
                scaleVertical: true,
                scaleHorizontal: true
            },
            minHeight: 20,
            oldPoint: lively.pt(1484.0,411.0),
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
            _Position: lively.pt(9.3,473.6),
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
            setChecked: function setChecked(bool) {
//                            var wasSelected = $super(bool);
//                            if (!wasSelected) {
//                                this.get("ObjectInspectorText").doitContext = this.item.data;
//                            }
                        }
        },{
            _Extent: lively.pt(193.0,23.4),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 10,
            _HandStyle: "default",
            _InputAllowed: false,
            _MaxTextWidth: 120.695652,
            _MinTextWidth: 120.695652,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(30.1,468.1),
            _Scale: 0.9803921568627452,
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
                item.children = [];
                Object.addScript(item, function onExpand() { this.inspector.expand(this); });
                Object.addScript(item, function onUpdateChildren() { this.inspector.expand(this); });
            },
        createItem: function createItem(obj, property) {
                var value = obj[property];
                var item = {data: value, inspector: this, parent: obj};
                if(value !== null && value !== undefined && 
                  (typeof value.valueOf() != 'string' || value.length != 1 || property == 'this' || typeof obj.valueOf() != 'string')) {
                    this.addChildrenTo(item);
                }
                item.name = property;
                this.decorate(item);
                Object.addScript(item, function onSelect(tree) { this.inspector.select(this, tree); });
                Object.addScript(item, function onUpdate() {
                    this.inspector.decorate(this);''
                });
                return item;
            },
        createPrototypeItem: function createPrototypeItem(proto, parentItem) {
                var item = {data: proto, inspector: this, doNotSerialize: ["data"], parentItem: parentItem};
                item.name = " ";
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
                    str = obj.name;
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
                            
                            if(c.type instanceof String && c === eval(c.type)) {
                                n = c.type;
                            }
                            else if(c.name instanceof String && c === eval(c.name)) {
                                n = c.name;
                            }
                            return (n.startsWithVowel() ? 'an' : 'a ') + n;
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
                var props = Properties.allOwnPropertiesOrFunctions(value, filter);
                var visitedProps = [];
                var valueProto = Object.getPrototypeOf(value);
                var proto = valueProto;
                while(proto) {
                    var inherited = Properties.allOwnPropertiesOrFunctions(proto, filter);
                    inherited.each(function(prop) {
                        if(!visitedProps.include(prop)) {
                            visitedProps.push(prop);
                            if(!props.include(prop) && value[prop] !== proto[prop]) {
                                props.push(prop);
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
                    if (existingIndex > -1) {
                        var existing = lookupValues.at(existingIndex);
                        existing.data = value[prop];
                        this.decorate(existing);
                        newChildren.push(existing);
                    } else {
                        newChildren.push(this.createItem(value, prop));
                    }
                }, this);
                if (valueProto && visitedProps.intersect(props).length > 0) {
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
                    var name = '' + i * 100 + '..' + (i * 100 + end + 1);
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
                        var existing = item.children[i + start];
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
                this.startStepping(500, 'update');
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
                }; debugger; 
                this.get("ObjectInspectorText").textString = this.displayString(item.data);
                if (item.name != 'this') {
                    Object.addScript(item, function onEdit(str) {
                        if(Object.isString(str)) {
                            var interactiveEval = function() { return eval('use strict; ' + str) };
                            var ctx = this.inspector.get("ObjectInspectorText").doitContext;
                            try {this.parent[this.name] = interactiveEval.call(ctx);} catch(e) {}
                            var that = this.inspector;
                            that.layoutAfter(function() { that.update(); });
                        }
                    });
                }
            },
        setFilter: function setFilter(str) {
                var startsAlphaNum = /^[a-zA-Z0-9]/;
                var fn = {
                    standard: function(obj, prop) {
                        if(Array.isArray(obj) || typeof obj.valueOf() == 'string') {
                            var asInt = 0 | prop;
                            if(asInt == prop  && asInt < obj.length && asInt >= 0) {
                                return false;
                            }
                        }
                        return startsAlphaNum.test(prop) &&
                            obj.propertyIsEnumerable(prop);
                    },
                    properties: function(obj, prop) {
                        if(Array.isArray(obj) || typeof obj.valueOf() == 'string') {
                            var asInt = 0 | prop;
                            if(asInt == prop  && asInt < obj.length && asInt >= 0) {
                                return false;
                            }
                        }
                        return true;
                    },
                    submorphs: function(obj, prop) {
                        if(Array.isArray(obj)) {
                            var asInt = 0 | prop;
                            if(asInt == prop  && asInt < obj.length && asInt >= 0) {
                                return false;
                            }
                        }
                        return prop == 'submorphs' || 
                            obj[prop] instanceof lively.morphic.Morph;
                    },
                };
                this.filter = fn[str];
                if(this.tree.item && !this.tree.item.children) {
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
                            if(o.type instanceof String && o === eval(o.type)) {
                                return o.type + ' constructor';
                            }
                            else if(o.name instanceof String && o === eval(o.name)) {
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
                            
                            if(c.type instanceof String && c === eval(c.type)) {
                                return c.type + (c.prototype === o ? ' prototype' : '');
                            }
                            else if(c.name instanceof String && c === eval(c.name)) {
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