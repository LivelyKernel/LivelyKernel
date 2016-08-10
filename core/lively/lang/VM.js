module('lively.lang.VM').requires("lively.ast.acorn").toRun(function() {

var arr = lively.lang.arr;
var transform = lively.ast.transform;
var capturing = lively.ast.capturing;
var parse = lively.ast.parse;
var stringify = lively.ast.stringify;

var member = lively.ast.nodes.member;
var id = lively.ast.nodes.id;
var literal = lively.ast.nodes.literal;

var defaultDeclarationWrapperName = "lively.capturing-declaration-wrapper",
    defaultClassToFunctionConverterName = "initializeES6ClassForLively";


function evalCodeTransform(code, options) {
  // variable declaration and references in the the source code get
  // transformed so that they are bound to `varRecorderName` aren't local
  // state. THis makes it possible to capture eval results, e.g. for
  // inspection, watching and recording changes, workspace vars, and
  // incrementally evaluating var declarations and having values bound later.

  // 1. Allow evaluation of function expressions and object literals
  code = transform.transformSingleExpression(code);
  var parsed = parse(code);

  // transforming experimental ES features into accepted es6 form...
  parsed = transform.objectSpreadTransform(parsed);

  // 2. capture top level vars into topLevelVarRecorder "environment"

  if (options.topLevelVarRecorder) {


    // capture and wrap logic
    var blacklist = (options.dontTransform || []).concat(["arguments"]),
        undeclaredToTransform = !!options.recordGlobals ?
          null/*all*/ : arr.withoutAll(Object.keys(options.topLevelVarRecorder), blacklist),
        varRecorder = id(options.varRecorderName || '__lvVarRecorder'),
        es6ClassToFunctionOptions = undefined,
        declarationWrapperName = options.declarationWrapperName || defaultDeclarationWrapperName;

    // if (options.keepPreviouslyDeclaredValues) {
    //   // 2.1 declare a function that should wrap all definitions, i.e. all var
    //   // decls, functions, classes etc that get captured will be wrapped in this
    //   // function. When using this with the option.keepPreviouslyDeclaredValues
    //   // we will use a wrapping function that keeps the identity of prevously
    //   // defined objects
    //   options.declarationWrapper = member(
    //     id(options.varRecorderName),
    //     literal(declarationWrapperName), true);
    //   options.topLevelVarRecorder[declarationWrapperName] = declarationWrapperForKeepingValues;

    //   // Class declarations and expressions are converted into a function call
    //   // to `createOrExtendClass`, a helper that will produce (or extend an
    //   // existing) constructor function in a way that allows us to redefine
    //   // methods and properties of the class while keeping the class object
    //   // identical
    //   options.topLevelVarRecorder[defaultClassToFunctionConverterName] = initializeClass;
    //   es6ClassToFunctionOptions = {
    //     currentModuleAccessor: options.currentModuleAccessor,
    //     classHolder: varRecorder,
    //     functionNode: member(varRecorder, defaultClassToFunctionConverterName),
    //     declarationWrapper: options.declarationWrapper
    //   };

    // }

    // 2.2 Here we call out to the actual code transformation that installs the
    parsed = capturing.rewriteToCaptureTopLevelVariables(
      parsed, varRecorder,
      {
        es6ImportFuncId: options.es6ImportFuncId,
        es6ExportFuncId: options.es6ExportFuncId,
        ignoreUndeclaredExcept: undeclaredToTransform,
        exclude: blacklist,
        declarationWrapper: options.declarationWrapper || undefined,
        classToFunction: es6ClassToFunctionOptions
     });
  }


  if (options.wrapInStartEndCall) {
    parsed = transform.wrapInStartEndCall(parsed, {
      startFuncNode: options.startFuncNode,
      endFuncNode: options.endFuncNode
    });
  }

  var result = stringify(parsed);

  if (options.sourceURL) result += "\n//# sourceURL=" + options.sourceURL.replace(/\s/g, "_");

  return result;
}

Object.extend(lively.lang.VM, {

    transformForVarRecord: function(code, varRecorder, varRecorderName, blacklist, defRangeRecorder) {
      var parsed = parse(code);

      var undeclaredToTransform = arr.withoutAll(Object.keys(varRecorder), blacklist),
          varRecorder = id(varRecorderName || '__lvVarRecorder'),
          es6ClassToFunctionOptions = undefined;

      parsed = capturing.rewriteToCaptureTopLevelVariables(
        parsed, varRecorder,
        {
          ignoreUndeclaredExcept: undeclaredToTransform,
          exclude: blacklist,
          declarationWrapper: undefined,
          classToFunction: undefined
       });

      return stringify(parsed);

        // // variable declaration and references in the the source code get
        // // transformed so that they are bound to `varRecorderName` aren't local
        // // state. THis makes it possible to capture eval results, e.g. for
        // // inspection, watching and recording changes, workspace vars, and
        // // incrementally evaluating var declarations and having values bound later.
        // blacklist = blacklist || [];
        // try {
        //     var undeclaredToTransform = Object.keys(varRecorder).withoutAll(blacklist),
        //         transformed = lively.ast.transform.replaceTopLevelVarDeclAndUsageForCapturing(
        //             code, {name: varRecorderName, type: "Identifier"},
        //             {ignoreUndeclaredExcept: undeclaredToTransform,
        //             exclude: blacklist, recordDefRanges: !!defRangeRecorder});
        //     code = transformed.source;
        //     if (defRangeRecorder) Object.extend(defRangeRecorder, transformed.defRanges);
        // } catch(e) {
        //     if (lively.Config.showImprovedJavaScriptEvalErrors) $world.logError(e)
        //     else console.error("Eval preprocess error: %s", e.stack || e);
        // }
        // return code;

    },

    transformSingleExpression: function(code) {
        // evaling certain expressions such as single functions or object
        // literals will fail or not work as intended. When the code being
        // evaluated consists just out of a single expression we will wrap it in
        // parens to allow for those cases
        try {
            var ast = lively.ast.fuzzyParse(code);
            if (ast.body.length === 1 &&
               (ast.body[0].type === 'FunctionDeclaration'
             || ast.body[0].type === 'BlockStatement')) {
                code = '(' + code.replace(/;\s*$/, '') + ')';
            }
        } catch(e) {
            if (lively.Config.showImprovedJavaScriptEvalErrors) $world.logError(e)
            else console.error("Eval preprocess error: %s", e.stack || e);
        }
        return code;
    },

    evalCodeTransform: function(code, options) {
      return evalCodeTransform(code, options)
        // var vm = lively.lang.VM,
        //     recorder = options.topLevelVarRecorder,
        //     varRecorderName = options.varRecorderName || '__lvVarRecorder';

        // if (recorder) code = vm.transformForVarRecord(
        //     code, recorder, varRecorderName,
        //     options.dontTransform, options.topLevelDefRangeRecorder);
        // code = vm.transformSingleExpression(code);

        // if (options.sourceURL) code += "\n//# sourceURL=" + options.sourceURL.replace(/\s/g, "_");

        // // es6 / jsx transformer
        // var useBabeljs = typeof babel !== "undefined"
        //               && options.hasOwnProperty('useBabelJs') ?
        //                   options.useBabelJs :
        //                   Config.get("useBabelJsForEval");
        // if (useBabeljs) code = babel.transform(code, {blacklist: ["strict"]}).code;

        // return code;
    },

    getGlobal: function() {
        return (function() { return this; })();
    },

    _eval: function(__lvEvalStatement, __lvVarRecorder/*needed as arg for capturing*/) {
        return eval(__lvEvalStatement);
    },

    runEval: function (code, options, thenDo) {
        // The main function where all eval options are configured.
        // options can include {
        //   varRecorderName: STRING, // default is '__lvVarRecorder'
        //   topLevelVarRecorder: OBJECT,
        //   context: OBJECT,
        //   sourceURL: STRING
        // }
        if (typeof options === 'function' && arguments.length === 2) {
            thenDo = options; options = {};
        } else if (!options) options = {};

        var vm = lively.lang.VM, result, err,
            context = options.context || vm.getGlobal(),
            recorder = options.topLevelVarRecorder;
        code = vm.evalCodeTransform(code, options);

        $morph('log') && ($morph('log').textString = code);

        try {
            result = vm._eval.call(context, code, recorder);
        } catch (e) { err = e; } finally { thenDo(err, result); }
    },

    syncEval: function(string, options) {
        // See #runEval for options.
        // Although the defaul eval is synchronous we assume that the general
        // evaluation might not return immediatelly. This makes is possible to
        // change the evaluation backend, e.g. to be a remotely attached runtime
        var result;
        lively.lang.VM.runEval(string, options, function(e, r) { result = e || r; });
        return result;
    }

});

}); // end of module
