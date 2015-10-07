module('lively.morphic.DraggableJavaScript').requires('lively.morphic.Core', 'lively.morphic.Scrubbing', 'lively.persistence.MorphicProperties', "lively.morphic.ColorChooserDraft", 'lively.ast').toRun(function() {

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// An interface to draggable JavaScript
// In here are the following abstractions:
// 
// - DropJS: an object that encapsulates a piece of code or an instance of
//   lively.morphic.Property or lively.morphic.Method. Based on options passed to
//   it, it can generate different versions of source code, e.g. for a method code
//   with/out the receiver, with/out call, with/out args etc.
// 
// - DroppableDocument: Manages the process of hovering with a DragItem over a
//   codeeditor (which has a DropJS instance), finding an insertion point for the
//   dropjs, inserting it there and also reverting the editor if needed. It has
//   access to the code of the editor and will be able to find the closest insertion
//   point, based on where the hand is and what code point is suitable for a
//   specific dropjs instance
//
// - Tile trait: Trait for morphs to make them tiles. Tiles are generators of drag
//   items. Tiles have a dropjs instance. Maybe we will have tiles that will have
//   multiple dropjs objects.
// 
// - DragItem trait: For morphs to make them into something the hand can grab.
//   Drag items encapsulate a dropjs instance and initiate the code insertion/drop
//   process that involves code editors wrapped by DroppableDocuments and their
//   dropjs object
// 
// - TileCreator: Not public. Factory for tile morphs. Knows how to setup
//   scrubbing fields etc.
// 
// - DraggableJavaScript interface. Main interface for the outside world to create
//   tiles and drag items.
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-


Object.subclass("lively.morphic.DraggableJavaScript.DropJS",
"initializing", {

  options: {},
  subject: null,
  code: null,
  node: null,

  // options
  // set,get,args,addReceiver,context,dontCall,replacements,at,addArgument,ast

  clone: function() {
    var cloned = new this.constructor();
    lively.lang.obj.extend(cloned, {
      subject: this.subject, code: this.code, node: this.node});
    cloned.options = lively.lang.obj.merge({}, cloned.options);
    return cloned;
  }

},
"ast helpers", {

  getAst: function(options) {
    return lively.ast.fuzzyParse(this.getCode(options), {addIndex: true});
  },

  getNode: function(options) { return this.getAst(options).body[0]; },

  isStatement: function(options) {
    var type = this.getNode(options).type;
    return type !== "ExpressionStatement";
  },

  isExpression: function(options) { return !this.isStatement(options); },

  isArgument: function(options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options
    return (!this.subject || typeof this.subject === "string" || (this.subject.isProperty && !options.set))
        && this.isExpression();
  }

},
"code generation", {

  getCode: function(options) {
    return this.generateCode(options);
  },

  generateError: function(msg) {
    return lively.lang.string.format("new Error('%s')", msg);
  },

  generatePropertyCode: function(prop, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options
    var code;
    if (options.get) code = prop.getterExpr();
    else if (options.set) code = prop.setterExpr(options.args);
    else return this.generateError('dropjs cannot generate code from property ' + prop.name + '!');

    if (options.addReceiver) {
      var targetOpts = lively.lang.obj.merge(options, {fromMorph: options.context}),
          refExpr = prop.target.referenceExpression(targetOpts);
      code = refExpr + "." + code;
    }
    return code;
  },

  generateMethodCode: function(prop, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options
    var code = prop[options.dontCall ? "print" : "printWithArgs"]().pluck(0).join("");
    if (options.addReceiver) {
      var targetOpts = lively.lang.obj.merge(options, {fromMorph: options.context}),
          refExpr = prop.target.referenceExpression(targetOpts);
      code = refExpr + "." + code;
    }
    return code;
  },

  replaceNodes: function(originalCode, nodesAndReplacements) {
    // nodesAndReplacements = [[node, code], ...]
      return lively.lang.interval.sort(
        nodesAndReplacements.map(function(nodeAndReplacement) {
          var node = nodeAndReplacement[0],
              code = nodeAndReplacement[1];
          return [node.start, node.end, code];
        }))
        .reverse()
        .reduce(function(replacedCode, repl) {
          return replacedCode.slice(0, repl[0]) + repl[2] + replacedCode.slice(repl[1]);
        }, originalCode);

  },

  generateReferenceCode: function(reference, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options
    // else return this.generateError('dropjs cannot generate code from property ' + prop.name + '!');
    return reference.referenceExpression(
      lively.lang.obj.merge(options, {fromMorph: options.context}));
  },

  generateSnippetCode: function(codeString, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options;
    if (options.replacements) {
      var ast = lively.ast.fuzzyParse(codeString);
      codeString = this.replaceNodes(codeString, options.replacements.map(function(repl) {
          var path = lively.PropertyPath(repl.path.replace(/\[([^\]]+)\]/g, ".$1")),
              node = path.get(ast);
          return node ? [node, repl.code] : null;
        }).compact());
    }
    return codeString;
  },

  generateCode: function(options) {
    // options:
    //   for code: replacements: [{path: STRING, code: STRING}]
    //   for property: addReceiver, get, set, args, context
    //   for method: addReceiver, args, context, dontCall
    options = options ? lively.lang.obj.merge(this.options, options) : this.options;
    var subj = this.subject;
    if (!subj) return this.generateError("dropjs without subject!");
    if (typeof subj === 'string') return this.generateSnippetCode(subj, options);
    if (subj.isProperty) return this.generatePropertyCode(subj, options);
    if (subj.isMethod) return this.generateMethodCode(subj, options);
    if (subj.isReference) return this.generateReferenceCode(subj, options);
    return "new Error('dropjs with unknown subject " + subj + "!')";
  },

  insertAndGenerateCode: function(dropjs, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options;
    var replacementCode = dropjs.getCode(options),
        code = this.getCode(options),
        parsed = lively.ast.fuzzyParse(code, {addIndex: true}),
        nodesAtPos = lively.ast.nodesAt(options.at, parsed);

    var nodeToReplace = nodesAtPos.last();
    if (!nodeToReplace) {
      if (options.at > parsed.end) {
        var sep = code.match(/\n\s*$/) ? "" : "\n";
        code = code + sep + replacementCode;
      } else {
        var sep = code.match(/^\s*\n/) ? "" : "\n";
        code = replacementCode + sep + code;
      }
      return code;
    }

    var replacement;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    if (!dropjs.isExpression(options)) {
      // is statement, doesn't replace a node but needs insertion in body list
      var bodyIndex, bodyNode = nodesAtPos.clone().reverse()
        .detect(function(node, i) { bodyIndex = nodesAtPos.length - i; return !!node.body; });
      if (!bodyNode) return code;
      var nodeBefore = nodesAtPos[bodyIndex - 1];
      if (nodeBefore) {
        var sep = code.slice(0, nodeBefore.end).match(/\n\s*$/) ? "" : "\n";
        replacement = [[{start: nodeBefore.end, end: nodeBefore.end}, sep + replacementCode]];
      } else {
        replacement = [[{start: bodyNode.end, end: bodyNode.end}, replacementCode]];
      }
    }

    // insert as argument when options.addArgument == true and the node identified by
    if (!replacement && options.addArgument) {
      var call = nodesAtPos.detect(function(ea) { return ea.type === "CallExpression"; });
      var replaceIndex = nodesAtPos.indexOf(nodeToReplace);
      var callIndex = nodesAtPos.indexOf(call);
      if (callIndex === replaceIndex - 1) { // means nodeToReplace is an argument
        replacement = [[{start: nodeToReplace.end, end: nodeToReplace.end}, ", " + replacementCode]];
      }
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // inserting as a new argument to a call
    if (!replacement && nodeToReplace.type === "CallExpression" && options.at > nodeToReplace.callee.end) {
      var insertionIndex = nodeToReplace.callee.end + 1;
      replacement = [[{start: insertionIndex, end: insertionIndex}, replacementCode]];
    }

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // is replacement for existing node
    if (!replacement) {
      replacement = [[nodeToReplace, replacementCode]];
    }

    return this.replaceNodes(code, replacement);
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  findDropOperationsForStatement: function(dropjs, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options;
    var ast = options.ast || this.getAst(options);
    ast = ast.body.body ? ast.body : ast;
    var returnFound = false;

// show("%s %s", ast.body.length, ast.end)
    return ast.body.length ?
      lively.lang.arr.flatmap(ast.body, function(n) {
        if (returnFound) return [];
        var before = {at: n.start, type: "splice", as: "Statement", parentNodeIndex: ast.astIndex},
            after = {at: n.end, type: "splice", as: "Statement", parentNodeIndex: ast.astIndex};
        if (n.type === "ReturnStatement") returnFound = true;
        return returnFound ? [before] : [before, after];
      }) :
      [{at: ast.end-1, type: "splice", as: "Statement"}]
  },

// lively.debugNextMethodCall(lively.morphic.DraggableJavaScript.DropJS.prototype, "findDropOperationsForArgument")
  findDropOperationsForArgument: function(dropjs, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options;
    var ast = options.ast || this.getAst(options);
    var code = this.getCode(options);
    var ops = [];
    lively.ast.withMozillaAstDo(ast, null, function(next, node, _, depth, path) {
      if (node.type === "ReturnStatement") {
        ops.push(node.argument ?
          {type: "replace", as: "Argument", replaceNodeIndex: node.argument.astIndex} :
          {type: "insert", as: "Argument", parentNodeIndex: node.astIndex, property: "argument"});
      }
      if (node.type === "BinaryExpression") {
        ops.push(
          {type: "replace", as: "Argument", replaceNodeIndex: node.left.astIndex},
          {type: "replace", as: "Argument", replaceNodeIndex: node.right.astIndex});
      }
      if (node.type === "CallExpression" && path.slice(-5).include("body")) {
        if (node.arguments.length) {
          ops.pushAll(node.arguments.map(function(n) {
            return {type: "replace", as: "Argument", replaceNodeIndex: n.astIndex}
          }));
        } else {
          ops.push({at: code.slice(0,node.end).lastIndexOf(")"), type: "splice", as: "Argument", parentNodeIndex: node.astIndex});
        }
      }
      next();
    });
    return ops;
  },

  findDropOperations: function(dropjs, options) {
    options = options ? lively.lang.obj.merge(this.options, options) : this.options;
    var ast = options.ast || (options.ast = this.getAst(options));
    if (!ast.hasOwnProperty("astIndex")) lively.ast.acorn.walk.addAstIndex(ast);
    var ops = [];
    if (!options.dropType || options.dropType === "Statement")
      ops.pushAll(this.findDropOperationsForStatement(dropjs, options));
    if (!options.dropType || options.dropType === "Argument")
      ops.pushAll(this.findDropOperationsForArgument(dropjs, options));
    return ops;
  },

  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
  // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

  applyDropOp: function(dropjs, dropOp, options) {
    var ast = this.getAst(options);
    var code = this.getCode(options);
    var changes = [];

    if (dropOp.type === "splice") {
      var newCode = dropjs.getCode(options),
          codeBefore = code.slice(0, dropOp.at),
          codeAfter = code.slice(dropOp.at);

      if (dropOp.as === "Argument" && !codeBefore.match(/\(\s*$/)) {
        newCode = ", " + newCode;
      }

      if (dropOp.as === "Statement") {
        if (!codeBefore.match(/\n\s*$/)) newCode = "\n" + newCode;
        else if (!codeAfter.match(/^\s*\n/)) newCode = newCode + "\n";
      }

      changes.push({action: "insert", lines: newCode.split("\n"), start: dropOp.at, end: dropOp.at + newCode.length});
    } else if (dropOp.type === "replace") {
      var newCode = dropjs.getCode(options);
      var node = lively.ast.acorn.walk.findNodeByAstIndex(ast, dropOp.replaceNodeIndex, true);
      changes.push(
        {action: "remove", start: node.start, end: node.end,                   lines: code.slice(node.start, node.end).split("\n")},
        {action: "insert", start: node.start, end: dropOp.at + newCode.length, lines: newCode.split("\n")})
    }

    return changes;

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // if (dropOp.type === "splice") {
    //   var codeBefore = code.slice(0, dropOp.at),
    //       codeAfter = code.slice(dropOp.at);

    //   if (dropOp.as === "Argument" && !codeBefore.match(/\(\s*$/)) {
    //     newCode = ", " + newCode;
    //   }

    //   if (dropOp.as === "Statement") {
    //     if (!codeBefore.match(/\n\s*$/)) newCode = "\n" + newCode;
    //     else if (!codeAfter.match(/^\s*\n/)) newCode = newCode + "\n";
    //   }

    //   code = codeBefore + newCode + codeAfter;
    // } else if (dropOp.type === "replace") {
    //   var node = lively.ast.acorn.walk.findNodeByAstIndex(ast, dropOp.replaceNodeIndex, true);
    //   code = code.slice(0, node.start) + newCode + code.slice(node.end);
    // // } else if (dropOp.type === "insert") {
    // }
    // return code;

  },

});

Object.extend(lively.morphic.DraggableJavaScript.DropJS, {

  forProperty: function(prop, options) {
    // currently no difference...
    return lively.morphic.DraggableJavaScript.DropJS.forCode(prop, options);
  },

  forReference: function(ref, options) {
    return lively.morphic.DraggableJavaScript.DropJS.forCode(ref, options);
  },

  forCode: function(code, options) {
    return lively.lang.obj.extend(
      new lively.morphic.DraggableJavaScript.DropJS(),
      {subject: code, options: options || {}});
  },


});

Object.subclass("lively.morphic.DraggableJavaScript.DroppableDocument",
"initializing", {
  editor: null,
  originalContent: null,
  originalAst: null,

  initialize: function(editor) {
    this.editor = editor;
    this.originalContent = editor.textString;
    this.originalAst = editor.getSession().$ast;
    this.helperMorphs = [];
      // .lastInsert = {
      //   target: morphBelow,
      //   originalContent: morphBelow.textString,
      //   originalAst: morphBelow.getSession().$ast,
      //   droppingEnabled: morphBelow.droppingEnabled
      // }
  },

  removeHelpers: function() {
    this.helperMorphs.invoke("remove");
    this.helperMorphs.length = 0;
  },

  getExistingHelper: function(name) {
    var existing = this.helperMorphs.detect(function(ea) { return ea.name === name; });
    if (existing) return existing;
  },

  getHelperLabel: function(labelString, editor, pos) {
    var name = "label-" + labelString;
    var label = this.getExistingHelper(name);
    if (!label) {
      var label = lively.morphic.Text.makeLabel(labelString, {fill: Color.black, textColor: Color.white, fonstSize: 14, name: name});
      this.helperMorphs.push(label);
    }
    label.owner !== editor && editor.addMorph(label);
    label.align(label.bounds().center(), pos);
    label.disableEvents();
    return label;
  },

  getHelperMarker: function(name, editor, pos) {
    var name = name;
    var marker = this.getExistingHelper(name);
    if (!marker) {
      var marker = lively.morphic.Morph.makeRectangle(0,0, 10, 10);
      this.helperMorphs.push(marker);
    }
    marker.owner !== editor && editor.addMorph(marker);
    marker.align(marker.bounds().center(), pos);
    marker.applyStyle({borderRadius: 9, borderWidth: 0, fill: Color.green.withA(.35)});
    marker.disableEvents();
    marker.isEpiMorph = true;
    marker.disableDropping();
    return marker;
  },

  getBoundsMarker: function(name, editor, pos) {
    var name = name;
    var marker = this.getExistingHelper(name);
    if (!marker) {
      var marker = new lively.morphic.BoundsMarker({borderColor: Color.green});;
      this.helperMorphs.push(marker);
    }
    if (!marker.owner) marker.openInWorld();
    return marker;
  },

  getHelperCross: function(name, editor, pos) {
    var cross = this.getExistingHelper(name);
    if (!cross) {
      var w = 40, h = 40, spacing = 5, h2 = h/2;
      cross         = lively.morphic.Morph.makeRectangle(0,0, w,          h);
      var top       = lively.morphic.Morph.makeRectangle(0,0, spacing,    h2-spacing);
      var bottom    = lively.morphic.Morph.makeRectangle(0,0, spacing,    h2-spacing);
      var left      = lively.morphic.Morph.makeRectangle(0,0, h2-spacing, spacing);
      var right     = lively.morphic.Morph.makeRectangle(0,0, h2-spacing, spacing);
      top     .align(top.bounds()   .topCenter(),    cross.innerBounds().topCenter());
      bottom  .align(bottom.bounds().bottomCenter(), cross.innerBounds().bottomCenter());
      left    .align(left.bounds()  .leftCenter(),   cross.innerBounds().leftCenter());
      right   .align(right.bounds() .rightCenter(),  cross.innerBounds().rightCenter());
      [top,bottom,left,right].invoke("applyStyle", {fill: Color.red, borderWidth: 0});
      [top,bottom,left,right].forEach(function(ea) { cross.addMorph(ea); });
      cross.name = name;
      // cross.applyStyle({fill: null, borderColor: Color.red, borderWidth: spacing, borderRadius: spacing});
      cross.applyStyle({fill: null, borderRadius: 0, borderColor: null});
      cross.withAllSubmorphsDo(function(ea) { return ea.disableEvents(); });
      this.helperMorphs.push(cross);
    }

    cross.owner !== editor && editor.addMorph(cross);
    cross.align(cross.bounds().center(), pos);
    return cross;
  },

},
"editor helper", {

  indexSortedByProximity: function(globalPos, dropOps, editor) {
    // sort indexes by their distance to globalPos

    return dropOps.sortBy(function(dropOp) {
      // FIXME remove
      if (typeof dropOp === "number") return globalPos.dist(toGlobalPos(dropOp));
      return globalPos.dist(toGlobalPos(dropOp.indexInDocument));
    });

    function toGlobalPos(index) {
      var editorPos = editor.indexToPosition(index);
      var localPos = editor.posToMorphicPos(editorPos, "center");
      return editor.getGlobalTransform().transformPoint(localPos);
    }
  }

},
"document changes", {

// lively.debugNextMethodCall(lively.morphic.DraggableJavaScript.DroppableDocument.prototype, "findDropOperations")
  findDropOperations: function(dropjs, globalPos, restrictInsertionPositionByType) {
    if (!this.originalAst.hasOwnProperty("astIndex"))
      lively.ast.acorn.walk.addAstIndex(this.originalAst);
    var startIndex = this.editor.positionToIndex(this.editor.morphicPosToDocPos(globalPos)),
        scope = lively.ast.query.scopesAtIndex(this.originalAst, startIndex).last(),
        scopeNode = (scope && scope.node) || this.originalAst;
    if (!scopeNode) return [];
    
// show(this.originalContent.slice(scopeNode.start,scopeNode.end))

    var code = this.originalContent.slice(scopeNode.start, scopeNode.end),
        myDropjs = lively.morphic.DraggableJavaScript.DropJS.forCode(code),
        dropOps = myDropjs.findDropOperations(dropjs, {ast: scopeNode}),
        dropOpsWithIndexes = dropOps
          .map(function(ea) {
            if (ea.hasOwnProperty("at")) {
              ea.indexInDocument = ea.at;
              return ea;
            }
            var nodeIndex = ea.replaceNodeIndex || ea.parentNodeIndex;
            if (typeof nodeIndex === "number") {
              var node = lively.ast.acorn.walk.findNodeByAstIndex(this.originalAst || myDropjs.getAst(), nodeIndex, true);
              if (node) ea.indexInDocument = node.start + Math.floor((node.end - node.start)/2);
            }
            return ea;
          })
          .filter(function(op) { return typeof op.indexInDocument === "number"; });

    return this.indexSortedByProximity(globalPos, dropOpsWithIndexes, this.editor);
  },

  showInsertionPreview: function(dropjs, globalPos, restrictInsertionPositionByType) {
  // lively.debugNextMethodCall(this,"findDropOperations");
    var editor = this.editor, self = this;
    var dropOps = this.findDropOperations(dropjs, globalPos, restrictInsertionPositionByType);
    
    
    dropOps.forEach(function(dropOp, i) {
      var index = dropOp.indexInDocument,
          editorPos = editor.indexToPosition(index),
          localPos = editor.posToMorphicPos(editorPos, "center"),
          marker = self.getHelperMarker("marker-" + i, editor, localPos);

      (function() { marker.remove(); }) .delay(2);
      if (i === 0) {
        marker.applyStyle({
          fill: Color.green,
          borderWidth: 2, borderColor: Color.red,
          extent: pt(17,17)
        });
        marker.moveBy(pt(-3,-3));

        var nodeIndex = dropOp.replaceNodeIndex || dropOp.parentNodeIndex;
        var boundsMarker = self.getBoundsMarker("node-bounds-marker");
        var node = typeof nodeIndex === "number" && self.originalAst && lively.ast.acorn.walk.findNodeByAstIndex(self.originalAst, nodeIndex, true);
        if (node && node.start !== node.end) {
          var eolMarker = self.originalContent.slice(node.start, node.end).include("\n");
          var bounds = editor.getGlobalTransform().transformRectToRect(editor.astNodeMorphicBounds(node, eolMarker));
          boundsMarker.alignWithRect(bounds);
        } else { boundsMarker.remove(); }
      } else {
        marker.applyStyle({ borderWidth: 0, extent: pt(10,10) });
      }


      
    });
    
    // var indexes = dropOps.pluck("indexInDocument");
// show("%s", dropOps.map(function(ea) { return ea.type + " " + ea.as + " " + ea.indexInDocument; }).join("\n"));

    // this.showIndexes(globalPos, indexes, this.editor);

  
  },

  doFinalInsertion: function(dropjs, globalPos, restrictInsertionPositionByType) {
    this.removeHelpers();
    var dropOps = this.findDropOperations(dropjs, globalPos, restrictInsertionPositionByType);
    if (!dropOps.length) {
      this.editor.setStatusMessage("No insertion index for drag morph");
      return
    }

    var dropOp = dropOps[0];
    var myDropjs = lively.morphic.DraggableJavaScript.DropJS.forCode(this.originalContent);
    var generateCodeOpts = {context: this.editor.getDoitContext(), addReceiver: true, addArguments: true};
    var deltas = myDropjs.applyDropOp(dropjs, dropOp, generateCodeOpts)
      .map(function(delta) {
        var start = this.editor.indexToPosition(delta.start),
            end = {row: start.row + delta.lines.length-1, column: delta.lines.last().length};
        if (start.row === end.row) end.column += start.column;
        return lively.lang.obj.merge(delta, {start: start, end: end});
      }, this);
    
    this.editor.getSession().doc.applyDeltas(deltas);
    return deltas;
  },

  revert: function() {
    if (this.editor.textString !== this.originalContent)
      this.editor.textString = this.originalContent;
    this.helperMorphs.invoke("remove");
  }

});

Object.extend(lively.morphic.DraggableJavaScript.DroppableDocument, {
  from: function(editor) {
    return new lively.morphic.DraggableJavaScript.DroppableDocument(editor);
  }
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

lively.morphic.Text.subclass("lively.morphic.DraggableJavaScript.DragItem",
"initializing", {

  style: {
    allowInput: false, selectable: false,
    borderColor: Color.rgb(148,148,148), borderWidth: 1,
    fill: Color.rgb(255,255,255),
    fixedHeight: false, fixedWidth: false,
    fontFamily: "Dejavu Sans Mono, Monaco, monospace", fontSize: 10,
    padding: lively.rect(4,4,0,0), textColor: Color.rgb(51,51,51)
  },

  initialize: function($super, name, dropjs) {
    $super(rect(0,0,20,20), name)
    this.beLabel(this.style);
    this.dropjs = dropjs;
  }

},
"events", {

  grabMe: function() {
    var w = this.world() || lively.morphic.World.current();
    w.hands[0].grabMorph(this);
    this.setPositionCentered(pt(0,0));
  },

  canEditorReceiveDrop: function(e) {
    return e && e.isCodeEditor
        && e.getTextMode() == "javascript"
        && e.getSession()
        && e.getSession().$ast;
  },

  onGrabStart: function(evt) {
  },

  onGrabEnd: function(evt, dropTarget) {
    // canEditorReceiveDrop ....
    var pos = this.worldPoint(this.innerBounds().center()).addXY(0, -20);
    // lively.debugNextMethodCall(this, "applyTo")
    this.applyTo(dropTarget, pos);
  },

  onGrabMove: function(evt, morphBelow) {
    var doc = this.currentDroppableDocument;
    doc && doc.revert();

    if (!this.canEditorReceiveDrop(morphBelow)) {
      if (doc) this.currentDroppableDocument = null;
      return false;
    }

    if ((!doc || doc.target !== morphBelow) && morphBelow.isCodeEditor) {
      doc = this.currentDroppableDocument = lively.morphic.DraggableJavaScript.DroppableDocument.from(morphBelow);
    }

    if (doc) {
      doc.editor.droppingEnabled = true;
      var pos = this.worldPoint(this.innerBounds().center()).addXY(0, -20);
      doc.showInsertionPreview(this.dropjs, pos);
    }
  }

},
"application and code insertion", {

  applyTo: function(target, globalPos) {
    var doc = this.currentDroppableDocument;
    doc && doc.revert()
    
// lively.debugNextMethodCall(doc, "doFinalInsertion")

    if (doc && doc.editor === target) {
      var deltas = doc.doFinalInsertion(this.dropjs, globalPos),
          delta = deltas.detect(function(ea) { return ea.action === "insert"; });

      if (delta) {
        var selStart = lively.lang.obj.merge(delta.start, {});
        var selEnd = lively.lang.obj.merge(delta.end, {});

        var emptyFront = lively.lang.arr.takeWhile(delta.lines, function(l) { return !l; });
        var emptyEnd = lively.lang.arr.takeWhile(delta.lines.clone().reverse(), function(l) { return !l; });

        if (emptyFront.length) {
          selStart.row += emptyFront.length;
          selStart.column = 0;
        }

        if (emptyEnd.length) {
          selEnd.row -= emptyEnd.length;
          selEnd.column = (delta.lines[selEnd.row - selStart.row] || "").length;
          if (selStart.row === selEnd.row) selEnd.column += selStart.column;
        }

        var changedRange = target.createRange(selStart, selEnd);
        target.focus();
        if (target.getWindow() && !target.getWindow().isActive())
          target.getWindow().comeForward();

        (function() {
          target.setSelectionRangeAce(changedRange);
        }).delay(0);
      }
    } else {
      doc && doc.removeHelpers();
      var self = this;
      lively.ide.commands.exec("lively.ide.openWorkspace", {
        content: self.dropjs.getCode({addReceiver: true}),
        fontSize: 18
      });
      // ed.withAceDo(function() {
      //   lively.lang.fun.waitFor(
      //     function() { ed.getSession() && ed.getSession().$ast; },
      //     function() {
      //       doc = lively.morphic.DraggableJavaScript.DroppableDocument.from(ed)
      //       doc.showInsertionPreview(self.dropjs, globalPos);
      //     })
      // });
      // ed.getWindow().comeForward();
    }

    if (this.maker && this.maker.getPositionInWorld) {
      this.setPositionAnimated(
        this.maker.getPositionInWorld(), 200,
        function() { this.remove(); }.bind(this))
    } else this.remove();
  }

});

lively.morphic.Text.subclass("lively.morphic.DraggableJavaScript.Tile",
"initializing", {

  style: {
    allowInput: false,
    selectable: false,
    whiteSpaceHandling: "pre",
    borderColor: Global.Color.rgbHex("#CCC"),
    borderRadius: 4,
    // borderStyle: "outset",
    borderWidth: 1,
    // borderWidth: 0,
    clipMode: "visible",
    enableDragging: true,
    enableDropping: false,
    enableGrabbing: false,
    enableHalos: true,
    // fill: Global.Color.rgbHex("#DDD"),
    // fill: Global.Color.rgbHex("#999"),
    fill: Global.Color.white,
    fixedHeight: false,
    fixedWidth: false,
    fontFamily: "Dejavu Sans Mono, Monaco, monospace",
    fontSize: 11,
    padding: Global.Rectangle.inset(4),
    textColor: Global.Color.rgbHex("#333"),
    // textColor: Global.Color.white,
    align: "left",
    styleSheet: ".Text :hover .draggable-tile {\n"
              + "	cursor: grab;\n"
              + "	cursor: -webkit-grab;\n"
              + "	cursor: -moz-grab;\n"
              + "	outline: 1px gray solid;\n"
              + "}\n"
              + ".Text .draggable-tile:hover {\n"
              + "	cursor: grab;\n"
              + "	cursor: -webkit-grab;\n"
              + "	cursor: -moz-grab;\n"
              + "	outline: 2px gray solid;\n"
              + "}\n"
  },

  dragTriggerDistance: 0,

  isTile: true,

  initialize: function($super, dropjs, label) {
    $super(lively.rect(0,0,100,20), label || "");
    this.dropjs = dropjs;
  }

},
"building", {

  createText: function(string, name, baseStyle) {
    var t = new lively.morphic.Text(rect(0,0,10,10), string);
  
    t.applyStyle(lively.lang.obj.merge(baseStyle, {
      name: name,
      selectable: true, allowInput: true,
      fill: null, borderWidth: 0,
      padding: Global.Rectangle.inset(0, 3, 3, 0),
      whiteSpaceHandling: "pre",
      fixedWidth: false, fixedHeight: false
    }));
  
    t.addScript(function setValue(value) {
      if (this.value === value) return value;
      this.setString(lively.lang.obj.inspect(value).replace(/^lively\./, ""));
      return this.value = value;
    });
  
    t.addScript(function setString(string) {
      if (this.textString === string) return;
      this.textString = string;
    });
  
    return t;
  },

  createScrubbableText: function(string, name, baseStyle, scrubbingOpts) {
  
    var t = this.createText(string, name, baseStyle);
    t.scrubbingOpts = scrubbingOpts;
  
    t.applyStyle({
      styleSheet: ".scrubbable { cursor: ew-resize; }",
      allowInput: true
      // handStyle: "ew-resize"
    });
  
    t.addScript(function onLoad() {
      this.initScrubbingState(this.scrubbingOpts);
    });
  
    t.addScript(function setString(string) {
      if (this.isScrubbing()) return;
      if (this.textString === string) return;
      this.textString = string;
      this.emphasizeRegex(/[\+-]?[0-9\.]+/g, {cssClasses: ["scrubbable", "number"]});
    });
  
    t.addScript(function onScrubbingUpdate(evt, scrubbing, value) {
      Global.Trait("lively.morphic.ScrubbableText").def.onScrubbingUpdate.call(this, evt, scrubbing, value)
      try {
        var p = eval(this.textString);
        this.value = p;
        this.owner.fitToSubmorphs();
      } catch (e) {
        show(String(e));
      }
      var tile = this.ownerChain().detect(function(ea) { return ea.isTile; })
      var prop = tile && tile.dropjs.subject;
      prop && prop.highlightWhenUpdated && tile.tileValueHighlight();
    });
  
    t.addScript(function triggerRelayout() {
      var self = this;
      self.fit();
      lively.lang.fun.debounceNamed(this.id+"-relayout", 20, function() {
        self.owner.fitToSubmorphs();
      })();
    });
  
    lively.bindings.connect(t, 'textString', t, 'triggerRelayout');
  
    lively.morphic.Scrubbing.installScrubbingIn(t, t.scrubbingOpts);
  
    return t;
  }

},
"tile related user interaction and updating", {

  update: function() {},

  tileValueHighlightPoint: function() {
    var prop = this.dropjs.subject;
    var val = prop.value;
    if (!val) return;
    var highlight = this.tileValueHighlightMorph
                 || (this.tileValueHighlightMorph = lively.morphic.newMorph({name: prop.name + "highlight", extent: pt(10,10), style: {borderRadius: 5, borderWidth: 0, fill: Color.red}}));

    if (!highlight.owner) { highlight.prop = prop; highlight.openInWorld(); }

    highlight.addScript(function alignToProp() {
      var prop = this.prop,
          val = prop.value,
          m = prop.target.getObject(),
          pos = pt(0,0).matrixTransform(m.getGlobalTransform()),
          pos = pos.subPt(this.getExtent().scaleBy(0.5));
      this.setPositionCentered(pos);
    });

    highlight.alignToProp();
    highlight.startStepping(10, "alignToProp");

    lively.lang.fun.debounceNamed(this.id + "tileValueHighlightRemove", 1000, function() {
      if (!this.tileValueHighlightMorph) return;
      this.tileValueHighlightMorph.remove();
      delete this.tileValueHighlightMorph;
    }.bind(this))();
  },

  tileValueHighlight: function() {
    var prop = this.dropjs.subject;
    if (prop.type === "lively.Point") {
      this.tileValueHighlightPoint();
    } else show(prop.value);
  },

},
"layouting", {

  alignAsLabelForSubmorph: function alignAsLabelForSubmorph() {
    // if listItemMorph has a submorph, treat listItemMorph as a label for it,
    // positioning the label left and the submorph to the right
    var tile = this;
    var m = tile.submorphs[0];
    if (!m) return;
    var padding = tile.getPadding();
    var border = tile.getBorderWidth();
    tile.setExtent(tile.getTextExtent().addXY(padding.left() + padding.right() + m.bounds().width, border + padding.bottom() + padding.top()))
    m.align(
      m.bounds().rightCenter(),
      tile.innerBounds().rightCenter().addXY(-(padding.right() + border), 0));
  },

  fit: function() {
    lively.morphic.Text.prototype.fit.call(this);
    (function() {
      this.alignAsLabelForSubmorph();
    }).bind(this).delay(0);
  }

},
"events", {

  onDrag: function(evt) { evt.stop(); return true; },

  onDragEnd: function(evt) { evt.stop(); return true; },

  onDragStart: function(evt) {
    // show(evt.target.className);
    var cssClasses = evt.target.className;

    if (!cssClasses.include("draggable-tile")) {
      this.icon = null;
      return;
    }

    // show(evt.target.querySelector(":hover"));
      var code = "show('unknown tile behavior!');";
      var dropjs = this.dropjs.clone();
      dropjs.options = {}
      var name = dropjs.name || "no name for tile";
      if (cssClasses.include("getter")) {
        dropjs.options.get = true;
      } else if (cssClasses.include("setter")) {
        dropjs.options.set = true;
      }

      lively.morphic.DraggableJavaScript.createDragItemAndGrabIt(name, dropjs);
      evt.stop(); return true;
      // evt.hand.grabMorph(this.icon);
  }

});

lively.morphic.DraggableJavaScript.Tile.subclass("lively.morphic.DraggableJavaScript.PropertyTile",
"initializing", {
  
  initialize: function($super, dropjs) {
    
    // tile.update();
    // return tile;

    var subj = dropjs.subject,
        label = dropjs.subject.string || String(dropjs.subject.string);

    $super(dropjs);

    if (dropjs.subject.value && dropjs.subject.value.isColor) {
      this.initForColor(dropjs);
    } else if (lively.lang.obj.isNumber(dropjs.subject.value)) {
      this.initForNumber(dropjs);
    } else if (dropjs.subject.value instanceof lively.Point) {
      this.initForPoint(dropjs);
    } else if (typeof dropjs.subject.value === "boolean") {
      this.initForBoolean(dropjs);
    } else {
      this.initForUnknownProperty(dropjs);
    }

    this.propertyField && this.addMorph(this.propertyField);
  },

  initForColor: function(dropjs) {
    var prop = dropjs.subject,
        tile = this;

    tile.propertyFieldUpdateMethod = "setColor";
    tile.propertyField = tile.colorField = new lively.morphic.AwesomeColorField(lively.rect(0,0, 20,20));
    prop && lively.bindings.connect(tile.propertyField, 'color', prop, 'value');
  },

  initForNumber: function(dropjs) {
    var string = dropjs.subject.string || String(dropjs.subject),
        tile = this;

    tile.propertyFieldUpdateMethod = "setValue";
    tile.propertyField = tile.numberField = this.createScrubbableText(
      "",
      "numberField-for-" + (dropjs.subject.name || dropjs.subject),
      tile.getOwnStyle(),
      {initialFactor: dropjs.subject.scrubbingFactor || 1});
    
    if (dropjs.subject) lively.bindings.connect(tile.propertyField, 'value', dropjs.subject, 'value');
  },

  initForPoint: function(dropjs) {
    var string = dropjs.subject.string || String(dropjs.subject),
        tile = this;

    tile.propertyFieldUpdateMethod = "setValue";
    tile.propertyField = tile.pointField = this.createScrubbableText(
      "",
      "pointField-for-" + (dropjs.subject.name || dropjs.subject),
      tile.getOwnStyle(),
      {initialFactor: dropjs.subject.scrubbingFactor || 1});
    
    if (dropjs.subject) lively.bindings.connect(tile.propertyField, 'value', dropjs.subject, 'value');
  },

  initForBoolean: function(dropjs) {
    var string = dropjs.subject.string || String(dropjs.subject),
        tile = this;

    tile.propertyFieldUpdateMethod = "setChecked";
    
    tile.propertyField = new lively.morphic.CheckBox(dropjs.subject.value);
    tile.propertyField.applyStyle({name: "property-checkbox", extent: pt(20,20), centeredVertical: true});
    
    if (dropjs.subject) lively.bindings.connect(tile.propertyField, 'checked', dropjs.subject, 'value');
  },

  initForUnknownProperty: function(dropjs) {
  }

},
"updating", {
  
    update: function() {
        var hasPropField = this.propertyField && this.propertyFieldUpdateMethod,
            printed = this.dropjs.subject.print(hasPropField ? false : true);
        this[Array.isArray(printed) ? "setRichTextMarkup" : "setTextString"](printed);
        if (hasPropField)
          this.propertyField[this.propertyFieldUpdateMethod](this.dropjs.subject.value);
    }

});

lively.morphic.DraggableJavaScript.Tile.subclass("lively.morphic.DraggableJavaScript.MethodTile",
"initializing", {

  initialize: function($super, dropjs) {
    $super(dropjs, dropjs.getCode({addReceiver: false, dontCall: true}));
    this.createArgAndActionField();
  },
  
  createArgAndActionField: function() {
    var tile = this, dropjs = this.dropjs;
    var f = tile.argAndActionField = tile.addMorph(lively.morphic.Morph.makeRectangle(0,0, 10,10));
    f.applyStyle(lively.lang.obj.merge(lively.morphic.DraggableJavaScript.Tile.prototype.style, {borderWidth: 0}));
    // lively.mrohpic

    f.addMorph(this.createText("(", "open"));
    var method = dropjs.subject;
    method.args.forEach(function(arg, i) {
      var name = "arg-" + i,
          isArgSpec = Object.isObject(arg) && arg.name && arg.type,
          // t = Object.isNumber(arg) || arg instanceof lively.Point ?
          //   this.createScrubbableText("", name, lively.morphic.DraggableJavaScript.Tile.prototype.style) :
          //   this.createText("", name),
          t = this.createScrubbableText("", name, lively.morphic.DraggableJavaScript.Tile.prototype.style);

      t.argIndex = i;
        
      lively.bindings.connect(t, 'value', method, 'setArgs', {
        updater: function($upd, val) {
          var method = this.targetObj,
              t = this.sourceObj;
          method.args[t.argIndex] = val;
          $upd(method.args);
        }
      });
      lively.bindings.connect(t, 'value', tile, 'updateSteppingOfMethodWithNewArgs');
      lively.bindings.connect(t, 'textString', t, 'tryToConvertExpressionToValue');
      t.addScript(function tryToConvertExpressionToValue(expr) {
        try { this.setValue(eval(expr)); } catch (e) {}
      });

      if (!isArgSpec) { t.setValue(arg); }
      else t.setString(arg.name);
      f.addMorph(t);

      if (method.args.length - 1 !== i) f.addMorph(this.createText(",", "arg-comma-" + i));
    }, this);
    f.addMorph(this.createText(")", "close"));

    var runButton = this.runButton = f.addMorph(new lively.morphic.Button(lively.rect(0,0, 14,18), "!"));
    lively.bindings.connect(runButton, 'fire', method, 'run');
    runButton.applyStyle({name: "runButton", cssStylingMode: false, fill: Color.white});

    if (method.target.getObject() instanceof lively.morphic.Morph) {
      var steppingButton = this.steppingButton = f.addMorph(new lively.morphic.Button(lively.rect(0, 0, 16,18), "⟳"));
      lively.bindings.connect(steppingButton, 'fire', tile, 'interactivelyStartStepping');
      steppingButton.applyStyle({name: "steppingButton", cssStylingMode: false, fill: Color.white});
    }
    
    if (method.editable) {
      var editButton = this.editButton = f.addMorph(new lively.morphic.Button(lively.rect(0, 0, 16,18), "✍"));
      lively.bindings.connect(editButton, 'fire', tile, 'openEditor', {});
      editButton.applyStyle({name: "editButton", cssStylingMode: false, fill: Color.white});
    }
  },

},
"method specific", {

  isTicking: function() { return !!this.getTickingScript(); },

  getTickingScript: function() {
    var method = this.dropjs.subject;
    var morph = method.target.getObject();
    var scripts = morph.scripts || [];
    return scripts.detect(function(script) {
      return script.selector === method.name; });
  },

  startSteppingOfMethod: function(stepTime) {
    stepTime = stepTime || 1000;
    var method = this.dropjs.subject;
    var morph = method.target.getObject();
    morph.startStepping.apply(morph,
      [stepTime, method.name].concat(method.args));
  },

  updateSteppingOfMethodWithNewArgs: function() {
    var steppingScript = this.getTickingScript();
    if (!steppingScript) return;
    lively.lang.fun.throttleNamed(this.id + "-updateSteppingOfMethodWithNewArgs",
      steppingScript.tickTime, function() {
        this.startSteppingOfMethod(steppingScript.tickTime);
      }.bind(this))();
  },

  interactivelyStartStepping: function() {
    var method = this.dropjs.subject;
    var morph = method.target.getObject();
    var self = this;

    var steppingScript = this.getTickingScript();
    if (steppingScript) {
      morph.stopSteppingScriptNamed(method.name);
    } else {
      $world.prompt(
        "How fast should " + method.name + " tick (milliseconds)?",
        function(input) {
          var ms = Number(input);
          if (isNaN(ms)) $world.inform(input + " is not a valid number!");
          else self.startSteppingOfMethod(ms);
        }, 100);
    }
  }

},
"updating", {
  
  update: function() {
    var field = this.argAndActionField;
    var pos = pt(3,0);
    var oldBounds = this.bounds();

    lively.lang.arr.mapAsyncSeries(
      field.submorphs,
      function(ea, i, n) {
        var posForEa = ea.isButton ? pos.addXY(0, 2) : pos;
        ea.setPosition(posForEa);
        if (ea.fitThenDo) {
          ea.fitThenDo(function() { pos = ea.bounds().topRight().addXY(0,0); n(); })
        } else { pos = ea.bounds().topRight().addXY(4,-ea.bounds().top()); n(); }
      },
      function() {
        field.fitToSubmorphs();
        this.fitToSubmorphs();
        var newBounds = this.bounds();
        if (oldBounds.width !== newBounds.width || oldBounds.height !== newBounds.height)
          this.owner && this.owner.applyLayout();
      }.bind(this));

    if (this.steppingButton) {
      var shouldBeLabel = this.isTicking() ? "❚❚": "⟳";
      if (this.steppingButton.getLabel() !== shouldBeLabel) this.steppingButton.setLabel(shouldBeLabel);
    }

    return this;
  },

  openEditor: function() {
    var method = this.dropjs.subject;
    var morph = method.target.getObject();
    var self = this;

    lively.morphic.edit(morph, method.name)
    // $world.addCodeEditor({
    //   title: this.
    // })
  }

});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.extend(lively.morphic.DraggableJavaScript, {

  createDragItemAndGrabIt: function(name, dropjs) {
    var dragItem = new lively.morphic.DraggableJavaScript.DragItem(name, dropjs);
    dragItem.grabMe();
    return dragItem;
  },

  createPropertyTilesHierarchyFor: function(object) {
    var properties = object ?
      lively.morphic.Property.allKnownPropertiesByTypeFor(object) :
      [{isListItem: true, string: "no target", value: null}];
    return properties.map(function(protoProps) {
      return lively.lang.obj.merge(protoProps, {
        properties: protoProps.properties.map(function(prop) {
          var dropjs = lively.morphic.DraggableJavaScript.DropJS.forProperty(prop);
          var tile = new lively.morphic.DraggableJavaScript.PropertyTile(dropjs);
          tile.update();
          return tile;
        })
      });
    });
  },

  createMethodTilesHierarchyFor: function(object) {
    var methods = object ?
      lively.morphic.Method.allKnownMethodsByTypeFor(object) :
      [{isListItem: true, string: "no target", value: null}];
    return methods.map(function(protoProps) {
      return lively.lang.obj.merge(protoProps, {
        methods: protoProps.methods.map(function(method) {
          var dropjs = lively.morphic.DraggableJavaScript.DropJS.forProperty(method);
          var tile = new lively.morphic.DraggableJavaScript.MethodTile(dropjs);
          tile.update();
          tile.emphasizeAll({cssClasses: ["draggable-tile"]})
          return tile;
        })
      });
    });
  },

  createPropertyTileFor: function(morph, propName, referenceExpr) {
    var prop = lively.morphic.Property.propertyFor(morph, propName, referenceExpr);
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forProperty(prop);
    var tile = new lively.morphic.DraggableJavaScript.PropertyTile(dropjs);
    tile.update();
    return tile
  },

  createMethodTile: function(object, name, args, referenceExpr) {
    var method = lively.morphic.Method.methodFor(object, name, args, referenceExpr);
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forProperty(method);
    var tile = new lively.morphic.DraggableJavaScript.MethodTile(dropjs);
    tile.update();
    tile.emphasizeAll({cssClasses: ["draggable-tile"]})
    return tile;
  },

  createActionTile: function(name, code) {
    var dropjs = typeof code === "string" ?
      lively.morphic.DraggableJavaScript.DropJS.forCode(code) :
      code;
    var tile = new lively.morphic.DraggableJavaScript.Tile(dropjs, name);
    tile.update();
    tile.emphasizeAll({cssClasses: ["draggable-tile"]})
    return tile;
  },

  createRefTile: function(name, object) {
    var ref = new lively.morphic.PropertyTarget(object)
    var dropjs = lively.morphic.DraggableJavaScript.DropJS.forReference(ref);
    var tile = new lively.morphic.DraggableJavaScript.Tile(dropjs, name);
    tile.update();
    tile.emphasizeAll({cssClasses: ["draggable-tile"]})
    return tile;
  },

});

// FIXME! update lively.lang
if (!lively.lang.arr.takeWhile) {

  lively.lang.obj.extend(lively.lang.arr, {
    takeWhile: function(arr, fun, context) {
      var i = 0;;
      for (; i < arr.length; i++)
        if (!fun.call(context, arr[i], i)) break;
      return arr.slice(0, i);
    },
  
    dropWhile: function(arr, fun, context) {
      var i = 0;;
      for (; i < arr.length; i++)
        if (!fun.call(context, arr[i], i)) break;
      return arr.slice(i);
    }
  }); 

}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

Object.extend(lively.morphic.DraggableJavaScript, {

  TileBuilder: {

    divider: function(label) {
      var t = lively.morphic.Text.makeLabel(" " + label + " ", {
        centeredHorizontal: true,
        fontSize: 9, fontFamily: "Helvetica, sans-serif",
        textColor: Global.Color.rgbHex("#AAA")
      });
      return t;
    },

    addScriptButton: function(target) {
      var btn = new lively.morphic.Button(rect(0,0,20,20), "+");
      btn.applyStyle({
        cssStylingMode: false,
        name: "add-tile-method-button",
        fill: Color.white,
        centeredHorizontal: true,
      });
      btn.addScript(function doAction() {
        var tilePanel = this.owner.owner;
        if (!tilePanel.target) {
          tilePanel.setStatusMessage("No target for new method");
        }
        if (!tilePanel.target.newTile) {
          tilePanel.target.addScript(function newTile() {
    // enter code here
});
        }
      });
      lively.bindings.connect(btn, 'fire', btn, 'doAction');
      return btn;
    }
  },

  TileGroups: {

    "Morph": {
  
      categories: [
      {
        name: "state",
        createTiles: function(target, builder) {
          builder = builder || lively.morphic.DraggableJavaScript.TileBuilder;
          return lively.lang.arr.flatmap(
            lively.morphic.DraggableJavaScript.createPropertyTilesHierarchyFor(target),
              function(hiera) { return [builder.divider(hiera.name)].concat(hiera.properties) });
        },
      },
    
      {
        name: "behavior",
        createTiles: function(target, builder) {
          builder = builder || lively.morphic.DraggableJavaScript.TileBuilder;
          return [builder.addScriptButton(target)].concat(
            lively.lang.arr.flatmap(
              lively.morphic.DraggableJavaScript.createMethodTilesHierarchyFor(target),
                function(hiera) { return [builder.divider(hiera.name)].concat(hiera.methods) }));
        },
      }]
    },

    "Graphics": {
  
      categories: [
      {
        name: "Point",
        createTiles: function(target, builder) {
          builder = builder || lively.morphic.DraggableJavaScript.TileBuilder;
          var t = lively.morphic.DraggableJavaScript.createMethodTile;
          return [builder.divider("lively.Point class")]
            .concat([
              lively.morphic.DraggableJavaScript.createActionTile("pt(10, 20)", "pt(10, 20)"),
              t(lively.Point, "polar", [10, .1], "Point"),
              t(lively.Point, "random", [pt(10,20)], "Point"),
            ]).concat(lively.lang.arr.flatmap(
              lively.morphic.DraggableJavaScript.createMethodTilesHierarchyFor(pt(0,0)),
                function(hiera) { return [builder.divider(hiera.name)].concat(hiera.methods) }))
        }
      },
      
      {
        name: "Rectangle",
        createTiles: function(target, builder) {
          builder = builder || lively.morphic.DraggableJavaScript.TileBuilder;
          var t = lively.morphic.DraggableJavaScript.createMethodTile;
          return [builder.divider("lively.Rectangle class")]
            .concat([
              lively.morphic.DraggableJavaScript.createActionTile("rect(0,0, 10, 20)", "rect(0,0, 10, 20)")
            ]).concat(lively.lang.arr.flatmap(
              lively.morphic.DraggableJavaScript.createMethodTilesHierarchyFor(rect(0,0,10,20)),
                function(hiera) { return [builder.divider(hiera.name)].concat(hiera.methods); }))
        }
      }

      ]
    },

    "JS": {
  
      categories: [
      {
        name: "control flow",
        createTiles: function(target, builder) {
          builder = builder || lively.morphic.DraggableJavaScript.TileBuilder;
          return [
            lively.morphic.DraggableJavaScript.createActionTile("if", "if (test) {\n  \n}"),
            lively.morphic.DraggableJavaScript.createActionTile("if-else", "if (test) {\n  \n} else {\n  \n}"),
            lively.morphic.DraggableJavaScript.createActionTile("for-loop", "for (var i = 0; i < 10; i++) {\n  \n}"),
            lively.morphic.DraggableJavaScript.createActionTile("while-loop", "while (test) {\n  \n}"),
            lively.morphic.DraggableJavaScript.createActionTile("variable", "var x = 23"),
            lively.morphic.DraggableJavaScript.createActionTile("function", "function func(arg) {\n  return arg;\n}"),
          ];
        }
      },

      ]
    }
  }

});

}) // end of module
