module('lively.ide.VersionTools').requires('lively.morphic').toRun(function() {

var klass = Global.Widget || lively.morphic.WindowedApp;
klass.subclass('lively.ide.FileVersionViewer',
'settings', {

    viewTitle: "Version Viewer",
    initialViewExtent: pt(450, 250),

},
'initializing', {

    buildView: function(extent) {
        var panel = PanelMorph.makePanedPanel(extent, [
            ['urlPane', newTextPane, new Rectangle(0, 0, 1, 0.1)],
            ['versionList', newDragnDropListPane, new Rectangle(0, 0.1, 1, 0.8)],
            ['revertButton', ButtonMorph, new Rectangle(0, 0.9, 0.33, 0.1)],
            ['openButton', ButtonMorph, new Rectangle(0.33, 0.9, 0.33, 0.1)],
            ['visitButton', ButtonMorph, new Rectangle(0.66, 0.9, 0.34, 0.1)],
        ]);

        var m;

        panel.applyStyle({adjustForNewBounds: true, resizeWidth: true, resizeHeight: true})

        m = panel.urlPane.innerMorph();
        m.noEval = true;
        m.plugTo(this, {savedTextString: '->setTarget'});
        m.applyStyle({resizeWidth: true, resizeHeight: false, fixedHeight: true, clipMode: 'hidden', allowInput: true});

        m = panel.revertButton;
        m.setLabel('revert');
        m.plugTo(this, {fire: '->revert'});
        m.applyStyle({resizeWidth: true, moveVertical: true});

        m = panel.openButton;
        m.setLabel('show');
        m.plugTo(this, {fire: '->showVersion'});
        m.applyStyle({moveVertical: true, moveHorizontal: true});

        m = panel.visitButton;
        m.setLabel('visit');
        m.plugTo(this, {fire: '->visitVersion'});
        m.applyStyle({moveVertical: true, moveHorizontal: true});

        m= panel.versionList.innerMorph();
        m.dragEnabled = false;
        m.applyStyle({resizeWidth: true, resizeHeight: true});

        this.panel = panel;
        panel.ownerWidget = this;
        return panel;
    },
},
'actions', {
    openForURL: function(url) {
        this.open();
        this.setTarget(url);
        return this;
    },


    setTarget: function(url) {
        try { this.url = new URL(url) } catch(e) {
            return;
        } finally {
            this.panel.urlPane.innerMorph().setTextString(this.url.toString());
        }

        var versionList = this.panel.versionList.innerMorph();
        versionList.updateList(['loading']);
        var res = new WebResource(url);
        lively.bindings.connect(res, 'versions', versionList, 'updateList',
            {converter: function(list) { return list ? list.asListItemArray() : [] }});
        res.beAsync().getVersions();
    },

    fetchSelectedVersionAndDo: function(doBlock) {
        // get the revision and create a WebResource for this.url
        // then let doBlock configure that WebResource. In the end
        // GET the version of this.url
        if (!this.url) return;
        var sel = this.panel.versionList.innerMorph().selection;
        if (!sel) return;
        var rev = sel.rev;
        var resForGet = new WebResource(this.url).beAsync();
        doBlock.call(this, resForGet);
        resForGet.get(rev);
    },
    selectedURL: function() {
        var sel = this.panel.versionList.innerMorph().selection;
        if (!sel) return null;
        var rev = sel.rev,
            versionedURL = new WebResource(this.url).createResource().createVersionURLString(rev);
        return versionedURL
    },

    showVersion: function() {
        this.fetchSelectedVersionAndDo(function(resForGet) {
            lively.bindings.connect(resForGet, 'content', lively.morphic.World.current(), 'addTextWindow');
        });
    },
    visitVersion: function() {
        Global.open(this.selectedURL())
    },


    revert: function() {
        this.fetchSelectedVersionAndDo(function(resForGet) {
            var resForPut = new WebResource(this.url).beAsync(); // using two to know when status of put
            lively.bindings.connect(resForGet, 'content', resForPut, 'put');
            lively.bindings.connect(resForPut, 'status', this, 'revertDone');
        });
    },
    revertDone: function (status) {
        var w = lively.morphic.World.current();
        if (status.code() < 400)
            w.setStatusMessage('Successfully reverted ' + this.url, Color.green, 3);
        else
            w.setStatusMessage('Could not revert ' + this.url + ': ' + status, Color.red, 5);
        this.setTarget(this.url); // update list
    },
});

}) // end of module