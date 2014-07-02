module('lively.ide.tools.ASTEditor').requires("lively.ide.tools.CommandLine", 'lively.ast.AstHelper')
.requiresLib({url: 'http://lively-web.org/core/lib/grasp.js', loadTest: function() { return typeof grasp !== 'undefined' }})
.toRun(function() {

lively.BuildSpec('lively.ide.tools.ASTEditor', {
    _Extent: lively.pt(727.0,457.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    name: "ASTEditor",
    sourceModule: "lively.morphic.Widgets",
    draggingEnabled: true,
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(721.0,432.0),
        _Fill: Color.rgb(231,231,231),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        doNotSerialize: ["state"],
        droppingEnabled: false,
        isCopyMorphRef: true,
        lastFocused: {isMorphRef: true,name: "searchInput"},
        layout: { adjustForNewBounds: true, resizeHeight: true, resizeWidth: true },
        morphRefId: 1,
        name: "ASTEditorPane",
        state: { target: null },
        submorphs: [{
            _AutocompletionEnabled: true,
            _BorderColor: Color.rgb(95,94,95),
            _Extent: lively.pt(712.0,338.0),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(4.0,65.0),
            _ShowActiveLine: false,
            _ShowErrors: true,
            _ShowGutter: false,
            _ShowIndents: true,
            _ShowInvisibles: false,
            _ShowPrintMargin: false,
            _ShowWarnings: false,
            _SoftTabs: true,
            _TextMode: "text",
            _Theme: "chrome",
            className: "lively.morphic.CodeEditor",
            droppingEnabled: false,
            grabbingEnabled: false,
            lastFocused: { isMorphRef: true, name: "CommandLine" },
            layout: { resizeHeight: true, resizeWidth: true },
            name: "output",
            sourceModule: "lively.ide.CodeEditor"
        },

        lively.BuildSpec("lively.ide.tools.CommandLine").customize({
            labelString: 'query: ',
            _Extent: lively.pt(712.0,20.0),
            _Position: lively.pt(4.0,5.0),
            layout: {
                resizeWidth: true
            },
            name: "searchInput"
        }),

        lively.BuildSpec("lively.ide.tools.CommandLine").customize({
            _Extent: lively.pt(712.0,20.0),
            _Position: lively.pt(4.0,35.0),
            layout: { resizeWidth: true },
            name: "replaceInput",
            labelString: 'replace with: '
        }),

        {
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(80.0,20.0),
            _Position: lively.pt(4.0,406.0),
            className: "lively.morphic.Button",
            label: "show target",
            layout: { moveVertical: true },
            name: "showTargetButton",
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(80.0,20.0),
            _Position: lively.pt(86.0,406.0),
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "set target",
            layout: { moveVertical: true },
            name: "setTargetButton",
            toggle: false,
            value: false,
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(80.0,20.0),
            _Position: lively.pt(168.0,406.0),
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "apply",
            layout: { moveVertical: true },
            name: "applyButton",
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
        },{
            _Extent: lively.pt(36.7,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 8,
            _HandStyle: "default",
            _InputAllowed: false,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(604.0,408.0),
            allowInput: false,
            className: "lively.morphic.Text",
            droppingEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                moveHorizontal: true,
                moveVertical: true,
                resizeWidth: false
            },
            name: "queryModeLabel",
            textString: "query"
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(77.0,25.0),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(641.0,408.0),
            className: "lively.morphic.DropDownList",
            droppingEnabled: true,
            itemList: ["equery","squery"],
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "querySelectionList",
            selection: "equery"
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(75.0,25.0),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(516.0,408.0),
            className: "lively.morphic.DropDownList",
            itemList: ["tree","ast","source","diff"],
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "outputTypeSelectionList",
            selection: "source",
        },{
            _Extent: lively.pt(36.7,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 8,
            _HandStyle: "default",
            _InputAllowed: false,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(476.0,408.0),
            allowInput: false,
            className: "lively.morphic.Text",
            droppingEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            grabbingEnabled: false,
            layout: {
                moveHorizontal: true,
                moveVertical: true,
                resizeWidth: false
            },
            name: "queryModeLabel1",
            textString: "output"
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(80.0,20.0),
            _Position: lively.pt(332.0,406.0),
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "about",
            layout: {
                moveVertical: true
            },
            name: "aboutButton",
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("ASTEditorPane"), "aboutPressed", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(80.0,20.0),
            _Position: lively.pt(250.0,406.0),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "as JS",
            layout: {
                moveVertical: true
            },
            name: "extractExpressionButton",
            sourceModule: "lively.morphic.Widgets",
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("ASTEditorPane"), "extractCommand", {});
        }
        }],
        aboutPressed: function aboutPressed() {
    
        var t = this.world().addTextWindow({title: 'About AST Editor', extent: pt(700, 400)});
    
        t.applyStyle({
            fill: Color.white
        });
    
        var markup = [
            ["The AST editor uses the ",{}],
            ["graspjs",{ uri: "http://graspjs.com" }],
            [" library to match and transform JavaScript code. graspjs supports two different matching modes: ", {}],
            ["equery", {italics: 'italic'}],
            [" and ", {}],
            ["squery", {italics: 'italic'}],
            [".\n\nEquery (\"example query\") matches JavaScript-like expressions with wildcards. Example:\n", {}],
            ["  __.assertEquals($first, _$rest)", {fontFamily: "monospace" }],
            ["\n\nSquery uses a matching scheme similar to CSS selectors to match AST nodes. Example:\n",{}],
            ["  statement > *[callee.property=#assertEquals]", {fontFamily: "monospace" }],
            ["\n\nThose query expressions can be used to do strucural searches and replacements based on the JavaScript AST. With equery it is possible to bind AST subtrees to names to use those in the replacements. The equery example from above binds the first argument to ",{}],
            ["assertEquals", {fontFamily: "monospace" }],
            [" to ", {}],
            ["first", {fontFamily: "monospace" }],
            [" and the remaining arguments to ", {}],
            ["rest", {fontFamily: "monospace" }],
            [". Those can be reused in an replacement expression:\n", {}],
            ["  expect({{first}}).to.equal({{rest | join \", \"}})", {fontFamily: "monospace" }],
            ["\n\n\nMore information can be found here: ",{}],
            ["http://graspjs.com/docs/",{uri: "http://graspjs.com/docs/" }],
            ["\n",{}]];
    
        t.setRichTextMarkup(markup);
        t.getWindow().comeForward();
    },
        applyPressed: function applyPressed() {
        var t = this.state.target;
        if (!t) { show('no target'); return; }
        var patched = JsDiff.applyPatch(t.textString, this.computePatch());
        t.textString = patched;
        this.searchInputChanged();
    },
        computePatch: function computePatch() {
        var search     = this.get('searchInput').getInput();
        var replace    = this.get('replaceInput').getInput();
        var queryMode  = this.get('querySelectionList').selection || 'equery';
        var code       = this.getTargetCode();
        
        var replacement = grasp.replace(queryMode, search, replace, code) || '';
        if (Object.isArray(replacement)) replacement = replacement.join('\n\n\n//==============\n\n\n');
        return JsDiff.createPatch(this.getFileName(), code, replacement);
    },
        ensureLibs: function ensureLibs(thenDo) {
        // this.ensureLibs(function() { alertOK('ok'); });
        Functions.composeAsync(
            function(next) { lively.require('lively.ast.AstHelper').toRun(function() { next(); }); },
            function(next) { JSLoader.loadJs(lively.module("lib.jsdiff.jsdiff").uri().toString()); Functions.waitFor(2000, function() { return typeof JsDiff !== 'undefined'; }, next); },
            function(next) {
                JSLoader.loadJs(URL.codeBase.withFilename('lib/grasp.js').toString()); Functions.waitFor(2000, function() { return typeof grasp !== 'undefined'; }, next); 
                
                }
        )(function(err) { thenDo && thenDo.call(this, err); }.bind(this))
    },
        extractCommandSource: function extractCommandSource() {
    
        var query = this.get("searchInput").getInput();
        var replace = this.get("replaceInput").getInput();
        var queryMode  = this.get('querySelectionList').selection || 'equery';
        var target = this.state.target
        var getCodeExpression;
    
        if (target) {
            if (target.name && $morph(target.name) === target) getCodeExpression = "$morph('" + target.name + "')";
            else getCodeExpression = "$world.getMorphById('" + target.id + "')";
            getCodeExpression += '.textString';
        } else getCodeExpression = '';
    
        if (replace) {
    
            var graspCode = Strings.format("grasp.replace('%s', '%s', '%s', %s)",
                queryMode, query, replace, getCodeExpression);
    
        } else {
    
            var graspCode = Strings.format("grasp.search('%s', '%s', %s)",
                queryMode, query, getCodeExpression);
    
        }
        return graspCode;
        },

        extractCommand: function extractCommand() {
    
        $world.addCodeEditor({
            title: 'grasp expression',
            content: this.extractCommandSource()
        }).getWindow().comeForward();
    
    },
        focusMove: function focusMove(delta, n) {
        // delta=-1, focIdx = 0
    
        var focusTargets = [
            this.get('searchInput'),
            this.get('replaceInput'),
            this.get('output'),
            this.get('querySelectionList'),
            this.get('outputTypeSelectionList')];
        
        var newIdx;
    
        if (delta !== undefined) {
            var focused = lively.morphic.Morph.focusedMorph(),
                focIdx = focusTargets.indexOf(focused);
            newIdx = (focIdx+delta) % focusTargets.length;
        } else if (n !== undefined) newIdx = n;
        else newIdx = 0;
    
            
        if (newIdx < 0) newIdx = focusTargets.length-1;
        var focTarget = focusTargets[newIdx];
    
        focTarget && focTarget.focus();
    },
        getFileName: function getFileName() {

        var t = this.state.target;
        if (!t) return 'no filename';
        
        if (t.getTargetFilePath()) return t.getTargetFilePath();
        
        return t.name ? '<' + t.name + '>' : String(t);
    },
        getTargetCode: function getTargetCode() {
        return this.state.target ? this.state.target.textString : '';
    },
        init: function init() {
        this.reset();
        this.startStepping(1000, 'update');
    },
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.onLoad();
    },
        onKeyDown: function onKeyDown(evt) {
        var sig = evt.getKeyString();
    
        function selectNext(list) {
            var idx = list.selectedLineNo;
            list.saveSelectAt((idx+1) % (list.getList().length));
        }
    
        var sel = this.get('outputTypeSelectionList')
        switch(sig) {
            case 'Alt-Q': selectNext(this.get('querySelectionList')); evt.stop(); return true;
            case 'Alt-O': selectNext(this.get('outputTypeSelectionList')); evt.stop(); return true;
            case 'Alt-A': this.applyPressed(); evt.stop(); return true;
            case 'Alt-C': this.extractCommand(); evt.stop(); return true;
            case 'Alt-Up': this.focusMove(-1); evt.stop(); return true;
            case 'Alt-Down': this.focusMove(1); evt.stop(); return true;
            case 'F1': this.focusMove(undefined, 0); evt.stop(); return true;
            case 'F2': this.focusMove(undefined, 1); evt.stop(); return true;
            case 'F3': this.focusMove(undefined, 2); evt.stop(); return true;
            case 'F4': this.focusMove(undefined, 3); evt.stop(); return true;
            case 'F5': this.focusMove(undefined, 4); evt.stop(); return true;
            case 'Control-V': case 'PageDown':
                if (!this.get('output').isFocused()) {
                    this.get('output').scrollPage('down');
                    evt.stop(); return true;
                }
                break;
            case 'Alt-V': case 'PageUp':
                if (!this.get('output').isFocused()) {
                    this.get('output').scrollPage('up');
                    evt.stop(); return true;
                }
                break;
    
            default: return $super(evt);        
        }
    },
        onLoad: function onLoad() {
        this.ensureLibs(function(err) {
            if (err) {
                show("Error loading AST Editor: " + err);
            } else {
                alertOK('graspjs loaded');
                this.init();
            }
        });
    },
        onWindowGetsFocus: function onWindowGetsFocus() {
        this.get('searchInput').focus();
    },
        openOn: function openOn(codeeditor, thenDo) {
        this.ensureLibs(function(err) {
            if (err) thenDo && thenDo(err);
            else {
                this.init();
                this.state.target = codeeditor;
                thenDo && thenDo(null, this);
            }
        })
    },
        replaceInputChanged: function replaceInputChanged() {
        this.searchInputChanged();
    },
        reset: function reset() {
    
        this.getWindow().setTitle('AST Editor');
        this.getWindow().name = 'ASTEditor';
        this.name = 'ASTEditorPane';
    
        lively.bindings.noUpdate(function() {
            this.get('searchInput').setInput("");
            this.get('replaceInput').setInput("");
            this.get('output').textString = "";
    
            lively.bindings.connect(this.get('searchInput'), 'textString', this, 'searchInputChanged');
            lively.bindings.connect(this.get('replaceInput'), 'textString', this, 'replaceInputChanged');
            lively.bindings.connect(this.get('showTargetButton'), 'fire', this, 'showTargetPressed');
            lively.bindings.connect(this.get('setTargetButton'), 'fire', this, 'setTargetPressed');
            lively.bindings.connect(this.get('applyButton'), 'fire', this, 'applyPressed');
            lively.bindings.connect(this.get('aboutButton'), 'fire', this, 'aboutPressed');
            lively.bindings.connect(this.get('extractExpressionButton'), 'fire', this, 'extractCommand');
        
            lively.bindings.connect(this.get('querySelectionList'), 'selection', this, 'searchInputChanged');
        
            lively.bindings.connect(this.get('outputTypeSelectionList'), 'selection', this, 'searchInputChanged');
        
            this.get('querySelectionList').setList(['equery', 'squery']);
            this.get('outputTypeSelectionList').setList(['tree', 'ast', 'source', 'diff']);
        
        }.bind(this));
    
        this.doNotSerialize = ['state'];
        this.resetState();
    
        // this.getWindow().buildSpec().createMorph().openInWorld()
    },
        resetState: function resetState() {
        this.state = {
            target: null
        }
    },
        searchInputChanged: function searchInputChanged() {
    
        var self       = this;
        var search     = this.get('searchInput').getInput();
        var replace    = this.get('replaceInput').getInput();
        var outputMode = this.get('outputTypeSelectionList').selection || 'source';
        var queryMode  = this.get('querySelectionList').selection || 'equery';
        var code       = this.getTargetCode();
    
        if (!search || !search.length) return;
    
        try {
            var nodes = grasp.search(queryMode, search, code);
    
            if (!nodes.length) throw new Error('Nothing matched');
    
            switch (outputMode) {
                case 'tree':   printASTTree(); break;
                case 'source': printSource(); break;
                case 'ast':    printAST(); break;
                case 'diff':   printReplacementDiff(); break;
                default:       throw new Error('unknown output mode ' + outputMode);
            }
                
        } catch (e) { handleError(e); }
        
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    
        function printSource() {
            self.get('output').setTextMode("javascript");
            self.get('output').textString = Strings.format("// Found %s matches\n%s",
                nodes.length,
                nodes.map(function(n, i) {
                    return "// match " + i + ':\n' + code.slice(n.start, n.end);
                }).join('\n\n'));
        }
    
        function printAST() {
            self.get('output').setTextMode("json");
            self.get('output').textString = Strings.format("%s",
                nodes.map(function(n, i) {
                    return "// match " + i + ':\n' + Objects.inspect(n, {maxDepth: 3});
                }).join('\n\n\n'));
        }
    
        function printASTTree() {
            self.get('output').setTextMode("text");
    
            self.get('output').textString = Strings.format("// Found %s matches\n%s",
                nodes.length,
                nodes.map(function(n, i) {
                    acorn.walk.addSource(n, code.slice(n.start, n.end), false, true);
                    return "// match " + i + ':\n' + lively.ast.acorn.printAst(n, {printSource: true, printPositions: true});
                }).join('\n\n'));
        }    
    
        function printReplacementDiff() {
            var p = self.computePatch();
            self.get('output').setTextMode("diff");
            self.get('output').textString = p
        }    
        
        function handleError(e) {
            self.get('output').setTextMode("text");
            self.get('output').textString = String(e);
        }
    
    },
        setTargetPressed: function setTargetPressed() {
    
        var world = this.world(),
            self = this;
    
        alertOK('Click on the text to select');
    
        // ----
    
        function select() {
            var morph = world.hands[0].morphUnderMe();
            if (!morph || !morph.isCodeEditor) {
                show('invalid selection');
                return;
            }
            morph.show();
            alertOK((morph.name || morph) + " selected");
            self.state.target = morph;
            self.searchInputChanged();
        };
    
        (function() {
            lively.bindings.connect(world, 'onMouseUp', select, 'call', {
                removeAfterUpdate: true});
        }).delay(0.2);
    
    },
        showTargetPressed: function showTargetPressed() {
        show(this.state.target || 'no target');
    },
        update: function update() {
        var t = this.state.target;
        if (!t) return;
        if (this.state._lastLength !== t.textString.length) this.searchInputChanged();
        this.state._lastLength = t.textString.length;
    }
    }],
    targetMorph: {
        isMorphRef: true,
        name: "ASTEditorPane"
    },
    titleBar: "AST Editor"
});

Object.extend(lively.ide.tools.ASTEditor, {

    openOn: function(codeEditor, thenDo) {
        var win = lively.BuildSpec('lively.ide.tools.ASTEditor').createMorph()
        var ed = win.targetMorph;
        ed.openOn(codeEditor, thenDo);
        return win.openInWorldCenter().comeForward();
    }

});

}) // end of module
