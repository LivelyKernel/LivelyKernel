module('lively.ide.FileSystem').requires().toRun(function() {

Object.extend(lively.ide.FileSystem, {

    joinPaths: function(/*paths*/) {
        var paths = Array.from(arguments);
        return paths.reduce(append, paths.shift());
        function append(path1, path2) {
            path1 = path1 || '', path2 = path2 || '';
            if (!path1.endsWith('/')) path1 += '/';
            while (path2.startsWith('/')) path2 = path2.slice(1);
            return (path1 + path2).split('/').reduce(function(parts, focus) {
                if (focus == '..') parts.pop();
                else if (focus == '.') ;/*ignore*/
                else parts.push(focus);
                return parts;
            }, []).join('/');
        }
    },

    parseDirectoryListFromLs: function(string, rootDirectory) {
        // line like "-rw-r—r—       1 robert   staff       5298 Dec 17 14:04:02 2012 test.html"
        return Strings.lines(string).map(function(line) {
            if (!line.trim().length) return null;
            var fileInfo = new lively.ide.FileSystem.FileInfo(rootDirectory);
            return fileInfo.readFromDirectoryListLine(line) ? fileInfo : null;
        }).compact();
    },

    convertDirectoryUploadEntriesToFileInfos: function(entryTree) {
        var entries = flattenTree(entryTree);

        return entries.map(function(entry) {
            var path = entry.fullPath.replace(/^\//, '');
            return {
              fileName: path, path: path,
              rootDirectory: './',
              isDirectory: entry.isDirectory,
              isLink: undefined, lastModified: undefined, linkCount: undefined,
              mode: undefined, size: undefined, group: undefined, user: undefined
            }
        });

        // -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-

        function flattenTree(entryTree) {
            return Array.prototype.concat.apply(
                [entryTree],
                entryTree.children ? entryTree.children.map(flattenTree) : []);
        }
    },
});

Object.subclass("lively.ide.FileSystem.FileInfo",
// see lively.ide.FileSystem.parseDirectoryListFromLs
"properties", {
    path: '', fileName: '',
    isDirectory: false,
    lastModified: null, mode: '',
    isLink: false, linkCount: 0,
    user: '', group: '', size: 0,
    rootDirectory: null
},
"initializing", {
    initialize: function(rootDirectory) {
        this.rootDirectory = rootDirectory;
    }
},
'parsing from directory list', {
    reader: [ // the order is important!
        function mode(lineString, fileInfo) {
            var idx = lineString.indexOf(' ');
            fileInfo.mode = lineString.slice(0, idx);
            fileInfo.isDirectory = fileInfo.mode[0] === 'd';
            return lineString.slice(idx+1).trim();
        },
        function linkCount(lineString, fileInfo) {
            var idx = lineString.indexOf(' ');
            fileInfo.linkCount = Number(lineString.slice(0, idx));
            return lineString.slice(idx+1).trim();
        },
        function user(lineString, fileInfo) {
            var idx = lineString.indexOf(' ');
            fileInfo.user = lineString.slice(0, idx);
            return lineString.slice(idx+1).trim();
        },
        function group(lineString, fileInfo) {
            var idx = Strings.peekRight(lineString, 0, /\s+[0-9]/);
            fileInfo.group = lineString.slice(0, idx).trim();
            return lineString.slice(idx).trim();
        },
        function size(lineString, fileInfo) {
            var idx = lineString.indexOf(' ');
            fileInfo.size = Number(lineString.slice(0, idx));
            return lineString.slice(idx+1).trim();
        },
        function lastModified(lineString, fileInfo) {
            var matches = Strings.reMatches(lineString, /[^s]+\s+[0-9:\s]+/);
            if (!matches || !matches[0]) return lineString;
            fileInfo.lastModified = new Date(matches[0].match + ' GMT');
            return lineString.slice(matches[0].end).trim();
        },
        function fileName(lineString, fileInfo) {
            var string = lineString.replace(/^\.\/+/g, '').replace(/\/\//g, '/'),
                nameAndLink = string && string.split(' -> '),
                isLink = string === '' ? false : string && nameAndLink.length === 2,
                path = isLink ? nameAndLink[0] : string,
                fileName = path && path.indexOf(fileInfo.rootDirectory) === 0 ? path.slice(fileInfo.rootDirectory.length) : path;
            fileInfo.fileName = string === '' ? '.' : fileName;
            fileInfo.path = path;
            fileInfo.isLink = isLink;
            return fileName;
        }],

    readFromDirectoryListLine: function(line) {
        if (!line.trim().length) return false;
        var lineRest = line;
        this.reader.forEach(function(reader) {
            lineRest = reader(lineRest, this)
        }, this);
        return true;
    }
},
'printing', {
    toString: function() { return this.path; }
});

}) // end of module
