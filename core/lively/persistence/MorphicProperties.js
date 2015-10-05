module('lively.persistence.MorphicProperties').requires().toRun(function() {

var knownProperties = {

  "lively.morphic.Morph": {
    "name":            {name: "name",            getter: "getName",           setter: "setName",            type: "String"},
    "position":        {name: "position",        getter: "getPosition",       setter: "setPosition",        type: "lively.Point", scrubbingFactor: 10},
    "rotation":        {name: "rotation",        getter: "getRotation",       setter: "setRotation",        type: "Number",       scrubbingFactor: 0.1},
    "scale":           {name: "scale",           getter: "getScale",          setter: "setScale",           type: "Number",       scrubbingFactor: 0.1},
    "extent":          {name: "extent",          getter: "getExtent",         setter: "setExtent",          type: "lively.Point", scrubbingFactor: 10},
    "origin":          {name: "origin",          getter: "getOrigin",         setter: "setOrigin",          type: "lively.Point", scrubbingFactor: 1, highlightWhenUpdated: true, },
    "fill":            {name: "fill",            getter: "getFill",           setter: "setFill",            type: "Color"},
    "visible":         {name: "visible",         getter: "isVisible",         setter: "setVisible",         type: "Boolean"},
    "grabbingEnabled": {name: "grabbingEnabled", getter: "isGrabbingEnabled", setter: "setGrabbingEnabled", type: "Boolean"},
    "draggingEnabled": {name: "draggingEnabled", getter: "isDraggingEnabled", setter: "setDraggingEnabled", type: "Boolean"},
    "droppingEnabled": {name: "droppingEnabled", getter: "isDroppingEnabled", setter: "setDroppingEnabled", type: "Boolean"}
  },

  "lively.morphic.Image": {
    "imageURL": {name: "imageURL", getter: "getImageURL", setter: "setImageURL", type: "String"}
  },

  "lively.morphic.Text": {
    "textString": {name: "textString", getter: "getTextString", setter: "setTextString", type: "String"}
  },

  "lively.morphic.Slider": {
    "value":         {name: "value",        getter: "getValue",        setter: "setValue",         scrubbingFactor: 0.1, type: "Number"},
    "sliderExtent":  {name: "sliderExtent", getter: "getSliderExtent", setter: "setSliderExtent",  scrubbingFactor: 0.1, type: "Number"},
    "valueScale":    {name: "valueScale",   getter: "getValueScale",   setter: "setValueScale",    scrubbingFactor: 0.1, type: "Number"}
  },

  "lively.morphic.Button": {
    "label":         {name: "label", getter: "getLabel", setter: "setLabel", type: "String"}
  },

  "lively.morphic.List": {
    "list":          {name: "list",          getter: "getList",          setter: "setList",          type: "Array"},
    "selection":     {name: "selection",     getter: "getSelection",     setter: "setSelection",     type: "Object"},
    "selectedIndex": {name: "selectedIndex", getter: "getSelectedIndex", setter: "setSelectedIndex", scrubbingFactor: 1, type: "Number"}
  }
}

Object.subclass("lively.morphic.Property",
"initializing", {

  isProperty: true,
  target: null,
  name: null,
  type: "",

  initialize: function(propertyTarget, propSpec) {
    // propSpec should define at least "name" and "type" and can also have
    // "getter" and "setter"
    this.target = propertyTarget;
    lively.lang.obj.extend(this, propSpec);
  }

},
"helper", {

  printObj: function(obj) {
    return lively.lang.obj.inspect(obj, {maxDepth: 1}).replace(/^lively\./, "");
  }

},
"interface", {

  print: function(printValue) {
    printValue = printValue === undefined ? true : printValue;
    return [
      [this.name, {cssClasses: ["draggable-tile", "getter"]}],
      [" = ", {cssClasses: ["draggable-tile", "setter"]}],
      [printValue ? this.printObj(this.value) : ""]
    ];
  },

  setterExpr: function(args) {
    if (args === undefined || args === null) args = [this.target.getObject()[this.getter]()];
    args = Array.isArray(args) ? args.map(this.printObj.bind(this)).join(", ") : String(args);
    return lively.lang.string.format("%s(%s)", this.setter, args);
  },

  getterExpr: function() {
    return lively.lang.string.format("%s()", this.getter);
  },

  get value() {
    return this.getter ?
      this.target.getObject()[this.getter]() : this.target.getObject()[this.name];
  },

  set value(val) {
    return this.setter ?
      this.target.getObject()[this.setter](val) :
      (this.target.getObject()[this.name] = val);
  },

  get string() {
    var printed = this.print(true);
    return typeof printed === "string" ?
      printed : printed.pluck(0).join("");
  }

});

Object.extend(lively.morphic.Property, {

  propertyFor: function(morph, propName, refExpr) {
    var prop = lively.lang.obj.merge(lively.lang.obj.values(knownProperties))[propName]
    var target = new lively.morphic.PropertyTarget(morph);
    if (refExpr) target.addOptions({referenceExpression: refExpr});
    return prop ? new lively.morphic.Property(target, prop) : null;
  },

  allKnownPropertiesForKlass: function(object, klass, refExpr) {
    var name = klass.type || klass.name;
    return {
      name: name,
      type: "class",
      properties: Object.keys(knownProperties[name] || {})
        .map(function(propName) {
          return lively.morphic.Property.propertyFor(object, propName, refExpr);
        })
    }
  },

  allKnownPropertiesForObject: function(obj, refExpr) {
    // if (refExpr) target.options.referenceExpression = refExpr;
    return {
      name: obj.name || String(obj),
      type: "object",
      properties: []
        // lively.lang.properties.forEachOwn(obj, function(name, prop) {
        //   return typeof prop === 'function' || name.startsWith("_") ?
        //     null :
        //     new lively.morphic.Property(obj, {name: name, type: "Object"})
        // }).compact()
    };
  },

  allKnownPropertiesByTypeFor: function(object, refExpr) {
    if (!(object instanceof lively.morphic.Morph)) return [];
    var self = lively.morphic.Property;
    return ([object.constructor].concat(object.constructor.superclasses())).uniq()
      .map(function(klass) { return self.allKnownPropertiesForKlass(object, klass, refExpr); })
      .concat([self.allKnownPropertiesForObject(object)])
      .filter(function(ea) { return ea.properties && ea.properties.length; });
  },

  allKnownPropertiesFor: function(object, refExpr) {
    return lively.morphic.Property.allKnownPropertiesByTypeFor(object, refExpr)
      .pluck("properties").flatten();
  }

});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

var knownMethods = {

  "lively.morphic.Morph": {
    "show":        {name: "show",        args:  []},
    "moveBy":      {name: "moveBy",      args:  [pt(10, 3)]},
    "rotateBy":    {name: "rotateBy",    args:  [.2]},
    "openInWorld": {name: "openInWorld", args:  []},
    "remove":      {name: "remove",      args:  []},
  },

  "lively.morphic.Button": {
    "doAction": {name: "doAction", args:  []}
  },

  "lively.morphic.Slider": {
    "onValueChange": {name: "onValueChange", args:  [{name: "newValue", type: "Number"}, {name: "oldValue", type: "Number"}]}
  },

  "lively.morphic.List": {
    "onSelectionChange": {name: "onSelectionChange", args:  [{name: "newSel", type: "Object"}, {name: "oldSel", type: "Object"}]}
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  "lively.Point": {
    "addPt":      {name: "addPt",      args: [pt(2,3)]},
    "subPt":      {name: "subPt",      args: [pt(2,3)]},
    "scaleBy":    {name: "scaleBy",    args: [2]},
    "inverted":   {name: "inverted",   args: []},
    "equals":     {name: "equals",     args: [pt(2,3)]},
    "minPt":      {name: "minPt",      args: [pt(10,10)]},
    "maxPt":      {name: "maxPt",      args: [pt(10,10)]},
    "normalized": {name: "normalized", args: []},
    "dotProduct": {name: "dotProduct", args: [pt(2,3)]},
    "dist":       {name: "dist",       args: [pt(10,10)]},
    "extent":     {name: "extent",     args: [pt(20,30)]},
    "r":          {name: "r",          args: []},
    "theta":      {name: "theta",      args: []}
  },
};

lively.morphic.Property.subclass("lively.morphic.Method",
"initializing", {
  isProperty: false,
  isMethod: true,
  args: [],
},
"interface", {

  setArgs: function(args) { return  this.args = args; },

  printArg: function(arg) {
    var isArgSpec = Object.isObject(arg) && arg.name && arg.type;
    return isArgSpec ? arg.name : this.printObj(arg);
  },

  printReceiver: function() {
    return this.target.referenceExpression();
  },

  printWithArgs: function(args) {
    var argsPrinted = (args || this.args).map(this.printArg.bind(this)).join(", ");
    var string = this.name + "(" + argsPrinted + ")";
    return [[string, {cssClasses: ["draggable-tile"]}]];
  },

  printWithArgsAndReceiver: function(args) {
    return [[this.target.referenceExpression(), {}], [".", {}]].concat(this.printWithArgs(args));
  },

  printWithReceiver: function() {
    return [[this.target.referenceExpression(), {}], [".", {}]].concat(this.print());
  },

  print: function() {
    return [[this.name, {cssClasses: ["draggable-tile"]}]];
  },

  run: function() {
    return this.target.getObject()[this.name].apply(this.target.getObject(), this.args);
  }

});

Object.extend(lively.morphic.Method, {

  methodFor: function(morph, name, args, refExpr) {
    var target = new lively.morphic.PropertyTarget(morph);
    if (refExpr) target.addOptions({referenceExpression: refExpr});
    return new lively.morphic.Method(target, {args: args || [], name: name});
  },

  allKnownMethodsForKlass: function(object, klass, refExpr) {
    // lively.debugNextMethodCall(lively.morphic.Method, "allKnownMethodsForKlass");
    // lively.morphic.Method.allKnownMethodsForKlass(pt(01,1), lively.Point)
    // lively.morphic.Method.allKnownMethodsByTypeFor(pt(01,1))
    // knownMethods
    var name = klass.type || klass.name;
    return {
      name: name,
      type: "class",
      methods: lively.lang.obj.values(knownMethods[name] || {})
        .map(function(methodSpec) {
          var target = new lively.morphic.PropertyTarget(object);
          if (refExpr) target.addOptions({referenceExpression: refExpr});
          return new lively.morphic.Method(target, methodSpec);
        })
    }
  },

  allKnownMethodsForObject: function(obj, refExpr) {
    // if (refExpr) target.options.referenceExpression = refExpr;
    return {
      name: obj.name || String(obj),
      type: "object",
      methods: []
    };
  },

  allKnownMethodsByTypeFor: function(object, refExpr) {
    var self = lively.morphic.Method;
    return ([object.constructor].concat(object.constructor.superclasses())).uniq()
      .map(function(klass) { return self.allKnownMethodsForKlass(object, klass, refExpr); })
      .concat([self.allKnownMethodsForObject(object, refExpr)])
      .filter(function(ea) { return ea.methods && ea.methods.length; });
  }

});

Object.subclass("lively.morphic.PropertyTarget",
"initializing", {
  
  isReference: true,
  object: null,
  options: {referenceExpression: null},

  initialize: function(object, options) {
    this.object = object;
    if (options) this.options = options;
  },

},
"accessing", {

  getObject: function() { return this.object; },
  setObject: function(object) { return this.object = object; },
  defaultOptions: function() { return this.constructor.prototype.options; },
  getOptions: function() { return lively.lang.obj.clone(this.options); },
  setOptions: function(options) { return this.options = options; },
  addOptions: function(options) {
    return this.options = lively.lang.obj.merge(this.options, options);
  }

},
"code generation", {
  
  referenceExpression: function(options) {
    options  = lively.lang.obj.merge(this.options, options);
    var refExpr = "unknownObject";
    if (options.referenceExpression) {
      refExpr = options.referenceExpression;
    } else if (this.object.generateReferenceExpression) {
      refExpr = this.object.generateReferenceExpression({fromMorph: options.context});
    } else if (this.object.serializeExpr) {
      refExpr = this.object.serializeExpr().replace(/^lively\./, "");
    }
    return refExpr;
  }

});

}) // end of module
