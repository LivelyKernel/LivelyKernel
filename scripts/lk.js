/*global exports, require, console*/

var fs = require('fs'),
    spawn = require('child_process').spawn,
    exec = require('child_process').exec,
    path = require('path'),
    Seq = require('seq');


// -=-=-=-=-=-=-=-=-=-=-
// Subcommand class
// -=-=-=-=-=-=-=-=-=-=-
function Subcommand(filename, dir) { this.filename = filename; this.dir = dir; }

Subcommand.prototype.name = function() {
    return this.filename.replace(/^lk\-/, '').replace(/\.js|\.sh/, '');
};

Subcommand.prototype.execString = function(args) {
    var cmd = /.js$/.test(this.filename) ? 'node ' : '';
    cmd += path.join(this.dir, this.filename);
    if (args) { cmd += ' ' + args.join(' '); }
    return cmd;
};

Subcommand.prototype.exec = function(args, thenDo) {
    var cmd = this.cmdString(args);
    console.log('RUNNING [' +  cmd + ']');
    spawn(cmd, function(code, out, err) { thenDo(out); });
};

Subcommand.prototype.spawnCmdAndArgs = function(args) {
    var isJs = /.js$/.test(this.filename),
        cmdPath = path.join(this.dir, this.filename),
        cmd = isJs ? 'node' : cmdPath;
    var spawnArgs = args;
    if (isJs) {
        spawnArgs = [cmdPath].concat(spawnArgs);
    }
    return {cmd: cmd, args: spawnArgs};
};

Subcommand.prototype.spawn = function(args, onExit) {
    var spawnSpec = this.spawnCmdAndArgs(args),
        spawned = spawn(spawnSpec.cmd, spawnSpec.args);

    // redirect fds
    spawned.stdout.on('data', function (data) {
        process.stdout.write(data);
    });

    spawned.stderr.on('data', function (data) {
        process.stdout.write(data);
    });

    spawned.on('exit', function (code) {
        onExit && onExit();
    });

};

Subcommand.prototype.showHelp = function(thenDo) {
    this.spawn(['--help'], thenDo);
};


// -=-=-=-=-=-=-=-=-=-=-
// lk def
// -=-=-=-=-=-=-=-=-=-=-
var subcommands = [];
var lk = {

    fs: fs,

    subcommands: function() { return subcommands; },

    getSubcommand: function(name) {
        for (var i = 0; i < subcommands.length; i++) {
            if (subcommands[i].name() == name) return subcommands[i];
        }
        return null;
    },

    readSubcommandsFrom: function(dir, cb) {
        this.fs.readdir(dir, function(err, files) {
            subcommands = subcommands.concat(lk.createSubcommands(dir, files));
            if (cb) cb(); });
    },

    createSubcommands: function(dir, fileNames) {
        return fileNames
               .filter(function(ea) { return (/^lk\-/).test(ea); })
               .map(function(ea) { return new Subcommand(ea, dir); });
    },

    showUsage: function() {
        var names = subcommands.map(function(ea) { return ea.name(); });
        console.log('Available subcommands:\n  ' + names.join('\n  '));
        console.log('Run \'lk help SUBCOMMAND\' to get more information about the specific subcommand.');
    }

};


// -=-=-=-=-=-=-=-=-=-=-
// Stuff for shell usage
// -=-=-=-=-=-=-=-=-=-=-
var calledDirectly = require.main === module,
    scriptDir = __dirname || path.dirname(module.filename);

function processArgs(args) {

    var cmdName = args[0],
        cmdArgs = args.slice(1);

    if (!cmdName || (cmdName == 'help' && cmdArgs.length === 0)) {
        lk.showUsage();
        process.exit(0);
    }

    if (cmdName == 'help') {
        var subCmdName = cmdArgs[0],
            subCmd = lk.getSubcommand(subCmdName);
        if (subCmd) {
            subCmd.showHelp(function() { process.exit(0); });
        } else {
            console.log('cannot find help for ' + subCmdName);
            process.exit(0);
        }
        return;
    }

    var subCmd = lk.getSubcommand(cmdName);
    subCmd.spawn(cmdArgs, function() {
        // console.log('DONE');
    });
}

if (calledDirectly) {
    lk.readSubcommandsFrom(scriptDir, function() {
        processArgs(process.argv.slice(2));
    });
}


// -=-=-=-=-=-=-=-=-=-=-
// exports
// -=-=-=-=-=-=-=-=-=-=-
for (var name in lk) {
    exports[name] = lk[name];
}