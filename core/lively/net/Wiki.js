module('lively.net.Wiki').requires('lively.store.Interface').toRun(function() {

(function openWikiToolFlap() {
    lively.whenLoaded(function(world) {
        if (!Config.showWikiToolFlap) return;
        require('lively.net.tools.Wiki').toRun(function() {
            lively.BuildSpec('lively.wiki.ToolFlap').createMorph().openInWorld();
        });
    });
})();

Object.extend(lively.net.Wiki, {

    urlToPath: function(url) { return URL.isURL(url) ? new URL(url).relativePathFrom(URL.root) : url; },
    pathToURL: function(path) { return URL.root.withFilename(path); },

    getStore: function() {
        return this._store || (this._store = new lively.store.ObjectRepository());
    },

    getRecords: function(querySpec, thenDo) {
        // querySpec supports: {
        //   groupByPaths: BOOL, -- return an object with rows grouped (keys of result)
        //   attributes: [STRING], -- which attributes to return from stored records
        //   newest: BOOL, -- only return most recent version of a recored
        //   paths: [subset of ["path","version","change","author","date","content"]], -- attr filter
        //   pathPatterns: [STRING], -- pattern to match paths
        //   version: [STRING|NUMBER], -- the version number
        //   date: [DATE|STRING], -- last mod date
        //   newer: [DATE|STRING], -- last mod newer
        //   older: [DATE|STRING], -- last mod older
        //   limit: [NUMBER]
        // }
        this.getStore().getRecords(querySpec, thenDo);
    },

    getVersions: function(url, thenDo) {
        this.getRecords({
            paths: [this.urlToPath(url)],
            attributes: ['path', 'version', 'date', 'author', 'change']
        }, thenDo);
    },

    findResourcePathsMatching: function(pattern, onlyExisiting, thenDo) {
        var query = {pathPatterns: [pattern], attributes: ['path', 'change', 'date'], newest: true, orderBy: 'date'};
        if (onlyExisiting) query.exists = true;
        this.getRecords(query, function(err, records) {
            thenDo(err, records && records.sortByKey('date').reverse().map(function(rec) { return rec.path; }));
        });
    },

    withResourceContentsDo: function(paths, iterator, thenDo) {
        // do this resource-by-resource so that we do not have to transmit/hold
        // on to all the content at once (which might easily kill the network / RAM)
        var self = this;
        paths.doAndContinue(function(next, path) {
            var query = {paths: [path], exists: true, attributes: ["content"], orderBy: 'date', newest: true};
            self.getRecords(query, function(err, records) {
                if (!records.length || !records[0].content) { iterator(new Error('No content'), next, path); return; }
                iterator(null, next, path, records[0].content);
            });
        }, thenDo);
    },

    withSerializedWorldsDo: function(worldPaths, iterator, thenDo) {
        function isLivelyWorld(worldHTML) {
            return worldHTML.include('<script type="text/x-lively-world"');
        }
        function jsoFromHTML(html) {
            var body = html.slice(html.indexOf('<body>')+6, html.indexOf('</body>')),
                roughly = html.slice(html.indexOf('<script type="text/x-lively-world"')+6, html.lastIndexOf("</script>")),
                json = roughly.slice(roughly.indexOf('{'));
            return JSON.parse(json);
        }
        this.withResourceContentsDo(worldPaths, function(err, next, path, content) {
            if (err) { iterator(err, next, path); }
            if (!isLivelyWorld(content)) { next(); return; }
            var jso;
            try { jso = jsoFromHTML(content) } catch(e) { iterator(e, next, path); return; }
            iterator(null, next, path, jso);
        }, thenDo);
    }

});

}) // end of module
