/*
 * Copyright (c) 2008-2011 Hasso Plattner Institute
 *
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

module('lively.ast.StackReification').requires('lively.ast.Interpreter', 'lively.ast.Parser').toRun(function() {

lively.Closure.subclass('lively.ast.RewrittenClosure',
'initializing', {
  initialize: function($super, func, varMapping, source) {
    $super(func, varMapping, source);
    this.ast = null;
  },
},
'accessing', {
  getRewrittenFunc: function() { return this.recreateFuncFromSource(this.getRewrittenSource()) },
  getRewrittenSource: function() { return this.ast && this.ast.asJS() },
  getOriginalFunc: function() { return this.addClosureInformation(this.getFunc()) },
},
'rewriting', {
  rewrite: function(rewriter) {
    var ast = this.getFunc().ast();
    rewriter.rewrite(ast);
    this.ast = ast;
  },
});

Object.subclass('lively.ast.StackReification.Rewriter',
'interface', {
  rewrite: function(ast) {
    return this.rewriteCallsInAST(ast, 'isolateAndCatchCall');
  },
},
'code rewrite', {

  rewriteCallsInAST: function(ast, rewriteMode) {
    // for each statement in sequence find calls, extract them, put them in front of stmt
    // and assign them to a temp var. the temp var replaces the calls in stmt
    var rewriter = this,
        calls = ast.nodesMatching(function(node) { return node.isCall || node.isSend }),
        callIndexes = calls.collect(function(node) { return node.astIndex() }); // "pc"s

    // rewrite mode is either isolateCall or isolateAndCatchCall
    calls.forEach(function(call, i) { rewriter[rewriteMode](call, callIndexes[i], ast) });

    return ast;
  },

  isolateCall: function(callNode, callIdx, funcNode) {
    var seq = callNode.parentSequence(),
        callVarAccess = callNode.replaceWith(this.tempVarFor(callNode, callIdx)),
        callAssignment = this.tempVarAssignmentFor(callNode, callIdx);

    if (!seq) throw new Error('isolateAndCatchCall: Cannot find sequence for ' + callNode);
    seq.insertBefore(callAssignment, callVarAccess);

    return callAssignment;
  },

  isolateAndCatchCall: function(callNode, callIdx, funcNode) {
    var varAndArgNamesToCapture = this.findVarAndArgNamesInScope(funcNode),
        safeCall = this.unwindTemplate(varAndArgNamesToCapture, callIdx);

    var callAssignment = this.isolateCall(callNode, callIdx, funcNode);

    callAssignment.replaceWith(safeCall);
    safeCall.nodesMatching(function(node) {
      return node.name == 'REPLACE_WITH_CALL';
     })[0].replaceWith(callAssignment);

    return safeCall;
  },

  unwindTemplate: function(varAndArgNamesToCapture, callIdx) {
    // new lively.ast.StackReification.Rewriter().unwindTemplate().asJS()

    varAndArgNamesToCapture = varAndArgNamesToCapture || [];
    var src = ' try { REPLACE_WITH_CALL } catch(e) {' +
      '   if (e.isUnwindException) {' +
      '     e.lastFrame = e.lastFrame.addCallingFrame(REPLACE_WITH_LITERAL, ' + callIdx + ', arguments.callee.livelyClosure.getOriginalFunc())' +
      '   };' +
      '   throw e' +
      ' }',
      ast = lively.ast.Parser.parse(src, 'stmt'),
      captureLiteral = this.objectLiteralNodeForCapturingVarAndArgsList(varAndArgNamesToCapture);
    ast.replaceNodesMatching(function(node) {return node.name == 'REPLACE_WITH_LITERAL'}, captureLiteral);
    return ast;
  },

  objectLiteralNodeForCapturingVarAndArgsList: function(varsAndArgs) {
    var src = '{' + varsAndArgs.collect(function(ea) {return ea + ':' + ea}).join(',') + '}',
      node = lively.ast.Parser.parse(src, 'expr');
    return node;
  },
},
'ast node creation', {
  tempVarFor: function(callNode, callIdx) {
    return new lively.ast.Variable([0,0], "result" + callIdx + "_" + callNode.getName());
  },
  tempVarAssignmentFor: function(callNode, callIdx) {
    return new lively.ast.VarDeclaration([0,0], "result" + callIdx + "_" + callNode.getName(), callNode)
  },

},
'stack examination', {
  findVarAndArgNamesInScope: function(rootNode) {
    var result = [];
    rootNode.withAllChildNodesDo(function(node) {
      if (node.isFunction && node != rootNode) return false;
      if (node.isFunction) result = result.concat(node.args);
      if (node.isVarDeclaration) result.push(node.name);
      return true;
    });
    return result;
  },
});
Object.extend(lively.ast.StackReification, {

  halt: function() {
    var frame = lively.ast.Interpreter.Frame.create();
    throw {isUnwindException: true, lastFrame: frame, topFrame: frame}
  },

  run: function(func) {
    try {
      return func();
    } catch(e) {
      if (e.isUnwindException) {
        e.lastFrame.setContainingScope(lively.ast.Interpreter.Frame.global());
        return lively.ast.Continuation.fromUnwindException(e);
      }
      throw e;
    }
  },
});
Object.extend(Global, {
  catchUnwind: lively.ast.StackReification.run,
  halt: lively.ast.StackReification.halt,
});
Object.extend(Function.prototype, {
  stackCaptureMode: function(varMapping) {
    var rewriter = new lively.ast.StackReification.Rewriter(),
      closure = new lively.ast.RewrittenClosure(this, varMapping);
    closure.rewrite(rewriter);
    var rewrittenFunc = closure.getRewrittenFunc();
    if (!rewrittenFunc) throw new Error('Cannot rewrite ' + this);
    return rewrittenFunc;
  },

  stackCaptureSource: function(varMapping) {
    var rewriter = new lively.ast.StackReification.Rewriter(),
      closure = new lively.ast.RewrittenClosure(this, varMapping);
    closure.rewrite(rewriter)
    return closure.getRewrittenSource();
  },
});
Object.subclass('lively.ast.Continuation',
'initializing', {
  initialize: function(frame) {
    this.currentFrame = frame; // the frame in which the the unwind was triggered
  },
  copy: function() {
    var copy = new this.constructor(this.currentFrame.copy());
    return copy;
  },
},
'accessing', {
  frames: function() {
    var frame = this.currentFrame, result = [];
    while (frame) {
      result.push(frame);
      frame = frame.getContainingScope();
    }
    return result;
  },
},
'resuming', {
  resume: function() {
    if (!this.currentFrame.getFunc())
      throw new Error('Cannot resume because frame has no function!');
    if (!this.currentFrame.pc)
      throw new Error('Cannot resume because frame has no pc!');
    var frame = this.currentFrame, result;
    // go through all frames on the stack. beginning with the top most, resume each of them
    while (frame && frame.getFunc()) { // !frame.func means we reached the last frame
      if (frame.hasNextStatement()) { // dont repeat halt!
        frame.jumpToNextStatement();
        result = frame.resume();
      } else { result = undefined } // FIXME
      frame = frame.getContainingScope();
    }
    return result;
  },
});
Object.extend(lively.ast.Continuation, {
  fromUnwindException: function(e) {
    return new this(e.topFrame.getContainingScope());
  },
});
}) // end of module