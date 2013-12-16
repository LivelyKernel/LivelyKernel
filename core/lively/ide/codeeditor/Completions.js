module('lively.ide.codeeditor.Completions').requires('lively.ide.CodeEditor').toRun(function() {

(function setupCompletions() {
    if (UserAgent.isNodejs) return;

    lively.whenLoaded(function(world) {
        var sources = Object.values(Global.livelySources),
            splitRegex = /[^a-zA-Z_0-9\$\-]+/,
            words = {};
        for (var i = -1; i < sources.length; i++) {
            var source = sources[i];
            if(!source)
                continue;
            var wordsInFile = source.split(splitRegex);
            wordsInFile.forEach(function(word) {
                if (word.length === 0) return;
                var first = word[0].toLowerCase(),
                    bucketForFirst = words[first];
                if (!bucketForFirst) {
                    bucketForFirst = words[first] = {};
                    bucketForFirst[word] = 1;
                } else
                    if(bucketForFirst[word])
                        bucketForFirst[word]++;
                    else
                        bucketForFirst[word] = 1;
            });
        }
    
        // 1) define completer
        lively.ide.WordCompleter = {wordsFromFiles: words};
        lively.ide.WordCompleter.getCompletions = function(editor, session, pos, prefix, callback) {
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
        // 2) register completer
        var langTools = lively.ide.ace.require('ace/ext/language_tools');
        langTools.addCompleter(lively.ide.WordCompleter);
		alertOK('Word completion installed!');
	});

})();

}) // end of module