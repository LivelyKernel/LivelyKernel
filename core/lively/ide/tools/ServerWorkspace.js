module('lively.ide.tools.ServerWorkspace').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.ide.tools.ServerWorkspace', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(605.0,302.0),
    _Position: lively.pt(2274.0,408.0),
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
    draggingEnabled: true,
    droppingEnabled: false,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "ServerWorkspace",
    prevDragPos: lively.pt(2751.0,439.0),
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(597.0,275.0),
        _FontSize: 12,
        _Position: lively.pt(4.0,22.0),
        _StyleSheet: "#ace-editor {\n\
        position: absolute;\n\
        top: 0;\n\
    	bottom: 0;\n\
    	left: 0;\n\
    	right: 0;\n\
    	font-family: Monaco,monospace;\n\
    }",
        _TextMode: "javascript",
        _Theme: "twilight",
        accessibleInInactiveWindow: true,
        className: "lively.morphic.CodeEditor",
        doNotSerialize: ["aceEditor","aceEditorAfterSetupCallbacks","savedTextString"],
        grabbingEnabled: false,
        layout: {
            resizeHeight: true,
            resizeWidth: true
        },
        sourceModule: "lively.ide.CodeEditor",
        submorphs: [],
        textMode: "javascript",
        textString: "// all this code is evaluated in the server context!\n\
    \n\
    // try to print it:\n\
    \n\
    process.env.WORKSPACE_LK",
        theme: "twilight",
        boundEval: function boundEval(string) {
        var nodejsServer = URL.create(Config.nodeJSURL).asDirectory().withFilename('NodeJSEvalServer/').asWebResource();
        return nodejsServer.post(string).content;
    }
    }],
    titleBar: "ServerWorkspace",
    withoutLayers: "[[GrabbingLayer]]"
});

}) // end of module