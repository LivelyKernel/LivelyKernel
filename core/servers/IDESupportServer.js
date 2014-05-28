var async = require("async");
var util = require("util");
var fs = require("fs");
var stream = require('stream');

function wordParser(options) {
    var splitRegex = /[^a-zA-Z_0-9\$\-]+/;

    function splitString(string) {
        return String(string).split(splitRegex)
            .filter(function(w) { return !!w.length });
    }

    var lastWordRe = /[^\s]+$/, startsWithSpaceRe = /^\s/, lastWord;
    function fixLastWordProblem(string) {
        var lastWordMatch = string.match(lastWordRe);
        if (lastWordMatch) string = string.slice(0, -lastWordMatch[0]);
        if (lastWord) string = lastWord + string;
        if (lastWordMatch) lastWord = lastWordMatch[0];
        return string;
    }

    var counter = new stream.Transform(options);

    counter._transform = function (chunk, enc, next) {
        var string = fixLastWordProblem(String(chunk)),
            words = splitString(chunk);
        words.forEach(function(word) { this.push(word) }, this);
        next();
    };

    counter._flush = function (next) { if (lastWord) this.push(lastWord); next(); };

    return counter;
}

function wordCounter(options) {
    // expects a stream of words and will on stream end return a data structure like
    // { "h": { "hello": 1 }, "t": { "this": 2, "test": 2 } }
    // counter stream won't end automatically (so it cna be passed around to
    // gether results). To end you can check isWaitingOnReadStream and attach
    // data/end handlers or when piped directly call counter.end()

    var counter = new stream.Transform(options),
        waitForStreams = [],
        words = {};

    function countIt(word) {
        var first = word[0].toLowerCase()
        if (!words[first]) words[first] = {};
        if (typeof words[first][word] !== 'number') words[first][word] = 0;
        words[first][word]++;
    }

    counter._transform = function (chunk, enc, next) {
        countIt(String(chunk));
        next();
    };

    counter._flush = function (next) {
        this.push(this.getWords());
        next();
    };

    counter.consume = function(readStream) {
        var pipeline = readStream.pipe(wordParser()).pipe(this, {end: false});
        waitForStreams.push(readStream);
        readStream.on('end', function() {
            waitForStreams = waitForStreams.filter(function(ea) {
                return ea !== readStream; });
        });
        return pipeline;
    }

    counter.isWaitingOnReadStream = function() { return !!waitForStreams.length; };

    counter.getWords = function() {
        return this._writableState.objectMode ?
            words: JSON.stringify(words);
    };

    return counter;
}

function countWordsInFiles(files, thenDo) {

    console.log('starting to extract words from %s files', files.length);

    var counter = wordCounter()
        .on('data', function() { /* just needed for end... */ })
        .on('end', function() { thenDo(null, counter.getWords()); })
        .on('error', function(err) { thenDo(err); });

    counter.setMaxListeners(files.length + 10);

    // on Mac OS you are only allowed to open a limited amount of files at the
    // same time so we have to use a queue here
    async.queue(function (fn, next) {
        var rs = fs.createReadStream(fn);
        rs.on('end', function() { next(); });
        counter.consume(rs);
    }, 15).push(files);

    var timeoutDelay = 60*1000, startTime = Date.now();
    setTimeout(function waitForReadStreams() {
        // clearTimeout(global.waiting);
        try {
        var timeout = Date.now() > startTime + timeoutDelay;
        if (counter.isWaitingOnReadStream() && !timeout) {
            console.log('waiting for countWordsInFiles');
            Global.waiting = setTimeout(waitForReadStreams, 200);
            return;
        }
        delete Global.waiting;
        if (timeout) {
            console.warn("timeout!");
            counter.emit('error', new Error('timeout waiting on read streams'));
        } else {
            counter.end();
        }
        } catch (e) { console.error(e); }
    }, 500);

}

// dirContent = fs.readdirSync(process.env.WORKSPACE_LK + '/core/lively/ide/tools')
// dirContent.filter(function(ea) { return /\.js$/.test(ea); })
function gatherWordsFromFilesRecursively(dir, thenDo) {
    // dir = process.env.WORKSPACE_LK
    async.waterfall([
        require('./DirectoryWatchServer').getWatchedFiles.bind(null, dir),
        function(watchedFiles, startTime, next) {
            function isFile(fn) { return !(watchedFiles[fn].mode & 0x4000); }
            try {
                next(null, Object.keys(watchedFiles)
                    // .filter(function(ea) { return ea.indexOf(path.join(dir, 'core/lively/')) === 0; })
                    .filter(isFile)
                    .filter(function(ea) { return /\.js$/.test(ea); }));
            } catch (e) { next(e); }
        },
        countWordsInFiles
    ], thenDo);
}

function getCachedGatherWordsFunction(dir, freshnessTimeout) {
    var lastGatherTime,
        cachedResult,
        gatherInProgress = false,
        gatherRequests = [];
    freshnessTimeout = freshnessTimeout || 1000 * 60 * 30;

    return function gatherWordsFromFilesRecursivelyCached(thenDo) {

        // 1. cache use
        if (cachedResult && lastGatherTime && lastGatherTime + freshnessTimeout > Date.now()) {
            console.log('using cache');
            thenDo(null, cachedResult);
            return;
        }

        console.log('not using cache');
        // 2. schedule callback
        gatherRequests.push(thenDo);

        // 3. gather in progress? wait
        if (gatherInProgress) return;
        gatherInProgress = true;

        gatherWordsFromFilesRecursively(dir, function(err, words) {
            gatherInProgress = false;
            lastGatherTime = Date.now();
            cachedResult = words;
            var cbs = gatherRequests.slice();
            gatherRequests = [];
            async.forEach(cbs, function(ea, next) { next(); ea(err, words); })
        });

    }

}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// tests

false && (function testWordCounter() {
    var pipeline = util._extend(new stream.Readable(), {
        _read: function(size) {
            this.push("hello world, this is a test\n   a test is this\n ohhh fun!\n");
            this.push(null);
        }
    }).pipe(wordParser()).pipe(wordCounter()), result;
    pipeline.on('data', function(d) { result = d; });
    pipeline.on('end', function(d) { console.dir(String(result)); });
})();

false && (function testMultipleFileCounts() {
    countWordsInFiles([process.env.WORKSPACE_LK + '/core/lively/Base.js'], function(err, words) {
        if (err) console.error(err);
        else console.log(words);
    });
})();

false && (function testWordsFromDir() {
    gatherWordsFromFilesRecursively(process.env.WORKSPACE_LK + '/core/lively/ide/tools', function(err, words) {
        if (err) console.error(err);
        else console.log(Numbers.humanReadableByteSize(JSON.stringify(words).length));
    });
})();

false && (function testWordsFromDir() {
    var func = getCachedGatherWordsFunction(process.env.WORKSPACE_LK + '/core/lively/ide/tools', 1000*10);

    async.series([
        function(next) {
            func(function(err, words) {
                if (err) console.error(err);
                else console.log('1. %s', Numbers.humanReadableByteSize(JSON.stringify(words).length));
                setTimeout(next, 1000*2);
            });
        },

        function(next) {
            func(function(err, words) {
                if (err) console.error(err);
                else console.log('2. %s', Numbers.humanReadableByteSize(JSON.stringify(words).length));
                setTimeout(next, 1000*10);
            });
        },

        function(next) {
            func(function(err, words) {
                if (err) console.error(err);
                else console.log('3. %s', Numbers.humanReadableByteSize(JSON.stringify(words).length));
                setTimeout(next, 1000*10);
            });
        }

    ], function() { console.log('done'); })

})();

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// http

module.exports = function(route, app) {

    var getIndexedLivelyWords = getCachedGatherWordsFunction(process.env.WORKSPACE_LK + '/core');

    app.get(route + 'indexedLivelyWords', function(req, res) {
        getIndexedLivelyWords(function(err, stringifiedWordIndex) {
            if (err) res.status(500).json({error: String(err)})
            else res.end(stringifiedWordIndex);
        });
    });
}

// -=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-=-
// exports

module.exports.getCachedGatherWordsFunction = getCachedGatherWordsFunction;
module.exports.gatherWordsFromFilesRecursively = gatherWordsFromFilesRecursively;
