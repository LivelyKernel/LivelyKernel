module('lively.morphic.tools.PartsBin').requires('lively.PartsBin').toRun(function() {

lively.BuildSpec('lively.morphic.tools.PartsBin', {
    _BorderColor: Color.rgb(204,0,0),
    _Extent: lively.pt(778.8,513.2),
    _Position: lively.pt(143.0,93.0),
    cameForward: true,
    className: "lively.morphic.Window",
    collapsedExtent: null,
    collapsedTransform: null,
    contentOffset: lively.pt(4.0,22.0),
    doNotCopyProperties: [],
    doNotSerialize: [],
    draggingEnabled: true,
    expandedExtent: null,
    expandedTransform: null,
    highlighted: false,
    ignoreEventsOnExpand: false,
    layout: {
        adjustForNewBounds: true
    },
    name: "PartsBinBrowser",
    sourceModule: "lively.morphic.Widgets",
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _BorderWidth: 1,
        _Extent: lively.pt(770.8,487.2),
        _Fill: Color.rgb(245,245,245),
        _Position: lively.pt(4.0,22.0),
        allURLs: [URL.create("http://localhost:9001/PartsBin/2013-01-29-partsbin.updates"),URL.create("http://localhost:9001/PartsBin/2013-01-29-ww.updates"),URL.create("http://localhost:9001/PartsBin/AdvancedCodeEditor.html"),URL.create("http://localhost:9001/PartsBin/AdvancedCodeEditor.json"),URL.create("http://localhost:9001/PartsBin/AdvancedCodeEditor.metainfo"),URL.create("http://localhost:9001/PartsBin/BPCGrid.html"),URL.create("http://localhost:9001/PartsBin/BPCGrid.json"),URL.create("http://localhost:9001/PartsBin/BPCGrid.metainfo"),URL.create("http://localhost:9001/PartsBin/Character.html"),URL.create("http://localhost:9001/PartsBin/Character.json"),URL.create("http://localhost:9001/PartsBin/Character.metainfo"),URL.create("http://localhost:9001/PartsBin/CheapWorldLayout.html"),URL.create("http://localhost:9001/PartsBin/CheapWorldLayout.json"),URL.create("http://localhost:9001/PartsBin/CheapWorldLayout.metainfo"),URL.create("http://localhost:9001/PartsBin/ColorPickerField.html"),URL.create("http://localhost:9001/PartsBin/ColorPickerField.json"),URL.create("http://localhost:9001/PartsBin/ColorPickerField.metainfo"),URL.create("http://localhost:9001/PartsBin/GitControl.html"),URL.create("http://localhost:9001/PartsBin/GitControl.json"),URL.create("http://localhost:9001/PartsBin/GitControl.metainfo"),URL.create("http://localhost:9001/PartsBin/Rectangle.html"),URL.create("http://localhost:9001/PartsBin/Rectangle.json"),URL.create("http://localhost:9001/PartsBin/Rectangle.metainfo"),URL.create("http://localhost:9001/PartsBin/RedRectangle.html"),URL.create("http://localhost:9001/PartsBin/RedRectangle.json"),URL.create("http://localhost:9001/PartsBin/RedRectangle.metainfo"),URL.create("http://localhost:9001/PartsBin/ScribbleMaker.html"),URL.create("http://localhost:9001/PartsBin/ScribbleMaker.json"),URL.create("http://localhost:9001/PartsBin/ScribbleMaker.metainfo"),URL.create("http://localhost:9001/PartsBin/SoSaruGame.html"),URL.create("http://localhost:9001/PartsBin/SoSaruGame.json"),URL.create("http://localhost:9001/PartsBin/SoSaruGame.metainfo"),URL.create("http://localhost:9001/PartsBin/TestComment.html"),URL.create("http://localhost:9001/PartsBin/TestComment.json"),URL.create("http://localhost:9001/PartsBin/TestComment.metainfo"),URL.create("http://localhost:9001/PartsBin/TestComment1.html"),URL.create("http://localhost:9001/PartsBin/TestComment1.json"),URL.create("http://localhost:9001/PartsBin/TestComment1.metainfo"),URL.create("http://localhost:9001/PartsBin/TestObject.html"),URL.create("http://localhost:9001/PartsBin/TestObject.json"),URL.create("http://localhost:9001/PartsBin/TestObject.metainfo"),URL.create("http://localhost:9001/PartsBin/TextSelectionToolBox.html"),URL.create("http://localhost:9001/PartsBin/TextSelectionToolBox.json"),URL.create("http://localhost:9001/PartsBin/TextSelectionToolBox.metainfo"),URL.create("http://localhost:9001/PartsBin/TowerDefense.html"),URL.create("http://localhost:9001/PartsBin/TowerDefense.json"),URL.create("http://localhost:9001/PartsBin/TowerDefense.metainfo"),URL.create("http://localhost:9001/PartsBin/TravisResults.html"),URL.create("http://localhost:9001/PartsBin/TravisResults.json"),URL.create("http://localhost:9001/PartsBin/TravisResults.metainfo"),URL.create("http://localhost:9001/PartsBin/login.html"),URL.create("http://localhost:9001/PartsBin/login.json"),URL.create("http://localhost:9001/PartsBin/login.metainfo"),URL.create("http://localhost:9001/PartsBin/logout.png.html"),URL.create("http://localhost:9001/PartsBin/logout.png.json"),URL.create("http://localhost:9001/PartsBin/logout.png.metainfo"),URL.create("http://localhost:9001/PartsBin/oneImage.png.html"),URL.create("http://localhost:9001/PartsBin/oneImage.png.json"),URL.create("http://localhost:9001/PartsBin/oneImage.png.metainfo"),URL.create("http://localhost:9001/PartsBin/pages_album1.png.html"),URL.create("http://localhost:9001/PartsBin/pages_album1.png.json"),URL.create("http://localhost:9001/PartsBin/pages_album1.png.metainfo"),URL.create("http://localhost:9001/PartsBin/pages_album_1.png.html"),URL.create("http://localhost:9001/PartsBin/pages_album_1.png.json"),URL.create("http://localhost:9001/PartsBin/pages_album_1.png.metainfo"),URL.create("http://localhost:9001/PartsBin/pin.html"),URL.create("http://localhost:9001/PartsBin/pin.json"),URL.create("http://localhost:9001/PartsBin/pin.metainfo")],
        categoryName: "Basic",
        className: "lively.morphic.Box",
        connections: {
            toggleMorePane: {}
        },
        doNotCopyProperties: [],
        doNotSerialize: ["categories"],
        isCopyMorphRef: true,
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        morphRefId: 1,
        name: "PartsBinBrowser",
        selectedPartItem: null,
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(66,66,66),
            _BorderRadius: 6.12,
            _BorderWidth: 2.294,
            _Extent: lively.pt(373.0,433.0),
            _Fill: Color.rgb(235,235,235),
            _Position: lively.pt(390.6,38.0),
            _Visible: false,
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            layout: {
                moveHorizontal: true
            },
            name: "morePane",
            sourceModule: "lively.morphic.Core",
            submorphs: [{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(58.0,21.0),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(137.7,393.9),
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                label: "move",
                layout: {
                    moveVertical: true
                },
                lighterFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(250,250,250),
                offset: 0
              },{
                color: Color.rgb(232,232,232),
                offset: 0.4
              },{
                color: Color.rgb(232,232,232),
                offset: 0.6
              },{
                color: Color.rgb(248,248,248),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                name: "movePartButton",
                normalFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                padding: lively.rect(5,0,0,0),
                showsMorphMenu: true,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyMoveSelectedPartItem", {});
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(66.0,21.0),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(70.1,393.9),
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                isPressed: false,
                label: "remove",
                layout: {
                    moveVertical: true
                },
                lighterFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(250,250,250),
                offset: 0
              },{
                color: Color.rgb(232,232,232),
                offset: 0.4
              },{
                color: Color.rgb(232,232,232),
                offset: 0.6
              },{
                color: Color.rgb(248,248,248),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                name: "removePartButton",
                normalFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                padding: lively.rect(5,0,0,0),
                showsMorphMenu: true,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyRemoveSelectedPartItem", {});
            }
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(50.0,21.0),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(19.2,393.9),
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                isPressed: false,
                label: "load",
                layout: {
                    moveVertical: true
                },
                lighterFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(250,250,250),
                offset: 0
              },{
                color: Color.rgb(232,232,232),
                offset: 0.4
              },{
                color: Color.rgb(232,232,232),
                offset: 0.6
              },{
                color: Color.rgb(248,248,248),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                name: "loadPartButton",
                normalFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                padding: lively.rect(5,0,0,0),
                showsMorphMenu: true,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "loadAndOpenSelectedPartItem", {});
            }
            },{
                _ClipMode: "hidden",
                _Extent: lively.pt(258.0,17.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 12,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 258,
                _MinTextWidth: 258,
                _Position: lively.pt(22.1,8.6),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,16,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                fixedHeight: true,
                fixedWidth: true,
                name: "selectedPartName",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "nothing selected"
            },{
                _ClipMode: "scroll",
                _Extent: lively.pt(330.8,122.0),
                _Fill: Color.rgb(243,243,243),
                _FontSize: 10,
                _Position: lively.pt(20.0,56.3),
                className: "lively.morphic.List",
                doNotCopyProperties: [],
                doNotSerialize: [],
                itemList: [],
                layout: {
                    resizeWidth: true
                },
                name: "selectedPartVersions",
                sourceModule: "lively.morphic.Core",
                submorphs: []
            },{
                _BorderColor: Color.rgb(192,192,192),
                _BorderRadius: 7.400000000000001,
                _BorderWidth: 1.4800000000000002,
                _ClipMode: "auto",
                _Extent: lively.pt(333.0,70.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 11,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 315.04,
                _MinTextWidth: 315.04,
                _Position: lively.pt(20.0,180.0),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,0,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                fixedHeight: true,
                fixedWidth: true,
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "selectedPartComment",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "savedTextString", this.get("PartsBinBrowser"), "saveCommentForSelectedPartItem", {});
            }
            },{
                _Align: "left",
                _ClipMode: "hidden",
                _Extent: lively.pt(265.0,20.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 12,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 265,
                _MinTextWidth: 265,
                _Position: lively.pt(22.4,30.9),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,0,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                fixedHeight: true,
                fixedWidth: true,
                name: "selectedPartSpaceName",
                sourceModule: "lively.morphic.TextCore",
                submorphs: []
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(85.0,21.0),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(250,250,250),
                offset: 0
              },{
                color: Color.rgb(232,232,232),
                offset: 0.4
              },{
                color: Color.rgb(232,232,232),
                offset: 0.6
              },{
                color: Color.rgb(248,248,248),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(196.0,393.0),
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                label: "copy",
                layout: {
                    moveVertical: true
                },
                lighterFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(250,250,250),
                offset: 0
              },{
                color: Color.rgb(232,232,232),
                offset: 0.4
              },{
                color: Color.rgb(232,232,232),
                offset: 0.6
              },{
                color: Color.rgb(248,248,248),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                name: "copyPartButton",
                normalFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                padding: lively.rect(5,0,0,0),
                showsMorphMenu: true,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: true,
                connectionRebuilder: function connectionRebuilder() {
                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyMoveSelectedPartItem", {});
                lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "interactivelyCopySelectedPartItem", {});
            }
            },{
                _Extent: lively.pt(67.0,25.0),
                _FontFamily: "Arial, sans-serif",
                _FontSize: 9,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 67,
                _MinTextWidth: 67,
                _Position: lively.pt(289.0,31.0),
                _TextColor: Color.rgb(64,64,64),
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,10,{
                    fontWeight: "normal",
                    italics: "normal",
                    uri: "http://www.lively-kernel.org/viral?part=DropDownList&path=PartsBin/Inputs/"
                }]],
                fixedWidth: true,
                name: "shareLink",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                textString: "Share Link"
            },{
                _BorderColor: Color.rgb(189,190,192),
                _BorderRadius: 5,
                _BorderWidth: 1,
                _Extent: lively.pt(64.4,21.7),
                _Fill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                _Position: lively.pt(285.0,394.0),
                className: "lively.morphic.Button",
                doNotCopyProperties: [],
                doNotSerialize: [],
                isPressed: false,
                label: "modules",
                layout: {
                    moveVertical: true
                },
                lighterFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(250,250,250),
                offset: 0
              },{
                color: Color.rgb(232,232,232),
                offset: 0.4
              },{
                color: Color.rgb(232,232,232),
                offset: 0.6
              },{
                color: Color.rgb(248,248,248),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                name: "editModulesButton",
                normalFill: lively.morphic.Gradient.create({
              stops: [{
                color: Color.rgb(245,245,245),
                offset: 0
              },{
                color: Color.rgb(209,209,209),
                offset: 0.4
              },{
                color: Color.rgb(209,209,209),
                offset: 0.6
              },{
                color: Color.rgb(240,240,240),
                offset: 1
              }],
              type: "linear",
              vector: lively.rect(0,0,0,1)
            }),
                padding: lively.rect(5,0,0,0),
                showsMorphMenu: true,
                sourceModule: "lively.morphic.Widgets",
                submorphs: [],
                toggle: false,
                value: false
            },{
                _BorderColor: Color.rgb(169,169,169),
                _BorderRadius: 7.405,
                _BorderWidth: 1,
                _ClipMode: "auto",
                _Extent: lively.pt(333.0,124.0),
                _FontFamily: "Monaco,monospace",
                _FontSize: 8,
                _HandStyle: null,
                _InputAllowed: true,
                _MaxTextWidth: 323,
                _MinTextWidth: 323,
                _Position: lively.pt(21.2,257.9),
                _TextColor: Color.rgb(64,64,64),
                _WordBreak: "break-all",
                accessibleInInactiveWindow: true,
                allowInput: true,
                className: "lively.morphic.Text",
                doNotCopyProperties: [],
                doNotSerialize: [],
                emphasis: [[0,0,{
                    fontWeight: "normal",
                    italics: "normal"
                }]],
                evalEnabled: false,
                fixedHeight: true,
                fixedWidth: true,
                lastSyntaxHighlightTime: 1328037408581,
                layout: {
                    resizeHeight: true,
                    resizeWidth: true
                },
                name: "CommitLog",
                sourceModule: "lively.morphic.TextCore",
                submorphs: [],
                syntaxHighlightingWhileTyping: false
            }]
        },{
            _BorderColor: Color.rgb(211,211,211),
            _BorderWidth: 1.258,
            _ClipMode: "auto",
            _Extent: lively.pt(143.0,421.2),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(9.0,57.0),
            className: "lively.morphic.List",
            doNotCopyProperties: [],
            doNotSerialize: [],
            itemList: [],
            layout: {
                resizeHeight: true
            },
            name: "categoryList",
            selectedLineNo: 4,
            selection: "Basic",
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("PartsBinBrowser"), "categoryName", {});
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Fill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(221,221,221),
            offset: 0.3
          },{
            color: Color.rgb(221,221,221),
            offset: 0.7
          },{
            color: Color.rgb(204,204,204),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            _Position: lively.pt(9.9,34.6),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "⟳",
            lighterFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(250,250,250),
            offset: 0
          },{
            color: Color.rgb(232,232,232),
            offset: 0.4
          },{
            color: Color.rgb(232,232,232),
            offset: 0.6
          },{
            color: Color.rgb(248,248,248),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            name: "reloadButton",
            normalFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            padding: lively.rect(5,0,0,0),
            showsMorphMenu: true,
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "reloadEverything", {});
        }
        },{
            _ClipMode: "scroll",
            _Extent: lively.pt(607.6,437.2),
            _Fill: Color.rgb(255,255,255),
            _Position: lively.pt(156.0,38.0),
            className: "lively.morphic.Box",
            doNotCopyProperties: [],
            doNotSerialize: [],
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "partsBinContents",
            selectedItem: "PartsItem(DropDownList,PartsSpace(PartsBin/Inputs/))",
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            addPartItemAsync: function addPartItemAsync() {
            if (!this.partItemsToBeAdded || this.partItemsToBeAdded.length == 0) {
                this.stopAddingPartItemsAsync();
                return;
            }
        
            var partItem = this.partItemsToBeAdded.shift();
            var morph = partItem.asPartsBinItem();
            this.addMorph(morph);
            this.adjustForNewBounds() 
        },
            adjustForNewBounds: function adjustForNewBounds() {
        /*
            this.adjustForNewBounds()
        */
            $super();
            var bounds = this.innerBounds(),
            	x = bounds.x,
        		y = bounds.y,
        		width = bounds.width;
        	this.submorphs.forEach(function(morph) {
        		var extent = morph.getExtent();
        		if (extent.x + x > width) {
        			x = 0;
        			y += extent.y + 5;
        		}
        		morph.setPosition(pt(x,y))
        		x += extent.x + 5;
        	})
        },
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selectedItem", this.get("PartsBinBrowser"), "setSelectedPartItem", {});
        },
            selectPartItem: function selectPartItem(item) {
        	this.selectedItem = item && item.partItem;
        	this.submorphs.without(item).invoke('showAsNotSelected');
        },
            startAddingPartItems: function startAddingPartItems(partItems) {
            this.partItemsToBeAdded = partItems.clone();
            this.startStepping(0, 'addPartItemAsync')
        },
            stopAddingPartItemsAsync: function stopAddingPartItemsAsync() {
            this.stopStepping();
            delete this.partItemsToBeAdded;
        },
            unselectAll: function unselectAll() {
        	this.submorphs.invoke('showAsNotSelected');
        }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Fill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            _Position: lively.pt(50.9,34.6),
            _StyleClassNames: ["Morph","Button"],
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "-",
            layout: {
                moveVertical: false
            },
            lighterFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(250,250,250),
            offset: 0
          },{
            color: Color.rgb(232,232,232),
            offset: 0.4
          },{
            color: Color.rgb(232,232,232),
            offset: 0.6
          },{
            color: Color.rgb(248,248,248),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            name: "removeCategoryButton",
            normalFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "onFire", {});
        },
            onFire: function onFire() {
            	this.get('PartsBinBrowser').removeCategoryInteractively()
            }
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(20.0,20.0),
            _Fill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            _Position: lively.pt(30.9,34.6),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "+",
            layout: {
                moveVertical: false
            },
            lighterFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(250,250,250),
            offset: 0
          },{
            color: Color.rgb(232,232,232),
            offset: 0.4
          },{
            color: Color.rgb(232,232,232),
            offset: 0.6
          },{
            color: Color.rgb(248,248,248),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            name: "addCategoryButton",
            normalFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "onFire", {});
        },
            onFire: function onFire() {
            	this.get('PartsBinBrowser').addCategoryInteractively()
            }
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 2,
            _BorderWidth: 1,
            _Extent: lively.pt(552.9,17.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 9,
            _HandStyle: null,
            _InputAllowed: true,
            _Position: lively.pt(155.0,15.0),
            _TextColor: Color.rgb(64,64,64),
            allowInput: true,
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,0,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            fixedHeight: true,
            fixedWidth: true,
            isInputLine: true,
            layout: {
                resizeWidth: true
            },
            name: "searchText",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "savedTextString", this.get("PartsBinBrowser"), "search", {});
        }
        },{
            _Extent: lively.pt(168.0,15.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 9,
            _HandStyle: null,
            _InputAllowed: true,
            _MaxTextWidth: 168,
            _MinTextWidth: 168,
            _Position: lively.pt(154.8,0.1),
            _TextColor: Color.rgb(64,64,64),
            allowInput: true,
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,6,{
                fontWeight: "normal",
                italics: "italic"
            }]],
            fixedWidth: true,
            name: "Text4",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "search"
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(45.8,20.0),
            _Fill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            _Position: lively.pt(718.4,14.0),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "more",
            layout: {
                moveHorizontal: true
            },
            lighterFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(250,250,250),
            offset: 0
          },{
            color: Color.rgb(232,232,232),
            offset: 0.4
          },{
            color: Color.rgb(232,232,232),
            offset: 0.6
          },{
            color: Color.rgb(248,248,248),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            name: "moreButton",
            normalFill: lively.morphic.Gradient.create({
          stops: [{
            color: Color.rgb(245,245,245),
            offset: 0
          },{
            color: Color.rgb(209,209,209),
            offset: 0.4
          },{
            color: Color.rgb(209,209,209),
            offset: 0.6
          },{
            color: Color.rgb(240,240,240),
            offset: 1
          }],
          type: "linear",
          vector: lively.rect(0,0,0,1)
        }),
            padding: lively.rect(5,0,0,0),
            showsMorphMenu: true,
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("PartsBinBrowser"), "toggleMorePane", {});
        }
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(142.0,19.0),
            _Fill: Color.rgb(243,243,243),
            _Position: lively.pt(8.9,12.6),
            className: "lively.morphic.DropDownList",
            doNotCopyProperties: [],
            doNotSerialize: [],
            droppingEnabled: true,
            itemList: [],
            name: "PartsBinURLChooser",
            selectOnMove: false,
            selectedLineNo: 0,
            selection: URL.create("http://localhost:9001/PartsBin/"),
            sourceModule: "lively.morphic.Core",
            submorphs: [],
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "selection", this.get("PartsBinBrowser"), "setPartsBinURL", {});
        },
            reset: function reset() {
            this.name = "PartsBinURLChooser";
        }
        }],
        url: null,
        addCategory: function addCategory(categoryName, doNotUpdate) {
        if (!categoryName.startsWith("*")) {
            var url = this.partsBinURL().withFilename(categoryName);
            this.addExternalCategory(categoryName, url, true);
        } else {
            this.categories[categoryName] = {isSpecialCategory: true};
            if (!doNotUpdate) {
                this.updateCategoryList(categoryName);
            }
        }
    },
        addCategoryInteractively: function addCategoryInteractively() {
        var partsBin = this, world = this.world();
        world.prompt('Name of new category?', function(categoryName) {
            if (!categoryName || categoryName == '') {
    	   alert('no category created!')
    	   return;
    	}
            partsBin.addCategory(categoryName)
        });
    },
        addExternalCategory: function addExternalCategory(categoryName, url, createPath) {
        url = url.asDirectory();
        this.categories[categoryName] = url;
        if (createPath) {
            this.getPartsSpaceForCategory(categoryName).ensureExistance();
        }
        this.updateCategoryList(categoryName)
    },
        addMorphsForPartItems: function addMorphsForPartItems(partItems, doNotSort) {
        this.removeParts();
        if (!doNotSort) {
            partItems = partItems.sortBy(function(ea) {
                return ea.name.toLowerCase() 
            });
        }
    
        var pContents = this.get('partsBinContents');
        pContents.stopAddingPartItemsAsync();
        pContents.startAddingPartItems(partItems);
    },
        addPartsFromURLs: function addPartsFromURLs(urls) {
        var partsBin = this, partItems = [];
        urls.forEach(function(ea) {
            var partPath = ea.saveRelativePathFrom(URL.root),
                match = partPath.match(/(.*\/)(.*).json/);
            if (match)
                partItems.push(lively.PartsBin.getPartItem(match[2], match[1]));
        });
        partsBin.addMorphsForPartItems(partItems, true);
    },
        addPartsOfCategory: function addPartsOfCategory(categoryName) {
        var partsSpace = this.getPartsSpaceForCategory(categoryName);
        connect(partsSpace, 'partItems', this, 'addMorphsForPartItems', {
    	converter: function(partItemObj) { return Properties.ownValues(partItemObj) }})
        partsSpace.load(true);
    },
        commitLogString: function commitLogString(metaInfo) {
        if (!metaInfo.changes) return "";
        return metaInfo.changes
            .reverse()
            .collect(function(ea) {
                return Strings.format("%s %s: \n    %s\n\n",
                    ea.date.format("yyyy-mm-dd HH:MM") , 
                    ea.author, (ea.message || "no comment"));
            })
            .join('');
    },
        connectionRebuilder: function connectionRebuilder() {
        lively.bindings.connect(this, "categoryName", this, "loadPartsOfCategory", {});
    },
        defaultPartsBinURL: function defaultPartsBinURL() {
        return new URL(Config.rootPath).withFilename('PartsBin/');
    },
        doSearch: function doSearch() {
        if (URL.root.hostname !== this.partsBinURL().hostname) {
            show('Search not available.'); return; }
        
            this.showMsg("searching...");
            var pb = this;
            var searchString = this.get('searchText').textString;
            if (!searchString || searchString.length === 0) return;
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            // find parts via cmdline
            var partsBinPath = this.partsBinURL().relativePathFrom(URL.root),
                findPath = "$WORKSPACE_LK/" + partsBinPath.replace(/\/\//g, '\/');
            function doCommandLineSearch(next, searchString) {
                    var cmdTemplate = "find %s "
                                    + "\\( -name node_modules -o -name '.svn' -o -name '.git' \\) -type d -prune "
                                    + "-o -type f -iname '*%s*.json*' -print",
                    cmd = Strings.format(cmdTemplate, findPath, searchString);
                lively.require('lively.ide.CommandLineInterface').toRun(function() {
                    lively.shell.exec(cmd, next);
                });
            }
            function processResult(next, searchCmd) {
                if (searchCmd.getCode()) {
                    pb.showMsg('Search failure:\n' + searchCmd.getStderr);
                    next([]);
                    return;
                }
                var lines = Strings.lines(searchCmd.getStdout());
                var partItemURLs = lines.map(function(line) {
                    line = line.replace(/\/\//g, '\/') // double path slashes
                    var partPath = line.split(partsBinPath).last();
                    return pb.partsBinURL().withFilename(partPath);
                });
                next(partItemURLs)
            }
            function listPartItems(partItemURLs) {
                pb.addPartsFromURLs(partItemURLs);
            }
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        doCommandLineSearch(processResult.curry(listPartItems), searchString);
    },
        ensureCategories: function ensureCategories() {
        if (!this.categories)
            this.categories = {uncategorized: 'PartsBin/'};
    },
        getPartsSpaceForCategory: function getPartsSpaceForCategory(categoryName) {
        var url = this.getURLForCategoryNamed(categoryName);
        return lively.PartsBin.partsSpaceWithURL(url);
    },
        getURLForCategoryNamed: function getURLForCategoryNamed(categoryName) {
        this.ensureCategories()
    
        var relative = this.categories[categoryName];
        if (!relative) return null;
        return URL.ensureAbsoluteCodeBaseURL(relative).withRelativePartsResolved()
    },
        interactivelyCopySelectedPartItem: function interactivelyCopySelectedPartItem(partMorph) {
        // FIXME duplication with interactivelyMoveSelectedPartItem
        var partItem = this.selectedPartItem, categories = this.categories, self = this;
        if (!partItem) { alert('no item selected'); return }
        var items = Properties.own(categories).sort()
                .reject(function(ea) { return ea.startsWith("*") || ea === self. categoryName})
                .collect(function(catName) {
            return [catName, function() {
                var url = new URL(categories[catName]);
                var partsSpace = lively.PartsBin.partsSpaceWithURL(url)
                partItem.copyToPartsSpace(partsSpace);
                alertOK('Copied ' + partItem.name + ' to ' + url);
            }]
        })
        lively.morphic.Menu.openAtHand('Select category', items);
    },
        interactivelyMoveSelectedPartItem: function interactivelyMoveSelectedPartItem(partMorph) {
        var partItem = this.selectedPartItem, categories = this.categories, self = this;
        if (!partItem) { alert('no item selected'); return }
        var items = Properties.own(categories).sort()
                .reject(function(ea) { return ea.startsWith("*") || ea === self. categoryName})
                .collect(function(catName) {
            return [catName, function() {
                var url = new URL(categories[catName]);
                var partsSpace = lively.PartsBin.partsSpaceWithURL(url)
                partItem.moveToPartsSpace(partsSpace);
                self.reloadEverything();
                alertOK('Moved ' + partItem.name + ' to ' + url);
            }]
        })
        lively.morphic.Menu.openAtHand('Select category', items);
    },
        interactivelyRemoveSelectedPartItem: function interactivelyRemoveSelectedPartItem(partMorph) {
        var item = this.selectedPartItem;
        if (!item) return;
        this.world().confirm("really delete " + item.name + " in PartsBin?", function(answer) {
    	if (!answer) return;
    	item.del();
    	this.reloadEverything();
    	alertOK("deleted " + item.name);
        }.bind(this))
    },
        loadAndOpenSelectedPartItem: function loadAndOpenSelectedPartItem(partMorph) {
        var item = this.selectedPartItem;
        if (!item) return;
        connect(item, 'part', this, 'openPart');
        var selectedVersion = this.get('selectedPartVersions').selection,
    	rev = selectedVersion ? selectedVersion.rev : null;
        cop.withoutLayers([PartCachingLayer], function() {
            item.loadPart(true, null, rev);
        })
        alert('loading ' + item.name + '...');
    },
        loadPartsOfCategory: function loadPartsOfCategory(categoryName) {
        this.removeParts();
        this.setSelectedPartItem(null);
        if (!categoryName) return;
        var webR;
        if (categoryName == "*all*") {
            this.showMsg("loading all...");
            webR = new WebResource(this.partsBinURL()).noProxy().beAsync();
            lively.bindings.connect(webR, 'subDocuments', this, 'onLoadAll');
            webR.getSubElements(10)
        } else if (categoryName == "*latest*") {
            this.showMsg("loading latest...");
            var partsbinDir = this.partsBinURL().saveRelativePathFrom(URL.root);
            lively.ide.CommandLineSearch.findFiles('*.json', {rootDirectory: partsbinDir}, function(result) {
                result = result.sortByKey('lastModified').reverse().slice(0,20);
                this.onLoadLatest(result);
            }.bind(this));
        } else if (categoryName == "*search*") {
            this.doSearch();
        } else {
            this.addPartsOfCategory(categoryName);
        }
    },
        makeUpPartNameFor: function makeUpPartNameFor(name) {
            if (!$morph(name)) return name;
            var i = 2;
            while($morph(name + i)) { i++ }
            return name + i;
        },
        onLoad: function onLoad() {
        this.updatePartsBinURLChooser();
        this.get("PartsBinURLChooser").selectAt(0);
    },
        onLoadAll: function onLoadAll(subDocuments) {
             // alertOK("load all " + subDocuments.length)
             var all = subDocuments.invoke('getURL')
             .select(function(ea) {return ea.filename().endsWith(".json")})
             .sortBy(function(ea) {return ea.filename()});
             
             this.addPartsFromURLs(all)         
        },
        onLoadLatest: function onLoadLatest(latestFiles) {
            var latestURLs = latestFiles.pluck('path').map(function(path) { return URL.root.withFilename(path); });
            this.addPartsFromURLs(latestURLs);
        },
        openPart: function openPart(partMorph) {
            partMorph.setName(this.makeUpPartNameFor(partMorph.getName()));
            lively.morphic.World.current().firstHand().grabMorph(partMorph, null);
            if(partMorph.onCreateFromPartsBin) partMorph.onCreateFromPartsBin();
            partMorph.setPosition(pt(0,0));
        },
        partsBinURL: function partsBinURL() {
            if (this.url) { return this.url; }
            return this.defaultPartsBinURL();
        },
        reloadEverything: function reloadEverything() {
        this.setSelectedPartItem(null);
        this.updateCategoriesDictFromPartsBin();
        this.addCategory("*latest*", true);
        this.addCategory("*all*", true);
        this.addCategory("*search*", true);
        this.updatePartsBinURLChooser();
    },
        removeCategory: function removeCategory(categoryName) {
        var url = this.getURLForCategoryNamed(categoryName);
        if (!url) {
            alert('No category ' + categoryName + ' exists! Doing nothing')
    	return;
        }
        var webR = new WebResource(url);
        if (!webR.exists()) {
            alert('Does not exist: ' + url);
    	delete this.categories[categoryName];
    	lively.PartsBin.removePartsSpace(name);
    	this.updateCategoryList();
    	return
        }
        webR.getSubElements()
        if (!webR.subDocuments || webR.subDocuments.length > 0 ||
            !webR.subCollections || webR.subCollections.length > 0) {
            alert('Will not remove directory ' + url + ' because it is not empty')
        } else {
            webR.del();
            alertOK('Removed ' + categoryName + ' url ' + url);
        }
        delete this.categories[categoryName];
        lively.PartsBin.removePartsSpace(name);
        this.updateCategoryList();
    },
        removeCategoryInteractively: function removeCategoryInteractively() {
        var partsBin = this, world = this.world();
        world.confirm('Really remove ' + this.categoryName + '?', function(result) {
    	if (!result) {
    	   alert('no category removed!')
    	   return;
    	}
    	partsBin.removeCategory(partsBin.categoryName)
        });	
    },
        removeParts: function removeParts() {
        this.get('partsBinContents').submorphs.clone().invoke('remove');
    },
        reset: function reset() {
        // this.get("PartsBinURLChooser").showHalos()
        this.connections = {toggleMorePane: {}};
        this.setSelectedPartItem(null);
        delete this.categories;
        this.getPartsBinMetaInfo().requiredModules = ['lively.PartsBin'];
        this.get('categoryList').updateList([]);
        this.get('partsBinContents').removeAllMorphs();
        this.get('searchText').setTextString("");
        this.get("PartsBinURLChooser").setList([]);
        lively.bindings.connect(this.get("PartsBinURLChooser"), 'selection', this, 'setPartsBinURL');
        this.url = null;
    },
        saveCommentForSelectedPartItem: function saveCommentForSelectedPartItem(comment) {
        if (!this.selectedPartItem) {
    	alert('no part item selected!')
    	return;
        }
        var metaInfo = this.selectedPartItem.getMetaInfo();
        metaInfo.setComment(comment);
        this.selectedPartItem.uploadMetaInfoOnly();
    },
        search: function search(searchString) {
        // triggers search in this.loadPartsOfCategory through connection
        this.get('categoryList').setSelection("*search*");
    },
        setMetaInfoOfSelectedItem: function setMetaInfoOfSelectedItem(metaInfo) {
        var comment = (metaInfo && metaInfo.getComment()) ||
            'No comment yet';
        this.get('CommitLog').setTextString(this.commitLogString(metaInfo))
    
    
        this.get('selectedPartComment').textString = comment;
    },
        setPartsBinURL: function setPartsBinURL(url) {
        this.reset();
        lively.PartsBin.partSpaces = {};
        this.url = url;
        this.reloadEverything();
    },
        setSelectedPartItem: function setSelectedPartItem(item) {
        this.selectedPartItem = item;
        this.get('selectedPartComment').textString = '';
        this.get('selectedPartVersions').updateList(item ? ['Loading versions...']: []);
        this.get('selectedPartVersions').setSelection(null);
        if (!item) {
            this.get('selectedPartName').textString = 'nothing selected'
            this.get('selectedPartSpaceName').textString = ''
    	return;
        }
        this.get('selectedPartName').textString = item.name
        this.get('selectedPartSpaceName').textString = item.partsSpaceName
    
        // load versions
        connect(item, 'partVersions', this, 'setSelectedPartVersions');
        item.loadPartVersions(true);
    
        // load meta info
        connect(item, 'loadedMetaInfo', this, 'setMetaInfoOfSelectedItem');
        
        this.setShareLink(item);
    
        item.loadPartMetaInfo(true);
    },
        setSelectedPartVersions: function setSelectedPartVersions(versions) {
        // alertOK("set versions:" + versions.length)
        var list = versions.collect(function(ea) {
            return { 
                string: '' + ea.date.format("yyyy-mm-dd HH:MM") 
                    + " " + ea.author + " (" + ea.rev + ")", 
                value: ea, isListItem: true}
        })
        this.get('selectedPartVersions').updateList(list)
    },
        setShareLink: function setShareLink(partItem) {
        var linkText = this.get('shareLink');
        linkText.setTextString('Share Link');
        var url = 'http://www.lively-kernel.org/viral?part='
            + partItem.name + '&path=' + partItem.partsSpaceName;
        linkText.emphasizeAll({uri: url});
    },
        setupConnections: function setupConnections() {
        connect(this.closeButton, 'fire', this, 'remove')
        connect(this.addCategoryButton, 'fire', this, 'addCategoryInteractively')
        connect(this.get('removeCategoryButton'), 'fire', this, 'removeCategoryInteractively')
        connect(this.get('categoryList'), 'selection', this, 'categoryName')
        connect(this, 'categoryName', this, 'loadPartsOfCategory')
    
        connect(this.get('partsBinContents'), 'selectedItem', this, 'setSelectedPartItem')
    
        connect(this.get('reloadButton'), "fire", this, "reloadEverything")
    
        connect(this.get('loadPartButton'), "fire", this, "loadAndOpenSelectedPartItem")
    
        connect(this.get('removePartButton'), "fire", this, "interactivelyRemoveSelectedPartItem")
    
        connect(this.get('movePartButton'), "fire", this, "interactivelyMoveSelectedPartItem")
        connect(this.get('copyPartButton'), "fire", this, "interactivelyCopySelectedPartItem")
    
        connect(this.get('selectedPartComment'), "savedTextString", this, "saveCommentForSelectedPartItem")
    },
        showCommits: function showCommits() {
        if (!this.selectedPartItem) {
            alert('nothing selected');
            return;
        }
        var metaInfo = this.selectedPartItem.loadedMetaInfo;
        this.world().addTextWindow({
            title: 'Commits of ' + metaInfo.partName,
            content: this.commitLogString(metaInfo)
        });
    },
        showMsg: function showMsg(string) {
        var label = new lively.morphic.Text(new Rectangle(0,0,200,30), string);
        label.applyStyle({fill: null, borderWidth: 0})
        this.get('partsBinContents').addMorph(label)
    },
        toggleMorePane: function toggleMorePane() {
        var pane = this.get('morePane');
            moveOffset = pane.getExtent().withY(0),
            steps = 5, timePerStep = 10,
            btn = pane.get('moreButton');
        if (pane.isVisible()) {
            var dest = pane.getPosition().addPt(moveOffset.negated());
            pane.animatedInterpolateTo(dest, steps, timePerStep, function() {
                btn.setLabel('more')
                pane.setVisible(false)
            });
    
        } else {
            btn.setLabel('hide')
            pane.setVisible(true)
            this.addMorphBack(pane);
            pane.align(
                pane.bounds().topRight(), 
                this.get('partsBinContents').bounds().topRight());
            // move it so that it is completely visible
            var dest = pane.getPosition().addPt(moveOffset);
            pane.animatedInterpolateTo(dest, steps, timePerStep, Functions.Null);
        }
    },
        updateCategoriesDictFromPartsBin: function updateCategoriesDictFromPartsBin() {
        this.ensureCategories();
        var webR = new WebResource(this.partsBinURL());
        webR.noProxy().beAsync();
    
        var callback = function(collections) {
            collections.forEach(function(dir) {
                var unescape = Global.urlUnescape || Global.unescape,
                    unescaped = unescape(dir.getURL().filename()),
                    name = unescaped.replace(/\/$/,"");
                if (name.startsWith('.')) return;
                this.categories[name] = this.partsBinURL().withFilename(unescaped);
            }, this);
            this.updateCategoryList(this.categoryName);
        }.bind(this);

        connect(webR, 'subCollections', {cb: callback}, 'cb', {
            updater: function($upd, value) {
                if (!(this.sourceObj.status && this.sourceObj.status.isDone())) return;
                if (!value) return;
                $upd(value);
            },
        });

        webR.getSubElements();
    },
        updateCategoryList: function updateCategoryList(optCategoryName) {
        this.get('categoryList').updateList(
    	Properties.own(this.categories).sortBy(function(name) { return name.toLowerCase()}));
        this.get('categoryList').setSelection(optCategoryName)
    },
        updatePartsBinURLChooser: function updatePartsBinURLChooser() {
        // this.updatePartsBinURLChooser();
        this.get("PartsBinURLChooser").setList(lively.PartsBin.getPartsBinURLs());
    }
}],
    titleBar: "PartsBinBrowser",
    connectionRebuilder: function connectionRebuilder() {
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser.owner --> AttributeConnection(<lively.morphic.Button#5D040... - moreButton>.globalTransform --> [object Object].alignToMagnet).updateOwners)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser._Position --> AttributeConnection(<lively.morphic.Button#5D040... - moreButton>.globalTransform --> [object Object].alignToMagnet).signalTransformationChanged)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser._Scale --> AttributeConnection(<lively.morphic.Button#5D040... - moreButton>.globalTransform --> [object Object].alignToMagnet).signalTransformationChanged)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser._Rotation --> AttributeConnection(<lively.morphic.Button#5D040... - moreButton>.globalTransform --> [object Object].alignToMagnet).signalTransformationChanged)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser.owner --> AttributeConnection(<lively.morphic.Box#36794... - PartsBinBrowser>.globalTransform --> [object Object].alignToMagnet).updateOwners)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser._Position --> AttributeConnection(<lively.morphic.Box#36794... - PartsBinBrowser>.globalTransform --> [object Object].alignToMagnet).signalTransformationChanged)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser._Scale --> AttributeConnection(<lively.morphic.Box#36794... - PartsBinBrowser>.globalTransform --> [object Object].alignToMagnet).signalTransformationChanged)
    // failed to generate rebuild code for AttributeConnection(<lively.morphic.Window#2AC7A... - PartsBinBrowser> PartsBinBrowser._Rotation --> AttributeConnection(<lively.morphic.Box#36794... - PartsBinBrowser>.globalTransform --> [object Object].alignToMagnet).signalTransformationChanged)
},
    onLoadFromPartsBin: function onLoadFromPartsBin() {
    $super();
	this.targetMorph.reloadEverything();
},
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
    $super();
	this.targetMorph.reloadEverything();
},
    reset: function reset() {
    // this.partsBinMetaInfo = x.getPartsBinMetaInfo()
}
});

}) // end of module