module('lively.ide.tools.Inspector').requires('lively.persistence.BuildSpec', 'lively.morphic.Widgets', 'lively.ide.CodeEditor').toRun(function() {

lively.BuildSpec('lively.ide.tools.Inspector', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(449.2,540.4),
    _Position: lively.pt(741.0,27.0),
    cameForward: true,
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
        _Extent: lively.pt(430.3,504.6),
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
                layout: {},
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
            layout: {},
            morphRefId: 2,
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _ClipMode: "auto",
                _Extent: lively.pt(322.0,21.0),
                _Fill: Color.rgb(243,243,243),
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
                    string: "show functions",
                    value: "functions"
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
                _InputAllowed: true,
                _MaxTextWidth: 84,
                _MinTextWidth: 84,
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
            _BorderColor: Color.gray,
            _BorderWidth: 1,
            _BorderRadius: 3,
            _Extent: lively.pt(424.0,143.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(8.1,360.6),
            _Scale: 0.9803921568627452,
            _ShowActiveLine: false,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _SoftTabs: true,
            _StyleClassNames: ["Morph","CodeEditor","ace_editor","emacs-mode","ace_nobold","ace-chrome"],
            _TextMode: "javascript",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
            doitContext: null,
            droppingEnabled: true,
            hasRobertsKeys: true,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "ObjectInspectorText",
            sourceModule: "lively.ide.CodeEditor",
            submorphs: [],
            textMode: "javascript",
            textString: "this"
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
                moveVertical: false,
                resizeHeight: false,
                resizeWidth: true
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
        }],
        tree: {
            isMorphRef: true,
            name: "ObjectInspectorTree"
        },
        updateFilter: "standard",
        createItem: function createItem(obj, property, isRoot) {
        var value = obj[property];
        var item = {data: value, inspector: this, parent: obj};
        if (!isRoot) item.name = property;
        item.description = this.describe(value);
        Object.addScript(item, function onSelect(tree) { this.inspector.select(this, tree); });
        if (!this.isPrimitive(value)) {
            item.children = [];
            Object.addScript(item, function onExpand() { this.inspector.expand(this); });
            Object.addScript(item, function onUpdateChildren() { this.inspector.expand(this); });
        }
        Object.addScript(item, function onUpdate() {
            this.description = this.inspector.describe(this.data);
        });
        return item;
    },
        createPrototypeItem: function createPrototypeItem(proto) {
        var that = this;
        var item = {data: proto, inspector: this, doNotSerialize: ["data"]};
        item.name = " ";
        item.description = "inherited from " + this.typename(proto);
        item.children = [];
        Object.addScript(item, function onExpand() { this.inspector.expand(this); });
        Object.addScript(item, function onUpdateChildren() { this.inspector.expand(this); });
        Object.addScript(item, function onUpdate() {
            this.description = "inherited from " + this.inspector.typename(this.data);
        });
        return item;
    },
        describe: function describe(obj) {
        var str;
        if (obj && obj.name) {
            str = Object.isFunction(obj.name) ? obj.name() : obj.name;
        }
        if (!str) str = Objects.shortPrintStringOf(obj);
        if (str.length > 32) str = str.substring(0, 36) + '...';
        return str;
    },
        expand: function expand(item) {
        var props = Properties.allProperties(item.data, this.getFilter());
        if (!Object.isArray(item.data)) props = props.sort();
        var newChildren = [];
        var lookup = {};
        item.children.each(function(i) { lookup[i.name] = i; });
        props.each(function(prop) {
            var existing = lookup[prop];
            if (existing) {
                existing.data = item.data[prop];
                newChildren.push(existing);
            } else {
                newChildren.push(this.createItem(item.data, prop));
            }
        }, this);
        var proto = !Object.isFunction(item.data) &&
                    !this.isPrimitive(item.data) &&
                    Object.getPrototypeOf(item.data);
        if (proto) {
            var existing = item.children.detect(function(i) { return i.data === proto; });
            if (existing) {
                newChildren.push(existing);
            } else {
                newChildren.push(this.createPrototypeItem(proto));
            }
        }
        item.children = newChildren;
    },
        getFilter: function getFilter() {
        if (!this.filter) {
            this.setFilter(this.get("ObjectInspectorFilterList").getSelectedItem());
        }
        return this.filter;
    },
        inspect: function inspect(obj) {
        if (this.owner.isWindow) {
            this.owner.setTitle(this.describe(obj));
        }
        this.get("ObjectInspectorText").doitContext = obj;
        if (!this.filter) this.get("ObjectInspectorFilterList").selectAt(0);
        this.tree = this.get("ObjectInspectorTree");
        this.tree.setItem(this.createItem({"": obj}, "", true));
        this.startStepping(500, 'update');
    },
        isPrimitive: function isPrimitive(value) {
        return value === null ||
               value === undefined ||
               Object.isString(value) ||
               Object.isNumber(value) ||
               Object.isBoolean(value);
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('ObjectInspectorText').focus();
    },
        reset: function reset() {
        if (this.owner.isWindow) {
            this.owner.setTitle("ObjectInspector");
        }
        this.get("ObjectInspectorText").textString = "this";
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
                string:"show functions", 
                value: "functions"},
            {isListItem:true, 
                string:"show morphs", 
                value: "submorphs"}]);
        this.get("ObjectInspectorFilterList").selectAt(0);
        this.applyLayout();
    },
        select: function select(item, tree) {
        if (item.data !== null && item.data !== undefined) {
            this.get("ObjectInspectorText").doitContext = item.data;
        }
        if (Object.isString(item.data) ||
            Object.isNumber(item.data) ||
            Object.isBoolean(item.data)) {
            Object.addScript(item, function onEdit(str) {
                var val = str;
                if (val === "null") val = null;
                if (val === "true") val = true;
                if (val === "false") val = false;
                if (Object.isString(val) && val.match(/^\d+$/)) val = parseInt(val);
                this.parent[this.name] = val;
            });
            tree.editDescription();
        }
    },
        setFilter: function setFilter(str) {
        var startsAlphaNum = /^[a-zA-Z0-9]/;
        var fn = {
            standard: function(obj, prop) {
                return obj.hasOwnProperty(prop) &&
                    startsAlphaNum.test(prop) &&
                    !Object.isFunction(obj[prop]);
            },
            properties: function(obj, prop) {
                return obj.hasOwnProperty(prop) &&
                    !Object.isFunction(obj[prop]);
            },
            functions: function(obj, prop) {
                return obj.hasOwnProperty(prop) &&
                    Object.isFunction(obj[prop]);
            },
            submorphs: function(obj, prop) {
                return obj.hasOwnProperty(prop) &&
                    (prop == 'submorphs' || obj[prop] instanceof lively.morphic.Morph);
            },
        };
        this.filter = fn[str];
        var that = this;
        this.tree.layoutAfter(function() { that.update(); });
    },
        typename: function typename(proto) {
        return proto.constructor.type || proto.constructor.name || proto.toString();
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