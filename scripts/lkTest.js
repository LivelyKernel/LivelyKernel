/*global QUnit, test, equal, same, raises, console, lk*/

/*
continously run with:
nodemon --exec qunit \
        -c lk:./scripts/lk.js \
        -t ./scripts/lkTest.js
*/

var fsMock, scriptDir = '/foo/bar';
QUnit.module('subcommands', {
    setup: function() {
        var fileNames = ['lk-foo.js', 'lk-bar-baz.sh', 'xxx.js'];
        fsMock = {readdir: function(dir, cb) { cb(null, fileNames); }};
        lk.fs = fsMock;
        lk.readSubcommandsFrom(scriptDir);
    },
    teardown: function() {}
});

test("list subcommands from file names", function () {
    var subs = lk.subcommands()
    equal(2, subs.length, "not two subcommands");
    equal('foo', subs[0].name(), "foo");
    equal('bar-baz', subs[1].name(), "bar-baz");
});

test("get subcommand", function () {
    var cmd = lk.getSubcommand('foo');
    equal('lk-foo.js', cmd.filename, "foo");
});

test("get exec path js", function () {
    var cmd = lk.getSubcommand('foo'),
        execString = cmd.execString();
    equal('node ' + scriptDir + '/lk-foo.js', execString);
});

test("get exec path sh", function () {
    var cmd = lk.getSubcommand('bar-baz'),
        execString = cmd.execString();
    equal(scriptDir + '/lk-bar-baz.sh', execString);
});

test("get spawn args js", function () {
    var cmd = lk.getSubcommand('foo'),
        spawnSpec = cmd.spawnCmdAndArgs(['--foo']);
    same({cmd: 'node', args: [scriptDir + '/lk-foo.js', '--foo']}, spawnSpec);
});

test("get spawn args sh", function () {
    var cmd = lk.getSubcommand('bar-baz'),
        spawnSpec = cmd.spawnCmdAndArgs(['--foo']);
    same({cmd: scriptDir + '/lk-bar-baz.sh', args: ['--foo']}, spawnSpec);
});
