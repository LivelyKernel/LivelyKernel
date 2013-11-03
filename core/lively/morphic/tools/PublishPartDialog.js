module('lively.morphic.tools.PublishPartDialog').requires('lively.persistence.BuildSpec', 'lively.PartsBin').toRun(function() {

lively.BuildSpec('lively.morphic.tools.PublishPartDialog', {
    _Extent: lively.pt(479.0,437.0),
    className: "lively.morphic.Window",
    name: "PublishPartDialog",
    sourceModule: "lively.morphic.Widgets",
    contentOffset: lively.pt(3,22.0),
    draggingEnabled: true,
    layout: {adjustForNewBounds: true},
    minExtent: lively.pt(479.0,437.0),
    submorphs: [{
        _BorderColor: Color.rgb(95,94,95),
        _Extent: lively.pt(473,411.0),
        _Fill: Color.rgb(243,243,243),
        _Position: lively.pt(3,23),
        className: "lively.morphic.Box",
        doNotCopyProperties: [],
        doNotSerialize: [],
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true,
            resizeWidth: true
        },
        name: "PublishPartPanePane",
        ownerApp: "[object Object]",
        sourceModule: "lively.morphic.Core",
        submorphs: [{
            _BorderColor: Color.rgb(227,227,227),
            _BorderRadius: 3.75,
            _BorderWidth: 1,
            _ClipMode: "hidden",
            _Extent: lively.pt(174.0,20.0),
            _Fill: Color.rgb(255,255,255),
            _FontFamily: "Helvetica",
            _MaxTextWidth: 164,
            _MinTextWidth: 164,
            _Position: lively.pt(10.0,60),
            _WordBreak: "break-all",
            allowInput: true,
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,9,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            evalEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            isCopyMorphRef: true,
            isInputLine: true,
            layout: {
                adjustForNewBounds: true,
                resizeWidth: true
            },
            morphRefId: 1,
            name: "NameText",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "Anonymous"
        },{
            _BorderColor: Color.rgb(203,203,203),
            _BorderRadius: 6,
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(454.0,102.0),
            _Fill: Color.rgb(255,255,255),
            _FontFamily: "Helvetica",
            _InputAllowed: true,
            _MaxTextWidth: 444,
            _MinTextWidth: 444,
            _Position: lively.pt(10.0,262),
            _WordBreak: "break-all",
            allowInput: true,
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,10,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            evalEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            isInputLine: false,
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "CommitMessageText",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "no comment"
        },{
            _Extent: lively.pt(114.0,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 10,
            _MaxTextWidth: 114,
            _MinTextWidth: 114,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(5.0,40),
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,4,{
                fontSize: 9,
                fontWeight: "normal",
                italics: "italic"
            }]],
            fixedWidth: true,
            layout: {
                moveHorizontal: false
            },
            name: "Text5",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "name"
        },{
            _Extent: lively.pt(250.0,20.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 10,
            _MaxTextWidth: 250,
            _MinTextWidth: 250,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(5,237),
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,14,{
                fontWeight: "normal",
                italics: "italic"
            }]],
            fixedWidth: true,
            name: "Text6",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "commit message"
        },{
            _Extent: lively.pt(114.0,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 10,
            _MaxTextWidth: 114,
            _MinTextWidth: 114,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(195.0,40),
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,8,{
                fontSize: 9,
                fontWeight: "normal",
                italics: "italic"
            }]],
            fixedWidth: true,
            layout: {
                moveHorizontal: true,
                moveVertical: false
            },
            name: "Text7",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "category"
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(101.0,21.0),
            _Position: lively.pt(355.0,376),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "cancel",
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "Button",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("PublishPartPanePane"), "onCancel", {});
        }
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5.2,
            _BorderWidth: 1.1840000000000002,
            _Extent: lively.pt(101.0,21.0),
            _Position: lively.pt(245.0,376),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "publish",
            layout: {
                moveHorizontal: true,
                moveVertical: true
            },
            name: "Button1",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("PublishPartPanePane"), "onPublish", {});
        }
        },{
            _BorderColor: Color.rgb(208,208,208),
            _BorderRadius: 4.5,
            _BorderWidth: 1,
            _ClipMode: "auto",
            _Extent: lively.pt(455.0,120.0),
            _Fill: Color.rgb(255,255,255),
            _FontFamily: "Helvetica",
            _InputAllowed: true,
            _MaxTextWidth: 445,
            _MinTextWidth: 445,
            _Position: lively.pt(10.0,112),
            _WordBreak: "break-all",
            allowInput: true,
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,10,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            evalEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            isInputLine: false,
            layout: {
                resizeWidth: true
            },
            name: "CommentText",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "no comment"
        },{
            _Extent: lively.pt(250.0,20.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 10,
            _MaxTextWidth: 250,
            _MinTextWidth: 250,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(5,92),
            className: "lively.morphic.Text",
            doNotCopyProperties: [],
            doNotSerialize: [],
            emphasis: [[0,7,{
                fontWeight: "normal",
                italics: "italic"
            }]],
            fixedWidth: true,
            name: "Text9",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "comment"
        },{
            _BorderColor: Color.rgb(214,214,214),
            _BorderRadius: 5.2,
            _BorderWidth: 1.1840000000000002,
            _Extent: lively.pt(150.0,21.0),
            _Position: lively.pt(15.0,376),
            className: "lively.morphic.Button",
            doNotCopyProperties: [],
            doNotSerialize: [],
            isPressed: false,
            label: "check for updates",
            layout: {
                moveVertical: true
            },
            name: "DiffButton",
            sourceModule: "lively.morphic.Widgets",
            submorphs: [],
            toggle: false,
            value: false,
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this.get("PublishPartPanePane"), "checkForUpdates", {});
        }
        },{
            _BorderColor: Color.rgb(220,220,220),
            _BorderRadius: 4.5,
            _BorderWidth: 1,
            _ClipMode: "hidden",
            _Extent: lively.pt(260.0,20.0),
            _Fill: Color.rgb(255,255,255),
            _FontFamily: "Helvetica",
            _MaxTextWidth: 250,
            _MinTextWidth: 250,
            _Position: lively.pt(200.0,60),
            _WordBreak: "break-all",
            allowInput: true,
            className: "lively.morphic.Text",
            doNotSerialize: ["charsTyped"],
            emphasis: [[0,7,{
                fontWeight: "normal",
                italics: "normal"
            }]],
            evalEnabled: false,
            fixedHeight: true,
            fixedWidth: true,
            isInputLine: true,
            layout: {
                moveHorizontal: true,
                resizeWidth: false
            },
            name: "CategoryText",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "Default"
        },{
            _ClipMode: "auto",
            _Extent: lively.pt(389.0,23.0),
            _Fill: Color.rgb(243,243,243),
            _FontSize: 10,
            _Position: lively.pt(71.0,16),
            className: "lively.morphic.DropDownList",
            name: "PartsBinURLChooser",
            selectOnMove: false,
            sourceModule: "lively.morphic.Core",
            onFromBuildSpecCreated: function onFromBuildSpecCreated() {
                this.setList(lively.PartsBin.getPartsBinURLs());
                this.selectAt(0);
        },
            reset: function reset() {
                    this.name = "PartsBinURLChooser";
                }
        },{
            _Extent: lively.pt(62.0,18.0),
            _FontFamily: "Arial, sans-serif",
            _FontSize: 10,
            _MaxTextWidth: 114,
            _MinTextWidth: 114,
            _Padding: lively.rect(5,5,0,0),
            _Position: lively.pt(5,15),
            className: "lively.morphic.Text",
            doNotSerialize: ["charsTyped"],
            emphasis: [[0,8,{
                fontSize: 9,
                fontWeight: "normal",
                italics: "italic"
            }]],
            fixedWidth: true,
            layout: {
                moveHorizontal: false
            },
            name: "Text10",
            sourceModule: "lively.morphic.TextCore",
            submorphs: [],
            textString: "PartsBin"
        }],
        target: null,
        withLayers: "[GrabbingLayer]",
        askForDiffViewer: function askForDiffViewer() {
        $world.confirm('A newer version of '+this.get('NameText').textString+' is available. Show diff?', function (bool) {bool && this.showDiff()}.bind(this))
    },
        checkForUpdates: function checkForUpdates() {
        var space = lively.PartsBin.partsSpaceNamed(this.get('CategoryText').textString),
            name = this.get('NameText').textString,
            fileUrl = space.getURL().withFilename(encodeURI(name))+'.json';
    
        var webR = new WebResource(fileUrl);
        
        if (webR.exists()) {
            var rev = webR.getHeadRevision().headRevision;
            if (this.target.getPartsBinMetaInfo().revisionOnLoad == rev) 
                alertOK("No changes since last update.")
            else {
                this.askForDiffViewer();
            }
        }
        else 
            alertOK("Part does not exist in PartsBin.")    
        
    },
        copyToPartsBin: function copyToPartsBin(morph) {
        var url = this.get('PartsBinURLChooser').selection,
            name = this.get('NameText').textString,
            info = morph.getPartsBinMetaInfo(),
            categoryName = this.get('CategoryText').textString.
            categoryName = this.get('CategoryText').textString
        morph.setName(name);
        
        info.partsSpaceName = lively.PartsBin.getLocalPartsBinURL().eq(url) ?
            categoryName : String(url.withFilename('../' + categoryName).withRelativePartsResolved());
        info.comment = this.get('CommentText').textString;
        if (!info.changes) info.changes = [];
        var change = { 
            date: new Date(), 
            author: this.world().getUserName(), 
            message: this.get('CommitMessageText').textString,
            id: Strings.newUUID()
        }
        info.changes.push(change);
        morph.copyToPartsBin();
    },
        onCancel: function onCancel() {
        alertOK("cancel upload ") 
        this.owner.remove()
    },
        onLoad: function onLoad() {
        this.get("PartsBinURLChooser").setList(lively.PartsBin.getPartsBinURLs());
        this.get("PartsBinURLChooser").selectAt(0);
    },
        onPublish: function onPublish() {
        if (!this.target) alert("No target to upload");
        this.copyToPartsBin(this.target);
    },
        onRemove: function onRemove() {
        $world.publishPartDialog && $world.publishPartDialog.remove()
    },
        reset: function reset() {
        this.setTarget(null)
       
    },
        setTarget: function setTarget(morph) {
        this.target = morph 
        if (!morph) {
            this.get('NameText').textString = 'Anonymous';
            this.get('CategoryText').textString = 'Default';
            this.get('CommentText').textString = 'no comment';        
            this.get('CommitMessageText').textString = 'no comment'      
            return
        }
        var info = this.target.getPartsBinMetaInfo();
        this.get('NameText').textString = info.partName || morph.getName();
        if (info.partsSpaceName) this.get('CategoryText').textString = info.partsSpaceName;
        if (info.comment) this.get('CommentText').textString = info.comment;        
    
    },
        showDiff: function showDiff() {
        if (this.target) {
            if (typeof(this.target.showThreeWayDiff) === 'function') {
                this.target.showThreeWayDiff();
            }
            else {
                alert('Three Way Diff is not implemented yet')
            }
        }
    }
    }],
    titleBar: "Publish in PartsBin",
    connectionRebuilder: function connectionRebuilder() {
    lively.bindings.connect(this, "remove", this.get("PublishPartPanePane"), "onRemove", {});
}
});

}) // end of module