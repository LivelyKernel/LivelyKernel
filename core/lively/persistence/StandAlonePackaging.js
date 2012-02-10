module('lively.persistence.StandAlonePackaging').requires(['lively.persistence.Serializer', 'lively.PartsBin']).toRun(function() {

Object.subclass('lively.persistence.StandAlonePackaging.Helper',
'accessing modules', {
    getRelativeURLsFromLoadedModules: function() {
        var relativeURLs = lively.lang.Namespace.bootstrapModules();
        relativeURLs.unshift(LivelyLoader.jqueryPath);
        relativeURLs.unshift('lively/bootstrap.js');
        return relativeURLs;
    },
},
'morph creation', {

    createWaitText: function() {
        var waitText = new lively.morphic.Text(new Rectangle(0,0, 300, 35), 'Please wait...')
        waitText.applyStyle({fontSize: 20, textColor: Color.red})
        waitText.openInWorld()
        waitText.align(waitText.getCenter(), waitText.world().visibleBounds().center());
        return waitText;
    },

    createProgressBar: function() {
        var progressBar = new ProgressBarMorph(new Rectangle(0,0, 400, 50))
        progressBar.openInWorld()
        progressBar.align(progressBar.getCenter(), progressBar.world().visibleBounds().center());
        return progressBar;
    },
},
'document manipulation', {
    addScriptTagTo: function(parent, src, attributes) {
        attributes = attributes || {};
        var doc = parent.ownerDocument,
            script = doc.createElement('script'),
            cdata = document.createCDATASection(src);
        parent.appendChild(script);
        script.appendChild(cdata);
        Properties.forEachOwn(attributes, function(attr, value) { script.setAttribute(attr, value) });
    },
    removeExisitingScripts: function(doc) {
        var existingScripts = doc.getElementsByTagName('script');
        $A(existingScripts).forEach(function(script) { script.parentNode.removeChild(script) });
    },

    addConfig: function(doc) {
        // TODO: make generic to include all original configs
        var configStr = 'Config = {standAlone: true, codeBase: "", rootPath: "../"';
        if (Config.isNewMorphic)
            configStr += ', isNewMorphic: true, showWikiNavigator: false';
        this.addScriptTagTo(
            doc.getElementsByTagName('head')[0],
            configStr + '}');
    },

    embedModulesIn: function(doc, relativeModuleURLs, progressBar, thenDo) {
        debugger;
        var self = this,
            parent = doc.getElementsByTagName('body')[0];
        relativeModuleURLs.forEachShowingProgress(
            progressBar,
            function(relativeURL) {
                // var wrapper = lively.ide.ModuleWrapper.forFile(relativeURL);
                // self.addScriptTagTo(parent, wrapper.getSource(), {id: relativeURL});
                var srcContent = new WebResource(URL.codeBase.withFilename(relativeURL).toString()).get().content;
                self.addScriptTagTo(parent, srcContent, {id: relativeURL});
                // script.setAttribute('defer', 'true');
            }, Functions.K, thenDo)
    },
},
'data uri related', {
    openDocWithDataUri: function(doc) {
        var escapes = {
            '8211': '-', // dash
            '9633': '-', '9632': '-' // bullet points
        };
        try {
            var content = '<?xml version="1.0" encoding="iso-8859-1"?>' + Exporter.stringify(doc);
                escaped = $A(content)
                    .collect(function(c) { return c.charCodeAt(0) > 8000 ? '?' : c})
                    // .collect(function(c) { return c.charCodeAt(0) > 8000 ? ('&#'  + c.charCodeAt(0) + ';') : c})
// .collect(function(c) { var code = c.charCodeAt(0); return escapes[code] ? escapes[code] : c })
                    .join(''),
                //mimeType = 'application/xhtml+xml',
                mimeType = 'application/octet-stream',
                //headers = 'headers=Content-Disposition%3A%20attachment%3B%20filename=' + document.title + '.xhtml',
                uri = 'data:' + mimeType + ';base64,' + btoa(escaped);
            this.downloadDataURI({
                filename: document.title + '.xhtml',
                data: uri});
            //document.location.href = encodeURI(uri);
        } catch(e) {alert('Error: ' + e + '\n' + e.stack); }
    },
    downloadDataURI: function(options) {
        // thanks to: http://code.google.com/p/download-data-uri/
        if(!options) {
            return;
        }
        jQuery.isPlainObject(options) || (options = {data: options});
        if(!jQuery.browser.webkit) {
            location.href = options.data;
        }
        options.filename || (options.filename = "download." + options.data.split(",")[0].split(";")[0].substring(5).split("/")[1]);
        options.url || (options.url = "http://download-data-uri.appspot.com/");
        jQuery('<form method="post" action="'+options.url+'" style="display:none"><input type="hidden" name="filename" value="'+options.filename+'"/><input type="hidden" name="data" value="'+options.data+'"/></form>').submit().remove();
    },

});

Object.extend(lively.persistence.StandAlonePackaging, {
    packageCurrentWorld: function(lastStep) {
        this.packageWorld(lively.morphic.World.current(), lastStep);
    },
    packageWorld: function(world, lastStep) {
        var helper = new lively.persistence.StandAlonePackaging.Helper();
        var steps = {
            doStep: function(step) {
                // so UI can update between steps
                var self = this;
                (function() { try { self[step]() } catch(e) {alert(e.toString() + '\n' + e.stack)} }).delay(0);
            },
            step1: function() { // show please wait morphs
                this.waitText = helper.createWaitText();
                this.nextStep = 'step2';
            },
            step2: function() { // serialize the world
                this.waitText.remove();
                this.doc = lively.persistence.Serializer.serializeWorld(world);
                this.waitText.openInWorld();
                alertOK('World serialized');
                this.nextStep = 'step3';
            },
            step3: function() { // modify the world's document
                var urls = helper.getRelativeURLsFromLoadedModules(),
                    progressBar = helper.createProgressBar(),
                    whenDone = function () { this.nextStep = 'step4'; progressBar.remove() }.bind(this);
                helper.removeExisitingScripts(this.doc);
                helper.addConfig(this.doc);
                helper.embedModulesIn(this.doc, urls, progressBar, whenDone);
                alertOK('world document prepared for stand alone')
            },
        }
        if (typeof lastStep == 'function')
            steps['step4'] = function() { // do custom action
                lastStep(this.doc);
                this.waitText.remove();;
            }
        else
            steps['step4'] = function() { // download the modified world using a data uri
                alertOK('downloading modified world...')
                helper.openDocWithDataUri(this.doc);
                this.waitText.remove();;
            }

        connect(steps, 'nextStep', steps, 'doStep');
        steps.step1(); // start it
    },
});

// FIXME!!!! I REALLY NEED A FIX!
ProgressBarMorph = function(bounds) {
    var m = lively.PartsBin.getPart('ProgressBar', 'PartsBin/Widgets');
    Object.extend(this, m);
    this.setPosition(pt(bounds.x, bounds.y));
    this.setExtent(pt(bounds.width, bounds.height));
};

}) // end of module