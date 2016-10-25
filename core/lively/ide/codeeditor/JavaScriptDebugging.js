module('lively.ide.codeeditor.JavaScriptDebugging').requires("lively.Traits", "lively.persistence.BuildSpec", "lively.ast.StackReification","lively.ast.Rewriting","lively.ast.AcornInterpreter","lively.persistence.MorphicState",'lively.ide.codeeditor.MorphicOverlay','lively.ide.codeeditor.Scrubbing').toRun(function() {

lively.BuildSpec("lively.ide.codeeditor.RecordingWorkspaceControls", {

  className: "lively.morphic.Box",
  _Extent: pt(100, 20),
  _Fill: Color.white,

  layout: {adjustForNewBounds: true, moveVertical: true, resizeWidth: true},

  name: "RecordingWorkspaceControls",
  submorphs: [
    {
      _Extent: lively.pt(20.0,20.0), _Position: lively.pt(1010.0, 0),
      className: "lively.morphic.Button",
      label: ">",
      layout: {moveHorizontal: true},
      name: "forwardButton"
    },

    {
      _Extent: lively.pt(20.0,20.0), _Position: lively.pt(968.0, 0),
      className: "lively.morphic.Button",
      label: "<",
      layout: {moveHorizontal: true},
      name: "backwardButton"
    },

    {
      _Extent: lively.pt(20.0,20.0), _Position: lively.pt(989.0, 0),
      className: "lively.morphic.Button",
      label: "▶︎",
      layout: {moveHorizontal: true},
      name: "playStopButton"
    },

    {
      _Extent: lively.pt(40.0,20.0), _Position: lively.pt(926.6,0),
      className: "lively.morphic.Button",
      label: "record",
      layout: {moveHorizontal: true},
      name: "resetButton"

    }]
});

Object.extend(lively.ide.codeeditor.JavaScriptDebugging, {

  debugCall: function(func, thisObj, args, optFuncName, optEditor, thenDo) {
    var name = optFuncName || func.name;
    if (!name) name = "__anonymous_function__";
    var source = String(func).replace(/^\s*function[^\(]*/, "function " + name);
    lively.lang.fun.composeAsync(
      lively.ide.codeeditor.JavaScriptDebugging.withRecordingWorkspaceDo.curry(optEditor),
      function(workspace, n) { workspace.textString = source; setTimeout(n.curry(null, workspace), 200); },
      function(workspace, n) {
        var recordingOpts = {
          recordFunctionCall: name,
          functionCallArgs: args,
          functionCallThis: thisObj || Global
        };
        workspace.setRecordingOptions(recordingOpts);
        workspace.recordComputation(recordingOpts);
        n();
      }
    )(thenDo);
  },

  debugNextMethodCall: function(target, methodName, optEditor, thenDo) {
    if (target[methodName].isRecordingDebugWrapper && target[methodName].uninstallDebugger) {
      target[methodName].uninstallDebugger();
    }

    var method = target[methodName],
        methodOwner = target;
    do {
      if (methodOwner.hasOwnProperty(methodName)) break;
      methodOwner = Object.getPrototypeOf(methodOwner);
    } while (methodOwner);

    target[methodName] = target[methodName].wrap(function(/*proceed + args{*/) {
      uninstallDebugger();
      var args = Array.from(arguments); args.shift();
      lively.ide.codeeditor.JavaScriptDebugging.debugCall(
        method, this, args, methodName, optEditor, thenDo);
      // FIXME don't run twice....
      return method.apply(this, args);
    });
    target[methodName].isRecordingDebugWrapper = true;
    target[methodName].uninstallDebugger = uninstallDebugger;

    function uninstallDebugger() {
      delete target[methodName];
      methodOwner[methodName] = method;
    }

  },

  withRecordingWorkspaceDo: function(optEditor, doFunc) {
      var editor;
      lively.lang.fun.composeAsync(
        function(n) {
          if (optEditor) {editor = optEditor; n(); }
          else require("lively.ide.tools.JavaScriptWorkspace").toRun(function() {
            var workspace = lively.ide.tools.JavaScriptWorkspace.open();
            editor = workspace.targetMorph;
            editor.withAceDo(function() { setTimeout(n, 10); });
          });
        },
        function(n) { lively.ide.codeeditor.JavaScriptDebugging.makeRecordingWorkspace(editor); n(); }
      )(function(err) { doFunc(err, editor); });
  },

  makeRecordingWorkspace: function(codeEditor) {
    // lively.ide.codeeditor.JavaScriptDebugging.makeRecordingWorkspace(that);
    // that.recordComputation()
    // codeEditor = that

    if (!codeEditor.owner.getMorphNamed("RecordingWorkspace")) {
      lively.ide.codeeditor.JavaScriptDebugging.buildRecordingControlsFor(codeEditor);
    }

    if (!codeEditor.recordingWorkspaceState) {
      var trait =  Trait('lively.ide.codeeditor.RecordingWorkspace');
      if (codeEditor.hasOwnProperty("boundEval") && codeEditor.boundEval !== trait.def.boundEval) {
        codeEditor.boundEval.asScriptOf(codeEditor, "__preRecordingDebugger__boundEval");
      }
      trait.applyTo(codeEditor, {override: ["boundEval"]});
      codeEditor.recordingWorkspaceReset();
    }
  },

  removeRecordingWorkspaceBehavior: function(codeEditor) {
    codeEditor.recordingWorkspaceReset();
    var trait = Trait('lively.ide.codeeditor.RecordingWorkspace');
    trait.removeFrom(codeEditor, {override: ["boundEval"]});

    var ctls = codeEditor.owner.get("RecordingWorkspaceControls");
    codeEditor.setHeight(codeEditor.height() + ctls.height());
    if (ctls) ctls.remove();

    codeEditor.morphicOverlaysRemoveAll();
    delete codeEditor.recordingWorkspaceState;

    if (codeEditor.hasOwnProperty("__preRecordingDebugger__boundEval")) {
      codeEditor["__preRecordingDebugger__boundEval"].asScriptOf(codeEditor, "boundEval");
    }
  },


  buildRecordingControlsFor: function(codeEditor) {
    var existing = codeEditor.owner.getMorphNamed("RecordingWorkspaceControls");
    if (existing) existing.remove();

    var m = lively.BuildSpec("lively.ide.codeeditor.RecordingWorkspaceControls").createMorph().openInWorldCenter()
    m.fitToSubmorphs()

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    var slider = lively.PartsBin.getPart("SteppingSlider", "PartsBin/Inputs")
    slider.name = "replaySlider";
    m.addMorph(slider);
    slider.applyStyle({resizeWidth: true, position: pt(100,0), extent: pt(100, 20), borderWidth: 1})

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    m.setLayouter({ borderSize: 0, spacing: 0, type: "lively.morphic.Layout.TightHorizontalLayout" })
    m.fitToSubmorphs();
    m.setLayouter(null)

    codeEditor.owner.addMorph(m);
    m.setWidth(codeEditor.width());
    codeEditor.setHeight(codeEditor.height() - m.height());
    m.align(m.bounds().topLeft(), codeEditor.bounds().bottomLeft());

    return m;
  }

});

Trait('lively.ide.codeeditor.RecordingWorkspace',
"initializing", {

  // onLoad: function() {
  //   this.constructor.prototype.onLoad.call(this)
  //   this.morphicOverlaysSubscribeToEditorEvents();

  //   var self = this;
  //   if (!self._onChangeImmediate) {
  //     self._onChangeImmediate = function onChange(evt) { self.recordComputationDebounced(); }
  //     this.aceEditor.on("change", self._onChangeImmediate);
  //   }
  //   // this.aceEditor.off("change", this.aceEditor._eventRegistry.change[2]);
  // },

  recordingWorkspaceReset: function() {
    // this.doitContext = that

    this.recordingWorkspaceState = {
      lastRecording: [],
      isReplaying: false,
      replayEnabled: true
    }

    // this.removeAllMorphs();

    if (this.hasOwnProperty("doNotSerialize")) {
      this.doNotSerialize.push("_onChangeImmediate");
    } else { this.doNotSerialize = ["_onChangeImmediate"]; }


    this.withoutRecordingDo(function() {
      this.withoutReplayDo(function() {
        this.get("replaySlider").value = 0;
      });
    });

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    this.getPartsBinMetaInfo().addRequiredModule('lively.ide.codeeditor.JavaScriptDebugging');

    lively.ide.codeeditor.Scrubbing.enableInCodeEditor(this)

    this.morphicOverlaysRemoveAll();
    var controls = this.get("RecordingWorkspaceControls");
    var sl = controls.get("replaySlider")
    // cb.align(cb.bounds().topLeft(), this.bounds().bottomLeft())
    // sl.align(sl.bounds().topLeft(), cb.bounds().topRight())
    sl.max = 0;
    sl.adjustSliderParts();

    lively.bindings.connect(sl, 'value', this, 'showRecordedComputationStep', {
      updater: function($upd, val, oldVal) { $upd(val, this.targetObj.isRecordingEnabled()); }
    });
    lively.bindings.connect(controls.get("backwardButton"), 'fire', sl, 'setValue', {
      converter: function() { return this.targetObj.value === 0 ? 0 : this.targetObj.value - 1; }
    });
    lively.bindings.connect(controls.get("forwardButton"), 'fire', sl, 'setValue', {
      converter: function() { return this.targetObj.value >= this.targetObj.max ? this.targetObj.value : this.targetObj.value + 1; }
    });
    lively.bindings.connect(controls.get("playStopButton"), 'fire', this, 'toggleReplay');
    lively.bindings.connect(controls.get("resetButton"), 'fire', this, 'recordComputation', {
      updater: function($upd) {
        this.targetObj.get("replaySlider").value = 0;
        // this.targetObj.recordingWorkspaceReset();
        this.targetObj.morphicOverlaysRemoveAll();
        $upd();
      }
    });

    // this.getWindow().copyToPartsBinWithUserRequest();
  },

},
"code evaluation", {

  boundEval: function(__evalStatement, __evalOptions) {
    // module("lively.ast.AcornInterpreter").load();

    var proceed = this.__preRecordingDebugger__boundEval || this.constructor.prototype.boundEval;

    var step = this.get("replaySlider").value;
    var recorded = this.recordingWorkspaceState.lastRecording[step];

    if (!recorded) return proceed.call(this, __evalStatement, __evalOptions);

    var oldVal = Global.__recordedScope;
    Global.__recordedScope = recorded.scope;
    try {
      return proceed.call(
        this,
        __evalStatement,
        lively.lang.obj.merge(__evalOptions, {
          varRecorderName: "__recordedScope",
          topLevelVarRecorder: Global.__recordedScope,
          context: recorded.scope["this"] || __evalOptions.context
        }));
    } finally { Global.__recordedScope = oldVal; }
  }

},
"morphic overlays", {

  morphicOverlayEnsureForLine: function(line) {
    // this.morphicOverlays.length
    // this.morphicOverlayEnsureForLine(1);
    // var line = this.morphicOverlays[0].state.line
    // this.morphicOverlaysRemoveAll()

    var overlay = this.morphicOverlays && this.morphicOverlays.detect(function(ea) {
      // return ea.getLine(this) === line;
      return (ea.state.node && ea.state.node.row === line)
           || ea.getLine(this) === line;
    }, this);

    if (overlay) return overlay;
    var overlay = this.addMorph(this.morphicOverlayCreate({fitLabel: true, alignLabel: "line-end"}));
    overlay.state.shownComputationSteps = [];
    return overlay;
  },

  morphicOverlayEnsureForNode: function(node) {
    return this.morphicOverlayEnsureForLine(
      this.indexToPosition(node.start).row);
  },

  morphicOverlaysRemoveAtLine: function(line) {
    this.morphicOverlays && this.morphicOverlays.forEach(function(overlay) {
      if (overlay.getLine(this) === line) this.morphicOverlaysRemove(overlay);
    }, this);
  },

  overlaysForStepAfter: function(stepNumber) {
    return this.morphicOverlays && this.morphicOverlays.filter(function(overlay) {
      return overlay.state.shownComputationSteps && overlay.state.shownComputationSteps.last() > stepNumber;
    });
  },

  overlaysForStepBefore: function(stepNumber) {
    return this.morphicOverlays && this.morphicOverlays.filter(function(overlay) {
      return overlay.state.shownComputationSteps && overlay.state.shownComputationSteps.last() < stepNumber;
    });
  },

  removeOverlaysShowingStepsAfter: function(stepNumber, thenDo) {
    // var stepNumber = 0;
    // var line = 0
    this.morphicOverlays && this.morphicOverlays.forEach(function(overlay) {
      if ((overlay.state.shownComputationSteps || [])
        .every(function(itsStepNumber) {
          return itsStepNumber > stepNumber; })) {
        // overlay && show("removing overlay at %s", line);
        this.morphicOverlaysRemove(overlay);
      }
    }, this);
    thenDo && thenDo();
  }

},
"morphic state", {

  morphExceptions: function() {
    return [this]
      .concat(this.ownerChain())
      .concat(
        $world.getComputationRecorderExceptions ?
          $world.getComputationRecorderExceptions() : [])
      .compact()
  },

},
"execution recording testing", {

  isRecordingEnabled: function() {
    // return this.get("isRecordingCheckbox").isChecked();
    return true;
  },

},
"execution recording", {

  autoReplayUpdate: function() {
    var sl  = this.get("replaySlider");
    sl.setValue(sl.value + 1);
    if (sl.max === sl.value && this.recordingWorkspaceState.isReplaying) this.toggleReplay();
  },

  setRecordingOptions: function(opts) {
    this.recordingWorkspaceState.recordingOptions = opts;
  },

  recordComputation: function(options) {
    // this.reset();
    // options.recordFunctionCall = "bar";
    // options.functionCallArgs = [3, 4];
    // options.functionCallThis = 99

    if (!this.isRecordingEnabled()) return;

    options = lively.lang.obj.merge(
      {recordFunctionCall: false,functionCallArgs: {}},
      this.recordingWorkspaceState.recordingOptions,
      options);

    var recordingAstRegistry = lively.ast.Rewriting.getCurrentASTRegistry(),
        recordingRewriter = new lively.ast.Rewriting.RecordingRewriter(recordingAstRegistry, "RewriteForCapturing-tests-manual", "Global.__recordComputation"),
        src = this.textString,
        ast = lively.ast.parse(src, {addSource: true, addAstIndex: true}),
        recordingRewrite = recordingRewriter.rewrite(ast);

    var lastRecording = this.recordingWorkspaceState.lastRecording;
    if (lastRecording && lastRecording[0]) {
      lively.persistence.MorphicState.applyMorphicState(
        $world,
        lastRecording[0].morphicState,
        this.morphExceptions());
      lastRecording.length = 0;
    }

    // FIXME!!!
    var recorder = this;
    Global.__recordComputation = function(value, scope, astIndex, namespace, origFunctionIndex) {
      // will be injected
      recorder.recordingWorkspaceState.lastRecording.push({
        value: value,
        stringified: lively.lang.obj.inspect(value, {maxDepth: 1}).slice(0,100).replace(/\n/g, ""),
        morphicState: lively.persistence.MorphicState.captureMorphicState(
          $world, recorder.morphExceptions()),
        scope: lively.ast.AcornInterpreter.Scope.varMappingOfFrameState(scope),
        astIndex: astIndex, namespace: namespace,
        origFunctionIndex: origFunctionIndex
      });
      return value;
    };

    var codeToRun = Global.escodegen.generate(recordingRewrite);
    var evalOpts = {};
    var exportName = "__recordingEval-" + this.id + "-" + Date.now();

    if (options.recordFunctionCall) {
      var varMap = options.functionCallArgs.reduce(function(args, ea, i) { args["__arg_"+i] = ea; return args; }, {})
      var thisExpr = 'Global["' + exportName + '"].__functionCallThis';
      // var funcOwner = options.functionCallThis ? thisExpr : "_0"; // FIXME!!!
      var funcOwner = "_0"; // FIXME!!!
      codeToRun += lively.lang.string.format('\n;debugger;%s["%s"].call(%s%s%s)',
        funcOwner,
        options.recordFunctionCall,
        thisExpr,
        options.functionCallArgs.length ? "," : "",
        Object.keys(varMap).map(function(ea) { return 'Global["' + exportName + '"].' + ea; }).join(","));
      if (options.functionCallThis) {
        varMap.__functionCallThis = options.functionCallThis;
      }
      evalOpts.topLevelVarRecorder = varMap;
      evalOpts.varRecorder = "Global";
      Global[exportName] = varMap;
    }

    if (this.get("recordingLog")) {
      this.get("recordingLog").textString = codeToRun;
    }

    try {
      this.recordingWorkspaceState.lastRecording = [];
      var result = this.boundEval(codeToRun, evalOpts);
      delete Global.__recordComputation;
      delete Global[exportName];
      if (result instanceof Error) this.showError(result);
    } catch (e) { this.showError(e); }


    var sl = this.get("replaySlider");
    this.showRecordedComputationStep(sl.value, true);
    sl.max = this.recordingWorkspaceState.lastRecording.length - 1;
    if (sl.value > sl.max) this.withoutReplayDo(function() { sl.value = sl.max; });
    sl.adjustSliderParts();
  },

  recordComputationDebounced: function() {
      if (!this.isRecordingEnabled()) return;
      var self = this;

      if (this.isScrubbing()) self.recordComputation();
      else lively.lang.fun.debounceNamed(this.id+"-recordComputation", 10,
        function() { self.recordComputation(); })();
  },

  replayRecordedComputationStep: function(stepNumber, showOlderSteps, shouldApplyState, timeout, thenDo) {
    // stepNumber = 0;
    // stepNumber = this.get("replaySlider").value;
    // shouldApplyState = true;

    var self = this;
    var recorded = this.recordingWorkspaceState.lastRecording[stepNumber];

    if (!recorded || !this.recordingWorkspaceState.replayEnabled) { thenDo && thenDo(); return; }

    // update the morphic state...
    if (shouldApplyState && recorded.morphicState) {
      lively.persistence.MorphicState.applyMorphicState(
        $world, recorded.morphicState, this.morphExceptions());
    }

    // ...and the view
    lively.lang.fun.composeAsync(
      self.removeOverlaysShowingStepsAfter.bind(self, stepNumber),
      showStepsBefore,
      self.rerenderComputationStep.bind(self, stepNumber, recorded, false, true)
    )(function(err) {
      if (err) self.showError(err);
      if (!thenDo) return;
      else if (timeout) setTimeout(thenDo, timeout);
      else thenDo();
    });


    function showStepsBefore(thenDo) {
      if (!showOlderSteps) return thenDo();
      var stepsBefore = lively.lang.arr.range(0, Math.max(0, stepNumber-1)).reverse();
      lively.lang.arr.mapAsyncSeries(stepsBefore,
        function(stepNumber, i, n) {
          self.rerenderComputationStep(
            stepNumber,
            self.recordingWorkspaceState.lastRecording[stepNumber],
            true/*ignoreIfNewerComputationShown*/,
            false/*highlight*/,
            n);
        },
        function(err, results) { thenDo(err); });
    }

  },

  rerenderComputationStep: function(stepNumber, recorded, ignoreIfNewerComputationShown, highlight, thenDo) {
    // this.morphicOverlays[0].state
    // this.rerenderComputationStep(0, this.recordingWorkspaceState.lastRecording)
    var node = lively.ast.acorn.walk.findNodeByAstIndex(
      this.getSession().$ast, recorded.astIndex, true);

    if (!node) { thenDo && thenDo(); return; }

    var overlay = this.morphicOverlayEnsureForNode(node);

    if (ignoreIfNewerComputationShown) {
      var lastStepShown = overlay.state.shownComputationSteps.last() || -1;
      if (lastStepShown >= stepNumber) { thenDo && thenDo(); return; }
    }

    overlay.state.shownComputationSteps.push(stepNumber);
    overlay.state.value = recorded.value;
    overlay.setLabelStringAtNode(
      this, node, recorded.value, recorded.stringified);
    overlay.setHighlighted(true);

    if (highlight) {
      var allOverlays = this.morphicOverlays || [];
      var otherOverlays = allOverlays.without(overlay);
      otherOverlays.invoke("setHighlighted", false);
      otherOverlays.invoke("realign", this);
    }

    thenDo && thenDo();
  },


  showRecordedComputationStep: function(stepNumber, applyState) {
    // lively.lang.fun.createQueue
    applyState = typeof applyState === 'boolean' ? applyState : true;
    this.replayRecordedComputationStep(
      stepNumber,
      true/*rerenderStepsBefore*/,
      applyState,
      null);
  },

  toggleReplay: function() {
    if (this.recordingWorkspaceState.isReplaying) {
      this.get("playStopButton").setLabel("▶︎");
      this.stopStepping();
    } else {
      this.get("playStopButton").setLabel("❚❚");
      this.startStepping(400, "autoReplayUpdate");
    }
    this.showRecordedComputationStep(this.get("replaySlider").value, true);
    this.recordingWorkspaceState.isReplaying = !this.recordingWorkspaceState.isReplaying;
  },

  withoutRecordingDo: function(func) {
    // var cb = this.get("isRecordingCheckbox")
    // var isRecording = cb.isChecked();
    // cb.setChecked(false);
    try {
      return func.call(this);
    } finally {
      // cb.setChecked(isRecording);
    }
  },

  withoutReplayDo: function(func) {
    var flag = this.recordingWorkspaceState.replayEnabled;
    this.recordingWorkspaceState.replayEnabled = false;
    try { return func.call(this); }
      finally { this.recordingWorkspaceState.replayEnabled = flag; }
  }

});

Object.extend(lively, {
  debugCall: lively.ide.codeeditor.JavaScriptDebugging.debugCall,
  debugNextMethodCall: lively.ide.codeeditor.JavaScriptDebugging.debugNextMethodCall
});

}); // end of module
