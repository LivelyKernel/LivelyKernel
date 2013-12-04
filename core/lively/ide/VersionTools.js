module('lively.ide.VersionTools').requires('lively.morphic').toRun(function() {

lively.morphic.WindowedApp.subclass('lively.ide.FileVersionViewer',
'settings', {

    viewTitle: "Version Viewer",
    initialViewExtent: pt(450, 250),

},
'initializing', {

    buildView: function(extent) {
        var panel = lively.morphic.Panel.makePanedPanel(extent, [
            ['urlPane', newTextPane, new Rectangle(0, 0, 1, 0.1)],
            ['versionList', newDragnDropListPane, new Rectangle(0, 0.1, 1, 0.8)],
            ['revertButton', lively.morphic.Button, new Rectangle(0, 0.9, 0.33, 0.1)],
            ['openButton', lively.morphic.Button, new Rectangle(0.33, 0.9, 0.33, 0.1)],
            ['visitButton', lively.morphic.Button, new Rectangle(0.66, 0.9, 0.34, 0.1)],
        ]);

        var m;

        panel.applyStyle({adjustForNewBounds: true, resizeWidth: true, resizeHeight: true, fill: Color.gray});

        m = panel.urlPane.innerMorph();
        m.plugTo(this, {savedTextString: '->setTarget'});
        m.applyStyle({resizeWidth: true, resizeHeight: false, fixedHeight: true, clipMode: 'hidden', allowInput: true, fontSize: 9});

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

        m = panel.versionList.innerMorph();
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
        
        var path = url.relativePathFrom(URL.root)
        new lively.store.ObjectRepository().getRecords({
            paths: [path],
            attributes: ['date', 'author', 'change', 'version', 'content']
        }, function(err, rows) {
            if (!err && rows) {
                versionList.updateList(rows.map(function(ea) {
                    var formattedDate = ea.date;
                    if (formattedDate.format) {
                        formattedDate = formattedDate.format("yyyy-mm-dd HH:MM") 
                    }
                    return { 
                        string: formattedDate + " " + ea.author + " (" + ea.version + ")",
                        value: ea, isListItem: true}
                }));
            }
        });
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
        
        if (this.url) {
            var sel = this.panel.versionList.innerMorph().selection
            if (sel && sel.content) {
                return lively.morphic.World.current().addTextWindow({
                    content: sel.content, 
                    syntaxHighlighting: true
                });
            }
        }
        this.fetchSelectedVersionAndDo(function(resForGet) {
            lively.bindings.connect(resForGet, 'content', lively.morphic.World.current(), 'addTextWindow');
        });
    },
    visitVersion: function() {
        Global.open(this.selectedURL())
    },

    revert: function() {
        this.fetchSelectedVersionAndDo(function(resForGet) {
             // using two to know when status of put
            var resForPut = new WebResource(this.url).beAsync();
            lively.bindings.connect(resForGet, 'content', resForPut, 'put');
            lively.bindings.connect(resForPut, 'status', this, 'revertDone', {updater:
                function($upd, status) { if (status.isDone()) $upd(status); }});
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
