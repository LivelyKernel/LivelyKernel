module("lively.ide.tools.JavaScriptWorkspace").requires("lively.ide.CodeEditor", "lively.persistence.BuildSpec", "lively.lang.VM").toRun(function() {

lively.BuildSpec("lively.ide.tools.JavaScriptWorkspace", {
  _Extent: lively.pt(682.0,424.0),
  className: "lively.morphic.Window",
  draggingEnabled: true,
  droppingEnabled: false,
  layout: {adjustForNewBounds: true},
  contentOffset: lively.pt(3.0,24.0),
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
    minWidth: 20,
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

    module: function module() {
      var s = lively.net.SessionTracker.getSession(),
          url = `lively://${s.sessionId.replace(/:/g, "_COLON_")}/lively-workspace-${this.id}`;
      return lively.modules.module(url);
    },

    moduleId: function module() { return this.module().id; },

    onCodeSaved: function onCodeSaved(code) {
      this.uiUpdateDefList();
    },

    onDoitDone: function onDoitDone(result) {
      this.uiUpdateDefList();
    },

    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
      $super();
      this.getWindow().addMorphBack(this.get("recorderList"));
      this.reset();
    },

    onLoad: function onLoad() {
      $super();
      this.reset();
    },

    reset: function reset() {
      this.owner.targetMorph = this;

      this.get("vdivider").fixed = [];
      this.get("vdivider").scalingLeft = [this];
      this.get("vdivider").scalingRight = [this.get("recorderList")];

      lively.bindings.connect(this, 'textChange', this, 'uiUpdateDefList', {
        updater: ($upd) =>
          lively.lang.fun.debounceNamed(`${this.id}-uiUpdateDefList`, 400, $upd)()});

      delete this.state;
      lively.vm.evalStrategies.EvalableTextMorphTrait.applyTo(
        this, ['doit', 'doSave', 'evalSelection', 'doListProtocol', 'printInspect']);
    },

    uiJumpToDef: function uiJumpToDef(recorded) {
      if (!recorded) return;

      var ast = this.withASTDo();
      if (!ast) return;

      var decl = recorded.node;

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

      var mod = this.module(),
          scope = mod.env().recorder,
          rec = mod.record(),
          toplevel = lively.ast.query.topLevelDeclsAndRefs(ast),
          decls = lively.ast.query.declarationsOfScope(toplevel.scope, true).sortByKey("start"),
          imports = ast ? toplevel.scope.importDecls.pluck("name") : [],
          col1Width = 0,

          items = decls
            // .filter(ea => !ea.match("__lively.modules__")) // filter getters / setters of attributes
            .map(v => {
              var nameLength = v.name.length,
                  isExport = rec && rec.exports && v.name in rec.exports,
                  isImport = imports.include(v.name);
              if (isExport) nameLength += " [export]".length;
              if (isImport) nameLength += " [import]".length;
              col1Width = Math.max(col1Width, nameLength);

              return {
                isExport: isExport,
                isImport: isImport,
                name: v.name,
                value: scope[v.name],
                node: v,
                printedName: v.name + (isExport ? " [export]" : "") + (isImport ? " [import]" : ""),
                printedValue: lively.lang.obj.inspect(scope[v.name], {maxDepth: 1}).replace(/\n/g, "")
              }
            })
            .map(val => ({
              isListItem: true,
              value: val,
              string: val.printedName + lively.lang.string.indent(" = " + val.printedValue, " ", col1Width-val.printedName.length)
            }));

      this.get("recorderList").setList(items);
      return items;
    }

  }

  ]
});

Object.extend(lively.ide.tools.JavaScriptWorkspace, {
    open: function() {
      // lively.ide.tools.JavaScriptWorkspace.open()
        return lively.BuildSpec('lively.ide.tools.JavaScriptWorkspace')
            .createMorph().openInWorld($world.positionForNewMorph()).comeForward();
    }
});

}) // end of module
