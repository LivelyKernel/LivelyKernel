(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.grasp = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){

},{}],2:[function(require,module,exports){
(function (process){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

// resolves . and .. elements in a path array with directory names there
// must be no slashes, empty elements, or device names (c:\) in the array
// (so also no leading and trailing slashes - it does not distinguish
// relative and absolute paths)
function normalizeArray(parts, allowAboveRoot) {
  // if the path tries to go above the root, `up` ends up > 0
  var up = 0;
  for (var i = parts.length - 1; i >= 0; i--) {
    var last = parts[i];
    if (last === '.') {
      parts.splice(i, 1);
    } else if (last === '..') {
      parts.splice(i, 1);
      up++;
    } else if (up) {
      parts.splice(i, 1);
      up--;
    }
  }

  // if the path is allowed to go above the root, restore leading ..s
  if (allowAboveRoot) {
    for (; up--; up) {
      parts.unshift('..');
    }
  }

  return parts;
}

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
var splitPathRe =
    /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;
var splitPath = function(filename) {
  return splitPathRe.exec(filename).slice(1);
};

// path.resolve([from ...], to)
// posix version
exports.resolve = function() {
  var resolvedPath = '',
      resolvedAbsolute = false;

  for (var i = arguments.length - 1; i >= -1 && !resolvedAbsolute; i--) {
    var path = (i >= 0) ? arguments[i] : process.cwd();

    // Skip empty and invalid entries
    if (typeof path !== 'string') {
      throw new TypeError('Arguments to path.resolve must be strings');
    } else if (!path) {
      continue;
    }

    resolvedPath = path + '/' + resolvedPath;
    resolvedAbsolute = path.charAt(0) === '/';
  }

  // At this point the path should be resolved to a full absolute path, but
  // handle relative paths to be safe (might happen when process.cwd() fails)

  // Normalize the path
  resolvedPath = normalizeArray(filter(resolvedPath.split('/'), function(p) {
    return !!p;
  }), !resolvedAbsolute).join('/');

  return ((resolvedAbsolute ? '/' : '') + resolvedPath) || '.';
};

// path.normalize(path)
// posix version
exports.normalize = function(path) {
  var isAbsolute = exports.isAbsolute(path),
      trailingSlash = substr(path, -1) === '/';

  // Normalize the path
  path = normalizeArray(filter(path.split('/'), function(p) {
    return !!p;
  }), !isAbsolute).join('/');

  if (!path && !isAbsolute) {
    path = '.';
  }
  if (path && trailingSlash) {
    path += '/';
  }

  return (isAbsolute ? '/' : '') + path;
};

// posix version
exports.isAbsolute = function(path) {
  return path.charAt(0) === '/';
};

// posix version
exports.join = function() {
  var paths = Array.prototype.slice.call(arguments, 0);
  return exports.normalize(filter(paths, function(p, index) {
    if (typeof p !== 'string') {
      throw new TypeError('Arguments to path.join must be strings');
    }
    return p;
  }).join('/'));
};


// path.relative(from, to)
// posix version
exports.relative = function(from, to) {
  from = exports.resolve(from).substr(1);
  to = exports.resolve(to).substr(1);

  function trim(arr) {
    var start = 0;
    for (; start < arr.length; start++) {
      if (arr[start] !== '') break;
    }

    var end = arr.length - 1;
    for (; end >= 0; end--) {
      if (arr[end] !== '') break;
    }

    if (start > end) return [];
    return arr.slice(start, end - start + 1);
  }

  var fromParts = trim(from.split('/'));
  var toParts = trim(to.split('/'));

  var length = Math.min(fromParts.length, toParts.length);
  var samePartsLength = length;
  for (var i = 0; i < length; i++) {
    if (fromParts[i] !== toParts[i]) {
      samePartsLength = i;
      break;
    }
  }

  var outputParts = [];
  for (var i = samePartsLength; i < fromParts.length; i++) {
    outputParts.push('..');
  }

  outputParts = outputParts.concat(toParts.slice(samePartsLength));

  return outputParts.join('/');
};

exports.sep = '/';
exports.delimiter = ':';

exports.dirname = function(path) {
  var result = splitPath(path),
      root = result[0],
      dir = result[1];

  if (!root && !dir) {
    // No dirname whatsoever
    return '.';
  }

  if (dir) {
    // It has a dirname, strip trailing slash
    dir = dir.substr(0, dir.length - 1);
  }

  return root + dir;
};


exports.basename = function(path, ext) {
  var f = splitPath(path)[2];
  // TODO: make this comparison case-insensitive on windows?
  if (ext && f.substr(-1 * ext.length) === ext) {
    f = f.substr(0, f.length - ext.length);
  }
  return f;
};


exports.extname = function(path) {
  return splitPath(path)[3];
};

function filter (xs, f) {
    if (xs.filter) return xs.filter(f);
    var res = [];
    for (var i = 0; i < xs.length; i++) {
        if (f(xs[i], i, xs)) res.push(xs[i]);
    }
    return res;
}

// String.prototype.substr - negative index don't work in IE8
var substr = 'ab'.substr(-1) === 'b'
    ? function (str, start, len) { return str.substr(start, len) }
    : function (str, start, len) {
        if (start < 0) start = str.length + start;
        return str.substr(start, len);
    }
;

}).call(this,require('_process'))
},{"_process":3}],3:[function(require,module,exports){
// shim for using process in browser

var process = module.exports = {};

// cached from whatever global is present so that test runners that stub it
// don't break things.  But we need to wrap it in a try catch in case it is
// wrapped in strict mode code which doesn't define any globals.  It's inside a
// function because try/catches deoptimize in certain engines.

var cachedSetTimeout;
var cachedClearTimeout;

(function () {
  try {
    cachedSetTimeout = setTimeout;
  } catch (e) {
    cachedSetTimeout = function () {
      throw new Error('setTimeout is not defined');
    }
  }
  try {
    cachedClearTimeout = clearTimeout;
  } catch (e) {
    cachedClearTimeout = function () {
      throw new Error('clearTimeout is not defined');
    }
  }
} ())
var queue = [];
var draining = false;
var currentQueue;
var queueIndex = -1;

function cleanUpNextTick() {
    if (!draining || !currentQueue) {
        return;
    }
    draining = false;
    if (currentQueue.length) {
        queue = currentQueue.concat(queue);
    } else {
        queueIndex = -1;
    }
    if (queue.length) {
        drainQueue();
    }
}

function drainQueue() {
    if (draining) {
        return;
    }
    var timeout = cachedSetTimeout(cleanUpNextTick);
    draining = true;

    var len = queue.length;
    while(len) {
        currentQueue = queue;
        queue = [];
        while (++queueIndex < len) {
            if (currentQueue) {
                currentQueue[queueIndex].run();
            }
        }
        queueIndex = -1;
        len = queue.length;
    }
    currentQueue = null;
    draining = false;
    cachedClearTimeout(timeout);
}

process.nextTick = function (fun) {
    var args = new Array(arguments.length - 1);
    if (arguments.length > 1) {
        for (var i = 1; i < arguments.length; i++) {
            args[i - 1] = arguments[i];
        }
    }
    queue.push(new Item(fun, args));
    if (queue.length === 1 && !draining) {
        cachedSetTimeout(drainQueue, 0);
    }
};

// v8 likes predictible objects
function Item(fun, array) {
    this.fun = fun;
    this.array = array;
}
Item.prototype.run = function () {
    this.fun.apply(null, this.array);
};
process.title = 'browser';
process.browser = true;
process.env = {};
process.argv = [];
process.version = ''; // empty string to avoid regexp issues
process.versions = {};

function noop() {}

process.on = noop;
process.addListener = noop;
process.once = noop;
process.off = noop;
process.removeListener = noop;
process.removeAllListeners = noop;
process.emit = noop;

process.binding = function (name) {
    throw new Error('process.binding is not supported');
};

process.cwd = function () { return '/' };
process.chdir = function (dir) {
    throw new Error('process.chdir is not supported');
};
process.umask = function() { return 0; };

},{}],4:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, id, compact, unlines, min, max;
  ref$ = require('prelude-ls'), id = ref$.id, compact = ref$.compact, unlines = ref$.unlines, min = ref$.min, max = ref$.max;
  module.exports = {
    formatResult: formatResult,
    formatName: formatName,
    formatCount: formatCount
  };
  function formatResult(name, inputLines, inputLinesLength, arg$, options, node){
    var color, bold, resStartLine, startLine, resEndLine, endLine, startCol, endCol, highlight, onlyMatch, outputLines, res$, i$, lineNum, line, start, middle, end, rest, cleanLines, multiline, outputString, displayStartLine, displayEndLine, locationString, separatorString, nameString;
    color = arg$.color, bold = arg$.bold;
    resStartLine = node.loc.start.line - 1;
    startLine = max(resStartLine - options.beforeContext, 0);
    resEndLine = node.loc.end.line - 1;
    endLine = min(resEndLine + options.afterContext, inputLinesLength - 1);
    startCol = node.loc.start.column;
    endCol = node.loc.end.column;
    highlight = compose$(bold, color.red);
    onlyMatch = options.onlyMatching;
    res$ = [];
    for (i$ = startLine; i$ <= endLine; ++i$) {
      lineNum = i$;
      line = inputLines[lineNum];
      if (lineNum < resStartLine || lineNum > resEndLine) {
        if (onlyMatch) {
          res$.push('');
        } else {
          res$.push(line);
        }
      } else if (lineNum === resStartLine && resStartLine === resEndLine) {
        start = onlyMatch
          ? ''
          : line.slice(0, startCol);
        middle = line.slice(startCol, endCol);
        end = onlyMatch
          ? ''
          : line.slice(endCol);
        res$.push(start + "" + highlight(middle) + end);
      } else if (resStartLine < lineNum && lineNum < resEndLine) {
        res$.push(highlight(line));
      } else if (lineNum === resStartLine) {
        start = onlyMatch
          ? ''
          : line.slice(0, startCol);
        rest = line.slice(startCol);
        res$.push(start + "" + highlight(rest));
      } else {
        end = onlyMatch
          ? ''
          : line.slice(endCol);
        rest = line.slice(0, endCol);
        res$.push(highlight(rest) + "" + end);
      }
    }
    outputLines = res$;
    cleanLines = (onlyMatch ? compact : id)(outputLines);
    multiline = cleanLines.length > 1;
    outputString = unlines(cleanLines);
    displayStartLine = node.loc.start.line;
    displayEndLine = node.loc.end.line;
    locationString = options.colNumber
      ? color.green((options.lineNumber ? displayStartLine + "," : '') + "" + startCol) + "" + color.cyan('-') + "" + color.green((options.lineNumber ? displayEndLine + "," : '') + "" + (endCol - 1))
      : options.lineNumber ? multiline
        ? displayStartLine === displayEndLine
          ? color.green(displayStartLine)
          : color.green(displayStartLine) + "" + color.green('-') + "" + color.green(displayEndLine)
        : color.green(displayStartLine) : '';
    separatorString = (multiline ? color.cyan((locationString.length ? ':' : '') + "(multiline)") : '') + "" + (locationString.length || multiline ? color.cyan(':') : '') + "" + (multiline ? '\n' : '');
    nameString = options.displayFilename ? formatName(color, name) + "" + color.cyan(':') : '';
    return nameString + "" + locationString + "" + separatorString + "" + outputString;
  }
  function formatName(color, name){
    return color.magenta(name);
  }
  function formatCount(color, count, name){
    return (name ? formatName(color, name) + "" + color.cyan(':') : '') + "" + count;
  }
  function compose$() {
    var functions = arguments;
    return function() {
      var i, result;
      result = functions[0].apply(this, arguments);
      for (i = 1; i < functions.length; ++i) {
        result = functions[i](result);
      }
      return result;
    };
  }
}).call(this);

},{"prelude-ls":160}],5:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, map, flatten, join, lines, unlines, chars, unchars, syntax, syntaxFlat, aliasMap, attrMapInverse, matchesMap, matchesAliasMap, pad, options, generateSyntaxHelp, generateSyntaxHelpForNode, generateCategoryHelp, generateHelpForCategory;
  ref$ = require('prelude-ls'), map = ref$.map, flatten = ref$.flatten, join = ref$.join, lines = ref$.lines, unlines = ref$.unlines, chars = ref$.chars, unchars = ref$.unchars;
  ref$ = require('grasp-syntax-javascript'), syntax = ref$.syntax, syntaxFlat = ref$.syntaxFlat, aliasMap = ref$.aliasMap, attrMapInverse = ref$.attrMapInverse, matchesMap = ref$.matchesMap, matchesAliasMap = ref$.matchesAliasMap;
  pad = require('./text').pad;
  options = require('./options').options;
  generateSyntaxHelp = function(){
    var maxNameLen, syntaxInfo, res$, category, ref$, nodesInCat, lresult$, nodeName, ref1$, alias, nodes, ref2$, nodeArrays, primitives, getFieldStrings, fieldStrings, nameString, nameStringLen, syntaxInfoStrings, i$, len$, nodesInfo, nodeStrings, prepend, append;
    maxNameLen = 0;
    res$ = [];
    for (category in ref$ = syntax) {
      nodesInCat = ref$[category];
      lresult$ = [];
      for (nodeName in nodesInCat) {
        ref1$ = nodesInCat[nodeName], alias = ref1$.alias, nodes = (ref2$ = ref1$.nodes) != null
          ? ref2$
          : [], nodeArrays = (ref2$ = ref1$.nodeArrays) != null
          ? ref2$
          : [], primitives = (ref2$ = ref1$.primitives) != null
          ? ref2$
          : [];
        getFieldStrings = fn$;
        fieldStrings = getFieldStrings('', nodes).concat(getFieldStrings('%', nodeArrays), getFieldStrings('&', primitives));
        nameString = alias + " (" + nodeName + ")";
        nameStringLen = nameString.length;
        if (nameStringLen > maxNameLen) {
          maxNameLen = nameStringLen;
        }
        lresult$.push([nameString, fieldStrings.join(', ')]);
      }
      res$.push(lresult$);
    }
    syntaxInfo = res$;
    res$ = [];
    for (i$ = 0, len$ = syntaxInfo.length; i$ < len$; ++i$) {
      nodesInfo = syntaxInfo[i$];
      nodeStrings = map(fn1$, nodesInfo);
      res$.push("\n" + unlines(nodeStrings));
    }
    syntaxInfoStrings = res$;
    prepend = 'JavaScript abstract syntax help:\na list of possible node types, and their fields\n`--help node-name` for more information about a node\n`--help categories` for information about categories of nodes\n\nnode-name (FullOfficialName)   field1, field2 (alias), field3...\nfield  - this field contains another node\n%field - this field contains an array of other nodes\n&field - this field contains a primitive value, such as a boolean or a string\n-----------------------------';
    append = 'Based on the Mozilla Parser API <https://developer.mozilla.org/docs/SpiderMonkey/Parser_API>';
    return prepend + "" + unlines(syntaxInfoStrings) + "\n\n" + append;
    function fn$(type, fields){
      return map(function(it){
        var that;
        if (that = attrMapInverse[it]) {
          return type + "" + it + " (" + type + that.join(", " + type) + ")";
        } else {
          return type + "" + it;
        }
      }, fields);
    }
    function fn1$(it){
      return pad(it[0], maxNameLen) + "  " + it[1];
    }
  };
  generateSyntaxHelpForNode = function(nodeName){
    var ref$, alias, nodes, nodeArrays, primitives, syntax, example, note, nameStr, strs, res$, i$, len$, ref1$, type, fields, syntaxStr, exampleStr, examples, ex, line, noteStr;
    ref$ = syntaxFlat[nodeName], alias = ref$.alias, nodes = ref$.nodes, nodeArrays = ref$.nodeArrays, primitives = ref$.primitives, syntax = ref$.syntax, example = ref$.example, note = ref$.note;
    nameStr = alias + " (" + nodeName + ")";
    res$ = [];
    for (i$ = 0, len$ = (ref$ = [['node', nodes], ['node array', nodeArrays], ['primitive', primitives]]).length; i$ < len$; ++i$) {
      ref1$ = ref$[i$], type = ref1$[0], fields = ref1$[1];
      if (fields) {
        res$.push("\n" + type + " fields: " + map(fn$, fields).join(', '));
      }
    }
    strs = res$;
    syntaxStr = syntax ? "\nsyntax:\n" + unlines(map(function(it){
      return "  " + it;
    }, lines(syntax))) : '';
    exampleStr = example ? (examples = (function(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = [].concat(example)).length; i$ < len$; ++i$) {
        ex = ref$[i$];
        results$.push(unlines((fn$())));
      }
      return results$;
      function fn$(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = lines(ex)).length; i$ < len$; ++i$) {
          line = ref$[i$];
          results$.push("  " + line);
        }
        return results$;
      }
    }()), "\nexample" + (examples.length > 1 ? 's' : '') + ":\n" + unlines(examples)) : '';
    noteStr = note ? "\nnote: " + note : '';
    return nameStr + "\n" + repeatString$('=', nameStr.length) + unchars(strs) + syntaxStr + exampleStr + noteStr;
    function fn$(it){
      var that;
      if (that = attrMapInverse[it]) {
        return it + " (alias: " + that.join(', ') + ")";
      } else {
        return it;
      }
    }
  };
  generateCategoryHelp = function(){
    var categories, res$, alias, ref$, category, fullNodeNames, names, prepend, append;
    res$ = [];
    for (alias in ref$ = matchesAliasMap) {
      category = ref$[alias];
      fullNodeNames = matchesMap[category];
      names = map(fn$, fullNodeNames);
      res$.push(alias + " (" + category + "): " + names.join(', '));
    }
    categories = res$;
    prepend = 'Categories of node types:';
    append = '`--help syntax` for node information.\n`--help category-name` for further information about a category.';
    return prepend + "\n\n" + unlines(categories) + "\n\n" + append;
    function fn$(it){
      return syntaxFlat[it].alias;
    }
  };
  generateHelpForCategory = function(name){
    var invertedAliases, res$, key, ref$, value, alias, fullNodeNames, names, nameStr;
    res$ = {};
    for (key in ref$ = matchesAliasMap) {
      value = ref$[key];
      res$[value] = key;
    }
    invertedAliases = res$;
    alias = invertedAliases[name];
    fullNodeNames = matchesMap[name];
    names = map(function(it){
      return syntaxFlat[it].alias + " (" + it + ")";
    }, fullNodeNames);
    nameStr = alias + " (" + name + ")";
    return "A node type category.\n\n" + nameStr + "\n" + repeatString$('=', nameStr.length) + "\n" + unlines(names);
  };
  module.exports = function(generateHelp, generateHelpForOption, positional, interpolate){
    var helpStrings, res$, i$, len$, arg, lresult$, that, dashes, optionName, j$, ref$, len1$, o, item, sep, name;
    if (positional.length) {
      res$ = [];
      for (i$ = 0, len$ = positional.length; i$ < len$; ++i$) {
        arg = positional[i$];
        lresult$ = [];
        if (arg === 'advanced') {
          lresult$.push(generateHelp({
            showHidden: true,
            interpolate: interpolate
          }));
        } else if (that = /^(--?)(\S+)/.exec(arg)) {
          dashes = that[1], optionName = that[2];
          if (dashes.length === 2) {
            lresult$.push(generateHelpForOption(optionName));
          } else {
            for (j$ = 0, len1$ = (ref$ = chars(optionName)).length; j$ < len1$; ++j$) {
              o = ref$[j$];
              lresult$.push(generateHelpForOption(o));
            }
          }
        } else if (arg === 'more') {
          lresult$.push(generateHelpForOption('help'));
        } else if (arg === 'verbose') {
          for (j$ = 0, len1$ = (ref$ = options).length; j$ < len1$; ++j$) {
            item = ref$[j$];
            if (that = item.heading) {
              sep = repeatString$('#', that.length + 4);
              lresult$.push(sep + "\n# " + that + " #\n" + sep);
            } else {
              lresult$.push(generateHelpForOption(item.option));
            }
          }
        } else if (arg === 'syntax') {
          lresult$.push(generateSyntaxHelp());
        } else if (arg === 'categories') {
          lresult$.push(generateCategoryHelp());
        } else {
          if (aliasMap[arg] || syntaxFlat[arg]) {
            name = aliasMap[arg] || arg;
            lresult$.push(generateSyntaxHelpForNode(name));
          } else if (matchesMap[arg] || matchesAliasMap[arg]) {
            name = matchesAliasMap[arg] || arg;
            lresult$.push(generateHelpForCategory(name));
          } else {
            lresult$.push("No such help option: " + arg + ".");
          }
        }
        res$.push(lresult$);
      }
      helpStrings = res$;
      return join('\n\n')(
      flatten(
      helpStrings));
    } else {
      return generateHelp({
        interpolate: interpolate
      });
    }
  };
  function repeatString$(str, n){
    for (var r = ''; n > 0; (n >>= 1) && (str += str)) if (n & 1) r += str;
    return r;
  }
}).call(this);

},{"./options":7,"./text":9,"grasp-syntax-javascript":139,"prelude-ls":160}],6:[function(require,module,exports){
(function (process){
// Generated by LiveScript 1.4.0
(function(){
  var path, acorn, squery, equery, async, ref$, min, sortWith, lines, chars, split, join, map, Obj, format, formatResult, formatName, formatCount, replace, parseOptions, generateHelp, generateHelpForOption, help, _console, version, run, getQueryEngine, slice$ = [].slice, toString$ = {}.toString;
  path = require('path');
  acorn = require('acorn');
  squery = require('grasp-squery');
  equery = require('grasp-equery');
  async = require('async');
  ref$ = require('prelude-ls'), min = ref$.min, sortWith = ref$.sortWith, lines = ref$.lines, chars = ref$.chars, split = ref$.split, join = ref$.join, map = ref$.map, Obj = ref$.Obj;
  format = require('./format'), formatResult = format.formatResult, formatName = format.formatName, formatCount = format.formatCount;
  replace = require('./replace').replace;
  ref$ = require('./options'), parseOptions = ref$.parse, generateHelp = ref$.generateHelp, generateHelpForOption = ref$.generateHelpForOption;
  help = require('./help');
  _console = console;
  version = '0.4.0';
  run = function(arg$){
    var ref$, args, error, ref1$, callback, exit, data, stdin, fs, textFormat, input, console, options, positional, debug, e, versionString, getHelp, helpString, queryEngine, parser, parserOptions, that, selector, targets, targetsLen, replacement, isDir, color, bold, textFormatFuncs, resultsData, resultsFormat, callCallback, out, parsedSelector, resultsSortFunc, search, processResults, getToMap, end, exts, testExt, targetPaths, searchTarget, cwd;
    ref$ = arg$ != null
      ? arg$
      : {}, args = ref$.args, error = (ref1$ = ref$.error) != null
      ? ref1$
      : function(it){
        throw new Error(it);
      }, callback = (ref1$ = ref$.callback) != null
      ? ref1$
      : function(){}, exit = (ref1$ = ref$.exit) != null
      ? ref1$
      : function(){}, data = (ref1$ = ref$.data) != null ? ref1$ : false, stdin = ref$.stdin, fs = (ref1$ = ref$.fs) != null
      ? ref1$
      : require('fs'), textFormat = (ref1$ = ref$.textFormat) != null
      ? ref1$
      : require('cli-color'), input = ref$.input, console = (ref1$ = ref$.console) != null ? ref1$ : _console;
    if (args == null) {
      error('Error: Must specify arguments.');
      exit(2);
      return;
    }
    try {
      options = parseOptions(args), positional = options._, debug = options.debug;
    } catch (e$) {
      e = e$;
      error(e.message);
      exit(2);
      return;
    }
    if (debug) {
      console.time('everything');
      console.log('options:');
      console.log(options);
    }
    if (options.version) {
      versionString = "grasp v" + version;
      callback(versionString);
      exit(0, versionString);
      return;
    }
    getHelp = function(positional){
      positional == null && (positional = []);
      return help(generateHelp, generateHelpForOption, positional, {
        version: version
      });
    };
    if (options.help) {
      helpString = getHelp(positional);
      callback(helpString);
      exit(0, helpString);
      return;
    }
    queryEngine = options.engine != null
      ? require(options.engine)
      : options.squery
        ? squery
        : options.equery ? equery : squery;
    ref$ = (function(){
      switch (options.parser[0]) {
      case 'acorn':
        return [acorn, options.parser[1]];
      default:
        return [require(options.parser[0]), options.parser[1]];
      }
    }()), parser = ref$[0], parserOptions = ref$[1];
    options.context == null && (options.context = (ref$ = options.NUM) != null ? ref$ : 0);
    options.beforeContext == null && (options.beforeContext = options.context);
    options.afterContext == null && (options.afterContext = options.context);
    if ((that = options.file) != null) {
      try {
        selector = fs.readFileSync(that, 'utf8');
      } catch (e$) {
        e = e$;
        error("Error: No such file '" + options.file + "'.");
        exit(2);
        return;
      }
      targets = positional;
    } else {
      selector = positional[0];
      targets = slice$.call(positional, 1);
    }
    if (!targets.length) {
      targets = options.recursive
        ? ['.']
        : ['-'];
    }
    targetsLen = targets.length;
    if ((that = options.replace) != null) {
      replacement = that;
    }
    if (that = options.replaceFunc) {
      replacement = that;
    } else if (that = options.replaceFile) {
      try {
        replacement = fs.readFileSync(that, 'utf8').replace(/([\s\S]*)\n$/, '$1');
      } catch (e$) {
        e = e$;
        error("Error: No such file '" + options.replaceFile + "'.");
        exit(2);
        return;
      }
    }
    if (selector == null) {
      error('Error: No selector specified.');
      helpString = getHelp();
      callback(helpString);
      exit(2, helpString);
      return;
    }
    if ((that = options.filename) != null) {
      options.displayFilename = that;
    } else if (targetsLen > 1) {
      options.displayFilename = true;
    } else {
      try {
        isDir = targets[0] === '-'
          ? false
          : fs.lstatSync(targets[0]).isDirectory();
        if (isDir && !options.recursive) {
          console.warn("'" + targets[0] + "' is a directory. Use '-r, --recursive' to recursively search directories.");
        }
        options.displayFilename = isDir;
      } catch (e$) {
        e = e$;
        error("Error: No such file or directory '" + targets[0] + "'.");
        exit(2);
        return;
      }
    }
    color = Obj.map(function(it){
      if (options.color) {
        return it;
      } else {
        return function(it){
          return it + "";
        };
      }
    }, {
      green: textFormat.green,
      cyan: textFormat.cyan,
      magenta: textFormat.magenta,
      red: textFormat.red
    });
    bold = textFormat.bold;
    textFormatFuncs = {
      color: color,
      bold: bold
    };
    resultsData = [];
    resultsFormat = 'default';
    callCallback = !options.quiet && !options.json && !options.to && !options.inPlace;
    out = function(it){
      resultsData.push(it);
      if (callCallback) {
        callback(it);
      }
    };
    if (debug) {
      console.time('parse-selector');
    }
    parsedSelector = queryEngine.parse(selector);
    if (debug) {
      console.timeEnd('parse-selector');
      console.log('parsed-selector:');
      console.log(JSON.stringify(parsedSelector));
    }
    resultsSortFunc = function(a, b){
      var aStart, bStart, lineDiff;
      aStart = a.loc.start;
      bStart = b.loc.start;
      lineDiff = aStart.line - bStart.line;
      if (lineDiff === 0) {
        return aStart.column - bStart.column;
      } else {
        return lineDiff;
      }
    };
    search = function(name, input){
      var cleanInput, parsedInput, e, results, resultsLen, count, that, sortedResults, slicedResults, replaced, inputLines, inputLinesLength, i$, len$, result;
      if (debug) {
        console.time("search-total:" + name);
      }
      cleanInput = input.replace(/^#!.*\n/, '');
      try {
        if (debug) {
          console.time("parse-input:" + name);
        }
        parsedInput = parser.parse(cleanInput, parserOptions);
        if (debug) {
          console.timeEnd("parse-input:" + name);
        }
      } catch (e$) {
        e = e$;
        throw new Error("Error: Could not parse JavaScript from '" + name + "'. " + e.message);
      }
      if (debug) {
        console.time("query:" + name);
      }
      results = queryEngine.queryParsed(parsedSelector, parsedInput);
      if (debug) {
        console.timeEnd("query:" + name);
      }
      resultsLen = results.length;
      count = (that = options.maxCount) != null ? min(that, resultsLen) : resultsLen;
      sortedResults = sortWith(resultsSortFunc, results);
      slicedResults = slice$.call(sortedResults, 0, count);
      if (replacement != null) {
        try {
          replaced = replace(replacement, cleanInput, slicedResults, queryEngine);
          if (options.to || options.inPlace) {
            resultsFormat = 'pairs';
            out([name, replaced]);
          } else {
            out(replaced);
          }
        } catch (e$) {
          e = e$;
          console.error(name + ": Error during replacement. " + e.message + ".");
        }
      } else if (options.count) {
        if (options.displayFilename) {
          if (options.json || data) {
            resultsFormat = 'pairs';
            out([name, count]);
          } else {
            out(formatCount(color, count, name));
          }
        } else {
          out(options.json || data
            ? count
            : formatCount(color, count));
        }
      } else if (options.filesWithoutMatch || options.filesWithMatches) {
        if (options.filesWithMatches && count || options.filesWithoutMatch && !count) {
          out(options.json || data
            ? name
            : formatName(color, name));
        }
      } else {
        if (options.json || data) {
          if (options.displayFilename) {
            resultsFormat = 'pairs';
            out([name, slicedResults]);
          } else {
            resultsFormat = 'lists';
            out(slicedResults);
          }
        } else {
          inputLines = lines(cleanInput);
          inputLinesLength = cleanInput.length;
          for (i$ = 0, len$ = slicedResults.length; i$ < len$; ++i$) {
            result = slicedResults[i$];
            out(formatResult(name, inputLines, inputLinesLength, textFormatFuncs, options, result));
          }
        }
      }
      if (debug) {
        console.timeEnd("search-total:" + name);
      }
    };
    processResults = function(){
      if (resultsData.length) {
        if (resultsFormat === 'pairs') {
          return Obj.pairsToObj(resultsData);
        } else if (resultsFormat === 'lists') {
          if (targetsLen === 1) {
            return resultsData[0];
          } else {
            return resultsData;
          }
        } else {
          return resultsData;
        }
      } else {
        return [];
      }
    };
    getToMap = function(inputPaths){
      var mapping, i$, len$, inputPath;
      if (options.inPlace) {
        return Obj.listsToObj(inputPaths, inputPaths);
      } else if (toString$.call(options.to).slice(8, -1) === 'Object') {
        return options.to;
      } else {
        mapping = {};
        for (i$ = 0, len$ = inputPaths.length; i$ < len$; ++i$) {
          inputPath = inputPaths[i$];
          mapping[inputPath] = options.to.replace(/%/, path.basename(inputPath, path.extname(inputPath)));
        }
        return mapping;
      }
    };
    end = function(inputPaths){
      var exitCode, processedResults, toMap, inputPath, contents, targetPath, jsonString;
      exitCode = resultsData.length ? 0 : 1;
      processedResults = processResults();
      if (replacement && options.to || options.inPlace) {
        toMap = getToMap(inputPaths);
        for (inputPath in processedResults) {
          contents = processedResults[inputPath];
          targetPath = toMap[inputPath];
          if (targetPath === '-') {
            callback(contents);
          } else {
            if (targetPath) {
              fs.writeFileSync(targetPath, contents);
            }
          }
        }
      } else if (options.json) {
        jsonString = JSON.stringify(processedResults);
        callback(jsonString);
      }
      if (debug) {
        console.timeEnd('everything');
      }
      return exit(exitCode, options.json ? jsonString : processedResults);
    };
    exts = options.extensions;
    testExt = exts.length === 0 || exts.length === 1 && exts[0] === '.'
      ? function(){
        return true;
      }
      : function(it){
        return it.match(RegExp('\\.(?:' + exts.join('|') + ')$'));
      };
    targetPaths = [];
    searchTarget = function(basePath, upPath){
      return function(target, done){
        var output, targetPath, stat, fileContents, displayPath, e;
        try {
          if (target === '-') {
            if (!stdin) {
              throw new Error('Error: stdin not defined.');
            }
            targetPaths.push('-');
            output = '';
            stdin.setEncoding('utf-8');
            stdin.on('data', (function(it){
              return output += it;
            }));
            stdin.on('end', function(){
              var e;
              try {
                search('(standard input)', output);
              } catch (e$) {
                e = e$;
                console.error(e.message);
              }
              return done();
            });
            stdin.resume();
          } else {
            targetPath = path.resolve(upPath, target);
            stat = fs.lstatSync(targetPath);
            if (stat.isDirectory() && options.recursive) {
              async.eachSeries(fs.readdirSync(targetPath), searchTarget(basePath, targetPath), function(){
                return async.setImmediate(function(){
                  return done();
                });
              });
            } else if (stat.isFile() && testExt(target)) {
              fileContents = fs.readFileSync(targetPath, 'utf8');
              displayPath = path.relative(basePath, targetPath);
              targetPaths.push(displayPath);
              search(displayPath, fileContents);
              done();
            } else {
              done();
            }
          }
        } catch (e$) {
          e = e$;
          console.error(e.message);
          done();
        }
      };
    };
    if (input) {
      search('(input)', input);
      return end(['-']);
    } else {
      cwd = process.cwd();
      async.eachSeries(targets, searchTarget(cwd, cwd), function(){
        return end(targetPaths);
      });
    }
  };
  getQueryEngine = function(it){
    return {
      squery: 'grasp-squery',
      equery: 'grasp-equery'
    }[it] || it;
  };
  run.VERSION = version;
  run.search = curry$(function(engine, selector, input){
    return run({
      args: {
        _: [selector],
        engine: getQueryEngine(engine)
      },
      input: input,
      data: true,
      exit: function(arg$, results){
        return results;
      }
    });
  });
  run.replace = curry$(function(engine, selector, replacement, input){
    var args;
    args = {
      _: [selector],
      engine: getQueryEngine(engine)
    };
    if (toString$.call(replacement).slice(8, -1) === 'Function') {
      args.replaceFunc = replacement;
    } else {
      args.replace = replacement;
    }
    return run({
      args: args,
      input: input,
      exit: function(arg$, results){
        return results[0];
      }
    });
  });
  module.exports = run;
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);

}).call(this,require('_process'))
},{"./format":4,"./help":5,"./options":7,"./replace":8,"_process":3,"acorn":10,"async":11,"cli-color":18,"fs":1,"grasp-equery":132,"grasp-squery":136,"path":2,"prelude-ls":160}],7:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var optionator, options, ref$;
  optionator = require('optionator');
  options = [
    {
      heading: 'Miscellaneous'
    }, {
      option: 'help',
      alias: 'h',
      type: 'Boolean',
      description: "display this help and exit '--help more' for more help info",
      longDescription: '`--help` displays help for options\n`-h` may be used at any time in place of `--help`\n`--help more` displays this help\n`--help --option-name` displays further help for that option\nfor example: `--help --help` would display this information\n`--help verbose` displays the same help as `--help --option-name`, but for all options\n`--help syntax` displays information about JavaScript\'s syntax\n`--help node-name` displays further information about a JavaScript node\nfor example: `--help if` displays more information about an if statement\n`--help categories` displays information about node type categories\n`--help category-name` displays further information about a node type category\n`--help advanced` displays help for all options, including those hidden by default',
      example: ['--help', '--help --replace', '--help -R', '--help syntax'],
      restPositional: true
    }, {
      option: 'version',
      alias: 'v',
      type: 'Boolean',
      description: 'print version information and exit'
    }, {
      option: 'debug',
      alias: 'd',
      type: 'Boolean',
      description: 'output debug information'
    }, {
      option: 'extensions',
      alias: 'x',
      type: '[String]',
      description: 'comma separated list of acceptable file extensions',
      longDescription: "A comma separated list of acceptable file extensions. Use a dot `.` for any extension.",
      example: ['--extensions js,json', '--extensions .'],
      'default': 'js'
    }, {
      option: 'recursive',
      alias: 'r',
      type: 'Boolean',
      description: 'recursively search directories',
      longDescription: "Recursively search directories. If files or paths are left out, then `.` is assumed."
    }, {
      option: 'parser',
      alias: 'p',
      type: '(path::String, options::Maybe Object)',
      description: 'require path for parser, using options when calling parse',
      longDescription: 'Sets the parser and options for the parser. Argument value is a tuple, with the first item being the require path, and the second an optional object with options for the parser when calling its parse function.',
      'default': "(acorn, {locations: true, ecmaVersion: 6, sourceType: 'module', allowHashBang: true})",
      hidden: true,
      example: '--parser "(./path/to/esprima, {loc: true})"'
    }, {
      heading: 'Replacement'
    }, {
      option: 'replace',
      alias: 'R',
      type: 'replacement::String',
      description: "replace each match with replacement, use `--help --replace` for more info",
      longDescription: 'Each node that is matched will be replaced with the text that you input. There are a couple of special cases:\nThe text `{{}}` will be replaced with the source of the matched node.\n`{{selector}}` will be replaced with the first result of querying the matched node with the selector. If you used equery to get the results, then the replacement selector will be parsed as equery.\nSince positional arguments may appear anywhere, you can place the `--replace replacement` after the selector if you wish, eg. `selector --replace replacement file.js`.\nBy default, the result of using `--replace` will be to print out the results - if you wish to create new file(s) you can check out the `--to` option, or if you wish to edit the input file(s) in place, take a look at the `--in-place` option.',
      example: ['--replace foo', "--replace 'f({{}})'", "--replace 'while ({{.test}}) {\\n{{.then call}};\\n}'"]
    }, {
      option: 'replace-file',
      alias: 'F',
      type: 'file::String',
      description: 'replace each match with contents of file',
      example: '--replace-file path/to/file'
    }, {
      option: 'replace-func',
      type: 'Function',
      description: 'use function instead of string pattern when using as library',
      hidden: true
    }, {
      option: 'to',
      alias: 't',
      type: 'Object | String',
      description: "write replaced output to file(s), `--help --to` for more info",
      longDescription: 'If an object, the keys are the paths to the input files, and the values are the corresponding output paths.\nIf a string, then the output is written to the path specified. The special character `%` is expanded to the current input file\'s filename.',
      example: ['--to "{input.js: output.js, path/to/input2.js: path/to/output2.js}"', '--to "output/%.js"']
    }, {
      option: 'in-place',
      alias: 'i',
      type: 'Boolean',
      description: "overwrite input files with replaced output"
    }, {
      heading: 'Selector interpretation'
    }, {
      option: 'engine',
      alias: 'g',
      type: 'path::String',
      description: 'require path for query engine',
      longDescription: "The require path for the query engine. The query engine must have `parse(selector) -> parsedSelector`, `queryParsed(parsedSelector, ast) -> results`, and `query(selector, ast) -> results` functions exposed.",
      hidden: true,
      example: '--engine path/to/engine'
    }, {
      option: 'squery',
      alias: 's',
      type: 'Boolean',
      description: "use squery - selector query - css style selectors"
    }, {
      option: 'equery',
      alias: 'e',
      type: 'Boolean',
      description: "use equery - example query - use code example with wildcards",
      longDescription: "Use equery - example query - instead of the default squery. Use by typing in an example of the code you want (formatting is irrelevant), with optional wildcards. It is less powerful, but may be easier to use for simpler tasks, than squery. For more information, use `--help equery`."
    }, {
      option: 'file',
      alias: 'f',
      type: 'file::String',
      description: 'obtain selector from file',
      example: '--file path/to/selector-file'
    }, {
      heading: 'Output control'
    }, {
      option: 'max-count',
      alias: 'm',
      type: 'n::Int',
      description: 'stop after n matches',
      example: '--max-count 2'
    }, {
      option: 'line-number',
      alias: 'n',
      type: 'Boolean',
      'default': 'true',
      description: 'print line number with output lines'
    }, {
      option: 'col-number',
      alias: 'b',
      type: 'Boolean',
      description: 'print column number with output lines'
    }, {
      option: 'filename',
      alias: 'H',
      type: 'Boolean',
      description: 'print the file name for each match (opposite: `--no-filename`)'
    }, {
      option: 'only-matching',
      alias: 'o',
      type: 'Boolean',
      description: 'show only the matching part of the line(s)'
    }, {
      option: 'quiet',
      alias: ['q', 'silent'],
      type: 'Boolean',
      description: 'suppress all normal output'
    }, {
      option: 'files-without-match',
      alias: 'W',
      type: 'Boolean',
      description: 'print only names of files containing no match'
    }, {
      option: 'files-with-matches',
      alias: 'w',
      type: 'Boolean',
      description: 'print only names of files containing matches'
    }, {
      option: 'count',
      alias: 'c',
      type: 'Boolean',
      description: 'print only a count of matches per file'
    }, {
      option: 'color',
      alias: ['O', 'colour'],
      type: 'Boolean',
      'default': 'true',
      description: 'use color to highlight matches'
    }, {
      option: 'json',
      alias: 'j',
      type: 'Boolean',
      description: 'JSON output for matches',
      longDescription: 'Prints out JSON for the output instead of formatted results. This will print out the node data as JSON, instead of the formatted text.'
    }, {
      heading: 'Context control'
    }, {
      option: 'before-context',
      alias: 'B',
      type: 'n::Int',
      description: 'print n lines of leading context',
      example: ['--before-context 3', '-B 3']
    }, {
      option: 'after-context',
      alias: 'A',
      type: 'n::Int',
      description: 'print n lines of trailing context',
      example: ['--after-context 2', '-A 2']
    }, {
      option: 'context',
      alias: 'C',
      type: 'n::Int',
      description: 'print n lines of output context',
      example: ['--context 1', '-C 1']
    }, {
      option: 'NUM',
      type: 'Int',
      description: 'same as --context NUM',
      example: '-3'
    }
  ];
  module.exports = (ref$ = optionator({
    prepend: 'Usage: grasp [option]... [selector] [file]...\n\nSearch (or --replace) for selector in file(s) or standard input.\nFor more help \'--help more\', \'--help --option-name\', \'--help syntax\'\nExample: grasp --context 2 \'if.test bi[op="<"]\' file.js file2.js',
    append: "Version {{version}}\n<http://graspjs.com/>",
    mutuallyExclusive: [['replace', 'replace-file', 'replace-func']],
    options: options
  }), ref$.options = options, ref$);
}).call(this);

},{"optionator":147}],8:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, lines, unlines, filter, fold, capitalize, camelize, dasherize, levn, getRaw, filterRegex, replacer, getReplacementFunc, replace, slice$ = [].slice, toString$ = {}.toString;
  ref$ = require('prelude-ls'), lines = ref$.lines, unlines = ref$.unlines, filter = ref$.filter, fold = ref$.fold, capitalize = ref$.capitalize, camelize = ref$.camelize, dasherize = ref$.dasherize;
  levn = require('levn');
  getRaw = function(input, node){
    var raw, that;
    raw = (that = node.raw)
      ? that
      : node.start != null
        ? input.slice(node.start, node.end)
        : node.key != null && node.value != null ? input.slice(node.key.start, node.value.end) : '';
    node.raw = raw;
    return (node.rawPrepend || '') + "" + raw + (node.rawAppend || '');
  };
  filterRegex = /\s+\|\s+([-a-zA-Z]+)((?:\s+(?:'(?:\\'|[^'])*'|"(?:\\"|[^"])*"|[^\|\s]+))*)/;
  replacer = function(input, node, queryEngine){
    return function(arg$, replacementArg){
      var origResults, ref$, filters, selector, that, e, results, rawPrepend, rawAppend, join, textOperations, filterName, argsStr, args, ref1$, pre, post, i$, len$, arg, result, n, len, rawResults, res$, outputString;
      if (/^\s*\|\s+/.test(replacementArg)) {
        origResults = [node];
        ref$ = (" " + replacementArg.trim()).split(filterRegex), filters = slice$.call(ref$, 1);
      } else {
        ref$ = replacementArg.trim().split(filterRegex), selector = ref$[0], filters = slice$.call(ref$, 1);
        if (that = (ref$ = node._named) != null ? ref$[selector] : void 8) {
          origResults = [].concat(that);
        } else {
          try {
            origResults = queryEngine.query(selector, node);
          } catch (e$) {
            e = e$;
            origResults = queryEngine.query(replacementArg, node);
            filters = [];
          }
        }
      }
      if (origResults.length) {
        results = origResults;
        rawPrepend = '';
        rawAppend = '';
        join = null;
        textOperations = [];
        while (filters.length) {
          filterName = filters.shift();
          argsStr = filters.shift().trim();
          argsStr += filters.shift();
          args = levn.parse('Array', argsStr);
          if (!args.length && (filterName === 'prepend' || filterName === 'before' || filterName === 'after' || filterName === 'prepend' || filterName === 'append' || filterName === 'wrap' || filterName === 'nth' || filterName === 'nth-last' || filterName === 'slice' || filterName === 'each' || filterName === 'replace' || filterName === 'substring' || filterName === 'substr' || filterName === 'str-slice')) {
            throw new Error("No arguments supplied for '" + filterName + "' filter");
          } else if (in$(filterName, ['replace']) && args.length < 2) {
            throw new Error("Must supply at least two arguments for '" + filterName + "' filter");
          }
          switch (filterName) {
          case 'join':
            join = args.length ? args[0] + "" : '';
            break;
          case 'before':
            rawPrepend = args[0] + "" + rawPrepend;
            break;
          case 'after':
            rawAppend += args[0] + "";
            break;
          case 'wrap':
            ref1$ = args.length === 1 ? [args[0], args[0]] : args, pre = ref1$[0], post = ref1$[1];
            rawPrepend = pre + "" + rawPrepend;
            rawAppend += post + "";
            break;
          case 'prepend':
            for (i$ = 0, len$ = args.length; i$ < len$; ++i$) {
              arg = args[i$];
              results.unshift({
                type: 'Raw',
                raw: arg + ""
              });
            }
            break;
          case 'append':
            for (i$ = 0, len$ = args.length; i$ < len$; ++i$) {
              arg = args[i$];
              results.push({
                type: 'Raw',
                raw: arg + ""
              });
            }
            break;
          case 'each':
            if (args.length < 2) {
              throw new Error("No arguments supplied for 'each " + args[0] + "'");
            }
            switch (args[0]) {
            case 'before':
              for (i$ = 0, len$ = results.length; i$ < len$; ++i$) {
                result = results[i$];
                result.rawPrepend = args[1] + "" + ((ref1$ = result.rawPrepend) != null ? ref1$ : '');
              }
              break;
            case 'after':
              for (i$ = 0, len$ = results.length; i$ < len$; ++i$) {
                result = results[i$];
                result.rawAppend = ((ref1$ = result.rawAppend) != null ? ref1$ : '') + "" + args[1];
              }
              break;
            case 'wrap':
              ref1$ = args.length === 2
                ? [args[1], args[1]]
                : [args[1], args[2]], pre = ref1$[0], post = ref1$[1];
              for (i$ = 0, len$ = results.length; i$ < len$; ++i$) {
                result = results[i$];
                result.rawPrepend = pre + "" + ((ref1$ = result.rawPrepend) != null ? ref1$ : '');
                result.rawAppend = ((ref1$ = result.rawAppend) != null ? ref1$ : '') + "" + post;
              }
              break;
            default:
              throw new Error("'" + args[0] + "' is not supported by 'each'");
            }
            break;
          case 'nth':
            n = +args[0];
            results = results.slice(n, n + 1);
            break;
          case 'nth-last':
            n = results.length - +args[0] - 1;
            results = results.slice(n, n + 1);
            break;
          case 'first':
          case 'head':
            results = results.slice(0, 1);
            break;
          case 'tail':
            results = results.slice(1);
            break;
          case 'last':
            len = results.length;
            results = results.slice(len - 1, len);
            break;
          case 'initial':
            results = results.slice(0, results.length - 1);
            break;
          case 'slice':
            results = [].slice.apply(results, args);
            break;
          case 'reverse':
            results.reverse();
            break;
          case 'replace':
            (fn$.call(this, args));
            break;
          case 'lowercase':
            textOperations.push(fn1$);
            break;
          case 'uppercase':
            textOperations.push(fn2$);
            break;
          case 'capitalize':
            textOperations.push(capitalize);
            break;
          case 'uncapitalize':
            textOperations.push(fn3$);
            break;
          case 'camelize':
            textOperations.push(camelize);
            break;
          case 'dasherize':
            textOperations.push(dasherize);
            break;
          case 'trim':
            textOperations.push(fn4$);
            break;
          case 'substring':
            (fn5$.call(this, args));
            break;
          case 'substr':
            (fn6$.call(this, args));
            break;
          case 'str-slice':
            (fn7$.call(this, args));
            break;
          default:
            throw new Error("Invalid filter: " + filterName + (argsStr ? " " + argsStr : ''));
          }
        }
        res$ = [];
        for (i$ = 0, len$ = results.length; i$ < len$; ++i$) {
          result = results[i$];
          res$.push(getRaw(input, result));
        }
        rawResults = res$;
        outputString = rawPrepend + "" + (join != null
          ? rawResults.join(join)
          : rawResults[0]) + rawAppend;
        if (textOperations.length) {
          return fold(curry$(function(x$, y$){
            return y$(x$);
          }), outputString, textOperations);
        } else {
          return outputString;
        }
      } else {
        return '';
      }
      function fn$(args){
        textOperations.push(function(it){
          return it.replace(args[0], args[1]);
        });
      }
      function fn1$(it){
        return it.toLowerCase();
      }
      function fn2$(it){
        return it.toUpperCase();
      }
      function fn3$(it){
        return it.charAt(0).toLowerCase() + it.slice(1);
      }
      function fn4$(it){
        return it.trim();
      }
      function fn5$(args){
        textOperations.push(function(it){
          return it.substring(args[0], args[1]);
        });
      }
      function fn6$(args){
        textOperations.push(function(it){
          return it.substr(args[0], args[1]);
        });
      }
      function fn7$(args){
        textOperations.push(function(it){
          return it.slice(args[0], args[1]);
        });
      }
    };
  };
  getReplacementFunc = function(replacement, input, queryEngine){
    var replacementPrime;
    if (toString$.call(replacement).slice(8, -1) === 'Function') {
      return function(node){
        return replacement(function(it){
          return getRaw(input, it);
        }, node, function(it){
          return queryEngine.query(it, node);
        }, node._named);
      };
    } else {
      replacementPrime = replacement.replace(/\\n/g, '\n');
      return function(node){
        return replacementPrime.replace(/{{}}/g, function(){
          return getRaw(input, node);
        }).replace(/{{((?:[^}]|}[^}])+)}}/g, replacer(input, node, queryEngine));
      };
    }
  };
  replace = function(replacement, input, nodes, queryEngine){
    var inputLines, colOffset, lineOffset, lastLine, prevNode, replaceNode, i$, len$, node, ref$, start, end, startLineNum, endLineNum, numberOfLines, startCol, endCol, replaceLines, startLine, endLine, startContext, endContext, replaceLast, endLen;
    inputLines = lines(input);
    colOffset = 0;
    lineOffset = 0;
    lastLine = null;
    prevNode = {
      end: 0
    };
    replaceNode = getReplacementFunc(replacement, input, queryEngine);
    for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
      node = nodes[i$];
      if (node.start < prevNode.end) {
        continue;
      }
      ref$ = node.loc, start = ref$.start, end = ref$.end;
      startLineNum = start.line - 1 + lineOffset;
      endLineNum = end.line - 1 + lineOffset;
      numberOfLines = endLineNum - startLineNum + 1;
      colOffset = lastLine === startLineNum ? colOffset : 0;
      startCol = start.column + colOffset;
      endCol = end.column + (startLineNum === endLineNum ? colOffset : 0);
      replaceLines = lines(replaceNode(node));
      startLine = inputLines[startLineNum];
      endLine = inputLines[endLineNum];
      startContext = startLine.slice(0, startCol);
      endContext = endLine.slice(endCol);
      replaceLines[0] = startContext + "" + ((ref$ = replaceLines[0]) != null ? ref$ : '');
      replaceLast = replaceLines[replaceLines.length - 1];
      endLen = replaceLast.length;
      replaceLines[replaceLines.length - 1] = replaceLast + "" + endContext;
      inputLines.splice.apply(inputLines, [startLineNum, numberOfLines].concat(slice$.call(replaceLines)));
      lineOffset += replaceLines.length - numberOfLines;
      colOffset += endLen - endCol;
      lastLine = endLineNum + lineOffset;
      prevNode = node;
    }
    return unlines(inputLines);
  };
  module.exports = {
    replace: replace
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
  function curry$(f, bound){
    var context,
    _curry = function(args) {
      return f.length > 1 ? function(){
        var params = args ? args.concat() : [];
        context = bound ? context || this : this;
        return params.push.apply(params, arguments) <
            f.length && arguments.length ?
          _curry.call(context, params) : f.apply(context, params);
      } : f;
    };
    return _curry();
  }
}).call(this);

},{"levn":141,"prelude-ls":160}],9:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var pad;
  pad = function(str, num){
    var len, padAmount;
    len = str.length;
    padAmount = num - len;
    return str + "" + repeatString$(' ', padAmount > 0 ? padAmount : 0);
  };
  module.exports = {
    pad: pad
  };
  function repeatString$(str, n){
    for (var r = ''; n > 0; (n >>= 1) && (str += str)) if (n & 1) r += str;
    return r;
  }
}).call(this);

},{}],10:[function(require,module,exports){
(function (global){
(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.acorn = f()}})(function(){var define,module,exports;return (function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(_dereq_,module,exports){
// A recursive descent parser operates by defining functions for all
// syntactic elements, and recursively calling those, each function
// advancing the input stream and returning an AST node. Precedence
// of constructs (for example, the fact that `!x[1]` means `!(x[1])`
// instead of `(!x)[1]` is handled by the fact that the parser
// function that parses unary prefix operators is called first, and
// in turn calls the function that parses `[]` subscripts — that
// way, it'll receive the node for `x[1]` already parsed, and wraps
// *that* in the unary operator node.
//
// Acorn uses an [operator precedence parser][opp] to handle binary
// operator precedence, because it is much more compact than using
// the technique outlined above, which uses different, nesting
// functions to specify precedence, for all of the ten binary
// precedence levels that JavaScript defines.
//
// [opp]: http://en.wikipedia.org/wiki/Operator-precedence_parser

"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var pp = _state.Parser.prototype;

// Check if property name clashes with already added.
// Object/class getters and setters are not allowed to clash —
// either with each other or with an init property — and in
// strict mode, init properties are also not allowed to be repeated.

pp.checkPropClash = function (prop, propHash) {
  if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand)) return;
  var key = prop.key;var name = undefined;
  switch (key.type) {
    case "Identifier":
      name = key.name;break;
    case "Literal":
      name = String(key.value);break;
    default:
      return;
  }
  var kind = prop.kind;

  if (this.options.ecmaVersion >= 6) {
    if (name === "__proto__" && kind === "init") {
      if (propHash.proto) this.raise(key.start, "Redefinition of __proto__ property");
      propHash.proto = true;
    }
    return;
  }
  name = "$" + name;
  var other = propHash[name];
  if (other) {
    var isGetSet = kind !== "init";
    if ((this.strict || isGetSet) && other[kind] || !(isGetSet ^ other.init)) this.raise(key.start, "Redefinition of property");
  } else {
    other = propHash[name] = {
      init: false,
      get: false,
      set: false
    };
  }
  other[kind] = true;
};

// ### Expression parsing

// These nest, from the most general expression type at the top to
// 'atomic', nondivisible expression types at the bottom. Most of
// the functions will simply let the function(s) below them parse,
// and, *if* the syntactic construct they handle is present, wrap
// the AST node that the inner parser gave them in another node.

// Parse a full expression. The optional arguments are used to
// forbid the `in` operator (in for loops initalization expressions)
// and provide reference for storing '=' operator inside shorthand
// property assignment in contexts where both object expression
// and object pattern might appear (so it's possible to raise
// delayed syntax error at correct position).

pp.parseExpression = function (noIn, refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
  if (this.type === _tokentype.types.comma) {
    var node = this.startNodeAt(startPos, startLoc);
    node.expressions = [expr];
    while (this.eat(_tokentype.types.comma)) node.expressions.push(this.parseMaybeAssign(noIn, refDestructuringErrors));
    return this.finishNode(node, "SequenceExpression");
  }
  return expr;
};

// Parse an assignment expression. This includes applications of
// operators like `+=`.

pp.parseMaybeAssign = function (noIn, refDestructuringErrors, afterLeftParse) {
  if (this.type == _tokentype.types._yield && this.inGenerator) return this.parseYield();

  var validateDestructuring = false;
  if (!refDestructuringErrors) {
    refDestructuringErrors = { shorthandAssign: 0, trailingComma: 0 };
    validateDestructuring = true;
  }
  var startPos = this.start,
      startLoc = this.startLoc;
  if (this.type == _tokentype.types.parenL || this.type == _tokentype.types.name) this.potentialArrowAt = this.start;
  var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
  if (afterLeftParse) left = afterLeftParse.call(this, left, startPos, startLoc);
  if (this.type.isAssign) {
    if (validateDestructuring) this.checkPatternErrors(refDestructuringErrors, true);
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.left = this.type === _tokentype.types.eq ? this.toAssignable(left) : left;
    refDestructuringErrors.shorthandAssign = 0; // reset because shorthand default was used correctly
    this.checkLVal(left);
    this.next();
    node.right = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "AssignmentExpression");
  } else {
    if (validateDestructuring) this.checkExpressionErrors(refDestructuringErrors, true);
  }
  return left;
};

// Parse a ternary conditional (`?:`) operator.

pp.parseMaybeConditional = function (noIn, refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseExprOps(noIn, refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
  if (this.eat(_tokentype.types.question)) {
    var node = this.startNodeAt(startPos, startLoc);
    node.test = expr;
    node.consequent = this.parseMaybeAssign();
    this.expect(_tokentype.types.colon);
    node.alternate = this.parseMaybeAssign(noIn);
    return this.finishNode(node, "ConditionalExpression");
  }
  return expr;
};

// Start the precedence parser.

pp.parseExprOps = function (noIn, refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseMaybeUnary(refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
  return this.parseExprOp(expr, startPos, startLoc, -1, noIn);
};

// Parse binary operators with the operator precedence parsing
// algorithm. `left` is the left-hand side of the operator.
// `minPrec` provides context that allows the function to stop and
// defer further parser to one of its callers when it encounters an
// operator that has a lower precedence than the set it is parsing.

pp.parseExprOp = function (left, leftStartPos, leftStartLoc, minPrec, noIn) {
  var prec = this.type.binop;
  if (prec != null && (!noIn || this.type !== _tokentype.types._in)) {
    if (prec > minPrec) {
      var node = this.startNodeAt(leftStartPos, leftStartLoc);
      node.left = left;
      node.operator = this.value;
      var op = this.type;
      this.next();
      var startPos = this.start,
          startLoc = this.startLoc;
      node.right = this.parseExprOp(this.parseMaybeUnary(), startPos, startLoc, prec, noIn);
      this.finishNode(node, op === _tokentype.types.logicalOR || op === _tokentype.types.logicalAND ? "LogicalExpression" : "BinaryExpression");
      return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn);
    }
  }
  return left;
};

// Parse unary operators, both prefix and postfix.

pp.parseMaybeUnary = function (refDestructuringErrors) {
  if (this.type.prefix) {
    var node = this.startNode(),
        update = this.type === _tokentype.types.incDec;
    node.operator = this.value;
    node.prefix = true;
    this.next();
    node.argument = this.parseMaybeUnary();
    this.checkExpressionErrors(refDestructuringErrors, true);
    if (update) this.checkLVal(node.argument);else if (this.strict && node.operator === "delete" && node.argument.type === "Identifier") this.raise(node.start, "Deleting local variable in strict mode");
    return this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
  }
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseExprSubscripts(refDestructuringErrors);
  if (this.checkExpressionErrors(refDestructuringErrors)) return expr;
  while (this.type.postfix && !this.canInsertSemicolon()) {
    var node = this.startNodeAt(startPos, startLoc);
    node.operator = this.value;
    node.prefix = false;
    node.argument = expr;
    this.checkLVal(expr);
    this.next();
    expr = this.finishNode(node, "UpdateExpression");
  }
  return expr;
};

// Parse call, dot, and `[]`-subscript expressions.

pp.parseExprSubscripts = function (refDestructuringErrors) {
  var startPos = this.start,
      startLoc = this.startLoc;
  var expr = this.parseExprAtom(refDestructuringErrors);
  var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
  if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) return expr;
  return this.parseSubscripts(expr, startPos, startLoc);
};

pp.parseSubscripts = function (base, startPos, startLoc, noCalls) {
  for (;;) {
    if (this.eat(_tokentype.types.dot)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = this.parseIdent(true);
      node.computed = false;
      base = this.finishNode(node, "MemberExpression");
    } else if (this.eat(_tokentype.types.bracketL)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = this.parseExpression();
      node.computed = true;
      this.expect(_tokentype.types.bracketR);
      base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.eat(_tokentype.types.parenL)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.callee = base;
      node.arguments = this.parseExprList(_tokentype.types.parenR, false);
      base = this.finishNode(node, "CallExpression");
    } else if (this.type === _tokentype.types.backQuote) {
      var node = this.startNodeAt(startPos, startLoc);
      node.tag = base;
      node.quasi = this.parseTemplate();
      base = this.finishNode(node, "TaggedTemplateExpression");
    } else {
      return base;
    }
  }
};

// Parse an atomic expression — either a single token that is an
// expression, an expression started by a keyword like `function` or
// `new`, or an expression wrapped in punctuation like `()`, `[]`,
// or `{}`.

pp.parseExprAtom = function (refDestructuringErrors) {
  var node = undefined,
      canBeArrow = this.potentialArrowAt == this.start;
  switch (this.type) {
    case _tokentype.types._super:
      if (!this.inFunction) this.raise(this.start, "'super' outside of function or class");
    case _tokentype.types._this:
      var type = this.type === _tokentype.types._this ? "ThisExpression" : "Super";
      node = this.startNode();
      this.next();
      return this.finishNode(node, type);

    case _tokentype.types._yield:
      if (this.inGenerator) this.unexpected();

    case _tokentype.types.name:
      var startPos = this.start,
          startLoc = this.startLoc;
      var id = this.parseIdent(this.type !== _tokentype.types.name);
      if (canBeArrow && !this.canInsertSemicolon() && this.eat(_tokentype.types.arrow)) return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id]);
      return id;

    case _tokentype.types.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = { pattern: value.pattern, flags: value.flags };
      return node;

    case _tokentype.types.num:case _tokentype.types.string:
      return this.parseLiteral(this.value);

    case _tokentype.types._null:case _tokentype.types._true:case _tokentype.types._false:
      node = this.startNode();
      node.value = this.type === _tokentype.types._null ? null : this.type === _tokentype.types._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal");

    case _tokentype.types.parenL:
      return this.parseParenAndDistinguishExpression(canBeArrow);

    case _tokentype.types.bracketL:
      node = this.startNode();
      this.next();
      // check whether this is array comprehension or regular array
      if (this.options.ecmaVersion >= 7 && this.type === _tokentype.types._for) {
        return this.parseComprehension(node, false);
      }
      node.elements = this.parseExprList(_tokentype.types.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression");

    case _tokentype.types.braceL:
      return this.parseObj(false, refDestructuringErrors);

    case _tokentype.types._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, false);

    case _tokentype.types._class:
      return this.parseClass(this.startNode(), false);

    case _tokentype.types._new:
      return this.parseNew();

    case _tokentype.types.backQuote:
      return this.parseTemplate();

    default:
      this.unexpected();
  }
};

pp.parseLiteral = function (value) {
  var node = this.startNode();
  node.value = value;
  node.raw = this.input.slice(this.start, this.end);
  this.next();
  return this.finishNode(node, "Literal");
};

pp.parseParenExpression = function () {
  this.expect(_tokentype.types.parenL);
  var val = this.parseExpression();
  this.expect(_tokentype.types.parenR);
  return val;
};

pp.parseParenAndDistinguishExpression = function (canBeArrow) {
  var startPos = this.start,
      startLoc = this.startLoc,
      val = undefined;
  if (this.options.ecmaVersion >= 6) {
    this.next();

    if (this.options.ecmaVersion >= 7 && this.type === _tokentype.types._for) {
      return this.parseComprehension(this.startNodeAt(startPos, startLoc), true);
    }

    var innerStartPos = this.start,
        innerStartLoc = this.startLoc;
    var exprList = [],
        first = true;
    var refDestructuringErrors = { shorthandAssign: 0, trailingComma: 0 },
        spreadStart = undefined,
        innerParenStart = undefined;
    while (this.type !== _tokentype.types.parenR) {
      first ? first = false : this.expect(_tokentype.types.comma);
      if (this.type === _tokentype.types.ellipsis) {
        spreadStart = this.start;
        exprList.push(this.parseParenItem(this.parseRest()));
        break;
      } else {
        if (this.type === _tokentype.types.parenL && !innerParenStart) {
          innerParenStart = this.start;
        }
        exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
      }
    }
    var innerEndPos = this.start,
        innerEndLoc = this.startLoc;
    this.expect(_tokentype.types.parenR);

    if (canBeArrow && !this.canInsertSemicolon() && this.eat(_tokentype.types.arrow)) {
      this.checkPatternErrors(refDestructuringErrors, true);
      if (innerParenStart) this.unexpected(innerParenStart);
      return this.parseParenArrowList(startPos, startLoc, exprList);
    }

    if (!exprList.length) this.unexpected(this.lastTokStart);
    if (spreadStart) this.unexpected(spreadStart);
    this.checkExpressionErrors(refDestructuringErrors, true);

    if (exprList.length > 1) {
      val = this.startNodeAt(innerStartPos, innerStartLoc);
      val.expressions = exprList;
      this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
    } else {
      val = exprList[0];
    }
  } else {
    val = this.parseParenExpression();
  }

  if (this.options.preserveParens) {
    var par = this.startNodeAt(startPos, startLoc);
    par.expression = val;
    return this.finishNode(par, "ParenthesizedExpression");
  } else {
    return val;
  }
};

pp.parseParenItem = function (item) {
  return item;
};

pp.parseParenArrowList = function (startPos, startLoc, exprList) {
  return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList);
};

// New's precedence is slightly tricky. It must allow its argument to
// be a `[]` or dot subscript expression, but not a call — at least,
// not without wrapping it in parentheses. Thus, it uses the noCalls
// argument to parseSubscripts to prevent it from consuming the
// argument list.

var empty = [];

pp.parseNew = function () {
  var node = this.startNode();
  var meta = this.parseIdent(true);
  if (this.options.ecmaVersion >= 6 && this.eat(_tokentype.types.dot)) {
    node.meta = meta;
    node.property = this.parseIdent(true);
    if (node.property.name !== "target") this.raise(node.property.start, "The only valid meta property for new is new.target");
    if (!this.inFunction) this.raise(node.start, "new.target can only be used in functions");
    return this.finishNode(node, "MetaProperty");
  }
  var startPos = this.start,
      startLoc = this.startLoc;
  node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
  if (this.eat(_tokentype.types.parenL)) node.arguments = this.parseExprList(_tokentype.types.parenR, false);else node.arguments = empty;
  return this.finishNode(node, "NewExpression");
};

// Parse template expression.

pp.parseTemplateElement = function () {
  var elem = this.startNode();
  elem.value = {
    raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, '\n'),
    cooked: this.value
  };
  this.next();
  elem.tail = this.type === _tokentype.types.backQuote;
  return this.finishNode(elem, "TemplateElement");
};

pp.parseTemplate = function () {
  var node = this.startNode();
  this.next();
  node.expressions = [];
  var curElt = this.parseTemplateElement();
  node.quasis = [curElt];
  while (!curElt.tail) {
    this.expect(_tokentype.types.dollarBraceL);
    node.expressions.push(this.parseExpression());
    this.expect(_tokentype.types.braceR);
    node.quasis.push(curElt = this.parseTemplateElement());
  }
  this.next();
  return this.finishNode(node, "TemplateLiteral");
};

// Parse an object literal or binding pattern.

pp.parseObj = function (isPattern, refDestructuringErrors) {
  var node = this.startNode(),
      first = true,
      propHash = {};
  node.properties = [];
  this.next();
  while (!this.eat(_tokentype.types.braceR)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.afterTrailingComma(_tokentype.types.braceR)) break;
    } else first = false;

    var prop = this.startNode(),
        isGenerator = undefined,
        startPos = undefined,
        startLoc = undefined;
    if (this.options.ecmaVersion >= 6) {
      prop.method = false;
      prop.shorthand = false;
      if (isPattern || refDestructuringErrors) {
        startPos = this.start;
        startLoc = this.startLoc;
      }
      if (!isPattern) isGenerator = this.eat(_tokentype.types.star);
    }
    this.parsePropertyName(prop);
    this.parsePropertyValue(prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors);
    this.checkPropClash(prop, propHash);
    node.properties.push(this.finishNode(prop, "Property"));
  }
  return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression");
};

pp.parsePropertyValue = function (prop, isPattern, isGenerator, startPos, startLoc, refDestructuringErrors) {
  if (this.eat(_tokentype.types.colon)) {
    prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
    prop.kind = "init";
  } else if (this.options.ecmaVersion >= 6 && this.type === _tokentype.types.parenL) {
    if (isPattern) this.unexpected();
    prop.kind = "init";
    prop.method = true;
    prop.value = this.parseMethod(isGenerator);
  } else if (this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" && (prop.key.name === "get" || prop.key.name === "set") && (this.type != _tokentype.types.comma && this.type != _tokentype.types.braceR)) {
    if (isGenerator || isPattern) this.unexpected();
    prop.kind = prop.key.name;
    this.parsePropertyName(prop);
    prop.value = this.parseMethod(false);
    var paramCount = prop.kind === "get" ? 0 : 1;
    if (prop.value.params.length !== paramCount) {
      var start = prop.value.start;
      if (prop.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
    }
    if (prop.kind === "set" && prop.value.params[0].type === "RestElement") this.raise(prop.value.params[0].start, "Setter cannot use rest params");
  } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
    prop.kind = "init";
    if (isPattern) {
      if (this.keywords.test(prop.key.name) || (this.strict ? this.reservedWordsStrictBind : this.reservedWords).test(prop.key.name)) this.raise(prop.key.start, "Binding " + prop.key.name);
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else if (this.type === _tokentype.types.eq && refDestructuringErrors) {
      if (!refDestructuringErrors.shorthandAssign) refDestructuringErrors.shorthandAssign = this.start;
      prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
    } else {
      prop.value = prop.key;
    }
    prop.shorthand = true;
  } else this.unexpected();
};

pp.parsePropertyName = function (prop) {
  if (this.options.ecmaVersion >= 6) {
    if (this.eat(_tokentype.types.bracketL)) {
      prop.computed = true;
      prop.key = this.parseMaybeAssign();
      this.expect(_tokentype.types.bracketR);
      return prop.key;
    } else {
      prop.computed = false;
    }
  }
  return prop.key = this.type === _tokentype.types.num || this.type === _tokentype.types.string ? this.parseExprAtom() : this.parseIdent(true);
};

// Initialize empty function node.

pp.initFunction = function (node) {
  node.id = null;
  if (this.options.ecmaVersion >= 6) {
    node.generator = false;
    node.expression = false;
  }
};

// Parse object or class method.

pp.parseMethod = function (isGenerator) {
  var node = this.startNode();
  this.initFunction(node);
  this.expect(_tokentype.types.parenL);
  node.params = this.parseBindingList(_tokentype.types.parenR, false, false);
  if (this.options.ecmaVersion >= 6) node.generator = isGenerator;
  this.parseFunctionBody(node, false);
  return this.finishNode(node, "FunctionExpression");
};

// Parse arrow function expression with given parameters.

pp.parseArrowExpression = function (node, params) {
  this.initFunction(node);
  node.params = this.toAssignableList(params, true);
  this.parseFunctionBody(node, true);
  return this.finishNode(node, "ArrowFunctionExpression");
};

// Parse function body and check parameters.

pp.parseFunctionBody = function (node, isArrowFunction) {
  var isExpression = isArrowFunction && this.type !== _tokentype.types.braceL;

  if (isExpression) {
    node.body = this.parseMaybeAssign();
    node.expression = true;
  } else {
    // Start a new scope with regard to labels and the `inFunction`
    // flag (restore them to their old value afterwards).
    var oldInFunc = this.inFunction,
        oldInGen = this.inGenerator,
        oldLabels = this.labels;
    this.inFunction = true;this.inGenerator = node.generator;this.labels = [];
    node.body = this.parseBlock(true);
    node.expression = false;
    this.inFunction = oldInFunc;this.inGenerator = oldInGen;this.labels = oldLabels;
  }

  // If this is a strict mode function, verify that argument names
  // are not repeated, and it does not try to bind the words `eval`
  // or `arguments`.
  if (this.strict || !isExpression && node.body.body.length && this.isUseStrict(node.body.body[0])) {
    var oldStrict = this.strict;
    this.strict = true;
    if (node.id) this.checkLVal(node.id, true);
    this.checkParams(node);
    this.strict = oldStrict;
  } else if (isArrowFunction) {
    this.checkParams(node);
  }
};

// Checks function params for various disallowed patterns such as using "eval"
// or "arguments" and duplicate parameters.

pp.checkParams = function (node) {
  var nameHash = {};
  for (var i = 0; i < node.params.length; i++) {
    this.checkLVal(node.params[i], true, nameHash);
  }
};

// Parses a comma-separated list of expressions, and returns them as
// an array. `close` is the token type that ends the list, and
// `allowEmpty` can be turned on to allow subsequent commas with
// nothing in between them to be parsed as `null` (which is needed
// for array literals).

pp.parseExprList = function (close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
  var elts = [],
      first = true;
  while (!this.eat(close)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.type === close && refDestructuringErrors && !refDestructuringErrors.trailingComma) {
        refDestructuringErrors.trailingComma = this.lastTokStart;
      }
      if (allowTrailingComma && this.afterTrailingComma(close)) break;
    } else first = false;

    var elt = undefined;
    if (allowEmpty && this.type === _tokentype.types.comma) elt = null;else if (this.type === _tokentype.types.ellipsis) elt = this.parseSpread(refDestructuringErrors);else elt = this.parseMaybeAssign(false, refDestructuringErrors);
    elts.push(elt);
  }
  return elts;
};

// Parse the next token as an identifier. If `liberal` is true (used
// when parsing properties), it will also convert keywords into
// identifiers.

pp.parseIdent = function (liberal) {
  var node = this.startNode();
  if (liberal && this.options.allowReserved == "never") liberal = false;
  if (this.type === _tokentype.types.name) {
    if (!liberal && (this.strict ? this.reservedWordsStrict : this.reservedWords).test(this.value) && (this.options.ecmaVersion >= 6 || this.input.slice(this.start, this.end).indexOf("\\") == -1)) this.raise(this.start, "The keyword '" + this.value + "' is reserved");
    node.name = this.value;
  } else if (liberal && this.type.keyword) {
    node.name = this.type.keyword;
  } else {
    this.unexpected();
  }
  this.next();
  return this.finishNode(node, "Identifier");
};

// Parses yield expression inside generator.

pp.parseYield = function () {
  var node = this.startNode();
  this.next();
  if (this.type == _tokentype.types.semi || this.canInsertSemicolon() || this.type != _tokentype.types.star && !this.type.startsExpr) {
    node.delegate = false;
    node.argument = null;
  } else {
    node.delegate = this.eat(_tokentype.types.star);
    node.argument = this.parseMaybeAssign();
  }
  return this.finishNode(node, "YieldExpression");
};

// Parses array and generator comprehensions.

pp.parseComprehension = function (node, isGenerator) {
  node.blocks = [];
  while (this.type === _tokentype.types._for) {
    var block = this.startNode();
    this.next();
    this.expect(_tokentype.types.parenL);
    block.left = this.parseBindingAtom();
    this.checkLVal(block.left, true);
    this.expectContextual("of");
    block.right = this.parseExpression();
    this.expect(_tokentype.types.parenR);
    node.blocks.push(this.finishNode(block, "ComprehensionBlock"));
  }
  node.filter = this.eat(_tokentype.types._if) ? this.parseParenExpression() : null;
  node.body = this.parseExpression();
  this.expect(isGenerator ? _tokentype.types.parenR : _tokentype.types.bracketR);
  node.generator = isGenerator;
  return this.finishNode(node, "ComprehensionExpression");
};

},{"./state":10,"./tokentype":14}],2:[function(_dereq_,module,exports){
// This is a trick taken from Esprima. It turns out that, on
// non-Chrome browsers, to check whether a string is in a set, a
// predicate containing a big ugly `switch` statement is faster than
// a regular expression, and on Chrome the two are about on par.
// This function uses `eval` (non-lexical) to produce such a
// predicate from a space-separated string of words.
//
// It starts by sorting the words by length.

// Reserved word lists for various dialects of the language

"use strict";

exports.__esModule = true;
exports.isIdentifierStart = isIdentifierStart;
exports.isIdentifierChar = isIdentifierChar;
var reservedWords = {
  3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
  5: "class enum extends super const export import",
  6: "enum",
  strict: "implements interface let package private protected public static yield",
  strictBind: "eval arguments"
};

exports.reservedWords = reservedWords;
// And the keywords

var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

var keywords = {
  5: ecma5AndLessKeywords,
  6: ecma5AndLessKeywords + " let const class extends export import yield super"
};

exports.keywords = keywords;
// ## Character categories

// Big ugly regular expressions that match characters in the
// whitespace, identifier, and identifier-start categories. These
// are only applied when a character is found to actually have a
// code point above 128.
// Generated by `bin/generate-identifier-regex.js`.

var nonASCIIidentifierStartChars = "ªµºÀ-ÖØ-öø-ˁˆ-ˑˠ-ˤˬˮͰ-ʹͶͷͺ-ͽͿΆΈ-ΊΌΎ-ΡΣ-ϵϷ-ҁҊ-ԯԱ-Ֆՙա-ևא-תװ-ײؠ-يٮٯٱ-ۓەۥۦۮۯۺ-ۼۿܐܒ-ܯݍ-ޥޱߊ-ߪߴߵߺࠀ-ࠕࠚࠤࠨࡀ-ࡘࢠ-ࢲऄ-हऽॐक़-ॡॱ-ঀঅ-ঌএঐও-নপ-রলশ-হঽৎড়ঢ়য়-ৡৰৱਅ-ਊਏਐਓ-ਨਪ-ਰਲਲ਼ਵਸ਼ਸਹਖ਼-ੜਫ਼ੲ-ੴઅ-ઍએ-ઑઓ-નપ-રલળવ-હઽૐૠૡଅ-ଌଏଐଓ-ନପ-ରଲଳଵ-ହଽଡ଼ଢ଼ୟ-ୡୱஃஅ-ஊஎ-ஐஒ-கஙசஜஞடணதந-பம-ஹௐఅ-ఌఎ-ఐఒ-నప-హఽౘౙౠౡಅ-ಌಎ-ಐಒ-ನಪ-ಳವ-ಹಽೞೠೡೱೲഅ-ഌഎ-ഐഒ-ഺഽൎൠൡൺ-ൿඅ-ඖක-නඳ-රලව-ෆก-ะาำเ-ๆກຂຄງຈຊຍດ-ທນ-ຟມ-ຣລວສຫອ-ະາຳຽເ-ໄໆໜ-ໟༀཀ-ཇཉ-ཬྈ-ྌက-ဪဿၐ-ၕၚ-ၝၡၥၦၮ-ၰၵ-ႁႎႠ-ჅჇჍა-ჺჼ-ቈቊ-ቍቐ-ቖቘቚ-ቝበ-ኈኊ-ኍነ-ኰኲ-ኵኸ-ኾዀዂ-ዅወ-ዖዘ-ጐጒ-ጕጘ-ፚᎀ-ᎏᎠ-Ᏼᐁ-ᙬᙯ-ᙿᚁ-ᚚᚠ-ᛪᛮ-ᛸᜀ-ᜌᜎ-ᜑᜠ-ᜱᝀ-ᝑᝠ-ᝬᝮ-ᝰក-ឳៗៜᠠ-ᡷᢀ-ᢨᢪᢰ-ᣵᤀ-ᤞᥐ-ᥭᥰ-ᥴᦀ-ᦫᧁ-ᧇᨀ-ᨖᨠ-ᩔᪧᬅ-ᬳᭅ-ᭋᮃ-ᮠᮮᮯᮺ-ᯥᰀ-ᰣᱍ-ᱏᱚ-ᱽᳩ-ᳬᳮ-ᳱᳵᳶᴀ-ᶿḀ-ἕἘ-Ἕἠ-ὅὈ-Ὅὐ-ὗὙὛὝὟ-ώᾀ-ᾴᾶ-ᾼιῂ-ῄῆ-ῌῐ-ΐῖ-Ίῠ-Ῥῲ-ῴῶ-ῼⁱⁿₐ-ₜℂℇℊ-ℓℕ℘-ℝℤΩℨK-ℹℼ-ℿⅅ-ⅉⅎⅠ-ↈⰀ-Ⱞⰰ-ⱞⱠ-ⳤⳫ-ⳮⳲⳳⴀ-ⴥⴧⴭⴰ-ⵧⵯⶀ-ⶖⶠ-ⶦⶨ-ⶮⶰ-ⶶⶸ-ⶾⷀ-ⷆⷈ-ⷎⷐ-ⷖⷘ-ⷞ々-〇〡-〩〱-〵〸-〼ぁ-ゖ゛-ゟァ-ヺー-ヿㄅ-ㄭㄱ-ㆎㆠ-ㆺㇰ-ㇿ㐀-䶵一-鿌ꀀ-ꒌꓐ-ꓽꔀ-ꘌꘐ-ꘟꘪꘫꙀ-ꙮꙿ-ꚝꚠ-ꛯꜗ-ꜟꜢ-ꞈꞋ-ꞎꞐ-ꞭꞰꞱꟷ-ꠁꠃ-ꠅꠇ-ꠊꠌ-ꠢꡀ-ꡳꢂ-ꢳꣲ-ꣷꣻꤊ-ꤥꤰ-ꥆꥠ-ꥼꦄ-ꦲꧏꧠ-ꧤꧦ-ꧯꧺ-ꧾꨀ-ꨨꩀ-ꩂꩄ-ꩋꩠ-ꩶꩺꩾ-ꪯꪱꪵꪶꪹ-ꪽꫀꫂꫛ-ꫝꫠ-ꫪꫲ-ꫴꬁ-ꬆꬉ-ꬎꬑ-ꬖꬠ-ꬦꬨ-ꬮꬰ-ꭚꭜ-ꭟꭤꭥꯀ-ꯢ가-힣ힰ-ퟆퟋ-ퟻ豈-舘並-龎ﬀ-ﬆﬓ-ﬗיִײַ-ﬨשׁ-זּטּ-לּמּנּסּףּפּצּ-ﮱﯓ-ﴽﵐ-ﶏﶒ-ﷇﷰ-ﷻﹰ-ﹴﹶ-ﻼＡ-Ｚａ-ｚｦ-ﾾￂ-ￇￊ-ￏￒ-ￗￚ-ￜ";
var nonASCIIidentifierChars = "‌‍·̀-ͯ·҃-֑҇-ׇֽֿׁׂׅׄؐ-ًؚ-٩ٰۖ-ۜ۟-۪ۤۧۨ-ۭ۰-۹ܑܰ-݊ަ-ް߀-߉߫-߳ࠖ-࠙ࠛ-ࠣࠥ-ࠧࠩ-࡙࠭-࡛ࣤ-ःऺ-़ा-ॏ॑-ॗॢॣ०-९ঁ-ঃ়া-ৄেৈো-্ৗৢৣ০-৯ਁ-ਃ਼ਾ-ੂੇੈੋ-੍ੑ੦-ੱੵઁ-ઃ઼ા-ૅે-ૉો-્ૢૣ૦-૯ଁ-ଃ଼ା-ୄେୈୋ-୍ୖୗୢୣ୦-୯ஂா-ூெ-ைொ-்ௗ௦-௯ఀ-ఃా-ౄె-ైొ-్ౕౖౢౣ౦-౯ಁ-ಃ಼ಾ-ೄೆ-ೈೊ-್ೕೖೢೣ೦-೯ഁ-ഃാ-ൄെ-ൈൊ-്ൗൢൣ൦-൯ංඃ්ා-ුූෘ-ෟ෦-෯ෲෳัิ-ฺ็-๎๐-๙ັິ-ູົຼ່-ໍ໐-໙༘༙༠-༩༹༵༷༾༿ཱ-྄྆྇ྍ-ྗྙ-ྼ࿆ါ-ှ၀-၉ၖ-ၙၞ-ၠၢ-ၤၧ-ၭၱ-ၴႂ-ႍႏ-ႝ፝-፟፩-፱ᜒ-᜔ᜲ-᜴ᝒᝓᝲᝳ឴-៓៝០-៩᠋-᠍᠐-᠙ᢩᤠ-ᤫᤰ-᤻᥆-᥏ᦰ-ᧀᧈᧉ᧐-᧚ᨗ-ᨛᩕ-ᩞ᩠-᩿᩼-᪉᪐-᪙᪰-᪽ᬀ-ᬄ᬴-᭄᭐-᭙᭫-᭳ᮀ-ᮂᮡ-ᮭ᮰-᮹᯦-᯳ᰤ-᰷᱀-᱉᱐-᱙᳐-᳔᳒-᳨᳭ᳲ-᳴᳸᳹᷀-᷵᷼-᷿‿⁀⁔⃐-⃥⃜⃡-⃰⳯-⵿⳱ⷠ-〪ⷿ-゙゚〯꘠-꘩꙯ꙴ-꙽ꚟ꛰꛱ꠂ꠆ꠋꠣ-ꠧꢀꢁꢴ-꣄꣐-꣙꣠-꣱꤀-꤉ꤦ-꤭ꥇ-꥓ꦀ-ꦃ꦳-꧀꧐-꧙ꧥ꧰-꧹ꨩ-ꨶꩃꩌꩍ꩐-꩙ꩻ-ꩽꪰꪲ-ꪴꪷꪸꪾ꪿꫁ꫫ-ꫯꫵ꫶ꯣ-ꯪ꯬꯭꯰-꯹ﬞ︀-️︠-︭︳︴﹍-﹏０-９＿";

var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

// These are a run-length and offset encoded representation of the
// >0xffff code points that are a valid part of identifiers. The
// offset starts at 0x10000, and each pair of numbers represents an
// offset to the next range, and then a size of the range. They were
// generated by tools/generate-identifier-regex.js
var astralIdentifierStartCodes = [0, 11, 2, 25, 2, 18, 2, 1, 2, 14, 3, 13, 35, 122, 70, 52, 268, 28, 4, 48, 48, 31, 17, 26, 6, 37, 11, 29, 3, 35, 5, 7, 2, 4, 43, 157, 99, 39, 9, 51, 157, 310, 10, 21, 11, 7, 153, 5, 3, 0, 2, 43, 2, 1, 4, 0, 3, 22, 11, 22, 10, 30, 98, 21, 11, 25, 71, 55, 7, 1, 65, 0, 16, 3, 2, 2, 2, 26, 45, 28, 4, 28, 36, 7, 2, 27, 28, 53, 11, 21, 11, 18, 14, 17, 111, 72, 955, 52, 76, 44, 33, 24, 27, 35, 42, 34, 4, 0, 13, 47, 15, 3, 22, 0, 38, 17, 2, 24, 133, 46, 39, 7, 3, 1, 3, 21, 2, 6, 2, 1, 2, 4, 4, 0, 32, 4, 287, 47, 21, 1, 2, 0, 185, 46, 82, 47, 21, 0, 60, 42, 502, 63, 32, 0, 449, 56, 1288, 920, 104, 110, 2962, 1070, 13266, 568, 8, 30, 114, 29, 19, 47, 17, 3, 32, 20, 6, 18, 881, 68, 12, 0, 67, 12, 16481, 1, 3071, 106, 6, 12, 4, 8, 8, 9, 5991, 84, 2, 70, 2, 1, 3, 0, 3, 1, 3, 3, 2, 11, 2, 0, 2, 6, 2, 64, 2, 3, 3, 7, 2, 6, 2, 27, 2, 3, 2, 4, 2, 0, 4, 6, 2, 339, 3, 24, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 30, 2, 24, 2, 7, 4149, 196, 1340, 3, 2, 26, 2, 1, 2, 0, 3, 0, 2, 9, 2, 3, 2, 0, 2, 0, 7, 0, 5, 0, 2, 0, 2, 0, 2, 2, 2, 1, 2, 0, 3, 0, 2, 0, 2, 0, 2, 0, 2, 0, 2, 1, 2, 0, 3, 3, 2, 6, 2, 3, 2, 3, 2, 0, 2, 9, 2, 16, 6, 2, 2, 4, 2, 16, 4421, 42710, 42, 4148, 12, 221, 16355, 541];
var astralIdentifierCodes = [509, 0, 227, 0, 150, 4, 294, 9, 1368, 2, 2, 1, 6, 3, 41, 2, 5, 0, 166, 1, 1306, 2, 54, 14, 32, 9, 16, 3, 46, 10, 54, 9, 7, 2, 37, 13, 2, 9, 52, 0, 13, 2, 49, 13, 16, 9, 83, 11, 168, 11, 6, 9, 8, 2, 57, 0, 2, 6, 3, 1, 3, 2, 10, 0, 11, 1, 3, 6, 4, 4, 316, 19, 13, 9, 214, 6, 3, 8, 112, 16, 16, 9, 82, 12, 9, 9, 535, 9, 20855, 9, 135, 4, 60, 6, 26, 9, 1016, 45, 17, 3, 19723, 1, 5319, 4, 4, 5, 9, 7, 3, 6, 31, 3, 149, 2, 1418, 49, 4305, 6, 792618, 239];

// This has a complexity linear to the value of the code. The
// assumption is that looking up astral identifier characters is
// rare.
function isInAstralSet(code, set) {
  var pos = 0x10000;
  for (var i = 0; i < set.length; i += 2) {
    pos += set[i];
    if (pos > code) return false;
    pos += set[i + 1];
    if (pos >= code) return true;
  }
}

// Test whether a given character code starts an identifier.

function isIdentifierStart(code, astral) {
  if (code < 65) return code === 36;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
  if (astral === false) return false;
  return isInAstralSet(code, astralIdentifierStartCodes);
}

// Test whether a given character is part of an identifier.

function isIdentifierChar(code, astral) {
  if (code < 48) return code === 36;
  if (code < 58) return true;
  if (code < 65) return false;
  if (code < 91) return true;
  if (code < 97) return code === 95;
  if (code < 123) return true;
  if (code <= 0xffff) return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
  if (astral === false) return false;
  return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes);
}

},{}],3:[function(_dereq_,module,exports){
// Acorn is a tiny, fast JavaScript parser written in JavaScript.
//
// Acorn was written by Marijn Haverbeke, Ingvar Stepanyan, and
// various contributors and released under an MIT license.
//
// Git repositories for Acorn are available at
//
//     http://marijnhaverbeke.nl/git/acorn
//     https://github.com/ternjs/acorn.git
//
// Please use the [github bug tracker][ghbt] to report issues.
//
// [ghbt]: https://github.com/ternjs/acorn/issues
//
// This file defines the main parser interface. The library also comes
// with a [error-tolerant parser][dammit] and an
// [abstract syntax tree walker][walk], defined in other files.
//
// [dammit]: acorn_loose.js
// [walk]: util/walk.js

"use strict";

exports.__esModule = true;
exports.parse = parse;
exports.parseExpressionAt = parseExpressionAt;
exports.tokenizer = tokenizer;

var _state = _dereq_("./state");

_dereq_("./parseutil");

_dereq_("./statement");

_dereq_("./lval");

_dereq_("./expression");

_dereq_("./location");

exports.Parser = _state.Parser;
exports.plugins = _state.plugins;

var _options = _dereq_("./options");

exports.defaultOptions = _options.defaultOptions;

var _locutil = _dereq_("./locutil");

exports.Position = _locutil.Position;
exports.SourceLocation = _locutil.SourceLocation;
exports.getLineInfo = _locutil.getLineInfo;

var _node = _dereq_("./node");

exports.Node = _node.Node;

var _tokentype = _dereq_("./tokentype");

exports.TokenType = _tokentype.TokenType;
exports.tokTypes = _tokentype.types;

var _tokencontext = _dereq_("./tokencontext");

exports.TokContext = _tokencontext.TokContext;
exports.tokContexts = _tokencontext.types;

var _identifier = _dereq_("./identifier");

exports.isIdentifierChar = _identifier.isIdentifierChar;
exports.isIdentifierStart = _identifier.isIdentifierStart;

var _tokenize = _dereq_("./tokenize");

exports.Token = _tokenize.Token;

var _whitespace = _dereq_("./whitespace");

exports.isNewLine = _whitespace.isNewLine;
exports.lineBreak = _whitespace.lineBreak;
exports.lineBreakG = _whitespace.lineBreakG;
var version = "2.7.0";

exports.version = version;
// The main exported interface (under `self.acorn` when in the
// browser) is a `parse` function that takes a code string and
// returns an abstract syntax tree as specified by [Mozilla parser
// API][api].
//
// [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

function parse(input, options) {
  return new _state.Parser(options, input).parse();
}

// This function tries to parse a single expression at a given
// offset in a string. Useful for parsing mixed-language formats
// that embed JavaScript expressions.

function parseExpressionAt(input, pos, options) {
  var p = new _state.Parser(options, input, pos);
  p.nextToken();
  return p.parseExpression();
}

// Acorn is organized as a tokenizer and a recursive-descent parser.
// The `tokenizer` export provides an interface to the tokenizer.

function tokenizer(input, options) {
  return new _state.Parser(options, input);
}

},{"./expression":1,"./identifier":2,"./location":4,"./locutil":5,"./lval":6,"./node":7,"./options":8,"./parseutil":9,"./state":10,"./statement":11,"./tokencontext":12,"./tokenize":13,"./tokentype":14,"./whitespace":16}],4:[function(_dereq_,module,exports){
"use strict";

var _state = _dereq_("./state");

var _locutil = _dereq_("./locutil");

var pp = _state.Parser.prototype;

// This function is used to raise exceptions on parse errors. It
// takes an offset integer (into the current `input`) to indicate
// the location of the error, attaches the position to the end
// of the error message, and then raises a `SyntaxError` with that
// message.

pp.raise = function (pos, message) {
  var loc = _locutil.getLineInfo(this.input, pos);
  message += " (" + loc.line + ":" + loc.column + ")";
  var err = new SyntaxError(message);
  err.pos = pos;err.loc = loc;err.raisedAt = this.pos;
  throw err;
};

pp.curPosition = function () {
  if (this.options.locations) {
    return new _locutil.Position(this.curLine, this.pos - this.lineStart);
  }
};

},{"./locutil":5,"./state":10}],5:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.getLineInfo = getLineInfo;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _whitespace = _dereq_("./whitespace");

// These are used when `options.locations` is on, for the
// `startLoc` and `endLoc` properties.

var Position = (function () {
  function Position(line, col) {
    _classCallCheck(this, Position);

    this.line = line;
    this.column = col;
  }

  Position.prototype.offset = function offset(n) {
    return new Position(this.line, this.column + n);
  };

  return Position;
})();

exports.Position = Position;

var SourceLocation = function SourceLocation(p, start, end) {
  _classCallCheck(this, SourceLocation);

  this.start = start;
  this.end = end;
  if (p.sourceFile !== null) this.source = p.sourceFile;
}

// The `getLineInfo` function is mostly useful when the
// `locations` option is off (for performance reasons) and you
// want to find the line/column position for a given character
// offset. `input` should be the code string that the offset refers
// into.

;

exports.SourceLocation = SourceLocation;

function getLineInfo(input, offset) {
  for (var line = 1, cur = 0;;) {
    _whitespace.lineBreakG.lastIndex = cur;
    var match = _whitespace.lineBreakG.exec(input);
    if (match && match.index < offset) {
      ++line;
      cur = match.index + match[0].length;
    } else {
      return new Position(line, offset - cur);
    }
  }
}

},{"./whitespace":16}],6:[function(_dereq_,module,exports){
"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _util = _dereq_("./util");

var pp = _state.Parser.prototype;

// Convert existing expression atom to assignable pattern
// if possible.

pp.toAssignable = function (node, isBinding) {
  if (this.options.ecmaVersion >= 6 && node) {
    switch (node.type) {
      case "Identifier":
      case "ObjectPattern":
      case "ArrayPattern":
        break;

      case "ObjectExpression":
        node.type = "ObjectPattern";
        for (var i = 0; i < node.properties.length; i++) {
          var prop = node.properties[i];
          if (prop.kind !== "init") this.raise(prop.key.start, "Object pattern can't contain getter or setter");
          this.toAssignable(prop.value, isBinding);
        }
        break;

      case "ArrayExpression":
        node.type = "ArrayPattern";
        this.toAssignableList(node.elements, isBinding);
        break;

      case "AssignmentExpression":
        if (node.operator === "=") {
          node.type = "AssignmentPattern";
          delete node.operator;
          // falls through to AssignmentPattern
        } else {
            this.raise(node.left.end, "Only '=' operator can be used for specifying default value.");
            break;
          }

      case "AssignmentPattern":
        if (node.right.type === "YieldExpression") this.raise(node.right.start, "Yield expression cannot be a default value");
        break;

      case "ParenthesizedExpression":
        node.expression = this.toAssignable(node.expression, isBinding);
        break;

      case "MemberExpression":
        if (!isBinding) break;

      default:
        this.raise(node.start, "Assigning to rvalue");
    }
  }
  return node;
};

// Convert list of expression atoms to binding list.

pp.toAssignableList = function (exprList, isBinding) {
  var end = exprList.length;
  if (end) {
    var last = exprList[end - 1];
    if (last && last.type == "RestElement") {
      --end;
    } else if (last && last.type == "SpreadElement") {
      last.type = "RestElement";
      var arg = last.argument;
      this.toAssignable(arg, isBinding);
      if (arg.type !== "Identifier" && arg.type !== "MemberExpression" && arg.type !== "ArrayPattern") this.unexpected(arg.start);
      --end;
    }

    if (isBinding && last.type === "RestElement" && last.argument.type !== "Identifier") this.unexpected(last.argument.start);
  }
  for (var i = 0; i < end; i++) {
    var elt = exprList[i];
    if (elt) this.toAssignable(elt, isBinding);
  }
  return exprList;
};

// Parses spread element.

pp.parseSpread = function (refDestructuringErrors) {
  var node = this.startNode();
  this.next();
  node.argument = this.parseMaybeAssign(refDestructuringErrors);
  return this.finishNode(node, "SpreadElement");
};

pp.parseRest = function (allowNonIdent) {
  var node = this.startNode();
  this.next();

  // RestElement inside of a function parameter must be an identifier
  if (allowNonIdent) node.argument = this.type === _tokentype.types.name ? this.parseIdent() : this.unexpected();else node.argument = this.type === _tokentype.types.name || this.type === _tokentype.types.bracketL ? this.parseBindingAtom() : this.unexpected();

  return this.finishNode(node, "RestElement");
};

// Parses lvalue (assignable) atom.

pp.parseBindingAtom = function () {
  if (this.options.ecmaVersion < 6) return this.parseIdent();
  switch (this.type) {
    case _tokentype.types.name:
      return this.parseIdent();

    case _tokentype.types.bracketL:
      var node = this.startNode();
      this.next();
      node.elements = this.parseBindingList(_tokentype.types.bracketR, true, true);
      return this.finishNode(node, "ArrayPattern");

    case _tokentype.types.braceL:
      return this.parseObj(true);

    default:
      this.unexpected();
  }
};

pp.parseBindingList = function (close, allowEmpty, allowTrailingComma, allowNonIdent) {
  var elts = [],
      first = true;
  while (!this.eat(close)) {
    if (first) first = false;else this.expect(_tokentype.types.comma);
    if (allowEmpty && this.type === _tokentype.types.comma) {
      elts.push(null);
    } else if (allowTrailingComma && this.afterTrailingComma(close)) {
      break;
    } else if (this.type === _tokentype.types.ellipsis) {
      var rest = this.parseRest(allowNonIdent);
      this.parseBindingListItem(rest);
      elts.push(rest);
      this.expect(close);
      break;
    } else {
      var elem = this.parseMaybeDefault(this.start, this.startLoc);
      this.parseBindingListItem(elem);
      elts.push(elem);
    }
  }
  return elts;
};

pp.parseBindingListItem = function (param) {
  return param;
};

// Parses assignment pattern around given atom if possible.

pp.parseMaybeDefault = function (startPos, startLoc, left) {
  left = left || this.parseBindingAtom();
  if (this.options.ecmaVersion < 6 || !this.eat(_tokentype.types.eq)) return left;
  var node = this.startNodeAt(startPos, startLoc);
  node.left = left;
  node.right = this.parseMaybeAssign();
  return this.finishNode(node, "AssignmentPattern");
};

// Verify that a node is an lval — something that can be assigned
// to.

pp.checkLVal = function (expr, isBinding, checkClashes) {
  switch (expr.type) {
    case "Identifier":
      if (this.strict && this.reservedWordsStrictBind.test(expr.name)) this.raise(expr.start, (isBinding ? "Binding " : "Assigning to ") + expr.name + " in strict mode");
      if (checkClashes) {
        if (_util.has(checkClashes, expr.name)) this.raise(expr.start, "Argument name clash");
        checkClashes[expr.name] = true;
      }
      break;

    case "MemberExpression":
      if (isBinding) this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " member expression");
      break;

    case "ObjectPattern":
      for (var i = 0; i < expr.properties.length; i++) {
        this.checkLVal(expr.properties[i].value, isBinding, checkClashes);
      }break;

    case "ArrayPattern":
      for (var i = 0; i < expr.elements.length; i++) {
        var elem = expr.elements[i];
        if (elem) this.checkLVal(elem, isBinding, checkClashes);
      }
      break;

    case "AssignmentPattern":
      this.checkLVal(expr.left, isBinding, checkClashes);
      break;

    case "RestElement":
      this.checkLVal(expr.argument, isBinding, checkClashes);
      break;

    case "ParenthesizedExpression":
      this.checkLVal(expr.expression, isBinding, checkClashes);
      break;

    default:
      this.raise(expr.start, (isBinding ? "Binding" : "Assigning to") + " rvalue");
  }
};

},{"./state":10,"./tokentype":14,"./util":15}],7:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _state = _dereq_("./state");

var _locutil = _dereq_("./locutil");

var Node = function Node(parser, pos, loc) {
  _classCallCheck(this, Node);

  this.type = "";
  this.start = pos;
  this.end = 0;
  if (parser.options.locations) this.loc = new _locutil.SourceLocation(parser, loc);
  if (parser.options.directSourceFile) this.sourceFile = parser.options.directSourceFile;
  if (parser.options.ranges) this.range = [pos, 0];
}

// Start an AST node, attaching a start offset.

;

exports.Node = Node;
var pp = _state.Parser.prototype;

pp.startNode = function () {
  return new Node(this, this.start, this.startLoc);
};

pp.startNodeAt = function (pos, loc) {
  return new Node(this, pos, loc);
};

// Finish an AST node, adding `type` and `end` properties.

function finishNodeAt(node, type, pos, loc) {
  node.type = type;
  node.end = pos;
  if (this.options.locations) node.loc.end = loc;
  if (this.options.ranges) node.range[1] = pos;
  return node;
}

pp.finishNode = function (node, type) {
  return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc);
};

// Finish node at given position

pp.finishNodeAt = function (node, type, pos, loc) {
  return finishNodeAt.call(this, node, type, pos, loc);
};

},{"./locutil":5,"./state":10}],8:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.getOptions = getOptions;

var _util = _dereq_("./util");

var _locutil = _dereq_("./locutil");

// A second optional argument can be given to further configure
// the parser process. These options are recognized:

var defaultOptions = {
  // `ecmaVersion` indicates the ECMAScript version to parse. Must
  // be either 3, or 5, or 6. This influences support for strict
  // mode, the set of reserved words, support for getters and
  // setters and other features.
  ecmaVersion: 5,
  // Source type ("script" or "module") for different semantics
  sourceType: "script",
  // `onInsertedSemicolon` can be a callback that will be called
  // when a semicolon is automatically inserted. It will be passed
  // th position of the comma as an offset, and if `locations` is
  // enabled, it is given the location as a `{line, column}` object
  // as second argument.
  onInsertedSemicolon: null,
  // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
  // trailing commas.
  onTrailingComma: null,
  // By default, reserved words are only enforced if ecmaVersion >= 5.
  // Set `allowReserved` to a boolean value to explicitly turn this on
  // an off. When this option has the value "never", reserved words
  // and keywords can also not be used as property names.
  allowReserved: null,
  // When enabled, a return at the top level is not considered an
  // error.
  allowReturnOutsideFunction: false,
  // When enabled, import/export statements are not constrained to
  // appearing at the top of the program.
  allowImportExportEverywhere: false,
  // When enabled, hashbang directive in the beginning of file
  // is allowed and treated as a line comment.
  allowHashBang: false,
  // When `locations` is on, `loc` properties holding objects with
  // `start` and `end` properties in `{line, column}` form (with
  // line being 1-based and column 0-based) will be attached to the
  // nodes.
  locations: false,
  // A function can be passed as `onToken` option, which will
  // cause Acorn to call that function with object in the same
  // format as tokens returned from `tokenizer().getToken()`. Note
  // that you are not allowed to call the parser from the
  // callback—that will corrupt its internal state.
  onToken: null,
  // A function can be passed as `onComment` option, which will
  // cause Acorn to call that function with `(block, text, start,
  // end)` parameters whenever a comment is skipped. `block` is a
  // boolean indicating whether this is a block (`/* */`) comment,
  // `text` is the content of the comment, and `start` and `end` are
  // character offsets that denote the start and end of the comment.
  // When the `locations` option is on, two more parameters are
  // passed, the full `{line, column}` locations of the start and
  // end of the comments. Note that you are not allowed to call the
  // parser from the callback—that will corrupt its internal state.
  onComment: null,
  // Nodes have their start and end characters offsets recorded in
  // `start` and `end` properties (directly on the node, rather than
  // the `loc` object, which holds line/column data. To also add a
  // [semi-standardized][range] `range` property holding a `[start,
  // end]` array with the same numbers, set the `ranges` option to
  // `true`.
  //
  // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
  ranges: false,
  // It is possible to parse multiple files into a single AST by
  // passing the tree produced by parsing the first file as
  // `program` option in subsequent parses. This will add the
  // toplevel forms of the parsed file to the `Program` (top) node
  // of an existing parse tree.
  program: null,
  // When `locations` is on, you can pass this to record the source
  // file in every node's `loc` object.
  sourceFile: null,
  // This value, if given, is stored in every node, whether
  // `locations` is on or off.
  directSourceFile: null,
  // When enabled, parenthesized expressions are represented by
  // (non-standard) ParenthesizedExpression nodes
  preserveParens: false,
  plugins: {}
};

exports.defaultOptions = defaultOptions;
// Interpret and default an options object

function getOptions(opts) {
  var options = {};
  for (var opt in defaultOptions) {
    options[opt] = opts && _util.has(opts, opt) ? opts[opt] : defaultOptions[opt];
  }if (options.allowReserved == null) options.allowReserved = options.ecmaVersion < 5;

  if (_util.isArray(options.onToken)) {
    (function () {
      var tokens = options.onToken;
      options.onToken = function (token) {
        return tokens.push(token);
      };
    })();
  }
  if (_util.isArray(options.onComment)) options.onComment = pushComment(options, options.onComment);

  return options;
}

function pushComment(options, array) {
  return function (block, text, start, end, startLoc, endLoc) {
    var comment = {
      type: block ? 'Block' : 'Line',
      value: text,
      start: start,
      end: end
    };
    if (options.locations) comment.loc = new _locutil.SourceLocation(this, startLoc, endLoc);
    if (options.ranges) comment.range = [start, end];
    array.push(comment);
  };
}

},{"./locutil":5,"./util":15}],9:[function(_dereq_,module,exports){
"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _whitespace = _dereq_("./whitespace");

var pp = _state.Parser.prototype;

// ## Parser utilities

// Test whether a statement node is the string literal `"use strict"`.

pp.isUseStrict = function (stmt) {
  return this.options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" && stmt.expression.type === "Literal" && stmt.expression.raw.slice(1, -1) === "use strict";
};

// Predicate that tests whether the next token is of the given
// type, and if yes, consumes it as a side effect.

pp.eat = function (type) {
  if (this.type === type) {
    this.next();
    return true;
  } else {
    return false;
  }
};

// Tests whether parsed token is a contextual keyword.

pp.isContextual = function (name) {
  return this.type === _tokentype.types.name && this.value === name;
};

// Consumes contextual keyword if possible.

pp.eatContextual = function (name) {
  return this.value === name && this.eat(_tokentype.types.name);
};

// Asserts that following token is given contextual keyword.

pp.expectContextual = function (name) {
  if (!this.eatContextual(name)) this.unexpected();
};

// Test whether a semicolon can be inserted at the current position.

pp.canInsertSemicolon = function () {
  return this.type === _tokentype.types.eof || this.type === _tokentype.types.braceR || _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
};

pp.insertSemicolon = function () {
  if (this.canInsertSemicolon()) {
    if (this.options.onInsertedSemicolon) this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc);
    return true;
  }
};

// Consume a semicolon, or, failing that, see if we are allowed to
// pretend that there is a semicolon at this position.

pp.semicolon = function () {
  if (!this.eat(_tokentype.types.semi) && !this.insertSemicolon()) this.unexpected();
};

pp.afterTrailingComma = function (tokType) {
  if (this.type == tokType) {
    if (this.options.onTrailingComma) this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc);
    this.next();
    return true;
  }
};

// Expect a token of a given type. If found, consume it, otherwise,
// raise an unexpected token error.

pp.expect = function (type) {
  this.eat(type) || this.unexpected();
};

// Raise an unexpected token error.

pp.unexpected = function (pos) {
  this.raise(pos != null ? pos : this.start, "Unexpected token");
};

pp.checkPatternErrors = function (refDestructuringErrors, andThrow) {
  var pos = refDestructuringErrors && refDestructuringErrors.trailingComma;
  if (!andThrow) return !!pos;
  if (pos) this.raise(pos, "Trailing comma is not permitted in destructuring patterns");
};

pp.checkExpressionErrors = function (refDestructuringErrors, andThrow) {
  var pos = refDestructuringErrors && refDestructuringErrors.shorthandAssign;
  if (!andThrow) return !!pos;
  if (pos) this.raise(pos, "Shorthand property assignments are valid only in destructuring patterns");
};

},{"./state":10,"./tokentype":14,"./whitespace":16}],10:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _identifier = _dereq_("./identifier");

var _tokentype = _dereq_("./tokentype");

var _whitespace = _dereq_("./whitespace");

var _options = _dereq_("./options");

// Registered plugins
var plugins = {};

exports.plugins = plugins;
function keywordRegexp(words) {
  return new RegExp("^(" + words.replace(/ /g, "|") + ")$");
}

var Parser = (function () {
  function Parser(options, input, startPos) {
    _classCallCheck(this, Parser);

    this.options = options = _options.getOptions(options);
    this.sourceFile = options.sourceFile;
    this.keywords = keywordRegexp(_identifier.keywords[options.ecmaVersion >= 6 ? 6 : 5]);
    var reserved = options.allowReserved ? "" : _identifier.reservedWords[options.ecmaVersion] + (options.sourceType == "module" ? " await" : "");
    this.reservedWords = keywordRegexp(reserved);
    var reservedStrict = (reserved ? reserved + " " : "") + _identifier.reservedWords.strict;
    this.reservedWordsStrict = keywordRegexp(reservedStrict);
    this.reservedWordsStrictBind = keywordRegexp(reservedStrict + " " + _identifier.reservedWords.strictBind);
    this.input = String(input);

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false;

    // Load plugins
    this.loadPlugins(options.plugins);

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos;
      this.lineStart = Math.max(0, this.input.lastIndexOf("\n", startPos));
      this.curLine = this.input.slice(0, this.lineStart).split(_whitespace.lineBreak).length;
    } else {
      this.pos = this.lineStart = 0;
      this.curLine = 1;
    }

    // Properties of the current token:
    // Its type
    this.type = _tokentype.types.eof;
    // For tokens that include more information than their type, the value
    this.value = null;
    // Its start and end offset
    this.start = this.end = this.pos;
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition();

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext();
    this.exprAllowed = true;

    // Figure out if it's a module code.
    this.strict = this.inModule = options.sourceType === "module";

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1;

    // Flags to track whether we are in a function, a generator.
    this.inFunction = this.inGenerator = false;
    // Labels in scope.
    this.labels = [];

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === '#!') this.skipLineComment(2);
  }

  // DEPRECATED Kept for backwards compatibility until 3.0 in case a plugin uses them

  Parser.prototype.isKeyword = function isKeyword(word) {
    return this.keywords.test(word);
  };

  Parser.prototype.isReservedWord = function isReservedWord(word) {
    return this.reservedWords.test(word);
  };

  Parser.prototype.extend = function extend(name, f) {
    this[name] = f(this[name]);
  };

  Parser.prototype.loadPlugins = function loadPlugins(pluginConfigs) {
    for (var _name in pluginConfigs) {
      var plugin = plugins[_name];
      if (!plugin) throw new Error("Plugin '" + _name + "' not found");
      plugin(this, pluginConfigs[_name]);
    }
  };

  Parser.prototype.parse = function parse() {
    var node = this.options.program || this.startNode();
    this.nextToken();
    return this.parseTopLevel(node);
  };

  return Parser;
})();

exports.Parser = Parser;

},{"./identifier":2,"./options":8,"./tokentype":14,"./whitespace":16}],11:[function(_dereq_,module,exports){
"use strict";

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _whitespace = _dereq_("./whitespace");

var pp = _state.Parser.prototype;

// ### Statement parsing

// Parse a program. Initializes the parser, reads any number of
// statements, and wraps them in a Program node.  Optionally takes a
// `program` argument.  If present, the statements will be appended
// to its body instead of creating a new node.

pp.parseTopLevel = function (node) {
  var first = true;
  if (!node.body) node.body = [];
  while (this.type !== _tokentype.types.eof) {
    var stmt = this.parseStatement(true, true);
    node.body.push(stmt);
    if (first) {
      if (this.isUseStrict(stmt)) this.setStrict(true);
      first = false;
    }
  }
  this.next();
  if (this.options.ecmaVersion >= 6) {
    node.sourceType = this.options.sourceType;
  }
  return this.finishNode(node, "Program");
};

var loopLabel = { kind: "loop" },
    switchLabel = { kind: "switch" };

// Parse a single statement.
//
// If expecting a statement and finding a slash operator, parse a
// regular expression literal. This is to handle cases like
// `if (foo) /blah/.exec(foo)`, where looking at the previous token
// does not help.

pp.parseStatement = function (declaration, topLevel) {
  var starttype = this.type,
      node = this.startNode();

  // Most types of statements are recognized by the keyword they
  // start with. Many are trivial to parse, some require a bit of
  // complexity.

  switch (starttype) {
    case _tokentype.types._break:case _tokentype.types._continue:
      return this.parseBreakContinueStatement(node, starttype.keyword);
    case _tokentype.types._debugger:
      return this.parseDebuggerStatement(node);
    case _tokentype.types._do:
      return this.parseDoStatement(node);
    case _tokentype.types._for:
      return this.parseForStatement(node);
    case _tokentype.types._function:
      if (!declaration && this.options.ecmaVersion >= 6) this.unexpected();
      return this.parseFunctionStatement(node);
    case _tokentype.types._class:
      if (!declaration) this.unexpected();
      return this.parseClass(node, true);
    case _tokentype.types._if:
      return this.parseIfStatement(node);
    case _tokentype.types._return:
      return this.parseReturnStatement(node);
    case _tokentype.types._switch:
      return this.parseSwitchStatement(node);
    case _tokentype.types._throw:
      return this.parseThrowStatement(node);
    case _tokentype.types._try:
      return this.parseTryStatement(node);
    case _tokentype.types._let:case _tokentype.types._const:
      if (!declaration) this.unexpected(); // NOTE: falls through to _var
    case _tokentype.types._var:
      return this.parseVarStatement(node, starttype);
    case _tokentype.types._while:
      return this.parseWhileStatement(node);
    case _tokentype.types._with:
      return this.parseWithStatement(node);
    case _tokentype.types.braceL:
      return this.parseBlock();
    case _tokentype.types.semi:
      return this.parseEmptyStatement(node);
    case _tokentype.types._export:
    case _tokentype.types._import:
      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel) this.raise(this.start, "'import' and 'export' may only appear at the top level");
        if (!this.inModule) this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'");
      }
      return starttype === _tokentype.types._import ? this.parseImport(node) : this.parseExport(node);

    // If the statement does not start with a statement keyword or a
    // brace, it's an ExpressionStatement or LabeledStatement. We
    // simply start parsing an expression, and afterwards, if the
    // next token is a colon and the expression was a simple
    // Identifier node, we switch to interpreting it as a label.
    default:
      var maybeName = this.value,
          expr = this.parseExpression();
      if (starttype === _tokentype.types.name && expr.type === "Identifier" && this.eat(_tokentype.types.colon)) return this.parseLabeledStatement(node, maybeName, expr);else return this.parseExpressionStatement(node, expr);
  }
};

pp.parseBreakContinueStatement = function (node, keyword) {
  var isBreak = keyword == "break";
  this.next();
  if (this.eat(_tokentype.types.semi) || this.insertSemicolon()) node.label = null;else if (this.type !== _tokentype.types.name) this.unexpected();else {
    node.label = this.parseIdent();
    this.semicolon();
  }

  // Verify that there is an actual destination to break or
  // continue to.
  for (var i = 0; i < this.labels.length; ++i) {
    var lab = this.labels[i];
    if (node.label == null || lab.name === node.label.name) {
      if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
      if (node.label && isBreak) break;
    }
  }
  if (i === this.labels.length) this.raise(node.start, "Unsyntactic " + keyword);
  return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
};

pp.parseDebuggerStatement = function (node) {
  this.next();
  this.semicolon();
  return this.finishNode(node, "DebuggerStatement");
};

pp.parseDoStatement = function (node) {
  this.next();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  this.expect(_tokentype.types._while);
  node.test = this.parseParenExpression();
  if (this.options.ecmaVersion >= 6) this.eat(_tokentype.types.semi);else this.semicolon();
  return this.finishNode(node, "DoWhileStatement");
};

// Disambiguating between a `for` and a `for`/`in` or `for`/`of`
// loop is non-trivial. Basically, we have to parse the init `var`
// statement or expression, disallowing the `in` operator (see
// the second parameter to `parseExpression`), and then check
// whether the next token is `in` or `of`. When there is no init
// part (semicolon immediately after the opening parenthesis), it
// is a regular `for` loop.

pp.parseForStatement = function (node) {
  this.next();
  this.labels.push(loopLabel);
  this.expect(_tokentype.types.parenL);
  if (this.type === _tokentype.types.semi) return this.parseFor(node, null);
  if (this.type === _tokentype.types._var || this.type === _tokentype.types._let || this.type === _tokentype.types._const) {
    var _init = this.startNode(),
        varKind = this.type;
    this.next();
    this.parseVar(_init, true, varKind);
    this.finishNode(_init, "VariableDeclaration");
    if ((this.type === _tokentype.types._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) && _init.declarations.length === 1 && !(varKind !== _tokentype.types._var && _init.declarations[0].init)) return this.parseForIn(node, _init);
    return this.parseFor(node, _init);
  }
  var refDestructuringErrors = { shorthandAssign: 0, trailingComma: 0 };
  var init = this.parseExpression(true, refDestructuringErrors);
  if (this.type === _tokentype.types._in || this.options.ecmaVersion >= 6 && this.isContextual("of")) {
    this.checkPatternErrors(refDestructuringErrors, true);
    this.toAssignable(init);
    this.checkLVal(init);
    return this.parseForIn(node, init);
  } else {
    this.checkExpressionErrors(refDestructuringErrors, true);
  }
  return this.parseFor(node, init);
};

pp.parseFunctionStatement = function (node) {
  this.next();
  return this.parseFunction(node, true);
};

pp.parseIfStatement = function (node) {
  this.next();
  node.test = this.parseParenExpression();
  node.consequent = this.parseStatement(false);
  node.alternate = this.eat(_tokentype.types._else) ? this.parseStatement(false) : null;
  return this.finishNode(node, "IfStatement");
};

pp.parseReturnStatement = function (node) {
  if (!this.inFunction && !this.options.allowReturnOutsideFunction) this.raise(this.start, "'return' outside of function");
  this.next();

  // In `return` (and `break`/`continue`), the keywords with
  // optional arguments, we eagerly look for a semicolon or the
  // possibility to insert one.

  if (this.eat(_tokentype.types.semi) || this.insertSemicolon()) node.argument = null;else {
    node.argument = this.parseExpression();this.semicolon();
  }
  return this.finishNode(node, "ReturnStatement");
};

pp.parseSwitchStatement = function (node) {
  this.next();
  node.discriminant = this.parseParenExpression();
  node.cases = [];
  this.expect(_tokentype.types.braceL);
  this.labels.push(switchLabel);

  // Statements under must be grouped (by label) in SwitchCase
  // nodes. `cur` is used to keep the node that we are currently
  // adding statements to.

  for (var cur, sawDefault = false; this.type != _tokentype.types.braceR;) {
    if (this.type === _tokentype.types._case || this.type === _tokentype.types._default) {
      var isCase = this.type === _tokentype.types._case;
      if (cur) this.finishNode(cur, "SwitchCase");
      node.cases.push(cur = this.startNode());
      cur.consequent = [];
      this.next();
      if (isCase) {
        cur.test = this.parseExpression();
      } else {
        if (sawDefault) this.raise(this.lastTokStart, "Multiple default clauses");
        sawDefault = true;
        cur.test = null;
      }
      this.expect(_tokentype.types.colon);
    } else {
      if (!cur) this.unexpected();
      cur.consequent.push(this.parseStatement(true));
    }
  }
  if (cur) this.finishNode(cur, "SwitchCase");
  this.next(); // Closing brace
  this.labels.pop();
  return this.finishNode(node, "SwitchStatement");
};

pp.parseThrowStatement = function (node) {
  this.next();
  if (_whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) this.raise(this.lastTokEnd, "Illegal newline after throw");
  node.argument = this.parseExpression();
  this.semicolon();
  return this.finishNode(node, "ThrowStatement");
};

// Reused empty array added for node fields that are always empty.

var empty = [];

pp.parseTryStatement = function (node) {
  this.next();
  node.block = this.parseBlock();
  node.handler = null;
  if (this.type === _tokentype.types._catch) {
    var clause = this.startNode();
    this.next();
    this.expect(_tokentype.types.parenL);
    clause.param = this.parseBindingAtom();
    this.checkLVal(clause.param, true);
    this.expect(_tokentype.types.parenR);
    clause.body = this.parseBlock();
    node.handler = this.finishNode(clause, "CatchClause");
  }
  node.finalizer = this.eat(_tokentype.types._finally) ? this.parseBlock() : null;
  if (!node.handler && !node.finalizer) this.raise(node.start, "Missing catch or finally clause");
  return this.finishNode(node, "TryStatement");
};

pp.parseVarStatement = function (node, kind) {
  this.next();
  this.parseVar(node, false, kind);
  this.semicolon();
  return this.finishNode(node, "VariableDeclaration");
};

pp.parseWhileStatement = function (node) {
  this.next();
  node.test = this.parseParenExpression();
  this.labels.push(loopLabel);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "WhileStatement");
};

pp.parseWithStatement = function (node) {
  if (this.strict) this.raise(this.start, "'with' in strict mode");
  this.next();
  node.object = this.parseParenExpression();
  node.body = this.parseStatement(false);
  return this.finishNode(node, "WithStatement");
};

pp.parseEmptyStatement = function (node) {
  this.next();
  return this.finishNode(node, "EmptyStatement");
};

pp.parseLabeledStatement = function (node, maybeName, expr) {
  for (var i = 0; i < this.labels.length; ++i) {
    if (this.labels[i].name === maybeName) this.raise(expr.start, "Label '" + maybeName + "' is already declared");
  }var kind = this.type.isLoop ? "loop" : this.type === _tokentype.types._switch ? "switch" : null;
  for (var i = this.labels.length - 1; i >= 0; i--) {
    var label = this.labels[i];
    if (label.statementStart == node.start) {
      label.statementStart = this.start;
      label.kind = kind;
    } else break;
  }
  this.labels.push({ name: maybeName, kind: kind, statementStart: this.start });
  node.body = this.parseStatement(true);
  this.labels.pop();
  node.label = expr;
  return this.finishNode(node, "LabeledStatement");
};

pp.parseExpressionStatement = function (node, expr) {
  node.expression = expr;
  this.semicolon();
  return this.finishNode(node, "ExpressionStatement");
};

// Parse a semicolon-enclosed block of statements, handling `"use
// strict"` declarations when `allowStrict` is true (used for
// function bodies).

pp.parseBlock = function (allowStrict) {
  var node = this.startNode(),
      first = true,
      oldStrict = undefined;
  node.body = [];
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    var stmt = this.parseStatement(true);
    node.body.push(stmt);
    if (first && allowStrict && this.isUseStrict(stmt)) {
      oldStrict = this.strict;
      this.setStrict(this.strict = true);
    }
    first = false;
  }
  if (oldStrict === false) this.setStrict(false);
  return this.finishNode(node, "BlockStatement");
};

// Parse a regular `for` loop. The disambiguation code in
// `parseStatement` will already have parsed the init statement or
// expression.

pp.parseFor = function (node, init) {
  node.init = init;
  this.expect(_tokentype.types.semi);
  node.test = this.type === _tokentype.types.semi ? null : this.parseExpression();
  this.expect(_tokentype.types.semi);
  node.update = this.type === _tokentype.types.parenR ? null : this.parseExpression();
  this.expect(_tokentype.types.parenR);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, "ForStatement");
};

// Parse a `for`/`in` and `for`/`of` loop, which are almost
// same from parser's perspective.

pp.parseForIn = function (node, init) {
  var type = this.type === _tokentype.types._in ? "ForInStatement" : "ForOfStatement";
  this.next();
  node.left = init;
  node.right = this.parseExpression();
  this.expect(_tokentype.types.parenR);
  node.body = this.parseStatement(false);
  this.labels.pop();
  return this.finishNode(node, type);
};

// Parse a list of variable declarations.

pp.parseVar = function (node, isFor, kind) {
  node.declarations = [];
  node.kind = kind.keyword;
  for (;;) {
    var decl = this.startNode();
    this.parseVarId(decl);
    if (this.eat(_tokentype.types.eq)) {
      decl.init = this.parseMaybeAssign(isFor);
    } else if (kind === _tokentype.types._const && !(this.type === _tokentype.types._in || this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      this.unexpected();
    } else if (decl.id.type != "Identifier" && !(isFor && (this.type === _tokentype.types._in || this.isContextual("of")))) {
      this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
    } else {
      decl.init = null;
    }
    node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
    if (!this.eat(_tokentype.types.comma)) break;
  }
  return node;
};

pp.parseVarId = function (decl) {
  decl.id = this.parseBindingAtom();
  this.checkLVal(decl.id, true);
};

// Parse a function declaration or literal (depending on the
// `isStatement` parameter).

pp.parseFunction = function (node, isStatement, allowExpressionBody) {
  this.initFunction(node);
  if (this.options.ecmaVersion >= 6) node.generator = this.eat(_tokentype.types.star);
  if (isStatement || this.type === _tokentype.types.name) node.id = this.parseIdent();
  this.parseFunctionParams(node);
  this.parseFunctionBody(node, allowExpressionBody);
  return this.finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
};

pp.parseFunctionParams = function (node) {
  this.expect(_tokentype.types.parenL);
  node.params = this.parseBindingList(_tokentype.types.parenR, false, false, true);
};

// Parse a class declaration or literal (depending on the
// `isStatement` parameter).

pp.parseClass = function (node, isStatement) {
  this.next();
  this.parseClassId(node, isStatement);
  this.parseClassSuper(node);
  var classBody = this.startNode();
  var hadConstructor = false;
  classBody.body = [];
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    if (this.eat(_tokentype.types.semi)) continue;
    var method = this.startNode();
    var isGenerator = this.eat(_tokentype.types.star);
    var isMaybeStatic = this.type === _tokentype.types.name && this.value === "static";
    this.parsePropertyName(method);
    method["static"] = isMaybeStatic && this.type !== _tokentype.types.parenL;
    if (method["static"]) {
      if (isGenerator) this.unexpected();
      isGenerator = this.eat(_tokentype.types.star);
      this.parsePropertyName(method);
    }
    method.kind = "method";
    var isGetSet = false;
    if (!method.computed) {
      var key = method.key;

      if (!isGenerator && key.type === "Identifier" && this.type !== _tokentype.types.parenL && (key.name === "get" || key.name === "set")) {
        isGetSet = true;
        method.kind = key.name;
        key = this.parsePropertyName(method);
      }
      if (!method["static"] && (key.type === "Identifier" && key.name === "constructor" || key.type === "Literal" && key.value === "constructor")) {
        if (hadConstructor) this.raise(key.start, "Duplicate constructor in the same class");
        if (isGetSet) this.raise(key.start, "Constructor can't have get/set modifier");
        if (isGenerator) this.raise(key.start, "Constructor can't be a generator");
        method.kind = "constructor";
        hadConstructor = true;
      }
    }
    this.parseClassMethod(classBody, method, isGenerator);
    if (isGetSet) {
      var paramCount = method.kind === "get" ? 0 : 1;
      if (method.value.params.length !== paramCount) {
        var start = method.value.start;
        if (method.kind === "get") this.raise(start, "getter should have no params");else this.raise(start, "setter should have exactly one param");
      }
      if (method.kind === "set" && method.value.params[0].type === "RestElement") this.raise(method.value.params[0].start, "Setter cannot use rest params");
    }
  }
  node.body = this.finishNode(classBody, "ClassBody");
  return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression");
};

pp.parseClassMethod = function (classBody, method, isGenerator) {
  method.value = this.parseMethod(isGenerator);
  classBody.body.push(this.finishNode(method, "MethodDefinition"));
};

pp.parseClassId = function (node, isStatement) {
  node.id = this.type === _tokentype.types.name ? this.parseIdent() : isStatement ? this.unexpected() : null;
};

pp.parseClassSuper = function (node) {
  node.superClass = this.eat(_tokentype.types._extends) ? this.parseExprSubscripts() : null;
};

// Parses module export declaration.

pp.parseExport = function (node) {
  this.next();
  // export * from '...'
  if (this.eat(_tokentype.types.star)) {
    this.expectContextual("from");
    node.source = this.type === _tokentype.types.string ? this.parseExprAtom() : this.unexpected();
    this.semicolon();
    return this.finishNode(node, "ExportAllDeclaration");
  }
  if (this.eat(_tokentype.types._default)) {
    // export default ...
    var expr = this.parseMaybeAssign();
    var needsSemi = true;
    if (expr.type == "FunctionExpression" || expr.type == "ClassExpression") {
      needsSemi = false;
      if (expr.id) {
        expr.type = expr.type == "FunctionExpression" ? "FunctionDeclaration" : "ClassDeclaration";
      }
    }
    node.declaration = expr;
    if (needsSemi) this.semicolon();
    return this.finishNode(node, "ExportDefaultDeclaration");
  }
  // export var|const|let|function|class ...
  if (this.shouldParseExportStatement()) {
    node.declaration = this.parseStatement(true);
    node.specifiers = [];
    node.source = null;
  } else {
    // export { x, y as z } [from '...']
    node.declaration = null;
    node.specifiers = this.parseExportSpecifiers();
    if (this.eatContextual("from")) {
      node.source = this.type === _tokentype.types.string ? this.parseExprAtom() : this.unexpected();
    } else {
      // check for keywords used as local names
      for (var i = 0; i < node.specifiers.length; i++) {
        if (this.keywords.test(node.specifiers[i].local.name) || this.reservedWords.test(node.specifiers[i].local.name)) {
          this.unexpected(node.specifiers[i].local.start);
        }
      }

      node.source = null;
    }
    this.semicolon();
  }
  return this.finishNode(node, "ExportNamedDeclaration");
};

pp.shouldParseExportStatement = function () {
  return this.type.keyword;
};

// Parses a comma-separated list of module exports.

pp.parseExportSpecifiers = function () {
  var nodes = [],
      first = true;
  // export { x, y as z } [from '...']
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.afterTrailingComma(_tokentype.types.braceR)) break;
    } else first = false;

    var node = this.startNode();
    node.local = this.parseIdent(this.type === _tokentype.types._default);
    node.exported = this.eatContextual("as") ? this.parseIdent(true) : node.local;
    nodes.push(this.finishNode(node, "ExportSpecifier"));
  }
  return nodes;
};

// Parses import declaration.

pp.parseImport = function (node) {
  this.next();
  // import '...'
  if (this.type === _tokentype.types.string) {
    node.specifiers = empty;
    node.source = this.parseExprAtom();
  } else {
    node.specifiers = this.parseImportSpecifiers();
    this.expectContextual("from");
    node.source = this.type === _tokentype.types.string ? this.parseExprAtom() : this.unexpected();
  }
  this.semicolon();
  return this.finishNode(node, "ImportDeclaration");
};

// Parses a comma-separated list of module imports.

pp.parseImportSpecifiers = function () {
  var nodes = [],
      first = true;
  if (this.type === _tokentype.types.name) {
    // import defaultObj, { x, y as z } from '...'
    var node = this.startNode();
    node.local = this.parseIdent();
    this.checkLVal(node.local, true);
    nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
    if (!this.eat(_tokentype.types.comma)) return nodes;
  }
  if (this.type === _tokentype.types.star) {
    var node = this.startNode();
    this.next();
    this.expectContextual("as");
    node.local = this.parseIdent();
    this.checkLVal(node.local, true);
    nodes.push(this.finishNode(node, "ImportNamespaceSpecifier"));
    return nodes;
  }
  this.expect(_tokentype.types.braceL);
  while (!this.eat(_tokentype.types.braceR)) {
    if (!first) {
      this.expect(_tokentype.types.comma);
      if (this.afterTrailingComma(_tokentype.types.braceR)) break;
    } else first = false;

    var node = this.startNode();
    node.imported = this.parseIdent(true);
    if (this.eatContextual("as")) {
      node.local = this.parseIdent();
    } else {
      node.local = node.imported;
      if (this.isKeyword(node.local.name)) this.unexpected(node.local.start);
      if (this.reservedWordsStrict.test(node.local.name)) this.raise(node.local.start, "The keyword '" + node.local.name + "' is reserved");
    }
    this.checkLVal(node.local, true);
    nodes.push(this.finishNode(node, "ImportSpecifier"));
  }
  return nodes;
};

},{"./state":10,"./tokentype":14,"./whitespace":16}],12:[function(_dereq_,module,exports){
// The algorithm used to determine whether a regexp can appear at a
// given point in the program is loosely based on sweet.js' approach.
// See https://github.com/mozilla/sweet.js/wiki/design

"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _state = _dereq_("./state");

var _tokentype = _dereq_("./tokentype");

var _whitespace = _dereq_("./whitespace");

var TokContext = function TokContext(token, isExpr, preserveSpace, override) {
  _classCallCheck(this, TokContext);

  this.token = token;
  this.isExpr = !!isExpr;
  this.preserveSpace = !!preserveSpace;
  this.override = override;
};

exports.TokContext = TokContext;
var types = {
  b_stat: new TokContext("{", false),
  b_expr: new TokContext("{", true),
  b_tmpl: new TokContext("${", true),
  p_stat: new TokContext("(", false),
  p_expr: new TokContext("(", true),
  q_tmpl: new TokContext("`", true, true, function (p) {
    return p.readTmplToken();
  }),
  f_expr: new TokContext("function", true)
};

exports.types = types;
var pp = _state.Parser.prototype;

pp.initialContext = function () {
  return [types.b_stat];
};

pp.braceIsBlock = function (prevType) {
  if (prevType === _tokentype.types.colon) {
    var _parent = this.curContext();
    if (_parent === types.b_stat || _parent === types.b_expr) return !_parent.isExpr;
  }
  if (prevType === _tokentype.types._return) return _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.start));
  if (prevType === _tokentype.types._else || prevType === _tokentype.types.semi || prevType === _tokentype.types.eof || prevType === _tokentype.types.parenR) return true;
  if (prevType == _tokentype.types.braceL) return this.curContext() === types.b_stat;
  return !this.exprAllowed;
};

pp.updateContext = function (prevType) {
  var update = undefined,
      type = this.type;
  if (type.keyword && prevType == _tokentype.types.dot) this.exprAllowed = false;else if (update = type.updateContext) update.call(this, prevType);else this.exprAllowed = type.beforeExpr;
};

// Token-specific context update code

_tokentype.types.parenR.updateContext = _tokentype.types.braceR.updateContext = function () {
  if (this.context.length == 1) {
    this.exprAllowed = true;
    return;
  }
  var out = this.context.pop();
  if (out === types.b_stat && this.curContext() === types.f_expr) {
    this.context.pop();
    this.exprAllowed = false;
  } else if (out === types.b_tmpl) {
    this.exprAllowed = true;
  } else {
    this.exprAllowed = !out.isExpr;
  }
};

_tokentype.types.braceL.updateContext = function (prevType) {
  this.context.push(this.braceIsBlock(prevType) ? types.b_stat : types.b_expr);
  this.exprAllowed = true;
};

_tokentype.types.dollarBraceL.updateContext = function () {
  this.context.push(types.b_tmpl);
  this.exprAllowed = true;
};

_tokentype.types.parenL.updateContext = function (prevType) {
  var statementParens = prevType === _tokentype.types._if || prevType === _tokentype.types._for || prevType === _tokentype.types._with || prevType === _tokentype.types._while;
  this.context.push(statementParens ? types.p_stat : types.p_expr);
  this.exprAllowed = true;
};

_tokentype.types.incDec.updateContext = function () {
  // tokExprAllowed stays unchanged
};

_tokentype.types._function.updateContext = function () {
  if (this.curContext() !== types.b_stat) this.context.push(types.f_expr);
  this.exprAllowed = false;
};

_tokentype.types.backQuote.updateContext = function () {
  if (this.curContext() === types.q_tmpl) this.context.pop();else this.context.push(types.q_tmpl);
  this.exprAllowed = false;
};

},{"./state":10,"./tokentype":14,"./whitespace":16}],13:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _identifier = _dereq_("./identifier");

var _tokentype = _dereq_("./tokentype");

var _state = _dereq_("./state");

var _locutil = _dereq_("./locutil");

var _whitespace = _dereq_("./whitespace");

// Object type used to represent tokens. Note that normally, tokens
// simply exist as properties on the parser object. This is only
// used for the onToken callback and the external tokenizer.

var Token = function Token(p) {
  _classCallCheck(this, Token);

  this.type = p.type;
  this.value = p.value;
  this.start = p.start;
  this.end = p.end;
  if (p.options.locations) this.loc = new _locutil.SourceLocation(p, p.startLoc, p.endLoc);
  if (p.options.ranges) this.range = [p.start, p.end];
}

// ## Tokenizer

;

exports.Token = Token;
var pp = _state.Parser.prototype;

// Are we running under Rhino?
var isRhino = typeof Packages == "object" && Object.prototype.toString.call(Packages) == "[object JavaPackage]";

// Move to the next token

pp.next = function () {
  if (this.options.onToken) this.options.onToken(new Token(this));

  this.lastTokEnd = this.end;
  this.lastTokStart = this.start;
  this.lastTokEndLoc = this.endLoc;
  this.lastTokStartLoc = this.startLoc;
  this.nextToken();
};

pp.getToken = function () {
  this.next();
  return new Token(this);
};

// If we're in an ES6 environment, make parsers iterable
if (typeof Symbol !== "undefined") pp[Symbol.iterator] = function () {
  var self = this;
  return { next: function next() {
      var token = self.getToken();
      return {
        done: token.type === _tokentype.types.eof,
        value: token
      };
    } };
};

// Toggle strict mode. Re-reads the next number or string to please
// pedantic tests (`"use strict"; 010;` should fail).

pp.setStrict = function (strict) {
  this.strict = strict;
  if (this.type !== _tokentype.types.num && this.type !== _tokentype.types.string) return;
  this.pos = this.start;
  if (this.options.locations) {
    while (this.pos < this.lineStart) {
      this.lineStart = this.input.lastIndexOf("\n", this.lineStart - 2) + 1;
      --this.curLine;
    }
  }
  this.nextToken();
};

pp.curContext = function () {
  return this.context[this.context.length - 1];
};

// Read a single token, updating the parser object's token-related
// properties.

pp.nextToken = function () {
  var curContext = this.curContext();
  if (!curContext || !curContext.preserveSpace) this.skipSpace();

  this.start = this.pos;
  if (this.options.locations) this.startLoc = this.curPosition();
  if (this.pos >= this.input.length) return this.finishToken(_tokentype.types.eof);

  if (curContext.override) return curContext.override(this);else this.readToken(this.fullCharCodeAtPos());
};

pp.readToken = function (code) {
  // Identifier or keyword. '\uXXXX' sequences are allowed in
  // identifiers, so '\' also dispatches to that.
  if (_identifier.isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */) return this.readWord();

  return this.getTokenFromCode(code);
};

pp.fullCharCodeAtPos = function () {
  var code = this.input.charCodeAt(this.pos);
  if (code <= 0xd7ff || code >= 0xe000) return code;
  var next = this.input.charCodeAt(this.pos + 1);
  return (code << 10) + next - 0x35fdc00;
};

pp.skipBlockComment = function () {
  var startLoc = this.options.onComment && this.curPosition();
  var start = this.pos,
      end = this.input.indexOf("*/", this.pos += 2);
  if (end === -1) this.raise(this.pos - 2, "Unterminated comment");
  this.pos = end + 2;
  if (this.options.locations) {
    _whitespace.lineBreakG.lastIndex = start;
    var match = undefined;
    while ((match = _whitespace.lineBreakG.exec(this.input)) && match.index < this.pos) {
      ++this.curLine;
      this.lineStart = match.index + match[0].length;
    }
  }
  if (this.options.onComment) this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos, startLoc, this.curPosition());
};

pp.skipLineComment = function (startSkip) {
  var start = this.pos;
  var startLoc = this.options.onComment && this.curPosition();
  var ch = this.input.charCodeAt(this.pos += startSkip);
  while (this.pos < this.input.length && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8233) {
    ++this.pos;
    ch = this.input.charCodeAt(this.pos);
  }
  if (this.options.onComment) this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos, startLoc, this.curPosition());
};

// Called at the start of the parse and after every token. Skips
// whitespace and comments, and.

pp.skipSpace = function () {
  loop: while (this.pos < this.input.length) {
    var ch = this.input.charCodeAt(this.pos);
    switch (ch) {
      case 32:case 160:
        // ' '
        ++this.pos;
        break;
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10:case 8232:case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break;
      case 47:
        // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
          case 42:
            // '*'
            this.skipBlockComment();
            break;
          case 47:
            this.skipLineComment(2);
            break;
          default:
            break loop;
        }
        break;
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && _whitespace.nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop;
        }
    }
  }
};

// Called at the end of every token. Sets `end`, `val`, and
// maintains `context` and `exprAllowed`, and skips the space after
// the token, so that the next one's `start` will point at the
// right position.

pp.finishToken = function (type, val) {
  this.end = this.pos;
  if (this.options.locations) this.endLoc = this.curPosition();
  var prevType = this.type;
  this.type = type;
  this.value = val;

  this.updateContext(prevType);
};

// ### Token reading

// This is the function that is called to fetch the next token. It
// is somewhat obscure, because it works in character codes rather
// than characters, and because operator parsing has been inlined
// into it.
//
// All in the name of speed.
//
pp.readToken_dot = function () {
  var next = this.input.charCodeAt(this.pos + 1);
  if (next >= 48 && next <= 57) return this.readNumber(true);
  var next2 = this.input.charCodeAt(this.pos + 2);
  if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) {
    // 46 = dot '.'
    this.pos += 3;
    return this.finishToken(_tokentype.types.ellipsis);
  } else {
    ++this.pos;
    return this.finishToken(_tokentype.types.dot);
  }
};

pp.readToken_slash = function () {
  // '/'
  var next = this.input.charCodeAt(this.pos + 1);
  if (this.exprAllowed) {
    ++this.pos;return this.readRegexp();
  }
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.slash, 1);
};

pp.readToken_mult_modulo = function (code) {
  // '%*'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(code === 42 ? _tokentype.types.star : _tokentype.types.modulo, 1);
};

pp.readToken_pipe_amp = function (code) {
  // '|&'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) return this.finishOp(code === 124 ? _tokentype.types.logicalOR : _tokentype.types.logicalAND, 2);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(code === 124 ? _tokentype.types.bitwiseOR : _tokentype.types.bitwiseAND, 1);
};

pp.readToken_caret = function () {
  // '^'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.bitwiseXOR, 1);
};

pp.readToken_plus_min = function (code) {
  // '+-'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === code) {
    if (next == 45 && this.input.charCodeAt(this.pos + 2) == 62 && _whitespace.lineBreak.test(this.input.slice(this.lastTokEnd, this.pos))) {
      // A `-->` line comment
      this.skipLineComment(3);
      this.skipSpace();
      return this.nextToken();
    }
    return this.finishOp(_tokentype.types.incDec, 2);
  }
  if (next === 61) return this.finishOp(_tokentype.types.assign, 2);
  return this.finishOp(_tokentype.types.plusMin, 1);
};

pp.readToken_lt_gt = function (code) {
  // '<>'
  var next = this.input.charCodeAt(this.pos + 1);
  var size = 1;
  if (next === code) {
    size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
    if (this.input.charCodeAt(this.pos + size) === 61) return this.finishOp(_tokentype.types.assign, size + 1);
    return this.finishOp(_tokentype.types.bitShift, size);
  }
  if (next == 33 && code == 60 && this.input.charCodeAt(this.pos + 2) == 45 && this.input.charCodeAt(this.pos + 3) == 45) {
    if (this.inModule) this.unexpected();
    // `<!--`, an XML-style comment that should be interpreted as a line comment
    this.skipLineComment(4);
    this.skipSpace();
    return this.nextToken();
  }
  if (next === 61) size = this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2;
  return this.finishOp(_tokentype.types.relational, size);
};

pp.readToken_eq_excl = function (code) {
  // '=!'
  var next = this.input.charCodeAt(this.pos + 1);
  if (next === 61) return this.finishOp(_tokentype.types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2);
  if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) {
    // '=>'
    this.pos += 2;
    return this.finishToken(_tokentype.types.arrow);
  }
  return this.finishOp(code === 61 ? _tokentype.types.eq : _tokentype.types.prefix, 1);
};

pp.getTokenFromCode = function (code) {
  switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46:
      // '.'
      return this.readToken_dot();

    // Punctuation tokens.
    case 40:
      ++this.pos;return this.finishToken(_tokentype.types.parenL);
    case 41:
      ++this.pos;return this.finishToken(_tokentype.types.parenR);
    case 59:
      ++this.pos;return this.finishToken(_tokentype.types.semi);
    case 44:
      ++this.pos;return this.finishToken(_tokentype.types.comma);
    case 91:
      ++this.pos;return this.finishToken(_tokentype.types.bracketL);
    case 93:
      ++this.pos;return this.finishToken(_tokentype.types.bracketR);
    case 123:
      ++this.pos;return this.finishToken(_tokentype.types.braceL);
    case 125:
      ++this.pos;return this.finishToken(_tokentype.types.braceR);
    case 58:
      ++this.pos;return this.finishToken(_tokentype.types.colon);
    case 63:
      ++this.pos;return this.finishToken(_tokentype.types.question);

    case 96:
      // '`'
      if (this.options.ecmaVersion < 6) break;
      ++this.pos;
      return this.finishToken(_tokentype.types.backQuote);

    case 48:
      // '0'
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) return this.readRadixNumber(16); // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) return this.readRadixNumber(8); // '0o', '0O' - octal number
        if (next === 98 || next === 66) return this.readRadixNumber(2); // '0b', '0B' - binary number
      }
    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49:case 50:case 51:case 52:case 53:case 54:case 55:case 56:case 57:
      // 1-9
      return this.readNumber(false);

    // Quotes produce strings.
    case 34:case 39:
      // '"', "'"
      return this.readString(code);

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47:
      // '/'
      return this.readToken_slash();

    case 37:case 42:
      // '%*'
      return this.readToken_mult_modulo(code);

    case 124:case 38:
      // '|&'
      return this.readToken_pipe_amp(code);

    case 94:
      // '^'
      return this.readToken_caret();

    case 43:case 45:
      // '+-'
      return this.readToken_plus_min(code);

    case 60:case 62:
      // '<>'
      return this.readToken_lt_gt(code);

    case 61:case 33:
      // '=!'
      return this.readToken_eq_excl(code);

    case 126:
      // '~'
      return this.finishOp(_tokentype.types.prefix, 1);
  }

  this.raise(this.pos, "Unexpected character '" + codePointToString(code) + "'");
};

pp.finishOp = function (type, size) {
  var str = this.input.slice(this.pos, this.pos + size);
  this.pos += size;
  return this.finishToken(type, str);
};

// Parse a regular expression. Some context-awareness is necessary,
// since a '/' inside a '[]' set does not end the expression.

function tryCreateRegexp(src, flags, throwErrorAt, parser) {
  try {
    return new RegExp(src, flags);
  } catch (e) {
    if (throwErrorAt !== undefined) {
      if (e instanceof SyntaxError) parser.raise(throwErrorAt, "Error parsing regular expression: " + e.message);
      throw e;
    }
  }
}

var regexpUnicodeSupport = !!tryCreateRegexp("￿", "u");

pp.readRegexp = function () {
  var _this = this;

  var escaped = undefined,
      inClass = undefined,
      start = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(start, "Unterminated regular expression");
    var ch = this.input.charAt(this.pos);
    if (_whitespace.lineBreak.test(ch)) this.raise(start, "Unterminated regular expression");
    if (!escaped) {
      if (ch === "[") inClass = true;else if (ch === "]" && inClass) inClass = false;else if (ch === "/" && !inClass) break;
      escaped = ch === "\\";
    } else escaped = false;
    ++this.pos;
  }
  var content = this.input.slice(start, this.pos);
  ++this.pos;
  // Need to use `readWord1` because '\uXXXX' sequences are allowed
  // here (don't ask).
  var mods = this.readWord1();
  var tmp = content;
  if (mods) {
    var validFlags = /^[gim]*$/;
    if (this.options.ecmaVersion >= 6) validFlags = /^[gimuy]*$/;
    if (!validFlags.test(mods)) this.raise(start, "Invalid regular expression flag");
    if (mods.indexOf('u') >= 0 && !regexpUnicodeSupport) {
      // Replace each astral symbol and every Unicode escape sequence that
      // possibly represents an astral symbol or a paired surrogate with a
      // single ASCII symbol to avoid throwing on regular expressions that
      // are only valid in combination with the `/u` flag.
      // Note: replacing with the ASCII symbol `x` might cause false
      // negatives in unlikely scenarios. For example, `[\u{61}-b]` is a
      // perfectly valid pattern that is equivalent to `[a-b]`, but it would
      // be replaced by `[x-b]` which throws an error.
      tmp = tmp.replace(/\\u\{([0-9a-fA-F]+)\}/g, function (_match, code, offset) {
        code = Number("0x" + code);
        if (code > 0x10FFFF) _this.raise(start + offset + 3, "Code point out of bounds");
        return "x";
      });
      tmp = tmp.replace(/\\u([a-fA-F0-9]{4})|[\uD800-\uDBFF][\uDC00-\uDFFF]/g, "x");
    }
  }
  // Detect invalid regular expressions.
  var value = null;
  // Rhino's regular expression parser is flaky and throws uncatchable exceptions,
  // so don't do detection if we are running under Rhino
  if (!isRhino) {
    tryCreateRegexp(tmp, undefined, start, this);
    // Get a regular expression object for this pattern-flag pair, or `null` in
    // case the current environment doesn't support the flags it uses.
    value = tryCreateRegexp(content, mods);
  }
  return this.finishToken(_tokentype.types.regexp, { pattern: content, flags: mods, value: value });
};

// Read an integer in the given radix. Return null if zero digits
// were read, the integer value otherwise. When `len` is given, this
// will return `null` unless the integer has exactly `len` digits.

pp.readInt = function (radix, len) {
  var start = this.pos,
      total = 0;
  for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
    var code = this.input.charCodeAt(this.pos),
        val = undefined;
    if (code >= 97) val = code - 97 + 10; // a
    else if (code >= 65) val = code - 65 + 10; // A
      else if (code >= 48 && code <= 57) val = code - 48; // 0-9
        else val = Infinity;
    if (val >= radix) break;
    ++this.pos;
    total = total * radix + val;
  }
  if (this.pos === start || len != null && this.pos - start !== len) return null;

  return total;
};

pp.readRadixNumber = function (radix) {
  this.pos += 2; // 0x
  var val = this.readInt(radix);
  if (val == null) this.raise(this.start + 2, "Expected number in radix " + radix);
  if (_identifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");
  return this.finishToken(_tokentype.types.num, val);
};

// Read an integer, octal integer, or floating-point number.

pp.readNumber = function (startsWithDot) {
  var start = this.pos,
      isFloat = false,
      octal = this.input.charCodeAt(this.pos) === 48;
  if (!startsWithDot && this.readInt(10) === null) this.raise(start, "Invalid number");
  var next = this.input.charCodeAt(this.pos);
  if (next === 46) {
    // '.'
    ++this.pos;
    this.readInt(10);
    isFloat = true;
    next = this.input.charCodeAt(this.pos);
  }
  if (next === 69 || next === 101) {
    // 'eE'
    next = this.input.charCodeAt(++this.pos);
    if (next === 43 || next === 45) ++this.pos; // '+-'
    if (this.readInt(10) === null) this.raise(start, "Invalid number");
    isFloat = true;
  }
  if (_identifier.isIdentifierStart(this.fullCharCodeAtPos())) this.raise(this.pos, "Identifier directly after number");

  var str = this.input.slice(start, this.pos),
      val = undefined;
  if (isFloat) val = parseFloat(str);else if (!octal || str.length === 1) val = parseInt(str, 10);else if (/[89]/.test(str) || this.strict) this.raise(start, "Invalid number");else val = parseInt(str, 8);
  return this.finishToken(_tokentype.types.num, val);
};

// Read a string value, interpreting backslash-escapes.

pp.readCodePoint = function () {
  var ch = this.input.charCodeAt(this.pos),
      code = undefined;

  if (ch === 123) {
    if (this.options.ecmaVersion < 6) this.unexpected();
    var codePos = ++this.pos;
    code = this.readHexChar(this.input.indexOf('}', this.pos) - this.pos);
    ++this.pos;
    if (code > 0x10FFFF) this.raise(codePos, "Code point out of bounds");
  } else {
    code = this.readHexChar(4);
  }
  return code;
};

function codePointToString(code) {
  // UTF-16 Decoding
  if (code <= 0xFFFF) return String.fromCharCode(code);
  code -= 0x10000;
  return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00);
}

pp.readString = function (quote) {
  var out = "",
      chunkStart = ++this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(this.start, "Unterminated string constant");
    var ch = this.input.charCodeAt(this.pos);
    if (ch === quote) break;
    if (ch === 92) {
      // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(false);
      chunkStart = this.pos;
    } else {
      if (_whitespace.isNewLine(ch)) this.raise(this.start, "Unterminated string constant");
      ++this.pos;
    }
  }
  out += this.input.slice(chunkStart, this.pos++);
  return this.finishToken(_tokentype.types.string, out);
};

// Reads template string tokens.

pp.readTmplToken = function () {
  var out = "",
      chunkStart = this.pos;
  for (;;) {
    if (this.pos >= this.input.length) this.raise(this.start, "Unterminated template");
    var ch = this.input.charCodeAt(this.pos);
    if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) {
      // '`', '${'
      if (this.pos === this.start && this.type === _tokentype.types.template) {
        if (ch === 36) {
          this.pos += 2;
          return this.finishToken(_tokentype.types.dollarBraceL);
        } else {
          ++this.pos;
          return this.finishToken(_tokentype.types.backQuote);
        }
      }
      out += this.input.slice(chunkStart, this.pos);
      return this.finishToken(_tokentype.types.template, out);
    }
    if (ch === 92) {
      // '\'
      out += this.input.slice(chunkStart, this.pos);
      out += this.readEscapedChar(true);
      chunkStart = this.pos;
    } else if (_whitespace.isNewLine(ch)) {
      out += this.input.slice(chunkStart, this.pos);
      ++this.pos;
      switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) ++this.pos;
        case 10:
          out += "\n";
          break;
        default:
          out += String.fromCharCode(ch);
          break;
      }
      if (this.options.locations) {
        ++this.curLine;
        this.lineStart = this.pos;
      }
      chunkStart = this.pos;
    } else {
      ++this.pos;
    }
  }
};

// Used to read escaped characters

pp.readEscapedChar = function (inTemplate) {
  var ch = this.input.charCodeAt(++this.pos);
  ++this.pos;
  switch (ch) {
    case 110:
      return "\n"; // 'n' -> '\n'
    case 114:
      return "\r"; // 'r' -> '\r'
    case 120:
      return String.fromCharCode(this.readHexChar(2)); // 'x'
    case 117:
      return codePointToString(this.readCodePoint()); // 'u'
    case 116:
      return "\t"; // 't' -> '\t'
    case 98:
      return "\b"; // 'b' -> '\b'
    case 118:
      return "\u000b"; // 'v' -> '\u000b'
    case 102:
      return "\f"; // 'f' -> '\f'
    case 13:
      if (this.input.charCodeAt(this.pos) === 10) ++this.pos; // '\r\n'
    case 10:
      // ' \n'
      if (this.options.locations) {
        this.lineStart = this.pos;++this.curLine;
      }
      return "";
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        if (octalStr !== "0" && (this.strict || inTemplate)) {
          this.raise(this.pos - 2, "Octal literal in strict mode");
        }
        this.pos += octalStr.length - 1;
        return String.fromCharCode(octal);
      }
      return String.fromCharCode(ch);
  }
};

// Used to read character escape sequences ('\x', '\u', '\U').

pp.readHexChar = function (len) {
  var codePos = this.pos;
  var n = this.readInt(16, len);
  if (n === null) this.raise(codePos, "Bad character escape sequence");
  return n;
};

// Read an identifier, and return it as a string. Sets `this.containsEsc`
// to whether the word contained a '\u' escape.
//
// Incrementally adds only escaped chars, adding other chunks as-is
// as a micro-optimization.

pp.readWord1 = function () {
  this.containsEsc = false;
  var word = "",
      first = true,
      chunkStart = this.pos;
  var astral = this.options.ecmaVersion >= 6;
  while (this.pos < this.input.length) {
    var ch = this.fullCharCodeAtPos();
    if (_identifier.isIdentifierChar(ch, astral)) {
      this.pos += ch <= 0xffff ? 1 : 2;
    } else if (ch === 92) {
      // "\"
      this.containsEsc = true;
      word += this.input.slice(chunkStart, this.pos);
      var escStart = this.pos;
      if (this.input.charCodeAt(++this.pos) != 117) // "u"
        this.raise(this.pos, "Expecting Unicode escape sequence \\uXXXX");
      ++this.pos;
      var esc = this.readCodePoint();
      if (!(first ? _identifier.isIdentifierStart : _identifier.isIdentifierChar)(esc, astral)) this.raise(escStart, "Invalid Unicode escape");
      word += codePointToString(esc);
      chunkStart = this.pos;
    } else {
      break;
    }
    first = false;
  }
  return word + this.input.slice(chunkStart, this.pos);
};

// Read an identifier or keyword token. Will check for reserved
// words when necessary.

pp.readWord = function () {
  var word = this.readWord1();
  var type = _tokentype.types.name;
  if ((this.options.ecmaVersion >= 6 || !this.containsEsc) && this.keywords.test(word)) type = _tokentype.keywords[word];
  return this.finishToken(type, word);
};

},{"./identifier":2,"./locutil":5,"./state":10,"./tokentype":14,"./whitespace":16}],14:[function(_dereq_,module,exports){
// ## Token types

// The assignment of fine-grained, information-carrying type objects
// allows the tokenizer to store the information it has about a
// token in a way that is very cheap for the parser to look up.

// All token type variables start with an underscore, to make them
// easy to recognize.

// The `beforeExpr` property is used to disambiguate between regular
// expressions and divisions. It is set on all token types that can
// be followed by an expression (thus, a slash after them would be a
// regular expression).
//
// The `startsExpr` property is used to check if the token ends a
// `yield` expression. It is set on all token types that either can
// directly start an expression (like a quotation mark) or can
// continue an expression (like the body of a string).
//
// `isLoop` marks a keyword as starting a loop, which is important
// to know when parsing a label, in order to allow or disallow
// continue jumps to that label.

"use strict";

exports.__esModule = true;

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TokenType = function TokenType(label) {
  var conf = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  _classCallCheck(this, TokenType);

  this.label = label;
  this.keyword = conf.keyword;
  this.beforeExpr = !!conf.beforeExpr;
  this.startsExpr = !!conf.startsExpr;
  this.isLoop = !!conf.isLoop;
  this.isAssign = !!conf.isAssign;
  this.prefix = !!conf.prefix;
  this.postfix = !!conf.postfix;
  this.binop = conf.binop || null;
  this.updateContext = null;
};

exports.TokenType = TokenType;

function binop(name, prec) {
  return new TokenType(name, { beforeExpr: true, binop: prec });
}
var beforeExpr = { beforeExpr: true },
    startsExpr = { startsExpr: true };

var types = {
  num: new TokenType("num", startsExpr),
  regexp: new TokenType("regexp", startsExpr),
  string: new TokenType("string", startsExpr),
  name: new TokenType("name", startsExpr),
  eof: new TokenType("eof"),

  // Punctuation token types.
  bracketL: new TokenType("[", { beforeExpr: true, startsExpr: true }),
  bracketR: new TokenType("]"),
  braceL: new TokenType("{", { beforeExpr: true, startsExpr: true }),
  braceR: new TokenType("}"),
  parenL: new TokenType("(", { beforeExpr: true, startsExpr: true }),
  parenR: new TokenType(")"),
  comma: new TokenType(",", beforeExpr),
  semi: new TokenType(";", beforeExpr),
  colon: new TokenType(":", beforeExpr),
  dot: new TokenType("."),
  question: new TokenType("?", beforeExpr),
  arrow: new TokenType("=>", beforeExpr),
  template: new TokenType("template"),
  ellipsis: new TokenType("...", beforeExpr),
  backQuote: new TokenType("`", startsExpr),
  dollarBraceL: new TokenType("${", { beforeExpr: true, startsExpr: true }),

  // Operators. These carry several kinds of properties to help the
  // parser use them properly (the presence of these properties is
  // what categorizes them as operators).
  //
  // `binop`, when present, specifies that this operator is a binary
  // operator, and will refer to its precedence.
  //
  // `prefix` and `postfix` mark the operator as a prefix or postfix
  // unary operator.
  //
  // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
  // binary operators with a very low precedence, that should result
  // in AssignmentExpression nodes.

  eq: new TokenType("=", { beforeExpr: true, isAssign: true }),
  assign: new TokenType("_=", { beforeExpr: true, isAssign: true }),
  incDec: new TokenType("++/--", { prefix: true, postfix: true, startsExpr: true }),
  prefix: new TokenType("prefix", { beforeExpr: true, prefix: true, startsExpr: true }),
  logicalOR: binop("||", 1),
  logicalAND: binop("&&", 2),
  bitwiseOR: binop("|", 3),
  bitwiseXOR: binop("^", 4),
  bitwiseAND: binop("&", 5),
  equality: binop("==/!=", 6),
  relational: binop("</>", 7),
  bitShift: binop("<</>>", 8),
  plusMin: new TokenType("+/-", { beforeExpr: true, binop: 9, prefix: true, startsExpr: true }),
  modulo: binop("%", 10),
  star: binop("*", 10),
  slash: binop("/", 10)
};

exports.types = types;
// Map keyword names to token types.

var keywords = {};

exports.keywords = keywords;
// Succinct definitions of keyword token types
function kw(name) {
  var options = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

  options.keyword = name;
  keywords[name] = types["_" + name] = new TokenType(name, options);
}

kw("break");
kw("case", beforeExpr);
kw("catch");
kw("continue");
kw("debugger");
kw("default", beforeExpr);
kw("do", { isLoop: true, beforeExpr: true });
kw("else", beforeExpr);
kw("finally");
kw("for", { isLoop: true });
kw("function", startsExpr);
kw("if");
kw("return", beforeExpr);
kw("switch");
kw("throw", beforeExpr);
kw("try");
kw("var");
kw("let");
kw("const");
kw("while", { isLoop: true });
kw("with");
kw("new", { beforeExpr: true, startsExpr: true });
kw("this", startsExpr);
kw("super", startsExpr);
kw("class");
kw("extends", beforeExpr);
kw("export");
kw("import");
kw("yield", { beforeExpr: true, startsExpr: true });
kw("null", startsExpr);
kw("true", startsExpr);
kw("false", startsExpr);
kw("in", { beforeExpr: true, binop: 7 });
kw("instanceof", { beforeExpr: true, binop: 7 });
kw("typeof", { beforeExpr: true, prefix: true, startsExpr: true });
kw("void", { beforeExpr: true, prefix: true, startsExpr: true });
kw("delete", { beforeExpr: true, prefix: true, startsExpr: true });

},{}],15:[function(_dereq_,module,exports){
"use strict";

exports.__esModule = true;
exports.isArray = isArray;
exports.has = has;

function isArray(obj) {
  return Object.prototype.toString.call(obj) === "[object Array]";
}

// Checks if an object has a property.

function has(obj, propName) {
  return Object.prototype.hasOwnProperty.call(obj, propName);
}

},{}],16:[function(_dereq_,module,exports){
// Matches a whole line break (where CRLF is considered a single
// line break). Used to count lines.

"use strict";

exports.__esModule = true;
exports.isNewLine = isNewLine;
var lineBreak = /\r\n?|\n|\u2028|\u2029/;
exports.lineBreak = lineBreak;
var lineBreakG = new RegExp(lineBreak.source, "g");

exports.lineBreakG = lineBreakG;

function isNewLine(code) {
  return code === 10 || code === 13 || code === 0x2028 || code == 0x2029;
}

var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u202f\u205f\u3000\ufeff]/;
exports.nonASCIIwhitespace = nonASCIIwhitespace;

},{}]},{},[3])(3)
});
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
(function (process,global){
/*!
 * async
 * https://github.com/caolan/async
 *
 * Copyright 2010-2014 Caolan McMahon
 * Released under the MIT license
 */
(function () {

    var async = {};
    function noop() {}
    function identity(v) {
        return v;
    }
    function toBool(v) {
        return !!v;
    }
    function notId(v) {
        return !v;
    }

    // global on the server, window in the browser
    var previous_async;

    // Establish the root object, `window` (`self`) in the browser, `global`
    // on the server, or `this` in some virtual machines. We use `self`
    // instead of `window` for `WebWorker` support.
    var root = typeof self === 'object' && self.self === self && self ||
            typeof global === 'object' && global.global === global && global ||
            this;

    if (root != null) {
        previous_async = root.async;
    }

    async.noConflict = function () {
        root.async = previous_async;
        return async;
    };

    function only_once(fn) {
        return function() {
            if (fn === null) throw new Error("Callback was already called.");
            fn.apply(this, arguments);
            fn = null;
        };
    }

    function _once(fn) {
        return function() {
            if (fn === null) return;
            fn.apply(this, arguments);
            fn = null;
        };
    }

    //// cross-browser compatiblity functions ////

    var _toString = Object.prototype.toString;

    var _isArray = Array.isArray || function (obj) {
        return _toString.call(obj) === '[object Array]';
    };

    // Ported from underscore.js isObject
    var _isObject = function(obj) {
        var type = typeof obj;
        return type === 'function' || type === 'object' && !!obj;
    };

    function _isArrayLike(arr) {
        return _isArray(arr) || (
            // has a positive integer length property
            typeof arr.length === "number" &&
            arr.length >= 0 &&
            arr.length % 1 === 0
        );
    }

    function _arrayEach(arr, iterator) {
        var index = -1,
            length = arr.length;

        while (++index < length) {
            iterator(arr[index], index, arr);
        }
    }

    function _map(arr, iterator) {
        var index = -1,
            length = arr.length,
            result = Array(length);

        while (++index < length) {
            result[index] = iterator(arr[index], index, arr);
        }
        return result;
    }

    function _range(count) {
        return _map(Array(count), function (v, i) { return i; });
    }

    function _reduce(arr, iterator, memo) {
        _arrayEach(arr, function (x, i, a) {
            memo = iterator(memo, x, i, a);
        });
        return memo;
    }

    function _forEachOf(object, iterator) {
        _arrayEach(_keys(object), function (key) {
            iterator(object[key], key);
        });
    }

    function _indexOf(arr, item) {
        for (var i = 0; i < arr.length; i++) {
            if (arr[i] === item) return i;
        }
        return -1;
    }

    var _keys = Object.keys || function (obj) {
        var keys = [];
        for (var k in obj) {
            if (obj.hasOwnProperty(k)) {
                keys.push(k);
            }
        }
        return keys;
    };

    function _keyIterator(coll) {
        var i = -1;
        var len;
        var keys;
        if (_isArrayLike(coll)) {
            len = coll.length;
            return function next() {
                i++;
                return i < len ? i : null;
            };
        } else {
            keys = _keys(coll);
            len = keys.length;
            return function next() {
                i++;
                return i < len ? keys[i] : null;
            };
        }
    }

    // Similar to ES6's rest param (http://ariya.ofilabs.com/2013/03/es6-and-rest-parameter.html)
    // This accumulates the arguments passed into an array, after a given index.
    // From underscore.js (https://github.com/jashkenas/underscore/pull/2140).
    function _restParam(func, startIndex) {
        startIndex = startIndex == null ? func.length - 1 : +startIndex;
        return function() {
            var length = Math.max(arguments.length - startIndex, 0);
            var rest = Array(length);
            for (var index = 0; index < length; index++) {
                rest[index] = arguments[index + startIndex];
            }
            switch (startIndex) {
                case 0: return func.call(this, rest);
                case 1: return func.call(this, arguments[0], rest);
            }
            // Currently unused but handle cases outside of the switch statement:
            // var args = Array(startIndex + 1);
            // for (index = 0; index < startIndex; index++) {
            //     args[index] = arguments[index];
            // }
            // args[startIndex] = rest;
            // return func.apply(this, args);
        };
    }

    function _withoutIndex(iterator) {
        return function (value, index, callback) {
            return iterator(value, callback);
        };
    }

    //// exported async module functions ////

    //// nextTick implementation with browser-compatible fallback ////

    // capture the global reference to guard against fakeTimer mocks
    var _setImmediate = typeof setImmediate === 'function' && setImmediate;

    var _delay = _setImmediate ? function(fn) {
        // not a direct alias for IE10 compatibility
        _setImmediate(fn);
    } : function(fn) {
        setTimeout(fn, 0);
    };

    if (typeof process === 'object' && typeof process.nextTick === 'function') {
        async.nextTick = process.nextTick;
    } else {
        async.nextTick = _delay;
    }
    async.setImmediate = _setImmediate ? _delay : async.nextTick;


    async.forEach =
    async.each = function (arr, iterator, callback) {
        return async.eachOf(arr, _withoutIndex(iterator), callback);
    };

    async.forEachSeries =
    async.eachSeries = function (arr, iterator, callback) {
        return async.eachOfSeries(arr, _withoutIndex(iterator), callback);
    };


    async.forEachLimit =
    async.eachLimit = function (arr, limit, iterator, callback) {
        return _eachOfLimit(limit)(arr, _withoutIndex(iterator), callback);
    };

    async.forEachOf =
    async.eachOf = function (object, iterator, callback) {
        callback = _once(callback || noop);
        object = object || [];

        var iter = _keyIterator(object);
        var key, completed = 0;

        while ((key = iter()) != null) {
            completed += 1;
            iterator(object[key], key, only_once(done));
        }

        if (completed === 0) callback(null);

        function done(err) {
            completed--;
            if (err) {
                callback(err);
            }
            // Check key is null in case iterator isn't exhausted
            // and done resolved synchronously.
            else if (key === null && completed <= 0) {
                callback(null);
            }
        }
    };

    async.forEachOfSeries =
    async.eachOfSeries = function (obj, iterator, callback) {
        callback = _once(callback || noop);
        obj = obj || [];
        var nextKey = _keyIterator(obj);
        var key = nextKey();
        function iterate() {
            var sync = true;
            if (key === null) {
                return callback(null);
            }
            iterator(obj[key], key, only_once(function (err) {
                if (err) {
                    callback(err);
                }
                else {
                    key = nextKey();
                    if (key === null) {
                        return callback(null);
                    } else {
                        if (sync) {
                            async.setImmediate(iterate);
                        } else {
                            iterate();
                        }
                    }
                }
            }));
            sync = false;
        }
        iterate();
    };



    async.forEachOfLimit =
    async.eachOfLimit = function (obj, limit, iterator, callback) {
        _eachOfLimit(limit)(obj, iterator, callback);
    };

    function _eachOfLimit(limit) {

        return function (obj, iterator, callback) {
            callback = _once(callback || noop);
            obj = obj || [];
            var nextKey = _keyIterator(obj);
            if (limit <= 0) {
                return callback(null);
            }
            var done = false;
            var running = 0;
            var errored = false;

            (function replenish () {
                if (done && running <= 0) {
                    return callback(null);
                }

                while (running < limit && !errored) {
                    var key = nextKey();
                    if (key === null) {
                        done = true;
                        if (running <= 0) {
                            callback(null);
                        }
                        return;
                    }
                    running += 1;
                    iterator(obj[key], key, only_once(function (err) {
                        running -= 1;
                        if (err) {
                            callback(err);
                            errored = true;
                        }
                        else {
                            replenish();
                        }
                    }));
                }
            })();
        };
    }


    function doParallel(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOf, obj, iterator, callback);
        };
    }
    function doParallelLimit(fn) {
        return function (obj, limit, iterator, callback) {
            return fn(_eachOfLimit(limit), obj, iterator, callback);
        };
    }
    function doSeries(fn) {
        return function (obj, iterator, callback) {
            return fn(async.eachOfSeries, obj, iterator, callback);
        };
    }

    function _asyncMap(eachfn, arr, iterator, callback) {
        callback = _once(callback || noop);
        arr = arr || [];
        var results = _isArrayLike(arr) ? [] : {};
        eachfn(arr, function (value, index, callback) {
            iterator(value, function (err, v) {
                results[index] = v;
                callback(err);
            });
        }, function (err) {
            callback(err, results);
        });
    }

    async.map = doParallel(_asyncMap);
    async.mapSeries = doSeries(_asyncMap);
    async.mapLimit = doParallelLimit(_asyncMap);

    // reduce only has a series version, as doing reduce in parallel won't
    // work in many situations.
    async.inject =
    async.foldl =
    async.reduce = function (arr, memo, iterator, callback) {
        async.eachOfSeries(arr, function (x, i, callback) {
            iterator(memo, x, function (err, v) {
                memo = v;
                callback(err);
            });
        }, function (err) {
            callback(err, memo);
        });
    };

    async.foldr =
    async.reduceRight = function (arr, memo, iterator, callback) {
        var reversed = _map(arr, identity).reverse();
        async.reduce(reversed, memo, iterator, callback);
    };

    async.transform = function (arr, memo, iterator, callback) {
        if (arguments.length === 3) {
            callback = iterator;
            iterator = memo;
            memo = _isArray(arr) ? [] : {};
        }

        async.eachOf(arr, function(v, k, cb) {
            iterator(memo, v, k, cb);
        }, function(err) {
            callback(err, memo);
        });
    };

    function _filter(eachfn, arr, iterator, callback) {
        var results = [];
        eachfn(arr, function (x, index, callback) {
            iterator(x, function (v) {
                if (v) {
                    results.push({index: index, value: x});
                }
                callback();
            });
        }, function () {
            callback(_map(results.sort(function (a, b) {
                return a.index - b.index;
            }), function (x) {
                return x.value;
            }));
        });
    }

    async.select =
    async.filter = doParallel(_filter);

    async.selectLimit =
    async.filterLimit = doParallelLimit(_filter);

    async.selectSeries =
    async.filterSeries = doSeries(_filter);

    function _reject(eachfn, arr, iterator, callback) {
        _filter(eachfn, arr, function(value, cb) {
            iterator(value, function(v) {
                cb(!v);
            });
        }, callback);
    }
    async.reject = doParallel(_reject);
    async.rejectLimit = doParallelLimit(_reject);
    async.rejectSeries = doSeries(_reject);

    function _createTester(eachfn, check, getResult) {
        return function(arr, limit, iterator, cb) {
            function done() {
                if (cb) cb(getResult(false, void 0));
            }
            function iteratee(x, _, callback) {
                if (!cb) return callback();
                iterator(x, function (v) {
                    if (cb && check(v)) {
                        cb(getResult(true, x));
                        cb = iterator = false;
                    }
                    callback();
                });
            }
            if (arguments.length > 3) {
                eachfn(arr, limit, iteratee, done);
            } else {
                cb = iterator;
                iterator = limit;
                eachfn(arr, iteratee, done);
            }
        };
    }

    async.any =
    async.some = _createTester(async.eachOf, toBool, identity);

    async.someLimit = _createTester(async.eachOfLimit, toBool, identity);

    async.all =
    async.every = _createTester(async.eachOf, notId, notId);

    async.everyLimit = _createTester(async.eachOfLimit, notId, notId);

    function _findGetResult(v, x) {
        return x;
    }
    async.detect = _createTester(async.eachOf, identity, _findGetResult);
    async.detectSeries = _createTester(async.eachOfSeries, identity, _findGetResult);
    async.detectLimit = _createTester(async.eachOfLimit, identity, _findGetResult);

    async.sortBy = function (arr, iterator, callback) {
        async.map(arr, function (x, callback) {
            iterator(x, function (err, criteria) {
                if (err) {
                    callback(err);
                }
                else {
                    callback(null, {value: x, criteria: criteria});
                }
            });
        }, function (err, results) {
            if (err) {
                return callback(err);
            }
            else {
                callback(null, _map(results.sort(comparator), function (x) {
                    return x.value;
                }));
            }

        });

        function comparator(left, right) {
            var a = left.criteria, b = right.criteria;
            return a < b ? -1 : a > b ? 1 : 0;
        }
    };

    async.auto = function (tasks, concurrency, callback) {
        if (typeof arguments[1] === 'function') {
            // concurrency is optional, shift the args.
            callback = concurrency;
            concurrency = null;
        }
        callback = _once(callback || noop);
        var keys = _keys(tasks);
        var remainingTasks = keys.length;
        if (!remainingTasks) {
            return callback(null);
        }
        if (!concurrency) {
            concurrency = remainingTasks;
        }

        var results = {};
        var runningTasks = 0;

        var hasError = false;

        var listeners = [];
        function addListener(fn) {
            listeners.unshift(fn);
        }
        function removeListener(fn) {
            var idx = _indexOf(listeners, fn);
            if (idx >= 0) listeners.splice(idx, 1);
        }
        function taskComplete() {
            remainingTasks--;
            _arrayEach(listeners.slice(0), function (fn) {
                fn();
            });
        }

        addListener(function () {
            if (!remainingTasks) {
                callback(null, results);
            }
        });

        _arrayEach(keys, function (k) {
            if (hasError) return;
            var task = _isArray(tasks[k]) ? tasks[k]: [tasks[k]];
            var taskCallback = _restParam(function(err, args) {
                runningTasks--;
                if (args.length <= 1) {
                    args = args[0];
                }
                if (err) {
                    var safeResults = {};
                    _forEachOf(results, function(val, rkey) {
                        safeResults[rkey] = val;
                    });
                    safeResults[k] = args;
                    hasError = true;

                    callback(err, safeResults);
                }
                else {
                    results[k] = args;
                    async.setImmediate(taskComplete);
                }
            });
            var requires = task.slice(0, task.length - 1);
            // prevent dead-locks
            var len = requires.length;
            var dep;
            while (len--) {
                if (!(dep = tasks[requires[len]])) {
                    throw new Error('Has nonexistent dependency in ' + requires.join(', '));
                }
                if (_isArray(dep) && _indexOf(dep, k) >= 0) {
                    throw new Error('Has cyclic dependencies');
                }
            }
            function ready() {
                return runningTasks < concurrency && _reduce(requires, function (a, x) {
                    return (a && results.hasOwnProperty(x));
                }, true) && !results.hasOwnProperty(k);
            }
            if (ready()) {
                runningTasks++;
                task[task.length - 1](taskCallback, results);
            }
            else {
                addListener(listener);
            }
            function listener() {
                if (ready()) {
                    runningTasks++;
                    removeListener(listener);
                    task[task.length - 1](taskCallback, results);
                }
            }
        });
    };



    async.retry = function(times, task, callback) {
        var DEFAULT_TIMES = 5;
        var DEFAULT_INTERVAL = 0;

        var attempts = [];

        var opts = {
            times: DEFAULT_TIMES,
            interval: DEFAULT_INTERVAL
        };

        function parseTimes(acc, t){
            if(typeof t === 'number'){
                acc.times = parseInt(t, 10) || DEFAULT_TIMES;
            } else if(typeof t === 'object'){
                acc.times = parseInt(t.times, 10) || DEFAULT_TIMES;
                acc.interval = parseInt(t.interval, 10) || DEFAULT_INTERVAL;
            } else {
                throw new Error('Unsupported argument type for \'times\': ' + typeof t);
            }
        }

        var length = arguments.length;
        if (length < 1 || length > 3) {
            throw new Error('Invalid arguments - must be either (task), (task, callback), (times, task) or (times, task, callback)');
        } else if (length <= 2 && typeof times === 'function') {
            callback = task;
            task = times;
        }
        if (typeof times !== 'function') {
            parseTimes(opts, times);
        }
        opts.callback = callback;
        opts.task = task;

        function wrappedTask(wrappedCallback, wrappedResults) {
            function retryAttempt(task, finalAttempt) {
                return function(seriesCallback) {
                    task(function(err, result){
                        seriesCallback(!err || finalAttempt, {err: err, result: result});
                    }, wrappedResults);
                };
            }

            function retryInterval(interval){
                return function(seriesCallback){
                    setTimeout(function(){
                        seriesCallback(null);
                    }, interval);
                };
            }

            while (opts.times) {

                var finalAttempt = !(opts.times-=1);
                attempts.push(retryAttempt(opts.task, finalAttempt));
                if(!finalAttempt && opts.interval > 0){
                    attempts.push(retryInterval(opts.interval));
                }
            }

            async.series(attempts, function(done, data){
                data = data[data.length - 1];
                (wrappedCallback || opts.callback)(data.err, data.result);
            });
        }

        // If a callback is passed, run this as a controll flow
        return opts.callback ? wrappedTask() : wrappedTask;
    };

    async.waterfall = function (tasks, callback) {
        callback = _once(callback || noop);
        if (!_isArray(tasks)) {
            var err = new Error('First argument to waterfall must be an array of functions');
            return callback(err);
        }
        if (!tasks.length) {
            return callback();
        }
        function wrapIterator(iterator) {
            return _restParam(function (err, args) {
                if (err) {
                    callback.apply(null, [err].concat(args));
                }
                else {
                    var next = iterator.next();
                    if (next) {
                        args.push(wrapIterator(next));
                    }
                    else {
                        args.push(callback);
                    }
                    ensureAsync(iterator).apply(null, args);
                }
            });
        }
        wrapIterator(async.iterator(tasks))();
    };

    function _parallel(eachfn, tasks, callback) {
        callback = callback || noop;
        var results = _isArrayLike(tasks) ? [] : {};

        eachfn(tasks, function (task, key, callback) {
            task(_restParam(function (err, args) {
                if (args.length <= 1) {
                    args = args[0];
                }
                results[key] = args;
                callback(err);
            }));
        }, function (err) {
            callback(err, results);
        });
    }

    async.parallel = function (tasks, callback) {
        _parallel(async.eachOf, tasks, callback);
    };

    async.parallelLimit = function(tasks, limit, callback) {
        _parallel(_eachOfLimit(limit), tasks, callback);
    };

    async.series = function(tasks, callback) {
        _parallel(async.eachOfSeries, tasks, callback);
    };

    async.iterator = function (tasks) {
        function makeCallback(index) {
            function fn() {
                if (tasks.length) {
                    tasks[index].apply(null, arguments);
                }
                return fn.next();
            }
            fn.next = function () {
                return (index < tasks.length - 1) ? makeCallback(index + 1): null;
            };
            return fn;
        }
        return makeCallback(0);
    };

    async.apply = _restParam(function (fn, args) {
        return _restParam(function (callArgs) {
            return fn.apply(
                null, args.concat(callArgs)
            );
        });
    });

    function _concat(eachfn, arr, fn, callback) {
        var result = [];
        eachfn(arr, function (x, index, cb) {
            fn(x, function (err, y) {
                result = result.concat(y || []);
                cb(err);
            });
        }, function (err) {
            callback(err, result);
        });
    }
    async.concat = doParallel(_concat);
    async.concatSeries = doSeries(_concat);

    async.whilst = function (test, iterator, callback) {
        callback = callback || noop;
        if (test()) {
            var next = _restParam(function(err, args) {
                if (err) {
                    callback(err);
                } else if (test.apply(this, args)) {
                    iterator(next);
                } else {
                    callback.apply(null, [null].concat(args));
                }
            });
            iterator(next);
        } else {
            callback(null);
        }
    };

    async.doWhilst = function (iterator, test, callback) {
        var calls = 0;
        return async.whilst(function() {
            return ++calls <= 1 || test.apply(this, arguments);
        }, iterator, callback);
    };

    async.until = function (test, iterator, callback) {
        return async.whilst(function() {
            return !test.apply(this, arguments);
        }, iterator, callback);
    };

    async.doUntil = function (iterator, test, callback) {
        return async.doWhilst(iterator, function() {
            return !test.apply(this, arguments);
        }, callback);
    };

    async.during = function (test, iterator, callback) {
        callback = callback || noop;

        var next = _restParam(function(err, args) {
            if (err) {
                callback(err);
            } else {
                args.push(check);
                test.apply(this, args);
            }
        });

        var check = function(err, truth) {
            if (err) {
                callback(err);
            } else if (truth) {
                iterator(next);
            } else {
                callback(null);
            }
        };

        test(check);
    };

    async.doDuring = function (iterator, test, callback) {
        var calls = 0;
        async.during(function(next) {
            if (calls++ < 1) {
                next(null, true);
            } else {
                test.apply(this, arguments);
            }
        }, iterator, callback);
    };

    function _queue(worker, concurrency, payload) {
        if (concurrency == null) {
            concurrency = 1;
        }
        else if(concurrency === 0) {
            throw new Error('Concurrency must not be zero');
        }
        function _insert(q, data, pos, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0 && q.idle()) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    callback: callback || noop
                };

                if (pos) {
                    q.tasks.unshift(item);
                } else {
                    q.tasks.push(item);
                }

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
            });
            async.setImmediate(q.process);
        }
        function _next(q, tasks) {
            return function(){
                workers -= 1;

                var removed = false;
                var args = arguments;
                _arrayEach(tasks, function (task) {
                    _arrayEach(workersList, function (worker, index) {
                        if (worker === task && !removed) {
                            workersList.splice(index, 1);
                            removed = true;
                        }
                    });

                    task.callback.apply(task, args);
                });
                if (q.tasks.length + workers === 0) {
                    q.drain();
                }
                q.process();
            };
        }

        var workers = 0;
        var workersList = [];
        var q = {
            tasks: [],
            concurrency: concurrency,
            payload: payload,
            saturated: noop,
            empty: noop,
            drain: noop,
            started: false,
            paused: false,
            push: function (data, callback) {
                _insert(q, data, false, callback);
            },
            kill: function () {
                q.drain = noop;
                q.tasks = [];
            },
            unshift: function (data, callback) {
                _insert(q, data, true, callback);
            },
            process: function () {
                while(!q.paused && workers < q.concurrency && q.tasks.length){

                    var tasks = q.payload ?
                        q.tasks.splice(0, q.payload) :
                        q.tasks.splice(0, q.tasks.length);

                    var data = _map(tasks, function (task) {
                        return task.data;
                    });

                    if (q.tasks.length === 0) {
                        q.empty();
                    }
                    workers += 1;
                    workersList.push(tasks[0]);
                    var cb = only_once(_next(q, tasks));
                    worker(data, cb);
                }
            },
            length: function () {
                return q.tasks.length;
            },
            running: function () {
                return workers;
            },
            workersList: function () {
                return workersList;
            },
            idle: function() {
                return q.tasks.length + workers === 0;
            },
            pause: function () {
                q.paused = true;
            },
            resume: function () {
                if (q.paused === false) { return; }
                q.paused = false;
                var resumeCount = Math.min(q.concurrency, q.tasks.length);
                // Need to call q.process once per concurrent
                // worker to preserve full concurrency after pause
                for (var w = 1; w <= resumeCount; w++) {
                    async.setImmediate(q.process);
                }
            }
        };
        return q;
    }

    async.queue = function (worker, concurrency) {
        var q = _queue(function (items, cb) {
            worker(items[0], cb);
        }, concurrency, 1);

        return q;
    };

    async.priorityQueue = function (worker, concurrency) {

        function _compareTasks(a, b){
            return a.priority - b.priority;
        }

        function _binarySearch(sequence, item, compare) {
            var beg = -1,
                end = sequence.length - 1;
            while (beg < end) {
                var mid = beg + ((end - beg + 1) >>> 1);
                if (compare(item, sequence[mid]) >= 0) {
                    beg = mid;
                } else {
                    end = mid - 1;
                }
            }
            return beg;
        }

        function _insert(q, data, priority, callback) {
            if (callback != null && typeof callback !== "function") {
                throw new Error("task callback must be a function");
            }
            q.started = true;
            if (!_isArray(data)) {
                data = [data];
            }
            if(data.length === 0) {
                // call drain immediately if there are no tasks
                return async.setImmediate(function() {
                    q.drain();
                });
            }
            _arrayEach(data, function(task) {
                var item = {
                    data: task,
                    priority: priority,
                    callback: typeof callback === 'function' ? callback : noop
                };

                q.tasks.splice(_binarySearch(q.tasks, item, _compareTasks) + 1, 0, item);

                if (q.tasks.length === q.concurrency) {
                    q.saturated();
                }
                async.setImmediate(q.process);
            });
        }

        // Start with a normal queue
        var q = async.queue(worker, concurrency);

        // Override push to accept second parameter representing priority
        q.push = function (data, priority, callback) {
            _insert(q, data, priority, callback);
        };

        // Remove unshift function
        delete q.unshift;

        return q;
    };

    async.cargo = function (worker, payload) {
        return _queue(worker, 1, payload);
    };

    function _console_fn(name) {
        return _restParam(function (fn, args) {
            fn.apply(null, args.concat([_restParam(function (err, args) {
                if (typeof console === 'object') {
                    if (err) {
                        if (console.error) {
                            console.error(err);
                        }
                    }
                    else if (console[name]) {
                        _arrayEach(args, function (x) {
                            console[name](x);
                        });
                    }
                }
            })]));
        });
    }
    async.log = _console_fn('log');
    async.dir = _console_fn('dir');
    /*async.info = _console_fn('info');
    async.warn = _console_fn('warn');
    async.error = _console_fn('error');*/

    async.memoize = function (fn, hasher) {
        var memo = {};
        var queues = {};
        var has = Object.prototype.hasOwnProperty;
        hasher = hasher || identity;
        var memoized = _restParam(function memoized(args) {
            var callback = args.pop();
            var key = hasher.apply(null, args);
            if (has.call(memo, key)) {   
                async.setImmediate(function () {
                    callback.apply(null, memo[key]);
                });
            }
            else if (has.call(queues, key)) {
                queues[key].push(callback);
            }
            else {
                queues[key] = [callback];
                fn.apply(null, args.concat([_restParam(function (args) {
                    memo[key] = args;
                    var q = queues[key];
                    delete queues[key];
                    for (var i = 0, l = q.length; i < l; i++) {
                        q[i].apply(null, args);
                    }
                })]));
            }
        });
        memoized.memo = memo;
        memoized.unmemoized = fn;
        return memoized;
    };

    async.unmemoize = function (fn) {
        return function () {
            return (fn.unmemoized || fn).apply(null, arguments);
        };
    };

    function _times(mapper) {
        return function (count, iterator, callback) {
            mapper(_range(count), iterator, callback);
        };
    }

    async.times = _times(async.map);
    async.timesSeries = _times(async.mapSeries);
    async.timesLimit = function (count, limit, iterator, callback) {
        return async.mapLimit(_range(count), limit, iterator, callback);
    };

    async.seq = function (/* functions... */) {
        var fns = arguments;
        return _restParam(function (args) {
            var that = this;

            var callback = args[args.length - 1];
            if (typeof callback == 'function') {
                args.pop();
            } else {
                callback = noop;
            }

            async.reduce(fns, args, function (newargs, fn, cb) {
                fn.apply(that, newargs.concat([_restParam(function (err, nextargs) {
                    cb(err, nextargs);
                })]));
            },
            function (err, results) {
                callback.apply(that, [err].concat(results));
            });
        });
    };

    async.compose = function (/* functions... */) {
        return async.seq.apply(null, Array.prototype.reverse.call(arguments));
    };


    function _applyEach(eachfn) {
        return _restParam(function(fns, args) {
            var go = _restParam(function(args) {
                var that = this;
                var callback = args.pop();
                return eachfn(fns, function (fn, _, cb) {
                    fn.apply(that, args.concat([cb]));
                },
                callback);
            });
            if (args.length) {
                return go.apply(this, args);
            }
            else {
                return go;
            }
        });
    }

    async.applyEach = _applyEach(async.eachOf);
    async.applyEachSeries = _applyEach(async.eachOfSeries);


    async.forever = function (fn, callback) {
        var done = only_once(callback || noop);
        var task = ensureAsync(fn);
        function next(err) {
            if (err) {
                return done(err);
            }
            task(next);
        }
        next();
    };

    function ensureAsync(fn) {
        return _restParam(function (args) {
            var callback = args.pop();
            args.push(function () {
                var innerArgs = arguments;
                if (sync) {
                    async.setImmediate(function () {
                        callback.apply(null, innerArgs);
                    });
                } else {
                    callback.apply(null, innerArgs);
                }
            });
            var sync = true;
            fn.apply(this, args);
            sync = false;
        });
    }

    async.ensureAsync = ensureAsync;

    async.constant = _restParam(function(values) {
        var args = [null].concat(values);
        return function (callback) {
            return callback.apply(this, args);
        };
    });

    async.wrapSync =
    async.asyncify = function asyncify(func) {
        return _restParam(function (args) {
            var callback = args.pop();
            var result;
            try {
                result = func.apply(this, args);
            } catch (e) {
                return callback(e);
            }
            // if result is Promise object
            if (_isObject(result) && typeof result.then === "function") {
                result.then(function(value) {
                    callback(null, value);
                })["catch"](function(err) {
                    callback(err.message ? err : new Error(err));
                });
            } else {
                callback(null, result);
            }
        });
    };

    // Node.js
    if (typeof module === 'object' && module.exports) {
        module.exports = async;
    }
    // AMD / RequireJS
    else if (typeof define === 'function' && define.amd) {
        define([], function () {
            return async;
        });
    }
    // included directly via <script> tag
    else {
        root.async = async;
    }

}());

}).call(this,require('_process'),typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"_process":3}],12:[function(require,module,exports){
'use strict';

var object        = require('es5-ext/object/valid-object')
  , stringifiable = require('es5-ext/object/validate-stringifiable-value')
  , forOf         = require('es6-iterator/for-of');

module.exports = function (text, style) {
	var result = '';
	text = stringifiable(text);
	object(style);
	forOf(text, function (char) { result += style[char] || char; });
	return result;
};

},{"es5-ext/object/valid-object":78,"es5-ext/object/validate-stringifiable-value":80,"es6-iterator/for-of":91}],13:[function(require,module,exports){
(function (process){
'use strict';

var d              = require('d')
  , assign         = require('es5-ext/object/assign')
  , forEach        = require('es5-ext/object/for-each')
  , map            = require('es5-ext/object/map')
  , primitiveSet   = require('es5-ext/object/primitive-set')
  , setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , memoize        = require('memoizee')
  , memoizeMethods = require('memoizee/methods')

  , sgr = require('./lib/sgr')
  , mods = sgr.mods

  , join = Array.prototype.join, defineProperty = Object.defineProperty
  , max = Math.max, min = Math.min
  , variantModes = primitiveSet('_fg', '_bg')
  , xtermMatch, getFn;

// Some use cli-color as: console.log(clc.red('Error!'));
// Which is inefficient as on each call it configures new clc object
// with memoization we reuse once created object
var memoized = memoize(function (scope, mod) {
	return defineProperty(getFn(), '_cliColorData', d(assign({}, scope._cliColorData, mod)));
});

var proto = Object.create(Function.prototype, assign(map(mods, function (mod) {
	return d.gs(function () { return memoized(this, mod); });
}), memoizeMethods({
	// xterm (255) color
	xterm: d(function (code) {
		code = isNaN(code) ? 255 : min(max(code, 0), 255);
		return defineProperty(getFn(), '_cliColorData',
			d(assign({}, this._cliColorData, {
				_fg: [xtermMatch ? xtermMatch[code] : ('38;5;' + code), 39]
			})));
	}),
	bgXterm: d(function (code) {
		code = isNaN(code) ? 255 : min(max(code, 0), 255);
		return defineProperty(getFn(), '_cliColorData',
			d(assign({}, this._cliColorData, {
				_bg: [xtermMatch ? (xtermMatch[code] + 10) : ('48;5;' + code), 49]
			})));
	})
})));

var getEndRe = memoize(function (code) {
	return new RegExp('\x1b\\[' + code + 'm', 'g');
}, { primitive: true });

if (process.platform === 'win32') xtermMatch = require('./lib/xterm-match');

getFn = function () {
	return setPrototypeOf(function self(/*…msg*/) {
		var start = '', end = '', msg = join.call(arguments, ' '), conf = self._cliColorData
		  , hasAnsi = sgr.hasCSI(msg);
		forEach(conf, function (mod, key) {
			end    = sgr(mod[1]) + end;
			start += sgr(mod[0]);
			if (hasAnsi) {
				msg = msg.replace(getEndRe(mod[1]), variantModes[key] ? sgr(mod[0]) : '');
			}
		}, null, true);
		return start + msg + end;
	}, proto);
};

module.exports = Object.defineProperties(getFn(), {
	xtermSupported: d(!xtermMatch),
	_cliColorData: d('', {})
});

}).call(this,require('_process'))
},{"./lib/sgr":19,"./lib/xterm-match":21,"_process":3,"d":25,"es5-ext/object/assign":57,"es5-ext/object/for-each":63,"es5-ext/object/map":70,"es5-ext/object/primitive-set":73,"es5-ext/object/set-prototype-of":74,"memoizee":107,"memoizee/methods":114}],14:[function(require,module,exports){
'use strict';

module.exports = '\x07';

},{}],15:[function(require,module,exports){
'use strict';

var from          = require('es5-ext/array/from')
  , iterable      = require('es5-ext/iterable/validate-object')
  , stringifiable = require('es5-ext/object/validate-stringifiable')
  , pad           = require('es5-ext/string/#/pad');

module.exports = function (rows/*, options*/) {
	var options = Object(arguments[1]), cols = [];
	return from(iterable(rows), function (row, index) {
		return from(iterable(row), function (str, index) {
			var col = cols[index];
			if (!col) col = cols[index] = { width: 0 };
			str = stringifiable(str);
			if (str.length > col.width) col.width = str.length;
			return str;
		});
	}).map(function (row) {
		return row.map(function (item, index) {
			return pad.call(item, ' ', -cols[index].width);
		}).join((options.sep == null) ? ' | ' : options.sep);
	}).join('\n') + '\n';
};

},{"es5-ext/array/from":31,"es5-ext/iterable/validate-object":42,"es5-ext/object/validate-stringifiable":81,"es5-ext/string/#/pad":85}],16:[function(require,module,exports){
'use strict';

module.exports = {
	screen: '\x1b[2J',
	screenLeft: '\x1b[1J',
	screenRight: '\x1b[J',
	line: '\x1b[2K',
	lineLeft: '\x1b[1K',
	lineRight: '\x1b[K'
};

},{}],17:[function(require,module,exports){
'use strict';
/*
 * get actual length of ANSI-formatted string
 */

var strip = require('./strip');

module.exports = function (str) {
	return strip(str).length;
};

},{"./strip":128}],18:[function(require,module,exports){
'use strict';

var d = require('d');

module.exports = Object.defineProperties(require('./bare'), {
	windowSize: d(require('./window-size')),
	erase: d(require('./erase')),
	move: d(require('./move')),
	beep: d(require('./beep')),
	columns: d(require('./columns')),
	strip: d(require('./strip')),
	getStrippedLength: d(require('./get-stripped-length')),
	slice: d(require('./slice')),
	throbber: d(require('./throbber')),
	reset: d(require('./reset')),
	art: d(require('./art'))
});

},{"./art":12,"./bare":13,"./beep":14,"./columns":15,"./erase":16,"./get-stripped-length":17,"./move":22,"./reset":126,"./slice":127,"./strip":128,"./throbber":129,"./window-size":130,"d":25}],19:[function(require,module,exports){
'use strict';
/* CSI - control sequence introducer */
/* SGR - set graphic rendition */

var assign   = require('es5-ext/object/assign')
  , includes = require('es5-ext/string/#/contains')
  , forOwn   = require('es5-ext/object/for-each')
  , onlyKey  = require('es5-ext/object/first-key')
  , forEachRight = require('es5-ext/array/#/for-each-right')
  , uniq = require('es5-ext/array/#/uniq.js');

var CSI = '\x1b[';

var sgr = function (code) {
	return CSI + code + 'm';
};

sgr.CSI = CSI;

var mods = assign({
	// Style
	bold:      { _bold: [1, 22] },
	italic:    { _italic: [3, 23] },
	underline: { _underline: [4, 24] },
	blink:     { _blink: [5, 25] },
	inverse:   { _inverse: [7, 27] },
	strike:    { _strike: [9, 29] }

	// Color
}, ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
	.reduce(function (obj, color, index) {
		// foreground
		obj[color] = { _fg: [30 + index, 39] };
		obj[color + 'Bright'] = { _fg: [90 + index, 39] };

		// background
		obj['bg' + color[0].toUpperCase() + color.slice(1)] = { _bg: [40 + index, 49] };
		obj['bg' + color[0].toUpperCase() + color.slice(1) + 'Bright'] = { _bg: [100 + index, 49] };

		return obj;
	}, {}));

sgr.mods = mods;

sgr.openers = {};
sgr.closers = {};

forOwn(mods, function (mod) {
	var modPair = mod[onlyKey(mod)];

	sgr.openers[modPair[0]] = modPair;
	sgr.closers[modPair[1]] = modPair;
});

sgr.openStyle = function (mods, code) {
	mods.push(sgr.openers[code]);
};

sgr.closeStyle = function (mods, code) {
	forEachRight.call(mods, function (modPair, index) {
		if (modPair[1] === code) {
			mods.splice(index, 1);
		}
	});
};

/* prepend openers */
sgr.prepend = function (mods) {
	return mods.map(function (modPair, key) {
		return sgr(modPair[0]);
	});
};

/* complete non-closed openers with corresponding closers */
sgr.complete = function (mods, closerCodes) {
	closerCodes.forEach(function (code) {
		sgr.closeStyle(mods, code);
	});

	// mods must be closed from the last opened to first opened
	mods = mods.reverse();

	mods = mods.map(function (modPair, key) {
		return modPair[1];
	});

	// one closer can close many openers (31, 32 -> 39)
	mods = uniq.call(mods);

	return mods.map(sgr);
};

var hasCSI = function (str) {
	return includes.call(str, CSI);
};

sgr.hasCSI = hasCSI;

var extractCode = function (csi) {
	var code = csi.slice(2, -1);
	code = Number(code);
	return code;
};

sgr.extractCode = extractCode;

module.exports = sgr;

},{"es5-ext/array/#/for-each-right":29,"es5-ext/array/#/uniq.js":30,"es5-ext/object/assign":57,"es5-ext/object/first-key":62,"es5-ext/object/for-each":63,"es5-ext/string/#/contains":82}],20:[function(require,module,exports){
'use strict';

module.exports = [
	"000000", "800000", "008000", "808000", "000080", "800080", "008080", "c0c0c0",
	"808080", "ff0000", "00ff00", "ffff00", "0000ff", "ff00ff", "00ffff", "ffffff",

	"000000", "00005f", "000087", "0000af", "0000d7", "0000ff",
	"005f00", "005f5f", "005f87", "005faf", "005fd7", "005fff",
	"008700", "00875f", "008787", "0087af", "0087d7", "0087ff",
	"00af00", "00af5f", "00af87", "00afaf", "00afd7", "00afff",
	"00d700", "00d75f", "00d787", "00d7af", "00d7d7", "00d7ff",
	"00ff00", "00ff5f", "00ff87", "00ffaf", "00ffd7", "00ffff",

	"5f0000", "5f005f", "5f0087", "5f00af", "5f00d7", "5f00ff",
	"5f5f00", "5f5f5f", "5f5f87", "5f5faf", "5f5fd7", "5f5fff",
	"5f8700", "5f875f", "5f8787", "5f87af", "5f87d7", "5f87ff",
	"5faf00", "5faf5f", "5faf87", "5fafaf", "5fafd7", "5fafff",
	"5fd700", "5fd75f", "5fd787", "5fd7af", "5fd7d7", "5fd7ff",
	"5fff00", "5fff5f", "5fff87", "5fffaf", "5fffd7", "5fffff",

	"870000", "87005f", "870087", "8700af", "8700d7", "8700ff",
	"875f00", "875f5f", "875f87", "875faf", "875fd7", "875fff",
	"878700", "87875f", "878787", "8787af", "8787d7", "8787ff",
	"87af00", "87af5f", "87af87", "87afaf", "87afd7", "87afff",
	"87d700", "87d75f", "87d787", "87d7af", "87d7d7", "87d7ff",
	"87ff00", "87ff5f", "87ff87", "87ffaf", "87ffd7", "87ffff",

	"af0000", "af005f", "af0087", "af00af", "af00d7", "af00ff",
	"af5f00", "af5f5f", "af5f87", "af5faf", "af5fd7", "af5fff",
	"af8700", "af875f", "af8787", "af87af", "af87d7", "af87ff",
	"afaf00", "afaf5f", "afaf87", "afafaf", "afafd7", "afafff",
	"afd700", "afd75f", "afd787", "afd7af", "afd7d7", "afd7ff",
	"afff00", "afff5f", "afff87", "afffaf", "afffd7", "afffff",

	"d70000", "d7005f", "d70087", "d700af", "d700d7", "d700ff",
	"d75f00", "d75f5f", "d75f87", "d75faf", "d75fd7", "d75fff",
	"d78700", "d7875f", "d78787", "d787af", "d787d7", "d787ff",
	"d7af00", "d7af5f", "d7af87", "d7afaf", "d7afd7", "d7afff",
	"d7d700", "d7d75f", "d7d787", "d7d7af", "d7d7d7", "d7d7ff",
	"d7ff00", "d7ff5f", "d7ff87", "d7ffaf", "d7ffd7", "d7ffff",

	"ff0000", "ff005f", "ff0087", "ff00af", "ff00d7", "ff00ff",
	"ff5f00", "ff5f5f", "ff5f87", "ff5faf", "ff5fd7", "ff5fff",
	"ff8700", "ff875f", "ff8787", "ff87af", "ff87d7", "ff87ff",
	"ffaf00", "ffaf5f", "ffaf87", "ffafaf", "ffafd7", "ffafff",
	"ffd700", "ffd75f", "ffd787", "ffd7af", "ffd7d7", "ffd7ff",
	"ffff00", "ffff5f", "ffff87", "ffffaf", "ffffd7", "ffffff",

	"080808", "121212", "1c1c1c", "262626", "303030", "3a3a3a",
	"444444", "4e4e4e", "585858", "626262", "6c6c6c", "767676",
	"808080", "8a8a8a", "949494", "9e9e9e", "a8a8a8", "b2b2b2",
	"bcbcbc", "c6c6c6", "d0d0d0", "dadada", "e4e4e4", "eeeeee"
];

},{}],21:[function(require,module,exports){
'use strict';

var push = Array.prototype.push, reduce = Array.prototype.reduce, abs = Math.abs
  , colors, match, result, i;

colors = require('./xterm-colors').map(function (color) {
	return {
		r: parseInt(color.slice(0, 2), 16),
		g: parseInt(color.slice(2, 4), 16),
		b: parseInt(color.slice(4), 16)
	};
});

match = colors.slice(0, 16);

module.exports = result = [];

i = 0;
while (i < 8) {
	result.push(30 + i++);
}
i = 0;
while (i < 8) {
	result.push(90 + i++);
}
push.apply(result, colors.slice(16).map(function (data) {
	var index, diff = Infinity;
	match.every(function (match, i) {
		var ndiff = reduce.call('rgb', function (diff, channel) {
			diff += abs(match[channel] - data[channel]);
			return diff;
		}, 0);
		if (ndiff < diff) {
			index = i;
			diff = ndiff;
		}
		return ndiff;
	});
	return result[index];
}));

},{"./xterm-colors":20}],22:[function(require,module,exports){
'use strict';

var d     = require('d')
  , trunc = require('es5-ext/math/trunc')

  , up, down, right, left
  , abs = Math.abs, floor = Math.floor, max = Math.max;

var getMove = function (control) {
	return function (num) {
		num = isNaN(num) ? 0 : max(floor(num), 0);
		return num ? ('\x1b[' + num + control) : '';
	};
};
module.exports = Object.defineProperties(function (x, y) {
	x = isNaN(x) ? 0 : floor(x);
	y = isNaN(y) ? 0 : floor(y);
	return ((x > 0) ? right(x) : left(-x)) + ((y > 0) ? down(y) : up(-y));
}, {
	up: d(up = getMove('A')),
	down: d(down = getMove('B')),
	right: d(right = getMove('C')),
	left: d(left = getMove('D')),
	to: d(function (x, y) {
		x = isNaN(x) ? 1 : (max(floor(x), 0) + 1);
		y = isNaN(y) ? 1 : (max(floor(y), 0) + 1);
		return '\x1b[' + y + ';' + x + 'H';
	}),
	lines: d(function (n) {
		var dir;
		n = trunc(n) || 0;
		dir = (n >= 0) ? 'E' : 'F';
		n = floor(abs(n));
		return '\x1b[' + n + dir;
	})
});

},{"d":25,"es5-ext/math/trunc":46}],23:[function(require,module,exports){
'use strict';
module.exports = function () {
	return /[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g;
};

},{}],24:[function(require,module,exports){
'use strict';

var copy       = require('es5-ext/object/copy')
  , map        = require('es5-ext/object/map')
  , callable   = require('es5-ext/object/valid-callable')
  , validValue = require('es5-ext/object/valid-value')

  , bind = Function.prototype.bind, defineProperty = Object.defineProperty
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , define;

define = function (name, desc, bindTo) {
	var value = validValue(desc) && callable(desc.value), dgs;
	dgs = copy(desc);
	delete dgs.writable;
	delete dgs.value;
	dgs.get = function () {
		if (hasOwnProperty.call(this, name)) return value;
		desc.value = bind.call(value, (bindTo == null) ? this : this[bindTo]);
		defineProperty(this, name, desc);
		return this[name];
	};
	return dgs;
};

module.exports = function (props/*, bindTo*/) {
	var bindTo = arguments[1];
	return map(props, function (desc, name) {
		return define(name, desc, bindTo);
	});
};

},{"es5-ext/object/copy":60,"es5-ext/object/map":70,"es5-ext/object/valid-callable":77,"es5-ext/object/valid-value":79}],25:[function(require,module,exports){
'use strict';

var assign        = require('es5-ext/object/assign')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , isCallable    = require('es5-ext/object/is-callable')
  , contains      = require('es5-ext/string/#/contains')

  , d;

d = module.exports = function (dscr, value/*, options*/) {
	var c, e, w, options, desc;
	if ((arguments.length < 2) || (typeof dscr !== 'string')) {
		options = value;
		value = dscr;
		dscr = null;
	} else {
		options = arguments[2];
	}
	if (dscr == null) {
		c = w = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
		w = contains.call(dscr, 'w');
	}

	desc = { value: value, configurable: c, enumerable: e, writable: w };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

d.gs = function (dscr, get, set/*, options*/) {
	var c, e, options, desc;
	if (typeof dscr !== 'string') {
		options = set;
		set = get;
		get = dscr;
		dscr = null;
	} else {
		options = arguments[3];
	}
	if (get == null) {
		get = undefined;
	} else if (!isCallable(get)) {
		options = get;
		get = set = undefined;
	} else if (set == null) {
		set = undefined;
	} else if (!isCallable(set)) {
		options = set;
		set = undefined;
	}
	if (dscr == null) {
		c = true;
		e = false;
	} else {
		c = contains.call(dscr, 'c');
		e = contains.call(dscr, 'e');
	}

	desc = { get: get, set: set, configurable: c, enumerable: e };
	return !options ? desc : assign(normalizeOpts(options), desc);
};

},{"es5-ext/object/assign":57,"es5-ext/object/is-callable":65,"es5-ext/object/normalize-options":72,"es5-ext/string/#/contains":82}],26:[function(require,module,exports){
'use strict';

var map        = require('es5-ext/object/map')
  , isCallable = require('es5-ext/object/is-callable')
  , validValue = require('es5-ext/object/valid-value')
  , contains   = require('es5-ext/string/#/contains')

  , call = Function.prototype.call
  , defineProperty = Object.defineProperty
  , getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  , getPrototypeOf = Object.getPrototypeOf
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , cacheDesc = { configurable: false, enumerable: false, writable: false,
		value: null }
  , define;

define = function (name, options) {
	var value, dgs, cacheName, desc, writable = false, resolvable
	  , flat;
	options = Object(validValue(options));
	cacheName = options.cacheName;
	flat = options.flat;
	if (cacheName == null) cacheName = name;
	delete options.cacheName;
	value = options.value;
	resolvable = isCallable(value);
	delete options.value;
	dgs = { configurable: Boolean(options.configurable),
		enumerable: Boolean(options.enumerable) };
	if (name !== cacheName) {
		dgs.get = function () {
			if (hasOwnProperty.call(this, cacheName)) return this[cacheName];
			cacheDesc.value = resolvable ? call.call(value, this, options) : value;
			cacheDesc.writable = writable;
			defineProperty(this, cacheName, cacheDesc);
			cacheDesc.value = null;
			if (desc) defineProperty(this, name, desc);
			return this[cacheName];
		};
	} else if (!flat) {
		dgs.get = function self() {
			var ownDesc;
			if (hasOwnProperty.call(this, name)) {
				ownDesc = getOwnPropertyDescriptor(this, name);
				// It happens in Safari, that getter is still called after property
				// was defined with a value, following workarounds that
				if (ownDesc.hasOwnProperty('value')) return ownDesc.value;
				if ((typeof ownDesc.get === 'function') && (ownDesc.get !== self)) {
					return ownDesc.get.call(this);
				}
				return value;
			}
			desc.value = resolvable ? call.call(value, this, options) : value;
			defineProperty(this, name, desc);
			desc.value = null;
			return this[name];
		};
	} else {
		dgs.get = function self() {
			var base = this, ownDesc;
			if (hasOwnProperty.call(this, name)) {
				// It happens in Safari, that getter is still called after property
				// was defined with a value, following workarounds that
				ownDesc = getOwnPropertyDescriptor(this, name);
				if (ownDesc.hasOwnProperty('value')) return ownDesc.value;
				if ((typeof ownDesc.get === 'function') && (ownDesc.get !== self)) {
					return ownDesc.get.call(this);
				}
			}
			while (!hasOwnProperty.call(base, name)) base = getPrototypeOf(base);
			desc.value = resolvable ? call.call(value, base, options) : value;
			defineProperty(base, name, desc);
			desc.value = null;
			return base[name];
		};
	}
	dgs.set = function (value) {
		dgs.get.call(this);
		this[cacheName] = value;
	};
	if (options.desc) {
		desc = {
			configurable: contains.call(options.desc, 'c'),
			enumerable: contains.call(options.desc, 'e')
		};
		if (cacheName === name) {
			desc.writable = contains.call(options.desc, 'w');
			desc.value = null;
		} else {
			writable = contains.call(options.desc, 'w');
			desc.get = dgs.get;
			desc.set = dgs.set;
		}
		delete options.desc;
	} else if (cacheName === name) {
		desc = {
			configurable: Boolean(options.configurable),
			enumerable: Boolean(options.enumerable),
			writable: Boolean(options.writable),
			value: null
		};
	}
	delete options.configurable;
	delete options.enumerable;
	delete options.writable;
	return dgs;
};

module.exports = function (props) {
	return map(props, function (desc, name) { return define(name, desc); });
};

},{"es5-ext/object/is-callable":65,"es5-ext/object/map":70,"es5-ext/object/valid-value":79,"es5-ext/string/#/contains":82}],27:[function(require,module,exports){
// Inspired by Google Closure:
// http://closure-library.googlecode.com/svn/docs/
// closure_goog_array_array.js.html#goog.array.clear

'use strict';

var value = require('../../object/valid-value');

module.exports = function () {
	value(this).length = 0;
	return this;
};

},{"../../object/valid-value":79}],28:[function(require,module,exports){
'use strict';

var toPosInt = require('../../number/to-pos-integer')
  , value    = require('../../object/valid-value')

  , indexOf = Array.prototype.indexOf
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , abs = Math.abs, floor = Math.floor;

module.exports = function (searchElement/*, fromIndex*/) {
	var i, l, fromIndex, val;
	if (searchElement === searchElement) { //jslint: ignore
		return indexOf.apply(this, arguments);
	}

	l = toPosInt(value(this).length);
	fromIndex = arguments[1];
	if (isNaN(fromIndex)) fromIndex = 0;
	else if (fromIndex >= 0) fromIndex = floor(fromIndex);
	else fromIndex = toPosInt(this.length) - floor(abs(fromIndex));

	for (i = fromIndex; i < l; ++i) {
		if (hasOwnProperty.call(this, i)) {
			val = this[i];
			if (val !== val) return i; //jslint: ignore
		}
	}
	return -1;
};

},{"../../number/to-pos-integer":55,"../../object/valid-value":79}],29:[function(require,module,exports){
'use strict';

var toPosInt = require('../../number/to-pos-integer')
  , callable = require('../../object/valid-callable')
  , value    = require('../../object/valid-value')

  , hasOwnProperty = Object.prototype.hasOwnProperty
  , call = Function.prototype.call;

module.exports = function (cb/*, thisArg*/) {
	var i, self, thisArg;

	self = Object(value(this));
	callable(cb);
	thisArg = arguments[1];

	for (i = (toPosInt(self.length) - 1); i >= 0; --i) {
		if (hasOwnProperty.call(self, i)) call.call(cb, thisArg, self[i], i, self);
	}
};

},{"../../number/to-pos-integer":55,"../../object/valid-callable":77,"../../object/valid-value":79}],30:[function(require,module,exports){
'use strict';

var indexOf = require('./e-index-of')

  , filter = Array.prototype.filter

  , isFirst;

isFirst = function (value, index) {
	return indexOf.call(this, value) === index;
};

module.exports = function () { return filter.call(this, isFirst, this); };

},{"./e-index-of":28}],31:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Array.from
	: require('./shim');

},{"./is-implemented":32,"./shim":33}],32:[function(require,module,exports){
'use strict';

module.exports = function () {
	var from = Array.from, arr, result;
	if (typeof from !== 'function') return false;
	arr = ['raz', 'dwa'];
	result = from(arr);
	return Boolean(result && (result !== arr) && (result[1] === 'dwa'));
};

},{}],33:[function(require,module,exports){
'use strict';

var iteratorSymbol = require('es6-symbol').iterator
  , isArguments    = require('../../function/is-arguments')
  , isFunction     = require('../../function/is-function')
  , toPosInt       = require('../../number/to-pos-integer')
  , callable       = require('../../object/valid-callable')
  , validValue     = require('../../object/valid-value')
  , isString       = require('../../string/is-string')

  , isArray = Array.isArray, call = Function.prototype.call
  , desc = { configurable: true, enumerable: true, writable: true, value: null }
  , defineProperty = Object.defineProperty;

module.exports = function (arrayLike/*, mapFn, thisArg*/) {
	var mapFn = arguments[1], thisArg = arguments[2], Constructor, i, j, arr, l, code, iterator
	  , result, getIterator, value;

	arrayLike = Object(validValue(arrayLike));

	if (mapFn != null) callable(mapFn);
	if (!this || (this === Array) || !isFunction(this)) {
		// Result: Plain array
		if (!mapFn) {
			if (isArguments(arrayLike)) {
				// Source: Arguments
				l = arrayLike.length;
				if (l !== 1) return Array.apply(null, arrayLike);
				arr = new Array(1);
				arr[0] = arrayLike[0];
				return arr;
			}
			if (isArray(arrayLike)) {
				// Source: Array
				arr = new Array(l = arrayLike.length);
				for (i = 0; i < l; ++i) arr[i] = arrayLike[i];
				return arr;
			}
		}
		arr = [];
	} else {
		// Result: Non plain array
		Constructor = this;
	}

	if (!isArray(arrayLike)) {
		if ((getIterator = arrayLike[iteratorSymbol]) !== undefined) {
			// Source: Iterator
			iterator = callable(getIterator).call(arrayLike);
			if (Constructor) arr = new Constructor();
			result = iterator.next();
			i = 0;
			while (!result.done) {
				value = mapFn ? call.call(mapFn, thisArg, result.value, i) : result.value;
				if (!Constructor) {
					arr[i] = value;
				} else {
					desc.value = value;
					defineProperty(arr, i, desc);
				}
				result = iterator.next();
				++i;
			}
			l = i;
		} else if (isString(arrayLike)) {
			// Source: String
			l = arrayLike.length;
			if (Constructor) arr = new Constructor();
			for (i = 0, j = 0; i < l; ++i) {
				value = arrayLike[i];
				if ((i + 1) < l) {
					code = value.charCodeAt(0);
					if ((code >= 0xD800) && (code <= 0xDBFF)) value += arrayLike[++i];
				}
				value = mapFn ? call.call(mapFn, thisArg, value, j) : value;
				if (!Constructor) {
					arr[j] = value;
				} else {
					desc.value = value;
					defineProperty(arr, j, desc);
				}
				++j;
			}
			l = j;
		}
	}
	if (l === undefined) {
		// Source: array or array-like
		l = toPosInt(arrayLike.length);
		if (Constructor) arr = new Constructor(l);
		for (i = 0; i < l; ++i) {
			value = mapFn ? call.call(mapFn, thisArg, arrayLike[i], i) : arrayLike[i];
			if (!Constructor) {
				arr[i] = value;
			} else {
				desc.value = value;
				defineProperty(arr, i, desc);
			}
		}
	}
	if (Constructor) {
		desc.value = null;
		arr.length = l;
	}
	return arr;
};

},{"../../function/is-arguments":38,"../../function/is-function":39,"../../number/to-pos-integer":55,"../../object/valid-callable":77,"../../object/valid-value":79,"../../string/is-string":89,"es6-symbol":49}],34:[function(require,module,exports){
'use strict';

var from = require('./from')

  , isArray = Array.isArray;

module.exports = function (arrayLike) {
	return isArray(arrayLike) ? arrayLike : from(arrayLike);
};

},{"./from":31}],35:[function(require,module,exports){
'use strict';

var assign = require('../object/assign')

  , captureStackTrace = Error.captureStackTrace;

exports = module.exports = function (message/*, code, ext*/) {
	var err = new Error(), code = arguments[1], ext = arguments[2];
	if (ext == null) {
		if (code && (typeof code === 'object')) {
			ext = code;
			code = null;
		}
	}
	if (ext != null) assign(err, ext);
	err.message = String(message);
	if (code != null) err.code = String(code);
	if (captureStackTrace) captureStackTrace(err, exports);
	return err;
};

},{"../object/assign":57}],36:[function(require,module,exports){
'use strict';

var callable = require('../../object/valid-callable')
  , aFrom    = require('../../array/from')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , callFn = function (arg, fn) { return call.call(fn, this, arg); };

module.exports = function (fn/*, …fnn*/) {
	var fns, first;
	if (!fn) callable(fn);
	fns = [this].concat(aFrom(arguments));
	fns.forEach(callable);
	fns = fns.reverse();
	first = fns[0];
	fns = fns.slice(1);
	return function (arg) {
		return fns.reduce(callFn, apply.call(first, this, arguments));
	};
};

},{"../../array/from":31,"../../object/valid-callable":77}],37:[function(require,module,exports){
'use strict';

var toPosInt = require('../number/to-pos-integer')

  , test = function (a, b) {}, desc, defineProperty
  , generate, mixin;

try {
	Object.defineProperty(test, 'length', { configurable: true, writable: false,
		enumerable: false, value: 1 });
} catch (ignore) {}

if (test.length === 1) {
	// ES6
	desc = { configurable: true, writable: false, enumerable: false };
	defineProperty = Object.defineProperty;
	module.exports = function (fn, length) {
		length = toPosInt(length);
		if (fn.length === length) return fn;
		desc.value = length;
		return defineProperty(fn, 'length', desc);
	};
} else {
	mixin = require('../object/mixin');
	generate = (function () {
		var cache = [];
		return function (l) {
			var args, i = 0;
			if (cache[l]) return cache[l];
			args = [];
			while (l--) args.push('a' + (++i).toString(36));
			return new Function('fn', 'return function (' + args.join(', ') +
				') { return fn.apply(this, arguments); };');
		};
	}());
	module.exports = function (src, length) {
		var target;
		length = toPosInt(length);
		if (src.length === length) return src;
		target = generate(length)(src);
		try { mixin(target, src); } catch (ignore) {}
		return target;
	};
}

},{"../number/to-pos-integer":55,"../object/mixin":71}],38:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call((function () { return arguments; }()));

module.exports = function (x) { return (toString.call(x) === id); };

},{}],39:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call(require('./noop'));

module.exports = function (f) {
	return (typeof f === "function") && (toString.call(f) === id);
};

},{"./noop":40}],40:[function(require,module,exports){
'use strict';

module.exports = function () {};

},{}],41:[function(require,module,exports){
'use strict';

var iteratorSymbol = require('es6-symbol').iterator
  , isArrayLike    = require('../object/is-array-like');

module.exports = function (x) {
	if (x == null) return false;
	if (typeof x[iteratorSymbol] === 'function') return true;
	return isArrayLike(x);
};

},{"../object/is-array-like":64,"es6-symbol":49}],42:[function(require,module,exports){
'use strict';

var isObject = require('../object/is-object')
  , is       = require('./is');

module.exports = function (x) {
	if (is(x) && isObject(x)) return x;
	throw new TypeError(x + " is not an iterable or array-like object");
};

},{"../object/is-object":66,"./is":41}],43:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Math.sign
	: require('./shim');

},{"./is-implemented":44,"./shim":45}],44:[function(require,module,exports){
'use strict';

module.exports = function () {
	var sign = Math.sign;
	if (typeof sign !== 'function') return false;
	return ((sign(10) === 1) && (sign(-20) === -1));
};

},{}],45:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	value = Number(value);
	if (isNaN(value) || (value === 0)) return value;
	return (value > 0) ? 1 : -1;
};

},{}],46:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Math.trunc
	: require('./shim');

},{"./is-implemented":47,"./shim":48}],47:[function(require,module,exports){
'use strict';

module.exports = function () {
	var trunc = Math.trunc;
	if (typeof trunc !== 'function') return false;
	return (trunc(13.67) === 13) && (trunc(-13.67) === -13);
};

},{}],48:[function(require,module,exports){
'use strict';

var floor = Math.floor;

module.exports = function (x) {
	if (isNaN(x)) return NaN;
	x = Number(x);
	if (x === 0) return x;
	if (x === Infinity) return Infinity;
	if (x === -Infinity) return -Infinity;
	if (x > 0) return floor(x);
	return -floor(-x);
};

},{}],49:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')() ? Symbol : require('./polyfill');

},{"./is-implemented":50,"./polyfill":52}],50:[function(require,module,exports){
'use strict';

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }
	if (typeof Symbol.iterator === 'symbol') return true;

	// Return 'true' for polyfills
	if (typeof Symbol.isConcatSpreadable !== 'object') return false;
	if (typeof Symbol.iterator !== 'object') return false;
	if (typeof Symbol.toPrimitive !== 'object') return false;
	if (typeof Symbol.toStringTag !== 'object') return false;
	if (typeof Symbol.unscopables !== 'object') return false;

	return true;
};

},{}],51:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	return (x && ((typeof x === 'symbol') || (x['@@toStringTag'] === 'Symbol'))) || false;
};

},{}],52:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not support it (or partially support it_

'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null);

if (typeof Symbol === 'function') NativeSymbol = Symbol;

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),

	// If there's native implementation of given symbol, let's fallback to it
	// to ensure proper interoperability with other native functions e.g. Array.from
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('',
	function () { return validateSymbol(this); }));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));

},{"./validate-symbol":53,"d":25}],53:[function(require,module,exports){
'use strict';

var isSymbol = require('./is-symbol');

module.exports = function (value) {
	if (!isSymbol(value)) throw new TypeError(value + " is not a symbol");
	return value;
};

},{"./is-symbol":51}],54:[function(require,module,exports){
'use strict';

var sign = require('../math/sign')

  , abs = Math.abs, floor = Math.floor;

module.exports = function (value) {
	if (isNaN(value)) return 0;
	value = Number(value);
	if ((value === 0) || !isFinite(value)) return value;
	return sign(value) * floor(abs(value));
};

},{"../math/sign":43}],55:[function(require,module,exports){
'use strict';

var toInteger = require('./to-integer')

  , max = Math.max;

module.exports = function (value) { return max(0, toInteger(value)); };

},{"./to-integer":54}],56:[function(require,module,exports){
// Internal method, used by iteration functions.
// Calls a function for each key-value pair found in object
// Optionally takes compareFn to iterate object in specific order

'use strict';

var callable = require('./valid-callable')
  , value    = require('./valid-value')

  , bind = Function.prototype.bind, call = Function.prototype.call, keys = Object.keys
  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (method, defVal) {
	return function (obj, cb/*, thisArg, compareFn*/) {
		var list, thisArg = arguments[2], compareFn = arguments[3];
		obj = Object(value(obj));
		callable(cb);

		list = keys(obj);
		if (compareFn) {
			list.sort((typeof compareFn === 'function') ? bind.call(compareFn, obj) : undefined);
		}
		if (typeof method !== 'function') method = list[method];
		return call.call(method, list, function (key, index) {
			if (!propertyIsEnumerable.call(obj, key)) return defVal;
			return call.call(cb, thisArg, obj[key], key, obj, index);
		});
	};
};

},{"./valid-callable":77,"./valid-value":79}],57:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.assign
	: require('./shim');

},{"./is-implemented":58,"./shim":59}],58:[function(require,module,exports){
'use strict';

module.exports = function () {
	var assign = Object.assign, obj;
	if (typeof assign !== 'function') return false;
	obj = { foo: 'raz' };
	assign(obj, { bar: 'dwa' }, { trzy: 'trzy' });
	return (obj.foo + obj.bar + obj.trzy) === 'razdwatrzy';
};

},{}],59:[function(require,module,exports){
'use strict';

var keys  = require('../keys')
  , value = require('../valid-value')

  , max = Math.max;

module.exports = function (dest, src/*, …srcn*/) {
	var error, i, l = max(arguments.length, 2), assign;
	dest = Object(value(dest));
	assign = function (key) {
		try { dest[key] = src[key]; } catch (e) {
			if (!error) error = e;
		}
	};
	for (i = 1; i < l; ++i) {
		src = arguments[i];
		keys(src).forEach(assign);
	}
	if (error !== undefined) throw error;
	return dest;
};

},{"../keys":67,"../valid-value":79}],60:[function(require,module,exports){
'use strict';

var assign = require('./assign')
  , value  = require('./valid-value');

module.exports = function (obj) {
	var copy = Object(value(obj));
	if (copy !== obj) return copy;
	return assign({}, obj);
};

},{"./assign":57,"./valid-value":79}],61:[function(require,module,exports){
// Workaround for http://code.google.com/p/v8/issues/detail?id=2804

'use strict';

var create = Object.create, shim;

if (!require('./set-prototype-of/is-implemented')()) {
	shim = require('./set-prototype-of/shim');
}

module.exports = (function () {
	var nullObject, props, desc;
	if (!shim) return create;
	if (shim.level !== 1) return create;

	nullObject = {};
	props = {};
	desc = { configurable: false, enumerable: false, writable: true,
		value: undefined };
	Object.getOwnPropertyNames(Object.prototype).forEach(function (name) {
		if (name === '__proto__') {
			props[name] = { configurable: true, enumerable: false, writable: true,
				value: undefined };
			return;
		}
		props[name] = desc;
	});
	Object.defineProperties(nullObject, props);

	Object.defineProperty(shim, 'nullPolyfill', { configurable: false,
		enumerable: false, writable: false, value: nullObject });

	return function (prototype, props) {
		return create((prototype === null) ? nullObject : prototype, props);
	};
}());

},{"./set-prototype-of/is-implemented":75,"./set-prototype-of/shim":76}],62:[function(require,module,exports){
'use strict';

var value = require('./valid-value')

  , propertyIsEnumerable = Object.prototype.propertyIsEnumerable;

module.exports = function (obj) {
	var i;
	value(obj);
	for (i in obj) {
		if (propertyIsEnumerable.call(obj, i)) return i;
	}
	return null;
};

},{"./valid-value":79}],63:[function(require,module,exports){
'use strict';

module.exports = require('./_iterate')('forEach');

},{"./_iterate":56}],64:[function(require,module,exports){
'use strict';

var isFunction = require('../function/is-function')
  , isObject   = require('./is-object');

module.exports = function (x) {
	return ((x != null) && (typeof x.length === 'number') &&

		// Just checking ((typeof x === 'object') && (typeof x !== 'function'))
		// won't work right for some cases, e.g.:
		// type of instance of NodeList in Safari is a 'function'

		((isObject(x) && !isFunction(x)) || (typeof x === "string"))) || false;
};

},{"../function/is-function":39,"./is-object":66}],65:[function(require,module,exports){
// Deprecated

'use strict';

module.exports = function (obj) { return typeof obj === 'function'; };

},{}],66:[function(require,module,exports){
'use strict';

var map = { function: true, object: true };

module.exports = function (x) {
	return ((x != null) && map[typeof x]) || false;
};

},{}],67:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.keys
	: require('./shim');

},{"./is-implemented":68,"./shim":69}],68:[function(require,module,exports){
'use strict';

module.exports = function () {
	try {
		Object.keys('primitive');
		return true;
	} catch (e) { return false; }
};

},{}],69:[function(require,module,exports){
'use strict';

var keys = Object.keys;

module.exports = function (object) {
	return keys(object == null ? object : Object(object));
};

},{}],70:[function(require,module,exports){
'use strict';

var callable = require('./valid-callable')
  , forEach  = require('./for-each')

  , call = Function.prototype.call;

module.exports = function (obj, cb/*, thisArg*/) {
	var o = {}, thisArg = arguments[2];
	callable(cb);
	forEach(obj, function (value, key, obj, index) {
		o[key] = call.call(cb, thisArg, value, key, obj, index);
	});
	return o;
};

},{"./for-each":63,"./valid-callable":77}],71:[function(require,module,exports){
'use strict';

var value = require('./valid-value')

  , defineProperty = Object.defineProperty
  , getOwnPropertyDescriptor = Object.getOwnPropertyDescriptor
  , getOwnPropertyNames = Object.getOwnPropertyNames;

module.exports = function (target, source) {
	var error;
	target = Object(value(target));
	getOwnPropertyNames(Object(value(source))).forEach(function (name) {
		try {
			defineProperty(target, name, getOwnPropertyDescriptor(source, name));
		} catch (e) { error = e; }
	});
	if (error !== undefined) throw error;
	return target;
};

},{"./valid-value":79}],72:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

var process = function (src, obj) {
	var key;
	for (key in src) obj[key] = src[key];
};

module.exports = function (options/*, …options*/) {
	var result = create(null);
	forEach.call(arguments, function (options) {
		if (options == null) return;
		process(Object(options), result);
	});
	return result;
};

},{}],73:[function(require,module,exports){
'use strict';

var forEach = Array.prototype.forEach, create = Object.create;

module.exports = function (arg/*, …args*/) {
	var set = create(null);
	forEach.call(arguments, function (name) { set[name] = true; });
	return set;
};

},{}],74:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? Object.setPrototypeOf
	: require('./shim');

},{"./is-implemented":75,"./shim":76}],75:[function(require,module,exports){
'use strict';

var create = Object.create, getPrototypeOf = Object.getPrototypeOf
  , x = {};

module.exports = function (/*customCreate*/) {
	var setPrototypeOf = Object.setPrototypeOf
	  , customCreate = arguments[0] || create;
	if (typeof setPrototypeOf !== 'function') return false;
	return getPrototypeOf(setPrototypeOf(customCreate(null), x)) === x;
};

},{}],76:[function(require,module,exports){
// Big thanks to @WebReflection for sorting this out
// https://gist.github.com/WebReflection/5593554

'use strict';

var isObject      = require('../is-object')
  , value         = require('../valid-value')

  , isPrototypeOf = Object.prototype.isPrototypeOf
  , defineProperty = Object.defineProperty
  , nullDesc = { configurable: true, enumerable: false, writable: true,
		value: undefined }
  , validate;

validate = function (obj, prototype) {
	value(obj);
	if ((prototype === null) || isObject(prototype)) return obj;
	throw new TypeError('Prototype must be null or an object');
};

module.exports = (function (status) {
	var fn, set;
	if (!status) return null;
	if (status.level === 2) {
		if (status.set) {
			set = status.set;
			fn = function (obj, prototype) {
				set.call(validate(obj, prototype), prototype);
				return obj;
			};
		} else {
			fn = function (obj, prototype) {
				validate(obj, prototype).__proto__ = prototype;
				return obj;
			};
		}
	} else {
		fn = function self(obj, prototype) {
			var isNullBase;
			validate(obj, prototype);
			isNullBase = isPrototypeOf.call(self.nullPolyfill, obj);
			if (isNullBase) delete self.nullPolyfill.__proto__;
			if (prototype === null) prototype = self.nullPolyfill;
			obj.__proto__ = prototype;
			if (isNullBase) defineProperty(self.nullPolyfill, '__proto__', nullDesc);
			return obj;
		};
	}
	return Object.defineProperty(fn, 'level', { configurable: false,
		enumerable: false, writable: false, value: status.level });
}((function () {
	var x = Object.create(null), y = {}, set
	  , desc = Object.getOwnPropertyDescriptor(Object.prototype, '__proto__');

	if (desc) {
		try {
			set = desc.set; // Opera crashes at this point
			set.call(x, y);
		} catch (ignore) { }
		if (Object.getPrototypeOf(x) === y) return { set: set, level: 2 };
	}

	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 2 };

	x = {};
	x.__proto__ = y;
	if (Object.getPrototypeOf(x) === y) return { level: 1 };

	return false;
}())));

require('../create');

},{"../create":61,"../is-object":66,"../valid-value":79}],77:[function(require,module,exports){
'use strict';

module.exports = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

},{}],78:[function(require,module,exports){
'use strict';

var isObject = require('./is-object');

module.exports = function (value) {
	if (!isObject(value)) throw new TypeError(value + " is not an Object");
	return value;
};

},{"./is-object":66}],79:[function(require,module,exports){
'use strict';

module.exports = function (value) {
	if (value == null) throw new TypeError("Cannot use null or undefined");
	return value;
};

},{}],80:[function(require,module,exports){
'use strict';

var value         = require('./valid-value')
  , stringifiable = require('./validate-stringifiable');

module.exports = function (x) { return stringifiable(value(x)); };

},{"./valid-value":79,"./validate-stringifiable":81}],81:[function(require,module,exports){
'use strict';

module.exports = function (stringifiable) {
	try {
		return String(stringifiable);
	} catch (e) {
		throw new TypeError("Passed argument cannot be stringifed");
	}
};

},{}],82:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.contains
	: require('./shim');

},{"./is-implemented":83,"./shim":84}],83:[function(require,module,exports){
'use strict';

var str = 'razdwatrzy';

module.exports = function () {
	if (typeof str.contains !== 'function') return false;
	return ((str.contains('dwa') === true) && (str.contains('foo') === false));
};

},{}],84:[function(require,module,exports){
'use strict';

var indexOf = String.prototype.indexOf;

module.exports = function (searchString/*, position*/) {
	return indexOf.call(this, searchString, arguments[1]) > -1;
};

},{}],85:[function(require,module,exports){
'use strict';

var toInteger = require('../../number/to-integer')
  , value     = require('../../object/valid-value')
  , repeat    = require('./repeat')

  , abs = Math.abs, max = Math.max;

module.exports = function (fill/*, length*/) {
	var self = String(value(this))
	  , sLength = self.length
	  , length = arguments[1];

	length = isNaN(length) ? 1 : toInteger(length);
	fill = repeat.call(String(fill), abs(length));
	if (length >= 0) return fill.slice(0, max(0, length - sLength)) + self;
	return self + (((sLength + length) >= 0) ? '' : fill.slice(length + sLength));
};

},{"../../number/to-integer":54,"../../object/valid-value":79,"./repeat":86}],86:[function(require,module,exports){
'use strict';

module.exports = require('./is-implemented')()
	? String.prototype.repeat
	: require('./shim');

},{"./is-implemented":87,"./shim":88}],87:[function(require,module,exports){
'use strict';

var str = 'foo';

module.exports = function () {
	if (typeof str.repeat !== 'function') return false;
	return (str.repeat(2) === 'foofoo');
};

},{}],88:[function(require,module,exports){
// Thanks: http://www.2ality.com/2014/01/efficient-string-repeat.html

'use strict';

var value     = require('../../../object/valid-value')
  , toInteger = require('../../../number/to-integer');

module.exports = function (count) {
	var str = String(value(this)), result;
	count = toInteger(count);
	if (count < 0) throw new RangeError("Count must be >= 0");
	if (!isFinite(count)) throw new RangeError("Count must be < ∞");
	result = '';
	if (!count) return result;
	while (true) {
		if (count & 1) result += str;
		count >>>= 1;
		if (count <= 0) break;
		str += str;
	}
	return result;
};

},{"../../../number/to-integer":54,"../../../object/valid-value":79}],89:[function(require,module,exports){
'use strict';

var toString = Object.prototype.toString

  , id = toString.call('');

module.exports = function (x) {
	return (typeof x === 'string') || (x && (typeof x === 'object') &&
		((x instanceof String) || (toString.call(x) === id))) || false;
};

},{}],90:[function(require,module,exports){
'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , contains       = require('es5-ext/string/#/contains')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , ArrayIterator;

ArrayIterator = module.exports = function (arr, kind) {
	if (!(this instanceof ArrayIterator)) return new ArrayIterator(arr, kind);
	Iterator.call(this, arr);
	if (!kind) kind = 'value';
	else if (contains.call(kind, 'key+value')) kind = 'key+value';
	else if (contains.call(kind, 'key')) kind = 'key';
	else kind = 'value';
	defineProperty(this, '__kind__', d('', kind));
};
if (setPrototypeOf) setPrototypeOf(ArrayIterator, Iterator);

ArrayIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(ArrayIterator),
	_resolve: d(function (i) {
		if (this.__kind__ === 'value') return this.__list__[i];
		if (this.__kind__ === 'key+value') return [i, this.__list__[i]];
		return i;
	}),
	toString: d(function () { return '[object Array Iterator]'; })
});

},{"./":93,"d":25,"es5-ext/object/set-prototype-of":74,"es5-ext/string/#/contains":82}],91:[function(require,module,exports){
'use strict';

var isArguments = require('es5-ext/function/is-arguments')
  , callable    = require('es5-ext/object/valid-callable')
  , isString    = require('es5-ext/string/is-string')
  , get         = require('./get')

  , isArray = Array.isArray, call = Function.prototype.call
  , some = Array.prototype.some;

module.exports = function (iterable, cb/*, thisArg*/) {
	var mode, thisArg = arguments[2], result, doBreak, broken, i, l, char, code;
	if (isArray(iterable) || isArguments(iterable)) mode = 'array';
	else if (isString(iterable)) mode = 'string';
	else iterable = get(iterable);

	callable(cb);
	doBreak = function () { broken = true; };
	if (mode === 'array') {
		some.call(iterable, function (value) {
			call.call(cb, thisArg, value, doBreak);
			if (broken) return true;
		});
		return;
	}
	if (mode === 'string') {
		l = iterable.length;
		for (i = 0; i < l; ++i) {
			char = iterable[i];
			if ((i + 1) < l) {
				code = char.charCodeAt(0);
				if ((code >= 0xD800) && (code <= 0xDBFF)) char += iterable[++i];
			}
			call.call(cb, thisArg, char, doBreak);
			if (broken) break;
		}
		return;
	}
	result = iterable.next();

	while (!result.done) {
		call.call(cb, thisArg, result.value, doBreak);
		if (broken) return;
		result = iterable.next();
	}
};

},{"./get":92,"es5-ext/function/is-arguments":38,"es5-ext/object/valid-callable":77,"es5-ext/string/is-string":89}],92:[function(require,module,exports){
'use strict';

var isArguments    = require('es5-ext/function/is-arguments')
  , isString       = require('es5-ext/string/is-string')
  , ArrayIterator  = require('./array')
  , StringIterator = require('./string')
  , iterable       = require('./valid-iterable')
  , iteratorSymbol = require('es6-symbol').iterator;

module.exports = function (obj) {
	if (typeof iterable(obj)[iteratorSymbol] === 'function') return obj[iteratorSymbol]();
	if (isArguments(obj)) return new ArrayIterator(obj);
	if (isString(obj)) return new StringIterator(obj);
	return new ArrayIterator(obj);
};

},{"./array":90,"./string":100,"./valid-iterable":101,"es5-ext/function/is-arguments":38,"es5-ext/string/is-string":89,"es6-symbol":95}],93:[function(require,module,exports){
'use strict';

var clear    = require('es5-ext/array/#/clear')
  , assign   = require('es5-ext/object/assign')
  , callable = require('es5-ext/object/valid-callable')
  , value    = require('es5-ext/object/valid-value')
  , d        = require('d')
  , autoBind = require('d/auto-bind')
  , Symbol   = require('es6-symbol')

  , defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , Iterator;

module.exports = Iterator = function (list, context) {
	if (!(this instanceof Iterator)) return new Iterator(list, context);
	defineProperties(this, {
		__list__: d('w', value(list)),
		__context__: d('w', context),
		__nextIndex__: d('w', 0)
	});
	if (!context) return;
	callable(context.on);
	context.on('_add', this._onAdd);
	context.on('_delete', this._onDelete);
	context.on('_clear', this._onClear);
};

defineProperties(Iterator.prototype, assign({
	constructor: d(Iterator),
	_next: d(function () {
		var i;
		if (!this.__list__) return;
		if (this.__redo__) {
			i = this.__redo__.shift();
			if (i !== undefined) return i;
		}
		if (this.__nextIndex__ < this.__list__.length) return this.__nextIndex__++;
		this._unBind();
	}),
	next: d(function () { return this._createResult(this._next()); }),
	_createResult: d(function (i) {
		if (i === undefined) return { done: true, value: undefined };
		return { done: false, value: this._resolve(i) };
	}),
	_resolve: d(function (i) { return this.__list__[i]; }),
	_unBind: d(function () {
		this.__list__ = null;
		delete this.__redo__;
		if (!this.__context__) return;
		this.__context__.off('_add', this._onAdd);
		this.__context__.off('_delete', this._onDelete);
		this.__context__.off('_clear', this._onClear);
		this.__context__ = null;
	}),
	toString: d(function () { return '[object Iterator]'; })
}, autoBind({
	_onAdd: d(function (index) {
		if (index >= this.__nextIndex__) return;
		++this.__nextIndex__;
		if (!this.__redo__) {
			defineProperty(this, '__redo__', d('c', [index]));
			return;
		}
		this.__redo__.forEach(function (redo, i) {
			if (redo >= index) this.__redo__[i] = ++redo;
		}, this);
		this.__redo__.push(index);
	}),
	_onDelete: d(function (index) {
		var i;
		if (index >= this.__nextIndex__) return;
		--this.__nextIndex__;
		if (!this.__redo__) return;
		i = this.__redo__.indexOf(index);
		if (i !== -1) this.__redo__.splice(i, 1);
		this.__redo__.forEach(function (redo, i) {
			if (redo > index) this.__redo__[i] = --redo;
		}, this);
	}),
	_onClear: d(function () {
		if (this.__redo__) clear.call(this.__redo__);
		this.__nextIndex__ = 0;
	})
})));

defineProperty(Iterator.prototype, Symbol.iterator, d(function () {
	return this;
}));
defineProperty(Iterator.prototype, Symbol.toStringTag, d('', 'Iterator'));

},{"d":25,"d/auto-bind":24,"es5-ext/array/#/clear":27,"es5-ext/object/assign":57,"es5-ext/object/valid-callable":77,"es5-ext/object/valid-value":79,"es6-symbol":95}],94:[function(require,module,exports){
'use strict';

var isArguments    = require('es5-ext/function/is-arguments')
  , isString       = require('es5-ext/string/is-string')
  , iteratorSymbol = require('es6-symbol').iterator

  , isArray = Array.isArray;

module.exports = function (value) {
	if (value == null) return false;
	if (isArray(value)) return true;
	if (isString(value)) return true;
	if (isArguments(value)) return true;
	return (typeof value[iteratorSymbol] === 'function');
};

},{"es5-ext/function/is-arguments":38,"es5-ext/string/is-string":89,"es6-symbol":95}],95:[function(require,module,exports){
arguments[4][49][0].apply(exports,arguments)
},{"./is-implemented":96,"./polyfill":98,"dup":49}],96:[function(require,module,exports){
'use strict';

var validTypes = { object: true, symbol: true };

module.exports = function () {
	var symbol;
	if (typeof Symbol !== 'function') return false;
	symbol = Symbol('test symbol');
	try { String(symbol); } catch (e) { return false; }

	// Return 'true' also for polyfills
	if (!validTypes[typeof Symbol.iterator]) return false;
	if (!validTypes[typeof Symbol.toPrimitive]) return false;
	if (!validTypes[typeof Symbol.toStringTag]) return false;

	return true;
};

},{}],97:[function(require,module,exports){
'use strict';

module.exports = function (x) {
	if (!x) return false;
	if (typeof x === 'symbol') return true;
	if (!x.constructor) return false;
	if (x.constructor.name !== 'Symbol') return false;
	return (x[x.constructor.toStringTag] === 'Symbol');
};

},{}],98:[function(require,module,exports){
// ES2015 Symbol polyfill for environments that do not support it (or partially support it)

'use strict';

var d              = require('d')
  , validateSymbol = require('./validate-symbol')

  , create = Object.create, defineProperties = Object.defineProperties
  , defineProperty = Object.defineProperty, objPrototype = Object.prototype
  , NativeSymbol, SymbolPolyfill, HiddenSymbol, globalSymbols = create(null)
  , isNativeSafe;

if (typeof Symbol === 'function') {
	NativeSymbol = Symbol;
	try {
		String(NativeSymbol());
		isNativeSafe = true;
	} catch (ignore) {}
}

var generateName = (function () {
	var created = create(null);
	return function (desc) {
		var postfix = 0, name, ie11BugWorkaround;
		while (created[desc + (postfix || '')]) ++postfix;
		desc += (postfix || '');
		created[desc] = true;
		name = '@@' + desc;
		defineProperty(objPrototype, name, d.gs(null, function (value) {
			// For IE11 issue see:
			// https://connect.microsoft.com/IE/feedbackdetail/view/1928508/
			//    ie11-broken-getters-on-dom-objects
			// https://github.com/medikoo/es6-symbol/issues/12
			if (ie11BugWorkaround) return;
			ie11BugWorkaround = true;
			defineProperty(this, name, d(value));
			ie11BugWorkaround = false;
		}));
		return name;
	};
}());

// Internal constructor (not one exposed) for creating Symbol instances.
// This one is used to ensure that `someSymbol instanceof Symbol` always return false
HiddenSymbol = function Symbol(description) {
	if (this instanceof HiddenSymbol) throw new TypeError('TypeError: Symbol is not a constructor');
	return SymbolPolyfill(description);
};

// Exposed `Symbol` constructor
// (returns instances of HiddenSymbol)
module.exports = SymbolPolyfill = function Symbol(description) {
	var symbol;
	if (this instanceof Symbol) throw new TypeError('TypeError: Symbol is not a constructor');
	if (isNativeSafe) return NativeSymbol(description);
	symbol = create(HiddenSymbol.prototype);
	description = (description === undefined ? '' : String(description));
	return defineProperties(symbol, {
		__description__: d('', description),
		__name__: d('', generateName(description))
	});
};
defineProperties(SymbolPolyfill, {
	for: d(function (key) {
		if (globalSymbols[key]) return globalSymbols[key];
		return (globalSymbols[key] = SymbolPolyfill(String(key)));
	}),
	keyFor: d(function (s) {
		var key;
		validateSymbol(s);
		for (key in globalSymbols) if (globalSymbols[key] === s) return key;
	}),

	// If there's native implementation of given symbol, let's fallback to it
	// to ensure proper interoperability with other native functions e.g. Array.from
	hasInstance: d('', (NativeSymbol && NativeSymbol.hasInstance) || SymbolPolyfill('hasInstance')),
	isConcatSpreadable: d('', (NativeSymbol && NativeSymbol.isConcatSpreadable) ||
		SymbolPolyfill('isConcatSpreadable')),
	iterator: d('', (NativeSymbol && NativeSymbol.iterator) || SymbolPolyfill('iterator')),
	match: d('', (NativeSymbol && NativeSymbol.match) || SymbolPolyfill('match')),
	replace: d('', (NativeSymbol && NativeSymbol.replace) || SymbolPolyfill('replace')),
	search: d('', (NativeSymbol && NativeSymbol.search) || SymbolPolyfill('search')),
	species: d('', (NativeSymbol && NativeSymbol.species) || SymbolPolyfill('species')),
	split: d('', (NativeSymbol && NativeSymbol.split) || SymbolPolyfill('split')),
	toPrimitive: d('', (NativeSymbol && NativeSymbol.toPrimitive) || SymbolPolyfill('toPrimitive')),
	toStringTag: d('', (NativeSymbol && NativeSymbol.toStringTag) || SymbolPolyfill('toStringTag')),
	unscopables: d('', (NativeSymbol && NativeSymbol.unscopables) || SymbolPolyfill('unscopables'))
});

// Internal tweaks for real symbol producer
defineProperties(HiddenSymbol.prototype, {
	constructor: d(SymbolPolyfill),
	toString: d('', function () { return this.__name__; })
});

// Proper implementation of methods exposed on Symbol.prototype
// They won't be accessible on produced symbol instances as they derive from HiddenSymbol.prototype
defineProperties(SymbolPolyfill.prototype, {
	toString: d(function () { return 'Symbol (' + validateSymbol(this).__description__ + ')'; }),
	valueOf: d(function () { return validateSymbol(this); })
});
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toPrimitive, d('', function () {
	var symbol = validateSymbol(this);
	if (typeof symbol === 'symbol') return symbol;
	return symbol.toString();
}));
defineProperty(SymbolPolyfill.prototype, SymbolPolyfill.toStringTag, d('c', 'Symbol'));

// Proper implementaton of toPrimitive and toStringTag for returned symbol instances
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toStringTag,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toStringTag]));

// Note: It's important to define `toPrimitive` as last one, as some implementations
// implement `toPrimitive` natively without implementing `toStringTag` (or other specified symbols)
// And that may invoke error in definition flow:
// See: https://github.com/medikoo/es6-symbol/issues/13#issuecomment-164146149
defineProperty(HiddenSymbol.prototype, SymbolPolyfill.toPrimitive,
	d('c', SymbolPolyfill.prototype[SymbolPolyfill.toPrimitive]));

},{"./validate-symbol":99,"d":25}],99:[function(require,module,exports){
arguments[4][53][0].apply(exports,arguments)
},{"./is-symbol":97,"dup":53}],100:[function(require,module,exports){
// Thanks @mathiasbynens
// http://mathiasbynens.be/notes/javascript-unicode#iterating-over-symbols

'use strict';

var setPrototypeOf = require('es5-ext/object/set-prototype-of')
  , d              = require('d')
  , Iterator       = require('./')

  , defineProperty = Object.defineProperty
  , StringIterator;

StringIterator = module.exports = function (str) {
	if (!(this instanceof StringIterator)) return new StringIterator(str);
	str = String(str);
	Iterator.call(this, str);
	defineProperty(this, '__length__', d('', str.length));

};
if (setPrototypeOf) setPrototypeOf(StringIterator, Iterator);

StringIterator.prototype = Object.create(Iterator.prototype, {
	constructor: d(StringIterator),
	_next: d(function () {
		if (!this.__list__) return;
		if (this.__nextIndex__ < this.__length__) return this.__nextIndex__++;
		this._unBind();
	}),
	_resolve: d(function (i) {
		var char = this.__list__[i], code;
		if (this.__nextIndex__ === this.__length__) return char;
		code = char.charCodeAt(0);
		if ((code >= 0xD800) && (code <= 0xDBFF)) return char + this.__list__[this.__nextIndex__++];
		return char;
	}),
	toString: d(function () { return '[object String Iterator]'; })
});

},{"./":93,"d":25,"es5-ext/object/set-prototype-of":74}],101:[function(require,module,exports){
'use strict';

var isIterable = require('./is-iterable');

module.exports = function (value) {
	if (!isIterable(value)) throw new TypeError(value + " is not iterable");
	return value;
};

},{"./is-iterable":94}],102:[function(require,module,exports){
// Support for asynchronous functions

'use strict';

var aFrom        = require('es5-ext/array/from')
  , mixin        = require('es5-ext/object/mixin')
  , defineLength = require('es5-ext/function/_define-length')
  , nextTick     = require('next-tick')

  , slice = Array.prototype.slice
  , apply = Function.prototype.apply, create = Object.create
  , hasOwnProperty = Object.prototype.hasOwnProperty;

require('../lib/registered-extensions').async = function (tbi, conf) {
	var waiting = create(null), cache = create(null)
	  , base = conf.memoized, original = conf.original
	  , currentCallback, currentContext, currentArgs;

	// Initial
	conf.memoized = defineLength(function (arg) {
		var args = arguments, last = args[args.length - 1];
		if (typeof last === 'function') {
			currentCallback = last;
			args = slice.call(args, 0, -1);
		}
		return base.apply(currentContext = this, currentArgs = args);
	}, base);
	try { mixin(conf.memoized, base); } catch (ignore) {}

	// From cache (sync)
	conf.on('get', function (id) {
		var cb, context, args;
		if (!currentCallback) return;

		// Unresolved
		if (waiting[id]) {
			if (typeof waiting[id] === 'function') waiting[id] = [waiting[id], currentCallback];
			else waiting[id].push(currentCallback);
			currentCallback = null;
			return;
		}

		// Resolved, assure next tick invocation
		cb = currentCallback;
		context = currentContext;
		args = currentArgs;
		currentCallback = currentContext = currentArgs = null;
		nextTick(function () {
			var data;
			if (hasOwnProperty.call(cache, id)) {
				data = cache[id];
				conf.emit('getasync', id, args, context);
				apply.call(cb, data.context, data.args);
			} else {
				// Purged in a meantime, we shouldn't rely on cached value, recall
				currentCallback = cb;
				currentContext = context;
				currentArgs = args;
				base.apply(context, args);
			}
		});
	});

	// Not from cache
	conf.original = function () {
		var args, cb, origCb, result;
		if (!currentCallback) return apply.call(original, this, arguments);
		args = aFrom(arguments);
		cb = function self(err) {
			var cb, args, id = self.id;
			if (id == null) {
				// Shouldn't happen, means async callback was called sync way
				nextTick(apply.bind(self, this, arguments));
				return;
			}
			delete self.id;
			cb = waiting[id];
			delete waiting[id];
			if (!cb) {
				// Already processed,
				// outcome of race condition: asyncFn(1, cb), asyncFn.clear(), asyncFn(1, cb)
				return;
			}
			args = aFrom(arguments);
			if (conf.has(id)) {
				if (err) {
					conf.delete(id);
				} else {
					cache[id] = { context: this, args: args };
					conf.emit('setasync', id, (typeof cb === 'function') ? 1 : cb.length);
				}
			}
			if (typeof cb === 'function') {
				result = apply.call(cb, this, args);
			} else {
				cb.forEach(function (cb) { result = apply.call(cb, this, args); }, this);
			}
			return result;
		};
		origCb = currentCallback;
		currentCallback = currentContext = currentArgs = null;
		args.push(cb);
		result = apply.call(original, this, args);
		cb.cb = origCb;
		currentCallback = cb;
		return result;
	};

	// After not from cache call
	conf.on('set', function (id) {
		if (!currentCallback) {
			conf.delete(id);
			return;
		}
		if (waiting[id]) {
			// Race condition: asyncFn(1, cb), asyncFn.clear(), asyncFn(1, cb)
			if (typeof waiting[id] === 'function') waiting[id] = [waiting[id], currentCallback.cb];
			else waiting[id].push(currentCallback.cb);
		} else {
			waiting[id] = currentCallback.cb;
		}
		delete currentCallback.cb;
		currentCallback.id = id;
		currentCallback = null;
	});

	// On delete
	conf.on('delete', function (id) {
		var result;
		// If false, we don't have value yet, so we assume that intention is not
		// to memoize this call. After value is obtained we don't cache it but
		// gracefully pass to callback
		if (hasOwnProperty.call(waiting, id)) return;
		if (!cache[id]) return;
		result = cache[id];
		delete cache[id];
		conf.emit('deleteasync', id, result);
	});

	// On clear
	conf.on('clear', function () {
		var oldCache = cache;
		cache = create(null);
		conf.emit('clearasync', oldCache);
	});
};

},{"../lib/registered-extensions":110,"es5-ext/array/from":31,"es5-ext/function/_define-length":37,"es5-ext/object/mixin":71,"next-tick":117}],103:[function(require,module,exports){
// Call dispose callback on each cache purge

'use strict';

var callable   = require('es5-ext/object/valid-callable')
  , forEach    = require('es5-ext/object/for-each')
  , extensions = require('../lib/registered-extensions')

  , slice = Array.prototype.slice, apply = Function.prototype.apply;

extensions.dispose = function (dispose, conf, options) {
	var del;
	callable(dispose);
	if (options.async && extensions.async) {
		conf.on('deleteasync', del = function (id, result) {
			apply.call(dispose, null, slice.call(result.args, 1));
		});
		conf.on('clearasync', function (cache) {
			forEach(cache, function (result, id) { del(id, result); });
		});
		return;
	}
	conf.on('delete', del = function (id, result) { dispose(result); });
	conf.on('clear', function (cache) {
		forEach(cache, function (result, id) { del(id, result); });
	});
};

},{"../lib/registered-extensions":110,"es5-ext/object/for-each":63,"es5-ext/object/valid-callable":77}],104:[function(require,module,exports){
// Timeout cached values

'use strict';

var aFrom      = require('es5-ext/array/from')
  , noop       = require('es5-ext/function/noop')
  , forEach    = require('es5-ext/object/for-each')
  , timeout    = require('timers-ext/valid-timeout')
  , extensions = require('../lib/registered-extensions')

  , max = Math.max, min = Math.min, create = Object.create;

extensions.maxAge = function (maxAge, conf, options) {
	var timeouts, postfix, preFetchAge, preFetchTimeouts;

	maxAge = timeout(maxAge);
	if (!maxAge) return;

	timeouts = create(null);
	postfix = (options.async && extensions.async) ? 'async' : '';
	conf.on('set' + postfix, function (id) {
		timeouts[id] = setTimeout(function () { conf.delete(id); }, maxAge);
		if (!preFetchTimeouts) return;
		if (preFetchTimeouts[id]) clearTimeout(preFetchTimeouts[id]);
		preFetchTimeouts[id] = setTimeout(function () {
			delete preFetchTimeouts[id];
		}, preFetchAge);
	});
	conf.on('delete' + postfix, function (id) {
		clearTimeout(timeouts[id]);
		delete timeouts[id];
		if (!preFetchTimeouts) return;
		clearTimeout(preFetchTimeouts[id]);
		delete preFetchTimeouts[id];
	});

	if (options.preFetch) {
		if ((options.preFetch === true) || isNaN(options.preFetch)) {
			preFetchAge = 0.333;
		} else {
			preFetchAge = max(min(Number(options.preFetch), 1), 0);
		}
		if (preFetchAge) {
			preFetchTimeouts = {};
			preFetchAge = (1 - preFetchAge) * maxAge;
			conf.on('get' + postfix, function (id, args, context) {
				if (!preFetchTimeouts[id]) {
					preFetchTimeouts[id] =  setTimeout(function () {
						delete preFetchTimeouts[id];
						conf.delete(id);
						if (options.async) {
							args = aFrom(args);
							args.push(noop);
						}
						conf.memoized.apply(context, args);
					}, 0);
				}
			});
		}
	}

	conf.on('clear' + postfix, function () {
		forEach(timeouts, function (id) { clearTimeout(id); });
		timeouts = {};
		if (preFetchTimeouts) {
			forEach(preFetchTimeouts, function (id) { clearTimeout(id); });
			preFetchTimeouts = {};
		}
	});
};

},{"../lib/registered-extensions":110,"es5-ext/array/from":31,"es5-ext/function/noop":40,"es5-ext/object/for-each":63,"timers-ext/valid-timeout":125}],105:[function(require,module,exports){
// Limit cache size, LRU (least recently used) algorithm.

'use strict';

var toPosInteger = require('es5-ext/number/to-pos-integer')
  , lruQueue     = require('lru-queue')
  , extensions   = require('../lib/registered-extensions');

extensions.max = function (max, conf, options) {
	var postfix, queue, hit;

	max = toPosInteger(max);
	if (!max) return;

	queue = lruQueue(max);
	postfix = (options.async && extensions.async) ? 'async' : '';

	conf.on('set' + postfix, hit = function (id) {
		id = queue.hit(id);
		if (id === undefined) return;
		conf.delete(id);
	});
	conf.on('get' + postfix, hit);
	conf.on('delete' + postfix, queue.delete);
	conf.on('clear' + postfix, queue.clear);
};

},{"../lib/registered-extensions":110,"es5-ext/number/to-pos-integer":55,"lru-queue":116}],106:[function(require,module,exports){
// Reference counter, useful for garbage collector like functionality

'use strict';

var d          = require('d')
  , extensions = require('../lib/registered-extensions')

  , create = Object.create, defineProperties = Object.defineProperties;

extensions.refCounter = function (ignore, conf, options) {
	var cache, postfix;

	cache = create(null);
	postfix = (options.async && extensions.async) ? 'async' : '';

	conf.on('set' + postfix, function (id, length) { cache[id] = length || 1; });
	conf.on('get' + postfix, function (id) { ++cache[id]; });
	conf.on('delete' + postfix, function (id) { delete cache[id]; });
	conf.on('clear' + postfix, function () { cache = {}; });

	defineProperties(conf.memoized, {
		deleteRef: d(function () {
			var id = conf.get(arguments);
			if (id === null) return null;
			if (!cache[id]) return null;
			if (!--cache[id]) {
				conf.delete(id);
				return true;
			}
			return false;
		}),
		getRefCount: d(function () {
			var id = conf.get(arguments);
			if (id === null) return 0;
			if (!cache[id]) return 0;
			return cache[id];
		})
	});
};

},{"../lib/registered-extensions":110,"d":25}],107:[function(require,module,exports){
'use strict';

var normalizeOpts = require('es5-ext/object/normalize-options')
  , resolveLength = require('./lib/resolve-length')
  , plain         = require('./plain');

module.exports = function (fn/*, options*/) {
	var options = normalizeOpts(arguments[1]), length;

	if (!options.normalizer) {
		length = options.length = resolveLength(options.length, fn.length, options.async);
		if (length !== 0) {
			if (options.primitive) {
				if (length === false) {
					options.normalizer = require('./normalizers/primitive');
				} else if (length > 1) {
					options.normalizer = require('./normalizers/get-primitive-fixed')(length);
				}
			} else {
				if (length === false) options.normalizer = require('./normalizers/get')();
				else if (length === 1) options.normalizer = require('./normalizers/get-1')();
				else options.normalizer = require('./normalizers/get-fixed')(length);
			}
		}
	}

	// Assure extensions
	if (options.async) require('./ext/async');
	if (options.dispose) require('./ext/dispose');
	if (options.maxAge) require('./ext/max-age');
	if (options.max) require('./ext/max');
	if (options.refCounter) require('./ext/ref-counter');

	return plain(fn, options);
};

},{"./ext/async":102,"./ext/dispose":103,"./ext/max":105,"./ext/max-age":104,"./ext/ref-counter":106,"./lib/resolve-length":111,"./normalizers/get":121,"./normalizers/get-1":118,"./normalizers/get-fixed":119,"./normalizers/get-primitive-fixed":120,"./normalizers/primitive":122,"./plain":123,"es5-ext/object/normalize-options":72}],108:[function(require,module,exports){
'use strict';

var customError      = require('es5-ext/error/custom')
  , defineLength     = require('es5-ext/function/_define-length')
  , d                = require('d')
  , ee               = require('event-emitter').methods
  , resolveResolve   = require('./resolve-resolve')
  , resolveNormalize = require('./resolve-normalize')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, hasOwnProperty = Object.prototype.hasOwnProperty
  , defineProperties = Object.defineProperties
  , on = ee.on, emit = ee.emit;

module.exports = function (original, length, options) {
	var cache = create(null), conf, memLength, get, set, del, clear, extDel, normalizer
	  , getListeners, setListeners, deleteListeners, memoized, resolve;
	if (length !== false) memLength = length;
	else if (isNaN(original.length)) memLength = 1;
	else memLength = original.length;

	if (options.normalizer) {
		normalizer = resolveNormalize(options.normalizer);
		get = normalizer.get;
		set = normalizer.set;
		del = normalizer.delete;
		clear = normalizer.clear;
	}
	if (options.resolvers != null) resolve = resolveResolve(options.resolvers);

	if (get) {
		memoized = defineLength(function (arg) {
			var id, result, args = arguments;
			if (resolve) args = resolve(args);
			id = get(args);
			if (id !== null) {
				if (hasOwnProperty.call(cache, id)) {
					if (getListeners) conf.emit('get', id, args, this);
					return cache[id];
				}
			}
			if (args.length === 1) result = call.call(original, this, args[0]);
			else result = apply.call(original, this, args);
			if (id === null) {
				id = get(args);
				if (id !== null) throw customError("Circular invocation", 'CIRCULAR_INVOCATION');
				id = set(args);
			} else if (hasOwnProperty.call(cache, id)) {
				throw customError("Circular invocation", 'CIRCULAR_INVOCATION');
			}
			cache[id] = result;
			if (setListeners) conf.emit('set', id);
			return result;
		}, memLength);
	} else if (length === 0) {
		memoized = function () {
			var result;
			if (hasOwnProperty.call(cache, 'data')) {
				if (getListeners) conf.emit('get', 'data', arguments, this);
				return cache.data;
			}
			if (!arguments.length) result = call.call(original, this);
			else result = apply.call(original, this, arguments);
			if (hasOwnProperty.call(cache, 'data')) {
				throw customError("Circular invocation", 'CIRCULAR_INVOCATION');
			}
			cache.data = result;
			if (setListeners) conf.emit('set', 'data');
			return result;
		};
	} else {
		memoized = function (arg) {
			var result, args = arguments, id;
			if (resolve) args = resolve(arguments);
			id = String(args[0]);
			if (hasOwnProperty.call(cache, id)) {
				if (getListeners) conf.emit('get', id, args, this);
				return cache[id];
			}
			if (args.length === 1) result = call.call(original, this, args[0]);
			else result = apply.call(original, this, args);
			if (hasOwnProperty.call(cache, id)) {
				throw customError("Circular invocation", 'CIRCULAR_INVOCATION');
			}
			cache[id] = result;
			if (setListeners) conf.emit('set', id);
			return result;
		};
	}
	conf = {
		original: original,
		memoized: memoized,
		get: function (args) {
			if (resolve) args = resolve(args);
			if (get) return get(args);
			return String(args[0]);
		},
		has: function (id) { return hasOwnProperty.call(cache, id); },
		delete: function (id) {
			var result;
			if (!hasOwnProperty.call(cache, id)) return;
			if (del) del(id);
			result = cache[id];
			delete cache[id];
			if (deleteListeners) conf.emit('delete', id, result);
		},
		clear: function () {
			var oldCache = cache;
			if (clear) clear();
			cache = create(null);
			conf.emit('clear', oldCache);
		},
		on: function (type, listener) {
			if (type === 'get') getListeners = true;
			else if (type === 'set') setListeners = true;
			else if (type === 'delete') deleteListeners = true;
			return on.call(this, type, listener);
		},
		emit: emit,
		updateEnv: function () { original = conf.original; }
	};
	if (get) {
		extDel = defineLength(function (arg) {
			var id, args = arguments;
			if (resolve) args = resolve(args);
			id = get(args);
			if (id === null) return;
			conf.delete(id);
		}, memLength);
	} else if (length === 0) {
		extDel = function () { return conf.delete('data'); };
	} else {
		extDel = function (arg) {
			if (resolve) arg = resolve(arguments)[0];
			return conf.delete(arg);
		};
	}
	defineProperties(memoized, {
		__memoized__: d(true),
		delete: d(extDel),
		clear: d(conf.clear)
	});
	return conf;
};

},{"./resolve-normalize":112,"./resolve-resolve":113,"d":25,"es5-ext/error/custom":35,"es5-ext/function/_define-length":37,"event-emitter":115}],109:[function(require,module,exports){
'use strict';

var forEach       = require('es5-ext/object/for-each')
  , normalizeOpts = require('es5-ext/object/normalize-options')
  , callable      = require('es5-ext/object/valid-callable')
  , lazy          = require('d/lazy')
  , resolveLength = require('./resolve-length')
  , extensions    = require('./registered-extensions');

module.exports = function (memoize) {
	return function (props) {
		forEach(props, function (desc, name) {
			var fn = callable(desc.value), length;
			desc.value = function (options) {
				if (options.getNormalizer) {
					options = normalizeOpts(options);
					if (length === undefined) {
						length = resolveLength(options.length, fn.length, options.async && extensions.async);
					}
					options.normalizer = options.getNormalizer(length);
					delete options.getNormalizer;
				}
				return memoize(fn.bind(this), options);
			};
		});
		return lazy(props);
	};
};

},{"./registered-extensions":110,"./resolve-length":111,"d/lazy":26,"es5-ext/object/for-each":63,"es5-ext/object/normalize-options":72,"es5-ext/object/valid-callable":77}],110:[function(require,module,exports){
'use strict';

},{}],111:[function(require,module,exports){
'use strict';

var toPosInt = require('es5-ext/number/to-pos-integer');

module.exports = function (optsLength, fnLength, isAsync) {
	var length;
	if (isNaN(optsLength)) {
		length = fnLength;
		if (!(length >= 0)) return 1;
		if (isAsync && length) return length - 1;
		return length;
	}
	if (optsLength === false) return false;
	return toPosInt(optsLength);
};

},{"es5-ext/number/to-pos-integer":55}],112:[function(require,module,exports){
'use strict';

var callable = require('es5-ext/object/valid-callable');

module.exports = function (userNormalizer) {
	var normalizer;
	if (typeof userNormalizer === 'function') return { set: userNormalizer, get: userNormalizer };
	normalizer = { get: callable(userNormalizer.get) };
	if (userNormalizer.set !== undefined) {
		normalizer.set = callable(userNormalizer.set);
		normalizer.delete = callable(userNormalizer.delete);
		normalizer.clear = callable(userNormalizer.clear);
		return normalizer;
	}
	normalizer.set = normalizer.get;
	return normalizer;
};

},{"es5-ext/object/valid-callable":77}],113:[function(require,module,exports){
'use strict';

var toArray  = require('es5-ext/array/to-array')
  , callable = require('es5-ext/object/valid-callable')

  , slice = Array.prototype.slice
  , resolveArgs;

resolveArgs = function (args) {
	return this.map(function (r, i) {
		return r ? r(args[i]) : args[i];
	}).concat(slice.call(args, this.length));
};

module.exports = function (resolvers) {
	resolvers = toArray(resolvers);
	resolvers.forEach(function (r) {
		if (r != null) callable(r);
	});
	return resolveArgs.bind(resolvers);
};

},{"es5-ext/array/to-array":34,"es5-ext/object/valid-callable":77}],114:[function(require,module,exports){
'use strict';

module.exports = require('./lib/methods')(require('./'));

},{"./":107,"./lib/methods":109}],115:[function(require,module,exports){
'use strict';

var d        = require('d')
  , callable = require('es5-ext/object/valid-callable')

  , apply = Function.prototype.apply, call = Function.prototype.call
  , create = Object.create, defineProperty = Object.defineProperty
  , defineProperties = Object.defineProperties
  , hasOwnProperty = Object.prototype.hasOwnProperty
  , descriptor = { configurable: true, enumerable: false, writable: true }

  , on, once, off, emit, methods, descriptors, base;

on = function (type, listener) {
	var data;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) {
		data = descriptor.value = create(null);
		defineProperty(this, '__ee__', descriptor);
		descriptor.value = null;
	} else {
		data = this.__ee__;
	}
	if (!data[type]) data[type] = listener;
	else if (typeof data[type] === 'object') data[type].push(listener);
	else data[type] = [data[type], listener];

	return this;
};

once = function (type, listener) {
	var once, self;

	callable(listener);
	self = this;
	on.call(this, type, once = function () {
		off.call(self, type, once);
		apply.call(listener, this, arguments);
	});

	once.__eeOnceListener__ = listener;
	return this;
};

off = function (type, listener) {
	var data, listeners, candidate, i;

	callable(listener);

	if (!hasOwnProperty.call(this, '__ee__')) return this;
	data = this.__ee__;
	if (!data[type]) return this;
	listeners = data[type];

	if (typeof listeners === 'object') {
		for (i = 0; (candidate = listeners[i]); ++i) {
			if ((candidate === listener) ||
					(candidate.__eeOnceListener__ === listener)) {
				if (listeners.length === 2) data[type] = listeners[i ? 0 : 1];
				else listeners.splice(i, 1);
			}
		}
	} else {
		if ((listeners === listener) ||
				(listeners.__eeOnceListener__ === listener)) {
			delete data[type];
		}
	}

	return this;
};

emit = function (type) {
	var i, l, listener, listeners, args;

	if (!hasOwnProperty.call(this, '__ee__')) return;
	listeners = this.__ee__[type];
	if (!listeners) return;

	if (typeof listeners === 'object') {
		l = arguments.length;
		args = new Array(l - 1);
		for (i = 1; i < l; ++i) args[i - 1] = arguments[i];

		listeners = listeners.slice();
		for (i = 0; (listener = listeners[i]); ++i) {
			apply.call(listener, this, args);
		}
	} else {
		switch (arguments.length) {
		case 1:
			call.call(listeners, this);
			break;
		case 2:
			call.call(listeners, this, arguments[1]);
			break;
		case 3:
			call.call(listeners, this, arguments[1], arguments[2]);
			break;
		default:
			l = arguments.length;
			args = new Array(l - 1);
			for (i = 1; i < l; ++i) {
				args[i - 1] = arguments[i];
			}
			apply.call(listeners, this, args);
		}
	}
};

methods = {
	on: on,
	once: once,
	off: off,
	emit: emit
};

descriptors = {
	on: d(on),
	once: d(once),
	off: d(off),
	emit: d(emit)
};

base = defineProperties({}, descriptors);

module.exports = exports = function (o) {
	return (o == null) ? create(base) : defineProperties(Object(o), descriptors);
};
exports.methods = methods;

},{"d":25,"es5-ext/object/valid-callable":77}],116:[function(require,module,exports){
'use strict';

var toPosInt = require('es5-ext/number/to-pos-integer')

  , create = Object.create, hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = function (limit) {
	var size = 0, base = 1, queue = create(null), map = create(null), index = 0, del;
	limit = toPosInt(limit);
	return {
		hit: function (id) {
			var oldIndex = map[id], nuIndex = ++index;
			queue[nuIndex] = id;
			map[id] = nuIndex;
			if (!oldIndex) {
				++size;
				if (size <= limit) return;
				id = queue[base];
				del(id);
				return id;
			}
			delete queue[oldIndex];
			if (base !== oldIndex) return;
			while (!hasOwnProperty.call(queue, ++base)) continue; //jslint: skip
		},
		delete: del = function (id) {
			var oldIndex = map[id];
			if (!oldIndex) return;
			delete queue[oldIndex];
			delete map[id];
			--size;
			if (base !== oldIndex) return;
			if (!size) {
				index = 0;
				base = 1;
				return;
			}
			while (!hasOwnProperty.call(queue, ++base)) continue; //jslint: skip
		},
		clear: function () {
			size = 0;
			base = 1;
			queue = create(null);
			map = create(null);
			index = 0;
		}
	};
};

},{"es5-ext/number/to-pos-integer":55}],117:[function(require,module,exports){
(function (process){
'use strict';

var callable, byObserver;

callable = function (fn) {
	if (typeof fn !== 'function') throw new TypeError(fn + " is not a function");
	return fn;
};

byObserver = function (Observer) {
	var node = document.createTextNode(''), queue, i = 0;
	new Observer(function () {
		var data;
		if (!queue) return;
		data = queue;
		queue = null;
		if (typeof data === 'function') {
			data();
			return;
		}
		data.forEach(function (fn) { fn(); });
	}).observe(node, { characterData: true });
	return function (fn) {
		callable(fn);
		if (queue) {
			if (typeof queue === 'function') queue = [queue, fn];
			else queue.push(fn);
			return;
		}
		queue = fn;
		node.data = (i = ++i % 2);
	};
};

module.exports = (function () {
	// Node.js
	if ((typeof process !== 'undefined') && process &&
			(typeof process.nextTick === 'function')) {
		return process.nextTick;
	}

	// MutationObserver=
	if ((typeof document === 'object') && document) {
		if (typeof MutationObserver === 'function') {
			return byObserver(MutationObserver);
		}
		if (typeof WebKitMutationObserver === 'function') {
			return byObserver(WebKitMutationObserver);
		}
	}

	// W3C Draft
	// http://dvcs.w3.org/hg/webperf/raw-file/tip/specs/setImmediate/Overview.html
	if (typeof setImmediate === 'function') {
		return function (cb) { setImmediate(callable(cb)); };
	}

	// Wide available standard
	if (typeof setTimeout === 'function') {
		return function (cb) { setTimeout(callable(cb), 0); };
	}

	return null;
}());

}).call(this,require('_process'))
},{"_process":3}],118:[function(require,module,exports){
'use strict';

var indexOf = require('es5-ext/array/#/e-index-of');

module.exports = function () {
	var lastId = 0, argsMap = [], cache = [];
	return {
		get: function (args) {
			var index = indexOf.call(argsMap, args[0]);
			return (index === -1) ? null : cache[index];
		},
		set: function (args) {
			argsMap.push(args[0]);
			cache.push(++lastId);
			return lastId;
		},
		delete: function (id) {
			var index = indexOf.call(cache, id);
			if (index !== -1) {
				argsMap.splice(index, 1);
				cache.splice(index, 1);
			}
		},
		clear: function () {
			argsMap = [];
			cache = [];
		}
	};
};

},{"es5-ext/array/#/e-index-of":28}],119:[function(require,module,exports){
'use strict';

var indexOf = require('es5-ext/array/#/e-index-of')
  , create = Object.create;

module.exports = function (length) {
	var lastId = 0, map = [[], []], cache = create(null);
	return {
		get: function (args) {
			var index = 0, set = map, i;
			while (index < (length - 1)) {
				i = indexOf.call(set[0], args[index]);
				if (i === -1) return null;
				set = set[1][i];
				++index;
			}
			i = indexOf.call(set[0], args[index]);
			if (i === -1) return null;
			return set[1][i] || null;
		},
		set: function (args) {
			var index = 0, set = map, i;
			while (index < (length - 1)) {
				i = indexOf.call(set[0], args[index]);
				if (i === -1) {
					i = set[0].push(args[index]) - 1;
					set[1].push([[], []]);
				}
				set = set[1][i];
				++index;
			}
			i = indexOf.call(set[0], args[index]);
			if (i === -1) {
				i = set[0].push(args[index]) - 1;
			}
			set[1][i] = ++lastId;
			cache[lastId] = args;
			return lastId;
		},
		delete: function (id) {
			var index = 0, set = map, i, path = [], args = cache[id];
			while (index < (length - 1)) {
				i = indexOf.call(set[0], args[index]);
				if (i === -1) {
					return;
				}
				path.push(set, i);
				set = set[1][i];
				++index;
			}
			i = indexOf.call(set[0], args[index]);
			if (i === -1) {
				return;
			}
			id = set[1][i];
			set[0].splice(i, 1);
			set[1].splice(i, 1);
			while (!set[0].length && path.length) {
				i = path.pop();
				set = path.pop();
				set[0].splice(i, 1);
				set[1].splice(i, 1);
			}
			delete cache[id];
		},
		clear: function () {
			map = [[], []];
			cache = create(null);
		}
	};
};

},{"es5-ext/array/#/e-index-of":28}],120:[function(require,module,exports){
'use strict';

module.exports = function (length) {
	if (!length) {
		return function () { return ''; };
	}
	return function (args) {
		var id = String(args[0]), i = 0, l = length;
		while (--l) { id += '\u0001' + args[++i]; }
		return id;
	};
};

},{}],121:[function(require,module,exports){
'use strict';

var indexOf = require('es5-ext/array/#/e-index-of')
  , create = Object.create;

module.exports = function () {
	var lastId = 0, map = [], cache = create(null);
	return {
		get: function (args) {
			var index = 0, set = map, i, length = args.length;
			if (length === 0) return set[length] || null;
			if ((set = set[length])) {
				while (index < (length - 1)) {
					i = indexOf.call(set[0], args[index]);
					if (i === -1) return null;
					set = set[1][i];
					++index;
				}
				i = indexOf.call(set[0], args[index]);
				if (i === -1) return null;
				return set[1][i] || null;
			}
			return null;
		},
		set: function (args) {
			var index = 0, set = map, i, length = args.length;
			if (length === 0) {
				set[length] = ++lastId;
			} else {
				if (!set[length]) {
					set[length] = [[], []];
				}
				set = set[length];
				while (index < (length - 1)) {
					i = indexOf.call(set[0], args[index]);
					if (i === -1) {
						i = set[0].push(args[index]) - 1;
						set[1].push([[], []]);
					}
					set = set[1][i];
					++index;
				}
				i = indexOf.call(set[0], args[index]);
				if (i === -1) {
					i = set[0].push(args[index]) - 1;
				}
				set[1][i] = ++lastId;
			}
			cache[lastId] = args;
			return lastId;
		},
		delete: function (id) {
			var index = 0, set = map, i, args = cache[id], length = args.length
			  , path = [];
			if (length === 0) {
				delete set[length];
			} else if ((set = set[length])) {
				while (index < (length - 1)) {
					i = indexOf.call(set[0], args[index]);
					if (i === -1) {
						return;
					}
					path.push(set, i);
					set = set[1][i];
					++index;
				}
				i = indexOf.call(set[0], args[index]);
				if (i === -1) {
					return;
				}
				id = set[1][i];
				set[0].splice(i, 1);
				set[1].splice(i, 1);
				while (!set[0].length && path.length) {
					i = path.pop();
					set = path.pop();
					set[0].splice(i, 1);
					set[1].splice(i, 1);
				}
			}
			delete cache[id];
		},
		clear: function () {
			map = [];
			cache = create(null);
		}
	};
};

},{"es5-ext/array/#/e-index-of":28}],122:[function(require,module,exports){
'use strict';

module.exports = function (args) {
	var id, i, length = args.length;
	if (!length) return '\u0002';
	id = String(args[i = 0]);
	while (--length) id += '\u0001' + args[++i];
	return id;
};

},{}],123:[function(require,module,exports){
'use strict';

var callable      = require('es5-ext/object/valid-callable')
  , forEach       = require('es5-ext/object/for-each')
  , extensions    = require('./lib/registered-extensions')
  , configure     = require('./lib/configure-map')
  , resolveLength = require('./lib/resolve-length')

  , hasOwnProperty = Object.prototype.hasOwnProperty;

module.exports = function self(fn/*, options */) {
	var options, length, conf;

	callable(fn);
	options = Object(arguments[1]);

	// Do not memoize already memoized function
	if (hasOwnProperty.call(fn, '__memoized__') && !options.force) return fn;

	// Resolve length;
	length = resolveLength(options.length, fn.length, options.async && extensions.async);

	// Configure cache map
	conf = configure(fn, length, options);

	// Bind eventual extensions
	forEach(extensions, function (fn, name) {
		if (options[name]) fn(options[name], conf, options);
	});

	if (self.__profiler__) self.__profiler__(conf);

	conf.updateEnv();
	return conf.memoized;
};

},{"./lib/configure-map":108,"./lib/registered-extensions":110,"./lib/resolve-length":111,"es5-ext/object/for-each":63,"es5-ext/object/valid-callable":77}],124:[function(require,module,exports){
'use strict';

module.exports = 2147483647;

},{}],125:[function(require,module,exports){
'use strict';

var toPosInt   = require('es5-ext/number/to-pos-integer')
  , maxTimeout = require('./max-timeout');

module.exports = function (value) {
	value = toPosInt(value);
	if (value > maxTimeout) throw new TypeError(value + " exceeds maximum possible timeout");
	return value;
};

},{"./max-timeout":124,"es5-ext/number/to-pos-integer":55}],126:[function(require,module,exports){
'use strict';

module.exports = '\x1b[2J\x1b[0;0H';

},{}],127:[function(require,module,exports){
'use strict';

var reAnsi        = require('ansi-regex')
  , stringifiable = require('es5-ext/object/validate-stringifiable-value')
  , length        = require('./get-stripped-length')
  , sgr           = require('./lib/sgr')

  , max = Math.max;

var Token = function Token(token) {
	this.token = token;
};

var tokenize = function (str) {
	var match = reAnsi().exec(str);

	if (!match) {
		return [ str ];
	}

	var index = match.index
	  , head, prehead, tail;

	if (index === 0) {
		head = match[0];
		tail = str.slice(head.length);

		return [ new Token(head) ].concat(tokenize(tail));
	}

	prehead = str.slice(0, index);
	head = match[0];
	tail = str.slice(index + head.length);

	return [ prehead, new Token(head) ].concat(tokenize(tail));
};

var isChunkInSlice = function (chunk, index, begin, end) {
	var endIndex = chunk.length + index;

	if (begin > endIndex) return false;
	if (end < index) return false;
	return true;
};

var sliceSeq = function (seq, begin, end) {
	var sliced = seq.reduce(function (state, chunk) {
		var index = state.index;

		if (!(chunk instanceof Token)) {
			var nextChunk = '';

			if (isChunkInSlice(chunk, index, begin, end)) {
				var relBegin = Math.max(begin - index, 0)
				  , relEnd   = Math.min(end - index, chunk.length);

				nextChunk = chunk.slice(relBegin, relEnd);
			}

			state.seq.push(nextChunk);
			state.index = index + chunk.length;
		} else {
			var code = sgr.extractCode(chunk.token);

			if (index <= begin) {
				if (code in sgr.openers) {
					sgr.openStyle(state.preOpeners, code);
				}
				if (code in sgr.closers) {
					sgr.closeStyle(state.preOpeners, code);
				}
			} else if (index < end) {
				if (code in sgr.openers) {
					sgr.openStyle(state.inOpeners, code);
					state.seq.push(chunk);
				} else if (code in sgr.closers) {
					state.inClosers.push(code);
					state.seq.push(chunk);
				}
			}
		}

		return state;
	}, {
		index: 0,
		seq: [],

		// preOpeners -> [ mod ]
		// preOpeners must be prepended to the slice if they wasn't closed til the end of it
		// preOpeners must be closed if they wasn't closed til the end of the slice
		preOpeners: [],

		// inOpeners  -> [ mod ]
		// inOpeners already in the slice and must not be prepended to the slice
		// inOpeners must be closed if they wasn't closed til the end of the slice
		inOpeners:  [], // opener CSI inside slice

		// inClosers -> [ code ]
		// closer CSIs for determining which pre/in-Openers must be closed
		inClosers:  []
	});

	sliced.seq = [].concat(
		sgr.prepend(sliced.preOpeners),
		sliced.seq,
		sgr.complete([].concat(sliced.preOpeners, sliced.inOpeners), sliced.inClosers)
	);

	return sliced.seq;
};

module.exports = function (str/*, begin, end*/) {
	var seq, begin = Number(arguments[1]), end = Number(arguments[2]), len;

	str = stringifiable(str);
	len = length(str);

	if (isNaN(begin)) {
		begin = 0;
	}
	if (isNaN(end)) {
		end = len;
	}
	if (begin < 0) {
		begin = max(len + begin, 0);
	}
	if (end < 0) {
		end = max(len + end, 0);
	}

	seq = tokenize(str);
	seq = sliceSeq(seq, begin, end);
	return seq.map(function (chunk) {
		if (chunk instanceof Token) {
			return chunk.token;
		}

		return chunk;
	}).join('');
};

},{"./get-stripped-length":17,"./lib/sgr":19,"ansi-regex":23,"es5-ext/object/validate-stringifiable-value":80}],128:[function(require,module,exports){
// Strip ANSI formatting from string

'use strict';

var stringifiable = require('es5-ext/object/validate-stringifiable')
  , r             = require('ansi-regex')();

module.exports = function (str) { return stringifiable(str).replace(r, ''); };

},{"ansi-regex":23,"es5-ext/object/validate-stringifiable":81}],129:[function(require,module,exports){
'use strict';

var compose      = require('es5-ext/function/#/compose')
  , callable     = require('es5-ext/object/valid-callable')
  , d            = require('d')
  , validTimeout = require('timers-ext/valid-timeout')

  , chars = '-\\|/', l = chars.length, ThrobberIterator;

ThrobberIterator = function () {};
Object.defineProperties(ThrobberIterator.prototype, {
	index: d(-1),
	running: d(false),
	next: d(function () {
		var str = this.running ? '\u0008' : '';
		if (!this.running) this.running = true;
		return str + chars[this.index = ((this.index + 1) % l)];
	}),
	reset: d(function () {
		if (!this.running) return '';
		this.index = -1;
		this.running = false;
		return '\u0008';
	})
});

module.exports = exports = function (write, interval/*, format*/) {
	var format = arguments[2], token, iterator = new ThrobberIterator();
	callable(write);
	interval = validTimeout(interval);
	if (format !== undefined) write = compose.call(write, callable(format));
	return {
		start: function () {
			if (token) return;
			token = setInterval(function () { write(iterator.next()); }, interval);
		},
		restart: function () {
			this.stop();
			this.start();
		},
		stop: function () {
			if (!token) return;
			clearInterval(token);
			token = null;
			write(iterator.reset());
		}
	};
};

Object.defineProperty(exports, 'Iterator', d(ThrobberIterator));

},{"d":25,"es5-ext/function/#/compose":36,"es5-ext/object/valid-callable":77,"timers-ext/valid-timeout":125}],130:[function(require,module,exports){
(function (process){
'use strict';

var d = require('d');

Object.defineProperties(exports, {
	width: d.gs('ce', function () { return process.stdout.columns || 0; }),
	height: d.gs('ce', function () { return process.stdout.rows || 0; })
});

}).call(this,require('_process'))
},{"_process":3,"d":25}],131:[function(require,module,exports){
// Generated by LiveScript 1.3.1
(function(){
  var attrMap, getNodeAtPath;
  attrMap = require('grasp-syntax-javascript').attrMap;
  getNodeAtPath = function(node, path){
    var i$, len$, prop, that;
    for (i$ = 0, len$ = path.length; i$ < len$; ++i$) {
      prop = path[i$];
      if ((that = node[attrMap[prop] || prop]) != null) {
        node = that;
      } else {
        return;
      }
    }
    return node;
  };
  module.exports = {
    getNodeAtPath: getNodeAtPath
  };
}).call(this);

},{"grasp-syntax-javascript":139}],132:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var parse, matchNode, VERSION, query, queryParsed;
  parse = require('./parse').parse;
  matchNode = require('./match').matchNode;
  VERSION = '0.3.1';
  query = function(selector, ast){
    return queryParsed(parse(selector), ast);
  };
  queryParsed = function(parsedSelector, ast){
    var results;
    results = [];
    matchNode(results, parsedSelector, ast);
    return results;
  };
  module.exports = {
    parse: parse,
    queryParsed: queryParsed,
    query: query,
    VERSION: VERSION
  };
}).call(this);

},{"./match":133,"./parse":134}],133:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, primitiveOnlyAttributes, eitherAttributes, syntaxFlat, all, tail, getNodeAtPath, toString$ = {}.toString, slice$ = [].slice;
  ref$ = require('grasp-syntax-javascript'), primitiveOnlyAttributes = ref$.primitiveOnlyAttributes, eitherAttributes = ref$.eitherAttributes, syntaxFlat = ref$.syntaxFlat;
  ref$ = require('prelude-ls'), all = ref$.all, tail = ref$.tail;
  getNodeAtPath = require('./common').getNodeAtPath;
  function matchNode(results, query, mainNode){
    var spec, i$, ref$, len$, key, j$, ref1$, len1$, subNode;
    if (eq(mainNode, query)) {
      results.push(mainNode);
    }
    spec = syntaxFlat[mainNode.type];
    for (i$ = 0, len$ = (ref$ = spec.nodes || []).length; i$ < len$; ++i$) {
      key = ref$[i$];
      if (mainNode[key]) {
        matchNode(results, query, mainNode[key]);
      }
    }
    for (i$ = 0, len$ = (ref$ = spec.nodeArrays || []).length; i$ < len$; ++i$) {
      key = ref$[i$];
      for (j$ = 0, len1$ = (ref1$ = mainNode[key]).length; j$ < len1$; ++j$) {
        subNode = ref1$[j$];
        if (subNode) {
          matchNode(results, query, subNode);
        }
      }
    }
    function eq(targetNode, selectorNode){
      var type, spec;
      if (targetNode === selectorNode) {
        return true;
      } else if (selectorNode.type === 'Grasp') {
        return matchSpecial(targetNode, selectorNode);
      } else if (selectorNode.type === targetNode.type) {
        type = selectorNode.type;
        spec = syntaxFlat[type];
        return all(function(it){
          return eq(targetNode[it], selectorNode[it]);
        }, spec.nodes || []) && all(function(it){
          return matchArray(targetNode[it], selectorNode[it]);
        }, spec.nodeArrays || []) && all(function(it){
          return targetNode[it] === selectorNode[it];
        }, spec.primitives || []);
      } else {
        return false;
      }
    }
    function matchArray(input, pattern){
      var that, ref$, patternFirst, patternRest, inputFirst, inputRest, arrayWildcardName, wildcardName;
      if (toString$.call(pattern).slice(8, -1) === 'Object' && pattern.type === 'Grasp') {
        return matchSpecial(input, pattern);
      }
      if (pattern.length === 0) {
        return input.length === 0;
      } else if (pattern.length === 1) {
        if (that = isArrayWildcard(pattern[0])) {
          if (that = that.name) {
            mainNode._named == null && (mainNode._named = {});
            (ref$ = mainNode._named)[that] == null && (ref$[that] = []);
            (ref$ = mainNode._named)[that] = ref$[that].concat(input);
          }
          return true;
        } else {
          return input.length === 1 && eq(input[0], pattern[0]);
        }
      } else if (input.length === 0) {
        return false;
      } else {
        patternFirst = pattern[0], patternRest = slice$.call(pattern, 1);
        inputFirst = input[0], inputRest = slice$.call(input, 1);
        if (that = isArrayWildcard(patternFirst)) {
          if (that = that.name) {
            arrayWildcardName = that;
            mainNode._named == null && (mainNode._named = {});
            (ref$ = mainNode._named)[arrayWildcardName] == null && (ref$[arrayWildcardName] = []);
          }
          if (that = eq(inputFirst, patternRest[0])) {
            wildcardName = that;
            if (matchArray(inputRest, tail(patternRest))) {
              return true;
            } else {
              if (toString$.call(wildcardName).slice(8, -1) === 'String') {
                delete mainNode._named[wildcardName];
              }
              return matchArray(inputRest, pattern);
            }
          } else {
            if (arrayWildcardName) {
              mainNode._named[arrayWildcardName].push(inputFirst);
            }
            return matchArray(inputRest, pattern);
          }
        } else {
          return eq(inputFirst, patternFirst) && matchArray(inputRest, patternRest);
        }
      }
    }
    function matchSpecial(targetNode, selectorNode){
      var named, name, that, identMatch, attrMatch;
      switch (selectorNode.graspType) {
      case 'wildcard':
        return true;
      case 'named-wildcard':
        mainNode._named == null && (mainNode._named = {});
        named = mainNode._named;
        name = selectorNode.name;
        if (that = named[name]) {
          if (eq(targetNode, that)) {
            return true;
          } else {
            return false;
          }
        } else {
          named[name] = targetNode;
          return name;
        }
        break;
      case 'node-type':
        return targetNode.type === selectorNode.value;
      case 'matches':
        return in$(targetNode.type, selectorNode.value);
      case 'literal':
        return targetNode.type === 'Literal' && toString$.call(targetNode.value).slice(8, -1) === selectorNode.value;
      case 'compound':
        identMatch = matchSpecial(targetNode, selectorNode.ident);
        attrMatch = all(matchAttr(targetNode), selectorNode.attrs);
        return identMatch && attrMatch;
      }
    }
    function isArrayWildcard(node){
      var cleanNode;
      cleanNode = node.type === 'ExpressionStatement' ? node.expression : node;
      return cleanNode.type === 'Grasp' && cleanNode.graspType === 'array-wildcard' && cleanNode;
    }
    function matchAttr(targetNode){
      return function(attr){
        var node, attrValue, lastPath, ref$;
        node = getNodeAtPath(targetNode, attr.path);
        if (node != null) {
          attrValue = attr.value;
          if (attrValue) {
            lastPath = (ref$ = attr.path)[ref$.length - 1];
            if (in$(lastPath, primitiveOnlyAttributes)) {
              return matchPrimitive(attr.op, node, attrValue);
            } else if (in$(lastPath, eitherAttributes)) {
              return matchEither(attr.op, node, attrValue);
            } else {
              return matchComplex(attr.op, node, attrValue);
            }
          } else {
            return true;
          }
        } else {
          return false;
        }
      };
    }
    function matchPrimitive(op, node, attrValue){
      if (op === '=') {
        return node === attrValue.value;
      } else {
        return node !== attrValue.value;
      }
    }
    function matchComplex(op, node, attrValue){
      if (op === '=') {
        return eq(node, attrValue);
      } else {
        return !eq(node, attrValue);
      }
    }
    function matchEither(op, node, attrValue){
      return matchPrimitive(op, node, attrValue) || matchComplex(op, node, attrValue);
    }
  }
  module.exports = {
    matchNode: matchNode
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);

},{"./common":131,"grasp-syntax-javascript":139,"prelude-ls":160}],134:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var acorn, ref$, aliasMap, matchesMap, matchesAliasMap, literalMap, getNodeAtPath, toString$ = {}.toString;
  acorn = require('acorn');
  ref$ = require('grasp-syntax-javascript'), aliasMap = ref$.aliasMap, matchesMap = ref$.matchesMap, matchesAliasMap = ref$.matchesAliasMap, literalMap = ref$.literalMap;
  getNodeAtPath = require('./common').getNodeAtPath;
  function parse(selector){
    var attempts, i$, len$, attempt, code, parsedSelector, path, e, selectorBody, extractedSelector, finalSelector, root;
    attempts = [
      {
        code: selector,
        path: []
      }, {
        code: "function f(){ " + selector + "; }",
        path: ['body', 'body', 0]
      }, {
        code: "function* f(){ " + selector + "; }",
        path: ['body', 'body', 0]
      }, {
        code: "(" + selector + ")",
        path: []
      }, {
        code: "while (true) { " + selector + "; }",
        path: ['body', 'body', 0]
      }, {
        code: "switch (x) { " + selector + " }",
        path: ['cases', 0]
      }, {
        code: "try { } " + selector,
        path: ['handlers', 0]
      }
    ];
    for (i$ = 0, len$ = attempts.length; i$ < len$; ++i$) {
      attempt = attempts[i$], code = attempt.code;
      try {
        parsedSelector = acorn.parse(code, {
          ecmaVersion: 6,
          sourceType: 'module'
        });
        path = attempt.path;
        break;
      } catch (e$) {
        e = e$;
        continue;
      }
    }
    if (!parsedSelector) {
      throw new Error("Error processing selector '" + selector + "'.");
    }
    selectorBody = parsedSelector.body;
    if (selectorBody.length > 1) {
      throw new Error("Selector body can't be more than one statement");
    }
    extractedSelector = getNodeAtPath(selectorBody[0], path);
    finalSelector = extractedSelector.type === 'ExpressionStatement' && !/;\s*$/.test(selector) ? extractedSelector.expression : extractedSelector;
    root = {
      type: 'Root',
      value: finalSelector
    };
    processSelector(root);
    return root.value;
  }
  function processSelector(ast){
    var key, node, nodeType, i$, len$, i, n, that;
    delete ast.start;
    delete ast.end;
    for (key in ast) {
      node = ast[key];
      if (key !== 'type') {
        nodeType = toString$.call(node).slice(8, -1);
        if (nodeType === 'Array') {
          for (i$ = 0, len$ = node.length; i$ < len$; ++i$) {
            i = i$;
            n = node[i$];
            if (that = processNode(n)) {
              node[i] = that;
            } else {
              processSelector(n);
            }
          }
        } else if (nodeType === 'Object') {
          if (that = processNode(node)) {
            ast[key] = that;
          } else {
            processSelector(node);
          }
        }
      }
    }
  }
  function processNode(node){
    var name, that, ident, attrs, n, processedAttrs, i$, len$, attr;
    switch (node.type) {
    case 'Identifier':
      name = node.name;
      if (name === '_') {
        return null;
      } else if (name === '__') {
        return {
          type: 'Grasp',
          graspType: 'wildcard'
        };
      } else if (that = /^_\$(\w*)$/.exec(name)) {
        return {
          type: 'Grasp',
          graspType: 'array-wildcard',
          name: that[1]
        };
      } else if (that = /^\$(\w+)$/.exec(name)) {
        return {
          type: 'Grasp',
          graspType: 'named-wildcard',
          name: that[1]
        };
      } else if (that = /^_([_a-zA-Z]+)/.exec(name)) {
        ident = that[1].replace(/_/, '-');
        if (ident in matchesMap || ident in matchesAliasMap) {
          return {
            type: 'Grasp',
            graspType: 'matches',
            value: matchesMap[matchesAliasMap[ident] || ident]
          };
        } else if (ident in literalMap) {
          return {
            type: 'Grasp',
            graspType: 'literal',
            value: literalMap[ident]
          };
        } else {
          return {
            type: 'Grasp',
            graspType: 'node-type',
            value: aliasMap[ident] || ident
          };
        }
      }
      break;
    case 'MemberExpression':
      if (!node.computed) {
        return;
      }
      attrs = [];
      n = node;
      while (n.type === 'MemberExpression') {
        if (!n.computed) {
          return;
        }
        attrs.unshift(n.property);
        n = n.object;
      }
      if (n.type !== 'Identifier') {
        return;
      }
      ident = processNode(n);
      if (!ident) {
        return;
      }
      processedAttrs = [];
      for (i$ = 0, len$ = attrs.length; i$ < len$; ++i$) {
        attr = attrs[i$];
        if (that = processAttr(attr)) {
          processedAttrs.push(that);
        } else {
          return;
        }
      }
      return {
        type: 'Grasp',
        graspType: 'compound',
        ident: ident,
        attrs: processedAttrs
      };
    case 'ExpressionStatement':
      return processNode(node.expression);
    case 'Property':
      if (!(node.key.type === 'Identifier' && node.value.type === 'Identifier')) {
        return;
      }
      if (node.key.name === '_') {
        if (node.value.name === '_') {
          return {
            type: 'Grasp',
            graspType: 'wildcard'
          };
        } else if (/^\$/.test(node.value.name)) {
          return {
            type: 'Grasp',
            graspType: 'array-wildcard',
            name: /^\$(\w*)$/.exec(node.value.name)[1]
          };
        }
      } else if (node.key.name === '$') {
        return {
          type: 'Grasp',
          graspType: 'named-wildcard',
          name: node.value.name
        };
      }
    }
  }
  function processAttr(attr){
    var attrType, path, ref$;
    attrType = attr.type;
    if (attrType === 'Identifier') {
      if (processNode(attr)) {} else {
        return {
          path: [attr.name]
        };
      }
    } else if (attrType === 'MemberExpression') {
      path = getMemberPath(attr);
      if (!path) {
        return;
      }
      return {
        path: path
      };
    } else if ((attrType === 'AssignmentExpression' || attrType === 'BinaryExpression') && ((ref$ = attr.operator) === '=' || ref$ === '!=')) {
      path = getMemberPath(attr.left);
      if (!path) {
        return;
      }
      return {
        path: path,
        op: attr.operator,
        value: attr.right
      };
    }
  }
  function getMemberPath(node){
    var path;
    path = [];
    while (node.type === 'MemberExpression') {
      if (node.computed) {
        return;
      }
      path.unshift(node.property.name);
      node = node.object;
    }
    path.unshift(node.name);
    return path;
  }
  module.exports = {
    parse: parse
  };
}).call(this);

},{"./common":131,"acorn":10,"grasp-syntax-javascript":139}],135:[function(require,module,exports){
// Generated by LiveScript 1.2.0
(function(){
  var syntaxFlat, toString$ = {}.toString;
  syntaxFlat = require('grasp-syntax-javascript').syntaxFlat;
  function Cache(ast){
    var nodes, types;
    this.ast = ast;
    nodes = [];
    types = [];
    visitPre(ast, function(node){
      var type, i$, ref$, len$, property;
      type = node.type;
      if (type === 'ObjectExpression') {
        for (i$ = 0, len$ = (ref$ = node.properties).length; i$ < len$; ++i$) {
          property = ref$[i$];
          property.type = 'Property';
          property.start = property.key.start;
          property.end = property.value.end;
          if (property.key.loc) {
            property.loc = {
              start: property.key.loc.start,
              end: property.value.loc.end
            };
          }
        }
      }
      nodes.push(node);
      types[type] == null && (types[type] = []);
      types[type].push(node);
    });
    this.nodes = nodes;
    this.types = types;
  }
  function visitPre(ast, fn, path){
    var ref$, nodes, nodeArrays, i$, len$, nodeName, node, newPath, nodeArrayName, nodeArray, j$, len1$;
    fn(ast, path);
    ref$ = syntaxFlat[ast.type], nodes = ref$.nodes, nodeArrays = ref$.nodeArrays;
    if (nodes) {
      for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
        nodeName = nodes[i$];
        node = ast[nodeName];
        if (!node) {
          continue;
        }
        newPath = path ? path + "." + nodeName : nodeName;
        visitPre(node, fn, newPath);
      }
    }
    if (nodeArrays) {
      for (i$ = 0, len$ = nodeArrays.length; i$ < len$; ++i$) {
        nodeArrayName = nodeArrays[i$];
        nodeArray = ast[nodeArrayName];
        newPath = path ? path + "." + nodeArrayName : nodeArrayName;
        for (j$ = 0, len1$ = nodeArray.length; j$ < len1$; ++j$) {
          node = nodeArray[j$];
          visitPre(node, fn, newPath);
        }
      }
    }
  }
  function visitChildren(ast, fn){
    var ref$, nodes, nodeArrays, i$, len$, nodeName, nodeArrayName, j$, len1$, node;
    ref$ = syntaxFlat[ast.type], nodes = ref$.nodes, nodeArrays = ref$.nodeArrays;
    if (nodes) {
      for (i$ = 0, len$ = nodes.length; i$ < len$; ++i$) {
        nodeName = nodes[i$];
        fn(ast[nodeName]);
      }
    }
    if (nodeArrays) {
      for (i$ = 0, len$ = nodeArrays.length; i$ < len$; ++i$) {
        nodeArrayName = nodeArrays[i$];
        for (j$ = 0, len1$ = (ref$ = ast[nodeArrayName]).length; j$ < len1$; ++j$) {
          node = ref$[j$];
          fn(node);
        }
      }
    }
  }
  function getPath(obj, key){
    var value, i$, ref$, len$, k, newValue;
    value = obj;
    for (i$ = 0, len$ = (ref$ = key.split('.')).length; i$ < len$; ++i$) {
      k = ref$[i$];
      newValue = value[k];
      if (toString$.call(newValue).slice(8, -1) !== 'Undefined') {
        value = newValue;
      } else {
        return;
      }
    }
    return value;
  }
  module.exports = {
    Cache: Cache,
    visitPre: visitPre,
    visitChildren: visitChildren,
    getPath: getPath
  };
}).call(this);

},{"grasp-syntax-javascript":139}],136:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var VERSION, Cache, parse, ref$, finalMatches, matchAst, queryParsed, query;
  VERSION = '0.3.0';
  Cache = require('./common').Cache;
  parse = require('./parse').parse;
  ref$ = require('./match'), finalMatches = ref$.finalMatches, matchAst = ref$.matchAst;
  queryParsed = function(parsedSelector, ast, cache){
    return finalMatches(matchAst(ast, parsedSelector, cache || new Cache(ast)));
  };
  query = function(selector, ast, cache){
    return queryParsed(parse(selector), ast, cache);
  };
  module.exports = {
    parse: parse,
    queryParsed: queryParsed,
    query: query,
    Cache: Cache,
    VERSION: VERSION
  };
}).call(this);

},{"./common":135,"./match":137,"./parse":138}],137:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, map, any, all, literalMap, syntaxFlat, Cache, visitPre, visitChildren, getPath, toString$ = {}.toString, slice$ = [].slice;
  ref$ = require('prelude-ls'), map = ref$.map, any = ref$.any, all = ref$.all;
  ref$ = require('grasp-syntax-javascript'), literalMap = ref$.literalMap, syntaxFlat = ref$.syntaxFlat;
  ref$ = require('./common'), Cache = ref$.Cache, visitPre = ref$.visitPre, visitChildren = ref$.visitChildren, getPath = ref$.getPath;
  function finalMatches(results){
    var matches, i$, ref$, len$, subjects;
    matches = [];
    if (results.subject.length > 0) {
      for (i$ = 0, len$ = (ref$ = results.subject).length; i$ < len$; ++i$) {
        subjects = ref$[i$];
        matches = matches.concat(subjects);
      }
    } else {
      matches = results.matches;
    }
    return matches;
  }
  function matchAst(ast, selector, cache){
    var subject, matches, isSubject, i$, ref$, len$, node, selVal, name, op, value, valueType, sel, left, props, subjects, leftResults, leftSubject, result, subs, propsLen, hasMatch, previousNode, j$, len1$, i, prop, newNode, k$, len2$, p, nodeInfo, l$, len3$, field, res$, propValue, ref1$, sub, ref2$, matchesSelector, ref3$, rightResults, leftMatches, rightSubject, rightMatches, leftI, leftNode;
    subject = [];
    matches = [];
    if (!selector) {
      return {
        subject: subject,
        matches: matches
      };
    }
    isSubject = selector.subject;
    switch (selector.type) {
    case 'wildcard':
      for (i$ = 0, len$ = (ref$ = cache.nodes).length; i$ < len$; ++i$) {
        node = ref$[i$];
        matches.push(node);
        if (isSubject) {
          subject.push([node]);
        }
      }
      break;
    case 'root':
      matches.push(ast);
      if (isSubject) {
        subject.push([ast]);
      }
      break;
    case 'identifier':
      if (cache.types.hasOwnProperty(selector.value)) {
        for (i$ = 0, len$ = (ref$ = cache.types[selector.value]).length; i$ < len$; ++i$) {
          node = ref$[i$];
          matches.push(node);
          if (isSubject) {
            subject.push([node]);
          }
        }
      }
      break;
    case 'nth-child':
      visitPre(ast, function(node){
        var index, i$, val, len;
        index = selector.index.value;
        for (i$ in node) {
          val = node[i$];
          if (toString$.call(val).slice(8, -1) === 'Array') {
            len = val.length;
            if (0 <= index && index < len) {
              matches.push(val[index]);
              if (isSubject) {
                subject.push([val[index]]);
              }
            }
          }
        }
      });
      break;
    case 'nth-last-child':
      visitPre(ast, function(node){
        var index, i$, val, len, i;
        index = selector.index.value;
        for (i$ in node) {
          val = node[i$];
          if (toString$.call(val).slice(8, -1) === 'Array') {
            len = val.length;
            i = len - index - 1;
            if (0 <= i && i < len) {
              matches.push(val[i]);
              if (isSubject) {
                subject.push([val[i]]);
              }
            }
          }
        }
      });
      break;
    case 'attribute':
      selVal = selector.value;
      name = selector.name;
      if (selVal != null) {
        op = selector.operator;
        value = selVal.value;
        valueType = toString$.call(value).slice(8, -1);
        switch (selector.valType) {
        case 'primitive':
          switch (selVal.type) {
          case 'literal':
            visitPre(ast, function(node){
              if (isMatchPrimitiveLiteral(getPath(node, name), op, value, valueType)) {
                matches.push(node);
                if (isSubject) {
                  subject.push([node]);
                }
              }
            });
            break;
          case 'type':
            visitPre(ast, function(node){
              if (isMatchType(getPath(node, name), op, value)) {
                matches.push(node);
                if (isSubject) {
                  subject.push([node]);
                }
              }
            });
          }
          break;
        case 'either':
          sel = selVal.sel;
          visitPre(ast, function(node){
            var nodeValue;
            nodeValue = getPath(node, name);
            if ('object' === typeof nodeValue && (nodeValue != null && nodeValue.type) && isMatchComplex(nodeValue, op, value, sel) || isMatchPrimitiveLiteral(nodeValue, op, value, valueType)) {
              matches.push(node);
              if (isSubject) {
                subject.push([node]);
              }
            }
          });
          break;
        case 'complex':
          visitPre(ast, function(node){
            if (isMatchComplex(getPath(node, name), op, value, selVal)) {
              matches.push(node);
              if (isSubject) {
                subject.push([node]);
              }
            }
          });
        }
      } else {
        visitPre(ast, function(node){
          if (getPath(node, name) != null) {
            matches.push(node);
            if (isSubject) {
              subject.push([node]);
            }
          }
        });
      }
      break;
    case 'prop':
      left = selector.left, props = selector.props, subjects = selector.subjects;
      leftResults = finalMatches(matchAst(ast, left, cache));
      leftSubject = left.subject;
      for (i$ = 0, len$ = leftResults.length; i$ < len$; ++i$) {
        result = leftResults[i$];
        node = result;
        subs = [];
        propsLen = props.length;
        hasMatch = false;
        for (j$ = 0, len1$ = props.length; j$ < len1$; ++j$) {
          i = j$;
          prop = props[j$];
          previousNode = node;
          if (prop.type === 'wildcard') {
            if (toString$.call(node).slice(8, -1) === 'Array') {
              newNode = [];
              for (k$ = 0, len2$ = node.length; k$ < len2$; ++k$) {
                p = node[k$];
                nodeInfo = syntaxFlat[p.type];
                for (l$ = 0, len3$ = (ref$ = nodeInfo.nodes.concat(nodeInfo.nodeArrays)).length; l$ < len3$; ++l$) {
                  field = ref$[l$];
                  if (p[field] != null) {
                    newNode.push(p[field]);
                  }
                }
              }
              node = newNode;
            } else {
              nodeInfo = syntaxFlat[node.type];
              res$ = [];
              for (k$ = 0, len2$ = (ref$ = nodeInfo.nodes.concat(nodeInfo.nodeArrays)).length; k$ < len2$; ++k$) {
                field = ref$[k$];
                if (node[field] != null) {
                  res$.push(node[field]);
                }
              }
              node = res$;
            }
          } else if (prop.type === 'string') {
            propValue = prop.value;
            if (toString$.call(node).slice(8, -1) === 'Array') {
              res$ = [];
              for (k$ = 0, len2$ = node.length; k$ < len2$; ++k$) {
                p = node[k$];
                if (p[propValue] != null) {
                  res$.push(p[propValue]);
                }
              }
              node = res$;
            } else {
              node = node[propValue];
            }
          } else if (toString$.call(node).slice(8, -1) === 'Array') {
            switch (prop.type) {
            case 'first':
            case 'head':
              node = node[0];
              break;
            case 'tail':
              node = node.slice(1);
              break;
            case 'last':
              node = node[node.length - 1];
              break;
            case 'initial':
              node = node.slice(0, node.length - 1);
              break;
            case 'nth':
              node = node[prop.index.value];
              break;
            case 'nth-last':
              node = node[node.length - prop.index.value - 1];
              break;
            case 'slice':
              node = node.slice.apply(node, map(fn$, prop.indicies));
            }
          } else {
            break;
          }
          if (node == null) {
            break;
          }
          if (toString$.call(node).slice(8, -1) === 'String' && prop.value === 'operator') {
            node = {
              type: 'Operator',
              value: node,
              loc: {
                start: (ref$ = previousNode.left.loc) != null ? ref$.end : void 8,
                end: (ref1$ = previousNode.right.loc) != null ? ref1$.start : void 8
              },
              raw: node
            };
          }
          if (node.type != null) {
            if (subjects[i]) {
              subs.push(node);
            }
          } else if (toString$.call(node).slice(8, -1) === 'Array' && node.length) {
            if (subjects[i]) {
              subs = subs.concat(node);
            }
          } else {
            break;
          }
          if (i === propsLen - 1) {
            hasMatch = true;
          }
        }
        if (hasMatch) {
          if (toString$.call(node).slice(8, -1) === 'Array') {
            matches = matches.concat(node);
          } else {
            matches.push(node);
          }
          if (leftSubject) {
            subject.push([result]);
          }
          if (subs.length) {
            for (j$ = 0, len1$ = subs.length; j$ < len1$; ++j$) {
              sub = subs[j$];
              subject.push([sub]);
            }
          }
        }
      }
      break;
    case 'matches':
      for (i$ = 0, len$ = (ref2$ = selector.selectors).length; i$ < len$; ++i$) {
        matchesSelector = ref2$[i$];
        for (j$ = 0, len1$ = (ref3$ = finalMatches(matchAst(ast, matchesSelector, cache))).length; j$ < len1$; ++j$) {
          node = ref3$[j$];
          matches.push(node);
          if (isSubject) {
            subject.push([node]);
          }
        }
      }
      break;
    case 'not':
      rightResults = [];
      for (i$ = 0, len$ = (ref2$ = selector.selectors).length; i$ < len$; ++i$) {
        sel = ref2$[i$];
        rightResults = rightResults.concat(finalMatches(matchAst(ast, sel, cache)));
      }
      visitPre(ast, function(node){
        if (!in$(node, rightResults)) {
          matches.push(node);
          if (isSubject) {
            subject.push([node]);
          }
        }
      });
      break;
    case 'compound':
      res$ = [];
      for (i$ = 0, len$ = (ref2$ = selector.selectors).length; i$ < len$; ++i$) {
        sel = ref2$[i$];
        res$.push(finalMatches(matchAst(ast, sel, cache)));
      }
      rightResults = res$;
      isSubject = isSubject || any(function(it){
        return it.subject;
      }, selector.selectors);
      for (i$ = 0, len$ = (ref2$ = rightResults[0]).length; i$ < len$; ++i$) {
        node = ref2$[i$];
        if (all((fn1$), slice$.call(rightResults, 1))) {
          matches.push(node);
          if (isSubject) {
            subject.push([node]);
          }
        }
      }
      break;
    case 'descendant':
      ref2$ = matchAst(ast, selector.left, cache), leftSubject = ref2$.subject, leftMatches = ref2$.matches;
      ref2$ = matchAst(ast, selector.right, cache), rightSubject = ref2$.subject, rightMatches = ref2$.matches;
      for (i$ = 0, len$ = leftMatches.length; i$ < len$; ++i$) {
        leftI = i$;
        leftNode = leftMatches[i$];
        visitPre(leftNode, fn2$);
      }
      break;
    case 'child':
      ref2$ = matchAst(ast, selector.left, cache), leftSubject = ref2$.subject, leftMatches = ref2$.matches;
      ref2$ = matchAst(ast, selector.right, cache), rightSubject = ref2$.subject, rightMatches = ref2$.matches;
      for (i$ = 0, len$ = leftMatches.length; i$ < len$; ++i$) {
        leftI = i$;
        leftNode = leftMatches[i$];
        visitChildren(leftNode, fn3$);
      }
      break;
    case 'sibling':
      ref2$ = matchAst(ast, selector.left, cache), leftSubject = ref2$.subject, leftMatches = ref2$.matches;
      ref2$ = matchAst(ast, selector.right, cache), rightSubject = ref2$.subject, rightMatches = ref2$.matches;
      visitPre(ast, function(node, context){
        var key, val, i$, len$, i, x, leftI, j, rightI, newSubject, that;
        for (key in node) {
          val = node[key];
          if (toString$.call(val).slice(8, -1) === 'Array') {
            for (i$ = 0, len$ = val.length; i$ < len$; ++i$) {
              i = i$;
              x = val[i$];
              leftI = leftMatches.indexOf(x);
              if (leftI > -1) {
                j = i + 1;
                for (; j < val.length; j++) {
                  rightI = rightMatches.indexOf(val[j]);
                  if (rightI > -1) {
                    matches.push(val[j]);
                    newSubject = [];
                    if (that = leftSubject[leftI]) {
                      newSubject = that;
                    }
                    if (that = rightSubject[rightI]) {
                      newSubject = newSubject.concat(that);
                    }
                    if (newSubject.length > 0) {
                      subject.push(newSubject);
                    }
                  }
                }
              }
            }
          }
        }
      });
      break;
    case 'adjacent':
      ref2$ = matchAst(ast, selector.left, cache), leftSubject = ref2$.subject, leftMatches = ref2$.matches;
      ref2$ = matchAst(ast, selector.right, cache), rightSubject = ref2$.subject, rightMatches = ref2$.matches;
      visitPre(ast, function(node, context){
        var key, val, i$, len$, i, x, leftI, rightI, newSubject, that;
        for (key in node) {
          val = node[key];
          if (toString$.call(val).slice(8, -1) === 'Array') {
            for (i$ = 0, len$ = val.length; i$ < len$; ++i$) {
              i = i$;
              x = val[i$];
              leftI = leftMatches.indexOf(x);
              if (leftI > -1) {
                rightI = rightMatches.indexOf(val[i + 1]);
                if (rightI > -1) {
                  matches.push(val[i + 1]);
                  newSubject = [];
                  if (that = leftSubject[leftI]) {
                    newSubject = that;
                  }
                  if (that = rightSubject[rightI]) {
                    newSubject = newSubject.concat(that);
                  }
                  if (newSubject.length > 0) {
                    subject.push(newSubject);
                  }
                }
              }
            }
          }
        }
      });
    }
    return {
      subject: subject,
      matches: matches
    };
    function fn$(it){
      return it.value;
    }
    function fn1$(it){
      return in$(node, it);
    }
    function fn2$(rightNode){
      var rightI, newSubject, that;
      if (leftNode === rightNode) {
        return;
      }
      rightI = rightMatches.indexOf(rightNode);
      if (rightI > -1) {
        matches.push(rightNode);
        newSubject = [];
        if (that = leftSubject[leftI]) {
          newSubject = that;
        }
        if (that = rightSubject[rightI]) {
          newSubject = newSubject.concat(that);
        }
        if (newSubject.length > 0) {
          subject.push(newSubject);
        }
      }
    }
    function fn3$(child){
      var rightI, newSubject, that;
      rightI = rightMatches.indexOf(child);
      if (rightI > -1) {
        matches.push(child);
        newSubject = [];
        if (that = leftSubject[leftI]) {
          newSubject = that;
        }
        if (that = rightSubject[rightI]) {
          newSubject = newSubject.concat(that);
        }
        if (newSubject.length > 0) {
          subject.push(newSubject);
        }
      }
    }
  }
  function isMatchPrimitiveLiteral(nodeValue, op, value, valueType){
    var nodeType;
    nodeType = toString$.call(nodeValue).slice(8, -1);
    if (nodeType === 'Undefined' || nodeType === 'Object') {
      return false;
    }
    return op === '=' && (nodeValue === value || (nodeType === valueType && valueType === 'RegExp') && nodeValue.toString() === value.toString()) || op === '!=' && (nodeType !== 'RegExp' && nodeValue !== value || (nodeType === valueType && valueType === 'RegExp') && nodeValue.toString() !== value.toString()) || (op === '=~' || op === '~=') && value.test(nodeValue) || op === '<=' && nodeValue <= value || op === '>=' && nodeValue >= value || op === '<' && nodeValue < value || op === '>' && nodeValue > value;
  }
  function isMatchType(nodeValue, op, value){
    var test;
    test = (literalMap[value] || value).match(RegExp(toString$.call(nodeValue).slice(8, -1) + '', 'i'));
    return op === '=' && test || op === '!=' && !test;
  }
  function addSubjectToFirst(sel){
    var ref$;
    if ((ref$ = sel.type) === 'descendant' || ref$ === 'child' || ref$ === 'sibling' || ref$ === 'adjacent') {
      return addSubjectToFirst(sel.left);
    } else {
      return sel.subject = true;
    }
  }
  function isMatchComplex(nodeValue, op, value, selector){
    var cache, sel, subMatches, subMatchesLen;
    if (nodeValue == null) {
      return false;
    }
    cache = new Cache(nodeValue);
    addSubjectToFirst(selector);
    sel = {
      type: 'compound',
      selectors: [
        selector, {
          type: 'root'
        }
      ]
    };
    subMatches = finalMatches(matchAst(nodeValue, sel, cache));
    subMatchesLen = subMatches.length;
    return op === '=' && subMatchesLen || op === '!=' && !subMatchesLen;
  }
  module.exports = {
    finalMatches: finalMatches,
    matchAst: matchAst
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);

},{"./common":135,"grasp-syntax-javascript":139,"prelude-ls":160}],138:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, map, last, lines, compact, join, aliasMap, matchesMap, matchesAliasMap, literalMap, complexTypeMap, attrMap, primitiveOnlyAttributes, eitherAttributes, tokenSplit, operatorMap, toString$ = {}.toString;
  ref$ = require('prelude-ls'), map = ref$.map, last = ref$.last, lines = ref$.lines, compact = ref$.compact, join = ref$.join;
  ref$ = require('grasp-syntax-javascript'), aliasMap = ref$.aliasMap, matchesMap = ref$.matchesMap, matchesAliasMap = ref$.matchesAliasMap, literalMap = ref$.literalMap, complexTypeMap = ref$.complexTypeMap, attrMap = ref$.attrMap, primitiveOnlyAttributes = ref$.primitiveOnlyAttributes, eitherAttributes = ref$.eitherAttributes;
  function parse(selector){
    return processTokens(tokenize(selector + ""));
  }
  tokenSplit = /\s*(\/(?:\\\/|[^\/])*\/[gimy]*)\s*|(type\([a-zA-Z]*\))|([-a-zA-Z$_][-a-zA-Z$_0-9]*)|([-+]?[0-9]*\.?[0-9]+)|("(?:\\"|[^"])*")|('(?:\\'|[^'])*')|(\*|::?|\+\+|#)|\s*(!=|<=|>=|=~|~=)\s*|\s*(\]|\)|!|\.)|(\[&|\[)\s*|\s*(\,|~|<|>|=|\+|\||\(|\s)\s*/;
  function tokenize(selector){
    var cleanSelector, i$, ref$, len$, token, that, results$ = [];
    cleanSelector = join(',')(
    compact(
    map(function(it){
      return it.replace(/^\s*|\s*$/g, '');
    })(
    lines(
    selector))));
    for (i$ = 0, len$ = (ref$ = cleanSelector.split(tokenSplit)).length; i$ < len$; ++i$) {
      token = ref$[i$];
      if (token) {
        if (token === '*') {
          results$.push({
            type: 'wildcard',
            value: '*'
          });
        } else if (that = /^type\(([a-zA-Z]*)\)$/.exec(token)) {
          results$.push({
            type: 'type',
            value: that[1]
          });
        } else if (token === 'type' || token === 'root' || token === 'not' || token === 'matches' || token === 'first' || token === 'head' || token === 'tail' || token === 'last' || token === 'initial' || token === 'nth' || token === 'nth-last' || token === 'slice' || token === 'first-child' || token === 'nth-child' || token === 'nth-last-child' || token === 'last-child') {
          results$.push({
            type: 'keyword',
            value: token
          });
        } else if (token === 'true' || token === 'false') {
          results$.push({
            type: 'boolean',
            value: token === 'true'
          });
        } else if (token === 'null') {
          results$.push({
            type: 'null',
            value: null
          });
        } else if (that = /^['"](.*)['"]$/.exec(token)) {
          results$.push({
            type: 'string',
            value: that[1].replace(/\\"/, '"').replace(/\\'/, "'")
          });
        } else if (/^[-+]?[0-9]*\.?[0-9]+$/.test(token)) {
          results$.push({
            type: 'number',
            value: parseFloat(token)
          });
        } else if (that = /^\/(.*)\/([gimy]*)$/.exec(token)) {
          results$.push({
            type: 'regexp',
            value: new RegExp(that[1], that[2])
          });
        } else if ((token === '!=' || token === '<=' || token === '>=' || token === '=~' || token === '~=' || token === '>' || token === '<' || token === ',' || token === '~' || token === '=' || token === '!' || token === '#' || token === '.' || token === ':' || token === '::' || token === '+' || token === '[&' || token === '[' || token === ']' || token === '(' || token === ')') || token.match(/\s/)) {
          results$.push({
            type: 'operator',
            value: token
          });
        } else {
          results$.push({
            type: 'identifier',
            value: token
          });
        }
      }
    }
    return results$;
  }
  function processTokens(tokens){
    if (!tokens.length) {
      return null;
    }
    tokens.unshift({
      type: 'operator',
      value: '('
    });
    tokens.push({
      type: 'operator',
      value: ')'
    });
    return consumeImplicitMatches(tokens);
  }
  function consumeImplicitMatches(tokens){
    var args;
    args = consumeComplexArgList(tokens);
    if (args.length > 1) {
      return {
        type: 'matches',
        selectors: args
      };
    } else {
      return args[0];
    }
  }
  function peekOp(tokens, opValue){
    if (tokens.length > 0 && peekType(tokens, 'operator') && (toString$.call(opValue).slice(8, -1) === 'RegExp' && opValue.test(tokens[0].value) || tokens[0].value === opValue)) {
      return tokens[0];
    }
  }
  function consumeOp(tokens, opValue){
    if (peekOp(tokens, opValue)) {
      return tokens.shift();
    } else {
      throw createError("Expected operator " + opValue + ", but found:", tokens[0], tokens);
    }
  }
  function peekType(tokens, type){
    if (tokens.length > 0 && (tokens[0].type === type || toString$.call(type).slice(8, -1) === 'Array' && in$(tokens[0].type, type))) {
      return tokens[0];
    }
  }
  function consumeType(tokens, type){
    if (peekType(tokens, type)) {
      return tokens.shift();
    } else {
      throw createError("Expected type " + type + ", but found:", tokens[0], tokens);
    }
  }
  operatorMap = {
    ' ': 'descendant',
    '>': 'child',
    '~': 'sibling',
    '+': 'adjacent'
  };
  function consumeComplexSelector(tokens){
    var ops, root, wildcard, result, op, opVal, selector;
    ops = /^[\s>~+]$/;
    root = {
      type: 'root'
    };
    wildcard = {
      type: 'wildcard'
    };
    result = peekOp(tokens, ops)
      ? root
      : consumeCompoundSelector(tokens);
    while (peekOp(tokens, ops)) {
      op = tokens.shift();
      opVal = op.value;
      selector = consumeCompoundSelector(tokens);
      result = {
        type: operatorMap[opVal],
        operator: opVal,
        left: result,
        right: selector || wildcard
      };
    }
    return result;
  }
  function consumeCompoundSelector(tokens){
    var result, that, selector;
    result = consumeSelector(tokens);
    if (that = consumeProps(tokens)) {
      result = (that.left = result, that);
    }
    while (tokens.length > 0) {
      selector = consumeSelector(tokens);
      if (selector) {
        if (result.type !== 'compound') {
          result = {
            type: 'compound',
            selectors: [result]
          };
        }
        result.selectors.push(selector);
        if (that = consumeProps(tokens)) {
          result = (that.left = result, that);
        }
      } else {
        break;
      }
    }
    return result || selector;
  }
  function mapSimpleSelector(value){
    return {
      type: 'identifier',
      value: aliasMap[value] || value
    };
  }
  function consumeIdentifier(tokens){
    var value, val;
    value = tokens.shift().value;
    if (value in literalMap) {
      return {
        type: 'compound',
        selectors: [
          {
            type: 'identifier',
            value: 'Literal'
          }, {
            type: 'attribute',
            name: 'value',
            operator: '=',
            valType: 'primitive',
            value: {
              type: 'type',
              value: literalMap[value]
            }
          }
        ]
      };
    } else if (value in matchesMap || value in matchesAliasMap) {
      return {
        type: 'matches',
        selectors: (function(){
          var i$, ref$, len$, results$ = [];
          for (i$ = 0, len$ = (ref$ = matchesMap[matchesAliasMap[value] || value]).length; i$ < len$; ++i$) {
            val = ref$[i$];
            results$.push({
              type: 'identifier',
              value: val
            });
          }
          return results$;
        }())
      };
    } else if (value in complexTypeMap) {
      switch (complexTypeMap[value]) {
      case 'ImmediatelyInvokedFunctionExpression':
        return {
          type: 'compound',
          selectors: [
            {
              type: 'identifier',
              value: 'CallExpression'
            }, {
              type: 'attribute',
              name: 'callee',
              operator: '=',
              valType: 'complex',
              value: {
                type: 'matches',
                selectors: [
                  {
                    type: 'identifier',
                    value: 'FunctionExpression'
                  }, {
                    type: 'compound',
                    selectors: [
                      {
                        type: 'identifier',
                        value: 'MemberExpression'
                      }, {
                        type: 'attribute',
                        name: 'object',
                        operator: '=',
                        valType: 'complex',
                        value: {
                          type: 'identifier',
                          value: 'FunctionExpression'
                        }
                      }, {
                        type: 'attribute',
                        name: 'property',
                        operator: '=',
                        valType: 'complex',
                        value: {
                          type: 'matches',
                          selectors: [
                            {
                              type: 'compound',
                              selectors: [
                                {
                                  type: 'identifier',
                                  value: 'Identifier'
                                }, {
                                  type: 'attribute',
                                  name: 'name',
                                  operator: '=',
                                  valType: 'primitive',
                                  value: {
                                    type: 'literal',
                                    value: 'call'
                                  }
                                }
                              ]
                            }, {
                              type: 'compound',
                              selectors: [
                                {
                                  type: 'identifier',
                                  value: 'Identifier'
                                }, {
                                  type: 'attribute',
                                  name: 'name',
                                  operator: '=',
                                  valType: 'primitive',
                                  value: {
                                    type: 'literal',
                                    value: 'apply'
                                  }
                                }
                              ]
                            }
                          ]
                        }
                      }
                    ]
                  }
                ]
              }
            }
          ]
        };
      }
    } else {
      return mapSimpleSelector(value);
    }
  }
  function consumeSelector(tokens){
    var selector, token, value;
    selector = peekType(tokens, 'wildcard')
      ? tokens.shift()
      : peekOp(tokens, '::')
        ? (tokens.shift(), consumeIdentifier(tokens))
        : peekType(tokens, ['keyword', 'identifier'])
          ? consumeIdentifier(tokens)
          : peekType(tokens, ['number', 'string', 'regexp', 'boolean', 'null'])
            ? consumeLiteral(tokens)
            : peekOp(tokens, ':')
              ? consumePseudo(tokens)
              : peekOp(tokens, /\[&?/)
                ? consumeAttribute(tokens)
                : peekOp(tokens, '#')
                  ? (consumeOp(tokens, '#'), token = tokens.shift(), value = token.value, {
                    type: 'compound',
                    selectors: [
                      {
                        type: 'identifier',
                        value: 'Identifier'
                      }, {
                        type: 'attribute',
                        name: 'name',
                        operator: token.type === 'regexp' ? '=~' : '=',
                        valType: 'primitive',
                        value: {
                          type: 'literal',
                          value: value
                        }
                      }
                    ]
                  })
                  : peekOp(tokens, '(')
                    ? consumeImplicitMatches(tokens)
                    : peekOp(tokens, '.') ? {
                      type: 'root'
                    } : void 8;
    if (selector) {
      if (peekOp(tokens, '!')) {
        tokens.shift();
        selector.subject = true;
      }
    }
    return selector;
  }
  function consumeProps(tokens){
    var props, propSubjectIndices, i, ref$;
    props = [];
    propSubjectIndices = {};
    i = 0;
    while (peekOp(tokens, '.') || peekOp(tokens, ':') && ((ref$ = tokens[1].value) === 'first' || ref$ === 'head' || ref$ === 'tail' || ref$ === 'last' || ref$ === 'initial' || ref$ === 'nth' || ref$ === 'nth-last' || ref$ === 'slice')) {
      props.push(peekOp(tokens, '.')
        ? consumeProp(tokens)
        : consumePseudo(tokens));
      if (peekOp(tokens, '!')) {
        consumeOp(tokens, '!');
        propSubjectIndices[i] = true;
      }
      i++;
    }
    if (props.length) {
      return {
        type: 'prop',
        props: props,
        subjects: propSubjectIndices
      };
    }
  }
  function consumeLiteral(tokens){
    var token, value;
    token = tokens.shift();
    value = token.value;
    return {
      type: 'compound',
      selectors: [
        {
          type: 'identifier',
          value: 'Literal'
        }, {
          type: 'attribute',
          name: 'value',
          operator: '=',
          valType: 'primitive',
          value: {
            type: 'literal',
            value: value
          }
        }
      ]
    };
  }
  function consumePseudo(tokens){
    var op, id, that;
    op = consumeOp(tokens, ':');
    id = consumeType(tokens, 'keyword');
    switch (that = id.value) {
    case 'root':
    case 'first':
    case 'head':
    case 'tail':
    case 'last':
    case 'initial':
      return {
        type: that
      };
    case 'nth':
    case 'nth-last':
    case 'nth-child':
    case 'nth-last-child':
      return {
        type: that,
        index: consumeArg(tokens)
      };
    case 'slice':
      return {
        type: that,
        indicies: consumeArgList(tokens)
      };
    case 'first-child':
      return {
        type: 'nth-child',
        index: {
          type: 'literal',
          value: 0
        }
      };
    case 'last-child':
      return {
        type: 'nth-last-child',
        index: {
          type: 'literal',
          value: 0
        }
      };
    case 'matches':
      return consumeImplicitMatches(tokens);
    case 'not':
      return {
        type: that,
        selectors: consumeComplexArgList(tokens)
      };
    default:
      throw createError('Unexpected keyword:', id, tokens);
    }
  }
  function consumeName(tokens){
    var name, val;
    name = '';
    while (!name || peekOp(tokens, '.')) {
      if (name) {
        consumeOp(tokens, '.');
        name += '.';
      }
      val = consumeType(tokens, ['keyword', 'identifier']).value;
      name += attrMap[val] || val;
    }
    return name;
  }
  function consumeAttribute(tokens){
    var op, name, lastName, nextOp, nextToken, val, ref$, valType, value, selector;
    op = consumeType(tokens, 'operator').value;
    name = consumeName(tokens);
    lastName = last(name.split('.'));
    nextOp = consumeType(tokens, 'operator').value;
    if (nextOp === ']') {
      return {
        type: 'attribute',
        name: name
      };
    } else {
      nextToken = tokens[0];
      ref$ = op === '[&' || nextToken.type === 'type' || in$(lastName, primitiveOnlyAttributes)
        ? ['primitive', consumeValue(tokens)]
        : in$(lastName, eitherAttributes)
          ? (val = consumeValue([tokens[0]]), [
            'either', {
              type: val.type,
              value: val.value,
              sel: consumeSelector(tokens)
            }
          ])
          : ['complex', consumeComplexSelector(tokens)], valType = ref$[0], value = ref$[1];
      selector = {
        type: 'attribute',
        name: name,
        operator: nextOp,
        valType: valType,
        value: value
      };
      consumeOp(tokens, ']');
      return selector;
    }
  }
  function consumeProp(tokens){
    var token, name;
    consumeOp(tokens, '.');
    if (peekType(tokens, ['identifier', 'number', 'null', 'boolean'])) {
      token = consumeType(tokens, ['identifier', 'number', 'null', 'boolean']);
      name = token.value;
      return {
        type: 'string',
        value: attrMap[name] || name
      };
    } else {
      return {
        type: 'wildcard'
      };
    }
  }
  function consumeComplexArgList(tokens){
    var result, arg;
    consumeOp(tokens, '(');
    result = [];
    while (tokens.length > 0) {
      arg = consumeComplexSelector(tokens);
      if (arg) {
        result.push(arg);
      } else {
        throw createError('Expected selector argument:', tokens[0], tokens);
      }
      if (peekOp(tokens, ',')) {
        consumeOp(tokens, ',');
      } else {
        break;
      }
    }
    consumeOp(tokens, ')');
    return result;
  }
  function consumeArgList(tokens){
    var result, arg;
    consumeOp(tokens, '(');
    result = [];
    while (tokens.length > 0) {
      arg = consumeValue(tokens);
      if (arg) {
        result.push(arg);
      } else {
        throw createError('Expected argument:', tokens[0], tokens);
      }
      if (peekOp(tokens, ',')) {
        consumeOp(tokens, ',');
      } else {
        break;
      }
    }
    consumeOp(tokens, ')');
    return result;
  }
  function consumeArg(tokens){
    var value;
    consumeOp(tokens, '(');
    value = consumeValue(tokens);
    consumeOp(tokens, ')');
    return value;
  }
  function consumeValue(tokens){
    var token, value, type;
    token = tokens.shift(), value = token.value, type = token.type;
    if (type === 'type') {
      if (!value) {
        throw createError("Expected argument for 'type'.", token, tokens);
      }
      return token;
    } else if (value !== ',' && value !== '(' && value !== ')' && value !== '[' && value !== ']' && value !== '[&') {
      return {
        type: 'literal',
        value: value
      };
    }
  }
  function createError(message, token, tokens){
    return new Error(message + " " + JSON.stringify(token) + "\nRemaining tokens: " + JSON.stringify(tokens, null, '  '));
  }
  module.exports = {
    parse: parse,
    tokenize: tokenize
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);

},{"grasp-syntax-javascript":139,"prelude-ls":160}],139:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, each, keys, difference, intersection, syntax, syntaxFlat, i$, category, nodeName, node, complexTypes, complexTypeMap, key, val, aliasMap, matchesMap, matchesAliasMap, literals, literalMap, attrMap, attrMapInverse, alias, name, primitiveAttributesSet, nonPrimitiveAttributesSet, that, nonPrimitiveAttributes, primitiveAttributes, eitherAttributes, primitiveOnlyAttributes;
  ref$ = require('prelude-ls'), each = ref$.each, keys = ref$.keys, difference = ref$.difference, intersection = ref$.intersection;
  syntax = {
    Misc: {
      Program: {
        alias: 'program',
        nodeArrays: ['body'],
        note: "The root node of a JavaScript program's AST."
      },
      Identifier: {
        alias: 'ident',
        primitives: ['name'],
        example: 'x'
      },
      Literal: {
        alias: 'literal',
        primitives: ['value'],
        example: ['true', '1', '"string"']
      },
      RegExpLiteral: {
        alias: 'regex',
        primitives: ['regex'],
        example: '/^sh+/gi'
      },
      Property: {
        alias: 'prop',
        nodes: ['key', 'value'],
        primitives: ['kind'],
        syntax: '*key*: *value*',
        example: 'a: 1',
        note: 'An object expression (obj) has a list of properties, each being a property.'
      },
      SpreadElement: {
        alias: 'spread',
        nodes: ['argument']
      },
      TemplateElement: {
        alias: 'template-element',
        primitives: ['tail', 'value']
      }
    },
    Statements: {
      EmptyStatement: {
        alias: 'empty',
        example: ';'
      },
      BlockStatement: {
        alias: 'block',
        nodeArrays: ['body'],
        syntax: '{\n  *statement_1*\n  *statement_2*\n  *...*\n  *statement_n*\n}',
        example: '{\n  x = 1;\n  f();\n  x++;\n}'
      },
      ExpressionStatement: {
        alias: 'exp-statement',
        nodes: ['expression'],
        syntax: '*expression*;',
        example: '2;',
        note: 'When an expression is used where a statement should be, it is wrapped in an expression statement.'
      },
      IfStatement: {
        alias: 'if',
        nodes: ['test', 'consequent', 'alternate'],
        syntax: 'if (*test*)\n  *consequent*\n[else\n  *alternate*]',
        example: ['if (even(x)) {\n  f(x);\n}', 'if (x === 2) {\n  x++;\n} else {\n  f(x);\n}']
      },
      LabeledStatement: {
        alias: 'label',
        nodes: ['label', 'body'],
        syntax: '*label*: *body*;',
        example: 'outer:\nfor (i = 0; i < xs.length; i++) {\n  for (j = 0; j < ys.length; j++) {\n    if (xs[i] === ys[j]) {\n      break outer;\n    }\n  }\n}'
      },
      BreakStatement: {
        alias: 'break',
        nodes: ['label'],
        syntax: 'break [*label*];',
        example: ['break;', 'break outer;']
      },
      ContinueStatement: {
        alias: 'continue',
        nodes: ['label'],
        syntax: 'continue [*label*];',
        example: ['continue;', 'continue outerLoop;']
      },
      WithStatement: {
        alias: 'with',
        nodes: ['object', 'body'],
        syntax: 'with (*object*)\n  *body*',
        example: 'with ({x: 42}) {\n  f(x);\n}'
      },
      SwitchStatement: {
        alias: 'switch',
        nodes: ['discriminant'],
        nodeArrays: ['cases'],
        syntax: 'switch (*discriminant*) {\n  *case_1*\n  *case_2*\n  *...*\n  *case_n*\n}',
        example: 'switch (num) {\n  case 1:\n    f(\'one\');\n    break;\n  case 2:\n    f(\'two\');\n    break;\n  default:\n    f(\'too many\');\n}'
      },
      ReturnStatement: {
        alias: 'return',
        nodes: ['argument'],
        syntax: 'return *argument*;',
        example: 'return f(2);'
      },
      ThrowStatement: {
        alias: 'throw',
        nodes: ['argument'],
        syntax: 'throw *argument*;',
        example: 'throw new Error("oops");'
      },
      TryStatement: {
        alias: 'try',
        nodes: ['block', 'handler', 'finalizer'],
        syntax: 'try\n  *block*\n[*handler*]\n[finally\n   *finalizer*]',
        example: 'try {\n  result = parse(input);\n} catch (error) {\n  console.error(error.message);\n  result = \'\';\n} finally {\n  g(result);\n}'
      },
      WhileStatement: {
        alias: 'while',
        nodes: ['test', 'body'],
        syntax: 'while (*test*)\n  *body*',
        example: 'while (x < 2) {\n  f(x);\n  x++;\n}'
      },
      DoWhileStatement: {
        alias: 'do-while',
        nodes: ['test', 'body'],
        syntax: 'do\n  *body*\nwhile (*test*);',
        example: 'do {\n  f(x);\n  x++;\n} while (x < 2);'
      },
      ForStatement: {
        alias: 'for',
        nodes: ['init', 'test', 'update', 'body'],
        syntax: 'for ([*init*]; [*test*]; [*update*])\n  *body*',
        example: 'for (let x = 0; x < 2; x++) {\n  f(x);\n}'
      },
      ForInStatement: {
        alias: 'for-in',
        nodes: ['left', 'right', 'body'],
        syntax: 'for (*left* in *right*)\n  *body*',
        example: 'for (let prop in object) {\n  f(object[prop]);\n}'
      },
      ForOfStatement: {
        alias: 'for-of',
        nodes: ['left', 'right', 'body'],
        syntax: 'for (*left* of *right*)\n  *body*',
        example: 'for (let val of list) {\n  f(val);\n}'
      },
      DebuggerStatement: {
        alias: 'debugger',
        syntax: 'debugger;',
        example: 'debugger;'
      }
    },
    Declarations: {
      FunctionDeclaration: {
        alias: 'func-dec',
        nodes: ['id', 'body'],
        nodeArrays: ['params'],
        primitives: ['generator'],
        syntax: 'function *id*([*param_1*], [*param_2*], [..., *param_3*])\n  *body*',
        example: 'function f(x, y) {\n  return x * y;\n}',
        note: 'A function declaration contrasts with a function expression (func-exp).'
      },
      VariableDeclaration: {
        alias: 'var-decs',
        nodeArrays: ['declarations'],
        primitives: ['kind'],
        syntax: 'var *declaration_1*[, *declaration_2*, ..., *declaration_n*]',
        example: 'var x = 1, y = 2;',
        note: 'Each declaration is a variable declarator (var-dec).'
      },
      VariableDeclarator: {
        alias: 'var-dec',
        nodes: ['id', 'init'],
        syntax: '*id* = *init*',
        example: 'var x = 2'
      }
    },
    Expressions: {
      ThisExpression: {
        alias: 'this',
        example: 'this'
      },
      Super: {
        alias: 'super',
        example: 'super(x, y)'
      },
      ArrayExpression: {
        alias: 'arr',
        nodeArrays: ['elements'],
        syntax: '[*element_0*, *element_1*, *...*, *element_n*]',
        example: ['[1, 2, 3]', '[]']
      },
      ObjectExpression: {
        alias: 'obj',
        nodeArrays: ['properties'],
        syntax: '{\n  *property_1*,\n  *property_2*,\n  *...*,\n  *property_n*\n}',
        example: ['{a: 1, b: 2}', '{}']
      },
      FunctionExpression: {
        alias: 'func-exp',
        nodes: ['id', 'body'],
        nodeArrays: ['params'],
        primitives: ['generator'],
        syntax: 'function [*id*]([*param_1*], [*param_2*], [..., *param_3*])\n  *body*',
        example: 'let f = function(x, y) {\n  return x * y;\n}',
        note: 'A function expression contrasts with a function declaration (func-dec).'
      },
      ArrowFunctionExpression: {
        alias: 'arrow',
        nodes: ['id', 'body'],
        nodeArrays: ['params'],
        primitives: ['generator', 'expression'],
        syntax: '([*param_1*], [*param_2*], [..., *param_3*]) => *body*',
        example: '(x, y) => x * y'
      },
      SequenceExpression: {
        alias: 'seq',
        nodeArrays: ['expressions'],
        syntax: '*expression_1*, *expression_2*, *...*, *expression_n*',
        example: 'a, b, c'
      },
      YieldExpression: {
        alias: 'yield',
        nodes: ['argument'],
        primitive: ['delegate'],
        syntax: 'yield *argument*',
        example: 'yield x'
      },
      UnaryExpression: {
        alias: 'unary',
        nodes: ['argument'],
        primitive: ['operator', 'prefix'],
        syntax: '*operator**argument*',
        example: ['+x', 'typeof x']
      },
      BinaryExpression: {
        alias: 'bi',
        nodes: ['left', 'right'],
        primitives: ['operator'],
        syntax: '*left* *operator* *right*',
        example: 'x === z'
      },
      AssignmentExpression: {
        alias: 'assign',
        nodes: ['left', 'right'],
        primitives: ['operator'],
        syntax: '*left* *operator* *right*',
        example: '(y = 2)'
      },
      UpdateExpression: {
        alias: 'update',
        nodes: ['argument'],
        primitives: ['operator', 'prefix'],
        syntax: '*argument**operator*\n\n*or, if prefix*\n\n*operator**argument*',
        example: ['++x', 'x--']
      },
      LogicalExpression: {
        alias: 'logic',
        nodes: ['left', 'right'],
        primitives: ['operator'],
        syntax: '*left* *operator* *right*',
        example: 'x && y'
      },
      ConditionalExpression: {
        alias: 'cond',
        nodes: ['test', 'consequent', 'alternate'],
        syntax: '*test* ? *consequent* : *alternate*',
        example: 'x % 2 ? "odd" : "even"'
      },
      NewExpression: {
        alias: 'new',
        nodes: ['callee'],
        nodeArrays: ['arguments'],
        syntax: 'new *callee*(*argument_1*, *argument_2*, *...*, *argument_n*)',
        example: 'new Date(2011, 11, 11)'
      },
      CallExpression: {
        alias: 'call',
        nodes: ['callee'],
        nodeArrays: ['arguments'],
        syntax: '*callee*(*argument_1*, *argument_2*, *...*, *argument_n*)',
        example: 'f(1,2,3)'
      },
      MemberExpression: {
        alias: 'member',
        nodes: ['object', 'property'],
        primitives: ['computed'],
        syntax: '*object*.*property*',
        example: 'Math.PI'
      },
      TemplateLiteral: {
        alias: 'template-literal',
        nodeArrays: ['quasis', 'expressions']
      },
      TaggedTemplateExpression: {
        alias: 'tagged-template-exp',
        nodes: ['tag', 'quasi']
      }
    },
    Clauses: {
      SwitchCase: {
        alias: 'switch-case',
        nodes: ['test'],
        nodeArrays: ['consequent'],
        syntax: 'case *test* | default :\n  *consequent*',
        example: ['case 1:\n  z = \'one\';\n  break;', 'default:\n  z = \'two\'']
      },
      CatchClause: {
        alias: 'catch',
        nodes: ['param', 'body'],
        syntax: 'catch (*param*)\n  *body*',
        example: 'catch (e) {\n  console.error(e.message);\n}'
      }
    },
    Patterns: {
      AssignmentProperty: {
        alias: 'assign-prop',
        nodes: ['key', 'value'],
        primitives: ['kind', 'method']
      },
      ObjectPattern: {
        alias: 'obj-pattern',
        nodeArrays: ['properties']
      },
      ArrayPattern: {
        alias: 'array-pattern',
        nodeArrays: ['elements']
      },
      RestElement: {
        alias: 'rest-element',
        nodes: ['argument']
      },
      AssignmentPattern: {
        alias: 'assign-pattern',
        nodes: ['left', 'right']
      }
    },
    Classes: {
      ClassBody: {
        alias: 'class-body',
        nodeArrays: ['body']
      },
      MethodDefinition: {
        alias: 'method',
        nodes: ['key', 'value'],
        primitives: ['kind', 'computed', 'static']
      },
      ClassDeclaration: {
        alias: 'class-dec',
        nodes: ['id', 'superClass', 'body']
      },
      ClassExpression: {
        alias: 'class-exp',
        nodes: ['id', 'superClass', 'body']
      },
      MetaProperty: {
        alias: 'meta-property',
        nodes: ['meta', 'property']
      }
    },
    Modules: {
      ModuleDeclaration: {
        alias: 'module-dec'
      },
      ModuleSpecifier: {
        alias: 'module-specifier',
        nodes: ['local']
      }
    },
    Imports: {
      ImportDeclaration: {
        alias: 'import-dec',
        nodes: ['source'],
        nodeArrays: ['specifiers']
      },
      ImportSpecifier: {
        alias: 'import-specifier',
        nodes: ['local', 'imported']
      },
      ImportDefaultSpecifier: {
        alias: 'import-default-specifier',
        nodes: ['local']
      },
      ImportNamespaceSpecifier: {
        alias: 'import-namespace-specifier',
        nodes: ['local']
      }
    },
    Exports: {
      ExportNamedDeclaration: {
        alias: 'export-named-dec',
        nodes: ['declaration', 'source'],
        nodeArrays: ['specifiers']
      },
      ExportSpecifier: {
        alias: 'export-specifier',
        nodes: ['local', 'exported']
      },
      ExportDefaultDeclaration: {
        alias: 'export-default-specifier',
        nodes: ['declaration']
      },
      ExportAllDeclarationSpecifier: {
        alias: 'export-namespace-specifier',
        nodes: ['source']
      }
    }
  };
  syntaxFlat = {};
  for (i$ in syntax) {
    category = syntax[i$];
    for (nodeName in category) {
      node = category[nodeName];
      syntaxFlat[nodeName] = node;
    }
  }
  complexTypes = {
    iife: 'ImmediatelyInvokedFunctionExpression'
  };
  complexTypeMap = {};
  for (key in complexTypes) {
    val = complexTypes[key];
    complexTypeMap[key] = val;
    complexTypeMap[val] = val;
  }
  aliasMap = {};
  for (nodeName in syntaxFlat) {
    node = syntaxFlat[nodeName];
    aliasMap[node.alias] = nodeName;
  }
  matchesMap = {
    Statement: keys(syntax.Statements),
    Declaration: keys(syntax.Declarations),
    Expression: keys(syntax.Expressions),
    Clause: keys(syntax.Clauses),
    BiOp: ['BinaryExpression', 'LogicalExpression', 'AssignmentExpression'],
    Function: ['FunctionDeclaration', 'FunctionExpression'],
    ForLoop: ['ForStatement', 'ForInStatement', 'ForOfStatement'],
    WhileLoop: ['DoWhileStatement', 'WhileStatement'],
    Class: ['ClassExpression', 'ClassExpression'],
    Loop: ['ForStatement', 'ForInStatement', 'ForOfStatement', 'DoWhileStatement', 'WhileStatement']
  };
  matchesAliasMap = {
    statement: 'Statement',
    dec: 'Declaration',
    exp: 'Expression',
    clause: 'Clause',
    biop: 'BiOp',
    func: 'Function',
    'for-loop': 'ForLoop',
    'while-loop': 'WhileLoop',
    loop: 'Loop',
    'class': 'Class'
  };
  literals = {
    'null': 'Null',
    bool: 'Boolean',
    num: 'Number',
    str: 'String',
    regex: 'RegExp'
  };
  literalMap = {};
  for (key in literals) {
    val = literals[key];
    literalMap[key] = val;
    literalMap[val] = val;
  }
  attrMap = {
    exp: 'expression',
    exps: 'expressions',
    then: 'consequent',
    alt: 'alternate',
    'else': 'alternate',
    op: 'operator',
    l: 'left',
    r: 'right',
    arg: 'argument',
    args: 'arguments',
    els: 'elements',
    val: 'value',
    obj: 'object',
    prop: 'property',
    props: 'properties',
    decs: 'declarations'
  };
  attrMapInverse = {};
  for (alias in attrMap) {
    name = attrMap[alias];
    attrMapInverse[name] == null && (attrMapInverse[name] = []);
    attrMapInverse[name].push(alias);
  }
  primitiveAttributesSet = {};
  nonPrimitiveAttributesSet = {};
  for (nodeName in syntaxFlat) {
    node = syntaxFlat[nodeName];
    if (that = node.primitives) {
      each(fn$, that);
    }
    if (that = node.nodes) {
      each(fn1$, that);
    }
    if (that = node.nodeArrays) {
      each(fn2$, that);
    }
  }
  nonPrimitiveAttributes = keys(nonPrimitiveAttributesSet);
  primitiveAttributes = keys(primitiveAttributesSet);
  eitherAttributes = intersection(primitiveAttributes, nonPrimitiveAttributes);
  primitiveOnlyAttributes = difference(primitiveAttributes, nonPrimitiveAttributes);
  module.exports = {
    syntax: syntax,
    syntaxFlat: syntaxFlat,
    complexTypeMap: complexTypeMap,
    aliasMap: aliasMap,
    matchesMap: matchesMap,
    matchesAliasMap: matchesAliasMap,
    literalMap: literalMap,
    attrMap: attrMap,
    attrMapInverse: attrMapInverse,
    primitiveOnlyAttributes: primitiveOnlyAttributes,
    eitherAttributes: eitherAttributes
  };
  function fn$(it){
    return primitiveAttributesSet[it] = true;
  }
  function fn1$(it){
    return nonPrimitiveAttributesSet[it] = true;
  }
  function fn2$(it){
    return nonPrimitiveAttributesSet[it] = true;
  }
}).call(this);

},{"prelude-ls":160}],140:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var parsedTypeCheck, types, toString$ = {}.toString;
  parsedTypeCheck = require('type-check').parsedTypeCheck;
  types = {
    '*': function(value, options){
      switch (toString$.call(value).slice(8, -1)) {
      case 'Array':
        return typeCast(value, {
          type: 'Array'
        }, options);
      case 'Object':
        return typeCast(value, {
          type: 'Object'
        }, options);
      default:
        return {
          type: 'Just',
          value: typesCast(value, [
            {
              type: 'Undefined'
            }, {
              type: 'Null'
            }, {
              type: 'NaN'
            }, {
              type: 'Boolean'
            }, {
              type: 'Number'
            }, {
              type: 'Date'
            }, {
              type: 'RegExp'
            }, {
              type: 'Array'
            }, {
              type: 'Object'
            }, {
              type: 'String'
            }
          ], (options.explicit = true, options))
        };
      }
    },
    Undefined: function(it){
      if (it === 'undefined' || it === void 8) {
        return {
          type: 'Just',
          value: void 8
        };
      } else {
        return {
          type: 'Nothing'
        };
      }
    },
    Null: function(it){
      if (it === 'null') {
        return {
          type: 'Just',
          value: null
        };
      } else {
        return {
          type: 'Nothing'
        };
      }
    },
    NaN: function(it){
      if (it === 'NaN') {
        return {
          type: 'Just',
          value: NaN
        };
      } else {
        return {
          type: 'Nothing'
        };
      }
    },
    Boolean: function(it){
      if (it === 'true') {
        return {
          type: 'Just',
          value: true
        };
      } else if (it === 'false') {
        return {
          type: 'Just',
          value: false
        };
      } else {
        return {
          type: 'Nothing'
        };
      }
    },
    Number: function(it){
      return {
        type: 'Just',
        value: +it
      };
    },
    Int: function(it){
      return {
        type: 'Just',
        value: +it
      };
    },
    Float: function(it){
      return {
        type: 'Just',
        value: +it
      };
    },
    Date: function(value, options){
      var that;
      if (that = /^\#([\s\S]*)\#$/.exec(value)) {
        return {
          type: 'Just',
          value: new Date(+that[1] || that[1])
        };
      } else if (options.explicit) {
        return {
          type: 'Nothing'
        };
      } else {
        return {
          type: 'Just',
          value: new Date(+value || value)
        };
      }
    },
    RegExp: function(value, options){
      var that;
      if (that = /^\/([\s\S]*)\/([gimy]*)$/.exec(value)) {
        return {
          type: 'Just',
          value: new RegExp(that[1], that[2])
        };
      } else if (options.explicit) {
        return {
          type: 'Nothing'
        };
      } else {
        return {
          type: 'Just',
          value: new RegExp(value)
        };
      }
    },
    Array: function(value, options){
      return castArray(value, {
        of: [{
          type: '*'
        }]
      }, options);
    },
    Object: function(value, options){
      return castFields(value, {
        of: {}
      }, options);
    },
    String: function(it){
      var that;
      if (toString$.call(it).slice(8, -1) !== 'String') {
        return {
          type: 'Nothing'
        };
      }
      if (that = it.match(/^'([\s\S]*)'$/)) {
        return {
          type: 'Just',
          value: that[1].replace(/\\'/g, "'")
        };
      } else if (that = it.match(/^"([\s\S]*)"$/)) {
        return {
          type: 'Just',
          value: that[1].replace(/\\"/g, '"')
        };
      } else {
        return {
          type: 'Just',
          value: it
        };
      }
    }
  };
  function castArray(node, type, options){
    var typeOf, element;
    if (toString$.call(node).slice(8, -1) !== 'Array') {
      return {
        type: 'Nothing'
      };
    }
    typeOf = type.of;
    return {
      type: 'Just',
      value: (function(){
        var i$, ref$, len$, results$ = [];
        for (i$ = 0, len$ = (ref$ = node).length; i$ < len$; ++i$) {
          element = ref$[i$];
          results$.push(typesCast(element, typeOf, options));
        }
        return results$;
      }())
    };
  }
  function castTuple(node, type, options){
    var result, i, i$, ref$, len$, types, cast;
    if (toString$.call(node).slice(8, -1) !== 'Array') {
      return {
        type: 'Nothing'
      };
    }
    result = [];
    i = 0;
    for (i$ = 0, len$ = (ref$ = type.of).length; i$ < len$; ++i$) {
      types = ref$[i$];
      cast = typesCast(node[i], types, options);
      if (toString$.call(cast).slice(8, -1) !== 'Undefined') {
        result.push(cast);
      }
      i++;
    }
    if (node.length <= i) {
      return {
        type: 'Just',
        value: result
      };
    } else {
      return {
        type: 'Nothing'
      };
    }
  }
  function castFields(node, type, options){
    var typeOf, key, value;
    if (toString$.call(node).slice(8, -1) !== 'Object') {
      return {
        type: 'Nothing'
      };
    }
    typeOf = type.of;
    return {
      type: 'Just',
      value: (function(){
        var ref$, resultObj$ = {};
        for (key in ref$ = node) {
          value = ref$[key];
          resultObj$[typesCast(key, [{
            type: 'String'
          }], options)] = typesCast(value, typeOf[key] || [{
            type: '*'
          }], options);
        }
        return resultObj$;
      }())
    };
  }
  function typeCast(node, typeObj, options){
    var type, structure, castFunc, ref$;
    type = typeObj.type, structure = typeObj.structure;
    if (type) {
      castFunc = ((ref$ = options.customTypes[type]) != null ? ref$.cast : void 8) || types[type];
      if (!castFunc) {
        throw new Error("Type not defined: " + type + ".");
      }
      return castFunc(node, options, typesCast);
    } else {
      switch (structure) {
      case 'array':
        return castArray(node, typeObj, options);
      case 'tuple':
        return castTuple(node, typeObj, options);
      case 'fields':
        return castFields(node, typeObj, options);
      }
    }
  }
  function typesCast(node, types, options){
    var i$, len$, type, ref$, valueType, value;
    for (i$ = 0, len$ = types.length; i$ < len$; ++i$) {
      type = types[i$];
      ref$ = typeCast(node, type, options), valueType = ref$.type, value = ref$.value;
      if (valueType === 'Nothing') {
        continue;
      }
      if (parsedTypeCheck([type], value, {
        customTypes: options.customTypes
      })) {
        return value;
      }
    }
    throw new Error("Value " + JSON.stringify(node) + " does not type check against " + JSON.stringify(types) + ".");
  }
  module.exports = typesCast;
}).call(this);

},{"type-check":144}],141:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var parseString, cast, parseType, VERSION, parsedTypeParse, parse;
  parseString = require('./parse-string');
  cast = require('./cast');
  parseType = require('type-check').parseType;
  VERSION = '0.3.0';
  parsedTypeParse = function(parsedType, string, options){
    options == null && (options = {});
    options.explicit == null && (options.explicit = false);
    options.customTypes == null && (options.customTypes = {});
    return cast(parseString(parsedType, string, options), parsedType, options);
  };
  parse = function(type, string, options){
    return parsedTypeParse(parseType(type), string, options);
  };
  module.exports = {
    VERSION: VERSION,
    parse: parse,
    parsedTypeParse: parsedTypeParse
  };
}).call(this);

},{"./cast":140,"./parse-string":142,"type-check":144}],142:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var reject, special, tokenRegex;
  reject = require('prelude-ls').reject;
  function consumeOp(tokens, op){
    if (tokens[0] === op) {
      return tokens.shift();
    } else {
      throw new Error("Expected '" + op + "', but got '" + tokens[0] + "' instead in " + JSON.stringify(tokens) + ".");
    }
  }
  function maybeConsumeOp(tokens, op){
    if (tokens[0] === op) {
      return tokens.shift();
    }
  }
  function consumeList(tokens, arg$, hasDelimiters){
    var open, close, result, untilTest;
    open = arg$[0], close = arg$[1];
    if (hasDelimiters) {
      consumeOp(tokens, open);
    }
    result = [];
    untilTest = "," + (hasDelimiters ? close : '');
    while (tokens.length && (hasDelimiters && tokens[0] !== close)) {
      result.push(consumeElement(tokens, untilTest));
      maybeConsumeOp(tokens, ',');
    }
    if (hasDelimiters) {
      consumeOp(tokens, close);
    }
    return result;
  }
  function consumeArray(tokens, hasDelimiters){
    return consumeList(tokens, ['[', ']'], hasDelimiters);
  }
  function consumeTuple(tokens, hasDelimiters){
    return consumeList(tokens, ['(', ')'], hasDelimiters);
  }
  function consumeFields(tokens, hasDelimiters){
    var result, untilTest, key;
    if (hasDelimiters) {
      consumeOp(tokens, '{');
    }
    result = {};
    untilTest = "," + (hasDelimiters ? '}' : '');
    while (tokens.length && (!hasDelimiters || tokens[0] !== '}')) {
      key = consumeValue(tokens, ':');
      consumeOp(tokens, ':');
      result[key] = consumeElement(tokens, untilTest);
      maybeConsumeOp(tokens, ',');
    }
    if (hasDelimiters) {
      consumeOp(tokens, '}');
    }
    return result;
  }
  function consumeValue(tokens, untilTest){
    var out;
    untilTest == null && (untilTest = '');
    out = '';
    while (tokens.length && -1 === untilTest.indexOf(tokens[0])) {
      out += tokens.shift();
    }
    return out;
  }
  function consumeElement(tokens, untilTest){
    switch (tokens[0]) {
    case '[':
      return consumeArray(tokens, true);
    case '(':
      return consumeTuple(tokens, true);
    case '{':
      return consumeFields(tokens, true);
    default:
      return consumeValue(tokens, untilTest);
    }
  }
  function consumeTopLevel(tokens, types, options){
    var ref$, type, structure, origTokens, result, finalResult, x$, y$;
    ref$ = types[0], type = ref$.type, structure = ref$.structure;
    origTokens = tokens.concat();
    if (!options.explicit && types.length === 1 && ((!type && structure) || (type === 'Array' || type === 'Object'))) {
      result = structure === 'array' || type === 'Array'
        ? consumeArray(tokens, tokens[0] === '[')
        : structure === 'tuple'
          ? consumeTuple(tokens, tokens[0] === '(')
          : consumeFields(tokens, tokens[0] === '{');
      finalResult = tokens.length ? consumeElement(structure === 'array' || type === 'Array'
        ? (x$ = origTokens, x$.unshift('['), x$.push(']'), x$)
        : (y$ = origTokens, y$.unshift('('), y$.push(')'), y$)) : result;
    } else {
      finalResult = consumeElement(tokens);
    }
    return finalResult;
  }
  special = /\[\]\(\)}{:,/.source;
  tokenRegex = RegExp('("(?:\\\\"|[^"])*")|(\'(?:\\\\\'|[^\'])*\')|(/(?:\\\\/|[^/])*/[a-zA-Z]*)|(#.*#)|([' + special + '])|([^\\s' + special + '](?:\\s*[^\\s' + special + ']+)*)|\\s*');
  module.exports = function(types, string, options){
    var tokens, node;
    options == null && (options = {});
    if (!options.explicit && types.length === 1 && types[0].type === 'String') {
      return "'" + string.replace(/\\'/g, "\\\\'") + "'";
    }
    tokens = reject(not$, string.split(tokenRegex));
    node = consumeTopLevel(tokens, types, options);
    if (!node) {
      throw new Error("Error parsing '" + string + "'.");
    }
    return node;
  };
  function not$(x){ return !x; }
}).call(this);

},{"prelude-ls":160}],143:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, any, all, isItNaN, types, defaultType, customTypes, toString$ = {}.toString;
  ref$ = require('prelude-ls'), any = ref$.any, all = ref$.all, isItNaN = ref$.isItNaN;
  types = {
    Number: {
      typeOf: 'Number',
      validate: function(it){
        return !isItNaN(it);
      }
    },
    NaN: {
      typeOf: 'Number',
      validate: isItNaN
    },
    Int: {
      typeOf: 'Number',
      validate: function(it){
        return !isItNaN(it) && it % 1 === 0;
      }
    },
    Float: {
      typeOf: 'Number',
      validate: function(it){
        return !isItNaN(it);
      }
    },
    Date: {
      typeOf: 'Date',
      validate: function(it){
        return !isItNaN(it.getTime());
      }
    }
  };
  defaultType = {
    array: 'Array',
    tuple: 'Array'
  };
  function checkArray(input, type){
    return all(function(it){
      return checkMultiple(it, type.of);
    }, input);
  }
  function checkTuple(input, type){
    var i, i$, ref$, len$, types;
    i = 0;
    for (i$ = 0, len$ = (ref$ = type.of).length; i$ < len$; ++i$) {
      types = ref$[i$];
      if (!checkMultiple(input[i], types)) {
        return false;
      }
      i++;
    }
    return input.length <= i;
  }
  function checkFields(input, type){
    var inputKeys, numInputKeys, k, numOfKeys, key, ref$, types;
    inputKeys = {};
    numInputKeys = 0;
    for (k in input) {
      inputKeys[k] = true;
      numInputKeys++;
    }
    numOfKeys = 0;
    for (key in ref$ = type.of) {
      types = ref$[key];
      if (!checkMultiple(input[key], types)) {
        return false;
      }
      if (inputKeys[key]) {
        numOfKeys++;
      }
    }
    return type.subset || numInputKeys === numOfKeys;
  }
  function checkStructure(input, type){
    if (!(input instanceof Object)) {
      return false;
    }
    switch (type.structure) {
    case 'fields':
      return checkFields(input, type);
    case 'array':
      return checkArray(input, type);
    case 'tuple':
      return checkTuple(input, type);
    }
  }
  function check(input, typeObj){
    var type, structure, setting, that;
    type = typeObj.type, structure = typeObj.structure;
    if (type) {
      if (type === '*') {
        return true;
      }
      setting = customTypes[type] || types[type];
      if (setting) {
        return setting.typeOf === toString$.call(input).slice(8, -1) && setting.validate(input);
      } else {
        return type === toString$.call(input).slice(8, -1) && (!structure || checkStructure(input, typeObj));
      }
    } else if (structure) {
      if (that = defaultType[structure]) {
        if (that !== toString$.call(input).slice(8, -1)) {
          return false;
        }
      }
      return checkStructure(input, typeObj);
    } else {
      throw new Error("No type defined. Input: " + input + ".");
    }
  }
  function checkMultiple(input, types){
    if (toString$.call(types).slice(8, -1) !== 'Array') {
      throw new Error("Types must be in an array. Input: " + input + ".");
    }
    return any(function(it){
      return check(input, it);
    }, types);
  }
  module.exports = function(parsedType, input, options){
    options == null && (options = {});
    customTypes = options.customTypes || {};
    return checkMultiple(input, parsedType);
  };
}).call(this);

},{"prelude-ls":160}],144:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var VERSION, parseType, parsedTypeCheck, typeCheck;
  VERSION = '0.3.2';
  parseType = require('./parse-type');
  parsedTypeCheck = require('./check');
  typeCheck = function(type, input, options){
    return parsedTypeCheck(parseType(type), input, options);
  };
  module.exports = {
    VERSION: VERSION,
    typeCheck: typeCheck,
    parsedTypeCheck: parsedTypeCheck,
    parseType: parseType
  };
}).call(this);

},{"./check":143,"./parse-type":145}],145:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var identifierRegex, tokenRegex;
  identifierRegex = /[\$\w]+/;
  function peek(tokens){
    var token;
    token = tokens[0];
    if (token == null) {
      throw new Error('Unexpected end of input.');
    }
    return token;
  }
  function consumeIdent(tokens){
    var token;
    token = peek(tokens);
    if (!identifierRegex.test(token)) {
      throw new Error("Expected text, got '" + token + "' instead.");
    }
    return tokens.shift();
  }
  function consumeOp(tokens, op){
    var token;
    token = peek(tokens);
    if (token !== op) {
      throw new Error("Expected '" + op + "', got '" + token + "' instead.");
    }
    return tokens.shift();
  }
  function maybeConsumeOp(tokens, op){
    var token;
    token = tokens[0];
    if (token === op) {
      return tokens.shift();
    } else {
      return null;
    }
  }
  function consumeArray(tokens){
    var types;
    consumeOp(tokens, '[');
    if (peek(tokens) === ']') {
      throw new Error("Must specify type of Array - eg. [Type], got [] instead.");
    }
    types = consumeTypes(tokens);
    consumeOp(tokens, ']');
    return {
      structure: 'array',
      of: types
    };
  }
  function consumeTuple(tokens){
    var components;
    components = [];
    consumeOp(tokens, '(');
    if (peek(tokens) === ')') {
      throw new Error("Tuple must be of at least length 1 - eg. (Type), got () instead.");
    }
    for (;;) {
      components.push(consumeTypes(tokens));
      maybeConsumeOp(tokens, ',');
      if (')' === peek(tokens)) {
        break;
      }
    }
    consumeOp(tokens, ')');
    return {
      structure: 'tuple',
      of: components
    };
  }
  function consumeFields(tokens){
    var fields, subset, ref$, key, types;
    fields = {};
    consumeOp(tokens, '{');
    subset = false;
    for (;;) {
      if (maybeConsumeOp(tokens, '...')) {
        subset = true;
        break;
      }
      ref$ = consumeField(tokens), key = ref$[0], types = ref$[1];
      fields[key] = types;
      maybeConsumeOp(tokens, ',');
      if ('}' === peek(tokens)) {
        break;
      }
    }
    consumeOp(tokens, '}');
    return {
      structure: 'fields',
      of: fields,
      subset: subset
    };
  }
  function consumeField(tokens){
    var key, types;
    key = consumeIdent(tokens);
    consumeOp(tokens, ':');
    types = consumeTypes(tokens);
    return [key, types];
  }
  function maybeConsumeStructure(tokens){
    switch (tokens[0]) {
    case '[':
      return consumeArray(tokens);
    case '(':
      return consumeTuple(tokens);
    case '{':
      return consumeFields(tokens);
    }
  }
  function consumeType(tokens){
    var token, wildcard, type, structure;
    token = peek(tokens);
    wildcard = token === '*';
    if (wildcard || identifierRegex.test(token)) {
      type = wildcard
        ? consumeOp(tokens, '*')
        : consumeIdent(tokens);
      structure = maybeConsumeStructure(tokens);
      if (structure) {
        return structure.type = type, structure;
      } else {
        return {
          type: type
        };
      }
    } else {
      structure = maybeConsumeStructure(tokens);
      if (!structure) {
        throw new Error("Unexpected character: " + token);
      }
      return structure;
    }
  }
  function consumeTypes(tokens){
    var lookahead, types, typesSoFar, typeObj, type;
    if ('::' === peek(tokens)) {
      throw new Error("No comment before comment separator '::' found.");
    }
    lookahead = tokens[1];
    if (lookahead != null && lookahead === '::') {
      tokens.shift();
      tokens.shift();
    }
    types = [];
    typesSoFar = {};
    if ('Maybe' === peek(tokens)) {
      tokens.shift();
      types = [
        {
          type: 'Undefined'
        }, {
          type: 'Null'
        }
      ];
      typesSoFar = {
        Undefined: true,
        Null: true
      };
    }
    for (;;) {
      typeObj = consumeType(tokens), type = typeObj.type;
      if (!typesSoFar[type]) {
        types.push(typeObj);
      }
      typesSoFar[type] = true;
      if (!maybeConsumeOp(tokens, '|')) {
        break;
      }
    }
    return types;
  }
  tokenRegex = RegExp('\\.\\.\\.|::|->|' + identifierRegex.source + '|\\S', 'g');
  module.exports = function(input){
    var tokens, e;
    if (!input.length) {
      throw new Error('No type specified.');
    }
    tokens = input.match(tokenRegex) || [];
    if (in$('->', tokens)) {
      throw new Error("Function types are not supported.\ To validate that something is a function, you may use 'Function'.");
    }
    try {
      return consumeTypes(tokens);
    } catch (e$) {
      e = e$;
      throw new Error(e.message + " - Remaining tokens: " + JSON.stringify(tokens) + " - Initial input: '" + input + "'");
    }
  };
  function in$(x, xs){
    var i = -1, l = xs.length >>> 0;
    while (++i < l) if (x === xs[i]) return true;
    return false;
  }
}).call(this);

},{}],146:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var ref$, id, find, sort, min, max, map, unlines, nameToRaw, dasherize, naturalJoin, wordwrap, getPreText, setHelpStyleDefaults, generateHelpForOption, generateHelp;
  ref$ = require('prelude-ls'), id = ref$.id, find = ref$.find, sort = ref$.sort, min = ref$.min, max = ref$.max, map = ref$.map, unlines = ref$.unlines;
  ref$ = require('./util'), nameToRaw = ref$.nameToRaw, dasherize = ref$.dasherize, naturalJoin = ref$.naturalJoin;
  wordwrap = require('wordwrap');
  getPreText = function(option, arg$, maxWidth){
    var mainName, shortNames, ref$, longNames, type, description, aliasSeparator, typeSeparator, initialIndent, names, namesString, namesStringLen, typeSeparatorString, typeSeparatorStringLen, wrap;
    mainName = option.option, shortNames = (ref$ = option.shortNames) != null
      ? ref$
      : [], longNames = (ref$ = option.longNames) != null
      ? ref$
      : [], type = option.type, description = option.description;
    aliasSeparator = arg$.aliasSeparator, typeSeparator = arg$.typeSeparator, initialIndent = arg$.initialIndent;
    if (option.negateName) {
      mainName = "no-" + mainName;
      if (longNames) {
        longNames = map(function(it){
          return "no-" + it;
        }, longNames);
      }
    }
    names = mainName.length === 1
      ? [mainName].concat(shortNames, longNames)
      : shortNames.concat([mainName], longNames);
    namesString = map(nameToRaw, names).join(aliasSeparator);
    namesStringLen = namesString.length;
    typeSeparatorString = mainName === 'NUM' ? '::' : typeSeparator;
    typeSeparatorStringLen = typeSeparatorString.length;
    if (maxWidth != null && !option.boolean && initialIndent + namesStringLen + typeSeparatorStringLen + type.length > maxWidth) {
      wrap = wordwrap(initialIndent + namesStringLen + typeSeparatorStringLen, maxWidth);
      return namesString + "" + typeSeparatorString + wrap(type).replace(/^\s+/, '');
    } else {
      return namesString + "" + (option.boolean
        ? ''
        : typeSeparatorString + "" + type);
    }
  };
  setHelpStyleDefaults = function(helpStyle){
    helpStyle.aliasSeparator == null && (helpStyle.aliasSeparator = ', ');
    helpStyle.typeSeparator == null && (helpStyle.typeSeparator = ' ');
    helpStyle.descriptionSeparator == null && (helpStyle.descriptionSeparator = '  ');
    helpStyle.initialIndent == null && (helpStyle.initialIndent = 2);
    helpStyle.secondaryIndent == null && (helpStyle.secondaryIndent = 4);
    helpStyle.maxPadFactor == null && (helpStyle.maxPadFactor = 1.5);
  };
  generateHelpForOption = function(getOption, arg$){
    var stdout, helpStyle, ref$;
    stdout = arg$.stdout, helpStyle = (ref$ = arg$.helpStyle) != null
      ? ref$
      : {};
    setHelpStyleDefaults(helpStyle);
    return function(optionName){
      var maxWidth, wrap, option, e, pre, defaultString, restPositionalString, description, fullDescription, that, preDescription, descriptionString, exampleString, examples, seperator;
      maxWidth = stdout != null && stdout.isTTY ? stdout.columns - 1 : null;
      wrap = maxWidth ? wordwrap(maxWidth) : id;
      try {
        option = getOption(dasherize(optionName));
      } catch (e$) {
        e = e$;
        return e.message;
      }
      pre = getPreText(option, helpStyle);
      defaultString = option['default'] && !option.negateName ? "\ndefault: " + option['default'] : '';
      restPositionalString = option.restPositional ? 'Everything after this option is considered a positional argument, even if it looks like an option.' : '';
      description = option.longDescription || option.description && sentencize(option.description);
      fullDescription = description && restPositionalString
        ? description + " " + restPositionalString
        : (that = description || restPositionalString) ? that : '';
      preDescription = 'description:';
      descriptionString = !fullDescription
        ? ''
        : maxWidth && fullDescription.length - 1 - preDescription.length > maxWidth
          ? "\n" + preDescription + "\n" + wrap(fullDescription)
          : "\n" + preDescription + " " + fullDescription;
      exampleString = (that = option.example) ? (examples = [].concat(that), examples.length > 1
        ? "\nexamples:\n" + unlines(examples)
        : "\nexample: " + examples[0]) : '';
      seperator = defaultString || descriptionString || exampleString ? "\n" + repeatString$('=', pre.length) : '';
      return pre + "" + seperator + defaultString + descriptionString + exampleString;
    };
  };
  generateHelp = function(arg$){
    var options, prepend, append, helpStyle, ref$, stdout, aliasSeparator, typeSeparator, descriptionSeparator, maxPadFactor, initialIndent, secondaryIndent;
    options = arg$.options, prepend = arg$.prepend, append = arg$.append, helpStyle = (ref$ = arg$.helpStyle) != null
      ? ref$
      : {}, stdout = arg$.stdout;
    setHelpStyleDefaults(helpStyle);
    aliasSeparator = helpStyle.aliasSeparator, typeSeparator = helpStyle.typeSeparator, descriptionSeparator = helpStyle.descriptionSeparator, maxPadFactor = helpStyle.maxPadFactor, initialIndent = helpStyle.initialIndent, secondaryIndent = helpStyle.secondaryIndent;
    return function(arg$){
      var ref$, showHidden, interpolate, maxWidth, output, out, data, optionCount, totalPreLen, preLens, i$, len$, item, that, pre, descParts, desc, preLen, sortedPreLens, maxPreLen, preLenMean, x, padAmount, descSepLen, fullWrapCount, partialWrapCount, descLen, totalLen, initialSpace, wrapAllFull, i, wrap;
      ref$ = arg$ != null
        ? arg$
        : {}, showHidden = ref$.showHidden, interpolate = ref$.interpolate;
      maxWidth = stdout != null && stdout.isTTY ? stdout.columns - 1 : null;
      output = [];
      out = function(it){
        return output.push(it != null ? it : '');
      };
      if (prepend) {
        out(interpolate ? interp(prepend, interpolate) : prepend);
        out();
      }
      data = [];
      optionCount = 0;
      totalPreLen = 0;
      preLens = [];
      for (i$ = 0, len$ = (ref$ = options).length; i$ < len$; ++i$) {
        item = ref$[i$];
        if (showHidden || !item.hidden) {
          if (that = item.heading) {
            data.push({
              type: 'heading',
              value: that
            });
          } else {
            pre = getPreText(item, helpStyle, maxWidth);
            descParts = [];
            if ((that = item.description) != null) {
              descParts.push(that);
            }
            if (that = item['enum']) {
              descParts.push("either: " + naturalJoin(that));
            }
            if (item['default'] && !item.negateName) {
              descParts.push("default: " + item['default']);
            }
            desc = descParts.join(' - ');
            data.push({
              type: 'option',
              pre: pre,
              desc: desc,
              descLen: desc.length
            });
            preLen = pre.length;
            optionCount++;
            totalPreLen += preLen;
            preLens.push(preLen);
          }
        }
      }
      sortedPreLens = sort(preLens);
      maxPreLen = sortedPreLens[sortedPreLens.length - 1];
      preLenMean = initialIndent + totalPreLen / optionCount;
      x = optionCount > 2 ? min(preLenMean * maxPadFactor, maxPreLen) : maxPreLen;
      for (i$ = sortedPreLens.length - 1; i$ >= 0; --i$) {
        preLen = sortedPreLens[i$];
        if (preLen <= x) {
          padAmount = preLen;
          break;
        }
      }
      descSepLen = descriptionSeparator.length;
      if (maxWidth != null) {
        fullWrapCount = 0;
        partialWrapCount = 0;
        for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
          item = data[i$];
          if (item.type === 'option') {
            pre = item.pre, desc = item.desc, descLen = item.descLen;
            if (descLen === 0) {
              item.wrap = 'none';
            } else {
              preLen = max(padAmount, pre.length) + initialIndent + descSepLen;
              totalLen = preLen + descLen;
              if (totalLen > maxWidth) {
                if (descLen / 2.5 > maxWidth - preLen) {
                  fullWrapCount++;
                  item.wrap = 'full';
                } else {
                  partialWrapCount++;
                  item.wrap = 'partial';
                }
              } else {
                item.wrap = 'none';
              }
            }
          }
        }
      }
      initialSpace = repeatString$(' ', initialIndent);
      wrapAllFull = optionCount > 1 && fullWrapCount + partialWrapCount * 0.5 > optionCount * 0.5;
      for (i$ = 0, len$ = data.length; i$ < len$; ++i$) {
        i = i$;
        item = data[i$];
        if (item.type === 'heading') {
          if (i !== 0) {
            out();
          }
          out(item.value + ":");
        } else {
          pre = item.pre, desc = item.desc, descLen = item.descLen, wrap = item.wrap;
          if (maxWidth != null) {
            if (wrapAllFull || wrap === 'full') {
              wrap = wordwrap(initialIndent + secondaryIndent, maxWidth);
              out(initialSpace + "" + pre + "\n" + wrap(desc));
              continue;
            } else if (wrap === 'partial') {
              wrap = wordwrap(initialIndent + descSepLen + max(padAmount, pre.length), maxWidth);
              out(initialSpace + "" + pad(pre, padAmount) + descriptionSeparator + wrap(desc).replace(/^\s+/, ''));
              continue;
            }
          }
          if (descLen === 0) {
            out(initialSpace + "" + pre);
          } else {
            out(initialSpace + "" + pad(pre, padAmount) + descriptionSeparator + desc);
          }
        }
      }
      if (append) {
        out();
        out(interpolate ? interp(append, interpolate) : append);
      }
      return unlines(output);
    };
  };
  function pad(str, num){
    var len, padAmount;
    len = str.length;
    padAmount = num - len;
    return str + "" + repeatString$(' ', padAmount > 0 ? padAmount : 0);
  }
  function sentencize(str){
    var first, rest, period;
    first = str.charAt(0).toUpperCase();
    rest = str.slice(1);
    period = /[\.!\?]$/.test(str) ? '' : '.';
    return first + "" + rest + period;
  }
  function interp(string, object){
    return string.replace(/{{([a-zA-Z$_][a-zA-Z$_0-9]*)}}/g, function(arg$, key){
      var ref$;
      return (ref$ = object[key]) != null
        ? ref$
        : "{{" + key + "}}";
    });
  }
  module.exports = {
    generateHelp: generateHelp,
    generateHelpForOption: generateHelpForOption
  };
  function repeatString$(str, n){
    for (var r = ''; n > 0; (n >>= 1) && (str += str)) if (n & 1) r += str;
    return r;
  }
}).call(this);

},{"./util":148,"prelude-ls":160,"wordwrap":154}],147:[function(require,module,exports){
(function (process){
// Generated by LiveScript 1.4.0
(function(){
  var VERSION, ref$, id, map, compact, any, groupBy, partition, chars, isItNaN, keys, Obj, camelize, deepIs, closestString, nameToRaw, dasherize, naturalJoin, generateHelp, generateHelpForOption, parsedTypeCheck, parseType, parseLevn, camelizeKeys, parseString, main, toString$ = {}.toString, slice$ = [].slice;
  VERSION = '0.8.1';
  ref$ = require('prelude-ls'), id = ref$.id, map = ref$.map, compact = ref$.compact, any = ref$.any, groupBy = ref$.groupBy, partition = ref$.partition, chars = ref$.chars, isItNaN = ref$.isItNaN, keys = ref$.keys, Obj = ref$.Obj, camelize = ref$.camelize;
  deepIs = require('deep-is');
  ref$ = require('./util'), closestString = ref$.closestString, nameToRaw = ref$.nameToRaw, dasherize = ref$.dasherize, naturalJoin = ref$.naturalJoin;
  ref$ = require('./help'), generateHelp = ref$.generateHelp, generateHelpForOption = ref$.generateHelpForOption;
  ref$ = require('type-check'), parsedTypeCheck = ref$.parsedTypeCheck, parseType = ref$.parseType;
  parseLevn = require('levn').parsedTypeParse;
  camelizeKeys = function(obj){
    var key, value, resultObj$ = {};
    for (key in obj) {
      value = obj[key];
      resultObj$[camelize(key)] = value;
    }
    return resultObj$;
  };
  parseString = function(string){
    var assignOpt, regex, replaceRegex, result;
    assignOpt = '--?[a-zA-Z][-a-z-A-Z0-9]*=';
    regex = RegExp('(?:' + assignOpt + ')?(?:\'(?:\\\\\'|[^\'])+\'|"(?:\\\\"|[^"])+")|[^\'"\\s]+', 'g');
    replaceRegex = RegExp('^(' + assignOpt + ')?[\'"]([\\s\\S]*)[\'"]$');
    result = map(function(it){
      return it.replace(replaceRegex, '$1$2');
    }, string.match(regex) || []);
    return result;
  };
  main = function(libOptions){
    var opts, defaults, required, traverse, getOption, parse;
    opts = {};
    defaults = {};
    required = [];
    if (toString$.call(libOptions.stdout).slice(8, -1) === 'Undefined') {
      libOptions.stdout = process.stdout;
    }
    libOptions.positionalAnywhere == null && (libOptions.positionalAnywhere = true);
    libOptions.typeAliases == null && (libOptions.typeAliases = {});
    libOptions.defaults == null && (libOptions.defaults = {});
    if (libOptions.concatRepeatedArrays != null) {
      libOptions.defaults.concatRepeatedArrays = libOptions.concatRepeatedArrays;
    }
    if (libOptions.mergeRepeatedObjects != null) {
      libOptions.defaults.mergeRepeatedObjects = libOptions.mergeRepeatedObjects;
    }
    traverse = function(options){
      var i$, len$, option, name, k, ref$, v, type, that, e, parsedPossibilities, parsedType, j$, len1$, possibility, rawDependsType, dependsOpts, dependsType, cra, alias, shortNames, longNames;
      if (toString$.call(options).slice(8, -1) !== 'Array') {
        throw new Error('No options defined.');
      }
      for (i$ = 0, len$ = options.length; i$ < len$; ++i$) {
        option = options[i$];
        if (option.heading == null) {
          name = option.option;
          if (opts[name] != null) {
            throw new Error("Option '" + name + "' already defined.");
          }
          for (k in ref$ = libOptions.defaults) {
            v = ref$[k];
            option[k] == null && (option[k] = v);
          }
          if (option.type === 'Boolean') {
            option.boolean == null && (option.boolean = true);
          }
          if (option.parsedType == null) {
            if (!option.type) {
              throw new Error("No type defined for option '" + name + "'.");
            }
            try {
              type = (that = libOptions.typeAliases[option.type]) != null
                ? that
                : option.type;
              option.parsedType = parseType(type);
            } catch (e$) {
              e = e$;
              throw new Error("Option '" + name + "': Error parsing type '" + option.type + "': " + e.message);
            }
          }
          if (option['default']) {
            try {
              defaults[name] = parseLevn(option.parsedType, option['default']);
            } catch (e$) {
              e = e$;
              throw new Error("Option '" + name + "': Error parsing default value '" + option['default'] + "' for type '" + option.type + "': " + e.message);
            }
          }
          if (option['enum'] && !option.parsedPossiblities) {
            parsedPossibilities = [];
            parsedType = option.parsedType;
            for (j$ = 0, len1$ = (ref$ = option['enum']).length; j$ < len1$; ++j$) {
              possibility = ref$[j$];
              try {
                parsedPossibilities.push(parseLevn(parsedType, possibility));
              } catch (e$) {
                e = e$;
                throw new Error("Option '" + name + "': Error parsing enum value '" + possibility + "' for type '" + option.type + "': " + e.message);
              }
            }
            option.parsedPossibilities = parsedPossibilities;
          }
          if (that = option.dependsOn) {
            if (that.length) {
              ref$ = [].concat(option.dependsOn), rawDependsType = ref$[0], dependsOpts = slice$.call(ref$, 1);
              dependsType = rawDependsType.toLowerCase();
              if (dependsOpts.length) {
                if (dependsType === 'and' || dependsType === 'or') {
                  option.dependsOn = [dependsType].concat(slice$.call(dependsOpts));
                } else {
                  throw new Error("Option '" + name + "': If you have more than one dependency, you must specify either 'and' or 'or'");
                }
              } else {
                if ((ref$ = dependsType.toLowerCase()) === 'and' || ref$ === 'or') {
                  option.dependsOn = null;
                } else {
                  option.dependsOn = ['and', rawDependsType];
                }
              }
            } else {
              option.dependsOn = null;
            }
          }
          if (option.required) {
            required.push(name);
          }
          opts[name] = option;
          if (option.concatRepeatedArrays != null) {
            cra = option.concatRepeatedArrays;
            if ('Boolean' === toString$.call(cra).slice(8, -1)) {
              option.concatRepeatedArrays = [cra, {}];
            } else if (cra.length === 1) {
              option.concatRepeatedArrays = [cra[0], {}];
            } else if (cra.length !== 2) {
              throw new Error("Invalid setting for concatRepeatedArrays");
            }
          }
          if (option.alias || option.aliases) {
            if (name === 'NUM') {
              throw new Error("-NUM option can't have aliases.");
            }
            if (option.alias) {
              option.aliases == null && (option.aliases = [].concat(option.alias));
            }
            for (j$ = 0, len1$ = (ref$ = option.aliases).length; j$ < len1$; ++j$) {
              alias = ref$[j$];
              if (opts[alias] != null) {
                throw new Error("Option '" + alias + "' already defined.");
              }
              opts[alias] = option;
            }
            ref$ = partition(fn$, option.aliases), shortNames = ref$[0], longNames = ref$[1];
            option.shortNames == null && (option.shortNames = shortNames);
            option.longNames == null && (option.longNames = longNames);
          }
          if ((!option.aliases || option.shortNames.length === 0) && option.type === 'Boolean' && option['default'] === 'true') {
            option.negateName = true;
          }
        }
      }
      function fn$(it){
        return it.length === 1;
      }
    };
    traverse(libOptions.options);
    getOption = function(name){
      var opt, possiblyMeant;
      opt = opts[name];
      if (opt == null) {
        possiblyMeant = closestString(keys(opts), name);
        throw new Error("Invalid option '" + nameToRaw(name) + "'" + (possiblyMeant ? " - perhaps you meant '" + nameToRaw(possiblyMeant) + "'?" : '.'));
      }
      return opt;
    };
    parse = function(input, arg$){
      var slice, obj, positional, restPositional, overrideRequired, prop, setValue, setDefaults, checkRequired, mutuallyExclusiveError, checkMutuallyExclusive, checkDependency, checkDependencies, args, key, value, option, ref$, i$, len$, arg, that, result, short, argName, usingAssign, val, flags, len, j$, len1$, i, flag, opt, name, valPrime, negated, noedName;
      slice = (arg$ != null
        ? arg$
        : {}).slice;
      obj = {};
      positional = [];
      restPositional = false;
      overrideRequired = false;
      prop = null;
      setValue = function(name, value){
        var opt, val, cra, e, currentType;
        opt = getOption(name);
        if (opt.boolean) {
          val = value;
        } else {
          try {
            cra = opt.concatRepeatedArrays;
            if (cra != null && cra[0] && cra[1].oneValuePerFlag && opt.parsedType.length === 1 && opt.parsedType[0].structure === 'array') {
              val = [parseLevn(opt.parsedType[0].of, value)];
            } else {
              val = parseLevn(opt.parsedType, value);
            }
          } catch (e$) {
            e = e$;
            throw new Error("Invalid value for option '" + name + "' - expected type " + opt.type + ", received value: " + value + ".");
          }
          if (opt['enum'] && !any(function(it){
            return deepIs(it, val);
          }, opt.parsedPossibilities)) {
            throw new Error("Option " + name + ": '" + val + "' not one of " + naturalJoin(opt['enum']) + ".");
          }
        }
        currentType = toString$.call(obj[name]).slice(8, -1);
        if (obj[name] != null) {
          if (opt.concatRepeatedArrays != null && opt.concatRepeatedArrays[0] && currentType === 'Array') {
            obj[name] = obj[name].concat(val);
          } else if (opt.mergeRepeatedObjects && currentType === 'Object') {
            import$(obj[name], val);
          } else {
            obj[name] = val;
          }
        } else {
          obj[name] = val;
        }
        if (opt.restPositional) {
          restPositional = true;
        }
        if (opt.overrideRequired) {
          overrideRequired = true;
        }
      };
      setDefaults = function(){
        var name, ref$, value;
        for (name in ref$ = defaults) {
          value = ref$[name];
          if (obj[name] == null) {
            obj[name] = value;
          }
        }
      };
      checkRequired = function(){
        var i$, ref$, len$, name;
        if (overrideRequired) {
          return;
        }
        for (i$ = 0, len$ = (ref$ = required).length; i$ < len$; ++i$) {
          name = ref$[i$];
          if (!obj[name]) {
            throw new Error("Option " + nameToRaw(name) + " is required.");
          }
        }
      };
      mutuallyExclusiveError = function(first, second){
        throw new Error("The options " + nameToRaw(first) + " and " + nameToRaw(second) + " are mutually exclusive - you cannot use them at the same time.");
      };
      checkMutuallyExclusive = function(){
        var rules, i$, len$, rule, present, j$, len1$, element, k$, len2$, opt;
        rules = libOptions.mutuallyExclusive;
        if (!rules) {
          return;
        }
        for (i$ = 0, len$ = rules.length; i$ < len$; ++i$) {
          rule = rules[i$];
          present = null;
          for (j$ = 0, len1$ = rule.length; j$ < len1$; ++j$) {
            element = rule[j$];
            if (toString$.call(element).slice(8, -1) === 'Array') {
              for (k$ = 0, len2$ = element.length; k$ < len2$; ++k$) {
                opt = element[k$];
                if (opt in obj) {
                  if (present != null) {
                    mutuallyExclusiveError(present, opt);
                  } else {
                    present = opt;
                    break;
                  }
                }
              }
            } else {
              if (element in obj) {
                if (present != null) {
                  mutuallyExclusiveError(present, element);
                } else {
                  present = element;
                }
              }
            }
          }
        }
      };
      checkDependency = function(option){
        var dependsOn, type, targetOptionNames, i$, len$, targetOptionName, targetOption;
        dependsOn = option.dependsOn;
        if (!dependsOn || option.dependenciesMet) {
          return true;
        }
        type = dependsOn[0], targetOptionNames = slice$.call(dependsOn, 1);
        for (i$ = 0, len$ = targetOptionNames.length; i$ < len$; ++i$) {
          targetOptionName = targetOptionNames[i$];
          targetOption = obj[targetOptionName];
          if (targetOption && checkDependency(targetOption)) {
            if (type === 'or') {
              return true;
            }
          } else if (type === 'and') {
            throw new Error("The option '" + option.option + "' did not have its dependencies met.");
          }
        }
        if (type === 'and') {
          return true;
        } else {
          throw new Error("The option '" + option.option + "' did not meet any of its dependencies.");
        }
      };
      checkDependencies = function(){
        var name;
        for (name in obj) {
          checkDependency(opts[name]);
        }
      };
      switch (toString$.call(input).slice(8, -1)) {
      case 'String':
        args = parseString(input.slice(slice != null ? slice : 0));
        break;
      case 'Array':
        args = input.slice(slice != null ? slice : 2);
        break;
      case 'Object':
        obj = {};
        for (key in input) {
          value = input[key];
          if (key !== '_') {
            option = getOption(dasherize(key));
            if (parsedTypeCheck(option.parsedType, value)) {
              obj[option.option] = value;
            } else {
              throw new Error("Option '" + option.option + "': Invalid type for '" + value + "' - expected type '" + option.type + "'.");
            }
          }
        }
        checkMutuallyExclusive();
        checkDependencies();
        setDefaults();
        checkRequired();
        return ref$ = camelizeKeys(obj), ref$._ = input._ || [], ref$;
      default:
        throw new Error("Invalid argument to 'parse': " + input + ".");
      }
      for (i$ = 0, len$ = args.length; i$ < len$; ++i$) {
        arg = args[i$];
        if (arg === '--') {
          restPositional = true;
        } else if (restPositional) {
          positional.push(arg);
        } else {
          if (that = arg.match(/^(--?)([a-zA-Z][-a-zA-Z0-9]*)(=)?(.*)?$/)) {
            result = that;
            if (prop) {
              throw new Error("Value for '" + prop + "' of type '" + getOption(prop).type + "' required.");
            }
            short = result[1].length === 1;
            argName = result[2];
            usingAssign = result[3] != null;
            val = result[4];
            if (usingAssign && val == null) {
              throw new Error("No value for '" + argName + "' specified.");
            }
            if (short) {
              flags = chars(argName);
              len = flags.length;
              for (j$ = 0, len1$ = flags.length; j$ < len1$; ++j$) {
                i = j$;
                flag = flags[j$];
                opt = getOption(flag);
                name = opt.option;
                if (restPositional) {
                  positional.push(flag);
                } else if (i === len - 1) {
                  if (usingAssign) {
                    valPrime = opt.boolean ? parseLevn([{
                      type: 'Boolean'
                    }], val) : val;
                    setValue(name, valPrime);
                  } else if (opt.boolean) {
                    setValue(name, true);
                  } else {
                    prop = name;
                  }
                } else if (opt.boolean) {
                  setValue(name, true);
                } else {
                  throw new Error("Can't set argument '" + flag + "' when not last flag in a group of short flags.");
                }
              }
            } else {
              negated = false;
              if (that = argName.match(/^no-(.+)$/)) {
                negated = true;
                noedName = that[1];
                opt = getOption(noedName);
              } else {
                opt = getOption(argName);
              }
              name = opt.option;
              if (opt.boolean) {
                valPrime = usingAssign ? parseLevn([{
                  type: 'Boolean'
                }], val) : true;
                if (negated) {
                  setValue(name, !valPrime);
                } else {
                  setValue(name, valPrime);
                }
              } else {
                if (negated) {
                  throw new Error("Only use 'no-' prefix for Boolean options, not with '" + noedName + "'.");
                }
                if (usingAssign) {
                  setValue(name, val);
                } else {
                  prop = name;
                }
              }
            }
          } else if (that = arg.match(/^-([0-9]+(?:\.[0-9]+)?)$/)) {
            opt = opts.NUM;
            if (!opt) {
              throw new Error('No -NUM option defined.');
            }
            setValue(opt.option, that[1]);
          } else {
            if (prop) {
              setValue(prop, arg);
              prop = null;
            } else {
              positional.push(arg);
              if (!libOptions.positionalAnywhere) {
                restPositional = true;
              }
            }
          }
        }
      }
      checkMutuallyExclusive();
      checkDependencies();
      setDefaults();
      checkRequired();
      return ref$ = camelizeKeys(obj), ref$._ = positional, ref$;
    };
    return {
      parse: parse,
      parseArgv: function(it){
        return parse(it, {
          slice: 2
        });
      },
      generateHelp: generateHelp(libOptions),
      generateHelpForOption: generateHelpForOption(getOption, libOptions)
    };
  };
  main.VERSION = VERSION;
  module.exports = main;
  function import$(obj, src){
    var own = {}.hasOwnProperty;
    for (var key in src) if (own.call(src, key)) obj[key] = src[key];
    return obj;
  }
}).call(this);

}).call(this,require('_process'))
},{"./help":146,"./util":148,"_process":3,"deep-is":149,"levn":141,"prelude-ls":160,"type-check":152}],148:[function(require,module,exports){
// Generated by LiveScript 1.4.0
(function(){
  var prelude, map, sortBy, fl, closestString, nameToRaw, dasherize, naturalJoin;
  prelude = require('prelude-ls'), map = prelude.map, sortBy = prelude.sortBy;
  fl = require('fast-levenshtein');
  closestString = function(possibilities, input){
    var distances, ref$, string, distance;
    if (!possibilities.length) {
      return;
    }
    distances = map(function(it){
      var ref$, longer, shorter;
      ref$ = input.length > it.length
        ? [input, it]
        : [it, input], longer = ref$[0], shorter = ref$[1];
      return {
        string: it,
        distance: fl.get(longer, shorter)
      };
    })(
    possibilities);
    ref$ = sortBy(function(it){
      return it.distance;
    }, distances)[0], string = ref$.string, distance = ref$.distance;
    return string;
  };
  nameToRaw = function(name){
    if (name.length === 1 || name === 'NUM') {
      return "-" + name;
    } else {
      return "--" + name;
    }
  };
  dasherize = function(string){
    if (/^[A-Z]/.test(string)) {
      return string;
    } else {
      return prelude.dasherize(string);
    }
  };
  naturalJoin = function(array){
    if (array.length < 3) {
      return array.join(' or ');
    } else {
      return array.slice(0, -1).join(', ') + ", or " + array[array.length - 1];
    }
  };
  module.exports = {
    closestString: closestString,
    nameToRaw: nameToRaw,
    dasherize: dasherize,
    naturalJoin: naturalJoin
  };
}).call(this);

},{"fast-levenshtein":150,"prelude-ls":160}],149:[function(require,module,exports){
var pSlice = Array.prototype.slice;
var Object_keys = typeof Object.keys === 'function'
    ? Object.keys
    : function (obj) {
        var keys = [];
        for (var key in obj) keys.push(key);
        return keys;
    }
;

var deepEqual = module.exports = function (actual, expected) {
  // enforce Object.is +0 !== -0
  if (actual === 0 && expected === 0) {
    return areZerosEqual(actual, expected);

  // 7.1. All identical values are equivalent, as determined by ===.
  } else if (actual === expected) {
    return true;

  } else if (actual instanceof Date && expected instanceof Date) {
    return actual.getTime() === expected.getTime();

  } else if (isNumberNaN(actual)) {
    return isNumberNaN(expected);

  // 7.3. Other pairs that do not both pass typeof value == 'object',
  // equivalence is determined by ==.
  } else if (typeof actual != 'object' && typeof expected != 'object') {
    return actual == expected;

  // 7.4. For all other Object pairs, including Array objects, equivalence is
  // determined by having the same number of owned properties (as verified
  // with Object.prototype.hasOwnProperty.call), the same set of keys
  // (although not necessarily the same order), equivalent values for every
  // corresponding key, and an identical 'prototype' property. Note: this
  // accounts for both named and indexed properties on Arrays.
  } else {
    return objEquiv(actual, expected);
  }
};

function isUndefinedOrNull(value) {
  return value === null || value === undefined;
}

function isArguments(object) {
  return Object.prototype.toString.call(object) == '[object Arguments]';
}

function isNumberNaN(value) {
  // NaN === NaN -> false
  return typeof value == 'number' && value !== value;
}

function areZerosEqual(zeroA, zeroB) {
  // (1 / +0|0) -> Infinity, but (1 / -0) -> -Infinity and (Infinity !== -Infinity)
  return (1 / zeroA) === (1 / zeroB);
}

function objEquiv(a, b) {
  if (isUndefinedOrNull(a) || isUndefinedOrNull(b))
    return false;

  // an identical 'prototype' property.
  if (a.prototype !== b.prototype) return false;
  //~~~I've managed to break Object.keys through screwy arguments passing.
  //   Converting to array solves the problem.
  if (isArguments(a)) {
    if (!isArguments(b)) {
      return false;
    }
    a = pSlice.call(a);
    b = pSlice.call(b);
    return deepEqual(a, b);
  }
  try {
    var ka = Object_keys(a),
        kb = Object_keys(b),
        key, i;
  } catch (e) {//happens when one is a string literal and the other isn't
    return false;
  }
  // having the same number of owned properties (keys incorporates
  // hasOwnProperty)
  if (ka.length != kb.length)
    return false;
  //the same set of keys (although not necessarily the same order),
  ka.sort();
  kb.sort();
  //~~~cheap key test
  for (i = ka.length - 1; i >= 0; i--) {
    if (ka[i] != kb[i])
      return false;
  }
  //equivalent values for every corresponding key, and
  //~~~possibly expensive deep test
  for (i = ka.length - 1; i >= 0; i--) {
    key = ka[i];
    if (!deepEqual(a[key], b[key])) return false;
  }
  return true;
}

},{}],150:[function(require,module,exports){
(function() {
  'use strict';

  /**
   * Extend an Object with another Object's properties.
   *
   * The source objects are specified as additional arguments.
   *
   * @param dst Object the object to extend.
   *
   * @return Object the final object.
   */
  var _extend = function(dst) {
    var sources = Array.prototype.slice.call(arguments, 1);
    for (var i=0; i<sources.length; ++i) {
      var src = sources[i];
      for (var p in src) {
        if (src.hasOwnProperty(p)) dst[p] = src[p];
      }
    }
    return dst;
  };


  /**
   * Defer execution of given function.
   * @param  {Function} func
   */
  var _defer = function(func) {
    if (typeof setImmediate === 'function') {
      return setImmediate(func);
    } else {
      return setTimeout(func, 0);
    }
  };

  /**
   * Based on the algorithm at http://en.wikipedia.org/wiki/Levenshtein_distance.
   */
  var Levenshtein = {
    /**
     * Calculate levenshtein distance of the two strings.
     *
     * @param str1 String the first string.
     * @param str2 String the second string.
     * @return Integer the levenshtein distance (0 and above).
     */
    get: function(str1, str2) {
      // base cases
      if (str1 === str2) return 0;
      if (str1.length === 0) return str2.length;
      if (str2.length === 0) return str1.length;

      // two rows
      var prevRow  = new Array(str2.length + 1),
          curCol, nextCol, i, j, tmp;

      // initialise previous row
      for (i=0; i<prevRow.length; ++i) {
        prevRow[i] = i;
      }

      // calculate current row distance from previous row
      for (i=0; i<str1.length; ++i) {
        nextCol = i + 1;

        for (j=0; j<str2.length; ++j) {
          curCol = nextCol;

          // substution
          nextCol = prevRow[j] + ( (str1.charAt(i) === str2.charAt(j)) ? 0 : 1 );
          // insertion
          tmp = curCol + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }
          // deletion
          tmp = prevRow[j + 1] + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }

          // copy current col value into previous (in preparation for next iteration)
          prevRow[j] = curCol;
        }

        // copy last col value into previous (in preparation for next iteration)
        prevRow[j] = nextCol;
      }

      return nextCol;
    },

    /**
     * Asynchronously calculate levenshtein distance of the two strings.
     *
     * @param str1 String the first string.
     * @param str2 String the second string.
     * @param cb Function callback function with signature: function(Error err, int distance)
     * @param [options] Object additional options.
     * @param [options.progress] Function progress callback with signature: function(percentComplete)
     */
    getAsync: function(str1, str2, cb, options) {
      options = _extend({}, {
        progress: null
      }, options);

      // base cases
      if (str1 === str2) return cb(null, 0);
      if (str1.length === 0) return cb(null, str2.length);
      if (str2.length === 0) return cb(null, str1.length);

      // two rows
      var prevRow  = new Array(str2.length + 1),
          curCol, nextCol,
          i, j, tmp,
          startTime, currentTime;

      // initialise previous row
      for (i=0; i<prevRow.length; ++i) {
        prevRow[i] = i;
      }

      nextCol = 1;
      i = 0;
      j = -1;

      var __calculate = function() {
        // reset timer
        startTime = new Date().valueOf();
        currentTime = startTime;

        // keep going until one second has elapsed
        while (currentTime - startTime < 1000) {
          // reached end of current row?
          if (str2.length <= (++j)) {
            // copy current into previous (in preparation for next iteration)
            prevRow[j] = nextCol;

            // if already done all chars
            if (str1.length <= (++i)) {
              return cb(null, nextCol);
            }
            // else if we have more left to do
            else {
              nextCol = i + 1;
              j = 0;
            }
          }

          // calculation
          curCol = nextCol;

          // substution
          nextCol = prevRow[j] + ( (str1.charAt(i) === str2.charAt(j)) ? 0 : 1 );
          // insertion
          tmp = curCol + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }
          // deletion
          tmp = prevRow[j + 1] + 1;
          if (nextCol > tmp) {
            nextCol = tmp;
          }

          // copy current into previous (in preparation for next iteration)
          prevRow[j] = curCol;

          // get current time
          currentTime = new Date().valueOf();
        }

        // send a progress update?
        if (null !== options.progress) {
          try {
            options.progress.call(null, (i * 100.0/ str1.length));
          } catch (err) {
            return cb('Progress callback: ' + err.toString());
          }
        }

        // next iteration
        _defer(__calculate);
      };

      __calculate();
    }

  };

  // amd
  if (typeof define !== "undefined" && define !== null && define.amd) {
    define(function() {
      return Levenshtein;
    });
  }
  // commonjs
  else if (typeof module !== "undefined" && module !== null) {
    module.exports = Levenshtein;
  }
  // web worker
  else if (typeof self !== "undefined" && typeof self.postMessage === 'function' && typeof self.importScripts === 'function') {
    self.Levenshtein = Levenshtein;
  }
  // browser main thread
  else if (typeof window !== "undefined" && window !== null) {
    window.Levenshtein = Levenshtein;
  }
}());


},{}],151:[function(require,module,exports){
arguments[4][143][0].apply(exports,arguments)
},{"dup":143,"prelude-ls":160}],152:[function(require,module,exports){
arguments[4][144][0].apply(exports,arguments)
},{"./check":151,"./parse-type":153,"dup":144}],153:[function(require,module,exports){
arguments[4][145][0].apply(exports,arguments)
},{"dup":145}],154:[function(require,module,exports){
var wordwrap = module.exports = function (start, stop, params) {
    if (typeof start === 'object') {
        params = start;
        start = params.start;
        stop = params.stop;
    }
    
    if (typeof stop === 'object') {
        params = stop;
        start = start || params.start;
        stop = undefined;
    }
    
    if (!stop) {
        stop = start;
        start = 0;
    }
    
    if (!params) params = {};
    var mode = params.mode || 'soft';
    var re = mode === 'hard' ? /\b/ : /(\S+\s+)/;
    
    return function (text) {
        var chunks = text.toString()
            .split(re)
            .reduce(function (acc, x) {
                if (mode === 'hard') {
                    for (var i = 0; i < x.length; i += stop - start) {
                        acc.push(x.slice(i, i + stop - start));
                    }
                }
                else acc.push(x)
                return acc;
            }, [])
        ;
        
        return chunks.reduce(function (lines, rawChunk) {
            if (rawChunk === '') return lines;
            
            var chunk = rawChunk.replace(/\t/g, '    ');
            
            var i = lines.length - 1;
            if (lines[i].length + chunk.length > stop) {
                lines[i] = lines[i].replace(/\s+$/, '');
                
                chunk.split(/\n/).forEach(function (c) {
                    lines.push(
                        new Array(start + 1).join(' ')
                        + c.replace(/^\s+/, '')
                    );
                });
            }
            else if (chunk.match(/\n/)) {
                var xs = chunk.split(/\n/);
                lines[i] += xs.shift();
                xs.forEach(function (c) {
                    lines.push(
                        new Array(start + 1).join(' ')
                        + c.replace(/^\s+/, '')
                    );
                });
            }
            else {
                lines[i] += chunk;
            }
            
            return lines;
        }, [ new Array(start + 1).join(' ') ]).join('\n');
    };
};

wordwrap.soft = wordwrap;

wordwrap.hard = function (start, stop) {
    return wordwrap(start, stop, { mode : 'hard' });
};

},{}],155:[function(require,module,exports){
// Generated by LiveScript 1.4.0
var apply, curry, flip, fix, over, memoize, slice$ = [].slice, toString$ = {}.toString;
apply = curry$(function(f, list){
  return f.apply(null, list);
});
curry = function(f){
  return curry$(f);
};
flip = curry$(function(f, x, y){
  return f(y, x);
});
fix = function(f){
  return function(g){
    return function(){
      return f(g(g)).apply(null, arguments);
    };
  }(function(g){
    return function(){
      return f(g(g)).apply(null, arguments);
    };
  });
};
over = curry$(function(f, g, x, y){
  return f(g(x), g(y));
});
memoize = function(f){
  var memo;
  memo = {};
  return function(){
    var args, key, arg;
    args = slice$.call(arguments);
    key = (function(){
      var i$, ref$, len$, results$ = [];
      for (i$ = 0, len$ = (ref$ = args).length; i$ < len$; ++i$) {
        arg = ref$[i$];
        results$.push(arg + toString$.call(arg).slice(8, -1));
      }
      return results$;
    }()).join('');
    return memo[key] = key in memo
      ? memo[key]
      : f.apply(null, args);
  };
};
module.exports = {
  curry: curry,
  flip: flip,
  fix: fix,
  apply: apply,
  over: over,
  memoize: memoize
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],156:[function(require,module,exports){
// Generated by LiveScript 1.4.0
var each, map, compact, filter, reject, partition, find, head, first, tail, last, initial, empty, reverse, unique, uniqueBy, fold, foldl, fold1, foldl1, foldr, foldr1, unfoldr, concat, concatMap, flatten, difference, intersection, union, countBy, groupBy, andList, orList, any, all, sort, sortWith, sortBy, sum, product, mean, average, maximum, minimum, maximumBy, minimumBy, scan, scanl, scan1, scanl1, scanr, scanr1, slice, take, drop, splitAt, takeWhile, dropWhile, span, breakList, zip, zipWith, zipAll, zipAllWith, at, elemIndex, elemIndices, findIndex, findIndices, toString$ = {}.toString, slice$ = [].slice;
each = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    f(x);
  }
  return xs;
});
map = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    results$.push(f(x));
  }
  return results$;
});
compact = function(xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (x) {
      results$.push(x);
    }
  }
  return results$;
};
filter = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      results$.push(x);
    }
  }
  return results$;
});
reject = curry$(function(f, xs){
  var i$, len$, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!f(x)) {
      results$.push(x);
    }
  }
  return results$;
});
partition = curry$(function(f, xs){
  var passed, failed, i$, len$, x;
  passed = [];
  failed = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    (f(x) ? passed : failed).push(x);
  }
  return [passed, failed];
});
find = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      return x;
    }
  }
});
head = first = function(xs){
  return xs[0];
};
tail = function(xs){
  if (!xs.length) {
    return;
  }
  return xs.slice(1);
};
last = function(xs){
  return xs[xs.length - 1];
};
initial = function(xs){
  if (!xs.length) {
    return;
  }
  return xs.slice(0, -1);
};
empty = function(xs){
  return !xs.length;
};
reverse = function(xs){
  return xs.concat().reverse();
};
unique = function(xs){
  var result, i$, len$, x;
  result = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!in$(x, result)) {
      result.push(x);
    }
  }
  return result;
};
uniqueBy = curry$(function(f, xs){
  var seen, i$, len$, x, val, results$ = [];
  seen = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    val = f(x);
    if (in$(val, seen)) {
      continue;
    }
    seen.push(val);
    results$.push(x);
  }
  return results$;
});
fold = foldl = curry$(function(f, memo, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    memo = f(memo, x);
  }
  return memo;
});
fold1 = foldl1 = curry$(function(f, xs){
  return fold(f, xs[0], xs.slice(1));
});
foldr = curry$(function(f, memo, xs){
  var i$, x;
  for (i$ = xs.length - 1; i$ >= 0; --i$) {
    x = xs[i$];
    memo = f(x, memo);
  }
  return memo;
});
foldr1 = curry$(function(f, xs){
  return foldr(f, xs[xs.length - 1], xs.slice(0, -1));
});
unfoldr = curry$(function(f, b){
  var result, x, that;
  result = [];
  x = b;
  while ((that = f(x)) != null) {
    result.push(that[0]);
    x = that[1];
  }
  return result;
});
concat = function(xss){
  return [].concat.apply([], xss);
};
concatMap = curry$(function(f, xs){
  var x;
  return [].concat.apply([], (function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      results$.push(f(x));
    }
    return results$;
  }()));
});
flatten = function(xs){
  var x;
  return [].concat.apply([], (function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      if (toString$.call(x).slice(8, -1) === 'Array') {
        results$.push(flatten(x));
      } else {
        results$.push(x);
      }
    }
    return results$;
  }()));
};
difference = function(xs){
  var yss, results, i$, len$, x, j$, len1$, ys;
  yss = slice$.call(arguments, 1);
  results = [];
  outer: for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    for (j$ = 0, len1$ = yss.length; j$ < len1$; ++j$) {
      ys = yss[j$];
      if (in$(x, ys)) {
        continue outer;
      }
    }
    results.push(x);
  }
  return results;
};
intersection = function(xs){
  var yss, results, i$, len$, x, j$, len1$, ys;
  yss = slice$.call(arguments, 1);
  results = [];
  outer: for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    for (j$ = 0, len1$ = yss.length; j$ < len1$; ++j$) {
      ys = yss[j$];
      if (!in$(x, ys)) {
        continue outer;
      }
    }
    results.push(x);
  }
  return results;
};
union = function(){
  var xss, results, i$, len$, xs, j$, len1$, x;
  xss = slice$.call(arguments);
  results = [];
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    for (j$ = 0, len1$ = xs.length; j$ < len1$; ++j$) {
      x = xs[j$];
      if (!in$(x, results)) {
        results.push(x);
      }
    }
  }
  return results;
};
countBy = curry$(function(f, xs){
  var results, i$, len$, x, key;
  results = {};
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    key = f(x);
    if (key in results) {
      results[key] += 1;
    } else {
      results[key] = 1;
    }
  }
  return results;
});
groupBy = curry$(function(f, xs){
  var results, i$, len$, x, key;
  results = {};
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    key = f(x);
    if (key in results) {
      results[key].push(x);
    } else {
      results[key] = [x];
    }
  }
  return results;
});
andList = function(xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!x) {
      return false;
    }
  }
  return true;
};
orList = function(xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (x) {
      return true;
    }
  }
  return false;
};
any = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (f(x)) {
      return true;
    }
  }
  return false;
});
all = curry$(function(f, xs){
  var i$, len$, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    if (!f(x)) {
      return false;
    }
  }
  return true;
});
sort = function(xs){
  return xs.concat().sort(function(x, y){
    if (x > y) {
      return 1;
    } else if (x < y) {
      return -1;
    } else {
      return 0;
    }
  });
};
sortWith = curry$(function(f, xs){
  return xs.concat().sort(f);
});
sortBy = curry$(function(f, xs){
  return xs.concat().sort(function(x, y){
    if (f(x) > f(y)) {
      return 1;
    } else if (f(x) < f(y)) {
      return -1;
    } else {
      return 0;
    }
  });
});
sum = function(xs){
  var result, i$, len$, x;
  result = 0;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    result += x;
  }
  return result;
};
product = function(xs){
  var result, i$, len$, x;
  result = 1;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    result *= x;
  }
  return result;
};
mean = average = function(xs){
  var sum, i$, len$, x;
  sum = 0;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    x = xs[i$];
    sum += x;
  }
  return sum / xs.length;
};
maximum = function(xs){
  var max, i$, ref$, len$, x;
  max = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (x > max) {
      max = x;
    }
  }
  return max;
};
minimum = function(xs){
  var min, i$, ref$, len$, x;
  min = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (x < min) {
      min = x;
    }
  }
  return min;
};
maximumBy = curry$(function(f, xs){
  var max, i$, ref$, len$, x;
  max = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (f(x) > f(max)) {
      max = x;
    }
  }
  return max;
});
minimumBy = curry$(function(f, xs){
  var min, i$, ref$, len$, x;
  min = xs[0];
  for (i$ = 0, len$ = (ref$ = xs.slice(1)).length; i$ < len$; ++i$) {
    x = ref$[i$];
    if (f(x) < f(min)) {
      min = x;
    }
  }
  return min;
});
scan = scanl = curry$(function(f, memo, xs){
  var last, x;
  last = memo;
  return [memo].concat((function(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xs).length; i$ < len$; ++i$) {
      x = ref$[i$];
      results$.push(last = f(last, x));
    }
    return results$;
  }()));
});
scan1 = scanl1 = curry$(function(f, xs){
  if (!xs.length) {
    return;
  }
  return scan(f, xs[0], xs.slice(1));
});
scanr = curry$(function(f, memo, xs){
  xs = xs.concat().reverse();
  return scan(f, memo, xs).reverse();
});
scanr1 = curry$(function(f, xs){
  if (!xs.length) {
    return;
  }
  xs = xs.concat().reverse();
  return scan(f, xs[0], xs.slice(1)).reverse();
});
slice = curry$(function(x, y, xs){
  return xs.slice(x, y);
});
take = curry$(function(n, xs){
  if (n <= 0) {
    return xs.slice(0, 0);
  } else {
    return xs.slice(0, n);
  }
});
drop = curry$(function(n, xs){
  if (n <= 0) {
    return xs;
  } else {
    return xs.slice(n);
  }
});
splitAt = curry$(function(n, xs){
  return [take(n, xs), drop(n, xs)];
});
takeWhile = curry$(function(p, xs){
  var len, i;
  len = xs.length;
  if (!len) {
    return xs;
  }
  i = 0;
  while (i < len && p(xs[i])) {
    i += 1;
  }
  return xs.slice(0, i);
});
dropWhile = curry$(function(p, xs){
  var len, i;
  len = xs.length;
  if (!len) {
    return xs;
  }
  i = 0;
  while (i < len && p(xs[i])) {
    i += 1;
  }
  return xs.slice(i);
});
span = curry$(function(p, xs){
  return [takeWhile(p, xs), dropWhile(p, xs)];
});
breakList = curry$(function(p, xs){
  return span(compose$(p, not$), xs);
});
zip = curry$(function(xs, ys){
  var result, len, i$, len$, i, x;
  result = [];
  len = ys.length;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (i === len) {
      break;
    }
    result.push([x, ys[i]]);
  }
  return result;
});
zipWith = curry$(function(f, xs, ys){
  var result, len, i$, len$, i, x;
  result = [];
  len = ys.length;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (i === len) {
      break;
    }
    result.push(f(x, ys[i]));
  }
  return result;
});
zipAll = function(){
  var xss, minLength, i$, len$, xs, ref$, i, lresult$, j$, results$ = [];
  xss = slice$.call(arguments);
  minLength = undefined;
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    minLength <= (ref$ = xs.length) || (minLength = ref$);
  }
  for (i$ = 0; i$ < minLength; ++i$) {
    i = i$;
    lresult$ = [];
    for (j$ = 0, len$ = xss.length; j$ < len$; ++j$) {
      xs = xss[j$];
      lresult$.push(xs[i]);
    }
    results$.push(lresult$);
  }
  return results$;
};
zipAllWith = function(f){
  var xss, minLength, i$, len$, xs, ref$, i, results$ = [];
  xss = slice$.call(arguments, 1);
  minLength = undefined;
  for (i$ = 0, len$ = xss.length; i$ < len$; ++i$) {
    xs = xss[i$];
    minLength <= (ref$ = xs.length) || (minLength = ref$);
  }
  for (i$ = 0; i$ < minLength; ++i$) {
    i = i$;
    results$.push(f.apply(null, (fn$())));
  }
  return results$;
  function fn$(){
    var i$, ref$, len$, results$ = [];
    for (i$ = 0, len$ = (ref$ = xss).length; i$ < len$; ++i$) {
      xs = ref$[i$];
      results$.push(xs[i]);
    }
    return results$;
  }
};
at = curry$(function(n, xs){
  if (n < 0) {
    return xs[xs.length + n];
  } else {
    return xs[n];
  }
});
elemIndex = curry$(function(el, xs){
  var i$, len$, i, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (x === el) {
      return i;
    }
  }
});
elemIndices = curry$(function(el, xs){
  var i$, len$, i, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (x === el) {
      results$.push(i);
    }
  }
  return results$;
});
findIndex = curry$(function(f, xs){
  var i$, len$, i, x;
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (f(x)) {
      return i;
    }
  }
});
findIndices = curry$(function(f, xs){
  var i$, len$, i, x, results$ = [];
  for (i$ = 0, len$ = xs.length; i$ < len$; ++i$) {
    i = i$;
    x = xs[i$];
    if (f(x)) {
      results$.push(i);
    }
  }
  return results$;
});
module.exports = {
  each: each,
  map: map,
  filter: filter,
  compact: compact,
  reject: reject,
  partition: partition,
  find: find,
  head: head,
  first: first,
  tail: tail,
  last: last,
  initial: initial,
  empty: empty,
  reverse: reverse,
  difference: difference,
  intersection: intersection,
  union: union,
  countBy: countBy,
  groupBy: groupBy,
  fold: fold,
  fold1: fold1,
  foldl: foldl,
  foldl1: foldl1,
  foldr: foldr,
  foldr1: foldr1,
  unfoldr: unfoldr,
  andList: andList,
  orList: orList,
  any: any,
  all: all,
  unique: unique,
  uniqueBy: uniqueBy,
  sort: sort,
  sortWith: sortWith,
  sortBy: sortBy,
  sum: sum,
  product: product,
  mean: mean,
  average: average,
  concat: concat,
  concatMap: concatMap,
  flatten: flatten,
  maximum: maximum,
  minimum: minimum,
  maximumBy: maximumBy,
  minimumBy: minimumBy,
  scan: scan,
  scan1: scan1,
  scanl: scanl,
  scanl1: scanl1,
  scanr: scanr,
  scanr1: scanr1,
  slice: slice,
  take: take,
  drop: drop,
  splitAt: splitAt,
  takeWhile: takeWhile,
  dropWhile: dropWhile,
  span: span,
  breakList: breakList,
  zip: zip,
  zipWith: zipWith,
  zipAll: zipAll,
  zipAllWith: zipAllWith,
  at: at,
  elemIndex: elemIndex,
  elemIndices: elemIndices,
  findIndex: findIndex,
  findIndices: findIndices
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
function in$(x, xs){
  var i = -1, l = xs.length >>> 0;
  while (++i < l) if (x === xs[i]) return true;
  return false;
}
function compose$() {
  var functions = arguments;
  return function() {
    var i, result;
    result = functions[0].apply(this, arguments);
    for (i = 1; i < functions.length; ++i) {
      result = functions[i](result);
    }
    return result;
  };
}
function not$(x){ return !x; }
},{}],157:[function(require,module,exports){
// Generated by LiveScript 1.4.0
var max, min, negate, abs, signum, quot, rem, div, mod, recip, pi, tau, exp, sqrt, ln, pow, sin, tan, cos, asin, acos, atan, atan2, truncate, round, ceiling, floor, isItNaN, even, odd, gcd, lcm;
max = curry$(function(x$, y$){
  return x$ > y$ ? x$ : y$;
});
min = curry$(function(x$, y$){
  return x$ < y$ ? x$ : y$;
});
negate = function(x){
  return -x;
};
abs = Math.abs;
signum = function(x){
  if (x < 0) {
    return -1;
  } else if (x > 0) {
    return 1;
  } else {
    return 0;
  }
};
quot = curry$(function(x, y){
  return ~~(x / y);
});
rem = curry$(function(x$, y$){
  return x$ % y$;
});
div = curry$(function(x, y){
  return Math.floor(x / y);
});
mod = curry$(function(x$, y$){
  var ref$;
  return (((x$) % (ref$ = y$) + ref$) % ref$);
});
recip = (function(it){
  return 1 / it;
});
pi = Math.PI;
tau = pi * 2;
exp = Math.exp;
sqrt = Math.sqrt;
ln = Math.log;
pow = curry$(function(x$, y$){
  return Math.pow(x$, y$);
});
sin = Math.sin;
tan = Math.tan;
cos = Math.cos;
asin = Math.asin;
acos = Math.acos;
atan = Math.atan;
atan2 = curry$(function(x, y){
  return Math.atan2(x, y);
});
truncate = function(x){
  return ~~x;
};
round = Math.round;
ceiling = Math.ceil;
floor = Math.floor;
isItNaN = function(x){
  return x !== x;
};
even = function(x){
  return x % 2 === 0;
};
odd = function(x){
  return x % 2 !== 0;
};
gcd = curry$(function(x, y){
  var z;
  x = Math.abs(x);
  y = Math.abs(y);
  while (y !== 0) {
    z = x % y;
    x = y;
    y = z;
  }
  return x;
});
lcm = curry$(function(x, y){
  return Math.abs(Math.floor(x / gcd(x, y) * y));
});
module.exports = {
  max: max,
  min: min,
  negate: negate,
  abs: abs,
  signum: signum,
  quot: quot,
  rem: rem,
  div: div,
  mod: mod,
  recip: recip,
  pi: pi,
  tau: tau,
  exp: exp,
  sqrt: sqrt,
  ln: ln,
  pow: pow,
  sin: sin,
  tan: tan,
  cos: cos,
  acos: acos,
  asin: asin,
  atan: atan,
  atan2: atan2,
  truncate: truncate,
  round: round,
  ceiling: ceiling,
  floor: floor,
  isItNaN: isItNaN,
  even: even,
  odd: odd,
  gcd: gcd,
  lcm: lcm
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],158:[function(require,module,exports){
// Generated by LiveScript 1.4.0
var values, keys, pairsToObj, objToPairs, listsToObj, objToLists, empty, each, map, compact, filter, reject, partition, find;
values = function(object){
  var i$, x, results$ = [];
  for (i$ in object) {
    x = object[i$];
    results$.push(x);
  }
  return results$;
};
keys = function(object){
  var x, results$ = [];
  for (x in object) {
    results$.push(x);
  }
  return results$;
};
pairsToObj = function(object){
  var i$, len$, x, resultObj$ = {};
  for (i$ = 0, len$ = object.length; i$ < len$; ++i$) {
    x = object[i$];
    resultObj$[x[0]] = x[1];
  }
  return resultObj$;
};
objToPairs = function(object){
  var key, value, results$ = [];
  for (key in object) {
    value = object[key];
    results$.push([key, value]);
  }
  return results$;
};
listsToObj = curry$(function(keys, values){
  var i$, len$, i, key, resultObj$ = {};
  for (i$ = 0, len$ = keys.length; i$ < len$; ++i$) {
    i = i$;
    key = keys[i$];
    resultObj$[key] = values[i];
  }
  return resultObj$;
});
objToLists = function(object){
  var keys, values, key, value;
  keys = [];
  values = [];
  for (key in object) {
    value = object[key];
    keys.push(key);
    values.push(value);
  }
  return [keys, values];
};
empty = function(object){
  var x;
  for (x in object) {
    return false;
  }
  return true;
};
each = curry$(function(f, object){
  var i$, x;
  for (i$ in object) {
    x = object[i$];
    f(x);
  }
  return object;
});
map = curry$(function(f, object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    resultObj$[k] = f(x);
  }
  return resultObj$;
});
compact = function(object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    if (x) {
      resultObj$[k] = x;
    }
  }
  return resultObj$;
};
filter = curry$(function(f, object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    if (f(x)) {
      resultObj$[k] = x;
    }
  }
  return resultObj$;
});
reject = curry$(function(f, object){
  var k, x, resultObj$ = {};
  for (k in object) {
    x = object[k];
    if (!f(x)) {
      resultObj$[k] = x;
    }
  }
  return resultObj$;
});
partition = curry$(function(f, object){
  var passed, failed, k, x;
  passed = {};
  failed = {};
  for (k in object) {
    x = object[k];
    (f(x) ? passed : failed)[k] = x;
  }
  return [passed, failed];
});
find = curry$(function(f, object){
  var i$, x;
  for (i$ in object) {
    x = object[i$];
    if (f(x)) {
      return x;
    }
  }
});
module.exports = {
  values: values,
  keys: keys,
  pairsToObj: pairsToObj,
  objToPairs: objToPairs,
  listsToObj: listsToObj,
  objToLists: objToLists,
  empty: empty,
  each: each,
  map: map,
  filter: filter,
  compact: compact,
  reject: reject,
  partition: partition,
  find: find
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],159:[function(require,module,exports){
// Generated by LiveScript 1.4.0
var split, join, lines, unlines, words, unwords, chars, unchars, reverse, repeat, capitalize, camelize, dasherize;
split = curry$(function(sep, str){
  return str.split(sep);
});
join = curry$(function(sep, xs){
  return xs.join(sep);
});
lines = function(str){
  if (!str.length) {
    return [];
  }
  return str.split('\n');
};
unlines = function(it){
  return it.join('\n');
};
words = function(str){
  if (!str.length) {
    return [];
  }
  return str.split(/[ ]+/);
};
unwords = function(it){
  return it.join(' ');
};
chars = function(it){
  return it.split('');
};
unchars = function(it){
  return it.join('');
};
reverse = function(str){
  return str.split('').reverse().join('');
};
repeat = curry$(function(n, str){
  var result, i$;
  result = '';
  for (i$ = 0; i$ < n; ++i$) {
    result += str;
  }
  return result;
});
capitalize = function(str){
  return str.charAt(0).toUpperCase() + str.slice(1);
};
camelize = function(it){
  return it.replace(/[-_]+(.)?/g, function(arg$, c){
    return (c != null ? c : '').toUpperCase();
  });
};
dasherize = function(str){
  return str.replace(/([^-A-Z])([A-Z]+)/g, function(arg$, lower, upper){
    return lower + "-" + (upper.length > 1
      ? upper
      : upper.toLowerCase());
  }).replace(/^([A-Z]+)/, function(arg$, upper){
    if (upper.length > 1) {
      return upper + "-";
    } else {
      return upper.toLowerCase();
    }
  });
};
module.exports = {
  split: split,
  join: join,
  lines: lines,
  unlines: unlines,
  words: words,
  unwords: unwords,
  chars: chars,
  unchars: unchars,
  reverse: reverse,
  repeat: repeat,
  capitalize: capitalize,
  camelize: camelize,
  dasherize: dasherize
};
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{}],160:[function(require,module,exports){
// Generated by LiveScript 1.4.0
var Func, List, Obj, Str, Num, id, isType, replicate, prelude, toString$ = {}.toString;
Func = require('./Func.js');
List = require('./List.js');
Obj = require('./Obj.js');
Str = require('./Str.js');
Num = require('./Num.js');
id = function(x){
  return x;
};
isType = curry$(function(type, x){
  return toString$.call(x).slice(8, -1) === type;
});
replicate = curry$(function(n, x){
  var i$, results$ = [];
  for (i$ = 0; i$ < n; ++i$) {
    results$.push(x);
  }
  return results$;
});
Str.empty = List.empty;
Str.slice = List.slice;
Str.take = List.take;
Str.drop = List.drop;
Str.splitAt = List.splitAt;
Str.takeWhile = List.takeWhile;
Str.dropWhile = List.dropWhile;
Str.span = List.span;
Str.breakStr = List.breakList;
prelude = {
  Func: Func,
  List: List,
  Obj: Obj,
  Str: Str,
  Num: Num,
  id: id,
  isType: isType,
  replicate: replicate
};
prelude.each = List.each;
prelude.map = List.map;
prelude.filter = List.filter;
prelude.compact = List.compact;
prelude.reject = List.reject;
prelude.partition = List.partition;
prelude.find = List.find;
prelude.head = List.head;
prelude.first = List.first;
prelude.tail = List.tail;
prelude.last = List.last;
prelude.initial = List.initial;
prelude.empty = List.empty;
prelude.reverse = List.reverse;
prelude.difference = List.difference;
prelude.intersection = List.intersection;
prelude.union = List.union;
prelude.countBy = List.countBy;
prelude.groupBy = List.groupBy;
prelude.fold = List.fold;
prelude.foldl = List.foldl;
prelude.fold1 = List.fold1;
prelude.foldl1 = List.foldl1;
prelude.foldr = List.foldr;
prelude.foldr1 = List.foldr1;
prelude.unfoldr = List.unfoldr;
prelude.andList = List.andList;
prelude.orList = List.orList;
prelude.any = List.any;
prelude.all = List.all;
prelude.unique = List.unique;
prelude.uniqueBy = List.uniqueBy;
prelude.sort = List.sort;
prelude.sortWith = List.sortWith;
prelude.sortBy = List.sortBy;
prelude.sum = List.sum;
prelude.product = List.product;
prelude.mean = List.mean;
prelude.average = List.average;
prelude.concat = List.concat;
prelude.concatMap = List.concatMap;
prelude.flatten = List.flatten;
prelude.maximum = List.maximum;
prelude.minimum = List.minimum;
prelude.maximumBy = List.maximumBy;
prelude.minimumBy = List.minimumBy;
prelude.scan = List.scan;
prelude.scanl = List.scanl;
prelude.scan1 = List.scan1;
prelude.scanl1 = List.scanl1;
prelude.scanr = List.scanr;
prelude.scanr1 = List.scanr1;
prelude.slice = List.slice;
prelude.take = List.take;
prelude.drop = List.drop;
prelude.splitAt = List.splitAt;
prelude.takeWhile = List.takeWhile;
prelude.dropWhile = List.dropWhile;
prelude.span = List.span;
prelude.breakList = List.breakList;
prelude.zip = List.zip;
prelude.zipWith = List.zipWith;
prelude.zipAll = List.zipAll;
prelude.zipAllWith = List.zipAllWith;
prelude.at = List.at;
prelude.elemIndex = List.elemIndex;
prelude.elemIndices = List.elemIndices;
prelude.findIndex = List.findIndex;
prelude.findIndices = List.findIndices;
prelude.apply = Func.apply;
prelude.curry = Func.curry;
prelude.flip = Func.flip;
prelude.fix = Func.fix;
prelude.over = Func.over;
prelude.split = Str.split;
prelude.join = Str.join;
prelude.lines = Str.lines;
prelude.unlines = Str.unlines;
prelude.words = Str.words;
prelude.unwords = Str.unwords;
prelude.chars = Str.chars;
prelude.unchars = Str.unchars;
prelude.repeat = Str.repeat;
prelude.capitalize = Str.capitalize;
prelude.camelize = Str.camelize;
prelude.dasherize = Str.dasherize;
prelude.values = Obj.values;
prelude.keys = Obj.keys;
prelude.pairsToObj = Obj.pairsToObj;
prelude.objToPairs = Obj.objToPairs;
prelude.listsToObj = Obj.listsToObj;
prelude.objToLists = Obj.objToLists;
prelude.max = Num.max;
prelude.min = Num.min;
prelude.negate = Num.negate;
prelude.abs = Num.abs;
prelude.signum = Num.signum;
prelude.quot = Num.quot;
prelude.rem = Num.rem;
prelude.div = Num.div;
prelude.mod = Num.mod;
prelude.recip = Num.recip;
prelude.pi = Num.pi;
prelude.tau = Num.tau;
prelude.exp = Num.exp;
prelude.sqrt = Num.sqrt;
prelude.ln = Num.ln;
prelude.pow = Num.pow;
prelude.sin = Num.sin;
prelude.tan = Num.tan;
prelude.cos = Num.cos;
prelude.acos = Num.acos;
prelude.asin = Num.asin;
prelude.atan = Num.atan;
prelude.atan2 = Num.atan2;
prelude.truncate = Num.truncate;
prelude.round = Num.round;
prelude.ceiling = Num.ceiling;
prelude.floor = Num.floor;
prelude.isItNaN = Num.isItNaN;
prelude.even = Num.even;
prelude.odd = Num.odd;
prelude.gcd = Num.gcd;
prelude.lcm = Num.lcm;
prelude.VERSION = '1.1.2';
module.exports = prelude;
function curry$(f, bound){
  var context,
  _curry = function(args) {
    return f.length > 1 ? function(){
      var params = args ? args.concat() : [];
      context = bound ? context || this : this;
      return params.push.apply(params, arguments) <
          f.length && arguments.length ?
        _curry.call(context, params) : f.apply(context, params);
    } : f;
  };
  return _curry();
}
},{"./Func.js":155,"./List.js":156,"./Num.js":157,"./Obj.js":158,"./Str.js":159}]},{},[6])(6)
});