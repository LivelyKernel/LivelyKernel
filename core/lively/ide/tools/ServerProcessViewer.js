module("lively.ide.tools.ServerProcessViewer").requires("lively.persistence.BuildSpec", "lively.ide.CommandLineInterface", 'lively.ide.tools.CommandLine').toRun(function() {

lively.BuildSpec("lively.ide.tools.ServerProcessViewer", {
    _Extent: lively.pt(553.0,225.0),
    className: "lively.morphic.Window",
    contentOffset: lively.pt(3.0,22.0),
    layout: { adjustForNewBounds: true },
    draggingEnabled: true,
    name: "ServerProcessViewer",
    submorphs: [{
        _BorderWidth: 0,
        _Extent: lively.pt(547.0,200.0),
        _Fill: Color.rgb(255,255,255),
        _Position: lively.pt(3.0,22.0),
        className: "lively.morphic.Box",
        layout: {
            adjustForNewBounds: true,
            resizeHeight: true, resizeWidth: true,
        },
        name: "ServerProcesses",
        submorphs: [{
            _BorderWidth: 0,
            _ClipMode: "auto",
            _Extent: lively.pt(547.0,180.0),
            _FontSize: 10,
            _StyleSheet: ".list-item {\n\
        	font-family: monospace      !important;\n\
        	font-size: 9pt !important;\n\
        }",
            style: { cssStylingMode: true },
            className: "lively.morphic.List",
            itemList: [],
            itemMorphs: [],
            layout: {
                resizeHeight: true,
                resizeWidth: true
            },
            name: "List",
            selectedIndexes: []
        },{
            _BorderColor: Color.rgb(189,190,192),
            _BorderRadius: 5,
            _BorderWidth: 1,
            _Extent: lively.pt(100.0,20.0),
            _Position: lively.pt(0.0,180.0),
            className: "lively.morphic.Button",
            label: "kill",
            layout: { moveVertical: true },
            name: "killButton",
            connectionRebuilder: function connectionRebuilder() {
            lively.bindings.connect(this, "fire", this, "doAction", {});
        },
            doAction: function doAction() {
            var item = this.get("List").getSelection();
            if (!item) { show("nothing selected!"); return;  }
            var useSudo = event.isCommandKey() || event.isShiftDown();
            var cmd = (useSudo ? "sudo -A" : "") + "kill " + item.pid;
            lively.shell.run(cmd, {}, function(err, cmd) {
                show("kill result "
                    + item.pid + ":\n"
                    + cmd.getStdout()
                    + "\n" + cmd.getStderr())
            });
        }
        },
        lively.BuildSpec('lively.ide.tools.CommandLine').customize({
          name: "filter",
          labelString: 'filter: ',
          _Position: lively.pt(110.0,182.0),
          _Extent: lively.pt(435, 18),
          layout: { moveVertical: true, resizeWidth: true}
        })
        ],
        onFromBuildSpecCreated: function onFromBuildSpecCreated() {
        this.onLoad();
    },
        onLoad: function onLoad() {
        this.startStepping(4000, "update");
        this.update();
    },
        reset: function reset() {
        this.stopStepping();
        this.get("List").setList([]);
    },
        update: function update() {
        var cmd, list = this.get("List"), oldSel = list.getSelectedIndexes()[0];
        var filterString = this.get("filter").getInput();
        var filterRe = filterString.trim() ? new RegExp(filterString, "i") : null;
        var widthPerChar = 7.5;
        var infoLength = 30; // chars
        var cmdCharsLength = (this.getExtent().x - infoLength*widthPerChar)/widthPerChar;
        lively.shell.run("ps aux", {}, function(err, cmd) {
            if (cmd.getCode() > 0) {
                list.setList(["Error in ps aux",
                              cmd.getStdout(),
                              cmd.getStderr()]);
                return;
            }
            try {
                var items = lively.lang.grid.toObjects(psOutputToTable(cmd))
                  .filter(filter)
                  .map(asListItem)
                items = removePSCommand(items, cmd);
                items = prettyList(items);
                list.setList(items);
            } catch (e) {
                list.setList(["Error parsing ps -aux: ", String(e)]);
            }
            
            if (Object.isNumber(oldSel)) list.selectAt(oldSel);
        });
    
        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-    
    
        function psOutputToTable(cmd) {
            var headers;
            return cmd.getStdout().split('\n').map(function(line, i) {
                if (i === 0) return headers = line.toLowerCase().split(/\s+/);
                if (!line.trim().length) return null;
                // use header count to parse rest b/c whitespaced can't be used for
                // parsing
                var parts = line.split(/\s+/);
                return parts.slice(0, headers.length-1)
                    .concat([parts.slice(headers.length-1).join(" ")])
            }).compact();
        }

        function filter(ea) { return !filterRe ? ea : ea.command.match(filterRe); }

        function shortCommand(psEntry) {
            var cmd = psEntry.command;
            psEntry.shortCommand = cmd.length < cmdCharsLength ? cmd : cmd.slice(0, cmdCharsLength-20) + '...' + cmd.slice(-20);
            return psEntry;
        }
    
        function asListItem(d) {
            shortCommand(d);
            return {
                isListItem: true,
                value: d,
                string: Strings.format("%s|pid %s|cp :%s%|mem %s%",
                    d.shortCommand, d.pid, d["%cpu"], d["%mem"])
            }
        }
    
        function prettyList(items) {
            var table = items.map(function(ea) { return ea.string.split("|"); });
            var prettyTable = Strings.printTable(table).split('\n');
            return items.zip(prettyTable).map(function(ea) { ea[0].string = ea[1]; return ea[0]; });
        }
        
        function removePSCommand(items, cmd) {
            return items.filter(function(item) { 
                return Number(item.value.pid) !== cmd.getPid(); });
        }
    }
    }],
    titleBar: "Server Processes"
});

Object.extend(lively.ide.tools.ServerProcessViewer, {
    open: function() {
        var viewer = lively.BuildSpec("lively.ide.tools.ServerProcessViewer").createMorph();
        return viewer.openInWorld(lively.morphic.World.current().positionForNewMorph(viewer))
            .comeForward();
    },
});
}) // end of module
