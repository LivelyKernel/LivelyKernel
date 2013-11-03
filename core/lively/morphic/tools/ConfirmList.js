module('lively.morphic.tools.ConfirmList').requires('lively.persistence.BuildSpec').toRun(function() {

lively.BuildSpec('lively.morphic.tools.ConfirmList', {
    _BorderColor: Color.rgb(102,102,102),
    _BorderWidth: 1,
    _Extent: lively.pt(300.0,90.0),
    _Fill: Color.rgb(210,210,210),
    _Position: lively.pt(610.0,6.0),
    className: "lively.morphic.Box",
    doNotSerialize: ["_renderContext","halos","_isRendered","priorExtent","cachedBounds"],
    draggingEnabled: false,
    grabbingEnabled: false,
    layout: {
        adjustForNewBounds: true
    },
    sourceModule: "lively.morphic.Core",
    submorphs: [{
        name: 'Label',
        textString: 'Label...',
        _ClipMode: "hidden",
        _Extent: lively.pt(292.0,18.0),
        _Position: lively.pt(3,3),
        _FontFamily: "Helvetica",
        _TextColor: Color.rgb(64,64,64),
        className: "lively.morphic.Text",
        isLabel: true,
        sourceModule: "lively.morphic.TextCore"
    },{
        _BorderColor: Color.rgb(189,190,192),
        _BorderWidth: 1,
        _Extent: lively.pt(55.0,22.0),
        className: "lively.morphic.Button",
        name: 'CancelButton',
        doNotCopyProperties: [],
        doNotSerialize: [],
        droppingEnabled: false,
        grabbingEnabled: false,
        isPressed: false,
        label: "Cancel",
        layout: {
            moveHorizontal: true,
            moveVertical: true
        },
        sourceModule: "lively.morphic.Widgets",
        submorphs: [],
        toggle: false,
        value: false
    },{
        _BorderColor: Color.rgb(189,190,192),
        _BorderWidth: 1,
        _Extent: lively.pt(40.0,22.0),
        className: "lively.morphic.Button",
        name: 'OKButton',
        droppingEnabled: false,
        grabbingEnabled: false,
        isPressed: false,
        label: "OK",
        layout: {
            moveHorizontal: true,
            moveVertical: true
        }
    }, {
        className: "lively.morphic.List",
        name: "target",
        _ClipMode: "auto",
        _Extent: lively.pt(100.0,100.0),
        _Fill: Color.rgb(243,243,243),
        _FontSize: 10,
        grabbingEnabled: false,
        itemList: [1,2,3]
    }],
    getSelectedItems: function getSelectedItems() {
        var target = this.get('target');
        return target.selection;
    },
    connectionRebuilder: function connectionRebuilder() {
        var target = this.get('target'),
            cancelBtn = this.get('CancelButton'),
            okBtn = this.get('OKButton');
        lively.bindings.connect(okBtn, 'fire', this, 'result', {
            converter: function() { return this.targetObj.getSelectedItems(); }});
        lively.bindings.connect(cancelBtn, 'fire', this, 'result', {
            converter: function() { return false }});
        lively.bindings.connect(this, 'onEscPressed', this, 'result', {
            converter: function() { return false }});
        lively.bindings.connect(this, 'onEnterPressed', this, 'result', {
            converter: function() { return this.targetObj.getSelectedItems(); }});
        lively.bindings.connect(this, 'result', this, 'remove');
    },
    onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        $super();
        this.applyLayout();
    },
    promptFor: function promptFor(options) {
        this.get('Label').setTextString(options.prompt);
        if (options.list) this.get('target').setList(options.list);
        if (options.selection) this.get('target').setSelection(options.selection);
        if (options.extent) this.setExtent(options.extent);
        this.get('Label').fit();
        this.applyLayout()
    },
    getLayouter: function getLayouter() {
        return {
            onSubmorphAdded: function() {},
            handlesSubmorphResized: function() { return false; },
            layout: function(container, submorphs) {
                if (container.inLayoutCycle) return;
                container.inLayoutCycle = true;
                var target = container.get('target'),
                    label = container.get('Label'),
                    cancelBtn = container.get('CancelButton'),
                    okBtn = container.get('OKButton');
                cancelBtn.align(cancelBtn.bounds().bottomRight(), container.innerBounds().bottomRight().addXY(-4, -4))
                okBtn.align(okBtn.bounds().bottomRight(), cancelBtn.bounds().bottomLeft().addXY(-5, 0));

                target.setBounds(lively.rect(label.bounds().bottomLeft(), cancelBtn.bounds().topRight()));
                label.setExtent(label.getExtent().withX(container.getExtent().x-4));
                container.inLayoutCycle = false;
            }
        }
    }
});

}) // end of module