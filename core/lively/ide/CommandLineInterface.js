module('lively.ide.CommandLineInterface').requires('lively.Network', 'lively.net.SessionTracker', 'lively.morphic.Graphics', 'lively.ide.FileSystem').toRun(function() {

Object.subclass('lively.ide.CommandLineInterface.Command',
"initializing", {

    isShellCommand: true,
    _options: {},
    _commandString: null,
    _stdout: '',
    _stderr: '',
    _code: '',
    _pid: null,
    _started: false,
    _done: false,
    _killed: false,
    interval: null,
    streamPos: 0,
    _resolveFuncs: null,
    _rejectFuncs: null,

    initialize: function(commandString, options) {
        this._commandString = commandString;
        options = options || {};
        options.cwd = options.cwd || lively.ide.CommandLineInterface.rootDirectory;
        options.commandLineServerURL = options.commandLineServerURL || lively.ide.CommandLineInterface.commandLineServerURL;
        options.ansiAttributesRegexp = options.hasOwnProperty("ansiAttributeEscape") ? options.ansiAttributeEscape : lively.ide.CommandLineInterface.ansiAttributesRegexp;
        this._options = options;
        this._resolveFuncs = [];
        this._rejectFuncs = [];
    }

},
"testing", {
    isDone: function() { return !!this._done; },
    isRunning: function() { return !this.isDone() && !!this.interval; },
    wasKilled: function() { return !!this._killed; },
},
"accessing", {

    get stdout() { return this.getStdout(); },
    get stderr() { return this.getStderr(); },
    get code() { return this.getCode(); },
    get group() { return this.getGroup(); },
    get output() { return this.resultString(true); },
    get command() { return this.getCommand(); },
    get done() { return this.isDone(); },
    get started() { return this._started; },
    get options() { return this._options; },
    get startTime() { return this._startTime; },
    get endTime() { return this._endTime; },
    get pid() { return this.getPid(); },

    getStdout: function() { return this._stdout || ''; },

    getStderr: function() { return this._stderr || ''; },

    getCode: function() { return Number(this._code); },

    getPid: function() { return this._pid; },

    getGroup: function() { return this._options.group || null; },

    getStartTime: function() { return this._startTime ? new Date(this._startTime) : null; },

    getEndTime: function() { return this._endTime ? new Date(this._endTime) : null; },

    kill: function(signal, thenDo) {
      return new Promise((resolve, reject) => {
        var group = this.getGroup() || lively.ide.CommandLineInterface.defaultGroup;
        if (this._done) {
            thenDo && thenDo();
            resolve();
        } else if (lively.ide.CommandLineInterface.isScheduled(this, group)) {
            this._killed = true;
            lively.ide.CommandLineInterface.unscheduleCommand(this, this.getGroup());
            thenDo && thenDo();
            resolve();
        } else {
            this._killed = true;
            lively.ide.CommandLineInterface.kill(this, thenDo).then(resolve, reject);
        }
      })
    },

    resultString: function(bothErrAndOut) {
        return bothErrAndOut ?
            this.getStdout().trim() + '\n'+  this.getStderr().trim() :
            (this.getCode() ? this.getStderr() : this.getStdout()).trim();
    },

    whenDone: function(func) {
        this._options.whenDone = func;
        return this;
    }

},
"server communication", {

    getWebResource: function() {
        return this._webResource
           || (this._webResource = this._options.commandLineServerURL.asWebResource());
    },

    readInterval: function() {
        var webR = this.getWebResource();
        var xhr = webR.status && webR.status.transport;
        if (!xhr) return;
        this.read(xhr.responseText);
    },

    startInterval: function() {
        this.endInterval();
        this.interval = Global.setInterval(this.readInterval.bind(this), 50);
    },

    endInterval: function() {
        if (this.interval) { Global.clearInterval(this.interval); this.interval = null; }
    },

    read: function(string) {
        var input = string.slice(this.streamPos, string.length),
            headerMatch = input.match(/^<SHELLCOMMAND\$([A-Z]+)([0-9]+)>/);
        if (!headerMatch) return;
        // show('pos: %s, reading: %s', this.streamPos, string);
        var header = headerMatch[0],
            type = headerMatch[1].toLowerCase(),
            length = Number(headerMatch[2]),
            readContent = input.slice(header.length, header.length+length),
            remaining = input.slice(header.length + length);
        if (this._options.ansiAttributesRegexp) readContent = readContent.replace(this._options.ansiAttributesRegexp, '');
        // show('type: %s, length: %s, content: %s, remaining: %s',
        //     type, length, readContent, remaining);
        lively.bindings.signal(this, type, readContent);
        this['_' + type] += readContent;
        this.streamPos += header.length + length;
        if (this.streamPos < string.length) this.read(string);
    },

    startRequest: function() {
        var webR = this.getWebResource();
        this._startTime = Date.now();
	this._started = true;
        if (this._options.sync) webR.beSync(); else webR.beAsync();
        lively.bindings.connect(webR, 'status', this, 'endRequest', {
            updater: function($upd, status) {
                if (!status.isDone()) return;
                var update = $upd.curry(status);
                if (this.sourceObj.isSync()) update(); else update.delay(0.1);
            }
        });
        var env = lively.lang.obj.merge(lively.Config.get("shellEnvVars"), this._options.env);
        webR.post(JSON.stringify({
            command: this.getCommand(),
            cwd: this._options.cwd,
            env: env,
            stdin: this._options.stdin,
            isExec: !!this._options.exec
        }), 'application/json');
        if (!this._options.sync) this.startInterval();
        return this;
    },

    endRequest: function(status) {
        this._done = true;
        this._endTime = Date.now();
        this.endInterval();
        this.read(status.transport.responseText);
        lively.bindings.signal(this, 'end', this);
        if (Object.isFunction(this._options.whenDone))
          this._options.whenDone.call(null,null,this);
    }
},
'internal', {
    getCommand: function() {
        return this._options.exec ? this._commandString : lively.ide.CommandLineInterface.parseCommandIntoCommandAndArgs(this._commandString);
    }
},
'promise interface', {

  then: function(resolveFunc, rejectFunc) {
    var self = this;
    var p = new Promise(function(resolve, reject) {
  	  resolveFunc && self._resolveFuncs.push(resolve);
  	  rejectFunc && self._rejectFuncs.push(reject);
    }).then(resolveFunc, rejectFunc);
    if (!this.isDone()) lively.bindings.connect(this, 'end', this, 'invokeThens');
    else this.invokeThens();
    return p;
  },

  catch: function(rejectFunc) { return this.then(null, rejectFunc); },

  invokeThens: function() {
    lively.bindings.disconnect(this, 'end', this, 'invokeThensWithTimeout');
    var toCall = this._resolveFuncs,
        arg = this.toJSON();
    // var toCall = this.code ? this._rejectFuncs : this._resolveFuncs,
    //     arg = this.code ? new Error(this.output) : this.toJSON();
    this._resolveFuncs = [];
    this._rejectFuncs = [];
    toCall.forEach(function(func) { func(arg); });
  }

},
'printing and serialization', {

  toJSON: function() {
    return {
      type:      this.constructor.type,
      stdout:    this.stdout,
      stderr:    this.stderr,
      code:      this.code,
      group:     this.group,
      output:    this.output,
      command:   this.command,
      done:      this.done,
      started:   this.started,
      options:   this.options,
      startTime: this.startTime,
      endTime:   this.endTime,
      pid:       this.pid,
      cwd:       this._options.cwd,
      stdin:     this._options.stdin
    };
  },

    printState: function() {
        var cmdString = this.getCommand();
        var string = Object.isArray(cmdString) ? cmdString.join(' ') : cmdString;
        var statusString = [
            this.isRunning() ?
                'runs' :
                    this.isDone() ?
                        "exited " + this.getCode() : "not started",
            this.getPid ? 'pid ' + this.getPid() : 'no pid'].join(',');
        return '[' + statusString + '] ' + string;
    },

    toString: function() {
        return 'ShellCommand(' + this.printState() + ')';
    }
});

lively.ide.CommandLineInterface.Command.subclass('lively.ide.CommandLineInterface.PersistentCommand',
'testing', {
    isRunning: function() { return !this.isDone() && (this._started || !!this.getPid()); }
},
"connection", {

    isOnline: function() {
        var s = this.getSession();
        return s && s.isConnected();
    },

    send: function(selector, msg, thenDo) {
        if (!this.isOnline()) {
            thenDo(new Error('Not online!'), null);
            return;
        }
        var s = this.getSession();
        var serverId = this._options.serverSession ? this._options.serverSession.id : s.trackerId;
        s.sendTo(serverId, selector, msg, function(answer) { thenDo(null, answer); });
    }

},
"control", {
    start: function() {
        if (this._started) return this;

        this._started = true;
        this._startTime = Date.now();
        var env = lively.lang.obj.merge(lively.Config.get("shellEnvVars"), this._options.env);
        var cmdInstructions = {
            command: this.getCommand(),
            cwd: this._options.cwd,
            env: env,
            stdin: this._options.stdin,
            isExec: false
        }, self = this;

        if (this._options.server && !this._options.serverSession) {
            this.startServerIDLookup();
            return;
        }

        this.send('runShellCommand', cmdInstructions, function(err, answer) {
            if (!answer) return;
            if (!answer.expectMoreResponses) { self.onEnd(answer.data); return; }
            if (!answer.data) return;
            if (answer.data.pid) { self._pid = answer.data.pid; lively.bindings.signal(self, 'pid', self._pid); return; }
            answer.data.stderr && read('stderr', answer.data.stderr);
            answer.data.stdout && read('stdout', answer.data.stdout);
            // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
            function read(type, content) {
                if (self._options.ansiAttributesRegexp) content = content.replace(self._options.ansiAttributesRegexp, '');
                lively.bindings.signal(self, type, content);
                self['_' + type] += content;
            }
        });
        return this;
    },
    write: function(string, thenDo) {
        if (!this.isRunning) { thenDo && thenDo('Not running', null); }
        var data = {pid: this.getPid(), input: string || ''};
        this.send('writeToShellCommand', data, function(err, answer) {
            if (answer.error) { thenDo && thenDo(answer.error, null); return; }
            thenDo && thenDo(answer);
        });
    },
    onEnd: function(exitCode) {
        this._code = exitCode;
        this._done = true;
        this._endTime = Date.now();
        lively.bindings.signal(this, 'end', this);
        var group = this.getGroup() || lively.ide.CommandLineInterface.defaultGroup;
        if (lively.shell.isScheduled(this, group)) lively.shell.unscheduleCommand(this, group);
        if (Object.isFunction(this._options.whenDone)) this._options.whenDone.call(null,null,this);
    },
    checkIfCommandIsStillAttachedAndRunning: function(thenDo) {
        var pid = this.getPid();
        if (!pid) { thenDo && thenDo('no pid'); return; }
        var checkCmd = new this.constructor("ps aux | grep " + pid);
        var self = this;
        function cb() {
            if (checkCmd.getCode()) { thenDo && thenDo(checkCmd.resultString()); }
            // out like
            // robert  66091  0.0  0.0  2432784...
            // robert  66089  0.0  0.0  2433364...
            var out = checkCmd.resultString(), table = Strings.tableize(out),
                pids = table.pluck(1);
            if (pids.include(pid)) {
                self._killed = false;
                thenDo && thenDo(null);
            } else {
                self.onEnd(666);
            }
        }
        lively.bindings.connect(checkCmd, 'end', {cb: cb}, 'cb');
        return checkCmd.start();
    }
},
"accessing", {

    getSession: function() {
        return lively.net.SessionTracker
            && lively.net.SessionTracker.getSession();
    },

    kill: function(signal, thenDo) {
      thenDo = thenDo && lively.lang.fun.once(thenDo);
      return new Promise((resolve, reject) => {
        var group = this.getGroup() || lively.ide.CommandLineInterface.defaultGroup,
            isScheduled = lively.ide.CommandLineInterface.isScheduled(this, group);

        if (this._done) {
            isScheduled && lively.ide.CommandLineInterface.unscheduleCommand(this, group);
            thenDo && thenDo();
            resolve();
        } else if (!this._started && lively.ide.CommandLineInterface.isScheduled(this, this.getGroup())) {
            this._killed = true;
            isScheduled && lively.ide.CommandLineInterface.unscheduleCommand(this, group);
            thenDo && thenDo();
            resolve();
        } else {
            var pid = this.getPid();
            if (!pid) { var err = new Error('Command has no pid!'); thenDo && thenDo(err, null); reject(err); }
            var self = this;
            signal = signal || "SIGKILL";
            this.send('stopShellCommand', {signal: signal, pid:pid} , function(err, answer) {
                err = err || (answer.data && answer.data.error);
                if (err) console.warn("stopShellCommand: " + err);
                var running = answer && answer.commandIsRunning;
                self._killed = !running; // hmmmmm
                isScheduled && lively.ide.CommandLineInterface.unscheduleCommand(self, group);
                thenDo && thenDo(err, answer);
                err ? reject(err) : resolve(answer);
            });
        }
      });
    }
},
'internal', {
    getCommand: function() {
        return this._commandString;
    },

    startServerIDLookup: function() {
        var cmd = this,
            url = this._options.server,
            sess = this.getSession();

        lively.lang.fun.composeAsync(
            getIpAddress,
            getLively2LivelyId,
            filterTrackerSessions
        )(function(err, sess) {
            if (err || !sess) {
                cmd._stderr = String(err);
                show("server find session error: %s", err);
                cmd.onEnd(404);
            } else {
                cmd._options.serverSession = sess;
                cmd._started = false; // FIXME for re-entry
                cmd.start();
            }
        })

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function getIpAddress(next) {
            lively.shell.run("nslookup " + url, {}, function(err, cmd) {
                var nsLookupString = cmd.resultString(true),
                    answer = Strings.tableize(nsLookupString).filter(function(entry) { return entry[0] === "Address:" ? entry[1] : null }).last(),
                    ip = answer ? answer.last() : null;
                next(ip ? null : new Error("nslookup failed"), ip);
            });
        }

        function getLively2LivelyId(ip, next) {
            lively.net.tools.Functions.withTrackerSessionsDo(sess,
              function(err, trackers) { 
                next(err, ip, trackers); });
        }

        function filterTrackerSessions(ip, trackers, next) {
            var sess = trackers.detect(function(sess) { return sess.remoteAddress === ip; });
            next(sess ? null : new Error("Could not find tracker session to run remote shell"), sess);
        }

    }
},
'compatibility', {
    startRequest: function() { return this.start(); }
});

Object.extend(lively.ide.CommandLineInterface, {

    rootDirectory: null,

    WORKSPACE_LK: null,

    commandQueue: {},

    defaultGroup: "ungrouped-command",

    reset: function() {
        this.rootDirectory = null,
        this.commandQueue && Properties.forEachOwn(this.commandQueue,
            function(group, cmds) { cmds.forEach(function(cmd) { cmd.kill(); }); });
        this.commandQueue = {};
    },
    getGroupCommandQueue: function(group) {
        return this.commandQueue[group] || (this.commandQueue[group] = []);
    },
    isScheduled: function(cmd, group) {
        var queue = group && this.getGroupCommandQueue(group);
        return queue && queue.include(cmd);
    },
    scheduleCommand: function(cmd, group) {
        lively.bindings.connect(cmd, 'end', lively.ide.CommandLineInterface, 'unscheduleCommand', {
            updater: function($upd, cmd) { $upd(cmd, cmd.getGroup()); }});
        if (!group) group = lively.shell.defaultGroup + Strings.newUUID();
        var queue = this.getGroupCommandQueue(group);
        if (queue) {
          queue.push(cmd);
          queue.forEach(function(cmd) { if (cmd.isDone()) queue.remove(cmd); })
          if (queue.indexOf(cmd) === 0) cmd.startRequest();
          else if (queue[0] && !queue[0].isRunning()) queue[0].startRequest();
        } else cmd.startRequest();
    },
    unscheduleCommand: function(cmd, group) {
      group = group || lively.shell.defaultGroup
      var queue = group && this.getGroupCommandQueue(group);
      if (queue) { queue.remove(cmd); }
      if (group) this.startCommandFromQueue(group);
      if (!lively.shell.commandQueue[group] || !lively.shell.commandQueue[group].length)
        delete lively.shell.commandQueue[group];
    },
    startCommandFromQueue: function(group) {
        if (!group) return null;
        var cmd = this.getGroupCommandQueue(group).shift();
        return cmd && cmd.startRequest();
    },
    groupCommandInProgress: function(group) {
        return group && this.getGroupCommandQueue(group).length > 0;
    },
    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    commandLineServerURL: (function() {
        try {
            return URL.create(Config.nodeJSURL).asDirectory().withFilename('CommandLineServer/');
        } catch (e) { console.error(e + '\n' + e.stack); }
    })(),

    parseCommandIntoCommandAndArgs: function(cmd) {
        // lively.ide.CommandLineInterface.parseCommandIntoCommandAndArgs('grep o -')
        var result = [], word = '', state = 'normal';
        function add() {
            if (word.length > 0) result.push(word); word = '';
        }
        for (var i = 0, c; c = cmd[i]; i++) {
            if (state === 'normal' && /\s/.test(c)) { add(); continue; }
            if (c === "\"" || c === "'") {
                if (state === 'normal') { state = c; continue; }
                if (state === c) { state = 'normal'; continue; }
            }
            if (c === '\\' && state === cmd[i+1]) { i++; c = cmd[i]; }
            word += c;
        }
        add();
        return result;
    },

    run: function(commandString, options, thenDo) {
        /*
        cmd = lively.ide.CommandLineInterface.run('ls', {sync:true}, function(err, cmd) { show(cmd.resultString()); });
        cmd = lively.ide.CommandLineInterface.run('ls', {}, function(err, cmd) { show(cmd.resultString()); });
        cmd.resultString()
        lively.ide.CommandLineInterface.run('grep 1 -', {stdin: '123\n567\n,4314'}, function(err, cmd) { show(cmd.resultString()); });
        lively.ide.CommandLineInterface.kill();
        */

        thenDo = Object.isFunction(options) ? options : thenDo;
        options = !options || Object.isFunction(options) ? {} : options;

        // rk 2014-12-18: changed lively.shell.run to take two args (err +
        // cmd). In order to not break old code immediately we will fix things
        // here but make clear that the old usage with one arg is deprecated.
        if (thenDo && thenDo.length === 1) {
          var realThenDo = thenDo
          thenDo = function(err, cmd) {
            console.warn("The callback of lively.shell.run now takes two arguments, \"err\" and \"cmd\"!");
            realThenDo(cmd);
          };
        }
        if (thenDo) options.whenDone = thenDo;

        if (!options.group) options.group = lively.shell.defaultGroup + Strings.newUUID();

        var session = lively.net.SessionTracker.getSession(),
            lively2LivelyShellAvailable = session && session.isConnected(),
            commandClass = lively2LivelyShellAvailable && !options.sync ?
                lively.ide.CommandLineInterface.PersistentCommand :
                lively.ide.CommandLineInterface.Command;

        // prepare for askpass command
        if (lively2LivelyShellAvailable) {
            var env = options;
            options.env = Object.extend(options.env || {}, {
                "L2L_ASKPASS_SSL_CA_FILE": lively.Config.askpassSSLcaFile || "",
                "L2L_ASKPASS_SSL_KEY_FILE": lively.Config.askpassSSLkeyFile || "",
                "L2L_ASKPASS_SSL_CERT_FILE": lively.Config.askpassSSLcertFile || "",
                "ASKPASS_SESSIONID": session.sessionId,
                "L2L_EDITOR_SESSIONID": session.sessionId,
                "EDITOR": "lively-as-editor.sh",
                "L2L_SESSIONTRACKER_URL": String(session.sessionTrackerURL.withFilename('connect'))
            });
        }

        var cmd = new commandClass(commandString, options);
        if (options.addToHistory) this.history.addCommand(cmd);
        this.scheduleCommand(cmd, options.group);
        return cmd;
    },

    runAndOpen: function(commandString, options, thenDo) {
      var cmd = lively.ide.CommandLineInterface.run(commandString, options, thenDo);
      var m = module("lively.ide.tools.ShellCommandRunner");
      if (!m.isLoaded()) m.load();
      m.runWhenLoaded(function() { 
        var runner = m.forCommand(cmd, options);
        runner.openInWorldCenter().comeForward();
        thenDo && thenDo(null, runner);
      });
      return cmd;
    },

    getOut: function(commandString, options, thenDo) {
      // lively lively.shell.run, except the command result will be tested for
      // successful exit and the resultString() will be passed as 2. parameter to
      // thenDo.
      if (typeof options === "function") { thenDo = options; options = null; }
      return lively.ide.CommandLineInterface.run(commandString, options, function(err, cmd) {
        thenDo && thenDo(!cmd.getCode() ? null : new Error(cmd.getStderr()),
                         cmd.resultString(true));
      });
    },

    exec: function(commandString, options, thenDo) {
        /*
        show(lively.ide.CommandLineInterface.exec('expr 1 + 2', {sync:true}).resultString());
        cmdLineInterface= lively.ide.CommandLineInterface
        cmd
        */
        thenDo = Object.isFunction(options) ? options : thenDo;
        options = !options || Object.isFunction(options) ? {} : options;

        // rk 2014-12-18: changed lively.shell.run to take two args (err +
        // cmd). In order to not break old code immediately we will fix things
        // here but make clear that the old usage with one arg is deprecated.
        if (thenDo && thenDo.length === 1) {
          var realThenDo = thenDo
          thenDo = function(err, cmd) {
            console.warn("The callback of lively.shell.exec now takes two arguments, \"err\" and \"cmd\"!");
            realThenDo(cmd);
          };
        }
        if (thenDo) options.whenDone = thenDo;
        options.exec = true;
        return this.run(commandString, options);
    },

    execSync: function(commandString, options) {
        options = options || {};
        options.sync = true;
        return this.exec(commandString, options, null);
    },

    runAll: function(commands, thenDo) {
        // commands is an array of command spec objects like [
        //   {name: "cmd1", command: "ls -l"},
        //   {name: "cmd2", command: "echo ls: ${cmd1}"},
        // ];
        // simple reference of outputs is supported as seen above to allow
        // constructing commands out of former results
        /*
        lively.ide.CommandLineInterface.runAll([
          {name: "cmd1", command: "du -sh ."},
          {name: "cmd2", command: "echo dir size ${cmd1}"},
         ], function(err, commands) { show(Object.values(commands).invoke('resultString').join('\n')); })
        lively.ide.CommandLineInterface.runAll([{name: "cmd1", command: "ls ."}], function(err, commands) { show(commands.cmd1.resultString()); });
        */

        thenDo = thenDo || Functions.Null;
        var results = {}, group = lively.shell.defaultGroup + Strings.newUUID();
        commands.doAndContinue(function(next, ea, i) {
            // run either with exec by setting ea.isExec truthy, otherwise with run (spawn)
            var cmd = ea.command, runCommand;
            var opts = ea.options || {};
            if (!opts.group) opts.group = group;
            if (ea.isExec) runCommand = this.exec;
            else if (ea.readFile) { runCommand = this.readFile; cmd = ea.readFile; }
            else if (ea.writeFile) { runCommand = this.writeFile; cmd = ea.writeFile; ea.options = ea.options || {}; if (ea.content) ea.options.content = ea.content; }
            else runCommand = this.run;
            if (runCommand === this.run) {
                cmd = cmd.replace(/\$\{([^\}]+)\}/g, function(_, variable) {
                    return results[variable] && results[variable].isShellCommand ?
                        results[variable].resultString() : (results[variable] || ''); });
            }
            runCommand.call(this, cmd, opts, function(cmd) {
                var name = ea.name || String(i);
                results[name] = ea.transform ? ea.transform(cmd) : cmd;
                next();
            });
        }, function() { thenDo && thenDo(null, results); }, this);
    },

    kill: function(cmd, thenDo) {
        // FIXME just kills the running command, not looking for pid...
        /*
        lively.ide.CommandLineInterface.kill();
        */
        new Promise((resolve, reject) => {
          this.commandLineServerURL.asWebResource().beAsync().withJSONWhenDone(function(json) {
              thenDo && thenDo(json.message ? json.message : json); resolve(); }).del();
        })
    },

    getWorkingDirectory: function(thenDo) {
        // the directory the commandline server runs with
        var webR = this.commandLineServerURL.asWebResource();
        if (thenDo) webR.beAsync();
        var result;
        webR.withJSONWhenDone(function(data, status) {
          result = (data && data.cwd) || '';
          thenDo && thenDo(null, result);
        }).get();
        return result;
    },

    setWorkingDirectory: function(dir) {
      if (typeof $world !== "undefined") $world.currentWorkingDirectory = dir;
      this.rootDirectory = dir
      lively.bindings.signal(lively.shell, 'currentDirectory', dir);
      return dir;
    },

    cwd: function(thenDo) {
      var sync = typeof thenDo === "undefined";
      if (sync) {
        return safeCwd(this.rootDirectory || this.getWorkingDirectory());
      } else {
        if (this.rootDirectory) thenDo(null, safeCwd(this.rootDirectory));
        else this.getWorkingDirectory(thenDo);
      }
      function safeCwd(cwd) { return (cwd || "").replace(/(\/|\\)?$/, ""); }
    },

    cwdIsLivelyDir: function() { return !this.rootDirectory || this.cwd() === this.WORKSPACE_LK; },

    initWORKSPACE_LK: function(sync) {
      var webR = URL.nodejsBase.withFilename("CommandLineServer/").asWebResource();
      webR.withJSONWhenDone(function(json, status) {
        if (status.isSuccess())
          lively.ide.CommandLineInterface.WORKSPACE_LK = json.cwd;
          lively.ide.CommandLineInterface.PLATFORM = json.platform;
      });
      if (!sync) webR.beAsync();
      webR.get();
    },

    makeAbsolute: function(path) {
        var isAbsolute = !!(path.match(/^\s*[a-zA-Z]:\\/) || path.match(/^\s*\/.*/));
        if (isAbsolute) return path;
        var platform = lively.shell.getServerPlatform(),
            sep = platform.match(/^win/) ? '\\' : '/',
            baseDir = lively.shell.cwd(),
            needsSep = baseDir[baseDir.length-1] !== sep && path[0] !== sep;
        return baseDir + (needsSep ? '/' : '') + path;
    },

    normalizePath: function(path, thenDo) {
      this.run(lively.lang.string.format('echo `cd "%s"; pwd`;', path), {}, function(err, cmd) {
        thenDo(err, err ? null : cmd.getStdout().trim());
      });
    },

    readFile: function(path, options, thenDo) {
        if (typeof options === "function") { thenDo = options; options = null; }
        options = options || {};
        if (this.PLATFORM !== 'win32') path = '"' + path + '"';
        var cmd = this.run('cat ' + path, options);
        if (options.onInput) lively.bindings.connect(cmd, 'stdout', options, 'onInput');
        if (options.onEnd) lively.bindings.connect(cmd, 'end', options, 'onEnd');
        if (thenDo) lively.bindings.connect(cmd, 'end', {thenDo: thenDo}, 'thenDo');
        return cmd;
    },

    cat: function(path, options, thenDo) {
        // like readfile but with err, content callback isntead of cmd
        if (typeof options === "function") { thenDo = options; options = null; }
        return lively.ide.CommandLineInterface.readFile(path, options, function(cmd) {
          thenDo && thenDo(cmd.getCode() ? new Error(cmd.getStderr()) : null, cmd.getStdout()); });
    },

    writeFile: function(path, options, thenDo) {
        if (typeof options === "string") options = {content: options};
        options = options || {};
        options.content = options.content || '';
        if (this.PLATFORM !== 'win32') path = '"' + path + '"';
        var cmd = this.run('tee ' + path, {stdin: options.content, cwd: options.cwd});
        if (options.onEnd) lively.bindings.connect(cmd, 'end', options, 'onEnd');
        if (thenDo) lively.bindings.connect(cmd, 'end', {thenDo: thenDo}, 'thenDo');
        return cmd;
    },

    downloadFile: function(path, options, thenDo) {
        this.commandLineServerURL
            .withFilename("download-file")
            .withQuery({path: path})
            .asWebResource().beAsync()
            .get().whenDone(function(_, status) {
                thenDo && thenDo(status.isSuccess() ? null : status);
            });
    },

    rm: function(path, options, thenDo) {
      if (typeof options === "function") { thenDo = options; options = null; }
      options = options || {};
      return lively.ide.CommandLineInterface.run("rm -rf " + path, options, function(err, cmd) {
        (typeof thenDo === "function") && thenDo(cmd.getCode() ? cmd.resultString(true) : null); });
    },

    ls: function(path, thenDo) {
      return new Promise(function(resolve, reject) {
        lively.ide.CommandLineSearch.findFiles(
          "*",
          {rootDirectory: path, cwd: path, depth: 1},
          function(err, result) {
            err ? reject(err) : resolve(result);
            thenDo && thenDo(null, result);
          });
      })
    },

    diffIgnoringWhiteSpace: function(string1, string2, thenDo) {
        return lively.ide.CommandLineInterface.runAll([
            {command: 'mkdir -p diff-tmp/'},
            {writeFile: 'diff-tmp/a', content: string1},
            {writeFile: 'diff-tmp/b', content: string2},
            {name: 'diff', command: 'git diff -w --no-index --histogram diff-tmp/a diff-tmp/b'},
            {command: 'rm -rfd diff-tmp/'}
        ], function(err, result) { thenDo(result.diff.resultString(true)); });
    },

    diff: function(string1, string2, thenDo) {
        return lively.ide.CommandLineInterface.runAll([
            {command: 'mkdir -p diff-tmp/'},
            {writeFile: 'diff-tmp/a', content: string1},
            {writeFile: 'diff-tmp/b', content: string2},
            {name: 'diff', command: 'git diff --no-index --histogram diff-tmp/a diff-tmp/b'},
            {command: 'rm -rfd diff-tmp/'}
        ], function(err, result) { thenDo(result.diff.resultString(true)); });
    },

    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

    ansiAttributes: {
        // "\033[7m"              {name: 'invert', style: {}},
        // "\033[5m"              {name: 'blink', style: {}},
        // "\033[0J"              {name: 'eod', style: {}},
        // "\033[1{;1f"           {name: 'sod', style: {}},
        // "\033[0K"              {name: 'eol', style: {}},
        "":   {style: 'reset'},
        "0":  {style: 'reset'},
        "1":  {style: {fontWeight: 'bold'}},
        "4":  {style: {textDecoration: 'underline'}},
        "30": {style: {color: Color.black}},
        "40": {style: {backgroundColor: Color.black}},
        "31": {style: {color: Color.red}},
        "41": {style: {backgroundColor: Color.red}},
        "32": {style: {color: Color.green}},
        "42": {style: {backgroundColor: Color.green}},
        "33": {style: {color: Color.yellow}},
        "43": {style: {backgroundColor: Color.yellow}},
        "34": {style: {color: Color.blue}},
        "44": {style: {backgroundColor: Color.blue}},
        "35": {style: {color: Color.magenta}},
        "45": {style: {backgroundColor: Color.magenta}},
        "36": {style: {color: Color.cyan}},
        "46": {style: {backgroundColor: Color.cyan}},
        "37": {style: {color: Color.white}},
        "47": {style: {backgroundColor: Color.white}}
    },

    ansiAttributesRegexp: new RegExp(String.fromCharCode(0o033) + '\[[0-9;]*m', 'g'),

    toStyleSpec: function(string) {
        /*
        string = "hello\033[31m\033[4mwor\033[44mld\033[0m";
        result = lively.ide.CommandLineInterface.toStyleSpec(string);
        morph = new lively.morphic.Text(rect(0,0,100,20), result.string)
        morph.emphasizeRanges(result.ranges);
        morph.openInWorld().remove.bind(morph).delay(3);
        */

        var ansiAttributes = this.ansiAttributes, ansiAttributesRegexp = this.ansiAttributesRegexp;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var indexOffset = 0, result = [0,[]], currentAttributes = [];
        string = string.replace(ansiAttributesRegexp, function(match, index) {
            // match can look like this "\033[31m" or this "\033[1;31m"
            var attributeCodes = match.slice(2,match.length-1).split(';'),
                styles = Object.keys(ansiAttributes).map(function(code) {
                    return attributeCodes.include(code) && ansiAttributes[code] && ansiAttributes[code].style; }).compact();
            if (styles.length === 0) { indexOffset += match.length; return ''; } // nothing found in our table...
            result.push(index-indexOffset);
            result.push(currentAttributes.clone());
            if (styles.include('reset')) currentAttributes = [];
            else currentAttributes.pushAll(styles);
            indexOffset += match.length;
            return '';
        });
        var lastIndex = result[result.length-2];
        if (lastIndex < string.length) result.push(string.length, currentAttributes);

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
        var ranges = [];
        for (var i = 0; i < result.length; i += 2) {
            var idx = result[i], styles = result[i+1];
            var nextIdx = result[i+2], nextStyles = result[i+3];
            if (idx === nextIdx) continue;
            if (!Object.isNumber(nextIdx)) break;
            ranges.push([idx, nextIdx, Object.merge(nextStyles)]);
        }
        return {string: string, ranges: ranges};
    },

    withShellCompletionsDo: function(doFunc) {
        // lively.ide.CommandLineInterface.shellCompletions
        // lively.ide.CommandLineInterface.withShellCompletionsDo(function(err, compl) { show(compl.length) })
        var cmdLineInterface = lively.ide.CommandLineInterface;
        if (cmdLineInterface.shellCompletions) { doFunc(null, cmdLineInterface.shellCompletions); return; }
        cmdLineInterface.exec('compgen  -abckA function', function(err, cmd) {
            // show(Objects.inspect(cmd, {maxDepth: 1}));
            cmdLineInterface.shellCompletions = cmd.getStdout()
                .split('\n')
                .invoke('trim')
                .select(function(line) { return line.length && line; });
            doFunc(null, cmdLineInterface.shellCompletions);
        });
    },

    getServerPlatform: function() {
        if (this._serverPlatform) return this._serverPlatform;
        var serverEval= URL.create(Config.nodeJSURL+'/NodeJSEvalServer/').asWebResource();
        return this._serverPlatform = serverEval.beSync().post('process.platform').content;
    },

    runInWindow: function(cmd, options) {
      var m = lively.module("lively.ide.tools.ShellCommandRunner");
      return m.isLoaded() ?
        lively.ide.tools.ShellCommandRunner.run(cmd, options) :
        m.load().then(() => lively.ide.CommandLineInterface.runInWindow(cmd, options));
    }
});

(function WORKSPACE_LK() {
  lively.ide.CommandLineInterface.initWORKSPACE_LK(false);
})();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// file search related
lively.module("lively.ide.CommandLineSearch");

Object.extend(lively.ide.CommandLineSearch, {

    doGrepFromWorkspace: function(string, path, thenDo) {
        // will automaticelly insert grep results into currently focused workspace
        var focused = lively.morphic.Morph.focusedMorph(),
            codeEditor = focused instanceof lively.morphic.CodeEditor && focused;
        path = path || 'core/lively/';
        lively.ide.CommandLineSearch.doGrep(string, path, function(lines) {
            thenDo && thenDo(lines);
            if (!focused) return;
            var out = lines.length === 0 ? 'nothing found' : lines.join('\n');
            focused.printObject(null, '\n' + lines.join('\n'));
            var sel = focused.getSelection();
            sel.moveCursorToPosition(focused.indexToPosition(focused.positionToIndex(sel.anchor) + 1));
            sel.clearSelection();
        });
    },

    doGrep: function(string, path, options, thenDo) {
        if (typeof options === "function") {
          thenDo = options;
          options = null
        }

        options = lively.lang.obj.merge({
          exclusions: lively.Config.codeSearchGrepExclusions,
          fileTypes: [], // allow all,
          sizeLimit: "+1M"
        }, options);

        var lastGrep = lively.ide.CommandLineSearch.lastGrep;
        if (lastGrep && lastGrep.isRunning() && !lastGrep.wasKilled()) {
          lastGrep.kill("KILL");
          lively.lang.fun.waitFor(400,
            function() { return !lively.ide.CommandLineSearch.lastGrep; },
            function() {
              lively.ide.CommandLineSearch.doGrep(string, path, thenDo);
            })
          return;
        }

        path = path || '';
        if (path.length && !path.endsWith('/')) path += '/';
        var rootDirectory = lively.ide.CommandLineInterface.rootDirectory,
            fullPath = rootDirectory ? rootDirectory + path : path;
        if (!fullPath.length) fullPath = './core/';
        if (fullPath.endsWith('/')) fullPath = fullPath.slice(0,-1);

        var excludes = options.exclusions.length ? "-iname " + options.exclusions.map(Strings.print).join(' -o -iname ') : '',
            sizeExclude = options.sizeLimit ? '-size ' + options.sizeLimit : '',
            prune = [excludes, sizeExclude].compact().join(" -o "),
            prune = prune ? "\\( " + prune + " \\) -prune -o" : "",
            allowedFileNames = options.fileTypes.length ? "-iname " + options.fileTypes.map(Strings.print).join(' -o -iname ') : '',
            allowedFileNames = allowedFileNames ? "-a \\( " + allowedFileNames + " \\)" : "",
            // baseCmd = 'find %s \( %s -o -size +1M \) -prune -o -type f -a \( -iname "*.js" -o -iname "*.jade" -o -iname "*.css" -o -iname "*.json" \) -print0 | xargs -0 grep -inH -o ".\\{0,%s\\}%s.\\{0,%s\\}" ',
            baseCmd = 'find %s %s -type f %s -a -print0 | xargs -0 grep -IinH -o ".\\{0,%s\\}%s.\\{0,%s\\}" ',
            platform = lively.ide.CommandLineInterface.getServerPlatform(),
            baseCmd = platform !== 'win32' ? baseCmd.replace(/([\(\);])/g, '\\$1') : baseCmd,
            charsBefore = 80, charsAfter = 80,
            cmd = Strings.format(baseCmd, fullPath, prune, allowedFileNames, charsBefore, string, charsAfter);

        lively.ide.CommandLineSearch.lastGrep = lively.shell.run(cmd, function(err, r) {
            lively.ide.CommandLineSearch.lastGrep = null;
            if (r.wasKilled()) return;
            var lines = r.getStdout().split('\n')
              .map(function(line) { return line.replace(/\/\//g, '/'); });
            thenDo && thenDo(lines, fullPath);
        });
    },


    // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
    // browsing
    getCurrentBrowser: function(spec) {
        var focused = lively.morphic.Morph.focusedMorph(),
            win = focused && focused.getWindow(),
            widget = win && win.targetMorph.ownerWidget,
            browser = widget && widget.isSystemBrowser ? widget : null;
        return browser;
    },

    doBrowse: function(spec) {
        var modWrapper = lively.ide.sourceDB().addModule(spec.fileName),
            ff = modWrapper.ast();
        if (spec.line && ff && ff.getSubElementAtLine) ff = ff.getSubElementAtLine(spec.line, 20/*depth*/) || ff;
        return ff && ff.browseIt({line: spec.line/*, browser: getCurrentBrowser()*/});
    },

    extractBrowseRefFromGrepLine: function extractBrowseRefFromGrepLine(line, baseDir) {
        // extractBrowseRefFromGrepLine("lively/morphic/HTML.js:235:    foo")
        // = {fileName: "lively/morphic/HTML.js", line: 235}
        if (baseDir && line.indexOf(baseDir) === 0) line = line.slice(baseDir.length);
        line = line.replace(/\\/g, '/').replace(/^\.\//, '');
        var fileMatch = line.match(/((?:[^\/\s]+\/)*[^\.]+\.[^:]+):?([0-9]+)?/);
        return fileMatch ?
          {fileName: fileMatch[1], line: Number(fileMatch[2]), baseDir: baseDir}
          : null;
    },

    extractModuleNameFromLine: function(line) {
        var match = line.match(/([a-zA-Z0-9_-]+\.)+[a-zA-Z0-9_-]+/);
        if (!match || !match[0]) return null;
        return {fileName: module(match[0]).relativePath('js')};
    },

    doBrowseGrepString: function(grepString, baseDir) {
        var spec = this.extractBrowseRefFromGrepLine(grepString, baseDir);
        if (!spec) {
            show("cannot extract browse ref from %s", grepString);
            return false;
        } else {
            return this.doBrowse(spec);
        }
    },

    doBrowseAtPointOrRegion: function(codeEditor) {
        try {
            var pos = codeEditor.getCursorPositionAce(),
                line = codeEditor.aceEditor.session.getLine(pos.row),
                start = (lively.lang.string.peekLeft(line, pos.column, " ") || -1) + 1,
                end = lively.lang.string.peekRight(line, pos.column, " ") || line.length,
                substring = line.slice(start, end).replace(/\/\//g, '/'),
                spec = this.extractBrowseRefFromGrepLine(substring)
                    || this.extractModuleNameFromLine(substring);
            if (!spec) {
                show("cannot extract browse ref from %s", substring);
            } else {
                // this.doBrowse(spec);
                lively.ide.openFile(spec.fileName + (spec.line ? ':' + spec.line : ''));
            }
        } catch(e) {
            show('failure in doBrowseAtPointOrRegion: %s', e.stack);
        }
    },

    findFilesCommandString: function(pattern, options) {
        options = options || {};
        var rootDirectory = options.rootDirectory || '.';
        var P = lively.ide.CommandLineInterface.PLATFORM;
        var slash = P === 'win32' ? '\\' : '/'
        if (P !== 'win32' && !rootDirectory.endsWith(slash)) rootDirectory += slash;
        options.rootDirectory = rootDirectory;

        // we expect an consistent timeformat across OSs to parse the results
        var timeFormatFix = "if [ \"`uname`\" = \"Darwin\" ]; "
                          + "  then timeformat='-T'; "
                          + "else "
                          + "  timeformat=\"--time-style=+%b %d %T %Y\"; "
                          + "fi && ";
        var excludes = options.excludes || ("-iname " + lively.Config.codeSearchGrepExclusions.map(Strings.print).join(' -o -iname ')),
            searchPart = Strings.format('%s "%s"', options.re ? '-iregex' : (options.matchPath ? '-ipath' : '-iname'), pattern),
            depth = options.hasOwnProperty('depth') ? ' -maxdepth ' + options.depth : '',
            // use GMT for time settings by default so the result is comparable
            // also force US ordering of date/time elements, to help with the parsing
            commandString = P === 'win32' ?
              Strings.format(
              "find %s %s ( %s ) -prune -o "
              + "%s %s -print0 | xargs -0 -I{} ls -lLd --time-style=locale {}",
                rootDirectory, (options.re ? '-E ' : ''), excludes.replace(/"/g, ''), searchPart.replace(/"/g, ''), depth) :
              timeFormatFix + Strings.format(
                "env TZ=GMT LANG=en_US.UTF-8 "
              + "find %s %s \\( %s \\) -prune -o "
              + "%s %s -print0 | xargs -0 -I{} ls -lLd \"$timeformat\" \"{}\"",
                rootDirectory, (options.re ? '-E ' : ''), excludes, searchPart, depth);
        return commandString;
    },

    findFiles: function(pattern, options, callback) {
        // lively.ide.CommandLineSearch.findFiles('*html',
        //   {sync:true, excludes: STRING, re: BOOL, depth: NUMBER, cwd: STRING, matchPath: BOOL});
        options = lively.lang.obj.merge({findFilesGroup: "default-find-files-process"}, options)
        callback = callback || function() {}

        if (!lively.ide.CommandLineSearch._findFilesProcessGroups)
          lively.ide.CommandLineSearch._findFilesProcessGroups = {};
        var processGroups = lively.ide.CommandLineSearch._findFilesProcessGroups || (lively.ide.CommandLineSearch._findFilesProcessGroups = {});
        var processStateForThisGroup = processGroups[options.findFilesGroup] || (processGroups[options.findFilesGroup] = []);
        processStateForThisGroup.forEach(function(oldCmd) { oldCmd.kill(); });

        var commandString = this.findFilesCommandString(pattern, options),
            rootDirectory = options.rootDirectory,
            parseDirectoryList = lively.ide.FileSystem.parseDirectoryListFromLs,
            result = [];

        var cmd = lively.shell.run(commandString, options, function(err, cmd) {
          cmd.isOutdated = processStateForThisGroup.some(function(otherCmd) {
            return otherCmd.getStartTime() > cmd.getStartTime();
          });
          
          var err = cmd.getCode() != 0 ? cmd.resultString(true) : null;
          if (err) console.warn(err);
          result = !err && parseDirectoryList(cmd.getStdout(), rootDirectory);
          callback && callback(err, result || [], cmd);
        });
        processStateForThisGroup.push(cmd);

        return options.sync ? result : cmd;
    },

    interactivelyChooseFileSystemItem: function(prompt, rootDir, fileFilter, narrowerName, actions, initialCandidates, offerCreation) {
        // usage:
        // lively.ide.CommandLineSearch.interactivelyChooseFileSystemItem(
        //     'choose directory: ',
        //     lively.shell.exec("pwd", {sync: true}).getStdout().trim(),
        //     function(files) { return files.filterByKey('isDirectory'); },
        //     null,
        //     [function(candidate) { show(candidate); }])
        // search for file / directory matching input. Match rules are as follows
        // up to the last slash the input is taken as directory
        // everything that follows the last slash is a pattern.
        // If there is space after the last slash take it as *pattern*
        // other wise as pattern*
        // Example: input = "/foo/bar": match all subdirectories of
        // /foo/ that match "bar*".
        // "/foo/ bar" match all subdirectories of /foo/ that match "*bar*".

        actions = actions || [show];
        if (!rootDir) rootDir = lively.shell.exec("pwd", {sync: true}).getStdout().trim();
        if (rootDir) rootDir = rootDir.replace(/\/?$/, "/");
        var lastSearch;
        var initialCandidates = initialCandidates ? initialCandidates : (rootDir ? [rootDir] : []);
        var showsInitialCandidates = true;
        var searchForMatching = Functions.debounce(300, function(input, callback) {
            if (showsInitialCandidates) {
              showsInitialCandidates = false;
              if (initialCandidates.length)
                return callback(initialCandidates);
            }
            // var candidates = [input].compact(),
            var candidates = [],
                patternAndDir = extractDirAndPatternFromInput(input);
            if (patternAndDir) doSearch(input, patternAndDir.pattern, patternAndDir.dir, fileFilter, callback);
            else callback(candidates.map(fileToListItem));
        });

        var narrower = lively.ide.tools.SelectionNarrowing.getNarrower({
            name: narrowerName || '_lively.ide.interactivelyChooseFileSystemItem.NarrowingList',
            spec: {
                candidates: initialCandidates,
                prompt: prompt,
                input: initialCandidates[0] || undefined,
                candidatesUpdater: candidateBuilder,
                maxItems: 25,
                keepInputOnReactivate: false,
                completeInputOnRightArrow: true,
                completeOnEnterWithMultipleChoices: true,
                actions: actions
            }
        });

        lively.bindings.connect(narrower, 'escapePressed', onCancel, 'call');
        lively.bindings.connect(narrower, 'escapePressed', Global, 'show');

        return narrower;

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function candidateBuilder(input, callback) {
          callback([{isListItem: true, string: 'searching...', value: null}]);
          if (input === "undefined" || input === "searching...") input = "";
          searchForMatching(input, callback);
        };

        function doSearch(input, pattern, dir, filterFunc, thenDo) {
            if (lastSearch) { lastSearch.kill(); lastSearch = null; }
            var timeoutDelay = 5/*secs*/;
            var continueAction = Functions.either(
                // function timeout() { thenDo(fileListSoFar.map(fileToListItem)); },
                function timeout() { thenDo([]); },
                function filesFound(err, files) {
                    lastSearch = null;
                    thenDo((filterFunc || Functions.K)(files, input, pattern, dir)
                        .uniqBy(filesAreEqual)
                        .sort(sortFiles.curry(input))
                        .map(fileToListItem)
                        .compact()); });

            continueAction[0].delay(timeoutDelay); // in case findFiles crashes
            lastSearch = lively.ide.CommandLineSearch.findFiles(
                pattern, {rootDirectory: dir, depth: 1}, continueAction[1]);
        }

        function ignoreInvalidFiles(file) { return file.path !== "/"; }

        function ensureFile(f) {
            return Object.isString(f) ?
                {path: f, isDirectory: true, toString: function() { return this.path; }} : f;
        }

        function fileToListItem(file) {
            var name = file.name;
            if (!name) {
              var path = String(file.path);
              if (!path.length) return null;
              if (file.isDirectory) path = file.path = path.replace(/\/?$/, "/")
              name = path;
            }
            return {isListItem: true, string: name, value: file};
        }

        function extractDirAndPatternFromInput(input) {
            var result = {}, lastSlash = input.lastIndexOf('/');
            if (lastSlash === -1) return null; // don't do search
            result.dir = input.slice(0,lastSlash);
            var pattern = input.slice(lastSlash+1);
            if (pattern.startsWith(' ')) pattern = '*' + pattern.trim();
            result.pattern = pattern += '*';
            return result;
        }

        function filesAreEqual(fileA, fileB) {
            return fileA.path.replace(/(\/|\\)$/, '') == fileB.path.replace(/(\/|\\)$/, '');
        }

        function sortFiles(input, fileA, fileB) {
            if (input === fileA.path) return -2;
            if (input === fileB.path) return 2;
            if (fileA.isDirectory && !fileB.isDirectory) return -1;
            if (!fileA.isDirectory && fileB.isDirectory) return 1;
            if (fileA.path.toLowerCase() < fileB.path.toLowerCase()) return -1;
            if (fileA.path.toLowerCase() > fileB.path.toLowerCase()) return 1;
            return 0;
        }

        function onCancel() {
          lively.bindings.disconnectAll(narrower);
          actions[0].call(null,null);
        }
    }

});

Object.extend(lively.ide.CommandLineInterface, {
    history: {
        id: null,

        setId: function(id) {
            return lively.ide.CommandLineInterface.history.id = id;
        },

        clear: function() {
            lively.ide.CommandLineInterface.history.setCommands([]);
        },

        ensureId: function() {
            return lively.ide.CommandLineInterface.history.id
                || lively.ide.CommandLineInterface.history.setDefaultId();
        },

        setDefaultId: function() {
            var user = $world.getUserName(true) || 'anonymous',
                id = user + 'shell-command-history'
            return lively.ide.CommandLineInterface.history.setId(id);
        },

        addCommand: function(cmd) {
            var h = lively.ide.CommandLineInterface.history,
                cmdString = Array.isArray(cmd._commandString) ? cmd._commandString.join(" ") : cmd._commandString,
                rec = {time: Date.now(), group: cmd.getGroup(), commandString: cmdString};
            return h.setCommands(h.getCommands().concat([rec]))
        },

        setCommands: function(commands) {
            return lively.LocalStorage.set(lively.ide.CommandLineInterface.history.ensureId(), JSON.stringify(commands));
        },

        getCommands: function() {
            var id = lively.ide.CommandLineInterface.history.ensureId();
            // lively.LocalStorage.
            // lively.LocalStorage.get(id)
            // lively.LocalStorage.set(id, '')
            return JSON.parse(lively.LocalStorage.get(id) || "[]");
        },

        showHistory: function() {
            var cmds = lively.ide.CommandLineInterface.history.getCommands();
            $world.addCodeEditor({
                title: "Shell command history",
                textMode: 'text',
                content: cmds.map(function(ea) {
                    var ds = '?';
                    try { ds = new Date(ea.time).format("yy-mm-dd HH:MM:ss") } catch (e) {}
                    return Strings.format("[%s] %s", ds, ea.commandString);
                }).join('\n')
            }).getWindow().comeForward();
        }

    }
});

Object.extend(lively, {
    shell: lively.ide.CommandLineInterface,
    grep: lively.ide.CommandLineSearch.doGrepFromWorkspace
});

Object.extend(Global, {
    $grep: lively.ide.CommandLineSearch.doGrepFromWorkspace
});

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// diff / patching files
Object.subclass("lively.ide.FilePatch",
'initializing', {
    read: function(patchString) {
        // simple parser for unified patch format;
        var lines = Strings.lines(patchString),
            line,
            hunks = this.hunks = [],
            pathOriginal, pathChanged;
        if (lines[lines.length-1] === '') lines.pop();

        // 1: parse header
        // line 0 like: "diff --git a/test.txt b/test.txt\n". Also support
        // directly parse hunks if we see no header.
        if (!lines[0].startsWith("@@")) { // otherwise, no header
            line = lines.shift();
            if (!line.startsWith("---")) { // not at hunk header yet...
              this.command = line;
              var names = line.split(" ").slice(-2);
              pathOriginal = this.pathOriginal = names[0];
              pathChanged = this.pathChanged = names[1];
              this.fileNameA = names[0].replace(/^a\//, "");
              this.fileNameB = names[1].replace(/^b\//, "");
            }
        }

        while (lines.length > 0) {
            var hunk = lively.ide.FilePatchHunk.read(lines, pathOriginal, pathChanged);
            pathOriginal = hunk.pathOriginal;
            pathChanged = hunk.pathChanged;
            hunks.push(hunk);
        }

        return this;
    }
},
'patch creation', {

    reverse: function() {
        return lively.ide.FilePatch.read(this.createPatchString(true));
    },

    createPatchStringHeader: function(reverse) {
        var parts = [];
        if (this.command) parts.push(this.command);
        return parts.join('\n');
    },

    createPatchString: function(reverse) {
        return this.createPatchStringHeader(reverse) + '\n'
             + this.hunks.map(function(hunk, i) { return hunk.createPatchString(reverse, i === 0); }).join('\n')
             + "\n"
    },

    createPatchStringFromRows: function(startRow, endRow, forReverseApply) {
        var nHeaderLines = [this.command, this.pathOriginal, this.pathChanged].compact().length,
            hunkPatches = [];
        startRow = Math.max(startRow, nHeaderLines)-nHeaderLines;
        endRow -= nHeaderLines;
        var fileInfoIncluded = false;
        var hunkPatches = this.hunks.map(function(hunk, i) {
            var patch = hunk.createPatchStringFromRows(
                  startRow, endRow, forReverseApply, !fileInfoIncluded);
            fileInfoIncluded = fileInfoIncluded || !!patch;
            startRow -= hunk.length;
            endRow -= hunk.length;
            return patch;
        }).compact();
        if (hunkPatches.length === 0) return null;
        return this.createPatchStringHeader() + '\n' + hunkPatches.join('\n') + '\n';
    }
},
"accessing", {

  changesByLines: function() {
      return this.hunks.invoke("changesByLines").flatten();
  },

  length: function() {
    return lively.lang.string.lines(this.createPatchString()).length;
  }

},
"patching", {

  patch: function(string) {
      return this.changesByLines().reduce(function(patchedLines, change, i) {
          var startAddition = change.lineNoAdded-1,
              removed = change.removed.replace(/\n$/, ""),
              noLinesRemoved = removed ? Strings.lines(removed).length : 0,
              reallyRemoved = patchedLines.slice(startAddition, startAddition+noLinesRemoved).join('\n');

          if (removed !== reallyRemoved) {
              var msg = Strings.format("Change %s not matching: Expected \"%s\", got \"%s\"",
                                       i+1, removed, reallyRemoved);
              throw new Error(msg);
          }

          var added = change.added ? change.added : "",
              endAddition = startAddition + noLinesRemoved,
              result = patchedLines.slice(0, startAddition)
                          .concat(added ? Strings.lines(added.replace(/\n$/, "")) : [])
                          .concat(patchedLines.slice(endAddition));

          // show("%o", result.slice(startAddition-10, endAddition+10));
          return result;
      }, Strings.lines(string)).join("\n");
  }

});

Object.extend(lively.ide.FilePatch, {

    read: function(patchString) { return new this().read(patchString); },

    readAll: function(patchString) {
      // read a patch string that contains multiple patches to files
      var patchLines = lively.lang.string.lines(patchString)
        .reduce(function(patchLines, line) {
          // A typical patch looks like
          // diff --git a/foo.js b/foo.js
          // index eff30c3..49a21ef 100644
          // --- a/foo.js
          // +++ b/foo.js
          // @@ -781,5 +781,5 @@ ...
          //    a
          // -  b
          // +  c
          // split it at diff ... index
          var last = patchLines.last();
          if (!last) patchLines.push([line]);
          else if (line.match(/^(---|\+\+\+|@@|-|\+|\\| )/)) last.push(line);
          else if (last.length === 1) {
            // if we have just read the command the next line is probably an index... that we don't need
            /*ignore*/
          }
          else if (line === "") { /*ignore*/ }
          else patchLines.push([line]);
          return patchLines;
        }, []);

      return patchLines.map(function(ea) {
        return lively.ide.FilePatch.read(ea.join("\n")); })
    }
});

Object.subclass("lively.ide.FilePatchHunk",
'initialize', {
    read: function(lines, optPathOriginal, optPathChanged) {
        this.pathOriginal = optPathOriginal || "";
        this.pathChanged = optPathChanged || "";
        var length = 0;
        var line = lines.shift();

        // parse header
        // line 1 customized, depending on tool like "======" or "index zyx...abc"
        while (!line.startsWith("---") && !line.startsWith("@@")) { line = lines.shift(); }

        // lines 2,3 file name removed, file name added
        if (line.startsWith("---")) {
          this.pathOriginal = line.split(" ")[1] || this.pathOriginal;
          line = lines.shift();
        }
        this.fileNameA = this.pathOriginal.replace(/^a\//, "");

        if (line.startsWith("+++")) {
          this.pathChanged = line.split(" ")[1] || this.pathChanged;
          line = lines.shift();
        }
        this.fileNameB = this.pathChanged.replace(/^b\//, "");

        // position in file, like @@ -781,7 +781,7 @@ ...
        var headerMatch = line.match(/^@@\s*-([0-9]+),?([0-9]*)\s*\+([0-9]+),?([0-9]*)\s*@@/);
        lively.assert(headerMatch, 'hunk header ' + line);
        this.header = headerMatch[0];
        this.originalLine = Number(headerMatch[1]);
        this.originalLength = Number(headerMatch[2]);
        this.changedLine = Number(headerMatch[3]);
        this.changedLength = Number(headerMatch[4]);

        // parse context/addition/deletions
        this.lines = [];
        while (lines[0] && lines[0].match(/^[\+\-\s\\]/)) {
            this.lines.push(lines.shift());
        }
        this.length = this.lines.length + 1; // for header
        return this;
    }
},
'patch creation', {

    createPatchString: function(reverse, includeOriginalChangedFile) {
        return this.printHeader(reverse, includeOriginalChangedFile)
             + "\n" + this.printLines(reverse);
    },

    createPatchStringFromRows: function(startRow, endRow, forReverseApply, includeOriginalChangedFile) {
        // this methods takes the diff hunk represented by "this" and produces
        // a new hunk (as a string) that will change only the lines from startRow
        // to endRow. For that it is important to consider whether this patch
        // should be applied to add the patch to a piece if code (forReverseApply
        // = false) or if the code already has the change described by the patch
        // and the change should be removed from the code (forReverseApply = true)
        // Example with forReverseApply = false, startRow: 4, endRow: 5 (-c1, +b2)
        // @@ -1,2 +1,2 @@ -> @@ -1,2 +1,2 @@
        // +a              ->  b1
        // -b1             -> -c1
        // -c1             -> +b2
        // +b2             ->
        // (the existing code does not have line a and we don't want it so
        // simply remove, it has b1 but we don't select so don't remove it, we
        // choose the last two lines, just apply them normally)
        // Example with forReverseApply = true, startRow: 4, endRow: 5 (-c1, +b2)
        // @@ -1,2 +1,2 @@ -> @@ -1,2 +1,2 @@
        // +a              ->  a
        // -b1             -> -c1
        // -c1             -> +b2
        // +b2             ->
        // (the existing code does have a already and we don't want to reverse
        // the add so keep it, the patch removed b1 and we don't want to add it so
        // leave it out, use the rest normally (not inverted!) because patch
        // programs can calculate the revers themselves)

        if (endRow < 1 || startRow >= this.lines.length) return null;

        // row 0 is the header
        var origLine = this.originalLine,
            changedLine = this.changedLine,
            origLength = 0,
            changedLength = 0,
            header, copyOp = forReverseApply ? "+" : "-";

        var selection = this.lines.reduce(function(akk, line, i) {
            if (akk.atEnd) return akk;
            i++; // compensate for header
            if (i < startRow) {
                switch (line[0]) {
                    case    '+':
                    case    '-': origLine = origLine + akk.lines.length;
                                 changedLine = changedLine + akk.lines.length;
                                 changedLength = 0; origLength = 0;
                                 akk.lines = [];
                                 return akk;
                    case    ' ': changedLength++; origLength++; break;
                }
            } else if (i > endRow) {
                switch (line[0]) {
                    case    ' ': changedLength++; origLength++; break;
                    default    : akk.atEnd = true; return akk;
                }
            } else {
                switch (line[0]) {
                    case ' ': changedLength++; origLength++; break;
                    case '-': origLength++; break;
                    case '+': changedLength++; break;
                }
            }
            if (forReverseApply) {
              switch (line[0]) {
                  case '-': line = "+" + line.slice(1); break;
                  case '+': line = "-" + line.slice(1); break;
              }
            }
            akk.lines.push(line);
            return akk;
        }, {atEnd: false, lines: []});

        var lines = selection.lines;

        if (lines.length === 0) return null;
        var fileHeader = "";
        if (includeOriginalChangedFile) {
          fileHeader = "--- " + (forReverseApply ? this.pathChanged : this.pathOriginal)
                     + "\n"
                     + "+++ " + (forReverseApply ? this.pathOriginal : this.pathChanged)
                     + "\n";
        }
        header = Strings.format('%s@@ -%s,%s +%s,%s @@',
            fileHeader, origLine, origLength, changedLine, changedLength);
        return [header].concat(lines).join('\n');
    }

},
"accessing", {

    changesByLines: function() {
        var self = this;
        var baseLineAdded = this.changedLine;
        var baseLineRemoved = this.originalLine;
        var lineDiff = 0;
        var result =  this.lines.reduce(function(result, line, i) {
            if (line[0] === " ") {
                if (result.current) {
                  result.changes.push(result.current);
                  result.current = null;
                }
                return result;
            };

            var change = result.current
                     || (result.current = {
                          lineNoAdded: baseLineAdded+i+lineDiff,
                          lineNoRemoved: baseLineRemoved+i+lineDiff,
                          added: "", removed: ""});

            if (line[0] === "+") { change.added += line.slice(1) + "\n"; lineDiff++; }
            else if (line[0] === "-") { change.removed += line.slice(1) + "\n"; lineDiff--; }
            return result;
        }, {changes: [], current: null});
        if (result.current) result.changes.push(result.current);
        return result.changes;
    },

    relativeOffsetToFileLine: function(offset) {
      // given a line offset into the hunk, to which line no of the patched
      // file does it translate?
      return offset <= 0 ? this.changedLine -1 : this.lines.slice(0, offset).reduce(function(lineNo, line) {
        var c = line[0];
        return (c === '+' || c === ' ') ? lineNo + 1 : lineNo;
      }, this.changedLine-2);
    }
},
"printing", {

    printHeader: function(reverse, includeOriginalChangedFile) {
        var fileHeader = "";
        if (includeOriginalChangedFile) {
          fileHeader = "--- " + (reverse ? this.pathChanged : this.pathOriginal)
                     + "\n"
                     + "+++ " + (reverse ? this.pathOriginal : this.pathChanged)
                     + "\n";
        }
        var sub = reverse ?
          this.changedLine + "," + this.changedLength :
          this.originalLine + "," + this.originalLength;
        var add = reverse ?
          this.originalLine + "," + this.originalLength :
          this.changedLine + "," + this.changedLength
        return Strings.format("%s@@ -%s +%s @@", fileHeader, sub, add);
    },

    printLines: function(reverse) {
      return (reverse ?
        this.lines.map(function(line) {
          switch (line[0]) {
            case ' ': return line;
            case '+': return "-" + line.slice(1);
            case '-': return "+" + line.slice(1);
          }
        }) : this.lines).join("\n");
    }

});

Object.extend(lively.ide.FilePatchHunk, {
    read: function(patchString, optOriginalPath, optChangedPath) {
      return new this().read(patchString, optOriginalPath, optChangedPath);
    }
});

lively.ide.CommandLineInterface.SpellChecker = {
    spellCheckWord: function(word, thenDo) {
        // for input "hrlp" aspell returns the output:
        // @(#) International Ispell Version 3.1.20 (but really Aspell 0.60.6.1)
        // & hrlp 5 0: help, harelip, helper, Harold, herald
        lively.ide.CommandLineInterface.run('aspell -a', {stdin: word}, function(err, cmd) {
            var out = cmd.resultString();
            if (cmd.getCode()) { thenDo(out, []); return }
            var result = Strings.lines(out)[1];
            // if there are suggestions they come after a ":"
            if (!result || !result.length || !result.include(':')) { thenDo(null, []); return; }
            var suggestions = result.split(':').last().trim().split(/,\s?/);
            thenDo(null, suggestions);
        });
    }
}

}) // end of module
