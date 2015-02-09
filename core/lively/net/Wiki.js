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

    diff: function(pathA, pathB, options, thenDo) {
        // urla = "http://lively-web.org/users/robertkrahn/lively-cheat-sheet.html"
        // urlb = "http://lively-web.org/users/robertkrahn/lively-cheat-sheet.html"
        // versionA = 41
        // versionB = 42
        // lively.net.Wiki.diff(urla, urlb, {
        //     versionA: versionA,
        //     versionB: versionB,
        //     isJSON: true, isLivelyWorld: true}, show)
        var a = {
            paths: [this.urlToPath(pathA)],
            version: options.versionA,
            date: options.timestampA,
            newest: options.versionA || options.timestampA ? undefined : true
        };
        var b = {
            paths: [this.urlToPath(pathB)],
            version: options.versionB,
            date: options.timestampB,
            newest: options.versionB || options.timestampB ? undefined : true
        };
        lively.net.Wiki.getStore().diff(a,b, options, thenDo);
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

    getVersions: function(url, changesets, thenDo) {
        if (typeof changesets == 'boolean')
            var all = changesets;
        else if (Array.isArray(changesets))
            var branches = changesets;
        this.getRecords({
            paths: [this.urlToPath(url)],
            attributes: ['path', 'version', 'branch', 'date', 'author', 'change'],
            allBranches: all,
            branches: branches
        }, thenDo);
    },

    findResourcePathsMatching: function(pattern, onlyExisiting, thenDo) {
        if (typeof onlyExisiting === "function") { thenDo = onlyExisiting; onlyExisiting = true; }
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
    },

    showLoginInfo: function(withInfoMorphDo) {
        lively.require("lively.net.tools.Wiki").toRun(function() {
            var m = lively.BuildSpec("lively.wiki.LoginInfo")
                .createMorph().openInWorldCenter().comeForward();
            withInfoMorphDo && withInfoMorphDo(null, m);
        });
    },

    openResourceList: function(resources, options, thenDo) {
        if (!thenDo && typeof options === 'function') { thenDo = options; options = {}; }
        options = options || {};
debugger;
        var title = options.title || resources.join(", ").truncate(80);
        var nGroups = 0;
        var grouped = groupResources(resources);

        var container = makeContainer();

        if (grouped.partsbin && grouped.partsbin.length) {
            nGroups++;
            var partItemList = makeList("partsList"),
                partItems = createPartItemList(grouped.partsbin),
                label1 = makeLabel("PartsBin items");
            partItems.forEach(function(ea) { ea.hasOwnListItemBehavior = true; partItemList.addMorph(ea); });
            container.addMorph(label1);
            container.addMorph(partItemList);
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (grouped.world && grouped.world.length) {
            nGroups++;
            var list = makeList("worldsList");
            setStringList(grouped.world, list);
            container.addMorph(makeLabel("Worlds"));
            container.addMorph(list);
            lively.bindings.connect(list, 'selection', {visitWorld: function(morph) {
                $world.confirm("open world " + morph.item.value + '?', function(input) {
                    if (input) window.open(Global.URL.root.withFilename(morph.item.value).toString() , '_blank');
                });
            }}, 'visitWorld');
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (grouped.module && grouped.module.length) {
            nGroups++;
            var list = makeList("moduleList");
            setStringList(grouped.module, list);
            container.addMorph(makeLabel("Modules and files"));
            container.addMorph(list);
            lively.bindings.connect(list, 'selection', {open: function(morph) {
                lively.ide.browse(morph.item.value);
            }}, 'open');
        }

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        if (grouped.other && grouped.other.length) {
            nGroups++;
            var list = makeList("miscList");
            setStringList(grouped.other, list);
            container.addMorph(makeLabel("Other resources"));
            container.addMorph(list);
            lively.bindings.connect(list, 'selection', {open: function(morph) {
                lively.ide.openFile(Global.URL.root.withFilename(morph.item.value));
            }}, 'open');
        }

        if (nGroups === 0) {
            nGroups++;
            container.addMorph(makeLabel("You have no resources yet"));
        }

        container.setExtent(pt(630, (140+20)*nGroups));
        container.setVisible(false);
        container.openInWorld();

        (function() {
            container.openInWindow({title: "Resources of " + title})
            container.applyLayout();
            container.setVisible(true);
            thenDo(null, container.getWindow());
        }).delay(0);


        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        // helper
        // -=-=-=-

        function makeContainer() {
            var container = lively.morphic.Morph.makeRectangle(0,0, 630, 20);
            container.setLayouter({type: "vertical"})
            container.getLayouter().setSpacing(5)
            container.applyStyle({fill: Global.Color.white})
            return container;
        }

        function makeLabel(string) {
            var label = lively.morphic.Text.makeLabel(string);
            label.emphasizeAll({fontWeight: 'bold'});
            return label;
        }

        function makeList(name) {
            var list = new lively.morphic.MorphList()
            list.setLayouter({type: 'tiling'})
            list.getLayouter().setSpacing(10);
            list.setExtent(lively.pt(630.0,140));
            list.name = name;
            return list
        }

        function groupResources(resources) {
            var parts = resources.grep(/\.(metainfo|json)$/).map(noExtension).uniq();
            return resources.groupBy(function(ea) {
                if (parts.include(noExtension(ea))) return "partsbin"
                if (ea.endsWith(".html")) return "world";
                if (ea.endsWith(".js")) return "module";
                return "other";
            });
        }

        function noExtension(name) { return name.replace(/\.[^\.]$/, ""); }

        function setStringList(listItems, list) {
            var items = listItems.map(function(path) { return {isListItem: true, value: path, string: path}; })
            list.setList(items);
            list.getItemMorphs().forEach(function(ea) {
                ea.setWhiteSpaceHandling("nowrap")
                return ea.fitThenDo(function() {})
            });
        }

        function createPartItemList(partResources) {
            return partResources
                .map(function(ea) { return ea.replace(/\.[^\.]+$/, ''); }).uniq()
                .map(function(ea) {
                    return {partsSpace: ea.slice(0, ea.lastIndexOf('/')),
                            name: ea.slice(ea.lastIndexOf('/') + 1)};
                })
                .map(function(ea) {
                    var item = {
                        isListItem: true,
                        value: lively.PartsBin.getPartItem(ea.name, ea.partsSpace).asPartsBinItem(),
                        string: ea.name,
                    }
                    item.value.item = item;
                    item.value.disableGrabbing();
                    return item.value;
                });
        }
    },

    getTimemachineBaseURL: function() {
      return URL.root.withFilename('timemachine/');
    },

    revertToVersion: function(path, versionInfo, thenDo) {
      var tmURL = lively.net.Wiki.getTimemachineBaseURL(),
          getURL = tmURL.withFilename(versionInfo.date + '/').withFilename(path),
          putURL = URL.root.withFilename(path);
      lively.lang.fun.composeAsync(
        function(n) {
          getURL.asWebResource()
            .createProgressBar('reverting ' + path).enableShowingProgress()
            .beAsync().get().whenDone(function(content, status) {
              n(status.isSuccess() ? null :
                new Error('Revert of ' + path + ' failed while getting content:\n' + status), content); });
        },
        function(content, n) {
          putURL.asWebResource()
            .createProgressBar('reverting ' + path).enableShowingProgress()
            .beAsync().put(content).whenDone(function(_, status) {
              n(status.isSuccess() ? null :
                new Error('Revert of ' + path + ' failed while writing content:\n' + status));
          });
        })(thenDo);
    },

    revertResources: function(resourcePaths, versionInfo, thenDo) {
      // lively.net.Wiki.urlToPath("PartsBin/Basic/Rectangle.json")
      resourcePaths
        .map(lively.net.Wiki.urlToPath)
        .mapAsyncSeries(function(path, i, next) {
          lively.net.Wiki.revertToVersion(path, versionInfo, next);
        }, thenDo);
    }

},
'changesets', {

    lastChangeSetTest: null,

    closeLastChangeSetTest: function() {
        if (this.lastChangeSetTest && !this.lastChangeSetTest.closed) {
            this.lastChangeSetTest.close();
        }
        this.lastChangeSetTest = null;
    }

});

(function showChangeSetTestButtons() {
    JSLoader.getOption('testChangeSet') && lively.whenLoaded(function(world) {
        var box = new lively.morphic.Box(lively.rect(0, 0, 120, 70)),
            testOk = new lively.morphic.Button(lively.rect(0, 0, 100, 20), 'Test OK!'),
            testAbort = new lively.morphic.Button(lively.rect(0, 0, 100, 20), 'Abort!');

        function disableWorld(good) {
            var text = new lively.morphic.Text(lively.rect(0, 0, 175, 67), 'You may now close this window!');
            text.applyStyle({
                allowInput: false,
                fontSize: 14,
                padding: lively.rect(0, 10, 10, 0),
                fill: Color[(good ? 'green' : 'red')].lighter(),
                borderWidth: 0,
                align: 'center'
            });
            text.ignoreEvents();
            $world.addModal(text);
            box.remove();
        }

        box.setFill(Color.white);
        box.addMorph(testOk);
        box.addMorph(testAbort);
        box.openInWorld();
        box.isEpiMorph = true;
        box.setFixed(true);
        box.setBorderWidth(1);
        box.setBorderColor(Color.gray);

        testOk.setPosition(lively.pt(10, 10));
        testOk.setFill(Color.green);
        testOk.setAppearanceStylingMode(false);
        testOk.label.setTextStylingMode(false);
        testOk.label.setFontSize(9);
        testOk.onClick = function() {
            // TODO: extract to module?
            var changeSet = JSLoader.getOption('testChangeSet'),
                url = URL.nodejsBase.withFilename('ChangeSetServer/finalize/' + changeSet);
            url.asWebResource().get();

            disableWorld(true);
            Global.Config.askBeforeQuit = false;
            if (window.opener)
                window.opener.lively.net.Wiki.closeLastChangeSetTest();
        };

        testAbort.setPosition(lively.pt(10, 40));
        testAbort.setFill(Color.red);
        testAbort.label.setTextColor(Color.white);
        testAbort.setAppearanceStylingMode(false);
        testAbort.label.setTextStylingMode(false);
        testAbort.label.setFontSize(9);
        testAbort.onClick = function() {
            // TODO: extract to module?
            var changeSet = JSLoader.getOption('testChangeSet'),
                url = URL.nodejsBase.withFilename('ChangeSetServer/remove/' + changeSet);
            url.asWebResource().get();

            disableWorld(false);
            Global.Config.askBeforeQuit = false;
            if (window.opener)
                window.opener.lively.net.Wiki.closeLastChangeSetTest();
        };
    });
})();

}) // end of module
