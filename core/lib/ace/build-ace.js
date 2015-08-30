/*global require, process, console*/

/*
 * lk build-libs --lk-dir .
 *
 */

var fs      = require('fs'),
    exec    = require('child_process').exec,
    shelljs = require('shelljs'),
    async   = require('async'),
    path    = require('path'),
    http    = require('http'),
    https   = require('https'),
    url     = require('url'),
    dryice  = require('dryice'),
    env     = process.env;


var lkDir = "/Users/robert/Lively/LivelyKernel";

// -=-=-=-=-=-=-=-=-=-=-
// the real thing
// -=-=-=-=-=-=-=-=-=-=-
var comment = '';

function store(filePath, data, thenDo) {
    fs.writeFile(filePath, data, function() {
        console.log("storing all libs in %s (%skb)",
                    filePath, Math.round((data.length / 1024) * 100) / 100);
        thenDo && thenDo();
    });
}

function copyFile(from, to, thenDo) {
    shelljs.cp('-f', from, to);
    thenDo(null);
}

function write(next, filename, err, allData) {
    store(path.join(lkDir, filename), [comment + " */"].concat(allData).join('\n\n'));
    next && next();
}

function dryicePackage(spec, next) {
    spec.dest = path.join(lkDir, spec.dest);
    console.log("dryice %s -> %s", spec.source.root, spec.dest);
    dryice.copy(spec);
    next(null);
}

function createAceLibs(next) {
    // package up ace
    console.log("Packaging ace libs...");

    var aceIncludedFiles = [],
        aceLibDir = path.join(lkDir, "core/lib/ace/"),
        aceRepoDir = path.join(process.env.HOME, "Lively/ace/"),

        // aceBuildDir = path.join(process.env.LK_SCRIPTS_ROOT, "resources/pre-lib/ace-builds/");
        aceBuildDir = path.join(process.env.HOME, "Lively/ace-builds/src-noconflict/");

    var aceIncludes =  [// core stuff
                        "ace.js",
                        "ext-language_tools.js",
                        "ext-error_marker.js",
                        "keybinding-emacs.js",
                        "keybinding-vim.js"]
                        // modes
                       .concat(["clojure","dockerfile","css","diff","html","javascript","json","markdown",
                                "sh","snippets","sql","svg","text"].map(function(ea) { return "mode-" + ea + ".js"; }))
                        // themes
                       .concat(["ambiance","chaos","chrome","clouds","clouds_midnight","cobalt","crimson_editor","dawn","dreamweaver",
                                "eclipse","github","idle_fingers","katzenmilch","kr_theme","kuroir",
                                "merbivore","merbivore_soft","mono_industrial","monokai","pastel_on_dark","solarized_dark",
                                "solarized_light","terminal","textmate","tomorrow","tomorrow_night","tomorrow_night_blue",
                                "tomorrow_night_bright","tomorrow_night_eighties","twilight","vibrant_ink","xcode"].map(function(ea) { return "theme-" + ea + ".js"; }))
                         .map(function(ea) { return aceBuildDir + ea; });

    var aceOptionals = [// modes
                        "abap","applescript","assembly_x86","c_cpp","coffee","csharp","d","dart",
                        "dot","elm","erlang","forth","gitignore","golang","handlebars","haskell",
                        "jade","java","jsx","julia","latex","lisp","livescript","lua","makefile",
                        "matlab","mel","mysql","objectivec","ocaml","pgsql","plain_text","powershell",
                        "prolog","python","r","ruby","rust","sass","scala","scheme","scss","stylus",
                        "typescript","verilog","vhdl","xml","yaml"].map(function(ea) { return "mode-" + ea + ".js"; })
                        // ext
                       .concat(["worker-javascript.js", "ext-whitespace.js","ext-elastic_tabstops_lite.js","ext-emmet.js","ext-linking.js"])
                         .map(function(ea) { return aceBuildDir + ea; })
                        // snippets
                       .concat(["_","c","c_cpp","clojure","css","elm","haskell","html","javascript-jquery",
                                "javascript","markdown","sh","sql"].map(function(ea) { return aceRepoDir + "lib/ace/snippets/" + ea + ".snippets"; }))

    async.series([

        dryicePackage.bind(global, {
            source: aceIncludes,
            dest: "core/lib/ace/lively-ace.min.js"}),

        dryicePackage.bind(global, {
            source: aceIncludes,
            dest: "core/lib/ace/lively-ace.js"}),

        copyFile.bind(global, aceOptionals, aceLibDir)
    ], function(err) { next && next() });
}

// async.series([createCoreLibs, createExternalLibs]);
// createCoreLibs();
createAceLibs();
