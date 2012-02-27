/*global require, exports, process, console*/

/*
 * Simpler version of optparse
 *
 */

var optparse = require('optparse');

function switchNames(switches) {
    var switchRe = /^\-\-([a-zA-Z0-9_\-]+).*/;
    function switchMapper(string) { return string.replace(switchRe, '$1'); }
    return switches.map(function(ea) {
        return switchRe.test(ea[0]) ? switchMapper(ea[0]) : switchMapper(ea[1]);
    });
}

function prettyOptionName(string) {
    return string.replace(/[\-_](.)/g, function(match) { return match[1].toUpperCase(); });
}

function switchOptions(switches, defaultOptions) {
    var options = defaultOptions || {},
        parser = new optparse.OptionParser(switches);
    switchNames(switches).forEach(function(name) {
        var prettyName = prettyOptionName(name);
        options[prettyName] = options[prettyName] || undefined;
        parser.on(name, function(key, value) {
            value = value || null; // to mark parsed args
            options[prettyName] = value; });
    });
    options.defined = function(name) { return options[name] !== undefined; };
    options.showHelpAndExit = function() { console.log(parser.toString()); process.exit(0); };
    parser.on('help', options.showHelpAndExit); // overwrite help
    delete options.help;
    parser.parse(process.argv);
    return options;
}

exports.options = switchOptions;