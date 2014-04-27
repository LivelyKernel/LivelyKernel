module('lively.ide.codeeditor.Completions').requires('lively.ide.codeeditor.ace', 'lively.Network').toRun(function() {

Object.extend(lively.ide.codeeditor.Completions, {

    setupCompletions: function(thenDo) {
        console.log('setup code completions');

        [wordsFromFiles, installCompleter, done].doAndContinue(null, thenDo);

        var words;
        function wordsFromFiles(next) {
            var ideSupportServer = URL.nodejsBase.withFilename('IDESupportServer/indexedLivelyWords')
                .asWebResource().beAsync();
            ideSupportServer.get().withJSONWhenDone(function(json, s) {
                var err = (json && json.error) || (!s.isSuccess() && s);
                if (err) {
                    console.error('Error in ide code completion preparation: %s', s);
                } else { words = json; next(); }
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
    }
});

(function setupCompletionsOnLoad() {
    if (UserAgent.isNodejs
     || UserAgent.isWorker
     || !lively.Config.get('computeCodeEditorCompletionsOnStartup'))
     return;

    lively.ide.codeeditor.Completions.setupCompletions();
})();

}) // end of module
