/*global exports, require, module, console, process, __dirname*/

var fs = require('fs'),
    path = require('path'),
    lkEnv = require('./env'),
    shell = require('./helper/shell'),
    console = require('colorize').console,
    async = require('async');


// -=-=-=-=-=-=-=-=-=-=-
// Subcommand class
// -=-=-=-=-=-=-=-=-=-=-
function Subcommand(filename, dir) { this.filename = filename; this.dir = dir; }

Subcommand.prototype.name = function() {
    return this.filename.replace(/^lk\-/, '').replace(/\.js|\.sh/, '');
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
    var spawnSpec = this.spawnCmdAndArgs(args);
    shell.redirectedSpawn(spawnSpec.cmd, spawnSpec.args, onExit);
};

Subcommand.prototype.showHelp = function(thenDo) {
    this.spawn(['--help'], thenDo);
};

function printHelpForAllSubComamndsAndExit(nextArg) {
    var asMarkDown = nextArg === "--markdown";
    async.forEachSeries(subcommands, function(subcommand, next) {
        var name = 'lk ' + subcommand.name(),
            msg = asMarkDown ? "### " + name + '\n' : '#underline[' + name + ']';
        console.log(msg);
        subcommand.showHelp(function() {
            console.log("\n");
            next();
        });
    }, function() { process.exit(0); })
}

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
        console.log('Run \'lk help SUBCOMMAND\' to get more information about '
                    + 'the specific subcommand.\n'
                    + 'Run \'lk help --all\' to get a complete overview '
                    + 'for all subcommands');
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

    if (!cmdName) {
        lk.showUsage();
        process.exit(0);
    }

    if (cmdName == 'help') {
        var subCmdName = cmdArgs[0],
            subCmd = lk.getSubcommand(subCmdName);
        if (subCmdName == "--all") {
            printHelpForAllSubComamndsAndExit(cmdArgs[1]);
        } else if (subCmd) {
            subCmd.showHelp(function() { process.exit(0); });
        } else {
            lk.showUsage();
            process.exit();
        }
        return;
    }

    var subCmd = lk.getSubcommand(cmdName);
    if (!subCmd) {
        console.log('Unknown subcommand "' + cmdName + '"!');
        lk.showUsage();
        process.exit(0);
    }
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