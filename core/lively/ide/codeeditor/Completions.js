module('lively.ide.codeeditor.Completions').requires('lively.ide.codeeditor.ace').toRun(function() {

module('lively.ide');

(function setupCompletions() {
    if (UserAgent.isNodejs) return;

    var words = {};
    function wordsFromFiles(next) {
        Functions.forkInWorker(
            function(whenDone, options) {
                module('lively.lang.Closure').load();
                module('lively.ide.CommandLineInterface').load();
                function wordsFromFiles() {
                    var files = lively.ide.CommandLineSearch.findFiles('*js', {sync:true}),
                        livelyJSFiles = files.grep('core/'),
                        urls = livelyJSFiles.map(function(fn) { return URL.root.withFilename(fn).withRelativePartsResolved(); }),
                        splitRegex = /[^a-zA-Z_0-9\$\-]+/,
                        words = {}, parseTimes = {};
                    urls.forEach(function(url) {
                        var t1 = new Date(),
                            content = url.asWebResource().get().content,
                            wordsInFile = content.split(splitRegex);
                        wordsInFile.forEach(function(word) {
                            if (word.length === 0) return;
                            var first = word[0].toLowerCase();
                            if (!words[first]) words[first] = {};
                            if (!words[first][word]) words[first][word] = 0;
                            words[first][word]++;
                        });
                        parseTimes[url] = (new Date() - t1);
                    });
                    return words;
                }
                try { whenDone(null, wordsFromFiles()); } catch(e) { whenDone(e.stack, null); }
            }, {args: [], whenDone: function(err, result) { if (err) show(err); words = result; next(); }
        });
    }

    function installCompleter(next) {
        // 1) define completer
        lively.ide.WordCompleter = {wordsFromFiles: words};
        Object.extend(lively.ide.WordCompleter, {
            getCompletions: function(editor, session, pos, prefix, callback) {
                if (prefix.length === 0) { callback(null, []); return }
                var startLetter = prefix[0].toLowerCase(),
                    wordList = this.wordsFromFiles[startLetter], result = [];
                for (var word in wordList) {
                    if (word.lastIndexOf(prefix, 0) !== 0) continue;
                    result.push({
                        name: word,
                        value: word,
                        score: wordList[word],
                        meta: "lively"
                    });
                }
                callback(null, result);
            }
        });
        // 2) register completer
        var langTools = lively.ide.ace.require('ace/ext/language_tools');
        langTools.addCompleter(lively.ide.WordCompleter);
        next();
    }

    function done(next) { alertOK('Word completion installed!'); next(); }

    [wordsFromFiles, installCompleter, done].doAndContinue()
})();

}) // end of module