module('lively.ide.GitInterface').requires('lively.Network').toRun(function() {

Object.extend(lively.ide.GitInterface, {

    gitControlURL: URL.create(Config.nodeJSURL).asDirectory().withFilename('GitControl/'),

    commandQueue: [],

    scheduleCommand: function(cmd) {
        this.commandQueue.push(cmd);
        lively.bindings.connect(this.commandInProgress, 'end', this, 'commandFromQueue');
    },

    commandFromQueue: function() {
        var cmd = this.commandQueue.shift();
        cmd.startRequest();
    },

    command: function(commandString, thenDo) {
        var gitInterface = this,
            parsedCommand = this.parseCommandIntoCommandAndArgs(commandString),
            webR = this.gitControlURL.asWebResource().beAsync(),
            esc = {'8': String.fromCharCode(8), '27': String.fromCharCode(27)},
            ansiColorRegex = new RegExp(Strings.format('%s\[[0-9;]*m|.%s', esc[27], esc[8]), 'g'),
            cmd = {
                streamPos: 0,
                interval: null,
                _stdout: '',
                _stderr: '',
                _code: '',

                readInterval: function() {
                    var xhr = webR.status && webR.status.transport;
                    if (!xhr) return;
                    this.read(xhr.responseText);
                },

                startInterval: function() {
                    this.endInterval();
                    this.interval = Global.setInterval(this.readInterval.bind(this), 50);
                },

                endInterval: function() {
                    if (this.interval) { Global.clearInterval(this.interval); }
                },

                read: function(string) {
                    var input = string.slice(this.streamPos, string.length),
                        headerMatch = input.match(/^<GITCONTROL\$([A-Z]+)([0-9]+)>/);
                    if (!headerMatch) return;
                    // show('pos: %s, reading: %s', this.streamPos, string);
                    var header = headerMatch[0],
                        type = headerMatch[1].toLowerCase(),
                        length = Number(headerMatch[2]),
                        readContent = input.slice(header.length, header.length+length).replace(ansiColorRegex, ''),
                        remaining = input.slice(header.length + length);
                    // show('type: %s, length: %s, content: %s, remaining: %s',
                    //     type, length, readContent, remaining);
                    lively.bindings.signal(this, type, readContent);
                    this['_' + type] += readContent;
                    this.streamPos += header.length + length;
                    if (this.streamPos < string.length) this.read(string);
                },

                startRequest: function() {
                    gitInterface.commandInProgress = this;
                    webR.post(JSON.stringify({command: parsedCommand}), 'application/json');
                    this.startInterval();
                    lively.bindings.connect(webR, 'status', this, 'endRequest', {
                        updater: function($upd, status) {
                            if (status.isDone()) $upd.curry(status).delay(0.1); }});
                },

                endRequest: function(status) {
                    gitInterface.commandInProgress = null;
                    this.endInterval();
                    this.read(status.transport.responseText);
                    lively.bindings.signal(this, 'end', this);
                    if (thenDo) thenDo(cmd);
                },

                getStdout: function() { return this._stdout; },
                getStderr: function() { return this._stderr; },
                getCode: function() { return Number(this._code); }
            };
        if (!gitInterface.commandInProgress) cmd.startRequest();
        else gitInterface.scheduleCommand(cmd);
        return cmd;
    },

    localGitDirectory: function() {
        var webR = this.gitControlURL.asWebResource().beSync();
        try {
            return JSON.parse(webR.get().content).cwd;
        } catch(e) { return ''; }
    },

    parseCommandIntoCommandAndArgs: function(cmd) {
        var result = [], word = '', state = 'normal';
        function add() { 
            if (word.length > 0) result.push(word); word = '';
        }
        for (var i = 0, c; c = cmd[i]; i++) {
            if (state === 'normal' && /\s/.test(c)) { add(); continue; }
            if (c === "\"" || c === "'") {
                if (state === 'normal') { state = c; }
                else if (state === c) state = 'normal'
            }
            word += c;
        }
        add();
        return result;
    }


});

Object.subclass("lively.ide.FilePatch",
'initializing', {
    read: function(patchString) {
        // simple parser for unified patch format;
        var lines = patchString.split('\n'), line, hunks = this.hunks = [];

        // 1: parse header
        // line 0 like: "diff --git a/test.txt b/test.txt\n"
        line = lines.shift();
        if (line.match(/^diff/)) { this.command = line; line = lines.shift(); }
        if (line.match('^index')) { line = lines.shift(); }

        lively.assert(line.match(/^---/), 'patch parser line 2');
        this.pathOriginal = line.split(' ').last();
        line = lines.shift();

        lively.assert(line.match(/^\+\+\+/), 'patch parser line 3');
        this.pathChanged = line.split(' ').last();

        while (lines.length > 0) {
            var hunk = new lively.ide.FilePatchHunk();
            hunks.push(hunk.read(lines));
        }
        return this;
    }
},
'patch creation', {
    createPatchString: function() {
        var parts = [];
        if (this.command) parts.push(this.command);
        parts.push(this.pathOriginal);
        parts.push(this.pathChanged);
        parts.pushAll(this.hunks.invoke('createPatchString'));
        return parts.join('\n');
    },
    createPatchStringFromRows: function(startRow, endRow) {
        return ''
    }
});

Object.extend(lively.ide.FilePatch, {
    read: function(patchString) { return new this().read(patchString); }
});

Object.subclass("lively.ide.FilePatchHunk",
'initialize', {
    read: function(lines) {
        // parse header
        var header = lines.shift(),
            headerMatch = header.match(/^@@\s*-([0-9]+),?([0-9]*)\s*\+([0-9]+),?([0-9]*)\s*@@/);
        lively.assert(headerMatch, 'hunk header ' + header);
        this.header = headerMatch[0];
        this.originalLine = Number(headerMatch[1]);
        this.originalLength = Number(headerMatch[2]);
        this.changedLine = Number(headerMatch[3]);
        this.changedLength = Number(headerMatch[4]);
        // parse context/addition/deletions
        this.lines = [];
        while (lines[0] && !lines[0].match(/^@@/)) {
            this.lines.push(lines.shift());
        }
        this.length = this.lines.length + 1; // for header
        return this;
    }
},
'patch creation', {
    createPatchString: function() {
        return [this.header].concat(this.lines).join('\n');
    },
    createPatchStringFromRows: function(startRow, endRow) {
        // row 0 is the header
        var origLine = this.originalLine,
            changedLine = this.changedLine,
            origLength = this.originalLength,
            changedLength = this.changedLength,
            lines = [], header;
        this.lines.forEach(function(line, i) {
            i++; // compensate for header
            if (i < startRow) {
                switch (line[0]) {
                    case ' ': changedLine++; origLine++; changedLength--; origLength--; return;
                    case '-': changedLine++; origLine++; origLength--; return;
                    case '+': changedLength--; return;
                    default: return;
                }
            }
            if (i > endRow) {
                switch (line[0]) {
                    case ' ': changedLength--; origLength--; return;
                    case '-': origLength--; return;
                    case '+': changedLength--; return;
                    default: return;
                }
            }
            lines.push(line);

        });
        header = Strings.format('@@ -%s,%s +%s,%s @@',
            origLine, origLength, changedLine, changedLength);
        return [header].concat(lines).join('\n');
    }
});

}) // end of module