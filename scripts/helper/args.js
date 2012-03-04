/*global require, exports, process, console*/
/*jshint immed: true, lastsemic: true*/

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

function dasherize(name) {
    return '--' + name.replace(/[A-Z]/g, function(m) { return "-" + m.toLowerCase() });
}

function switchOptions(switches, defaultOptions, banner) {
    var options = defaultOptions || {},
        parser = new optparse.OptionParser(switches);
    if (banner) { parser.banner = banner }
    switchNames(switches).forEach(function(name) {
        var prettyName = prettyOptionName(name);
        options[prettyName] = options[prettyName] || undefined;
        parser.on(name, function(key, value) {
            value = value || null; // to mark parsed args
            options[prettyName] = value; });
    });
    options.defined = function(name) { return this[name] !== undefined; };
    // Note: hasValue !== defined !
    options.hasValue = function(name) { return !!this[name]; };
    options.showHelpAndExit = function() { console.log(parser.toString()); process.exit(0); };
    options.dasherize = dasherize;
    parser.on('help', options.showHelpAndExit); // overwrite help
    delete options.help;
    parser.parse(process.argv);
    return options;
}

exports.options = switchOptions;