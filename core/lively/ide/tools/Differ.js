module('lively.ide.tools.Differ').requires('lively.persistence.BuildSpec', 'lively.ide.CommandLineInterface').toRun(function() {

lively.BuildSpec('lively.ide.tools.Differ', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(869.0,537.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(4.0,22.0),
    draggingEnabled: true,
    droppingEnabled: false,
    layout: {adjustForNewBounds: true},
    name: "TextDiffer",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(859.0,509.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(4.0,22.0),
        className: "lively.morphic.Box",
        grabbingEnabled: false,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        submorphs: [{
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(429.0,200),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(1.0,0.0),
            _TextMode: "text",
            _ShowGutter: false,
            _Theme: "twilight",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            grabbingEnabled: false,
            layout: {
                resizeHeight: false,
                resizeWidth: false,
                scaleHorizontal: true,
                scaleVertical: false
            },
            name: "a",
            sourceModule: "lively.ide.CodeEditor",
            theme: 'chrome',
            textString: "a"
        }, {
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _Extent: lively.pt(428.0,200),
            _FontSize: 12,
            _LineWrapping: false,
            _Position: lively.pt(430.4,-0.0),
            _ShowGutter: false,
            _TextMode: "text",
            accessibleInInactiveWindow: true,
            className: "lively.morphic.CodeEditor",
            grabbingEnabled: false,
            layout: {resizeHeight: false,resizeWidth: false,scaleHorizontal: true,scaleVertical: false},
            name: "b",
            sourceModule: "lively.ide.CodeEditor",
            theme: 'chrome',
            textString: "b",
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(429.0-100-5,204),
            className: "lively.morphic.Button",
            name: 'diffButton',
            droppingEnabled: false,
            grabbingEnabled: false,
            isPressed: false,
            label: "Diff",
            layout: {scaleHorizontal: true},
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
        doAction: function doAction() {
                this.get('TextDiffer').diffStrings(this.get('a').textString, this.get('b').textString);
            }
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(429.0 + 5,204),
            className: "lively.morphic.DropDownList",
            itemList: ['unified', 'chars','words','lines','css','wordsWithSpace'],
            name: "typeSelector",
            sourceModule: "lively.morphic.Lists",
            connectionRebuilder: function connectionRebuilder() {
                    lively.bindings.connect(this, "selection", this.getWindow(), "reDiff", {
                        converter: function(type) { return {type: type}},
                    });
                }
        },{
            _BorderColor: Color.rgb(204,0,0),
            _BorderRadius: 3,
            _Position: lively.pt(0, 227),
            _Extent: lively.pt(859.0,5),
            _Fill: Color.gray,
            className: "lively.morphic.HorizontalDivider",
            draggingEnabled: true,
            layout: { scaleHorizontal: true, scaleVertical: true },
            minHeight: 20,
            name: "midResizer",
            fixed: [], scalingAbove: [], scalingBelow: [],
            sourceModule: "lively.morphic.Widgets",
            setup: function setup() {
                this.scalingAbove.push(this.get('a'));
                this.scalingAbove.push(this.get('b'));
                this.scalingBelow.push(this.get('result'));
                this.fixed.push(this.get('typeSelector'));
                this.fixed.push(this.get('diffButton'));
            }
        }, {
            _BorderColor: Color.rgb(95,94,95),
            _BorderWidth: 1,
            _ClipMode: "auto",
            fixedWidth: true, fixedHeight: true,
            _Extent: lively.pt(857.0,275.0),
            _FontSize: 12,
            _Position: lively.pt(1.0,234.0),
            accessibleInInactiveWindow: true,
            className: "lively.morphic.Text",
            grabbingEnabled: false,
            layout: {resizeHeight: true,resizeWidth: true},
            name: "result",
            showJsDiff: function showJsDiff(jsDiffResult, type) {
                var textDiffSpec = jsDiffResult.reduce(function(diffResult, currentDiff) {
                    diffResult.string += currentDiff.value
                    var from = diffResult.pos, to = diffResult.pos = from + currentDiff.value.length;
                    if (currentDiff.added) {
                        diffResult.styles.push([from, to, {backgroundColor: Color.green, color: Color.white}])
                    } else if (currentDiff.removed) {
                        diffResult.styles.push([from, to, {backgroundColor: Color.red, color: Color.white}])
                    } else {
                        diffResult.styles.push([from, to, {backgroundColor: Color.white}])
                    }
                    return diffResult;
                }, {string: '', styles: [], pos: 0});
                this.setStringAndStyle(textDiffSpec.string, textDiffSpec.styles);
                if (type) lively.bindings.noUpdate(function() {
                    this.get('typeSelector').selectAllAt([this.get('typeSelector').itemList.indexOf(type)])
                }.bind(this));
            },
            setStringAndStyle: function setStringAndStyle(string, emphs) {
                this.textString = string;
                this.emphasizeRanges(emphs);
            }
        }],
        onKeyDown: function onKeyDown(evt) {
            if (evt.getKeyString() === 'Tab') {
                if (this.get('a').isFocused()) this.get('b').focus()
                else this.get('a').focus()
                evt.stop(); return true;
            }
            return false;
        },
        onWindowGetsFocus: function onWindowGetsFocus() {
            var toFocus, a = this.get('a'), b = this.get('b'), result = this.get('result');
            if (a.textString === "a") toFocus = a;
            else if (b.textString === "b") toFocus = b;
            else toFocus = result;
            toFocus.focus();
        }
    }],
    titleBar: "Differ",
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.get('midResizer').setup();
    },
    diffStrings: function diffStrings(stringA, stringB, options, thenDo) {
        // options = {
        //   max: NUMBER,
        //   type: 'chars'|'words'|'lines'|'css'|'wordsWithSpace'
        // }
        options = options || {};
        options.type = options.type || 'lines';
        this.get('a').textString = stringA;
        this.get('b').textString = stringB;
        this.get('result').textString = 'diffing...';
        if (options.type === 'unified') {
            this.unifiedDiff(stringA, stringB, options, thenDo);
        } else {
            this.diffWithJsDiff(stringA, stringB, options, thenDo);
        }
    },
    reDiff: function reDiff(options) {
        this.diffStrings(this.get('a').textString, this.get('b').textString, options);
    },
    unifiedDiff: function unifiedDiff(stringA, stringB, options, thenDo) {
        var resultText = this.get('result')
        lively.shell.diff(stringA, stringB, function(diff) {
            resultText.textString = diff;
            resultText.emphasizeRegex(/^-.*/gm, {backgroundColor: Color.red, color: Color.white});
            resultText.emphasizeRegex(/^\+.*/gm, {backgroundColor: Color.green, color: Color.white});
            thenDo && thenDo(null, diff);
        });
    },
    diffWithJsDiff: function diffWithJsDiff(stringA, stringB, options, thenDo) {
        var diffLibURL = URL.codeBase.withFilename("lib/jsdiff/jsdiff.js").toString();
        if (!JSLoader.isLoading(diffLibURL)) JSLoader.loadJs(diffLibURL, null, true);
        var type = options.type || 'lines',
            max = options.hasOwnProperty("max") ? options.max : (type === 'lines' ? 100000 : 5000),
            resultText = this.get('result');
        if (max) {
            stringA = stringA.truncate(max);
            stringB = stringB.truncate(max);
        }
        var diff = JsDiff['diff' + type.capitalize()](stringA, stringB);
        resultText.showJsDiff(diff, type);
        thenDo && thenDo(null, diff);
        return this;
    },
    diffFiles: function diffFiles(fnA, fnB, options, thenDo) {
        var stringA, stringB, self = this;
        lively.ide.CommandLineInterface.readFile(fnA, {}, function(cmd) { stringA = cmd.resultString(true); })
        lively.ide.CommandLineInterface.readFile(fnB, {}, function(cmd) { stringB = cmd.resultString(true); })
        Functions.waitFor(2000, function() { return !!stringA && !!stringB; }, function(timeout) {
            if (timeout) { self.get("result").setTextString('time out accessing ' + (!stringA ? fnA : fnB)); return; }
            self.diffStrings(stringA, stringB, options, thenDo);
        });
        return this;
    },
    diffURLs: function diffURLs(urlA, urlB, options, thenDo) {
        var stringA, stringB, self = this;
        new URL(urlA).asWebResource().beAsync().get().whenDone(function(content, status) { stringA = content; });
        new URL(urlB).asWebResource().beAsync().get().whenDone(function(content, status) { stringB = content; });
        Functions.waitFor(2000, function() { return !!stringA && !!stringB; }, function(timeout) {
            if (timeout) { self.get("result").setTextString('time out accessing ' + (!stringA ? urlA : urlB)); return; }
            self.diffStrings(stringA, stringB, options, thenDo);
        });
        return this;
    },
    diffJSON: function diffJSON(jsonA, jsonB, options, thenDo) {
        var jsoA = typeof jsonA === 'string' ? JSON.parse(jsonA) : jsonA,
            jsoB = typeof jsonB === 'string' ? JSON.parse(jsonB) : jsonB;
        return this.diffStrings(JSON.stringify(jsoA, null, 2), JSON.stringify(jsoB, null, 2), options, thenDo);
    },
    diffVersions: function diffVersions(urlOrPath, versionA, versionB, options, thenDo) {
        var strings = {}, self = this;
        function get(version, aORb) {
            lively.net.Wiki.getRecords({
                paths: [lively.net.Wiki.urlToPath(urlOrPath)],
                attributes: ['content'],
                version: version
            }, function(err, records) { strings[aORb] = err ? String(err) : records[0].content; });
        }
        get(versionA, 'a'); get(versionB, 'b');
        Functions.waitFor(20000, function() { return !!strings.a && !!strings.b; }, function(timeout) {
            if (timeout) { self.get("result").setTextString('time out accessing ' + urlOrPath + (!strings.a ? versionA : versionB)); return; }
            self.diffStrings(strings.a, strings.b, options, thenDo);
        });
        return this;
    }
});

function createDiffer() {
    return lively.BuildSpec('lively.ide.tools.Differ').createMorph().openInWorldCenter();
}

Object.extend(lively.ide, {
    diff: function(stringA, stringB, options, thenDo) { return createDiffer().diffStrings(stringA, stringB, options, thenDo); },
    diffURLs: function(urlA, urlB, options, thenDo) { return createDiffer().diffURLs(urlA, urlB, options, thenDo); },
    diffFiles: function(fileA, fileB, options, thenDo) { return createDiffer().diffFiles(fileA, fileB, options, thenDo); },
    diffJSON: function(jsonA, jsonB, options, thenDo) { return createDiffer().diffJSON(jsonA, jsonB, thenDo); },
    diffMorphs: function(morphA, morphB, options, thenDo) {
        var jsonA = morphA.copy(true), jsonB = morphB.copy(true);
        return lively.ide.diffJSON(jsonA, jsonB, options, thenDo);
    },
    diffVersions: function(urlOrPath, versionA, versionB, options, thenDo) { return createDiffer().diffVersions(urlOrPath, versionA, versionB, options, thenDo); },
});

}) // end of module