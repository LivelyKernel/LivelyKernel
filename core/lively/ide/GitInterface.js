module('lively.ide.GitInterface').requires('lively.Network').toRun(function() {

Object.extend(lively.ide.GitInterface, {

    gitControlURL: URL.create(Config.nodeJSURL).asDirectory().withFilename('GitControl/'),

    commandQueue: [],

    scheduleCommand: function(cmd) {
        show("scheduleCommand %o", cmd);
        this.commandQueue.push(cmd);
        lively.bindings.connect(this.commandInProgress, 'end', this, 'commandFromQueue');
    },

    commandFromQueue: function() {
        var cmd = this.commandQueue.shift();
        show("commandFromQueue %o", cmd);
        cmd.startRequest();
    },

    command: function(commandString, thenDo) {
        var gitInterface = this,
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
                    var header = headerMatch[0]
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
                    webR.post(JSON.stringify({command: commandString}), 'application/json');
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
                getCode: function() { return Number(this._code); },
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
    }

});

}) // end of module