module("lively.ide.tools.JavaScriptWorkspace").requires("lively.ide.CodeEditor", "lively.persistence.BuildSpec", "lively.lang.VM").toRun(function() {

lively.BuildSpec("lively.ide.tools.JavaScriptWorkspace", {
  _Extent: lively.pt(682.0,424.0),
  className: "lively.morphic.Window",
  draggingEnabled: true,
  droppingEnabled: false,
  layout: {adjustForNewBounds: true},
  titleBar: "es6 workspace",
  submorphs: [

  {
    _ClipMode: {x: "hidden", y: "scroll"},
    _Extent: lively.pt(107.4,397.2),
    _Fill: Color.rgb(255,255,255),
    _FixedPosition: false,
    _FontSize: 10,
    _Position: lively.pt(571.0,24.0),
    _StyleClassNames: ["Morph", "Box", "List", "recorder-list"],
    _StyleSheet: "/*\n\
  .Morph{\n\
     border-color: red;\n\
     background-color: gray;\n\
     border-width: 2px;\n\
  }\n\
  */\n\
  \n\
  .list-item {\n\
  	padding: 2px 2px 0px 2px !important;\n\
  	font-size: 9px !important;\n\
  	font-family: Monaco, monospace !important;\n\
  }",
    className: "lively.morphic.List",
    droppingEnabled: false,
    grabbingEnabled: false,
    itemMorphs: [],
    layout: {
      adjustForNewBounds: true,
      moveHorizontal: true,
      resizeHeight: true,
      resizeWidth: false
    },
    name: "recorderList",
    showsMorphMenu: true,
    sourceModule: "lively.morphic.Lists",
    connectionRebuilder: function connectionRebuilder() {
      lively.bindings.connect(this, "selection", this.get("workspace-editor"), "uiJumpToDef", {});
    },
    getMenu: function getMenu(evt) {
      var m = evt.getTargetMorph();
      var clicked = m && m.isListItemMorph && this.itemList[m.index].value;
      if (!clicked) return [];
      return [["inspect " + clicked.name, lively.morphic.inspect.curry(clicked.value)]]
    }
  },

  {
    _BorderColor: null,
    _Extent: lively.pt(4.0,398.0),
    _Fill: Color.rgb(204,204,204),
    _Position: lively.pt(567.0,24.0),
    className: "lively.morphic.VerticalDivider",
    draggingEnabled: true,
    droppingEnabled: false,
    layout: {adjustForNewBounds: true, moveHorizontal: true, resizeHeight: true, resizeWidth: false},
    name: "vdivider",
    pointerConnection: null,
    sourceModule: "lively.morphic.Widgets",
  },

  {
    _AutocompletionEnabled: true,
    _BehaviorsEnabled: true,
    _BorderColor: Color.rgb(95,94,95),
    _DraggableCodeEnabled: false,
    _Extent: lively.pt(564.0,397.0),
    _FontSize: lively.Config.get("defaultCodeFontSize"),
    _LineWrapping: false,
    _Position: lively.pt(3.0,24.0),
    _ScrubbingEnabled: false,
    _ShowActiveLine: false,
    _ShowGutter: false,
    _ShowIndents: true,
    _ShowInvisibles: false,
    _ShowPrintMargin: false,
    _ShowWarnings: true,
    _SoftTabs: true,
    _TabSize: lively.Config.get("defaultTabSize"),
    textMode: "javascript",
    allowInput: true,
    className: "lively.morphic.CodeEditor",
    layout: {resizeHeight: true, resizeWidth: true},
    name: "workspace-editor",
    sourceModule: "lively.ide.CodeEditor",


    reset: function reset() {
      this.owner.targetMorph = this;

      this.get("vdivider").fixed = [];
      this.get("vdivider").scalingLeft = [this];
      this.get("vdivider").scalingRight = [this.get("recorderList")];
    
      lively.bindings.connect(this, 'textChange', this, 'uiUpdateDefList', {
        updater: ($upd) =>
          lively.lang.fun.debounceNamed(`${this.id}-uiUpdateDefList`, 400, $upd)()});
    },

    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
      $super();
      this.getWindow().addMorphBack(this.get("recorderList"));
      this.reset();
    },
  
    doListProtocol: function doListProtocol() {
      var listerModule = module("lively.ide.codeeditor.Completions");
      return listerModule.load()
      .then(() =>
        this.saveExcursion(reset => {
        var prefix = this.getSelectionOrLineString();
        reset(); return prefix; }))
      .then((prefix) => this.vmCompletions(prefix, {}))
      .then((completions) => {
        var lister = new lively.ide.codeeditor.Completions.ProtocolLister(this);
        return lister.openNarrower(completions);
      })
      .catch(err => err && this.showError(err))
    },

    doSave: function doSave() {
      var code = this.textString;
      this.savedTextString = code;

      this.vmSave(code, this.getTargetFilePath(), {doEval: this.getEvalOnSave()})
      .then(x => { this.uiUpdateDefList(); return x; });

      // if (this.getEvalOnSave()) {
      //   var result = this.tryBoundEval(this.savedTextString, { range: { start: { index: 0 }, end: { index: this.textString.length } } });
      //   if (result instanceof Error) this.showError(result);
      // }
    },

    evalSelection: function evalSelection(printIt) {
      return this.vmEval(this.getSelectionOrLineString(), {asString: false})
        .then(result => {
          if (printIt) this.insertAtCursor(String(result.value), true)
          return result;
        });
    },

    doit: function doit(printResult, editor, options) {
      options = lively.lang.obj.merge({inspect: !printResult, printDepth: this.printInspectMaxDepth}, options);
      options.asString = !options.inspect;
      options.asString = true;

      var text = this.getSelectionMaybeInComment(),
        range = this.getSelectionRange();

      return this.vmEval(text, options)
      .then(result => {
        if (printResult) {
          this.printObject(editor, result.value, false, this.getPrintItAsComment());
        } else {
          this.setStatusMessage(result.value);
        }
        return result;
        })
        .catch(err => { this.showError(err); throw err; })
    },

    hasUnsavedCodeChanges: function hasUnsavedCodeChanges() {
      return lively.lang.string.hashCode(this.textString)
      !== this.state.moduleContentHash;
    },

    moduleId: function moduleId() {
      // lively.modules.moduleEnv(this.moduleId())
      var s = lively.net.SessionTracker.getSession();
      return `lively://${s.sessionId}/lively-workspace-${this.id}`;
    },

    uiJumpToDef: function uiJumpToDef(recorded) {
      if (!recorded) return;

      var ast = this.withASTDo();
      if (!ast) return;

      var scope = lively.ast.query.topLevelDeclsAndRefs(ast);

      var decl;
      if (recorded.isImport) {
      decl = scope.scope.importDecls.detect(decl => decl.name === recorded.name);
      } else {
      decl = scope.funcDecls.detect(decl => decl.id.name === recorded.name)
        || scope.varDecls.pluck("declarations").flatten().detect(decl => decl.id.name === recorded.name);
      }

      if (decl) {
        this.setSelectionRange(decl.start, decl.end, true);
        var s = this.getSelection()
        // s.lead
        this.aceEditor.renderer.scrollSelectionIntoView(s.anchor, s.lead)
        this.aceEditor.session.setScrollLeft(0);
        this.focus();
        // e.aceEditor.renderer.scrollCursorIntoView(cursor, offset, $viewMargin)
      }
    },

    uiUpdateDefList: function uiUpdateDefList() {
      var ast = this.withASTDo();
      if (!ast) return;

      var id = this.moduleId(),
          scope = lively.modules.moduleEnv(id).recorder,
          rec = lively.modules.moduleRecordFor(id),
          toplevel = lively.ast.query.topLevelDeclsAndRefs(ast),
          imports = ast ? toplevel.scope.importDecls.pluck("name") : [],
          col1Width = 0,
          items = toplevel.declaredNames
          .filter(ea => !ea.match("__lively.modules__")) // filter getters / setters of attributes
          .map(v => {
            var nameLength = v.length,
                isExport = rec && rec.exports && v in rec.exports,
                isImport = imports.include(v);
            if (isExport) nameLength += " [export]".length
            // if (isExport) nameLength += " [export]".length
            col1Width = Math.max(col1Width, nameLength);
            return {
              isExport: isExport,
              isImport: isImport,
              name: v,
              value: scope[v],
              printedName: v + (isExport ? " [export]" : "") + (isImport ? " [import]" : ""),
              printedValue: lively.lang.obj.inspect(scope[v], {maxDepth: 1}).replace(/\n/g, "")
            }
          })
          .map(val => ({
            isListItem: true,
            value: val,
            string: val.printedName + lively.lang.string.indent(" = " + val.printedValue, " ", col1Width-val.printedName.length)
          }))

      this.get("recorderList").setList(items);
      return items;
    },

    vmCompletions: function vmCompletions(prefix, options) {
      options = lively.lang.obj.merge({targetModule: this.moduleId()}, options);
      return lively.vm.completions.getCompletions(code => lively.modules.runEval(code, options), prefix)
      .then(result => ({completions: result.completions, prefix: result.startLetters}))
    },

    vmEval: function vmEval(source, options) {
      return Promise.resolve().then(() => {
        var moduleName = this.moduleId()
        if (!moduleName) throw new Error("No vm module selected for eval");

        var defRanges = {};

        options = lively.lang.obj.merge({
          targetModule: moduleName,
          sourceURL: moduleName + "_doit_" + Date.now(),
        topLevelDefRangeRecorder: defRanges,
        }, options);

        return lively.modules.runEval(source, options)
          .then(result => { this.uiUpdateDefList(); return result; })
          .catch(err => { this.setShowErrors(err); throw err; });
        });

    }

  }

  ]
});

Object.extend(lively.ide.tools.JavaScriptWorkspace, {
    open: function() {
        return lively.BuildSpec('lively.ide.tools.JavaScriptWorkspace')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
    }
});

}) // end of module
